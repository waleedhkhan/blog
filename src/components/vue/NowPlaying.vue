<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Track {
  name: string;
  artist: string;
  url: string;
  image: string;
  nowPlaying?: boolean;
}

const currentTrack = ref<Track | null>(null);
const isVisible = ref(false);
const isMinimized = ref(false);
let pollInterval: ReturnType<typeof setInterval> | null = null;

async function fetchNowPlaying() {
  try {
    const response = await fetch('/api/spotify/recent?limit=1');
    if (!response.ok) return;

    const tracks: Track[] = await response.json();
    const playing = tracks.find(t => t.nowPlaying);

    if (playing) {
      currentTrack.value = playing;
      isVisible.value = true;
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

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

onMounted(() => {
  fetchNowPlaying();
  pollInterval = setInterval(fetchNowPlaying, 30000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<template>
  <Transition name="slide">
    <div
      v-if="isVisible && currentTrack"
      class="now-playing"
      :class="{ minimized: isMinimized }"
    >
      <a
        :href="currentTrack.url"
        target="_blank"
        rel="noopener noreferrer"
        class="now-playing-link"
      >
        <div class="album-art">
          <img :src="currentTrack.image" :alt="currentTrack.name" />
          <div class="equalizer">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div v-if="!isMinimized" class="track-info">
          <span class="track-name">{{ currentTrack.name }}</span>
          <span class="track-artist">{{ currentTrack.artist }}</span>
        </div>
      </a>
      <button
        class="minimize-btn"
        @click.stop="toggleMinimize"
        :aria-label="isMinimized ? 'Expand' : 'Minimize'"
      >
        <svg v-if="!isMinimized" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 14 10 14 10 20"></polyline>
          <polyline points="20 10 14 10 14 4"></polyline>
          <line x1="14" y1="10" x2="21" y2="3"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.now-playing {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  padding-right: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  max-width: 280px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.now-playing.minimized {
  padding-right: 8px;
  max-width: 56px;
}

.now-playing:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

:global(.dark) .now-playing {
  background: rgba(28, 28, 30, 0.9);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.24), 0 1px 3px rgba(0, 0, 0, 0.12);
}

.now-playing-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.album-art {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equalizer {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.equalizer span {
  width: 3px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1px;
  animation: equalizer 0.8s ease-in-out infinite;
}

.equalizer span:nth-child(1) {
  animation-delay: 0s;
  height: 60%;
}

.equalizer span:nth-child(2) {
  animation-delay: 0.2s;
  height: 100%;
}

.equalizer span:nth-child(3) {
  animation-delay: 0.4s;
  height: 40%;
}

@keyframes equalizer {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

.track-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.track-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

:global(.dark) .track-name {
  color: #f0f0f0;
}

.track-artist {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

:global(.dark) .track-artist {
  color: #888;
}

.minimize-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.minimize-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #555;
}

:global(.dark) .minimize-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

/* Transition animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .now-playing {
    bottom: 100px;
    left: 12px;
    max-width: 240px;
  }

  .now-playing.minimized {
    max-width: 52px;
  }

  .album-art {
    width: 36px;
    height: 36px;
  }

  .track-name {
    font-size: 12px;
  }

  .track-artist {
    font-size: 10px;
  }
}
</style>
