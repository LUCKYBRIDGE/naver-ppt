# 초기 설계 결정

- ADR-2026-10-14-RESOURCE-INVENTORY: 현재 모듈 realm에서 source 수명별 숫자만 관측하고 File/Blob/본문/지문은 저장하지 않는다. 공유 source와 alias는 중복 합산하지 않되 두 realm 합은 논리 관측으로만 표시한다. physical/model heap과 전체 origin byte admission은 별도 근거가 생길 때까지 null/미완료로 유지한다. [근거](pptx/RESOURCE_INVENTORY.md).

- ADR-2026-10-14-BORROWED-URL: 준비/binding/hash검증한PPTX native미디어는stable URLfactory와독립source retain lease로같은ownedURL을쓴다. borrower는직접revoke하지않고src정리뒤release,최종owner만폐기한다. 일반file URL은유지하고logicalcount감소를physical성능해결로확대하지않는다. [근거](pptx/BORROWED_MEDIA_URL.md).

- ADR-2026-10-14-SOURCE-CANCEL: SourceVault get은consumer별취소를독립관리하고physical읽기완료와구분한다. 늦은결과/close는cache를쓰지않고다른소비자·새연결을보존한다. PPTX gate대기는signal로취소하되active physical읽기의reservation은실제완료까지유지한다. DB/RPC/schema와원본정책은같다. [근거](pptx/SOURCE_CANCELLATION.md).

- ADR-2026-10-14-PREP-ADMISSION: 무거운PPTX준비는같은extension origin의exclusive Web Locks로직렬화한다. 준비진입점전체를묶고내부helper재입장/readylease입장을피한다. active읽기결과전달전예약을해제하지않고API부재는failclosed,현재발표source/품질은보존한다. 이결정은모델누적byte예산/단일자료성능FAIL을대체하지않는다. [근거](pptx/PREPARATION_ADMISSION.md).

- ADR-2026-10-14-PRIVATE-BUFFERS: 검증된 private scratch는 사용 완료 후 선택형 transfer(0)으로 소비한다. default helper caller bytes와 다른 part/view·원본 File/Blob은 보존하고 API 부재/실패는 기존 동작을 유지한다. 임시 backing 감소를 전체 WorkingSet 인수로 확대하지 않으며 최신 성능 FAIL을 보존한다. [근거와 회귀](pptx/PRIVATE_BUFFERS.md).

- ADR-2026-10-14-INFLIGHT-SOURCE: 진행중모델준비는같은실행창의정확한File객체만공유한다. 작업signal과소비자signal/예약lease를분리해개별취소가상대/현재발표를중단하지않게하며최종소비자종료만해제한다. failure/늦은자산·해제된publication은재사용하지않는다. 전역admission/메모리인수는별도이며latest성능FAIL을보존한다. [근거](pptx/INFLIGHT_SOURCE.md).

- ADR-2026-10-14-SOURCE-REUSE: 쪽별편집draft초기화를유지한채선택자료하나의source lease를보유해동일File모델을재사용한다. guarded Blob/File성공identity는WeakMap숫자/참조로만공유하고실패/다른객체·소유권/nativemetadata는재검증한다. nativepreload는원인확정없이바꾸지않고실험표본통과를전역한도/최종인수로확대하지않는다. [근거](pptx/SOURCE_REUSE_MEMORY.md).

- ADR-2026-10-14-TRANSITION-ADMISSION: 준비 없는 PPTX 직접 전환과 자동 넘김은 SessionHub 저장 큐에서 거부하고 core 내부 COMMIT/PDF를 유지한다. 거부에 receipt를 만들거나 과거 receipt로 우회하지 않는다. 실제 대용량 메모리 기준 초과는 기능 회귀 통과와 분리해 FAIL로 유지하고 예산을 올려 통과시키지 않는다. [근거](pptx/TRANSITION_ADMISSION.md).

