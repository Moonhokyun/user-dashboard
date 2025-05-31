<template>
  <v-container>
    <v-card>
      <v-card-title class="main-title"
        >정보 확인을 위한 파일을 첨부하세요</v-card-title
      >
      <v-card-text>
        <v-file-input
          label="PDF 파일을 선택하세요"
          accept=".pdf"
          prepend-icon="mdi-file-pdf-box"
          show-size
          :loading="userStore.isLoading"
          :disabled="userStore.isLoading"
          @change="handleFileUpload"
          :error-messages="userStore.errorMeessage"
        ></v-file-input>

        <v-progress-linear
          v-if="userStore.isLoading"
          indeterminate
          color="primary"
          class="mt-4"
        ></v-progress-linear>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="processExamplePDF"
          :disabled="userStore.isLoading"
        >
          (예시) 더미 데이터로 처리
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useUserStore } from "@/stores/userStore";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
// pdf.js 워커 설정 (Vite 환경에서는 아래와 같이 import.meta.url을 사용할 수 있습니다)
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
// 또는 로컬에 워커 파일을 두고 경로를 지정할 수도 있습니다.
// vite-plugin-static-copy 등을 사용해 public 폴더로 복사 후 경로 지정 가능
// 우선은 CDN을 사용하거나, 아래와 같이 vite에서 직접 worker를 불러오는 방식을 시도해볼 수 있습니다.
// (주의: Vite에서 pdf.worker.js를 올바르게 제공하기 위한 추가 설정이 필요할 수 있습니다.
//  가장 간단한 방법은 public 폴더에 pdf.worker.min.js 파일을 두고 그 경로를 사용하는 것입니다.)

// public 폴더에 pdf.worker.min.js 파일을 복사해두고 아래와 같이 경로를 설정하는 것을 권장합니다.
// 예: /pdf.worker.min.js (public 폴더 최상위에 두었을 경우)
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
// 만약 public 폴더에 pdfjs-dist/build/pdf.worker.min.js를 복사했다면,
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url
// ).toString();

// 더 간단한 방법으로, pdfjs-dist/legacy/build/pdf.worker.js를 사용할 수도 있습니다.
// npm install --save-dev vite-plugin-static-copy (필요 시)
// 그리고 vite.config.js 에 publicDir: 'public' (기본값) 확인
// public/pdfjs 폴더를 만들고 그 안에 node_modules/pdfjs-dist/build/pdf.worker.min.js 파일을 복사합니다.
// 그런 다음 아래와 같이 설정:
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const userStore = useUserStore();

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    userStore.setError(""); // 파일 선택 취소 시 오류 메시지 초기화
    return;
  }

  if (file.type !== "application/pdf") {
    userStore.setError("PDF 파일만 업로드 가능합니다.");
    return;
  }

  userStore.setLoading(true);
  userStore.setError(""); // 이전 오류 메시지 초기화
  userStore.setUsers([]); // 이전 사용자 데이터 초기화

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      let allText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // textContent.items 배열의 각 항목은 텍스트 조각(item.str)을 포함합니다.
        allText += textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      // --- 여기서부터 텍스트 파싱 로직이 필요합니다 ---
      // 예시: console.log(allText) 로 추출된 전체 텍스트를 확인해보세요.
      // 실제 정보 추출 로직은 PDF의 내용과 구조에 따라 매우 달라집니다.
      // 정규 표현식, 키워드 검색 등을 활용하여 필요한 정보를 추출해야 합니다.
      console.log("--- Extracted Text ---");
      console.log(allText);
      console.log("----------------------");

      // 임시로 더미 데이터 생성 로직 호출 (실제로는 allText를 파싱해야 함)
      const parsedUsers = parseTextToUsers(allText); // 아래에 이 함수를 정의합니다.
      if (parsedUsers.length === 0 && pdf.numPages > 0) {
        // 파싱 결과가 없지만 PDF에 내용이 있는 경우, 파싱 실패로 간주
        userStore.setError(
          "PDF에서 유효한 회원 정보를 추출하지 못했습니다. 파일 내용을 확인해주세요."
        );
      } else if (parsedUsers.length > 0) {
        userStore.setUsers(parsedUsers);
      } else if (pdf.numPages === 0) {
        userStore.setError("빈 PDF 파일이거나 읽을 수 없는 파일입니다.");
      }
      // userStore.setUsers([
      //   { name: '임시 유저 1', grade: 1, lastLogin: '2024-01-01', lastParticipation: '2024-01-01', intro: '소개1' },
      //   { name: '임시 유저 2', grade: 2, lastLogin: '2024-02-02', lastParticipation: '2024-02-01', intro: '소개2' }
      // ])
    } catch (error) {
      console.error("Error processing PDF:", error);
      userStore.setError("PDF 파일을 처리하는 중 오류가 발생했습니다.");
    } finally {
      userStore.setLoading(false);
      // 파일 입력 초기화 (동일한 파일 재업로드 가능하도록)
      event.target.value = null;
    }
  };
  reader.readAsArrayBuffer(file);
}

// PDF 텍스트를 파싱하여 사용자 정보 배열로 변환하는 함수
// src/components/FileUpload.vue 의 <script setup> 내부

// ... (다른 import 및 userStore 선언 등은 이전과 동일)

