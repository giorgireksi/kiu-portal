/* LMS week/store runtime: ensure* stores, week normalize/sort/group, week-manager modal CRUD. */

function ensureLmsAssignmentsForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!Array.isArray(KIU_STATE.groupAssignments[resourceKey])) {
        const legacy = Array.isArray(KIU_STATE.assignments[resourceKey]) ? KIU_STATE.assignments[resourceKey] : [];
        KIU_STATE.groupAssignments[resourceKey] = legacy.map(item => ({
            id: item.id || `asm_${Date.now()}`,
            title: item.title || 'Untitled assignment',
            description: item.description || '',
            weekLabel: normalizeLmsWeekLabel(item.weekLabel || ''),
            deadline: item.deadline || '',
            lateAllowed: Boolean(item.lateAllowed),
            attachment: cloneStoredFile(item.attachment),
            rubric: item.rubric || 'Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%',
            maxScore: Number.isFinite(Number(item.maxScore)) ? Number(item.maxScore) : 100,
            createdAt: item.createdAt || new Date().toISOString(),
            createdBy: item.createdBy || getSimulatedUserName()
        }));
    }
    KIU_STATE.groupAssignments[resourceKey] = KIU_STATE.groupAssignments[resourceKey].map(item => ({
        ...item,
        weekLabel: normalizeLmsWeekLabel(item.weekLabel || ''),
        rubric: item.rubric || 'Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%',
        maxScore: Number.isFinite(Number(item.maxScore)) ? Number(item.maxScore) : 100
    }));
    return KIU_STATE.groupAssignments[resourceKey];
}

function ensureLmsMaterialsForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!Array.isArray(KIU_STATE.groupMaterials[resourceKey])) {
        KIU_STATE.groupMaterials[resourceKey] = [];
    }
    KIU_STATE.groupMaterials[resourceKey] = KIU_STATE.groupMaterials[resourceKey].map((item, index) => ({
        ...item,
        weekLabel: normalizeLmsWeekLabel(item.weekLabel || ''),
        sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index,
        pinned: Boolean(item.pinned),
        archived: Boolean(item.archived),
        updatedAt: item.updatedAt || item.uploadedAt || new Date().toISOString()
    })).sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
    });
    return KIU_STATE.groupMaterials[resourceKey];
}

function ensureLmsSubmissionsForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!KIU_STATE.groupSubmissions[resourceKey] || typeof KIU_STATE.groupSubmissions[resourceKey] !== 'object') {
        KIU_STATE.groupSubmissions[resourceKey] = {};
    }
    return KIU_STATE.groupSubmissions[resourceKey];
}

function ensureLmsConceptsForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!Array.isArray(KIU_STATE.groupConcepts[resourceKey])) {
        KIU_STATE.groupConcepts[resourceKey] = [];
    }
    KIU_STATE.groupConcepts[resourceKey] = KIU_STATE.groupConcepts[resourceKey].map(concept => ({
        ...concept,
        weekLabel: normalizeLmsWeekLabel(concept.weekLabel || ''),
        reviewStatus: concept.reviewStatus || (concept.approved || concept.reviewed ? 'approved' : 'pending'),
        reviewed: Boolean(concept.reviewed || concept.approved),
        approved: Boolean(concept.approved || concept.reviewStatus === 'approved'),
        pinned: Boolean(concept.pinned)
    }));
    return KIU_STATE.groupConcepts[resourceKey];
}

function ensureLmsConceptRatingsForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!KIU_STATE.groupConceptRatings[resourceKey] || typeof KIU_STATE.groupConceptRatings[resourceKey] !== 'object') {
        KIU_STATE.groupConceptRatings[resourceKey] = {};
    }
    return KIU_STATE.groupConceptRatings[resourceKey];
}

function normalizeLmsWeekLabel(value) {
    return String(value || '').trim();
}

const LMS_WEEK_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compareLmsWeekLabels(left, right) {
    const a = normalizeLmsWeekLabel(left);
    const b = normalizeLmsWeekLabel(right);
    if (a === b) return 0;
    if (a === 'No Week / General') return -1;
    if (b === 'No Week / General') return 1;
    return LMS_WEEK_COLLATOR.compare(a, b);
}

function sortLmsWeekLabels(labels = []) {
    return [...new Set((labels || []).map(normalizeLmsWeekLabel).filter(Boolean))].sort(compareLmsWeekLabels);
}

function ensureLmsWeeksForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!Array.isArray(KIU_STATE.groupWeekConfigs[resourceKey])) {
        const discovered = []
            .concat(ensureLmsMaterialsForKey(resourceKey).map(item => normalizeLmsWeekLabel(item.weekLabel)).filter(Boolean))
            .concat(ensureLmsConceptsForKey(resourceKey).map(item => normalizeLmsWeekLabel(item.weekLabel)).filter(Boolean))
            .concat(ensureLmsAssignmentsForKey(resourceKey).map(item => normalizeLmsWeekLabel(item.weekLabel)).filter(Boolean));
        KIU_STATE.groupWeekConfigs[resourceKey] = sortLmsWeekLabels([...LMS_DEFAULT_WEEKS, ...discovered]);
    }
    KIU_STATE.groupWeekConfigs[resourceKey] = sortLmsWeekLabels(KIU_STATE.groupWeekConfigs[resourceKey]);
    if (!KIU_STATE.groupWeekConfigs[resourceKey].length) {
        KIU_STATE.groupWeekConfigs[resourceKey] = sortLmsWeekLabels(LMS_DEFAULT_WEEKS);
    }
    return KIU_STATE.groupWeekConfigs[resourceKey];
}

function getLmsConceptRatings(resourceKey, conceptId) {
    const ratings = ensureLmsConceptRatingsForKey(resourceKey);
    if (!ratings[conceptId] || typeof ratings[conceptId] !== 'object') {
        ratings[conceptId] = {};
    }
    return ratings[conceptId];
}

function getLmsAssignmentSubmissions(resourceKey, assignmentId) {
    const assignments = ensureLmsSubmissionsForKey(resourceKey);
    return assignments[assignmentId] && typeof assignments[assignmentId] === 'object'
        ? assignments[assignmentId]
        : {};
}

function buildLmsWeekSelectOptions(resourceKey, selectedValue = '') {
    const options = [
        { value: '', label: 'No Week / General' },
        ...ensureLmsWeeksForKey(resourceKey).map(week => ({ value: week, label: week }))
    ];
    return options.map(option => `
        <option value="${escapeHtml(option.value)}" ${String(selectedValue || '') === String(option.value) ? 'selected' : ''}>
            ${escapeHtml(option.label)}
        </option>
    `).join('');
}

function getLmsWeekLabel(value) {
    return String(value || '').trim() || 'No Week / General';
}

function groupLmsItemsByWeek(resourceKey, items, valueGetter) {
    const grouped = {};
    const configuredWeeks = ensureLmsWeeksForKey(resourceKey);
    configuredWeeks.forEach(week => {
        grouped[week] = [];
    });
    (items || []).forEach(item => {
        const label = getLmsWeekLabel(valueGetter(item));
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(item);
    });
    const orderedLabels = [];
    if (grouped['No Week / General']?.length) orderedLabels.push('No Week / General');
    sortLmsWeekLabels([...configuredWeeks, ...Object.keys(grouped)])
        .filter(label => label !== 'No Week / General')
        .forEach(label => {
            if (!orderedLabels.includes(label)) orderedLabels.push(label);
        });
    return orderedLabels.map(label => [label, grouped[label] || []]);
}

function renderLmsWeekManager(resourceKey) {
    const weeks = ensureLmsWeeksForKey(resourceKey);
    const token = toDomToken(resourceKey);
    const inputId = `lms-week-manager-input-${token}`;
    return upgradeLmsLegacyMarkup(`
        <div class="lux-soft-chrome lux-panel lms-route-panel lms-week-manager-shell">
            <div class="lms-route-card-head lms-week-manager-shell-head">
                <div>
                    <div class="lms-route-card-title"><i class="fas fa-calendar-week"></i> Manage Weeks</div>
                    <div class="lms-route-copy lms-route-copy-mt-4 lms-week-manager-shell-copy">Every group starts with 14 default weeks. Professors, TAs, and admins can add extra weeks or remove weeks when the course format changes.</div>
                </div>
                <div class="lms-route-copy lms-week-manager-shell-count">${weeks.length} configured week${weeks.length === 1 ? '' : 's'}</div>
            </div>
            <div class="lms-week-manager-chip-row">
                ${weeks.map(week => `
                    <button type="button" class="lux-secondary-btn lms-week-manager-chip-btn" data-lms-click="removeLmsWeek('${resourceKey}', '${String(week).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
                        <span class="lms-week-manager-chip-label">${escapeHtml(week)}</span>
                        <i class="fas fa-times lms-week-manager-chip-remove"></i>
                    </button>
                `).join('')}
            </div>
            <div class="lms-week-manager-input-row">
                <input id="${inputId}" type="text" placeholder="Add custom week label (e.g. Week 15, Exam Review Week)" class="lms-week-manager-control">
                <button class="lux-primary-btn lms-week-manager-input-action" data-lms-click="addLmsWeek('${resourceKey}', '${inputId}')"><i class="fas fa-plus"></i> Add Week</button>
            </div>
        </div>
    `);
}

