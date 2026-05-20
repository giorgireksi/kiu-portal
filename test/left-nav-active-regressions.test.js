import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('left nav active regressions', () => {
  it('resolves standalone route pages to stable active-page ids for shell highlighting', () => {
    const source = readSource('assets/js/features/navigation.js');

    expect(source).toContain('function normalizeStandaloneActivePageId(pageId) {');
    expect(source).toContain("if (normalizedPageId === 'admin-library') return 'library';");
    expect(source).toContain("if (normalizedPageId === 'admin-orders') return 'orders';");
    expect(source).toContain("const bodyPage = String(document.body?.dataset?.luxPage || document.body?.dataset?.luxEntry || '').trim();");
    expect(source).toContain('return normalizeStandaloneActivePageId(');
  });

  it('includes explicit left-nav targets for profile and faculty gradebook pages', () => {
    const source = readSource('assets/js/features/index-luxury.js');

    expect(source).toContain("['profile-view', 'Profile', 'fas fa-user-circle']");
    expect(source).toContain("['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar']");
  });

  it('keeps browser smoke coverage on the broken standalone route families', () => {
    const source = readSource('tools/runtime_shell_smoke.mjs');

    expect(source).toContain("label: 'profile-view-admin'");
    expect(source).toContain("label: 'faculty-gradebook-professor'");
    expect(source).toContain("label: 'admin-orders-admin'");
    expect(source).toContain("label: 'staff-admin'");
    expect(source).toContain("label: 'student-service-role'");
    expect(source).toContain("activeNavTarget: 'profile-view'");
    expect(source).toContain("activeNavTarget: 'faculty-gradebook'");
    expect(source).toContain("activeNavTarget: 'orders'");
    expect(source).toContain("activeNavTarget: 'staff'");
    expect(source).toContain("activeNavTarget: 'student-service'");
    expect(source).toContain("firstClickTarget: 'orders'");
    expect(source).toContain("firstClickTarget: 'timetable'");
    expect(source).toContain("firstClickTarget: 'students-admin'");
  });
});
