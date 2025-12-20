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

onMounted(() => {
  fetchNowPlaying();
  pollInterval = setInterval(fetchNowPlaying, 30000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<template>
  <Transition name="fade">
    <a
      v-if="isVisible && currentTrack"
      :href="currentTrack.url"
      target="_blank"
      rel="noopener noreferrer"
      class="now-playing now-playing-widget"
    >
      <img :src="currentTrack.image" :alt="currentTrack.name" class="album-art" />
      <div class="track-info">
        <div class="track-name">{{ currentTrack.name }}</div>
        <div class="track-artist">{{ currentTrack.artist }}</div>
      </div>
      <div class="equalizer">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </a>
  </Transition>
</template>

<style>
/* Dark mode styles - must be non-scoped to work with .dark on html */
.dark .now-playing-widget {
  background: #000000 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .now-playing-widget .track-name,
.dark .now-playing-widget .track-artist {
  color: #ffffff !important;
}
</style>

<style scoped>
.now-playing {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  padding-right: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 280px;
}

.now-playing:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.album-art {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track-name {
  font-size: 13px;
  font-weight: 500;
  color: #1c1b19;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.track-artist {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  flex-shrink: 0;
}

.equalizer span {
  width: 3px;
  background: #1DB954;
  border-radius: 1px;
  animation: equalizer 0.6s ease-in-out infinite;
}

.equalizer span:nth-child(1) {
  animation-delay: 0s;
  height: 40%;
}

.equalizer span:nth-child(2) {
  animation-delay: 0.15s;
  height: 100%;
}

.equalizer span:nth-child(3) {
  animation-delay: 0.3s;
  height: 65%;
}

@keyframes equalizer {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Mobile - top of page */
@media (max-width: 640px) {
  .now-playing {
    top: 16px;
    bottom: auto;
    right: 16px;
    left: 16px;
    max-width: none;
    padding: 6px;
    padding-right: 12px;
    gap: 10px;
  }

  .album-art {
    width: 40px;
    height: 40px;
    border-radius: 4px;
  }

  .track-name {
    font-size: 12px;
  }

  .track-artist {
    font-size: 11px;
  }

  .equalizer {
    height: 14px;
  }

  .equalizer span {
    width: 2px;
  }
}

/* Mobile transition fix */
@media (max-width: 640px) {
  .fade-enter-from,
  .fade-leave-to {
    transform: translateY(-8px);
  }
}
</style>
