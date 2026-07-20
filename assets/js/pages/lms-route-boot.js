(function () {
    function safeHtml(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(String(value == null ? '' : value));
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function repairLmsDisplayText(value, fallback = '') {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return String(fallback || '').trim();
        const shouldRepair = ((typeof looksLikeMojibake === 'function' && looksLikeMojibake(raw))
            || /[\u00A0-\uFFFF]/.test(raw)
            || /[\u10A0-\u10FF]/.test(raw));
        if (!shouldRepair) return raw;
        let cleaned = raw;
        try {
            if (typeof cleanupEncodingArtifacts === 'function') cleaned = cleanupEncodingArtifacts(cleaned);
        } catch (error) {}
        try {
            if (typeof toEnglishText === 'function') cleaned = toEnglishText(cleaned);
        } catch (error) {}
        cleaned = String(cleaned == null ? '' : cleaned).trim();
        return cleaned || raw || String(fallback || '').trim();
    }
    function getLmsActiveFacultyCode() {
        const storedFaculty = localStorage.getItem('currentFaculty');
        const fallback = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        return typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(storedFaculty || fallback, fallback)
            : (storedFaculty || fallback || 'ECON');
    }
    function getLmsSubjectName(subject) {
        return repairLmsDisplayText(subject?.name || subject?.title || subject?.subjectName || subject?.label, 'Untitled Course');
    }
    function getLmsSubjectId(subject, index) {
        return subject?.id || subject?.subjectId || subject?.courseId || `lms-subject-${index}`;
    }
    function getLmsSubjectFaculty(subject) {
        return subject?.faculty || subject?.facultyCode || '';
    }
    function isLmsStudentHomeViewer() {
        return typeof isLmsStudentViewer === 'function' && isLmsStudentViewer();
    }
    function getLmsSubjectSource() {
        if (isLmsStudentHomeViewer() && typeof getStudentLmsEnrolledSubjects === 'function') {
            return getStudentLmsEnrolledSubjects(
                typeof getLmsStudentSelectedSemester === 'function' ? getLmsStudentSelectedSemester() : null
            );
        }
        const facultyCode = getLmsActiveFacultyCode();
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, facultyCode || 'ECON')
            : facultyCode;
        const matchesFaculty = (subject) => {
            const subjectFaculty = getLmsSubjectFaculty(subject);
            const normalizedSubjectFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(subjectFaculty || normalizedFaculty, normalizedFaculty || 'ECON')
                : subjectFaculty;
            return normalizedSubjectFaculty === normalizedFaculty;
        };
        const facultyCurriculum = typeof getActiveCurriculum === 'function'
            ? (getActiveCurriculum(normalizedFaculty) || [])
            : [];
        const flatCurriculum = Array.isArray(window.KIU_STATE?.curriculum)
            ? window.KIU_STATE.curriculum.filter(matchesFaculty)
            : [];
        const profileCurriculum = Array.isArray(window.KIU_STATE?.facultyProfiles?.[normalizedFaculty]?.curriculum)
            ? window.KIU_STATE.facultyProfiles[normalizedFaculty].curriculum.filter(matchesFaculty)
            : [];
        const merged = [].concat(facultyCurriculum, flatCurriculum, profileCurriculum);
        const seen = new Set();
        return merged.filter((subject, index) => {
            if (!matchesFaculty(subject)) return false;
            const subjectId = getLmsSubjectId(subject, index);
            if (seen.has(subjectId)) return false;
            seen.add(subjectId);
            return true;
        });
    }
    function getLmsSubjectGroupCount(subject, subjectId) {
        const directGroups = Array.isArray(subject?.groups) ? subject.groups : [];
        if (directGroups.length) return directGroups.length;
        if (typeof getAvailableGroupsForSubject === 'function') return getAvailableGroupsForSubject(subjectId).length;
        return Array.isArray(window.KIU_STATE?.availableGroups?.[subjectId])
            ? window.KIU_STATE.availableGroups[subjectId].length
            : 0;
    }
    function renderLmsStudentSemesterBar() {
        const bar = document.getElementById('lms-student-semester-bar');
        const optionsHost = document.getElementById('lms-student-semester-options');
        if (!bar || !optionsHost) return;
        const isStudent = isLmsStudentHomeViewer();
        bar.hidden = !isStudent;
        if (!isStudent) return;
        const semesters = typeof getStudentLmsSemesterOptions === 'function'
            ? getStudentLmsSemesterOptions()
            : [];
        const selected = typeof getLmsStudentSelectedSemester === 'function'
            ? getLmsStudentSelectedSemester()
            : 1;
        const semesterChoices = semesters.length ? semesters : [selected];
        optionsHost.innerHTML = semesterChoices.map((semesterValue) => {
            const active = Number(semesterValue) === Number(selected);
            return `<button
                type="button"
                class="lux-status-pill lms-student-semester-option${active ? ' is-active' : ''}"
                data-lms-semester="${safeHtml(String(semesterValue))}"
                role="tab"
                aria-selected="${active ? 'true' : 'false'}">Semester ${safeHtml(String(semesterValue))}</button>`;
        }).join('');
    }
    function syncLmsStudentModePresentation() {
        const isStudent = isLmsStudentHomeViewer();
        document.body?.classList.toggle('lms-student-mode', isStudent);
        const sectionTitle = document.getElementById('lms-subjects-section-title');
        const sectionCopy = document.getElementById('lms-subjects-section-copy');
        const heroCopy = document.querySelector('.lms-hero-v2-left .page-hero-copy');
        if (sectionTitle) {
            sectionTitle.textContent = isStudent ? 'My enrolled subjects' : 'Published faculty subjects';
        }
        if (sectionCopy) {
            sectionCopy.textContent = isStudent
                ? 'Subjects you registered for in the selected semester. Open one to continue in your course workspace.'
                : 'Published subjects for the selected faculty, ready to open by group.';
        }
        if (heroCopy) {
            heroCopy.textContent = isStudent
                ? 'Review subjects you chose during registration, switch semesters, and open your enrolled course workspace.'
                : 'Open the right faculty subject, choose your group, and continue work in a focused LMS built for students, teaching staff, and administrators.';
        }
        renderLmsStudentSemesterBar();
        if (typeof syncLmsCourseBackButtonLabel === 'function') syncLmsCourseBackButtonLabel();
    }
    function getLmsSubjectSemesterValue(subject) {
        const semester = subject?.semester ?? subject?.semesterNumber ?? null;
        const normalized = Number.parseInt(semester, 10);
        if (Number.isFinite(normalized) && normalized > 0) return normalized;
        const fallback = String(semester || '').trim();
        return fallback || '';
    }
    function getLmsSubjectCourseValue(subject) {
        const directCourse = subject?.course ?? null;
        const normalizedCourse = Number.parseInt(directCourse, 10);
        if (Number.isFinite(normalizedCourse) && normalizedCourse > 0) return normalizedCourse;
        const directCourseLabel = String(directCourse || '').trim();
        if (directCourseLabel) return directCourseLabel;
        const semesterValue = getLmsSubjectSemesterValue(subject);
        const normalizedSemester = Number.parseInt(semesterValue, 10);
        return Number.isFinite(normalizedSemester) && normalizedSemester > 0
            ? Math.ceil(normalizedSemester / 2)
            : '';
    }
    function buildLmsSubjectMetaBadges(subject) {
        const badges = [];
        const semesterValue = getLmsSubjectSemesterValue(subject);
        if (semesterValue) {
            badges.push(`<span class="lux-status-pill is-muted"><i class="fas fa-calendar-week"></i> Semester ${safeHtml(String(semesterValue))}</span>`);
        }
        const courseValue = getLmsSubjectCourseValue(subject);
        if (courseValue) {
            badges.push(`<span class="lux-status-pill is-muted"><i class="fas fa-graduation-cap"></i> Course ${safeHtml(String(courseValue))}</span>`);
        }
        return badges.length ? `<div class="lms-clean-subject-meta">${badges.join('')}</div>` : '';
    }
    function renderLmsHeroSummary(subjects) {
        const facultyCode = getLmsActiveFacultyCode();
        const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(facultyCode) : facultyCode;
        const isStudent = isLmsStudentHomeViewer();
        const groupCount = isStudent
            ? subjects.length
            : subjects.reduce((sum, subject, index) => sum + getLmsSubjectGroupCount(subject, getLmsSubjectId(subject, index)), 0);
        const subjectCount = subjects.length;
        const waiting = subjectCount === 0;
        const focusTitle = waiting
            ? (isStudent ? 'No enrolled subjects yet' : 'No published subjects yet')
            : (isStudent ? 'Subjects ready to open' : 'Faculty scope is live');
        const focusCopy = isStudent
            ? (waiting
                ? 'No enrolled subjects for this semester yet. Register for courses to populate your LMS workspace.'
                : `${subjectCount} enrolled subject${subjectCount === 1 ? '' : 's'} are available for this semester. Open one to continue.`)
            : (waiting
                ? 'No published LMS subjects yet. This faculty route is waiting for content.'
                : `${subjectCount} subjects and ${groupCount} groups are ready in this faculty scope.`);
        const focusChip = waiting
            ? (isStudent ? '0 enrolled' : '0 subjects')
            : (isStudent
                ? `${subjectCount} enrolled`
                : `${subjectCount} subjects`);
        const focusKicker = isStudent ? 'Your LMS focus' : 'Faculty workspace';

        // Timetable-style focus panel (right column)
        const focusKickerEl = document.getElementById('lms-focus-kicker');
        if (focusKickerEl) focusKickerEl.textContent = focusKicker;
        const focusChipEl = document.getElementById('lms-focus-chip');
        if (focusChipEl) focusChipEl.textContent = focusChip;
        const focusTitleEl = document.getElementById('lms-focus-title');
        if (focusTitleEl) focusTitleEl.textContent = focusTitle;
        const focusCopyEl = document.getElementById('lms-focus-copy');
        if (focusCopyEl) focusCopyEl.textContent = focusCopy;
        const focusMetaText = document.getElementById('lms-focus-meta-text');
        if (focusMetaText) focusMetaText.textContent = facultyLabel;
    }
    function buildLmsSubjectDeckSignature(subjects, facultyCode, isStudent) {
        return JSON.stringify({
            facultyCode: String(facultyCode || ''),
            role: isStudent ? 'student' : (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : ''),
            semester: isStudent && typeof getLmsStudentSelectedSemester === 'function' ? getLmsStudentSelectedSemester() : '',
            subjects: subjects.map((subject, index) => ({
                id: getLmsSubjectId(subject, index),
                name: getLmsSubjectName(subject),
                courseKey: String(subject?.courseKey || ''),
                groupId: String(subject?.groupId || '')
            }))
        });
    }
    function renderLmsSubjectDeck(options = {}) {
        const grid = document.getElementById('lms-subject-grid');
        if (!grid) return;
        syncLmsStudentModePresentation();
        const facultyCode = getLmsActiveFacultyCode();
        const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(facultyCode) : facultyCode;
        const isStudent = isLmsStudentHomeViewer();
        const subjects = getLmsSubjectSource().slice(0, isStudent ? 48 : 18);
        const nextSignature = buildLmsSubjectDeckSignature(subjects, facultyCode, isStudent);
        const forceRefresh = options && options.force === true;
        renderLmsHeroSummary(subjects);
        const laneChip = document.getElementById('lms-lane-chip');
        if (laneChip) {
            laneChip.innerHTML = isStudent
                ? '<i class="fas fa-user-graduate"></i> My LMS'
                : `<i class="fas fa-book-open"></i> ${safeHtml(facultyLabel)} LMS`;
        }
        const emptyGuidance = document.getElementById('lms-empty-guidance');
        if (emptyGuidance) {
            if (!subjects.length) {
                // Empty well owns the message — avoid duplicate orphan line
                emptyGuidance.hidden = true;
                emptyGuidance.textContent = '';
            } else {
                emptyGuidance.hidden = false;
                emptyGuidance.textContent = isStudent
                    ? `${subjects.length} enrolled subject${subjects.length === 1 ? '' : 's'} are listed for semester ${String(typeof getLmsStudentSelectedSemester === 'function' ? getLmsStudentSelectedSemester() : '')}.`
                    : `${subjects.length} published subjects are currently available for ${facultyLabel}.`;
            }
        }
        if (!forceRefresh && grid.dataset.lmsSubjectDeckSignature === nextSignature) {
            return;
        }
        grid.innerHTML = subjects.map((subject, index) => {
            const subjectId = getLmsSubjectId(subject, index);
            const subjectName = getLmsSubjectName(subject);
            const groupCount = getLmsSubjectGroupCount(subject, subjectId);
            const icon = subject.icon || 'fas fa-book-reader';
            const courseKey = subject.courseKey || '';
            const groupId = subject.groupId || '';
            const groupName = subject.groupName || '';
            const kickerLabel = isStudent ? 'Enrolled' : 'Published';
            const resolvedCourseKey = courseKey || (groupId && subjectId ? `${subjectId}::${groupId}` : '');
            const nextSessionLine = resolvedCourseKey && typeof window.renderLmsNextSessionHtml === 'function' && typeof window.getLmsNextSessionForGroup === 'function'
                ? window.renderLmsNextSessionHtml(window.getLmsNextSessionForGroup(resolvedCourseKey), 'compact')
                : '';
            const metaHtml = isStudent
                ? `<div class="lms-clean-card-meta is-compact">
                    <span class="lux-status-pill is-muted"><i class="fas fa-door-open"></i> ${safeHtml(groupName || 'Your section')}</span>
                   </div>${nextSessionLine}`
                : `<div class="lms-clean-card-meta is-compact">
                    <span class="lux-status-pill is-muted"><i class="fas fa-users"></i> ${groupCount} group${groupCount !== 1 ? 's' : ''}</span>
                   </div>`;
            return `<button
                type="button"
                class="lux-strip-card lux-lms-subject-card"
                data-subject-id="${safeHtml(subjectId)}"
                data-subject-title="${safeHtml(subjectName)}"
                data-icon-class="${safeHtml(icon)}"
                data-course-key="${safeHtml(courseKey)}"
                data-group-id="${safeHtml(groupId)}"
                data-lms-subject-card="true">
                <div class="lux-card-body">
                    <div class="lms-clean-card-kicker"><i class="${safeHtml(icon)}"></i> ${safeHtml(kickerLabel)}</div>
                    <div class="lms-clean-card-title">${safeHtml(subjectName)}</div>
                    ${buildLmsSubjectMetaBadges(subject)}
                    ${metaHtml}
                </div>
            </button>`;
        }).join('') || `<div class="lms-route-empty lms-route-empty--full-span">
            <div class="lms-route-empty-icon"><i class="fas fa-book-open"></i></div>
            <div class="lms-route-empty-title lms-route-copy-mt-12">${isStudent ? 'No enrolled subjects yet' : 'No subjects yet'}</div>
            <div class="lms-route-empty-copy">${isStudent
                ? 'Register for subjects on the Registration page. After you choose your group, they will appear here for the matching semester.'
                : `Publish subjects for the ${safeHtml(facultyLabel)} faculty from the admin workspace, then they appear here automatically.`}</div>
        </div>`;
        grid.dataset.lmsSubjectDeckSignature = nextSignature;
        // Deck is rebuilt via innerHTML — force engine paint on the new tiles
        // (MutationObserver is debounced and can miss mid-navigation re-renders).
        const subjectsPanel = grid.closest('.lms-clean-subjects--merged') || grid;
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [subjectsPanel] });
        } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
            window.refreshLuxuryTransparencySurfaces(undefined, { roots: [subjectsPanel] });
        }
    }
    window.renderLmsSubjectDeck = renderLmsSubjectDeck;
    window.renderLMSSubjects = renderLmsSubjectDeck;
    function isLmsSubjectDeckVisible() {
        const page = document.getElementById('page-lms');
        return Boolean(page) && !page.hidden;
    }
    function isLmsCourseWorkspaceVisibleStandalone() {
        const workspace = document.getElementById('page-lms-inner');
        const courseKey = String(window.currentCourseId || '').trim();
        return Boolean(workspace) && !workspace.hidden && Boolean(courseKey);
    }
    function ensureLmsExtendedRuntimeForTab(tabId) {
        const normalized = String(tabId || '').toLowerCase();
        let tabModuleEnsure = null;
        if (normalized === 'gradebook' && typeof window.ensureLmsGradebookRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsGradebookRuntime;
        } else if (normalized === 'live-quiz' && typeof window.ensureLmsLiveQuizRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsLiveQuizRuntime;
        } else if (normalized === 'whiteboard' && typeof window.ensureLmsWhiteboardRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsWhiteboardRuntime;
        } else if ((normalized === 'quiz' || normalized === 'monitoring') && typeof window.ensureLmsQuizRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsQuizRuntime;
        } else if (normalized === 'calls' && typeof window.ensureLmsCallsRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsCallsRuntime;
        } else if (normalized === 'interaction' && typeof window.ensureLmsInteractionRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsInteractionRuntime;
        } else if (['materials', 'concepts', 'workspace'].includes(normalized) && typeof window.ensureLmsContentRuntime === 'function') {
            tabModuleEnsure = window.ensureLmsContentRuntime;
        }
        if (tabModuleEnsure) {
            return Promise.resolve(tabModuleEnsure()).catch(() => false);
        }
        if (document.body?.classList.contains('lux-route-lms')) {
            if (typeof window.switchLMSTab === 'function') {
                return Promise.resolve(true);
            }
            if (typeof window.ensurePortalLmsRuntimeLoaded === 'function') {
                return Promise.resolve(window.ensurePortalLmsRuntimeLoaded()).catch(() => false);
            }
        }
        if (typeof window.ensurePortalRegistrationRuntimeLoaded !== 'function') {
            return Promise.resolve(true);
        }
        return Promise.resolve(window.ensurePortalRegistrationRuntimeLoaded()).catch(() => false);
    }

    function shouldPreloadLmsQuizRuntimeForLaunch() {
        try {
            if (sessionStorage.getItem('KIU_PENDING_PROTECTED_QUIZ_LAUNCH')) return true;
        } catch (_error) {}
        try {
            const params = new URLSearchParams(window.location.search || '');
            return Boolean(String(params.get('protectedCourseKey') || '').trim()
                && String(params.get('protectedQuizId') || '').trim());
        } catch (_error) {
            return false;
        }
    }

    function shouldPreloadLmsCallsRuntimeForLaunch() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            return Boolean(String(params.get('lmsCall') || '').trim());
        } catch (_error) {
            return false;
        }
    }

    function preloadLmsQuizRuntimeIfNeeded() {
        if (!shouldPreloadLmsQuizRuntimeForLaunch()) return;
        if (typeof window.ensureLmsQuizRuntime === 'function') {
            window.ensureLmsQuizRuntime().catch(() => null);
        }
    }

    function preloadLmsCallsRuntimeIfNeeded() {
        if (!shouldPreloadLmsCallsRuntimeForLaunch()) return;
        if (typeof window.ensureLmsCallsRuntime === 'function') {
            window.ensureLmsCallsRuntime().catch(() => null);
        }
    }

    window.ensureLmsExtendedRuntimeForTab = ensureLmsExtendedRuntimeForTab;
    function bindLmsDelegatedActions() {
        if (document.body?.dataset.lmsDelegatedActionsBound === '1') return;
        if (document.body) document.body.dataset.lmsDelegatedActionsBound = '1';
        document.addEventListener('click', async (event) => {
            const semesterButton = event.target.closest?.('[data-lms-semester]');
            if (semesterButton) {
                event.preventDefault();
                const semesterValue = parseInt(semesterButton.getAttribute('data-lms-semester'), 10);
                if (Number.isFinite(semesterValue) && semesterValue > 0 && typeof setLmsStudentSelectedSemester === 'function') {
                    setLmsStudentSelectedSemester(semesterValue);
                }
                return;
            }
            const subjectCard = event.target.closest?.('[data-lms-subject-card="true"]');
            if (subjectCard) {
                event.preventDefault();
                if (isLmsStudentHomeViewer() && typeof window.openLmsStudentEnrolledSubject === 'function') {
                    window.openLmsStudentEnrolledSubject(subjectCard);
                } else if (typeof window.openLMSGroupsFromCard === 'function') {
                    window.openLMSGroupsFromCard(subjectCard);
                }
                return;
            }
            const actionButton = event.target.closest?.('[data-lms-action]');
            if (actionButton) {
                event.preventDefault();
                const action = actionButton.dataset.lmsAction;
                if (action === 'close-groups' && typeof window.closeLMSGroups === 'function') window.closeLMSGroups();
                if (action === 'back-to-groups' && typeof window.backToLMSGroups === 'function') window.backToLMSGroups();
                if (action === 'open-personal-dashboard') {
                    const openDashboard = async () => {
                        if (typeof window.ensureLmsPersonalDashboardRuntime === 'function') {
                            await window.ensureLmsPersonalDashboardRuntime();
                        }
                        if (typeof window.ensureLmsWhiteboardRuntime === 'function') {
                            await window.ensureLmsWhiteboardRuntime().catch(() => null);
                        }
                        if (typeof window.openLmsPersonalDashboard === 'function') {
                            await window.openLmsPersonalDashboard();
                        }
                    };
                    openDashboard().catch(() => null);
                }
                return;
            }
            const sectionButton = event.target.closest?.('[data-lms-section]');
            if (sectionButton) {
                event.preventDefault();
                if (typeof window.setLmsActiveSection === 'function') window.setLmsActiveSection(sectionButton.dataset.lmsSection);
                return;
            }
            const tabButton = event.target.closest?.('[data-lms-tab]');
            if (tabButton) {
                event.preventDefault();
                const tabId = tabButton.dataset.lmsTab;
                await ensureLmsExtendedRuntimeForTab(tabId);
                if (typeof window.switchLMSTab === 'function') window.switchLMSTab(tabId);
            }
        });
    }
    function ensureLmsRouteVisualState() {
        const body = document.body;
        if (!body) return;
        body.classList.remove('lux-home-page');
        body.classList.add('lux-nonhome-page', 'lux-route-lms', 'lux-unified-shell', 'lux-site-modernized');
        body.dataset.luxPage = 'lms';
        body.dataset.luxEntry = 'lms';
        if (!body.dataset.luxBackgroundMode) {
            body.dataset.luxBackgroundMode = localStorage.getItem('kiuLuxuryBackgroundMode') || 'peak';
        }
        document.documentElement.dataset.luxPage = 'lms';
        Array.from(body.classList).forEach((className) => {
            if (/^lux-route-/.test(className) && className !== 'lux-route-lms') {
                body.classList.remove(className);
            }
        });
    }
    window.ensureLmsRouteVisualState = ensureLmsRouteVisualState;
    function isLmsVisualContextActive() {
        const lmsSection = document.getElementById('page-lms');
        if (!lmsSection) return true;
        return lmsSection.classList.contains('active-page')
            || document.body.classList.contains('lux-route-lms');
    }
    function refreshLmsParticleBackground(mode) {
        const activeBackgroundMode = mode
            || document.body?.dataset.luxBackgroundMode
            || localStorage.getItem('kiuLuxuryBackgroundMode')
            || 'peak';
        // WebGL failed once — stop retrying (static CSS background is enough).
        if (window.__kiuLuxuryParticleBackgroundUnavailable) return;
        if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
            window.__kiuApplyLmsParticleTheme();
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground(activeBackgroundMode);
            return;
        }
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => refreshLmsParticleBackground(activeBackgroundMode));
        }
    }
    function syncLmsVisualShell() {
        ensureLmsRouteVisualState();
        if (typeof window.applyAtmosphereSettings === 'function') {
            window.applyAtmosphereSettings();
        } else if (typeof window.areBackgroundAnimationsEnabled === 'function') {
            document.body.dataset.luxBackgroundAnimation = window.areBackgroundAnimationsEnabled() ? 'on' : 'off';
        }
        if (typeof window.updateTransparency === 'function') {
            const savedTransparency = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
            if (!Number.isNaN(savedTransparency)) {
                window.updateTransparency(savedTransparency, { persist: false });
            }
        } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
            window.refreshLuxuryTransparencySurfaces(undefined, { persist: false });
        }
        refreshLmsParticleBackground();
    }
    let lmsVisualSyncFrame = 0;
    let lmsVisualSyncTimer = 0;
    let lmsLastVisualSyncAt = 0;
    function runScheduledLmsVisualShellSync() {
        lmsVisualSyncFrame = 0;
        lmsVisualSyncTimer = 0;
        if (!isLmsVisualContextActive()) return;
        lmsLastVisualSyncAt = Date.now();
        ensureLmsRouteVisualState();
        syncLmsVisualShell();
    }
    function scheduleLmsVisualShellSync() {
        if (!isLmsVisualContextActive()) return;
        ensureLmsRouteVisualState();
        if (lmsVisualSyncFrame || lmsVisualSyncTimer) return;
        const contentArea = document.getElementById('lms-content-area');
        const isQuizTabActive = contentArea?.dataset?.activeLmsTab === 'quiz';
        const baseDelay = isQuizTabActive ? 300 : 140;
        const elapsed = Date.now() - lmsLastVisualSyncAt;
        const delay = elapsed > baseDelay ? 0 : baseDelay - elapsed;
        if (delay > 0) {
            lmsVisualSyncTimer = window.setTimeout(() => {
                lmsVisualSyncTimer = 0;
                lmsVisualSyncFrame = requestAnimationFrame(runScheduledLmsVisualShellSync);
            }, delay);
            return;
        }
        lmsVisualSyncFrame = requestAnimationFrame(runScheduledLmsVisualShellSync);
    }
    window.scheduleLmsVisualShellSync = scheduleLmsVisualShellSync;
    function refreshStandaloneLmsShellContext(options = {}) {
        ensureLmsRouteVisualState();
        if (typeof window.renderNav === 'function') window.renderNav();
        if (typeof window.syncTopbar === 'function') window.syncTopbar();
        if (typeof window.populateFacultySwitcher === 'function') window.populateFacultySwitcher();
        if (typeof window.populateRoleSwitcher === 'function') window.populateRoleSwitcher();
        const refreshSubjectDeck = options.refreshSubjectDeck === true
            || (options.refreshSubjectDeck !== false && isLmsSubjectDeckVisible());
        if (refreshSubjectDeck) {
            renderLmsSubjectDeck({ force: options.forceSubjectDeck === true });
        }
        if (options.refreshActiveTab === true && isLmsCourseWorkspaceVisibleStandalone()) {
            const activeTab = document.querySelector('#page-lms-inner [data-lms-tab].is-active')?.dataset?.lmsTab || 'sessions';
            if (typeof window.switchLMSTab === 'function') {
                window.switchLMSTab(activeTab, { force: true });
            }
        }
        scheduleLmsVisualShellSync();
    }
    window.refreshStandaloneLmsShellContext = refreshStandaloneLmsShellContext;
    window.refreshStandaloneDesktopRouteShellContext = function refreshStandaloneDesktopRouteShellContext(options = {}) {
        refreshStandaloneLmsShellContext({
            refreshSubjectDeck: options.refreshSubjectDeck !== false,
            forceSubjectDeck: options.forceSubjectDeck === true,
            refreshActiveTab: options.refreshActiveRoute === true || options.refreshActiveTab === true
        });
    };
    window.refreshStandaloneDesktopShellChrome = function refreshStandaloneDesktopShellChrome() {
        refreshStandaloneLmsShellContext({ refreshSubjectDeck: false });
    };

    function revealLmsShellIfLoading() {
        if (typeof schedulePortalShellReadyReveal === 'function') {
            schedulePortalShellReadyReveal();
            return;
        }
        if (typeof markPortalShellReady === 'function') {
            markPortalShellReady();
        }
    }
    function initLmsPage() {
        ensureLmsRouteVisualState();
        if (typeof window.__kiuInitLuxuryParticleBackground === 'function') {
            window.__kiuInitLuxuryParticleBackground();
        }
        if (typeof bindStandaloneGradebookShell === 'function') {
            bindStandaloneGradebookShell();
        }
        bindLmsDelegatedActions();
        if (typeof bindLmsPersonalDashboardChromeButton === 'function') bindLmsPersonalDashboardChromeButton();
        preloadLmsQuizRuntimeIfNeeded();
        preloadLmsCallsRuntimeIfNeeded();
        const bootLmsContent = async () => {
            try {
                const restored = typeof window.restoreLmsReturnContextIfPresent === 'function'
                    && await window.restoreLmsReturnContextIfPresent();
                if (!restored) {
                    renderLmsSubjectDeck();
                }
                scheduleLmsVisualShellSync();
            } finally {
                revealLmsShellIfLoading();
            }
        };
        if (typeof scheduleRouteContentRender === 'function') {
            scheduleRouteContentRender(bootLmsContent);
            return;
        }
        void bootLmsContent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLmsPage);
    } else {
        initLmsPage();
    }
    window.addEventListener('pageshow', () => {
        if (document.body?.classList.contains('kiu-shell-loading')) {
            revealLmsShellIfLoading();
        }
        scheduleLmsVisualShellSync();
    });
    window.addEventListener('focus', scheduleLmsVisualShellSync);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleLmsVisualShellSync();
    });
})();
