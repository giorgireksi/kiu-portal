import * as THREE from "../../vendor/three/three.module.js";

const PARTICLE_QUALITY_KEYS = ["low", "balanced", "high", "auto"];
const DEFAULT_PARTICLE_MOTION = 100;
const DEFAULT_PARTICLE_DENSITY = 100;
const DEFAULT_PARTICLE_QUALITY = "balanced";

let canvas = null;
let renderer = null;
let scene = null;
let camera = null;
let uniforms = null;
let material = null;
let ribbonMaterial = null;
let points = null;
let cornerPoints = null;
let ribbonMesh = null;
let clock = null;
let targetMotion = 0.72;
let targetDensity = 0.82;
let lastRenderTime = 0;
let isPageVisible = true;
let resizeTimer = 0;
let activeQualityName = "balanced";
let activeQuality = null;
let activeVariantName = "peak";
let usingSmallGeometry = false;
let staticBackgroundOnly = false;
let engineReady = false;
let themeSignature = "";

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const reducedMotion = reducedMotionQuery.matches;

function readDashboardVisuals() {
  if (typeof window.getDashboardVisuals === "function") {
    return window.getDashboardVisuals() || {};
  }
  return {};
}

function readPortalVariant() {
  if (typeof window.getBackgroundMode === "function") {
    return window.getBackgroundMode();
  }
  const stored = localStorage.getItem("kiuLuxuryBackgroundMode") || "orbit";
  return String(stored).trim().toLowerCase();
}

function readPortalMotion() {
  const visuals = readDashboardVisuals();
  const raw = visuals.particleMotion ?? localStorage.getItem("kiuLuxuryParticleMotion") ?? DEFAULT_PARTICLE_MOTION;
  const value = Number(raw);
  if (Number.isNaN(value)) return DEFAULT_PARTICLE_MOTION;
  return Math.min(120, Math.max(0, value));
}

function readPortalDensityPercent() {
  const visuals = readDashboardVisuals();
  const raw = visuals.particleDensity ?? localStorage.getItem("kiuLuxuryParticleDensity") ?? DEFAULT_PARTICLE_DENSITY;
  const value = Number(raw);
  if (Number.isNaN(value)) return DEFAULT_PARTICLE_DENSITY;
  return Math.min(100, Math.max(35, value));
}

function mapPortalDensityToShader(percent) {
  const normalized = Math.min(100, Math.max(35, Number(percent) || DEFAULT_PARTICLE_DENSITY));
  const t = (normalized - 35) / 65;
  return 0.55 + t * 0.45;
}

function readPortalDensity() {
  return mapPortalDensityToShader(readPortalDensityPercent());
}

function readPortalQualityKey() {
  const visuals = readDashboardVisuals();
  const raw = String(
    visuals.particleQuality ?? localStorage.getItem("kiuLuxuryParticleQuality") ?? DEFAULT_PARTICLE_QUALITY
  ).trim().toLowerCase();
  return PARTICLE_QUALITY_KEYS.includes(raw) ? raw : DEFAULT_PARTICLE_QUALITY;
}

function arePortalBackgroundAnimationsEnabled() {
  if (typeof window.areBackgroundAnimationsEnabled === "function") {
    return window.areBackgroundAnimationsEnabled();
  }
  const stored = String(localStorage.getItem("kiuLuxuryBackgroundAnimationsEnabled") || "").trim().toLowerCase();
  if (stored) return !(stored === "0" || stored === "false" || stored === "off");
  return true;
}

function getPerformanceTier() {
  if (typeof window.getLuxuryBackgroundRenderProfile === "function") {
    return window.getLuxuryBackgroundRenderProfile(reducedMotion).tier;
  }
  return reducedMotion ? "efficient" : "standard";
}

function mapPerformanceTierToQuality(tier) {
  if (tier === "efficient") return "balanced";
  if (tier === "high") return "high";
  return "balanced";
}

function parseCssColor(value, fallback = "#ffffff") {
  const normalized = String(value || "").trim();
  if (!normalized) return new THREE.Color(fallback);
  try {
    return new THREE.Color(normalized);
  } catch (error) {
    return new THREE.Color(fallback);
  }
}

function mixColors(colorA, colorB, amount) {
  return colorA.clone().lerp(colorB, amount);
}

function rgbTripletToColor(triplet, fallback = "#d4a574") {
  const parts = String(triplet || "")
    .trim()
    .split(",")
    .map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return new THREE.Color(fallback);
  }
  return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
}

