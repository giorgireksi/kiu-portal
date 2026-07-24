/* LMS classroom panel visibility + groups open. Peeled from lms-classroom-tabs-runtime.js. Keep MODULE_URLS in host.
 * Load before lms-classroom-tabs-runtime.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_CLASSROOM_TABS_PANEL_LOADED) return;
    window.__KIU_LMS_CLASSROOM_TABS_PANEL_LOADED = true;

    window.__kiuCreateLmsClassroomTabsPanelApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function isLmsElementShown(element) {
    return Boolean(element) && !element.hidden;
}

function setLmsElementShown(element, shown, displayMode = '') {
    if (!element) return;
    element.hidden = !shown;
    if (shown && displayMode) {
        element.style.display = displayMode;
    } else if (!shown) {
        element.style.display = 'none';
    } else {
        element.style.removeProperty('display');
    }
}

function setLmsWorkspacePanel(active) {
    const contentArea = document.getElementById('lms-content-area');
    const gbWrapper = document.getElementById('lms-gradebook-wrapper');
    const isGradebook = active === 'gradebook';
    setLmsElementShown(contentArea, !isGradebook);
    setLmsElementShown(gbWrapper, isGradebook, 'block');
}

function setLmsPageSectionShown(section, shown) {
    if (!section) return;
    section.classList.toggle('active-page', Boolean(shown));
    setLmsElementShown(section, shown);
}

/** Live-quiz summary for group tiles. Full impl lives in lazy live-quiz workspace. */
function resolveLmsLiveGroupSummary(subjectId, groupId) {
    const impl = (typeof getLmsLiveGroupSummary === 'function' && getLmsLiveGroupSummary)
        || (typeof window !== 'undefined' && typeof window.getLmsLiveGroupSummary === 'function'
            ? window.getLmsLiveGroupSummary
            : null);
    if (impl) {
        try {
            return impl(subjectId, groupId);
        } catch (_error) {
            /* fall through to local summary */
        }
    }

    // Lightweight summary from state when live-quiz runtime is not loaded yet.
    const sectionTypes = Array.isArray(typeof LMS_SECTION_TYPES !== 'undefined' ? LMS_SECTION_TYPES : null)
        ? LMS_SECTION_TYPES
        : ['lecture', 'workshop'];
    let isLive = false;
    let liveLabel = '';
    let questionCount = 0;
    let draftCount = 0;
    sectionTypes.forEach((sectionType) => {
        const suffix = typeof getLmsSectionSuffix === 'function' ? getLmsSectionSuffix(sectionType) : '';
        const rawKey = `${subjectId}::${groupId}${suffix}`;
        const resourceKey = typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(rawKey)
            : rawKey;
        const workspace = (typeof KIU_STATE !== 'undefined' && KIU_STATE?.lmsLiveQuizzes)
            ? KIU_STATE.lmsLiveQuizzes[resourceKey]
            : null;
        const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
        const live = sessions.find((session) => String(session?.status || '') === 'live') || null;
        const draft = sessions.find((session) => String(session?.status || '') === 'draft') || null;
        if (live) {
            isLive = true;
            const label = typeof getLmsSectionMeta === 'function'
                ? (getLmsSectionMeta(sectionType)?.label || sectionType)
                : sectionType;
            liveLabel = `${label} live`;
            questionCount += Number(live?.questions?.length || 0);
        } else if (draft) {
            draftCount += 1;
            questionCount += Number(draft?.questions?.length || 0);
        }
    });
    return {
        isLive,
        label: isLive ? liveLabel : (draftCount ? `${draftCount} prepared` : 'No live quiz'),
        questionCount,
        sections: []
    };
}

function openLMSGroups(subjectId, titleString, iconClass) {
    setLmsPageSectionShown(document.getElementById('page-lms'), false);
    setLmsPageSectionShown(document.getElementById('page-lms-inner'), false);
    setLmsPageSectionShown(document.getElementById('page-lms-groups'), true);
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
            <div class="lux-empty-state lms-route-empty-state--centered">
                <div>
                    <div class="lux-card-title">No published groups in this faculty yet</div>
                    <div class="lux-card-copy lms-route-copy-mt-10">Switch faculty in the topbar or add course groups for this subject to populate the workspace.</div>
                </div>
            </div>
        `;
        if (typeof scheduleLmsVisualShellSync === 'function') scheduleLmsVisualShellSync();
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
            const liveSummary = resolveLmsLiveGroupSummary(subjectId, g.id);
            const groupCourseKey = `${subjectId}::${g.id}`;
            const nextSessionHtml = renderLmsNextSessionHtml(
                getLmsNextSessionForGroup(groupCourseKey),
                'compact'
            );
            grid.innerHTML += `
            <article
                class="lux-soft-chrome lux-panel lms-route-card lms-route-panel-compact lux-strip-card lux-lms-group-card"
                role="button"
                tabindex="0"
                data-group-id="${escapeHtml(String(g.id))}"
                data-course-key="${escapeHtml(`${subjectId}::${g.id}`)}"
                data-course-title="${escapeHtml(courseTitle)}"
                data-lms-click="openLMSCourseFromCard(this)"
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLMSCourseFromCard(this);}">
                ${canBulkSelect ? `
                    <label class="lms-bulk-group-select lms-group-tile-select" data-lms-click="event.stopPropagation();">
                        <input type="checkbox" data-lms-bulk-group-check="true" data-group-id="${escapeHtml(String(g.id))}" data-lms-change="updateLmsBulkSelectionCount()">
                        <span>Bulk</span>
                    </label>
                ` : ''}
                <div class="lms-group-tile-top">
                    <div class="lms-group-tile-head">
                        <div class="lms-route-min-w-0">
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
                ${nextSessionHtml}
                <div class="lms-group-live-strip ${liveSummary.isLive ? 'is-live' : ''}">
                    <span><i class="fas fa-bolt"></i> Live Quiz</span>
                    <span>${escapeHtml(liveSummary.label)}${liveSummary.questionCount ? ` - ${escapeHtml(String(liveSummary.questionCount))} questions` : ''}</span>
                </div>
            </article>
        `;
    });
    updateLmsBulkSelectionCount();
    if (typeof scheduleLmsVisualShellSync === 'function') scheduleLmsVisualShellSync();
}

        const api = {
            isLmsElementShown,
            setLmsElementShown,
            setLmsWorkspacePanel,
            setLmsPageSectionShown,
            resolveLmsLiveGroupSummary,
            openLMSGroups,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsClassroomTabsPanelApi({});
})();

