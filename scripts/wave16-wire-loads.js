#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const glob = fs.readdirSync(root).filter((f) => f.endsWith('.html'));

const inserts = [
    ['assets/js/app/api.js', 'assets/js/app/api-lms-portal-runtime.js?v=20260720-apilms1'],
    ['assets/js/shared/lux-transparency.js', 'assets/js/shared/lux-transparency-route-runtime.js?v=20260720-luxroute1'],
    ['assets/js/shared/faculty.js', 'assets/js/shared/faculty-schedule-runtime.js?v=20260720-facsched1'],
    ['assets/js/features/index-luxury.js', 'assets/js/features/luxury-transparency-model-runtime.js?v=20260723-perftier1'],
    ['assets/js/features/luxury-shell-chrome.js', 'assets/js/features/luxury-shell-picker-runtime.js?v=20260723-utility-bloom1'],
    ['assets/js/features/home-dashboard-widget-data-runtime.js', 'assets/js/features/home-dashboard-widget-layout-runtime.js?v=20260720-homelay1'],
    ['assets/js/pages/lms.js', 'assets/js/pages/lms-section-quiz-runtime.js?v=20260720-lmssecquiz1'],
    ['assets/js/pages/student-registration.js', 'assets/js/pages/student-registration-eligibility-runtime.js?v=20260720-stuelig1'],
    ['assets/js/pages/registration.js', 'assets/js/pages/registration-semester-runtime.js?v=20260720-regsem1']
];

let htmlChanged = 0;
for (const file of glob) {
    const filePath = path.join(root, file);
    let html = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [needle, peelSrc] of inserts) {
        const peelPath = peelSrc.split('?')[0];
        if (!html.includes(needle)) continue;
        if (html.includes(peelPath)) continue;
        const lines = html.split('\n');
        const out = [];
        for (const line of lines) {
            if (line.includes(needle) && line.includes('<script') && !line.includes(peelPath)) {
                const indent = (line.match(/^(\s*)/) || ['', ''])[1];
                const defer = /\sdefer[\s>]/.test(line) || line.includes(' defer') ? ' defer' : '';
                out.push(`${indent}<script${defer} src="${peelSrc}"></script>`);
                changed = true;
            }
            out.push(line);
        }
        html = out.join('\n');
    }
    if (changed) {
        fs.writeFileSync(filePath, html);
        htmlChanged += 1;
        console.log('updated', file);
    }
}
console.log('html files changed', htmlChanged);

const tabs = path.join(root, 'assets/js/pages/lms-classroom-tabs-runtime.js');
let tabsSrc = fs.readFileSync(tabs, 'utf8');
if (!tabsSrc.includes('lms-live-quiz-session-runtime.js')) {
    tabsSrc = tabsSrc.replace(
        "'assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260609-livequiz-timerfix1'",
        "'assets/js/pages/lms-live-quiz-session-runtime.js?v=20260720-lqsession1',\n    'assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260609-livequiz-timerfix1'"
    );
    fs.writeFileSync(tabs, tabsSrc);
    console.log('updated classroom tabs URL list');
}

const page = path.join(root, 'assets/js/pages/social-page.js');
let pageSrc = fs.readFileSync(page, 'utf8');
if (!pageSrc.includes('SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL')) {
    pageSrc = pageSrc.replace(
        /const SOCIAL_WORKSPACE_GRAPH_MODEL_URL = ([^;]+);/,
        "const SOCIAL_WORKSPACE_GRAPH_MODEL_URL = $1;\n    const SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL = 'assets/js/pages/social-workspace-graph-sync-runtime.js?v=20260720-wsgsync1';\n    const SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL = 'assets/js/pages/social-workspace-graph-runtime.js?v=20260720-wsgrt1';"
    );
    pageSrc = pageSrc.replace(
        /SOCIAL_WORKSPACE_GRAPH_MODEL_URL,\n(\s*)SOCIAL_WORKSPACE_MODULE_URL/,
        'SOCIAL_WORKSPACE_GRAPH_MODEL_URL,\n$1SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL,\n$1SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL,\n$1SOCIAL_WORKSPACE_MODULE_URL'
    );
    fs.writeFileSync(page, pageSrc);
    console.log('updated social-page workspace URL chain');
}
