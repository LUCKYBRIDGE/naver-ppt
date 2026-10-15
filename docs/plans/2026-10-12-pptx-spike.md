# PPTX 후보 로컬 실행 비교
- 목표: PRD §7.2/24 Stage D에 따라 두 렌더러 배포본의 로컬 웨일 실행과 지원 경계를 비교한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 고정 버전·라이선스·번들 크기, 동일 합성 PPTX의 웨일 화면/텍스트/이미지 증거, 외부 통신 차단 결과, 재현 명령과 미검증 항목 기록.
- 하지 않는 것: 후보 채택/제품 의존성 추가/실제 교사 10종 인수 완료 선언. 미디어·타임라인 원본 재현은 별도 근거가 필요하다.
## 영향 범위
- scripts/verify-whale-pptx-spike.mjs 및 tests/fixtures/createPptx.mjs: 격리된 비교 실험.
- node_modules/.cache/pptx-spike: 고정 배포본과 합성 샘플/스크린샷만 저장, 기존 파일 삭제 없음.
- docs: 결과/지원 수준/라이선스 기록. 제품 manifest/권한/상태 계약은 변경하지 않는다.
- 위험: 외부 코드 실행은 별도 profile, 합성 자료, 통신 차단으로 제한. npm lifecycle scripts 실행하지 않는다.
## 단계
1. [x] 두 고정 배포본/라이선스/API/번들 확인: aiden1.3.0, preview1.0.7, tarball SHA512 검증. preview 라이선스 표기 충돌 발견.
2. [x] 동일 합성 자료의 실제 웨일 로컬 렌더 비교 및 결과 기록: profile1791750300862, aiden 표시/이동 PASS, preview 첫쪽 background 예외. docs/pptx/INITIAL_COMPARISON.md. Stage D 전체는 미완료.
## 후속 인수
- 추가 실험(2026-10-12 07:33) 완료: MIT office-kit core0.24.0/preview0.15.0 및 fflate0.8.3 고정tarball. preview peer버전을 확인해 core수정, Vite browser entry 격리번들792516bytes. SVG Blob/image decode·한글/표/이동·노트추출/스크린샷 PASS. foreignObject Canvas taint로 pixel readback 제한, 원본충실도/제품채택 미검증.
- 실제 교사용 10종 이상, PowerPoint 원본 비교, 텍스트/사진/표/영상/음원/노트/효과/폰트, 미디어·동작·오프라인·성능·보안 비교 후 선정.