- ADR-2026-10-14-PREPARED-SCENE: 목표 준비는 Player에서 수행하고 같은 key DOM/native 미디어를 확정 때 활성화한다. Remote 중복 파싱을 대체하며 비공개 정보·쓰기/재생을 준비 표면에 주지 않는다. 불명확 COMMIT은 자산 폐기 대신 저장 상태로 조정한다. 전체 안전 전환 판정은 직접 명령 차단 이후로 유지한다. [근거](pptx/PREPARED_SCENE.md).

- ADR-2026-10-14-TRANSITION-COMMIT: 전환요청은발표선택과분리된optional 영속pending으로저장하고지정live Player context·현재owner WebLock 아래에서같은요청만확정한다. 새Player에과거요청을자동실행하지않고새수업backup복구는제거한다. 목표는공개용projection만조회하고교사노트/원본bytes는pending/목표응답에넣지않는다. 1단계저장/인증검증을실제준비표면/직접명령입장완료로해석하지않는다. [계획](plans/2026-10-14-player-transition-commit.md).

- ADR-2026-10-14-BACKGROUND: 실제 원본/PDF 비교에서 확인한 core0.4.5 bgRef index clamp 오류는 고정 source hash와 교체 지점을 검증하는 빌드 transform으로 수정한다. node_modules/원본을 고치거나 모든 배경을 흰색으로 덮지 않는다. 0/1000·일반 fill·배경 fill을 정확히 선택하고 범위오류만 재전파한다. MIT 원문/변경고지 유지, 최종 엔진 선정·지원 승격은 별도다. [근거](plans/2026-10-14-pptx-background-reference.md).

- ADR-2026-10-14-LOCALMEDIA: 외부 호환 audio/video 참조의 Target은 읽지 않고 동일 원본 도형의 명시적 내부 p14 사본만 검증해 src누락 모델을 보완한다. 내부 참조끼리 충돌하면 거부하고 기존 sourcehash/등록파일대조·재생소유권을 유지한다. 메모리비용은 동일File준비모델공유·전용입력transfer·largepart원본size/hash근거 후중복buffer해제로 줄인다. 원본앱과외부/내장사본의동일성·전체원본타이밍지원은선언하지않는다. [실물근거](pptx/TEACHER_02.md).

- ADR-2026-10-13-MEDIA64: 사용자의 한도 확대 제안에 따라 알려진 내장 MP3/WAV/MP4/WebM과 해당 모델 MIME만64MiB로 확대한다. 일반32MiB/XML4MiB/총256MiB/입력128MiB/ratio·경로guard는 유지한다. 실제98MB원본 등록/52쪽 모델·native57MB MP3 metadata/자산해제·PDF복귀와 메모리표본 약1.45GiB를 확인했다. 원본의 외부 호환 참조/p14내장참조를 모델이 연결하지 못한 문제는 재생 미완료로 남기고 외부 접근으로 우회하지 않는다. [근거](pptx/TEACHER_02.md).

- ADR-2026-10-13-P03: 미지원 회전·확대 binding 실패는 효과를 삭제해 우회하지 않고 신규 등록 전에 같은 검증기로 쪽별 경고한다. 자동 정적 fallback은 entrance 정답을 드러낼 수 있어 사용하지 않는다. 원본 앱/PDF 별도 자료 준비를 안내하며 실패 쪽의 빈 표면·Remote 보호/대안 연결·재연결 재검사는 미완료로 남긴다. 실제 합성Whale 재현과 [근거](pptx/DEGRADATION_PREFLIGHT.md). 기존 명령·저장 schema/권한 변화 없음.

- ADR-039 (2026-10-12): 비교한 후보 중 web-ppt core0.4.5를 제품의 opt-in **모델 진단 Worker만** 위해 고정한다. 원본guard 뒤 실행/숫자만 반환/ready·15초·취소/라이선스 동봉. 일반 렌더러/발표 채택과 지원승격은 별도. 실제1종·합성/소스 근거로 모델검사는 가능하지만 PowerPoint충실도/추가9종 없이 supported 불가. [근거](pptx/PRODUCT_MODEL_WORKER.md).

