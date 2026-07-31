import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('index widget wave 1 regressions', () => {
  it('keeps orders aligned to the index hero-side widget structure', () => {
    const source = readSource('assets/js/shared/orders-inbox.js');

    expect(source).toContain('class="lux-hero-stage orders-inbox-hero-stage"');
    expect(source).toContain('class="lux-hero-main"');
    expect(source).toMatch(/class="lux-hero-side orders-inbox-hero-side lux-focus-panel home-hover-chip"/);
    expect(source).toContain('data-orders-inbox-hero="1"');
    expect(source).toContain('orders-inbox-workspace lux-summary-surface');
    expect(source).not.toContain('orders-inbox-hero lux-summary-surface');
    expect(source).toContain('lux-focus-panel');
    expect(source).toContain('lux-focus-panel__head');
    expect(source).toContain('lux-focus-panel__meta');
    expect(source).toContain('class="lux-hero-signal home-hover-chip"');
  });

  it('keeps library aligned to readonly catalog shell without deleted hero markup', () => {
    const source = readSource('assets/js/pages/library.js');

    expect(source).toContain('LibraryCatalogView.renderCatalogShell');
    expect(source).toContain("LibraryCatalogView.bindCatalogInteractions({ mode: 'readonly' })");
    expect(source).toContain('LibraryCatalogView.renderCatalogTable({ mode: \'readonly\' })');
    expect(source).toContain('[data-library-catalog-shell="1"]');
    expect(source).not.toContain('library-hero-summary-card');
    expect(source).not.toContain('id="library-hero-summary-detail"');
    expect(source).not.toContain('library-page-hero');
    expect(source).not.toContain('library-widget-strip');
    expect(source).not.toContain('library-overview-card');
  });

  it('keeps student-service aligned to index hero-side workflow chrome', () => {
    const source = readSource('assets/js/pages/student-service.js');

    expect(source).toContain('class="admin-hero student-service-hero lux-hero-stage"');
    expect(source).toContain('class="student-service-hero-main lux-hero-main"');
    expect(source).toMatch(/class="student-service-hero-aside lux-hero-side(?: lux-focus-panel)?"/);
    expect(source).toContain('lux-focus-panel');
    expect(source).toContain('student-service-hero-aside-grid');
    expect(source).toContain('lux-hero-signal-list');
    expect(source).toContain('student-service-hero-aside-stat');
    expect(source).toContain('lux-hero-signal');
    expect(source).toContain('student-service-workflow-section');
    expect(source).not.toContain('student-service-summary-grid');
    expect(source).not.toContain('student-service-summary-card');
  });

  it('keeps news feed post cards in tile grid with editorial detail modal', () => {
    const feed = readSource('assets/js/pages/news/news-feed-render.js');
    const replies = readSource('assets/js/pages/news/news-replies.js');

    expect(replies).toContain('newsx-reply-shell');
    expect(replies).toContain('newsx-reply-tabs');
    expect(replies).toContain('data-news-reply-tab');
    expect(replies).not.toContain('newsx-reply-fold');
    expect(replies).toContain('Public');
    expect(replies).toContain('Private');
    expect(feed).toContain('newsx-post-card--tile');
    expect(feed).toContain('newsx-post-card--editorial');
    expect(feed).toContain('openNewsPostDetail');
    expect(feed).not.toContain('newsx-stat-grid--compact');
    expect(feed).not.toContain('Who can see this announcement right now.');

    const shellBlock = feed.slice(
      feed.indexOf('function ensureNewsPostShell(host, postId)'),
      feed.indexOf('function renderNewsPostRegions(host, post)')
    );
    expect(shellBlock).toContain('newsx-post-card--tile');
    expect(shellBlock).not.toContain('newsx-divider');
  });

  it('keeps registration widgets aligned to consolidated studio panel', () => {
    const source = readSource('registration.html');

    expect(source).toContain('registration-hero-shell');
    expect(source).toContain('class="lux-timetable-hero-main lux-hero-main registration-hero-copy"');
    expect(source).toMatch(/registration-hero-aside[\s\S]*home-hover-chip/);
    expect(source).toContain('registration-command-band');
    expect(source).toContain('registration-metrics-band lux-strip-grid lux-strip-grid--adaptive');
    expect(source).toContain('registration-studio-shell');
    expect(source).toContain('registration-studio-deck');
    expect(source).toContain('registration-insight-card home-hover-chip');
    expect(source).not.toContain('lux-soft-chrome');
    expect(source).not.toContain('registration-hero-focus-grid');
    expect(source).not.toContain('registration-mini-metric');
    expect(source).not.toContain('registration-insight-grid');
  });

  it('keeps profile-view stat widgets aligned to index strip cards', () => {
    const source = readSource('assets/js/pages/profile-view-page.js');

    expect(source).toContain('class="pv-metric-card"');
    expect(source).not.toContain('lux-soft-chrome');
  });

  it('keeps personal-data hero and summary widgets aligned to index hero-side and strip cards', () => {
    const source = readSource('personal-data.html');

    expect(source).toContain('class="personal-data-hero-copy lux-hero-main"');
    expect(source).toContain('class="kpi-row lux-strip-grid lux-strip-grid--adaptive personal-data-kpi-row"');
    expect(source).toContain('class="personal-data-kpi-card lux-data-card lux-metric-card lux-strip-card home-hover-chip"');
    expect(source).not.toContain('lux-summary-surface--panel');
    expect(source).not.toContain('class="personal-data-record-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).not.toContain('class="personal-data-mini lux-data-card lux-info-card lux-strip-card lux-summary-surface lux-summary-surface--panel"');
  });
});
