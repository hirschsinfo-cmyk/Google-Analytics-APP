<template>
  <div class="engagement-section" v-if="engagementData.length">
    <!-- Header -->
    <div class="engagement-header">
      <h2>Device Engagement Overview</h2>
    </div>

    <!-- Engagement Grid -->
    <div class="engagement-grid">
      <div
        v-for="item in engagementData"
        :key="item.deviceCategory"
        class="engagement-card clickable"
        :class="{ expanded: expandedEngagement === item.deviceCategory }"
        @click="$emit('toggleExpand', item.deviceCategory)"
      >
        <!-- Device Badge -->
        <div class="engagement-type">
          <span class="device-type-badge" :class="item.deviceCategory?.toLowerCase()">
            {{ item.deviceCategory || 'Unknown' }}
          </span>
        </div>

        <!-- Stats -->
        <div class="engagement-stats">
          <div class="stat-item" v-for="stat in statsConfig" :key="stat.key">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.format(item[stat.key]) }}</span>
            <span
              v-if="enableComparison"
              class="stat-delta"
              :class="getDeltaClass(item[stat.deltaKey])"
            >
              {{ formatDelta(item[stat.deltaKey]) }}
            </span>
          </div>
        </div>

        <!-- Expanded View -->
        <div v-if="expandedEngagement === item.deviceCategory" class="expanded-view">
          <div class="expanded-row" v-for="stat in statsConfig" :key="stat.key">
            <span class="expanded-label">{{ stat.label }}:</span>
            <span class="expanded-value">{{ item[stat.key] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EngagementSection',
  props: {
    engagementData: { type: Array, required: true },
    enableComparison: { type: Boolean, default: false },
    expandedEngagement: { type: String, default: null }
  },
  emits: ['toggleExpand'],
  computed: {
    // 🔹 Config-driven stats for reuse
    statsConfig() {
      return [
        { key: 'sessions', label: 'Sessions', deltaKey: 'sessionsDelta', format: this.formatNumber },
        { key: 'newUsers', label: 'New Users', deltaKey: 'newUsersDelta', format: this.formatNumber },
        { key: 'activeUsers', label: 'Active Users', deltaKey: 'activeUsersDelta', format: this.formatNumber },
        { key: 'avgSessionDuration', label: 'Avg Session', deltaKey: 'durationDelta', format: this.formatDuration },
        { key: 'engagedSessions', label: 'Engaged', deltaKey: 'engagedSessionsDelta', format: this.formatNumber }
      ]
    }
  },
  methods: {
    // 🔹 Formatting helpers
    formatNumber(value) {
      return value && !isNaN(value) ? new Intl.NumberFormat('en-ZA').format(value) : '0'
    },
    formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '0s'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    },
    formatDelta(delta) {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    },
    getDeltaClass(delta) {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }
  }
}
</script>

<style scoped>
.engagement-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
}

.engagement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.engagement-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.engagement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-4);
}

.engagement-card {
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.2s ease;
}
.engagement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.engagement-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.device-type-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}
.device-type-badge.mobile { background: #dbeafe; color: #1e40af; }
.device-type-badge.desktop { background: #dcfce7; color: #166534; }
.device-type-badge.tablet { background: #fef3c7; color: #92400e; }

.engagement-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.stat-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}
.stat-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
  width: fit-content;
}
.stat-delta.positive { background: #d1fae5; color: #065f46; }
.stat-delta.negative { background: #fee2e2; color: #991b1b; }
.stat-delta.neutral { background: var(--gray-100); color: var(--gray-600); }

.expanded-view {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.2s ease-out;
}
.expanded-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: var(--space-1) 0;
}
.expanded-label { color: var(--gray-500); font-weight: 500; }
.expanded-value { font-weight: 600; color: var(--gray-800); text-align: right; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>