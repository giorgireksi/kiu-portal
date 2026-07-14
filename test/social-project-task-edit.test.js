import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project task edit', () => {
    it('wires an edit dialog and an urgent priority option', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');

        expect(readSource('assets/js/pages/social-workspace.js')).toContain("if (kind === 'project-task-edit')");
        expect(workspaceModule).toContain("project-task-edit");
        expect(workspaceModule).toContain('data-form="${escape(formKind)}"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-task-edit-open'");
        // Priority is now Impact×Effort (matrix); 'urgent' comes from the matrix bucket.
        expect(source).toContain("if (s >= 20) return 'urgent'");

        const detailModalBlock = workspaceModule.match(/function renderProjectTaskDetailModal[\s\S]*?\n    \}/)?.[0] || '';
        const taskFormBlock = workspaceModule.match(/function renderProjectTaskFormFields[\s\S]*?\n    \}/)?.[0] || source.match(/function renderProjectTaskFormFields[\s\S]*?\n    \}/)?.[0] || '';
        expect(detailModalBlock).toContain('data-action="project-task-edit-open"');
        expect(detailModalBlock).toContain('resolveProjectTaskPriorityDisplay');
        expect(detailModalBlock).not.toContain('spt-detail-check-list');
        expect(taskFormBlock).not.toContain('<strong>Checklist</strong>');
        expect(taskFormBlock).not.toContain('Break the task into trackable steps.');
    });

    it('forwards create and edit submits without checklist fields', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect(source).not.toMatch(/formType === 'project-task-create'[\s\S]{0,1200}?checklist: parseTaskChecklistFromForm\(form\)/);
        expect(source).not.toMatch(/formType === 'project-task-edit'[\s\S]{0,1200}?checklist: parseTaskChecklistFromForm\(form\)/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-create'[\s\S]*?budgetEstimate: parseProjectTaskBudgetEstimate/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-edit'[\s\S]*?budgetEstimate: parseProjectTaskBudgetEstimate/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-create'[\s\S]*?parseProjectTaskPriorityPayload\(form, runtime\)/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-edit'[\s\S]*?parseProjectTaskPriorityPayload\(form, runtime\)/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-create'[\s\S]*?startAt: fromDateTimeLocalValue/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-edit'[\s\S]*?startAt: fromDateTimeLocalValue/);
        expect(workspaceModule).toContain('name="projectTaskBudgetEstimate"');
        // Both Impact×Effort and Risk always render (no priority-mode picker).
        expect(workspaceModule).toContain('name="projectTaskImpactScore"');
        expect(workspaceModule).toContain('name="projectTaskEffortScore"');
        expect(workspaceModule).toContain('name="projectTaskStartAt"');
        expect(workspaceModule).toContain('name="projectTaskTimeOptimistic"');
        expect(workspaceModule).toContain('name="projectTaskTimeMostLikely"');
        expect(workspaceModule).toContain('name="projectTaskTimePessimistic"');
        expect(workspaceModule).toContain('maxlength="120"');
        expect(workspaceModule).toContain('maxlength="2000"');
        expect(workspaceModule).toContain('Planned task cost');
        expect(workspaceModule).not.toContain('name="projectTaskTimeEstimate"');
        expect(workspaceModule).not.toContain('name="projectTaskTimeProbabilityPct"');
        expect(workspaceModule).not.toContain('name="projectTaskPriorityModel"');
        expect(source).not.toContain('name="projectTaskProbabilityPct"');
        expect(source).not.toContain('name="projectTaskImpactMoney"');
        expect(source).not.toContain('name="projectTaskRiskTimeImpact"');
        expect(source).not.toContain('name="projectTaskRiskTimeUnit"');
        expect(source).not.toContain('name="projectTaskRiskStatus"');
        expect(source).not.toContain('name="projectTaskRiskResponse"');
        expect(source).not.toContain('name="projectTaskRiskOwnerId"');
        expect(source).not.toContain('name="projectTaskRiskMitigation"');
        expect(source).not.toContain('Risk event');
        expect(source).not.toContain('function resolveProjectTaskRisk(');
        expect(source).not.toContain('function riskProbabilityBand(');
        expect(workspaceModule).toContain('social-project-task-priority-block');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('projectTaskDialogReasons');
        const formFields = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectTaskFormFields[\s\S]*?\n    \}/)?.[0] || '';
        const titleIdx = formFields.indexOf('name="projectTaskTitle"');
        const descIdx = formFields.indexOf('name="projectTaskDescription"');
        const statusIdx = formFields.indexOf('name="projectTaskStatus"');
        const impactIdx = formFields.indexOf('name="projectTaskImpactScore"');
        const pertIdx = formFields.indexOf('name="projectTaskTimeOptimistic"');
        const startIdx = formFields.indexOf('name="projectTaskStartAt"');
        const dueIdx = formFields.indexOf('name="projectTaskDueAt"');
        const budgetIdx = formFields.indexOf('name="projectTaskBudgetEstimate"');
        const actualIdx = formFields.indexOf('name="projectTaskActualTime"');
        const assigneeIdx = formFields.indexOf('name="projectTaskAssigneeId"');
        expect(titleIdx).toBeGreaterThan(-1);
        expect(descIdx).toBeGreaterThan(titleIdx);
        expect(statusIdx).toBeGreaterThan(descIdx);
        expect(impactIdx).toBeGreaterThan(statusIdx);
        expect(pertIdx).toBeGreaterThan(impactIdx);
        expect(startIdx).toBeGreaterThan(pertIdx);
        expect(dueIdx).toBeGreaterThan(startIdx);
        expect(budgetIdx).toBeGreaterThan(dueIdx);
        expect(actualIdx).toBeGreaterThan(budgetIdx);
        expect(assigneeIdx).toBeGreaterThan(actualIdx);
    });

    it('hoists countNum for assignee workload suffixes in the task form', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const formIdx = source.indexOf('function renderProjectTaskFormFields');
        const countNumIdx = source.indexOf('function countNum(');
        expect(formIdx).toBeGreaterThan(-1);
        expect(countNumIdx).toBeGreaterThan(-1);
        expect(countNumIdx).toBeLessThan(formIdx);
        const formFields = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectTaskFormFields[\s\S]*?\n    \}/)?.[0] || '';
        expect(formFields).toContain('formatProjectScheduleHours');
        expect(formFields).toMatch(/tasks ·/);
    });

    it('wires project schedule start date; create/edit force isMilestone false', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const settingsFn = workspaceModule.match(/function renderProjectSettingsDialog[\s\S]*?\n    \}/)?.[0] || '';
        expect(settingsFn).toContain('name="projectScheduleStartAt"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-settings'[\s\S]*?scheduleStartAt:/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-create'[\s\S]*?isMilestone: false/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-edit'[\s\S]*?isMilestone: false/);
        expect(source).not.toContain('name="projectTaskIsMilestone"');
        expect(source).toContain("createSocialWorkspaceStub('formatProjectScheduleDate'");
        expect(source).toContain("createSocialWorkspaceStub('projectScheduleCalendarDate'");
    });

    it('exposes the checklist CSS primitives', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        expect(css).toContain('.social-project-task-checklist-row');
        expect(css).toContain('.social-project-task-checklist-progress');
        expect(css).toContain('.social-project-task-checklist-fill');
        expect(css).toContain('.social-project-baseline-card');
        expect(css).toContain('.social-project-task-variance');
    });

    it('wires plan-vs-reality actuals, variance, health CPM, and baseline UI', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const healthFn = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectHealthDialog[\s\S]*?\n    \}/)?.[0] || '';
        const formFields = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectTaskFormFields[\s\S]*?\n    \}/)?.[0] || '';

        expect(source).not.toContain('function chainOf(');
        expect(healthFn).toContain('computeProjectSchedule(project)');
        expect(healthFn).toContain('plannedFinishLabel');
        expect(healthFn).toContain('overEstimateCount');

        expect(formFields).toContain('name="projectTaskActualTime"');
        expect(formFields).toContain('name="projectTaskActualCost"');
        expect(source).toContain('function parseProjectTaskActualsPayload(');
        expect(source).toContain('function formatTaskTimeVariance(');
        expect(source).toContain('function formatTaskCostVariance(');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectPlanVsBaselineStrip(');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-baseline-set'");

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-create'[\s\S]*?parseProjectTaskActualsPayload\(form, runtime\)/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/formType === 'project-task-edit'[\s\S]*?parseProjectTaskActualsPayload\(form, runtime\)/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/submitMode === 'create-another'[\s\S]*?projectTaskActualTime/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/submitMode === 'create-another'[\s\S]*?projectTaskActualCost/);

        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const service = readSource('backend/platform/domains/social-projects-service.js');
        expect(runtime).toMatch(/createProjectTask[\s\S]*?startAt:/);
        expect(service).toContain('startAt: socialText(payload.startAt || \'\')');
        expect(runtime).toMatch(/createProjectTask[\s\S]*?timeOptimistic:/);
        expect(runtime).not.toMatch(/createProjectTask[\s\S]*?riskTimeImpact:/);
        expect(runtime).toMatch(/createProjectTask[\s\S]*?actualTime:/);
        expect(runtime).toMatch(/createProjectTask[\s\S]*?actualCost:/);
        expect(runtime).toContain('setPortalSocialProjectBaseline: setProjectBaseline');
    });

    it('wires project risk register dialog, nav, and graph group badge', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-projects-lms.css');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const riskFn = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectRiskDialog[\s\S]*?\n    \}/)?.[0] || '';

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("data-action=\"project-risk-open\"");
        expect(readSource('assets/js/pages/social-workspace.js')).toContain("kind === 'project-risk'");
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectRiskDialog(');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("formType === 'project-risk-save'");
        // Group risk badge markup lives in workspace graph node renderer
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('social-project-task-graph-group-risk-badge');
        expect(readSource('assets/js/pages/social-workspace.js') + source).not.toContain('social-project-task-graph-card-risk');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('social-neo-dialog-card--project-risk');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('social-neo-dialog-card--lms-create');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('social-neo-dialog-body--project-risk');
        expect(source).toContain('social-neo-dialog-group-create-section');
        expect(source).toContain('social-neo-dialog-actions');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('projectRiskDialogReasons');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-select-group');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-compose-open');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-compose-cancel');
        expect(source).toContain('projectRiskComposeOpen');
        expect(source).toContain('projectRiskTaskId');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-select-task');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-toggle-group');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('project-risk-task-compose');
        expect(source).toContain('projectRiskExpandedGroupIds');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('spr-rail-section');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('spr-group-tasks');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('Work packages');
        expect(riskFn).toContain('Tasks');
        expect(source).toContain("createSocialWorkspaceStub('openProjectTaskGraphContextMenu'");
        expect(source).toContain('function openProjectRiskForTask(');
        expect(source).toContain('function countProjectRisksForTask(');
        expect(source).not.toContain('sptg-node-risks-btn');
        // Context menu markup lives with graph runtime in workspace module
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('sptg-context-menu');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('data-sptg-menu-action');
        expect(source).toContain('function sortProjectRisksForRegister(');
        expect(source).toContain('function projectRiskRegisterSummary(');
        expect(source).toContain('function projectRiskOptionLabel(');
        expect(source).toContain('function projectRiskScaleRank(');
        expect(source).toContain('function projectRiskScaleOptionLabel(');
        expect(source).toContain('function formatProjectRiskScore(');
        expect(source).not.toContain('social-project-risk-panel');
        expect(source).not.toContain('name="projectTaskRisk');
        expect(source).not.toContain('threats by work package');
        expect(riskFn).toContain('spr-layout');
        expect(riskFn).toContain('Scope:');
        expect(riskFn).toContain('spr-summary');
        expect(riskFn).toContain('spr-compose');
        expect(riskFn).toContain('No risks in');
        expect(riskFn).toContain('Risk score:');
        expect(riskFn).toContain('Score ${score}/25');
        expect(riskFn).toContain('spr-chip--score');
        expect(riskFn).toContain('L${rankL} × I${rankI}');
        expect(riskFn).toContain('max 25');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('PROJECT_RISK_LIKELIHOOD_LABELS');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('Almost certain');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('formatProjectRiskScore');
        expect(readSource('assets/js/pages/social-workspace.js')).toMatch(/score >= 15/);

        expect(css).toContain('.spr-layout');
        expect(css).toContain('.spr-summary');
        expect(css).toContain('.spr-rail--inline');
        expect(css).toContain('.social-project-task-graph-group-risk-badge');

        expect(runtime).toContain('createPortalSocialProjectRisk: createProjectRisk');
        expect(runtime).toContain('updatePortalSocialProjectRisk: updateProjectRisk');
        expect(runtime).toContain('deletePortalSocialProjectRisk: deleteProjectRisk');
    });

    it('wires Health and Risks into task map immersive topbar with graph stacking', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const css = readSource('assets/css/social-projects-lms.css');
        // Fullscreen shell lives in workspace; skip short page stub.
        const graphRe = /function renderProjectTaskGraphFullscreen\b[\s\S]*?\n    \}/g;
        let graphFn = '';
        let m;
        const combined = `${source}\n${workspaceModule}`;
        while ((m = graphRe.exec(combined)) !== null) {
            if (m[0].length > graphFn.length) graphFn = m[0];
        }

        expect(source).toContain('function renderProjectWorkspaceNavButtons(');
        expect(graphFn).toContain('social-project-task-graph-nav-controls');
        expect(graphFn).toContain('renderProjectWorkspaceNavButtons(project');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/function renderProjectWorkspaceNavButtons[\s\S]*?project-health-open[\s\S]*?project-risk-open/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/PROJECT_TASK_GRAPH_STACKED_DIALOGS[\s\S]*?'project-health'[\s\S]*?'project-risk'/);
        const workspaceModule2 = readSource('assets/js/pages/social-workspace.js');
        expect(workspaceModule2).toMatch(/kind === 'project-health'[\s\S]*?shouldRenderProjectTaskGraphStack/);
        expect(workspaceModule2).toMatch(/kind === 'project-risk'[\s\S]*?shouldRenderProjectTaskGraphStack/);
        expect(css).toContain('.social-project-task-graph-nav-controls');
    });

    it('restyles project health dialog with LMS create shell', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const healthFn = readSource('assets/js/pages/social-workspace.js').match(/function renderProjectHealthDialog[\s\S]*?\n    \}/)?.[0] || '';

        expect(healthFn).toContain('social-neo-dialog-card--project-health');
        expect(healthFn).toContain('social-neo-dialog-card--lms-create');
        expect(healthFn).toContain('social-neo-dialog-body--project-health');
        expect(healthFn).toContain('social-neo-dialog-group-create-section');
        expect(healthFn).toContain('social-neo-dialog-actions');
        expect(healthFn).not.toContain('social-project-health-panel');
        expect(healthFn).toContain('role="dialog" aria-modal="true"');

        expect(css).toContain('--project-health-surface');
        expect(css).toContain('.social-neo-dialog-card--project-health');
    });
});
