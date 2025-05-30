// src/stores/userStore.js
import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", () => {
  // --- 상태 (State) ---
  // 전체 사용자 목록
  const users = ref([]); // 예: [{ name: '홍길동', grade: 3, lastLogin: '2024-05-01', lastParticipation: '2024-04-20', intro: '안녕하세요.'}, ...]
  // 대시보드 테이블에서 선택된 사용자
  const selectedUser = ref(null);
  // 정보 유형별 컴포넌트의 v-chip에서 선택된 등급
  const selectedGradeForChip = ref(null);
  // PDF 처리 중 로딩 상태
  const isLoading = ref(false);
  // PDF 처리 중 오류 메시지
  const errorMeessage = ref("");

  // --- 게터 (Getters) ---
  // 고유한 등급 목록 추출 (v-chip 및 차트 라벨용)
  const uniqueGrades = computed(() => {
    const grades = users.value.map((user) => user.grade);
    return [...new Set(grades)].sort((a, b) => a - b);
  });

  // 등급별 사용자 수 계산 (Chart.js 데이터용)
  const gradeCounts = computed(() => {
    const counts = {};
    uniqueGrades.value.forEach((grade) => {
      counts[grade] = users.value.filter((user) => user.grade === grade).length;
    });
    return counts;
  });

  // 선택된 등급(selectedGradeForChip)에 해당하는 사용자 목록
  const usersBySelectedGrade = computed(() => {
    if (
      selectedGradeForChip.value === null ||
      selectedGradeForChip.value === undefined
    ) {
      return users.value; // 선택된 등급이 없으면 전체 사용자 반환 (초기 상태 등)
    }
    return users.value.filter(
      (user) => user.grade === selectedGradeForChip.value
    );
  });

  // --- 액션 (Actions) ---
  // PDF에서 추출된 사용자 데이터로 users 상태 업데이트
  function setUsers(newUsers) {
    users.value = newUsers;
    errorMeessage.value = ""; // 성공 시 오류 메시지 초기화
  }

  // 대시보드 테이블에서 사용자 선택
  function setSelectedUser(user) {
    selectedUser.value = user;
  }

  // 정보 유형별 컴포넌트에서 등급 선택
  function setSelectedGradeForChip(grade) {
    selectedGradeForChip.value = grade;
    selectedUser.value = null; // 등급 필터 변경 시 선택된 유저 정보는 초기화
  }

  function setLoading(status) {
    isLoading.value = status;
  }

  function setError(message) {
    errorMeessage.value = message;
    users.value = []; // 오류 발생 시 사용자 데이터 초기화
  }

  return {
    users,
    selectedUser,
    selectedGradeForChip,
    isLoading,
    errorMeessage,
    uniqueGrades,
    gradeCounts,
    usersBySelectedGrade,
    setUsers,
    setSelectedUser,
    setSelectedGradeForChip,
    setLoading,
    setError,
  };
});
