# PPTX 제품 Player 재생 경로
- 목표: 등록된 PPTX 원본/고유ID를 실제 Player에서 렌더하고 원본 효과 그룹·확정 checkpoint를 복원한다.
- 완료 기준: 실제 웨일 제품 경로에서 제공 자료의 클릭 그룹과 A/B/A 복원, 잘못된 원본/늦은 결과 거부를 확인한다.
- 하지 않는 것: 미검증 미디어/고급효과 supported 승격, 일반 PPTX import 활성화 전 완료 선언.
- 승인: 제품 완성까지 로컬 개발 승인.

## 영향 범위
- guarded source/model loader 재사용, runtime adapter, Player source dispatch/비공개 최소 projection.
- 고정 viewer-core0.4.5, 라이선스/빌드.
- 단위/실제 웨일 verifier.
- 위험: 재생 중 snapshot revision·렌더 재시작·선택 전환·asset 누수·학생 화면의 비공개 정보.

## 단계
1. [x] 원본 parser/자산 loader 공통화 및 등록 ID runtime 연결.
2. [x] 실제 엔진/checkpoint·선택 변경 정리/Player 경로 연결.
3. [x] 자동/빌드·실제 웨일 재생/복원/원본 보존 확인.
4. [x] 제한/다음 통합과 결과 기록.

## 열린 질문
- 일반 UI 등록/Remote 효과 제어·내장 미디어·PPTX 백업/충실도는 후속.
