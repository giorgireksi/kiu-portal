import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('anti-cheat build script', () => {
    it('uses a cross-platform build script instead of Windows xcopy', () => {
        const packageJson = readSource('anti-cheat/package.json');
        expect(packageJson).not.toContain('xcopy');
        expect(packageJson).toContain('fs.cpSync');
        expect(packageJson).toContain('node node_modules/electron/cli.js .');
        expect(packageJson).toContain('ensure-electron-platform.js');
    });

    it('points local dev config at the portal stack ports', () => {
        const config = readSource('anti-cheat/src/config.json');
        expect(config).toContain('"appUrl": "http://127.0.0.1:8876"');
        expect(config).toContain('"backendUrl": "http://127.0.0.1:48933"');
    });

    it('lets preview environment URLs override disk-local anti-cheat configuration', () => {
        const main = readSource('anti-cheat/src/main.ts');
        expect(main).toContain('RUNTIME_APP_URL_OVERRIDE');
        expect(main).toContain('RUNTIME_BACKEND_URL_OVERRIDE');
        expect(main).toContain('KIU_ANTI_CHEAT_QUIZ_URL');
        expect(main).toContain('...diskConfig');
        expect(main).toContain('RUNTIME_APP_URL_OVERRIDE}/exam-portal.html');
    });

    it('builds Android demo APKs with a public URL without changing local defaults', () => {
        const buildScript = readSource('tools/build-anti-cheat-android-apk.sh');
        expect(buildScript).toContain('KIU_ANTI_CHEAT_APP_URL');
        expect(buildScript).toContain('KIU_ANTI_CHEAT_BACKEND_URL');
        expect(buildScript).toContain('KIU_ANTI_CHEAT_EXAM_PORTAL_URL');
        expect(buildScript).toContain('CONFIG_BACKUP');
        expect(buildScript).toContain('restore_android_config');
        expect(buildScript).toContain('allowedDomains');
    });

    it('documents CachyOS dev startup in README-DEV-LINUX', () => {
        const readme = readSource('anti-cheat/README-DEV-LINUX.md');
        expect(readme).toContain('47835/health');
        expect(readme).toContain('./start-local-lms-anticheat.sh');
        expect(readme).toContain('./start-local-lms-anticheat.sh');
    });

    it('provides a one-click local launcher for LMS backend web and anti-cheat', () => {
        const launcher = readSource('start-local-lms-anticheat.sh');
        const localServer = readSource('tools/local_dev_server.js');
        const stopper = readSource('stop-local-lms-anticheat.sh');
        const packageJson = readSource('package.json');
        const readme = readSource('anti-cheat/README-DEV-LINUX.md');
        const wifiSetup = readSource('wifi-setup.html');
        const androidBuild = readSource('tools/build-anti-cheat-android-apk.sh');
        const androidGradle = readSource('anti-cheat/android/app/build.gradle');
        expect(launcher).toContain('BRIDGE_HEALTH_URL');
        expect(launcher).toContain('KIU_LOCAL_LAN_MODE');
        expect(launcher).toContain('KIU_LOCAL_LAN_IP');
        expect(launcher).toContain('KIU_LOCAL_BIND_HOST');
        expect(launcher).toContain('KIU_LOCAL_BACKEND_BIND_HOST');
        expect(launcher).toContain('KIU_LOCAL_BACKEND_PROXY_HOST');
        expect(launcher).toContain('KIU_LOCAL_LMS_PORT');
        expect(launcher).toContain('KIU_LOCAL_BACKEND_PORT');
        expect(launcher).toContain('KIU_PUBLIC_APP_URL');
        expect(launcher).toContain('KIU_PUBLIC_BACKEND_URL');
        expect(launcher).toContain('KIU_ANTI_CHEAT_BRIDGE_PORT');
        expect(launcher).toContain('wifi-setup.html');
        expect(launcher).toContain('ensure-electron-platform.js');
        expect(launcher).toContain('electron/cli.js');
        expect(localServer).toContain('KIU_LOCAL_BIND_HOST');
        expect(localServer).toContain('KIU_LOCAL_BACKEND_PROXY_HOST');
        expect(localServer).toContain('server.listen(PORT, LISTEN_HOST');
        expect(launcher).toContain('ANTICHEAT_PID_FILE');
        expect(packageJson).toContain('"build:android:apk"');
        expect(packageJson).toContain('"start:local:lms"');
        expect(readme).toContain('KIU_PUBLIC_APP_URL');
        expect(readme).toContain('KIU_PUBLIC_BACKEND_URL');
        expect(readme).toContain('KIU_ANTI_CHEAT_BRIDGE_PORT');
        expect(readme).toContain('KIU_LOCAL_LAN_IP');
        expect(readme).toContain('KIU_LOCAL_LAN_MODE=0');
        expect(readme).toContain('build:android:apk');
        expect(readme).toContain('wifi-setup.html');
        expect(readme).toContain('app-release.apk');
        expect(wifiSetup).toContain('Same-Wi-Fi setup');
        expect(wifiSetup).toContain('Scan once. No typing.');
        expect(wifiSetup).toContain('Copy link');
        expect(wifiSetup).toContain('Open Android download');
        expect(wifiSetup).toContain('setupQr');
        expect(wifiSetup).toContain('/api/local-setup/bootstrap');
        expect(wifiSetup).toContain('Expected APK path');
        expect(androidBuild).toContain('assembleRelease');
        expect(androidBuild).toContain('app-release.apk');
        expect(androidGradle).toContain('signingConfigs.debug');
        expect(androidGradle).toContain('KIU_ANDROID_RELEASE_STORE_FILE');
    });

    it('keeps start-local-8888 as a thin wrapper over the LAN launcher', () => {
        const launcher8888 = readSource('start-local-8888.sh');
        const stopper8888 = readSource('stop-local-8888.sh');
        expect(launcher8888).toContain('KIU_LOCAL_LMS_PORT');
        expect(launcher8888).toContain('KIU_LOCAL_LAN_MODE');
        expect(launcher8888).toContain('start-local-lms-anticheat.sh');
        expect(launcher8888).toContain('exec env');
        expect(stopper8888).toContain('stop-local-lms-anticheat.sh');
    });

    it('builds the Android release handoff with launcher metadata and exam portal support', () => {
        const server = readSource('backend/platform/routes/platform-ops-routes.js');

        expect(server).toContain('function registerPlatformOpsRoutes');
        expect(server).toContain('buildLocalSetupBootstrap');
        expect(server).toContain("app.get('/api/local-setup/bootstrap'");
    });
});

