import FOG from "../../vendor/vanta/vanta.fog.js";
import * as THREE from "../../vendor/three/three.module.js";

let vantaInstance = null;
let engineReady = false;
let settingsSignature = "";

function hexToInt(hex) {
  return parseInt(String(hex).replace("#", ""), 16);
}

function arePortalBackgroundAnimationsEnabled() {
  if (typeof window.areBackgroundAnimationsEnabled === "function") {
    return window.areBackgroundAnimationsEnabled();
  }
  const stored = String(localStorage.getItem("kiuLuxuryBackgroundAnimationsEnabled") || "").trim().toLowerCase();
  if (stored) return !(stored === "0" || stored === "false" || stored === "off");
  return true;
}

function readFogSettings() {
  if (typeof window.getFogSettings === "function") {
    return window.getFogSettings();
  }
  return {
    highlightColor: "#b794f6",
    midtoneColor: "#6366f1",
    lowlightColor: "#0f172a",
    baseColor: "#020617",
    blurFactor: 0.6,
    speed: 1.0,
    zoom: 1.0,
  };
}

function resolveFogOptionsFromSettings() {
  const settings = readFogSettings();
  return {
    highlightColor: hexToInt(settings.highlightColor),
    midtoneColor: hexToInt(settings.midtoneColor),
    lowlightColor: hexToInt(settings.lowlightColor),
    baseColor: hexToInt(settings.baseColor),
    blurFactor: settings.blurFactor,
    speed: settings.speed,
    zoom: settings.zoom,
    _signature: JSON.stringify(settings),
  };
}

function ensureFogMount() {
  let el = document.getElementById("lux-bg-fog");
  if (el) return el;
  el = document.createElement("div");
  el.id = "lux-bg-fog";
  el.setAttribute("aria-hidden", "true");
  const canvas = document.getElementById("lux-bg-canvas");
  if (canvas?.parentNode) {
    canvas.parentNode.insertBefore(el, canvas);
  } else {
    document.body.prepend(el);
  }
  return el;
}

export function applyLmsFogTheme() {
  if (!vantaInstance) return;
  const options = resolveFogOptionsFromSettings();
  if (options._signature === settingsSignature) return;
  settingsSignature = options._signature;
  const { _signature, ...opts } = options;
  vantaInstance.setOptions(opts);
}

export function initLuxuryVantaFogBackground() {
  if (engineReady) {
    applyLmsFogTheme();
    return true;
  }
  if (window.__kiuWebGlUnavailable || window.__kiuLuxuryParticleBackgroundUnavailable) {
    return false;
  }
  if (!arePortalBackgroundAnimationsEnabled()) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Skip Vanta/Three when Brave (or others) disable WebGL — avoid console spam.
  if (typeof window.__kiuProbeWebGlAvailable === "function" && !window.__kiuProbeWebGlAvailable()) {
    window.__kiuWebGlUnavailable = true;
    return false;
  }

  const el = ensureFogMount();
  const options = resolveFogOptionsFromSettings();
  settingsSignature = options._signature;
  const { _signature, ...fogOpts } = options;

  try {
    vantaInstance = FOG({
      el,
      THREE,
      ...fogOpts,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 2,
      scaleMobile: 4,
    });

    engineReady = true;
    window.__kiuLuxuryVantaFogBackgroundReady = true;
    return true;
  } catch (error) {
    try { vantaInstance?.destroy?.(); } catch (e) {}
    vantaInstance = null;
    engineReady = false;
    window.__kiuLuxuryVantaFogBackgroundReady = false;
    window.__kiuWebGlUnavailable = true;
    return false;
  }
}

export function refreshLuxuryVantaFogBackground() {
  if (!engineReady && !initLuxuryVantaFogBackground()) return;
  if (!arePortalBackgroundAnimationsEnabled()) {
    disposeLuxuryVantaFogBackground();
    return;
  }
  settingsSignature = "";
  applyLmsFogTheme();
  vantaInstance?.resize();
}

export function disposeLuxuryVantaFogBackground() {
  vantaInstance?.destroy();
  vantaInstance = null;
  engineReady = false;
  settingsSignature = "";
  window.__kiuLuxuryVantaFogBackgroundReady = false;
}

window.__kiuInitLuxuryVantaFogBackground = initLuxuryVantaFogBackground;
window.__kiuRefreshLuxuryVantaFogBackground = refreshLuxuryVantaFogBackground;
window.__kiuDisposeLuxuryVantaFogBackground = disposeLuxuryVantaFogBackground;
window.__kiuApplyLmsFogTheme = applyLmsFogTheme;