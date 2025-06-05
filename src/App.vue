<script setup>
import FileUpload from "@/components/FileUpload.vue";
import Dashboard from "@/components/Dashboard.vue";
import UserInfoByType from "@/components/UserInfoByType.vue";
</script>

<template>
  <v-container class="entire-wrap">
    <FileUpload />
    <Dashboard />
    <UserInfoByType />
  </v-container>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables.scss" as *;

.entire-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: $black;
}
</style>
