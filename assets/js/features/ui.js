
function ensureLuxModalsCss() {
    if (typeof document === 'undefined') return;
    const href = 'assets/css/lux-modals.css?v=20260723-gpuperf4k';
    const existing = document.querySelector('link[data-kiu-lux-modals], link[href*="lux-modals.css"]');
    if (existing) {
        if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
        existing.setAttribute('data-kiu-lux-modals', '1');
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-kiu-lux-modals', '1');
    document.head.appendChild(link);
}
window.ensureLuxModalsCss = ensureLuxModalsCss;
﻿/* Shared UI interactions extracted from the legacy core.js bundle. Active routes now load split files directly. */

// Profile menu open is owned by shell/navigation; keep outside-click close below.

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu && profileMenu.classList.contains('show') && !event.target.closest('.user-dropdown-trigger')) {
        profileMenu.classList.remove('show');
    }
    document.querySelectorAll('.select-items').forEach(el => {
        if(el.classList.contains('show') && !event.target.closest('.custom-select')) {
            el.classList.remove('show');
        }
    });
    document.querySelectorAll('.grade-popover').forEach(el => {
        if(el.classList.contains('show') && !event.target.closest('.grade-popover-container')) {
            el.classList.remove('show');
        }
    });
});

// Calendar workspace removed (calendar.html redirects to timetable).
// --- MODALS ---
const INDEX_PROGRAM_OPTION_LABELS = [
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

const INDEX_PROGRAM_COURSE_ROWS = [
    ['A (303)', 'I Module - Mandatory Subjects', '45/0', '', 'group'],
    ['1', 'Probability and Statistics Basics', '5', '[7024] Statistics Foundations'],
    ['2', 'Roman Law Basics', '5', ''],
    ['3', 'Management Foundations', '5', '[7027] Probability and Statistics Basics'],
    ['4', 'Sociology Foundations', '5', '']
];

const INDEX_SYLLABUS_FILE_ROWS = [
    'Introduction to Probability and Statistics_SYLLABUS_Chelidze.pdf',
    'INTRODUCTION TO PROBABILITY AND STATISTICS_Spring 2025.pdf',
    'Introduction to Probability and Statistics_Spring 2026.pdf'
];

const LUX_MODAL_CLOSE_MS = 180;
let luxModalCloseTimer = 0;

function ensureModalOverlayBindings() {
    ensureLuxModalsCss();
    const overlay = document.getElementById('modal-overlay');
    if (!overlay || overlay.dataset.modalCloseBound === '1') return overlay;
    overlay.dataset.modalCloseBound = '1';
    overlay.addEventListener('click', closeAllModals);
    return overlay;
}

function setModalVisibility(modal, shown, displayValue = 'block') {
    if (!modal) return;
    ensureLuxModalsCss();
    modal.hidden = !shown;
    modal.style.display = shown ? displayValue : 'none';
}

function ensureModalScaffold(type) {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    const modalId = type === 'announcement' ? 'modal-announcement' : type === 'event' ? 'modal-event' : '';
    if (!modalId) return null;
    let modal = document.getElementById(modalId);
    if (!modal) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = type === 'announcement'
            ? `
                <div id="modal-announcement" class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-ann-title">Title</h3>
                        <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="modal-ann-body">Body</div>
                    <div class="modal-footer"><button type="button" class="lux-secondary-btn" data-modal-close="1">Close</button></div>
                </div>
            `
            : `
                <div id="modal-event" class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-evt-title">Title</h3>
                        <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="modal-evt-body">Body</div>
                    <div class="modal-footer"><button type="button" class="lux-secondary-btn" data-modal-close="1">Close</button></div>
                </div>
            `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function ensureSyllabusModal() {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    let modal = document.getElementById('modal-syllabus');
    if (!modal) {
        const fileRows = INDEX_SYLLABUS_FILE_ROWS.map((label, index) => `
            <div class="modal-helper-row${index < INDEX_SYLLABUS_FILE_ROWS.length - 1 ? ' modal-helper-row--divided' : ''}">
                <span>${label}</span>
                <button type="button" class="lux-primary-btn" aria-label="Download syllabus file">
                    <i class="fas fa-cloud-download-alt" aria-hidden="true"></i>
                </button>
            </div>
        `).join('');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="modal-syllabus" class="modal-content modal-syllabus-shell">
                <div class="modal-header">
                    <h3>Syllabus</h3>
                    <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="modal-body modal-syllabus-body">
                    ${fileRows}
                </div>
            </div>
        `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function ensureProgramsModal() {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return null;
    let modal = document.getElementById('modal-programs');
    if (!modal) {
        const optionButtons = INDEX_PROGRAM_OPTION_LABELS
            .map((label) => `<button class="lux-secondary-btn modal-programs-option"${label === '56. Program Catalog' ? ' data-show-program-courses="1"' : ''}>${label}</button>`)
            .join('');
        const courseRows = INDEX_PROGRAM_COURSE_ROWS
            .map(([index, title, ects, prerequisite, tone]) => `
                <tr${tone === 'group' ? ' class="modal-programs-course-group"' : ''}>
                    <td>${index}</td>
                    <td class="modal-programs-title-cell">${title}</td>
                    <td${tone === 'group' ? ' class="modal-programs-ects"' : ''}>${ects}</td>
                    <td>${prerequisite}</td>
                </tr>
            `)
            .join('');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="modal-programs" class="modal-content modal-programs-shell">
                <div class="modal-header">
                    <h3>Educational Programs</h3>
                    <button type="button" class="modal-close" data-modal-close="1" aria-label="Close">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="modal-body modal-programs-body">
                    <div class="modal-surface-card modal-programs-card">
                        <h4 class="modal-programs-title">Select Program</h4>
                        <div class="modal-programs-list">${optionButtons}</div>
                    </div>
                    <div id="modal-program-courses" class="modal-surface-card">
                        <table class="kiu-table modal-programs-table">
                            <thead>
                                <tr><th>N</th><th class="modal-programs-heading-start">Subject Title / Module Title</th><th>ECTS</th><th>Prerequisite / Anti-requisite</th></tr>
                            </thead>
                            <tbody>${courseRows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="lux-primary-btn" data-modal-close="1">Close</button></div>
            </div>
        `;
        modal = wrapper.firstElementChild;
        if (modal) {
            setModalVisibility(modal, false);
            overlay.appendChild(modal);
        }
    }
    return modal;
}

function openModal_ensureCss(type, title, body) {
    const overlay = ensureModalOverlayBindings();
    if (!overlay) return;
    if (type === 'programs') ensureProgramsModal();
    document.querySelectorAll('#modal-overlay .modal-content').forEach((el) => setModalVisibility(el, false));
    let opened = false;

    if (type === 'announcement') {
        ensureModalScaffold('announcement');
        document.getElementById('modal-ann-title').innerText = title;
        document.getElementById('modal-ann-body').innerText = body;
        setModalVisibility(document.getElementById('modal-announcement'), true, 'block');
        opened = true;
    } else if (type === 'event') {
        ensureModalScaffold('event');
        document.getElementById('modal-evt-title').innerText = title;
        document.getElementById('modal-evt-body').innerText = body;
        setModalVisibility(document.getElementById('modal-event'), true, 'block');
        opened = true;
    } else if (type === 'syllabus') {
        const modal = ensureSyllabusModal();
        if (modal) {
            setModalVisibility(modal, true, 'block');
            opened = true;
        }
    } else if (type === 'programs') {
        setModalVisibility(document.getElementById('modal-program-courses'), false);
        setModalVisibility(document.getElementById('modal-programs'), true, 'flex');
        opened = true;
    }

    if (!opened) return;
    window.clearTimeout(luxModalCloseTimer);
    overlay.classList.remove('is-closing');
    overlay.hidden = false;
    overlay.classList.add('active');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
}

function closeAllModals(event) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const target = event && event.target ? event.target : null;
    const isOverlayClick = target === overlay;
    const closeTrigger = target && typeof target.closest === 'function'
        ? target.closest('[data-modal-close]')
        : null;
    const shouldClose = !target || isOverlayClick || Boolean(closeTrigger);

    if (!shouldClose) return;

    if (overlay.classList.contains('is-closing')) return;
    overlay.classList.remove('active');
    overlay.classList.add('is-closing');
    window.clearTimeout(luxModalCloseTimer);
    luxModalCloseTimer = window.setTimeout(() => {
        overlay.classList.remove('is-closing');
        overlay.hidden = true;
        document.querySelectorAll('#modal-overlay .modal-content').forEach((el) => setModalVisibility(el, false));
    }, LUX_MODAL_CLOSE_MS);
}

function showProgramCourses() {
    ensureProgramsModal();
    setModalVisibility(document.getElementById('modal-program-courses'), true, 'block');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
}

if (!window.__kiuModalActionDelegatesBound) {
    window.__kiuModalActionDelegatesBound = true;
    document.addEventListener('click', (event) => {
        if (event.target.id === 'modal-overlay') {
            closeAllModals(event);
            return;
        }
        if (event.target.closest('[data-modal-close]')) {
            closeAllModals(event);
            return;
        }
        if (event.target.closest('[data-show-program-courses]')) {
            showProgramCourses();
        }
    });
}

window.ensureProgramsModal = ensureProgramsModal;
window.ensureSyllabusModal = ensureSyllabusModal;



