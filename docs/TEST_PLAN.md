# 검증 계획과 ID

자료 인수 보조: `npm run check:materials`는 원본 파일명·크기·기준 출력 짝만 확인하고 본문은 읽지 않는다. 현재 1종/1짝이며 실제 10종 Visual·Media·Behavior 인수와는 별도다.

2026-10-14 자원 수명 검증을 추가했다: alias dedup, queued/preparing/cancelling/ready, lease 증가·최종 제거, snapshot 복사와 정보 제외를 unit으로 검사하고 실제 Whale source-sharing에서 두 시험 realm과 최종 해제를 확인한다. physical/model heap과 전체 origin 예산은 별도 후속 gate다. [계획](plans/2026-10-14-pptx-resource-inventory.md).

IMPL-T-28/BORROWED-URL-01: sourceOwnership/borrowedMediaUrl/runtime unit은retain/finalrelease·released재입장·live/ownership/ref변경·stablefactory/settings를검사한다. actualembedded는nativeDOM/reprepare/crop/source5/취소/복구,source-sharing은부모해제뒤nativeowner/finalrawURL,entry-limit은model/nativeURLcount·bytes불변과기존WorkingSet기준을검사한다. [결과](pptx/BORROWED_MEDIA_URL.md).

IMPL-T-28/SOURCE-CANCEL-01:sourceVaultCancellation.unit의cached/handle/File/validator/broadcast/close/다른소비자·새연결보호와actual prepared-scene Remote준비/nativequeue취소·PDF/WAV진행·읽기0/Worker0를검사한다. source-sharing은identity/vault까지5종nativequeued취소를확인하고저장/PDF/native/corpus제품회귀를따로한다. [결과](pptx/SOURCE_CANCELLATION.md).

IMPL-T-28/PREP-ADMISSION-01: preparationAdmission.unit은native요청명/options·preabort/queued·입장직전취소/active실제완료·API부재/실패retry/grant부재를검사한다. source/import/inspection기존unit은gate를명시대역처리한다. source-sharing의admission probe는actual native2popup·4경로queued읽기0/Worker0·3종취소·File실제결과전달보류·invalidZIP실패/창닫힘release·API부재/원본/현재PDF를확인한다. 단일WorkingSetFAIL과validator대기취소/물리/충실도는별도다. [결과](pptx/PREPARATION_ADMISSION.md).

IMPL-T-28/PRIVATE-BUFFER-01:privateBuffers/assetModel/duplicate/largeMedia/mediaIdentity unit은소비opt-in·default보존/alias·API부재/실패·Blob/File보존·hash/size·header/digest실패재시도를검사한다. entry-limit은종류별WorkingSet/PrivateMemory·Runtimebacking/embedder와자산해제뒤1/5초를관측하고기존기준FAIL을보존한다. 실제내장coexistence는native12초합성영상으로자연종료와강제정지를분리하고동일DOM·미디어재생·효과조건을유지한다. [결과](pptx/PRIVATE_BUFFERS.md).

IMPL-T-28/DUPLICATE-PARTS-01: DuplicateImageParts.unit은 exact 바이트/형식·동일크기 다른 bytes·취소/소유권/오류·stream/전체 Blob 복사 금지를 검사한다. 실제 source-sharing은 raw 해제량/backing/최종 owner·현재PDF/원본, embedded-media는 해제 근거의 누락/해시·크기/raw변조 거부와 실제 native 타이밍을 검사한다. entry-limit 성능 FAIL과 화면 충실도·물리 인수는 분리한다. [결과](pptx/DUPLICATE_PARTS.md).

IMPL-T-28/INFLIGHT-01:SourceOwnership.unit은동시1회/예약owner·개별취소·전체abort/늦은결과·실패재시도·발행후전달전재입장을검사한다. verify-whale-pptx-source-sharing은제품모듈/실제nativeWorker·동시1회·소비자/작업취소·자산수명·현재PDF/원본hash를확인한다. productRendering=false를명시하고실제렌더/메모리/물리인수와구분한다. 새대용량FAIL/기존제품/최종준비범위는[기록](pptx/INFLIGHT_SOURCE.md).

