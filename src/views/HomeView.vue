<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAllFormattedCounties,
  getAllPrefectures,
  sortCounties,
  filterCounties,
  getStatistics,
  type SortType,
  type SortDirection,
  type FilterOptions,
  type FormattedCountyGDP
} from '../services/gdpService'
import { default as GDPCharts } from '../components/GDPCharts.vue'

// 数据状态
const allCounties = ref<FormattedCountyGDP[]>([])
const displayedCounties = ref<FormattedCountyGDP[]>([])
const prefectures = ref<{ code: string; name: string }[]>([])
const statistics = ref<any>(null)

// 排序和筛选状态
const sortBy = ref<SortType>('gdp2023')
const sortDirection = ref<SortDirection>('desc')
const filterOptions = ref<FilterOptions>({})
const activeChartType = ref<'gdp' | 'growth' | 'perCapita'>('gdp')

// 加载数据
onMounted(() => {
  try {
    // 获取所有格式化后的县市数据
    allCounties.value = getAllFormattedCounties()
    // 获取所有地级市列表
    prefectures.value = getAllPrefectures()
    // 初始化显示数据
    updateDisplayedData()
  } catch (error) {
    ElMessage.error('数据加载失败')
    console.error(error)
  }
})

// 监听图表类型变化，更新排序方式
watch(activeChartType, (newType) => {
  // 根据选择的图表类型自动切换排序方式
  if (newType === 'growth') {
    sortBy.value = 'growthRate'
  } else if (newType === 'perCapita') {
    sortBy.value = 'perCapitaGDP'
  } else {
    sortBy.value = 'gdp2023'
  }
  sortDirection.value = 'desc' // 默认降序
  updateDisplayedData()
})

// 更新显示数据
function updateDisplayedData() {
  // 先应用筛选
  let filteredData = filterCounties(allCounties.value, filterOptions.value)
  // 再应用排序
  displayedCounties.value = sortCounties(filteredData, sortBy.value, sortDirection.value)
  // 更新统计数据
  statistics.value = getStatistics(displayedCounties.value)
}

// 处理排序变化
function handleSortChange(column: SortType) {
  if (sortBy.value === column) {
    // 如果点击的是当前排序列，则切换排序方向
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 否则，设置新的排序列，并默认为降序
    sortBy.value = column
    sortDirection.value = 'desc'
  }
  updateDisplayedData()
}

// 处理筛选变化
function handleFilterChange() {
  updateDisplayedData()
}

// 重置筛选
function resetFilters() {
  filterOptions.value = {}
  updateDisplayedData()
}

// 格式化数字为千分位
function formatNumber(num: number): string {
  return num.toLocaleString()
}

// 获取排序图标类
function getSortIconClass(column: SortType): string {
  if (sortBy.value !== column) return 'sort-icon'
  return sortDirection.value === 'asc' ? 'sort-icon asc' : 'sort-icon desc'
}
</script>

