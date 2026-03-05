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
      <div class="kpi-icon" :style="{ backgroundColor: kpi.color + '20' }">
        <span class="material-symbols-outlined" :style="{ color: kpi.color }">
          {{ kpi.icon }}
        </span>
      </div>

      <div class="kpi-info">
        <span class="kpi-label">{{ kpi.label }}</span>
        <span class="kpi-value" :title="kpi.value">{{ kpi.value }}</span>

        <!-- Comparison values -->
        <div
          v-if="enableComparison && kpi.comparisonValue !== null && kpi.comparisonValue !== undefined"
          class="comparison-values"
        >
          <span class="comparison-label">Previous:</span>
          <span class="comparison-value" :title="kpi.comparisonValue">
            {{ kpi.comparisonValue }}
          </span>
          <span class="delta-badge" :class="getDeltaClass(kpi.delta)">
            <span v-if="kpi.delta > 0">↑</span>
            <span v-else-if="kpi.delta < 0">↓</span>
            {{ formatDelta(kpi.delta) }}
          </span>
        </div>

        <!-- Expanded view -->
        <div v-if="expandedKPI === kpi.label" class="expanded-view">
          <div class="expanded-row">
            <span class="expanded-label">Raw Value:</span>
            <span class="expanded-value">{{ kpi.rawValue }}</span>
          </div>
          <div
            v-if="enableComparison && kpi.rawComparison !== null && kpi.rawComparison !== undefined"
            class="expanded-row"
          >
            <span class="expanded-label">Raw Previous:</span>
            <span class="expanded-value">{{ kpi.rawComparison }}</span>
          </div>
          <div class="expanded-row">
            <span class="expanded-label hint">
              {{ expandedKPI === kpi.label ? '↓ Click to collapse' : '↑ Click to expand' }}
            </span>
          </div>
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.kpi-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-5);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 0;
  border: 2px solid transparent;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--gray-200);
}

.kpi-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
  box-shadow: var(--shadow-lg);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon .material-symbols-outlined {
  font-size: 22px;
}

.kpi-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.kpi-label {
  display: block;
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-bottom: var(--space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kpi-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
  overflow: visible;
  text-overflow: clip;
  max-width: 100%;
  cursor: help;
  border-bottom: 1px dotted transparent;
  transition: border-color 0.2s;
}

.kpi-value:hover {
  border-bottom-color: var(--gray-400);
}

.comparison-values {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: 0.75rem;
  margin-top: var(--space-1);
  background: var(--gray-50);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  width: 100%;
}

.comparison-label {
  color: var(--gray-500);
  font-weight: 500;
  white-space: nowrap;
}

.comparison-value {
  font-weight: 600;
  color: var(--gray-700);
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  text-overflow: clip;
  max-width: none;
  flex: 1;
  text-align: right;
  cursor: help;
  border-bottom: 1px dotted transparent;
}

.comparison-value:hover {
  border-bottom-color: var(--gray-400);
}

.delta-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.7rem;
  text-align: center;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 45px;
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
  background: var(--gray-200);
  color: var(--gray-600);
}

.expanded-view {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-300);
  animation: slideDown 0.2s ease-out;
  width: 100%;
}

.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-1) 0;
  font-size: 0.875rem;
  gap: var(--space-2);
  width: 100%;
}

.expanded-row:last-child {
  padding-bottom: 0;
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.expanded-label.hint {
  color: var(--gray-400);
  font-style: italic;
  font-size: 0.75rem;
  text-align: center;
  width: 100%;
}

.expanded-value {
  font-family: 'Inter', monospace;
  font-weight: 600;
  color: var(--gray-800);
  word-break: break-word;
  text-align: right;
  flex: 1;
  margin-left: var(--space-2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .kpi-value {
    font-size: 1.4rem;
  }
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .kpi-value {
    font-size: 1.3rem;
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .kpi-card {
    padding: var(--space-4);
  }
  
  .kpi-value {
    font-size: 1.25rem;
  }
  
  .comparison-values {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .comparison-value {
    text-align: left;
    width: 100%;
  }
  
  .delta-badge {
    align-self: flex-end;
  }
  
  .expanded-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
  
  .expanded-value {
    margin-left: 0;
    text-align: left;
    width: 100%;
  }
}
</style>