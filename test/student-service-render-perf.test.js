import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
        const full = join(process.cwd(), relativePath);
        if (!existsSync(full)) return '';
        return readFileSync(full, 'utf8');
    }

function readStudentServiceRuntime() {
    return [
        'assets/js/pages/student-service.js',
        'assets/js/pages/student-service-chrome.js',
        'assets/js/pages/student-service-inbox-runtime.js',
        'assets/js/pages/student-service-page-runtime.js',
    ].map(readAsset).join('\n');
}

describe('student-service render performance guardrails', () => {
    it('splits chrome and body render signatures for incremental updates', () => {
        const source = readStudentServiceRuntime();

        expect(source).toContain('function buildStudentServiceChromeSignature(');
        expect(source).toContain('function buildStudentServiceBodySignature(');
        expect(source).toContain('container.dataset.studentServiceChromeSignature !== chromeSignature');
        expect(source).toContain('container.dataset.studentServiceChromeSignature = chromeSignature');
        expect(source).toContain('const renderSignature = `${chromeSignature}::${bodySignature}`;');
        expect(source).not.toContain('ui.qaComposerExpanded ? \'1\' : \'0\'');
        expect(source).toContain('ui.draftQuestion?.askMode || \'public\'');
        expect(source).toContain('ui.draftQuestion?.anonymousMode ? \'1\' : \'0\'');
        expect(source).toContain('STUDENT_SERVICE_RUNTIME.storesRevision');
        expect(source).toContain('function buildStudentServiceQaContentFingerprint(');
    });

    it('memoizes student-service store normalization behind a revision gate', () => {
        const source = readStudentServiceRuntime();

        expect(source).toContain('storesRevision: 0');
        expect(source).toContain('storesNormalizedRevision: -1');
        expect(source).toContain('function invalidateStudentServiceStores()');
        expect(source).toContain('STUDENT_SERVICE_RUNTIME.storesNormalizedRevision === STUDENT_SERVICE_RUNTIME.storesRevision');
        expect(source).toContain('invalidateStudentServiceStores,');
    });

    it('primes lazy service and Q&A modules without blocking the first render', () => {
        const source = readStudentServiceRuntime();

        // Standalone entry preloads from the hub; SPA app.js no longer hosts SSVC runtime.
        expect(source).toContain('function preloadStudentServiceWorkspaceModules()');
        expect(source).toContain('preloadStudentServiceWorkspaceModules();');
        expect(source).toContain('preloadStudentServiceWorkspaceModules,');
        expect(readAsset('assets/js/app/app.js')).not.toContain('ensurePortalStudentServiceRuntimeLoaded');
    });

    it('remounts guidance modal without full page render when modal search changes', () => {
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const core = readAsset('assets/js/pages/student-service.js');

        expect(core).toContain('function setStudentServiceMarkup(element, key, markup)');
        expect(core).toContain('const studentServiceMarkupCache = new WeakMap();');
        expect(core).toContain('studentServiceMarkupCache.get(element)');
        expect(core).toContain('studentServiceMarkupCache.set(element, { key, markup })');
        expect(core).toContain('return false;');
        expect(core).toContain('return true;');
        expect(serviceModule).not.toContain('syncStudentServiceLaneRail');
        expect(core).toContain('if (isStudentServiceGuidanceModalOpen())');
        expect(core).toContain('remountStudentServiceGuidanceModal();');
    });

    it('dedupes SPA navigate transparency refresh in favor of syncAfterNavigate', () => {
        const navigation = readAsset('assets/js/features/navigation.js');
        const luxury = readAsset('assets/js/features/index-luxury.js')
            + readAsset('assets/js/features/luxury-index-sync-runtime.js');

        expect(navigation).not.toMatch(
            /if \(pageId === 'student-service'[\s\S]*?updateTransparency\(parseInt\(_savedTrans\)\)/
        );
        expect(luxury).toContain('function syncAfterNavigate(pageId)');
        expect(luxury).toContain('window.queueLuxuryTransparencyRefresh(parseInt(transparencyValue, 10), { persist: false });');
    });

    it('keeps student-service repeated surfaces on CSS-managed backdrop paths', () => {
        const utilities = readAsset('assets/js/features/luxury-index-runtime.js');

        expect(utilities).toContain("'.student-service-lane-card'");
        expect(utilities).toContain("'.student-service-ticket-card'");
        expect(utilities).not.toContain('isStudentServiceLargeSurface');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/student-service-route.css'))).toBe(false);
    });

    it('refreshes lazy Q&A and service hubs after module load without stale render signatures', () => {
        const source = readAsset('assets/js/pages/student-service.js')
            + readAsset('assets/js/pages/student-service-modules-runtime.js')
            + readAsset('assets/js/pages/student-service-page-runtime.js');
        const bodySignatureBlock = source.split('function buildStudentServiceBodySignature(')[1]?.split('\nfunction ')[0] || '';

        expect(bodySignatureBlock).toContain("hasStudentServiceQaModule() ? 'qa-ready' : 'qa-pending'");
        expect(bodySignatureBlock).toContain("hasStudentServiceServiceModule() ? 'service-ready' : 'service-pending'");
        expect(bodySignatureBlock).toContain('getStudentServicePublishedInboxFilterLayout().filters');
        expect(source).toContain('function rerenderStudentServicePageAfterModuleLoad()');
        expect(source).toContain('function isStudentServiceQaBodyStale()');
        expect(source).toContain('function scheduleStudentServiceModuleRerenderIfNeeded()');
        expect(source).toContain('function captureStudentServiceLazyModuleStubs()');
        expect(source).toContain('STUDENT_SERVICE_STUDENT_QA_HUB_STUB');
        expect(source).toContain('scheduleStudentServiceModuleRerenderIfNeeded()');
        expect(source).toContain('isStudentServiceQaBodyStale()');

        const hubStubBlocks = [
            source.split('function renderStudentServiceStudentHub(')[1]?.split('\nfunction ')[0] || '',
            source.split('function renderStudentServiceStudentQaHub(')[1]?.split('\nfunction ')[0] || '',
            source.split('function renderStudentServiceMyTicketsHub(')[1]?.split('\nfunction ')[0] || '',
            source.split('function renderStudentServiceResponderServiceLane(')[1]?.split('\nfunction ')[0] || '',
            source.split('function renderStudentServiceStaffQaFeed(')[1]?.split('\nfunction ')[0] || '',
            source.split('function renderStudentServiceStaffWorkbench(')[1]?.split('\nfunction ')[0] || ''
        ];

        for (const hubStubBlock of hubStubBlocks) {
            expect(hubStubBlock).toContain('rerenderStudentServicePageAfterModuleLoad()');
            expect(hubStubBlock).not.toMatch(/ensureStudentService(?:Qa|Service)Module\(\)\.then\(\(\) => renderStudentServicePage\(\)\)/);
        }
    });
});