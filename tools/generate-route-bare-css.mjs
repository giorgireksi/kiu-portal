import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const sourcePath = resolve(root, 'assets/css/lux-page-bare-lite.css');
const lines = (await readFile(sourcePath, 'utf8')).split(/(?<=\n)/);

// Keep the first 67 lines as the shared bare-shell contract. The remaining
// sections are grouped by route so a page does not parse every route's CSS.
const coreEnd = 76;
const bundles = {
    programs: [[77, 1594], [2714, 3260]],
    'admin-scheduler': [[1595, 2499]],
    'faculty-gradebook': [[2500, 2713], [3785, 3799], [4693, 5041], [5043, 6312], [11909, 12050], [46058, 46740]],
    lms: [[3261, 12050], [46616, 47313], [47958, 48783]],
    timetable: [[1595, 2499], [12051, 13231]],
    registration: [[12476, 13231]],
    personal: [[13232, 13577]],
    chancellery: [[12476, 13231], [13578, 13977], [22672, 23078]],
    'student-service': [[13978, 15635]],
    directory: [[15636, 21316]],
    news: [[21317, 22100]],
    library: [[22101, 22499]],
    orders: [[22527, 23758]],
    social: [[23759, 44560], [48222, 48927]],
    exams: [[43354, 46057]],
    'study-card': [[3785, 3799], [5043, 6312], [46058, 46740]],
};

function stripCssComments(source) {
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
    return `${withoutComments
        .split('\n')
        .map((line) => line.replace(/\s+$/g, ''))
        .join('\n')
        .trimEnd()}\n`;
}

function sectionText(ranges) {
    return ranges.map(([start, end]) => {
        if (start < 1 || end > lines.length || start > end) {
            throw new Error(`Invalid CSS range ${start}-${end}`);
        }
        return lines.slice(start - 1, end).join('');
    }).join('\n');
}

const header = (name, ranges) => [
    `/* Generated route bundle: ${name}. */`,
    '/* Source: assets/css/lux-page-bare-lite.css; regenerate with tools/generate-route-bare-css.mjs. */',
    `/* Included source lines: 1-${coreEnd}, ${ranges.map(([start, end]) => `${start}-${end}`).join(', ')}. */`,
    '',
].join('\n');

await mkdir(resolve(root, 'assets/css/route-bare/core'), { recursive: true });
await writeFile(resolve(root, 'assets/css/route-bare/core/lux-page-bare-lite.css'), [
    '/* Generated shared bare-shell contract. */',
    `/* Source: assets/css/lux-page-bare-lite.css lines 1-${coreEnd}. */`,
    '',
    stripCssComments(lines.slice(0, coreEnd).join('')),
].join(''), 'utf8');

for (const [name, ranges] of Object.entries(bundles)) {
    const output = resolve(root, `assets/css/route-bare/${name}/lux-page-bare-lite.css`);
    await mkdir(dirname(output), { recursive: true });
    const css = stripCssComments(sectionText(ranges));
    const thinHeader = [
        `/* Thin route diff: ${name}. Core in shared-lux-core.css */`,
        `/* Included source lines: ${ranges.map(([s, e]) => `${s}-${e}`).join(', ')}. */`,
        '',
    ].join('\n');
    await writeFile(output, thinHeader + css, 'utf8');
}

console.log(`Generated ${Object.keys(bundles).length + 1} route bare CSS bundles.`);
