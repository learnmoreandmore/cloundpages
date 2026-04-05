<template>
  <div>
    <h1>Vue3 + Cloudflare Pages Functions</h1>
    <button @click="test">发送 POST</button>
    <pre>{{ result }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from './api'

const result = ref('')

async function test() {
  try {
    const res = await api.post('/test', {
      name: 'vue3',
      content: '测试成功不超时'
    })
    result.value = JSON.stringify(res.data, null, 2)
  } catch (e) {
    result.value = '错误：' + e.message
  }
}
</script>