/* LMS classroom tabs runtime extracted from lms.js. */

function openLMSGroups(subjectId, titleString, iconClass) {
    document.getElementById('page-lms').style.display = 'none';
    const inner = document.getElementById('page-lms-inner');
    if(inner) inner.style.display = 'none';

    document.getElementById('page-lms-groups').style.display = 'block';
    const subjectTitle = repairLmsDisplayText(titleString, 'Subject');
    document.getElementById('dynamic-subject-title').innerText = subjectTitle;

    const weekStart = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : null;
    const realGroups = (KIU_STATE.availableGroups?.[subjectId] || []).map(group => {
        const normalizedGroup = typeof getEffectiveGroupForWeek === 'function'
            ? (getEffectiveGroupForWeek(subjectId, group, weekStart) || group)
            : (typeof normalizeScheduleGroup === 'function' ? (normalizeScheduleGroup(subjectId, group) || group) : group);
        return {
            id: normalizedGroup.id || group.id,
            title: subjectTitle,
            group: repairLmsDisplayText(normalizedGroup.name || group.name || group.id, group.id || 'Group'),
            timeDay: buildLmsTimeBadge(
                normalizedGroup.day || group.day || normalizedGroup.timeDay || group.timeDay || '',
                normalizedGroup.time || group.time || ''
            ),
            stdCount: normalizedGroup.capacity || group.capacity || 30,
            room: repairLmsDisplayText(normalizedGroup.room || group.room || 'TBD', 'TBD'),
            faculty: normalizedGroup.faculty || group.faculty || getCurrentFaculty()
        };
    });
    const groupsToRender = realGroups;
    renderLmsBulkGroupTools(subjectId, subjectTitle, groupsToRender);
    
    const grid = document.getElementById('dynamic-groups-grid');
    grid.innerHTML = '';
    
    if (!groupsToRender.length) {
        grid.innerHTML = `
            <div class="lux-empty-state" style="min-height:220px; display:flex; align-items:center; justify-content:center; text-align:center;">
                <div>
                    <div class="lux-card-title">No published groups in this faculty yet</div>
                    <div class="lux-card-copy" style="margin-top:10px;">Switch faculty in the topbar or add course groups for this subject to populate the workspace.</div>
                </div>
            </div>
        `;
        return;
    }
    groupsToRender.forEach(g => {
        const courseTitle = `${g.title} | ${g.timeDay} (${g.group})`;
        const canBulkSelect = canManageLmsGroupContent();
        const facultyLabel = typeof getFacultyLabel === 'function'
            ? getFacultyLabel(g.faculty || getCurrentFaculty())
            : (g.faculty || '');
        const groupIconClass = /\bfa[rsb]?\b/.test(String(iconClass || ''))
            ? String(iconClass || 'fas fa-book-reader')
            : `fas ${String(iconClass || 'fa-book-reader')}`;
        const liveSummary = getLmsLiveGroupSummary(subjectId, g.id);
        grid.innerHTML += `
            <article
                class="lux-card lux-lms-group-card"
                role="button"
                tabindex="0"
                data-group-id="${escapeHtml(String(g.id))}"
                data-course-key="${escapeHtml(`${subjectId}::${g.id}`)}"
                data-course-title="${escapeHtml(courseTitle)}"
                data-lms-click="openLMSCourseFromCard(this)"
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLMSCourseFromCard(this);}">
                <div class="lux-card-body">
                    ${canBulkSelect ? `
                        <label class="lms-bulk-group-select lms-group-tile-select" data-lms-click="event.stopPropagation();">
                            <input type="checkbox" data-lms-bulk-group-check="true" data-group-id="${escapeHtml(String(g.id))}" data-lms-change="updateLmsBulkSelectionCount()">
                            <span>Bulk</span>
                        </label>
                    ` : ''}
                    <div class="lms-group-tile-top">
                        <div class="lms-group-tile-head">
                            <div style="min-width:0;">
                                <div class="lms-clean-card-kicker"><i class="${escapeHtml(groupIconClass)}"></i> ${escapeHtml(facultyLabel || 'Course')}</div>
                                <div class="lms-group-tile-title">${escapeHtml(g.group)}</div>
                            </div>
                            <span class="lms-group-tile-action" aria-label="Open group"><i class="fas fa-arrow-right"></i></span>
                        </div>
                        <div class="lms-group-tile-subject">${escapeHtml(g.title)}</div>
                    </div>
                    <div class="lms-group-tile-meta">
                        <span class="page-hero-badge"><i class="far fa-clock"></i> ${escapeHtml(g.timeDay)}</span>
                        <span class="page-hero-badge"><i class="fas fa-users"></i> ${escapeHtml(String(g.stdCount))} seats</span>
                        <span class="page-hero-badge"><i class="fas fa-door-open"></i> ${escapeHtml(g.room)}</span>
                    </div>
                    <div class="lms-group-live-strip ${liveSummary.isLive ? 'is-live' : ''}">
                        <span><i class="fas fa-bolt"></i> Live Quiz</span>
                        <span>${escapeHtml(liveSummary.label)}${liveSummary.questionCount ? ` - ${escapeHtml(String(liveSummary.questionCount))} questions` : ''}</span>
                    </div>
                </div>
            </article>
        `;
    });
    updateLmsBulkSelectionCount();
}

function closeLMSGroups() {
    document.getElementById('page-lms-groups').style.display = 'none';
    document.getElementById('page-lms').style.display = 'block';
}

function backToLMSGroups() {
    document.getElementById('page-lms-inner').style.display = 'none';
    document.getElementById('page-lms-groups').style.display = 'block';
}

function getLmsBulkDraftKey(subjectId = lmsBulkGroupContext.subjectId) {
    return `bulk-material::${String(subjectId || 'subject').trim() || 'subject'}`;
}

function buildLmsBulkGroupCourseKey(subjectId, groupId) {
    return resolveCanonicalLmsResourceKey(`${subjectId}::${groupId}`);
}

function buildLmsBulkGroupSectionResourceKey(subjectId, groupId, sectionType) {
    return resolveCanonicalLmsResourceKey(`${subjectId}::${groupId}${getLmsSectionSuffix(sectionType)}`);
}

function getSelectedLmsBulkGroups() {
    const checkedIds = new Set(Array.from(document.querySelectorAll('[data-lms-bulk-group-check="true"]:checked'))
        .map(input => String(input.dataset.groupId || '').trim())
        .filter(Boolean));
    return (lmsBulkGroupContext.groups || []).filter(group => checkedIds.has(String(group.id || '')));
}

function updateLmsBulkSelectionCount() {
    const count = getSelectedLmsBulkGroups().length;
    const target = document.getElementById('lms-bulk-selected-count');
    if (target) target.textContent = `${count} selected`;
    const buttons = document.querySelectorAll('[data-lms-bulk-requires-selection="true"]');
    buttons.forEach(button => {
        button.disabled = count === 0;
    });
}

function setLmsBulkGroupSelection(checked) {
    document.querySelectorAll('[data-lms-bulk-group-check="true"]').forEach(input => {
        input.checked = Boolean(checked);
    });
    updateLmsBulkSelectionCount();
}

function getLmsBulkSelectedWeeks() {
    const select = document.getElementById('lms-bulk-material-weeks');
    const values = select
        ? Array.from(select.selectedOptions).map(option => normalizeLmsWeekLabel(option.value))
        : [];
    const filtered = values.filter(value => value);
    return filtered.length ? filtered : [''];
}

function buildLmsBulkWeekOptions(subjectId, groups = []) {
    const labels = new Set(LMS_DEFAULT_WEEKS);
    const defaultSection = getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    (groups || []).forEach(group => {
        const resourceKey = buildLmsBulkGroupSectionResourceKey(subjectId, group.id, defaultSection);
        ensureLmsWeeksForKey(resourceKey).forEach(week => labels.add(week));
    });
    return [
        '<option value="">No Week / General</option>',
        ...sortLmsWeekLabels([...labels]).map(week => `<option value="${escapeHtml(week)}">${escapeHtml(week)}</option>`)
    ].join('');
}

