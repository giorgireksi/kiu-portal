/* Home dashboard widget row adapters + default geometry.
 * Peeled from index-home-dashboard.plain.js (home-dashboard/widget-data.js SSOT).
 * Load before index-home-dashboard.js on index.html.
 */
(function initHomeDashboardWidgetDataRuntime() {
    if (window.__KIU_HOME_DASHBOARD_WIDGET_DATA_LOADED) return;
    window.__KIU_HOME_DASHBOARD_WIDGET_DATA_LOADED = true;

    window.__kiuCreateHomeDashboardWidgetDataApi = function createKiuHomeDashboardWidgetDataApi(deps = {}) {
        const d = deps;
        void d;

function getGradeRecordOutcome(record) {
    const combined = typeof getGradeRecordCombinedKiuPassScore === 'function'
        ? Number(getGradeRecordCombinedKiuPassScore(record) || 0)
        : Number(record?.q1 || 0) + Number(record?.qa || 0) + Number(record?.mid || 0) + Number(record?.final || 0);
    const finalScore = Math.round(combined);
    const letter = record?.letter
        || (finalScore >= 91 ? 'A' : finalScore >= 81 ? 'B' : finalScore >= 71 ? 'C' : finalScore >= 61 ? 'D' : finalScore >= 51 ? 'E' : 'F');
    return { finalScore, letter };
}

function getStudentScoreRows(user, limit = 4) {
    const schedule = typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : [];
    const rows = [];
    const seen = new Set();
    (schedule || []).forEach((item) => {
        const rosterKey = typeof resolveGradebookRosterKey === 'function'
            ? resolveGradebookRosterKey(item.courseId, item.groupId, [])
            : `${String(item.courseId || '').toLowerCase()}_${String(item.groupId || '').toLowerCase()}`;
        const roster = KIU_STATE.studentGrades?.[rosterKey] || KIU_STATE.studentGrades?.[item.groupId] || [];
        const record = (roster || []).find((entry) => String(entry.id) === String(user?.id || ''));
        if (!record || seen.has(item.courseId)) return;
        const outcome = getGradeRecordOutcome(record);
        rows.push({
            icon: 'fas fa-chart-line',
            title: getSubjectLabel(item.courseId, item.courseName || item.subjectName || 'Subject'),
            copy: `Current score ${outcome.finalScore}${outcome.letter ? ` - ${outcome.letter}` : ''}`
        });
        seen.add(item.courseId);
    });
    if (rows.length) return rows.slice(0, limit);
    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterKey, roster]) => {
        if (rows.length >= limit) return;
        const record = (roster || []).find((entry) => String(entry.id) === String(user?.id || ''));
        if (!record) return;
        const outcome = getGradeRecordOutcome(record);
        rows.push({
            icon: 'fas fa-chart-line',
            title: cleanupUiText(record.name || rosterKey, rosterKey),
            copy: `Current score ${outcome.finalScore}${outcome.letter ? ` - ${outcome.letter}` : ''}`
        });
    });
    return rows.slice(0, limit);
}

function getOrderRowsForWidget(orders, limit = 4, emptyCopy = 'Official orders and notices will appear here.') {
    return (orders || []).length
        ? orders.slice(0, limit).map((order) => ({
            icon: 'fas fa-book-open',
            title: cleanupUiText(order.title || order.type || order.id || 'Order', 'Order'),
            copy: `${cleanupUiText(order.status || 'Published', 'Published')} - ${formatRelativeTime(order.createdAt || order.createdDate || order.date)}`
        }))
        : [{ icon: 'fas fa-book-open', title: 'No orders yet', copy: emptyCopy }];
}

function getMessengerRowsForWidget(snapshot, emptyCopy = 'Direct conversations and academic follow-up will appear here.') {
    return (snapshot?.recent || []).length
        ? snapshot.recent.map((chat) => ({
            icon: 'fas fa-comments',
            title: cleanupUiText(chat.title, 'Conversation'),
            copy: `${cleanupUiText(chat.preview, 'No messages yet')} - ${chat.when}`
        }))
        : [{ icon: 'fas fa-comments', title: 'No new messages', copy: emptyCopy }];
}

