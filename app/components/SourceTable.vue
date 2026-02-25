<template>
  <div class="table-card">
    <div class="table-header">
      <h3>Source Analysis</h3>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Channel</th>
            <th>Device</th>
            <th>Campaign</th>
            <th>Sessions</th>
            <th>Conv. Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sourceData.slice(0, 8)" :key="idx">
            <td>
              <span class="channel-badge" :class="getChannelClass(item.channel)">
                {{ item.channel || 'Other' }}
              </span>
            </td>
            <td><span class="device-badge">{{ item.deviceCategory || '—' }}</span></td>
            <td>{{ truncateString(item.campaignName, 20) || '—' }}</td>
            <td>{{ formatNumber(item.sessions) }}</td>
            <td>{{ formatPercent(item.sessionConversionRate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatters } from '/utils/formatters'

const props = defineProps({
  sourceData: {
    type: Array,
    required: true
  }
})

const { number: formatNumber, percent: formatPercent, truncate: truncateString } = formatters

function getChannelClass(channel) {
  if (!channel) return 'other'
  const channelLower = channel.toLowerCase()
  if (channelLower.includes('organic')) return 'organic'
  if (channelLower.includes('paid')) return 'paid'
  if (channelLower.includes('direct')) return 'direct'
  if (channelLower.includes('referral')) return 'referral'
  if (channelLower.includes('social')) return 'social'
  return 'other'
}
</script>