function renderLmsBulkGroupTools(subjectId, subjectTitle, groups = []) {
    const host = document.getElementById('lms-bulk-group-tools');
    if (!host) return;
    lmsBulkGroupContext = { subjectId, subjectTitle, groups: Array.isArray(groups) ? groups : [] };
    if (!canManageLmsGroupContent() || !groups.length) {
        host.innerHTML = '';
        return;
    }
    const bulkKey = getLmsBulkDraftKey(subjectId);
    const token = toDomToken(bulkKey);
    const fileLabelId = `lms-bulk-material-file-label-${token}`;
    const defaultSection = getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    host.innerHTML = `
        <section class="lms-bulk-panel is-collapsed" id="lms-bulk-panel">
            <div class="lms-bulk-head">
                <div class="lms-bulk-head-main">
                    <span class="lms-bulk-icon"><i class="fas fa-layer-group"></i></span>
                    <div style="min-width:0;">
                        <div class="lms-bulk-title">Multi-group actions</div>
                        <div class="lms-bulk-copy">${escapeHtml(subjectTitle || 'Subject')} has ${groups.length} selectable group${groups.length !== 1 ? 's' : ''}.</div>
                    </div>
                </div>
                <div class="lms-bulk-head-actions">
                    <span id="lms-bulk-selected-count" class="lms-bulk-selection">0 selected</span>
                    <div class="lms-bulk-selection-actions">
                        <button type="button" class="kiu-btn-outline" data-lms-click="setLmsBulkGroupSelection(true)"><i class="fas fa-check"></i> All</button>
                        <button type="button" class="kiu-btn-outline" data-lms-click="setLmsBulkGroupSelection(false)"><i class="fas fa-xmark"></i> Clear</button>
                    </div>
                    <button type="button" class="kiu-btn-outline lms-bulk-toggle" data-lms-click="toggleLmsBulkToolsPanel(this)" aria-expanded="false">
                        <i class="fas fa-sliders"></i>
                        <span>Show tools</span>
                    </button>
                </div>
            </div>
            <div class="lms-bulk-body">
                <div class="lms-bulk-action-grid">
                    <div class="lms-bulk-card">
                        <div>
                            <div class="lms-bulk-title"><i class="fas fa-message"></i> Announcement</div>
                            <div class="lms-bulk-copy" style="margin-top:5px;">Post one message to selected Interaction threads.</div>
                        </div>
                        <textarea id="lms-bulk-message-text" class="lms-route-textarea" rows="3" placeholder="Write the message students should see..."></textarea>
                        <div class="lms-bulk-actions">
                            <span class="lms-bulk-copy">Sender: ${escapeHtml(getSimulatedUserName())}</span>
                            <button type="button" class="kiu-btn-blue" data-lms-bulk-requires-selection="true" data-lms-click="sendLmsBulkGroupMessage()"><i class="fas fa-paper-plane"></i> Send</button>
                        </div>
                    </div>
                    <div class="lms-bulk-card">
                        <div class="lms-bulk-head" style="padding:0; border-bottom:0;">
                            <div>
                                <div class="lms-bulk-title"><i class="fas fa-folder-open"></i> Material</div>
                                <div class="lms-bulk-copy" style="margin-top:5px;">Upload one file to selected groups and weeks.</div>
                            </div>
                            <span id="${fileLabelId}" class="lms-route-pill">No file selected</span>
                        </div>
                        <div class="lms-bulk-upload-grid">
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-title">Title</label>
                                <input id="lms-bulk-material-title" class="lms-route-input" type="text" placeholder="e.g. Week 5 slides">
                            </div>
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-section">Class type</label>
                                <select id="lms-bulk-material-section" class="lms-route-select">
                                    ${LMS_SECTION_TYPES.map(type => `<option value="${type}" ${type === defaultSection ? 'selected' : ''}>${escapeHtml(getLmsSectionMeta(type).label)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="lms-route-field">
                                <label class="lms-route-field-label" for="lms-bulk-material-weeks">Weeks</label>
                                <select id="lms-bulk-material-weeks" class="lms-route-select" multiple size="4">
                                    ${buildLmsBulkWeekOptions(subjectId, groups)}
                                </select>
                            </div>
                        </div>
                        <div class="lms-route-field">
                            <label class="lms-route-field-label" for="lms-bulk-material-description">Description</label>
                            <input id="lms-bulk-material-description" class="lms-route-input" type="text" placeholder="Optional student-facing note">
                        </div>
                        <div class="lms-bulk-actions">
                            <button type="button" class="kiu-btn-outline" data-lms-click="pickLocalLmsFile('material', ${lmsInlineArg(bulkKey)}, ${lmsInlineArg(fileLabelId)})"><i class="fas fa-paperclip"></i> Choose</button>
                            <button type="button" class="kiu-btn-blue" data-lms-bulk-requires-selection="true" data-lms-click="createLmsBulkMaterialUpload()"><i class="fas fa-cloud-upload-alt"></i> Upload</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    updateLmsBulkSelectionCount();
}

function toggleLmsBulkToolsPanel(button) {
    const panel = document.getElementById('lms-bulk-panel');
    if (!panel) return;
    const isCollapsed = panel.classList.toggle('is-collapsed');
    if (button) {
        button.setAttribute('aria-expanded', String(!isCollapsed));
        const label = button.querySelector('span');
        if (label) label.textContent = isCollapsed ? 'Show tools' : 'Hide tools';
        const icon = button.querySelector('i');
        if (icon) icon.className = isCollapsed ? 'fas fa-sliders' : 'fas fa-chevron-up';
    }
}

function sendLmsBulkGroupMessage() {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can send multi-group messages.');
        return;
    }
    const selected = getSelectedLmsBulkGroups();
    const text = String(document.getElementById('lms-bulk-message-text')?.value || '').trim();
    if (!selected.length) {
        alert('Select at least one group first.');
        return;
    }
    if (!text) {
        alert('Write the announcement first.');
        return;
    }
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    selected.forEach(group => {
        const courseKey = buildLmsBulkGroupCourseKey(lmsBulkGroupContext.subjectId, group.id);
        if (!Array.isArray(KIU_STATE.messages[courseKey])) KIU_STATE.messages[courseKey] = [];
        KIU_STATE.messages[courseKey].push({
            sender: getSimulatedUserName(),
            text,
            time: timeStr,
            isProf: true,
            bulk: true,
            createdAt: now.toISOString(),
            targetGroupId: group.id,
            targetGroupName: group.group || group.name || group.id
        });
    });
    saveState();
    const input = document.getElementById('lms-bulk-message-text');
    if (input) input.value = '';
    if (selected.some(group => buildLmsBulkGroupCourseKey(lmsBulkGroupContext.subjectId, group.id) === resolveCanonicalLmsResourceKey(currentCourseId)) && getCurrentLmsActiveTab() === 'interaction') {
        renderLmsInteractionSection(currentCourseId);
    }
    alert(`Message sent to ${selected.length} group${selected.length === 1 ? '' : 's'}.`);
}

async function createLmsBulkMaterialUpload() {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can upload materials to multiple groups.');
        return;
    }
    const selected = getSelectedLmsBulkGroups();
    const title = String(document.getElementById('lms-bulk-material-title')?.value || '').trim();
    const description = String(document.getElementById('lms-bulk-material-description')?.value || '').trim();
    const sectionType = normalizeLmsSectionType(document.getElementById('lms-bulk-material-section')?.value) || getDefaultLmsSectionTypeForRole(getEffectiveUserRole()) || 'lecture';
    const weeks = getLmsBulkSelectedWeeks();
    const bulkKey = getLmsBulkDraftKey();
    const file = getLmsDraftFile('material', bulkKey);
    if (!selected.length) {
        alert('Select at least one group first.');
        return;
    }
    if (!title) {
        alert('Add a material title first.');
        return;
    }
    if (!file) {
        alert('Choose a file first.');
        return;
    }
    try {
        const persistedFile = await persistLmsStoredFile(file, 'material');
        let createdCount = 0;
        selected.forEach((group, groupIndex) => {
            const resourceKey = buildLmsBulkGroupSectionResourceKey(lmsBulkGroupContext.subjectId, group.id, sectionType);
            const materials = ensureLmsMaterialsForKey(resourceKey);
            const configuredWeeks = ensureLmsWeeksForKey(resourceKey);
            weeks.forEach((weekLabel, weekIndex) => {
                const normalizedWeek = normalizeLmsWeekLabel(weekLabel);
                if (normalizedWeek && !configuredWeeks.some(week => week.toLowerCase() === normalizedWeek.toLowerCase())) {
                    configuredWeeks.push(normalizedWeek);
                    KIU_STATE.groupWeekConfigs[resourceKey] = sortLmsWeekLabels(configuredWeeks);
                }
                materials.unshift({
                    id: `material_${Date.now()}_${groupIndex}_${weekIndex}`,
                    title,
                    description,
                    weekLabel: normalizedWeek,
                    file: cloneStoredFile(persistedFile),
                    uploadedBy: getSimulatedUserName(),
                    uploadedAt: new Date().toISOString(),
                    bulkUpload: true,
                    targetGroupId: group.id
                });
                createdCount += 1;
            });
        });
        clearLmsDraftFile('material', bulkKey);
        const fileLabel = document.getElementById(`lms-bulk-material-file-label-${toDomToken(bulkKey)}`);
        if (fileLabel) fileLabel.textContent = 'No file selected';
        ['lms-bulk-material-title', 'lms-bulk-material-description'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        saveState();
        if (getCurrentLmsActiveTab() === 'materials') rerenderCurrentLmsTab();
        alert(`Material uploaded to ${selected.length} group${selected.length === 1 ? '' : 's'} (${createdCount} material record${createdCount === 1 ? '' : 's'}).`);
    } catch (error) {
        console.error('Bulk material upload failed.', error);
        alert('Bulk material upload failed.');
    }
}

function normalizeLmsSessionMarkerType(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return LMS_SESSION_MARKER_TYPES[normalized] ? normalized : 'important';
}

function getLmsSessionMarkerTypeMeta(type) {
    const normalized = normalizeLmsSessionMarkerType(type);
    return {
        type: normalized,
        ...(LMS_SESSION_MARKER_TYPES[normalized] || LMS_SESSION_MARKER_TYPES.important)
    };
}

function normalizeLmsSessionMarkerWeekStart(weekStart) {
    if (typeof formatLocalDateISO === 'function' && typeof getWeekStartDate === 'function') {
        return formatLocalDateISO(getWeekStartDate(typeof parseLocalDate === 'function' ? (parseLocalDate(weekStart) || new Date()) : new Date(weekStart || Date.now())));
    }
    return String(weekStart || '').trim();
}

function getLmsSessionMarkerGroupKey(courseKey = currentCourseId) {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(courseKey || currentCourseId));
    if (!parsed.courseId || !parsed.groupId) return '';
    return resolveCanonicalLmsResourceKey(`${parsed.courseId}::${parsed.groupId}`);
}

