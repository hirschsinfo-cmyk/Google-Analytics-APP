import Chart from 'chart.js/auto'

export function useCharts() {
  function createBarChart(canvas, config) {
    return new Chart(canvas, {
      type: 'bar',
      data: config,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  function createLineChart(canvas, config) {
    return new Chart(canvas, {
      type: 'line',
      data: config,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  function destroyChart(chartInstance) {
    if (chartInstance) {
      chartInstance.destroy()
    }
  }

  return {
    createBarChart,
    createLineChart,
    destroyChart
  }
}