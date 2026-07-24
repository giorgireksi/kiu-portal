import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function bootPickerPlacementApi() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost/index.html',
        runScripts: 'outside-only'
    });
    dom.window.restoreTeleportedNode = () => {};
    dom.window.focusFirstInteractive = () => {};
    dom.window.deferRestoreFocusById = () => {};
    dom.window.restoreFocusById = () => {};
    dom.window.eval(readSource('assets/js/features/luxury-shell-picker-runtime.js'));
    return dom.window;
}

function stubViewport(win, { width, height }) {
    Object.defineProperty(win, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(win, 'innerHeight', { configurable: true, value: height });
    Object.defineProperty(win.document.documentElement, 'clientWidth', {
        configurable: true,
        value: width
    });
    Object.defineProperty(win.document.documentElement, 'clientHeight', {
        configurable: true,
        value: height
    });
    Object.defineProperty(win, 'scrollX', { configurable: true, value: 0 });
    Object.defineProperty(win, 'scrollY', { configurable: true, value: 0 });
}

function stubPanelBox(panel, getBox) {
    panel.getBoundingClientRect = () => getBox();
    Object.defineProperty(panel, 'offsetHeight', { configurable: true, get: () => 260 });
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, get: () => 260 });
}

describe('lux picker viewport edge clamp', () => {
    it('exposes shared floating panel placer helpers', () => {
        const source = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        expect(source).toContain('function resolveLuxFloatingPanelPlacement');
        expect(source).toContain('function placeLuxFloatingPanel');
        expect(source).toContain('minWidth = 200');
        expect(source).toContain('Flip leftward');
        expect(source).toContain('spaceRight');
        expect(source).toContain('spaceLeft');
        expect(source).toContain('paintPad');
        expect(source).toContain('clientWidth');
        expect(source).toContain('getBoundingClientRect()');
        expect(source).toContain("panel.style.position = 'fixed'");
        expect(source).toContain("panel.style.right = 'auto'");
        expect(source).toContain("panel.style.bottom = 'auto'");
        expect(source).toContain('panel.style.maxHeight');
        expect(source).toContain("panel.style.removeProperty('max-height')");
    });

    it('keeps full preferred width when left-align fits mid-screen', () => {
        const win = bootPickerPlacementApi();
        const placement = win.resolveLuxFloatingPanelPlacement({
            rect: { top: 40, bottom: 80, left: 200, right: 360 },
            viewportWidth: 1100,
            viewportHeight: 800,
            preferredWidth: 320,
            measuredHeight: 260,
            estimatedHeight: 320,
            gap: 8,
            margin: 16
        });
        expect(placement.width).toBe(320);
        expect(placement.left).toBe(200);
        expect(placement.openAbove).toBe(false);
    });

    it('flips leftward at full width when left-align would overflow', () => {
        const win = bootPickerPlacementApi();
        const placement = win.resolveLuxFloatingPanelPlacement({
            rect: { top: 40, bottom: 80, left: 900, right: 1060 },
            viewportWidth: 1100,
            viewportHeight: 800,
            preferredWidth: 320,
            minWidth: 200,
            measuredHeight: 260,
            estimatedHeight: 320,
            gap: 8,
            margin: 16
        });
        // 900+320 > 1084, but 1060-320 = 740 >= 16 → flip, keep 320
        expect(placement.width).toBe(320);
        expect(placement.left).toBe(1060 - 320);
        expect(placement.left + placement.width).toBeLessThanOrEqual(1100 - 16);
    });

    it('flips leftward instead of shrinking when right-align fits preferred', () => {
        const win = bootPickerPlacementApi();
        const placement = win.resolveLuxFloatingPanelPlacement({
            rect: { top: 40, bottom: 80, left: 820, right: 980 },
            viewportWidth: 1100,
            viewportHeight: 800,
            preferredWidth: 320,
            minWidth: 200,
            measuredHeight: 260,
            estimatedHeight: 320,
            gap: 8,
            margin: 16
        });
        // 820+320 > 1084, but 980-320 = 660 >= 16 → flip full width
        expect(placement.width).toBe(320);
        expect(placement.left).toBe(980 - 320);
    });

    it('shrinks only when neither full alignment fits', () => {
        const win = bootPickerPlacementApi();
        const placement = win.resolveLuxFloatingPanelPlacement({
            rect: { top: 40, bottom: 80, left: 40, right: 120 },
            viewportWidth: 280,
            viewportHeight: 600,
            preferredWidth: 320,
            minWidth: 200,
            measuredHeight: 200,
            estimatedHeight: 320,
            gap: 8,
            margin: 16
        });
        // preferred capped to 248; 40+248 > 264 and 120-248 < 16 → shrink
        expect(placement.width).toBeLessThan(320);
        expect(placement.width).toBeGreaterThanOrEqual(200);
        expect(placement.left).toBeGreaterThanOrEqual(16);
        expect(placement.left + placement.width).toBeLessThanOrEqual(280 - 16);
    });

    it('flips above and shrinks maxHeight when space below is tight', () => {
        const win = bootPickerPlacementApi();
        const placement = win.resolveLuxFloatingPanelPlacement({
            rect: { top: 620, bottom: 660, left: 100, right: 260 },
            viewportWidth: 1100,
            viewportHeight: 700,
            preferredWidth: 320,
            measuredHeight: 300,
            estimatedHeight: 320,
            gap: 8,
            margin: 16
        });
        expect(placement.openAbove).toBe(true);
        expect(placement.width).toBe(320);
        expect(placement.maxHeight).toBe(620 - 8);
    });

    it('placeLuxFloatingPanel writes flipped geometry onto the panel', () => {
        const win = bootPickerPlacementApi();
        const doc = win.document;
        stubViewport(win, { width: 1100, height: 800 });

        const trigger = doc.createElement('button');
        trigger.getBoundingClientRect = () => ({
            top: 40,
            bottom: 80,
            left: 820,
            right: 980,
            width: 160,
            height: 40
        });
        const panel = doc.createElement('div');
        stubPanelBox(panel, () => {
            const left = Number.parseFloat(panel.style.left) || 0;
            const width = Number.parseFloat(panel.style.width) || 0;
            return {
                top: 88,
                bottom: 348,
                left,
                right: left + width,
                width,
                height: 260
            };
        });
        doc.body.append(trigger, panel);

        const placement = win.placeLuxFloatingPanel({
            trigger,
            panel,
            preferredWidth: 320,
            minWidth: 200,
            estimatedHeight: 320
        });

        expect(placement.width).toBe(320);
        expect(panel.style.position).toBe('fixed');
        expect(Number.parseFloat(panel.style.left)).toBe(980 - 320);
        expect(Number.parseFloat(panel.style.width)).toBe(320);
        expect(placement.left + placement.width).toBeLessThanOrEqual(1100 - 28);
    });

    it('post-paint shrinks when painted box still hits the page border', () => {
        const win = bootPickerPlacementApi();
        const doc = win.document;
        // 1041+320 == 1377-16 → resolve left-aligns full width; paintPad then shrinks
        stubViewport(win, { width: 1377, height: 900 });

        const trigger = doc.createElement('button');
        trigger.getBoundingClientRect = () => ({
            top: 40,
            bottom: 80,
            left: 1041,
            right: 1201,
            width: 160,
            height: 40
        });
        const panel = doc.createElement('div');
        stubPanelBox(panel, () => {
            const left = Number.parseFloat(panel.style.left) || 0;
            const width = Number.parseFloat(panel.style.width) || 0;
            return {
                top: 88,
                bottom: 348,
                left,
                right: left + width,
                width,
                height: 260
            };
        });
        doc.body.append(trigger, panel);

        const placement = win.placeLuxFloatingPanel({
            trigger,
            panel,
            preferredWidth: 320,
            minWidth: 200,
            margin: 16,
            estimatedHeight: 320
        });

        // paintPad 28 → maxRight 1349; 1041+320=1361 overflows by 12 → width 308
        expect(placement.width).toBe(308);
        expect(Number.parseFloat(panel.style.left)).toBe(1041);
        expect(Number.parseFloat(panel.style.width)).toBe(308);
        expect(Number.parseFloat(panel.style.left) + placement.width)
            .toBeLessThanOrEqual(1377 - 28);
    });
});
