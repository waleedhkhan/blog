<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side"
          :align="align"
          :avoid-collisions="avoidCollisions"
          class=":uno: z-50 overflow-hidden rounded-md border border-separator bg-background px-3 py-1.5 text-sm text-muted-foreground shadow animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <slot />
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup>
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipArrow
} from 'radix-vue';

defineProps({
  side: {
    type: String,
    default: 'top'
  },
  align: {
    type: String,
    default: 'center'
  },
  avoidCollisions: {
    type: Boolean,
    default: true
  }
});
</script>
