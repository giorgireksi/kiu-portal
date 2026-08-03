/* Student service lazy-module loaders + hub stubs.
 * Peeled from student-service.js. Load before student-service.js.
 */
(function initStudentServiceModulesRuntime() {
    'use strict';
    if (window.__KIU_STUDENT_SERVICE_MODULES_LOADED) return;
    window.__KIU_STUDENT_SERVICE_MODULES_LOADED = true;

    // Wave 21: bag-first exports for lazy modules (filters/qa/tickets/…).
    const __kiuSsApi = window.KiuStudentService || {};
    window.KiuStudentService = __kiuSsApi;
    window.__kiuSsApi = __kiuSsApi;

    function resolveStudentServiceExportImpl(name) {
        const bag = window.KiuStudentService || {};
        if (typeof bag[name] === 'function') return bag[name];
        const direct = window[name];
        if (typeof direct === 'function') return direct;
        const nested = [bag.qa, bag.filters, bag.tickets, bag.attachments, bag.service];
        for (let i = 0; i < nested.length; i += 1) {
            const part = nested[i];
            if (part && typeof part[name] === 'function') return part[name];
        }
        return undefined;
    }
    window.resolveStudentServiceExportImpl = resolveStudentServiceExportImpl;

    window.__kiuCreateStudentServiceModulesApi = function createKiuStudentServiceModulesApi(deps = {}) {
        const d = deps;

        function __dep(name, { optional = false } = {}) {
            return function (...a) {
                const fn = d[name] || resolveStudentServiceExportImpl(name) || window[name];
                if (typeof fn === 'function') return fn.apply(this, a);
                if (optional) return undefined;
                throw new Error('Missing dep: ' + name);
            };
        }
        const getStudentServiceLane = __dep('getStudentServiceLane');
        const invalidateStudentServiceRenderSignature = __dep('invalidateStudentServiceRenderSignature');
        const renderStudentServicePage = __dep('renderStudentServicePage');
        const setStudentServiceMarkup = __dep('setStudentServiceMarkup');
        const ssEscape = __dep('ssEscape', { optional: true });

        const STUDENT_SERVICE_QA_THREAD_URL = 'assets/js/pages/student-service-qa-thread-runtime.js?v=20260803-sshelp5';
        const STUDENT_SERVICE_QA_STAFF_URL = 'assets/js/pages/student-service-qa-staff-runtime.js?v=20260803-sshelp5';
        const STUDENT_SERVICE_QA_MODULE_URL = 'assets/js/pages/student-service-qa.js?v=20260803-sshelp5';
        const STUDENT_SERVICE_SERVICE_MODULE_URL = 'assets/js/pages/student-service-service.js?v=20260728-sssvc4';
        const STUDENT_SERVICE_FILTERS_MODULE_URL = 'assets/js/pages/student-service-filters.js?v=20260730-ssfilter1';
        const STUDENT_SERVICE_ATTACHMENTS_MODULE_URL = 'assets/js/pages/student-service-attachments.js?v=20260729-sspanel1';
        const STUDENT_SERVICE_TICKETS_MODULE_URL = 'assets/js/pages/student-service-tickets.js?v=20260729-sspanel1';

        let studentServiceQaModulePromise = null;
        let studentServiceServiceModulePromise = null;
        let studentServiceModuleRerenderScheduled = false;
        let studentServiceQaModuleLastErrorAt = 0;
        let studentServiceServiceModuleLastErrorAt = 0;
        let STUDENT_SERVICE_STUDENT_HUB_STUB = null;
        let STUDENT_SERVICE_STUDENT_QA_HUB_STUB = null;
        let STUDENT_SERVICE_MY_TICKETS_HUB_STUB = null;
        let STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB = null;
        let STUDENT_SERVICE_STAFF_QA_FEED_STUB = null;
        let STUDENT_SERVICE_STAFF_WORKBENCH_STUB = null;

        function liveStudentServiceExport(name, stub) {
            const windowImpl = window[name];
            if (typeof windowImpl === 'function' && windowImpl !== stub) return true;
            const impl = resolveStudentServiceExportImpl(name);
            return typeof impl === 'function' && impl !== stub;
        }

        function hasStudentServiceQaModule() {
            const studentQaHubStub = STUDENT_SERVICE_STUDENT_QA_HUB_STUB;
            const staffQaFeedStub = STUDENT_SERVICE_STAFF_QA_FEED_STUB;
            const pageThreadClickStub = d.handleStudentServiceQaThreadClick;
            return Boolean(
                studentQaHubStub
                && staffQaFeedStub
                && typeof window.renderStudentServiceStudentQaHub === 'function'
                && typeof window.renderStudentServiceStaffQaFeed === 'function'
                && window.renderStudentServiceStudentQaHub !== studentQaHubStub
                && window.renderStudentServiceStaffQaFeed !== staffQaFeedStub
                && typeof window.renderStudentServiceQuestionFeed === 'function'
                && typeof window.handleStudentServiceQaThreadClick === 'function'
                && (!pageThreadClickStub || window.handleStudentServiceQaThreadClick !== pageThreadClickStub)
            );
        }

        function isStudentServiceLazyScriptExecuted(script, isReady) {
            if (!script) return false;
            return typeof isReady === 'function' && isReady();
        }

        function shouldWaitForStudentServiceLazyScriptLoad(script) {
            if (!script) return false;
            return (script.readyState === 'loading' || script.readyState === 'uninitialized')
                && script.dataset.kiuLoaded !== '1';
        }

        function removeStaleStudentServiceLazyScript(script, moduleKind = '') {
            if (!script?.parentNode) return;
            script.remove();
            if (moduleKind === 'qa') {
                delete window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED;
                delete window.__KIU_STUDENT_SERVICE_QA_THREAD_LOADED;
                delete window.__KIU_STUDENT_SERVICE_QA_STAFF_LOADED;
            }
            if (moduleKind === 'service') delete window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED;
            if (moduleKind === 'filters') delete window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED;
            if (moduleKind === 'attachments') delete window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED;
            if (moduleKind === 'tickets') delete window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED;
        }

        function finishStudentServiceLazyModuleLoad(resolve, reject, isReady, errorMessage) {
            const attempt = (retriesLeft) => {
                if (isReady()) {
                    resolve(true);
                    scheduleStudentServiceModuleRerenderIfNeeded();
                    return;
                }
                if (retriesLeft > 0) {
                    requestAnimationFrame(() => attempt(retriesLeft - 1));
                    return;
                }
                reject(new Error(errorMessage));
            };
            queueMicrotask(() => attempt(32));
        }

        function scheduleStudentServiceModuleRerenderIfNeeded() {
            if (!getStudentServiceLane()) return;
            if (studentServiceModuleRerenderScheduled) return;
            studentServiceModuleRerenderScheduled = true;
            queueMicrotask(() => {
                studentServiceModuleRerenderScheduled = false;
                rerenderStudentServicePageAfterModuleLoad();
            });
        }

        function rerenderStudentServicePageAfterModuleLoad() {
            invalidateStudentServiceRenderSignature();
            if (typeof window.invalidateStudentServiceStores === 'function') {
                window.invalidateStudentServiceStores();
            }
            renderStudentServicePage();
        }

        function isStudentServiceQaBodyStale() {
            if (getStudentServiceLane() !== 'qa' || !hasStudentServiceQaModule()) return false;
            const body = document.getElementById('student-service-page-body');
            if (!body) return false;
            return !body.querySelector('[data-student-service-student-qa-shell="1"]')
                && !body.querySelector('[data-student-service-staff-qa-shell="1"]');
        }

        function ensureStudentServiceQaModule() {
            if (hasStudentServiceQaModule()) return Promise.resolve(true);
            ensureStudentServiceAttachmentsModule().catch(() => null);
            if (studentServiceQaModulePromise) return studentServiceQaModulePromise;
            studentServiceQaModulePromise = new Promise((resolve, reject) => {
                const isReady = () => hasStudentServiceQaModule();
                const onComplete = () => finishStudentServiceLazyModuleLoad(
                    resolve,
                    reject,
                    isReady,
                    'Student Service Q&A module could not be loaded.'
                );
                const qaUrls = [STUDENT_SERVICE_QA_THREAD_URL, STUDENT_SERVICE_QA_STAFF_URL, STUDENT_SERVICE_QA_MODULE_URL];
                qaUrls.reduce((chain, src) => chain.then(() => new Promise((res, rej) => {
                    let existing = document.querySelector(`script[src="${src}"]`);
                    if (existing) {
                        if (isReady()) {
                            res();
                            return;
                        }
                        if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                            existing.addEventListener('load', () => res(), { once: true });
                            existing.addEventListener('error', () => rej(new Error('Student Service Q&A module could not be loaded.')), { once: true });
                            return;
                        }
                        removeStaleStudentServiceLazyScript(existing, 'qa');
                        existing = null;
                    }
                    const script = document.createElement('script');
                    script.src = src;
                    script.defer = true;
                    script.addEventListener('load', () => { script.dataset.kiuLoaded = '1'; res(); }, { once: true });
                    script.addEventListener('error', () => rej(new Error('Student Service Q&A module could not be loaded.')), { once: true });
                    document.head.appendChild(script);
                })), Promise.resolve())
                    .then(onComplete)
                    .catch(reject);
            }).catch((error) => {
                const now = Date.now();
                if (now - studentServiceQaModuleLastErrorAt > 3000) {
                    studentServiceQaModuleLastErrorAt = now;
                    console.error('Student Service Q&A module load failed.', error);
                }
                throw error;
            }).finally(() => {
                studentServiceQaModulePromise = null;
            });
            return studentServiceQaModulePromise;
        }

        function renderStudentServiceQaModuleLoading(container, mode = 'student') {
            if (!container) return;
            const title = mode === 'staff' ? 'Loading Q&A desk...' : 'Loading Q&A lane...';
            const copy = mode === 'staff'
                ? 'Preparing the public-question moderation feed.'
                : 'Preparing the public-question feed and composer.';
            setStudentServiceMarkup(
                container,
                `student-service-qa-module-loading:${mode}`,
                `
                    <div class="student-service-empty-state student-service-empty-state-large">
                        <div class="student-service-empty-title">${title}</div>
                        <div class="student-service-empty-copy">${copy}</div>
                    </div>
                `
            );
        }

        function renderStudentServiceQaModuleLoadError(container, mode = 'student') {
            if (!container) return;
            const title = mode === 'staff' ? 'Q&A desk could not load' : 'Q&A lane could not load';
            const copy = mode === 'staff'
                ? 'The moderation feed module failed to load. Retry to open the public-question desk.'
                : 'The public-question feed module failed to load. Retry to open the campus Q&A lane.';
            setStudentServiceMarkup(
                container,
                `student-service-qa-module-error:${mode}`,
                `
                    <div class="student-service-empty-state student-service-empty-state-large student-service-qa-module-error">
                        <div class="student-service-empty-title">${title}</div>
                        <div class="student-service-empty-copy">${copy}</div>
                        <button type="button" class="lux-primary-btn student-service-qa-module-retry-btn" data-student-service-retry-qa-module="${ssEscape(mode)}"><i class="fas fa-rotate-right"></i> Retry</button>
                    </div>
                `
            );
        }

        function handleStudentServiceQaModuleLoadFailure(container, mode = 'student') {
            renderStudentServiceQaModuleLoadError(container, mode);
        }

        function hasStudentServiceServiceModule() {
            return Boolean(
                STUDENT_SERVICE_STUDENT_HUB_STUB
                && STUDENT_SERVICE_MY_TICKETS_HUB_STUB
                && STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB
                && window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED
                && liveStudentServiceExport('renderStudentServiceStudentHub', STUDENT_SERVICE_STUDENT_HUB_STUB)
                && liveStudentServiceExport('renderStudentServiceMyTicketsHub', STUDENT_SERVICE_MY_TICKETS_HUB_STUB)
                && liveStudentServiceExport('renderStudentServiceResponderServiceLane', STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB)
            );
        }

        function ensureStudentServiceServiceModule() {
            if (hasStudentServiceServiceModule()) return Promise.resolve(true);
            ensureStudentServiceFiltersModule().catch(() => null);
            ensureStudentServiceAttachmentsModule().catch(() => null);
            ensureStudentServiceTicketsModule().catch(() => null);
            if (studentServiceServiceModulePromise) return studentServiceServiceModulePromise;
            studentServiceServiceModulePromise = new Promise((resolve, reject) => {
                const isReady = () => hasStudentServiceServiceModule();
                const onComplete = () => finishStudentServiceLazyModuleLoad(
                    resolve,
                    reject,
                    isReady,
                    'Student Service service module could not be loaded.'
                );
                let existing = document.querySelector(`script[src="${STUDENT_SERVICE_SERVICE_MODULE_URL}"]`);
                if (existing) {
                    if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                        onComplete();
                        return;
                    }
                    if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                        existing.addEventListener('load', onComplete, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
                        return;
                    }
                    if (existing.dataset.kiuLoaded === '1') {
                        onComplete();
                        return;
                    }
                    removeStaleStudentServiceLazyScript(existing, 'service');
                    existing = null;
                }
                const script = document.createElement('script');
                script.src = STUDENT_SERVICE_SERVICE_MODULE_URL;
                script.defer = true;
                script.addEventListener('load', () => {
                    script.dataset.kiuLoaded = '1';
                    onComplete();
                }, { once: true });
                script.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
                document.head.appendChild(script);
            }).catch((error) => {
                const now = Date.now();
                if (now - studentServiceServiceModuleLastErrorAt > 3000) {
                    studentServiceServiceModuleLastErrorAt = now;
                    console.error('Student Service service module load failed.', error);
                }
                throw error;
            }).finally(() => {
                studentServiceServiceModulePromise = null;
            });
            return studentServiceServiceModulePromise;
        }

        let studentServiceFiltersModulePromise = null;
        let studentServiceFiltersModuleLastErrorAt = 0;

        function hasStudentServiceFiltersModule() {
            return Boolean(
                window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED
                && liveStudentServiceExport('getStudentServicePublishedInboxFilterLayout', d.getStudentServicePublishedInboxFilterLayout)
                && liveStudentServiceExport('renderStudentServiceInboxFiltersMarkup', d.renderStudentServiceInboxFiltersMarkup)
            );
        }

        function ensureStudentServiceFiltersModule() {
            if (hasStudentServiceFiltersModule()) return Promise.resolve(true);
            if (studentServiceFiltersModulePromise) return studentServiceFiltersModulePromise;
            studentServiceFiltersModulePromise = new Promise((resolve, reject) => {
                const isReady = () => hasStudentServiceFiltersModule();
                const onComplete = () => finishStudentServiceLazyModuleLoad(
                    resolve,
                    reject,
                    isReady,
                    'Student Service filters module could not be loaded.'
                );
                let existing = document.querySelector(`script[src="${STUDENT_SERVICE_FILTERS_MODULE_URL}"]`);
                if (existing) {
                    if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                        onComplete();
                        return;
                    }
                    if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                        existing.addEventListener('load', onComplete, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Student Service filters module could not be loaded.')), { once: true });
                        return;
                    }
                    if (existing.dataset.kiuLoaded === '1') {
                        onComplete();
                        return;
                    }
                    removeStaleStudentServiceLazyScript(existing, 'filters');
                    existing = null;
                }
                const script = document.createElement('script');
                script.src = STUDENT_SERVICE_FILTERS_MODULE_URL;
                script.defer = true;
                script.addEventListener('load', () => {
                    script.dataset.kiuLoaded = '1';
                    onComplete();
                }, { once: true });
                script.addEventListener('error', () => reject(new Error('Student Service filters module could not be loaded.')), { once: true });
                document.head.appendChild(script);
            }).catch((error) => {
                const now = Date.now();
                if (now - studentServiceFiltersModuleLastErrorAt > 3000) {
                    studentServiceFiltersModuleLastErrorAt = now;
                    console.error('Student Service filters module load failed.', error);
                }
                throw error;
            }).finally(() => {
                studentServiceFiltersModulePromise = null;
            });
            return studentServiceFiltersModulePromise;
        }

        let studentServiceAttachmentsModulePromise = null;
        let studentServiceAttachmentsModuleLastErrorAt = 0;

        function hasStudentServiceAttachmentsModule() {
            return Boolean(
                window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED
                && typeof window.renderStudentServiceAttachmentPickerMarkup === 'function'
                && (d.renderStudentServiceAttachmentPickerMarkup ? window.renderStudentServiceAttachmentPickerMarkup !== d.renderStudentServiceAttachmentPickerMarkup : true)
                && typeof window.renderStudentServiceAttachmentGalleryMarkup === 'function'
                && (d.renderStudentServiceAttachmentGalleryMarkup ? window.renderStudentServiceAttachmentGalleryMarkup !== d.renderStudentServiceAttachmentGalleryMarkup : true)
            );
        }

        function ensureStudentServiceAttachmentsModule() {
            if (hasStudentServiceAttachmentsModule()) return Promise.resolve(true);
            if (studentServiceAttachmentsModulePromise) return studentServiceAttachmentsModulePromise;
            studentServiceAttachmentsModulePromise = new Promise((resolve, reject) => {
                const isReady = () => hasStudentServiceAttachmentsModule();
                const onComplete = () => finishStudentServiceLazyModuleLoad(
                    resolve,
                    reject,
                    isReady,
                    'Student Service attachments module could not be loaded.'
                );
                let existing = document.querySelector(`script[src="${STUDENT_SERVICE_ATTACHMENTS_MODULE_URL}"]`);
                if (existing) {
                    if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                        onComplete();
                        return;
                    }
                    if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                        existing.addEventListener('load', onComplete, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Student Service attachments module could not be loaded.')), { once: true });
                        return;
                    }
                    if (existing.dataset.kiuLoaded === '1') {
                        onComplete();
                        return;
                    }
                    removeStaleStudentServiceLazyScript(existing, 'attachments');
                    existing = null;
                }
                const script = document.createElement('script');
                script.src = STUDENT_SERVICE_ATTACHMENTS_MODULE_URL;
                script.defer = true;
                script.addEventListener('load', () => {
                    script.dataset.kiuLoaded = '1';
                    onComplete();
                }, { once: true });
                script.addEventListener('error', () => reject(new Error('Student Service attachments module could not be loaded.')), { once: true });
                document.head.appendChild(script);
            }).catch((error) => {
                const now = Date.now();
                if (now - studentServiceAttachmentsModuleLastErrorAt > 3000) {
                    studentServiceAttachmentsModuleLastErrorAt = now;
                    console.error('Student Service attachments module load failed.', error);
                }
                throw error;
            }).finally(() => {
                studentServiceAttachmentsModulePromise = null;
            });
            return studentServiceAttachmentsModulePromise;
        }

        let studentServiceTicketsModulePromise = null;
        let studentServiceTicketsModuleLastErrorAt = 0;

        function hasStudentServiceTicketsModule() {
            const live = (name, stub) => {
                const impl = resolveStudentServiceExportImpl(name);
                return typeof impl === 'function' && (!stub || impl !== stub);
            };
            return Boolean(
                window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED
                && live('normalizeStudentServiceTicket', d.normalizeStudentServiceTicket)
                && live('submitStudentServiceTicket', d.submitStudentServiceTicket)
            );
        }

        function ensureStudentServiceTicketsModule() {
            if (hasStudentServiceTicketsModule()) return Promise.resolve(true);
            if (studentServiceTicketsModulePromise) return studentServiceTicketsModulePromise;
            studentServiceTicketsModulePromise = new Promise((resolve, reject) => {
                const isReady = () => hasStudentServiceTicketsModule();
                const onComplete = () => finishStudentServiceLazyModuleLoad(
                    resolve,
                    reject,
                    isReady,
                    'Student Service tickets module could not be loaded.'
                );
                let existing = document.querySelector(`script[src="${STUDENT_SERVICE_TICKETS_MODULE_URL}"]`);
                if (existing) {
                    if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                        onComplete();
                        return;
                    }
                    if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                        existing.addEventListener('load', onComplete, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Student Service tickets module could not be loaded.')), { once: true });
                        return;
                    }
                    if (existing.dataset.kiuLoaded === '1') {
                        onComplete();
                        return;
                    }
                    removeStaleStudentServiceLazyScript(existing, 'tickets');
                    existing = null;
                }
                const script = document.createElement('script');
                script.src = STUDENT_SERVICE_TICKETS_MODULE_URL;
                script.defer = true;
                script.addEventListener('load', () => {
                    script.dataset.kiuLoaded = '1';
                    onComplete();
                }, { once: true });
                script.addEventListener('error', () => reject(new Error('Student Service tickets module could not be loaded.')), { once: true });
                document.head.appendChild(script);
            }).catch((error) => {
                const now = Date.now();
                if (now - studentServiceTicketsModuleLastErrorAt > 3000) {
                    studentServiceTicketsModuleLastErrorAt = now;
                    console.error('Student Service tickets module load failed.', error);
                }
                throw error;
            }).finally(() => {
                studentServiceTicketsModulePromise = null;
            });
            return studentServiceTicketsModulePromise;
        }


        function renderStudentServiceServiceModuleLoading(container, mode = 'service') {
            if (!container) return;
            const title = mode === 'student'
                ? 'Loading support lane...'
                : mode === 'responder'
                    ? 'Loading responder lane...'
                    : 'Loading service workspace...';
            const copy = mode === 'student'
                ? 'Preparing tickets, guidance, and the private support workspace.'
                : mode === 'responder'
                    ? 'Preparing the faculty guidance lane.'
                    : 'Preparing the private service workspace.';
            setStudentServiceMarkup(
                container,
                `student-service-service-module-loading:${mode}`,
                `
                    <div class="student-service-empty-state student-service-empty-state-large">
                        <div class="student-service-empty-title">${title}</div>
                        <div class="student-service-empty-copy">${copy}</div>
                    </div>
                `
            );
        }

        function renderStudentServiceServiceModuleLoadError(container, mode = 'service') {
            if (!container) return;
            const title = mode === 'student'
                ? 'Support lane could not load'
                : mode === 'responder'
                    ? 'Responder lane could not load'
                    : 'Service workspace could not load';
            const copy = mode === 'student'
                ? 'The private support module failed to load. Retry to open tickets and guidance.'
                : mode === 'responder'
                    ? 'The faculty guidance module failed to load. Retry to open the responder lane.'
                    : 'The service workspace module failed to load. Retry to open the private desk.';
            setStudentServiceMarkup(
                container,
                `student-service-service-module-error:${mode}`,
                `
                    <div class="student-service-empty-state student-service-empty-state-large student-service-service-module-error">
                        <div class="student-service-empty-title">${title}</div>
                        <div class="student-service-empty-copy">${copy}</div>
                        <button type="button" class="lux-primary-btn student-service-service-module-retry-btn" data-student-service-retry-service-module="${ssEscape(mode)}"><i class="fas fa-rotate-right"></i> Retry</button>
                    </div>
                `
            );
        }

        function handleStudentServiceServiceModuleLoadFailure(container, mode = 'service') {
            renderStudentServiceServiceModuleLoadError(container, mode);
        }


        function renderStudentServiceStudentHub(container, visibleArticles, visibleTickets) {
            if (hasStudentServiceServiceModule()) {
                return window.renderStudentServiceStudentHub(container, visibleArticles, visibleTickets);
            }
            renderStudentServiceServiceModuleLoading(container, 'student');
            ensureStudentServiceServiceModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'student'));
        }

        function renderStudentServiceStudentQaHub(container) {
            if (hasStudentServiceQaModule()) {
                return window.renderStudentServiceStudentQaHub(container);
            }
            renderStudentServiceQaModuleLoading(container, 'student');
            ensureStudentServiceQaModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceQaModuleLoadFailure(container, 'student'));
        }

        function renderStudentServiceMyTicketsHub(container, visibleTickets) {
            if (hasStudentServiceServiceModule()) {
                return window.renderStudentServiceMyTicketsHub(container, visibleTickets);
            }
            renderStudentServiceServiceModuleLoading(container, 'student');
            ensureStudentServiceServiceModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'student'));
        }

        function renderStudentServiceResponderServiceLane(container, visibleArticles) {
            if (hasStudentServiceServiceModule()) {
                return window.renderStudentServiceResponderServiceLane(container, visibleArticles);
            }
            renderStudentServiceServiceModuleLoading(container, 'responder');
            ensureStudentServiceServiceModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'responder'));
        }

        function renderStudentServiceStaffQaFeed(container, options = {}) {
            if (hasStudentServiceQaModule()) {
                return window.renderStudentServiceStaffQaFeed(container, options);
            }
            renderStudentServiceQaModuleLoading(container, 'staff');
            ensureStudentServiceQaModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceQaModuleLoadFailure(container, 'staff'));
        }

        function renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options = {}) {
            if (hasStudentServiceServiceModule()) {
                return window.renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options);
            }
            renderStudentServiceServiceModuleLoading(container, 'service');
            ensureStudentServiceServiceModule()
                .then(() => rerenderStudentServicePageAfterModuleLoad())
                .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'service'));
        }

        function captureStudentServiceLazyModuleStubs() {
            STUDENT_SERVICE_STUDENT_HUB_STUB = renderStudentServiceStudentHub;
            STUDENT_SERVICE_STUDENT_QA_HUB_STUB = renderStudentServiceStudentQaHub;
            STUDENT_SERVICE_MY_TICKETS_HUB_STUB = renderStudentServiceMyTicketsHub;
            STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB = renderStudentServiceResponderServiceLane;
            STUDENT_SERVICE_STAFF_QA_FEED_STUB = renderStudentServiceStaffQaFeed;
            STUDENT_SERVICE_STAFF_WORKBENCH_STUB = renderStudentServiceStaffWorkbench;
            window.__studentServiceStudentHubStub = STUDENT_SERVICE_STUDENT_HUB_STUB;
            window.__studentServiceStudentQaHubStub = STUDENT_SERVICE_STUDENT_QA_HUB_STUB;
            window.__studentServiceMyTicketsHubStub = STUDENT_SERVICE_MY_TICKETS_HUB_STUB;
            window.__studentServiceResponderServiceLaneStub = STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB;
            window.__studentServiceStaffQaFeedGuard = STUDENT_SERVICE_STAFF_QA_FEED_STUB;
            window.__studentServiceStaffQaFeedStub = STUDENT_SERVICE_STAFF_QA_FEED_STUB;
            window.__studentServiceStaffWorkbenchStub = STUDENT_SERVICE_STAFF_WORKBENCH_STUB;
        }

        captureStudentServiceLazyModuleStubs();


        const api = {
            hasStudentServiceQaModule,
            isStudentServiceLazyScriptExecuted,
            shouldWaitForStudentServiceLazyScriptLoad,
            removeStaleStudentServiceLazyScript,
            finishStudentServiceLazyModuleLoad,
            scheduleStudentServiceModuleRerenderIfNeeded,
            rerenderStudentServicePageAfterModuleLoad,
            isStudentServiceQaBodyStale,
            ensureStudentServiceQaModule,
            renderStudentServiceQaModuleLoading,
            renderStudentServiceQaModuleLoadError,
            handleStudentServiceQaModuleLoadFailure,
            hasStudentServiceServiceModule,
            ensureStudentServiceServiceModule,
            hasStudentServiceFiltersModule,
            ensureStudentServiceFiltersModule,
            hasStudentServiceAttachmentsModule,
            ensureStudentServiceAttachmentsModule,
            hasStudentServiceTicketsModule,
            ensureStudentServiceTicketsModule,
            renderStudentServiceServiceModuleLoading,
            renderStudentServiceServiceModuleLoadError,
            handleStudentServiceServiceModuleLoadFailure,
            renderStudentServiceStudentHub,
            renderStudentServiceStudentQaHub,
            renderStudentServiceMyTicketsHub,
            renderStudentServiceResponderServiceLane,
            renderStudentServiceStaffQaFeed,
            renderStudentServiceStaffWorkbench,
            captureStudentServiceLazyModuleStubs
        };
        Object.assign(window, api);
        return api;
    };
})();
