<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let animationId: number | null = null;
let waveMaterial: THREE.ShaderMaterial | null = null;
let time = 0;
let mouseX = 0;

function init() {
  if (!containerRef.value) return;

  const width = containerRef.value.offsetWidth;
  const height = containerRef.value.offsetHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  containerRef.value.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  waveMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: 0 },
      uDark: { value: document.documentElement.classList.contains('dark') ? 1.0 : 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMouse;
      uniform float uDark;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;

        vec3 greenColor = vec3(0.114, 0.725, 0.329); // #1DB954
        float alpha = 0.0;

        // 5 flowing wave lines
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float yOffset = 0.2 + fi * 0.15;
          float amplitude = 0.025 + fi * 0.01;
          float frequency = 1.5 + fi * 0.3;
          float speed = 0.4 + fi * 0.08;
          float phase = fi * 1.2;

          // Layered sine waves for organic movement
          float wave = sin(uv.x * frequency * 3.14159 * 2.0 + uTime * speed + phase + uMouse * 0.8) * amplitude;
          wave += sin(uv.x * frequency * 1.5 * 3.14159 * 2.0 - uTime * speed * 0.6 + phase) * amplitude * 0.6;
          wave += sin(uv.x * frequency * 3.0 * 3.14159 * 2.0 + uTime * speed * 1.2) * amplitude * 0.3;

          float y = yOffset + wave;

          // Line with glow
          float dist = abs(uv.y - y);

          // Core line
          float lineWidth = 0.003;
          float line = smoothstep(lineWidth, 0.0, dist);

          // Soft glow around line
          float glowWidth = 0.025;
          float glow = smoothstep(glowWidth, 0.0, dist) * 0.4;

          // Fade at edges
          float edgeFade = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);

          // Opacity varies by line (front lines more visible)
          float lineOpacity = 0.25 - fi * 0.03;
          float glowOpacity = 0.15 - fi * 0.02;

          alpha += (line * lineOpacity + glow * glowOpacity) * edgeFade;
        }

        // Add subtle gradient background
        float bgGradient = smoothstep(0.0, 0.5, uv.y) * smoothstep(1.0, 0.5, uv.y);
        float bgAlpha = bgGradient * 0.03;

        vec3 finalColor = greenColor;
        float finalAlpha = alpha + bgAlpha;

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, waveMaterial);
  scene.add(mesh);

  const observer = new MutationObserver(() => {
    if (waveMaterial) {
      waveMaterial.uniforms.uDark.value = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function animate() {
  if (!renderer || !scene || !camera || !waveMaterial) return;

  time += 0.016;
  waveMaterial.uniforms.uTime.value = time;
  waveMaterial.uniforms.uMouse.value += (mouseX - waveMaterial.uniforms.uMouse.value) * 0.03;

  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function onMouseMove(event: MouseEvent) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
}

function onResize() {
  if (!containerRef.value || !renderer) return;
  const width = containerRef.value.offsetWidth;
  const height = containerRef.value.offsetHeight;
  renderer.setSize(width, height);
}

onMounted(() => {
  init();
  animate();
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <div ref="containerRef" class="visualizer"></div>
</template>

<style scoped>
.visualizer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
</style>
