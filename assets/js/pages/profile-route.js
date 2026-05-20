/* Self-profile tab runtime extracted from registration.js. */

function ensureProfileTabContent(tab) {
    const panel = document.getElementById(`profile-tab-${tab}`);
    if (!panel || panel.dataset.profileMounted === '1') return panel;
    const template = document.getElementById(`profile-tab-template-${tab}`);
    if (!template) return panel;
    panel.innerHTML = template.innerHTML;
    panel.dataset.profileMounted = '1';
    return panel;
}

function switchProfileTab(tab, element) {
    document.querySelectorAll('#page-profile .tab').forEach((node) => {
        node.classList.remove('active');
        node.style.borderLeftColor = 'transparent';
    });
    element.classList.add('active');
    element.style.borderLeftColor = 'var(--kiu-blue)';

    document.getElementById('profile-tab-info').style.display = 'none';
    document.getElementById('profile-tab-email').style.display = 'none';
    document.getElementById('profile-tab-password').style.display = 'none';
    const calendarTab = document.getElementById('profile-tab-calendar');
    if (calendarTab) calendarTab.style.display = 'none';
    const messengerTab = document.getElementById('profile-tab-messenger');
    if (messengerTab) messengerTab.style.display = 'none';
    const targetPanel = ensureProfileTabContent(tab) || document.getElementById(`profile-tab-${tab}`);
    if (targetPanel) targetPanel.style.display = 'block';

    if (tab === 'calendar') {
        setTimeout(() => renderProfileCalendar(), 50);
    }
    if (tab === 'messenger' && typeof renderPortalMessengerWorkspace === 'function') {
        setTimeout(() => renderPortalMessengerWorkspace(), 50);
    }
}

if (!window.__profileTabDelegatesBound) {
    window.__profileTabDelegatesBound = true;
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-profile-tab]');
        if (!trigger) return;
        event.preventDefault();
        switchProfileTab(trigger.dataset.profileTab || 'info', trigger);
    });
}

window.ensureProfileTabContent = ensureProfileTabContent;
window.switchProfileTab = switchProfileTab;
