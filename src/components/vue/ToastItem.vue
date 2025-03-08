<template>
  <ToastRoot
    :class="[
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
      variant === 'default' ? 'border bg-background text-foreground' : 
      variant === 'destructive' ? 'destructive group border-destructive bg-destructive text-destructive-foreground' : ''
    ]"
  >
    <div class="flex flex-col gap-1">
      <ToastTitle v-if="title" class="text-sm font-semibold">
        {{ title }}
      </ToastTitle>
      <ToastDescription v-if="description" class="text-sm opacity-90">
        {{ description }}
      </ToastDescription>
    </div>
    <slot name="action"></slot>
    <ToastClose class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
      <icon-close class="h-4 w-4" />
      <span class="sr-only">Close</span>
    </ToastClose>
  </ToastRoot>
</template>

<script setup>
import { ToastRoot, ToastTitle, ToastDescription, ToastClose } from 'radix-vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'destructive'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});
</script>

<script>
// Custom icon component to avoid lucide-react dependency
const IconClose = {
  name: 'IconClose',
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
    );
  }
};

export default {
  components: {
    IconClose
  }
};
</script>
