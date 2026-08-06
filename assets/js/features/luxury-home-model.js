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

function formatScheduleTimeRange(item) {
    const start = String(item?.startTime || '').trim();
    const end = String(item?.endTime || '').trim();
    if (start && end) return `${start}–${end}`;
    const raw = String(item?.time || '').trim();
    if (!raw || raw === 'TBD') return '--:--';
    if (/[–-]/.test(raw)) {
        const parts = raw.split(/[–-]/).map((part) => part.trim()).filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}–${parts[1]}`;
    }
    return raw;
}

function buildStudentHeroAside(rawSchedule = [], facultyName = '') {
    const sorted = sortScheduleItems(rawSchedule);
    const next = sorted[0] || null;
    const weekStart = typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : '';
    const weekLabel = typeof formatWeekRangeLabel === 'function' && weekStart
        ? formatWeekRangeLabel(weekStart)
        : 'this week';

    if (!next) {
        return {
            kicker: 'Your next class',
            chip: 'Quiet week',
            headline: 'No sessions this week',
            copy: `Nothing is scheduled for ${weekLabel} yet.`,
            meta: { icon: 'fa-building', text: cleanupUiText(facultyName, 'Faculty') }
        };
    }

    const dayLabel = cleanupUiText(next.day || 'Day TBD', 'Day TBD');
    const roomLabel = cleanupUiText(next.room || 'Room TBD', 'Room TBD');
    const groupLabel = cleanupUiText(next.groupName || next.groupId || 'Section', 'Section');

    return {
        kicker: 'Your next class',
        chip: formatScheduleTimeRange(next),
        headline: getSubjectLabel(next.courseId, next.courseName),
        copy: `${dayLabel} · ${roomLabel} · ${groupLabel}`,
        meta: { icon: 'fa-location-dot', text: roomLabel }
    };
}

function buildFacultyHeroAside({ role, scheduleRows, rawSchedule, facultyName, sectionCount, studentCount }) {
    const nextRaw = sortScheduleItems(rawSchedule)[0] || null;
    const nextRow = scheduleRows[0] || null;
    const kicker = role === 'ta' ? 'Section overview' : 'Teaching overview';

    if (!nextRow && !nextRaw) {
        return {
            kicker,
            chip: 'No session',
            headline: 'No session assigned',
            copy: 'Scheduled classes appear here as soon as the faculty timetable is available.',
            meta: { icon: 'fa-building', text: cleanupUiText(facultyName, 'Faculty') }
        };
    }

    const dayLabel = cleanupUiText(nextRaw?.day || 'Day TBD', 'Day TBD');
    const roomLabel = cleanupUiText(nextRaw?.room || 'Room TBD', 'Room TBD');
    const groupLabel = cleanupUiText(nextRaw?.groupName || nextRaw?.groupId || nextRaw?.name || 'Section', 'Section');
    const headline = nextRow?.title || cleanupUiText(nextRaw?.subjectName || nextRaw?.courseId, 'Scheduled session');

    return {
        kicker,
        chip: nextRaw ? formatScheduleTimeRange(nextRaw) : 'Next session',
        headline,
        copy: `${dayLabel} · ${roomLabel} · ${groupLabel}`,
        meta: { icon: 'fa-building', text: cleanupUiText(facultyName, 'Faculty') }
    };
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
        return { value: String(Math.round(averageScore)), label: 'Average score' };
    }

    return { value: '--', label: 'GPA' };
}

function normalizeStudentMetric(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
}

function buildStudentProgressModel({ semester, completed, performance, scheduleRows, unread }) {
    const safeSemester = Math.max(1, Math.round(normalizeStudentMetric(semester, 1)));
    const hasCompletedEcts = completed !== null && completed !== undefined && Number.isFinite(Number(completed));
    const completedEcts = hasCompletedEcts ? normalizeStudentMetric(completed) : null;
    const targetEcts = hasCompletedEcts ? Math.max(safeSemester * 30, 30) : null;
    return {
        completedEcts,
        targetEcts,
        progressPct: hasCompletedEcts ? clampPercent((completedEcts / targetEcts) * 100, 0) : null,
        performance: performance || { value: '--', label: 'GPA' },
        scheduleCount: Array.isArray(scheduleRows) ? scheduleRows.length : 0,
        unreadCount: normalizeStudentMetric(unread)
    };
}

function getNotificationSnapshot(user) {
    const items = typeof getPortalNotificationItemsForUser === 'function' ? getPortalNotificationItemsForUser(user?.id) : [];
    const unread = typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(user?.id) : items.filter((item) => !item.read).length;
    return { items, unread };
}

function getNewsHomeSnapshotSafe() {
    return typeof window.getNewsHomeSnapshot === 'function'
        ? window.getNewsHomeSnapshot()
        : { items: [], unread: 0, fetchedAt: 0 };
}

function buildNewsHomeQuickTile(unread = 0) {
    const snapshot = getNewsHomeSnapshotSafe();
    const topTitle = snapshot.items?.[0]?.title || 'Campus announcements';
    return buildQuickTile(
        'news',
        'Campus News',
        'fas fa-newspaper',
        unread > 0 ? `${topTitle} and other official university updates.` : 'Official university announcements for your role and faculty.',
        unread > 0 ? `${unread} new` : `${snapshot.items.length || 0} featured`,
        unread > 0 ? 'Read new announcements' : 'Open news workspace',
        deriveProgressFromCount(unread || snapshot.items.length, 18, 14));
}

function getRecentHomeUpdates(user, limit = 4) {
    const notifications = getNotificationSnapshot(user).items.map((item) => ({
        icon: item.source === 'social' ? 'fas fa-comments' : 'fas fa-bell',
        title: cleanupUiText(item.title || item.type || 'Update', 'Update'),
        copy: cleanupUiText(item.text || 'Portal activity updated.', 'Portal activity updated.'),
        when: formatRelativeTime(item.createdAt || item.updatedAt),
        timestamp: Date.parse(item.createdAt || item.updatedAt || '') || 0,
        pageId: item.source === 'social' ? 'social' : 'news'
    }));
    const orders = getOrdersSnapshot(user).orders.map((order) => ({
        icon: 'fas fa-book-open',
        title: cleanupUiText(order.title || order.type || 'Order', 'Order'),
        copy: cleanupUiText(order.type || 'Official order published.', 'Official order published.'),
        when: formatRelativeTime(order.createdAt || order.createdDate),
        timestamp: Date.parse(order.createdAt || order.createdDate || '') || 0,
        pageId: 'orders'
    }));
    const newsItems = (getNewsHomeSnapshotSafe().items || []).map((post) => ({
        icon: 'fas fa-newspaper',
        title: cleanupUiText(post.title || 'University update', 'University update'),
        copy: cleanupUiText(post.sectionLabel || 'Campus News', 'Campus News'),
        when: formatRelativeTime(post.publishedAt || post.updatedAt || post.createdAt),
        timestamp: Date.parse(post.publishedAt || post.updatedAt || post.createdAt || '') || 0,
        pageId: 'news'
    }));
    return [...newsItems, ...notifications, ...orders]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

function clampPercent(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function deriveProgressFromCount(count, base = 18, step = 16) {
    return clampPercent(base + Number(count || 0) * step, base);
}

function buildQuickTile(pageId, label, icon, copy, meta, status, progress) {
    return { pageId, label, icon, copy, meta, status, progress: clampPercent(progress) };
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

function getStudentCompactScheduleRows(user) {
    const schedule = sortScheduleItems(typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
    return schedule.slice(0, 4).map((item) => ({
        time: formatScheduleTimeRange(item),
        title: getSubjectLabel(item.courseId, item.courseName),
        meta: `${cleanupUiText(item.day || 'Day', 'Day')} · ${cleanupUiText(item.room || 'Room TBA', 'Room TBA')}`
    }));
}

function buildStudentCourseList(user, limit = 4) {
    const schedule = sortScheduleItems(typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
    const seen = new Set();
    const courses = [];
    schedule.forEach((item) => {
        const courseId = String(item?.courseId || item?.sourceCourseId || '').trim();
        const title = getSubjectLabel(courseId, item.courseName || item.subjectName || courseId);
        const key = courseId || title.toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        courses.push({
            title,
            meta: [cleanupUiText(item.groupName || item.groupId || '', ''), cleanupUiText(item.day || '', '')]
                .filter(Boolean)
                .join(' · ') || 'Course',
            pageId: 'lms'
        });
    });
    return courses.slice(0, limit);
}

function buildStudentCampusUpdates(user, limit = 4) {
    const items = getRecentHomeUpdates(user, limit).map((item) => ({
        title: item.title,
        meta: item.copy,
        when: item.when,
        pageId: item.pageId || 'news',
        icon: item.icon || 'fas fa-bell'
    }));
    return items.length
        ? items
        : [{ title: 'No new updates', meta: 'News, orders, and notifications will appear here.', when: '', pageId: 'news', icon: 'fas fa-bell' }];
}

function buildStudentLifeSnapshot({
    registrationLabel,
    ordersUnread = 0,
    notificationsUnread = 0,
    messengerUnread = 0,
    supportCount = 0
}) {
    return [
        { label: 'Registration', value: registrationLabel || 'Status unavailable', pageId: 'registration', icon: 'fas fa-check-square' },
        { label: 'Orders', value: `${Number(ordersUnread || 0)} unread`, pageId: 'orders', icon: 'fas fa-book-open' },
        { label: 'Notifications', value: `${Number(notificationsUnread || 0)} unread`, pageId: 'news', icon: 'fas fa-bell' },
        { label: 'Messages', value: `${Number(messengerUnread || 0)} unread`, pageId: 'social', icon: 'fas fa-comments' },
        { label: 'Support', value: `${Number(supportCount || 0)} open`, pageId: 'student-service', icon: 'fas fa-headset' }
    ].slice(0, 5);
}

function buildStudentDenseShortcuts({ registrationOpen = false } = {}) {
    return [
        { pageId: 'registration', label: registrationOpen ? 'Registration' : 'Selections' },
        { pageId: 'orders', label: 'Orders' },
        { pageId: 'social', label: 'Messages' },
        { pageId: 'student-service', label: 'Student Service' }
    ];
}

function readStudentGradeLastUpdatedMs(record = {}) {
    let latest = Date.parse(record?.updatedAt || '') || 0;
    const assessments = record?.assessments && typeof record.assessments === 'object' ? record.assessments : {};
    Object.values(assessments).forEach((entries) => {
        (Array.isArray(entries) ? entries : []).forEach((entry) => {
            const stamp = Date.parse(entry?.updatedAt || '') || 0;
            if (stamp > latest) latest = stamp;
            (Array.isArray(entry?.history) ? entry.history : []).forEach((hist) => {
                const histStamp = Date.parse(hist?.updatedAt || '') || 0;
                if (histStamp > latest) latest = histStamp;
            });
        });
    });
    return latest;
}

function collectStudentLastUpdatedScoreEvents(user, limit = 4) {
    const studentId = String(user?.id || '');
    if (!studentId) return [];
    const events = [];
    Object.entries(KIU_STATE?.studentGrades || {}).forEach(([rosterKey, roster]) => {
        const record = (Array.isArray(roster) ? roster : []).find((entry) => String(entry?.id) === studentId);
        if (!record) return;
        const subjectTitle = getSubjectLabel(
            record.courseId || record.subjectId || rosterKey.split('_')[0],
            record.courseName || record.subjectName || record.name || rosterKey
        );
        const assessments = record.assessments && typeof record.assessments === 'object' ? record.assessments : null;
        if (assessments) {
            Object.entries(assessments).forEach(([criterion, entries]) => {
                (Array.isArray(entries) ? entries : []).forEach((entry) => {
                    if (entry?.score === null || entry?.score === undefined || entry?.score === '') return;
                    const updatedAt = entry.updatedAt || entry.history?.at?.(-1)?.updatedAt || record.updatedAt || '';
                    const updatedMs = Date.parse(updatedAt) || 0;
                    const label = cleanupUiText(entry.title || criterion, criterion);
                    events.push({
                        title: subjectTitle,
                        meta: `${label} · ${entry.score}${updatedMs ? ` · ${formatRelativeTime(updatedAt)}` : ''}`,
                        pageId: 'study-card',
                        updatedMs
                    });
                });
            });
            return;
        }
        const combined = typeof getGradeRecordCombinedKiuPassScore === 'function'
            ? Number(getGradeRecordCombinedKiuPassScore(record) || 0)
            : Number(record?.q1 || 0) + Number(record?.qa || 0) + Number(record?.mid || 0) + Number(record?.final || 0);
        if (!Number.isFinite(combined) || combined <= 0) return;
        const updatedMs = readStudentGradeLastUpdatedMs(record);
        const letter = record?.letter || '';
        events.push({
            title: subjectTitle,
            meta: `Score ${Math.round(combined)}${letter ? ` · ${letter}` : ''}${updatedMs ? ` · ${formatRelativeTime(new Date(updatedMs).toISOString())}` : ''}`,
            pageId: 'study-card',
            updatedMs
        });
    });
    events.sort((left, right) => (right.updatedMs || 0) - (left.updatedMs || 0));
    return events.slice(0, limit).map(({ title, meta, pageId }) => ({ title, meta, pageId, icon: 'fas fa-chart-line' }));
}

function buildStudentScoresSnapshot(user, limit = 4) {
    const lastUpdated = collectStudentLastUpdatedScoreEvents(user, limit);
    if (lastUpdated.length) return lastUpdated;
    if (typeof getStudentScoreRows === 'function') {
        const rows = getStudentScoreRows(user, limit) || [];
        if (rows.length) {
            return rows.map((row) => ({
                title: row.title || 'Subject',
                meta: row.copy || '',
                pageId: 'study-card',
                icon: 'fas fa-chart-line'
            }));
        }
    }
    return [];
}

function truncateStudentFeedText(value, max = 72) {
    const text = cleanupUiText(value, '');
    if (!text) return '';
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function buildStudentCampusFeedSnapshot(_user, limit = 4) {
    const runtimeFeed = Array.isArray(window.__kiuSocialLiteRuntime?.feed)
        ? window.__kiuSocialLiteRuntime.feed
        : [];
    const hubPosts = Array.isArray(KIU_STATE?.socialHub?.posts)
        ? KIU_STATE.socialHub.posts
        : [];
    const source = runtimeFeed.length ? runtimeFeed : hubPosts;
    return source
        .map((post) => {
            const stamp = post?.createdAt || post?.updatedAt || post?.publishedAt || '';
            const author = cleanupUiText(
                post?.authorName || post?.authorDisplayName || post?.author?.name || post?.author?.nameEn || '',
                'Campus Social'
            );
            const body = truncateStudentFeedText(post?.text || post?.body || post?.content || post?.caption || '');
            return {
                title: body || 'Campus post',
                meta: author,
                when: stamp ? formatRelativeTime(stamp) : '',
                pageId: 'social',
                icon: 'fas fa-comments',
                timestamp: Date.parse(stamp) || 0
            };
        })
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
        .slice(0, limit)
        .map(({ title, meta, when, pageId, icon }) => ({ title, meta, when, pageId, icon }));
}

function buildStudentEventsSnapshot(_user, limit = 4) {
    const runtimeEvents = Array.isArray(window.__kiuSocialLiteRuntime?.social?.events)
        ? window.__kiuSocialLiteRuntime.social.events
        : [];
    const stateEvents = Array.isArray(KIU_STATE?.social?.events)
        ? KIU_STATE.social.events
        : (Array.isArray(KIU_STATE?.socialHub?.events) ? KIU_STATE.socialHub.events : []);
    const source = runtimeEvents.length ? runtimeEvents : stateEvents;
    const graceMs = Date.now() - (60 * 60 * 1000);
    const mapped = source.map((event) => {
        const startRaw = event?.startsAt || event?.startAt || event?.starts || '';
        const startMs = Date.parse(startRaw) || 0;
        return {
            title: cleanupUiText(event?.title || event?.name || '', 'Campus event'),
            meta: cleanupUiText(event?.location || event?.place || event?.hostName || event?.host || '', ''),
            when: startMs ? formatRelativeTime(startRaw) : '',
            pageId: 'social',
            icon: 'fas fa-calendar-check',
            startMs
        };
    });
    const upcoming = mapped.filter((item) => !item.startMs || item.startMs >= graceMs);
    const pool = upcoming.length ? upcoming : mapped;
    return pool
        .sort((left, right) => (left.startMs || Number.MAX_SAFE_INTEGER) - (right.startMs || Number.MAX_SAFE_INTEGER))
        .slice(0, limit)
        .map(({ title, meta, when, pageId, icon }) => ({ title, meta, when, pageId, icon }));
}

function normalizeWeekdayKey(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw.startsWith('mon')) return 'Mon';
    if (raw.startsWith('tue')) return 'Tue';
    if (raw.startsWith('wed')) return 'Wed';
    if (raw.startsWith('thu')) return 'Thu';
    if (raw.startsWith('fri')) return 'Fri';
    if (raw.startsWith('sat')) return 'Sat';
    if (raw.startsWith('sun')) return 'Sun';
    return '';
}

function buildStudentWeekStrip(user) {
    const schedule = sortScheduleItems(typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
    const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const todayKey = normalizeWeekdayKey(new Date().toLocaleDateString('en-US', { weekday: 'short' }));
    const byDay = Object.fromEntries(dayKeys.map((key) => [key, []]));
    schedule.forEach((item) => {
        const key = normalizeWeekdayKey(item.day);
        if (!byDay[key]) return;
        byDay[key].push({
            title: getSubjectLabel(item.courseId, item.courseName),
            time: formatScheduleTimeRange(item)
        });
    });
    const days = dayKeys.map((key) => {
        const sessions = byDay[key];
        return {
            key,
            label: key,
            count: sessions.length,
            title: sessions[0]?.title || '',
            time: sessions[0]?.time || '',
            isToday: key === todayKey,
            hasSessions: sessions.length > 0
        };
    });
    return {
        days,
        empty: !schedule.length,
        emptyTitle: 'No listed classes yet',
        emptyCopy: 'Register to unlock your week strip and timetable.'
    };
}

function buildStudentAcademicPulse({ semester, completed, performance }) {
    const known = completed !== null && completed !== undefined && Number.isFinite(Number(completed));
    const completedEcts = known ? normalizeStudentMetric(completed) : null;
    const targetEcts = known ? Math.max(Math.round(normalizeStudentMetric(semester, 1)) * 30, 30) : null;
    const remaining = known ? Math.max(0, targetEcts - completedEcts) : null;
    const pct = known ? clampPercent((completedEcts / targetEcts) * 100, 0) : null;
    return {
        known,
        completed: completedEcts,
        target: targetEcts,
        remaining,
        pct,
        performance: performance || { value: '--', label: 'GPA' },
        semester: `S${Math.max(1, Math.round(normalizeStudentMetric(semester, 1)))}`,
        legend: known
            ? [
                { label: 'Completed', value: `${completedEcts} ECTS`, tone: 'done' },
                { label: 'Remaining', value: `${remaining} ECTS`, tone: 'rest' },
                { label: performance?.label || 'GPA', value: performance?.value || '--', tone: 'meta' }
            ]
            : [
                { label: 'ECTS', value: 'Unavailable', tone: 'rest' },
                { label: performance?.label || 'GPA', value: performance?.value || '--', tone: 'meta' },
                { label: 'Term', value: `S${Math.max(1, Math.round(normalizeStudentMetric(semester, 1)))}`, tone: 'meta' }
            ]
    };
}

function buildStudentLatestNews(limit = 3) {
    const items = (getNewsHomeSnapshotSafe().items || []).map((post) => ({
        title: cleanupUiText(post.title || 'University update', 'University update'),
        meta: cleanupUiText(post.sectionLabel || 'Campus News', 'Campus News'),
        when: formatRelativeTime(post.publishedAt || post.updatedAt || post.createdAt),
        timestamp: Date.parse(post.publishedAt || post.updatedAt || post.createdAt || '') || 0,
        pageId: 'news'
    }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    return items.length
        ? items
        : [{ title: 'No campus news yet', meta: 'Official announcements will appear here.', when: '', pageId: 'news' }];
}

function resolveStudentLmsResourceKeys(user) {
    const schedule = typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : [];
    const keys = [];
    const seen = new Set();
    (schedule || []).forEach((item) => {
        const courseId = String(item?.courseId || item?.sourceCourseId || '').trim();
        const groupId = String(item?.groupId || '').trim();
        if (!courseId) return;
        const key = groupId ? `${courseId}::${groupId}` : courseId;
        const canonical = typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(key)
            : key;
        if (!canonical || seen.has(canonical)) return;
        seen.add(canonical);
        keys.push({
            resourceKey: canonical,
            subject: getSubjectLabel(courseId, item.courseName || item.subjectName || courseId)
        });
    });
    return keys;
}

function readLmsAssignmentsForKey(resourceKey) {
    if (typeof ensureLmsAssignmentsForKey === 'function') {
        try {
            return ensureLmsAssignmentsForKey(resourceKey) || [];
        } catch (_error) {
            return [];
        }
    }
    const store = KIU_STATE?.groupAssignments || KIU_STATE?.assignments || {};
    return Array.isArray(store[resourceKey]) ? store[resourceKey] : [];
}

function readLmsSubmissionForStudent(resourceKey, assignmentId, studentId) {
    if (typeof getLmsAssignmentSubmissions === 'function') {
        try {
            const map = getLmsAssignmentSubmissions(resourceKey, assignmentId) || {};
            return map[studentId] || null;
        } catch (_error) {
            return null;
        }
    }
    const bucket = KIU_STATE?.groupSubmissions?.[resourceKey]?.[assignmentId];
    if (!bucket || typeof bucket !== 'object') return null;
    return bucket[studentId] || null;
}

function classifyStudentAssignmentWork(assignment, submission, nowMs) {
    if (submission) return null;
    const deadlineRaw = assignment?.deadline || assignment?.dueAt || assignment?.dueDate || '';
    const deadlineMs = Date.parse(deadlineRaw) || 0;
    if (!deadlineMs) {
        return {
            tone: 'missing',
            label: 'Needs submit',
            sort: 2,
            dueMs: Number.MAX_SAFE_INTEGER
        };
    }
    const dayMs = 24 * 60 * 60 * 1000;
    if (deadlineMs < nowMs) {
        return {
            tone: 'overdue',
            label: 'Overdue',
            sort: 0,
            dueMs: deadlineMs
        };
    }
    if (deadlineMs - nowMs <= 7 * dayMs) {
        return {
            tone: 'due-soon',
            label: 'Due soon',
            sort: 1,
            dueMs: deadlineMs
        };
    }
    return {
        tone: 'missing',
        label: 'Needs submit',
        sort: 2,
        dueMs: deadlineMs
    };
}

function getStudentWorkDueSnapshot(user, limit = 4) {
    const studentId = String(user?.id || '');
    const hasLmsHelpers = typeof ensureLmsAssignmentsForKey === 'function'
        && typeof getLmsAssignmentSubmissions === 'function';
    const hasPersistedStore = Boolean(
        (KIU_STATE?.groupAssignments && Object.keys(KIU_STATE.groupAssignments).length)
        || (KIU_STATE?.assignments && Object.keys(KIU_STATE.assignments).length)
    );
    if (!studentId || (!hasLmsHelpers && !hasPersistedStore)) {
        return {
            available: false,
            items: [],
            emptyTitle: 'Work signals unavailable',
            emptyCopy: 'Open LMS to sync assignments and due work.'
        };
    }
    const nowMs = Date.now();
    const items = [];
    resolveStudentLmsResourceKeys(user).forEach(({ resourceKey, subject }) => {
        readLmsAssignmentsForKey(resourceKey).forEach((assignment) => {
            const submission = readLmsSubmissionForStudent(resourceKey, assignment.id, studentId);
            const classified = classifyStudentAssignmentWork(assignment, submission, nowMs);
            if (!classified) return;
            items.push({
                title: cleanupUiText(assignment.title || 'Assignment', 'Assignment'),
                meta: `${subject} · ${classified.label}${assignment.deadline ? ` · ${formatRelativeTime(assignment.deadline)}` : ''}`,
                tone: classified.tone,
                label: classified.label,
                pageId: 'lms',
                icon: 'fas fa-clipboard-list',
                sort: classified.sort,
                dueMs: classified.dueMs
            });
        });
    });
    items.sort((a, b) => (a.sort - b.sort) || (a.dueMs - b.dueMs));
    const sliced = items.slice(0, limit);
    return {
        available: true,
        items: sliced,
        emptyTitle: sliced.length ? '' : 'No open assignments',
        emptyCopy: sliced.length ? '' : 'Nothing due or missing right now.'
    };
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
            buildQuickTile('lms', 'LMS', 'fas fa-book-reader', 'Classes, assignments, materials, and live course updates.', `${context.unreadUpdates} updates`, context.unreadUpdates > 0 ? 'Check latest course activity' : 'All quiet for now', deriveProgressFromCount(context.unreadUpdates, 22, 15)),
            buildQuickTile('registration', 'Registration', 'fas fa-check-square', context.registrationOpen ? 'Registration is open for section, elective, and free-credit choices.' : 'Registration is closed. Review your current academic selections.', context.registrationOpen ? 'Open now' : 'Closed', context.registrationOpen ? 'Continue registration' : 'Review selections', context.registrationOpen ? 86 : 24),
            buildQuickTile('timetable', 'Timetable', 'fas fa-chalkboard', context.nextClass ? `Next class: ${context.nextClass.title}.` : 'See your weekly teaching schedule, rooms, and times.', context.nextClass ? 'Live schedule' : 'Awaiting sections', context.nextClass ? 'Ready for the next block' : 'Choose sections first', context.nextClass ? 68 : 14),
            buildQuickTile('study-card', 'Study Card', 'far fa-address-card', `${context.completedEcts} completed ECTS with transcript and progress records in one place.`, `${context.completedEcts} ECTS`, context.performanceLabel ? `${context.performanceLabel}: ${context.performanceValue}` : 'Academic record', context.progressPct),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'official order')} available in your archive.`, `${context.ordersCount} total`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 16, 19)),
            buildQuickTile('student-service', 'Student Service', 'fas fa-headset', 'Support requests, guidance articles, and support.', `${context.supportCount} open`, 'Speak with Student Service', deriveProgressFromCount(context.supportCount, 14, 22)),
            buildNewsHomeQuickTile(context.newsUnread)
        ];
    }
    if (role === 'professor') {
        return [
            buildQuickTile('timetable', 'Schedule', 'fas fa-calendar-week', context.nextFacultySession ? `Next session: ${context.nextFacultySession.title}.` : 'Review assigned classes, rooms, and timing.', `${context.sectionCount} sections`, 'Active schedule', deriveProgressFromCount(context.sectionCount, 32, 11)),
            buildQuickTile('lms', 'LMS', 'fas fa-book-reader', 'Materials, grading, submissions, and course communication.', `${context.studentCount} students`, 'Manage delivery', deriveProgressFromCount(context.studentCount, 20, 1.2)),
            buildQuickTile('exams', 'Exams', 'fas fa-file-signature', `${formatCountLabel(context.examCount, 'exam')} prepared for the active faculty profile.`, `${context.examCount} ready`, 'Assessments', deriveProgressFromCount(context.examCount, 18, 13)),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'order')} and notice in the faculty inbox.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 15)),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Follow announcements and faculty communication without leaving the shell.', `${context.unreadUpdates} updates`, 'Campus communication', deriveProgressFromCount(context.unreadUpdates, 18, 14)),
            buildNewsHomeQuickTile(context.newsUnread),
            buildQuickTile('chancellery', 'Appeals', 'fas fa-inbox', `${formatCountLabel(context.unreadUpdates, 'unread update')} across appeals, notices, and operational messages.`, 'Appeals', 'Review requests', deriveProgressFromCount(context.unreadUpdates, 24, 12))
        ];
    }
    if (role === 'ta') {
        return [
            buildQuickTile('lms', 'LMS Sections', 'fas fa-book-reader', 'Support labs, discussions, attendance, and teaching materials.', `${context.studentCount} students`, 'Section support', deriveProgressFromCount(context.studentCount, 24, 1)),
            buildQuickTile('timetable', 'Schedule', 'fas fa-calendar-week', context.nextFacultySession ? `Next support block: ${context.nextFacultySession.title}.` : 'Track section timing, rooms, and faculty coordination.', `${context.sectionCount} sections`, 'Active schedule', deriveProgressFromCount(context.sectionCount, 28, 12)),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'official order')} and notice in the support queue.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 16)),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Keep section communication and class coordination moving.', `${context.unreadUpdates} updates`, 'Reply to students', deriveProgressFromCount(context.unreadUpdates, 20, 14)),
            buildQuickTile('library', 'Library', 'fas fa-book', 'Reference material, reserve content, and campus resources.', 'Reserve access', 'Teaching resources', 38),
            buildNewsHomeQuickTile(context.newsUnread),
            buildQuickTile('chancellery', 'Appeals', 'fas fa-inbox', `${formatCountLabel(context.unreadUpdates, 'unread update')} tied to teaching support and student follow-up.`, 'Follow-up', 'Track requests', deriveProgressFromCount(context.unreadUpdates, 16, 13))
        ];
    }
    if (role === 'student_service') {
        return [
            buildQuickTile('student-service', 'Service Inbox', 'fas fa-inbox', `${formatCountLabel(context.openTickets, 'active ticket')} currently needs follow-up.`, `${context.openTickets} live`, 'Resolve service cases', deriveProgressFromCount(context.openTickets, 24, 14)),
            buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'order')} and decision waiting in the service workspace.`, `${context.ordersCount} orders`, `${context.ordersUnread} unread`, deriveProgressFromCount(context.ordersCount, 18, 16)),
            buildQuickTile('library', 'Library', 'fas fa-book', 'Reference support, circulation help, and knowledge requests.', `${context.articleCount} articles`, 'Knowledge base', deriveProgressFromCount(context.articleCount, 22, 11)),
            buildQuickTile('social', 'Social', 'fas fa-comments', 'Watch public updates and common student questions.', `${context.unreadUpdates} updates`, 'Updates', deriveProgressFromCount(context.unreadUpdates, 18, 14)),
            buildQuickTile('profile', 'Profile', 'far fa-user', 'Keep service account identity, access details, and shell settings aligned.', 'Account', 'Settings', 42),
            buildNewsHomeQuickTile(context.newsUnread),
            buildQuickTile('chancellery', 'Campus Requests', 'fas fa-desktop', `${formatCountLabel(context.unreadUpdates, 'unread update')} across service communication and notices.`, 'Escalations', 'Route requests', deriveProgressFromCount(context.unreadUpdates, 18, 12))
        ];
    }
    return [
        buildQuickTile('admin-scheduler', 'Scheduler', 'fas fa-calendar-plus', 'Coordinate rooms, weeks, and course distribution from the master schedule.', `${context.studentCount} students`, 'Master schedule', deriveProgressFromCount(context.studentCount, 20, 0.6)),
        buildQuickTile('staff', 'Staff', 'fas fa-users-cog', `${formatCountLabel(context.staffCount, 'staff account')} in the current faculty network.`, `${context.staffCount} staff`, 'Staff records', deriveProgressFromCount(context.staffCount, 18, 10)),
        buildQuickTile('students-admin', 'Students', 'fas fa-user-graduate', `${formatCountLabel(context.studentCount, 'student')} in the active faculty profile.`, `${context.studentCount} students`, 'Student records', deriveProgressFromCount(context.studentCount, 18, 0.8)),
        buildQuickTile('exams', 'Exams', 'fas fa-file-signature', `${formatCountLabel(context.examCount, 'exam')} and assessment package available for review.`, `${context.examCount} exams`, 'Assessments', deriveProgressFromCount(context.examCount, 18, 14)),
        buildQuickTile('admin-tools', 'Admin Tools', 'fas fa-layer-group', 'Curriculum, accounts, and registration management.', 'Admin tools', 'Open builders', 84),
        buildNewsHomeQuickTile(context.newsUnread),
        buildQuickTile('orders', 'Orders', 'fas fa-book-open', `${formatCountLabel(context.ordersCount, 'faculty order')} ready for operational follow-up.`, `${context.ordersCount} orders`, 'Orders', deriveProgressFromCount(context.ordersCount, 18, 15))
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
    const newsSnapshot = getNewsHomeSnapshotSafe();
    const updates = getRecentHomeUpdates(user, 4);

    if (role === 'student') {
        const semester = normalizeStudentMetric(
            typeof getCurrentStudentSemesterNumber === 'function' ? getCurrentStudentSemesterNumber(user) : (KIU_STATE.activeSemester || 1),
            1
        );
        const performance = getStudentPerformanceMetric(user);
        const hasCompletedEctsSource = typeof getStudentCompletedEctsTotal === 'function';
        const completedRaw = hasCompletedEctsSource ? getStudentCompletedEctsTotal(user.id, facultyCode) : null;
        const completed = completedRaw !== null && completedRaw !== undefined && Number.isFinite(Number(completedRaw))
            ? normalizeStudentMetric(completedRaw)
            : null;
        const rawSchedule = typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : [];
        const scheduleRows = getStudentScheduleRows(user);
        const nextClass = scheduleRows[0];
        const progressTarget = completed === null ? null : Math.max(semester * 30, 30);
        const progressPct = completed === null ? null : clampPercent((completed / progressTarget) * 100, 0);
        const studentProgress = buildStudentProgressModel({
            semester,
            completed,
            performance,
            scheduleRows,
            unread: notifications.unread
        });
        const completedLabel = completed === null ? 'Unavailable' : String(completed);
        const registrationKnown = typeof KIU_STATE.registrationOpen === 'boolean';
        const registrationLabel = registrationKnown
            ? (KIU_STATE.registrationOpen ? 'Registration open' : 'Registration closed')
            : 'Registration status unavailable';
        const stats = [[`S${semester}`, 'Semester'], [performance.value, performance.label], [completedLabel, 'ECTS'], [String(notifications.unread), 'Updates']];
        const userRequests = (KIU_STATE.chancelleryRequests || []).filter((request) => {
            const owner = String(request?.studentId || request?.userId || request?.createdBy || request?.authorId || '');
            return owner && String(user?.id || '') === owner;
        });
        const supportCount = userRequests.length;
        const quick = getRoleShortcuts(role, {
            registrationOpen: Boolean(KIU_STATE.registrationOpen),
            nextClass,
            completedEcts: completedLabel,
            performanceLabel: performance.label,
            performanceValue: performance.value,
            progressPct: progressPct ?? 0,
            ordersCount: orders.orders.length,
            ordersUnread: orders.unread,
            unreadUpdates: notifications.unread,
            newsUnread: newsSnapshot.unread,
            supportCount
        });
        const actions = getRoleActions(role, { registrationOpen: Boolean(KIU_STATE.registrationOpen) });
        const compactSchedule = getStudentCompactScheduleRows(user);
        const weekStrip = buildStudentWeekStrip(user);
        const academicPulse = buildStudentAcademicPulse({ semester, completed, performance });
        const latestNews = buildStudentLatestNews(3);
        const workDue = getStudentWorkDueSnapshot(user, 4);
        const events = buildStudentEventsSnapshot(user, 4);
        const messenger = getMessengerSnapshot(user);
        const campusUpdates = buildStudentCampusUpdates(user, 4);
        const lifeSnapshot = buildStudentLifeSnapshot({
            registrationLabel,
            ordersUnread: orders.unread,
            notificationsUnread: notifications.unread,
            messengerUnread: messenger.unread,
            supportCount
        });
        const denseShortcuts = buildStudentDenseShortcuts({
            registrationOpen: Boolean(KIU_STATE.registrationOpen)
        });
        const scores = buildStudentScoresSnapshot(user, 4);
        const campusFeed = buildStudentCampusFeedSnapshot(user, 4);
        const nextListed = compactSchedule[0] || null;
        const latestUpdate = updates[0]
            ? {
                title: updates[0].title,
                meta: `${updates[0].copy} · ${updates[0].when}`,
                pageId: updates[0].pageId || 'news'
            }
            : {
                title: 'No new updates',
                meta: 'You are caught up.',
                pageId: 'news'
            };
        const ectsSummary = completed === null
            ? 'ECTS unavailable'
            : `${completed} / ${progressTarget} ECTS`;
        const nextListedLine = nextListed
            ? `Next listed: ${nextListed.meta.split(' · ')[0] || 'Day'} ${nextListed.time} · ${nextListed.title}`
            : 'No listed classes yet';
        const newsUnread = Number(newsSnapshot.unread || 0);
        const topWork = workDue.items[0] || null;
        const attention = topWork
            ? {
                title: topWork.title,
                meta: topWork.meta,
                actionLabel: 'Open LMS',
                actionPage: 'lms',
                tone: topWork.tone === 'overdue' ? 'warm' : 'support'
            }
            : newsUnread > 0
                ? {
                    title: `${newsUnread} unread news item${newsUnread === 1 ? '' : 's'}`,
                    meta: `Latest: ${latestNews[0]?.title || 'Campus news'}`,
                    actionLabel: 'Open news',
                    actionPage: 'news',
                    tone: 'support'
                }
                : notifications.unread > 0
                    ? {
                        title: `${notifications.unread} portal notification${notifications.unread === 1 ? '' : 's'}`,
                        meta: `Latest: ${latestUpdate.title}`,
                        actionLabel: 'Review updates',
                        actionPage: latestUpdate.pageId || 'news',
                        tone: 'support'
                    }
                    : {
                        title: 'All caught up',
                        meta: 'No due work or urgent updates.',
                        actionLabel: '',
                        actionPage: '',
                        tone: 'green'
                    };
        const studentDashboard = {
            context: {
                firstName,
                facultyName,
                termLabel,
                semester: `S${semester}`,
                registrationLabel
            },
            status: {
                label: registrationLabel,
                actionLabel: newsUnread > 0 || notifications.unread > 0 ? 'Review updates' : 'Open LMS',
                actionPage: newsUnread > 0 || notifications.unread > 0 ? 'news' : 'lms',
                tone: topWork?.tone === 'overdue' ? 'warm' : 'green',
                registrationLabel
            },
            stats: {
                semester: `S${semester}`,
                performance: performance.value,
                performanceLabel: performance.label,
                completedEcts: completed === null ? 'Unavailable' : completed,
                unread: notifications.unread
            },
            schedule: compactSchedule,
            progress: studentProgress,
            weekStrip,
            academicPulse,
            latestNews,
            campusUpdates,
            events,
            lifeSnapshot,
            shortcuts: denseShortcuts,
            scores,
            campusFeed,
            workDue,
            latestUpdate,
            overallSummary: {
                primary: `S${semester} · ${performance.label} ${performance.value} · ${ectsSummary}`,
                secondary: nextListedLine,
                tertiary: registrationLabel
            },
            attention
        };
        return {
            variant: 'student',
            kicker: 'Student Dashboard',
            title: `${firstName}, here is your dashboard.`,
            copy: `${termLabel} in ${facultyName}. Your classes, registration, records, and campus updates.`,
            pills: [facultyName, termLabel, `Semester S${semester}`, registrationLabel, `${notifications.unread} unread updates`],
            stats,
            actions,
            quick,
            studentProgress,
            studentDashboard,
            heroAside: buildStudentHeroAside(rawSchedule, facultyName),
            alert: null,
            summary: { title: 'Today', copy: 'Your next moves before the next class, deadline, or advisor checkpoint.', rows: [['Next listed class', nextClass?.title || 'No class scheduled'], ['Registration', registrationLabel], ['Orders', `${orders.unread} unread`], [performance.label, performance.value]] },
            focus: { title: 'Academic status', copy: 'Credits, access, and progress conditions for the active term.', rows: [['Completed ECTS', completedLabel], ['Faculty', facultyName], ['Unread updates', String(notifications.unread)], ['Work due', String(workDue.items.length)]] },
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
            newsUnread: newsSnapshot.unread,
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
            heroAside: buildFacultyHeroAside({
                role,
                scheduleRows,
                rawSchedule: facultySchedule,
                facultyName,
                sectionCount,
                studentCount
            }),
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
            newsUnread: newsSnapshot.unread,
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
                kicker: 'Service queue',
                chip: openTickets.length > 0 ? `${openTickets.length} open` : 'Clear queue',
                headline: openTickets.length > 0 ? `${openTickets.length} open tickets` : 'Queue is clear',
                copy: openTickets.length > 0
                    ? `${waitingForService} waiting for service and ${waitingForStudent} waiting for student response.`
                    : 'There are no unresolved service tickets demanding action right now.',
                meta: { icon: openTickets.length ? 'fa-headset' : 'fa-circle-check', text: cleanupUiText(facultyName, 'Faculty') }
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
                { title: 'Knowledge & guidance', meta: articles.length ? 'Articles' : 'None', rows: articles.length ? articles.slice(0, 4).map((article) => ({ icon: 'fas fa-book-open', title: cleanupUiText(article.title, 'Knowledge article'), copy: cleanupUiText(article.summary || 'Guidance article', 'Guidance article') })) : [{ icon: 'fas fa-book-open', title: 'No guidance articles yet', copy: 'Publish service articles in the knowledge base when this faculty needs reusable guidance.' }] },
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
        unreadUpdates: notifications.unread,
        newsUnread: newsSnapshot.unread
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
            kicker: 'Faculty overview',
            chip: `${students.length} students`,
            headline: `${students.length} students`,
            copy: `${curriculum.length} curriculum modules and ${exams.length} exams in the active faculty profile.`,
            meta: { icon: 'fa-layer-group', text: cleanupUiText(facultyName, 'Faculty') }
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

function buildHomeDataFingerprint(role = (typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student')) {
    const user = getCurrentUserSafe();
    const facultyCode = getCurrentFacultyCode();
    const notifications = getNotificationSnapshot(user);
    const orders = getOrdersSnapshot(user);
    const newsSnapshot = getNewsHomeSnapshotSafe();
    const scheduleCount = role === 'student'
        ? getStudentScheduleRows(user).length
        : getFacultyScheduleRows().length;
    return [
        role,
        facultyCode,
        notifications.unread,
        orders.unread,
        orders.orders.length,
        newsSnapshot.unread,
        scheduleCount,
        Boolean(KIU_STATE.registrationOpen) ? '1' : '0'
    ].join('|');
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
    getStudentWorkDueSnapshot,
    buildStudentWeekStrip,
    buildStudentAcademicPulse,
    buildStudentCourseList,
    buildStudentCampusUpdates,
    buildStudentLifeSnapshot,
    buildStudentDenseShortcuts,
    buildStudentScoresSnapshot,
    buildStudentCampusFeedSnapshot,
    buildStudentEventsSnapshot,
    formatCountLabel,
    getRoleActions,
    getRoleShortcuts,
    buildHomeModel,
    buildHomeDataFingerprint,
    buildHomeContext,
    clampPercent
});
