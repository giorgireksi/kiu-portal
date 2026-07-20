/* Schedule text/week/group helpers. Peeled from faculty.js.
 * Load before faculty.js.
 */
(function initFacultyScheduleRuntime() {
    if (window.__KIU_FACULTY_SCHEDULE_LOADED) return;
    window.__KIU_FACULTY_SCHEDULE_LOADED = true;

    window.__kiuCreateFacultyScheduleApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function hasBrokenScheduleDisplayText(value) {
    const text = String(value || '');
    const mojibakeMarks = (text.match(/[\u00A1\u00A2\u00AC\u00C2\u00C3\u00C6\u00E2\u0192\u2018-\u2026]/g) || []).length;
    return /(?:\?{3,}|[\uFFFD\u1400-\u167F]|[\u00C0-\u00FF][\u0192\u00C2\u00C3\u2018-\u201D\u2020-\u2026])/.test(text)
        || mojibakeMarks >= 2;
}
function decodeScheduleMojibakeText(value) {
    let current = String(value || '');
    if (!current || typeof TextDecoder === 'undefined') return current;
    for (let pass = 0; pass < 3; pass += 1) {
        const bytes = [];
        let convertible = true;
        for (const ch of current) {
            const code = ch.charCodeAt(0);
            if (code <= 0xFF) bytes.push(code);
            else if (SCHEDULE_WINDOWS_1252_REVERSE_MAP[code] != null) bytes.push(SCHEDULE_WINDOWS_1252_REVERSE_MAP[code]);
            else {
                convertible = false;
                break;
            }
        }
        if (!convertible || !bytes.length) break;
        try {
            const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
            if (!decoded || decoded === current) break;
            current = decoded;
        } catch (error) {
            break;
        }
    }
    return current;
}
function normalizeScheduleComparableText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\d{1,2}:\d{2}/g, ' ')
        .replace(/[^a-z\u10D0-\u10FF]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function extractScheduleTime(value) {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? `${String(match[1]).padStart(2, '0')}:${match[2]}` : '';
}
function getEnglishScheduleWeekday(value) {
    const raw = String(value || '');
    if (!raw.trim()) return '';
    const candidates = [
        raw,
        decodeScheduleMojibakeText(raw),
        typeof cleanupEncodingArtifacts === 'function' ? cleanupEncodingArtifacts(raw) : raw,
        typeof toEnglishText === 'function' ? toEnglishText(raw) : raw
    ];
    for (const candidate of candidates) {
        const comparable = normalizeScheduleComparableText(candidate);
        const english = SCHEDULE_EN_WEEKDAY_LABELS.find(day => comparable.split(' ').includes(day.toLowerCase()));
        if (english) return english;
        const geMatch = SCHEDULE_GEORGIAN_WEEKDAY_LABELS.find(([ge]) => String(candidate || '').toLowerCase().includes(ge));
        if (geMatch) return geMatch[1];
        const translitMatch = SCHEDULE_TRANSLITERATED_WEEKDAY_LABELS.find(([token]) => comparable.includes(token));
        if (translitMatch) return translitMatch[1];
    }
    return '';
}
function normalizeScheduleDayLabel(value, fallback = '') {
    const weekday = getEnglishScheduleWeekday(value);
    if (weekday) return weekday;
    const repaired = repairScheduleDisplayText(value, fallback);
    return hasBrokenScheduleDisplayText(repaired) ? String(fallback || '').trim() : repaired;
}
function repairScheduleDisplayText(value, fallback = '') {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return String(fallback || '').trim();
    const shouldRepair = ((typeof looksLikeMojibake === 'function' && looksLikeMojibake(raw))
        || hasBrokenScheduleDisplayText(raw)
        || /\?{3,}/.test(raw)
        || /[\u10A0-\u10FF]/.test(raw));
    if (!shouldRepair) return raw;
    let cleaned = decodeScheduleMojibakeText(raw);
    try {
        if (typeof cleanupEncodingArtifacts === 'function') cleaned = cleanupEncodingArtifacts(cleaned);
    } catch (error) {}
    try {
        if (typeof toEnglishText === 'function') cleaned = toEnglishText(cleaned);
    } catch (error) {}
    cleaned = decodeScheduleMojibakeText(cleaned);
    cleaned = String(cleaned == null ? '' : cleaned).trim();
    if (!cleaned || hasBrokenScheduleDisplayText(cleaned)) return String(fallback || '').trim();
    return cleaned;
}
function parseLocalDate(value) {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
function formatLocalDateISO(date) {
    const safeDate = parseLocalDate(date) || new Date();
    const year = safeDate.getFullYear();
    const month = String(safeDate.getMonth() + 1).padStart(2, '0');
    const day = String(safeDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function addDaysLocal(date, days) {
    const next = parseLocalDate(date) || new Date();
    next.setDate(next.getDate() + days);
    return next;
}
function getWeekStartDate(input = new Date()) {
    const date = parseLocalDate(input) || new Date();
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
}
function getCurrentWeekStartISO() {
    return formatLocalDateISO(getWeekStartDate(new Date()));
}
function shiftWeekStartISO(weekStart, deltaWeeks) {
    const base = getWeekStartDate(parseLocalDate(weekStart) || new Date());
    return formatLocalDateISO(addDaysLocal(base, deltaWeeks * 7));
}
function getStoredWeekStart(storageKey) {
    const stored = localStorage.getItem(storageKey);
    const parsed = parseLocalDate(stored);
    if (!parsed) {
        const currentWeek = getCurrentWeekStartISO();
        localStorage.setItem(storageKey, currentWeek);
        return currentWeek;
    }
    const normalized = formatLocalDateISO(getWeekStartDate(parsed));
    if (normalized !== stored) localStorage.setItem(storageKey, normalized);
    return normalized;
}
function setStoredWeekStart(storageKey, weekStart) {
    const normalized = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    localStorage.setItem(storageKey, normalized);
    return normalized;
}
function getWeekDateEntries(weekStart) {
    const weekBase = getWeekStartDate(parseLocalDate(weekStart) || new Date());
    const enDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return enDayLabels.map((label, index) => {
        const date = addDaysLocal(weekBase, index);
        return {
            ge: label,
            en: enDayLabels[index],
            date,
            iso: formatLocalDateISO(date),
            shortDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        };
    });
}
function formatWeekRangeLabel(weekStart) {
    const entries = getWeekDateEntries(weekStart);
    const start = entries[0].date;
    const end = entries[entries.length - 1].date;
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
        const monthYear = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `${monthYear} - ${start.getDate()}-${end.getDate()}`;
    }
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
}
function compareWeekStartISO(a, b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return a.localeCompare(b);
}
function deriveFacultyFromSubjectId(subjectId) {
    if (!subjectId) return getCurrentFaculty ? getCurrentFaculty() : 'ECON';
    if (subjectId.startsWith('CS') || subjectId.startsWith('STAT') || subjectId.startsWith('CALC')) return 'CS';
    if (subjectId.startsWith('ECON') || subjectId.startsWith('PM') || subjectId.startsWith('BM')) return 'ECON';
    if (subjectId.startsWith('LAW')) return 'LAW';
    if (subjectId.startsWith('MED')) return 'MED';
    if (subjectId.startsWith('ART')) return 'ARTS';
    return getCurrentFaculty ? getCurrentFaculty() : 'ECON';
}
function isGroupActiveForWeek(group, weekStart) {
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    const startWeek = group?.startWeek ? formatLocalDateISO(getWeekStartDate(group.startWeek)) : null;
    const endWeek = group?.endWeek ? formatLocalDateISO(getWeekStartDate(group.endWeek)) : null;
    if (startWeek && compareWeekStartISO(normalizedWeek, startWeek) < 0) return false;
    if (endWeek && compareWeekStartISO(normalizedWeek, endWeek) > 0) return false;
    return true;
}
function normalizeScheduleGroup(subjectId, group) {
    if (!group) return null;
    const fallbackFaculty = normalizeFacultyCode(group.faculty || deriveFacultyFromSubjectId(subjectId));
    const duration = group.duration || '110min';
    const rawSessionType = String(group.sessionType || group.classType || group.type || '').trim().toLowerCase();
    const instructorPlaceholder = /^(tbd|unassigned|n\/a|--|-)$/i;
    const profName = String(group.prof || '').trim();
    const taName = String(group.ta || '').trim();
    const hasAssignedProf = Boolean(profName) && !instructorPlaceholder.test(profName);
    const hasAssignedTa = Boolean(taName) && !instructorPlaceholder.test(taName);
    let normalizedSessionType = 'lecture';
    if (hasAssignedTa && !hasAssignedProf) {
        normalizedSessionType = 'seminar';
    } else if (hasAssignedProf && hasAssignedTa) {
        normalizedSessionType = 'lecture';
    } else if (rawSessionType.includes('seminar') || rawSessionType.includes('workshop') || rawSessionType.includes('lab')) {
        normalizedSessionType = 'seminar';
    } else if (/(^|[\s_-])(sem|seminar|workshop|lab)($|[\s_-])/i.test(String(group.name || group.id || ''))) {
        normalizedSessionType = 'seminar';
    } else if (hasAssignedProf) {
        normalizedSessionType = 'lecture';
    } else if (rawSessionType.includes('lecture')) {
        normalizedSessionType = 'lecture';
    }
    const endTime = normalizeTimeString(group.endTime || '', '') || (() => {
        const startMinutes = convertTimeToMinutes(group.time || '09:00');
        const durationMinutes = parseInt(String(duration).match(/\d+/)?.[0] || '110', 10);
        return minutesToTimeString(startMinutes + durationMinutes);
    })();
    const weekOverrides = Object.fromEntries(
        Object.entries(group.weekOverrides || {}).map(([weekKey, override]) => [
            formatLocalDateISO(getWeekStartDate(parseLocalDate(weekKey) || new Date())),
            {
                ...override,
                faculty: normalizeFacultyCode(override?.faculty || fallbackFaculty, fallbackFaculty),
                day: normalizeScheduleDayLabel(override?.day || group.day || group.timeDay || '', ''),
                time: normalizeTimeString(override?.time || group.time || group.startTime || extractScheduleTime(group.timeDay), '') || repairScheduleDisplayText(override?.time || group.time || '', ''),
                endTime: override?.endTime || endTime,
                duration: override?.duration || duration
            }
        ])
    );
    return {
        ...group,
        id: String(group.id || '').trim(),
        name: repairScheduleDisplayText(group.name || group.id, group.id || 'Group'),
        title: repairScheduleDisplayText(group.title || group.subjectName || group.courseName || group.name || group.id, group.name || group.id || 'Group'),
        courseName: repairScheduleDisplayText(group.courseName || group.subjectName || group.title || group.name || group.id, group.title || group.name || group.id || 'Subject'),
        faculty: fallbackFaculty,
        sessionType: normalizedSessionType,
        endTime,
        duration,
        day: normalizeScheduleDayLabel(group.day || group.timeDay || '', ''),
        time: normalizeTimeString(group.time || group.startTime || extractScheduleTime(group.timeDay), '') || repairScheduleDisplayText(group.time || group.startTime || '', ''),
        room: repairScheduleDisplayText(group.room || '', ''),
        prof: repairScheduleDisplayText(group.prof || '', ''),
        ta: repairScheduleDisplayText(group.ta || '', ''),
        startWeek: group.startWeek ? formatLocalDateISO(getWeekStartDate(group.startWeek)) : null,
        endWeek: group.endWeek ? formatLocalDateISO(getWeekStartDate(group.endWeek)) : null,
        weekOverrides
    };
}
function migrateAvailableGroupsSessionTypes() {
    if (!KIU_STATE?.availableGroups || typeof normalizeScheduleGroup !== 'function') return 0;
    let updated = 0;
    Object.entries(KIU_STATE.availableGroups).forEach(([subjectId, groups]) => {
        KIU_STATE.availableGroups[subjectId] = (groups || [])
            .map((group) => {
                const normalized = normalizeScheduleGroup(subjectId, group);
                if (!normalized) return null;
                if (String(normalized.sessionType || '') !== String(group?.sessionType || '')) {
                    updated += 1;
                }
                return normalized;
            })
            .filter(Boolean);
    });
    return updated;
}
function inferSchedulerSessionType(professor = '', ta = '', explicitType = '') {
    const placeholder = /^(tbd|unassigned|n\/a|--|-)$/i;
    const profName = String(professor || '').trim();
    const taName = String(ta || '').trim();
    const hasProf = Boolean(profName) && !placeholder.test(profName);
    const hasTa = Boolean(taName) && !placeholder.test(taName);
    if (hasTa && !hasProf) return 'seminar';
    if (hasProf && !hasTa) return 'lecture';
    const normalizedExplicit = String(explicitType || '').trim().toLowerCase();
    if (normalizedExplicit === 'seminar' || normalizedExplicit === 'lecture') {
        return normalizedExplicit;
    }
    return 'lecture';
}
function getEffectiveGroupForWeek(subjectId, group, weekStart) {
    const normalizedGroup = normalizeScheduleGroup(subjectId, group);
    if (!normalizedGroup || !normalizedGroup.id) return null;
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    if (!isGroupActiveForWeek(normalizedGroup, normalizedWeek)) return null;
    const override = normalizedGroup.weekOverrides?.[normalizedWeek] || null;
    return {
        ...normalizedGroup,
        ...(override || {}),
        faculty: normalizeFacultyCode((override && override.faculty) || normalizedGroup.faculty, normalizedGroup.faculty),
        courseId: subjectId,
        weekStart: normalizedWeek,
        isWeekOverride: Boolean(override),
        baseGroupId: normalizedGroup.id
    };
}
function getAvailableScheduleItemsForWeek(weekStart, filters = {}) {
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    const targetSemester = filters.semester != null ? parseInt(filters.semester, 10) : null;
    const targetFaculty = filters.faculty && filters.faculty !== 'all'
        ? normalizeFacultyCode(filters.faculty)
        : null;
    const items = [];
    Object.entries(KIU_STATE.availableGroups || {}).forEach(([subjectId, groups]) => {
        (groups || []).forEach(group => {
            const effectiveGroup = getEffectiveGroupForWeek(subjectId, group, normalizedWeek);
            if (!effectiveGroup) return;
            if (targetSemester != null && parseInt(effectiveGroup.semester || 0, 10) !== targetSemester) return;
            if (targetFaculty && normalizeFacultyCode(effectiveGroup.faculty) !== targetFaculty) return;
            items.push(effectiveGroup);
        });
    });
    return items.sort((left, right) => {
        const dayDelta = SCHEDULE_EN_WEEKDAY_LABELS.indexOf(normalizeScheduleDayLabel(left.day, left.day)) - SCHEDULE_EN_WEEKDAY_LABELS.indexOf(normalizeScheduleDayLabel(right.day, right.day));
        if (dayDelta !== 0) return dayDelta;
        const timeDelta = convertTimeToMinutes(left.time) - convertTimeToMinutes(right.time);
        if (timeDelta !== 0) return timeDelta;
        return String(left.courseId || '').localeCompare(String(right.courseId || ''));
    });
}
function resolveScheduledGroupForWeek(courseId, groupId, weekStart) {
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    const groups = KIU_STATE.availableGroups?.[courseId] || [];
    for (const group of groups) {
        if (String(group.id) !== String(groupId)) continue;
        const effectiveGroup = getEffectiveGroupForWeek(courseId, group, normalizedWeek);
        if (effectiveGroup) return effectiveGroup;
    }
    return null;
}

        const api = {
            hasBrokenScheduleDisplayText,
            decodeScheduleMojibakeText,
            normalizeScheduleComparableText,
            extractScheduleTime,
            getEnglishScheduleWeekday,
            normalizeScheduleDayLabel,
            repairScheduleDisplayText,
            parseLocalDate,
            formatLocalDateISO,
            addDaysLocal,
            getWeekStartDate,
            getCurrentWeekStartISO,
            shiftWeekStartISO,
            getStoredWeekStart,
            setStoredWeekStart,
            getWeekDateEntries,
            formatWeekRangeLabel,
            compareWeekStartISO,
            deriveFacultyFromSubjectId,
            isGroupActiveForWeek,
            normalizeScheduleGroup,
            migrateAvailableGroupsSessionTypes,
            inferSchedulerSessionType,
            getEffectiveGroupForWeek,
            getAvailableScheduleItemsForWeek,
            resolveScheduledGroupForWeek,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateFacultyScheduleApi({});
})();
