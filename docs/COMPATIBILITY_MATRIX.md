# 실제 지원 수준

2026-10-15 W0 링크 저장·제목 표시·명시적 새 탭 링크·IndexedDB 재연결을 검증했다(1,422tests/빌드). Canva·Miricanvas 실제 관리형 탭 실행, 로그인·재진입·권한과 오프라인은 여전히 `unverified`다.

2026-10-14 source 자원 인벤토리는 unit/check와 actual Whale source-sharing 두 시험 realm에서 수명·lease·최종 해제를 검증했다. 논리 관측 API이며 전체 origin 한도, 물리 메모리, 최종 PPTX 지원 승격의 근거가 아니다. [근거](pptx/RESOURCE_INVENTORY.md).

성능 예산은 [PPTX 성능·자원 예산](pptx/PERFORMANCE_BUDGET.md)에 따라 미확정이다. WorkingSet FAIL과 10종 PowerPoint 기준 3축 비교 부족 때문에 PPTX 지원 등급은 올리지 않는다.

2026-10-14 PPTX borrowedURL은guard/binding·acquire재검증/독립nativeowner·원본/같은DOM/재준비/최종해제를unit/actualWhale로검증했다. 일반local ownURL은유지. **대용량WorkingSetFAIL·origin ready/current/pending byte예산/최종충실도/물리인수와지원승격은미완료**다. [증거](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 SourceVault 재연결 취소는1,403tests/빌드·actualWhale Remote/nativequeue·PDF/media/원본/저장회귀로확인했다. validator 대기취소 제한은이signal연결경로에서해결됐으나PDF/media 실제읽기완료·전체byte예산/성능·물리/최종충실도인수는별도다. [근거](pptx/SOURCE_CANCELLATION.md).

2026-10-14 같은extension origin의PPTXheavy준비job1개는실제Whale2popup·queued/active취소/실패/닫힘·원본/현재PDF보존으로검증했다. API없으면읽기없이거부하며SourceVault validator대기는아직signal없음. **누적모델byte한도/단일대용량성능FAIL/최종충실도·물리인수와지원승격은미완료**다. [근거](pptx/PREPARATION_ADMISSION.md).

2026-10-14 private buffer 소비는 API지원 실제Whale와unit/default caller·공유뷰·File/Blob보존·재생/타이밍/저장회귀를확인했다. API부재는기존동작으로남는다. **전체메모리기준FAIL**이므로최종성능/전역한도·Visual/Media/Behavior지원승격은미완료다. [증거](pptx/PRIVATE_BUFFERS.md).

2026-10-14 exact 이미지·작은 음원/영상 중복 raw 해제는 unit/실제Whale source·교사/준비/native미디어 회귀 PASS. **대용량 최종 WorkingSet 기준 FAIL**이므로 자원 한도·성능 지원 승격과 최종 Visual/Media/Behavior 인수는 미완료다. [근거](pptx/DUPLICATE_PARTS.md).

2026-10-14 동일File 진행중공유/소비자취소격리·마지막Worker/자산해제·재시도는실제Whale nativeWorker/기존제품회귀·1,367tests/빌드PASS. 대용량최신표본1.624GB는1.5GiB기준FAIL이며전역메모리한도/전체성능·지원승격은미완료다. [증거](pptx/INFLIGHT_SOURCE.md).

2026-10-14 중복 자원 개선: 실제 teacher-02 Editor parser4→1/MP3전체읽기3→1, 두 수정 후 표본1.49/1.47GiB로 기존1.5GiB 실험 기준 PASS. 교사/내장/native source5·준비·미지원/PDF 회귀와1,362tests/빌드 PASS. 이전FAIL을 보존하며 전역/저사양/장시간·전체 성능/충실도/물리 인수와 지원 승격은 미완료. [정확한 근거](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 직접 전환 차단: 정상 Player 준비 경로 외 PPTX raw3종/자동 넘김은 저장 경계에서 거부하고 실제 Whale의 현재 화면/pending 유지·교사/내장/PDF/계약 회귀를 확인했다. 1,356tests/빌드 PASS. **대용량 성능은 두 실행 모두1.5GiB 실험 기준 초과 FAIL**이며 최종 지원 등급은 유지한다. [근거·실패·남은 인수](pptx/TRANSITION_ADMISSION.md). 아래 직접 입장 미연결 기록을 대체한다.

2026-10-14 Player 준비 표면: 정상 Remote 요청/공개 목표 준비·실패/취소·현재 PDF/음원 유지·동일 DOM/native 승격·원본 누락/재연결·닫힌 명시 쪽을 실제 Whale headless로 검증했다. source-v1 cursor5·승격 전후 play0과 기존 효과/저장 회귀 PASS. **직접 전환 입장 차단·대용량/물리/전체 충실도는 남아 지원 등급을 유지한다.** [근거](pptx/PREPARED_SCENE.md). 아래 이전 consumer 미연결 상태를 이 범위에서 대체한다.

2026-10-14 전환요청계약: optional pending/strict DB·receipt/지정현재Player확정·취소/경합·노트없는목표조회/백업새수업제거를actualWhaleRPC로검증했다. 요청/worker재시작중PDF픽셀·무음WAV진행유지/새Player과거요청거부. 이는저장·인증계약1단계이며실제Player표면staging/Remote소비·직접명령입장은미연결,전체안전전환/지원승격아님. [근거](TEST_RESULTS.md).

2026-10-14 미지원쪽전환: 정상RemoteUI에서PPTX를분리runtime로검사하고실패/취소시현재학생화면을유지한다. 다른자료의정상명시쪽으로직접활성화가능. actualWhale합성미지원/취소·늦은결과/현재PDF픽셀·세션유지/다음정상쪽·5화면과교사제품회귀를검증했다. 직접명령입장·실제Player준비실패보호/대안PDF연결·전체인수는미완료다. [실행근거](TEST_RESULTS.md).

2026-10-14 배경 참조: 고정 core0.4.5의 bgRef 계산을 수정해 teacher-02 1쪽의 잘못된 그라데이션을 원본 단색으로 표시한다. 실제Whale 전체52쪽/합성10종과기존교사·내장/PDF회귀를검증했다. 1쪽MAE10.62→2.18,전체Visual/Media/Behavior·원본앱·실물10종/물리인수는미완료이며지원승격없음. [근거](TEST_RESULTS.md).

2026-10-14 Stage C 로컬글꼴: PPTX신규등록/원본점검에서명시슬라이드typeface최대64종을FontFace local로조회하고실패/미확인·대체위험을안내한다. actualWhale한글별칭/있는명·없는명/제품경고·취소·시간초과·학생화면보존확인. 실제font적용/상속theme/embedded/glyph/license/원본충실도는미검증,지원승격없음. 재연결은미검사와재점검경로를안내한다. [근거](TEST_RESULTS.md).

2026-10-14 후속진단: teacher-02원본XML/제품텍스트hash52쪽모두일치,33쪽PDF추출은기호1개차이였다. 실제Whale6쪽CDP실제사용글꼴과테스트DOM대조군으로폰트대체의시각차이기여를확인했다. 제품글꼴자동교체/지원승격없음,1쪽fill/이미지·원본앱환경/실제10종·최종충실도인수미완료. [근거](pptx/TEACHER_02.md).

2026-10-14 Stage C/D: PPTX 글꼴 이름/참조·내장파트 숫자점검을 등록·원본/모델 Preflight에 연결했다(정상 unknown/깨진값 warning, 실제설치·적용미확인). teacher-02 전체52쪽제품비공개뷰와기준PDF를actualWhale720×540 raw로비교해텍스트hash51쪽일치/33쪽불일치·픽셀차이중앙13.60%를기록했다. 원본불변/학생화면독립/외부0, 최종Visual은unverified이며원인분석·원본앱환경/실물10종과물리인수는남는다. [근거/제한](pptx/TEACHER_02.md), [실행기록](TEST_RESULTS.md).

2026-10-14 teacher-02 내장 음원 연결: 외부 호환 Target 무접근·내부 p14/shape/header/hash 검증 후 모델 누락 media만 소유 Blob으로 연결했다. 실제Whale1791906468561 제품57MB MP3등록/native무음시간진행·Remote정지/PDF복귀/자산해제·원본불변 PASS. 동일File준비모델공유/Worker입력transfer/대용량중복buffer해제로표본WorkingSet약1.46GiB. 실제소리/원본타이밍/전체충실도·물리인수는 미완료, supported승격없음. [근거](pptx/TEACHER_02.md).

2026-10-13 내장음원/영상64MiB:허용된ppt/media의MP3/WAV/MP4/WebM과공식Worker MIME만64MiB,일반32MiB/XML4MiB/총256MiB·ratio유지. 실제teacher-02 98MB/52쪽등록·비공개/Player일부쪽·raw MP3native길이/자산해제·PDF복귀PASS. 제품audio는원본External호환참조/p14내장참조를모델이연결하지못해src=null로미완료다. 전체PPTX/음원재생지원승격없음. 표본browser메모리약1.45GiB,물리/저사양/장시간인수미실시. [근거](pptx/TEACHER_02.md).

2026-10-13 teacher-02:52쪽98MBPPTX는내장MP3 56.8MB로현재개별32MiB한도초과/등록거부. 실제Whale에서기존PDF세션·픽셀보존/한도·PDF·원본앱대안안내를검증했다. 제공기준PDF52쪽등록/1·26·52렌더는통과. 이PPTXVisual/Media/Behavior는차단상태이며지원승격없음. 실제원본2종/기준PDF1종. [근거](pptx/TEACHER_02.md).

2026-10-13 회전/확대 등록 사전점검: 신규 PPTX에 해당 효과가 있으면 기존 원본·모델 binding으로 준비 불가 쪽과 PDF/원본앱 대안을 안내한다. 실제Whale 합성20.001초회전에서 초기화 실패/빈표면을 재현하고 등록 전 경고·기존PDF화면 보존/다음쪽·PDF복귀를 확인했다. 자동 정적 fallback·Remote 차단/재연결 재검사·전체 충실도는 미완료다. 지원등급 승격 없음. [범위](pptx/DEGRADATION_PREFLIGHT.md).

2026-10-13 source media 재준비: Player먼저→내장등록/과거pending무실행/같은runtime준비·재생중같은native요소유지/설정교정, 준비불가 새Player sourcecursor복원/회복·백업을 실제Whale 합성5그룹으로 확인했다(내장1791885072296).1,201tests/빌드·교사제품1791885072190/foundation1791884344131 회귀 PASS. 혼합/복합/충실도/물리인수는 별도이며 전체 지원등급 승격 없음. [근거](pptx/MEDIA_TIMELINE_REFRESH.md).

2026-10-13 순차 media-only source 그룹: 실제Whale 일반 Editor/Remote/Player에서750ms지연·취소/실패재시도·5개 native명령/source-v1 완료/소진·새Player 무재생을 합성 PPTX로 확인했다. 고급/혼합/동시/trim+playFrom·동적 재준비·실제10종/PowerPoint 기준은 남아 PPTX 전체 supported로 승격하지 않는다. [근거/최종 회귀 상태](pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 native Player endpoint: LocalMediaPlayer 등록/자기 ACK 억제/취소·늦은 결과 정지/교사 새 epoch/새 Player 과거 재생 대기 및 실제Whale muted WAV·strictDB probe와 교사제품/PDF foundation 회귀 PASS. 원본 XML→endpoint 실행은 미연결이며 PPTX Media/Behavior 전체 지원으로 승격하지 않는다. [범위](pptx/NATIVE_PLAYER_ENDPOINT.md), [기록](TEST_RESULTS.md).

2026-10-13 원본media native결과 저장 경계는 actualWhale1791850866864 소유자/취소/늦은결과/중복응답/복구로 검증했다. 원본timelineConnected=false, 실제클릭자동실행은미완료다. 1,153tests/빌드·교사제품1791850786808/foundation1791850786972 회귀 PASS. [근거](pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 PPTX 내장 미디어 설정 부분 연결: 명시적volume/mute/p14trim을 새 등록→Player/Remote/백업에 적용하고 재연결사용자값보존. 실제Whale1791850286198 합성영상구간끝정지/.25/muted 및제품회귀1791850170029 PASS. 누락default은미확인고지, 여러쪽/정지시숨김·원본trigger실행은미지원/미완료. [근거](pptx/SOURCE_MEDIA_SETTINGS.md).

2026-10-13 전역 원본 미디어 제어 검사: 명시적 root/main 시작·순차onNext·선언indefinite 대기 진단을 실제Whale1791849769204로 확인했다. concurrent/seek/skipTimed는 거부한다. controlsVerified는 전체 executionVerified와 별개이며 제품 원본 자동재생은 계속 미완료다. [근거](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 그룹내 명시적 무조건지연+deadline native예약/취소 기반. 1,098tests/빌드·actualWhale1791849167813 생성XML50+100ms→실제mutedWAV150ms후1회/대기취소0/onClick거부 PASS. root/seq 의미·설정·제품Player통합은미연결/PPTX unverified 유지. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 원본call→직접root audio/video→strict 등록scope/hash/path 대응·정규화와 runtime 지연준비 API. 1,080tests/빌드·actualWhale 내장1791848744172 원본call/경로/hash 대응·중첩선언거부 및 제품PPTX1791848744061 회귀 PASS. 조건/설정/Player bookmark/자동실행은미연결. PPTX unverified 유지. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 durable ACK까지 native취소 handle 유지/동기start취소·중첩WAAPI 격리. 1,063tests/빌드·actualWhale1791848414351 실제 mutedWAV+sourceDriver/bridge/strictDB ACK보류취소/늦은ACK/성공재생유지 PASS. 원본XML/제품Player timing연결은 미완료. [근거](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 bounded 미디어call 정규화/native 실행기·취소/늦은성공 guard 추가. 1,059tests/빌드·actualWhale1791848003458 합성WAV 명령/정지/재개/seek/취소 PASS. 제품원본 timing/Remote에는 미연결, PPTX unverified 유지. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 원본shapeSteps→공식groupSteps 정확 대응/엔진그룹수검사·runtime Preflight/Player 고지. 1,029tests/빌드·actualWhale 내장1791847538767 교사12그룹/합성[null,0,null] PASS. 타이밍 의미/native원본trigger 실행은 미연결, PPTX unverified 유지. [범위](pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 원본 그룹 커서/source-v1 저장 계약과 무미디어재실행 복원 기반 추가. 1,012tests/빌드·actualWhale1791847210123 합성3그룹/재시작 factory0 PASS. 미디어 action은promise이며 제품 원본 trigger 실행은 미연결, PPTX unverified 유지. [근거](pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 원본 순서 구조/모델shape 대응 및 media-only 보존을 runtime진단/Player고지에 연결했다. 992tests/빌드·1차 actualWhale1791846343496 교사12구조/12효과·합성3구조/shape1/media-only2 PASS. 실제 시간순서·원본trigger실행은 미검증, PPTX unverified 유지. [범위](pptx/SOURCE_ORDER.md).

2026-10-13 07:58 원본 조건/반복 분류: 979tests/빌드·actualWhale1791845740393 합성 반복/역재생/종료조건/trim 각1, 부모/참조·Editor학생화면보존·380px PASS. 교사원본 미검증타이밍4 별도고지. 실제 그룹순서/clip범위·원본트리거 실행/물리/충실도는 미완료, PPTX unverified 유지. [근거](pptx/MEDIA_TIMING.md).

2026-10-13 07:50 원본 media target 대응 진단 API: 956tests·빌드/actualWhale1791845299247 audio/video/cmd의 원본 ID→등록path→원본 관계 바이트hash 대응 및 대상누락/바이트변조 거부 PASS. Player 원본트리거 실행에는 아직 미연결, clip·반복·조건 의미/충실도·물리 인수는 미완료. 지원등급 변경 없음. [범위](pptx/MEDIA_TIMING.md).

2026-10-13 원본 미디어 타이밍 숫자 검사/Preflight: 937테스트·빌드/actualWhale1791844433682 합성 고지·세션/학생 화면 보존 PASS. 호출 인식은 실행 지원이 아니며 등록 경로/조건 의미/원본 trigger/충실도·물리 인수는 미완료, PPTX unverified 유지. [범위](pptx/MEDIA_TIMING.md).

2026-10-13 03:45 actualWhale1791830666738: 합성crop+ellipse 내장영상 재생중 실제Remote90도회전효과/완료checkpoint1·native동일node시간증가·새Player90도/clip/보존위치정지복원 PASS.909tests/빌드·내장전체회귀PASS. 원본trigger·일반고급조합/실제파일충실도·물리인수는미완료,PPTX unverified유지.[범위](pptx/PLAYER_MEDIA.md).

2026-10-13 03:38 actualWhale1791830114932:내장video worker재시작 동일node/소유권/연속재생·이후Remote정지,실패repaint 기존SVG/native보존,PDF읽기중revision증가등록·발표보존 PASS.909tests/빌드·foundation1791830114955 회귀PASS. 원본trigger/고급조합/진행중미디어추가·실물충실도는 미완료.[상세](pptx/PLAYER_MEDIA.md).

2026-10-13 03:30 내장 영상 양의crop+shape clip:901tests·빌드/실제Whale1791829563020 합성 좌우25%crop/ellipse 제품UI·native너비2배·스크린샷픽셀 PASS. 제품PPTX1791829591948/foundation1791829592085 회귀PASS. 음수/과도crop/reflection·원본trigger/고급조합·실제파일충실도는 미완료, PPTX unverified 유지.[근거](pptx/PLAYER_MEDIA.md).

2026-10-13 03:20 PPTX 내장 수동 재생:기본영상 원본영역/Remote·Player원본재추출/자료교차·새Player/백업·현재종료 실제Whale1791829184123 PASS.890tests·빌드·제품PPTX/foundation회귀 PASS. **원본trigger·고급변형·실물speaker/충실도는미완료**,PPTX unverified유지.[범위](pptx/PLAYER_MEDIA.md).

2026-10-13 03:05 Editor 내장미디어 명시연결UI:선택쪽WAV/MP4검사→등록/재연결·취소/실패/중복·다른발표쪽보호 실제Whale1791828240243 PASS,869tests/빌드/foundation1791828240272 회귀PASS. **원본영상위치/효과트리거·Player원본재추출복구는미연결**,PPTX unverified유지.[근거](pptx/EMBEDDED_MEDIA.md).

2026-10-13 02:56 내장 미디어는 소유 자산 추출·출처 metadata 계약까지 검증했다(855tests/빌드, 실제Whale1791827767082 합성 WAV/MP4 해시·duration/strict 등록·복구). **내장 연결UI/Player 재생·원본 위치/트리거는 미연결**, PPTX unverified 유지. [범위](pptx/EMBEDDED_MEDIA.md).

2026-10-13 02:44 PPTX overlay:비공개draft/확정·실제font overflow/글상자·가리개·판서/Player표시/원본효과분리/새Player·백업복구PNG동일을실제Whale1791826916205 PASS.823tests·빌드/foundation1791826934209 회귀PASS. **원본색픽셀추출미완료(수동색)**,내장media/원본충실도/물리인수미완료/PPTX unverified유지.[근거](pptx/OVERLAYS.md).

2026-10-13 일반 PPTX 실험입력:제품Editor opt-in 등록/재연결·중복재사용/등록UUID비공개탐색·노트·Remote효과·로컬백업복구 제품UI만실제Whale1791826400096 PASS.814tests·빌드/foundation1791826254333 회귀PASS.아래일반UI미연결은과거시점. **PPTX unverified 유지**, overlay Editor/Player·내장media/원본충실도/물리인수미완료.[근거](pptx/PRODUCT_IMPORT.md).

2026-10-13 PPTX 편집정보 백업:schema1 metadata/델타·완료pose 저장과 새수업scope/과거run·request제거복구,802tests·빌드/실제Whale1791825423523 파일저장·재검증/Launcher복구·원본helper재연결·완료화면복원·foundation1791825446215 회귀 PASS.일반등록UI/편집·내장media/충실도·물리인수미완료,**PPTX unverified 유지**.[근거](pptx/LOCAL_BACKUP.md).

2026-10-13 02:09: PPTX Remote UI→소유 Player 요청 소비/과거 pending 보류/실패 취소 후 새 요청/재생취소·완료 pose/소진 안내를 실제 Whale5.39.412.57 headless에서 검증했다(profile1791823852936). 교사23쪽/12클릭·자료복귀/새 Player·worker재시작/5viewport/원본불변 PASS, 791tests·빌드 및 foundation1791824821236 회귀 PASS. 아래 UI 미연결 기록은 이전 시점이다. 일반 PPTX 등록·편집·백업/내장 미디어·원본 충실도/물리 인수 미완료이며 **PPTX unverified 유지**. [근거](pptx/REMOTE_REQUEST.md).

2026-10-13: PPTX Remote 영속 요청 API/소유 Player 소비·취소 경계와 기존12효과는 실제 Whale PASS. Remote 버튼/Player 자동 소비는 미연결이며 **PPTX unverified 유지**. [범위](pptx/REMOTE_REQUEST.md).

2026-10-12 23:45: 실제제품 Player+등록helper 시험에서teacher23쪽/원본12클릭그룹/확정checkpoint·자료복귀·새Player복원/5화면 PASS. 일반PPTX등록UI/Remote효과·내장media/overlay·백업·충실도는미완료이며 **PPTX unverified 유지**. [근거](pptx/PRODUCT_PLAYER_RUNTIME.md).

2026-10-12 23:29: 제품Editor **PPTX 실험적 비공개 미리보기**는teacher-01 23쪽 탐색/117이미지decode·발표Canvas보존·URL해제/취소/5화면 확인. 글꼴/원본충실도·효과/미디어재생·일반발표는미검증이며PPTX **unverified 유지**. [범위](pptx/PRIVATE_PREVIEW.md).

2026-10-12 23:16: 제품 Editor opt-in 모델 검사까지 실제 Whale teacher-01 23쪽/174요소/12효과·발표Canvas불변·취소/오류·5viewport PASS. 로컬 파서 패키징과 발표/충실도 지원은 다르며 **PPTX unverified 유지**. [근거](pptx/PRODUCT_MODEL_WORKER.md).

2026-10-12 22:58: 제품Editor의PPTX **원본구조점검**은실제Whale teacher-01 23쪽/타이밍4·PDF발표session/snapshot/Canvas해시불변·오류/취소·5viewport PASS. 렌더러/발표지원과구분하며 **PPTX unverified 유지**. [근거](pptx/EDITOR_INSPECTION.md).

2026-10-12 22:45: PPTX 원본XML/Worker모델의대체·미디어·효과·전환·숨김·외부참조를수치/제한으로고지. 실제teacher-01효과4쪽12개warning·미발견unknown/기존회귀 PASS. 일반preflight/UI·원본충실도·실물인수미완료, **PPTX unverified 유지**. [근거](pptx/MODEL_PREFLIGHT.md).

2026-10-12 22:39: 원본순서를뒤집은실제Worker 제목/표/효과모델대응, 등록UUID의원본XML/engine/strict ACK/복원 및teacher-01 23ID/모델대응 PASS. 일반UI·동일제목/숨김쪽/전체충실도/실물인수미완료, **PPTX unverified 유지**. [근거](pptx/MODEL_BINDING.md).

2026-10-12 22:30: PPTX 원본 XML 순서/검사/등록준비→실제 Editor ACK/DB·재연결ID유지/공격9거부와teacher-01 23쪽준비/hash불변 PASS. 일반 UI/teacher등록경로화면·PowerPoint충실도는미완료, **PPTX unverified 유지**. [근거](pptx/REGISTRATION.md).

2026-10-12 22:22: PPTX Editor 메모리 원본→Player/새 Player 채널 재해시·효과 복원 및 위조지문/변경원본 거부·수업불변 PASS. File header는 package/충실도 검증이 아니다. 일반 UI·물리 핸들·원본 비교 미완료, **PPTX unverified 유지**. [근거](pptx/SOURCE_BOUNDARY.md).

2026-10-12 22:16: 실제 제품 Player URL에서 Worker 모델/5효과→runtime owner/strict ACK/DB→A/B/A·새 Player 원본 재파싱 pose 복원 PASS. 격리 시험 모듈이며 일반 import/Player UI와 실물 충실도는 미완료. **PPTX unverified 유지**. [근거](pptx/RUNTIME_RENDERER.md).

2026-10-12 22:06: 실제제품MV3 background에서PPTX BEGIN/CHECKPOINT owner/중복Player·다른창/수업거부·worker재시작/승계 PASS. transport와합성metadata시험이며제품renderer/UI·원본충실도는미완료. **PPTX unverified 유지**. [근거](pptx/PLAYER_TRANSPORT.md).

2026-10-12 21:58: 합성 원본5효과에서 실제 완료pose→제품Hub/strict DB→A/B/A/정상Whale재시작/원본새Worker파싱 복원 PASS. ACK 실패복원/busy 검증. 실제제품 background/Player UI·실물원본충실도·물리인수 미완료로 **PPTX unverified 유지**. [근거](pptx/PLAYBACK_BRIDGE.md).

2026-10-12 21:46: PPTX 완료pose/진행epoch의 core·strict 저장계약과 실제Whale 정상재실행DB보존 PASS. 합성 metadata/localhost시험이며 제품renderer/신규명령 owner end-to-end는미검증. 기존MV3/PDF/native미디어 회귀유지. **PPTX unverified 유지**. [근거](pptx/DURABLE_CHECKPOINT.md).

2026-10-12 21:34 X-04: 기본/명시적0 회전·확대의 linear·시간기준 중간행렬/분수완료/9조건거부 PASS. 비영 가속·감속/다른효과·실물PowerPoint/제품연결 미완료. **PPTX unverified 유지**. [근거](pptx/LINEAR_TIMING.md).

2026-10-12 21:29 X-04: 합성 회전·확대 유한 반복/역재생6조건과 afterPrev·완료pose/전환취소 PASS. 시간곡선·실제 원본 비교/제품 Player 연결은 미완료이며 **PPTX unverified 유지**. [근거](pptx/REPEAT_TIMING.md).

2026-10-12 09:27 X-04: 원본확대 전달 어댑터의 합성1.5·0.5 재생/중심·완료pose복귀 및끝점5변형/조건8종거부 PASS. 후보단독은확대대신opacity변경. 실제PowerPoint기준·제품연결/반복·고급효과전반은미완료, **PPTX unverified 유지**. [근거](pptx/SCALE_SOURCE.md).

2026-10-12 09:15 X-04: 원본회전 전달 어댑터로 합성90도 재생/완료pose복귀·음수/from/to/720도 키프레임·중간행렬 및baseline보존 PASS. 기존후보단독손실은유지하며제품 Player/실제PowerPoint기준·전체효과는미완료. **PPTX unverified 유지**. [근거](pptx/ROTATION_SOURCE.md).

2026-10-12 08:59 X-04: web-ppt0.4.5 합성기본fade 입장/퇴장 및 직선이동 실행/완료pose복원 PASS. **합성90도 회전 의미 손실**과 cursor-only 이동복귀 실패를 확인했으며 pose는후자만해결. 실제PowerPoint·고급효과/제품 연결 전반은미완료로 PPTX unverified 유지. [근거](pptx/EFFECT_POSE.md).

2026-10-12 08:49 X-04: web-ppt0.4.5 Worker 파싱/전체자산 반환을 실제Whale 교사23쪽·합성미디어3쪽에서 main모델/자산hash·효과/미디어 회귀로 확인. timeout/취소/손상입력 종료와리스너정리 PASS. 제품Player·원본충실도·고급효과/실제10종 인수 미완료로 PPTX unverified 유지. [근거](pptx/WEBPPT_WORKER.md).

2026-10-12 08:40 X-04: web-ppt0.4.5 canonical 합성3쪽에서 WAV/MP4 정확hash 추출·native muted재생/영상pixel·문맥전환pause/메모리bookmark대기복귀 PASS. 실제자료/제품 Player·revision/DB·고급트리거·스피커 인수는 아니며 PPTX unverified 유지. [근거](pptx/MEDIA_COMPARISON.md).

2026-10-12 08:35 X-04: web-ppt 격리 후보의 효과 수명 경계와 실제 Whale 독립 A/B 문맥 전환/기본 appear 커서 복원·재시작 PASS. 같은 교사1종을 독립 파싱했으며 실제2종/제품 Session·Player 복원은 아니다. 고급 효과/미디어/원본 충실도도 남아 PPTX unverified 유지. [근거](pptx/WEBPPT_ANIMATION.md#실행-수명-후속-검증).

2026-10-12 08:28 X-04: web-ppt0.4.5 격리 후보에서 실제 교사1종23쪽/기본 appear 클릭12단계 진행과 숨김·표시를 실제 Whale headless로 확인. 제품 Player/원본 시각·폰트/미디어/고급 효과/실물 인수는 미완료이므로 PPTX unverified 유지. [근거](pptx/WEBPPT_ANIMATION.md).

2026-10-12 08:15 X-04: office Worker 정적 SVG와 본 화면 출력은 교사23쪽/합성3쪽에서 hash 일치, 선택4쪽/합성3쪽 Image.decode PASS. PowerPoint 원본 충실도·효과 재생·제품 Player 미완료이며 PPTX unverified 유지. aiden Worker DOMParser 실패/preview 기존 실패도 유지한다.

2026-10-12 08:11 X-04: office-kit 파서/효과 요약은 실제 Whale Worker에서 본 화면·원본 XML 개수와 일치. aiden 파서는 model 단계 DOMParser 부족으로 Worker 실패. 기존 본 화면23쪽/미디어 렌더는 유지하나 효과 재생·원본 충실도·제품 연결 미완료로 PPTX unverified 유지. WORKER_TIMING.md 참조.

2026-10-12 08:04 X-04: ZIP 검사/해제를 로컬 Worker에서 수행하고 15초 제한·취소 시 종료한다. 345tests/check와 실제 Whale 교사23쪽·미디어·강제 지연/취소 회귀 PASS. XML/후보 parser는 메인 실행이므로 전체 import CPU 격리 및 PPTX 제품 지원은 미완료, unverified 유지.

2026-10-12 08:00 X-04: 콘텐츠 타입/일부 미디어 초기 헤더 교차 검사 추가. 335tests/check 및 실제 Whale 교사23쪽·합성미디어 회귀 PASS. 교사 자료 헤더81 외 미검증 미디어1, 합성 잔여 override2를 명시적으로 기록한다. 전체 구조/코덱·원본 충실도·제품 Player 미완료로 PPTX unverified 유지.

2026-10-12 07:55 X-04: 내부 관계 대상 검사와 외부 URI 위험 분류를 격리 비교에 연결했다. 317개 테스트/check, 실제 웨일의 교사 23쪽 및 합성 미디어 회귀 통과. 렌더러 제품 채택·Player 연결·원본 충실도는 아직 미완료이므로 PPTX unverified 유지. 위험 외부 개수 0은 연결 허가나 전체 안전 보장이 아니다.

2026-10-12 07:48 X-04: ZIP/XML 입력 한도와 거부 검사를 격리 비교에 연결했다. 293개 테스트와 check, 실제 웨일의 23쪽 자료·합성 미디어·DTD·script·잘못된 XML 거부 시험이 통과했다. 타이밍 4쪽 추출은 효과 재현의 증거가 아니다. 전체 ZIP 보안, 원본 충실도, 실제 10종 비교와 Player 연계는 미완료이므로 PPTX는 unverified로 유지한다.

2026-10-12 07:44 X-04: 표준audioFile합성variant에서두후보audio/video분류·실제Whale무음재생PASS. 앞선WAV영상분류는충돌하는생성태그사례로한정,일반음원미지원판정아님. 원본PowerPoint효과/실제자료충실도·Player연계미완료로PPTX unverified유지([근거](pptx/MEDIA_COMPARISON.md)).

2026-10-12 07:41 X-04 합성PPTX미디어: aidennativeWAV/MP4무음재생,office정확추출/별도host재생만확인. WAV 모델video분류불일치(생성XML경계),office슬라이드는포스터만. 제품Player연계/효과·실제media인수없어PPTX는unverified유지([비교](pptx/MEDIA_COMPARISON.md)).

2026-10-12 07:37 X-04 실제첫자료:23쪽aiden/office호출·디코딩/일부직접비교/원본불변PASS. 타이밍4쪽/전용폰트위험및렌더러차이확인. 원본PowerPoint기준·효과/미디어·실제추가9종이상미검증, PPTX제품은unverified유지([사례](pptx/TEACHER_01.md)).

2026-10-12 07:33 X-04: office-kit을추가해3후보합성비교. aiden/office 표시는확인, preview실패/라이선스충돌. office SVG 이미지표시·노트추출은격리실험만, Canvas readback taint제한. 실제10종·원본/media/behavior/offline 미검증으로PPTX는unverified유지.278tests/check PASS([비교](pptx/INITIAL_COMPARISON.md)).

2026-10-12 C-PREFLIGHT-06: 합성PDF 검사쪽 실제Canvas 렌더/실패·계약v3 cache는 experimental,278tests/check·actualWhale8/8 결과/전체회귀 PASS. PPTX는 계속 unverified: aiden1.3.0 별도MV3 합성2쪽만 표시 성공, preview1.0.7 첫쪽실패/라이선스충돌. [비교](pptx/INITIAL_COMPARISON.md). 원본시각·실물10종·media/behavior/offline 인수 및 후보선정 미완료(TEST_RESULTS05:26).

2026-10-12 C-PREFLIGHT-05: SHA256/페이지범위/PDF.js·UA환경별 메모리cache와강제검사는 experimental.276tests/check·actualWhale cachehit/범위분리/강제검사·coldsourceerror·상태보존/380px PASS(TEST_RESULTS05:15). source/hash·media는매번재검사하며cache를완전offline/충실도성공으로쓰지않는다. 영속cache/실물benchmark/시각비교는unverified.

2026-10-12 C-PREFLIGHT-04: 부분/전체페이지 읽기·범위/진행·취소는 experimental.271tests/check·actualWhale 합성8쪽 전체와중간링크발견/상태보존·380px PASS(TEST_RESULTS05:11).2000쪽성능/원본pixel·font·이미지/완전offline·환경cache는 unverified. 전체읽기를 전체충실도 보장으로 승격하지 않는다.

2026-10-12 C-PREFLIGHT-03: 실제Whale 합성 link/script 경고·WAV/MP4 source/hash/native metadata 1/1·2/2·cold fallback 원본없음/error 및 상태보존 PASS(269tests,TEST_RESULTS05:07). Map action contract 누락을 수정했다. 전체action/폰트·이미지/코덱decode·실물/완전offline는 여전히 unverified.

2026-10-12 C-PREFLIGHT-02: 등록 fast 결과 연계는 experimental.268tests/check·actualWhale 신규parser결과/동일원본재연결hash결과와미확인구분·다른원본거부/성공결과없음·세션불변/380px PASS(TEST_RESULTS05:02). 정밀·환경캐시/완전offline·실물충실도는 unverified. 이전등록연계미구현 표현은 이 범위로 대체한다.

2026-10-12 C-PREFLIGHT-01: 선택 PDF 사전점검/일부쪽읽기·원본·metadata·결과/취소 UI는 experimental.265tests/check 및 actualWhale headless PDF2/8쪽/미확인고지·private/발표불변/취소/380px PASS(TEST_RESULTS04:59). 전체충실도·실물고급fixtures·미디어preflight실제경로/정밀·캐시·등록연계·coldoffline는 unverified. 모든경고없는 발표준비완료를 의미하지 않는다.

2026-10-12 B-TIMER-SOUND-01: 알림 소리 설정/완료 자동시도·중복claim방지·차단 수동재시도는 experimental.259tests/check 및 actualWhale headless 대역resume거부→실제gesture/native running oscillator2개·Remote닫힘/중복거부/재시작 PASS(TEST_RESULTS04:53). 실제스피커·OS소리정책/절전·crash audible전달은 unverified이며 claim=소리성공이 아니다.

2026-10-12 B-TIMER-POSITION-01: Remote 타이머 위치 slider/별도 적용은 experimental.255tests·actualWhale headless 실행 중 시간유지/1366·380 네 모서리 경계·재시작 위치보존 PASS(TEST_RESULTS04:47). Player 직접 drag/소리·물리focus는 미완료. 이전 위치 미구현 표현은 이 범위로 대체한다.

2026-10-12 B-TIMER-01: 수업·자료별 countdown/stopwatch·공개표시/시작·정지·초기화는 experimental.252tests/check 및 actualWhale5.39.412.57 headless Remote닫힘/수업진행·A-B 시간보존/Player 완료·중복거부/정상재시작/380px PASS(TEST_RESULTS04:43). 소리·위치/물리focus·절전은 unverified다. 이전 타이머 미연결 표현은 이 최신 범위로 대체하며 전체 FR-016 미완료.

2026-10-12 B-PLAYER-OWNER-01: 단일 실행 소유권은 experimental. actualWhale headless의 실제 sender.documentId/getContexts/WebLocks/strictDB로 중복 창 대기·Player 명령거부, 제품 worker stopped→running 동안 WAV재생·owner유지/새중복거부, 소유창종료 후 승계/수업상태불변 PASS(242tests,TEST_RESULTS04:26). renderer/browser crash·재생 종료 tail·물리5분focus/편집pause·타이머는 unverified다. 아래 단일Player 미연결 표현은 이 최신 범위로 대체한다.

2026-10-12 B-MEDIA-CONTROLS-01: 구간·음량·음소거·위치 UI는 experimental. actualWhale headless 합성WAV3~5초/정지seek3.401초·구간끝 자동넘김/ended보존, 합성H.264 MP4 재생중 음량변경/회차·위치유지 및236tests PASS(TEST_RESULTS04:12). 실제 소리·영상 구간/실물·다른코덱·장시간focus는 unverified다. 이전 기록의 trim/volume/seek UI 미연결 문구는 이 최신 범위로 대체한다.

2026-10-12 B-LOCAL-VIDEO-01: 합성 H.264 MP4 재생 경로는 experimental. actualWhale5.39.412.57 headless에서 native 생성/디코딩, Editor 등록/hash/길이, Player 녹색·빨간색 프레임 변화, Remote 정지·재개/닫힘, 교차 자료 위치 복원·자연 종료,1366/380px 확인 PASS(TEST_RESULTS04:03). 초기 metadata 준비 대기 timeout은 원인 미확정이며 진단을 남겼다. 다른 MP4 코덱/MP3/WebM·실물 자료·실제 소리·장시간 focus는 unverified다. 아래 영상 미검증 표현은 이 한정된 증거를 제외한 범위로 읽는다.

2026-10-12 B-MEDIA-AUTOPLAY-01: WAV의 미디어 종료 기반·시간/종료 결합 자동 넘김은 experimental(actualWhale native ended/5초 deadline 대기/다음 노미디어페이지 정지 PASS,226tests). 영상·다른 코덱/실물 다중 미디어/스피커/5분focus는 unverified이며 전체 포맷 재생 보장을 뜻하지 않는다.

2026-10-12 B-LOCAL-MEDIA-01: 로컬 WAV 재생은 experimental(Whale5.39.412.57 headless·합성PCM·muted native play/Remote 닫힘/교차 위치·native ended PASS,218tests). 입력 경로가 있는 MP3/MP4/WebM은 실제 코덱/영상 시험 unverified다. 실제 소리/5분focus/OS chooser·미디어 native handle cold restart·media-end 자동 넘김/다중Player는 미완료다. metadata 읽기만으로 포맷 재생 지원을 보장하지 않는다.

2026-10-12 B-AUTOPLAY-EXEC-01: 시간 기반 자동 넘김은 experimental. actual Whale5.39.412.57 headless에서 Remote1초 범위 반복·닫힘 이후 Player 진행·재접속정지/비공개 상태 유지 확인(207tests). 미디어 종료 기반·편집pause·실제 영상/음원·5분 다른 앱 focus·단일Player 권한 인수는 unverified이며 전체 미디어 지원으로 승격하지 않는다.

2026-10-12 B-PLAYBACK-STATE-01: 자료 교차 시 checkpoint/미디어 위치/자료 타이머 정지 보존을 실제 Whale headless worker/strict DB/정상 재시작으로 검증했다. 합성 metadata만 사용했으며 Player 자동 넘김 실행·영상/음원·5분 focus는 unverified다. 192개 자동 테스트가 재생 기능의 실기기 지원 증거를 대신하지 않는다.

제품 구현 계획과 실제 호환성을 구분한다. 초기 기준선에서는 모든 콘텐츠 기능이 unverified다. 웨일 설치 파일 존재 확인만으로 API나 재생 호환성을 판정하지 않는다.

2026-10-11: PRD v5 Stage A의 순수 상태/저장 조정 자동 테스트 통과. 실제 자료/브라우저 기능 증거가 아니므로 아래 지원 상태는 승격하지 않는다. [검증 기록](TEST_RESULTS.md) 참고.

2026-10-11 추가: IndexedDB 생성/원자적 저장/CAS/재연결 테스트와 실제 Edge 웹 오리진 프로세스 재시작/오프라인 재조회 통과. Whale 확장 오리진/PC 비정상 종료는 미검증이며 콘텐츠 포맷 지원 등급을 변경하지 않는다.

| 형식/환경 | 계획 | 현재 상태 | 지원 확정 조건 |
|---|---|---|---|
| Windows 웨일 MV3 | 우선 대상 | experimental (5.39.412.57 headless 기반 PASS) | 보이는 실제 창/배치·나머지 인수 별도 |
| Chromium mock | 창 메시지 경계 검사 | 기반 자동 테스트만 | 제품 인수/실기기 보증 아님 |
| macOS 웨일 | 후속 | unverified | OS 창/권한/폰트/배치 시험 |
| PDF | 첫 자체 Player | experimental (보조 환경의 정적 렌더만) | 실제 Whale X-03, 다양한 파일/레이어/내보내기 인수 전 supported 금지 |
| PPTX | 후보 비교 후 부분 통합 | unverified | X-04, 실제 10종+ 기능별 결과 |
| PPT / SHOW | 파서/변환 경로 검증 | unverified | X-10, 오프라인/라이선스/실물 |
| Canva W0 | 링크·창·세션 노트 | partial | 링크 저장·제목·명시적 새 탭·재연결 PASS; 관리형 탭·로그인·권한·오프라인 미검증 |
| Miricanvas W0 | 링크·창·세션 노트 | partial | 링크 저장·제목·명시적 새 탭·재연결 PASS; 관리형 탭·로그인·권한·오프라인 미검증 |
| 웹 W1/W2/W3 | 개별 추가 실험 | unverified | DOM/API/정책/권한/전체화면 |
| 다중 모니터 / focus 재생 | P0 품질 | unverified | X-02/05, 보이는 Player 5분 |
| downloads / File System Access | 로컬 저장 | experimental (편집정보/보조 환경) | X-07 Whale·OS chooser·다운로드 완료/취소/실패·재연결 |

2026-10-11 세션 메시지/창 재사용: 역할 제한·공개 projection·commit 후 port 동기화·Remote 닫힘·worker 재생성은 자동 대역 검증 통과. 5개 viewport × 4화면의 Edge 합성 UI 배치 검사는 보조 증거다. Whale 실행 파일을 현재 표준 설치 경로/등록에서 찾지 못했으며, runtime.getContexts/실제 port/확장 DB는 미검증이다. Chrome/Edge를 지원 대상으로 추가하지 않는다.

## 기능별 판정 기준

2026-10-12 빠른편집: actualWhaleheadless 우클릭/아이콘/합성600ms pointerlongpress→현재Editor선택·창재사용/기존노트draft·발표불변PASS(experimental). 물리터치/IME/듀얼모니터배치/focus는미검증, teacher응답/노트는Player에보내지않음. TEST_RESULTS02:59.

2026-10-12 PDF copy UI: actual Whale5.39.412.57 headless extension+CSP/nativeOPFS write-close-readback PASS, 기존파일거부/취소/델타·원본hash·발표보존/정상재시작, 별도Node PDF.js mask/text PASS. experimental PDF output이며 사용자 OS chooser/downloads/native외부뷰어/실물파일은 남음. PDF성공은 편집정보백업/종료증거가 아니다. TEST_RESULTS02:51.

2026-10-12 PDF copy writer: experimental engine only. 실제 Whale dev-origin 합성4회전/crop/한글·mask·pen·원본hash/검색text 유지, 독립PDF.js 재렌더 PASS. 사용자 저장UI/제품파일write-readback/extension CSP/native외부뷰어는 남음. 원본PDF 벡터 유지, 오버레이는 PNG이며 검색가능 text가 아니다. TEST_RESULTS00:58. PDF형식 전체 지원등급은 변경하지 않는다.

2026-10-12 전체 종료: actual Whale5.39.412.57 headless에서 별도 확인 취소/자료별 선택/오래된 백업 실패 자료 유지·다른 자료 종료/검정 대기/새 확정 파일 저장 후 남은 자료 재확인/초안 유지/정상 재시작 all-closed 복구 PASS. experimental이며 원본/델타/Editor는 삭제하지 않는다. 실제 OS chooser/downloads/보이는 창/영구 정리/PDF 복사본은 미실시. TEST_RESULTS 00:48.

2026-10-12 current close: actual Whale5.39.412.57 headless 기반에서 saved 확인 후 현재만 closed/검정 대기, 변조/취소 유지, 다른 B·두 Editor draft 유지, 명시적 재개/새 백업 없이 종료/정상 재시작 PASS. experimental이며 문서/델타는 삭제하지 않는다. 전체 종료/영구 삭제/OS chooser/Whale downloads/보이는 창 인수는 남는다. TEST_RESULTS 00:31.

2026-10-12 저장 재검증: 실제 Whale5.39.412.57 headless extension에서 native OPFS 출력+저널→시험 PC fixture 선택→worker 실제 fetch/hash/전체 확정 상태 확인 및 같은 revision 내용변조 거부 PASS. `저장 파일 확인`은 experimental이며 OS chooser/Whale downloads/종료 CAS/draft freeze 보장은 아니다. 근거 TEST_RESULTS 00:16.

2026-10-12: 실제 Whale5.39.412.57/Chromium150 전용 headless 프로필에서 dist MV3 로드, runtime.getContexts 창 생성/재사용, 실제 PDF A5/비공개 A8 노트·Player 보호, Remote 닫힘 유지, 정상 프로세스 재실행 strict DB 복구 PASS. [검증 기록](TEST_RESULTS.md). 실제 보이는 창/다중 모니터/focus/chooser/Whale downloads/IME/강제 종료는 미실시이며 전체 지원 확정은 아니다. 저장 결과 저널 prepared/hash→terminal 및 다른 페이지 재조회는 Edge 보조 PASS, worker 종료 권한/CAS는 미구현이다.

2026-10-11 로컬 편집정보: actual PC JSON download/read/reimport, strict 새 수업·원본 재연결·발표 대기/명시적 재개·기존 수업/hash 보존과 native OPFS 출력 write/close/readback/no-overwrite 보조 PASS. 확장 downloads broker/OS chooser는 대역이므로 Whale/FSA PC 경로 지원 보장은 아니다. 종료 저널/PDF 복사본은 미구현이다.

2026-10-11 PDF 기능: open/page-count/goto-page/private-preview/원본 hash·동일 자료 재사용은 실제 합성 A/B + Edge 보조 시험 통과(experimental). 앞뒤 선행 렌더와 LRU는 단위/브라우저 경로 확인. Editor 글상자/판서/가리개와 Player 확정 레이어 표시도 experimental 보조 검증이며 X-06 Whale 인수는 남는다. export/links/annotations/embedded-media/effects는 unverified 또는 미구현이다. 원본 PDF의 한글/사진/투명도/수식/암호/큰 파일/Whale 인수는 추가 필요. offline은 이미 열린 파일의 페이지 이동만 실제 네트워크 차단했으며 cold-start 확장 검증과 구분한다.

- unverified: 실험/구현 결과 없음. 실제 기능 버튼을 활성화하지 않는다.
- experimental: 실험 경로만 있고 일반 수업 보증 없음.
- partial: 샘플/환경별 검증된 기능과 미지원 항목을 함께 설명.
- supported: 명시한 환경과 기능의 인수 근거가 있음.
- unsupported: 경로가 없거나 실험 실패·정책 제한을 확인함.

코드 계약: src/adapters/types.ts와 src/core/capabilities.ts. 계획만 있는 포맷도 항목에 포함하지만 실행 어댑터가 구현된 것은 아니다. 특정 기능을 승격하면 날짜/OS/브라우저/샘플/테스트 ID와 결과 문서 경로를 함께 기록한다.
