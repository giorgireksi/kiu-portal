import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();

function readSource(relativePath) {
    const full = join(ROOT, relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Admin-tools surface — must be free of paint-less legacy CTA families. */
const ADMIN_TOOLS_SURFACE = [
    'admin-tools.html',
    'assets/js/features/index-admin-tools.plain.js',
    'assets/js/features/index-admin-tools.bundle-source.js',
    'assets/js/pages/registration-shared.js',
    'assets/js/pages/registration.js',
    'assets/js/pages/admin-registration.js',
    'assets/js/pages/admin-registration-boot-runtime.js',
    'assets/js/pages/admin-registration-cms-runtime.js',
    'assets/js/pages/admin-registration-track.js',
    'assets/js/pages/admin-registration-seats-runtime.js',
];

const BANNED_ADMIN_TOOLS_CTAS = [
    'social-neo-btn',
    'admin-edit-staff-btn',
    'admin-reg-icon-action',
    'kiu-btn',
];

/**
 * Temporary shrink-only allowlist for remaining non-social social-neo-btn leaks.
 * Do not add files here — migrate to lux-* instead.
 */
const LEGACY_NEO_ALLOWLIST = new Set([
    'assets/js/pages/student-service-qa.js',
    'assets/js/pages/student-service-service.js',
    'assets/js/pages/student-service-chrome.js',
    'assets/js/pages/student-service-ops-runtime.js',
    'assets/js/pages/student-service-filters.js',
    'assets/js/pages/lms-section-quiz-runtime.js',
    'assets/js/pages/lms-assignments-runtime.js',
    'assets/js/pages/lms-live-quiz-session-runtime.js',
    'assets/js/pages/lms-personal-dashboard-runtime.js',
    'assets/js/pages/lms-live-quiz-podium-runtime.js',
    'assets/js/pages/gradebook-workspace.js',
    'assets/js/pages/gradebook-staff.js',
    'assets/js/pages/gradebook-components-runtime.js',
]);

function isSocialDomainPath(relPath) {
    const base = relPath.split('/').pop() || '';
    return base === 'social.html' || /^social[-.]/.test(base) || base.startsWith('social');
}

function walkFiles(dir, out = []) {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '_archive') continue;
            walkFiles(full, out);
            continue;
        }
        if (/\.(js|html)$/.test(entry.name)) out.push(full);
    }
    return out;
}

describe('legacy CTA denylist', () => {
    it('admin-tools surface has zero paint-less legacy CTA classes', () => {
        for (const rel of ADMIN_TOOLS_SURFACE) {
            const source = readSource(rel);
            for (const banned of BANNED_ADMIN_TOOLS_CTAS) {
                expect(source, `${rel} must not contain ${banned}`).not.toContain(banned);
            }
        }
    });

    it('social-neo-btn is confined to social domain or the shrink-only allowlist', () => {
        const roots = [
            join(ROOT, 'assets/js'),
            join(ROOT, 'assets/js/features'),
            join(ROOT, 'assets/js/pages'),
            join(ROOT, 'assets/js/shared'),
            ROOT,
        ];
        const seen = new Set();
        const offenders = [];

        for (const root of roots) {
            for (const full of walkFiles(root)) {
                const rel = relative(ROOT, full).replace(/\\/g, '/');
                if (seen.has(rel)) continue;
                if (rel.startsWith('test/') || rel.startsWith('node_modules/')) continue;
                if (!rel.endsWith('.js') && !rel.endsWith('.html')) continue;
                // Only scan portal markup/runtime under assets or root html
                if (!rel.startsWith('assets/') && !rel.endsWith('.html')) continue;
                seen.add(rel);
                const source = readFileSync(full, 'utf8');
                if (!source.includes('social-neo-btn')) continue;
                if (isSocialDomainPath(rel)) continue;
                if (LEGACY_NEO_ALLOWLIST.has(rel)) continue;
                offenders.push(rel);
            }
        }

        expect(offenders, `social-neo-btn outside social/allowlist:\n${offenders.join('\n')}`).toEqual([]);
    });
});
