# Remote PPTX 요청 계약

2026-10-13. PRD v5 §11/24, FR-002/005/014 후속 구현.

## 구현
- Remote의 REQUEST_PPTX_GROUP는 현재 발표 PPTX/쪽/revision·지문을 검사하고 optional pptxPlayback.request={commandId,slideId}|null을 strict 저장한다. 요청/run 중 추가 요청은 거부한다.
- 소유 Player의 BEGIN_REQUESTED_PPTX_GROUP는 정확한 requestId를 새로운 commandId로 원자적으로 소비하고 run을 시작한다. 직접 BEGIN으로 대기 요청을 우회할 수 없다.
- Remote CANCEL_PPTX_GROUP는 요청/run만 무효화하고 완료 pose를 보존한다. RESET은 별도 초기화다. 자료/쪽 전환·종료는 요청을 무효화하며 Editor 탐색/노트는 유지한다.
- 공개 snapshot은 현재 요청만 clone한다. 원본/노트/프레임 추가 저장은 없다. 기존 optional 필드 없는 레코드는 호환된다.

## 근거
- check 2026-10-12 23:59:58: 60파일/780tests·TypeScript/Vite/MV3/5스킬 PASS. 신규26개는 원자 소비/취소/늦은 BEGIN·완료/전환/Editor 독립/strict 레코드/DB 재연결·중복 receipt/commit 실패를 검사한다. 초기 fixture의 넓은 반환형 때문에 발생한 TypeScript 오류는 Extract 타입으로 좁혀 수정했다.
- 실제 Whale5.39.412.57 headless verify-whale-pptx-player profile1791817147765: 제품 background Remote 요청/중복 receipt/공개 조회, Editor·중복 Player 거부, 소유 Player 소비, 취소 후 늦은 BEGIN 거부 PASS.
- 같은 시험에서 기존 교사23쪽/12클릭 완료/PDF 교차/새 Player 복원/Editor 선택 유지/5viewport/pageerror0/원본 SHA256 불변 PASS. 원본 준비 helper만 주입했고 renderer/engine은 제품 dist다.
- 변경후 foundation profile1791817217698: PDF/편집·노트/저장·복원·종료/자동넘김/native muted WAV·합성H.264/소유권·worker재시작 회귀 PASS.

## 이전 중간 상태
2026-10-13 00:22 후속: durablePlayback.play(requestId?)와 runtime 전달/Player transport 허용을 연결했다. 현재 snapshot 요청 ID/쪽이 맞을 때만 BEGIN_REQUESTED를 보내며 ACK 전에 native 효과를 시작하지 않는다. runtime.cancel은 invalidate 후 마지막 확정 pose를 복원한다. 신규3개(정상 소비·잘못된/없는 ID·소비 commit 전 취소)/총783tests·빌드 PASS. 실제 Remote UI의 자동 호출은 아직 없다.

Remote 버튼과 durablePlayback 요청 소비는 미연결이다. 이번 시험은 API 계약이며 제품 Remote UI 완료가 아니다. 새 Player의 과거 대기 요청 자동 실행 금지·명시적 재개, 소진/실패 보고·재시도, 진행 취소 WAAPI 정리가 다음 단계다.

일반 PPTX 등록은 비활성이며 unverified 유지. 원본 PowerPoint 충실도/추가 실제 자료/내장 미디어·편집·백업/물리 교실 인수는 별도 미완료다. headless·합성·OPFS chooser 대체 검증을 물리 실사용으로 해석하지 않는다.

## Remote UI 연결 검증 — 2026-10-13
- Remote `PptxEffectControls`의 다음 효과/취소 → 영속 요청 → 소유 Player `PptxRequests` → runtime.play(requestId) → strict 완료 checkpoint를 연결했다. 중복 시도/실패 자동 재시도는 막고 명시적 취소와 새 요청으로 재시도한다.
- 새 Player/view가 시작할 때 존재하는 요청은 보류한다. 원본 준비 중 나중에 도착한 요청은 준비 후 한 번만 소비한다. 취소는 native WAAPI를 정리하고 마지막 완료 pose를 복원하며, 늦은 Promise 완료는 안내와 상태를 덮지 못한다.
- 완료/실패/보류/취소/효과 소진 안내는 `{status,revision}`만 담은 수업/자료/쪽별 로컬 BroadcastChannel로 전달한다. 이 채널은 실행 권한을 부여하지 않는다. 효과 소진 시 페이지를 유지하며 다음 페이지 이동을 안내한다.
- `scripts/dev.ps1 check` 2026-10-13 01:30:58: 61파일/791tests·TypeScript/Vite/MV3/5스킬 PASS. 신규8개는 역사적 요청 보류/준비 중 새 요청/중복/실패 취소 후 새 ID/실행 취소와 늦은 완료/완료 ACK 대기 중 오취소 방지/소진/이탈/안내 입력 경계를 검사한다. 첫 타입 검사에서 선택 필드에 undefined를 대입한 오류를 수정했다.
- 실제 Windows Whale5.39.412.57 headless 제품 dist, profile1791823852936의 result.json PASS: Remote UI 교사23쪽/원본12클릭그룹 완료, 중복 receipt, Editor/중복 Player 실행 거부, 새 Player 과거 요청 보류와 취소 후 늦은 BEGIN 거부, PDF 교차/완료 pose 복귀/새 Player 복원, Editor 선택 유지, 소진 시 쪽 불변, Player·Remote 5viewport 무가로넘침, Remote 키보드 focus, pageerror0, 원본 SHA256 불변.
- 같은 시험의 명시적 실패 주입: 한 번의 BEGIN 응답 오류 → Remote 실패 안내 → 취소 후 새 ID 재요청. 취소 관측을 위해 native animation playbackRate만 일시적으로 .01로 낮춘 별도 구간에서 WAAPI 정리/완료 checkpoint1 보존/visibility 복원을 확인했다. 해당 구간 중 CDP 제품 service worker stopped→running과 Remote 취소도 PASS. 이후 원래 WAAPI 함수를 복원하고 원본12그룹 완료를 검증했다. 실패·취소 관측 조건을 원본 시간 충실도 검증으로 해석하지 않는다.
- `node_modules/.cache/whale-pptx-player/1791823852936/remote-380.png`와 `player-restored.png`를 생성했으며 Remote380 화면을 직접 확인했다. 원본 등록 helper만 주입했으며 renderer/Player/Remote는 제품 코드다. 일반 파일 등록 UI와 구별한다.
- 위 미연결 설명은 이전 시점 기록이다. 이 요청 계획은 완료했지만 일반 PPTX 등록·편집·백업·내장 미디어, PowerPoint 기준 충실도·추가9종/물리 교실 인수, PRD 전체 완성은 미완료이며 **PPTX unverified**를 유지한다.
