/* Compatibility-first runtime/bootstrap slice extracted from core.js. Source of truth remains root core.js compatibility bundle. */

(function ensurePortalApiRuntimeAvailability() {
    const fallbackPromise = Promise.resolve(null);
    const noop = () => null;
    const asyncNoop = () => fallbackPromise;
    const asyncArray = () => Promise.resolve([]);
    const asyncNull = () => Promise.resolve(null);
    const portalUiNoop = () => null;
    portalUiNoop.__kiuFallback = true;

    function isFallbackPortalAction(fn) {
        return typeof fn === 'function' && fn.__kiuFallback === true;
    }

    function getFallbackNavigationRole() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const requested = String(params.get('view') || localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
            return requested || 'student';
        } catch (error) {
            return 'student';
        }
    }

    function resolveFallbackPortalRouteUrl(pageId, role = getFallbackNavigationRole()) {
        const normalizedRole = String(role || 'student').trim().toLowerCase() || 'student';
        const normalizedPageId = String(pageId === 'profile' ? 'profile-view' : (pageId || 'home')).trim().toLowerCase() || 'home';
        if (normalizedPageId === 'home') {
            return `index.html?view=${encodeURIComponent(normalizedRole)}#home`;
        }
        if (normalizedPageId === 'library' && normalizedRole === 'admin') return 'admin-library.html';
        if (normalizedPageId === 'orders' && normalizedRole === 'admin') return 'admin-orders.html';
        const routeMap = {
            'admin-tools': 'admin-tools.html',
            'admin-scheduler': 'admin-scheduler.html',
            'staff': 'staff.html',
            'students-admin': 'students-admin.html',
            'profile-view': 'profile-view.html',
            'social': 'social.html',
            'news': 'news.html',
            'exams': 'exams.html',
            'library': 'library.html',
            'orders': 'orders.html',
            'lms': 'lms.html',
            'programs': 'programs.html',
            'registration': 'registration.html',
            'study-card': 'study-card.html',
            'timetable': 'timetable.html',
            'gradebook': 'gradebook.html',
            'faculty-gradebook': 'faculty-gradebook.html',
            'faculty-schedule': 'faculty-schedule.html',
            'personal-data': 'personal-data.html',
            'student-service': 'student-service.html',
            'chancellery': 'chancellery.html',
            'calendar': 'calendar.html'
        };
        return routeMap[normalizedPageId] || `${normalizedPageId}.html`;
    }

    if (typeof window.resolvePortalRouteUrl !== 'function') {
        window.resolvePortalRouteUrl = resolveFallbackPortalRouteUrl;
    }

    function getFallbackRoutePageFromTrigger(trigger) {
        if (!trigger || typeof trigger.getAttribute !== 'function') return '';
        if (trigger.id === 'mob-act-profile') return 'profile-view';
        const explicitTarget = String(
            trigger.getAttribute('data-nav-target')
            || trigger.getAttribute('data-route-page')
            || trigger.getAttribute('data-registration-nav')
            || trigger.getAttribute('data-student-service-navigate')
            || ''
        ).trim();
        if (explicitTarget) return explicitTarget;
        if (trigger.hasAttribute('data-admin-focus')) return 'admin-tools';
        if (trigger.hasAttribute('data-nav-orders')) return 'orders';
        if (trigger.hasAttribute('data-nav-social')) return 'social';
        if (trigger.hasAttribute('data-nav-exams')) return 'exams';
        const onclick = String(trigger.getAttribute('onclick') || '');
        const match = onclick.match(/navigate\(['"]([^'"]+)['"]\)/);
        return match ? String(match[1] || '').trim() : '';
    }

    function performFallbackRouteNavigation(pageId) {
        const targetPage = String(pageId || '').trim();
        if (!targetPage) return false;
        if (typeof window.__kiuCoreNavigate === 'function') {
            window.__kiuCoreNavigate(targetPage);
            return true;
        }
        if (typeof window.navigate === 'function' && window.navigate.__kiuEarlyNavigateFallback !== true) {
            window.navigate(targetPage);
            return true;
        }
        const targetUrl = typeof window.resolvePortalRouteUrl === 'function'
            ? window.resolvePortalRouteUrl(targetPage, getFallbackNavigationRole())
            : resolveFallbackPortalRouteUrl(targetPage, getFallbackNavigationRole());
        window.location.assign(targetUrl);
        return true;
    }

    if (typeof window.navigate !== 'function') {
        const earlyNavigateFallback = function earlyNavigateFallback(pageId) {
            return performFallbackRouteNavigation(pageId);
        };
        earlyNavigateFallback.__kiuEarlyNavigateFallback = true;
        window.navigate = earlyNavigateFallback;
    }

    if (!window.__kiuRouteClickRescueInstalled) {
        document.addEventListener('click', function rescueRouteClick(event) {
            const target = event.target;
            const trigger = target && typeof target.closest === 'function'
                ? target.closest('#mob-act-profile,[data-nav-target],[data-route-page],[data-registration-nav],[data-student-service-navigate],[data-admin-focus],[data-nav-orders],[data-nav-social],[data-nav-exams],[onclick*="navigate("]')
                : null;
            if (!trigger) return;
            if (trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') return;
            if (typeof event.button === 'number' && event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const targetPage = getFallbackRoutePageFromTrigger(trigger);
            if (!targetPage) return;
            const beforeHref = window.location.href;
            window.setTimeout(() => {
                if (window.location.href !== beforeHref) return;
                performFallbackRouteNavigation(targetPage);
            }, 0);
        }, true);
        window.__kiuRouteClickRescueInstalled = true;
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

    if (typeof window.schedulePortalBackendBootstrap !== 'function') window.schedulePortalBackendBootstrap = noop;
    if (typeof window.queuePortalStateSync !== 'function') window.queuePortalStateSync = noop;
    if (typeof window.syncPortalBackendImpersonation !== 'function') window.syncPortalBackendImpersonation = asyncNoop;
    if (typeof window.fetchPortalPlatformStatus !== 'function') window.fetchPortalPlatformStatus = asyncNull;
    if (typeof window.fetchPortalIntegrationSystems !== 'function') window.fetchPortalIntegrationSystems = asyncArray;
    if (typeof window.fetchPortalSyncRuns !== 'function') window.fetchPortalSyncRuns = asyncArray;
    if (typeof window.fetchPortalSyncConflicts !== 'function') window.fetchPortalSyncConflicts = asyncArray;
    if (typeof window.fetchPortalAuditEvents !== 'function') window.fetchPortalAuditEvents = asyncArray;
    if (typeof window.createPortalAuditEvent !== 'function') window.createPortalAuditEvent = asyncNoop;
    if (typeof window.createPortalSyncRun !== 'function') window.createPortalSyncRun = asyncNoop;
    if (typeof window.createPortalSyncConflict !== 'function') window.createPortalSyncConflict = asyncNoop;
    if (typeof window.recordPortalAudit !== 'function') window.recordPortalAudit = asyncNoop;
    if (typeof window.recordPortalSyncRun !== 'function') window.recordPortalSyncRun = asyncNoop;
    if (typeof window.recordPortalSyncConflict !== 'function') window.recordPortalSyncConflict = asyncNoop;
    if (typeof window.uploadPortalStoredFile !== 'function') window.uploadPortalStoredFile = asyncNull;
    if (typeof window.getPortalStoredFileUrl !== 'function') window.getPortalStoredFileUrl = () => '';
    if (typeof window.getPortalRtcConfiguration !== 'function') window.getPortalRtcConfiguration = () => null;
    if (typeof window.applyPortalSocialState !== 'function') window.applyPortalSocialState = noop;
    if (typeof window.persistPortalSocialState !== 'function') window.persistPortalSocialState = asyncNull;
    if (typeof window.queuePortalSocialSync !== 'function') window.queuePortalSocialSync = noop;
    if (typeof window.bootstrapPortalSocialState !== 'function') window.bootstrapPortalSocialState = asyncNull;
    if (typeof window.schedulePortalSocialBootstrap !== 'function') window.schedulePortalSocialBootstrap = noop;
    if (typeof window.ensurePortalSocialGroupChatRecord !== 'function') window.ensurePortalSocialGroupChatRecord = asyncNull;
    if (typeof window.getNotificationSnapshot !== 'function') {
        const fallbackNotificationSnapshot = () => ({ unread: 0, items: [] });
        fallbackNotificationSnapshot.__kiuFallback = true;
        window.getNotificationSnapshot = fallbackNotificationSnapshot;
    }
    if (typeof window.getMessengerSnapshot !== 'function') {
        const fallbackMessengerSnapshot = () => ({ unread: 0, recent: [] });
        fallbackMessengerSnapshot.__kiuFallback = true;
        window.getMessengerSnapshot = fallbackMessengerSnapshot;
    }
    if (typeof window.renderPortalNotificationChrome !== 'function') window.renderPortalNotificationChrome = portalUiNoop;
    if (typeof window.openPortalNotificationFullModal !== 'function') window.openPortalNotificationFullModal = portalUiNoop;
    if (typeof window.openPortalMessengerFullModal !== 'function') window.openPortalMessengerFullModal = portalUiNoop;
    if (typeof window.openSocialMessengerWorkspace !== 'function') window.openSocialMessengerWorkspace = portalUiNoop;
    if (typeof window.toggleMessaging !== 'function') {
        window.toggleMessaging = function toggleMessagingCompat() {
            return ensureSocialRuntimeThen(openPortalMessagesCompat);
        };
    }
    if (typeof window.toggleNotifications !== 'function') {
        window.toggleNotifications = function toggleNotificationsCompat() {
            return ensureSocialRuntimeThen(openPortalNotificationsCompat);
        };
    }
    if (typeof window.resetRoleSwitchViewState !== 'function') {
        window.resetRoleSwitchViewState = function resetRoleSwitchViewStateFallback() {
            try { currentCourseId = ''; } catch (e) {}
            try { currentLmsQuizCourseKey = ''; } catch (e) {}
            if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
            localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
            localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
            localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
        };
    }
    if (typeof window.clearTemporarySocialNavGlow !== 'function') {
        window.clearTemporarySocialNavGlow = function clearTemporarySocialNavGlowFallback() {
            document.querySelectorAll('[data-social-return-glow="true"]').forEach((item) => {
                item.removeAttribute('data-social-return-glow');
                item.style.boxShadow = '';
                item.style.background = '';
                item.style.border = '';
                item.style.color = '';
            });
        };
    }
    if (typeof window.applyTemporarySocialNavGlow !== 'function') {
        window.applyTemporarySocialNavGlow = function applyTemporarySocialNavGlowFallback() {
            if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
        };
    }
    if (typeof window.syncProfessorNavActiveState !== 'function') {
        window.syncProfessorNavActiveState = function syncProfessorNavActiveStateFallback() {
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
        window.ensureFacultyExamsNavLink = function ensureFacultyExamsNavLinkFallback() {
            const profNav = document.getElementById('prof-nav');
            if (profNav && !profNav.querySelector('[data-nav-exams]')) {
                const navItem = document.createElement('div');
                navItem.className = 'nav-item prof-nav-link';
                navItem.dataset.navExams = 'true';
                navItem.id = 'nav-exams-faculty';
                navItem.setAttribute('onclick', "navigate('exams')");
                navItem.innerHTML = '<i class="fas fa-file-signature" style="display:block; margin-bottom:5px; font-size:16px;"></i> Exams';
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
        window.refreshStandalonePageContext = function refreshStandalonePageContextFallback() {
            const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!currentUser) return;
            const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : currentUser.role;

            if (typeof ensureOrdersNavLinks === 'function') ensureOrdersNavLinks();
            if (typeof ensureFacultyExamsNavLink === 'function') ensureFacultyExamsNavLink();

            const adminNav = document.getElementById('admin-nav');
            if (adminNav) {
                adminNav.style.display = effectiveRole === USER_ROLES.ADMIN ? 'flex' : 'none';
            }

            const profNav = document.getElementById('prof-nav');
            if (profNav) {
                profNav.style.display = (effectiveRole === USER_ROLES.PROFESSOR || effectiveRole === USER_ROLES.TA) ? 'flex' : 'none';
            }

            document.querySelectorAll('.admin-nav-link').forEach(item => {
                item.style.display = effectiveRole === USER_ROLES.ADMIN ? '' : 'none';
            });

            const facultyProfile = typeof getFacultyProfile === 'function'
                ? getFacultyProfile(typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : currentUser.facultyCode || currentUser.faculty || 'ECON')
                : null;
            if (typeof populateProgramContextControls === 'function') {
                populateProgramContextControls(currentUser, facultyProfile);
            }
            if (typeof renderExamsPageShellContext === 'function') renderExamsPageShellContext();
            if (typeof renderProfilePageContext === 'function') renderProfilePageContext(currentUser);
        };
    }
    if (typeof window.consumePendingSocialReturn !== 'function') {
        window.consumePendingSocialReturn = function consumePendingSocialReturnFallback() {
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
        window.ensureOrdersNavLinks = function ensureOrdersNavLinksFallback() {
            const profNav = document.getElementById('prof-nav');
            if (profNav && !profNav.querySelector('[data-nav-orders]')) {
                const navItem = document.createElement('div');
                navItem.className = 'nav-item prof-nav-link';
                navItem.dataset.navOrders = 'true';
                navItem.innerHTML = '<i class="fas fa-book-open" style="display:block; margin-bottom:5px; font-size:16px;"></i> Orders';
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
        window.refreshFacultyScheduleUI = function refreshFacultyScheduleUIFallback() {
            if (typeof renderFacultyScheduleWidgets === 'function') renderFacultyScheduleWidgets();
            if (typeof renderFacultySchedulePage === 'function') renderFacultySchedulePage();
        };
    }
    if (typeof window.syncCurriculumSubjectBuilderTarget !== 'function') {
        window.syncCurriculumSubjectBuilderTarget = function syncCurriculumSubjectBuilderTargetFallback(faculty = getCurrentFaculty()) {
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
                saveBtn.style.opacity = selectedModule ? '1' : '0.6';
                saveBtn.style.cursor = selectedModule ? 'pointer' : 'not-allowed';
            }
        };
    }
    if (typeof window.populateAntiReqDropdown !== 'function') {
        window.populateAntiReqDropdown = function populateAntiReqDropdownFallback() {
            const picker = document.getElementById('new-subject-antireq-picker');
            if (!picker) return;
            const selectedValues = typeof getSelectedAntiReqCodes === 'function' ? getSelectedAntiReqCodes() : [];
            picker.innerHTML = `
                <div style="padding:10px; font-size:12px; color:var(--kiu-text-muted);">
                    ${selectedValues.length ? `Selected anti-requisites: ${escapeHtml(selectedValues.join(', '))}` : 'Anti-requisite picker will appear when the registration module is ready.'}
                </div>
            `;
        };
    }
    function normalizePeopleFacultyFilter(facultyFilter = getCurrentFaculty()) {
        if (facultyFilter === 'all') return 'all';
        return normalizeFacultyCode(facultyFilter || getCurrentFaculty() || 'ECON', 'ECON');
    }

    function isEvenSemester() {
        const configuredSemester = parseInt(KIU_STATE?.activeSemester ?? KIU_EMPTY_STATE?.activeSemester, 10);
        if (Number.isFinite(configuredSemester) && configuredSemester > 0) {
            return configuredSemester % 2 === 0;
        }
        const now = new Date();
        const month = now.getMonth() + 1;
        return month >= 2 && month <= 7;
    }

    function calculateStudentSemester(course) {
        if (!course) return null;
        return course * 2 - (isEvenSemester() ? 0 : 1);
    }

    function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty()) {
        const facultyProfiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE.facultyProfiles)
            || {};
        const normalizedFilter = normalizePeopleFacultyFilter(facultyFilter);
        const result = [];
        Object.keys(facultyProfiles).forEach((fac) => {
            const normalizedFaculty = normalizeFacultyCode(fac, fac);
            if (normalizedFilter !== 'all' && normalizedFaculty !== normalizedFilter) return;
            const members = facultyProfiles[fac]?.[type] || [];
            members.forEach((member) => {
                result.push({
                    ...member,
                    facultyCode: normalizedFaculty,
                    faculty: normalizedFaculty,
                    facultyName: facultyProfiles[fac]?.name || fac
                });
            });
        });
        return result;
    }

    function getAllStudents(facultyFilter = getCurrentFaculty()) {
        const facultyProfiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE.facultyProfiles)
            || {};
        const normalizedFilter = normalizePeopleFacultyFilter(facultyFilter);
        const result = [];
        Object.keys(facultyProfiles).forEach((fac) => {
            const normalizedFaculty = normalizeFacultyCode(fac, fac);
            if (normalizedFilter !== 'all' && normalizedFaculty !== normalizedFilter) return;
            (facultyProfiles[fac]?.students || []).forEach((student) => {
                const course = student.course || Math.ceil((student.semester || 1) / 2);
                const explicitSemester = parseInt(student.semester, 10);
                result.push({
                    ...student,
                    course,
                    semester: Number.isFinite(explicitSemester) && explicitSemester > 0
                        ? explicitSemester
                        : calculateStudentSemester(course),
                    facultyCode: normalizedFaculty,
                    faculty: normalizedFaculty,
                    facultyName: facultyProfiles[fac]?.name || fac
                });
            });
        });
        return result;
    }

    if (typeof window.normalizePeopleFacultyFilter !== 'function') {
        window.normalizePeopleFacultyFilter = normalizePeopleFacultyFilter;
    }
    if (typeof window.isEvenSemester !== 'function') {
        window.isEvenSemester = isEvenSemester;
    }
    if (typeof window.calculateStudentSemester !== 'function') {
        window.calculateStudentSemester = calculateStudentSemester;
    }
    if (typeof window.getAllStaff !== 'function') {
        window.getAllStaff = getAllStaff;
    }
    if (typeof window.getAllStudents !== 'function') {
        window.getAllStudents = getAllStudents;
    }
    function normalizeGradebookGroupIdentifier(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }

    if (typeof window.getEnrolledStudentsForGroup !== 'function') {
        window.getEnrolledStudentsForGroup = function getEnrolledStudentsForGroup(courseId, groupId) {
            const domain = getDomain();
            const students = [];
            const seen = new Set();
            const normalizedCourseId = canonicalCourseKey(courseId);
            const normalizedGroupId = canonicalCourseKey(groupId);
            const targetGroup = (typeof getAvailableGroupsForSubject === 'function' ? getAvailableGroupsForSubject(courseId) : (KIU_STATE.availableGroups?.[courseId] || []))
                .find(group => canonicalCourseKey(group?.id || group?.groupId || group?.name || '') === normalizedGroupId);
            const targetFaculty = normalizeFacultyCode(targetGroup?.faculty || (typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(courseId) : '') || '', '');
            Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
                const scheduleEntries = Array.isArray(schedule)
                    ? schedule
                    : (schedule && typeof schedule === 'object')
                        ? Object.entries(schedule).map(([scheduledCourseId, scheduledGroupId]) => ({
                            courseId: scheduledCourseId,
                            groupId: scheduledGroupId
                        }))
                        : [];
                const isEnrolled = scheduleEntries.some(item => (
                    canonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
                    && canonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
                    && (!targetFaculty || normalizeFacultyCode(item?.faculty || targetFaculty, targetFaculty) === targetFaculty)
                ));
                if (!isEnrolled || seen.has(studentId)) return;
                const student = domain.usersById?.[studentId] || getAllStudents(targetFaculty || 'all').find(item => item.id === studentId);
                if (targetFaculty && normalizeFacultyCode(student?.facultyCode || student?.faculty || '', '') !== targetFaculty) return;
                students.push({
                    id: studentId,
                    name: student?.name || student?.nameEn || `Student ${studentId}`
                });
                seen.add(studentId);
            });
            return students.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        };
    }

    if (typeof window.syncAvailableGroupEnrollmentCounts !== 'function') {
        window.syncAvailableGroupEnrollmentCounts = function syncAvailableGroupEnrollmentCounts() {
            Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, groups]) => {
                (groups || []).forEach(group => {
                    group.registered = getEnrolledStudentsForGroup(courseId, group.id).length;
                });
            });
        };
    }

    if (typeof window.resolveGradebookRosterKey !== 'function') {
        window.resolveGradebookRosterKey = function resolveGradebookRosterKey(courseId, groupId, enrolledStudents = []) {
            const keys = Object.keys(KIU_STATE.studentGrades || {});
            const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
            const groupNorm = normalizeGradebookGroupIdentifier(groupId);
            const courseNorm = normalizeGradebookGroupIdentifier(courseId);
            const subjectCodeNorm = normalizeGradebookGroupIdentifier(subject?.code || '');
            const firstSegmentNorm = normalizeGradebookGroupIdentifier(String(courseId || '').split('-')[0]);
            const exactCandidates = [
                `${String(courseId || '').toLowerCase()}_${String(groupId || '').toLowerCase()}`,
                `${courseNorm}_${groupNorm}`,
                `${subjectCodeNorm}_${groupNorm}`,
                `${firstSegmentNorm}_${groupNorm}`
            ].filter(Boolean);

            for (const candidate of exactCandidates) {
                if (keys.includes(candidate)) return candidate;
            }

            const enrolledIds = new Set((enrolledStudents || []).map(student => student.id));
            let bestKey = null;
            let bestScore = -1;

            keys.forEach(key => {
                let score = 0;
                if (normalizeGradebookGroupIdentifier(key).endsWith(groupNorm)) score += 2;
                const roster = KIU_STATE.studentGrades[key] || [];
                roster.forEach(student => {
                    if (enrolledIds.has(student.id)) score += 4;
                });
                if (score > bestScore) {
                    bestScore = score;
                    bestKey = key;
                }
            });

            return bestKey || `${courseNorm || 'course'}_${groupNorm || 'group'}`;
        };
    }

    if (typeof window.buildGradebookStudents !== 'function') {
        window.buildGradebookStudents = function buildGradebookStudents(courseId, groupId) {
            const enrolledStudents = getEnrolledStudentsForGroup(courseId, groupId);
            const rosterKey = resolveGradebookRosterKey(courseId, groupId, enrolledStudents);
            const existingRoster = JSON.parse(JSON.stringify(KIU_STATE.studentGrades?.[rosterKey] || []))
                .map(student => ensureGradeRecordHistories(student));

            if (!enrolledStudents.length) {
                return {
                    rosterKey,
                    students: existingRoster
                };
            }

            const mergedStudents = enrolledStudents.map(student => {
                const existing = existingRoster.find(entry => entry.id === student.id) || {};
                return ensureGradeRecordHistories({
                    id: student.id,
                    name: existing.name || student.name,
                    q1: existing.q1 || 0,
                    qa: existing.qa || 0,
                    mid: existing.mid || 0,
                    final: existing.final || 0,
                    assessments: existing.assessments || {}
                });
            });

            return {
                rosterKey,
                students: mergedStudents
            };
        };
    }

    if (typeof window.getGradebookGroupsForCurrentUser !== 'function') {
        window.getGradebookGroupsForCurrentUser = function getGradebookGroupsForCurrentUser() {
            const currentUser = getCurrentUser();
            const currentFaculty = getCurrentFaculty();
            const currentName = currentUser?.name || currentUser?.nameEn || '';
            const semesterFilter = String(document.getElementById('fs-filter-sem')?.value || '').trim();
            const facultyFilter = String(document.getElementById('fs-filter-fac')?.value || currentFaculty || '').trim();
            const groups = [];

            Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, courseGroups]) => {
                (courseGroups || []).forEach(group => {
                    if (semesterFilter && semesterFilter !== 'all' && String(group?.semester || KIU_STATE.activeSemester || '').trim() !== semesterFilter) return;
                    if (facultyFilter && facultyFilter !== 'all' && String(group?.faculty || '').trim() && String(group.faculty).trim() !== facultyFilter) return;
                    const isAssigned = currentUser?.role === USER_ROLES.ADMIN
                        ? (!currentFaculty || currentFaculty === 'all' || group.faculty === currentFaculty)
                        : (group.prof === currentName || group.ta === currentName);
                    if (!isAssigned) return;

                    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
                    const enrolledStudents = getEnrolledStudentsForGroup(courseId, group.id);
                    groups.push({
                        courseId,
                        groupId: group.id,
                        groupName: group.name || group.id,
                        subjectName: subject?.name || courseId,
                        icon: subject?.icon || 'fas fa-book',
                        day: group.day,
                        time: group.time,
                        duration: group.duration,
                        room: group.room,
                        semester: group.semester,
                        capacity: group.capacity || 40,
                        enrolledCount: enrolledStudents.length || group.registered || 0
                    });
                });
            });

            return groups.sort((a, b) => String(a.subjectName).localeCompare(String(b.subjectName)) || String(a.groupName).localeCompare(String(b.groupName)));
        };
    }
    if (typeof window.resolveCanonicalLmsResourceKey !== 'function') {
        window.resolveCanonicalLmsResourceKey = function resolveCanonicalLmsResourceKey(resourceKey) {
            return String(resourceKey || '').trim();
        };
    }
    if (typeof window.normalizeLmsQuizAssessmentType !== 'function') {
        window.normalizeLmsQuizAssessmentType = function normalizeLmsQuizAssessmentType(value = 'quiz') {
            const normalized = String(value || 'quiz').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const aliases = {
                quiz: 'quiz',
                oral: 'oral-quiz',
                oralquiz: 'oral-quiz',
                'oral-quiz': 'oral-quiz',
                midterm: 'midterm',
                'midterm-exam': 'midterm',
                final: 'final',
                'final-exam': 'final',
                retake: 'retake'
            };
            return aliases[normalized] || 'quiz';
        };
    }
    if (typeof window.getLmsQuizById !== 'function') {
        window.getLmsQuizById = function getLmsQuizById(resourceKey, quizId) {
            const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
            const workspace = KIU_STATE?.lmsQuizBuilder?.[normalizedResourceKey];
            const quizzes = Array.isArray(workspace?.quizzes) ? workspace.quizzes : [];
            return quizzes.find(item => String(item?.id || '') === String(quizId || '')) || null;
        };
    }
    if (typeof window.getLmsQuizSubmission !== 'function') {
        window.getLmsQuizSubmission = function getLmsQuizSubmission(resourceKey, quizId, studentId) {
            const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
            const workspace = KIU_STATE?.lmsQuizBuilder?.[normalizedResourceKey];
            const quizStore = workspace?.submissions?.[quizId] || KIU_STATE?.groupQuizSubmissions?.[normalizedResourceKey]?.[quizId] || {};
            return quizStore?.[String(studentId || '')] || null;
        };
    }
    if (typeof window.resolveLmsQuizSourceFromAssessmentEntry !== 'function') {
        window.resolveLmsQuizSourceFromAssessmentEntry = function resolveLmsQuizSourceFromAssessmentEntry(entry = {}) {
            const resourceKey = resolveCanonicalLmsResourceKey(String(entry?.sourceResourceKey || '').trim());
            const quizId = String(entry?.sourceQuizId || '').trim();
            if (!resourceKey || !quizId) return null;
            const quiz = typeof getLmsQuizById === 'function' ? getLmsQuizById(resourceKey, quizId) : null;
            if (!quiz) return null;
            return { resourceKey, quizId, quiz };
        };
    }
    if (typeof window.getAssessmentEntryDisplayContext !== 'function') {
        window.getAssessmentEntryDisplayContext = function getAssessmentEntryDisplayContext(criterion, entry = {}) {
            const normalizedCriterion = typeof normalizeGradebookCriterion === 'function'
                ? normalizeGradebookCriterion(criterion)
                : String(criterion || 'quiz').trim().toLowerCase();
            const criterionMeta = typeof getGradebookCriterionMeta === 'function'
                ? getGradebookCriterionMeta(normalizedCriterion)
                : {
                    key: normalizedCriterion,
                    label: normalizedCriterion || 'Assessment',
                    pluralLabel: `${normalizedCriterion || 'Assessment'}s`
                };
            const entryNumber = typeof normalizeAssessmentNumber === 'function'
                ? normalizeAssessmentNumber(entry?.number, 1)
                : Math.max(1, parseInt(entry?.number, 10) || 1);
            const manualTitle = String(entry?.title || entry?.name || '').trim();
            const linked = typeof resolveLmsQuizSourceFromAssessmentEntry === 'function'
                ? resolveLmsQuizSourceFromAssessmentEntry(entry)
                : null;
            if (!linked?.quiz) {
                return {
                    title: manualTitle || `${criterionMeta.label} ${entryNumber}`,
                    subtitle: '',
                    criterionMeta,
                    entryNumber,
                    linked: null
                };
            }
            const context = typeof resolveActiveLmsQuizContext === 'function'
                ? (resolveActiveLmsQuizContext(linked.resourceKey) || {})
                : {};
            const quiz = linked.quiz;
            return {
                title: String(quiz.title || '').trim() || manualTitle || `${criterionMeta.label} ${entryNumber}`,
                subtitle: [
                    typeof getLmsQuizDisplayLabel === 'function' ? getLmsQuizDisplayLabel(quiz) : '',
                    quiz.weekLabel,
                    context.subject?.name,
                    context.group?.name
                ].filter(Boolean).join('  -  '),
                criterionMeta,
                entryNumber,
                linked
            };
        };
    }
    if (typeof window.getPublicSocialDisplayName !== 'function') {
        window.getPublicSocialDisplayName = function getPublicSocialDisplayNameFallback(user) {
            if (!user) return 'Portal User';
            const rawName = user.nameEn || user.name || user.email || user.id || 'Portal User';
            if (typeof cleanupEncodingArtifacts === 'function' && typeof toEnglishText === 'function') {
                return cleanupEncodingArtifacts(toEnglishText(rawName));
            }
            return String(rawName);
        };
    }
    if (typeof window.ensureSubjectSemesterParityHint !== 'function') {
        window.ensureSubjectSemesterParityHint = function ensureSubjectSemesterParityHintFallback() {
            if (typeof refreshSemesterDropdowns === 'function') refreshSemesterDropdowns();

            const semesterSelect = document.getElementById('new-subject-semester');
            if (!semesterSelect) return;

            let hint = document.getElementById('new-subject-semester-parity-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'new-subject-semester-parity-hint';
                hint.style.fontSize = '11px';
                hint.style.marginTop = '8px';
                hint.style.color = '#475569';
                hint.style.lineHeight = '1.35';
                semesterSelect.insertAdjacentElement('afterend', hint);
            }

            let exceptionWrap = document.getElementById('new-subject-semester-parity-exception-wrap');
            if (!exceptionWrap) {
                exceptionWrap = document.createElement('div');
                exceptionWrap.id = 'new-subject-semester-parity-exception-wrap';
                exceptionWrap.style.marginTop = '8px';
                exceptionWrap.style.display = 'flex';
                exceptionWrap.style.alignItems = 'center';
                exceptionWrap.style.gap = '8px';
                exceptionWrap.style.fontSize = '11px';
                exceptionWrap.style.color = '#334155';
                exceptionWrap.innerHTML = `
                    <input id="new-subject-parity-both-checkbox" type="checkbox" style="margin:0;">
                    <label for="new-subject-parity-both-checkbox" style="cursor:pointer;">
                        Exception: allow this subject for both odd and even student semesters
                    </label>
                `;
                hint.insertAdjacentElement('afterend', exceptionWrap);
            }

            const exceptionCheckbox = document.getElementById('new-subject-parity-both-checkbox');
            const describeParity = (semester) => {
                const sem = Number(semester);
                if (!Number.isFinite(sem) || sem <= 0) {
                    return 'Semester parity rule will be shown after selecting a valid semester.';
                }
                return sem % 2 === 1
                    ? `Semester ${sem} is ODD: this subject is available to odd-semester students (1/3/5/7/9...), if prerequisite is none or passed.`
                    : `Semester ${sem} is EVEN: this subject is available to even-semester students (2/4/6/8...), if prerequisite is none or passed.`;
            };
            const updateHint = () => {
                const semValue = parseInt(semesterSelect.value, 10);
                const baseText = describeParity(semValue);
                const exceptionText = exceptionCheckbox?.checked
                    ? ' Exception is ON: this subject will be available in both odd and even semesters (prerequisite still applies).'
                    : '';
                hint.textContent = `${baseText}${exceptionText}`;
            };

            if (!semesterSelect.dataset.parityHintBound) {
                semesterSelect.addEventListener('change', updateHint);
                semesterSelect.dataset.parityHintBound = '1';
            }
            if (exceptionCheckbox && !exceptionCheckbox.dataset.parityHintBound) {
                exceptionCheckbox.addEventListener('change', updateHint);
                exceptionCheckbox.dataset.parityHintBound = '1';
            }

            updateHint();
        };
    }
    if (typeof window.renderAdminQaTestingCard !== 'function') {
        window.renderAdminQaTestingCard = function renderAdminQaTestingCardFallback() {
            const existingCard = document.getElementById('admin-qa-test-card');
            if (existingCard) existingCard.remove();
        };
    }

    function normalizeRuntimeScriptPath(src) {
        const raw = String(src || '').trim();
        if (!raw) return '';
        try {
            return new URL(raw, window.location.href).pathname.replace(/\\/g, '/').toLowerCase();
        } catch (error) {
            return raw.split('?')[0].replace(/\\/g, '/').toLowerCase();
        }
    }

    function findExistingRuntimeScript(src) {
        const targetPath = normalizeRuntimeScriptPath(src);
        if (!targetPath) return null;
        return Array.from(document.scripts || []).find((script) => {
            const candidate = script.getAttribute('src') || script.src || '';
            return normalizeRuntimeScriptPath(candidate) === targetPath;
        }) || null;
    }

    function hasRuntimeScriptAlreadyExecuted(script) {
        if (!script) return false;
        if (
            script.dataset.kiuLoaded === '1'
            || script.dataset.kiuStatic === '1'
            || script.readyState === 'loaded'
            || script.readyState === 'complete'
        ) {
            return true;
        }
        const current = document.currentScript;
        if (current && current !== script) {
            try {
                if (script.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return true;
                }
            } catch (error) { }
        }
        return !current && document.readyState !== 'loading';
    }

    function loadRuntimeScriptOnce(src) {
        return new Promise((resolve, reject) => {
            const existing = findExistingRuntimeScript(src);
            if (existing) {
                const markLoaded = () => {
                    existing.dataset.kiuLoaded = '1';
                    resolve(true);
                };
                if (hasRuntimeScriptAlreadyExecuted(existing)) {
                    markLoaded();
                    return;
                }
                existing.addEventListener('load', markLoaded, { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            script.onload = () => {
                script.dataset.kiuLoaded = '1';
                resolve(true);
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    const SOCIAL_RUNTIME_SCRIPT_GROUPS = [
        ['assets/js/shared/social-runtime-lite.js?v=20260429-portfolio1'],
        [
            'assets/js/pages/social-mobile.js?v=20260429-portfolio1',
            'assets/js/pages/social-page.js?v=20260510-social-ux100'
        ]
    ];
    let socialRuntimeLoadPromise = null;
    window.ensurePortalSocialRuntimeLoaded = function ensurePortalSocialRuntimeLoaded() {
        const needsRebuiltSocialPage = Boolean(document.getElementById('public-social-root'));
        const hasRebuiltSocialShell = needsRebuiltSocialPage
            && window.__KIU_SOCIAL_PAGE_REBUILT
            && window.__KIU_SOCIAL_MOBILE_SHELL_INIT;
        if (
            window.__KIU_SOCIAL_RUNTIME_LOADED
            || (
                window.__KIU_SOCIAL_RUNTIME_READY
                && typeof window.renderPublicSocialPage === 'function'
                && typeof window.openPortalDirectChat === 'function'
                && (!needsRebuiltSocialPage || window.__KIU_SOCIAL_PAGE_REBUILT)
            )
        ) {
            window.__KIU_SOCIAL_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (socialRuntimeLoadPromise) return socialRuntimeLoadPromise;
        const scriptGroups = hasRebuiltSocialShell
            ? [SOCIAL_RUNTIME_SCRIPT_GROUPS[0]]
            : SOCIAL_RUNTIME_SCRIPT_GROUPS;
        socialRuntimeLoadPromise = scriptGroups
            .reduce((chain, group) => chain.then(() => Promise.all(group.map(loadRuntimeScriptOnce))), Promise.resolve())
            .then(() => {
                window.__KIU_SOCIAL_RUNTIME_LOADED = true;
                if (typeof window.hydratePortalSocialRuntime === 'function') {
                    return Promise.resolve(window.hydratePortalSocialRuntime()).then(() => true).catch(() => true);
                }
                return true;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the social runtime.', error);
                socialRuntimeLoadPromise = null;
                return false;
        });
        return socialRuntimeLoadPromise;
    };

    const NEWS_RUNTIME_SCRIPT = 'assets/js/pages/news.js?v=20260516-newsroute3';
    let newsRuntimeLoadPromise = null;
    window.ensurePortalNewsRuntimeLoaded = function ensurePortalNewsRuntimeLoaded() {
        if (typeof window.renderNewsWorkspace === 'function' && typeof window.renderNewsPageShellContext === 'function') {
            window.__KIU_NEWS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_NEWS_RUNTIME_LOADED) return Promise.resolve(true);
        if (newsRuntimeLoadPromise) return newsRuntimeLoadPromise;
        newsRuntimeLoadPromise = loadRuntimeScriptOnce(NEWS_RUNTIME_SCRIPT)
            .then(() => {
                window.__KIU_NEWS_RUNTIME_LOADED = typeof window.renderNewsWorkspace === 'function';
                return window.__KIU_NEWS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the news runtime.', error);
                newsRuntimeLoadPromise = null;
                return false;
        });
        return newsRuntimeLoadPromise;
    };

    const STUDENT_SERVICE_RUNTIME_SCRIPT = 'assets/js/pages/student-service.js?v=20260505-studentsvc-account-fades2';
    let studentServiceRuntimeLoadPromise = null;
    window.ensurePortalStudentServiceRuntimeLoaded = function ensurePortalStudentServiceRuntimeLoaded() {
        if (typeof window.renderStudentServicePage === 'function') {
            window.__KIU_STUDENT_SERVICE_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_STUDENT_SERVICE_RUNTIME_LOADED) return Promise.resolve(true);
        if (studentServiceRuntimeLoadPromise) return studentServiceRuntimeLoadPromise;
        studentServiceRuntimeLoadPromise = loadRuntimeScriptOnce(STUDENT_SERVICE_RUNTIME_SCRIPT)
            .then(() => {
                window.__KIU_STUDENT_SERVICE_RUNTIME_LOADED = typeof window.renderStudentServicePage === 'function';
                return window.__KIU_STUDENT_SERVICE_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the Student Service runtime.', error);
                studentServiceRuntimeLoadPromise = null;
                return false;
        });
        return studentServiceRuntimeLoadPromise;
    };

    const ORDERS_RUNTIME_SCRIPT = 'assets/js/shared/orders-workspace.js?v=20260516-orders-workspace1';
    let ordersRuntimeLoadPromise = null;
    window.ensurePortalOrdersRuntimeLoaded = function ensurePortalOrdersRuntimeLoaded() {
        if (typeof window.renderOrdersInboxPage === 'function') {
            window.__KIU_ORDERS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_ORDERS_RUNTIME_LOADED) return Promise.resolve(true);
        if (ordersRuntimeLoadPromise) return ordersRuntimeLoadPromise;
        ordersRuntimeLoadPromise = loadRuntimeScriptOnce(ORDERS_RUNTIME_SCRIPT)
            .then(() => {
                window.__KIU_ORDERS_RUNTIME_LOADED = typeof window.renderOrdersInboxPage === 'function';
                return window.__KIU_ORDERS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the orders runtime.', error);
                ordersRuntimeLoadPromise = null;
                return false;
        });
        return ordersRuntimeLoadPromise;
    };

    const LIBRARY_RUNTIME_SCRIPT = 'assets/js/pages/library.js?v=20260518-libraryshell1';
    let libraryRuntimeLoadPromise = null;
    window.ensurePortalLibraryRuntimeLoaded = function ensurePortalLibraryRuntimeLoaded() {
        if (typeof window.renderLibraryPageShellContext === 'function') {
            window.__KIU_LIBRARY_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_LIBRARY_RUNTIME_LOADED) return Promise.resolve(true);
        if (libraryRuntimeLoadPromise) return libraryRuntimeLoadPromise;
        libraryRuntimeLoadPromise = loadRuntimeScriptOnce(LIBRARY_RUNTIME_SCRIPT)
            .then(() => {
                window.__KIU_LIBRARY_RUNTIME_LOADED = typeof window.renderLibraryPageShellContext === 'function';
                return window.__KIU_LIBRARY_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the library runtime.', error);
                libraryRuntimeLoadPromise = null;
                return false;
            });
        return libraryRuntimeLoadPromise;
    };

    const LMS_RUNTIME_SCRIPT = 'assets/js/pages/lms.js?v=20260514-lmsperf4';
    let lmsRuntimeLoadPromise = null;
    window.ensurePortalLmsRuntimeLoaded = function ensurePortalLmsRuntimeLoaded() {
        if (typeof window.openLMSCourse === 'function' && typeof window.switchLMSTab === 'function') {
            window.__KIU_LMS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_LMS_RUNTIME_LOADED) return Promise.resolve(true);
        if (lmsRuntimeLoadPromise) return lmsRuntimeLoadPromise;
        lmsRuntimeLoadPromise = loadRuntimeScriptOnce(LMS_RUNTIME_SCRIPT)
            .then(() => {
                window.__KIU_LMS_RUNTIME_LOADED = typeof window.openLMSCourse === 'function' && typeof window.switchLMSTab === 'function';
                return window.__KIU_LMS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the LMS runtime.', error);
                lmsRuntimeLoadPromise = null;
                return false;
            });
        return lmsRuntimeLoadPromise;
    };

    const REGISTRATION_RUNTIME_SCRIPTS = [
        'assets/js/pages/gradebook.js?v=20260430-lmsgrades1',
        'assets/js/pages/lms.js?v=20260430-anticheatsimple3',
        'assets/js/pages/registration.js?v=20260429-facultyisolation1',
        'assets/js/pages/planner.js?v=20260430-lmsgrades1',
        'assets/js/pages/directories.js?v=20260429-peopleisolation1',
        'assets/js/pages/student-registration.js?v=20260430-lmsgrades1',
        'assets/js/pages/admin-registration.js?v=20260413-hotfix11'
    ];
    const REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS = [
        'assets/js/pages/timetable-runtime.js?v=20260516-surface-split1',
        'assets/js/pages/student-registration.js?v=20260430-lmsgrades1',
        'assets/js/pages/registration-student-route.js?v=20260516-studentroutesplit1'
    ];
    let registrationRuntimeLoadPromise = null;
    function isStandaloneRegistrationRoute() {
        return Boolean(document.getElementById('page-registration') && document.body.classList.contains('lux-route-registration'));
    }
    window.ensurePortalRegistrationRuntimeLoaded = function ensurePortalRegistrationRuntimeLoaded() {
        const isStudentRoute = isStandaloneRegistrationRoute();
        if (isStudentRoute) {
            if (
                typeof window.renderStudentRegStructures === 'function'
                && typeof window.refreshRegistrationUI === 'function'
                && typeof window.updateEctsProgress === 'function'
            ) {
                window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
                return Promise.resolve(true);
            }
        } else if (
            typeof window.renderCurriculumTable === 'function'
            && typeof window.bootAdminRegistrationCms === 'function'
            && typeof window.bindFacultyRegistrationCmsData === 'function'
        ) {
            window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_REGISTRATION_RUNTIME_LOADED) return Promise.resolve(true);
        if (registrationRuntimeLoadPromise) return registrationRuntimeLoadPromise;
        const scriptsToLoad = isStudentRoute ? REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS : REGISTRATION_RUNTIME_SCRIPTS;
        registrationRuntimeLoadPromise = scriptsToLoad
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
                return true;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the registration runtime.', error);
                registrationRuntimeLoadPromise = null;
                return false;
            });
        return registrationRuntimeLoadPromise;
    };

    if (window.__KIU_API_RUNTIME_LOADED || window.__KIU_API_RUNTIME_REQUESTED) return;
    const currentScript = document.currentScript;
    if (!currentScript || !currentScript.src) return;
    const currentUrl = new URL(currentScript.src, window.location.href);
    const apiUrl = new URL('./api.js', currentUrl);
    apiUrl.search = currentUrl.search;
    const existingApiScript = Array.from(document.scripts || []).find((scriptEl) => {
        if (!scriptEl?.src) return false;
        try {
            const scriptUrl = new URL(scriptEl.src, window.location.href);
            return scriptUrl.pathname === apiUrl.pathname;
        } catch (error) {
            return false;
        }
    });
    if (existingApiScript) return;
    window.__KIU_API_RUNTIME_REQUESTED = true;

    const script = document.createElement('script');
    script.src = apiUrl.toString();
    script.async = false;
    script.onload = () => {
        window.__KIU_API_RUNTIME_REQUESTED = false;
    };
    script.onerror = () => {
        window.__KIU_API_RUNTIME_REQUESTED = false;
    };
    const insertionParent = currentScript.parentNode || document.head;
    if (currentScript.parentNode) {
        insertionParent.insertBefore(script, currentScript.nextSibling);
        return;
    }
    document.head.appendChild(script);
})();

const USER_ROLES = {
    STUDENT: 'student',
    PROFESSOR: 'professor',
    TA: 'ta',
    ADMIN: 'admin',
    STUDENT_SERVICE: 'student_service'
};

const ACTIVE_SESSION_KEY = 'KIU_ACTIVE_SESSION_USER_ID';
const ACTIVE_ROLE_IMPERSONATION_KEY = 'KIU_ACTIVE_ROLE_IMPERSONATION';
const PENDING_ROLE_SWITCH_KEY = 'KIU_PENDING_ROLE_SWITCH_ROLE';
const MANUAL_TESTING_STATE_VERSION = 6;
const REAL_TESTING_CLEANUP_FLAG = 'KIU_REAL_TESTING_CLEANUP_V6';
const TIMETABLE_WEEK_STORAGE_KEY = 'KIU_TIMETABLE_WEEK_START';
const PROFILE_CALENDAR_WEEK_STORAGE_KEY = 'KIU_PROFILE_CALENDAR_WEEK_START';
const SCHEDULER_WEEK_STORAGE_KEY = 'KIU_SCHEDULER_WEEK_START';
const PERMISSION_MATRIX = {
    [USER_ROLES.STUDENT]: ['portal.student', 'registration.manage', 'lms.view', 'library.view', 'orders.view'],
    [USER_ROLES.PROFESSOR]: ['portal.professor', 'gradebook.manage', 'attendance.manage', 'lms.manage', 'profile.view'],
    [USER_ROLES.TA]: ['portal.ta', 'attendance.manage', 'gradebook.view', 'lms.assist', 'profile.view'],
    [USER_ROLES.STUDENT_SERVICE]: ['portal.student_service', 'student-service.manage', 'knowledge.manage', 'library.view', 'orders.view'],
    [USER_ROLES.ADMIN]: ['*']
};

// Check if role is stored in localStorage
let currentUserRole = (() => {
    try {
        const storedRole = localStorage.getItem('currentUserRole');
        const pendingRole = localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const rawAuthState = localStorage.getItem('KIU_AUTH_STATE');
        const authState = rawAuthState ? JSON.parse(rawAuthState) : null;
        const authenticatedRole = String(authState?.role || '').trim().toLowerCase();
        if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) {
            return authenticatedRole;
        }
        if (authenticatedRole === USER_ROLES.ADMIN && Object.values(USER_ROLES).includes(pendingRole) && pendingRole !== USER_ROLES.ADMIN) {
            return pendingRole;
        }
        return Object.values(USER_ROLES).includes(storedRole)
            ? storedRole
            : (authenticatedRole || USER_ROLES.STUDENT);
    } catch (e) {
        return USER_ROLES.STUDENT;
    }
})(); 
let currentUser = null;

function isRoleImpersonationEnabled() {
    const authenticatedRole = String(currentUser?.role || '').trim().toLowerCase();
    if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) {
        return false;
    }
    try {
        if (sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1') return true;
    } catch (e) {
        // Ignore storage access issues and fall through to persisted role check.
    }
    try {
        const storedRole = localStorage.getItem('currentUserRole');
        const pendingRole = localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const effectiveStoredRole = Object.values(USER_ROLES).includes(storedRole)
            ? storedRole
            : pendingRole;
        const authenticatedRole = String(currentUser?.role || '').trim().toLowerCase();
        return Boolean(
            authenticatedRole
            && Object.values(USER_ROLES).includes(effectiveStoredRole)
            && effectiveStoredRole !== authenticatedRole
        );
    } catch (e) {
        return false;
    }
}

function canonicalCourseKey(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
}

var normalizeFacultyCode = window.normalizeFacultyCode || function (value, fallback = 'ECON') {
    const normalizedFallback = String(fallback || 'ECON').trim().toUpperCase() || 'ECON';
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return normalizedFallback;

    const aliasMap = {
        ECON: 'ECON',
        MANAGEMENT: 'ECON',
        BUSINESS: 'ECON',
        CS: 'CS',
        COMPUTER_SCIENCE: 'CS',
        COMPUTERSCIENCE: 'CS',
        LAW: 'LAW',
        MED: 'MED',
        MEDICINE: 'MED',
        ARTS: 'ARTS',
        ARTS_HUMANITIES: 'ARTS',
        HUMANITIES: 'ARTS'
    };

    return aliasMap[raw] || raw;
};
window.normalizeFacultyCode = normalizeFacultyCode;

if (typeof window.getCurrentFaculty !== 'function') {
    window.getCurrentFaculty = function getCurrentFaculty() {
        const stateUser = typeof getCurrentUserFromState === 'function' ? getCurrentUserFromState(typeof KIU_STATE !== 'undefined' ? KIU_STATE : null) : null;
        const authUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const activeUser = stateUser || authUser || currentUser || null;
        const selectedFaculty = (() => {
            try {
                return localStorage.getItem('currentFaculty') || localStorage.getItem('KIU_FACULTY_CONTEXT') || '';
            } catch (e) {
                return '';
            }
        })();
        const role = activeUser?.role || currentUserRole || USER_ROLES.STUDENT;

        if (role === USER_ROLES.ADMIN) {
            return normalizeFacultyCode(
                selectedFaculty || activeUser?.facultyCode || activeUser?.faculty || 'ECON',
                'ECON'
            );
        }

        return normalizeFacultyCode(
            activeUser?.facultyCode || activeUser?.faculty || selectedFaculty || 'ECON',
            'ECON'
        );
    };
}

if (typeof window.getFacultyProfile !== 'function') {
    window.getFacultyProfile = function getFacultyProfile(code) {
        const profiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE?.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE?.facultyProfiles)
            || {};
        return profiles[normalizeFacultyCode(code, 'ECON')] || profiles.ECON || {};
    };
}

if (typeof window.getFacultyColor !== 'function') {
    window.getFacultyColor = function getFacultyColor(code) {
        const normalized = normalizeFacultyCode(code, 'ECON');
        const palette = { CS: '#5b21b6', ECON: '#a4262c', LAW: '#107c41', MED: '#065f46', ARTS: '#b45309' };
        return palette[normalized] || palette.ECON;
    };
}

if (typeof window.getFacultyLabel !== 'function') {
    window.getFacultyLabel = function getFacultyLabel(code) {
        const labels = {
            CS: 'Computer Science',
            ECON: 'Business Management',
            LAW: 'Law',
            MED: 'Medicine',
            ARTS: 'Arts & Humanities'
        };
        const normalized = normalizeFacultyCode(code, 'ECON');
        return labels[normalized] || normalized;
    };
}

var minutesToTimeString = window.minutesToTimeString || function (totalMinutes) {
    const safeMinutes = Number.isFinite(totalMinutes) ? totalMinutes : 0;
    const normalizedMinutes = ((Math.round(safeMinutes) % 1440) + 1440) % 1440;
    const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
    const minutes = String(normalizedMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
};
window.minutesToTimeString = minutesToTimeString;

var parseTimeString = window.parseTimeString || function (timeStr) {
    const raw = String(timeStr || '').trim();
    if (!raw) return NaN;

    const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (twelveHour) {
        let hours = parseInt(twelveHour[1], 10);
        const minutes = parseInt(twelveHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return NaN;
        const meridiem = twelveHour[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHour) {
        const hours = parseInt(twentyFourHour[1], 10);
        const minutes = parseInt(twentyFourHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
        return hours * 60 + minutes;
    }

    return NaN;
};
window.parseTimeString = parseTimeString;

var normalizeTimeString = window.normalizeTimeString || function (timeStr, fallback = '') {
    const parsed = parseTimeString(timeStr);
    if (!Number.isFinite(parsed)) return fallback;
    return minutesToTimeString(parsed);
};
window.normalizeTimeString = normalizeTimeString;

var convertTimeToMinutes = window.convertTimeToMinutes || function (timeStr) {
    const parsed = parseTimeString(timeStr);
    return Number.isFinite(parsed) ? parsed : 0;
};
window.convertTimeToMinutes = convertTimeToMinutes;

var normalizeScheduleGroup = window.normalizeScheduleGroup || function (subjectId, group) {
    if (!group) return null;
    const rawTime = String(group.time || group.startTime || '09:00');
    const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})/);
    const startHour = timeMatch ? Number(timeMatch[1]) : 9;
    const startMinute = timeMatch ? Number(timeMatch[2]) : 0;
    const durationMinutes = Number(String(group.duration || '110').match(/\d+/)?.[0] || 110);
    const totalMinutes = (startHour * 60) + startMinute + durationMinutes;
    const endHour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endMinute = String(totalMinutes % 60).padStart(2, '0');
    return {
        ...group,
        id: group.id || group.name || `${subjectId || 'GROUP'}-AUTO`,
        name: group.name || group.id || 'Group',
        faculty: String(group.faculty || '').trim().toUpperCase() || 'ECON',
        duration: group.duration || '110min',
        time: rawTime,
        endTime: group.endTime || `${endHour}:${endMinute}`,
        room: group.room || '',
        sessionType: group.sessionType || group.classType || group.type || 'lecture',
        registered: Number(group.registered || 0),
        capacity: Number(group.capacity || 0),
        weekOverrides: group.weekOverrides && typeof group.weekOverrides === 'object' ? group.weekOverrides : {}
    };
};
window.normalizeScheduleGroup = normalizeScheduleGroup;

const SINGLE_RUNTIME_ROUTE_BY_FILE = {
    'admin-library.html': 'library',
    'admin-orders.html': 'orders',
    'chancellery.html': 'chancellery',
    'exams.html': 'exams',
    'faculty-gradebook.html': 'faculty-gradebook',
    'faculty-schedule.html': 'faculty-schedule',
    'library.html': 'library',
    'lms.html': 'lms',
    'news.html': 'news',
    'orders.html': 'orders',
    'personal-data.html': 'personal-data',
    'profile.html': 'profile',
    'programs.html': 'programs',
    'registration.html': 'registration',
    'student-service.html': 'student-service',
    'study-card.html': 'study-card',
    'timetable.html': 'timetable'
};

function getRuntimeRouteIntentFromPathname(pathname = window.location.pathname) {
    const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
    const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
    if (!fileName || fileName === 'index.html' || fileName === 'login.html') return '';
    if (SINGLE_RUNTIME_ROUTE_BY_FILE[fileName]) return SINGLE_RUNTIME_ROUTE_BY_FILE[fileName];
    if (!fileName.endsWith('.html')) return '';
    return fileName.replace(/\.html$/i, '');
}

function enforceSingleRuntimeEntrypoint() {
    // Safety default: disabled to prevent route ping-pong between index and standalone shells.
    if (localStorage.getItem('KIU_ENABLE_SINGLE_RUNTIME_REDIRECT') !== '1') return;
    const routeIntent = getRuntimeRouteIntentFromPathname();
    if (!routeIntent) return;
    try {
        localStorage.setItem('KIU_PENDING_ADMIN_PAGE', routeIntent);
    } catch (e) {
        console.warn('Unable to persist route intent before runtime redirect.', e);
    }
    const targetUrl = new URL('index.html', window.location.href);
    if (window.location.search) targetUrl.search = window.location.search;
    if (window.location.hash) targetUrl.hash = window.location.hash;
    window.location.replace(targetUrl.toString());
}

enforceSingleRuntimeEntrypoint();

// ENGLISH LOCALIZATION LAYER (auto-applies to static + dynamic UI)
function decodeReplacementKey(base64) {
    try {
        if (typeof atob === 'function' && typeof TextDecoder !== 'undefined') {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }
    } catch (error) {}
    try {
        if (typeof Buffer !== 'undefined') return Buffer.from(base64, 'base64').toString('utf8');
    } catch (error) {}
    return '';
}

const ENGLISH_UI_REPLACEMENT_DATA = [
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCp8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqEgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqXDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqEgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqjDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'All registration structure changes have been saved'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpcODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZMgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmsOCwp0gw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCuiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQPw==', 'Are you sure you want to delete this module?'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrogw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQPw==', 'Are you sure you want to remove this subject?'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsK+w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Educational Program'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsK+w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpAgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Prerequisite not satisfied'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOCwr7Dg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Academic Registration'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp0gw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Back To Current Week'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Available only for'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqTDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKuw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Spring Semester'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Fall Semester'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Course approved'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKAmsKsw4XCvsOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Module updated'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnCDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFkyDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcLi4u', 'Course name or code...'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCp8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKkw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpAgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'All rights reserved'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnCDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKlw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'New module created'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Concentration Course'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKkw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnCDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Free Credits'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Final Exam'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCvsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Personal Data'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKAmsKsw4XCvsOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Midterm Exam'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Course added'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqnDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKkw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOCwr7Dg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Select Faculty'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKh', 'students'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqnDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsK+w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Select Program'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp0gw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Homework'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp0gw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Current Week'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJwgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCp8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKkw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Course rejected'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCp8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqTDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'All Faculties'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Study Card'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Module removed'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOCwr7Dg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Minor Course'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqcODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwr7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKAmsKsw4XCvsOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'My Program'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqnDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaw4LCnSDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Select Course'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCoS7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'E-Chancellery'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKqw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Concentration'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp0=', 'Mandatory'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Library'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqvDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Orders'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqcODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKuw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'My Timetable'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsK+w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Prerequisite'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsK+w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Anti-requisite'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Calendar'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Thursday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Wednesday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCr8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Hello'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Tuesday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCvsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Friday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDgsK+w4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Faculty'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigJrCrMOFwr7Dg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Seats'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKlw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Cancel'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Details'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwrrDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Add'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKpw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Elective'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCusODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Semester'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Student'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqTDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Assessment'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Monday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Syllabus'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKuw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCo8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Close'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwp3Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Minor'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Confirm'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqXDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Professor'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCvsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Profile'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmiDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKswrnDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJogw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJogw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Saturday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Logout'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKjw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Module'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Minor'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKpw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Select'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKuw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCc', 'Name'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqAgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqXDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKh', 'None'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqsODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwq7Dg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Timetable'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpcODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Quiz'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqLDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Odd'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCq8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCucOD4oCmw6LigqzFk8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsKmw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg+KApsOi4oKsxZPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKQ', 'Search'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCq8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDgsK5w4PGksOi4oKswqbDg8Kiw6LigJrCrMOF4oCcw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKdw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWTw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Search'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKgw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaIA==', 'Sunday'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCr8ODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw4LCosODwqLDouKAmsKsw4XCvsOD4oCaw4LCosODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKkw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Group'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKow4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwpA=', 'Remove'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKiw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCncODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PigJrDgsKiw4PGksOCwqLDg8Kiw6LigJrCrMOFwqHDg+KAmsOCwqzDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJzDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCucODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'Code'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKsw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'Even'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpcODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqPDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4LCpsODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'Score'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqbDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcOD4oCaw4LCosODxpLDgsKiw4PCosOi4oCawqzDhcKhw4PigJrDgsKsw4PGksOi4oKsxaHDg+KAmsOCwp0=', 'Day'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnMODxpLDhuKAmcOD4oCgw6LigqzihKLDg8aSw6LigqzFocOD4oCaw4LCocODxpLDhuKAmcODwqLDouKAmsKsw4LCoMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PCosOi4oKsxb7DgsKiw4PGksOG4oCZw4PCosOi4oCawqzDhcKhw4PGksOi4oKsxaHDg+KAmsOCwqDDg8aSw4bigJnDg+KAoMOi4oKs4oSiw4PGksOi4oKsxaHDg+KAmsOCwqHDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqDDg8aSw4LCosODwqLDouKCrMWhw4LCrMODwqLDouKCrMW+w4LCosODxpLDhuKAmcODwqLDouKAmsKsw4XCocODxpLDouKCrMWhw4PigJrDgsKd', 'Time'],
];

const ENGLISH_UI_REPLACEMENTS = ENGLISH_UI_REPLACEMENT_DATA.map(([fromBase64, to]) => [decodeReplacementKey(fromBase64), to]);

const QUESTION_MARK_UI_REPLACEMENTS = [
    ['????????? ??????', 'Hello Giorgi'],
    ['?????? ???????????', 'Giorgi Babunashvili'],
    ['??????????? ????...', 'Business Management'],
    ['??????????', 'Program:'],
    ['??????????? ????????? ???????????_2025', 'Bachelor of Management_2025'],
    ['17) 2025/2026 ????...', '17) 2025/2026 Spring Semester'],
    ['??????????:', 'Program:'],
    ['????????:', 'Semester:'],
    ['???????:', 'Status:'],
    ['??????? ?????????? ?????????:', 'ECTS limit this semester:'],
    ['?????????? ?????????? ??????:', 'Completed ECTS:'],
    ['????<br>????????', 'My<br>Program'],
    ['??????????<br>???????', 'Free<br>Credits'],
    ['????????????', 'Concentration'],
    ['???????', 'Minor'],
    ['??????? ????????<br>???????', 'Selected Courses<br>List'],
    ['????????????? ?????', 'Concentration Course'],
    ['???????? ?????', 'Minor Course'],
    ['??????? ????????', 'Select Program'],
    ['?????? ?????? ?? ????...', 'Course name or code...'],
    ['??????? ?????????', 'Select Faculty'],
    ['???????? ??????/?????? ??????????', 'Subject Title / Module Title'],
    ['??????????/??????????', 'Prerequisite / Anti-requisite'],
    ['??????????? ???????????? ???????????? ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Employment Project Presentation', 'Employment Project Presentation'],
    ['?????? ??????', 'Select Course'],
    ['???????', 'Choose'],
    ['?????????', 'Available'],
    ['????????????', 'Concentration'],
    ['???????????', 'Choose subject'],
    ['??????? ?????????? ?????????:', 'ECTS limit this semester:'],
    ['??????????', 'Library'],
    ['?????????', 'Calendar'],
    ['??????<br>??????????', 'Personal<br>Data'],
    ['??.??????????', 'E-Chancellery'],
    ['???????????????<br>????????', 'Educational Program'],
    ['????????<br>??????', 'Study Card'],
    ['??????????<br>???????????', 'Academic Registration'],
    ['??????', 'Timetable'],
    ['???????', 'Profile'],
    ['??????', 'Logout'],
    ['???????', 'Close'],
    ['????????', 'Cancel'],
    ['????????', 'Syllabus'],
    ['?????? ???????????', 'Student Information'],
    ['??????????? ???????????? ???????????? ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Employment Project Presentation', 'Employment Project Presentation'],
    ['??????????? ???????????? ???????????? ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Employment Project Presentation', 'Employment Project Presentation'],
    ['???? ??????????? (HR Management)', 'Nino Beridze (HR Management)'],
    ['??? ????????????? (Business Law)', 'Giorgi Gelashvili (Business Law)'],
    ['????????? ?????', 'Current Week'],
    ['????? 2026', 'March 2026'],
    ['53.???????', '53. Finance'],
    ['56.?????????????????', '56. Program Catalog'],
    ['I ?????? - ?????? ?????????', 'I Module - Mandatory Subjects'],
    ['??????? ????????? ??????? ()', 'Probability and Statistics Basics'],
    ['????? ????????? ()', 'Roman Law Basics'],
    ['????????? ????????? ()', 'Management Foundations'],
    ['????????? ?????????? ()', 'Sociology Foundations'],
    ['[7024] ????????? ????????? (??????????)', '[7024] Statistics Foundations'],
    ['[7027] ??????? ????????? ??????? (??????????)', '[7027] Probability and Statistics Basics'],
    ['??????? ????????', 'Select Program'],
    ['?????? ?????? ?? ????...', 'Course name or code...'],
    ['?????', 'Search'],
    ['?????????', 'Faculty'],
    ['??????? ?????????', 'Select Faculty']
].sort((a, b) => b[0].length - a[0].length);

const GEORGIAN_TO_LATIN_DATA = [
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCkA==', 'a'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMK5w4PigKbDouKCrMWT', 'b'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oCawqzDhcK+w4PigJrDgsKi', 'g'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMKmw4PCosOi4oCawqzDheKAnA==', 'd'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKd', 'e'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsKi', 'v'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigKbDouKCrMWT', 'z'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDgsKiw4PCosOi4oKsxaHDgsKsw4PigJrDgsKd', 't'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwrnDg8aSw6LigqzCpsODwqLDouKAmsKsw4XigJw=', 'i'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw4LCvsODxpLDouKCrMWhw4PigJrDgsKi', 'k'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCoQ==', 'l'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg+KAmsOCwqLDg8aSw4LCosODwqLDouKAmsKsw4XCocOD4oCaw4LCrMODxpLDouKCrMWhw4PigJrDgsK6', 'm'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw4LCosODwqLDouKCrMWhw4LCrMOD4oCmw6LigqzFkw==', 'n'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCnQ==', 'o'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCvg==', 'p'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOCwqbDg8aSw6LigqzFocOD4oCaw4LCuA==', 'zh'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoA==', 'r'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCoQ==', 's'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCog==', 't'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCow==', 'u'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpA==', 'f'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpQ==', 'k'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpg==', 'gh'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCpw==', 'q'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqA==', 'sh'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqQ==', 'ch'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqg==', 'ts'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCqw==', 'dz'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrA==', 'ts'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrQ==', 'ch'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrg==', 'kh'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCrw==', 'j'],
    ['w4PGksOG4oCZw4PigKDDouKCrOKEosODxpLDouKCrMWhw4PigJrDgsKhw4PGksOG4oCZw4PCosOi4oCawqzDgsKgw4PGksOCwqLDg8Kiw6LigqzFocOCwqzDg8Kiw6LigqzFvsOCwqLDg8aSw4bigJnDg8Kiw6LigJrCrMOFwqHDg8aSw6LigqzFocOD4oCaw4LCsA==', 'h'],
];
const GEORGIAN_TO_LATIN = Object.fromEntries(GEORGIAN_TO_LATIN_DATA.map(([fromBase64, to]) => [decodeReplacementKey(fromBase64), to]));

function cleanupEncodingArtifacts(text) {
    return String(text || '')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©|ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©|ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©/g, '©')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·|ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·|ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·/g, ' · ')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢/g, "'")
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“/g, '"')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â/g, '"')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦|ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦|ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦/g, '...')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº/g, '')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦|ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“|ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, '-')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦|ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, '-')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ/g, '-')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢/g, "'")
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“|ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬\x9d/g, '"')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦/g, '...')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢/g, 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢')
        .replace(/\s*[ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ]\s*0\s*ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢\s*ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“\s*ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“/g, '0 courses available')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“_2025 \[45\]/g, '45. Bachelor of Management_2025')
        .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“/g, 'Giorgi Babunashvili');
}

