/* Social workspace portfolio document hydrate/save/editor runtime.
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspacePortfolioRuntimeApi(deps).
 */
(function init() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_LOADED = true;

    function createKiuSocialWorkspacePortfolioRuntimeApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('createKiuSocialWorkspacePortfolioRuntimeApi deps required');
        const {
            canViewerAccessPortfolioEntry,
            clonePortfolioDocument,
            currentFacultyCode,
            currentUser,
            currentUserId,
            normalizePortfolioEntry,
            openDialog,
            patchPortfolioSaveStatus,
            portfolioEditorFormRoot,
            portfolioFieldValue,
            portfolioMakeId,
            renderSocialPageNow,
            serializePortfolioLinks,
            setPortalSocialFlash,
            state,
            text,
            withBusy
        } = deps;

        function portfolioEntriesForViewer() {
            const legacyEntries = (Array.isArray(state().social?.projects) ? state().social.projects : [])
                .map((entry) => normalizePortfolioEntry(entry))
                .filter((entry) => canViewerAccessPortfolioEntry(entry));
            const portfolioDocs = (Array.isArray(state().social?.portfolios) ? state().social.portfolios : [])
                .map((doc) => {
                    if (!doc || typeof doc !== 'object') return null;
                    const extras = Array.isArray(doc.extras) ? doc.extras : [];
                    const links = [
                        ...(Array.isArray(doc.basics?.links) ? doc.basics.links : []),
                        ...extras.filter((item) => text(item?.url)).map((item) => ({
                            label: text(item.title || item.url),
                            url: text(item.url)
                        }))
                    ];
                    return normalizePortfolioEntry({
                        id: `portfolio-doc:${text(doc.userId)}`,
                        title: text(doc.basics?.headline || doc.basics?.name || 'Campus portfolio'),
                        summary: text(doc.basics?.summary || ''),
                        description: text(doc.basics?.summary || ''),
                        ownerUserId: text(doc.userId),
                        ownerFacultyCode: text(doc.ownerFacultyCode || ''),
                        facultyCodes: [text(doc.ownerFacultyCode || '')].filter(Boolean),
                        status: text(doc.status || 'draft'),
                        visibilityMode: text(doc.visibilityMode || 'staff_only'),
                        mediaItems: doc.resume ? [doc.resume] : [],
                        externalLinks: links,
                        hashtags: extras.filter((item) => text(item.kind) === 'subject').map((item) => text(item.title)).filter(Boolean),
                        skillTags: extras.filter((item) => text(item.kind) === 'project').map((item) => text(item.title)).filter(Boolean),
                        createdAt: text(doc.createdAt || ''),
                        updatedAt: text(doc.updatedAt || doc.publishedAt || ''),
                        isPortfolioDocument: true,
                        extras,
                        resume: doc.resume || null
                    });
                })
                .filter((entry) => entry && canViewerAccessPortfolioEntry(entry));
            const byOwner = new Map();
            [...portfolioDocs, ...legacyEntries].forEach((entry) => {
                const key = text(entry.isPortfolioDocument ? `doc:${entry.ownerUserId}` : `legacy:${entry.id}`);
                if (!byOwner.has(key)) byOwner.set(key, entry);
            });
            return Array.from(byOwner.values());
        }

        function portfolioDraftExists() {
            const runtime = state();
            const portfolio = getMyPortfolioDocument();
            if (portfolio && text(portfolio.status) !== 'published') return true;
            return Boolean(
                text(runtime.ui?.projectName || '')
                || text(runtime.ui?.projectSummary || '')
                || text(runtime.ui?.projectDescription || '')
                || text(runtime.ui?.projectCourseTag || '')
                || text(runtime.ui?.projectSkillTags || '')
                || text(runtime.ui?.projectHashtags || '')
                || text(runtime.ui?.projectExternalLinks || '')
                || text(runtime.ui?.projectVisibleUserIds || '')
                || text(runtime.ui?.projectHiddenUserIds || '')
                || (Array.isArray(runtime.ui?.projectVisibleRoles) && runtime.ui.projectVisibleRoles.length)
                || (Array.isArray(runtime.ui?.projectVisibleFacultyCodes) && runtime.ui.projectVisibleFacultyCodes.length)
                || (Array.isArray(runtime.ui?.projectMediaItems) && runtime.ui.projectMediaItems.length)
                || runtime.ui?.projectMediaFile
            );
        }

        function getMyPortfolioDocument() {
            const userId = currentUserId();
            const runtime = state();
            if (runtime.ui?.myPortfolio && text(runtime.ui.myPortfolio.userId) === userId) {
                return runtime.ui.myPortfolio;
            }
            const fromState = (Array.isArray(runtime.social?.portfolios) ? runtime.social.portfolios : [])
                .find((item) => text(item?.userId) === userId);
            if (fromState) {
                runtime.ui.myPortfolio = clonePortfolioDocument(fromState);
                return runtime.ui.myPortfolio;
            }
            return null;
        }

        function ensureMyPortfolioDocument() {
            const existing = getMyPortfolioDocument();
            if (existing) return existing;
            const user = currentUser();
            const empty = {
                userId: currentUserId(),
                status: 'draft',
                visibilityMode: 'staff_only',
                basics: {
                    name: text(user?.displayName || user?.name),
                    email: text(user?.email),
                    headline: '',
                    summary: '',
                    links: []
                },
                resume: null,
                extras: [],
                sectionOrder: ['education', 'experience', 'projects', 'skills'],
                sections: {
                    education: { builtinKey: 'education', label: 'Education', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                    experience: { builtinKey: 'experience', label: 'Experience', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                    projects: { builtinKey: 'projects', label: 'Projects', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                    skills: { builtinKey: 'skills', label: 'Skills', repeatable: false, visible: true, fieldDefinitions: [], entries: [{ id: 'skills-default', order: 0, fields: { tags: { type: 'text', value: '' } } }] }
                }
            };
            state().ui.myPortfolio = empty;
            return empty;
        }

        let myPortfolioHydrateInFlight = null;
        let myPortfolioApiDenied = false;

        function clearPortfolioApiDeniedFlag() {
            myPortfolioApiDenied = false;
        }

        async function hydrateMyPortfolioDocument(force = false) {
            if (!force && getMyPortfolioDocument()) return getMyPortfolioDocument();
            if (typeof window.KiuPortfolioApi?.loadMyPortfolio !== 'function') {
                return ensureMyPortfolioDocument();
            }
            if (force) myPortfolioApiDenied = false;
            if (myPortfolioApiDenied) {
                return ensureMyPortfolioDocument();
            }
            if (myPortfolioHydrateInFlight) {
                return myPortfolioHydrateInFlight;
            }
            myPortfolioHydrateInFlight = (async () => {
                try {
                    const portfolio = await window.KiuPortfolioApi.loadMyPortfolio();
                    if (portfolio) {
                        state().ui.myPortfolio = clonePortfolioDocument(portfolio);
                        const existing = Array.isArray(state().social?.portfolios) ? state().social.portfolios : [];
                        const next = existing.filter((item) => text(item?.userId) !== text(portfolio.userId));
                        next.unshift(portfolio);
                        state().social.portfolios = next;
                        myPortfolioApiDenied = false;
                    } else {
                        ensureMyPortfolioDocument();
                    }
                } catch (error) {
                    const status = error?.status || error?.statusCode || error?.response?.status;
                    const message = String(error?.message || '').toLowerCase();
                    if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
                        myPortfolioApiDenied = true;
                    }
                    ensureMyPortfolioDocument();
                } finally {
                    myPortfolioHydrateInFlight = null;
                }
                return getMyPortfolioDocument();
            })();
            return myPortfolioHydrateInFlight;
        }

        function portfolioReadDateRange(prefix, formRoot) {
            const start = text(formRoot?.querySelector(`[name="${prefix}Start"]`)?.value || '');
            const end = text(formRoot?.querySelector(`[name="${prefix}End"]`)?.value || '');
            const current = Boolean(formRoot?.querySelector(`[name="${prefix}Current"]`)?.checked);
            return portfolioFieldValue('dateRange', { start, end, current });
        }

        function portfolioCollectDocumentFromUi() {
            const portfolio = clonePortfolioDocument(ensureMyPortfolioDocument());
            const root = portfolioEditorFormRoot();
            portfolio.basics = {
                ...portfolio.basics,
                name: text(root?.querySelector('[name="portfolioBasicsName"]')?.value || portfolio.basics?.name),
                headline: text(root?.querySelector('[name="portfolioBasicsHeadline"]')?.value || portfolio.basics?.headline),
                summary: text(root?.querySelector('[name="portfolioBasicsSummary"]')?.value || portfolio.basics?.summary),
                email: text(root?.querySelector('[name="portfolioBasicsEmail"]')?.value || portfolio.basics?.email),
                links: portfolioFieldValue('link', { url: text(root?.querySelector('[name="portfolioBasicsLink"]')?.value || ''), label: 'Profile' }).value.url
                    ? [portfolioFieldValue('link', { url: text(root?.querySelector('[name="portfolioBasicsLink"]')?.value || ''), label: 'Profile' }).value]
                    : []
            };

            const pendingResume = state().ui?.portfolioResumePending;
            if (pendingResume && typeof pendingResume === 'object') {
                portfolio.resume = pendingResume;
            } else if (portfolio.resume === undefined) {
                portfolio.resume = null;
            }

            const cards = root ? Array.from(root.querySelectorAll('.portfolio-extra-card[data-extra-index]')) : [];
            portfolio.extras = cards.map((card, index) => {
                const kind = text(card.querySelector('[name="portfolioExtraKind"]')?.value || 'note') || 'note';
                const title = text(card.querySelector('[name="portfolioExtraTitle"]')?.value || '');
                const detail = text(card.querySelector('[name="portfolioExtraDetail"]')?.value || '');
                const url = text(card.querySelector('[name="portfolioExtraUrl"]')?.value || '');
                if (!title && !detail && !url) return null;
                return {
                    id: text(portfolio.extras?.[index]?.id) || portfolioMakeId('extra'),
                    kind,
                    title: title || (kind === 'link' ? url : 'Highlight'),
                    detail,
                    url
                };
            }).filter(Boolean);

            state().ui.myPortfolio = portfolio;
            return portfolio;
        }

        async function readPortfolioResumeFile(file) {
            if (!file) return null;
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('Could not read resume file.'));
                reader.readAsDataURL(file);
            });
            if (!dataUrl) return null;
            return {
                id: portfolioMakeId('resume'),
                name: text(file.name || 'resume.pdf') || 'resume.pdf',
                type: text(file.type || 'application/pdf') || 'application/pdf',
                size: Number(file.size) || 0,
                dataUrl,
                storageKey: '',
                storageBackend: 'inline'
            };
        }

        async function saveMyPortfolioDocument({ flash = true } = {}) {
            const portfolio = portfolioCollectDocumentFromUi();
            if (typeof window.KiuPortfolioApi?.saveMyPortfolio !== 'function') return portfolio;
            state().ui.portfolioSaveStatus = 'Saving...';
            if (!patchPortfolioSaveStatus('Saving...')) renderSocialPageNow('portfolio-save');
            try {
                const saved = await window.KiuPortfolioApi.saveMyPortfolio(portfolio);
                if (saved) {
                    state().ui.myPortfolio = clonePortfolioDocument(saved);
                    state().ui.portfolioResumePending = null;
                    const existing = Array.isArray(state().social?.portfolios) ? state().social.portfolios : [];
                    state().social.portfolios = [saved, ...existing.filter((item) => text(item?.userId) !== text(saved.userId))];
                }
                state().ui.portfolioSaveStatus = 'Saved';
                if (!patchPortfolioSaveStatus('Saved')) renderSocialPageNow('portfolio-save');
                if (flash && typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Portfolio saved.', 'success');
                if (typeof hydrateRuntime === 'function') await hydrateRuntime(true);
            } catch (error) {
                state().ui.portfolioSaveStatus = 'Save failed';
                if (!patchPortfolioSaveStatus('Save failed')) renderSocialPageNow('portfolio-save');
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Portfolio could not be saved.', 'danger');
            }
            return getMyPortfolioDocument();
        }

        function openPortfolioEditor(entry = null) {
            const runtime = state();
            const normalized = entry ? normalizePortfolioEntry(entry) : null;
            runtime.ui.projectEditId = text(normalized?.id || '');
            runtime.ui.projectName = text(normalized?.title || '');
            runtime.ui.projectSummary = text(normalized?.summary || '');
            runtime.ui.projectDescription = text(normalized?.description || '');
            runtime.ui.projectStatus = text(normalized?.status || 'draft') || 'draft';
            runtime.ui.projectVisibility = text(normalized?.visibilityMode || 'all_logged_in') || 'all_logged_in';
            runtime.ui.projectCourseTag = text(normalized?.courseTag || '');
            runtime.ui.projectFacultyCodes = Array.isArray(normalized?.facultyCodes) && normalized.facultyCodes.length ? [...normalized.facultyCodes] : [currentFacultyCode()];
            runtime.ui.projectSkillTags = (normalized?.skillTags || []).join(', ');
            runtime.ui.projectHashtags = (normalized?.hashtags || []).join(', ');
            runtime.ui.projectExternalLinks = serializePortfolioLinks(normalized?.externalLinks || []);
            runtime.ui.projectVisibleRoles = Array.isArray(normalized?.visibleRoles) ? [...normalized.visibleRoles] : [];
            runtime.ui.projectVisibleFacultyCodes = Array.isArray(normalized?.visibleFacultyCodes) ? [...normalized.visibleFacultyCodes] : [];
            runtime.ui.projectVisibleUserIds = (normalized?.visibleUserIds || []).join(', ');
            runtime.ui.projectHiddenUserIds = (normalized?.hiddenUserIds || []).join(', ');
            runtime.ui.projectMediaItems = Array.isArray(normalized?.mediaItems) ? [...normalized.mediaItems] : [];
            runtime.ui.projectMediaFile = null;
        }

        function resetPortfolioEditor() {
            const runtime = state();
            runtime.ui.projectEditId = '';
            runtime.ui.projectName = '';
            runtime.ui.projectSummary = '';
            runtime.ui.projectDescription = '';
            runtime.ui.projectStatus = 'draft';
            runtime.ui.projectVisibility = 'all_logged_in';
            runtime.ui.projectCourseTag = '';
            runtime.ui.projectFacultyCodes = [((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || currentFacultyCode())];
            runtime.ui.projectSkillTags = '';
            runtime.ui.projectHashtags = '';
            runtime.ui.projectExternalLinks = '';
            runtime.ui.projectVisibleRoles = [];
            runtime.ui.projectVisibleFacultyCodes = [];
            runtime.ui.projectVisibleUserIds = '';
            runtime.ui.projectHiddenUserIds = '';
            runtime.ui.projectMediaItems = [];
            runtime.ui.projectMediaFile = null;
        }

        function openPortfolioViewerForUser(userId) {
            const normalizedUserId = text(userId);
            if (!normalizedUserId) return false;
            return withBusy(async () => {
                const ui = state().ui;
                ui.viewingPortfolioUserId = normalizedUserId;
                ui.viewingPortfolio = null;
                ui.viewingPortfolioError = '';
                openDialog('portfolio-viewer', { userId: normalizedUserId });
                renderSocialPageNow('portfolio-viewer-open');
                try {
                    const api = window.KiuPortfolioApi;
                    if (!api || typeof api.loadPortfolio !== 'function') {
                        throw new Error('Portfolio viewer is loading.');
                    }
                    const portfolio = await api.loadPortfolio(normalizedUserId);
                    if (!portfolio?.canView) throw new Error('Portfolio not found.');
                    ui.viewingPortfolio = portfolio;
                } catch (error) {
                    ui.viewingPortfolioError = text(error?.message || 'Portfolio could not be loaded.');
                }
                renderSocialPageNow('portfolio-viewer-loaded');
            });
        }

        const PORTFOLIO_DISCOVER_ROLE_TARGETS = [
            ['all', 'All audiences'],
            ['all_logged_in', 'All logged-in'],
            ['students_only', 'Students'],
            ['tas_only', 'TAs'],
            ['professors_only', 'Professors'],
            ['staff_only', 'Staff'],
            ['custom', 'Custom'],
        ];

        return {
            portfolioEntriesForViewer,
            portfolioDraftExists,
            getMyPortfolioDocument,
            ensureMyPortfolioDocument,
            clearPortfolioApiDeniedFlag,
            hydrateMyPortfolioDocument,
            portfolioReadDateRange,
            portfolioCollectDocumentFromUi,
            saveMyPortfolioDocument,
            openPortfolioEditor,
            openPortfolioViewerForUser,
            resetPortfolioEditor,
            readPortfolioResumeFile,
            PORTFOLIO_DISCOVER_ROLE_TARGETS
        };
    }

    window.createKiuSocialWorkspacePortfolioRuntimeApi = createKiuSocialWorkspacePortfolioRuntimeApi;
})();
