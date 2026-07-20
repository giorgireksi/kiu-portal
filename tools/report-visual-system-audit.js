const fs = require('fs');
const path = require('path');
const {
    ROOT,
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    activeWebsiteJsDynamicAuditFiles,
    mobileShellRuntimeAuditFiles,
    alwaysAuditedWebsiteJsFiles,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings,
    sharedCssAdvisoryRules,
    sharedCssOwnerDriftRules,
    websiteJsInlineStyleAllowlist,
    cssStyleAttributeCompatibilityBuckets
} = require('./visual-route-classification');

function readText(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function detectMobileShellMode(source) {
    if (source.includes('assets/js/pages/standalone-mobile-shell.js')) return 'shared-standalone';
    if (source.includes('assets/js/pages/index-mobile-shell.js')) return 'index-shared';
    if (source.includes('assets/js/pages/social-mobile.js')) return 'social-shared';
    if (source.includes('(function initMobileExperience(){')) return 'legacy-inline';
    return 'none';
}

function uniqueSortedStrings(values) {
    return [...new Set(values.filter(Boolean))].sort();
}

function getWebsiteScriptSources(source) {
    const matches = Array.from(source.matchAll(/<script(?: defer)? src="([^"]+)"/g));
    return uniqueSortedStrings(
        matches
            .map((match) => String(match[1] || '').split('?')[0])
            .filter((href) => /^assets\/js\/(?:features|shared|pages)\//.test(href))
    );
}

function getPageScripts(source) {
    return getWebsiteScriptSources(source).filter((href) => href.startsWith('assets/js/pages/'));
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
    const activeWebsiteScripts = getWebsiteScriptSources(source);

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
        pageScripts: getPageScripts(source),
        activeWebsiteScripts
    };
}

function parseStyleDeclarations(styleValue) {
    return String(styleValue || '')
        .split(';')
        .map((chunk) => String(chunk || '').trim())
        .filter(Boolean)
        .map((chunk) => {
            const separatorIndex = chunk.indexOf(':');
            if (separatorIndex === -1) {
                return {
                    property: chunk.trim(),
                    value: ''
                };
            }
            return {
                property: chunk.slice(0, separatorIndex).trim(),
                value: chunk.slice(separatorIndex + 1).trim()
            };
        });
}

function getAllowlistMatch(file, styleValue) {
    const declarations = parseStyleDeclarations(styleValue);
    if (!declarations.length) return null;
    const rules = websiteJsInlineStyleAllowlist[file] || [];
    return rules.find((rule) => declarations.every(({ property, value }) => (
        rule.allowedProperties.includes(property)
        && (!rule.valuePattern || rule.valuePattern.test(value))
    ))) || null;
}

function createLineSnippet(line) {
    return String(line || '').trim().replace(/\s+/g, ' ').slice(0, 180);
}

function stripBlockCommentsPreserveLines(source) {
    return String(source || '').replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
}

function getNonCommentLines(source) {
    return stripBlockCommentsPreserveLines(source)
        .split('\n')
        .map((line, index) => ({
            line: index + 1,
            text: line
        }));
}

function ensureNonGlobalRegex(regex) {
    return new RegExp(regex.source, regex.flags.replace(/g/g, ''));
}

function scanCssRuleHits(source, regex) {
    const ruleRegex = ensureNonGlobalRegex(regex);
    return getNonCommentLines(source)
        .filter(({ text }) => ruleRegex.test(text))
        .map(({ line, text }) => ({
            line,
            snippet: createLineSnippet(text)
        }));
}

function scanInlineStyleAttributes(file, source) {
    return String(source || '')
        .split('\n')
        .flatMap((line, index) => {
            const hits = [];
            const attrRegex = /\bstyle\s*=\s*(["'])(.*?)\1/g;
            let match = attrRegex.exec(line);
            while (match) {
                const styleValue = String(match[2] || '');
                const allowlistMatch = getAllowlistMatch(file, styleValue);
                hits.push({
                    file,
                    line: index + 1,
                    kind: 'style=',
                    styleValue,
                    allowlistDescription: allowlistMatch ? allowlistMatch.description : '',
                    isAllowed: Boolean(allowlistMatch),
                    snippet: createLineSnippet(line)
                });
                match = attrRegex.exec(line);
            }
            return hits;
        });
}

function scanImperativeInlineStyleWriters(file, source) {
    return String(source || '')
        .split('\n')
        .flatMap((line, index) => {
            const trimmedLine = createLineSnippet(line);
            const hits = [];
            if (/setAttribute\(\s*['"]style['"]\s*,/.test(line)) {
                hits.push({
                    file,
                    line: index + 1,
                    kind: 'setAttribute(style)',
                    snippet: trimmedLine
                });
            }
            if (/\.style\.cssText\s*=/.test(line)) {
                hits.push({
                    file,
                    line: index + 1,
                    kind: 'style.cssText',
                    snippet: trimmedLine
                });
            }
            return hits;
        });
}

function collectActiveWebsiteJsAuditFiles(rows) {
    const activeFiles = new Set(rows.flatMap((row) => row.activeWebsiteScripts));
    alwaysAuditedWebsiteJsFiles.forEach((file) => activeFiles.add(file));
    Object.entries(activeWebsiteJsDynamicAuditFiles).forEach(([parentFile, childFiles]) => {
        if (!activeFiles.has(parentFile)) return;
        childFiles.forEach((childFile) => activeFiles.add(childFile));
    });
    return [...activeFiles].sort();
}

function buildWebsiteJsInlineAudit(rows) {
    const files = collectActiveWebsiteJsAuditFiles(rows);
    const allFileAudits = files.map((file) => {
        const source = readText(file);
        const attributeHits = scanInlineStyleAttributes(file, source);
        const imperativeHits = scanImperativeInlineStyleWriters(file, source);
        return {
            file,
            totalStyleAttributeHits: attributeHits.length,
            allowlistedHits: attributeHits.filter((hit) => hit.isAllowed),
            illegalStyleAttributeHits: attributeHits.filter((hit) => !hit.isAllowed),
            imperativeHits
        };
    });
    const fileAudits = allFileAudits.filter((audit) => (
        audit.totalStyleAttributeHits > 0
        || audit.imperativeHits.length > 0
    ));
    const mobileShellFileAudits = mobileShellRuntimeAuditFiles
        .map((file) => allFileAudits.find((audit) => audit.file === file))
        .filter(Boolean);

    return {
        scannedFiles: files,
        allFileAudits,
        fileAudits,
        mobileShellFileAudits,
        totalStyleAttributeHits: fileAudits.reduce((sum, audit) => sum + audit.totalStyleAttributeHits, 0),
        totalAllowlistedHits: fileAudits.reduce((sum, audit) => sum + audit.allowlistedHits.length, 0),
        totalIllegalStyleAttributeHits: fileAudits.reduce((sum, audit) => sum + audit.illegalStyleAttributeHits.length, 0),
        totalImperativeHits: fileAudits.reduce((sum, audit) => sum + audit.imperativeHits.length, 0)
    };
}

function buildSharedCssOwnerAudit() {
    const fileAudits = Object.entries(sharedCssOwnerDriftRules).map(([file, rules]) => {
        const source = readText(file);
        const findings = rules
            .filter((rule) => rule.regex.test(source))
            .map((rule) => rule.key);
        return {
            file,
            findings
        };
    });

    return {
        fileAudits,
        failingFiles: fileAudits.filter((audit) => audit.findings.length > 0),
        totalFindings: fileAudits.reduce((sum, audit) => sum + audit.findings.length, 0)
    };
}

function buildSharedCssAdvisoryAudit() {
    const fileAudits = Object.entries(sharedCssAdvisoryRules).map(([file, rules]) => {
        const source = readText(file);
        const findings = rules
            .map((rule) => {
                const hits = scanCssRuleHits(source, rule.regex);
                return {
                    key: rule.key,
                    description: rule.description,
                    hitCount: hits.length,
                    hits: hits.slice(0, 3)
                };
            })
            .filter((finding) => finding.hitCount > 0);

        return {
            file,
            findings
        };
    });

    return {
        fileAudits,
        filesWithFindings: fileAudits.filter((audit) => audit.findings.length > 0),
        totalFindings: fileAudits.reduce((sum, audit) => sum + audit.findings.length, 0),
        totalHits: fileAudits.reduce((sum, audit) => sum + audit.findings.reduce((inner, finding) => inner + finding.hitCount, 0), 0)
    };
}

function scanCssStyleAttributeSelectors(file, source) {
    return getNonCommentLines(source)
        .flatMap(({ line, text }) => {
            if (!/\[style\*=/.test(text)) return [];
            const matches = text.match(/\[style\*=/g) || [];
            return matches.map(() => ({
                file,
                line,
                snippet: createLineSnippet(text)
            }));
        });
}

function buildCssStyleAttributeCompatibilityAudit() {
    const bucketAudits = cssStyleAttributeCompatibilityBuckets.map((bucket) => {
        const fileAudits = bucket.files.map((file) => {
            const hits = scanCssStyleAttributeSelectors(file, readText(file));
            return {
                file,
                hitCount: hits.length,
                hits: hits.slice(0, 3)
            };
        });

        return {
            key: bucket.key,
            label: bucket.label,
            fileAudits,
            filesWithHits: fileAudits.filter((audit) => audit.hitCount > 0),
            totalHits: fileAudits.reduce((sum, audit) => sum + audit.hitCount, 0)
        };
    });

    return {
        bucketAudits,
        totalHits: bucketAudits.reduce((sum, bucket) => sum + bucket.totalHits, 0)
    };
}

function getRouteDriftRows(rows) {
    return rows.filter((row) => (
        !row.dedicatedCssMatches
        || !row.mobileShellMatches
        || !row.inlineStyleBudgetOk
        || row.sharedCssOverrideDrift.length > 0
    ));
}

function printSummary(rows, jsAudit, sharedCssAudit, sharedCssAdvisoryAudit, cssStyleAttributeAudit) {
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
    console.log(`Active website JS files scanned for inline styling: ${jsAudit.scannedFiles.length}`);
    console.log(`JS style= hits: ${jsAudit.totalStyleAttributeHits}`);
    console.log(`Allowlisted data-only style= hits: ${jsAudit.totalAllowlistedHits}`);
    console.log(`Illegal presentational style= hits: ${jsAudit.totalIllegalStyleAttributeHits}`);
    console.log(`Imperative inline style writers: ${jsAudit.totalImperativeHits}`);
    console.log(`Shared CSS owner drift findings: ${sharedCssAudit.totalFindings}`);
    console.log(`Advisory shared CSS family findings: ${sharedCssAdvisoryAudit.totalFindings} (${sharedCssAdvisoryAudit.totalHits} matched lines)`);
    console.log(`Advisory CSS [style*=] compatibility selector hits: ${cssStyleAttributeAudit.totalHits}`);
    console.log(`Explicit mobile-shell runtime files covered: ${jsAudit.mobileShellFileAudits.length}`);
    console.log('Blocking checks: route drift, non-allowlisted active website JS inline styling, and tracked shared CSS owner drift.');
    console.log('Advisory checks: shared CSS family review signals and CSS [style*=] compatibility selectors. These do not change pass/fail on their own.');
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

function printJsInlineAudit(jsAudit) {
    console.log('\nActive Website JS Inline Style Audit');
    if (!jsAudit.fileAudits.length) {
        console.log('No active website JS inline-style emitters found.');
        return;
    }

    const headers = ['File', 'style= hits', 'Allowlisted', 'Illegal', 'Imperative', 'Allowlist notes'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    jsAudit.fileAudits.forEach((audit) => {
        const allowlistNotes = uniqueSortedStrings(audit.allowlistedHits.map((hit) => hit.allowlistDescription));
        lines.push([
            audit.file,
            String(audit.totalStyleAttributeHits),
            String(audit.allowlistedHits.length),
            String(audit.illegalStyleAttributeHits.length),
            String(audit.imperativeHits.length),
            allowlistNotes.join('; ') || 'none'
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printMobileShellRuntimeAudit(jsAudit) {
    console.log('\nMobile-Shell Runtime Audit Coverage');
    if (!jsAudit.mobileShellFileAudits.length) {
        console.log('No explicit mobile-shell runtime audit files are configured.');
        return;
    }

    const headers = ['File', 'style= hits', 'Allowlisted', 'Illegal', 'Imperative'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    jsAudit.mobileShellFileAudits.forEach((audit) => {
        lines.push([
            audit.file,
            String(audit.totalStyleAttributeHits),
            String(audit.allowlistedHits.length),
            String(audit.illegalStyleAttributeHits.length),
            String(audit.imperativeHits.length)
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printSharedCssOwnerAudit(sharedCssAudit) {
    console.log('\nShared CSS Owner Drift Audit');
    if (!sharedCssAudit.fileAudits.length) {
        console.log('No shared CSS owner audit files configured.');
        return;
    }

    const headers = ['File', 'Findings'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    sharedCssAudit.fileAudits.forEach((audit) => {
        lines.push([
            audit.file,
            audit.findings.join(', ') || 'none'
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printSharedCssAdvisoryAudit(sharedCssAdvisoryAudit) {
    console.log('\nShared CSS Review Signals (Advisory)');
    console.log('These heuristics help manual review lanes move faster. Zero advisory hits here does not prove a shared file is route-clean.');
    if (!sharedCssAdvisoryAudit.fileAudits.length) {
        console.log('No advisory shared CSS files are configured.');
        return;
    }

    const headers = ['File', 'Findings', 'Matched lines'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    sharedCssAdvisoryAudit.fileAudits.forEach((audit) => {
        lines.push([
            audit.file,
            audit.findings.map((finding) => finding.key).join(', ') || 'none',
            String(audit.findings.reduce((sum, finding) => sum + finding.hitCount, 0))
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printSharedCssAdvisoryDetails(sharedCssAdvisoryAudit) {
    console.log('\nShared CSS Review Signal Details (Advisory)');
    if (!sharedCssAdvisoryAudit.filesWithFindings.length) {
        console.log('No advisory shared CSS family findings were detected in the configured files.');
        return;
    }

    sharedCssAdvisoryAudit.filesWithFindings.forEach((audit) => {
        console.log(`- ${audit.file}`);
        audit.findings.forEach((finding) => {
            const sampleLines = finding.hits.map((hit) => hit.line).join(', ');
            console.log(`  ${finding.key}: ${finding.hitCount} matched lines`);
            console.log(`  note: ${finding.description}`);
            if (sampleLines) {
                console.log(`  sample lines: ${sampleLines}`);
            }
        });
    });
}

function printCssStyleAttributeCompatibilityAudit(cssStyleAttributeAudit) {
    console.log('\nCSS [style*=] Compatibility Selector Audit (Advisory)');
    console.log('These selectors usually indicate compatibility patches against dirty inline styles or legacy markup. They are advisory and still require manual judgment.');
    if (!cssStyleAttributeAudit.bucketAudits.length) {
        console.log('No CSS [style*=] compatibility audit buckets are configured.');
        return;
    }

    const headers = ['Bucket', 'Files', 'Files with hits', 'Selector hits'];
    const lines = [headers.join(' | '), headers.map(() => '---').join(' | ')];
    cssStyleAttributeAudit.bucketAudits.forEach((bucket) => {
        lines.push([
            bucket.label,
            String(bucket.fileAudits.length),
            String(bucket.filesWithHits.length),
            String(bucket.totalHits)
        ].join(' | '));
    });
    console.log(lines.join('\n'));
}

function printCssStyleAttributeCompatibilityDetails(cssStyleAttributeAudit) {
    console.log('\nCSS [style*=] Compatibility Details (Advisory)');
    const bucketsWithHits = cssStyleAttributeAudit.bucketAudits.filter((bucket) => bucket.filesWithHits.length > 0);
    if (!bucketsWithHits.length) {
        console.log('No CSS [style*=] compatibility selectors were found in the configured buckets.');
        return;
    }

    bucketsWithHits.forEach((bucket) => {
        console.log(`- ${bucket.label}`);
        bucket.filesWithHits.forEach((audit) => {
            const sampleLines = audit.hits.map((hit) => hit.line).join(', ');
            console.log(`  ${audit.file}: ${audit.hitCount} selector hits`);
            if (sampleLines) {
                console.log(`  sample lines: ${sampleLines}`);
            }
        });
    });
}

function printRouteDrift(routeDriftRows) {
    console.log('\nRoute Drift Findings');
    if (!routeDriftRows.length) {
        console.log('No route drift found against the current visual classification and guardrail expectations.');
        return;
    }
    routeDriftRows.forEach((row) => {
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

function printJsInlineViolations(jsAudit) {
    console.log('\nJS Inline Style Findings');
    const violatingAudits = jsAudit.fileAudits.filter((audit) => (
        audit.illegalStyleAttributeHits.length > 0
        || audit.imperativeHits.length > 0
    ));
    if (!violatingAudits.length) {
        console.log('No non-allowlisted active website JS inline-style emitters found.');
        return;
    }

    violatingAudits.forEach((audit) => {
        console.log(`- ${audit.file}`);
        if (audit.illegalStyleAttributeHits.length) {
            console.log(`  illegal style= hits: ${audit.illegalStyleAttributeHits.length}`);
            audit.illegalStyleAttributeHits.slice(0, 3).forEach((hit) => {
                console.log(`  - line ${hit.line}: ${hit.snippet}`);
            });
        }
        if (audit.imperativeHits.length) {
            console.log(`  imperative inline style writers: ${audit.imperativeHits.length}`);
            audit.imperativeHits.slice(0, 3).forEach((hit) => {
                console.log(`  - line ${hit.line} [${hit.kind}]: ${hit.snippet}`);
            });
        }
    });
}

function printSharedCssOwnerViolations(sharedCssAudit) {
    console.log('\nShared CSS Owner Findings');
    if (!sharedCssAudit.failingFiles.length) {
        console.log('No route-private selector families were found in the tracked shared CSS owners.');
        return;
    }
    sharedCssAudit.failingFiles.forEach((audit) => {
        console.log(`- ${audit.file}: ${audit.findings.join(', ')}`);
    });
}

function printResult(routeDriftRows, jsAudit, sharedCssAudit) {
    const failed = (
        routeDriftRows.length > 0
        || jsAudit.totalIllegalStyleAttributeHits > 0
        || jsAudit.totalImperativeHits > 0
        || sharedCssAudit.totalFindings > 0
    );
    console.log('\nAudit Result');
    if (!failed) {
        console.log('PASS: route-shell guardrails are green, tracked shared CSS owners are clean, and every active website JS style= hit is allowlisted as data-only.');
        console.log('Advisory shared-CSS review signals may still exist above; they do not count as automated proof that shared files are clean.');
        return;
    }
    console.log('FAIL: route-shell drift, shared CSS owner drift, or non-allowlisted active website JS inline styling is still present.');
    process.exitCode = 1;
}

const rows = Object.keys(routeVisualClassification)
    .sort()
    .map(buildAuditRow);

const jsAudit = buildWebsiteJsInlineAudit(rows);
const sharedCssAudit = buildSharedCssOwnerAudit();
const sharedCssAdvisoryAudit = buildSharedCssAdvisoryAudit();
const cssStyleAttributeAudit = buildCssStyleAttributeCompatibilityAudit();
const routeDriftRows = getRouteDriftRows(rows);

printSummary(rows, jsAudit, sharedCssAudit, sharedCssAdvisoryAudit, cssStyleAttributeAudit);
printTable(rows);
printJsInlineAudit(jsAudit);
printMobileShellRuntimeAudit(jsAudit);
printSharedCssOwnerAudit(sharedCssAudit);
printSharedCssAdvisoryAudit(sharedCssAdvisoryAudit);
printCssStyleAttributeCompatibilityAudit(cssStyleAttributeAudit);
printRouteDrift(routeDriftRows);
printJsInlineViolations(jsAudit);
printSharedCssOwnerViolations(sharedCssAudit);
printSharedCssAdvisoryDetails(sharedCssAdvisoryAudit);
printCssStyleAttributeCompatibilityDetails(cssStyleAttributeAudit);
printResult(routeDriftRows, jsAudit, sharedCssAudit);
