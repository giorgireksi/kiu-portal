/* Peeled from assets/js/pages/gradebook-workspace.js. Load before host. */
/* Pattern C: assessment component manager UI. */
(function () {
    if (window.__KIU_GRADEBOOK_COMPONENTS_LOADED) return;
    window.__KIU_GRADEBOOK_COMPONENTS_LOADED = true;

    window.__kiuCreateGradebookComponentsApi = function createKiuGradebookComponentsApi(deps = {}) {
        const d = deps;
        void d;
const GRADEBOOK_COMPONENT_COLOR_PALETTE = ['#38bdf8', '#a78bfa', '#34d399', '#2dd4bf', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#84cc16'];
let gradebookComponentManagerState = null;

function gradebookSchemeKeyFromCriterion(criterionKey) {
    const parts = String(criterionKey || '').split('-').filter(Boolean);
    if (!parts.length) return 'component';
    return parts.map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function openGradebookComponentManager(subjectId) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors, teaching assistants, or admins can manage assessment components.');
        return;
    }
    const key = resolveGradebookCourseIdForWeights(subjectId);
    if (!key) {
        alert('Open a subject before managing components.');
        return;
    }
    const base = getGradebookSubjectComponents(key) || cloneGradebookComponents(GRADEBOOK_SCHEME_COMPONENTS);
    gradebookComponentManagerState = { subjectId: key, components: cloneGradebookComponents(base) };
    renderGradebookComponentManager();
}

function renderGradebookComponentManager() {
    const state = gradebookComponentManagerState;
    if (!state) return;
    let overlay = document.getElementById('gradebook-component-manager');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gradebook-component-manager';
        overlay.className = 'gb-modal-overlay lms-glass-dialog-overlay';
        document.body.appendChild(overlay);
    }
    const profiles = ensureGradebookComponentProfileStore();
    const componentRows = state.components.map(component => {
        const criterionKey = normalizeGradebookCriterion(component.criterionKey || component.schemeKey);
        const entryCount = countGradebookCriterionEntriesForSubject(state.subjectId, criterionKey);
        return `
            <div class="gb-component-row">
                <span class="gb-component-dot" style="background:${escapeHtml(component.color || '#64748b')}"></span>
                <strong class="gb-component-name">${escapeHtml(component.label || criterionKey)}</strong>
                <span class="gb-component-meta">${entryCount} recorded</span>
                <button type="button" class="gb-modern-action" data-gradebook-click="component-manager-remove" data-gradebook-component-key="${escapeHtml(criterionKey)}" aria-label="Remove ${escapeHtml(component.label || criterionKey)}"><i class="fas fa-times"></i></button>
            </div>
        `;
    }).join('') || '<div class="gb-modal-empty"><span>No components. Add one below or apply a profile.</span></div>';
    const profileOptions = profiles.map(profile => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)}</option>`).join('');
    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'gb-modal gb-component-manager-modal',
        bodyClass: 'gb-modal-body gb-component-manager-body',
        title: 'Manage components',
        icon: 'fa-sliders',
        subtitle: 'Add or remove components for this subject. Changes apply to every group and propagate to the gradebook, study card, and breakdown.',
        closeAttr: 'data-gradebook-click="component-manager-close"',
        bodyHtml: `
                <div class="gb-component-list">${componentRows}</div>
                <div class="gb-component-add">
                    <input id="gb-component-add-input" type="text" class="lux-modern-field lms-route-input" placeholder="New component name (e.g. Lab, Presentation)">
                    <button type="button" class="lux-primary-btn" data-gradebook-click="component-manager-add"><i class="fas fa-plus"></i> Add component</button>
                </div>
                <div class="gb-component-profiles">
                    <div class="gb-modern-kicker">Profiles</div>
                    <div class="gb-component-profile-row">
                        <select id="gb-component-profile-select" class="lux-modern-field lms-route-input">${profileOptions}</select>
                        <button type="button" class="gb-modern-action" data-gradebook-click="component-manager-apply-profile"><i class="fas fa-download"></i> Apply</button>
                        <button type="button" class="gb-modern-action" data-gradebook-click="component-manager-save-profile"><i class="fas fa-save"></i> Save current as profile</button>
                    </div>
                </div>`,
        actionsHtml: `
                <button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-gradebook-click="component-manager-close">Cancel</button>
                <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" data-gradebook-click="component-manager-save"><i class="fas fa-check"></i> Save changes</button>`
    });
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function addGradebookComponentFromManager() {
    const state = gradebookComponentManagerState;
    if (!state) return;
    const input = document.getElementById('gb-component-add-input');
    const rawLabel = String(input?.value || '').trim();
    if (!rawLabel) {
        alert('Enter a component name.');
        return;
    }
    const criterionKey = normalizeGradebookCriterion(rawLabel);
    if (state.components.some(component => normalizeGradebookCriterion(component.criterionKey || component.schemeKey) === criterionKey)) {
        alert('A component with that name already exists.');
        return;
    }
    const color = GRADEBOOK_COMPONENT_COLOR_PALETTE[state.components.length % GRADEBOOK_COMPONENT_COLOR_PALETTE.length];
    state.components.push({
        schemeKey: gradebookSchemeKeyFromCriterion(criterionKey),
        criterionKey,
        label: humanizeAssessmentKey(rawLabel),
        color,
        defaultCount: 1,
        defaultMax: 10
    });
    renderGradebookComponentManager();
}