<template>
  <div class="container">
    <header class="header">
      <h1>黑龙江省各县市 GDP 排行榜 (2023)</h1>
    </header>

    <!-- 统计信息卡片 -->
    <div class="stats-cards" v-if="statistics">
      <div class="stat-card">
        <div class="stat-value">{{ statistics.totalCount }}</div>
        <div class="stat-label">县市总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ statistics.totalGDP2023.toFixed(2) }}</div>
        <div class="stat-label">2023年GDP总量(亿元)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" :class="statistics.overallGrowthRate >= 0 ? 'positive' : 'negative'">
          {{ statistics.overallGrowthRate.toFixed(2) }}%
        </div>
        <div class="stat-label">总体增长率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(Math.round(statistics.avgPerCapitaGDP)) }}</div>
        <div class="stat-label">平均人均GDP(元)</div>
      </div>
    </div>

    <!-- 图表切换 -->
    <div class="chart-controls">
      <div class="chart-tabs">
        <div class="chart-tab" :class="{ active: activeChartType === 'gdp' }" @click="activeChartType = 'gdp'">
          GDP总量
        </div>
        <div class="chart-tab" :class="{ active: activeChartType === 'growth' }" @click="activeChartType = 'growth'">
          增长率
        </div>
        <div class="chart-tab" :class="{ active: activeChartType === 'perCapita' }"
          @click="activeChartType = 'perCapita'">
          人均GDP
        </div>
      </div>
    </div>

    <!-- 数据可视化图表 -->
    <GDPCharts :counties="displayedCounties" :chartType="activeChartType" />

    <!-- 筛选区域 -->
    <div class="filters">
      <div class="filter-group">
        <label>地级市筛选:</label>
        <select v-model="filterOptions.prefecture" @change="handleFilterChange">
          <option value="">全部</option>
          <option v-for="pref in prefectures" :key="pref.code" :value="pref.code">
            {{ pref.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>增长率范围:</label>
        <input type="number" v-model.number="filterOptions.growthRateMin" placeholder="(%)"
          @change="handleFilterChange">
        <span>至</span>
        <input type="number" v-model.number="filterOptions.growthRateMax" placeholder="(%)"
          @change="handleFilterChange">
      </div>

      <div class="filter-group">
        <label>最小GDP(亿元):</label>
        <input type="number" v-model.number="filterOptions.gdpMin" placeholder="亿元" @change="handleFilterChange">
      </div>

      <button class="reset-btn" @click="resetFilters">重置筛选</button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>县市</th>
            <th>地区/排位</th>
            <th @click="handleSortChange('gdp2023')" class="sortable">
              GDP（2023）
              <span :class="getSortIconClass('gdp2023')"></span>
            </th>
            <th @click="handleSortChange('gdp2022')" class="sortable">
              GDP（2022）
              <span :class="getSortIconClass('gdp2022')"></span>
            </th>
            <th @click="handleSortChange('growthRate')" class="sortable">
              名义增速
              <span :class="getSortIconClass('growthRate')"></span>
            </th>
            <th @click="handleSortChange('perCapitaGDP')" class="sortable">
              人均GDP
              <span :class="getSortIconClass('perCapitaGDP')"></span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(county, index) in displayedCounties" :key="county.code">
            <td>{{ index + 1 }}</td>
            <td>{{ county.name }}</td>
            <td>{{ county.regionRank }}</td>
            <td>{{ county.gdp.year2023 }}</td>
            <td>{{ county.gdp.year2022 }}</td>
            <td :class="county.growthRate >= 0 ? 'positive' : 'negative'">
              {{ county.growthRateFormatted }}
            </td>
            <td>{{ formatNumber(county.perCapitaGDP) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer 部分 -->
    <footer>
      <p>QQ：1967464882</p>
      <p>
        Github：<a href="https://github.com/Cq-12345/hlj2023" target="_blank">
          https://github.com/Cq-12345/hlj2023
        </a>
      </p>
      <p>不断更新中，当前最后一次更新：3月9日</p>
    </footer>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #333;
  font-size: 28px;
  margin: 0;
}

/* 统计卡片样式 */
.stats-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: space-between;
}

.stat-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 图表控制区域 */
.chart-controls {
  margin-bottom: 20px;
}

.chart-tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
}

.chart-tab {
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  margin-right: 5px;
  background-color: #f5f5f5;
}

.chart-tab.active {
  background-color: #fff;
  border-color: #ddd;
  border-bottom-color: #fff;
  margin-bottom: -1px;
  font-weight: bold;
}

/* 筛选区域样式 */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}

select, input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input[type="number"] {
  width: 80px;
}

.reset-btn {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}

.reset-btn:hover {
  background-color: #e0e0e0;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
  position: sticky;
  top: 0;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sort-icon {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 5px;
  vertical-align: middle;
  content: "";
  border-top: 4px solid #999;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.sort-icon.asc {
  border-top: none;
  border-bottom: 4px solid #333;
}

.sort-icon.desc {
  border-bottom: none;
  border-top: 4px solid #333;
}

tr:hover {
  background-color: #f9f9f9;
}

/* 正负增长颜色 */
.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

/* 页脚样式 */
footer {
  margin-top: 40px;
  padding: 20px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

footer p {
  margin: 5px 0;
}

footer a {
  color: #409eff;
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
  }

  .stat-card {
    min-width: 100%;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .reset-btn {
    margin-left: 0;
    width: 100%;
    margin-top: 10px;
  }
}
</style>
