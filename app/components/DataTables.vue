<template>
  <div class="tables-section">
    <!-- Section Header -->
    <div class="section-header" @click="$emit('toggleTables')">
      <h2>Detailed Data</h2>
      <span class="material-symbols-outlined expand-icon">
        {{ showTables ? 'expand_less' : 'expand_more' }}
      </span>
    </div>

    <div v-if="showTables" class="tables-stack">
      <!-- Location Performance Table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Location Performance Details</h3>
          <div class="table-tabs">
            <button
              :class="{ active: activeLocationTab === 'session' }"
              @click="$emit('update:activeLocationTab', 'session')"
            >
              Sessions & Users
            </button>
            <button
              :class="{ active: activeLocationTab === 'revenue' }"
              @click="$emit('update:activeLocationTab', 'revenue')"
            >
              Revenue (ZAR)
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr class="main-headers">
                <th>City</th>
                <th>Country</th>
                <th
                  v-for="col in activeLocationTab === 'session' ? sessionColumns : revenueColumns"
                  :key="col.key"
                >
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in (activeLocationTab === 'session'
                  ? locationSessionData.slice(0, 10)
                  : locationRevenueData.slice(0, 10))"
                :key="item.city + item.country"
              >
                <td>{{ item.city || '—' }}</td>
                <td>{{ item.country || '—' }}</td>
                <template v-for="col in (activeLocationTab === 'session' ? sessionColumns : revenueColumns)">
                  <td>{{ col.format(item[col.key]) }}</td>
                </template>
              </tr>
              <tr v-if="(activeLocationTab === 'session' ? locationSessionData.length : locationRevenueData.length) === 0">
                <td colspan="7" class="empty">No location data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Source Analysis Table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Source Analysis</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr class="main-headers">
                <th>Channel</th>
                <th>Device</th>
                <th>Campaign</th>
                <th v-for="col in sourceColumns" :key="col.key">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in sourceData.slice(0, 8)"
                :key="item.channel + item.deviceCategory + item.campaignName"
              >
                <td>
                  <span class="channel-badge" :class="getChannelClass(item.channel)">
                    {{ item.channel || 'Other' }}
                  </span>
                </td>
                <td><span class="device-badge">{{ item.deviceCategory || '—' }}</span></td>
                <!-- Expandable Campaign Cell -->
                <td class="campaign-cell" @click="toggleCampaign(item)">
                  <span v-if="expandedCampaigns[`${item.channel}-${item.deviceCategory}-${item.campaignName}`]">
                    {{ item.campaignName || '—' }}
                  </span>
                  <span v-else>
                    {{ truncateString(item.campaignName, 25) || '—' }}
                  </span>
                </td>
                <template v-for="col in sourceColumns">
                  <td>{{ col.format(item[col.key]) }}</td>
                </template>
              </tr>
              <tr v-if="sourceData.length === 0">
                <td colspan="6" class="empty">No source data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataTables',
  props: {
    locationSessionData: { type: Array, default: () => [] },
    locationRevenueData: { type: Array, default: () => [] },
    sourceData: { type: Array, default: () => [] },
    activeLocationTab: { type: String, default: 'session' },
    showTables: { type: Boolean, default: false }
  },
  data() {
    return {
      expandedCampaigns: {} // track expanded state per campaign row
    };
  },
  methods: {
    // 🔹 Formatting helpers
    formatZAR(value) {
      if (!value || isNaN(Number(value))) return 'R0';
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        maximumFractionDigits: 0
      }).format(Number(value));
    },
    formatNumber(value) {
      if (!value || isNaN(Number(value))) return '0';
      return new Intl.NumberFormat('en-ZA').format(Number(value));
    },
    formatPercent(value) {
      if (value === null || value === undefined || isNaN(Number(value))) return '0%';
      return `${Number(value).toFixed(1)}%`;
    },
    truncateString(str, max) {
      if (!str) return '—';
      return str.length > max ? str.substring(0, max) + '...' : str;
    },

    // 🔹 Channel badge styling
    getChannelClass(channel) {
      if (!channel) return 'other';
      const v = channel.toLowerCase();
      if (v.includes('organic')) return 'organic';
      if (v.includes('paid')) return 'paid';
      if (v.includes('direct')) return 'direct';
      if (v.includes('referral')) return 'referral';
      if (v.includes('social')) return 'social';
      return 'other';
    },

    // 🔹 Campaign expand/collapse toggle
    toggleCampaign(item) {
      const key = `${item.channel}-${item.deviceCategory}-${item.campaignName}`;
      this.$set(this.expandedCampaigns, key, !this.expandedCampaigns[key]);
    }
  },
  computed: {
    // 🔹 Column definitions
    sessionColumns() {
      return [
        { key: 'sessions', label: 'Sessions', format: this.formatNumber },
        { key: 'conversions', label: 'Conversions', format: this.formatNumber },
        { key: 'sessionConversionRate', label: 'Conv. Rate', format: this.formatPercent },
        { key: 'activeUsers', label: 'Active Users', format: this.formatNumber },
        { key: 'newUsers', label: 'New Users', format: this.formatNumber }
      ];
    },
    revenueColumns() {
      return [
        { key: 'purchaseRevenue', label: 'Revenue (ZAR)', format: this.formatZAR },
        { key: 'transactions', label: 'Transactions', format: this.formatNumber },
        { key: 'conversions', label: 'Conversions', format: this.formatNumber }
      ];
    },
    sourceColumns() {
      return [
        { key: 'sessions', label: 'Sessions', format: this.formatNumber },
        { key: 'conversions', label: 'Conversions', format: this.formatNumber },
        { key: 'sessionConversionRate', label: 'Conv. Rate', format: this.formatPercent }
      ];
    }
  }
};
</script>

