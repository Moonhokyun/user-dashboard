<template>
  <v-container>
    <v-card class="userboard-card" v-if="userStore.selectedUser">
      <v-card-title class="main-title"> 회원 상세 정보 </v-card-title>
      <v-list lines="two">
        <v-list-item
          :title="userStore.selectedUser.name"
          subtitle="회원 이름"
        ></v-list-item>
        <v-divider inset></v-divider>
        <v-list-item
          :title="`${userStore.selectedUser.grade} 등급`"
          subtitle="등급 (모임 참여 횟수)"
        ></v-list-item>
        <v-divider inset></v-divider>
        <v-list-item
          :title="userStore.selectedUser.lastLogin"
          subtitle="최종 접속일"
        ></v-list-item>
        <v-divider inset></v-divider>
        <v-list-item
          :title="userStore.selectedUser.lastParticipation"
          subtitle="최종 참여일"
        ></v-list-item>
        <v-divider inset></v-divider>
        <v-list-item>
          <v-list-item-title>자기소개 내용</v-list-item-title>
          <v-list-item-subtitle style="white-space: pre-wrap">{{
            userStore.selectedUser.intro
          }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="clearSelectedUser">목록 보기</v-btn>
      </v-card-actions>
    </v-card>

    <v-card class="userboard-info-card" v-else>
      <v-card-title class="main-title">
        <v-icon start>mdi-filter-variant</v-icon>
        등급별 회원 정보
      </v-card-title>
      <v-card-text class="user-info-table-wrap">
        <p
          v-if="
            userStore.users.length === 0 &&
            !userStore.isLoading &&
            !userStore.errorMeessage
          "
          class="text-center grey--text"
        >
          먼저 PDF 파일을 업로드하거나 예시 데이터를 로드해주세요.
        </p>
        <p v-if="userStore.isLoading" class="text-center grey--text">
          데이터 로딩 중...
        </p>
        <p
          v-if="userStore.errorMeessage && userStore.users.length === 0"
          class="text-center error--text"
        >
          {{ userStore.errorMeessage }}
        </p>

        <v-chip-group
          v-if="userStore.users.length > 0"
          v-model="selectedChipGrade"
          column
          mandatory
          active-class="primary--text"
        >
          <v-chip
            v-for="grade in userStore.uniqueGrades"
            :key="grade"
            :value="grade"
            label
            filter
          >
            {{ grade }} 등급
          </v-chip>
          <v-chip :value="null" label filter> 전체 보기 </v-chip>
        </v-chip-group>

        <v-alert
          v-if="selectedChipGrade !== null && actionSuggestion"
          type="info"
          variant="tonal"
          dense
        >
          <v-alert-title
            >{{ selectedChipGrade }}등급 회원 행동 제안</v-alert-title
          >
          {{ actionSuggestion }}
        </v-alert>
        <v-alert
          v-if="selectedChipGrade === null && userStore.users.length > 0"
          type="info"
          variant="tonal"
          dense
        >
          전체 회원을 보고 있습니다. 등급을 선택하여 필터링할 수 있습니다.
        </v-alert>

        <v-data-table
          v-if="userStore.users.length > 0"
          :headers="filteredTableHeaders"
          :items="filteredUsersByGrade"
          item-value="name"
          class="table-wrap"
          :loading="userStore.isLoading"
          items-per-page="5"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
          </template>
          <template v-slot:no-data>
            <v-alert type="warning" prominent dense>
              선택된 등급에 해당하는 회원이 없습니다.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();

// --- 등급별 뷰 (v-chip) 관련 ---
const selectedChipGrade = ref(null); // v-chip-group의 v-model. 초기에는 전체

// 선택된 칩 등급에 따라 Pinia 스토어 업데이트
watch(selectedChipGrade, (newGrade) => {
  userStore.setSelectedGradeForChip(newGrade);
});

// 스토어의 selectedGradeForChip이 외부에서 변경될 때 (예: 초기화) selectedChipGrade 동기화
watch(
  () => userStore.selectedGradeForChip,
  (newStoreGrade) => {
    if (selectedChipGrade.value !== newStoreGrade) {
      selectedChipGrade.value = newStoreGrade;
    }
  }
);

// 등급별 행동 제안 내용
const gradeActionSuggestions = {
  1: "1등급 회원에게는 특별 할인 쿠폰을 제공하여 재방문을 유도해 보세요!",
  2: "2등급 회원에게는 신규 모임 정보를 우선적으로 안내해 보세요.",
  3: "3등급 회원에게는 관심사 기반 맞춤형 콘텐츠를 추천해 보세요.",
  4: "4등급 회원에게는 참여 독려 메시지와 함께 작은 혜택을 제공하는 것을 고려해 보세요.",
  5: "5등급 회원에게는 환영 메시지와 함께 첫 모임 참여를 위한 가이드를 제공해 주세요.",
  // 필요에 따라 더 많은 등급과 제안을 추가할 수 있습니다.
};

const actionSuggestion = computed(() => {
  return selectedChipGrade.value
    ? gradeActionSuggestions[selectedChipGrade.value] ||
        "해당 등급에 대한 제안이 아직 없습니다."
    : "";
});

// 필터링된 테이블 헤더
const filteredTableHeaders = ref([
  { title: "회원 이름", key: "name", align: "start" },
  { title: "등급", key: "grade", align: "end" },
  { title: "최종 접속일", key: "lastLogin", align: "start" },
  { title: "최종 참여일", key: "lastParticipation", align: "start" },
]);

// Pinia 스토어의 usersBySelectedGrade 게터를 사용하여 필터링된 사용자 목록 가져오기
const filteredUsersByGrade = computed(() => userStore.usersBySelectedGrade);

// --- 선택된 회원 상세 정보 관련 ---
function clearSelectedUser() {
  userStore.setSelectedUser(null); // 선택된 사용자 정보 초기화
  // userStore.setSelectedGradeForChip(null); // 등급 필터도 초기화 할 수 있음 (선택사항)
}

// 컴포넌트가 마운트될 때 selectedChipGrade를 스토어의 selectedGradeForChip 값으로 초기화
// (예: 페이지 새로고침 후에도 이전 선택 유지 - Pinia persist 플러그인 사용 시 더 효과적)
if (userStore.selectedGradeForChip !== null) {
  selectedChipGrade.value = userStore.selectedGradeForChip;
}
</script>

<style lang="scss" scoped>
@use "@/assets/scss/variables.scss" as *;
.v-container {
  padding: 0;
  color: $black;
  .userboard-card {
    display: flex;
    flex-direction: column;
    box-shadow: none;
    padding: 16px;
    gap: 8px;
    :deep(.v-card-text) {
      .v-table {
        box-shadow: none !important;
        .v-table__wrapper {
          .v-data-table-rows-no-data {
            .bg-info {
              background-color: transparent !important;
            }
          }
        }
        .v-data-table-footer {
          justify-content: space-between;
        }
      }
      .v-data-table {
        margin: 0 !important;
      }
      .v-alert {
        margin: 0 !important;
        color: inherit !important;
        .v-alert__content {
          color: inherit !important;
        }
        :deep(.v-alert__prepend) {
          display: none !important;
        }
      }
      .v-slide-group {
        padding: 0;
        .v-slide-group__container {
          .v-slide-group__content {
            gap: 8px;
            .v-chip {
              margin: 0;
            }
          }
        }
      }
    }
    .card-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      min-height: 200px;
    }
    .table-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 200px;
      justify-content: center;
      align-items: center;
      @include table-outline-and-box;
      .v-alert {
        padding: 4px 12px;
        :deep(.v-alert__prepend) {
          display: none !important;
        }
      }
    }
  }
  .userboard-info-card {
    display: flex;
    flex-direction: column;
    box-shadow: none;
    padding: 16px;
    gap: 8px;
    .user-info-table-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
      :deep(.v-alert) {
        background-color: $gray-2nd;
        margin-top: 0;
        padding: 4px 12px;
        .v-alert__content {
          color: $black;
        }
        .v-alert__prepend {
          display: none;
        }
      }
      .text-info {
        color: transparent !important;
      }
      .table-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        @include table-outline-and-box;
        padding: 16px;
        min-height: 200px;
        :deep(.v-table__wrapper) {
          width: 100%;
        }
        :deep(.v-data-table-footer) {
          width: 100%;
          justify-content: space-between;
        }
      }
      :deep(.v-slide-group) {
        padding: 0;
        .v-slide-group__container {
          .v-slide-group__content {
            gap: 8px;
            .v-chip {
              margin: 0;
            }
          }
        }
      }
    }
  }
}

.v-card {
  max-width: none !important;
  box-shadow: none;
  .v-card-text {
    padding: 0;
  }
}

.main-title {
  @include text-container-header;
  padding: 0;
  .v-icon {
    display: none;
  }
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
