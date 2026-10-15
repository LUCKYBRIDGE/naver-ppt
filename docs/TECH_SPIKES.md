# 기술 실험 기록

2026-10-14 PPTX source 자원 인벤토리: 현재 모듈 realm에 숫자 record만 두고 queued/preparing/cancelling/ready와 source lease 수명을 관측했다. raw backing/owned Blob alias는 source 안에서 dedup하며 physical memory/model heap은 측정하지 않는다. check 1,422 tests와 actual Whale 두 realm 논리 합 PASS, 전체 origin byte 예산·WorkingSet 해소 근거는 아니다. [범위](pptx/RESOURCE_INVENTORY.md).

2026-10-14 PRD v5 §16/25에 따라 현재 측정값과 미확정 항목을 [PPTX 성능·자원 예산](pptx/PERFORMANCE_BUDGET.md)에 고정했다. 입력/항목/SourceVault 한도와 전체 세션 메모리 예산을 분리하고, WorkingSet 1,734,160,384bytes FAIL을 유지한다.

2026-10-14 검증된PPTX native미디어URL대여: source retain으로부모runtime해제뒤native owner가src를비우기전자산을보존한다. actual 같은DOM/reprepare·최종해제/현재PDF·1,412tests/빌드PASS. teacher-02URL22/92,769,395bytes유지로추가56.8MB URL을제거했으나WorkingSet1,734,160,384bytes는FAIL. 물리복제/전체예산과분리한다. [근거](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 SourceVault get에optional signal/독립controller·close를연결하고늦은handle/File/validator/cache반영과새원본덮어쓰기를막았다. actualRemote nativequeue취소·읽기0/Worker0·현재PDF/음원,1,403tests/빌드·제품회귀PASS. 취소불가읽기의reservation은실제완료까지유지,전체WorkingSet해결근거는아니다. [증거](pptx/SOURCE_CANCELLATION.md).

2026-10-14 PPTX 준비gate: 등록/점검/source/원본identity를같은originexclusive Web Lock으로직렬화했다. actualWhale native popup2창에서queued취소/active실제읽기완료까지예약·실패/닫힘release·API부재failclosed/현재PDF·원본보존PASS. 1,395tests/빌드/제품회귀PASS. 단일teacher-02 전체WorkingSet1,794,793,472bytes는FAIL,validator queued취소와모델누적byte예산은후속이다. [증거](pptx/PREPARATION_ADMISSION.md).

2026-10-14 private scratch: 프로세스종류별WorkingSet/PrivateMemory·Runtime backing/embedder·해제뒤1/5초를관측했다. 검증된private raw/parser asset과미디어hash scratch를선택형transfer(0)으로소비해미디어쪽backing240.20→113.93→57.15MB를확인했지만최종전체1,754,501,120bytes는 **기준FAIL**. raw/Blob/File보존·1,387tests/빌드와Whale기능회귀PASS,전역/동시모델budget과전체성능인수는남는다. [근거](pptx/PRIVATE_BUFFERS.md).

2026-10-14 중복 raw 해제: guard/hydration/recovery 후 exact owned Blob 스트림 대조와 hash/size 근거로 이미지·작은 미디어를 해제했다. 실제 teacher-02 중복 raw 약36MB 해제·owner/취소·제품 회귀 PASS, 최종 WorkingSet1,712,766,976bytes는 **성능 FAIL**. raw/backing 모두9,335,184bytes여서 작은 view의 큰 buffer 보유 가설은 이 표본에서 확인되지 않았다. 원본 품질·기준·GC 변경 없이 다음 자원 예산/retained 원인 분리로 이어간다. [증거](pptx/DUPLICATE_PARTS.md).

2026-10-14 IMPL-T-28 inflight:같은File 두요청을Worker1/공유자산으로처리·한취소는상대유지·전체취소Worker종료/새요청·최종owner81자산해제/현재PDF유지를actualWhale1791967531723으로확인했다. publication전달전취소의pending재사용경합도unit보완.1,367tests/빌드/최종준비PASS. 대용량표본1,624,035,328bytesFAIL은보존하고다른자료/창예산은후속이다. [근거](pptx/INFLIGHT_SOURCE.md).

2026-10-14 IMPL-T-28/PRDv5 §16: 숫자 관측으로 Editor 쪽별 재마운트의 source 해제/재파싱과 같은Blob/File 미디어3회읽기를 확인했다. 한 선택 자료 lease와 성공identity WeakMap 재사용으로 parser1/MP3읽기1, 수정 후 두 표본1.6008/1.5813GB·기능 회귀 PASS. native MP3의 metadata시점 전체buffered 보고만으로 PCM메모리/전체버퍼 최적화 원인을 확정하지 않아 preload는 유지했다. 전역/다중 자료 자원예산은 후속. [범위/실패 보존](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 IMPL-T-28: SessionHub raw PPTX 전환3종/자동 넘김 입장 차단·정상 UI 시험 이행, 실제 Whale 직접 거부/교사·내장/PDF/owner/checkpoint·전환 계약과1,356tests/빌드 PASS. teacher-02 새 준비 경로의 전체 WorkingSet 표본은1.640/1.620GB로 기존1.5GiB 기준 초과 FAIL. 단계 관측상 미디어 쪽/음원 실행/복귀 근처 증가, 원인 분리와 bounded 자원 정책은 후속이다. [근거](pptx/TRANSITION_ADMISSION.md).

2026-10-14 IMPL-T-28 Player staging: Remote REQUEST·지정 owner 공개 목표·숨긴 runtime/native passive 준비·동일 DOM/video 승격 연결. actualWhale UI1791937459793/미지원1791937350812/내장1791937459925·교사/PDF/계약 회귀·1,351tests/빌드 PASS. 초기 ready 재보고의 효과 상태 회귀를 수정했다. 직접 전환 입장/대용량 동시 메모리·물리/전체 충실도 미완료. [범위](pptx/PREPARED_SCENE.md).

2026-10-14 IMPL-T-28 전환계약1단계: actualWhaleRPC1791935221159에서pending의strict영속화·worker재기동/현재PDF·무음음원유지/지정owner확정·중복/취소/새owner과거요청거부·닫힌자료명시쪽재개·backup새수업제거·노트/이름없는목표조회PASS.1,344tests/빌드PASS. 새소비경로의실제표면준비/입장차단은미연결이며전체안전전환완료아님. [계획](plans/2026-10-14-player-transition-commit.md).

2026-10-14 IMPL-T-28: Remote의PPTX선행runtime검사/취소·대상재검증과명시ACTIVATE쪽원자전환을연결했다. actualWhale1791933132393 미지원20.001초회전활성화/이전쪽무commit·PDF픽셀/세션유지·정상2쪽직접전환/5화면PASS,교사제품1791933009519/PDFfoundation1791933010227 회귀PASS.1,324tests/빌드PASS. 직접명령입장/Player실제준비staging·PDF연결/전체graceful degradation은미완료. [계획](plans/2026-10-14-pptx-transition-safety.md).

2026-10-14 X-04: 실제1쪽의배경차이는master bgRef1001을core0.4.5가마지막style로clamp하는오류였다. 고정source/SHA 검증 빌드patch·잘못된참조의흰색fallback방지·MIT변경고지추가. actualWhale1791912319024 합성10종/1791912346260 전체52쪽/기존3회귀PASS,1쪽MAE10.62→2.18·원본hash불변/학생화면독립/외부0.1,304tests·빌드PASS. 최종충실도/엔진선정은미완료. [계획과공식근거](plans/2026-10-14-pptx-background-reference.md).

2026-10-14 X-04/Stage C: 제품MV3 CSP에서FontFace local한글별칭/실제Calibri·Malgun·맑은고딕확인/원본지정명조회실패를actualWhale1791909685232로검증하고bounded64종·1500ms대기/취소·숫자안내를등록/파일점검에연결했다. 제품위험고지1791909913244/원본점검취소·시간초과1791910059593 PASS. 1,288tests/빌드·원본불변/학생화면보존,권한/font설치/renderer교체없음. 실제적용·상속/theme/embedded・glyph/license/충실도는미검증. [계획](plans/2026-10-14-pptx-local-font-preflight.md).

2026-10-14 X-04 후속: 원본XML↔제품텍스트hash52/52일치,PDF추출만33쪽So기호1개차이. 실제Whale선택6쪽CDP사용글꼴MalgunGothic+Calibri확인(1791909257887). 테스트DOM전용MalgunGothic대조군(1791909344156)에서17쪽MAE34.95→16.22/30쪽35.74→19.67로감소해폰트선택기여확인. 1쪽개선작아fill/이미지진단은남는다. 제품fallback/권한/원본변경없음·지원승격없음. [세부근거](pptx/TEACHER_02.md).

2026-10-14 X-04: actualWhale `whale-pptx-visual/1791908785569` 전체52쪽720×540·독립편집/원본hash불변/외부0. 비표시SVG title/desc를제외한본문hash51쪽일치/33쪽불일치, 평균MAE21.5813·차24초과픽셀비율중앙13.5974%. 글꼴숫자Preflight를추가하고설치·적용은unknown유지. 캡처경계1px오차는명시clip+raw크기assert로해결했다. CP949 stdout의손상오판은UTF8/ASCIIescape원본재확인으로정정. 렌더러최종채택/충실도지원승격없음. [계획](plans/2026-10-14-pptx-visual-fidelity.md)/[근거](pptx/TEACHER_02.md).

2026-10-14 X-04: teacher-02 External호환audio+p14내장관계의로컬선택/모델누락src보완/기존hashbinder유지. 실제제품MP3등록/무음재생·정지/PDF복귀/자산해제 PASS(1791906468561). 메모리기준초과실패후준비File공유·Workertransfer·원본largepart size/hash캡처/중복buffer해제로표본browser최대1,568,329,728bytes. 실제음질/원본타이밍/전체인수는미완료. [근거](pptx/TEACHER_02.md).

2026-10-13 X-04 대용량미디어:음원/영상64MiB후보를metadata/Worker/asset경계에일치시킨뒤teacher-02등록·일부화면·nativeMP3 3547.92초·Editor자산해제0/PDF복귀를actualWhale1791901996577로확인했다. 표본전체browserWorkingSet최대1,552,617,472bytes. 모델audio주소null로제품연결은미완료이며외부호환참조/내장p14관계복원은후속이다. 일반32MiB/XML4MiB/전체256MiB·ratio유지. [계획](plans/2026-10-13-pptx-large-media.md), [자료/제한](pptx/TEACHER_02.md).

2026-10-13 X-04/IMPL-T-27 teacher-02:실제52쪽PPTX98MB에서내장MP3 56,779,103bytes의32MiBentry한도실패를제품Whale로확인했다. 기존PDF세션/픽셀불변/기준PDF1·26·52표시·안전한대안고지PASS,한도유지. PPTX충실도는미검증/차단이며대용량자산의지연읽기·메모리상한실험이선행되어야한다. [근거](pptx/TEACHER_02.md).

2026-10-13 X-04/IMPL-T-28: 합성20.001초회전 OOXML에서 모델파싱 성공/engine binding 실패/제품빈표면을 실제Whale로 재현했다. 신규등록 사전binding 검사와 실패쪽/PDF·원본앱 안내, 기존PDF선택·픽셀보존/다음쪽·PDF복귀 확인. 기존guard 유지/자동정적fallback 없음. [제한·재현](pptx/DEGRADATION_PREFLIGHT.md), [Stage D 판단 계획](plans/2026-10-13-pptx-fidelity-continuity.md).

2026-10-13 source runtime 재준비: 기존모델/Blob/슬롯 재사용·입력/회차/run/request/renderer검사, 실행 없는 sourcecursor복원 경계. 실제Whale1791885072296 같은native 영상0.182305→0.224682초/volume.35·완료cursor 유지, 과거pending/action무실행·invalidclip새Player복원/교정/백업 PASS.1,201tests/빌드·교사제품1791885072190/PDF foundation1791884344131 PASS. [범위](pptx/MEDIA_TIMELINE_REFRESH.md).

최종2026-10-13 sourceTimeline: 내장1791883338948/교사제품1791883338827/owner1791883548865/foundation1791883548564 모든실행 exit0 PASS. owner/foundation의 기존 async 대기도 명시 await/poll로 보완한 뒤 검증했다. 아래 진행중 메모를 대체하며 전체 지원 승격은 하지 않는다. [범위](pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 sourceTimeline: 실제Whale 제품 UI로 원본750ms 순차 미디어-only5그룹/native 영상·ACK/취소/실패재시도/새Player action0을 확인했다(1791883200846). 원본 설정/출처/전체 branch gate·인덱스 공유 추가. 마지막 occurrence 보완의 최종 회귀는 진행 중이며 혼합·concurrent/seek·동적재준비/충실도는 미완료다. async waitForFunction의 Promise truthy 오류를 설치 코드로 확인하고 Node await/poll로 완료 근거를 다시 얻었다. [범위](pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 native endpoint: 실제Whale `pptx-checkpoint/1791881623150/result.json`에서 native 수락→source 결과 저장, 자기 ACK 억제, 과거 playing bookmark 정지/위치 유지, 취소 뒤 늦은 commit 보정과 교사 재생 소유권 유지 PASS. 제품 LocalMediaPlayer 등록까지 연결했으며 원본 타이밍 그룹 caller는 후속이다. 순차 native 경계를 concurrent/seek/복합 타임라인 충실도로 확대 해석하지 않는다. [범위](pptx/NATIVE_PLAYER_ENDPOINT.md).

2026-10-13 09:22 source native CHECKPOINT_PPTX_MEDIA·bookmark sourceRunEpoch 저장/취소 계약. 1,153tests/빌드 및 실제Whale1791850866864 owner/실제영상결과·취소·volume변경·늦은결과/receipt/복구, 교사제품1791850786808/foundation1791850786972 회귀 PASS. timing→native callback과자기ACK재적용억제는미연결. [범위](pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 09:12 sourceMediaSettings→제품연결: strict대상과명시적음량/음소거·p14trim을 native길이로변환. 1,131tests/빌드 및 실제Whale1791850286198 Editor→Player구간끝정지·설정보존/백업·기존전체내장/교사제품1791850170029 회귀 PASS. default미확인/원본trigger·동시/seek·전체인수 유지. [근거/공식출처](pptx/SOURCE_MEDIA_SETTINGS.md).

2026-10-13 09:03 root/mainSeq 제어 gate: Microsoft SequenceTimeNode의 disabled/none 기본값 및 concurrent/seek 의미를 근거로 전역 구조·시작/대기 조건을 검사했다. 1,116tests/빌드 및 실제Whale checkpoint1791849769204 XML 판정·muted native 지연/취소/ACK/복원 회귀 PASS. 제품 native bookmark 통합과 concurrent/seek 실행은 미완료. [범위/출처](pptx/NATIVE_MEDIA_ACTIONS.md).

X-04 지연: 선택mainSeq 클릭그룹→cmd의 명시적 unconditional delay 합계·조건/after/repeat/end/seq거부, deadline native예약/현재회차/취소. 1,098tests/빌드·actualWhale1791849167813 원본XML50+100ms/실제mutedWAV150ms후1회·대기취소0/onClick거부 PASS. root/seq전체·설정·제품통합은미완료. [근거](pptx/NATIVE_MEDIA_ACTIONS.md).

X-04 원본call 준비: cmd와 같은root의 직접audio/video 선언·등록kind/scope/path/hash 일치/정규action, runtime 요청시준비·dispose후반환거부. 1,080tests/빌드 PASS. 원본시간/조건·Player bookmark 통합전이며 자동실행없음. [계약](pptx/NATIVE_MEDIA_ACTIONS.md).

X-04 ACK취소: native명령 수락 이후에도 durable ACK까지 취소유지·성공재생유지·동기start취소/중첩WAAPI 격리. 1,063tests/빌드·actualWhale1791848414351 실제 mutedWAV+sourceDriver/bridge/strictDB 합성 ACK보류/늦은ACK PASS. 원본XML/제품Player통합은미완료. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

X-04 native 미디어call: type생략call/초단위playFrom 정규화·native metadata/범위/현재회차·즉시명령완료/취소·늦은성공/토글경쟁 guard. 1,059tests/빌드·actualWhale1791848003458 muted 합성WAV 명령 PASS. 원본root연관/조건/지연·durable bookmark·제품연결은 미완료. [근거](pptx/NATIVE_MEDIA_ACTIONS.md).

X-04 원본shape그룹: 실제 공식groupSteps/모델identity와 source shapeSteps 전체·순서 대응, split/merge/누락/재정렬 및 unsafe clickGroup 거부. runtime 엔진총수 확인·고지. 1,029tests/빌드·actualWhale1791847538767 교사12그룹/합성[null,0,null] PASS. 조건/지연/native실행 미완료. [계약](pptx/SOURCE_GROUP_PLAYBACK.md).

X-04 원본그룹커서: source-v1/transform-v1 분리·미디어-only 완료수·도형 prefix 복원·양쪽 완료/실패 정리. 1,012tests/빌드·actualWhale1791847210123 3그룹완료/재시작 미디어factory0 PASS. 미디어합성promise/제품runtime미연결, 원본시간·native실행 근거 아님. [계약](pptx/SOURCE_GROUP_PLAYBACK.md).

X-04 원본순서: mainSeq 자식구조/모델shape index 대응·media-only/독립media 보존, seq제어metadata→runtime진단/Player고지. 992tests/빌드·actualWhale1791846343496 교사12구조/12효과와 합성3구조/shape1/media-only2 PASS. 실제시간/지연·원본trigger/clip설정·전체충실도는 미완료. [범위](pptx/SOURCE_ORDER.md).

X-04 2026-10-13 조건 분류: cTn 부모/시작·종료조건 참조·indefinite·반복1/1000·역재생/p14 trim 개수를 보존하고 미검증 의미를 분리했다. 979tests/빌드·actualWhale1791845740393 합성/교사원본·기존내장회귀 PASS. 트리거 실행/클릭그룹·clip총길이·물리·충실도는 미완료. [범위](pptx/MEDIA_TIMING.md).

X-04 2026-10-13 07:50: 원본 mediaTimingTarget과 등록 모델 중첩path, 원본 pic관계·실제 자산hash를 연결하는 진단 API. 956tests/빌드 및 actualWhale1791845299247 합성 audio/video/cmd, ID누락/바이트변조 거부 PASS. 원본트리거 실행은 미연결/문서순서를 클릭순서로 취급하지 않는다. [근거](pptx/MEDIA_TIMING.md).

X-04 2026-10-13: 원본 미디어 타이밍 숫자 검사·파일/모델 Preflight를 연결했다. 937tests·빌드/실제Whale1791844433682 합성audio-video-cmd 및 Editor세션·학생화면보존 PASS. 어휘인식과 원본트리거 실행은 구분하며 등록path/조건 의미/충실도는 미완료다. [근거](pptx/MEDIA_TIMING.md).

X-04 영상+회전(2026-10-13 03:45): 생성OOXML 영상target90도 클릭효과를 제품Remote에서 실행, 동일native .1→1.414803초/pausedfalse·angle90/clip·완료checkpoint1·새Player90도/clip/1.434132초정지복원 actualWhale1791830666738 PASS/직접확인.909tests·빌드·내장전체회귀PASS. 원본trigger·고급조합후속.[근거](pptx/PLAYER_MEDIA.md).

X-04 연속성(2026-10-13 03:38):actualWhale1791830114932 내장video worker재시작 동일node/소유권/시간증가·Remote정지,실패target 사전검사→기존native재생보존,PDF읽기중revision증가등록·노트/발표보존 PASS.909tests/빌드·foundation1791830114955 회귀PASS. 원본trigger/고급조합·진행중미디어추가후속.[근거](pptx/PLAYER_MEDIA.md).

X-04 영상crop/shape clip(2026-10-13 03:30): 원본srcRect 비율을 native영상 확대/이동으로, 안전한 SVG path를 foreignObject clip으로 적용.901tests/빌드·실제Whale1791829563020 제품UI 합성crop+ellipse 픽셀 PASS/직접확인.제품PPTX1791829591948/foundation1791829592085 회귀PASS.음수/과도crop/reflection·원본trigger/고급조합·물리/충실도 후속.[근거](pptx/PLAYER_MEDIA.md).

X-04 Player내장수동미디어(2026-10-13 03:20): guarded runtime 원본재추출/strict출처·hash→SVGforeignObject/native portal·moveBefore노드보존.890tests/빌드·actualWhale1791829184123 기본영상영역/픽셀·Remote·노트revision연속·자료교차·새Player/백업복구·Remote닫기/Editor탐색음원연속·현재종료 PASS. 원본trigger·고급변형/효과동시·물리/충실도후속.[근거](pptx/PLAYER_MEDIA.md).

X-04 Editor내장미디어(2026-10-13 03:05):PptxMediaControls→선택쪽 guarded추출/native전체검사→최신session/revision strict등록·memoryvault.869tests/빌드·actualWhale1791828240243 제품버튼/취소/실패·중복재연결/다른발표쪽불변/Enter·5viewport/캡처직접확인/foundation1791828240272 회귀PASS. 원본위치/트리거·Player원본재추출복구 후속.[근거](pptx/EMBEDDED_MEDIA.md).

X-04 내장 미디어(2026-10-13 02:56): 소유 Blob 직접 추출·원본/part/요소경로·해시 검증과 출처 strict 저장/백업 계약. 855tests/빌드 PASS, 실제Whale1791827767082 합성 WAV/MP4 바이트해시·duration·외부요청0/취소/dispose·제품Editor sender 등록/다른원본·중복거부·metadata복구 PASS. 제품 내장 연결UI/Player 재생·원본 위치/트리거는 미연결. [근거](pptx/EMBEDDED_MEDIA.md).

X-04 PPTX overlay(2026-10-13 02:44):sourceView로기존Editor draft/확정·font측정연결,원본SVG/runtime효과와별도portal/sizingcanvas.원본픽셀가짜샘플링차단·수동색.823tests·빌드/실제Whale1791826916205 draft보호/최소font overflow/한글·가리개·판서·Player표시/효과완료pose/새Player·백업복구PNG동일·foundation1791826934209 회귀PASS.원본색추출·내장media/충실도는필수후속.[근거](pptx/OVERLAYS.md).

X-04 일반실험입력(2026-10-13):commonImport lazy형식dispatch/명시opt-in/취소·원본지문재연결/등록UUID비공개SVG·노트.814tests·빌드,actualWhale1791826400096 helper없이제품UI등록→Remote12효과→파일백업복구→UI재연결/비공개독립·취소/3창5viewport·원본불변PASS/foundation1791826254333 회귀PASS. overlay·내장media/충실도미완료.[상세](pptx/PRODUCT_IMPORT.md).

X-04 PPTX편집정보백업(2026-10-13):strict schema1 형식별한도/완료pose·델타유지·복구scope재설정/run·request정지.신규11개/802tests·빌드,actualWhale1791825423523 nativeOPFS새파일→PCJSON→재검증→Launcher복구→대기→같은원본helper→완료화면PASS·foundation1791825446215 회귀PASS.일반Import/Editor/내장media·충실도후속.[상세](pptx/LOCAL_BACKUP.md).

X-04 Remote UI(2026-10-13 02:09): `PptxEffectControls`→strict request→`PptxRequests`→runtime requestId/완료 ACK 연결. 과거 pending 보류·새 ID만 시도·취소/마지막 완료 pose·실패/소진 안내. 791tests·빌드, 실제 Whale profile1791823852936 Remote12효과/새Player/worker재시작/명시 실패주입/native취소/5화면/원본불변·foundation1791824821236 회귀 PASS. 일반 등록·백업·미디어/충실도는 미완료. [상세](pptx/REMOTE_REQUEST.md).

X-04 Remote 요청 계약(2026-10-13): strict intent/receipt→정확한requestId 소유 Player 소비→취소·전환 무효/완료pose보존. 신규26개/780tests·빌드와 실제Whale1791817147765 API 권한·늦은BEGIN 거부/기존12클릭 PASS. UI 소비/진행취소는 후속. [근거](pptx/REMOTE_REQUEST.md).

X-04 제품Player runtime(2026-10-12 23:45): guarded sourceModel공유→등록UUID/part→공식0.4.5 state/playGroup·기존원본transform/strict pose/ACK·실제Player ShadowRoot. 등록helper만추가한actualWhale1791816181361 teacher12클릭/자료복귀/새Player재파싱복원·5viewport PASS,754tests·빌드 PASS. 일반UI·전체충실도지원아님. [상세](pptx/PRODUCT_PLAYER_RUNTIME.md).

X-04 제품비공개미리보기(2026-10-12 23:29): shared ready job/presentation응답→asset 소유hydration→원본순서·임시UUID→safeSVG/ShadowRoot. 실제Whale제품dist teacher23쪽/117이미지decode·수업/Canvas불변·URL해제·취소·5viewport PASS/747tests·빌드 PASS. 미검증효과/원본글꼴/일반발표활성화아님. [상세](pptx/PRIVATE_PREVIEW.md).

X-04 제품 모델 Worker(2026-10-12 23:16): 공식0.4.5 파서를 모델 진단에만 고정, 해당worker.js의sideEffects보존+ready handshake. 실제제품dist teacher23/174요소/12효과·lazy/외부0·Canvas불변·send취소/5viewport PASS,729tests·빌드 PASS. 일반 발표/지원승격 아님. [결정/제한](pptx/PRODUCT_MODEL_WORKER.md).

X-04 Editor 구조점검(2026-10-12 22:58): 제품dist UI→실제로컬File/ZIP Worker/XML/순서→teacher23쪽/타이밍4·PDF session/snapshot/Canvas픽셀SHA256 불변/오류·native Worker send취소/5viewport PASS. check709tests·빌드/fflateLICENSE동봉. 렌더러/발표제품화는후속. [상세](pptx/EDITOR_INSPECTION.md).

X-04 모델고지(2026-10-12 22:45): nested/cycle-safe bounded요약과원본XML·등록대응preflight/미발견unknown/재생·충실도분리. check702tests·빌드/실제Whale 합성·teacher-01효과4쪽12개고지/기존회귀 PASS. 일반UI는후속. [상세](pptx/MODEL_PREFLIGHT.md).

X-04 모델대응(2026-10-12 22:39): 공식parser sldIdLst/관계순서코드와실제Worker순서변경의제목/표/효과5/0대조. modelBinding/17단위·check687tests·빌드 및실제등록UUID runtime DB/새Player복원/teacher-01 Worker23ID대응 PASS. 일반UI/충실도는후속. [상세](pptx/MODEL_BINDING.md).

X-04 등록준비(2026-10-12 22:30): 원본 sldIdLst/관계 순서·경계와isolated ZIP/XML→metadata/UUID→Editor등록 ACK·동일원본재연결 PASS. 실제DOMParser 공격9거부/teacher-01 23쪽준비·hash불변/기존runtime회귀 PASS, check670tests·빌드 PASS. 일반UI/renderer대응·충실도는후속. [상세](pptx/REGISTRATION.md).

X-04 원본경계(2026-10-12 22:22): readPptxInput/전용vault와 실제 Editor→Player/새 Player 원본 채널 재해시·Worker/5효과 복원 및 변경원본 거부/수업불변 PASS. check660tests/빌드 PASS. 원본 자동저장/권한·지원승격 없음. [상세](pptx/SOURCE_BOUNDARY.md).

X-04 Runtime renderer(2026-10-12 22:16): 공식 engine driver/모델·그룹/수명 경계와 실제 Player sender의 Worker 모델·5효과→runtime strict ACK/DB→자료복귀·새 owner/재파싱 복원 PASS. check651tests/빌드 PASS. 일반 UI 활성화·실물 충실도는 후속. [상세](pptx/RUNTIME_RENDERER.md).

X-04 Player transport(2026-10-12 22:06): 실제제품background의신규BEGIN/CHECKPOINT owner/다른창·수업거부·worker재시작후완료/owner/receipt유지·승계 PASS. 공개transport 세션/revision/clone/연결없음요청전차단, check640tests/빌드 PASS. 합성metadata이며실제renderer/UI통합은후속. [상세](pptx/PLAYER_TRANSPORT.md).

X-04 ACK연결(2026-10-12 21:58): 실제Worker 모델/5효과 완료pose→strict DB→A/B/A 및동일Whale 정상재시작/새파싱복원 PASS. 실패응답 rollback/재시도·ACK busy와check626tests/빌드·교사/미디어회귀 PASS. 격리Hub 호출이며제품background/UI·실물비교는후속. [상세](pptx/PLAYBACK_BRIDGE.md).

X-04 영속완료(2026-10-12 21:46): 원본 지문/renderer ID·scope 검증 완료pose와진행 epoch를제품core/메시지/strict DB에연결. 실제Whale 정상재시작DB·A/B/A/늦은완료거부 및기존 effects/MV3 foundation회귀 PASS, check604tests/빌드 PASS. 제품PPTX 화면/실제model검증·백업은후속. [상세](pptx/DURABLE_CHECKPOINT.md).

X-04 기본곡선(2026-10-12 21:34): source 회전/확대의 기본/명시적0 accel/decel에 linear 적용. 실제 Whale 시간기준1/4·1/2/역방향·분수완료0.5/45도·9조건거부 PASS, check583tests/빌드와교사/미디어회귀 PASS. 실물PowerPoint/비영곡선·제품통합은 미완료. [상세](pptx/LINEAR_TIMING.md).

X-04 유한 반복(2026-10-12 21:29): 원본 repeatCount/autoRev 단일 계층 조건을 기존 엔진 활성시간과 새 WAAPI timing에 전달. 실제 Whale 합성6조건/afterPrev/pose복귀/취소 및 교사·미디어 회귀 PASS, check581tests/빌드 PASS. 원본 시간곡선·제품통합은 미완료. [상세](pptx/REPEAT_TIMING.md).

X-04 원본확대(2026-10-12 09:27): 후보의강조preset6→zoom→opacity0.35 의미손실 재현. 공통transform 경계·원본X/Y값전달로 실제Whale 완료/pose복귀1.5·0.5/중심유지·5변형중간행렬/조건8종거부 PASS. Office노트의ScaleX/ScaleY·to-only시작0/by무시 반영. scale43/회전1 추가, check546tests/빌드·교사/미디어/회전회귀 유지. 제품미연결·실물/반복/고급효과미완료, PPTX unverified. [상세](pptx/SCALE_SOURCE.md).

X-04 원본회전(2026-10-12 09:15): 원본XML의by/from/to와후보step대응을검사하고기존엔진의새WAAPI keyframes만교체. 실제Whale 합성90도/완료pose복귀90도, 음수·끝점·720도중간행렬·baseline회전/이동보존·조건10종거부 PASS. 수정하지않은후보는여전히360도로손실. 단위48개/전체502tests/check·교사23쪽/미디어회귀 유지. 제품미연결/실물PowerPoint기준·고급효과전반미완료, PPTX unverified. [상세](pptx/ROTATION_SOURCE.md).

X-04 고급효과/pose(2026-10-12 08:59): 합성OOXML 입장/퇴장·직선이동은 실제Whale에서 진행, 90도강조회전은0.4.5 parser/viewer의spin360으로 의미 손실. cursor-only복귀의 이동좌표 손실도 재현했다. 완료 모습 snapshot 경계/단위34개로scope·CSS검증/원자적적용, 실제left276·퇴장숨김 복원 PASS/check454tests. 원본90도는 미해결/제품미연결, PPTX unverified. [상세](pptx/EFFECT_POSE.md).

X-04 web-ppt Worker(2026-10-12 08:49): 공식 고정0.4.5 Worker를 로컬 경계로 감싸 teacher23쪽/asset81·media3쪽/asset5의 main 모델/전체자산hash 대조 PASS. Worker 모델로 기존 효과/미디어 실제Whale 회귀 유지. timeout/abort/손상입력 terminate·리스너 정리/메인interval진행, check420tests PASS. Worker sideEffects 제거는 실험 Worker만 treeshake:false로 해결. XML/렌더는메인, 제품미연결/PPTX unverified. [상세](pptx/WEBPPT_WORKER.md).

X-04 web-ppt 미디어(2026-10-12 08:40): 고정0.4.5에서 canonical 합성WAV/MP4의 종류/MIME·원본hash 정확추출, 실제Whale muted재생/영상pixel·자료문맥전환pause·bookmark수동대기복귀 PASS. mediaReference 경계22개/check397tests, teacher23쪽/효과수명 회귀 유지. 제품Player/DB·실제미디어·스피커·고급효과 미완료, PPTX unverified. [상세](pptx/MEDIA_COMPARISON.md).

X-04 효과 수명(2026-10-12 08:35): 실행 busy/취소/늦은 완료 방지/소유 WAAPI 정리 경계를 추가, 단위10개와 check375tests PASS. 실제 Whale teacher-01 독립 A/B 문맥에서 A3 완료2단계 복원·진행 중 B9 전환·이전 애니메이션 idle·늦은 commit 없음·재시작 숨김을 확인했다. 제품 체크포인트/Player·고급 효과·미디어는 후속. [상세](pptx/WEBPPT_ANIMATION.md#실행-수명-후속-검증).

X-04 web-ppt(2026-10-12 08:28): core/viewer-core0.4.5의 제공 상태/WAAPI 엔진과 안전 SVG DOM 투영으로 실제 Whale teacher-01 23쪽/12개 appear 클릭 단계 PASS. 자식 visible이 부모 hidden을 덮던 시험 오류는 화면 확인 후 상속/하위 노드 회귀로 수정. 원본 hash불변·외부0·365tests/check PASS. 제품 미연결/원본 충실도 미판정이며 [상세와 제한](pptx/WEBPPT_ANIMATION.md)을 따른다.

X-04 Worker SVG(2026-10-12 08:15): office Worker에서 전23쪽/합성3쪽 SVG 출력 hash가 본 화면과 일치했다. 교사 선택4쪽과 합성3쪽 Worker SVG도 웨일 이미지 decode PASS. 345tests/check와 기존 회귀 유지(TEST_RESULTS08:15). 같은 엔진의 정적 출력 대조이며 PowerPoint 충실도/효과 재생·제품 연결 완료가 아니다. 다음 효과 재생 후보는 [web-ppt 공식 README](https://github.com/unStone/web-ppt)의 Viewer API를 조사할 수 있으나 주장만 확인했으며 고정 버전·실제 라이선스/코드/웨일 검증은 아직 없다.

X-04 후보 Worker/효과(2026-10-12 08:11): office-kit은 DOM/DOMParser 없는 실제 Whale Worker에서23쪽/합성3쪽 파싱과 효과 요약이 본 화면과 일치했다. 교사 원본 XML의 효과 count3쪽6/9쪽1/12쪽2/19쪽3도 일치. aiden은 model DOMParser 의존성으로 Worker 실패. 345tests/check PASS. 모델 playable은 재생 성공 아님, 후보 미채택/제품 연결 미완료. [근거](pptx/WORKER_TIMING.md).

X-04 ZIP Worker(2026-10-12 08:04): ZIP 검사/해제만 로컬 module Worker로 격리, 15초 제한·취소·성공/실패 cleanup과 원본 사본 transfer. 345tests/check PASS, 실제 Whale 교사23쪽/미디어 및 ready 후 무한 루프 Worker의 timeout/취소·메인 타이머 진행 PASS(TEST_RESULTS08:04). Worker7257bytes. DOMParser/후보 parser는 메인 실행이며 전체 import 격리·메모리 인수 완료가 아니다.

X-04 콘텐츠 검사(2026-10-12 08:00): Default/Override 선언·항목별 타입과 PNG/WAV/MP3/MP4/WebM 초기 헤더를 대조한다. 335tests/check PASS, 실제 Whale teacher-01 헤더81/미검증1과 canonical media 헤더5/잔여 override2에서 기존 렌더/무음 재생 유지. 합성의 없는 slideMaster 선언으로 첫 실패 후 위험 검사는 유지하고 잔여 선언만 경고로 기록했다(TEST_RESULTS08:00). 전체 코덱/구조·Worker 격리·제품 Player와 충실도는 후속.

X-04 관계 검사(2026-10-12 07:55): 정상 상대/루트 내부 대상과 존재 여부를 확인하고 경로 이탈·중복 ID·잘못된 관계 구조를 거부한다. 외부 주소는 반환하지 않으며 위험 프로토콜 등을 개수로만 기록한다. 317개 테스트/check와 실제 Whale 교사 23쪽(내부 관계192), 합성 미디어(관계35) 회귀 PASS. 상세는 TEST_RESULTS 07:55. ContentTypes/signature/CPU 격리·원본 충실도·제품 연결은 후속이다.

X-04 packageguard(2026-10-12 07:48): fflate개발고정/압축해제전전체metadata한도·경로/중복/macro 및XMLDTD/script거부·타이밍/외부관계개수추출.293tests/check와actualWhale teacher-01/합성media공통검사+기존회귀PASS(TEST_RESULTS07:48). CRC/암호화·시간격리/링크/MIME/signature/fullcontenttypes검증후속,제품지원승격없음.

X-04 canonicalaudio(2026-10-12 07:44): 합성XML/relationship기반audioFile1개변환/두후보동일variant hash검사. actualWhale profile1791758621500 aidenAUDIO/VIDEO재생·office정확audio/video추출/hash/별도host무음재생PASS. 기존불일치는생성태그경계,일반음원버그라고확대하지않음.278tests/checkPASS([근거](pptx/MEDIA_COMPARISON.md)).제품입력안전/효과·실제충실도/Player통합후속.

X-04 media(2026-10-12 07:41): 합성3쪽WAV/MP4, actualWhale profile1791758453763 aiden native2개무음진행/office포스터만→정확hash추출/별도host무음진행. 생성WAV videoFile vsaudiorelation/MIME불일치와두후보video분류경계관측.278tests/checkPASS. [미디어비교](pptx/MEDIA_COMPARISON.md).Player명령/소유/checkpoint연계·효과·실제코덱전반후속,제품지원승격없음.

X-04 teacher-01(2026-10-12 07:37): 사용자제공23쪽실제PPTX/PNG81·타이밍4쪽. 실제Whale profile1791758165878 aiden/office23/23호출·imgdecode/오류0·일부화면직접비교/원본hash불변. 제목크기/위치차이·전용폰트exactfamily없음위험확인. PowerPoint기준/타이밍재현은unverified.278tests/check PASS. [근거](pptx/TEACHER_01.md),실제1종/제품채택없음.

X-04 추가 후보(2026-10-12 07:33): office-kit preview0.15.0/core0.24.0(MIT)/fflate0.8.3을 SHA512고정·browser792516bytes 격리번들. actualWhale profile1791757983044 합성2쪽 SVG image decode/한글/표/이동/노트추출·스크린샷 PASS. 제목/표배경은 aiden과 다르고 원본기준없음. foreignObject Canvas taint로 pixel readback 제한.278tests/check PASS. [비교](pptx/INITIAL_COMPARISON.md), 제품채택/지원승격 없음.

C-PREFLIGHT-06 및 X-04 초기 비교(2026-10-12): PDF 실제 Canvas 렌더·계약v3/DPR cache·실패cleanup,278tests/check와 actualWhale profile1791750160201 8/8 렌더결과/전체회귀 PASS. PPTX 후보 aiden1.3.0은 별도MV3 profile1791750300862에서 합성2쪽 표시/이동, preview1.0.7은 background예외 및 라이선스 표기 충돌로 제외. [초기비교](pptx/INITIAL_COMPARISON.md). 실제10종/원본충실도·media/behavior는 미검증, 후보채택/제품지원 승격 없음(TEST_RESULTS05:26).

C-PREFLIGHT-05 (2026-10-12): source/hash재확인후 PDF summary만32개/5분LRU·환경version/UA/platform/범위key,clone/허용필드·강제검사 연결.276tests/check·actualWhale sample/doc분리·hit/force·coldsourceerror·상태보존/전체회귀PASS(TEST_RESULTS05:15). media는매번metadata/hash검사. 원본pixel/폰트·이미지충실도·실물benchmark/물리offline 후속.

C-PREFLIGHT-04 (2026-10-12): scope registration/sample/document·전체1..count/진행·취소·120초 한도 연결.271tests/check, actualWhale 부분2/8링크1→전체8/8링크2(중간4쪽포함)/draft·세션보존·380px/전체회귀PASS(TEST_RESULTS05:11). 읽기증거만, pixel/font/효과충실도·큰파일성능/환경cache 후속.

C-PREFLIGHT-03 (2026-10-12): 실제fixture link/문서script로 getJSActions Map를 Object.keys로 읽던 누락을 발견·size로수정했다.269tests/check·actualWhale 두경고/부분unknown·WAV/MP4 source/hash/metadata·cold재시작 원본missing/error 상태보존/전체회귀PASS(TEST_RESULTS05:07). 모든action/실물decode·완전offline·정밀/환경cache 후속.

C-PREFLIGHT-02 (2026-10-12): Import 기존fast검사결과→strict등록확인후teacher결과, 신규count확인/재연결이번parser미실행unknown·실패성공표시없음 연결.268tests/check·actualWhale 신규/동일·다른원본재연결/전체상태불변/380px·전체회귀PASS(TEST_RESULTS05:02). 전체충실도·정밀/환경캐시·최종offline 후속.

C-PREFLIGHT-01 (2026-10-12): 공통 네범주/4상태·teacher 수동선택검사/취소·PDF부분쪽 operator/annotation·JSpresence·새hash/페이지count·미디어metadata 경계 연결.265tests/check, actualWhale PDF2/8쪽 결과/취소·초안/Player보존·380px·전체회귀 PASS(TEST_RESULTS04:59). 원본시각충실도·미디어 decode/완전offline를 unknown으로 유지. 정밀/환경캐시·등록결과연계 후속.

B-TIMER-SOUND-01 (2026-10-12): optional sound/completed/claimed epoch·Remote 설정·소유Player strictclaim→로컬 AudioContext 두음/차단 재시도.259tests/check·actualWhale 대역첫resume거부→실제native AudioContext/oscillator2개·Remote닫힘/중복거부/정상재시작 PASS(TEST_RESULTS04:53). 자동시도 at-most-once/claim후crash유실가능, 실제소리성공 보장없음. 물리스피커/절전 후속.

B-TIMER-POSITION-01 (2026-10-12): exact0..1 position·Remote-only 명령/slider·strict 보존·Player anchor 배치.255tests/check 및 actualWhale 실행 중 이동/1366·380 네 모서리·재시작 보존 PASS(TEST_RESULTS04:47). 시간/epoch 불변, 새 권한·패키지 없음. 직접drag·소리/물리focus 후속.

B-TIMER-01 (2026-10-12): session/document timer·elapsed/deadline·Remote UI/Player-only FINISH·소유권 gate·strict 저장·백업 경과 정지 복원 연결.252tests/check 및 actualWhale headless Remote닫힘·수업진행·A8초/B3초 보존/완료·중복거부·380px/정상재시작 PASS, 기존전체회귀PASS(TEST_RESULTS04:43). worker 장기 타이머/매초 저장 없음. 소리·위치/물리focus·절전 후속, experimental 유지.

B-PLAYER-OWNER-01 (2026-10-12): native getContexts/sender.documentId/WebLocks + strict metadata로 생존 기반 실행 소유권과 Player 마운트/backend명령 gate 연결.242tests 및 actualWhale headless 중복Player 검정/미디어없음·실행명령거부·worker stopped→running/WAV계속·owner유지·소유창닫힘승계/전체회귀 PASS. 초기워커이벤트 관찰 timeout을 CDP 상태 전이로 분리하고 영상입력은 Editor UIrevision/대상반영 후 실행하도록 보강했다. 물리focus/OS·browsercrash·편집pause·타이머는 후속(TEST_RESULTS04:26).

B-MEDIA-CONTROLS-01 (2026-10-12): optional playback/positionEpoch·Remote 구간/음량/음소거/seek·Player 실제 currentTime 끝 판정·strict복구를 연결했다.236tests, actualWhale headless WAV3~5초/pausedseek·구간끝 자동넘김/cleanup ended보존/MP4 재생중 음량·회차유지/380px PASS(TEST_RESULTS04:12). 영상 구간/실물·소리·다른코덱/장시간focus·lease는 남는다.

B-LOCAL-VIDEO-01 (2026-10-12): 실제 Whale native Canvas/MediaRecorder가 H.264 MP4 fixture를 생성하고 metadata/프레임 픽셀을 확인했다. 제품 Editor 입력→Remote play/pause→Player 실제 움직이는 decoded pixels·A/B/A paused 위치 복원·Remote 닫힘 진행·자연 종료를 두 전용 headless profile에서 검증했다.1366/380px 직접 확인,check226tests PASS. 초기 metadata 준비 timeout 원인은 미확정이고 진단 수집을 추가했다. 실물/다른 코덱·스피커·5분focus·trim/volume/seek/lease는 남으며 experimental 유지(TEST_RESULTS04:03).

B-MEDIA-AUTOPLAY-01 (2026-10-12): media-end/later 모드를 Remote/Player/core에 연결했다. autoplayEpoch로 현재회차의 모든 등록 미디어 종료만 집계, gesture재개 연결/새반복/unknownnull·노미디어 다음페이지정지.226tests 및 actualWhale WAV nativeended→A2·5초결합조건대기·380px/기존회귀PASS(TEST_RESULTS03:51). 영상/실제소리·다중미디어/5분focus는미검증이며 experimental을유지한다.

B-LOCAL-MEDIA-01 (2026-10-12): native HTMLMediaElement+로컬 ref/hash/source vault/Editor 연결·Remote play/pause·Player epoch checkpoint 구현.218tests/check PASS. actualWhale headless12초 WAV·대역 autoplay거부→실제 gesture/native muted play·Remote닫힘에도시간증가/교차자료 마지막위치·paused 복귀/native ended/filename비노출/380px PASS(TEST_RESULTS03:40). 다른 코덱/영상·실제소리·5분focus·media-end 자동넘김·trim/volume/seek UI는 남으며 experimental이다.

B-AUTOPLAY-EXEC-01 (2026-10-12): Remote 시간 설정/상속·범위·재개/정지와 Player deadline/PDF ready/좁은 ADVANCE 연결. target·epoch·revision·경과 gate/strict DB·중복·실패 rollback·공개 비노출 포함207tests PASS. actualWhale headless1초 A1~A2 반복/Remote 닫힘 후 최소2회 진행·새Remote정지/다른수업차단/380px 직접확인 PASS. 실제미디어/편집pause/단일Player lease/5분물리focus는남음. TEST_RESULTS03:21/ADR029.

B-PLAYBACK-STATE-01 (2026-10-12): optional checkpoint/슬라이드>자료>세션 규칙·실시간 경과·반복 계산과 core 자료 전환/종료/수동 이동의 정지 정책을 구현했다. 192개 자동 테스트 및 actual Whale5.39.412.57 headless에서 합성 running metadata A-B-A/실제 worker·strict DB/Remote 닫힘/정상 재시작 상태 일치 PASS. 실제 Player 재생 실행/미디어/focus 시험은 아니며 지원 상태를 승격하지 않는다. TEST_RESULTS03:10/ADR028.

B-QUICK-EDITOR-01 (2026-10-12): OPEN_CURRENT_EDITOR currenttarget/revision/sender수업gate→Editor선택strictcommit→창재사용, Player raw편집금지. 182tests/actualWhaleheadless 우클릭/합성longpress·sameEditor/draft유지/발표·documents불변/다른수업차단PASS. 물리터치/듀얼모니터배치/focus인수는남음. TEST_RESULTS02:59/ADR027.

B-PDF-COPY-02 (2026-10-12): PDF 저장 UI/파일경계를 연결하고 actual Whale5.39.412.57 headless 확장+CSP에서 가리개 확정·draft저장잠금·nativeOPFS write/close/readback·nonempty파일거부/취소·상태불변/정상재시작 통과. OPFS내용으로 만든PC fixture를 별도Node PDF.js reader로 읽어 blackmask/검색text 확인했다. 최종177테스트 PASS. 실제OSchooser/downloads/native외부뷰어와실물교사PDF는 미실시, experimental로 유지. TEST_RESULTS02:51.

B-PDF-COPY-01 (2026-10-12): pdf-lib1.17.1은 source vector 유지/공개PNG합성 writer 후보이다. 전체170tests/Whale dev-origin 실제4회전/crop/한글·mask·pen/원본hash·검색text 유지 PASS. 암호우회없음·원본action정화아님·오버레이는raster. UI파일저장/extension CSP/native외부뷰어/실물자료는 미검증이며 export supported로 승격하지 않는다. TEST_RESULTS00:58/plan2026-10-12-pdf-copy 참조.

초기 창 코드/API mock 검사, 보조 브라우저 검사와 실제 웨일 실험을 구분한다. 실제 교사용 파일이 없으면 합성 샘플부터 만들고 미확인 범위를 기록한다.

## A-WHALE-01 / B-SAVE-JOURNAL-01 (2026-10-12)

B-ALL-CLOSE-01: 159개 자동 테스트 및 실제 Whale5.39.412.57 headless에서 전체 종료 취소/자료별 선택/부분 실패·재확인·새 저장 후 재시도/초안 보존/정상 재시작 PASS. 한 파일의 전체 확정 snapshot 확인은 saved 선택에만 적용하고 성공 대상을 한 CAS로 종료한다. 실제 chooser/downloads/영구 정리/PDF 복사본은 미실시이며 TEST_RESULTS 00:48을 따른다.

B-CURRENT-CLOSE-01: 실제 Whale5.39.412.57 headless에서 A5→현재 종료→검정 대기, saved backup 재검증/변조 거부·취소 유지, 다른 B 상태와 두 Editor의 미확정 노트 유지, 명시 재개 A5, without-backup 종료와 정상 재시작 closed 복구 PASS. 비삭제형 current close이며 전체 종료/영구 정리/OS chooser/downloads/미디어/보이는 창은 별도다. 자동150테스트/실제 환경/380px dialog는 TEST_RESULTS 00:31.

B-BACKUP-VERIFY-01: actual Whale worker own Blob fetch/완료 저널 hash·bytes/현재 전체 확정 상태/최종 revision 재조회 통과. native OPFS 출력 readback을 시험용 PC fixture로 만들어 file input에서 선택했고 내용 변조를 거부했다. UI 380px 및 기존 발표·권한·정상 재실행도 PASS. OS chooser/Whale downloads/종료 CAS 인수는 별도이며 TEST_RESULTS 00:16 기록을 따른다.

실제 Whale5.39.412.57/Chromium150/Windows의 전용 headless profile에서 MV3 로드/실제 getContexts 창 생성·재사용/실제 PDF A5·비공개 A8 노트·공개 snapshot 보호/Remote 닫힘 유지/정상 재실행 DB 복구 PASS. 런타임 API mock 없음; native PDF chooser만 합성 file input으로 대체했다. 보이는 모니터/OS 파일 선택창/미디어/focus/IME/비정상 종료는 미검증이다. 실제 user-data-dir와 remote-debugging-pipe를 명시하고 builtin worker를 manifest.name으로 제외한다. 재현/실패 이력/스크린샷은 TEST_RESULTS와 verify-whale-foundation.mjs.

저장 결과 metadata 저널 prepared/hash/bytes/captured revision→terminal을 strict DB로 구현했다. 경쟁/abort/quota/불변/256한도124개 전체 테스트 PASS, 실제 PC JSON 출력과 동일 해시/다른 페이지 재조회 Edge 보조 PASS. 파일/개인 경로/노트는 복제하지 않으며 저널은 종료 권한이 아니다. actual Whale downloads/OS chooser/종료 CAS는 후속이다.

## Stage A 저장 계층 실험 (2026-10-11)

A-DB-01: IndexedDB transaction strict/complete/CAS/rollback 구현과 fake-indexeddb 통합 테스트 통과. 실제 Windows Edge 155 웹 오리진에서 전용 프로필의 브라우저 프로세스를 종료/재실행하여 A5 발표/A8 편집 선택·비공개 노트·receipt를 복구했고 오프라인 조회도 통과했다. 재현은 DEVELOPMENT.md의 브라우저 저장 시험을 따른다. 이는 Whale 확장 인수, PDF 기능, PC 강제 종료, X-07 로컬 파일 export 시험을 대신하지 않는다.

## 원문 §19.4 실험 기준

A-PDF-01 (2026-10-11): PDF.js 6.4.299 원본 LICENSE/Node 요구사항/패키지 API 확인 후 실제 8페이지 합성 PDF 두 개를 준비. 실제 Import/별도 캔버스/A5/B2/A5/B8 비공개 노트/동일 파일 재등록/픽셀/5 viewport/기존 worker warm offline page/생성된 native handle IDB reload가 Edge 보조 환경에서 PASS. 빌드된 UI에 manifest CSP를 적용해 자체 worker/표준 폰트 경로도 확인. 엔진 432KB + worker 2.23MB, 패키지 약 6MB(source map 제외), CMap/폰트/WASM/ICC 포함. XFA/sandbox/QuickJS는 제외. 전체 RAM 실측/고급 PDF/실제 Whale는 미실시이며 X-03 지원 인수 전체 통과가 아니다.

A-MSG-01 (2026-10-11): sender 페이지 역할 제한, 공개 Player projection, commit 후 port 전달, 다른 수업 필터, Remote 닫힘 및 새 worker DB 복구 대역 테스트 통과. 자체 화면 조회 runtime.getContexts를 써서 tabs 권한을 추가하지 않았다. 실제 Whale API/확장 저장 확인 전 X-01은 미실시를 유지한다. Edge 합성 UI 20화면과 노트 draft/save 확인은 화면 배치 보조 검사에만 해당한다.

| 실험 | 반드시 시험할 내용 | 성공 판정 | 실패 시 대안 |
|---|---|---|---|
| X-01 | 네이버 웨일에서 MV3 확장 빌드 로드 및 멀티 창 생성 | Launcher/Player/Remote/Editor 각각 열림 | 브라우저 버전·API 차이를 기록하고 기본 창 열기 |
| X-02 | 듀얼 모니터의 별도 창 위치 제어 | Player를 표시 화면에 배치, Remote 교사용 화면에 배치 | 수동 드래그·모니터 선택 UI |
| X-03 | PDF.js에서 PDF 렌더링·여러 문서 전환 | A 5→B 2→A 5 및 오버레이 상태 유지 | 디코더 또는 렌더링 캐시 조정 |
| X-04 | PPTX 렌더러 후보 비교 | 텍스트·사진·표·미디어 샘플별 차이 기록 | 제한 지원 및 PDF로 변환하기 안내 |
| X-05 | 포커스 이동 중 자동 넘김·음원·영상 | 다른 앱을 클릭해도 발표 중인 지원 콘텐츠 정상 진행 | Player 전용 창·절대시각 타임라인 수정 |
| X-06 | 배경색 후보 추출과 글상자 배치 | 단색 배경/검정 글씨의 두 후보 선택이 정상 | 주변 영역 샘플링 로직 조정 |
| X-07 | File System Access + 브라우저 다운로드 | 실제 PC의 결과 파일 존재 확인 | 사용자 `saveAs` + `chrome.downloads` 경로 |
| X-08 | Canva 원본 URL 관리 | 합법적·권한 내 열린 발표 탭 식별 및 반환 | W0 링크만 관리 |
| X-09 | Miricanvas 원본 URL 관리 | 상동 | W0 링크만 관리 |
| X-10 | `.ppt` 및 `.show` 오프라인 처리 | 라이선스에 맞는 로컬 파서/변환 수단과 실제 파일 로드 확인 | 미지원 알림 + 사용자가 직접 PPTX/PDF로 변환 |

## 실행 상태

| 실험 | 상태 | 증거/후속 |
|---|---|---|
| X-01 | 실제 Whale headless 기반 통과 / 보이는 창 미실시 | 5.39.412.57 MV3/getContexts/windows/strict DB/재실행 PASS; 보이는 네 창/듀얼 모니터는 남음 |
| X-02 | 미실시 | 단일/듀얼·DPI·연결 해제; 수동 배치 대안 |
| X-03 | 미실시 | PDF.js 도입 후 합성 A/B, 각 8쪽 이상 |
| X-04 | 초기 합성 비교 진행, 미완료 | 후보3종 실행: aiden/office 표시, preview실패·라이선스충돌. 실제10종·원본/media/behavior 인수 필요 |
| X-05 | 미실시 | 보이는 Player + 외부 앱 5분, 최소화는 별도 |
| X-06 | 보조 환경 일부 통과 / Whale 미실시 | 원본 검정 샘플·Canvas 실제 Malgun Gothic 최대 fit/overflow·3비율·draft/확정; 실제 IME/Player 빠른 진입/길게 누르기 필요 |
| X-07 | 보조 환경 일부 통과 / Whale 미실시 | 실제 PC .wcp.json/read/import/hash·취소 유지·native OPFS write/readback/no-overwrite; actual Whale downloads/OS chooser/PDF export 필요 |
| X-08 | 부분 구현·실제 탭 미실시 | Canva W0 URL 저장·제목·명시적 새 탭·재연결은 구현/검증; 로그인·권한·관리형 탭 실험 필요 |
| X-09 | 부분 구현·실제 탭 미실시 | Miricanvas W0 URL 저장·제목·명시적 새 탭·재연결은 구현/검증; 로그인·권한·관리형 탭 실험 필요 |
| X-10 | 미실시 | PPT/SHOW 로컬 경로·라이선스·오프라인 |

## §13 기술 조사와의 연결

SPIKE-T-01=창/동기화(X-01), 02=모니터·포커스(X-02/05), 03=PDF(X-03), 04=PPTX(X-04), 05=웹(X-08/09), 06=저장·복구(X-07), 07=레거시(X-10).

창 분리·PDF 교차·포커스 독립 재생을 핵심 제품 Go/No-Go 기준으로 삼는다. PPTX/웹/레거시 실패는 지원 수준과 대안을 기록하고 PDF 기반 개발을 계속한다.

## 실험 기록 양식

~~~text
실험 ID / 날짜 / 담당:
OS / 웨일·Chromium 버전 / 디스플레이·DPI / 권한:
샘플 종류·생성 방법·개수·해시:
절차와 기대값:
실제 결과·로그·오류:
판정: pass / fail / 미실시
지원 가능한 기능과 제한:
후속/대안:
~~~

2026-10-15 최신 성능 감사: `whale-pptx-entry-limit/1792022880826` 실제 `--media64` sampled peak `1,735,835,648bytes`로 1.5GiB 실험 기준 FAIL. 원본 hash/외부0/pageerror0은 유지했으며 전체 origin 예산·지원 승격은 미확정이다. [근거](pptx/PERFORMANCE_BUDGET.md).

## 2026-10-15 09:22 — 실제 98MB PPTX source-sharing 재검증

- 호환 Node24로 `verify-whale-pptx-source-sharing.mjs`를 실제 네이버 웨일에서 재실행했다. 결과 `whale-pptx-source-sharing/1792023547335`, `pass=true`.
- 고요한 우연(1) 52쪽·98,050,517 bytes에서 같은 File의 동시 준비 1회 공유, consumer별 취소, retry, source lease 2개→최종 0개, native owner 1개→최종 해제, 원본 hash 불변, 현재 PDF/세션 보존, 외부 요청 0·pageErrors 0을 확인했다. 2개 테스트 realm 논리 asset 합은 185,538,790 bytes다.
- 이 결과는 source/lease 수명과 원본·수업 보존 증거다. `physicalMemoryBytes/modelHeapBytes=null`이며 전체 origin 물리 메모리나 여러 서로 다른 자료의 동시 메모리 인수로 확대하지 않는다.

## 2026-10-15 09:25 — 10종 시각 검증기 페이지 불일치 일반화

- 실제 10종 PPTX·기준 PDF의 1쪽을 웨일에서 순회했다. 9종은 `executionPassed=true`로 실행되었고, `이게 정말 나일까`는 PPTX 17쪽·기준 PDF 2쪽 불일치 assertion에서 중단됐다.
- `scripts/verify-whale-pptx-visual.mjs`에서 PPTX/PDF 전체 쪽 수 일치를 강제하지 않고 `referencePageCount`, `pptxPageCount`, `pageCountMismatch`를 기록하도록 수정했다. 기준 PDF에 없는 쪽은 `reference-page-unavailable`로 기록하며 비교 통과로 세지 않는다.
- 수정 후 `이게 정말 나일까` 1쪽 `whale-pptx-visual/1792023723700`가 `executionPassed=true`로 실행됐다. 페이지 불일치는 여전히 충실도 인수 미완료 증거로 남긴다.
- 전체 `scripts/dev.ps1 check` 09:22:17 exit 0: 103 test files / 1,424 tests, TypeScript/Vite/MV3 build, materials 10/10. `node --check`와 `git diff --check`도 통과했다.
- 10종 전체 3축 Visual·Media·Behavior, 원본 PowerPoint 기준 정합성, 물리/cold-offline/장시간은 아직 최종 인수 조건을 충족하지 않는다.

## 2026-10-15 09:24 — 시각 검증 결과의 비교 가능 쪽 수 명시

- `scripts/verify-whale-pptx-visual.mjs` 결과에 `comparisonRows`와 `unavailableRows`를 추가해 실행 성공과 기준 비교 가능성을 분리했다. 페이지 불일치·preview 미생성 자료도 결과 JSON에서 수치로 확인된다.
- 실제 웨일 `whale-pptx-visual/1792023778235`에서 `이게 정말 나일까` 1쪽 실행 `executionPassed=true`.
- `scripts/dev.ps1 check` 09:23:11 exit 0: 103 test files / 1,424 tests, TypeScript/Vite/MV3 build, materials 10/10. `node --check`와 `git diff --check` 통과.
- 비교 가능 쪽 수가 있다고 해서 전체 Visual/Media/Behavior 인수나 PPTX 지원 승격으로 해석하지 않는다.

## 2026-10-15 09:35 — 실제 52쪽 PPTX Player 검증기 일반화 및 통과

- `scripts/verify-whale-pptx-player.mjs`에서 teacher-01 전용 고정값을 제거했다. 효과 가시성 변화는 checkpoint 완료와 분리해 `effectVisibilityChanged`로 기록하고, 재연결용 98MB 변경 파일은 Playwright buffer 대신 cache 임시 경로로 전달한다. 효과 그룹 수와 슬라이드 수는 실제 자료에서 동적으로 기록한다.
- 실제 네이버 웨일 `whale-pptx-player/1792024181632` `고요한 우연(1)` 결과 exit 0: `slides=52`, `allOriginalClickGroups=15`, 직접 전환/중복·취소·worker 재시작·편집 독립·오버레이·백업·380px·원본 불변·pageErrors 0. `effectVisibilityChanged=false`는 DOM 시각 변화 미확인이라는 별도 진단이며 checkpoint 완료는 확인했다.
- 앞선 실패 `179202295...`의 12그룹/23쪽 assertion과 98MB Playwright 50MiB buffer 한도는 검증기 결함으로 분리하고 성공 결과에 섞지 않는다.
- 전체 `scripts/dev.ps1 check` 09:32:01 exit 0: 103 test files / 1,424 tests, TypeScript/Vite/MV3 build, materials 10/10. `node --check`, `git diff --check` 통과.
- 이 결과는 실제 한 자료의 Player·학생 화면 보호·원본 보존 증거이며, 10종 전체 충실도·물리 메모리·지원 등급 승격은 아니다.
