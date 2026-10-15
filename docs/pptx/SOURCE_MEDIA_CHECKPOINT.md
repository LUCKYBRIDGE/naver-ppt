# 원본 미디어 실행 결과의 영속 저장

2026-10-13 09:22. PRD §11/14/24/25, FR-005/013/014. 원본 타이밍/native 실행 연결에 필요한 Player 전용 결과 저장 경계를 구현했다. 원본 클릭 자동재생 연결 완료는 아니다.

## 메시지와 소유권

`CHECKPOINT_PPTX_MEDIA`는 기존 session/document/slide/revision/commandId에 mediaId, epoch(PPTX run), expectedMediaEpoch(string|null), playback, timeSec, paused, ended를 담는다. exact 필드·유효 타입을 검사하며 원문명령/native handle/파일 bytes는 전달하지 않는다. Player 전용이고 background의 실제 sender session/documentId·getContexts/Web Locks 기반 소유권 gate를 통과한다. `createPptxPlayerTransport`도 이 명령과 공개 snapshot ACK를 허용한다.

reducer는 현재 발표 선택과 PPTX run epoch/slide, 같은 원본의 등록 내장 ref, 기존 bookmark epoch, 현재 MediaPlayback 전체 일치, native 결과의 구간/종료 상태를 함께 확인한다. 일반 CHECKPOINT_MEDIA의 ‘정지 bookmark를 다시 시작하지 못함’ 경계를 완화하지 않는다. 성공 시 bookmark.epoch/positionEpoch=commandId, sourceRunEpoch=현재 PPTX run을 기록하며 그룹 완료 cursor는 바꾸지 않는다. strict commit/receipt 뒤 ACK와 publication이 이루어진다.

진행중 CANCEL은 현재 run이 시작한 미디어만 paused로 바꾼다. BEGIN의 이전 run 교체도 해당 미디어를 정지한다. RESET은 현재쪽 source 표식이 있는 미디어를 정지한다. 성공 그룹 ACK 또는 완료 뒤 CANCEL은 계속 재생하는 완료 회차 미디어를 정지하지 않는다. Remote pause/resume/seek 또는 구간 변경으로 새 재생 회차가 만들어지면 이전 source 소유 표식을 제거한다. 음량만 변경한 경우에는 source 소유권을 유지하되 변경 전 설정의 늦은 결과를 거부한다. 자료 교차/종료는 기존 전체 정지 경로다.

`MediaBookmark.sourceRunEpoch?`는 작은 optional ID이며 strict record는 PPTX 내장 ref와 bookmark epoch가 있을 때만 허용한다. 백업 원문 검증에서는 보존하지만 새 세션 복구에서는 제거하고 paused=true로 만든다. 과거 source 명령을 복구 때 실행하지 않는다. schema1 optional 호환이며 기존 파일에는 필수가 아니다. native 실행 성공과 저장 성공은 별도다. 호출자는 실패/취소 때 해당 native handle을 정리해야 한다.

## 검증과 제한

- 신규22개, 81파일 **1,153tests**·타입/빌드/MV3/5스킬 PASS(check09:20:25 시작, exit0). run/media/settings/원본/대상 불일치·취소/교체/끝난그룹·Remote 회차·volume 변경·exact 메시지/역할·strict record/복구·DB중복/ACK transport를 검사했다. 초기 DB fixture의 revision0 생성 조건과 테스트 helper의 넓은 union 타입을 수정했다.
- 실제 Whale5.39.412.57 headless 내장 `node_modules/.cache/whale-pptx-embedded-media/1791850866864/result.json` exit0. 실제 native 영상0.500185초 재생 수락 후 소유 Player 결과 commit; Editor/Remote FORBIDDEN, 중복 Player NOT_PLAYER_OWNER. 음량만 .65로 바꾼 뒤 source 표식 유지/CANCEL→native paused, 늦은 새 결과 INVALID_TARGET, 과거 receipt 재응답 후 정지 유지, bundle 복구 paused/표식 제거 PASS. sourceTimelineConnected=false로 기록했다.
- 같은 실행에서 원본설정/기존전체내장·구간/crop/효과·worker/교차/새Player/백업/viewport, 외부0/pageerror0/원본hash불변 PASS. 첫 시험의 구간종료 checkpoint와 settings 명령 STALE_REVISION 충돌은 명시 거부일 때만 같은 commandId로 최대3회 최신 revision 재시도로 보완했다. 알 수 없는 실패는 재시도하지 않는다.
- 교사 제품PPTX `node_modules/.cache/whale-pptx-player/1791850786808/result.json` exit0:23쪽12효과·Remote/취소/재시도/worker/독립편집/overlay/교차/복원/백업5viewport PASS. foundation `node_modules/.cache/whale-foundation/profile-1791850786972/verification-result.json` exit0:기존 PDF/미디어/소유권/저장/종료/복구 회귀 PASS. 이 두 실행 뒤 추가한 volume-only source 표식 보존 보완은 단위 및 최종 내장 실행으로 확인했다.

다음은 source 그룹/조건/설정 준비 결과를 native Player handle에 연결하고 이 명령을 실제 source 실행 완료 callback에서 호출하는 것이다. 자신의 native 결과 ACK가 LocalMediaPlayer에서 불필요한 play/seek로 재적용되지 않도록 처리해야 한다. concurrent/seek/복합조건·실제10종/PowerPoint기준/물리 인수와 Stage A~G 최종 기준은 계속 미완료다. 커밋/배포 없음.
