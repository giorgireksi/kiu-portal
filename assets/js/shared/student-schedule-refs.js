(function initStudentScheduleRefs() {
    'use strict';

    function normalizeScheduleEntryIdentifier(value) {
        if (typeof normalizeIdentifier === 'function') {
            return normalizeIdentifier(value);
        }
        return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function isScheduleEntryPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function formatStudyCardLabel(value, fallback = '-') {
        if (value === null || value === undefined || value === '') return fallback;
        if (typeof value === 'object') {
            const nested = value.name ?? value.label ?? value.title ?? value.id;
            if (nested !== undefined && nested !== null && typeof nested !== 'object') {
                const text = String(nested).trim();
                return text || fallback;
            }
            return fallback;
        }
        const text = String(value).trim();
        return text || fallback;
    }

    function resolveStudyCardCourseIdFromGroup(groupId) {
        const normalizedGroupId = normalizeScheduleEntryIdentifier(groupId);
        if (!normalizedGroupId) return '';
        const groupsBySubject = (typeof KIU_STATE !== 'undefined' && KIU_STATE?.availableGroups) || {};
        for (const [subjectId, groupList] of Object.entries(groupsBySubject)) {
            if (!Array.isArray(groupList)) continue;
            const match = groupList.find((group) => (
                normalizeScheduleEntryIdentifier(group?.id || group?.groupId || group?.name) === normalizedGroupId
            ));
            if (match) return formatStudyCardLabel(subjectId, '');
        }
        return '';
    }

    function resolveStudyCardScheduleRefs(scheduleItem) {
        const rawGroup = scheduleItem?.groupId ?? scheduleItem?.group ?? scheduleItem?.sectionId ?? scheduleItem?.groupName;
        const embeddedGroup = isScheduleEntryPlainObject(rawGroup) ? rawGroup : null;
        let courseId = formatStudyCardLabel(
            scheduleItem?.courseId ?? scheduleItem?.id ?? scheduleItem?.subjectId ?? scheduleItem?.sourceCourseId ?? embeddedGroup?.courseId,
            ''
        );
        let groupId = formatStudyCardLabel(
            embeddedGroup?.id ?? embeddedGroup?.groupId ?? (embeddedGroup ? '' : rawGroup),
            ''
        );
        if (!courseId || courseId === '0') {
            courseId = resolveStudyCardCourseIdFromGroup(groupId || embeddedGroup?.id || embeddedGroup?.groupId)
                || formatStudyCardLabel(scheduleItem?.sourceCourseId ?? embeddedGroup?.courseId, '');
        }
        return {
            courseId,
            groupId,
            embeddedGroup,
            courseName: formatStudyCardLabel(
                scheduleItem?.courseName ?? scheduleItem?.name ?? scheduleItem?.subjectName ?? embeddedGroup?.courseName,
                ''
            ),
            groupName: formatStudyCardLabel(
                scheduleItem?.groupName ?? embeddedGroup?.name ?? embeddedGroup?.label,
                ''
            ),
            professorLabel: formatStudyCardLabel(
                scheduleItem?.prof ?? embeddedGroup?.prof ?? embeddedGroup?.teacher ?? embeddedGroup?.ta,
                ''
            )
        };
    }

    function formatStudyCardCourseIdLabel(courseId, subject) {
        const label = formatStudyCardLabel(courseId, '');
        if (label && label !== '0') return label;
        return formatStudyCardLabel(subject?.code ?? subject?.id, '-');
    }

    function studyCardDomToken(value) {
        const tokenize = typeof toDomToken === 'function'
            ? toDomToken
            : (raw) => String(raw || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
        return tokenize(formatStudyCardLabel(value, 'unknown'));
    }

    function flattenStudentScheduleEntry(entry) {
        const refs = resolveStudyCardScheduleRefs(entry || {});
        if (!refs.courseId || refs.courseId === '0') return null;
        return {
            ...entry,
            courseId: refs.courseId,
            groupId: refs.groupId || entry?.groupId,
            courseName: refs.courseName || entry?.courseName,
            groupName: refs.groupName || entry?.groupName,
            prof: refs.professorLabel || entry?.prof,
            sourceCourseId: entry?.sourceCourseId || refs.courseId
        };
    }

    const api = {
        formatStudyCardLabel,
        resolveStudyCardScheduleRefs,
        resolveStudentScheduleEntryRefs: resolveStudyCardScheduleRefs,
        formatStudyCardCourseIdLabel,
        studyCardDomToken,
        flattenStudentScheduleEntry
    };
    Object.assign(window, api);
    return api;
})();
