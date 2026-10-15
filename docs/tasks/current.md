# 인수인계: PRD v5 제품 완성 및 개발 방향 점검
> **현재 상태 스냅샷 (2026-10-16 KST, 재개 시점)**
> - 실제 자료: `test-materials/originals` PPTX 10종, `test-materials/powerpoint-reference` 기준 PDF 10종 (`sourceCount=10`, `pairedCount=10`).
> - 자동 검증: 103개 테스트 파일 / 1,424개 테스트, TypeScript·Vite·MV3 빌드 PASS.
> - 실제 Whale: foundation 회귀 PASS (`1792024920122`), 2쪽 전체 시각 비교 실행 완료 (`1792025180795`)이며 종횡비 불일치 페이지를 자동 기록하지만 충실도는 `unverified`.
> - 남은 인수: PowerPoint 기준 3축 전체 비교, 물리 메모리·성능 예산, cold-offline·장시간·실제 물리 환경. 제품 완료와 PPTX `supported` 승격은 보류.

## 2026-10-16 — Downloads 새 자료 inspection 및 검증기 보정

- 대응 PDF가 없는 새 실제 자료 `C:/Users/서정완/Downloads/(12~14쪽)구글 렌즈로 보물 찾기.pptx`를 corpus에 복사하지 않고 별도 inspection했다. 결과 profile `1792083126421`: 3쪽·64요소 모델, private preview 3쪽, 5 viewport overflow 없음, 외부 요청 0, pageErrors 0, 원본 hash·세션·학생 canvas 보존.
- 첫 실행은 검증기의 0-based 쪽 선택 오류로 마지막 쪽에서 다음 버튼을 눌러 중단됐다. 검사기를 중간 쪽 선택으로 수정한 뒤 재실행해 PASS했다. 전체 check도 PASS했다.
- 갱신: 2026-10-15 08:38 KST / 도구: Codex

## 2026-10-15 최신 실제 Whale 재검증

- 숫자 회계 정규화 후 `whale-pptx-source-sharing/1792020367211/result.json` exit0. Whale5.39.412.57 실제 teacher-01 23쪽에서 source/native/final 수명 집계, 두 popup logical asset 합11,769,768bytes, queued 5종 취소·재시도·창 종료, 현재 PDF/세션 보존과 원본 hash 불변을 확인했다. `physicalMemoryBytes/modelHeapBytes=null`, `productRendering=false`다.
- 실제 전체 origin byte 한도나 물리 WorkingSet 해결로 확대하지 않는다. 다음은 PRD §25의 실제 자료 10종·PowerPoint 기준 출력 3축 및 cold-offline/물리/장시간 증거를 확보하면서 current/ready/pending reservation을 설계하는 작업이다.
- `npm run check:materials` 재실행 결과 `sourceCount=1`, `pairedCount=1`, `고요한 우연(1).pptx=98,050,517 bytes`다. 저장소의 실제 자료는 아직 1종과 대응 기준 PDF 1종뿐이며, 합성 fixture나 64 MiB 개별 미디어 한도를 다중 세션 총합 인수로 세지 않는다.
- `scripts/dev.ps1 check` 08:32:04 exit0: 스킬·자료 짝 검사, 103파일/1,420tests, TypeScript/Vite 빌드와 MV3 산출물 검사를 다시 통과했다. 실제 Whale 재실행은 이번 문서 확인 범위에 필요하지 않아 기존 source-sharing 증거를 유지한다.
- W0 위치 전용 링크 등록 경계(`knownSlideCount=null`, 빈 `slideIds`)와 회귀 1건을 추가했다. `scripts/dev.ps1 check` 08:33:04 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS. 실제 Whale foundation `profile-1792020795350`도 exit0 PASS; 기존 학생 화면·원본 보존/미디어/종료 회귀를 유지했다. W0 링크의 외부 탭·발표 승격은 의도적으로 미구현이다.
- Editor에 Canva/미리캔버스 링크와 이름을 검증해 위치 전용 세션 자료로 등록하는 접이식 UI를 연결했다. 등록은 기존 revision/REGISTER_DOCUMENT 경로를 사용하고 현재 발표 선택을 건드리지 않는다. 전체 check는 08:34:18 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS. W0 외부 탭·실제 로그인·발표 승격의 Whale 인수는 아직 미실시다.
- 외부 링크 자료가 자료 선택 목록에서 UUID 대신 저장한 제목으로 표시되도록 Editor 표시 경계를 수정했다. `scripts/dev.ps1 check` 08:34:41 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS. 링크 등록은 여전히 위치 전용이며 발표 선택은 null이다.
- WebLinkControls에 Editor unmount/전환 시 AbortController 취소를 연결했다. 늦은 링크 등록 응답이 수업 상태를 갱신하지 않으며 현재 발표 자료를 유지한다. `scripts/dev.ps1 check` 08:35:11 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS.
- 세션 ID 변경도 WebLinkControls 취소 경계에 포함했다. 수업 전환 중 이전 링크 요청의 늦은 성공을 차단한다. `scripts/dev.ps1 check` 08:35:33 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS.
- 선택한 W0 자료에만 명시적 `외부 자료 열기` 링크를 표시해 교사가 새 탭을 직접 여는 경로를 연결했다. 자동 실행·학생 화면 변경·발표 승격은 없다. `scripts/dev.ps1 check` 08:35:54 exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS.
- UI 변경 후 실제 Whale foundation `profile-1792020968729` exit0 PASS를 재실행했다. 세션/학생 화면·원본 보존, 미디어·종료·재시작·Player 회귀를 유지했으며 W0 외부 링크를 자동으로 열지는 않았다.
- 승인된 W0 링크가 IndexedDB 재연결 뒤에도 제목·빈 슬라이드·선택 null로 보존되는 통합 검증을 추가했다. `scripts/dev.ps1 check` 08:36:57 exit0, 103파일/1,422tests·TypeScript/Vite/MV3 PASS. 실제 Whale foundation은 UI 범위가 아니므로 직전 PASS를 유지한다.
- `docs/COMPATIBILITY_MATRIX.md`의 W0 상태를 저장·재연결·명시적 새 탭까지 `partial`로 정정했다. 실제 관리형 탭·로그인·권한·오프라인은 여전히 `unverified`다.
- `docs/TECH_SPIKES.md` X-08/X-09도 같은 부분 구현 상태로 맞췄다. 외부 서비스 인증·관리형 창은 사용자 계정과 실제 환경이 필요한 별도 인수이며, 자동 실행이나 권한 확대를 하지 않는다.
- WebLinkControls가 세션 전환 때 이전 수업의 URL·제목 입력을 초기화하도록 수정했다. 요청도 취소해 자료 간 입력 누출과 늦은 등록을 막는다. `scripts/dev.ps1 check` 08:38:02 exit0, 103파일/1,422tests·TypeScript/Vite/MV3 PASS.
- `npm run check:materials` 재확인 결과 `sourceCount=1`, `pairedCount=1`, `고요한 우연(1).pptx=98,050,517 bytes`다. 추가 실제 교사 자료가 없으므로 실제 10종 인수와 PPTX 지원 승격은 보류한다.
- 세션 전환 입력 초기화 변경 뒤 Actual Whale foundation `profile-1792021130487` exit0 PASS. 기존 학생 화면·원본 보존·미디어·종료·재시작 회귀를 유지했으며 외부 W0 서비스는 자동 실행하지 않았다.
- Downloads에서 실제 자료를 선별해 `test-materials`를 10종 PPTX/10종 기준 PDF로 확장했다. `npm run check:materials`는 `sourceCount=10`, `pairedCount=10`; 구조 메타데이터는 [TEACHER_CORPUS_10](../pptx/TEACHER_CORPUS_10.md)에 기록했다. 3종은 PPTX/PDF 페이지 수가 달라 충실도 통과로 세지 않는다.
- 실제 10종을 Whale source-sharing probe에 순차 입력해 10건 모두 `pass=true`를 확인했다. 각 결과는 실제 Worker·취소/재시도·최종 source 해제·현재 PDF/세션 보존·원본 hash 불변을 포함하지만 `productRendering=false`, 물리/model 메모리 null이다. 10종 Visual/Media/Behavior 기준 비교나 PPTX 지원 승격으로 확대하지 않는다.
- `고요한 우연(1)` 실제 Whale 제품 시각 대표 비교 1·26·52쪽이 `executionPassed=true`로 완료됐다(`whale-pptx-visual/1792021356653`). 첫 자료는 기준 PDF 종횡비가 720×540 도구 가정과 달라 assertion 실패했으며, 이를 충실도 통과로 세지 않고 도구/기준 출력 차이로 기록했다.

- 최신 teacher-02 실제 검증 `1792020469388`도 PASS했다. 52쪽·98,050,517-byte 자료에서 두 popup logical asset 합185,538,790bytes와 최종 source/jobs/bytes0, 원본 hash·현재 PDF/세션 보존을 확인했지만 physical/model 값은 null이고 성능 통과 근거는 아니다.

## 2026-10-15 W0 링크 저장 경계

- `src/core/webLinks.ts`와 세션 레코드 검증에 Canva/Miricanvas 일치 provider HTTPS URL 경계를 연결했다. 사용자명·비밀번호·port·fragment·교차 도메인·긴 URL은 저장하지 않는다. 외부 fetch/탭/권한은 추가하지 않았다.
- 최종 check08:30:18 exit0 **103파일/1,420tests·TypeScript/Vite/MV3/5스킬PASS**. W0 실제 탭 실행과 관리형 창 인수는 아직 미완료다.

- 영속 IndexedDB record 변조도 `INVALID_RECORD`로 거부하고 기존 PDF 세션을 보존하는 통합 검증을 추가했다. 최종 check08:30:18 exit0 **103파일/1,420tests·TypeScript/Vite/MV3/5스킬PASS**.

## 2026-10-14 20:28 최신 PPTX source 자원 인벤토리

- 이번 턴은 진행중 source의 queued/preparing/cancelling/ready 수명과 raw backing/owned Blob/URL/lease를 숫자로만 집계하는 `src/adapters/pptx/resourceInventory.ts`를 `sourceModel`에 연결했다. File/Blob/본문/파일명/지문은 보관하지 않으며 같은 source의 alias와 native retain은 중복 합산하지 않는다. [계획](../plans/2026-10-14-pptx-resource-inventory.md) / [근거](../pptx/RESOURCE_INVENTORY.md).
- check20:19:57 exit0 **103파일/1,417tests·TypeScript/Vite/MV3/5스킬PASS**. 실제 Whale5.39.412.57 source-sharing `1791976954035` PASS: teacher-01 ready source1/lease2, native retain 뒤 bytes 불변, 최종 jobs/source/bytes0; 두 격리 시험 realm logical asset 합11,769,768bytes. prepared-scene `1791976953909`, embedded-media `1791976954047`, foundation `profile-1791977059828`도 PASS/종료.
- 이 수치는 현재 모듈 realm의 준비 완료 시점 논리 관측이다. 전체 origin reservation/admission, 다른 realm의 전역 합, model/native heap, physical memory, 동적 자산 추가/직접 모델 폐기 자동 추적은 확인하지 못했다. 직전 entry-limit WorkingSet1,734,160,384bytes FAIL은 그대로 유지한다. 64MiB 미디어 cap·창별 SourceVault 제한을 전체 multi-session 메모리 한도로 확대하지 않는다.
- 다음은 작은 metadata 기반 origin 역할별 current/ready/pending 예약과 close/late 결과 정리를 설계하되 현재 발표 화면과 원본을 보존하는 것이다. 모델/native allocator 불확실성을 숫자 추정으로 숨기지 않고, 단일 WorkingSet 재검증 및 실물10종/PowerPoint 3축·물리/cold-offline/QuickLaunch/legacy/web 인수를 계속 남긴다.
- PRD §16/25에 맞춰 [PPTX 성능·자원 예산](../pptx/PERFORMANCE_BUDGET.md)을 추가했다. 입력·미디어·SourceVault 한도는 전체 multi-session 메모리 한도가 아니며, 전체 origin hard cap/eviction은 실제 측정 전 보류한다.
- 실제 자료 추가 위치와 짝 기준을 [test-materials/README.md](../../test-materials/README.md)에 명시했다. 현재 저장소 안에는 `고요한 우연(1)` PPTX와 대응 PDF 1종만 있으며, 합성 fixture를 실제 10종 인수로 세지 않는다.

- PRD §25 인수 항목을 [ACCEPTANCE_AUDIT.md](../ACCEPTANCE_AUDIT.md)에 표로 고정했다. 현재 전체 제품은 미완료, PPTX는 `unverified`이며 실제 자료 10종·PowerPoint 기준 3축·물리/cold-offline/장시간·성능 예산이 다음 필수 증거다.

- `package.json`의 기본 `check`에 `check:materials`를 연결했다. 최종 check08:27:34는 자료 짝 검사(`sourceCount=1/pairedCount=1`)·1,418 tests·빌드·MV3 검사를 모두 통과했다. 이는 실제 자료 수 10종을 충족했다는 뜻이 아니다.

## 2026-10-15 teacher-02 대용량 실제 웨일

- `whale-pptx-source-sharing/1792020469388/result.json` exit0. `고요한 우연(1).pptx` 52쪽·98,050,517-byte 실제 자료에서 source1/lease2→native lease1→final0, 두 popup logical asset 합185,538,790bytes, queued5종 취소/재시도/창 종료, 현재 PDF/세션과 원본 hash 불변을 확인했다.
- 이는 physical memory나 전체 origin budget PASS가 아니다. `physicalMemoryBytes/modelHeapBytes=null`, `productRendering=false`이며 기존 WorkingSet FAIL과 실제 10종·PowerPoint 기준 3축 부족은 유지한다.

## 2026-10-15 자료 인벤토리 도구

- `scripts/inventory-test-materials.mjs test-materials`를 추가했다. 원본 파일명·크기와 동일 이름 기준 출력의 짝만 숫자로 확인하며 본문/학생정보는 출력하지 않는다. 현재 결과 `sourceCount=1`, `pairedCount=1`, `고요한 우연(1).pptx=98,050,517 bytes`.
- 이는 실제 자료 10종 인수를 대신하지 않는다. 추가 자료가 들어오면 같은 명령으로 짝 누락을 확인하고 각 자료의 Visual·Media·Behavior·오프라인·성능 증거를 별도로 남긴다.

## 2026-10-15 최신 숫자 회계 경계

- `resourceInventory`의 byte/lease/blob/url 입력을 유한·0 이상으로 정규화했다. 잘못된 관측값이 향후 예약 판단을 오염시키지 않지만, 현재는 전체 origin hard cap이나 자동 거부를 도입하지 않는다.
- check08:25:30 exit0 **103파일/1,418tests·TypeScript/Vite/MV3/5스킬PASS**. 변경은 모듈 순수 회계 경계이며 actual Whale 재검증은 직전 source-sharing `1791976954035`, prepared `1791976953909`, embedded `1791976954047`, foundation `profile-1791977059828` 근거를 유지한다.

- 갱신: 2026-10-14 20:14 KST / 도구: Codex
- 목표: Windows 네이버 웨일 전용 MV3 교사 공모전 제품을 PRD v5 Stage A~G와 최종 인수 기준까지 완성한다. 일부 기능·자동 테스트 통과를 전체 완료로 축소하지 않는다.
- 최근 요청: /goal 제품 완성까지 지속 개발. 방향 점검 해결 우선, PRD 전체 인수 전 목표 유지, 작업별 테스트/실제Whale/인수인계 갱신. 커밋·배포·파괴적 작업 금지.

## 2026-10-14 20:14 최신 검증된 PPTX native URL 공유