describe('anti-cheat browsing profile', () => {
    it('splits browsing and protected runtime profiles with Chrome-like UA and gated handlers', () => {
        const main = readSource('anti-cheat/src/main.ts');
        const preload = readSource('anti-cheat/src/preload.ts');
        const settings = readSource('anti-cheat/src/ui/settings.html');

        expect(main).toContain('function getRuntimeProfile()');
        expect(main).toContain('function getBrowsingRelaxedSettings');
        expect(main).toContain('function applyRuntimeProfileToWindow');
        expect(main).toContain('function isSameAppOrigin');
        expect(main).toContain('function isNavigationBlocked');
        expect(main).toContain('getAntiCheatUserAgent');
        expect(main).toContain("getRuntimeProfile() !== 'protected'");
        expect(main).toContain('sandbox: profile !== \'browsing\'');
        expect(main).toContain('applyRuntimeProfileToWindow();');
        expect(preload).toContain('pointer-events: none');
        expect(preload).toContain('pointer-events: auto');
        expect(settings).toContain('normal browser behavior');
        expect(settings).not.toContain('testing restrictions');
    });
});

describe('anti-cheat admin-owned protected policy', () => {
    it('uses server-owned activePolicy for protected sessions instead of student launcher settings', () => {
        const main = readSource('anti-cheat/src/main.ts');
        const settings = readSource('anti-cheat/src/ui/settings.html');

        expect(main).toContain('let activePolicy: any = null;');
        expect(main).toContain("if (getRuntimeProfile() === 'protected') return activePolicy || normalizeAntiCheatPolicy();");
        expect(main).toContain('activePolicy = normalizeAntiCheatPolicy(payload.antiCheatPolicy');
        expect(main).toContain('protectedPolicy.heartbeatMs || 2000');
        expect(main).toContain('protectedPolicy.processScanMs || 1500');
        expect(main).toContain('getEffectiveBlockedProcesses()');
        expect(main).toContain("process.platform === 'win32' ? 'tasklist' : 'ps -eo comm=,args='");
        expect(settings).toContain('Protected Session Policy');
        expect(settings).toContain('data-policy-key="processScanning"');
        expect(settings).toContain('getAntiCheatPolicies');
        expect(settings).toContain('saveAntiCheatPolicy');
        expect(settings).toContain('Protected exam restrictions are configured by administration');
    });
});

