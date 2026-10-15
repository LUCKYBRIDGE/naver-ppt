# 오버레이 편집과 확정
- 목표: PDF 위 글상자/판서/가리개를 독립 draft로 편집하고 commit 후에만 학생 화면에 표시한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: 정규화 좌표/원본 픽셀 분리, 글꼴 실제 측정/최대 fit/overflow 경고, revision·저장 후 공개, undo/redo·삭제·이동·크기 변경, 실제 PDF 브라우저 화면 검증.
- 전체 목표: 이 단위는 Stage B 일부이며 저장/종료/미디어/후속 포맷/Whale 인수는 계속 남는다.

## 영향
- overlays: 순수 검증/줄바꿈/fit 및 실제 canvas draw/편집 UI.
- core/messages/storage: SET_SLIDE_OVERLAYS 전체 draft 원자 확정, unknown 입력과 정상화 범위/분량 검사.
- PdfView: 원본 비율에 고정된 별도 surface와 공개/비공개 layer. 원본은 바꾸지 않는다.
- Editor: draft 중 탐색 잠금, 취소/확정 실패 보존. lucide-react 1.55.0 ISC 아이콘(로컬 번들) 채택.
- 위험: 글꼴/IME/캔버스 배율/페이지 전환 경합/overlay payload/저장 실패/학생 정보 노출.

## 단계
1. [x] core/unknown/store 검증과 draft commit 테스트.
2. [x] 실제 글꼴 기준 줄바꿈/최대 크기/캔버스 레이어.
3. [x] 편집 도구/좌표·undo/redo·속성/확정 연결.
4. [x] check 및 실제 PDF 보조 브라우저 검증, Whale 제한과 다음 작업 기록.

2026-10-11: 88개 자동 테스트, 실제 PDF dev/build+CSP 보조 흐름 통과. 제한은 TEST_RESULTS.md. Player 빠른 진입·길게 누르기/실제 IME·터치/형광펜·순서 UI/폰트·export 일치와 Whale 인수는 후속이며 FR/Stage B 전체 완료를 뜻하지 않는다.