- 직전턴은재연결취소/latecache보호·actualWhale/PDF/native회귀·인수인계를완료한progress였다. 이번에는이전Player URLbytes 92,769,395→149,548,498의추가MP3 56,779,103bytes를근거로같은sourceURL의독립native lease경로를연결했다. 전체byte예산의첫수명개선이며[계획](../plans/2026-10-14-pptx-borrowed-media-url.md)/[근거](../pptx/BORROWED_MEDIA_URL.md).
- sourceModel lease.retain과media/borrowedUrl, runtime.resolveMedia stablefactory·PptxView/LocalMediaPlayer를변경했다. binding/hash/geometry검사뒤acquire때동일ref/FP/origin·live·ownedBlob을재검증한다. 부모runtime해제뒤에도native borrower가src를비우기전에는자산/URL보존,마지막owner만source/rawdispose. borrowedURL직접revoke금지·released lease재입장금지·settings/revision으로새factory를만들지않아재생연속성유지. 일반localfile ownURL·원본/품질/코덱/preload·DB/RPC/publicsnapshot/권한/의존성은변경없음.
- check20:02:54 exit0 **102파일/1,412tests·TypeScript/Vite/MV3/5스킬PASS**. 신규9개retain/finalrelease/released parent·borrow 독립/idempotentlease·live/ownership/MIME/FP/origin거부/settings안정성. runtimeunit에stablefactory·acquire/폐기뒤거부추가. 최초geometry 대역이undefined를반환해실패했고실제선택element를반환하도록대역을수정했다. 제품guard약화없음.
- 최종actualWhale5.39.412.57 headless 전부exit0/종료: source-sharing `1791975962216` retainedAfterParentsRelease=true·마지막rawURL0·실제Worker/File/native2popup/취소/재시도/원본·현재PDF보존(productRendering=false),내장 `1791975962212` actual native WAV/MP4/crop/rotation/효과/같은DOM/source5·reprepare같은node/진행/음량·metadata실패/취소·백업,준비 `1791975962097` queued validator취소·현재PDF/음원/ACK유실/실패·같은표면/명시쪽,PDF `profile-1791976075602`,교사23쪽/12효과 `1791976075496`. 원본보존/관련외부0/pageerror0은근거문서범위를따른다. 모든파일은ignored node_modules/.cache의각시험이름아래실제result/verification-result.json.
- **성능FAIL:** entry-limit `1791975862802` model/nativePlayer 모두22URL/92,769,395bytes로추가56,779,103bytes URL생성없음을assert했다. 실제muted재생0.215831초/Remote정지·PDF복귀·Editor자산0·원본두hash/외부0/pageerror0 작동. 그러나전체WorkingSet1,734,160,384bytes로기존1.5GiB초과FAIL. logicalURL감소를physical복제/누수/성능해결로확대하지않는다. 기준상향/강제GC/화질·음질저하없음.
- **바로다음:** origin ready/current/pending의원본·raw·ownedBlob·모델보유량을숫자inventory로분리하고같은source/shared buffer/borrower를중복합산하지않는accounting계획을세운다. sourceModelreadyWeakMap은반복열거용registry가아니므로release와close에서끝나는작은수명registry를검토한다. sourceMeta/File/모델/원본내용은DB에복제하거나로그에쓰지않는다. 실제2자료/창·취소/늦은읽기/close와WorkingSet을함께관측한뒤검증된byte입장/예약예산을설계한다. logical 추정값를hardphysical상한으로속이거나현재발표source를evict하지않는다. Slot1직렬화·SourceVault창별16File/512MiB·새native borrowlease를전체모델한도로혼동하지않는다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)·PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구·QuickLaunch/legacy/web·renderer최종선정/지원승격미완료. 원본/기존변경보존,커밋·배포·파괴적작업금지. 과거sessionIDpoll금지.

## 2026-10-14 19:53 최신 원본 재연결 대기 취소

- 직전턴은PPTX준비입장/native2창·제품회귀/성능FAIL·인수인계갱신의progress였다. 이번에는 SourceVault.get optional signal/요청별controller·handle/getFile/validator/broadcast/close를연결하고취소뒤late cache반영·검증중새연결덮어쓰기를막았다. 다른소비자/cached원본은보존한다. [계획](../plans/2026-10-14-source-reconnect-cancellation.md)/[증거](../pptx/SOURCE_CANCELLATION.md).
- 주요파일 sourceVault.ts·pptx/source.ts/input.ts·PptxView/usePptxDocumentSource/RegisteredPptxPreview/PptxMediaControls·PdfView/PdfExportControls/LocalMediaPlayer. 기존caller controller를get까지전달하고media effect도controller로관리한다. PPTX queued gate취소는읽기/Worker전제거,activeFile읽기는actual완료까지reservation유지·실패/취소scratch만소비. PDF/media physical읽기는계속끝날수있지만late vault/DOM반영은막는다. RPC/DB/schema·권한/의존성·원본/품질/재생정책변경없음.
- 최종check19:42:23 exit0 **101파일/1,403tests·TypeScript/Vite/MV3/5스킬PASS**. 신규8개 cached/preabort·handle/File/validator늦은결과·다른소비자·broadcast/timer/late reply·close·새연결보호. 초기broadcastunit은request.type이reply객체를덮는fixture순서로timeout했고type마지막대입으로실제형식을복원해통과했다. 제품프로토콜약화없음.
- actualWhale5.39.412.57 headless 최종전부exit0/종료: 준비 `whale-prepared-scene/1791974738566` (queuedSourceReconnectCancelled 실제Remote UI/nativequeue제거·PPTX읽기0/Worker0·현재PDF/실제mutedWAV진행보존),PDF `whale-foundation/profile-1791974738725`,내장/native/source5 `whale-pptx-embedded-media/1791974738719`,교사23쪽/12효과 `whale-pptx-player/1791974738571`. 저장/백업/재연결·원본불변·내장외부0/pageerror0 등정확범위는증거문서.
- source/get native최종 `whale-pptx-source-sharing/1791974287604` PASS: popup2창·실제File/nativeWorker/WebLocks의source/import/inspection/identity/vault5종queued취소·읽기0/Worker0/재시도·active실제읽기완료까지예약·실패/닫힘/API부재/readyowner·현재PDF/수업/원본hash보존·외부0/pageerror0. productRendering=false. 이실행후PDF/media caller signal확장은위최종제품회귀로확인했다. 초기1,402test/actual실행은증거문서에보존했다.
- **성능미완료:** 이번취소수정의대용량메모리측정은미실시. 마지막성능은직전준비gate버전 entry-limit1791972762706의1,794,793,472bytes FAIL(기존1.5GiB)이며현재수정의통과증거로쓰지않는다. 취소가메모리전체를해결했다고하지않고기준상향/강제GC/품질저하없음.
- **바로다음:** 새계획에서ready/current/pending의원본/모델/미디어byte수명과origin별자원accounting/입장예산을설계한다. 단일job직렬화와원본SourceVault의창별16개/512MiB를전체모델한도로혼동하지않는다. 현재발표source를evict하지않고새준비를검증된량/예약으로수락·보류/거부하며현재PDF/음원/편집을보존해야한다. 먼저 sourceModel/assetModel·runtime/Editorlease·LocalMediaPlayer/mediaVault의공유/중복BlobURL과logical byte 수를숫자probe로확인한다. origin동시2자료·취소/늦은File읽기/창닫힘과단일teacher-02WorkingSet기준을분리검증하고unsupported/대안PDF경로를유지한다. 위연결된controller수명회귀를다시깨뜨리지않는다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)·PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구·QuickLaunch/legacy/web·renderer최종선정/지원승격미완료. 원본/기존변경보존,커밋·배포·파괴적작업금지. 모든근거는ignored node_modules/.cache 실제result파일이며과거sessionIDpoll금지.

## 2026-10-14 19:23 최신 PPTX 준비 입장 제어

- 직전턴은private buffer 수명/프로세스관측·실제Whale회귀·인수인계갱신의progress였다. 이번에는 `preparationAdmission.ts`의origin-wide exclusive Web Locks gate를 source 새pending job·등록/원본점검·SourceVault identity읽기에연결했다. 등록내부behavior helper는재진입하지않고ready동일File lease는그대로공유한다. [계획](../plans/2026-10-14-pptx-preparation-admission.md)/[근거](../pptx/PREPARATION_ADMISSION.md).
- queued취소/입장직전signal확인·active읽기실제완료까지예약·실패/닫힌context후release·API부재읽기없는failclosed를구현했다. source최종소비자취소/late source dispose·현재발표/ready owner·File/품질은보존한다. validator는fingerprint만반환하고읽은scratch를소비한다. DB/RPC/schema·권한/의존성·코덱/preload·원본파일변경없음. **SourceVault.get에는signal이없어validator의queued대기는아직취소불가**이며모델전체byte예산은별도다.
- check18:56:38 exit0 **100파일/1,395tests·TypeScript/Vite/MV3/5스킬PASS**. 신규8개gate native계약/queued·active/실패·API부재. 기존source/import/inspection단위는gate를명시적으로대역처리해그범위의계약을검사하고actual로입장을따로검증했다.
- 최종actualWhale5.39.412.57 headless `whale-pptx-source-sharing/1791972551721` PASS: 실제popup2창/서로다른File객체·nativeWorker/WebLocks의4경로queued읽기0/Worker0·취소가능3종취소/재시도·active실제읽기결과전달까지slot·actualinvalidZIP실패/owner닫힘release·API부재읽기0·readyowner·현재PDF/수업/원본hash보존·외부0/pageerror0. productRendering=false이며충실도증거아님. 초기1791972109118 기본PASS;추가1791972322887은잘못된4바이트헤더가full read전거부되는시험가정으로timeout. PK헤더64바이트invalidZIP로수정해guard약화없이최종확인했다.
- 최종제품회귀모두exit0/종료:준비 `whale-prepared-scene/1791972236337`,내장/native/source5 `whale-pptx-embedded-media/1791972236491`,교사23쪽/12효과 `whale-pptx-player/1791972551567`,PDF `whale-foundation/profile-1791972605104`. 교사첫1791972236334는후반효과버튼disabled timeout. gate원인인지미확정이며captured PNG/도구출력보존. 실패시gate수/효과일반status/preparation을failure.json에기록하도록verifier를보완한재시도는전체PASS여서제품수정으로해결했다하지않는다.
- **성능FAIL:** 최종entry-limit `1791972762706` 전체WorkingSet 최대1,794,793,472bytes로기존1.5GiB초과. parser1/MP3전체읽기1·등록/표본화면/실제muted재생·정지/PDF복귀·원본두hash불변·외부0/pageerror0은작동. 동시gate를단일자료성능/ready모델전체한도의해결로축소·대체하지않는다. 기준상향/강제GC/품질저하없음. 앞선52쪽pixel동일근거는직전turn이며이번UIlayout/renderer변경없음,관련교사기능/표본화면을확인했다.
- **바로다음:** 새계획에서 SourceVault.get의optional AbortSignal과validator signal전달을검토한다. queued metadata hash/broadcast대기취소·늦은handle/File결과로cache/remember가일어나지않는것·cached/다른소비자보존을단위로확인한다. `PptxView.tsx`/`usePptxDocumentSource.ts`의이미있는controller를get까지전달하고실제Nativegate를다른popup에서잡은상태의Remote준비취소·현재PDF/음원·읽기0/Worker0/queued제거를검증한다. 비취소File읽기actual완료까지reservation은유지,PDF/media기존get callers·재연결/backup을회귀확인한다. 그다음 ready/current/pending 원본/모델/미디어의실제량예산·남은renderer/native메모리비용을계속해결한다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)·PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구·QuickLaunch/legacy/web·renderer최종선정/지원승격미완료. 원본/기존변경보존,커밋·배포·파괴적작업금지. 근거는ignored node_modules/.cache의실제result파일이며과거sessionIDpoll금지.

## 2026-10-14 18:48 최신 Private 버퍼 소비·프로세스 비용 분리

- 직전 턴은 중복 raw 해제의 실제 회귀/인수인계를 완료한 progress였다. 이번에는 actual 프로세스 종류별WorkingSet/PrivateMemory·Runtime backing/embedder와해제뒤1/5초를관측하고,확인된private scratch만소비하는수정을검증했다. [계획](../plans/2026-10-14-pptx-process-memory.md)/[상세근거](../pptx/PRIVATE_BUFFERS.md). 계획의좁은수정/관측단계를체크했지만전체성능/제품인수는미완료다.
- 주요파일: shared/privateBuffer.ts·adapters/pptx/privateBuffers.ts/assetModel.ts/largeMediaParts.ts/duplicateImageParts.ts/sourceModel.ts·media/input.ts. Blob생성/원본hash·exact byte확인뒤source가명시opt-in한private buffer만transfer(0)소비. 다른package part/view·defaultcaller bytes/원본File·ownedBlob·다른source owner/타이밍근거는보존. media File.arrayBuffer scratch는헤더/hash성공·실패finally정리. API부재/실패는기존동작. 권한/의존성/DB/RPC·품질/코덱/preload·재생정책변경없음.
- 최종check18:36:48 exit0 **99파일/1,387tests·TypeScript/Vite/MV3/5스킬PASS**,신규12unit:소비opt-in/default·alias/subview·API부재/실패·Blobsnapshot/중복asset identity·hash/size·media header/digest성공/실패scratch/File불변·재시도. 이후제품코드는주석/들여쓰기만정리했고동작변경/변경없는check반복없음. 두변경verifier는node--check PASS.
- 실제Whale5.39.412.57 headless최종전부exit0/종료:공유 `whale-pptx-source-sharing/1791970913178`,준비 `whale-prepared-scene/1791970679795`,교사23쪽/12효과 `whale-pptx-player/1791970679795`,내장/native/source5 `whale-pptx-embedded-media/1791970874893`,PDF `whale-foundation/profile-1791970885015`. 각각별도폴더이며동일timestamp를동일실행으로혼동하지않는다. sourceprobe는transfer API지원/실제Worker1·개별/전체취소/재시도·owner/raw해제·현재PDF/원본보존PASS,productRendering=false다. 최종visual `1791970923260`은전체52쪽720×540/원본두hash불변/errors0,같은폴더pixel-regression.json은이전기준1791912346260과decodedRGBA52/52pixel동일PASS. 기존PDF/폰트차이·최종원본앱충실도는미완료다.
- 내장첫1791970680239의효과공존은currentTime2.134767=기존fixture duration에서paused=false기대로실패했다. 동일native/회전/crop은보존. 해당coexistence변형만Canvas/MediaRecorder로native12초영상생성해duration>10/ended=false·paused=false·위치진행/같은node조건을모두유지해통과했다. 기존2초자연종료fixture·제품·원본파일은바꾸지않았다. 실패와combined-effect-observation.json은보존.
- **성능FAIL:** 종류관측1791970098053 peak1,731,231,744;backing관측1791970216650 peak1,748,860,928;첫parser/raw소비1791970476981 peak1,625,133,056;최종mediahash까지1791970627466 peak1,754,501,120bytes(기존1.5GiB). 최종media쪽backing57,146,816bytes(이전240,204,143/중간113,925,532)로임시보유감소는확인했지만전체WorkingSet해결은아니다. 최종해제뒤5초backing40,403,927/전체1,737,003,008bytes. renderer가큰비용위치지만native/allocator/GC전체원인은미확정. 낮은중간표본만선택/기준상향/강제GC/품질저하없음. parser1/MP3읽기1·등록/표본화면/실제muted재생·정지/PDF복귀/원본hash/외부0/pageerror0은작동.
- **바로 다음:** 다른File/창의동시read/ZIP/model준비가겹치는입장을제어하는새계획을세운다. extension-origin Web Locks의exclusive준비gate/취소대기·실행중비취소File읽기끝까지reservation·실패/늦은결과release를adapter경계에서검토하고fake단위/실제2창·다른File경합으로확인한다. ready동일File/source owner공유는유지하고현재발표source를evict하지않는다. concurrency제어를단일teacher-02메모리FAIL이나active/pending모델전체예산의해결로축소/대체하지않는다. 실제량기반입장/원본·자산예산과남은renderer/native비용은따로남긴다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)·PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구·QuickLaunch/legacy/web·renderer최종선정/지원승격미완료. 원본/기존변경보존,커밋·배포·파괴적작업금지. 근거는ignored node_modules/.cache의실제result파일이며과거sessionIDpoll금지.

