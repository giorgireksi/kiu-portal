import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('anti-cheat Android mobile UI', () => {
    it('keeps the native shell portrait-friendly and touch-sized', () => {
        const layout = readSource('anti-cheat/android/app/src/main/res/layout/activity_main.xml');
        const styles = readSource('anti-cheat/android/app/src/main/res/values/styles.xml');

        expect(layout).toContain('android:id="@+id/app_root"');
        expect(layout).toContain('android:id="@+id/controls_content"');
        expect(layout).toContain('android:clipToPadding="false"');
        expect(layout).toContain('style="@style/AntiCheatButtonPrimary"');
        expect(layout).toContain('style="@style/AntiCheatField"');
        expect(layout).toContain('android:id="@+id/staff_toggle_button"');
        expect(layout).toContain('android:id="@+id/web_loading_overlay"');
        expect(styles).toContain('<item name="android:minHeight">52dp</item>');
        expect(styles).toContain('<item name="android:minHeight">54dp</item>');
    });

    it('uses the shared dark-teal palette and state surfaces', () => {
        const colors = readSource('anti-cheat/android/app/src/main/res/values/colors.xml');
        const layout = readSource('anti-cheat/android/app/src/main/res/layout/activity_main.xml');

        expect(colors).toContain('<color name="anti_cheat_background">#06171B</color>');
        expect(colors).toContain('<color name="anti_cheat_accent">#26A69A</color>');
        expect(colors).toContain('<color name="anti_cheat_danger_surface">#3B1F27</color>');
        expect(layout).toContain('@drawable/bg_banner_warning');
        expect(layout).toContain('@drawable/bg_banner_danger');
        expect(layout).toContain('@drawable/bg_badge');
    });

    it('provides loading, retry, insets, and WebView error handling', () => {
        const main = readSource('anti-cheat/android/app/src/main/java/com/anticheat/browser/MainActivity.kt');
        const strings = readSource('anti-cheat/android/app/src/main/res/values/strings.xml');
        const manifest = readSource('anti-cheat/android/app/src/main/AndroidManifest.xml');
        const debugNetworkConfig = readSource('anti-cheat/android/app/src/debug/res/xml/network_security_config.xml');

        expect(main).toContain('WindowCompat.setDecorFitsSystemWindows(window, false)');
        expect(main).toContain('ViewCompat.setOnApplyWindowInsetsListener');
        expect(main).toContain('override fun onReceivedError');
        expect(main).toContain('override fun onReceivedHttpError');
        expect(main).toContain('webMainFrameLoadFailed');
        expect(main).toContain('WebSettings.LOAD_DEFAULT');
        expect(main).toContain('AntiCheatBrowser/1');
        expect(main).toContain('WebSettings.getDefaultUserAgent(this@MainActivity)');
        expect(main).toContain('publishWebViewPerformance');
        expect(main).toContain('lastNavigationMs');
        expect(main).toContain('showWebLoadingState');
        expect(main).toContain('webRetryButton.setOnClickListener');
        expect(main).toContain('webView.reload()');
        expect(strings).toContain('<string name="web_error_title">');
        expect(strings).toContain('<string name="web_http_error_message">');
        expect(strings).toContain('<string name="retry">Try again</string>');
        expect(manifest).toContain('android:networkSecurityConfig="@xml/network_security_config"');
        expect(debugNetworkConfig).toContain('<domain>10.0.2.2</domain>');
    });

    it('uses the live portal shell and keeps protected launch native-guarded', () => {
        const main = readSource('anti-cheat/android/app/src/main/java/com/anticheat/browser/MainActivity.kt');
        const layout = readSource('anti-cheat/android/app/src/main/res/layout/activity_main.xml');
        const login = readSource('login.html');

        expect(main).toContain('WebMode.PORTAL');
        expect(main).toContain('private fun openPortalShell()');
        expect(main).toContain('/login.html');
        expect(main).toContain('localStorage.getItem(\'KIU_PORTAL_SESSION_TOKEN\')');
        expect(main).toContain('validatePortalSession(token)');
        expect(main).toContain('KEY_CONFIG_ASSET_SIGNATURE');
        expect(main).toContain('clearNativePortalSessionFromWeb');
        expect(main).toContain('portalSession?.token == token');
        expect(main).toContain('webView.onPause()');
        expect(main).toContain('webView.onResume()');
        expect(main).toContain('if (scheme == "anticheat")');
        expect(main).toContain('redeemPendingLaunchIfPossible()');
        expect(layout).toContain('android:id="@+id/webview"');
        expect(layout).toContain('android:visibility="gone"');
        expect(login).toContain('lux-primary-btn');
        expect(login).toContain('lux-tokens.css');
    });
});
