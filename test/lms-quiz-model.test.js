import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    lmsQuizModelApi,
    installLmsQuizModel
} from '../assets/js/pages/lms-quiz-model.js';

function readSource(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

const {
    getAdminQuizTotalScore,
    jsQuote,
    normalizeLmsAntiCheatPolicy,
    createLmsQuizBuilderDraft,
    getLmsQuizStatusToneClass,
    getLmsQuizStatusBadge,
    buildEmptyLmsStudentQuizFocusState,
    LMS_DEFAULT_ANTI_CHEAT_POLICY
} = lmsQuizModelApi;

describe('lms-quiz-model', () => {
    beforeEach(() => {
        delete window.__KIU_LMS_QUIZ_MODEL_LOADED;
        delete window.KiuLmsQuizModel;
        installLmsQuizModel(window);
    });

    it('exports pure quiz helpers', () => {
        expect(window.__KIU_LMS_QUIZ_MODEL_LOADED).toBe(true);
        expect(window.KiuLmsQuizModel).toBe(lmsQuizModelApi);
        expect(typeof getAdminQuizTotalScore).toBe('function');
        expect(typeof normalizeLmsAntiCheatPolicy).toBe('function');
        expect(typeof createLmsQuizBuilderDraft).toBe('function');
        expect(LMS_DEFAULT_ANTI_CHEAT_POLICY).toBeTruthy();
    });

    it('sums admin quiz scores and quotes JS strings', () => {
        expect(getAdminQuizTotalScore({
            questions: [{ score: 2 }, { score: 3.5 }, { score: 'x' }]
        })).toBe(5.5);
        expect(jsQuote("it's")).toContain("\\'");
    });

    it('normalizes anti-cheat policy defaults and clamps intervals', () => {
        const policy = normalizeLmsAntiCheatPolicy({
            allowDebugTools: true,
            heartbeatMs: 50,
            processScanMs: 99999,
            blockedProcesses: ['Discord.exe', 'Discord.exe', '']
        });
        expect(policy.allowDebugTools).toBe(true);
        expect(policy.processScanning).toBe(true);
        expect(policy.heartbeatMs).toBe(1000);
        expect(policy.processScanMs).toBe(60000);
        expect(policy.blockedProcesses).toEqual(['Discord.exe']);
    });

    it('builds status badges and empty focus state', () => {
        expect(getLmsQuizStatusToneClass('open')).toBe('is-open');
        expect(getLmsQuizStatusToneClass('draft')).toBe('is-draft');
        expect(getLmsQuizStatusBadge('draft')).toEqual(expect.objectContaining({ label: 'Draft' }));
        expect(getLmsQuizStatusBadge('open').label).toBe('Open');
        const focus = buildEmptyLmsStudentQuizFocusState();
        expect(focus).toEqual(expect.objectContaining({
            active: false,
            resourceKey: '',
            quizId: ''
        }));
    });

    it('ESM leaf + bridge in lazy MODULE_URLS before quiz workspace', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtime = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const mod = readSource('assets/js/pages/lms-quiz-model.js');
        expect(mod).toContain('export function installLmsQuizModel');
        expect(tabs).toContain('lms-quiz-model.js');
        expect(tabs).toContain('lms-quiz-model-bridge.js');
        expect(tabs).toMatch(/lms-quiz-model\.js[\s\S]*type = 'module'|lms-quiz-model\|lms-whiteboard-model/);
        expect(tabs.indexOf('lms-quiz-model.js')).toBeLessThan(tabs.indexOf('lms-quiz-model-bridge.js'));
        expect(tabs.indexOf('lms-quiz-model-bridge.js')).toBeLessThan(tabs.indexOf('lms-quiz-blue-runtime.js'));
        expect(tabs.indexOf('lms-quiz-blue-runtime.js')).toBeLessThan(tabs.indexOf('lms-quiz-workspace-runtime.js'));
        expect(runtime).toContain('lms-quiz-model.js');
        expect(runtime).not.toMatch(/^function getAdminQuizTotalScore\b/m);
        expect(runtime).not.toMatch(/^function normalizeLmsAntiCheatPolicy\b/m);
        expect(runtime).not.toMatch(/^const LMS_DEFAULT_ANTI_CHEAT_POLICY\b/m);
    });
});