## 2026-10-14 18:26 최신 중복 이미지·작은 미디어 해제

- 직전 목표 턴은 용량 질문의 코드 확인/설명이었다. 이번에는 미기록 구현과 실제 결과를 재검증하고 최종 회귀·증거/정책/추적/인수인계를 갱신했다. [계획](../plans/2026-10-14-pptx-duplicate-images.md)의 좁은 구현/검증 단계는 체크했지만 성능 해결이나 전체 제품 인수는 아니다. [상세 증거](../pptx/DUPLICATE_PARTS.md).
- `duplicateImageParts.ts`와 `sourceModel.ts`: guard/hydration/recovery 뒤 exact owned Blob 스트림 대조로 일치하는 raster/32MiB 이하 지원 미디어 raw만 해제. hash/size 근거·원본 관계/타이밍 binder·표시 Blob/File은 유지, 마지막 source owner/error만 private files를 정리한다. 원본·권한/의존성·DB/RPC·품질/재생 정책 변경 없음. 신규8unit 포함 최종check18:12:31 **98파일/1,375tests·TypeScript/Vite/MV3/5스킬 PASS**.
- 최종 실제 Whale5.39.412.57 headless 공유 `whale-pptx-source-sharing/1791969314525` PASS: teacher-02 이미지5개/1,384,852bytes와 작은음원16개/34,605,440bytes 중복raw 해제·Worker1·소비자취소/전체abort/재시도·owner/raw 최종해제·현재PDF/수업·원본hash 보존/외부0/pageerror0. raw/backing은모두9,335,184bytes여서 작은view의큰buffer보유가설은 이표본에서 확인되지않음. productRendering=false·전역메모리보증 아님.
- 최종 제품 회귀 전부 exit0/종료: 준비 `whale-prepared-scene/1791969513438`, 교사23쪽/12효과 `whale-pptx-player/1791969513441`, 내장/native/source5 `whale-pptx-embedded-media/1791969604720`, PDF `whale-foundation/profile-1791969661536`. 내장 첫1791969513575는해제된WAVraw가있다는시험가정에서실패. probe에서만원본fixture bytes변조를재주입하고해제근거누락/해시·크기변조거부와복구를추가해통과했다. 제품raw보유를되돌리지않음.
- 최종 전체52쪽 `whale-pptx-visual/1791969671689` executionPassed=true·원본두hash불변/errors0. 같은폴더 `pixel-regression.json`은bgRef수정후기준1791912346260과decodedRGBA52/52쪽전체pixel동일PASS. 이번화면회귀없음이며기존PowerPoint/PDF차이/폰트·원본앱기준환경/최종충실도인수는그대로미완료. 모든근거는ignored node_modules/.cache아래실제result파일이며 과거sessionIDpoll금지.
- **성능 FAIL 유지:** image-only1791968250797 PASS표본1,591,717,888bytes를골라최종통과라하지않는다. 작은media wholeBlob1791968806169는1,711,390,720bytesFAIL, 최종stream1791969157618도1,712,766,976bytesFAIL(기존1.5GiB). parser1/MP3전체읽기1·등록/표본화면/실제muted재생·정지/PDF복귀·Editor자산0·원본hash/외부0/pageerror0은작동. raw삭제를WorkingSet감소/누수해결이라하지않음. 기준상향/강제GC/품질저하없음.
- **바로 다음:** 같은방법재실행만하지말고최종entry-limit단계자료를기준으로프로세스종류별WorkingSet과raw/model/ownedURL/native수명을분리하는관측계획/숫자probe를진행한다. 현재CDP Editor/Player값이동일하여공유renderer이며창별합산금지. 자료준비시Editor owned92,769,395bytes·Player첫쪽동일,미디어쪽Player149,548,498bytes(URL23)·PDF복귀Player0·Editor해제뒤0을관측했다. URLbytes증가56,779,103만으로실제복제/PCM원인을단정하지않는다. `LocalMediaPlayer.tsx`의별도BlobURL와PPTXownedBlob/native경로의수명부터검토하고근거없이현재재생source/품질을바꾸지않는다. 서로다른File/창admission·active/pending원본/모델예산과비취소File읽기임시수명은미구현이다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)·PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구·QuickLaunch/legacy/web·renderer최종판정/지원승격은남는다. 원본/기존변경보존,커밋·배포·파괴적작업금지.

## 2026-10-14 17:50 최신 진행중 File 준비 공유·취소 격리

- 직전턴은선택자료lease/미디어identity재사용·두메모리표본과회귀증거를추가한progress였다. 이번에는 `src/adapters/pptx/sourceModel.ts`에pending WeakMap·작업controller/livewaiter·예약lease를추가했다. 같은창/정확한immutableFile의동시read/guard/Worker를공유하며한취소는상대유지,마지막취소만abort/입장제거. 실패/전체취소늦은성공은재사용하지않고성공pending은ready발행전제거해전달전해제자산의재입장을막는다. 마지막lease만dispose. [계획](../plans/2026-10-14-pptx-inflight-source.md)/[증거](../pptx/INFLIGHT_SOURCE.md).
- 신규unit5개:동시1회·독립owner/개별취소·전체abort/늦은결과/새요청·실패재시도·발행후전달전취소재입장. 최종check17:44:49 exit0 **97파일/1,367tests·TypeScript/Vite/MV3/5스킬 PASS**. 원본·기존guard/문서binding·메시지/DBschema/권한/의존성/비공개정보경계변경없음.
- 실제Whale5.39.412.57 headless 최종공유 `whale-pptx-source-sharing/1791967531723` exit0:실제teacher01 File/nativeWorker1·첫취소후유지/둘째성공·readyowner공유/최종81자산해제·전체취소Worker종료/늦은post무반영/새요청재시도·현재PDF픽셀/수업·원본hash불변·외부0/pageerror0. productRendering=false이며원본렌더충실도인수가아니다. 초기1791966950756도PASS.
- 최종publication보완후정상준비 `whale-prepared-scene/1791967531603` PASS. 보완전제품회귀도모두exit0/종료:교사23쪽/12효과 `whale-pptx-player/1791967187074`,PDF `whale-foundation/profile-1791967187239`,준비 `whale-prepared-scene/1791967187096`,내장/native/source5 `whale-pptx-embedded-media/1791967311807`. 정확한범위는증거문서. 모두node_modules/.cache아래result.json(Foundation은verification-result.json),존재확인후사용/과거sessionIDpoll금지.
- **최신성능FAIL:** entry-limit `1791967047533` 표본1,624,035,328bytes(약1.51GiB)로기존1.5GiB초과·exit1/pass=false. parser1/MP3읽기1·등록/표본화면/실제muted재생·정지/PDF복귀·Editor추적자산0·원본2개hash불변/외부0/pageerror0은작동. 직전두통과표본만선택해성능완료라하지않고새FAIL을공유가원인이라고단정하지않는다. 기준상향/강제GC/preload/화질·음질변경없음.
- **바로다음:** 다른자료/창의전역/창별admission·active/pending원본/자산예산은미구현. Source.files검색결과 guard/복원/타이밍은XML/관계와원본미디어hash/size근거를사용하며raw이미지버퍼는hydratedBlob과중복보유된다. `largeMediaParts.ts`는32MiB초과audio/video만근거후삭제한다. 먼저새계획에서guard/hydration/recover/미디어binding/글꼴근거를보존하는작은binary/image중복방출을검토·측정한다. File.arrayBuffer자체는취소불가여서전체취소뒤늦은입력수명까지budget에반영해야한다. 현재발표중source를evict하거나품질을낮추지않고새준비를안전하게수락/거부한다.
- 전체PRDv5 StageA~G/최종인수목표유지. 실제교사10종(현재2/기준PDF1)/PowerPoint Visual·Media·Behavior·물리/장시간/coldoffline·PDF대안/경합/장기통신복구/QuickLaunch/legacy·web과renderer최종판정·지원승격은남는다. 원본/기존변경보존,커밋·배포·파괴적작업금지.

## 2026-10-14 17:29 이전 선택 자료·미디어 검증 재사용

- 이전 턴은 raw 전환차단/검증 이행과 성능FAIL 증거를 추가한 progress였다. 이번에는 숫자 관측으로 Editor 쪽별 재마운트의 source최종해제/같은98MB원본 재파싱과 MP3등록·설정·probe3회읽기를 분리했다. 현재선택PPTX자료하나의source lease/동일File을 유지하고 성공guardedBlob/File identity만WeakMap재사용했다. [계획·근거](../plans/2026-10-14-pptx-preparation-memory.md), [상세](../pptx/SOURCE_REUSE_MEMORY.md).
- 주요파일: `src/editor/usePptxDocumentSource.ts`, `Editor.tsx`, `RegisteredPptxPreview.tsx`, `src/media/input.ts`, `src/adapters/pptx/embeddedMedia.ts`. 페이지별OverlayEditor key/draft초기화는보존,자료/수업/지문·쪽집합변경/창닫기·취소/늦은결과는lease해제. 이전ready상태재사용금지,준비전내장미디어연결잠금. 같은Blob성공File/hash·같은immutableFile숫자identity만공유하고관계/소유권/종류·다른객체/형식/크기/실패·native길이/코덱은재검증한다. rawbytes/이름·지문별캐시/DB영속복제·권한/의존성/텔레메트리없음.
- `scripts/media-memory-observer.mjs`는시험전용 File/Blob읽기 크기/횟수·Worker mode·native/buffered/URLbytes 숫자관측. nativeMP3는metadata시점부터전체3547.92초buffered를보고해preload변경을원인해결로단정하지않고제품재생정책유지. 관측1791938834124는parser4/MP3읽기3·성능FAIL,lease만수정1791939042121은parser1/읽기3·1,700,364,288bytesFAIL이라추가identity재사용으로진행했다. 실패모두보존.
- 최종check09:58:24 exit0 **97파일/1,362tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규6개:document/page lease해제·정확한File/복사/형식·크기/실패·동일Blob/소유권/교체·취소격리/실패Promise재시도. optionalFile prop타입오류는수정했다. 그뒤제품코드변경없고실제검증/문서만갱신했다.
- 실제teacher-02수정후두표본PASS: `whale-pptx-entry-limit/1791939374011`1,600,827,392bytes(약1.49GiB),최종`1791939705851`1,581,264,896bytes(약1.47GiB). Editor parser4→1/전체98MB읽기5→2·MP3전체읽기3→1명시assert,정상Remote준비/실제muted음원진행·정지/PDF복귀·Editor추적자산0·원본2개hash불변/외부0/pageerror0. 기존1.5GiB실험기준/GC·화질/음질/preload변경없음. 표본이며hardpeak/저사양/장시간/전역한도보증아님.
- 최종actualWhale5.39.412.57 headless회귀모두exit0/종료:내장/native/source5 `whale-pptx-embedded-media/1791939613889`,교사23쪽/12효과/draft/백업/5화면 `whale-pptx-player/1791939760177`,PDF `whale-foundation/profile-1791939760310`,준비/우회거부 `whale-prepared-scene/1791939760176`,미지원/취소 `whale-pptx-degradation/1791939760290`. node_modules/.cache아래result.json(Foundation은verification-result.json)존재. 과거sessionIDpoll금지. 중간내장1791939042053은2초영상자연종료 paused기대실패;1791939511285는캐시후미실행File오류주입대기실패. 관측/독립실행/nativemetadata오류검사로교정후최종PASS,단위에서읽기실패재시도는유지했다.
- **다음:** 메모리계획은관측한중복원인/해당자료실험만마쳤다. 다중자료·창/동시parse의자원예산과admission·마지막owner해제/빠른재연결수명을측정·설계한다. sourceModel의ready공유는있지만inflight공유/전역모델예산은아직없고다른자료준비때현재발표를희생하면안된다. 현재모델을유지하면서새준비를bounded하게수락/거부하는경계와교사용대안안내가필요하다. 큰변경은새계획을먼저작성한다.
- 그외대안PDF연결·지문/취소·확정경합/장기통신복구,실제10종(현재2/기준PDF1)/PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·StageA~G전체인수/renderer최종판정·지원승격은계속미완료. 전체목표유지,원본/기존변경보존,커밋·배포·파괴적작업금지.

## 2026-10-14 09:45 이전 직접 전환 입장 차단·성능 실패

- 앞선 턴은 준비 표면/실제 검증을 추가한 progress였고 이번에는 SessionHub 저장 큐에서 raw PPTX ACTIVATE/GOTO/REOPEN 및 실제 현재 PPTX ADVANCE_AUTOPLAY를 거부했다. PRESENTATION_PREPARATION_REQUIRED, pending/세션/receipt/발행 무변경·old receipt/늦은revision 우회 불가. core COMMIT 원자 전환/PDF 정상 경로 유지. [구현·정확한 증거](../pptx/TRANSITION_ADMISSION.md).
- 신규 `tests/integration/pptxTransitionAdmission.test.ts`5개. 최종check09:35:17 exit0 **96파일/1,356tests·TypeScript/Vite/MV3/5스킬 PASS**. 초기fixture revision4 create/union 타입은 수정했다. 그 뒤 제품 코드는 동일하며 실제 시험/helper와 문서만 갱신했다.
- 일반 발표 검증의 PPTX 전환은 `scripts/presentation-ui.mjs` 정상 Remote 버튼/공개 durable 결과 await/poll로 이행했다. `presentation-contract.mjs`는 metadata/owner 시험용 consumer 보류/수동 REQUEST/COMMIT이며 실제 준비 완료를 대신하지 않는다. 제품에 시험 우회 권한/전역 플래그 없음. checkpoint 공개 ACK/고정revision5 가정을 수정해 REQUEST/COMMIT 포함7회 저장·restart를 확인, owner 과거 Worker 기본iife 빌드도ES module/parser patch로 교정했다.
- 실제Whale5.39.412.57 headless 모두 exit0/종료: UI `whale-prepared-scene/1791938154353`, 직접 거부/미지원 `whale-pptx-degradation/1791938154481`, 교사23쪽/12효과 `whale-pptx-player/1791938154371`, 내장/native/source5 `whale-pptx-embedded-media/1791938154506`, PDF `whale-foundation/profile-1791938264552`, 수동전환계약 `whale-presentation-transition/1791938265086`, owner probe `whale-pptx-owner/1791938303677`, localhost계약 `pptx-checkpoint/1791938332627`. 경로는 ignored node_modules/.cache 아래. 직접3종/pending/자동 넘김 거부·화면/음원 보호·정상 새 경로·저장/새Player·원본hash 불변. 과거 session ID poll 금지.
- **성능 FAIL/최우선 다음:** teacher-02 새 정상 경로는 등록/표본화면/57MB MP3 연결·실제 muted 재생/정지/PDF복귀·Editor추적자산0·원본hash불변/외부0/pageerror0이 작동했으나 전체 WorkingSet 표본 최대1,640,394,752bytes(`whale-pptx-entry-limit/1791938333066`)와1,620,353,024bytes(단계/CDP 관측 추가 `1791938439233`)로 기존1.5GiB 실험기준을 두 번 초과해 모두 exit1/pass=false. 실패 결과 보존, 기준 상향/강제GC/화질·음질 저하 없음. 두 번째 첫쪽확정 약1.47GB, 미디어쪽/음원/복귀 근처 약1.62GB. 공유 renderer CDP값을 창별독립/누수 확정으로 오해하지 않는다.
- 바로 이어서 [준비 메모리 계획](../plans/2026-10-14-pptx-preparation-memory.md)1단계: 준비 native preload=auto의 전체 긴 미디어 버퍼링/최소 data 준비, hash/metadata 중복 읽기·Blob/source 소유권과 해제 후 retained메모리 원인을 분리한다. 검증된 최소 data 뒤 preload metadata 힌트 후보는 관측·재생 연속성/seek/cancel/native 동일성까지 확인 후 채택한다. 전역 모델/미디어 예산은 아직 없다. 동일방법 재실행만으로 통과를 고르지 않는다.
- 전환 [계획](../plans/2026-10-14-player-transition-commit.md)4단계 기능은 체크했지만5/전체안전성·성능/최종제품 인수는 미완료. 대안PDF 연결·지문/취소·확정 경합/장기 통신복구, 실제10종(현재2/기준PDF1)/PowerPoint Visual/Media/Behavior·물리/장시간/coldoffline·Stage A~G 전체 목표 유지. 원본/기존 변경 보존, 커밋·배포·파괴적 작업 금지.

