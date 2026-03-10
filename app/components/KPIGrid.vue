<template>
  <div class="kpi-grid">
    <div
      v-for="kpi in kpiData"
      :key="kpi.label"
      class="kpi-card"
      :class="{ 'expanded': expandedKPI === kpi.label }"
      role="button"
      tabindex="0"
      :aria-expanded="expandedKPI === kpi.label"
      @click="$emit('toggleExpand', kpi.label)"
      @keydown.enter="$emit('toggleExpand', kpi.label)"
    >
      <div class="kpi-header">
        <div class="kpi-icon" :style="{ backgroundColor: kpi.color + '12' }">
          <span class="material-symbols-outlined" :style="{ color: kpi.color }">
            {{ kpi.icon }}
          </span>
        </div>
        <span class="kpi-label">{{ kpi.label }}</span>
      </div>

      <div class="kpi-value-container">
        <span class="kpi-value" :title="kpi.rawValue">{{ kpi.value }}</span>
      </div>

      <!-- Comparison section -->
      <div v-if="enableComparison && kpi.comparisonValue" class="comparison-section">
        <div class="comparison-header">
          <span class="comparison-label">Comparison</span>
          <span class="comparison-date" v-if="kpi.comparisonDate">{{ kpi.comparisonDate }}</span>
        </div>
        
        <div class="comparison-content">
          <div class="comparison-value-group">
            <span class="comparison-value" :title="kpi.rawComparison">
              {{ kpi.comparisonValue }}
            </span>
          </div>
          
          <div class="delta-group" :class="getDeltaClass(kpi.delta)">
            <span class="material-symbols-outlined delta-icon">
              {{ kpi.delta > 0 ? 'arrow_upward' : kpi.delta < 0 ? 'arrow_downward' : 'remove' }}
            </span>
            <span class="delta-value">{{ formatDelta(kpi.delta) }}</span>
          </div>
        </div>
      </div>

      <!-- Expanded view -->
      <div v-if="expandedKPI === kpi.label" class="expanded-view">
        <div class="expanded-row">
          <span class="expanded-label">Current (raw)</span>
          <span class="expanded-value">{{ kpi.rawValue }}</span>
        </div>
        <div v-if="enableComparison && kpi.rawComparison" class="expanded-row">
          <span class="expanded-label">Comparison (raw)</span>
          <span class="expanded-value">{{ kpi.rawComparison }}</span>
        </div>
        <div class="expanded-hint">
          <!-- <span class="material-symbols-outlined">click</span> -->
          <span>Click to collapse</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KPIGrid',
  props: {
    kpiData: {
      type: Array,
      required: true,
      validator: (value) => {
        if (!Array.isArray(value)) return false
        const labels = value.map(kpi => kpi.label)
        const uniqueLabels = new Set(labels)
        if (labels.length !== uniqueLabels.size) {
          console.warn('KPIGrid: kpiData should have unique labels for expand/collapse to work correctly')
        }
        return true
      }
    },
    enableComparison: {
      type: Boolean,
      default: false
    },
    expandedKPI: {
      type: String,
      default: null
    }
  },
  emits: ['toggleExpand'],
  methods: {
    getDeltaClass(delta) {
      if (delta === null || delta === undefined) return 'neutral'
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
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.kpi-card {
  background: white;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: var(--space-4);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #f2f2f2;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02);
  border-color: #e8e8e8;
}

.kpi-card.expanded {
  background: linear-gradient(135deg, #ffffff, #fafafa);
  border: 2px solid var(--primary);
  box-shadow: 0 12px 20px rgba(59, 130, 246, 0.06);
  transform: scale(1.01);
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon .material-symbols-outlined {
  font-size: 20px;
}

.kpi-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-600);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value-container {
  margin-top: -2px;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
  letter-spacing: -0.02em;
  white-space: normal;
  word-break: break-word;
  cursor: help;
  border-bottom: 1px dotted transparent;
  transition: border-color 0.2s;
}

.kpi-value:hover {
  border-bottom-color: var(--gray-300);
}

/* Comparison section */
.comparison-section {
  background: #f8f9fc;
  border-radius: 14px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comparison-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.comparison-date {
  font-size: 0.65rem;
  color: var(--gray-400);
  font-weight: 400;
}

.comparison-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.comparison-value-group {
  flex: 1;
}

.comparison-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gray-800);
  white-space: normal;
  word-break: break-word;
  cursor: help;
  border-bottom: 1px dotted transparent;
  transition: border-color 0.2s;
}

.comparison-value:hover {
  border-bottom-color: var(--gray-400);
}

.delta-group {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
  height: 28px;
}

.delta-group.positive {
  background: #e6f7ec;
  color: #0b5e42;
}

.delta-group.negative {
  background: #fee9e7;
  color: #b34033;
}

.delta-group.neutral {
  background: #f0f0f0;
  color: #666666;
}

.delta-icon {
  font-size: 0.9rem;
  font-weight: 400;
}

.delta-value {
  font-weight: 600;
}

/* Expanded view */
.expanded-view {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid #edf2f7;
  animation: slideDown 0.2s ease-out;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: var(--space-1) 0;
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
}

.expanded-value {
  font-weight: 600;
  color: var(--gray-800);
  font-family: 'Inter', monospace;
  word-break: break-word;
  text-align: right;
  max-width: 60%;
  font-size: 0.85rem;
}

.expanded-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--gray-400);
  font-size: 0.7rem;
  margin-top: var(--space-1);
  padding-top: var(--space-2);
  border-top: 1px dashed #e8e8e8;
}

.expanded-hint .material-symbols-outlined {
  font-size: 0.9rem;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .kpi-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  
  .kpi-card {
    padding: var(--space-3);
  }
  
  .kpi-value {
    font-size: 1.5rem;
  }
  
  .comparison-value {
    font-size: 1rem;
  }
  
  .comparison-content {
    flex-wrap: wrap;
  }
  
  .delta-group {
    padding: 2px 6px;
  }
  
  .expanded-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .expanded-value {
    text-align: left;
    max-width: 100%;
  }
}
</style>