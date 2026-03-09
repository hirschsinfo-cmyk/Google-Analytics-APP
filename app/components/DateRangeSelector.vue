<template>
  <div class="date-range-card">
    <div class="date-inputs">
      <!-- Main Period -->
      <div class="period-inputs">
        <h3 class="period-title">Main Period</h3>
        <div class="input-group">
          <label>Start Date</label>
          <div class="date-input-wrapper">
            <input 
              type="date" 
              :value="startDate" 
              @input="$emit('update:startDate', $event.target.value)"
              :max="endDate" 
              class="date-picker" 
            />
            <span class="material-symbols-outlined date-icon">calendar_today</span>
          </div>
        </div>
        <div class="input-group">
          <label>End Date</label>
          <div class="date-input-wrapper">
            <input 
              type="date" 
              :value="endDate" 
              @input="$emit('update:endDate', $event.target.value)"
              :min="startDate" 
              :max="today" 
              class="date-picker" 
            />
            <span class="material-symbols-outlined date-icon">calendar_today</span>
          </div>
        </div>
      </div>

      <!-- Secondary Period -->
      <div v-if="enableComparison" class="period-inputs comparison">
        <h3 class="period-title">Secondary Period</h3>
        <div class="input-group">
          <label>Start Date</label>
          <div class="date-input-wrapper">
            <input 
              type="date" 
              :value="comparisonStart" 
              @input="$emit('update:comparisonStart', $event.target.value)"
              :max="comparisonEnd" 
              class="date-picker" 
            />
            <span class="material-symbols-outlined date-icon">calendar_today</span>
          </div>
        </div>
        <div class="input-group">
          <label>End Date</label>
          <div class="date-input-wrapper">
            <input 
              type="date" 
              :value="comparisonEnd" 
              @input="$emit('update:comparisonEnd', $event.target.value)"
              :min="comparisonStart" 
              :max="today" 
              class="date-picker" 
            />
            <span class="material-symbols-outlined date-icon">calendar_today</span>
          </div>
        </div>
      </div>

      <!-- Quick Select & Controls -->
      <div class="controls-group">
        <div class="input-group quick-select">
          <label>Quick Select</label>
          <select 
            :value="quickRange" 
            @change="$emit('update:quickRange', $event.target.value); $emit('quickRangeChange')" 
            class="quick-select-dropdown"
          >
            <option value="">Custom Range</option>
            <option value="7daysAgo">Last 7 Days</option>
            <option value="30daysAgo">Last 30 Days</option>
            <option value="90daysAgo">Last 90 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>

        <div class="toggle-group">
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              :checked="enableComparison" 
              @change="$emit('update:enableComparison', $event.target.checked)"
            >
            <span class="toggle-slider"></span>
            <span class="toggle-label">Add comparison range</span>
          </label>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button @click="$emit('export')" :disabled="loading || !hasData" class="export-btn">
        <span class="material-symbols-outlined">download</span> Export CSV
      </button>
      <button @click="$emit('update')" :disabled="loading" class="update-btn">
        <span v-if="!loading">Update Dashboard</span>
        <span v-else class="loading-spinner"></span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DateRangeSelector',
  props: {
    startDate: String,
    endDate: String,
    comparisonStart: String,
    comparisonEnd: String,
    enableComparison: Boolean,
    quickRange: String,
    loading: Boolean,
    hasData: Boolean,
    today: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    }
  },
  emits: [
    'update:startDate',
    'update:endDate',
    'update:comparisonStart',
    'update:comparisonEnd',
    'update:enableComparison',
    'update:quickRange',
    'quickRangeChange',
    'update',
    'export'
  ],
  mounted() {
  console.log('=== DATATABLES MOUNTED ===');
  console.log('enableComparison:', this.enableComparison);
  console.log('locationSessionData:', this.locationSessionData?.length);
  console.log('locationSessionComparison:', this.locationSessionComparison?.length);
  console.log('locationRevenueData:', this.locationRevenueData?.length);
  console.log('locationRevenueComparison:', this.locationRevenueComparison?.length);
  console.log('sourceData:', this.sourceData?.length);
  console.log('sourceComparison:', this.sourceComparison?.length);
  
  if (this.sourceData?.length > 0) {
    console.log('First source item:', JSON.stringify(this.sourceData[0], null, 2));
  }
  if (this.sourceComparison?.length > 0) {
    console.log('First source comparison:', JSON.stringify(this.sourceComparison[0], null, 2));
  }
},

