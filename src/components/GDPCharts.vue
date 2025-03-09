<script setup lang="ts" name="GDPCharts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { FormattedCountyGDP } from '../services/gdpService'

// 注册必要的组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
])

const props = defineProps<{
  counties: FormattedCountyGDP[]
  chartType?: 'gdp' | 'growth' | 'perCapita'
}>()

// 默认显示前10个县市
const displayCount = ref(10)

// 根据不同图表类型计算数据
const chartData = computed(() => {
  // 先根据当前图表类型对所有数据进行排序
  let sortedData = [...props.counties]
  
  if (props.chartType === 'growth') {
    sortedData = sortedData.sort((a, b) => b.growthRate - a.growthRate)
  } else if (props.chartType === 'perCapita') {
    sortedData = sortedData.sort((a, b) => b.perCapitaGDP - a.perCapitaGDP)
  } else {
    // 默认按2023年GDP排序
    sortedData = sortedData.sort((a, b) => b.gdp.year2023 - a.gdp.year2023)
  }
  
  // 然后截取前N个数据
  return sortedData.slice(0, displayCount.value)
})

// GDP柱状图配置
const gdpChartOption = computed(() => ({
  title: {
    text: props.chartType === 'perCapita'
      ? '人均GDP前10县市'
      : props.chartType === 'growth'
        ? 'GDP增长率前10县市'
        : 'GDP总量前10县市',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: (params: any) => {
      const data = params[0].data
      if (props.chartType === 'growth') {
        return `${params[0].name}<br/>增长率: ${data.toFixed(2)}%`
      } else if (props.chartType === 'perCapita') {
        return `${params[0].name}<br/>人均GDP: ${data.toLocaleString()}元`
      }
      return `${params[0].name}<br/>GDP: ${data.toFixed(2)}亿元`
    }
  },
  xAxis: {
    type: 'category',
    data: chartData.value.map(item => item.name),
    axisLabel: {
      interval: 0,
      rotate: 30
    }
  },
  yAxis: {
    type: 'value',
    name: props.chartType === 'perCapita'
      ? '人均GDP(元)'
      : props.chartType === 'growth'
        ? '增长率(%)'
        : 'GDP(亿元)'
  },
  series: [
    {
      data: chartData.value.map(item => {
        if (props.chartType === 'growth') {
          return item.growthRate
        } else if (props.chartType === 'perCapita') {
          return item.perCapitaGDP
        }
        return item.gdp.year2023
      }),
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          // 增长率图表使用红绿色区分正负增长
          if (props.chartType === 'growth') {
            const value = chartData.value[params.dataIndex].growthRate
            return value >= 0 ? '#91cc75' : '#ee6666'
          }
          // 其他图表使用渐变色
          return {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#5470c6' },
              { offset: 1, color: '#91cc75' }
            ]
          }
        }
      }
    }
  ]
}))

// 正负增长饼图配置
const growthPieOption = computed(() => {
  const positiveCount = props.counties.filter(c => c.growthRate >= 0).length
  const negativeCount = props.counties.filter(c => c.growthRate < 0).length

  return {
    title: {
      text: 'GDP增长情况分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: [
          { value: positiveCount, name: '正增长', itemStyle: { color: '#91cc75' } },
          { value: negativeCount, name: '负增长', itemStyle: { color: '#ee6666' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
})
</script>

<template>
  <div class="charts-container">
    <div class="chart-wrapper">
      <v-chart class="chart" :option="gdpChartOption" autoresize />
    </div>

    <div class="chart-wrapper" v-if="props.chartType === 'growth'">
      <v-chart class="chart" :option="growthPieOption" autoresize />
    </div>
  </div>
</template>

<style scoped>
.charts-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 20px 0;
}

.chart-wrapper {
  flex: 1;
  min-width: 300px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart {
  height: 400px;
  width: 100%;
}

@media (max-width: 768px) {
  .chart-wrapper {
    flex: 100%;
  }
}
</style>
