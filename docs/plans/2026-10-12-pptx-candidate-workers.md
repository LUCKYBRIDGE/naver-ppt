# PPTX 후보 파서 Worker 실험
- 목표: 후보 엔진의 DOM 없는 파싱 가능성과 실제 자료의 효과 모델 보존 범위를 확인한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 고정 로컬 후보를 실제 Whale module Worker에서 실행, 원본 버퍼 보존·15초 제한·cleanup, 본 화면의 페이지/모델 요약과 대조, 효과 정보와 재생 성공을 구분해 기록.
- 하지 않는 것: 렌더러 채택, Worker 모델을 제품 Player에 연결, DOMParser 검사 대체, PowerPoint 효과 충실도 판정.
## 영향 범위
- tests/fixtures/pptxCandidateWorker.mjs, 기존 격리 비교 스크립트와 검증 문서.
- 위험: 후보는 DOM/모듈 구조 때문에 실패할 수 있다. 실패를 supported로 승격하지 않는다. 사용자 텍스트/주소는 요약에 넣지 않는다.
## 단계
1. [x] Worker 실험과 모델/효과 요약 비교 연결, 자동 check345tests/TS/Vite/MV3 PASS(08:09).
2. [x] 실제 교사23쪽 profile1791760229591/미디어1791760250343에서 office Worker/본 화면·원본 XML count 일치. aiden DOMParser Worker 실패를 기록했다(TEST_RESULTS08:11/WORKER_TIMING.md). 후보 채택·제품·효과 재생 완료는 아니다.
