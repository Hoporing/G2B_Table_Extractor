# G2B_Table_Extractor

나라장터(G2B) 계약 목록 Table 전체를 Excel 파일로 추출하는 Chrome Extension.

---

## 실행 화면

![Demo](docs/demo.gif)
<!-- Demo GIF 또는 Screenshot 추가 후 위 경로 업데이트 -->

---

## 주요 기능

- 나라장터 계약 목록 페이지의 Table 전체 자동 추출
- MutationObserver로 페이지 Update 감지 후 Data 수집
- 전체 Page Scroll 후 누락 없이 모든 Row 수집
- XLSX 형식으로 즉시 Download

---

## 설치

1. Chrome → `chrome://extensions/` → 개발자 모드 ON
2. "압축해제된 확장 프로그램을 로드합니다" → 이 폴더 선택

---

## 사용법

나라장터 계약 목록 페이지에서 Extension Icon 클릭 → Excel Download

---

## License

본 프로젝트 소스코드는 [MIT License](LICENSE)를 따릅니다.  
[SheetJS Community Edition](https://sheetjs.com/) 포함.