function containsSuspiciousGlyphs(text) {
    return /[\uFFFd\u1400-\u167F]/.test(String(text || ''));
}

function looksLikeMojibake(text) {
    const input = String(text || '');
    return /[Ãƒâ€šÃƒÆ’ÃƒÂÃƒâ€˜ÃƒÂ¢ÃƒÂ°]/.test(input) || containsSuspiciousGlyphs(input);
}

function scoreReadableText(text) {
    const input = String(text || '');
    if (!input.trim()) return 0;
    let score = 0;
    if (/[A-Za-z]/.test(input)) score += 4;
    if (/[\u10A0-\u10FF]/.test(input)) score += 6;
    if (/[0-9]/.test(input)) score += 1;
    if (/[.,:;!?()[\]\/&+\-]/.test(input)) score += 1;
    if (looksLikeMojibake(input)) score -= 6;
    if (containsSuspiciousGlyphs(input)) score -= 8;
    return score;
}

function decodeBytesToText(bytes) {
    if (!bytes || !bytes.length || typeof TextDecoder === 'undefined') return '';
    try {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    } catch (_) {
        return '';
    }
}

const WINDOWS_1252_REVERSE_MAP = {
    0x20AC: 0x80,
    0x201A: 0x82,
    0x0192: 0x83,
    0x201E: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02C6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8A,
    0x2039: 0x8B,
    0x0152: 0x8C,
    0x017D: 0x8E,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201C: 0x93,
    0x201D: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02DC: 0x98,
    0x2122: 0x99,
    0x0161: 0x9A,
    0x203A: 0x9B,
    0x0153: 0x9C,
    0x017E: 0x9E,
    0x0178: 0x9F
};

