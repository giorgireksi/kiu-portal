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

function setProfilePanelShown(panel, shown) {
    if (!panel) return;
    panel.hidden = !shown;
    panel.classList.toggle('is-active', shown);
}

function switchProfileTab(tab, element) {
    document.querySelectorAll('#page-profile .tab').forEach((node) => {
        node.classList.remove('active');
    });
    element.classList.add('active');

    setProfilePanelShown(document.getElementById('profile-tab-info'), false);
    setProfilePanelShown(document.getElementById('profile-tab-email'), false);
    setProfilePanelShown(document.getElementById('profile-tab-password'), false);
    setProfilePanelShown(document.getElementById('profile-tab-calendar'), false);
    setProfilePanelShown(document.getElementById('profile-tab-messenger'), false);
    const targetPanel = ensureProfileTabContent(tab) || document.getElementById(`profile-tab-${tab}`);
    setProfilePanelShown(targetPanel, true);

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
