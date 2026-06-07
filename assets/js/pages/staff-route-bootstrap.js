(function initStaffRouteBootstrap() {
    'use strict';

    // Compatibility-only deferred loader kept until old tooling references stop
    // pointing at the staff mobile-shell bootstrap path.
    const MOBILE_BREAKPOINT = 1024;
    const MOBILE_SHELL_SCRIPT_URL = 'assets/js/pages/staff-mobile-shell.js?v=20260510-staff-admin3';
    let mobileShellRequested = false;

    function shouldLoadMobileShell() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function hasMobileShellScript() {
        return window.__staffMobileShellLoaded === true
            || Boolean(document.querySelector(`script[src="${MOBILE_SHELL_SCRIPT_URL}"]`));
    }

    function requestMobileShell() {
        if (!shouldLoadMobileShell() || mobileShellRequested || hasMobileShellScript()) return false;
        mobileShellRequested = true;

        const script = document.createElement('script');
        script.src = MOBILE_SHELL_SCRIPT_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            window.__staffMobileShellRequested = true;
        }, { once: true });
        script.addEventListener('error', () => {
            mobileShellRequested = false;
            console.error('Failed to load deferred staff mobile shell.');
        }, { once: true });
        document.body.appendChild(script);
        return true;
    }

    function handleResize() {
        requestMobileShell();
    }

    function init() {
        requestMobileShell();
        window.addEventListener('resize', handleResize);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
        return;
    }

    init();
})();
