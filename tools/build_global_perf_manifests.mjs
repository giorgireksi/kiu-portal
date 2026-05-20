import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = resolve(ROOT, 'artifacts', 'global-perf');

const ROOT_HTML_FILES = readdirSync(ROOT)
    .filter((name) => name.endsWith('.html'))
    .sort((left, right) => left.localeCompare(right));

const IMPORT_STATUS_OVERRIDES = {
    'calendar.html': {},
    'faculty-schedule.html': {},
    'gradebook.html': {},
    'login.html': {
        'assets/vendor/fontawesome/css/all.min.css': 'required at first paint',
        'assets/css/kiu-fonts.css': 'required at first paint',
        'assets/css/login-route.css': 'required at first paint',
        'assets/js/pages/login-runtime.js': 'required at first paint'
    },
    'faculty-gradebook.html': {
        'assets/js/pages/gradebook.js': 'required at first paint',
        'assets/js/app/app.js': 'required at first paint',
        'assets/js/app/api.js': 'required at first paint',
        'assets/js/app/auth.js': 'required at first paint',
        'assets/js/data/initial-state.js': 'required at first paint',
        'assets/js/app/state.js': 'required at first paint',
        'assets/js/shared/utilities.js': 'required at first paint',
        'assets/js/shared/faculty.js': 'required at first paint',
        'assets/js/features/navigation.js': 'required at first paint',
        'assets/js/features/ui.js': 'required at first paint',
        'assets/js/features/index-luxury.js': 'required at first paint'
    },
    'exams.html': {
        'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js': 'lazy-loadable',
        'https://unpkg.com/docx@9.5.0/build/index.umd.min.js': 'lazy-loadable',
        'https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js': 'lazy-loadable'
    },
    'protected-launch.html': {
        'assets/js/app/api.js': 'required at first paint'
    },
    'exam-portal.html': {
        'assets/js/pages/exam-portal.js': 'required at first paint'
    },
    'staff.html': {
        'assets/js/pages/staff-command-center.js': 'required at first paint',
        'assets/js/pages/staff-route-bootstrap.js': 'required at first paint'
    },
    'student-service.html': {
        'assets/js/pages/student-service.js': 'required at first paint'
    },
    'profile-view.html': {
        'assets/js/pages/directories.js': 'required at first paint'
    },
    'profile.html': {
        'assets/js/pages/registration.js': 'required at first paint',
        'assets/js/pages/planner.js': 'required at first paint'
    },
    'timetable.html': {
        'assets/js/pages/planner.js': 'required at first paint',
        'assets/css/timetable-route.css': 'required at first paint'
    },
    'social.html': {
        'assets/js/pages/social-mobile.js': 'required at first paint',
        'assets/js/pages/social-page.js': 'required at first paint'
    },
    'registration.html': {
        'assets/js/shared/messenger.js': 'unknown',
        'assets/js/pages/gradebook.js': 'unknown',
        'assets/js/pages/lms.js': 'unknown',
        'assets/js/pages/registration.js': 'required at first paint',
        'assets/js/pages/planner.js': 'unknown',
        'assets/js/pages/directories.js': 'unknown',
        'assets/js/pages/student-registration.js': 'unknown',
        'assets/js/pages/admin-registration.js': 'unknown'
    },
    'career-market.html': {
        'assets/js/shared/messenger.js': 'unknown',
        'assets/js/features/ui.js': 'unknown',
        'assets/js/features/index-luxury.js': 'unknown'
    }
};

