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
            patchPortfolioSaveStatus,
            portfolioEditorFormRoot,
            portfolioFieldValue,
            portfolioMakeId,
            renderSocialPageNow,
            serializePortfolioLinks,
            setPortalSocialFlash,
            state,
            text
        } = deps;

        function portfolioEntriesForViewer() {
            const legacyEntries = (Array.isArray(state().social?.projects) ? state().social.projects : [])
                .map((entry) => normalizePortfolioEntry(entry))
                .filter((entry) => canViewerAccessPortfolioEntry(entry));
            // Discover list is legacy projects only (orphan portfolio helper tree removed E6).
            return legacyEntries;
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

            const collectBuiltin = (sectionKey, mapper) => {
                const section = portfolio.sections?.[sectionKey];
                if (!section) return;
                const cards = root ? Array.from(root.querySelectorAll(`.portfolio-entry-card[data-section-key="${sectionKey}"]`)) : [];
                section.entries = cards.map((card, index) => mapper(card, index)).filter(Boolean);
            };

            collectBuiltin('education', (card, index) => ({
                id: portfolioMakeId('entry'),
                order: index,
                fields: {
                    school: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationSchool"]')?.value),
                    degree: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationDegree"]')?.value),
                    dates: portfolioReadDateRange('portfolioEducationDates', card),
                    note: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationNote"]')?.value)
                }
            }));

            collectBuiltin('experience', (card, index) => ({
                id: portfolioMakeId('entry'),
                order: index,
                fields: {
                    role: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceRole"]')?.value),
                    organization: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceOrganization"]')?.value),
                    dates: portfolioReadDateRange('portfolioExperienceDates', card),
                    description: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceDescription"]')?.value)
                }
            }));

            collectBuiltin('projects', (card, index) => ({
                id: portfolioMakeId('entry'),
                order: index,
                fields: {
                    title: portfolioFieldValue('text', card.querySelector('[name="portfolioProjectTitle"]')?.value),
                    description: portfolioFieldValue('text', card.querySelector('[name="portfolioProjectDescription"]')?.value),
                    link: portfolioFieldValue('link', { url: card.querySelector('[name="portfolioProjectLink"]')?.value || '' }),
                    file: portfolio.sections?.projects?.entries?.[index]?.fields?.file || portfolioFieldValue('file', null)
                }
            }));

            collectBuiltin('skills', (card, index) => ({
                id: 'skills-default',
                order: index,
                fields: {
                    tags: portfolioFieldValue('text', card.querySelector('[name="portfolioSkillsTags"]')?.value)
                }
            }));

            Object.keys(portfolio.sections || {}).filter((key) => key.startsWith('custom_')).forEach((sectionKey) => {
                const section = portfolio.sections[sectionKey];
                const cards = root ? Array.from(root.querySelectorAll(`.portfolio-entry-card[data-section-key="${sectionKey}"]`)) : [];
                section.entries = cards.map((card, index) => {
                    const fields = {};
                    (section.fieldDefinitions || []).forEach((def) => {
                        if (def.type === 'dateRange') {
                            fields[def.key] = portfolioReadDateRange(`portfolioCustom_${sectionKey}_${def.key}`, card);
                            return;
                        }
                        const input = card.querySelector(`[data-field-key="${def.key}"]`);
                        if (def.type === 'link') {
                            fields[def.key] = portfolioFieldValue('link', { url: input?.value || '' });
                            return;
                        }
                        if (def.type === 'file') {
                            fields[def.key] = section.entries?.[index]?.fields?.[def.key] || portfolioFieldValue('file', null);
                            return;
                        }
                        fields[def.key] = portfolioFieldValue('text', input?.value || '');
                    });
                    return { id: portfolioMakeId('entry'), order: index, fields };
                });
            });

            state().ui.myPortfolio = portfolio;
            return portfolio;
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
            runtime.ui.projectFacultyCodes = [currentFacultyCode()];
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
            resetPortfolioEditor,
            PORTFOLIO_DISCOVER_ROLE_TARGETS
        };
    }

    window.createKiuSocialWorkspacePortfolioRuntimeApi = createKiuSocialWorkspacePortfolioRuntimeApi;
})();