IMPL-T-28/SOURCE-REUSE-01: SourceOwnership/unit의 문서/쪽 lease 해제, mediaIdentityCache/unit의 정확한File·반환복사/형식·크기/실패, embeddedMedia/unit의 동일Blob·ownership/교체·취소격리/실패재시도를 검사한다. entry-limit --media64는 실제parser/전체읽기 횟수·native buffered/URL bytes/단계WorkingSet을 기록하고 parser1/MP3읽기1과기존1.5GiB 실험기준을확인한다. 내장회귀는성공hash재사용이후에도nativemetadata오류/길이검사·세션보존을검사한다. [결과·한계](pptx/SOURCE_REUSE_MEMORY.md).

IMPL-T-28/TRANSITION-ADMISSION-01: pptxTransitionAdmission.integration은 strict IDB의 raw3종/닫힘·legacy receipt/늦은revision·거부 무변경/pending 보존·COMMIT/PPTX 자동 넘김/PDF를 검사한다. 실제 prepared-scene/degradation에서 직접 명령 거부·화면/재생 보존과 정상 Remote UI를 확인한다. owner/checkpoint는 수동 metadata 계약이며 실제 준비와 구분한다. entry-limit --media64의 단계/전체 프로세스 WorkingSet 관측은 두 실행 기준 초과를 보존하고 성능 FAIL로 판정한다. [결과](pptx/TRANSITION_ADMISSION.md).

IMPL-T-28/TRANSITION-SCENE-01: preparedScene/unit의 runtime/native readiness·취소/deadline·정착된 효과 상태, owner.integration의 비취득 조회를 검사한다. verify-whale-prepared-scene은 PDF/동일 음원·worker/응답 유실·같은 DOM·새 owner·누락/재연결/닫힌 명시 쪽, degradation은 숨김/취소/늦은 결과/미지원·5 화면, embedded-media는 동일 native video/play0/cursor5를 검증한다. 수동 presentation-transition은 parser를 보류한 계약 시험으로 실제 준비와 구분한다. 직접 명령 차단·물리/성능·전체 충실도는 남는다. [결과](pptx/PREPARED_SCENE.md).

IMPL-T-28/TRANSITION-COMMIT-01: presentationTransition/unit과playerOwner.integration은요청/취소·실패/늦은결과·원자commit/닫힌자료·source-v1표식·critical경합·strict record/구형/backup복구·receipt/CAS/저장실패·owner잠금을검사한다. verify-whale-presentation-transition은제품RPC/strict DB·worker재기동중현재PDF·무음WAV진행/역할·현재/새owner거부·중복commit·노트없는목표조회·새backup수업pending제거를검증한다. 실제표면staging/입장차단·물리/원본충실도/장시간은후속인수다. [결과](TEST_RESULTS.md).

IMPL-T-28/TRANSITION-01: pptxTransition/unit은목표ID·지문/발표선택/완료checkpoint경합·취소/최신revision·명시쪽원자ACTIVATE·닫힘/없는쪽거부를검사한다. transitionReadiness/unit은분리기존runtime의쓰기/재생금지·cleanup·취소를검사한다. actualWhale degradation은준비중취소/늦은결과·미지원활성화/이전쪽의무commit·기존PDF픽셀/세션·정상쪽직접발표/5화면,교사/내장은실제준비UI·source-v1 완료위치와revision수락을확인한다. 직접명령입장/Player준비commit·대안PDF연결/물리·대용량성능은별도남은인수다. [결과](TEST_RESULTS.md).

IMPL-T-27/BG-REF-01: 순수selector의0/1000·일반1..999/배경1001..·범위오류와고정source hash/변환지점/원본불변을unit검사한다. 실제Whale제품distWorker합성10종은verify-whale-pptx-background,원본teacher-02전체52쪽·배경표본/기준PDF차이/원본hash·독립선택은verify-whale-pptx-visual로검증한다. 잘못된참조의흰색fallback거부와MIT변경고지/Worker marker도확인한다. 원본앱/최종충실도/물리인수는분리한다. [결과](TEST_RESULTS.md).

