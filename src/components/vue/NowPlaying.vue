<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import * as THREE from 'three';

interface Track {
  name: string;
  artist: string;
  url: string;
  image: string;
  nowPlaying?: boolean;
}

const currentTrack = ref<Track | null>(null);
const isVisible = ref(false);
const isGlitching = ref(false);
const widgetRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let pollInterval: ReturnType<typeof setInterval> | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let glitchMaterial: THREE.ShaderMaterial | null = null;
let animationId: number | null = null;
let glitchStartTime = 0;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    float intensity = uIntensity;

    // Horizontal glitch displacement
    float glitchLine = step(0.98, random(vec2(floor(uv.y * 20.0), floor(t * 10.0))));
    uv.x += glitchLine * (random(vec2(t)) - 0.5) * 0.3 * intensity;

    // Block glitch
    float blockNoise = step(0.95, random(vec2(floor(uv.x * 8.0), floor(uv.y * 8.0) + floor(t * 15.0))));
    uv += blockNoise * (vec2(random(vec2(t, 1.0)), random(vec2(t, 2.0))) - 0.5) * 0.2 * intensity;

    // Chromatic aberration
    float aberration = 0.02 * intensity;
    float r = noise(uv * 10.0 + t * 2.0);
    float g = noise(uv * 10.0 + t * 2.0 + vec2(aberration, 0.0));
    float b = noise(uv * 10.0 + t * 2.0 + vec2(-aberration, aberration));

    // Scanlines
    float scanline = sin(uv.y * 300.0 + t * 10.0) * 0.1 * intensity;

    // Color mixing with glitch
    vec3 color = mix(uColor1, uColor2, noise(uv * 5.0 + t));
    color.r *= r + 0.5;
    color.g *= g + 0.5;
    color.b *= b + 0.5;
    color += scanline;

    // RGB split effect
    float split = sin(t * 20.0) * 0.02 * intensity;
    color.r += split;
    color.b -= split;

    // Noise overlay
    float noiseOverlay = random(uv + t) * 0.15 * intensity;
    color += noiseOverlay;

    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.5;
    color *= vignette;

    // Fade in/out based on time
    float fadeIn = smoothstep(0.0, 0.2, t);
    float fadeOut = 1.0 - smoothstep(0.6, 1.0, t);
    float alpha = fadeIn * fadeOut * intensity;

    gl_FragColor = vec4(color, alpha);
  }
