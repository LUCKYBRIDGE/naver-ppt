# PPTX 콘텐츠 타입과 미디어 헤더
- 목표: 렌더러 비교 전에 각 항목의 MIME 선언과 알려진 미디어 헤더를 교차 검사한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. plan-feature/adapter-validation 적용.
- 완료 기준: 중복·누락·매크로 타입 선언 거부, 기본 타입과 override 해석, PNG/WAV/MP4 등 알려진 헤더 대조, 실제 웨일 교사 자료와 합성 미디어 회귀. 없는 항목의 잔여 override는 위험 타입/중복/경로 검사 후 경고 개수로 기록한다.
- 하지 않는 것: 전체 코덱/미디어 구조 검증, 원본 충실도 판정, 제품 PPTX 활성화, CPU Worker 격리.
## 영향 범위
- src/adapters/pptx/contentTypes.ts, packageGuard.ts, 단위 테스트, 격리 비교 스크립트와 검증 문서.
- 위험: 특수 MIME 선언은 보수적으로 거부되거나 미검증 개수로 남을 수 있다. 헤더 일치만으로 재생·안전을 보장하지 않는다.
## 단계
1. [x] MIME 선언과 미디어 헤더 검사, 자동 check: 36파일335tests/TS/Vite/MV3 PASS(07:59).
2. [x] 실제 Whale 교사 profile1791759605373/미디어1791759584304에서 회귀 검증, 헤더81+미검증1/헤더5+잔여선언2 및 초기 실패와 제한 기록(TEST_RESULTS08:00).
## 근거
- OPC 콘텐츠 타입: https://learn.microsoft.com/en-us/previous-versions/windows/desktop/opc/open-packaging-conventions-overview
- PNG signature: https://www.w3.org/TR/PNG-Structure.html
- WAV/MP3/MP4/WebM의 초기 헤더 기준은 기존 src/media/input.ts와 동일한 범위이며 전체 디코더 검증이 아니다.
- 실제 검증에서 PptxGenJS 합성 미디어의 없는 slideMaster2/3 선언을 발견했다. 실제 bytes나 슬라이드를 만들지 않는 잔여 선언만 경고로 처리하며 내부 관계의 없는 대상 거부는 유지한다.
