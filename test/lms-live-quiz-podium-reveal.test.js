import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match ? match[0] : '';
}

describe('LMS live quiz podium reveal', () => {
    it('loads podium runtime between workspace and UI modules', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const lmsHtml = readSource('lms.html');
        const workspaceIndex = classroomSource.indexOf('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const podiumIndex = classroomSource.indexOf('assets/js/pages/lms-live-quiz-podium-runtime.js');
        const uiIndex = classroomSource.indexOf('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(podiumIndex).toBeGreaterThan(workspaceIndex);
        expect(uiIndex).toBeGreaterThan(podiumIndex);
        expect(classroomSource).toContain('assets/js/pages/lms-live-quiz-podium-runtime.js?v=20260609-livequiz-podium1');
        expect(lmsHtml).not.toContain('assets/js/pages/lms-live-quiz-podium-runtime.js');
    });

    it('normalizes podium session fields and tracks them in broadcast signature', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        const normalizeBlock = extractFunctionBody(workspaceSource, 'normalizeLmsLiveSession');
        expect(normalizeBlock).toContain('showPodium: session.showPodium === true');
        expect(normalizeBlock).toContain('podiumRevealAt: session.podiumRevealAt || null');

        const broadcastFn = workspaceSource.match(/function getLmsLiveQuizBroadcastSignature\([\s\S]*?\n\}/)?.[0] || '';
        expect(broadcastFn).toContain("String(session?.showPodium || false)");
        expect(broadcastFn).toContain("String(session?.podiumRevealAt || '')");
    });

    it('preserves local podium overrides during remote merge', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();
        const mergeBlock = extractFunctionBody(workspaceSource, 'mergeLmsLiveStaffQuestionOverrides');

        expect(mergeBlock).toContain('if (localSession.showPodium != null) remoteSession.showPodium = localSession.showPodium');
        expect(mergeBlock).toContain('if (localSession.podiumRevealAt) remoteSession.podiumRevealAt = localSession.podiumRevealAt');
    });

    it('guards podium reveal until the session ends', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const guardBlock = extractFunctionBody(uiSource, 'canRevealLmsLiveQuizPodium');

        expect(guardBlock).toContain("String(session.status || '').toLowerCase() === 'ended'");
        expect(guardBlock).not.toContain("['revealed', 'completed'].includes");
        expect(guardBlock).not.toContain('onLastQuestion');

        const availabilityBlock = extractFunctionBody(uiSource, 'getLmsLiveStaffActionAvailability');
        expect(availabilityBlock).toContain('podium:');
        expect(availabilityBlock).toContain('canRevealLmsLiveQuizPodium(session)');
        expect(availabilityBlock).toContain('active: Boolean(session?.showPodium)');
    });

    it('routes reveal and dismiss through broadcast sync and overlay hooks', () => {
        const uiSource = readLmsLiveQuizUiChain();

        const revealBlock = extractFunctionBody(uiSource, 'revealLmsLiveQuizPodium');
        expect(revealBlock).toContain('canRevealLmsLiveQuizPodium(session)');
        expect(revealBlock).toContain('session.showPodium = true');
        expect(revealBlock).toContain('session.podiumRevealAt = new Date().toISOString()');
        expect(revealBlock).toContain("syncStaffLmsLiveQuizControl(resourceKey, 'podium-reveal')");
        expect(revealBlock).not.toContain('syncLmsLivePodiumOverlay');

        const dismissBlock = extractFunctionBody(uiSource, 'dismissLmsLiveQuizPodium');
        expect(dismissBlock).toContain('session.showPodium = false');
        expect(dismissBlock).toContain('session.podiumRevealAt = null');
        expect(dismissBlock).toContain('unmountLmsLivePodiumOverlay()');
        expect(dismissBlock).toContain("syncStaffLmsLiveQuizControl(resourceKey, 'podium-dismiss')");

        expect(uiSource).toContain("renderLmsLiveStaffActionButton('podium'");
        expect(uiSource).toContain('renderLmsLivePodiumQueueButton');
        expect(uiSource).toContain('revealLmsLiveQuizPodium,');
        expect(uiSource).toContain('dismissLmsLiveQuizPodium,');
    });

    it('finalizes podium overlay once per refresh instead of patching inline', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function finalizeLmsLivePodiumOverlay(resourceKey)');
        expect(uiSource).toMatch(/paintLmsLiveQuizSectionContent[\s\S]*finalizeLmsLivePodiumOverlay/);
        expect(uiSource).toMatch(/refreshLmsLiveQuizUi[\s\S]*finalizeLmsLivePodiumOverlay/);

        const broadcastBlock = extractFunctionBody(uiSource, 'updateLmsLiveQuizBroadcastUi');
        const queueBlock = extractFunctionBody(uiSource, 'updateLmsLiveQuizQueueUi');
        const volatileBlock = extractFunctionBody(uiSource, 'updateLmsLiveQuizVolatileUi');
        expect(broadcastBlock).not.toContain('syncLmsLivePodiumOverlay');
        expect(queueBlock).not.toContain('syncLmsLivePodiumOverlay');
        expect(volatileBlock).not.toContain('syncLmsLivePodiumOverlay');
    });

    it('renders fullscreen podium overlay with staggered reveal order', () => {
        const podiumSource = readSource('assets/js/pages/lms-live-quiz-podium-runtime.js');

        expect(podiumSource).toContain("id = 'lms-live-podium-overlay'");
        expect(podiumSource).toContain('data-lms-podium-rank');
        expect(podiumSource).toContain('const top3 = [leaders[2] || null, leaders[1] || null, leaders[0] || null]');
        expect(podiumSource).toContain('const ranks = [3, 2, 1]');
        expect(podiumSource).toContain('const revealOrder = [3, 2, 1]');
        expect(podiumSource).toContain('renderLmsLivePodiumConfettiMarkup');
        expect(podiumSource).toContain('dismissLmsLiveQuizPodium');
        expect(podiumSource).toContain('prefers-reduced-motion: reduce');
        expect(podiumSource).toContain('mountLmsLivePodiumOverlay');
        expect(podiumSource).toContain('unmountLmsLivePodiumOverlay');
        expect(podiumSource).toContain('syncLmsLivePodiumOverlay');
        expect(podiumSource).toContain('window.__lmsLivePodiumMountedAt === revealAt');
        expect(podiumSource).toContain('overlay.dataset.lmsPodiumRevealAt = revealAt');
    });

    it('styles podium overlay above workspace chrome with animation keyframes', () => {
    });
});