describe('anti-cheat desktop login gate', () => {
    it('adds login-first desktop session IPC and role-aware launcher controls', () => {
        const main = readSource('anti-cheat/src/main.ts');
        const preload = readSource('anti-cheat/src/preload.ts');
        const login = readSource('anti-cheat/src/ui/login.html');
        const settings = readSource('anti-cheat/src/ui/settings.html');

        expect(main).toContain('DESKTOP_SESSION_PATH');
        expect(main).toContain('async function showLoginOrLauncher');
        expect(main).toContain('/api/portal/session/login');
        expect(main).toContain('/api/portal/session/logout');
        expect(main).toContain("headers: { 'X-Portal-Session': token }");
        expect(main).toContain("ipcMain.handle('desktop-login'");
        expect(main).toContain("ipcMain.handle('desktop-logout'");
        expect(main).toContain("ipcMain.handle('get-current-desktop-session'");
        expect(main).toContain("ipcMain.handle('restore-desktop-session'");
        expect(main).toContain("ipcMain.handle('launch-configured-url'");
        expect(main).toContain("ipcMain.handle('get-launch-settings'");
        expect(main).toContain('function isLoopbackUrl(value: any)');
        expect(main).toContain('if (!RUNTIME_APP_URL_OVERRIDE && !isLoopbackUrl(config.appUrl)');
        expect(preload).toContain('login: (credentials: any) => ipcRenderer.invoke');
        expect(preload).toContain("ipcRenderer.invoke('desktop-logout')");
        expect(preload).toContain("ipcRenderer.invoke('get-current-desktop-session')");
        expect(preload).toContain("ipcRenderer.invoke('restore-desktop-session')");
        expect(preload).toContain('launchConfiguredUrl: (payload: any) => ipcRenderer.invoke');
        expect(preload).toContain("ipcRenderer.invoke('get-launch-settings')");
        expect(login).toContain('Sign in to Anti-Cheat');
        expect(login).toContain('desktop-login-email');
        expect(login).toContain('desktop-login-password');
        expect(settings).toContain('desktopUserRole');
        expect(settings).toContain('data-staff-only="true"');
        expect(settings).toContain('canUseStaffTools');
        expect(settings).toContain('logoutDesktop');
        expect(settings).toContain('Configured Launch Target');
        expect(settings).toContain('window.antiCheat.checkServiceHealth()');
        expect(settings).toContain('configuredExamPortalUrl()');
        expect(settings).toContain('configuredLmsQuizUrl()');
    });
});

describe('anti-cheat portal navigation chrome', () => {
    it('exposes a portal back bar and return-to-launcher IPC for exam portal and LMS pages', () => {
        const preload = readSource('anti-cheat/src/preload.ts');
        const main = readSource('anti-cheat/src/main.ts');

        expect(preload).toContain('kiu-anticheat-portal-back-bar');
        expect(preload).toContain("ipcRenderer.invoke('return-to-launcher')");
        expect(preload).toContain("ipcRenderer.invoke('get-portal-back-state')");
        expect(main).toContain('shouldOfferPortalBackNavigation');
        expect(main).toContain("ipcMain.handle('return-to-launcher'");
        expect(main).toContain('/exam-portal');
        expect(main).toContain('/lms.html');
    });
});

describe('exam portal anti-cheat handoff', () => {
    it('uses the desktop bridge instead of navigating to anticheat:// in the browser', () => {
        const examPortalSource = readSource('assets/js/pages/exam-portal.js');
        expect(examPortalSource).toContain('handoffExamLaunchToAntiCheatBridge');
        expect(examPortalSource).toContain('attemptExamPortalAntiCheatLaunch(launchUrl)');
        expect(examPortalSource).not.toMatch(/launchScheduledExam[\s\S]*window\.location\.href = launchUrl/);
    });
});