function getStudentRequestRowsForWidget(requests, emptyCopy = 'Support requests and tracked appeals will appear here.') {
    return (requests || []).length
        ? requests.slice(0, 4).map((request) => ({
            icon: 'fas fa-inbox',
            title: cleanupUiText(request.type || request.title || request.id, 'Portal request'),
            copy: `${cleanupUiText(request.status || 'Active', 'Active')} - ${cleanupUiText(request.date || request.createdAt || '', '')}`
        }))
        : [{ icon: 'fas fa-headset', title: 'No support requests', copy: emptyCopy }];
}

function getTicketRowsForWidget(tickets, emptyCopy = 'The service inbox is clear right now.') {
    return (tickets || []).length
        ? tickets.slice(0, 4).map((ticket) => ({
            icon: 'fas fa-headset',
            title: cleanupUiText(ticket.subject || ticket.category || ticket.title, 'Service case'),
            copy: `${cleanupUiText(ticket.status, 'Open')} - ${cleanupUiText(ticket.priority || 'Standard', 'Standard')}`
        }))
        : [{ icon: 'fas fa-headset', title: 'No active tickets', copy: emptyCopy }];
}

function getArticleRowsForWidget(articles, emptyCopy = 'Knowledge-base articles will appear here.') {
    return (articles || []).length
        ? articles.slice(0, 4).map((article) => ({
            icon: 'fas fa-book-open',
            title: cleanupUiText(article.title, 'Knowledge article'),
            copy: cleanupUiText(article.category || article.audience || 'Student guidance', 'Student guidance')
        }))
        : [{ icon: 'fas fa-book-open', title: 'No articles yet', copy: emptyCopy }];
}

function getAttendanceRowsForWidget(scheduleItems, emptyCopy = 'Attendance checks will appear after the first marked session.') {
    const rows = [];
    (scheduleItems || []).forEach((item) => {
        const courseId = item.courseId || item.subjectId || '';
        const attendanceByDate = KIU_STATE.attendance?.[courseId] || {};
        const latestDate = Object.keys(attendanceByDate).sort().slice(-1)[0];
        const latestMap = latestDate ? attendanceByDate[latestDate] || {} : {};
        const marked = Object.values(latestMap).filter(Boolean).length;
        rows.push({
            icon: 'fas fa-user-check',
            title: cleanupUiText(item.subjectName || item.name || item.courseId, 'Section attendance'),
            copy: latestDate ? `${marked} marked on ${latestDate}` : 'Attendance has not been marked yet'
        });
    });
    return rows.length ? rows.slice(0, 4) : [{ icon: 'fas fa-user-check', title: 'No attendance lane yet', copy: emptyCopy }];
}

function getGradebookRowsForWidget(limit = 4) {
    if (typeof getGradebookGroupsForCurrentUser !== 'function') {
        return [{ icon: 'fas fa-clipboard-check', title: 'Gradebook not available', copy: 'Faculty rosters will appear here when gradebook groups are assigned.' }];
    }
    const groups = getGradebookGroupsForCurrentUser() || [];
    return groups.length
        ? groups.slice(0, limit).map((group) => ({
            icon: 'fas fa-clipboard-check',
            title: cleanupUiText(group.subjectName || group.courseId || 'Roster', 'Roster'),
            copy: `${cleanupUiText(group.groupName || group.groupId || 'Section', 'Section')} - ${cleanupUiText(group.day || '', '').trim()} ${cleanupUiText(group.time || '', '').trim()}`.trim()
        }))
        : [{ icon: 'fas fa-clipboard-check', title: 'No gradebook rosters', copy: 'Assigned faculty rosters will appear here once sections are active.' }];
}

function getAdminStudentRows(students, emptyCopy = 'Student registry items will appear here for the active faculty.') {
    return (students || []).length
        ? students.slice(0, 4).map((student) => ({
            icon: 'fas fa-user-graduate',
            title: cleanupUiText(student.nameEn || student.name || student.id, student.id),
            copy: cleanupUiText(student.faculty || student.facultyCode || 'Faculty profile', 'Faculty profile')
        }))
        : [{ icon: 'fas fa-user-graduate', title: 'No students in view', copy: emptyCopy }];
}