function relativeLuminance(color) {
  const channels = [color.r, color.g, color.b].map((channel) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return linear;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureContrastAgainstBackground(color, background, textAnchor, minRatio = 2) {
  const result = color.clone();
  let ratio = contrastRatio(result, background);
  if (ratio >= minRatio) return result;

  const anchor = textAnchor.clone();
  for (let step = 0; step < 12 && ratio < minRatio; step += 1) {
    result.lerp(anchor, 0.14);
    ratio = contrastRatio(result, background);
  }
  return result;
}

function applyParticleAlphaBoost() {
  if (!uniforms || !activeQuality) return;
  const lightMode = document.body.classList.contains("lux-light-mode");
  const variant = variants[activeVariantName] || variants.peak;
  const baseAlphaBoost = activeQuality.alphaBoost * variant.alphaBoost;
  uniforms.uAlphaBoost.value = lightMode ? Math.min(baseAlphaBoost * 1.65, 6.5) : baseAlphaBoost;
  if (uniforms.uAlphaFloor) {
    uniforms.uAlphaFloor.value = lightMode ? 0.06 : 0;
  }
}

function applyLmsParticleTheme() {
  if (!uniforms || !renderer) return;
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const accent = parseCssColor(styles.getPropertyValue("--lux-accent"), "#d4a574");
  const accent2 = parseCssColor(styles.getPropertyValue("--lux-accent-2"), "#8b6914");
  const bg = parseCssColor(styles.getPropertyValue("--lux-bg"), "#0b192c");
  const textAnchor = parseCssColor(styles.getPropertyValue("--lux-text"), "#2a2218");
  const lineRgb = styles.getPropertyValue("--lux-bg-line-rgb").trim();
  const particleRgb = styles.getPropertyValue("--lux-bg-particle-rgb").trim();
  const hazeRgb = styles.getPropertyValue("--lux-bg-haze-rgb").trim();
  const lightMode = document.body.classList.contains("lux-light-mode");
  let pointA;
  let pointB;
  let haze;

  if (lightMode) {
    pointA = rgbTripletToColor(lineRgb, accent.getStyle()).clone();
    pointB = rgbTripletToColor(particleRgb, accent2.getStyle()).clone();
    if (!lineRgb) {
      pointA = accent.clone().lerp(textAnchor, 0.55);
    }
    if (!particleRgb) {
      pointB = accent2.clone().lerp(textAnchor, 0.58);
    }
    pointA = ensureContrastAgainstBackground(pointA, bg, textAnchor, 2);
    pointB = ensureContrastAgainstBackground(pointB, bg, textAnchor, 1.85);
    haze = rgbTripletToColor(hazeRgb, accent.getStyle());
    haze = mixColors(bg, haze, 0.55);
  } else {
    pointA = accent.clone().lerp(new THREE.Color("#ffffff"), 0.58);
    pointB = mixColors(accent2, accent, 0.38).lerp(new THREE.Color("#ffffff"), 0.18);
    haze = mixColors(bg, accent, 0.24);
  }

  renderer.setClearColor(bg, 1);
  uniforms.uColorA.value.copy(pointA);
  uniforms.uColorB.value.copy(pointB);
  uniforms.uHaze.value.copy(haze);

  if (material) {
    material.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
  }
  if (ribbonMaterial) {
    ribbonMaterial.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
    ribbonMaterial.needsUpdate = true;
  }

  applyParticleAlphaBoost();

  themeSignature = [
    accent.getHexString(),
    accent2.getHexString(),
    bg.getHexString(),
    lineRgb,
    particleRgb,
    hazeRgb,
    lightMode ? "light" : "dark",
  ].join("|");
}

function applyParticleSettingsNow() {
  if (!uniforms) return;
  const animationsEnabled = arePortalBackgroundAnimationsEnabled();
  targetMotion = animationsEnabled ? readPortalMotion() / 100 : 0;
  targetDensity = readPortalDensity();
  uniforms.uMotion.value = targetMotion;
  uniforms.uDensityFade.value = targetDensity;
}

function syncSettingsFromPortal() {
  const animationsEnabled = arePortalBackgroundAnimationsEnabled();
  staticBackgroundOnly = !animationsEnabled;
  if (!animationsEnabled) {
    if (engineReady || renderer) {
      disposeLuxuryParticleBackground();
    }
    return;
  }
  if (!engineReady) return;
  targetMotion = readPortalMotion() / 100;
  targetDensity = readPortalDensity();
  const nextVariant = normalizeVariantKey(readPortalVariant());
  const nextQuality = resolveQuality(readPortalQualityKey());
  if (nextVariant !== activeVariantName) {
    setVariant(nextVariant);
  }
  if (nextQuality.name !== activeQualityName) {
    setQuality(nextQuality, true);
  }
  applyLmsParticleTheme();
  applyParticleSettingsNow();
  if (renderer && isPageVisible) {
    renderer.setAnimationLoop(render);
  }
}
const variants = {
  peak: {
    pointScale: 1,
    alphaBoost: 1,
    rotationSwing: 0.035,
  },
  layered: {
    pointScale: 1,
    alphaBoost: 1.4,
    rotationSwing: 0.01,
  },
  orbit: {
    pointScale: 1.34,
    alphaBoost: 3.45,
    rotationSwing: 0.018,
  },
  corners: {
    pointScale: 1.3,
    alphaBoost: 3.75,
    rotationSwing: 0.014,
  },
};

const qualityProfiles = {
  low: {
    columns: 138,
    rows: 68,
    layers: 2,
    mobileColumns: 104,
    mobileRows: 54,
    mobileLayers: 2,
    tinyColumns: 72,
    tinyRows: 38,
    tinyLayers: 1,
    maxDpr: 1,
    fps: 30,
    tinyFps: 30,
    pointScale: 1.2,
    alphaBoost: 1.38,
  },
  balanced: {
    columns: 188,
    rows: 88,
    layers: 2,
    mobileColumns: 132,
    mobileRows: 64,
    mobileLayers: 2,
    tinyColumns: 88,
    tinyRows: 44,
    tinyLayers: 1,
    maxDpr: 2,
    supersample: 1.15,
    fps: 30,
    tinyFps: 30,
    pointScale: 1.1,
    alphaBoost: 1.16,
  },
  high: {
    // Denser, richer, higher-fidelity field.
    columns: 372,
    rows: 176,
    layers: 4,
    mobileColumns: 158,
    mobileRows: 76,
    mobileLayers: 2,
    tinyColumns: 104,
    tinyRows: 52,
    tinyLayers: 1,
    // Max quality: supersample 1.85x ABOVE native (getRenderPixelRatio), capped
    // at total ratio 3.7. On a DPR-2 display this renders a ~3.7x buffer and
    // downsamples — the cleanest possible edges, zero crawl/shimmer.
    maxDpr: 3.7,
    supersample: 1.85,
    fps: 30,
    tinyFps: 30,
    pointScale: 1,
    alphaBoost: 1,
  },
};

function buildLuxuryParticleEngine() {
  const initialVariantName = readPortalVariant();
  const initialQuality = resolveQuality(readPortalQualityKey());
  canvas = document.getElementById("lux-bg-canvas");
  if (!canvas) return false;

  renderer = new THREE.WebGLRenderer({
    canvas,
    // Antialiasing ON: the GPU-saving `false` left particle edges jagged, so
    // they crawled/shimmered as they moved — the "low quality flickering"
    // seen through the glass. MSAA smooths the edges so motion is clean.
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(getRenderPixelRatio(initialQuality));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
  camera.position.set(0, 9.5, 28);
  camera.rotation.x = -0.34;

  uniforms = {
  uTime: { value: 0 },
  uMotion: { value: readPortalMotion() / 100 },
  uDensityFade: { value: 0.82 },
  uPixelRatio: { value: renderer.getPixelRatio() },
  uPointScale: { value: initialQuality.pointScale },
  uAlphaBoost: { value: initialQuality.alphaBoost },
  uAlphaFloor: { value: 0 },
  uColorA: { value: new THREE.Color("#ffffff") },
  uColorB: { value: new THREE.Color("#7c8585") },
  uHaze: { value: new THREE.Color("#343838") },
};

  material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed;
    attribute float aLayer;
    attribute float aPhaseA;
    attribute float aPhaseB;
    attribute float aPhaseC;
    attribute float aAlphaBias;
    attribute float aSizeBias;
    attribute float aMotionScale;
    attribute float aDriftScale;
    varying float vAlpha;
    varying float vMix;
    varying float vMist;

    uniform float uTime;
    uniform float uMotion;
    uniform float uDensityFade;
    uniform float uPixelRatio;
    uniform float uPointScale;
    uniform float uAlphaBoost;

    void main() {
      vec3 p = position;
      float t = uTime * uMotion;

      float waveA = sin(aPhaseA + t * 1.35) * 0.95;
      float waveB = sin(aPhaseB - t * 1.08) * 0.62;
      float waveC = cos(aPhaseC - t * 1.55) * 0.44;

      p.y += (waveA + waveB + waveC) * aMotionScale;
      p.x += sin(t * 0.34 + p.z * 0.18 + aSeed) * 0.18 * aDriftScale;
      p.z += cos(t * 0.28 + p.x * 0.12 + aSeed) * 0.12 * aDriftScale;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      float depthFade = smoothstep(-48.0, -8.0, mvPosition.z);
      float horizonFade = smoothstep(-4.0, 4.4, p.y);
      float layerFade = mix(1.0, 0.38, aLayer);
      float sparseMask = smoothstep(0.0, 1.0, uDensityFade + sin(aSeed * 18.73) * 0.28);

      vAlpha = (0.14 + horizonFade * 0.82) * depthFade * layerFade * sparseMask * uAlphaBoost * aAlphaBias;
      vMix = clamp((p.y + 2.5) / 9.5, 0.0, 1.0);
      vMist = smoothstep(0.45, 1.0, aLayer) * depthFade;

      gl_PointSize = (1.15 + horizonFade * 1.85 + (1.0 - aLayer) * 0.75) * uPixelRatio;
      gl_PointSize *= clamp(28.0 / -mvPosition.z, 0.42, 2.4) * uPointScale * aSizeBias;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uHaze;
    uniform float uAlphaFloor;

    varying float vAlpha;
    varying float vMix;
    varying float vMist;

    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      // Fully soft radial falloff (no hard center core). A hard-cored dot
      // strobes as it moves sub-pixel; a smooth soft dot is anti-aliased, so
      // motion reads as clean glass instead of flickering pixels — without
      // adding any backdrop blur (transparency preserved).
      float dotShape = smoothstep(0.25, 0.0, dot(uv, uv));
      vec3 color = mix(uColorB, uColorA, vMix);
      color = mix(color, uHaze, vMist * 0.62);
      gl_FragColor = vec4(color, max(vAlpha * dotShape, uAlphaFloor * dotShape));
    }
  `,
  });

  ribbonMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: uniforms.uTime,
    uMotion: uniforms.uMotion,
    uColorA: uniforms.uColorA,
    uHaze: uniforms.uHaze,
  },
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aPhase;
    attribute float aAlpha;
    attribute float aMotionScale;
    varying float vAlpha;
    varying float vEdge;
    varying float vMix;

    uniform float uTime;
    uniform float uMotion;

    void main() {
      vec3 p = position;
      float t = uTime * uMotion;
      p.y += sin(aPhase + t * 0.9) * 0.18 * aMotionScale;
      p.x += sin(t * 0.22 + p.z * 0.12 + aPhase) * 0.08 * aMotionScale;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      vAlpha = aAlpha * smoothstep(-48.0, -8.0, mvPosition.z);
      vEdge = 1.0 - abs(uv.y - 0.5) * 2.0;
      vMix = clamp((p.y + 2.0) / 5.5, 0.0, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform vec3 uColorA;
    uniform vec3 uHaze;

    varying float vAlpha;
    varying float vEdge;
    varying float vMix;

    void main() {
      float soft = smoothstep(0.0, 0.92, vEdge);
      soft *= soft;
      vec3 color = mix(uHaze, uColorA, vMix * 0.68 + 0.18);
      gl_FragColor = vec4(color, vAlpha * soft);
    }
  `,
  });

  activeQualityName = initialQuality.name;
  activeQuality = initialQuality;
  activeVariantName = initialVariantName;
  usingSmallGeometry = window.innerWidth < 720;
  const isTiny = window.innerWidth < 480;
  targetMotion = readPortalMotion() / 100;
  targetDensity = readPortalDensity();
  uniforms.uMotion.value = targetMotion;
  uniforms.uDensityFade.value = targetDensity;

  points = new THREE.Points(createWaveGeometry(activeQuality, activeVariantName), material);
  points.rotation.x = -0.18;
  points.position.y = -3.2;
  scene.add(points);

  cornerPoints = new THREE.Points(createCornerAccentGeometry(activeQuality, activeVariantName), material);
  cornerPoints.renderOrder = 1;
  scene.add(cornerPoints);

  ribbonMesh = new THREE.Mesh(createLayeredRibbonGeometry(activeQuality), ribbonMaterial);
  ribbonMesh.visible = activeVariantName === "layered";
  ribbonMesh.renderOrder = -1;
  scene.add(ribbonMesh);

  clock = new THREE.Clock();
  lastRenderTime = 0;
  isPageVisible = !document.hidden;

  applyVariantTuning();
  applyLmsParticleTheme();
  resize();
  syncSettingsFromPortal();
  return true;
}

let portalListenersBound = false;

function bindPortalListeners() {
  if (portalListenersBound) return;
  portalListenersBound = true;
  window.addEventListener("resize", scheduleResize);
  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    if (!renderer) return;
    if (!isPageVisible || staticBackgroundOnly || !arePortalBackgroundAnimationsEnabled()) {
      renderer.setAnimationLoop(null);
      return;
    }
    renderer.setAnimationLoop(render);
  });
  reducedMotionQuery.addEventListener("change", () => syncSettingsFromPortal());
}

