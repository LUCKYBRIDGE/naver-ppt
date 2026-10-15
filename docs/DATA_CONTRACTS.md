# 데이터와 메시지 계약

2026-10-15 W0 `SourceRef` URL은 `isApprovedWebPresentationUrl` 경계를 통과한 HTTPS Canva/Miricanvas 하위 호스트만 저장한다. 외부 탭 실행이나 링크 fetch를 의미하지 않으며, 자격증명·fragment·port·교차 provider는 거부한다.

2026-10-14 `PptxResourceInventorySnapshot`은 `scope`, nullable `physicalMemoryBytes/modelHeapBytes`, 복사된 숫자 source/job 집계만 공개한다. File/Blob/본문/파일명/지문/source token은 계약에 없다. ready bytes는 source 준비 시점의 논리값이며 전체 origin 예약량으로 해석하지 않는다. [계약](pptx/RESOURCE_INVENTORY.md).

2026-10-14 source lease retain/borrowedMediaUrl.acquire는local실행소유권계약이다. RPC/public snapshot·DB/backup에URL/Blob/lease를추가하지않는다. acquire identity는id/slide/kind/fingerprint/MIME/embedded origin이며재생settings는byteidentity에서제외한다. [수명검증](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 SourceVault.get(key,expectedFingerprint?,signal?)·validator(file,signal?)는local 실행수명 API다. signal은RPC/backup/DB에저장하지않고각get은독립controller를사용한다. queued취소·late결과/close·새연결보호는[증거](pptx/SOURCE_CANCELLATION.md)를따른다.

2026-10-14 준비입장은origin 고정lock명/exclusive·optional signal로실행수명만제어한다. File/문서/세션ID를lock명에넣지않고공개snapshot/RPC/DB/backup계약은변경하지않았다. SourceVault validator는fingerprint만반환하지만get의signal계약은아직없어validator대기취소는후속이다. [검증](pptx/PREPARATION_ADMISSION.md).

2026-10-14 private buffer 소비는 adapter/미디어 읽기의 실행 수명 계약이다. source opt-in에서만검증이끝난buffer를소비하고default helper caller/다른part/view·File/Blob·hash/size근거와source lease를보존한다. metadata반환/공개snapshot·RPC/DB/backup schema는변경하지않았다. [검증](pptx/PRIVATE_BUFFERS.md).

2026-10-14 source-local duplicateImageParts/duplicateMediaParts는 검증 raw 항목의 size/SHA256 근거다. largeMediaParts는 큰 미디어와 검증된 작은 미디어 근거를 함께 제공하고 기존 binder가 원본 관계·크기/해시·owned Blob을 재검증한다. 공개 snapshot·DB/backup·RPC 계약에는 원본 bytes나 이 실행 캐시를 추가하지 않는다. [검증](pptx/DUPLICATE_PARTS.md).

2026-10-14 진행중source공유는File객체동일성과작업/소비자AbortController·예약lease만내부적으로사용한다. 공개메시지/DB/세션schema는같고각caller의문서·지문/쪽binding은계속검증한다. 창/이름/지문별전역공유가아니다. [검증](pptx/INFLIGHT_SOURCE.md).

2026-10-14 자원 재사용은 DB/메시지 schema를 바꾸지 않는다. Editor 자료 lease/같은File 전달과 guarded Blob/File identity는 실행 수명 내부이며 반환 metadata는 복사한다. signature/hash를 재사용해도 관계/원본지문/소유권/종류와 native 길이·코덱은 계속 검사한다. 이름·지문이 같은 다른File은 캐시 공유하지 않는다. [검증](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 직접 전환 입장: SessionHub는 저장된 대상이 PPTX인 raw ACTIVATE_DOCUMENT/GOTO_SLIDE/REOPEN_DOCUMENT 및 실제 현재 PPTX의 ADVANCE_AUTOPLAY를 PRESENTATION_PREPARATION_REQUIRED로 거부한다. old receipt/늦은 revision으로도 우회할 수 없고 거부는 pending/세션/receipt/발행 무변경이다. PDF 전환/순수 core 내부 COMMIT은 유지한다. 스키마 변경 없음. [검증·성능 제한](pptx/TRANSITION_ADMISSION.md).

2026-10-14 준비 표면 연결: GET_PRESENTATION_OWNER는 같은 수업 Remote에 현재 live owner ID/null을 반환하며 새 소유권을 취득하지 않는다. CLAIM_PLAYER는 자기 context ID를 함께 반환한다. 지정 Player만 공개 목표를 준비하고 같은 pending/최신 revision으로 확정한다. ACK snapshot은 단조 revision 수신으로 채택하고 불명확 응답은 같은 command ID/GET_SESSION으로 조정한다. 저장schema/원본bytes 필드는 추가하지 않는다. 직접 전환 입장은 후속. [범위](pptx/PREPARED_SCENE.md).

2026-10-14 준비후확정1단계: optional `ClassSession.presentationTransition`은null또는{requestId,playerId,documentId,slideId,fingerprint,from,closed,checkpoint:[renderer,completedGroups,revision]|null}이다. REQUEST_PRESENTATION은명시목표와현재소유Player를고정하며발표선택은유지한다. COMMIT/REJECT는정확한requestId/playerId와문서·쪽/지문/기존선택·닫힘/완료표식을검사,COMMIT만원자전환한다. CANCEL은같은수업Remote전용이다. receipt와함께기존CAS로저장,구필드없는record호환·새수업backup복구pending제거. GET_PRESENTATION_TARGET은지정소유Player에만정확한요청의공개용목표snapshot을반환하고노트/이름·과거run/request/재생/timer를제외한다. 실제Player준비consumer/입장차단은후속. [검증](plans/2026-10-14-player-transition-commit.md).

2026-10-14 리모컨 전환: ACTIVATE_DOCUMENT의기존slideId는null(기억쪽복원)또는명시적등록쪽ID를허용한다. REOPEN_DOCUMENT는계속null이며닫힌자료ACTIVATE/없는쪽은거부한다. Remote선행검사는원본/쪽·현재발표/checkpoint를재확인한뒤최신revision으로1회기존명령을보낸다. 검사/취소중상태필드/receipt/세션·백업schema는추가하지않는다. 분리runtime의transport.send/startMedia는호출시실패시켜쓰기/재생을막고과거run/request는검사용snapshot에서제거한다. 직접명령입장과Player준비commit은후속이다. [검증](plans/2026-10-14-pptx-transition-safety.md).

2026-10-14 로컬 글꼴 검사: `inspectPptxXml(files, signal?, onSlideTypeface?)`의observer는검사중슬라이드XML의typeface를전달한다. `createPptxLocalFontCheck`는유효한명시명최대64종을메모리에보유하고종료시비운다. 결과는candidates/resolved/unresolved/pending와available/truncated만반환하며이름/본문/폰트bytes·session/backup필드는추가하지않는다. local조회성공은실제적용/원본충실도/라이선스pass가아니다. 신규등록/별도파일점검에서만실행하고재연결은미검사안내를명시한다. [검증](plans/2026-10-14-pptx-local-font-preflight.md).

2026-10-14 글꼴 사전검사: XML 검사 결과의 optional `fontMetadata`는 `references/uniqueNames/invalidReferences/invalidNames/embeddedParts` 숫자와 `truncated`만 반환한다. 이름 목록은 최대5,000종·각200자까지만 검사 중 보유하며 결과에 원문 이름/본문은 넣지 않는다. 등록·원본검사·모델 Preflight에서 공유하며 부재는 기존 호출과 호환한다. 정상 이름/내장 파트 존재만으로 설치·실제 적용·라이선스·충실도를 확정하지 않는다. 세션/백업 schema와 권한 변경 없음.

2026-10-14 sourceModel의 `largeMediaParts`는 guarded 원본 part의 불변 size/SHA256 메모리 근거다. 큰 압축해제 buffer를 해제한 뒤에도 mediaTimingBinding은 등록 Blob/파일 hash를 이 원본 근거와 대조한다. `embeddedRecovery`는 recovered/unresolved/uniqueBytes 숫자 진단이며 자동 재생 권한이 아니다. External 호환 참조와 p14내장 관계 선택은 localMediaPart로 공유한다. 저장/세션/명령 schema 변화 없음. [근거](pptx/TEACHER_02.md).

2026-10-13 PPTX 항목 한도: `pptxPartByteLimit`이 ppt/media의 MP3/WAV/MP4/WebM에만64MiB, 일반32MiB/XML4MiB를 적용한다. Worker 수신도 같은 경로 기준, 공식 모델 asset은 audio/mpeg·audio/wav·video/mp4·video/webm만64MiB를 적용한다. 입력128MiB/전체압축해제·asset합256MiB/ratio1000은 유지한다. 저장 schema 변화 없음. [검증/제한](pptx/TEACHER_02.md).

2026-10-13 source media 재준비는 런타임의 refs/설정 입력키·준비회차만 사용한다. run/request 중 교체를 미루고 완료 cursor/source-v1 계약을 유지한다. 준비 불가 새Player의 구조 복원 driver는 action 권한이 없다. schema/명령/백업 필드 추가와 transform-v1 자동 변환 없음. [범위](pptx/MEDIA_TIMELINE_REFRESH.md).

2026-10-13 sourceTimeline 내부 준비 결과는 group timingId/shapeGroup과 mediaId/출처 binding/정규 action/delayMs만 포함한다. 원문/XML/handle은 저장하지 않으며 기존 requestId/run epoch·source-v1 checkpoint와 CHECKPOINT_PPTX_MEDIA를 사용한다. 실행 직전 등록 ref 대응을 재검사하고 새 Player는 과거 action을 호출하지 않는다. 혼합/복합 타이밍·동적 재준비는 후속이다. [범위](pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 Player native endpoint: source action 수락 후 기존 CHECKPOINT_PPTX_MEDIA ACK까지 기다리며 자기 ACK의 play/seek 재적용을 억제한다. 취소 뒤 늦은 자기 commit과 새 Player의 과거 playing source bookmark는 기존 CHECKPOINT_MEDIA로 정지 보정한다. Remote 새 epoch가 이전 native handle을 무효화하며 세션/백업 schema는 바꾸지 않는다. [범위](pptx/NATIVE_PLAYER_ENDPOINT.md).

2026-10-13 CHECKPOINT_PPTX_MEDIA는 소유Player 전용 native 결과(time/paused/ended)와 현재PPTX epoch/expectedMediaEpoch/MediaPlayback을 strict 검증해 bookmark만 저장한다. sourceRunEpoch?는 진행중 취소·교체/reset 정지 소유 표식이며 새 백업복구에서 제거한다. raw 명령/bytes 추가 없음. 원본타이밍 호출은 후속이다. [계약](pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 원본 미디어 설정: `PptxSourceMediaSettings={volume:number|null,muted:boolean|null,trimStartSec,trimEndSec,limitations:string[]}`는 일시 준비 결과다. native길이로 기존 MediaPlayback을 검증해 새 ADD_LOCAL_MEDIA에만 포함하며 재연결은 기존값을 유지한다. vol/mute 누락은 원본default확인으로 취급하지 않는다. 새로운 세션/백업 필드 없음. [근거](pptx/SOURCE_MEDIA_SETTINGS.md).

2026-10-13 mediaTimelineControls는 root/main/group/declaration timing IDs와 명시적인 순차 제어 판정만 반환한다. controlsVerified=true와 executionVerified=false를 구분하며 제품 실행/저장 권한을 부여하지 않는다. concurrent/seek/skipTimed 및 자동 시작 선언은 현재 거부한다. 세션 schema 변화 없음. [범위·근거](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 mediaCallDelay는 선택된mainSeq 직접 클릭그룹→cmd의 명시적 무조건 지연 합계와 timingIds를 반환한다. event/참조/반복·불명확 조건은 거부한다. executionVerified=false는 root/seq/설정 검증과 별개임을 명시한다. delayed native wrapper는 현재회차/deadline/취소를 검사하며 아직 제품 명령·저장필드가 아니다. [검증](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 resolveSourceMediaCalls는 timingId/declarationTimingId/strict 등록target/정규action을 반환한다. cmd와 root 직접 audio/video의 kind·scope·hash·path를 일치시킨다. 아직 실행/저장명령이 아니며 조건·설정/native bookmark 검증을 대신하지 않는다. dispose 뒤 늦은 결과는 거부한다. [계약](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 durablePlayback은 native 명령 수락 후에도 완료ACK까지 회차 cancel handle을 보존한다. 취소/실패는 단 한 번 정리하며 성공ACK는 계속 재생되는 미디어를 정지하지 않는다. 늦은ACK와 동기start 취소가 다른회차를 정지하지 않게 한다. 저장 schema 변화 없음. [검증](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 PptxMediaAction은 bounded call의 정규 객체(play/pause/resume/stop/togglePause 또는 playFrom/timeSec)다. 아직 session 명령/저장 필드가 아니며 native executor는 외부에서 검증한 scope/현재회차 callback을 요구한다. 완료는 명령 수락이고 자연 종료가 아니다. type 생략 call 인식은 원본 실행 권한이 아니다. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 runtime.sourceShapeGroups는 원본 timingId/모델shapeSteps와 공식shapeGroup번호 또는 null의 정확 대응 배열 또는 null이다. 공식 그룹 전체 일치와 엔진 totalGroups 일치를 확인하며 오류는 unknown 고지다. 저장하거나 원본 실행 권한으로 사용하지 않는다. [범위](pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 원본 그룹 완료 커서용 renderer `web-ppt-0.4.5/source-v1` 추가. 기존 transform-v1과 자동 변환하지 않으며 bridge의 driver 계약 일치와 reducer의 이전 완료 renderer 일치를 검사한다. restore는 도형 커서/pose만 복원하고 미디어 action은 재실행하지 않는다. 제품 runtime에는 아직 미연결. [계약·근거](pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 원본 구조 대응은 `groups:{timingId,shapeSteps:number[],media:PptxMediaTimingTarget[]}[]`, independentMedia, sequences, timeNodes, mediaOnlyGroups, executionVerified:false를 반환한다. shapeSteps는 원본순서에 대응한 모델 효과 index이며 배열 참조/원문 명령/파일명은 저장하지 않는다. 구조 진단은 실행·완료checkpoint 권한이 아니고 session/bundle schema 변화 없음. [범위](pptx/SOURCE_ORDER.md).

2026-10-13 조건 분류: 최신 mediaTiming 숫자 요약은 17개다(기존11+repeatNodes/reverseNodes/endConditionNodes/interactiveNodes/trimNodes/unverifiedTimingNodes). `readPptxMediaTiming().timeNodes`는 부모 timing ID·정해진 nodeType/evt·숫자/indefinite·시작/종료 time/shape/slide 참조를 보존한다. 임의 어휘는 unknown, 잘못된/미해석 설정은 unverified이며 실행 기본값으로 치환하지 않는다. 임시 진단에만 사용, 세션/백업/공개snapshot 변화 없음. 아래11개 기록은 이전 시점이다. [범위](pptx/MEDIA_TIMING.md).

2026-10-13 `BoundPptxMediaTimingTarget` 진단 API는 node/shapeId/timingId/slideId/sourcePart/sourceFingerprint/elementPath/kind/mediaFingerprint만 반환한다. 원본 XML 문서 순서이며 클릭 순서나 실행 명령이 아니다. 등록 모델·원본 내부 관계·SHA-256·소유 Blob을 함께 확인한다. 세션/공개snapshot/백업에는 추가하지 않는다. [범위](pptx/MEDIA_TIMING.md).

2026-10-13 XML 검사 결과의 `mediaTiming`은 11개 strict 숫자 요약이며 호출 수 합계와 한도를 검증한다. 모델 Preflight는 부재를 unknown으로 취급한다. 원문명령/본문/URL과 세션·백업 필드 추가는 없다. [범위](pptx/MEDIA_TIMING.md).

2026-10-13 `LocalMediaRef.embeddedSource?={type:'pptx',sourceFingerprint,sourcePart,elementPath}` 추가. strict source shape/원본지문 일치/문서 내 출처 중복을 명령·저장 양쪽에서 검사한다. 기존 로컬 ref 호환, 공개 projection 깊은복사/파일명제외, bundle metadata 보존·복구 정지. 실제 자산 대응은 원본/part/path/slide/hash/kind/MIME/size 모두 일치해야 한다. 바이너리/URL 저장 없음. [범위](pptx/EMBEDDED_MEDIA.md).

2026-10-13 PPTX overlay는 기존 normalized OverlayData/SET_SLIDE_OVERLAYS/공개projection·로컬bundle 계약을 그대로 사용한다. 원본SVG와layer별도,측정canvas.dataset.pixelSampling=unavailable은원본색샘플링권한을뜻하지않는다. 실제색후보없음과임의검정샘플을구분한다. sizingcanvas는1280기준/높이1..8192를할당전검사한다.[근거](pptx/OVERLAYS.md).

2026-10-13 공통Import는 원본File/수업/실험PPTX허용/optional handle·재연결ID·AbortSignal을 받고 기존 prepared document/reused/preflight를 반환한다. opt-in 없이PPTX파싱불가,형식별vault격리/PPTX1000쪽. 상태등록은기존REGISTER_DOCUMENT ACK로만확정한다. 등록비공개뷰는원본UUID/지문을검증하며독립임시UUID경로와구분한다.[근거](pptx/PRODUCT_IMPORT.md).

2026-10-13 로컬 bundle schema1은 PDF/PPTX를 허용한다. 저장/재검증 시 진행 request/run을 그대로 비교한다. 새 수업 복구는 strict 검증 이후에만 새 수업ID/revision0으로 완료 checkpoint.pose.scope를 바꾸고 run/request를 제거한다. 원본/미디어 bytes·native handle키는 저장하지 않는다. PDF2000쪽/PPTX1000쪽, JSON16MB 한도를 적용한다. [근거](pptx/LOCAL_BACKUP.md).

2026-10-13 PPTX 요청: optional pptxPlayback.request={commandId,slideId}|null. Remote REQUEST/CANCEL, 소유 Player BEGIN_REQUESTED(기본 context+requestId)만 허용한다. 정확한 token을 strict commit으로 소비하며 요청과 BEGIN의 commandId는 다르다. 대기/run 중 추가 요청과 직접 BEGIN 우회는 거부한다. 취소/전환은 완료 checkpoint를 보존한다. Remote UI 소비까지 연결/실제 Whale 검증했다. [근거](pptx/REMOTE_REQUEST.md).

PPTX UI 안내는 extension origin의 `pptx-effect:`+JSON.stringify([sessionId,documentId,slideId]) BroadcastChannel에서 `{status,revision}`만 전달한다. Remote query는 문자열 `query`; Player는 현재 view 상태만 응답한다. status는 loading/ready/held/running/completed/cancelled/failed/exhausted이고 revision은 음수가 아닌 안전한 정수다. 수신은 정확한 필드·현재 revision 이상만 인정한다. 이 일시적 안내는 영속 요청/소유권/완료 상태의 근거가 아니며 별도 명령 실행 권한을 부여하지 않는다. 원본/노트/파일명은 포함하지 않는다.

2026-10-12 PPTX 모델검사: inspectPptxModel은bounded숫자요약만, pptxModelPreflight는기존PreflightReport/document scope·원본요약/모델대응·warning/unknown고지를반환한다. model pass는전페이지화면일치/미디어재생/원본효과충실도아님. 세션/백업필드추가없음. [근거](pptx/MODEL_PREFLIGHT.md).

2026-10-12 PPTX 모델대응: bindPptxSlideModel(document,fingerprint,parts,model).get(slideId)→freeze된{slideId,sourcePart,index,slide}. 공개명령은기존UUID, index는후보엔진경계에만사용하며null/없는ID의첫쪽fallback금지. 모델/원본XML은세션·백업에저장하지않는다. [근거](pptx/MODEL_BINDING.md).

2026-10-12 PPTX 등록준비: preparePptxImport→{document,reused,preflight}. 신규쪽순서는presentation의sldIdLst/내부관계, ID는독립UUID. 세션불변이며REGISTER_DOCUMENT ACK는호출자가별도로확인한다. fast 검사 pages pass는XML개수만, 재연결pages unknown·media/behavior/offline unknown. [근거](pptx/REGISTRATION.md).

2026-10-12 PPTX 입력: readPptxInput(File,AbortSignal?)→{bytes,fingerprint}; header/크기/전체읽기와SHA256만 검사하며 package/XML/모델 검사를 대체하지 않는다. pptxSourceVault는sourceKey(sessionId,documentId)와전용채널로연결, cold읽기시재해시하며DB/백업계약변경없음. [근거](pptx/SOURCE_BOUNDARY.md).

2026-10-12 Player transport: readSnapshot/receiveSnapshot은공개Player만사용, 연결없음/수업변경이면BEGIN/CHECKPOINT 요청전거부. ACK Player종류·수업·정수revision>명령revision 검사/더최신subscription보존·clone. backend의신규명령owner gate를실제Whale sender/worker재시작으로검증했다. 제품renderer/UI는후속. [상세](pptx/PLAYER_TRANSPORT.md).

2026-10-12 ACK bridge: PptxCheckpointDriver는 실제모델 totalGroups/targets와 공식엔진 restore/next/start/complete, transport는공개Player snapshot/send/newId만 제공한다. 모델과pose target집합·그룹수검증 및BEGIN→효과→완료캡처→strictACK 순서. ACK전busy, 실패는공개확정checkpoint복원. [상세](pptx/PLAYBACK_BRIDGE.md).

2026-10-12 PPTX checkpoint: optional document.pptxPlayback={checkpoints,run|null}; 완료 값은 renderer 계약ID·원본 SHA256·완료그룹수·검증된 pose. Player BEGIN/CHECKPOINT는 활성 대상/revision/epoch와 이전완료+1 검사 및 실제 소유자 경계, Remote RESET는 선택쪽만 초기화. source/scope 검증 후 pose를 새 공개revision에 clone. [상세](pptx/DURABLE_CHECKPOINT.md).

2026-10-12 C-PREFLIGHT-06: PdfInspection.renderedPages는 optional 정수이며 존재하면 inspectedPages.length와 같아야 cache 허용. 모든 검사쪽의 실제Canvas 렌더 완료 수만 보관, 원본pixel 비교는 아님. inspectionKey 계약v3, environment에1024x768/DPR최대2를 포함한다. Session/Player/백업 계약 변경 없음(TEST_RESULTS05:26).

Preflight cache(2026-10-12): inspectionKey JSON tuple는 contractv2/fingerprint/count/pages/environment(PDF.jsversion/UA/platform). InspectionCache는32개/300000ms LRU·clone summary만보관하며시간역행도miss. source/hash 재확인 후lookup, media항상재검사. PdfInspection.cached=true는읽기요약재사용만뜻하며 결과의source/offline pass와별개. force=true는lookup을건너뛴다(TEST_RESULTS05:15).

Preflight 범위(2026-10-12): report.scope는 registration/sample/document. checkPreflight 마지막mode는 sample(default)/document만허용, sample=first/current/last중복제거, document=1..등록count. 반환inspectedPages/count가정확히일치해야읽기pass. browserInspector progress는completed/total; 전체120초/부분30초와abortcleanup. 범위는원본pixel·효과일치와별개(TEST_RESULTS05:11).

Import fast 결과(2026-10-12): preparePdfImport의 반환값은 {document,reused,preflight}이며 preflight는 기존공통결과다. 신규파서count만pass, 재연결은null parser증거→unknown. teacher Import는 strict등록성공 후 결과를 공개하고 실패하면 해당자료 성공결과를 만들지 않는다. 결과는 세션필드/Player/백업에 넣지 않는 최대16개 메모리이며 원본 bytes/노트 없음(TEST_RESULTS05:02).

Preflight 실행 계약(2026-10-12): PreflightReport={documentId,fingerprint|null,checkedAt,environment,items}; item={id,category:visual/media/behavior/offline,status:pass/warning/unknown/error,message}. teacher 실행메모리만, Player snapshot/세션/백업에 추가하지 않는다. PDF inspector는 pageCount/inspectedPages/외부링크수/JS존재/annotationKinds, media는 길이만 반환. 원본bytes는 브라우저 경계에서 한도/hash검증 후 사용하며 결과에 넣지 않는다. 현행 부분검사·미확인 범위 TEST_RESULTS04:59.

타이머 소리(2026-10-12): optional sound(Boolean)/completedEpoch/alarmClaimedEpoch(ID). Remote SET_TIMER_SOUND는 context/slideId=null/sound만 받으며 시간/epoch 불변. 소유 Player FINISH 후 completedEpoch=epoch; CLAIM_TIMER_ALARM는 context/epoch·현재 범위·paused/완료·sound·미claim 확인 후 alarmClaimedEpoch strict 기록. 자동 시도권이며 audible 성공을 뜻하지 않는다. 백업 복원은 completedEpoch의 알림을 억제한다(TEST_RESULTS04:53).

타이머 위치(2026-10-12): optional position exact{x,y}/finite0..1. Remote-only SET_TIMER_POSITION는 기본 context/slideId=null/position만 받으며 수업 documentId=null, 자료 현재 발표 documentId. 실행 epoch/시간/정지 여부 유지·strict commit. 공개 projection/백업 clone 유지, 새 설정 재적용도 위치 유지. 기본값은 수업(1,0)/자료(1,.12), 위치는 viewport 여백 내부의 anchor 기준(TEST_RESULTS04:47).

## 타이머 (2026-10-12)
- TimerState mode/visible/epoch optional, 기존 globalTimer(document) 읽기 호환. 새 수업 타이머는 globalTimer, 자료별 타이머는 documents[id].timer. legacy는 명시 조작 때 자료로 이관한다.
- Remote SET/PLAY/PAUSE/RESET_TIMER: slideId=null; 수업 documentId=null, 자료 현재 발표 documentId. countdown1..86400초/stopwatch0초/visible Boolean, 새 epoch=commandId. Player FINISH_TIMER는 생존 owner/범위/revision/epoch/실제 deadline 확인 후 durationMs로 정지한다.
- 공개 timers는 수업+현재 자료 clone만 제공하며 파일명/노트 없음. 백업은 exportedAt 경과를 포함해 정지 복원한다. 소리·위치 미구현(TEST_RESULTS04:43).

## Player 실행 소유권 (2026-10-12)
- 자체 Player만 exact {type:CLAIM_PLAYER,sessionId}를 보내고 backend는 실제 sender.documentId/URL수업과 생존 context를 검증한다. 응답은 {ok:true,kind:player-owner,owned:Boolean}이며 소유자 ID/비공개 상태를 보내지 않는다. 자료·수업 revision을 변경하지 않는다.
- 별도 owner DB {sessionId,documentId}는 Web Locks 안의 생존 조회→strict 저장으로 판정한다. 기존 생존 소유자는 유지하고 없어진 경우에만 대기창이 claim한다. Player의 ADVANCE/PLAY_MEDIA/CHECKPOINT는 같은 소유자만 허용한다. 소유 API/저장/창 조회 실패는 실행 grant 금지다. OPEN_CURRENT_EDITOR/공개 GET은 기존 역할 계약을 유지한다.

## 로컬 미디어 (2026-10-12)
- B-MEDIA-CONTROLS-01: ref의 optional playback={startSec,endSec,volume,muted}는 exact4필드/0≤start<end≤duration/volume0..1/Boolean으로 검증한다. 없으면 전체 길이·음량1·음소거false. Remote만 SET_MEDIA_PLAYBACK/SEEK_MEDIA를 실행하며 현재 발표 context/revision을 요구한다. 구간 변경은 해당 미디어를 새epoch/positionEpoch·시작 위치·정지로 만들고 autoplay도 정지한다. 음량만 바꾸면 bookmark/재생을 유지한다. seek는 [start,end) 안에서 현재 정지 여부/자동 넘김 회차를 보존하고 새epoch/positionEpoch로 이전 보고를 거부한다. Player는 positionEpoch 변경에만 정지 상태의 명시적 seek를 실행하여 단순 PAUSE가 진행 위치를 되감지 않게 한다. ended/자동 넘김은 전체 길이가 아닌 설정 end를 사용한다. 플레이백 설정·positionEpoch도 schema1 metadata 백업/복원에 포함한다.
- 미디어 기반 autoplay: optional bookmark.autoplayEpoch는 PLAY_AUTOPLAY/ADVANCE에서 새 회차로 묶는다. PLAY_MEDIA의 직접 gesture 재개도 실행 중인 해당 회차를 보존한다. 종료 판정은 현재 페이지의 모든 등록 ref가 같은 autoplayEpoch/ended=true/paused/길이 근처여야 하며 미디어 없음은 null이다. Player 공개 autoplay.mediaEnded는 이 파생 Boolean/null이다. 요청자가 종료 여부를 ADVANCE 인자로 보내지 않는다.
- `PresentationDocumentState.localMedia?: Record<id,LocalMediaRef>`: 자료당16개, ref={id,slideId,kind:audio|video,name,mime,size,lastModified,fingerprint,durationSec}. 허용 MIME은 audio/wav·audio/mpeg·video/mp4·video/webm, 파일128MB/길이24h/SHA256/해당 slideId. 원본 bytes/URL/handle key/추가 필드 없음. 기존 schema1은 optional 필드 없이 읽는다. 백업은 metadata만 보존하고 복원 시 bookmark는 paused다.
- MediaBookmark에 optional epoch/ended 추가. 새 재생·교사 정지는 commandId를 epoch로 쓰고 Player CHECKPOINT_MEDIA는 context+mediaId/epoch/timeSec/paused/ended를 보낸다. active 진행 보고 또는 inactive paused tail만 허용한다. 이미 정지한 상태를 오래된 진행 보고로 해제하지 못하며 ended는 실제 길이 근처의 paused 상태만 허용한다. 저장 레코드에서도 등록 ref의 위치/현재 발표 범위를 검사한다.
- ADD_LOCAL_MEDIA는 Editor만, PLAY/PAUSE는 Remote, Player는 PLAY(직접 허용)와 CHECKPOINT만 허용한다. Player sender query 수업 일치 gate 적용. PlayerSnapshot.media는 현재 페이지의 ref에서 name/size/lastModified를 제외한 clone+bookmark다. filename/노트/Editor 정보는 포함하지 않는다. SourceVault media key는 JSON.stringify([sessionId,documentId,mediaId])이며 별도 media channel/파일 validator를 사용한다.

## 재생 체크포인트 (2026-10-12)
- `PresentationDocumentState.autoplayCheckpoint?: {slideId,epoch,startedAt:number|null,elapsedMs:number,paused:boolean}`. slideId는 해당 자료의 검증된 페이지, epoch는 200자 이하 비어 있지 않은 실행 식별자다. elapsedMs/시각은 유한한 비음수다. 정지하면 startedAt=null, 실행 중이면 현재 발표 자료/페이지와 일치해야 한다. closed 자료는 실행 상태를 가질 수 없다. 필드 없는 schema1은 그대로 읽는다.
- 실제 자료 전환은 이전 자료의 checkpoint/미디어/자료 타이머를 정지하고 대상은 수동 재개 대기로 복원한다. 같은 자료 활성화와 Editor 선택은 정지하지 않는다. 다른 페이지로 GOTO_SLIDE하면 기존 checkpoint의 epoch=commandId/elapsedMs=0/paused=true로 바꾸고 자료 타이머는 유지한다.
- `.wcp.json`은 checkpoint를 metadata로 저장한다. 복원은 원본 bundle을 바꾸지 않고 exportedAt까지의 경과시간을 정지 상태로 만든다. 원본/미디어 bytes를 넣지 않는다. Player 공개 snapshot의 autoplay는 현재 resolve된 rule와 checkpoint의 clone 또는 null이며 비공개 정보는 없다.
- Remote 전용 SET_AUTOPLAY는 현재 발표 context에 scope=session|document|slide와 rule 또는 null(자료/페이지 상속 복귀)을 추가한다. 새 실행 설정은 manual/seconds/media-end/later-of-time-and-media, 시간 조건1~86400초, pauseWhileEditing=false만 허용한다. range는 해당 자료의 유효한 순방향 IDs이며 session range는 금지다. 설정 변경은 현재 checkpoint를 새 epoch/시간0/정지로 만든다. PLAY_AUTOPLAY/PAUSE_AUTOPLAY는 같은 현재 context의 재개·정지다. 미디어 기반 재개는 현재 ref가 필요하며 native 재생 요청을 같은 회차에 묶는다.
- Player 전용 ADVANCE_AUTOPLAY는 기본 context+epoch만 받는다. 현재 진행 중 checkpoint와 target/epoch/revision/실제 경과가 맞아야 하며 다음 target은 core 계산이다. sender URL의 sessionId도 일치해야 한다. 중복/실패/늦은 예약으로 다른 페이지나 자료를 바꾸지 않는다. 신규 타이머는 Player에서만 예약한다.

## 현재 자료 종료 (2026-10-12)
- `PresentationDocumentState.closed?: boolean`: 없는 이전 schema1 자료는 열림. closed=true는 발표에서 제외되지만 델타/원본 참조/Editor 선택은 유효하다. closed 자료를 presentedSelection으로 저장하면 거부한다.
- `CLOSE_CURRENT_DOCUMENT {command:{type:CLOSE_DOCUMENT,commandId,sessionId,documentId,slideId:null,revision},decision:saved|without-backup|unchanged,blobUrl:string|null}`는 Remote만. saved만 own Blob URL이 필요하며 worker 파일 재검증 후 strict revision CAS. raw SESSION_COMMAND CLOSE 금지. unchanged는 대상 dirty=false만.
- CLOSE는 현재 자료만 closed/null 발표로 만들고 대상 bookmark/document timer를 정지하며 다른 자료/Editor는 유지한다. 성공은 teacher snapshot, 실패는 기존 오류 envelope다. REOPEN_DOCUMENT는 Remote의 별도 SESSION_COMMAND이며 closed 대상만 다시 열고 마지막 위치를 발표한다. 원본/상태 삭제 API가 아니다.

## 저장 결과 저널 (2026-10-12)
- VERIFY_SAVED_BACKUP: `{type,sessionId,revision,blobUrl}`, Editor/Remote만. 검증 성공은 `{ok:true,kind:'backup-verification',verification:{exportId,sessionId,revision,sha256,verifiedAt}}`; 노트/경로/본문은 반환하지 않는다. own Blob root+UUID만 fetch하며16MB/30초/버전/현재 확정 상태/완료 metadata 대조 및 확인 후 revision 재조회. 상태 mutation/Player 배포/종료권한 없음. API sender는 기존 role 검증을 거친다.
- `storage/saveJournal.ts`의 SaveAttempt/SaveOutcome/SaveJournalRecord를 따른다. prepared는 captured sessionId/revision/출력 SHA-256/bytes/시각을 고정한다. state는 prepared→complete|failed|cancelled 한 번만 바뀌며 완전히 동일한 terminal replay만 허용한다.
- IndexedDB 별도 v1 attempts/exportId, 한도256, strict transaction complete 후 ACK. File/Blob/파일명/경로/내용은 금지한다. read는 unknown shape/해시/시각/transport/downloadId를 검증하며 손상 레코드를 초기화하지 않는다.
- `export/localFile.ts`만 현재 UI 저장 경로에서 기록한다. 파일 성공과 저널 실패는 `complete + journal: unrecorded`로 구분한다. 원본대비 dirty와 세션 revision은 변경하지 않는다. unknown runtime 종료 요청 검증/출력 재확인/CAS/draft 동결은 아직 미구현이며 이 레코드를 종료 승인으로 사용하지 않는다.

제품 기준은 [PRD v5](../naver-ppt_PRD_v5.md)다. 코드 계약은 `src/core/types.ts`, `commands.ts`, `events.ts`, `src/overlays/types.ts`, `src/media/types.ts`, `src/storage/types.ts`, `src/export/types.ts`이다. `session.ts`는 순수 reducer, `storage/sessionService.ts`는 저장 조정, `indexedDbSessionRepository.ts`는 실제 IndexedDB 구현, `validateSessionRecord.ts`는 저장 레코드 검증이다. 브라우저 요청은 `shared/sessionMessages.ts`, 공개 상태는 `core/playerSnapshot.ts`를 따른다. 외부 파일 가져오기/마이그레이션은 미구현이다.

## Stage A 현재 구현

- `slideIds`는 검증된 페이지 목록이다. 이번 REGISTER_DOCUMENT는 개수가 알려진 페이지 자료만 받는다. 웹의 null 위치 지원은 Adapter 구현 때 별도 확장한다.
- SessionCommand는 REGISTER_DOCUMENT / ACTIVATE_DOCUMENT / GOTO_SLIDE / SELECT_EDITOR_SLIDE / SET_PRESENTER_NOTE만 포함한다. overlay/재생/종료 요청 타입은 실행 경로에 연결하지 않았다.
- 등록은 공개/편집 선택을 바꾸지 않는다. 발표 이동만 lastSlideId를 갱신한다. 편집 탐색/노트는 발표 선택/마지막 발표 위치를 바꾸지 않는다.
- SessionService는 요청을 직렬 처리하고 repository commit 완료 후 성공을 반환한다. repository는 상태와 receipts를 동일 트랜잭션에 저장하고 expectedRevision CAS를 보장해야 한다.
- receipts는 세션별 최근 256개 commandId/revision만 보관한다. 중복 응답의 revision은 원 명령 revision이며 snapshot은 현재 상태다. 한도 밖의 이전 요청은 revision 검사로 거부한다. 새 commandId 생성은 호출자의 책임이다.
- 서비스 재생성 대역 테스트는 실제 Whale durable 복구 증거가 아니다. PlayerSnapshot은 sessionId/revision/selection/pageNumber/sourceFingerprint/현재 overlays만 포함하고 title/파일명/source 전체/editorSelection/presenterNote/classLog를 배제한다. 페이지 번호는 검증된 slideIds에서 구하며 fingerprint는 원본 일치 검증용이다. 전체 ClassSession은 교사 창에서만 사용한다.
- IndexedDbSessionRepository.open → create(revision 0) → SessionService.execute → read → close/open 순서로 복구한다. DB envelope schemaVersion=1이며 원본 바이너리는 넣지 않는다. unknown 저장값의 shape/참조 무결성을 검증하고 이전 상태와 receipt append가 원자적인지 확인한다. 저장값 검증은 브라우저 명령 메시지/외부 import의 검증을 대신하지 않는다.

## 브라우저 경계

- sender.id와 sender.url을 runtime.getURL로 만든 자체 페이지의 protocol/host/pathname과 비교한다. 본문 role로 권한을 정하지 않는다.
- Launcher: LIST_SESSIONS(최신 20개 요약), CREATE_SESSION, REGISTER_DOCUMENT. Remote: ACTIVATE_DOCUMENT/GOTO_SLIDE. Editor: REGISTER_DOCUMENT/SELECT_EDITOR_SLIDE/SET_PRESENTER_NOTE/SET_SLIDE_OVERLAYS. Editor의 사용자 파일 선택은 독립 창에서 수행하고 원본 바이너리는 명령에 넣지 않는다. Player: 조회만. 모든 역할은 GET_SESSION을 역할별 projection으로 받는다.
- unknown 요청은 필수/허용 키, ID, revision, 명령 종류와 등록 metadata를 검증한 뒤 DB를 연다. File/Blob/바이너리 포함 등록을 거부한다.
- port 이름은 naver-ppt-session, 수업은 URL query의 sessionId다. 같은 수업 구독에만 commit 완료 후 배포하며 중복/실패는 재배포하지 않는다. 재접속의 초기 snapshot도 DB에서 읽는다.
- 성공 응답은 list/teacher/player로 판별한다. 저장·API 내부 오류 문자열은 그대로 노출하지 않는다. 노트 저장 실패 때 UI draft를 유지한다.

## 식별과 선택

- 자료 ID와 슬라이드 ID는 재정렬에 영향받지 않는다. 파일 경로를 ID로 쓰거나 배열 순서를 식별자로 저장하지 않는다.
- `presentedSelection`과 `editorSelection`을 독립 객체로 둔다. 자료 선택은 `ACTIVATE_DOCUMENT`, 자료 안 이동은 `GOTO_SLIDE`, 편집 선택은 `SELECT_EDITOR_SLIDE`로 분리한다.
- 웹 W0의 슬라이드 개수/위치는 `null`. 확인하지 않은 값을 1이나 가짜 썸네일로 대신하지 않는다.
- 명령의 `revision`은 적용 전 기대값이다. 늦은 변경 명령을 거부하고 snapshot을 갱신한다. 중복 commandId는 다시 적용하지 않는다.
- 대상 없는 전체 종료는 documentId/slideId를 명시적 null로 둔다. 세부 명령별 필수 대상과 같은 세션에 속하는지 검사한다.

## 공개 상태와 draft

OPEN_CURRENT_EDITOR는Player만요청하는좁은진입API다. exact type/command(SELECT_EDITOR_SLIDE + sessionId/documentId/slideId/revision/commandId)를검증하고sender의query수업과일치해야한다. durable현재발표target일치/closed/stale검사후내부SELECT만strictcommit하며발표/델타를바꾸지않는다. rawPlayerSELECT/노트·레이어명령은여전히금지한다. Hub의ack는public PlayerSnapshot, worker UI응답은kind=editor-open/windowId이며teacher snapshot을Player로보내지않는다. 기존draft는heldselection정책으로대상유지, window실패가Editor선택commit을rollback한다는보장은없다.

편집 중인 텍스트·선택 핸들·DOM ref·File/Blob·object URL은 UI/실행 상태로 관리한다. 승인된 슬라이드 델타만 공개 snapshot과 영속 모델에 넣는다. 현재 발표 슬라이드에 대한 draft는 기본적으로 확정 전 청중에게 보이지 않는다. 즉시 반영 옵션은 명시적으로 선택한 경우에만 사용한다.

SET_SLIDE_OVERLAYS는 지정 slideId의 배열 전체를 교체한다. 노트/classLog/autoplay와 양쪽 선택을 보존한다. 메시지/core/저장소가 같은 isOverlayList 검사를 사용한다(256개, 개별 스트로크 10,000점/전체 50,000점, 글상자 10,000자, 고유 ID, 색/좌표/추가 필드 제한). 성공은 strict transaction 완료 후이며 draft/undo history는 DB와 Player로 보내지 않는다. 편집 중 외부 Editor 선택 변경은 현재 draft 대상을 바꾸지 않는다. 원격 레이어 변경과 충돌하면 초안을 유지하고 취소/최신 확인을 안내한다.

## 좌표·글꼴

- 오버레이 rect/point는 원본 슬라이드 기준 0..1. x/y/width/height와 경계가 유효한지 확인한다. 회전/shape는 이번 초기 UI에 추가하지 않았다.
- 글꼴 크기·내부 여백은 referenceWidth/referenceHeight의 논리 px이다. 새 글상자는 폭 1280과 원본 캔버스 비율의 높이를 기록하며 이전 데이터는 폭 1280/현재 비율로 해석한다. Editor·Player는 같은 Canvas 엔진과 Windows 설치 Malgun Gothic 측정을 사용한다. 폰트 파일을 복제/배포하지 않으며 사용자 폰트/내보내기 일치는 후속 검증이다.
- `auto-max`는 실제 글꼴의 줄바꿈·폭·행 높이·여백을 측정한다. 상자 크기를 고정하고 최소 크기 불충족을 별도 결과로 반환한다.
- 스트로크는 정규화 점과 선 굵기를 저장하고, 마스크와 글상자는 별도 종류로 구분한다.

## 세션 파일

PDF copy는 session bundle과 별개다. createPdfCopy는 원본 SHA256+등록페이지/확정overlays를 대조하고 공개레이어만 새PDF에 추가한다. source와document를 복사해 실행중변경을 격리하며 viewport inverse matrix는 crop/rotation/UserUnit을 처리한다. savePdfFile은 PDF MIME/.pdf/256MB 한도와 새empty 파일·write-close-readback/own downloads 완료만 처리한다. PDF ExportResult에는 .wcp.json journal 증거를 추가하지 않으며 세션revision/dirty/receipts를 변경하지 않는다. captured revision 이후 변경은 UI에 추가저장 필요로 표시한다.

확장자는 가칭 `.wcp.json`, `format: whale-class-presenter`, `schemaVersion: 1`이다. `SessionBundle`은 원본 metadata/reference와 상태·델타만 가진다. 원본 바이트와 파일 핸들 자체는 포함하지 않는다. File System Access 핸들은 별도 저장 키로 참조한다.

현재 sessionBundle.ts가 UTF-8 JSON/버전1/상태 검증·크기/구조/원본 fingerprint 제한을 구현한다. export는 fileHandleKey도 제외한다. Launcher IMPORT_SESSION은 새 세션 ID/revision0/빈 receipts로 strict 생성하며 발표 선택을 null로 만든다. 지난 위치와 비공개 편집을 보존하되 다른 세션의 native handle 권한을 이식하지 않는다. version1 이전 실제 파일 버전은 없으며 알 수 없는 버전은 자동 변환하지 않는다.

타입 검사만으로 가져온 JSON의 안전성을 가정하지 않는다. 지원 안 되는 버전은 작업 상태를 변경하지 않고 오류를 알린다. 이후 버전 변경은 migration과 이전 fixture 복원 테스트를 함께 추가한다.

현재 종료 외부 요청은 `CLOSE_CURRENT_DOCUMENT`, 전체 종료는 `CLOSE_ALL_DOCUMENTS`이다. 전체 요청의 정확한 필드는 type/sessionId/revision/commandId/choices/blobUrl이며 choices는 최대16개 고유 열린 documentId와 saved/without-backup/unchanged 결정이다. saved가 없으면 blobUrl=null이다. Remote만 허용하며 raw SESSION_COMMAND 종료 우회는 거부한다. 내부 `CLOSE_DOCUMENTS`는 documentId/slideId=null, 승인 documentIds만 받는다. 결과는 kind=close-all/revision/results(documentId/state=closed|kept/error)이며 부분 결과를 전체 성공으로 해석하지 않는다. strict commit 후에만 배포하며 Editor 초안/원본/델타 삭제 없이 closed로 표시한다. `ExportResult.complete`는 실제 파일 저장 경로의 완료가 확인된 결과만 나타낸다.
