/* Shared Social Neo UI primitives — load before social domain modules. */
(function initSocialUiKernel() {
    'use strict';

    function esc(value) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function socialNeoEmptyHero(icon, title, copy, options = {}) {
        const wrap = options.wrapCard !== false;
        const inner = `
                <div class="social-neo-empty-hero">
                    <i class="${esc(icon)}"${options.iconHidden === false ? '' : ' aria-hidden="true"'}></i>
                    <strong>${esc(title)}</strong>
                    <span>${esc(copy)}</span>
                </div>`;
        if (!wrap) return inner;
        return `
            <section class="social-neo-card">
${inner}
            </section>`;
    }

    function socialNeoEmpty(icon, title, copy) {
        return `
            <div class="social-neo-empty">
                ${icon ? `<i class="${esc(icon)}" aria-hidden="true"></i>` : ''}
                ${title ? `<strong>${esc(title)}</strong>` : ''}
                ${copy ? `<p>${esc(copy)}</p>` : ''}
            </div>`;
    }

    function socialNeoDialogHead(title, subtitle, options = {}) {
        const icon = options.icon ? `<i class="${esc(options.icon)}" aria-hidden="true"></i> ` : '';
        const close = options.hideClose ? '' : `
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>`;
        return `
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title">${icon}${esc(title)}</strong>
                        ${subtitle ? `<span class="lux-glass-dialog-subtitle">${esc(subtitle)}</span>` : ''}
                    </div>${close}
                </div>`;
    }

    function socialNeoDialogActions(options = {}) {
        const cancel = options.cancelLabel || 'Cancel';
        const submit = options.submitLabel || 'Save';
        const submitIcon = options.submitIcon ? `<i class="${esc(options.submitIcon)}"></i> ` : '';
        const submitExtra = options.submitClass ? ` ${options.submitClass}` : '';
        const submitAttrs = options.submitAttrs || '';
        const cancelAction = options.cancelAction || 'dialog-close';
        const actionsClass = options.actionsClass ? ` ${options.actionsClass}` : '';
        const cancelExtra = options.cancelClass ? ` ${options.cancelClass}` : '';
        const tone = options.submitTone === 'danger' ? 'lux-primary-btn lux-btn-danger' : 'lux-primary-btn';
        const submitBody = options.submitHtml != null ? options.submitHtml : `${submitIcon}${esc(submit)}`;
        const cancelBtn = options.hideCancel
            ? ''
            : `<button class="lux-secondary-btn lux-glass-dialog-cancel-btn${cancelExtra}" type="button" data-action="${esc(cancelAction)}">${esc(cancel)}</button>`;
        return `
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions${actionsClass}">
                    ${cancelBtn}
                    <button class="${tone} lux-glass-dialog-submit-btn${submitExtra}" type="${options.submitType || 'submit'}" ${submitAttrs}>${submitBody}</button>
                </div>`;
    }

    function socialNeoField(label, controlHtml, options = {}) {
        const idAttr = options.forId ? ` for="${esc(options.forId)}"` : '';
        const fieldClass = options.fieldClass ? ` ${options.fieldClass}` : '';
        return `
                        <label class="lux-glass-dialog-field${fieldClass}"${idAttr}>
                            <span class="social-neo-label">${esc(label)}</span>
                            ${controlHtml}
                        </label>`;
    }

    function socialNeoSectionHead(title, subtitle) {
        return `
                        <div class="lux-glass-dialog-section-head">
                            <strong>${esc(title)}</strong>
                            ${subtitle ? `<span>${esc(subtitle)}</span>` : ''}
                        </div>`;
    }


    /** titleHtml/subtitleHtml already escaped by caller (use for dynamic titles). */
    function socialNeoDialogHeadHtml(titleHtml, subtitleHtml, options = {}) {
        const close = options.hideClose ? '' : `
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>`;
        return `
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head${options.headClass ? ` ${options.headClass}` : ''}">
                    <div class="lux-glass-dialog-heading${options.headingClass ? ` ${options.headingClass}` : ''}">
                        <strong class="lux-glass-dialog-title${options.titleClass ? ` ${options.titleClass}` : ''}">${titleHtml || ''}</strong>
                        ${subtitleHtml ? `<span class="lux-glass-dialog-subtitle">${subtitleHtml}</span>` : ''}
                    </div>${close}
                </div>`;
    }

    function socialNeoFieldHtml(labelHtml, controlHtml, options = {}) {
        const idAttr = options.forId != null && options.forId !== ''
            ? ` for="${esc(options.forId)}"`
            : '';
        const fieldClass = options.fieldClass ? ` ${options.fieldClass}` : '';
        return `
                        <label class="lux-glass-dialog-field${fieldClass}"${idAttr}>
                            <span class="social-neo-label">${labelHtml || ''}</span>
                            ${controlHtml}
                        </label>`;
    }

    const api = {
        esc,
        socialNeoEmptyHero,
        socialNeoEmpty,
        socialNeoDialogHead,
        socialNeoDialogHeadHtml,
        socialNeoDialogActions,
        socialNeoField,
        socialNeoFieldHtml,
        socialNeoSectionHead,
        emptyHero: socialNeoEmptyHero,
        empty: socialNeoEmpty,
        dialogHead: socialNeoDialogHead,
        dialogHeadHtml: socialNeoDialogHeadHtml,
        dialogActions: socialNeoDialogActions,
        field: socialNeoField,
        fieldHtml: socialNeoFieldHtml,
        sectionHead: socialNeoSectionHead
    };
    window.SocialUiKernel = api;
    Object.keys(api).forEach((key) => {
        if (typeof window[key] !== 'function') window[key] = api[key];
    });
})();
