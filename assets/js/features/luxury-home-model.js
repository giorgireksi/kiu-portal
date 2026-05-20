/* Luxury home dashboard model runtime extracted from index-luxury.js. */

function getRoleStats(role, facultyName) {
    const user = getCurrentUserSafe();
    if (role === 'student') {
        const semester = typeof getCurrentStudentSemesterNumber === 'function' ? getCurrentStudentSemesterNumber(user) : (KIU_STATE.activeSemester || 1);
        const performance = getStudentPerformanceMetric(user);
        const completed = typeof getStudentCompletedEctsTotal === 'function' ? getStudentCompletedEctsTotal(user.id, getCurrentFacultyCode()) : 0;
        const unread = typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(user.id) : 0;
        return [[`S${semester}`, 'Semester'], [performance.value, performance.label], [String(completed), 'ECTS'], [String(unread), 'Updates']];
    }
    if (role === 'professor' || role === 'ta') {
        const schedule = typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : [];
        const students = typeof getProfStudentCount === 'function' ? getProfStudentCount(user.name || user.nameEn || '') : 0;
        const unread = typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(user.id) : 0;
        return [[String(schedule.length), 'Sections'], [String(students), 'Students'], [String(unread), 'Updates'], [facultyName, 'Faculty']];
    }
    if (role === 'student_service') {
        const stores = typeof ensureStudentServiceStores === 'function' ? ensureStudentServiceStores() : { tickets: [], articles: [] };
        const tickets = stores.tickets || [];
        const unread = typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(user.id) : 0;
        const open = tickets.filter((ticket) => !['Resolved', 'Closed'].includes(ticket.status)).length;
        return [[String(open), 'Open cases'], [String(stores.articles?.length || 0), 'Articles'], [String(unread), 'Updates'], [facultyName, 'Faculty']];
    }
    const curriculum = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(getCurrentFacultyCode()) : [];
    const exams = typeof ensureAdminExamState === 'function' ? ensureAdminExamState(getCurrentFacultyCode()).quizzes || [] : [];
    const activeFaculty = getCurrentFacultyCode();
    const usersByRole = getDomainSafe()?.usersByRole || {};
    const serviceStaff = (usersByRole.student_service || []).filter(user => normalizeFacultyCode(user?.facultyCode || user?.faculty || activeFaculty, activeFaculty) === activeFaculty);
    const professors = typeof getAllStaff === 'function' ? getAllStaff('professors', activeFaculty) : (usersByRole.professor || []);
    const tas = typeof getAllStaff === 'function' ? getAllStaff('tas', activeFaculty) : (usersByRole.ta || []);
    const staff = professors.length + tas.length + serviceStaff.length;
    return [[String(curriculum.length), 'Modules'], [String(exams.length), 'Exams'], [String(staff), 'Staff'], [facultyName, 'Faculty']];
}

function getDomainSafe() {
    try {
        if (typeof getDomain === 'function') return getDomain() || {};
    } catch (e) {}
    return KIU_STATE?.domain || {};
}

function cleanupUiText(value, fallback) {
    let text = String(value == null ? '' : value).trim();
    try {
        if (typeof cleanupEncodingArtifacts === 'function') text = cleanupEncodingArtifacts(text);
    } catch (e) {}
    try {
        if (typeof toEnglishText === 'function') text = toEnglishText(text);
    } catch (e) {}
    return text || fallback || '';
}

function parseTimeMinutes(value) {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    return Number(match[1]) * 60 + Number(match[2]);
}

function formatRelativeTime(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toISOString().slice(0, 10);
}

function getTermLabel() {
    try {
        if (typeof getCurrentAcademicTermLabel === 'function') return getCurrentAcademicTermLabel();
    } catch (e) {}
    return `Semester ${KIU_STATE?.activeSemester || 1}`;
}

function getSubjectLabel(courseId, fallback) {
    const domain = getDomainSafe();
    const subject = domain.subjectsById?.[courseId]
        || (typeof getCourseByIdForRegistration === 'function' ? getCourseByIdForRegistration(courseId, getCurrentFacultyCode(), fallback || '') : null)
        || (KIU_STATE?.curriculum || []).find((item) => String(item.id) === String(courseId));
    return cleanupUiText(subject?.name || fallback || courseId || 'Portal Item', 'Portal Item');
}

function sortScheduleItems(items) {
    const dayOrder = {
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
    };
    return (items || []).slice().sort((a, b) => {
        const aDay = cleanupUiText(a?.day || '').toLowerCase();
        const bDay = cleanupUiText(b?.day || '').toLowerCase();
        const aKey = Object.keys(dayOrder).find((key) => aDay.includes(key)) || '';
        const bKey = Object.keys(dayOrder).find((key) => bDay.includes(key)) || '';
        const byDay = (dayOrder[aKey] || 99) - (dayOrder[bKey] || 99);
        if (byDay !== 0) return byDay;
        return parseTimeMinutes(a?.time || a?.startTime) - parseTimeMinutes(b?.time || b?.startTime);
    });
}

function getOrdersSnapshot(user) {
    const orders = typeof getOrdersForUser === 'function' ? getOrdersForUser(user) : [];
    const unread = orders.filter((order) => typeof isOrderReadByUser === 'function' ? !isOrderReadByUser(order.id, user?.id) : false).length;
    return { orders, unread };
}

