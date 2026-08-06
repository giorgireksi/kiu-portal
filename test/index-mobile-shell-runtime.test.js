import { describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootMobileShell(options = {}) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body class="lux-route-home"><button id="lux-sidebar-toggle"></button></body></html>`,
    {
      url: 'http://localhost/index.html?view=professor#home',
      runScripts: 'outside-only'
    }
  );

  dom.window.innerWidth = 480;
  if (options.withNavigate !== false) {
    dom.window.navigate = vi.fn();
  }
  dom.window.resolvePortalRouteUrl = vi.fn((target, role) => `#${role}-${target}`);
  dom.window.requestAnimationFrame = (cb) => {
    cb(0);
    return 1;
  };
  dom.window.setTimeout = (cb) => {
    cb();
    return 1;
  };
  dom.window.matchMedia = (query) => ({
    matches: query.includes('max-width: 1024px'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {}
  });

  dom.window.eval(readSource('assets/js/pages/index-mobile-shell.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
  return dom;
}

describe('index mobile shell runtime', () => {
  it('keeps the generated scaffold on the hidden contract instead of inline display stubs', () => {
    const source = readSource('assets/js/pages/index-mobile-shell.js');

    expect(source).toContain('nav.hidden = true;');
    expect(source).toContain('<em class="mob-badge" id="mob-badge-msg" hidden>0</em>');
    expect(source).toContain('<em class="mob-badge" id="mob-badge-notif" hidden>0</em>');
    expect(source).toContain('sheet.hidden = true;');
    expect(source).toContain('function setElementShown(element, shown, displayValue) {');
    expect(source).toContain('if (isElementShown(sheet)) {');
    expect(source).toContain("if (adminSwitch) adminSwitch.hidden = role !== 'admin';");
    expect(source).toContain('setElementShown(nav, isMobileViewport());');
    expect(source).toContain('id="mob-act-faculty"');
    expect(source).toContain("getElementById('lux-faculty-picker-btn')");
  });

  it('aligns mobile-shell-core topbar/bottom-nav breakpoints with the 1024 contract', () => {
    const css = readSource('assets/css/mobile-shell-core.css');
    expect(css).toContain('@media (max-width: 1024px)');
    expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*#lux-topbar,\s*\n?\s*#lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?display:\s*none\s*!important/);
    expect(css).toContain('@media (min-width: 1025px)');
    expect(css).toMatch(/@media \(min-width: 1025px\)[\s\S]*#mobile-bottom-nav\s*\{\s*display:\s*none/);
    expect(css).not.toContain('@media (min-width: 769px)');
    expect(css).not.toContain('padding-top: 60px');
    expect(css).not.toContain('#lux-topbar .lux-picker-btn');
  });

  it('keeps fouc from restyling topbar into document flow on mobile', () => {
    const fouc = readSource('assets/css/lux-fouc-ht.css');
    expect(fouc).toMatch(/@media \(max-width: 1024px\)[\s\S]*body\.lux-unified-shell #lux-topbar\s*\{[\s\S]*?display:\s*none\s*!important/);
    expect(fouc).not.toMatch(/@media \(max-width:900px\)[\s\S]*#lux-topbar\s*\{[\s\S]*?position:\s*relative/);
    expect(fouc).not.toMatch(/@media \(max-width:980px\)[\s\S]*#lux-topbar\s*\{[\s\S]*?position:\s*relative/);
  });

  it('force-hides #lux-topbar on mobile boot via syncMobileTopbarVisibility', () => {
    const source = readSource('assets/js/pages/index-mobile-shell.js');
    expect(source).toContain('function syncMobileTopbarVisibility()');
    expect(source).toContain("style.setProperty('display', 'none', 'important')");

    const dom = new JSDOM(
      `<!DOCTYPE html><html><head></head><body class="lux-route-home lux-unified-shell">
        <div id="lux-topbar"><div class="lux-topbar-shell"></div></div>
        <button id="lux-sidebar-toggle"></button>
      </body></html>`,
      { url: 'http://localhost/index.html', runScripts: 'outside-only' }
    );
    dom.window.innerWidth = 480;
    dom.window.navigate = vi.fn();
    dom.window.resolvePortalRouteUrl = vi.fn((target, role) => `#${role}-${target}`);
    dom.window.requestAnimationFrame = (cb) => { cb(0); return 1; };
    dom.window.setTimeout = (cb) => { cb(); return 1; };
    dom.window.matchMedia = (query) => ({
      matches: query.includes('max-width: 1024px'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {}
    });
    dom.window.eval(readSource('assets/js/pages/index-mobile-shell.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));

    const topbar = dom.window.document.getElementById('lux-topbar');
    expect(topbar?.hidden).toBe(true);
    expect(topbar?.style.getPropertyValue('display')).toBe('none');
  });

  it('creates the mobile nav and action-sheet scaffold at runtime on mobile widths', () => {
    const dom = bootMobileShell();
    const doc = dom.window.document;

    expect(doc.getElementById('mobile-bottom-nav')).not.toBeNull();
    expect(doc.getElementById('mobile-action-sheet')).not.toBeNull();
    expect(doc.getElementById('mob-sheet-dynamic-nav')).not.toBeNull();
    expect(doc.getElementById('mob-act-faculty')).not.toBeNull();
    expect(doc.getElementById('mob-badge-msg')?.hasAttribute('hidden')).toBe(true);
    expect(doc.getElementById('mob-badge-notif')?.hasAttribute('hidden')).toBe(true);
    expect(doc.body.classList.contains('lux-sidebar-collapsed')).toBe(true);
  });

  it('renders professor role navigation labels inside the mobile action sheet', () => {
    const dom = bootMobileShell();
    const doc = dom.window.document;

    doc.body.classList.add('role-professor');
    doc.body.dataset.shellRole = 'professor';
    dom.window.getEffectiveRole = () => 'professor';

    doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    const dynamicNav = doc.getElementById('mob-sheet-dynamic-nav');
    expect(dynamicNav?.textContent || '').toContain('Schedule');
    expect(dynamicNav?.textContent || '').toContain('Gradebook');
    expect(dynamicNav?.textContent || '').toContain('Q&A Desk');
  });

  it('moves focus into the mobile action sheet and closes it with Escape', () => {
    const dom = bootMobileShell();
    const doc = dom.window.document;

    doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    const sheet = doc.getElementById('mobile-action-sheet');
    const closeButton = doc.getElementById('mob-sheet-close');
    const moreButton = doc.getElementById('mob-nav-more');

    expect(sheet?.classList.contains('is-open')).toBe(true);
    expect(closeButton?.getAttribute('data-mob-sheet-focus')).toBe('1');
    expect(doc.activeElement).toBe(closeButton);
    expect(moreButton?.getAttribute('aria-expanded')).toBe('true');

    doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(sheet?.classList.contains('is-open')).toBe(false);
    expect(moreButton?.getAttribute('aria-expanded')).toBe('false');
    expect(doc.activeElement).toBe(moreButton);
  });

  it('falls back to route resolution when mobile navigation is tapped before window.navigate is ready', () => {
    const dom = bootMobileShell({ withNavigate: false });
    const doc = dom.window.document;

    dom.window.getEffectiveRole = () => 'professor';
    doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('#mob-sheet-dynamic-nav [data-nav-target="lms"]')
      ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(dom.window.resolvePortalRouteUrl).toHaveBeenCalledWith('lms', 'professor');
    expect(dom.window.location.hash).toBe('#professor-lms');
  });
});
