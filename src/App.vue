<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'

// 检查是否为首次访问
onMounted(() => {
  // 获取当前版本标识，可以根据更新日期或版本号来修改
  const currentVersion = '2025-03-09'
  const visitedKey = `hlj2023-visited-${currentVersion}`

  // 检查localStorage中是否有访问记录
  if (!localStorage.getItem(visitedKey)) {
    // 显示更新弹窗
    ElMessageBox.alert(
      '3月9日更新——增加了诸多功能。<br>存在bug：排序时会出问题，存在排序后莫名其妙多出一些项的bug，待修改。',
      '更新提示',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '我知道了',
        callback: () => {
          // 标记已访问
          localStorage.setItem(visitedKey, 'true')
        }
      }
    )
  }
})
</script>

<template>
  <RouterView />
</template>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