- ADR-038 (2026-10-12): 등록fast 검사결과는 새로운세션스키마가 아니라Import반환값/teacher실행메모리로 연결한다. 신규parser페이지수와 재연결의새hash증거를 구분하며 예전페이지수를이번검사pass로 재사용하지 않는다. strict등록확인전 성공표시없음. 정밀·캐시는 별도다.

- ADR-037 (2026-10-12): Preflight는 내용유실을 숨기지 않도록 pass/warning/unknown/error를 구분한다. 부분페이지 읽기/metadata만으로 전체 Visual/Media/Behavior/Offline 성공을 만들지 않는다. 선택자료 manual 검사로 실제 경계를 먼저 연결하고 현재환경 결과는 teacher 메모리에만 둔다. Import fast 검사 기존경로 유지, 등록시경고·전체정밀/캐시와실물근거 후속. 검사는 발표/편집/원본을 변경하지 않는다.

- ADR-036 (2026-10-12): 타이머 알림 자동 시도는 완료 epoch의 strict claim 이후 Player에서만 실행한다. 중복/재연결 재알림을 막는 at-most-once 정책이며 claim후crash의 소리 유실은 허용 가능한 명시 한계다. 실제소리성공을 durableclaim으로 주장하지 않는다. 재생거부는 현재Player 명시 재시도, 백업복원은 과거 완료 알림 억제. 기본soundfalse/visible독립, 로컬WebAudio/새권한·패키지없음. 실제스피커는 별도 인수다.

- ADR-035 (2026-10-12): 타이머 위치는 픽셀/모니터 좌표 대신 optional0..1 anchor로 저장한다. Remote의 별도 위치 적용만 commit하며 실행 epoch/시간을 바꾸지 않는다. Player inset12px와 자체 크기 transform으로 모든 모서리를 viewport 내부로 유지한다. 시간 재설정도 위치는 보존한다. 동일 위치를 선택한 타이머는 자동 재배치하지 않는다.255tests/actualWhale 두 viewport 네모서리/재시작 PASS, 직접drag·소리·물리시험은 후속.

- ADR-034 (2026-10-12): 타이머는 수업 globalTimer와 각 document.timer로 분리한다. legacy document globalTimer는 명시 조작 때 이관한다. 매초 저장/worker 장기 실행 없이 시작 시각+누적 경과를 Player가 계산한다. 완료는 생존 소유 Player만 FINISH_TIMER를 제출하며 epoch/revision/deadline 검증 후 strict 저장한다. 백업은 exportedAt 경과를 포함해 정지 복원한다.252tests/actualWhale 범위·Remote닫힘·완료·중복거부·정상재시작 PASS. 소리·위치/물리focus 후속이며 FR-016 전체 완료 아님.

- ADR-033 (2026-10-12): 단일 Player 실행 권한은 브라우저의 생존 documentId 기반이며 시간/focus 만료를 쓰지 않는다. 실제 sender·같은 수업·getContexts와 Web Locks 직렬화/strict owner metadata로 worker 재생성에도 소유를 유지한다. 소유 창이 사라진 때만 대기창이 승계하고 source/state는 기존 경계를 사용한다. 소유 판정 실패는 grant 금지, 중복 Player에는 실행 엔진을 마운트하지 않으며 backend ADVANCE/PLAY/CHECKPOINT도 거부한다.242tests 및 actualWhale 중복거부·worker stopped→running 동안 WAV계속/owner유지·소유창종료승계 PASS. 브라우저 crash·장시간 물리focus는 별도다.

