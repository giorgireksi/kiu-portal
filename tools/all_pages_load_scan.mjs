import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const OUTPUT_JSON_PATH = resolve(ROOT, 'artifacts/all-pages-load-scan.json');
const OUTPUT_MD_PATH = resolve(ROOT, 'artifacts/all-pages-load-scan.md');
const PAGE_SHARED_THRESHOLD = 0.6;

const pageFiles = readdirSync(ROOT)
    .filter((name) => name.endsWith('.html'))
    .sort((left, right) => left.localeCompare(right));

function roundKb(bytes) {
    return Math.round((Number(bytes || 0) / 1024) * 10) / 10;
}

function normalizeImportPath(rawPath = '') {
    return String(rawPath || '')
        .trim()
        .split('#')[0]
        .split('?')[0];
}

function isExternalPath(pathname) {
    return /^(?:[a-z]+:)?\/\//i.test(pathname)
        || /^(?:data|blob|mailto|tel|javascript):/i.test(pathname);
}

function resolveLocalImport(pathname) {
    if (!pathname || isExternalPath(pathname)) return null;
    const trimmed = pathname.replace(/^\.\//, '').replace(/^\//, '');
    const fullPath = resolve(ROOT, trimmed);
    if (!fullPath.startsWith(ROOT)) return null;
    if (!existsSync(fullPath)) return null;
    const stats = statSync(fullPath);
    if (!stats.isFile()) return null;
    return {
        fullPath,
        bytes: stats.size
    };
}

function collectInlineBlockBytes(source, regex) {
    let total = 0;
    for (const match of source.matchAll(regex)) {
        total += Buffer.byteLength(String(match[1] || ''), 'utf8');
    }
    return total;
}

function collectImports(source, regex, type) {
    const imports = [];
    for (const match of source.matchAll(regex)) {
        const rawPath = String(match[1] || '').trim();
        const normalized = normalizeImportPath(rawPath);
        const local = resolveLocalImport(normalized);
        imports.push({
            type,
            rawPath,
            normalized,
            local: Boolean(local),
            bytes: local?.bytes || 0
        });
    }
    return imports;
}

function analyzePage(fileName) {
    const fullPath = resolve(ROOT, fileName);
    const source = readFileSync(fullPath, 'utf8');
    const stats = statSync(fullPath);
    const scriptImports = collectImports(source, /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi, 'script');
    const styleImports = collectImports(source, /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi, 'style');
    const imports = [...styleImports, ...scriptImports];
    const inlineScriptBytes = collectInlineBlockBytes(
        source,
        /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
    );
    const inlineStyleBytes = collectInlineBlockBytes(
        source,
        /<style\b[^>]*>([\s\S]*?)<\/style>/gi
    );

    return {
        file: fileName,
        htmlBytes: stats.size,
        htmlKb: roundKb(stats.size),
        inlineScriptKb: roundKb(inlineScriptBytes),
        inlineStyleKb: roundKb(inlineStyleBytes),
        importCount: imports.length,
        scriptCount: scriptImports.length,
        styleCount: styleImports.length,
        imports
    };
}

const pages = pageFiles.map(analyzePage);
const sharedCutoff = Math.max(2, Math.ceil(pages.length * PAGE_SHARED_THRESHOLD));
const assetUsage = new Map();

for (const page of pages) {
    const uniqueImports = new Set(
        page.imports
            .filter((entry) => entry.local)
            .map((entry) => entry.normalized)
    );
    uniqueImports.forEach((normalized) => {
        assetUsage.set(normalized, (assetUsage.get(normalized) || 0) + 1);
    });
}

function summarizePage(page) {
    const importBytes = page.imports.reduce((sum, entry) => sum + entry.bytes, 0);
    const sharedImports = page.imports.filter(
        (entry) => entry.local && (assetUsage.get(entry.normalized) || 0) >= sharedCutoff
    );
    const sharedImportBytes = sharedImports.reduce((sum, entry) => sum + entry.bytes, 0);
    const externalImports = page.imports
        .filter((entry) => !entry.local)
        .map((entry) => entry.rawPath);
    const largestImports = page.imports
        .slice()
        .sort((left, right) => right.bytes - left.bytes)
        .slice(0, 6)
        .map((entry) => ({
            path: entry.normalized || entry.rawPath,
            type: entry.type,
            kb: roundKb(entry.bytes)
        }));
    const initialTransferKb = roundKb(page.htmlBytes + importBytes);
    const sharedImportKb = roundKb(sharedImportBytes);
    const pageSpecificImportKb = roundKb(importBytes - sharedImportBytes);
    const flags = [];

    if (page.htmlKb >= 100) flags.push('oversized-html');
    if (page.inlineScriptKb >= 15) flags.push('heavy-inline-script');
    if (sharedImportKb >= 1500) flags.push('heavy-shared-shell');
    if (pageSpecificImportKb >= 350) flags.push('heavy-page-specific-assets');
    if (initialTransferKb >= 2200) flags.push('very-heavy-first-load');
    if (externalImports.length) flags.push('external-dependency');

    return {
        file: page.file,
        htmlKb: page.htmlKb,
        inlineScriptKb: page.inlineScriptKb,
        inlineStyleKb: page.inlineStyleKb,
        styleCount: page.styleCount,
        scriptCount: page.scriptCount,
        importKb: roundKb(importBytes),
        sharedImportKb,
        pageSpecificImportKb,
        initialTransferKb,
        externalImports,
        largestImports,
        flags
    };
}

const pageSummaries = pages
    .map(summarizePage)
    .sort((left, right) => right.initialTransferKb - left.initialTransferKb);

const commonAssets = [...assetUsage.entries()]
    .map(([path, usageCount]) => {
        const local = resolveLocalImport(path);
        return {
            path,
            usageCount,
            kb: roundKb(local?.bytes || 0)
        };
    })
    .filter((entry) => entry.usageCount >= sharedCutoff)
    .sort((left, right) => {
        if (right.kb !== left.kb) return right.kb - left.kb;
        return right.usageCount - left.usageCount;
    });

const output = {
    scannedAt: new Date().toISOString(),
    pageCount: pageSummaries.length,
    sharedCutoff,
    summary: {
        heaviestPage: pageSummaries[0]?.file || '',
        heaviestInitialTransferKb: pageSummaries[0]?.initialTransferKb || 0,
        medianInitialTransferKb: pageSummaries[Math.floor(pageSummaries.length / 2)]?.initialTransferKb || 0
    },
    commonAssets,
    pages: pageSummaries
};

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2));