function extractLowBytes(text) {
    return Array.from(String(text || ''), ch => ch.charCodeAt(0) & 0xFF);
}

function extractWindows1252Bytes(text) {
    const bytes = [];
    const input = String(text || '');
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (code <= 0xFF) {
            bytes.push(code);
        } else if (WINDOWS_1252_REVERSE_MAP[code] != null) {
            bytes.push(WINDOWS_1252_REVERSE_MAP[code]);
        } else {
            return [];
        }
    }
    return bytes;
}

function extractCodeUnitBytes(text) {
    const bytes = [];
    const input = String(text || '');
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        bytes.push(code & 0xFF);
        if (code > 0xFF) bytes.push(code >> 8);
    }
    return bytes;
}

function collectDecodedCandidates(input, maxDepth = 3) {
    const extractors = [extractWindows1252Bytes, extractLowBytes, extractCodeUnitBytes];
    const seen = new Set([input]);
    let frontier = [input];

    for (let depth = 0; depth < maxDepth; depth += 1) {
        const next = [];
        frontier.forEach(value => {
            extractors.forEach(extractor => {
                const bytes = extractor(value);
                if (!bytes || !bytes.length) return;
                const decoded = decodeBytesToText(bytes);
                if (!decoded || seen.has(decoded)) return;
                seen.add(decoded);
                next.push(decoded);
            });
        });
        if (!next.length) break;
        frontier = next;
    }

    return Array.from(seen);
}