C-PREFLIGHT-FONT-01/IMPL-T-27: pptxLocalFonts.unit의64종·theme/깨진값제외/실패/API부재·deadline/취소/늦은결과/quoted local·폰트문서미추가와PPTXimport의원본보존/재연결미검사안내를검사한다. 실제Whale local명/한글별칭과제품등록경고·파일점검취소/timeout・학생PDF픽셀/세션불변/5화면을verify-whale-pptx-visual/inspection/player로검증한다. 실제원본font적용·상속theme/embedded/glyph/license/물리・최종충실도와분리한다. [실행결과](TEST_RESULTS.md).

2026-10-13 실제 브라우저의 비동기 상태 검사는 runtime 응답을 Node에서 명시적으로 await하고 목표 snapshot/checkpoint 값을 폴링한다. 설치 Playwright의 waitForFunction(async ...)는 Promise 자체를 참으로 처리하므로 완료 근거로 사용하지 않는다. DOM 동기 조건만 waitForFunction에 전달한다.

X-04 Editor 구조점검: 실제dist·로컬teacherFile input·원본XML순서/한도/타이밍·미확인구분,검사전후teacher session/공개Player snapshot/실제발표PDF 전체Canvas SHA256 불변. 새파일오류·키보드취소/native Worker terminate·늦은결과폐기와5viewport 캡처를확인한다. OSchooser/물리CPU중취소·PPTX발표충실도는별도. [명령/결과](pptx/EDITOR_INSPECTION.md).

X-04 Worker SVG: 실제 Whale에서 office Worker 전페이지 renderSlideToSvg hash와 본 화면의 독립 렌더 hash/고유 페이지 수를 대조한다. 교사23쪽 및 합성3쪽 일치, 선택4쪽/합성3쪽 Blob 이미지 decode·URL 정리 PASS(TEST_RESULTS08:15,345tests/check). 같은 엔진 대조이며 원본 시각 충실도·픽셀/효과 재생·제품 연결은 별도이다.

X-04 후보 Worker/효과: 전용 module Worker에서 고정 후보를 실행하고 DOM/DOMParser 부재·페이지 수·효과 요약을 본 화면과 대조한다. 별도 원본 XML presetClass count도 비교한다. 교사23쪽의12단계/합성3쪽0단계에서 office PASS, aiden model DOMParser 부족 실패(TEST_RESULTS08:11). 효과 재생·전체 모델 transfer·Worker 렌더·지원 승격은 별도 검증이다.

X-04 ZIP Worker: pptxWorker.test.ts10개로 성공·원본 사본·timeout/취소/late reply·Worker/message/transfer 오류·결과/입력 계약과 cleanup을 검증한다. 실제 Whale/CSP에서 module Worker ready 후 강제 CPU 지연→timeout100ms/취소50ms·메인 interval 진행, 정상 ZIP·원본 buffer 유지·손상 ZIP 코드와 교사23쪽/미디어 회귀를 확인했다(TEST_RESULTS08:04,345tests/check). XML/후보 parser·15초 실제 부하·대용량 메모리는 별도 시험이다.

X-04 콘텐츠 타입: pptxContentTypes.test.ts18개로 default/override·중복/경로/위험 MIME·누락·타입 불일치·다섯 형식 초기 헤더·미검증/잔여 선언 분류를 확인한다. 실제 Whale DOMParser 공격5개 거부와 teacher-01(헤더81/미검증1)/canonical media(헤더5/잔여 override2)의 기존 렌더·무음 재생을 확인했다(TEST_RESULTS08:00,335tests/check PASS). 전체 파일 파싱·재생·원본 충실도는 별도 인수이다.

X-04 관계 대상: pptxRelationships.test.ts 24개 단위 테스트로 정상 상대/루트/fragment/encoded 공백과 위험 경로/외부 URI를 검증한다. 실제 Whale의 DOMParser에서 정상 내부 관계·외부 위험 개수 및 오류 코드별 거부 6개를 확인한다. 교사 23쪽 관계192와 canonical 미디어 관계35의 기존 렌더/무음 재생 회귀 통과(TEST_RESULTS 07:55). ContentTypes·signature/CPU 격리·제품 실행 권한 및 원본 충실도는 별도 시험이다.

X-04 ZIP/XML: pptxPackageGuard.test.ts15unit,기본한도/경로9/case중복/과대XML·압축비/active/필수part·빈/손상/취소. compare actualWhale DTD/script/malformedXML거부·외부relationship개수(주소비노출),teacher-01과canonicalmedia공통검사후기존행동회귀.293tests/checkPASS(TEST_RESULTS07:48).CRC/암호화/header·관계대상/시간격리/fullXML보안은별도.