- ADR-032 (2026-10-12): 구간·음량·음소거는 optional LocalMediaRef.playback metadata로 저장하고 파일을 자르거나 복제하지 않는다. Remote 전용 구간 변경은 실행 미디어·autoplay 정지/시작 위치/새epoch, seek는 재생 여부·자동 넘김 회차 유지/새epoch다. positionEpoch는 명시 위치 변경만 구분하며 PAUSE가 실제 진행 위치를 되감지 않게 한다. 음량만 바꾸면 native 재생·bookmark를 유지한다. Player가 실제 currentTime/deadline으로 설정 end를 확인해 ended checkpoint를 저장하고 자동 넘김이 그 끝을 사용한다. 페이지 이동 cleanup은 확인된 ended를 유지한다.236tests 및 actualWhale WAV 구간/MP4 음량 재생 유지 PASS(TEST_RESULTS04:12). 실물·다른코덱/장시간focus·복수Player lease는 별도다.

- ADR-031 (2026-10-12): media-end/later 모드의 종료 조건은 Player native ended의 strict bookmark로만 계산한다. 현재 페이지 전체 ref의 autoplayEpoch/ended/paused/시간이 맞아야 하며 없는 미디어는 null이다. 재개·반복은 새 회차로 묶고 완료 위치는0으로 재시작한다. Player gesture 재개가 media epoch를 바꿔도 자동 넘김 회차는 유지한다. 시간이 먼저 지나거나 미디어가 먼저 끝나도 결합 모드는 두 조건을 기다린다.226tests 및 actualWhale WAV native ended→A2/5초 deadline 대기 PASS. 다른 코덱/실제다중미디어/장시간focus는 별도다.

- ADR-030 (2026-10-12): 미디어 디코딩/재생은 추가 라이브러리 없이 native HTMLMediaElement를 사용한다. 로컬 파일은 헤더/한도/hash/metadata를 검사해 참조만 등록하고 별도 media vault validator/channel로 연결한다. Player가 재생하고 약5초/정지·종료/교차 자료의 위치를 의미 있는 checkpoint로 보낸다. 교사 정지는 epoch 교체, inactive paused tail은 위치 보존용으로만 허용하며 원본/미디어 bytes는 백업하지 않는다. 재생 거부 후 Player 직접 gesture가 성공해야 재개 명령을 저장한다. 실제 muted WAV/Remote 닫힘/교차 위치·native ended 및218tests는 통과했으나 다른 코덱/실제 소리/영상·focus·lease는 미검증이다.

- ADR-029 (2026-10-12): Remote만 SET_AUTOPLAY/PLAY_AUTOPLAY/PAUSE_AUTOPLAY를 실행하고 Player는 ADVANCE_AUTOPLAY만 실행한다. 다음 페이지를 요청자가 정하지 않고 core가 현재 rule/epoch/target/경과를 검증해 계산한다. 공개 snapshot에는 현재 rule/checkpoint만 추가하며 노트/파일명/Editor 정보는 계속 제외한다. Player deadline과 PDF ready gate를 사용하고 worker는 순간 명령 검증/저장만 담당한다. 미디어 종료/편집pause는 엔진 연결 전 실행으로 주장하지 않는다. 207tests 및 actual Whale1초 범위 반복·Remote닫힘 이후 진행/재접속정지 PASS. 장시간focus/실제미디어/단일Player lease는 후속이다.

- ADR-028 (2026-10-12): 재생 실행 상태는 자료별 optional autoplayCheckpoint로 schema1 호환을 유지한다. elapsed/deadline은 시작 시각과 누적 경과를 사용하고 interval 횟수로 계산하지 않는다. 다른 자료 전환/종료는 미디어 위치·경과·자료 타이머를 정지 보존하고 복귀는 수동 재개가 기본이다. 수동 페이지 이동은 epoch를 교체하지만 자료 타이머는 계속한다. Editor 탐색/같은 자료 활성화/Remote 닫힘은 정지 조건이 아니다. 백업 복원은 exportedAt 기준으로 정지하며 원본 bundle을 수정하지 않는다. 192개 자동 테스트와 실제 Whale metadata A-B-A/strict DB/정상 재시작 시험은 통과했으나 Player 실행·미디어·focus 검증을 대신하지 않는다.

