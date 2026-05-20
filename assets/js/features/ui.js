/* Shared UI interactions extracted from core.js. Source of truth remains root core.js compatibility bundle. */

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
        if (contentEl) { contentEl.style.display = (t === tab) ? 'block' : 'none'; }
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
        <div style="background:var(--kiu-white); border-radius:16px; border:1px solid var(--kiu-border); overflow:hidden; box-shadow:var(--kiu-shadow-sm);">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; background:var(--kiu-gradient-blue); color:white;">
                <button type="button" data-cal-nav="-1" style="background:rgba(255,255,255,0.2); border:none; color:white; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:16px;"><i class="fas fa-chevron-left"></i></button>
                <div style="text-align:center;">
                    <div style="font-size:18px; font-weight:700;">${monthNames[viewMonth]} ${viewYear}</div>
                    <div style="font-size:11px; opacity:0.8;">Academic Calendar</div>
                </div>
                <button type="button" data-cal-nav="1" style="background:rgba(255,255,255,0.2); border:none; color:white; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:16px;"><i class="fas fa-chevron-right"></i></button>
            </div>
            <!-- Day headers -->
            <div style="display:grid; grid-template-columns:repeat(7,1fr); background:#f8f9fa; border-bottom:1px solid var(--kiu-border);">
                ${dayNames.map(d => `<div style="text-align:center; padding:8px; font-size:11px; font-weight:700; color:var(--kiu-text-muted);">${d}</div>`).join('')}
            </div>
            <!-- Days grid -->
            <div style="display:grid; grid-template-columns:repeat(7,1fr);">`;

        for (let i = 0; i < firstDay; i++) {
            html += `<div style="padding:8px; min-height:80px; background:#fafafa; border:1px solid #f0f0f0;"></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = (d === today.getDate() && isCurrentMonth);
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dayEvts = calEvents.filter(e => e.date === dateStr);
            html += `<div style="padding:6px 8px; min-height:80px; border:1px solid #f0f0f0; background:${isToday ? '#eff6ff' : 'white'}; vertical-align:top;">
                <div style="font-size:13px; font-weight:700; color:${isToday ? 'var(--kiu-blue)' : 'var(--kiu-text-main)'}; ${isToday ? 'background:var(--kiu-blue); color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center;' : ''}">${d}</div>
                ${dayEvts.map(ev => `<div style="margin-top:3px; padding:2px 5px; background:${ev.color||'#dbeafe'}; color:${ev.textColor||'#1e40af'}; border-radius:4px; font-size:10px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${ev.title}">${ev.title}</div>`).join('')}
            </div>`;
        }

        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remaining; i++) {
            html += `<div style="padding:8px; min-height:80px; background:#fafafa; border:1px solid #f0f0f0;"></div>`;
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

    // Build professor office hours rows
    const officeHoursRows = profList.map(p => {
        const availSlots = ['Mon 10:00','Tue 14:00','Wed 11:00','Thu 15:00'];
        return `<tr>
            <td style="text-align:left; font-weight:600;">${p.name}</td>
            <td style="font-size:11px; color:var(--kiu-text-muted);">${p.faculty || 'All'}</td>
            <td style="font-size:11px;">${availSlots.slice(0,2).join(', ')}</td>
            <td><button class="kiu-btn-outline" style="padding:4px 10px; font-size:11px;">Book</button></td>
        </tr>`;
    }).join('');

    root.innerHTML = `
    <div style="max-width:1280px; margin:0 auto; padding:24px;">
        <!-- Hero -->
        <div style="position:relative; overflow:hidden; border-radius:24px; padding:28px 30px; background:linear-gradient(135deg,rgba(7,17,29,.98) 0%,rgba(15,23,42,.98) 50%,rgba(29,78,216,.95) 100%); color:#fff; box-shadow:0 24px 60px rgba(15,23,42,.22); margin-bottom:24px;">
            <div style="position:relative; z-index:1;">
                <div style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(226,232,240,.6); font-weight:800;">Academic workspace</div>
                <h1 style="font-family:'Playfair Display',Georgia,serif; font-size:32px; font-weight:600; margin:10px 0 8px; letter-spacing:-0.02em;">Academic Calendar</h1>
                <p style="font-size:14px; line-height:1.6; color:rgba(226,232,240,.85); max-width:600px; margin:0 0 14px;">Follow the official academic calendar, announcements, events, and office hours from one organized workspace.</p>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.16); border-radius:999px; font-size:12px; font-weight:600; color:rgba(226,232,240,.8);"><i class="far fa-calendar-alt"></i> Official calendar</span>
                    <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.16); border-radius:999px; font-size:12px; font-weight:600; color:rgba(226,232,240,.8);"><i class="fas fa-bullhorn"></i> Announcements</span>
                    <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.16); border-radius:999px; font-size:12px; font-weight:600; color:rgba(226,232,240,.8);"><i class="far fa-clock"></i> Office hours</span>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div style="display:flex; gap:8px; margin-bottom:24px; overflow-x:auto; padding-bottom:4px;">
            <button type="button" class="cal-tab active" role="tab" data-cal-tab="cal" id="cal-tab-cal"><i class="far fa-calendar-alt"></i> Calendar</button>
            <button type="button" class="cal-tab" role="tab" data-cal-tab="announcements" id="cal-tab-announcements"><i class="fas fa-bullhorn"></i> Announcements</button>
            <button type="button" class="cal-tab" role="tab" data-cal-tab="events" id="cal-tab-events"><i class="fas fa-list-ul"></i> Events</button>
            <button type="button" class="cal-tab" role="tab" data-cal-tab="officehours" id="cal-tab-officehours"><i class="far fa-clock"></i> Office Hours</button>
        </div>

        <!-- Tab: Calendar -->
        <div id="cal-content-cal">
            ${isStudent && myClasses.length === 0 ? `<div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:var(--kiu-shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                    <div><h3 style="font-size:16px; font-weight:700; color:var(--kiu-text-main); margin:0 0 4px;">My Selected Classes</h3>
                    <p style="font-size:12px; color:var(--kiu-text-muted); margin:0;">Your registered lectures and seminars appear here.</p></div>
                    <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:999px; font-size:12px; font-weight:600; color:var(--kiu-text-muted);"><i class="fas fa-calendar-week"></i> Weekly Sync</span>
                </div>
                <div style="text-align:center; padding:40px 20px; color:var(--kiu-text-muted);">
                    <i class="fas fa-calendar-check" style="font-size:36px; opacity:0.25; display:block; margin-bottom:12px;"></i>
                    <strong style="display:block; font-size:15px; font-weight:700; color:var(--kiu-text-secondary); margin-bottom:4px;">No classes yet</strong>
                    <span style="font-size:12px;">Registered classes will appear here automatically.</span>
                </div>
            </div>` : ''}
            <div id="cal-month-grid"></div>
        </div>

        <!-- Tab: Announcements -->
        <div id="cal-content-announcements" style="display:none;">
            <div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:var(--kiu-shadow-sm);">
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead><tr style="background:#f8f9fa; color:var(--kiu-text-muted); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.4px;">
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">ID</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Title</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Date</th>
                        <th style="width:44px; padding:11px 14px; border-bottom:1px solid var(--kiu-border);"></th>
                    </tr></thead>
                    <tbody>
                        ${announcements.length ? announcements.map(a => `<tr style="border-bottom:1px solid #ece6dd;">
                            <td style="padding:11px 14px; color:var(--kiu-text-main);">${a.id || '—'}</td>
                            <td style="padding:11px 14px; color:var(--kiu-text-main);">${a.title || 'Announcement'}</td>
                            <td style="padding:11px 14px; color:var(--kiu-text-muted); font-size:12px;">${a.date || '—'}</td>
                            <td style="padding:11px 14px;"><button type="button" class="kiu-btn-outline" data-cal-modal-kind="announcement" data-cal-modal-title="${encodeCalendarModalPayload(a.title||'')}" data-cal-modal-body="${encodeCalendarModalPayload(a.body||a.message||'No details.')}" style="padding:4px 10px; font-size:11px; border-radius:6px;"><i class="fas fa-eye"></i></button></td>
                        </tr>`).join('') : `<tr><td colspan="4" style="padding:40px; text-align:center; color:var(--kiu-text-muted);"><i class="fas fa-bullhorn" style="font-size:28px; opacity:0.2; display:block; margin-bottom:8px;"></i><strong style="display:block; color:var(--kiu-text-secondary);">No announcements</strong><span style="font-size:12px;">Check back later for updates.</span></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab: Events -->
        <div id="cal-content-events" style="display:none;">
            <div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:var(--kiu-shadow-sm);">
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead><tr style="background:#f8f9fa; color:var(--kiu-text-muted); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.4px;">
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">ID</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Event</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Date</th>
                        <th style="width:44px; padding:11px 14px; border-bottom:1px solid var(--kiu-border);"></th>
                    </tr></thead>
                    <tbody>
                        ${events.length ? events.map(e => `<tr style="border-bottom:1px solid #ece6dd;">
                            <td style="padding:11px 14px; color:var(--kiu-text-main);">${e.id || '—'}</td>
                            <td style="padding:11px 14px; color:var(--kiu-text-main);">${e.title || e.name || 'Event'}</td>
                            <td style="padding:11px 14px; color:var(--kiu-text-muted); font-size:12px;">${e.date || '—'}</td>
                            <td style="padding:11px 14px;"><button type="button" class="kiu-btn-outline" data-cal-modal-kind="event" data-cal-modal-title="${encodeCalendarModalPayload(e.title||e.name||'Event')}" data-cal-modal-body="${encodeCalendarModalPayload(e.description||e.body||'No details.')}" style="padding:4px 10px; font-size:11px; border-radius:6px;"><i class="fas fa-eye"></i></button></td>
                        </tr>`).join('') : `<tr><td colspan="4" style="padding:40px; text-align:center; color:var(--kiu-text-muted);"><i class="fas fa-calendar-day" style="font-size:28px; opacity:0.2; display:block; margin-bottom:8px;"></i><strong style="display:block; color:var(--kiu-text-secondary);">No events</strong><span style="font-size:12px;">Campus events will appear here.</span></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab: Office Hours -->
        <div id="cal-content-officehours" style="display:none;">
            ${isProf ? `<div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:var(--kiu-shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                    <div><h3 style="font-size:16px; font-weight:700; color:var(--kiu-text-main); margin:0 0 4px;"><i class="fab fa-microsoft" style="color:#00a4ef;"></i> Outlook Integration</h3>
                    <p style="font-size:12px; color:var(--kiu-text-muted); margin:0;">Sync your Outlook calendar to generate booking slots for students.</p></div>
                </div>
                <button class="kiu-btn-outline">Connect Outlook Calendar</button>
                <hr style="border:none; border-top:1px solid var(--kiu-border); margin:20px 0;">
                <h4 style="margin:0 0 12px; font-size:14px; font-weight:700; color:var(--kiu-text-main);">Upcoming Appointments</h4>
                <div style="text-align:center; padding:32px 20px; color:var(--kiu-text-muted);">
                    <i class="far fa-calendar-check" style="font-size:32px; opacity:0.2; display:block; margin-bottom:8px;"></i>
                    <strong style="display:block; color:var(--kiu-text-secondary);">No appointments scheduled</strong>
                </div>
            </div>` : ''}
            ${isStudent ? `<div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:var(--kiu-shadow-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
                    <div><h3 style="font-size:16px; font-weight:700; color:var(--kiu-text-main); margin:0 0 4px;"><i class="far fa-calendar-check"></i> Book an Appointment</h3>
                    <p style="font-size:12px; color:var(--kiu-text-muted); margin:0;">Select a professor and choose an available time slot.</p></div>
                </div>
                <select style="width:100%; max-width:320px; padding:10px 14px; background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:8px; font-size:13px; font-family:inherit; color:var(--kiu-text-main); outline:none; margin-bottom:16px;">
                    <option>Select Professor...</option>
                    ${profList.map(p => `<option>${p.name} — ${p.faculty || 'All'}</option>`).join('')}
                </select>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px; margin-bottom:16px; max-width:500px;">
                    <div style="padding:10px; text-align:center; border:1px solid var(--cal-accent,var(--kiu-blue)); border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; background:rgba(10,132,255,0.08); color:var(--kiu-blue);">Tomorrow<br><strong>14:00</strong></div>
                    <div style="padding:10px; text-align:center; border:1px solid var(--kiu-border); border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; color:var(--kiu-text-secondary); background:var(--kiu-white);">Tomorrow<br><strong>14:30</strong></div>
                    <div style="padding:10px; text-align:center; border:1px solid var(--kiu-border); border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; color:var(--kiu-text-secondary); background:var(--kiu-white);">Tomorrow<br><strong>15:00</strong></div>
                    <div style="padding:10px; text-align:center; border:1px dashed var(--kiu-border); border-radius:8px; cursor:not-allowed; font-size:12px; font-weight:600; color:var(--kiu-text-muted); background:#f8f9fa;">Friday<br><strong>Booked</strong></div>
                    <div style="padding:10px; text-align:center; border:1px dashed var(--kiu-border); border-radius:8px; cursor:not-allowed; font-size:12px; font-weight:600; color:var(--kiu-text-muted); background:#f8f9fa;">Friday<br><strong>Booked</strong></div>
                </div>
                <textarea placeholder="Reason for meeting (optional)..." style="width:100%; max-width:500px; padding:10px 14px; background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:8px; font-size:13px; font-family:inherit; color:var(--kiu-text-main); outline:none; resize:vertical; min-height:60px; margin-bottom:16px;"></textarea>
                <br><button class="kiu-btn-blue" style="padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700;"><i class="fas fa-calendar-plus"></i> Confirm Booking</button>
            </div>` : ''}
            <!-- All professors table -->
            <div style="background:var(--kiu-white); border:1px solid var(--kiu-border); border-radius:16px; padding:20px; box-shadow:var(--kiu-shadow-sm);">
                <h4 style="margin:0 0 12px; font-size:14px; font-weight:700; color:var(--kiu-text-main);">All Professors & Office Hours</h4>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead><tr style="background:#f8f9fa; color:var(--kiu-text-muted); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.4px;">
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Professor</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Faculty</th>
                        <th style="text-align:left; padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Hours</th>
                        <th style="padding:11px 14px; border-bottom:1px solid var(--kiu-border);">Action</th>
                    </tr></thead>
                    <tbody>${officeHoursRows}</tbody>
                </table>
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
            modal.style.display = 'none';
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
            <div style="padding: 15px;${index < INDEX_SYLLABUS_FILE_ROWS.length - 1 ? ' border-bottom: 1px solid var(--kiu-border);' : ''} display: flex; justify-content: space-between; align-items: center;">
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
                <div class="modal-body modal-syllabus-body" style="padding: 0;">
                    ${fileRows}
                </div>
            </div>
        `;
        modal = wrapper.firstElementChild;
        if (modal) {
            modal.style.display = 'none';
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
                                <tr><th>N</th><th style="text-align:left;">Subject Title / Module Title</th><th>ECTS</th><th>Prerequisite / Anti-requisite</th></tr>
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
            modal.style.display = 'none';
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
    document.querySelectorAll('#modal-overlay .modal-content').forEach(el => el.style.display = 'none');
    let opened = false;

    if (type === 'announcement') {
        ensureModalScaffold('announcement');
        document.getElementById('modal-ann-title').innerText = title;
        document.getElementById('modal-ann-body').innerText = body;
        document.getElementById('modal-announcement').style.display = 'block';
        opened = true;
    } else if (type === 'event') {
        ensureModalScaffold('event');
        document.getElementById('modal-evt-title').innerText = title;
        document.getElementById('modal-evt-body').innerText = body;
        document.getElementById('modal-event').style.display = 'block';
        opened = true;
    } else if (type === 'syllabus') {
        const modal = ensureSyllabusModal();
        if (modal) {
            modal.style.display = 'block';
            opened = true;
        }
    } else if (type === 'programs') {
        document.getElementById('modal-program-courses').style.display = 'none';
        document.getElementById('modal-programs').style.display = 'flex';
        opened = true;
    }

    if (!opened) return;
    overlay.style.display = 'flex';
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
    overlay.style.display = 'none';
    document.querySelectorAll('#modal-overlay .modal-content').forEach(el => el.style.display = 'none');
}

function showProgramCourses() {
    ensureProgramsModal();
    document.getElementById('modal-program-courses').style.display = 'block';
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
        display.style.color = 'var(--kiu-red)';
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
        btn.innerText = 'Errors Detected (Must = 100)';
    } else {
        display.style.color = 'var(--kiu-green)';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        btn.innerHTML = '<i class="fas fa-satellite-dish"></i> Publish Syllabus Formula';
    }
}

function openBatchComm(studentName) {
    const title = studentName === 'all' ? 'Mass Batch Communication' : `Message to ${studentName}`;
    const body = `Dear ${studentName === 'all' ? 'Students' : studentName},\n\nBased on your current academic indicators, we need to speak during my next office hours to get back on track.`;
    
    // We can reuse the announcement modal but prefill an editable textarea
    const modalBody = `
        <textarea style="width: 100%; height: 120px; padding: 10px; border: 1px solid var(--kiu-border); border-radius: 4px; outline: none; resize: none; font-family: inherit;">${body}</textarea>
        <button class="kiu-btn-blue modal-inline-close" type="button" data-modal-close="1">Close Draft</button>
    `;
    openModal('announcement', title, modalBody);
    
    // Overwrite the inner HTML completely
    document.getElementById('modal-ann-body').innerHTML = modalBody;
}