function refreshLmsWeekManagerModal(resourceKey) {
    const body = document.getElementById('lms-week-manager-modal-body');
    if (body) body.innerHTML = renderLmsWeekManager(resourceKey);
}

function openLmsWeekManagerModal(resourceKey) {
    const existing = document.getElementById('lms-week-manager-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lms-week-manager-modal';
    overlay.className = 'lms-quiz-board-overlay lms-week-manager-overlay lms-glass-dialog-overlay';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeLmsWeekManagerModal();
    };

    overlay.innerHTML = upgradeLmsLegacyMarkup(renderLmsGlassDialogCard({
        hookClass: 'lms-quiz-board-modal lms-week-manager-modal lms-week-manager-modal-shell',
        bodyClass: 'lms-quiz-board-body lms-week-manager-modal-body',
        title: 'Week Manager',
        icon: 'fa-calendar-week',
        subtitle: 'Add, remove, and reorder weeks for the active teaching group.',
        closeAttr: 'data-lms-click="closeLmsWeekManagerModal()"',
        bodyHtml: `<div id="lms-week-manager-modal-body">${renderLmsWeekManager(resourceKey)}</div>`
    }));
    document.body.appendChild(overlay);
}

function closeLmsWeekManagerModal() {
    document.getElementById('lms-week-manager-modal')?.remove();
}

function addLmsWeek(resourceKey, inputId) {
    const input = document.getElementById(inputId);
    const raw = normalizeLmsWeekLabel(input?.value);
    if (!raw) {
        alert('Please enter a week label first.');
        return;
    }
    const weeks = ensureLmsWeeksForKey(resourceKey);
    if (weeks.some(week => week.toLowerCase() === raw.toLowerCase())) {
        alert('This week already exists for the group.');
        return;
    }
    weeks.push(raw);
    saveState();
    if (input) input.value = '';
    refreshLmsWeekManagerModal(resourceKey);
    rerenderCurrentLmsTab();
}

function removeLmsWeek(resourceKey, weekLabel) {
    const normalized = normalizeLmsWeekLabel(weekLabel);
    if (!normalized) return;
    const weeks = ensureLmsWeeksForKey(resourceKey);
    if (weeks.length <= 1) {
        alert('At least one week should remain in the group structure.');
        return;
    }
    if (!confirm(`Remove "${normalized}" from this group? Materials, concepts, and assignments linked to it will move to No Week / General.`)) {
        return;
    }
    KIU_STATE.groupWeekConfigs[resourceKey] = weeks.filter(week => week !== normalized);
    ensureLmsMaterialsForKey(resourceKey).forEach(item => {
        if (normalizeLmsWeekLabel(item.weekLabel) === normalized) item.weekLabel = '';
    });
    ensureLmsConceptsForKey(resourceKey).forEach(item => {
        if (normalizeLmsWeekLabel(item.weekLabel) === normalized) item.weekLabel = '';
    });
    ensureLmsAssignmentsForKey(resourceKey).forEach(item => {
        if (normalizeLmsWeekLabel(item.weekLabel) === normalized) item.weekLabel = '';
    });
    saveState();
    refreshLmsWeekManagerModal(resourceKey);
    rerenderCurrentLmsTab();
}

if (typeof window !== 'undefined') {
    window.ensureLmsWeeksForKey = window.ensureLmsWeeksForKey || ensureLmsWeeksForKey;
    window.ensureLmsMaterialsForKey = window.ensureLmsMaterialsForKey || ensureLmsMaterialsForKey;
    window.ensureLmsConceptsForKey = window.ensureLmsConceptsForKey || ensureLmsConceptsForKey;
    window.ensureLmsAssignmentsForKey = window.ensureLmsAssignmentsForKey || ensureLmsAssignmentsForKey;
    window.sortLmsWeekLabels = window.sortLmsWeekLabels || sortLmsWeekLabels;
    window.normalizeLmsWeekLabel = window.normalizeLmsWeekLabel || normalizeLmsWeekLabel;
}