상태: 개발 준비 결정. 제품 기능 구현 결과와 구분한다.

## 2026-10-11 기준 갱신

- ADR-012: 제품 기준은 루트 PRD v5. v4 원문/FR ID는 보존하고 충돌 시 v5 §24/28/30을 따른다. 기존 ADR도 v5와 충돌하는 부분은 더 이상 유효하지 않다.
- ADR-013: 교사 대상 네이버 웨일 공모전 참가 목적을 프로젝트 지침에 고정한다. 공식 공고 미확인 상태에서 일정/심사 기준을 만들지 않는다. 시연 목표는 PDF 전환·비공개 편집·오프라인·원본 보존·복구다.
- ADR-014: 시스템 Node 20 대신 프로젝트 실행 스크립트에서 호환 Node 또는 Codex Node 24를 선택한다. npm.cmd의 자체 Node 선택을 피하도록 npm-cli.js를 같은 런타임으로 실행한다. 시스템 설정은 변경하지 않는다.
- ADR-015: Stage A 첫 단위는 순수 reducer와 repository 저장 조정. receipt 256개 상한, revision CAS, commit 후 성공 응답. 실제 IndexedDB와 공개 projection은 다음 작업이며 UI 연결 전에 구현한다.
- ADR-016 (2026-10-11): IndexedDB v1의 sessions 레코드에 상태+receipt를 함께 저장한다. strict durability 요청, transaction complete 이후 성공, 동일 트랜잭션 revision CAS, 읽기/쓰기 shape 검증, 기존 세션 add 중복 거부. 오류/미지 버전은 삭제/초기화하지 않는다. Edge 프로세스 재시작 검증은 Whale 지원 판정과 분리한다.

| ID | 결정 | 근거/영향 |
|---|---|---|
| ADR-001 | Windows 웨일 MV3 + TS/React/Vite | 원문 착수 요약; macOS 후속 |
| ADR-002 | 서버·계정·ONLYOFFICE 의존성 없음 | 원문 §0.2·§10.3·§19.2 |
| ADR-003 | 원본 불변, 델타 임시 저장, 로컬 정식 저장 | 원문 최신 저장 정책 |
| ADR-004 | Player 재생 소유; Editor 선택 독립 | 원문 §3.3·§5·§19.2 |
| ADR-005 | 현재 종료 후 검정 대기, 미디어 복귀 시 수동 재개 | 최신 요약/§4.3; §17의 선택 가능 제안을 기본값 변경으로 해석하지 않음 |
| ADR-006 | 권한은 실제 기능 구현 시 추가 | 원문 §19.11; 뼈대에 storage/downloads/host 권한 선요청 없음 |
| ADR-007 | 프로젝트 스킬은 `.agents/skills`에 저장 | 사용자 요청의 프로젝트 범위; 전역 스킬 오염 방지 |
| ADR-008 | 원문 FR 우선순위 보존 + 수직 기능에서는 PDF 저장 선행 | FR-018은 P1이지만 최신 요약/§19.5 B~E의 MVP 완료 조건에 포함 |
| ADR-009 | 테스트 이름 공간 분리 | §13의 T-*와 §19.12 T-* 중복 방지 |
| ADR-010 | 렌더러는 검증 후 채택, PDF.js 우선 실험 | 원문 §19.3; PPTX 후보 2종 이상 비교, 이번 의존성에 아직 추가하지 않음 |
| ADR-011 | 원문 예시 타입을 책임별 계약으로 정리 | 원문 §10/§19.6은 초안; 공개 선택 이름 통일·명령 revision 추가·종료 요청/확정 분리 |

원문 §13 Phase 0의 Go/No-Go는 PDF/창/포커스 기반의 제품 타당성을 판단하는 기준이다. 모든 파일 포맷과 웹 서비스의 실험 성공을 PDF 개발 착수의 조건으로 삼지 않는다. 창 뼈대를 만든 사실만으로 Phase 0 통과라 표시하지 않는다.

