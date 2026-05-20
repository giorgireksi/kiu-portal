/* LMS content library runtime extracted from lms.js. */

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
        pinned: Boolean(concept.pinned),
        reviewNote: concept.reviewNote || ''
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

function groupLmsItemsByWeek(resourceKey, items, valueGetter, includeEmptyWeeks = true) {
    const grouped = {};
    const configuredWeeks = ensureLmsWeeksForKey(resourceKey);
    if (includeEmptyWeeks) {
        configuredWeeks.forEach(week => {
            grouped[week] = [];
        });
    }
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
    if (!canManageLmsGroupContent()) {
        return upgradeLmsLegacyMarkup(`
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; padding:16px 18px; background:var(--lux-surface); border:1px solid var(--kiu-border); border-radius:18px; box-shadow:0 14px 32px rgba(15,23,42,0.05);">
                <div>
                    <div style="font-size:15px; font-weight:800; color:var(--kiu-navy);">Manage Weeks</div>
                    <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:4px;">This group follows ${weeks.length} teaching week${weeks.length === 1 ? '' : 's'} for materials, concepts, and assignments.</div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${weeks.map(week => `<span class="portal-msg-mini-badge">${escapeHtml(week)}</span>`).join('')}
                </div>
            </div>
        `);
    }
    const token = toDomToken(resourceKey);
    const inputId = `lms-week-manager-input-${token}`;
    return upgradeLmsLegacyMarkup(`
        <div style="margin-bottom:18px; padding:18px; background:var(--lux-surface); border:1px solid var(--kiu-border); border-radius:18px; box-shadow:0 14px 32px rgba(15,23,42,0.05);">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:12px;">
                <div>
                    <div style="font-size:16px; font-weight:800; color:var(--kiu-navy);"><i class="fas fa-calendar-week"></i> Manage Weeks</div>
                    <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:4px;">Every group starts with 14 default weeks. Professors, TAs, and admins can add extra weeks or remove weeks when the course format changes.</div>
                </div>
                <div style="font-size:12px; color:var(--kiu-text-muted);">${weeks.length} configured week${weeks.length === 1 ? '' : 's'}</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
                ${weeks.map(week => `
                    <button type="button" class="kiu-btn-outline" style="padding:8px 10px; display:inline-flex; align-items:center; gap:8px;" data-lms-click="removeLmsWeek('${resourceKey}', '${String(week).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
                        <span>${escapeHtml(week)}</span>
                        <i class="fas fa-times" style="color:var(--kiu-red);"></i>
                    </button>
                `).join('')}
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <input id="${inputId}" type="text" placeholder="Add custom week label (e.g. Week 15, Exam Review Week)" style="flex:1; min-width:260px; border:1px solid var(--kiu-border); padding:10px 12px; border-radius:12px; outline:none;">
                <button class="kiu-btn-blue" data-lms-click="addLmsWeek('${resourceKey}', '${inputId}')"><i class="fas fa-plus"></i> Add Week</button>
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
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7100; background:rgba(15,23,42,0.72); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:24px;';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeLmsWeekManagerModal();
    };

    overlay.innerHTML = upgradeLmsLegacyMarkup(`
        <div style="width:min(980px, 100%); max-height:90vh; overflow:auto; background:var(--lux-bg-soft); border:1px solid rgba(255,255,255,0.2); border-radius:24px; box-shadow:0 28px 80px rgba(15,23,42,0.35);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:22px 24px; background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue)); color:#fff;">
                <div>
                    <div style="font-size:20px; font-weight:900;">Week Manager</div>
                    <div style="font-size:12px; opacity:0.9; margin-top:4px;">Add, remove, and reorder weeks for the active teaching group.</div>
                </div>
                <button class="kiu-btn-outline" data-lms-click="closeLmsWeekManagerModal()" style="border-color:rgba(255,255,255,0.35); color:#fff; background:rgba(255,255,255,0.08);"><i class="fas fa-times"></i> Close</button>
            </div>
            <div id="lms-week-manager-modal-body" style="padding:24px;">${renderLmsWeekManager(resourceKey)}</div>
        </div>
    `);
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

function getLmsConceptAuthorDisplay(concept, currentUserId) {
    if (!concept) return 'Unknown author';
    if (!concept.isAnonymous) return concept.authorName || 'Unknown author';
    return String(concept.authorId || '') === String(currentUserId) ? `${concept.authorName || 'You'} (hidden from others)` : 'Anonymous Student';
}

function computeLmsConceptScoreSummary(resourceKey, conceptId) {
    const ratings = Object.values(getLmsConceptRatings(resourceKey, conceptId) || {})
        .map(value => parseFloat(value))
        .filter(value => Number.isFinite(value));
    const total = ratings.reduce((sum, value) => sum + value, 0);
    const count = ratings.length;
    const average = count ? (total / count) : 0;
    return {
        count,
        average,
        total
    };
}

function canUploadLmsConcepts() {
    return Boolean(getCurrentUser());
}

function renderLmsConceptsLibrary(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('concepts', contentArea);

    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = parsed.resourceKey;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser?.id || '');
    const canManage = canManageLmsGroupContent();
    const canUpload = canUploadLmsConcepts();
    const token = toDomToken(resourceKey);
    const fileLabelId = `lms-concept-file-label-${token}`;
    const leaderboard = [...concepts].map(concept => {
        const stats = computeLmsConceptScoreSummary(resourceKey, concept.id);
        return { concept, ...stats };
    }).sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        if (b.count !== a.count) return b.count - a.count;
        return String(a.concept.createdAt || '').localeCompare(String(b.concept.createdAt || ''));
    });

    let html = `
        <div class="lms-route-stack">

            <div class="lms-route-panel" style="padding:16px 20px;">
                <div class="lms-route-card-head">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <i class="fas fa-lightbulb" style="font-size:18px;color:var(--lux-accent-2);"></i>
                        <div>
                            <div class="lms-route-card-title">Concepts</div>
                            <div class="lms-route-copy" style="margin-top:4px;">${concepts.length} notes &middot; ${ensureLmsWeeksForKey(resourceKey).length} weeks</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${canManage ? '<button class="kiu-btn-outline" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)" style="padding:8px 14px;font-size:12px;"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                    </div>
                </div>
            </div>
            <div class="lms-route-card-grid">
                <div class="lms-route-panel">
                    <div class="lms-route-card-title">Concept Leaderboard</div>
                    <div class="lms-route-copy" style="margin-top:6px;">Peer scoring stays between 5 and 10 so the clearest concepts rise to the top.</div>
                    <div class="lms-route-stack" style="margin-top:16px; gap:12px;">
                        ${leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => `
                            <div class="lms-route-kv" style="${index === 0 ? 'background:rgba(var(--lux-accent-rgb),0.12);' : ''}">
                                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                                    <div>
                                        <div class="lms-route-card-title" style="font-size:15px;">${escapeHtml(entry.concept.title || 'Untitled concept')}</div>
                                        <div class="lms-route-meta" style="font-size:12px; margin-top:6px;">${joinLmsMeta([getLmsConceptAuthorDisplay(entry.concept, currentUserId), getLmsWeekLabel(entry.concept.weekLabel)])}</div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div class="lms-route-card-title" style="font-size:20px; color:var(--lux-accent);">${entry.count ? entry.average.toFixed(1) : 'No ratings'}</div>
                                        <div class="lms-route-meta" style="font-size:11px;">${entry.count} vote${entry.count === 1 ? '' : 's'}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : renderLmsRouteEmptyState('No Ratings Yet', 'No concepts have been rated in this group yet.', 'fa-ranking-star')}
                    </div>
                </div>
                <div class="lms-route-panel">
                    <div class="lms-route-card-title">How Concepts Work</div>
                    <div class="lms-route-copy" style="margin-top:6px;">This tab uses the same transparent route surfaces as the rest of LMS instead of the old white boxes.</div>
                    <div class="lms-route-stack" style="margin-top:16px; gap:10px;">
                        <div class="lms-route-kv"><div class="lms-route-kv-label">Week-linked or general</div><div class="lms-route-copy" style="margin-top:6px;">Attach concepts to a week or leave them under the general section.</div></div>
                        <div class="lms-route-kv"><div class="lms-route-kv-label">Anonymous mode</div><div class="lms-route-copy" style="margin-top:6px;">Students can hide their name from classmates while staff still sees the correct author.</div></div>
                        <div class="lms-route-kv"><div class="lms-route-kv-label">Peer scoring</div><div class="lms-route-copy" style="margin-top:6px;">Members rate concepts from 5 to 10 to surface the strongest explanations.</div></div>
                    </div>
                </div>
            </div>
    `;
    if (canUpload) {
        html += `
            <div class="lms-route-panel">
                <div class="lms-route-card-head" style="margin-bottom:16px;">
                    <div>
                        <div class="lms-route-card-title"><i class="fas fa-lightbulb"></i> Share a Concept</div>
                        <div class="lms-route-copy" style="margin-top:6px;">Upload a simplified explanation, staff note, weekly summary, or helpful concept file for this group.</div>
                    </div>
                    <div id="${fileLabelId}" class="lms-route-pill">No concept file selected</div>
                </div>
                <div class="lms-route-field-grid">
                    <div class="lms-route-field">
                        <label class="lms-route-field-label" for="new-concept-title">Concept Title</label>
                        <input id="new-concept-title" class="lms-route-input" type="text" placeholder="Concept title">
                    </div>
                    <div class="lms-route-field">
                        <label class="lms-route-field-label" for="new-concept-week">Teaching Week</label>
                        <select id="new-concept-week" class="lms-route-select">
                            ${buildLmsWeekSelectOptions(resourceKey, '')}
                        </select>
                    </div>
                </div>
                <div class="lms-route-field" style="margin-top:14px;">
                    <label class="lms-route-field-label" for="new-concept-summary">Summary</label>
                    <textarea id="new-concept-summary" class="lms-route-textarea" placeholder="Explain the concept in an easier way, add solved examples, shortcuts, or learning tips..."></textarea>
                </div>
                ${getEffectiveUserRole() === USER_ROLES.STUDENT ? `
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--lux-text); margin-top:14px;">
                        <input type="checkbox" id="new-concept-anonymous">
                        Hide my name from other students in this group
                    </label>
                ` : ''}
                <div class="lms-route-actions" style="margin-top:16px;">
                    <button class="kiu-btn-outline" data-lms-click="pickLocalLmsFile('concept', '${resourceKey}', '${fileLabelId}')"><i class="fas fa-paperclip"></i> Attach File</button>
                    <button class="kiu-btn-blue" data-lms-click="createLmsConcept('${resourceKey}')"><i class="fas fa-plus"></i> Publish Concept</button>
                </div>
            </div>
        `;
    }

    const groupedConcepts = groupLmsItemsByWeek(resourceKey, concepts, concept => concept.weekLabel, true);
    html += groupedConcepts.length ? groupedConcepts.map(([weekLabel, weekConcepts], index) => {
        const body = weekConcepts.length ? `
            <div class="lms-route-stack" style="gap:16px;">
                ${weekConcepts.map(concept => {
                    const score = computeLmsConceptScoreSummary(resourceKey, concept.id);
                    const ratings = getLmsConceptRatings(resourceKey, concept.id);
                    const currentVote = Number(ratings[currentUserId] || 0);
                    const showAuthor = getLmsConceptAuthorDisplay(concept, currentUserId);
                    const canDelete = canManage || String(concept.authorId || '') === currentUserId;
                    const canRate = currentUserId && String(concept.authorId || '') !== currentUserId;
                    const reviewLabel = concept.reviewStatus === 'approved' ? 'Reviewed' : concept.reviewStatus === 'revision' ? 'Needs correction' : 'Pending review';
                    const reviewTone = concept.reviewStatus === 'approved'
                        ? 'rgba(16,185,129,0.12); color:#34d399; border-color:rgba(16,185,129,0.22);'
                        : concept.reviewStatus === 'revision'
                            ? 'rgba(245,158,11,0.12); color:#fbbf24; border-color:rgba(245,158,11,0.22);'
                            : 'rgba(var(--lux-accent-rgb),0.08); color:var(--lux-accent); border-color:rgba(var(--lux-accent-rgb),0.16);';
                    return `
                        <div class="lms-route-card">
                            <div class="lms-route-card-head">
                                <div>
                                    <div class="lms-route-card-title">${escapeHtml(concept.title || 'Untitled concept')}</div>
                                    <div class="lms-route-meta" style="font-size:12px; margin-top:6px;">${joinLmsMeta([`Shared by ${showAuthor}`, formatLmsDateTime(concept.createdAt)])}</div>
                                </div>
                                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                                    ${concept.pinned ? '<span class="lms-route-pill"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                                    <span class="lms-route-pill" style="background:${reviewTone}">${escapeHtml(reviewLabel)}</span>
                                    <span class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.12); color:var(--lux-accent); border-color:rgba(var(--lux-accent-rgb),0.18);">${score.count ? `${score.average.toFixed(1)} / 10` : 'Not rated yet'}</span>
                                    <span class="lms-route-meta" style="font-size:12px;">${score.count} vote${score.count === 1 ? '' : 's'}</span>
                                    ${canDelete ? `<button class="kiu-btn-outline" style="padding:7px 10px; color:var(--lux-red); border-color:rgba(220,38,38,0.18);" data-lms-click="deleteLmsConcept('${resourceKey}', '${concept.id}')"><i class="fas fa-trash"></i></button>` : ''}
                                </div>
                            </div>
                            <div class="lms-route-copy" style="margin-top:14px; white-space:pre-wrap;">${escapeHtml(concept.summary || 'No summary added.')}</div>
                            ${concept.file ? `
                                <div class="lms-route-kv" style="margin-top:14px;">
                                    <div class="lms-route-kv-label">Attached File</div>
                                    <div class="lms-route-card-title" style="font-size:15px; margin-top:6px;">${escapeHtml(concept.file.name || 'Concept file')}</div>
                                    <div class="lms-route-actions" style="margin-top:12px;">${getStoredFileDownloadHtml(concept.file, 'Download concept file')}</div>
                                </div>
                            ` : ''}
                            <div style="display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-top:16px; align-items:flex-start;">
                                <div class="lms-route-meta" style="font-size:12px;">This concept is ranked inside this LMS group only.</div>
                                <div class="lms-route-actions">
                                    ${canManage ? `
                                        <button class="kiu-btn-outline" data-lms-click="updateLmsConceptReview('${resourceKey}', '${concept.id}', 'approved')"><i class="fas fa-check"></i> Approve</button>
                                        <button class="kiu-btn-outline" data-lms-click="updateLmsConceptReview('${resourceKey}', '${concept.id}', 'revision')"><i class="fas fa-rotate"></i> Revision</button>
                                        <button class="kiu-btn-outline" data-lms-click="toggleLmsConceptPinned('${resourceKey}', '${concept.id}')"><i class="fas fa-thumbtack"></i> ${concept.pinned ? 'Unpin' : 'Pin'}</button>
                                    ` : ''}
                                    ${canRate ? [5, 6, 7, 8, 9, 10].map(value => `
                                        <button class="${currentVote === value ? 'kiu-btn-blue' : 'kiu-btn-outline'}" style="padding:7px 10px; min-width:42px;" data-lms-click="rateLmsConcept('${resourceKey}', '${concept.id}', ${value})">${value}</button>
                                    `).join('') : `<span class="lms-route-meta" style="font-size:12px;">${String(concept.authorId || '') === currentUserId ? 'You cannot rate your own concept.' : 'Login required to rate.'}</span>`}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : renderLmsRouteEmptyState('No Concepts Yet', 'No concepts were shared in this week yet.', 'fa-lightbulb');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekConcepts.length} concept${weekConcepts.length === 1 ? '' : 's'} shared here`,
            body,
            index === 0
        );
    }).join('') : renderLmsRouteEmptyState('No Concepts Yet', 'No concepts have been shared for this group yet.', 'fa-lightbulb');

    html += `</div>`;
    contentArea.innerHTML = localizeHtmlMarkup(html);
}

async function createLmsConcept(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const title = document.getElementById('new-concept-title')?.value.trim();
    const summary = document.getElementById('new-concept-summary')?.value.trim();
    const weekLabel = document.getElementById('new-concept-week')?.value || '';
    const isAnonymous = Boolean(document.getElementById('new-concept-anonymous')?.checked);
    const file = getLmsDraftFile('concept', resourceKey);

    if (!title) {
        alert('Please add a concept title.');
        return;
    }
    if (!summary && !file) {
        alert('Please add a concept explanation or attach a file.');
        return;
    }

    try {
        const persistedFile = file ? await persistLmsStoredFile(file, 'concept') : null;
        const concepts = ensureLmsConceptsForKey(resourceKey);
        concepts.unshift({
            id: `concept_${Date.now()}`,
            title,
            summary,
            weekLabel,
            file: persistedFile,
            isAnonymous: getEffectiveUserRole() === USER_ROLES.STUDENT ? isAnonymous : false,
            authorId: String(currentUser.id),
            authorName: currentUser.nameEn || currentUser.name || currentUser.email || currentUser.id,
            reviewStatus: canManageLmsGroupContent() ? 'approved' : 'pending',
            reviewed: canManageLmsGroupContent(),
            approved: canManageLmsGroupContent(),
            pinned: false,
            reviewNote: '',
            createdAt: new Date().toISOString()
        });

        clearLmsDraftFile('concept', resourceKey);
        saveState();
        rerenderCurrentLmsTab();
    } catch (error) {
        console.error('Could not save LMS concept.', error);
        alert('Concept file could not be saved.');
    }
}

function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = 'approved') {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can review concepts.');
        return;
    }
    const concept = ensureLmsConceptsForKey(resourceKey).find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    const normalized = ['approved', 'revision', 'pending'].includes(String(reviewStatus)) ? String(reviewStatus) : 'approved';
    concept.reviewStatus = normalized;
    concept.reviewed = normalized !== 'pending';
    concept.approved = normalized === 'approved';
    concept.reviewedBy = getSimulatedUserName();
    concept.reviewedAt = new Date().toISOString();
    concept.reviewNote = normalized === 'revision' ? 'Needs correction before being promoted.' : '';
    saveState();
    rerenderCurrentLmsTab();
}

function toggleLmsConceptPinned(resourceKey, conceptId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can pin concepts.');
        return;
    }
    const concept = ensureLmsConceptsForKey(resourceKey).find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    concept.pinned = !concept.pinned;
    concept.reviewedAt = new Date().toISOString();
    saveState();
    rerenderCurrentLmsTab();
}

function deleteLmsConcept(resourceKey, conceptId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const concept = concepts.find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    const canDelete = canManageLmsGroupContent() || String(concept.authorId || '') === String(currentUser.id);
    if (!canDelete) {
        alert('You can only remove your own concepts unless you are course staff.');
        return;
    }
    ensureLmsConceptRatingsForKey(resourceKey);
    queueStoredFileDelete(concept.file);
    KIU_STATE.groupConcepts[resourceKey] = concepts.filter(item => String(item.id) !== String(conceptId));
    delete KIU_STATE.groupConceptRatings[resourceKey][conceptId];
    saveState();
    rerenderCurrentLmsTab();
}

function rateLmsConcept(resourceKey, conceptId, score) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const numericScore = parseInt(score, 10);
    if (!Number.isFinite(numericScore) || numericScore < 5 || numericScore > 10) return;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const concept = concepts.find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    if (String(concept.authorId || '') === String(currentUser.id)) {
        alert('You cannot rate your own concept.');
        return;
    }
    const ratings = getLmsConceptRatings(resourceKey, conceptId);
    ratings[String(currentUser.id)] = numericScore;
    saveState();
    renderLmsConceptsLibrary(resourceKey);
}
