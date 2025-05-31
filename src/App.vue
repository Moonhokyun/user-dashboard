<script setup>
import FileUpload from "@/components/FileUpload.vue";
import Dashboard from "@/components/Dashboard.vue";
import UserInfoByType from "@/components/UserInfoByType.vue";
</script>

<template>
  <v-container fluid>
    <v-col>
      <v-col cols="12">
        <FileUpload />
      </v-col>
    </v-col>
    <v-col>
      <v-col cols="12" md="7">
        <Dashboard />
      </v-col>
      <v-col cols="12" md="5">
        <UserInfoByType />
      </v-col>
    </v-col>
  </v-container>
</template>

<style scoped></style>