function getStudentPerformanceMetric(user) {
    const gpa = Number(user?.gpa);
    if (Number.isFinite(gpa) && gpa > 0) {
        return { value: gpa.toFixed(2), label: 'GPA' };
    }

    const averageScore = typeof getUserAverageScore === 'function' ? Number(getUserAverageScore(user?.id)) : NaN;
    if (Number.isFinite(averageScore) && averageScore > 0) {
        return { value: String(Math.round(averageScore)), label: 'Avg score' };
    }

    return { value: '--', label: 'GPA' };
}

function getNotificationSnapshot(user) {
    const items = typeof getPortalNotificationItemsForUser === 'function' ? getPortalNotificationItemsForUser(user?.id) : [];
    const unread = typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(user?.id) : items.filter((item) => !item.read).length;
    return { items, unread };
}

function getRecentHomeUpdates(user, limit = 4) {
    const notifications = getNotificationSnapshot(user).items.map((item) => ({
        icon: item.source === 'social' ? 'fas fa-comments' : 'fas fa-bell',
        title: cleanupUiText(item.title || item.type || 'Update', 'Update'),
        copy: cleanupUiText(item.text || 'Portal activity updated.', 'Portal activity updated.'),
        when: formatRelativeTime(item.createdAt || item.updatedAt)
    }));
    const orders = getOrdersSnapshot(user).orders.map((order) => ({
        icon: 'fas fa-book-open',
        title: cleanupUiText(order.title || order.type || 'Order', 'Order'),
        copy: cleanupUiText(order.type || 'Official order published.', 'Official order published.'),
        when: formatRelativeTime(order.createdAt || order.createdDate)
    }));
    return [...notifications, ...orders].slice(0, limit);
}

