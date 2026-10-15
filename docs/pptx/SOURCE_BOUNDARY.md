# PPTX 원본 연결 경계

2026-10-12 22:22, Stage D/F · FR-004. 일반 PPTX UI/지원은 아직 미활성이다.

## 계약
- `readPptxInput`: `.pptx`, 정수 크기 4bytes..128MB, ZIP local header, 전체 읽기 길이, SHA256을 확인한다. 비동기 읽기/해시 전후 AbortSignal을 검사한다.
- 이 header/hash 확인은 안전한 ZIP이나 충실도 증거가 아니다. 렌더러는 기존 isolated package/XML/Worker envelope/SVG 검사를 별도로 실행해야 한다. PPT/SHOW를 PPTX로 취급하지 않는다.
- `pptxSourceVault`: 기존 SourceVault를 PPTX 검증 함수와 전용 `naver-ppt-pptx-source-v1` 채널로 사용한다. PDF/media 기본 검증과 채널은 그대로다.
- 메모리 File은 16개/합계512MB/파일128MB 한도를 재사용한다. 별도 handle store에는 사용자가 제공한 핸들만 기록한다. 세션/백업에 원본 bytes를 추가하지 않는다.
- cold handle/채널 수신은 원본 SHA256을 다시 계산한다. 수신자가 상대방의 fingerprint 문자열만 믿지 않는다. 캐시된 File은 immutable이며 런타임에만 존재한다.
- 현재 SourceVault의 원본 없음 문구에 PDF가 남아 있다. 제품 PPTX UI 연결 전 형식별 안내를 정리해야 하며, 현재 경계는 일반 UI에 아직 사용되지 않는다.

## 검증
- check 22:20:16: 50파일660tests/TypeScript/Vite/MV3/5스킬 PASS. 신규 단위9개: 이름과 무관한 내용 지문/위장·크기·부분 읽기/취소·핸들만 저장/변경된 원본·PDF 경계 보존·없는 참조.
- 첫 check의 테스트는 모두 통과했으나 새 테스트 store의 `key` 타입 누락으로 typecheck가 실패했다. SourceHandleStore 타입을 명시한 뒤 전체 check가 통과했다.
- 실제 Whale5.39.412.57 headless owner1791811295375: Editor의 합성 PPTX File → 메모리 채널 → Player 재해시 → Worker 모델/5효과 → 실제 runtime strict ACK/DB, A/B/A 복귀와 새 Player 재연결/재파싱/pose 복원 PASS.
- 유효한 수신 캐시 채널을 닫아 격리한 후, Editor가 바뀐 bytes와 이전 fingerprint를 보내는 조건에서 새 Player가 원본 변경을 거부했다. 수업 전체 상태가 실패 전후 동일했다. 정확한 원본 재연결 지문도 동일했다.
- 기존 duplicate/다른 창·수업 거부, worker 재시작, receipt/reset/승계 회귀 PASS. 복원 스크린샷 직접 확인.

## 미실시
- 실제 OS chooser/핸들 권한 만료·파일 이동/브라우저 전체 재시작의 이 통합 경로, 실제 교사 자료/PowerPoint 충실도 비교는 미실시다. unit fake handle은 물리 검증이 아니다.
- 일반 import/등록과 preflight 결과, renderer 역량 고지/Player UI 연결이 다음이다. 지원 승격 조건은 변경하지 않는다.
- 재현은 [Runtime Renderer](RUNTIME_RENDERER.md)의 owner verifier를 사용한다. 사용자 원본은 변경·복사·업로드하지 않았다.
