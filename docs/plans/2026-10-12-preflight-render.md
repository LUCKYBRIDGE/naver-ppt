# PDF 실제 렌더 점검
- 목표: 검사 페이지를 기존 PdfRenderer로 실제 Canvas에 렌더해 읽기만 성공한 상태와 구분한다.
- 승인: 전체제품 개발/포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 모든 검사쪽 렌더 후만 renderedPages 증거, 렌더실패/취소 미성공·cleanup/한도, 이미지+폰트 fixture 실제Whale.
- 영향: browser PdfRenderer/1024×768·기존DPR2·LRU3/64MB/8MP, summary renderedPages/contractv3·DPR key, 결과표시/테스트.
- 범위: 렌더 성공은 원본pixel 비교/폰트 누락·대체/모든효과 충실도를 증명하지 않는다. 실물 및전체StageC는 후속.
## 단계
1. [x] 렌더·결과/실패·캐시/cleanup 테스트/check: 33파일278tests, TypeScript/Vite/MV3/5스킬 PASS(05:25).
2. [x] 실제Whale 합성 bitmap/Helvetica fixture·8/8 Canvas 결과·범위/보호·기록: profile1791750160201 PASS, 380px 직접 확인. 실제 교사 원본/폰트 대체 여부 비교는 미실시.
