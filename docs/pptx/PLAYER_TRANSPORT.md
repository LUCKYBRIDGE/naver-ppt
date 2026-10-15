# 제품 Player transport와 실제 소유자 경계
- 2026-10-12 22:06, PRD v5 Stage A/D/F·FR-004. 제품 PPTX renderer/UI 활성화는 아직 아니다.
- `player/pptxTransport.ts`는 기존 runtime sendSessionRequest를 사용하는 bridge transport다. 연결된 공개 snapshot이 없거나 수업이 바뀌면 **요청 전** 차단하고 BEGIN/CHECKPOINT만 전달한다. RESET/교사 명령은 전달하지 않는다.
- ACK는 Player 종류/수업 ID·안전 정수 revision 및 명령보다 높은 durable revision을 확인한다. subscription이 먼저 더 높은 revision을 받았다면 과거 ACK로 공개 상태를 덮지 않는다. 요청/응답과 snapshot은 clone한다. runtime의 역할·소유권/저장 오류는 완료 ACK로 바꾸지 않는다.
- 공개 snapshot 내용은 제품 background의 기존 공개 projection을 사용한다. 새 백업/원본 복제/권한/의존성을 추가하지 않았다.

## 검증
- check22:05:40: 48파일640tests·TypeScript/Vite/MV3/프로젝트5스킬 PASS. 새 transport14개: 세션/명령/공개종류/revision·late ACK·clone·permission/storage failure·연결없음/수업변경 요청전 차단.
- 실제 Whale5.39.412.57 headless profile `node_modules/.cache/whale-pptx-owner/1791810345762/profile`: built dist를 ignored 격리확장으로 복제하고 **실제 제품 background, Player/Editor/Remote URL와 sender.documentId, getContexts/Web Locks, strict owner DB**를 사용했다. 시험용 transport 모듈만 추가했고 사용자 dist/설치설정은 바꾸지 않았다.
- 소유 Player가 실제 runtime BEGIN→CHECKPOINT를 transport로 전송하고 공개 ACK/완료1·중복 command receipt PASS. 공개 ACK에 합성 교사 노트가 없음 확인.
- 중복 Player의 BEGIN/CHECKPOINT는 NOT_PLAYER_OWNER, Editor/Remote/다른수업Player의 BEGIN/CHECKPOINT는 FORBIDDEN. 거부 전후 세션 불변 PASS.
- 실제 제품 worker만 CDP로 stop→stopped→starting→running 확인. 완료 checkpoint·수업 전체 불변/원래owner 유지, duplicate 거부·receipt 재전송 PASS. 워커 메모리가 완료 상태의 유일한 저장소가 아니다.
- A→B→A 이후 이전 진행 epoch의 완료는 INVALID_TARGET. RESET는Player FORBIDDEN/Remote 성공·선택 checkpoint/run만 초기화. 원래 Player 정상 닫힘 후 중복창의 소유권 승계·BEGIN 성공 PASS.
- 처음 native 모듈 시험은 Vite library의 React 환경 상수가 미정의여서 실패했다. 시험용 bundle에 production 상수를 정의한 후 통과했다. 초기 단위 mock의 응답 union 타입도 보정 후 전체 check 통과.

## 미검증
- 이 시험의 pose는 합성 metadata다. 실제 원본 효과 캡처·DB·재파싱 복원은 PLAYBACK_BRIDGE의 별도 시험이며, 아직 둘을 하나의 실제 제품 Player UI 경로로 연결하지 않았다.
- 비정상 브라우저 crash/절전·물리 다중창/IME/스피커·원본 PowerPoint 충실도·실제10종 비교는 미완료다. PPTX unverified 유지.

## 재현
```powershell
& 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/verify-whale-pptx-owner.mjs 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
```