function normalizeVariantKey(mode) {
  const normalized = String(mode || "").trim().toLowerCase();
  if (normalized === "tunnel") return "orbit";
  if (normalized === "grid") return "corners";
  if (normalized === "constellation") return "peak";
  if (normalized === "aurora") return "orbit";
  if (normalized === "mesh") return "corners";
  return Object.hasOwn(variants, normalized) ? normalized : "peak";
}

function refreshLuxuryParticleBackground(modeOrOpts) {
  if (!arePortalBackgroundAnimationsEnabled()) {
    disposeLuxuryParticleBackground();
    return;
  }
  if (!engineReady && !initLuxuryParticleBackground()) return;
  if (typeof modeOrOpts === "string" && modeOrOpts.trim()) {
    const validMode = normalizeVariantKey(modeOrOpts);
    document.body.dataset.luxBackgroundMode = validMode;
    setVariant(validMode);
  }
  syncSettingsFromPortal();
  applyParticleSettingsNow();
  if (renderer && isPageVisible && arePortalBackgroundAnimationsEnabled()) {
    renderCurrentFrame(window.performance?.now?.() || Date.now());
  }
}

function disposeLuxuryParticleBackground() {
  try {
    if (renderer) renderer.setAnimationLoop(null);
  } catch (_error) { /* ignore */ }

  try {
    if (scene) {
      while (scene.children.length) {
        scene.remove(scene.children[0]);
      }
    }
  } catch (_error) { /* ignore */ }

  try { points?.geometry?.dispose(); } catch (_error) { /* ignore */ }
  try { cornerPoints?.geometry?.dispose(); } catch (_error) { /* ignore */ }
  try { ribbonMesh?.geometry?.dispose(); } catch (_error) { /* ignore */ }
  try { material?.dispose(); } catch (_error) { /* ignore */ }
  try { ribbonMaterial?.dispose(); } catch (_error) { /* ignore */ }

  try {
    const gl = renderer?.getContext?.();
    const lose = gl?.getExtension?.("WEBGL_lose_context");
    lose?.loseContext?.();
  } catch (_error) { /* ignore */ }

  try { renderer?.dispose(); } catch (_error) { /* ignore */ }

  if (canvas) {
    try { canvas.style.display = "none"; } catch (_error) { /* ignore */ }
  }

  renderer = null;
  scene = null;
  camera = null;
  uniforms = null;
  material = null;
  ribbonMaterial = null;
  points = null;
  cornerPoints = null;
  ribbonMesh = null;
  clock = null;
  themeSignature = "";
  lastRenderTime = 0;
  staticBackgroundOnly = true;
  engineReady = false;
  window.__kiuLuxuryParticleBackgroundReady = false;
}

function initLuxuryParticleBackground() {
  if (!arePortalBackgroundAnimationsEnabled()) {
    disposeLuxuryParticleBackground();
    return false;
  }
  if (engineReady) {
    syncSettingsFromPortal();
    return true;
  }
  if (!buildLuxuryParticleEngine()) return false;
  if (canvas) canvas.style.display = "";
  bindPortalListeners();
  engineReady = true;
  staticBackgroundOnly = false;
  window.__kiuLuxuryParticleBackgroundReady = true;
  return true;
}

/** Lightweight WebGL probe for orchestrator / fog (no Three init). */
function probeWebGlAvailable() {
  try {
    if (window.__kiuWebGlUnavailable === true) return false;
    if (window.__kiuLuxuryParticleBackgroundUnavailable === true) return false;
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    const lose = gl.getExtension?.("WEBGL_lose_context");
    lose?.loseContext?.();
    return true;
  } catch (_error) {
    return false;
  }
}

function createWaveGeometry(quality, variantName) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const variant = Object.hasOwn(variants, variantName) ? variantName : "peak";

  if (variant === "layered") {
    return createLayeredWaveGeometry(quality);
  }

  if (variant === "orbit") {
    return createOrbitFieldGeometry(quality);
  }

  if (variant === "corners") {
    return createCornerFocusGeometry(quality);
  }

  const columns = isTiny ? (quality.tinyColumns || Math.round(quality.mobileColumns * 0.7)) : isSmall ? quality.mobileColumns : quality.columns;
  const rows = isTiny ? (quality.tinyRows || Math.round(quality.mobileRows * 0.7)) : isSmall ? quality.mobileRows : quality.rows;
  const layers = isTiny ? (quality.tinyLayers || 1) : isSmall ? quality.mobileLayers : quality.layers;
  const count = columns * rows * layers;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const layerValues = new Float32Array(count);
  const phaseAValues = new Float32Array(count);
  const phaseBValues = new Float32Array(count);
  const phaseCValues = new Float32Array(count);
  const alphaBiasValues = new Float32Array(count);
  const sizeBiasValues = new Float32Array(count);
  const motionScaleValues = new Float32Array(count);
  const driftScaleValues = new Float32Array(count);

  let i = 0;
  for (let layer = 0; layer < layers; layer += 1) {
    for (let zIndex = 0; zIndex < rows; zIndex += 1) {
      for (let xIndex = 0; xIndex < columns; xIndex += 1) {
        const xNorm = xIndex / (columns - 1);
        const zNorm = zIndex / (rows - 1);
        const layerDepth = layer / Math.max(layers - 1, 1);
        const jitter = hash(xIndex * 17.17 + zIndex * 3.31 + layer * 9.7);
        const x = THREE.MathUtils.lerp(-30, 30, xNorm) + (jitter - 0.5) * 0.075;
        const z = THREE.MathUtils.lerp(-11, 27, zNorm) + layerDepth * 8.5;
        const terrain = getTerrainSample(variant, x, z, layerDepth, jitter);
        const phases = getWavePhases(variant, x, z, layerDepth, jitter);
        const terrainY = terrain.height - layerDepth * terrain.layerDrop;

        positions[i * 3] = x;
        positions[i * 3 + 1] = terrainY;
        positions[i * 3 + 2] = z;
        seeds[i] = jitter;
        layerValues[i] = layerDepth;
        phaseAValues[i] = phases.a;
        phaseBValues[i] = phases.b;
        phaseCValues[i] = phases.c;
        alphaBiasValues[i] = terrain.alphaBias;
        sizeBiasValues[i] = terrain.sizeBias;
        motionScaleValues[i] = 1;
        driftScaleValues[i] = 1;
        i += 1;
      }
    }
  }

  const waveGeometry = new THREE.BufferGeometry();
  waveGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  waveGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  waveGeometry.setAttribute("aLayer", new THREE.BufferAttribute(layerValues, 1));
  waveGeometry.setAttribute("aPhaseA", new THREE.BufferAttribute(phaseAValues, 1));
  waveGeometry.setAttribute("aPhaseB", new THREE.BufferAttribute(phaseBValues, 1));
  waveGeometry.setAttribute("aPhaseC", new THREE.BufferAttribute(phaseCValues, 1));
  waveGeometry.setAttribute("aAlphaBias", new THREE.BufferAttribute(alphaBiasValues, 1));
  waveGeometry.setAttribute("aSizeBias", new THREE.BufferAttribute(sizeBiasValues, 1));
  waveGeometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScaleValues, 1));
  waveGeometry.setAttribute("aDriftScale", new THREE.BufferAttribute(driftScaleValues, 1));
  waveGeometry.computeBoundingSphere();
  return waveGeometry;
}

