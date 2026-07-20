/* Peeled from assets/js/app/app.js (Wave 20 portal chrome/compat fallbacks). Load before app.js. */
(function initPortalCompatRuntime() {
    'use strict';
    if (window.__KIU_PORTAL_COMPAT_LOADED) return;
    window.__KIU_PORTAL_COMPAT_LOADED = true;

    window.__kiuCreatePortalCompatApi = function createKiuPortalCompatApi(deps) {
        void deps;
        const __compatApi = {};

        function isFallbackPortalAction(fn) {
            return typeof fn === 'function' && fn.__kiuFallback === true;
        }

    function clickPortalUtilityButton(kind) {
        const selector = kind === 'messages' ? '[data-utility="messages"]' : '[data-utility="notifications"]';
        const button = document.querySelector(selector);
        if (!button || typeof button.click !== 'function') return false;
        button.click();
        return true;
    }

    function routeToSocialPanel(panel) {
        try {
            localStorage.setItem('KIU_SOCIAL_ACTIVE_PANEL', String(panel || 'feed'));
            if (panel !== 'messages') localStorage.removeItem('KIU_SOCIAL_ACTIVE_CHAT');
        } catch (error) {}
        if (typeof rememberSocialPortalContext === 'function') {
            try { rememberSocialPortalContext(); } catch (error) {}
        }
        if (typeof navigate === 'function') {
            navigate('social');
            return true;
        }
        window.location.assign('social.html');
        return true;
    }

    function openPortalMessagesCompat() {
        if (typeof window.openPortalMessengerFullModal === 'function' && !isFallbackPortalAction(window.openPortalMessengerFullModal)) {
            window.openPortalMessengerFullModal();
            return true;
        }
        if (typeof window.openSocialMessengerWorkspace === 'function' && !isFallbackPortalAction(window.openSocialMessengerWorkspace)) {
            window.openSocialMessengerWorkspace();
            return true;
        }
        if (clickPortalUtilityButton('messages')) return true;
        return routeToSocialPanel('messages');
    }

    function openPortalNotificationsCompat() {
        if (typeof window.openPortalNotificationFullModal === 'function' && !isFallbackPortalAction(window.openPortalNotificationFullModal)) {
            window.openPortalNotificationFullModal();
            return true;
        }
        if (clickPortalUtilityButton('notifications')) return true;
        return routeToSocialPanel('alerts');
    }

    function ensureSocialRuntimeThen(action) {
        if (typeof ensurePortalSocialRuntimeLoaded !== 'function') {
            return action();
        }
        return Promise.resolve(ensurePortalSocialRuntimeLoaded())
            .catch(() => false)
            .then(() => action());
    }

    if (typeof window.toggleMessaging !== 'function') {
        __compatApi.toggleMessaging = function toggleMessagingCompat() {
            return ensureSocialRuntimeThen(openPortalMessagesCompat);
        };
    }
    if (typeof window.toggleNotifications !== 'function') {
        __compatApi.toggleNotifications = function toggleNotificationsCompat() {
            return ensureSocialRuntimeThen(openPortalNotificationsCompat);
        };
    }
    if (typeof window.resetRoleSwitchViewState !== 'function') {
        __compatApi.resetRoleSwitchViewState = function resetRoleSwitchViewStateFallback() {
            try { currentCourseId = ''; } catch (e) {}
            try { currentLmsQuizCourseKey = ''; } catch (e) {}
            if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
            if (typeof resetLmsLiveQuizRuntimeState === 'function') resetLmsLiveQuizRuntimeState();
            localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
            localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
            localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
        };
    }
    if (typeof window.clearTemporarySocialNavGlow !== 'function') {
        __compatApi.clearTemporarySocialNavGlow = function clearTemporarySocialNavGlowFallback() {
            document.querySelectorAll('[data-social-return-glow="true"]').forEach((item) => {
                item.removeAttribute('data-social-return-glow');
                item.classList.remove('active');
            });
        };
    }
    if (typeof window.applyTemporarySocialNavGlow !== 'function') {
        __compatApi.applyTemporarySocialNavGlow = function applyTemporarySocialNavGlowFallback() {
            if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
        };
    }
    if (typeof window.syncProfessorNavActiveState !== 'function') {
        __compatApi.syncProfessorNavActiveState = function syncProfessorNavActiveStateFallback() {
            const profNav = document.getElementById('prof-nav');
            if (!profNav) return;
            const pathname = (window.location.pathname || '').split('/').pop().toLowerCase();
            const activeSectionId = document.querySelector('.page-section.active-page')?.id || '';
            const activePage = (activeSectionId.replace(/^page-/, '') || pathname.replace(/\.html$/, '')).toLowerCase();
            let activeKey = 'home';
            if (activePage === 'gradebook') activeKey = 'home';
            else if (['faculty-schedule', 'timetable'].includes(activePage)) activeKey = 'timetable';
            else if (activePage === 'library') activeKey = 'library';
            else if (activePage === 'orders') activeKey = 'orders';
            else if (activePage === 'social') activeKey = 'social';
            else if (activePage === 'exams') activeKey = 'exams';

            profNav.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const selectorMap = {
                home: "[onclick*=\"navigate('home')\"]",
                'timetable': "[onclick*=\"navigate('faculty-schedule')\"],[onclick*=\"navigate('timetable')\"]",
                library: "[onclick*=\"navigate('library')\"]",
                orders: "[data-nav-orders]",
                social: "[data-nav-social]",
                exams: "[data-nav-exams]"
            };
            const activeItem = profNav.querySelector(selectorMap[activeKey] || selectorMap.home);
            if (activeItem) activeItem.classList.add('active');
        };
    }
    if (typeof window.ensureFacultyExamsNavLink !== 'function') {
        __compatApi.ensureFacultyExamsNavLink = function ensureFacultyExamsNavLinkFallback() {
            const profNav = document.getElementById('prof-nav');
            if (profNav && !profNav.querySelector('[data-nav-exams]')) {
                const navItem = document.createElement('div');
                navItem.className = 'nav-item prof-nav-link';
                navItem.dataset.navExams = 'true';
                navItem.id = 'nav-exams-faculty';
                navItem.setAttribute('onclick', "navigate('exams')");
                navItem.innerHTML = '<i class="fas fa-file-signature"></i> Exams';
                profNav.appendChild(navItem);
            }
            const examsNav = profNav?.querySelector('[data-nav-exams]');
            if (examsNav) {
                const isExamsPage = /exams\.html$/i.test(window.location.pathname || '') || (document.getElementById('page-exams')?.classList.contains('active-page') ?? false);
                examsNav.classList.toggle('active', isExamsPage);
            }
        };
    }
    if (typeof window.refreshStandalonePageContext !== 'function') {
        __compatApi.refreshStandalonePageContext = function refreshStandalonePageContextFallback() {
            const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!currentUser) return;
            const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : currentUser.role;

            if (typeof ensureOrdersNavLinks === 'function') ensureOrdersNavLinks();
            if (typeof ensureFacultyExamsNavLink === 'function') ensureFacultyExamsNavLink();

            if (typeof window.syncShellNavVisibility === 'function') {
                const activePage = typeof getCurrentPortalPageId === 'function' ? getCurrentPortalPageId() : 'home';
                window.syncShellNavVisibility(activePage, effectiveRole);
            }

            document.querySelectorAll('.admin-nav-link').forEach(item => {
                item.hidden = effectiveRole !== USER_ROLES.ADMIN;
            });

            const facultyProfile = typeof getFacultyProfile === 'function'
                ? getFacultyProfile(typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : currentUser.facultyCode || currentUser.faculty || 'ECON')
                : null;
            if (typeof populateProgramContextControls === 'function') {
                populateProgramContextControls(currentUser, facultyProfile);
            }
            if (typeof renderProfilePageContext === 'function') renderProfilePageContext(currentUser);
        };
    }
    if (typeof window.consumePendingSocialReturn !== 'function') {
        __compatApi.consumePendingSocialReturn = function consumePendingSocialReturnFallback() {
            const raw = localStorage.getItem('KIU_PENDING_SOCIAL_RETURN');
            if (!raw) return false;
            localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
            let payload = null;
            try {
                payload = JSON.parse(raw);
            } catch (error) {
                payload = null;
            }
            const sourcePage = String(payload?.sourcePage || '').toLowerCase();
            const payloadRole = String(payload?.role || '').toLowerCase();
            const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : (currentUserRole || 'student');
            if (payloadRole && payloadRole !== effectiveRole) {
                return false;
            }
            if (sourcePage && document.getElementById(`page-${sourcePage}`) && sourcePage !== 'social' && typeof navigate === 'function') {
                navigate(sourcePage);
            }
            if (typeof applyTemporarySocialNavGlow === 'function') {
                applyTemporarySocialNavGlow(effectiveRole);
            }
            return true;
        };
    }
    if (typeof window.ensureOrdersNavLinks !== 'function') {
        __compatApi.ensureOrdersNavLinks = function ensureOrdersNavLinksFallback() {
            const profNav = document.getElementById('prof-nav');
            if (profNav && !profNav.querySelector('[data-nav-orders]')) {
                const navItem = document.createElement('div');
                navItem.className = 'nav-item prof-nav-link';
                navItem.dataset.navOrders = 'true';
                navItem.innerHTML = '<i class="fas fa-book-open"></i> Orders';
                navItem.addEventListener('click', () => {
                    if (typeof navigate === 'function') navigate('orders');
                });
                profNav.appendChild(navItem);
            }
            const ordersNav = profNav?.querySelector('[data-nav-orders]');
            if (ordersNav) {
                const isOrdersPage = /orders\.html$/i.test(window.location.pathname || '');
                ordersNav.classList.toggle('active', isOrdersPage);
            }
        };
    }
    if (typeof window.refreshFacultyScheduleUI !== 'function') {
        __compatApi.refreshFacultyScheduleUI = function refreshFacultyScheduleUIFallback() {
            if (typeof renderFacultyScheduleWidgets === 'function') renderFacultyScheduleWidgets();
            if (typeof renderFacultySchedulePage === 'function') renderFacultySchedulePage();
        };
    }
    if (typeof window.syncCurriculumSubjectBuilderTarget !== 'function') {
        __compatApi.syncCurriculumSubjectBuilderTarget = function syncCurriculumSubjectBuilderTargetFallback(faculty = getCurrentFaculty()) {
            const normalizedFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(faculty, getCurrentFaculty())
                : faculty;
            const badge = document.getElementById('curriculum-form-module-target');
            const help = document.getElementById('curriculum-form-module-help');
            const saveBtn = document.getElementById('save-curriculum-subject-btn');
            const selectedModule = typeof getSelectedCurriculumLibraryModule === 'function'
                ? getSelectedCurriculumLibraryModule(normalizedFaculty)
                : null;

            if (badge) {
                badge.innerHTML = selectedModule
                    ? `<i class="fas fa-layer-group"></i><span>Target Module: ${escapeHtml(selectedModule.name || 'Selected module')}</span>`
                    : `<i class="fas fa-layer-group"></i><span>Target Module: No module selected</span>`;
            }
            if (help) {
                help.textContent = selectedModule
                    ? `New subjects will be saved into ${selectedModule.name || 'the selected module'}.`
                    : 'Create or select a curriculum module first, then save the subject into it.';
            }
            if (saveBtn) {
                saveBtn.disabled = !selectedModule;
                saveBtn.setAttribute('aria-disabled', selectedModule ? 'false' : 'true');
            }
        };
    }
    if (typeof window.populateAntiReqDropdown !== 'function') {
        __compatApi.populateAntiReqDropdown = function populateAntiReqDropdownFallback() {
            const picker = document.getElementById('new-subject-antireq-picker');
            if (!picker) return;
            const selectedValues = typeof getSelectedAntiReqCodes === 'function' ? getSelectedAntiReqCodes() : [];
            picker.innerHTML = `
                <div data-role="selected-anti-row" class="registration-antireq-selected-row">
                    ${selectedValues.length ? `Selected anti-requisites: ${escapeHtml(selectedValues.join(', '))}` : 'Anti-requisite picker will appear when the registration module is ready.'}
                </div>
            `;
        };
    }

        Object.keys(__compatApi).forEach(function (key) {
            if (typeof window[key] !== 'function') window[key] = __compatApi[key];
        });
        window.KiuPortalCompat = Object.assign(window.KiuPortalCompat || {}, __compatApi);
        return __compatApi;
    };

    window.__kiuCreatePortalCompatApi({});
})();
