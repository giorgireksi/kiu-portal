/* Scroll controls for admin-tools curriculum subject list. */
(function curriculumLibraryScrollModule() {
    'use strict';

    const CURRICULUM_CONFIG = {
        shellSelector: '[data-curriculum-subject-scroll]',
        viewportSelector: '.curriculum-library-row-list, #curriculum-subject-row-list',
        controlsSelector: '.lux-scroll-rail__controls, .curriculum-library-scroll-controls',
        buttonSelector: '[data-lux-scroll], [data-curriculum-scroll]',
        step: 140,
    };

    function initCurriculumLibraryRowScroll(root) {
        if (typeof window.initLuxScrollRail === 'function') {
            return window.initLuxScrollRail(root, CURRICULUM_CONFIG);
        }
        return false;
    }

    function syncCurriculumLibraryRowScroll(root) {
        if (typeof window.syncLuxScrollRail === 'function') {
            return window.syncLuxScrollRail(root, CURRICULUM_CONFIG);
        }
        return false;
    }

    window.initCurriculumLibraryRowScroll = initCurriculumLibraryRowScroll;
    window.syncCurriculumLibraryRowScroll = syncCurriculumLibraryRowScroll;
})();