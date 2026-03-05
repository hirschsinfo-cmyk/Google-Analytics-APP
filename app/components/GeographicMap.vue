<template>
  <div class="map-section">
    <div class="section-header">
      <h2>Geographic Performance – South Africa</h2>
      <div class="map-controls">
        <!-- Metric Selector -->
        <select
          :value="mapMetric"
          @change="$emit('update:mapMetric', $event.target.value)"
          class="map-select"
          aria-label="Select map metric"
        >
          <option v-for="metric in metrics" :key="metric.value" :value="metric.value">
            {{ metric.label }}
          </option>
        </select>

        <!-- View Toggle -->
        <div v-if="enableComparison" class="map-view-toggle">
          <button
            v-for="view in views"
            :key="view.value"
            :class="{ active: mapView === view.value }"
            @click="$emit('update:mapView', view.value)"
            :aria-label="view.aria"
          >
            {{ view.label }}
          </button>
        </div>

        <!-- Legend -->
        <div class="map-legend">
          <!-- Legend matches delta-based coloring -->
          <span class="legend-item positive">Positive Change</span>
          <span class="legend-item neutral">Stable</span>
          <span class="legend-item negative">Negative Change</span>
        </div>
      </div>
    </div>

    <!-- Map -->
    <div class="map-container">
      <div ref="mapElement" class="leaflet-map"></div>

      <!-- City Markers Panel -->
      <div v-if="saCities.length > 0" class="city-markers-panel">
        <h4>Top Cities</h4>
        <div class="city-list">
          <div
            v-for="city in saCities.slice(0, 5)"
            :key="city.name"
            class="city-marker-item clickable"
            :class="{ expanded: expandedCity === city.name }"
            @click="$emit('toggleExpand', city.name)"
            @mouseenter="panToCity(city)"
            @mouseleave="$emit('resetHighlight')"
          >
            <span class="city-dot" :style="{ backgroundColor: getCityColor(city) }"></span>
            <span class="city-name">{{ city.name }}</span>

            <div class="city-values">
              <span class="city-value current">{{ formatCityValue(city, 'current') }}</span>
              <span v-if="enableComparison" class="city-value comparison">
                (prev: {{ formatCityValue(city, 'comparison') }})
              </span>
              <span v-if="enableComparison" class="city-delta" :class="getDeltaClass(city.delta)">
                {{ formatDelta(city.delta) }}
              </span>
            </div>

            <!-- Expanded view -->
            <div v-if="expandedCity === city.name" class="expanded-view city-expanded">
              <div v-for="detail in cityDetails" :key="detail.key" class="expanded-row">
                <span class="expanded-label">{{ detail.label }}:</span>
                <span class="expanded-value">
                  {{ detail.key === 'revenue'
                    ? formatCityValue(city, 'current')
                    : Number(city[detail.key] || 0).toFixed(2) }}{{ detail.suffix || '' }}
                </span>
              </div>
              <div v-if="enableComparison" class="expanded-row">
                <span class="expanded-label">Prev Revenue:</span>
                <span class="expanded-value">{{ formatCityValue(city, 'comparison') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'MapSection',
  props: {
    saCities: { type: Array, default: () => [] },
    mapMetric: { type: String, default: 'revenue' },
    mapView: { type: String, default: 'current' },
    enableComparison: { type: Boolean, default: false },
    expandedCity: { type: String, default: null }
  },
  emits: ['update:mapMetric', 'update:mapView', 'toggleExpand', 'resetHighlight'],
  setup(props) {
    const mapElement = ref(null)
    let mapInstance = null
    let markers = []

    const metrics = [
      { value: 'revenue', label: 'Revenue (ZAR)' },
      { value: 'transactions', label: 'Transactions' },
      { value: 'sessions', label: 'Sessions' },
      { value: 'conversionRate', label: 'Conversion Rate' },
      { value: 'conversions', label: 'Conversions' }
    ]

    const views = [
      { value: 'current', label: 'Current', aria: 'Show current view' },
      { value: 'comparison', label: 'Previous', aria: 'Show previous view' },
      { value: 'delta', label: 'Change %', aria: 'Show change percentage' }
    ]

    const cityDetails = [
      { key: 'revenue', label: 'Revenue' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'sessions', label: 'Sessions' },
      { key: 'conversionRate', label: 'Conv. Rate', suffix: '%' }
    ]

    const formatCityValue = (city, type) => {
      let value = null
      if (type === 'current') value = city[props.mapMetric]
      if (type === 'comparison') value = city[`${props.mapMetric}Comparison`]

      if (value === null || value === undefined || isNaN(value)) return '—'

      if (props.mapMetric === 'revenue') {
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value)
      }

      return Number(value).toFixed(2)
    }

    const formatDelta = (delta) => {
      if (delta === null || delta === undefined || isNaN(delta)) return '—'
      const sign = delta > 0 ? '+' : ''
      return `${sign}${Math.abs(delta).toFixed(2)}%`
    }

    const getDeltaClass = (delta) => {
      if (delta > 0) return 'positive'
      if (delta < 0) return 'negative'
      return 'neutral'
    }

    /**
     * getCityColor:
     * Colors represent change (delta) in performance.
     * - Green (#10b981): Positive change (delta > 10%)
     * - Red (#ef4444): Negative change (delta < -10%)
     * - Orange (#f59e0b): Stable or small change (-10% <= delta <= 10%)
     */
    const getCityColor = (city) => {
      const delta = city.delta || 0
      if (delta > 10) return '#10b981'   // positive change
      if (delta < -10) return '#ef4444'  // negative change
      return '#f59e0b'                   // stable
    }

    const panToCity = (city) => {
      if (mapInstance && city.lat && city.lng) {
        mapInstance.setView([city.lat, city.lng], 8)
      }
    }

    onMounted(async () => {
      const L = await import('leaflet') // Lazy import avoids SSR errors
      if (mapElement.value) {
        mapInstance = L.map(mapElement.value).setView([-30.5595, 22.9375], 6)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance)

        markers = props.saCities.map(city => {
          if (city.lat && city.lng) {
            const marker = L.circleMarker([city.lat, city.lng], {
              radius: 6,
              color: getCityColor(city),
              fillColor: getCityColor(city),
              fillOpacity: 0.8
            }).addTo(mapInstance)
            marker.bindPopup(`${city.name}: ${formatCityValue(city, 'current')}`)
            return marker
          }
          return null
        }).filter(Boolean)
      }
    })

    onBeforeUnmount(() => {
      if (mapInstance) {
        mapInstance.remove()
        mapInstance = null
      }
      markers = []
    })

    return {
      mapElement,
      metrics,
      views,
      cityDetails,
      formatCityValue,
      formatDelta,
      getDeltaClass,
      getCityColor,
      panToCity
    }
  }
}
</script>

