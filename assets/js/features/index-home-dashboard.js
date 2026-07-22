(function registerLuxuryHomeDashboardChunk() {
    if (typeof window.__kiuRegisterLuxuryHomeChunkUrl === 'function') {
        window.__kiuRegisterLuxuryHomeChunkUrl('assets/js/features/index-home-dashboard.plain.js?v=20260719-homewd1');
        return;
    }
    // Fallback if runtime not ready yet: store URL for later ensure.
    window.__kiuLuxuryHomeChunkUrl = 'assets/js/features/index-home-dashboard.plain.js?v=20260719-homewd1';
})();
