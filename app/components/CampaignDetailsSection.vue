<template>
  <div class="campaign-details-section">
    <!-- Section Header with Toggle -->
    <div class="section-header" @click="toggleSection">
      <div class="header-left">
        <span class="section-icon">🎯</span>
        <h2>Campaign Performance Details</h2>
      </div>
      <div class="header-right">
        <div v-if="enableComparison" class="comparison-badge">
          vs {{ comparisonStartDate }} to {{ comparisonEndDate }}
        </div>
        <span class="material-symbols-outlined expand-icon">
          {{ showSection ? 'expand_less' : 'expand_more' }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="showSection" class="section-content">
      <!-- Campaign Name Input Section -->
      <div class="campaign-input-wrapper">
        <div class="campaign-input-group">
          <div class="input-container">
            <span class="material-symbols-outlined input-icon">campaign</span>
            <input 
              v-model="localCampaignName" 
              type="text" 
              placeholder="Enter campaign name (e.g., Summer Sale 2024, Black Friday)"
              class="campaign-input"
              @keyup.enter="handleSearch"
              :disabled="loading"
            />
            <button 
              v-if="localCampaignName"
              class="clear-input-btn" 
              @click="clearInput"
              title="Clear"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <button 
            @click="handleSearch" 
            :disabled="!localCampaignName || loading"
            class="fetch-button"
            :class="{ 'loading': loading }"
          >
            <span class="material-symbols-outlined">search</span>
            {{ loading ? 'Analyzing...' : 'Analyze Campaign' }}
          </button>
        </div>
        
        <!-- Recent Campaigns -->
        <div v-if="recentCampaigns.length && !loading" class="recent-campaigns">
          <span class="recent-label">Recent:</span>
          <button 
            v-for="camp in recentCampaigns.slice(0, 4)" 
            :key="camp"
            class="recent-campaign-btn"
            @click="quickSelectCampaign(camp)"
          >
            {{ truncateString(camp, 30) }}
          </button>
        </div>
        
        <div class="campaign-hint" v-if="!campaignData.length && localCampaignName && !loading && !loading">
          <span class="material-symbols-outlined">info</span>
          <span>No data found for this campaign. Try a different campaign name or check spelling.</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching campaign analytics...</p>
      </div>

      <!-- Campaign Details Cards -->
      <div v-else-if="campaignData.length" class="campaign-details-grid">
        <div
          v-for="campaign in campaignData"
          :key="campaign.campaignName"
          class="campaign-card"
          :class="{ expanded: expandedCampaign === campaign.campaignName }"
          @click="toggleExpand(campaign.campaignName)"
        >
          <!-- Campaign Info -->
          <div class="campaign-info">
            <div class="campaign-header">
              <div class="campaign-title-wrapper">
                <h3 class="campaign-title">{{ campaign.campaignName || 'Untitled Campaign' }}</h3>
                <span class="campaign-tag">Active Campaign</span>
              </div>
              <button 
                class="copy-name-btn" 
                @click.stop="copyToClipboard(campaign.campaignName)"
                title="Copy campaign name"
              >
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">🎯</div>
              <div class="metric-content">
                <div class="metric-label">Conversions</div>
                <div class="metric-value">{{ formatNumber(campaign.conversions) }}</div>
                <div v-if="enableComparison && campaign.conversionsDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(campaign.conversionsDelta)">
                  {{ formatDelta(campaign.conversionsDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">🖱️</div>
              <div class="metric-content">
                <div class="metric-label">Sessions</div>
                <div class="metric-value">{{ formatNumber(campaign.sessions) }}</div>
                <div v-if="enableComparison && campaign.sessionsDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(campaign.sessionsDelta)">
                  {{ formatDelta(campaign.sessionsDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">👥</div>
              <div class="metric-content">
                <div class="metric-label">Active Users</div>
                <div class="metric-value">{{ formatNumber(campaign.activeUsers) }}</div>
                <div v-if="enableComparison && campaign.activeUsersDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(campaign.activeUsersDelta)">
                  {{ formatDelta(campaign.activeUsersDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <div class="metric-label">Conversion Rate</div>
                <div class="metric-value">{{ formatPercentage(campaign.sessionConversionRate) }}</div>
                <div v-if="enableComparison && campaign.conversionRateDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(campaign.conversionRateDelta)">
                  {{ formatDelta(campaign.conversionRateDelta) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Summary Bar -->
          <div class="performance-summary">
            <div class="summary-bar">
              <div class="summary-fill" :style="{ width: getPerformanceWidth(campaign) }"></div>
            </div>
            <div class="summary-text">{{ getPerformanceSummary(campaign) }}</div>
          </div>

          <!-- Expanded View - Shows comparison data -->
          <div v-if="expandedCampaign === campaign.campaignName && enableComparison && campaign.comparisonData" 
               class="expanded-view">
            <div class="expanded-header">
              <span class="material-symbols-outlined">compare_arrows</span>
              <h4>Comparison Period Data</h4>
            </div>
            <div class="comparison-grid">
              <div class="comparison-item">
                <span class="comparison-label">Previous Conversions:</span>
                <span class="comparison-value">{{ formatNumber(campaign.comparisonData.conversions) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(campaign.conversionsDelta)">
                  {{ formatDelta(campaign.conversionsDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Sessions:</span>
                <span class="comparison-value">{{ formatNumber(campaign.comparisonData.sessions) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(campaign.sessionsDelta)">
                  {{ formatDelta(campaign.sessionsDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Active Users:</span>
                <span class="comparison-value">{{ formatNumber(campaign.comparisonData.activeUsers) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(campaign.activeUsersDelta)">
                  {{ formatDelta(campaign.activeUsersDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Conversion Rate:</span>
                <span class="comparison-value">{{ formatPercentage(campaign.comparisonData.sessionConversionRate) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(campaign.conversionRateDelta)">
                  {{ formatDelta(campaign.conversionRateDelta) }}
                </span>
              </div>
            </div>
            
            <!-- Performance Insight -->
            <div class="performance-insight" :class="getPerformanceClass(campaign)">
              <span class="material-symbols-outlined">{{ getPerformanceIcon(campaign) }}</span>
              <span>{{ getPerformanceMessage(campaign) }}</span>
            </div>
          </div>
          
          <!-- Quick Stats Footer -->
          <div class="card-footer" v-if="!enableComparison">
            <span class="footer-note">Click to expand for more details</span>
            <span class="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!loading && !campaignData.length" class="empty-state">
        <span class="material-symbols-outlined">campaign</span>
        <p>Enter a campaign name above to see performance metrics</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'

export default {
  name: 'CampaignDetailsSection',
  
  props: {
    campaignData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: '' },
    comparisonEndDate: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    apiBase: { type: String, default: '' }
  },
  
  emits: ['search', 'toggleSection', 'update:campaignData'],
  
  setup(props, { emit }) {
    const localCampaignName = ref('');
    const expandedCampaign = ref(null);
    const showSection = ref(true);
    const recentCampaigns = ref([]);
    const isSearching = ref(false);

    // Load recent campaigns from localStorage
    const loadRecentCampaigns = () => {
      try {
        const saved = localStorage.getItem('recentCampaigns');
        if (saved) {
          recentCampaigns.value = JSON.parse(saved).slice(0, 5);
        }
      } catch (e) {
        console.error('Error loading recent campaigns:', e);
      }
    };

    // Save campaign to recent list
    const saveRecentCampaign = (campaignName) => {
      if (!campaignName) return;
      const updated = [campaignName, ...recentCampaigns.value.filter(c => c !== campaignName)].slice(0, 5);
      recentCampaigns.value = updated;
      localStorage.setItem('recentCampaigns', JSON.stringify(updated));
    };

    // Handle search with debounce
    let searchTimeout = null;
    const handleSearch = () => {
      if (!localCampaignName.value || isSearching.value) return;
      
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        saveRecentCampaign(localCampaignName.value);
        emit('search', localCampaignName.value);
      }, 300);
    };

    const quickSelectCampaign = (campaignName) => {
      localCampaignName.value = campaignName;
      handleSearch();
    };

    const clearInput = () => {
      localCampaignName.value = '';
    };

    // Debug watchers
    watch(() => props.campaignData, (newData) => {
      console.log('📊 CampaignDetailsSection received:', newData?.length || 0, 'items');
      if (newData?.length > 0) {
        console.log('📊 First item:', {
          campaignName: newData[0].campaignName,
          conversions: newData[0].conversions,
          sessions: newData[0].sessions,
          conversionRate: newData[0].sessionConversionRate,
          conversionsDelta: newData[0].conversionsDelta,
          hasComparisonData: !!newData[0].comparisonData
        });
      }
    }, { immediate: true, deep: true });

    watch(() => props.loading, (newLoading) => {
      console.log('⏳ CampaignDetailsSection loading:', newLoading);
      isSearching.value = newLoading;
    });

    // Utilities
    const formatNumber = (value) =>
      value == null || isNaN(value) ? '0' : new Intl.NumberFormat('en-ZA').format(value);

    const formatPercentage = (value) =>
      value == null || isNaN(value) ? '0%' : `${(value * 100).toFixed(1)}%`;

    const formatDelta = (delta) => {
      if (delta == null || isNaN(delta)) return '—';
      const sign = delta > 0 ? '+' : '';
      return `${sign}${Math.abs(delta).toFixed(1)}%`;
    };

    const getDeltaClass = (delta) =>
      delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';

    const truncateString = (str, maxLength) => {
      if (!str) return str;
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };

    const THRESHOLD = 15;
    const getPerformanceIcon = (campaign) => {
      if (!campaign.conversionsDelta) return 'trending_up';
      if (campaign.conversionsDelta > THRESHOLD) return 'trending_up';
      if (campaign.conversionsDelta < -THRESHOLD) return 'trending_down';
      if (campaign.conversionRateDelta > THRESHOLD) return 'trending_up';
      if (campaign.conversionRateDelta < -THRESHOLD) return 'trending_down';
      return 'trending_flat';
    };

    const getPerformanceClass = (campaign) => {
      if (!campaign.conversionsDelta) return 'neutral-performance';
      if (campaign.conversionsDelta > THRESHOLD || campaign.conversionRateDelta > THRESHOLD) return 'positive-performance';
      if (campaign.conversionsDelta < -THRESHOLD || campaign.conversionRateDelta < -THRESHOLD) return 'negative-performance';
      return 'neutral-performance';
    };

    const getPerformanceMessage = (campaign) => {
      if (!campaign.conversionsDelta) return 'No comparison data available';
      
      if (campaign.conversionsDelta > THRESHOLD) {
        return `🚀 Conversions increased by ${formatDelta(campaign.conversionsDelta)} with ${formatDelta(campaign.conversionRateDelta)} higher conversion rate`;
      }
      if (campaign.conversionsDelta < -THRESHOLD) {
        return `⚠️ Conversions decreased by ${formatDelta(campaign.conversionsDelta)} with ${formatDelta(campaign.conversionRateDelta)} lower conversion rate`;
      }
      
      if (campaign.conversionRateDelta > THRESHOLD) {
        return `📈 Conversion rate improved by ${formatDelta(campaign.conversionRateDelta)} despite stable conversion volume`;
      }
      if (campaign.conversionRateDelta < -THRESHOLD) {
        return `📉 Conversion rate dropped by ${formatDelta(campaign.conversionRateDelta)} - needs optimization`;
      }
      
      return `Campaign performance is stable (${formatDelta(campaign.conversionsDelta)} conversions, ${formatDelta(campaign.conversionRateDelta)} conversion rate)`;
    };

    const getPerformanceWidth = (campaign) => {
      if (!campaign.conversionsDelta) return '50%';
      // Normalize delta to 0-100% range (capped at +/-50%)
      const normalized = Math.min(Math.max((campaign.conversionsDelta + 50) / 100, 0), 100);
      return `${normalized}%`;
    };

    const getPerformanceSummary = (campaign) => {
      if (!campaign.conversionsDelta) return 'Performance data pending';
      if (campaign.conversionsDelta > THRESHOLD) return 'Strong growth';
      if (campaign.conversionsDelta < -THRESHOLD) return 'Needs attention';
      return 'Stable performance';
    };

    // UI actions
    const toggleSection = () => {
      showSection.value = !showSection.value;
      emit('toggleSection', showSection.value);
    };

    const toggleExpand = (campaignName) => {
      expandedCampaign.value = expandedCampaign.value === campaignName ? null : campaignName;
    };

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        console.log('📋 Copied to clipboard:', text);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    onMounted(() => {
      loadRecentCampaigns();
    });

    return {
      localCampaignName,
      expandedCampaign,
      showSection,
      recentCampaigns,
      isSearching,
      toggleSection,
      toggleExpand,
      handleSearch,
      quickSelectCampaign,
      clearInput,
      copyToClipboard,
      formatNumber,
      formatPercentage,
      formatDelta,
      getDeltaClass,
      getPerformanceIcon,
      getPerformanceClass,
      getPerformanceMessage,
      getPerformanceWidth,
      getPerformanceSummary,
      truncateString,
    };
  }
}
</script>

<style scoped>
.campaign-details-section {
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
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-header:hover {
  opacity: 0.8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-icon {
  font-size: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.header-right {
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
}

.expand-icon {
  color: var(--gray-500);
}

.section-content {
  margin-top: var(--space-4);
}

.campaign-input-wrapper {
  margin-bottom: var(--space-6);
}

.campaign-input-group {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--gray-400);
  font-size: 1.25rem;
  pointer-events: none;
}

.campaign-input {
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) 2.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  transition: all 0.2s;
  background: var(--gray-50);
  font-family: monospace;
}

.campaign-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.campaign-input:disabled {
  background: var(--gray-100);
  cursor: not-allowed;
}

.clear-input-btn {
  position: absolute;
  right: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  transition: all 0.2s;
}

.clear-input-btn:hover {
  background: var(--gray-200);
  color: var(--gray-600);
}

.clear-input-btn .material-symbols-outlined {
  font-size: 1rem;
}

.fetch-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-6);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.fetch-button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.fetch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fetch-button.loading {
  background: var(--gray-500);
}

.fetch-button .material-symbols-outlined {
  font-size: 1.2rem;
}

.recent-campaigns {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.recent-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 600;
}

.recent-campaign-btn {
  background: white;
  border: 1px solid var(--gray-200);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  color: var(--gray-700);
  cursor: pointer;
  transition: all 0.2s;
}

.recent-campaign-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.campaign-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: var(--space-2) var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.campaign-hint .material-symbols-outlined {
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: var(--space-8);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.campaign-details-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.campaign-card {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.campaign-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: white;
}

.campaign-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.campaign-info {
  margin-bottom: var(--space-4);
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.campaign-title-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.campaign-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  line-height: 1.4;
}

.campaign-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.copy-name-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  opacity: 0.6;
}

.copy-name-btn:hover {
  opacity: 1;
  background: var(--gray-200);
}

.copy-name-btn .material-symbols-outlined {
  font-size: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: white;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.metric-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-100);
  border-radius: var(--radius-lg);
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.metric-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
  margin-top: var(--space-1);
  display: inline-block;
}

.metric-delta.positive {
  background: #d1fae5;
  color: #065f46;
}

.metric-delta.negative {
  background: #fee2e2;
  color: #991b1b;
}

.metric-delta.neutral {
  background: var(--gray-100);
  color: var(--gray-600);
}

.performance-summary {
  margin-top: var(--space-3);
  padding: var(--space-2);
  background: white;
  border-radius: var(--radius-lg);
}

.summary-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-1);
}

.summary-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.summary-text {
  font-size: 0.7rem;
  color: var(--gray-600);
  font-weight: 500;
  text-align: center;
}

.expanded-view {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
  animation: slideDown 0.3s ease-out;
}

.expanded-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.expanded-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
}

.expanded-header .material-symbols-outlined {
  font-size: 1.2rem;
  color: var(--primary);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.comparison-label {
  font-size: 0.75rem;
  color: var(--gray-600);
  font-weight: 500;
}

.comparison-value {
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.875rem;
}

.comparison-delta {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.125rem var(--space-1);
  border-radius: var(--radius-sm);
}

.performance-insight {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  margin-top: var(--space-3);
  background: white;
}

.positive-performance {
  background: #d1fae5;
  color: #065f46;
}

.negative-performance {
  background: #fee2e2;
  color: #991b1b;
}

.neutral-performance {
  background: var(--gray-100);
  color: var(--gray-700);
}

.card-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--gray-200);
  font-size: 0.7rem;
  color: var(--gray-500);
}

.footer-note {
  font-size: 0.7rem;
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--gray-500);
}

.empty-state .material-symbols-outlined {
  font-size: 3rem;
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.875rem;
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

@media (max-width: 768px) {
  .campaign-details-section {
    padding: var(--space-4);
  }
  
  .campaign-input-group {
    flex-direction: column;
  }
  
  .fetch-button {
    width: 100%;
    justify-content: center;
  }
  
  .recent-campaigns {
    flex-wrap: wrap;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-item {
    flex-direction: column;
    text-align: center;
    gap: var(--space-1);
  }
  
  .campaign-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>