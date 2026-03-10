<template>
  <div class="event-section">
    <!-- Section Header -->
    <div class="section-header" @click="toggleExpand">
      <h2>📊 Event Breakdown</h2>
      <div class="header-controls">
        <!-- Comparison Toggle -->
        <div v-if="hasComparisonData" class="comparison-toggle">
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              :checked="showComparison" 
              @change="toggleComparison" 
            />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Show Comparison</span>
          </label>
        </div>
        <div v-else-if="enableComparison" class="no-comparison-badge">
          No comparison data
        </div>

        <!-- Collapsed Summary -->
        <span v-if="!expanded" class="event-summary">
          {{ events.length }} types · {{ formatNumber(totalEvents) }} total
        </span>
        <span class="material-symbols-outlined expand-icon">
          {{ expanded ? 'expand_less' : 'expand_more' }}
        </span>
      </div>
    </div>

    <!-- Comparison Period Info -->
    <div v-if="expanded && showComparison && comparisonEvents.length" class="comparison-info">
      <span class="comparison-badge">Comparison Period</span>
      <span class="comparison-dates">
        {{ formatDate(comparisonStartDate) }} – {{ formatDate(comparisonEndDate) }}
      </span>
      <span class="comparison-total">
        Total: {{ formatNumber(comparisonTotalEvents) }}
      </span>
      <span class="comparison-delta" :class="getDeltaClass(totalDelta)">
        {{ formatDelta(totalDelta) }}
      </span>
    </div>

    <!-- Expanded Content -->
    <div v-if="expanded" class="event-content">
      <!-- Controls -->
      <div class="event-controls">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search events..." 
            class="search-input" 
          />
        </div>

        <div class="sort-controls">
          <select v-model="sortBy" class="sort-select">
            <option value="count">Sort by Count</option>
            <option value="name">Sort by Name</option>
            <option value="percentage">Sort by Share</option>
            <option v-if="showComparison" value="delta">Sort by Change</option>
          </select>
          <button @click="sortDesc = !sortDesc" class="sort-direction-btn">
            <span class="material-symbols-outlined">
              {{ sortDesc ? 'expand_more' : 'expand_less' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Events Grid -->
      <div class="events-grid">
        <div
          v-for="event in paginatedEvents"
          :key="event.eventName"
          class="event-card"
          :class="{ 
            expanded: expandedEvent === event.eventName, 
            'has-comparison': showComparison && getComparisonEvent(event) 
          }"
        >
          <!-- Header -->
          <div class="event-header" @click="toggleEventExpand(event.eventName)">
            <h3 class="event-name">{{ formatEventName(event.eventName) }}</h3>
            <span class="event-percentage">{{ event.percentage }}%</span>
          </div>

          <!-- Stats -->
          <div class="event-stats" @click="toggleEventExpand(event.eventName)">
            <div class="stat-item">
              <span class="stat-label">Current Count</span>
              <span class="stat-value">{{ formatNumber(event.eventCount) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Share</span>
              <span class="stat-value">{{ event.percentage }}%</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-container" @click="toggleEventExpand(event.eventName)">
            <div 
              class="progress-bar" 
              :style="{ width: event.percentage + '%' }" 
              :class="getEventClass(event.eventName)"
            ></div>
            <div
              v-if="showComparison && getComparisonEvent(event)"
              class="progress-bar comparison"
              :style="{ width: getComparisonEvent(event).percentage + '%' }"
              :class="getEventClass(event.eventName)"
            ></div>
          </div>

          <!-- Comparison Stats -->
          <div v-if="showComparison" class="comparison-stats" @click="toggleEventExpand(event.eventName)">
            <template v-if="getComparisonEvent(event)">
              <div class="comparison-item">
                <span class="comparison-label">Comparison Count:</span>
                <span class="comparison-value">{{ formatNumber(getComparisonEvent(event).eventCount) }}</span>
                <span class="delta-badge" :class="getDeltaClass(getEventDelta(event))">
                  {{ formatDelta(getEventDelta(event)) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Comparison Share:</span>
                <span class="comparison-value">{{ getComparisonEvent(event).percentage }}%</span>
              </div>
            </template>
            <div v-else class="no-comparison">
              <span>No data in comparison period</span>
            </div>
          </div>

          <!-- Expanded View -->
          <div v-if="expandedEvent === event.eventName" class="expanded-view">
            <div class="expanded-row">
              <span class="expanded-label">Event Key:</span>
              <span class="expanded-value">{{ event.eventName }}</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Raw Count:</span>
              <span class="expanded-value">{{ formatNumber(event.eventCount) }}</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Percentage:</span>
              <span class="expanded-value">{{ event.percentage }}%</span>
            </div>
            <div v-if="showComparison && getComparisonEvent(event)" class="expanded-row">
              <span class="expanded-label">Comparison Count:</span>
              <span class="expanded-value">{{ formatNumber(getComparisonEvent(event).eventCount) }}</span>
            </div>
            <div v-if="showComparison && getComparisonEvent(event)" class="expanded-row">
              <span class="expanded-label">Comparison %:</span>
              <span class="expanded-value">{{ getComparisonEvent(event).percentage }}%</span>
            </div>
            <div v-if="showComparison && getComparisonEvent(event)" class="expanded-row">
              <span class="expanded-label">Change:</span>
              <span class="expanded-value" :class="getDeltaClass(getEventDelta(event))">
                {{ formatDelta(getEventDelta(event)) }}
              </span>
            </div>
            <div v-if="showComparison && !getComparisonEvent(event)" class="expanded-row">
              <span class="expanded-label">Comparison:</span>
              <span class="expanded-value neutral">No data available</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button @click="currentPage--" :disabled="currentPage === 1" class="pagination-btn">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="pagination-btn">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- Footer -->
      <div class="event-footer">
        <div class="total-events">
          <span class="total-label">Current Total:</span>
          <span class="total-value">{{ formatNumber(totalEvents) }}</span>
        </div>
        <div v-if="showComparison" class="total-events comparison">
          <span class="total-label">Comparison Total:</span>
          <span class="total-value">{{ formatNumber(comparisonTotalEvents) }}</span>
          <span class="footer-delta" :class="getDeltaClass(totalDelta)">
            {{ formatDelta(totalDelta) }}
          </span>
        </div>
        <div class="unique-events">
          <span class="unique-label">Event Types:</span>
          <span class="unique-value">{{ events.length }}</span>
        </div>
      </div>
    </div>

    <!-- Collapsed Summary -->
    <div v-else class="event-summary-collapsed">
      <div class="summary-stats">
        <div class="summary-stat">
          <span class="summary-label">Total Events</span>
          <span class="summary-value">{{ formatNumber(totalEvents) }}</span>
          <span v-if="showComparison && comparisonTotalEvents" class="summary-delta" :class="getDeltaClass(totalDelta)">
            {{ formatDelta(totalDelta) }}
          </span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Event Types</span>
          <span class="summary-value">{{ events.length }}</span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Top Event</span>
          <span class="summary-value">{{ topEventName }}</span>
        </div>
        <div v-if="showComparison && hasComparisonData" class="summary-stat">
          <span class="summary-label">vs Comparison</span>
          <span class="summary-value" :class="getDeltaClass(totalDelta)">
            {{ formatDelta(totalDelta) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'EventBreakdown',

  props: {
    events: {
      type: Array,
      required: true,
      validator: value =>
        value.every(item =>
          item.eventName !== undefined &&
          item.eventCount !== undefined &&
          item.percentage !== undefined
        )
    },
    comparisonEvents: { type: Array, default: () => [] },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: null },
    comparisonEndDate: { type: String, default: null },
    loading: { type: Boolean, default: false },
    itemsPerPage: { type: Number, default: 12 }
  },

  setup(props) {
    // ==================== STATE ====================
    const expanded = ref(true)
    const expandedEvent = ref(null)
    const searchQuery = ref('')
    const sortBy = ref('count')
    const sortDesc = ref(true)
    const currentPage = ref(1)
    const showComparison = ref(false)

    // ==================== COMPUTED ====================
    const hasComparisonData = computed(() => props.comparisonEvents.length > 0)

    const totalEvents = computed(() =>
      props.events.reduce((sum, e) => sum + e.eventCount, 0)
    )

    const comparisonTotalEvents = computed(() =>
      showComparison.value && hasComparisonData.value
        ? props.comparisonEvents.reduce((sum, e) => sum + e.eventCount, 0)
        : 0
    )

    const totalDelta = computed(() => {
      if (!showComparison.value || !hasComparisonData.value) return null
      return calculateDelta(totalEvents.value, comparisonTotalEvents.value)
    })

    const filteredEvents = computed(() => {
      if (!searchQuery.value) return props.events
      const query = searchQuery.value.toLowerCase()
      return props.events.filter(e => e.eventName.toLowerCase().includes(query))
    })

    const sortedFilteredEvents = computed(() => {
      const events = [...filteredEvents.value]
      const sorters = {
        count: (a, b) => b.eventCount - a.eventCount,
        percentage: (a, b) => b.percentage - a.percentage,
        name: (a, b) => a.eventName.localeCompare(b.eventName),
        delta: (a, b) => {
          const deltaA = getEventDelta(a) || 0
          const deltaB = getEventDelta(b) || 0
          return deltaB - deltaA
        }
      }
      const sorter = sorters[sortBy.value]
      if (sorter) events.sort(sorter)
      if (!sortDesc.value) events.reverse()
      return events
    })

    const paginatedEvents = computed(() => {
      const start = (currentPage.value - 1) * props.itemsPerPage
      return sortedFilteredEvents.value.slice(start, start + props.itemsPerPage)
    })

    const totalPages = computed(() =>
      Math.ceil(sortedFilteredEvents.value.length / props.itemsPerPage)
    )

    const topEventName = computed(() => {
      if (!props.events.length) return 'None'
      const top = props.events.reduce((max, e) =>
        e.eventCount > max.eventCount ? e : max
      )
      return formatEventName(top.eventName)
    })

    // ==================== UTILITIES ====================
    const formatNumber = v => new Intl.NumberFormat('en-ZA').format(v || 0)
    
    const formatDate = d => d 
      ? new Date(d).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) 
      : ''
    
    const formatEventName = n => n 
      ? n.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') 
      : '—'
    
    const formatDelta = d => d == null || isNaN(d) ? '—' : `${d > 0 ? '+' : ''}${Math.abs(d).toFixed(1)}%`
    
    const getDeltaClass = d => d > 0 ? 'positive' : d < 0 ? 'negative' : 'neutral'
    
    const calculateDelta = (cur, prev) => (!prev || prev === 0 || !cur) ? null : ((cur - prev) / prev) * 100

    const getEventClass = n => {
      const name = n.toLowerCase()
      if (name.includes('purchase') || name.includes('order')) return 'purchase-event'
      if (name.includes('cart')) return 'cart-event'
      if (name.includes('view') || name.includes('page')) return 'view-event'
      if (name.includes('click')) return 'click-event'
      return 'default-event'
    }

    const getComparisonEvent = e =>
      showComparison.value ? props.comparisonEvents.find(c => c.eventName === e.eventName) : null

    const getEventDelta = e => {
      const comp = getComparisonEvent(e)
      return comp ? calculateDelta(e.eventCount, comp.eventCount) : null
    }

    // ==================== ACTIONS ====================
    const toggleExpand = () => {
      expanded.value = !expanded.value
      if (!expanded.value) expandedEvent.value = null
    }

    const toggleEventExpand = name => {
      expandedEvent.value = expandedEvent.value === name ? null : name
    }

    const toggleComparison = () => { 
      showComparison.value = !showComparison.value 
    }

    // ==================== WATCHERS ====================
    watch([searchQuery, sortBy, sortDesc, showComparison], () => { 
      currentPage.value = 1 
    })

    watch(() => props.enableComparison, (newVal) => {
      if (newVal && hasComparisonData.value) {
        showComparison.value = true
      } else if (!newVal) {
        showComparison.value = false
      }
    }, { immediate: true })

    watch(() => props.comparisonEvents, (newVal) => {
      if (props.enableComparison && newVal.length > 0) {
        showComparison.value = true
      }
    }, { deep: true })

    return {
      // State
      expanded, expandedEvent, searchQuery, sortBy, sortDesc, currentPage, showComparison,
      // Computed
      hasComparisonData, totalEvents, comparisonTotalEvents, totalDelta,
      filteredEvents, sortedFilteredEvents, paginatedEvents, totalPages,
      topEventName,
      // Utilities
      formatNumber, formatDate, formatEventName, formatDelta,
      getDeltaClass, getEventClass, getComparisonEvent, getEventDelta,
      // Actions
      toggleExpand, toggleEventExpand, toggleComparison, calculateDelta
    }
  }
}
</script>

<style scoped>
/* ==================== LAYOUT & CONTAINERS ==================== */
.event-section {
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
  cursor: pointer;
  user-select: none;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.event-summary {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.expand-icon {
  color: var(--gray-500);
}

.event-content {
  margin-top: var(--space-4);
}

.event-summary-collapsed {
  margin-top: var(--space-4);
}

/* ==================== COMPARISON ELEMENTS ==================== */
.comparison-toggle {
  display: flex;
  align-items: center;
}

.no-comparison-badge {
  font-size: 0.75rem;
  background: #f3f4f6;
  color: var(--gray-500);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--gray-200);
}

.comparison-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0;
  padding: var(--space-3);
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  flex-wrap: wrap;
}

.comparison-badge {
  background: var(--primary);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.comparison-dates {
  color: var(--gray-600);
  font-weight: 500;
}

.comparison-total {
  color: var(--gray-700);
  font-weight: 600;
}

.comparison-delta {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-sm);
  background: white;
}

/* ==================== TOGGLE SWITCH ==================== */
.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  background-color: var(--gray-200);
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: var(--shadow-sm);
}

input:checked + .toggle-slider {
  background-color: var(--primary);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
}

/* ==================== CONTROLS ==================== */
.event-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--space-6) 0;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  font-size: 1.25rem;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-3) var(--space-3) 2.5rem;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sort-controls {
  display: flex;
  gap: var(--space-2);
}

.sort-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  color: var(--gray-600);
  background: white;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: var(--primary);
}