function decodeMojibakeUtf8(text) {
    const input = String(text || '');
    if (!input) return input;

    if (!looksLikeMojibake(input)) return input;

    const candidates = collectDecodedCandidates(input, 3);
    let best = cleanupEncodingArtifacts(input);
    let bestScore = scoreReadableText(best);
    candidates.forEach(candidate => {
        const cleaned = cleanupEncodingArtifacts(candidate);
        const score = scoreReadableText(cleaned);
        if (score > bestScore + 1) {
            best = cleaned;
            bestScore = score;
        }
    });
    return best;
}

function stripSuspiciousGlyphs(text) {
    const input = String(text || '');
    if (!containsSuspiciousGlyphs(input)) return input;
    const cleaned = input
        .replace(/[\uFFFd\u1400-\u167F]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return cleaned && scoreReadableText(cleaned) >= scoreReadableText(input) ? cleaned : input;
}

function transliterateGeorgian(text) {
    return String(text || '').replace(/[\u10A0-\u10FF]/g, ch => GEORGIAN_TO_LATIN[ch] || ch);
}

function toEnglishText(value) {
    let out = cleanupEncodingArtifacts(stripSuspiciousGlyphs(decodeMojibakeUtf8(value)));
    ENGLISH_UI_REPLACEMENTS.forEach(([from, to]) => {
        if (from && out.includes(from)) out = out.split(from).join(to);
    });
    QUESTION_MARK_UI_REPLACEMENTS.forEach(([from, to]) => {
        if (from && out.includes(from)) out = out.split(from).join(to);
    });
    if (/[\u10A0-\u10FF]/.test(out)) out = transliterateGeorgian(out);
    return cleanupEncodingArtifacts(stripSuspiciousGlyphs(out));
}

function getUiDisplayName() {
    const user = currentUser || null;
    return toEnglishText(user?.nameEn || user?.name || 'Portal User');
}

function getUiGreetingName() {
    const fullName = getUiDisplayName();
    return fullName.split(' ')[0] || 'User';
}

function getUiRoleLabel() {
    const roleEl = document.querySelector('.user-role');
    const currentValue = roleEl?.textContent?.trim();
    if (currentValue && !hasBrokenUiText(currentValue)) {
        return currentValue;
    }
    const selectedFaculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
    const facultyLabel = typeof getFacultyLabel === 'function'
        ? getFacultyLabel(selectedFaculty || currentUser?.facultyCode || currentUser?.faculty || 'ECON')
        : '';
    return toEnglishText(facultyLabel || currentUser?.faculty || 'University Portal');
}

function setElementHtmlIfFound(selector, html) {
    const el = document.querySelector(selector);
    if (el && el.innerHTML !== html) el.innerHTML = html;
}

function setElementTextIfFound(selector, text) {
    const el = document.querySelector(selector);
    if (el && el.textContent !== text) el.textContent = text;
}

function setElementAttrIfFound(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el && el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

function localizeHtmlMarkup(value) {
    return typeof toEnglishText === 'function'
        ? toEnglishText(value)
        : String(value == null ? '' : value);
}

function hasBrokenUiText(text) {
    const input = String(text || '');
    return /[?]{3,}/.test(input) || looksLikeMojibake(input) || /[Ã¡â€šÂ -Ã¡Æ’Â¿]/.test(input);
}

function rootHasTranslatableText(root) {
    if (!root) return false;
    const text = root.textContent || '';
    if (!text.trim()) return false;
    return hasBrokenUiText(text) || /[\u10A0-\u10FF]/.test(text);
}

function nodeNeedsEnglishLocalization(node) {
    if (!node) return false;
    if (node.nodeType === Node.TEXT_NODE) {
        return rootHasTranslatableText(node.parentElement);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (rootHasTranslatableText(node)) return true;
    if (node.matches?.('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"]')) return true;
    if (node.matches?.('option:not([value])')) return true;
    return Boolean(node.querySelector?.('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"],option:not([value])'));
}

function setNodeTextIfBroken(node, text) {
    if (!node) return;
    const current = node.textContent || '';
    if (!hasBrokenUiText(current) && current.trim()) return;
    if (current !== text) node.textContent = text;
}

function setNodeHtmlIfBroken(node, html) {
    if (!node) return;
    const current = node.innerHTML || '';
    if (!hasBrokenUiText(current) && current.trim()) return;
    if (current !== html) node.innerHTML = html;
}

function applyStudentPageEnglishOverrides() {
    document.querySelectorAll('#admin-nav .nav-item').forEach(item => {
        const label = item.textContent || '';
        if (!hasBrokenUiText(label)) return;
        if ((item.getAttribute('onclick') || '').includes("navigate('library')")) {
            item.innerHTML = '<i class="fas fa-book" style="display:block; margin-bottom:5px; font-size:16px;"></i> Library';
        }
        if ((item.getAttribute('onclick') || '').includes("navigate('orders')")) {
            item.innerHTML = '<i class="fas fa-book-open" style="display:block; margin-bottom:5px; font-size:16px;"></i> Orders';
        }
    });

    const timetableFilterButtons = document.querySelectorAll('#page-timetable .filter-shell.surface-card .kiu-btn-blue, #page-timetable .filter-shell.surface-card .kiu-btn-outline');
    const timetableLabels = ['All', 'Lecture Groups', 'Seminar Groups', 'Laboratory Groups', 'Exams', 'Current Week'];
    timetableFilterButtons.forEach((button, index) => {
        if (timetableLabels[index]) setNodeTextIfBroken(button, timetableLabels[index]);
    });
    setNodeTextIfBroken(document.getElementById('timetable-month-label'), 'March 2026');

    const registrationTermOption = document.querySelector('#page-registration .filter-shell select option');
    setNodeTextIfBroken(registrationTermOption, '17) 2025/2026 Spring Semester');

    const registrationInfoTitle = document.querySelector('#page-registration .content-box.surface-card > div[style*="font-weight: 700"][style*="font-size: 18px"]');
    setNodeTextIfBroken(registrationInfoTitle, 'Student Information');

    const registrationInfoRows = document.querySelectorAll('#page-registration .reg-header-info > div');
    if (registrationInfoRows[2]) {
        const spans = registrationInfoRows[2].querySelectorAll('span');
        setNodeTextIfBroken(spans[0], 'Program:');
        setNodeTextIfBroken(spans[1], toEnglishText(currentUser?.program || 'BSc Management 2025'));
    }
    if (registrationInfoRows[3]) {
        const spans = registrationInfoRows[3].querySelectorAll('span');
        setNodeTextIfBroken(spans[0], 'Semester:');
        setNodeTextIfBroken(spans[1], String(KIU_STATE.activeSemester || 3));
    }
    if (registrationInfoRows[4]) {
        const spans = registrationInfoRows[4].querySelectorAll('span');
        setNodeTextIfBroken(spans[0], 'Status:');
        setNodeTextIfBroken(spans[1], currentUser?.status || 'Active');
    }
    if (registrationInfoRows[6]) {
        const spans = registrationInfoRows[6].querySelectorAll('span');
        setNodeTextIfBroken(spans[0], 'ECTS limit this semester:');
    }
    if (registrationInfoRows[7]) {
        const spans = registrationInfoRows[7].querySelectorAll('span');
        setNodeTextIfBroken(spans[0], 'Completed ECTS:');
    }

    const regTabLabels = ['My Program', 'Free Credits', 'Concentration', 'Minor', 'History', 'Selected Courses'];
    document.querySelectorAll('#page-registration .reg-tabs .reg-tab').forEach((tab, index) => {
        if (regTabLabels[index]) setNodeHtmlIfBroken(tab, regTabLabels[index].replace(' ', '<br>'));
    });

    const calendarEventCell = document.querySelector('#cal-content-events tbody tr td:nth-child(2)');
    setNodeTextIfBroken(calendarEventCell, 'Employment Project Presentation');

    const officeHourStudent = document.querySelector('#cal-content-officehours tbody tr td:first-child');
    setNodeTextIfBroken(officeHourStudent, getUiDisplayName());

    const officeHourOptions = document.querySelectorAll('#cal-content-officehours .only-student select option');
    if (officeHourOptions[0]) setNodeTextIfBroken(officeHourOptions[0], 'Select Professor...');
    if (officeHourOptions[1]) setNodeTextIfBroken(officeHourOptions[1], 'Nino Beridze (HR Management)');
    if (officeHourOptions[2]) setNodeTextIfBroken(officeHourOptions[2], 'Giorgi Gelashvili (Business Law)');

    const programModalButtons = document.querySelectorAll('#modal-programs .modal-body .kiu-btn-outline');
    const programModalLabels = [
        '34. Mathematics (Integrated Program)',
        '36. Computer Science',
        '37. Computer Science and Artificial Intelligence',
        '44. Management and Digital Technologies',
        '45. Bachelor of Management_2025',
        '47. Computer Science',
        '53. Finance',
        '54. Business and Economics_2025',
        '56. Program Catalog'
    ];
    programModalButtons.forEach((button, index) => {
        if (programModalLabels[index]) setNodeTextIfBroken(button, programModalLabels[index]);
    });

    const programCourseHeaderCells = document.querySelectorAll('#modal-program-courses thead th');
    if (programCourseHeaderCells[1]) setNodeTextIfBroken(programCourseHeaderCells[1], 'Subject Title / Module Title');
    if (programCourseHeaderCells[3]) setNodeTextIfBroken(programCourseHeaderCells[3], 'Prerequisite / Anti-requisite');

    const programCourseRows = document.querySelectorAll('#modal-program-courses tbody tr');
    if (programCourseRows[0]) {
        const cells = programCourseRows[0].querySelectorAll('td');
        setNodeTextIfBroken(cells[1], 'I Module - Mandatory Subjects');
    }
    if (programCourseRows[1]) {
        const cells = programCourseRows[1].querySelectorAll('td');
        setNodeTextIfBroken(cells[1], 'Probability and Statistics Basics');
        setNodeTextIfBroken(cells[3], '[7024] Statistics Foundations');
    }
    if (programCourseRows[2]) {
        const cells = programCourseRows[2].querySelectorAll('td');
        setNodeTextIfBroken(cells[1], 'Roman Law Basics');
    }
    if (programCourseRows[3]) {
        const cells = programCourseRows[3].querySelectorAll('td');
        setNodeTextIfBroken(cells[1], 'Management Foundations');
        setNodeTextIfBroken(cells[3], '[7027] Probability and Statistics Basics');
    }
    if (programCourseRows[4]) {
        const cells = programCourseRows[4].querySelectorAll('td');
        setNodeTextIfBroken(cells[1], 'Sociology Foundations');
    }
}

function applyProfilePageEnglishOverrides() {
    const profileTabLabels = [
        '<i class="fas fa-user" style="color:var(--kiu-orange); margin-right:10px;"></i> Profile',
        '<i class="fas fa-envelope" style="color:var(--kiu-blue); margin-right:10px;"></i> Email',
        '<i class="fas fa-lock" style="color:var(--kiu-blue); margin-right:10px;"></i> Password Change',
        '<i class="fas fa-calendar" style="color:var(--kiu-blue); margin-right:10px;"></i> My Timetable'
    ];
    document.querySelectorAll('#page-profile .content-box.surface-card .tab').forEach((tab, index) => {
        if (profileTabLabels[index]) setNodeHtmlIfBroken(tab, profileTabLabels[index]);
    });

    setNodeTextIfBroken(document.getElementById('profile-section-title'), 'Profile');

    const profileButtons = document.querySelectorAll('#profile-tab-info .kiu-btn-blue, #profile-tab-email .kiu-btn-blue, #profile-tab-password button');
    if (profileButtons[0]) setNodeTextIfBroken(profileButtons[0], 'Update');
    if (profileButtons[1]) setNodeTextIfBroken(profileButtons[1], 'Update');
    if (profileButtons[2]) setNodeTextIfBroken(profileButtons[2], 'Update');

    const passwordInputs = document.querySelectorAll('#profile-tab-password input[type="password"]');
    if (passwordInputs[0] && hasBrokenUiText(passwordInputs[0].getAttribute('placeholder') || '')) passwordInputs[0].setAttribute('placeholder', 'Current password');
    if (passwordInputs[1] && hasBrokenUiText(passwordInputs[1].getAttribute('placeholder') || '')) passwordInputs[1].setAttribute('placeholder', 'New password, min. 6 characters');
    if (passwordInputs[2] && hasBrokenUiText(passwordInputs[2].getAttribute('placeholder') || '')) passwordInputs[2].setAttribute('placeholder', 'Repeat password');
}

function applyPersonalDataPageEnglishOverrides() {
    setNodeTextIfBroken(document.querySelector('#page-personal-data .profile-card > div:first-child'), 'Student Information');
    setNodeTextIfBroken(document.getElementById('personal-data-records-title'), 'Academic Information');

    const headers = document.querySelectorAll('#page-personal-data .kiu-table thead th');
    const labels = [
        'Faculty / Department',
        'Program',
        'Level',
        'Status',
        'Registration / Record',
        'Entry Date',
        'Current Term'
    ];
    headers.forEach((th, index) => {
        if (labels[index]) setNodeTextIfBroken(th, labels[index]);
    });

    setNodeTextIfBroken(document.querySelector('#page-personal-data .modal-footer .kiu-btn-outline'), 'Close');
    setNodeTextIfBroken(document.querySelector('#page-personal-data #modal-announcement h3'), 'Title');
    setNodeTextIfBroken(document.querySelector('#page-personal-data #modal-event h3'), 'Title');
    setNodeTextIfBroken(document.querySelector('#page-personal-data #modal-syllabus h3'), 'Syllabus');
    setNodeTextIfBroken(document.querySelector('#page-personal-data #modal-programs h3'), 'Educational Programs');
    setNodeTextIfBroken(document.querySelector('#page-personal-data #modal-programs h4'), 'Select Program');

    const modalButtons = document.querySelectorAll('#page-personal-data #modal-programs .modal-body .kiu-btn-outline');
    const modalLabels = [
        '34. Mathematics',
        '36. Computer Science',
        '37. Management',
        '44. Mathematics and AI Foundations',
        '45. Management 2025',
        '47. Computer Science',
        '53. Finance',
        '54. Psychology 2025',
        '56. Program Catalog'
    ];
    modalButtons.forEach((button, index) => {
        if (modalLabels[index]) setNodeTextIfBroken(button, modalLabels[index]);
    });
    const modalCourseHeaders = document.querySelectorAll('#page-personal-data #modal-program-courses thead th');
    if (modalCourseHeaders[1]) setNodeTextIfBroken(modalCourseHeaders[1], 'Subject / Module Title');
    if (modalCourseHeaders[3]) setNodeTextIfBroken(modalCourseHeaders[3], 'Prerequisite / Anti-requisite');
}

function applyStudyCardPageEnglishOverrides() {
    setNodeTextIfBroken(document.querySelector('#page-study-card .filter-shell-title'), 'Program View');
    setNodeTextIfBroken(document.querySelector('#page-study-card #modal-syllabus h3'), 'Syllabus');
    setNodeTextIfBroken(document.querySelector('#page-study-card #modal-programs h3'), 'Educational Programs');
    setNodeTextIfBroken(document.querySelector('#page-study-card #modal-programs h4'), 'Select Program');

    const modalButtons = document.querySelectorAll('#page-study-card #modal-programs .modal-body .kiu-btn-outline');
    const modalLabels = [
        '34. Mathematics',
        '36. Computer Science',
        '37. Management',
        '44. Mathematics and AI Foundations',
        '45. Management 2025',
        '47. Computer Science',
        '53. Finance',
        '54. Psychology 2025',
        '56. Program Catalog'
    ];
    modalButtons.forEach((button, index) => {
        if (modalLabels[index]) setNodeTextIfBroken(button, modalLabels[index]);
    });
    const modalCourseHeaders = document.querySelectorAll('#page-study-card #modal-program-courses thead th');
    if (modalCourseHeaders[1]) setNodeTextIfBroken(modalCourseHeaders[1], 'Subject / Module Title');
    if (modalCourseHeaders[3]) setNodeTextIfBroken(modalCourseHeaders[3], 'Prerequisite / Anti-requisite');
    const modalCourseRows = document.querySelectorAll('#page-study-card #modal-program-courses tbody tr');
    if (modalCourseRows[0]) {
        const cells = modalCourseRows[0].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'I Module - Mandatory Subjects');
    }
    if (modalCourseRows[1]) {
        const cells = modalCourseRows[1].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Curriculum subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7024] Statistics Foundations');
    }
    if (modalCourseRows[2]) {
        const cells = modalCourseRows[2].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Roman Law');
    }
    if (modalCourseRows[3]) {
        const cells = modalCourseRows[3].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Management Subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7027] Curriculum subjects');
    }
    if (modalCourseRows[4]) {
        const cells = modalCourseRows[4].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Sociology');
    }
}

