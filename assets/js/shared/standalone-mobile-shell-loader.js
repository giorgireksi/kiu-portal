/* Load the mobile-only standalone shell without making desktop routes parse it. */
(function loadStandaloneMobileShellOnSmallScreens() {
    'use strict';
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!window.matchMedia?.('(max-width: 768px)').matches) return;
    const source = document.querySelector('script[data-kiu-mobile-shell-src]')?.dataset.kiuMobileShellSrc;
    if (!source || document.querySelector(`script[src="${source}"]`)) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = source;
    script.dataset.kiuMobileShellLoaded = '1';
    document.head.appendChild(script);
})();
