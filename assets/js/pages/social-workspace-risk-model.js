/* Pure project-risk model helpers for social workspace.
 * ESM leaf: social.html type=module; namespace-only install (no flat window re-exports).
 * Uses __kiuSocialWorkspaceHooks.text / .escape when available.
 */
'use strict';

function text(value) {
    const hook = window.__kiuSocialWorkspaceHooks?.text;
    if (typeof hook === 'function') return hook(value);
    return String(value == null ? '' : value).trim();
}

function escape(value) {
    const hook = window.__kiuSocialWorkspaceHooks?.escape;
    if (typeof hook === 'function') return hook(value);
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const PROJECT_RISK_SCALE_OPTIONS = [1, 2, 3, 4, 5];
const PROJECT_RISK_LIKELIHOOD_LABELS = {
    1: 'Rare',
    2: 'Unlikely',
    3: 'Possible',
    4: 'Likely',
    5: 'Almost certain'
};
const PROJECT_RISK_IMPACT_LABELS = {
    1: 'Negligible',
    2: 'Minor',
    3: 'Moderate',
    4: 'Major',
    5: 'Severe'
};
const PROJECT_RISK_STATUS_OPTIONS = ['open', 'watching', 'mitigated', 'closed'];
const PROJECT_RISK_RESPONSE_OPTIONS = ['avoid', 'mitigate', 'transfer', 'accept'];

function projectRiskOptionLabel(value) {
    const raw = text(value || '');
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function projectRiskScaleRank(value) {
    const key = text(value ?? '3').toLowerCase();
    if (key === 'low') return 1;
    if (key === 'medium' || key === 'med') return 3;
    if (key === 'high') return 5;
    const n = Math.round(Number(key));
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
    return 3;
}

function projectRiskScaleOptionLabel(value, kind = 'likelihood') {
    const rank = projectRiskScaleRank(value);
    const labels = kind === 'impact' ? PROJECT_RISK_IMPACT_LABELS : PROJECT_RISK_LIKELIHOOD_LABELS;
    return `${rank} · ${labels[rank] || projectRiskOptionLabel(value)}`;
}

function formatProjectRiskScore(score, tier) {
    const n = Number(score) || 0;
    return `${n} / 25 · ${projectRiskOptionLabel(tier)}`;
}

function projectRiskExposureScore(likelihood, impact) {
    return projectRiskScaleRank(likelihood) * projectRiskScaleRank(impact);
}

function projectRiskExposureTiers(likelihood, impact) {
    const score = projectRiskExposureScore(likelihood, impact);
    if (score >= 15) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
}

function projectRiskIsActiveStatus(status) {
    const s = text(status || 'open').toLowerCase();
    return s === 'open' || s === 'watching';
}

function sortProjectRisksForRegister(risks) {
    const list = Array.isArray(risks) ? risks.slice() : [];
    const statusRank = (status) => {
        const s = text(status || 'open').toLowerCase();
        if (s === 'open') return 0;
        if (s === 'watching') return 1;
        if (s === 'mitigated') return 2;
        return 3;
    };
    return list.sort((left, right) => {
        const statusDelta = statusRank(left?.status) - statusRank(right?.status);
        if (statusDelta) return statusDelta;
        const scoreDelta = projectRiskExposureScore(right?.likelihood, right?.impact)
            - projectRiskExposureScore(left?.likelihood, left?.impact);
        if (scoreDelta) return scoreDelta;
        return text(left?.title || '').localeCompare(text(right?.title || ''));
    });
}

function projectRiskRegisterSummary(risks) {
    const list = Array.isArray(risks) ? risks : [];
    let open = 0;
    let high = 0;
    let unassigned = 0;
    list.forEach((risk) => {
        const active = projectRiskIsActiveStatus(risk?.status);
        if (active) open += 1;
        if (active && projectRiskExposureTiers(risk?.likelihood, risk?.impact) === 'high') high += 1;
        if (active && !text(risk?.ownerUserId || '')) unassigned += 1;
    });
    return { open, high, unassigned };
}

function projectRiskLinkedTaskIdList(risk) {
    return (Array.isArray(risk?.linkedTaskIds) ? risk.linkedTaskIds : [])
        .map((id) => text(id))
        .filter(Boolean);
}

function projectRiskLinksTask(risk, taskId) {
    const tid = text(taskId || '');
    if (!tid) return false;
    return projectRiskLinkedTaskIdList(risk).includes(tid);
}

function buildProjectRiskCountByTaskId(risks) {
    const map = {};
    (Array.isArray(risks) ? risks : []).forEach((risk) => {
        projectRiskLinkedTaskIdList(risk).forEach((tid) => {
            map[tid] = (map[tid] || 0) + 1;
        });
    });
    return map;
}

function renderProjectRiskScaleOptions(name, selectedValue, kind = 'likelihood') {
    void name;
    const selected = projectRiskScaleRank(selectedValue || 3);
    return PROJECT_RISK_SCALE_OPTIONS.map((option) => {
        const rank = projectRiskScaleRank(option);
        return `<option value="${escape(String(rank))}" ${selected === rank ? 'selected' : ''}>${escape(projectRiskScaleOptionLabel(rank, kind))}</option>`;
    }).join('');
}

export const socialWorkspaceRiskModelApi = {
    PROJECT_RISK_SCALE_OPTIONS,
    PROJECT_RISK_LIKELIHOOD_LABELS,
    PROJECT_RISK_IMPACT_LABELS,
    PROJECT_RISK_STATUS_OPTIONS,
    PROJECT_RISK_RESPONSE_OPTIONS,
    projectRiskOptionLabel,
    projectRiskScaleRank,
    projectRiskScaleOptionLabel,
    formatProjectRiskScore,
    projectRiskExposureScore,
    projectRiskExposureTiers,
    projectRiskIsActiveStatus,
    sortProjectRisksForRegister,
    projectRiskRegisterSummary,
    projectRiskLinkedTaskIdList,
    projectRiskLinksTask,
    buildProjectRiskCountByTaskId,
    renderProjectRiskScaleOptions
};

/** Install Kiu* namespace only (no flat window.projectRisk* re-exports). */
export function installSocialWorkspaceRiskModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_WORKSPACE_RISK_MODEL_LOADED) {
        return target?.KiuSocialWorkspaceRiskModel || socialWorkspaceRiskModelApi;
    }
    target.__KIU_SOCIAL_WORKSPACE_RISK_MODEL_LOADED = true;
    target.__kiuSocialWorkspaceRiskModelExports = socialWorkspaceRiskModelApi;
    target.KiuSocialWorkspaceRiskModel = socialWorkspaceRiskModelApi;
    return socialWorkspaceRiskModelApi;
}

installSocialWorkspaceRiskModel();