function clampPercent(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function deriveProgressFromCount(count, base = 18, step = 16) {
    return clampPercent(base + Number(count || 0) * step, base);
}

function buildQuickTile(pageId, label, icon, copy, meta, status, progress, tone = 'default') {
    return { pageId, label, icon, copy, meta, status, progress: clampPercent(progress), tone };
}

function getMessengerSnapshot(user) {
    const userId = String(user?.id || '');
    if (!userId || typeof getPortalMessengerChatsForUser !== 'function') {
        return { chats: [], unread: 0, recent: [] };
    }
    const chats = getPortalMessengerChatsForUser(userId) || [];
    const recent = chats.slice(0, 4).map((chat) => {
        const unread = typeof getPortalMessengerUnreadCount === 'function' ? getPortalMessengerUnreadCount(chat, userId) : 0;
        const title = typeof getPortalMessengerDisplayNameForChat === 'function'
            ? getPortalMessengerDisplayNameForChat(chat, userId)
            : cleanupUiText(chat?.name, 'Conversation');
        const preview = typeof getPortalMessengerMessagePreview === 'function'
            ? getPortalMessengerMessagePreview(chat)
            : cleanupUiText(chat?.messages?.[chat.messages.length - 1]?.text, 'No messages yet');
        const when = typeof getPortalMessengerChatLastTime === 'function'
            ? getPortalMessengerChatLastTime(chat)
            : formatRelativeTime(chat?.messages?.[chat.messages.length - 1]?.sentAt || chat?.createdAt);
        return {
            id: String(chat.id),
            title,
            preview,
            when,
            unread
        };
    });
    return {
        chats,
        unread: recent.reduce((sum, item) => sum + Number(item.unread || 0), 0),
        recent
    };
}

function getStudentScheduleRows(user) {
    const schedule = sortScheduleItems(typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
    return schedule.slice(0, 4).map((item) => ({
        icon: 'fas fa-chalkboard',
        title: getSubjectLabel(item.courseId, item.courseName),
        copy: `${cleanupUiText(item.day || 'Day', 'Day')} - ${cleanupUiText(item.time || 'TBD', 'TBD')} - ${cleanupUiText(item.groupName || item.groupId || 'Section', 'Section')}`
    }));
}

function getFacultyScheduleRows() {
    const schedule = sortScheduleItems(typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : []);
    return schedule.slice(0, 4).map((item) => ({
        icon: 'fas fa-calendar-week',
        title: cleanupUiText(item.subjectName || item.courseId || item.name, 'Scheduled session'),
        copy: `${cleanupUiText(item.day || 'Day', 'Day')} - ${cleanupUiText(item.startTime || item.time || 'TBD', 'TBD')} - ${cleanupUiText(item.room || 'Room TBA', 'Room TBA')}`
    }));
}

function formatCountLabel(count, singular, plural) {
    const value = Number(count || 0);
    return `${value} ${value === 1 ? singular : (plural || `${singular}s`)}`;
}

function getRoleActions(role, context) {
    if (role === 'student') {
        return context.registrationOpen
            ? [['registration', 'Continue registration'], ['lms', 'Open LMS'], ['clear-cache', 'Clear cache', 'utility']]
            : [['lms', 'Open LMS'], ['study-card', 'Open study card'], ['clear-cache', 'Clear cache', 'utility']];
    }
    if (role === 'professor') return [['timetable', 'Open Schedule'], ['exams', 'Open exams'], ['clear-cache', 'Clear cache', 'utility']];
    if (role === 'ta') return [['lms', 'Open LMS'], ['timetable', 'Check schedule'], ['clear-cache', 'Clear cache', 'utility']];
    if (role === 'student_service') return [['student-service', 'Open inbox'], ['orders', 'Review orders'], ['clear-cache', 'Clear cache', 'utility']];
    return [['admin-tools', 'Open admin tools'], ['admin-scheduler', 'Open scheduler'], ['clear-cache', 'Clear cache', 'utility']];
}

function getRoleShortcuts(role, context) {
    if (role === 'student') {
        return [
            buildQuickTile('lms', 'LMS', 'fas fa-book-reader', 'Classes, assignments, materials, and live course updates.', `${context.unreadUpdates} updates`, context.unreadUpdates > 0 ? 'Check latest course activity' : 'All quiet for now', deriveProgressFromCount(context.unreadUpdates, 22, 15), 'warm'),
            buildQuickTile('registration', 'Registration', 'fas fa-check-square', context.registrationOpen ? 'Registration is open for section, elective, and free-credit choices.' : 'Registration is closed. Review your current academic selections.', context.registrationOpen ? 'Open now' : 'Closed', context.registrationOpen ? 'Continue registration' : 'Review selections', context.registrationOpen ? 86 : 24, 'warm'),
            buildQuickTile('timetable', 'Timetable', 'fas fa-chalkboard', context.nextClass ? `Next class: ${context.nextClass.title}.` : 'See your weekly teaching schedule, rooms, and times.', context.nextClass ? 'Live schedule' : 'Awaiting sections', context.nextClass ? 'Ready for the next block' : 'Choose sections first', context.nextClass ? 68 : 14, 'calm'),
            buildQuickTile('study-card', 'Study Card', 'far fa-address-card', `${context.completedEcts} completed ECTS with transcript and progress records in one place.`, `${context.completedEcts} ECTS`, context.performanceLabel ? `${context.performanceLabel}: ${context.performanceValue}` : 'Academic record', context.progressPct, 'royal'),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'official order')} available in your archive.`, `${context.ordersCount} total`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 16, 19), 'ink'),
            buildQuickTile('student-service', 'Student Service', 'fas fa-headset', 'Support requests, guidance articles, and support.', `${context.supportCount} open`, 'Speak with Student Service', deriveProgressFromCount(context.supportCount, 14, 22), 'support')
        ];
    }
    if (role === 'professor') {
        return [
            buildQuickTile('timetable', 'Schedule', 'fas fa-calendar-week', context.nextFacultySession ? `Next session: ${context.nextFacultySession.title}.` : 'Review assigned classes, rooms, and timing.', `${context.sectionCount} sections`, 'Active schedule', deriveProgressFromCount(context.sectionCount, 32, 11), 'royal'),
            buildQuickTile('lms', 'LMS', 'fas fa-book-reader', 'Materials, grading, submissions, and course communication.', `${context.studentCount} students`, 'Manage delivery', deriveProgressFromCount(context.studentCount, 20, 1.2), 'ink'),
            buildQuickTile('exams', 'Exams', 'fas fa-file-signature', `${formatCountLabel(context.examCount, 'exam')} prepared for the active faculty profile.`, `${context.examCount} ready`, 'Assessments', deriveProgressFromCount(context.examCount, 18, 13), 'warm'),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'order')} and notice in the faculty inbox.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 15), 'ink'),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Follow announcements and faculty communication without leaving the shell.', `${context.unreadUpdates} updates`, 'Campus communication', deriveProgressFromCount(context.unreadUpdates, 18, 14), 'calm'),
            buildQuickTile('chancellery', 'Appeals', 'fas fa-inbox', `${formatCountLabel(context.unreadUpdates, 'unread update')} across appeals, notices, and operational messages.`, 'Appeals', 'Review requests', deriveProgressFromCount(context.unreadUpdates, 24, 12), 'support')
        ];
    }
    if (role === 'ta') {
        return [
            buildQuickTile('lms', 'LMS Sections', 'fas fa-book-reader', 'Support labs, discussions, attendance, and teaching materials.', `${context.studentCount} students`, 'Section support', deriveProgressFromCount(context.studentCount, 24, 1), 'support'),
            buildQuickTile('timetable', 'Schedule', 'fas fa-calendar-week', context.nextFacultySession ? `Next support block: ${context.nextFacultySession.title}.` : 'Track section timing, rooms, and faculty coordination.', `${context.sectionCount} sections`, 'Active schedule', deriveProgressFromCount(context.sectionCount, 28, 12), 'calm'),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'official order')} and notice in the support queue.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 16), 'ink'),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Keep section communication and class coordination moving.', `${context.unreadUpdates} updates`, 'Reply to students', deriveProgressFromCount(context.unreadUpdates, 20, 14), 'royal'),
            buildQuickTile('library', 'Library', 'fas fa-book', 'Reference material, reserve content, and campus resources.', 'Reserve access', 'Teaching resources', 38, 'calm'),
            buildQuickTile('chancellery', 'Appeals', 'fas fa-inbox', `${formatCountLabel(context.unreadUpdates, 'unread update')} tied to teaching support and student follow-up.`, 'Follow-up', 'Track requests', deriveProgressFromCount(context.unreadUpdates, 16, 13), 'support')
        ];
    }
    if (role === 'student_service') {
        return [
            buildQuickTile('student-service', 'Service Inbox', 'fas fa-inbox', `${formatCountLabel(context.openTickets, 'active ticket')} currently needs follow-up.`, `${context.openTickets} live`, 'Resolve service cases', deriveProgressFromCount(context.openTickets, 24, 14), 'support'),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'order')} and decision waiting in the service workspace.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 16), 'ink'),
            buildQuickTile('library', 'Library', 'fas fa-book', 'Reference support, circulation help, and knowledge requests.', `${context.articleCount} articles`, 'Knowledge base', deriveProgressFromCount(context.articleCount, 22, 11), 'calm'),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Watch public updates and common student questions.', `${context.unreadUpdates} updates`, 'Updates', deriveProgressFromCount(context.unreadUpdates, 18, 14), 'royal'),
            buildQuickTile('profile', 'Profile', 'far fa-user', 'Keep service account identity, access details, and shell settings aligned.', 'Account', 'Settings', 42, 'warm'),
            buildQuickTile('chancellery', 'Campus Requests', 'fas fa-desktop', `${formatCountLabel(context.unreadUpdates, 'unread update')} across service communication and notices.`, 'Escalations', 'Route requests', deriveProgressFromCount(context.unreadUpdates, 18, 12), 'support')
        ];
    }
    return [
        buildQuickTile('admin-scheduler', 'Scheduler', 'fas fa-calendar-plus', 'Coordinate rooms, weeks, and course distribution from the master schedule.', `${context.studentCount} students`, 'Master schedule', deriveProgressFromCount(context.studentCount, 20, 0.6), 'royal'),
        buildQuickTile('staff', 'Staff', 'fas fa-users-cog', `${formatCountLabel(context.staffCount, 'staff account')} in the current faculty network.`, `${context.staffCount} staff`, 'Staff records', deriveProgressFromCount(context.staffCount, 18, 10), 'ink'),
        buildQuickTile('students-admin', 'Students', 'fas fa-user-graduate', `${formatCountLabel(context.studentCount, 'student')} in the active faculty profile.`, `${context.studentCount} students`, 'Student records', deriveProgressFromCount(context.studentCount, 18, 0.8), 'warm'),
        buildQuickTile('exams', 'Exams', 'fas fa-file-signature', `${formatCountLabel(context.examCount, 'exam')} and assessment package available for review.`, `${context.examCount} exams`, 'Assessments', deriveProgressFromCount(context.examCount, 18, 14), 'royal'),
        buildQuickTile('admin-tools', 'Admin Tools', 'fas fa-layer-group', 'Curriculum, accounts, and registration management.', 'Admin tools', 'Open builders', 84, 'support'),
        buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'faculty order')} ready for operational follow-up.`, `${context.ordersCount} orders`, 'Orders', deriveProgressFromCount(context.ordersCount, 18, 15), 'ink')
    ];
}

