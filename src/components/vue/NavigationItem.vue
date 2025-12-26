<script setup lang="ts">
import { ref } from 'vue';
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  TooltipPortal,
} from "radix-vue";

const props = defineProps({
  label: { type: String, required: true },
  className: { type: String, default: "" },
  href: { type: String, required: true },
});

const isPressed = ref(false);
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <a
          rel="noopener noreferrer"
          :href="props.href"
          :class="['nav-item', props.className, { pressed: isPressed }]"
          tabindex="0"
          @mousedown="isPressed = true"
          @mouseup="isPressed = false"
          @mouseleave="isPressed = false"
          @touchstart="isPressed = true"
          @touchend="isPressed = false"
          @keydown.enter.prevent="$el.click()"
          @keydown.space.prevent="$el.click()"
        >
          <div class="icon-wrapper">
            <slot />
          </div>
        </a>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent class="tooltip-content" :side-offset="8" :side="'top'">
          {{ props.label }}
          <TooltipArrow :width="8" :height="4" class="tooltip-arrow" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style>
/* Dark mode - non-scoped for proper cascading */
.dark .nav-item {
  color: #888888;
}

.dark .nav-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.dark .nav-item.pressed {
  background-color: rgba(255, 255, 255, 0.12);
}

.dark .nav-item.active-link {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.dark .nav-item:focus-visible {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.dark .tooltip-content {
  background-color: #ffffff;
  color: #1c1b19;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .tooltip-arrow {
  fill: #ffffff;
}
</style>

<style scoped>
.nav-item {
  position: relative;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin: 0 2px;
  border-radius: 12px;
  color: #666666;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.15s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Hover state */
.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1c1b19;
}

.nav-item:hover .icon-wrapper {
  transform: translateY(-1px);
}

/* Press/Active state */
.nav-item.pressed {
  transform: scale(0.92);
  background-color: rgba(0, 0, 0, 0.08);
}

.nav-item.pressed .icon-wrapper {
  transform: scale(0.95);
}

/* Active link */
.nav-item.active-link {
  background-color: rgba(0, 0, 0, 0.06);
  color: #1c1b19;
}

.nav-item.active-link::after {
  content: "";
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  opacity: 0.8;
}

/* Focus state */
.nav-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

/* Tooltip */
.tooltip-content {
  background-color: #1c1b19;
  color: #ffffff;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: tooltipIn 0.15s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 100;
}

.tooltip-arrow {
  fill: #1c1b19;
}

@keyframes tooltipIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* Mobile adjustments */
@media (max-width: 640px) {
  .nav-item {
    width: 40px;
    height: 40px;
    margin: 0;
    border-radius: 10px;
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .icon-wrapper,
  .tooltip-content {
    transition: none;
    animation: none;
  }
}
</style>
