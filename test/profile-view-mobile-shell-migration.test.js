import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootProfileViewMobileShell(options = {}) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body class="lux-route-profile-view">
      <button id="lux-sidebar-toggle"></button>
      <nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
        <div class="mobile-nav-row">
          <button class="mobile-nav-btn is-active" id="mob-nav-home" type="button" data-nav-target="home"></button>
          <button class="mobile-nav-btn" id="mob-nav-messages" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-notif" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-theme" type="button"></button>
          <button class="mobile-nav-btn" id="mob-nav-more" type="button"></button>
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
      url: 'http://localhost/profile-view.html?view=student',
      runScripts: 'outside-only'
    }
  );

  dom.window.innerWidth = 480;
  dom.window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {
    activeTarget: 'profile-view',
    adminVisibleRoles: ['admin', 'student_service', 'professor', 'ta'],
    navByRole: {
      student: [
        {
          group: 'Records',
          items: [['profile-view', 'Profile', 'fas fa-user-circle'], ['study-card', 'Study Card', 'far fa-address-card'], ['personal-data', 'Personal Data', 'far fa-user']]
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

describe('profile-view mobile shell migration', () => {
  it('migrates the page onto the shared standalone mobile shell contract', () => {
    const source = readSource('profile-view.html');
    const classificationScriptSource = readSource('tools/visual-route-classification.js');
    const classificationSource = readSource('PORTAL_VISUAL_ROUTE_CLASSIFICATION.md');

    expect(source).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    expect(source).toContain("activeTarget: 'profile-view'");
    expect(source).toContain('assets/js/pages/standalone-mobile-shell.js');
    expect(source).not.toContain('(function initMobileExperience(){');

    expect(classificationScriptSource).toContain("'profile-view.html': { category: 'standard-shell', dedicatedCss: ['assets/css/profile-view-route.css'], mobileShell: 'shared-standalone' }");
    expect(classificationSource).toContain("| `profile-view.html` | `standard-shell` |");
  });

  it('uses the shared standalone shell on first tap and clears the default home active state', () => {
    const dom = bootProfileViewMobileShell({ withNavigate: false });
    const doc = dom.window.document;

    expect(doc.getElementById('mob-nav-home')?.classList.contains('is-active')).toBe(false);

    doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    doc.querySelector('#mob-sheet-dynamic-nav [data-nav-target="study-card"]')
      ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(dom.window.resolvePortalRouteUrl).toHaveBeenCalledWith('study-card', 'student');
    expect(dom.window.location.hash).toBe('#student-study-card');
  });
});
