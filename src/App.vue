<script setup>
import FileUpload from "@/components/FileUpload.vue";
import Dashboard from "@/components/Dashboard.vue";
import UserInfoByType from "@/components/UserInfoByType.vue";
</script>

<template>
  <v-container fluid>
    <v-container>
      <v-container>
        <FileUpload />
      </v-container>
    </v-container>
    <v-container>
      <v-container>
        <Dashboard />
      </v-container>
      <v-container>
        <UserInfoByType />
      </v-container>
    </v-container>
  </v-container>
</template>

<style lang="scss" scoped>
@import "@/assets/scss/variables.scss";
</style>
