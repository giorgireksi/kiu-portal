#!/usr/bin/env node
/**
 * Port social project overview / task-map / health CSS from deleted social-projects-lms.css
 * into wave-2 bare-lite blocks with token migration.
 */
import { readFileSync, writeFileSync } from 'fs';

const SRC = '/tmp/social-projects-lms-old.css';
const src = readFileSync(SRC, 'utf8');
const lines = src.split('\n');

function slice(start, end) {
    return lines.slice(start - 1, end).join('\n');
}

function transform(css) {
    return css
        .replace(/\bsocial-neo-dialog-/g, 'lux-glass-dialog-')
        .replace(/\bsocial-neo-dialog\b/g, 'lux-glass-dialog')
        .replace(/var\(--sn-txt3([^)]*)\)/g, 'var(--lux-text-muted$1)')
        .replace(/var\(--sn-txt2([^)]*)\)/g, 'var(--lux-text-muted$1)')
        .replace(/var\(--sn-txt([^2-3)]*)\)/g, 'var(--lux-text$1)')
        .replace(/var\(--sn-bdr([^)]*)\)/g, 'var(--lux-border$1)')
        .replace(/var\(--sn-proj-lane([^)]*)\)/g, 'var(--social-chip-fill$1)')
        .replace(/var\(--sn-hover([^)]*)\)/g, 'var(--lux-panel-control$1)')
        .replace(/var\(--sn-bg([^)]*)\)/g, 'transparent')
        .replace(/var\(--sn-accent-rgb([^)]*)\)/g, 'var(--lux-accent-rgb$1)')
        .replace(/var\(--sn-proj-accent-rgb([^)]*)\)/g, 'var(--lux-accent-rgb$1)')
        .replace(/var\(--sn-proj-accent([^)]*)\)/g, 'var(--lux-accent$1)')
        .replace(/var\(--sn-accent([^-][^)]*)\)/g, 'var(--lux-accent$1)')
        .replace(/var\(--sn-success([^)]*)\)/g, 'var(--lux-success$1)')
        .replace(/var\(--sn-warning([^)]*)\)/g, 'var(--lux-warning$1)')
        .replace(/var\(--sn-danger([^)]*)\)/g, 'var(--lux-danger$1)')
        .replace(/var\(--sn-info([^)]*)\)/g, 'var(--lux-info, #60a5fa$1)')
        .replace(/var\(--sn-ease-spring([^)]*)\)/g, '0.28s cubic-bezier(0.34, 1.2, 0.64, 1$1)')
        .replace(/var\(--sn-ease([^)]*)\)/g, '0.18s ease$1)')
        .replace(/var\(--social-fade-[^)]+\)/g, 'transparent')
        .replace(/var\(--sn-muted([^)]*)\)/g, 'var(--lux-text-muted$1)')
        .replace(/var\(--sn-text-muted([^)]*)\)/g, 'var(--lux-text-muted$1)')
        .replace(/var\(--sn-border([^)]*)\)/g, 'var(--lux-border$1)')
        .replace(/var\(--sn-pill([^)]*)\)/g, '999px')
        .replace(/var\(--sn-[^)]+\)/g, (m) => {
            if (m.includes('--sn-r-')) return 'var(--social-radius)';
            if (m.includes('--sn-txt')) return 'var(--lux-text)';
            if (m.includes('--sn-accent')) return 'var(--lux-accent)';
            return 'var(--lux-text-muted)';
        });
}

function stripBgForSelectors(css, selectors) {
    let out = css;
    for (const sel of selectors) {
        const re = new RegExp(`(${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{)([^}]*)(\\})`, 'g');
        out = out.replace(re, (_, open, body, close) => {
            const cleaned = body.replace(/\s*background[^;]+;/g, '');
            return `${open}${cleaned}${close}`;
        });
    }
    return out;
}