<style scoped>
/* --- Section Layout --- */
.tables-section {
  background: #fff;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
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
.expand-icon { color: var(--gray-500); }

/* --- Tables Stack --- */
.tables-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-6);
}
.table-card {
  background: var(--gray-50);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  width: 100%;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.table-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-700);
}
.table-tabs {
  display: flex;
  gap: var(--space-2);
  background: #fff;
  padding: var(--space-1);
  border-radius: var(--radius-lg);
}
.table-tabs button {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s;
}
.table-tabs button.active {
  background: var(--primary);
  color: #fff;
}

/* --- Table Wrapper --- */
.table-wrapper {
  overflow: auto;
  max-height: 500px;
  border-radius: var(--radius-lg);
  scrollbar-width: thin;
  scrollbar-color: var(--gray-300) var(--gray-100);
}
.table-wrapper::-webkit-scrollbar { width: 8px; height: 8px; }
.table-wrapper::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-sm);
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-sm);
}
.table-wrapper::-webkit-scrollbar-thumb:hover { background: var(--gray-400); }

/* --- Data Table --- */
.data-table {
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.875rem;
  background: #fff;
}
.data-table th {
  padding: var(--space-3) var(--space-2);
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}
.data-table .main-headers th {
  background: var(--gray-100);
  color: var(--gray-700);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 2px solid var(--gray-300);
}

/* --- Table Body --- */
.data-table td {
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-800);
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}
.data-table td:first-child,
.data-table td:nth-child(2),
.data-table .campaign-cell { text-align: left; }

.data-table tbody tr:hover td { background: var(--gray-50); }
.data-table tbody tr:nth-child(even) { background-color: #fafafa; }

/* --- Campaign Cell --- */
.campaign-cell {
  white-space: normal;   /* allows wrapping */
  word-break: break-word; /* breaks long strings */
  max-width: 300px;
  color: var(--gray-600);
  cursor: pointer;       /* indicates expandability */
}
.campaign-cell:hover {
  text-decoration: underline;
}

/* --- Sticky Headers --- */
.data-table thead,
.data-table .main-headers th {
  position: sticky;
  top: 0;
  z-index: 20;
}

/* --- Channel & Device Badges --- */
.channel-badge,
.device-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-badge.organic { background: #dbeafe; color: #1e40af; }
.channel-badge.paid    { background: #fee2e2; color: #991b1b; }
.channel-badge.direct  { background: #dcfce7; color: #166534; }
.channel-badge.referral{ background: #fef3c7; color: #92400e; }
.channel-badge.social  { background: #f3e8ff; color: #6b21a8; }
.channel-badge.other   { background: var(--gray-100); color: var(--gray-600); }

.device-badge {
  background: var(--gray-100);
  color: var(--gray-600);
  max-width: 80px;
}

/* --- Responsive --- */
@media (max-width: 1024px) {
  .data-table { font-size: 0.8rem; }
  .data-table th, .data-table td { padding: var(--space-2) var(--space-1); }
}
</style>