X-04 canonicalaudio: DOMParser audiorelationship→audioFile1개,XMLSerializer/ZIPmtime고정·동일variant hash·audio1/video1모델·MIMEkind일치/원본mediahash·actualWhale AUDIO/VIDEO play/time.278tests/check·nativePASS(TEST_RESULTS07:44). 합성전용변환을일반파일수리/안전검사로사용하지않는다.

X-04 media: 합성3쪽WAV/MP4,PptxGenJS videoFile/audiorelationship불일치자료·모델분류/native요소·play/time/duration,office2개원본hash·MIME대응hostAUDIO/VIDEO실행. actualWhalePASS(TEST_RESULTS07:41).스피커·효과/자료전환/Player명령/checkpoint·canonical음원/실제코덱은별도.

X-04/SPIKE-T-04 teacher-01: optional원본경로를메모리route로만공급/23쪽순회·현재imgdecode/오류callback/외부요청·원본hash불변, 일부1/3/15/23쪽시각비교.278tests/check및actualWhalePASS(TEST_RESULTS07:37). PPTX전체supported/효과·원본충실도PASS아님,기준PowerPoint/10실제종·합성media후속.

C-PREFLIGHT-06: browser unit 렌더완료수/실패 재시도·cleanup, pure report 실제렌더/fidelityunknown. foundation actualWhale 8/8 Canvas 문구 assertion/bitmap+Helvetica/상태보존·380px 직접확인. X-04/SPIKE-T-04: verify-whale-pptx-spike 두 고정배포본/SHA512·MV3 CSP·합성동일입력·이미지decode/텍스트/표/이동 및 실패기록.278tests/check PASS(TEST_RESULTS05:26), 실제교사10종/원본pixel·media/behavior·보안/성능/최종offline는 별도.

C-PREFLIGHT-05: tests/unit/preflightCache.test.ts key/범위/hash/environment·LRU/TTL·clone/개인정보배제4개, preflightBrowser 접근재검사/cachehit/force1개. foundation actualWhale scope분리/hit/force·coldsourceerror/상태보존/380px PASS(TEST_RESULTS05:15). 영속cache·실물benchmark/원본시각비교 별도.

C-PREFLIGHT-04: preflight.unit 전체1..count·미검사중간링크·범위/충실도unknown/잘린결과거부, foundation actualWhale 부분2/8링크1/전체8/8중간쪽링크2·draft/세션불변·취소/380px PASS(TEST_RESULTS05:11). 대용량/2000쪽·원본pixel/font/이미지·환경cache 별도.

C-PREFLIGHT-03: tests/unit/preflightBrowser.test.ts Map action·annotation/cleanup, tests/fixtures/createPreflightPdf.mjs Link+문서JavaScript, foundation native WAV/MP4 metadata·cold missing/error/세션불변.269tests/check·actualWhale PASS(TEST_RESULTS05:07). 전체action/annotation·코덱decode/실물·완전offline 별도.

C-PREFLIGHT-02: tests/unit/registrationPreflight.test.ts 신규count/unknown·재연결·invalid3개 및foundation 실제Whale 등록결과/다른원본실패성공결과없음·동일재연결/세션불변/380px PASS(TEST_RESULTS05:02). 전체시각충실도/정밀·환경cache·offline는별도.

C-PREFLIGHT-01 / PRD§8: 부분검사/네범주·미확인정직성, 원본missing/hash/pagecount·scripts/links경고·media길이/취소·private불변. tests/unit/preflight.test.ts 6개 및 foundation 실제Whale PDF 결과/취소·노트초안/Player불변/380px PASS(TEST_RESULTS04:59). 실물/고급PDF·실제미디어점검·정밀/환경캐시/등록연계·coldoffline 별도.

B-TIMER-SOUND-01 / FR-016: sound 설정·시간유지, completed epoch만 claim/Playerowner/strict실패·dedup·늦은회차·백업지난알림억제, AudioContext 두음/거부close·수동재시도. tests/unit/timers.test.ts·timerSound.test.ts/integration/timers.test.ts와 verify-whale-timers 실제Whale(첫거부대역/후속native) PASS(TEST_RESULTS04:53). 실제스피커/절전/crash audible전달 별도.

