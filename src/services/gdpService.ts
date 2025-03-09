// src/services/gdpService.ts
import { counties } from '../data/counties'
import type { CountyGDP } from '../data/counties'
import { prefectureMap } from '../data/prefectureMap'

// 扩展的县市数据接口，包含计算和格式化后的字段
export interface FormattedCountyGDP extends CountyGDP {
  growthRate: number // 增长率（数值）
  growthRateFormatted: string // 格式化的增长率（带%）
  regionRank: string // 地区排名
  gdpUnit: string // GDP单位
}

// 排序类型
export type SortType = 'gdp2023' | 'gdp2022' | 'growthRate' | 'perCapitaGDP'

// 排序方向
export type SortDirection = 'asc' | 'desc'

// 筛选选项
export interface FilterOptions {
  prefecture?: string // 按地级市筛选
  growthRateMin?: number // 最小增长率
  growthRateMax?: number // 最大增长率
  gdpMin?: number // 最小GDP
}

/**
 * 计算GDP增长率
 */
export function calculateGrowthRate(gdp: { year2023: number; year2022: number }): number {
  return ((gdp.year2023 - gdp.year2022) / gdp.year2022) * 100 || 0
}

/**
 * 格式化GDP数据，添加计算字段
 */
export function formatCountyData(county: CountyGDP): FormattedCountyGDP {
  const growthRate = calculateGrowthRate(county.gdp)
  return {
    ...county,
    growthRate, // 数值类型的增长率
    growthRateFormatted: `${growthRate.toFixed(2)}%`, // 格式化的增长率
    regionRank: `${prefectureMap[county.prefecture]}${county.rank}`, // 地区排名
    gdpUnit: '亿元', // GDP单位
  }
}

/**
 * 获取所有格式化后的县市GDP数据
 */
export function getAllFormattedCounties(): FormattedCountyGDP[] {
  return counties.map(formatCountyData)
}

/**
 * 获取所有地级市列表（用于筛选）
 */
export function getAllPrefectures(): { code: string; name: string }[] {
  return Object.entries(prefectureMap).map(([code, name]) => ({ code, name }))
}

/**
 * 排序县市数据
 */
export function sortCounties(
  data: FormattedCountyGDP[],
  sortBy: SortType = 'gdp2023',
  direction: SortDirection = 'desc'
): FormattedCountyGDP[] {
  console.log('排序前数据数量:', data.length)
  console.log('排序前数据codes:', data.map(c => c.code))
  
  const result = [...data].sort((a, b) => {
    let valueA: number, valueB: number

    switch (sortBy) {
      case 'gdp2023':
        valueA = a.gdp.year2023
        valueB = b.gdp.year2023
        break
      case 'gdp2022':
        valueA = a.gdp.year2022
        valueB = b.gdp.year2022
        break
      case 'growthRate':
        valueA = a.growthRate
        valueB = b.growthRate
        break
      case 'perCapitaGDP':
        valueA = a.perCapitaGDP
        valueB = b.perCapitaGDP
        break
      default:
        valueA = a.gdp.year2023
        valueB = b.gdp.year2023
    }

    // 主要排序条件
    const primaryCompare = direction === 'asc' ? valueA - valueB : valueB - valueA

    // 如果主要排序值相同，使用code作为次要排序条件，确保排序稳定性
    if (primaryCompare === 0) {
      return a.code.localeCompare(b.code)
    }

    return primaryCompare
  })
  
  console.log('排序后数据数量:', result.length)
  console.log('排序后数据codes:', result.map(c => c.code))
  
  // 检查是否有重复项
  const codeSet = new Set()
  const duplicates = []
  for (const county of result) {
    if (codeSet.has(county.code)) {
      duplicates.push(county.code)
    } else {
      codeSet.add(county.code)
    }
  }
  
  if (duplicates.length > 0) {
    console.error('发现重复项:', duplicates)
  }
  
  return result
}

/**
 * 筛选县市数据
 */
export function filterCounties(
  data: FormattedCountyGDP[],
  options: FilterOptions
): FormattedCountyGDP[] {
  return data.filter((county) => {
    // 按地级市筛选
    if (options.prefecture && county.prefecture !== options.prefecture) {
      return false
    }

    // 按增长率范围筛选
    if (
      options.growthRateMin !== undefined &&
      county.growthRate < options.growthRateMin
    ) {
      return false
    }

    if (
      options.growthRateMax !== undefined &&
      county.growthRate > options.growthRateMax
    ) {
      return false
    }

    // 按GDP最小值筛选
    if (options.gdpMin !== undefined && county.gdp.year2023 < options.gdpMin) {
      return false
    }

    return true
  })
}

/**
 * 获取统计数据
 */
export function getStatistics(data: FormattedCountyGDP[]) {
  // 计算2023年GDP总和
  const totalGDP2023 = data.reduce((sum, county) => sum + county.gdp.year2023, 0)

  // 计算2022年GDP总和
  const totalGDP2022 = data.reduce((sum, county) => sum + county.gdp.year2022, 0)

  // 计算总体增长率
  const overallGrowthRate = ((totalGDP2023 - totalGDP2022) / totalGDP2022) * 100

  // 计算平均人均GDP
  const avgPerCapitaGDP = data.reduce((sum, county) => sum + county.perCapitaGDP, 0) / data.length

  // 增长率为正的县市数量
  const positiveGrowthCount = data.filter(county => county.growthRate > 0).length

  // 增长率为负的县市数量
  const negativeGrowthCount = data.filter(county => county.growthRate < 0).length

  return {
    totalGDP2023,
    totalGDP2022,
    overallGrowthRate,
    avgPerCapitaGDP,
    positiveGrowthCount,
    negativeGrowthCount,
    totalCount: data.length
  }
}
