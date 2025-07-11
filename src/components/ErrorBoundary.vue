<script setup>
import { ref, onErrorCaptured, defineProps, defineEmits } from 'vue';

const props = defineProps({
  fallback: {
    type: String,
    default: 'Something went wrong. Please try again.'
  }
});

const emit = defineEmits(['error']);

const error = ref(null);

onErrorCaptured((err) => {
  error.value = err;
  emit('error', err);
  
  // Prevent the error from propagating further
  return false;
});
</script>

<template>
  <div v-if="error" class="error-boundary p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
    <p class="text-red-600 dark:text-red-300">{{ fallback }}</p>
    <details class="mt-2">
      <summary class="text-sm text-red-700 dark:text-red-400 cursor-pointer">
        Show error details
      </summary>
      <pre class="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs overflow-auto">{{ error }}</pre>
    </details>
  </div>
  <slot v-else></slot>
</template>

<style scoped>
.error-boundary {
  border-left: 3px solid #ef4444;
}
</style>