B-TIMER-01 / FR-016/004/006: 수업 countdown/stopwatch·자료별 분리, A/B 전환 자료만 정지·경과 보존, Editor 독립, Remote닫힘 진행, Player 소유권/epoch/revision/deadline 완료, strict 실패·중복·새Hub, exportedAt 백업 경과. tests/unit/timers.test.ts·tests/integration/timers.test.ts·scripts/verify-whale-timers.mjs 실제Whale PASS(TEST_RESULTS04:43). 소리·위치/물리focus·절전 별도이며 전체 FR-016 미완료.

B-PLAYER-OWNER-01 (FR-004/005/006): playerOwner integration6개로 exactmetadata/동시claim·재생성·소유부재승계/다른수업·역할·documentId/조회·저장실패/strictabort rollback을 검사한다. actualWhale foundation은 중복Player 검정/미디어·PDF없음·직접ADVANCE/PLAY/CHECKPOINT거부, nativeCDP worker stopped→running + WAV시간계속/owned유지·중복거부, 원래창닫힘승계/세션불변을 검사한다. duplicate380px 및 worker-restart.json이 보조 증거다. renderer/browsercrash·5분physicalfocus·재생종료tail·편집pause는 별도 인수다.

B-MEDIA-CONTROLS-01 (FR-004/005/006): mediaControls unit/integration 테스트로 exact playback/구간·음량·명령역할/target·revision·epoch/positionEpoch/정지·재생 seek/trim끝·자동 넘김/정지 백업/strict commit·중복·실패를 검사한다. foundation actualWhale 시험은 WAV3~5초 구간/1%음량·음소거/시작점에서0.1초 이상 pausedseek/구간종료→A2와 ended보존, MP4 재생중 음량만 변경·회차와 위치유지,380px 조작 화면을 검사한다. 영상 구간·실물·실제소리·장시간/다중Player는 별도다.

B-LOCAL-VIDEO-01 (FR-004/005/006): `verify-whale-video-spike.mjs`로 실제 Whale native H.264 MP4 fixture를 먼저 생성한다. 이어 `verify-whale-foundation.mjs`가 실제 Editor 입력/hash/길이·Player 해상도/흰색 픽셀/녹색·빨간색 프레임 변화·Remote 정지와 durable 위치·자료 교차 복원·Remote 닫힘 진행·자연 종료·비공개 상태 유지 및1366/380px를 검사한다. 준비 실패 시 video-diagnostic.json을 보존한다. 다른 코덱/실물·소리·장시간focus·trim/volume/seek·lease는 별도 인수다.

B-MEDIA-AUTOPLAY-01 (FR-005/006): mediaAutoplay.test.ts로 현재 회차의 전체 미디어 ended/paused/길이·없는 미디어 null/두 조건의 순서/새회차 반복/gesture 연결/정지·재개를 검사한다. verify-whale-foundation.mjs는 Remote 설정→실제 WAV nativeended→A2 및 결합 모드5초 대기·노미디어 다음페이지정지/380px/전체회귀를 검사한다. 실제 다중미디어·영상·소리·장시간focus·단일Player·편집pause는 후속 인수다.

B-LOCAL-MEDIA-01 (FR-004/005/006): localMedia.test.ts로 bounded ref/header/hash/validator재연결·private field 제외·register/play/pause epoch·late/inactive tail·ended/restore/역할·prototype 키를 검사한다. verify-whale-foundation.mjs는 실제 EditorWAV 연결→대역 autoplay거부/Player gesture/native decode·currentTime 증가/Remote닫힘→교차자료 lastposition·paused복귀→native ended 및380px를 검사한다. video 픽셀/다른코덱/스피커·OS정책거부/handle coldrestart·다중Player/trim·volume·seek UI/media-end 자동넘김/5분focus는 별도다.

