/* Classic bridge: re-assert ESM leaf window surface for defer-order consumers.
 * Load after type=module curriculum-library-model.js.
 */
(function initCurriculumLibraryModelBridge() {
    'use strict';
    var api = window.__kiuCurriculumLibraryModelExports || window.KiuCurriculumLibraryModel;
    if (!api) {
        console.error('[curriculum-library-model-bridge] ESM leaf missing; load curriculum-library-model.js as type=module first');
        return;
    }
    window.__KIU_CURRICULUM_LIBRARY_MODEL_LOADED = true;
    window.__kiuCurriculumLibraryModelExports = api;
    window.KiuCurriculumLibraryModel = api;
    Object.keys(api).forEach(function (key) {
        window[key] = api[key];
    });
})();