function removeGradebookComponentFromManager(criterionKey) {
    const state = gradebookComponentManagerState;
    if (!state) return;
    const normalizedKey = normalizeGradebookCriterion(criterionKey);
    const component = state.components.find(item => normalizeGradebookCriterion(item.criterionKey || item.schemeKey) === normalizedKey);
    if (!component) return;
    const entryCount = countGradebookCriterionEntriesForSubject(state.subjectId, normalizedKey);
    const warning = entryCount > 0
        ? `Remove "${component.label}"? Saving will permanently delete ${entryCount} recorded score${entryCount === 1 ? '' : 's'} across all groups of this subject.`
        : `Remove "${component.label}"?`;
    if (!confirm(warning)) return;
    state.components = state.components.filter(item => normalizeGradebookCriterion(item.criterionKey || item.schemeKey) !== normalizedKey);
    renderGradebookComponentManager();
}

function applyGradebookComponentProfileFromManager() {
    const state = gradebookComponentManagerState;
    if (!state) return;
    const select = document.getElementById('gb-component-profile-select');
    const profileId = String(select?.value || '');
    const profile = ensureGradebookComponentProfileStore().find(item => item.id === profileId);
    if (!profile) return;
    if (!confirm(`Apply profile "${profile.name}"? This replaces the current component list for this subject (existing scores are kept until you save).`)) return;
    state.components = cloneGradebookComponents(profile.components);
    renderGradebookComponentManager();
}

function saveGradebookComponentProfileFromManager() {
    const state = gradebookComponentManagerState;
    if (!state) return;
    const name = String(prompt('Profile name:') || '').trim();
    if (!name) return;
    const profiles = ensureGradebookComponentProfileStore();
    const id = `${normalizeGradebookCriterion(name)}-${Date.now().toString(36)}`;
    profiles.push({ id, name, components: cloneGradebookComponents(state.components) });
    saveState();
    renderGradebookComponentManager();
}

function commitGradebookComponentManager() {
    const state = gradebookComponentManagerState;
    if (!state) return;
    const previous = getGradebookSubjectComponents(state.subjectId) || cloneGradebookComponents(GRADEBOOK_SCHEME_COMPONENTS);
    const nextKeys = new Set(state.components.map(component => normalizeGradebookCriterion(component.criterionKey || component.schemeKey)));
    previous
        .map(component => normalizeGradebookCriterion(component.criterionKey || component.schemeKey))
        .filter(key => !nextKeys.has(key))
        .forEach(key => deleteGradebookCriterionDataForSubject(state.subjectId, key));
    setGradebookSubjectComponents(state.subjectId, state.components);
    closeGradebookComponentManager();
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
    if (typeof window.refreshLmsBulkGroupTools === 'function') window.refreshLmsBulkGroupTools();
}

function closeGradebookComponentManager() {
    gradebookComponentManagerState = null;
    const overlay = document.getElementById('gradebook-component-manager');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

        const api = {
            gradebookSchemeKeyFromCriterion,
            openGradebookComponentManager,
            renderGradebookComponentManager,
            addGradebookComponentFromManager,
            removeGradebookComponentFromManager,
            applyGradebookComponentProfileFromManager,
            saveGradebookComponentProfileFromManager,
            commitGradebookComponentManager,
            closeGradebookComponentManager,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateGradebookComponentsApi({});
})();
