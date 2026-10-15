# 일반 PPTX 실험 등록과 비공개 미리보기
- 목표: 준비 helper 대신 제품 Editor의 명시적 실험 입력으로 PPTX를 등록·재연결하고 비공개 탐색/노트를 사용한다.
- 승인: PRD v5 제품 완성 요청의 기존 범위. 전체 구현은 단계적으로 진행한다.
- 완료 기준: opt-in 없이 기존 PDF만 허용, 공통Import dispatch/strict 등록ACK, 취소·세션변경 늦은결과차단, 원본지문·등록UUID 기반 비공개렌더, 현재Player/Editor독립, 제품UI 실제Whale 검증.
- 제한: PPTX 원본충실도/내장미디어는미확인. PPTX overlay 편집·Player layer 연결은 후속 필수작업으로 유지하고 현재지원으로표시하지 않는다.

## 영향 범위
- adapters/documentImport·DocumentImportControls: 형식선택/실험gate/lazy PPTX/취소/재연결.
- pptx/privatePreview·editor/RegisteredPptxPreview·Editor: 등록ID 바인딩/렌더수명/노트/형식별 UI.
- 단위테스트·verify-whale-pptx-player: helper등록/재연결 제거 및 실제UI 회귀.

## 단계
1. [x] 공통Import와 명시적실험 gate/취소·원본재연결을 구현한다.
2. [x] 등록PPTX 비공개미리보기와 노트/형식별편집경계를 연결한다.
3. [x] 자동검증/실제Whale UI 등록→Remote→백업복구·재연결/비공개노트를 검증한다. (814tests·빌드/PPTX1791826400096·foundation1791826254333 PASS)
4. [x] 근거와 인수인계/다음 필수 overlay 연결을 기록한다. ([근거](../pptx/PRODUCT_IMPORT.md))
