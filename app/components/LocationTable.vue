<template>
  <div class="table-card">
    <div class="table-header">
      <h3>Location Performance Details</h3>
      <div class="table-tabs">
        <button 
          :class="{ active: activeTab === 'session' }" 
          @click="$emit('update:activeTab', 'session')"
        >
          Sessions & Users
        </button>
        <button 
          :class="{ active: activeTab === 'revenue' }" 
          @click="$emit('update:activeTab', 'revenue')"
        >
          Revenue
        </button>
      </div>
    </div>
    
    <div class="table-wrapper">
      <table v-if="activeTab === 'session'">
        <thead>
          <tr>
            <th>City</th>
            <th>Country</th>
            <th>Sessions</th>
            <th>Conv. Rate</th>
            <th>Active Users</th>
            <th>New Users</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sessionData.slice(0, 10)" :key="idx">
            <td>{{ item.city || '—' }}</td>
            <td>{{ item.country || '—' }}</td>
            <td>{{ formatNumber(item.sessions) }}</td>
            <td>{{ formatPercent(item.sessionConversionRate) }}</td>
            <td>{{ formatNumber(item.activeUsers) }}</td>
            <td>{{ formatNumber(item.newUsers) }}</td>
          </tr>
        </tbody>
      </table>
      
      <table v-else>
        <thead>
          <tr>
            <th>City</th>
            <th>Country</th>
            <th>Revenue</th>
            <th>Transactions</th>
            <th>Avg. Order Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in revenueData.slice(0, 10)" :key="idx">
            <td>{{ item.city || '—' }}</td>
            <td>{{ item.country || '—' }}</td>
            <td>{{ formatCurrency(item.purchaseRevenue) }}</td>
            <td>{{ formatNumber(item.transactions) }}</td>
            <td>{{ formatCurrency(item.transactions ? item.purchaseRevenue / item.transactions : 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatters } from '../utils/formatters'

const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  sessionData: {
    type: Array,
    required: true
  },
  revenueData: {
    type: Array,
    required: true
  }
})

defineEmits(['update:activeTab'])

const { currency: formatCurrency, number: formatNumber, percent: formatPercent } = formatters
</script>