function applyCalendarPageEnglishOverrides() {
    const officeHoursStudent = document.querySelector('#cal-content-officehours tbody tr td:first-child');
    setNodeTextIfBroken(officeHoursStudent, 'Giorgi Babunashvili');

    const officeHoursTopic = document.querySelector('#cal-content-officehours tbody tr td:nth-child(3)');
    setNodeTextIfBroken(officeHoursTopic, 'Grade Appeal');

    const officeHoursButton = document.querySelector('#cal-content-officehours .only-student .kiu-btn-blue');
    setNodeTextIfBroken(officeHoursButton, 'Confirm Booking');
}

function applyTimetablePageEnglishOverrides() {
    setNodeTextIfBroken(document.getElementById('timetable-week-current'), 'Current Week');
    setNodeTextIfBroken(document.getElementById('timetable-month-label'), 'March 2026');
}

function applyStudentDashboardEnglishOverrides() {
    const labelByRoute = {
        calendar: 'Calendar',
        lms: 'LMS',
        'personal-data': 'Personal Data',
        chancellery: 'E-Chancellery',
        'student-service': 'Student Service',
        programs: 'Educational Program',
        'study-card': 'Study Card',
        registration: 'Academic Registration',
        timetable: 'Timetable',
        library: 'Library',
        orders: 'Orders'
    };
    document.querySelectorAll('.only-student.dashboard-grid .dash-btn').forEach(button => {
        const onclick = button.getAttribute('onclick') || '';
        const textNode = button.querySelector('.btn-text');
        if (!textNode) return;
        const matchedRoute = Object.keys(labelByRoute).find(route => onclick.includes(`navigate('${route}')`));
        if (matchedRoute) setNodeTextIfBroken(textNode, labelByRoute[matchedRoute]);
    });
}