// Also add a watcher to see when props change
watch: {
  sourceData: {
    handler(newVal) {
      console.log('sourceData updated:', newVal?.length);
    },
    deep: true
  },
  sourceComparison: {
    handler(newVal) {
      console.log('sourceComparison updated:', newVal?.length);
    },
    deep: true
  }
},
  methods: {
    formatDate(date) {
      return new Date(date).toISOString().split('T')[0]
    },
    applyQuickRange(rangeKey) {
      const end = new Date()
      let start = new Date()
      const configs = {
        '7daysAgo': { days: 7, compDays: 8 },
        '30daysAgo': { days: 30, compDays: 31 },
        '90daysAgo': { days: 90, compDays: 91 },
        'thisMonth': { type: 'month' },
        'lastMonth': { type: 'lastMonth' },
        'thisYear': { type: 'year' }
      }
      const config = configs[rangeKey]
      if (!config) return

      if (config.days) {
        start.setDate(end.getDate() - config.days)
        this.$emit('update:comparisonEnd', this.formatDate(new Date(start.getTime() - 24*60*60*1000)))
        this.$emit('update:comparisonStart', this.formatDate(new Date(start.getTime() - config.compDays*24*60*60*1000)))
      } else if (config.type === 'month') {
        start = new Date(end.getFullYear(), end.getMonth(), 1)
        this.$emit('update:comparisonStart', this.formatDate(new Date(end.getFullYear(), end.getMonth() - 1, 1)))
        this.$emit('update:comparisonEnd', this.formatDate(new Date(end.getFullYear(), end.getMonth(), 0)))
      } else if (config.type === 'lastMonth') {
        start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
        end.setDate(0)
        this.$emit('update:comparisonStart', this.formatDate(new Date(end.getFullYear(), end.getMonth() - 1, 1)))
        this.$emit('update:comparisonEnd', this.formatDate(new Date(end.getFullYear(), end.getMonth(), 0)))
      } else if (config.type === 'year') {
        start = new Date(end.getFullYear(), 0, 1)
        this.$emit('update:comparisonStart', this.formatDate(new Date(end.getFullYear() - 1, 0, 1)))
        this.$emit('update:comparisonEnd', this.formatDate(new Date(end.getFullYear() - 1, 11, 31)))
      }

      this.$emit('update:startDate', this.formatDate(start))
      this.$emit('update:endDate', this.formatDate(end))
      this.$emit('update:quickRange', rangeKey)
      this.$emit('quickRangeChange')
    }
  }
}
</script>

<style scoped>
.date-range-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  max-width: 1400px;
  margin: var(--space-6) auto 0;
  padding: var(--space-6);
}

.date-inputs {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.period-inputs {
  flex: 1;
  min-width: 300px;
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: var(--radius-xl);
}

.period-inputs.comparison {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.period-title {
  width: 100%;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: var(--space-2);
}

.controls-group {
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-picker,
.quick-select-dropdown {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'Inter', sans-serif;
}

.date-picker {
  padding-left: 2.5rem;
}

.date-picker:focus,
.quick-select-dropdown:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--gray-400);
  font-size: 1.25rem;
  pointer-events: none;
}

.toggle-group {
  display: flex;
  align-items: center;
}

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

.action-buttons {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.export-btn,
.update-btn {
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 42px;
}

.export-btn {
  background: var(--success);
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: var(--success-dark);
}

.update-btn {
  background: var(--primary);
  color: white;
  min-width: 160px;
}

.update-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.export-btn:disabled,
.update-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .date-inputs {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .period-inputs {
    min-width: 100%;
  }
  
  .controls-group {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .export-btn,
  .update-btn {
    width: 100%;
  }
}
</style>