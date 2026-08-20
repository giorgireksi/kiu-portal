import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const source = readFileSync(join(process.cwd(), 'assets/js/shared/lux-button-burst.js'), 'utf8');

function createBurstDom(markup, reducedMotion = false) {
    const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, {
        runScripts: 'outside-only',
        pretendToBeVisual: true,
        url: 'http://localhost/index.html'
    });
    dom.window.matchMedia = vi.fn(() => ({ matches: reducedMotion }));
    dom.window.requestAnimationFrame = (callback) => {
        callback();
        return 1;
    };
    dom.window.eval(source);
    return dom;
}

function giveRect(element) {
    element.getBoundingClientRect = () => ({ left: 20, top: 30, width: 120, height: 44 });
}

describe('global button burst runtime', () => {
    it('bursts on ordinary and dynamically added popup buttons', () => {
        const dom = createBurstDom('<button id="page-button">Page</button>');
        const pageButton = dom.window.document.getElementById('page-button');
        giveRect(pageButton);
        pageButton.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(dom.window.document.querySelectorAll('#lux-button-burst-layer > .lux-chip-burst-particle')).toHaveLength(24);

        dom.window.close();
        const popupDom = createBurstDom('<div id="popup" role="dialog"></div>');
        const popupButton = popupDom.window.document.createElement('button');
        popupButton.textContent = 'Popup action';
        popupDom.window.document.getElementById('popup').appendChild(popupButton);
        giveRect(popupButton);
        popupButton.dispatchEvent(new popupDom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(popupDom.window.document.querySelectorAll('#lux-button-burst-layer > .lux-chip-burst-particle')).toHaveLength(24);
        popupDom.window.close();
    });

    it('does not burst for excluded controls or reduced-motion users', () => {
        const excluded = createBurstDom(`
            <button id="disabled" disabled>Disabled</button>
            <button id="scroll" class="lux-scroll-rail__btn">Scroll</button>
            <button id="off" data-lux-click-burst="off">Off</button>
        `);
        for (const id of ['disabled', 'scroll', 'off']) {
            const button = excluded.window.document.getElementById(id);
            giveRect(button);
            button.dispatchEvent(new excluded.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        }
        expect(excluded.window.document.getElementById('lux-button-burst-layer')).toBeNull();
        excluded.window.close();

        const reduced = createBurstDom('<button id="button">Reduced</button>', true);
        const button = reduced.window.document.getElementById('button');
        giveRect(button);
        button.dispatchEvent(new reduced.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(reduced.window.document.getElementById('lux-button-burst-layer')).toBeNull();
        reduced.window.spawnLuxChipBurstParticles(button);
        expect(reduced.window.document.getElementById('lux-button-burst-layer')).toBeNull();
        reduced.window.close();
    });

    it('persists a global opt-out, suppresses direct calls, and clears active particles', () => {
        const dom = createBurstDom('<button id="button">Action</button>');
        const button = dom.window.document.getElementById('button');
        giveRect(button);
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(true);
        button.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(24);

        expect(dom.window.setLuxButtonBurstEnabled(false)).toBe(false);
        expect(dom.window.localStorage.getItem('kiuLuxuryButtonBurstEnabled')).toBe('false');
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(0);
        button.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(0);
        dom.window.spawnLuxChipBurstParticles(button);
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(0);

        dom.window.setLuxButtonBurstEnabled(true);
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(true);
        button.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(24);
        dom.window.close();
    });

    it('resets the preference to the enabled default', () => {
        const dom = createBurstDom('<button id="button">Action</button>');
        dom.window.localStorage.setItem('kiuLuxuryButtonBurstEnabled', 'false');
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(false);
        dom.window.resetLuxButtonBurstPreference();
        expect(dom.window.localStorage.getItem('kiuLuxuryButtonBurstEnabled')).toBeNull();
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(true);
        dom.window.close();
    });

    it('treats malformed stored values as enabled and handles storage clearing', () => {
        const dom = createBurstDom('<button>Action</button>');
        dom.window.localStorage.setItem('kiuLuxuryButtonBurstEnabled', 'unexpected');
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(true);
        dom.window.localStorage.setItem('kiuLuxuryButtonBurstEnabled', 'false');
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(false);
        dom.window.localStorage.clear();
        dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: null }));
        expect(dom.window.getLuxButtonBurstEnabled()).toBe(true);
        dom.window.close();
    });

    it('binds once and removes particles on animationend', () => {
        const dom = createBurstDom('<button id="button">Action</button>');
        const button = dom.window.document.getElementById('button');
        giveRect(button);
        dom.window.eval(source);
        button.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        const particles = [...dom.window.document.querySelectorAll('.lux-chip-burst-particle')];
        expect(particles).toHaveLength(24);
        particles.forEach((particle) => particle.dispatchEvent(new dom.window.Event('animationend')));
        expect(dom.window.document.querySelectorAll('.lux-chip-burst-particle')).toHaveLength(0);
        dom.window.close();
    });
});
