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
});
