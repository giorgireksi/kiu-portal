import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('client security boundary regressions', () => {
    it('keeps protected Electron headers and reports on approved backend origins', () => {
        const source = readSource('anti-cheat/src/main.ts');

        expect(source).toContain('isAllowedProtectedBackendUrl(details.url)');
        expect(source).toContain('isAllowedProtectedBackendUrl(targetUrl)');
        expect(source).not.toContain('sessionCookies');
        expect(source).toContain('The anti-cheat backend URL is not an approved origin.');
    });

    it('requires secure, configured Android navigation and push endpoints', () => {
        const activity = readSource('anti-cheat/android/app/src/main/java/com/anticheat/browser/MainActivity.kt');
        const push = readSource('anti-cheat/android/app/src/main/java/com/anticheat/browser/KiuMobilePushRegistration.kt');
        const manifest = readSource('anti-cheat/android/app/src/main/AndroidManifest.xml');

        expect(manifest).toContain('android:usesCleartextTraffic="false"');
        expect(activity).toContain('Navigation outside the university LMS is blocked.');
        expect(activity).toContain('if (!isApprovedConfigUrl(url)) return');
        expect(push).toContain('approvedBackendUrl');
        expect(push).toContain('url.protocol.lowercase() != "https"');
    });

    it('sanitizes document preview markup and notification destinations', () => {
        const whiteboard = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');
        const research = readSource('assets/js/pages/social-research-pdf-runtime.js');
        const worker = readSource('service-worker.js');

        expect(whiteboard).toContain('sanitizeLmsWhiteboardPreviewHtml');
        expect(whiteboard).toContain("querySelectorAll('script,style,iframe,object,embed,form,link,meta,svg,math')");
        expect(research).toContain('sanitizeResearchDocumentHtml');
        expect(worker).toContain('normalizeNotificationTarget');
        expect(worker).toContain('target.origin !== self.location.origin');
    });
});