.sort-direction-btn {
  width: 38px;
  height: 38px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--gray-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sort-direction-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

/* ==================== EVENTS GRID & CARDS ==================== */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.event-card {
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--gray-200);
}

.event-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px solid var(--primary);
  position: relative;
  z-index: 5;
}

.event-card.has-comparison {
  border-left: 4px solid var(--primary);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.event-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.event-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

.event-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-3);
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

/* ==================== COMPARISON STATS ==================== */
.comparison-stats {
  margin: var(--space-3) 0;
  padding: var(--space-2);
  background: #f0f9ff;
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.comparison-label {
  color: var(--gray-500);
}

.comparison-value {
  font-weight: 600;
  color: var(--gray-700);
}

.delta-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
  margin-left: auto;
}

.no-comparison {
  color: var(--gray-400);
  font-style: italic;
  text-align: center;
  padding: var(--space-1);
}

/* ==================== PROGRESS BARS ==================== */
.progress-bar-container {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-2);
}

.progress-bar {
  position: absolute;
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  z-index: 1;
}

.progress-bar.comparison {
  background: rgba(156, 163, 175, 0.5);
  z-index: 2;
}

/* Event type colors */
.progress-bar.purchase-event { background: var(--success); }
.progress-bar.cart-event { background: var(--primary); }
.progress-bar.view-event { background: var(--purple); }
.progress-bar.click-event { background: var(--warning); }
.progress-bar.default-event { background: var(--gray-400); }