<style scoped>
/* --- Section Layout --- */
.map-section {
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
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

/* --- Controls --- */
.map-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}
.map-select {
  padding: var(--space-2);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-600);
  background: white;
  cursor: pointer;
}
.map-view-toggle {
  display: flex;
  gap: var(--space-1);
  background: var(--gray-100);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}
.map-view-toggle button {
  padding: 0.375rem var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}
.map-view-toggle button.active {
  background: white;
  color: var(--gray-800);
  box-shadow: var(--shadow-sm);
}
.map-legend {
  display: flex;
  gap: var(--space-4);
  font-size: 0.75rem;
}
.legend-item {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 600;
}
.legend-item.positive { background: #10b981; color: white; } /* green */
.legend-item.neutral { background: #f59e0b; color: white; }  /* orange */
.legend-item.negative { background: #ef4444; color: white; } /* red */

/* --- Map + Panel --- */
.map-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-4);
  height: 500px;
}
.leaflet-map {
  height: 100%;
  width: 100%;
  border-radius: var(--radius-xl);
  background: #f8fafc;
  z-index: 1;
}
.city-markers-panel {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  overflow-y: auto;
}
.city-markers-panel h4 {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--gray-200);
}
.city-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* --- City Items --- */
.city-marker-item {
  display: flex;
  flex-direction: column; /* allow dropdown expansion */
  gap: var(--space-2);
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.city-marker-item.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
}
.city-marker-item:hover {
  border-color: var(--primary);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.city-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.city-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.city-values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}
.city-value {
  font-size: 0.75rem;
  color: var(--gray-500);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.city-value.current { font-weight: 600; color: var(--gray-800); }
.city-value.comparison { font-size: 0.7rem; color: var(--gray-400); }

.city-delta {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  white-space: nowrap;
}
.city-delta.positive { background: #d1fae5; color: #065f46; } /* green badge */
.city-delta.negative { background: #fee2e2; color: #991b1b; } /* red badge */
.city-delta.neutral { background: var(--gray-100); color: var(--gray-600); } /* neutral badge */

/* --- Expansion Panel --- */
.city-expanded {
  width: 100%;
  margin-top: var(--space-3);
  background: white;
  border: 2px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-lg);
  animation: slideDown 0.2s ease-out;
}
.expanded-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  font-size: 0.875rem;
}
.expanded-label { color: var(--gray-500); font-weight: 500; }
.expanded-value {
  font-family: 'Inter', monospace;
  font-weight: 600;
  color: var(--gray-800);
  text-align: right;
  word-break: break-word;
}

/* --- Animations --- */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Map Popup --- */
.map-popup {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  line-height: 1.6;
  min-width: 180px;
}
.map-popup strong {
  color: var(--gray-800);
  display: block;
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
}

/* --- Responsive --- */
@media (max-width: 1200px) {
  .map-container { grid-template-columns: 1fr; height: auto; }
  .city-markers-panel { max-height: 300px; }
}
@media (max-width: 1024px) {
  .map-controls { flex-direction: column; align-items: flex-start; }
}
</style>