/* Home dashboard shell bind and renderDynamicHomeShell — static merged page (no customize/editor). */
    function bindHomeShellActions(homeShell) {
        homeShell.querySelectorAll('[data-nav-target]').forEach((button) => button.addEventListener('click', () => {
            if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
        }));
        homeShell.querySelectorAll('[data-admin-provision]').forEach((button) => button.addEventListener('click', () => {
            if (typeof openUnifiedAdminProvision === 'function') openUnifiedAdminProvision(button.dataset.adminProvision);
        }));
        homeShell.querySelectorAll('[data-admin-focus]').forEach((button) => button.addEventListener('click', () => {
            queueAdminToolsFocus(button.dataset.adminFocus);
            if (typeof navigate === 'function') navigate('admin-tools');
        }));
    }

    function buildStaticHomeSectionsHtml(widgets, role) {
        const fullWidth = new Set(['alert', 'hero', 'admin-ops', 'quick', 'student-header', 'student-command', 'student-summary', 'student-extra']);
        let html = '';
        let halfBuffer = [];
        const flushHalf = () => {
            if (!halfBuffer.length) return;
            const cells = halfBuffer.map((content) => `<div class="lux-home-cell">${content}</div>`).join('');
            html += `<section class="lux-home-band lux-home-band--split">${cells}</section>`;
            halfBuffer = [];
        };
        (widgets || []).forEach((widget) => {
            const content = typeof renderWidgetContent === 'function' ? renderWidgetContent(widget, role) : '';
            if (!content) return;
            if (fullWidth.has(widget.renderType)) {
                flushHalf();
                html += `<section class="lux-home-band lux-home-band--full" data-band="${escapeHtml(widget.renderType || 'section')}">${content}</section>`;
                return;
            }
            halfBuffer.push(content);
            if (halfBuffer.length >= 2) flushHalf();
        });
        flushHalf();
        return html;
    }

    function getStaticHomeWidgets(role, model) {
        const definitions = typeof buildSystemWidgetDefinitions === 'function'
            ? buildSystemWidgetDefinitions(role, model)
            : [];
        return (definitions || []).filter((widget) => {
            if (!widget) return false;
            if (widget.visible === false) return false;
            if (widget.defaultVisible === false) return false;
            // Skip user-only editor types in static home
            if (widget.sourceType === 'custom' || widget.sourceType === 'pinned') return false;
            if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') return false;
            return true;
        });
    }

    renderDynamicHomeShell = function (homeShell) {
        const role = getEffectiveRole();
        const model = buildHomeModel(role);
        const widgets = getStaticHomeWidgets(role, model);
        const title = model.title || 'Workspace overview';
        const copy = model.copy || 'Your faculty workspace at a glance.';
        const kicker = model.kicker || 'Home';
        const mergedContent = buildStaticHomeSectionsHtml(widgets, role);
        const toolbar = role === 'student' ? '' : `
                <div class="lux-home-toolbar">
                    <div>
                        <div class="lux-kicker">${escapeHtml(kicker)}</div>
                        <strong>${escapeHtml(title)}</strong>
                        ${copy ? `<p>${escapeHtml(copy)}</p>` : ''}
                    </div>
                </div>
        `;

        homeShell.innerHTML = `
            <div class="lux-home-page is-${escapeHtml(model.variant || role)}" data-role="${escapeHtml(model.variant || role)}" data-home-density="${role === 'student' ? 'compact' : 'standard'}">
                ${toolbar}
                <div class="lux-home-merged lux-soft-chrome" data-lux-glass-root="1">
                    ${mergedContent}
                </div>
            </div>
        `;
        bindHomeShellActions(homeShell);
    };

    const __legacySyncTopbar = syncTopbar;
    syncTopbar = function () {
        __legacySyncTopbar();
        applySidebarState();
        const editButton = document.getElementById('lux-dashboard-edit-btn');
        if (editButton) {
            editButton.hidden = true;
            editButton.style.setProperty('display', 'none', 'important');
        }
    };

    // Live background is owned by luxury-background.js; installer still exports this no-op.
    startBackground = function () {};