B-AUTOPLAY-EXEC-01 (FR-004/005/006): autoplayCommands.test.ts 및 autoplayExecution.test.ts는 현재 target·epoch·revision/경과·paused·미지원 모드 거부/범위·반복·terminal/설정 상속/공개 정보/strict commit·중복·실패·늦은 예약을 검사한다. verify-whale-foundation.mjs는 actual Remote1초 설정·Player 범위 반복·Remote 닫힘 후 진행·재접속 정지·다른 수업 차단/380px를 검사한다. 실제 미디어/편집pause·단일Player lease·물리5분focus·지연렌더/오프라인 장시간은 별도 인수다.

B-PLAYBACK-STATE-01 (FR-004/005/006): autoplay.test.ts는 우선순위/경과시간/시간과 미디어 모두 종료/범위·슬라이드·자료 반복·invalid 대상/교차·동일 자료/Editor 독립/수동 이동/백업 정지 복구를, playbackCheckpoint.test.ts는 strict DB/CAS 실패·중복·재접속을 검사한다. verify-whale-foundation.mjs는 전용 DB 합성 running metadata의 실제 worker A-B-A 정지·위치 보존/Remote 닫힘/정상 프로세스 재실행을 검사한다. Player 실행과 미디어 실파일·자동재생거부·5분 다른 앱 focus·중복 Player 권한·편집 pause는 후속 인수다.

B-QUICK-EDITOR-01: tests/integration/quickEditor.test.ts/background.test.ts로 exacttarget/revision/receipt/public응답·raw권한차단·sender수업검사, verify-whale-foundation.mjs로actualPlayer우클릭/합성longpress/currentEditor·창재사용·draft/발표불변을검증한다. 물리touch/IME/듀얼모니터배치/window·DB실패/focus인수는별도다.

B-PDF-COPY-02: PDF 저장/chooser gesture/draft잠금/captured revision·후속변경/생성취소/newempty·write-close-readback/owndownloads·세션journal분리/가리개redaction경고를 검사한다. localFile.test.ts와 verify-whale-foundation.mjs의 actual extension+CSP/nativeOPFS/기존파일거부·취소·snapshot동일·별도NodePDFreader/정상재시작이 현재 증거다. nativechooser/downloads/native외부뷰어는 별도 수동인수다.

B-PDF-COPY-01: writer source hash/page count/overlay/private·snapshot·cancel/원본bytes불변, viewport crop/rotation/UserUnit 행렬/PNG한도는 pdfCopy.test.ts; 실제 fonts/한글·mask·pen/4회전/crop/독립PDF.js검색text·픽셀·PC fixture는 verify-pdf-copy-spike.mjs. UI 저장/strict출력readback/extensionCSP/native외부뷰어/OSchooser/downloads/실물교사PDF는 후속이며 개발원점실험을 최종export인수로 확대하지 않는다.

B-ALL-CLOSE-01: 정확한 열린 scope/역할/중복/revision, saved/unchanged/without-backup 자료별 선택, 부분 성공·전체 실패·현재 실패 유지/현재 성공 검정대기, session timer 전체 종료 pause, CAS 경쟁/abort rollback, 취소·남은 자료 재확인·새 백업 검증·Editor 초안·정상 재시작을 tests/integration/allClose.test.ts 및 verify-whale-foundation.mjs로 검사한다. OS chooser/downloads/보이는 창/영구 정리/PDF 복사본은 별도 인수다.

B-CURRENT-CLOSE-01: saved/unchanged/without-backup/취소·변조·CAS·transaction abort, 현재만 closed/null 발표, 다른 자료/두 Editor 초안/선택/델타 유지, bookmark/document timer 정지, 이전 schema, 명시 재개/정상 재시작을 tests/integration/currentClose.test.ts 및 verify-whale-foundation.mjs로 검증한다. 전체 종료/영구 삭제/실제 OS chooser/downloads/미디어는 별도 인수다.

B-BACKUP-VERIFY-01: teacher-only own Blob URL/stream16MB·30초/UTF-8·버전/sessionId·revision·전체 확정 상태/완료 저널 hash·bytes 대조, 확인 도중 다른 연결 변경, 무변경·비노출·정상 재실행. 실제 Whale 시험은 verify-whale-foundation.mjs의 OPFS 생성 출력·시험용 PC fixture 선택·변조 거부/380px를 따른다. OS chooser와 실제 downloads, 종료 draft 동결/CAS는 별도 인수다.

