# 개발 흐름

`check`는 스킬 검사 전에 `check:materials`를 실행해 `test-materials/originals`와 `powerpoint-reference`의 같은 이름 짝을 확인한다. 이는 실제 자료 10종 인수를 판정하지 않고 누락된 기준 출력을 조기에 알리는 보조 검사다.

2026-10-14 `PptxResourceInventory`는 `sourceModel`의 실제 pending/ready/owner release 지점에 연결한다. `scripts/verify-whale-pptx-source-sharing.mjs`가 두 격리 popup realm의 논리 숫자를 읽지만 원본 내용·식별자는 로그에 넣지 않는다. 단일 WorkingSet과 origin 예약은 다음 개발 단계다. [재현·제한](pptx/RESOURCE_INVENTORY.md).

2026-10-14 entry-limit --media64는첫쪽모델과미디어쪽의PlayerURLcount/bytes가같음을assert한다. source-sharing은parentlease해제후native retain보존과마지막rawURL해제를검사한다. raw/URLlogical값과WorkingSet·미검증전체예산을분리한다. [재현/성능FAIL](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 prepared-scene은실제native준비gate를잡은상태의Remote전환취소를검사한다. queued validator제거·PPTX읽기0/Worker0·현재PDF/WAV진행을확인한다. source-sharing native2popup은identity/vault까지5경로취소를검사한다. broadcast unit reply는request객체의type이덮이지않도록reply type을마지막에쓴다. [결과](pptx/SOURCE_CANCELLATION.md).

2026-10-14 verify-whale-pptx-source-sharing은pptx-admission-probe에서 실제 Web Locks/native popup2창을열어queued/active취소·실패/닫힘·API부재와현재PDF/원본hash를검증한다. 실제File읽기의결과전달만지연시키고parser결과를만들지않는다. 제품교사verifier실패는gate수/효과일반status·preparation만failure.json에기록,본문/노트는제외한다. [재현/범위](pptx/PREPARATION_ADMISSION.md).

2026-10-14 entry-limit --media64는CDP확인프로세스ID의종류별WorkingSet/PrivateMemory·phase의Runtime.getHeapUsage·해제뒤1/5초숫자를기록한다. commandline/본문/heap snapshot·강제GC는사용하지않고shared renderer의Editor/Player값을합산하지않는다. 최종peak는주기/phase모든표본최대다. 내장효과공존은별도12초native합성fixture로2초자연종료경합을피한다. [재현·실패·제한](pptx/PRIVATE_BUFFERS.md).

2026-10-14 source-sharing probe는 raw 이미지·작은 미디어 해제량과 남은 raw/unique backing bytes도 기록한다. embedded-media의 raw변조 fixture는 해제 항목을 제품에 다시 보유시키지 않고 probe에서만 원본 fixture bytes를 재주입한다. 해제근거 누락/해시·크기 변조와 복구를 추가 확인했다. [최종 회귀와 성능 실패](pptx/DUPLICATE_PARTS.md).

2026-10-14 `scripts/verify-whale-pptx-source-sharing.mjs <Playwright> <Whale> <읽기전용teacherPPTX>`는격리MV3 probe의제품source모듈과nativeWorker로동시File준비/취소/재시도·asset수명을검증한다. 실제사용자PPTX본문/원본을외부로보내지않고현재제품PDF픽셀/세션·원본hash를대조한다. 렌더충실도/전역메모리시험의대체가아니다. [결과](pptx/INFLIGHT_SOURCE.md).

2026-10-14 entry-limit --media64는 media-memory-observer로 File/Blob읽기 크기/횟수·Worker mode·native/URL 숫자를 기록한다. 본문/이름/URL은 로그에 넣지 않는다. 성공identity재사용후의재연결오류시험은캐시로실행되지않는File read대신항상수행되는nativemetadata오류를주입하고실패File재읽기는unit에서검증한다. CPU/원본읽기감소와메모리표본·전역/물리인수는분리한다. [근거](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 PPTX 전환 시험은 정상 제품 Remote 버튼을 사용하는 presentation-ui helper로 이행했다. metadata/owner probe는 presentation-contract의 소비 보류/수동 REQUEST/COMMIT이며 실제 준비 인수로 세지 않는다. checkpoint 공개 ACK는 snapshot이므로 teacher 세션이 필요하면 다시 조회한다. 두 번의 요청/확정이 각각 receipt/revision을 증가시킨다. 대용량 entry-limit --media64는 단계/CDP와 전체 프로세스 메모리를 기록하며 현재1.5GiB 기준 FAIL이다. [결과](pptx/TRANSITION_ADMISSION.md).

2026-10-14 준비 표면은 `scripts/verify-whale-prepared-scene.mjs <Playwright> <Whale> <읽기전용교사PPTX>`로 정상 UI/worker 보류·응답 유실·누락 및 DOM/native 동일성·현재 재생을 검증한다. 기존 presentation-transition은 parser 보류/수동 확정의 계약 시험이다. Editor 선택은 값/입력 활성화 반영 후 파일을 넣는다. [최종 범위](pptx/PREPARED_SCENE.md).

2026-10-14 전환저장계약은 `scripts/verify-whale-presentation-transition.mjs <Playwright> <Whale> <읽기전용교사PPTX>`로실제제품RPC/strict DB·owner/worker재시작·현재PDF/무음WAV진행과목표공개투영을검증한다. 오디오관찰은생성자대역이아닌실제DOM audio의paused/currentTime을쓴다. 첫대역관찰timeout은실패로보존했다. 이스크립트는준비consumer미연결을report에명시하며계약PASS를실제준비표면인수로승격하지않는다. [계획](plans/2026-10-14-player-transition-commit.md).

2026-10-14 Remote전환검사는Player와동일openPptxRuntime을분리DOM에서재사용하고쓰기/재생을금지한다. transform-only검사로source-v1 완료checkpoint를판정하지않는다. UI검증은버튼비활성해제만으로성공이라하지않고목표selection/실제revision수락을기다린다. 검증프로필이dist를직접참조하면실행중build로파일을교체하지않도록순서를정한다. [계획](plans/2026-10-14-pptx-transition-safety.md).

2026-10-14 PPTX parser probe를별도Vite configFile:false로빌드할때도 `pptxBackgroundPatch()`를client/worker plugins에적용한다. 고정source SHA나정확한교체지점이달라지면자동통과시키지말고새버전을검토한다. Node24검증스크립트는로컬TS plugin을import한다. `verify-whale-pptx-background.mjs <Playwright> <Whale> <PptxGenJS>`는제품dist Worker의ready→input프로토콜로합성10종을검증하고RGB숫자를비교한다. [계획](plans/2026-10-14-pptx-background-reference.md).

2026-10-14 `scripts/diagnose-pptx-reference.py <PPTX> <PDF> <기존전체비교폴더>`는로컬원본XML/PDF/제품렌더hash·범주차이/색상분포를본문출력없이대조한다. `verify-whale-pptx-visual.mjs <Playwright> <Whale> <PPTX> <PDF> '1,17,30,33,41,43'`는선택쪽만CDP실제글꼴과별도테스트DOM글꼴대조군을추가한다. 마지막인자생략시기존전체쪽제품baseline검증이며선택쪽실행을전체인수로세지않는다. raw720×540assert/원본hash불변/외부0/독립선택은유지한다.

2026-10-14 Windows Python 진단의 한글 stdout은 UTF-8을 명시하거나 JSON의 ensure_ascii=True를 사용한다. 원본 문자 손상 판정 전 UTF-8 저장 결과/ASCII escape로 재확인한다. SVG본문 비교에서는 비표시 title/desc/style metadata를 제외하고 캡처 stage의 실제 크기를 함께 기록한다.

2026-10-14 same-File ready모델공유로중복PPTX읽기가생략된다. 미디어연결취소의실제비동기검증은`PPTX-media-*`File의hash읽기를대기시켜취소/세션보존을확인한다. 메모리시험은제품경로`--media64`와추가파싱이있는`--diagnostics`를구분하고직접benchmark비교하지않는다. [근거](pptx/TEACHER_02.md).

2026-10-13 PPTX 미지원 효과 검증은 [DEGRADATION_PREFLIGHT](pptx/DEGRADATION_PREFLIGHT.md)의 전용 스크립트를 사용한다. 다중 탭 Whale headless에서 resize 후 screenshot이 두 번 timeout되어, 촬영할 탭을 bringToFront하고 두 animation frame을 기다린 뒤 재촬영해 통과했다. 기능 assertion과 촬영 실패를 구분하며 이 대응이 브라우저 내부 원인을 확정한 것은 아니다.

2026-10-13 runtime재준비: 기존model/Blob/slots 재사용·입력/회차·run/request/renderer gate, 준비불가 sourcecursor 실행없는복원/교정회복. 신규12개/1,201tests·빌드·실제Whale내장1791885072296/교사제품1791885072190, PDF foundation1791884344131 회귀PASS. 다음은 혼합 도형/미디어 시간조건·동시/복합조건과전체충실도인수다. [범위](pptx/MEDIA_TIMELINE_REFRESH.md).

2026-10-13 sourceTimeline: 원본/등록출처·전체branch·전역조건/명시지연/설정을 검사한 미디어-only 그룹을 실제 registry endpoint/source-v1에 연결했다. 1,189tests/빌드·실제Whale750ms/취소/실패재시도/5native그룹/새Playeraction0 및 기존교사제품/내장/foundation/owner 회귀 PASS. 설치Playwright async predicate의 Promise truthy 문제는 Node await/poll로 보완해 다시 확인했다. 혼합/concurrent/seek/trim+playFrom·동적재준비/전체인수 미완료. [범위](pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 내장미디어 경계 검증: `verify-whale-pptx-embedded-media.mjs <Playwright-index.mjs> <Whale.exe> <teacher-01.pptx>`. 사전에 기존 synthetic PPTX/WAV/MP4 ignored fixtures가 필요하다. dist 복사본+격리probe에서 제품 guarded Worker/추출함수·실제Editor sender 저장 계약을 검사한다. UI 연결이나 Player 재생 완료 시험이 아니다. [근거](pptx/EMBEDDED_MEDIA.md).

2026-10-13 일반PPTX실험UI: Editor의PPTX실험사용→자료추가→비공개자료선택/페이지·노트→Remote명시자료발표/효과→편집정보저장/Launcher복구→Editor같은원본재연결. `verify-whale-pptx-player.mjs`는 이제 seed/helper를 주입하지 않고 이 제품UI를 사용한다.814tests·빌드/actualWhale1791826400096 및foundation1791826254333 PASS. overlay·내장media·충실도/전체인수는후속.[범위](pptx/PRODUCT_IMPORT.md).

2026-10-13: Remote REQUEST_PPTX_GROUP/CANCEL_PPTX_GROUP, 소유 Player BEGIN_REQUESTED_PPTX_GROUP(requestId) 추가. 직접 BEGIN 대기요청 우회 금지/취소 완료pose 보존.780tests·빌드/actualWhale API·제품12클릭/foundation 회귀 PASS. 다음 Remote UI→durablePlayback 소비와 새 Player 수동 재개/소진·오류·취소 처리. [상세](pptx/REMOTE_REQUEST.md).

2026-10-12 23:45: Player는snapshot.pptx면PptxView/runtime지연경로를사용한다. 공개최소slideIds/지문과Player로컬File로등록대응/복원, 높은revision유지/소유권 gate. 일반PPTXimport는아직비활성. 실제제품Player검증은 verify-whale-pptx-player.mjs <Playwright-index.mjs> <Whale.exe> <teacher-01.pptx>, 등록helper만추가한다.754tests·빌드/teacher12클릭·복귀/새Player복원 PASS. [제한](pptx/PRODUCT_PLAYER_RUNTIME.md).

2026-10-12 23:29: Editor PPTX 비공개 미리보기는별도입력/privatePreview lazy chunk. 모델Worker presentation mode는원본guard 뒤만사용하고assetModel 소유URL/모델dispose/안전SVG를필수로한다. notes없음/media badge·세션등록없음. verify-whale-pptx-inspection이23쪽/이미지decode/Canvas보존/URL해제/취소를검사한다.747tests·빌드 PASS. [명령/제한](pptx/PRIVATE_PREVIEW.md).

2026-10-12 23:16: Editor의 후보 모델 검사(opt-in)는 guarded 구조 검사 후 로컬0.4.5 Worker에서 숫자만 받는다. 해당공식Worker 초기화 보존/ready handshake 필수, 라이선스 동봉/빌드 assert. check729tests·빌드 및 실제제품Whale teacher23/174/12·lazy/Canvas보존/취소/5viewport PASS. [구현/재현](pptx/PRODUCT_MODEL_WORKER.md).

2026-10-12 22:58: Editor PPTX원본점검은inspectPptxFile을lazy load하며SourceVault/등록/DB를호출하지않는다. 제품dist 그대로 verify-whale-pptx-inspection.mjs로실제teacherFile/발표PDF픽셀해시불변·오류/취소·5viewport를검사한다. Whale headless 캡처/포인터시험은대상page.bringToFront 후실행한다. check709tests·빌드/fflateLICENSE·ZIP Worker 자산 PASS. [명령/제한](pptx/EDITOR_INSPECTION.md).

2026-10-12 22:45: PPTX modelInspection은숫자만요약, pptxModelPreflight는원본XML타이밍/전환/외부참조와모델고지를분리한다. 모델없음을기능부재/pass로바꾸지않고기존checkPreflight의PPTX unknown분기는유지했다. 신규15개/check702tests·빌드/실제Whale1791812610053 teacher/합성·기존회귀 PASS. [상세](pptx/MODEL_PREFLIGHT.md).

2026-10-12 22:39: modelBinding.get(slideId)가등록UUID/원본part/검증된Worker모델을연결한다. owner시험renderer는실제UUID/선택index(skipHidden:false)/원본XML을사용하며원본순서변경의제목/표/효과모델도대조한다. shared fixture parser는timeout/listener정리/terminate/abandoneddispose. check687tests·빌드/Whale1791812334482 회귀 PASS. [상세](pptx/MODEL_BINDING.md).

2026-10-12 22:30: preparePptxImport는 isolated ZIP/XML와원본슬라이드순서를검사한뒤UUID/metadata·fast검사를준비한다. 실제owner시험은합성자료등록ACK·9조건거부·teacher-01 23쪽준비와기존회귀를검사한다. 확장URL로교사파일전달2회실패후로컬File input으로전환했다. chooser/충실도검증아님. check670tests·빌드 PASS. [명령/제한](pptx/REGISTRATION.md).

2026-10-12 22:22: PPTX 입력은 adapters/pptx/input.ts, 원본은 별도pptxSourceVault. owner verifier의 renderer는 seed를직접읽지않고Editor 메모리 File을 채널로 받아 재해시/검사한다. 신규9개/check660tests·빌드와실제Whale 새Player/변경원본거부 PASS. 일반 등록/preflight/UI는후속. [상세](pptx/SOURCE_BOUNDARY.md).

2026-10-12 22:16: engineDriver로 공식 상태/원본 transform 전달을 재사용한다. owner verifier가 실제 제품 Player URL에 격리 렌더러를 마운트하여 Worker 모델/5효과→runtime owner/strict DB ACK→A/B/A·새 Player 재파싱 복원을 검사한다. 후보 bundle의 assets/ZIP Worker도 함께 복사해야 한다. check651tests·실제 Whale 통합 PASS. 제품 UI는 아직 미활성. [명령/제한](pptx/RUNTIME_RENDERER.md).

2026-10-12 22:06: createPptxPlayerTransport가공개snapshot/runtime ACK와bridge를연결한다. `verify-whale-pptx-owner.mjs`는dist를ignored격리복제하고production시험bundle만추가하여실제제품background/sender·owner와새명령을검사한다. Vite lib 시험엔production환경상수를명시한다. check640tests/빌드·native owner/worker재시작/승계 PASS. [명령/제한](pptx/PLAYER_TRANSPORT.md).

2026-10-12 21:58: durablePlayback에기존엔진driver/공개snapshottransport를연결, BEGIN·완료pose·strictACK와실패확정상태복원/busy/전환취소·최신선택보호를구현했다. --effects는제품Hub/DB와실제합성5효과·동일Whale정상재시작후새Worker파싱복원을추가검사한다. check626tests/빌드·teacher/media회귀 PASS. 제품background/UI 연결은미완료. [상세](pptx/PLAYBACK_BRIDGE.md).

2026-10-12 21:46: core animationPose/pptxPlayback과BEGIN/CHECKPOINT/RESET 명령·공개snapshot/strict 저장경계를연결했다. 새 `verify-whale-pptx-checkpoint.mjs`는ignored전용bundle/profile에서제품Hub/DB합성metadata 정상재실행을검사한다. 기존웨일명시launch인수를재사용하며기본Playwright인수는해당binary와충돌했다. check604tests/빌드·effects/foundation회귀 PASS. [명령과제한](pptx/DURABLE_CHECKPOINT.md).

2026-10-12 21:34: transform source에 한해 새 WAAPI easing을 linear로 교체, 명시적0 accel/decel 허용·나머지곡선 거부 유지. --effects에 독립시간 progress/분수종료 및9조건거부 검증 추가. check583tests/빌드·실제 Whale effects/teacher/media PASS. [상세](pptx/LINEAR_TIMING.md).

2026-10-12 21:29: repeatTiming.ts와 원본 transform 조건을 연결했다. --effects는 합성 반복6조건을 Worker로 파싱하고 native timing/afterPrev·pose/취소를 검사한다. check581tests/빌드·teacher/media 실제 Whale 회귀 PASS. 기존 실행 명령 그대로 사용한다. 시간곡선·제품통합은 후속. [상세](pptx/REPEAT_TIMING.md).

2026-10-12 09:27: `--effects` 합성시험을5효과로확장하고scaleBehavior와공통transformBehavior 경계를연결했다. preset6의잘못된opacity프레임을원본X/Y배율로교체, 실제Whale1.5·0.5/중심/완료pose복귀·5변형중간행렬·8종거부·회전회귀 PASS. Office ScaleX/ScaleY·to-only0시작/by무시규칙 반영. check546tests/빌드 및교사/미디어회귀 PASS. 제품Player/DB·실물/반복은후속. [상세](pptx/SCALE_SOURCE.md).

2026-10-12 09:15: `--effects` 시험에 rotationBehavior 원본 by/from/to 전달과 미검증 조건 거부를 연결했다. 기존 엔진의 native KeyframeEffect.setKeyframes만 교체하여 타임라인 수명을 유지한다. 합성90도/완료pose복귀·중간행렬/720도·baseline·조건10종 거부/teacher23쪽·미디어회귀 PASS, 단위48개 추가/전체502tests와 빌드 PASS. 제품Player/DB·전체원본충실도는 후속. [상세](pptx/ROTATION_SOURCE.md).

2026-10-12 08:59: animationSnapshot scope/계산style 경계·원자적 DOM 적용 단위34개, check08:58:22 454tests/빌드 PASS. --effects와 bundled PptxGenJS 경로로 합성 OOXML4효과를 시험한다. actualWhale effects1791763169461 fade입장/퇴장·motion240px/pose복원 PASS, animRot90도는spin360으로 의미손실(미해결). teacher1791763044807/media1791763040942 회귀 유지. 제품DB/고급효과 지원 승격없음. [상세](pptx/EFFECT_POSE.md).
```powershell
& 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/verify-whale-webppt-spike.mjs 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe' --effects 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs'
```

2026-10-12 08:49: workerEnvelope 한도/구조 회귀23개 추가, check08:47:15 420tests/빌드 PASS. web-ppt 기존명령이 공식 Worker/parseInWorker로 모델을 읽고 main/전체자산hash 대조·실제효과/미디어 회귀와 stall timeout/abort/손상입력 terminate·잔여리스너정리를 시험한다. teacher1791762488028/media1791762482260 PASS. Worker133464bytes, 본 화면 XML/렌더·제품 연결/대용량·고급효과는후속. [근거](pptx/WEBPPT_WORKER.md).
- Worker를 부수효과 import할 때는 실제 초기화 코드가 bundle에 남았는지 확인한다. 고정 web-ppt0.4.5는 sideEffects에 Worker가 없으므로 이 격리 Worker만 tree-shaking을 끄고 초기화2개를 assert한다. resolveId 보존 시도만으로 성공이라 하지 않는다.

2026-10-12 08:40: mediaReference 소유Blob/종류/MIME 경계 단위22개 추가, check08:38:26 397tests/빌드 PASS. web-ppt 명령 --media가 기존 합성3쪽의 canonical 음원 변형·정확미디어hash·native muted 재생/영상pixel·문맥전환pause/복귀대기를 검증한다. media profile1791761961260 PASS, teacher profile1791761912414 기존23쪽/12클릭·수명회귀 유지. 합성캐시가 필요하며 사용자 원본은 변환하지 않는다. 제품 Player·DB와 정확위치·트리거/고급효과는 후속. [근거](pptx/MEDIA_COMPARISON.md).

2026-10-12 08:35: animationRun 경계와 단위10개 추가, check08:32:15 375tests/빌드 PASS. 기존 web-ppt 시험에서 실제 Whale profile1791761635954 독립 A/B 파싱 문맥 전환/진행 중 취소/busy/완료커서 복원/재시작·기존 회귀 PASS. 엔진 cancel은 finish이므로 소유 WAAPI를 실제cancel한다. 제품 Session/Player와 영속 체크포인트 연계는 후속이며 PPTX unverified 유지.
- native 시험 helper는 브라우저 예약 window.status를 덮지 않는다. page.evaluate는 모듈 lexical 변수에 접근할 수 없으므로 관찰 가능한 DOM 또는 명시적 시험 API를 통해 읽는다.

2026-10-12 08:28: web-ppt0.4.5 로컬 후보와 안전 SVG DOM 경계 실험. 실제 Whale profile1791761228209 teacher-01 23쪽/12클릭·이미지 decode·원본불변·외부0/공격6거부 PASS. 부모 visibility만 세던 잘못된 화면 증거를 발견해 자식 상속과 하위 노드 검사로 보완했다. check08:27:21 365tests/빌드 PASS. 제품 채택/원본 충실도 인수는 후속. [상세](pptx/WEBPPT_ANIMATION.md).

web-ppt 재현: 기존 ignored 후보 cache를 준비한 뒤 아래 명령을 사용한다. 이 파일 하나의 비교이며 일반 PPTX 지원 시험이 아니다.
```powershell
& 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/verify-whale-webppt-spike.mjs 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe' 'C:/Users/서정완/Downloads/[국어]달에서 살아남기_토의 수업_PPT.pptx'
```

2026-10-12 08:15: 후보 Worker SVG 출력의 크기/hash와 본 화면 전페이지 대조 연결. 교사 profile1791760440213 23쪽/선택4쪽 decode, media1791760476184 3쪽/3개 decode PASS. 345tests/check와 기존 회귀 유지. 같은 엔진의 정적 출력 검증이며 원본 PowerPoint 충실도/효과 재생/제품 Player는 후속이다.

2026-10-12 08:11: 후보 파서 Worker와 원본 XML/모델 효과 요약 비교 연결. office23쪽/합성3쪽 Worker PASS, aiden model DOMParser 부족 실패. 교사3/9/12/19쪽12개 appear/click을 추출했지만 재생은 미검증. 345tests/check PASS, teacher profile1791760229591/media1791760250343. 다음 Worker 모델/렌더 전달과 실제 효과 재생 경로 검증. [상세](pptx/WORKER_TIMING.md).
- PowerShell에서 rg 파일 선택은 디렉터리와 -g '*.d.ts'처럼 glob 옵션을 분리한다. 와일드카드를 LiteralPath 인수에 넣으면 Windows 경로 오류가 날 수 있다.

2026-10-12 08:04: isolatedPackage/packageWorker로 ZIP 검사/해제를 로컬 Worker에 옮겼다. 15초/취소·오류 cleanup, 원본 사본/결과 transfer. 37파일345tests/check PASS, 실제 Whale teacher-01 profile1791759821144/미디어1791759850360 및 강제 CPU 지연 종료·메인 타이머 진행 PASS. 다음 XML 및 후보 parser 시간 격리 가능성, 효과 구조 분석. 제품 UI/권한/새 패키지 변경 없음.

2026-10-12 08:00: contentTypes.ts와 XML 경계를 연결했다. Default/Override 선언과 실제 타입, 일부 미디어 초기 헤더를 교차 검사하고 다른 형식은 미검증으로 남긴다. 합성 파일의 잔여 override로 첫 실패 후 안전 검사 유지/경고 분류로 조정했다. 36파일335tests/check PASS, 실제 Whale teacher-01 profile1791759605373/미디어 profile1791759584304 회귀 PASS. 다음 CPU 시간 Worker 격리와 효과 구조 분석, 원본 충실도 비교. 제품 UI/권한 변경 없음.

2026-10-12 07:55: relationshipTargets/packageGuard에 내부 연결 해석·존재 검사와 관계 XML 구조 검사를 연결했다. 외부 연결은 실행 없이 위험 개수만 기록한다. check 35파일317tests/빌드 PASS, 실제 Whale teacher-01 profile1791759288485 관계192·23쪽 및 canonical media profile1791759303704 관계35·무음 재생 회귀 PASS. 다음 ContentTypes/미디어 signature 교차 검사, XML CPU Worker 격리, 효과 구조와 원본 충실도 비교. 제품 UI·권한 변경 없음.

2026-10-12 07:48: packageGuard ZIP2pass/한도·경로/active파일·XML비실행검사·timing/external개수연결. fflate0.8.3 개발의존성추가(제품dist미연결).293tests/check,actualWhale teacher-01 profile1791758855077/합성canonicalmedia1791758864729·XML공격회귀PASS. 다음relationship대상/ContentTypes·media signature교차검증·worker격리 및 효과구조.

2026-10-12 07:44: --media-canonical 합성audioFile/relationship대조,동일variant hash·원본mediahash·정확분류/native·host무음재생actualWhalePASS.278tests/checkPASS. 생성불일치와일반음원지원구분을문서화. 다음ZIP/XML·링크/signature안전경계및타이밍/효과정보실험,제품통합/후보선정아직.

2026-10-12 07:41: --media합성PPTX3쪽으로두후보native재생/모델종류/추출hash·host재생분리확인. actualWhale profile1791758453763/278testscheckPASS. [미디어비교](pptx/MEDIA_COMPARISON.md).다음canonical음원·타이밍/효과구조/네이티브원본기준 및 안전한패키지입력경계실험. 아직후보선정/제품연결안함.

2026-10-12 07:37: 사용자실제PPTX teacher-01 23쪽 전체비교·원본메모리경계/hash불변·23현재이미지decode·1/3/15/23쪽직접확인. 두후보텍스트위치차이·타이밍4쪽/폰트누락위험,원본충실도미판정.278tests/checkPASS. [실제사례](pptx/TEACHER_01.md). 다음 기준PDF/PNG 비교와합성media·효과/실제추가9종이상.

2026-10-12 07:33: office-kit 세번째후보/peer0.24.0·ZIP0.8.3 격리번들, actualWhale2쪽표시/노트추출 및 렌더러간정렬/표배경차이·Canvas taint제한 확인.278tests/check PASS, [초기비교](pptx/INITIAL_COMPARISON.md)에준비/명령. 다음 실제자료가없으면 합성media/효과구조 확대, PowerPoint기준출력/실제10종 확보 요청(비동기질문전달). 제품지원활성화없음.

2026-10-12 05:26: PDF 실제렌더 증거/278tests·빌드·actualWhale foundation 전체회귀 PASS. PPTX 두 고정배포본 격리비교: aiden1.3.0 합성표시/이동, preview1.0.7 실패/라이선스충돌 확인. 실행준비/명령/환경/결과는 [초기비교](pptx/INITIAL_COMPARISON.md). 다음 재배포조건 명확한 다른 후보와 실제10종/PowerPoint 충실도 비교. 제품에는 아직 PPTX를 연결하지 않는다.

2026-10-12 05:15: PDFsummary32개/5분LRU·환경/범위key·source새hash전lookup금지/media항상검사·강제검사.276tests/check·foundation actualWhale profile1791749673520 hit/force·sample/document분리·상태보존/380px·전체회귀PASS(TEST_RESULTS05:15). 다음원본시각/font/이미지·실물충실도 근거/PPTX후보비교.

2026-10-12 05:11: 부분/전체 점검 mode·report.scope·진행/취소·전체120초 한도.271tests/check 및foundation actualWhale profile1791749413621 일부2/8링크1→전체8/8링크2/상태보존·380px·전체회귀PASS(TEST_RESULTS05:11). 다음검사범위/환경fingerprintcache, 원본pixel/font/이미지·실물충실도 후속.

2026-10-12 05:07: 실제PDF link/script fixture로 Map action 누락 수정, browser 경계 회귀 추가.269tests/check·foundation actualWhale profile1791749138124 두warning/WAV·MP4 metadata·cold원본missing/error·상태보존/전체회귀PASS(TEST_RESULTS05:07). fixture는 외부URI를읽을뿐fetch/실행경로없음. 다음정밀/환경cache·실물충실도.

2026-10-12 05:02: Import fast 결과를strict등록ACK후teacher에연결, 신규countpass/재연결이번parserunknown·실패성공결과없음.268tests/check·foundation actualWhale profile1791748894713 신규/재연결/다른원본거부·세션보존/380px·전체회귀PASS(TEST_RESULTS05:02/ADR038). preview스크린샷은재로드중일수있어결과문구증거만. 다음정밀·미디어Preflight실기기·환경cache/최종offline.

2026-10-12 04:59: Preflight 네범주/상태·PDF부분3쪽/원본재확인·media metadata·Editor수동검사/취소 연결.265tests/check PASS, foundation actualWhale profile1791748661010 결과·미확인고지/취소·초안/Player보존/380px·전체회귀 PASS(TEST_RESULTS04:59/ADR037). 다음 등록결과 연계/실물고급fixtures/정밀·cache·offline 근거. Stage C 전체미완료.

2026-10-12 04:53: 타이머 소리 strict 완료/claim·소유Player WebAudio·거부수동재시도/백업과거알림억제 연결.259tests/check PASS, 기존 verify-whale-timers에서 actualWhale profile1791748347635 대역첫거부→native running두음·중복거부/전체타이머재시작PASS. Remote UIrevision 대기 관찰 보강(TEST_RESULTS04:53/ADR036). 물리스피커/절전·5분focus 별도.

2026-10-12 04:47: TimerState.position/Remote SET_TIMER_POSITION·slider/Player anchor 배치·실행시간보존.255tests/check 및 기존 verify-whale-timers 명령으로1366·380 각네모서리/실행중위치변경·정상재시작 PASS(TEST_RESULTS04:47/ADR035). profile1791747972366. 다음 소리/Player 직접drag·물리focus.

2026-10-12 04:43: 수업·자료 countdown/stopwatch·Remote UI·Player 소유권/epoch/deadline 완료·strict 저장/백업 경과 연결.28파일252tests/check PASS, actualWhale timer profile1791747617706/기존 foundation profile1791747642744 PASS. 소리·위치/물리focus 후속(TEST_RESULTS04:43/ADR034). 집중 시험은 아래 명령이며 fixture/profile/screenshot은 ignored node_modules/.cache/whale-timers에 생성한다.

```powershell
& 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/verify-whale-timers.mjs 'C:/Users/서정완/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs' 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
```

2026-10-12 04:26: PlayerAuthority/strict owner DB/native WebLocks·생존 documentId/마운트·실행 명령 gate 연결.26파일242tests·빌드 PASS, actualWhale 중복 검정·명령거부/worker stopped→running 동안 WAV진행·owner유지·창닫힘승계/전체회귀 PASS. foundation은 CDP 제품 worker만 중단하며 개인 프로필/OS프로세스에는 손대지 않는다. worker-restart.json 상태 전이 기록, Editor 파일입력은 UI 새revision/대상선택 반영 후만 실행한다. TEST_RESULTS04:26/ADR033. 물리5분focus·browsercrash·편집pause·타이머는 후속이다.

2026-10-12 04:12: Remote 미디어 구간·음량·음소거·seek UI 및 core strict 검증/epoch·positionEpoch와 Player native 실제 구간끝 실행 연결.25파일236tests·빌드 PASS, actualWhale headless WAV3~5초·pausedseek/구간끝 자동넘김·ended보존/MP4 재생중 음량회차유지/380px·기존전체회귀 PASS. TEST_RESULTS04:12/ADR032. 아래 기록은 이전 단계이며 해당 UI 미연결 문구는 최신 범위로 대체한다.

2026-10-12 04:03: native H.264 MP4 합성 fixture와 실제 제품 영상 경로/프레임 변화·Remote 정지/교차 위치·닫힘 진행·자연 종료/1366·380px를 검증했다. 두 actualWhale headless profile PASS,check226tests·빌드 PASS. 초기 metadata 준비 timeout의 원인은 미확정이고 진단을 추가했다. 영상 한 종류의 experimental 증거이며 실물/다른코덱·실제소리·장시간focus·trim/volume/seek는 남는다. TEST_RESULTS04:03.

## 영상 회귀 재현

아래 순서로 실행한다. 첫 명령은 전용 profile에서 합성 fixture를 생성하며 두 번째 전체 회귀의 필수 입력이다. 실제 사용자 파일·개인 프로필은 사용하지 않는다.

```powershell
& "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" scripts/verify-whale-video-spike.mjs "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
& "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" scripts/verify-whale-foundation.mjs "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
```

2026-10-12 03:51: Remote media-end/later 설정과 Player 현재회차 전체 종료/deadline 조건을 연결.23파일226tests·타입/Vite/MV3 PASS. actualWhale WAV nativeended→A2/결합모드5초대기·노미디어페이지정지/380px·기존전체회귀PASS. TEST_RESULTS03:51/ADR031. 아래03:40 등은 이전 단계이며 미디어 기반 모드 미연결 표현은 이 최신 기록으로 대체한다.

2026-10-12 03:40 로컬 미디어: LocalMediaControls/mediaVault/native metadata와 LocalMediaPlayer/Remote play·pause/epoch checkpoint 연결.22파일218tests·타입/Vite/MV3 PASS. actualWhale headless WAV(무음)·대역거부→실제gesture·Remote닫힘/교차위치·paused복귀/nativeended/380px 및 기존 전체회귀 PASS. 영상·MP3·실제소리·미디어끝 자동넘김/trim·volume·seek·5분focus는 별도다. 아래03:21/03:10은 이전 단계 기록이며 최신 TEST_RESULTS03:40/ADR030을 따른다.

2026-10-12 03:21 시간 자동 넘김: Remote 설정/재개·정지와 Player deadline/PDF ready/좁은 ADVANCE 경로 연결. 최종21파일207tests·TypeScript/Vite/MV3 PASS. actualWhale headless1초 범위 반복/Remote 닫힘 후 진행·재접속 정지/다른수업 차단·380px 확인 PASS. 아래03:10 기록은 이전 상태 기반 단계이며 실제 MediaElement·편집pause·단일Player lease·5분focus는 아직 남는다. TEST_RESULTS03:21/ADR029.

2026-10-12 재생 기반 검증: `scripts/dev.ps1 check` 19파일/192tests·TypeScript/Vite/MV3 PASS. `verify-whale-foundation.mjs`는 기존 회귀 후 전용 profile DB에 합성 running metadata를 넣어 actual worker A-B-A/정지 경과·미디어 위치·자료 타이머/Remote 닫힘/정상 재시작을 확인한다. 실제 Player/MediaElement 실행을 대역으로 통과시킨 시험이 아니며 해당 실행 기능은 아직 미연결이다. TEST_RESULTS03:10 및 plan2026-10-12-playback을 따른다.

## PDF 수정본 엔진 실험 재현

개발 서버5173을 실행한 뒤 아래 명령으로 합성 crop/4회전 PDF 생성과 실제 Whale Canvas/PDF.js 재렌더를 검사한다. 새 의존성의 Vite 최적화가 끝난 뒤 실행하며 개인 프로필을 사용하지 않는다. 제품 저장 UI/확장 CSP/외부뷰어 인수는 별도다.

```powershell
& "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" scripts/verify-pdf-copy-spike.mjs "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe'
```

최상위 제품 기준은 [PRD v5](../naver-ppt_PRD_v5.md)(2026-10-11)이다. 교사 대상 네이버 웨일 공모전 참가를 목표로 v5 Stage A→B→C→D→E→F→G 순서로 개발한다. v4의 FR/AT/IMPL ID는 추적에 재사용하되 v5와 충돌하면 v5가 우선한다.

## 작업 단위

1. 현재 구현 상태와 관련 FR을 확인한다. 이번 변경의 관찰 가능한 동작과 실패 경로를 적는다.
2. 영향을 받는 타입·UI·브라우저 API·저장 경계를 정한다. 필요한 프로젝트 스킬만 읽는다.
3. UI 버튼만 만들지 않고 명령→상태→저장/출력까지 해당 작업의 동작을 연결한다. 미구현 기능은 활성화하지 않는다.
4. 변경에 필요한 단위/통합 테스트와 실기기 절차를 실행한다. 필수 상태 전환·글씨 맞춤 테스트는 구현과 함께 추가한다.
5. 결과를 `TEST_RESULTS.md`에 남기고 실제 지원 범위만 갱신한다. 후속 실험 실패가 PDF 핵심 기능을 불필요하게 막지 않게 한다.

## 도구와 배포

- `npm ci`로 lockfile의 정확한 버전을 사용한다. 빌드 도구도 임의 업데이트하지 않고 검증 후 변경한다.
- 이 PC에서는 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 install`과 같은 스크립트의 `check`/`build`/`dev`를 사용한다. 호환 Node 또는 Codex bundled Node를 선택하고 npm CLI도 같은 Node로 실행한다. 시스템 설정은 바꾸지 않는다.
- `npm run check`: 스킬 구조/링크 검사 → 자동 테스트 → 타입 검사 → Vite 빌드 → MV3 산출물 검사.
- 런타임에 서버가 필요하지 않다. 인터넷 연결은 웹 발표 서비스 원본 접속 등 사용자가 선택한 기능에만 사용한다.
- `dist`를 웨일 개발자 모드에서 로드한다. 확장스토어 배포와 공개 업로드는 이번 기반 구축에 포함하지 않는다.
- 새 권한을 구현할 때 `manifest.config.ts`와 `scripts/verify-build.mjs`의 기반 권한 검사를 함께 갱신한다. 기본 체크는 아직 권한이 없는 초기 상태를 검증한다.
- 브랜치를 새로 만드는 작업에서는 기본 `codex/` 접두어를 사용한다. 원문, 교사용 개인 파일, 학생 정보는 공개 저장소에 자동 추가하지 않는다.

## 저장 브라우저 시험

자동 check는 fake-indexeddb 통합 테스트를 포함한다. 실제 브라우저 저장 시험은 dev 서버를 실행하고 이미 설치된 Playwright 모듈의 경로를 명시한다. 이 PC에서는 Edge channel을 사용하며 Vite root=src이므로 모듈 URL은 /storage/, /core/이다. npm ci 재실행 전 이 프로젝트의 dev 서버를 종료해야 Windows native 모듈 잠금을 피할 수 있다.

```powershell
$env:NAVER_PPT_BROWSER_CHANNEL = 'msedge'
& 'C:\Users\서정완\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/verify-storage-browser.mjs 'C:\Users\서정완\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
```

다른 PC에서는 호환 Node/설치된 Playwright 경로와 browser channel을 맞춘다. 브라우저를 제품 패키지에 추가하지 않는다. 테스트 프로필은 node_modules/.cache/storage-browser에 별도로 생성되며 개인 프로필을 사용하지 않는다. 코드/설정이 변경되지 않았다면 이 시험을 반복하지 않는다.

## 상태와 기록

현재 종료 시험도 Whale foundation에 포함한다: 실제 A/B와 두 Editor를 열어 종료 취소/변조 파일 실패/저장 확인 후 종료→검정 대기/다른 B 불변·노트/판서 draft 보존/명시 재개 A5/백업 없이 종료/정상 재시작 closed 복구를 확인한다. closed는 문서/델타 삭제가 아니다. 영구 삭제·전체 편집창 종료 인수는 별도로 설계한다.

Whale foundation 시험은 로컬 저장 재검증도 실행한다: 실제 extension OPFS 새 출력/저널을 사용하고 내용을 생성된 PC fixture에 기록한 뒤 파일 입력에서 선택해 worker own Blob read/hash/전체 확정 상태를 대조한다. 변조 거부와 상태 보존/380px 입력 배치도 확인한다. OS chooser/Whale downloads를 대역으로 성공시킨 시험이 아니며 그 인수는 별도로 남긴다.

실제 Whale 기반 시험: `scripts/verify-whale-foundation.mjs <playwright/index.mjs> "C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe"`를 bundled Node로 실행한다. 설치 버전이 다르면 실제 version 폴더 바이너리를 먼저 확인한다. 별도 timestamp profile/headless/명시적 user-data-dir/remote-debugging-pipe를 사용한다. 초기 builtin worker는 manifest.name으로 제외한다. 실제 runtime/windows/strict DB/PDF/권한 경계/정상 재실행을 확인하며, native PDF chooser만 합성 file input으로 대체한다. OS chooser/다운로드/보이는 모니터/IME/focus/비정상 종료 인수는 별도다. 개인 기본 profile/사용자 Whale 프로세스를 종료하거나 변경하지 않는다.

PDF 보조 시험: dev 서버 5173과 `vite preview --host 127.0.0.1 --port 5174`(숨김 백그라운드)를 준비하고 같은 Node/Playwright 경로로 `scripts/verify-pdf-browser.mjs <playwright/index.mjs> http://127.0.0.1:5173 http://127.0.0.1:5174` 실행. control에서 실제 Hub/IndexedDB를 쓰고 extension transport만 대역 연결한다. 파일/worker/렌더/원본 BroadcastChannel은 실제 실행한다. 두 번째 URL의 빌드 UI에는 manifest CSP를 적용한다. 생성 PDF/hash/스크린샷은 node_modules/.cache/pdf-browser. 탐색기 파일 선택 권한·Whale 실기기는 별도다.

이 시험은 Editor 글상자/판서/가리개 draft→확정, undo/redo, 저장 실패/재시도, 외부 탐색 중 draft 고정, 합성 IME 이벤트, 실제 폰트 최대 크기/overflow도 확인한다. 앱/Vite plugin을 수정하면 화면 reload가 시험을 무효화하므로 코드 변경을 끝내고 build 후 실행한다. 초안은 실행 중 Editor에만 있으며 crash 복구·정식 파일 저장은 확정 델타와 별개다.

로컬 편집정보 시험: 같은 Node/Playwright 경로와 base URL로 `scripts/verify-session-files-browser.mjs <playwright/index.mjs> http://127.0.0.1:5173 http://127.0.0.1:5174`. 실제 PC JSON 파일을 읽은 뒤 downloads 대역에 완료를 알리고 UI 조기 완료 금지/취소 유지/Launcher strict 새 수업/원본 재연결/대기→명시적 발표와 native OPFS 출력의 write/readback/nonempty overwrite 거부를 확인한다. OS chooser와 Whale downloads는 별도 검증이다. 파일·해시·스크린샷은 node_modules/.cache/session-files-browser. OPFS는 시험 생성물만이며 제품의 원본 자동 복사 경로가 아니다.

제품 지원 대상은 Windows 네이버 웨일 전용이다. Chrome/Edge 검사는 보조 자료이며 실제 Whale 인수를 대신하지 않는다. 화면 배치 보조 시험은 위 Node/Playwright 경로로 `scripts/verify-session-ui.mjs`를 실행한다. runtime을 합성 대역으로 주입하고 1920×1080/1366×768/1280×800/768×1024/380×760의 네 화면과 노트 draft/save를 확인한다. 스크린샷은 `node_modules/.cache/session-ui`에 저장한다. 실제 파일이나 브라우저 창 기능 검증으로 보고하지 않는다.

- 구현 상태: `예정 / 구현 중 / 구현됨(자동검증) / 웨일 검증됨 / 제한 / 실패`를 분리한다.
- 기능 역량: `unverified / experimental / partial / supported / unsupported`. `supported`는 해당 환경의 검증 근거가 있을 때만 사용한다.
- 환경: OS, 웨일/Chromium 버전, 디스플레이/DPI, 파일 샘플·해시, 권한, 온라인/오프라인, 실행 시간.
- 원문 §13 `T-*`는 `SPIKE-T-*`, §19.12 `T-*`는 `IMPL-T-*`로 표기한다. §19.4 `X-*`, §15 `AT-*`, §12 `FR-*`는 유지한다.
- 오류나 미실시를 성공으로 바꾸지 않는다. 모킹과 Chromium 검사만 통과했다면 **웨일 실기기 테스트 필요**로 남긴다.

## 단계 보고 양식

```text
단계/관련 FR:
실제로 작동하는 기능:
주요 변경 파일:
빌드 결과:
자동 검증 결과:
웨일 실기기 검증: 완료 / 미실시 / 실패
제한 및 미지원:
미해결 이슈와 재현:
다음 작업:
```

## owner PC의 실제 Whale 검증 실행 (2026-10-16)

이 PC에서는 Application 루트의 whale.exe로 격리 자동화를 시작하면 즉시 종료됐다. 설치된 버전 폴더의 실제 실행 파일 `C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe`를 지정하면 제품 검증이 실행된다. 브라우저 업데이트 후 경로/버전을 다시 확인한다. 사용자 평소 프로필이나 기존 브라우저를 종료하지 않는다.

- 검증 스크립트의 첫 인자는 번들 Playwright의 index.mjs, 둘째는 위 실제 Whale 경로다. 입력 PPTX가 필요한 스크립트는 셋째에 읽기 전용 로컬 파일 경로를 전달한다.
- foundation은 `node_modules/.cache/whale-video-spike/synthetic.mp4`를 요구한다. 새 PC에서는 먼저 `node scripts/verify-whale-video-spike.mjs <Playwright> <Whale>`로 합성 파일을 생성하고, 그 뒤 `node scripts/verify-whale-foundation.mjs <Playwright> <Whale>`를 실행한다.
- 실제 파일 점검은 `node scripts/verify-whale-pptx-inspection.mjs <Playwright> <Whale> <한도 이내 PPTX>`다. 종료 코드 0이어도 privatePreview.unavailable 또는 unavailableSlides가 있으면 해당 화면은 실패/제한이다. 구조 검사 통과를 전체 충실도 통과로 보고하지 않는다.
- 현재는 사용자 요청대로 128MiB 이내 자료만 제품 검증에 사용한다. 초과 파일의 거부 시험도 이번 범위에서 제외한다. [한도 확대 후속 계획](plans/2026-10-16-input-limit-followup.md).
