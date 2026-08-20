/* Global click-burst particles for portal buttons and popup controls. */
(function initLuxButtonBurst() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.__KIU_LUX_BUTTON_BURST_LOADED) return;
    window.__KIU_LUX_BUTTON_BURST_LOADED = true;

    const LAYER_ID = 'lux-button-burst-layer';
    const BUTTON_BURST_PREFERENCE_KEY = 'kiuLuxuryButtonBurstEnabled';
    const PARTICLE_SELECTOR = ':scope > .lux-chip-burst-particle';
    const MAX_PARTICLES = 80;
    const PARTICLE_TRIM_LIMIT = 60;
    const BURST_INTERVAL_MS = 90;
    const PARTICLE_TIMEOUT_MS = 1000;
    const BURST_TARGET_SELECTOR = [
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        'input[type="reset"]',
        'a.lux-primary-btn',
        'a.lux-secondary-btn',
        'a.lux-destructive-btn',
        'a.lux-ghost-btn',
        '[role="button"]'
    ].join(', ');
    const EXCLUDED_SELECTOR = [
        '[aria-disabled="true"]',
        '[data-lux-click-burst="off"]',
        '.lux-scroll-rail__btn',
        '.social-project-task-graph-link-handle',
        '.social-project-task-graph-svg-port',
        'input[type="range"]',
        'input[type="file"]'
    ].join(', ');
    const EXCLUDED_ANCESTOR_SELECTOR = [
        '[data-lux-click-burst="off"]',
        '.lux-bg-gallery-tile',
        '#lux-bg-gallery-upload',
        '#lux-bg-gallery-upload-label',
        '[data-gallery-empty-upload]',
        '[data-lux-burst-exclude]'
    ].join(', ');
    let runtimePreference = null;

    function readStoredPreference() {
        try {
            const value = window.localStorage?.getItem(BUTTON_BURST_PREFERENCE_KEY);
            if (value === 'false') return false;
            if (value === 'true' || value == null || value === '') return true;
        } catch (_error) {  }
        return true;
    }

    function getLuxButtonBurstEnabled() {
        return runtimePreference == null ? readStoredPreference() : runtimePreference;
    }

    function clearLuxButtonBurstParticles() {
        const root = document.getElementById(LAYER_ID);
        root?.querySelectorAll(PARTICLE_SELECTOR).forEach((particle) => particle.remove());
        if (typeof spawnLuxChipBurstParticles === 'function') {
            delete spawnLuxChipBurstParticles._lastBurstAt;
        }
    }

    function notifyPreferenceChange(enabled) {
        if (typeof window.CustomEvent !== 'function') return;
        window.dispatchEvent(new window.CustomEvent('lux-button-burst-preference-change', {
            detail: { enabled: enabled === true }
        }));
    }

    function setLuxButtonBurstEnabled(enabled) {
        const next = enabled === true;
        runtimePreference = next;
        try {
            window.localStorage?.setItem(BUTTON_BURST_PREFERENCE_KEY, String(next));
        } catch (_error) {  }
        if (!next) clearLuxButtonBurstParticles();
        notifyPreferenceChange(next);
        return next;
    }

    function resetLuxButtonBurstPreference() {
        runtimePreference = null;
        try {
            window.localStorage?.removeItem(BUTTON_BURST_PREFERENCE_KEY);
        } catch (_error) {  }
        clearLuxButtonBurstParticles();
        notifyPreferenceChange(true);
        return true;
    }

    function now() {
        return typeof window.performance?.now === 'function'
            ? window.performance.now()
            : Date.now();
    }

    function collectPerimeterPoints(rect, perSide = 5) {
        const { left, top, width, height } = rect;
        const points = [];
        const add = (x, y, nx, ny) => points.push({ x, y, nx, ny });
        for (let i = 0; i < perSide; i += 1) {
            const t = (i + 0.5) / perSide;
            add(left + width * t, top, 0, -1);
            add(left + width, top + height * t, 1, 0);
            add(left + width * (1 - t), top + height, 0, 1);
            add(left, top + height * (1 - t), -1, 0);
        }
        return points;
    }

    function ensureLuxButtonBurstLayer() {
        if (!document.body) return null;
        let layer = document.getElementById(LAYER_ID);
        if (layer) return layer;
        layer = document.createElement('div');
        layer.id = LAYER_ID;
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
        return layer;
    }

    function spawnLuxChipBurstParticles(shell, _event, _root, rectOverride) {
        if (!getLuxButtonBurstEnabled() || isReducedMotion()) return;
        if (!shell || typeof shell.getBoundingClientRect !== 'function') return;
        const root = ensureLuxButtonBurstLayer();
        if (!root) return;

        const current = now();
        const lastAt = spawnLuxChipBurstParticles._lastBurstAt;
        if (Number.isFinite(lastAt) && current - lastAt < BURST_INTERVAL_MS) return;
        spawnLuxChipBurstParticles._lastBurstAt = current;

        const existing = root.querySelectorAll(PARTICLE_SELECTOR);
        if (existing.length > MAX_PARTICLES) {
            const excess = existing.length - PARTICLE_TRIM_LIMIT;
            for (let i = 0; i < excess; i += 1) existing[i]?.remove();
        }

        const rect = rectOverride || shell.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const points = collectPerimeterPoints(rect);
        const { left, top, width, height } = rect;
        const corners = [
            { x: left, y: top, nx: -1, ny: -1 },
            { x: left + width, y: top, nx: 1, ny: -1 },
            { x: left + width, y: top + height, nx: 1, ny: 1 },
            { x: left, y: top + height, nx: -1, ny: 1 }
        ];
        const kinds = ['dot', 'spark', 'streak'];
        const sizes = ['sm', 'md', 'lg'];
        const jobs = [
            ...points.map((point, index) => ({
                point,
                index,
                kind: kinds[index % kinds.length],
                size: sizes[index % sizes.length]
            })),
            ...corners.map((point, index) => ({
                point,
                index: points.length + index,
                kind: 'spark',
                size: 'lg'
            }))
        ];
        const appendParticle = (particle) => {
            const remove = () => {
                if (particle._done) return;
                particle._done = true;
                particle.remove();
            };
            particle.addEventListener('animationend', remove, { once: true });
            window.setTimeout(remove, PARTICLE_TIMEOUT_MS);
            root.appendChild(particle);
        };

        jobs.forEach(({ point, index, kind, size }) => {
            const edgeJitter = (Math.random() - 0.5) * 10;
            const angleJitter = ((Math.random() - 0.5) * 28 * Math.PI) / 180;
            const baseAngle = Math.atan2(point.ny, point.nx) + angleJitter;
            const distance = 36 + Math.random() * 36;
            const spawnX = point.x + (point.nx === 0 ? edgeJitter : point.nx * 2);
            const spawnY = point.y + (point.ny === 0 ? edgeJitter : point.ny * 2);
            const particle = document.createElement('span');
            particle.className = `lux-chip-burst-particle lux-chip-burst-particle--${kind} lux-chip-burst-particle--${size}`;
            particle.style.left = `${spawnX}px`;
            particle.style.top = `${spawnY}px`;
            particle.style.setProperty('--burst-tx', `${Math.cos(baseAngle) * distance}px`);
            particle.style.setProperty('--burst-ty', `${Math.sin(baseAngle) * distance}px`);
            particle.style.setProperty('--burst-rot', `${(baseAngle * 180) / Math.PI}deg`);
            particle.style.setProperty('--burst-delay', `${index * 10}ms`);
            appendParticle(particle);
        });
    }

    function resolveBurstTarget(node) {
        if (!node?.closest) return null;
        let target = node.closest(BURST_TARGET_SELECTOR);
        if (!target) return null;
        // Some legacy close icons carry role="button" inside a native button.
        // Animate the actual control rather than the icon's tiny rectangle.
        if (target.matches('[role="button"]') && !/^(BUTTON|INPUT|A)$/.test(target.tagName)) {
            const nativeButton = target.closest('button, input[type="button"], input[type="submit"], input[type="reset"]');
            if (nativeButton) target = nativeButton;
        }
        return target;
    }

    function isReducedMotion() {
        try {
            return typeof window.matchMedia === 'function'
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (_error) {
            return false;
        }
    }

    function bindLuxButtonBurstHandler() {
        if (bindLuxButtonBurstHandler._bound) return;
        bindLuxButtonBurstHandler._bound = true;
        document.addEventListener('pointerdown', (event) => {
            if (!getLuxButtonBurstEnabled() || event.button !== 0 || isReducedMotion()) return;
            const eventTarget = event.target;
            if (!eventTarget?.closest) return;
            if (eventTarget.closest(EXCLUDED_ANCESTOR_SELECTOR)) return;

            const studioShell = eventTarget.closest('.lux-bg-mode-item, .lux-fog-profile-item');
            const burstTarget = studioShell || resolveBurstTarget(eventTarget);
            if (!burstTarget || !document.documentElement.contains(burstTarget)) return;
            if (burstTarget.disabled || burstTarget.matches(EXCLUDED_SELECTOR)) return;
            if (burstTarget.closest(EXCLUDED_ANCESTOR_SELECTOR)) return;

            // Capture geometry before click handlers can replace the page/modal.
            const burstRect = burstTarget.getBoundingClientRect();
            const schedule = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame.bind(window)
                : (callback) => window.setTimeout(callback, 0);
            schedule(() => spawnLuxChipBurstParticles(burstTarget, event, null, burstRect));
        }, true);
    }

    window.spawnLuxChipBurstParticles = spawnLuxChipBurstParticles;
    window.ensureLuxButtonBurstLayer = ensureLuxButtonBurstLayer;
    window.bindLuxButtonBurstHandler = bindLuxButtonBurstHandler;
    window.getLuxButtonBurstEnabled = getLuxButtonBurstEnabled;
    window.setLuxButtonBurstEnabled = setLuxButtonBurstEnabled;
    window.resetLuxButtonBurstPreference = resetLuxButtonBurstPreference;
    window.clearLuxButtonBurstParticles = clearLuxButtonBurstParticles;
    window.addEventListener('storage', (event) => {
        if (event.key !== BUTTON_BURST_PREFERENCE_KEY && event.key !== null) return;
        runtimePreference = null;
        const enabled = getLuxButtonBurstEnabled();
        if (!enabled) clearLuxButtonBurstParticles();
        notifyPreferenceChange(enabled);
    });
    bindLuxButtonBurstHandler();
}());
