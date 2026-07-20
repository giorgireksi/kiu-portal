import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile view access regressions', () => {
  it('keeps profile-view in the shared allowed-page set so route buttons can open the standalone profile page', () => {
    const source = readSource('assets/js/app/state.js');

    expect(source).toContain("const common = ['home', 'profile', 'profile-view', 'library', 'orders', 'lms', 'social', 'news'];");
  });
});
