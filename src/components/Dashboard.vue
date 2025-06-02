<template>
  <v-container>
    <v-card class="dashboard-card">
      <v-card-title class="main-title">등급별 회원 수</v-card-title>
      <v-card-text class="card-container">
        <Bar
          v-if="chartData.labels && chartData.labels.length > 0"
          :data="chartData"
          :options="chartOptions"
        />
        <p
          v-else-if="
            !userStore.isLoading &&
            userStore.users.length === 0 &&
            !userStore.errorMeessage
          "
        >
          표시할 데이터가 없습니다. PDF 파일을 먼저 업로드해주세요.
        </p>
        <p v-if="userStore.isLoading">차트 데이터를 불러오는 중...</p>
        <p v-if="userStore.errorMeessage && userStore.users.length === 0">
          {{ userStore.errorMeessage }}
        </p>
      </v-card-text>
    </v-card>
  </v-container>

  <v-container>
    <v-card class="dashboard-card">
      <v-card-title class="main-title">회원 목록</v-card-title>
      <v-card-text class="card-container">
        <v-data-table
          :headers="tableHeaders"
          :items="userStore.users"
          item-value="name"
          class="table-wrap"
          :loading="userStore.isLoading"
          @click:row="handleRowClick"
          hover
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template v-slot:no-data>
            <v-alert type="info" prominent dense>
              분석을 시작하면 데이터가 나타납니다
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useUserStore } from "@/stores/userStore";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const userStore = useUserStore();

// --- 차트 설정 ---
const chartData = computed(() => {
  const grades = userStore.uniqueGrades; // 스토어에서 고유 등급 가져오기
  const counts = userStore.gradeCounts; // 스토어에서 등급별 사용자 수 가져오기

  // 스토어의 게터가 객체를 반환한다고 가정하고, Chart.js 형식에 맞게 변환
  // uniqueGrades가 정렬된 숫자 배열이라고 가정 (예: [1, 2, 3, 5])
  const labels = grades.map((grade) => `${grade}등급`);
  const data = grades.map((grade) => counts[grade] || 0);

  return {
    labels: labels,
    datasets: [
      {
        label: "회원 수",
        backgroundColor: "#42A5F5", // Vuetify primary color or any color you like
        borderColor: "#1E88E5",
        borderWidth: 1,
        data: data,
      },
    ],
  };
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Ensure only integers are shown on the y-axis
        precision: 0,
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
    title: {
      display: false, // 카드 제목으로 대체
      text: "등급별 회원 수",
    },
  },
});

// --- 테이블 설정 ---
const tableHeaders = ref([
  { title: "회원 이름", key: "name", align: "start", sortable: true },
  {
    title: "등급 (모임 참여 횟수)",
    key: "grade",
    align: "end",
    sortable: true,
  },
  { title: "최종 접속일", key: "lastLogin", align: "start", sortable: true },
  {
    title: "최종 참여일",
    key: "lastParticipation",
    align: "start",
    sortable: true,
  },
]);

// 테이블 행 클릭 핸들러
function handleRowClick(event, { item }) {
  // event 파라미터는 PointerEvent, item은 실제 데이터 객체입니다.
  // Vuetify 3의 v-data-table에서 @click:row는 (event, { item, internalItem, index }) 등을 반환합니다.
  // 실제 item 객체는 item.raw (또는 Vuetify 버전에 따라 item)를 확인해야 할 수 있습니다.
  // 여기서는 item이 실제 데이터 객체라고 가정합니다.
  if (item) {
    userStore.setSelectedUser(item); // Pinia 스토어의 액션 호출
  }
}

// 스토어의 users가 변경될 때 (예: 파일 업로드 후) 차트가 업데이트되도록 함
// vue-chartjs는 props가 반응형이므로 chartData가 변경되면 자동으로 차트를 다시 그립니다.
// 특별한 watch 로직이 필요 없을 수 있지만, 디버깅이나 특정 로직 추가 시 사용할 수 있습니다.
watch(
  () => userStore.users,
  (newUsers) => {
    console.log(
      "Dashboard: Users data changed, chart should update.",
      newUsers
    );
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use "@/assets/scss/variables.scss" as *;

.v-container {
  padding: 0;
  color: $black;
  .dashboard-card {
    display: flex;
    flex-direction: column;
    box-shadow: none;
    padding: 16px;
    gap: 8px;

    .v-card-text {
      .table-wrap {
        box-shadow: none !important;
        .v-table__wrapper {
          .v-data-table-rows-no-data {
            .bg-info {
              background-color: transparent !important;
            }
          }
        }
      }
      .v-data-table {
        .v-alert {
          color: inherit !important;
          .v-alert__content {
            color: inherit !important;
          }
          :deep(.v-alert__prepend) {
            display: none !important;
          }
        }
      }
    }
    .card-container {
      display: flex;
      justify-content: center;
      align-items: center;
      @include table-outline-and-box;
      padding: 16px;
      min-height: 200px;
      .table-wrap {
        :deep(.v-data-table-footer) {
          justify-content: space-between;
        }
      }
    }
  }
}

.v-card {
  max-width: none !important;
  box-shadow: none;
}
.main-title {
  @include text-container-header;
  padding: 0;
}

.sub-title {
  @include text-body-header14;
}

.body-text {
  @include text-body-body14;
}

.label-text {
  @include text-body-label12;
}
</style>
