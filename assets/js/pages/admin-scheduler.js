(function initAdminSchedulerController() {
    'use strict';

    const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const SLOT_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const SCHEDULER_START_MINUTES = 9 * 60;
    const SCHEDULER_FACULTY_OPTIONS = [
        ['ECON', 'Business Management'],
        ['CS', 'Computer Science'],
        ['LAW', 'Law'],
        ['MED', 'Medicine'],
        ['ARTS', 'Arts'],
        ['all', 'All Faculties']
    ];
    const SCHEDULER_SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, index) => {
        const value = String(index + 1);
        return [value, `Semester ${value}`];
    });
    const SCHEDULER_CREATE_MODAL_TEMPLATE_ID = 'sch-modal-template';
    const SCHEDULER_CREATE_MODAL_ID = 'schModalOverlay';
    const SCHEDULER_PRESET_MANAGER_TEMPLATE_ID = 'sch-preset-manager-template';
    const SCHEDULER_PRESET_MANAGER_ID = 'schPresetManagerOverlay';
    const SCHEDULER_QUIZ_MODAL_TEMPLATE_ID = 'prof-quiz-modal-template';
    const SCHEDULER_QUIZ_MODAL_ID = 'profQuizModalOverlay';
    const SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS = 120;
    const SCHEDULER_SESSION_PRESETS_KEY = 'kiuSchedulerSessionPresets';
    const SCHEDULER_DEFAULT_GROUP_PRESETS = ['G1', 'G2', 'G3', 'G4', 'L1', 'L2', 'Lab-1'];
    const SCHEDULER_DEFAULT_ROOM_PRESETS = ['A-101', 'A-102', 'A-201', 'B-201', 'B-202', 'C-301', 'C-303', 'K-201', 'LAB-1', 'LAB-2'];
    let selectedPaletteSubject = null;
    let schedulerInitialized = false;
    let profQuizQuestions = [];
    let schedulerPaletteSearchHandle = 0;
    let schedulerPresetSearchHandle = 0;
    let schedulerRefreshHandle = 0;
    let schedulerRefreshQueued = { palette: false, grid: false };

    function el(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const node = el(id);
        if (node) node.textContent = value;
    }

    function bindNodeOnce(node, eventName, marker, handler) {
        if (!node || node.dataset[marker]) return;
        node.dataset[marker] = '1';
        node.addEventListener(eventName, handler);
    }

    function queueSchedulerRefresh(options = {}) {
        schedulerRefreshQueued.palette = schedulerRefreshQueued.palette || options.palette === true;
        schedulerRefreshQueued.grid = schedulerRefreshQueued.grid || options.grid === true;
        if (schedulerRefreshHandle) return;
        const schedule = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (callback) => window.setTimeout(callback, 16);
        schedulerRefreshHandle = schedule(() => {
            schedulerRefreshHandle = 0;
            const runPalette = schedulerRefreshQueued.palette;
            const runGrid = schedulerRefreshQueued.grid;
            schedulerRefreshQueued = { palette: false, grid: false };
            if (runPalette) renderPalette();
            if (runGrid) renderGrid();
        });
    }

    function ensureMountedTemplate(templateId, nodeId) {
        let node = el(nodeId);
        if (node) return node;
        const template = el(templateId);
        if (!(template instanceof HTMLTemplateElement)) return null;
        document.body.appendChild(template.content.cloneNode(true));
        return el(nodeId);
    }

    function rebuildSchedulerSelect(select, options, fallbackValue) {
        if (!select) return;
        const currentValue = select.value || select.getAttribute('value') || fallbackValue;
        const fragment = document.createDocumentFragment();
        options.forEach(([value, label]) => fragment.appendChild(new Option(label, value)));
        select.replaceChildren(fragment);
        select.value = options.some(([value]) => value === currentValue) ? currentValue : fallbackValue;
        select.removeAttribute('size');
        select.size = 0;
        select.dataset.schedulerOptionsNormalized = '1';
    }

    function labelSchedulerSelect(selectId, label) {
        const select = el(selectId);
        if (!select) return;
        select.setAttribute('aria-label', label);
        select.dataset.luxPickerLabel = label;
    }

    function normalizeSchedulerPresetName(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function readSchedulerSessionPresets() {
        try {
            const raw = localStorage.getItem(SCHEDULER_SESSION_PRESETS_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return {
                groups: Array.isArray(parsed?.groups) ? parsed.groups.map(normalizeSchedulerPresetName).filter(Boolean) : [],
                rooms: Array.isArray(parsed?.rooms) ? parsed.rooms.map(normalizeSchedulerPresetName).filter(Boolean) : [],
                hiddenGroups: Array.isArray(parsed?.hiddenGroups) ? parsed.hiddenGroups.map(normalizeSchedulerPresetName).filter(Boolean) : [],
                hiddenRooms: Array.isArray(parsed?.hiddenRooms) ? parsed.hiddenRooms.map(normalizeSchedulerPresetName).filter(Boolean) : []
            };
        } catch (error) {
            return { groups: [], rooms: [], hiddenGroups: [], hiddenRooms: [] };
        }
    }

    function writeSchedulerSessionPresets(presets) {
        try {
            localStorage.setItem(SCHEDULER_SESSION_PRESETS_KEY, JSON.stringify({
                groups: Array.isArray(presets?.groups) ? presets.groups : [],
                rooms: Array.isArray(presets?.rooms) ? presets.rooms : [],
                hiddenGroups: Array.isArray(presets?.hiddenGroups) ? presets.hiddenGroups : [],
                hiddenRooms: Array.isArray(presets?.hiddenRooms) ? presets.hiddenRooms : []
            }));
        } catch (error) {
            /* ignore quota errors */
        }
    }

    function getSchedulerHiddenPresetKey(kind) {
        return kind === 'room' ? 'hiddenRooms' : 'hiddenGroups';
    }

    function mergeSchedulerPresetLists(...lists) {
        const seen = new Set();
        const merged = [];
        lists.flat().forEach((entry) => {
            const normalized = normalizeSchedulerPresetName(entry);
            if (!normalized) return;
            const key = normalized.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(normalized);
        });
        return merged.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
    }

    function harvestSchedulerPresetValuesFromSchedule() {
        const groups = new Set();
        const rooms = new Set();
        try {
            const sessions = typeof getAvailableScheduleItemsForWeek === 'function'
                ? getAvailableScheduleItemsForWeek(getSchedulerWeekStart()) || []
                : [];
            sessions.forEach((session) => {
                const groupName = normalizeSchedulerPresetName(session?.name || session?.id || '');
                const roomName = normalizeSchedulerPresetName(session?.room || '');
                if (groupName) groups.add(groupName);
                if (roomName && roomName !== 'TBD') rooms.add(roomName);
            });
        } catch (error) {
            /* ignore harvest failures */
        }
        return {
            groups: [...groups],
            rooms: [...rooms]
        };
    }

    function saveSchedulerSessionPreset(kind, rawName) {
        const name = normalizeSchedulerPresetName(rawName);
        if (!name) return null;
        const presets = readSchedulerSessionPresets();
        const key = kind === 'room' ? 'rooms' : 'groups';
        const exists = (presets[key] || []).some((entry) => entry.toLowerCase() === name.toLowerCase());
        if (!exists) {
            presets[key] = [...(presets[key] || []), name];
            writeSchedulerSessionPresets(presets);
        }
        return name;
    }

    function rebuildSchedulerPresetSelect(select, values, placeholderLabel, currentValue = '') {
        if (!select) return;
        const fragment = document.createDocumentFragment();
        fragment.appendChild(new Option(placeholderLabel, ''));
        values.forEach((value) => fragment.appendChild(new Option(value, value)));
        select.replaceChildren(fragment);
        select.value = values.some((value) => value === currentValue) ? currentValue : '';
        select.removeAttribute('size');
        select.size = 0;
    }

    function refreshSchedulerGroupRoomPickers(options = {}) {
        const presets = readSchedulerSessionPresets();
        const harvested = harvestSchedulerPresetValuesFromSchedule();
        const ensureGroup = normalizeSchedulerPresetName(options.ensureGroup || el('sch-group')?.value || '');
        const ensureRoom = normalizeSchedulerPresetName(options.ensureRoom || el('sch-room')?.value || '');
        const groupValues = mergeSchedulerPresetLists(
            getVisibleSchedulerDefaultPresets('group'),
            presets.groups,
            harvested.groups,
            ensureGroup ? [ensureGroup] : []
        );
        const roomValues = mergeSchedulerPresetLists(
            getVisibleSchedulerDefaultPresets('room'),
            presets.rooms,
            harvested.rooms,
            ensureRoom ? [ensureRoom] : []
        );
        labelSchedulerSelect('sch-group', 'Group ID');
        labelSchedulerSelect('sch-room', 'Room');
        rebuildSchedulerPresetSelect(el('sch-group'), groupValues, 'Select group', ensureGroup || el('sch-group')?.value || '');
        rebuildSchedulerPresetSelect(el('sch-room'), roomValues, 'Select room', ensureRoom || el('sch-room')?.value || '');
    }

    function syncSchedulerPickerSelect(selectId) {
        const select = el(selectId);
        if (!select) return;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function markSchedulerDurationCustom() {
        const durationField = el('sch-duration');
        if (!durationField || durationField.value === 'custom') return;
        durationField.value = 'custom';
        syncSchedulerPickerSelect('sch-duration');
    }

    function handleSchedulerManualTimeEdit() {
        markSchedulerDurationCustom();
        schCheckConflict();
    }

    function escapeSchedulerPresetHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getSchedulerPresetDefaults(kind) {
        return kind === 'room' ? SCHEDULER_DEFAULT_ROOM_PRESETS : SCHEDULER_DEFAULT_GROUP_PRESETS;
    }

    function getVisibleSchedulerDefaultPresets(kind) {
        const presets = readSchedulerSessionPresets();
        const hiddenKey = getSchedulerHiddenPresetKey(kind);
        const hiddenKeys = new Set((presets[hiddenKey] || []).map((entry) => entry.toLowerCase()));
        return getSchedulerPresetDefaults(kind).filter((entry) => !hiddenKeys.has(entry.toLowerCase()));
    }

    function hideSchedulerDefaultPreset(kind, rawName) {
        const name = normalizeSchedulerPresetName(rawName);
        if (!name) return false;
        const isBuiltInDefault = getSchedulerPresetDefaults(kind).some((entry) => entry.toLowerCase() === name.toLowerCase());
        if (!isBuiltInDefault) return false;
        const presets = readSchedulerSessionPresets();
        const hiddenKey = getSchedulerHiddenPresetKey(kind);
        const hidden = presets[hiddenKey] || [];
        if (hidden.some((entry) => entry.toLowerCase() === name.toLowerCase())) return true;
        presets[hiddenKey] = [...hidden, name];
        writeSchedulerSessionPresets(presets);
        return true;
    }

    function getSchedulerPresetCatalog(kind, options = {}) {
        const presets = readSchedulerSessionPresets();
        const harvested = harvestSchedulerPresetValuesFromSchedule();
        const key = kind === 'room' ? 'rooms' : 'groups';
        const ensureValue = normalizeSchedulerPresetName(
            options.ensureValue
            || (kind === 'room' ? el('sch-room')?.value : el('sch-group')?.value)
            || ''
        );
        const stored = presets[key] || [];
        const defaults = getVisibleSchedulerDefaultPresets(kind);
        const harvestedValues = harvested[key] || [];
        const merged = mergeSchedulerPresetLists(
            defaults,
            stored,
            harvestedValues,
            ensureValue ? [ensureValue] : []
        );
        return { stored, defaults, harvested: harvestedValues, merged, ensureValue };
    }

    function deleteSchedulerSessionPreset(kind, rawName) {
        const name = normalizeSchedulerPresetName(rawName);
        if (!name) return false;
        const presets = readSchedulerSessionPresets();
        const key = kind === 'room' ? 'rooms' : 'groups';
        const nextValues = (presets[key] || []).filter((entry) => entry.toLowerCase() !== name.toLowerCase());
        if (nextValues.length === (presets[key] || []).length) return false;
        presets[key] = nextValues;
        writeSchedulerSessionPresets(presets);
        return true;
    }

    function filterSchedulerPresetManagerList(query, catalog) {
        const normalizedQuery = String(query || '').trim().toLowerCase();
        if (!normalizedQuery) return catalog.merged;
        return catalog.merged.filter((name) => name.toLowerCase().includes(normalizedQuery));
    }

    function getSchedulerPresetManagerKind() {
        const overlay = el(SCHEDULER_PRESET_MANAGER_ID);
        const kind = overlay?.dataset?.presetKind || overlay?.getAttribute('data-preset-kind') || 'group';
        return kind === 'room' ? 'room' : 'group';
    }

    function syncSchedulerPresetManagerChrome(kind) {
        const isRoom = kind === 'room';
        const title = el('sch-preset-manage-title');
        const subtitle = el('sch-preset-manage-subtitle');
        const draft = el('sch-preset-manage-draft');
        const overlay = el(SCHEDULER_PRESET_MANAGER_ID);
        if (overlay) overlay.dataset.presetKind = kind;
        if (title) {
            title.innerHTML = isRoom
                ? '<i class="fas fa-door-open"></i> Manage Rooms'
                : '<i class="fas fa-users"></i> Manage Groups';
        }
        if (subtitle) {
            subtitle.textContent = isRoom
                ? 'Add, search, or remove rooms from pickers.'
                : 'Add, search, or remove groups from pickers.';
        }
        if (draft) draft.placeholder = isRoom ? 'New room' : 'New group';
    }

    function renderSchedulerPresetManagerList(kind, query = '') {
        const list = el('sch-preset-list');
        const emptyState = el('sch-preset-manage-empty');
        const countNode = el('sch-preset-manage-count');
        if (!list) return;
        const catalog = getSchedulerPresetCatalog(kind);
        const visibleNames = filterSchedulerPresetManagerList(query, catalog);
        const storedKeys = new Set(catalog.stored.map((entry) => entry.toLowerCase()));
        const visibleDefaultKeys = new Set(catalog.defaults.map((entry) => entry.toLowerCase()));
        const allDefaultKeys = new Set(getSchedulerPresetDefaults(kind).map((entry) => entry.toLowerCase()));
        const harvestedKeys = new Set(catalog.harvested.map((entry) => entry.toLowerCase()));
        const fragment = document.createDocumentFragment();

        visibleNames.forEach((name) => {
            const item = document.createElement('div');
            item.className = 'sch-preset-manage-item';
            item.setAttribute('role', 'listitem');
            const lowerName = name.toLowerCase();
            const badges = [];
            if (storedKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--saved">Saved</span>');
            if (allDefaultKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--default">Default</span>');
            if (harvestedKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--schedule">In schedule</span>');
            const actionButtons = [];
            if (storedKeys.has(lowerName) || visibleDefaultKeys.has(lowerName)) {
                actionButtons.push(`<button type="button" class="sch-preset-manage-delete-btn" data-scheduler-preset-remove="${escapeSchedulerPresetHtml(name)}" aria-label="Remove ${escapeSchedulerPresetHtml(name)}"><i class="fas fa-trash-alt"></i></button>`);
            }
            const actionsMarkup = actionButtons.length
                ? `<div class="sch-preset-manage-item-actions">${actionButtons.join('')}</div>`
                : '';
            item.innerHTML = `
                <div class="sch-preset-manage-item-main">
                    <div class="sch-preset-manage-item-label">${escapeSchedulerPresetHtml(name)}</div>
                    <div class="sch-preset-manage-badges">${badges.join('')}</div>
                </div>
                ${actionsMarkup}
            `;
            fragment.appendChild(item);
        });

        list.replaceChildren(fragment);
        if (countNode) countNode.textContent = String(visibleNames.length);
        if (emptyState) emptyState.hidden = visibleNames.length > 0;
    }

    function finishSchedulerPresetManager() {
        const kind = getSchedulerPresetManagerKind();
        const ensureGroup = normalizeSchedulerPresetName(el('sch-group')?.value || '');
        const ensureRoom = normalizeSchedulerPresetName(el('sch-room')?.value || '');
        refreshSchedulerGroupRoomPickers({ ensureGroup, ensureRoom });
        syncSchedulerPickerSelect('sch-group');
        syncSchedulerPickerSelect('sch-room');
        if (kind === 'room') schCheckConflict();
        closeSchedulerPresetManager();
    }

    function handleSchedulerPresetManagerAdd(kind) {
        const draftField = el('sch-preset-manage-draft');
        const savedName = saveSchedulerSessionPreset(kind, draftField?.value || '');
        if (!savedName) return;
        if (draftField) draftField.value = '';
        renderSchedulerPresetManagerList(kind, el('sch-preset-search')?.value || '');
        const selectId = kind === 'room' ? 'sch-room' : 'sch-group';
        const select = el(selectId);
        if (select) {
            select.value = savedName;
            syncSchedulerPickerSelect(selectId);
        }
        refreshSchedulerGroupRoomPickers(kind === 'room'
            ? { ensureRoom: savedName, ensureGroup: normalizeSchedulerPresetName(el('sch-group')?.value || '') }
            : { ensureGroup: savedName, ensureRoom: normalizeSchedulerPresetName(el('sch-room')?.value || '') });
        if (kind === 'room') schCheckConflict();
    }

    function handleSchedulerPresetManagerRemove(kind, rawName) {
        const name = normalizeSchedulerPresetName(rawName);
        if (!name) return;
        const presets = readSchedulerSessionPresets();
        const key = kind === 'room' ? 'rooms' : 'groups';
        const isSaved = (presets[key] || []).some((entry) => entry.toLowerCase() === name.toLowerCase());
        const isDefault = getVisibleSchedulerDefaultPresets(kind).some((entry) => entry.toLowerCase() === name.toLowerCase());
        if (!isSaved && !isDefault) return;
        const selectId = kind === 'room' ? 'sch-room' : 'sch-group';
        const currentValue = normalizeSchedulerPresetName(el(selectId)?.value || '');
        if (currentValue && currentValue.toLowerCase() === name.toLowerCase()) {
            const label = kind === 'room' ? 'room' : 'group';
            const confirmed = window.confirm(`Remove ${label} "${name}" from pickers? The current field will keep this value until you change it.`);
            if (!confirmed) return;
        }
        let changed = false;
        if (isSaved) changed = deleteSchedulerSessionPreset(kind, name) || changed;
        if (isDefault) changed = hideSchedulerDefaultPreset(kind, name) || changed;
        if (!changed) return;
        const ensureGroup = normalizeSchedulerPresetName(el('sch-group')?.value || '');
        const ensureRoom = normalizeSchedulerPresetName(el('sch-room')?.value || '');
        refreshSchedulerGroupRoomPickers({ ensureGroup, ensureRoom });
        renderSchedulerPresetManagerList(kind, el('sch-preset-search')?.value || '');
        syncSchedulerPickerSelect('sch-group');
        syncSchedulerPickerSelect('sch-room');
        if (kind === 'room') schCheckConflict();
    }

    function closeSchedulerPresetManager() {
        const overlay = el(SCHEDULER_PRESET_MANAGER_ID);
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.hidden = true;
        const searchField = el('sch-preset-search');
        const draftField = el('sch-preset-manage-draft');
        if (searchField) searchField.value = '';
        if (draftField) draftField.value = '';
        if (schedulerPresetSearchHandle) {
            window.clearTimeout(schedulerPresetSearchHandle);
            schedulerPresetSearchHandle = 0;
        }
    }

    function bindSchedulerPresetManagerListeners(overlay) {
        bindNodeOnce(overlay, 'click', 'schedulerPresetManagerClickBound', (event) => {
            const removeButton = event.target.closest('[data-scheduler-preset-remove]');
            if (removeButton) {
                event.preventDefault();
                handleSchedulerPresetManagerRemove(
                    getSchedulerPresetManagerKind(),
                    removeButton.getAttribute('data-scheduler-preset-remove')
                );
                return;
            }
            if (event.target.closest('[data-scheduler-preset-add]')) {
                event.preventDefault();
                handleSchedulerPresetManagerAdd(getSchedulerPresetManagerKind());
                return;
            }
            if (event.target.closest('[data-admin-scheduler-preset-done]')) {
                event.preventDefault();
                finishSchedulerPresetManager();
                return;
            }
            if (event.target === event.currentTarget || event.target.closest('[data-admin-scheduler-preset-close]')) {
                event.preventDefault();
                closeSchedulerPresetManager();
            }
        });

        bindNodeOnce(el('sch-preset-search'), 'input', 'schedulerPresetSearchBound', (event) => {
            const query = event.target?.value || '';
            if (schedulerPresetSearchHandle) window.clearTimeout(schedulerPresetSearchHandle);
            schedulerPresetSearchHandle = window.setTimeout(() => {
                schedulerPresetSearchHandle = 0;
                renderSchedulerPresetManagerList(getSchedulerPresetManagerKind(), query);
            }, SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS);
        });

        bindNodeOnce(overlay, 'keydown', 'schedulerPresetManagerKeyBound', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSchedulerPresetManager();
            }
        });
    }

    function ensureSchedulerPresetManager() {
        const overlay = ensureMountedTemplate(SCHEDULER_PRESET_MANAGER_TEMPLATE_ID, SCHEDULER_PRESET_MANAGER_ID);
        if (!overlay) return null;
        overlay.hidden = false;
        bindSchedulerPresetManagerListeners(overlay);
        if (document.body.classList.contains('lux-route-admin-scheduler')) {
            overlay.dataset.luxSchPresetModal = '1';
            overlay.querySelector('.sch-modal')?.setAttribute('data-lux-glass-root', '1');
        }
        return overlay;
    }

    function openSchedulerPresetManager(kind) {
        const normalizedKind = kind === 'room' ? 'room' : 'group';
        if (typeof window.closePickerPanels === 'function') {
            window.closePickerPanels();
        }
        const overlay = ensureSchedulerPresetManager();
        if (!overlay) return;
        syncSchedulerPresetManagerChrome(normalizedKind);
        const searchField = el('sch-preset-search');
        const draftField = el('sch-preset-manage-draft');
        if (searchField) searchField.value = '';
        if (draftField) draftField.value = '';
        renderSchedulerPresetManagerList(normalizedKind, '');
        overlay.classList.add('open');
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [overlay] });
        }
        window.setTimeout(() => searchField?.focus(), 0);
    }

    function normalizeSchedulerSelectOptions() {
        const currentFaculty = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        const semester = String((typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3);
        labelSchedulerSelect('admin-tt-faculty', 'Faculty');
        labelSchedulerSelect('admin-tt-semester', 'Semester');
        labelSchedulerSelect('admin-tt-prof', 'Professor');
        labelSchedulerSelect('admin-tt-ta', 'Teaching assistant');
        rebuildSchedulerSelect(el('admin-tt-faculty'), SCHEDULER_FACULTY_OPTIONS, currentFaculty);
        rebuildSchedulerSelect(el('admin-tt-semester'), SCHEDULER_SEMESTER_OPTIONS, semester);
    }

    function mergeUniqueSubjects(items = []) {
        const seen = new Set();
        return items.filter((item) => {
            const id = String(item?.id || '').trim();
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    function deriveFaculty(courseId) {
        if (!courseId) return 'ECON';
        const normalized = String(courseId).trim().toUpperCase();
        if (normalized.startsWith('CS') || normalized.startsWith('STAT') || normalized.startsWith('CALC')) return 'CS';
        if (normalized.startsWith('ECON') || normalized.startsWith('PM') || normalized.startsWith('BM')) return 'ECON';
        if (normalized.startsWith('LAW')) return 'LAW';
        return localStorage.getItem('currentFaculty') || 'ECON';
    }

    function normalizeFacultyDisplay(code) {
        const normalized = code === 'all' ? 'all' : normalizeFacultyCode(code, getCurrentFaculty());
        if (normalized === 'all') return 'All Faculties';
        const profile = typeof getFacultyProfile === 'function' ? getFacultyProfile(normalized) : null;
        return profile?.name || normalized;
    }

    function getSchedulerWeekStart() {
        return getStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY);
    }

    function normalizeSchedulerDayLabel(day, target = 'ge') {
        const raw = String(day || '').trim();
        if (!raw) return '';
        const entries = getWeekDateEntries(getSchedulerWeekStart());
        const lowered = raw.toLowerCase();
        const match = entries.find((entry) =>
            String(entry.ge || '').trim().toLowerCase() === lowered
            || String(entry.en || '').trim().toLowerCase() === lowered
        );
        if (match) return target === 'en' ? match.en : match.ge;
        const orderIndex = DAY_ORDER.findIndex((label) => label.toLowerCase() === lowered);
        if (orderIndex >= 0) {
            const fallbackEntry = entries[orderIndex];
            if (fallbackEntry) return target === 'en' ? fallbackEntry.en : fallbackEntry.ge;
        }
        return raw;
    }

    function getSchedulerFacultyTone(facultyCode, options = {}) {
        return getFacultyThemeTone(normalizeFacultyCode(facultyCode || 'ECON'), {
            softAlpha: 0.14,
            tintAlpha: 0.18,
            strongAlpha: 0.24,
            borderAlpha: 0.28,
            ...options
        });
    }

    function getSchedulerPaletteSubjects() {
        const facultyFilter = el('admin-tt-faculty')?.value || 'all';
        const semesterFilter = parseInt(el('admin-tt-semester')?.value || '0', 10);
        const query = String(el('palette-search')?.value || '').trim().toLowerCase();
        const currentFaculty = localStorage.getItem('currentFaculty') || 'ECON';
        const normalizedFaculty = facultyFilter === 'all'
            ? 'all'
            : normalizeFacultyCode(facultyFilter, currentFaculty);

        let subjects = normalizedFaculty === 'all'
            ? mergeUniqueSubjects(
                Object.values(KIU_STATE.facultyProfiles || {})
                    .flatMap((profile) => profile.curriculum || [])
                    .concat(KIU_STATE.curriculum || [])
            )
            : getActiveCurriculum(normalizedFaculty);

        if (!subjects.length) {
            subjects = (KIU_STATE.curriculum || []).filter((subject) =>
                normalizedFaculty === 'all'
                || normalizeFacultyCode(subject.faculty, currentFaculty) === normalizedFaculty
            );
        }

        return subjects.filter((subject) => {
            const subjectSemester = parseInt(subject.semester || '0', 10);
            const semesterMatches = !semesterFilter || !subjectSemester || subjectSemester === semesterFilter;
            if (!semesterMatches) return false;
            if (!query) return true;
            return String(subject.name || '').toLowerCase().includes(query)
                || String(subject.id || '').toLowerCase().includes(query);
        });
    }

    function getVisibleSchedulerSessions() {
        const weekStart = getSchedulerWeekStart();
        const semester = parseInt(el('admin-tt-semester')?.value || '3', 10);
        const facultyCode = el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON';
        const profFilter = el('admin-tt-prof')?.value || 'all';
        const taFilter = el('admin-tt-ta')?.value || 'all';
        const resolvedFaculty = facultyCode === 'all' ? null : normalizeFacultyCode(facultyCode, getCurrentFaculty());
        let sessions = typeof getAvailableScheduleItemsForWeek === 'function'
            ? getAvailableScheduleItemsForWeek(weekStart, { semester, faculty: resolvedFaculty })
            : [];

        if (profFilter !== 'all') {
            sessions = sessions.filter((session) => session.prof === profFilter);
        } else if (taFilter !== 'all') {
            sessions = sessions.filter((session) => session.ta === taFilter);
        }

        return sessions;
    }

    function syncSchedulerWeekChrome() {
        const weekStart = getSchedulerWeekStart();
        const label = el('scheduler-week-label');
        if (label) label.textContent = formatWeekRangeLabel(weekStart);

        const currentButton = el('scheduler-week-current');
        if (currentButton) {
            const isCurrentWeek = weekStart === getCurrentWeekStartISO();
            currentButton.className = isCurrentWeek
                ? 'lux-primary-btn sch-week-current-btn is-current-week'
                : 'lux-secondary-btn sch-week-current-btn';
            currentButton.textContent = isCurrentWeek ? 'Current week' : 'Jump to current';
        }
    }

    function getPaletteSubjectsCount() {
        return getSchedulerPaletteSubjects().length;
    }

    function updateSchedulerRailChrome() {
        const weekStart = getSchedulerWeekStart();
        const currentWeek = getCurrentWeekStartISO();
        const visibleSessions = getVisibleSchedulerSessions();
        const drafts = visibleSessions.filter((session) => session.prof === 'TBD' || session.room === 'TBD').length;
        const roomCount = new Set(
            visibleSessions
                .filter((session) => session.room && session.room !== 'TBD')
                .map((session) => session.room)
        ).size;
        const staffCount = new Set(
            visibleSessions.flatMap((session) => [session.prof, session.ta].filter((name) => name && name !== 'TBD'))
        ).size;
        const facultyCode = el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON';
        const semester = el('admin-tt-semester')?.value || '3';
        const isCurrentWeek = weekStart === currentWeek;

        setText('sch-current-faculty', `Faculty: ${normalizeFacultyDisplay(facultyCode)}`);
        setText('sch-current-semester', `Semester ${semester}`);
        setText('sch-current-week-range', formatWeekRangeLabel(weekStart));
        setText('sch-stat-sessions', String(visibleSessions.length));
        setText('sch-stat-drafts', String(drafts));
        setText('sch-stat-rooms', String(roomCount));
        setText('sch-stat-instructors', String(staffCount));
        setText('sch-palette-count', String(getPaletteSubjectsCount()));
        setText('sch-palette-summary', `${getPaletteSubjectsCount()} subjects`);

        const badge = el('sch-rail-week-badge');
        if (badge) badge.textContent = isCurrentWeek ? 'Current week' : 'Selected week';
    }

    function schedulerRosterDisplayName(person = {}) {
        return String(person.name || person.nameEn || person.displayName || person.id || '').trim();
    }

    function populateProfList() {
        const facultyValue = el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON';
        const facultyFilter = facultyValue === 'all' ? null : normalizeFacultyCode(facultyValue, getCurrentFaculty());
        const professors = getAllStaff('professors', facultyFilter);
        const tas = getAllStaff('tas', facultyFilter);
        const profSelect = el('admin-tt-prof');
        if (profSelect) {
            const currentValue = profSelect.value || 'all';
            profSelect.innerHTML = '<option value="all">All professors</option>'
                + professors.map((person) => {
                    const label = schedulerRosterDisplayName(person);
                    return `<option value="${label}">${label}</option>`;
                }).join('');
            profSelect.value = [...profSelect.options].some((option) => option.value === currentValue) ? currentValue : 'all';
            profSelect.removeAttribute('size');
            profSelect.size = 0;
        }

        const taSelect = el('admin-tt-ta');
        if (taSelect) {
            const currentValue = taSelect.value || 'all';
            taSelect.innerHTML = '<option value="all">All teaching assistants</option>'
                + tas.map((person) => {
                    const label = schedulerRosterDisplayName(person);
                    return `<option value="${label}">${label}</option>`;
                }).join('');
            taSelect.value = [...taSelect.options].some((option) => option.value === currentValue) ? currentValue : 'all';
            taSelect.removeAttribute('size');
            taSelect.size = 0;
        }
    }

    function renderPalette() {
        const list = el('palette-list');
        if (!list) return;
        const subjects = getSchedulerPaletteSubjects();
        const semesterValue = el('admin-tt-semester')?.value || '?';

        if (!subjects.length) {
            list.replaceChildren(buildSchedulerEmptyState(`No subjects found for Semester ${semesterValue}. Adjust the faculty or semester filters.`));
            updateSchedulerRailChrome();
            return;
        }

        const fragment = document.createDocumentFragment();
        subjects.forEach((subject) => {
            const facultyCode = normalizeFacultyCode(subject.faculty || deriveFaculty(subject.id));
            const isActive = selectedPaletteSubject?.id === subject.id;
            fragment.appendChild(buildSchedulerPaletteCard(subject, facultyCode, isActive));
        });
        list.replaceChildren(fragment);
        updateSchedulerRailChrome();
    }
    function syncPaletteSelectionState(selectedId = selectedPaletteSubject?.id || '') {
        const list = el('palette-list');
        if (!list) return;
        const normalizedId = String(selectedId || '').trim();
        list.querySelectorAll('[data-scheduler-subject-id]').forEach((card) => {
            card.classList.toggle('selected', String(card.dataset.schedulerSubjectId || '').trim() === normalizedId);
        });
    }

    function selectPaletteItem(id) {
        const paletteSubjects = getSchedulerPaletteSubjects();
        const allSubjects = mergeUniqueSubjects([...(KIU_STATE.curriculum || []), ...paletteSubjects]);
        selectedPaletteSubject = allSubjects.find((subject) => subject.id === id) || null;
        window.selectedPaletteSubject = selectedPaletteSubject;
        syncPaletteSelectionState(id);
        const subjectSelect = el('sch-subject');
        if (subjectSelect) subjectSelect.value = id;
    }

    function setSchModalMode(mode = 'create') {
        const isEdit = mode === 'edit';
        const modeInput = el('sch-edit-mode');
        const modal = el('schModalOverlay');
        const title = el('sch-modal-title');
        const chip = el('sch-modal-mode-chip');
        if (modeInput) modeInput.value = isEdit ? 'edit' : 'create';
        if (modal) modal.dataset.schModalMode = isEdit ? 'edit' : 'create';
        if (chip) chip.textContent = isEdit ? 'Edit' : 'Create';
        if (title) {
            title.innerHTML = isEdit
                ? '<i class="fas fa-pen-to-square"></i> Edit Class Session'
                : '<i class="fas fa-calendar-plus"></i> New Class Session';
        }
        if (!isEdit) {
            ['sch-edit-course', 'sch-edit-group', 'sch-edit-weekstart'].forEach((id) => {
                const field = el(id);
                if (field) field.value = '';
            });
            const overrideField = el('sch-edit-was-override');
            if (overrideField) overrideField.value = '0';
        }
        const button = el('sch-create-btn');
        if (button) {
            button.innerHTML = isEdit
                ? '<i class="fas fa-pen-to-square"></i> Save Session Changes'
                : '<i class="fas fa-plus-circle"></i> Create Session & Deploy';
        }
    }

    function getSchedulerModalFacultyCode(facultyValue) {
        const currentFaculty = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        if (facultyValue === 'all' || !facultyValue) return currentFaculty;
        return normalizeFacultyCode(facultyValue, currentFaculty);
    }

    function populateSchedulerSubjectOptions(semester, facultyValue) {
        const subjectSelect = el('sch-subject');
        if (!subjectSelect) return;
        const currentFaculty = getSchedulerModalFacultyCode(facultyValue);
        let subjects = getActiveCurriculum(currentFaculty).filter((subject) => {
            const subjectSemester = parseInt(subject.semester || '0', 10);
            return !subjectSemester || subjectSemester === semester;
        });

        if (!subjects.length) {
            subjects = (KIU_STATE.curriculum || []).filter((subject) => {
                const subjectFaculty = normalizeFacultyCode(subject.faculty || currentFaculty, currentFaculty);
                const subjectSemester = parseInt(subject.semester || '0', 10);
                return subjectFaculty === currentFaculty && (!subjectSemester || subjectSemester === semester);
            });
        }

        if (!subjects.length) {
            subjectSelect.innerHTML = '<option value="">- Add subjects from Curriculum CMS first -</option>';
            return;
        }

        subjectSelect.innerHTML = subjects.map((subject) =>
            `<option value="${subject.id}">${subject.id} - ${subject.name}</option>`
        ).join('');

        if (selectedPaletteSubject && subjectSelect.querySelector(`option[value="${selectedPaletteSubject.id}"]`)) {
            subjectSelect.value = selectedPaletteSubject.id;
        }
    }

    function buildProfessorQuizEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'quiz-question-empty-state';
        empty.textContent = 'No questions yet.';
        return empty;
    }

    function buildProfessorQuizQuestionCard(question, index) {
        const card = document.createElement('div');
        card.className = 'quiz-question-card';

        const header = document.createElement('div');
        header.className = 'quiz-question-card-head';

        const label = document.createElement('span');
        label.className = 'quiz-question-card-label';
        label.textContent = `Q${index + 1}`;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.dataset.profQuizQuestionRemove = String(index);
        removeButton.className = 'quiz-question-remove-btn';
        removeButton.setAttribute('aria-label', `Remove question ${index + 1}`);

        const removeIcon = document.createElement('i');
        removeIcon.className = 'fas fa-trash';
        removeButton.appendChild(removeIcon);

        header.append(label, removeButton);

        const questionLabel = document.createElement('label');
        questionLabel.htmlFor = `pq-question-text-${index}`;
        questionLabel.className = 'sch-visually-hidden';
        questionLabel.textContent = `Question ${index + 1} text`;

        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.id = `pq-question-text-${index}`;
        questionInput.name = `pq-question-text-${index}`;
        questionInput.placeholder = 'Question text...';
        questionInput.value = question.text || '';
        questionInput.dataset.profQuizQuestionText = String(index);
        questionInput.className = 'quiz-question-input';

        const pointsRow = document.createElement('div');
        pointsRow.className = 'quiz-question-points-row';

        const pointsLabel = document.createElement('label');
        pointsLabel.htmlFor = `pq-question-points-${index}`;
        pointsLabel.className = 'quiz-question-points-label';
        pointsLabel.textContent = 'Pts:';

        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.id = `pq-question-points-${index}`;
        pointsInput.name = `pq-question-points-${index}`;
        pointsInput.value = String(question.points ?? 10);
        pointsInput.dataset.profQuizQuestionPoints = String(index);
        pointsInput.min = '0';
        pointsInput.className = 'quiz-question-points-input';

        pointsRow.append(pointsLabel, pointsInput);
        card.append(header, questionLabel, questionInput, pointsRow);
        return card;
    }

    function renderProfQuizQuestions() {
        const container = el('pq-questions-list');
        if (!container) return;
        if (!profQuizQuestions.length) {
            container.replaceChildren(buildProfessorQuizEmptyState());
            return;
        }
        const fragment = document.createDocumentFragment();
        profQuizQuestions.forEach((question, index) => {
            fragment.appendChild(buildProfessorQuizQuestionCard(question, index));
        });
        container.replaceChildren(fragment);
    }

    function addProfQuizQuestion() {
        profQuizQuestions.push({ id: `q${Date.now()}`, text: '', points: 10 });
        renderProfQuizQuestions();
        const list = el('pq-questions-list');
        if (list) {
            setTimeout(() => {
                list.scrollTop = list.scrollHeight;
            }, 50);
        }
    }

    function removeProfQuizQuestion(index) {
        profQuizQuestions.splice(index, 1);
        renderProfQuizQuestions();
    }

    function closeProfQuizModal() {
        const modal = el(SCHEDULER_QUIZ_MODAL_ID);
        if (modal) modal.classList.remove('open');
    }

    function saveProfQuiz() {
        const courseId = el('pq-course')?.value || '';
        const groupId = el('pq-group')?.value || '';
        const title = el('pq-title')?.value?.trim() || 'Untitled Quiz';
        const quiz = {
            id: `quiz-${Date.now()}`,
            subjectId: courseId,
            groupId,
            title,
            durationMinutes: parseInt(el('pq-duration')?.value || '30', 10) || 30,
            availableFrom: el('pq-date')?.value || '',
            questions: profQuizQuestions,
            status: 'published',
            createdAt: new Date().toISOString()
        };
        const facultyCode = localStorage.getItem('currentFaculty') || 'ECON';
        if (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles?.[facultyCode]) {
            if (!KIU_STATE.facultyProfiles[facultyCode].quizzes) KIU_STATE.facultyProfiles[facultyCode].quizzes = [];
            KIU_STATE.facultyProfiles[facultyCode].quizzes.push(quiz);
            if (typeof saveState === 'function') saveState();
        }
        alert(`Quiz "${title}" deployed to ${courseId} Group ${groupId.toUpperCase()}!`);
        closeProfQuizModal();
    }

    function bindProfessorQuizModalListeners(modal) {
        bindNodeOnce(modal, 'click', 'schedulerQuizModalClickBound', (event) => {
            if (event.target === event.currentTarget) {
                closeProfQuizModal();
                return;
            }

            const quizAction = event.target.closest('[data-admin-scheduler-quiz-action]');
            if (quizAction) {
                event.preventDefault();
                const action = quizAction.dataset.adminSchedulerQuizAction || '';
                if (action === 'add') addProfQuizQuestion();
                if (action === 'save') saveProfQuiz();
                return;
            }

            const removeButton = event.target.closest('[data-prof-quiz-question-remove]');
            if (removeButton) {
                event.preventDefault();
                const index = parseInt(removeButton.dataset.profQuizQuestionRemove || '-1', 10);
                if (Number.isFinite(index) && index >= 0) removeProfQuizQuestion(index);
                return;
            }

            if (event.target.closest('[data-prof-quiz-close]')) {
                event.preventDefault();
                closeProfQuizModal();
            }
        });

        bindNodeOnce(modal, 'input', 'schedulerQuizModalInputBound', (event) => {
            const textInput = event.target.closest('[data-prof-quiz-question-text]');
            if (textInput) {
                const index = parseInt(textInput.dataset.profQuizQuestionText || '-1', 10);
                if (Number.isFinite(index) && profQuizQuestions[index]) {
                    profQuizQuestions[index].text = textInput.value;
                }
                return;
            }

            const pointsInput = event.target.closest('[data-prof-quiz-question-points]');
            if (!pointsInput) return;
            const index = parseInt(pointsInput.dataset.profQuizQuestionPoints || '-1', 10);
            if (Number.isFinite(index) && profQuizQuestions[index]) {
                profQuizQuestions[index].points = Number(pointsInput.value);
            }
        });
    }

    function ensureProfessorQuizModal() {
        const modal = ensureMountedTemplate(SCHEDULER_QUIZ_MODAL_TEMPLATE_ID, SCHEDULER_QUIZ_MODAL_ID);
        if (modal) bindProfessorQuizModalListeners(modal);
        return modal;
    }

    function openProfQuizModal(courseId, groupId, weekStart) {
        const modal = ensureProfessorQuizModal();
        if (!modal) return;
        setText('prof-quiz-subtitle', `${courseId} · Group ${String(groupId || '').toUpperCase()}`);
        if (el('pq-course')) el('pq-course').value = courseId;
        if (el('pq-group')) el('pq-group').value = groupId;
        if (el('pq-week')) el('pq-week').value = weekStart;
        if (el('pq-title')) el('pq-title').value = '';
        if (el('pq-duration')) el('pq-duration').value = '30';
        if (el('pq-date')) el('pq-date').value = new Date().toISOString().split('T')[0];
        profQuizQuestions = [{ id: 'q1', text: '', points: 10 }];
        renderProfQuizQuestions();
        modal.classList.add('open');
    }

    function bindSchedulerCreateModalListeners(modal) {
        bindNodeOnce(modal, 'click', 'schedulerModalClickBound', (event) => {
            const manageButton = event.target.closest('[data-scheduler-preset-manage]');
            if (manageButton) {
                event.preventDefault();
                openSchedulerPresetManager(manageButton.getAttribute('data-scheduler-preset-manage'));
                return;
            }
            if (event.target === event.currentTarget || event.target.closest('[data-admin-scheduler-modal-close]')) {
                event.preventDefault();
                closeSchModal();
            }
        });

        bindNodeOnce(el('sch-duration'), 'change', 'schdurationBound', () => {
            schCalcEnd();
            schCheckConflict();
        });
        bindNodeOnce(el('sch-time'), 'input', 'schedulerStartTimeInputBound', handleSchedulerManualTimeEdit);
        bindNodeOnce(el('sch-time'), 'change', 'schedulerStartTimeChangeBound', handleSchedulerManualTimeEdit);
        bindNodeOnce(el('sch-endtime'), 'input', 'schedulerEndTimeInputBound', handleSchedulerManualTimeEdit);
        bindNodeOnce(el('sch-endtime'), 'change', 'schedulerEndTimeChangeBound', handleSchedulerManualTimeEdit);
        bindNodeOnce(el('sch-session-type'), 'change', 'schedulerSessionTypeBound', (event) => {
            const field = event.target;
            if (field) field.dataset.userSet = '1';
            schCheckConflict();
        });
        bindNodeOnce(el('sch-room'), 'change', 'schedulerRoomInputBound', schCheckConflict);
        bindNodeOnce(el('sch-day'), 'change', 'schedulerDayBound', schCheckConflict);
        bindNodeOnce(el('sch-create-btn'), 'click', 'schedulerCreateButtonBound', (event) => {
            event.preventDefault();
            schCreateSession();
        });
    }

    function ensureSchedulerCreateModal() {
        const modal = ensureMountedTemplate(SCHEDULER_CREATE_MODAL_TEMPLATE_ID, SCHEDULER_CREATE_MODAL_ID);
        if (modal) {
            bindSchedulerCreateModalListeners(modal);
            if (document.body.classList.contains('lux-route-admin-scheduler')) {
                modal.dataset.luxSchModal = '1';
                modal.querySelector('.sch-modal')?.setAttribute('data-lux-glass-root', '1');
            }
        }
        return modal;
    }

    function syncSchedulerSessionTypeDefault() {
        const sessionTypeField = el('sch-session-type');
        if (!sessionTypeField || sessionTypeField.dataset.userSet === '1') return;
        const current = String(sessionTypeField.value || 'lecture').toLowerCase();
        sessionTypeField.value = current === 'seminar' ? 'seminar' : 'lecture';
    }

    function openSchModal(day, time, semester, weekStart = getSchedulerWeekStart()) {
        const modal = ensureSchedulerCreateModal();
        if (!modal) return;
        const normalizedWeek = formatLocalDateISO(getWeekStartDate(weekStart));
        const normalizedTime = normalizeTimeString(time, '09:00');
        const displayDay = normalizeSchedulerDayLabel(day, 'en') || 'Monday';
        const selectedSemester = parseInt(String(semester || el('admin-tt-semester')?.value || '3'), 10) || 3;
        const facultyValue = el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON';
        const normalizedFaculty = getSchedulerModalFacultyCode(facultyValue);
        const facultyProfile = getFacultyProfile(normalizedFaculty);

        setSchModalMode('create');
        setText('sch-modal-subtitle', `${displayDay} - ${normalizedTime}`);
        setText('sch-modal-week', `Week of ${formatWeekRangeLabel(normalizedWeek)}`);
        populateProfList();
        populateSchedulerSubjectOptions(selectedSemester, normalizedFaculty);
        refreshSchedulerGroupRoomPickers();

        if (el('sch-day')) el('sch-day').value = displayDay;
        if (el('sch-time')) el('sch-time').value = normalizedTime;
        if (el('sch-semester-hidden')) el('sch-semester-hidden').value = String(selectedSemester);
        if (el('sch-weekstart-hidden')) el('sch-weekstart-hidden').value = normalizedWeek;
        if (el('sch-faculty-display')) el('sch-faculty-display').value = facultyProfile?.name || normalizedFaculty;
        if (el('sch-apply-scope')) el('sch-apply-scope').value = 'selected-week';

        const profFilter = el('admin-tt-prof')?.value;
        const taFilter = el('admin-tt-ta')?.value;
        if (el('sch-prof')) el('sch-prof').value = profFilter && profFilter !== 'all' ? profFilter : '';
        if (el('sch-ta')) el('sch-ta').value = taFilter && taFilter !== 'all' ? taFilter : '';
        if (el('sch-session-type')) {
            el('sch-session-type').value = 'lecture';
            el('sch-session-type').dataset.userSet = '0';
        }
        syncSchedulerSessionTypeDefault();

        const conflictBox = el('sch-conflict-msg');
        if (conflictBox) conflictBox.classList.remove('show');

        schCalcEnd();
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(modal);
        }
        modal.classList.add('open');
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
    }

    function openSchEditModal(courseId, groupId, weekStart = getSchedulerWeekStart()) {
        const role = typeof getEffectiveRole === 'function' ? getEffectiveRole() : getEffectiveUserRole();
        if (role === 'professor' && typeof openProfQuizModal === 'function') {
            openProfQuizModal(courseId, groupId, weekStart);
            return;
        }

        const normalizedWeek = formatLocalDateISO(getWeekStartDate(weekStart));
        const session = resolveScheduledGroupForWeek(courseId, groupId, normalizedWeek);
        if (!session) {
            alert('Unable to find this session for editing. Please refresh and try again.');
            return;
        }

        openSchModal(session.day, session.time, parseInt(session.semester || 3, 10), normalizedWeek);
        setSchModalMode('edit');

        const subjectSelect = el('sch-subject');
        if (subjectSelect) {
            const escapedCourseId = String(courseId).replace(/"/g, '&quot;');
            if (!subjectSelect.querySelector(`option[value="${courseId}"]`)) {
                subjectSelect.insertAdjacentHTML('beforeend', `<option value="${escapedCourseId}">${courseId} - ${session.courseId || courseId}</option>`);
            }
            subjectSelect.value = courseId;
        }

        const groupValue = session.name || session.id || groupId;
        const roomValue = session.room && session.room !== 'TBD' ? session.room : '';
        const durationMinutes = parseInt(String(session.duration || '110').match(/\d+/)?.[0] || '110', 10);
        const endValue = normalizeTimeString(session.endTime || '', '') || minutesToTimeString(convertTimeToMinutes(session.time) + durationMinutes);

        refreshSchedulerGroupRoomPickers({ ensureGroup: groupValue, ensureRoom: roomValue });
        if (el('sch-group')) el('sch-group').value = groupValue;
        if (el('sch-day')) el('sch-day').value = normalizeSchedulerDayLabel(session.day, 'en') || el('sch-day').value;
        if (el('sch-time')) el('sch-time').value = normalizeTimeString(session.time || '', '09:00');
        if (el('sch-room')) el('sch-room').value = roomValue;
        if (el('sch-prof')) el('sch-prof').value = session.prof && session.prof !== 'TBD' ? session.prof : '';
        if (el('sch-ta')) el('sch-ta').value = session.ta || '';
        if (el('sch-session-type')) {
            const sessionType = String(session.sessionType || '').toLowerCase() === 'seminar' ? 'seminar' : 'lecture';
            el('sch-session-type').value = sessionType;
            el('sch-session-type').dataset.userSet = '1';
        }
        if (el('sch-capacity')) el('sch-capacity').value = String(session.capacity || 40);
        if (el('sch-endtime')) el('sch-endtime').value = endValue;

        const durationSelect = el('sch-duration');
        if (durationSelect) {
            durationSelect.value = [...durationSelect.options].some((option) => option.value === String(durationMinutes))
                ? String(durationMinutes)
                : 'custom';
        }

        if (el('sch-apply-scope')) el('sch-apply-scope').value = session.isWeekOverride ? 'selected-week' : 'recurring';
        if (el('sch-edit-course')) el('sch-edit-course').value = courseId;
        if (el('sch-edit-group')) el('sch-edit-group').value = String(groupId).toLowerCase();
        if (el('sch-edit-weekstart')) el('sch-edit-weekstart').value = normalizedWeek;
        if (el('sch-edit-was-override')) el('sch-edit-was-override').value = session.isWeekOverride ? '1' : '0';

        ['sch-group', 'sch-room', 'sch-day', 'sch-duration', 'sch-session-type', 'sch-apply-scope', 'sch-subject'].forEach(syncSchedulerPickerSelect);
        schCheckConflict();
    }

    function closeSchModal() {
        closeSchedulerPresetManager();
        if (typeof window.closePickerPanels === 'function') {
            window.closePickerPanels();
        }
        const modal = el('schModalOverlay');
        if (modal) modal.classList.remove('open');
        setSchModalMode('create');
        const button = el('sch-create-btn');
        if (button) button.classList.remove('is-success-state');
        ['sch-group', 'sch-room', 'sch-prof', 'sch-ta'].forEach((id) => {
            const field = el(id);
            if (field) field.value = '';
        });
        if (el('sch-session-type')) {
            el('sch-session-type').value = 'lecture';
            el('sch-session-type').dataset.userSet = '0';
        }
        clearSchedulerConflictState();
    }

    function schCalcEnd() {
        const timeField = el('sch-time');
        const durationField = el('sch-duration');
        const endField = el('sch-endtime');
        if (!timeField || !durationField || !endField || !timeField.value || durationField.value === 'custom') return;
        const startMinutes = convertTimeToMinutes(timeField.value);
        const durationMinutes = parseInt(durationField.value || '110', 10);
        if (!Number.isFinite(startMinutes) || !Number.isFinite(durationMinutes)) return;
        endField.value = minutesToTimeString(startMinutes + durationMinutes);
    }

    function findScheduleConflict(kind, actor, day, start, end, excludeKey, weekStart) {
        if (!actor || actor === 'TBD' || !day || !start) return null;
        if (kind === 'professor' && typeof checkProfessorOverlap === 'function') {
            return checkProfessorOverlap(actor, day, start, end, excludeKey, weekStart);
        }
        if (kind === 'room' && typeof checkRoomOverlap === 'function') {
            return checkRoomOverlap(actor, day, start, end, excludeKey, weekStart);
        }
        const allSessions = getAvailableScheduleItemsForWeek(weekStart);
        return allSessions.find((session) => {
            if (kind === 'professor' && session.prof !== actor) return false;
            if (kind === 'room' && session.room !== actor) return false;
            if (excludeKey && `${session.courseId}::${String(session.id).toLowerCase()}` === excludeKey) return false;
            if (normalizeSchedulerDayLabel(session.day, 'ge') !== day) return false;
            const startMinutes = convertTimeToMinutes(start);
            const endMinutes = convertTimeToMinutes(end);
            const sessionStart = convertTimeToMinutes(session.time);
            const sessionEnd = convertTimeToMinutes(session.endTime || session.time);
            return startMinutes < sessionEnd && endMinutes > sessionStart;
        }) || null;
    }

    function buildSchedulerEmptyState(message) {
        const state = document.createElement('div');
        state.className = 'sch-empty-state lux-summary-surface lux-summary-surface--panel';
        state.textContent = message;
        return state;
    }

    function buildSchedulerPaletteCard(subject, facultyCode, isActive) {
        const toneToken = getSchedulerEventToneToken(facultyCode);
        const tone = getSchedulerFacultyTone(facultyCode);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `palette-card lux-strip-card surface-card lux-summary-surface lux-summary-surface--panel${isActive ? ' selected' : ''}`;
        card.dataset.schedulerSubjectId = subject.id;
        card.dataset.schPaletteTone = toneToken;
        card.style.setProperty('--sch-event-rgb', tone.rgb);

        const id = document.createElement('div');
        id.className = 'pc-id';
        id.textContent = subject.id;

        const name = document.createElement('div');
        name.className = 'pc-name';
        name.textContent = subject.name;

        const meta = document.createElement('div');
        meta.className = 'pc-meta';
        meta.textContent = `ECTS: ${subject.ects || '?'} · Sem ${subject.semester || '?'} · ${facultyCode}`;

        card.append(id, name, meta);
        return card;
    }

    function buildSchedulerDayHeader(entry, isToday) {
        const dayCol = document.createElement('div');
        dayCol.className = `sch-day-col${isToday ? ' is-today' : ''}`;

        const title = document.createElement('div');
        title.className = 'sch-day-col-label';
        title.textContent = entry.en;

        const meta = document.createElement('div');
        meta.className = 'sch-day-col-meta';
        meta.textContent = entry.shortDate;
        dayCol.append(title, meta);
        return dayCol;
    }

    function buildSchedulerTimeSlot(slot) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'sch-time-slot';
        const label = document.createElement('span');
        label.className = 'sch-time-slot-copy';
        label.textContent = slot;
        timeSlot.appendChild(label);
        return timeSlot;
    }

    function buildSchedulerSlotBackground(entry, slot, semester, weekStart) {
        const slotNode = document.createElement('div');
        slotNode.className = 'sch-slot-bg';
        slotNode.dataset.schedulerSlotDay = entry.en;
        slotNode.dataset.schedulerSlotTime = slot;
        slotNode.dataset.schedulerSlotSemester = String(semester);
        slotNode.dataset.schedulerSlotWeek = weekStart;
        return slotNode;
    }

    function buildSchedulerEventMeta(iconClass, content) {
        const meta = document.createElement('div');
        meta.className = 'ev-meta';

        const icon = document.createElement('i');
        icon.className = iconClass;
        meta.appendChild(icon);
        meta.appendChild(document.createTextNode(' '));

        if (content instanceof Node) {
            meta.appendChild(content);
        } else {
            meta.appendChild(document.createTextNode(String(content || '')));
        }

        return meta;
    }

    function buildSchedulerEventAction(action, courseId, groupId, iconClass) {
        const actionNode = document.createElement('div');
        actionNode.className = `ev-trash ev-action ev-action--${action}`;
        actionNode.dataset.schedulerSessionAction = action;
        actionNode.dataset.courseId = courseId;
        actionNode.dataset.groupId = groupId;

        const icon = document.createElement('i');
        icon.className = iconClass;
        actionNode.appendChild(icon);
        return actionNode;
    }

    function getSchedulerEventToneToken(facultyCode) {
        switch (normalizeFacultyCode(facultyCode || 'ECON')) {
            case 'CS': return 'cs';
            case 'LAW': return 'law';
            case 'MED': return 'med';
            case 'ARTS': return 'arts';
            default: return 'econ';
        }
    }

    function buildSchedulerEventCard(session, weekStart) {
        const startMinutes = convertTimeToMinutes(session.time) - SCHEDULER_START_MINUTES;
        const topPx = (startMinutes / 60) * 100;
        const durationMinutes = parseInt(String(session.duration || '110').match(/\d+/)?.[0] || '110', 10);
        const heightPx = Math.max(40, (durationMinutes / 60) * 100 - 4);
        const facultyCode = normalizeFacultyCode(session.faculty || deriveFaculty(session.courseId));
        const toneToken = getSchedulerEventToneToken(facultyCode);
        const tone = getSchedulerFacultyTone(facultyCode);
        const isDraft = session.prof === 'TBD' || session.room === 'TBD';

        const card = document.createElement('div');
        card.className = 'sch-event';
        card.style.setProperty('--sch-event-top', `${topPx}px`);
        card.style.setProperty('--sch-event-height', `${heightPx}px`);
        card.style.setProperty('--sch-event-rgb', tone.rgb);
        card.dataset.schedulerSessionAction = 'edit';
        card.dataset.courseId = session.courseId;
        card.dataset.groupId = session.id;
        card.dataset.weekStart = weekStart;
        card.dataset.schEventTone = toneToken;
        if (isDraft) card.classList.add('is-draft');
        if (session.isWeekOverride) card.classList.add('is-week-override');

        if (isDraft || session.isWeekOverride) {
            const badge = document.createElement('div');
            badge.className = 'ev-draft';
            if (isDraft) {
                badge.textContent = 'DRAFT';
            } else {
                badge.classList.add('is-week-override');
                badge.textContent = 'WEEK';
            }
            card.appendChild(badge);
        }

        const title = document.createElement('div');
        title.className = 'ev-title';
        title.textContent = session.courseId;

        const titleMeta = document.createElement('span');
        titleMeta.className = 'ev-title-meta';
        titleMeta.textContent = `(${session.id})`;
        title.appendChild(document.createTextNode(' '));
        title.appendChild(titleMeta);
        card.appendChild(title);

        const professorContent = session.prof === 'TBD'
            ? (() => {
                const missing = document.createElement('span');
                missing.className = 'ev-value is-missing';
                missing.textContent = 'No Professor';
                return missing;
            })()
            : session.prof;
        card.appendChild(buildSchedulerEventMeta('fas fa-user-circle', professorContent));

        const roomWrapper = document.createElement('span');
        if (session.room === 'TBD') {
            const missingRoom = document.createElement('span');
            missingRoom.className = 'ev-value is-missing';
            missingRoom.textContent = 'No Room';
            roomWrapper.appendChild(missingRoom);
        } else {
            roomWrapper.appendChild(document.createTextNode(session.room));
        }
        const duration = document.createElement('span');
        duration.className = 'ev-duration';
        duration.textContent = ` · ${session.duration}`;
        roomWrapper.appendChild(duration);
        card.appendChild(buildSchedulerEventMeta('fas fa-map-marker-alt', roomWrapper));

        card.appendChild(buildSchedulerEventAction('stats', session.courseId, session.id, 'fas fa-circle-info'));
        card.appendChild(buildSchedulerEventAction('delete', session.courseId, session.id, 'fas fa-trash'));
        return card;
    }

    function buildSchedulerInfoBanner(message) {
        const banner = document.createElement('div');
        banner.className = 'sch-info-banner lux-summary-surface lux-summary-surface--panel';
        banner.textContent = message;
        return banner;
    }

    function buildSchedulerEmptyWeekNotice(weekStart) {
        const empty = document.createElement('div');
        empty.className = 'sch-empty-week-notice lux-summary-surface lux-summary-surface--panel';
        empty.textContent = `No sessions scheduled for ${formatWeekRangeLabel(weekStart)}.`;
        return empty;
    }

    function applySchedulerConflictState(state, text, iconClass) {
        const messageBox = el('sch-conflict-msg');
        const textNode = el('sch-conflict-text');
        const iconNode = el('sch-conflict-icon');
        if (!messageBox || !textNode || !iconNode) return;
        messageBox.dataset.conflictState = state;
        textNode.textContent = text;
        iconNode.className = iconClass;
        messageBox.classList.add('show');
    }

    function clearSchedulerConflictState() {
        const messageBox = el('sch-conflict-msg');
        if (!messageBox) return;
        messageBox.dataset.conflictState = 'hidden';
        messageBox.classList.remove('show');
    }

    function schCheckConflict() {
        const courseId = el('sch-subject')?.value?.trim();
        const groupId = el('sch-group')?.value?.trim();
        const professor = el('sch-prof')?.value?.trim();
        const room = el('sch-room')?.value?.trim();
        const day = normalizeSchedulerDayLabel(el('sch-day')?.value, 'ge');
        const time = normalizeTimeString(el('sch-time')?.value, '');
        const end = normalizeTimeString(el('sch-endtime')?.value, '');
        const weekStart = el('sch-weekstart-hidden')?.value || getSchedulerWeekStart();
        const isEdit = el('sch-edit-mode')?.value === 'edit';
        const originalCourse = el('sch-edit-course')?.value || '';
        const originalGroup = el('sch-edit-group')?.value || '';

        if (!day || !time) {
            clearSchedulerConflictState();
            return;
        }

        const excludeKey = isEdit && originalCourse && originalGroup
            ? `${originalCourse}::${originalGroup.toLowerCase()}`
            : (courseId && groupId ? `${courseId}::${groupId.toLowerCase()}` : null);
        const professorOverlap = findScheduleConflict('professor', professor, day, time, end, excludeKey, weekStart);
        if (professorOverlap) {
            applySchedulerConflictState(
                'danger',
                `Conflict: ${professor} already has ${professorOverlap.courseId} (${professorOverlap.id}) scheduled during ${formatWeekRangeLabel(weekStart)}.`,
                'fas fa-exclamation-triangle'
            );
            return;
        }

        const roomOverlap = findScheduleConflict('room', room, day, time, end, excludeKey, weekStart);
        if (roomOverlap) {
            applySchedulerConflictState(
                'danger',
                `Conflict: Room ${room} is already booked for ${roomOverlap.courseId} (${roomOverlap.id}) during ${formatWeekRangeLabel(weekStart)}.`,
                'fas fa-exclamation-triangle'
            );
            return;
        }

        const hasPreviewableAssignment = Boolean(professor || room);
        if (!hasPreviewableAssignment) {
            clearSchedulerConflictState();
            return;
        }

        const previewParts = [];
        if (professor) previewParts.push(`Professor ${professor}`);
        if (room) previewParts.push(`Room ${room}`);
        applySchedulerConflictState(
            'success',
            `${previewParts.join(' and ')} ${previewParts.length === 1 ? 'is' : 'are'} clear for ${normalizeSchedulerDayLabel(day, 'en')} ${time}${end ? `-${end}` : ''}.`,
            'fas fa-circle-check'
        );
    }

    function renderGrid() {
        const container = el('scheduler-grid');
        if (!container) return;

        const weekStart = getSchedulerWeekStart();
        const weekEntries = getWeekDateEntries(weekStart);
        const semester = parseInt(el('admin-tt-semester')?.value || '3', 10);
        const profFilter = el('admin-tt-prof')?.value || 'all';
        const taFilter = el('admin-tt-ta')?.value || 'all';
        const sessions = getVisibleSchedulerSessions();
        const isCurrentWeek = weekStart === getCurrentWeekStartISO();

        syncSchedulerWeekChrome();

        const root = document.createElement('div');
        root.className = 'sch-grid-root';
        root.dataset.schedulerWeekState = isCurrentWeek ? 'current' : 'selected';

        const headerRow = document.createElement('div');
        headerRow.className = 'sch-header-row';
        const timezoneCol = document.createElement('div');
        timezoneCol.className = 'sch-time-col sch-time-col--header';
        const timezoneCopy = document.createElement('div');
        timezoneCopy.className = 'sch-time-col-copy';
        timezoneCopy.textContent = 'GMT+4';
        timezoneCol.appendChild(timezoneCopy);
        headerRow.appendChild(timezoneCol);

        weekEntries.forEach((entry, index) => {
            const isToday = isCurrentWeek && (new Date().getDay() === (index === 6 ? 0 : index + 1));
            headerRow.appendChild(buildSchedulerDayHeader(entry, isToday));
        });
        root.appendChild(headerRow);

        const body = document.createElement('div');
        body.className = 'sch-body';
        const timeLabels = document.createElement('div');
        timeLabels.className = 'sch-time-labels';
        SLOT_TIMES.forEach((slot) => {
            timeLabels.appendChild(buildSchedulerTimeSlot(slot));
        });

        const dayLanes = document.createElement('div');
        dayLanes.className = 'sch-day-lanes';
        weekEntries.forEach((entry) => {
            const lane = document.createElement('div');
            lane.className = 'sch-lane';
            SLOT_TIMES.forEach((slot) => {
                lane.appendChild(buildSchedulerSlotBackground(entry, slot, semester, weekStart));
            });

            const daySessions = sessions.filter((session) => normalizeSchedulerDayLabel(session.day, 'en') === entry.en);
            daySessions.forEach((session) => {
                lane.appendChild(buildSchedulerEventCard(session, weekStart));
            });
            dayLanes.appendChild(lane);
        });

        body.append(timeLabels, dayLanes);
        root.appendChild(body);

        const fragment = document.createDocumentFragment();
        fragment.appendChild(root);

        if (profFilter === 'all' && taFilter === 'all') {
            fragment.appendChild(buildSchedulerInfoBanner('Showing all staff for this faculty and semester. Select a professor or teaching assistant only if you want a narrower view.'));
        }

        if (!sessions.length) {
            fragment.appendChild(buildSchedulerEmptyWeekNotice(weekStart));
        }

        container.replaceChildren(fragment);
        updateSchedulerRailChrome();
    }
    function schShowStats(courseId, groupId) {
        const session = resolveScheduledGroupForWeek(courseId, groupId, getSchedulerWeekStart());
        if (!session) return;
        const enrolled = session.registered || 0;
        const percentage = session.capacity ? Math.round((enrolled / session.capacity) * 100) : 0;
        alert(`Session Details\n\nSubject: ${courseId}\nGroup: ${session.name}\nWeek: ${formatWeekRangeLabel(session.weekStart || getSchedulerWeekStart())}\nDay: ${normalizeSchedulerDayLabel(session.day, 'en')} ${session.time}-${session.endTime || ''}\nRoom: ${session.room}\nProfessor: ${session.prof}\nTA: ${session.ta || 'None'}\nCapacity: ${enrolled}/${session.capacity} (${percentage}%)\nStatus: ${percentage > 90 ? 'Near Full' : 'Open'}${session.isWeekOverride ? '\nMode: Selected week override' : '\nMode: Recurring template'}`);
    }

    function schDeleteSession(courseId, groupId) {
        const visibleSession = resolveScheduledGroupForWeek(courseId, groupId, getSchedulerWeekStart());
        if (!visibleSession) return;
        const message = visibleSession.isWeekOverride
            ? `Delete only the ${formatWeekRangeLabel(visibleSession.weekStart || getSchedulerWeekStart())} override for [${groupId}] in ${courseId}?`
            : `Delete the recurring session [${groupId}] for ${courseId}? Enrolled students will be unenrolled.`;
        if (!confirm(message)) return;
        deleteScheduledSession(courseId, groupId, getSchedulerWeekStart(), visibleSession.isWeekOverride ? 'week-only' : 'visible');
        saveState();
        renderGrid();
    }

    function schCreateSession() {
        const isEdit = el('sch-edit-mode')?.value === 'edit';
        const originalCourseId = el('sch-edit-course')?.value || '';
        const originalGroupId = String(el('sch-edit-group')?.value || '').toLowerCase();
        const originalWeekStart = el('sch-edit-weekstart')?.value || getSchedulerWeekStart();
        const originalWasOverride = el('sch-edit-was-override')?.value === '1';

        const courseId = el('sch-subject')?.value?.trim();
        const groupName = el('sch-group')?.value?.trim();
        const day = normalizeSchedulerDayLabel(el('sch-day')?.value, 'ge');
        const time = normalizeTimeString(el('sch-time')?.value, '');
        let endTime = normalizeTimeString(el('sch-endtime')?.value, '');
        let durationMinutes = parseInt(el('sch-duration')?.value, 10);

        if (Number.isNaN(durationMinutes) || el('sch-duration')?.value === 'custom') {
            durationMinutes = convertTimeToMinutes(endTime) - convertTimeToMinutes(time);
            if (durationMinutes <= 0) durationMinutes = 60;
        }
        if (!endTime) {
            endTime = minutesToTimeString(convertTimeToMinutes(time) + durationMinutes);
        }

        const room = el('sch-room')?.value?.trim() || 'TBD';
        const professor = el('sch-prof')?.value?.trim() || 'TBD';
        const ta = el('sch-ta')?.value?.trim() || '';
        const sessionType = typeof inferSchedulerSessionType === 'function'
            ? inferSchedulerSessionType(professor, ta, el('sch-session-type')?.value || 'lecture')
            : (String(el('sch-session-type')?.value || 'lecture').toLowerCase() === 'seminar' ? 'seminar' : 'lecture');
        const capacity = parseInt(el('sch-capacity')?.value || '40', 10) || 40;
        const semester = parseInt(el('sch-semester-hidden')?.value || '3', 10) || 3;
        const weekStart = el('sch-weekstart-hidden')?.value || getSchedulerWeekStart();
        const applyScope = el('sch-apply-scope')?.value || 'selected-week';
        const normalizedGroupId = String(groupName || '').toLowerCase();
        const faculty = normalizeFacultyCode(el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON');

        if (!courseId || courseId === '- Add subjects from Curriculum CMS first -') {
            alert('Please select a subject. If empty, add subjects from Curriculum CMS first.');
            return;
        }
        if (!groupName) {
            alert('Please enter a Group ID (e.g. G1).');
            return;
        }
        if (!day || !time) {
            alert('Day and time are required.');
            return;
        }

        const excludeKey = isEdit && originalCourseId && originalGroupId
            ? `${originalCourseId}::${originalGroupId}`
            : `${courseId}::${normalizedGroupId}`;

        const professorOverlap = findScheduleConflict('professor', professor, day, time, endTime, excludeKey, weekStart);
        if (professorOverlap) {
            alert(`CONFLICT: ${professor} is already scheduled for ${professorOverlap.courseId} at this time.`);
            return;
        }

        const roomOverlap = findScheduleConflict('room', room, day, time, endTime, excludeKey, weekStart);
        if (roomOverlap) {
            alert(`CONFLICT: Room ${room} is already booked for ${roomOverlap.courseId} at this time.`);
            return;
        }

        const result = upsertScheduledSession(courseId, {
            id: normalizedGroupId,
            name: groupName,
            faculty,
            semester,
            day,
            time,
            endTime,
            prof: professor,
            ta,
            room,
            duration: `${durationMinutes}min`,
            sessionType,
            capacity,
            registered: 0
        }, {
            weekStart,
            scope: applyScope
        });

        if (!result?.group) {
            alert('Unable to save this session. Please verify the subject and group details.');
            return;
        }

        const movedSession = isEdit
            && originalCourseId
            && originalGroupId
            && (originalCourseId !== courseId || originalGroupId !== normalizedGroupId);

        if (movedSession && typeof migrateStudentSchedulesForScheduledGroup === 'function') {
            migrateStudentSchedulesForScheduledGroup(originalCourseId, originalGroupId, courseId, result.group);
        }

        if (movedSession && (originalWasOverride || applyScope === 'recurring')) {
            deleteScheduledSession(
                originalCourseId,
                originalGroupId,
                originalWeekStart,
                originalWasOverride ? 'week-only' : 'visible'
            );
        } else if (isEdit && !movedSession && originalWasOverride && applyScope === 'recurring') {
            deleteScheduledSession(courseId, normalizedGroupId, originalWeekStart, 'week-only');
        }

        saveState();
        closeSchModal();

        const profFilter = el('admin-tt-prof');
        const taFilter = el('admin-tt-ta');
        const currentProfFilter = profFilter?.value || 'all';
        const currentTaFilter = taFilter?.value || 'all';
        const hiddenByFilters = (currentProfFilter !== 'all' && professor !== currentProfFilter)
            || (currentTaFilter !== 'all' && ta !== currentTaFilter);

        if (hiddenByFilters) {
            if (profFilter) profFilter.value = 'all';
            if (taFilter) taFilter.value = 'all';
        }

        renderGrid();

        const button = el('sch-create-btn');
        if (button) {
            const originalHtml = button.innerHTML;
            button.innerHTML = `<i class="fas fa-check"></i> ${isEdit ? 'Session Updated!' : 'Session Created!'}`;
            button.classList.add('is-success-state');
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('is-success-state');
            }, 2000);
        }
    }

    function syncSchedulerFacultyScope(facultyValue) {
        normalizeSchedulerSelectOptions();
        const normalizedFaculty = facultyValue === 'all'
            ? 'all'
            : normalizeFacultyCode(facultyValue, getCurrentFaculty());

        if (el('admin-tt-faculty')) el('admin-tt-faculty').value = normalizedFaculty;

        if (normalizedFaculty !== 'all') {
            localStorage.setItem('currentFaculty', normalizedFaculty);
            if (typeof switchFacultyTheme === 'function') {
                switchFacultyTheme(normalizedFaculty, { refreshDependentViews: false });
            }
        }

        selectedPaletteSubject = null;
        window.selectedPaletteSubject = null;

        populateProfList();
        queueSchedulerRefresh({ palette: true, grid: true });
    }

    function changeSchedulerWeek(offset) {
        setStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY, shiftWeekStartISO(getSchedulerWeekStart(), offset));
        queueSchedulerRefresh({ grid: true });
    }

    function jumpSchedulerToCurrentWeek() {
        setStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY, getCurrentWeekStartISO());
        queueSchedulerRefresh({ grid: true });
    }

    function openSchedulerQuickCreate() {
        const semester = parseInt(el('admin-tt-semester')?.value || '3', 10);
        openSchModal('Monday', '09:00', semester, getSchedulerWeekStart());
    }

    function focusSchedulerPalette() {
        const list = el('palette-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const search = el('palette-search');
        if (search) search.focus({ preventScroll: true });
    }

    function resetSchedulerRail() {
        normalizeSchedulerSelectOptions();
        const faculty = localStorage.getItem('currentFaculty') || 'ECON';
        const semester = String((typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3);
        if (el('admin-tt-faculty')) el('admin-tt-faculty').value = faculty;
        if (el('admin-tt-semester')) el('admin-tt-semester').value = semester;
        if (el('admin-tt-prof')) el('admin-tt-prof').value = 'all';
        if (el('admin-tt-ta')) el('admin-tt-ta').value = 'all';
        if (el('palette-search')) el('palette-search').value = '';
        selectedPaletteSubject = null;
        window.selectedPaletteSubject = null;
        syncSchedulerFacultyScope(faculty);
    }

    function bindSchedulerListeners() {
        bindNodeOnce(el('admin-tt-faculty'), 'change', 'schedulerFacultyBound', (event) => {
            syncSchedulerFacultyScope(event.target.value);
        });
        bindNodeOnce(el('admin-tt-semester'), 'change', 'schedulerSemesterBound', () => {
            selectedPaletteSubject = null;
            queueSchedulerRefresh({ palette: true, grid: true });
        });
        bindNodeOnce(el('admin-tt-prof'), 'change', 'schedulerProfBound', () => {
            if (el('admin-tt-prof')?.value !== 'all' && el('admin-tt-ta')) {
                el('admin-tt-ta').value = 'all';
            }
            queueSchedulerRefresh({ grid: true });
        });
        bindNodeOnce(el('admin-tt-ta'), 'change', 'schedulerTaBound', () => {
            if (el('admin-tt-ta')?.value !== 'all' && el('admin-tt-prof')) {
                el('admin-tt-prof').value = 'all';
            }
            queueSchedulerRefresh({ grid: true });
        });
        bindNodeOnce(el('palette-search'), 'input', 'schedulerPaletteSearchBound', () => {
            if (schedulerPaletteSearchHandle) window.clearTimeout(schedulerPaletteSearchHandle);
            schedulerPaletteSearchHandle = window.setTimeout(() => {
                schedulerPaletteSearchHandle = 0;
                queueSchedulerRefresh({ palette: true });
            }, SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS);
        });
        bindNodeOnce(el('palette-list'), 'click', 'schedulerPaletteClickBound', (event) => {
            const card = event.target.closest('[data-scheduler-subject-id]');
            if (!card) return;
            event.preventDefault();
            selectPaletteItem(card.dataset.schedulerSubjectId);
        });
        bindNodeOnce(el('scheduler-grid'), 'click', 'schedulerGridClickBound', (event) => {
            const actionNode = event.target.closest('[data-scheduler-session-action]');
            if (actionNode) {
                event.preventDefault();
                event.stopPropagation();
                const action = actionNode.dataset.schedulerSessionAction || '';
                const courseId = actionNode.dataset.courseId || '';
                const groupId = actionNode.dataset.groupId || '';
                const weekStart = actionNode.dataset.weekStart || getSchedulerWeekStart();
                if (action === 'edit') openSchEditModal(courseId, groupId, weekStart);
                if (action === 'stats') schShowStats(courseId, groupId);
                if (action === 'delete') schDeleteSession(courseId, groupId);
                return;
            }

            const slotNode = event.target.closest('[data-scheduler-slot-day]');
            if (!slotNode) return;
            event.preventDefault();
            openSchModal(
                slotNode.dataset.schedulerSlotDay || 'Monday',
                slotNode.dataset.schedulerSlotTime || '09:00',
                parseInt(slotNode.dataset.schedulerSlotSemester || '3', 10) || 3,
                slotNode.dataset.schedulerSlotWeek || getSchedulerWeekStart()
            );
        });

        document.querySelectorAll('[data-admin-scheduler-week]').forEach((button) => {
            bindNodeOnce(button, 'click', 'schedulerWeekActionBound', (event) => {
                event.preventDefault();
                const action = button.dataset.adminSchedulerWeek || '';
                if (action === 'prev') changeSchedulerWeek(-1);
                if (action === 'next') changeSchedulerWeek(1);
                if (action === 'current') jumpSchedulerToCurrentWeek();
            });
        });
    }

    function initializeAdminSchedulerPage() {
        if (schedulerInitialized) return;
        schedulerInitialized = true;

        if (typeof requireAuth === 'function' && !window.__adminSchedulerAuthChecked) {
            window.__adminSchedulerAuthChecked = true;
            requireAuth();
        }

        const appContent = el('app-content');
        const schedulerPage = el('page-admin-scheduler');
        if (appContent && schedulerPage) {
            Array.from(appContent.children).forEach((child) => {
                if (child !== schedulerPage && child.classList?.contains('page-section')) {
                    child.remove();
                }
            });
            schedulerPage.hidden = false;
            schedulerPage.style.display = 'block';
            schedulerPage.classList.add('active-page');
            if (schedulerPage.parentElement !== appContent) {
                appContent.prepend(schedulerPage);
            }
            if (typeof invalidateDomCache === 'function') {
                invalidateDomCache();
            }
        }

        document.body.classList.remove('lux-home-page', 'lux-route-home', 'kiu-shell-loading');
        document.body.classList.add('lux-unified-shell', 'lux-nonhome-page', 'lux-route-admin-scheduler');
        document.body.dataset.luxPage = 'admin-scheduler';
        document.body.dataset.luxEntry = 'admin-scheduler';
        document.body.dataset.luxFamily = 'admin';
        document.body.classList.remove('kiu-shell-loading');

        const currentFaculty = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        normalizeSchedulerSelectOptions();
        if (el('admin-tt-faculty')) el('admin-tt-faculty').value = currentFaculty;

        if (el('admin-tt-semester')) {
            el('admin-tt-semester').value = String((typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3);
        }

        bindSchedulerListeners();
        populateProfList();
        queueSchedulerRefresh({ palette: true, grid: true });


        window.dispatchEvent(new CustomEvent('kiu:scheduler-ready'));
    }

    window.selectedPaletteSubject = selectedPaletteSubject;
    window.getSchedulerWeekStart = getSchedulerWeekStart;
    window.syncSchedulerWeekChrome = syncSchedulerWeekChrome;
    window.changeSchedulerWeek = changeSchedulerWeek;
    window.jumpSchedulerToCurrentWeek = jumpSchedulerToCurrentWeek;
    window.syncSchedulerFacultyScope = syncSchedulerFacultyScope;
    window.populateProfList = populateProfList;
    window.getSchedulerPaletteSubjects = getSchedulerPaletteSubjects;
    window.getSchedulerFacultyTone = getSchedulerFacultyTone;
    window.renderPalette = renderPalette;
    window.selectPaletteItem = selectPaletteItem;
    window.normalizeSchedulerDayLabel = normalizeSchedulerDayLabel;
    window.openSchModal = openSchModal;
    window.openSchEditModal = openSchEditModal;
    window.closeSchModal = closeSchModal;
    window.schCalcEnd = schCalcEnd;
    window.schCheckConflict = schCheckConflict;
    window.renderGrid = renderGrid;
    window.schShowStats = schShowStats;
    window.schDeleteSession = schDeleteSession;
    window.schCreateSession = schCreateSession;
    window.updateSchedulerRailChrome = updateSchedulerRailChrome;
    window.openSchedulerQuickCreate = openSchedulerQuickCreate;
    window.focusSchedulerPalette = focusSchedulerPalette;
    window.resetSchedulerRail = resetSchedulerRail;
    window.initializeAdminSchedulerPage = initializeAdminSchedulerPage;
    window.openProfQuizModal = openProfQuizModal;
    window.closeProfQuizModal = closeProfQuizModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdminSchedulerPage, { once: true });
    } else {
        initializeAdminSchedulerPage();
    }
})();


