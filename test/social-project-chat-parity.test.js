import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project workspace chat parity', () => {
  const pageSource = readSource('assets/js/pages/social-page.js');
  const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');
  const rebuildCss = readSource('assets/css/social-rebuild.css');
  const projectsCss = readSource('assets/css/social-projects-lms.css');
  const html = readSource('social.html');
  const utilitiesSource = readSource('assets/js/shared/utilities.js');
  const messagesSource = readSource('assets/js/pages/social-messages.js');

  it('opens project chat in workspace instead of navigating to messages panel', () => {
    const combined = pageSource + readSource('assets/js/pages/social-workspace.js');
    const handler = combined.slice(
      combined.indexOf("if (action === 'project-open-chat')"),
      combined.indexOf("if (action === 'project-member-invite')")
    );
    expect(handler).toContain("state().ui.projectTab = 'chat'");
    expect(handler).toContain('ensureProjectWorkspaceChat(project)');
    expect(handler).not.toContain("setPanel('messages')");
  });

  it('ensures backing group chat without routing away from workspace', () => {
    expect(pageSource).toContain('openPortalSocialGroupChat(project.groupId, { skipRoute: true })');
    expect(runtimeSource).toContain('if (!options?.skipRoute) routeToSocial');
  });

  it('does not cache the chat tab pane for live thread updates', () => {
    const workspace = readSource('assets/js/pages/social-workspace.js');
    expect(pageSource + workspace).toContain("if (pane && text(tabId) !== 'chat' && pane.nodeType === Node.ELEMENT_NODE) return pane;");
  });

  it('includes embedded project chat in center-only thread render reasons', () => {
    expect(readFileSync(join(process.cwd(), 'assets/js/pages/social-render-plan.js'), 'utf8')).toContain("activePanel === 'workspace' && text(runtime?.ui?.projectTab || '') === 'chat'");
  });

  it('tracks thread-local UI state in the render signature', () => {
    const signatureBlock = pageSource.slice(
      pageSource.indexOf('function buildSocialRenderSignature'),
      pageSource.indexOf('function buildSocialRenderSignature') + 1200
    );
    expect(signatureBlock).toContain('groupThreadSearchByChat');
    expect(signatureBlock).toContain('groupThreadPanelByChat');
    expect(signatureBlock).toContain('messageFileByChat');
    expect(signatureBlock).toContain('groupThreadJumpMessageByChat');
  });

  it('resolves attach files from the compose form chat id', () => {
    const messagesSource = readSource('assets/js/pages/social-messages.js');
    const attachCombined = pageSource + messagesSource;
    const attachStart = attachCombined.indexOf("if (target.name === 'messageFile')");
    const attachBlock = attachCombined.slice(attachStart, attachStart + 800);
    expect(attachBlock).toContain("target.closest('form[data-form=\"send-message\"]')");
    expect(attachBlock).toContain("form?.getAttribute('data-chat-id')");
  });

  it('embeds the shared messages thread shell in the chat tab', () => {
    expect(readSource('assets/js/pages/social-workspace.js')).toContain('renderMessagesThreadShell');
    expect(pageSource).not.toContain('social-project-chat-launch');
  });

  it('styles project workspace chat with messages thread selectors in projects-lms CSS', () => {
    // Workspace chat chrome lives in social-projects-lms.css (not rebuild).
    expect(projectsCss).toContain('body.lux-route-social .social-project-workspace-chat {');
    expect(projectsCss).toContain('body.lux-route-social .social-project-workspace-chat .social-neo-messages__thread-shell');
    expect(projectsCss).not.toContain('.social-project-workspace-chat .social-neo-msg-compose-row');
  });

  it('aligns social-page cache bust with chat embed rollout', () => {
    expect(html).toContain('social-page.js?v=20260713-groups-detail9');
  });

  it('keeps message stream off the lux transparency painter', () => {
    expect(utilitiesSource).toContain("'social-neo-thread-messages'");
    expect(utilitiesSource).toContain("'social-neo-messages__thread-stream'");
    expect(messagesSource).toContain('data-lux-transparency-exempt="1"');
    expect(messagesSource).toContain('social-neo-messages__thread-stream');
  });
});