function applyProgramsPageEnglishOverrides() {
    const hasModernProgramsWorkspace = Boolean(document.querySelector('#page-programs .lux-program-shell'));
    if (!hasModernProgramsWorkspace) {
        setNodeTextIfBroken(document.querySelector('#page-programs .filter-shell-title'), 'Program Scope');

        const headers = document.querySelectorAll('#page-programs .kiu-table thead > tr:first-child th');
        const headerLabels = [
            'N',
            'Subject / Module Title',
            'ECTS',
            'Prerequisite',
            'Semester I-VIII',
            ''
        ];
        headers.forEach((th, index) => {
            if (headerLabels[index]) setNodeTextIfBroken(th, headerLabels[index]);
        });
        const secondHeaderCells = document.querySelectorAll('#page-programs .kiu-table thead > tr:nth-child(2) th');
        ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].forEach((label, index) => {
            if (secondHeaderCells[index]) setNodeTextIfBroken(secondHeaderCells[index], label);
        });

        const bodyRows = document.querySelectorAll('#page-programs .kiu-table tbody tr');
        if (bodyRows[0]) {
            const cells = bodyRows[0].querySelectorAll('td');
            if (cells[1]) setNodeTextIfBroken(cells[1], 'General Program - Bachelor Studies');
            if (cells[3]) setNodeTextIfBroken(cells[3], 'No prerequisite');
        }
    }
    const modalButtons = document.querySelectorAll('#modal-programs .modal-body .kiu-btn-outline');
    const modalLabels = [
        '34. Mathematics',
        '36. Computer Science',
        '37. Management',
        '44. Mathematics and AI Foundations',
        '45. Management 2025',
        '47. Computer Science',
        '53. Finance',
        '54. Psychology 2025',
        '56. Program Catalog',
        '59. Foreign Language Courses'
    ];
    modalButtons.forEach((button, index) => {
        if (modalLabels[index]) setNodeTextIfBroken(button, modalLabels[index]);
    });
    const modalCourseHeaders = document.querySelectorAll('#modal-program-courses thead th');
    if (modalCourseHeaders[1]) setNodeTextIfBroken(modalCourseHeaders[1], 'Subject / Module Title');
    if (modalCourseHeaders[3]) setNodeTextIfBroken(modalCourseHeaders[3], 'Prerequisite / Anti-requisite');
    const modalCourseRows = document.querySelectorAll('#modal-program-courses tbody tr');
    if (modalCourseRows[0]) {
        const cells = modalCourseRows[0].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'I Module - Mandatory Subjects');
    }
    if (modalCourseRows[1]) {
        const cells = modalCourseRows[1].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Curriculum subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7024] Statistics Foundations');
    }
    if (modalCourseRows[2]) {
        const cells = modalCourseRows[2].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Roman Law');
    }
    if (modalCourseRows[3]) {
        const cells = modalCourseRows[3].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Management Subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7027] Curriculum subjects');
    }
    if (modalCourseRows[4]) {
        const cells = modalCourseRows[4].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Sociology');
    }
    setNodeTextIfBroken(document.querySelector('#page-programs .modal-footer .kiu-btn-blue'), 'Close');
}

