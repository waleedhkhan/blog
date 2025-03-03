<script setup lang="ts">
// Your existing script setup
</script>

<template>
  <div class="toc-wrapper">
    <slot />
  </div>
</template>

<style scoped>
.toc-wrapper {
  position: fixed;
  bottom: 30px;
  left: 20px;
  max-height: 60vh;
  overflow-y: auto;
  z-index: 40;
  /* Your existing styles */
}

/* Other existing styles */
</style>
