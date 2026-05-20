(function () {
    if (window.__kiuLuxuryIndexInitialized) return;
    window.__kiuLuxuryIndexInitialized = true;

    const ROLE_LABELS = { student: 'Student Portal', professor: 'Professor View', ta: 'TA View', admin: 'Admin View', student_service: 'Student Service View' };

    const PAGE_LABELS = {
        home: 'Dashboard', lms: 'LMS', news: 'News', social: 'Social', profile: 'Profile', 'personal-data': 'Personal Data', chancellery: 'E-Chancellery',
        'student-service': 'Student Service', 'career-market': 'AI Career Analyst', programs: 'Programs', 'study-card': 'Study Card', registration: 'Registration',
        library: 'Library', orders: 'Orders', 'admin-library': 'Library', 'admin-orders': 'Orders', 'admin-tools': 'Admin Tools', 'faculty-schedule': 'Schedule',
        'faculty-gradebook': 'Gradebook & Assessment', timetable: 'My Schedule', exams: 'Exams', 'admin-scheduler': 'Scheduler', staff: 'Staff', 'students-admin': 'Students',
        'profile-view': 'Profile', gradebook: 'Gradebook'
    };

    const PAGE_FAMILIES = {
        home: 'home', lms: 'academic', 'personal-data': 'academic', programs: 'academic', 'study-card': 'academic', registration: 'academic', library: 'academic', orders: 'academic',
        news: 'support', chancellery: 'support', 'student-service': 'support', 'career-market': 'support', social: 'social', 'faculty-schedule': 'faculty',
        'faculty-gradebook': 'faculty', timetable: 'faculty', exams: 'faculty', 'admin-scheduler': 'admin', 'admin-library': 'admin', 'admin-orders': 'admin',
        'admin-tools': 'admin', staff: 'admin', 'students-admin': 'admin', profile: 'utility', 'profile-view': 'utility', gradebook: 'utility'
    };

    const NAV_BY_ROLE = {
        student: [{ group: 'Core', items: [['home', 'Dashboard', 'fas fa-th-large'], ['lms', 'LMS', 'fas fa-book-reader'], ['timetable', 'Timetable', 'fas fa-chalkboard'], ['registration', 'Registration', 'fas fa-check-square']] }, { group: 'Records', items: [['programs', 'Programs', 'fas fa-file-signature'], ['study-card', 'Study Card', 'far fa-address-card'], ['personal-data', 'Personal Data', 'far fa-user'], ['profile-view', 'Profile', 'fas fa-user-circle']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['career-market', 'AI Career Analyst', 'fas fa-compass'], ['chancellery', 'E-Chancellery', 'fas fa-desktop'], ['student-service', 'Student Service', 'fas fa-headset'], ['library', 'Library', 'fas fa-book'], ['social', 'Social', 'fas fa-comments']] }],
        professor: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'Appeals', 'fas fa-inbox'], ['profile-view', 'Profile', 'fas fa-user-circle']] }],
        ta: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'Appeals', 'fas fa-inbox'], ['profile-view', 'Profile', 'fas fa-user-circle']] }],
        admin: [{ group: 'Control', items: [['home', 'Dashboard', 'fas fa-hammer'], ['admin-tools', 'Admin Tools', 'fas fa-layer-group'], ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']] }, { group: 'Systems', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group'], ['profile-view', 'Profile', 'fas fa-user-circle']] }],
        student_service: [{ group: 'Service', items: [['home', 'Dashboard', 'fas fa-th-large'], ['student-service', 'Inbox', 'fas fa-inbox'], ['orders', 'Orders', 'fas fa-book-open'], ['library', 'Library', 'fas fa-book']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['social', 'Social', 'fas fa-comments'], ['profile-view', 'Profile', 'fas fa-user-circle']] }]
    };

    const HOME_CONTENT = {
        student: {
            kicker: 'Welcome back', title: 'Your academic dashboard', copy: 'Access your courses, schedule, and registration in one place.', pulseTitle: '03 priority moves',
            pulseCopy: 'Registration, advisor feedback, and a finance task for today.', pulseRows: [['Next class', '09:00 Microeconomics'], ['Registration', 'Open until April 10'], ['Unread', '5 LMS updates']],
            continuityTitle: 'Quick Overview', continuityCopy: 'Key information at a glance.', continuityRows: [['Buttons', 'Primary / secondary / ghost'], ['Cards', 'Dashboard, table, queue'], ['Tables', 'Module, grade, service']],
            quick: [['lms', 'LMS', 'fas fa-book-reader', 'Assignments, subjects, quizzes, and classroom flow.'], ['timetable', 'Timetable', 'fas fa-chalkboard', 'Daily teaching rhythm, rooms, and timing.'], ['registration', 'Academic Registration', 'fas fa-check-square', 'Programs, minors, and free-credit logic.'], ['study-card', 'Study Card', 'far fa-address-card', 'Credits, transcript readiness, and status.'], ['student-service', 'Student Service', 'fas fa-headset', 'Support tickets and support.'], ['social', 'Social', 'fas fa-comments', 'Campus conversation and community updates.']],
            actions: [['lms', 'Open LMS'], ['registration', 'Review Registration']], alert: { tone: 'default', icon: 'fas fa-credit-card', title: 'Finance hold still needs attention', copy: 'Pay the balance or request a review to continue.', actionLabel: 'Resolve now', actionPage: 'registration' },
            overviewTitle: 'Priority Actions', overviewRows: [['fas fa-credit-card', 'Resolve tuition hold', 'Pay balance or request a review.'], ['fas fa-check-square', 'Finalize registration', 'Confirm selections before deadline.'], ['fas fa-comments', 'Answer advisor note', 'New advisor feedback on your plan.']],
            notesTitle: 'Getting Started', notesRows: [['fas fa-check-square', 'Check registration', 'Review your course selections before the deadline.'], ['fas fa-book-reader', 'Explore LMS', 'Access lecture materials, assignments, and grades.'], ['fas fa-comments', 'Stay connected', 'Use Social to join study groups and campus events.']],
            ledgerTitle: 'Module Ledger', ledgerRows: [['Microeconomics', 'Core module / Business', 'Live'], ['Marketing Fundamentals', 'Core module / Business', 'Ready'], ['Business Statistics', 'Core module / Business', 'Pending']]
        },
        professor: {
            kicker: 'Faculty Dashboard', title: 'Your teaching dashboard', copy: 'Manage courses, grading, and exams from one place.', pulseTitle: '04 active sessions',
            pulseCopy: 'Active lectures, exams, and grading tasks for today.', pulseRows: [['First lecture', '09:00 Corporate Finance'], ['Unmarked work', '18 submissions'], ['Office hours', 'Today / 15:00']],
            continuityTitle: 'Quick Overview', continuityCopy: 'Faculty-focused tools and information.', continuityRows: [['Schedule', 'Teaching-first'], ['Assessment', 'Gradebook cards'], ['Communication', 'Appeals and notices']],
            quick: [['lms', 'LMS', 'fas fa-book-reader', 'Course delivery, gradebooks, and assessment flow.'], ['timetable', 'Schedule', 'fas fa-calendar-week', 'Teaching blocks, rooms, and office hours.'], ['exams', 'Exams', 'fas fa-file-signature', 'Question banks, digital quizzes, and publishing.'], ['programs', 'Programs', 'fas fa-layer-group', 'Faculty curriculum library, modules, and ECTS map.'], ['chancellery', 'Appeals', 'fas fa-inbox', 'Faculty communication and requests.']],
            actions: [['timetable', 'Open Schedule'], ['exams', 'Launch Exams']], alert: { tone: 'blue', icon: 'fas fa-file-signature', title: 'Exam package review is active', copy: 'Question banks and publication status need one more pass before release.', actionLabel: 'Open exams', actionPage: 'exams' },
            overviewTitle: 'Faculty Signals', overviewRows: [['fas fa-book-reader', 'Sync gradebook before noon', 'Two sections need grade updates.'], ['fas fa-file-signature', 'Finish digital exam package', 'Question banks need completion.'], ['fas fa-comments', 'Reply to student appeals', 'New messages need a reply.']],
            notesTitle: 'Teaching Notes', notesRows: [['fas fa-chalkboard-teacher', 'Sync gradebook', 'Keep grades up to date for student visibility.'], ['fas fa-clipboard-check', 'Exam preparation', 'Review question banks before publishing.'], ['fas fa-clock', 'Office hours', 'Students can see your availability on the schedule.']],
            ledgerTitle: 'Course Ledger', ledgerRows: [['Corporate Finance', 'Lecture / G1', 'Live'], ['Research Methods', 'Seminar / G2', 'Ready'], ['Accounting Studio', 'Workshop / G1', 'Pending']]
        },
        ta: {
            kicker: 'Teaching Support', title: 'Your support dashboard', copy: 'Labs, attendance, and section support tools.', pulseTitle: '02 follow-ups',
            pulseCopy: 'Attendance and forum tasks before the afternoon lab.', pulseRows: [['Next lab', '13:00 Data Structures'], ['Open issues', '2 roster mismatches'], ['Forum', '7 replies pending']],
            continuityTitle: 'Quick Overview', continuityCopy: 'Support-focused tools at a glance.', continuityRows: [['Focus', 'Section support'], ['Cards', 'Attendance and labs'], ['Actions', 'Fast follow-up']],
            quick: [['lms', 'LMS Sections', 'fas fa-book-reader', 'Labs, forums, and support materials.'], ['timetable', 'Schedule', 'fas fa-calendar-week', 'Section timing, syncs, and lab blocks.'], ['programs', 'Programs', 'fas fa-layer-group', 'Browse curriculum modules and prerequisites.'], ['social', 'Social', 'fas fa-comments', 'Coordination with students and faculty.'], ['library', 'Library', 'fas fa-book', 'Reference and reserve materials.']],
            actions: [['lms', 'Open LMS'], ['timetable', 'Check schedule']], alert: { tone: 'green', icon: 'fas fa-user-check', title: 'Two section issues need follow-up', copy: 'Attendance and roster sync should be cleared before the next support block.', actionLabel: 'Review sections', actionPage: 'timetable' },
            overviewTitle: 'Support Signals', overviewRows: [['fas fa-user-check', 'Fix roster mismatch', 'Two students have roster mismatches.'], ['fas fa-flask', 'Prepare lab materials', 'Upload files and verify equipment.'], ['fas fa-comment-dots', 'Reply on discussion board', 'Unanswered questions in the forum.']],
            notesTitle: 'Support Notes', notesRows: [['fas fa-users-cog', 'Section support', 'Track attendance and roster changes for your sections.'], ['fas fa-stopwatch', 'Lab preparation', 'Upload materials and verify equipment before sessions.'], ['fas fa-comment-dots', 'Forum moderation', 'Stay on top of student questions in course forums.']],
            ledgerTitle: 'Section Ledger', ledgerRows: [['Data Structures Lab', 'Lab section / CS', 'Live'], ['Algorithms Support', 'Help session / CS', 'Ready'], ['Forum Moderation', 'Student support / LMS', 'Pending']]
        },
        admin: {
            kicker: 'Administration', title: 'University operations dashboard', copy: 'Manage curriculum, scheduling, staff, and student records.', pulseTitle: '12 pending approvals',
            pulseCopy: 'Curriculum, registration, and staffing items for today.', pulseRows: [['Top issue', 'Law module conflict'], ['Scheduler', '4 rooms overbooked'], ['Exams', '4 banks unpublished']],
            continuityTitle: 'Quick Overview', continuityCopy: 'Administrative tools and status overview.', continuityRows: [['Tables', 'Curriculum and staff'], ['Filters', 'Faculty and role'], ['States', 'Publish, hold, review']],
            quick: [['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus', 'Master scheduling, rooms, and cohort flow.'], ['staff', 'Staff', 'fas fa-users-cog', 'Provisioning, records, and faculty management.'], ['students-admin', 'Students', 'fas fa-user-graduate', 'Student administration and lookup.'], ['exams', 'Exams', 'fas fa-file-signature', 'Digital assessments and faculty quiz control.'], ['programs', 'Programs', 'fas fa-layer-group', 'Browse faculty curriculum library and module map.'], ['social', 'Social', 'fas fa-comments', 'Announcements and community space.'], ['orders', 'Orders', 'fas fa-book-open', 'Request queues and approvals.']],
            actions: [['admin-scheduler', 'Open scheduler'], ['staff', 'Manage staff']], alert: { tone: 'blue', icon: 'fas fa-layer-group', title: 'Approval queue is building up', copy: 'Curriculum changes, room collisions, and exam publication are converging today.', actionLabel: 'Review queue', actionPage: 'exams' },
            overviewTitle: 'Control Signals', overviewRows: [['fas fa-layer-group', 'Publish curriculum updates', 'Module changes ready for review.'], ['fas fa-calendar-alt', 'Resolve room collisions', 'Sessions competing for rooms next week.'], ['fas fa-user-plus', 'Provision new accounts', 'New account requests in queue.']],
            notesTitle: 'System Notes', notesRows: [['fas fa-table', 'Curriculum updates', 'Review and publish module changes across faculties.'], ['fas fa-filter', 'Scheduling', 'Resolve room conflicts and manage session assignments.'], ['fas fa-building-circle-check', 'Staff management', 'Provision accounts and manage faculty assignments.']],
            ledgerTitle: 'Operations Ledger', ledgerRows: [['Management Curriculum 2026', 'Faculty profile / Business', 'Ready'], ['Law Registration Structure', 'Minor and concentration rules', 'Pending'], ['Digital Exams Console', 'Question bank publication', 'Live']]
        },
        student_service: {
            kicker: 'Student Service', title: 'Support dashboard', copy: 'Manage tickets, student requests, and support resources.', pulseTitle: '06 urgent cases',
            pulseCopy: 'Finance and registration cases need follow-up.', pulseRows: [['Fastest lane', 'Library support'], ['Escalations', '6 unresolved'], ['Response time', '18 minutes']],
            continuityTitle: 'Quick Overview', continuityCopy: 'Service tools and queue status.', continuityRows: [['Queues', 'Ticket cards'], ['Knowledge', 'Guide surfaces'], ['Escalations', 'Priority chips']],
            quick: [['student-service', 'Inbox', 'fas fa-inbox', 'Tickets, escalations, and response flow.'], ['orders', 'Orders', 'fas fa-book-open', 'Request queues and approvals.'], ['library', 'Library', 'fas fa-book', 'Reference support and circulation help.'], ['social', 'Social', 'fas fa-comments', 'Community support channels.']],
            actions: [['student-service', 'Open inbox'], ['orders', 'Review orders']], alert: { tone: 'green', icon: 'fas fa-headset', title: 'Response times are healthy', copy: 'Service desk performance is stable, but finance escalations still need manual review.', actionLabel: 'Open service desk', actionPage: 'student-service' },
            overviewTitle: 'Service Signals', overviewRows: [['fas fa-inbox', 'Review urgent finance tickets', 'Payment holds and registration locks need attention.'], ['fas fa-book-open', 'Publish registration guide', 'Students need guidance on minors and free credits.'], ['fas fa-phone', 'Call back unresolved cases', 'Several students need status confirmation.']],
            notesTitle: 'Service Notes', notesRows: [['fas fa-handshake-angle', 'Response times', 'Monitor average response and resolution times.'], ['fas fa-list-check', 'Ticket management', 'Track open, escalated, and resolved cases.'], ['fas fa-circle-info', 'Knowledge base', 'Publish guides to reduce recurring student questions.']],
            ledgerTitle: 'Queue Ledger', ledgerRows: [['Finance Hold Queue', 'Student cases / payment issues', 'Live'], ['Registration Guidance', 'Knowledge article series', 'Ready'], ['Document Requests', 'Certificate and record requests', 'Pending']]
        }
    };

    const LUXURY_PALETTES = [
        { key: 'obsidian-amber', accent: '#c8822a', accent2: '#d8aa56' },
        { key: 'slate-sapphire', accent: '#426cda', accent2: '#89b0ff' },
        { key: 'pine-jade', accent: '#168b66', accent2: '#6ad1a0' },
        { key: 'burgundy-rose', accent: '#b94447', accent2: '#d8846b' },
        { key: 'sand-pearl', accent: '#c2b280', accent2: '#d4c4a0' },
        { key: 'ink-orchid', accent: '#7b4bab', accent2: '#a66bc4' },
        { key: 'ocean-teal', accent: '#008080', accent2: '#26a69a' }
    ];

    const FACULTY_PALETTE_MAP = {
        ECON: 'obsidian-amber',
        CS: 'slate-sapphire',
        LAW: 'pine-jade',
        MED: 'ocean-teal',
        ARTS: 'ink-orchid'
    };

    const STUDIO_PALETTES = [
        { key: 'obsidian-amber', name: 'Obsidian & Amber', hA: 30, sA: 72, lA: 48, hB: 45, sB: 80, lB: 56, mode: 'dark' },
        { key: 'slate-sapphire', name: 'Slate & Sapphire', hA: 215, sA: 68, lA: 50, hB: 230, sB: 75, lB: 60, mode: 'dark' },
        { key: 'pine-jade', name: 'Pine & Jade', hA: 156, sA: 72, lA: 34, hB: 142, sB: 56, lB: 58, mode: 'dark' },
        { key: 'burgundy-rose', name: 'Burgundy & Rose', hA: 350, sA: 52, lA: 45, hB: 16, sB: 72, lB: 64, mode: 'dark' },
        { key: 'sand-pearl', name: 'Sand & Pearl', hA: 32, sA: 58, lA: 63, hB: 48, sB: 82, lB: 76, mode: 'light' },
        { key: 'ink-orchid', name: 'Ink & Orchid', hA: 279, sA: 54, lA: 54, hB: 313, sB: 68, lB: 66, mode: 'dark' },
        { key: 'ocean-teal', name: 'Ocean & Teal', hA: 180, sA: 60, lA: 32, hB: 174, sB: 55, lB: 44, mode: 'dark' }
    ];

    function isBuiltInLuxuryPaletteKey(key) {
        return LUXURY_PALETTES.some((palette) => palette.key === key);
    }

    function buildStudioPaletteCustomColors(palette) {
        const start = `hsl(${Math.round(palette.hA)},${Math.round(palette.sA)}%,${Math.round(palette.lA)}%)`;
        const end = `hsl(${Math.round(palette.hB)},${Math.round(palette.sB)}%,${Math.round(palette.lB)}%)`;
        return { accent: start, accent2: end };
    }

    function studioPaletteMatchesMixer(palette, mixerState) {
        const values = ['hA', 'sA', 'lA', 'hB', 'sB', 'lB'];
        return values.every((key) => Math.abs(Number(mixerState?.[key] ?? 0) - Number(palette?.[key] ?? 0)) <= 1)
            && Math.abs(Number(mixerState?.ratio ?? 0) - 50) <= 1;
    }

    const BACKGROUND_MODES = [
        { key: 'constellation', label: 'Constellation Veil', icon: 'fas fa-braille', copy: 'Particle network background.' },
        { key: 'aurora', label: 'Aurora Drift', icon: 'fas fa-wind', copy: 'Flowing aurora effect.' },
        { key: 'mesh', label: 'Horizon Mesh', icon: 'fas fa-wave-square', copy: 'Subtle grid pattern.' }
    ];

    const BACKGROUND_INTENSITIES = [
        { key: 'low', label: 'Low', copy: 'Minimal.' },
        { key: 'standard', label: 'Standard', copy: 'Default.' },
        { key: 'high', label: 'High', copy: 'Vivid.' }
    ];

    const GLOW_STRENGTHS = [
        { key: 'soft', label: 'Soft', copy: 'Soft.' },
        { key: 'balanced', label: 'Balanced', copy: 'Default.' },
        { key: 'rich', label: 'Rich', copy: 'Strong.' }
    ];

    const HOME_ROLE_KEYS = ['student', 'professor', 'ta', 'admin', 'student_service'];
    const HOME_LAYOUT_VERSION = 1;
    const DEFAULT_HOME_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'constellation',
        backgroundAnimationsEnabled: true,
        backgroundIntensity: 'standard',
        glowStrength: 'balanced',
        paletteKey: '',
        paletteFaculty: '',
        customPalette: null
    };
    const HOME_EDITOR_STATE = {
        editing: false,
        role: '',
        draftLayout: null,
        draftCustomShortcuts: [],
        stagedVisuals: null,
        selectedWidgetId: '',
        dragState: null,
        inspectorState: null,
        inspectorDragState: null,
        scopeKey: ''
    };

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getCurrentUserSafe() {
        try {
            if (typeof getCurrentUser === 'function') return getCurrentUser() || {};
        } catch (e) {}
        return window.currentUser || {};
    }

    function getEffectiveRole() {
        try {
            if (typeof getEffectiveUserRole === 'function') return getEffectiveUserRole();
        } catch (e) {}
        return window.currentUserRole || getCurrentUserSafe().role || 'student';
    }

    function getShellRole(pageId = getActivePageId()) {
        return getEffectiveRole();
    }

    function getCurrentFacultyCode() {
        const user = getCurrentUserSafe();
        const selectValue = document.getElementById('faculty-select')?.value;
        const raw = selectValue || localStorage.getItem('currentFaculty') || user.facultyCode || user.faculty || 'ECON';
        try {
            if (typeof normalizeFacultyCode === 'function') return normalizeFacultyCode(raw, 'ECON');
        } catch (e) {}
        return String(raw || 'ECON').toUpperCase();
    }

    function getFacultyName(code) {
        try {
            if (typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        } catch (e) {}
        return code || 'Faculty';
    }

    function getUserName() {
        const user = getCurrentUserSafe();
        return user.nameEn || user.name || 'Portal User';
    }

    function getUserInitials() {
        return getUserName()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => (part[0] || '').toUpperCase())
            .join('') || 'KI';
    }

    function sanitizeBodyToken(value, fallback = 'portal') {
        return String(value || fallback)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || fallback;
    }

    function resolveEntryPageId(pathname = window.location.pathname) {
        const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
        const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
        if (!fileName || !fileName.endsWith('.html')) return '';
        return fileName.replace(/\.html$/i, '');
    }

    function resolveRuntimePageId(pathname = window.location.pathname) {
        try {
            if (typeof getRuntimeRouteIntentFromPathname === 'function') {
                const routed = getRuntimeRouteIntentFromPathname(pathname);
                if (routed) return routed;
            }
        } catch (e) {}
        const entryId = resolveEntryPageId(pathname);
        if (!entryId || entryId === 'index' || entryId === 'login') return '';
        if (entryId === 'admin-library') return 'library';
        if (entryId === 'admin-orders') return 'orders';
        return entryId;
    }

    function getActivePageId() {
        const active = document.querySelector('.page-section.active-page') ||
            Array.from(document.querySelectorAll('.page-section')).find((section) => section.style.display !== 'none');
        return active?.id?.replace(/^page-/, '') || resolveRuntimePageId() || 'home';
    }

    function getActiveEntryPageId() {
        return resolveEntryPageId() || getActivePageId();
    }

    function getPageFamily(pageId = getActivePageId(), entryId = getActiveEntryPageId()) {
        if (PAGE_FAMILIES[entryId]) return PAGE_FAMILIES[entryId];
        return PAGE_FAMILIES[pageId] || 'portal';
    }

    function applyPortalPageState() {
        const pageId = getActivePageId();
        const entryId = getActiveEntryPageId();
        const family = getPageFamily(pageId, entryId);
        const isHomeEditing = HOME_EDITOR_STATE.editing && pageId === 'home';
        const nextSignature = [pageId, entryId || pageId, family, isHomeEditing ? '1' : '0'].join('|');
        if (document.body.dataset.luxPageStateSignature === nextSignature) {
            return;
        }
        document.body.classList.add('lux-unified-shell');
        document.body.dataset.luxPage = pageId;
        document.body.dataset.luxEntry = entryId || pageId;
        document.body.dataset.luxFamily = family;
        document.body.dataset.luxEditingHome = isHomeEditing ? 'true' : 'false';
        document.body.dataset.luxPageStateSignature = nextSignature;
        document.body.classList.toggle('lux-home-page', pageId === 'home');
        document.body.classList.toggle('lux-nonhome-page', pageId !== 'home');
        document.body.classList.toggle('lux-home-editing', Boolean(isHomeEditing));
        Array.from(document.body.classList).forEach((className) => {
            if (/^lux-(route|entry|family)-/.test(className)) {
                document.body.classList.remove(className);
            }
        });
        document.body.classList.add(
            `lux-route-${sanitizeBodyToken(pageId)}`,
            `lux-entry-${sanitizeBodyToken(entryId || pageId)}`,
            `lux-family-${sanitizeBodyToken(family)}`
        );
    }

    function isSidebarCollapsed() {
        return localStorage.getItem('kiuLuxurySidebarCollapsed') === '1';
    }

    function applySidebarState(collapsed = isSidebarCollapsed()) {
        document.body.classList.toggle('lux-sidebar-collapsed', Boolean(collapsed));
        document.body.dataset.luxSidebar = collapsed ? 'collapsed' : 'expanded';
        const toggle = document.getElementById('lux-sidebar-toggle');
        if (toggle) {
            toggle.classList.toggle('is-active', Boolean(collapsed));
            toggle.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
            toggle.title = collapsed ? 'Show navigation' : 'Hide navigation';
            const icon = toggle.querySelector('i');
            const label = toggle.querySelector('.lux-sidebar-toggle-label');
            if (icon) {
                icon.className = collapsed ? 'fas fa-sidebar fa-flip-horizontal' : 'fas fa-sidebar';
            }
            if (label) {
                label.textContent = collapsed ? 'Show nav' : 'Hide nav';
            }
        }
    }

    function toggleSidebar() {
        const next = !isSidebarCollapsed();
        localStorage.setItem('kiuLuxurySidebarCollapsed', next ? '1' : '0');
        
        // FIX: Halt heavy background/blur rendering during layout shifts to prevent GPU choke
        window.__luxIsAnimating = true;
        document.body.classList.add('lux-is-animating');
        setTimeout(() => {
            window.__luxIsAnimating = false;
            document.body.classList.remove('lux-is-animating');
        }, 280);

        applySidebarState(next);
        // FIX: Do NOT call syncAll() or dispatch fake 'resize' events here.
        // Sidebar toggle is a pure CSS transition handled by index-luxury.css transitions.
        // Dispatching a resize event tricks the app into rebuilding the DOM.
    }

    function pageLabel(pageId) {
        return PAGE_LABELS[pageId] || 'Dashboard';
    }

    function pageTarget(pageId) {
        return pageId === 'profile' ? 'profile-view' : pageId;
    }

    window.__KIU_LUXURY_SHARED = {
        ROLE_LABELS,
        PAGE_LABELS,
        NAV_BY_ROLE,
        pageLabel,
        pageTarget,
        isSidebarCollapsed,
        applySidebarState,
        toggleSidebar
    };

    window.isSidebarCollapsed = typeof isSidebarCollapsed === 'function' ? isSidebarCollapsed : window.isSidebarCollapsed;
    window.applySidebarState = typeof applySidebarState === 'function' ? applySidebarState : window.applySidebarState;
    window.toggleSidebar = typeof toggleSidebar === 'function' ? toggleSidebar : window.toggleSidebar;

    function cloneDeep(value, fallback = null) {
        if (value == null) return fallback;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return fallback;
        }
    }

    function ensureDashboardPreferenceStore() {
        if (!KIU_STATE.homeDashboardPreferencesByUser || typeof KIU_STATE.homeDashboardPreferencesByUser !== 'object') {
            KIU_STATE.homeDashboardPreferencesByUser = {};
        }
        return KIU_STATE.homeDashboardPreferencesByUser;
    }

    function getDashboardPreferenceUserId() {
        const user = getCurrentUserSafe();
        return String(user?.id || user?.email || user?.nameEn || user?.name || 'guest');
    }

    const ADVANCED_HOME_LAYOUT_VERSION = 5;
    const HOME_SCOPE_SEPARATOR = '::';
    const HOME_DESKTOP_EDITOR_BREAKPOINT = 1120;
    const HOME_GRID_COLUMNS = 12;
    const HOME_GRID_ROW_HEIGHT = 28;
    const ADVANCED_DEFAULT_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'constellation',
        backgroundAnimationsEnabled: true,
        backgroundIntensity: 'standard',
        glowStrength: 'balanced',
        paletteKey: '',
        paletteFaculty: '',
        customPalette: null,
        accentColor: '',
        accentColor2: '',
        glassTint: '',
        particleColor: '',
        lineColor: '',
        glowColor: '',
        hazeColor: ''
    };

    function buildAdvancedDefaultVisuals() {
        return {
            ...ADVANCED_DEFAULT_VISUALS,
            customPalette: null
        };
    }

    function isDesktopHomeEditorViewport() {
        return (window.innerWidth || 0) >= HOME_DESKTOP_EDITOR_BREAKPOINT;
    }

    function isHomeEditorAvailable() {
        return true;
    }

    function getHomeScopeKey(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {
        return `${String(role || 'student')}${HOME_SCOPE_SEPARATOR}${String(facultyCode || 'ECON')}`;
    }

    function clearHomeEditorState() {
        HOME_EDITOR_STATE.editing = false;
        HOME_EDITOR_STATE.role = '';
        HOME_EDITOR_STATE.draftLayout = null;
        HOME_EDITOR_STATE.draftCustomShortcuts = [];
        HOME_EDITOR_STATE.dragState = null;
        HOME_EDITOR_STATE.inspectorState = null;
        HOME_EDITOR_STATE.inspectorDragState = null;
        HOME_EDITOR_STATE.selectedWidgetId = '';
    }

    function createDashboardPreferenceEntry() {
        return {
            version: ADVANCED_HOME_LAYOUT_VERSION,
            visuals: buildAdvancedDefaultVisuals(),
            visualsByScope: {},
            layoutsByRole: {},
            customShortcutsByRole: {},
            layoutsByScope: {},
            editorUiByScope: {}
        };
    }

    function normalizeScopeLayoutEntry(scopeEntry) {
        if (!scopeEntry || typeof scopeEntry !== 'object') return null;
        const workspaceWidgets = Array.isArray(scopeEntry.workspaceWidgets)
            ? scopeEntry.workspaceWidgets
            : (Array.isArray(scopeEntry.widgets) ? scopeEntry.widgets : []);
        const presentationWidgets = Array.isArray(scopeEntry.presentationWidgets) ? scopeEntry.presentationWidgets : [];
        return {
            version: Number(scopeEntry.version || 0) || 0,
            workspaceWidgets,
            presentationWidgets
        };
    }

    function getDashboardPreferenceEntry() {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        if (!store[userId] || typeof store[userId] !== 'object') {
            store[userId] = createDashboardPreferenceEntry();
        }
        const entry = store[userId];
        const previousVersion = Number(entry.version || 0);
        if (!entry.visuals || typeof entry.visuals !== 'object') entry.visuals = buildAdvancedDefaultVisuals();
        if (!entry.visualsByScope || typeof entry.visualsByScope !== 'object') entry.visualsByScope = {};
        if (!entry.layoutsByRole || typeof entry.layoutsByRole !== 'object') entry.layoutsByRole = {};
        if (!entry.customShortcutsByRole || typeof entry.customShortcutsByRole !== 'object') entry.customShortcutsByRole = {};
        if (!entry.layoutsByScope || typeof entry.layoutsByScope !== 'object') entry.layoutsByScope = {};
        if (!entry.editorUiByScope || typeof entry.editorUiByScope !== 'object') entry.editorUiByScope = {};
        if (previousVersion > 0 && previousVersion < ADVANCED_HOME_LAYOUT_VERSION) {
            Object.keys(entry.layoutsByScope).forEach((scopeKey) => {
                const normalizedScope = normalizeScopeLayoutEntry(entry.layoutsByScope[scopeKey]);
                if (!normalizedScope) return;
                normalizedScope.workspaceWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                normalizedScope.presentationWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                entry.layoutsByScope[scopeKey] = {
                    version: previousVersion,
                    workspaceWidgets: normalizedScope.workspaceWidgets,
                    presentationWidgets: normalizedScope.presentationWidgets
                };
            });
        }
        entry.version = ADVANCED_HOME_LAYOUT_VERSION;
        return entry;
    }

    function updateDashboardPreferenceEntry(mutator, { persist = false } = {}) {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        const nextEntry = cloneDeep(getDashboardPreferenceEntry(), createDashboardPreferenceEntry());
        mutator(nextEntry);
        nextEntry.version = ADVANCED_HOME_LAYOUT_VERSION;
        if (!nextEntry.visuals || typeof nextEntry.visuals !== 'object') nextEntry.visuals = buildAdvancedDefaultVisuals();
        if (!nextEntry.visualsByScope || typeof nextEntry.visualsByScope !== 'object') nextEntry.visualsByScope = {};
        if (!nextEntry.layoutsByRole || typeof nextEntry.layoutsByRole !== 'object') nextEntry.layoutsByRole = {};
        if (!nextEntry.customShortcutsByRole || typeof nextEntry.customShortcutsByRole !== 'object') nextEntry.customShortcutsByRole = {};
        if (!nextEntry.layoutsByScope || typeof nextEntry.layoutsByScope !== 'object') nextEntry.layoutsByScope = {};
        if (!nextEntry.editorUiByScope || typeof nextEntry.editorUiByScope !== 'object') nextEntry.editorUiByScope = {};
        store[userId] = nextEntry;
        if (persist && typeof saveState === 'function') saveState();
        return nextEntry;
    }

    function getDefaultInspectorState() {
        const width = Math.min(390, Math.max(320, (window.innerWidth || 1440) - 48));
        return {
            collapsed: false,
            x: Math.max(24, (window.innerWidth || 1440) - width - 28),
            y: 132,
            width
        };
    }

    function sanitizeInspectorState(value) {
        const base = getDefaultInspectorState();
        const width = Math.max(300, Math.min(Number(value?.width) || base.width, Math.max(300, (window.innerWidth || 1440) - 32)));
        const maxX = Math.max(12, (window.innerWidth || 1440) - width - 12);
        const maxY = Math.max(12, (window.innerHeight || 900) - 120);
        return {
            collapsed: value?.collapsed === true,
            width,
            x: Math.max(12, Math.min(Number(value?.x) || base.x, maxX)),
            y: Math.max(96, Math.min(Number(value?.y) || base.y, maxY))
        };
    }

    function getSavedInspectorState(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        return sanitizeInspectorState(entry.editorUiByScope?.[scopeKey] || {});
    }

    function setSavedInspectorState(values, scopeKey = getHomeScopeKey(), persist = true) {
        const nextState = sanitizeInspectorState({
            ...(getSavedInspectorState(scopeKey) || {}),
            ...(values || {})
        });
        updateDashboardPreferenceEntry((entry) => {
            entry.editorUiByScope = entry.editorUiByScope || {};
            entry.editorUiByScope[scopeKey] = nextState;
        }, { persist });
        return nextState;
    }

    function getDashboardVisuals(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        const scopedVisuals = entry.visualsByScope?.[scopeKey];
        return {
            ...buildAdvancedDefaultVisuals(),
            ...(scopedVisuals || entry.visuals || {})
        };
    }

    function setDashboardVisuals(values, persist = true, scopeKey = getHomeScopeKey()) {
        updateDashboardPreferenceEntry((entry) => {
            entry.visualsByScope = entry.visualsByScope || {};
            entry.visualsByScope[scopeKey] = {
                ...buildAdvancedDefaultVisuals(),
                ...(entry.visuals || {}),
                ...(entry.visualsByScope?.[scopeKey] || {}),
                ...(values || {})
            };
        }, { persist });
    }

    function getDefaultVisualSettings() {
        return buildAdvancedDefaultVisuals();
    }

    function resetVisualSettings() {
        [
            'kiuLuxuryThemeMode',
            'kiuLuxuryBackgroundMode',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState',
            'kiu-palette'
        ].forEach((key) => localStorage.removeItem(key));

        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid'];
        paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
        document.body.style.background = '';

        const scopeKey = getHomeScopeKey();
        updateDashboardPreferenceEntry((entry) => {
            delete entry.visualsByScope[scopeKey];
        }, { persist: true });
        showToast('Visual settings reset for this dashboard profile.');
        syncAll();
    }

    function resetHomeToDefaults() {
        [
            'kiuLuxuryThemeMode',
            'kiuLuxuryBackgroundMode',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState'
        ].forEach((key) => localStorage.removeItem(key));
        updateDashboardPreferenceEntry((entry) => {
            entry.visuals = buildAdvancedDefaultVisuals();
            entry.visualsByScope = {};
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('Home restored to KIU defaults.');
        syncAll();
    }

    function resetSavedRoleLayout(role) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        updateDashboardPreferenceEntry((entry) => {
            delete entry.layoutsByScope[scopeKey];
            delete entry.editorUiByScope?.[scopeKey];
            delete entry.layoutsByRole[role];
            delete entry.customShortcutsByRole[role];
        }, { persist: true });
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role) clearHomeEditorState();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset for ${getFacultyName(getCurrentFacultyCode())}.`);
        syncAll();
    }

    function resetAllSavedHomeLayouts() {
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('All dashboard layouts reset.');
        syncAll();
    }

    function hexToRgbTriplet(hex) {
        const cleaned = String(hex || '').trim().replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '200,130,42';
        const r = parseInt(cleaned.slice(0, 2), 16);
        const g = parseInt(cleaned.slice(2, 4), 16);
        const b = parseInt(cleaned.slice(4, 6), 16);
        return `${r},${g},${b}`;
    }

    function getPaletteByKey(key) {
        return LUXURY_PALETTES.find((palette) => palette.key === key)
            || LUXURY_PALETTES.find((palette) => palette.key === 'obsidian-amber') // Default, not faculty-based
            || LUXURY_PALETTES[0];
    }

    function hslToRgb(h, s, l) {
        const hue = Number(h || 0);
        const sat = Number(s || 0) / 100;
        const lig = Number(l || 0) / 100;
        const k = (n) => (n + hue / 30) % 12;
        const a = sat * Math.min(lig, 1 - lig);
        const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }

    function mixHsl(h1, s1, l1, h2, s2, l2, ratio) {
        const start = Number(h1 || 0);
        const end = Number(h2 || 0);
        let delta = end - start;
        if (Math.abs(delta) > 180) delta -= Math.sign(delta) * 360;
        const mix = Number(ratio || 0);
        return [
            (start + delta * mix + 360) % 360,
            Number(s1 || 0) + (Number(s2 || 0) - Number(s1 || 0)) * mix,
            Number(l1 || 0) + (Number(l2 || 0) - Number(l1 || 0)) * mix
        ];
    }

    function rgbTripletToString(rgb) {
        return `${rgb[0]},${rgb[1]},${rgb[2]}`;
    }

    function blendRgbTriplets(a, b, ratio = 0.5) {
        const mix = Math.max(0, Math.min(1, Number(ratio) || 0));
        const parse = (triplet, fallback) => String(triplet || fallback)
            .split(',')
            .slice(0, 3)
            .map((part, index) => {
                const fallbackParts = String(fallback || '0,0,0').split(',');
                const numeric = Number(part?.trim?.() ?? part);
                return Math.max(0, Math.min(255, Number.isFinite(numeric) ? numeric : Number(fallbackParts[index] || 0)));
            });
        const first = parse(a, '0,0,0');
        const second = parse(b, '0,0,0');
        return [
            Math.round(first[0] + (second[0] - first[0]) * mix),
            Math.round(first[1] + (second[1] - first[1]) * mix),
            Math.round(first[2] + (second[2] - first[2]) * mix)
        ].join(',');
    }

    function rgbTripletToHex(triplet, fallback = '#c8822a') {
        const parts = String(triplet || '')
            .split(',')
            .slice(0, 3)
            .map((part) => Math.max(0, Math.min(255, Math.round(Number(part.trim()) || 0))));
        if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return fallback;
        return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }

    let __luxColorProbeContext = null;

    function colorToRgbTriplet(value, fallback = '200,130,42') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return hexToRgbTriplet(input);
        if (!__luxColorProbeContext) {
            const probe = document.createElement('canvas');
            probe.width = 1;
            probe.height = 1;
            __luxColorProbeContext = probe.getContext('2d');
        }
        const context = __luxColorProbeContext;
        if (!context) return fallback;
        try {
            context.fillStyle = '#000000';
            context.fillStyle = input;
            const normalized = context.fillStyle || '';
            if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return hexToRgbTriplet(normalized);
            const match = normalized.match(/rgba?\(([^)]+)\)/i);
            if (!match) return fallback;
            return match[1].split(',').slice(0, 3).map((part) => String(Math.round(Number(part.trim()) || 0))).join(',');
        } catch (e) {
            return fallback;
        }
    }

    function sanitizeColorInput(value, fallback = '') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return input;
        const rgb = colorToRgbTriplet(input, '');
        if (rgb) return rgbTripletToHex(rgb, fallback || '#c8822a');
        return fallback || '#c8822a';
    }

    function getFacultyLuxuryPaletteState(facultyCode = getCurrentFacultyCode()) {
        const normalizedFaculty = String(facultyCode || 'ECON').toUpperCase();
        const fallbackPalette = getPaletteByKey('obsidian-amber');
        let facultyProfile = null;
        try {
            if (typeof getFacultyProfile === 'function') facultyProfile = getFacultyProfile(normalizedFaculty) || null;
        } catch (e) {}
        const accent = sanitizeColorInput(facultyProfile?.color, fallbackPalette.accent || '#c8822a');
        const nav = sanitizeColorInput(facultyProfile?.navColor, '#091220');
        const accentRgb = colorToRgbTriplet(accent, colorToRgbTriplet(fallbackPalette.accent || '#c8822a'));
        const navRgb = colorToRgbTriplet(nav, '9,18,32');
        const accent2Rgb = blendRgbTriplets(accentRgb, '255,232,188', 0.42);
        return {
            facultyCode: normalizedFaculty,
            paletteKey: fallbackPalette.key,
            accent,
            accent2: rgbTripletToHex(accent2Rgb, fallbackPalette.accent2 || accent),
            accentRgb,
            accent2Rgb,
            nav,
            navRgb,
            shellStartRgb: blendRgbTriplets(navRgb, accentRgb, 0.26),
            shellEndRgb: blendRgbTriplets(navRgb, '4,7,13', 0.34),
            shellGlowRgb: accent2Rgb,
            topbarTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.2),
            glassTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.18),
            hazeRgb: blendRgbTriplets(accentRgb, accent2Rgb, 0.28)
        };
    }

    function isVisualPaletteScopedToFaculty(visuals, facultyCode = getCurrentFacultyCode()) {
        return String(visuals?.paletteFaculty || '').toUpperCase() === String(facultyCode || '').toUpperCase();
    }

    function resolveCustomPalette() {
        const facultyCode = getCurrentFacultyCode();
        const visuals = getDashboardVisuals();
        if (isVisualPaletteScopedToFaculty(visuals, facultyCode) && visuals.customPalette?.accent && visuals.customPalette?.accent2) {
            return visuals.customPalette;
        }
        try {
            if (String(localStorage.getItem('kiuLuxuryCustomPaletteFaculty') || '').toUpperCase() !== facultyCode) return null;
            const raw = localStorage.getItem('kiuLuxuryCustomPalette');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function resolvePaletteKey() {
        const visuals = getDashboardVisuals();
        const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');
        if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;
        return visuals?.paletteKey || 'obsidian-amber';
    }

    function applyPaletteValues(accent, accent2, persist, key) {
        const root = document.documentElement;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', colorToRgbTriplet(accent));

        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
        paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
        document.body.style.background = '';

        if (key && key !== 'custom' && paletteClasses.includes(key)) {
            document.body.classList.add(`palette-${key}`);
        }

        if (persist) {
            localStorage.setItem('kiuLuxuryPalette', key || 'custom');
            localStorage.setItem('kiuLuxuryPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', key);
        }

        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            var _palTransVal = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
            window.queueLuxuryTransparencyRefresh(_palTransVal);
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
    }

    function applyPaletteKey(key, persist) {
        const palette = getPaletteByKey(key);
        applyPaletteValues(palette.accent, palette.accent2, persist, palette.key);
        if (persist) {
            localStorage.removeItem('kiuLuxuryCustomPalette');
            localStorage.removeItem('kiuLuxuryCustomPaletteFaculty');
            setDashboardVisuals({
                paletteKey: palette.key,
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: null,
                accentColor: palette.accent,
                accentColor2: palette.accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
    }

    function applyCustomPalette(accent, accent2, persist) {
        applyPaletteValues(accent, accent2, persist, 'custom');

        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
        paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
        document.body.style.background = '';

        if (persist) {
            localStorage.setItem('kiuLuxuryCustomPalette', JSON.stringify({ accent, accent2 }));
            localStorage.setItem('kiuLuxuryCustomPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', 'custom');
            setDashboardVisuals({
                paletteKey: 'custom',
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: { accent, accent2 },
                accentColor: accent,
                accentColor2: accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
    }

    function applyResolvedPalette() {
        const root = document.documentElement;
        const facultyPalette = getFacultyLuxuryPaletteState(getCurrentFacultyCode());
        const visuals = getDashboardVisuals();
        const visualsAreScoped = isVisualPaletteScopedToFaculty(visuals, facultyPalette.facultyCode);
        const palette = getPaletteByKey(visualsAreScoped ? (visuals.paletteKey || facultyPalette.paletteKey) : facultyPalette.paletteKey);
        const custom = visualsAreScoped && visuals.customPalette?.accent ? visuals.customPalette : resolveCustomPalette();
        const lightMode = getThemeMode() === 'light';
        const accent = visualsAreScoped
            ? (visuals.accentColor || custom?.accent || palette.accent || facultyPalette.accent)
            : facultyPalette.accent;
        const accent2 = visualsAreScoped
            ? (visuals.accentColor2 || custom?.accent2 || palette.accent2 || facultyPalette.accent2)
            : facultyPalette.accent2;
        const accentRgb = colorToRgbTriplet(accent, facultyPalette.accentRgb);
        const accent2Rgb = colorToRgbTriplet(accent2, facultyPalette.accent2Rgb || accentRgb);
        const shellStartRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('248,240,229', accentRgb, 0.12)
                : blendRgbTriplets(facultyPalette.navRgb, accentRgb, 0.34))
            : facultyPalette.shellStartRgb;
        const shellEndRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('255,249,241', accent2Rgb, 0.06)
                : blendRgbTriplets('4,7,13', accentRgb, 0.18))
            : facultyPalette.shellEndRgb;
        const shellGlowRgb = visualsAreScoped
            ? blendRgbTriplets(accentRgb, accent2Rgb, 0.46)
            : facultyPalette.shellGlowRgb;
        const glassTint = visualsAreScoped && visuals.glassTint
            ? visuals.glassTint
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('255,255,255', accent2Rgb, visualsAreScoped ? 0.12 : 0.16), '#eadfce')
                : (visualsAreScoped
                    ? rgbTripletToHex(blendRgbTriplets('10,16,28', accentRgb, 0.24), facultyPalette.nav || accent)
                    : facultyPalette.nav));
        const topbarTint = visualsAreScoped
            ? (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', accentRgb, 0.16), '#e6d8c6')
                : rgbTripletToHex(blendRgbTriplets('11,18,32', accentRgb, 0.24), facultyPalette.nav || accent))
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', facultyPalette.accentRgb, 0.2), '#e6d8c6')
                : facultyPalette.nav);
        const particleColor = visualsAreScoped ? (visuals.particleColor || accent2) : facultyPalette.accent2;
        const lineColor = visualsAreScoped ? (visuals.lineColor || accent) : facultyPalette.accent;
        const glowColor = visualsAreScoped ? (visuals.glowColor || accent2) : facultyPalette.accent2;
        const hazeColor = visualsAreScoped ? (visuals.hazeColor || accent) : facultyPalette.accent;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', accentRgb);
        root.style.setProperty('--lux-glass-tint-rgb', colorToRgbTriplet(glassTint, lightMode ? '246,239,229' : '16,23,38'));
        root.style.setProperty('--lux-topbar-tint-rgb', colorToRgbTriplet(topbarTint, lightMode ? '239,228,213' : '11,18,32'));
        root.style.setProperty('--lux-shell-start-rgb', shellStartRgb);
        root.style.setProperty('--lux-shell-end-rgb', shellEndRgb);
        root.style.setProperty('--lux-shell-glow-rgb', shellGlowRgb);
        root.style.setProperty('--lux-home-secondary-rgb', accent2Rgb);
        root.style.setProperty('--lux-bg-particle-rgb', colorToRgbTriplet(particleColor, accent2Rgb));
        root.style.setProperty('--lux-bg-line-rgb', colorToRgbTriplet(lineColor, accentRgb));
        root.style.setProperty('--lux-bg-glow-rgb', colorToRgbTriplet(glowColor, accent2Rgb));
        root.style.setProperty('--lux-bg-haze-rgb', colorToRgbTriplet(hazeColor, accentRgb));
        root.style.setProperty('--kiu-blue', accent);
        root.style.setProperty('--kiu-dark-blue', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-navy', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`);
        root.style.setProperty('--kiu-shell-gradient', lightMode
            ? `radial-gradient(circle at 16% 10%, rgba(${accentRgb}, 0.12), transparent 30%), radial-gradient(circle at 84% 82%, rgba(${accent2Rgb}, 0.10), transparent 28%), linear-gradient(180deg, #fffaf3 0%, #f4ede2 100%)`
            : `radial-gradient(circle at 12% 8%, rgba(${accentRgb}, 0.18), transparent 32%), radial-gradient(circle at 84% 80%, rgba(${accent2Rgb}, 0.12), transparent 30%), radial-gradient(circle at 50% -12%, rgba(${shellGlowRgb}, 0.10), transparent 42%), linear-gradient(180deg, rgba(${shellStartRgb}, 0.42), rgba(${shellEndRgb}, 0.78) 48%, rgba(4,7,13,0.98) 100%)`);
        document.body.dataset.luxFaculty = facultyPalette.facultyCode;
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency'));
        }
    }

    function applyAtmosphereSettings() {
        const root = document.documentElement;
        const intensity = getBackgroundIntensity();
        const glow = getGlowStrength();
        const lightMode = getThemeMode() === 'light';
        const glowMap = {
            soft: { glowScale: '0.88', buttonGlow: '0.28', panelGlow: '0.14' },
            balanced: { glowScale: '1', buttonGlow: '0.44', panelGlow: '0.2' },
            rich: { glowScale: '1.18', buttonGlow: '0.64', panelGlow: '0.28' }
        };
        const glowConfig = glowMap[glow] || glowMap.balanced;
        const panelFillMin = lightMode ? 0.016 : 0.012;
        const raisedFillMin = lightMode ? 0.008 : 0.006;
        const utilityFillMin = lightMode ? 0.024 : 0.022;
        const topbarFillMin = lightMode ? 0.34 : 0.78;
        const topbarRaisedMin = lightMode ? 0.05 : 0.16;
        const canvasOpacity = lightMode
            ? (intensity === 'high' ? '0.68' : intensity === 'low' ? '0.46' : '0.58')
            : (intensity === 'high' ? '0.96' : intensity === 'low' ? '0.72' : '0.84');
        const overlayOpacity = lightMode
            ? (intensity === 'high' ? '0.22' : intensity === 'low' ? '0.34' : '0.28')
            : (intensity === 'high' ? '0.06' : intensity === 'low' ? '0.16' : '0.11');
        const hazeTop = lightMode
            ? (intensity === 'high' ? '0.02' : intensity === 'low' ? '0.08' : '0.05')
            : (intensity === 'high' ? '0.004' : intensity === 'low' ? '0.014' : '0.008');
        const hazeBottom = lightMode
            ? (intensity === 'high' ? '0.06' : intensity === 'low' ? '0.12' : '0.09')
            : (intensity === 'high' ? '0.1' : intensity === 'low' ? '0.16' : '0.13');
        const backgroundAnimationsEnabled = areBackgroundAnimationsEnabled();
        root.style.setProperty('--lux-canvas-opacity', backgroundAnimationsEnabled ? canvasOpacity : '0');
        root.style.setProperty('--lux-overlay-opacity', backgroundAnimationsEnabled ? overlayOpacity : '0');
        root.style.setProperty('--lux-page-haze-top', backgroundAnimationsEnabled ? hazeTop : '0');
        root.style.setProperty('--lux-page-haze-bottom', backgroundAnimationsEnabled ? hazeBottom : '0');
        root.style.setProperty('--lux-panel-fill-alpha', String(panelFillMin));
        root.style.setProperty('--lux-raised-fill-alpha', String(raisedFillMin));
        root.style.setProperty('--lux-utility-fill-alpha', String(utilityFillMin));
        root.style.setProperty('--lux-glass-highlight-alpha', String(lightMode ? 0.02 : 0.012));
        root.style.setProperty('--lux-glass-blur', lightMode ? '8px' : '8px');
        root.style.setProperty('--lux-topbar-fill-alpha', String(topbarFillMin));
        root.style.setProperty('--lux-topbar-raised-alpha', String(topbarRaisedMin));
        root.style.setProperty('--lux-button-glow', glowConfig.buttonGlow);
        var _savedTransVal = parseInt(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || '70', 10);
        var _transparencyModel = typeof window.buildLuxuryTransparencyModel === 'function'
            ? window.buildLuxuryTransparencyModel(_savedTransVal, lightMode)
            : null;
        var _panelA = _transparencyModel ? _transparencyModel.panelAlpha : (_savedTransVal >= 95 ? (lightMode ? 0.95 : 0.92) : Math.max(0.03, _savedTransVal / 100 * 0.92));
        var _isHighTrans2 = _transparencyModel ? _transparencyModel.highTransparency : _savedTransVal >= 80;
        root.style.setProperty('--lux-panel-glow', _isHighTrans2 ? '0' : glowConfig.panelGlow);
        root.style.setProperty('--lux-glow-scale', _isHighTrans2 ? '0' : glowConfig.glowScale);
        root.style.setProperty('--lux-panel-alpha', String(_panelA));
        root.style.setProperty('--lux-transparency-alpha', String(_transparencyModel ? _transparencyModel.fillRatio : Math.max(0, 1 - (_savedTransVal / 100))));
        root.style.setProperty('--lux-color-fade-alpha', String(_transparencyModel ? _transparencyModel.colorFadeRatio : Math.max(0.42, Math.min(1, 0.34 + ((Math.max(0, 1 - (_savedTransVal / 100))) * 0.68)))));
        root.style.setProperty('--lux-raised-alpha', String(_transparencyModel ? _transparencyModel.raisedAlpha : 0.012));
        root.style.setProperty('--lux-glass-alpha', String(_transparencyModel ? _transparencyModel.glassAlpha : 0.006));
        root.style.setProperty('--lux-card-glow-alpha', _isHighTrans2 ? '0' : String(0.016));
        root.style.setProperty('--lux-utility-alpha', String(_transparencyModel ? _transparencyModel.utilityAlpha : (lightMode ? 0.02 : 0.08)));
        if (_transparencyModel) {
            root.style.setProperty('--lux-panel-fill-alpha', String(_transparencyModel.panelFillAlpha));
            root.style.setProperty('--lux-raised-fill-alpha', String(_transparencyModel.raisedFillAlpha));
            root.style.setProperty('--lux-utility-fill-alpha', String(_transparencyModel.utilityFillAlpha));
            root.style.setProperty('--lux-topbar-fill-alpha', String(_transparencyModel.topbarFillAlpha));
            root.style.setProperty('--lux-topbar-raised-alpha', String(_transparencyModel.topbarRaisedAlpha));
            root.style.setProperty('--lux-glass-highlight-alpha', String(_transparencyModel.glassHighlightAlpha));
        }
        root.style.setProperty('--lux-grid-row-height', `${HOME_GRID_ROW_HEIGHT}px`);
        document.body.dataset.luxBackgroundIntensity = intensity;
        document.body.dataset.luxGlowStrength = glow;
        document.body.dataset.luxBackgroundAnimation = backgroundAnimationsEnabled ? 'on' : 'off';
    }

    function getThemeMode() {
        if (window.__KIU_FORCE_DARK_ROUTE__) return 'dark';
        const stored = String(getDashboardVisuals().themeMode || DEFAULT_HOME_VISUALS.themeMode).trim().toLowerCase();
        return stored === 'light' ? 'light' : 'dark';
    }

    function applyThemeMode(mode, persist) {
        const nextMode = mode === 'light' ? 'light' : 'dark';
        const root = document.documentElement;
        document.body.classList.toggle('lux-light-mode', nextMode === 'light');
        document.body.dataset.luxThemeMode = nextMode;
        root.classList.toggle('lux-light-mode', nextMode === 'light');
        root.dataset.luxThemeMode = nextMode;
        if (nextMode === 'light') {
            root.style.setProperty('--lux-bg', '#efebe4');
            root.style.setProperty('--lux-bg-soft', '#f7f3ec');
            root.style.setProperty('--lux-surface', '#ffffff');
            root.style.setProperty('--lux-surface-2', '#f5f1ea');
            root.style.setProperty('--lux-surface-3', '#ece6db');
            root.style.setProperty('--lux-border', 'rgba(48,34,22,0.10)');
            root.style.setProperty('--lux-border-strong', 'rgba(48,34,22,0.18)');
            root.style.setProperty('--lux-text', '#201912');
            root.style.setProperty('--lux-text-muted', 'rgba(32,25,18,0.66)');
            root.style.setProperty('--lux-text-soft', 'rgba(32,25,18,0.36)');
            root.style.setProperty('--lux-shadow', '0 24px 54px rgba(62,42,20,0.12)');
        } else {
            ['--lux-bg', '--lux-bg-soft', '--lux-surface', '--lux-surface-2', '--lux-surface-3', '--lux-border', '--lux-border-strong', '--lux-text', '--lux-text-muted', '--lux-text-soft', '--lux-shadow']
                .forEach((name) => root.style.removeProperty(name));
        }
        if (persist) {
            localStorage.setItem('kiuLuxuryThemeMode', nextMode);
            setDashboardVisuals({ themeMode: nextMode });
        }

        // Re-apply transparency so inline backgrounds recalculate for the new mode
        if (typeof updateTransparency === 'function') {
            const saved = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || '70';
            updateTransparency(parseInt(saved));
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
    }

    function sanitizeBackgroundMode(mode) {
        const normalized = String(mode || '').trim().toLowerCase();
        if (normalized === 'tunnel') return 'aurora';
        if (normalized === 'grid') return 'mesh';
        return BACKGROUND_MODES.some((item) => item.key === normalized) ? normalized : 'constellation';
    }

    function areBackgroundAnimationsEnabled() {
        const scopeKey = getHomeScopeKey();
        const entry = getDashboardPreferenceEntry();
        const stored = String(localStorage.getItem('kiuLuxuryBackgroundAnimationsEnabled') || '').trim().toLowerCase();
        if (stored) {
            return !(stored === '0' || stored === 'false' || stored === 'off');
        }
        const scopedVisuals = entry.visualsByScope?.[scopeKey];
        if (scopedVisuals && typeof scopedVisuals.backgroundAnimationsEnabled === 'boolean') {
            return scopedVisuals.backgroundAnimationsEnabled;
        }
        if (
            entry.visuals
            && typeof entry.visuals === 'object'
            && Object.prototype.hasOwnProperty.call(entry.visuals, 'backgroundAnimationsEnabled')
            && typeof entry.visuals.backgroundAnimationsEnabled === 'boolean'
        ) {
            return entry.visuals.backgroundAnimationsEnabled;
        }
        return true;
    }

    function getBackgroundMode() {
        return sanitizeBackgroundMode(getDashboardVisuals().backgroundMode || DEFAULT_HOME_VISUALS.backgroundMode);
    }

    function setBackgroundAnimationsEnabled(enabled, persist = true) {
        const nextValue = enabled !== false;
        document.body.dataset.luxBackgroundAnimation = nextValue ? 'on' : 'off';
        if (persist) {
            localStorage.setItem('kiuLuxuryBackgroundAnimationsEnabled', nextValue ? '1' : '0');
            setDashboardVisuals({ backgroundAnimationsEnabled: nextValue });
        }
        applyAtmosphereSettings();
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
        showToast(nextValue ? 'Background animations on' : 'Background animations off');
    }

    function setBackgroundMode(mode, persist) {
        const validMode = sanitizeBackgroundMode(mode);
        document.body.dataset.luxBackgroundMode = validMode;
        if (persist) {
            localStorage.setItem('kiuLuxuryBackgroundMode', validMode);
            setDashboardVisuals({ backgroundMode: validMode });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground(validMode);
        }
        syncStudioUi();
        showToast(`Background: ${BACKGROUND_MODES.find((item) => item.key === validMode)?.label || validMode}`);
    }

    function getBackgroundIntensity() {
        const stored = String(getDashboardVisuals().backgroundIntensity || DEFAULT_HOME_VISUALS.backgroundIntensity).trim().toLowerCase();
        return BACKGROUND_INTENSITIES.some((item) => item.key === stored) ? stored : 'standard';
    }

    function setBackgroundIntensity(level, persist) {
        const nextLevel = BACKGROUND_INTENSITIES.some((item) => item.key === level) ? level : 'standard';
        document.body.dataset.luxBackgroundIntensity = nextLevel;
        if (persist) {
            localStorage.setItem('kiuLuxuryBackgroundIntensity', nextLevel);
            setDashboardVisuals({ backgroundIntensity: nextLevel });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
        showToast(`Motion intensity: ${BACKGROUND_INTENSITIES.find((item) => item.key === nextLevel)?.label || nextLevel}`);
    }

    function getGlowStrength() {
        const stored = String(getDashboardVisuals().glowStrength || DEFAULT_HOME_VISUALS.glowStrength).trim().toLowerCase();
        return GLOW_STRENGTHS.some((item) => item.key === stored) ? stored : 'balanced';
    }

    function setGlowStrength(level, persist) {
        const nextLevel = GLOW_STRENGTHS.some((item) => item.key === level) ? level : 'balanced';
        document.body.dataset.luxGlowStrength = nextLevel;
        if (persist) {
            localStorage.setItem('kiuLuxuryGlowStrength', nextLevel);
            setDashboardVisuals({ glowStrength: nextLevel });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
        showToast(`Glow: ${GLOW_STRENGTHS.find((item) => item.key === nextLevel)?.label || nextLevel}`);
    }

    const DEFAULT_STUDIO_MIXER = {
        hA: 30,
        sA: 72,
        lA: 48,
        hB: 45,
        sB: 80,
        lB: 58,
        ratio: 50
    };

    function clampNumber(value, min, max, fallback) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(max, Math.max(min, numeric));
    }

    function sanitizeStudioMixerState(value) {
        const source = value || {};
        return {
            hA: clampNumber(source.hA, 0, 360, DEFAULT_STUDIO_MIXER.hA),
            sA: clampNumber(source.sA, 0, 100, DEFAULT_STUDIO_MIXER.sA),
            lA: clampNumber(source.lA, 20, 80, DEFAULT_STUDIO_MIXER.lA),
            hB: clampNumber(source.hB, 0, 360, DEFAULT_STUDIO_MIXER.hB),
            sB: clampNumber(source.sB, 0, 100, DEFAULT_STUDIO_MIXER.sB),
            lB: clampNumber(source.lB, 20, 80, DEFAULT_STUDIO_MIXER.lB),
            ratio: clampNumber(source.ratio, 0, 100, DEFAULT_STUDIO_MIXER.ratio)
        };
    }

    function getStudioMixerState() {
        const stateMixer = getDashboardVisuals().mixerState;
        if (stateMixer) {
            return sanitizeStudioMixerState(stateMixer);
        }
        try {
            const raw = localStorage.getItem('kiuLuxuryMixerState');
            return sanitizeStudioMixerState(raw ? JSON.parse(raw) : DEFAULT_STUDIO_MIXER);
        } catch (e) {
            return { ...DEFAULT_STUDIO_MIXER };
        }
    }

    function setStudioMixerState(state, persist) {
        const nextState = sanitizeStudioMixerState(state);
        if (persist) {
            localStorage.setItem('kiuLuxuryMixerState', JSON.stringify(nextState));
            setDashboardVisuals({ mixerState: nextState });
        }
        return nextState;
    }

    function readStudioMixerInputs() {
        return sanitizeStudioMixerState({
            hA: document.getElementById('lux-hA')?.value,
            sA: document.getElementById('lux-sA')?.value,
            lA: document.getElementById('lux-lA')?.value,
            hB: document.getElementById('lux-hB')?.value,
            sB: document.getElementById('lux-sB')?.value,
            lB: document.getElementById('lux-lB')?.value,
            ratio: document.getElementById('lux-mix-ratio')?.value
        });
    }

    function writeStudioMixerInputs(state) {
        const nextState = sanitizeStudioMixerState(state);
        const bindings = {
            'lux-hA': nextState.hA,
            'lux-sA': nextState.sA,
            'lux-lA': nextState.lA,
            'lux-hB': nextState.hB,
            'lux-sB': nextState.sB,
            'lux-lB': nextState.lB,
            'lux-mix-ratio': nextState.ratio
        };
        Object.entries(bindings).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = String(value);
        });
        return nextState;
    }

    const getRoleStats = (...args) => window.getRoleStats(...args);
    const getDomainSafe = (...args) => window.getDomainSafe(...args);
    const cleanupUiText = (...args) => window.cleanupUiText(...args);
    const parseTimeMinutes = (...args) => window.parseTimeMinutes(...args);
    const formatRelativeTime = (...args) => window.formatRelativeTime(...args);
    const getTermLabel = (...args) => window.getTermLabel(...args);
    const getSubjectLabel = (...args) => window.getSubjectLabel(...args);
    const sortScheduleItems = (...args) => window.sortScheduleItems(...args);
    const getOrdersSnapshot = (...args) => window.getOrdersSnapshot(...args);
    const getStudentPerformanceMetric = (...args) => window.getStudentPerformanceMetric(...args);
    const getNotificationSnapshot = (...args) => window.getNotificationSnapshot(...args);
    const getRecentHomeUpdates = (...args) => window.getRecentHomeUpdates(...args);
    const getMessengerSnapshot = (...args) => window.getMessengerSnapshot(...args);
    const getStudentScheduleRows = (...args) => window.getStudentScheduleRows(...args);
    const getFacultyScheduleRows = (...args) => window.getFacultyScheduleRows(...args);
    const formatCountLabel = (...args) => window.formatCountLabel(...args);
    const getRoleActions = (...args) => window.getRoleActions(...args);
    const getRoleShortcuts = (...args) => window.getRoleShortcuts(...args);
    const buildHomeModel = (...args) => window.buildHomeModel(...args);
    const buildHomeContext = (...args) => window.buildHomeContext(...args);

    function normalizeWidgetSpan(value, fallback = 6) {
        const allowed = [3, 4, 6, 8, 12];
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return allowed.reduce((closest, option) => (
            Math.abs(option - numeric) < Math.abs(closest - numeric) ? option : closest
        ), fallback);
    }

    function getRoleDefaultWidgetOrder(role) {
        const map = {
            student: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2'],
            professor: ['alert', 'hero', 'quick', 'summary', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            ta: ['alert', 'hero', 'summary', 'quick', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            admin: ['alert', 'hero', 'admin-ops', 'summary', 'focus', 'updates', 'quick', 'column-0', 'column-1', 'column-2'],
            student_service: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2']
        };
        return map[role] || map.student;
    }

    function sortWidgetsForRole(widgets, role) {
        const order = getRoleDefaultWidgetOrder(role);
        return (widgets || []).slice().sort((a, b) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return String(a.label || a.id).localeCompare(String(b.label || b.id));
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }

    function getShortcutDestinationOptions(role = getEffectiveRole()) {
        const allowed = typeof getAllowedPagesForRole === 'function'
            ? Array.from(getAllowedPagesForRole(role) || [])
            : Object.keys(PAGE_LABELS);
        return allowed
            .filter((pageId) => PAGE_LABELS[pageId] && pageId !== 'home')
            .map((pageId) => ({ pageId, label: PAGE_LABELS[pageId] }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    function sanitizeShortcutDefinition(definition, role = getEffectiveRole()) {
        if (!definition || typeof definition !== 'object') return null;
        const destinations = getShortcutDestinationOptions(role).map((item) => item.pageId);
        const fallbackPage = destinations[0] || 'home';
        const pageId = destinations.includes(definition.pageId) ? definition.pageId : fallbackPage;
        return {
            id: String(definition.id || `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            type: 'shortcut',
            pageId,
            label: cleanupUiText(definition.label, 'Custom Shortcut').slice(0, 48),
            copy: cleanupUiText(definition.copy, 'Open this workspace quickly from your dashboard.').slice(0, 120),
            icon: cleanupUiText(definition.icon, 'fas fa-link'),
            tone: ['warm', 'royal', 'support', 'ink', 'calm', 'default'].includes(definition.tone) ? definition.tone : 'default',
            meta: cleanupUiText(definition.meta, 'Shortcut').slice(0, 32),
            status: cleanupUiText(definition.status, 'Open workspace').slice(0, 48),
            progress: clampPercent(definition.progress ?? 58, 58),
            span: normalizeWidgetSpan(definition.span, 4),
            visible: definition.visible !== false,
            removable: true,
            custom: true,
            critical: false
        };
    }

    function getSavedCustomShortcuts(role = getEffectiveRole()) {
        const items = getDashboardPreferenceEntry().customShortcutsByRole?.[role];
        if (!Array.isArray(items)) return [];
        return items.map((item) => sanitizeShortcutDefinition(item, role)).filter(Boolean);
    }

    function resolveHomeLayout(role, model, overrideLayout = null, overrideShortcuts = null) {
        const resolved = [];
        const shortcuts = Array.isArray(overrideShortcuts)
            ? overrideShortcuts.map((item) => sanitizeShortcutDefinition(item, role)).filter(Boolean)
            : getSavedCustomShortcuts(role);
        const baseWidgets = buildHomeWidgetDefinitions(role, model, shortcuts);
        const widgetMap = new Map(baseWidgets.map((widget) => [widget.id, widget]));
        const savedLayout = Array.isArray(overrideLayout)
            ? overrideLayout
            : getDashboardPreferenceEntry().layoutsByRole?.[role];

        (Array.isArray(savedLayout) ? savedLayout : []).forEach((item) => {
            const base = widgetMap.get(item?.id);
            if (!base) return;
            resolved.push({
                ...base,
                span: normalizeWidgetSpan(item.span, base.span),
                visible: item.visible !== false
            });
            widgetMap.delete(item.id);
        });

        sortWidgetsForRole(Array.from(widgetMap.values()), role).forEach((widget) => {
            resolved.push({
                ...widget,
                span: normalizeWidgetSpan(widget.span, widget.span),
                visible: widget.visible !== false
            });
        });
        const allowedShortcutIds = new Set(shortcuts.map((item) => item.id));
        return resolved.filter((widget) => widget.type !== 'shortcut' || allowedShortcutIds.has(widget.id));
    }

    function serializeHomeLayout(layout) {
        return (layout || []).map((widget) => ({
            id: widget.id,
            span: normalizeWidgetSpan(widget.span, 6),
            visible: widget.visible !== false
        }));
    }

    function serializeCustomShortcuts(shortcuts, role = getEffectiveRole()) {
        return (shortcuts || [])
            .map((item) => sanitizeShortcutDefinition(item, role))
            .filter(Boolean)
            .map((item) => ({
                id: item.id,
                pageId: item.pageId,
                label: item.label,
                copy: item.copy,
                icon: item.icon,
                tone: item.tone,
                meta: item.meta,
                status: item.status,
                progress: item.progress,
                span: item.span,
                visible: item.visible !== false
            }));
    }

    function getWorkingHomeLayout(role, model) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role && Array.isArray(HOME_EDITOR_STATE.draftLayout)) {
            return HOME_EDITOR_STATE.draftLayout;
        }
        return resolveHomeLayout(role, model);
    }

    function ensureHomeEditorDraft(role, model) {
        HOME_EDITOR_STATE.editing = true;
        HOME_EDITOR_STATE.role = role;
        HOME_EDITOR_STATE.draftCustomShortcuts = getSavedCustomShortcuts(role);
        HOME_EDITOR_STATE.draftLayout = resolveHomeLayout(role, model, null, HOME_EDITOR_STATE.draftCustomShortcuts).map((item) => ({ ...item }));
    }

    function openHomeEditor(role = getEffectiveRole(), model = buildHomeModel(role)) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role) {
            stopHomeEditor({ refresh: true });
            return;
        }
        if (typeof window.buildHomeWidgetDefinitions !== 'function') {
            ensureLuxuryHomeDashboardBundle().then((loaded) => {
                if (!loaded || typeof window.buildHomeWidgetDefinitions !== 'function') return;
                openHomeEditor(role, model);
            }).catch(() => null);
            return;
        }
        ensureHomeEditorDraft(role, model);
        applyPortalPageState();
        renderHomeShell();
        if (typeof syncTopbar === 'function') syncTopbar();
    }

    function stopHomeEditor({ message = '', refresh = true } = {}) {
        clearHomeEditorState();
        if (message) showToast(message);
        if (refresh) {
            applyPortalPageState();
            renderHomeShell();
            if (typeof syncTopbar === 'function') syncTopbar();
        }
    }

    function saveHomeEditor(role) {
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByRole[role] = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
            entry.customShortcutsByRole[role] = serializeCustomShortcuts(HOME_EDITOR_STATE.draftCustomShortcuts, role);
        }, { persist: true });
        stopHomeEditor({ message: `${ROLE_LABELS[role] || 'Dashboard'} saved.` });
        syncAll();
    }

    function resetCurrentRoleLayoutDraft(role, model) {
        HOME_EDITOR_STATE.draftCustomShortcuts = [];
        HOME_EDITOR_STATE.draftLayout = resolveHomeLayout(role, model, [], []).map((item) => ({ ...item }));
        renderHomeShell();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset to default layout.`);
    }

    function updateDraftWidget(id, mutator) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout)) return;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.id !== id) return widget;
            const next = { ...widget };
            mutator(next);
            next.span = normalizeWidgetSpan(next.span, widget.span);
            return next;
        });
        renderHomeShell();
    }

    function moveDraftWidget(sourceId, targetId) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout) || sourceId === targetId) return;
        const next = HOME_EDITOR_STATE.draftLayout.slice();
        const fromIndex = next.findIndex((widget) => widget.id === sourceId);
        const toIndex = next.findIndex((widget) => widget.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return;
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        HOME_EDITOR_STATE.draftLayout = next;
        renderHomeShell();
    }

    function hideDraftWidget(widget) {
        if (!widget) return;
        if (widget.critical && !window.confirm(`Hide "${widget.label}" from this role dashboard? You can restore it later from Add Widgets.`)) return;
        if (widget.type === 'shortcut') {
            HOME_EDITOR_STATE.draftCustomShortcuts = HOME_EDITOR_STATE.draftCustomShortcuts.filter((item) => item.id !== widget.id);
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.filter((item) => item.id !== widget.id);
        } else {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((item) => (
                item.id === widget.id ? { ...item, visible: false } : item
            ));
        }
        renderHomeShell();
    }

    function restoreDraftWidget(widgetId, role, model) {
        const defaults = buildHomeWidgetDefinitions(role, model);
        const found = defaults.find((item) => item.id === widgetId);
        if (!found) return;
        const existing = HOME_EDITOR_STATE.draftLayout.find((item) => item.id === widgetId);
        if (existing) {
            updateDraftWidget(widgetId, (widget) => {
                widget.visible = true;
                widget.span = found.span;
            });
            return;
        }
        HOME_EDITOR_STATE.draftLayout.push({ ...found, visible: true });
        renderHomeShell();
    }

    function createDraftShortcut(role, values) {
        const shortcut = sanitizeShortcutDefinition(values, role);
        if (!shortcut) return;
        HOME_EDITOR_STATE.draftCustomShortcuts = [...HOME_EDITOR_STATE.draftCustomShortcuts, shortcut];
        HOME_EDITOR_STATE.draftLayout.push({ ...shortcut });
        renderHomeShell();
        showToast(`Added shortcut: ${shortcut.label}`);
    }

    function ensureShell() {
        if (!document.getElementById('lux-bg-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'lux-bg-canvas';
            document.body.prepend(canvas);
        }

        if (!document.getElementById('lux-bg-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'lux-bg-overlay';
            document.body.prepend(overlay);
        }

        if (!document.getElementById('lux-shell')) {
            const shell = document.createElement('aside');
            shell.id = 'lux-shell';
            shell.innerHTML = `
                <div class="lux-brand">
                    <div class="lux-brand-mark">K</div>
                    <div>
                        <div class="lux-brand-name">KIU</div>
                        <div class="lux-brand-sub">Integrated Campus Portal</div>
                    </div>
                </div>
                <div class="lux-nav" id="lux-nav"></div>
                <div class="lux-shell-footer">
                    <div class="lux-avatar" id="lux-avatar">KI</div>
                    <div style="min-width:0;">
                        <div class="lux-user-name" id="lux-user-name">Portal User</div>
                        <div class="lux-user-role" id="lux-user-role">University Portal</div>
                    </div>
                </div>
            `;
            document.body.appendChild(shell);
        }

        if (!document.getElementById('lux-topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'lux-topbar';
            topbar.innerHTML = `
                <div class="lux-topbar-shell">
                    <div class="lux-topbar-main">
                        <button class="lux-secondary-btn lux-sidebar-toggle-btn" id="lux-sidebar-toggle" type="button" aria-pressed="false" title="Hide navigation">
                            <i class="fas fa-sidebar"></i>
                            <span class="lux-sidebar-toggle-label">Hide nav</span>
                        </button>
                        <div class="lux-breadcrumb">KIU <i class="fas fa-chevron-right"></i> <strong id="lux-breadcrumb-page">Dashboard</strong></div>
                        <div class="lux-search">
                            <i class="fas fa-search"></i>
                            <input id="lux-search-input" type="text" placeholder="Search modules, staff, documents, requests...">
                        </div>
                    </div>
                    <div class="lux-topbar-spacer"></div>
                    <div class="lux-topbar-actions">
                        <div class="lux-picker-wrap" data-picker-wrap="faculty">
                            <button class="lux-picker-btn" id="lux-faculty-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">Faculty</span>
                                <strong id="lux-faculty-picker-value">Faculty</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="lux-picker-wrap" data-picker-wrap="role">
                            <button class="lux-picker-btn" id="lux-role-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">View</span>
                                <strong id="lux-role-picker-value">Portal View</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <button class="lux-secondary-btn lux-topbar-editor-btn" id="lux-dashboard-edit-btn" type="button" hidden title="Customize the home dashboard">
                            <i class="fas fa-sliders-h"></i>
                            <span id="lux-dashboard-edit-label">Customize</span>
                        </button>
                        <button class="lux-icon-btn" id="lux-palette-btn" type="button" title="Open colour and motion studio">
                            <i class="fas fa-palette"></i>
                        </button>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn" id="lux-notification-btn" type="button" title="Notifications">
                                <i class="far fa-bell"></i>
                                <span class="lux-icon-badge" id="lux-notification-badge">0</span>
                            </button>
                        </div>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn" id="lux-chat-btn" type="button" title="Messenger">
                                <i class="fas fa-comments"></i>
                                <span class="lux-icon-badge" id="lux-chat-badge">0</span>
                            </button>
                        </div>
                        <button class="lux-user-chip" id="lux-user-chip" type="button">
                            <span class="lux-avatar" id="lux-chip-avatar">KI</span>
                            <span class="lux-user-chip-copy">
                                <span id="lux-chip-name">Portal</span>
                                <small id="lux-chip-role">Dashboard</small>
                            </span>
                            <i class="fas fa-chevron-down" style="font-size:10px;color:var(--lux-text-soft)"></i>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(topbar);
        }
        applySidebarState();
    }

    function ensureHomeShell() {
        const pageHome = document.getElementById('page-home');
        if (!pageHome) return null;
        let homeShell = document.getElementById('lux-home-shell');
        if (!homeShell) {
            homeShell = document.createElement('div');
            homeShell.id = 'lux-home-shell';
        }
        Array.from(pageHome.children).forEach((child) => {
            if (child !== homeShell) child.remove();
        });
        if (homeShell.parentElement !== pageHome || pageHome.firstElementChild !== homeShell) {
            pageHome.prepend(homeShell);
        }
        return homeShell;
    }

    /* Route-owned admin tools luxury bundle loader */
    let renderLuxuryAdminToolsPage = function ensureLuxuryAdminToolsPageRender() {
        if (!isLuxuryAdminToolsRoute() || window.__kiuLuxuryAdminToolsDashboardLoaded === true) return;
        ensureLuxuryAdminToolsBundle().then((loaded) => {
            if (loaded) renderLuxuryAdminToolsPage();
        });
    };
    let __luxAdminToolsBundlePromise = null;

    function isLuxuryAdminToolsRoute() {
        return getActivePageId() === 'admin-tools' || document.body?.classList?.contains('lux-route-admin-tools');
    }

    window.__kiuLuxuryAdminToolsChunkBase64 = window.__kiuLuxuryAdminToolsChunkBase64 || '';
    window.__kiuRegisterLuxuryAdminToolsChunk = function registerLuxuryAdminToolsChunk(base64Source) {
        window.__kiuLuxuryAdminToolsChunkBase64 = String(base64Source || '');
    };

    function ensureLuxuryAdminToolsBundle() {
        if (!isLuxuryAdminToolsRoute()) return Promise.resolve(false);
        if (window.__kiuLuxuryAdminToolsDashboardLoaded === true) return Promise.resolve(true);
        if (__luxAdminToolsBundlePromise) return __luxAdminToolsBundlePromise;
        __luxAdminToolsBundlePromise = Promise.resolve().then(() => {
            const encoded = String(window.__kiuLuxuryAdminToolsChunkBase64 || '').trim();
            if (!encoded) return false;
            eval(decodeLuxuryHomeChunkSource(encoded));
            window.__kiuLuxuryAdminToolsDashboardLoaded = true;
            return true;
        }).then((loaded) => {
            if (!loaded) return false;
            return true;
        }).catch((error) => {
            console.error('Failed to load route-owned admin tools luxury bundle.', error);
            return false;
        }).finally(() => {
            __luxAdminToolsBundlePromise = null;
        });
        return __luxAdminToolsBundlePromise;
    }

    Object.assign(window, {
        ROLE_LABELS,
        PAGE_LABELS,
        NAV_BY_ROLE,
        STUDIO_PALETTES,
        BACKGROUND_MODES,
        BACKGROUND_INTENSITIES,
        GLOW_STRENGTHS,
        DEFAULT_STUDIO_MIXER,
        HOME_EDITOR_STATE,
        isBuiltInLuxuryPaletteKey,
        buildStudioPaletteCustomColors,
        studioPaletteMatchesMixer,
        getCurrentUserSafe,
        getEffectiveRole,
        getShellRole,
        getCurrentFacultyCode,
        getFacultyName,
        getUserName,
        getUserInitials,
        pageLabel,
        mixHsl,
        hslToRgb,
        getThemeMode,
        isHomeEditorAvailable,
        openHomeEditor,
        getDashboardVisuals,
        setDashboardVisuals,
        resolveCustomPalette,
        resolvePaletteKey,
        applyPaletteKey,
        applyCustomPalette,
        applyThemeMode,
        getBackgroundMode,
        areBackgroundAnimationsEnabled,
        setBackgroundAnimationsEnabled,
        setBackgroundMode,
        getBackgroundIntensity,
        setBackgroundIntensity,
        getGlowStrength,
        setGlowStrength,
        sanitizeStudioMixerState,
        getStudioMixerState,
        setStudioMixerState,
        readStudioMixerInputs,
        writeStudioMixerInputs,
        syncVisualStateOnly,
        syncAll,
        getNotificationSnapshot,
        getMessengerSnapshot,
        buildHomeModel
    });

    const shellChrome = () => window;
    const closeUtilityPanels = (...args) => shellChrome().closeUtilityPanels?.(...args);
    const closePickerPanels = (...args) => shellChrome().closePickerPanels?.(...args);
    const closeUserMenu = (...args) => shellChrome().closeUserMenu?.(...args);
    const renderNav = (...args) => shellChrome().renderNav?.(...args);
    const populateFacultySwitcher = (...args) => shellChrome().populateFacultySwitcher?.(...args);
    const populateRoleSwitcher = (...args) => shellChrome().populateRoleSwitcher?.(...args);
    let syncTopbar = (...args) => shellChrome().syncTopbar?.(...args);
    const syncStudioUi = (...args) => shellChrome().syncStudioUi?.(...args);
    const bindUserMenu = (...args) => shellChrome().bindUserMenu?.(...args);
    const bindTopbarControls = (...args) => shellChrome().bindTopbarControls?.(...args);
    const enhanceUniversalPickers = (...args) => shellChrome().enhanceUniversalPickers?.(...args);

    const LUX_HEAVY_SCROLL_SURFACE_SELECTOR = [
        '.lux-grid-widget',
        '.lux-card',
        '.lux-panel',
        '.surface-card',
        '.content-box',
        '.social-neo-post-card',
        '.social-neo-card',
        '.social-neo-alert',
        '.social-neo-chat-item',
        '.social-neo-directory-item',
        '.social-neo-entity-card',
        '.social-neo-event-card',
        '.social-neo-message',
        '.social-neo-comment-bubble',
        '.social-neo-empty',
        '.lms-clean-subject-card',
        '.lms-clean-metric-card',
        '.lms-clean-stat',
        '.lms-clean-signal-panel',
        '.lms-clean-mini',
        '.lms-clean-empty',
        '.lms-banner',
        '.lux-lms-group-card',
        '.newsx-panel',
        '.newsx-hero',
        '.newsx-feed-card',
        '.newsx-filter',
        '.newsx-section',
        '.newsx-stat',
        '.newsx-private-item',
        '.newsx-account-card',
        '.newsx-section-btn',
        '.student-service-summary-card',
        '.student-service-ticket-stat',
        '.student-service-home-card',
        '.student-service-track-card',
        '.student-service-lane-card',
        '.student-service-ticket-card',
        '.student-service-ops-card',
        '.student-service-home-panel',
        '.student-service-article-card',
        '.student-service-ticket-row',
        '.student-service-home-ticket',
        '.student-service-home-topic',
        '.student-service-ops-ticket',
        '.student-service-hero',
        '.student-service-hero-aside',
        '.student-service-hero-aside-stat',
        '.student-service-canvas',
        '.student-service-zone',
        '.student-service-lane-choice-card',
        '.registration-hero',
        '.registration-workspace',
        '.registration-insight-card',
        '.registration-focus-card',
        '.registration-state-card',
        '.registration-module-list-card',
        '.registration-module-pane-card',
        '.registration-track-card',
        '.registration-mini-metric',
        '.registration-course-row',
        '.registration-module-choice',
        '.registration-track-group',
        '.lux-admin-op-card',
        '.lux-admin-ops-panel',
        '.lux-admin-provision-card',
        '.admin-reg-tab',
        '#admin-reg-content-container',
        '#curriculum-library-modules-root',
        '.career-history-item',
        '.career-provider-route-card',
        '.career-intake-check',
        '.career-review-item',
        '.career-agent-log',
        '.career-agent-output',
        '.career-agent-node',
        '.career-agent-mini',
        '.career-wizard-card',
        '.career-report-workspace',
        '.orders-item',
        '.orders-detail-card',
        '.orders-metric-card',
        '.student-service-ticket-card',
        '.student-service-ticket-row',
        '.student-service-article-card',
        '.student-service-home-ticket',
        '.student-service-track-card',
        '.student-service-ops-ticket',
        '.ex2-card',
        '.ex2-question-card',
        '.ex2-review-card'
    ].join(', ');

    let __luxHeavySurfaceObserver = null;
    let __luxHeavySurfaceRefreshTimer = null;

    function refreshHeavySurfaceObservation() {
        if (!('IntersectionObserver' in window) || !document.body) return;
        if (!__luxHeavySurfaceObserver) {
            __luxHeavySurfaceObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry?.target?.dataset) return;
                    entry.target.dataset.luxOffscreen = entry.isIntersecting ? '0' : '1';
                });
            }, {
                root: null,
                rootMargin: '300px 0px 300px 0px',
                threshold: 0.01
            });
        }
        document.querySelectorAll(LUX_HEAVY_SCROLL_SURFACE_SELECTOR).forEach((node) => {
            if (!node || node.dataset.luxObservedSurface === '1') return;
            node.dataset.luxObservedSurface = '1';
            node.dataset.luxOffscreen = '0';
            __luxHeavySurfaceObserver.observe(node);
        });
    }

    function queueHeavySurfaceObservationRefresh() {
        if (__luxHeavySurfaceRefreshTimer) window.clearTimeout(__luxHeavySurfaceRefreshTimer);
        __luxHeavySurfaceRefreshTimer = window.setTimeout(() => {
            __luxHeavySurfaceRefreshTimer = null;
            const runner = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
            runner(() => refreshHeavySurfaceObservation(), { timeout: 600 });
        }, 120);
    }
    const observeUniversalPickers = (...args) => shellChrome().observeUniversalPickers?.(...args);

    function showToast(message) {
        let toast = document.getElementById('lux-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lux-toast';
            toast.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:80;padding:12px 16px;border-radius:14px;background:rgba(11,15,27,0.92);border:1px solid rgba(255,255,255,0.12);color:#f5f1e8;box-shadow:0 18px 45px rgba(0,0,0,0.36);font-size:12px;backdrop-filter:blur(14px);opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        clearTimeout(window.__luxToastTimer);
        window.__luxToastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
        }, 1600);
    }

    function wrapFunction(name, callback) {
        const original = window[name];
        if (typeof original !== 'function' || original.__luxWrapped) return;
        const wrapped = function (...args) {
            const result = original.apply(this, args);
            window.requestAnimationFrame(() => callback(args, result));
            return result;
        };
        wrapped.__luxWrapped = true;
        window[name] = wrapped;
    }

    const LUX_LEGACY_VISUAL_SELECTOR = [
        '[style]',
        '.content-box',
        '.surface-card',
        '.page-card',
        '.section-card',
        '.panel-card',
        '.kiu-card',
        '.dashboard-card',
        '.tabs-container',
        '.modal-content',
        '.page-hero',
        '.accordion-item',
        '.kiu-table',
        'table',
        '.kiu-btn',
        '.kiu-btn-outline',
        '.kiu-btn-blue',
        '.kiu-btn-primary',
        '.kiu-btn-solid',
        '.tab',
        '.reg-tab',
        '.pv-tab',
        '.nav-item',
        'input',
        'select',
        'textarea',
        'button',
        'a'
    ].join(',');

    const LUX_LEGACY_VISUAL_VALUE_PATTERN = /(var\(--kiu|#fff|#ffffff|#f8f9fa|#f8fafc|#f1f5f9|#eef2ff|#eff6ff|#e2e8f0|#cbd5e1|#94a3b8|#64748b|#475569|#334155|#1e3a8a|#2563eb|#3b82f6|#10b981|#168b66|#dc2626|white|black|rgba?\([^)]*(255|248|245|37|59|92|220|38|130|139)[^)]*\))/i;
    const LUX_LEGACY_SURFACE_CLASS_PATTERN = /\b(content-box|surface-card|page-card|section-card|panel-card|kiu-card|dashboard-card|tabs-container|modal-content|page-hero|accordion-item|filter-shell|library-catalog-card|library-filter-shell|pv-(left|right|meta|stat)|sch-(sidebar|main|modal|grid-wrap|toolbar|day-col|time-col)|admin-card)\b/i;
    const LUX_LEGACY_PILL_CLASS_PATTERN = /\b(pill|badge|chip|tag|status)\b/i;
    const LUX_LEGACY_TAB_CLASS_PATTERN = /\b(tab|reg-tab|pv-tab|nav-item)\b/i;
    const LUX_LEGACY_BUTTON_CLASS_PATTERN = /\b(kiu-btn|sch-btn|pv-action-btn|lux-primary-btn|lux-secondary-btn|lux-ghost-btn)\b/i;
    const LUX_LEGACY_VISUAL_PROPS = new Set([
        'background',
        'background-color',
        'color',
        'border',
        'border-color',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'box-shadow',
        'backdrop-filter',
        '-webkit-backdrop-filter'
    ]);

    function getLuxuryPerformanceTier(reducedMotion = false) {
        if (reducedMotion) return 'efficient';
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const memory = Number(navigator.deviceMemory || 0);
        const cores = Number(navigator.hardwareConcurrency || 0);
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        if ((memory && memory <= 4) || (cores && cores <= 4) || (coarsePointer && viewportWidth < 960)) {
            return 'efficient';
        }
        // Be conservative on laptops: if deviceMemory is unavailable, do not assume
        // the machine can afford the highest GPU/blur/background profile.
        if (memory >= 8 && cores >= 8 && !coarsePointer && viewportWidth >= 1280) {
            return 'high';
        }
        return 'standard';
    }

    function getLuxuryBackgroundRenderProfile(reducedMotion = false) {
        const tier = getLuxuryPerformanceTier(reducedMotion);
        if (tier === 'efficient') {
            return {
                tier,
                pixelRatioCap: 1,
                frameInterval: reducedMotion ? 140 : 90,
                glassBlur: 14,
                transparencyBlur: 12,
                transparencySaturate: '124%',
                glassAlpha: '0.052',
                utilityAlpha: '0.8',
                cardGlowAlpha: '0.05'
            };
        }
        if (tier === 'high') {
            return {
                tier,
                pixelRatioCap: 1.5,
                frameInterval: reducedMotion ? 80 : 42,
                glassBlur: 20,
                transparencyBlur: 18,
                transparencySaturate: '148%',
                glassAlpha: '0.068',
                utilityAlpha: '0.84',
                cardGlowAlpha: '0.07'
            };
        }
        return {
            tier,
            pixelRatioCap: 1.25,
            frameInterval: reducedMotion ? 100 : 56,
            glassBlur: 18,
            transparencyBlur: 16,
            transparencySaturate: '138%',
            glassAlpha: '0.06',
            utilityAlpha: '0.82',
            cardGlowAlpha: '0.06'
        };
    }

    function applyLuxuryPerformanceProfile() {
        if (!document.body) return;
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const profile = getLuxuryBackgroundRenderProfile(reducedMotion);
        const root = document.documentElement;
        document.body.dataset.luxPerformance = profile.tier;
        root.style.setProperty('--lux-glass-blur', `${profile.glassBlur}px`);
        root.style.setProperty('--lux-transparency-blur', `${profile.transparencyBlur}px`);
        root.style.setProperty('--lux-transparency-saturate', profile.transparencySaturate);
        root.style.setProperty('--lux-glass-alpha', profile.glassAlpha);
        root.style.setProperty('--lux-utility-alpha', profile.utilityAlpha);
        root.style.setProperty('--lux-card-glow-alpha', profile.cardGlowAlpha);
        root.style.setProperty('--lux-canvas-pixel-ratio-cap', `${profile.pixelRatioCap}`);
        root.style.setProperty('--lux-canvas-frame-interval', `${profile.frameInterval}`);
    }

    function hasLegacyVisualValue(value = '') {
        return LUX_LEGACY_VISUAL_VALUE_PATTERN.test(String(value || '').toLowerCase());
    }

    function resolveLegacyTone(value = '') {
        const normalized = String(value || '').toLowerCase();
        if (/(dc2626|fee2e2|fca5a5|red|danger|error)/.test(normalized)) return 'danger';
        if (/(10b981|168b66|34d399|green|success|emerald|done)/.test(normalized)) return 'success';
        if (/(f59e0b|d97706|fbbf24|amber|orange|warn|warning)/.test(normalized)) return 'warn';
        if (/(64748b|94a3b8|slate|muted|secondary|ghost)/.test(normalized)) return 'secondary';
        return 'primary';
    }

    function shouldSkipLegacyVisualNode(node) {
        if (!node || node.nodeType !== 1) return true;
        if (/^(SCRIPT|STYLE|LINK|META|TITLE|NOSCRIPT|CANVAS|SVG|PATH)$/.test(node.tagName)) return true;
        if (node.closest('.lux-timetable-page, .social-neo')) return true;
        return Boolean(node.closest('#lux-shell, #lux-topbar, #lux-studio-backdrop, #mobile-bottom-nav, #mobile-action-sheet, #lux-home-shell, .lux-picker-panel'));
    }

    function sanitizeLegacyVisualInlineStyle(styleText, options = {}) {
        const text = String(styleText || '').trim();
        if (!text) return '';
        const next = [];
        text.split(';').forEach((entry) => {
            const part = entry.trim();
            if (!part) return;
            const colonIndex = part.indexOf(':');
            if (colonIndex === -1) {
                next.push(part);
                return;
            }
            const prop = part.slice(0, colonIndex).trim().toLowerCase();
            const value = part.slice(colonIndex + 1).trim();
            const shouldStrip = LUX_LEGACY_VISUAL_PROPS.has(prop) || prop.startsWith('border-');
            if (shouldStrip && (options.stripAllVisuals || hasLegacyVisualValue(value))) return;
            next.push(`${prop}: ${value}`);
        });
        return next.join('; ');
    }

    function decorateLegacyVisualNode(node) {
        if (shouldSkipLegacyVisualNode(node)) return;
        if (
            document.body.classList.contains('lux-route-students-admin') &&
            (node.id === 'students-content' || node.closest?.('#students-content'))
        ) {
            return;
        }
        const className = typeof node.className === 'string' ? node.className : '';
        const styleText = node.getAttribute('style') || '';
        const combinedVisualHint = `${className} ${styleText}`;
        const tone = resolveLegacyTone(combinedVisualHint);
        const tagName = node.tagName;
        const inputType = (node.getAttribute('type') || '').toLowerCase();
        const isField = /^(INPUT|SELECT|TEXTAREA)$/.test(tagName) && !/^(checkbox|radio|range|color|file|hidden)$/i.test(inputType);
        const isButton = /^(BUTTON|A)$/.test(tagName) || LUX_LEGACY_BUTTON_CLASS_PATTERN.test(className);
        const isTab = node.getAttribute('role') === 'tab' || LUX_LEGACY_TAB_CLASS_PATTERN.test(className);
        const isTable = tagName === 'TABLE' || /\bkiu-table\b/i.test(className);
        const isPill = !isButton && LUX_LEGACY_PILL_CLASS_PATTERN.test(className);
        const isSurface = !isField && !isButton && !isTab && !isTable && (
            LUX_LEGACY_SURFACE_CLASS_PATTERN.test(className)
            || (/^(DIV|SECTION|ARTICLE|LI|UL|OL|FIELDSET|FORM|MAIN|ASIDE|HEADER)$/.test(tagName) && /(background|box-shadow|border|backdrop-filter)/i.test(styleText))
        );
        if (isField) node.classList.add('lux-modern-field');
        if (isButton) {
            node.classList.add('lux-modern-button');
            node.dataset.luxButtonTone = tone;
        }
        if (isTab) node.classList.add('lux-modern-tab');
        if (isTable) node.classList.add('lux-modern-table');
        if (isPill) {
            node.classList.add('lux-modern-pill');
            node.dataset.luxTone = tone;
        }
        if (isSurface) {
            node.classList.add('lux-modern-surface');
            node.dataset.luxTone = tone;
        }

        if (styleText) {
            const sanitized = sanitizeLegacyVisualInlineStyle(styleText, {
                stripAllVisuals: isField || isButton || isTab || isSurface || isTable || isPill
            });
            const normalizedOriginal = styleText.trim();
            if (sanitized) {
                if (sanitized !== normalizedOriginal) node.setAttribute('style', sanitized);
            } else if (normalizedOriginal) {
                node.removeAttribute('style');
            }
        }
    }

    function sanitizeLegacyVisualTree(root = document.body) {
        if (!root || !document.body) return;
        document.body.classList.add('lux-unified-shell', 'lux-site-modernized');
        if (root.nodeType === 1) decorateLegacyVisualNode(root);
        if (typeof root.querySelectorAll !== 'function') return;
        root.querySelectorAll(LUX_LEGACY_VISUAL_SELECTOR).forEach((node) => decorateLegacyVisualNode(node));
    }

    let queuedLegacyVisualFrame = null;
    const queuedLegacyVisualRoots = new Set();

    function queueUniqueLegacyVisualRoot(root) {
        if (!root || root.nodeType !== 1) return;
        for (const existingRoot of queuedLegacyVisualRoots) {
            if (!existingRoot || typeof existingRoot.contains !== 'function') continue;
            if (existingRoot === root || existingRoot.contains(root)) {
                return;
            }
            if (typeof root.contains === 'function' && root.contains(existingRoot)) {
                queuedLegacyVisualRoots.delete(existingRoot);
            }
        }
        queuedLegacyVisualRoots.add(root);
    }

    function queueLegacyVisualRefresh(root = document.body) {
        if (!root) return;
        queueUniqueLegacyVisualRoot(root);
        if (queuedLegacyVisualFrame) return;
        const run = () => {
            queuedLegacyVisualFrame = null;
            const roots = Array.from(queuedLegacyVisualRoots);
            queuedLegacyVisualRoots.clear();
            roots.forEach((entry) => sanitizeLegacyVisualTree(entry));
        };
        if (window.__luxIsScrolling || window.__luxIsAnimating) {
            queuedLegacyVisualFrame = window.setTimeout(() => {
                const idleRunner = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 0));
                idleRunner(run, { timeout: 250 });
            }, 120);
            return;
        }
        queuedLegacyVisualFrame = window.requestAnimationFrame(run);
    }

    function observeLegacyVisualTree() {
        if (window.__luxLegacyVisualObserver || !window.MutationObserver || !document.body) return;
        /* PERFORMANCE: Debounce — collect 150ms of DOM changes, then process once */
        let _legacyDebounceTimer = null;
        let _legacyPendingNodes = new Set();
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (!node || node.nodeType !== 1) return;
                    if (
                        !(node.matches && node.matches(LUX_LEGACY_VISUAL_SELECTOR)) &&
                        !(node.querySelector && node.querySelector(LUX_LEGACY_VISUAL_SELECTOR))
                    ) {
                        return;
                    }
                    _legacyPendingNodes.add(node);
                });
            }
            if (!_legacyDebounceTimer) {
                _legacyDebounceTimer = setTimeout(() => {
                    _legacyDebounceTimer = null;
                    const nodes = Array.from(_legacyPendingNodes);
                    _legacyPendingNodes.clear();
                    nodes.forEach((n) => queueLegacyVisualRefresh(n));
                    queueHeavySurfaceObservationRefresh();
                }, 150);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false /* PERF: stop watching style/class — caused feedback loops */
        });
        window.__luxLegacyVisualObserver = observer;
    }

    let queuedShellSyncFrame = null;

    function queueShellSync() {
        if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
        if (queuedShellSyncFrame) return;
        queuedShellSyncFrame = window.requestAnimationFrame(() => {
            queuedShellSyncFrame = null;
            if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
            syncAll();
        });
    }

    function syncLayout() {
        const activePageId = getActivePageId();
        if (activePageId === 'home' || !activePageId) {
            renderHomeShell();
        }
        syncTopbar();
        if (activePageId === 'admin-tools') {
            renderLuxuryAdminToolsPage();
        }
        if (activePageId === 'social') {
            if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
        }
        if (activePageId === 'exams') {
            if (typeof renderExamsPageShellContext === 'function') renderExamsPageShellContext();
            if (getEffectiveRole() !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
                renderAdminExamSection();
            }
        }
        queueHeavySurfaceObservationRefresh();
    }

    function buildTransparencySyncSignature(activePageId, transparencyValue) {
        const visuals = getDashboardVisuals() || {};
        return [
            activePageId || 'home',
            getEffectiveRole(),
            getCurrentFacultyCode(),
            String(transparencyValue || ''),
            visuals.themeMode || getThemeMode(),
            visuals.paletteKey || resolvePaletteKey() || '',
            JSON.stringify(visuals.customPalette || {}),
            HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'
        ].join('|');
    }

    function buildVisualStateSyncSignature() {
        const visuals = getDashboardVisuals() || {};
        return [
            getActivePageId() || 'home',
            getEffectiveRole(),
            getCurrentFacultyCode(),
            visuals.themeMode || getThemeMode(),
            visuals.paletteKey || resolvePaletteKey() || '',
            JSON.stringify(visuals.customPalette || {}),
            visuals.backgroundMode || getBackgroundMode() || '',
            visuals.backgroundIntensity || getBackgroundIntensity() || '',
            visuals.glowStrength || getGlowStrength() || '',
            typeof visuals.backgroundAnimationsEnabled === 'boolean' ? String(visuals.backgroundAnimationsEnabled) : String(areBackgroundAnimationsEnabled())
        ].join('|');
    }

    function syncAll() {
        const activePageId = getActivePageId();
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();
        document.body.dataset.luxBackgroundMode = getBackgroundMode();
        applyPortalPageState();
        closePickerPanels();
        renderNav();
        populateFacultySwitcher();
        populateRoleSwitcher();
        syncLayout();
        syncStudioUi();
        queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
        /* FIX: Re-apply transparency after palette/theme/atmosphere changes
           so inline surface backgrounds recalculate with current accent colors */
        if (typeof updateTransparency === 'function') {
            var _syncTransVal = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
            if (_syncTransVal) {
                var _syncTransparencySignature = buildTransparencySyncSignature(activePageId, _syncTransVal);
                if (window.__luxLastTransparencySyncSignature !== _syncTransparencySignature) {
                    window.__luxLastTransparencySyncSignature = _syncTransparencySignature;
                    updateTransparency(parseInt(_syncTransVal));
                }
            }
        }
    }

    function syncVisualStateOnly() {
        const visualSignature = buildVisualStateSyncSignature();
        if (window.__luxLastVisualStateSyncSignature === visualSignature) {
            return;
        }
        window.__luxLastVisualStateSyncSignature = visualSignature;
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();
        document.body.dataset.luxBackgroundMode = getBackgroundMode();
        syncStudioUi();
        queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
        if (typeof updateTransparency === 'function') {
            const transparencyValue = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
            if (transparencyValue) {
                updateTransparency(parseInt(transparencyValue, 10));
            }
        }
    }

    /* Dashboard Builder Overrides */
    /* Route-owned home dashboard and editor bundle loader */
    let renderDynamicHomeShell = function noopRenderDynamicHomeShell() {};
    let startBackground = function noopStartBackground() {};
    let __luxHomeShellResizeTimer = null;
    let __luxHomeDashboardBundlePromise = null;

    function renderHomeShell() {
        const homeShell = ensureHomeShell();
        if (!homeShell) return;
        if (isLuxuryHomeRoute() && window.__kiuLuxuryHomeDashboardLoaded !== true) {
            if (!homeShell.textContent.trim()) {
                homeShell.innerHTML = `
                    <div class="lux-home-grid is-loading" data-home-loading-shell="1">
                        <section class="lux-card">
                            <div class="lux-card-body" style="display:grid; gap:16px;">
                                <div class="lux-kicker">Dashboard</div>
                                <div class="page-hero-title" style="font-size:clamp(30px,3vw,42px); line-height:1.05;">Preparing your KIU workspace</div>
                                <div class="lux-card-copy">Loading the faculty-scoped home dashboard, recent updates, schedule context, registration status, and quick actions for the active portal role.</div>
                                <div class="lux-pill-row">
                                    <span class="lux-status-pill is-muted"><i class="fas fa-layer-group"></i> Home shell</span>
                                    <span class="lux-status-pill is-muted"><i class="fas fa-bell"></i> Notifications</span>
                                    <span class="lux-status-pill is-muted"><i class="fas fa-calendar-week"></i> Schedule</span>
                                    <span class="lux-status-pill is-muted"><i class="fas fa-user-shield"></i> Role context</span>
                                </div>
                            </div>
                        </section>
                    </div>
                `;
            }
            ensureLuxuryHomeDashboardBundle().then((loaded) => {
                if (loaded) renderHomeShell();
            });
            return;
        }
        renderDynamicHomeShell(homeShell);
    }

    function isLuxuryHomeRoute() {
        return getActivePageId() === 'home' || document.body?.classList?.contains('lux-route-home');
    }

    window.__kiuLuxuryHomeChunkBase64 = window.__kiuLuxuryHomeChunkBase64 || '';
    window.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk(base64Source) {
        window.__kiuLuxuryHomeChunkBase64 = String(base64Source || '');
    };

    function decodeLuxuryHomeChunkSource(base64Source) {
        const binary = window.atob(String(base64Source || ''));
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    }

    function ensureLuxuryHomeDashboardBundle() {
        if (!isLuxuryHomeRoute()) return Promise.resolve(false);
        if (window.__kiuLuxuryHomeDashboardLoaded === true) return Promise.resolve(true);
        if (__luxHomeDashboardBundlePromise) return __luxHomeDashboardBundlePromise;
        __luxHomeDashboardBundlePromise = Promise.resolve().then(() => {
            const encoded = String(window.__kiuLuxuryHomeChunkBase64 || '').trim();
            if (!encoded) return false;
            eval(`${decodeLuxuryHomeChunkSource(encoded)}
window.buildHomeWidgetDefinitions = typeof buildHomeWidgetDefinitions === 'function' ? buildHomeWidgetDefinitions : window.buildHomeWidgetDefinitions;`);
            window.__kiuLuxuryHomeDashboardLoaded = true;
            return true;
        }).then((loaded) => {
            if (!loaded) return false;
            return true;
        }).catch((error) => {
            console.error('Failed to load route-owned home dashboard luxury bundle.', error);
            return false;
        }).finally(() => {
            __luxHomeDashboardBundlePromise = null;
        });
        return __luxHomeDashboardBundlePromise;
    }

    ready(() => {
        window.renderLuxuryAdminToolsPage = (...args) => renderLuxuryAdminToolsPage(...args);
        ensureShell();
        ensureHomeShell();
        bindUserMenu();
        bindTopbarControls();
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();

        wrapFunction('navigate', queueShellSync);
        wrapFunction('switchRole', queueShellSync);
        wrapFunction('switchFacultyTheme', queueShellSync);
        wrapFunction('refreshShellIdentity', queueShellSync);
        window.addEventListener('resize', () => {
            if (__luxHomeShellResizeTimer) window.clearTimeout(__luxHomeShellResizeTimer);
            __luxHomeShellResizeTimer = window.setTimeout(() => {
                __luxHomeShellResizeTimer = null;
                // FIX: Do NOT call syncLayout() or syncAll() here.
                // Rebuilding the DOM (renderHomeShell, renderAdminTools, etc.) on resize causes massive flickering.
                // CSS Grid/Flexbox handles responsive layout natively. 
                syncTopbar(); 
            }, 90);
        });

        const scheduleInitialShellSync = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
        scheduleInitialShellSync(() => {
            const runInitialShellSync = () => {
                syncAll();
                enhanceUniversalPickers(document.querySelector('.page-section.active-page') || document);
                observeUniversalPickers();
                observeLegacyVisualTree();
                queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
                queueHeavySurfaceObservationRefresh();
                startBackground();
            };
            if (isLuxuryHomeRoute()) {
                ensureLuxuryHomeDashboardBundle().finally(runInitialShellSync);
                return;
            }
            runInitialShellSync();
        });
    });



})();

/* ==========================================================================
   SCROLL THROTTLING (GPU PROTECTION)
   ========================================================================== */
(function() {
    let scrollTimeout = null;
    const markScrolling = () => {
        window.__luxIsScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            window.__luxIsScrolling = false;
        }, 150);
    };
    document.addEventListener('scroll', markScrolling, { capture: true, passive: true });
})();
