/* Utility panels + universal picker chrome. Peeled from luxury-shell-chrome.js.
 * Load before luxury-shell-chrome.js.
 */
(function initLuxuryShellPickerRuntime() {
    if (window.__KIU_LUXURY_SHELL_PICKER_LOADED) return;
    window.__KIU_LUXURY_SHELL_PICKER_LOADED = true;

    window.__kiuCreateLuxuryShellPickerApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function finalizeTopbarPopoverClose(panel) {
    if (!panel) return;
    panel.classList.remove('is-closing', 'is-open');
    panel.style.removeProperty('will-change');
    panel.setAttribute('aria-hidden', 'true');
    restoreTeleportedNode(panel);
}

function deactivateUtilityTriggers() {
    ['lux-notification-btn', 'lux-chat-btn'].forEach((buttonId) => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.classList.remove('is-active');
        button.setAttribute('aria-expanded', 'false');
    });
}

function animateTopbarPopoverClose(panel, options = {}) {
    if (!panel) return Promise.resolve();
    if (panel.classList.contains('is-closing') && !panel.classList.contains('is-open')) {
        finalizeTopbarPopoverClose(panel);
        return Promise.resolve();
    }
    if (!panel.classList.contains('is-open')) {
        finalizeTopbarPopoverClose(panel);
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            panel.removeEventListener('transitionend', onEnd);
            finalizeTopbarPopoverClose(panel);
            endPickerChromeBusy();
            resolve();
        };
        const onEnd = (event) => {
            if (event.target !== panel || event.propertyName !== 'opacity') return;
            finish();
        };
        beginPickerChromeBusy();
        if (typeof options.onDeactivate === 'function') options.onDeactivate(panel);
        panel.classList.remove('is-open');
        panel.classList.add('is-closing');
        forcePickerReflow(panel);
        panel.addEventListener('transitionend', onEnd);
        window.setTimeout(finish, LUX_PICKER_CLOSE_FALLBACK_MS);
    });
}

function revealTopbarPopover(panel, afterReveal) {
    if (!panel) return;
    beginPickerChromeBusy();
    window.__kiuSuppressLuxTransparencyRefresh = true;
    panel.classList.remove('is-open');
    panel.classList.add('is-closing');
    forcePickerReflow(panel);
    const reveal = () => {
        panel.classList.remove('is-closing');
        panel.classList.add('is-open');
        forcePickerReflow(panel);
        if (typeof afterReveal === 'function') afterReveal();
        releasePickerTransparencySuppress(panel);
    };
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(reveal);
    } else {
        reveal();
    }
}

function closeUtilityPanels(options = {}) {
    const openPanels = Array.from(document.querySelectorAll('.lux-utility-panel.is-open, .lux-utility-panel.is-closing'));
    const restoreTargetId = options.restoreFocus
        ? (openPanels.find((panel) => panel.classList.contains('is-open'))?.dataset.triggerId
            || openPanels[0]?.dataset.triggerId
            || '')
        : '';
    const finishTriggers = () => {
        deactivateUtilityTriggers();
        if (restoreTargetId) {
            restoreFocusById(restoreTargetId);
            deferRestoreFocusById(restoreTargetId);
        }
    };
    if (!openPanels.length) {
        finishTriggers();
        return Promise.resolve();
    }
    return Promise.all(openPanels.map((panel) => animateTopbarPopoverClose(panel, {
        onDeactivate: () => deactivateUtilityTriggers()
    }))).then(() => {
        finishTriggers();
    });
}

function ensureTopbarUtilityPanel(panelId) {
    const existing = document.getElementById(panelId);
    if (existing) return existing;
    const buttonId = panelId === 'lux-chat-panel' ? 'lux-chat-btn' : 'lux-notification-btn';
    const button = document.getElementById(buttonId);
    const wrapper = button?.closest('.lux-utility-wrap');
    if (!wrapper) return null;
    const panel = document.createElement('div');
    panel.className = 'lux-utility-panel';
    panel.id = panelId;
    panel.dataset.triggerId = buttonId;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', panelId === 'lux-chat-panel' ? 'Messenger panel' : 'Notifications panel');
    panel.tabIndex = -1;
    wrapper.appendChild(panel);
    return panel;
}

