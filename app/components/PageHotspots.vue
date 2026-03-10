<template>
  <div class="page-hotspots-section" v-if="pageHotspots.length">
    <div class="section-header" @click="$emit('toggleSection')">
      <h2>📄 Popular Pages & Content</h2>
      <div class="header-controls">
        <div v-if="enableComparison && hasComparisonData" class="comparison-badge">
          vs {{ formatDateRange(comparisonStartDate, comparisonEndDate) }}
        </div>
        <span class="material-symbols-outlined expand-icon">
          {{ showHotspots ? 'expand_less' : 'expand_more' }}
        </span>
      </div>
    </div>
    
    <div v-if="showHotspots" class="hotspots-grid">
      <div 
        v-for="(page, index) in topPages" 
        :key="page.pagePath" 
        class="hotspot-card"
        :class="{ 
          expanded: expandedPage === page.pagePath,
          'has-comparison': enableComparison && page.viewsDelta 
        }"
        @click="$emit('toggleExpand', page.pagePath)"
      >
        <div class="hotspot-rank">{{ index + 1 }}</div>
        <div class="hotspot-info">
          <div class="hotspot-title">{{ truncateString(page.pageTitle, 40) || 'Untitled Page' }}</div>
          <div class="hotspot-path">{{ truncateString(page.pagePath, 40) }}</div>
          
          <div class="hotspot-stats">
            <div class="views-stat">
              <span class="stat-label">Views</span>
              <span class="stat-value">{{ formatNumber(page.views) }}</span>
            </div>
            
            <div v-if="enableComparison && getComparisonPage(page)" class="comparison-stat">
              <span class="stat-label">Comparison</span>
              <span class="stat-value">{{ formatNumber(getComparisonPage(page).views) }}</span>
            </div>
            
            <div v-if="enableComparison && page.viewsDelta" class="delta-badge" :class="getDeltaClass(page.viewsDelta)">
              <span class="material-symbols-outlined">
                {{ page.viewsDelta > 0 ? 'trending_up' : page.viewsDelta < 0 ? 'trending_down' : 'trending_flat' }}
              </span>
              {{ formatDelta(page.viewsDelta) }}
            </div>
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
              <span class="expanded-label">Current Views:</span>
              <span class="expanded-value">{{ formatNumber(page.views) }}</span>
            </div>
            
            <div v-if="enableComparison && getComparisonPage(page)" class="expanded-row">
              <span class="expanded-label">Comparison Views:</span>
              <span class="expanded-value">{{ formatNumber(getComparisonPage(page).views) }}</span>
            </div>
            
            <div v-if="enableComparison && page.viewsDelta" class="expanded-row">
              <span class="expanded-label">Change:</span>
              <span class="expanded-value" :class="getDeltaClass(page.viewsDelta)">
                {{ formatDelta(page.viewsDelta) }}
              </span>
            </div>
            
            <div v-if="enableComparison && !getComparisonPage(page)" class="expanded-row">
              <span class="expanded-label">Comparison:</span>
              <span class="expanded-value neutral">No data available</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with totals -->
    <div v-if="showHotspots" class="hotspots-footer">
      <div class="total-stat">
        <span class="total-label">Total Pages Tracked:</span>
        <span class="total-value">{{ formatNumber(pageHotspots.length) }}</span>
      </div>
      <div v-if="enableComparison && hasComparisonData" class="total-stat">
        <span class="total-label">Showing top:</span>
        <span class="total-value">{{ topPages.length }} pages</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHotspots',
  props: {
    pageHotspots: { type: Array, required: true },
    pageHotspotsComparison: { type: Array, default: () => [] },
    topPages: { type: Array, required: true },
    enableComparison: { type: Boolean, default: false },
    showHotspots: { type: Boolean, default: true },
    expandedPage: { type: String, default: null },
    comparisonStartDate: { type: String, default: '' },
    comparisonEndDate: { type: String, default: '' }
  },
  emits: ['toggleSection', 'toggleExpand'],
  computed: {
    hasComparisonData() {
      return this.pageHotspotsComparison && this.pageHotspotsComparison.length > 0
    }
  },
  methods: {
    truncateString(str, maxLength) {
      if (!str) return str
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
    },
    
    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) return '0'
      return new Intl.NumberFormat('en-ZA').format(value)
    },
    
    formatDelta(delta) {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(1)}%`
    },
    
    formatDateRange(start, end) {
      if (!start || !end) return ''
      const startDate = new Date(start).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
      const endDate = new Date(end).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
      return `${startDate} – ${endDate}`
    },
    
    getDeltaClass(delta) {
      if (delta === null || delta === undefined) return 'neutral'
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    },
    
    getComparisonPage(page) {
      if (!this.enableComparison || !this.hasComparisonData) return null
      return this.pageHotspotsComparison.find(p => p.pagePath === page.pagePath)
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
  transition: box-shadow 0.2s ease;
}

.page-hotspots-section:hover {
  box-shadow: var(--shadow-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.comparison-badge {
  font-size: 0.75rem;
  background: #f0f9ff;
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid #bae6fd;
  font-weight: 500;
  white-space: nowrap;
}

.expand-icon {
  color: var(--gray-500);
  transition: transform 0.2s;
}

.section-header:hover .expand-icon {
  color: var(--primary);
}

.hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.hotspot-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  transition: all 0.2s ease;
  min-width: 0;
  cursor: pointer;
  border: 1px solid transparent;
}

.hotspot-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--gray-200);
}

.hotspot-card.expanded {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border: 2px solid var(--primary);
  transform: scale(1.02);
}

.hotspot-card.has-comparison {
  border-left: 4px solid var(--primary);
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
  box-shadow: var(--shadow-sm);
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
  font-size: 0.95rem;
}

.hotspot-path {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-bottom: var(--space-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', monospace;
}

.hotspot-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.views-stat,
.comparison-stat {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  background: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 500;
  text-transform: uppercase;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-800);
}

.delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.7rem;
  white-space: nowrap;
}

.delta-badge .material-symbols-outlined {
  font-size: 0.875rem;
}

.delta-badge.positive {
  background: #d1fae5;
  color: #065f46;
}

.delta-badge.negative {
  background: #fee2e2;
  color: #991b1b;
}

.delta-badge.neutral {
  background: var(--gray-100);
  color: var(--gray-600);
}

.expanded-view {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.2s ease-out;
}

.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-2) 0;
  font-size: 0.875rem;
  gap: var(--space-2);
  border-bottom: 1px dashed var(--gray-100);
}

.expanded-row:last-child {
  border-bottom: none;
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
  white-space: nowrap;
}

.expanded-value {
  font-weight: 600;
  color: var(--gray-800);
  word-break: break-word;
  text-align: right;
  max-width: 60%;
}

.expanded-value.positive { color: var(--success); }
.expanded-value.negative { color: var(--danger); }
.expanded-value.neutral { color: var(--gray-500); }

.hotspots-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.total-stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.total-label {
  color: var(--gray-500);
  font-weight: 500;
}

.total-value {
  font-weight: 600;
  color: var(--gray-800);
  background: var(--gray-100);
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-full);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hotspots-grid {
    grid-template-columns: 1fr;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
  }
  
  .hotspot-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .views-stat,
  .comparison-stat {
    width: 100%;
    justify-content: space-between;
  }
  
  .delta-badge {
    align-self: flex-end;
  }
  
  .hotspots-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .expanded-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .expanded-value {
    text-align: left;
    max-width: 100%;
  }
}
</style>