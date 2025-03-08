<template>
  <ToastProvider>
    <slot />
    <ToastViewport 
      class="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    />
  </ToastProvider>
</template>

<script setup>
import { 
  ToastProvider, 
  ToastViewport,
} from 'radix-vue';
</script>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