function ensureUserMenu() {
    const existing = document.getElementById('lux-user-menu');
    if (existing) return existing;
    const chip = document.getElementById('lux-user-chip');
    if (!chip) return null;
    const menu = document.createElement('div');
    menu.className = 'lux-user-menu';
    menu.id = 'lux-user-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = `
        <button type="button" role="menuitem" data-nav-target="personal-data">Personal Data</button>
        <button type="button" role="menuitem" data-nav-target="social">Social</button>
        <button type="button" role="menuitem" data-action="clear-cache"><i class="fas fa-broom"></i> Clear cache</button>
        <button type="button" role="menuitem" data-action="logout">Logout</button>
    `;
    (chip.parentElement || chip).appendChild(menu);
    return menu;
}

function closeUserMenu(options = {}) {
    const menu = document.getElementById('lux-user-menu');
    const chip = document.getElementById('lux-user-chip');
    const restoreTargetId = menu?.dataset.triggerId || chip?.id || '';
    const finishChip = () => {
        if (chip) chip.setAttribute('aria-expanded', 'false');
        if (options.restoreFocus) {
            restoreFocusById(restoreTargetId);
            deferRestoreFocusById(restoreTargetId);
        }
    };
    if (!menu) {
        finishChip();
        return Promise.resolve();
    }
    if (!menu.classList.contains('is-open') && !menu.classList.contains('is-closing')) {
        finalizeTopbarPopoverClose(menu);
        finishChip();
        return Promise.resolve();
    }
    return animateTopbarPopoverClose(menu, {
        onDeactivate: () => {
            if (chip) chip.setAttribute('aria-expanded', 'false');
        }
    }).then(() => {
        finishChip();
    });
}

function ensureShellPickerPanel(panelId) {
    const existing = document.getElementById(panelId);
    if (existing) {
        existing.classList.add('lux-universal-picker-panel', 'lux-droplist-panel');
        return existing;
    }
    const buttonId = panelId === 'lux-role-picker-panel' ? 'lux-role-picker-btn' : 'lux-faculty-picker-btn';
    const button = document.getElementById(buttonId);
    const wrapper = button?.closest('.lux-picker-wrap');
    if (!wrapper) return null;
    const panel = document.createElement('div');
    panel.className = 'lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll lux-droplist-panel';
    panel.id = panelId;
    panel.dataset.triggerId = buttonId;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', panelId === 'lux-role-picker-panel' ? 'Role switcher' : 'Faculty switcher');
    panel.tabIndex = -1;
    wrapper.appendChild(panel);
    return panel;
}

function toggleUtilityPanel(panelId, buttonId) {
    const button = document.getElementById(buttonId);
    const panel = ensureTopbarUtilityPanel(panelId);
    if (!panel || !button) return Promise.resolve();
    const shouldOpen = !panel.classList.contains('is-open') && !panel.classList.contains('is-closing');
    const runOpen = () => {
        // One sync render before bloom; async bridges refresh only if still open.
        renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
        panel.dataset.triggerId = buttonId;
        panel.setAttribute('aria-hidden', 'false');
        button.classList.add('is-active');
        button.setAttribute('aria-expanded', 'true');
        revealTopbarPopover(panel, () => {
            focusFirstInteractive(panel, '[data-utility-action], .lux-utility-item, button');
        });
        if (typeof bootstrapKiuRealtimeBridge === 'function') {
            bootstrapKiuRealtimeBridge(true).then(() => {
                if (!panel.classList.contains('is-open')) return;
                renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
                if (typeof syncTopbar === 'function') syncTopbar();
            }).catch(() => null);
        }
        if (typeof ensurePortalSocialRuntimeLoaded === 'function') {
            ensurePortalSocialRuntimeLoaded().then(() => {
                if (!panel.classList.contains('is-open')) return;
                renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
            });
        }
    };
    if (!shouldOpen) return closeUtilityPanels();
    const hasOpenUtility = Boolean(document.querySelector('.lux-utility-panel.is-open, .lux-utility-panel.is-closing'));
    if (!hasOpenUtility) {
        runOpen();
        return Promise.resolve();
    }
    return closeUtilityPanels().then(runOpen);
}

function openUserMenuAnimated(menu, chip) {
    if (!menu || !chip) return;
    menu.dataset.triggerId = 'lux-user-chip';
    menu.setAttribute('aria-hidden', 'false');
    chip.setAttribute('aria-expanded', 'true');
    revealTopbarPopover(menu, () => {
        focusFirstInteractive(menu, '[data-nav-target], [data-action]');
    });
}

function isPickerScrollExempt(panel, scrollTarget) {
    if (!panel || !scrollTarget) return false;
    if (scrollTarget === panel || panel.contains(scrollTarget)) return true;
    return Boolean(scrollTarget.closest?.('[data-lux-picker-scroll-exempt]'));
}

function isLuxPickerInteractionTarget(target, panel) {
    if (!target || !panel) return false;
    const triggerId = panel.dataset?.triggerId || '';
    const trigger = triggerId ? document.getElementById(triggerId) : null;
    if (target === panel || panel.contains(target)) return true;
    if (trigger && (target === trigger || trigger.contains(target))) return true;
    return false;
}

function isLuxUtilityInteractionTarget(target) {
    if (!target) return false;
    if (target.closest?.('.lux-utility-panel.is-open, .lux-utility-panel.is-closing')) return true;
    if (target.closest?.('.lux-utility-wrap')) return true;
    return false;
}

const pickerScrollTargetCache = new Map();

function clearPickerScrollTargetCache() {
    pickerScrollTargetCache.clear();
}

function collectPickerScrollTargets(button) {
    const cacheKey = button?.id || button?.dataset?.pickerTrigger || '';
    if (cacheKey && pickerScrollTargetCache.has(cacheKey)) {
        return pickerScrollTargetCache.get(cacheKey);
    }
    const targets = new Set();
    if (typeof window !== 'undefined') targets.add(window);
    if (typeof document !== 'undefined' && document.documentElement) targets.add(document.documentElement);
    let node = button?.parentElement;
    while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
            && node.scrollHeight > node.clientHeight) {
            targets.add(node);
        }
        node = node.parentElement;
    }
    const result = [...targets];
    if (cacheKey) pickerScrollTargetCache.set(cacheKey, result);
    return result;
}

function clearLuxPickerPanelListeners(panel) {
    if (!panel) return;
    if (panel._luxPickerScrollHandler) {
        const targets = panel._luxPickerScrollTargets || [window];
        targets.forEach((target) => {
            target.removeEventListener('scroll', panel._luxPickerScrollHandler, true);
        });
        panel._luxPickerScrollHandler = null;
        panel._luxPickerScrollTargets = null;
    }
    if (panel._luxPickerWheelHandler) {
        panel.removeEventListener('wheel', panel._luxPickerWheelHandler);
        panel._luxPickerWheelHandler = null;
    }
    if (panel._luxPickerWheelDismissHandler) {
        document.removeEventListener('wheel', panel._luxPickerWheelDismissHandler, true);
        panel._luxPickerWheelDismissHandler = null;
    }
}

const LUX_PICKER_CLOSE_FALLBACK_MS = 320;

function beginPickerChromeBusy() {
    if (typeof window.beginLuxAnimating === 'function') window.beginLuxAnimating();
    else {
        window.__luxPickerAnimatingCount = (window.__luxPickerAnimatingCount || 0) + 1;
        window.__luxIsAnimating = true;
    }
}

function endPickerChromeBusy() {
    if (typeof window.endLuxAnimating === 'function') window.endLuxAnimating();
    else {
        window.__luxPickerAnimatingCount = Math.max(0, (window.__luxPickerAnimatingCount || 0) - 1);
        window.__luxIsAnimating = (window.__luxPickerAnimatingCount || 0) > 0;
    }
}

/** Hold transparency suppress through bloom fade; clear on opacity transitionend or fallback. */
function releasePickerTransparencySuppress(panel) {
    const clear = () => {
        window.__kiuSuppressLuxTransparencyRefresh = false;
        endPickerChromeBusy();
    };
    if (!panel) {
        window.setTimeout(clear, LUX_PICKER_CLOSE_FALLBACK_MS);
        return;
    }
    let settled = false;
    const finish = () => {
        if (settled) return;
        settled = true;
        panel.removeEventListener('transitionend', onEnd);
        clear();
    };
    const onEnd = (event) => {
        if (event.target !== panel) return;
        if (event.propertyName !== 'opacity' && event.propertyName !== 'transform') return;
        finish();
    };
    panel.addEventListener('transitionend', onEnd);
    window.setTimeout(finish, LUX_PICKER_CLOSE_FALLBACK_MS);
}

function forcePickerReflow(panel) {
    if (!panel) return;
    if (panel.dataset.luxReflowPending === '1') return;
    panel.dataset.luxReflowPending = '1';
    requestAnimationFrame(() => {
        panel.dataset.luxReflowPending = '0';
        void panel.offsetHeight;
    });
}

function deactivatePickerTrigger(panel) {
    const triggerId = panel?.dataset?.triggerId || '';
    if (triggerId) {
        const button = document.getElementById(triggerId);
        if (button) {
            button.classList.remove('is-active');
            button.setAttribute('aria-expanded', 'false');
        }
    }
}

function finalizePickerPanelClose(panel) {
    if (!panel) return;
    clearLuxPickerPanelListeners(panel);
    panel.classList.remove('is-closing', 'is-open', 'is-open-above', 'ex2-picker-panel');
    panel.style.removeProperty('--lux-picker-anchor-transform');
    panel.style.removeProperty('transform');
    panel.style.removeProperty('will-change');
    panel.style.removeProperty('max-height');
    panel.style.removeProperty('right');
    panel.style.removeProperty('bottom');
    panel.setAttribute('aria-hidden', 'true');
    restoreTeleportedNode(panel);
}

function animatePickerPanelClose(panel) {
    if (!panel) return Promise.resolve();
    if (panel.classList.contains('is-closing') && !panel.classList.contains('is-open')) {
        finalizePickerPanelClose(panel);
        return Promise.resolve();
    }
    if (!panel.classList.contains('is-open')) {
        finalizePickerPanelClose(panel);
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            panel.removeEventListener('transitionend', onEnd);
            finalizePickerPanelClose(panel);
            resolve();
        };
        const onEnd = (event) => {
            if (event.target !== panel || event.propertyName !== 'opacity') return;
            finish();
        };
        deactivatePickerTrigger(panel);
        panel.classList.remove('is-open');
        panel.classList.add('is-closing');
        forcePickerReflow(panel);
        panel.addEventListener('transitionend', onEnd);
        window.setTimeout(finish, LUX_PICKER_CLOSE_FALLBACK_MS);
    });
}

function closePickerPanel(panel, options = {}) {
    if (!panel) return Promise.resolve();
    if (options.immediate) {
        deactivatePickerTrigger(panel);
        finalizePickerPanelClose(panel);
        return Promise.resolve();
    }
    return animatePickerPanelClose(panel);
}

function applyLuxPickerPanelVariants(panel, button) {
    if (!panel) return;
    panel.classList.add('lux-universal-picker-panel', 'lux-droplist-panel');
    if (button?.closest?.('#admin-exams-root')) {
        panel.classList.add('ex2-picker-panel');
    }
    if (button?.closest?.('.lux-glass-dialog-backdrop, #social-neo-overlay-portal')) {
        panel.classList.add('lux-glass-dialog-picker-panel');
    } else {
        panel.classList.remove('lux-glass-dialog-picker-panel');
    }
}

function closePickerPanels(options = {}) {
    const openPanels = Array.from(document.querySelectorAll('.lux-picker-panel.is-open'));
    // Nothing to close: never arm the transparency suppress flag. Boot sync and the
    // global document-click dismisser both call this with zero open panels; arming
    // suppress here would swallow the very next queued transparency/blur refresh
    // (e.g. a Glass Blur quality change) for LUX_PICKER_CLOSE_FALLBACK_MS.
    if (!openPanels.length && !document.querySelector('.lux-picker-btn.is-active')) {
        return Promise.resolve();
    }
    window.__kiuSuppressLuxTransparencyRefresh = true;
    beginPickerChromeBusy();
    const restoreTargetId = options.restoreFocus ? (openPanels[0]?.dataset.triggerId || '') : '';
    const closePromise = openPanels.length
        ? Promise.all(openPanels.map((panel) => closePickerPanel(panel, options)))
        : Promise.resolve();
    return closePromise.then(() => {
        document.querySelectorAll('.lux-picker-btn.is-active').forEach((button) => {
            button.classList.remove('is-active');
            button.setAttribute('aria-expanded', 'false');
        });
        if (restoreTargetId) deferRestoreFocusById(restoreTargetId);
        // Hold suppress through close bloom; clear after fallback (panels already finalized).
        window.setTimeout(() => {
            window.__kiuSuppressLuxTransparencyRefresh = false;
            endPickerChromeBusy();
        }, LUX_PICKER_CLOSE_FALLBACK_MS);
    });
}

function resolveLuxPickerPanelHeightCap(panel) {
    if (!panel?.classList?.contains('lux-picker-panel') || typeof window === 'undefined') return null;
    const rootStyle = window.getComputedStyle(document.documentElement);
    const usesDroplist = panel.classList.contains('lux-droplist-panel');
    const optionHeight = parseFloat(rootStyle.getPropertyValue(usesDroplist ? '--lux-droplist-option-height' : '--lux-picker-option-height'));
    const visibleOptions = parseFloat(rootStyle.getPropertyValue(usesDroplist ? '--lux-droplist-visible-options' : '--lux-picker-visible-options'));
    const gap = parseFloat(rootStyle.getPropertyValue(usesDroplist ? '--lux-droplist-shell-gap' : '--lux-picker-panel-gap'));
    const pad = parseFloat(rootStyle.getPropertyValue(usesDroplist ? '--lux-droplist-shell-pad' : '--lux-picker-panel-pad'));
    if (!Number.isFinite(optionHeight) || !Number.isFinite(visibleOptions) || visibleOptions <= 0) return null;
    const gapVal = Number.isFinite(gap) ? gap : (usesDroplist ? 6 : 8);
    const shellPad = usesDroplist
        ? (Number.isFinite(pad) ? pad * 2 : 24)
        : (Number.isFinite(pad) ? pad : 20);
    const height = optionHeight * visibleOptions + gapVal * Math.max(0, visibleOptions - 1) + shellPad;
    return height > 0 ? height : null;
}

function capLuxFloatingPanelMaxHeight(panel, viewportMaxHeight) {
    const available = Math.max(0, Number(viewportMaxHeight) || 0);
    const cssCap = resolveLuxPickerPanelHeightCap(panel);
    if (cssCap == null) return available;
    return Math.min(available, cssCap);
}

function resolveLuxFloatingPanelPlacement({
    rect,
    viewportWidth,
    viewportHeight,
    preferredWidth = 320,
    minWidth = 200,
    measuredHeight = 0,
    estimatedHeight = 320,
    gap = 8,
    margin = 16,
    scrollX = 0,
    scrollY = 0
} = {}) {
    const safeViewportWidth = Math.max(0, Number(viewportWidth) || 0);
    const safeViewportHeight = Math.max(0, Number(viewportHeight) || 0);
    const safeMargin = Math.max(0, Number(margin) || 0);
    const safeGap = Math.max(0, Number(gap) || 0);
    const preferred = Math.max(0, Number(preferredWidth) || 320);
    const floorWidth = Math.min(
        preferred,
        Math.max(0, Number(minWidth) || 0),
        Math.max(0, safeViewportWidth - safeMargin * 2)
    );
    // Tiny screens: never exceed viewport. Otherwise keep preferred until an edge forces flip/shrink.
    const viewportCap = Math.max(0, safeViewportWidth - safeMargin * 2);
    let panelWidth = Math.min(preferred, viewportCap);
    let left = rect.left;

    if (rect.left + panelWidth <= safeViewportWidth - safeMargin) {
        // Happy path: full width, left-aligned to trigger.
        left = rect.left;
    } else if (rect.right - panelWidth >= safeMargin) {
        // Flip leftward into free space: right-align to trigger, keep full width.
        left = rect.right - panelWidth;
    } else {
        // Neither full alignment fits — shrink on the roomier side.
        const spaceRight = safeViewportWidth - safeMargin - rect.left;
        const spaceLeft = rect.right - safeMargin;
        if (spaceRight >= spaceLeft) {
            panelWidth = Math.max(floorWidth, Math.min(panelWidth, Math.max(0, spaceRight)));
            left = rect.left;
        } else {
            panelWidth = Math.max(floorWidth, Math.min(panelWidth, Math.max(0, spaceLeft)));
            panelWidth = Math.min(panelWidth, viewportCap);
            left = rect.right - panelWidth;
        }
    }

    // Extreme left overflow (rare): shrink while right-aligning to the trigger.
    if (left < safeMargin) {
        const widthFromRight = Math.max(0, rect.right - safeMargin);
        panelWidth = Math.max(floorWidth, Math.min(panelWidth, widthFromRight, viewportCap));
        left = rect.right - panelWidth;
    }

    const maxLeft = Math.max(safeMargin, safeViewportWidth - panelWidth - safeMargin);
    left = Math.min(Math.max(left, safeMargin), maxLeft) + scrollX;

    const spaceBelow = safeViewportHeight - rect.bottom - safeGap;
    const spaceAbove = rect.top - safeGap;
    const neededHeight = measuredHeight > 0
        ? measuredHeight
        : Math.max(0, Number(estimatedHeight) || 0);
    const openAbove = spaceBelow < neededHeight && spaceAbove > spaceBelow;
    const available = Math.max(0, openAbove ? spaceAbove : spaceBelow);
    const maxHeight = available;
    const top = openAbove
        ? rect.top + scrollY - safeGap
        : rect.bottom + scrollY + safeGap;

    return {
        openAbove,
        top,
        left,
        width: panelWidth,
        maxHeight
    };
}

function placeLuxFloatingPanel({
    trigger,
    panel,
    gap = 8,
    margin = 16,
    preferredWidth = 320,
    minWidth = 200,
    estimatedHeight = 320,
    fastPlace = false,
    rect: rectOverride = null
} = {}) {
    if (!trigger || !panel) return null;
    const rect = rectOverride || trigger.getBoundingClientRect();
    const viewportWidth = Math.max(
        0,
        Number(document.documentElement?.clientWidth) || Number(window.innerWidth) || 0
    );
    const viewportHeight = Math.max(
        0,
        Number(document.documentElement?.clientHeight) || Number(window.innerHeight) || 0
    );
    // Glow/frame paint extends past the layout box — keep clear of the page border.
    const paintPad = Math.max(margin, 28);
    // Fixed + viewport coords: escape body/html overflow-x clipping of absolute paint.
    panel.classList.remove('is-closing', 'is-open');
    panel.style.removeProperty('transform');
    panel.style.position = 'fixed';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.width = `${Math.min(preferredWidth, Math.max(0, viewportWidth - paintPad * 2))}px`;
    // Fast open: skip scrollHeight measure on the click frame (polish later).
    const measuredHeight = fastPlace
        ? 0
        : Math.max(panel.offsetHeight || 0, panel.scrollHeight || 0);
    const placement = resolveLuxFloatingPanelPlacement({
        rect,
        viewportWidth,
        viewportHeight,
        preferredWidth,
        minWidth,
        measuredHeight,
        estimatedHeight,
        gap,
        margin,
        scrollX: 0,
        scrollY: 0
    });
    if (placement.openAbove) {
        panel.classList.add('is-open-above');
        panel.style.setProperty('--lux-picker-anchor-transform', 'translateY(-100%)');
    } else {
        panel.classList.remove('is-open-above');
        panel.style.setProperty('--lux-picker-anchor-transform', 'translateY(0)');
    }
    panel.style.top = `${placement.top}px`;
    panel.style.left = `${placement.left}px`;
    panel.style.width = `${placement.width}px`;
    panel.style.maxHeight = `${capLuxFloatingPanelMaxHeight(panel, placement.maxHeight)}px`;

    if (!fastPlace) {
        polishLuxFloatingPanelClamp(panel, placement, {
            viewportWidth,
            paintPad,
            minWidth
        });
    }

    panel.style.zIndex = '999999';
    return placement;
}

/** Post-open adaptive shrink from painted box vs page border (deferred off click frame). */
function polishLuxFloatingPanelClamp(panel, placement, {
    viewportWidth = 0,
    paintPad = 28,
    minWidth = 200
} = {}) {
    if (!panel || !placement) return placement;
    let box = panel.getBoundingClientRect();
    if (box.width > 0 || box.height > 0) {
        const maxRight = viewportWidth - paintPad;
        if (box.right > maxRight) {
            const nextWidth = Math.max(minWidth, placement.width - (box.right - maxRight));
            panel.style.width = `${nextWidth}px`;
            placement.width = nextWidth;
            box = panel.getBoundingClientRect();
        }
        if (box.left < paintPad) {
            panel.style.left = `${paintPad}px`;
            placement.left = paintPad;
            box = panel.getBoundingClientRect();
            if (box.right > maxRight) {
                const nextWidth = Math.max(minWidth, placement.width - (box.right - maxRight));
                panel.style.width = `${nextWidth}px`;
                placement.width = nextWidth;
            }
        }
    }
    return placement;
}

function openPickerPanel(panel, button, buttonId) {
    if (typeof ensureLuxDroplistCss === 'function') ensureLuxDroplistCss();
    const triggerButton = button || (buttonId ? document.getElementById(buttonId) : null);
    if (!panel || !triggerButton) return;
    window.__kiuSuppressLuxTransparencyRefresh = true;
    beginPickerChromeBusy();
    applyLuxPickerPanelVariants(panel, triggerButton);
    const triggerRect = triggerButton.getBoundingClientRect();
    const wrapper = panel.parentElement;
    if (wrapper && wrapper.tagName !== 'BODY') {
        if (!wrapper.id) wrapper.id = `lux-wrap-${Math.random().toString(36).substr(2, 9)}`;
        panel.dataset.originalParentId = wrapper.id;
        panel.dataset.teleported = 'true';
        document.body.appendChild(panel);
    }
    const inExamsRoot = Boolean(triggerButton.closest('#admin-exams-root'));
    const estimatedHeight = inExamsRoot
        ? Math.min(280, window.innerHeight * 0.5)
        : Math.min(320, window.innerHeight * 0.6);
    const margin = 16;
    const preferredWidth = 320;
    const minWidth = 200;
    const placement = placeLuxFloatingPanel({
        trigger: triggerButton,
        panel,
        gap: 8,
        margin,
        preferredWidth,
        minWidth,
        estimatedHeight,
        fastPlace: true,
        rect: triggerRect
    });
    // Prep compositor + reveal on the click turn — first paint is open.
    panel.style.willChange = 'opacity, transform';
    panel.dataset.triggerId = buttonId;
    panel.setAttribute('aria-hidden', 'false');
    triggerButton.classList.add('is-active');
    triggerButton.setAttribute('aria-expanded', 'true');
    resetLuxPickerPanelSearch(panel);
    panel.classList.add('is-open');

    const polishAndFinishChrome = () => {
        if (!panel.classList.contains('is-open')) {
            releasePickerTransparencySuppress(panel);
            return;
        }
        const viewportWidth = Math.max(
            0,
            Number(document.documentElement?.clientWidth) || Number(window.innerWidth) || 0
        );
        const viewportHeight = Math.max(
            0,
            Number(document.documentElement?.clientHeight) || Number(window.innerHeight) || 0
        );
        const paintPad = Math.max(margin, 28);
        // Height truth + adaptive clamp after first open paint.
        const measuredHeight = Math.max(panel.offsetHeight || 0, panel.scrollHeight || 0);
        const refined = resolveLuxFloatingPanelPlacement({
            rect: triggerRect,
            viewportWidth,
            viewportHeight,
            preferredWidth,
            minWidth,
            measuredHeight,
            estimatedHeight,
            gap: 8,
            margin,
            scrollX: 0,
            scrollY: 0
        });
        if (refined.openAbove) {
            panel.classList.add('is-open-above');
            panel.style.setProperty('--lux-picker-anchor-transform', 'translateY(-100%)');
        } else {
            panel.classList.remove('is-open-above');
            panel.style.setProperty('--lux-picker-anchor-transform', 'translateY(0)');
        }
        panel.style.top = `${refined.top}px`;
        panel.style.left = `${refined.left}px`;
        panel.style.width = `${refined.width}px`;
        panel.style.maxHeight = `${capLuxFloatingPanelMaxHeight(panel, refined.maxHeight)}px`;
        polishLuxFloatingPanelClamp(panel, refined, { viewportWidth, paintPad, minWidth });
        if (placement) Object.assign(placement, refined);

        const searchInput = panel.querySelector('.lux-picker-search-input');
        if (searchInput) {
            searchInput.focus();
            if (typeof searchInput.select === 'function') searchInput.select();
        } else {
            focusFirstInteractive(panel, '.lux-picker-option.is-active, .lux-picker-option');
        }
        clearLuxPickerPanelListeners(panel);
        const scrollHandler = (event) => {
            if (isPickerScrollExempt(panel, event.target)) return;
            closePickerPanels({ immediate: true });
        };
        const scrollTargets = collectPickerScrollTargets(triggerButton);
        panel._luxPickerScrollHandler = scrollHandler;
        panel._luxPickerScrollTargets = scrollTargets;
        scrollTargets.forEach((target) => {
            target.addEventListener('scroll', scrollHandler, true);
        });
        const wheelDismissHandler = (event) => {
            if (isLuxPickerInteractionTarget(event.target, panel)) return;
            closePickerPanels({ immediate: true });
        };
        panel._luxPickerWheelDismissHandler = wheelDismissHandler;
        document.addEventListener('wheel', wheelDismissHandler, { capture: true, passive: true });
        const wheelHandler = (event) => {
            event.stopPropagation();
        };
        panel._luxPickerWheelHandler = wheelHandler;
        panel.addEventListener('wheel', wheelHandler, { passive: true });
        releasePickerTransparencySuppress(panel);
    };
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(polishAndFinishChrome);
    } else {
        polishAndFinishChrome();
    }
}

function dismissOpenLuxPickerPanels() {
    if (!document.querySelector('.lux-picker-panel.is-open')) return;
    closePickerPanels({ immediate: true });
}

function bindLuxPickerDismissHandlers() {
    if (document.body?.dataset?.luxPickerDismissBound === '1') return;
    if (!document.body) return;
    document.body.dataset.luxPickerDismissBound = '1';
    document.addEventListener('pointerdown', (event) => {
        const openPanels = Array.from(document.querySelectorAll('.lux-picker-panel.is-open'));
        if (!openPanels.length) return;
        const insideOpenPicker = openPanels.some((panel) => isLuxPickerInteractionTarget(event.target, panel));
        if (insideOpenPicker) return;
        closePickerPanels({ immediate: true });
    }, true);
    if (typeof window !== 'undefined') {
        const onViewportChange = () => {
            clearPickerScrollTargetCache();
            dismissOpenLuxPickerPanels();
        };
        window.addEventListener('resize', onViewportChange, { passive: true });
        window.addEventListener('orientationchange', onViewportChange, { passive: true });
    }
}

function togglePickerPanel(panelId, buttonId) {
    const panel = panelId === 'lux-faculty-picker-panel' || panelId === 'lux-role-picker-panel'
        ? ensureShellPickerPanel(panelId)
        : document.getElementById(panelId);
    const button = document.getElementById(buttonId);
    if (!panel || !button) return;
    const shouldOpen = !panel.classList.contains('is-open') && !panel.classList.contains('is-closing');
    const hasOpenPanels = document.querySelectorAll('.lux-picker-panel.is-open').length > 0;
    if (shouldOpen && !hasOpenPanels) {
        openPickerPanel(panel, button, buttonId);
        return;
    }
    if (shouldOpen && hasOpenPanels) {
        const openPanels = Array.from(document.querySelectorAll('.lux-picker-panel.is-open'));
        const otherPanels = openPanels.filter((openPanel) => openPanel.id !== panelId);
        if (otherPanels.length) {
            Promise.all(otherPanels.map((openPanel) => animatePickerPanelClose(openPanel)));
            openPickerPanel(panel, button, buttonId);
            return;
        }
    }
    closePickerPanels().then(() => {
        if (!shouldOpen) return;
        openPickerPanel(panel, button, buttonId);
    });
}

window.closePickerPanels = closePickerPanels;
window.togglePickerPanel = togglePickerPanel;

function openRoleSwitcherPanel() {
    if (typeof window.isAuthenticatedAdminForRolePicker === 'function' && !window.isAuthenticatedAdminForRolePicker()) return false;
    const roleButton = document.getElementById('lux-role-picker-btn');
    const rolePanel = ensureShellPickerPanel('lux-role-picker-panel');
    if (!roleButton || !rolePanel) return false;
    closeStudio();
    closeUtilityPanels();
    closeUserMenu();
    populateRoleSwitcher({ ensurePanel: true });
    togglePickerPanel('lux-role-picker-panel', 'lux-role-picker-btn');
    return rolePanel.classList.contains('is-open');
}

window.openRoleSwitcherPanel = openRoleSwitcherPanel;

function normalizePickerLabel(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCleanPickerLabelText(node) {
    if (!node) return '';
    const clone = node.cloneNode(true);
    clone.querySelectorAll([
        'select',
        'option',
        'button',
        'input',
        'textarea',
        'i',
        'svg',
        '.lux-picker-field',
        '.lux-picker-panel',
        '.lux-picker-copy',
        '.lux-picker-caption',
        '.lux-picker-value',
        '.lux-picker-option',
        '[data-lux-picker-enhanced]'
    ].join(',')).forEach((child) => child.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
}

function isExternalPickerLabelNode(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.classList?.contains('lux-picker-label')) return false;
    if (/^label$/i.test(node.tagName)) return true;
    return node.classList?.contains('em-lbl')
        || node.classList?.contains('pvsm-lbl')
        || node.classList?.contains('peg-lbl');
}

function resolveExternalPickerLabel(select) {
    if (!select) return null;
    if (select.id) {
        const escapedId = window.CSS && typeof window.CSS.escape === 'function'
            ? window.CSS.escape(select.id)
            : String(select.id).replace(/"/g, '\\"');
        const associated = document.querySelector(`label[for="${escapedId}"]`);
        if (isExternalPickerLabelNode(associated)) return associated;
    }
    const previous = select.previousElementSibling;
    if (isExternalPickerLabelNode(previous)) return previous;
    const parentLabel = select.closest('label');
    if (parentLabel && !parentLabel.classList?.contains('lux-picker-label')) return parentLabel;
    const parent = select.parentElement;
    if (parent) {
        const labelNode = parent.querySelector('label');
        if (isExternalPickerLabelNode(labelNode)) return labelNode;
    }
    const fieldShell = select.closest('.sch-input-group, .sch-control-group, .lux-program-field, .lux-picker-field');
    if (fieldShell) {
        const captionLabel = fieldShell.querySelector(':scope > .lux-picker-label');
        if (captionLabel) {
            if (!captionLabel.id && select.id) captionLabel.id = `${select.id}-field-label`;
            return captionLabel;
        }
        if (fieldShell.matches('label')) return fieldShell;
        const nestedLabel = fieldShell.querySelector('.sch-input-label-row label, :scope > label');
        if (isExternalPickerLabelNode(nestedLabel)) return nestedLabel;
    }
    return null;
}

function wirePickerButtonAriaLabel(button, externalLabel, select) {
    if (!button || !externalLabel) return;
    let labelId = externalLabel.id;
    if (!labelId && select?.id) {
        labelId = `${select.id}-field-label`;
        externalLabel.id = labelId;
    }
    if (labelId) button.setAttribute('aria-labelledby', labelId);
}

function inferPickerCaption(select) {
    if (!select) return 'Select';
    const explicit = select.getAttribute('aria-label') || select.dataset.luxPickerLabel || select.getAttribute('title');
    if (explicit) return String(explicit).trim();
    const externalLabel = resolveExternalPickerLabel(select);
    if (externalLabel) {
        const text = getCleanPickerLabelText(externalLabel);
        if (text) return text;
    }
    return normalizePickerLabel(select.name || select.id || 'Select');
}

function normalizePickerSearchQuery(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isLuxPickerSearchEnabled(select) {
    if (!select) return false;
    const flag = select.getAttribute('data-lux-picker-search') ?? select.dataset.luxPickerSearch ?? '';
    return flag === 'true' || flag === '1';
}

function getLuxPickerOptionSearchHaystack(option) {
    if (!option) return '';
    const explicit = option.getAttribute('data-lux-picker-search-text') || option.dataset?.luxPickerSearchText || '';
    const parts = [explicit, option.label || '', option.textContent || '', option.value || ''];
    return normalizePickerSearchQuery(parts.join(' '));
}

function filterLuxPickerPanelOptions(panel, query) {
    if (!panel) return;
    const normalized = normalizePickerSearchQuery(query);
    const optionsHost = panel.querySelector('.lux-picker-options') || panel;
    const buttons = optionsHost.querySelectorAll('.lux-picker-option[data-picker-value]');
    let visible = 0;
    buttons.forEach((btn) => {
        const haystack = btn.getAttribute('data-picker-search-text') || btn.dataset.pickerSearchText || '';
        const match = !normalized || haystack.includes(normalized);
        btn.hidden = !match;
        if (match) visible += 1;
    });
    const empty = panel.querySelector('.lux-picker-empty');
    if (empty) empty.hidden = visible > 0;
}

function resetLuxPickerPanelSearch(panel) {
    if (!panel) return;
    const input = panel.querySelector('.lux-picker-search-input');
    if (input) input.value = '';
    filterLuxPickerPanelOptions(panel, '');
}

function wireLuxPickerPanelSearch(panel) {
    if (!panel || panel._luxPickerSearchBound) return;
    panel._luxPickerSearchBound = true;
    panel.addEventListener('input', (event) => {
        const input = event.target?.closest?.('.lux-picker-search-input');
        if (!input || !panel.contains(input)) return;
        event.stopPropagation();
        filterLuxPickerPanelOptions(panel, input.value);
    });
    panel.addEventListener('click', (event) => {
        if (event.target?.closest?.('.lux-picker-search-input')) event.stopPropagation();
    });
    panel.addEventListener('keydown', (event) => {
        if (!event.target?.matches?.('.lux-picker-search-input')) return;
        if (event.key === 'Escape') {
            event.stopPropagation();
            closePickerPanels({ restoreFocus: true });
        }
    });
}

function renderLuxPickerOptionButton(option, currentValue, caption) {
    if (option.disabled && !option.selected) return '';
    const active = String(option.value) === String(currentValue);
    const title = option.label || option.textContent || option.value || caption;
    const subtitle = option.getAttribute('data-lux-picker-subtitle') || option.dataset?.luxPickerSubtitle || '';
    const searchHaystack = getLuxPickerOptionSearchHaystack(option);
    return `
        <button class="lux-picker-option${active ? ' is-active' : ''}" type="button" role="option" aria-selected="${active ? 'true' : 'false'}" data-picker-value="${escapeHtml(option.value)}" data-picker-title="${escapeHtml(title)}" data-picker-search-text="${escapeHtml(searchHaystack)}">
            <strong>${escapeHtml(title)}</strong>${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ''}
        </button>
    `;
}

function bindLuxPickerOptionButtons(select, panel, button) {
    panel.querySelectorAll('[data-picker-value]').forEach((optionButton) => {
        optionButton.addEventListener('click', () => {
            const nextValue = optionButton.dataset.pickerValue || '';
            const prevValue = select.value;
            select.value = nextValue;
            syncUniversalPicker(select, button, panel);
            if (button) button.setAttribute('aria-expanded', 'false');
            closePickerPanels();
            const allowReselect = select.hasAttribute('data-news-feed-filter');
            if (prevValue !== nextValue || allowReselect) {
                // Native <select> fires input then change on user choice; emulate both
                // so `input`-bound handlers (e.g. live priority-mode preview) react.
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}

function buildUniversalPickerPanel(select, panel, button) {
    if (!panel || !select) return;
    const caption = inferPickerCaption(select);
    const currentValue = select.value;
    const options = Array.from(select.options || []);
    const optionsMarkup = options.map((option) => renderLuxPickerOptionButton(option, currentValue, caption)).join('');
    const searchable = isLuxPickerSearchEnabled(select) && options.length >= 6;
    if (searchable) {
        const placeholder = String(
            select.getAttribute('data-lux-picker-search-placeholder')
            || select.dataset.luxPickerSearchPlaceholder
            || 'Search...'
        ).trim() || 'Search...';
        panel.classList.add('lux-picker-panel--searchable');
        panel.innerHTML = `
            <div class="lux-picker-search-wrap">
                <input type="search" class="lux-picker-search-input" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false" aria-label="Search ${escapeHtml(caption)}">
            </div>
            <div class="lux-picker-options lux-picker-panel-scrollport">${optionsMarkup}</div>
            <div class="lux-picker-empty" hidden>No matches</div>
        `;
    } else {
        panel.classList.remove('lux-picker-panel--searchable');
        panel.innerHTML = `<div class="lux-picker-panel-scrollport">${optionsMarkup}</div>`;
    }
    bindLuxPickerOptionButtons(select, panel, button);
}

function syncUniversalPicker(select, button, panel) {
    if (!select || !button || !panel) return;
    const selected = select.selectedOptions?.[0] || select.options?.[select.selectedIndex] || null;
    const caption = inferPickerCaption(select);
    const valueNode = button.querySelector('.lux-picker-value');
    if (valueNode) valueNode.textContent = selected ? (selected.label || selected.textContent || selected.value || caption) : caption;
    button.setAttribute('aria-expanded', panel.classList.contains('is-open') ? 'true' : 'false');
}

function shouldEnhanceSelect(select) {
    if (!select || select.dataset.luxPickerEnhanced === 'true') return false;
    if (select.disabled || select.getAttribute('aria-disabled') === 'true') return false;
    if (select.matches('[multiple], [data-lux-native], .library-hidden-select, .lux-filter-hidden-select')) return false;
    if (select.closest('#lux-topbar')) return false;
    const pickerField = select.closest('.lux-picker-field');
    if (pickerField?.querySelector('.lux-picker-btn')) return false;
    if (select.closest('body.lux-route-lms, #page-lms, #page-lms-groups, #page-lms-inner, #lms-content-area')) return false;
    if (select.closest('#public-social-root, #social-neo-root, .social-neo, #social-neo-overlay-portal') && !select.matches('[data-lux-picker]')) return false;
    return true;
}

function resolvePickerTriggerClass() {
    return 'lux-picker-btn lux-universal-picker-btn lux-picker-btn--compact';
}

function enhanceUniversalPicker(select) {
    if (!shouldEnhanceSelect(select)) return;
    const parent = select.parentElement;
    if (!parent) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'lux-picker-field lux-universal-picker-field';
    const panelId = select.id ? `${select.id}-lux-panel` : `lux-picker-panel-${Math.random().toString(36).slice(2, 10)}`;
    const buttonId = select.id ? `${select.id}-lux-btn` : `lux-picker-btn-${Math.random().toString(36).slice(2, 10)}`;
    const externalLabel = resolveExternalPickerLabel(select);
    const caption = inferPickerCaption(select);
    select.dataset.luxPickerLabel = caption;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = resolvePickerTriggerClass(select);
    button.id = buttonId;
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('data-lux-skip-modern-button', 'true');
    button.innerHTML = `
        <div class="lux-picker-copy">
            <strong class="lux-picker-value"></strong>
        </div>
        <i class="fas fa-chevron-down"></i>
    `;
    if (externalLabel) {
        wirePickerButtonAriaLabel(button, externalLabel, select);
    } else {
        button.setAttribute('aria-label', caption);
    }

    const panel = document.createElement('div');
    panel.className = 'lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll';
    panel.id = panelId;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-hidden', 'true');
    panel.tabIndex = -1;
    wireLuxPickerPanelSearch(panel);
    applyLuxPickerPanelVariants(panel, button);

    wrapper.appendChild(button);
    wrapper.appendChild(panel);
    parent.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    select.classList.add('lux-universal-native-select');
    select.dataset.luxPickerEnhanced = 'true';
    select.setAttribute('data-lux-picker-enhanced', 'true');

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePickerPanel(panelId, buttonId);
    });

    select.addEventListener('change', () => {
        buildUniversalPickerPanel(select, panel, button);
        syncUniversalPicker(select, button, panel);
    });

    if (window.MutationObserver) {
        const observer = new MutationObserver(() => {
            if (!document.contains(select)) {
                observer.disconnect();
                return;
            }
            buildUniversalPickerPanel(select, panel, button);
            syncUniversalPicker(select, button, panel);
        });
        observer.observe(select, { childList: true, subtree: true });
        select._luxPickerObserver = observer;
    }

    buildUniversalPickerPanel(select, panel, button);
    syncUniversalPicker(select, button, panel);
}

function enhanceUniversalPickers(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('select').forEach((select) => enhanceUniversalPicker(select));
}

function observeUniversalPickers() {
    if (window.__luxUniversalPickerObserver || !window.MutationObserver || !document.body) return;
    let pickerTimer = null;
    let pendingNodes = [];
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
                if (!node || node.nodeType !== 1) return;
                pendingNodes.push(node);
            });
        }
        if (!pickerTimer) {
            pickerTimer = setTimeout(() => {
                pickerTimer = null;
                const nodes = pendingNodes.splice(0);
                nodes.forEach((node) => {
                    if (node.tagName === 'SELECT') {
                        enhanceUniversalPicker(node);
                        return;
                    }
                    enhanceUniversalPickers(node);
                });
            }, 200);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__luxUniversalPickerObserver = observer;
    window.__luxUniversalPickerObserversPaused = false;
}

function pauseLuxuryPickerObservers() {
    window.__luxUniversalPickerObserversPaused = true;
    if (window.__luxUniversalPickerObserver) {
        window.__luxUniversalPickerObserver.disconnect();
        window.__luxUniversalPickerObserver = null;
    }
}

function resumeLuxuryPickerObservers() {
    window.__luxUniversalPickerObserversPaused = false;
    observeUniversalPickers();
}

        const api = {
            closeUtilityPanels,
            ensureTopbarUtilityPanel,
            ensureUserMenu,
            closeUserMenu,
            openUserMenuAnimated,
            ensureShellPickerPanel,
            toggleUtilityPanel,
            revealTopbarPopover,
            animateTopbarPopoverClose,
            finalizeTopbarPopoverClose,
            isPickerScrollExempt,
            isLuxPickerInteractionTarget,
            isLuxUtilityInteractionTarget,
            clearPickerScrollTargetCache,
            collectPickerScrollTargets,
            clearLuxPickerPanelListeners,
            forcePickerReflow,
            deactivatePickerTrigger,
            finalizePickerPanelClose,
            animatePickerPanelClose,
            closePickerPanel,
            applyLuxPickerPanelVariants,
            closePickerPanels,
            resolveLuxFloatingPanelPlacement,
            placeLuxFloatingPanel,
            polishLuxFloatingPanelClamp,
            openPickerPanel,
            dismissOpenLuxPickerPanels,
            bindLuxPickerDismissHandlers,
            togglePickerPanel,
            openRoleSwitcherPanel,
            normalizePickerLabel,
            getCleanPickerLabelText,
            isExternalPickerLabelNode,
            resolveExternalPickerLabel,
            wirePickerButtonAriaLabel,
            inferPickerCaption,
            normalizePickerSearchQuery,
            isLuxPickerSearchEnabled,
            getLuxPickerOptionSearchHaystack,
            filterLuxPickerPanelOptions,
            resetLuxPickerPanelSearch,
            wireLuxPickerPanelSearch,
            renderLuxPickerOptionButton,
            bindLuxPickerOptionButtons,
            buildUniversalPickerPanel,
            syncUniversalPicker,
            shouldEnhanceSelect,
            enhanceUniversalPicker,
            enhanceUniversalPickers,
            observeUniversalPickers,
            pauseLuxuryPickerObservers,
            resumeLuxuryPickerObservers,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLuxuryShellPickerApi({});
})();