## 2026-10-14 09:31 이전 Player 준비 표면 연결

- 정상 Remote의 중복 runtime 검사를 owner 조회/REQUEST로 대체하고, 지정 Player가 공개 목표 snapshot으로 숨긴 표면을 준비한 뒤 같은 DOM/native 미디어를 COMMIT 때 활성화하도록 연결했다. `PlayerScene.tsx`, `usePresentationStage.ts`, `preparedScene.ts`, `PptxView.tsx`, `LocalMediaPlayer.tsx`, `Player.tsx`, `Remote.tsx` 및 owner/context 조회 경계. 원본/비공개 정보/DB bytes·권한/의존성 추가 없음. [근거와 구현 경계](../pptx/PREPARED_SCENE.md).
- 준비 동안 현재 표면/음원을 유지하고 효과/transport 쓰기/native 재생/checkpoint를 금지한다. image/font/native data 대기는30초/취소. 실패/취소는 준비 표면만 해제, 불명확 COMMIT은 같은 ID/저장 상태로 조정. 새 Player는 과거 context pending을 보류하며 Remote 취소 가능. 닫힌 PPTX는 선택한 명시 쪽으로 재개한다.
- 최종 check09:31:13 exit0 **95파일/1,351tests·TypeScript/Vite/MV3/5스킬 PASS**. 효과 상태를 매 revision ready로 덮어쓴 초기 교사/내장 두 회귀 실패를 수정했고 완료/취소/보류 상태를 유지한다. owner 조회 역할/strict payload assertion까지 포함한다.
- 실제Whale5.39.412.57 headless 모두 exit0/종료: UI `whale-prepared-scene/1791937459793`, 미지원/취소 `whale-pptx-degradation/1791937350812`, native 동일성/5 source그룹 `whale-pptx-embedded-media/1791937459925`, 교사23쪽/12효과 `whale-pptx-player/1791937273185`, PDF `whale-foundation/profile-1791937147796`, 수동 계약 `whale-presentation-transition/1791937550630`. 경로는 ignored node_modules/.cache 아래이며 과거 session ID poll 금지. 실제 UI 원본 누락/PDF 유지·재연결/검정 대기→닫힌 명시 쪽·worker/음원 유지·ACK 유실 조정, 내장 host/video 동일·승격 전후 play0/cursor5를 확인했다. 상세 실패/교정은 근거 문서에 보존했다.
- **바로 다음:** [계획](../plans/2026-10-14-player-transition-commit.md)4단계의 기존 직접 PPTX ACTIVATE/GOTO/REOPEN 입장 차단. SessionHub의 동일 큐/저장 경계에서 대상 형식을 확인하고 준비 요청 없이 들어온 직접 전환을 거부한다. core 내부 COMMIT 원자 전환과 PDF 정상 전환은 유지한다. 기존 실제 검증의 PPTX 직접 전환 callsite를 정상 요청/Player 준비 경로로 이행하고 직접 거부·학생 화면 유지 시험을 추가한다. 현재 report.directCommandAdmissionVerified=false, 계획4 전체는 체크하지 않았다.
- 그 다음 지문/취소·확정 경합/장기 통신 불명확·대안PDF 연결, 대용량 현재/목표 동시 모델 메모리/지연 측정, 실제 교사10종 이상(현재2/기준PDF1)/PowerPoint 비교·물리/전체 Stage A~G 인수. PPTX 최종 renderer/지원 승격 미완료. 원본·기존 변경 보존, 커밋·배포·파괴적 작업 금지, 전체 목표 유지.
- 사용자 용량 질문에 코드 기준으로 답했다: 개별PPTX128MiB, 지원 내장 음원/영상 하나64MiB, 창별 PPTX SourceVault16개/512MiB. 여러 수업 세션 전체 합계64MiB가 아니고 원본 자동 영속 복제도 아니다. 영구 등록/재연결과 실행 메모리 한도를 혼동하지 않는다.

## 2026-10-14 08:53 이전 Player 전환 계약 1단계
- 이전Remote보호는진전이다. 이번에는Player준비후확정을위한저장/소유권계약을연결했다. optional ClassSession.presentationTransition의작은요청/목표/지문/기존선택·닫힘/checkpoint표식/지정Player context ID를strict DB·receipt에저장한다. REQUEST/CANCEL/REJECT는현재발표와미디어를건드리지않고COMMIT만기존규칙으로명시쪽을원자전환한다. [계획](../plans/2026-10-14-player-transition-commit.md).
- 현재소유권WebLock을검사부터durable응답까지유지한다. 역할·같은수업URL·정확한sender context/request/목표를검사하고교체Player는과거요청을확정하지못한다. 중요목표편집/지문·선택/완료위치경합은pending을무효화한다. 새backup수업복구는pending을제거,구필드없는세션/백업도읽는다. 원본/bytes·노트/이름은pending에없고추가권한/의존성/서버없음.
- GET_PRESENTATION_TARGET은같은요청의지정현재Player에만public targetSnapshot을반환한다. teacher노트/파일명·과거run/request/자동넘김/timer는제외하고목표미디어는paused로투영한다. 현재학생화면을조회로바꾸지않는다. Player가teacher세션을읽게하지않는다.
- 최종check08:46:55 exit0 **94파일/1,344tests·TypeScript/Vite/MV3/5스킬PASS**. 신규20개:상태보존/원자확정·닫힌명시쪽/취소·실패·경합/source-v1표식·strict변조/구형·backup복구/역할/저장실패·중복/CAS·owner잠금. 초기Extract허용목록누락타입실패는수정했다.
- actualWhale5.39.412.57headless 최종 `whale-presentation-transition/1791935221159/result.json` exit0:PDF픽셀/델타·무음WAV진행유지/worker재기동pending유지/teacher·중복Player거부/취소후늦은확정0/새owner과거요청거부/새요청원자확정·중복무재적용/닫힌목표다른쪽재개/새backup수업pending제거·기존수업불변/노트/이름없는목표조회·원본hash불변/외부0/pageerror0. 첫 음원1791934554995의대역관찰timeout은실제DOM audio관찰로교정했고실패결과를보존했다.
- 기존회귀모두exit0/종료:degradation1791934793901/교사제품1791934793754/PDFfoundation profile-1791934793929. 마지막목표조회추가전의기존경로회귀,최종목표조회는위RPC로검증했다. 과거session ID poll금지. [실행기록](../TEST_RESULTS.md).
- **다음**: 계획4단계. CLAIM응답의자기context ID/Remote현재owner조회·요청을연결하고,Player가공개targetSnapshot으로현재표면/재생을유지하며목표를준비한뒤같은표면/자산을확정시활성화한다. 기존직접전환명령입장도차단한다. 새window의과거pending은보류/취소·새요청처리. 현재RemoteUI는기존선행검사+직접명령이며새준비consumer는미연결(report.playerPreparationIntegrated=false). 전체안전전환완료로세지않는다. 원본누락/변조·worker실패·취소/창닫기/복구·PDF대안/대용량성능·실물10종/물리/Stage A~G최종인수까지목표유지,커밋·배포·파괴적작업없음.

## 2026-10-14 08:16 이전 리모컨 전환 보호
- 배경수정은진전이었고이번에는정상RemoteUI에서PPTX전환전에분리runtime를준비해실패/취소시기존학생화면을유지하도록연결했다. `transitionReadiness.ts`는실제openPptxRuntime/source-v1복원을재사용하고쓰기/미디어실행을금지·finally해제한다. `prepareTransition.ts`는현재발표/목표ID·지문/닫힘·쪽순서/완료checkpoint경합을재검증하고최신revision으로1회전송한다. [계획](../plans/2026-10-14-pptx-transition-safety.md).
- ACTIVATE_DOCUMENT는slideId:null(기억쪽)또는등록명시쪽을허용하며core/validator/검사대상이일치한다. 첫쪽이미지원이어도다른정상쪽으로직접원자전환가능,닫힌자료ACTIVATE/없는쪽은거부·REOPENnull경계유지. 검사중원본/현재미디어를바꾸지않고취소/실패에는PDF·원본앱/재연결·재검사를안내한다. 상태/백업schema·권한/의존성/원본변경없음.
- 최종check08:11:11 **93파일/1,324tests·TypeScript/Vite/MV3/5스킬PASS**. 신규20개:경합/취소/최신revision/명시쪽원자전환과adapter무쓰기/무재생·cleanup. 초기02:39:33transport 타입오류는기존send/newId계약확인후수정했다. 최종오류문구는전송전일때만화면유지확정을말한다.
- 실제Whale5.39.412.57headless `whale-pptx-degradation/1791933132393/result.json` exit0:합성미지원20.001초회전의발표/이전쪽무commit·준비취소/nativeWorker종료/늦은결과0·현재PDF픽셀/세션유지·정상2쪽직접발표/복귀·Editor/Remote5화면. 자동정적완성화면없음.
- 회귀모두exit0:교사제품1791933009519(실제준비UI→3쪽/23쪽12효과·독립편집/overlay·Remote/worker/백업·재연결·5화면),내장1791933139442(WAV/MP4/source5그룹·재준비/복원/백업/취소·늦은결과,완료source-v1의Remote준비UI후실제revision수락/위치유지),PDFfoundation profile-1791933010227(저장/복사본/종료/owner/worker/미디어/자동넘김/정상재시작). 모두종료,과거session ID poll금지. [근거](../TEST_RESULTS.md).
- **다음**: Player가현재표면/미디어를유지하며목표를준비하고검증된전환요청/receipt로commit하는절차를설계한다. 이번은정상RemoteUI선행검사이며직접background명령입장/실제Player준비실패·복구까지보호하지못한다. 대안PDF연결/닫힌자료다른쪽선택·대용량추가파싱/메모리성능도미완료다. 실제10종(현재2)/원본앱·전체Visual/Media/Behavior·물리/StageA~G최종인수까지목표유지. 커밋·배포·파괴적작업없음.

## 2026-10-14 02:30 이전 배경 충실도 수정
- 이전 로컬 글꼴 검사 작업은 진전이다. 이번에는teacher-02 1쪽의배경차이가master bgRef1001을core0.4.5가마지막style로clamp하는오류임을원본/PDF/공식규칙과설치source로확인했다. `scripts/pptx-background-patch.ts`/Vite client·worker에서고정SHA/3지점검증후정확한style행렬계산으로수정했다. node_modules/원본불변,MIT원문·MODIFICATIONS동봉/빌드검사. [계획](../plans/2026-10-14-pptx-background-reference.md)/[실물근거](../pptx/TEACHER_02.md).
- 0/1000 없음,1..999 fillStyleLst,1001.. bgFillStyleLst. 범위밖오류를흰색unsupported쪽으로바꾸던상위catch도특정배경오류만재전파한다. 다른fallback/guard/권한/의존성/상태schema는변경없다. 라이브러리배포본이달라지면자동patch하지않고빌드를실패시켜검토한다. parser probe별도Vite빌드도같은plugin을적용한다(Node24 TS import).
- 최종check02:24:58 **91파일/1,304tests·타입/Vite/MV3/5스킬PASS**. 실제Whale5.39.412.57headless `whale-pptx-background/1791912319024/result.json` 합성10종PASS(유효7종·범위오류3종). 초기ready/색표기검증오류와상위catch문제실패1791910963270/1791911011324/1791912227531은보존했다.
- 전체52쪽최종 `whale-pptx-visual/1791912346260/result.json` exit0/raw720×540·재표본화없음/원본2hash불변/독립선택/외부0/pageerror0. 1쪽5배경표본white일치·MAE10.6178→2.1825/차픽셀18.1296%→1.9542%. 전체MAE21.4190/차픽셀중앙13.3318%,원본↔제품텍스트hash52쪽일치(PDF33쪽기호1개차이). 같은폴더comparison.html/summary.json/source-diagnosis.json. 최종Visual은unverified,글꼴·배치차이/원본앱환경은남는다.
- 기존회귀모두exit0:교사제품1791912319303/내장1791912319742/PDFfoundation profile-1791912346550. 각각기존ignored cache폴더의result.json(기반은verification-result.json). 모두종료/과거session ID poll금지. 새성능/메모리benchmark·entry-limit/degradation개별실행은이번미실시,두probe설정은같은patch로갱신했다. [실행기록](../TEST_RESULTS.md).
- **다음**: 알려진준비불가PPTX쪽으로전환할때현재학생화면을유지하는안전UX를구현한다. `DEGRADATION_PREFLIGHT.md`/관련계획·Remote/Player명령을읽고원본/완료checkpoint/미디어소유권·revision을보존한다. 자동정적완성화면으로숨김정답노출금지. 원본앱·실물10종(현재2)/전체Visual/Media/Behavior·물리/StageA~G최종인수는미완료,목표유지. 커밋·배포·파괴적작업없음.

## 2026-10-14 01:53 이전 구현과 검증
- 이전 원인 분석은 실제 글꼴 대체의 기여를 확인한 진전으로 분류한다. 이번에는 신규 PPTX 등록과 별도 원본 점검에 로컬 글꼴 참조 검사·위험 안내를 연결했다. [계획과 근거](../plans/2026-10-14-pptx-local-font-preflight.md).
- `localFonts.ts`는 기존 XML 파싱 observer가 전달하는 슬라이드 명시 typeface 중 고유명 최대64종을 FontFace local로 조회한다. 추가 권한/원격 font/폰트 설치·문서 추가/제품 fallback 변경 없음. 결과는 숫자만, 조회 실패는 warning·대체/줄바꿈 위험과 기준 PDF/원본 앱 안내, API부재·시간초과·모든 참조 확인도 실제 적용은 unknown이다. 상속/theme/embedded/glyph/license/충실도는 별도 미확인이다.
- 1500ms 대기 타이머와 즉시 취소/늦은 결과 무시·listener 정리, 신규 등록 취소 시 vault/세션 보존. 동일 hash 빠른 재연결은 글꼴 미검사·원본점검 재실행 경로를 명시한다. 최종 check01:50:08 exit0 **90파일/1,288tests·타입/Vite/MV3/5스킬PASS**. localFonts 생산 JS1,963bytes, 상시 font 로드 없음.
- 실제 Whale5.39.412.57 headless: `whale-pptx-visual/1791909913244/result.json` 52쪽자료등록 경고와 비공개1/17쪽·PDF독립/원본2hash불변/외부0/pageerror0. `whale-pptx-inspection/1791910059593/result.json` 교사23쪽 명시7종 확인실패 안내/진행중취소·늦은결과0/timeout unknown·PDF픽셀/세션보존/5화면 PASS. 초기1791909982775의cancel 클릭 대기중detach/timeout은 실패로 보존, Editor bringToFront·사전scroll·실제button focus/Enter로 재검증했다.
- 최종 교사제품 `whale-pptx-player/1791910232777/result.json` 재연결미검사 안내와23쪽/12효과·독립편집/overlay·Remote/worker/백업/재연결/5화면 PASS. PDF foundation `profile-1791910026064/verification-result.json` PASS. 모두 exit0/종료, 과거 session ID poll 금지. [실행기록](../TEST_RESULTS.md).
- **다음**: teacher-02 1쪽의 배경/도형/이미지 차이를 원본 fill·참조·PDF 기준과 대조하고, 이어 알려진 미지원 쪽으로 전환할 때 학생 화면을 유지하는 안전 UX를 구현한다. 폰트 검사 성공을 실제 적용/충실도 pass로 확대하지 않는다. 실물10종(현재2)/원본 앱·전체 Visual/Media/Behavior·물리/Stage A~G 최종 인수는 미완료, 목표 유지. 커밋·배포·파괴적 작업 없음.

