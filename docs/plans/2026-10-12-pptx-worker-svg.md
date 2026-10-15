# PPTX Worker SVG 출력 대조
- 목표: 후보 파서뿐 아니라 정적 SVG 출력도 DOM 없는 Worker에서 생성 가능한지 확인한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: office Worker 전페이지 SVG hash/크기, 본 화면 전페이지 결과 대조, 선택4쪽/합성 전페이지 Worker SVG 이미지 decode와 수명 정리.
- 하지 않는 것: 효과 재생, 전체 모델 제품 전달, 안전 검사 전체 Worker화, 원본 PowerPoint 충실도 판정/후보 채택.
## 영향 범위
- 후보 Worker fixture, 격리 비교 스크립트, 검증/인수인계 문서.
- 위험: Worker와 본 화면의 글꼴 측정 차이, 생성 SVG 출력 크기 및 foreignObject Canvas taint. 원본 텍스트/SVG를 검증 로그에 넣지 않는다.
## 단계
1. [x] Worker SVG 생성과 hash 대조, check345tests/TS/Vite/MV3 PASS(08:14).
2. [x] 실제 Whale 교사 profile1791760440213 전23쪽/선택4쪽 decode와 미디어1791760476184 전3쪽/3개 decode PASS. 원본 충실도/효과 재생/제품 연결은 미완료(TEST_RESULTS08:15).
