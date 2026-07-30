/* Portal glass-dialog markup helpers (SSOT). Load after utilities.js on bare routes. */
(function initLuxGlassDialogShared() {
    if (window.__KIU_LUX_GLASS_DIALOG_LOADED) return;
    window.__KIU_LUX_GLASS_DIALOG_LOADED = true;

    function escapeLuxGlassDialogHtml(value) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderLuxGlassDialogHead({
        title = '',
        icon = 'fa-layer-group',
        subtitle = '',
        headExtra = '',
        closeLabel = 'Close',
        closeAttr = 'data-lms-click="closeLmsQuizAccessDialog()"'
    } = {}) {
        const subtitleHtml = subtitle
            ? `<span class="lux-glass-dialog-subtitle">${subtitle}</span>`
            : '';
        return `
        <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
            <div class="lux-glass-dialog-heading">
                <strong class="lux-glass-dialog-title"><i class="fas ${icon}" aria-hidden="true"></i> ${escapeLuxGlassDialogHtml(title)}</strong>
                ${subtitleHtml}
            </div>
            ${headExtra}
            <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn" aria-label="${escapeLuxGlassDialogHtml(closeLabel)}" ${closeAttr}><i class="fas fa-times"></i></button>
        </div>
    `;
    }

    function renderLuxGlassDialogCard({
        hookClass = '',
        bodyClass = '',
        headHtml = '',
        bodyHtml = '',
        actionsHtml = '',
        title,
        icon,
        subtitle,
        headExtra = '',
        closeLabel,
        closeAttr
    } = {}) {
        const head = headHtml || renderLuxGlassDialogHead({ title, icon, subtitle, headExtra, closeLabel, closeAttr });
        return `
        <div class="lux-glass-dialog-card lux-glass-dialog-card--form ${hookClass}" role="dialog" aria-modal="true" data-lux-transparency-exempt="1">
            ${head}
            <div class="lux-glass-dialog-body ${bodyClass}">${bodyHtml}</div>
            ${actionsHtml ? `<div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">${actionsHtml}</div>` : ''}
        </div>
    `;
    }

    function luxPortalModalOverlayClass(extra = '') {
        return `lms-glass-dialog-overlay lux-glass-dialog-overlay${extra ? ` ${extra}` : ''}`;
    }

    function renderLuxHubFormModalHead({
        title = '',
        icon = 'fa-layer-group',
        subtitle = '',
        typePill = '',
        closeAttr = ''
    } = {}) {
        const typePillHtml = typePill
            ? `<span class="lux-hub-form-type-pill home-hover-chip">${escapeLuxGlassDialogHtml(typePill)}</span>`
            : '';
        const subtitleHtml = subtitle
            ? `<span class="lux-glass-dialog-subtitle">${escapeLuxGlassDialogHtml(subtitle)}</span>`
            : '';
        return `
        <div class="lux-glass-dialog-section-head lux-glass-dialog-head lux-hub-form-modal-head">
            <div class="lux-glass-dialog-heading">
                <strong class="lux-glass-dialog-title"><i class="fas ${icon}" aria-hidden="true"></i> ${escapeLuxGlassDialogHtml(title)}</strong>
                ${subtitleHtml}
            </div>
            ${typePillHtml}
            <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn" aria-label="Close modal" ${closeAttr}><i class="fas fa-times"></i></button>
        </div>
    `;
    }

    function renderLuxHubFormModalFoot({ statusHtml = '', actionsHtml = '' } = {}) {
        return `
        <div class="lux-hub-form-modal-foot">
            ${statusHtml}
            ${actionsHtml ? `<div class="lux-glass-dialog-form-actions lux-hub-form-modal-actions lux-btn-row-stack">${actionsHtml}</div>` : ''}
        </div>
    `;
    }

    function renderLuxHubFormModalOverlay({
        dismissAttr = '',
        hookClass = '',
        formId = '',
        formAttrs = '',
        headHtml = '',
        bodyHtml = '',
        footHtml = ''
    } = {}) {
        return `
        <div class="${luxPortalModalOverlayClass('lux-hub-form-modal-overlay')}" ${dismissAttr} role="presentation" aria-hidden="true">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--hub-form ${hookClass}" ${formId ? `id="${escapeLuxGlassDialogHtml(formId)}"` : ''} novalidate data-lux-transparency-exempt="1" ${formAttrs}>
                ${headHtml}
                <div class="lux-glass-dialog-body lux-glass-dialog-body--hub-form">${bodyHtml}</div>
                ${footHtml}
            </form>
        </div>
    `;
    }

    function renderLuxHubDialogModalOverlay({
        dismissAttr = '',
        hookClass = '',
        headHtml = '',
        bodyHtml = '',
        closeAttr = '',
        title = '',
        icon = 'fa-layer-group',
        bodyClass = ''
    } = {}) {
        const head = headHtml || renderLuxGlassDialogHead({ title, icon, closeAttr });
        return `
        <div class="${luxPortalModalOverlayClass('lux-hub-dialog-modal-overlay')}" ${dismissAttr} role="dialog" aria-modal="true" aria-hidden="true">
            <div class="lux-glass-dialog-card lux-glass-dialog-card--hub-dialog ${hookClass}" data-lux-transparency-exempt="1">
                ${head}
                <div class="lux-glass-dialog-body ${bodyClass}">${bodyHtml}</div>
            </div>
        </div>
    `;
    }

    window.openLuxHubFormModalRoot = function openLuxHubFormModalRoot(root) {
        if (!root) return;
        const overlay = root.querySelector('.lms-glass-dialog-overlay, .lux-glass-dialog-overlay');
        if (!overlay) return;
        if (typeof window.openLuxPortalModal === 'function') {
            window.openLuxPortalModal(overlay, { scrollLock: true });
            return;
        }
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        if (typeof window.openLuxGlassDialogOverlay === 'function') {
            window.openLuxGlassDialogOverlay(overlay);
        } else {
            overlay.classList.add('is-open');
        }
    };

    window.closeLuxHubFormModalRoot = function closeLuxHubFormModalRoot(root, options = {}) {
        if (!root) return;
        const overlay = root.querySelector('.lms-glass-dialog-overlay, .lux-glass-dialog-overlay');
        const finish = () => {
            root.innerHTML = '';
            root.setAttribute('hidden', '');
            options.onDone?.();
        };
        if (!overlay || options.instant) {
            finish();
            return;
        }
        if (typeof window.closeLuxPortalModal === 'function') {
            window.closeLuxPortalModal(overlay, {
                remove: false,
                scrollLock: true,
                onDone: finish
            });
            return;
        }
        finish();
    };

    window.luxPortalModalOverlayClass = luxPortalModalOverlayClass;
    window.renderLuxHubFormModalHead = renderLuxHubFormModalHead;
    window.renderLuxHubFormModalFoot = renderLuxHubFormModalFoot;
    window.renderLuxHubFormModalOverlay = renderLuxHubFormModalOverlay;
    window.renderLuxHubDialogModalOverlay = renderLuxHubDialogModalOverlay;
    window.renderLuxGlassDialogHead = renderLuxGlassDialogHead;
    window.renderLuxGlassDialogCard = renderLuxGlassDialogCard;
    window.renderLmsGlassDialogHead = renderLuxGlassDialogHead;
    window.renderLmsGlassDialogCard = renderLuxGlassDialogCard;
    window.openLuxHubModalBackdrop = window.openLuxHubFormModalRoot;
    window.closeLuxHubModalRoot = window.closeLuxHubFormModalRoot;
})();