`;

function initThree() {
  if (!canvasRef.value) return;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  glitchMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor1: { value: new THREE.Color('#1DB954') }, // Spotify green
      uColor2: { value: new THREE.Color('#191414') }, // Spotify dark
    },
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, glitchMaterial);
  scene.add(mesh);

  updateCanvasSize();
}

function updateCanvasSize() {
  if (!renderer || !widgetRef.value || !canvasRef.value) return;

  const rect = widgetRef.value.getBoundingClientRect();
  const padding = 20;
  canvasRef.value.style.width = `${rect.width + padding * 2}px`;
  canvasRef.value.style.height = `${rect.height + padding * 2}px`;
  renderer.setSize(rect.width + padding * 2, rect.height + padding * 2);
}

function triggerGlitch() {
  isGlitching.value = true;
  glitchStartTime = performance.now();

  if (!animationId) {
    animateGlitch();
  }
}

function animateGlitch() {
  if (!renderer || !scene || !camera || !glitchMaterial) return;

  const elapsed = (performance.now() - glitchStartTime) / 1000;
  const duration = 0.8;

  if (elapsed < duration) {
    const progress = elapsed / duration;
    // Intensity peaks in the middle
    const intensity = Math.sin(progress * Math.PI) * 1.2;

    glitchMaterial.uniforms.uTime.value = progress;
    glitchMaterial.uniforms.uIntensity.value = intensity;

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animateGlitch);
  } else {
    // Reset
    glitchMaterial.uniforms.uIntensity.value = 0;
    renderer.render(scene, camera);
    isGlitching.value = false;
    animationId = null;
  }
}

async function fetchNowPlaying() {
  try {
    const response = await fetch('/api/spotify/recent?limit=1');
    if (!response.ok) return;

    const tracks: Track[] = await response.json();
    const playing = tracks.find(t => t.nowPlaying);

    if (playing) {
      const isFirstLoad = !currentTrack.value && !isVisible.value;
      const trackChanged = currentTrack.value && currentTrack.value.url !== playing.url;

      if (isFirstLoad) {
        // First load - show widget then trigger glitch
        currentTrack.value = playing;
        isVisible.value = true;
        await nextTick();
        updateCanvasSize();
        // Small delay to ensure widget is rendered before glitch
        setTimeout(() => {
          triggerGlitch();
        }, 50);
      } else if (trackChanged) {
        // Track change - trigger glitch and update in the middle
        triggerGlitch();
        setTimeout(() => {
          currentTrack.value = playing;
        }, 400);
      } else {
        currentTrack.value = playing;
      }
      isVisible.value = true;

      await nextTick();
      updateCanvasSize();
    } else {
      isVisible.value = false;
      setTimeout(() => {
        if (!isVisible.value) currentTrack.value = null;
      }, 300);
    }
  } catch {
    // Silently fail
  }
}

onMounted(() => {
  initThree();
  fetchNowPlaying();
  pollInterval = setInterval(fetchNowPlaying, 30000);

  window.addEventListener('resize', updateCanvasSize);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
  window.removeEventListener('resize', updateCanvasSize);
});
</script>

<template>
  <div class="now-playing-container">
    <canvas ref="canvasRef" class="glitch-canvas" :class="{ active: isGlitching }"></canvas>
    <Transition name="fade">
      <a
        v-if="isVisible && currentTrack"
        ref="widgetRef"
        :href="currentTrack.url"
        target="_blank"
        rel="noopener noreferrer"
        class="now-playing now-playing-widget"
        :class="{ glitching: isGlitching }"
      >
        <img :src="currentTrack.image" :alt="currentTrack.name" class="album-art" />
        <div class="track-info">
          <div class="track-name">{{ currentTrack.name }}</div>
          <div class="track-artist">{{ currentTrack.artist }}</div>
        </div>
        <div class="equalizer">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </a>
    </Transition>
  </div>
</template>

<style>
/* Dark mode styles - must be non-scoped to work with .dark on html */
.dark .now-playing-widget {
  background: #000000 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .now-playing-widget .track-name,
.dark .now-playing-widget .track-artist {
  color: #ffffff !important;
}
</style>

<style scoped>
.now-playing-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 40;
}

.glitch-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
  border-radius: 16px;
  z-index: 50;
}

.glitch-canvas.active {
  opacity: 1;
}

.now-playing.glitching {
  animation: widget-shake 0.1s ease-in-out infinite;
}

.now-playing.glitching .track-info {
  animation: text-glitch 0.15s ease-in-out infinite;
}

@keyframes widget-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px) skewX(-0.5deg); }
  75% { transform: translateX(2px) skewX(0.5deg); }
}

@keyframes text-glitch {
  0%, 100% {
    clip-path: inset(0 0 0 0);
    transform: translateX(0);
  }
  20% {
    clip-path: inset(10% 0 60% 0);
    transform: translateX(-3px);
  }
  40% {
    clip-path: inset(40% 0 20% 0);
    transform: translateX(3px);
  }
  60% {
    clip-path: inset(70% 0 10% 0);
    transform: translateX(-2px);
  }
  80% {
    clip-path: inset(20% 0 50% 0);
    transform: translateX(2px);
  }
}

.now-playing {
  position: relative;
  bottom: auto;
  right: auto;
  z-index: 41;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  padding-right: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 280px;
}

.now-playing:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.album-art {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track-name {
  font-size: 13px;
  font-weight: 500;
  color: #1c1b19;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.track-artist {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  flex-shrink: 0;
}

.equalizer span {
  width: 3px;
  background: #1DB954;
  border-radius: 1px;
  animation: equalizer 0.6s ease-in-out infinite;
}

.equalizer span:nth-child(1) {
  animation-delay: 0s;
  height: 40%;
}

.equalizer span:nth-child(2) {
  animation-delay: 0.15s;
  height: 100%;
}

.equalizer span:nth-child(3) {
  animation-delay: 0.3s;
  height: 65%;
}

@keyframes equalizer {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Disable hover transform during glitch */
.now-playing.glitching:hover {
  transform: none;
}

/* Mobile - top of page */
@media (max-width: 640px) {
  .now-playing-container {
    top: 16px;
    bottom: auto;
    right: 16px;
    left: 16px;
  }

  .now-playing {
    max-width: none;
    padding: 6px;
    padding-right: 12px;
    gap: 10px;
  }

  .album-art {
    width: 40px;
    height: 40px;
    border-radius: 4px;
  }

  .track-name {
    font-size: 12px;
  }

  .track-artist {
    font-size: 11px;
  }

  .equalizer {
    height: 14px;
  }

  .equalizer span {
    width: 2px;
  }

  .fade-enter-from,
  .fade-leave-to {
    transform: translateY(-8px);
  }
}
</style>
