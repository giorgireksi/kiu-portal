(function () {
    const current = document.currentScript;
    if (!current || current.dataset.kiuLoaded === '1') return;
    current.dataset.kiuLoaded = '1';
    const currentUrl = new URL(current.src, window.location.href);
    const inAssetsDirectory = /\/assets\/js\/$/i.test(new URL('./', currentUrl).pathname);
    const baseUrl = inAssetsDirectory
        ? new URL('./', currentUrl)
        : new URL('./assets/js/', currentUrl);
    const scriptPaths = [
        'app/app.js',
        'app/api.js',
        'app/auth.js',
        'data/initial-state.js',
        'app/state.js',
        'shared/faculty.js',
        'shared/messenger.js',
        'shared/utilities.js',
        'features/navigation.js',
        'features/ui.js',
        'pages/gradebook.js',
        'pages/lms.js',
        'pages/registration.js',
        'pages/student-service.js',
        'pages/planner.js',
        'pages/directories.js',
        'pages/student-registration.js',
        'pages/admin-registration.js'
    ];
    const parent = current.parentNode;
    scriptPaths.forEach((path) => {
        const script = document.createElement('script');
        const scriptUrl = new URL(path, baseUrl);
        if (currentUrl.search) scriptUrl.search = currentUrl.search;
        script.src = scriptUrl.toString();
        script.async = false;
        parent.insertBefore(script, current);
    });
})();
