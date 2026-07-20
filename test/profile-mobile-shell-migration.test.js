import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile mobile shell migration', () => {
  it('retires the standalone profile page in favor of personal-data', () => {
    const html = readSource('profile.html');
    const standalone = readSource('assets/js/pages/standalone-mobile-shell.js');
    const indexMobile = readSource('assets/js/pages/index-mobile-shell.js');

    expect(html).toContain("window.location.replace('personal-data.html')");
    expect(standalone).toContain("invokeNavigate('personal-data')");
    expect(indexMobile).toContain("invokeNavigate('personal-data')");
    expect(standalone).not.toContain("invokeNavigate('profile-view')");
  });
});
