<template>
  <v-container>
    <v-card>
      <v-card-title>회원 정보 PDF 업로드</v-card-title>
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
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

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

// PDF 텍스트를 파싱하여 사용자 정보 배열로 변환하는 함수 (매우 단순한 예시)
// 실제 구현 시에는 PDF의 구체적인 텍스트 구조에 맞춰 정교한 파싱 로직이 필요합니다.
function parseTextToUsers(text) {
  const users = [];
  // 예시: "이름: 홍길동 / 등급: 3 / 최종 접속일: 2024-05-01 / 최종 참여일: 2024-04-20 / 자기소개: 안녕하세요."
  // 위와 같은 형식의 텍스트 라인이 있다고 가정합니다.
  const lines = text.split("\n");
  lines.forEach((line) => {
    try {
      // 이름 추출 (예시: "회원 이름: 홍길동" 또는 단순히 "이름: 홍길동")
      const nameMatch = line.match(/(?:회원 이름|이름)\s*:\s*([^\/]+)/);
      // 등급 추출 (예시: "등급 (모임 참여 횟수): 5" 또는 "등급: 5")
      const gradeMatch = line.match(
        /(?:등급(?: \(모임 참여 횟수\))?)\s*:\s*(\d+)/
      );
      // 최종 접속일 추출 (예시: "최종 접속일: YYYY-MM-DD")
      const lastLoginMatch = line.match(
        /최종 접속일\s*:\s*(\d{4}-\d{2}-\d{2})/
      );
      // 최종 참여일 추출 (예시: "최종 참여일: YYYY-MM-DD")
      const lastParticipationMatch = line.match(
        /최종 참여일\s*:\s*(\d{4}-\d{2}-\d{2})/
      );
      // 자기소개 추출 (예시: "자기소개 내용: 안녕하세요.")
      const introMatch = line.match(/(?:자기소개 내용|자기소개)\s*:\s*(.+)/);

      if (
        nameMatch &&
        gradeMatch &&
        lastLoginMatch &&
        lastParticipationMatch &&
        introMatch
      ) {
        users.push({
          name: nameMatch[1].trim(),
          grade: parseInt(gradeMatch[1]),
          lastLogin: lastLoginMatch[1].trim(),
          lastParticipation: lastParticipationMatch[1].trim(),
          intro: introMatch[1].trim(),
        });
      }
    } catch (e) {
      console.warn("Error parsing line: ", line, e);
      // 파싱 중 오류가 발생해도 다른 라인 처리를 계속합니다.
    }
  });
  return users;
}

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

<style scoped>
/* 필요한 경우 스타일 추가 */
</style>