## 2026-10-14 01:40 이전 원인 분석
- 이전52쪽비교/글꼴Preflight작업은진전으로분류하며이번은원본XML/PDF/제품렌더hash와실제font사용을대조했다. `scripts/diagnose-pptx-reference.py`의로컬결과:원본↔제품52/52일치,33쪽PDF추출만So기호1개차이(기호제외일치). 렌더러본문누락근거없음,줄바꿈·시각충실도통과로해석하지않는다. 결과1791908785569/source-diagnosis.json.
- actualWhale선택6쪽1/17/30/33/41/43 CDP platformFonts진단1791909257887:실제사용MalgunGothic+Calibri로원본지정명과다름. 1791909344156테스트DOM전용MalgunGothic대조군은MAE17쪽34.95→16.22/30쪽35.74→19.67로감소. 제품fallback/설정/권한변경없고원래style은finally복원. 1쪽개선작음/nearwhite분포차이남음. [근거](../pptx/TEACHER_02.md)/[실행기록](../TEST_RESULTS.md).
- 두실제Whale시험모두exit0/6쪽baseline raw720×540/독립편집/원본2개hash불변/외부0/pageerror0.선택시험을전체52쪽인수로세지않는다. node구문/Python컴파일·진단/git diff --check PASS. 이번src변경없어직전01:29:03의89파일/1,278tests·타입/Vite/MV3/5스킬PASS유지,전체check반복없음.모든handle종료,과거session ID poll금지.
- **다음**: 제품권한확대없이FontFace local참조해결검사가능성을실제Whale에서시험(없는글꼴·한글별칭·CSP·취소/시간상한대조)하고정확한사전안내로연결한다. 1쪽의fill/이미지·색차이는별도원인분석한다. 원본지정폰트를추정설치하거나PDF와같다는이유로자동fallback교체하지않는다. 이어미지원쪽학생화면보호UX.실물10종(현재2)/원본앱/Visual/Media/Behavior·물리·StageA~G최종인수미완료/목표유지, 커밋·배포·파괴적작업없음.

## 2026-10-14 01:31 이전 구현과 검증
- 직전한도질문답변은개발진전으로세지않고,이전52쪽비교의1px캡처오차를실제clip/raw크기assert로해결했다. [계획](../plans/2026-10-14-pptx-visual-fidelity.md)/[실물근거](../pptx/TEACHER_02.md).
- PPTX `fontMetadata.ts`/packageGuard/등록·원본검사·모델Preflight에bounded숫자안내를추가했다. 정상명unknown/깨진값·한도warning이며설치·실제적용·license·충실도미확인. 원본/권한/의존성/저장schema변경없음. Python CP949 stdout깨짐을원본손상으로본오판은UTF8/ASCIIescape원본재확인(U+FFFD이름0)후정정했다. 잘못된손상경고기대timeout1791907909572는보존.
- 실제Whale5.39.412.57headless `whale-pptx-visual/1791908785569/result.json` executionPassed52쪽,양쪽720×540raw/재표본화없음·독립선택/원본hash불변/외부0/pageerror0/글꼴안내표시. 같은ignored폴더에comparison.html/쪽별PNG·diff/summary.json. normalized텍스트hash51쪽일치·33쪽107대106글자불일치,평균MAE21.5813·픽셀차24초과비율중앙13.5974%,차이큰쪽30/43/41/17/1. Visual최종인수는unverified,폰트원인/내용누락을단정하지않는다.
- 최종check01:29:03시작exit0 **89파일/1,278tests·TypeScript/Vite/MV3/5스킬PASS**, git diff --check PASS. 실제Whale회귀모두exit0:교사제품1791908815500/합성내장1791908835589/PDFfoundation profile-1791908835991. 결과는각기존ignoredcache폴더,모두종료/과거session ID poll금지.
- **다음**:30/43/41/17/1쪽시각차이와33쪽텍스트불일치를본문외부노출없이분석하고원본앱/내보내기조건과원인·대안을판정한다. 이후미지원쪽전환시학생화면보호UX를이어간다. 실제10종(현재원본2/기준PDF1)·효과/실제소리/장시간·물리/coldoffline·StageA~G전체인수는미완료. supported/Stage승격없음,목표유지/커밋·배포·파괴적작업없음.

## 2026-10-14 00:54 이전 구현과 검증
- 이전 goal 개발은 64MiB 확대/실물 검증으로 진전이 있었다. 이번에는 teacher-02의 내장 참조 연결을 해결했다. [계획](../plans/2026-10-14-pptx-embedded-reference.md)/[실물 근거](../pptx/TEACHER_02.md).
- External 호환 참조 Target은 읽지 않고 동일 shape의 명시 p14내부관계·header·sourcehash로 src없는 모델만 보완한다. Internal끼리충돌/모호함/다른kind/위험경로는 거부. 자산owner에Blob추가/part재사용, 기존타이밍binder도같은관계선택+원본/등록파일hash대조유지. 외부접속/원본변경없음.
- 중복메모리개선:동일창/동일불변File ready모델 참조수명공유·마지막dispose해제,원본검사후parserinput transfer,largepart원본size/hash메모리근거후중복rawbuffer해제. 첫동시준비job공유/여러창global메모리예산은아직없다.
- 최종check00:46:59 **88파일/1,272tests·타입/Vite/MV3/5스킬 PASS**. 실제Whale5.39.412.57 headless teacher-02 `whale-pptx-entry-limit/1791906468561/result.json` PASS:52쪽등록/비공개1·26·52·3쪽/57MB MP3 제품등록/native길이3547.92초/실제muted0.215834초진행·Remote정지/PDF복귀/EditorURLbytes0/기존PDF픽셀유지·원본hash불변·외부0/pageerror0. 표본전용browserWorkingSet최대1,568,329,728bytes(약1.46GiB),실최대/누수/저사양보증아님.
- 기존회귀종료/PASS:교사제품1791906537732·합성내장1791906691069·foundation profile-1791906537862. 결과는각기존ignoredcache폴더. 합성내장초기1791906537832는모델공유로사라진중복PPTX읽기를취소시험이기다려timeout했고,실제남은mediahash읽기를대기하도록고쳐통과했다. 메모리초과/STALE_REVISION 초기실패들도 [TEST_RESULTS](../TEST_RESULTS.md)에보존했다.
- 다음: 실제원본의음원·효과/타이밍/전환 및52쪽Visual을기준PDF/원본앱으로검증하고 미지원쪽전환의학생화면보호UX를이어간다. 실제소리/장시간/원본자동타이밍·여러쪽음원/재연결·백업의새원본전체인수와실물10종·물리/최종제품인수는미완료다. supported/Stage완료승격없음. 커밋·배포·파괴적작업없음.

## 이전 방향 감사와 검증 기록(위 최신 상태 우선)
- **최신 teacher-02/64MiB**: 사용자의 32MB 초과 제안에 따라 내장 MP3/WAV/MP4/WebM 항목과 명시 model MIME만 64MiB로 확대했다. 일반32MiB/XML4MiB/총256MiB/입력128MiB/ratio·경로 guard 유지. 52쪽98MB 원본 일반등록/비공개1·26·52·3쪽/Player3쪽·PDF복귀/기존PDF픽셀유지/EditorURLbytes해제0/두원본hash불변 PASS. 내장 MP3 56,779,103bytes를 별도 native metadata로 읽어 길이3547.92초 확인. [원본hash/범위/제한](../pptx/TEACHER_02.md), [계획](../plans/2026-10-13-pptx-large-media.md).
- **별도 남은 문제**: 모델shapeId3/audio/mpeg의src=null로제품내장연결은PPTX_UNOWNED_MEDIA로거부한다. 원본slide3의a:audioFile/rId1은External호환참조,p14/rId2는내장media1.mp3이다. 외부주소/본문로그·접근없이안전한내장관계복원부터설계한다. guard삭제로연결하지않는다. cap확대/원본rawmetadata를제품음원재생완료로세지않는다.
- **최신 검증**:check23:25:55 **85파일/1,239tests·타입/Vite/MV3/5스킬 PASS**. 실제Whale large-mode1791901996577 PASS(등록/모델·일부화면/metadata·해제/보존한정). 표본전용browserWorkingSet합계최대1,552,617,472bytes(약1.45GiB),장시간/저사양/실최대보증아님. 초기2회수동연결실패기록도보존했다. 교사제품1791902089644/합성내장1791902089803/foundation profile-1791902089861 회귀PASS/모두종료. 결과는기존`node_modules/.cache/whale-pptx-entry-limit`·`whale-pptx-player`·`whale-pptx-embedded-media`·`whale-foundation`각폴더. 다음은내장관계연결·중복파싱메모리개선및미지원쪽안전UX다.
- 추가 검증 자료 보관 위치: `C:\ai_dev\apps\naver-ppt\test-materials\originals`에 원본, `test-materials\powerpoint-reference`에 동일 파일명 기준 PDF/PNG/발표 동영상. `.gitignore`로 폴더 전체를 제외한다. 학생 개인정보를 제거한 자료만 사용하고 외부 업로드하지 않는다. 앞서 만든 저장소 밖 빈 폴더는 삭제하지 않았다.
- [방향·충실도 계획](../plans/2026-10-13-pptx-fidelity-continuity.md) 작성. 현재 web-ppt는 실험 경로이며 실제10종/PowerPoint기준 비교 전 최종 엔진선정으로 해석하지 않는다. 현재원본2종/기준PDF1종,추가자료/PowerPoint내보내기환경과발표동작기준은아직없다. 독립 작업은 계속한다.
- **실패 재현 완료**: 합성 정상200ms회전 대조군과20001ms회전. guarded ZIP/XML/공식모델 성공 후 `PPTX_ROTATION_UNVERIFIED`→제품Player SVG0. OOXML 양의duration이며 PowerPoint기준앱/스키마인증은 이번 시험 미실시.
- **신규등록 사전안내 구현**: `behaviorPreflight.ts`/`import.ts`가 회전·확대가 있는 파일만 Worker모델·기존binding검사 실행, 실패쪽/PDF·원본앱 대안 경고. 자산finally해제/취소·모델오류 시source/등록성공 없음. guard 유지, 숨김정답 보호를 위해 자동정적fallback 없음.
- **한계**: 실패쪽을 실제발표하면 여전히 빈표면. Remote전환 보호/대안PDF연결·재검사UI/보고서영속화 미완료. 동일hash재사용/재연결은 정밀검사 재실행하지 않는다. 우선 이 안전UX를 이어서 해결한다. [상세](../pptx/DEGRADATION_PREFLIGHT.md).
- 요구사항 추적표의 '계약만/Whale미검증'을 최신 구현/자동/Whaleheadless/물리남은인수로 정정하고 PRDv5 모든절의범위를 연결했다. Stage완료/지원등급은 올리지 않았다.
- 최종check20:56:58: **84파일/1,211tests·타입/Vite/MV3/5스킬 PASS**. 실제Whale최종degradation1791892903978 PASS:등록전경고/기존PDF선택·픽셀보존/실패쪽빈표면/다음쪽·PDF복귀·5화면overflow0. 기본/380PNG직접확인. 앞선화면폭촬영2회timeout결과는보존, bringToFront+2프레임대기후통과(브라우저내부원인미확정).
- 최종회귀모두종료: 교사제품1791892637890/내장media1791892638006/PDFfoundation profile-1791892956129 PASS. 결과는각`node_modules/.cache/whale-pptx-player`, `whale-pptx-embedded-media`, `whale-foundation`의해당폴더. 교사원본hash불변/pageerror0. 이전sessionIDpoll금지. [실행기록](../TEST_RESULTS.md).

## 먼저 읽기
1. 프로젝트 AGENTS.md와 naver-ppt_PRD_v5.md.
2. 이 파일, docs/CONTEST.md, docs/plans/2026-10-11-product-completion.md.
3. README.md, docs/DEVELOPMENT.md, docs/REQUIREMENTS.md와 변경 영역의 설계·계약·검증 문서.
4. PPTX 작업 시 docs/plans/2026-10-12-pptx-remote-request.md, docs/pptx/PRODUCT_IMPORT.md, docs/pptx/MEDIA_TIMELINE_REFRESH.md.
- 이전 인수인계 전체는 [보존 기록](history/2026-10-13-1853-handoff.md). 오래된 미완료·실행 중 기록보다 이 파일과 실제 코드/결과를 우선한다.

## 현재 구현과 확인 근거
- 핵심: 순수 상태/명령 계층, strict IndexedDB 저장과 revision/중복 검사, Player 소유권, 발표·Editor 선택 분리, 비공개 노트, 원본 불변, 교차 자료 위치 보존, 종료 후 검정 대기.
- PDF: 등록/독립 편집/오버레이/로컬 미디어·자동 넘김/백업·복원/수정 PDF 복사본/종료 경로 구현. 실제 Whale headless 근거가 있으며 물리 환경 전체 인수와 구분한다.
- PPTX: 실험적 opt-in 일반 등록, private Editor/노트/오버레이, Remote 효과 요청·취소·실패 재시도·소진, worker 재시작/자료 교차/새 Player 복원, 백업·원본 재연결 구현 및 제한된 검증.
- 교사 원본은 23쪽·12개 도형 클릭 그룹, 내장 미디어 0개. 원본 내장 미디어 검증 자료로 세지 않는다.
- 합성 내장 WAV/MP4 연결·원본 영역 수동 재생·Remote·위치/설정 보존 구현. 검사한 순차 media-only 5개 원본 클릭 명령을 source-v1 완료 ACK에 연결했다. 도형·미디어 혼합/복합 조건 지원으로 확대 해석하지 않는다.
- 최신 구현: runtime.refreshMediaTimeline 및 PptxView의 동일 runtime 재준비, 준비 공유/늦은 결과 폐기/실행 중 보류, 과거 요청 자동 실행 방지, invalid 설정에서도 완료 cursor 보존·교정 복구. Remote 원본 연결·구간 확인 안내.
- 최신 전체 검사: 2026-10-13 19:12 KST, scripts/dev.ps1 check: 83파일 / 1,201 tests, TypeScript·Vite build·MV3·5스킬 검사 PASS. git diff --check PASS. 방향 점검에서는 코드 변경 없음.
- 실제 Whale 5.39.412.57 headless 최종 결과:
  - node_modules/.cache/whale-pptx-player/1791885072190/result.json: 교사 원본 제품 UI·Remote·편집·백업·복원 회귀 PASS.
  - node_modules/.cache/whale-pptx-embedded-media/1791885072296/result.json: 합성 미디어-only·재준비/실패/복원·과거 action 무실행 PASS.
  - node_modules/.cache/whale-foundation/profile-1791884344131/verification-result.json: PDF foundation PASS. 뒤 PPTX-only 보완 이전 결과이며 해당 경로는 최종 단위/PPTX 검증으로 보완.
  - node_modules/.cache/whale-pptx-owner/1791883548865/result.json: 소유권·worker·새 Player 회귀 PASS.
