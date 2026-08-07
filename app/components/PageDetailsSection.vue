<template>
  <div class="page-details-section">
    <!-- Section Header with Toggle -->
    <div class="section-header" @click="toggleSection">
      <h2>📄 Page Performance Details</h2>
      <div v-if="enableComparison" class="comparison-badge">
        vs {{ comparisonStartDate }} to {{ comparisonEndDate }}
      </div>
      <span class="material-symbols-outlined expand-icon">
        {{ showSection ? 'expand_less' : 'expand_more' }}
      </span>
    </div>

    <!-- Main Content -->
    <div v-if="showSection" class="section-content">
      <!-- URL Input Section -->
      <div class="url-input-wrapper">
        <div class="url-input-group">
          <input 
            v-model="localPageUrl" 
            type="text" 
            placeholder="Enter page URL (e.g., /products/shoes)"
            class="url-input"
            @keyup.enter="$emit('search', localPageUrl)"
          />
          <button 
            @click="$emit('search', localPageUrl)" 
            :disabled="!localPageUrl || loading"
            class="fetch-button"
          >
            <span class="material-symbols-outlined">search</span>
            {{ loading ? 'Loading...' : 'Analyze Page' }}
          </button>
        </div>
        
        <div class="url-hint" v-if="!pageData.length && localPageUrl && !loading">
          <span class="material-symbols-outlined">info</span>
          <span>No data found for this URL. Try a different path.</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching page analytics...</p>
      </div>

      <!-- Page Details Cards -->
      <div v-else-if="pageData.length" class="page-details-grid">
        <div
          v-for="page in pageData"
          :key="page.pagePath"
          class="page-card"
          :class="{ expanded: expandedPage === page.pagePath }"
          @click="toggleExpand(page.pagePath)"
        >
          <!-- Page Info -->
          <div class="page-info">
            <div class="page-header">
              <h3 class="page-title">{{ page.pageTitle || 'Untitled Page' }}</h3>
              <button 
                class="copy-url-btn" 
                @click.stop="copyToClipboard(page.pagePath)"
                title="Copy URL"
              >
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
            <div class="page-url-badge">
              <span class="url-path">{{ page.pagePath }}</span>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">👁️</div>
              <div class="metric-content">
                <div class="metric-label">Page Views</div>
                <div class="metric-value">{{ formatNumber(page.views) }}</div>
                <div v-if="enableComparison && page.viewsDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(page.viewsDelta)">
                  {{ formatDelta(page.viewsDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">👥</div>
              <div class="metric-content">
                <div class="metric-label">Active Users</div>
                <div class="metric-value">{{ formatNumber(page.activeUsers) }}</div>
                <div v-if="enableComparison && page.activeUsersDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(page.activeUsersDelta)">
                  {{ formatDelta(page.activeUsersDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">⏱️</div>
              <div class="metric-content">
                <div class="metric-label">Avg Session Duration</div>
                <div class="metric-value">{{ formatDuration(page.avgSessionDuration) }}</div>
                <div v-if="enableComparison && page.durationDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(page.durationDelta)">
                  {{ formatDelta(page.durationDelta) }}
                </div>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">📊</div>
              <div class="metric-content">
                <div class="metric-label">Engagement Rate</div>
                <div class="metric-value">{{ formatPercentage(page.engagementRate) }}</div>
                <div v-if="enableComparison && page.engagementRateDelta" 
                     class="metric-delta" 
                     :class="getDeltaClass(page.engagementRateDelta)">
                  {{ formatDelta(page.engagementRateDelta) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Expanded View - Shows comparison data -->
          <div v-if="expandedPage === page.pagePath && enableComparison && page.comparisonData" 
               class="expanded-view">
            <div class="expanded-header">
              <span class="material-symbols-outlined">compare_arrows</span>
              <h4>Comparison Period Data</h4>
            </div>
            <div class="comparison-grid">
              <div class="comparison-item">
                <span class="comparison-label">Previous Views:</span>
                <span class="comparison-value">{{ formatNumber(page.comparisonData.views) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(page.viewsDelta)">
                  {{ formatDelta(page.viewsDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Active Users:</span>
                <span class="comparison-value">{{ formatNumber(page.comparisonData.activeUsers) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(page.activeUsersDelta)">
                  {{ formatDelta(page.activeUsersDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Avg Session:</span>
                <span class="comparison-value">{{ formatDuration(page.comparisonData.avgSessionDuration) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(page.durationDelta)">
                  {{ formatDelta(page.durationDelta) }}
                </span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Previous Engagement Rate:</span>
                <span class="comparison-value">{{ formatPercentage(page.comparisonData.engagementRate) }}</span>
                <span class="comparison-delta" :class="getDeltaClass(page.engagementRateDelta)">
                  {{ formatDelta(page.engagementRateDelta) }}
                </span>
              </div>
            </div>
            
            <!-- Performance Insight -->
            <div class="performance-insight" :class="getPerformanceClass(page)">
              <span class="material-symbols-outlined">{{ getPerformanceIcon(page) }}</span>
              <span>{{ getPerformanceMessage(page) }}</span>
            </div>
          </div>
          
          <!-- Quick Stats Footer -->
          <div class="card-footer" v-if="!enableComparison">
            <span class="footer-note">Click to expand for more details</span>
            <span class="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'PageDetailsSection',
  
  props: {
    pageData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    enableComparison: { type: Boolean, default: false },
    comparisonStartDate: { type: String, default: '' },
    comparisonEndDate: { type: String, default: '' }
  },
  
  emits: ['search', 'toggleSection'],
  
  setup(props, { emit }) {
    const localPageUrl = ref('');
    const expandedPage = ref(null);
    const showSection = ref(true);

    // Debug watchers
    watch(() => props.pageData, (newData) => {
      console.log('📊 PageDetailsSection received:', newData?.length || 0, 'items');
      if (newData?.length > 0) {
        console.log('📊 First item:', {
          pagePath: newData[0].pagePath,
          views: newData[0].views,
          viewsDelta: newData[0].viewsDelta,
          hasComparisonData: !!newData[0].comparisonData
        });
      }
    }, { immediate: true, deep: true });

    watch(() => props.loading, (newLoading) => {
      console.log('⏳ PageDetailsSection loading:', newLoading);
    });

    // Utilities
    const formatNumber = (value) =>
      value == null || isNaN(value) ? '0' : new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value);

    const formatDuration = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0s';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatPercentage = (value) =>
      value == null || isNaN(value) ? '0%' : `${(value * 100).toFixed(1)}%`;

    const formatDelta = (delta) => {
      if (delta == null || isNaN(delta)) return '—';
      const sign = delta > 0 ? '+' : '';
      return `${sign}${Math.abs(delta).toFixed(1)}%`;
    };

    const getDeltaClass = (delta) =>
      delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';

    const THRESHOLD = 10;
    const getPerformanceIcon = (page) => {
      if (!page.viewsDelta) return 'trending_up';
      if (page.viewsDelta > THRESHOLD) return 'trending_up';
      if (page.viewsDelta < -THRESHOLD) return 'trending_down';
      return 'trending_flat';
    };

    const getPerformanceClass = (page) => {
      if (!page.viewsDelta) return 'neutral-performance';
      if (page.viewsDelta > THRESHOLD) return 'positive-performance';
      if (page.viewsDelta < -THRESHOLD) return 'negative-performance';
      return 'neutral-performance';
    };

    const getPerformanceMessage = (page) => {
      if (!page.viewsDelta) return 'No comparison data available';
      if (page.viewsDelta > THRESHOLD) {
        return `Page views increased by ${formatDelta(page.viewsDelta)} compared to previous period`;
      }
      if (page.viewsDelta < -THRESHOLD) {
        return `Page views decreased by ${formatDelta(page.viewsDelta)} compared to previous period`;
      }
      return `Page views are stable compared to previous period (${formatDelta(page.viewsDelta)})`;
    };

    // UI actions
    const toggleSection = () => {
      showSection.value = !showSection.value;
      emit('toggleSection', showSection.value);
    };

    const toggleExpand = (pagePath) => {
      expandedPage.value = expandedPage.value === pagePath ? null : pagePath;
    };

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        console.log('📋 Copied to clipboard:', text);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return {
      localPageUrl,
      expandedPage,
      showSection,
      toggleSection,
      toggleExpand,
      copyToClipboard,
      formatNumber,
      formatDuration,
      formatPercentage,
      formatDelta,
      getDeltaClass,
      getPerformanceIcon,
      getPerformanceClass,
      getPerformanceMessage,
    };
  }
}
</script>

<style scoped>
/* Your existing styles remain exactly the same */
.page-details-section {
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
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
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

.url-input-wrapper {
  margin-bottom: var(--space-6);
}

.url-input-group {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.url-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-family: monospace;
  transition: all 0.2s;
  background: var(--gray-50);
}

.url-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.fetch-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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

.fetch-button .material-symbols-outlined {
  font-size: 1.2rem;
}

.url-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: var(--space-2) var(--space-3);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.url-hint .material-symbols-outlined {
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

.page-details-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-card {
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.page-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: white;
}

.page-card.expanded {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.page-info {
  margin-bottom: var(--space-4);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  flex: 1;
  line-height: 1.4;
}

.copy-url-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  opacity: 0.6;
}

.copy-url-btn:hover {
  opacity: 1;
  background: var(--gray-200);
}

.copy-url-btn .material-symbols-outlined {
  font-size: 1rem;
}

.page-url-badge {
  display: inline-block;
  background: var(--gray-200);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--gray-700);
}

.url-path {
  word-break: break-all;
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
  .page-details-section {
    padding: var(--space-4);
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
}
</style>