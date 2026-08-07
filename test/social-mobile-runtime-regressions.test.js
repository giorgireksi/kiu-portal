import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-mobile-runtime-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('force-hides #lux-topbar on mobile boot via syncMobileTopbarVisibility', () => {
        const source = readSource('assets/js/pages/social-mobile.js');
        expect(source).toContain('function syncMobileTopbarVisibility()');
        expect(source).toContain("style.setProperty('display', 'none', 'important')");
        expect(readSource('social.html')).toMatch(/social-mobile\.js\?v=20260807-theme1/);

        const dom = new JSDOM(
            `<!DOCTYPE html><html><head></head><body class="lux-route-social lux-unified-shell">
        <div id="lux-topbar"><div class="lux-topbar-shell lux-soft-chrome"></div></div>
        <button id="lux-sidebar-toggle"></button>
        <nav id="mobile-bottom-nav">
          <div class="mobile-nav-row mobile-nav-row--seven">
            <button class="mobile-nav-btn is-active" data-social-nav="home" data-social-panel="feed" type="button" id="mob-nav-home"></button>
            <button class="mobile-nav-btn" data-social-nav="more" type="button" id="mob-nav-more" data-action="more"></button>
            <button class="mobile-nav-btn" data-social-nav="inbox" type="button" id="mob-nav-inbox"></button>
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
            { url: 'http://localhost/social.html', runScripts: 'outside-only' }
        );
        dom.window.innerWidth = 480;
        dom.window.navigate = vi.fn();
        dom.window.resolvePortalRouteUrl = vi.fn((t, r) => `#${r}-${t}`);
        dom.window.requestAnimationFrame = (cb) => {
            cb(0);
            return 1;
        };
        dom.window.setTimeout = (cb) => {
            cb();
            return 1;
        };
        dom.window.eval(readSource('assets/js/pages/social-mobile.js'));
        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));

        const topbar = dom.window.document.getElementById('lux-topbar');
        expect(topbar?.hidden).toBe(true);
        expect(topbar?.style.getPropertyValue('display')).toBe('none');
    });

    it('injects shared lux-mobile-action-sheet.css when More opens', () => {
        const source = readSource('assets/js/pages/social-mobile.js');
        expect(source).toContain('function ensureMobileActionSheetCss()');
        expect(source).toContain('lux-mobile-action-sheet.css?v=20260806-shortcuttop1');
        expect(readSource('assets/css/lux-mobile-action-sheet.css')).toContain('@media (max-width: 1024px)');
        expect(readSource('assets/css/lux-mobile-action-sheet.css')).toContain('.mob-sheet-section--social-top');
        expect(readSource('social.html')).not.toMatch(/lux-mobile-action-sheet\.css/);

        const dom = new JSDOM(
            `<!DOCTYPE html><html><head></head><body class="lux-route-social lux-unified-shell">
        <nav id="mobile-bottom-nav">
          <div class="mobile-nav-row">
            <button class="mobile-nav-btn" data-social-nav="more" type="button" id="mob-nav-more" data-action="more"></button>
          </div>
        </nav>
        <div id="mobile-action-sheet" hidden>
          <div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>
          <div class="mob-sheet-panel">
            <div id="mob-sheet-dynamic-nav"></div>
            <button id="mob-sheet-close" type="button">Close</button>
            <button id="mob-act-admin" type="button"></button>
            <button id="mob-act-theme" type="button"></button>
            <button id="mob-act-profile" type="button"></button>
            <button id="mob-act-lightmode" type="button"><span>Light Mode</span><i class="fas fa-sun"></i></button>
          </div>
        </div>
      </body></html>`,
            { url: 'http://localhost/social.html', runScripts: 'outside-only' }
        );
        dom.window.innerWidth = 480;
        dom.window.navigate = vi.fn();
        dom.window.requestAnimationFrame = (cb) => {
            cb(0);
            return 1;
        };
        dom.window.setTimeout = (cb) => {
            cb();
            return 1;
        };
        dom.window.eval(readSource('assets/js/pages/social-mobile.js'));
        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
        dom.window.document.getElementById('mob-nav-more')
            ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        const sheetCss = dom.window.document.querySelector('link[data-kiu-mobile-action-sheet]');
        expect(sheetCss).not.toBeNull();
        expect(String(sheetCss?.getAttribute('href') || '')).toContain('lux-mobile-action-sheet.css');
        expect(dom.window.document.getElementById('mobile-action-sheet')?.classList.contains('is-open')).toBe(true);
    });

    it('renders Social Shortcuts as the top dynamic More-sheet section before role nav', () => {
        const source = readSource('assets/js/pages/social-mobile.js');
        expect(source).toContain('mob-sheet-section--social-top');
        expect(source.indexOf('Social Shortcuts')).toBeLessThan(source.indexOf('roleGroupsHtml'));
        expect(source.indexOf('socialShortcutsHtml + roleGroupsHtml')).toBeGreaterThan(-1);

        const dom = new JSDOM(
            `<!DOCTYPE html><html><head></head><body class="lux-route-social lux-unified-shell">
        <nav id="mobile-bottom-nav">
          <div class="mobile-nav-row">
            <button class="mobile-nav-btn" data-social-nav="more" type="button" id="mob-nav-more" data-action="more"></button>
          </div>
        </nav>
        <div id="mobile-action-sheet" hidden>
          <div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>
          <div class="mob-sheet-panel">
            <div id="mob-sheet-dynamic-nav"></div>
            <button id="mob-sheet-close" type="button">Close</button>
            <button id="mob-act-admin" type="button"></button>
            <button id="mob-act-theme" type="button"></button>
            <button id="mob-act-profile" type="button"></button>
            <button id="mob-act-lightmode" type="button"><span>Light Mode</span><i class="fas fa-sun"></i></button>
          </div>
        </div>
      </body></html>`,
            { url: 'http://localhost/social.html', runScripts: 'outside-only' }
        );
        dom.window.innerWidth = 480;
        dom.window.navigate = vi.fn();
        dom.window.getEffectiveRole = () => 'student';
        dom.window.requestAnimationFrame = (cb) => {
            cb(0);
            return 1;
        };
        dom.window.setTimeout = (cb) => {
            cb();
            return 1;
        };
        dom.window.eval(readSource('assets/js/pages/social-mobile.js'));
        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
        dom.window.document.getElementById('mob-nav-more')
            ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        const html = String(dom.window.document.getElementById('mob-sheet-dynamic-nav')?.innerHTML || '');
        expect(html).toContain('mob-sheet-section--social-top');
        expect(html.indexOf('Social Shortcuts')).toBeGreaterThan(-1);
        expect(html.indexOf('Social Shortcuts')).toBeLessThan(html.indexOf('Core'));
    });

    it('opens the color studio from Theme, not the dashboard customize button', () => {
        const source = readSource('assets/js/pages/social-mobile.js');
        expect(source).toContain("getElementById('lux-palette-btn')");
        expect(source).toContain('window.openStudio');
        expect(source).not.toMatch(/function openStudioPanel\(\) \{[\s\S]*lux-topbar-editor-btn/);

        const dom = new JSDOM(
            `<!DOCTYPE html><html><head></head><body class="lux-route-social lux-unified-shell">
        <button id="lux-palette-btn" type="button"></button>
        <div id="mobile-action-sheet" style="display:none;">
          <button id="mob-act-theme" type="button"></button>
        </div>
      </body></html>`,
            { url: 'http://localhost/social.html', runScripts: 'outside-only' }
        );
        dom.window.innerWidth = 480;
        dom.window.requestAnimationFrame = (cb) => {
            cb(0);
            return 1;
        };
        dom.window.setTimeout = (cb) => {
            cb();
            return 1;
        };

        const paletteClick = vi.fn();
        dom.window.document.getElementById('lux-palette-btn')
            ?.addEventListener('click', paletteClick);

        dom.window.eval(readSource('assets/js/pages/social-mobile.js'));
        dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
        dom.window.document.getElementById('mob-act-theme')
            ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        expect(paletteClick).toHaveBeenCalledTimes(1);
    });
});