function getCurrentFacultyOrders() {
    const facultyCode = getCurrentFacultyCode();
    return KIU_STATE?.ordersCenterByFaculty?.[facultyCode]?.items || [];
}
const HOME_DEFAULT_WIDGET_GEOMETRY = {
    student: {
        alert: { x: 1, y: 1, w: 12, h: 3 },
        hero: { x: 1, y: 4, w: 8, h: 10 },
        'student-schedule': { x: 9, y: 4, w: 4, h: 5 },
        'student-registration': { x: 9, y: 9, w: 4, h: 5 },
        'student-scores': { x: 1, y: 14, w: 4, h: 5 },
        'student-updates': { x: 5, y: 14, w: 4, h: 5 },
        'student-support': { x: 9, y: 14, w: 4, h: 5 },
        quick: { x: 1, y: 19, w: 8, h: 8 },
        'student-orders': { x: 9, y: 19, w: 4, h: 4 },
        'student-inbox': { x: 9, y: 23, w: 4, h: 4 },
        'student-performance': { x: 1, y: 27, w: 4, h: 4 }
    },
    professor: {
        alert: { x: 1, y: 1, w: 12, h: 3 },
        hero: { x: 1, y: 4, w: 7, h: 10 },
        'professor-schedule': { x: 8, y: 4, w: 5, h: 5 },
        'professor-gradebook': { x: 8, y: 9, w: 5, h: 5 },
        'professor-attendance': { x: 1, y: 14, w: 4, h: 5 },
        'professor-messages': { x: 5, y: 14, w: 4, h: 5 },
        'professor-orders': { x: 9, y: 14, w: 4, h: 5 },
        quick: { x: 1, y: 19, w: 8, h: 8 },
        'professor-updates': { x: 9, y: 19, w: 4, h: 8 }
    },
    ta: {
        alert: { x: 1, y: 1, w: 12, h: 3 },
        hero: { x: 1, y: 4, w: 7, h: 10 },
        'ta-schedule': { x: 8, y: 4, w: 5, h: 5 },
        'ta-attendance': { x: 8, y: 9, w: 5, h: 5 },
        'ta-messages': { x: 1, y: 14, w: 4, h: 5 },
        'ta-orders': { x: 5, y: 14, w: 4, h: 5 },
        'ta-gradebook': { x: 9, y: 14, w: 4, h: 5 },
        quick: { x: 1, y: 19, w: 8, h: 8 },
        'ta-alerts': { x: 9, y: 19, w: 4, h: 8 }
    },
    admin: {
        alert: { x: 1, y: 1, w: 12, h: 3 },
        hero: { x: 1, y: 4, w: 8, h: 10 },
        'admin-curriculum': { x: 9, y: 4, w: 4, h: 5 },
        'admin-registry': { x: 9, y: 9, w: 4, h: 5 },
        'admin-ops': { x: 1, y: 14, w: 12, h: 7 },
        'admin-systems': { x: 1, y: 21, w: 4, h: 5 },
        'admin-orders': { x: 5, y: 21, w: 4, h: 5 },
        'admin-updates': { x: 9, y: 21, w: 4, h: 5 },
        quick: { x: 1, y: 26, w: 12, h: 7 },
        'admin-exams': { x: 9, y: 33, w: 4, h: 4 }
    },
    student_service: {
        alert: { x: 1, y: 1, w: 12, h: 3 },
        hero: { x: 1, y: 4, w: 7, h: 10 },
        'service-queue': { x: 8, y: 4, w: 5, h: 5 },
        'service-knowledge': { x: 8, y: 9, w: 5, h: 5 },
        'service-orders': { x: 1, y: 14, w: 4, h: 5 },
        'service-updates': { x: 5, y: 14, w: 4, h: 5 },
        'service-inbox': { x: 9, y: 14, w: 4, h: 5 },
        quick: { x: 1, y: 19, w: 8, h: 8 },
        'service-escalations': { x: 9, y: 19, w: 4, h: 8 }
    }
};

        const api = {
            getGradeRecordOutcome,
            getStudentScoreRows,
            getOrderRowsForWidget,
            getMessengerRowsForWidget,
            getStudentRequestRowsForWidget,
            getTicketRowsForWidget,
            getArticleRowsForWidget,
            getAttendanceRowsForWidget,
            getGradebookRowsForWidget,
            getAdminStudentRows,
            getCurrentFacultyOrders,
            HOME_DEFAULT_WIDGET_GEOMETRY,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateHomeDashboardWidgetDataApi({});
})();
