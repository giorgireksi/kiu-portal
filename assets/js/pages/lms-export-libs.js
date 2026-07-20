(function initLmsExportLibraryLoader() {
    const exportSources = {
        jspdf: 'assets/vendor/export-libs/jspdf.umd.min.js'
    };
    const pendingLoads = {};
    const isReady = {
        jspdf: () => typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined'
    };
    function loadScriptOnce(key) {
        if (isReady[key]?.()) return Promise.resolve();
        if (pendingLoads[key]) return pendingLoads[key];
        pendingLoads[key] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = exportSources[key];
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Could not load ${key} export library.`));
            document.head.appendChild(script);
        });
        return pendingLoads[key];
    }
    window.ensureLmsExportLibraries = function ensureLmsExportLibraries(format) {
        const normalized = String(format || '').toLowerCase();
        if (normalized === 'pdf') return loadScriptOnce('jspdf');
        return Promise.resolve();
    };
})();