function applyOrdersPageEnglishOverrides() {
    setNodeHtmlIfBroken(document.getElementById('nav-orders'), '<i class="fas fa-book-open"></i> Orders');
    const tabs = document.querySelectorAll('#page-orders .tabs-container .tab');
    if (tabs[0]) setNodeTextIfBroken(tabs[0], 'Current Orders');
    if (tabs[1]) setNodeTextIfBroken(tabs[1], 'Archive');

    const headers = document.querySelectorAll('#page-orders .kiu-table thead th');
    const labels = ['N', 'Order Title', 'Order Number', 'Issue Date', 'Status', 'Document'];
    headers.forEach((th, index) => {
        if (labels[index]) setNodeTextIfBroken(th, labels[index]);
    });
    setNodeTextIfBroken(document.querySelector('#page-orders .modal-footer .kiu-btn-outline'), 'Close');
    setNodeTextIfBroken(document.querySelector('#page-orders #modal-syllabus h3'), 'Syllabus');
    setNodeTextIfBroken(document.querySelector('#page-orders #modal-programs h3'), 'Educational Programs');

    const modalButtons = document.querySelectorAll('#page-orders #modal-programs .modal-body .kiu-btn-outline');
    const modalLabels = [
        '34. Mathematics',
        '36. Computer Science',
        '37. Management',
        '44. Mathematics and AI Foundations',
        '45. Management 2025',
        '47. Computer Science',
        '53. Finance',
        '54. Psychology 2025',
        '56. Program Catalog'
    ];
    modalButtons.forEach((button, index) => {
        if (modalLabels[index]) setNodeTextIfBroken(button, modalLabels[index]);
    });
    const modalCourseHeaders = document.querySelectorAll('#page-orders #modal-program-courses thead th');
    if (modalCourseHeaders[1]) setNodeTextIfBroken(modalCourseHeaders[1], 'Subject / Module Title');
    if (modalCourseHeaders[3]) setNodeTextIfBroken(modalCourseHeaders[3], 'Prerequisite / Anti-requisite');
    const modalCourseRows = document.querySelectorAll('#page-orders #modal-program-courses tbody tr');
    if (modalCourseRows[0]) {
        const cells = modalCourseRows[0].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'I Module - Mandatory Subjects');
    }
    if (modalCourseRows[1]) {
        const cells = modalCourseRows[1].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Curriculum subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7024] Statistics Foundations');
    }
    if (modalCourseRows[2]) {
        const cells = modalCourseRows[2].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Roman Law');
    }
    if (modalCourseRows[3]) {
        const cells = modalCourseRows[3].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Management Subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7027] Curriculum subjects');
    }
    if (modalCourseRows[4]) {
        const cells = modalCourseRows[4].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Sociology');
    }
}

function applyChancelleryPageEnglishOverrides() {
    const role = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : null;
    const isStaffView = [USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role);
    setNodeTextIfBroken(document.querySelector('#page-chancellery .page-hero-title'), isStaffView ? 'Appeals Inbox' : 'Appeals & Retakes');
    setNodeTextIfBroken(document.getElementById('chan-tab-appeals'), 'Appeals & Retakes');
    setNodeTextIfBroken(document.getElementById('chan-tab-finance'), 'Financial Summary');
}

function applyLibraryPageEnglishOverrides() {
    const tabs = document.querySelectorAll('#page-library .tabs-container .tab');
    if (tabs[0]) setNodeTextIfBroken(tabs[0], 'Books');
    if (tabs[1]) setNodeTextIfBroken(tabs[1], 'Read-only for students, professors, and TAs');
    setNodeTextIfBroken(document.querySelector('#page-library .modal-footer .kiu-btn-outline'), 'Close');
    setNodeTextIfBroken(document.querySelector('#page-library #modal-syllabus h3'), 'Syllabus');
    setNodeTextIfBroken(document.querySelector('#page-library #modal-programs h3'), 'Educational Programs');
    setNodeTextIfBroken(document.querySelector('#page-library #modal-programs h4'), 'Select Program');

    const modalButtons = document.querySelectorAll('#page-library #modal-programs .modal-body .kiu-btn-outline');
    const modalLabels = [
        '34. Mathematics',
        '36. Computer Science',
        '37. Management',
        '44. Mathematics and AI Foundations',
        '45. Management 2025',
        '47. Computer Science',
        '53. Finance',
        '54. Psychology 2025',
        '56. Program Catalog',
        '59. Foreign Language Courses'
    ];
    modalButtons.forEach((button, index) => {
        if (modalLabels[index]) setNodeTextIfBroken(button, modalLabels[index]);
    });
    const modalCourseHeaders = document.querySelectorAll('#page-library #modal-program-courses thead th');
    if (modalCourseHeaders[1]) setNodeTextIfBroken(modalCourseHeaders[1], 'Subject / Module Title');
    if (modalCourseHeaders[3]) setNodeTextIfBroken(modalCourseHeaders[3], 'Prerequisite / Anti-requisite');
    const modalCourseRows = document.querySelectorAll('#page-library #modal-program-courses tbody tr');
    if (modalCourseRows[0]) {
        const cells = modalCourseRows[0].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'I Module - Mandatory Subjects');
    }
    if (modalCourseRows[1]) {
        const cells = modalCourseRows[1].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Curriculum subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7024] Statistics Foundations');
    }
    if (modalCourseRows[2]) {
        const cells = modalCourseRows[2].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Roman Law');
    }
    if (modalCourseRows[3]) {
        const cells = modalCourseRows[3].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Management Subjects');
        if (cells[3]) setNodeTextIfBroken(cells[3], '[7027] Curriculum subjects');
    }
    if (modalCourseRows[4]) {
        const cells = modalCourseRows[4].querySelectorAll('td');
        if (cells[1]) setNodeTextIfBroken(cells[1], 'Sociology');
    }
}

function applyRegistrationModalEnglishOverrides() {
    setElementTextIfFound('#modal-add-concentration-subject .modal-header h3', 'Concentration Course');
    setElementTextIfFound('#modal-add-minor-subject .modal-header h3', 'Minor Course');

    const concentrationLabels = document.querySelectorAll('#modal-add-concentration-subject label');
    if (concentrationLabels[0]) setNodeTextIfBroken(concentrationLabels[0], 'Search');
    if (concentrationLabels[1]) setNodeTextIfBroken(concentrationLabels[1], 'Faculty');

    const minorLabels = document.querySelectorAll('#modal-add-minor-subject label');
    if (minorLabels[0]) setNodeTextIfBroken(minorLabels[0], 'Search');
    if (minorLabels[1]) setNodeTextIfBroken(minorLabels[1], 'Faculty');

    setElementAttrIfFound('#conc-subject-search', 'placeholder', 'Course name or code...');
    setElementAttrIfFound('#minor-subject-search', 'placeholder', 'Course name or code...');

    const concFacultyDefault = document.querySelector('#conc-subject-faculty option[value=""]');
    const minorFacultyDefault = document.querySelector('#minor-subject-faculty option[value=""]');
    setNodeTextIfBroken(concFacultyDefault, 'Select Faculty');
    setNodeTextIfBroken(minorFacultyDefault, 'Select Faculty');
}

function hasPageRoot(pageId) {
    return Boolean(document.getElementById(`page-${pageId}`));
}

function applyCommonShellEnglishOverrides() {
    document.querySelectorAll('#admin-nav .nav-item').forEach(item => {
        const onclick = item.getAttribute('onclick') || '';
        if (onclick.includes("navigate('home')")) {
            setNodeHtmlIfBroken(item, '<i class="fas fa-hammer" style="display:block; margin-bottom:5px; font-size:16px;"></i> Curriculum CMS');
        } else if (onclick.includes("navigate('admin-scheduler')")) {
            setNodeHtmlIfBroken(item, '<i class="fas fa-calendar-plus" style="display:block; margin-bottom:5px; font-size:16px;"></i> Master Scheduler');
        } else if (onclick.includes("navigate('library')")) {
            setNodeHtmlIfBroken(item, '<i class="fas fa-book" style="display:block; margin-bottom:5px; font-size:16px;"></i> Library');
        } else if (onclick.includes("navigate('orders')")) {
            setNodeHtmlIfBroken(item, '<i class="fas fa-book-open" style="display:block; margin-bottom:5px; font-size:16px;"></i> Orders');
        } else if (onclick.includes("navigate('exams')")) {
            setNodeHtmlIfBroken(item, '<i class="fas fa-file-pen" style="display:block; margin-bottom:5px; font-size:16px;"></i> Exams');
        }
    });

    document.querySelectorAll('#prof-nav .nav-item').forEach(item => {
        const onclick = item.getAttribute('onclick') || '';
        if (onclick.includes("navigate('home')")) setNodeHtmlIfBroken(item, '<i class="fas fa-th-large"></i> Teaching Matrix');
        if (onclick.includes("navigate('gradebook')")) setNodeHtmlIfBroken(item, '<i class="fas fa-check"></i> Gradebook');
        if (onclick.includes("navigate('faculty-schedule')") || onclick.includes("navigate('timetable')")) setNodeHtmlIfBroken(item, '<i class="fas fa-calendar"></i> My Schedule');
        if (onclick.includes("navigate('library')")) setNodeHtmlIfBroken(item, '<i class="fas fa-book"></i> Library Reference');
        if (onclick.includes("navigate('orders')")) setNodeHtmlIfBroken(item, '<i class="fas fa-book-open"></i> Orders');
        if (onclick.includes("navigate('exams')")) setNodeHtmlIfBroken(item, '<i class="fas fa-file-pen"></i> Exams');
    });

    syncProfessorNavActiveState();
}

function applyPageTitleEnglishOverrides() {
    const route = getRuntimeRouteIntentFromPathname();
    const titleByRoute = {
        'admin-library': 'KIU - Library',
        'admin-orders': 'KIU - Orders',
        'admin-scheduler': 'KIU - Master Scheduler',
        'chancellery': 'KIU - E-Chancellery',
        'faculty-gradebook': 'KIU - Gradebook & Assessment',
        'faculty-schedule': 'KIU - My Schedule',
        'library': 'KIU - Library Reference',
        'lms': 'KIU - LMS',
        'orders': 'KIU - Orders',
        'personal-data': 'KIU - Personal Data',
        'profile': 'KIU - Profile',
        'profile-view': 'KIU - Profile',
        'programs': 'KIU - Educational Program',
        'registration': 'KIU - Academic Registration',
        'social': 'KIU - Social',
        'staff': 'KIU - Staff Directory',
        'student-service': 'KIU - Student Service Center',
        'study-card': 'KIU - Study Card',
        'timetable': 'KIU - Timetable'
    };
    const nextTitle = titleByRoute[route];
    if (nextTitle && document?.title !== nextTitle) document.title = nextTitle;
}

function applyFacultyOptionEnglishOverrides() {
    const labelByValue = {
        all: 'All Faculties',
        arts: 'Arts & Humanities',
        artsandhumanities: 'Arts & Humanities',
        cs: 'Computer Science',
        econ: 'Management',
        law: 'Law',
        med: 'Medicine',
        medicine: 'Medicine',
        management: 'Management',
        science: 'Science'
    };
    document.querySelectorAll('#admin-tt-faculty, #tt-filter-fac').forEach(select => {
        select.querySelectorAll('option').forEach(opt => {
            const valueKey = String(opt.value || '').trim().toLowerCase();
            const nextLabel = labelByValue[valueKey] || toEnglishText(opt.textContent || '').replace(/^\?\?\s*/, '').trim();
            if (nextLabel && nextLabel !== opt.textContent.trim()) opt.textContent = nextLabel;
        });
    });
}