function buildHomeModel(role) {
    const user = getCurrentUserSafe();
    const facultyCode = getCurrentFacultyCode();
    const facultyName = getFacultyName(facultyCode);
    const firstName = getUserName().split(/\s+/)[0] || 'Portal';
    const termLabel = getTermLabel();
    const notifications = getNotificationSnapshot(user);
    const orders = getOrdersSnapshot(user);
    const updates = getRecentHomeUpdates(user, 4);

    if (role === 'student') {
        const semester = typeof getCurrentStudentSemesterNumber === 'function' ? getCurrentStudentSemesterNumber(user) : (KIU_STATE.activeSemester || 1);
        const balance = typeof getEffectiveTuitionBalance === 'function' ? getEffectiveTuitionBalance(user.id) : 0;
        const performance = getStudentPerformanceMetric(user);
        const completed = typeof getStudentCompletedEctsTotal === 'function' ? getStudentCompletedEctsTotal(user.id, facultyCode) : 0;
        const scheduleRows = getStudentScheduleRows(user);
        const nextClass = scheduleRows[0];
        const progressTarget = Math.max(semester * 30, 30);
        const progressPct = clampPercent((completed / progressTarget) * 100, 0);
        const stats = [[`S${semester}`, 'Semester'], [performance.value, performance.label], [String(completed), 'ECTS'], [String(notifications.unread), 'Updates']];
        const userRequests = (KIU_STATE.chancelleryRequests || []).filter((request) => {
            const owner = String(request?.studentId || request?.userId || request?.createdBy || request?.authorId || '');
            return owner && String(user?.id || '') === owner;
        });
        const supportCount = userRequests.length;
        const quick = getRoleShortcuts(role, {
            registrationOpen: Boolean(KIU_STATE.registrationOpen),
            nextClass,
            completedEcts: completed,
            performanceLabel: performance.label,
            performanceValue: performance.value,
            progressPct,
            ordersCount: orders.orders.length,
            ordersUnread: orders.unread,
            unreadUpdates: notifications.unread,
            supportCount
        });
        const actions = getRoleActions(role, { registrationOpen: Boolean(KIU_STATE.registrationOpen) });
        return {
            variant: 'student',
            kicker: 'Student Dashboard',
            title: `${firstName}, here is your dashboard.`,
            copy: `${termLabel} in ${facultyName}. Your classes, registration, records, and campus updates.`,
            pills: [facultyName, termLabel, `Semester S${semester}`, KIU_STATE.registrationOpen ? 'Registration open' : 'Registration closed', `${notifications.unread} unread updates`],
            stats,
            actions,
            quick,
            heroAside: {
                title: 'Semester Overview',
                copy: 'Your schedule and academic status for today.',
                rows: [
                    { label: 'Next class', value: nextClass?.title || 'No class scheduled', detail: nextClass?.copy || 'Your timetable will surface here once sections are assigned.' },
                    { label: 'Registration', value: KIU_STATE.registrationOpen ? 'Open' : 'Closed', detail: KIU_STATE.registrationOpen ? 'Continue sections, electives, and free-credit choices.' : 'Review what is already locked for this term.' },
                    { label: 'Balance', value: balance > 0 ? `${balance} GEL` : 'Clear', detail: balance > 0 ? 'A finance hold can limit access until it is resolved.' : 'Finance access is clear for the active term.' }
                ]
            },
            alert: balance > 0 ? {
                tone: 'warm',
                icon: 'fas fa-credit-card',
                title: `Outstanding balance: ${balance} GEL`,
                copy: 'Financial holds can limit LMS and transcript access until payment or review is completed.',
                actionLabel: 'Open registration',
                actionPage: 'registration'
            } : {
                tone: 'green',
                icon: 'fas fa-circle-check',
                title: 'Academic access is clear',
                copy: 'No finance hold is blocking your current semester tools.',
                actionLabel: 'Open study card',
                actionPage: 'study-card'
            },
            summary: { title: 'Today', copy: 'Your next moves before the next class, deadline, or advisor checkpoint.', rows: [['Next class', nextClass?.title || 'No class scheduled'], ['Registration', KIU_STATE.registrationOpen ? 'Open' : 'Closed'], ['Orders', `${orders.unread} unread`], [performance.label, performance.value]] },
            focus: { title: 'Academic status', copy: 'Credits, access, and progress conditions for the active term.', rows: [['Completed ECTS', String(completed)], ['Faculty', facultyName], ['Unread updates', String(notifications.unread)], ['Balance', balance > 0 ? `${balance} GEL` : 'Clear']] },
            updates: { title: 'Recent changes', copy: 'Recent activity across your account.', rows: updates.map((item) => [item.title, item.when]) },
            columns: [
                { title: 'Upcoming schedule', meta: nextClass ? 'Live' : 'Planning', rows: scheduleRows.length ? scheduleRows : [{ icon: 'fas fa-calendar-day', title: 'No scheduled sections yet', copy: 'Choose sections in registration to populate your timetable.' }] },
                { title: 'Official updates', meta: notifications.unread > 0 ? 'Unread' : 'Inbox', rows: updates.length ? updates : [{ icon: 'fas fa-bell', title: 'No new updates', copy: 'Orders, notifications, and support replies will appear here.' }] },
                { title: 'Student support', meta: supportCount > 0 ? 'Open' : 'Access', rows: [
                    { icon: 'fas fa-headset', title: 'Student Service', copy: supportCount > 0 ? `${supportCount} support request linked to your account.` : 'Open tickets, ask for support, or review guidance articles.' },
                    { icon: 'fas fa-book-open', title: 'Orders', copy: `${orders.orders.length} official orders in your inbox.` },
                    { icon: 'fas fa-inbox', title: 'Appeals & requests', copy: `${userRequests.length} tracked request${userRequests.length === 1 ? '' : 's'} in your portal workflow.` }
                ] }
            ]
        };
    }

    if (role === 'professor' || role === 'ta') {
        const scheduleRows = getFacultyScheduleRows();
        const facultySchedule = typeof getCurrentFacultyScheduleItems === 'function' ? getCurrentFacultyScheduleItems() : [];
        const studentCount = typeof getProfStudentCount === 'function' ? getProfStudentCount(user.name || user.nameEn || '') : 0;
        const sectionCount = facultySchedule.length || scheduleRows.length;
        const examCount = typeof ensureAdminExamState === 'function' ? (ensureAdminExamState(facultyCode).quizzes || []).length : 0;
        const stats = [[String(sectionCount), 'Sections'], [String(studentCount), 'Students'], [String(notifications.unread), 'Updates'], [facultyName, 'Faculty']];
        const quick = getRoleShortcuts(role, {
            nextFacultySession: scheduleRows[0],
            sectionCount,
            studentCount,
            ordersCount: orders.orders.length,
            ordersUnread: orders.unread,
            unreadUpdates: notifications.unread,
            examCount
        });
        const actions = getRoleActions(role, {});
        return {
            variant: role === 'ta' ? 'ta' : 'professor',
            kicker: role === 'ta' ? 'Teaching Assistant' : 'Faculty Dashboard',
            title: `${firstName}, here is your dashboard.`,
            copy: role === 'ta'
                ? `${termLabel} for ${facultyName}. Your labs, rosters, and student follow-up tools.`
                : `${termLabel} for ${facultyName}. Your schedule, courses, assessments, and communications.`,
            pills: [facultyName, termLabel, `${sectionCount} assigned sections`, `${studentCount} students`, `${notifications.unread} unread updates`],
            stats,
            actions,
            quick,
            heroAside: {
                title: role === 'ta' ? 'Section Overview' : 'Teaching Overview',
                copy: role === 'ta' ? 'Attendance and support status for the current faculty.' : 'Schedule, assessments, and communications for the current faculty.',
                rows: [
                    { label: 'Next session', value: scheduleRows[0]?.title || 'No session assigned', detail: scheduleRows[0]?.copy || 'Scheduled classes appear here as soon as the faculty timetable is available.' },
                    { label: 'Sections', value: String(sectionCount), detail: role === 'ta' ? 'Support blocks and labs in the current faculty profile.' : 'Assigned lectures, seminars, or workshops in the current faculty profile.' },
                    { label: 'Students', value: String(studentCount), detail: role === 'ta' ? 'Students tied to your support and lab workload.' : 'Students currently attached to your teaching load.' }
                ]
            },
            alert: {
                tone: role === 'ta' ? 'support' : 'royal',
                icon: notifications.unread > 0 ? 'fas fa-bell' : 'fas fa-calendar-check',
                title: notifications.unread > 0 ? `${notifications.unread} unread faculty updates` : 'Teaching workspace is synced',
                copy: notifications.unread > 0 ? 'Review new alerts from exams, messages, and student-facing workflows.' : 'Schedule, LMS, and faculty tools are ready for the next teaching block.',
                actionLabel: role === 'ta' ? 'Open LMS' : 'Open schedule',
                actionPage: role === 'ta' ? 'lms' : 'timetable'
            },
            summary: { title: role === 'ta' ? 'Support load' : 'Teaching load', copy: role === 'ta' ? 'What is active across labs, coordination, and student follow-up.' : 'What is active across teaching, exams, and communication today.', rows: [['Sections', String(sectionCount)], ['Students', String(studentCount)], ['Orders', `${orders.unread} unread`], ['Faculty', facultyName]] },
            focus: { title: role === 'ta' ? 'Section support' : 'Assessment flow', copy: role === 'ta' ? 'Labs, attendance, and support tasks.' : 'Course delivery, marking, and exam readiness.', rows: [['Next session', scheduleRows[0]?.title || 'No session assigned'], ['Unread updates', String(notifications.unread)], ['Orders', String(orders.orders.length)], ['Role', role === 'ta' ? 'TA Workspace' : 'Professor Workspace']] },
            updates: { title: 'Recent changes', copy: 'Recent activity across your faculty.', rows: updates.map((item) => [item.title, item.when]) },
            columns: [
                { title: role === 'ta' ? 'Support schedule' : 'Teaching schedule', meta: scheduleRows.length ? 'Today' : 'Planning', rows: scheduleRows.length ? scheduleRows : [{ icon: 'fas fa-calendar-day', title: 'No teaching sessions yet', copy: 'Assigned groups will appear here as soon as the timetable is available.' }] },
                { title: role === 'ta' ? 'Support workflow' : 'Faculty workflow', meta: 'Control', rows: [
                    { icon: 'fas fa-book-reader', title: 'LMS classroom', copy: role === 'ta' ? 'Assist with labs, forums, and section materials.' : 'Manage course delivery, materials, and grade flow.' },
                    { icon: 'fas fa-file-signature', title: 'Exams', copy: `${examCount} faculty exam${examCount === 1 ? '' : 's'} available in the active profile.` },
                    { icon: 'fas fa-inbox', title: 'Appeals & messages', copy: 'Stay current with student communication and order updates.' }
                ] },
                { title: 'Recent updates', meta: notifications.unread > 0 ? 'Unread' : 'Inbox', rows: updates.length ? updates : [{ icon: 'fas fa-bell', title: 'No new updates', copy: 'Faculty notifications and orders will appear here.' }] }
            ]
        };
    }

    if (role === 'student_service') {
        const stats = getRoleStats(role, facultyName);
        const stores = typeof ensureStudentServiceStores === 'function' ? ensureStudentServiceStores() : { tickets: [], articles: [] };
        const tickets = stores.tickets || [];
        const articles = stores.articles || [];
        const openTickets = tickets.filter((ticket) => !['Resolved', 'Closed'].includes(ticket.status));
        const waitingForService = tickets.filter((ticket) => ticket.status === 'Waiting for Service').length;
        const waitingForStudent = tickets.filter((ticket) => ticket.status === 'Waiting for Student').length;
        const quick = getRoleShortcuts(role, {
            openTickets: openTickets.length,
            ordersCount: orders.orders.length,
            ordersUnread: orders.unread,
            unreadUpdates: notifications.unread,
            articleCount: articles.length
        });
        const actions = getRoleActions(role, {});
        return {
            variant: 'student_service',
            kicker: 'Student Service',
            title: `${firstName}, here is your dashboard.`,
            copy: `${termLabel} for ${facultyName}. Tickets, guidance, and escalation tracking.`,
            pills: [facultyName, termLabel, `${openTickets.length} open tickets`, `${articles.length} articles`, `${notifications.unread} unread updates`],
            stats,
            actions,
            quick,
            heroAside: {
                title: 'Queue Overview',
                copy: 'Open tickets and knowledge base for the current faculty.',
                rows: [
                    { label: 'Open tickets', value: String(openTickets.length), detail: `${waitingForService} waiting for service and ${waitingForStudent} waiting for student response.` },
                    { label: 'Knowledge base', value: String(articles.length), detail: 'Guidance articles available to reduce repeat support effort.' },
                    { label: 'Orders', value: String(orders.orders.length), detail: `${orders.unread} unread order${orders.unread === 1 ? '' : 's'} still need review.` }
                ]
            },
            alert: {
                tone: 'support',
                icon: openTickets.length > 0 ? 'fas fa-headset' : 'fas fa-circle-check',
                title: openTickets.length > 0 ? `${openTickets.length} active service cases` : 'Queue is under control',
                copy: openTickets.length > 0 ? 'Use the inbox to resolve, hand off, or reply to active student requests.' : 'There are no unresolved service tickets demanding action right now.',
                actionLabel: 'Open inbox',
                actionPage: 'student-service'
            },
            summary: { title: 'Live queue', copy: 'The cases and response lanes that need attention right now.', rows: [['Open tickets', String(openTickets.length)], ['Waiting for service', String(waitingForService)], ['Waiting for student', String(waitingForStudent)], ['Orders', `${orders.unread} unread`]] },
            focus: { title: 'Knowledge base', copy: 'Guidance content and service context for the current faculty.', rows: [['Articles', String(articles.length)], ['Faculty', facultyName], ['Unread updates', String(notifications.unread)], ['Role', 'Student Service']] },
            updates: { title: 'Recent changes', copy: 'Recent activity across the service desk.', rows: updates.map((item) => [item.title, item.when]) },
            columns: [
                { title: 'Open tickets', meta: 'Queue', rows: openTickets.length ? openTickets.slice(0, 4).map((ticket) => ({ icon: 'fas fa-inbox', title: cleanupUiText(ticket.subject || ticket.category || ticket.title, 'Student request'), copy: `${cleanupUiText(ticket.status, 'Open')} - ${cleanupUiText(ticket.priority || 'Standard', 'Standard')}` })) : [{ icon: 'fas fa-inbox', title: 'No open tickets', copy: 'Open the service inbox to review resolved history or wait for new cases.' }] },
                { title: 'Knowledge & guidance', meta: articles.length ? 'Articles' : 'None', rows: articles.length ? articles.slice(0, 4).map((article) => ({ icon: 'fas fa-book-open', title: cleanupUiText(article.title, 'Knowledge article'), copy: cleanupUiText(article.category || article.audience || 'Student guidance', 'Student guidance') })) : [{ icon: 'fas fa-book-open', title: 'No guidance articles yet', copy: 'Publish service articles in the knowledge base when this faculty needs reusable guidance.' }] },
                { title: 'Recent updates', meta: notifications.unread > 0 ? 'Unread' : 'Inbox', rows: updates.length ? updates : [{ icon: 'fas fa-bell', title: 'No new updates', copy: 'Service notifications and orders will appear here.' }] }
            ]
        };
    }

    const stats = getRoleStats(role, facultyName);
    const curriculum = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(facultyCode) : [];
    const usersByRole = getDomainSafe().usersByRole || {};
    const students = typeof getAllStudents === 'function' ? getAllStudents(facultyCode) : (usersByRole.student || []);
    const exams = typeof ensureAdminExamState === 'function' ? ensureAdminExamState(facultyCode).quizzes || [] : [];
    const facultyOrders = KIU_STATE?.ordersCenterByFaculty?.[facultyCode]?.items || [];
    const serviceStaff = (usersByRole.student_service || []).filter(user => normalizeFacultyCode(user?.facultyCode || user?.faculty || facultyCode, facultyCode) === facultyCode);
    const professors = typeof getAllStaff === 'function' ? getAllStaff('professors', facultyCode) : (usersByRole.professor || []);
    const tas = typeof getAllStaff === 'function' ? getAllStaff('tas', facultyCode) : (usersByRole.ta || []);
    const staffCount = professors.length + tas.length + serviceStaff.length;
    const quick = getRoleShortcuts(role, {
        staffCount,
        studentCount: students.length,
        examCount: exams.length,
        ordersCount: facultyOrders.length,
        ordersUnread: facultyOrders.length,
        unreadUpdates: notifications.unread
    });
    const actions = getRoleActions(role, {});
    return {
        variant: 'admin',
        kicker: 'Administration',
        title: `${facultyName} administration at a glance.`,
        copy: `${termLabel}. Curriculum, staffing, exams, and student administration.`,
        pills: [facultyName, termLabel, `${curriculum.length} curriculum items`, `${students.length} students`, `${staffCount} staff`, `${exams.length} exams`, `${notifications.unread} unread updates`],
        stats,
        actions,
        quick,
        heroAside: {
            title: 'Faculty Overview',
            copy: 'Faculty systems and resource overview.',
            rows: [
                { label: 'Curriculum', value: String(curriculum.length), detail: 'Curriculum items available in the active faculty profile.' },
                { label: 'Students', value: String(students.length), detail: 'Students linked to this faculty environment.' },
                { label: 'Exams', value: String(exams.length), detail: 'Assessment packages and exam records in scope.' }
            ]
        },
        alert: {
            tone: 'royal',
            icon: notifications.unread > 0 ? 'fas fa-layer-group' : 'fas fa-circle-check',
            title: notifications.unread > 0 ? `${notifications.unread} admin updates waiting` : 'Faculty systems are in sync',
            copy: notifications.unread > 0 ? 'Review new operational alerts, service activity, or notification traffic tied to this faculty profile.' : 'Curriculum, users, and exams are available from the current faculty dashboard.',
            actionLabel: 'Open exams',
            actionPage: 'exams'
        },
        summary: { title: 'Faculty snapshot', copy: 'Current scale and system load for the selected faculty.', rows: [['Curriculum', String(curriculum.length)], ['Students', String(students.length)], ['Staff', String(staffCount)], ['Orders', String(facultyOrders.length)]] },
        focus: { title: 'Key Systems', copy: 'The main administrative systems connected to this dashboard.', rows: [['Exams', String(exams.length)], ['Unread updates', String(notifications.unread)], ['Appeals', String((KIU_STATE.chancelleryRequests || []).length)], ['Semester', `S${KIU_STATE.activeSemester || 1}`]] },
        updates: { title: 'Recent changes', copy: 'Recent activity across the portal.', rows: updates.map((item) => [item.title, item.when]) },
        adminOperations: {
            title: 'Admin operations',
            copy: 'Access curriculum, accounts, and registration tools.',
            groups: [
                {
                    title: 'Account provisioning',
                    copy: 'Create linked student, professor, TA, and Student Service accounts with the original admin workflow.',
                    buttons: [
                        { type: 'provision', role: 'student', label: 'Create Student', icon: 'fas fa-user-graduate' },
                        { type: 'provision', role: 'professor', label: 'Create Professor', icon: 'fas fa-chalkboard-teacher' },
                        { type: 'provision', role: 'ta', label: 'Create TA', icon: 'fas fa-user-tie' },
                        { type: 'provision', role: 'student_service', label: 'Create Service Staff', icon: 'fas fa-headset' }
                    ]
                },
                {
                    title: 'Academic builders',
                    copy: 'Open the original curriculum library, subject builder, and registration-structure controls from one admin tools page.',
                    buttons: [
                        { type: 'nav', pageId: 'admin-tools', label: 'Open Admin Tools', icon: 'fas fa-layer-group' },
                        { type: 'focus', focus: 'curriculum', label: 'Curriculum Library', icon: 'fas fa-book-open' },
                        { type: 'focus', focus: 'registration', label: 'Registration CMS', icon: 'fas fa-sitemap' }
                    ]
                },
                {
                    title: 'Operations shortcuts',
                    copy: 'Keep scheduler, staff, students, and exams one click away from the main admin desk.',
                    buttons: [
                        { type: 'nav', pageId: 'admin-scheduler', label: 'Open Scheduler', icon: 'fas fa-calendar-plus' },
                        { type: 'nav', pageId: 'staff', label: 'Manage Staff', icon: 'fas fa-users-cog' },
                        { type: 'nav', pageId: 'students-admin', label: 'Open Students', icon: 'fas fa-user-graduate' },
                        { type: 'nav', pageId: 'exams', label: 'Open Exams', icon: 'fas fa-file-signature' }
                    ]
                }
            ]
        },
        columns: [
            { title: 'Governance queue', meta: curriculum.length ? 'Active' : 'Waiting', rows: curriculum.length ? curriculum.slice(0, 4).map((item) => ({ icon: 'fas fa-layer-group', title: getSubjectLabel(item.id, item.name), copy: cleanupUiText(item.faculty || facultyName, facultyName) })) : [{ icon: 'fas fa-layer-group', title: 'No curriculum items loaded', copy: 'Switch faculty or open the academic planners to begin building curriculum records.' }] },
            { title: 'Operational systems', meta: 'Control', rows: [
                { icon: 'fas fa-layer-group', title: 'Admin Tools', copy: 'Open curriculum library, account provisioning, and registration builders in one workspace.' },
                { icon: 'fas fa-calendar-plus', title: 'Scheduler', copy: 'Coordinate rooms, weeks, and teaching distribution from the master schedule.' },
                { icon: 'fas fa-users-cog', title: 'Staff & accounts', copy: 'Provision new staff, TAs, and service users in the selected faculty context.' },
                { icon: 'fas fa-book-open', title: 'Orders & notices', copy: `${facultyOrders.length} faculty-scoped orders are available right now.` }
            ] },
            { title: 'Recent updates', meta: notifications.unread > 0 ? 'Unread' : 'Inbox', rows: updates.length ? updates : [{ icon: 'fas fa-bell', title: 'No new updates', copy: 'System notifications and social alerts will appear here.' }] }
        ]
    };
}

function buildHomeContext(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {
    return buildHomeWidgetContext(role, buildHomeModel(role));
}

Object.assign(window, {
    getRoleStats,
    getDomainSafe,
    cleanupUiText,
    parseTimeMinutes,
    formatRelativeTime,
    getTermLabel,
    getSubjectLabel,
    sortScheduleItems,
    getOrdersSnapshot,
    getStudentPerformanceMetric,
    getNotificationSnapshot,
    getRecentHomeUpdates,
    getMessengerSnapshot,
    getStudentScheduleRows,
    getFacultyScheduleRows,
    formatCountLabel,
    getRoleActions,
    getRoleShortcuts,
    buildHomeModel,
    buildHomeContext
});
