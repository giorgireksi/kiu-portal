/* LMS content library runtime: concepts-only (stores/weeks live in lms-week-store-runtime.js). */

function getLmsConceptAuthorDisplay(concept, currentUserId) {
    if (!concept) return 'Unknown author';
    if (!concept.isAnonymous) return concept.authorName || 'Unknown author';
    return String(concept.authorId || '') === String(currentUserId) ? `${concept.authorName || 'You'} (hidden from others)` : 'Anonymous Student';
}

function computeLmsConceptScoreSummary(resourceKey, conceptId) {
    const ratings = Object.values(getLmsConceptRatings(resourceKey, conceptId) || {})
        .map(value => parseFloat(value))
        .filter(value => Number.isFinite(value));
    const total = ratings.reduce((sum, value) => sum + value, 0);
    const count = ratings.length;
    const average = count ? (total / count) : 0;
    return {
        count,
        average,
        total
    };
}

function getLmsConceptReviewPillClass(reviewStatus = '') {
    const normalized = String(reviewStatus || '').trim().toLowerCase();
    if (normalized === 'approved') return 'is-approved';
    if (normalized === 'revision') return 'is-revision';
    return 'is-pending';
}

function canUploadLmsConcepts() {
    return Boolean(getCurrentUser());
}

function renderLmsConceptsLibrary(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('concepts', contentArea);

    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = parsed.resourceKey;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser?.id || '');
    const canManage = canManageLmsGroupContent();
    const canUpload = canUploadLmsConcepts();
    const token = toDomToken(resourceKey);
    const fileLabelId = `lms-concept-file-label-${token}`;
    const leaderboard = [...concepts].map(concept => {
        const stats = computeLmsConceptScoreSummary(resourceKey, concept.id);
        return { concept, ...stats };
    }).sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        if (b.count !== a.count) return b.count - a.count;
        return String(a.concept.createdAt || '').localeCompare(String(b.concept.createdAt || ''));
    });

    let html = `
        <div class="lms-route-stack">

            <div class="lms-route-panel">
                <div class="lms-route-card-head">
                    <div class="lms-concepts-head-main">
                        <i class="fas fa-lightbulb lms-concepts-head-icon"></i>
                        <div>
                            <div class="lms-route-card-title">Concepts</div>
                            <div class="lms-route-copy lms-route-copy-mt-4">${concepts.length} notes &middot; ${ensureLmsWeeksForKey(resourceKey).length} weeks</div>
                        </div>
                    </div>
                    <div class="lms-concepts-head-actions">
                        ${canManage ? '<button class="lux-secondary-btn lms-concepts-action-btn" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                    </div>
                </div>
            </div>
            <div class="lms-route-card-grid">
                <div class="lms-route-panel">
                    <div class="lms-route-card-title">Concept Leaderboard</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">Peer scoring stays between 5 and 10 so the clearest concepts rise to the top.</div>
                    <div class="lms-concept-leader-list">
                        ${leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => `
                            <div class="lms-route-card lms-route-panel-compact lms-concept-leader-item${index === 0 ? ' is-featured' : ''}">
                                <div class="lms-concept-leader-head">
                                    <div>
                                        <div class="lms-route-card-title lms-concept-leader-title">${escapeHtml(entry.concept.title || 'Untitled concept')}</div>
                                        <div class="lms-route-meta lms-concept-leader-meta">${joinLmsMeta([getLmsConceptAuthorDisplay(entry.concept, currentUserId), getLmsWeekLabel(entry.concept.weekLabel)])}</div>
                                    </div>
                                    <div class="lms-concept-leader-score">
                                        <div class="lms-route-card-title lms-concept-leader-score-value">${entry.count ? entry.average.toFixed(1) : 'No ratings'}</div>
                                        <div class="lms-route-meta lms-concept-leader-score-meta">${entry.count} vote${entry.count === 1 ? '' : 's'}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : renderLmsRouteEmptyState('No Ratings Yet', 'No concepts have been rated in this group yet.', 'fa-ranking-star')}
                    </div>
                </div>
                <div class="lms-route-panel">
                    <div class="lms-route-card-title">How Concepts Work</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">This tab uses the same transparent route surfaces as the rest of LMS instead of the old white boxes.</div>
                    <div class="lms-route-card-grid lms-route-stack-mt-16">
                        <div class="lms-route-card lms-route-panel-compact lms-concept-guidance-card"><div class="lms-route-kv-label">Week-linked or general</div><div class="lms-route-copy lms-route-copy-mt-6">Attach concepts to a week or leave them under the general section.</div></div>
                        <div class="lms-route-card lms-route-panel-compact lms-concept-guidance-card"><div class="lms-route-kv-label">Anonymous mode</div><div class="lms-route-copy lms-route-copy-mt-6">Students can hide their name from classmates while staff still sees the correct author.</div></div>
                        <div class="lms-route-card lms-route-panel-compact lms-concept-guidance-card"><div class="lms-route-kv-label">Peer scoring</div><div class="lms-route-copy lms-route-copy-mt-6">Members rate concepts from 5 to 10 to surface the strongest explanations.</div></div>
                    </div>
                </div>
            </div>
    `;
    if (canUpload) {
        html += `
            <div class="lms-route-panel">
                <div class="lms-route-card-head lms-route-card-head-mb-16">
                    <div>
                        <div class="lms-route-card-title"><i class="fas fa-lightbulb"></i> Share a Concept</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">Upload a simplified explanation, staff note, weekly summary, or helpful concept file for this group.</div>
                    </div>
                    <div id="${fileLabelId}" class="lms-route-pill home-hover-chip">No concept file selected</div>
                </div>
                <div class="lms-route-field-grid">
                    <div class="lms-route-field">
                        <label class="lms-route-field-label" for="new-concept-title">Concept Title</label>
                        <input id="new-concept-title" class="lms-route-input lux-control" type="text" placeholder="Concept title">
                    </div>
                    <div class="lms-route-field">
                        <label class="lms-route-field-label" for="new-concept-week">Teaching Week</label>
                        <select id="new-concept-week" class="lms-route-select lux-control">
                            ${buildLmsWeekSelectOptions(resourceKey, '')}
                        </select>
                    </div>
                </div>
                <div class="lms-route-field lms-route-field-mt-14">
                    <label class="lms-route-field-label" for="new-concept-summary">Summary</label>
                    <textarea id="new-concept-summary" class="lms-route-textarea lux-control" placeholder="Explain the concept in an easier way, add solved examples, shortcuts, or learning tips..."></textarea>
                </div>
                ${getEffectiveUserRole() === USER_ROLES.STUDENT ? `
                    <label class="lms-concept-form-toggle">
                        <input type="checkbox" id="new-concept-anonymous">
                        Hide my name from other students in this group
                    </label>
                ` : ''}
                <div class="lms-route-actions lms-route-actions-mt-16">
                    <button class="lux-secondary-btn" data-lms-click="pickLocalLmsFile('concept', '${resourceKey}', '${fileLabelId}')"><i class="fas fa-paperclip"></i> Attach File</button>
                    <button class="lux-primary-btn" data-lms-click="createLmsConcept('${resourceKey}')"><i class="fas fa-plus"></i> Publish Concept</button>
                </div>
            </div>
        `;
    }

    const groupedConcepts = groupLmsItemsByWeek(resourceKey, concepts, concept => concept.weekLabel);
    html += groupedConcepts.length ? groupedConcepts.map(([weekLabel, weekConcepts], index) => {
        const body = weekConcepts.length ? `
            <div class="lms-route-stack lms-route-stack-gap-16">
                ${weekConcepts.map(concept => {
                    const score = computeLmsConceptScoreSummary(resourceKey, concept.id);
                    const ratings = getLmsConceptRatings(resourceKey, concept.id);
                    const currentVote = Number(ratings[currentUserId] || 0);
                    const showAuthor = getLmsConceptAuthorDisplay(concept, currentUserId);
                    const canDelete = canManage || String(concept.authorId || '') === currentUserId;
                    const canRate = currentUserId && String(concept.authorId || '') !== currentUserId;
                    const reviewLabel = concept.reviewStatus === 'approved' ? 'Reviewed' : concept.reviewStatus === 'revision' ? 'Needs correction' : 'Pending review';
                    return `
                        <div class="lms-route-card lms-route-panel-compact lms-concept-card">
                            <div class="lms-route-card-head lms-concept-card-head">
                                <div>
                                    <div class="lms-route-card-title">${escapeHtml(concept.title || 'Untitled concept')}</div>
                                    <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${joinLmsMeta([`Shared by ${showAuthor}`, formatLmsDateTime(concept.createdAt)])}</div>
                                </div>
                                <div class="lms-concept-status-row">
                                    ${concept.pinned ? '<span class="lms-route-pill home-hover-chip"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                                    <span class="lms-route-pill home-hover-chip lms-concept-review-pill ${getLmsConceptReviewPillClass(concept.reviewStatus)}">${escapeHtml(reviewLabel)}</span>
                                    <span class="lms-route-pill home-hover-chip is-positive">${score.count ? `${score.average.toFixed(1)} / 10` : 'Not rated yet'}</span>
                                    <span class="lms-route-meta lms-route-meta-12">${score.count} vote${score.count === 1 ? '' : 's'}</span>
                                    ${canDelete ? `<button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square lms-route-btn-danger" data-lms-click="deleteLmsConcept('${resourceKey}', '${concept.id}')"><i class="fas fa-trash"></i></button>` : ''}
                                </div>
                            </div>
                            <div class="lms-route-copy lms-route-copy-mt-14 lms-route-copy-prewrap">${escapeHtml(concept.summary || 'No summary added.')}</div>
                            ${concept.file ? renderLmsStoredFileAttachmentShell(concept.file, {
                                label: 'Attached File',
                                title: concept.file.name || 'Concept file',
                                downloadLabel: 'Download concept file'
                            }) : ''}
                            <div class="lms-concept-card-footer">
                                <div class="lms-concept-card-footer-copy lms-route-meta lms-route-meta-12">This concept is ranked inside this LMS group only.</div>
                                <div class="lms-concept-card-footer-actions">
                                    ${canManage ? `
                                        <div class="lms-concept-review-actions">
                                            <button class="lux-secondary-btn" data-lms-click="updateLmsConceptReview('${resourceKey}', '${concept.id}', 'approved')"><i class="fas fa-check"></i> Approve</button>
                                            <button class="lux-secondary-btn" data-lms-click="updateLmsConceptReview('${resourceKey}', '${concept.id}', 'revision')"><i class="fas fa-rotate"></i> Revision</button>
                                            <button class="lux-secondary-btn" data-lms-click="toggleLmsConceptPinned('${resourceKey}', '${concept.id}')"><i class="fas fa-thumbtack"></i> ${concept.pinned ? 'Unpin' : 'Pin'}</button>
                                        </div>
                                    ` : ''}
                                    ${canRate ? [5, 6, 7, 8, 9, 10].map(value => `
                                        <button class="${currentVote === value ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-concept-rate-btn" data-lms-click="rateLmsConcept('${resourceKey}', '${concept.id}', ${value})">${value}</button>
                                    `).join('') : `<span class="lms-concept-rating-note lms-route-meta lms-route-meta-12">${String(concept.authorId || '') === currentUserId ? 'You cannot rate your own concept.' : 'Login required to rate.'}</span>`}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : renderLmsWeekPanelEmptyState('No Concepts Yet', 'No concepts were shared in this week yet.', 'fa-lightbulb');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekConcepts.length} concept${weekConcepts.length === 1 ? '' : 's'} shared here`,
            body,
            index === 0
        );
    }).join('') : renderLmsRouteEmptyState('No Concepts Yet', 'No concepts have been shared for this group yet.', 'fa-lightbulb');

    html += `</div>`;
    contentArea.innerHTML = localizeHtmlMarkup(html);
}

async function createLmsConcept(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const title = document.getElementById('new-concept-title')?.value.trim();
    const summary = document.getElementById('new-concept-summary')?.value.trim();
    const weekLabel = document.getElementById('new-concept-week')?.value || '';
    const isAnonymous = Boolean(document.getElementById('new-concept-anonymous')?.checked);
    const file = getLmsDraftFile('concept', resourceKey);

    if (!title) {
        alert('Please add a concept title.');
        return;
    }
    if (!summary && !file) {
        alert('Please add a concept explanation or attach a file.');
        return;
    }

    try {
        const persistedFile = file ? await persistLmsStoredFile(file, 'concept') : null;
        const concepts = ensureLmsConceptsForKey(resourceKey);
        concepts.unshift({
            id: `concept_${Date.now()}`,
            title,
            summary,
            weekLabel,
            file: persistedFile,
            isAnonymous: getEffectiveUserRole() === USER_ROLES.STUDENT ? isAnonymous : false,
            authorId: String(currentUser.id),
            authorName: currentUser.nameEn || currentUser.name || currentUser.email || currentUser.id,
            reviewStatus: canManageLmsGroupContent() ? 'approved' : 'pending',
            reviewed: canManageLmsGroupContent(),
            approved: canManageLmsGroupContent(),
            pinned: false,
            createdAt: new Date().toISOString()
        });

        clearLmsDraftFile('concept', resourceKey);
        saveState();
        rerenderCurrentLmsTab();
    } catch (error) {
        console.error('Could not save LMS concept.', error);
        alert('Concept file could not be saved.');
    }
}

function updateLmsConceptReview(resourceKey, conceptId, reviewStatus = 'approved') {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can review concepts.');
        return;
    }
    const concept = ensureLmsConceptsForKey(resourceKey).find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    const normalized = ['approved', 'revision', 'pending'].includes(String(reviewStatus)) ? String(reviewStatus) : 'approved';
    concept.reviewStatus = normalized;
    concept.reviewed = normalized !== 'pending';
    concept.approved = normalized === 'approved';
    saveState();
    rerenderCurrentLmsTab();
}

function toggleLmsConceptPinned(resourceKey, conceptId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can pin concepts.');
        return;
    }
    const concept = ensureLmsConceptsForKey(resourceKey).find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    concept.pinned = !concept.pinned;
    saveState();
    rerenderCurrentLmsTab();
}

function deleteLmsConcept(resourceKey, conceptId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const concept = concepts.find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    const canDelete = canManageLmsGroupContent() || String(concept.authorId || '') === String(currentUser.id);
    if (!canDelete) {
        alert('You can only remove your own concepts unless you are course staff.');
        return;
    }
    ensureLmsConceptRatingsForKey(resourceKey);
    queueStoredFileDelete(concept.file);
    KIU_STATE.groupConcepts[resourceKey] = concepts.filter(item => String(item.id) !== String(conceptId));
    delete KIU_STATE.groupConceptRatings[resourceKey][conceptId];
    saveState();
    rerenderCurrentLmsTab();
}

function rateLmsConcept(resourceKey, conceptId, score) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const numericScore = parseInt(score, 10);
    if (!Number.isFinite(numericScore) || numericScore < 5 || numericScore > 10) return;
    const concepts = ensureLmsConceptsForKey(resourceKey);
    const concept = concepts.find(item => String(item.id) === String(conceptId));
    if (!concept) return;
    if (String(concept.authorId || '') === String(currentUser.id)) {
        alert('You cannot rate your own concept.');
        return;
    }
    const ratings = getLmsConceptRatings(resourceKey, conceptId);
    ratings[String(currentUser.id)] = numericScore;
    saveState();
    renderLmsConceptsLibrary(resourceKey);
}

if (typeof window !== 'undefined') {
    window.renderLmsConceptsLibrary = window.renderLmsConceptsLibrary || renderLmsConceptsLibrary;
}