- 위 검증은 종료됨. 과거 메모의 session ID를 다시 poll하지 않는다. 결과 파일이 실제 존재하는지 이어받을 때 확인한다.

## 방향 점검 결과와 다음 순서
1. **충실도 판단을 우선한다.** 기존 상태·보호 설계는 제품 방향에 맞지만, Stage D 판단 없이 Stage F를 계속 확장하는 것은 위험하다. 후보 비교는 했으나 실제 교사 자료 10종 이상과 PowerPoint 기준 Visual/Media/Behavior 비교가 없다. docs/pptx/INITIAL_COMPARISON.md, TEACHER_01.md를 읽고 현재 renderer의 적합성/제한/대안과 검증 계획을 구체화한다. 제공되지 않은 실물은 합성으로 시작하되 실제 인수로 세지 않는다. 기준 출력·추가 자료가 필요하면 필요한 것만 질문하고 독립 작업은 계속한다.
2. **미지원 효과의 안전 대안 UX를 이어서 구현한다.** 실패재현/신규등록사전안내는 위 최신상태대로 완료했다. 알려진 준비불가쪽으로 전환할 때 현재학생화면 유지·교사확인/대안PDF연결·명시적재검사/재연결경로를 설계한다. 자동정적완성화면은 정답노출위험이므로 금지하고 기존checkpoint/원본/guard를 보존한다.
3. **요구사항 추적을 유지한다.** docs/REQUIREMENTS.md의 오래된 상태는 이번에 정정했다. 각 PRD 요구의 자동·Whaleheadless·물리인수·남은증거를 이후작업에도 갱신하고 Stage체크는 인수근거 없이 완료하지 않는다. 이전 65~70% 완성도는 정량근거 없는 추정이므로 재사용하지 않는다.
4. **검증된 범위에서 PPTX 확장한다.** sourceTimeline의 steps.length>0 일괄 거부를 단순 제거하지 않는다. 도형·미디어 혼합의 duration/delay/trigger/repeat/종료 조건 및 sourceShapeGroups/공식 engine 그룹 대응을 검증하고 ACK·취소·늦은 결과·교차·새 Player·백업까지 연결한다. Player.tsx 공통 useAutoplay는 PPTX를 제외하고 있어 PPTX 자동 넘김 완료로 주장하지 않는다. 렌더러 적합성 판단에 따라 우선순위를 조정한다.
5. **전체 인수를 끝낸다.** 물리 창/듀얼 모니터·DPI·한글 IME·터치·실제 스피커/장시간 다른 앱 focus·OS chooser/downloads·cold offline·비정상 crash·대용량 성능/메모리, Preflight/캐시, Windows Quick Launch/인증 IPC, PPT/SHOW 경로, Canva·미리캔버스 W0 및 개별 고급 기능, 라이선스·패키지·공모전 증거 감사를 원래 계획에 따라 진행한다. PRD에서 검증 후 결정하는 기능은 결과/제한/대안을 근거로 판정한다.

## 작업 경계
- 원본 읽기 전용: C:\Users\서정완\Downloads\[국어]달에서 살아남기_토의 수업_PPT.pptx
- 확인된 SHA256: c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9. 원본 업로드/덮어쓰기 금지.
- 기존 dirty/untracked가 다수(방향 점검 당시 229 entries)다. 삭제·reset·clean·임의 되돌리기 금지. 커밋·배포·파괴적 작업은 별도 요청 전 실행하지 않는다.
- 자체 서버·회원가입·클라우드 DB·자료 업로드·무단 텔레메트리·ONLYOFFICE 런타임 의존성 금지.
- 실제 Whale headless/합성 자료 검증을 물리 사용성·원본 충실도·전체 제품 완료로 바꾸지 않는다.
- 새 세션은 이전 goal 도구 상태에 의존하지 말고 현재 사용자 목표와 실제 파일/코드를 확인해 이어간다.

## 검증과 갱신
- 기본: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check
- 필요한 실제 Whale 검증 스크립트: scripts/verify-whale-pptx-player.mjs, verify-whale-pptx-embedded-media.mjs, verify-whale-pptx-owner.mjs, verify-whale-foundation.mjs. 인자/재현법은 해당 docs/pptx 문서와 보존 기록에서 확인한다.
- 작업별 관련 테스트·빌드·필요한 Whale 검증 후 docs/TEST_RESULTS.md, COMPATIBILITY_MATRIX.md, 관련 계획과 이 파일을 갱신한다. 변경 없는 검사를 불필요하게 반복하지 않는다.

## 2026-10-15 08:45 KST — 실제 웨일 PPTX 시각 비교 도구의 비율 보존 보정

- scripts/verify-whale-pptx-visual.mjs가 PDF/PNG를 720x540으로 강제 왜곡하던 문제를 수정했다. 원본 비율을 유지하고 흰색 letterbox로 정규화하며, raw 캡처 크기와 esampled/정규화 방식을 결과 JSON에 남긴다. 제품 화면 stage의 720x540 검사는 유지했다.
- 실제 네이버 웨일 검증: (7~8쪽)소프트웨어랑 친해지기 교재_학교 홈페이지를 방문해요.pptx와 대응 PDF 1·2쪽, output 
ode_modules/.cache/whale-pptx-visual/1792021417893, xecutionPassed=true, 원본 hash/외부 요청/페이지 오류 이상 없음.
- 전체 scripts/dev.ps1 check: exit 0, 103 test files / 1,422 tests passed, TypeScript/Vite/MV3 build verification passed, 실제 자료 sourceCount=10, pairedCount=10.
- 이 결과는 비율 왜곡 없는 비교 실행 증거다. PowerPoint 원본과의 최종 충실도·폰트·애니메이션·음원·동작 인수는 여전히 사람 검토와 10종 전체 3축 비교 증거가 필요하다.

## 2026-10-15 08:50 KST — 실제 10종 시각 비교 도구 보정 및 대표 실행

- erify-whale-pptx-visual.mjs의 글꼴 경고와 CDP 글꼴 노드 검사를 선택적 진단으로 바꿨다. 자료별 글꼴 메타데이터가 없거나 텍스트가 없는 정상 자료도 화면 비교까지 진행할 수 있다. PDF/PPTX 쪽 수가 다르면 기존처럼 명시적으로 중단하며, 이를 충실도 실패로 세지 않는다.
- 실제 웨일 대표 비교 성공:  1. 2022 연수자료_국어_초등 1·34·67쪽(output 1792021667422), 프로젝트01 나는야 해바라기v2 1·8·16쪽(output 1792021681652), 프로젝트02 바람이 조절되는 선풍기 1·7·13쪽(output 1792021693920). 모두 xecutionPassed=true.
- 사회 자료와 행복한 반 자료는 준비/슬라이드 대기 timeout으로 비교 결과가 생성되지 않았다. 언플러그드 자료는 PPTX 19쪽·기준 PDF 4쪽이라 paired page 수 불일치다. 이 세 결과는 제품 충실도 실패로 판정하지 않고 재시도/기준 출력 정합성 조사 대상으로 남긴다.
- 변경 후 scripts/dev.ps1 check exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials sourceCount=10 / pairedCount=10. 최종 PPTX 지원 승격과 10종 3축 인수는 아직 보류한다.

## 2026-10-15 08:56 KST — 시각 비교 도구의 부분 미지원 기록 경계

- PPTX 미리보기가 준비되지 않는 쪽은 전체 실행을 실패시키지 않고 comparison: unavailable, eason: pptx-preview-not-ready로 결과 HTML/JSON에 기록하도록 보완했다. 이는 빈 화면을 충실도 통과로 바꾸지 않으며, 해당 쪽은 여전히 미검증이다.
- 실제 웨일 재검증: 사회 자료 1·8쪽 whale-pptx-visual/1792021933814, 행복한 반 자료 1·12·23쪽 whale-pptx-visual/1792022000773, 두 실행 모두 xecutionPassed=true, 비교 가능한 대표 쪽과 unavailable 쪽을 함께 기록했다.
- 전체 check 08:55:02 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials sourceCount=10 / pairedCount=10.
- unavailable 쪽, 페이지 수가 다른 언플러그드 자료, osung·이게 정말 나일까의 기준 PDF 정합성은 여전히 최종 충실도 인수의 미해결 근거다.

## 2026-10-15 08:57 KST — unavailable 슬라이드 원인 증거 추가

- 시각 비교 verifier가 unavailable 쪽의 실제 DOM 상태를 함께 기록하도록 했다. 사회 자료 1쪽 재실행 `whale-pptx-visual/1792022129869`에서 host는 존재하지만 `shadowChildren=0`, `svg=false`, `slideId=null`이었다. 이는 해당 쪽 PPTX 비공개 미리보기가 생성되지 않은 증거이며, 시각 충실도 통과로 세지 않는다.
- 변경 후 전체 `scripts/dev.ps1 check` 08:56:13 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials `sourceCount=10` / `pairedCount=10`.
- 다음은 이 자료의 XML/model preflight 결과와 미리보기 미생성 원인을 연결해, 지원 가능한 대안 PDF로 안전하게 전환할 때 학생 화면을 보존하는 경계를 확인하는 작업이다. 원본 덮어쓰기·자동 전환은 하지 않는다.

## 2026-10-15 09:02 KST — 자료별 inspection 스크립트 전제 확인

- 기존 `verify-whale-pptx-inspection.mjs`를 사회 자료에 실행했으나 `원본 XML 순서에서 23쪽` 같은 teacher-01 전용 assertion에서 중단됐다. 제품 실패 근거로 쓰지 않고, 자료별 일반화가 필요한 검증기 결함으로 분류했다.
- `verify-whale-pptx-owner.mjs`도 23쪽 기대값을 고정하고 있어 사회 자료의 실제 8쪽을 검사하지 못했다. 이 스크립트 결과는 지원 판정에 사용하지 않는다.
- 사회 자료의 실제 웨일 시각 결과 `1792022129869`는 preview host는 있으나 shadow DOM이 비어 있는 상태를 기록했다. 화면 보호 메시지와 현재 발표 보존 경계는 유지한다.
- 다음은 teacher-01 전용 assertion을 제거한 자료별 XML/model inspection verifier를 별도 작성해, 슬라이드 수·경고·미리보기 생성 여부를 동적으로 기록하는 작업이다.

## 2026-10-15 09:08 KST — 사회 자료 XML 구조 확인

- 원본 PPTX의 `ppt/slides/slide1.xml`~`slide8.xml`을 읽어 동적으로 집계했다. 각 쪽은 `p:sp` 14~37개와 `p:grpSp` 2~11개를 사용하고, 표/graphicFrame/oleObj는 없으며 media 관계는 5~20개다.
- 실제 웨일 preview가 비는 자료도 ZIP/슬라이드 순서와 source-sharing/등록 단계는 통과한다. 따라서 현재 근거는 입력·등록 실패가 아니라 그룹/미디어를 SVG로 만드는 private preview 경로의 미생성 가능성을 가리킨다. 아직 특정 요소 하나의 원인으로 단정하지 않는다.
- 이 자료는 학생 발표 화면을 바꾸지 않고 원본을 보존하는 현재 경계를 유지한다. 지원 승격이나 자동 PDF 전환은 추가 동작·인수 전까지 하지 않는다.

## 2026-10-15 09:10 KST — 미리보기 상태의 명시적 DOM 경계

- `RegisteredPptxPreview`가 host에 `data-preview-state`를 기록하도록 했다: `preparing`, `ready`, `unavailable`, `unavailable-slide`, `idle`. 실패 시 발표 화면/원본/세션을 건드리지 않는 기존 status 문구와 함께 교사가 확인할 수 있는 기계 판정 경계를 제공한다.
- 자동 회귀: `scripts/dev.ps1 check` 08:58:20 exit 0, 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 실제 웨일: `verify-whale-foundation.mjs` 09:10 PASS (`profile-1792022311211`). 학생 화면 연속성, Player 소유권, 미디어·영상·백업·재시작·380px 경계를 유지했다. 합성 입력/Headless 제한은 결과에 남겼다.
- 실제 사회 자료의 unavailable 원인을 이 상태 경계와 연결하는 일반 inspection verifier는 다음 단계다. PPTX 지원 승격은 보류한다.

## 2026-10-15 09:01 KST — inspection verifier 동적 자료 경계

- `scripts/verify-whale-pptx-inspection.mjs`의 등록 항목 수·경고 수·슬라이드 수·모델 요소/효과 수·private preview 쪽 수를 고정값 대신 화면에서 읽도록 바꿨다. 미리보기 준비 실패는 unavailable 상태와 세션/학생 화면 보존으로 기록한다.
- 사회 자료를 이 검사기에 넣었을 때 성공 status를 기다리던 기존 경계에서 `미리보기를 준비했습니다`가 오지 않는 실제 자료 특성이 확인됐다. 결과를 성공으로 위장하지 않고 unavailable 분기로 남겼다. 검사기는 여전히 일부 teacher-01 전용 후속 단계가 있어 완전한 공통 검증기로 승격하지 않았다.
- 변경 후 `scripts/dev.ps1 check` 09:00:05 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.

## 2026-10-15 09:04 KST — 자료별 동적 inspection 실제 웨일 결과

- `verify-whale-pptx-inspection.mjs`가 자료별 동적 결과를 출력한다. 국어 67쪽 자료 `whale-pptx-inspection/1792022427288`에서 등록 11항목/3 pass/5 warning, 모델 67쪽·3,260요소·효과 29쪽/201개, private preview 67쪽 중 5쪽 unavailable, 세션·학생 화면·원본 hash 보존, 외부 요청 0·pageErrors 0을 확인했다.
- 사회 8쪽 자료 `whale-pptx-inspection/1792022609951`에서 등록 11항목/3 pass/1 warning, 모델 8쪽·225요소·효과 0, private preview는 `PPTX 미리보기를 준비 중입니다.` 상태로 남았지만 세션·학생 화면·원본 보존을 확인했다. 이는 preview 완료나 충실도 pass가 아니다.
- teacher-01 전용 23쪽/요소 고정 assertion은 제거했고, 미지원/준비중 자료를 성공으로 위장하지 않는다. 일부 후속 단계는 여전히 기존 교사용 시나리오와 공유한다.
- 변경 후 `scripts/dev.ps1 check` 09:03:42 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.

## 2026-10-15 09:05 KST — private preview 준비 시간 제한

- `RegisteredPptxPreview`에 30초 bounded preparation을 추가했다. 시간이 지나면 내부 controller를 abort하고 `data-preview-state=unavailable` 및 기존 안전 안내를 표시한다. 현재 발표 화면·학생 화면·원본·세션은 유지한다.
- 전체 check 09:04:17 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 실제 웨일 사회 자료 1쪽 재실행 `whale-pptx-visual/1792022666901`은 `executionPassed=true`이며 preview host는 있으나 SVG/slide node가 없어 unavailable로 기록됐다. 시간 제한을 충실도 pass로 해석하지 않는다.
- 이 제한은 장시간 parser의 물리 메모리 해결이나 PPTX 충실도 승격이 아니다. 미디어·모델·원본 보존과 별도 인수로 남긴다.

