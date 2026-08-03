/* READABILITY: Admin scheduler — grid, sessions, faculty scope, create/edit session flows. Sections: Boot | Grid | Sessions | Faculty | Handlers. */
window.KiuAdminScheduler=window.KiuAdminScheduler||{};const __kiuSchedApi=window.KiuAdminScheduler;window.__kiuSchedApi=__kiuSchedApi;
function __kiuSchedExpose(map){Object.keys(map).forEach((k)=>{__kiuSchedApi[k]=map[k];window[k]=map[k];});}

// --- READABILITY: Boot ---
(function initAdminSchedulerController() {
    'use strict';
    const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const SCHEDULER_FACULTY_OPTIONS = [
        ['ECON', 'Management'],
        ['CS', 'Computer Science'],
        ['LAW', 'Law'],
        ['MED', 'Medicine'],
        ['ARTS', 'Arts & Humanities'],
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
    const SCHEDULER_QUIZ_RUNTIME_SRC = 'assets/js/pages/admin-scheduler-quiz-runtime.js?v=20260726-schedclean2';
    const SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS = 120;
// --- READABILITY: Sessions ---
    const SCHEDULER_SESSION_PRESETS_KEY = 'kiuSchedulerSessionPresets';
    const SCHEDULER_DEFAULT_GROUP_PRESETS = ['G1', 'G2', 'G3', 'G4', 'L1', 'L2', 'Lab-1'];
    const SCHEDULER_DEFAULT_ROOM_PRESETS = ['A-101', 'A-102', 'A-201', 'B-201', 'B-202', 'C-301', 'C-303', 'K-201', 'LAB-1', 'LAB-2'];
    let selectedPaletteSubject = null;
    let schedulerInitialized = false;
    let schedulerQuizApiPromise = null;
    let schedulerPaletteSearchHandle = 0;
    let schedulerPresetSearchHandle = 0;
    let schedulerRefreshHandle = 0;
    let schedulerRevealShellQueued = false;
    let schedulerStaffPickerState = {
        role: 'professor',
        targetId: '',
        records: [],
        selectedId: '',
        query: '',
        activeSectionId: '',
        profileSections: new Map(),
        profileSectionsByType: new Map(),
        profileMarkup: new Map()
    };
// --- READABILITY: Grid ---
    let schedulerRefreshQueued = { palette: false, grid: false, paletteSearchOnly: false };
    function el(id) {
        return document.getElementById(id);
    }
    function setText(id, value) {
        const node = el(id);
        if (node) node.textContent = value;
    }
// --- READABILITY: Handlers ---
    function bindNodeOnce(node, eventName, marker, handler) {
        if (!node || node.dataset[marker]) return;
        node.dataset[marker] = '1';
        node.addEventListener(eventName, handler);
    }
    function runWithLuxuryObserversPaused(callback) {
        if (typeof window.pauseLuxuryVisualObservers === 'function') {
            window.pauseLuxuryVisualObservers();
        }
        try {
            callback();
        } finally {
            const resume = () => {
                if (typeof window.resumeLuxuryVisualObservers === 'function') {
                    window.resumeLuxuryVisualObservers();
                }
            };
            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(resume);
            } else {
                resume();
            }
        }
    }
    function queueSchedulerRefresh(options = {}) {
        schedulerRefreshQueued.palette = schedulerRefreshQueued.palette || options.palette === true;
        schedulerRefreshQueued.grid = schedulerRefreshQueued.grid || options.grid === true;
        schedulerRefreshQueued.paletteSearchOnly = schedulerRefreshQueued.paletteSearchOnly
            || (options.paletteSearchOnly === true && options.palette !== false);
        schedulerRevealShellQueued = schedulerRevealShellQueued || options.revealShell === true;
        if (schedulerRefreshHandle) return;
        const schedule = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (callback) => window.setTimeout(callback, 16);
        schedulerRefreshHandle = schedule(() => {
            schedulerRefreshHandle = 0;
            const runPalette = schedulerRefreshQueued.palette;
            const runGrid = schedulerRefreshQueued.grid;
            const paletteSearchOnly = schedulerRefreshQueued.paletteSearchOnly;
            const revealShell = schedulerRevealShellQueued;
            schedulerRefreshQueued = { palette: false, grid: false, paletteSearchOnly: false };
            schedulerRevealShellQueued = false;
            if (runPalette) renderPalette({ searchOnly: paletteSearchOnly });
            if (runGrid) renderGrid();
            if (revealShell) {
                if (typeof schedulePortalShellReadyReveal === 'function') {
                    schedulePortalShellReadyReveal();
                } else if (typeof markPortalShellReady === 'function') {
                    markPortalShellReady();
                }
            }
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

    function openSchedulerPortalModal(overlay, options = {}) {
        if (!overlay || typeof window.openLuxPortalModal !== 'function') return;
        const { refreshTransparency = true, ...modalOptions } = options;
        window.openLuxPortalModal(overlay, { scrollLock: true, ...modalOptions });
        if (refreshTransparency && typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [overlay] });
        }
    }

    function closeSchedulerPortalModal(overlay, options = {}) {
        if (!overlay || typeof window.closeLuxPortalModal !== 'function') return;
        window.closeLuxPortalModal(overlay, { remove: false, scrollLock: true, ...options });
    }

    function isStandaloneAdminSchedulerPage() {
        return /admin-scheduler(?:\.html)?$/i.test(String(window.location.pathname || ''));
    }

    function loadSchedulerQuizApi() {
        if (window.__kiuAdminSchedulerQuizApi) {
            return Promise.resolve(window.__kiuAdminSchedulerQuizApi);
        }
        if (!schedulerQuizApiPromise) {
            schedulerQuizApiPromise = new Promise((resolve, reject) => {
                if (typeof window.__kiuCreateAdminSchedulerQuizApi === 'function') {
                    const api = window.__kiuCreateAdminSchedulerQuizApi({
                        el, setText, bindNodeOnce,
                        openSchedulerPortalModal, closeSchedulerPortalModal,
                        saveState: (...args) => (typeof saveState === 'function' ? saveState(...args) : window.saveState?.(...args)),
                    });
                    window.__kiuAdminSchedulerQuizApi = api;
                    resolve(api);
                    return;
                }
                const script = document.createElement('script');
                script.src = SCHEDULER_QUIZ_RUNTIME_SRC;
                script.defer = true;
                script.onload = () => {
                    const factory = window.__kiuCreateAdminSchedulerQuizApi;
                    if (typeof factory !== 'function') {
                        reject(new Error('admin-scheduler-quiz-runtime.js missing'));
                        return;
                    }
                    const api = factory({
                        el, setText, bindNodeOnce,
                        openSchedulerPortalModal, closeSchedulerPortalModal,
                        saveState: (...args) => (typeof saveState === 'function' ? saveState(...args) : window.saveState?.(...args)),
                    });
                    window.__kiuAdminSchedulerQuizApi = api;
                    resolve(api);
                };
                script.onerror = () => reject(new Error('admin-scheduler-quiz-runtime.js failed to load'));
                document.head.appendChild(script);
            });
        }
        return schedulerQuizApiPromise;
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
            item.className = 'sch-preset-manage-item home-hover-chip';
            item.setAttribute('role', 'listitem');
            const lowerName = name.toLowerCase();
            const badges = [];
            if (storedKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--saved">Saved</span>');
            if (allDefaultKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--default">Default</span>');
            if (harvestedKeys.has(lowerName)) badges.push('<span class="sch-preset-manage-badge sch-preset-manage-badge--schedule">In schedule</span>');
            const actionButtons = [];
            if (storedKeys.has(lowerName) || visibleDefaultKeys.has(lowerName)) {
                actionButtons.push(`<button type="button" class="lux-secondary-btn sch-preset-manage-delete-btn" data-scheduler-preset-remove="${escapeSchedulerPresetHtml(name)}" aria-label="Remove ${escapeSchedulerPresetHtml(name)}"><i class="fas fa-trash-alt"></i></button>`);
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
        closeSchedulerPortalModal(overlay, { scrollLock: false });
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
        bindSchedulerPresetManagerListeners(overlay);
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
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(overlay);
        }
        openSchedulerPortalModal(overlay, { focusSelector: '#sch-preset-search' });
    }

    function normalizeSchedulerSelectOptions() {
// --- READABILITY: Faculty ---
        const currentFaculty = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        const semester = String((typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3);
        labelSchedulerSelect('admin-tt-faculty', 'Faculty');
        labelSchedulerSelect('admin-tt-semester', 'Semester');
        labelSchedulerSelect('admin-tt-prof', 'Professor');
        labelSchedulerSelect('admin-tt-ta', 'Teaching assistant');
        rebuildSchedulerSelect(el('admin-tt-faculty'), SCHEDULER_FACULTY_OPTIONS, currentFaculty);
        rebuildSchedulerSelect(el('admin-tt-semester'), SCHEDULER_SEMESTER_OPTIONS, semester);
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
        const paletteCount = getPaletteSubjectsCount();

        setText('sch-stat-sessions', String(visibleSessions.length));
        setText('sch-stat-drafts', String(drafts));
        setText('sch-stat-rooms', String(roomCount));
        setText('sch-stat-instructors', String(staffCount));
        setText('sch-palette-count', String(paletteCount));
        setText('sch-palette-summary', `${paletteCount} subjects`);
    }

    function schedulerRosterDisplayName(person = {}) {
        return String(person.name || person.nameEn || person.displayName || person.id || '').trim();
    }

    function escapeSchedulerStaffPickerHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function schedulerStaffPickerAvatarSource(value) {
        const candidate = String(value || '').trim();
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/|\.{1,2}\/)/i.test(candidate)) return candidate;
        return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(candidate) ? candidate : '';
    }

    function schedulerStaffPickerRoleLabel(role) {
        return role === 'ta' ? 'Teaching assistant' : 'Professor';
    }

    function schedulerStaffPickerRecordKey(person) {
        return String(person?.id || schedulerRosterDisplayName(person)).trim();
    }

    function getSchedulerStaffPickerRecords(role) {
        const facultyValue = el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON';
        const facultyFilter = facultyValue === 'all' ? null : normalizeFacultyCode(facultyValue, getCurrentFaculty());
        return (typeof getAllStaff === 'function'
            ? getAllStaff(role === 'ta' ? 'tas' : 'professors', facultyFilter)
            : []
        ).filter((person) => schedulerRosterDisplayName(person)).map((person) => {
            const staffTypeId = person.staffTypeId || (role === 'ta' ? 'ta' : 'professor');
            const fieldValues = typeof hydrateFieldValuesFromRecord === 'function'
                ? hydrateFieldValuesFromRecord(person, staffTypeId)
                : (person.fieldValues && typeof person.fieldValues === 'object' ? person.fieldValues : {});
            return { ...person, staffTypeId, fieldValues };
        });
    }

    function schedulerStaffPickerFieldValue(person, role) {
        return schedulerRosterDisplayName(person) || (role === 'ta' ? 'No TA' : 'No professor');
    }

    function schedulerStaffPickerValue(value, emptyLabel) {
        return value == null || value === '' ? emptyLabel : String(value);
    }

    function renderSchedulerStaffPickerProfileFallback(person) {
        if (!person) {
            return '<div class="sch-staff-picker-empty"><i class="fas fa-user-slash"></i><strong>Select a staff member</strong><span>Review their profile details before assigning them.</span></div>';
        }
        const role = schedulerStaffPickerRoleLabel(schedulerStaffPickerState.role);
        const name = schedulerRosterDisplayName(person);
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ST';
        const details = [
            ['Role', person.title || role],
            ['Staff ID', person.staffId || person.id],
            ['Faculty', person.facultyName || person.facultyCode || person.faculty],
            ['Department', person.department],
            ['Email', person.email || person.emailAddress],
            ['Phone', person.phone || person.phoneNumber],
            ['Office', person.office || person.officeLocation],
            ['Status', person.status || person.accountStatus]
        ].filter(([, value]) => value);
        const courses = [
            ...(Array.isArray(person.courses) ? person.courses : []),
            ...(Array.isArray(person.subjects) ? person.subjects : [])
        ].map((course) => typeof course === 'object' ? (course.name || course.id || '') : course).filter(Boolean);
        const scheduleSessions = Array.isArray(person.scheduleSessions) ? person.scheduleSessions : [];
        const officeHours = Array.isArray(person.officeHours) ? person.officeHours : [];
        const availability = [person.availability, ...officeHours].filter(Boolean).map((item) => typeof item === 'object' ? (item.day && item.time ? `${item.day} ${item.time}` : item.label || '') : item).filter(Boolean).join(' · ');
        const scheduleSummary = scheduleSessions.map((session) => {
            if (typeof session !== 'object') return session;
            return [session.courseId || session.code, session.day, session.time, session.room].filter(Boolean).join(' · ');
        }).filter(Boolean);
        const links = Array.isArray(person.links) ? person.links.map((link) => typeof link === 'object' ? (link.label || link.url || '') : link).filter(Boolean) : [];
        const documents = [
            ...(Array.isArray(person.customDocs) ? person.customDocs : []),
            ...(Array.isArray(person.documents) ? person.documents : [])
        ].map((doc) => typeof doc === 'object' ? (doc.title || doc.name || '') : doc).filter(Boolean);
        const customFields = person.fieldValues && typeof person.fieldValues === 'object'
            ? Object.entries(person.fieldValues).filter(([, value]) => value !== '' && value != null).slice(0, 12)
            : [];
        return `
            <div class="sch-staff-picker-profile-head">
                <div class="sch-staff-picker-avatar">${schedulerStaffPickerAvatarSource(person.photo) ? `<img src="${escapeSchedulerStaffPickerHtml(schedulerStaffPickerAvatarSource(person.photo))}" alt="">` : initials}</div>
                <div>
                    <div class="sch-staff-picker-kicker">${escapeSchedulerStaffPickerHtml(role)} · ${escapeSchedulerStaffPickerHtml(person.facultyName || person.facultyCode || '')}</div>
                    <h3>${escapeSchedulerStaffPickerHtml(name)}</h3>
                    <p>${escapeSchedulerStaffPickerHtml(person.title || person.department || role)}</p>
                </div>
            </div>
            <div class="sch-staff-picker-section">
                <div class="sch-staff-picker-section-title">Overview</div>
                <div class="sch-staff-picker-detail-grid">
                    ${details.map(([label, value]) => `<div><span>${escapeSchedulerStaffPickerHtml(label)}</span><strong>${escapeSchedulerStaffPickerHtml(value)}</strong></div>`).join('')}
                </div>
            </div>
            ${courses.length || scheduleSummary.length ? `<div class="sch-staff-picker-section"><div class="sch-staff-picker-section-title">Teaching</div><p class="sch-staff-picker-copy">${[...courses, ...scheduleSummary].map(escapeSchedulerStaffPickerHtml).join(' · ')}</p></div>` : ''}
            ${availability ? `<div class="sch-staff-picker-section"><div class="sch-staff-picker-section-title">Availability</div><p class="sch-staff-picker-copy">${escapeSchedulerStaffPickerHtml(availability)}</p></div>` : ''}
            ${links.length ? `<div class="sch-staff-picker-section"><div class="sch-staff-picker-section-title">Links</div><p class="sch-staff-picker-copy">${links.map(escapeSchedulerStaffPickerHtml).join(' · ')}</p></div>` : ''}
            ${customFields.length ? `<div class="sch-staff-picker-section"><div class="sch-staff-picker-section-title">Profile details</div><div class="sch-staff-picker-detail-grid">${customFields.map(([label, value]) => `<div><span>${escapeSchedulerStaffPickerHtml(label)}</span><strong>${escapeSchedulerStaffPickerHtml(Array.isArray(value) ? value.join(', ') : value)}</strong></div>`).join('')}</div></div>` : ''}
            ${documents.length ? `<div class="sch-staff-picker-section"><div class="sch-staff-picker-section-title">Documents</div><p class="sch-staff-picker-copy">${documents.map(escapeSchedulerStaffPickerHtml).join(' · ')}</p></div>` : ''}
        `;
    }

    function getSchedulerStaffPickerProfileSections(person) {
        const recordKey = schedulerStaffPickerRecordKey(person);
        const cachedSections = schedulerStaffPickerState.profileSections?.get(recordKey);
        if (cachedSections) return cachedSections;
        const typeId = person?.staffTypeId || (schedulerStaffPickerState.role === 'ta' ? 'ta' : 'professor');
        const cachedTypeSections = schedulerStaffPickerState.profileSectionsByType?.get(typeId);
        if (cachedTypeSections) {
            schedulerStaffPickerState.profileSections?.set(recordKey, cachedTypeSections);
            return cachedTypeSections;
        }
        const schema = typeof getStaffFormSchema === 'function' ? getStaffFormSchema(typeId) : null;
        const blueprintSections = (schema?.sections || [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .filter((section) => (section.fields || []).length)
            .filter((section) => !/^admin$/i.test(String(section.id || '').trim()))
            .filter((section) => !/^admin$/i.test(String(section.title || '').trim()));
        const sections = blueprintSections.length
            ? blueprintSections
            : [
                { id: 'overview', title: 'Overview' },
                { id: 'teaching', title: 'Teaching' },
                { id: 'availability', title: 'Availability' },
                { id: 'documents', title: 'Links & documents' }
            ];
        schedulerStaffPickerState.profileSections?.set(recordKey, sections);
        schedulerStaffPickerState.profileSectionsByType?.set(typeId, sections);
        return sections;
    }

    function renderSchedulerStaffPickerLegacySection(person, section) {
        const details = [
            ['Role', person.title || schedulerStaffPickerRoleLabel(schedulerStaffPickerState.role)],
            ['Staff ID', person.staffId || person.id],
            ['Faculty', person.facultyName || person.facultyCode || person.faculty],
            ['Department', person.department],
            ['Email', person.email || person.emailAddress],
            ['Phone', person.phone || person.phoneNumber],
            ['Office', person.office || person.officeLocation],
            ['Status', person.status || person.accountStatus]
        ].filter(([, value]) => value);
        const courses = [
            ...(Array.isArray(person.courses) ? person.courses : []),
            ...(Array.isArray(person.subjects) ? person.subjects : [])
        ].map((course) => typeof course === 'object' ? (course.name || course.id || '') : course).filter(Boolean);
        const schedule = (Array.isArray(person.scheduleSessions) ? person.scheduleSessions : []).map((session) => {
            if (typeof session !== 'object') return session;
            return [session.courseId || session.code, session.day, session.time, session.room].filter(Boolean).join(' · ');
        }).filter(Boolean);
        const officeHours = Array.isArray(person.officeHours) ? person.officeHours : [];
        const availability = [person.availability, ...officeHours].filter(Boolean).map((item) => typeof item === 'object'
            ? (item.day && item.time ? `${item.day} ${item.time}` : item.label || '')
            : item).filter(Boolean);
        const links = Array.isArray(person.links) ? person.links.map((link) => typeof link === 'object' ? (link.label || link.url || '') : link).filter(Boolean) : [];
        const documents = [
            ...(Array.isArray(person.customDocs) ? person.customDocs : []),
            ...(Array.isArray(person.documents) ? person.documents : [])
        ].map((doc) => typeof doc === 'object' ? (doc.title || doc.name || '') : doc).filter(Boolean);
        const list = (items, emptyLabel) => items.length
            ? `<div class="staff-hub-list">${items.map((item) => `<div class="staff-hub-list-item"><strong>${escapeSchedulerStaffPickerHtml(item)}</strong></div>`).join('')}</div>`
            : `<div class="staff-hub-schema-empty"><p>${escapeSchedulerStaffPickerHtml(emptyLabel)}</p></div>`;
        const sectionTitle = section.title || 'Profile';
        if (section.id === 'teaching') {
            return `<section class="staff-hub-form-section lux-data-card"><div class="staff-hub-form-section-head"><span class="staff-hub-overline">Profile section</span><strong>${escapeSchedulerStaffPickerHtml(sectionTitle)}</strong></div>${list([...courses, ...schedule], 'No teaching or schedule details have been added.')}</section>`;
        }
        if (section.id === 'availability') {
            return `<section class="staff-hub-form-section lux-data-card"><div class="staff-hub-form-section-head"><span class="staff-hub-overline">Profile section</span><strong>${escapeSchedulerStaffPickerHtml(sectionTitle)}</strong></div>${list(availability, 'No availability details have been added.')}</section>`;
        }
        if (section.id === 'documents') {
            return `<section class="staff-hub-form-section lux-data-card"><div class="staff-hub-form-section-head"><span class="staff-hub-overline">Profile section</span><strong>${escapeSchedulerStaffPickerHtml(sectionTitle)}</strong></div><div class="staff-hub-form-grid">${[
                ['Links', links],
                ['Documents', documents]
            ].map(([label, items]) => `<div class="staff-hub-info-card"><span>${label}</span>${list(items, `No ${label.toLowerCase()} have been added.`)}</div>`).join('')}</div></section>`;
        }
        return `<section class="staff-hub-form-section lux-data-card"><div class="staff-hub-form-section-head"><span class="staff-hub-overline">Profile section</span><strong>${escapeSchedulerStaffPickerHtml(sectionTitle)}</strong></div><div class="staff-hub-form-grid">${details.map(([label, value]) => `<div class="staff-hub-profile-field"><span class="staff-hub-profile-field-label">${escapeSchedulerStaffPickerHtml(label)}</span><div class="staff-hub-profile-field-value">${escapeSchedulerStaffPickerHtml(value)}</div></div>`).join('')}</div></section>`;
    }

    function renderSchedulerStaffPickerProfile(person) {
        if (!person) return renderSchedulerStaffPickerProfileFallback(person);
        const recordKey = schedulerStaffPickerRecordKey(person);
        const role = schedulerStaffPickerRoleLabel(schedulerStaffPickerState.role);
        const name = schedulerRosterDisplayName(person);
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ST';
        const sections = getSchedulerStaffPickerProfileSections(person);
        const hasBlueprintSections = sections.some((section) => (section.fields || []).length);
        const activeSection = sections.find((section) => section.id === schedulerStaffPickerState.activeSectionId) || sections[0];
        if (activeSection) schedulerStaffPickerState.activeSectionId = activeSection.id;
        const profileCacheKey = `${recordKey}::${activeSection?.id || 'overview'}`;
        const cachedMarkup = schedulerStaffPickerState.profileMarkup?.get(profileCacheKey);
        if (cachedMarkup) return cachedMarkup;
        const statusChips = [person.status, person.accountStatus, person.lmsRole]
            .filter(Boolean)
            .map((value) => `<span class="staff-hub-chip lux-status-pill">${escapeSchedulerStaffPickerHtml(value)}</span>`)
            .join('');
        const sectionBody = activeSection && typeof renderStaffBlueprintProfileView === 'function'
            && hasBlueprintSections
            ? renderStaffBlueprintProfileView(person.staffTypeId, person, { activeSectionId: activeSection.id })
            : renderSchedulerStaffPickerLegacySection(person, activeSection || { id: 'overview', title: 'Overview' });
        const markup = `
            <div class="sch-staff-picker-profile-head staff-hub-profile-head">
                <div class="sch-staff-picker-avatar staff-hub-avatar is-large">${schedulerStaffPickerAvatarSource(person.photo) ? `<img src="${escapeSchedulerStaffPickerHtml(schedulerStaffPickerAvatarSource(person.photo))}" alt="">` : initials}</div>
                <div>
                    <div class="sch-staff-picker-kicker staff-hub-kicker">${escapeSchedulerStaffPickerHtml(role)} · ${escapeSchedulerStaffPickerHtml(person.staffId || person.id || '')}</div>
                    <h3>${escapeSchedulerStaffPickerHtml(name)}</h3>
                    <p>${escapeSchedulerStaffPickerHtml(person.title || person.department || role)}${person.department ? ` · ${escapeSchedulerStaffPickerHtml(person.department)}` : ''}</p>
                    <div class="staff-hub-chips staff-hub-chips--spaced">${statusChips}</div>
                </div>
            </div>
            ${sections.length ? `
                <div class="staff-hub-tabs lux-tab-strip is-profile-tabs sch-staff-picker-tabs" role="tablist" aria-label="Staff profile sections">
                    ${sections.map((section) => {
                        const active = section.id === activeSection?.id;
                        return `<button type="button" class="staff-hub-tab lux-tab-btn staff-hub-profile-tab${active ? ' is-active' : ''}" aria-pressed="${active ? 'true' : 'false'}" data-scheduler-staff-picker-section="${escapeSchedulerStaffPickerHtml(section.id)}">${escapeSchedulerStaffPickerHtml(section.title || 'Profile')}</button>`;
                    }).join('')}
                </div>` : ''}
            <div class="staff-hub-profile-body sch-staff-picker-profile-body">${sectionBody}</div>
        `;
        schedulerStaffPickerState.profileMarkup?.set(profileCacheKey, markup);
        return markup;
    }

    function getVisibleSchedulerStaffPickerRecords() {
        const query = schedulerStaffPickerState.query.toLowerCase();
        return schedulerStaffPickerState.records.filter((person) => {
            const haystack = [
                schedulerRosterDisplayName(person),
                person.nameEn,
                person.staffId,
                person.department,
                person.title,
                person.facultyName,
                person.email
            ].filter(Boolean).join(' ').toLowerCase();
            return !query || haystack.includes(query);
        });
    }

    function renderSchedulerStaffPickerRoster(visibleRecords) {
        const overlay = el('schStaffPickerOverlay');
        const list = overlay?.querySelector('#sch-staff-picker-list');
        if (!list) return;
        list.innerHTML = visibleRecords.length
            ? visibleRecords.map((person) => {
                const key = schedulerStaffPickerRecordKey(person);
                const name = schedulerRosterDisplayName(person);
                return `<button type="button" class="sch-staff-picker-person${key === schedulerStaffPickerState.selectedId ? ' is-selected' : ''}" aria-pressed="${key === schedulerStaffPickerState.selectedId ? 'true' : 'false'}" data-scheduler-staff-picker-person="${escapeSchedulerStaffPickerHtml(key)}"><strong>${escapeSchedulerStaffPickerHtml(name)}</strong><span>${escapeSchedulerStaffPickerHtml(person.department || person.facultyName || schedulerStaffPickerRoleLabel(schedulerStaffPickerState.role))}</span></button>`;
            }).join('')
            : '<div class="sch-staff-picker-empty">No matching staff members.</div>';
    }

    function syncSchedulerStaffPickerSelection() {
        const list = el('schStaffPickerOverlay')?.querySelector('#sch-staff-picker-list');
        if (!list) return;
        list.querySelectorAll('[data-scheduler-staff-picker-person]').forEach((button) => {
            const isSelected = button.dataset.schedulerStaffPickerPerson === schedulerStaffPickerState.selectedId;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
    }

    function renderSchedulerStaffPicker(options = {}) {
        const overlay = el('schStaffPickerOverlay');
        if (!overlay) return;
        const roleLabel = schedulerStaffPickerRoleLabel(schedulerStaffPickerState.role);
        const visibleRecords = getVisibleSchedulerStaffPickerRecords();
        const selected = schedulerStaffPickerState.records.find((person) => schedulerStaffPickerRecordKey(person) === schedulerStaffPickerState.selectedId)
            || visibleRecords[0]
            || null;
        if (selected && !schedulerStaffPickerState.selectedId) {
            schedulerStaffPickerState.selectedId = schedulerStaffPickerRecordKey(selected);
        }
        const list = overlay.querySelector('#sch-staff-picker-list');
        const profile = overlay.querySelector('#sch-staff-picker-profile');
        const choose = overlay.querySelector('[data-scheduler-staff-picker-choose]');
        const title = overlay.querySelector('[data-scheduler-staff-picker-title]');
        if (title) title.textContent = `Choose ${roleLabel}`;
        if (options.roster !== false) renderSchedulerStaffPickerRoster(visibleRecords);
        if (options.roster === false) syncSchedulerStaffPickerSelection();
        if (options.profile !== false && profile) profile.innerHTML = renderSchedulerStaffPickerProfile(selected);
        if (choose) choose.disabled = !selected;
    }

    function ensureSchedulerStaffPicker() {
        let overlay = el('schStaffPickerOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'schStaffPickerOverlay';
        overlay.className = 'lux-glass-dialog-overlay sch-staff-picker-overlay';
        overlay.dataset.luxTransparencyExempt = '1';
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="lux-glass-dialog-card lux-glass-dialog-card--hub-dialog sch-staff-picker" role="dialog" aria-modal="true" aria-labelledby="sch-staff-picker-title">
                <div class="lux-glass-dialog-head sch-staff-picker-head">
                    <div><div class="sch-staff-picker-kicker">Staff assignment</div><h2 id="sch-staff-picker-title" data-scheduler-staff-picker-title>Choose Professor</h2><p>Review the staff profile before assigning this person.</p></div>
                    <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn sch-staff-picker-close" data-scheduler-staff-picker-close aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body sch-staff-picker-body">
                    <div class="sch-staff-picker-roster">
                        <label for="sch-staff-picker-search">Search staff</label>
                        <input id="sch-staff-picker-search" class="lux-control" type="search" placeholder="Name, department, or staff ID" autocomplete="off">
                        <div id="sch-staff-picker-list" class="sch-staff-picker-list"></div>
                    </div>
                    <section id="sch-staff-picker-profile" class="sch-staff-picker-profile"></section>
                </div>
                <div class="lux-glass-dialog-actions sch-staff-picker-foot">
                    <button type="button" class="lux-secondary-btn" data-scheduler-staff-picker-clear>Clear assignment</button>
                    <button type="button" class="lux-primary-btn" data-scheduler-staff-picker-choose><i class="fas fa-check" aria-hidden="true"></i> Choose this person</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function closeSchedulerStaffPicker() {
        const overlay = el('schStaffPickerOverlay');
        if (!overlay) return;
        if (typeof window.closeLuxPortalModal === 'function') {
            closeSchedulerPortalModal(overlay);
        } else {
            overlay.hidden = true;
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    function openSchedulerStaffPicker(targetId, role) {
        const overlay = ensureSchedulerStaffPicker();
        const target = el(targetId);
        const records = getSchedulerStaffPickerRecords(role);
        schedulerStaffPickerState = {
            role,
            targetId,
            records,
            selectedId: '',
            query: '',
            activeSectionId: '',
            profileSections: new Map(),
            profileSectionsByType: new Map(),
            profileMarkup: new Map()
        };
        records.forEach((person) => {
            getSchedulerStaffPickerProfileSections(person);
        });
        const currentValue = target?.value || '';
        const selected = schedulerStaffPickerState.records.find((person) => schedulerStaffPickerFieldValue(person, role) === currentValue);
        schedulerStaffPickerState.selectedId = selected ? schedulerStaffPickerRecordKey(selected) : '';
        const search = overlay.querySelector('#sch-staff-picker-search');
        if (search) search.value = '';
        renderSchedulerStaffPicker();
        openSchedulerPortalModal(overlay, {
            focusSelector: '#sch-staff-picker-search',
            refreshTransparency: false
        });
    }

    function applySchedulerStaffPickerValue(value) {
        const target = el(schedulerStaffPickerState.targetId);
        if (!target) return;
        target.value = value;
        syncSchedulerPickerSelect(schedulerStaffPickerState.targetId);
        if (schedulerStaffPickerState.targetId.startsWith('admin-tt-')) {
            queueSchedulerRefresh({ grid: true });
        } else {
            schCheckConflict();
        }
        closeSchedulerStaffPicker();
    }

    function bindSchedulerStaffPickerListeners() {
        if (window.__kiuSchedulerStaffPickerBound) return;
        window.__kiuSchedulerStaffPickerBound = true;
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest?.('#admin-tt-prof-lux-btn, #admin-tt-ta-lux-btn, #sch-prof-lux-btn, #sch-ta-lux-btn');
            if (trigger) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const role = trigger.id.includes('-ta-') ? 'ta' : 'professor';
                const targetId = trigger.id.includes('admin-tt-')
                    ? (role === 'ta' ? 'admin-tt-ta' : 'admin-tt-prof')
                    : (role === 'ta' ? 'sch-ta' : 'sch-prof');
                openSchedulerStaffPicker(targetId, role);
                return;
            }
            const personButton = event.target.closest?.('[data-scheduler-staff-picker-person]');
            if (personButton) {
                const nextSelectedId = personButton.dataset.schedulerStaffPickerPerson || '';
                if (nextSelectedId === schedulerStaffPickerState.selectedId) return;
                schedulerStaffPickerState.selectedId = nextSelectedId;
                schedulerStaffPickerState.activeSectionId = '';
                renderSchedulerStaffPicker({ roster: false });
                return;
            }
            const sectionButton = event.target.closest?.('[data-scheduler-staff-picker-section]');
            if (sectionButton) {
                schedulerStaffPickerState.activeSectionId = sectionButton.dataset.schedulerStaffPickerSection || '';
                renderSchedulerStaffPicker({ roster: false });
                return;
            }
            if (event.target.closest?.('[data-scheduler-staff-picker-close]')) {
                closeSchedulerStaffPicker();
                return;
            }
            if (event.target.closest?.('[data-scheduler-staff-picker-clear]')) {
                applySchedulerStaffPickerValue(schedulerStaffPickerState.targetId.startsWith('admin-tt-') ? 'all' : '');
                return;
            }
            if (event.target.closest?.('[data-scheduler-staff-picker-choose]')) {
                const selected = schedulerStaffPickerState.records.find((person) => schedulerStaffPickerRecordKey(person) === schedulerStaffPickerState.selectedId);
                if (selected) applySchedulerStaffPickerValue(schedulerStaffPickerFieldValue(selected, schedulerStaffPickerState.role));
            }
        }, true);
        document.addEventListener('input', (event) => {
            if (event.target.id !== 'sch-staff-picker-search') return;
            schedulerStaffPickerState.query = event.target.value || '';
            renderSchedulerStaffPicker();
        });
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

        const modalProf = el('sch-prof');
        if (modalProf && modalProf.tagName === 'SELECT') {
            const currentValue = modalProf.value || '';
            const normalizedCurrent = currentValue === 'TBD' ? '' : currentValue;
            modalProf.innerHTML = '<option value="">No professor</option>'
                + professors.map((person) => {
                    const label = schedulerRosterDisplayName(person);
                    return `<option value="${label}">${label}</option>`;
                }).join('');
            if (normalizedCurrent && ![...modalProf.options].some((option) => option.value === normalizedCurrent)) {
                modalProf.insertAdjacentHTML('beforeend', `<option value="${normalizedCurrent}">${normalizedCurrent}</option>`);
            }
            modalProf.value = [...modalProf.options].some((option) => option.value === normalizedCurrent)
                ? normalizedCurrent
                : '';
            modalProf.removeAttribute('size');
            modalProf.size = 0;
        }

        const modalTa = el('sch-ta');
        if (modalTa && modalTa.tagName === 'SELECT') {
            const currentValue = modalTa.value || '';
            modalTa.innerHTML = '<option value="">No TA</option>'
                + tas.map((person) => {
                    const label = schedulerRosterDisplayName(person);
                    return `<option value="${label}">${label}</option>`;
                }).join('');
            if (currentValue && ![...modalTa.options].some((option) => option.value === currentValue)) {
                modalTa.insertAdjacentHTML('beforeend', `<option value="${currentValue}">${currentValue}</option>`);
            }
            modalTa.value = [...modalTa.options].some((option) => option.value === currentValue) ? currentValue : '';
            modalTa.removeAttribute('size');
            modalTa.size = 0;
        }
    }

    function filterPaletteListBySearch() {
        const list = el('palette-list');
        if (!list) return false;
        const query = String(el('palette-search')?.value || '').trim().toLowerCase();
        const cards = list.querySelectorAll('[data-scheduler-subject-id]');
        if (!cards.length) return false;

        let visibleCount = 0;
        cards.forEach((card) => {
            const haystack = String(card.dataset.schedulerSearchHaystack || '').toLowerCase();
            const isVisible = !query || haystack.includes(query);
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        const emptyState = list.querySelector('.sch-empty-state, .lux-empty-state');
        if (emptyState) emptyState.hidden = visibleCount > 0;
        updateSchedulerRailChrome();
        return true;
    }

    function renderPalette(options = {}) {
        const list = el('palette-list');
        if (!list) return;

        if (options.searchOnly && filterPaletteListBySearch()) {
            return;
        }

        runWithLuxuryObserversPaused(() => {
        const subjects = getSchedulerPaletteSubjects({ ignoreSearch: true });
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
        filterPaletteListBySearch();
        updateSchedulerRailChrome();
        });
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
        __kiuSchedExpose({
            selectedPaletteSubject,
        });
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
                ? '<i class="fas fa-pen-to-square" aria-hidden="true"></i> Edit Class Session'
                : '<i class="fas fa-calendar-plus" aria-hidden="true"></i> New Class Session';
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
        bindNodeOnce(el('sch-prof'), 'change', 'schedulerProfBound', schCheckConflict);
        bindNodeOnce(el('sch-ta'), 'change', 'schedulerTaBound', schCheckConflict);
        bindNodeOnce(el('sch-create-btn'), 'click', 'schedulerCreateButtonBound', (event) => {
            event.preventDefault();
            schCreateSession();
        });

        const closeControl = modal.querySelector('[data-admin-scheduler-modal-close]');
        if (closeControl) {
            bindNodeOnce(closeControl, 'keydown', 'schedulerModalCloseKeyBound', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    closeSchModal();
                }
            });
        }
    }

    function ensureSchedulerCreateModal() {
        const modal = ensureMountedTemplate(SCHEDULER_CREATE_MODAL_TEMPLATE_ID, SCHEDULER_CREATE_MODAL_ID);
        if (modal) bindSchedulerCreateModalListeners(modal);
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
        if (conflictBox) clearSchedulerConflictState();

        schCalcEnd();
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(modal);
        }
        openSchedulerPortalModal(modal, { focusSelector: '#sch-subject' });
    }

    function openSchEditModal(courseId, groupId, weekStart = getSchedulerWeekStart()) {
        const role = typeof getEffectiveRole === 'function' ? getEffectiveRole() : getEffectiveUserRole();
        if (role === 'professor') {
            loadSchedulerQuizApi()
                .then((api) => api.openProfQuizModal(courseId, groupId, weekStart))
                .catch(() => {
                    window.alert('Unable to open quiz manager. Please refresh and try again.');
                });
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
        populateProfList();
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

        ['sch-group', 'sch-room', 'sch-day', 'sch-duration', 'sch-session-type', 'sch-apply-scope', 'sch-subject', 'sch-prof', 'sch-ta'].forEach(syncSchedulerPickerSelect);
        schCheckConflict();
    }

    function closeSchModal() {
        closeSchedulerPresetManager();
        if (typeof window.closePickerPanels === 'function') {
            window.closePickerPanels();
        }
        const modal = el('schModalOverlay');
        if (modal) closeSchedulerPortalModal(modal);
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
        state.className = 'sch-empty-state lux-soft-chrome';
        state.textContent = message;
        return state;
    }

    function buildSchedulerPaletteCard(subject, facultyCode, isActive) {
        const toneToken = getSchedulerEventToneToken(facultyCode);
        const tone = getSchedulerFacultyTone(facultyCode);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `palette-card lux-strip-card lux-soft-chrome home-hover-chip${isActive ? ' selected' : ''}`;
        card.dataset.schedulerSubjectId = subject.id;
        card.dataset.schedulerSearchHaystack = [
            subject.id,
            subject.name,
            subject.ects,
            subject.semester,
            facultyCode,
        ].filter(Boolean).join(' ').toLowerCase();
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

    function buildSchedulerDayHeader(entry, isToday, semester, weekStart) {
        const dayCol = document.createElement('div');
        dayCol.className = `headInfo sch-weeklist-day${isToday ? ' is-today' : ''}`;

        const header = document.createElement('div');
        header.className = 'day-title sch-weeklist-day-head';

        const title = document.createElement('div');
        title.className = 'day-name sch-day-col-label';
        title.textContent = entry.en;

        const meta = document.createElement('div');
        meta.className = 'day-number sch-day-col-meta';
        meta.textContent = entry.shortDate;

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'sch-weeklist-add lux-secondary-btn';
        addButton.dataset.schedulerDayAdd = entry.en;
        addButton.dataset.schedulerDayAddTime = '09:00';
        addButton.dataset.schedulerDayAddSemester = String(semester);
        addButton.dataset.schedulerDayAddWeek = weekStart;
        addButton.setAttribute('aria-label', `Add session on ${entry.en}`);
        addButton.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i><span>Add session</span>';

        header.append(title, meta, addButton);
        dayCol.appendChild(header);
        return dayCol;
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
        const actionNode = document.createElement('button');
        actionNode.type = 'button';
        actionNode.className = `ev-trash ev-action ev-action--${action}`;
        actionNode.dataset.schedulerSessionAction = action;
        actionNode.dataset.courseId = courseId;
        actionNode.dataset.groupId = groupId;
        actionNode.setAttribute('aria-label', 'Delete session');

        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.setAttribute('aria-hidden', 'true');
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
        const facultyCode = normalizeFacultyCode(session.faculty || deriveFaculty(session.courseId));
        const toneToken = getSchedulerEventToneToken(facultyCode);
        const tone = getSchedulerFacultyTone(facultyCode);
        const isDraft = session.prof === 'TBD' || session.room === 'TBD';

        const card = document.createElement('div');
        card.className = 'sch-event weeklist-item sch-weeklist-item';
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

        const timeLabel = `${session.time || '09:00'}${session.endTime ? ` - ${session.endTime}` : ''}`;
        card.appendChild(buildSchedulerEventMeta('far fa-clock', timeLabel));

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

        const actions = document.createElement('div');
        actions.className = 'ev-actions';
        actions.appendChild(buildSchedulerEventAction('delete', session.courseId, session.id, 'fas fa-trash'));
        card.appendChild(actions);
        return card;
    }

    function buildSchedulerEmptyWeekNotice(weekStart) {
        const empty = document.createElement('div');
        empty.className = 'sch-empty-week-notice lux-soft-chrome';
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
        messageBox.hidden = false;
        messageBox.classList.add('show');
    }

    function clearSchedulerConflictState() {
        const messageBox = el('sch-conflict-msg');
        if (!messageBox) return;
        messageBox.dataset.conflictState = 'hidden';
        messageBox.hidden = true;
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

        runWithLuxuryObserversPaused(() => {
        const weekStart = getSchedulerWeekStart();
        const weekEntries = getWeekDateEntries(weekStart);
        const semester = parseInt(el('admin-tt-semester')?.value || '3', 10);
        const sessions = getVisibleSchedulerSessions();
        const isCurrentWeek = weekStart === getCurrentWeekStartISO();

        syncSchedulerWeekChrome();

        const root = document.createElement('div');
        root.className = 'sch-weeklist-root';
        root.dataset.schedulerWeekState = isCurrentWeek ? 'current' : 'selected';

        const weekList = document.createElement('div');
        weekList.className = 'weeklist-container sch-weeklist-container';
        weekEntries.forEach((entry, index) => {
            const isToday = isCurrentWeek && (new Date().getDay() === (index === 6 ? 0 : index + 1));
            const dayColumn = buildSchedulerDayHeader(entry, isToday, semester, weekStart);
            const daySessions = sessions
                .filter((session) => normalizeSchedulerDayLabel(session.day, 'en') === entry.en)
                .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time));
            const list = document.createElement('div');
            list.className = 'weeklist sch-weeklist-items';
            daySessions.forEach((session) => {
                list.appendChild(buildSchedulerEventCard(session, weekStart));
            });
            if (!daySessions.length) {
                const empty = document.createElement('div');
                empty.className = 'sch-weeklist-empty';
                empty.textContent = 'No sessions';
                list.appendChild(empty);
            }
            const count = document.createElement('span');
            count.className = 'sch-weeklist-day-count';
            count.textContent = `${daySessions.length} ${daySessions.length === 1 ? 'session' : 'sessions'}`;
            dayColumn.querySelector('.sch-weeklist-day-head')?.appendChild(count);
            dayColumn.appendChild(list);
            weekList.appendChild(dayColumn);
        });
        root.appendChild(weekList);

        const fragment = document.createDocumentFragment();
        fragment.appendChild(root);

        if (!sessions.length) {
            fragment.appendChild(buildSchedulerEmptyWeekNotice(weekStart));
        }

        container.replaceChildren(fragment);
        container.setAttribute('aria-busy', 'false');
        updateSchedulerRailChrome();
        });
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
        queueSchedulerRefresh({ grid: true });
    }

    /* H2b: admin-scheduler-faculty-runtime.js */
    const __schedFacultyDeps = window.__kiuAdminSchedulerFacultyDeps = {
        el,
        DAY_ORDER,
        SCHEDULER_WEEK_STORAGE_KEY: (typeof SCHEDULER_WEEK_STORAGE_KEY !== 'undefined'
            ? SCHEDULER_WEEK_STORAGE_KEY
            : (window.SCHEDULER_WEEK_STORAGE_KEY || 'KIU_SCHEDULER_WEEK_START')),
        getCurrentFaculty: (...a) => (typeof getCurrentFaculty === 'function' ? getCurrentFaculty(...a) : window.getCurrentFaculty?.(...a)),
        normalizeFacultyCode: (...a) => (typeof normalizeFacultyCode === 'function' ? normalizeFacultyCode(...a) : window.normalizeFacultyCode?.(...a)),
        getFacultyProfile: (...a) => (typeof getFacultyProfile === 'function' ? getFacultyProfile(...a) : window.getFacultyProfile?.(...a)),
        getFacultyThemeTone: (...a) => (typeof getFacultyThemeTone === 'function' ? getFacultyThemeTone(...a) : window.getFacultyThemeTone?.(...a)),
        getActiveCurriculum: (...a) => (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(...a) : window.getActiveCurriculum?.(...a)),
        getStoredWeekStart: (...a) => (typeof getStoredWeekStart === 'function' ? getStoredWeekStart(...a) : window.getStoredWeekStart?.(...a)),
        getWeekDateEntries: (...a) => (typeof getWeekDateEntries === 'function' ? getWeekDateEntries(...a) : window.getWeekDateEntries?.(...a)),
    };
    const __h2bFacultyApi = typeof window.__kiuCreateAdminSchedulerFacultyApi === 'function'
        ? window.__kiuCreateAdminSchedulerFacultyApi(__schedFacultyDeps) : null;
    if (!__h2bFacultyApi) throw new Error('admin-scheduler-faculty-runtime.js missing');
    const {
        mergeUniqueSubjects,
        deriveFaculty,
        getSchedulerWeekStart,
        normalizeSchedulerDayLabel,
        getSchedulerFacultyTone,
        getSchedulerPaletteSubjects,
    } = __h2bFacultyApi;

    /* Wave 18: admin-scheduler-session-runtime.js */
    const __schedSessionDeps = window.__kiuAdminSchedulerSessionDeps = {
        el, getSchedulerWeekStart, normalizeSchedulerDayLabel,
        normalizeTimeString: window.normalizeTimeString,
        convertTimeToMinutes: window.convertTimeToMinutes,
        minutesToTimeString: window.minutesToTimeString,
        findScheduleConflict,
        upsertScheduledSession: window.upsertScheduledSession,
        deleteScheduledSession: window.deleteScheduledSession,
        closeSchModal, renderGrid, normalizeSchedulerSelectOptions,
        populateProfList, queueSchedulerRefresh,
        get selectedPaletteSubject() { return selectedPaletteSubject; },
        set selectedPaletteSubject(v) { selectedPaletteSubject = v; },
        saveState: (...a) => (typeof saveState === 'function' ? saveState(...a) : window.saveState?.(...a)),
        normalizeFacultyCode: (...a) => (typeof normalizeFacultyCode === 'function' ? normalizeFacultyCode(...a) : window.normalizeFacultyCode?.(...a)),
        inferSchedulerSessionType: (...a) => window.inferSchedulerSessionType?.(...a),
        migrateStudentSchedulesForScheduledGroup: (...a) => window.migrateStudentSchedulesForScheduledGroup?.(...a)
    };
    const __w18PeelApi = typeof window.__kiuCreateAdminSchedulerSessionApi === 'function'
        ? window.__kiuCreateAdminSchedulerSessionApi(__schedSessionDeps) : null;
    if (!__w18PeelApi) throw new Error('admin-scheduler-session-runtime.js missing');
    const { schCreateSession, syncSchedulerFacultyScope } = __w18PeelApi;

    function changeSchedulerWeek(offset) {
        setStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY, shiftWeekStartISO(getSchedulerWeekStart(), offset));
        queueSchedulerRefresh({ grid: true });
    }

    function jumpSchedulerToCurrentWeek() {
        setStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY, getCurrentWeekStartISO());
        queueSchedulerRefresh({ grid: true });
    }

    function bindSchedulerListeners() {
        bindSchedulerStaffPickerListeners();
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
                queueSchedulerRefresh({ palette: true, paletteSearchOnly: true });
            }, SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS);
        });
        bindNodeOnce(el('palette-list'), 'click', 'schedulerPaletteClickBound', (event) => {
            const card = event.target.closest('[data-scheduler-subject-id]');
            if (!card) return;
            event.preventDefault();
            selectPaletteItem(card.dataset.schedulerSubjectId);
        });
        bindNodeOnce(el('scheduler-grid'), 'click', 'schedulerGridClickBound', (event) => {
            const addNode = event.target.closest('[data-scheduler-day-add]');
            if (addNode) {
                event.preventDefault();
                openSchModal(
                    addNode.dataset.schedulerDayAdd || 'Monday',
                    addNode.dataset.schedulerDayAddTime || '09:00',
                    parseInt(addNode.dataset.schedulerDayAddSemester || '3', 10) || 3,
                    addNode.dataset.schedulerDayAddWeek || getSchedulerWeekStart()
                );
                return;
            }

            const actionNode = event.target.closest('[data-scheduler-session-action]');
            if (actionNode) {
                event.preventDefault();
                event.stopPropagation();
                const action = actionNode.dataset.schedulerSessionAction || '';
                const courseId = actionNode.dataset.courseId || '';
                const groupId = actionNode.dataset.groupId || '';
                const weekStart = actionNode.dataset.weekStart || getSchedulerWeekStart();
                if (action === 'edit') openSchEditModal(courseId, groupId, weekStart);
                if (action === 'delete') schDeleteSession(courseId, groupId);
                return;
            }

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
        if (!isStandaloneAdminSchedulerPage() && appContent && schedulerPage) {
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

        document.body.classList.remove('lux-home-page', 'lux-route-home');
        document.body.classList.add('lux-unified-shell', 'lux-nonhome-page', 'lux-route-admin-scheduler');
        document.body.dataset.luxPage = 'admin-scheduler';
        document.body.dataset.luxEntry = 'admin-scheduler';
        document.body.dataset.luxFamily = 'admin';

        const currentFaculty = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        normalizeSchedulerSelectOptions();
        if (el('admin-tt-faculty')) el('admin-tt-faculty').value = currentFaculty;

        if (el('admin-tt-semester')) {
            el('admin-tt-semester').value = String((typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3);
        }

        bindSchedulerListeners();
        populateProfList();
        queueSchedulerRefresh({ palette: true, grid: true, revealShell: true });
    }

    __kiuSchedExpose({
        selectedPaletteSubject,
        getSchedulerWeekStart,
        syncSchedulerWeekChrome,
        changeSchedulerWeek,
        jumpSchedulerToCurrentWeek,
        syncSchedulerFacultyScope,
        populateProfList,
        getSchedulerPaletteSubjects,
        getSchedulerFacultyTone,
        renderPalette,
        selectPaletteItem,
        normalizeSchedulerDayLabel,
        openSchModal,
        openSchEditModal,
        closeSchModal,
        schCalcEnd,
        schCheckConflict,
        renderGrid,
        schDeleteSession,
        schCreateSession,
        updateSchedulerRailChrome,
        initializeAdminSchedulerPage,
        loadSchedulerQuizApi,
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdminSchedulerPage, { once: true });
    } else {
        initializeAdminSchedulerPage();
    }
})();
