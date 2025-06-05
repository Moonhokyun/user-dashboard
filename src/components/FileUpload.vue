<template>
  <v-container>
    <v-card class="file-upload-wrap">
      <v-card-title class="main-title">회원 정보 PDF 업로드</v-card-title>
      <v-card-text class="pdf-insert-card">
        <v-file-input
          v-model="fileInputModel"
          label="PDF 파일을 선택하세요"
          accept=".pdf"
          prepend-icon="mdi-file-pdf-box"
          show-size
          :disabled="userStore.isLoading"
          :error-messages="userStore.errorMeessage"
          clearable
        ></v-file-input>

        <v-progress-linear
          v-if="userStore.isLoading"
          indeterminate
          color="primary"
          class="mt-4"
        ></v-progress-linear>
      </v-card-text>
      <v-card-actions class="card-btn-wrap">
        <v-spacer></v-spacer>
        <v-btn
          @click="onAnalyzeClick"
          :disabled="isAnalyzeButtonDisabled"
          :loading="userStore.isLoading"
          class="file-insert-btn"
        >
          {{ analyzeButtonText }}
        </v-btn>
        <v-btn
          @click="processExamplePDF"
          :disabled="userStore.isLoading"
          class="sample-insert-btn"
        >
          (예시) 더미 데이터
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useUserStore } from "@/stores/userStore";
import * as pdfjsLib from "pdfjs-dist/build/pdf";

// 이전에 설정한 PDF 워커 경로
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

const userStore = useUserStore();
const fileInputModel = ref(null); // v-file-input의 v-model과 연결될 ref (단일 파일이므로 File 객체 또는 null)

// 파일 입력 변경 감지
watch(fileInputModel, (newFile) => {
  if (newFile) {
    // 새 파일이 선택되었고, 이전에 분석 결과(사용자 데이터 또는 에러 메시지)가 있었다면 초기화
    if (userStore.users.length > 0) {
      userStore.setUsers([]);
    }
    if (userStore.errorMeessage) {
      userStore.setError("");
    }
    // 로딩 상태도 초기화 (이전 분석 시도 중 오류로 인해 로딩이 멈췄을 수 있음)
    if (userStore.isLoading) {
      userStore.setLoading(false);
    }
  } else {
    // 파일 선택이 취소된 경우 (fileInputModel이 null이 됨)
    // "다른 파일 분석하기" 상태였다면 사용자 목록과 에러 메시지 초기화
    if (analyzeButtonText.value === "다른 파일 분석하기") {
      userStore.setUsers([]);
      userStore.setError("");
    }
  }
});

// 버튼 텍스트 계산
const analyzeButtonText = computed(() => {
  if (userStore.users.length > 0 && !userStore.isLoading) {
    return "다른 파일 분석하기";
  }
  return "분석하기";
});

// 버튼 비활성화 상태 계산
const isAnalyzeButtonDisabled = computed(() => {
  if (userStore.isLoading) {
    return true; // 로딩 중에는 항상 비활성화
  }
  // "분석하기" 상태일 때 파일이 선택되지 않았으면 비활성화
  if (analyzeButtonText.value === "분석하기" && !fileInputModel.value) {
    return true;
  }
  // "다른 파일 분석하기" 버튼은 로딩 중이 아니라면 항상 활성화 상태로 둡니다.
  // (클릭 시 파일 입력 초기화 동작)
  return false;
});

