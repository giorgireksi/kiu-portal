import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('index widget wave 1 regressions', () => {
  it('keeps orders aligned to the index hero-side widget structure', () => {
    const source = readSource('assets/js/shared/orders-workspace.js');

    expect(source).toContain('class="lux-card-body lux-hero-stage orders-inbox-hero-stage"');
    expect(source).toContain('class="lux-hero-main"');
    expect(source).toContain('class="lux-hero-side orders-inbox-hero-side"');
    expect(source).toContain('class="lux-hero-side-head"');
    expect(source).toContain('class="lux-hero-signal-list"');
    expect(source).toContain('class="lux-hero-signal"');
  });

  it('keeps library aligned to index hero-side and strip widgets', () => {
    const source = readSource('assets/js/pages/library.js');

    expect(source).toContain('class="lux-hero-stage"');
    expect(source).toContain('class="lux-hero-main"');
    expect(source).toContain('aside class="lux-hero-side library-hero-side');
    expect(source).toContain('class="lux-strip-grid lux-strip-grid--adaptive library-widget-strip"');
    expect(source).toContain('class="lux-strip-card surface-card library-overview-card library-hero-metric');
    expect(source).toContain("'library-widget-visible'");
    expect(source).toContain("'library-widget-topics'");
    expect(source).toContain("'library-widget-languages'");
  });

  it('keeps student-service aligned to index hero-side and strip widgets', () => {
    const source = readSource('assets/js/pages/student-service.js');

    expect(source).toContain('class="admin-hero student-service-hero lux-hero-stage"');
    expect(source).toContain('class="student-service-hero-main lux-hero-main"');
    expect(source).toContain('class="student-service-hero-aside lux-hero-side"');
    expect(source).toContain('class="student-service-hero-aside-grid lux-hero-signal-list"');
    expect(source).toContain('class="student-service-hero-aside-stat lux-hero-signal"');
    expect(source).toContain('class="student-service-summary-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="student-service-summary-card lux-strip-card surface-card ');
  });

  it('keeps news audience widgets aligned to index strip cards', () => {
    const source = readSource('assets/js/pages/news.js');

    expect(source).toContain('class="newsx-stat-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="newsx-stat lux-strip-card surface-card lux-summary-surface lux-summary-surface--panel"');
    expect(source).toContain('class="lux-card-body lux-mini-panel"');
  });

  it('keeps registration widgets aligned to index hero-side and strip cards', () => {
    const source = readSource('registration.html');

    expect(source).toContain('class="registration-hero-copy lux-hero-main"');
    expect(source).toContain('class="registration-hero-focus lux-hero-side"');
    expect(source).toContain('class="registration-focus-card registration-summary-card registration-summary-card--hero lux-hero-side-head"');
    expect(source).toContain('class="registration-hero-focus-grid lux-hero-signal-list"');
    expect(source).toContain('class="registration-mini-metric registration-signal-card registration-signal-card--hold lux-hero-signal"');
    expect(source).toContain('class="registration-insight-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="registration-insight-card registration-summary-card registration-summary-card--hold lux-summary-surface lux-summary-surface--panel lux-strip-card surface-card"');
  });

  it('keeps profile-view stat widgets aligned to index strip cards', () => {
    const source = readSource('profile-view.html');

    expect(source).toContain('class="lux-strip-grid lux-strip-grid--adaptive pv-stat-grid pv-stat-grid--overview"');
    expect(source).toContain('class="pv-stat-card surface-card lux-strip-card lux-summary-surface lux-summary-surface--panel"');
  });

  it('keeps personal-data hero and summary widgets aligned to index hero-side and strip cards', () => {
    const source = readSource('personal-data.html');

    expect(source).toContain('class="personal-data-hero-copy lux-hero-main"');
    expect(source).toContain('class="personal-data-hero-panel lux-hero-side"');
    expect(source).toContain('class="kpi-row lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="personal-data-kpi-card lux-data-card lux-metric-card lux-strip-card lux-summary-surface lux-summary-surface--panel"');
    expect(source).toContain('class="personal-data-record-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="personal-data-mini lux-data-card lux-info-card lux-strip-card lux-summary-surface lux-summary-surface--panel"');
  });
});
