<template>
  <div class="page-hotspots-section" v-if="pageHotspots.length">
    <div class="section-header" @click="$emit('toggleSection')">
      <h2>Popular Pages & Content</h2>
      <span class="material-symbols-outlined expand-icon">
        {{ showHotspots ? 'expand_less' : 'expand_more' }}
      </span>
    </div>
    
    <div v-if="showHotspots" class="hotspots-grid">
      <div 
        v-for="(page, index) in topPages" 
        :key="page.pagePath" 
        class="hotspot-card clickable"
        :class="{ expanded: expandedPage === page.pagePath }"
        @click="$emit('toggleExpand', page.pagePath)"
      >
        <div class="hotspot-rank">{{ index + 1 }}</div>
        <div class="hotspot-info">
          <div class="hotspot-title">{{ truncateString(page.pageTitle, 40) || 'Untitled Page' }}</div>
          <div class="hotspot-path">{{ truncateString(page.pagePath, 40) }}</div>
          <div class="hotspot-stats">
            <span class="hotspot-views">{{ formatNumber(page.views) }} views</span>
            <span v-if="enableComparison && page.viewsDelta" class="hotspot-delta" :class="getDeltaClass(page.viewsDelta)">
              {{ formatDelta(page.viewsDelta) }}
            </span>
          </div>
          
          <!-- Expanded view -->
          <div v-if="expandedPage === page.pagePath" class="expanded-view">
            <div class="expanded-row">
              <span class="expanded-label">Full Title:</span>
              <span class="expanded-value">{{ page.pageTitle || 'Untitled' }}</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Full Path:</span>
              <span class="expanded-value">{{ page.pagePath }}</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Raw Views:</span>
              <span class="expanded-value">{{ page.views }}</span>
            </div>
            <div v-if="enableComparison && page.viewsDelta" class="expanded-row">
              <span class="expanded-label">Views Change:</span>
              <span class="expanded-value">{{ page.viewsDelta }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHotspots',
  props: {
    pageHotspots: { type: Array, required: true },
    topPages: { type: Array, required: true },
    enableComparison: { type: Boolean, default: false },
    showHotspots: { type: Boolean, default: true },
    expandedPage: { type: String, default: null }
  },
  emits: ['toggleSection', 'toggleExpand'],
  methods: {
    truncateString(str, maxLength) {
      if (!str) return str
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
    },
    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) return '0'
      return new Intl.NumberFormat('en-ZA').format(value)
    },
    getDeltaClass(delta) {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    },
    formatDelta(delta) {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    }
  }
}
</script>

<style scoped>
.page-hotspots-section {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  cursor: pointer;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.expand-icon {
  color: var(--gray-500);
}

.hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.hotspot-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  transition: transform 0.2s;
  min-width: 0;
  position: relative;
  cursor: pointer;
}

.hotspot-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.hotspot-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}

.hotspot-rank {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.hotspot-info {
  flex: 1;
  min-width: 0;
}

.hotspot-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-path {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotspot-stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hotspot-views {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  white-space: nowrap;
}

.hotspot-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

.hotspot-delta.positive { background: #d1fae5; color: #065f46; }
.hotspot-delta.negative { background: #fee2e2; color: #991b1b; }
.hotspot-delta.neutral { background: var(--gray-100); color: var(--gray-600); }

.expanded-view {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.2s ease-out;
}

.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
  font-size: 0.875rem;
  gap: var(--space-2);
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
}

.expanded-value {
  font-family: 'Inter', monospace;
  font-weight: 600;
  color: var(--gray-800);
  word-break: break-all;
  text-align: right;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .hotspots-grid {
    grid-template-columns: 1fr;
  }
}
</style>