function createLayeredWaveGeometry(quality) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const baseColumns = isTiny ? (quality.tinyColumns || Math.round(quality.mobileColumns * 0.7)) : isSmall ? quality.mobileColumns : quality.columns;
  const columnScale = isTiny ? 0.9 : isSmall ? 1.18 : 1.62;
  const columns = Math.round(baseColumns * columnScale);
  const rowScale = quality.layers >= 3 ? 1 : 0.78;
  const bandSpecs = [
    { rows: 10, z: 21.5, y: 2.75, spread: 3.4, amp: 2.25, freq: 0.19, phase: 0.4, alpha: 0.42, size: 0.82, motion: 0.18, layer: 0.9 },
    { rows: 13, z: 16.4, y: 2.02, spread: 4.0, amp: 2.35, freq: 0.24, phase: 2.1, alpha: 0.58, size: 0.86, motion: 0.22, layer: 0.82 },
    { rows: 5, z: 14.2, y: 2.16, spread: 0.8, amp: 2.05, freq: 0.22, phase: 3.3, alpha: 3.2, size: 0.6, motion: 0.24, layer: 0.76 },
    { rows: 15, z: 10.2, y: 1.18, spread: 3.7, amp: 1.8, freq: 0.28, phase: 3.6, alpha: 0.82, size: 0.82, motion: 0.28, layer: 0.68 },
    { rows: 6, z: 7.8, y: 1.2, spread: 0.9, amp: 1.74, freq: 0.27, phase: 5.1, alpha: 4.2, size: 0.58, motion: 0.32, layer: 0.52 },
    { rows: 26, z: 3.4, y: 0.2, spread: 3.3, amp: 1.52, freq: 0.31, phase: 1.2, alpha: 1.7, size: 0.62, motion: 0.35, layer: 0.34 },
    { rows: 7, z: 2.4, y: 0.42, spread: 0.72, amp: 1.92, freq: 0.24, phase: 0.5, alpha: 6.2, size: 0.6, motion: 0.36, layer: 0.3 },
    { rows: 21, z: -0.6, y: -0.58, spread: 3.0, amp: 1.34, freq: 0.34, phase: 4.3, alpha: 1.55, size: 0.66, motion: 0.38, layer: 0.24 },
    { rows: 5, z: -1.7, y: -0.38, spread: 0.8, amp: 1.52, freq: 0.29, phase: 4.95, alpha: 4.8, size: 0.58, motion: 0.36, layer: 0.2 },
    { rows: 14, z: -6.4, y: -1.58, spread: 3.9, amp: 1.32, freq: 0.25, phase: 5.4, alpha: 0.48, size: 1.18, motion: 0.2, layer: 0.12 },
    { rows: 4, z: -6.8, y: -1.42, spread: 0.78, amp: 1.2, freq: 0.2, phase: 2.6, alpha: 2.0, size: 0.9, motion: 0.2, layer: 0.12 },
    { rows: 9, z: -10.2, y: -2.4, spread: 3.7, amp: 1.12, freq: 0.22, phase: 2.8, alpha: 0.24, size: 1.32, motion: 0.14, layer: 0.06 },
  ];
  const rows = bandSpecs.reduce((total, band) => total + Math.max(3, Math.round(band.rows * rowScale)), 0);
  const count = rows * columns;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const layerValues = new Float32Array(count);
  const phaseAValues = new Float32Array(count);
  const phaseBValues = new Float32Array(count);
  const phaseCValues = new Float32Array(count);
  const alphaBiasValues = new Float32Array(count);
  const sizeBiasValues = new Float32Array(count);
  const motionScaleValues = new Float32Array(count);
  const driftScaleValues = new Float32Array(count);

  let i = 0;
  for (const band of bandSpecs) {
    const bandRows = Math.max(3, Math.round(band.rows * rowScale));

    for (let row = 0; row < bandRows; row += 1) {
      const rowNorm = bandRows === 1 ? 0.5 : row / (bandRows - 1);
      const centeredRow = rowNorm - 0.5;
      const rowFocus = Math.exp(-(centeredRow * centeredRow) * 10);

      for (let col = 0; col < columns; col += 1) {
        const xNorm = col / (columns - 1);
        const seed = hash(col * 13.91 + row * 7.33 + band.z * 2.17 + band.phase);
        const x = THREE.MathUtils.lerp(-38, 38, xNorm) + (seed - 0.5) * 0.13;
        const rowWave = Math.sin(x * band.freq + band.phase + centeredRow * 1.7);
        const crossWave = Math.sin(x * (band.freq * 0.48) - band.phase + centeredRow * 2.4);
        const z = band.z + centeredRow * band.spread + crossWave * 0.55 + (seed - 0.5) * 0.28;
        const y = band.y + rowWave * band.amp + crossWave * band.amp * 0.32 + centeredRow * 0.42;
        const centerRidge = Math.exp(-Math.pow((band.z - 1.4) / 5.8, 2)) * rowFocus;
        const horizonMist = Math.exp(-Math.pow((band.z - 17) / 8, 2)) * 0.45;
        const foregroundMist = Math.exp(-Math.pow((band.z + 8) / 4.8, 2)) * 0.38;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        seeds[i] = seed;
        layerValues[i] = band.layer;
        phaseAValues[i] = x * 0.22 + z * 0.24 + band.phase + centeredRow * 1.8;
        phaseBValues[i] = x * 0.13 - z * 0.42 + seed * 4.2 + band.phase;
        phaseCValues[i] = x * 0.16 + Math.abs(z) * 0.36 + centeredRow * 2.2;
        alphaBiasValues[i] = band.alpha * (0.68 + rowFocus * 0.72 + centerRidge * 0.72 + horizonMist + foregroundMist + seed * 0.08);
        sizeBiasValues[i] = band.size * (0.86 + foregroundMist * 0.55 + horizonMist * 0.22 + seed * 0.12);
        motionScaleValues[i] = band.motion * (0.8 + rowFocus * 0.28);
        driftScaleValues[i] = 0.42 + band.layer * 0.22;
        i += 1;
      }
    }
  }

  const waveGeometry = new THREE.BufferGeometry();
  waveGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  waveGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  waveGeometry.setAttribute("aLayer", new THREE.BufferAttribute(layerValues, 1));
  waveGeometry.setAttribute("aPhaseA", new THREE.BufferAttribute(phaseAValues, 1));
  waveGeometry.setAttribute("aPhaseB", new THREE.BufferAttribute(phaseBValues, 1));
  waveGeometry.setAttribute("aPhaseC", new THREE.BufferAttribute(phaseCValues, 1));
  waveGeometry.setAttribute("aAlphaBias", new THREE.BufferAttribute(alphaBiasValues, 1));
  waveGeometry.setAttribute("aSizeBias", new THREE.BufferAttribute(sizeBiasValues, 1));
  waveGeometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScaleValues, 1));
  waveGeometry.setAttribute("aDriftScale", new THREE.BufferAttribute(driftScaleValues, 1));
  waveGeometry.computeBoundingSphere();
  return waveGeometry;
}

