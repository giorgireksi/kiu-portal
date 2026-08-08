/* Home dashboard widget markup renderers. */
    function renderListRowsMarkup(rows) {
        return ((rows && rows.length) ? rows : [{ icon: 'fas fa-circle-info', title: 'Nothing new yet', copy: 'Open the related workspace to start activity here.' }]).map((row) => `
            <div class="lux-list-row lux-soft-chrome home-hover-chip">
                <i class="${escapeHtml(row.icon || 'fas fa-circle')}"></i>
                <div>
                    <strong>${escapeHtml(row.title || 'Portal update')}</strong>
                    <span>${escapeHtml(row.copy || '')}</span>
                </div>
            </div>
        `).join('');
    }

    function renderQuickTilesMarkup(tiles) {
        return ((tiles && tiles.length) ? tiles : []).map((tile) => `
            <button class="lux-quick-btn lux-soft-chrome home-hover-chip" type="button" data-nav-target="${escapeHtml(tile.pageId)}">
                <div class="lux-quick-top">
                    <div class="icon"><i class="${escapeHtml(tile.icon)}"></i></div>
                    <div class="lux-quick-meta-badge">${escapeHtml(tile.meta || 'Workspace')}</div>
                </div>
                <strong>${escapeHtml(tile.label)}</strong>
                <span>${escapeHtml(tile.copy || '')}</span>
                <div class="lux-quick-bottom">
                    <div class="lux-quick-meter"><span style="width:${clampPercent(tile.progress, 0)}%"></span></div>
                    <em>${escapeHtml(tile.status || 'Open workspace')}</em>
                </div>
            </button>
        `).join('');
    }

    function renderAdminOpsMarkup(config) {
        if (!config || !Array.isArray(config.groups) || !config.groups.length) return '';
        return `
            <section class="lux-soft-chrome lux-admin-ops-panel">
                <div class="lux-card-head lux-admin-ops-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(config.title || 'Admin operations')}</div>
                        <div class="lux-admin-ops-copy">${escapeHtml(config.copy || '')}</div>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-nav-target="admin-tools">Open full tools page</button>
                </div>
                <div class="lux-admin-ops-grid">
                    ${config.groups.map((group) => `
                        <div class="lux-admin-op-card lux-soft-chrome">
                            <div class="lux-admin-op-head">
                                <strong>${escapeHtml(group.title || 'Operations')}</strong>
                                <span>${escapeHtml(group.copy || '')}</span>
                            </div>
                            <div class="lux-admin-op-actions">
                                ${(group.buttons || []).map((button) => {
                                    if (button.type === 'provision') {
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-provision="${escapeHtml(button.role)}"><i class="${escapeHtml(button.icon || 'fas fa-plus')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    if (button.type === 'focus') {
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-focus="${escapeHtml(button.focus)}"><i class="${escapeHtml(button.icon || 'fas fa-layer-group')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-nav-target="${escapeHtml(button.pageId)}"><i class="${escapeHtml(button.icon || 'fas fa-arrow-right')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderHeroFocusAsideMarkup(heroAside) {
        const aside = heroAside || {};
        const kicker = aside.kicker || 'Live overview';
        const chip = aside.chip || 'Status';
        const headline = aside.headline || '—';
        const copy = aside.copy || '';
        const meta = aside.meta && typeof aside.meta === 'object' ? aside.meta : { icon: 'fa-circle-dot', text: '' };

        return `
                    <aside class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip" aria-label="${escapeHtml(kicker)}">
                        <div class="lms-hero-focus-head">
                            <div class="lms-hero-focus-kicker">${escapeHtml(kicker)}</div>
                            <span class="lux-pill lux-soft-chrome home-hover-chip lms-hero-focus-chip" aria-label="Status">${escapeHtml(chip)}</span>
                        </div>
                        <div class="lms-hero-focus-body">
                            <div class="lms-hero-focus-title">${escapeHtml(headline)}</div>
                            <p class="lms-hero-focus-copy">${escapeHtml(copy)}</p>
                        </div>
                        <div class="lms-hero-focus-meta">
                            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas ${escapeHtml(meta.icon || 'fa-circle-dot')}"></i> ${escapeHtml(meta.text || '')}</span>
                        </div>
                    </aside>`;
    }



    function renderHeroWidgetMarkup(heroModel, role) {
        const model = heroModel || buildHomeModel(role);
        return `
            <section class="lux-soft-chrome lux-hero lux-builder-hero page-hero lux-summary-surface--hero">
                <div class="lux-hero-stage">
                    <div class="lux-hero-main">
                        <div class="lux-kicker">${escapeHtml(model.kicker || ROLE_LABELS[role] || 'Portal View')}</div>
                        <h1 class="page-hero-title">${escapeHtml(model.title)}</h1>
                        <p class="page-hero-copy">${escapeHtml(model.copy)}</p>
                        <div class="lux-pill-row">
                            ${(model.pills || []).map((pill) => `<span class="lux-pill lux-soft-chrome home-hover-chip">${escapeHtml(pill)}</span>`).join('')}
                        </div>
                        <div class="lux-hero-actions">
                            ${(model.actions || []).map(([pageId, label, actionType], index) => {
                                const actionAttribute = actionType === 'utility'
                                    ? `data-action="${escapeHtml(pageId)}"`
                                    : `data-nav-target="${escapeHtml(pageId)}"`;
                                return `<button class="${index === 0 ? 'lux-primary-btn' : index === 1 ? 'lux-secondary-btn' : 'lux-ghost-btn'}" type="button" ${actionAttribute}>${escapeHtml(label)}</button>`;
                            }).join('')}
                        </div>
                    </div>
                    ${renderHeroFocusAsideMarkup(model.heroAside)}
                </div>
                <div class="lux-stat-row">
                    ${(model.stats || []).map(([value, label]) => `<div class="lux-stat lux-soft-chrome home-hover-chip"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
                </div>
            </section>
        `;
    }

    function renderStudentOverline(label, icon) {
        return `<div class="lux-student-compact-overline"><i class="${escapeHtml(icon)}" aria-hidden="true"></i><span>${escapeHtml(label)}</span></div>`;
    }

    function renderStudentEmptyBlock(title, copy, icon, extraClass = 'lux-student-work-empty') {
        return `
            <div class="${escapeHtml(extraClass)}">
                <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(copy)}</span>
                </div>
            </div>
        `;
    }

    function renderStudentHeaderMarkup(compactModel = {}, heroModel = {}) {
        const context = compactModel.context || {};
        const status = compactModel.status || {};
        const stats = compactModel.stats || {};
        const tone = ['green', 'warm', 'support'].includes(status.tone) ? ` is-${status.tone}` : '';
        const term = stats.semester || 'S1';
        const gpa = !stats.performance || stats.performance === '--' ? '—' : String(stats.performance);
        const rawEcts = stats.completedEcts;
        const ectsMissing = rawEcts == null || rawEcts === '' || String(rawEcts).toLowerCase() === 'unavailable';
        const ects = ectsMissing ? '—' : String(rawEcts);
        const metaLine = `${term} · GPA ${gpa} · ECTS ${ects}`;
        return `
            <section class="lux-student-compact-header lux-student-pulse-header">
                <div class="lux-student-compact-heading">
                    <div class="lux-kicker">Student Dashboard</div>
                    <h1>${escapeHtml(context.firstName || heroModel.title || 'Student')}</h1>
                    <p>${escapeHtml(`${context.facultyName || 'Faculty'} · ${context.termLabel || 'Current term'}`)}</p>
                    <p class="lux-student-compact-meta">${escapeHtml(metaLine)}</p>
                </div>
                <div class="lux-student-compact-status${tone}">
                    <span>${escapeHtml(status.label || context.registrationLabel || 'Registration status')}</span>
                    ${status.actionLabel ? `<button class="lux-ghost-btn" type="button" data-nav-target="${escapeHtml(status.actionPage || 'lms')}">${escapeHtml(status.actionLabel)}</button>` : ''}
                </div>
            </section>
        `;
    }

    function renderStudentWeekStripMarkup(weekStrip = {}) {
        if (weekStrip.empty) {
            return renderStudentEmptyBlock(
                weekStrip.emptyTitle || 'No listed classes yet',
                weekStrip.emptyCopy || 'Register to unlock your week strip and timetable.',
                'fas fa-calendar-week',
                'lux-student-week-empty'
            );
        }
        const days = Array.isArray(weekStrip.days) ? weekStrip.days : [];
        return `
            <div class="lux-student-week-strip" role="list">
                ${days.map((day) => `
                    <div class="lux-soft-chrome home-hover-chip lux-student-week-day${day.isToday ? ' is-today' : ''}${day.hasSessions ? ' has-sessions' : ''}" role="listitem">
                        <span class="lux-student-week-day-label">${escapeHtml(day.label || '')}</span>
                        <strong>${escapeHtml(day.hasSessions ? String(day.count) : '—')}</strong>
                        <small>${escapeHtml(day.hasSessions ? (day.title || 'Class') : 'Free')}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderStudentStudyPanelMarkup(pulse = {}) {
        const known = Boolean(pulse.known);
        const perf = pulse.performance && typeof pulse.performance === 'object'
            ? pulse.performance
            : { value: pulse.performance || '--', label: pulse.performanceLabel || 'GPA' };
        if (known) {
            return `
                <div class="lux-student-study-panel">
                    <strong>${escapeHtml(String(pulse.completed))} / ${escapeHtml(String(pulse.target))} ECTS</strong>
                    <span>${escapeHtml(perf.label || 'GPA')} ${escapeHtml(perf.value || '--')} · ${escapeHtml(pulse.semester || 'S1')}</span>
                </div>
            `;
        }
        return `
            <div class="lux-student-study-panel is-quiet">
                <strong>Study card</strong>
                <span>Credits &amp; GPA live on your study card when posted.</span>
            </div>
        `;
    }

    function renderStudentEventsMarkup(events = []) {
        const items = Array.isArray(events) ? events.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'No upcoming events',
                'Open Social to browse campus events.',
                'fas fa-calendar-check'
            );
        }
        return `
            <div class="lux-student-event-list">
                ${items.map((item) => `
                    <button class="lux-student-event-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'social')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-calendar-check')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus event')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentWorkColumnMarkup(workDue = {}, events = []) {
        const items = Array.isArray(workDue.items) ? workDue.items : [];
        if (workDue.available && items.length) {
            return {
                body: `
                    ${renderStudentOverline('Work due', 'fas fa-clipboard-list')}
                    ${renderStudentWorkDueMarkup(workDue)}
                `,
                ctaPage: 'lms',
                ctaLabel: 'Browse LMS'
            };
        }
        return {
            body: `
                ${renderStudentOverline('Events', 'fas fa-calendar-check')}
                ${renderStudentEventsMarkup(events)}
            `,
            ctaPage: 'social',
            ctaLabel: 'Open social'
        };
    }

    function renderStudentCommandMarkup(compactModel = {}) {
        const weekStrip = compactModel.weekStrip || {};
        const schedule = Array.isArray(compactModel.schedule) ? compactModel.schedule : [];
        const workColumn = renderStudentWorkColumnMarkup(compactModel.workDue || {}, compactModel.events || []);
        const nextRows = schedule.slice(0, 4).map((row) => `
            <div class="lux-student-compact-schedule-row">
                <time>${escapeHtml(row.time || '--:--')}</time>
                <strong>${escapeHtml(row.title || 'Scheduled class')}</strong>
                <span>${escapeHtml(row.meta || '')}</span>
            </div>
        `).join('');
        return `
            <section class="lux-student-command lux-student-pulse-command">
                <div class="lux-soft-chrome lux-student-cell lux-student-command-column">
                    ${renderStudentOverline('This week', 'fas fa-calendar-week')}
                    ${renderStudentWeekStripMarkup(weekStrip)}
                    ${schedule.length ? `
                        ${renderStudentOverline('Next', 'fas fa-clock')}
                        <div class="lux-student-compact-schedule lux-student-week-next">${nextRows}</div>
                    ` : ''}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="timetable">Open timetable <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-command-column lux-student-work-column">
                    ${workColumn.body}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="${escapeHtml(workColumn.ctaPage)}">${escapeHtml(workColumn.ctaLabel)} <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderStudentWorkDueMarkup(workDue = {}) {
        const items = Array.isArray(workDue.items) ? workDue.items : [];
        if (!workDue.available) {
            return renderStudentEmptyBlock(
                workDue.emptyTitle || 'Work signals unavailable',
                workDue.emptyCopy || 'Open LMS to sync assignments and due work.',
                'fas fa-clipboard-list'
            );
        }
        if (!items.length) {
            return renderStudentEmptyBlock(
                workDue.emptyTitle || 'No open assignments',
                workDue.emptyCopy || 'Nothing due right now.',
                'fas fa-clipboard-list'
            );
        }
        return `
            <div class="lux-student-work-list">
                ${items.map((item) => `
                    <button class="lux-student-work-row is-${escapeHtml(item.tone || 'missing')}" type="button" data-nav-target="${escapeHtml(item.pageId || 'lms')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-clipboard-list')}" aria-hidden="true"></i>
                        <div>
                            <span class="lux-student-work-tone">${escapeHtml(item.label || 'Needs submit')}</span>
                            <strong>${escapeHtml(item.title || 'Assignment')}</strong>
                            <span>${escapeHtml(item.meta || '')}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentCampusUpdatesMarkup(campusUpdates = []) {
        const items = Array.isArray(campusUpdates) && campusUpdates.length
            ? campusUpdates.slice(0, 4)
            : [{ title: 'No new updates', meta: 'News, orders, and notifications will appear here.', when: '', pageId: 'news', icon: 'fas fa-bell' }];
        return `
            <div class="lux-student-news-list lux-student-updates-list">
                ${items.map((item) => `
                    <button class="lux-student-news-row lux-student-update-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'news')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-bell')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus update')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentLifeSnapshotMarkup(lifeSnapshot = []) {
        const rows = Array.isArray(lifeSnapshot) ? lifeSnapshot.slice(0, 5) : [];
        if (!rows.length) return '';
        return `
            <div class="lux-student-life-snapshot">
                ${rows.map((row) => `
                    <button class="lux-student-life-row" type="button" data-nav-target="${escapeHtml(row.pageId || 'study-card')}">
                        <i class="${escapeHtml(row.icon || 'fas fa-circle')}" aria-hidden="true"></i>
                        <span>${escapeHtml(row.label || '')}</span>
                        <strong>${escapeHtml(row.value || '')}</strong>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentShortcutsMarkup(shortcuts = []) {
        const items = Array.isArray(shortcuts) ? shortcuts.slice(0, 4) : [];
        if (!items.length) return '';
        return `
            <div class="lux-student-shortcut-row">
                ${items.map((item) => `
                    <button class="lux-ghost-btn lux-student-shortcut-chip" type="button" data-nav-target="${escapeHtml(item.pageId || 'lms')}">${escapeHtml(item.label || 'Open')}</button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentSummaryMarkup(compactModel = {}) {
        const updates = Array.isArray(compactModel.campusUpdates) ? compactModel.campusUpdates : [];
        const updatesCtaPage = updates.find((item) => item.pageId)?.pageId || 'news';
        return `
            <section class="lux-student-summary-strip lux-student-pulse-summary">
                <div class="lux-soft-chrome lux-student-cell lux-student-summary-panel lux-student-news-panel">
                    ${renderStudentOverline('Updates', 'fas fa-bell')}
                    ${renderStudentCampusUpdatesMarkup(updates)}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="${escapeHtml(updatesCtaPage)}">Open updates <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-attention-panel lux-student-study-column">
                    ${renderStudentOverline('Study', 'far fa-address-card')}
                    ${renderStudentStudyPanelMarkup(compactModel.academicPulse || {})}
                    ${renderStudentLifeSnapshotMarkup(compactModel.lifeSnapshot || [])}
                    ${renderStudentShortcutsMarkup(compactModel.shortcuts || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="study-card">Open study card <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderStudentScoreListMarkup(scores = []) {
        const items = Array.isArray(scores) ? scores.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'No recent score updates',
                'Last graded assessments will appear here when professors post them.',
                'fas fa-chart-line'
            );
        }
        return `
            <div class="lux-student-score-list">
                ${items.map((item) => `
                    <button class="lux-student-score-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'study-card')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-chart-line')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Subject')}</strong>
                            <span>${escapeHtml(item.meta || '')}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentCampusFeedMarkup(campusFeed = []) {
        const items = Array.isArray(campusFeed) ? campusFeed.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'Campus feed is quiet',
                'Open Social to see campus posts.',
                'fas fa-comments'
            );
        }
        return `
            <div class="lux-student-feed-list">
                ${items.map((item) => `
                    <button class="lux-student-feed-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'social')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-comments')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus post')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentExtraMarkup(compactModel = {}) {
        return `
            <section class="lux-student-extra-strip lux-student-pulse-extra">
                <div class="lux-soft-chrome lux-student-cell lux-student-extra-panel lux-student-scores-panel">
                    ${renderStudentOverline('Last updated', 'fas fa-chart-line')}
                    ${renderStudentScoreListMarkup(compactModel.scores || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="study-card">Open study card <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-extra-panel lux-student-feed-panel">
                    ${renderStudentOverline('Campus feed', 'fas fa-comments')}
                    ${renderStudentCampusFeedMarkup(compactModel.campusFeed || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="social">Open social <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderWidgetContent(widget, role) {
        if (widget.renderType === 'alert') {
            if (!widget.alert) return '';
            const alertTone = ['green', 'royal', 'support', 'warm'].includes(widget.alert.tone) ? ` is-${widget.alert.tone}` : '';
            return `
                <div class="lux-soft-chrome lux-alert${alertTone}">
                    <div class="lux-alert-icon"><i class="${escapeHtml(widget.alert.icon)}"></i></div>
                    <div class="lux-alert-copy">
                        <strong>${escapeHtml(widget.alert.title)}</strong>
                        <span>${escapeHtml(widget.alert.copy)}</span>
                    </div>
                    <button class="lux-primary-btn" type="button" data-nav-target="${escapeHtml(widget.alert.actionPage)}">${escapeHtml(widget.alert.actionLabel)}</button>
                </div>
            `;
        }
        if (widget.renderType === 'hero') return renderHeroWidgetMarkup(widget.heroModel, role);
        if (widget.renderType === 'student-header') return renderStudentHeaderMarkup(widget.compactModel, widget.heroModel);
        if (widget.renderType === 'student-command') return renderStudentCommandMarkup(widget.compactModel);
        if (widget.renderType === 'student-summary') return renderStudentSummaryMarkup(widget.compactModel);
        if (widget.renderType === 'student-extra') return renderStudentExtraMarkup(widget.compactModel);
        if (widget.renderType === 'quick') {
            return `
                <section class="lux-soft-chrome lux-dashboard-section lux-builder-section">
                    <div class="lux-card-head">
                        <div>
                            <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                            <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                        </div>
                        <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                    </div>
                    <div class="lux-quick-grid lux-quick-grid--embedded">${renderQuickTilesMarkup(widget.tiles)}</div>
                </section>
            `;
        }
        if (widget.renderType === 'admin-ops') return renderAdminOpsMarkup(widget.adminOperations);
        return `
            <section class="lux-soft-chrome lux-card lux-builder-card">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                        <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                    </div>
                    <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                </div>
                <div class="lux-list">${renderListRowsMarkup(widget.rows)}</div>
                ${widget.pageId ? `<div class="lux-builder-card-foot"><button class="lux-ghost-btn" type="button" data-nav-target="${escapeHtml(widget.pageId)}">Open ${escapeHtml(pageLabel(widget.pageId))}</button></div>` : ''}
            </section>
        `;
    }