const overviewExtra = `
body.lux-route-social .social-project-status-chart {
  display: grid;
  gap: 18px;
}
body.lux-route-social .social-project-status-item > div {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
body.lux-route-social .social-project-status-item strong {
  font-size: 14px;
}
body.lux-route-social .social-project-status-dot.is-blue,
body.lux-route-social .social-project-status-segment.is-blue {
  background: #60a5fa;
}
body.lux-route-social .social-project-status-dot.is-orange,
body.lux-route-social .social-project-status-segment.is-orange {
  background: #f59e0b;
}
body.lux-route-social .social-project-status-dot.is-rose,
body.lux-route-social .social-project-status-segment.is-rose {
  background: #fb7185;
}
body.lux-route-social .social-project-status-dot.is-emerald,
body.lux-route-social .social-project-status-segment.is-emerald {
  background: #34d399;
}
body.lux-route-social .social-project-workload-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
body.lux-route-social .social-project-workload-head em {
  font-style: normal;
  font-size: 12px;
  color: var(--lux-text-muted);
  white-space: nowrap;
}
body.lux-route-social .social-project-activity-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
body.lux-route-social .social-project-activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--lux-accent);
  background: color-mix(in srgb, var(--lux-accent) 14%, transparent);
}
body.lux-route-social .social-project-activity-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
body.lux-route-social .social-project-activity-head em {
  font-style: normal;
  font-size: 11px;
  color: var(--lux-text-muted);
  white-space: nowrap;
}
body.lux-route-social .social-project-body-copy {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--lux-text-muted);
}
body.lux-route-social .social-neo-copy-mt-8 {
  margin-top: 8px;
}
body.lux-route-social .social-project-baseline-card .social-project-baseline-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
body.lux-route-social .social-project-card-new-cta span {
  cursor: pointer;
}
body.lux-route-social .social-project-card-new-cta span:hover {
  text-decoration: underline;
}
@media (max-width: 980px) {
  body.lux-route-social .social-project-overview-columns--2 .social-project-overview-col {
    display: contents;
  }
  body.lux-route-social .social-project-ov-order-2b { order: 2.5; }
  body.lux-route-social .social-project-ov-order-2c { order: 2.6; }
}
`;

const overview = transform([
    slice(298, 322),
    slice(682, 1000),
    slice(1115, 1121),
    slice(1346, 1415),
    slice(1754, 1755),
    slice(5415, 5475),
].join('\n\n')) + '\n' + overviewExtra;

const taskMapPart1 = transform(slice(3449, 5840));
let stacking = transform(slice(5841, 5959));

// Align stacking rules with lux-glass-dialog + test expectations
stacking = stacking
    .replace(/z-index:\s*10052/g, 'z-index: 10102')
    .replace(/z-index:\s*10054/g, 'z-index: 10104')
    .replace(/z-index:\s*10050/g, 'z-index: 10100')
    .replace(/opacity:\s*0\.88/g, 'opacity: 0.55');

stacking += `
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-stack:has(.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop) .social-project-task-graph-anchor {
  pointer-events: none !important;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-stack:has(.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop) [data-project-task-graph-stage] {
  pointer-events: none !important;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-immersive-topbar {
  pointer-events: auto !important;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-child-slot[hidden] {
  display: none !important;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-child-slot {
  position: static;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-child-slot:has(> .lux-glass-dialog-backdrop) {
  position: fixed;
  top: var(--ptg-chrome-top, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10102;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-child-slot .social-project-health-stack .lux-glass-dialog-backdrop {
  pointer-events: auto;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-stack--child-open .social-project-task-graph-immersive-body {
  opacity: 0.55;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-stack--child-open .social-project-task-graph-immersive-footer {
  display: none !important;
}
body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-immersive-footer {
  display: none !important;
}
body.lux-route-social .social-project-health-child-slot {
  z-index: 10102;
}
`;

let health = transform([
    slice(1970, 2283),
    slice(12197, 12880),
].join('\n\n'));

health = stripBgForSelectors(health, [
    '\\.sph-verdict',
    '\\.sph-hygiene-chip',
    '\\.sph-week-item',
    '\\.sph-fix-task',
    '\\.sph-pick-split',
    '\\.sph-pick-row',
]);

const taskMapPart2 = transform(slice(5960, 8974));

const stackingBody = stacking.replace(/^\/\* Stacked child modals[\s\S]*?\*\/\s*/m, '');

const output = `/* Social: overview dashboard zones */
${overview}

/* Social: project task map */
${taskMapPart1}

/* Stacked child modals must clear dashboard chrome; raise portal only while a child is open. */
${stackingBody}

/* Social: project health dialog */
${health}

${taskMapPart2}

/* Social: project workspace team tab */
`;

writeFileSync('/tmp/social-project-ported.css', output);
console.log('Wrote /tmp/social-project-ported.css', output.length, 'chars');
