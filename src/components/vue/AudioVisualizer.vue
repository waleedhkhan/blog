<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { animate, stagger } from 'motion';

const containerRef = ref<HTMLDivElement | null>(null);
const barsRef = ref<HTMLDivElement[]>([]);
const dotsRef = ref<HTMLDivElement[]>([]);

const BAR_COUNT = 24;
const DOT_COUNT = 12;

let barAnimation: any = null;
let dotAnimation: any = null;
let mouseX = 0;
let mouseY = 0;

function startAnimations() {
  if (!barsRef.value.length) return;

  // Animate equalizer bars with organic movement
  const animateBars = () => {
    barsRef.value.forEach((bar, i) => {
      if (!bar) return;

      const baseHeight = 20 + Math.random() * 60;
      const duration = 0.4 + Math.random() * 0.4;

      animate(bar, {
        scaleY: [bar.style.transform ? undefined : 0.2, baseHeight / 100, 0.2 + Math.random() * 0.3],
      }, {
        duration,
        easing: 'ease-in-out',
      });
    });
  };

  // Run bar animation on loop
  animateBars();
  barAnimation = setInterval(animateBars, 600);

  // Floating dots animation
  dotsRef.value.forEach((dot, i) => {
    if (!dot) return;

    const floatDot = () => {
      const randomX = (Math.random() - 0.5) * 30;
      const randomY = (Math.random() - 0.5) * 20;
      const duration = 2 + Math.random() * 2;

      animate(dot, {
        x: randomX,
        y: randomY,
        opacity: [0.3, 0.6, 0.3],
      }, {
        duration,
        easing: 'ease-in-out',
      }).then(floatDot);
    };

    setTimeout(floatDot, i * 200);
  });
}

function onMouseMove(event: MouseEvent) {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

  // Subtle parallax on dots
  dotsRef.value.forEach((dot, i) => {
    if (!dot) return;
    const factor = (i + 1) * 0.5;
    dot.style.transform = `translate(${mouseX * factor * 10}px, ${mouseY * factor * 5}px)`;
  });
}

onMounted(() => {
  startAnimations();
  window.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
  if (barAnimation) clearInterval(barAnimation);
  window.removeEventListener('mousemove', onMouseMove);
});

function setBarsRef(el: any, index: number) {
  if (el) barsRef.value[index] = el;
}

function setDotsRef(el: any, index: number) {
  if (el) dotsRef.value[index] = el;
}
</script>

<template>
  <div ref="containerRef" class="visualizer">
    <!-- Equalizer bars -->
    <div class="eq-container">
      <div
        v-for="i in BAR_COUNT"
        :key="'bar-' + i"
        :ref="(el) => setBarsRef(el, i - 1)"
        class="eq-bar"
        :style="{
          left: `${(i - 1) * (100 / BAR_COUNT)}%`,
          animationDelay: `${i * 0.05}s`
        }"
      />
    </div>

    <!-- Floating dots -->
    <div class="dots-container">
      <div
        v-for="i in DOT_COUNT"
        :key="'dot-' + i"
        :ref="(el) => setDotsRef(el, i - 1)"
        class="floating-dot"
        :style="{
          left: `${10 + (i - 1) * 8}%`,
          top: `${20 + Math.sin(i) * 30}%`,
          width: `${4 + (i % 3) * 2}px`,
          height: `${4 + (i % 3) * 2}px`,
        }"
      />
    </div>

    <!-- Subtle gradient lines -->
    <div class="line line-1" />
    <div class="line line-2" />
    <div class="line line-3" />
  </div>
</template>

<style scoped>
.visualizer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Equalizer */
.eq-container {
  position: absolute;
  bottom: 30%;
  left: 10%;
  right: 10%;
  height: 80px;
  display: flex;
  align-items: flex-end;
}

.eq-bar {
  position: absolute;
  bottom: 0;
  width: 2px;
  height: 100%;
  transform-origin: bottom;
  transform: scaleY(0.2);
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.08),
    rgba(0, 0, 0, 0.02)
  );
  border-radius: 1px;
}

:global(.dark) .eq-bar {
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.02)
  );
}

/* Floating dots */
.dots-container {
  position: absolute;
  inset: 0;
}

.floating-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  opacity: 0.4;
  transition: transform 0.3s ease-out;
}

:global(.dark) .floating-dot {
  background: rgba(255, 255, 255, 0.08);
}

/* Animated lines */
.line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.04) 20%,
    rgba(0, 0, 0, 0.06) 50%,
    rgba(0, 0, 0, 0.04) 80%,
    transparent
  );
  animation: pulse 4s ease-in-out infinite;
}

:global(.dark) .line {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.04) 20%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 80%,
    transparent
  );
}

.line-1 {
  top: 25%;
  animation-delay: 0s;
}

.line-2 {
  top: 50%;
  animation-delay: 1.3s;
}

.line-3 {
  top: 75%;
  animation-delay: 2.6s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scaleX(0.8);
  }
  50% {
    opacity: 0.7;
    transform: scaleX(1);
  }
}
</style>
