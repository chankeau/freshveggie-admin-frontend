<template>
    <div class="not-found-page">
      <h1>404 - 页面未找到</h1>
      <p>抱歉，您访问的页面不存在。</p>
      <router-link to="/dashboard">返回首页</router-link>
    </div>
  </template>
  <script setup>
  import { RouterLink } from 'vue-router';
  </script>
  <style scoped>
  .not-found-page { text-align: center; padding-top: 100px; }
  </style>