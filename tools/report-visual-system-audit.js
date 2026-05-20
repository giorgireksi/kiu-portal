const fs = require('fs');
const path = require('path');
const {
    ROOT,
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings
} = require('./visual-route-classification');

function readText(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function detectMobileShellMode(source) {
    if (source.includes('assets/js/pages/standalone-mobile-shell.js')) return 'shared-standalone';
    if (source.includes('assets/js/pages/index-mobile-shell.js')) return 'index-shared';
    if (source.includes('assets/js/pages/social-mobile.js')) return 'social-shared';
    if (source.includes('assets/js/pages/staff-mobile-shell.js')) return 'staff-shared';
    if (source.includes('(function initMobileExperience(){')) return 'legacy-inline';
    return 'none';
}

function getPageScripts(source) {
    const matches = Array.from(source.matchAll(/<script(?: defer)? src="([^"]+)"/g));
    return matches
        .map((match) => String(match[1] || '').split('?')[0])
        .filter((href) => href.startsWith('assets/js/pages/'))
        .sort();
}

function getSharedRouteCssDrift(cssFiles) {
    return cssFiles
        .filter((file) => routeCssSharedSelectorZeroBudgetFiles.has(file))
        .flatMap((file) => {
            const findings = getSharedRouteCssOverrideFindings(readText(file));
            return findings.length ? [{ file, findings }] : [];
        });
}

function buildAuditRow(page) {
    const source = readText(page);
    const classification = routeVisualClassification[page] || {
        category: 'unclassified',
        dedicatedCss: [],
        mobileShell: 'unknown'
    };
    const actualDedicatedCss = getDedicatedRouteCss(source);
    const actualMobileShell = detectMobileShellMode(source);
    const inlineStyleCount = (source.match(/<style>/g) || []).length;
    const hasStandaloneConfig = source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    const luxuryShell = source.includes('assets/css/index-luxury.css');
    const allowInlineStyle = allowedLuxuryShellInlineStylePages.has(page);
    const sharedCssOverrideDrift = getSharedRouteCssDrift(actualDedicatedCss);

    return {
        page,
        category: classification.category,
        luxuryShell,
        expectedDedicatedCss: classification.dedicatedCss,
        actualDedicatedCss,
        dedicatedCssMatches: JSON.stringify([...classification.dedicatedCss].sort()) === JSON.stringify(actualDedicatedCss),
        expectedMobileShell: classification.mobileShell,
        actualMobileShell,
        mobileShellMatches: classification.mobileShell === actualMobileShell,
        inlineStyleCount,
        allowInlineStyle,
        inlineStyleBudgetOk: luxuryShell ? (allowInlineStyle ? inlineStyleCount > 0 : inlineStyleCount === 0) : true,
        sharedCssOverrideDrift,
        hasStandaloneConfig,
        pageScripts: getPageScripts(source)
    };
}

function printSummary(rows) {
    const total = rows.length;
    const luxuryCount = rows.filter((row) => row.luxuryShell).length;
    const standaloneShared = rows.filter((row) => row.actualMobileShell === 'shared-standalone').length;
    const specialSurfaces = rows.filter((row) => row.category === 'special-surface').length;
    const routeCssPages = rows.filter((row) => row.actualDedicatedCss.length > 0).length;
    const inlineStylePages = rows.filter((row) => row.inlineStyleCount > 0).length;
    console.log('Visual System Audit');
    console.log(`Total HTML routes: ${total}`);
    console.log(`Luxury-shell routes: ${luxuryCount}`);
    console.log(`Shared standalone mobile routes: ${standaloneShared}`);
    console.log(`Special-surface routes: ${specialSurfaces}`);
    console.log(`Routes with dedicated route CSS: ${routeCssPages}`);
    console.log(`Routes with inline <style> blocks: ${inlineStylePages}`);
    console.log('');
}

function printTable(rows) {
    const headers = ['Page', 'Category', 'Mobile', 'Route CSS', 'Shared CSS drift', 'Inline <style>', 'Config', 'Page scripts'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    rows.forEach((row) => {
        lines.push([
            row.page,
            row.category,
            row.actualMobileShell,
            row.actualDedicatedCss.join(', ') || '(none)',
            row.sharedCssOverrideDrift.length
                ? row.sharedCssOverrideDrift.map((entry) => `${entry.file} [${entry.findings.join(', ')}]`).join('; ')
                : 'none',
            String(row.inlineStyleCount),
            row.hasStandaloneConfig ? 'yes' : 'no',
            row.pageScripts.join(', ') || '(none)'
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printDrift(rows) {
    const drift = rows.filter((row) => (
        !row.dedicatedCssMatches
        || !row.mobileShellMatches
        || !row.inlineStyleBudgetOk
        || row.sharedCssOverrideDrift.length > 0
    ));
    console.log('\nDrift Findings');
    if (!drift.length) {
        console.log('No route drift found against the current visual classification and guardrail expectations.');
        return;
    }
    drift.forEach((row) => {
        console.log(`- ${row.page}`);
        if (!row.dedicatedCssMatches) {
            console.log(`  route CSS expected: ${row.expectedDedicatedCss.join(', ') || '(none)'}`);
            console.log(`  route CSS actual: ${row.actualDedicatedCss.join(', ') || '(none)'}`);
        }
        if (!row.mobileShellMatches) {
            console.log(`  mobile shell expected: ${row.expectedMobileShell}`);
            console.log(`  mobile shell actual: ${row.actualMobileShell}`);
        }
        if (!row.inlineStyleBudgetOk) {
            console.log(`  inline style count: ${row.inlineStyleCount}`);
            console.log(`  inline styles allowed on this page: ${row.allowInlineStyle ? 'yes' : 'no'}`);
        }
        if (row.sharedCssOverrideDrift.length) {
            row.sharedCssOverrideDrift.forEach((entry) => {
                console.log(`  shared CSS override drift: ${entry.file} -> ${entry.findings.join(', ')}`);
            });
        }
    });
}

const rows = Object.keys(routeVisualClassification)
    .sort()
    .map(buildAuditRow);

printSummary(rows);
printTable(rows);
printDrift(rows);
