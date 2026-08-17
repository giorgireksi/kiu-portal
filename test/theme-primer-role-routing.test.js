import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootPrimer(url, storedRole = '') {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head><title>KIU - Portal</title></head><body class="kiu-shell-loading lux-unified-shell lux-route-home" data-faculty="ECON"></body></html>`,
    {
      url,
      runScripts: 'outside-only'
    }
  );

  if (storedRole) {
    dom.window.localStorage.setItem('currentUserRole', storedRole);
  }

  dom.window.eval(readSource('assets/js/theme-primer.js'));
  return dom;
}

describe('theme primer role routing', () => {
  it('maps the professor home route to the professor title and body role before shell reveal', () => {
    const dom = bootPrimer('http://localhost/index.html?view=professor#home');
    const body = dom.window.document.body;

    expect(dom.window.document.title).toBe('KIU - Professor View');
    expect(body.classList.contains('role-professor')).toBe(true);
    expect(body.dataset.shellRole).toBe('professor');
    expect(dom.window.document.documentElement.dataset.shellRole).toBe('professor');
  });

  it('falls back to the stored role when the view query is absent', () => {
    const dom = bootPrimer('http://localhost/index.html#home', 'ta');
    const body = dom.window.document.body;

    expect(dom.window.document.title).toBe('KIU - Teaching Assistant View');
    expect(body.classList.contains('role-ta')).toBe(true);
    expect(body.dataset.shellRole).toBe('ta');
  });

  it('installs a universal pre-paint guard for route body content', () => {
    const dom = bootPrimer('http://localhost/index.html#home');
    const guard = dom.window.document.getElementById('kiu-shell-boot-guard');

    expect(guard?.textContent).toContain(
      'html.kiu-shell-loading body.kiu-shell-loading > :not(script):not(style)'
    );
    expect(guard?.textContent).toContain('visibility:hidden!important;');
  });

  it('publishes a loading state before the shared reveal coordinator loads', () => {
    const dom = bootPrimer('http://localhost/index.html#home');
    const root = dom.window.document.documentElement;
    const body = dom.window.document.body;

    expect(dom.window.__kiuShellLoadState).toMatchObject({
      phase: 'loading',
      stage: 'background',
      degraded: false
    });
    expect(root.dataset.kiuLoadPhase).toBe('loading');
    expect(root.dataset.kiuLoadStage).toBe('background');
    expect(body.dataset.kiuLoadPhase).toBe('loading');
    expect(body.dataset.kiuLoadStage).toBe('background');
    expect(body.getAttribute('aria-busy')).toBe('true');
    expect(typeof dom.window.__kiuSetShellLoadState).toBe('function');
  });

  it('loads the primer synchronously before body content on unified entry routes', () => {
    for (const route of ['index.html', 'social.html', 'exam-portal.html']) {
      const html = readSource(route);
      expect(html.indexOf('theme-primer.js?v=20260818-paletteprimer1')).toBeGreaterThanOrEqual(0);
      expect(html.indexOf('theme-primer.js?v=20260818-paletteprimer1')).toBeLessThan(html.indexOf('<body'));
    }
    expect(readSource('exam-portal.html')).toMatch(
      /<body[^>]*class="[^"]*kiu-shell-loading/
    );
  });
});
