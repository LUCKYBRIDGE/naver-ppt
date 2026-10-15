# Player 소유 전환 요청과 준비 후 확정

- 목적: PRDv5 §6/8/11/14/24/30·FR-004/005/008·IMPL-T-28. 기존 학생 화면/미디어를 유지한 채 Player가 목표를 준비하고 같은 요청만 원자 확정한다.
- 승인: 제품 완성 지속 개발·인수인계의 다음 전환 보호 과제.
- 계약: pending 요청은 발표 선택과 분리해 IndexedDB 세션/receipt와 함께 저장한다. 요청ID·목표 문서/쪽·원본지문·기존선택·목표닫힘·목표checkpoint표식·지정Player context ID를 고정한다. 요청/취소/실패는 현재 미디어를 건드리지 않고 확정 때만 기존 전환 규칙을 적용한다. 지정된 현재 소유Player만 확정/실패 가능하며 새 Player는 이전 context 요청을 확정할 수 없다. 백업의 새 수업 복구는 pending을 제거한다.
- 범위: 1단계는 저장/명령/소유권 계약과 실제Whale RPC·worker재기동·원본/현재화면 유지 검증이다. 기존 RemoteUI는 현재 선행검사를 유지한다. 2단계에서 Player 준비표면/미디어·취소/rollback·Remote UX/직접전환명령 입장을 연결한다. 계약만으로 전체 안전전환 완료라 하지 않는다.
- 보존: 원본/bytes·노트/파일명은 pending에 넣지 않는다. optional 상태필드만 추가해 이전 세션/백업 읽기를 유지하고 엄격 검증한다. context ID는 실행 인증 표식이며 파일 권한을 저장하지 않는다. 추가권한/라이브러리/서버/커밋/배포 없음.

## 단계와 인수
1. [x] 순수pending/목표표식·요청/취소/확정/실패·경합무효화와strict record/backup복구.
2. [x] runtime명령validator/role·현재소유Player/context일치,소유권교체/중복/CAS시험.
3. [x] 실제Whale저장/worker재시작·화면보존/부적격창거부·원자확정/취소/새수업복구,check/문서·인수인계.
4. [x] Player분리표면의실제준비·활성표면교체/미디어수명,Remote UX와기존직접전환입장차단.
   - [x] 정상 Remote 요청 → Player 공개 목표/숨긴 표면 준비 → 같은 DOM/native 승격. 취소/누락/새 owner/응답 유실·닫힌 명시 쪽·Whale 회귀. [근거](../pptx/PREPARED_SCENE.md).
   - [x] 기존 직접 PPTX 전환 명령 입장 차단과 기존 검증 경로 이행.
     - SessionHub의 직렬 큐 안에서 저장된 대상 형식을 읽어 ACTIVATE_DOCUMENT/GOTO_SLIDE/REOPEN_DOCUMENT 및 현재 PPTX의 ADVANCE_AUTOPLAY를 거부한다. PDF와 core 내부 COMMIT은 유지한다. 이전 raw 명령 receipt도 화면 변경 권한으로 재사용하지 않는다. 실제 발표 시험은 정상 Remote 요청/Player 준비로 옮기고 메타데이터 계약 전용 fixture는 준비 인수와 구분한다.
5. [ ] 원본누락/변조·worker실패/창닫기·재시작/백업·닫힌자료다른쪽/PDF대안/대용량성능·물리/전체인수.

## 2026-10-14 직접 전환 입장 검증

SessionHub에서 raw PPTX 활성화/페이지 이동/재개와 현재 PPTX의 자동 넘김을 거부한다. 거부는 pending/세션/receipt/발행을 바꾸지 않고 기존 raw receipt도 권한으로 재사용하지 않는다. PDF 전환과 core 내부 COMMIT은 유지한다. check09:35:17 96파일/1,356tests·빌드 PASS, 실제 Whale UI/미지원 직접 거부 및 교사/내장/PDF/owner/checkpoint/전환 계약 회귀 PASS. [정확한 근거](../pptx/TRANSITION_ADMISSION.md).

대용량52쪽의 새 정상 전환은 기능상 작동했지만 표본 WorkingSet 1,640,394,752bytes 및 단계 관측 추가 실행1,620,353,024bytes로 기존1.5GiB 기준을 모두 초과했다. 5단계 성능은 실패/미완료다. 기준을 올리거나 후속 통과 표본만 선택하지 않는다. [다음 성능 과제](../pptx/TRANSITION_ADMISSION.md).

## 1단계 최종 근거와 다음 경계
- check08:46:55: 94파일/1,344tests·타입/Vite/MV3/5스킬PASS. 신규20개와strict ownundefined/prototype·공개목표조회권한assert를포함한다. 실제Whale최종RPC1791935221159 exit0:pending/owner·worker재시작·현재PDF/무음음원유지·취소/늦은확정/새owner거부·명시쪽재개/새수업복구·노트없는목표조회. [상세](../TEST_RESULTS.md).
- GET_PRESENTATION_TARGET은지정owner/정확한request에공개용목표snapshot만반환한다. 과거run/request/자동넘김·타이머는제외하고미디어는paused로투영한다. 원본파일명/교사노트는반환하지않는다. 조회와실제현재발표는독립이다.
- 다음연결에는Player자신의context ID를CLAIM응답으로받는경로와Remote의현재owner조회/요청이필요하다. Player는공개targetSnapshot의sourceFingerprint/pptx.slideIds/미디어참조로준비하고teacher세션/노트를조회하지않는다. 준비동안현재표면/재생을그대로유지하며정확한pending이확정된뒤같은준비표면/자산을활성화한다. 새window의이전context pending은보류/취소·새요청으로다룬다.
- 기존RemoteUI는여전히선행검사후기존직접명령을사용한다. 이번RPC계약은실제준비consumer/직접명령차단으로연결되지않았다. report.playerPreparationIntegrated=false를유지하고전체안전전환/Stage완료를선언하지않는다.

## 2단계 구현 방향
- 동일한 scene key(수업/문서/쪽)로현재표면과숨긴준비표면을관리한다. 확정때준비된PptxView/DOM/native미디어를그대로활성화해재파싱/재마운트하지않는다. 준비중에는effect명령·transport쓰기·native재생/checkpoint를금지한다.
- Player가GET_TARGET의공개투영을조회하고SVG 이미지decode·fonts.ready·연결미디어의native data준비를확인한뒤정확한COMMIT을보낸다. 취소/거부/경합은준비표면만해제한다. 응답불명확때는저장상태를재조회하고현재표면/준비자산을임의삭제하지않는다.
- CLAIM응답은자기context ID를포함하고Remote는현재소유Player 조회후REQUEST를보낸다. 새window의이전pending은실행하지않는다. 정상UI통합검증이끝난뒤기존직접전환입장차단을연결하며그전에는전체완료로부르지않는다.