## 2026-10-15 09:07 KST — 제품 preview 상태와 시각 verifier 상태 정렬

- 시각 verifier가 등록 PPTX preview host의 `data-preview-state`를 함께 기록하도록 연결했다. 사회 자료 1쪽 재검증 `whale-pptx-visual/1792022723220`에서 `previewState=unavailable`, `shadowChildren=0`, `svg=false`가 동일 결과에 남았다.
- verifier `node --check`와 `git diff --check` 통과. 이 추가는 증거 수집 경계만 바꾸며, PPTX 지원 등급·학생 화면·원본 보존 정책은 바꾸지 않는다.
- PRD §25 기준의 성능 WorkingSet, 완전 cold-offline, 장시간, 10종 PowerPoint 3축 전체 비교는 여전히 미완료다.

## 2026-10-15 09:06 KST — unavailable inspection 결과 저장 보강

- 자료별 inspection verifier의 unavailable 조기 종료 경로가 브라우저 context를 닫고 `result.json`을 저장한 뒤 종료하도록 보완했다. 반복 실제 웨일 검증에서 orphan context나 결과 유실이 생기지 않는다.
- `scripts/dev.ps1 check` 09:06:23 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 이번 보강은 검증기 수명/결과 보존만 바꾸며, PPTX 지원 등급·학생 화면·원본 데이터는 변경하지 않는다.

## 2026-10-15 09:09 KST — 최종 인수 감사표 최신화

- `docs/ACCEPTANCE_AUDIT.md`의 Visual/Media/Behavior와 테스트 결과 행을 최신 실제 자료 10종 source-sharing, 대표 Whale visual, 자료별 inspection(`1792022427288`, `1792022609951`), 사회 preview unavailable(`1792022723220`) 근거에 맞췄다.
- 상태는 전체 제품 미완료·PPTX unverified를 유지한다. 10종 PowerPoint 기준 3축 전체 비교, 물리/cold-offline/장시간, WorkingSet 성능 예산은 아직 충족하지 않았다.

## 2026-10-15 09:12 KST — WorkingSet 재측정기 전제 불일치

- 실제 고요한 우연(1) 자료로 `verify-whale-pptx-entry-limit.mjs`를 재실행했으나 `result.json`에 WorkingSet/peak가 생성되기 전에 특정 오류 문구를 30초 대기하다 중단됐다(`whale-pptx-entry-limit/1792022824057`).
- 이번 실행은 성능 PASS/FAIL 근거로 세지 않는다. 기존 1.5GiB 초과 결과와 성능 미완료 판정은 유지하며, 기준 상향·강제 GC·품질 저하는 하지 않는다.
- 다음 성능 작업은 등록/준비 상태를 동적으로 판정한 뒤 WorkingSet 수집 단계로 들어가도록 verifier를 일반화하는 것이다.

## 2026-10-15 09:15 KST — 실제 WorkingSet 재측정 결과

- 실제 네이버 웨일 `verify-whale-pptx-entry-limit.mjs --media64`를 `고요한 우연(1)` 98MB 자료로 실행했다. 결과 `whale-pptx-entry-limit/1792022880826`, `pass=false`, sampled peak `1,735,835,648 bytes`로 기존 1.5GiB 실험 기준을 초과했다.
- 같은 실행에서 PPTX 등록/모델·미디어 경로는 진행됐고, 원본 hash 불변, 외부 요청 0, 페이지 오류 0을 확인했다. 이는 기능 동작 증거이지 성능 인수 통과가 아니다.
- 기준 상향·강제 GC·화질/음질 저하는 하지 않았다. 전체 origin 예산·물리 메모리 인수는 미완료로 유지한다. 앞선 default 모드 timeout은 별도 verifier 전제 문제이며 이번 측정값과 섞지 않는다.

## 2026-10-15 09:10 KST — private preview 명시적 재시도 UX

- `RegisteredPptxPreview`에 같은 원본으로 private preview를 다시 준비하는 버튼을 추가했다. `unavailable` 또는 `unavailable-slide` 상태에서만 나타나며 source vault/원본 파일을 다시 읽어 새 preview 시도만 수행한다. 발표 선택·학생 화면·세션·원본은 변경하지 않는다.
- 전체 check 09:09:09 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 실제 Whale foundation `profile-1792022958549` PASS. 학생 화면 연속성·Player 소유권·미디어/영상·백업/재시작·380px 회귀를 유지했다. 이 결과는 합성/Headless 범위이며 실제 PPTX 충실도 승격 근거는 아니다.

## 2026-10-15 09:14 KST — unavailable 자료의 재시도 UI 실제 검증

- 시각 verifier가 unavailable 결과에 재시도 버튼 존재 여부를 기록하도록 했다.
- 실제 웨일 사회 자료 1쪽 `whale-pptx-visual/1792023016199`에서 `previewState=unavailable`, `shadowChildren=0`, `svg=false`, `retryButton=true`를 확인했다. 실행 자체는 `executionPassed=true`이며 비교 unavailable은 그대로 유지한다.
- 변경 후 전체 `scripts/dev.ps1 check` exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 재시도는 private preview만 대상으로 하며 학생 발표 화면·현재 자료·원본을 자동 전환하지 않는다.

## 2026-10-15 09:16 KST — 재시도 동작 실제 확인

- 시각 verifier가 unavailable 상태에서 재시도 버튼을 클릭하고 host 상태가 `preparing`으로 돌아가는지 확인하도록 확장했다.
- 실제 웨일 사회 자료 1쪽 `whale-pptx-visual/1792023065832`: `retryButton=true`, `retryTriggered=true`, 원래 비교 결과는 unavailable, 실행 `executionPassed=true`. 재시도 후 preview 완료를 성공으로 가정하지 않는다.
- verifier `node --check`와 `git diff --check` 통과. 제품 전체 check와 foundation 회귀는 직전 변경에서 통과했으며, 이번 변경은 검증기만 수정했다.

## 2026-10-15 09:18 KST — 성능 감사표 최신 수치 정렬

- ACCEPTANCE_AUDIT와 TECH_SPIKES에 최신 실제 --media64 sampled peak 1,735,835,648bytes 및 FAIL 결과를 반영했다. 기존 1.5GiB 기준과 전체 origin 예산 미확정 판정은 유지한다.


## 2026-10-15 09:22 KST — 프로젝트 자료 inspection 전제 추가 확인

- 동적 inspection verifier를 `프로젝트01 나는야 해바라기v2.pptx`에 실행했으나 글꼴 취소 단계에서 `fontLookupStarted > 0` 대기 timeout으로 중단됐다. 이 자료가 제품 실패라는 근거가 아니라, 글꼴 후보가 없는 자료도 처리하지 못하는 검증기 전제로 분류한다.
- 같은 자료는 앞선 visual verifier 대표 쪽 비교 `1792021681652`에서 실행 완료했으므로, 이번 inspection timeout과 시각 비교 결과를 혼동하지 않는다.
- 다음 inspection 일반화는 글꼴 후보 0개·모델 warning 0개·미리보기 unavailable을 각각 정상 결과로 기록해야 한다.

## 2026-10-15 09:24 KST — 글꼴 후보 없는 자료의 동적 inspection

- `verify-whale-pptx-inspection.mjs`의 글꼴 취소/timeout 단계를 후보가 있을 때만 실행하도록 일반화했다. 후보가 없으면 `fontLookup=not-applicable-no-font-candidates`로 기록하며 자료 전체 검증을 중단하지 않는다.
- 실제 웨일 프로젝트01 자료 `whale-pptx-inspection/1792023187894`: 등록 16쪽, 10항목/3 pass/3 warning, 모델 16쪽·223요소·효과 0, 글꼴 후보 없음, private preview는 준비 중 상태, 세션·학생 화면·원본 hash 보존.
- 변경 후 `scripts/dev.ps1 check` exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build verification, materials 10/10.
- 이 결과는 해당 자료의 preview 완료나 PPTX 충실도 pass가 아니다. preview 준비 중 상태는 그대로 미완료로 기록한다.