## 후속 ADR 양식

- ADR-027 (2026-10-12): 빠른편집은Player의raw편집권한을확대하지않는OPEN_CURRENT_EDITOR 별도API로연결한다. 현재target/revision과sender수업을대조한뒤비공개Editor선택만commit하고기존창을재사용한다. Editor의미확정draft는heldselection으로남겨자동commit/unmount하지않는다. Player는private노트/자료title/teacher응답을받지않으며44px아이콘만노출한다. 우클릭/합성longpress·draft보존/발표불변을actualWhaleheadless로검증, 물리터치·듀얼모니터배치는별도다. 사용자요청창focus와실행실패는발표정지조건이아니다.

- ADR-026 (2026-10-12): PDF 수정본은 원본vector 페이지를 유지하고 기존 Canvas 공개 오버레이만 PNG로 합성한다. pdf-lib1.17.1 writer와 PDF.js viewport 역변환(crop/회전/UserUnit)을 사용한다. Editor의 확정 document/revision을 캡처하고 사용자 클릭 중 출력 chooser를 먼저 연다. 새empty PDF만 write-close-readback, 다운로드 대안은 자체 요청 완료 확인이다. 원본/세션/dirty/노트·기록을 변경하지 않으며 PDF 성공을 .wcp.json 백업·종료 증거로 쓰지 않는다. 가리개는 원본정보 삭제/보안 redaction이 아니므로 UI에서 안내한다. 암호우회/원본action정화 없음, 오버레이글씨는 raster. actual Whale 확장+CSP/UI/nativeOPFS/취소·기존파일거부/별도Node reader와177테스트를 검증했다. OSchooser/downloads/native외부뷰어·실물자료는 별도 인수다.

- ADR-025 (2026-10-12): 전체 종료는 Remote의 별도 확인과 열린 자료별 saved/without-backup/unchanged 선택으로 처리한다. saved는 수업 전체 확정 파일을 한 번 검증하고 해당 선택에만 적용한다. 검증 실패 자료는 유지하되 명시적 백업 없는 종료/변경 없는 종료 대상은 한 strict CAS로 종료한다. revision 경쟁/DB 실패는 batch 전체를 변경하지 않는다. 실패한 현재 자료는 계속 발표하며 현재가 종료되면 검정 대기, 다른 자료 자동 노출 없음. 전체가 닫힐 때 session timer도 checkpoint/pause한다. 원본/델타/Editor 초안은 삭제하지 않고 부분 결과를 표시해 남은 자료를 새 revision으로 재확인한다. 159개 테스트와 실제 Whale headless 취소/부분 실패/저장 후 재시도/초안 보존/정상 재시작을 검증했다. PDF 복사본/OS chooser/downloads/영구 정리는 별도다.

- ADR-024 (2026-10-12): 현재 종료는 발표 대상에서만 제외하는 비삭제형이다. closed optional bool과 null 발표를 atomic commit하고 문서/델타/Editor selection/key를 남겨 여러 Editor 초안이 unmount로 사라지지 않게 한다. 앞선 메모의 draft freeze는 삭제형 종료 후보였으며 현재 흐름에는 도입하지 않는다. saved는 현재 전체 확정 파일 재검증+CAS, unchanged는 dirty=false, 새 백업 없이 종료는 명시 선택/임시 복구 유지. 원본/로컬 출력 파일 삭제 없음. closed는 명시적 REOPEN으로만 재개한다. 영구 삭제/전체 편집창 종료 시 draft handshake/자료별 선택은 별도로 필요하다. 실제 Whale 두 Editor 초안 보존/다른 B 불변/검정 대기/재개/정상 재시작을 검증했다.

