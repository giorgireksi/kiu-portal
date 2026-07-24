import { describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function bootShellChromeRuntime() {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body>
      <aside id="lux-shell"><button id="lux-sidebar-close" type="button"></button></aside>
      <div id="lux-topbar">
        <button id="lux-sidebar-toggle" type="button"></button>
        <button id="lux-faculty-picker-btn" type="button"></button>
        <button id="lux-role-picker-btn" type="button"></button>
        <button id="lux-dashboard-edit-btn" type="button"></button>
        <button id="lux-palette-btn" type="button"></button>
        <div class="lux-utility-wrap"><button id="lux-notification-btn" type="button"></button></div>
        <div class="lux-utility-wrap"><button id="lux-chat-btn" type="button"></button></div>
      </div>
    </body></html>`,
    {
      url: 'http://localhost/index.html?view=student#home',
      runScripts: 'outside-only'
    }
  );

  dom.window.requestAnimationFrame = (cb) => {
    cb(0);
    return 1;
  };
  dom.window.setTimeout = (cb) => {
    cb();
    return 1;
  };
  dom.window.getLuxurySharedConfig = () => ({});
  dom.window.closeStudio = () => {};
  dom.window.closePickerPanels = () => {};
  dom.window.toggleSidebar = vi.fn();
  dom.window.toggleStudio = () => {};
  dom.window.ensureCacheClearActionInMobileSheet = () => {};
  dom.window.bindCacheClearLaunchButtons = () => {};
  dom.window.populateFacultySwitcher = () => {};
  dom.window.populateRoleSwitcher = () => {};
  dom.window.togglePickerPanel = () => {};
  dom.window.bootstrapKiuRealtimeBridge = () => Promise.resolve();
  dom.window.ensurePortalSocialRuntimeLoaded = () => Promise.resolve();
  dom.window.isHomeEditorAvailable = () => false;
  dom.window.showToast = () => {};
  dom.window.getEffectiveRole = () => 'student';
  dom.window.getCurrentUserSafe = () => ({
    id: 'student-smoke',
    name: 'Student Demo',
    role: 'student',
    faculty: 'ECON'
  });
  dom.window.buildHomeModel = () => ({});
  dom.window.openHomeEditor = () => {};
  dom.window.getPageLabels = () => ({ home: 'Dashboard' });
  dom.window.navigate = vi.fn();
  dom.window.pageTarget = (pageId) => pageId;
  dom.window.renderTopbarUtilityPanels = () => {};
  dom.window.focusFirstInteractive = () => {};
  dom.window.restoreTeleportedNode = () => {};
  dom.window.restoreFocusById = () => {};
  dom.window.deferRestoreFocusById = () => {};
  dom.window.syncTopbar = () => {};

  dom.window.eval(readSource('assets/js/features/luxury-shell-picker-runtime.js'));
  dom.window.eval(readSource('assets/js/features/luxury-shell-chrome.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
  return dom;
}

describe('luxury shell chrome runtime bindings', () => {
  it('keeps full-paint topbar control paint in shell-dashboard-paint (index-luxury retired)', () => {
    expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    const css = readSource('assets/css/lux-shell.css');

    expect(css).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
    expect(css).toContain('#lux-topbar .lux-picker-btn');
    expect(css).toContain('#lux-topbar .lux-icon-btn');
    expect(css).toContain('#lux-topbar .lux-user-chip');
    expect(css).toMatch(/#lux-topbar \.lux-picker-btn:hover|#lux-topbar \.lux-picker-btn\.is-active/);
    expect(css).toMatch(/#lux-topbar \.lux-icon-btn\.is-active|#lux-topbar \.lux-icon-btn:hover/);
  });

  it('self-initializes topbar and user-menu bindings when the shell already exists', () => {
    const dom = bootShellChromeRuntime();
    const doc = dom.window.document;

    expect(doc.getElementById('lux-sidebar-toggle')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-sidebar-close')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-faculty-picker-btn')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-role-picker-btn')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-notification-btn')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-chat-btn')?.dataset.bound).toBe('1');
    expect(doc.getElementById('lux-user-chip')).toBeNull();
  });

  it('uses the shared global sidebar toggle when the topbar button is clicked', () => {
    const dom = bootShellChromeRuntime();
    const doc = dom.window.document;

    doc.getElementById('lux-sidebar-toggle')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(dom.window.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('uses the shared global sidebar toggle when the shell hide button is clicked', () => {
    const dom = bootShellChromeRuntime();
    const doc = dom.window.document;

    doc.getElementById('lux-sidebar-close')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(dom.window.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('keeps notification and chat utility states on one shared open-state contract', async () => {
    const dom = bootShellChromeRuntime();
    const doc = dom.window.document;
    const flush = async () => {
      await Promise.resolve();
      await Promise.resolve();
    };

    doc.getElementById('lux-notification-btn')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await flush();
    expect(doc.getElementById('lux-notification-btn')?.getAttribute('aria-expanded')).toBe('true');
    expect(doc.getElementById('lux-notification-panel')?.classList.contains('is-open')).toBe(true);

    doc.getElementById('lux-chat-btn')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await flush();
    expect(doc.getElementById('lux-notification-btn')?.getAttribute('aria-expanded')).toBe('false');
    expect(doc.getElementById('lux-chat-btn')?.getAttribute('aria-expanded')).toBe('true');
    expect(doc.getElementById('lux-chat-panel')?.classList.contains('is-open')).toBe(true);
  });

  it('does not throw when syncTopbar runs before every topbar text node exists', () => {
    const dom = bootShellChromeRuntime();

    expect(() => dom.window.syncTopbar()).not.toThrow();
  });

  it('keeps the home customize control permanently hidden in source (static home)', () => {
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shell = readSource('assets/js/features/home-dashboard/shell.js');

    expect(shellChrome).toContain("getElementById('lux-dashboard-edit-btn')");
    expect(shellChrome).toContain('editorButton.hidden = true');
    expect(luxury).toContain('Home layout is fixed and no longer customizable');
    expect(shell).toContain('lux-home-merged');
    expect(shell).not.toContain('Customize dashboard');
  });
});