/* ==================== EXPANDED VIEW ==================== */
.expanded-view {
  margin-top: var(--space-4);
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
}

.expanded-label {
  color: var(--gray-500);
  font-weight: 500;
}

.expanded-value {
  font-weight: 600;
  color: var(--gray-800);
  word-break: break-all;
  text-align: right;
}

/* ==================== PAGINATION ==================== */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--gray-600);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--primary);
  color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--gray-600);
}

/* ==================== FOOTER ==================== */
.event-footer {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
  font-size: 0.875rem;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.total-events,
.unique-events {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.total-events.comparison {
  margin-left: var(--space-4);
  padding-left: var(--space-4);
  border-left: 1px solid var(--gray-200);
}

.total-label,
.unique-label {
  color: var(--gray-500);
}

.total-value,
.unique-value {
  font-weight: 600;
  color: var(--gray-800);
}

.footer-delta {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

/* ==================== SUMMARY STATS ==================== */
.summary-stats {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  flex-wrap: wrap;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
}

.summary-delta {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

/* ==================== COLOR UTILITIES ==================== */
.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: var(--gray-600);
}

/* Background variations */
.delta-badge.positive,
.footer-delta.positive,
.summary-delta.positive,
.comparison-delta.positive {
  background: #d1fae5;
  color: #065f46;
}

.delta-badge.negative,
.footer-delta.negative,
.summary-delta.negative,
.comparison-delta.negative {
  background: #fee2e2;
  color: #991b1b;
}

.delta-badge.neutral,
.footer-delta.neutral,
.summary-delta.neutral,
.comparison-delta.neutral {
  background: var(--gray-100);
  color: var(--gray-600);
}

.expanded-value.positive { color: var(--success); }
.expanded-value.negative { color: var(--danger); }

/* ==================== ANIMATIONS ==================== */
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

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .event-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .sort-controls {
    width: 100%;
  }
  
  .sort-select {
    flex: 1;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .event-footer {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .header-controls {
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
  }
  
  .total-events.comparison {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}
</style>