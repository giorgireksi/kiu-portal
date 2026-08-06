import { describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootStandaloneMobileShell(options = {}) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body class="lux-route-library">
      <button id="lux-sidebar-toggle"></button>
      <nav id="mobile-bottom-nav">
        <div class="mobile-nav-row">
          <button class="mobile-nav-btn" id="mob-nav-home" type="button" data-nav-target="home"></button>
          <button class="mobile-nav-btn" id="mob-nav-more" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-theme" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-messages" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-notif" type="button"></button>
        </div>
      </nav>
      <div id="mobile-action-sheet" style="display:none;">
        <div id="mob-sheet-backdrop"></div>
        <div id="mob-sheet-dynamic-nav"></div>
        <button id="mob-sheet-close" type="button"></button>
        <button id="mob-act-admin" type="button"></button>
        <button id="mob-act-theme" type="button"></button>
        <button id="mob-act-profile" type="button"></button>
        <button id="mob-act-lightmode" type="button"><span>Light Mode</span><i class="fas fa-sun"></i></button>
      </div>
    </body></html>`,
    {
      url: 'http://localhost/library.html?view=student',
      runScripts: 'outside-only'
    }
  );

  dom.window.innerWidth = 480;
  dom.window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {
    navByRole: {
      student: [
        {
          group: 'Core',
          items: [['home', 'Dashboard', 'fas fa-th-large'], ['library', 'Library', 'fas fa-book']]
        }
      ]
    }
  };
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

  dom.window.eval(readSource('assets/js/pages/standalone-mobile-shell.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
  return dom;
}

describe('standalone mobile shell runtime', () => {
  it('opens the color studio from Theme, not the dashboard customize button', () => {
    const source = readSource('assets/js/pages/standalone-mobile-shell.js');
    expect(source).toContain("getElementById('lux-palette-btn')");
    expect(source).toContain('window.openStudio');
    expect(source).not.toMatch(/function openStd\(\) \{[\s\S]*lux-topbar-editor-btn/);
  });

  it('injects a Faculty more-sheet action that opens the faculty picker', () => {
    const source = readSource('assets/js/pages/standalone-mobile-shell.js');
    expect(source).toContain('function ensureFacultySheetButton');
    expect(source).toContain('function handleFacultyAction');
    expect(source).toContain("getElementById('lux-faculty-picker-btn')");
    expect(source).toContain("id = 'mob-act-faculty'");

    const dom = bootStandaloneMobileShell();
    const faculty = dom.window.document.getElementById('mob-act-faculty');
    expect(faculty).not.toBeNull();
  });

  it('force-hides #lux-topbar on mobile boot via syncMobileTopbarVisibility', () => {
    const source = readSource('assets/js/pages/standalone-mobile-shell.js');
    expect(source).toContain('function syncMobileTopbarVisibility()');

    const dom = new JSDOM(
      `<!DOCTYPE html><html><head></head><body class="lux-route-library lux-unified-shell">
        <div id="lux-topbar"><div class="lux-topbar-shell"></div></div>
        <button id="lux-sidebar-toggle"></button>
        <nav id="mobile-bottom-nav"><div class="mobile-nav-row"></div></nav>
        <div id="mobile-action-sheet" style="display:none;">
          <div id="mob-sheet-backdrop"></div>
          <div id="mob-sheet-dynamic-nav"></div>
          <button id="mob-sheet-close" type="button"></button>
          <button id="mob-act-admin" type="button"></button>
          <button id="mob-act-theme" type="button"></button>
          <button id="mob-act-profile" type="button"></button>
          <button id="mob-act-lightmode" type="button"><span>Light Mode</span><i class="fas fa-sun"></i></button>
        </div>
      </body></html>`,
      { url: 'http://localhost/library.html', runScripts: 'outside-only' }
    );
    dom.window.innerWidth = 480;
    dom.window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = { navByRole: { student: [] } };
    dom.window.navigate = vi.fn();
    dom.window.resolvePortalRouteUrl = vi.fn((t, r) => `#${r}-${t}`);
    dom.window.requestAnimationFrame = (cb) => { cb(0); return 1; };
    dom.window.setTimeout = (cb) => { cb(); return 1; };
    dom.window.eval(readSource('assets/js/pages/standalone-mobile-shell.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));

    const topbar = dom.window.document.getElementById('lux-topbar');
    expect(topbar?.hidden).toBe(true);
    expect(topbar?.style.getPropertyValue('display')).toBe('none');
  });

  it('falls back to route resolution when standalone mobile navigation fires before window.navigate exists', () => {
    const dom = bootStandaloneMobileShell({ withNavigate: false });
    const doc = dom.window.document;

    doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('#mob-sheet-dynamic-nav [data-nav-target="home"]')
      ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(dom.window.resolvePortalRouteUrl).toHaveBeenCalledWith('home', 'student');
    expect(dom.window.location.hash).toBe('#student-home');
  });
});