const markdownLines = [
    '# All Pages Load Scan',
    '',
    `Scanned: ${output.scannedAt}`,
    `Pages: ${output.pageCount}`,
    `Shared asset cutoff: imported by at least ${sharedCutoff} pages`,
    '',
    '## Heaviest Pages',
    '',
    '| Page | HTML KB | Imported KB | Shared KB | Page-specific KB | First-load KB | Flags |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |'
];

pageSummaries.slice(0, 15).forEach((page) => {
    markdownLines.push(
        `| ${page.file} | ${page.htmlKb} | ${page.importKb} | ${page.sharedImportKb} | ${page.pageSpecificImportKb} | ${page.initialTransferKb} | ${page.flags.join(', ') || '-'} |`
    );
});

markdownLines.push('', '## Common Shared Assets', '', '| Asset | KB | Pages |', '| --- | ---: | ---: |');
commonAssets.slice(0, 20).forEach((asset) => {
    markdownLines.push(`| ${asset.path} | ${asset.kb} | ${asset.usageCount} |`);
});

markdownLines.push('', '## Worst-Page Details', '');
pageSummaries.slice(0, 8).forEach((page) => {
    markdownLines.push(`### ${page.file}`);
    markdownLines.push('');
    markdownLines.push(`- First-load KB: ${page.initialTransferKb}`);
    markdownLines.push(`- HTML KB: ${page.htmlKb}`);
    markdownLines.push(`- Shared import KB: ${page.sharedImportKb}`);
    markdownLines.push(`- Page-specific import KB: ${page.pageSpecificImportKb}`);
    markdownLines.push(`- Inline script KB: ${page.inlineScriptKb}`);
    markdownLines.push(`- Top imports: ${page.largestImports.map((entry) => `${entry.path} (${entry.kb} KB)`).join('; ') || '-'}`);
    if (page.externalImports.length) {
        markdownLines.push(`- External imports: ${page.externalImports.join(', ')}`);
    }
    markdownLines.push('');
});

writeFileSync(OUTPUT_MD_PATH, `${markdownLines.join('\n')}\n`);

console.log(`Wrote ${OUTPUT_JSON_PATH}`);
console.log(`Wrote ${OUTPUT_MD_PATH}`);
