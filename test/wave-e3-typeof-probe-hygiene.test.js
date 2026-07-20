/**
 * CONTRACT: Wave E3 — Typeof probe hygiene ≥8: ssForward stubs in student-service; TYPEOF_WINDOW_MAX ≤900; measured count below 943.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const TYPEOF_WINDOW_MAX = 900;
const PRE_E3_FLOOR = 943;

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function listAssetsJsFiles(dir = join(ROOT, 'assets/js'), acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) listAssetsJsFiles(full, acc);
        else if (entry.name.endsWith('.js')) acc.push(full);
    }
    return acc;
}

function countTypeofWindowProbes() {
    const re = /\btypeof\s+window\.([A-Za-z_$][\w$]*)/g;
    let total = 0;
    for (const file of listAssetsJsFiles()) {
        const source = readFileSync(file, 'utf8');
        re.lastIndex = 0;
        while (re.exec(source) !== null) total += 1;
    }
    return total;
}

describe('Wave E3 typeof probe hygiene', () => {
    it('docs + queue claim E3 / #15 ≥8', () => {
        expect(existsSync(join(ROOT, 'docs/js-typeof-probe-hygiene.md'))).toBe(true);
        expect(read('docs/js-typeof-probe-hygiene.md')).toContain('ssForwardToLoadedModule');
        expect(read('docs/js-typeof-probe-hygiene.md')).toMatch(/900/);

        const queue = read('docs/engineering-band-queue.md');
        expect(queue).toMatch(/E3\s*✅/);
        expect(queue).toMatch(/typeof|probe hygiene/i);
        expect(queue).toMatch(/\*\*≥8\*\*/);
        expect(read('docs/engineering-a-plus-frontend-js.md')).toMatch(/E3\s*✅/);
    });

    it('student-service host uses ssForwardToLoadedModule for lazy stubs', () => {
        const host = read('assets/js/pages/student-service.js');
        expect(host).toContain('function ssForwardToLoadedModule');
        const forwards = host.match(/ssForwardToLoadedModule\(/g) || [];
        expect(forwards.length).toBeGreaterThanOrEqual(50);
        const typeofWindow = host.match(/\btypeof\s+window\./g) || [];
        expect(typeofWindow.length).toBeLessThanOrEqual(5);
    });

    it('architecture gate TYPEOF_WINDOW_MAX is ≤900 and only ratchets down', () => {
        const guard = read('tools/check-architecture-guardrails.js');
        const match = guard.match(/TYPEOF_WINDOW_MAX\s*=\s*(\d+)/);
        expect(match).toBeTruthy();
        const max = Number(match[1]);
        expect(max).toBeLessThanOrEqual(TYPEOF_WINDOW_MAX);
        expect(max).toBeLessThan(PRE_E3_FLOOR);
    });

    it(`measured typeof window.X count is < ${PRE_E3_FLOOR} and ≤ TYPEOF_WINDOW_MAX`, () => {
        const count = countTypeofWindowProbes();
        expect(count).toBeLessThan(PRE_E3_FLOOR);
        expect(count).toBeLessThanOrEqual(TYPEOF_WINDOW_MAX);
    });
});