function createLayeredRibbonGeometry(quality) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const tinyBase = quality.tinyColumns || Math.round(quality.mobileColumns * 0.7);
  const segments = isTiny ? Math.round(tinyBase * 0.9) : isSmall ? Math.round(quality.mobileColumns * 1.1) : Math.round(quality.columns * 1.35);
  const crossSegments = 5;
  const bands = [
    { z: 22, y: 2.65, thickness: 0.92, depth: 1.4, amp: 1.55, freq: 0.18, phase: 0.25, alpha: 0.055, motion: 0.42 },
    { z: 16.2, y: 2.05, thickness: 0.72, depth: 1.2, amp: 1.75, freq: 0.24, phase: 2.2, alpha: 0.07, motion: 0.48 },
    { z: 8.4, y: 1.02, thickness: 0.5, depth: 0.9, amp: 1.35, freq: 0.28, phase: 4.7, alpha: 0.055, motion: 0.55 },
    { z: 2.4, y: 0.16, thickness: 0.38, depth: 0.72, amp: 1.58, freq: 0.24, phase: 0.6, alpha: 0.07, motion: 0.62 },
    { z: -5.8, y: -1.48, thickness: 0.95, depth: 1.55, amp: 1.0, freq: 0.21, phase: 3.2, alpha: 0.042, motion: 0.36 },
  ];
  const verticesPerBand = (segments + 1) * (crossSegments + 1);
  const indexCountPerBand = segments * crossSegments * 6;
  const positions = new Float32Array(verticesPerBand * bands.length * 3);
  const uvs = new Float32Array(verticesPerBand * bands.length * 2);
  const phases = new Float32Array(verticesPerBand * bands.length);
  const alphas = new Float32Array(verticesPerBand * bands.length);
  const motionScales = new Float32Array(verticesPerBand * bands.length);
  const indices = new Uint16Array(indexCountPerBand * bands.length);

  let vertex = 0;
  let index = 0;

  for (const band of bands) {
    const bandStart = vertex;

    for (let row = 0; row <= crossSegments; row += 1) {
      const v = row / crossSegments;
      const cross = v - 0.5;
      const edgeFade = 1 - Math.abs(cross) * 2;

      for (let col = 0; col <= segments; col += 1) {
        const u = col / segments;
        const x = THREE.MathUtils.lerp(-40, 40, u);
        const wave = Math.sin(x * band.freq + band.phase);
        const secondary = Math.sin(x * band.freq * 0.43 - band.phase * 1.7);
        const y = band.y + wave * band.amp + secondary * band.amp * 0.26 + cross * band.thickness;
        const z = band.z + cross * band.depth + secondary * 0.28;

        positions[vertex * 3] = x;
        positions[vertex * 3 + 1] = y;
        positions[vertex * 3 + 2] = z;
        uvs[vertex * 2] = u;
        uvs[vertex * 2 + 1] = v;
        phases[vertex] = x * band.freq + band.phase + cross * 1.2;
        alphas[vertex] = band.alpha * (0.45 + edgeFade * 0.7);
        motionScales[vertex] = band.motion;
        vertex += 1;
      }
    }

    for (let row = 0; row < crossSegments; row += 1) {
      for (let col = 0; col < segments; col += 1) {
        const a = bandStart + row * (segments + 1) + col;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;

        indices[index] = a;
        indices[index + 1] = c;
        indices[index + 2] = b;
        indices[index + 3] = b;
        indices[index + 4] = c;
        indices[index + 5] = d;
        index += 6;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScales, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createOrbitFieldGeometry(quality) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const baseCol = isTiny ? (quality.tinyColumns || Math.round(quality.mobileColumns * 0.7)) : isSmall ? quality.mobileColumns : quality.columns;
  const baseRow = isTiny ? (quality.tinyRows || Math.round(quality.mobileRows * 0.7)) : isSmall ? quality.mobileRows : quality.rows;
  const columns = Math.round(baseCol * (isTiny ? 0.95 : isSmall ? 1.05 : 1.24));
  const rows = Math.round(baseRow * (isTiny ? 1.1 : isSmall ? 1.28 : 1.1));
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const layerValues = new Float32Array(count);
  const phaseAValues = new Float32Array(count);
  const phaseBValues = new Float32Array(count);
  const phaseCValues = new Float32Array(count);
  const alphaBiasValues = new Float32Array(count);
  const sizeBiasValues = new Float32Array(count);
  const motionScaleValues = new Float32Array(count);
  const driftScaleValues = new Float32Array(count);

  let i = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const u = col / (columns - 1);
      const v = row / (rows - 1);
      const seed = hash(col * 11.17 + row * 5.73);
      const xBase = THREE.MathUtils.lerp(-35, 35, u);
      const yBase = THREE.MathUtils.lerp(-13.5, 13.5, v);
      const angle = Math.atan2(yBase * 1.2, xBase);
      const radius = Math.hypot(xBase * 0.86, yBase * 1.22);
      const swirl = Math.sin(angle * 4.0 + radius * 0.33);
      const counter = Math.cos(angle * 2.0 - radius * 0.21);
      const armA = Math.exp(-Math.pow(Math.sin(angle * 2.0 + radius * 0.12), 2) * 7.0);
      const armB = Math.exp(-Math.pow(Math.sin(angle * 3.0 - radius * 0.08 + 1.8), 2) * 11.0);
      const ring = Math.exp(-Math.pow((radius - 18.0) / 4.6, 2));
      const corner = smoothMax(Math.abs(xBase) / 35, Math.abs(yBase) / 13.5);
      const lowerFieldBoost = 0.86 + (1 - v) * 2.08;
      const upperFieldTrim = 1 - Math.max(0, v - 0.72) * 0.95;
      const lowerMask = 1 - smoothstep(0.42, 0.78, v);
      const lowerStream =
        Math.exp(-Math.pow(Math.sin(xBase * 0.16 + yBase * 0.26 + radius * 0.035), 2) * 9.5) *
        lowerMask;
      const centerPresence = 0.72 + (1 - Math.exp(-Math.pow(radius / 7.8, 2))) * 0.28;
      const x = xBase + swirl * 1.1 + (seed - 0.5) * 0.18;
      const y = yBase + counter * 0.85 + Math.sin(xBase * 0.18 + angle) * 0.7;
      const z = THREE.MathUtils.lerp(10, -12, v) + Math.sin(radius * 0.26 + angle * 2.0) * 2.2 + (seed - 0.5) * 0.6;
      const armFocus = Math.max(armA, armB * 0.86);
      const fieldNoise = 0.35 + hash(seed * 91.7 + radius) * 0.65;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = seed;
      layerValues[i] = THREE.MathUtils.clamp((radius / 30) * 0.72 + (1 - v) * 0.22, 0, 1);
      phaseAValues[i] = angle * 3.2 + radius * 0.2 + seed * 2.0;
      phaseBValues[i] = x * 0.16 - y * 0.2 + radius * 0.12 + seed * 3.0;
      phaseCValues[i] = radius * 0.36 - angle * 2.4;
      alphaBiasValues[i] =
        (0.92 + armFocus * 1.68 + ring * 0.88 + corner * 0.56 + lowerStream * 1.05) *
        centerPresence *
        fieldNoise *
        lowerFieldBoost *
        upperFieldTrim;
      sizeBiasValues[i] = 0.84 + armFocus * 0.44 + ring * 0.34 + corner * 0.32 + lowerStream * 0.24 + (1 - v) * 0.24;
      motionScaleValues[i] = 0.18 + armFocus * 0.24 + ring * 0.1;
      driftScaleValues[i] = 0.48 + ring * 0.28 + corner * 0.12;
      i += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layerValues, 1));
  geometry.setAttribute("aPhaseA", new THREE.BufferAttribute(phaseAValues, 1));
  geometry.setAttribute("aPhaseB", new THREE.BufferAttribute(phaseBValues, 1));
  geometry.setAttribute("aPhaseC", new THREE.BufferAttribute(phaseCValues, 1));
  geometry.setAttribute("aAlphaBias", new THREE.BufferAttribute(alphaBiasValues, 1));
  geometry.setAttribute("aSizeBias", new THREE.BufferAttribute(sizeBiasValues, 1));
  geometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScaleValues, 1));
  geometry.setAttribute("aDriftScale", new THREE.BufferAttribute(driftScaleValues, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCornerAccentGeometry(quality, variantName) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const tinyBase = quality.tinyColumns || Math.round(quality.mobileColumns * 0.7);
  const baseCount = isTiny ? tinyBase * 6 : isSmall ? quality.mobileColumns * 10 : quality.columns * 16;
  const count = Math.round(baseCount * (quality.layers >= 3 ? 1.15 : 0.78));
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const layerValues = new Float32Array(count);
  const phaseAValues = new Float32Array(count);
  const phaseBValues = new Float32Array(count);
  const phaseCValues = new Float32Array(count);
  const alphaBiasValues = new Float32Array(count);
  const sizeBiasValues = new Float32Array(count);
  const motionScaleValues = new Float32Array(count);
  const driftScaleValues = new Float32Array(count);
  const isOrbit = variantName === "orbit";

  for (let i = 0; i < count; i += 1) {
    const seed = hash(i * 9.37 + count * 0.013);
    const corner = i % 4;
    const sideX = corner === 0 || corner === 2 ? -1 : 1;
    const sideY = corner < 2 ? 1 : -1;
    const localA = hash(i * 3.19 + 2.1);
    const localB = hash(i * 5.77 + 8.4);
    const radial = Math.pow(localA, 0.55);
    const sweep = (localB - 0.5) * 2;

    let x;
    let y;
    let z;

    if (isOrbit) {
      x = sideX * THREE.MathUtils.lerp(18, 38, radial) + sweep * 4.2;
      y = sideY * THREE.MathUtils.lerp(6.5, 15, Math.pow(localB, 0.7)) + Math.sin(radial * 4.0 + seed) * 1.5;
      z = THREE.MathUtils.lerp(8, -10, localA) + Math.cos(localB * 7.0) * 1.5;
    } else {
      x = sideX * THREE.MathUtils.lerp(22, 38, radial) + sweep * 3.5;
      y = sideY > 0 ? THREE.MathUtils.lerp(3.2, 9.8, localB) : THREE.MathUtils.lerp(-5.2, -1.0, localB);
      z = sideY > 0 ? THREE.MathUtils.lerp(2, 25, localA) : THREE.MathUtils.lerp(-9, 8, localA);
      y += Math.sin(x * 0.16 + z * 0.22 + seed * 3.0) * 0.9;
    }

    const cornerFade = 0.68 + radial * 0.5;
    const strand = Math.exp(-Math.pow(Math.sin(radial * 5.5 + sweep * 1.2), 2) * 3.2);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    seeds[i] = seed;
    layerValues[i] = 0.38 + localA * 0.5;
    phaseAValues[i] = x * 0.18 + z * 0.21 + seed * 2.0;
    phaseBValues[i] = x * 0.11 - y * 0.24 + seed * 3.4;
    phaseCValues[i] = Math.hypot(x * 0.08, y * 0.14) * 3.2 + z * 0.08;
    alphaBiasValues[i] = (0.2 + strand * 0.52 + radial * 0.18) * cornerFade;
    sizeBiasValues[i] = 0.68 + strand * 0.34 + localA * 0.22;
    motionScaleValues[i] = 0.22 + strand * 0.18;
    driftScaleValues[i] = 0.52 + localB * 0.22;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layerValues, 1));
  geometry.setAttribute("aPhaseA", new THREE.BufferAttribute(phaseAValues, 1));
  geometry.setAttribute("aPhaseB", new THREE.BufferAttribute(phaseBValues, 1));
  geometry.setAttribute("aPhaseC", new THREE.BufferAttribute(phaseCValues, 1));
  geometry.setAttribute("aAlphaBias", new THREE.BufferAttribute(alphaBiasValues, 1));
  geometry.setAttribute("aSizeBias", new THREE.BufferAttribute(sizeBiasValues, 1));
  geometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScaleValues, 1));
  geometry.setAttribute("aDriftScale", new THREE.BufferAttribute(driftScaleValues, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function createCornerFocusGeometry(quality) {
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;
  const baseCol = isTiny ? (quality.tinyColumns || Math.round(quality.mobileColumns * 0.7)) : isSmall ? quality.mobileColumns : quality.columns;
  const baseRow = isTiny ? (quality.tinyRows || Math.round(quality.mobileRows * 0.7)) : isSmall ? quality.mobileRows : quality.rows;
  const columns = Math.round(baseCol * (isTiny ? 1.0 : isSmall ? 1.2 : 1.38));
  const rows = Math.round(baseRow * (isTiny ? 1.0 : isSmall ? 1.2 : 1.12));
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const layerValues = new Float32Array(count);
  const phaseAValues = new Float32Array(count);
  const phaseBValues = new Float32Array(count);
  const phaseCValues = new Float32Array(count);
  const alphaBiasValues = new Float32Array(count);
  const sizeBiasValues = new Float32Array(count);
  const motionScaleValues = new Float32Array(count);
  const driftScaleValues = new Float32Array(count);

  let i = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const u = col / (columns - 1);
      const v = row / (rows - 1);
      const xBase = THREE.MathUtils.lerp(-35.5, 35.5, u);
      const yBase = THREE.MathUtils.lerp(-9.4, 11.2, v);
      const seed = hash(col * 12.31 + row * 6.47);
      const absX = Math.abs(xBase) / 35.5;
      const absY = Math.abs(yBase) / 11.2;
      const cornerPower = Math.pow(absX * absY, 0.58);
      const sideGate = smoothstep(0.22, 0.82, absX);
      const edgePower = Math.max(Math.pow(absX, 5.2), Math.pow(absY, 4.4) * (0.015 + sideGate * 0.985)) * 0.5;
      const centerClear = smoothstep(0.44, 0.86, Math.hypot(xBase / 27, yBase / 8.8));
      const lowerEdge = smoothstep(0.2, 0.78, 1 - v);
      const upperEdge = smoothstep(0.28, 0.86, v);
      const leftEdge = smoothstep(0.38, 0.9, 1 - u);
      const rightEdge = smoothstep(0.38, 0.9, u);
      const cornerPocket = Math.max(leftEdge * lowerEdge, rightEdge * lowerEdge, leftEdge * upperEdge, rightEdge * upperEdge);
      const diagonalA = Math.exp(-Math.pow(Math.sin((xBase + yBase) * 0.2 + seed * 0.9), 2) * 6.1);
      const diagonalB = Math.exp(-Math.pow(Math.sin((xBase - yBase) * 0.19 + 1.45 + seed * 0.65), 2) * 5.9);
      const edgeRiver = Math.max(
        Math.exp(-Math.pow(yBase - Math.sin(xBase * 0.14) * 1.7 - 9.4, 2) * 0.16) * upperEdge * (0.02 + sideGate * 0.43),
        Math.exp(-Math.pow(yBase - Math.sin(xBase * 0.12 + 1.6) * 1.45 + 7.35, 2) * 0.16) * lowerEdge * (0.04 + sideGate * 1.66)
      );
      const stream = Math.max(diagonalA, diagonalB, edgeRiver);
      const cornerCurl = Math.sin((absX + absY) * 5.7 + seed * 2.0);
      const x = xBase + Math.sign(xBase || 1) * cornerCurl * cornerPocket * 2.15 + (seed - 0.5) * 0.24;
      const y = yBase + Math.sign(yBase || 1) * Math.cos(absX * 5.2 + seed) * cornerPocket * 1.35;
      const z = THREE.MathUtils.lerp(5.9, -7.8, v) + Math.sin((xBase - yBase) * 0.13) * 1.85 + (seed - 0.5) * 0.65;
      const verticalBalance = 0.72 + upperEdge * 0.28 + lowerEdge * 3.35;
      const visibility = (cornerPocket * 1.55 + cornerPower * 0.62 + edgePower + stream * cornerPocket * 1.15) * centerClear * verticalBalance;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = seed;
      layerValues[i] = THREE.MathUtils.clamp(0.2 + cornerPower * 0.45 + edgePower * 0.22, 0, 1);
      phaseAValues[i] = x * 0.2 + y * 0.16 + seed * 2.8;
      phaseBValues[i] = x * 0.13 - y * 0.22 + z * 0.11 + seed * 4.0;
      phaseCValues[i] = Math.hypot(x * 0.1, y * 0.18) * 2.8 + seed;
      alphaBiasValues[i] = (0.015 + visibility * 2.18) * (0.54 + seed * 0.46);
      sizeBiasValues[i] = 0.78 + cornerPocket * 0.66 + stream * 0.34 + edgePower * 0.15;
      motionScaleValues[i] = 0.16 + cornerPocket * 0.22 + stream * 0.14;
      driftScaleValues[i] = 0.5 + cornerPocket * 0.3;
      i += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layerValues, 1));
  geometry.setAttribute("aPhaseA", new THREE.BufferAttribute(phaseAValues, 1));
  geometry.setAttribute("aPhaseB", new THREE.BufferAttribute(phaseBValues, 1));
  geometry.setAttribute("aPhaseC", new THREE.BufferAttribute(phaseCValues, 1));
  geometry.setAttribute("aAlphaBias", new THREE.BufferAttribute(alphaBiasValues, 1));
  geometry.setAttribute("aSizeBias", new THREE.BufferAttribute(sizeBiasValues, 1));
  geometry.setAttribute("aMotionScale", new THREE.BufferAttribute(motionScaleValues, 1));
  geometry.setAttribute("aDriftScale", new THREE.BufferAttribute(driftScaleValues, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function smoothMax(a, b) {
  return Math.pow(Math.pow(a, 4) + Math.pow(b, 4), 0.25);
}

function smoothstep(edge0, edge1, value) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function getTerrainSample(variantName, x, z, layerDepth, jitter) {
  if (variantName === "layered") {
    return getLayeredTerrainSample(x, z, layerDepth, jitter);
  }

  return {
    height: getPeakTerrainHeight(x, z),
    layerDrop: 2.1,
    alphaBias: 1,
    sizeBias: 1,
  };
}

function getPeakTerrainHeight(x, z) {
  return (
    ridge(x, z, -18, -1, 4.8, 9.5, 8.7) +
    ridge(x, z, -25, 1.5, 3.8, 7.5, 5) -
    ridge(x, z, -2, 1, 13, 10, 1.9) +
    ridge(x, z, 16, 0.5, 9, 7.5, 2.7)
  );
}

function getLayeredTerrainSample(x, z, layerDepth, jitter) {
  const bandA = Math.sin(x * 0.27 + z * 0.18) * 0.7;
  const bandB = Math.sin(x * 0.18 - z * 0.36 + 1.8) * 0.55;
  const bandC = Math.cos(x * 0.41 + z * 0.09 - 0.7) * 0.32;
  const centralRidge = ridge(x, z, 0, 3.2, 31, 3.2, 1.62);
  const frontRibbon = ridge(x, z, -3.5, -6.2, 40, 4.2, 0.92);
  const backRibbon = ridge(x, z, 2.5, 13.4, 40, 5.8, 1.32);
  const farRibbon = ridge(x, z, 0, 23, 42, 4.2, 1.05);
  const sideSwell = ridge(x, z, 21, 0, 9, 8, 0.85) + ridge(x, z, -22, 8, 10, 8, 0.7);
  const height =
    bandA +
    bandB +
    bandC +
    centralRidge +
    frontRibbon * 0.72 +
    backRibbon +
    farRibbon * 0.82 +
    sideSwell -
    0.72;
  const centerFocus = ridge(x, z, 0, 3.2, 34, 4.6, 1);
  const horizonFocus = ridge(x, z, 0, 18, 42, 7.5, 1);
  const foregroundFocus = ridge(x, z, 0, -7.4, 38, 4.2, 1);

  return {
    height,
    layerDrop: 1.58,
    alphaBias: 0.66 + centerFocus * 0.6 + horizonFocus * 0.28 + foregroundFocus * 0.08 + jitter * 0.06,
    sizeBias: 0.78 + foregroundFocus * 0.12 + centerFocus * 0.1 + layerDepth * 0.1,
  };
}

function getWavePhases(variantName, x, z, layerDepth, jitter) {
  if (variantName === "layered") {
    return {
      a: x * 0.3 + z * 0.16 + layerDepth * 1.65,
      b: x * 0.14 - z * 0.54 + jitter * 3.4,
      c: Math.abs(z * 0.42 + Math.sin(x * 0.08) * 2.6) + layerDepth * 1.8,
    };
  }

  return {
    a: x * 0.42 + z * 0.33 + layerDepth * 2.3,
    b: x * 0.18 - z * 0.74 + jitter * 2.0,
    c: Math.hypot(x * 0.12, z * 0.2) * 3.0,
  };
}

function ridge(x, z, cx, cz, sx, sz, height) {
  const dx = (x - cx) / sx;
  const dz = (z - cz) / sz;
  return Math.exp(-(dx * dx + dz * dz)) * height;
}

function hash(value) {
  const wave = Math.sin(value * 12.9898) * 43758.5453;
  return wave - Math.floor(wave);
}

function resolveQuality(value) {
  let resolvedKey = String(value || "auto").trim().toLowerCase();
  if (resolvedKey === "auto") {
    resolvedKey = mapPerformanceTierToQuality(getPerformanceTier());
    if (getPerformanceTier() === "efficient") {
      resolvedKey = "low";
    }
  }
  if (Object.hasOwn(qualityProfiles, resolvedKey)) {
    return { ...qualityProfiles[resolvedKey], name: resolvedKey };
  }
  const detectedProfile = detectQualityProfile();
  return { ...qualityProfiles[detectedProfile], name: detectedProfile };
}

function detectQualityProfile() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory;
  const hasLimitedMemory = typeof memory === "number" && memory <= 4;
  const connection = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const saveData = Boolean(connection?.saveData);
  const isTiny = window.innerWidth < 480;
  const isSmall = window.innerWidth < 720;

  if (reducedMotion || saveData || cores <= 4 || hasLimitedMemory || isSmall || isTiny) {
    return "low";
  }

  if (cores < 8 || window.innerWidth < 1200 || (typeof memory === "number" && memory < 8)) {
    return "balanced";
  }

  return "high";
}

function getRenderPixelRatio(quality) {
  const isTiny = window.innerWidth < 480;
  const dpr = window.devicePixelRatio || 1;
  if (isTiny) return Math.min(dpr, 1);
  // Supersample: render the canvas ABOVE native display resolution, then let
  // the browser downsample it. This is the highest-quality anti-aliasing
  // possible for the moving particle field — edges become dead-smooth, so
  // there is no crawl/shimmer. maxDpr caps the total ratio to keep the GPU
  // sane. On a DPR-2 display, high renders at 3x (4320-wide buffer).
  const supersample = quality.supersample || 1;
  return Math.min(dpr * supersample, quality.maxDpr);
}

function setQuality(quality, forceRebuild = false) {
  if (!renderer || !uniforms) return;
  const nextSmallGeometry = window.innerWidth < 720;
  const nextTinyGeometry = window.innerWidth < 480;
  const needsRebuild = forceRebuild || quality.name !== activeQualityName || nextSmallGeometry !== usingSmallGeometry || nextTinyGeometry !== (window.innerWidth < 480);

  activeQualityName = quality.name;
  activeQuality = quality;
  usingSmallGeometry = nextSmallGeometry;
  renderer.setPixelRatio(getRenderPixelRatio(activeQuality));
  uniforms.uPixelRatio.value = renderer.getPixelRatio();
  applyVariantTuning();

  if (!needsRebuild) {
    return;
  }

  const nextPoints = new THREE.Points(createWaveGeometry(activeQuality, activeVariantName), material);
  nextPoints.rotation.copy(points.rotation);
  nextPoints.position.copy(points.position);
  scene.remove(points);
  points.geometry.dispose();
  points = nextPoints;
  scene.add(points);
  cornerPoints.geometry.dispose();
  cornerPoints.geometry = createCornerAccentGeometry(activeQuality, activeVariantName);
  ribbonMesh.geometry.dispose();
  ribbonMesh.geometry = createLayeredRibbonGeometry(activeQuality);
  resize();
  applyLmsParticleTheme();
}

function setVariant(variantName) {
  if (!renderer || !points) return;
  if (!Object.hasOwn(variants, variantName)) return;
  if (variantName === activeVariantName) {
    applyVariantTuning();
    return;
  }

  activeVariantName = variantName;
  applyVariantTuning();

  const nextPoints = new THREE.Points(createWaveGeometry(activeQuality, activeVariantName), material);
  nextPoints.position.copy(points.position);
  nextPoints.rotation.copy(points.rotation);
  scene.remove(points);
  points.geometry.dispose();
  points = nextPoints;
  scene.add(points);
  cornerPoints.geometry.dispose();
  cornerPoints.geometry = createCornerAccentGeometry(activeQuality, activeVariantName);
  ribbonMesh.geometry.dispose();
  ribbonMesh.geometry = createLayeredRibbonGeometry(activeQuality);
  resize();
  applyLmsParticleTheme();
}

function applyVariantTuning() {
  if (!uniforms || !activeQuality) return;
  const variant = variants[activeVariantName] || variants.peak;
  uniforms.uPointScale.value = activeQuality.pointScale * variant.pointScale;
  applyParticleAlphaBoost();

  if (points) {
    points.rotation.x =
      activeVariantName === "orbit" || activeVariantName === "corners" ? 0 : activeVariantName === "layered" ? -0.12 : -0.18;
  }

  if (cornerPoints) {
    cornerPoints.rotation.x = points ? points.rotation.x : 0;
  }

  if (ribbonMesh) {
    ribbonMesh.visible = activeVariantName === "layered";
    ribbonMesh.rotation.x = activeVariantName === "layered" ? -0.12 : -0.18;
  }
}

function scheduleResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(resize, 120);
  updateViewport(false);
}

function resize() {
  updateViewport(true);
}

function updateViewport(allowRebuild) {
  if (!renderer || !camera || !points) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const nextSmallGeometry = width < 720;
  const nextTinyGeometry = width < 480;

  const tinyChanged = nextTinyGeometry !== (usingSmallGeometry && window.innerWidth < 480);
  if (nextSmallGeometry !== usingSmallGeometry || tinyChanged) {
    if (allowRebuild) {
      setQuality(resolveQuality(readPortalQualityKey()), true);
    }
    return;
  }

  renderer.setPixelRatio(getRenderPixelRatio(activeQuality));
  renderer.setSize(width, height, false);
  const isLayered = activeVariantName === "layered";
  const isOrbit = activeVariantName === "orbit";
  const isCorners = activeVariantName === "corners";
  const isFlatField = isOrbit || isCorners;
  const isTiny = width < 480;
  camera.aspect = width / height;
  camera.fov = isTiny ? 54 : width < 720 ? 48 : 42;
  camera.position.x = 0;
  camera.position.z = isTiny ? (isFlatField ? 36 : isLayered ? 34 : 34) : width < 720 ? (isFlatField ? 32 : isLayered ? 31 : 31) : isFlatField ? 34 : isLayered ? 28 : 28;
  camera.position.y = isTiny ? (isFlatField ? 0 : isLayered ? 5.5 : 6.8) : width < 720 ? (isFlatField ? 0 : isLayered ? 7.0 : 8.3) : isFlatField ? 0 : isLayered ? 7.6 : 9.5;
  camera.rotation.x = isFlatField ? 0 : isLayered ? -0.3 : -0.34;
  camera.updateProjectionMatrix();
  points.position.y = isTiny ? (isFlatField ? 0 : isLayered ? 0 : -0.4) : width < 720 ? (isFlatField ? 0 : isLayered ? 0.15 : -0.8) : isFlatField ? 0 : isLayered ? 0.45 : -3.2;
  cornerPoints.position.y = points.position.y;
  cornerPoints.rotation.x = points.rotation.x;
  cornerPoints.rotation.y = points.rotation.y;
  ribbonMesh.position.y = points.position.y;
  ribbonMesh.rotation.x = points.rotation.x;
  uniforms.uPixelRatio.value = renderer.getPixelRatio();
}

function renderCurrentFrame(time = 0) {
  if (!renderer || !scene || !camera || !uniforms || !points) return;
  if (!isPageVisible && !staticBackgroundOnly) return;
  if (window.__luxIsAnimating) return;

  const now = Number(time) || performance.now();
  // Locked 30fps pacing — fixed step avoids the ~1s hitch from irregular
  // vsync/skip interactions when lastRenderTime jumped to wall-clock `now`.
  const TARGET_FPS = 30;
  const frameInterval = 1000 / TARGET_FPS;
  if (!staticBackgroundOnly) {
    if (!lastRenderTime) {
      lastRenderTime = now;
    } else if (now - lastRenderTime < frameInterval) {
      return;
    } else {
      lastRenderTime += frameInterval;
      // If we fell more than 2 frames behind, resync to wall clock.
      if (now - lastRenderTime > frameInterval * 2) {
        lastRenderTime = now;
      }
    }
  } else {
    lastRenderTime = now;
  }

  const elapsed = clock?.getElapsedTime?.() || 0;
  uniforms.uTime.value = elapsed;
  uniforms.uMotion.value = THREE.MathUtils.lerp(uniforms.uMotion.value, targetMotion, 0.055);
  uniforms.uDensityFade.value = THREE.MathUtils.lerp(uniforms.uDensityFade.value, targetDensity, 0.08);
  const variant = variants[activeVariantName] || variants.peak;
  points.rotation.y = Math.sin(elapsed * 0.08) * variant.rotationSwing;
  cornerPoints.rotation.y = points.rotation.y * 0.72;
  ribbonMesh.rotation.y = points.rotation.y * 0.45;
  renderer.render(scene, camera);
}

function render() {
  renderCurrentFrame(performance.now());
}

window.__kiuInitLuxuryParticleBackground = initLuxuryParticleBackground;
window.__kiuRefreshLuxuryBackground = refreshLuxuryParticleBackground;
window.__kiuDisposeLuxuryParticleBackground = disposeLuxuryParticleBackground;
window.__kiuProbeWebGlAvailable = probeWebGlAvailable;
window.__kiuApplyLmsParticleTheme = applyLmsParticleTheme;

export {
  initLuxuryParticleBackground,
  refreshLuxuryParticleBackground,
  disposeLuxuryParticleBackground,
  probeWebGlAvailable,
};

function scheduleParticleBackgroundSelfInit(attempt = 0) {
  if (engineReady) return;
  const canvasEl = document.getElementById("lux-bg-canvas");
  if (canvasEl) {
    initLuxuryParticleBackground();
    return;
  }
  if (attempt < 120) {
    window.requestAnimationFrame(() => scheduleParticleBackgroundSelfInit(attempt + 1));
  }
}

function runParticleBackgroundSelfInit() {
  scheduleParticleBackgroundSelfInit();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runParticleBackgroundSelfInit, { once: true });
} else {
  runParticleBackgroundSelfInit();
}
