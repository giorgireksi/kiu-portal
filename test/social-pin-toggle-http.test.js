import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const RESTART_CMD = 'npm run stop:local && npm run start:local';

describe('social-pin-toggle-http', () => {
    it('documents pin health version, toggle route, boot probe, and banner', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        expect(routes).toContain("app.post('/api/social/pins/toggle'");

        const systemRoutes = readSource('backend/platform/routes/system-routes.js');
        expect(systemRoutes).toContain('socialPinApiVersion: SOCIAL_PIN_API_VERSION');

        const pinModel = readSource('assets/js/pages/social-pin-model.js');
        expect(pinModel).toContain('PIN_API_UNAVAILABLE_MESSAGE');
        expect(pinModel).toContain('PIN_API_BANNER_MESSAGE');
        expect(pinModel).toContain(RESTART_CMD);
        expect(pinModel).toContain('checkPinApiHealth');
        expect(pinModel).toContain('setPinApiUnavailable');

        const runtime = readSource('assets/js/shared/social-lite-content-runtime.js');
        expect(runtime).toMatch(/error\?\.status === 404[\s\S]*PIN_API_UNAVAILABLE_MESSAGE/);
        expect(runtime).toContain('setPinApiUnavailable');

        const verify = readSource('tools/verify_social_pins.mjs');
        expect(verify).toContain('socialPinApiVersion');
        expect(verify).toContain('/health');
        expect(verify).toContain('/api/social/pins/toggle');

        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');
        expect(boot).toContain('warnIfPinApiUnavailable');
        expect(boot).toContain('checkPinApiHealth');
        expect(boot).toContain('setPinApiUnavailable');

        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(interactions).toContain('social-neo-pin-api-warning');
        expect(interactions).toContain('pinApiUnavailable');

        const pageEvents = readSource('assets/js/pages/social-page-events.js');
        expect(pageEvents).toContain('setPinApiUnavailable');

        const launcher = readSource('start-local-lms-anticheat.sh');
        expect(launcher).toContain('pin_api_healthy');
        expect(launcher).toContain('Backend missing socialPinApiVersion');

        const packageJson = readSource('package.json');
        expect(packageJson).toContain('"verify:pins"');

        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-social .social-neo-pin-api-warning');

        const html = readSource('social.html');
        expect(html).toContain('social-page-boot-runtime.js?v=20260802-pinfix4');
        expect(html).toContain('social-pin-model.js?v=20260802-pinfix4');
        expect(html).toContain('social-page-events.js?v=20260804-pagesize1');
        expect(html).toContain('social-lite-content-runtime.js?v=20260802-pinfix4');
    });
});
