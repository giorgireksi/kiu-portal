/* Social workspace schedule strip markup (baseline + progress hours).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceScheduleUiApi(deps).
 */
(function init() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_SCHEDULE_UI_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_SCHEDULE_UI_LOADED = true;

    function createKiuSocialWorkspaceScheduleUiApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('createKiuSocialWorkspaceScheduleUiApi deps required');
        const {
            computeProjectSchedule,
            escape,
            formatProjectScheduleDate,
            formatProjectScheduleHours,
            normalizeTaskTime,
            sumProjectActualHours,
            sumProjectOpenWorkHours,
            text,
            when
        } = deps;

        function renderProjectPlanVsBaselineStrip(project) {
            if (!project) return '';
            const baselineAt = text(project?.baselineAt || '');
            const baseline = project?.baselineSnapshot && typeof project.baselineSnapshot === 'object' ? project.baselineSnapshot : null;
            const canManage = Boolean(project.isManager);
            if (!baselineAt || !baseline) {
                if (!canManage) return '';
                return `
                    <section class="lux-soft-chrome lux-panel social-neo-card social-project-baseline-card">
                        <div class="social-neo-section-head">
                            <div><strong>Plan vs reality</strong><span>Freeze the current plan to measure drift later.</span></div>
                        </div>
                        <p class="social-neo-muted social-neo-copy-mt-8">Set a baseline after your plan is stable — estimates, schedule, and milestones get snapshotted.</p>
                        <div class="social-project-card-new-cta"><span data-action="project-baseline-set" data-project-id="${escape(text(project.id))}">Set baseline →</span></div>
                    </section>`;
            }
            const liveEnd = computeProjectSchedule(project).projectEndHours;
            const baseEnd = Number(baseline.projectEndHours) || 0;
            const slipHours = Math.round((liveEnd - baseEnd) * 10) / 10;
            const slipLabel = slipHours === 0
                ? 'On plan'
                : `${slipHours > 0 ? '+' : ''}${formatProjectScheduleHours(slipHours)} vs baseline`;
            const slipTone = slipHours > 0 ? 'rose' : slipHours < 0 ? 'emerald' : 'slate';
            const baselineTasks = Array.isArray(baseline.tasks) ? baseline.tasks : [];
            const liveTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const driftCount = liveTasks.filter((task) => {
                const snap = baselineTasks.find((row) => text(row?.id) === text(task?.id));
                if (!snap) return false;
                return normalizeTaskTime(snap.timeEstimate) !== normalizeTaskTime(task?.timeEstimate)
                    || Math.round((Number(snap.budgetEstimate) || 0) * 100) !== Math.round((Number(task?.budgetEstimate) || 0) * 100);
            }).length;
            const scheduleStartAt = text(project?.scheduleStartAt || baseline.scheduleStartAt || '');
            const finishCompare = scheduleStartAt
                ? `${formatProjectScheduleDate(scheduleStartAt, baseEnd)} → ${formatProjectScheduleDate(scheduleStartAt, liveEnd)}`
                : `${formatProjectScheduleHours(baseEnd)} → ${formatProjectScheduleHours(liveEnd)}`;
            return `
                <section class="lux-soft-chrome lux-panel social-neo-card social-project-baseline-card" data-lux-transparency-exempt="1">
                    <div class="social-neo-section-head">
                        <div><strong>Plan vs baseline</strong><span>Snapshotted ${escape(when(baselineAt))}</span></div>
                        <span class="social-neo-pill is-tone-${escape(slipTone)}">${escape(slipLabel)}</span>
                    </div>
                    <div class="social-project-baseline-facts">
                        <span class="social-neo-pill"><i class="fas fa-route"></i>${escape(finishCompare)}</span>
                        ${driftCount ? `<span class="social-neo-pill is-tone-rose">${escape(String(driftCount))} task${driftCount === 1 ? '' : 's'} changed since baseline</span>` : '<span class="social-neo-pill is-tone-emerald">Estimates match baseline</span>'}
                    </div>
                    ${canManage ? `<div class="social-project-card-new-cta"><span data-action="project-baseline-set" data-project-id="${escape(text(project.id))}">Update baseline →</span></div>` : ''}
                </section>`;
        }

        function renderProjectProgressHoursStrip(project) {
            if (!project) return '';
            const remaining = Math.round(sumProjectOpenWorkHours(project) * 10) / 10;
            const logged = Math.round(sumProjectActualHours(project) * 10) / 10;
            if (remaining <= 0 && logged <= 0) return '';
            const baseline = project?.baselineSnapshot && typeof project.baselineSnapshot === 'object' ? project.baselineSnapshot : null;
            const baselineAt = text(project?.baselineAt || '');
            let slipTone = 'slate';
            let slipLabel = '';
            if (baselineAt && baseline) {
                const liveEnd = computeProjectSchedule(project).projectEndHours;
                const baseEnd = Number(baseline.projectEndHours) || 0;
                const slipHours = Math.round((liveEnd - baseEnd) * 10) / 10;
                slipLabel = slipHours === 0 ? 'On baseline schedule' : `${slipHours > 0 ? '+' : ''}${formatProjectScheduleHours(slipHours)} vs baseline`;
                slipTone = slipHours > 0 ? 'rose' : slipHours < 0 ? 'emerald' : 'slate';
            }
            return `
                <section class="lux-soft-chrome lux-panel social-neo-card social-project-progress-hours-card" data-lux-transparency-exempt="1">
                    <div class="social-neo-section-head">
                        <div><strong>Work hours</strong><span>Open estimate vs time logged on done tasks.</span></div>
                    </div>
                    <div class="social-project-progress-hours-facts">
                        <span class="social-neo-pill"><i class="fas fa-hourglass-half"></i>${escape(formatProjectScheduleHours(remaining))} remaining</span>
                        <span class="social-neo-pill"><i class="fas fa-stopwatch"></i>${escape(formatProjectScheduleHours(logged))} logged</span>
                        ${slipLabel ? `<span class="social-neo-pill is-tone-${escape(slipTone)}">${escape(slipLabel)}</span>` : ''}
                    </div>
                </section>`;
        }

        return {
            renderProjectPlanVsBaselineStrip,
            renderProjectProgressHoursStrip
        };
    }

    window.createKiuSocialWorkspaceScheduleUiApi = createKiuSocialWorkspaceScheduleUiApi;
})();
