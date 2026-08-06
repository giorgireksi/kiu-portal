(function initStudentServiceTicketsModule() {
    if (window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED) return;
    window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED = true;
    const __kiuSsApi = window.KiuStudentService || (window.KiuStudentService = {});
    window.__kiuSsApi = __kiuSsApi;

    function buildStudentServiceDefaultDraftTicket() {
        return {
            serviceArea: 'general',
            category: getStudentServiceDefaultCategoryForArea('general'),
            title: '',
            message: '',
            subjectValue: '',
            relatedContextLabel: ''
        };
    }

    function normalizeStudentServiceThreadEntry(entry = {}, fallback = {}) {
        return {
            id: String(entry.id || fallback.id || `svc-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
            authorId: String(entry.authorId || fallback.authorId || ''),
            authorName: entry.authorName || fallback.authorName || 'Portal User',
            authorRole: entry.authorRole || fallback.authorRole || 'system',
            message: entry.message || fallback.message || '',
            attachments: normalizeStudentServiceAttachments(entry.attachments || fallback.attachments),
            createdAt: entry.createdAt || fallback.createdAt || ssNowIso(),
            type: entry.type || fallback.type || 'reply'
        };
    }

    function normalizeStudentServiceInternalNote(note = {}, index = 0) {
        return {
            id: String(note.id || `svc-note-${Date.now()}-${index}`),
            authorId: String(note.authorId || ''),
            authorName: String(note.authorName || 'Staff'),
            authorRole: note.authorRole || USER_ROLES.STUDENT_SERVICE,
            message: String(note.message || '').trim(),
            attachments: normalizeStudentServiceAttachments(note.attachments),
            createdAt: note.createdAt || ssNowIso()
        };
    }

    function normalizeStudentServiceHandoff(handoff = {}) {
        const target = STUDENT_SERVICE_HANDOFF_TARGETS.includes(handoff.target) ? handoff.target : '';
        const status = STUDENT_SERVICE_HANDOFF_STATUSES.includes(handoff.status) ? handoff.status : (target ? 'Requested' : 'Not Needed');
        return {
            target,
            status,
            summary: String(handoff.summary || '').trim(),
            requestedAt: handoff.requestedAt || '',
            updatedAt: handoff.updatedAt || '',
            requestedById: String(handoff.requestedById || ''),
            requestedByName: String(handoff.requestedByName || '')
        };
    }

    function normalizeStudentServiceTicket(ticket = {}, index = 0) {
        const createdAt = ticket.createdAt || ticket.date || ssNowIso();
        const updatedAt = ticket.updatedAt || createdAt;
        const initialMessage = ticket.message || ticket.description || '';
        const inputThread = Array.isArray(ticket.thread) ? ticket.thread : Array.isArray(ticket.messages) ? ticket.messages : [];
        const thread = inputThread.length
            ? inputThread.map((entry, entryIndex) => normalizeStudentServiceThreadEntry(entry, {
                id: `svc-thread-${index}-${entryIndex}`,
                authorId: String(ticket.studentId || ''),
                authorName: ticket.studentName || 'Student',
                authorRole: USER_ROLES.STUDENT,
                createdAt
            }))
            : [normalizeStudentServiceThreadEntry({
                id: `svc-thread-${index}-0`,
                authorId: String(ticket.studentId || ''),
                authorName: ticket.studentName || 'Student',
                authorRole: USER_ROLES.STUDENT,
                message: initialMessage,
                createdAt,
                type: 'request'
            })];
        const latestEntry = thread[thread.length - 1] || null;
        const category = STUDENT_SERVICE_CATEGORIES.includes(ticket.category) ? ticket.category : 'General Question';
        const serviceArea = getStudentServiceSupportArea(ticket.serviceArea || getStudentServiceSupportAreaForCategory(category).id).id;
        const internalNotes = Array.isArray(ticket.internalNotes)
            ? ticket.internalNotes.map(normalizeStudentServiceInternalNote).filter(note => note.message || note.attachments?.length)
            : [];
        const intakeContext = ticket.intakeContext && typeof ticket.intakeContext === 'object'
            ? {
                sourcePage: String(ticket.intakeContext.sourcePage || ''),
                sourceLabel: String(ticket.intakeContext.sourceLabel || ''),
                roleAtSubmission: String(ticket.intakeContext.roleAtSubmission || ''),
                facultyAtSubmission: String(ticket.intakeContext.facultyAtSubmission || ''),
                studentBalance: Number(ticket.intakeContext.studentBalance || 0),
                probationActive: Boolean(ticket.intakeContext.probationActive),
                registeredSubjects: Math.max(0, Number(ticket.intakeContext.registeredSubjects || 0)),
                savedRegistrations: Math.max(0, Number(ticket.intakeContext.savedRegistrations || 0))
            }
            : {
                sourcePage: '',
                sourceLabel: '',
                roleAtSubmission: '',
                facultyAtSubmission: '',
                studentBalance: 0,
                probationActive: false,
                registeredSubjects: 0,
                savedRegistrations: 0
            };
        return {
            id: String(ticket.id || `SVC-${String(index + 1).padStart(4, '0')}`),
            studentId: String(ticket.studentId || ''),
            studentName: ticket.studentName || 'Student',
            semester: resolveStudentServiceStudentSemester(ticket.studentId, ticket.semester),
            category,
            serviceArea,
            title: ticket.title || ticket.subject || 'Support Request',
            message: initialMessage,
            status: STUDENT_SERVICE_STATUSES.includes(ticket.status) ? ticket.status : 'Open',
            createdAt,
            updatedAt,
            assignedToRole: ticket.assignedToRole || '',
            assignedToId: String(ticket.assignedToId || ''),
            assignedToName: ticket.assignedToName || '',
            relatedSubjectId: String(ticket.relatedSubjectId || ''),
            relatedSubjectName: ticket.relatedSubjectName || '',
            relatedContextLabel: String(ticket.relatedContextLabel || ''),
            faculty: ticket.faculty || '',
            intakeContext,
            internalNotes,
            handoff: normalizeStudentServiceHandoff(ticket.handoff),
            thread,
            latestPreview: String(ticket.latestPreview || '').trim()
                || String(latestEntry?.message || '').trim()
                || (latestEntry?.attachments?.length ? 'Attachment' : initialMessage)
        };
    }

    function getStudentServiceDraftTicket() {
        return ensureStudentServiceUiState().draftTicket;
    }

    function syncStudentServiceDraftTicketFromDom() {
        const draft = getStudentServiceDraftTicket();
        const serviceArea = document.getElementById('student-service-ticket-service-area')?.value || draft.serviceArea;
        const category = document.getElementById('student-service-ticket-category')?.value || draft.category;
        draft.serviceArea = getStudentServiceSupportArea(serviceArea).id;
        draft.category = STUDENT_SERVICE_CATEGORIES.includes(category)
            ? category
            : getStudentServiceDefaultCategoryForArea(draft.serviceArea);
        draft.title = document.getElementById('student-service-ticket-title')?.value ?? draft.title;
        draft.message = document.getElementById('student-service-ticket-message')?.value ?? draft.message;
        draft.subjectValue = document.getElementById('student-service-ticket-subject')?.value ?? draft.subjectValue;
        draft.relatedContextLabel = document.getElementById('student-service-ticket-context')?.value ?? draft.relatedContextLabel;
        return draft;
    }

    function setStudentServiceDraftTicketField(field, value, rerender = false) {
        const draft = getStudentServiceDraftTicket();
        draft[field] = String(value ?? '');
        if (field === 'serviceArea') {
            draft.serviceArea = getStudentServiceSupportArea(value).id;
            draft.category = getStudentServiceDefaultCategoryForArea(draft.serviceArea);
            ensureStudentServiceUiState().activeSupportArea = draft.serviceArea;
        }
        if (field === 'category' && !STUDENT_SERVICE_CATEGORIES.includes(draft.category)) {
            draft.category = getStudentServiceDefaultCategoryForArea(draft.serviceArea);
        }
        if (rerender) renderStudentServicePage();
    }

    function getStudentServiceTicketSourceLabel(pageId) {
        return getStudentServicePageLabel(pageId || 'student-service');
    }

    function getStudentServiceVisibleTickets() {
        const role = getEffectiveUserRole();
        const currentUser = getStudentServiceCurrentUser();
        const { tickets } = ensureStudentServiceStores();
        if (role === USER_ROLES.STUDENT) {
            return tickets
                .filter(ticket => String(ticket.studentId) === String(currentUser?.id || ''))
                .sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
        }
        if (role === USER_ROLES.ADMIN || role === USER_ROLES.STUDENT_SERVICE) return tickets.slice();
        return [];
    }

    function sortStudentServiceTicketsForStaff(tickets = []) {
        return tickets.slice().sort((a, b) => {
            const orderDiff = (STUDENT_SERVICE_STATUS_ORDER[a.status] ?? 999) - (STUDENT_SERVICE_STATUS_ORDER[b.status] ?? 999);
            if (orderDiff !== 0) return orderDiff;
            return ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt);
        });
    }

    function ensureSelectedStudentServiceTicket(tickets) {
        const ui = ensureStudentServiceUiState();
        if (!tickets.length) {
            ui.selectedTicketId = '';
            return null;
        }
        if (!ui.selectedTicketId || !tickets.some(ticket => ticket.id === ui.selectedTicketId)) {
            ui.selectedTicketId = '';
            return null;
        }
        return tickets.find(ticket => ticket.id === ui.selectedTicketId) || null;
    }

    function findStudentServiceArticleForTicket(ticket, articles) {
        if (!ticket) return null;
        const categoryKey = ssCategoryArticleKey(ticket.category);
        return articles.find(article => article.serviceArea === ticket.serviceArea)
            || articles.find(article => ssCategoryArticleKey(article.category) === categoryKey)
            || articles.find(article => article.published && ssCategoryArticleKey(article.category) === categoryKey)
            || null;
    }

    function getStudentServiceContextForTicket(ticket, articles) {
        if (!ticket) return null;
        return {
            text: STUDENT_SERVICE_CONTEXT_COPY[ticket.category] || STUDENT_SERVICE_CONTEXT_COPY['General Question'],
            article: findStudentServiceArticleForTicket(ticket, articles)
        };
    }

    function getStudentServiceTicketById(ticketId) {
        const normalizedId = String(ticketId || '').trim();
        if (!normalizedId) return null;
        return ensureStudentServiceStores().tickets.find(ticket => String(ticket.id) === normalizedId) || null;
    }

    function getStudentServiceTicketThreadMode() {
        const role = getEffectiveUserRole();
        if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return 'staff';
        return 'student';
    }

    function isStudentServiceTicketThreadModalOpen() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;
        return Boolean(modalRoot.querySelector('[data-student-service-ticket-thread-modal="true"]'));
    }

    function scrollStudentServiceTicketChatLog(scope = null) {
        const roots = [];
        const pushRoot = (node) => {
            if (node && !roots.includes(node)) roots.push(node);
        };
        if (scope?.matches?.('[data-student-service-ticket-chat-log="1"]')) {
            pushRoot(scope);
        }
        if (scope?.querySelectorAll) {
            scope.querySelectorAll('[data-student-service-ticket-chat-log="1"]').forEach(pushRoot);
        }
        const conversationScope = scope?.closest?.('[data-student-service-ticket-conversation="1"]');
        conversationScope?.querySelectorAll?.('[data-student-service-ticket-chat-log="1"]').forEach(pushRoot);
        if (!roots.length) {
            document.querySelectorAll('[data-student-service-ticket-chat-log="1"]').forEach(pushRoot);
        }
        if (!roots.length) return;
        window.requestAnimationFrame(() => {
            roots.forEach((root) => {
                root.scrollTop = root.scrollHeight;
            });
        });
    }

    function renderStudentServiceTicketThreadModalShell(ticket, options = {}) {
        const mode = options.mode === 'staff' ? 'staff' : 'student';
        const shellRenderer = typeof window.renderStudentServiceTicketConversationShell === 'function'
            ? window.renderStudentServiceTicketConversationShell
            : null;
        const conversationMarkup = shellRenderer
            ? shellRenderer(ticket, {
                mode,
                layout: 'modal',
                notesOpen: true,
                currentUser: getStudentServiceCurrentUser()
            })
            : '';
        return `
            <div class="student-service-ticket-thread-modal-backdrop" data-student-service-dismiss-ticket-thread-modal="true">
                <div class="student-service-ticket-thread-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-ticket-thread-modal-title" data-student-service-ticket-thread-modal="true">
                    <div class="student-service-ticket-thread-modal-accent" aria-hidden="true"></div>
                    <div class="student-service-ticket-thread-modal-body" data-student-service-ticket-thread-modal-body="1">
                        <span id="student-service-ticket-thread-modal-title" class="student-service-sr-only">${ssEscape(ticket.title || 'Ticket conversation')}</span>
                        ${conversationMarkup}
                    </div>
                </div>
            </div>
        `;
    }

    function closeStudentServiceTicketThreadModal() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || !isStudentServiceTicketThreadModalOpen()) return;
        const ui = ensureStudentServiceUiState();
        ui.ticketThreadModalOpen = false;
        modalRoot.innerHTML = '';
        modalRoot.setAttribute('hidden', '');
        if (studentServiceShouldRestoreBodyScroll()) {
            document.body.style.overflow = '';
        }
    }

    function mountStudentServiceTicketThreadModal(ticketId) {
        const normalizedId = String(ticketId || '').trim();
        const ticket = getStudentServiceTicketById(normalizedId);
        if (!ticket) return false;
        closeStudentServiceQuestionThreadModal();
        closeStudentServiceQuestionComposerModal();
        closeStudentServiceDeleteConfirm({ restoreThread: false });
        closeStudentServiceInlineReply();
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return false;
        const ui = ensureStudentServiceUiState();
        ui.selectedTicketId = normalizedId;
        ui.ticketThreadModalOpen = true;
        modalRoot.innerHTML = renderStudentServiceTicketThreadModalShell(ticket, {
            mode: getStudentServiceTicketThreadMode()
        });
        modalRoot.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        scrollStudentServiceTicketChatLog(modalRoot);
        modalRoot.querySelector('[data-student-service-cancel-ticket-thread-modal="true"]')?.focus?.({ preventScroll: true });
        return true;
    }

    function remountStudentServiceTicketThreadModal() {
        const ui = ensureStudentServiceUiState();
        const ticketId = String(ui.selectedTicketId || '').trim();
        if (!ticketId || !isStudentServiceTicketThreadModalOpen()) return;
        mountStudentServiceTicketThreadModal(ticketId);
    }

    function getStudentServiceTicketReplyTextareaId(role = '') {
        const resolvedRole = role || getEffectiveUserRole();
        const inModal = isStudentServiceTicketThreadModalOpen();
        const suffix = inModal ? '-modal' : '';
        return resolvedRole === USER_ROLES.STUDENT
            ? `student-service-student-reply${suffix}`
            : `student-service-staff-reply${suffix}`;
    }

    function getStudentServiceInternalNoteTextareaId() {
        return isStudentServiceTicketThreadModalOpen()
            ? 'student-service-internal-note-modal'
            : 'student-service-internal-note';
    }

    function getStudentServiceInternalNoteComposerId() {
        return isStudentServiceTicketThreadModalOpen() ? 'internal-note-modal' : 'internal-note';
    }

    function openStudentServiceTicket(ticketId) {
        const ui = ensureStudentServiceUiState();
        const nextTicketId = ticketId || '';
        const nextStudentTab = getEffectiveUserRole() === USER_ROLES.STUDENT ? 'my_tickets' : ui.studentTab;
        if (ui.serviceLane === 'service' && ui.selectedTicketId === nextTicketId && ui.studentTab === nextStudentTab) {
            return;
        }
        ui.serviceLane = 'service';
        ui.selectedTicketId = nextTicketId;
        if (getEffectiveUserRole() === USER_ROLES.STUDENT) ui.studentTab = 'my_tickets';
        renderStudentServicePage();
    }

    function openStudentServiceArticleFromTicket(articleId) {
        const ui = ensureStudentServiceUiState();
        const nextArticleId = articleId || '';
        if (
            ui.serviceLane === 'service'
            && ui.selectedArticleId === nextArticleId
            && ui.articleEditorId === nextArticleId
            && ui.staffPanel === 'articles'
        ) {
            return;
        }
        ui.serviceLane = 'service';
        ui.selectedArticleId = nextArticleId;
        ui.articleEditorId = nextArticleId;
        ui.staffPanel = 'articles';
        renderStudentServicePage();
    }

    function scheduleStudentServiceTicketFilterRender() {
        window.clearTimeout(studentServiceTicketFilterRenderTimer);
        studentServiceTicketFilterRenderTimer = window.setTimeout(() => {
            studentServiceTicketFilterRenderTimer = null;
            renderStudentServicePage();
        }, 200);
    }

    function setStudentServiceTicketFilter(field, value, options = {}) {
        const ui = ensureStudentServiceUiState();
        const nextValue = String(value ?? '');
        const rerender = () => {
            if (options.debounce) scheduleStudentServiceTicketFilterRender();
            else {
                window.clearTimeout(studentServiceTicketFilterRenderTimer);
                renderStudentServicePage();
            }
        };
        if (String(field || '').startsWith('custom_')) {
            if (ui.serviceLane === 'service' && ui.customTicketFilters?.[field] === nextValue) return;
            ui.serviceLane = 'service';
            ui.customTicketFilters = {
                ...(ui.customTicketFilters || {}),
                [field]: nextValue
            };
            rerender();
            return;
        }
        if (ui.serviceLane === 'service' && ui[field] === nextValue) return;
        ui.serviceLane = 'service';
        ui[field] = nextValue;
        rerender();
    }

    async function submitStudentServiceTicket() {
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser || getEffectiveUserRole() !== USER_ROLES.STUDENT) return;
        const draft = syncStudentServiceDraftTicketFromDom();
        const category = draft.category || '';
        const serviceArea = getStudentServiceSupportArea(draft.serviceArea).id;
        const area = getStudentServiceSupportArea(serviceArea);
        const title = String(draft.title || '').trim() || area.label;
        const message = String(draft.message || '').trim();
        const subjectValue = draft.subjectValue || '';
        const relatedContextLabel = String(draft.relatedContextLabel || '').trim();
        const ui = ensureStudentServiceUiState();
        const attachments = await persistStudentServiceDraftAttachments('ticket-create');
        if (!category || (!message && !attachments.length)) {
            alert('Please choose a help topic and write your message or attach at least one file before sending.');
            return;
        }
        const subjectOptions = getStudentServiceSubjectOptions();
        const subjectMeta = subjectOptions.find(item => `${item.subjectId}::${item.groupId}` === subjectValue) || null;
        const inboxIntake = buildStudentServiceTicketIntakeFromInboxFilters(ui);
        try {
            const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.ticketsCreate(), {
                title,
                message,
                attachments,
                category: inboxIntake.category || category,
                serviceArea: inboxIntake.serviceArea || serviceArea,
                semester: currentUser.semester || '',
                relatedSubjectId: subjectMeta?.subjectId || '',
                relatedSubjectName: subjectMeta?.subjectName || '',
                relatedContextLabel,
                facultyCode: inboxIntake.facultyCode || subjectMeta?.faculty || currentUser.facultyCode || currentUser.faculty || '',
                status: inboxIntake.status,
                intakeContext: buildStudentServiceIntakeContext(currentUser.id)
            });
            const ticket = payload?.ticket || null;
            ui.serviceLane = 'service';
            ui.selectedTicketId = ticket?.id || '';
            ui.studentTab = 'my_tickets';
            ui.ticketSearch = '';
            closeStudentServiceQuestionComposerModal();
            ui.draftTicket = buildStudentServiceDefaultDraftTicket();
            clearStudentServiceDraftAttachments('ticket-create');
            ui.activeSupportArea = serviceArea;
            await refreshStudentServiceDataAndRender();
            alert('Your Student Service ticket has been submitted.');
        } catch (error) {
            console.error('Student Service ticket submission failed.', error);
            alert(error?.message || 'Student Service ticket could not be submitted.');
        }
    }

    async function replyStudentServiceTicket() {
        const currentUser = getStudentServiceCurrentUser();
        const role = getEffectiveUserRole();
        if (!currentUser || ![USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
        const ui = ensureStudentServiceUiState();
        const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
        const textareaId = getStudentServiceTicketReplyTextareaId(role);
        const message = document.getElementById(textareaId)?.value.trim() || '';
        const attachments = await persistStudentServiceDraftAttachments('ticket-reply');
        if (!ticket || (!message && !attachments.length)) {
            alert('Write a message or attach at least one file before sending.');
            return;
        }
        try {
            await postStudentService(STUDENT_SERVICE_API_PATHS.ticketReplies(ticket.id), { message, attachments });
            if (document.getElementById(textareaId)) document.getElementById(textareaId).value = '';
            clearStudentServiceDraftAttachments('ticket-reply');
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service ticket reply failed.', error);
            alert(error?.message || 'Reply could not be sent.');
        }
    }

    async function updateStudentServiceTicketStatus(status) {
        const role = getEffectiveUserRole();
        if (![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
        const ui = ensureStudentServiceUiState();
        const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
        if (!ticket || !STUDENT_SERVICE_STATUSES.includes(status)) return;
        try {
            await postStudentService(STUDENT_SERVICE_API_PATHS.ticketStatus(ticket.id), { status });
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service ticket status update failed.', error);
            alert(error?.message || 'Ticket status could not be updated.');
        }
    }

    async function assignStudentServiceTicketToCurrentUser() {
        const role = getEffectiveUserRole();
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
        const ui = ensureStudentServiceUiState();
        const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
        if (!ticket) return;
        try {
            await postStudentService(STUDENT_SERVICE_API_PATHS.ticketAssign(ticket.id), {});
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service assignment failed.', error);
            alert(error?.message || 'Ticket could not be assigned.');
        }
    }

    async function addStudentServiceInternalNote() {
        const role = getEffectiveUserRole();
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
        const ui = ensureStudentServiceUiState();
        const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
        const textarea = document.getElementById(getStudentServiceInternalNoteTextareaId());
        const message = String(textarea?.value || '').trim();
        const attachments = await persistStudentServiceDraftAttachments(getStudentServiceInternalNoteComposerId());
        if (!ticket || (!message && !attachments.length)) {
            alert('Write an internal note or attach at least one file before saving it.');
            return;
        }
        try {
            await postStudentService(STUDENT_SERVICE_API_PATHS.ticketInternalNotes(ticket.id), { message, attachments });
            if (textarea) textarea.value = '';
            clearStudentServiceDraftAttachments(getStudentServiceInternalNoteComposerId());
            if (typeof recordPortalAudit === 'function') {
                recordPortalAudit('student-service', 'internal-note-added', 'ticket', ticket.id, {
                    afterState: {
                        authorId: currentUser.id,
                        noteLength: message.length
                    }
                });
            }
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service internal note failed.', error);
            alert(error?.message || 'Internal note could not be saved.');
        }
    }

    async function updateStudentServiceHandoff() {
        const role = getEffectiveUserRole();
        const currentUser = getStudentServiceCurrentUser();
        if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
        const ui = ensureStudentServiceUiState();
        const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
        if (!ticket) return;
        const target = document.getElementById('student-service-handoff-target')?.value || '';
        const status = document.getElementById('student-service-handoff-status')?.value || 'Not Needed';
        const summary = String(document.getElementById('student-service-handoff-summary')?.value || '').trim();
        try {
            await postStudentService(STUDENT_SERVICE_API_PATHS.ticketHandoff(ticket.id), { target, status, summary });
            if (typeof recordPortalAudit === 'function') {
                recordPortalAudit('student-service', 'handoff-updated', 'ticket', ticket.id, {
                    afterState: {
                        target,
                        status,
                        summary
                    }
                });
            }
            await refreshStudentServiceDataAndRender();
        } catch (error) {
            console.error('Student Service handoff update failed.', error);
            alert(error?.message || 'Handoff could not be updated.');
        }
    }

    __kiuSsApi.buildStudentServiceDefaultDraftTicket = buildStudentServiceDefaultDraftTicket;
    __kiuSsApi.normalizeStudentServiceThreadEntry = normalizeStudentServiceThreadEntry;
    __kiuSsApi.normalizeStudentServiceInternalNote = normalizeStudentServiceInternalNote;
    __kiuSsApi.normalizeStudentServiceHandoff = normalizeStudentServiceHandoff;
    __kiuSsApi.normalizeStudentServiceTicket = normalizeStudentServiceTicket;
    __kiuSsApi.getStudentServiceDraftTicket = getStudentServiceDraftTicket;
    __kiuSsApi.syncStudentServiceDraftTicketFromDom = syncStudentServiceDraftTicketFromDom;
    __kiuSsApi.setStudentServiceDraftTicketField = setStudentServiceDraftTicketField;
    __kiuSsApi.getStudentServiceTicketSourceLabel = getStudentServiceTicketSourceLabel;
    __kiuSsApi.getStudentServiceVisibleTickets = getStudentServiceVisibleTickets;
    __kiuSsApi.sortStudentServiceTicketsForStaff = sortStudentServiceTicketsForStaff;
    __kiuSsApi.ensureSelectedStudentServiceTicket = ensureSelectedStudentServiceTicket;
    __kiuSsApi.findStudentServiceArticleForTicket = findStudentServiceArticleForTicket;
    __kiuSsApi.getStudentServiceContextForTicket = getStudentServiceContextForTicket;
    __kiuSsApi.getStudentServiceTicketById = getStudentServiceTicketById;
    __kiuSsApi.getStudentServiceTicketThreadMode = getStudentServiceTicketThreadMode;
    __kiuSsApi.isStudentServiceTicketThreadModalOpen = isStudentServiceTicketThreadModalOpen;
    __kiuSsApi.scrollStudentServiceTicketChatLog = scrollStudentServiceTicketChatLog;
    __kiuSsApi.renderStudentServiceTicketThreadModalShell = renderStudentServiceTicketThreadModalShell;
    __kiuSsApi.closeStudentServiceTicketThreadModal = closeStudentServiceTicketThreadModal;
    __kiuSsApi.mountStudentServiceTicketThreadModal = mountStudentServiceTicketThreadModal;
    __kiuSsApi.remountStudentServiceTicketThreadModal = remountStudentServiceTicketThreadModal;
    __kiuSsApi.getStudentServiceTicketReplyTextareaId = getStudentServiceTicketReplyTextareaId;
    __kiuSsApi.getStudentServiceInternalNoteTextareaId = getStudentServiceInternalNoteTextareaId;
    __kiuSsApi.getStudentServiceInternalNoteComposerId = getStudentServiceInternalNoteComposerId;
    __kiuSsApi.openStudentServiceTicket = openStudentServiceTicket;
    __kiuSsApi.openStudentServiceArticleFromTicket = openStudentServiceArticleFromTicket;
    __kiuSsApi.scheduleStudentServiceTicketFilterRender = scheduleStudentServiceTicketFilterRender;
    __kiuSsApi.setStudentServiceTicketFilter = setStudentServiceTicketFilter;
    __kiuSsApi.submitStudentServiceTicket = submitStudentServiceTicket;
    __kiuSsApi.replyStudentServiceTicket = replyStudentServiceTicket;
    __kiuSsApi.updateStudentServiceTicketStatus = updateStudentServiceTicketStatus;
    __kiuSsApi.assignStudentServiceTicketToCurrentUser = assignStudentServiceTicketToCurrentUser;
    __kiuSsApi.addStudentServiceInternalNote = addStudentServiceInternalNote;
    __kiuSsApi.updateStudentServiceHandoff = updateStudentServiceHandoff;
})();
