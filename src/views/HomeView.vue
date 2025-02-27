<script setup lang="ts">
import { ref, computed } from 'vue'
import { counties } from '@/data/counties'
import { prefectureMap } from '@/data/prefectureMap'
import { calculateGrowthRate } from '@/data/counties'

// 计算名义增速并格式化为百分比
const formattedCounties = computed(() =>
  counties.map((county) => ({
    ...county,
    growthRate: `${calculateGrowthRate(county.gdp).toFixed(2)}%`,
    regionRank: `${prefectureMap[county.prefecture]}${county.rank}`,
  })),
)
</script>

<template>
  <div>
    <h1>黑龙江省各县市 GDP 排行榜</h1>
    <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; text-align: center">
      <thead>
        <tr>
          <th>序号</th>
          <th>县市</th>
          <th>地区/排位</th>
          <th>GDP（2023）</th>
          <th>GDP（2022）</th>
          <th>名义增速</th>
          <th>人均 GDP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(county, index) in formattedCounties" :key="county.code">
          <td>{{ index + 1 }}</td>
          <td>{{ county.name }}</td>
          <td>{{ county.regionRank }}</td>
          <td>{{ county.gdp.year2023 }}</td>
          <td>{{ county.gdp.year2022 }}</td>
          <td>{{ county.growthRate }}</td>
          <td>{{ county.perCapitaGDP }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Footer 部分 -->
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #888">
      <p>QQ：1967464882</p>
      <p>
        Github：<a href="https://www.example.com" target="_blank" style="color: #1e90ff"
          >www.example.com</a
        >
      </p>
      <p>不断更新中，当前最后一次更新：2月27日</p>
    </footer>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f4f4f4;
}

footer {
  margin-top: 40px;
  padding: 10px;
  background-color: #f0f0f0;
}

footer p {
  margin: 5px 0;
}

footer a {
  text-decoration: none;
}
</style>
