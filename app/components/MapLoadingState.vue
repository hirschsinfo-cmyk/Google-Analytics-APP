<template>
  <div class="map-section loading-map">
    <div class="section-header">
      <h2>Geographic Performance - South Africa</h2>
    </div>
    <div class="map-placeholder">
      <span class="material-symbols-outlined">map</span>
      <p>Loading map...</p>
    </div>
  </div>
</template>

<style scoped>
.map-section.loading-map {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.map-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 1rem;
}

.map-placeholder .material-symbols-outlined {
  font-size: 48px;
}
</style>