function applyStructuralEnglishOverrides() {
    if (document?.documentElement?.lang !== 'en') document.documentElement.lang = 'en';
    const shellRole = (() => {
        try {
            const requestedRole = String(new URLSearchParams(window.location.search || '').get('view') || '').trim().toLowerCase();
            if (Object.values(USER_ROLES).includes(requestedRole)) return requestedRole;
        } catch (error) {}
        return currentUserRole || USER_ROLES.STUDENT;
    })();
    const shellTitle = shellRole === USER_ROLES.PROFESSOR
        ? 'KIU - Professor View'
        : shellRole === USER_ROLES.TA
            ? 'KIU - Teaching Assistant View'
            : shellRole === USER_ROLES.ADMIN
                ? 'KIU - Admin Dashboard'
                : shellRole === USER_ROLES.STUDENT_SERVICE
                    ? 'KIU - Student Service'
                    : 'KIU - Student Portal';
    if (document?.title !== shellTitle) document.title = shellTitle;

    setElementTextIfFound('.header-greeting', `Hello ${getUiGreetingName()}`);
    setElementTextIfFound('.user-name', getUiDisplayName());
    setElementTextIfFound('.user-role', getUiRoleLabel());

    setElementHtmlIfFound('#nav-lms', '<i class="fas fa-book-reader"></i> LMS');
    setElementHtmlIfFound('#nav-personal-data', '<i class="far fa-user"></i> Personal Data');
    setElementHtmlIfFound('#nav-chancellery', '<i class="fas fa-desktop"></i> E-Chancellery');
    setElementHtmlIfFound('#nav-student-service', '<i class="fas fa-headset"></i> Student Service');
    setElementHtmlIfFound('#nav-programs', '<i class="fas fa-file-signature"></i> Educational Program');
    setElementHtmlIfFound('#nav-study-card', '<i class="far fa-address-card"></i> Study Card');
    setElementHtmlIfFound('#nav-registration', '<i class="fas fa-check-square"></i> Academic Registration');
    setElementHtmlIfFound('#nav-timetable', '<i class="fas fa-chalkboard"></i> Timetable');
    setElementHtmlIfFound('#nav-orders', '<i class="fas fa-book-open"></i> Orders');
    setElementHtmlIfFound('#nav-library', '<i class="fas fa-book"></i> Library');

    document.querySelectorAll('.profile-menu-item').forEach(item => {
        if (item.querySelector('.fa-user') && item.innerHTML !== '<i class="far fa-user"></i> Profile') item.innerHTML = '<i class="far fa-user"></i> Profile';
        if (item.querySelector('.fa-comments') && item.innerHTML !== '<i class="fas fa-comments"></i> Social') item.innerHTML = '<i class="fas fa-comments"></i> Social';
        if (item.querySelector('.fa-sign-out-alt') && item.innerHTML !== '<i class="fas fa-sign-out-alt"></i> Logout') item.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    });

    const footer = document.querySelector('footer');
    if (footer && footer.dataset.englishFooterApplied !== 'true') {
        const img = footer.querySelector('img');
        footer.innerHTML = '© 2019 ini.ge All rights reserved';
        footer.innerHTML = 'Copyright 2019 ini.ge. All rights reserved.';
        if (img) footer.appendChild(document.createTextNode(' ')), footer.appendChild(img);
        footer.dataset.englishFooterApplied = 'true';
    }

    setElementTextIfFound('#modal-syllabus h3', 'Syllabus');
    setElementTextIfFound('#modal-programs h3', getUiDisplayName());
    setElementTextIfFound('#modal-programs h4', 'Select Program');
    setElementTextIfFound('#modal-add-concentration-subject h3', 'Concentration Course');
    setElementTextIfFound('#modal-add-minor-subject h3', 'Minor Course');

    const closeButtons = document.querySelectorAll('.modal-footer .kiu-btn-outline, .modal-footer .kiu-btn-blue');
    closeButtons.forEach(btn => {
        if (hasBrokenUiText(btn.textContent || '')) {
            if (btn.textContent !== 'Close') btn.textContent = 'Close';
        }
    });

    document.querySelectorAll('label').forEach(label => {
        const text = (label.textContent || '').trim();
        if (text === '?????') {
            const updated = label.innerHTML.replace(/\?{5}/g, 'Search');
            if (updated !== label.innerHTML) label.innerHTML = updated;
        }
        if (text === '?????????') {
            const updated = label.innerHTML.replace(/\?{9}/g, 'Faculty');
            if (updated !== label.innerHTML) label.innerHTML = updated;
        }
    });

    document.querySelectorAll('input[placeholder]').forEach(input => {
        if (hasBrokenUiText(input.getAttribute('placeholder') || '')) {
            const translated = toEnglishText(input.getAttribute('placeholder'));
            if (translated !== input.getAttribute('placeholder')) input.setAttribute('placeholder', translated);
        }
    });

    document.querySelectorAll('select option').forEach(option => {
        if (hasBrokenUiText(option.textContent || '')) {
            const translated = toEnglishText(option.textContent);
            if (translated !== option.textContent) option.textContent = translated;
        }
    });

    applyPageTitleEnglishOverrides();
    applyFacultyOptionEnglishOverrides();

    applyCommonShellEnglishOverrides();
    if (
        document.getElementById('modal-programs')
        || hasPageRoot('registration')
        || document.getElementById('cal-content-events')
        || document.getElementById('cal-content-officehours')
    ) {
        applyStudentPageEnglishOverrides();
    }
    if (hasPageRoot('home')) applyStudentDashboardEnglishOverrides();
    if (hasPageRoot('profile')) applyProfilePageEnglishOverrides();
    if (hasPageRoot('personal-data')) applyPersonalDataPageEnglishOverrides();
    if (hasPageRoot('study-card')) applyStudyCardPageEnglishOverrides();
    if (hasPageRoot('programs') || document.getElementById('modal-programs')) applyProgramsPageEnglishOverrides();
    if (hasPageRoot('orders')) applyOrdersPageEnglishOverrides();
    if (hasPageRoot('chancellery')) applyChancelleryPageEnglishOverrides();
    if (hasPageRoot('library')) applyLibraryPageEnglishOverrides();
    if (hasPageRoot('calendar') || document.getElementById('cal-content-officehours')) applyCalendarPageEnglishOverrides();
    if (hasPageRoot('timetable')) applyTimetablePageEnglishOverrides();
    if (document.getElementById('modal-add-concentration-subject') || document.getElementById('modal-add-minor-subject')) {
        applyRegistrationModalEnglishOverrides();
    }
}

function preserveImplicitOptionValues(root) {
    if (!root || !root.querySelectorAll) return;
    if (!root.querySelector('option:not([value])')) return;
    root.querySelectorAll('option').forEach(opt => {
        if (!opt.hasAttribute('value')) {
            opt.setAttribute('value', (opt.textContent || '').trim());
        }
    });
}

function translateElementAttributes(root) {
    if (!root || !root.querySelectorAll) return;
    if (!root.querySelector('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"]')) return;
    const nodes = root.querySelectorAll('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"]');
    nodes.forEach(el => {
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
            if (!el.hasAttribute(attr)) return;
            const current = el.getAttribute(attr);
            const translated = toEnglishText(current);
            if (translated !== current) el.setAttribute(attr, translated);
        });
        if (el.matches('input[type="button"],input[type="submit"]')) {
            const translated = toEnglishText(el.value);
            if (translated !== el.value) el.value = translated;
        }
    });
}

function translateTextNodes(root) {
    if (!root || !window.NodeFilter || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const textNodes = [];
    let current = walker.nextNode();
    while (current) {
        textNodes.push(current);
        current = walker.nextNode();
    }
    textNodes.forEach(node => {
        const translated = toEnglishText(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
    });
}

function applyEnglishLocalization(root = document.body || document.documentElement, options = {}) {
    const structural = Boolean(options.structural);
    if (!root || window.__kiuEnglishLocalizationActive) return;
    window.__kiuEnglishLocalizationActive = true;
    try {
        if (document && typeof document.title === 'string') {
            const translatedTitle = toEnglishText(document.title);
            if (translatedTitle && translatedTitle !== document.title) document.title = translatedTitle;
        }
        preserveImplicitOptionValues(root);
        translateElementAttributes(root);
        if (rootHasTranslatableText(root)) {
            translateTextNodes(root);
        }
        // Structural rewrites are expensive, so only do them for the initial full-page pass.
        if (structural && !window.__kiuStructuralEnglishOverridesApplied) {
            applyStructuralEnglishOverrides();
            window.__kiuStructuralEnglishOverridesApplied = true;
        }
    } finally {
        window.__kiuEnglishLocalizationActive = false;
    }
}

function queueEnglishLocalization() {
    const target = arguments.length ? arguments[0] : (document.body || document.documentElement);
    if (!window.__kiuEnglishLocalizationQueue) window.__kiuEnglishLocalizationQueue = new Set();
    if (target) window.__kiuEnglishLocalizationQueue.add(target);
    if (window.__kiuEnglishLocalizationQueued) return;
    window.__kiuEnglishLocalizationQueued = true;
    const schedule = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
    schedule(() => {
        const queue = Array.from(window.__kiuEnglishLocalizationQueue || []);
        window.__kiuEnglishLocalizationQueue = new Set();
        window.__kiuEnglishLocalizationQueued = false;
        if (queue.length === 0) {
            applyEnglishLocalization(document.body || document.documentElement, { structural: true });
            return;
        }
        queue.forEach(node => applyEnglishLocalization(node, {
            structural: node === document.body || node === document.documentElement
        }));
    });
}

function wrapDialogLocalization() {
    if (window.__kiuDialogsWrappedToEnglish) return;
    window.__kiuDialogsWrappedToEnglish = true;
    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;
    const nativePrompt = window.prompt;
    window.alert = (message) => nativeAlert(toEnglishText(message));
    window.confirm = (message) => nativeConfirm(toEnglishText(message));
    window.prompt = (message, defaultValue) => nativePrompt(toEnglishText(message), defaultValue);
}

function installEnglishLocalization() {
    if (window.__kiuEnglishLocalizationInstalled) return;
    window.__kiuEnglishLocalizationInstalled = true;
    wrapDialogLocalization();

    const start = () => {
        const observerRoot = document.documentElement || document.body;
        if (!observerRoot || !window.MutationObserver) return;
        const scheduleInitialLocalization = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
        scheduleInitialLocalization(() => queueEnglishLocalization(observerRoot));
        const observer = new MutationObserver((mutations) => {
            if (window.__kiuEnglishLocalizationActive) return;
            const queuedNodes = new Set();
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && nodeNeedsEnglishLocalization(node)) {
                        queuedNodes.add(node);
                    }
                    if (node.nodeType === Node.TEXT_NODE && node.parentElement && nodeNeedsEnglishLocalization(node)) {
                        queuedNodes.add(node.parentElement);
                    }
                });
            });
            if (queuedNodes.size === 0) return;
            queuedNodes.forEach(node => queueEnglishLocalization(node));
        });
        observer.observe(observerRoot, { childList: true, subtree: true });
        window.__kiuEnglishLocalizationObserver = observer;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
}

installEnglishLocalization();

/* Mobile sidebar navigation: auto-close on nav click.
   Overlay dismiss, auto-collapse, swipe gestures, and
   bottom-nav are handled by the Mobile Experience
   Controller in index.html. */

(function initMobileSidebarNavClose() {
    // When a sidebar nav item is clicked on mobile, close the sidebar
    document.addEventListener('click', function(e) {
        if (window.innerWidth > 768) return;
        var navItem = e.target.closest('.lux-nav-item');
        if (!navItem) return;
        // Small delay so navigation fires first
        setTimeout(function() {
            if (!document.body.classList.contains('lux-sidebar-collapsed')) {
                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar();
                }
            }
        }, 120);
    });
})();

(function installMobileRoleSwitcherShortcut() {
    function closeInlineMobileSheet() {
        if (typeof window.closeSheet === 'function') {
            try {
                window.closeSheet();
                return;
            } catch (error) {}
        }
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        sheet.hidden = true;
        sheet.setAttribute('aria-hidden', 'true');
        sheet.style.display = 'none';
        document.body.style.overflow = '';
    }

    function openRoleSwitcher() {
        if (typeof window.openRoleSwitcherPanel === 'function') {
            return window.openRoleSwitcherPanel();
        }
        var explicitRoleButton = document.getElementById('lux-role-picker-btn');
        if (explicitRoleButton) {
            explicitRoleButton.click();
            return true;
        }
        var fallbackPicker = document.querySelector('.lux-picker-btn');
        if (fallbackPicker) {
            fallbackPicker.click();
            return true;
        }
        return false;
    }

    document.addEventListener('click', function(event) {
        var trigger = event.target && typeof event.target.closest === 'function'
            ? event.target.closest('#mob-act-admin')
            : null;
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        closeInlineMobileSheet();
        var schedule = window.requestAnimationFrame || function(callback) {
            return window.setTimeout(callback, 0);
        };
        schedule(function() {
            openRoleSwitcher();
        });
    }, true);
})();

(function registerPortalServiceWorker() {
    const PORTAL_CACHE_RESET_KEY = 'KIU_PORTAL_CACHE_RESET_VERSION';
    const PORTAL_CACHE_RESET_VERSION = '20260514-studentsadmin-clean2';

    async function clearPortalSiteCaches(force = false) {
        try {
            const seenVersion = localStorage.getItem(PORTAL_CACHE_RESET_KEY);
            if (!force && seenVersion === PORTAL_CACHE_RESET_VERSION) return false;
        } catch (error) {}

        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => {
                    try {
                        registration.active?.postMessage({ type: 'PURGE_PORTAL_CACHES' });
                    } catch (error) {}
                    return registration.unregister();
                }));
            } catch (error) {}
        }

        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.filter((key) => String(key || '').startsWith('kiu-portal-shell-')).map((key) => caches.delete(key)));
            } catch (error) {}
        }

        try {
            localStorage.setItem(PORTAL_CACHE_RESET_KEY, PORTAL_CACHE_RESET_VERSION);
        } catch (error) {}
        return true;
    }

    window.clearPortalSiteCaches = clearPortalSiteCaches;
    window.clearPortalSiteCache = () => clearPortalSiteCaches(true);

    async function ensureManifestLink() {
        if (document.querySelector('link[rel="manifest"]')) return;
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = 'manifest.webmanifest?v=20260426-prod1';
        document.head.appendChild(link);
    }

    async function registerWorker() {
        if (!('serviceWorker' in navigator)) return;
        if (window.location.protocol !== 'https:' && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
            return;
        }
        try {
            await clearPortalSiteCaches(false);
            await ensureManifestLink();
            await navigator.serviceWorker.register(`service-worker.js?v=${PORTAL_CACHE_RESET_VERSION}`, { scope: './' });
        } catch (error) {
            console.warn('Service worker registration failed.', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerWorker, { once: true });
    } else {
        registerWorker();
    }
})();
