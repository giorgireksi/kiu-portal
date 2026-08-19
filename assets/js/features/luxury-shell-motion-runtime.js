/* Shell chrome motion compatibility runtime.
 * Sidebar open/close is CSS-only; hover work only pulses the lightweight
 * particle busy flag. No shell-wide blur or staged navigation animation. */
(function initLuxuryShellMotionRuntime() {
    if (window.__KIU_LUXURY_SHELL_MOTION_LOADED) return;
    window.__KIU_LUXURY_SHELL_MOTION_LOADED = true;

    const MOTION_CLASS = 'lux-shell-chrome-motion';
    const HOVER_BUSY_MS = 160;
    /* Longest chrome motion is 420ms; anything still held after this is a lost
     * end* pairing, and holding it would freeze the render governor (and with it
     * every deferred transparency/blur refresh) for the rest of the session. */
    const MOTION_WATCHDOG_MS = 1200;

    let motionRefCount = 0;
    let motionDeadline = 0;
    let motionTimer = null;
    let motionWatchdogTimer = null;
    let bound = false;
    let hoverBusyUntil = 0;
    let hoverBusyTimer = null;
    let shellInteractionBusyUntil = 0;
    let shellInteractionBusyTimer = null;

    function syncMotionClass() {
        const root = document.documentElement;
        if (!root) return;
        const wasMotionClass = root.classList.contains(MOTION_CLASS);
        const active = motionRefCount > 0 || performance.now() < motionDeadline;
        root.classList.toggle(MOTION_CLASS, active);
        if (wasMotionClass !== active && typeof window.notifyLuxGovernorStateChange === 'function') {
            window.notifyLuxGovernorStateChange();
        }
        syncLuxIsAnimatingFlag();
    }

    function syncLuxIsAnimatingFlag() {
        const motionActive = motionRefCount > 0 || performance.now() < motionDeadline;
        const pickerActive = (window.__luxPickerAnimatingCount || 0) > 0;
        const wasAnimating = window.__luxIsAnimating === true;
        window.__luxIsAnimating = motionActive || pickerActive;
        if (wasAnimating !== window.__luxIsAnimating && typeof window.notifyLuxGovernorStateChange === 'function') {
            window.notifyLuxGovernorStateChange();
        }
    }

    function beginLuxAnimating() {
        window.__luxPickerAnimatingCount = (window.__luxPickerAnimatingCount || 0) + 1;
        syncLuxIsAnimatingFlag();
    }

    function endLuxAnimating() {
        window.__luxPickerAnimatingCount = Math.max(0, (window.__luxPickerAnimatingCount || 0) - 1);
        syncLuxIsAnimatingFlag();
    }

    function scheduleMotionDeadlineCheck() {
        if (motionTimer) window.clearTimeout(motionTimer);
        const remaining = motionDeadline - performance.now();
        if (remaining <= 0) {
            motionDeadline = 0;
            syncMotionClass();
            refreshTransparencyAfterMotion();
            return;
        }
        motionTimer = window.setTimeout(() => {
            motionTimer = null;
            if (performance.now() >= motionDeadline) {
                motionDeadline = 0;
            }
            syncMotionClass();
            if (motionDeadline > performance.now()) scheduleMotionDeadlineCheck();
            else refreshTransparencyAfterMotion();
        }, Math.min(remaining + 16, 500));
    }

    function refreshTransparencyAfterMotion() {
        if (motionRefCount > 0 || performance.now() < motionDeadline) return;
        syncLuxIsAnimatingFlag();
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            const pct = window.__currentTransparency ?? 70;
            window.queueLuxuryTransparencyRefresh(pct);
        }
    }

    function armMotionWatchdog() {
        if (motionWatchdogTimer) window.clearTimeout(motionWatchdogTimer);
        motionWatchdogTimer = window.setTimeout(() => {
            motionWatchdogTimer = null;
            if (motionRefCount === 0 && performance.now() >= motionDeadline) return;
            motionRefCount = 0;
            motionDeadline = 0;
            syncMotionClass();
            refreshTransparencyAfterMotion();
        }, MOTION_WATCHDOG_MS);
    }

    function beginShellChromeMotion(ms = 180, reason = 'motion') {
        void reason;
        const duration = Math.max(0, Number(ms) || 0);
        motionRefCount += 1;
        if (duration > 0) {
            motionDeadline = Math.max(motionDeadline, performance.now() + duration);
            scheduleMotionDeadlineCheck();
        }
        armMotionWatchdog();
        syncMotionClass();
    }

    function endShellChromeMotion(reason = 'motion') {
        void reason;
        motionRefCount = Math.max(0, motionRefCount - 1);
        syncMotionClass();
        if (motionRefCount === 0 && performance.now() >= motionDeadline) {
            refreshTransparencyAfterMotion();
        }
    }

    function extendShellChromeMotion(ms = 180, reason = 'motion') {
        void reason;
        const duration = Math.max(0, Number(ms) || 0);
        if (duration <= 0) return;
        motionDeadline = Math.max(motionDeadline, performance.now() + duration);
        scheduleMotionDeadlineCheck();
        syncMotionClass();
    }

    function syncShellHoverBusyFlag() {
        const wasBusy = window.__luxShellHoverBusy === true;
        const active = performance.now() < hoverBusyUntil;
        window.__luxShellHoverBusy = active;
        if (wasBusy !== active && typeof window.notifyLuxGovernorStateChange === 'function') {
            window.notifyLuxGovernorStateChange();
        }
        if (!active) {
            if (hoverBusyTimer) {
                window.clearTimeout(hoverBusyTimer);
                hoverBusyTimer = null;
            }
            return;
        }
        if (hoverBusyTimer) window.clearTimeout(hoverBusyTimer);
        const remaining = Math.max(16, hoverBusyUntil - performance.now());
        hoverBusyTimer = window.setTimeout(() => {
            hoverBusyTimer = null;
            syncShellHoverBusyFlag();
        }, remaining + 8);
    }

    function pulseShellHoverBusy(ms = HOVER_BUSY_MS) {
        const duration = Math.max(0, Number(ms) || 0);
        if (duration <= 0) return;
        hoverBusyUntil = Math.max(hoverBusyUntil, performance.now() + duration);
        syncShellHoverBusyFlag();
    }

    function isShellChromeHoverTarget(node) {
        if (!node || node.nodeType !== 1) return false;
        try {
            return Boolean(
                node.closest?.('#lux-shell, #lux-topbar, .lux-topbar-shell')
                || node.closest?.('.home-hover-chip')
            );
        } catch (_error) {
            return false;
        }
    }

    function armShellInteractionBusy(ms = 650) {
        const duration = Math.max(0, Number(ms) || 0);
        if (duration <= 0) return;
        shellInteractionBusyUntil = Math.max(shellInteractionBusyUntil, performance.now() + duration);
        window.__luxShellInteractionBusy = true;
        if (shellInteractionBusyTimer) return;
        const finish = () => {
            shellInteractionBusyTimer = null;
            const remaining = shellInteractionBusyUntil - performance.now();
            if (remaining > 0) {
                shellInteractionBusyTimer = window.setTimeout(finish, remaining + 8);
                return;
            }
            shellInteractionBusyUntil = 0;
            window.__luxShellInteractionBusy = false;
            if (typeof window.notifyLuxGovernorStateChange === 'function') {
                window.notifyLuxGovernorStateChange();
            }
        };
        shellInteractionBusyTimer = window.setTimeout(finish, duration + 8);
    }

    function shouldPulseForPointer(event) {
        if (event.pointerType && event.pointerType !== 'mouse') return false;
        try {
            if (window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches) return false;
        } catch (_e) {}
        return true;
    }

    function onShellChromePointerOver(event) {
        if (!shouldPulseForPointer(event)) return;
        const target = event.target?.closest?.('#lux-shell, #lux-topbar, .lux-topbar-shell, .home-hover-chip');
        if (!isShellChromeHoverTarget(target)) return;
        const related = event.relatedTarget;
        if (related && target.contains?.(related)) return;
        // Pause the expensive WebGL backdrop while the pointer is interacting
        // with chrome. This removes input starvation without changing the
        // resting visual or the page's normal background cadence.
        armShellInteractionBusy();
        // Sidebar rows only fade a local sheen; they do not lift or animate a
        // canvas-backed chrome surface. Avoid waking the global render
        // governor for every row-to-row hover transition.
        if (event.target?.closest?.('.lux-nav-item')) return;
        pulseShellHoverBusy();
    }

    function onShellChromePointerMove(event) {
        if (!shouldPulseForPointer(event)) return;
        const target = event.target?.closest?.('#lux-shell, #lux-topbar, .lux-topbar-shell');
        if (target) armShellInteractionBusy(420);
    }

    function onShellChromePointerDown(event) {
        if (event.target?.closest?.('#lux-shell, #lux-topbar, .lux-topbar-shell')) {
            armShellInteractionBusy(700);
        }
    }

    function ensureLuxHoverGuardCss() {
        if (document.querySelector('link[data-lux-hover-guard]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/lux-hover-guard.css?v=20260819-hover1';
        link.setAttribute('data-lux-hover-guard', '1');
        (document.head || document.documentElement).appendChild(link);
    }

    function bindShellChromeMotion() {
        if (bound) return;
        bound = true;
        ensureLuxHoverGuardCss();
        document.addEventListener('pointerover', onShellChromePointerOver, { passive: true, capture: true });
        document.addEventListener('pointermove', onShellChromePointerMove, { passive: true, capture: true });
        document.addEventListener('pointerdown', onShellChromePointerDown, { passive: true, capture: true });
    }

    window.beginShellChromeMotion = beginShellChromeMotion;
    window.endShellChromeMotion = endShellChromeMotion;
    window.extendShellChromeMotion = extendShellChromeMotion;
    window.pulseShellHoverBusy = pulseShellHoverBusy;
    window.bindShellChromeMotion = bindShellChromeMotion;
    window.beginLuxAnimating = beginLuxAnimating;
    window.endLuxAnimating = endLuxAnimating;
    window.syncLuxIsAnimatingFlag = syncLuxIsAnimatingFlag;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindShellChromeMotion, { once: true });
    } else {
        bindShellChromeMotion();
    }
}());