function normalizeLmsSessionMarker(marker = {}, groupKey = '') {
    const parsed = parseLmsCourseKey(groupKey || marker.groupKey || currentCourseId);
    const typeMeta = getLmsSessionMarkerTypeMeta(marker.type);
    const weekStart = normalizeLmsSessionMarkerWeekStart(marker.weekStart);
    return {
        id: String(marker.id || `session_marker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
        courseId: marker.courseId || parsed.courseId || '',
        groupId: marker.groupId || parsed.groupId || '',
        weekStart,
        type: typeMeta.type,
        title: repairLmsDisplayText(marker.title || typeMeta.label, typeMeta.label),
        note: repairLmsDisplayText(marker.note || '', ''),
        sectionType: normalizeLmsSectionType(marker.sectionType) || 'lecture',
        day: repairLmsDisplayText(marker.day || '', ''),
        time: String(marker.time || '').trim(),
        endTime: String(marker.endTime || '').trim(),
        room: repairLmsDisplayText(marker.room || '', ''),
        createdBy: repairLmsDisplayText(marker.createdBy || '', ''),
        createdAt: marker.createdAt || new Date().toISOString(),
        updatedAt: marker.updatedAt || marker.createdAt || new Date().toISOString()
    };
}

function getLmsSessionMarkersForGroup(courseKey = currentCourseId) {
    ensureLmsStores();
    const groupKey = getLmsSessionMarkerGroupKey(courseKey);
    if (!groupKey) return [];
    if (!Array.isArray(KIU_STATE.lmsSessionMarkers[groupKey])) KIU_STATE.lmsSessionMarkers[groupKey] = [];
    KIU_STATE.lmsSessionMarkers[groupKey] = KIU_STATE.lmsSessionMarkers[groupKey]
        .filter(marker => marker && typeof marker === 'object')
        .map(marker => normalizeLmsSessionMarker(marker, groupKey))
        .sort((left, right) => String(left.weekStart || '').localeCompare(String(right.weekStart || '')) || String(left.title || '').localeCompare(String(right.title || '')));
    return KIU_STATE.lmsSessionMarkers[groupKey];
}

function getLmsSessionMarkerContext(courseKey = currentCourseId) {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(courseKey || currentCourseId));
    if (!parsed.courseId || !parsed.groupId) return null;
    const subject = (typeof findCurriculumSubjectByIdOrTitle === 'function'
        ? findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty())
        : null)
        || (typeof getDomain === 'function' ? getDomain()?.subjectsById?.[parsed.courseId] : null)
        || (KIU_STATE.curriculum || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.courseId))
        || null;
    const groups = typeof getAvailableGroupsForSubject === 'function'
        ? getAvailableGroupsForSubject(subject?.id || parsed.courseId)
        : (KIU_STATE.availableGroups?.[subject?.id || parsed.courseId] || []);
    const group = groups.find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || (KIU_STATE.availableGroups?.[parsed.courseId] || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || null;
    return {
        courseId: subject?.id || parsed.courseId,
        groupId: group?.id || parsed.groupId,
        subject,
        group,
        groupKey: getLmsSessionMarkerGroupKey(`${subject?.id || parsed.courseId}::${group?.id || parsed.groupId}`)
    };
}

function getLmsSessionScheduleForWeek(courseKey = currentCourseId, weekStart = getCurrentWeekStartISO()) {
    const context = getLmsSessionMarkerContext(courseKey);
    if (!context) return null;
    const normalizedWeek = normalizeLmsSessionMarkerWeekStart(weekStart);
    const effectiveGroup = typeof resolveScheduledGroupForWeek === 'function'
        ? resolveScheduledGroupForWeek(context.courseId, context.groupId, normalizedWeek)
        : null;
    const normalizedGroup = effectiveGroup
        || (typeof normalizeScheduleGroup === 'function' ? normalizeScheduleGroup(context.courseId, context.group) : context.group)
        || {};
    const entries = typeof getWeekDateEntries === 'function' ? getWeekDateEntries(normalizedWeek) : [];
    const rawDay = typeof normalizeScheduleDayLabel === 'function'
        ? normalizeScheduleDayLabel(normalizedGroup.day || normalizedGroup.timeDay || '', '')
        : String(normalizedGroup.day || normalizedGroup.timeDay || '').trim();
    const dayEntry = entries.find(entry => {
        const lowered = rawDay.toLowerCase();
        return String(entry.en || '').toLowerCase() === lowered || String(entry.ge || '').toLowerCase() === lowered;
    }) || null;
    const startTime = normalizeTimeString(normalizedGroup.startTime || normalizedGroup.time || '', 'TBD');
    const endTime = normalizeTimeString(normalizedGroup.endTime || '', '') || (startTime === 'TBD'
        ? 'TBD'
        : minutesToTimeString(convertTimeToMinutes(startTime) + parseInt(String(normalizedGroup.duration || '110').match(/\d+/)?.[0] || '110', 10)));
    return {
        ...context,
        weekStart: normalizedWeek,
        weekLabel: typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(normalizedWeek) : normalizedWeek,
        dateLabel: dayEntry?.shortDate || '',
        day: repairLmsDisplayText(dayEntry?.en || rawDay || 'Day TBD', 'Day TBD'),
        time: startTime,
        endTime,
        room: repairLmsDisplayText(normalizedGroup.room || 'Room TBD', 'Room TBD'),
        instructor: repairLmsDisplayText(normalizedGroup.prof || normalizedGroup.ta || 'Instructor TBA', 'Instructor TBA'),
        active: Boolean(effectiveGroup || normalizedGroup?.id)
    };
}

function buildLmsSessionMarkerWeekOptions(courseKey = currentCourseId) {
    const currentWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const selectedWeeks = new Set(getLmsSessionMarkersForGroup(courseKey).map(marker => marker.weekStart).filter(Boolean));
    const optionWeeks = new Set();
    for (let index = 0; index < 16; index += 1) {
        optionWeeks.add(typeof shiftWeekStartISO === 'function' ? shiftWeekStartISO(currentWeek, index) : currentWeek);
    }
    selectedWeeks.forEach(week => optionWeeks.add(week));
    return [...optionWeeks].sort().map((weekStart, index) => {
        const schedule = getLmsSessionScheduleForWeek(courseKey, weekStart);
        const label = typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(weekStart) : weekStart;
        const scheduleLabel = schedule ? `${schedule.day}${schedule.dateLabel ? ` ${schedule.dateLabel}` : ''}, ${schedule.time}-${schedule.endTime}` : 'Schedule TBD';
        return `<option value="${escapeHtml(weekStart)}">${escapeHtml(`Week ${index + 1} - ${label} - ${scheduleLabel}`)}</option>`;
    }).join('');
}

function renderLmsSessionMarkerCards(courseKey = currentCourseId) {
    const markers = getLmsSessionMarkersForGroup(courseKey);
    const currentWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const canManage = canManageLmsGroupContent();
    if (!markers.length) {
        return renderLmsRouteEmptyState('No marked sessions yet', 'Quiz, exam, presentation, and important-session weeks will appear here and in the student timetable.', 'fa-calendar-check');
    }
    return `
        <div class="lms-session-marker-list">
            ${markers.map(marker => {
                const typeMeta = getLmsSessionMarkerTypeMeta(marker.type);
                const schedule = getLmsSessionScheduleForWeek(courseKey, marker.weekStart) || marker;
                const status = marker.weekStart === currentWeek ? 'current' : (marker.weekStart > currentWeek ? 'upcoming' : 'past');
                return `
                    <article class="lms-session-marker-card is-${escapeHtml(status)} tone-${escapeHtml(typeMeta.tone)}">
                        <div class="lms-session-marker-icon"><i class="fas ${escapeHtml(typeMeta.icon)}"></i></div>
                        <div class="lms-session-marker-main">
                            <div class="lms-session-marker-kicker">
                                <span>${escapeHtml(typeMeta.label)}</span>
                                <span>${escapeHtml(getLmsSectionMeta(marker.sectionType).label)}</span>
                                <span>${escapeHtml(status === 'current' ? 'This week' : status)}</span>
                            </div>
                            <h3>${escapeHtml(marker.title || typeMeta.label)}</h3>
                            <div class="lms-session-marker-schedule">
                                <span><i class="fas fa-calendar-week"></i> ${escapeHtml(typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(marker.weekStart) : marker.weekStart)}</span>
                                <span><i class="far fa-clock"></i> ${escapeHtml(schedule.day || marker.day || 'Day TBD')} ${escapeHtml(schedule.time || marker.time || 'TBD')}-${escapeHtml(schedule.endTime || marker.endTime || 'TBD')}</span>
                                <span><i class="fas fa-location-dot"></i> ${escapeHtml(schedule.room || marker.room || 'Room TBD')}</span>
                            </div>
                            ${marker.note ? `<p>${escapeHtml(marker.note)}</p>` : ''}
                        </div>
                        ${canManage ? `
                            <button type="button" class="kiu-btn-outline lms-session-marker-remove" data-lms-click="deleteLmsSessionMarker(${lmsInlineArg(marker.id)}, ${lmsInlineArg(courseKey)})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        ` : ''}
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderLmsSessionsSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('sessions', contentArea);
    const context = getLmsSessionMarkerContext(courseId);
    if (!context) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Sessions unavailable', 'Open a valid LMS group first.', 'fa-calendar-xmark');
        return;
    }
    const schedule = getLmsSessionScheduleForWeek(courseId, getCurrentWeekStartISO());
    const markers = getLmsSessionMarkersForGroup(courseId);
    const currentWeek = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : normalizeLmsSessionMarkerWeekStart(new Date());
    const activeCount = markers.filter(marker => marker.weekStart === currentWeek).length;
    const upcomingCount = markers.filter(marker => marker.weekStart >= currentWeek).length;
    const canManage = canManageLmsGroupContent();
    const defaultTitle = getLmsSessionMarkerTypeMeta('quiz').label;
    contentArea.innerHTML = `
        <div class="lms-session-planner-page">
            <section class="lms-route-hero lms-session-hero">
                <div class="lms-route-hero-grid">
                    <div>
                        <div class="lms-route-eyebrow"><i class="fas fa-calendar-check"></i> Group Sessions</div>
                        <div class="lms-route-title" style="margin-top:10px;">${escapeHtml(context.subject?.name || context.courseId)} - ${escapeHtml(context.group?.name || context.groupId)}</div>
                        <div class="lms-route-copy" style="margin-top:8px;">Mark quiz, exam, presentation, deadline, lab, or other important weeks once. Students see the highlighted session automatically in their timetable.</div>
                    </div>
                    <div class="lms-session-official-card">
                        <div class="lms-route-field-label">Official weekly session</div>
                        <strong>${escapeHtml(schedule?.day || 'Day TBD')} ${schedule?.dateLabel ? `<span>${escapeHtml(schedule.dateLabel)}</span>` : ''}</strong>
                        <div>${escapeHtml(schedule?.time || 'TBD')} - ${escapeHtml(schedule?.endTime || 'TBD')} Â· ${escapeHtml(schedule?.room || 'Room TBD')}</div>
                        <div>${escapeHtml(schedule?.instructor || 'Instructor TBA')}</div>
                    </div>
                </div>
            </section>
            ${renderLmsRouteStats([
                { label: 'Marked weeks', value: markers.length },
                { label: 'This week', value: activeCount },
                { label: 'Upcoming', value: upcomingCount }
            ])}
            ${canManage ? `
                <section class="lms-session-marker-composer is-collapsed" id="lms-session-marker-composer">
                    <div class="lms-session-marker-toolbar">
                        <div class="lms-session-marker-toolbar-main">
                            <span class="lms-bulk-icon"><i class="fas fa-wand-magic-sparkles"></i></span>
                            <div style="min-width:0;">
                                <div class="lms-route-card-title">Mark Important Timetable Weeks</div>
                                <div class="lms-route-copy" style="margin-top:4px;">Tag quiz, exam, presentation, deadline, lab, or important weeks for the student timetable.</div>
                            </div>
                        </div>
                        <button type="button" class="kiu-btn-outline lms-session-marker-toggle" data-lms-click="toggleLmsSessionMarkerComposer(this)" aria-expanded="false">
                            <i class="fas fa-sliders"></i>
                            <span>Show marker</span>
                        </button>
                    </div>
                    <div class="lms-session-marker-body">
                        <div class="lms-session-marker-form">
                            <div class="lms-session-marker-main-fields">
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Type</span>
                                    <select id="lms-session-marker-type" class="lms-route-select">
                                        ${Object.entries(LMS_SESSION_MARKER_TYPES).map(([type, meta]) => `<option value="${escapeHtml(type)}">${escapeHtml(meta.label)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Class type</span>
                                    <select id="lms-session-marker-section" class="lms-route-select">
                                        ${LMS_SECTION_TYPES.map(type => `<option value="${escapeHtml(type)}" ${type === getCurrentLmsSectionType() ? 'selected' : ''}>${escapeHtml(getLmsSectionMeta(type).label)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Title</span>
                                    <input id="lms-session-marker-title" class="lms-route-input" type="text" placeholder="${escapeHtml(defaultTitle)}">
                                </label>
                            </div>
                            <label class="lms-route-field lms-session-marker-weeks-field">
                                <span class="lms-route-field-label">Weeks</span>
                                <select id="lms-session-marker-weeks" class="lms-route-select" multiple size="6">
                                    ${buildLmsSessionMarkerWeekOptions(courseId)}
                                </select>
                            </label>
                            <div class="lms-session-marker-note-row">
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Note for students</span>
                                    <input id="lms-session-marker-note" class="lms-route-input" type="text" placeholder="Optional: bring laptop, files, printed work, or ID card">
                                </label>
                                <button type="button" class="kiu-btn-blue" data-lms-click="createLmsSessionMarkers(${lmsInlineArg(courseId)})"><i class="fas fa-calendar-plus"></i> Mark weeks</button>
                            </div>
                        </div>
                    </div>
                </section>
            ` : ''}
            <section class="lms-route-panel lms-session-marker-board">
                <div class="lms-route-card-head">
                    <div>
                        <div class="lms-route-card-title">Marked Sessions</div>
                        <div class="lms-route-copy" style="margin-top:6px;">These are the group sessions that will stand out in the timetable for enrolled students.</div>
                    </div>
                    <span class="lms-route-pill"><i class="fas fa-calendar-week"></i> ${escapeHtml(typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(currentWeek) : currentWeek)}</span>
                </div>
                ${renderLmsSessionMarkerCards(courseId)}
            </section>
        </div>
    `;
}

function createLmsSessionMarkers(courseId = currentCourseId) {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can mark important sessions.');
        return;
    }
    const context = getLmsSessionMarkerContext(courseId);
    if (!context) {
        alert('Open a valid group first.');
        return;
    }
    const weekSelect = document.getElementById('lms-session-marker-weeks');
    const weekStarts = weekSelect
        ? Array.from(weekSelect.selectedOptions).map(option => normalizeLmsSessionMarkerWeekStart(option.value)).filter(Boolean)
        : [];
    if (!weekStarts.length) {
        alert('Choose at least one week.');
        return;
    }
    const type = normalizeLmsSessionMarkerType(document.getElementById('lms-session-marker-type')?.value);
    const typeMeta = getLmsSessionMarkerTypeMeta(type);
    const sectionType = normalizeLmsSectionType(document.getElementById('lms-session-marker-section')?.value) || getCurrentLmsSectionType();
    const title = repairLmsDisplayText(document.getElementById('lms-session-marker-title')?.value || typeMeta.label, typeMeta.label);
    const note = repairLmsDisplayText(document.getElementById('lms-session-marker-note')?.value || '', '');
    const groupKey = getLmsSessionMarkerGroupKey(courseId);
    const markers = getLmsSessionMarkersForGroup(courseId);
    const actor = getSimulatedUserName();
    weekStarts.forEach(weekStart => {
        const schedule = getLmsSessionScheduleForWeek(courseId, weekStart) || {};
        markers.push(normalizeLmsSessionMarker({
            id: `session_marker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            courseId: context.courseId,
            groupId: context.groupId,
            weekStart,
            type,
            title,
            note,
            sectionType,
            day: schedule.day,
            time: schedule.time,
            endTime: schedule.endTime,
            room: schedule.room,
            createdBy: actor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, groupKey));
    });
    KIU_STATE.lmsSessionMarkers[groupKey] = markers;
    saveState();
    renderLmsSessionsSection(courseId);
}

function toggleLmsSessionMarkerComposer(button) {
    const composer = document.getElementById('lms-session-marker-composer');
    if (!composer) return;
    const isCollapsed = composer.classList.toggle('is-collapsed');
    if (button) {
        button.setAttribute('aria-expanded', String(!isCollapsed));
        const label = button.querySelector('span');
        if (label) label.textContent = isCollapsed ? 'Show marker' : 'Hide marker';
        const icon = button.querySelector('i');
        if (icon) icon.className = isCollapsed ? 'fas fa-sliders' : 'fas fa-chevron-up';
    }
}

function deleteLmsSessionMarker(markerId, courseId = currentCourseId) {
    if (!canManageLmsGroupContent()) {
        alert('Only professors, teaching assistants, and admins can remove marked sessions.');
        return;
    }
    const groupKey = getLmsSessionMarkerGroupKey(courseId);
    if (!groupKey || !Array.isArray(KIU_STATE.lmsSessionMarkers?.[groupKey])) return;
    KIU_STATE.lmsSessionMarkers[groupKey] = KIU_STATE.lmsSessionMarkers[groupKey].filter(marker => String(marker.id) !== String(markerId));
    saveState();
    renderLmsSessionsSection(courseId);
}

window.renderLmsSessionsSection = renderLmsSessionsSection;
window.createLmsSessionMarkers = createLmsSessionMarkers;
window.deleteLmsSessionMarker = deleteLmsSessionMarker;


function openLMSCourse(courseKey, titleString) {
    // courseKey can be "LAW-1::g2" or legacy "hr", "law_g2" etc.
    currentCourseId = courseKey;
    currentLmsSectionType = getDefaultLmsSectionTypeForRole(getEffectiveUserRole());
    
    const pageLms = document.getElementById('page-lms');
    const pageLmsGroups = document.getElementById('page-lms-groups');
    const pageLmsInner = document.getElementById('page-lms-inner');
    if (pageLms) pageLms.style.display = 'none';
    if (pageLmsGroups) pageLmsGroups.style.display = 'none';
    if (pageLmsInner) pageLmsInner.style.display = 'block';

    const cleanTitle = repairLmsDisplayText(titleString, courseKey);
    if (document.getElementById('lms-course-title')) {
        document.getElementById('lms-course-title').innerText = cleanTitle;
    }
    syncLmsCourseContext(cleanTitle);
    syncLmsSectionSwitchPresentation();

    switchLMSTab('sessions');
}

function refreshLmsQuizTabPresentation() {
    const quizTab = document.getElementById('tab-quiz');
    const liveQuizTab = document.getElementById('tab-live-quiz');
    const monitoringTab = document.getElementById('tab-monitoring');
    const gradebookTab = document.getElementById('tab-gradebook');
    if (!quizTab) return;
    const effectiveRole = getEffectiveUserRole();
    if (liveQuizTab) {
        liveQuizTab.innerHTML = effectiveRole === USER_ROLES.STUDENT
            ? '<i class="fas fa-bolt"></i> Live Quiz'
            : '<i class="fas fa-bolt"></i> Live Quiz';
        liveQuizTab.title = effectiveRole === USER_ROLES.STUDENT
            ? 'Answer live class questions shown by course staff'
            : 'Broadcast optional class questions to this group';
    }
    if (effectiveRole === USER_ROLES.STUDENT) {
        quizTab.innerHTML = '<i class="fas fa-pen-to-square"></i> My Quizzes';
        quizTab.title = 'Published quizzes for this group';
    } else {
        quizTab.innerHTML = '<i class="fas fa-pen-to-square"></i> Quiz Builder';
        quizTab.title = 'Create, publish, and review quizzes for this group';
    }
    if (monitoringTab) {
        monitoringTab.style.display = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole) ? '' : 'none';
    }
    if (gradebookTab) {
        gradebookTab.innerHTML = '<i class="fas fa-chart-bar"></i> Grades';
        gradebookTab.title = effectiveRole === USER_ROLES.STUDENT
            ? 'View your scores and assessment history for this group'
            : 'Grade students in this group and review score history';
        gradebookTab.style.display = '';
    }
}

function renderLmsMembersSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('members', contentArea);

    const parsed = parseLmsCourseKey(courseId);
    const domain = getDomain();
    const subjectId = canonicalCourseKey(parsed.courseId);
    const groupId = canonicalCourseKey(parsed.groupId);
    const subject = domain?.subjectsById?.[subjectId] || findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty()) || null;
    const group = (KIU_STATE.availableGroups?.[subjectId] || KIU_STATE.availableGroups?.[parsed.courseId] || [])
        .find(item => canonicalCourseKey(item?.id) === groupId) || null;
    const students = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
    const currentViewerId = String(getCurrentUserId() || '');
    const professorUser = resolveUserFromName(domain?.usersById, group?.prof);
    const taUser = resolveUserFromName(domain?.usersById, group?.ta);
    const totalMembers = students.length + (group?.prof ? 1 : 0) + (group?.ta ? 1 : 0);

    const buildRolePill = (label, colors) => `
        <span class="lms-route-pill" style="background:${colors.bg}; color:${colors.text}; border-color:${colors.border};">
            ${escapeHtml(label)}
        </span>
    `;

    const buildMemberCard = (member, roleLabel, colors, fallbackName) => {
        const displayName = member?.nameEn || member?.name || fallbackName || 'Unknown member';
        const initials = String(displayName || '?').trim().charAt(0).toUpperCase() || '?';
        const memberId = member?.id || '';
        const memberEmail = member?.email || '';
        const facultyLabel = getFacultyLabel(member?.facultyCode || member?.faculty || group?.faculty || subject?.faculty || getCurrentFaculty());
        const youBadge = currentViewerId && String(memberId || '') === currentViewerId
            ? '<span class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.12); color:var(--lux-accent); border-color:rgba(var(--lux-accent-rgb),0.18);">You</span>'
            : '';
        return `
            <div class="lms-route-card">
                <div class="lms-route-card-head" style="margin-bottom:14px;">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div style="width:50px; height:50px; border-radius:16px; background:${colors.avatar}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; box-shadow:0 14px 28px rgba(var(--lux-accent-rgb),0.20);">
                            ${escapeHtml(initials)}
                        </div>
                        <div>
                            <div class="lms-route-card-title">${escapeHtml(displayName)}</div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                                ${buildRolePill(roleLabel, colors)}
                                ${youBadge}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="lms-route-kv-grid">
                    ${renderLmsRouteKv('Faculty', facultyLabel)}
                    ${renderLmsRouteKv('ID', memberId || 'Not listed')}
                    ${renderLmsRouteKv('Email', memberEmail || 'Not listed')}
                </div>
            </div>
        `;
    };

    const studentCards = students.length
        ? students.map(student => {
            const studentUser = domain?.usersById?.[student.id] || null;
            return buildMemberCard(studentUser ? { ...studentUser, id: student.id } : { id: student.id, name: student.name }, 'Student', {
                bg: '#eff6ff',
                text: '#1d4ed8',
                border: 'rgba(59,130,246,0.18)',
                avatar: 'linear-gradient(135deg, #1d4ed8, #60a5fa)'
            }, student.name);
        }).join('')
        : renderLmsRouteEmptyState('No Students Yet', 'No students are enrolled in this group yet.', 'fa-user-graduate');

    const professorCard = buildMemberCard(professorUser, 'Professor', {
        bg: '#eef2ff',
        text: '#4338ca',
        border: 'rgba(99,102,241,0.18)',
        avatar: 'linear-gradient(135deg, #4338ca, #60a5fa)'
    }, group?.prof || 'Professor');

    const taCard = group?.ta
        ? buildMemberCard(taUser, 'Teaching Assistant', {
            bg: '#fff7ed',
            text: '#c2410c',
            border: 'rgba(249,115,22,0.18)',
            avatar: 'linear-gradient(135deg, #ea580c, #fb923c)'
        }, group.ta)
        : renderLmsRouteEmptyState('No Teaching Assistant', 'No teaching assistant is assigned to this group yet.', 'fa-user-plus');

    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <div class="lms-route-panel" style="padding:16px 20px;">
                <div class="lms-route-card-head">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <i class="fas fa-users" style="font-size:18px;color:var(--lux-accent-2);"></i>
                        <div>
                            <div class="lms-route-card-title">Group Members</div>
                            <div class="lms-route-copy" style="margin-top:4px;">${escapeHtml(subject?.name || parsed.courseId || 'Course')} &middot; ${escapeHtml(group?.name || parsed.groupId || 'Group')}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <span class="lms-route-pill"><i class="fas fa-user-graduate"></i> ${students.length} students</span>
                        <span class="lms-route-pill"><i class="fas fa-door-open"></i> ${escapeHtml(group?.room || 'TBD')}</span>
                    </div>
                </div>
            </div>
            <div class="lms-route-card-grid">
                ${professorCard}
                ${taCard}
            </div>
            <div class="lms-route-panel">
                <div class="lms-route-card-head" style="margin-bottom:18px;">
                    <div>
                        <div class="lms-route-card-title" style="font-size:22px;">Students in This Group</div>
                        <div class="lms-route-copy" style="margin-top:6px;">Visible in admin, professor, TA, and student group views.</div>
                    </div>
                    <span class="lms-route-pill"><i class="fas fa-users"></i> ${students.length} student${students.length === 1 ? '' : 's'}</span>
                </div>
                <div class="lms-route-card-grid">
                    ${studentCards}
                </div>
            </div>
        </div>
    `;
}

function renderLmsInteractionSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('interaction', contentArea);
    const resourceKey = resolveCanonicalLmsResourceKey(courseId || currentCourseId || '');
    const ctx = getLmsSectionEnhancementContext('interaction', resourceKey);
    const messages = Array.isArray(KIU_STATE.messages?.[resourceKey]) ? KIU_STATE.messages[resourceKey] : [];
    const moderationItems = ctx.moderation.filter(item => !item.hidden);
    const pinned = moderationItems.filter(item => item.pinned);
    const currentName = getSimulatedUserName();
    const canManage = canManageLmsGroupContent();
    const rows = messages.length ? messages.map(message => {
        const isMe = message.sender === currentName;
        const isStaff = Boolean(message.isProf || message.isStaff);
        return `
            <article class="lms-route-chat-row ${isMe ? 'is-me' : ''}">
                <div class="lms-route-chat-meta">
                    ${escapeHtml(message.sender || 'Unknown')} &middot; ${isStaff ? 'Staff' : 'Student'} &middot; ${escapeHtml(message.time || formatLmsDateTime(message.createdAt))}
                    ${message.bulk ? ' &middot; Multi-group' : ''}
                </div>
                <div class="lms-route-chat-bubble">${escapeHtml(message.text || '')}</div>
            </article>
        `;
    }).join('') : `
        <div class="lms-route-empty">
            <div class="lms-route-empty-title">No discussion yet</div>
            <div class="lms-route-empty-copy">Questions, announcements, and replies for this group will appear here.</div>
        </div>
    `;
    const pinnedMarkup = pinned.length ? pinned.slice(0, 4).map(item => `
        <div class="lms-route-kv">
            <div class="lms-route-kv-label">${escapeHtml(item.status === 'answered' ? 'Answered' : 'Pinned')}</div>
            <div class="lms-route-copy" style="margin-top:6px;">${escapeHtml(item.text || item.question || item.title || 'Pinned class item')}</div>
        </div>
    `).join('') : renderLmsRouteEmptyState('No pinned items', 'Staff can pin important questions and replies for the whole group.', 'fa-thumbtack');

    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <section class="lms-route-hero">
                <div class="lms-route-hero-grid">
                    <div>
                        <div class="lms-route-eyebrow">Interaction</div>
                        <div class="lms-route-title" style="margin-top:10px;"><i class="fas fa-comments"></i> Classroom Interaction</div>
                        <div class="lms-route-copy" style="margin-top:12px;">A clean group feed for seminar questions, professor announcements, TA replies, and pinned discussion items.</div>
                    </div>
                    ${renderLmsRouteStats([
                        { label: 'Messages', value: messages.length },
                        { label: 'Pinned', value: pinned.length },
                        { label: 'Open Questions', value: moderationItems.filter(item => item.status === 'new').length },
                        { label: 'Mode', value: canManage ? 'Staff' : 'Student' }
                    ])}
                </div>
            </section>
            <section class="lms-route-split" style="grid-template-columns:minmax(0,1.35fr) minmax(280px,0.65fr);">
                <div class="lms-route-panel lms-route-chat-board">
                    <div class="lms-route-card-head">
                        <div>
                            <div class="lms-route-card-title">Group Feed</div>
                            <div class="lms-route-copy" style="margin-top:6px;">Messages stay scoped to this LMS group.</div>
                        </div>
                        <span class="lms-route-pill"><i class="fas fa-circle" style="font-size:8px;color:#10b981;"></i> Live</span>
                    </div>
                    <div id="chat-history-container" class="lms-route-chat-list">${rows}</div>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <button class="kiu-btn-outline" type="button" title="Attach file"><i class="fas fa-paperclip"></i></button>
                        <input type="text" id="chat-input-text" class="lms-route-input" placeholder="${canManage ? 'Post an announcement or answer...' : 'Ask a question or reply...'}" style="flex:1; min-width:240px;">
                        <button class="kiu-btn-blue" type="button" data-lms-click="sendLmsInteractionMessage(${lmsInlineArg(resourceKey)})"><i class="fas fa-paper-plane"></i> Send</button>
                    </div>
                </div>
                <aside class="lms-route-panel">
                    <div class="lms-route-card-head" style="margin-bottom:14px;">
                        <div>
                            <div class="lms-route-card-title">Pinned Board</div>
                            <div class="lms-route-copy" style="margin-top:6px;">Important class items stay visible here.</div>
                        </div>
                        <i class="fas fa-thumbtack" style="color:var(--lux-accent-2);"></i>
                    </div>
                    <div style="display:grid;gap:10px;">${pinnedMarkup}</div>
                </aside>
            </section>
        </div>
    `;
    const historyBox = document.getElementById('chat-history-container');
    if (historyBox) historyBox.scrollTop = historyBox.scrollHeight;
    const input = document.getElementById('chat-input-text');
    if (input) {
        input.addEventListener('keyup', event => {
            if (event.key === 'Enter') sendLmsInteractionMessage(resourceKey);
        });
    }
}

function sendLmsInteractionMessage(courseId = currentCourseId) {
    const resourceKey = resolveCanonicalLmsResourceKey(courseId || currentCourseId || '');
    const input = document.getElementById('chat-input-text');
    const text = String(input?.value || '').trim();
    if (!resourceKey || !text) return;
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    if (!Array.isArray(KIU_STATE.messages[resourceKey])) KIU_STATE.messages[resourceKey] = [];
    const now = new Date();
    KIU_STATE.messages[resourceKey].push({
        sender: getSimulatedUserName(),
        text,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        createdAt: now.toISOString(),
        isStaff: canManageLmsGroupContent(),
        isProf: [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())
    });
    saveState();
    renderLmsInteractionSection(resourceKey);
}

function renderLmsAttendanceSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('attendance', contentArea);
    const parsed = parseLmsCourseKey(courseId || currentCourseId || '');
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey || courseId || currentCourseId || '');
    const today = new Date().toISOString().split('T')[0];
    if (!KIU_STATE.attendance || typeof KIU_STATE.attendance !== 'object') KIU_STATE.attendance = {};
    if (!KIU_STATE.attendance[resourceKey]) KIU_STATE.attendance[resourceKey] = {};
    if (!KIU_STATE.attendance[resourceKey][today]) KIU_STATE.attendance[resourceKey][today] = {};
    const students = parsed.courseId && parsed.groupId
        ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId)
        : getGradebookGroupsForCurrentUser().flatMap(group => getEnrolledStudentsForGroup(group.courseId, group.groupId));
    const canManage = canManageLmsGroupContent();
    const attendance = KIU_STATE.attendance[resourceKey][today] || {};
    const counts = students.reduce((acc, student) => {
        const status = attendance[student.id] || 'Unmarked';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { Present: 0, Late: 0, Absent: 0, Unmarked: 0 });
    const studentRows = students.length ? students.map(student => {
        const status = attendance[student.id] || '';
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(student.name || student.nameEn || student.id)}</strong>
                    <span>${escapeHtml(student.id || '')}</span>
                </td>
                <td>${escapeHtml(status || 'Unmarked')}</td>
                <td>
                    <select class="lms-route-select" ${canManage ? '' : 'disabled'} data-lms-change="markLmsAttendanceStatus(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(today)}, ${lmsInlineArg(student.id)}, this.value)">
                        <option value="" ${status === '' ? 'selected' : ''}>Unmarked</option>
                        <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Late" ${status === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('') : `<tr><td colspan="3">No students found for this group.</td></tr>`;
    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <section class="lms-route-hero">
                <div class="lms-route-hero-grid">
                    <div>
                        <div class="lms-route-eyebrow">Attendance</div>
                        <div class="lms-route-title" style="margin-top:10px;"><i class="fas fa-user-check"></i> Daily Attendance</div>
                        <div class="lms-route-copy" style="margin-top:12px;">Record today&apos;s class presence for this LMS group with the same native LMS interface.</div>
                    </div>
                    ${renderLmsRouteStats([
                        { label: 'Present', value: counts.Present || 0 },
                        { label: 'Late', value: counts.Late || 0 },
                        { label: 'Absent', value: counts.Absent || 0 },
                        { label: 'Unmarked', value: counts.Unmarked || 0 }
                    ])}
                </div>
            </section>
            <section class="lms-route-panel">
                <div class="lms-route-card-head" style="margin-bottom:16px;">
                    <div>
                        <div class="lms-route-card-title">${escapeHtml(today)}</div>
                        <div class="lms-route-copy" style="margin-top:6px;">${canManage ? 'Staff can update attendance.' : 'Students can view their recorded attendance.'}</div>
                    </div>
                    <span class="lms-route-pill"><i class="fas fa-users"></i> ${students.length} students</span>
                </div>
                <div class="lms-route-table-shell">
                    <table class="kiu-table lms-attendance-table">
                        <thead><tr><th>Student</th><th>Status</th><th>Mark</th></tr></thead>
                        <tbody>${studentRows}</tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

function markLmsAttendanceStatus(resourceKey, date, studentId, status) {
    if (!canManageLmsGroupContent()) {
        alert('Only professor, TA, or admin users can update attendance.');
        return;
    }
    const key = resolveCanonicalLmsResourceKey(resourceKey || currentCourseId || '');
    if (!KIU_STATE.attendance || typeof KIU_STATE.attendance !== 'object') KIU_STATE.attendance = {};
    if (!KIU_STATE.attendance[key]) KIU_STATE.attendance[key] = {};
    if (!KIU_STATE.attendance[key][date]) KIU_STATE.attendance[key][date] = {};
    if (status) KIU_STATE.attendance[key][date][studentId] = status;
    else delete KIU_STATE.attendance[key][date][studentId];
    saveState();
    renderLmsAttendanceSection(key);
}

function getLmsSectionEnhancementContext(tab, courseId = currentCourseId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(getLmsTabCourseKey(tab) || courseId || '');
    const role = getEffectiveUserRole();
    const isStaff = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(role);
    const subject = parsed.courseId ? (getDomain().subjectsById?.[parsed.courseId] || KIU_STATE.curriculum?.find(item => item.id === parsed.courseId)) : null;
    const group = parsed.courseId && parsed.groupId ? (KIU_STATE.availableGroups?.[parsed.courseId] || []).find(item => item.id === parsed.groupId) : null;
    const students = parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : [];
    const assignments = resourceKey ? ensureLmsAssignmentsForKey(resourceKey) : [];
    const materials = resourceKey ? ensureLmsMaterialsForKey(resourceKey) : [];
    const concepts = resourceKey ? ensureLmsConceptsForKey(resourceKey) : [];
    const quizzes = resourceKey ? ensureLmsQuizzesForKey(resourceKey) : [];
    const liveSessions = resourceKey ? getLmsLiveSessions(resourceKey) : [];
    const classCalls = resourceKey ? ensureLmsClassSessionsForKey(resourceKey) : [];
    const markers = resourceKey ? ensureLmsSessionMarkers(resourceKey) : [];
    const moderation = resourceKey ? ensureLmsInteractionModerationForKey(resourceKey) : [];
    return {
        tab,
        courseId,
        resourceKey,
        role,
        isStaff,
        subjectLabel: repairLmsDisplayText(subject?.name || parsed.courseId || 'LMS Group', 'LMS Group'),
        groupLabel: repairLmsDisplayText(group?.name || parsed.groupId || 'Group', 'Group'),
        students,
        assignments,
        materials,
        concepts,
        quizzes,
        liveSessions,
        classCalls,
        markers,
        moderation
    };
}

function getLmsSectionEnhancementConfig(ctx) {
    const submittedAssignments = ctx.assignments.filter(item => item.submissions && Object.keys(item.submissions).length > 0).length;
    const pendingQuizReviews = ctx.quizzes.reduce((sum, quiz) => {
        const workspace = ensureLmsQuizBuilderWorkspace(ctx.resourceKey);
        const store = workspace.submissions?.[quiz.id] || {};
        return sum + Object.values(store).filter(submission => submission?.requiresManualReview === true && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))).length;
    }, 0);
    const liveQuiz = ctx.liveSessions.find(session => session.status === 'live');
    const liveCall = ctx.classCalls.find(session => session.status === 'active');
    const base = {
        sessions: {
            icon: 'fa-calendar-check',
            title: 'Class Sessions',
            copy: 'Timeline for seminars, lectures, marked activities, attendance moments, and linked classroom work.',
            stats: [
                ['Markers', ctx.markers.length],
                ['Students', ctx.students.length],
                ['Live quiz', liveQuiz ? 'Active' : 'None'],
                ['Upcoming', ctx.markers.filter(marker => new Date(marker.date || marker.startsAt || 0).getTime() > Date.now()).length]
            ],
            actions: ctx.isStaff ? ['Start attendance', 'Attach material', 'Link quiz'] : ['Today', 'Materials', 'Quiz status']
        },
        'live-quiz': {
            icon: 'fa-bolt',
            title: 'Live Quiz Control Room',
            copy: ctx.isStaff ? 'Run seminar questions, reveal one question at a time, monitor participation, and review results.' : 'Join live classroom questions when the professor or TA reveals them.',
            stats: [
                ['Sessions', ctx.liveSessions.length],
                ['Live now', liveQuiz ? 'Yes' : 'No'],
                ['Participants', ctx.students.length],
                ['Pending reviews', pendingQuizReviews]
            ],
            actions: ctx.isStaff ? ['Question queue', 'Response heatmap', 'Leaderboard'] : ['Waiting room', 'Timer', 'Results']
        },
        interaction: {
            icon: 'fa-comments',
            title: 'Classroom Interaction Feed',
            copy: 'Questions, announcements, polls, and staff replies should stay organized like a professional seminar feed.',
            stats: [
                ['Members', ctx.students.length],
                ['Staff tools', ctx.isStaff ? 'Enabled' : 'Read only'],
                ['Pinned items', ctx.moderation.filter(item => item.pinned && !item.hidden).length],
                ['Open questions', ctx.moderation.filter(item => item.status === 'new' && !item.hidden).length]
            ],
            actions: ctx.isStaff ? ['Pin question', 'Mark answered', 'Post announcement'] : ['Ask question', 'Follow replies', 'View pinned']
        },
        calls: {
            icon: 'fa-video',
            title: 'Class Calls Hub',
            copy: 'Live classroom calls, recordings, attendance signals, and session history in one place.',
            stats: [
                ['Calls', ctx.classCalls.length],
                ['Live call', liveCall ? 'Active' : 'None'],
                ['Recordings', ctx.classCalls.filter(call => call.recordingUrl).length],
                ['Students', ctx.students.length]
            ],
            actions: ctx.isStaff ? ['Start call', 'Recordings', 'Attendance'] : ['Join call', 'Waiting status', 'Recordings']
        },
        members: {
            icon: 'fa-users',
            title: 'Group Members',
            copy: 'Roster with students, staff, participation risk, grade context, and quick profile actions.',
            stats: [
                ['Students', ctx.students.length],
                ['Professor', '1'],
                ['TA', '1'],
                ['Grade risk', 'Tracked']
            ],
            actions: ctx.isStaff ? ['Message', 'View grades', 'Attendance'] : ['Classmates', 'Staff contacts', 'Group']
        },
        materials: {
            icon: 'fa-folder-open',
            title: 'Learning Materials',
            copy: 'Week-based library for slides, readings, files, links, recordings, and pinned resources.',
            stats: [
                ['Files', ctx.materials.length],
                ['Weeks', new Set(ctx.materials.map(item => item.weekLabel).filter(Boolean)).size],
                ['Pinned', ctx.materials.filter(item => item.pinned).length],
                ['Staff upload', ctx.isStaff ? 'Enabled' : 'Hidden']
            ],
            actions: ctx.isStaff ? ['Upload', 'Pin', 'Attach to session'] : ['Preview', 'Download', 'By week']
        },
        concepts: {
            icon: 'fa-lightbulb',
            title: 'Concept Wiki',
            copy: 'Student and staff explanations, examples, peer scores, and approved learning notes.',
            stats: [
                ['Concepts', ctx.concepts.length],
                ['Reviewed', ctx.concepts.filter(item => item.reviewed || item.approved).length],
                ['Student posts', ctx.concepts.filter(item => item.authorRole === USER_ROLES.STUDENT).length],
                ['Quality', 'Peer rated']
            ],
            actions: ctx.isStaff ? ['Approve', 'Pin', 'Correct'] : ['Submit concept', 'Rate', 'Study']
        },
        assignments: {
            icon: 'fa-clipboard-list',
            title: 'Assignment Workflow',
            copy: 'Draft, open, submitted, late, graded, and feedback states for homework and classroom tasks.',
            stats: [
                ['Assignments', ctx.assignments.length],
                ['Submitted', submittedAssignments],
                ['Open', ctx.assignments.filter(item => item.status !== 'closed').length],
                ['Needs feedback', submittedAssignments]
            ],
            actions: ctx.isStaff ? ['Grade queue', 'Rubrics', 'Feedback'] : ['Due dates', 'Submit', 'Feedback']
        },
        quiz: {
            icon: 'fa-pen-to-square',
            title: ctx.isStaff ? 'Quiz Studio' : 'My Quizzes',
            copy: ctx.isStaff ? 'Build protected quizzes, variants, review pending written answers, and inspect results.' : 'Upcoming, live, submitted, pending-review, and graded quizzes in one place.',
            stats: [
                ['Quizzes', ctx.quizzes.length],
                ['Published', ctx.quizzes.filter(quiz => quiz.status === 'published' || quiz.published).length],
                ['Pending reviews', pendingQuizReviews],
                ['Anti-cheat', ctx.quizzes.filter(quiz => quiz.protectedDelivery !== false).length]
            ],
            actions: ctx.isStaff ? ['Builder', 'Review queue', 'Analytics'] : ['Open safely', 'Pending result', 'Final score']
        },
        gradebook: {
            icon: 'fa-chart-bar',
            title: 'Grades',
            copy: 'Transcript, weighted contribution, pending review, final score, and staff grade management.',
            stats: [
                ['Students', ctx.students.length],
                ['Quizzes', ctx.quizzes.length],
                ['Pending reviews', pendingQuizReviews],
                ['Published state', 'Tracked']
            ],
            actions: ctx.isStaff ? ['Grade queue', 'Export', 'Finalize'] : ['Transcript', 'Weights', 'History']
        }
    };
    return base[ctx.tab] || base.sessions;
}

function renderLmsProfessionalSectionHero(ctx, config) {
    return `
        <section class="lms-pro-hero" data-lms-pro-hero="${escapeHtml(ctx.tab)}">
            <div class="lms-pro-hero-main">
                <div class="lms-pro-icon"><i class="fas ${escapeHtml(config.icon)}"></i></div>
                <div>
                    <div class="lms-pro-kicker">${escapeHtml(ctx.subjectLabel)} / ${escapeHtml(ctx.groupLabel)}</div>
                    <h2>${escapeHtml(config.title)}</h2>
                    <p>${escapeHtml(config.copy)}</p>
                </div>
            </div>
            <div class="lms-pro-actions">
                ${(config.actions || []).map(action => `<span>${escapeHtml(action)}</span>`).join('')}
            </div>
            <div class="lms-pro-stat-grid">
                ${(config.stats || []).map(([label, value]) => `
                    <div class="lms-pro-stat">
                        <span>${escapeHtml(label)}</span>
                        <strong>${escapeHtml(String(value))}</strong>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function ensureLmsInteractionModerationForKey(resourceKey) {
    ensureLmsStores();
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!Array.isArray(KIU_STATE.lmsInteractionModeration[canonicalKey])) {
        KIU_STATE.lmsInteractionModeration[canonicalKey] = [];
    }
    KIU_STATE.lmsInteractionModeration[canonicalKey] = KIU_STATE.lmsInteractionModeration[canonicalKey].map(item => ({
        id: String(item.id || `mod_${Date.now()}_${Math.random().toString(16).slice(2)}`),
        type: item.type || 'question',
        text: repairLmsDisplayText(item.text || '', ''),
        authorId: String(item.authorId || ''),
        authorName: item.authorName || 'Student',
        status: ['new', 'answered', 'pinned', 'hidden'].includes(String(item.status)) ? String(item.status) : 'new',
        answer: item.answer || '',
        pinned: Boolean(item.pinned || item.status === 'pinned'),
        hidden: Boolean(item.hidden || item.status === 'hidden'),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        handledBy: item.handledBy || ''
    })).sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    return KIU_STATE.lmsInteractionModeration[canonicalKey];
}

function createLmsInteractionQuestion(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const token = toDomToken(canonicalKey);
    const input = document.getElementById(`lms-interaction-question-${token}`);
    const text = input?.value?.trim() || '';
    if (!text) {
        alert('Please write a question first.');
        return;
    }
    const user = getCurrentUser?.() || {};
    ensureLmsInteractionModerationForKey(canonicalKey).unshift({
        id: `mod_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type: 'question',
        text,
        authorId: String(getCurrentUserId?.() || user.id || 'student'),
        authorName: user.nameEn || user.name || user.email || 'Student',
        status: 'new',
        answer: '',
        pinned: false,
        hidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    if (input) input.value = '';
    saveState();
    rerenderCurrentLmsTab();
}

function updateLmsInteractionModerationItem(resourceKey, itemId, action = 'answered') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const item = ensureLmsInteractionModerationForKey(canonicalKey).find(entry => String(entry.id) === String(itemId));
    if (!item) return;
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can moderate interaction items.');
        return;
    }
    if (action === 'answer') {
        const answer = prompt('Staff answer', item.answer || '');
        if (answer === null) return;
        item.answer = answer.trim();
        item.status = item.answer ? 'answered' : 'new';
        item.hidden = false;
    } else if (action === 'pin') {
        item.pinned = !item.pinned;
        item.status = item.pinned ? 'pinned' : (item.answer ? 'answered' : 'new');
        item.hidden = false;
    } else if (action === 'hide') {
        item.hidden = !item.hidden;
        item.status = item.hidden ? 'hidden' : (item.pinned ? 'pinned' : item.answer ? 'answered' : 'new');
    }
    item.handledBy = getSimulatedUserName();
    item.updatedAt = new Date().toISOString();
    saveState();
    rerenderCurrentLmsTab();
}

function computeLmsQuizAnalytics(resourceKey) {
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    const quizzes = ensureLmsQuizzesForKey(resourceKey);
    const submissions = quizzes.flatMap(quiz => Object.values(workspace.submissions?.[quiz.id] || {}).map(submission => ({ quiz, submission })));
    const completed = submissions.filter(entry => ['submitted', 'auto-submitted', 'graded'].includes(String(entry.submission.status || '')));
    const pending = completed.filter(entry => entry.submission.requiresManualReview === true).length;
    const scores = completed.map(entry => Number(entry.submission.gradebookScore ?? entry.submission.finalScoreRaw ?? entry.submission.autoScoreRaw)).filter(Number.isFinite);
    const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    const questionResults = completed.flatMap(entry => Array.isArray(entry.submission.questionResults) ? entry.submission.questionResults : []);
    const correct = questionResults.filter(result => result.isCorrect === true).length;
    const accuracy = questionResults.length ? Math.round((correct / questionResults.length) * 100) : 0;
    return {
        quizzes: quizzes.length,
        submissions: completed.length,
        pending,
        average,
        accuracy,
        questionResults
    };
}

function computeLmsMemberRisk(student, ctx) {
    const studentId = String(student.id || '');
    const assignmentTotal = ctx.assignments.length;
    const submittedAssignments = ctx.assignments.filter(item => getLmsAssignmentSubmissions(ctx.resourceKey, item.id)?.[studentId]).length;
    const missingAssignments = Math.max(0, assignmentTotal - submittedAssignments);
    const attendedCalls = ctx.classCalls.filter(call => Array.isArray(call.participantIds) && call.participantIds.map(String).includes(studentId)).length;
    const endedCalls = ctx.classCalls.filter(call => call.status === 'ended').length;
    const quizAnalytics = ensureLmsQuizzesForKey(ctx.resourceKey).map(quiz => ensureLmsQuizBuilderWorkspace(ctx.resourceKey).submissions?.[quiz.id]?.[studentId]).filter(Boolean);
    const pendingReviews = quizAnalytics.filter(submission => submission.requiresManualReview === true).length;
    let risk = 0;
    if (assignmentTotal && missingAssignments / assignmentTotal >= 0.5) risk += 35;
    if (endedCalls >= 2 && attendedCalls === 0) risk += 25;
    if (pendingReviews) risk += 15;
    if (!quizAnalytics.length && ctx.quizzes.length) risk += 20;
    const level = risk >= 55 ? 'High risk' : risk >= 25 ? 'Watch' : 'Stable';
    return {
        level,
        risk,
        missingAssignments,
        attendedCalls,
        endedCalls,
        pendingReviews,
        tone: risk >= 55 ? 'danger' : risk >= 25 ? 'pending' : 'success'
    };
}

function renderLmsDeepToolkitCard(title, value, copy = '', icon = 'fa-circle-info', tone = 'info') {
    return `
        <div class="lms-deep-card is-${escapeHtml(tone)}">
            <div class="lms-deep-card-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
            <div>
                <strong>${escapeHtml(String(value))}</strong>
                <span>${escapeHtml(title)}</span>
                ${copy ? `<p>${escapeHtml(copy)}</p>` : ''}
            </div>
        </div>
    `;
}

function renderLmsDeepToolkitList(items = [], emptyTitle = 'Nothing here yet') {
    if (!items.length) {
        return `
            <div class="lms-deep-empty">
                <i class="fas fa-inbox"></i>
                <strong>${escapeHtml(emptyTitle)}</strong>
                <span>This panel will update automatically when the group has activity.</span>
            </div>
        `;
    }
    return items.map(item => `
        <div class="lms-deep-list-row">
            <div>
                <strong>${escapeHtml(item.title || 'Untitled')}</strong>
                <span>${escapeHtml(item.meta || '')}</span>
            </div>
            <em class="is-${escapeHtml(item.tone || 'info')}">${escapeHtml(item.status || 'Ready')}</em>
        </div>
    `).join('');
}

function renderLmsDeepWorkflowBoard(columns = []) {
    return `
        <div class="lms-deep-board">
            ${columns.map(column => `
                <section class="lms-deep-column">
                    <div class="lms-deep-column-head">
                        <strong>${escapeHtml(column.title)}</strong>
                        <span>${Array.isArray(column.items) ? column.items.length : 0}</span>
                    </div>
                    <div class="lms-deep-column-body">
                        ${renderLmsDeepToolkitList(column.items || [], column.empty || `No ${column.title.toLowerCase()} items`)}
                    </div>
                </section>
            `).join('')}
        </div>
    `;
}

function renderLmsDeepSectionToolkit(ctx) {
    const now = Date.now();
    const quizAnalytics = computeLmsQuizAnalytics(ctx.resourceKey);
    const moderationItems = (ctx.moderation || []).filter(item => !item.hidden || ctx.isStaff).slice(0, 8).map(item => ({
        title: item.text || 'Classroom question',
        meta: joinLmsMeta([item.authorName || 'Student', item.answer ? `Answer: ${item.answer}` : 'Waiting for staff response']),
        status: item.hidden ? 'Hidden' : item.pinned ? 'Pinned' : item.status === 'answered' ? 'Answered' : 'New',
        tone: item.hidden ? 'danger' : item.pinned || item.status === 'answered' ? 'success' : 'pending',
        raw: item
    }));
    const assignmentColumns = [
        {
            title: 'Open',
            items: ctx.assignments.filter(item => String(item.status || 'open') !== 'closed').map(item => ({
                title: item.title || 'Assignment',
                meta: joinLmsMeta([item.weekLabel || 'General', item.dueAt ? `Due ${formatLmsDateTime(item.dueAt)}` : 'No due date']),
                status: 'Open',
                tone: 'info'
            }))
        },
        {
            title: 'Submitted',
            items: ctx.assignments.filter(item => item.submissions && Object.keys(item.submissions).length > 0).map(item => ({
                title: item.title || 'Assignment',
                meta: `${Object.keys(item.submissions || {}).length} submission${Object.keys(item.submissions || {}).length === 1 ? '' : 's'}`,
                status: 'Review',
                tone: 'pending'
            }))
        },
        {
            title: 'Late / Missing',
            items: ctx.assignments.filter(item => item.dueAt && new Date(item.dueAt).getTime() < now && !(item.submissions && Object.keys(item.submissions).length)).map(item => ({
                title: item.title || 'Assignment',
                meta: item.dueAt ? `Was due ${formatLmsDateTime(item.dueAt)}` : 'No due date',
                status: 'Late',
                tone: 'danger'
            }))
        },
        {
            title: 'Graded',
            items: ctx.assignments.filter(item => item.graded || item.status === 'graded').map(item => ({
                title: item.title || 'Assignment',
                meta: item.weekLabel || 'General',
                status: 'Graded',
                tone: 'success'
            }))
        }
    ];
    const materialItems = ctx.materials.slice(0, 8).map(item => ({
        title: item.title || item.file?.name || 'Material',
        meta: joinLmsMeta([item.weekLabel || 'General', item.file?.name || 'Attachment', item.uploadedBy || 'Course staff']),
        status: item.pinned ? 'Pinned' : 'Published',
        tone: item.pinned ? 'success' : 'info'
    }));
    const conceptItems = ctx.concepts.slice(0, 8).map(item => {
        const stats = computeLmsConceptScoreSummary(ctx.resourceKey, item.id);
        return {
            title: item.title || 'Concept',
            meta: joinLmsMeta([item.weekLabel || 'General', `${stats.average || 0}/10 avg`, `${stats.count || 0} rating${stats.count === 1 ? '' : 's'}`]),
            status: item.approved || item.reviewed ? 'Reviewed' : 'Needs review',
            tone: item.approved || item.reviewed ? 'success' : 'pending'
        };
    });
    const quizItems = ctx.quizzes.slice(0, 8).map(quiz => {
        const workspace = ensureLmsQuizBuilderWorkspace(ctx.resourceKey);
        const submissions = Object.values(workspace.submissions?.[quiz.id] || {});
        const pending = submissions.filter(submission => submission?.requiresManualReview === true && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))).length;
        return {
            title: quiz.title || getLmsQuizDisplayLabel(quiz),
            meta: joinLmsMeta([getLmsQuizDisplayLabel(quiz), `${submissions.length} submission${submissions.length === 1 ? '' : 's'}`, quiz.protectedDelivery === false ? 'Standard' : 'Anti-cheat']),
            status: pending ? `${pending} pending` : (submissions.length ? 'Results' : 'Ready'),
            tone: pending ? 'pending' : 'success'
        };
    });
    const memberItems = ctx.students.slice(0, 10).map(student => ({
        title: student.name || student.id,
        meta: (() => {
            const risk = computeLmsMemberRisk(student, ctx);
            return joinLmsMeta([student.id, student.email || student.facultyLabel || 'Student', `${risk.missingAssignments} missing`, `${risk.attendedCalls}/${risk.endedCalls} calls`]);
        })(),
        status: computeLmsMemberRisk(student, ctx).level,
        tone: computeLmsMemberRisk(student, ctx).tone
    }));
    const callItems = ctx.classCalls.slice(0, 6).map(call => ({
        title: call.title || 'Class call',
        meta: joinLmsMeta([call.status || 'scheduled', call.scheduledAt ? formatLmsDateTime(call.scheduledAt) : '', `${call.participantIds?.length || 0} joined`, call.studyPackage?.recordingStatus || (call.roomSettings?.recording ? 'Recording marked' : 'No recording')]),
        status: call.status === 'ended' && call.studyPackage?.recordingStatus ? call.studyPackage.recordingStatus : (call.status || 'Ready'),
        tone: call.status === 'active' ? 'success' : call.status === 'ended' ? 'info' : 'pending'
    }));
    const sessionItems = ctx.markers.slice(0, 8).map(marker => ({
        title: marker.title || marker.label || LMS_SESSION_MARKER_TYPES[marker.type]?.label || 'Session marker',
        meta: joinLmsMeta([marker.weekLabel || 'General', marker.date || marker.startsAt || '', marker.description || '']),
        status: LMS_SESSION_MARKER_TYPES[marker.type]?.label || 'Marked',
        tone: LMS_SESSION_MARKER_TYPES[marker.type]?.tone || 'info'
    }));

    const tabPanels = {
        sessions: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Upcoming markers', sessionItems.length, 'Session timeline entries and classroom moments.', 'fa-calendar-days', 'info')}
                ${renderLmsDeepToolkitCard('Attendance roster', ctx.students.length, 'Available for staff-controlled class tracking.', 'fa-user-check', 'success')}
                ${renderLmsDeepToolkitCard('Linked quizzes', ctx.quizzes.length, 'Quizzes can be connected to session milestones.', 'fa-pen-to-square', 'pending')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(sessionItems, 'No session markers yet')}</div>
        `,
        'live-quiz': `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Quiz bank', ctx.quizzes.length, 'Reusable protected and standard quizzes.', 'fa-layer-group', 'info')}
                ${renderLmsDeepToolkitCard('Average score', `${quizAnalytics.average}%`, `${quizAnalytics.submissions} completed submissions.`, 'fa-chart-line', quizAnalytics.average ? 'success' : 'info')}
                ${renderLmsDeepToolkitCard('Question accuracy', `${quizAnalytics.accuracy}%`, `${quizAnalytics.pending} written reviews pending.`, 'fa-fire', quizAnalytics.pending ? 'pending' : 'success')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(quizItems, 'No quizzes created yet')}</div>
        `,
        interaction: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Open questions', ctx.moderation.filter(item => item.status === 'new' && !item.hidden).length, 'Needs staff response.', 'fa-circle-question', 'pending')}
                ${renderLmsDeepToolkitCard('Answered', ctx.moderation.filter(item => item.status === 'answered' || item.answer).length, 'Resolved classroom questions.', 'fa-comments', 'success')}
                ${renderLmsDeepToolkitCard('Pinned FAQ', ctx.moderation.filter(item => item.pinned && !item.hidden).length, 'Important answers promoted for the class.', 'fa-thumbtack', 'info')}
            </div>
            <div class="lms-deep-panel">
                <div class="lms-deep-question-composer">
                    <input id="lms-interaction-question-${toDomToken(ctx.resourceKey)}" class="lms-route-input" type="text" placeholder="Ask a classroom question">
                    <button class="kiu-btn-blue" data-lms-click="createLmsInteractionQuestion('${ctx.resourceKey}')"><i class="fas fa-paper-plane"></i> Ask</button>
                </div>
                ${moderationItems.length ? moderationItems.map(item => `
                    <div class="lms-deep-list-row">
                        <div>
                            <strong>${escapeHtml(item.title)}</strong>
                            <span>${escapeHtml(item.meta || '')}</span>
                            ${ctx.isStaff ? `<div class="lms-deep-row-actions">
                                <button data-lms-click="updateLmsInteractionModerationItem('${ctx.resourceKey}', '${item.raw.id}', 'answer')">Answer</button>
                                <button data-lms-click="updateLmsInteractionModerationItem('${ctx.resourceKey}', '${item.raw.id}', 'pin')">${item.raw.pinned ? 'Unpin' : 'Pin'}</button>
                                <button data-lms-click="updateLmsInteractionModerationItem('${ctx.resourceKey}', '${item.raw.id}', 'hide')">${item.raw.hidden ? 'Show' : 'Hide'}</button>
                            </div>` : ''}
                        </div>
                        <em class="is-${escapeHtml(item.tone || 'info')}">${escapeHtml(item.status || 'Ready')}</em>
                    </div>
                `).join('') : renderLmsDeepToolkitList([], 'No classroom questions yet')}
            </div>
        `,
        calls: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Calls', ctx.classCalls.length, 'Scheduled, live, and ended classroom calls.', 'fa-video', 'info')}
                ${renderLmsDeepToolkitCard('Live now', ctx.classCalls.some(call => call.status === 'active') ? 'Active' : 'None', 'Students see join/waiting state clearly.', 'fa-signal', 'success')}
                ${renderLmsDeepToolkitCard('Recordings', ctx.classCalls.filter(call => call.recordingUrl).length, 'Recording links appear after class.', 'fa-record-vinyl', 'pending')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(callItems, 'No calls scheduled yet')}</div>
        `,
        members: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Students', ctx.students.length, 'Roster, grade risk, attendance, and participation.', 'fa-users', 'info')}
                ${renderLmsDeepToolkitCard('High risk', memberItems.filter(item => item.tone === 'danger').length, 'Missing work, attendance, and quiz signals.', 'fa-triangle-exclamation', memberItems.some(item => item.tone === 'danger') ? 'danger' : 'success')}
                ${renderLmsDeepToolkitCard('Watch list', memberItems.filter(item => item.tone === 'pending').length, 'Students needing early attention.', 'fa-filter', 'pending')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(memberItems, 'No enrolled members found')}</div>
        `,
        materials: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Files', ctx.materials.length, 'Slides, readings, recordings, and attachments.', 'fa-folder-open', 'info')}
                ${renderLmsDeepToolkitCard('Weeks', new Set(ctx.materials.map(item => item.weekLabel).filter(Boolean)).size, 'Materials are organized by teaching week.', 'fa-calendar-week', 'success')}
                ${renderLmsDeepToolkitCard('Pinned resources', ctx.materials.filter(item => item.pinned).length, 'Important material can stay visible.', 'fa-thumbtack', 'pending')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(materialItems, 'No materials uploaded yet')}</div>
        `,
        concepts: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Concept notes', ctx.concepts.length, 'Shared definitions and explanations.', 'fa-lightbulb', 'info')}
                ${renderLmsDeepToolkitCard('Reviewed', ctx.concepts.filter(item => item.reviewed || item.approved).length, 'Staff-approved explanations.', 'fa-circle-check', 'success')}
                ${renderLmsDeepToolkitCard('Peer scoring', '5-10', 'Students can rate helpful concepts.', 'fa-star', 'pending')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(conceptItems, 'No concepts shared yet')}</div>
        `,
        assignments: renderLmsDeepWorkflowBoard(assignmentColumns),
        quiz: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Quiz studio', ctx.quizzes.length, 'Draft, publish, review, and result boards.', 'fa-pen-to-square', 'info')}
                ${renderLmsDeepToolkitCard('Manual reviews', quizItems.filter(item => item.tone === 'pending').length, 'Written answers wait for staff grading.', 'fa-user-pen', 'pending')}
                ${renderLmsDeepToolkitCard('Anti-cheat ready', ctx.quizzes.filter(quiz => quiz.protectedDelivery !== false).length, 'Protected delivery is tracked per quiz.', 'fa-shield-halved', 'success')}
            </div>
            <div class="lms-deep-panel">${renderLmsDeepToolkitList(quizItems, 'No quizzes available yet')}</div>
        `
    };
    const panel = tabPanels[ctx.tab];
    if (!panel) return '';
    return `
        <section class="lms-deep-toolkit" data-lms-deep-toolkit="${escapeHtml(ctx.tab)}">
            <div class="lms-deep-head">
                <div>
                    <div class="lms-pro-kicker">Operational Workspace</div>
                    <h3>${escapeHtml(getLmsSectionEnhancementConfig(ctx).title)} tools</h3>
                </div>
                <span>${ctx.isStaff ? 'Staff workflow' : 'Student workflow'}</span>
            </div>
            ${panel}
        </section>
    `;
}

function cleanupLmsInjectedEnhancementBlocks(contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return;
    contentArea.querySelectorAll('[data-lms-pro-hero], [data-lms-deep-toolkit]').forEach(node => node.remove());
}

let lmsTabRenderSequence = 0;
const LMS_TAB_RENDER_CACHE = Object.create(null);

function prepareLmsContentAreaForTab(tab, contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return 0;
    cleanupLmsInjectedEnhancementBlocks(contentArea);
    lmsTabRenderSequence += 1;
    contentArea.dataset.activeLmsTab = String(tab || '');
    contentArea.dataset.lmsRenderToken = String(lmsTabRenderSequence);
    contentArea.classList.remove('lms-tab-sessions', 'lms-tab-live-quiz', 'lms-tab-interaction', 'lms-tab-calls', 'lms-tab-members', 'lms-tab-materials', 'lms-tab-concepts', 'lms-tab-quiz', 'lms-tab-monitoring', 'lms-tab-workspace', 'lms-tab-attendance');
    if (tab) contentArea.classList.add(`lms-tab-${String(tab).replace(/[^a-z0-9-]/gi, '-')}`);
    return lmsTabRenderSequence;
}

function isLmsRenderCurrent(tab, token, contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return false;
    return contentArea.dataset.activeLmsTab === String(tab || '') && contentArea.dataset.lmsRenderToken === String(token || '');
}

function enhanceLmsTabExperience(tab, courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || tab === 'gradebook') return;
    cleanupLmsInjectedEnhancementBlocks(contentArea);
    contentArea.dataset.enhancedLmsTab = String(tab || '');
    contentArea.querySelectorAll('.lms-route-empty').forEach(empty => empty.classList.add('lms-pro-empty'));
    contentArea.querySelectorAll('.lms-route-panel, .lms-route-card, .course-card').forEach(card => card.classList.add('lms-pro-surface'));
}

function switchLMSTab(tab) {
    closeLmsQuizOverlays();
    refreshLmsQuizTabPresentation();
    syncLmsSectionSwitchPresentation();
    const effectiveRole = getEffectiveUserRole();
    if (tab === 'monitoring' && ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole)) {
        alert('Only professors, teaching assistants, and admins can open this tab.');
        return;
    }
    if (tab !== 'quiz') {
        currentLmsQuizCourseKey = '';
    }
    document.querySelectorAll('#page-lms-inner .tab').forEach(el => el.classList.remove('active'));
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');
    
    const contentArea = document.getElementById('lms-content-area');
    const gbWrapper = ensureLmsGradebookShell();
    const tabCourseKey = getLmsTabCourseKey(tab);
    const normalizedCourseKey = String(tabCourseKey || currentCourseId || '');
    const cacheKey = `${String(tab || '')}::${normalizedCourseKey}`;
    const gradebookVisible = Boolean(gbWrapper && gbWrapper.style.display === 'block');
    const contentVisible = Boolean(contentArea && contentArea.style.display !== 'none');
    if (
        contentArea
        && contentArea.dataset.activeLmsTab === String(tab || '')
        && contentArea.dataset.activeLmsCourseKey === normalizedCourseKey
        && ((tab === 'gradebook' && gradebookVisible) || (tab !== 'gradebook' && contentVisible))
    ) {
        const currentTabButton = document.getElementById(`tab-${tab}`);
        if (currentTabButton) currentTabButton.classList.add('active');
        return;
    }
    
    if (contentArea) contentArea.style.display = 'block';
    if (gbWrapper) gbWrapper.style.display = 'none';
    prepareLmsContentAreaForTab(tab, contentArea);
    if (contentArea) {
        contentArea.dataset.activeLmsCourseKey = normalizedCourseKey;
        if (LMS_TAB_RENDER_CACHE[cacheKey]) {
            contentArea.innerHTML = LMS_TAB_RENDER_CACHE[cacheKey];
            enhanceLmsTabExperience(tab, tabCourseKey || currentCourseId);
            return;
        }
    }
    
    if (tab === 'gradebook') {
        if (contentArea) contentArea.style.display = 'none';
        if (gbWrapper) {
            gbWrapper.style.display = 'block';
            const parsed = parseLmsCourseKey(currentCourseId);
            if (parsed.courseId && parsed.groupId) {
                openGradebookSection(parsed.courseId, parsed.groupId, document.getElementById('lms-course-title')?.innerText || 'Grades');
            } else if (typeof renderGradebookRosterSelection === 'function') {
                document.getElementById('gradebook-spreadsheet-view').style.display = 'none';
                document.getElementById('gradebook-roster-selection').style.display = 'block';
                renderGradebookRosterSelection();
            }
        }
    } else if (tab === 'sessions') {
        renderLmsSessionsSection(currentCourseId);
    } else if (tab === 'live-quiz') {
        renderLmsLiveQuizSection(tabCourseKey);
    } else if (tab === 'interaction') {
        renderLmsInteractionSection(tabCourseKey || currentCourseId);
    } else if (tab === 'calls') {
        renderLmsCallsSection(tabCourseKey);
    } else if (tab === 'members') {
        renderLmsMembersSection(currentCourseId);
    } else if (tab === 'materials') {
        if (contentArea) {
            prepareLmsContentAreaForTab('materials', contentArea);
            contentArea.innerHTML = renderLmsMaterialsLibrary(tabCourseKey);
        }
    } else if (tab === 'concepts') {
        renderLmsConceptsLibrary(tabCourseKey);
    } else if (tab === 'quiz') {
        if (effectiveRole === USER_ROLES.STUDENT) {
            const studentQuizKey = resolveLmsQuizWorkspace(tabCourseKey)?.resourceKey
                || resolveCanonicalLmsResourceKey(tabCourseKey || '');
            if (studentQuizKey) {
                ensureLmsQuizUiState(studentQuizKey).studentQuizId = null;
            }
        }
        renderLmsQuizSection(tabCourseKey);
    } else if (tab === 'monitoring') {
        renderLmsMonitoringSection(tabCourseKey);
    } else if (tab === 'workspace') {
        renderWorkspace(tabCourseKey);
    } else if (tab === 'attendance') {
        renderLmsAttendanceSection(tabCourseKey || currentCourseId);
    }
    if (contentArea && tab !== 'gradebook') {
        LMS_TAB_RENDER_CACHE[cacheKey] = contentArea.innerHTML;
    }
    enhanceLmsTabExperience(tab, tabCourseKey || currentCourseId);
}

function lmsInlineArg(value) {
    return escapeHtml(JSON.stringify(String(value == null ? '' : value)));
}

function toggleAccordion(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('i');
    if (content.style.display === "block" || content.classList.contains('active')) {
        content.style.display = "none";
        content.classList.remove('active');
        icon.className = "fas fa-chevron-down";
    } else {
        content.style.display = "block";
        content.classList.add('active');
        icon.className = "fas fa-chevron-up";
    }
}

