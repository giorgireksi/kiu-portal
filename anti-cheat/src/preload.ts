import { contextBridge, ipcRenderer } from 'electron';

const PORTAL_BACK_BAR_ID = 'kiu-anticheat-portal-back-bar';

function removePortalBackBar() {
  document.getElementById(PORTAL_BACK_BAR_ID)?.remove();
  document.documentElement.classList.remove('kiu-anticheat-portal-chrome');
  document.documentElement.style.removeProperty('--kiu-anticheat-portal-chrome-height');
}

function mountPortalBackBar(label: string) {
  removePortalBackBar();
  const bar = document.createElement('div');
  bar.id = PORTAL_BACK_BAR_ID;
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Anti-cheat navigation');
  bar.innerHTML = `
    <button type="button" id="kiu-anticheat-portal-back-btn">
      <span aria-hidden="true">←</span>
      <span>${label}</span>
    </button>
  `;

  const style = document.createElement('style');
  style.id = 'kiu-anticheat-portal-back-style';
  style.textContent = `
    :root.kiu-anticheat-portal-chrome {
      --kiu-anticheat-portal-chrome-height: 44px;
    }
    #${PORTAL_BACK_BAR_ID} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483000;
      height: var(--kiu-anticheat-portal-chrome-height);
      display: flex;
      align-items: center;
      padding: 0 12px;
      box-sizing: border-box;
      background: rgba(11, 17, 32, 0.94);
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      backdrop-filter: blur(10px);
      font-family: "Segoe UI", system-ui, sans-serif;
      pointer-events: none;
    }
    #kiu-anticheat-portal-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
    }
    #kiu-anticheat-portal-back-btn:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    body.kiu-anticheat-portal-chrome {
      padding-top: var(--kiu-anticheat-portal-chrome-height) !important;
    }
  `;

  if (!document.getElementById(style.id)) {
    document.head.appendChild(style);
  }
  document.documentElement.classList.add('kiu-anticheat-portal-chrome');
  document.body.classList.add('kiu-anticheat-portal-chrome');
  document.body.prepend(bar);

  const button = document.getElementById('kiu-anticheat-portal-back-btn');
  button?.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('return-to-launcher');
    if (!result?.ok && result?.error) {
      window.alert(result.error);
    }
  });
}

async function syncPortalBackBar() {
  try {
    const state = await ipcRenderer.invoke('get-portal-back-state');
    if (state?.visible) {
      mountPortalBackBar(String(state.label || 'Back to Dashboard'));
      return;
    }
  } catch (error) {
    // Ignore preload sync errors on non-portal pages.
  }
  removePortalBackBar();
}

function schedulePortalBackBarSync() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { void syncPortalBackBar(); }, { once: true });
    return;
  }
  void syncPortalBackBar();
}

schedulePortalBackBarSync();
window.addEventListener('pageshow', () => { void syncPortalBackBar(); });
ipcRenderer.on('portal-back-state-changed', (_event, state) => {
  if (state?.visible) {
    mountPortalBackBar(String(state.label || 'Back to Dashboard'));
    return;
  }
  removePortalBackBar();
});

contextBridge.exposeInMainWorld('antiCheat', {
  // Allows the LMS website to tell the browser who is logged in
  setIdentity: (name: string, email: string) => {
    ipcRenderer.send('set-student-identity', { name, email });
  },
  // Allows the LMS to trigger a custom violation if needed
  reportViolation: (reason: string) => {
    ipcRenderer.send('report-custom-violation', reason);
  },
  // Launcher controls
  launchConfiguredUrl: (payload: any) => ipcRenderer.invoke('launch-configured-url', payload),
  login: (credentials: any) => ipcRenderer.invoke('desktop-login', credentials),
  logout: () => ipcRenderer.invoke('desktop-logout'),
  getLoginPrefs: () => ipcRenderer.invoke('get-login-prefs'),
  getCurrentDesktopSession: () => ipcRenderer.invoke('get-current-desktop-session'),
  restoreDesktopSession: () => ipcRenderer.invoke('restore-desktop-session'),
  getLauncherSettings: () => ipcRenderer.invoke('get-launch-settings'),
  getLaunchDiagnostics: () => ipcRenderer.invoke('get-launch-diagnostics'),
  getAntiCheatPolicies: () => ipcRenderer.invoke('get-anti-cheat-policies'),
  saveAntiCheatPolicy: (payload: any) => ipcRenderer.invoke('save-anti-cheat-policy', payload),
  checkServiceHealth: () => ipcRenderer.invoke('check-service-health'),
  clearLaunchCache: () => ipcRenderer.invoke('clear-launch-cache'),
  openMainDevTools: () => ipcRenderer.invoke('open-main-devtools'),
  returnToLauncher: () => ipcRenderer.invoke('return-to-launcher'),
  getPortalBackState: () => ipcRenderer.invoke('get-portal-back-state')
});