## 2026-10-15 09:14 — 최신 검사 스크립트 포함 전체 체크

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check` exit 0. 프로젝트 스킬·test-materials 10/10 pair·Vitest 103 files/1,422 tests·TypeScript·Vite·MV3 산출물 검증을 통과했다.
- 실제 웨일 PPTX 점검 결과와 최신 WorkingSet 실패는 그대로 유지한다. 이번 체크는 자동 회귀와 빌드의 근거이며, PPTX 최종 충실도·물리 메모리·전체 인수 또는 지원 등급 승격의 근거로 확대하지 않는다.

## 2026-10-15 09:16 — 미리보기 실패 상태 React 경계 보강

- `RegisteredPptxPreview`가 재시도 버튼 조건을 `host.dataset` 직접 조회에만 의존하지 않고 `previewState` React 상태로 함께 관리하도록 수정했다. `unavailable`/`unavailable-slide`에서 재시도 버튼이 안정적으로 표시되며, 재시도는 같은 원본 private preview만 다시 준비한다.
- 실패·취소·슬라이드 오류에서 현재 발표 선택, 학생 화면, 세션, 원본을 변경하지 않는 경계는 유지했다. 실패 문구도 자동 원본 전환을 암시하지 않고 같은 원본 재준비로 명확히 했다.
- 자동 check 09:15:04 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build, materials 10/10. 실제 웨일 `whale-pptx-visual/1792023321512`에서 `고요한 우연(1)` 1쪽 실행 `executionPassed=true`.
- 이번 수정은 미리보기 실패 UX와 안전 경계 개선이며, PPTX 충실도·WorkingSet·최종 지원 등급을 승격하지 않는다.

## 2026-10-15 09:17 — PPTX 미리보기 timeout 실패 상태 보정

- `RegisteredPptxPreview`의 30초 timeout이 controller를 abort한 뒤 일반 취소로 분류되어 `preparing` 상태에 남을 수 있던 경계를 수정했다. timeout만 `unavailable`로 전환해 재시도 버튼을 표시하고, 컴포넌트 해제에 따른 일반 abort는 화면을 갱신하지 않는다.
- `scripts/dev.ps1 check` 09:16:17 exit 0: 103 test files / 1,422 tests, TypeScript/Vite/MV3 build, materials 10/10.
- 실제 네이버 웨일 `whale-pptx-visual/1792023388342`에서 `고요한 우연(1)` 1쪽 실행 `executionPassed=true`.
- timeout 경로의 실제 30초 대기는 이번 실기 검증에서 의도적으로 발생시키지 않았다. 수정은 실패 상태 전달 경계이며 PPTX 충실도·WorkingSet·지원 등급을 승격하지 않는다.

## 2026-10-15 09:18 — 열린 원본 합계 한도 테스트 고정

- `tests/unit/sourceVaultCancellation.test.ts`에 SourceVault의 열린 원본 합계 512MiB와 16개 한도를 각각 추가 검증했다. 한도 초과 시 새 원본을 기억하지 않고 기존 원본을 계속 읽을 수 있음을 확인한다.
- 일반 `npm test`는 PATH의 Node v20에서 `node:util.styleText` 누락으로 시작하지 못했지만, 프로젝트 표준 호환 Node24를 선택하는 `scripts/dev.ps1 check`는 103개 파일/1,424개 테스트·TypeScript/Vite/MV3 빌드까지 exit 0으로 통과했다.
- 실제 네이버 웨일 `whale-pptx-visual/1792023453931`에서 `고요한 우연(1)` 1쪽 실행 `executionPassed=true`.
- 이 한도는 열린 원본의 참조·입장 경계이며 전체 브라우저 메모리 예산이나 PPTX 충실도 인수를 뜻하지 않는다. 원본·학생 화면 보존과 기존 성능 FAIL 판정은 유지한다.

## 2026-10-15 09:19 — 열린 원본 참조 한도 상수화

- `src/storage/sourceVault.ts`에 `OPEN_SOURCE_MAX_COUNT=16`, `OPEN_SOURCE_MAX_BYTES=512MiB`를 명시하고 `SourceVault` 한도 검사에서 사용하도록 정리했다. 주석으로 한도가 한 `SourceVault`(일반적으로 한 편집창)의 원본 참조 한도이며 브라우저 전체 물리 메모리 상한이 아님을 고정했다.
- 합계·개수 한도 단위 테스트는 상수를 사용해 1,424개 테스트 중 포함 통과했다. 전체 `scripts/dev.ps1 check`는 exit 0으로 TypeScript/Vite/MV3·자료 10/10까지 통과했다.
- 실제 네이버 웨일 `whale-pptx-visual/1792023492883`에서 `고요한 우연(1)` 1쪽 실행 `executionPassed=true`.
- 동작 한도 자체는 변경하지 않았고, 원본·학생 화면 보존 및 전체 메모리/PPTX 충실도 미완료 판정은 유지한다.

## 2026-10-15 09:20 — 요구사항 추적표에 SourceVault 한도 근거 연결

- `docs/REQUIREMENTS.md` 상단에 FR-003/013 및 PRD v5 §11/16과 창별 SourceVault 한도·기존 원본 보존 테스트의 연결을 추가했다. 전체 메모리 예산·PPTX 충실도 완료 근거로 확대하지 않는다.

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

## 2026-10-15 09:26 — 인수 감사표에 10종 순회 근거 연결

- docs/ACCEPTANCE_AUDIT.md에 10종 실제 웨일 1쪽 순회 결과와 이게 정말 나일까 페이지 불일치 재검증을 연결했다. 실행 성공은 기준 비교·충실도 완료와 분리하고, 전체 3축 인수는 미완료로 유지한다.


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

## 2026-10-15 09:40 — Player 검증기 고정값 재감사

- Player 검증기에서 남은 자료 종속 값은 의도적인 시나리오 쪽 선택(편집 독립·오버레이·효과 checkpoint)뿐이며, 전체 슬라이드 수·효과 그룹 수·대용량 입력은 동적으로 처리한다. 실제 52쪽 결과 `1792024181632`를 다시 기준으로 유지한다.
- 직접 PPTX 전환 차단·준비 실패 시 기존 발표 보존 통합 테스트와 실제 Player 결과를 혼동하지 않도록 지원 등급은 `unverified`로 유지한다.

## 2026-10-15 09:45 — 효과 checkpoint와 DOM 진단 분리

- 실제 Player 결과 `1792024181632`에서 `allOriginalClickGroups=15`, 각 요청의 checkpoint 완료·취소·복원이 통과했다. `effectVisibilityChanged=false`는 검증기에서 수집한 DOM visibility 배열이 달라지지 않았다는 진단값이며 효과 실행·원본 충실도 pass가 아니다.
- 이 값은 학생 화면의 효과 시각 충실도를 미확인으로 남기는 근거로 기록한다. PPTX 지원 등급과 전체 Visual/Behavior 인수는 승격하지 않는다.

## 2026-10-15 09:50 — README 최신 상태·원본 한도 설명 정렬

- `README.md` 상단 테스트 수를 최신 `1,424`개로 정렬하고, 편집창별 열린 원본 참조 한도 `16개·512MiB`가 전체 브라우저 메모리 한도가 아님을 명시했다. 전체 origin byte·물리 메모리·최종 성능 인수 미완료 상태는 유지한다.
- 문서만 수정했으며 코드·원본·빌드 산출물은 변경하지 않았다. `git diff --check` 통과.

## 2026-10-15 09:55 — 최신 번들 실제 Whale foundation 회귀

- `verify-whale-foundation.mjs` 실제 네이버 웨일 5.39.412.57 결과 `PASS`, profile `1792024405807`. 학생 화면 연속성, Player owner/중복 창 차단·Worker 재시작, PDF 저장·복구·종료, WAV/합성 H.264 MP4 재생·전환·checkpoint, autoplay·Remote 닫힘·380px 경계를 확인했다.
- 외부 요청 0 및 원본/편집정보 보존 경계를 포함한다. 제한은 headless 격리 프로필·합성 입력·OPFS picker stand-in이며, 물리 모니터·실제 오디오·다른 코덱·IME/터치·장시간 focus·PPTX 전체 충실도는 별도 미완료다.

## 2026-10-15 09:58 — 비공개 PPTX 미리보기 timeout 경계 추가

- `PptxPrivatePreviewControls`에도 30초 bounded preparation을 추가했다. timeout 시 controller를 중단하고 `PPTX 미리보기를 준비하지 못했습니다... 발표 화면은 유지했습니다.` 상태로 전환하며, 일반 컴포넌트 취소는 조용히 처리한다. 등록 문서의 `RegisteredPptxPreview` timeout과 별도 파일 미리보기 경계를 맞췄다.
- 전체 `scripts/dev.ps1 check` 09:35:01 exit 0: 103 test files / 1,424 tests, TypeScript/Vite/MV3 build, materials 10/10.
- 실제 네이버 웨일 `whale-pptx-visual/1792024510039`에서 사회 자료 1쪽 실행 `executionPassed=true`.
- 실제 30초 timeout 대기는 이번 회귀에서 의도적으로 발생시키지 않았다. PPTX 충실도·WorkingSet·지원 등급은 승격하지 않는다.

## 2026-10-15 10:00 — inspection timeout 대기 대상 보정

- inspection verifier가 전체 Editor status가 아니라 `section.pptx-private-preview`의 status를 대상으로 준비 완료/실패를 기다리도록 보정했다. 다른 사전 점검 status가 먼저 끝나 private preview를 `unavailable`로 오판하지 않게 했다.
- `node --check scripts/verify-whale-pptx-inspection.mjs`, `git diff --check` 통과. 실제 30초 timeout 재실행은 다음 자료별 inspection에서 확인할 항목으로 남긴다.

## 2026-10-15 10:05 — 사회 자료 private preview 최종 실패 상태 재검증

- 보정한 inspection verifier로 사회 8쪽 자료를 실제 웨일에서 재실행했다. `whale-pptx-inspection/1792024566003`, 등록 11항목·모델 8쪽/225요소, 원본 hash·현재 세션·학생 canvas 보존, 글꼴 취소/시간초과 보존을 확인했다.
- private preview는 최종 `unavailable=true`, status `이 쪽을 표시하지 못했습니다. 원본 충실도를 확인할 수 없습니다. 발표 화면은 유지했습니다.`로 기록됐다. 이는 30초 timeout 자체의 단정이 아니라 최종 preview 실패 상태의 실제 증거이며, 자동 전환·정적 정답 노출은 없었다.
- PPTX 충실도 pass나 지원 승격으로 해석하지 않는다.

## 2026-10-15 09:37 — 전체 자동 검증 재실행

- scripts/dev.ps1 check가 exit 0으로 완료됐다. 자료 짝 검사 sourceCount=10, pairedCount=10, Vitest 103개 파일/1,424개 테스트, TypeScript·Vite·MV3 산출물 검사를 통과했다.
- 실제 웨일의 10종 전체 PowerPoint 기준 3축 비교·물리 메모리·cold-offline·장시간 검증은 아직 부족하므로 PPTX 지원 등급과 전체 제품 완료 판정은 유지하지 않는다. 원본과 기존 변경은 보존했다.


## 2026-10-15 09:39 — 실제 웨일 foundation 회귀 재실행

- 네이버 웨일 5.39.412.57 실제 실행 결과 PASS, profile 1792024622331. 학생 화면 연속성, Player 소유권·중복 차단·Worker 재시작, PDF 저장/복구/종료, WAV/H.264 MP4 재생·자동넘김·자료 전환, Remote 닫힘, 380px 경계를 재확인했다.
- 제한은 격리 headless 프로필·합성 입력/OPFS picker stand-in이며, 물리 모니터·가청 출력·다른 코덱·IME/터치·장시간 focus·PPTX 전체 충실도는 별도 미완료다.

## 2026-10-15 09:42 — 2쪽 실제 자료 전체 시각 비교 재검증

- `verify-whale-pptx-visual.mjs`를 `(7~8쪽)소프트웨어랑 친해지기 교재_학교 홈페이지를 방문해요` 2쪽 전체에 실행했다. 실제 웨일 결과 `whale-pptx-visual/1792024668754`, `executionPassed=true`, `comparisonRows=2`, `unavailableRows=0`, PPTX/PDF 쪽 수 2/2, 외부 요청 0, 원본 hash 불변이다.
- 두 쪽 모두 PDF 캡처가 374×540이고 제품 PPTX가 720×540으로 수선되어 MAE 약 117~119, 변경 픽셀 약 0.52~0.55로 기록됐다. 이는 기준 PDF와 제품 출력의 큰 차이를 확인한 결과이며 시각 충실도 PASS나 지원 승격으로 해석하지 않는다. 현재 `visualAcceptance=unverified-needs-reference-environment-and-human-review`를 유지한다.


## 2026-10-15 09:39 — 최신 스냅샷과 자동 검증 정렬

- `docs/tasks/current.md` 상단에 최신 현재 상태 스냅샷을 추가해 과거 `sourceCount=1` 기록과 현재 `sourceCount=10`을 구분했다. 역사 기록은 삭제하지 않았다.
- 정렬 후 `scripts/dev.ps1 check` 09:38:23 exit 0: 자료 10/10, 103 test files / 1,424 tests, TypeScript·Vite·MV3 PASS. 문서 변경으로 기능 판정은 바뀌지 않았다.

## 2026-10-15 09:44 — 페이지 수 일치 자료의 실제 inspection 성공 경계

- 실제 웨일 inspection을 `(7~8쪽)소프트웨어랑 친해지기 교재_학교 홈페이지를 방문해요.pptx`에 실행했다. 결과 `whale-pptx-inspection/1792024717980`, 등록 감지 2쪽·모델 2쪽/27요소, private preview 2쪽·decodedImages 9·unavailableSlides 0, 취소/늦은 결과 차단, 5개 viewport overflow 없음, 외부 요청 0, 원본 hash 불변이다.
- 동일한 verifier에서 사회 자료는 최종 preview unavailable이었다. 따라서 자료별 결과를 분리 기록하며, 이 소형 자료의 preview 성공을 전체 PPTX 충실도 통과로 확대하지 않는다. 글꼴은 candidates 3·resolved 0·unresolved 3으로 기록됐다.

## 2026-10-15 09:47 — 98MB·52쪽 실제 자료 inspection

- 실제 웨일 `verify-whale-pptx-inspection.mjs` 결과 `whale-pptx-inspection/1792024738254`: 52쪽 등록·모델 52쪽/240요소, 50쪽·233개 효과, private preview 52쪽·decodedImages 27·unavailableSlides 0, 5개 viewport overflow 없음, 외부 요청 0, pageErrors 0, 원본 hash와 학생 canvas·세션 보존을 확인했다.
- 글꼴 후보 4종은 로컬 해석 0종·미해결 4종으로 기록됐다. 이 결과는 대용량 자료의 등록/모델/비공개 미리보기와 보존 경계 증거이며, PowerPoint 원본과의 시각·미디어·동작 충실도 전체 인수나 물리 메모리 성능 PASS로 확대하지 않는다.

## 2026-10-15 09:50 — 98MB 자료 성능 예산 재측정

- `verify-whale-pptx-entry-limit.mjs --media64`를 최신 번들·실제 웨일·`고요한 우연(1).pptx`에 재실행했다. 결과 `whale-pptx-entry-limit/1792024769250`, `pass=false`, sampled test-browser Working Set peak `1,734,987,776 bytes`로 1.5GiB 실험 예산을 초과했다.
- 이 결과는 source/preview가 작동해도 물리 메모리 예산은 충족하지 못한다는 최신 근거다. 품질 저하·강제 GC·현재 발표자료 eviction으로 우회하지 않으며, 논리 asset bytes를 물리 메모리 PASS로 해석하지 않는다.

## 2026-10-15 09:41 — 원본 미디어 연결 회귀 확인

- 최신 번들 전체 check가 exit 0으로 완료됐다. 자료 짝 10/10, 103 test files / 1,424 tests, TypeScript·Vite·MV3 build PASS.
- `PptxView`는 검증된 `sourceTimeline`만 `PptxSourceGroupDriver`에 연결하고, 조건·설정·대상 대응 실패 시 원본 트리거를 실행하지 않는다. 실제 52쪽 Player 결과 `1792024181632`의 15개 클릭 그룹·취소·Worker 재시작·복원 근거와 일치한다.
- 복합 조건·동시 실행·seek/trim 조합과 PowerPoint 기준 동작 비교는 여전히 미완료다.

## 2026-10-15 09:46 — 최신 번들 실제 Whale 회귀

- 실제 네이버 웨일 5.39.412.57 `verify-whale-foundation.mjs`가 `PASS`로 완료됐다. 결과 profile `1792024862134`에서 학생 화면 연속성, Player 소유권/중복 차단/Worker 재시작, PDF 저장·복구·종료, WAV/H.264 경로, autoplay·자료 전환·Remote 닫힘·380px 경계를 확인했다.
- headless·합성 입력·OPFS picker stand-in이며 물리 모니터/가청 출력/다른 코덱/IME·터치/장시간 focus/PPTX 전체 충실도는 별도 인수로 남는다.

## 2026-10-15 09:53 — 원본 한도 단위 표기 명확화

- `src/storage/sourceVault.ts`의 창별 원본 한도 오류 메시지를 `MB`에서 실제 이진 단위인 `MiB`로 정정했다. 한도 값(16개·512MiB)과 동작은 변경하지 않았다.
- `scripts/dev.ps1 check` 09:41:51 exit 0: 10/10 자료, 103 test files / 1,424 tests, TypeScript·Vite·MV3 PASS. 실제 웨일 foundation `profile-1792024920122`도 PASS했다.

## 2026-10-15 09:57 — MiB 안내 회귀 테스트 고정

- SourceVault 합계 초과 단위 테스트가 오류 문구의 `16개·512MiB`를 직접 검증하도록 보강했다. 실제 한도·원본 보존 동작은 변경하지 않았다.
- `scripts/dev.ps1 check` 09:41:51 exit 0: 자료 10/10, 103 test files / 1,424 tests, TypeScript·Vite·MV3 PASS. 직전 실제 Whale foundation `1792024920122`는 같은 제품 번들에서 PASS했다.

## 2026-10-15 10:02 — 인수 감사표 문자 오염 정리

- `docs/ACCEPTANCE_AUDIT.md`의 과거 자동 기록에 섞인 제어문자를 제거하고 `verify-whale-foundation.mjs` 표기를 복구했다. 검증 결과나 역사 기록의 의미는 바꾸지 않았다.
- `git diff --check` 통과. 최신 코드 검증 결과는 직전 `scripts/dev.ps1 check`와 실제 Whale foundation PASS를 유지한다.

## 2026-10-15 10:06 — 감사표 최신 성능 근거 정렬

- 감사표 상단 성능 행을 최신 실제 결과 1,734,987,776 bytes / 1792024769250으로 정렬했다. 이전 실행값은 하단 역사 기록으로 보존한다.
- git diff --check 통과. 성능 판정은 여전히 1.5GiB 실험 예산 초과/미완료다.

## 2026-10-15 10:10 — 최신 번들 2쪽 시각 비교 재실행

- 실제 웨일 whale-pptx-visual/1792025038257에서 페이지 수가 일치하는 2쪽 자료를 다시 실행했다. executionPassed=true, 2쪽 모두 비교 가능, 외부 요청 0, 원본 hash 불변이다.
- 기준 PDF와 제품 캡처 종횡비 차이 및 픽셀 차이는 이전 결과와 함께 충실도 미검증 근거로 유지한다.

## 2026-10-15 10:14 — 실제 검증 corpus 재확인

- inventory-test-materials.mjs 재실행 결과 sourceCount=10, pairedCount=10. 실제 PPTX 원본과 동일 stem 기준 PDF 짝이 모두 유지되며 파일은 읽기 전용으로 확인했다.

## 2026-10-15 10:18 — 검증 산출물 존재 감사

- 읽기 전용으로 최신 결과 디렉터리를 확인했다. visual 1792025038257, inspection 1792024738254, entry-limit 1792024769250은 result.json을 보존한다.
- foundation 1792024920122는 verifier 특성상 profile 디렉터리와 콘솔 JSON을 남기며 별도 result.json은 생성하지 않는다. 이를 누락된 실행으로 오판하지 않도록 기록 형식을 구분했다.

## 2026-10-15 10:22 — 시각 비교 결과에 종횡비 진단 추가

- `verify-whale-pptx-visual.mjs` 결과 행에 referenceAspectRatio, productAspectRatio, aspectRatioMismatch를 추가했다. 픽셀 비교를 통과로 바꾸지 않고 기준 출력 형상 차이를 명시적으로 남긴다.
- `node --check`와 `scripts/dev.ps1 check`가 PASS했고, 실제 웨일 2쪽 비교 `1792025133774`도 executionPassed=true·2쪽 비교 가능·외부 요청 0·원본 hash 불변으로 완료됐다.

## 2026-10-15 10:25 — 종횡비 진단 결과 확인

- 실제 결과 1792025133774에서 comparisonRows=2, unavailableRows=0, referenceAspectRatio=0.69259259, productAspectRatio=1.33333333, aspectRatioMismatch=true, executionPassed=true, originalsUnchanged=true를 확인했다.
- 따라서 비교 실행·원본 보존은 통과하지만 기준 출력 형상이 다르다는 사실을 자동 결과로 남긴다. 시각 충실도 PASS로 확대하지 않는다.

## 2026-10-15 10:29 — 시각 종횡비 불일치 집계 추가

- 시각 검증 결과에 aspectRatioMismatchPages 배열을 추가해 불일치 쪽을 상단에서 집계한다. 비교 실행·충실도 판정 로직은 변경하지 않았다.
- node check, 전체 scripts/dev.ps1 check, 실제 웨일 2쪽 실행 1792025180795가 PASS했다. 원본 hash 불변·외부 요청 0을 확인했다.

## 2026-10-16 — 목표 재개 후 현재 스냅샷 정렬

- 상단 스냅샷을 오늘 날짜와 최신 실제 결과로 갱신했다. 자료 inventory는 sourceCount=10, pairedCount=10으로 재확인됐고 원본 파일은 읽기 전용으로 유지했다.
- 종횡비 진단을 포함한 시각 검증 결과와 foundation 결과는 여전히 충실도 unverified/물리 인수 미완료로 기록한다.


## 2026-10-16 01:50 — 목표 재개 후 전체 check

- scripts/dev.ps1 check exit 0: 자료 10/10, 103개 테스트 파일·1,424개 테스트, TypeScript·Vite·MV3 PASS.
- 자동 검증은 실제 PowerPoint 충실도·물리 메모리·cold-offline 인수를 대신하지 않으며 기존 판정을 유지한다.


## 2026-10-16 01:55 — 최신 번들 실제 Whale foundation 재검증

- 실제 네이버 웨일 5.39.412.57 foundation PASS. profile 1792083025987에서 학생 화면 연속성, Player 소유권·중복 차단·Worker 재시작, PDF 저장·복구·종료, WAV/H.264 synthetic playback, autoplay·자료 전환·Remote 닫힘·380px을 재확인했다.
- headless·합성 입력·OPFS picker stand-in이며 물리 환경·PPTX 전체 fidelity·완전 cold-offline은 별도 미완료다.
