# PPTX Remote 효과 요청
- 목표: Remote가 요청한 한 그룹을 소유 Player만 실행하고 취소·자료 전환 뒤 늦은 실행을 거부한다.
- 근거: PRD v5 §11/24, FR-002/005/014, 기존 PPTX 완료 checkpoint 계약.
- 완료 기준: strict DB 요청/receipt 유지, 요청 ID 원자적 소비, 취소 후 완료 pose 유지, 실제 Whale Remote UI 검증.
- 하지 않는 것: 일반 PPTX 지원 승격, 원본 업로드·복제, 고급 효과 충실도 확정.

## 영향 범위
- `src/core/commands.ts`, `pptxPlayback.ts`, `session.ts`, `playerSnapshot.ts`: 영속 요청과 소비/취소 계약.
- `src/shared/sessionMessages.ts`, `src/storage/validateSessionRecord.ts`, `src/background/index.ts`: 정확한 필드·역할·소유자 검증.
- 이후 `src/remote/Remote.tsx`, `src/player/PptxView.tsx`, `src/adapters/pptx/durablePlayback.ts`: 화면/실행 연결.
- 위험: 취소 후 늦은 BEGIN, 이중 클릭, 새 Player에서 대기 요청의 무단 재생, Worker 재시작.

## 단계
1. [x] 요청/소비/취소 상태와 공개 projection, strict DB/권한을 구현하고 통합 테스트한다. (780tests·빌드 및 실제 Whale API 경계 PASS)
2. [x] Remote 제어와 Player 요청 소비를 연결한다. 새 Player 시작 시 이전 대기 요청은 자동 실행하지 않고 명시적 취소 후 새 요청을 요구한다. (791tests·빌드 PASS)
3. [x] 실제 Whale에서 Remote 요청·취소·자료 교차·새 Player·worker 재시작을 검증한다. (profile1791823852936, 제품 dist Remote/Player)
4. [x] 결과/제한과 인수인계 기록을 갱신한다. (REMOTE_REQUEST.md 후속 기록)

## 결정
- 요청은 `{commandId, slideId}` metadata만 저장하며 원본/노트/프레임은 포함하지 않는다.
- `BEGIN_REQUESTED_PPTX_GROUP`는 정확한 requestId가 남아 있을 때만 소비한다. 직접 Player BEGIN은 대기 요청이 있으면 거부한다.
- `CANCEL_PPTX_GROUP`는 요청/진행 run만 없애고 완료 checkpoint는 보존한다. RESET은 별도의 초기화다.
- 단계 1만 통과하면 API 계약 검증으로 기록하며 Remote 제품 기능 완료로 보고하지 않는다.
- 2026-10-13 후속: `PptxRequests`는 view 생성 당시 요청을 보류하고 새 요청 ID를 한 번만 시도한다. source 준비 중 도착한 새 요청은 준비 후 소비한다. 취소/늦은 완료/ACK 순서 역전은 확정 checkpoint 기준으로 처리한다.
- Remote 진행 안내는 extension origin의 수업/자료/쪽별 BroadcastChannel에 `{status,revision}`만 전달한다. 일시적인 UI 안내이며 명령·소유권·영속 상태 근거로 쓰지 않는다. Remote 재연결은 query로 최신 안내만 받는다.
- 실패·과거 요청은 명시적 취소 후 다시 요청한다. 소진 시 페이지를 자동 이동하지 않는다. 일반 PPTX 등록·편집·백업/내장 미디어와 원본 충실도는 별도 후속이다.
