<template>
  <div class="event-section">
    <!-- Section Header with optional expand/collapse -->
    <div class="section-header" @click="toggleExpand">
      <h2>Event Breakdown</h2>
      <div class="header-controls">
        <span class="event-summary" v-if="!expanded">
          {{ paginatedEvents.length }} events · {{ formatNumber(totalEvents) }} total events
        </span>
        <span class="material-symbols-outlined expand-icon">
          {{ expanded ? 'expand_less' : 'expand_more' }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="expanded" class="event-content">
      <!-- Search and Filter Bar -->
      <div class="event-controls">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search events..."
            class="search-input"
          />
        </div>
        
        <div class="sort-controls">
          <select v-model="sortBy" class="sort-select">
            <option value="count">Sort by Count</option>
            <option value="name">Sort by Name</option>
            <option value="percentage">Sort by Percentage</option>
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
          v-for="event in sortedFilteredEvents"
          :key="event.eventName"
          class="event-card"
          :class="{ 'expanded': expandedEvent === event.eventName }"
          @click="toggleEventExpand(event.eventName)"
        >
          <div class="event-header">
            <h3 class="event-name">{{ formatEventName(event.eventName) }}</h3>
            <span class="event-percentage">{{ event.percentage }}%</span>
          </div>
          
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-label">Count</span>
              <span class="stat-value">{{ formatNumber(event.eventCount) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Share</span>
              <span class="stat-value">{{ event.percentage }}%</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar-container">
            <div 
              class="progress-bar"
              :style="{ width: event.percentage + '%' }"
              :class="getEventClass(event.eventName)"
            ></div>
          </div>

          <!-- Expanded View -->
          <div v-if="expandedEvent === event.eventName" class="expanded-view">
            <div class="expanded-row">
              <span class="expanded-label">Raw Count:</span>
              <span class="expanded-value">{{ event.eventCount }}</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Percentage:</span>
              <span class="expanded-value">{{ event.percentage }}%</span>
            </div>
            <div class="expanded-row">
              <span class="expanded-label">Event Name:</span>
              <span class="expanded-value">{{ event.eventName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" v-if="totalPages > 1">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- Summary Footer -->
      <div class="event-footer">
        <div class="total-events">
          <span class="total-label">Total Events:</span>
          <span class="total-value">{{ formatNumber(totalEvents) }}</span>
        </div>
        <div class="unique-events">
          <span class="unique-label">Unique Event Types:</span>
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
        </div>
        <div class="summary-stat">
          <span class="summary-label">Event Types</span>
          <span class="summary-value">{{ events.length }}</span>
        </div>
        <div class="summary-stat">
          <span class="summary-label">Top Event</span>
          <span class="summary-value">{{ topEventName }}</span>
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
      validator: (value) => {
        return value.every(item => 
          item.eventName !== undefined && 
          item.eventCount !== undefined && 
          item.percentage !== undefined
        )
      }
    },
    loading: {
      type: Boolean,
      default: false
    },
    itemsPerPage: {
      type: Number,
      default: 12
    }
  },

  setup(props) {
    // ==================== STATE ====================
    const expanded = ref(false)
    const expandedEvent = ref(null)
    const searchQuery = ref('')
    const sortBy = ref('count')
    const sortDesc = ref(true)
    const currentPage = ref(1)

    // ==================== COMPUTED ====================
    const totalEvents = computed(() => {
      return props.events.reduce((sum, event) => sum + event.eventCount, 0)
    })

    const filteredEvents = computed(() => {
      if (!searchQuery.value) return props.events
      
      const query = searchQuery.value.toLowerCase()
      return props.events.filter(event => 
        event.eventName.toLowerCase().includes(query)
      )
    })

    const sortedFilteredEvents = computed(() => {
      const events = [...filteredEvents.value]
      
      switch (sortBy.value) {
        case 'count':
          events.sort((a, b) => 
            sortDesc.value ? b.eventCount - a.eventCount : a.eventCount - b.eventCount
          )
          break
        case 'percentage':
          events.sort((a, b) => 
            sortDesc.value ? b.percentage - a.percentage : a.percentage - b.percentage
          )
          break
        case 'name':
          events.sort((a, b) => {
            const nameA = a.eventName.toLowerCase()
            const nameB = b.eventName.toLowerCase()
            return sortDesc.value 
              ? nameB.localeCompare(nameA) 
              : nameA.localeCompare(nameB)
          })
          break
      }
      
      return events
    })

    const paginatedEvents = computed(() => {
      const start = (currentPage.value - 1) * props.itemsPerPage
      const end = start + props.itemsPerPage
      return sortedFilteredEvents.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(sortedFilteredEvents.value.length / props.itemsPerPage)
    })

    const topEvent = computed(() => {
      if (!props.events.length) return null
      return props.events.reduce((max, event) => 
        event.eventCount > max.eventCount ? event : max
      )
    })

    const topEventName = computed(() => {
      return topEvent.value ? formatEventName(topEvent.value.eventName) : 'None'
    })

    // ==================== METHODS ====================
    const formatNumber = (value) => {
      return new Intl.NumberFormat('en-ZA').format(value)
    }

    const formatEventName = (name) => {
      if (!name) return '—'
      return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    const getEventClass = (eventName) => {
      const name = eventName.toLowerCase()
      if (name.includes('purchase') || name.includes('order')) return 'purchase-event'
      if (name.includes('cart')) return 'cart-event'
      if (name.includes('view')) return 'view-event'
      if (name.includes('click')) return 'click-event'
      return 'default-event'
    }

    const toggleExpand = () => {
      expanded.value = !expanded.value
      if (!expanded.value) {
        expandedEvent.value = null
      }
    }

    const toggleEventExpand = (eventName) => {
      expandedEvent.value = expandedEvent.value === eventName ? null : eventName
    }

    // Reset page when search or sort changes
    watch([searchQuery, sortBy, sortDesc], () => {
      currentPage.value = 1
    })

    return {
      // State
      expanded,
      expandedEvent,
      searchQuery,
      sortBy,
      sortDesc,
      currentPage,
      
      // Computed
      totalEvents,
      filteredEvents,
      sortedFilteredEvents,
      paginatedEvents,
      totalPages,
      topEventName,
      
      // Methods
      formatNumber,
      formatEventName,
      getEventClass,
      toggleExpand,
      toggleEventExpand
    }
  }
}
</script>

<style scoped>
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

/* Event Controls */
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

/* Events Grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

/* Progress Bar */
.progress-bar-container {
  width: 100%;
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-2);
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-bar.purchase-event { background: var(--success); }
.progress-bar.cart-event { background: var(--primary); }
.progress-bar.view-event { background: var(--purple); }
.progress-bar.click-event { background: var(--warning); }
.progress-bar.default-event { background: var(--gray-400); }

/* Expanded View */
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

/* Pagination */
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

/* Footer */
.event-footer {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
  font-size: 0.875rem;
}

.total-events,
.unique-events {
  display: flex;
  gap: var(--space-2);
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

/* Collapsed Summary */
.event-summary-collapsed {
  margin-top: var(--space-4);
}

.summary-stats {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
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

/* Animations */
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

/* Responsive */
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
}
</style>