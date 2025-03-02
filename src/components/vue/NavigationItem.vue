<script setup lang="ts">
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
</script>

<template>
  <TooltipProvider :delay-duration="100">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <a
          rel="noopener noreferrer"
          :href="props.href"
          :class="`nav-item ${props.className}`"
          tabindex="0"
          @keydown.enter.prevent="$el.click()"
          @keydown.space.prevent="$el.click()"
        >
          <div class="icon-wrapper">
            <slot />
          </div>
        </a>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent class="tooltip-content" :side-offset="5">
          <p>{{ props.label }}</p>

          <TooltipArrow :width="8" class="tooltip-arrow" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
/* Base nav item styling */
.nav-item {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  margin: 0 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  /* Light mode */
  color: #555555;
}

.nav-item:focus {
  outline: 2px solid rgba(0, 0, 0, 0.1);
  outline-offset: 2px;
}

.icon-wrapper {
  transition: transform 0.2s ease;
}

/* Light mode hover */
.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item:hover .icon-wrapper {
  transform: translateY(-2px);
}

/* Active state */
.active-link {
  background-color: #f0f0f0;
  color: #000000;
}

/* Tooltip styling - light mode */
.tooltip-content {
  background-color: #ffffff;
  color: #333333;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tooltip-arrow {
  fill: #ffffff;
  filter: drop-shadow(0 -1px 0px #e5e5e5);
}

/* Dark mode styling */
:global(.dark) .nav-item {
  color: #cccccc;
}

:global(.dark) .nav-item:hover {
  background-color: #2a2a2a;
}

:global(.dark) .active-link {
  background-color: #333333;
  color: #ffffff;
}

:global(.dark) .nav-item:focus {
  outline-color: rgba(255, 255, 255, 0.2);
}

:global(.dark) .tooltip-content {
  background-color: #1a1a1a;
  color: #f0f0f0;
  border-color: #333333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:global(.dark) .tooltip-arrow {
  fill: #1a1a1a;
  filter: drop-shadow(0 -1px 0px #333333);
}
</style>
