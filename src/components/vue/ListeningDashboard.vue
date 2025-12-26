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
}

interface Artist {
  name: string;
  url: string;
  image: string;
  genres: string[];
}

interface Stats {
  totalTracks: number;
  totalMinutes: number;
  uniqueArtists: number;
  peakListeningHour: number;
}

interface SpotifyData {
  topArtists: Artist[];
  topTracks: Track[];
  recentTracks: Track[];
  stats: Stats | null;
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
  } catch {
    error.value = 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function changeTimeRange(range: string) {
  timeRange.value = range;
  fetchStats();
}

onMounted(fetchStats);
</script>

<template>
  <div class="dashboard listening-dashboard">
    <!-- Time Range -->
    <div class="pills">
      <button
        v-for="(label, key) in timeRangeLabels"
        :key="key"
        :class="['pill', { active: timeRange === key }]"
        @click="changeTimeRange(key)"
      >{{ label }}</button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchStats">Retry</button>
    </div>

    <template v-else-if="data">
      <!-- Top Tracks -->
      <section v-if="data.topTracks.length" class="section">
        <h2 class="section-title">Top Tracks</h2>
        <div class="tracks">
          <a
            v-for="(track, i) in data.topTracks.slice(0, 10)"
            :key="track.url"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="track"
          >
            <span class="num">{{ i + 1 }}</span>
            <img :src="track.image" :alt="track.name" />
            <div class="info">
              <span class="name">{{ track.name }}</span>
              <span class="artist">{{ track.artist }}</span>
            </div>
            <span class="duration">{{ formatDuration(track.duration) }}</span>
          </a>
        </div>
      </section>

      <!-- Top Artists -->
      <section v-if="data.topArtists.length" class="section">
        <h2 class="section-title">Top Artists</h2>
        <div class="artists">
          <a
            v-for="artist in data.topArtists.slice(0, 6)"
            :key="artist.url"
            :href="artist.url"
            target="_blank"
            rel="noopener noreferrer"
            class="artist-card"
          >
            <img :src="artist.image" :alt="artist.name" />
            <span class="name">{{ artist.name }}</span>
          </a>
        </div>
      </section>

      <!-- Recent -->
      <section class="section">
        <h2 class="section-title">Recent</h2>
        <div class="recent">
          <a
            v-for="track in data.recentTracks.slice(0, 10)"
            :key="track.playedAt"
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="recent-track"
          >
            <img :src="track.image" :alt="track.name" />
            <div class="info">
              <span class="name">{{ track.name }}</span>
              <span class="artist">{{ track.artist }}</span>
            </div>
            <span class="time">{{ formatTime(track.playedAt!) }}</span>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style>
/* Dark mode - non-scoped for proper cascading */
.dark .listening-dashboard {
  --border: rgba(255, 255, 255, 0.08);
  --hover: rgba(255, 255, 255, 0.04);
}

.dark .listening-dashboard .pill.active {
  background: #ffffff;
  border-color: #ffffff;
  color: #000000;
}
</style>

<style scoped>
.dashboard {
  --text: var(--text-primary);
  --muted: var(--text-secondary);
  --border: rgba(0, 0, 0, 0.08);
  --hover: rgba(0, 0, 0, 0.04);
}

.pills {
  display: flex;
  gap: 6px;
  margin-bottom: 2rem;
}

.pill {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: 100px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill:hover {
  color: var(--text);
  border-color: var(--text);
}

.pill.active {
  background: #1c1b19;
  border-color: #1c1b19;
  color: #ffffff;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--text);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 3rem;
  color: var(--muted);
}

.error button {
  margin-top: 1rem;
  padding: 8px 20px;
  background: var(--text);
  color: var(--background);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
}

/* Tracks */
.tracks {
  display: flex;
  flex-direction: column;
}

.track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  text-decoration: none;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

.track:last-child {
  border-bottom: none;
}

.track:hover {
  background: var(--hover);
  margin: 0 -12px;
  padding: 10px 12px;
}

.track .num {
  width: 20px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.track img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.track .info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track .name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track .artist {
  font-size: 13px;
  color: var(--muted);
}

.track .duration {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* Artists */
.artists {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .artists {
    grid-template-columns: repeat(3, 1fr);
  }
}

.artist-card {
  text-decoration: none;
  text-align: center;
}

.artist-card img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.artist-card .name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Recent */
.recent {
  display: flex;
  flex-direction: column;
}

.recent-track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  text-decoration: none;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

.recent-track:last-child {
  border-bottom: none;
}

.recent-track:hover {
  background: var(--hover);
  margin: 0 -12px;
  padding: 10px 12px;
}

.recent-track img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.recent-track .info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-track .name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-track .artist {
  font-size: 13px;
  color: var(--muted);
}

.recent-track .time {
  font-size: 12px;
  color: var(--muted);
}
</style>
