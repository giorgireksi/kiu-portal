import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('protected quiz host regressions', () => {
    it('derives allowed hostnames from configured app/backend URLs instead of loopback only', () => {
        const protectedExamSource = readSource('backend/platform/domains/protected-exam-service.js');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const protectedQuizRuntimeSource = readSource('assets/js/pages/lms-protected-quiz-runtime.js');

        expect(protectedExamSource).toContain('collectConfiguredHostnames(this.appUrl, this.backendUrl)');
        expect(protectedExamSource).toContain("process.env.KIU_PROTECTED_QUIZ_ALLOWED_DOMAINS");
        expect(protectedExamSource).toContain("'127.0.0.1'");
        expect(protectedQuizRuntimeSource).toContain('function buildAntiCheatDesktopBridgeOrigins()');
        expect(protectedQuizRuntimeSource).toContain("pushOrigin(`${protocol}//${hostname}:47835`);");
        expect(protectedQuizRuntimeSource).not.toContain("const ANTI_CHEAT_DESKTOP_BRIDGE_ORIGINS = ['http://127.0.0.1:47835', 'http://localhost:47835'];");
        expect(lmsSource).not.toContain('function buildAntiCheatDesktopBridgeOrigins()');
    });
});
