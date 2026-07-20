(function adminToolsIndexAlignment() {
    'use strict';

    const PAGE_SELECTOR = '#lux-admin-tools-shell .lux-admin-tools-page';
    const HERO_ID = 'lux-admin-tools-index-hero';
    const STRIP_ID = 'lux-admin-tools-index-strip';
    const BOUND_FLAG = 'adminToolsIndexAlignmentBound';
    let scheduled = false;

    function escapeHtml(value) {
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
            const shared = window.escapeHtml;
            if (shared !== escapeHtml) return shared(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getPage() {
        return document.querySelector(PAGE_SELECTOR);
    }

    function getFacultyCode() {
        try {
            if (typeof getCurrentFacultyCode === 'function') return String(getCurrentFacultyCode() || 'ECON').trim().toUpperCase() || 'ECON';
        } catch (error) {}
        try {
            return String(localStorage.getItem('currentFaculty') || 'ECON').trim().toUpperCase() || 'ECON';
        } catch (error) {
            return 'ECON';
        }
    }

    function getFacultyLabel() {
        const facultyCode = getFacultyCode();
        try {
            if (typeof getFacultyName === 'function') {
                return String(getFacultyName(facultyCode) || facultyCode).trim() || facultyCode;
            }
        } catch (error) {}
        return facultyCode;
    }

    function textFrom(root, selector, fallback) {
        const node = root.querySelector(selector);
        const text = String(node?.textContent || '').replace(/\s+/g, ' ').trim();
        return text || fallback || '';
    }

    function getModuleCount(page) {
        return page.querySelectorAll('.curriculum-library-module-option').length;
    }

    function getRegistrationLaneCount(page) {
        return page.querySelectorAll('[data-admin-tools-reg-tab]').length;
    }

    function getActiveRegistrationLane(page) {
        return textFrom(page, '[data-admin-tools-reg-tab].is-active', 'Program');
    }

    function getSemesterLabel(page) {
        const hidden = page.querySelector('#new-subject-semesters');
        if (hidden) {
            try {
                const parsed = JSON.parse(hidden.value || '[]');
                if (typeof window.formatSubjectSemestersLabel === 'function') {
                    return window.formatSubjectSemestersLabel(parsed);
                }
                const list = Array.isArray(parsed) ? parsed.filter((entry) => Number(entry) > 0).sort((a, b) => a - b) : [];
                if (list.length === 1) return `Semester ${list[0]}`;
                if (list.length > 1) return `Semesters ${list.join(', ')}`;
            } catch (error) {}
        }
        const valueNode = page.querySelector('#new-subject-semester-lux-value');
        const label = String(valueNode?.textContent || '').replace(/\s+/g, ' ').trim();
        return label || 'Select semester';
    }

    function getBuilderTarget(page) {
        return textFrom(page, '#curriculum-form-module-target', 'Target module loading');
    }

    function getHeroMarkup(page) {
        const facultyLabel = getFacultyLabel();
        const moduleCount = getModuleCount(page);
        const registrationLaneCount = getRegistrationLaneCount(page);
        const activeLane = getActiveRegistrationLane(page);
        const semesterLabel = getSemesterLabel(page);
        const builderTarget = getBuilderTarget(page);
        const moduleLabel = `${moduleCount} module${moduleCount === 1 ? '' : 's'}`;
        return `
            <div class="lux-card-body lux-hero-stage lux-admin-tools-index-hero-stage">
                <div class="lux-hero-main lux-admin-tools-index-copy">
                    <div class="lux-kicker">Academic Control Deck</div>
                    <h1>Design the academic operating system for ${escapeHtml(facultyLabel)}.</h1>
                    <p>Shape curriculum modules, stage new subjects, and wire registration logic from one orchestration surface instead of hopping between disconnected admin forms.</p>
                    <div class="lux-pill-row">
                        <span class="lux-pill"><i class="fas fa-building-columns"></i>${escapeHtml(facultyLabel)}</span>
                    </div>
                    <div class="lux-hero-actions">
                        <button class="lux-primary-btn" type="button" data-admin-tools-index-action="admin-scheduler"><i class="fas fa-calendar-plus"></i>Open Scheduler</button>
                        <button class="lux-secondary-btn" type="button" data-admin-tools-index-focus="#curriculum-subject-builder-card"><i class="fas fa-book-medical"></i>Jump To Builder</button>
                        <button class="lux-ghost-btn" type="button" data-admin-tools-index-focus="#admin-reg-content-container"><i class="fas fa-sitemap"></i>Open Registration Lanes</button>
                    </div>
                </div>
                <aside class="lux-admin-tools-index-command">
                    <div class="lux-admin-tools-index-command-head">
                        <strong>Command Map</strong>
                        <span>Four linked control zones keep curriculum, subject intake, registration policy, and publishing aligned in one direction.</span>
                    </div>
                    <div class="lux-admin-tools-index-command-grid">
                        <article class="lux-admin-tools-index-command-card">
                            <span>Library</span>
                            <strong>${moduleLabel}</strong>
                            <em>Core structure for ${escapeHtml(facultyLabel)} · Sequence changes start here.</em>
                        </article>
                        <article class="lux-admin-tools-index-command-card">
                            <span>Builder</span>
                            <strong>${escapeHtml(semesterLabel)}</strong>
                            <em>${escapeHtml(builderTarget)} · Create course records and wire them into live curriculum modules.</em>
                        </article>
                        <article class="lux-admin-tools-index-command-card">
                            <span>Registration</span>
                            <strong>${escapeHtml(activeLane)}</strong>
                            <em>${registrationLaneCount} lanes · Program, free credits, concentration, and minor</em>
                        </article>
                        <article class="lux-admin-tools-index-command-card">
                            <span>Scheduler</span>
                            <strong>Publish</strong>
                            <em>Room, section, and timetable distribution after subjects and lanes are defined.</em>
                        </article>
                    </div>
                </aside>
            </div>
        `;
    }

    function clearPresentationalInlineStyle(element) {
        if (!element || !element.style) return;
        element.style.removeProperty('background');
        element.style.removeProperty('backdrop-filter');
        element.style.removeProperty('-webkit-backdrop-filter');
        element.style.removeProperty('box-shadow');
        if (!element.style.cssText.trim()) {
            element.removeAttribute('style');
        }
    }

    function applySurfaceAlignment(page) {
        page.querySelectorAll(':scope > .lux-panel').forEach((panel) => {
            panel.classList.add('lux-admin-tools-index-panel');
            panel.setAttribute('data-lux-index-glass-root', '1');
        });

        page.querySelectorAll('#curriculum-library-workspace-root, #curriculum-library-modules-root, #admin-reg-content-container').forEach((root) => {
            root.classList.add('lux-admin-tools-index-panel-shell');
            clearPresentationalInlineStyle(root);
        });

        page.querySelectorAll('.curriculum-library-panel, .curriculum-library-module-option, .lux-empty-state, .lux-empty-block, #admin-reg-content-container .lux-surface').forEach((panel) => {
            panel.classList.add('lux-admin-tools-index-subpanel');
            clearPresentationalInlineStyle(panel);
        });

        page.querySelectorAll(
            '#curriculum-module-rail-region, #curriculum-subject-panel-region, .lux-program-shell-section, .lux-admin-curriculum-control-band, .lux-admin-curriculum-ops-panel'
        ).forEach((panel) => {
            panel.classList.add('lux-admin-tools-index-subpanel');
            clearPresentationalInlineStyle(panel);
        });
    }

    function renderHero(page) {
        let hero = document.getElementById(HERO_ID);
        if (hero) {
            hero.remove();
        }
    }

    function removeLegacyStrip() {
        document.getElementById(STRIP_ID)?.remove();
    }

    function getAlignmentSignature(page) {
        return [
            getFacultyCode(),
            getModuleCount(page),
            getRegistrationLaneCount(page),
            getActiveRegistrationLane(page),
            getSemesterLabel(page),
            getBuilderTarget(page),
            document.getElementById(HERO_ID) ? 'hero' : 'no-hero'
        ].join('|');
    }

    function bindActions(root) {
        root.querySelectorAll('[data-admin-tools-index-action]').forEach((button) => {
            if (button.dataset[BOUND_FLAG] === '1') return;
            button.addEventListener('click', () => {
                const target = String(button.getAttribute('data-admin-tools-index-action') || '').trim();
                if (!target) return;
                if (typeof navigate === 'function') {
                    navigate(target);
                    return;
                }
                if (typeof resolvePortalRouteUrl === 'function') {
                    window.location.assign(resolvePortalRouteUrl(target, 'admin'));
                }
            });
            button.dataset[BOUND_FLAG] = '1';
        });

        root.querySelectorAll('[data-admin-tools-index-focus]').forEach((button) => {
            if (button.dataset[BOUND_FLAG] === '1') return;
            button.addEventListener('click', () => {
                const selector = String(button.getAttribute('data-admin-tools-index-focus') || '').trim();
                if (!selector) return;
                const target = document.querySelector(selector);
                if (!target || typeof target.scrollIntoView !== 'function') return;
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            button.dataset[BOUND_FLAG] = '1';
        });
    }

    function syncAlignment() {
        const page = getPage();
        if (!page || !page.children.length) return;
        applySurfaceAlignment(page);
        removeLegacyStrip();
        const signature = getAlignmentSignature(page);
        if (page.dataset.adminToolsIndexSignature !== signature) {
            renderHero(page);
            page.dataset.adminToolsIndexSignature = getAlignmentSignature(page);
        }
        bindActions(page);
        page.dataset.adminToolsIndexAligned = '1';
    }

    function queueSync() {
        if (scheduled) return;
        scheduled = true;
        const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
        schedule(() => {
            scheduled = false;
            syncAlignment();
        });
    }

    function isRegistrationCmsOnlyMutation(mutations) {
        const regRoot = document.getElementById('admin-reg-content-container');
        if (!regRoot) return false;
        return mutations.every((mutation) => {
            const target = mutation.target;
            if (!(target instanceof Element)) return false;
            return regRoot === target || regRoot.contains(target);
        });
    }

    function installObserver() {
        if (document.documentElement.dataset.adminToolsIndexObserverBound === '1') return;
        const observer = new MutationObserver((mutations) => {
            if (isRegistrationCmsOnlyMutation(mutations)) return;
            queueSync();
        });
        const observerRoot = document.getElementById('lux-admin-tools-shell')
            || document.getElementById('page-admin-tools')
            || document.body
            || document.documentElement;
        observer.observe(observerRoot, { childList: true, subtree: true });
        document.documentElement.dataset.adminToolsIndexObserverBound = '1';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            installObserver();
            queueSync();
        }, { once: true });
    } else {
        installObserver();
        queueSync();
    }

    window.addEventListener('load', queueSync, { once: true });
    window.setTimeout(queueSync, 1200);
    window.setTimeout(queueSync, 2600);
})();