현재 자동 검증은 기반 창 메시지·sender·오류 경로 및 MV3 산출물 검사이다. 아래 제품 인수 항목은 후속 기능을 구현한 뒤 실행한다.

## 원문 §15 인수 테스트

| 테스트 ID | 실행 절차 | 합격 판정 |
|---|---|---|
| AT-01 | PDF1 5→PPTX1 2→PDF1 복귀 | PDF1 5쪽, 노트·오버레이 유지 |
| AT-02 | 두 모니터에서 다른 앱 사용 5분 | Player 표시 및 지원 미디어 재생·자동넘김 유지 |
| AT-03 | 리모컨 닫았다 다시 열기 | Player 끊김 없이 리모컨 현재 상태 복원 |
| AT-04 | Player PDF 5쪽 상태에서 Editor PPTX 8번 수정 | 청중용 PDF 5쪽 그대로, 나중에 PPTX 8번 수정 표시 |
| AT-05 | 검정 글자 우클릭 | 클릭 검정/주변색 중 선택할 수 있음 |
| AT-06 | 검정 배경 글상자 선택 | 기본 글자 흰색, 사용자 변경 가능 |
| AT-07 | 좁은/넓은 상자에 동일 문구 입력 | 가로·세로 모두 만족하는 최대 글씨 크기 적용 |
| AT-08 | 최소 글자 제한보다 작은 크기가 필요한 문구 입력 | 자르지 않고 경고, 제한 무단 위반 없음 |
| AT-09 | 글상자 모서리 드래그 | 상자 크기 변경 및 자동 크기 재계산 |
| AT-10 | 자동 넘김 중 글상자 편집 | 설정된 정책대로 일시정지/재개 |
| AT-11 | 현재 자료 종료 후 다른 자료 확인 | 현재 파일만 닫힘, 나머지 상태 유지, 검정 대기 화면 |
| AT-12 | 여러 자료 수정 후 일괄 종료 | 수정된 자료만 저장 대상으로 표시, 파일별 선택 가능 |
| AT-13 | 복사본 저장 후 원본 비교 | 원본 해시 동일, 복사본 열림 확인 |
| AT-14 | 저장 대화상자 취소/저장 실패 | 자료 종료 취소 또는 복구 가능, 수정 데이터 유지 |
| AT-15 | 웨일 비정상 종료 및 재시작 | 가장 최근 자동 복구 시점의 수정 내용 복원 |
| AT-16 | Canva 링크 열기/전환/복귀 | 원본 웹 발표 재진입과 지원 기능 상태 명확히 표시 |
| AT-17 | Miricanvas 로그인 안 된 링크 | 실패 이유 및 원본 서비스 로그인/권한 안내 |
| AT-18 | 모니터 2 연결 해제 | Player가 보이지 않는 화면에 고립되지 않음 |
| AT-19 | 영상·음원이 여러 개인 PPTX | 지원 항목만 재생/제어, 미지원 항목은 명확한 경고 |
| AT-20 | 여러 폰트로 글상자 내보내기 | 미리보기·실제 발표·결과물 표시 차이 기록/대응 |

## 원문 §19.12 구현 테스트

원문의 T-*를 IMPL-T-*로 이름만 구분했다. 원문 §13의 기술 조사 T-*는 SPIKE-T-*이다.

