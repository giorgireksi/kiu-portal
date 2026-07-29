/* LMS classroom next-session + marker composer preview helpers.
 * Peeled from lms-classroom-tabs-runtime.js. Load before lms-classroom-tabs-runtime.js on lms.html.
 */
(function initLmsClassroomSessionsRuntime() {
    if (window.__KIU_LMS_CLASSROOM_SESSIONS_LOADED) return;
    window.__KIU_LMS_CLASSROOM_SESSIONS_LOADED = true;

    window.__kiuCreateLmsClassroomSessionsApi = function createKiuLmsClassroomSessionsApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function getLmsSessionScheduleForWeek(courseKey = currentCourseId, weekStart = getCurrentWeekStartISO()) {
    const context = getLmsSessionMarkerContext(courseKey);
    if (!context) return null;
    const normalizedWeek = normalizeLmsSessionMarkerWeekStart(weekStart);
    const effectiveGroup = typeof resolveScheduledGroupForWeek === 'function'
        ? resolveScheduledGroupForWeek(context.courseId, context.groupId, normalizedWeek)
        : null;
    const normalizedGroup = effectiveGroup
        || (typeof normalizeScheduleGroup === 'function' ? normalizeScheduleGroup(context.courseId, context.group) : context.group)
        || {};
    const entries = typeof getWeekDateEntries === 'function' ? getWeekDateEntries(normalizedWeek) : [];
    const rawDay = typeof normalizeScheduleDayLabel === 'function'
        ? normalizeScheduleDayLabel(normalizedGroup.day || normalizedGroup.timeDay || '', '')
        : String(normalizedGroup.day || normalizedGroup.timeDay || '').trim();
    const dayEntry = entries.find(entry => {
        const lowered = rawDay.toLowerCase();
        return String(entry.en || '').toLowerCase() === lowered || String(entry.ge || '').toLowerCase() === lowered;
    }) || null;
    const startTime = normalizeTimeString(normalizedGroup.startTime || normalizedGroup.time || '', 'TBD');
    const endTime = normalizeTimeString(normalizedGroup.endTime || '', '') || (startTime === 'TBD'
        ? 'TBD'
        : minutesToTimeString(convertTimeToMinutes(startTime) + parseInt(String(normalizedGroup.duration || '110').match(/\d+/)?.[0] || '110', 10)));
    return {
        ...context,
        weekStart: normalizedWeek,
        weekLabel: typeof formatWeekRangeLabel === 'function' ? formatWeekRangeLabel(normalizedWeek) : normalizedWeek,
        dateLabel: dayEntry?.shortDate || '',
        day: repairLmsDisplayText(dayEntry?.en || rawDay || 'Day TBD', 'Day TBD'),
        time: startTime,
        endTime,
        room: repairLmsDisplayText(normalizedGroup.room || 'Room TBD', 'Room TBD'),
        instructor: repairLmsDisplayText(normalizedGroup.prof || normalizedGroup.ta || 'Instructor TBA', 'Instructor TBA'),
        active: Boolean(effectiveGroup || normalizedGroup?.id)
    };
}

function buildLmsNextSessionDatesFromSchedule(schedule) {
    if (!schedule?.active || !schedule.day || schedule.time === 'TBD') return null;
    const entries = typeof getWeekDateEntries === 'function' ? getWeekDateEntries(schedule.weekStart) : [];
    const dayLower = String(schedule.day || '').toLowerCase();
    const entry = entries.find(candidate => {
        const en = String(candidate.en || '').toLowerCase();
        const ge = String(candidate.ge || '').toLowerCase();
        return en === dayLower || ge === dayLower;
    });
    if (!entry?.iso) return null;
    const startDate = new Date(`${entry.iso}T${schedule.time}:00`);
    if (Number.isNaN(startDate.getTime())) return null;
    let endDate = null;
    if (schedule.endTime && schedule.endTime !== 'TBD') {
        endDate = new Date(`${entry.iso}T${schedule.endTime}:00`);
        if (Number.isNaN(endDate.getTime())) endDate = null;
    }
    return { startDate, endDate, isoDate: entry.iso };
}

function getLmsNextSessionForGroup(courseKey = currentCourseId, options = {}) {
    if (!getLmsSessionMarkerContext(courseKey)) return null;
    const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
    const maxWeeks = Number.isFinite(options.maxWeeks) ? options.maxWeeks : 16;
    let weekStart = normalizeLmsSessionMarkerWeekStart(
        options.fromWeekStart || (typeof getCurrentWeekStartISO === 'function' ? getCurrentWeekStartISO() : new Date())
    );
    const candidates = [];
    for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex += 1) {
        const schedule = getLmsSessionScheduleForWeek(courseKey, weekStart);
        const dates = schedule ? buildLmsNextSessionDatesFromSchedule(schedule) : null;
        if (schedule && dates) {
            const { startDate, endDate } = dates;
            const sessionEnded = endDate ? endDate < now : startDate < now;
            if (!sessionEnded) {
                const isHappeningNow = startDate <= now && (!endDate || endDate >= now);
                candidates.push({
                    ...schedule,
                    startDate,
                    endDate,
                    isoDate: dates.isoDate,
                    isHappeningNow
                });
            }
        }
        weekStart = typeof shiftWeekStartISO === 'function' ? shiftWeekStartISO(weekStart, 1) : weekStart;
    }
    candidates.sort((left, right) => left.startDate - right.startDate);
    const next = candidates[0] || null;
    if (!next) return null;
    return {
        ...next,
        relativeLabel: formatLmsNextSessionRelative(next.startDate, now, next.isHappeningNow)
    };
}

function formatLmsNextSessionRelative(startDate, now = new Date(), isHappeningNow = false) {
    if (isHappeningNow) return 'Happening now';
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    if (Number.isNaN(start.getTime())) return '';
    const dayMs = 86400000;
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((startDay - nowDay) / dayMs);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) {
        return start.toLocaleDateString('en-GB', { weekday: 'long' });
    }
    return start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function renderLmsNextSessionHtml(model, variant = 'hero') {
    if (!model) {
        const emptyCopy = 'No upcoming session scheduled';
        if (variant === 'compact') {
            return `<div class="lms-group-next-session is-empty"><i class="far fa-clock"></i> ${escapeHtml(emptyCopy)}</div>`;
        }
        if (variant === 'inline') {
            return `<span class="lms-next-session-inline is-empty"><i class="far fa-clock"></i> ${escapeHtml(emptyCopy)}</span>`;
        }
        return `
            <div class="lms-route-card lms-route-panel-compact lms-session-official-card lms-next-session-card home-hover-chip is-empty">
                <div class="lms-route-field-label">Next session</div>
                <div class="lux-card-copy lms-next-session-empty">${escapeHtml(emptyCopy)}</div>
            </div>
        `;
    }
    const relative = model.relativeLabel || formatLmsNextSessionRelative(model.startDate, new Date(), model.isHappeningNow);
    const dayLine = `${model.day || 'Day TBD'}${model.dateLabel ? ` ${model.dateLabel}` : ''}`;
    const timeLine = `${model.time || 'TBD'} - ${model.endTime || 'TBD'} · ${model.room || 'Room TBD'}`;
    const instructorLine = model.instructor || 'Instructor TBA';
    const badgeClass = model.isHappeningNow ? 'is-live' : (relative === 'Today' ? 'is-today' : '');
    if (variant === 'compact') {
        return `<div class="lms-group-next-session"><i class="far fa-clock"></i> <span class="lms-next-session-badge ${badgeClass}">${escapeHtml(relative)}</span> · ${escapeHtml(dayLine)} · ${escapeHtml(model.time || 'TBD')} · ${escapeHtml(model.room || 'Room TBD')}</div>`;
    }
    if (variant === 'inline') {
        return `<span class="lms-next-session-inline"><i class="far fa-clock"></i> Next session · <span class="lux-pill home-hover-chip lms-next-session-badge ${badgeClass}">${escapeHtml(relative)}</span> · ${escapeHtml(model.day || 'Day TBD')} ${escapeHtml(model.time || 'TBD')}</span>`;
    }
    return `
        <div class="lms-route-card lms-route-panel-compact lms-session-official-card lms-next-session-card home-hover-chip">
            <div class="lms-route-field-label">Next session</div>
            <span class="lux-pill home-hover-chip lms-next-session-badge ${badgeClass}">${escapeHtml(relative)}</span>
            <div class="lms-route-stat-value lms-next-session-date">${escapeHtml(dayLine)}</div>
            <div class="lux-card-copy lms-next-session-detail">${escapeHtml(timeLine)}</div>
            <div class="lux-card-meta lms-next-session-instructor">${escapeHtml(instructorLine)}</div>
        </div>
    `;
}

function getLmsSessionMarkerComposerOptions(courseKey = currentCourseId) {
    const weekInput = document.getElementById('lms-session-marker-week-input');
    const sectionFilter = document.getElementById('lms-session-marker-section-filter')?.value || 'all';
    const weekNumbers = parseLmsWeekNumberInput(weekInput?.value || '1,2,3,4,5');
    return { weekNumbers, sectionType: sectionFilter };
}

function renderLmsSessionMarkerPreviewHtml(courseKey = currentCourseId) {
    const { weekNumbers, sectionType } = getLmsSessionMarkerComposerOptions(courseKey);
    if (!weekNumbers.length) {
        return '<div class="lms-session-marker-preview-empty">Enter week numbers (e.g. 1,2,3 or 1-5) to load schedule slots.</div>';
    }
    const candidates = buildLmsMarkerSessionCandidates(courseKey, weekNumbers, {
        sectionType: sectionType === 'all' ? 'all' : sectionType
    });
    if (!candidates.length) {
        return '<div class="lms-session-marker-preview-empty">No matching sessions for this filter.</div>';
    }
    return `
        <div class="lms-session-marker-preview-grid">
            ${candidates.map(candidate => {
                const sectionMeta = getLmsSectionMeta(candidate.sectionType);
                const typeMeta = candidate.existingMarker ? getLmsSessionMarkerTypeMeta(candidate.existingMarker.type) : null;
                const markerClass = candidate.existingMarker ? ` marker-${lmsSessionMarkerClassToken(candidate.existingMarker.type)}` : '';
                return `
                    <label class="lms-session-marker-slot home-hover-chip${candidate.disabled ? ' is-disabled' : ''}${candidate.existingMarker ? ' is-marked' : ''}${markerClass}">
                        <input type="checkbox" class="lms-session-marker-slot-check" value="${escapeHtml(candidate.sessionKey)}" data-session-key="${escapeHtml(candidate.sessionKey)}" ${candidate.disabled ? 'disabled' : ''} ${candidate.existingMarker ? 'checked' : ''}>
                        <div class="lms-session-marker-slot-body">
                            <div class="lms-session-marker-slot-head">
                                <span class="lms-session-marker-slot-week">Week ${escapeHtml(String(candidate.weekNumber))} · ${escapeHtml(candidate.weekLabel || '')}</span>
                                <span class="lms-session-marker-slot-type">${escapeHtml(sectionMeta.label)}</span>
                            </div>
                            ${candidate.active ? `
                                <div class="lms-session-marker-slot-schedule">
                                    <span><i class="fas fa-calendar-day"></i> ${escapeHtml(candidate.day || 'Day TBD')}${candidate.dateLabel ? ` · ${escapeHtml(candidate.dateLabel)}` : ''}</span>
                                    <span><i class="far fa-clock"></i> ${escapeHtml(candidate.startTime || 'TBD')}-${escapeHtml(candidate.endTime || 'TBD')}</span>
                                    <span><i class="fas fa-location-dot"></i> ${escapeHtml(candidate.room || 'Room TBD')}</span>
                                </div>
                            ` : '<div class="lms-session-marker-slot-schedule is-muted">No scheduled session this week</div>'}
                            ${candidate.existingMarker ? `
                                <div class="lms-session-marker-slot-badge marker-${lmsSessionMarkerClassToken(candidate.existingMarker.type)}">
                                    <i class="fas ${escapeHtml(typeMeta.icon)}"></i> ${escapeHtml(candidate.existingMarker.title || typeMeta.label)}
                                </div>
                            ` : ''}
                        </div>
                        ${candidate.existingMarker && canManageLmsGroupContent() ? `
                            <button type="button" class="lux-secondary-btn lms-session-marker-slot-remove" data-lms-click="deleteLmsSessionMarker(${lmsInlineArg(candidate.existingMarker.id)}, ${lmsInlineArg(courseKey)})" title="Remove marker"><i class="fas fa-trash"></i></button>
                        ` : ''}
                    </label>
                `;
            }).join('')}
        </div>
    `;
}

function refreshLmsSessionMarkerPreview(courseKey = currentCourseId) {
    const preview = document.getElementById('lms-session-marker-preview');
    if (!preview) return;
    preview.innerHTML = renderLmsSessionMarkerPreviewHtml(courseKey);
}

function setLmsSessionMarkerType(type) {
    const normalized = normalizeLmsSessionMarkerType(type);
    const input = document.getElementById('lms-session-marker-type');
    if (input) input.value = normalized;
    const typeMeta = getLmsSessionMarkerTypeMeta(normalized);
    document.querySelectorAll('.lms-session-marker-type-chip').forEach(chip => {
        const isActive = chip.dataset.markerType === normalized;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        if (isActive) {
            chip.classList.remove('is-picking');
            void chip.offsetWidth;
            chip.classList.add('is-picking');
            window.setTimeout(() => chip.classList.remove('is-picking'), 360);
        }
    });
    const titleInput = document.getElementById('lms-session-marker-title');
    if (titleInput) {
        titleInput.placeholder = typeMeta.label;
    }
}

function setLmsSessionMarkerWeekPreset(preset, courseKey = currentCourseId) {
    const input = document.getElementById('lms-session-marker-week-input');
    if (!input) return;
    if (preset === 'this') input.value = '1';
    else if (preset === 'next4') input.value = '1-4';
    else if (preset === 'clear') input.value = '';
    refreshLmsSessionMarkerPreview(courseKey);
}

function clearLmsSessionMarkerWeekInput(courseKey = currentCourseId) {
    setLmsSessionMarkerWeekPreset('clear', courseKey);
}


        const api = {
            getLmsSessionScheduleForWeek,
            buildLmsNextSessionDatesFromSchedule,
            getLmsNextSessionForGroup,
            formatLmsNextSessionRelative,
            renderLmsNextSessionHtml,
            getLmsSessionMarkerComposerOptions,
            renderLmsSessionMarkerPreviewHtml,
            refreshLmsSessionMarkerPreview,
            setLmsSessionMarkerType,
            setLmsSessionMarkerWeekPreset,
            clearLmsSessionMarkerWeekInput,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsClassroomSessionsApi({});
})();