// PDF 텍스트를 파싱하여 사용자 정보 배열로 변환하는 함수
function parseTextToUsers(text) {
  const users = [];
  if (!text || text.trim() === "") {
    console.warn("parseTextToUsers: 입력된 텍스트가 비어있습니다.");
    return users;
  }

  // 1. 텍스트 정규화: 여러 공백을 하나로, 앞뒤 공백 제거
  const normalizedText = text.replace(/\s+/g, " ").trim();
  console.log("Normalized Text:", normalizedText);

  // 2. 헤더 문자열 정의 (실제 추출된 헤더와 일치해야 함)
  // 주의: "( 모임 참여 횟수 )" 부분의 괄호 앞뒤 공백이 정규화된 텍스트와 일치하는지 확인 필요
  const headerPattern =
    "회원 이름 등급 ( 모임 참여 횟수 ) 최종 접속일 최종 참여일 자기소개 내용";

  let dataString = normalizedText;
  if (normalizedText.startsWith(headerPattern)) {
    dataString = normalizedText.substring(headerPattern.length).trim();
  } else {
    console.warn(
      "parseTextToUsers: 예상된 헤더 패턴을 찾지 못했습니다. 전체 텍스트를 데이터로 간주합니다."
    );
    // 헤더가 없거나 다를 경우에 대한 처리 (예: 오류 반환 또는 다른 방식 시도)
  }
  console.log("Data String (after header removal):", dataString);

  if (!dataString) {
    return users;
  }

  // 3. 데이터 레코드 추출 및 필드 파싱
  // 각 레코드를 식별하기 위한 정규표현식
  // 패턴: (이름) (숫자) (시간관련문자열) (날짜 YYYY/MM/DD) (나머지 자기소개)
  // 이름: 최대한 많은 문자 (단, 다음 패턴 시작 전까지)
  // 자기소개: 다음 이름과 숫자 패턴이 나오기 전까지의 모든 문자

  // 정규표현식 설명:
  // 1. `(.+?)`: 이름 (비탐욕적 매칭, 그룹 1) - 하나 이상의 문자
  // 2. `\s+`: 하나 이상의 공백
  // 3. `(\d+)`: 등급 (숫자, 그룹 2)
  // 4. `\s+`: 하나 이상의 공백
  // 5. `((?:방금|(?:\d+\s*시간)|(?:\d+\s*분))\s*전)`: 최종 접속일 (예: "방금 전", "1 시간 전", 그룹 3)
  // 6. `\s+`: 하나 이상의 공백
  // 7. `(\d{4}\/\d{2}\/\d{2})`: 최종 참여일 (YYYY/MM/DD 형식, 그룹 4)
  // 8. `\s+`: 하나 이상의 공백
  // 9. `(.*?)`: 자기소개 (비탐욕적 매칭, 그룹 5)
  // 10. `(?= ... |$)`: 다음 사용자 레코드의 시작 패턴 또는 문자열의 끝을 확인 (Positive Lookahead)
  //     다음 사용자 레코드 시작 패턴: 공백 + 이름_패턴 + 공백 + 숫자 (등급)
  //     이름_패턴: `[가-힣A-Za-z]+(?:\s*\(.*?\))?` - 한글/영문자로 시작, 선택적으로 괄호와 내용 포함
  const userEntryRegex =
    /(.+?)\s+(\d+)\s+((?:방금|(?:\d+\s*시간)|(?:\d+\s*분))\s*전)\s+(\d{4}\/\d{2}\/\d{2})\s+(.*?)(?=\s+[가-힣A-Za-z]+(?:\s*\(.*?\))?\s+\d+\s+(?:방금|(?:\d+\s*시간)|(?:\d+\s*분))\s*전|$)/g;

  let match;
  while ((match = userEntryRegex.exec(dataString)) !== null) {
    try {
      const name = match[1].trim();
      const grade = parseInt(match[2]);
      const lastLogin = match[3].trim();
      const lastParticipation = match[4].trim();
      const intro = match[5].trim();

      if (name && !isNaN(grade)) {
        users.push({
          name,
          grade,
          lastLogin,
          lastParticipation,
          intro,
        });
      } else {
        console.warn(
          "parseTextToUsers: 유효하지 않은 데이터로 레코드를 건너뜁니다.",
          match[0]
        );
      }
    } catch (e) {
      console.error("parseTextToUsers: 레코드 처리 중 오류:", match[0], e);
    }
  }

  if (users.length === 0 && dataString.length > 0) {
    console.warn(
      "parseTextToUsers: 데이터 문자열이 있었으나 유효한 사용자 정보를 추출하지 못했습니다."
    );
    userStore.setError(
      "PDF에서 유효한 회원 정보를 찾지 못했습니다. 파일 형식이 다르거나 내용 추출에 실패했습니다."
    );
  } else if (users.length > 0) {
    userStore.setError(""); // 성공 시 이전 오류 메시지 초기화
  }

  return users;
}

// ... (handleFileUpload, processExamplePDF 등 나머지 코드는 이전과 동일하게 유지)
// handleFileUpload 함수 내부에서 parseTextToUsers(allText)를 호출하는 부분 확인

// 예시 PDF 처리 (실제 파일 없이 더미 데이터 사용)
function processExamplePDF() {
  userStore.setLoading(true);
  userStore.setError("");
  // 더미 데이터 생성
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
      {
        name: "손흥민",
        grade: 1,
        lastLogin: "2024-05-25",
        lastParticipation: "2024-05-22",
        intro: "안녕하세요, 반갑습니다.",
      },
      {
        name: "BTS",
        grade: 3,
        lastLogin: "2024-03-15",
        lastParticipation: "2024-03-10",
        intro: "음악을 사랑합니다.",
      },
    ];
    userStore.setUsers(dummyUsers);
    userStore.setLoading(false);
  }, 1500);
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/variables.scss";
.main-title {
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