| ID | 테스트 | 기대 결과 |
|---|---|---|
| IMPL-T-01 | 런처 클릭 | 별도 설치 서비스 없이 시작 메뉴 표시 |
| IMPL-T-02 | PDF 2개 추가 | 원본 중복 업로드 없이 목록 등록 |
| IMPL-T-03 | A.pdf 5→B.pdf 2→A.pdf | 마지막 페이지 5로 복귀 |
| IMPL-T-04 | Editor에서 비활성 PDF 8쪽 편집 | 발표 중 PDF 5쪽 화면 불변 |
| IMPL-T-05 | 같은 페이지 Player 글상자 수정 | 편집 확정 후 학생 화면 반영 |
| IMPL-T-06 | 검정색 글자 위 우클릭 | 검정/주변 색상 두 후보 선택 가능 |
| IMPL-T-07 | 검정색 배경 선택 | 글씨 기본 흰색 |
| IMPL-T-08 | 드래그 영역 지정 후 긴 문구 입력 | 글상자 고정, 가능한 최대 글자 크기 |
| IMPL-T-09 | 최소·최대 폰트 제한 | 범위 준수, 미수용 시 경고 |
| IMPL-T-10 | 모서리 크기 조정 | 상자 좌표 변경 및 자동 폰트 재계산 |
| IMPL-T-11 | 강제 새로고침/리모컨 재시작 | 데이터 상태 복원, Player 중단 없음 |
| IMPL-T-12 | 다른 앱 활성화 중 지원 영상 재생 | 소리와 영상 정상 유지 |
| IMPL-T-13 | 다른 앱 활성화 중 자동 넘김 | 지정한 시간에 전환 진행 |
| IMPL-T-14 | 다른 자료로 전환 | 이전 자료 미디어 일시정지, 복귀시 타임코드 보존 |
| IMPL-T-15 | 개별 종료 | 대상만 닫히고 다른 자료는 유지, 학생 화면 대기 |
| IMPL-T-16 | 일괄 종료 | 열린 자료 전체의 dirty 정보 목록과 선택 저장 |
| IMPL-T-17 | 결과 PDF 복사본 다운로드 | 실제 PC 파일 생성, 원본 파일 미변경 |
| IMPL-T-18 | 편집정보 파일 다운로드/재불러오기 | 원본 재연결 후 글상자/판서/노트 복구 |
| IMPL-T-19 | 저장 실패(권한 거부) | 작업 상태 유지, 완료로 오표시하지 않음 |
| IMPL-T-20 | 이름 중복 파일 저장 | 기존 파일 덮어쓰지 않음 |
| IMPL-T-21 | 캔바 링크 열기(W0) | 원본 웹 발표가 관리형 창/탭에서 열림 |
| IMPL-T-22 | 미리캔버스 링크 열기(W0) | 원본 웹 발표가 관리형 창/탭에서 열림 |
| IMPL-T-23 | 두 웹사이트의 슬라이드 수 미확인 | 가짜 번호/썸네일 표시하지 않음 |
| IMPL-T-24 | 웨일 다중 모니터 출력 변경 | 창 이동/복구 또는 수동 대안 제공 |
| IMPL-T-25 | 원본 PDF 삭제/이동 뒤 재불러오기 | 파일 재연결 UI 및 데이터 유실 없음 |
| IMPL-T-26 | 브라우저 캐시 삭제/확장 제거 대비 | 정식 로컬 편집정보 파일로 복구 가능한 안내 |
| IMPL-T-27 | 용량이 큰 PPTX 미디어 로드 | 캐시 상한 확인, 렌더 실패 시 안내와 Player 복구 |
| IMPL-T-28 | PPTX 호환 불가 효과 | 미지원/부분 지원 표기, 강제 가짜 효과 금지 |

## 검증 계층

- 단위: 순수 core 전환/명령 검증, 오버레이 좌표와 글씨 맞춤, autoplay 우선순위/deadline, 저장 결과 판정. 구현된 영역에 추가한다.
- 통합: 브라우저 API mock, durable commit 실패/재연결, save 취소/실패, import/export 검증.
- 브라우저: verify-pdf-browser.mjs로 실제 합성 PDF·Canvas 폰트·draft/확정·실패 재시도·독립 선택·빌드 CSP·5 viewport를 보조 검사한다. IME는 합성 composition 이벤트이며 실제 키보드/Whale 확장 E2E는 미실시다.
- 실기기: Windows 웨일, 단일/듀얼/복제, HDMI 해제, 5분 외부 앱 포커스, 실제 PC 다운로드/원본 해시/외부 뷰어. tests/manual/WHALE_CHECKLIST.md 사용.
- 후속: macOS, PPTX 10종 이상, 큰 파일(100MB+ 포함), 폰트 누락, 오프라인, 터치/키보드.

핵심 상태 전환과 실제 글씨 맞춤 단위 테스트는 원문 §19.12의 필수 항목이다. 성능 수치는 Phase 0 실측 후 정하며 근거 없는 보장 수치를 만들지 않는다. 결과에는 테스트 ID, 환경, 샘플/해시, 방법, 실제 결과, pass/fail/미실시, 제한을 기록한다.