- ADR-023 (2026-10-12): 종료 기반의 파일 증거는 teacher가 PC 파일을 재선택하고 워커가 실제 bytes/hash/완료 저널/전체 확정 session을 독립 대조하는 방식으로 시작한다. 메시지에는 파일 본문 대신 own Blob URL만 보내며 UUID/root·16MB·30초로 제한하고 외부 URL은 금지한다. 성공 직전에 durable revision을 재조회한다. 확인 결과는 일시적 사실이며 종료 토큰이 아니다. 다음 종료 단계에서 모든 Editor draft 동결 및 atomic revision CAS를 적용해야 한다. 기존 세션/dirty/Player 상태는 확인 작업으로 변경하지 않는다.

- ADR-022 (2026-10-12): 파일 저장 경계에서 캡처된 편집정보를 decode해 sessionId/revision을 대조하고 자체 소유 bytes의 SHA-256으로 prepared 저널을 만든다. writer/download 전에 strict 준비, 실제 출력 확인 뒤 strict terminal 전이. 기존 세션 DB를 바꾸지 않고 별도 한도256 metadata DB를 사용한다. 저널 실패가 실제 파일 성공을 취소하지 않으며 세션/dirty를 보존한다. 기록은 후속 종료 검증의 입력이지 종료 토큰이 아니다. 읽기/쓰기 shape와 단일 전이/경쟁/abort/quota/reconnect는 자동/Edge 보조로 검증했다.

- ADR-017 (2026-10-11): PDF.js 6.4.299를 합성 실제 PDF + 빌드 CSP/worker/폰트/오프라인 warm page 시험 후 experimental PDF 경로로 채택한다. 런타임 동적 로드, 로컬 자원 패키징, XFA/sandbox 비활성. v6는 proxy.destroy 대신 loadingTask.destroy이며 기존 isEvalSupported 옵션을 제거했다. 파일 추가는 수명이 긴 Editor에서 공통 Import로 받고 Player 선택은 변경하지 않는다.
- ADR-018 (2026-10-11): 원본 File은 실행 메모리, 파일 핸들은 별도 strict IDB 참조만 보관한다. 모든 원본을 자동 복사하지 않는다. SHA-256 동일 자료 재사용, 다른 내용은 분리, 재연결은 동일 fingerprint만 허용한다. 렌더는 화면별 독립 큐와 제한된 LRU, 공개 snapshot에는 페이지 번호/원본 fingerprint만 추가한다.
- ADR-019 (2026-10-11): 전체 완성 목표를 Stage A~G/§25 감사로 추적한다. PDF 가져오기 단위 완료를 제품 완성으로 바꾸지 않는다. 실제 Whale와 후속 포맷/미디어/저장/Bridge/라이선스 게이트는 별도 남긴다.
- ADR-020 (2026-10-11): normalized overlay 전체 draft를 Editor에서만 편집하고 SET_SLIDE_OVERLAYS strict commit 후 공개한다. 공개/비공개 canvas를 분리하고 원본 canvas만 색을 읽는다. 글꼴은 설치 Malgun Gothic 실제 측정, 기준 폭1280/원본비율 높이를 저장해 화면 크기에 독립적으로 렌더한다. 최대 fits/overflow를 같은 엔진으로 계산하고 상자를 자동 확대하지 않는다. Player 빠른 진입과 폰트 export 일치는 별도 후속 검증이다.
- ADR-021 (2026-10-11): 버전1 편집정보는 원본 bytes/handle key 없이 저장하고 새 strict 세션으로만 복구한다. native 출력은 nonempty 기존 파일을 거부하고 close/readback 후 확인하며 downloads fallback은 saveAs/uniquify/own 요청 완료를 확인한다. 백업 성공은 captured revision의 파일 저장이지 PDF 결과물/종료 확정이 아니다. dirty는 원본 대비 수정으로 유지하고 종료에 필요한 durable 결과 저널/CAS는 다음 단계다.

```text
ADR-ID / 날짜 / 상태:
문제와 관련 FR:
선택과 근거:
고려한 대안:
실험/테스트 근거:
저장·권한·호환성 영향:
```
