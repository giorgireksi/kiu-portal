(function initPortalEmailWorkspace() {
    if (window.__KIU_PORTAL_EMAIL_WORKSPACE__) return;
    window.__KIU_PORTAL_EMAIL_WORKSPACE__ = true;

    const EMAIL_RUNTIME = {
        initialized: false,
        loading: false,
        bootstrap: null,
        activeFolder: 'inbox',
        search: '',
        unreadOnly: false,
        messages: [],
        selectedMessageId: '',
        selectedMessage: null,
        composeMode: '',
        refreshIntervalId: null,
        compose: {
            to: '',
            cc: '',
            subject: '',
            body: '',
            attachments: []
        },
        bannerTone: '',
        bannerMessage: ''
    };

    const ROLE_COPY = {
        student: {
            eyebrow: 'Student Mail Desk',
            title: 'Outlook inside the academic shell.',
            copy: 'Stay on top of lecturer updates, student service replies, and campus communication without leaving the portal.'
        },
        professor: {
            eyebrow: 'Faculty Mail Deck',
            title: 'A focused mailbox for teaching and coordination.',
            copy: 'Review student mail, reply to academic requests, and keep Outlook traffic close to LMS and assessment workflows.'
        },
        ta: {
            eyebrow: 'Support Mail Deck',
            title: 'Section coordination without context switching.',
            copy: 'Move between inbox triage, course support, and section communication in one workspace.'
        },
        admin: {
            eyebrow: 'Operations Mail Deck',
            title: 'Keep Outlook communication inside the control room.',
            copy: 'Track approvals, operational replies, and institutional communication without leaving the portal.'
        },
        student_service: {
            eyebrow: 'Service Mail Desk',
            title: 'Mailbox support aligned with student service work.',
            copy: 'Review personal Outlook communication while staying close to service queues and student records.'
        }
    };

    function ensureEmailStyles() {
        if (document.getElementById('kiu-email-workspace-styles')) return;
        const style = document.createElement('style');
        style.id = 'kiu-email-workspace-styles';
        style.textContent = `
            .mail-workspace {
                display: grid;
                gap: 18px;
                color: var(--lux-text, #eef2ff);
            }
            .mail-hero {
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 28px;
                padding: 26px 28px;
                background:
                    radial-gradient(circle at top right, rgba(89,124,255,0.24), transparent 38%),
                    linear-gradient(135deg, rgba(9,15,34,0.95), rgba(13,21,46,0.92));
                box-shadow: 0 28px 90px rgba(2, 8, 23, 0.38);
            }
            .mail-hero::after {
                content: '';
                position: absolute;
                inset: auto -8% -40% auto;
                width: 280px;
                height: 280px;
                background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 66%);
                pointer-events: none;
            }
            .mail-hero-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 18px;
                flex-wrap: wrap;
            }
            .mail-hero-copy {
                max-width: 720px;
                display: grid;
                gap: 10px;
            }
            .mail-eyebrow {
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.68);
            }
            .mail-title {
                margin: 0;
                font-family: "Playfair Display", Georgia, serif;
                font-size: clamp(28px, 4vw, 42px);
                line-height: 1.05;
                color: #fff;
            }
            .mail-copy {
                margin: 0;
                max-width: 720px;
                font-size: 14px;
                line-height: 1.7;
                color: rgba(226,232,240,0.84);
            }
            .mail-pill-row {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 12px;
            }
            .mail-pill-row--center {
                justify-content: center;
            }
            .mail-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border-radius: 999px;
                padding: 9px 13px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.08);
                font-size: 12px;
                color: rgba(241,245,249,0.9);
            }
            .mail-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
                justify-content: flex-end;
            }
            .mail-actions--center {
                justify-content: center;
            }
            .mail-banner {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 16px;
                border-radius: 18px;
                font-size: 13px;
                line-height: 1.65;
                border: 1px solid transparent;
            }
            .mail-banner.is-info {
                background: rgba(59,130,246,0.12);
                color: #dbeafe;
                border-color: rgba(59,130,246,0.22);
            }
            .mail-banner.is-success {
                background: rgba(22,163,74,0.13);
                color: #dcfce7;
                border-color: rgba(22,163,74,0.25);
            }
            .mail-banner.is-error {
                background: rgba(220,38,38,0.13);
                color: #fee2e2;
                border-color: rgba(220,38,38,0.24);
            }
            .mail-banner--mt-14 {
                margin-top: 14px;
            }
            .mail-shell {
                display: grid;
                grid-template-columns: minmax(220px, 260px) minmax(300px, 1.05fr) minmax(360px, 1.2fr);
                gap: 16px;
                align-items: start;
            }
            .mail-panel {
                border-radius: 24px;
                padding: 18px;
                border: 1px solid rgba(255,255,255,0.08);
                background: linear-gradient(180deg, rgba(9,15,34,0.9), rgba(7,13,28,0.88));
                box-shadow: 0 18px 50px rgba(2, 8, 23, 0.28);
                min-height: 220px;
            }
            .mail-panel-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 14px;
            }
            .mail-panel-title {
                display: grid;
                gap: 4px;
            }
            .mail-panel-title--mt-18 {
                margin-top: 18px;
            }
            .mail-panel-title strong {
                font-size: 15px;
                color: #fff;
            }
            .mail-panel-title span {
                font-size: 11px;
                color: rgba(191,219,254,0.72);
                text-transform: uppercase;
                letter-spacing: 0.12em;
            }
            .mail-folder-list,
            .mail-message-list,
            .mail-reader-meta,
            .mail-attachment-list {
                display: grid;
                gap: 10px;
            }
            .mail-folder-btn,
            .mail-message-card,
            .mail-attachment-link {
                width: 100%;
                text-align: left;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 18px;
                background: rgba(255,255,255,0.04);
                color: inherit;
                transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
            }
            .mail-folder-btn {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                padding: 14px;
                cursor: pointer;
            }
            .mail-folder-btn.is-active,
            .mail-message-card.is-active,
            .mail-folder-btn:hover,
            .mail-message-card:hover,
            .mail-attachment-link:hover {
                transform: translateY(-1px);
                border-color: rgba(96,165,250,0.35);
                background: rgba(37,99,235,0.1);
            }
            .mail-folder-copy {
                display: grid;
                gap: 5px;
            }
            .mail-folder-copy strong {
                color: #fff;
                font-size: 14px;
            }
            .mail-folder-copy span {
                font-size: 12px;
                color: rgba(191,219,254,0.74);
            }
            .mail-folder-count {
                min-width: 34px;
                padding: 7px 10px;
                border-radius: 999px;
                text-align: center;
                background: rgba(255,255,255,0.1);
                color: #fff;
                font-size: 12px;
                font-weight: 700;
            }
            .mail-list-toolbar {
                display: grid;
                gap: 10px;
                margin-bottom: 14px;
            }
            .mail-search-row {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .mail-search-row input,
            .mail-compose-form input,
            .mail-compose-form textarea {
                width: 100%;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.05);
                color: #fff;
                padding: 12px 14px;
                outline: none;
                font: inherit;
            }
            .mail-search-row input::placeholder,
            .mail-compose-form input::placeholder,
            .mail-compose-form textarea::placeholder {
                color: rgba(191,219,254,0.5);
            }
            .mail-search-row input:focus,
            .mail-compose-form input:focus,
            .mail-compose-form textarea:focus {
                border-color: rgba(96,165,250,0.4);
                box-shadow: 0 0 0 4px rgba(37,99,235,0.14);
            }
            .mail-toggle {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: rgba(226,232,240,0.82);
                font-size: 12px;
                cursor: pointer;
            }
            .mail-message-card {
                padding: 14px;
                cursor: pointer;
            }
            .mail-message-top {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                align-items: flex-start;
            }
            .mail-message-from {
                display: grid;
                gap: 5px;
            }
            .mail-message-from strong {
                color: #fff;
                font-size: 13px;
            }
            .mail-message-from span,
            .mail-message-time,
            .mail-message-snippet {
                font-size: 12px;
                color: rgba(191,219,254,0.74);
            }
            .mail-message-subject {
                margin-top: 8px;
                font-size: 14px;
                font-weight: 700;
                color: #f8fafc;
            }
            .mail-message-snippet {
                margin-top: 6px;
                line-height: 1.65;
            }
            .mail-message-card.is-unread {
                border-color: rgba(248,250,252,0.16);
                background: rgba(255,255,255,0.06);
            }
            .mail-reader-empty,
            .mail-list-empty,
            .mail-connect-card {
                padding: 28px;
                border-radius: 24px;
                border: 1px dashed rgba(148,163,184,0.28);
                background: rgba(255,255,255,0.03);
                text-align: center;
                display: grid;
                gap: 12px;
                place-items: center;
                min-height: 320px;
            }
            .mail-list-empty--compact {
                min-height: 0;
                padding: 18px;
            }
            .mail-connect-card {
                min-height: 420px;
            }
            .mail-empty-icon-sm {
                font-size: 22px;
            }
            .mail-empty-icon-md {
                font-size: 24px;
            }
            .mail-empty-icon-lg {
                font-size: 32px;
            }
            .mail-reader-title {
                margin: 0;
            }
            .mail-reader-header {
                display: grid;
                gap: 12px;
                margin-bottom: 16px;
            }
            .mail-reader-header h3 {
                margin: 0;
                font-size: clamp(24px, 3vw, 32px);
                font-family: "Playfair Display", Georgia, serif;
                color: #fff;
            }
            .mail-reader-grid {
                display: grid;
                gap: 10px;
                margin-bottom: 18px;
            }
            .mail-reader-line {
                display: grid;
                gap: 4px;
                font-size: 12px;
                color: rgba(191,219,254,0.76);
            }
            .mail-reader-line strong {
                color: rgba(255,255,255,0.7);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-size: 10px;
            }
            .mail-reader-body {
                border-top: 1px solid rgba(255,255,255,0.08);
                padding-top: 18px;
                color: rgba(248,250,252,0.92);
                line-height: 1.75;
                font-size: 14px;
                overflow-wrap: anywhere;
            }
            .mail-reader-actions,
            .mail-compose-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 16px;
            }
            .mail-compose-actions--flush {
                margin-top: 0;
            }
            .mail-attachment-link {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                text-decoration: none;
            }
            .mail-attachment-link strong {
                color: #fff;
            }
            .mail-attachment-link span {
                color: rgba(191,219,254,0.72);
                font-size: 12px;
            }
            .mail-compose-form {
                display: grid;
                gap: 12px;
            }
            .mail-compose-attachments {
                display: grid;
                gap: 10px;
            }
            .mail-compose-attachment-list {
                display: grid;
                gap: 8px;
            }
            .mail-compose-attachment {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.05);
            }
            .mail-compose-attachment strong {
                color: #fff;
                font-size: 13px;
            }
            .mail-compose-attachment span {
                display: block;
                color: rgba(191,219,254,0.72);
                font-size: 11px;
                margin-top: 4px;
            }
            .mail-compose-form textarea {
                min-height: 220px;
                resize: vertical;
            }
            .mail-reader-body iframe {
                width: 100%;
                min-height: 360px;
                border: 0;
                border-radius: 18px;
                background: #fff;
            }
            @media (max-width: 1180px) {
                .mail-shell {
                    grid-template-columns: minmax(220px, 260px) minmax(260px, 1fr);
                }
                .mail-panel.mail-reader-panel {
                    grid-column: 1 / -1;
                }
            }
            @media (max-width: 860px) {
                .mail-hero {
                    padding: 22px;
                }
                .mail-shell {
                    grid-template-columns: 1fr;
                }
                .mail-panel {
                    padding: 16px;
                }
                .mail-reader-header h3 {
                    font-size: 24px;
                }
            }
        `;
        style.textContent += `
            .mail-workspace {
                gap: 22px;
            }
            .mail-hero {
                border-radius: 34px;
                padding: 30px 32px;
                background:
                    radial-gradient(circle at 12% 18%, rgba(255,255,255,0.12), transparent 24%),
                    radial-gradient(circle at 82% 18%, rgba(96,165,250,0.22), transparent 26%),
                    linear-gradient(135deg, rgba(6,11,27,0.98), rgba(18,28,58,0.94) 46%, rgba(18,65,110,0.88));
            }
            .mail-hero-top {
                align-items: stretch;
            }
            .mail-actions {
                align-content: flex-start;
                justify-content: flex-start;
                min-width: 240px;
            }
            .mail-command-deck {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 14px;
            }
            .mail-command-card {
                display: grid;
                grid-template-columns: 56px 1fr;
                gap: 14px;
                align-items: start;
                padding: 18px;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.08);
                background:
                    linear-gradient(180deg, rgba(12,19,39,0.92), rgba(7,14,28,0.92));
                box-shadow: 0 18px 45px rgba(2, 8, 23, 0.22);
            }
            .mail-command-icon {
                width: 56px;
                height: 56px;
                border-radius: 18px;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, rgba(37,99,235,0.26), rgba(56,189,248,0.16));
                color: #dbeafe;
                font-size: 20px;
                border: 1px solid rgba(96,165,250,0.16);
            }
            .mail-command-copy {
                display: grid;
                gap: 6px;
            }
            .mail-command-copy span {
                font-size: 10px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(191,219,254,0.68);
            }
            .mail-command-copy strong {
                color: #fff;
                font-size: 18px;
                line-height: 1.2;
            }
            .mail-command-copy p {
                margin: 0;
                color: rgba(226,232,240,0.72);
                font-size: 12px;
                line-height: 1.65;
            }
            .mail-connection-advisory {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 18px 20px;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.08);
                background: linear-gradient(180deg, rgba(10,18,36,0.9), rgba(9,15,28,0.88));
            }
            .mail-connection-advisory.is-success {
                background: linear-gradient(180deg, rgba(8,42,28,0.75), rgba(7,24,20,0.9));
                border-color: rgba(74,222,128,0.22);
            }
            .mail-connection-advisory.is-info {
                background: linear-gradient(180deg, rgba(14,30,58,0.84), rgba(8,18,34,0.9));
                border-color: rgba(96,165,250,0.22);
            }
            .mail-connection-advisory.is-warning {
                background: linear-gradient(180deg, rgba(58,37,10,0.84), rgba(33,21,8,0.92));
                border-color: rgba(251,191,36,0.24);
            }
            .mail-connection-copy {
                display: grid;
                gap: 6px;
                max-width: 820px;
            }
            .mail-connection-copy span {
                font-size: 10px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(191,219,254,0.68);
            }
            .mail-connection-copy strong {
                color: #fff;
                font-size: 20px;
            }
            .mail-connection-copy p {
                margin: 0;
                color: rgba(226,232,240,0.78);
                line-height: 1.7;
                font-size: 13px;
            }
            .mail-shell {
                grid-template-columns: minmax(250px, 300px) minmax(340px, 1.05fr) minmax(420px, 1.25fr);
                gap: 18px;
            }
            .mail-panel {
                border-radius: 30px;
                padding: 20px;
                background:
                    radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 22%),
                    linear-gradient(180deg, rgba(7,13,28,0.94), rgba(4,9,22,0.94));
            }
            .mail-folder-list {
                gap: 12px;
            }
            .mail-panel.mail-rail-panel {
                display: grid;
                gap: 18px;
            }
            .mail-account-chip {
                display: grid;
                gap: 10px;
                padding: 16px;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.04);
            }
            .mail-account-chip-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .mail-account-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 7px 11px;
                border-radius: 999px;
                background: rgba(96,165,250,0.12);
                color: #dbeafe;
                font-size: 11px;
                font-weight: 700;
            }
            .mail-account-chip strong {
                color: #fff;
                font-size: 17px;
            }
            .mail-account-chip p,
            .mail-side-note p {
                margin: 0;
                color: rgba(226,232,240,0.74);
                font-size: 12px;
                line-height: 1.7;
            }
            .mail-side-note {
                padding: 16px;
                border-radius: 22px;
                border: 1px dashed rgba(148,163,184,0.24);
                background: rgba(255,255,255,0.03);
                display: grid;
                gap: 8px;
            }
            .mail-side-note strong {
                color: #fff;
                font-size: 13px;
            }
            .mail-folder-btn {
                border-radius: 22px;
                padding: 16px;
                background: rgba(255,255,255,0.035);
            }
            .mail-folder-btn.is-active {
                background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.1));
            }
            .mail-folder-count {
                min-width: 38px;
                padding: 8px 11px;
            }
            .mail-panel.mail-list-panel,
            .mail-panel.mail-reader-panel {
                display: grid;
                gap: 16px;
            }
            .mail-list-toolbar {
                gap: 12px;
                padding: 14px;
                border-radius: 22px;
                background: rgba(255,255,255,0.035);
                border: 1px solid rgba(255,255,255,0.07);
            }
            .mail-list-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 2px;
            }
            .mail-list-meta strong {
                color: #fff;
                font-size: 16px;
            }
            .mail-list-meta span {
                color: rgba(191,219,254,0.7);
                font-size: 12px;
            }
            .mail-chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .mail-chip {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                padding: 8px 11px;
                border-radius: 999px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                color: rgba(226,232,240,0.84);
                font-size: 11px;
            }
            .mail-message-list {
                gap: 12px;
                max-height: 920px;
                overflow: auto;
                padding-right: 4px;
            }
            .mail-message-card {
                border-radius: 24px;
                padding: 16px;
            }
            .mail-message-card.is-unread {
                background: linear-gradient(135deg, rgba(255,255,255,0.07), rgba(37,99,235,0.08));
            }
            .mail-message-flags {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 10px;
            }
            .mail-flag {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 9px;
                border-radius: 999px;
                background: rgba(255,255,255,0.06);
                color: rgba(226,232,240,0.82);
                font-size: 10px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }
            .mail-reader-shell {
                display: grid;
                gap: 16px;
            }
            .mail-reader-headline {
                display: grid;
                gap: 10px;
                padding: 16px 18px;
                border-radius: 24px;
                background: rgba(255,255,255,0.035);
                border: 1px solid rgba(255,255,255,0.08);
            }
            .mail-reader-kicker {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
                align-items: center;
            }
            .mail-reader-kicker span {
                font-size: 10px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(191,219,254,0.68);
            }
            .mail-reader-kicker strong {
                color: #fff;
                font-size: 12px;
            }
            .mail-reader-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
            }
            .mail-reader-line {
                padding: 12px;
                border-radius: 18px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
            }
            .mail-reader-body {
                border-top: 0;
                padding-top: 0;
                padding: 18px;
                border-radius: 22px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
            }
            .mail-compose-shell {
                display: grid;
                gap: 16px;
            }
            .mail-compose-headline {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                flex-wrap: wrap;
                padding: 16px 18px;
                border-radius: 24px;
                background: linear-gradient(135deg, rgba(37,99,235,0.14), rgba(255,255,255,0.04));
                border: 1px solid rgba(96,165,250,0.16);
            }
            .mail-compose-headline-copy {
                display: grid;
                gap: 6px;
                max-width: 640px;
            }
            .mail-compose-headline-copy span {
                font-size: 10px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(191,219,254,0.68);
            }
            .mail-compose-headline-copy strong {
                color: #fff;
                font-size: 22px;
            }
            .mail-compose-headline-copy p {
                margin: 0;
                color: rgba(226,232,240,0.78);
                font-size: 13px;
                line-height: 1.7;
            }
            .mail-compose-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.1fr) 280px;
                gap: 16px;
            }
            .mail-compose-form {
                padding: 18px;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.03);
            }
            .mail-compose-aside {
                display: grid;
                gap: 14px;
                align-content: start;
            }
            .mail-aside-card {
                padding: 16px;
                border-radius: 22px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.03);
                display: grid;
                gap: 8px;
            }
            .mail-aside-card span {
                font-size: 10px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(191,219,254,0.68);
            }
            .mail-aside-card strong {
                color: #fff;
                font-size: 14px;
            }
            .mail-aside-card p {
                margin: 0;
                color: rgba(226,232,240,0.72);
                font-size: 12px;
                line-height: 1.7;
            }
            .mail-connect-card {
                border-style: solid;
                border-width: 1px;
                border-color: rgba(255,255,255,0.08);
                background:
                    radial-gradient(circle at top right, rgba(96,165,250,0.16), transparent 28%),
                    linear-gradient(180deg, rgba(10,18,36,0.92), rgba(7,14,28,0.92));
                border-radius: 30px;
            }
            .mail-connect-title {
                font-size: 24px;
                color: #fff;
            }
            .mail-connect-copy {
                max-width: 560px;
                line-height: 1.8;
                color: rgba(226,232,240,0.84);
            }
            @media (max-width: 1320px) {
                .mail-command-deck {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .mail-shell {
                    grid-template-columns: minmax(240px, 290px) minmax(300px, 1fr);
                }
                .mail-panel.mail-reader-panel {
                    grid-column: 1 / -1;
                }
                .mail-compose-grid {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 920px) {
                .mail-command-deck {
                    grid-template-columns: 1fr;
                }
                .mail-connection-advisory {
                    display: grid;
                }
                .mail-shell {
                    grid-template-columns: 1fr;
                }
                .mail-reader-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function emailEscape(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatEmailDate(value, short = false) {
        if (!value) return 'No timestamp';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return emailEscape(value);
        return date.toLocaleString('en-GB', short ? {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        } : {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async function emailReadBlobAsDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
            reader.readAsDataURL(blob);
        });
    }

    if (typeof window.readBlobAsDataUrl !== 'function') {
        window.readBlobAsDataUrl = emailReadBlobAsDataUrl;
    }

    function currentRole() {
        try {
            return typeof getEffectiveUserRole === 'function'
                ? getEffectiveUserRole()
                : (typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student');
        } catch (error) {
            return 'student';
        }
    }

    function getEmailRoot() {
        return document.getElementById('page-email');
    }

    function getEmailModel() {
        return ROLE_COPY[currentRole()] || ROLE_COPY.student;
    }

    function ensureEmailRuntime() {
        return EMAIL_RUNTIME;
    }

    function applyMailBootstrapPayload(payload, preferredFolder = '') {
        const runtime = ensureEmailRuntime();
        runtime.bootstrap = payload || null;
        runtime.activeFolder = preferredFolder || payload?.lastFolderKey || runtime.activeFolder || 'inbox';
        const nextMessages = Array.isArray(payload?.folders?.[runtime.activeFolder]?.messages)
            ? payload.folders[runtime.activeFolder].messages
            : [];
        runtime.messages = nextMessages;
        if (!nextMessages.some(item => item.id === runtime.selectedMessageId)) {
            runtime.selectedMessageId = nextMessages[0]?.id || '';
            runtime.selectedMessage = null;
        }
    }

    function clearMailAutoRefresh() {
        if (EMAIL_RUNTIME.refreshIntervalId) {
            clearInterval(EMAIL_RUNTIME.refreshIntervalId);
            EMAIL_RUNTIME.refreshIntervalId = null;
        }
    }

    async function runMailAutoRefreshTick() {
        const runtime = ensureEmailRuntime();
        if (!getEmailRoot()) return;
        if (document.visibilityState === 'hidden') return;
        if (runtime.loading || runtime.composeMode) return;
        if (runtime.bootstrap?.connection?.connected !== true) return;
        const syncResult = await syncPortalMail({
            folderKey: runtime.activeFolder,
            syncScope: 'auto-refresh',
            limit: 20
        }).catch(() => null);
        if (!syncResult?.bootstrap) return;
        applyMailBootstrapPayload(syncResult.bootstrap, runtime.activeFolder);
        if (runtime.selectedMessageId) {
            runtime.selectedMessage = runtime.messages.find(item => item.id === runtime.selectedMessageId) || runtime.selectedMessage;
        }
        renderEmailPage();
    }

    function syncMailAutoRefreshState() {
        clearMailAutoRefresh();
        if (EMAIL_RUNTIME.bootstrap?.connection?.connected !== true) return;
        EMAIL_RUNTIME.refreshIntervalId = setInterval(() => {
            runMailAutoRefreshTick().catch(() => null);
        }, 45000);
    }

    function setEmailBanner(message = '', tone = 'info') {
        EMAIL_RUNTIME.bannerMessage = String(message || '').trim();
        EMAIL_RUNTIME.bannerTone = EMAIL_RUNTIME.bannerMessage ? String(tone || 'info').trim().toLowerCase() : '';
    }

    function toEmailArray(value) {
        if (Array.isArray(value)) return value;
        if (value == null) return [];
        return [value];
    }

    function isOutlookConfigured() {
        return EMAIL_RUNTIME.bootstrap?.outlookConfigured !== false;
    }

    function getMailSummarySnapshot() {
        const summary = getPortalMailSummary();
        return {
            connected: summary.connected === true,
            mailboxLabel: summary.connected
                ? String(summary.mailboxAddress || 'Outlook connected').trim()
                : 'Portal mailbox',
            unreadCount: Number(summary.unreadCount || 0),
            portalUnreadCount: Number(summary.portalUnreadCount || 0),
            outlookUnreadCount: Number(summary.outlookUnreadCount || 0),
            lastSyncLabel: summary.lastSyncAt
                ? `Synced ${formatEmailDate(summary.lastSyncAt, true)}`
                : (isOutlookConfigured() ? 'Not synced yet' : 'Outlook disabled'),
            modeLabel: summary.connected
                ? 'Hybrid mailbox'
                : (isOutlookConfigured() ? 'Portal-first workspace' : 'Portal-only workspace')
        };
    }

    function getActiveFolderMeta() {
        return getFolderEntries().find(item => item.folderKey === EMAIL_RUNTIME.activeFolder) || getFolderEntries()[0] || {
            folderKey: 'inbox',
            displayName: 'Inbox',
            unreadCount: 0,
            totalCount: 0
        };
    }

    function renderWorkspaceSignals() {
        const summary = getMailSummarySnapshot();
        const activeFolder = getActiveFolderMeta();
        const selectedMessage = getSelectedMessage();
        const isComposeMode = Boolean(EMAIL_RUNTIME.composeMode);
        const cards = [
            {
                eyebrow: 'Delivery mode',
                value: summary.modeLabel,
                copy: summary.connected
                    ? 'Portal mail and Outlook work together in one surface.'
                    : (isOutlookConfigured()
                        ? 'Portal mail is live now. Outlook can be layered on when connected.'
                        : 'Portal mail is active. Microsoft mail has not been configured on this server yet.'),
                icon: 'fa-layer-group'
            },
            {
                eyebrow: 'Unread pressure',
                value: `${summary.unreadCount}`,
                copy: `${summary.portalUnreadCount} portal / ${summary.outlookUnreadCount} Outlook`,
                icon: 'fa-signal-stream'
            },
            {
                eyebrow: 'Active lane',
                value: activeFolder.displayName,
                copy: `${activeFolder.totalCount} messages with ${activeFolder.unreadCount} unread`,
                icon: 'fa-inbox-full'
            },
            {
                eyebrow: isComposeMode ? 'Compose state' : 'Focus target',
                value: isComposeMode
                    ? (EMAIL_RUNTIME.composeMode === 'reply' ? 'Reply in progress' : 'Drafting')
                    : (selectedMessage?.subject || 'Select a message'),
                copy: isComposeMode
                    ? `${toEmailArray(EMAIL_RUNTIME.compose.attachments).length} staged attachment(s)`
                    : (selectedMessage ? 'Reader is locked on the currently opened message.' : 'Open a message or start a new compose flow.'),
                icon: isComposeMode ? 'fa-pen-nib' : 'fa-crosshairs'
            }
        ];
        return `
            <section class="mail-command-deck">
                ${cards.map(card => `
                    <article class="mail-command-card">
                        <div class="mail-command-icon"><i class="fas ${emailEscape(card.icon)}"></i></div>
                        <div class="mail-command-copy">
                            <span>${emailEscape(card.eyebrow)}</span>
                            <strong>${emailEscape(card.value)}</strong>
                            <p>${emailEscape(card.copy)}</p>
                        </div>
                    </article>
                `).join('')}
            </section>
        `;
    }

    function renderConnectionAdvisory() {
        const summary = getMailSummarySnapshot();
        const connected = EMAIL_RUNTIME.bootstrap?.connection?.connected === true;
        const configured = isOutlookConfigured();
        const statusTone = connected ? 'is-success' : (configured ? 'is-info' : 'is-warning');
        const title = connected
            ? 'Outlook layer is connected'
            : (configured ? 'Portal mail is active. Outlook is optional.' : 'Portal mail is active. Outlook is not configured on this server.');
        const copy = connected
            ? `Mailbox ${summary.mailboxLabel} is live. Portal threads and Outlook content now share the same workspace.`
            : (configured
                ? 'You can already mail portal users with attachments. Connect Outlook when you want your personal mailbox pulled into this workspace as well.'
                : 'Internal portal mail works right now, but Microsoft mail cannot connect until IT adds the Entra client, secret, redirect URI, and token encryption key in the backend environment.');
        const action = connected
            ? `<button class="lux-secondary-btn" type="button" data-mail-refresh><i class="fas fa-rotate-right"></i> Refresh mailbox</button>`
            : (configured
                ? `<button class="lux-primary-btn" type="button" data-mail-connect><i class="fab fa-microsoft"></i> Connect Outlook</button>`
                : `<button class="lux-secondary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> Use Portal Mail</button>`);
        return `
            <section class="mail-connection-advisory ${statusTone}">
                <div class="mail-connection-copy">
                    <span>${connected ? 'Outlook layer' : 'Mailbox status'}</span>
                    <strong>${emailEscape(title)}</strong>
                    <p>${emailEscape(copy)}</p>
                </div>
                <div class="mail-connection-actions">
                    ${action}
                </div>
            </section>
        `;
    }

    function getFolderEntries() {
        const folders = EMAIL_RUNTIME.bootstrap?.folders || {};
        return ['inbox', 'sentitems', 'drafts'].map(folderKey => ({
            folderKey,
            displayName: folders?.[folderKey]?.displayName || (folderKey === 'sentitems' ? 'Sent' : folderKey.charAt(0).toUpperCase() + folderKey.slice(1)),
            unreadCount: Number(folders?.[folderKey]?.unreadCount || 0),
            totalCount: Number(folders?.[folderKey]?.totalCount || 0),
            messages: Array.isArray(folders?.[folderKey]?.messages) ? folders[folderKey].messages : []
        }));
    }

    function getSelectedMessage() {
        if (EMAIL_RUNTIME.selectedMessage && EMAIL_RUNTIME.selectedMessage.id === EMAIL_RUNTIME.selectedMessageId) {
            return EMAIL_RUNTIME.selectedMessage;
        }
        const cached = EMAIL_RUNTIME.messages.find(item => item.id === EMAIL_RUNTIME.selectedMessageId) || null;
        return cached;
    }

    function escapeSrcDoc(html = '') {
        return String(html || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    }

    async function loadMailBootstrap(forceSync = false) {
        const runtime = ensureEmailRuntime();
        runtime.loading = true;
        renderEmailPage();
        try {
            const connectResult = await completePortalMailConnectFromUrl().catch(() => null);
            if (connectResult?.success) {
                setEmailBanner(connectResult.mailbox ? `Mailbox connected: ${connectResult.mailbox}` : 'Mailbox connected successfully.', 'success');
            } else if (connectResult?.error) {
                setEmailBanner(connectResult.error, 'error');
            }
            const payload = await fetchPortalMailBootstrap();
            applyMailBootstrapPayload(payload, runtime.activeFolder);
            if (payload?.outlookConfigured === false && payload?.connection?.connected !== true) {
                setEmailBanner('Portal mail is active. Outlook sync is not configured on this server yet, so Microsoft mailbox connection is currently unavailable.', 'info');
            } else if (!forceSync && !connectResult?.success) {
                setEmailBanner('', '');
            }
            if (forceSync && payload?.connection?.connected) {
                const syncResult = await syncPortalMail({ folderKey: runtime.activeFolder, syncScope: 'page-open', limit: 20 }).catch(() => null);
                if (syncResult?.bootstrap) {
                    applyMailBootstrapPayload(syncResult.bootstrap, runtime.activeFolder);
                }
            }
        } catch (error) {
            setEmailBanner(error?.message || 'Email workspace could not be loaded.', 'error');
        } finally {
            runtime.loading = false;
            syncMailAutoRefreshState();
            renderEmailPage();
        }
    }

    async function loadFolder(folderKey, options = {}) {
        const runtime = ensureEmailRuntime();
        runtime.loading = true;
        runtime.activeFolder = folderKey || 'inbox';
        runtime.search = String(options.search ?? runtime.search ?? '').trim();
        runtime.unreadOnly = options.unreadOnly === true ? true : (options.keepUnread ? runtime.unreadOnly : false);
        renderEmailPage();
        try {
            const payload = await fetchPortalMailMessages({
                folder: runtime.activeFolder,
                search: runtime.search,
                unreadOnly: runtime.unreadOnly,
                limit: 25
            });
            runtime.messages = Array.isArray(payload?.messages) ? payload.messages : [];
            if (!runtime.messages.some(item => item.id === runtime.selectedMessageId)) {
                runtime.selectedMessageId = runtime.messages[0]?.id || '';
                runtime.selectedMessage = null;
            }
            if (runtime.bootstrap?.folders && payload?.folderKey && !runtime.search) {
                runtime.bootstrap.folders[payload.folderKey] = {
                    ...(runtime.bootstrap.folders[payload.folderKey] || {}),
                    displayName: payload.displayName || runtime.bootstrap.folders[payload.folderKey]?.displayName || '',
                    unreadCount: Number(payload.unreadCount || 0),
                    totalCount: Number(payload.totalCount || runtime.messages.length),
                    messages: runtime.messages
                };
                runtime.bootstrap.summary = getPortalMailSummary();
            }
        } catch (error) {
            setEmailBanner(error?.message || 'Messages could not be loaded.', 'error');
        } finally {
            runtime.loading = false;
            renderEmailPage();
        }
    }

    async function openMessage(messageId) {
        const runtime = ensureEmailRuntime();
        runtime.selectedMessageId = String(messageId || '').trim();
        runtime.composeMode = '';
        renderEmailPage();
        if (!runtime.selectedMessageId) return;
        try {
            const message = await fetchPortalMailMessage(runtime.selectedMessageId);
            runtime.selectedMessage = message || null;
            if (message?.folderKey && runtime.bootstrap?.folders?.[message.folderKey]) {
                const messages = Array.isArray(runtime.bootstrap.folders[message.folderKey].messages)
                    ? runtime.bootstrap.folders[message.folderKey].messages.slice()
                    : [];
                const index = messages.findIndex(item => item.id === message.id);
                if (index >= 0) messages[index] = { ...messages[index], ...message };
                runtime.bootstrap.folders[message.folderKey].messages = messages;
            }
            if (message && message.isRead === false) {
                await updatePortalMailReadState(message.id, true, message.folderKey || runtime.activeFolder).catch(() => null);
                message.isRead = true;
                loadFolder(message.folderKey || runtime.activeFolder, { keepUnread: true }).catch(() => null);
            }
        } catch (error) {
            setEmailBanner(error?.message || 'Message could not be opened.', 'error');
        } finally {
            renderEmailPage();
        }
    }

    function openCompose(mode = 'new') {
        const runtime = ensureEmailRuntime();
        const currentMessage = getSelectedMessage();
        runtime.composeMode = mode;
        if (mode === 'reply' && currentMessage) {
            const replyTo = currentMessage.from?.address || '';
            runtime.compose = {
                to: replyTo,
                cc: '',
                subject: currentMessage.subject && /^re:/i.test(currentMessage.subject) ? currentMessage.subject : `Re: ${currentMessage.subject || '(No subject)'}`,
                body: '',
                attachments: []
            };
        } else {
            runtime.compose = {
                to: '',
                cc: '',
                subject: '',
                body: '',
                attachments: []
            };
        }
        renderEmailPage();
    }

    async function submitComposeForm() {
        const runtime = ensureEmailRuntime();
        try {
            if (runtime.composeMode === 'reply' && runtime.selectedMessageId) {
                const replyResult = await replyPortalMailMessage(runtime.selectedMessageId, {
                    body: runtime.compose.body,
                    attachments: runtime.compose.attachments
                });
                setEmailBanner(replyResult?.mirroredPortalToOutlook ? 'Reply sent and mirrored into Outlook.' : 'Reply sent successfully.', 'success');
            } else {
                const sendResult = await sendPortalMailMessage({
                    to: runtime.compose.to,
                    cc: runtime.compose.cc,
                    subject: runtime.compose.subject,
                    body: runtime.compose.body,
                    attachments: runtime.compose.attachments
                });
                setEmailBanner(sendResult?.mirroredPortalToOutlook ? 'Message sent and mirrored into Outlook.' : 'Message sent successfully.', 'success');
            }
            runtime.composeMode = '';
            await loadFolder('sentitems', { keepUnread: true });
        } catch (error) {
            setEmailBanner(error?.message || 'Message could not be sent.', 'error');
            renderEmailPage();
        }
    }

    function renderFolderRail() {
        const runtime = ensureEmailRuntime();
        return `
            <div class="mail-panel">
                    <div class="mail-panel-head">
                        <div class="mail-panel-title">
                            <span>Folders</span>
                            <strong>${emailEscape(runtime.bootstrap?.connection?.mailboxAddress || 'Portal Mailbox')}</strong>
                        </div>
                    </div>
                <div class="mail-folder-list">
                    ${getFolderEntries().map(folder => `
                        <button class="mail-folder-btn${runtime.activeFolder === folder.folderKey ? ' is-active' : ''}" type="button" data-mail-folder="${emailEscape(folder.folderKey)}">
                            <div class="mail-folder-copy">
                                <strong>${emailEscape(folder.displayName)}</strong>
                                <span>${folder.totalCount} messages</span>
                            </div>
                            <span class="mail-folder-count">${folder.unreadCount}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderMessageList() {
        const runtime = ensureEmailRuntime();
        return `
            <div class="mail-panel">
                <div class="mail-panel-head">
                    <div class="mail-panel-title">
                        <span>Message list</span>
                        <strong>${emailEscape(getFolderEntries().find(item => item.folderKey === runtime.activeFolder)?.displayName || 'Inbox')}</strong>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-mail-refresh><i class="fas fa-rotate-right"></i> Refresh</button>
                </div>
                <div class="mail-list-toolbar">
                    <div class="mail-search-row">
                        <input id="mail-search-input" type="search" value="${emailEscape(runtime.search)}" placeholder="Search Outlook messages, senders, and subjects">
                        <button class="lux-secondary-btn" type="button" data-mail-search><i class="fas fa-magnifying-glass"></i> Search</button>
                    </div>
                    <label class="mail-toggle">
                        <input id="mail-unread-toggle" type="checkbox" ${runtime.unreadOnly ? 'checked' : ''}>
                        <span>Unread only</span>
                    </label>
                </div>
                <div class="mail-message-list">
                    ${runtime.loading ? '<div class="mail-list-empty"><i class="fas fa-circle-notch fa-spin mail-empty-icon-sm"></i><strong>Refreshing mailbox</strong><span>Pulling the latest Outlook messages into the portal.</span></div>' : ''}
                    ${!runtime.loading && !runtime.messages.length ? '<div class="mail-list-empty"><i class="fas fa-envelope-open-text mail-empty-icon-sm"></i><strong>No messages here yet</strong><span>Change filters, search again, or refresh to pull fresh mail from Outlook.</span></div>' : ''}
                    ${!runtime.loading ? runtime.messages.map(message => `
                        <button class="mail-message-card${runtime.selectedMessageId === message.id ? ' is-active' : ''}${message.isRead ? '' : ' is-unread'}" type="button" data-mail-open="${emailEscape(message.id)}">
                            <div class="mail-message-top">
                                <div class="mail-message-from">
                                    <strong>${emailEscape(message.from?.name || message.from?.address || 'Unknown sender')}</strong>
                                    <span>${emailEscape(message.from?.address || '')}</span>
                                </div>
                                <div class="mail-message-time">${emailEscape(formatEmailDate(message.receivedAt || message.sentAt, true))}</div>
                            </div>
                            <div class="mail-message-subject">${emailEscape(message.subject || '(No subject)')}</div>
                            <div class="mail-message-snippet">${emailEscape(message.snippet || 'Open to load the full Outlook body.')}</div>
                        </button>
                    `).join('') : ''}
                </div>
            </div>
        `;
    }

    function renderReaderPanel() {
        const runtime = ensureEmailRuntime();
        const message = getSelectedMessage();
        if (runtime.composeMode) {
            return `
                <div class="mail-panel mail-reader-panel">
                    <div class="mail-panel-head">
                        <div class="mail-panel-title">
                            <span>${runtime.composeMode === 'reply' ? 'Reply' : 'Compose'}</span>
                            <strong>${runtime.composeMode === 'reply' ? 'Continue the conversation' : 'Write a new Outlook message'}</strong>
                        </div>
                        <button class="lux-ghost-btn" type="button" data-mail-compose-cancel><i class="fas fa-xmark"></i> Close</button>
                    </div>
                    <form class="mail-compose-form" id="mail-compose-form">
                        <input type="text" name="to" placeholder="To (portal email or Outlook address)" value="${emailEscape(runtime.compose.to)}" ${runtime.composeMode === 'reply' ? 'readonly' : ''}>
                        <input type="text" name="cc" placeholder="Cc" value="${emailEscape(runtime.compose.cc)}">
                        <input type="text" name="subject" placeholder="Subject" value="${emailEscape(runtime.compose.subject)}" ${runtime.composeMode === 'reply' ? 'readonly' : ''}>
                        <textarea name="body" placeholder="${runtime.composeMode === 'reply' ? 'Write your reply comment' : 'Write your Outlook message in rich text / HTML'}">${emailEscape(runtime.compose.body)}</textarea>
                        <div class="mail-compose-attachments">
                            <div class="mail-panel-title">
                                <span>Attachments</span>
                                <strong>Files for portal recipients</strong>
                            </div>
                            <div class="mail-compose-actions mail-compose-actions--flush">
                                <button class="lux-secondary-btn" type="button" data-mail-attach><i class="fas fa-paperclip"></i> Add Files</button>
                            </div>
                            <input id="mail-compose-file-input" type="file" multiple hidden>
                            <div class="mail-compose-attachment-list">
                                ${Array.isArray(runtime.compose.attachments) && runtime.compose.attachments.length ? runtime.compose.attachments.map((attachment, index) => `
                                    <div class="mail-compose-attachment">
                                        <div>
                                            <strong>${emailEscape(attachment.name || 'Attachment')}</strong>
                                            <span>${emailEscape(attachment.type || 'File')} • ${Number(attachment.size || 0)} bytes</span>
                                        </div>
                                        <button class="lux-ghost-btn" type="button" data-mail-remove-attachment="${index}"><i class="fas fa-trash"></i> Remove</button>
                                    </div>
                                `).join('') : '<div class="mail-list-empty mail-list-empty--compact"><span>Portal-to-portal mail supports uploaded files. Outlook external send still uses basic send/reply only.</span></div>'}
                            </div>
                        </div>
                        <div class="mail-compose-actions">
                            <button class="lux-primary-btn" type="submit"><i class="fas fa-paper-plane"></i> ${runtime.composeMode === 'reply' ? 'Send Reply' : 'Send Message'}</button>
                            <button class="lux-secondary-btn" type="button" data-mail-compose-cancel>Cancel</button>
                        </div>
                    </form>
                </div>
            `;
        }
        if (!message) {
            return `
                <div class="mail-panel mail-reader-panel">
                    <div class="mail-reader-empty">
                        <i class="fas fa-envelope-circle-check mail-empty-icon-md"></i>
                        <strong>Select a message</strong>
                        <span>Open any message from the list to load its full Outlook body, attachments, and reply tools here.</span>
                        <button class="lux-primary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> New Message</button>
                    </div>
                </div>
            `;
        }
        const attachmentHtml = Array.isArray(message.attachments) && message.attachments.length
            ? `
                <div class="mail-panel-title mail-panel-title--mt-18">
                    <span>Attachments</span>
                    <strong>Received files</strong>
                </div>
                <div class="mail-attachment-list">
                    ${message.attachments.map(attachment => `
                        <a class="mail-attachment-link" href="${emailEscape(attachment.downloadUrl || '#')}" target="_blank" rel="noopener noreferrer">
                            <div>
                                <strong>${emailEscape(attachment.name || 'Attachment')}</strong>
                                <span>${emailEscape(attachment.contentType || 'File')}</span>
                            </div>
                            <span>${Math.max(0, Number(attachment.size || 0))} bytes</span>
                        </a>
                    `).join('')}
                </div>
            `
            : '';
        const bodyMarkup = message.bodyType === 'html' && message.body
            ? `<iframe sandbox="" srcdoc="${escapeSrcDoc(message.body)}"></iframe>`
            : `<div>${emailEscape(message.body || message.snippet || 'No body content available.')}</div>`;
        return `
            <div class="mail-panel mail-reader-panel">
                <div class="mail-reader-header">
                    <div class="mail-panel-title">
                        <span>${emailEscape(message.folderKey || runtime.activeFolder || 'mail')}</span>
                        <strong>${emailEscape(message.subject || '(No subject)')}</strong>
                    </div>
                    <h3>${emailEscape(message.subject || '(No subject)')}</h3>
                </div>
                <div class="mail-reader-grid">
                    <div class="mail-reader-line">
                        <strong>From</strong>
                        <span>${emailEscape(message.from?.name || message.from?.address || 'Unknown sender')} ${message.from?.address ? `&lt;${emailEscape(message.from.address)}&gt;` : ''}</span>
                    </div>
                    <div class="mail-reader-line">
                        <strong>To</strong>
                        <span>${emailEscape((message.toRecipients || []).map(item => item.name || item.address).filter(Boolean).join(', ') || 'No recipients')}</span>
                    </div>
                    <div class="mail-reader-line">
                        <strong>Received</strong>
                        <span>${emailEscape(formatEmailDate(message.receivedAt || message.sentAt))}</span>
                    </div>
                </div>
                <div class="mail-reader-actions">
                    <button class="lux-primary-btn" type="button" data-mail-compose="reply"><i class="fas fa-reply"></i> Reply</button>
                    <button class="lux-secondary-btn" type="button" data-mail-mark="${message.isRead ? 'unread' : 'read'}"><i class="fas fa-envelope${message.isRead ? '' : '-open'}"></i> Mark ${message.isRead ? 'Unread' : 'Read'}</button>
                    ${message.webLink ? `<a class="lux-ghost-btn" href="${emailEscape(message.webLink)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-up-right-from-square"></i> Open in Outlook</a>` : ''}
                </div>
                <div class="mail-reader-body">${bodyMarkup}</div>
                ${attachmentHtml}
            </div>
        `;
    }

    function renderConnectedWorkspace() {
        return `
            <div class="mail-shell">
                ${renderFolderRail()}
                ${renderMessageList()}
                ${renderReaderPanel()}
            </div>
        `;
    }

    function renderFolderRailUpgraded() {
        const runtime = ensureEmailRuntime();
        const summary = getMailSummarySnapshot();
        const configured = isOutlookConfigured();
        return `
            <div class="mail-panel mail-rail-panel">
                <div class="mail-account-chip">
                    <div class="mail-account-chip-top">
                        <div class="mail-panel-title">
                            <span>Mailbox owner</span>
                            <strong>${emailEscape(summary.mailboxLabel)}</strong>
                        </div>
                        <div class="mail-account-badge">
                            <i class="fas ${summary.connected ? 'fa-bolt' : 'fa-envelope'}"></i>
                            ${emailEscape(summary.modeLabel)}
                        </div>
                    </div>
                    <p>
                        ${configured
                            ? (summary.connected
                                ? 'Hybrid mode is live. Portal threads and Outlook traffic now share one control surface.'
                                : 'Portal mail is fully active. Add Outlook only when you want your personal mailbox layered into this workspace.')
                            : 'Portal mail is fully active, but Microsoft mail has not been configured on this server yet.'}
                    </p>
                    <div class="mail-compose-actions mail-compose-actions--flush">
                        <button class="lux-primary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> New thread</button>
                        ${configured && !summary.connected ? `<button class="lux-secondary-btn" type="button" data-mail-connect><i class="fab fa-microsoft"></i> Add Outlook</button>` : ''}
                    </div>
                </div>
                <div class="mail-panel-head">
                    <div class="mail-panel-title">
                        <span>Folder rail</span>
                        <strong>Traffic lanes</strong>
                    </div>
                </div>
                <div class="mail-folder-list">
                    ${getFolderEntries().map(folder => `
                        <button class="mail-folder-btn${runtime.activeFolder === folder.folderKey ? ' is-active' : ''}" type="button" data-mail-folder="${emailEscape(folder.folderKey)}">
                            <div class="mail-folder-copy">
                                <strong>${emailEscape(folder.displayName)}</strong>
                                <span>${folder.totalCount} messages</span>
                            </div>
                            <span class="mail-folder-count">${folder.unreadCount}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="mail-side-note">
                    <strong>Workspace note</strong>
                    <p>Portal delivery already supports internal recipients and file attachments. Outlook remains optional and only becomes active after Microsoft mail is configured and connected.</p>
                </div>
            </div>
        `;
    }

    function renderMessageListUpgraded() {
        const runtime = ensureEmailRuntime();
        const activeFolder = getActiveFolderMeta();
        const summary = getMailSummarySnapshot();
        const connected = runtime.bootstrap?.connection?.connected === true;
        return `
            <div class="mail-panel mail-list-panel">
                <div class="mail-panel-head">
                    <div class="mail-panel-title">
                        <span>Message field</span>
                        <strong>${emailEscape(activeFolder.displayName || 'Inbox')}</strong>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-mail-refresh><i class="fas fa-rotate-right"></i> Refresh</button>
                </div>
                <div class="mail-list-toolbar">
                    <div class="mail-list-meta">
                        <div>
                            <strong>${activeFolder.totalCount} messages</strong>
                            <span>${activeFolder.unreadCount} unread in this lane</span>
                        </div>
                        <div class="mail-chip-row">
                            <span class="mail-chip"><i class="fas fa-envelope-open-text"></i> ${summary.portalUnreadCount} portal unread</span>
                            <span class="mail-chip"><i class="fas fa-cloud"></i> ${connected ? `${summary.outlookUnreadCount} Outlook unread` : (isOutlookConfigured() ? 'Outlook optional' : 'Outlook unavailable')}</span>
                        </div>
                    </div>
                    <div class="mail-search-row">
                        <input id="mail-search-input" type="search" value="${emailEscape(runtime.search)}" placeholder="Search senders, subjects, snippets, or portal threads">
                        <button class="lux-secondary-btn" type="button" data-mail-search><i class="fas fa-magnifying-glass"></i> Search</button>
                    </div>
                    <div class="mail-chip-row">
                        <label class="mail-toggle">
                            <input id="mail-unread-toggle" type="checkbox" ${runtime.unreadOnly ? 'checked' : ''}>
                            <span>Unread only</span>
                        </label>
                        <span class="mail-chip"><i class="fas fa-layer-group"></i> ${connected ? 'Hybrid feed' : 'Portal-first feed'}</span>
                        <span class="mail-chip"><i class="fas fa-clock"></i> ${emailEscape(summary.lastSyncLabel)}</span>
                    </div>
                </div>
                <div class="mail-message-list">
                    ${runtime.loading ? '<div class="mail-list-empty"><i class="fas fa-circle-notch fa-spin mail-empty-icon-sm"></i><strong>Refreshing mailbox field</strong><span>Pulling the latest portal and Outlook traffic into the workspace.</span></div>' : ''}
                    ${!runtime.loading && !runtime.messages.length ? `<div class="mail-list-empty"><i class="fas fa-envelope-open-text mail-empty-icon-sm"></i><strong>No messages in ${emailEscape(activeFolder.displayName)}</strong><span>${runtime.search ? 'Search came back empty. Change the query or drop the unread filter.' : 'This lane is clear. Compose a new thread or refresh when new mail arrives.'}</span></div>` : ''}
                    ${!runtime.loading ? runtime.messages.map(message => `
                        <button class="mail-message-card${runtime.selectedMessageId === message.id ? ' is-active' : ''}${message.isRead ? '' : ' is-unread'}" type="button" data-mail-open="${emailEscape(message.id)}">
                            <div class="mail-message-top">
                                <div class="mail-message-from">
                                    <strong>${emailEscape(message.from?.name || message.from?.address || 'Unknown sender')}</strong>
                                    <span>${emailEscape(message.from?.address || '')}</span>
                                </div>
                                <div class="mail-message-time">${emailEscape(formatEmailDate(message.receivedAt || message.sentAt, true))}</div>
                            </div>
                            <div class="mail-message-subject">${emailEscape(message.subject || '(No subject)')}</div>
                            <div class="mail-message-snippet">${emailEscape(message.snippet || 'Open to load the full body.')}</div>
                            <div class="mail-message-flags">
                                ${message.isRead ? '' : '<span class="mail-flag"><i class="fas fa-circle"></i> unread</span>'}
                                ${message.attachments?.length ? `<span class="mail-flag"><i class="fas fa-paperclip"></i> ${message.attachments.length} attachment${message.attachments.length === 1 ? '' : 's'}</span>` : ''}
                                <span class="mail-flag"><i class="fas fa-folder-open"></i> ${emailEscape(message.folderKey || runtime.activeFolder)}</span>
                            </div>
                        </button>
                    `).join('') : ''}
                </div>
            </div>
        `;
    }

    function renderReaderPanelUpgraded() {
        const runtime = ensureEmailRuntime();
        const message = getSelectedMessage();
        const configured = isOutlookConfigured();
        if (runtime.composeMode) {
            return `
                <div class="mail-panel mail-reader-panel">
                    <div class="mail-compose-shell">
                        <div class="mail-compose-headline">
                            <div class="mail-compose-headline-copy">
                                <span>${runtime.composeMode === 'reply' ? 'Reply studio' : 'Compose studio'}</span>
                                <strong>${runtime.composeMode === 'reply' ? 'Continue the conversation with precision' : 'Write without leaving the portal'}</strong>
                                <p>
                                    ${runtime.composeMode === 'reply'
                                        ? 'Reply inside the current communication lane. Portal recipients keep file support and instant internal delivery.'
                                        : (configured
                                            ? 'One compose surface for internal portal mail and optional Outlook forwarding when that layer is connected.'
                                            : 'Portal delivery is ready now. Microsoft mail is not configured on this server, so keep this flow focused on portal recipients.')}
                                </p>
                            </div>
                            <button class="lux-ghost-btn" type="button" data-mail-compose-cancel><i class="fas fa-xmark"></i> Close</button>
                        </div>
                        <div class="mail-compose-grid">
                            <form class="mail-compose-form" id="mail-compose-form">
                                <input type="text" name="to" placeholder="To (portal email or Outlook address)" value="${emailEscape(runtime.compose.to)}" ${runtime.composeMode === 'reply' ? 'readonly' : ''}>
                                <input type="text" name="cc" placeholder="Cc" value="${emailEscape(runtime.compose.cc)}">
                                <input type="text" name="subject" placeholder="Subject" value="${emailEscape(runtime.compose.subject)}" ${runtime.composeMode === 'reply' ? 'readonly' : ''}>
                                <textarea name="body" placeholder="${runtime.composeMode === 'reply' ? 'Write your reply comment' : 'Write your message body'}">${emailEscape(runtime.compose.body)}</textarea>
                                <div class="mail-compose-attachments">
                                    <div class="mail-panel-title">
                                        <span>Attachments</span>
                                        <strong>Portal delivery files</strong>
                                    </div>
                                    <div class="mail-compose-actions mail-compose-actions--flush">
                                        <button class="lux-secondary-btn" type="button" data-mail-attach><i class="fas fa-paperclip"></i> Add Files</button>
                                    </div>
                                    <input id="mail-compose-file-input" type="file" multiple hidden>
                                    <div class="mail-compose-attachment-list">
                                        ${Array.isArray(runtime.compose.attachments) && runtime.compose.attachments.length ? runtime.compose.attachments.map((attachment, index) => `
                                            <div class="mail-compose-attachment">
                                                <div>
                                                    <strong>${emailEscape(attachment.name || 'Attachment')}</strong>
                                                    <span>${emailEscape(attachment.type || 'File')} · ${Number(attachment.size || 0)} bytes</span>
                                                </div>
                                                <button class="lux-ghost-btn" type="button" data-mail-remove-attachment="${index}"><i class="fas fa-trash"></i> Remove</button>
                                            </div>
                                        `).join('') : '<div class="mail-list-empty mail-list-empty--compact"><span>Stage documents, screenshots, or forms here. Internal portal recipients keep the files inside the portal workflow.</span></div>'}
                                    </div>
                                </div>
                                <div class="mail-compose-actions">
                                    <button class="lux-primary-btn" type="submit"><i class="fas fa-paper-plane"></i> ${runtime.composeMode === 'reply' ? 'Send Reply' : 'Send Message'}</button>
                                    <button class="lux-secondary-btn" type="button" data-mail-compose-cancel>Cancel</button>
                                </div>
                            </form>
                            <aside class="mail-compose-aside">
                                <div class="mail-aside-card">
                                    <span>Delivery lane</span>
                                    <strong>${configured ? 'Portal + Outlook aware' : 'Portal-only right now'}</strong>
                                    <p>${configured ? 'Portal users receive messages internally. External addresses only use Outlook when your mailbox is connected.' : 'Microsoft mail is not configured, so this compose flow should target portal users until IT adds the Entra configuration.'}</p>
                                </div>
                                <div class="mail-aside-card">
                                    <span>Attachment rule</span>
                                    <strong>Files stay strongest internally</strong>
                                    <p>Portal recipients can receive uploaded files immediately. External Microsoft attachment forwarding still depends on the Graph attachment layer.</p>
                                </div>
                                <div class="mail-aside-card">
                                    <span>Current draft</span>
                                    <strong>${toEmailArray(runtime.compose.attachments).length} file(s) staged</strong>
                                    <p>${runtime.compose.to ? `Primary recipients: ${runtime.compose.to}` : 'Add recipients to route this draft into the correct communication lane.'}</p>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            `;
        }
        if (!message) {
            return `
                <div class="mail-panel mail-reader-panel">
                    <div class="mail-reader-empty">
                        <i class="fas fa-envelope-circle-check mail-empty-icon-md"></i>
                        <strong>Reader is on standby</strong>
                        <span>Open a message from the field on the left or start a new thread. The reader will load the full body, metadata, and attachments here.</span>
                        <button class="lux-primary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> New Message</button>
                    </div>
                </div>
            `;
        }
        const attachmentHtml = Array.isArray(message.attachments) && message.attachments.length
            ? `
                <div class="mail-panel-title mail-panel-title--mt-18">
                    <span>Attachments</span>
                    <strong>Received files</strong>
                </div>
                <div class="mail-attachment-list">
                    ${message.attachments.map(attachment => `
                        <a class="mail-attachment-link" href="${emailEscape(attachment.downloadUrl || '#')}" target="_blank" rel="noopener noreferrer">
                            <div>
                                <strong>${emailEscape(attachment.name || 'Attachment')}</strong>
                                <span>${emailEscape(attachment.contentType || attachment.type || 'File')}</span>
                            </div>
                            <span>${Math.max(0, Number(attachment.size || 0))} bytes</span>
                        </a>
                    `).join('')}
                </div>
            `
            : '';
        const bodyMarkup = message.bodyType === 'html' && message.body
            ? `<iframe sandbox="" srcdoc="${escapeSrcDoc(message.body)}"></iframe>`
            : `<div>${emailEscape(message.body || message.snippet || 'No body content available.')}</div>`;
        return `
            <div class="mail-panel mail-reader-panel">
                <div class="mail-reader-shell">
                    <div class="mail-reader-headline">
                        <div class="mail-reader-kicker">
                            <span>${emailEscape(message.folderKey || runtime.activeFolder || 'mail')}</span>
                            <strong>${message.isRead ? 'Read' : 'Unread'}</strong>
                        </div>
                        <div class="mail-panel-title">
                            <span>Reader deck</span>
                            <strong>${emailEscape(message.subject || '(No subject)')}</strong>
                        </div>
                        <h3 class="mail-reader-title">${emailEscape(message.subject || '(No subject)')}</h3>
                    </div>
                    <div class="mail-reader-grid">
                        <div class="mail-reader-line">
                            <strong>From</strong>
                            <span>${emailEscape(message.from?.name || message.from?.address || 'Unknown sender')} ${message.from?.address ? `&lt;${emailEscape(message.from.address)}&gt;` : ''}</span>
                        </div>
                        <div class="mail-reader-line">
                            <strong>To</strong>
                            <span>${emailEscape((message.toRecipients || []).map(item => item.name || item.address).filter(Boolean).join(', ') || 'No recipients')}</span>
                        </div>
                        <div class="mail-reader-line">
                            <strong>Received</strong>
                            <span>${emailEscape(formatEmailDate(message.receivedAt || message.sentAt))}</span>
                        </div>
                    </div>
                    <div class="mail-reader-actions">
                        <button class="lux-primary-btn" type="button" data-mail-compose="reply"><i class="fas fa-reply"></i> Reply</button>
                        <button class="lux-secondary-btn" type="button" data-mail-mark="${message.isRead ? 'unread' : 'read'}"><i class="fas fa-envelope${message.isRead ? '' : '-open'}"></i> Mark ${message.isRead ? 'Unread' : 'Read'}</button>
                        ${message.webLink ? `<a class="lux-ghost-btn" href="${emailEscape(message.webLink)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-up-right-from-square"></i> Open in Outlook</a>` : ''}
                    </div>
                    <div class="mail-reader-body">${bodyMarkup}</div>
                    ${attachmentHtml}
                </div>
            </div>
        `;
    }

    function renderConnectedWorkspaceUpgraded() {
        return `
            ${renderConnectionAdvisory()}
            <div class="mail-shell">
                ${renderFolderRailUpgraded()}
                ${renderMessageListUpgraded()}
                ${renderReaderPanelUpgraded()}
            </div>
        `;
    }

    function renderDisconnectedWorkspace() {
        return `
            <div class="mail-connect-card">
                <i class="fas fa-envelope-circle-check mail-empty-icon-lg"></i>
                <strong class="mail-connect-title">Connect your Outlook mailbox</strong>
                <span class="mail-connect-copy">
                    Use the built-in portal mailbox immediately for account-to-account email with file attachments. If you also want your personal Outlook inbox inside the portal, connect Outlook as an optional second layer.
                </span>
                <div class="mail-pill-row mail-pill-row--center">
                    <span class="mail-pill"><i class="fas fa-envelope"></i> Portal mail works without Outlook</span>
                    <span class="mail-pill"><i class="fas fa-paperclip"></i> File attachments for portal recipients</span>
                    <span class="mail-pill"><i class="fas fa-bolt"></i> Optional Outlook sync on top</span>
                </div>
                <div class="mail-actions mail-actions--center">
                    <button class="lux-primary-btn" type="button" data-mail-connect><i class="fab fa-microsoft"></i> Connect Outlook</button>
                </div>
            </div>
        `;
    }

    function renderEmailPage() {
        ensureEmailStyles();
        const root = getEmailRoot();
        if (!root) return;
        const runtime = ensureEmailRuntime();
        const model = getEmailModel();
        const summary = getMailSummarySnapshot();
        const connected = runtime.bootstrap?.connection?.connected === true;
        root.innerHTML = `
            <section class="mail-workspace">
                <section class="mail-hero">
                    <div class="mail-hero-top">
                        <div class="mail-hero-copy">
                            <div class="mail-eyebrow">${emailEscape(model.eyebrow)}</div>
                            <h1 class="mail-title">${emailEscape(model.title)}</h1>
                            <p class="mail-copy">${emailEscape(model.copy)}</p>
                            <div class="mail-pill-row">
                                <span class="mail-pill"><i class="fas fa-envelope"></i> ${emailEscape(summary.mailboxLabel)}</span>
                                <span class="mail-pill"><i class="fas fa-circle-info"></i> ${summary.unreadCount} unread across all folders</span>
                                <span class="mail-pill"><i class="fas fa-clock-rotate-left"></i> ${emailEscape(summary.lastSyncLabel)}</span>
                            </div>
                            ${runtime.bootstrap?.impersonationNotice ? `<div class="mail-banner is-info mail-banner--mt-14"><i class="fas fa-user-shield"></i><div>${emailEscape(runtime.bootstrap.impersonationNotice)}</div></div>` : ''}
                        </div>
                        <div class="mail-actions">
                            ${connected ? `
                                <button class="lux-primary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> Compose</button>
                                <button class="lux-secondary-btn" type="button" data-mail-refresh><i class="fas fa-rotate-right"></i> Sync</button>
                                <button class="lux-ghost-btn" type="button" data-mail-disconnect><i class="fas fa-link-slash"></i> Disconnect</button>
                            ` : `
                                <button class="lux-primary-btn" type="button" data-mail-compose="new"><i class="fas fa-pen"></i> Compose</button>
                                ${isOutlookConfigured()
                                    ? '<button class="lux-primary-btn" type="button" data-mail-connect><i class="fab fa-microsoft"></i> Connect Outlook</button>'
                                    : '<button class="lux-secondary-btn" type="button" data-mail-refresh><i class="fas fa-shield-halved"></i> Portal Mail Active</button>'}
                            `}
                        </div>
                    </div>
                </section>
                ${renderWorkspaceSignals()}
                ${runtime.bannerMessage ? `<div class="mail-banner is-${emailEscape(runtime.bannerTone || 'info')}"><i class="fas fa-circle-info"></i><div>${emailEscape(runtime.bannerMessage)}</div></div>` : ''}
                ${renderConnectedWorkspaceUpgraded()}
            </section>
        `;
    }

    async function handleEmailRootClick(event) {
        const connectButton = event.target.closest('[data-mail-connect]');
        if (connectButton) {
            event.preventDefault();
            if (!isOutlookConfigured()) {
                setEmailBanner('Microsoft mail is not configured on this server yet. Portal mail is already active, but IT still needs to add the Entra client, secret, redirect URI, and token encryption key before Outlook can connect.', 'info');
                renderEmailPage();
                return;
            }
            try {
                await beginPortalMailConnect(window.location.href);
            } catch (error) {
                setEmailBanner(error?.message || 'Outlook mailbox connection could not be started.', 'error');
                renderEmailPage();
            }
            return;
        }
        const refreshButton = event.target.closest('[data-mail-refresh]');
        if (refreshButton) {
            event.preventDefault();
            await loadMailBootstrap(true);
            return;
        }
        const searchButton = event.target.closest('[data-mail-search]');
        if (searchButton) {
            event.preventDefault();
            const input = document.getElementById('mail-search-input');
            EMAIL_RUNTIME.search = String(input?.value || '').trim();
            await loadFolder(EMAIL_RUNTIME.activeFolder, {
                search: EMAIL_RUNTIME.search,
                keepUnread: true
            });
            return;
        }
        const folderButton = event.target.closest('[data-mail-folder]');
        if (folderButton) {
            event.preventDefault();
            await loadFolder(folderButton.getAttribute('data-mail-folder'), { keepUnread: true });
            return;
        }
        const openButton = event.target.closest('[data-mail-open]');
        if (openButton) {
            event.preventDefault();
            await openMessage(openButton.getAttribute('data-mail-open'));
            return;
        }
        const composeButton = event.target.closest('[data-mail-compose]');
        if (composeButton) {
            event.preventDefault();
            openCompose(composeButton.getAttribute('data-mail-compose') || 'new');
            return;
        }
        const attachButton = event.target.closest('[data-mail-attach]');
        if (attachButton) {
            event.preventDefault();
            const input = document.getElementById('mail-compose-file-input');
            if (input) input.click();
            return;
        }
        const removeAttachmentButton = event.target.closest('[data-mail-remove-attachment]');
        if (removeAttachmentButton) {
            event.preventDefault();
            const index = Number(removeAttachmentButton.getAttribute('data-mail-remove-attachment'));
            if (Number.isFinite(index)) {
                EMAIL_RUNTIME.compose.attachments = toEmailArray(EMAIL_RUNTIME.compose.attachments).filter((_, attachmentIndex) => attachmentIndex !== index);
                renderEmailPage();
            }
            return;
        }
        const cancelComposeButton = event.target.closest('[data-mail-compose-cancel]');
        if (cancelComposeButton) {
            event.preventDefault();
            EMAIL_RUNTIME.composeMode = '';
            renderEmailPage();
            return;
        }
        const markButton = event.target.closest('[data-mail-mark]');
        if (markButton) {
            event.preventDefault();
            const message = getSelectedMessage();
            if (!message?.id) return;
            const nextReadState = markButton.getAttribute('data-mail-mark') === 'read';
            try {
                await updatePortalMailReadState(message.id, nextReadState, message.folderKey || EMAIL_RUNTIME.activeFolder);
                setEmailBanner(`Message marked as ${nextReadState ? 'read' : 'unread'}.`, 'success');
                await loadFolder(message.folderKey || EMAIL_RUNTIME.activeFolder, { keepUnread: true });
            } catch (error) {
                setEmailBanner(error?.message || 'Read state could not be updated.', 'error');
                renderEmailPage();
            }
            return;
        }
        const disconnectButton = event.target.closest('[data-mail-disconnect]');
        if (disconnectButton) {
            event.preventDefault();
            if (!window.confirm('Disconnect Outlook from this portal account?')) return;
            try {
                await disconnectPortalMailConnection();
                EMAIL_RUNTIME.bootstrap = null;
                EMAIL_RUNTIME.messages = [];
                EMAIL_RUNTIME.selectedMessageId = '';
                EMAIL_RUNTIME.selectedMessage = null;
                setEmailBanner('Outlook mailbox disconnected.', 'success');
            } catch (error) {
                setEmailBanner(error?.message || 'Mailbox disconnect failed.', 'error');
            }
            renderEmailPage();
        }
    }

    async function handleEmailRootSubmit(event) {
        if (!event.target.closest('#mail-compose-form')) return;
        event.preventDefault();
        const form = event.target;
        EMAIL_RUNTIME.compose = {
            to: String(form.elements.to?.value || '').trim(),
            cc: String(form.elements.cc?.value || '').trim(),
            subject: String(form.elements.subject?.value || '').trim(),
            body: String(form.elements.body?.value || '').trim()
        };
        await submitComposeForm();
    }

    async function handleEmailRootChange(event) {
        const searchInput = event.target.closest('#mail-search-input');
        if (searchInput) {
            EMAIL_RUNTIME.search = String(searchInput.value || '').trim();
            await loadFolder(EMAIL_RUNTIME.activeFolder, {
                search: EMAIL_RUNTIME.search,
                keepUnread: true
            });
            return;
        }
        const unreadToggle = event.target.closest('#mail-unread-toggle');
        if (unreadToggle) {
            EMAIL_RUNTIME.unreadOnly = unreadToggle.checked === true;
            await loadFolder(EMAIL_RUNTIME.activeFolder, {
                unreadOnly: EMAIL_RUNTIME.unreadOnly
            });
            return;
        }
        const composeFileInput = event.target.closest('#mail-compose-file-input');
        if (composeFileInput && composeFileInput.files?.length) {
            const uploadedFiles = [];
            for (const file of Array.from(composeFileInput.files)) {
                const uploaded = await uploadPortalStoredFile({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    blob: file,
                    uploadedAt: new Date().toISOString()
                }, 'mail');
                if (uploaded) uploadedFiles.push(uploaded);
            }
            EMAIL_RUNTIME.compose.attachments = [
                ...toEmailArray(EMAIL_RUNTIME.compose.attachments),
                ...uploadedFiles
            ];
            composeFileInput.value = '';
            renderEmailPage();
        }
    }

    function installEmailBindings() {
        if (EMAIL_RUNTIME.initialized) return;
        EMAIL_RUNTIME.initialized = true;
        document.addEventListener('click', event => {
            if (!event.target.closest('#page-email')) return;
            handleEmailRootClick(event).catch(error => {
                setEmailBanner(error?.message || 'Email action failed.', 'error');
                renderEmailPage();
            });
        });
        document.addEventListener('submit', event => {
            if (!event.target.closest('#page-email')) return;
            handleEmailRootSubmit(event).catch(error => {
                setEmailBanner(error?.message || 'Email action failed.', 'error');
                renderEmailPage();
            });
        });
        document.addEventListener('change', event => {
            if (!event.target.closest('#page-email')) return;
            handleEmailRootChange(event).catch(error => {
                setEmailBanner(error?.message || 'Email action failed.', 'error');
                renderEmailPage();
            });
        });
        window.addEventListener('kiu:mail-summary-updated', () => {
            if (getEmailRoot()) renderEmailPage();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                runMailAutoRefreshTick().catch(() => null);
            }
        });
        window.addEventListener('focus', () => {
            runMailAutoRefreshTick().catch(() => null);
        });
        window.addEventListener('beforeunload', () => {
            clearMailAutoRefresh();
        });
    }

    async function initializeEmailPage() {
        const root = getEmailRoot();
        if (!root) return;
        installEmailBindings();
        renderEmailPage();
        await loadMailBootstrap(false);
    }

    window.renderEmailPage = renderEmailPage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEmailPage, { once: true });
    } else {
        initializeEmailPage().catch(() => null);
    }
})();
