/* Planner, timetable, and calendar logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- ADMIN TERM-PLANNER ENGINE ---
function syncAdminRegistrationToggleState(isOpen) {
    const regIcon = document.getElementById('admin-reg-icon');
    const regText = document.getElementById('admin-reg-text');
    if (regIcon) {
        regIcon.className = isOpen ? 'fas fa-toggle-on' : 'fas fa-toggle-off';
        regIcon.dataset.registrationState = isOpen ? 'open' : 'closed';
    }
    if (regText) regText.innerText = isOpen ? 'Registration Window Open' : 'Registration Window Closed';
}

function setPlannerModalPanelVisibility(panel, shown) {
    if (!panel) return;
    panel.hidden = !shown;
    panel.classList.toggle('is-active', shown);
}

function initAdminTermPlanner() {
    refreshSemesterDropdowns();
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);

    // Populate active semester select
    const semSelect = document.getElementById('admin-active-semester');
    if (semSelect) {
        const activeSemester = parseInt(KIU_STATE.activeSemester || 3, 10);
        if (activeSemester > MAX_SEMESTER_DROPDOWN) semSelect.dataset.customSemesterValue = String(activeSemester);
        populateSemesterSelectOptions(semSelect, { includeCustom: true, numberPrefix: 'Semester' });
        semSelect.value = String(activeSemester);
    }
    
    // Set registration toggle
    const regToggle = document.getElementById('admin-reg-status');
    const regIcon = document.getElementById('admin-reg-icon');
    const regText = document.getElementById('admin-reg-text');
    if (regToggle) {
        regToggle.checked = KIU_STATE.registrationOpen !== false;
        syncAdminRegistrationToggleState(Boolean(regToggle.checked));
    }
    
    // Populate Master Subject dropdown for Section Generator
    const subSelect = document.getElementById('admin-generate-subject');
    if (subSelect) {
        let html = '';
        allSubjects.forEach(sub => {
            html += `<option value="${sub.id}">${sub.id} - ${sub.name}</option>`;
        });
        subSelect.innerHTML = localizeHtmlMarkup(html);
    }
}

function changeActiveSemester(val) {
    const semSelect = document.getElementById('admin-active-semester');
    const resolvedSemester = val === CUSTOM_SEMESTER_OPTION
        ? getSemesterNumberFromControl(semSelect, KIU_STATE.activeSemester || 3)
        : (parseInt(val, 10) || getSemesterNumberFromControl(semSelect, KIU_STATE.activeSemester || 3));
    KIU_STATE.activeSemester = resolvedSemester;
    saveState();
    refreshShellIdentity();
    const curriculumSemFilter = document.getElementById('filter-curriculum-semester');
    if (curriculumSemFilter) {
        if (resolvedSemester > MAX_SEMESTER_DROPDOWN) {
            curriculumSemFilter.dataset.customSemesterValue = String(resolvedSemester);
        }
        populateSemesterSelectOptions(curriculumSemFilter, { includeAll: true, includeCustom: true, numberPrefix: 'Sem' });
        curriculumSemFilter.value = String(resolvedSemester);
        renderCurriculumTable();
    }
    alert(`System globally updated to Semester ${resolvedSemester}. Students will now see this term's courses.`);
}

function toggleRegistrationStatus() {
    const regToggle = document.getElementById('admin-reg-status');
    KIU_STATE.registrationOpen = regToggle.checked;
    saveState();
    refreshShellIdentity();

    syncAdminRegistrationToggleState(Boolean(KIU_STATE.registrationOpen));
    if (!KIU_STATE.registrationOpen) {
        alert('Registration globally closed. Students cannot modify schedules.');
    }
}

function updateGenerateSubjects(context = 'admin') {
    const prefix = context === 'modal' ? 'modal-' : 'admin-';
    const facultyInput = document.getElementById(`${prefix}generate-faculty`);
    const subSelect = document.getElementById(`${prefix}generate-subject`);
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
    
    if (subSelect) {
        const faculty = facultyInput ? facultyInput.value : 'all';
        let html = '';
        allSubjects.forEach(sub => {
            const matchesFac = (faculty === 'Computer Science' && sub.id.startsWith('CS')) ||
                              (faculty === 'Business Management' && sub.id.startsWith('BM')) ||
                              (faculty === 'Law' && sub.id.startsWith('LAW')) || 
                              (faculty === 'Mathematics' && sub.id.startsWith('MATH')) ||
                              (faculty === 'all' || !faculty);
            
            if (matchesFac) {
                html += `<option value="${sub.id}">${sub.id} - ${sub.name}</option>`;
            }
        });
        subSelect.innerHTML = localizeHtmlMarkup(html || '<option value="">No subjects found</option>');
    }
}
// [REMOVED Phase 36: Old inline generator logic]



// Timetable, schedule-surface, and profile-calendar runtime moved to assets/js/pages/timetable-runtime.js.

function bindPlannerLegacyDelegates() {
    if (window.__plannerLegacyDelegatesBound) return;
    window.__plannerLegacyDelegatesBound = true;
    document.addEventListener('click', (event) => {
        const schedulerStatsTrigger = event.target.closest('[data-scheduler-stats]');
        if (schedulerStatsTrigger) {
            event.preventDefault();
            event.stopPropagation();
            showSlotStats(
                String(schedulerStatsTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerStatsTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerDeleteTrigger = event.target.closest('[data-scheduler-delete]');
        if (schedulerDeleteTrigger) {
            event.preventDefault();
            event.stopPropagation();
            deleteSection(
                String(schedulerDeleteTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerDeleteTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerEditTrigger = event.target.closest('[data-scheduler-edit]');
        if (schedulerEditTrigger) {
            event.preventDefault();
            openSchedulerEditModal(
                String(schedulerEditTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerEditTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerOpenTrigger = event.target.closest('[data-scheduler-open]');
        if (schedulerOpenTrigger) {
            event.preventDefault();
            openSchedulerModal(
                String(schedulerOpenTrigger.getAttribute('data-scheduler-day') || ''),
                String(schedulerOpenTrigger.getAttribute('data-scheduler-time') || '')
            );
            return;
        }

        const bcNavTrigger = event.target.closest('[data-bc-nav]');
        if (bcNavTrigger) {
            event.preventDefault();
            bcNav(parseInt(bcNavTrigger.getAttribute('data-bc-nav') || '0', 10) || 0);
            return;
        }

        const bcYearTrigger = event.target.closest('[data-bc-year]');
        if (bcYearTrigger) {
            event.preventDefault();
            bcJumpYear(parseInt(bcYearTrigger.getAttribute('data-bc-year') || '0', 10) || 0);
            return;
        }

        const bcDateTrigger = event.target.closest('[data-bc-date]');
        if (bcDateTrigger) {
            event.preventDefault();
            bcDayClick(String(bcDateTrigger.getAttribute('data-bc-date') || ''));
            return;
        }

        const bcAddTrigger = event.target.closest('[data-bc-add]');
        if (bcAddTrigger) {
            event.preventDefault();
            bcAddEvent();
        }
    });
}

bindPlannerLegacyDelegates();

function syncPlannerSchedulerEventMetrics(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('.sch-event-card[data-sch-top][data-sch-height]').forEach((node) => {
        const top = Number(node.getAttribute('data-sch-top'));
        const height = Number(node.getAttribute('data-sch-height'));
        node.style.setProperty('--sch-event-top', `${Number.isFinite(top) ? top : 0}px`);
        node.style.setProperty('--sch-event-height', `${Number.isFinite(height) ? height : 0}px`);
    });
}

// --- ADMIN MASTER GRID ENGINE ---
let lastGridState = '';

const debouncedPaletteSearch = debounce(() => {
    renderAdminCurriculumPalette();
}, 250);

let adminToolsPlannerDelegatesBound = false;

function bindAdminToolsPlannerDelegates() {
    if (adminToolsPlannerDelegatesBound) return;
    adminToolsPlannerDelegatesBound = true;

    document.addEventListener('click', (event) => {
        const paletteItem = event.target.closest('[data-admin-planner-palette-subject]');
        if (paletteItem) {
            event.preventDefault();
            selectPaletteSubject(
                paletteItem.dataset.adminPlannerPaletteSubject || '',
                paletteItem.dataset.adminPlannerPaletteName || ''
            );
            return;
        }

        const refreshTrigger = event.target.closest('[data-admin-planner-refresh-system-ops]');
        if (refreshTrigger) {
            event.preventDefault();
            refreshAdminSystemOpsDashboard(true);
        }
    });
}

function renderAdminCurriculumPalette() {
    bindAdminToolsPlannerDelegates();
    const palette = document.getElementById('admin-curriculum-palette');
    const searchInput = document.getElementById('palette-search');
    const targetFacEl = document.getElementById('admin-tt-faculty');
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
    if (!palette || !targetFacEl) return;
    
    const targetFac = targetFacEl.value;
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    let html = '';
    
    // Group subjects by Faculty
    const categories = {
        'Computer Science': [],
        'Business Management': [],
        'Law': [],
        'Medicine': [],
        'Arts & Humanities': []
    };
    
    const activeFaculties = targetFac === 'all'
        ? Object.keys(categories)
        : [targetFac];
    
    allSubjects.forEach(sub => {
        const matchesSearch = sub.id.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query);
        
        let derivedFaculty = 'Law';
        if (sub.faculty === 'CS' || sub.id.startsWith('CS') || sub.id.startsWith('STAT') || sub.id.startsWith('CALC')) derivedFaculty = 'Computer Science';
        else if (sub.faculty === 'ECON' || sub.id.startsWith('ECON') || sub.id.startsWith('PM')) derivedFaculty = 'Business Management';
        else if (sub.faculty === 'MED') derivedFaculty = 'Medicine';
        else if (sub.faculty === 'ARTS') derivedFaculty = 'Arts & Humanities';

        if (matchesSearch && activeFaculties.includes(derivedFaculty)) {
            categories[derivedFaculty].push(sub);
        }
    });

    function getPlannerPaletteToneClass(facultyName) {
        switch (facultyName) {
            case 'Computer Science': return 'sch-palette-tone-cs';
            case 'Business Management': return 'sch-palette-tone-biz';
            case 'Medicine': return 'sch-palette-tone-med';
            case 'Arts & Humanities': return 'sch-palette-tone-arts';
            default: return 'sch-palette-tone-law';
        }
    }
    
    activeFaculties.forEach(fac => {
        if (categories[fac].length > 0) {
            const toneClass = getPlannerPaletteToneClass(fac);
            html += `<div class="sch-palette-group ${toneClass}">
                ${fac}
                <span class="sch-palette-group-count">${categories[fac].length}</span>
            </div>`;
            
            categories[fac].forEach(sub => {
            html += `
                    <div class="palette-item sch-palette-item ${toneClass}" data-admin-planner-palette-subject="${escapeHtml(sub.id)}" data-admin-planner-palette-name="${escapeHtml(sub.name)}">
                        <div class="sch-palette-item-copy">
                            <span class="sch-palette-item-id">${sub.id}</span>
                            <span class="sch-palette-item-name">${sub.name}</span>
                        </div>
                        <i class="fas fa-plus-circle sch-palette-item-icon"></i>
                    </div>
                `;
            });
        }
    });
    
    if (html === '') {
        html = '<div class="sch-palette-empty">No subjects found.</div>';
    }
    
    palette.innerHTML = localizeHtmlMarkup(html);
}

function selectPaletteSubject(id, name) {
    document.querySelectorAll('.palette-item').forEach(el => {
        el.classList.remove('is-selected');
    });
    // Multi-highlight support for visual feedback
    const items = document.querySelectorAll('.palette-item');
    for (let item of items) {
        if (String(item.getAttribute('data-admin-planner-palette-subject') || '').trim() === String(id || '').trim()) {
            item.classList.add('is-selected');
        }
    }
    const subSelect = document.getElementById('admin-generate-subject');
    if (subSelect) subSelect.value = id;
}

function generateClassGroup() {
    if (!hasPermission('*')) {
        alert('Only administrators can create official teaching sessions.');
        return;
    }
    const courseId = document.getElementById('modal-generate-subject')?.value?.trim() ||
                     _modalField('admin-generate-subject')?.value?.trim();
    const groupId  = (_modalField('admin-generate-group')?.value  || '').trim();
    const day      = _modalField('admin-generate-day')?.value     || '';
    const time     = normalizeTimeString(_modalField('admin-generate-time')?.value, '');
    let   endTime  = normalizeTimeString(_modalField('admin-generate-endtime')?.value, '');
    const capacity = _modalField('admin-generate-capacity')?.value || '40';
    const room     = (_modalField('admin-generate-room')?.value   || '').trim();
    const prof     = (_modalField('admin-generate-prof')?.value   || '').trim();
    const ta       = (_modalField('admin-generate-ta')?.value     || '').trim();
    const editCourseId = (_modalField('admin-generate-edit-course')?.value || '').trim();
    const editGroupId = (_modalField('admin-generate-edit-group')?.value || '').trim().toLowerCase();
    const isEdit = Boolean(editCourseId && editGroupId);

    // Resolve faculty: from palette filter or from the subject's own faculty tag
    const paletteFac = document.getElementById('admin-tt-faculty')?.value || 'all';
    let faculty = paletteFac !== 'all' ? paletteFac : 'Law';

    // Try to get from the subject's registered faculty in curriculum
    if (courseId) {
        const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
        const subj = allSubjects.find(s => s.id === courseId);
        if (subj?.faculty) {
            const facDisplayMap = { CS: 'Computer Science', ECON: 'Business Management', LAW: 'Law', MED: 'Medicine', ARTS: 'Arts' };
            faculty = facDisplayMap[subj.faculty] || subj.faculty;
        }
    }

    const durEl = _modalField('admin-generate-duration');
    const durMins = parseInt(durEl?.value || 110);

    const targetSemester = getSemesterNumberFromControl(
        _modalField('admin-generate-semester') || document.getElementById('admin-tt-semester'),
        3
    );

    if (!courseId || courseId.includes('No subjects')) {
        alert('Please select a valid subject. Add subjects for this faculty+semester in the Curriculum CMS first.');
        return;
    }
    if (isEdit && !groupId) {
        alert('Group ID is required while editing a session.');
        return;
    }
    if (!day || !time) {
        alert('Day and time are required.');
        return;
    }

    const finalGroupId = groupId || `G-${Math.floor(Math.random()*900)+100}`;
    const finalProf    = prof  || 'TBD';
    const finalRoom    = room  || 'TBD';
    const excludeConflictId = isEdit ? `${editCourseId}::${editGroupId}` : null;

    // Recalculate endTime if blank
    if (!endTime && time) endTime = minutesToTimeString(convertTimeToMinutes(time) + durMins);

    if (finalProf !== 'TBD') {
        const overlap = checkProfessorOverlap(finalProf, day, time, endTime, excludeConflictId);
        if (overlap) { alert(`CONFLICT: ${finalProf} is already assigned to ${overlap.courseId} (${overlap.id}).`); return; }
    }
    if (finalRoom !== 'TBD') {
        const overlap = checkRoomOverlap(finalRoom, day, time, endTime, excludeConflictId);
        if (overlap) { alert(`CONFLICT: Room ${finalRoom} is booked for ${overlap.courseId} (${overlap.id}).`); return; }
    }

    const instructorPlaceholder = /^(tbd|unassigned|n\/a|--|-)$/i;
    const hasAssignedProf = Boolean(String(finalProf || '').trim()) && !instructorPlaceholder.test(String(finalProf || '').trim());
    const hasAssignedTa = Boolean(String(ta || '').trim()) && !instructorPlaceholder.test(String(ta || '').trim());
    const newGroup = {
        id: finalGroupId.toLowerCase(),
        name: finalGroupId,
        faculty: faculty,
        semester: targetSemester,
        day: day,
        time: time,
        endTime: endTime,
        prof: finalProf,
        ta: ta,
        room: finalRoom,
        duration: `${durMins}min`,
        sessionType: hasAssignedTa && !hasAssignedProf ? 'seminar' : 'lecture',
        capacity: parseInt(capacity) || 40,
        registered: 0
    };

    if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] = [];

    if (isEdit) {
        const sourceGroups = KIU_STATE.availableGroups[editCourseId] || [];
        const sourceIndex = sourceGroups.findIndex(g => String(g.id).toLowerCase() === editGroupId);
        const existingGroup = sourceIndex >= 0 ? sourceGroups[sourceIndex] : null;
        const preservedRegistered = existingGroup?.registered || 0;

        newGroup.registered = preservedRegistered;

        if (existingGroup && editCourseId === courseId && editGroupId === newGroup.id) {
            sourceGroups[sourceIndex] = {
                ...existingGroup,
                ...newGroup
            };
        } else {
            if (sourceIndex >= 0) sourceGroups.splice(sourceIndex, 1);
            KIU_STATE.availableGroups[courseId].push(newGroup);
        }
    } else {
        KIU_STATE.availableGroups[courseId].push(newGroup);
    }

    saveState();
    closeSchedulerModal();
    renderAdminMasterGrid();
    alert(`Session ${isEdit ? 'updated' : 'created'}: ${courseId} - Group ${finalGroupId} | ${day} ${time}-${endTime} | ${faculty} Sem ${targetSemester}`);
}

function renderAdminMasterGrid() {
    const container = document.getElementById('admin-master-grid-container');
    if (!container) return;
    
    const targetFacEl = document.getElementById('admin-tt-faculty');
    const targetSemEl = document.getElementById('admin-tt-semester');
    const targetGroupEl = document.getElementById('admin-tt-group');
    const targetProfEl = document.getElementById('admin-tt-prof');
    
    if (!targetFacEl || !targetSemEl) return;
    
    const targetFac = targetFacEl.value;
    const targetSem = parseInt(targetSemEl.value);
    const targetGroup = targetGroupEl ? targetGroupEl.value : 'all';
    const targetProf = targetProfEl ? targetProfEl.value : 'all';
    
    // Performance cache REMOVED. Bruteforce render HTML unconditionally.
    
    let items = [];
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId].forEach(g => {
            // Hotfix: mock data lacks explicit semester and faculty mapped locally inside groups.
            // Derive faculty dynamically based on ID prefixes if missing.
            let derivedFaculty = g.faculty;
            if (!derivedFaculty) {
                if (cId.startsWith('CS') || cId.startsWith('STAT') || cId.startsWith('CALC')) derivedFaculty = 'Computer Science';
                else if (cId.startsWith('ECON') || cId.startsWith('PM')) derivedFaculty = 'Business Management';
                else derivedFaculty = 'Law';
            }
            
            const groupSem = parseInt(g.semester || 3); // Default to sem 3
            
            if (groupSem === targetSem && (targetFac === 'all' || derivedFaculty === targetFac)) {
                if (targetGroup !== 'all' && g.id !== targetGroup) return;
                if (targetProf !== 'all' && g.prof !== targetProf) return;
                
                items.push({ courseId: cId, ...g, faculty: derivedFaculty });
            }
        });
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const activeFaculties = targetFac === 'all' ? ['Computer Science', 'Business Management', 'Law'] : [targetFac];
    
    let html = `<div class="sch-board-shell">
        <!-- Calendar Header -->
        <div class="sch-board-header">
            <div class="sch-board-timezone">
                GMT+4
            </div>
            <div class="sch-board-header-days">`;
            
    days.forEach((d, idx) => {
        let subHeaders = '';
        if (activeFaculties.length > 1) {
            subHeaders = `<div class="sch-board-subheaders">`;
            activeFaculties.forEach((fac, fIdx) => {
                const facAcronym = fac === 'Computer Science' ? 'CS' : (fac === 'Business Management' ? 'BUS' : 'LAW');
                subHeaders += `<div class="sch-board-subheader-cell${fIdx < activeFaculties.length - 1 ? ' is-divider' : ''}">${facAcronym}</div>`;
            });
            subHeaders += `</div>`;
        }
        
        html += `<div class="sch-board-day-header${idx === 0 ? ' is-today' : ''}">
            <div class="sch-board-day-title${idx === 0 ? ' is-today' : ''}">${d}</div>
            ${subHeaders}
        </div>`;
    });
    
    html += `</div></div>
        
        <!-- Calendar Body (Scrollable) -->
        <div class="sch-board-body">
            <!-- Time Sidebar -->
            <div class="sch-board-time-column">`;
            
    timeSlots.forEach(t => {
        html += `<div class="sch-board-time-slot">
            <span class="sch-board-time-label">${t}</span>
        </div>`;
    });
    
    html += `</div>`;
    
    days.forEach((d) => {
        html += `<div class="scheduler-col sch-board-day-column">`;
        
        activeFaculties.forEach((fac, fIdx) => {
            html += `<div class="sch-board-lane${fIdx < activeFaculties.length - 1 ? ' is-divider' : ''}">`;
            
            // 1. Draw Invisible Clickable Slots Background
            timeSlots.forEach(t => {
                html += `<div data-scheduler-open="1" data-scheduler-day="${escapeHtml(d)}" data-scheduler-time="${escapeHtml(t)}" class="grid-slot-interactive sch-grid-slot"></div>`;
            });
            
            // 2. Draw Absolute Positioned Events
            const colItems = items.filter(i => i.day === d && i.faculty === fac);
            
            colItems.forEach(si => {
                const startMins = convertTimeToMinutes(si.time) - (9 * 60); 
                const topPx = (startMins / 60) * 120;
                
                const durMatch = si.duration ? si.duration.match(/\d+/) : null;
                const durMins = durMatch ? parseInt(durMatch[0]) : 110;
                const heightPx = (durMins / 60) * 120;
                
                const isCS = si.faculty === 'Computer Science';
                const isBiz = si.faculty === 'Business Management';
                
                const color = isCS ? '#0f6cbd' : (isBiz ? '#a4262c' : '#107c41');
                const eventToneClass = isCS ? 'is-cs' : (isBiz ? 'is-biz' : 'is-law');
                
                // Unassigned Badges Check
                const unassignedWarning = (si.prof === 'TBD' || si.room === 'TBD')
                    ? `<div class="sch-event-draft-badge">DRAFT</div>`
                    : '';
                
                html += `
                <div class="calendar-event-card sch-event-card ${eventToneClass}" data-scheduler-edit="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}" data-sch-top="${topPx}" data-sch-height="${heightPx - 8}">
                    ${unassignedWarning}
                    <div class="sch-event-card-title">
                        ${si.courseId} <span class="sch-event-card-group">(${si.id})</span>
                    </div>
                    <div class="sch-event-card-meta${si.prof === 'TBD' ? ' is-missing' : ''}">
                        <i class="fas fa-user-circle sch-event-card-icon"></i> ${si.prof === 'TBD' ? 'No Professor' : si.prof}
                    </div>
                    <div class="sch-event-card-room${si.room === 'TBD' ? ' is-missing' : ''}">
                        <i class="fas fa-map-marker-alt sch-event-card-icon"></i> ${si.room === 'TBD' ? 'No Room' : si.room}
                    </div>
                    <i class="fas fa-circle-info trash-hover sch-event-card-utility sch-event-card-utility--stats" data-scheduler-stats="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}"></i>
                    <i class="fas fa-trash trash-hover sch-event-card-utility sch-event-card-utility--delete" data-scheduler-delete="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}"></i>
                </div>`;
            });
            
            html += `</div>`; // End Faculty Lane
        });
        
        html += `</div>`; // End Day Column
    });
    
    html += `</div></div></div>`;
    container.innerHTML = localizeHtmlMarkup(html);
    syncPlannerSchedulerEventMetrics(container);
}

// Helper: get the MODAL version of a field (last element with that ID, since modal is appended last in DOM)
function _modalField(id) {
    const all = document.querySelectorAll('#' + id);
    return all.length > 0 ? all[all.length - 1] : null;
}

function setLegacySchedulerModalMode(mode = 'create') {
    const isEdit = mode === 'edit';
    const editCourseEl = _modalField('admin-generate-edit-course');
    const editGroupEl = _modalField('admin-generate-edit-group');
    if (!isEdit) {
        if (editCourseEl) editCourseEl.value = '';
        if (editGroupEl) editGroupEl.value = '';
    }

    const submitBtn = _modalField('admin-generate-submit-btn') || document.getElementById('admin-generate-submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = isEdit
            ? '<i class="fas fa-pen-to-square"></i> Save Session Changes'
            : '<i class="fas fa-plus-circle"></i> Create Session';
    }
}

function openSchedulerModal(day, time) {
    const faculty = document.getElementById('admin-tt-faculty')?.value || 'all';
    refreshSemesterDropdowns();
    const semester = getSemesterNumberFromControl('admin-tt-semester', 3);
    setLegacySchedulerModalMode('create');

    // Populate subject dropdown FILTERED by faculty+semester only
    const subSelect = document.getElementById('modal-generate-subject');
    if (subSelect) {
        const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
        const filtered = allSubjects.filter(s => {
            const sFac = s.faculty || '';
            const facMatch = faculty === 'all' ||
                sFac === faculty ||
                (faculty === 'Computer Science' && (sFac === 'CS' || s.id.startsWith('CALC') || s.id.startsWith('STAT') || s.id.startsWith('CS'))) ||
                (faculty === 'Business Management' && (sFac === 'ECON' || s.id.startsWith('ECON') || s.id.startsWith('PM'))) ||
                (faculty === 'Law' && (sFac === 'LAW' || s.id.startsWith('LAW')));
            const semMatch = !s.semester || parseInt(s.semester) === semester;
            return facMatch && semMatch;
        });

        subSelect.innerHTML = filtered.length > 0
            ? filtered.map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`).join('')
            : '<option value="">No subjects for this faculty/semester. Add subjects first.</option>';

        const paletteHighlight = document.getElementById('admin-generate-subject');
        if (paletteHighlight?.value) subSelect.value = paletteHighlight.value;
    }

    // Pre-fill fields
    const dayEl = _modalField('admin-generate-day');
    if (dayEl) dayEl.value = day;

    const timeEl = _modalField('admin-generate-time');
    if (timeEl) timeEl.value = normalizeTimeString(time, '09:00');

    const semEl = _modalField('admin-generate-semester');
    if (semEl) semEl.value = semester;

    const facEl = _modalField('admin-generate-faculty');
    if (facEl) { facEl.value = faculty; facEl.dataset.rawFac = faculty; }

    // Auto end time
    const durEl = _modalField('admin-generate-duration');
    const endEl = _modalField('admin-generate-endtime');
    if (timeEl?.value && durEl && endEl) endEl.value = minutesToTimeString(convertTimeToMinutes(timeEl.value) + parseInt(durEl.value || 110, 10));

    // Show the overlay
    const overlay = document.getElementById('modal-overlay');
    const schedulerModal = document.getElementById('schedulerModal');
    if (!overlay || !schedulerModal) { console.error('schedulerModal or overlay not found'); return; }

    // Hide all other modal-content panels, show only schedulerModal's panel
    document.querySelectorAll('#modal-overlay .modal-content').forEach((el) => setPlannerModalPanelVisibility(el, false));
    const mc = schedulerModal.querySelector('.modal-content');
    setPlannerModalPanelVisibility(mc, true);
    overlay.classList.add('active');
}

function openSchedulerEditModal(courseId, groupId) {
    const groups = KIU_STATE.availableGroups?.[courseId] || [];
    const target = groups.find(g => String(g.id).toLowerCase() === String(groupId).toLowerCase());
    if (!target) {
        alert('Session not found for editing. Please refresh and try again.');
        return;
    }

    openSchedulerModal(target.day || 'Day TBD', normalizeTimeString(target.time, '09:00'));
    setLegacySchedulerModalMode('edit');

    const subjectEl = document.getElementById('modal-generate-subject');
    if (subjectEl) {
        if (!subjectEl.querySelector(`option[value="${courseId}"]`)) {
            subjectEl.insertAdjacentHTML('beforeend', `<option value="${courseId}">${courseId} - ${target.name || courseId}</option>`);
        }
        subjectEl.value = courseId;
    }

    const durationMin = parseInt(String(target.duration || '110').match(/\d+/)?.[0] || '110', 10);
    const endValue = normalizeTimeString(target.endTime || '', '') || minutesToTimeString(convertTimeToMinutes(target.time) + durationMin);

    const groupEl = _modalField('admin-generate-group');
    if (groupEl) groupEl.value = target.name || target.id || groupId;
    const dayEl = _modalField('admin-generate-day');
    if (dayEl && target.day) dayEl.value = target.day;
    const timeEl = _modalField('admin-generate-time');
    if (timeEl) timeEl.value = normalizeTimeString(target.time || '', '09:00');
    const roomEl = _modalField('admin-generate-room');
    if (roomEl) roomEl.value = (target.room && target.room !== 'TBD') ? target.room : '';
    const profEl = _modalField('admin-generate-prof');
    if (profEl) profEl.value = (target.prof && target.prof !== 'TBD') ? target.prof : '';
    const taEl = _modalField('admin-generate-ta');
    if (taEl) taEl.value = target.ta || '';
    const capEl = _modalField('admin-generate-capacity');
    if (capEl) capEl.value = String(target.capacity || 40);
    const endEl = _modalField('admin-generate-endtime');
    if (endEl) endEl.value = endValue;

    const durationEl = _modalField('admin-generate-duration');
    if (durationEl) {
        if ([...durationEl.options].some(opt => opt.value === String(durationMin))) {
            durationEl.value = String(durationMin);
        } else {
            durationEl.insertAdjacentHTML('beforeend', `<option value="${durationMin}">${durationMin} Min (Custom)</option>`);
            durationEl.value = String(durationMin);
        }
    }

    const semEl = _modalField('admin-generate-semester');
    if (semEl && target.semester) semEl.value = target.semester;

    const editCourseEl = _modalField('admin-generate-edit-course');
    if (editCourseEl) editCourseEl.value = courseId;
    const editGroupEl = _modalField('admin-generate-edit-group');
    if (editGroupEl) editGroupEl.value = String(groupId).toLowerCase();
}

function closeSchedulerModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');

    const schedulerModal = document.getElementById('schedulerModal');
    if (schedulerModal) {
        const mc = schedulerModal.querySelector('.modal-content');
        setPlannerModalPanelVisibility(mc, false);
    }

    // Clear modal-specific inputs
    ['admin-generate-group', 'admin-generate-prof', 'admin-generate-room', 'admin-generate-ta'].forEach(id => {
        const el = _modalField(id);
        if (el) el.value = '';
    });
    setLegacySchedulerModalMode('create');
}


function minutesToTimeString(totalMinutes) {
    const mins = Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : 0;
    const bounded = ((mins % 1440) + 1440) % 1440;
    const hours = Math.floor(bounded / 60);
    const minutes = bounded % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseTimeString(timeStr) {
    const raw = String(timeStr || '').trim().replace(/\u00A0/g, ' ');
    if (!raw) return NaN;

    const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AaPp][Mm])$/);
    if (twelveHour) {
        let hours = parseInt(twelveHour[1], 10);
        const minutes = parseInt(twelveHour[2] || '0', 10);
        const period = twelveHour[3].toUpperCase();
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return NaN;
        if (period === 'AM') hours = hours === 12 ? 0 : hours;
        if (period === 'PM') hours = hours === 12 ? 12 : hours + 12;
        return hours * 60 + minutes;
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHour) {
        const hours = parseInt(twentyFourHour[1], 10);
        const minutes = parseInt(twentyFourHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
        return hours * 60 + minutes;
    }

    return NaN;
}

function normalizeTimeString(timeStr, fallback = '') {
    const parsed = parseTimeString(timeStr);
    if (!Number.isFinite(parsed)) return fallback;
    return minutesToTimeString(parsed);
}

function convertTimeToMinutes(timeStr) {
    const parsed = parseTimeString(timeStr);
    return Number.isFinite(parsed) ? parsed : 0;
}

function checkProfessorOverlap(prof, day, start, end, excludeId, weekStart = getCurrentWeekStartISO()) {
    if (!prof || prof === '-') return null;
    const sMin = convertTimeToMinutes(start);
    const eMin = convertTimeToMinutes(end);
    const sessions = getAvailableScheduleItemsForWeek(weekStart);
    for (const session of sessions) {
        if (session.prof !== prof || session.day !== day) continue;
        if (excludeId && `${session.courseId}::${session.id}` === excludeId) continue;
        const gsMin = convertTimeToMinutes(session.time);
        const geMin = convertTimeToMinutes(session.endTime || session.time);
        if (sMin < geMin && eMin > gsMin) return session;
    }
    return null;
}

function checkRoomOverlap(room, day, start, end, excludeId, weekStart = getCurrentWeekStartISO()) {
    if (!room || room === '-') return null;
    const sMin = convertTimeToMinutes(start);
    const eMin = convertTimeToMinutes(end);
    const sessions = getAvailableScheduleItemsForWeek(weekStart);
    for (const session of sessions) {
        if (session.room !== room || session.day !== day) continue;
        if (excludeId && `${session.courseId}::${session.id}` === excludeId) continue;
        const gsMin = convertTimeToMinutes(session.time);
        const geMin = convertTimeToMinutes(session.endTime || session.time);
        if (sMin < geMin && eMin > gsMin) return session;
    }
    return null;
}

function autoSetEndTime(context = 'admin') {
    const prefix = context === 'modal' ? 'modal-' : 'admin-';
    const resolveField = (id) => {
        if (typeof _modalField === 'function') {
            const modalField = _modalField(id);
            if (modalField) return modalField;
        }
        return document.getElementById(id);
    };
    const timeInput = resolveField(`${prefix}generate-time`);
    const endInput = resolveField(`${prefix}generate-endtime`);
    const durationInput = resolveField(`${prefix}generate-duration`);
    
    if (!timeInput || !timeInput.value || !endInput) return;
    
    const customDur = durationInput ? parseInt(durationInput.value, 10) : 110;
    const startMins = parseTimeString(timeInput.value);
    if (!Number.isFinite(startMins) || !Number.isFinite(customDur)) return;
    endInput.value = minutesToTimeString(startMins + customDur);
}

const adminSystemOpsRuntime = {
    loading: false,
    loaded: false,
    status: null,
    systems: [],
    syncRuns: [],
    conflicts: [],
    auditEvents: [],
    lastLoadedAt: '',
    lastError: ''
};

function adminOpsEscape(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function adminOpsFormatDateTime(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return adminOpsEscape(value);
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function adminOpsFormatStatusLabel(value, fallback = 'Unknown') {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return fallback;
    return normalized
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getAdminOpsTone(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const accentTone = getFacultyThemeTone(getCurrentFaculty(), {
        useCurrentPalette: true,
        softAlpha: 0.12,
        tintAlpha: 0.18,
        borderAlpha: 0.24
    });
    if (['ready', 'completed', 'resolved', 'active', 'open'].includes(normalized)) {
        return { bg: '#dcfce7', text: '#166534' };
    }
    if (['configured', 'queued', 'in_progress', 'in-progress', 'pending', 'waiting'].includes(normalized)) {
        return { bg: accentTone.softBg, text: accentTone.accent };
    }
    if (['failed', 'error', 'disabled', 'blocked'].includes(normalized)) {
        return { bg: '#fee2e2', text: '#b91c1c' };
    }
    return { bg: '#f1f5f9', text: '#475569' };
}

function getAdminOpsToneClass(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['ready', 'completed', 'resolved', 'active', 'open'].includes(normalized)) return 'is-ready';
    if (['configured', 'queued', 'in_progress', 'in-progress', 'pending', 'waiting'].includes(normalized)) return 'is-pending';
    if (['failed', 'error', 'disabled', 'blocked'].includes(normalized)) return 'is-danger';
    return 'is-neutral';
}

function ensureAdminSystemOpsRoot() {
    const dashboard = document.querySelector('#page-admin-tools .dashboard-admin')
        || document.querySelector('#page-home .only-admin.dashboard-admin');
    if (!dashboard) return null;
    let root = document.getElementById('admin-system-ops-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'admin-system-ops-root';
        root.className = 'content-box admin-card admin-system-ops-root';
        const firstCard = dashboard.querySelector('.content-box.admin-card');
        if (firstCard && firstCard.parentNode === dashboard) dashboard.insertBefore(root, firstCard);
        else dashboard.appendChild(root);
    }
    return root;
}

function focusAdminSystemOps() {
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!adminSystemOpsRuntime.loaded && !adminSystemOpsRuntime.loading) {
        refreshAdminSystemOpsDashboard();
    }
}

function renderAdminSystemOpsDashboard() {
    bindAdminToolsPlannerDelegates();
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;

    const runtime = adminSystemOpsRuntime;
    const systems = Array.isArray(runtime.systems) && runtime.systems.length
        ? runtime.systems
        : (Array.isArray(runtime.status?.systems) ? runtime.status.systems : []);
    const syncRuns = Array.isArray(runtime.syncRuns) ? runtime.syncRuns : [];
    const conflicts = Array.isArray(runtime.conflicts) ? runtime.conflicts : [];
    const auditEvents = Array.isArray(runtime.auditEvents) ? runtime.auditEvents : [];
    const readySystems = systems.filter(system => String(system.status || '').trim().toLowerCase() === 'ready').length;
    const authoritativeSystems = systems.filter(system => system.isAuthoritative !== false).length;
    const openConflicts = conflicts.filter(conflict => String(conflict.resolutionStatus || '').trim().toLowerCase() !== 'resolved').length;
    const latestSync = syncRuns[0] || null;
    root.innerHTML = `
        <div class="admin-card-title admin-system-ops-head">
            <div class="admin-card-title-icon admin-system-ops-head-icon">
                <i class="fas fa-server"></i>
            </div>
            <div class="admin-system-ops-head-copy">
                <div class="admin-card-title-text">University Systems and Sync</div>
                <div class="admin-card-subtitle">Live backend readiness, connected systems, sync history, open conflicts, and audit activity.</div>
            </div>
            <div class="admin-system-ops-head-actions">
                <span class="admin-system-ops-head-meta">${runtime.lastLoadedAt ? `Last refresh: ${adminOpsEscape(adminOpsFormatDateTime(runtime.lastLoadedAt))}` : 'Waiting for first refresh'}</span>
                <button type="button" class="kiu-btn-outline admin-system-ops-refresh-btn" data-admin-planner-refresh-system-ops="1" ${runtime.loading ? 'disabled' : ''}>
                    <i class="fas fa-rotate-right"></i> ${runtime.loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
        </div>
        <div class="admin-system-ops-stat-grid">
            <div class="content-box surface-card admin-system-ops-stat-card">
                <div class="admin-system-ops-stat-label">Environment</div>
                <div class="admin-system-ops-stat-value">${adminOpsEscape(adminOpsFormatStatusLabel(runtime.status?.environment, 'Unknown'))}</div>
            </div>
            <div class="content-box surface-card admin-system-ops-stat-card">
                <div class="admin-system-ops-stat-label">Connected systems</div>
                <div class="admin-system-ops-stat-value admin-system-ops-stat-value-accent">${systems.length}</div>
                <div class="admin-system-ops-stat-copy">${readySystems} ready</div>
            </div>
            <div class="content-box surface-card admin-system-ops-stat-card">
                <div class="admin-system-ops-stat-label">Authoritative sources</div>
                <div class="admin-system-ops-stat-value admin-system-ops-stat-value-success">${authoritativeSystems}</div>
                <div class="admin-system-ops-stat-copy">Systems marked as source of truth</div>
            </div>
            <div class="content-box surface-card admin-system-ops-stat-card">
                <div class="admin-system-ops-stat-label">Open conflicts</div>
                <div class="admin-system-ops-stat-value admin-system-ops-stat-value-danger">${openConflicts}</div>
                <div class="admin-system-ops-stat-copy">${latestSync ? `Latest sync: ${adminOpsEscape(adminOpsFormatStatusLabel(latestSync.runStatus || latestSync.status, 'Unknown'))}` : 'No sync runs recorded yet'}</div>
            </div>
            <div class="content-box surface-card admin-system-ops-stat-card">
                <div class="admin-system-ops-stat-label">Connected mailboxes</div>
                <div class="admin-system-ops-stat-value admin-system-ops-stat-value-info">${Number(runtime.status?.connectedMailboxes || 0)}</div>
                <div class="admin-system-ops-stat-copy">${Number(runtime.status?.failedMailboxes || 0)} with sync failure state</div>
            </div>
        </div>
        <div class="admin-system-ops-grid admin-system-ops-grid-primary">
            <div class="content-box surface-card admin-system-ops-section-card">
                <div class="admin-system-ops-section-head">
                    <div>
                        <div class="admin-system-ops-section-title">System registry</div>
                        <div class="admin-system-ops-section-copy">Identity, SIS, finance, HR, curriculum, and portal collaboration services.</div>
                    </div>
                    <span class="admin-system-ops-section-meta">Storage: ${adminOpsEscape(runtime.status?.storageMode || 'Unknown')}</span>
                </div>
                <div class="admin-system-ops-list">
                    ${systems.map(system => {
                        const toneClass = getAdminOpsToneClass(system.status);
                        return `
                            <div class="admin-system-ops-item-card">
                                <div class="admin-system-ops-item-head">
                                    <strong class="admin-system-ops-item-title">${adminOpsEscape(system.displayName || system.systemCode)}</strong>
                                    <span class="admin-system-ops-pill ${toneClass}">${adminOpsEscape(adminOpsFormatStatusLabel(system.status, 'Unknown'))}</span>
                                </div>
                                <div class="admin-system-ops-pill-row">
                                    <span class="admin-system-ops-pill is-domain">${adminOpsEscape(adminOpsFormatStatusLabel(system.ownerDomain, 'External'))}</span>
                                    <span class="admin-system-ops-pill is-accent">${adminOpsEscape(adminOpsFormatStatusLabel(system.syncMode, 'Unknown'))}</span>
                                    <span class="admin-system-ops-pill ${system.isAuthoritative !== false ? 'is-ready' : 'is-neutral'}">${system.isAuthoritative !== false ? 'Source of truth' : 'Dependent system'}</span>
                                    <span class="admin-system-ops-pill ${system.apiKeyConfigured ? 'is-ready' : 'is-warning'}">${system.apiKeyConfigured ? 'Credentials set' : 'Credentials missing'}</span>
                                </div>
                                <div class="admin-system-ops-item-copy">
                                    Endpoint: ${adminOpsEscape(system.baseUrl || 'Not configured')}<br>
                                    Last checked: ${adminOpsEscape(adminOpsFormatDateTime(system.lastCheckedAt))}
                                </div>
                            </div>
                        `;
                    }).join('') || '<div class="admin-system-ops-empty-state">No integration systems are registered yet.</div>'}
                </div>
            </div>
            <div class="admin-system-ops-column">
                <div class="content-box surface-card admin-system-ops-section-card">
                    <div class="admin-system-ops-section-title admin-system-ops-section-title-spaced">Platform readiness</div>
                    <div class="admin-system-ops-list">
                        ${[
                            { label: 'Backend bridge', ready: Boolean(runtime.status?.backendUrl), detail: runtime.status?.backendUrl || 'Not configured' },
                            { label: 'Microsoft sign-in', ready: Boolean(runtime.status?.microsoftReady), detail: runtime.status?.microsoftReady ? 'Configured' : 'Not configured' },
                            { label: 'Microsoft mail consent', ready: Boolean(runtime.status?.microsoftMailReady), detail: runtime.status?.microsoftMailReady ? `${Number(runtime.status?.connectedMailboxes || 0)} mailbox connections` : 'Mail consent is not configured yet' },
                            { label: 'Shared uploads', ready: Boolean(runtime.status?.uploadsReady), detail: runtime.status?.uploadsReady ? 'Uploads directory ready' : 'Uploads path missing' },
                            { label: 'TURN / RTC relay', ready: Boolean(runtime.status?.turnConfigured), detail: runtime.status?.turnConfigured ? 'TURN servers configured' : 'TURN not configured yet' }
                        ].map(item => `
                            <div class="admin-system-ops-ready-card">
                                <div>
                                    <div class="admin-system-ops-ready-title">${adminOpsEscape(item.label)}</div>
                                    <div class="admin-system-ops-ready-copy">${adminOpsEscape(item.detail)}</div>
                                </div>
                                <span class="admin-system-ops-pill ${item.ready ? 'is-ready' : 'is-danger'}">${item.ready ? 'Ready' : 'Attention'}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${runtime.lastError ? `<div class="admin-system-ops-error-note">${adminOpsEscape(runtime.lastError)}</div>` : ''}
                </div>
                <div class="content-box surface-card admin-system-ops-section-card">
                    <div class="admin-system-ops-section-title admin-system-ops-section-title-spaced">Recent sync runs</div>
                    <div class="admin-system-ops-list">
                        ${syncRuns.slice(0, 5).map(run => {
                            const toneClass = getAdminOpsToneClass(run.runStatus || run.status);
                            return `
                                <div class="admin-system-ops-item-card admin-system-ops-item-card-compact">
                                    <div class="admin-system-ops-item-head">
                                        <strong class="admin-system-ops-item-title admin-system-ops-item-title-compact">${adminOpsEscape(adminOpsFormatStatusLabel(run.systemCode, 'System'))}</strong>
                                        <span class="admin-system-ops-pill ${toneClass}">${adminOpsEscape(adminOpsFormatStatusLabel(run.runStatus || run.status, 'Unknown'))}</span>
                                    </div>
                                    <div class="admin-system-ops-run-meta">Scope: ${adminOpsEscape(adminOpsFormatStatusLabel(run.syncScope || run.scope, 'Full'))}</div>
                                    <div class="admin-system-ops-item-copy admin-system-ops-item-copy-tight">Seen ${Number(run.recordsSeen || 0)} | Changed ${Number(run.recordsChanged || 0)}</div>
                                    <div class="admin-system-ops-item-copy admin-system-ops-item-copy-tight">Started ${adminOpsEscape(adminOpsFormatDateTime(run.startedAt))}</div>
                                    ${run.errorSummary ? `<div class="admin-system-ops-run-error">${adminOpsEscape(run.errorSummary)}</div>` : ''}
                                </div>
                            `;
                        }).join('') || '<div class="admin-system-ops-empty-state">No sync runs have been recorded yet.</div>'}
                    </div>
                </div>
            </div>
        </div>
        <div class="admin-system-ops-grid admin-system-ops-grid-secondary">
            <div class="content-box surface-card admin-system-ops-section-card">
                <div class="admin-system-ops-section-title admin-system-ops-section-title-spaced">Open reconciliation conflicts</div>
                <div class="admin-system-ops-list">
                    ${conflicts.slice(0, 6).map(conflict => {
                        const toneClass = getAdminOpsToneClass(conflict.resolutionStatus);
                        return `
                            <div class="admin-system-ops-item-card">
                                <div class="admin-system-ops-item-head">
                                    <strong class="admin-system-ops-item-title admin-system-ops-item-title-compact">${adminOpsEscape(adminOpsFormatStatusLabel(conflict.systemCode, 'System'))} / ${adminOpsEscape(adminOpsFormatStatusLabel(conflict.entityType, 'Record'))}</strong>
                                    <span class="admin-system-ops-pill ${toneClass}">${adminOpsEscape(adminOpsFormatStatusLabel(conflict.resolutionStatus, 'Open'))}</span>
                                </div>
                                <div class="admin-system-ops-run-meta">Field: ${adminOpsEscape(conflict.conflictField)}</div>
                                <div class="admin-system-ops-item-copy admin-system-ops-item-copy-tight">Local: ${adminOpsEscape(conflict.localRecordId || 'n/a')} | External: ${adminOpsEscape(conflict.externalRecordKey || 'n/a')}</div>
                                <div class="admin-system-ops-conflict-diff">
                                    Portal value: ${adminOpsEscape(typeof conflict.localValue === 'object' ? JSON.stringify(conflict.localValue) : conflict.localValue ?? 'null')}<br>
                                    External value: ${adminOpsEscape(typeof conflict.externalValue === 'object' ? JSON.stringify(conflict.externalValue) : conflict.externalValue ?? 'null')}
                                </div>
                            </div>
                        `;
                    }).join('') || '<div class="admin-system-ops-empty-state">No open conflicts are recorded right now.</div>'}
                </div>
            </div>
            <div class="content-box surface-card admin-system-ops-section-card">
                <div class="admin-system-ops-section-title admin-system-ops-section-title-spaced">Audit trail</div>
                <div class="admin-system-ops-list">
                    ${auditEvents.slice(0, 8).map(event => `
                        <div class="admin-system-ops-item-card admin-system-ops-item-card-compact">
                            <div class="admin-system-ops-item-head admin-system-ops-item-head-wrap">
                                <strong class="admin-system-ops-item-title admin-system-ops-item-title-compact">${adminOpsEscape(adminOpsFormatStatusLabel(event.eventDomain, 'Domain'))} / ${adminOpsEscape(adminOpsFormatStatusLabel(event.eventType, 'Event'))}</strong>
                                <span class="admin-system-ops-pill is-domain">${adminOpsEscape(adminOpsFormatStatusLabel(event.sourceSystem, 'Portal'))}</span>
                            </div>
                            <div class="admin-system-ops-run-meta">Entity: ${adminOpsEscape(event.entityType)} / ${adminOpsEscape(event.entityId)}</div>
                            <div class="admin-system-ops-item-copy admin-system-ops-item-copy-tight">Actor: ${adminOpsEscape(event.actorUserId || 'system')} ${event.actorRole ? `(${adminOpsEscape(adminOpsFormatStatusLabel(event.actorRole, 'Role'))})` : ''}</div>
                            <div class="admin-system-ops-item-copy admin-system-ops-item-copy-tight">${adminOpsEscape(adminOpsFormatDateTime(event.createdAt))}</div>
                        </div>
                    `).join('') || '<div class="admin-system-ops-empty-state">No audit events have been recorded yet.</div>'}
                </div>
            </div>
        </div>
    `;
}

async function refreshAdminSystemOpsDashboard(force = false) {
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;
    if (adminSystemOpsRuntime.loading) return;

    adminSystemOpsRuntime.loading = true;
    if (!adminSystemOpsRuntime.loaded) {
        renderAdminSystemOpsDashboard();
    } else if (!force) {
        renderAdminSystemOpsDashboard();
    } else {
        adminSystemOpsRuntime.lastError = '';
        renderAdminSystemOpsDashboard();
    }

    try {
        const [
            status,
            systems,
            syncRuns,
            conflicts,
            auditEvents
        ] = await Promise.all([
            typeof fetchPortalPlatformStatus === 'function' ? fetchPortalPlatformStatus() : Promise.resolve(null),
            typeof fetchPortalIntegrationSystems === 'function' ? fetchPortalIntegrationSystems() : Promise.resolve([]),
            typeof fetchPortalSyncRuns === 'function' ? fetchPortalSyncRuns({ limit: 10 }) : Promise.resolve([]),
            typeof fetchPortalSyncConflicts === 'function' ? fetchPortalSyncConflicts({ limit: 10 }) : Promise.resolve([]),
            typeof fetchPortalAuditEvents === 'function' ? fetchPortalAuditEvents({ limit: 12 }) : Promise.resolve([])
        ]);

        adminSystemOpsRuntime.status = status || null;
        adminSystemOpsRuntime.systems = Array.isArray(systems) ? systems : [];
        adminSystemOpsRuntime.syncRuns = Array.isArray(syncRuns) ? syncRuns : [];
        adminSystemOpsRuntime.conflicts = Array.isArray(conflicts) ? conflicts : [];
        adminSystemOpsRuntime.auditEvents = Array.isArray(auditEvents) ? auditEvents : [];
        adminSystemOpsRuntime.loaded = true;
        adminSystemOpsRuntime.lastLoadedAt = new Date().toISOString();
        adminSystemOpsRuntime.lastError = status
            ? ''
            : 'The portal backend did not return platform status. Start the local bridge or production backend to see live system health.';
    } catch (error) {
        adminSystemOpsRuntime.lastError = error?.message || 'Could not load system operations data.';
    } finally {
        adminSystemOpsRuntime.loading = false;
        renderAdminSystemOpsDashboard();
    }
}

function showSlotStats(courseId, groupId) {
    const groups = KIU_STATE.availableGroups[courseId] || [];
    const g = groups.find(x => x.id === groupId);
    if (!g) return;
    
    const occupancy = Math.round((g.registered / g.capacity) * 100);
    alert(`--- SECTION INSIGHTS ---\nSubject: ${courseId}\nGroup: ${g.id}\nProfessor: ${g.prof}\nRoom: ${g.room}\nEnrollment: ${g.registered} / ${g.capacity} (${occupancy}%)\nStatus: ${occupancy > 90 ? 'AT CAPACITY' : 'OPEN'}`);
}

function deleteSection(courseId, groupId) {
    if (!confirm(`Are you sure you want to PERMANENTLY delete Section [${groupId}] for ${courseId}? Students will be automatically unenrolled.`)) return;
    
    if (KIU_STATE.availableGroups[courseId]) {
        KIU_STATE.availableGroups[courseId] = KIU_STATE.availableGroups[courseId].filter(g => g.id !== groupId);
    }
    
    saveState();
    renderAdminMasterGrid();
}

function onAdminDashboardLoad() {
    const fac = getAdminRegistrationFaculty();
    const activeSem = String(KIU_STATE.activeSemester || 3);
    ensureAdminSystemOpsRoot();
    renderAdminSystemOpsDashboard();
    refreshAdminSystemOpsDashboard();

    // Sync curriculum filters first so the library opens on the active term
    const ff = document.getElementById('filter-curriculum-faculty');
    if (ff) ff.value = fac;
    syncCurriculumFacultyBadge(fac);
    const semFilter = document.getElementById('filter-curriculum-semester');
    if (semFilter) semFilter.value = activeSem;

    renderCurriculumTable();
    renderAdminCurriculumPalette();
    renderAdminMasterGrid();
    populateAntiReqDropdown();

    // Init faculty context badge in header
    const ctxBadge = document.getElementById('admin-faculty-context');
    if (ctxBadge) {
        ctxBadge.textContent = getFacultyLabel(fac);
        ctxBadge.classList.add('admin-faculty-context-chip');
    }

    // Sync user management faculty dropdown to current faculty
    const nuf = document.getElementById('new-user-faculty');
    if (nuf) nuf.value = fac;

    updateSubjectCodePreview();
    renderRecentlyCreated();

    // Keep the Registration Structure CMS alive after refreshes.
    if (document.getElementById('admin-reg-content-container')) {
        if (typeof bindAdminRegistrationCmsDelegates === 'function') bindAdminRegistrationCmsDelegates();
        ensureAdminRegistrationCmsDefaults(fac);
        bootAdminRegistrationCms(adminRegActiveTab || 'prog');
    }
    if (document.getElementById('admin-exams-root')) {
        ensureAdminExamState(fac);
        renderAdminExamSection();
    }
    renderAdminQaTestingCard();
}

// =============================================
// BROAD ACADEMIC CALENDAR (2024-2040)
// =============================================
function renderBroadCalendar() {
    const container = document.getElementById('broad-calendar-container');
    if (!container) return;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let viewYear  = parseInt(container.dataset.viewYear  || currentYear);
    let viewMonth = parseInt(container.dataset.viewMonth || currentMonth);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    function getBroadCalendarEventToneClass(eventRecord = {}) {
        const bg = String(eventRecord.color || '').trim().toLowerCase();
        const fg = String(eventRecord.textColor || '').trim().toLowerCase();
        if (bg === '#dcfce7' && fg === '#166534') return 'lux-calendar-event--holiday';
        if (bg === '#fef3c7' && fg === '#92400e') return 'lux-calendar-event--exam';
        if (bg === '#fce7f3' && fg === '#831843') return 'lux-calendar-event--deadline';
        return 'lux-calendar-event--academic';
    }

    // Get events for this month
    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
    const events = KIU_STATE.calendarEvents[monthKey] || [];

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

    let html = `
    <div class="admin-broad-calendar-shell lux-calendar-board">
        <div class="lux-calendar-header">
            <button type="button" data-bc-nav="-1" class="lux-calendar-nav" aria-label="Previous month">&#8249;</button>
            <div class="lux-calendar-heading">
                <div class="lux-calendar-title">${monthNames[viewMonth]} ${viewYear}</div>
                <div class="lux-calendar-subtitle">Academic Calendar / ${viewYear < currentYear ? 'Past' : viewYear > currentYear ? 'Future' : 'Current Year'}</div>
            </div>
            <button type="button" data-bc-nav="1" class="lux-calendar-nav" aria-label="Next month">&#8250;</button>
        </div>
        <div class="lux-calendar-jumps">
            <span class="admin-broad-calendar-jump-label">Jump to year:</span>
            ${Array.from({length: 2040-2024+1}, (_,i) => 2024+i).map(y =>
                `<button type="button" data-bc-year="${y}" class="admin-broad-calendar-jump-btn${y===viewYear ? ' is-active' : ''}">${y}</button>`
            ).join('')}
        </div>
        <div class="lux-calendar-days">
            ${dayNames.map(d => `<div>${d}</div>`).join('')}
        </div>
        <div class="lux-calendar-grid">
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="lux-calendar-cell is-empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = (d === new Date().getDate() && viewMonth === currentMonth && viewYear === currentYear);
        const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);

        html += `<div data-bc-date="${dateStr}" class="lux-calendar-cell${isToday ? ' is-today' : ''}">
            <div class="lux-calendar-date">${d}</div>
            ${dayEvents.map(ev => `
                <div class="lux-calendar-event ${getBroadCalendarEventToneClass(ev)}" title="${ev.title}">${ev.title}</div>
            `).join('')}
        </div>`;
    }

    // Fill remaining cells
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
        html += '<div class="lux-calendar-cell is-empty"></div>';
    }

    html += `</div>`;

    // Add Event Panel
    const canEdit = currentUserRole === USER_ROLES.ADMIN;
    if (canEdit) {
        html += `
        <div class="admin-broad-calendar-editor">
            <div class="admin-broad-calendar-field"><label class="admin-broad-calendar-label">DATE</label>
            <input type="date" id="bc-event-date" class="admin-broad-calendar-control"></div>
            <div class="admin-broad-calendar-field admin-broad-calendar-field--wide"><label class="admin-broad-calendar-label">EVENT TITLE</label>
            <input type="text" id="bc-event-title" placeholder="e.g. Midterm Exams Start" class="admin-broad-calendar-control"></div>
            <div class="admin-broad-calendar-field"><label class="admin-broad-calendar-label">TYPE</label>
            <select id="bc-event-type" class="admin-broad-calendar-control">
                <option value="#dbeafe|#1e40af">Academic</option>
                <option value="#dcfce7|#166534">Holiday</option>
                <option value="#fef3c7|#92400e">Exam</option>
                <option value="#fce7f3|#831843">Deadline</option>
            </select></div>
            <button type="button" class="kiu-btn-blue admin-broad-calendar-btn" data-bc-add="1"><i class="fas fa-plus"></i> Add Event</button>
        </div>`;
    }

    html += `</div>`;
    container.innerHTML = localizeHtmlMarkup(html);
    container.dataset.viewYear  = viewYear;
    container.dataset.viewMonth = viewMonth;
    if (typeof renderStudentCalendarSchedule === 'function') renderStudentCalendarSchedule();
}

function bcNav(dir) {
    const c = document.getElementById('broad-calendar-container');
    if (!c) return;
    let y = parseInt(c.dataset.viewYear), m = parseInt(c.dataset.viewMonth);
    m += dir;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    y = Math.max(2024, Math.min(2040, y));
    c.dataset.viewYear = y; c.dataset.viewMonth = m;
    renderBroadCalendar();
}

function bcJumpYear(year) {
    const c = document.getElementById('broad-calendar-container');
    if (!c) return;
    c.dataset.viewYear = year;
    renderBroadCalendar();
}

function bcDayClick(dateStr) {
    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = dateStr.substring(0,7);
    const events = (KIU_STATE.calendarEvents[monthKey] || []).filter(e => e.date === dateStr);
    if (events.length === 0) {
        const d = document.getElementById('bc-event-date');
        if (d) d.value = dateStr;
        return;
    }
    alert(`Events on ${dateStr}:\n${events.map(e => '- ' + e.title).join('\n')}`);
}

function bcAddEvent() {
    if (currentUserRole !== USER_ROLES.ADMIN) {
        alert('Only administrators can add official academic calendar events.');
        return;
    }
    const date  = document.getElementById('bc-event-date')?.value;
    const title = document.getElementById('bc-event-title')?.value?.trim();
    const type  = document.getElementById('bc-event-type')?.value || '#dbeafe|#1e40af';
    if (!date || !title) { alert('Please enter a date and title.'); return; }

    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = date.substring(0,7);
    if (!KIU_STATE.calendarEvents[monthKey]) KIU_STATE.calendarEvents[monthKey] = [];

    const [bg, fg] = type.split('|');
    KIU_STATE.calendarEvents[monthKey].push({ date, title, color: bg, textColor: fg, addedBy: currentUserRole });
    saveState();

    document.getElementById('bc-event-title').value = '';
    renderBroadCalendar();
}

// =============================================
// PER-GROUP MATERIALS KEY (fix for isolation)
// =============================================
// Materials and assignments are now keyed by "courseId::groupId" to keep them separate
function getGroupKey(courseId, groupId) {
    return groupId ? `${courseId}::${groupId}` : courseId;
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (currentUserRole === 'admin') onAdminDashboardLoad();
        if (document.getElementById('admin-generate-time')) autoSetEndTime();
    }, 1500);
});
// Planner route boot

