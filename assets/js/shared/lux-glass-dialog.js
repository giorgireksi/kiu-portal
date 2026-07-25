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

    window.renderLuxGlassDialogHead = renderLuxGlassDialogHead;
    window.renderLuxGlassDialogCard = renderLuxGlassDialogCard;
    window.renderLmsGlassDialogHead = renderLuxGlassDialogHead;
    window.renderLmsGlassDialogCard = renderLuxGlassDialogCard;
})();
