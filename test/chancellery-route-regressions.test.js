import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('chancellery route regressions', () => {
    it('keeps the shell free of dead social helper imports', () => {
        const html = readSource('chancellery.html');
        const css = readSource('assets/css/index-luxury.css');
        const registrationSource = readSource('assets/js/pages/registration.js');
        const chancellerySource = readSource('assets/js/pages/chancellery.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).toContain('assets/js/shared/messenger.js?v=20260429-peopleisolation1');
        expect(html).not.toContain('assets/js/pages/registration.js?v=20260429-facultyisolation1');
        expect(html).toContain('assets/js/pages/chancellery.js?v=20260515-chancellery-page1');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).toContain("function ensureNavigateHooks(){if(typeof window.navigate!=='function')return false;hookNav();buildRoleNav();return true}");
        expect(html).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(html).not.toContain('setInterval(function(){if(typeof window.navigate===');
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-chancellery #page-chancellery .lux-chancellery-hero,");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-chancellery #page-chancellery .lux-queue-item,");
        expect(chancellerySource).toContain('function ensureChancelleryShell(root)');
        expect(chancellerySource).toContain('function renderChancelleryPage()');
        expect(chancellerySource).toContain('function renderChancelleryStudentAppealsPanel');
        expect(chancellerySource).toContain('function renderChancelleryStaffWorkspace');
        expect(chancellerySource).toContain('function bindChancelleryDelegates(root)');
        expect(chancellerySource).toContain("data-chancellery-select-case");
        expect(chancellerySource).toContain("data-chancellery-filter");
        expect(chancellerySource).toContain("data-chancellery-status-target");
        expect(chancellerySource).toContain("data-chancellery-action=\"submit-request\"");
        expect(chancellerySource).toContain("data-chancellery-action=\"submit-staff-reply\"");
        expect(chancellerySource).toContain("data-chancellery-tab=\"appeals\"");
        expect(chancellerySource).not.toContain('onclick="setChancellerySelectedCase(');
        expect(chancellerySource).not.toContain('onclick="submitRequest()');
        expect(chancellerySource).not.toContain('onclick="submitChancelleryStaffReply()');
        expect(chancellerySource).not.toContain('onchange="setChancelleryFilter(');
        expect(chancellerySource).not.toContain('onchange="updateChancelleryRequestStatus(');
        expect(chancellerySource).not.toContain('onclick="switchChancelleryTab(');
        expect(registrationSource).toContain('const renderChancelleryPage = (...args) => window.renderChancelleryPage?.(...args);');
    });
});
