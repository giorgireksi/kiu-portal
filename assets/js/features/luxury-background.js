/* Luxury background orchestrator — particle (Three) and fog (Vanta) engines load on demand. */

let activeEngine = null;
let fogModulePromise = null;
let particleModulePromise = null;
let particleModule = null;

function isFogMode(mode) {
  return String(mode || "").trim().toLowerCase() === "fog";
}

function readActiveMode(modeOrOpts) {
  if (typeof modeOrOpts === "string" && modeOrOpts.trim()) return modeOrOpts.trim().toLowerCase();
  if (typeof window.getBackgroundMode === "function") return window.getBackgroundMode();
  return String(localStorage.getItem("kiuLuxuryBackgroundMode") || "orbit").trim().toLowerCase();
}

/** Lightweight WebGL probe — no Three.js. */
function probeWebGlAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch (error) {
    return false;
  }
}

function applyStaticBackgroundShell() {
  try {
    document.body?.classList?.add("lux-bg-static", "lux-bg-webgl-unavailable");
    document.body?.setAttribute("data-lux-background-animation", "off");
    window.__kiuWebGlUnavailable = true;
    window.__kiuLuxuryParticleBackgroundUnavailable = true;
    window.__kiuLuxuryParticleBackgroundReady = false;
  } catch (error) {}
  activeEngine = null;
}

async function loadFogModule() {
  if (!fogModulePromise) {
    fogModulePromise = import("./luxury-vanta-fog-background.js");
  }
  return fogModulePromise;
}

async function loadParticleModule() {
  if (!particleModulePromise) {
    particleModulePromise = import("./luxury-particle-background.js").then((mod) => {
      particleModule = mod;
      return mod;
    });
  }
  return particleModulePromise;
}

async function refreshLuxuryBackground(modeOrOpts) {
  const mode = readActiveMode(modeOrOpts);
  const nextEngine = isFogMode(mode) ? "fog" : "particle";

  // Brave / disabled GPU: never touch Three or Vanta.
  if (window.__kiuWebGlUnavailable === true || window.__kiuLuxuryParticleBackgroundUnavailable === true) {
    applyStaticBackgroundShell();
    return;
  }
  if (!probeWebGlAvailable()) {
    applyStaticBackgroundShell();
    return;
  }

  if (activeEngine && activeEngine !== nextEngine) {
    if (activeEngine === "particle" && particleModule?.disposeLuxuryParticleBackground) {
      particleModule.disposeLuxuryParticleBackground();
    } else if (typeof window.__kiuDisposeLuxuryVantaFogBackground === "function") {
      window.__kiuDisposeLuxuryVantaFogBackground();
    }
    activeEngine = null;
  }

  document.body.dataset.luxBackgroundMode = mode;

  if (nextEngine === "fog") {
    const fog = await loadFogModule();
    if (particleModule?.disposeLuxuryParticleBackground) {
      particleModule.disposeLuxuryParticleBackground();
    }
    window.__kiuDisposeLuxuryParticleBackground?.();
    if (window.__kiuWebGlUnavailable) {
      applyStaticBackgroundShell();
      return;
    }
    const ok = fog.initLuxuryVantaFogBackground();
    if (!ok) {
      applyStaticBackgroundShell();
      return;
    }
    fog.refreshLuxuryVantaFogBackground();
    activeEngine = "fog";
    return;
  }

  window.__kiuDisposeLuxuryVantaFogBackground?.();
  if (window.__kiuLuxuryParticleBackgroundUnavailable) {
    applyStaticBackgroundShell();
    return;
  }

  const particle = await loadParticleModule();
  particle.refreshLuxuryParticleBackground(mode);
  if (window.__kiuLuxuryParticleBackgroundUnavailable || !window.__kiuLuxuryParticleBackgroundReady) {
    applyStaticBackgroundShell();
    return;
  }
  activeEngine = "particle";
}

function scheduleBackgroundSelfInit(attempt = 0) {
  const hasMount = document.getElementById("lux-bg-canvas") || document.getElementById("lux-bg-fog");
  if (hasMount) {
    refreshLuxuryBackground();
    return;
  }
  if (attempt < 120) {
    window.requestAnimationFrame(() => scheduleBackgroundSelfInit(attempt + 1));
  }
}

window.__kiuRefreshLuxuryBackground = (mode) => {
  refreshLuxuryBackground(mode);
};
window.__kiuInitLuxuryParticleBackground = async () => {
  const particle = await loadParticleModule();
  return particle.initLuxuryParticleBackground();
};
window.__kiuDisposeLuxuryParticleBackground = () => {
  if (particleModule?.disposeLuxuryParticleBackground) {
    particleModule.disposeLuxuryParticleBackground();
  }
};
window.__kiuProbeWebGlAvailable = probeWebGlAvailable;

function runSelfInit() {
  if (document.body?.classList?.contains("lux-route-admin-orders")) return;
  if (
    document.body?.classList?.contains("lux-route-orders")
    || document.body?.classList?.contains("lux-route-library")
  ) {
    const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 120));
    schedule(() => scheduleBackgroundSelfInit());
    return;
  }
  scheduleBackgroundSelfInit();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runSelfInit, { once: true });
} else {
  runSelfInit();
}
