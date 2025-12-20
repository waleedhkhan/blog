<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Track {
  name: string;
  artist: string;
  album: string;
  url: string;
  image: string;
  duration: number;
  playedAt?: string;
  popularity?: number;
}

interface Artist {
  name: string;
  url: string;
  image: string;
  genres: string[];
  popularity: number;
}

interface Stats {
  totalTracks: number;
  totalMinutes: number;
  uniqueArtists: number;
  topRecentArtist: { name: string; count: number } | null;
  peakListeningHour: number;
  avgTrackDuration: number;
}

interface SpotifyData {
  topArtists: Artist[];
  topTracks: Track[];
  recentTracks: Track[];
  stats: Stats | null;
  timeRange: string;
}

const data = ref<SpotifyData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const timeRange = ref('short_term');

const timeRangeLabels: Record<string, string> = {
  short_term: '4 weeks',
  medium_term: '6 months',
  long_term: 'All time',
};

async function fetchStats() {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/spotify/stats?time_range=${timeRange.value}`);
    if (!response.ok) throw new Error('Failed to fetch');
    data.value = await response.json();
  } catch (e) {
    error.value = 'Failed to load listening data';
  } finally {
    loading.value = false;
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
}

function changeTimeRange(range: string) {
  timeRange.value = range;
  fetchStats();
}

onMounted(fetchStats);
</script>

<template>
  <div class="dashboard">
    <!-- Time Range Pills -->
    <div class="time-pills">
      <button
        v-for="(label, key) in timeRangeLabels"
        :key="key"
        :class="['pill', { active: timeRange === key }]"
        @click="changeTimeRange(key)"
      >
        {{ label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="loader"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchStats" class="retry">Retry</button>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <!-- Hero: Currently/Recently Played -->
      <div class="hero-card" v-if="data.recentTracks[0]">
        <div class="hero-bg" :style="{ backgroundImage: `url(${data.recentTracks[0].image})` }"></div>
        <div class="hero-content">
          <span class="hero-label">Recently Played</span>
          <img :src="data.recentTracks[0].image" :alt="data.recentTracks[0].name" class="hero-art" />
          <div class="hero-info">
            <h2 class="hero-title">{{ data.recentTracks[0].name }}</h2>
            <p class="hero-artist">{{ data.recentTracks[0].artist }}</p>
            <p class="hero-album">{{ data.recentTracks[0].album }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Bento Grid -->
      <div class="bento-grid" v-if="data.stats">
        <div class="bento-card accent">
          <span class="bento-value">{{ data.stats.totalTracks }}</span>
          <span class="bento-label">tracks played</span>
        </div>
        <div class="bento-card">
          <span class="bento-value">{{ data.stats.totalMinutes }}</span>
          <span class="bento-label">minutes listened</span>
        </div>
        <div class="bento-card">
          <span class="bento-value">{{ data.stats.uniqueArtists }}</span>
          <span class="bento-label">artists</span>
        </div>
        <div class="bento-card">
          <span class="bento-value">{{ formatHour(data.stats.peakListeningHour) }}</span>
          <span class="bento-label">peak hour</span>
        </div>
      </div>

      <!-- Top Artists (if available) -->
      <section v-if="data.topArtists.length" class="section">
        <h3 class="section-title">Top Artists</h3>
        <div class="artists-grid">
          <a
            v-for="artist in data.topArtists.slice(0, 6)"
            :key="artist.url"
            :href="artist.url"
            target="_blank"
            rel="noopener noreferrer"
            class="artist-card"
          >
            <img :src="artist.image" :alt="artist.name" class="artist-img" />
            <div class="artist-name">{{ artist.name }}</div>
            <div class="artist-genre">{{ artist.genres[0] || 'Artist' }}</div>
          </a>
        </div>
      </section>

      <!-- Top Tracks (if available) -->
      <section v-if="data.topTracks.length" class="section">
        <h3 class="section-title">Top Tracks</h3>
        <div class="tracks-list">
          <a
            v-for="(track, i) in data.topTracks.slice(0, 5)"
            :key="track.url"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="track-row"
          >
            <span class="track-num">{{ i + 1 }}</span>
            <img :src="track.image" :alt="track.name" class="track-art" />
            <div class="track-info">
              <div class="track-name">{{ track.name }}</div>
              <div class="track-artist">{{ track.artist }}</div>
            </div>
            <span class="track-duration">{{ formatDuration(track.duration) }}</span>
          </a>
        </div>
      </section>

      <!-- Recent History -->
      <section class="section">
        <h3 class="section-title">Listening History</h3>
        <div class="history-list">
          <a
            v-for="track in data.recentTracks"
            :key="track.playedAt"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="history-item"
          >
            <img :src="track.image" :alt="track.name" class="history-art" />
            <div class="history-info">
              <div class="history-name">{{ track.name }}</div>
              <div class="history-meta">{{ track.artist }} &middot; {{ track.album }}</div>
            </div>
            <div class="history-time">{{ formatTime(track.playedAt!) }}</div>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  --accent: #2A2F4F;
  --card-bg: #fff;
  --card-border: #eee;
  --text-primary: #000;
  --text-secondary: #555;
  --text-muted: #888;
}

.dark .dashboard {
  --accent: #9ca3af;
  --card-bg: #111;
  --card-border: #222;
  --text-primary: #fff;
  --text-secondary: #aaa;
  --text-muted: #666;
}

/* Time Pills */
.time-pills {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
}

.pill {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 50px;
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover {
  color: var(--text-primary);
  background: var(--card-border);
}

.pill.active {
  background: var(--accent);
  color: #fff;
}

/* Loading */
.loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid var(--card-border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
}

/* Hero Card */
.hero-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 24px;
  aspect-ratio: 2.5 / 1;
  min-height: 200px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(60px) saturate(1.5);
  transform: scale(1.5);
  opacity: 0.6;
}

.dark .hero-bg {
  opacity: 0.4;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
}

.dark .hero-content {
  background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%);
}

.hero-label {
  position: absolute;
  top: 20px;
  left: 24px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--accent);
}

.hero-art {
  width: 140px;
  height: 140px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  line-height: 1.2;
}

.hero-artist {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

.hero-album {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

@media (max-width: 640px) {
  .hero-card {
    aspect-ratio: auto;
  }

  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 48px 24px 32px;
  }

  .hero-art {
    width: 120px;
    height: 120px;
  }

  .hero-title {
    font-size: 22px;
  }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 40px;
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.bento-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bento-card.accent {
  background: var(--accent);
}

.bento-card.accent .bento-value,
.bento-card.accent .bento-label {
  color: #fff;
}

.dark .bento-card.accent .bento-value,
.dark .bento-card.accent .bento-label {
  color: #000;
}

.bento-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.bento-label {
  font-size: 13px;
  color: var(--text-muted);
}

/* Section */
.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .artists-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 500px) {
  .artists-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.artist-card {
  text-decoration: none;
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  background: var(--card-bg);
  transition: all 0.2s ease;
}

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
}

.dark .artist-card:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}

.artist-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}

.artist-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-genre {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Tracks List */
.tracks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  transition: background 0.15s ease;
}

.track-row:hover {
  background: var(--card-bg);
}

.track-num {
  width: 24px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-muted);
  text-align: center;
}

.track-art {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.track-duration {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--card-border);
  text-decoration: none;
  transition: all 0.15s ease;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  padding-left: 8px;
}

.history-item:hover .history-name {
  color: var(--accent);
}

.history-art {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}

.history-meta {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-time {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .history-art {
    width: 52px;
    height: 52px;
  }

  .history-name {
    font-size: 15px;
  }

  .history-meta {
    font-size: 13px;
  }
}
</style>
