import { chromium } from 'playwright';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const BASE = process.env.KIU_SOCIAL_BASE || 'http://127.0.0.1:8876';
const pngPath = join(process.cwd(), '.tmp-photography-upload-smoke.png');

// 1x1 PNG
const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
);

async function main() {
    writeFileSync(pngPath, png);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(`${BASE}/social.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => Boolean(window.__KIU_SOCIAL_PAGE_REBUILT), null, { timeout: 30000 });

        await page.evaluate(() => {
            const runtime = window.__kiuSocialLiteRuntime;
            if (!runtime) throw new Error('runtime missing');
            runtime.ui.activePanel = 'photography';
            runtime.ui.socialDialog = { type: 'photography-upload', step: 1 };
            runtime.ui.photographyUploadStep = 1;
            runtime.ui.photographyUploadDraft = {};
            if (typeof window.__kiuSocialLiteRenderPage === 'function') {
                window.__kiuSocialLiteRenderPage('dialog-photography-upload');
            }
        });

        await page.waitForSelector('input[name="photographyUploadFile"]', { timeout: 15000 });
        const input = page.locator('input[name="photographyUploadFile"]');
        await input.setInputFiles(pngPath);

        await page.waitForFunction(() => {
            const draft = window.__kiuSocialLiteRuntime?.ui?.photographyUploadDraft || {};
            return Boolean(draft.file || draft.previewUrl || draft.fileName);
        }, null, { timeout: 10000 });

        const nextDisabled = await page.locator('[data-action="photography-upload-next"]').isDisabled();
        const hasPreview = await page.locator('.social-photo-upload-preview, .social-photo-upload-dropzone.has-preview').count();

        if (nextDisabled) throw new Error('Next stayed disabled after file selection');
        if (!hasPreview) throw new Error('Preview UI did not appear after file selection');

        console.log('photography-upload-smoke: OK');
    } finally {
        await browser.close();
        try { unlinkSync(pngPath); } catch (error) {}
    }
}

main().catch((error) => {
    console.error('photography-upload-smoke: FAIL', error?.message || error);
    process.exit(1);
});