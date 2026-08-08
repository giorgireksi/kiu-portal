import FOG from "../../vendor/vanta/vanta.fog.js";
import * as THREE from "../../vendor/three/three.module.js";
import {
  onGovernorStateChange,
  readGovernedFrameIntervalMs,
  shouldSkipCanvasFrame,
} from "../shared/lux-render-governor.js?v=20260808-overallperf1";

let vantaInstance = null;
let engineReady = false;
let settingsSignature = "";
let fogLoopTimer = 0;
let fogNativeLoop = null;
let fogRenderScale = 0;

function getFogRenderScale() {
  const quality = String(window.getParticleQuality?.() || "auto").trim().toLowerCase();
  if (quality === "high") return 2;
  if (quality === "balanced") return 1.25;
  if (quality === "low") return 1;

  const tier = window.getLuxuryBackgroundRenderProfile?.().tier || "standard";
  if (tier === "high") return 2;
  if (tier === "efficient") return 1;
  return 1.25;
}

function readFogFrameInterval() {
  return readGovernedFrameIntervalMs();
}

function stopFogRenderLoop() {
  if (fogLoopTimer) {
    clearTimeout(fogLoopTimer);
    fogLoopTimer = 0;
  }
  if (vantaInstance?.req) {
    cancelAnimationFrame(vantaInstance.req);
    vantaInstance.req = null;
  }
}

let fogGovernorUnsubscribe = null;

function startFogRenderLoop(instance) {
  if (!instance) return;
  stopFogRenderLoop();
  fogNativeLoop = instance.animationLoop.bind(instance);
  instance.animationLoop = () => {};
  function tick() {
    fogLoopTimer = 0;
    if (!vantaInstance || !engineReady) return;
    if (!shouldSkipCanvasFrame()) {
      fogNativeLoop();
    }
    fogLoopTimer = window.setTimeout(tick, readFogFrameInterval());
  }
  if (!fogGovernorUnsubscribe) {
    fogGovernorUnsubscribe = onGovernorStateChange(() => {
      if (!fogLoopTimer || !vantaInstance) return;
      window.clearTimeout(fogLoopTimer);
      fogLoopTimer = window.setTimeout(tick, readFogFrameInterval());
    });
  }
  fogLoopTimer = window.setTimeout(tick, 0);
}

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
  const nextRenderScale = getFogRenderScale();
  if (engineReady) {
    if (nextRenderScale !== fogRenderScale) {
      disposeLuxuryVantaFogBackground();
    } else {
      applyLmsFogTheme();
      startFogRenderLoop(vantaInstance);
      return true;
    }
  }
  if (window.__kiuWebGlUnavailable) {
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
  el.style.display = "";
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
      scale: nextRenderScale,
      scaleMobile: Math.min(nextRenderScale, 1.5),
    });

    engineReady = true;
    fogRenderScale = nextRenderScale;
    window.__kiuLuxuryVantaFogBackgroundReady = true;
    const particleCanvas = document.getElementById("lux-bg-canvas");
    if (particleCanvas) particleCanvas.style.display = "none";
    startFogRenderLoop(vantaInstance);
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
  stopFogRenderLoop();
  try { vantaInstance?.destroy(); } catch (_error) { /* ignore */ }
  vantaInstance = null;
  engineReady = false;
  fogRenderScale = 0;
  settingsSignature = "";
  window.__kiuLuxuryVantaFogBackgroundReady = false;
  try {
    const el = document.getElementById("lux-bg-fog");
    if (el) el.style.display = "none";
  } catch (_error) { /* ignore */ }
}

window.__kiuInitLuxuryVantaFogBackground = initLuxuryVantaFogBackground;
window.__kiuRefreshLuxuryVantaFogBackground = refreshLuxuryVantaFogBackground;
window.__kiuDisposeLuxuryVantaFogBackground = disposeLuxuryVantaFogBackground;
window.__kiuApplyLmsFogTheme = applyLmsFogTheme;