// 실제 PDF 파일 처리 로직을 담당하는 함수
async function performActualFileAnalysis(fileToProcess) {
  if (fileToProcess.type !== "application/pdf") {
    userStore.setError("PDF 파일만 업로드 가능합니다.");
    // 잘못된 파일 타입이면 입력 필드에서 제거
    fileInputModel.value = null;
    return;
  }

  userStore.setLoading(true);
  userStore.setError(""); // 이전 오류 메시지 초기화
  // userStore.setUsers([]); // 분석 시작 시 이전 사용자 데이터는 이미 watch 또는 버튼 클릭 로직에서 처리됨

  const reader = new FileReader();
  reader.onload = async (e) => {
    let allText = "";
    try {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      console.log("--- Extracted Text ---");
      console.log(allText);
      console.log("----------------------");

      const parsedUsers = parseTextToUsers(allText); // 기존 parseTextToUsers 함수 사용

      if (parsedUsers.length > 0) {
        userStore.setUsers(parsedUsers);
      } else if (pdf.numPages > 0) {
        userStore.setError(
          "PDF에서 유효한 회원 정보를 추출하지 못했습니다. 파일 내용을 확인해주세요."
        );
      } else {
        userStore.setError("빈 PDF 파일이거나 읽을 수 없는 파일입니다.");
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      userStore.setError("PDF 파일을 처리하는 중 오류가 발생했습니다.");
    } finally {
      userStore.setLoading(false);
      // 성공적으로 분석이 끝나도 파일 입력은 유지 (결과 확인 후 "다른 파일 분석하기"로 초기화)
    }
  };
  reader.readAsArrayBuffer(fileToProcess);
}

// 분석 버튼 클릭 이벤트 핸들러
async function onAnalyzeClick() {
  if (analyzeButtonText.value === "다른 파일 분석하기") {
    // "다른 파일 분석하기" 상태일 때 버튼 클릭 시
    userStore.setUsers([]); // 결과 데이터 초기화
    userStore.setError(""); // 에러 메시지 초기화
    fileInputModel.value = null; // v-file-input 선택된 파일 초기화
  } else if (fileInputModel.value) {
    // "분석하기" 상태이고 파일이 선택되어 있을 때
    await performActualFileAnalysis(fileInputModel.value);
  }
}

// PDF 텍스트를 파싱하여 사용자 정보 배열로 변환하는 함수 (이전 단계에서 작성한 내용)
function parseTextToUsers(text) {
  const users = [];
  if (!text || text.trim() === "") {
    console.warn("parseTextToUsers: 입력된 텍스트가 비어있습니다.");
    return users;
  }
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const headerPattern =
    "회원 이름 등급 ( 모임 참여 횟수 ) 최종 접속일 최종 참여일 자기소개 내용";
  let dataString = normalizedText;
  if (normalizedText.startsWith(headerPattern)) {
    dataString = normalizedText.substring(headerPattern.length).trim();
  } else {
    console.warn("parseTextToUsers: 예상된 헤더 패턴을 찾지 못했습니다.");
  }
  if (!dataString) return users;

  const userEntryRegex =
    /(.+?)\s+(\d+)\s+((?:방금|(?:\d+\s*시간)|(?:\d+\s*분))\s*전)\s+(\d{4}\/\d{2}\/\d{2})\s+(.*?)(?=\s+[가-힣A-Za-z]+(?:\s*\(.*?\))?\s+\d+\s+(?:방금|(?:\d+\s*시간)|(?:\d+\s*분))\s*전|$)/g;
  let match;
  while ((match = userEntryRegex.exec(dataString)) !== null) {
    try {
      users.push({
        name: match[1].trim(),
        grade: parseInt(match[2]),
        lastLogin: match[3].trim(),
        lastParticipation: match[4].trim(),
        intro: match[5].trim(),
      });
    } catch (e) {
      console.error("parseTextToUsers: 레코드 처리 중 오류:", match[0], e);
    }
  }
  if (users.length === 0 && dataString.length > 0) {
    console.warn(
      "parseTextToUsers: 데이터 문자열이 있었으나 유효한 사용자 정보를 추출하지 못했습니다."
    );
    // userStore.setError("PDF에서 유효한 회원 정보를 찾지 못했습니다. 파일 형식이 다르거나 내용 추출에 실패했습니다."); // 이 부분은 performActualFileAnalysis에서 처리
  }
  return users;
}

// 예시 PDF 처리 (실제 파일 없이 더미 데이터 사용)
function processExamplePDF() {
  userStore.setLoading(true);
  userStore.setError("");
  userStore.setUsers([]); // 기존 사용자 데이터 초기화
  fileInputModel.value = null; // 파일 입력도 초기화

  setTimeout(() => {
    const dummyUsers = [
      {
        name: "김철수",
        grade: 5,
        lastLogin: "2024-05-15",
        lastParticipation: "2024-05-10",
        intro: "Vue를 좋아합니다.",
      },
      {
        name: "이영희",
        grade: 3,
        lastLogin: "2024-05-20",
        lastParticipation: "2024-05-18",
        intro: "Vuetify 전문가입니다.",
      },
      {
        name: "박지성",
        grade: 5,
        lastLogin: "2024-04-30",
        lastParticipation: "2024-04-25",
        intro: "축구를 잘합니다.",
      },
    ];
    userStore.setUsers(dummyUsers);
    userStore.setLoading(false);
  }, 1000);
}
</script>

<style lang="scss" scoped>
@use "@/assets/scss/variables.scss" as *;
.v-container {
  padding: 0;
  .file-upload-wrap {
    display: flex;
    flex-direction: column;
    box-shadow: none;
    padding: 16px;
    gap: 8px;
    .pdf-insert-card {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      padding: 16px;
      @include table-outline-and-box;
      :deep(.v-input--density-default) {
        --v-input-control-height: 100% !important;
      }
      :deep(.v-input) {
        .v-input__control {
          .v-field {
            .v-field__field {
              .v-label {
                display: none;
              }
              .v-field__input {
                padding: 0;
              }
            }
            .v-field__outline {
              border-style: none !important;
            }
          }
        }
      }
    }
    :deep(.v-card-text) {
      .v-input {
        height: 100%;
        .v-input__prepend {
          display: none;
        }
        .v-input__control {
          .v-field {
            padding: 0;
          }
          .v-field__field {
            background-color: #fff !important;
            border-bottom-color: unset !important;
          }
        }
        .v-input__details {
          display: none;
        }
      }
    }
    .card-btn-wrap {
      flex-direction: column;
      padding: 0;
      min-height: unset;
      .file-insert-btn {
        background-color: $main;
        color: $white;
        width: 100%;
        font-weight: bold;
        border-radius: 10px;
      }
    }
  }
}
.main-title {
  padding: 0;
  @include text-container-header;
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
