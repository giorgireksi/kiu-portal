/* Shared UI interactions extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- PROFILE MENU ---
function toggleProfileMenu(event) {
    event.stopPropagation();
    document.getElementById('profileMenu').classList.toggle('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu && profileMenu.classList.contains('show') && !event.target.closest('.user-dropdown-trigger')) {
        profileMenu.classList.remove('show');
    }
    document.querySelectorAll('.select-items').forEach(el => {
        if(el.classList.contains('show') && !event.target.closest('.custom-select')) {
            el.classList.remove('show');
        }
    });
    document.querySelectorAll('.grade-popover').forEach(el => {
        if(el.classList.contains('show') && !event.target.closest('.grade-popover-container')) {
            el.classList.remove('show');
        }
    });
});

// --- CALENDAR TABS ---
function switchCalendarTab(tab) {
    ['cal','announcements','events','officehours'].forEach(t => {
        const tabEl = document.getElementById(`cal-tab-${t}`);
        const contentEl = document.getElementById(`cal-content-${t}`);
        if (tabEl)     { tabEl.classList.toggle('active', t === tab); }
        if (contentEl) { contentEl.hidden = t !== tab; }
    });
    if (tab === 'cal') {
        setTimeout(renderBroadCalendar, 0);
    }
}

function encodeCalendarModalPayload(value) {
    return encodeURIComponent(String(value || ''));
}

function decodeCalendarModalPayload(value) {
    try {
        return decodeURIComponent(String(value || ''));
    } catch (error) {
        return String(value || '');
    }
}

function bindCalendarDelegates(root) {
    if (!root || root.dataset.calendarDelegatesBound === '1') return;
    root.addEventListener('click', function onCalendarClick(event) {
        const tabTrigger = event.target.closest('[data-cal-tab]');
        if (tabTrigger) {
            event.preventDefault();
            switchCalendarTab(String(tabTrigger.getAttribute('data-cal-tab') || 'cal'));
            return;
        }
        const navTrigger = event.target.closest('[data-cal-nav]');
        if (navTrigger) {
            event.preventDefault();
            if (typeof window._calNav === 'function') {
                window._calNav(parseInt(navTrigger.getAttribute('data-cal-nav') || '0', 10) || 0);
            }
            return;
        }
        const modalTrigger = event.target.closest('[data-cal-modal-kind]');
        if (modalTrigger) {
            event.preventDefault();
            openModal(
                String(modalTrigger.getAttribute('data-cal-modal-kind') || ''),
                decodeCalendarModalPayload(modalTrigger.getAttribute('data-cal-modal-title')),
                decodeCalendarModalPayload(modalTrigger.getAttribute('data-cal-modal-body'))
            );
        }
    });
    root.dataset.calendarDelegatesBound = '1';
}

// --- CALENDAR PAGE RENDERER ---
function renderCalendarPage() {
    const root = document.getElementById('calendar-root');
    if (!root) return;
    bindCalendarDelegates(root);
    const role = getEffectiveUserRole();
    const isStudent = role === USER_ROLES.STUDENT;
    const isProf = role === USER_ROLES.PROFESSOR || role === USER_ROLES.TA;

    // Gather data from KIU_STATE
    const announcements = (KIU_STATE.announcements || []).slice(0, 12);
    const events = (KIU_STATE.events || []).slice(0, 20);
    const profList = getAllStaff('professors', getCurrentFaculty()).slice(0, 12);

    // Get current user's schedule if student
    let myClasses = [];
    if (isStudent) {
        const uid = getCurrentUserId();
        if (KIU_STATE.schedules && KIU_STATE.schedules[uid]) {
            myClasses = KIU_STATE.schedules[uid];
        }
    }

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const now = new Date();
    let viewYear = now.getFullYear();
    let viewMonth = now.getMonth();

    function renderCalendarMonth() {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
        const monthKey = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
        const calEvents = (KIU_STATE.calendarEvents && KIU_STATE.calendarEvents[monthKey]) || [];
        const today = new Date();
        const isCurrentMonth = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

        let html = `
        <div class="lux-calendar-board">
            <div class="lux-calendar-header">
                <button type="button" data-cal-nav="-1" class="lux-calendar-nav" aria-label="Previous month"><i class="fas fa-chevron-left"></i></button>
                <div class="lux-calendar-heading">
                    <div class="lux-calendar-title">${monthNames[viewMonth]} ${viewYear}</div>
                    <div class="lux-calendar-subtitle">Academic Calendar</div>
                </div>
                <button type="button" data-cal-nav="1" class="lux-calendar-nav" aria-label="Next month"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="lux-calendar-days">
                ${dayNames.map(d => `<div>${d}</div>`).join('')}
            </div>
            <div class="lux-calendar-grid">`;

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="lux-calendar-cell is-empty"></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = (d === today.getDate() && isCurrentMonth);
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dayEvts = calEvents.filter(e => e.date === dateStr);
            html += `<div class="lux-calendar-cell${isToday ? ' is-today' : ''}">
                <div class="lux-calendar-date">${d}</div>
                ${dayEvts.map(ev => {
                    const eventTitle = escapeHtml(String(ev?.title || 'Event'));
                    return `<div class="lux-calendar-event" title="${eventTitle}">${eventTitle}</div>`;
                }).join('')}
            </div>`;
        }

        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remaining; i++) {
            html += '<div class="lux-calendar-cell is-empty"></div>';
        }

        html += `</div></div>`;

        const grid = document.getElementById('cal-month-grid');
        if (grid) grid.innerHTML = html;
    }

    window._calNav = function(dir) {
        viewMonth += dir;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCalendarMonth();
    };

    window._calJumpYear = function(y) {
        viewYear = y;
        renderCalendarMonth();
    };

    const appointmentSlots = [
        { label: 'Tomorrow', value: '14:00', state: 'selected' },
        { label: 'Tomorrow', value: '14:30', state: 'available' },
        { label: 'Tomorrow', value: '15:00', state: 'available' },
        { label: 'Friday', value: 'Booked', state: 'booked' },
        { label: 'Friday', value: 'Booked', state: 'booked' }
    ];

    // Build professor office hours rows
    const officeHoursRows = profList.map(p => {
        const availSlots = ['Mon 10:00','Tue 14:00','Wed 11:00','Thu 15:00'];
        return `<tr>
            <td>${p.name}</td>
            <td class="calendar-table-meta">${p.faculty || 'All'}</td>
            <td class="calendar-table-meta">${availSlots.slice(0,2).join(', ')}</td>
            <td><button class="kiu-btn-outline calendar-action-btn">Book</button></td>
        </tr>`;
    }).join('');

    root.innerHTML = `
    <div class="lux-standalone-page">
        <div class="lux-page-shell">
            <div class="page-hero">
                <div class="page-hero-badge">Academic workspace</div>
                <h1 class="page-hero-title">Academic Calendar</h1>
                <p class="page-hero-copy">Follow the official academic calendar, announcements, events, and office hours from one organized workspace.</p>
                <div class="page-hero-meta">
                    <span class="page-hero-badge"><i class="far fa-calendar-alt"></i> Official calendar</span>
                    <span class="page-hero-badge"><i class="fas fa-bullhorn"></i> Announcements</span>
                    <span class="page-hero-badge"><i class="far fa-clock"></i> Office hours</span>
                </div>
            </div>

            <div class="tabs-container">
                <button type="button" class="tab active" role="tab" data-cal-tab="cal" id="cal-tab-cal"><i class="far fa-calendar-alt"></i> Calendar</button>
                <button type="button" class="tab" role="tab" data-cal-tab="announcements" id="cal-tab-announcements"><i class="fas fa-bullhorn"></i> Announcements</button>
                <button type="button" class="tab" role="tab" data-cal-tab="events" id="cal-tab-events"><i class="fas fa-list-ul"></i> Events</button>
                <button type="button" class="tab" role="tab" data-cal-tab="officehours" id="cal-tab-officehours"><i class="far fa-clock"></i> Office Hours</button>
            </div>

            <div id="cal-content-cal">
                ${isStudent && myClasses.length === 0 ? `<div class="content-box surface-card calendar-panel-card">
                <div class="calendar-panel-head">
                    <div>
                        <h3 class="calendar-panel-title">My Selected Classes</h3>
                        <p class="calendar-panel-copy">Your registered lectures and seminars appear here.</p>
                    </div>
                    <span class="calendar-panel-pill"><i class="fas fa-calendar-week"></i> Weekly Sync</span>
                </div>
                <div class="calendar-empty-state calendar-empty-state--lg">
                    <i class="fas fa-calendar-check calendar-empty-state-icon"></i>
                    <strong class="calendar-empty-state-heading">No classes yet</strong>
                    <span class="calendar-empty-state-copy">Registered classes will appear here automatically.</span>
                </div>
            </div>` : ''}
                <div id="cal-month-grid"></div>
            </div>

            <div id="cal-content-announcements" hidden>
                <div class="content-box">
                    <table class="kiu-table">
                        <thead><tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Date</th>
                            <th></th>
                        </tr></thead>
                    <tbody>
                        ${announcements.length ? announcements.map(a => `<tr>
                            <td>${a.id || '—'}</td>
                            <td>${a.title || 'Announcement'}</td>
                            <td class="calendar-table-meta">${a.date || '—'}</td>
                            <td><button type="button" class="kiu-btn-outline calendar-action-btn" data-cal-modal-kind="announcement" data-cal-modal-title="${encodeCalendarModalPayload(a.title||'')}" data-cal-modal-body="${encodeCalendarModalPayload(a.body||a.message||'No details.')}"><i class="fas fa-eye"></i></button></td>
                        </tr>`).join('') : `<tr><td colspan="4" class="calendar-empty-cell"><i class="fas fa-bullhorn calendar-empty-icon"></i><strong class="calendar-empty-title">No announcements</strong><span>Check back later for updates.</span></td></tr>`}
                    </tbody>
                    </table>
                </div>
            </div>

            <div id="cal-content-events" hidden>
                <div class="content-box">
                    <table class="kiu-table">
                        <thead><tr>
                            <th>ID</th>
                            <th>Event</th>
                            <th>Date</th>
                            <th></th>
                        </tr></thead>
                    <tbody>
                        ${events.length ? events.map(e => `<tr>
                            <td>${e.id || '—'}</td>
                            <td>${e.title || e.name || 'Event'}</td>
                            <td class="calendar-table-meta">${e.date || '—'}</td>
                            <td><button type="button" class="kiu-btn-outline calendar-action-btn" data-cal-modal-kind="event" data-cal-modal-title="${encodeCalendarModalPayload(e.title||e.name||'Event')}" data-cal-modal-body="${encodeCalendarModalPayload(e.description||e.body||'No details.')}"><i class="fas fa-eye"></i></button></td>
                        </tr>`).join('') : `<tr><td colspan="4" class="calendar-empty-cell"><i class="fas fa-calendar-day calendar-empty-icon"></i><strong class="calendar-empty-title">No events</strong><span>Campus events will appear here.</span></td></tr>`}
                    </tbody>
                    </table>
                </div>
            </div>

            <div id="cal-content-officehours" hidden>
            ${isProf ? `<div class="content-box surface-card calendar-panel-card calendar-office-panel">
                <div class="calendar-panel-head">
                    <div>
                        <h3 class="calendar-panel-title"><i class="fab fa-microsoft calendar-inline-icon-microsoft"></i> Outlook Integration</h3>
                        <p class="calendar-panel-copy">Sync your Outlook calendar to generate booking slots for students.</p>
                    </div>
                </div>
                <button class="kiu-btn-outline">Connect Outlook Calendar</button>
                <hr class="calendar-divider">
                <h4 class="calendar-section-title">Upcoming Appointments</h4>
                <div class="calendar-empty-state calendar-empty-state--md">
                    <i class="far fa-calendar-check calendar-empty-state-icon calendar-empty-state-icon--md"></i>
                    <strong class="calendar-empty-state-heading calendar-empty-state-heading--compact">No appointments scheduled</strong>
                </div>
            </div>` : ''}
            ${isStudent ? `<div class="content-box surface-card calendar-panel-card calendar-booking-panel">
                <div class="calendar-panel-head">
                    <div>
                        <h3 class="calendar-panel-title"><i class="far fa-calendar-check"></i> Book an Appointment</h3>
                        <p class="calendar-panel-copy">Select a professor and choose an available time slot.</p>
                    </div>
                </div>
                <div class="calendar-booking-form">
                <select class="calendar-select-control">
                    <option>Select Professor...</option>
                    ${profList.map(p => `<option>${p.name} — ${p.faculty || 'All'}</option>`).join('')}
                </select>
                <div class="calendar-slot-grid">
                    ${appointmentSlots.map(slot => `<div class="calendar-slot-card is-${slot.state}">
                        <span class="calendar-slot-label">${slot.label}</span>
                        <strong class="calendar-slot-value">${slot.value}</strong>
                    </div>`).join('')}
                </div>
                <textarea class="calendar-textarea-control" placeholder="Reason for meeting (optional)..."></textarea>
                <div class="calendar-booking-actions">
                    <button class="kiu-btn-blue calendar-confirm-btn"><i class="fas fa-calendar-plus"></i> Confirm Booking</button>
                </div>
                </div>
            </div>` : ''}
            <!-- All professors table -->
            <div class="content-box surface-card calendar-panel-card calendar-professors-panel">
                <h4 class="calendar-section-title">All Professors & Office Hours</h4>
                <table class="kiu-table">
                    <thead><tr>
                        <th>Professor</th>
                        <th>Faculty</th>
                        <th>Hours</th>
                        <th>Action</th>
                    </tr></thead>
                    <tbody>${officeHoursRows}</tbody>
                </table>
            </div>
            </div>
        </div>
    </div>`;

    // Initial render of calendar month
    renderCalendarMonth();
}

// --- MODALS ---
const INDEX_PROGRAM_OPTION_LABELS = [
    '34. Mathematics',
    '36. Computer Science',
    '37. Management',
    '44. Mathematics and AI Foundations',
    '45. Management 2025',
    '47. Computer Science',
    '53. Finance',
    '54. Psychology 2025',
    '56. Program Catalog',
    '59. Foreign Language Courses'
];

const INDEX_PROGRAM_COURSE_ROWS = [
    ['A (303)', 'I Module - Mandatory Subjects', '45/0', '', 'group'],
    ['1', 'Probability and Statistics Basics', '5', '[7024] Statistics Foundations'],
    ['2', 'Roman Law Basics', '5', ''],
    ['3', 'Management Foundations', '5', '[7027] Probability and Statistics Basics'],
    ['4', 'Sociology Foundations', '5', '']
];

const INDEX_SYLLABUS_FILE_ROWS = [
    'Introduction to Probability and Statistics_SYLLABUS_Chelidze.pdf',
    'INTRODUCTION TO PROBABILITY AND STATISTICS_Spring 2025.pdf',
    'Introduction to Probability and Statistics_Spring 2026.pdf'
];

function ensureModalOverlayBindings() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay || overlay.dataset.modalCloseBound === '1') return overlay;
    overlay.dataset.modalCloseBound = '1';
    overlay.addEventListener('click', closeAllModals);
    return overlay;
}

function setModalVisibility(modal, shown, displayValue = 'block') {
    if (!modal) return;
    modal.hidden = !shown;
    modal.style.display = shown ? displayValue : 'none';
}

function ensureModalScaffold(type) {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    const modalId = type === 'announcement' ? 'modal-announcement' : type === 'event' ? 'modal-event' : '';
    if (!modalId) return null;
    let modal = document.getElementById(modalId);
    if (!modal) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = type === 'announcement'
            ? `
                <div id="modal-announcement" class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-ann-title">Title</h3>
                        <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="modal-ann-body">Body</div>
                    <div class="modal-footer"><button type="button" class="kiu-btn-outline" data-modal-close="1">Close</button></div>
                </div>
            `
            : `
                <div id="modal-event" class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-evt-title">Title</h3>
                        <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="modal-evt-body">Body</div>
                    <div class="modal-footer"><button type="button" class="kiu-btn-outline" data-modal-close="1">Close</button></div>
                </div>
            `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function ensureSyllabusModal() {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    let modal = document.getElementById('modal-syllabus');
    if (!modal) {
        const fileRows = INDEX_SYLLABUS_FILE_ROWS.map((label, index) => `
            <div class="modal-helper-row${index < INDEX_SYLLABUS_FILE_ROWS.length - 1 ? ' modal-helper-row--divided' : ''}">
                <span>${label}</span>
                <button type="button" class="kiu-btn-blue" aria-label="Download syllabus file">
                    <i class="fas fa-cloud-download-alt" aria-hidden="true"></i>
                </button>
            </div>
        `).join('');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="modal-syllabus" class="modal-content modal-syllabus-shell">
                <div class="modal-header">
                    <h3>Syllabus</h3>
                    <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="modal-body modal-syllabus-body">
                    ${fileRows}
                </div>
            </div>
        `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function ensureProgramsModal() {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    let modal = document.getElementById('modal-programs');
    if (!modal) {
        const optionButtons = INDEX_PROGRAM_OPTION_LABELS
            .map((label) => `<button class="kiu-btn-outline modal-programs-option"${label === '56. Program Catalog' ? ' data-show-program-courses="1"' : ''}>${label}</button>`)
            .join('');
        const courseRows = INDEX_PROGRAM_COURSE_ROWS
            .map(([index, title, ects, prerequisite, tone]) => `
                <tr${tone === 'group' ? ' class="modal-programs-course-group"' : ''}>
                    <td>${index}</td>
                    <td class="modal-programs-title-cell">${title}</td>
                    <td${tone === 'group' ? ' class="modal-programs-ects"' : ''}>${ects}</td>
                    <td>${prerequisite}</td>
                </tr>
            `)
            .join('');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="modal-programs" class="modal-content modal-programs-shell">
                <div class="modal-header">
                    <h3>Educational Programs</h3>
                    <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="modal-body modal-programs-body">
                    <div class="modal-surface-card modal-programs-card">
                        <h4 class="modal-programs-title">Select Program</h4>
                        <div class="modal-programs-list">${optionButtons}</div>
                    </div>
                    <div id="modal-program-courses" class="modal-surface-card">
                        <table class="kiu-table modal-programs-table">
                            <thead>
                                <tr><th>N</th><th class="modal-programs-heading-start">Subject Title / Module Title</th><th>ECTS</th><th>Prerequisite / Anti-requisite</th></tr>
                            </thead>
                            <tbody>${courseRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="kiu-btn-blue" data-modal-close="1">Close</button></div>
            </div>
        `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function ensureIndexProgramsPage() {
    const appContent = document.getElementById('app-content');
    if (!appContent) return null;
    let page = document.getElementById('page-programs');
    if (!page) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="page-programs" class="page-section">
                <div class="page-hero lux-program-hero">
                    <div class="page-hero-title">Programs</div>
                    <div class="page-hero-copy">Browse programs, modules, and prerequisites.</div>
                    <div class="page-hero-meta">
                        <span class="page-hero-badge"><i class="fas fa-layer-group"></i> Programs &amp; Modules</span>
                        <span class="page-hero-badge"><i class="fas fa-filter"></i> Faculty filter</span>
                        <span class="page-hero-badge"><i class="fas fa-cloud-download-alt"></i> Syllabus access</span>
                    </div>
                </div>
                <div class="filter-shell lux-program-filter-shell">
                    <div class="filter-shell-title">Program Scope</div>
                    <div class="lux-program-filter-row">
                        <div class="lux-status-pill"><i class="fas fa-graduation-cap"></i> Synced with registration</div>
                        <div class="lux-program-filter-note">Filter by semester to narrow results.</div>
                    </div>
                </div>
                <div class="content-box surface-card lux-program-stage">
                    <div id="student-educational-program-root"></div>
                </div>
            </div>
        `;
        page = wrapper.firstElementChild;
        if (page) appContent.appendChild(page);
    }
    return page;
}

function openModal(type, title, body) {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return;
    if (type === 'programs') ensureProgramsModal();
    document.querySelectorAll('#modal-overlay .modal-content').forEach((el) => setModalVisibility(el, false));
    let opened = false;

    if (type === 'announcement') {
        ensureModalScaffold('announcement');
        document.getElementById('modal-ann-title').innerText = title;
        document.getElementById('modal-ann-body').innerText = body;
        setModalVisibility(document.getElementById('modal-announcement'), true, 'block');
        opened = true;
    } else if (type === 'event') {
        ensureModalScaffold('event');
        document.getElementById('modal-evt-title').innerText = title;
        document.getElementById('modal-evt-body').innerText = body;
        setModalVisibility(document.getElementById('modal-event'), true, 'block');
        opened = true;
    } else if (type === 'syllabus') {
        const modal = ensureSyllabusModal();
        if (modal) {
            setModalVisibility(modal, true, 'block');
            opened = true;
        }
    } else if (type === 'programs') {
        setModalVisibility(document.getElementById('modal-program-courses'), false);
        setModalVisibility(document.getElementById('modal-programs'), true, 'flex');
        opened = true;
    }

    if (!opened) return;
    overlay.hidden = false;
    overlay.classList.add('active');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
}

function closeAllModals(event) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const target = event && event.target ? event.target : null;
    const isOverlayClick = target === overlay;
    const closeTrigger = target && typeof target.closest === 'function'
        ? target.closest('[data-modal-close]')
        : null;
    const shouldClose = !target || isOverlayClick || Boolean(closeTrigger);

    if (!shouldClose) return;

    overlay.classList.remove('active');
    overlay.hidden = true;
    document.querySelectorAll('#modal-overlay .modal-content').forEach((el) => setModalVisibility(el, false));
}

function showProgramCourses() {
    ensureProgramsModal();
    setModalVisibility(document.getElementById('modal-program-courses'), true, 'block');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
}

if (!window.__kiuModalActionDelegatesBound) {
    window.__kiuModalActionDelegatesBound = true;
    document.addEventListener('click', (event) => {
        if (event.target.id === 'modal-overlay') {
            closeAllModals(event);
            return;
        }
        if (event.target.closest('[data-modal-close]')) {
            closeAllModals(event);
            return;
        }
        if (event.target.closest('[data-show-program-courses]')) {
            showProgramCourses();
        }
    });
}

window.ensureProgramsModal = ensureProgramsModal;
window.ensureSyllabusModal = ensureSyllabusModal;
window.ensureIndexProgramsPage = ensureIndexProgramsPage;

function calculateMatrix() {
    const inputs = document.querySelectorAll('.matrix-input');
    let total = 0;
    inputs.forEach(inp => total += Number(inp.value));
    
    const display = document.getElementById('matrix-total-display');
    const btn = document.getElementById('matrix-publish-btn');
    
    display.innerText = `${total} / 100`;
    
    if (total !== 100) {
        display.dataset.matrixStatus = 'invalid';
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
        btn.innerText = 'Errors Detected (Must = 100)';
    } else {
        delete display.dataset.matrixStatus;
        btn.disabled = false;
        btn.setAttribute('aria-disabled', 'false');
        btn.innerHTML = '<i class="fas fa-satellite-dish"></i> Publish Syllabus Formula';
    }
}

function openBatchComm(studentName) {
    const title = studentName === 'all' ? 'Mass Batch Communication' : `Message to ${studentName}`;
    const body = `Dear ${studentName === 'all' ? 'Students' : studentName},\n\nBased on your current academic indicators, we need to speak during my next office hours to get back on track.`;
    
    // We can reuse the announcement modal but prefill an editable textarea
    const modalBody = `
        <textarea class="modal-inline-textarea">${body}</textarea>
        <button class="kiu-btn-blue modal-inline-close" type="button" data-modal-close="1">Close Draft</button>
    `;
    openModal('announcement', title, modalBody);
    
    // Overwrite the inner HTML completely
    document.getElementById('modal-ann-body').innerHTML = modalBody;
}