const TIMER_PATTERNS = [
    { kind: 'setInterval', regex: /setInterval\s*\(/g },
    { kind: 'requestAnimationFrame', regex: /requestAnimationFrame\s*\(/g },
    { kind: 'MutationObserver', regex: /MutationObserver\s*\(/g }
];

const OVERLAY_PATTERNS = [
    /style\.cssText\s*=\s*['"][^'"]*position:fixed;\s*inset:0/gi,
    /insertAdjacentHTML\s*\([^)]*position:fixed;\s*inset:0/gi,
    /document\.body\.appendChild\(overlay\)/gi,
    /modal\.style\.cssText\s*=\s*['"][^'"]*position:fixed;\s*inset:0/gi
];

const INNER_HTML_PATTERNS = [
    { kind: 'innerHTML=', regex: /innerHTML\s*=/g },
    { kind: 'insertAdjacentHTML', regex: /insertAdjacentHTML\s*\(/g },
    { kind: 'createContextualFragment', regex: /createContextualFragment\s*\(/g }
];

function normalizeImportPath(rawPath = '') {
    return String(rawPath || '').split('?')[0].trim();
}

function classifyImport(fileName, normalizedPath, type) {
    if (!normalizedPath) return 'unknown';
    const overrides = IMPORT_STATUS_OVERRIDES[fileName] || {};
    if (overrides[normalizedPath]) return overrides[normalizedPath];

    if (type === 'style') {
        return fileName === 'calendar.html' || fileName === 'gradebook.html' || fileName === 'faculty-schedule.html'
            ? 'unknown'
            : 'required at first paint';
    }

    if (/theme-primer\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/^https?:\/\//i.test(normalizedPath)) return 'unknown';
    if (/\/pages\/.+\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/shared\/orders-workspace\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/pages\/staff-route-bootstrap\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/shared\/messenger\.js$/i.test(normalizedPath)) return 'unknown';
    if (/\/features\/ui\.js$/i.test(normalizedPath)) return 'unknown';
    if (/\/features\/index-luxury\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/app\/(app|api|auth|state)\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/data\/initial-state\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/shared\/(utilities|faculty|faculty-core)\.js$/i.test(normalizedPath)) return 'required at first paint';
    if (/\/features\/navigation\.js$/i.test(normalizedPath)) return 'required at first paint';
    return 'unknown';
}

function extractImportsFromHtml(fileName) {
    const fullPath = join(ROOT, fileName);
    const source = readFileSync(fullPath, 'utf8');
    const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
    const styleRegex = /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
    const imports = [];
    let match;

    while ((match = scriptRegex.exec(source))) {
        const src = String(match[1] || '').trim();
        const normalized = normalizeImportPath(src);
        imports.push({
            type: 'script',
            src,
            normalized,
            status: classifyImport(fileName, normalized, 'script')
        });
    }

    while ((match = styleRegex.exec(source))) {
        const href = String(match[1] || '').trim();
        const normalized = normalizeImportPath(href);
        imports.push({
            type: 'style',
            src: href,
            normalized,
            status: classifyImport(fileName, normalized, 'style')
        });
    }

    return imports;
}

function gatherSourceFiles() {
    const results = [];
    const queue = [join(ROOT, 'assets')];
    while (queue.length) {
        const current = queue.pop();
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'artifacts' || entry.name.startsWith('.')) continue;
            const fullPath = join(current, entry.name);
            if (entry.isDirectory()) {
                queue.push(fullPath);
            } else if (/\.(js|css|html)$/i.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }
    return results.sort((left, right) => left.localeCompare(right));
}

function getLineNumber(source, index) {
    let line = 1;
    for (let cursor = 0; cursor < index; cursor += 1) {
        if (source.charCodeAt(cursor) === 10) line += 1;
    }
    return line;
}

function scanTimerSites(files) {
    const entries = [];
    for (const fullPath of files) {
        const rel = relative(ROOT, fullPath).replace(/\\/g, '/');
        const source = readFileSync(fullPath, 'utf8');
        for (const { kind, regex } of TIMER_PATTERNS) {
            for (const match of source.matchAll(regex)) {
                entries.push({
                    file: rel,
                    kind,
                    line: getLineNumber(source, match.index || 0)
                });
            }
        }
    }
    return entries;
}

function scanOverlaySites(files) {
    const entries = [];
    for (const fullPath of files) {
        const rel = relative(ROOT, fullPath).replace(/\\/g, '/');
        const source = readFileSync(fullPath, 'utf8');
        for (const regex of OVERLAY_PATTERNS) {
            for (const match of source.matchAll(regex)) {
                entries.push({
                    file: rel,
                    line: getLineNumber(source, match.index || 0),
                    snippet: String(match[0] || '').slice(0, 160)
                });
            }
        }
    }
    return entries;
}

function scanInnerHtmlSites(files) {
    const entries = [];
    for (const fullPath of files) {
        const rel = relative(ROOT, fullPath).replace(/\\/g, '/');
        const source = readFileSync(fullPath, 'utf8');
        for (const { kind, regex } of INNER_HTML_PATTERNS) {
            const matches = [...source.matchAll(regex)];
            if (!matches.length) continue;
            entries.push({
                file: rel,
                kind,
                count: matches.length,
                lines: matches.slice(0, 12).map((match) => getLineNumber(source, match.index || 0))
            });
        }
    }
    return entries;
}

function groupByFile(entries) {
    return entries.reduce((acc, entry) => {
        if (!acc[entry.file]) acc[entry.file] = [];
        acc[entry.file].push(entry);
        return acc;
    }, {});
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const importManifest = ROOT_HTML_FILES.map((file) => ({
    file,
    imports: extractImportsFromHtml(file)
}));

const sourceFiles = gatherSourceFiles();
const timerManifest = scanTimerSites(sourceFiles);
const overlayManifest = scanOverlaySites(sourceFiles);
const innerHtmlManifest = scanInnerHtmlSites(sourceFiles);

writeFileSync(resolve(OUTPUT_DIR, 'page-entry-import-manifest.json'), JSON.stringify(importManifest, null, 2));
writeFileSync(resolve(OUTPUT_DIR, 'timer-manifest.json'), JSON.stringify(timerManifest, null, 2));
writeFileSync(resolve(OUTPUT_DIR, 'overlay-manifest.json'), JSON.stringify(overlayManifest, null, 2));
writeFileSync(resolve(OUTPUT_DIR, 'whole-root-rerender-manifest.json'), JSON.stringify(innerHtmlManifest, null, 2));

const summary = {
    generatedAt: new Date().toISOString(),
    rootHtmlCount: ROOT_HTML_FILES.length,
    importPages: importManifest.length,
    timerEntries: timerManifest.length,
    overlayEntries: overlayManifest.length,
    rerenderEntries: innerHtmlManifest.length,
    timerFiles: Object.keys(groupByFile(timerManifest)).length,
    overlayFiles: Object.keys(groupByFile(overlayManifest)).length,
    rerenderFiles: Object.keys(groupByFile(innerHtmlManifest)).length
};

writeFileSync(resolve(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
