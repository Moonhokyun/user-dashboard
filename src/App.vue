<script setup>
// import { RouterLink, RouterView } from "vue-router";
// import HelloWorld from "./components/HelloWorld.vue";
import FileUpload from "@/components/FileUpload.vue";
import Dashboard from "@/components/Dashboard.vue";
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <FileUpload />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <Dashboard />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
