# 완료 효과의 영속 상태
- PRD v5 Stage A/D/F, FR-004와 자료 전환·복구 계약. 아직 PPTX renderer/UI 활성화가 아니다.
- `core/animationPose.ts`는 기존 pose 구조/검증을 DOM 없이 보유한다. adapter의 기존 API는 re-export로 유지한다.
- optional document.pptxPlayback은 checkpoints(슬라이드 ID별 완료 값)와 run(진행 회차 또는 null)이다. checkpoint exact 필드는 renderer=`web-ppt-0.4.5/transform-v1`, SHA256 fingerprint, completedGroups1..5000, pose다. 페이지별5000/자료별10000 pose entries 상한. 원본 bytes/이미지/노트는 넣지 않는다.
- BEGIN_PPTX_GROUP는 Player의 commandId를 epoch로 지정한다. 새 BEGIN은 미완료 run만 대체한다. CHECKPOINT_PPTX_GROUP는 활성 PPTX/페이지·epoch·revision·지문·pose scope·이전 완료+1을 검사하고 run=null로 끝낸다. RESET_PPTX_SLIDE는 Remote만 선택 페이지를 초기화한다.
- 실제 확장 background 경계의 BEGIN/CHECKPOINT는 생존 PlayerAuthority 소유자 검사에 연결했다. core/Hub 검증과 브라우저 sender/owner 검증은 서로 다른 경계다.
- 자료/페이지 전환과 현재/전체 종료는 진행 run만 무효화하고 완료 pose를 보존한다. Editor 탐색/노트는 발표 run을 정지하지 않는다. 원래 회차의 늦은 완료는 돌아온 자료에서도 거부한다.
- 공개 Player snapshot에는 선택한 PPTX checkpoint/run과 지문만 복사한다. 파일명·교사 노트/다른 페이지 pose는 공개하지 않는다.
- 저장 pose의 과거 session revision은 보존한다. `restoredPptxCheckpointPose`는 같은 원본 지문·renderer·세션/자료/슬라이드와 과거 revision을 검증한 후 새 공개 revision으로 clone한다. adapter apply의 exact scope 검사를 우회하지 않는다.

## 검증
- check2026-10-12 21:43:49: 46파일604tests·TypeScript/Vite/MV3/5스킬 PASS. 새 통합21개: CAS/순차 완료, A→B→A, 진행 교체, Editor 독립, reset/페이지·종료, source/scope/renderer/CSS/epoch 거부, snapshot clone·비공개 보호, 저장 재접속/중복 receipt/commit 실패.
- Whale5.39.412.57 headless 전용 profile `node_modules/.cache/pptx-checkpoint/1791809022771/profile`: 실제 IndexedDB 저장→A/B/A→정상 브라우저 종료/재실행→완료 pose와 revision5/receipt5 일치 PASS. Editor 완료 요청 FORBIDDEN/늦은 run INVALID_TARGET 확인.
- 이 native 시험은 localhost의 제품 core/Hub/repository bundle과 합성 metadata를 사용한다. 실제 PPTX 효과에서 캡처한 pose나 확장 owner sender 경계의 end-to-end 검증은 아니다. 실제 crash/절전·강제종료·가시 다중창은 별도다.
- 초기 시험은 revision0 생성 제약을 어긴 fixture와 TypeScript union narrowing을 수정 후 통과했다. native launch 기본 인수로 웨일이 종료되어 기존 프로젝트의 명시 프로필/transport 인수로 교체 후 통과했다. 전역 하네스 변경은 하지 않았다.

## 다음 연결
- 실제 Worker model/완료 그룹 수/원본 target 검사 및 Player 렌더러 수명과 이 계약을 연결한다. 원본 effect ID·렌더러 버전 변경 시 checkpoint 무효화 기준을 확인한다.
- ACK 이전에 화면의 완료 checkpoint를 확정하지 않고 실패 시 기존 완료 상태와 재시도 정보를 보존해야 한다.
- 현행 세션 `.wcp.json` 가져오기/내보내기는 PDF 전용 그대로다. 이번 optional IndexedDB 필드를 PPTX 백업 지원으로 홍보하지 않는다. 기존 필드 없는 schema1 기록은 호환된다.

## 재현
```powershell
& 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/verify-whale-pptx-checkpoint.mjs 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
```
