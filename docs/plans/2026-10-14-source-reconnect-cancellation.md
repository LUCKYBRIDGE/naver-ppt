# 원본 재연결 대기 취소 전파

- 목표: 취소/창 해제 뒤의 handle·broadcast·validator 결과가 새 준비나 vault cache에 늦게 반영되지 않게 한다. 현재 발표·원본·다른 소비자는 보존한다.
- 승인 근거: 지속 개발/최신 인수인계·PRD v5 §6/11/14/16/24/28/30·FR-004/008·IMPL-T-28.
- 범위: SourceVault.get optional signal, 요청별 내부 controller/close 취소, validator signal 전달, broadcast timer/listener 정리, await 경계마다 재검증. 기존 signal 없는 caller 동작과 fingerprint/한도는 유지한다.
- PPTX identity는 queued native gate 취소를 받아야 하며 active File 읽기의 실제 완료까지 reservation을 유지한다. readPptxInput의 실패/취소 scratch만 정리하고 성공 반환 bytes는 보존한다.
- caller: PptxView/usePptxDocumentSource/RegisteredPptxPreview의 기존 controller를 get까지 전달한다. UI 준비 중 native gate 대기를 실제 취소하고 현재PDF/음원·원본/상태를 검증한다.
- 호출 검색에서 PPTX 내장연결·PDF 표시/내보내기의 기존 controller도 get 앞에서 끊겨 있었다. 그 signal을 전달하고 LocalMediaPlayer의 effect 수명 controller도 get에 연결한다. PDF/media validator의 실제 파일 읽기는 계속 끝날 수 있지만 취소 뒤 vault 반영/DOM 생성은 막는다. 관련 native/PDF 회귀를 다시 확인한다.
- 위험: 다른 소비자/cache를 삭제하거나 abort를 원본 누락 오류로 삼키는 것, 늦은 getFile/validator의 cache 반영, listener/timer 누수, close 후 늦은 재입장. DB/RPC/schema·원본/권한/품질/재생 정책 변경은 없다.

## 단계
1. [x] API/수명 연결·cached/handle/File/validator/broadcast/close/다른소비자 unit·빌드.
2. [x] 실제 native gate와 SourceVault/Remote 취소·현재PDF/음원·읽기0/Worker0/원본 보존.
3. [x] PDF/PPTX/native/저장·재연결 회귀와 문서/인수인계 갱신. 전체 byte예산/성능/PRD Stage A~G 목표 유지.

최종1,403tests/빌드·native queued Remote취소/5경로·저장/PDF/내장/교사회귀·초기시험실패와별도남은인수는[증거](../pptx/SOURCE_CANCELLATION.md)를따른다. 메모리성능완료로축소하지않는다.
