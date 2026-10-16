# 검증 실행 기록

## 2026-10-15 — 실제 교사 자료 10종 source-sharing

- `test-materials/originals`의 실제 PPTX 10종을 각각 실제 Whale 5.39.412.57 source-sharing probe에 순차 입력했다. 10건 모두 `pass=true`, 실제 Worker·두 popup 논리 lease·queued 취소/재시도·최종 해제·현재 PDF/세션 보존·원본 hash 불변·외부 요청 0/pageErrors 0을 확인했다. 결과 디렉터리는 `node_modules/.cache/whale-pptx-source-sharing/1792021229850`부터 `1792021303650` 범위에 저장됐다.
- 이는 source 수명·원본 보존 인수의 근거다. `productRendering=false`, `physicalMemoryBytes/modelHeapBytes=null`이며 10종 Visual/Media/Behavior 기준 비교·물리 메모리·최종 PPTX 지원 승격을 뜻하지 않는다.

## 2026-10-15 — 실제 자료 시각 대표 비교

- `고요한 우연(1)`의 1·26·52쪽을 실제 Whale 제품 렌더와 기준 PDF로 비교해 `executionPassed=true`, 3쪽 캡처를 확인했다. 결과는 `node_modules/.cache/whale-pptx-visual/1792021356653`이며 전체 충실도 승격 근거가 아니다.
- 첫 자료는 기준 PDF 렌더 높이 374px와 도구의 고정 720×540 가정이 충돌해 `374 !== 720` assertion으로 중단됐다. 비교 도구를 수정해 수치를 맞추지 않고, 종횡비 조건 미충족으로 남겼다.

## 2026-10-15 — W0 링크 등록 UI

- Editor에 Canva/미리캔버스 HTTPS 링크·자료 이름 입력 UI를 추가했다. URL은 일치 provider 도메인만 통과하고 `REGISTER_DOCUMENT`로 위치 정보만 저장한다. 외부 fetch/탭/로그인/학생 화면 변경은 없다.
- `scripts/dev.ps1 check` 08:34:18 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**. 실제 Whale foundation 회귀는 직전 `profile-1792020795350` PASS를 유지하며, W0 외부 탭 자체는 미실시다.
- 외부 자료 선택 목록이 링크의 저장 제목을 표시하도록 수정했고 `scripts/dev.ps1 check` 08:34:41 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**를 확인했다.
- WebLinkControls 요청 취소 경계를 추가하고 `scripts/dev.ps1 check` 08:35:11 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**를 확인했다. Editor 전환 중 늦은 링크 응답은 반영하지 않는다.
- 세션 ID 변경 시에도 같은 취소 경계를 적용하고 `scripts/dev.ps1 check` 08:35:33 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**를 확인했다.
- 선택한 W0 자료에만 교사용 명시적 새 탭 링크를 추가하고 `scripts/dev.ps1 check` 08:35:54 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**를 확인했다. 자동 외부 이동은 없다.
- UI 변경 뒤 Actual Whale foundation `profile-1792020968729` exit0 **PASS**. 세션/학생 화면·원본 보존, 미디어·종료·재시작·Player 회귀를 재확인했다. W0 외부 링크의 자동 실행·로그인·실제 서비스 발표는 범위 밖이다.
- 승인된 W0 링크의 IndexedDB 저장·재연결 통합 검증을 추가하고 `scripts/dev.ps1 check` 08:36:57 **exit0, 103파일/1,422tests·TypeScript/Vite/MV3 PASS**를 확인했다. 실제 Whale은 기존 foundation PASS를 유지한다.
- 세션 전환 때 W0 링크 입력 URL·제목·서비스 선택을 초기화하고 진행 중 요청을 취소하도록 수정했다. `scripts/dev.ps1 check` 08:38:02 **exit0, 103파일/1,422tests·TypeScript/Vite/MV3 PASS**.
- 해당 변경 뒤 Actual Whale foundation `profile-1792021130487` exit0 **PASS**. 학생 화면·원본 보존·미디어·종료·재시작 회귀를 재확인했다. 외부 W0 서비스 자동 실행은 하지 않았다.

## 2026-10-15 — W0 위치 전용 링크 문서 경계

- Canva/Miricanvas 링크는 `knownSlideCount=null`, 빈 `slideIds`로만 세션에 보존할 수 있게 했다. 가짜 1페이지를 만들지 않고 presented/editor selection은 null로 유지한다. 외부 fetch·탭·발표 승격·권한은 추가하지 않았다.
- `scripts/dev.ps1 check` 08:33:04 **exit0, 103파일/1,421tests·TypeScript/Vite/MV3 PASS**. Actual Whale foundation `profile-1792020795350` exit0 PASS이며 학생 화면/원본 보존·미디어·종료 회귀를 확인했다. W0 외부 탭 자체는 미실시다.

## 2026-10-15 — 전체 check 재검증

- `scripts/dev.ps1 check` 08:32:04 **exit0, 스킬·자료 짝 검사·103파일/1,420tests·TypeScript/Vite/MV3 PASS**. 자료 인벤토리는 `sourceCount=1`, `pairedCount=1`이며 실제 10종 인수와 분리한다. 이번에는 문서/검증 상태 재확인이므로 실제 Whale은 기존 source-sharing 근거를 유지했다.

## 2026-10-15 — W0 링크 영속 레코드 거부

- IndexedDB 통합 검증에서 등록된 세션의 Canva source를 임의 외부 URL로 바꾼 record가 `INVALID_RECORD`로 거부되고 저장된 원본 PDF 세션은 변하지 않음을 확인했다. 첫 실행의 미등록 fixture 오류를 등록 후 변조하도록 수정했다.
- 최종 check08:30:18 **exit0, 103파일/1,420tests·TypeScript/Vite/MV3/5스킬PASS**. W0 실제 탭 실행은 별도 미완료다.

## 2026-10-15 — W0 외부 링크 저장 경계

- `isApprovedWebPresentationUrl`을 추가해 Canva/Miricanvas 세션 링크는 일치하는 HTTPS 도메인 하위 호스트만 허용하고, HTTP·교차 도메인·fragment·사용자명/비밀번호·port·길이 초과를 거부한다. 외부 fetch·탭 실행·권한 추가는 하지 않았다.
- 최종 check08:29:26 **exit0, 103파일/1,419tests·TypeScript/Vite/MV3/5스킬PASS**. 실제 웨일 검증은 외부 W0 탭을 실행하지 않는 저장 경계 변경이어서 별도 실행하지 않고 기존 foundation/source-sharing 회귀 근거와 분리했다.

## 2026-10-15 — teacher-02 대용량 source-sharing

- `whale-pptx-source-sharing/1792020469388/result.json` exit0. 실제 `고요한 우연(1).pptx` 52쪽·98,050,517-byte 자료에서 ready source1/lease2, native retain lease1, final source/jobs/bytes0을 확인했다. source logical asset 92,769,395bytes, 두 popup logical 합 185,538,790bytes다.
- 5종 queued 취소·재시도, 창 종료, 현재 PDF/세션, 원본 hash 불변, 외부 요청0/pageerror0을 확인했다. `physicalMemoryBytes/modelHeapBytes=null`, `productRendering=false`이며 기존 WorkingSet 성능 FAIL은 유지한다.

## 2026-10-15 — 자료 짝 검사 기본 check 연결

- `package.json`의 `check`에 `check:materials`를 추가했다. `scripts/dev.ps1 check`가 스킬 검사 뒤 자료 파일명·크기·기준 출력 짝을 확인하고, 이어 자동 테스트와 빌드를 실행한다.
- 최종 check08:27:34 **exit0, 103파일/1,418tests·TypeScript/Vite/MV3/5스킬PASS**. 자료 인벤토리는 `sourceCount=1`, `pairedCount=1`이며 실제 교사 10종 인수 판정과는 분리된다.

## 2026-10-15 — PRD §25 인수 감사

- `docs/ACCEPTANCE_AUDIT.md`에서 실제 샘플·Whale·Visual/Media/Behavior·오프라인·성능·라이선스·제한·테스트·매트릭스 기준을 현재 증거와 대조했다. 전체 제품은 미완료, PPTX는 `unverified`로 유지한다.

## 2026-10-15 — test-materials 인벤토리 검사

- 읽기 전용 `scripts/inventory-test-materials.mjs test-materials`가 원본 이름·파일 크기·기준 출력 짝만 출력한다. 결과는 `sourceCount:1`, `pairedCount:1`, `고요한 우연(1).pptx`, `98,050,517 bytes`이며 파일 본문·학생 정보는 읽거나 출력하지 않는다. `git diff --check`도 PASS.

## 2026-10-15 — 검증 자료 보관 구조

- `test-materials/README.md`에 원본·PowerPoint 기준 출력의 폴더와 동일 파일명 짝 규칙을 기록했다. 현재 저장소 내 실제 자료는 `고요한 우연(1).pptx`와 대응 PDF 1종이며, 합성 fixture는 실제 교사 자료 인수로 세지 않는다.

## 2026-10-15 — 숫자 회계 경계 후 실제 Whale 재검증

- `whale-pptx-source-sharing/1792020367211/result.json` exit0. Whale 5.39.412.57에서 teacher-01 실제 23쪽 source의 ready/native/final inventory, 두 popup logical sum 11,769,768bytes, queued 5종 취소·재시도·창 종료·현재 PDF/세션·원본 hash 불변을 확인했다. `physicalMemoryBytes`는 null이며 productRendering=false다.

## 2026-10-15 — PPTX 자원 회계 숫자 경계

- `PptxResourceInventory`가 byte를 유한한 0 이상 값으로, lease/blob/url 수를 0 이상 정수로 정규화해 음수·NaN·Infinity·소수 관측값이 회계를 오염시키지 않게 했다. 현재 발표 자료를 거부하거나 eviction하는 정책은 추가하지 않았다.
- `scripts/dev.ps1 check` **exit0, 103파일/1,418tests·TypeScript/Vite/MV3/5스킬PASS**. 실제 Whale 재검증은 회계 순수 함수 경계만 바뀌어 재실행하지 않았으며, 직전 source-sharing/prepared-scene/embedded-media/foundation 결과를 제품 회귀 근거로 유지한다.

## 2026-10-14 — PPTX source 자원 인벤토리

- `resourceInventory`가 queued/preparing/cancelling/ready 수명과 file/raw backing/owned Blob/URL/lease의 숫자만 기록하도록 연결했다. check20:19:57 **103파일/1,417tests·TypeScript/Vite/MV3/5스킬PASS**.
- 실제 Whale5.39.412.57 source-sharing `1791976954035`는 teacher-01에서 ready source1/lease2, native retain 뒤 bytes 불변, 최종 source/jobs/bytes0을 확인했다. 두 격리 시험 realm의 logical asset 합은 11,769,768 bytes이며 전체 origin 한도나 물리 메모리 근거가 아니다. [범위](pptx/RESOURCE_INVENTORY.md)
- prepared-scene `1791976953909`, embedded-media `1791976954047`, foundation `profile-1791977059828`도 exit0이다. 단일 WorkingSet 재측정·origin 예약/수락·model/native heap은 아직 미완료다.

## 2026-10-14 — PPTX native 미디어 URL 대여

- source retain/독립native lease·검증된URL factory를연결해같은ownedBlob의별도URL생성을제거했다. ref/fingerprint/origin·live/Blob ownership을재검사하고native src비우기뒤borrowlease만해제한다. 일반파일ownURL·원본/품질/DB/RPC는유지. check20:02:54 **102파일/1,412tests·TypeScript/Vite/MV3/5스킬PASS**.
- actualWhale5.39.412.57 headless 공유1791975962216은부모lease해제뒤retained owner보존/마지막raw·URL해제PASS,내장1791975962212는같은nativeDOM/reprepare진행·음량/crop/rotation/source5·취소/백업PASS,준비1791975962097은현재PDF/음원/queued취소·실패/ACK유실PASS. PDF profile-1791976075602 PASS. [범위·초기unit대역실패·전체경로](pptx/BORROWED_MEDIA_URL.md).
- 대용량entry-limit1791975862802 model/nativeURL이모두22개/92,769,395bytes로추가56,779,103bytes URL제거를확인했다. muted재생/정지/PDF복귀/원본hash/외부0/pageerror0은작동했지만 **WorkingSet1,734,160,384bytes로기존1.5GiB초과FAIL**. logicalURLbytes감소를물리복제/누수/전체성능해결로확대하지않는다. origin byte예산/전체PRD인수는남는다.
- 교사제품1791976075496도exit0/원본보존/pageerror0으로완료했다. 주요검증은모두종료됐고범위/환경은증거문서를따른다.

## 2026-10-14 — SourceVault 재연결 취소

- optional signal/요청별controller·handle/getFile/validator/broadcast/close·늦은cache반영보호와새연결보존을구현했다. PPTX/PDF/media/내보내기caller에controller를전달,원본/DB/RPC/품질은보존. 최종check19:42:23 **101파일/1,403tests·TypeScript/Vite/MV3/5스킬PASS**.
- 최종actualWhale5.39.412.57 headless 준비1791974738566·PDF profile-1791974738725·내장1791974738719·교사1791974738571 모두exit0. 준비UI의nativequeued validator취소/읽기0/Worker0·현재PDF/음원진행,저장/백업/재연결·원본불변확인. source/get native5경로공유1791974287604 PASS. [범위·중간시험실패·정확한경로](pptx/SOURCE_CANCELLATION.md).
- 이번메모리실험은미실시. 직전WorkingSetFAIL을해결/통과라하지않으며누적byte예산/물리/전체PRD인수는미완료다.

## 2026-10-14 — PPTX 준비 입장 제어

- PRD v5 §6/11/16/24/28/30·FR-003/008·IMPL-T-28. source/등록/점검/재연결validator의heavy경로에같은origin Web Locks exclusive gate를연결했다. queued취소/입장직전검증·active읽기실제완료까지예약,ready동일File lease/현재발표보존·API부재failclosed. check18:56:38 exit0 **100파일/1,395tests·TypeScript/Vite/MV3/5스킬PASS**.
- 최종actualWhale5.39.412.57 headless `whale-pptx-source-sharing/1791972551721` PASS. 실제native popup2창/다른File·nativeWorker/WebLocks에서4종queued읽기0/Worker0·취소가능3종취소/재시도·active읽기전달까지slot·실제invalidZIP실패release·owner닫힘/부재API·readyowner·현재PDF/수업·원본hash/외부0/pageerror0. productRendering=false이며충실도인수아님. [계약·전체경로·중간실패](pptx/PREPARATION_ADMISSION.md).
- 제품회귀 exit0:준비1791972236337·내장1791972236491·교사1791972551567·PDF profile-1791972605104. 교사첫1791972236334의후반disabled버튼timeout은진단보완재시도에서재현되지않아원인미확정이며제품수정으로해결했다하지않는다.
- **성능FAIL:** entry-limit1791972762706 최대1,794,793,472bytes로기존1.5GiB초과. parser1/MP3읽기1·실제muted재생/정지/PDF복귀·원본2hash불변/외부0/pageerror0은작동. SourceVault.get의signal없는validator대기·ready/current/pending모델byte예산/물리·전체PRD인수는남는다.

## 2026-10-14 — Private 임시 버퍼 소비·프로세스 비용 분리

- PRD v5 §11/16/24/28/30·FR-003/008·IMPL-T-28. CDP 확인 프로세스별 WorkingSet/PrivateMemory·Runtime backing/embedder/heap·자산/native·해제뒤1/5초 관측을 추가했다. source opt-in의 검증된 raw/parser asset와 immutable File 미디어 해시 scratch만 소비한다. File/Blob·공유 part/owner·타이밍 근거·품질은 보존한다. check18:36:48 exit0 **99파일/1,387tests·TypeScript/Vite/MV3/5스킬 PASS**.
- **최종 성능 FAIL:** `entry-limit/1791970627466` 최대1,754,501,120bytes(기존1.5GiB초과). 미디어쪽 backing57,146,816bytes로 이전240,204,143/중간113,925,532보다 낮아졌지만 전체 비용은 기준을 초과한다. 종류별 peak renderer1,163,264,000/browser399,851,520bytes·원본두hash불변/외부0/pageerror0·등록/표본화면/parser1/MP3읽기1·muted재생/정지/PDF복귀는 작동. 중간1.625GB표본만 선택해 완료라 하지 않는다. [전체 실패와 범위](pptx/PRIVATE_BUFFERS.md).
- 최종 실제 Whale5.39.412.57 headless 공유1791970913178·준비1791970679795·교사1791970679795·내장1791970874893·PDF profile-1791970885015 모두 exit0/종료. source probe의 transfer API지원/owner·개별·전체취소/재시도·현재PDF/원본 보존, 실제 native/file scratch·타이밍근거/효과/백업 회귀를 확인했다. 내장첫1791970680239는2.134767초fixture의정확한자연종료시점에paused=false를기대해실패. 해당합성coexistence영상만native12초로생성해재생/동일노드조건을유지하고검증했다. 기존2초자연종료fixture/제품/원본은바꾸지않았다.
- 최종 전체52쪽 visual1791970923260 executionPassed=true·원본두hash불변/errors0, decodedRGBA가이전제품기준1791912346260과52/52쪽pixel동일PASS. 기존PowerPoint/PDF·폰트차이와최종원본앱/물리충실도인수는미완료다.

## 2026-10-14 — 검증된 중복 raw 이미지·작은 미디어 해제

- PRD v5 §7/11/16/24/28/30·FR-003/008·IMPL-T-28. exact owned Blob 스트림 대조 후에만 raw 참조를 제거하고 hash/size 근거와 원본 관계·타이밍 검증을 유지한다. 마지막 source owner만 남은 private raw를 정리한다. check18:12:31 **98파일/1,375tests·TypeScript/Vite/MV3/5스킬 PASS**.
- 최종 실제 Whale5.39.412.57 headless source-sharing1791969314525 PASS: teacher-02 이미지1,384,852bytes/작은 음원34,605,440bytes 중복 해제·실제 Worker1·취소/재시도·owner/raw 최종해제·현재PDF/원본 보존. raw/backing 모두9,335,184bytes. 교사1791969513441/준비1791969513438/내장1791969604720 PASS. 내장 검사의 해제 raw 가정 실패1791969513575와 시험 교정을 보존했다.
- **성능 FAIL:** 최종 스트림 entry-limit1791969157618 최대1,712,766,976bytes로 기존1.5GiB 실험기준 초과. parser1/MP3읽기1·재생/정지/PDF복귀/원본hash/외부0/pageerror0은 작동했지만 성능 해결은 아니다. 전역 admission·원본앱/실물10종/물리/전체PRD 인수는 남는다. [상세 결과·경로·한계](pptx/DUPLICATE_PARTS.md).
- 최종 PDF profile-1791969661536 PASS. visual1791969671689은 전체52쪽720×540·원본hash불변/errors0. pixel-regression.json은 이전 제품 기준1791912346260과 decoded RGBA52/52쪽 동일을 확인했다. 기존 PowerPoint/PDF 차이를 해결했거나 최종충실도가 인수됐다는 의미는 아니다.

## 2026-10-14 17:47 — 동일 File 진행 중 준비 공유와 취소 격리

- PRDv5 §6/11/16/24/28/30·IMPL-T-28. 같은창/정확한immutableFile의pending job과작업controller/소비자waiter를분리한다. 한취소는다른소비자를abort하지않고마지막취소만Worker종료. livewaiter의lease예약·최종해제·실패재시도/늦은자산폐기와발행전pending제거로해제된ready재입장을막는다. 기존guards/원본/권한/DB/비공개정보경계유지.
- 최종check17:44:49 exit0 **97파일/1,367tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규5개동시/취소/예약·실패/늦은결과·발행경합. 최종actualWhale공유1791967531723/준비1791967531603 PASS:실제Worker1·첫취소후유지/마지막81자산해제·전체취소/새요청·현재PDF/세션·원본hash불변·외부0/pageerror0. 공유probe는productRendering=false이며렌더충실도증거아님. [정확한범위/경로](pptx/INFLIGHT_SOURCE.md).
- publication세부보완전제품회귀:교사1791967187074/PDF profile-1791967187239/준비1791967187096/내장1791967311807 전부exit0/종료. 최종보완은unit/실제공유/정상준비를다시확인했다.
- **대용량성능FAIL:** entry-limit1791967047533 표본1,624,035,328bytes로기존1.5GiB기준초과. parser1/MP3읽기1·재생/정지/PDF복귀/추적자산0·원본hash/외부0/pageerror0은작동. 이전통과표본만선택하거나새FAIL의원인을공유로단정하지않는다. 전역/서로다른자료admission·raw/hydrated바이너리중복방출·물리/전체PRD는남는다. 커밋·배포·파괴적작업없음.

## 2026-10-14 10:06 — 선택 PPTX 모델·미디어 identity 재사용

- PRDv5 §6/11/16/24/28/30·FR-004/005/008·IMPL-T-28. 선택 자료 하나의 Editor source lease를 페이지 탐색 동안 유지하고 같은 File을 미리보기에 전달한다. 쪽별 overlay draft 경계·자료 변경 해제·취소/늦은 결과 보호를 유지한다. 같은 guarded Blob/File의 성공 signature/hash 숫자만 WeakMap으로 재사용, 모델/참조/소유권과 native metadata 검사는 유지한다. 원본/영속bytes/추가권한·의존성/텔레메트리 없음.
- 최종check09:58:24 exit0 **97파일/1,362tests·TypeScript/Vite/MV3/5스킬 PASS**. 실제 Whale teacher-02 Editor parser4→1/98MB전체읽기5→2, MP3읽기3→1. 두 수정 후 실행 entry-limit1791939374011/1791939705851은1,600,827,392/1,581,264,896bytes로 기존1.5GiB 기준 PASS. 등록/표본화면/음원 muted재생·정지/PDF복귀·추적Editor자산0·원본hash불변·외부0/pageerror0.
- 실제Whale 최종 회귀 전부 exit0/종료: 내장1791939613889/교사1791939760177/PDF profile-1791939760310/준비1791939760176/미지원1791939760290. [정확한 경로·범위·중간 실패와 교정](pptx/SOURCE_REUSE_MEMORY.md). 초기관측1791938834124/lease만 수정1791939042121은 메모리FAIL로 보존. 2초 영상 자연종료 기대 실패와 캐시로 미실행된 read오류 주입은 실제관측/metadata오류 회귀로 교정했다.
- 표본 통과를 hard peak·저사양/장시간·전역 모델 자원한도/전체 PRD 인수로 확장하지 않는다. native preload/화질/음질/기준·GC정책은 바꾸지 않았다. 다음은 다중 자료/동시 준비의 자원 예산·해제, 대안PDF/경합·전체충실도/물리/Stage A~G. 커밋·배포·파괴적 작업 없음.

## 2026-10-14 09:42 — PPTX 직접 전환 차단과 대용량 성능 실패

- SessionHub 저장 큐에서 raw PPTX 활성화/이동/재개와 현재 PPTX 자동 넘김을 거부한다. pending/세션/receipt/발행을 바꾸지 않고 PDF·core 내부 COMMIT은 유지한다. 정상 발표 시험은 Remote UI, owner/metadata 시험은 수동 계약으로 명시해 이행했다. [구현·재현·정확한 결과 경로](pptx/TRANSITION_ADMISSION.md).
- check09:35:17 exit0 **96파일/1,356tests·TypeScript/Vite/MV3/5스킬 PASS**. actualWhale UI1791938154353/미지원1791938154481/교사1791938154371/내장1791938154506/PDF profile-1791938264552/전환계약1791938265086/owner1791938303677/checkpoint1791938332627 모두 exit0/종료. 직접3종·PPTX자동넘김 거부 및 기존 화면/재생·정상 새 경로 확인.
- **성능 FAIL:** 실제 teacher-02의 정상 준비 전환/MP3 재생/정지/PDF복귀는 작동했지만 entry-limit1791938333066 최대1,640,394,752bytes, 단계 관측 추가1791938439233 최대1,620,353,024bytes로 기존1.5GiB 기준 초과·둘 다 exit1/pass=false. 원본hash 불변·외부0/pageerror0·Editor 추적자산0. 표본/공유 renderer CDP 수치를 창별 독립/단단한 peak/누수 확정으로 해석하지 않는다. 기준 상향·강제GC·화질/음질 저하 없음.
- 초기 fixture/union 타입, 과거 checkpoint 응답/고정 revision, owner Worker 형식 실패는 현재 계약에 맞게 수정 후 통과했다. 이전 실패는 보존하고 인수로 세지 않는다. 다음은 대용량 native preload/중복 읽기·자산 소유권/동시 모델 및 해제 예산이다. 계획4 기능만 확인했고5/전체 PRD·물리는 미완료. 커밋·배포·파괴적 작업 없음.

## 2026-10-14 09:26 — Player 준비 표면과 같은 자산의 발표 승격

- PRDv5 §6/8/11/14/24/28/30·FR-004/005/008·IMPL-T-28. 정상 Remote owner 조회/REQUEST → 지정 Player 공개 목표·숨긴 표면 준비 → 동일 DOM/native COMMIT을 연결했다. 준비 중 효과/쓰기/재생/checkpoint를 금지하고 취소/실패·owner 교체·응답 유실을 구분한다.
- 최종check09:31:13 exit0: **95파일/1,351tests·TypeScript/Vite/MV3/5스킬 PASS**. actualWhale UI1791937459793/미지원1791937350812/내장1791937459925/교사1791937273185/PDF profile-1791937147796/수동계약1791937550630 모두 exit0/종료. 최종 owner 조회 역할/strict payload assertion 보완도 포함하며 제품 번들은 같았다. [정확한 경로·범위·실패 교정](pptx/PREPARED_SCENE.md).
- 실제 PDF 픽셀/동일 음원 진행·worker 재시작 유지, 취소/미지원 무전환, 원본 누락 후 PDF 유지/재연결, 검정 대기에서 닫힌 목표 다른 쪽 재개, DOM/video 동일성·native play0·source-v1 cursor5. 원본hash 불변·UI/내장 외부0/pageerror0. 초기 효과 상태 덮어쓰기의 두 회귀 실패는 코드 수정 후 통과했고 재연결 시험 선택 경합도 교정했다.
- 남음: 기존 직접 전환 입장 차단·대안PDF·장기 복구·대용량 동시 메모리·실제10종/물리/전체 PRD. headless를 물리·전체 충실도 인수로 승격하지 않는다. 커밋·배포·파괴적 작업 없음.

## 2026-10-14 08:47 — Player 전환 요청의 저장·소유권 계약

- PRDv5 §6/8/11/14/24/30, FR-004/005/008, IMPL-T-28. [계획](plans/2026-10-14-player-transition-commit.md). ClassSession의optional presentationTransition은요청ID/지정Player context ID/목표문서·쪽/지문/기존발표선택/닫힘/checkpoint숫자표식만저장한다. REQUEST/CANCEL/REJECT는현재발표·미디어·편집을바꾸지않고COMMIT만기존전환규칙으로명시목표를원자확정한다. source-v1표식도지원하고목표/현재선택·지문/완료위치·중요편집경합은무효화한다.
- source/본문/노트/원본bytes/파일경로를pending에추가하지않는다. strict record는optional필드의정확한키/타입·프로토타입·목표대응을검사하고이전필드없는세션/백업도읽는다. SessionRecord/receipt의기존strict IndexedDB CAS를재사용하며schemaVersion1의optional확장이다. 백업새수업복구에서는pending을null로만들어과거요청을자동실행하지않는다. 기존저장파일은수정하지않았다.
- 요청·확정·실패와목표조회는같은session URL/정확한Player context·현재소유권을검사한다. 소유권WebLock을확인부터durable저장응답까지유지하여교체claim과직렬화한다. 취소는같은수업Remote에서과거Player가없어도가능하다. 새Player는이전context요청을확정할수없다. 역할/CAS/중복receipt를우회하지않는다.
- GET_PRESENTATION_TARGET은같은요청의지정Player에만목표쪽public PlayerSnapshot을반환한다. 원본파일명/교사노트는제외,준비용snapshot의run/request·autoplay·timers는비활성화하고media bookmark를paused로투영한다. 실제세션/현재발표를수정하지않는다. 일반Remote/Player의준비consumer·직접명령차단은아직미연결이다.
- 최종check08:46:55시작exit0 **94파일/1,344tests·TypeScript/Vite/MV3/5스킬PASS**, 신규20개는요청보존/닫힌자료명시쪽원자확정·취소/실패/경합/늦은요청·source-v1표식/strict변조·구버전/백업복구/역할/저장실패·중복/CAS·owner교체잠금을검사했다. 초기08:25:28은SessionCommand의Extract허용목록에새종류누락으로타입실패,목록확인후정정했다. 이후중간check들도통과했고최종은strict ownundefined거부/목표조회역할검사를포함한다.
- actualWhale5.39.412.57headless/Node24.19.0 `whale-presentation-transition/1791935221159/result.json` exit0:실제제품RPC/strict DB로요청중PDF선택·픽셀/델타유지·무음WAV재생진행,worker중지/재기동뒤pending·소유권유지,교사/Remote/중복Player의잘못된확정·목표조회거부,취소뒤늦은확정거부/실패응답무전환,새소유Player의과거요청거부,새요청1회확정/중복무재적용·닫힌자료의명시다른쪽재개,새백업수업pending제거/기존수업불변·노트/파일명없는목표투영·원본hash불변/외부0/pageerror0. 오디오시험은자동재생허용의전용headless프로필·무음합성WAV이며실제스피커/일반자동재생허용을뜻하지않는다.
- 초기RPC1791934325780은기본계약PASS,1791934665289/1791934793754는음원추가/소유잠금등중간PASS,1791935115143은목표조회추가후PASS다. 음원첫확장1791934554995는Audio생성자hook을관찰했으나제품은DOM audio를사용해timeout,실제audio요소를관찰하도록정정했고실패파일보존. 최종report의 `playerPreparationIntegrated:false`대로실제표면staging/활성화보호완료로세지않는다.
- 기존회귀모두exit0:미지원전환degradation1791934793901/교사제품1791934793754(23쪽12효과/실제준비UI·독립편집/overlay/worker/백업·재연결·5화면)/PDFfoundation profile-1791934793929(저장/복사본/종료/owner/worker/미디어·자동넘김/정상재시작). 목표조회추가전의동일기존경로회귀이며최종조회경로는위RPC로추가검증했다. 모든handle종료,과거session ID poll불필요.
- 남음: 새계약을Player의실제준비표면/미디어수명/Remote UX·기존직접전환입장에연결,원본누락/변조/worker실패·취소/창닫기/복원·대안PDF/대용량성능/물리/실물10종/최종Visual·Media·Behavior/StageA~G인수. 새메모리benchmark/실제소리/물리인수는이번미실시. 커밋·배포·파괴적작업없음.

## 2026-10-14 08:13 — 리모컨 PPTX 준비 검사와 명시 페이지 활성화

- PRDv5 §8/24/30, FR-004/008, IMPL-T-28. [계획](plans/2026-10-14-pptx-transition-safety.md). Remote의자료발표/선택페이지/이전·다음은목표PPTX 원본을기존vault에서읽고실제 `openPptxRuntime`을분리된DOM에서준비한다. 효과·미디어실행과상태명령은금지하고finally로runtime/자산/표면을해제한다. 실패/취소시전환명령을보내지않고현재학생화면유지·원본재연결/PDF·원본앱안내·명시적재시도를제공한다.
- 성공후최신teacher세션에서현재발표/목표ID·지문·닫힘/쪽순서·완료checkpoint가같은지확인하고최신revision으로1회전송한다. 다른Editor선택/진행bookmark revision만바뀌는것은허용,발표선택/원본/목표경합은거부한다. Remote닫기/취소뒤늦은commit없음. 전송후응답오류에는화면보존확정을주장하지않는다.
- 첫쪽이실패하는자료의정상쪽으로직접가기위해ACTIVATE_DOCUMENT slideId는null(기억쪽)또는명시쪽을허용한다. core/요청validator/준비대상해석이같은쪽을사용해1회commit으로전환한다. 닫힌자료ACTIVATE/없는쪽은거부,REOPEN의기존null 경계는유지한다. 세션/백업schema·원본·권한·의존성변경없음.
- 최종check08:11:11시작exit0 **93파일/1,324tests·TypeScript/Vite/MV3/5스킬PASS**. 신규20개는대상/기억쪽·명시쪽원자전환/폐쇄·없는쪽/원본·현재발표·목표경합/최신revision/취소·준비실패·분리runtime cleanup/쓰기·미디어실행금지를확인한다. 초기02:39:33은기존transport에없는execute를사용한타입오류와action모양오류로빌드실패,기존send/newId/action계약을읽어정정했다. 08:05:40/08:07:32는중간PASS,최종은전송전/후오류고지분리를포함한다.
- actualWhale5.39.412.57headless `whale-pptx-degradation/1791933132393/result.json` exit0:합성20.001초회전의신규등록경고,Remote 준비중취소→nativeWorker종료/늦은결과무반영·PDF픽셀/teacher세션불변,미지원자료발표실패무commit,정상2쪽명시원자전환,미지원이전쪽무commit·기존2쪽유지,PDF복귀/자동정적답노출없음·Editor/Remote5화면overflow0. 앞선1791932923313은전송후오류문구분리전중간PASS다.
- 교사제품 `whale-pptx-player/1791933009519/result.json` exit0:리모컨선택쪽준비UI→실제3쪽전환/23쪽12효과·Remote/overlay/worker/백업·재연결/5화면·원본hash불변/pageerror0. PDFfoundation `profile-1791933010227/verification-result.json` exit0:저장/복사본/종료/owner/worker/미디어/자동넘김/정상재시작. 합성내장1791933010326은중간PASS,최종 `whale-pptx-embedded-media/1791933139442/result.json` exit0는source-v1 완료5그룹에서Remote선택쪽준비UI와실제revision증가/완료위치보존을추가확인했다. 기존WAV/MP4/clip/crop·취소/늦은결과·source그룹재준비/백업/원본hash불변·외부0/pageerror0도통과했다. 모든실행종료,과거session ID poll불필요.
- 이번은정상RemoteUI의선행검사다. background/core의직접명령에대한입장receipt,Player실제준비실패까지현재표면/재생을보존하는staging/commit·대안PDF연결은미완료이며전체graceful degradation완료로세지않는다. 원본Media/Visual/Behavior·실물10종/물리·대용량메모리/전체Stage인수는남는다. 커밋·배포·파괴적작업없음.

## 2026-10-14 02:28 — PPTX 배경 스타일 참조 수정

- PRDv5 §7/24 Stage D/25/30, FR-003/008, IMPL-T-27. [계획](plans/2026-10-14-pptx-background-reference.md). 1쪽의 원본 master는 bgRef1001/bg1, theme 첫 배경은 단색인데 core0.4.5가 index를 배열 길이로 clamp해 마지막 그라데이션을 선택했다. [Microsoft bgRef 규칙](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.backgroundstylereference?view=openxml-3.0.1)을 확인했다. 원본 이미지2개와 PDF 이미지의 크기·위치는 대응했고 배경이 주요 원인이었다. 진단은 기존전체비교1791908785569/first-page-diagnosis.json, 본문/사진 출력 없음.
- `scripts/pptx-background-patch.ts`의 순수 selector와 Vite client/worker transform은0/1000 없음,1..999 fillStyleLst,1001.. bgFillStyleLst의 정확한 항목을 선택한다. 고정 parser 파일/SHA256/3개 교체 지점을 검증하고 다른 배포본은 빌드 실패로 재검토한다. 잘못된 index는 특정 오류를 재전파해 흰색 unsupported 자동 대체를 막는다. node_modules/원본은 수정하지 않는다. 기존 MIT/저작권 원문과 새 MODIFICATIONS 고지를 동봉·빌드검사한다. 새 권한/의존성/서버/폰트 없음.
- 최종 check02:24:58 시작 exit0: **91파일/1,304tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규16개는0/1000·정확한style 선택/범위오류·SHA/경로·변환대상 및 원본코드 불변을 확인한다. 초기01:59:28은path의undefined 타입 오류로실패,빈문자 fallback 후01:59:49 통과. 후속은 배경오류 catch 재전파와수정고지/worker marker검증을추가한최종결과다.
- actualWhale5.39.412.57 headless `whale-pptx-background/1791912319024/result.json` exit0: 실제dist modelWorker에서합성10종 검증.0/1000 none,1/2 일반단색,1001/1002 배경단색,1003 그라데이션,3/999/1004 범위오류는PPTX_MODEL_FAILED. 외부0/pageerror0. 합성은parser범위검사이며원본앱충실도·전체제품인수로세지않는다.
- 합성 초기실패 보존:1791910963270은ready를결과로오해한probe handshake 오류,1791911011324는RGB/HEX 직접비교 오류였다. 명시ready→input와숫자RGB비교로정정했다.1791912227531은유효7종통과후범위오류를상위파서가흰색으로바꾸는실제문제를밝혀catch를보완했다. 성공으로세지않는다. 로컬Python 첫diagnostic의layout/master 역참조 재귀도단방향slide→layout→master→theme로교정했다.
- 최종전체52쪽 `whale-pptx-visual/1791912346260/result.json` exit0/양쪽raw720×540·재표본화없음/학생화면독립/원본2개hash불변/외부0/pageerror0. 1쪽 배경표본5곳은양쪽RGBA255/255/255/255,MAE10.6178→2.1825/차24초과픽셀18.1296%→1.9542%. near-white분포PPTX35.43%→58.47%,PDF58.59%. 전체평균MAE21.5813→21.4190/차픽셀중앙13.5974%→13.3318%. 같은폴더comparison.html/summary.json/source-diagnosis.json. 원본↔제품텍스트hash52쪽일치,PDF만33쪽기호1개차이 유지. 전체Visual은unverified이며특히30/43/41/17쪽폰트·배치차이와원본앱환경은남는다. 앞선1791910846851은catch보완이전중간52쪽결과다.
- 회귀 모두 exit0: 교사제품1791912319303(23쪽/12효과/Remote/독립편집·overlay/worker/백업·재연결/5화면), 합성내장1791912319742(WAV/MP4/clip/crop·source5그룹/취소/늦은결과·재준비/복원/백업), PDFfoundation profile-1791912346550(저장/복사본/종료/owner/worker/미디어/자동넘김/정상재시작). 내장probe에도제품과같은빌드patch를적용했다. entry-limit/degradation probe설정도동일하게연결했으며이번그2개실행은미실시다.
- 물리모니터/IME/실제소리/장시간·저사양/coldoffline/원본앱·실물10종·전체인수는미완료다. 새메모리benchmark는실시하지않았다. 다음은준비불가쪽전환의학생화면보호UX다. 원본/기존변경보존,커밋·배포·파괴적작업없음.

## 2026-10-14 01:50 — PPTX 로컬 글꼴 참조 사전검사

- PRDv5 §9/10/24 Stage C/D, FR-003/008, IMPL-T-27. [계획](plans/2026-10-14-pptx-local-font-preflight.md). 기존guarded XML파싱에optional slide-typeface observer를추가하고신규등록/별도원본점검에`localFonts.ts`를연결했다. 실제slide XML의명시고유명최대64종/각200자,theme token·깨진값은probe제외. FontFace `local(quotedName)`만로드하고document.fonts에추가하지않는다. 서버/추가권한/원격font/원본·저장schema/제품fallback변경없음.
- 결과는candidates/resolved/unresolved/pending/available/truncated숫자·boolean만보고하고원문이름/본문은결과에넣지않는다. 로컬조회실패는warning+대체/줄바꿈위험·기준PDF/원본앱안내,API부재/시간초과·모든 참조확인도unknown이다. 미설치/실제적용・glyph coverage/라이선스/원본일치를보증하지않는다. 상속/theme/embedded적용은미검증이다. timer1500ms·취소listener정리·늦은완료무시,OS/이벤트 루프의정확한시간 상한보증은아니다. 동일hash빠른재연결은미검사와PPTX원본점검경로를명시한다.
- check01:44:44/최종01:50:08시작모두exit0, **90파일/1,288tests·TypeScript/Vite/MV3/5스킬PASS**. 신규10개는dedupe/theme·유효하지않은값제외/64종/실패·API부재/1500ms·늦은완료/사전취소·진행중취소/quoted local string·문서미추가/등록전경고·취소시vault/세션보존이다. 재연결의미검사안내도기존시험에assert했다. localFonts생산번들1,963bytes,실행은명시원본등록/점검때만이며상시font로드/설치없음.
- 선행actualWhale5.39.412.57headless `whale-pptx-visual/1791909685232/result.json` exit0,1/17쪽(2쪽한정):Calibri/MalgunGothic/맑은고딕참조resolved,원본지정명/가짜명unresolved. 같은MV3 CSP/권한으로확인했다. 제품연결후 `1791909913244/result.json` exit0:52쪽자료등록의로컬글꼴위험안내표시/비공개1·17/PDF선택독립/원본2hash불변/외부0/pageerror0. 선택시험을52쪽전체충실도로세지않는다.
- 실제별도파일점검 `whale-pptx-inspection/1791910059593/result.json` exit0:교사23쪽의명시7종lookup실패/경고·후보모델/117개이미지decode·5화면overflow0/실제글꼴진행중취소→늦은결과0/시간초과unknown/PDF픽셀·공개snapshot·세션불변/원본hash불변·외부0/pageerror0. 최초1791909982775는background탭click actionability중1.5초검사종료로버튼detach/timeout,결과PASS아님. failure-summary.json은exec출력에서재구성했음을명시했다. Editor bringToFront·사전scroll후실제버튼focus/Enter로재검증해통과;정확한browser scheduling원인확정아님.
- 교사제품회귀1791909913147/result.json exit0(23쪽/12효과/독립편집·overlay/Remote/worker/백업/재연결/5화면). PDFfoundation profile-1791910026064/verification-result.json exit0(저장/복사본/종료/owner/worker/미디어/자동넘김/정상재시작). 최종 교사제품1791910232777/result.json도exit0이며재연결미검사안내assert와전체회귀를통과했다. 실제물리 환경·font적용/원본 앱·1쪽fill/이미지·실물10종/전체Visual/Media/Behavior·최종Stage인수는미완료. 커밋·배포·파괴적작업없음.

## 2026-10-14 01:38 — 원본 텍스트 대조·실제 적용 글꼴 원인 분리

- Stage D/PRDv5 §7/24/25/30, IMPL-T-27. `scripts/diagnose-pptx-reference.py`가원본presentation의순서/내부관계를검증해a:t본문을로컬정규화하고기존52쪽렌더hash/PDF추출과대조했다. 패키지128MiB/4,000항목/총256MiB/XML4MiB·DTD거부/경로검사를유지하고본문을출력하지않는다. Pillow숫자색상집계/shape종류·fill개수만진단한다. 결과 `whale-pptx-visual/1791908785569/source-diagnosis.json`.
- **원본XML↔제품렌더hash52/52일치**, 원본↔PDF51/52일치. 33쪽은PDF추출에Unicode So(기호)1개가적고기호제외시일치한다. 렌더러텍스트누락근거가아니며실제PDF기호표시/추출mapping차이판정은미완료. NFC/공백제거뒤문자열일치가줄바꿈·폰트·화면충실도보증은아니다. 원본2개hash불변.
- 실제Whale5.39.412.57headless선택쪽1/17/30/33/41/43 진단 `whale-pptx-visual/1791909257887/result.json` exit0,6쪽baseline raw720×540/독립편집/원본불변/외부0/pageerror0. CDP DOM/CSS platformFonts에서모든조사쪽의실제사용은MalgunGothic+Calibri(noncustom)이며원본지정a옛날목욕탕M/강원교육모두Bold와다름을확인했다. CSS computed font-family문자열만으로설치·적용을판정하지않는다. CDP는전용시험환경에서만사용하고제품debugger권한은추가하지않았다.
- 이어 `whale-pptx-visual/1791909344156/result.json` exit0,동일6쪽baseline+**테스트DOM전용MalgunGothic대조군**을별도PNG/수치로기록했다. 원래inline style은finally복원,원본/제품코드/세션설정변경없음. MAE baseline→control:1쪽10.6178→10.5108,17쪽34.9521→16.2223,30쪽35.7419→19.6738,33쪽21.0811→13.8348,41쪽34.9341→22.6387,43쪽35.3242→18.8081. 글꼴선택이차이에영향을준다는대조근거이며전체원인/정확한원본글꼴/제품fallback채택판정아님. 이선택시험은전체52쪽인수로세지않는다.
- 1쪽near-white(RGB각>240)픽셀은PDF58.59%/PPTX35.43%,글꼴대조개선작음. 배경/도형/이미지차이원인진단이남는다. `node --check scripts/verify-whale-pptx-visual.mjs`, Python py_compile/진단실행, git diff --check PASS. 제품src변경없어직전01:29:03의89파일/1,278tests·TS/Vite/MV3/5스킬PASS를유지하며변경없는전체check는반복하지않았다.
- Stage D실제10종·원본앱/내보내기/글꼴환경·최종Visual/Media/Behavior·물리/전체제품인수는미완료. 다음은제품권한확대없이로컬글꼴참조해결가능성을시험하고미해결안내를보완하며1쪽fill/이미지차이와미지원쪽안전전환을이어간다. 커밋·배포·파괴적작업없음.

## 2026-10-14 01:29 — 52쪽 기준 PDF 비교·글꼴 사전검사

- PRDv5 §7/16/24 Stage C/D/25/30, FR-003/008, IMPL-T-27/28. [계획](plans/2026-10-14-pptx-visual-fidelity.md). `fontMetadata.ts`는 원본 typeface 참조/고유명/유효하지 않은 참조/내장font파트의 bounded 숫자 요약을 등록·원본검사·모델 Preflight에 표시한다. 정상 이름은 unknown, 깨진 값/목록 한도는 warning이다. 설치·적용·라이선스·충실도 pass로 승격하지 않는다. 원본/권한/의존성/저장schema 변경 없음.
- 실제 Whale5.39.412.57 headless/Node24.19.0 `node_modules/.cache/whale-pptx-visual/1791908785569/result.json` exit0: 제품 경로 전체52쪽, 양쪽raw720×540·재표본화없음, private선택독립/원본2개hash불변/외부0/pageerror0/등록글꼴안내 표시. 로컬 `comparison.html`·쪽별PDF/PPTX/diff PNG·`summary.json` 생성. 원문 본문은 외부/로그에 보내지 않고 로컬 NFC/공백제거 hash/길이만 비교했다. 최종clip의boundingBox도저장했다.
- 결과: normalized텍스트hash51/52쪽일치, 33쪽107대106글자로불일치(내용누락판정아님). RGB0..255 평균MAE21.5813, 채널차24초과픽셀비율 중앙값13.5974%. 차이큰쪽30/43/41/17/1. PDF Creator는PowerPoint표시이나정확한버전/원본앱화면/내보내기·폰트환경은미확인. PDF BaseFont는MalgunGothic, 원본typeface고유41종(테마포함), 주요원본명칭정상. 로컬Windows InstalledFontCollection 정확한이름조회에서는대상중Calibri/맑은고딕만확인했으며실제선택fallback/라이선스/시각차이원인확정은아니다. 최종Visual인수는unverified.
- 초기1791907263124는720×541재표본화/SVG비표시title포함으로텍스트37쪽일치였다. title/desc를제외한1791908107064는51쪽일치였으나높이오차는남았다. locator경계반올림을명시clip/raw크기assert로교정해최종수집했다. 1791907909572의손상글꼴경고기대timeout은Python CP949 stdout을원본손상으로오판한진단오류였다. UTF8저장/ASCIIescape재확인에서원본U+FFFD이름0임을확인해정정했다. 실패결과보존.
- 회귀모두exit0: 교사제품 `whale-pptx-player/1791908815500/result.json`의23쪽/12효과·Remote/독립편집·overlay/worker/5화면/백업·재연결·원본불변; 합성내장 `whale-pptx-embedded-media/1791908835589/result.json`의WAV/MP4/native·crop/clip·source5그룹/재준비·취소/늦은결과·복원/백업·외부0/pageerror0; PDF `whale-foundation/profile-1791908835991/verification-result.json`의저장/복사본/종료/owner/worker/미디어/자동넘김/정상재시작 PASS. 프로세스종료확인,과거session ID 재poll불필요.
- check01:29:03시작exit0:89파일/1,278tests·TypeScript/Vite/MV3/5스킬PASS, git diff --check PASS. 신규6개는숫자요약/중복명/깨진이름·긴이름·5,000종한도/정상명unknown/부재호환·등록전안내를검사한다. 물리IME/모니터/실제소리/장시간·coldoffline·실물10종/충실도원인해결·전체제품인수는남는다. 커밋·배포·파괴적작업없음.

## 2026-10-14 00:52 — 내장 참조 연결·무음 재생·중복 메모리 해제

- PRDv5P-03/P-07/P-08/§7/11/16/24,FR-003/005/008/013,IMPL-T-27/28. [계획](plans/2026-10-14-pptx-embedded-reference.md)/[teacher-02 최신근거](pptx/TEACHER_02.md). External호환 Target무접근·동일shape의p14내부관계/명시kind/header/sourcehash대조로src누락media만보완. 기존URL/모호한관계/다른kind/충돌/경로를우회하지않는다.
- 자산owner에복원Blob을추가하고같은part를재사용한다. 같은창/동일불변File의ready모델은참조수명으로공유,마지막dispose해제. 원본검사후parserinput은consumeInput옵션으로transfer(기본caller입력보존유지),largepart원본size/hash근거메모리캡처후중복rawbuffer해제. binder는실제등록파일/Blobhash를이독립원본근거와대조한다. 저장schema/권한/라이브러리/원본복제없음.
- 최종check00:46:59시작exit0:88파일/1,272tests·TypeScript/Vite/MV3/5스킬PASS. 신규33개는내부/External호환관계의안전선택/무접근·충돌/누락/변조·모델shape대응/part재사용·해제/취소·readyFile소유권·privatebuffer전송/부분view복사·원본size/hash근거와등록파일불일치를검사. 첫check의삭제후unused import2개는정리후통과.
- 실제WindowsWhale5.39.412.57headless/Node24.19.0 `whale-pptx-entry-limit/1791906468561/result.json` exit0/PASS:teacher-02등록/기존PDF선택·픽셀보존/비공개1·26·52·3쪽/내장MP3 56,779,103bytes제품등록·native길이3547.92초·실제muted재생0.215834초/Remote정지/Player3쪽/PDF복귀/Editor추적BlobURL bytes0/원본hash불변·외부0/pageerror0. 완료는이수동경로범위이며실제스피커/음질·원본자동타이밍/교차쪽음원지원선언아님.
- 메모리:전용browserCDPPID들의WorkingSet합계표본최대1,568,329,728bytes(약1.46GiB),실험1.5GiB이내. 실최대/장시간누수/저사양상한보증은아니다. 초기1791905746809는연결성공뒤1,917,026,304bytes초과,1791905936129는1,637,879,808bytes초과+pausecheckpoint와PDF전환의STALE_REVISION경합으로실패했다. 검증command는같은ID로STALE_REVISION만제한재시도하도록고쳤다. 1791906067536/1791906235727은제품재생성공뒤각1,696,993,280/1,658,781,696bytes초과. 모두실패기록보존/성공으로세지않음. 중복ready모델/전송/largebuffer해제를단계적으로검증했다. 추가diagnosticparse는기본제품시험에서분리했고이전진단시험과직접성능비교하지않는다.
- 기존교사제품 `whale-pptx-player/1791906537732/result.json` exit0/PASS:23쪽/12효과·Remote/취소·실패/worker·독립편집/overlay·백업/재연결·5화면. PDFfoundation `whale-foundation/profile-1791906537862/verification-result.json` exit0/PASS:PDF·비공개/빠른편집·저장/복사본/종료/소유권/worker/미디어·자동넘김/정상재시작.
- 합성내장첫회1791906537832는취소시험이중복PPTX읽기를대기하다timeout했다. ready모델공유로이읽기는생략되므로검증대기점을실제남아있는PPTX-media파일hash읽기로바꿨다. 최종 `whale-pptx-embedded-media/1791906691069/result.json` exit0/PASS:취소·실패/중복재연결·내장WAV/MP4·crop/clip·효과·worker/owner·교차/새Player·source5그룹/재준비/복원·백업/원본불변·외부0/pageerror0 전체회귀.
- 학생정보/문서본문/실제소리는로그·외부AI에보내지않았다. StageD실물10종/전체52쪽충실도·실제소리/장시간·coldoffline/물리·여러창global메모리예산·전체제품인수는미완료. 커밋·배포·파괴적작업없음.

## 2026-10-13 23:38 — 내장 음원·영상 64MiB 확대와 실제 자료 검증

- 사용자32MB초과한도확대제안, PRDv5P-03/P-05/§7/16/24,FR-003/005/013,IMPL-T-27. [계획](plans/2026-10-13-pptx-large-media.md)/[teacher-02최신상태](pptx/TEACHER_02.md). `packageGuard.pptxPartByteLimit`은ppt/media의MP3/WAV/MP4/WebM만64MiB,일반32MiB/XML4MiB유지. isolatedPackage수신과Workerasset의명시MIME한도도일치. 입력128MiB/전체256MiB/ratio1000/경로·활성콘텐츠guard유지. 새권한/패키지/원본변경없음.
- `scripts/dev.ps1 check`23:25:55시작exit0:85파일/1,239tests·TypeScript/Vite/MV3/5스킬PASS. 신규24개는64MiB정확경계/초과/일반·XML·다른경로/다른MIME/ratio/asset전체상한을확인. metadata모의시험은초과항목의output할당0을검사하고,실제수신/57MB모델은아래Whale로검증.
- 실제Whale5.39.412.57headless/Node24.19.0/전용profile `whale-pptx-entry-limit/1791901996577/result.json`exit0/PASS(범위제한):52쪽PPTX일반등록/기존PDF선택·픽셀유지/비공개1·26·52·3쪽/Player3쪽표시·PDF복귀/EditorBlobURL해제0/두원본hash불변/외부0/pageerror0. 별도guarded진단에서내장MP3 56,779,103bytes·native길이3547.92초·fingerprint ef0fe3275d09faa54494deca3a50ffd048496fe9dba63d8b7e7448b8e83c4ad7 확인. 실제음원본문/재생/소리는시험하지않았다.
- **제품음원연결은미완료**:원본slide3의외부호환용audio/rId1과내장p14/rId2가있으나공식모델shapeId3/audio/mpeg의src=null. 기존수동연결guard가PPTX_UNOWNED_MEDIA로거부. 주소/본문을로그·외부접속하지않고원인metadata만기록했다. cap확대/RawNativemetadataPASS를제품재생PASS로세지않는다. 최종script의pass는등록/모델·표본화면/실패제한기록/보존범위다.
- 메모리:해당전용browserCDPSystemInfo.getProcessInfo의PID만PowerShell Get-Process로읽어WorkingSet합계를표본측정. 최종최대1,552,617,472bytes(약1.45GiB),실험1.5GiB범위이내. browser/worker/여러역할renderer합계이며개별MP3메모리수치가아니다. 실최대/누수/저사양인수아님. 초기1791901675856/1791901792300은수동연결기대timeout으로실패했고각1,586,167,808/1,511,288,832bytes를기록했다. 두번째에서UNOWNED_MEDIA진단후guarded raw/native분리시험으로방법변경.실패기록보존.
- 기존회귀모두exit0/PASS:교사제품`whale-pptx-player/1791902089644/result.json`의23쪽/12효과/일반등록·독립편집/overlay/Remote/worker·백업/재연결·5화면;내장`whale-pptx-embedded-media/1791902089803/result.json`의합성WAV/MP4/crop/clip/효과·source미디어5그룹/재준비/취소/복원·백업;PDF`whale-foundation/profile-1791902089861/verification-result.json`의창/저장/복사본/종료·owner/worker/미디어/자동넘김/정상재시작. teacher-01hash불변/외부0/pageerror0.
- 물리 모니터/IME/실제 스피커/장시간 focus·음질/원본 타이밍/52쪽 충실도/lowRAM·cold offline/전체 Stage 인수는 미완료다. 커밋/배포/파괴적 작업 없음. 다음 작업은 외부 접속 없이 내장 p14 관계를 검증해 원본 음원을 연결하는 경로와 중복 파싱 메모리 개선이다.

## 2026-10-13 23:09 — teacher-02 대용량 내장 MP3 반입과 실패 격리

- PRDv5 P-03/P-07/P-08/§7/8/16/24 StageD, FR-003/008/013, IMPL-T-27/28. [teacher-02 원본·기준PDF/hash·재현·제한](pptx/TEACHER_02.md). 실제52쪽PPTX98MB/기준PDF52쪽을확인했으나내장MP3 56,779,103bytes가개별32MiB한도를초과한다. 원본/한도완화없음. source파일은Git제외/전후hash동일.
- 수정전실제Whale `whale-pptx-entry-limit/1791900425545/result.json` PASS: 제품등록이PPTX_ENTRY_LIMIT로거부되고rawcode가화면에나옴. 실패시기존PDF세션/선택/픽셀deepEqual. 두파일로각1/26/52쪽PDF렌더확인.
- 공통Import의해당에러만실패이유·원본/현재발표유지·PDF별도자료/원본앱대안의한국어로변환했다. 다른에러/AbortError는그대로전달. 새권한/라이브러리/저장schema없음.
- `scripts/dev.ps1 check`23:07:45시작exit0:84파일/1,215tests·TypeScript/Vite/MV3/5스킬PASS. 신규4개는알려진한도에러의대안/원인보존·수업불변및다른에러/취소의identity보존을확인한다.
- 수정후실제Whale5.39.412.57headless/Node24.19.0 `whale-pptx-entry-limit/1791900499495/result.json`exit0/PASS:친절한한도/대안고지·PPTX등록0·실패전후전체세션/기존PDF선택·Canvas픽셀동일/기준PDF1·26·52렌더/두원본hash불변·외부0/pageerror0. chooser는fileinput,renderer/Worker/실제파일대역없음. 화면본문/음원/학생정보로그없음.
- `whale-foundation/profile-1791900499535/verification-result.json`exit0/PASS:PDF/비공개편집·노트/빠른Editor/로컬저장재검증·복사본/현재·전체종료/소유권/worker재시작·WAV/MP4·자동넘김·정상재시작전체회귀. 새PPTX전체회귀는공통Import의해당실패메시지외실행경로가불변이므로이번에반복하지않았다.
- **제품의이PPTX수용/3축충실도는미완료(개별항목한도차단)**. PASS는실패격리와PDF대안에한정한다. 실제자료2종/기준PDF1종,10종/PowerPoint기준환경·전체52쪽비교·음원/타이밍·물리/최종인수는남는다. 커밋/배포/파괴적작업없음.

## 2026-10-13 21:04 — 방향 감사·미지원 효과 재현·등록 사전 안내

- PRD v5 P-03/P-08/§8/24 Stage C/D/F, FR-003/008/013, IMPL-T-28. [계획](plans/2026-10-13-pptx-fidelity-continuity.md)/[구현·재현·제한](pptx/DEGRADATION_PREFLIGHT.md). 회전/확대가 있는 신규 입력만 기존 binding 검사를 실행하며 준비 불가 쪽과 PDF/원본 앱 대안을 사전 고지한다. 자동 정적 fallback/기존 guard 삭제 없음.
- 최종 `scripts/dev.ps1 check` 20:56:58 시작 exit0:84파일/1,211tests·TypeScript·Vite·MV3·5스킬 PASS. 신규10개는 준비 실패/성공의 등급 분리·원본 순서/목록 상한·검사 없는 lazy 경로·취소/파서 오류/자산 해제·등록 전 실패의 source/세션 불변을 확인한다. 첫 check는 optional signal 타입 오류로 실패하여 미지정 필드를 생략하도록 고친 뒤 통과했다.
- 실제 Windows Whale5.39.412.57 headless/전용프로필·Node24.19.0. `whale-pptx-degradation/1791892903978/result.json` PASS. 합성 정상200ms 회전은 engine 준비 성공, 양의20001ms 회전은 guarded ZIP/XML/공식 모델 성공 뒤 `PPTX_ROTATION_UNVERIFIED`. 일반 제품 Editor에 실패쪽1/PDF대안 경고가 발표 전 표시되고 기존PDF 선택·Canvas픽셀 동일. 해당쪽 실제활성화는SVG0(아직미해결), 다음쪽 정상표시/PDF명시복귀 PASS, pageerror0. 1920/1366/1280/768/380 폭 가로overflow0/스크린샷 완료, 기본 및380 PNG 직접확인.
- 초기 최소 시험 `1791892538871` PASS. 화면폭 촬영 확장 후 `1791892637983`, `1791892772180`은 screenshot timeout으로 실패; 성공으로 세지 않고 프로필/결과를 보존했다. 두 번째는 초기PNG 성공/첫resize후PNG 실패. 촬영탭bringToFront+2프레임대기 방식으로 바꿔 최종 통과했다. 정확한 브라우저 내부 원인은 미확정이다.
- 기존 제품 회귀: `whale-pptx-player/1791892637890/result.json` exit0: 교사23쪽/12효과·일반Import/독립편집/overlay/Remote/owner/worker·백업/원본재연결·5화면 PASS. `whale-pptx-embedded-media/1791892638006/result.json` exit0: 합성nativeWAV/MP4·설정/crop/clip/회전·media-only5그룹/취소/실패재시도/완료cursor/새Player·동일runtime재준비/백업 및기존회귀 PASS. 양쪽 원본hash불변·pageerror0, 내장시험 외부요청0. 교사 원본 내장미디어0은 합성media검증과 분리한다.
- PDF 기반 최종 `whale-foundation/profile-1791892956129/verification-result.json` exit0/PASS: MV3/독립창/비공개PDF편집·노트/빠른Editor/저장파일대조·현재/전체종료·PDF복사본/CSP/nativeOPFS/readback/독립NodePDFreader/정상재시작·소유권/worker·미디어/자동넘김 회귀.
- 요구사항 추적표의 오래된 '계약만/Whale 미검증'을 실제 코드·기록에 맞춰 정정하고 v5 모든 절의 범위·남은 인수를 연결했다. 실제교사10종/PowerPoint기준·물리모니터/IME/터치/실제스피커·5분focus/OSchooser/downloads/비정상crash/coldoffline/대용량·WindowsBridge/레거시Web/패키지라이선스 최종감사는 남는다. 추가9종/기준자료 로컬경로 질문 중, 임의폴더 탐색/외부업로드 없음.
- 동일hash 재사용/재연결 경로는 이번 정밀검사를 다시 하지 않는다. 보고서 영속화/Remote전환 보호/미지원쪽 대안연결은 후속. Stage완료/전체제품완료/support등급 승격 없음. 커밋·배포·파괴적작업 없음.

## 2026-10-13 18:53 — 발표 중 미디어 재준비와 준비 불가 source 복원

- PRD v5 §11/14/24/25, FR-005/013/014. `runtime.refreshMediaTimeline`이 기존 model/Blob/slots를 재사용하고 refs·설정 입력/준비회차 및 run/request·renderer를 확인한 뒤 source driver를 교체한다. 준비 실패/늦은 결과는 완료 cursor와 native 요소를 보존한다. 새 Player의 준비 불가 source checkpoint는 실행 없는 구조복원 driver로 표시하고 설정 교정 후 같은 runtime에서 회복한다. Remote에 원본연결/미디어구간 확인 안내 추가. [범위](pptx/MEDIA_TIMELINE_REFRESH.md).
- 최종 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check`,18:50:49 시작 exit0. 신규12개/83파일 **1,201tests**·타입/빌드/MV3/5스킬 PASS. 준비 공유/중복·입력 변경·busy/run/request·dispose/늦은 결과·renderer 혼용·실패/회복/새Player 복원 검증. native 실행 없이 mode 교체를 검사하는 composition 시험과 아래 실제 요소 시험을 구분한다.
- 실제Whale5.39.412.57 headless 내장 `node_modules/.cache/whale-pptx-embedded-media/1791885072296/result.json` exit0. Player먼저→과거pending→Editor내장등록→pending 무실행/동일표면→명시취소 후 같은runtime에서5그룹 준비 PASS. 재생 중 음량 변경 재준비에서 같은 연결 native요소·재생0.182305→0.224682초·volume.35 및 완료1 유지. 원본750ms·지연취소/결과저장실패재시도·5native명령/source-v1완료·소진/새Player0호출 PASS.
- 같은 실행에서 사용자clip start1로 원본playFrom(.5)가 준비 불가인 상태의 새 Player가 원본화면·완료5를 복원하고, 원본연결/구간확인 안내를 표시했다. clip교정 후 같은표면/runtime에서 회복·native자동play0·완료5보존, source metadata백업 새세션은 standby/paused/완료5/source-v1·run/request null PASS. 이전시험의 마지막 backup assertion은 기존계약 request=null을 undefined로 기대해 실패했으므로 코드 계약을 읽고 기대값을 수정해 전체 재실행했다. 실패프로필 보존.
- 같은 최종내장시험의 원본설정/등록·crop/ellipse/회전·효과/repaint/worker/교차/새Player/백업·role/owner·viewport 전체 회귀 PASS, 외부0/pageerror0/원본hash불변. 교사제품 `node_modules/.cache/whale-pptx-player/1791885072190/result.json` exit0:23쪽12효과·Remote/취소/실패재시도/worker/독립편집·overlay/교차/새Player/백업·5viewport PASS. 앞선 foundation `node_modules/.cache/whale-foundation/profile-1791884344131/verification-result.json` exit0:PDF/미디어/소유권·저장/종료/재시작 PASS. 이후 PPTX-only busy/복원·Remote안내 보완은 최종단위/내장/교사제품으로 확인했다.
- 모든 실행 종료, `git diff --check` PASS. 원본SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`. 원본 업로드/덮어쓰기·권한/패키지·커밋/배포 없음. 원본10종/PowerPoint충실도·혼합/복합조건·trim+playFrom·물리인수·전체StageA~G는 계속미완료.

## 2026-10-13 18:27 — 원본 미디어-only 클릭 그룹의 제품 실행

- PRD v5 §11/14/24/25, FR-005/013/014. sourceTimeline의 원본/등록 자산·전체 branch·전역조건·명시지연/설정 검사, source-v1 driver→PptxView registry endpoint 호출과 직전 출처 재검사, 같은 지문의 occurrence 교체 거부를 연결했다. [범위](pptx/SOURCE_TIMELINE_EXECUTION.md).
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check`,18:21:55 시작 exit0. 신규21개,83파일 **1,189tests**·타입/빌드/MV3/5스킬 PASS. 초기 새 DOM fixture의 this.attributes 타입 오류는 getter/closure로 고쳤다. 명령마다 전체 timing을 재파싱하지 않고 준비별 index를 공유한다.
- 실제Whale5.39.412.57 headless 내장 `node_modules/.cache/whale-pptx-embedded-media/1791883338948/result.json` exit0. 제품 일반Editor opt-in 등록/내장 연결→Remote 버튼→원본750ms지연, 지연중 취소/native 미실행, native 결과 저장실패 후 정지/명시재시도, play/pause/playFrom(.5)/stop/toggle5그룹/source-v1완료·소진 PASS. 영상 최초0.033956초/pause0.234873초/탐색0.534932초/stop뒤0.037761초, 새Player native play0·완료5보존. 기존전체내장·crop/ellipse/회전·worker/교차/백업·role/owner/원본설정 회귀와외부0/pageerror0/원본불변 PASS.
- 교사제품 `node_modules/.cache/whale-pptx-player/1791883338827/result.json` exit0:23쪽12효과·Remote/취소/실패재시도/worker/독립편집/overlay·교차/복원/백업·5viewport PASS.
- 새 시험의 async waitForFunction이 Promise 자체를 truthy로 처리해 완료 전 진행하는 것을 설치 Playwright `coreBundle.js`의 predicate()/if(success)로 확인했다. 실제 native 호출 trace와 완료가 없는 DB를 대조했고 해당 초기 관찰은 저장/실행 완료 근거에서 제외했다. Node에서 응답을 await하고 실제 checkpoint 값을 폴링해 위 결과를 다시 얻었다. 첫750ms취소 시험에는 Remote bringToFront도 적용했다.
- 같은 패턴의 기존foundation6곳/owner1곳도 `scripts/async-browser-state.mjs`로 고쳤다. 최종 foundation `node_modules/.cache/whale-foundation/profile-1791883548564/verification-result.json` exit0:PDF/실제mutedWAV·MP4/자동넘김·위치/종료·백업·소유권·재시작 전체 PASS. owner `node_modules/.cache/whale-pptx-owner/1791883548865/result.json` exit0:role/중복·worker재시작·승계·checkpoint/원본재해시·효과/교차/새Player PASS. 모든 시험 종료 확인.
- 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`, `git diff --check` PASS. 원본 업로드/덮어쓰기·외부 서비스/권한/패키지 추가·커밋/배포 없음. RSI는 fixture타입/전면탭/Promise truthy를 구분하고 재사용 가능한 비동기 검사 원칙을 TEST_PLAN에 기록했다. 전역 하네스 변경 없음.
- 미완료: 발표중 내장미디어 등록 뒤 현재runtime 재준비, 도형·미디어 혼합 타이밍, 여러 미디어 동시 그룹 실증·concurrent/seek/skipTimed·repeat/대상클릭/종료조건, trim+playFrom 시간축, 실제10종/PowerPoint 충실도·원본색·물리 스피커/IME/다중모니터/오프라인/성능·QuickLaunch/PPT/SHOW/웹·전체StageA~G 인수. 합성5그룹을 전체 PPTX 지원으로 승격하지 않는다.

## 2026-10-13 18:00 — native Player endpoint와 과거 미디어 대기

- PRD v5 §11/14/24/25, FR-005/013/014. `PptxNativeEndpoint`와 실제 LocalMediaPlayer 등록·자기 ACK 억제·취소/늦은 commit 정지 보정·교사 새 epoch 소유권·새 Player 과거 source bookmark 정지/위치 보존을 구현했다. [상세](pptx/NATIVE_PLAYER_ENDPOINT.md).
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check`, 17:53:10 시작, exit0. 82파일 **1,168tests**(신규15개)·타입/빌드/MV3/5스킬 PASS. 초기 새 Player 시험은 native만 정지하고 공개 bookmark를 갱신하지 않아 PLAY 거부가 발생했다. 정지 보정 저장과 실패 안내를 추가했다. 이후 nullable bookmark의 명시 guard를 보완해 타입 검사를 통과했다.
- 실제 Whale5.39.412.57 headless `node_modules/.cache/pptx-checkpoint/1791881623150/result.json` exit0. muted WAV 실제 위치 진행/자기 ACK 억제, 새 endpoint 과거 재생 대기·0.600307초 저장 위치 유지, stop/toggle clip 시작, ACK 전 취소·늦은 commit 후 native/DB 정지·정지 ACK 억제, 교사 새 PLAY 유지 PASS. 기존 조건/지연·durable 그룹/재시작 media factory0 회귀도 PASS. `sourceTimelineConnected:false`이며 원본 XML의 제품 자동실행은 아니다.
- 최종 교사 제품 `node_modules/.cache/whale-pptx-player/1791881623063/result.json` exit0:23쪽12클릭·Remote/취소/실패재시도/worker/독립편집·overlay·자료교차/새Player/백업·5viewport·원본불변/pageerror0 PASS.
- 최종 foundation `node_modules/.cache/whale-foundation/profile-1791881623768/verification-result.json` exit0:PDF/실제 muted WAV·MP4/Remote·소유권·백업·종료·재시작 회귀 PASS.
- 최종 내장 `node_modules/.cache/whale-pptx-embedded-media/1791881890233/result.json` exit0:실제 영상 결과0.500538초 commit·Editor/Remote/중복Player 거부, 등록 endpoint가 시작하지 않은 과거 source 결과는 native/저장 상태 정지, source 표식 유지·CANCEL·늦은 결과 INVALID_TARGET·중복 receipt 무재시작·백업 paused/표식 제거 PASS. 기존 원본설정/내장등록·crop/ellipse/회전·효과/repaint/worker·교차/새Player/백업/viewport 전체 회귀, 외부0/pageerror0/원본불변 PASS. `source-settings-controls-380.png`를 직접 열어 내장 연결 영역·문구·수평 넘침 없음을 확인했다.
- 내장 첫 회귀는 취소 직후 위치 저장과 revision이 충돌해 예상 INVALID_TARGET보다 STALE_REVISION이 먼저 반환됐다. 명시 stale만 같은 commandId/최신 revision으로 최대3회 재시도하도록 시험을 보완했다. 최종 코드의 병렬 실행과 이후 단독 실행 모두 동일380px Playwright screenshot 준비 단계(폰트 로드 완료 후)에서30초 timeout이었다. 원인은 확정하지 않았다. 동일 경로 재시도를 중단하고 해당 탭을 foreground로 전환한 뒤 timeout15초의 직접 CDP viewport capture로 변경해 최종 전체 PASS와 PNG 직접 확인을 얻었다. UI/레이아웃 assertion은 유지했다. 모든 실행 종료를 확인했다.
- 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 유지. `git diff --check` PASS. RSI 원인 검토: 이번 실패는 공개 정지 상태 보정 누락, nullable guard, 비동기 checkpoint의 revision 경합과 screenshot 관찰 timeout으로 구분했다. 기존 검증·동일방법 반복 실패 방지 규칙을 유지하며 전역 하네스는 변경하지 않았다.
- 미실시: 원본 타이밍 그룹→endpoint 호출, concurrent/seek/복합조건·실제10종/PowerPoint 충실도·물리 스피커/IME/다중 모니터/최종 인수. Stage A~G 전체 미완료. 원본 업로드/덮어쓰기·커밋/배포 없음.

2026-10-13 09:22 — FR-005/013/014 source native 결과 영속 경계. check09:20:25 exit0 81파일1,153tests·타입/빌드/MV3/5스킬 PASS. 실제Whale내장1791850866864 exit0 소유Player native결과commit/Editor·Remote·중복Player거부/.65volume변경소유유지·취소native정지/늦은결과거부·과거receipt무재시작/백업paused·표식제거 및기존전체회귀 PASS. 교사제품1791850786808/foundation profile1791850786972 exit0 전체회귀 PASS(최종volume-only보완은단위/최종내장으로검증). fixture DBrevision0/테스트helper타입수정, 내장관찰STALE명시거부만3회재시도. 원본불변/외부0/pageerror0/git diff --check PASS. source타이밍호출/자기ACK재적용방지·고급조건/물리·전체인수 미완료. [상세](pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 09:12 — FR-005/013/014 원본 미디어 설정 제품 연결. check09:09:32 exit0:80파일1,131tests·타입/빌드/MV3/5스킬 PASS. 실제Whale 내장1791850286198/result.json exit0: Editor→DB→Player 영상0.10025..1.934267초/.25/muted·구간끝정지/재연결사용자.6보존/백업·제한고지/380px·기존내장전체회귀 PASS. 교사PPTX1791850170029/result.json exit0 23쪽12효과·Remote/취소·재시도·worker/편집/overlay/교차/복원/백업·5viewport PASS. 원본불변/외부0/pageerror0. 초기fixture getter오류 및 UI시험문서선택·null활성화 사전조건 수정. 직접 source-settings-controls-380.png 확인. 원본trigger/concurrent/seek·실제10종·PowerPoint/실물/전체인수 미완료. [상세](pptx/SOURCE_MEDIA_SETTINGS.md).

2026-10-13 09:03 — FR-005/013/014 원본 미디어 전역 제어 검사. `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check` exit0: 79파일1,116tests·타입/빌드/MV3/5스킬 PASS. `verify-whale-pptx-checkpoint.mjs` 실제 Whale5.39.412.57 headless exit0, 결과 `node_modules/.cache/pptx-checkpoint/1791849769204/result.json`: root/main/group/declaration IDs, concurrent/seek/skipTimed 거부, mutedWAV151.4ms후1회·취소/ACK/strictDB/재시작 무재실행 PASS. `git diff --check` PASS, 교사 원본 SHA256 c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9 불변. 제품 경로 미변경으로 기존 제품PPTX1791848744061/내장1791848744172 근거 유지. 원본설정·Player bookmark/원본 자동재생·동시/seek 지원·실제10종/물리/전체인수 미실시. [상세](pptx/NATIVE_MEDIA_ACTIONS.md).

## 2026-10-13 08:53 그룹 내부 명시적 지연과 native 예약

- `scripts/dev.ps1 check`: 78파일/1,098tests·타입/빌드·MV3/5스킬 PASS. 신규18개: 부모/명령 지연합계·불명확/event/추가클릭/after/repeat/duration/unknown 거부, deadline·대기취소/소유권·수락후취소/실패 정리. 초기fixture 배열문법오류는 노드분리로 수정.
- actualWhale5.39.412.57 `verify-whale-pptx-checkpoint.mjs` → `node_modules/.cache/pptx-checkpoint/1791849167813/result.json` exit0 PASS. 생성원본XML50+100ms→150ms/실제mutedWAV150ms후1회실행·수락후취소정지·대기취소native0/onClick거부. 기존 strictDB/source cursor/ACK보류취소/성공유지/재시작 factory0 회귀 포함.
- 제품 runtime에는 아직 이 예약 API를 연결하지 않았다. 제품 경로/화면은 변경없어 직전 내장1791848744172/제품PPTX1791848744061 근거 유지. 모든시험종료. root/seq 전체조건·원본설정·Player bookmark 통합/충실도·물리인수/전체PRD는 미완료. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

## 2026-10-13 08:46 원본 call과 root 선언 대응

- `scripts/dev.ps1 check`: 77파일/1,080tests·타입/빌드·MV3/5스킬 PASS. 신규17개: 명령/선언의 위치·kind/scope/path/hash 대응, 누락/중복·어휘/속성·취소 및 runtime 지연결과/dispose.
- 최종 내장 `node_modules/.cache/whale-pptx-embedded-media/1791848744172/result.json` exit0 PASS: 원본XML playFrom(.25)→root video timingId3/등록경로[2]/자산hash 대응, 중첩media-only선언 거부·전체내장/교사공식12그룹/원본불변/외부0/pageerror0. 제품PPTX `node_modules/.cache/whale-pptx-player/1791848744061/result.json` exit0 전체PASS: 23쪽/12효과·Remote취소/재시도/worker·교차/새Player·편집/overlay/백업/5viewport. 모든 시험 종료.
- source call 준비 API는 원본조건/미디어설정/Player durable bookmark 통합 전이며 자동 실행을 활성화하지 않는다. 전체PRD/물리인수·충실도 미완료. [근거](pptx/NATIVE_MEDIA_ACTIONS.md).

## 2026-10-13 08:40 native 수락 후 durable ACK 취소

- `scripts/dev.ps1 check`: 76파일/1,063tests·타입/빌드·MV3/5스킬 PASS. 신규4개: ACK보류·실패/성공 경계, start내 동기취소, 중첩교체 WAAPI 격리/늦은reject 정리.
- actualWhale5.39.412.57 `verify-whale-pptx-checkpoint.mjs` → `node_modules/.cache/pptx-checkpoint/1791848414351/result.json` exit0 PASS. 실제 muted합성WAV + sourceGroupDriver/durablePlayback/strictDB에서 ACK보류중 재생·취소정지/늦은ACK 정지유지·commit된 완료1복원/다음성공ACK 재생유지. 기존명령/재시작 factory0 회귀 포함. 제품원본timing 미연결.
- 최종 내장 `node_modules/.cache/whale-pptx-embedded-media/1791848397991/result.json` 및 제품PPTX `node_modules/.cache/whale-pptx-player/1791848397880/result.json` 모두 exit0 PASS. 교사23쪽/12효과·전체내장·원본불변/외부0/pageerror0, Remote취소/재시도/worker·교차/새Player/편집/overlay/백업/5viewport 회귀. 모든시험종료. 원본조건·bookmark/Player통합·물리인수/전체PRD는 미완료. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

## 2026-10-13 08:33 원본 미디어 call native 실행기

- `scripts/dev.ps1 check`: 76파일/1,059tests·타입/빌드·MV3/5스킬 PASS. 신규30개: 어휘/범위·소유권·metadata·play/pause/resume/stop/toggle/seek·늦은완료/실패/취소·토글경쟁·dispose.
- actualWhale5.39.412.57 `verify-whale-pptx-checkpoint.mjs` → `node_modules/.cache/pptx-checkpoint/1791848003458/result.json` exit0. muted 합성WAV4초 재생/정지위치/재개/1.25초이동/stop/토글재시작/수락후취소/지연성공취소 PASS. source커서3/shape1·strictDB/재시작factory0 회귀 PASS. 제품원본타이밍 미연결.
- 최종 내장 `node_modules/.cache/whale-pptx-embedded-media/1791848018631/result.json` exit0 PASS: 교사23쪽/공식12그룹·합성순서/전체내장·제품문구/원본불변/외부0/pageerror0. 제품PPTX `node_modules/.cache/whale-pptx-player/1791848018527/result.json` exit0 PASS: 23쪽/12효과·Remote취소/재시도/worker재시작·교차/새Player·편집/overlay/백업·5viewport. 모든 시험 종료. 앞선 foundation1791847220588은 공유core 이후 동작변경 없어 근거유효. 원본조건/native bookmark 통합·물리인수/충실도/전체PRD는 남는다. [범위](pptx/NATIVE_MEDIA_ACTIONS.md).

## 2026-10-13 08:27 원본과 공식 도형 그룹 정확 대응

- `scripts/dev.ps1 check`: 75파일/1,029tests·타입/빌드·MV3/5스킬 PASS. 신규17개는 split/merge/순서/누락/중복·공식 sparse/default clickGroup·bounded 입력·취소·runtime 진단을 확인한다. 초기 fixture optional undefined 타입 오류는 속성 생략으로 수정.
- actualWhale5.39.412.57 내장 `node_modules/.cache/whale-pptx-embedded-media/1791847538767/result.json` exit0 PASS. 교사23쪽 원본12구조/12효과/공식12그룹, 합성3그룹 [null,0,null], 기존 내장/원본불변/외부0/pageerror0.
- 최종 내장 `node_modules/.cache/whale-pptx-embedded-media/1791847630526/result.json` exit0 PASS. Player 대응 여부 문구 DOM 확인·교사12공식그룹·합성[null,0,null]·전체 내장 회귀/원본불변/외부0/pageerror0. 제품PPTX `node_modules/.cache/whale-pptx-player/1791847538660/result.json` exit0 PASS(23쪽/12효과·교차/새Player·Remote취소/재시도/worker재시작·독립편집/overlay/백업·5viewport). 모든 시험 종료. 기존 foundation1791847220588 근거는 공유core 이후 변경 없어 유지한다.
- 원본 조건/지연·동시/seek·native 미디어 action 실행, PowerPoint 기준충실도/물리인수/전체PRD는 미완료. [범위](pptx/SOURCE_GROUP_PLAYBACK.md).

## 2026-10-13 08:20 원본 그룹 완료 커서

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check`: 74파일/1,012테스트·타입/빌드·MV3/5스킬 PASS. 신규20개: media-only 복원/커서, 양쪽 완료/취소/실패 정리, 계약 혼용 거부.
- 실제 Whale5.39.412.57 `verify-whale-pptx-checkpoint.mjs`: `node_modules/.cache/pptx-checkpoint/1791847210123/result.json` exit0. 기존 strict checkpoint/교차/재시작 회귀 및 새 합성3그룹→완료3/도형1·소진·재시작 factory0 PASS. 도형WAAPI/실제IndexedDB 사용, 미디어action은promise로 native 재생 지원 주장이 아님.
- 초기 두 실패는 새 시험 transport가 Player snapshot 대신 teacher session 필드를 읽은 원인. 상세 관측 후 수정했고 제품경로는 변하지 않았다.
- foundation `node_modules/.cache/whale-foundation/profile-1791847220588/verification-result.json` exit0 PASS. PDF/미디어·독립창·저장/복원 기존 전체 회귀. headless/합성/OPFS 대체이며 물리인수 별도.
- 교사PPTX 제품 회귀 `node_modules/.cache/whale-pptx-player/1791847220462/result.json` exit0 PASS: 원본23쪽/12클릭·Remote취소/실패재시도/worker재시작·자료교차/새Player·독립편집/overlay/백업·5viewport·원본불변/pageerror0. 모든 시험 종료. source driver의 제품 native연결·실제 타이밍 의미·충실도/전체PRD 인수는 미완료. [계약](pptx/SOURCE_GROUP_PLAYBACK.md).

## 2026-10-13 08:07 원본 구조 그룹과 모델 효과 대응
- 최종 제품PPTX1791846625302 exit0 PASS. 내장1791846625428/foundation1791846465562 포함 모든시험종료. 교사23쪽/Remote12효과·취소/재시도/worker재시작·교차/새Player·편집/overlay/백업·5viewport/원본불변/pageerror0. 아래실행중메모대체.
- report('ready')가 구조 안내를 덮던 문제 수정 후 check08:10:06 992tests/빌드/MV3 PASS. actualWhale1791846625428 exit0 제품Player구조안내 생성/대기·교사12구조/12효과·합성3구조/shape1/media-only2·기존내장전체/원본불변/외부0/pageerror0 PASS. 1366 발표영역 직접확인. 최초1791846465520 고지timeout 원인/수정 기록은 SOURCE_ORDER.md에 남겼다. 제품PPTX75649만 실행 중, foundation1791846465562 exit0 PASS.
- FR-005/013/014. mainSeq 구조/독립media/seq이전다음·제어metadata, shape개수·대상·종류·시작관계 대응 및 media-only 보존. 제품runtime Preflight/Player 미확인 고지 연결. 신규13개/73파일992tests·빌드/MV3/스킬 PASS.
- 1차 actualWhale1791846343496 exit0: teacher23쪽 원본구조12/모델효과12, 합성3구조·모델효과1/미디어전용2/독립0/실행미확인. 기존내장/타이밍·대상/바이트변조거부/원본불변/외부0/pageerror0 PASS. 제품 연결 후 최종회귀 session15629/46833/13459 실행중.
- 구조그룹은 실제클릭/시간실행의 완전검증이 아니며 원본trigger실행·clip설정·실제10종/물리·전체PRD미완료. [근거](pptx/SOURCE_ORDER.md).

## 2026-10-13 07:58 원본 조건·반복·미디어 자르기 분류
- 최종 제품PPTX1791845808198/foundation1791845808330 회귀 exit0 PASS. 23쪽/12클릭·취소/재시도/worker재시작·교차/새Player·독립편집/overlay/백업·5viewport와 원본불변/pageerror0. 모든시험종료, 아래실행중메모대체.
- FR-005/013/014. cTn 부모/시작·종료 참조/시간/indefinite/반복·역재생 및 p14 trim 검사·Preflight 확장. 신규23개/72파일979tests·빌드/MV3/스킬 PASS(07:57:45). union 추론 오류는 명시 타입으로 보완.
- actualWhale1791845740393/result.json exit0: 합성 반복1/역재생1/종료조건1/trim1/미검증0·ID부모/조건참조, 기존 내장전체/모델ID·바이트변조 거부·Editor검사중세션/학생SVG보존·380px 직접확인/외부0/pageerror0/원본불변 PASS. 교사23쪽 원본에는 미검증 타이밍4 고지. missing ID의 unverified 보완은 단위 검사.
- 원본 trim의 end는 끝에서 제거할 길이로 구분하며 총 길이 정합성/실제 native설정·트리거 실행은 미연결. 제품PPTX session89634/foundation44808 회귀 실행 중. 전체 인수/실제10종/물리 검증은 미완료. [범위](pptx/MEDIA_TIMING.md).

## 2026-10-13 07:48 원본 미디어 대상과 등록 자산 대응
- 최종 내장1791845299247/foundation1791845299672/교사제품PPTX1791845299139 모두 exit0 PASS. 23쪽/Remote12클릭·취소/재시도/worker재시작·교차/새Player·독립편집/overlay/백업·5viewport 및 원본불변/pageerror0 회귀 확인. 모든 시험 종료, 아래 실행 중 메모 대체.
- FR-005/013/014. `bindPptxMediaTimingTargets` 진단 API, 신규19개/71파일956tests·TypeScript/Vite/MV3/스킬 PASS. 원본 순회 순서 오류 수정 및 p14 모의 DOM fixture 보완 후 통과.
- 1차 actualWhale1791845191834/result.json exit0: audio/video/cmd 등록 경로[1]/[2]/[2]와 실제 원본 관계 바이트hash 대응, 모델 대상 제거/원본 바이트변조 거부. 기존 내장회귀/원본불변/외부0/pageerror0 PASS. 최적화 후 최종 내장/제품PPTX/foundation 회귀 실행 중.
- 원본 트리거 실행·Player gate는 아직 미연결. XML 문서 순서는 실행 클릭 순서가 아니다. clip·반복·조건 의미/실제10종·PowerPoint기준/물리 인수 및 전체PRD는 미완료. [상세](pptx/MEDIA_TIMING.md).

## 2026-10-13 07:31 원본 미디어 타이밍 점검
- 최종 07:41 actualWhale1791844808158/result.json exit0 전체 PASS. 380px 실제 뷰포트 두 구간 직접 확인: 긴 문장 정상 줄바꿈/잘림 없음, 제품 CSS 변경 불필요. 87639 캡처 timeout,72223 사전조건 STALE_REVISION은 bringToFront와 명시적 stale만 같은commandId 최대3회 재시도로 보완했다. 모두 종료, 아래 확인 중 메모를 대체한다.
- FR-005/013/014. bounded 원본 검사/숫자 요약/Preflight, 신규28개·70파일937테스트/빌드/MV3/스킬 PASS.
- actualWhale1791844433682 exit0: 합성 audio1/video1/cmd1·조건/설정/여러쪽 고지·제품 Editor 세션/학생 SVG/정지 상태 보존·380px DOM 경계 PASS. 원본 명령 실행은 미연결. 긴 요소 캡처 잘림은 구간 캡처로 재확인 중, 첫 구간 캡처는 백그라운드 timeout 후 bringToFront 보완.
- 교사23쪽/audio-video-cmd0/전체조건20·원본불변/외부0/pageerror0. 제품PPTX1791844300778/foundation1791844300776 회귀 exit0 PASS. 등록 경로/조건 의미/원본 trigger·실제10종/물리 인수는 미완료. [근거](pptx/MEDIA_TIMING.md).

## 2026-10-13 03:45 내장 영상·회전 효과 동시 실행과 새Player
- FR-005/013/014. 제품코드 변경없이 생성 합성OOXML 영상target 회전90도200ms 클릭효과 추가. actualWhale1791830666738/result.json exit0: 실제Remote 다음효과→checkpoint1그룹/영상동일연결node .1→1.414803초/pausedfalse·angle90/타원clip 유지 PASS. 정지checkpoint확인→새Player 원본재추출 angle90/clip·1.434132초정지복원 PASS.1366완료/복원캡처 직접확인. 내장전체회귀/worker·실패repaint·revision등록·5viewport/원본불변/외부0/pageerror0 PASS,모든시험종료.
- check03:41:22 69파일909tests·TS/Vite/MV3/5스킬 PASS. 이전제품PPTX1791830114796/foundation1791830114955는같은제품코드 회귀근거. 최초 시간assert실패는초기영상ended상태 비교였고,슬라이더조건timeout/잘못된checkpoint단수필드 접근을 수정했다. sourceposition은실제Remote API PAUSE/SEEK,실행은실제Remote버튼. 실패관측파일 보존.
- 원본media trigger/고급그룹/flip/반복·실제파일충실도·물리인수는미완료. 다음 guarded타이밍계획 작성,전체goal active.[상세](pptx/PLAYER_MEDIA.md).

## 2026-10-13 03:38 재생 연속성·자료 등록 revision
- 최종 교사PPTX1791830114796/result.json exit0 PASS:23쪽/12클릭・Remote취소/재시도・overlay・교차/새Player/백업・3창5viewport・원본불변. 내장1791830114932/foundation1791830114955 포함 모든시험종료. git diff --check PASS.
- FR-002/005/013/014. SVG repaint는 전체slot 대상/transform을 이동 전 확인. DocumentImportControls는 파일 검사 뒤 최신 teacher revision으로 등록하고 STALE_REVISION만 동일commandId·최대3회 재시도, 응답불명/다른오류는 재시도하지 않는다. 신규8개, check03:34:59 69파일909tests·TypeScript/Vite/MV3/5스킬 PASS.
- actualWhale1791830114932/result.json exit0: 뒤쪽slot target 누락 오류에서도 이전SVG/native동일 연결노드가 .36494→.546019초 재생 유지. 제품 내장영상 worker stopping/stopped/starting/running·소유권·동일node .107817→.273686초/paused=false 유지·재시작후Remote정지 PASS. 파일읽기보류중노트명령 revision증가→PDF등록성공·발표선택/노트보존 PASS. 기존내장 연결/Remote·교차·새Player·백업/종료·crop/ellipse픽셀/5viewport·외부0/pageerror0/원본불변 회귀도PASS.
- 이전1791829923869는 PDF등록성공 안내 timeout으로 exit1, 당시 정확한오류 미수집이라 원인을단정하지 않는다. async준비전revision을사용하던경쟁을보완하고 강제revision변경으로검증했다. 실패시status/pageerror 기록 추가. foundation profile-1791830114955/verification-result.json exit0 PASS. 교사PPTX 최종회귀는 별도 결과추가기록. headless·합성/OPFS이며 물리speaker/chooser/PowerPoint기준 인수와구분, 전체goal 미완료.

## 2026-10-13 03:30 PPTX 내장 영상 crop·shape clip
- FR-005/013/014, PRD§11/24/25. 양의 srcRect crop 내부 확대·이동, 안전한 shape path foreignObject clip/outline 보존. 음수/과도 crop/reflection·unsafe path는 오류 유지.
- check03:24:35: 68파일901tests·TypeScript/Vite/MV3/5스킬 PASS, 신규11개. 실제Whale1791829563020/result.json exit0: 기존 전체 내장 제품UI 회귀+별도 합성 좌우25%crop/ellipse 등록·연결→native너비2배·타원밖/확대중심 흰색·안쪽 녹색 픽셀 PASS.1366캡처 직접확인/외부0/pageerror0/원본불변.
- 변경 후 제품PPTX1791829591948/result.json 및foundation profile-1791829592085/verification-result.json exit0 PASS. 모든시험종료. headless 전용 profile/합성코덱·출력이며 물리speaker·chooser·PowerPoint충실도 인수는 아니다. 단계4/5 및 전체PRD 미완료.[상세](pptx/PLAYER_MEDIA.md).

## 2026-10-13 03:20 PPTX Player 내장 미디어 수동 재생·원본 재추출
- FR-005/008/013/014,PRD§6/11/14/24/25. runtime 소유 guarded 모델/Blob 재사용·현재쪽 strict 출처/hash 대응→source data-el foreignObject/기존 LocalMediaPlayer portal. source geometry와 별도 global 영상 구분·moveBefore native노드보존·같은checkpoint unrelated revision repaint금지·slot scope/runtime보호.
- check03:19:38:68파일890tests·TypeScript/Vite/MV3/5스킬 PASS,신규21개. invalid test자료의it.each 인자/optional type 오류를수정한뒤전체통과.
- actualWhale1791829184123/result.json exit0:합성WAV/MP4 원본hash/길이·기본영역x=.3/y=2÷7.5/w=.3/h=.3·320x180 native픽셀/Remote음소거·재생·정지·노트revision동일영상연속·PDF자료교차/복귀1.033327초정지·새Player원본재추출/media요청0·Remote닫기/Editor탐색음원연속·OPFS저장/readback/파일검증→Launcher복구→같은PPTX만재연결→내장버튼없이보존정지·현재종료UI 검정대기 PASS. 별도Slot repaint경계native동일노드 .181289→.362237초재생지속. 외부0/pageerror0/교사23쪽·원본불변/Editor5viewport PASS.1366영상캡처직접확인.
- 제품PPTX1791828963478 및foundation1791828963625 회귀 exit0 PASS. 마지막slot poster/scope보완은최종내장시험으로확인. 종료직접명령거부는정상역할경계였으며제품UI로검증수정.
- 원본trigger·고급그룹/회전/flip/clip/crop/reflection·effects/영상동시/미디어추가·worker재시작·실물speaker/5분focus/PowerPoint충실도/실제10종은미완료. 전체goal active/PPTX unverified.[상세](pptx/PLAYER_MEDIA.md).

## 2026-10-13 03:05 PPTX Editor 내장 미디어 명시 연결
- FR-005/008/013/014,PRD§6/11/14. 선택쪽 guarded 추출→nativemetadata 전체확인→최신revision strict ADD→메모리 mediaVault. 같은출처는기존ID/음량/구간/bookmark유지. 취소·실패시이미ACK된개수안내/재시도,대상탐색busy잠금. probeMedia AbortSignal/native cleanup 추가.
- check03:02:53:67파일869tests·TypeScript/Vite/MV3/5스킬 PASS,신규14개. nullable slideId 타입검사를수정한뒤전체check통과.
- actualWhale5.39.412.57 headless1791828240243/result.json:제품Editor 현재비공개쪽의합성WAV/MP4 연결/중복재연결·원본읽기보류후취소/합성읽기실패→세션불변·다른발표쪽SVG/선택/bookmark/미디어mount불변·Enter/5viewport/380px캡처직접확인·외부0/pageerror0/교사원본불변 PASS.
- foundation profile1791828240272/verification-result.json exit0 PDF/로컬media/저장·복구·종료/자동넘김/소유권 회귀PASS. PPTX제품1791828240131/result.json exit0 등록·독립편집/overlay·Remote12효과/취소/재시도·worker재시작·새Player/백업복구·3창5viewport/원본불변/pageerror0 회귀PASS.
- partialACK취소·vault실패·재시도·16개한도는단위검증. 원본영상위치/그룹변형/효과trigger·Player원본재추출/새Player·백업재생복구·물리스피커는미완료. 전체goal active/PPTX unverified.[근거](pptx/EMBEDDED_MEDIA.md).

## 2026-10-13 02:56 PPTX 내장 미디어 추출·출처 계약
- PRD§11/24/25,FR-005/013/014. 소유 Blob 직접 조회/전체참조 선검증·100개/고유128MB·취소/dispose, WAV/MP3/MP4/WebM 헤더/SHA256. 출처 metadata·원본지문/중복 strict 검증·공개clone·metadata백업·정확한자산대응. 기존 dirty/untracked 보존.
- check02:54:16:65파일855tests·TypeScript/Vite/MV3/5스킬 PASS. 신규32개. 중간test 타입narrowing 오류를 수정하고 전체check 통과.
- actualWhale5.39.412.57 headless1791827767082/result.json:교사23쪽/내장0·원본불변, 합성 canonical WAV64044B/4초·MP416423B/2.134767초 hash원본일치/등록쪽·part·path, 외부요청0/pageerror0/취소/dispose. 실제제품Editor opt-in PPTX등록→Editor sender ADD 수락/다른원본·중복출처거부→bundle 새수업복구 출처유지/대기 PASS.
- foundation profile1791827712012/verification-result.json·exit0:기존PDF·로컬미디어·저장/복구/종료·소유권·자동넘김 회귀PASS. PPTX 제품1791827711887/result.json·exit0:제품UI등록/독립편집·overlay/23쪽12클릭·Remote취소/실패재시도/worker재시작·새Player/백업복구·3창5viewport·원본불변/pageerror0 회귀PASS.
- probe는guarded 제품모듈을격리번들로검사했다. 내장연결UI/Player재생/원본영상위치·효과트리거/물리스피커·전체충실도는아직미완료. 합성미디어시험을교사충실도근거로합치지않는다. [상세](pptx/EMBEDDED_MEDIA.md).

## 2026-10-13 02:44 PPTX overlay draft·확정·Player 표시
- PRD§6/13/14,FR-008/009/010/013/016.기존Editor draft/확정·실제font측정·overflow·normalized좌표를sourceView로PPTX에연결.원본SVG/runtime효과루트와별도portal.좌표canvas는실제원본픽셀이아님을표시하고원본색가짜샘플링차단.
- check02:40:57:63파일823tests·TypeScript/Vite/MV3/5스킬 PASS,새9개/안전한좌표canvas한도·샘플링미호출.
- actualWhale5.39.412.57 headless1791826916205/result.json·exit0:제품UI의다른쪽draft/확정과현재쪽draft는Player불변→긴한글최소font overflow확정차단→한글글상자/가리개/판서확정후Player표시·원본완료pose유지.새Player/백업복구후overlayPNG동일,12효과/서비스워커재시작/원본불변/3창5viewport/pageerror0 PASS. Player스크린샷직접확인.
- foundation1791826934209/verification-result.json·exit0:기존PDF overlay/노트·편집/저장·복구·종료/PDF복사본/native WAV·합성H.264/자동넘김/소유권/정상재시작 회귀PASS.
- **원본색픽셀추출은미완료**,수동색선택.내장media/원본충실도/실제10종/물리교실인수·PRD전체목표도미완료/PPTX unverified.[근거](pptx/OVERLAYS.md).

## 2026-10-13 02:35 일반 PPTX 실험 등록·비공개 탐색
- PRD§5/6/7/8/13/14,FR-003/004/008/013/014/015.공통Import opt-in/gate/lazy dispatch/취소·재연결/1000쪽,등록UUID 비공개SVG/노트,PDF전용overlay형식경계.
- check02:30:29:62파일814tests·TypeScript/Vite/MV3/5스킬 PASS,신규12개.
- 실제Whale5.39.412.57 headless profile1791826400096/result.json·exit0:seed/helper제거/제품UI만PPTX등록·재연결. opt-in거부/중복재사용/PDF발표Canvas픽셀불변·잘못된원본거부/명시읽기보류후취소·늦은등록없음/등록UUID6쪽비공개탐색·노트저장/현재3쪽완료pose유지·노트공개비노출/Editor·Remote·Player5viewport/Editor380직접확인. 기존12효과/자료교차/새Player·worker재시작/실패·취소/파일저장재검증·Launcher복구·제품UI원본재연결·완료화면복원/기존수업·원본불변/pageerror0 PASS.
- foundation1791826254333/verification-result.json·exit0 PDF/편집·저장·종료/미디어·자동넘김/소유권·정상재시작 회귀PASS. 첫selector중복과취소계측짧은지연을수정했고제품실패로확대하지않았다.
- PPTX overlay 편집·Player layer/내장media·고급효과/정밀Preflight·충실도/실제10종/물리인수는미완료. 전체목표active/PPTX unverified.[상세](pptx/PRODUCT_IMPORT.md).

## 2026-10-13 02:18 PPTX 편집정보 백업·복구
- FR-013/014/020,PRD v5 §14/28.sessionBundle PDF/PPTX strict 허용/형식별쪽한도,복구새수업/r0에완료pose scope변경,run/request제거,기존PDF schema1유지.
- check02:16:05:61파일802tests·TypeScript/Vite/MV3/5스킬 PASS,신규11개 변조/호환/복구/입력보존경계.
- actualWhale5.39.412.57 headless PPTX1791825423523/result.json·exit0:Editor nativeOPFS새출력/PCJSON/저장파일검증·Launcher파일입력/새수업strictDB·대기/과거pending제거/같은원본helper재연결·명시발표/완료visibility복원·기존수업불변/12효과·5화면·원본불변 PASS.
- foundation1791825446215/verification-result.json·exit0:PDF/편집·노트/저장·복원·종료/PDF복사본/자동넘김/native muted WAV·합성H.264/소유권·정상재시작 회귀 PASS.
- 일반PPTX등록·재연결UI/Editor/내장media·충실도/물리인수미완료.OS save chooser는OPFS대체/downloads성공근거아님.[범위](pptx/LOCAL_BACKUP.md).

## 2026-10-13 02:09 PPTX Remote UI 요청 소비·취소
- 관련: PRD v5 §11/24, FR-002/005/014, 요청 계획 2~4단계.
- 변경: Remote 다음 효과/취소, Player 요청 ID 한 번 소비, 새 Player 과거 요청 보류, 실패 후 취소·새 요청, native 취소/완료 pose 보존, 소진 안내. 안내 채널은 status/revision만 전달하며 명령 권한은 기존 runtime/strict DB가 담당한다.
- 자동: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check` 01:30:58, 61파일/791tests·TypeScript·Vite·MV3·5스킬 PASS. 신규8개. 선택 필드 undefined 타입 오류는 수정 후 통과했다.
- 실제: Windows/Whale5.39.412.57 headless, `verify-whale-pptx-player.mjs` profile1791823852936/result.json PASS. 제품 dist Remote 버튼/Player로 teacher-01 23쪽/12클릭그룹, 과거 pending 보류/취소·늦은 BEGIN 거부, 중복 receipt/Editor·중복 Player 거부, PDF 교차/완료 pose/새 Player 복원/Editor 선택 유지, 소진 시 페이지 불변, Remote/Player5viewport/키보드 focus/pageerror0/원본 SHA256 불변. Remote380 캡처 직접 확인.
- 실패/취소: BEGIN 응답 한 번 실패 주입→Remote 안내→취소 후 새 요청. 별도 취소 관측 구간에서 WAAPI playbackRate만 일시 .01로 낮추고 서비스 워커 stopped→running, Remote 취소→native animation0개/완료 checkpoint1·visibility 유지. 원래 WAAPI 복구 후 원본12그룹 완료. 원본 타이밍 충실도 판정으로 확대하지 않는다.
- 회귀: `verify-whale-foundation.mjs` profile1791824821236/verification-result.json 및 명령 exit0 PASS. PDF/비공개 노트·편집/저장 파일 검증/현재·전체 종료/PDF 복사본/native muted WAV·합성H.264/자동넘김/소유권/worker재시작/정상재시작 복구. 이전 session20507/33689는 후속 관측 때 handle이 없어 완료를 추정하지 않았다. PPTX result.json 확인, foundation에 종료 결과 파일 기록을 추가하고 새 시험43455의 exit0 확인.
- 제한: 원본 등록 준비 helper만 주입했으며 일반 PPTX 등록 UI는 미연결. PPTX 편집·백업·내장 미디어, PowerPoint 기준 충실도와 추가 실제9종, OS chooser/다운로드·실제 스피커·물리 모니터/IME/touch/5분focus/비정상 crash는 미실시. PPTX unverified 및 전체 목표 active.
- 상세: [REMOTE_REQUEST.md](pptx/REMOTE_REQUEST.md). 기록 패치의 제목 불일치 실패는 실행 실수이며 RSI 점검 결과 기존 먼저 읽기 규칙으로 충분하여 하네스 변경은 하지 않았다.

## 2026-10-13 00:22 요청 소비 재생 bridge
- durablePlayback.play(requestId?)·runtime 인자/cancel·Player transport 연결, 신규3개/총783tests·TypeScript/Vite/MV3/5스킬 PASS. 요청 없는/잘못된 ID와 소비 commit 전 취소는 native 재생 전에 거부한다.
- 변경후 실제Whale profile1791818688399 제품API 요청/소유권·취소와 기존 teacher12클릭·PDF 교차/새Player 복원·5viewport/원본불변/pageerror0 PASS. handle92418 종료. 실제 UI 요청 소비/진행 중 취소는 아직 미연결이며 bridge 신규경로는 단위 검증이다.

## 2026-10-13 PPTX Remote 영속 요청 계약
- check23:59:58 60파일/780tests·TypeScript/Vite/MV3/5스킬 PASS. 신규26개: 요청/원자 소비/취소·완료 보존/늦은 완료·BEGIN 거부/Editor 독립/strict DB·중복 receipt·commit 실패. fixture 반환형 TypeScript 오류 수정 후 PASS.
- actualWhale5.39.412.57 profile1791817147765 제품API: Remote 요청/receipt·Player 공개 조회, Editor/중복 Player 소비 거부, 소유 Player 소비, 취소 후 늦은 requestId 거부 PASS. 기존 teacher23쪽/12클릭·PDF 교차/새Player 복원·5viewport/원본불변/pageerror0 유지.
- 변경후 foundation1791817217698 기존 전체 회귀 PASS. Remote UI/Player 자동 소비/진행 취소 WAAPI는 미연결. 일반PPTX등록 비활성·충실도/물리교실 미검증. [근거](pptx/REMOTE_REQUEST.md).

## 2026-10-12 23:45 제품 PPTX Player runtime
- 변경후 actualWhale foundation profile1791816222931 전체회귀 PASS: PDF/빠른Editor/비공개노트·저장/복구·종료·WAV/합성H.264·자동넘김·단일Player소유/서비스워커재시작. headless/합성/OPFS picker대체이며물리교실·스피커/OSchooser는미검증.
- check23:42:55 59파일754tests/TypeScript·Vite·MV3·5스킬 PASS. 신규7개/runtime원본·ID/수명과공개projection privacy. viewer-core0.4.5 MIT고정/동봉.
- 실제Whale5.39.412.57 profile1791816181361 제품dist의Player/Worker/엔진그대로, **등록helper만시험추가**. teacher23쪽/12클릭완료·strict checkpoint/run null·PPTX/PDF복귀·새Player새Worker재파싱visibility일치·Editor선택보존/5viewport/원본불변/pageerror0 PASS. 첫그룹복원1366캡처직접확인. 초기복귀assertion2회는저장전조회→Node실제완료checkpoint직접poll로고쳐PASS.
- 원본점검/모델/비공개미리보기제품회귀1791816233332 PASS. 일반등록/Remote효과/내장미디어/PPTXoverlay·백업/원본충실도·물리인수미완료. [범위/명령](pptx/PRODUCT_PLAYER_RUNTIME.md).

## 2026-10-12 23:29 PPTX 비공개 미리보기
- 변경후 actualWhale foundation profile1791815323335 전체회귀 PASS: PDF/빠른Editor/비공개draft·노트·백업/복원·수정본·종료·자동넘김·native muted WAV/합성H.264 움직이는pixel·소유권/서비스워커 재시작. 실물 chooser/외부viewer/모니터/IME/5분focus/스피커는미실시.
- 제품 Editor의 guarded File→원본 순서/임시UUID·모델→소유Blob/안전SVG/비공개쪽탐색. 신규18개/check23:26:23 57파일747tests·TypeScript/Vite/MV3/5스킬 PASS. 모델/자산 응답은진단숫자경로와분리,본문/자산은해당Editor메모리만.
- 실제Whale5.39.412.57 제품dist profile1791815304372 teacher23쪽전부/이미지117decode·이전다음/쪽선택·발표session/snapshot/전체PDF Canvas SHA256불변·닫기/새잘못된파일에서URL전부해제·준비취소/terminate·5viewport/1366·380직접확인/외부0/pageerror0/원본불변 PASS. 일반PPTX발표/충실도·실물인수미완료. [상세](pptx/PRIVATE_PREVIEW.md).

## 2026-10-12 23:16 제품 PPTX 모델 Worker
- Stage C/D·FR-004·X-04: 고정 공식0.4.5 Worker/ready/숫자만 반환·opt-in 모델검사. check23:14:57 55파일729tests·빌드/TypeScript/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless 제품dist profile1791814518163: teacher23쪽/174요소/12효과, 모델 lazy loading·외부0·수업/snapshot/PDF Canvas SHA256 불변, ZIP/모델 native Worker send취소/terminate·오류·5viewport/pageerror0/원본hash불변 PASS. 380px 직접 확인.
- 이전 foundation profile1791813668333 전체회귀 PASS. 제품모델 첫실패는초기화제거, 다음실패는TLA ready전 메시지유실로진단/수정. 단위타입누락수정. 물리/원본충실도·일반PPTX발표 미완료. [세부/재현](pptx/PRODUCT_MODEL_WORKER.md).

## 2026-10-12 22:58 실제 Editor PPTX 구조 점검 UI
- Stage C/D·FR-004: File/header/hash·isolated ZIP/XML/순서점검을제품Editor에연결. 등록/원본자동보관없음. 신규7개/check22:56:24 54파일709tests·TypeScript/Vite/MV3/5스킬 PASS,fflate LICENSE/로컬ZIP Worker 산출검사.
- 실제Whale5.39.412.57 headless inspection1791813389908 제품dist 그대로: PDF등록/발표Canvas 후teacher-01 실제File input→ZIP163/XML81/23쪽/타이밍4/pass3/warning1/unknown5. 전체session/Player snapshot/전체Canvas 픽셀SHA256 불변 PASS.
- 잘못된파일은결과폐기·오류/상태·Canvas보존. native Worker send 지연wrapper에서키보드취소→실제terminate/늦은전송결과없음·불변 PASS. 원본hash불변/pageerror0/5viewport 가로넘침없음/desktop380스크린샷확인.
- 비활성page 캡처2회timeout은bringToFront로해결,모듈지연의취소시점불안정은native Worker send계측으로경계변경. OSchooser/CPU파싱중물리취소/PowerPoint충실도·일반PPTX발표미실시. [상세](pptx/EDITOR_INSPECTION.md).

## 2026-10-12 22:45 PPTX 모델 제한 사전 검사
- Stage C/D·FR-004: bounded nested modelInspection·원본XML요약/등록대응 pptxModelPreflight. 신규15개/check22:44:05 53파일702tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless owner1791812610053: 합성모델의model만pass/animation warning·기타unknown, teacher-01 23쪽174요소·효과4쪽12개와원본타이밍4쪽의warning/대체·미디어미발견unknown PASS. 원본hash/수업불변·기존등록UUID/runtime DB·새Player/owner/worker재시작 회귀 PASS.
- 대체0/모델없음은원본누락0·충실도증거가아니다. 화면변경없음, 일반UI/checkPreflight PPTX연결·실물PowerPoint/물리인수미완료, PPTX unverified. [상세](pptx/MODEL_PREFLIGHT.md).

## 2026-10-12 22:39 PPTX 원본/등록 UUID/Worker 모델 대응
- Stage D/F·FR-004: modelBinding의지문/개수/고유ID/part/모델검증과명시선택 연결. 신규17개/check22:35:16 52파일687tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless owner1791812334482: 원본1/2→A제목/표없음/효과5·B제목/표있음/효과0, 뒤집힌2/1→B/표/0·A/표없음/5로실제Worker모델대응 PASS. 단순count일치만검사하지않았다.
- 임의A/slide-1 대신실제등록document/slide UUID·part/index로renderer/원본effect를선택, 제품runtime strict ACK/DB→자료복귀/새Player새파싱pose복원 및기존회귀 PASS. teacher-01 Worker23쪽/등록23ID·첫끝index0/22/hash불변·수업불변 PASS. 복원화면확인.
- 일반UI/숨김쪽물리시험/teacher화면·PowerPoint충실도·추가9종미완료, PPTX unverified. [상세](pptx/MODEL_BINDING.md).

## 2026-10-12 22:30 PPTX 등록 준비/원본 순서
- Stage C/D/F·FR-004: presentation sldIdLst/관계의 실제순서·범위/중복/내부대상 검사와 preparePptxImport/형식별registrationPreflight 구현. 신규10개, check22:28:35 51파일670tests·TypeScript/Vite/MV3/5스킬 PASS. 첫 typecheck undefined signal 필드는 생략으로 수정.
- 실제 Whale5.39.412.57 headless owner1791811787600: 합성2쪽→Editor REGISTER_DOCUMENT ACK/DB·동일원본 ID재사용, 실제DOMParser 순서2/1·공격9거부 PASS. 기존source/5효과/runtime DB/복원/owner회귀 PASS.
- 제공teacher-01은로컬File input에서검사/등록준비23쪽/23고유ID·원본hash불변/수업불변 PASS. URL fetch 전달2회실패 후파일입력으로전환. nativechooser·이등록경로teacher화면/원본PowerPoint충실도·일반UI 미실시, PPTX unverified. [상세](pptx/REGISTRATION.md).

## 2026-10-12 22:22 PPTX Editor 원본→Player 재검증
- Stage D/F·FR-004: bounded File/header/hash/취소 및 전용 PPTX SourceVault 추가. 신규 단위9개, check22:20:16 50파일660tests·TypeScript/Vite/MV3/5스킬 PASS. 첫 typecheck의 새 테스트 key 타입 누락은 수정 후 PASS.
- 실제 Whale5.39.412.57 headless owner1791811295375: Editor 메모리 원본→Player 채널/재해시→Worker/5효과→runtime strict ACK/DB·A/B/A 및새 Player 원본 재연결/재파싱 복원 PASS. 캐시 채널을 닫고 변경된 bytes+이전지문을 보내면 새 Player가 거부하며 전체수업불변 PASS. 화면확인/기존owner회귀유지.
- 실제OSchooser/핸들·전체브라우저재시작/교사충실도 및 일반import/preflight/UI 미실시. PPTX unverified 유지. [상세](pptx/SOURCE_BOUNDARY.md).

## 2026-10-12 22:16 실제 renderer→제품 runtime→strict ACK
- Stage A/D/F·FR-004: engineDriver 공식 모델/그룹·원본 transform·수명 경계 구현. check22:11:44 49파일651tests/TypeScript/Vite/MV3/5스킬 PASS, 새 단위11개.
- 실제 Whale5.39.412.57 headless owner1791810925735: 실제 Player URL의 Worker 모델/안전 SVG/5효과→실제 background owner/runtime ACK/strict DB, A/B/A 3그룹·새 Player 재파싱 5그룹/회전90·이동320·scale1.5/0.5·퇴장숨김 복원 PASS. 스크린샷 직접 확인.
- 기존 권한거부/worker재시작/receipt/reset/승계 회귀 PASS. 최초 ZIP Worker 자산 누락 오류는 시험 패키징 수정 후 PASS. 일반 import/Player UI·실제 원본 충실도/물리 인수 미실시, PPTX unverified 유지. [상세](pptx/RUNTIME_RENDERER.md).

## 2026-10-12 22:06 실제 runtime PPTX Player 소유자
- Stage A/D/F·FR-004: player/pptxTransport 공개ACK/세션·명령/단조revision·snapshot clone·수업변경 요청전 차단 구현. 새 단위14개, check22:05:40 48파일640tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless owner1791810345762: 제품dist 격리복제/실제background·sender/getContexts/Web Locks/strict DB. 소유Player BEGIN/CHECKPOINT·공개ACK/중복receipt, duplicate BEGIN/COMPLETE NOT_PLAYER_OWNER·Editor/Remote/다른수업 FORBIDDEN 및거부전후불변 PASS.
- 실제 제품worker stop/stopped/starting/running 이후원래owner·완료checkpoint·전체수업유지/duplicate거부·receipt 재전송 PASS. A/B/A 늦은epoch INVALID_TARGET, Player RESET거부/Remote RESET성공, 원래Player닫힘→승계BEGIN PASS.
- 합성metadata/transport권한시험이며 실제원본효과→제품PlayerUI E2E는미연결. PPTX unverified·물리/충실도 인수미완료. [상세](pptx/PLAYER_TRANSPORT.md).

## 2026-10-12 21:58 실제 pose→strict ACK→재시작 복원
- Stage A/D/F·FR-004: durablePlayback 모델/group·target/지문 검증, BEGIN→기존엔진→완료pose→ACK·busy/전환취소/실패복원 연결. 새 단위22개, check21:57:12 47파일626tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale effects1791809838674: 합성 원본Worker/5효과→제품Hub/strict DB 완료pose 저장. A/B/A 회전90도, 실패응답 후3단계/이동0 복원→재시도320, 마지막ACK busy/DB5 PASS. 동일 프로필 정상 프로세스 재시작·새Worker 원본파싱 후 지문/완료5/회전·이동·배율1.5/0.5·퇴장숨김 동일 PASS. 기존 반복/곡선/분수종료/조건거부·Worker/SVG 유지. 기존완료복귀 스크린샷 확인.
- teacher1791809779509/media1791809789973 회귀·외부0·원본불변 PASS. 실제 제품 background 신규owner명령/Player UI·실물충실도/강제종료·물리교실은 미검증. PPTX unverified. [상세](pptx/PLAYBACK_BRIDGE.md).

## 2026-10-12 21:46 PPTX 영속 완료 계약
- PRD v5 Stage A/D/F·FR-004: 순수 core pose 검증 분리/완료 checkpoint·진행 epoch, BEGIN/CHECKPOINT Player 역할·생존 소유자 경계, Remote 선택 reset, 전환 시 run 무효화, 공개 선택쪽 clone·strict DB 검증 구현. 새 통합21개, check21:43:49 46파일604tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless checkpoint1791809022771: 제품 Hub/repository의 합성 metadata를 실제 IndexedDB에 저장, A/B/A·늦은 완료거부·Editor FORBIDDEN·정상 프로세스 재시작 후 pose/revision5/receipt5 동일 PASS. localhost 시험이며 실제 원본 pose/확장 owner의 신규 명령 end-to-end와는 구분한다.
- effects1791809068064: pose API 분리 후 반복6조건/linear/분수완료/9조건거부·기존효과/Worker/SVG 회귀 PASS. foundation1791809132669: 실제 MV3 기존 PDF/비공개편집/저장·종료/타이머·native 무음 WAV/MP4·실행소유자/worker 재시작·정상재실행 회귀 PASS.
- PPTX UI/실제 model 그룹·target 검증/ACK 실패재시도·PDF 전용 백업 확대/물리교실 인수는 미완료. PPTX unverified. [상세](pptx/DURABLE_CHECKPOINT.md).

## 2026-10-12 21:34 기본 시간곡선
- X-04/SPIKE-T-04/FR-004: 원본 기본/명시적0 accel/decel의 회전·확대에 linear 적용. native timing 실패/부재 단위2개 추가, check21:32:55 45파일583tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale effects1791808436215: 6반복조건의 1/4·1/2 원본시간 기준 progress/행렬·2.5회 종료0.5/45도·조건9종거부 PASS. 기존afterPrev/pose/취소/끝점·Worker/SVG 유지, 화면직접확인. teacher1791808446315/media1791808456513 회귀·외부0/원본불변 PASS.
- 실물PowerPoint/비영곡선·다른효과/제품연결/물리교실 인수는 미실시, PPTX unverified. [상세](pptx/LINEAR_TIMING.md).

## 2026-10-12 21:29 유한 반복·역재생
- X-04/SPIKE-T-04/FR-004: repeatTiming 및 원본 transform 조건 연결. 단위35개 추가, check21:24:57 45파일581tests·TypeScript/Vite/MV3 PASS.
- Whale5.39.412.57 headless effects1791807905223: 합성6조건의 native 반복/역재생·afterPrev 지연·중간행렬·완료pose/전환취소 PASS. teacher1791808101595·media1791808112045 회귀 PASS, 외부0/원본불변. 완료복귀 스크린샷 확인.
- 원본 시간곡선·분수 종료 progress 별도 기준/제품연결/물리 교실 시험은 미실시. PPTX unverified 유지. [상세](pptx/REPEAT_TIMING.md).

## 2026-10-12 09:27 원본 확대·축소 전달
- X-04/SPIKE-T-04/FR-004: 공통transform 경계 추출과scaleBehavior의 원본배율·축별끝점·조건거부 구현. scale43개/회전경계1개 추가. check09:27:08 44파일546tests·TypeScript/Vite/MV3/5스킬 PASS.
- 실제Whale5.39.412.57 headless effects1791764834867: 원본preset6/by1.5·0.5를후보가opacity0.35로바꾸는손실재현→어댑터완료/pose복귀1.5·0.5/opacity1·중심유지/144×144→216×72 PASS. 균일/축별/축소/from-to/to-only0시작/by무시5변형의중간/완료행렬·조건8종거부 PASS. 회전90도/중간행렬·조건10종/이동/퇴장숨김/늦은pose회귀 유지. 화면직접확인.
- teacher1791764753191 23쪽/12클릭/수명·media1791764764486 정확hash/native무음/pixel·전환/복귀 PASS, 외부0/원본불변/Worker/SVG회귀 유지. [상세](pptx/SCALE_SOURCE.md). 실제PowerPoint/제품연결·반복/역재생·고급효과전반 미완료로 PPTX unverified.

## 2026-10-12 09:15 원본 회전 전달
- X-04/SPIKE-T-04, PRD v5 Stage D/FR-004: rotationBehavior의 원본 by/from/to·step 대응·새 WAAPI 키프레임 교체·실패 정리 구현. 단위48개 추가(전체43파일502tests). `scripts/dev.ps1 check`의 테스트/TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless 합성효과: 수정하지 않은 후보90→완료0도 대조, 전달 어댑터90→완료90도/자료복귀90도 PASS. 음수·from/to·from+by·720 키프레임/중간행렬·기존2D baseline 유지·원본조건10종 거부 PASS. 이동240px/퇴장숨김/늦은pose 차단 유지. 중심·bbox와 화면의 회전된 한글 직접 확인. 프로필/최종hash는 상세 문서에 기록한다.
- teacher1791763876332 23쪽/12클릭/수명·미디어1791763886969 정확hash/native무음/pixel·자료전환/복귀 회귀 PASS. 외부0·원본불변. [근거와 제한](pptx/ROTATION_SOURCE.md). 실제 PowerPoint 회전 기준/제품Player·DB 연결/고급효과 전반은 미완료, PPTX unverified.

## 2026-10-12 08:59 고급 효과/완료 모습
- X-04/SPIKE-T-04: animationSnapshot scope/스타일/원자적 적용과 단위34개 추가, check08:58:22 42파일454tests/TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless effects profile1791763169461: 합성2쪽/4효과·duration200/200/200/300·main/Worker자산 대조 PASS. fade입장/퇴장 표시·숨김, 직선이동left36→276. cursor-only복귀는36으로 이동결과를 잃었고 완료pose적용 후276/퇴장숨김 복원 및 stale revision 거부 PASS. 복원 스크린샷 직접 확인.
- **충실도 실패**: 합성 animRot by5400000(90도)를 후보가 spin360으로 실행해 완료각0도. render pass/exit0와 별도 `effectFidelity=partial...rotation lost`로 기록했다. pose복원은 후보 완료 결과를 보존할 뿐 원본회전을 해결하지 않는다.
- teacher1791763044807/미디어1791763040942 기존 실제 회귀·외부0·원본불변 유지. [상세](pptx/EFFECT_POSE.md). 제품/DB·다른DPI·반복/상대이동·고급효과 전반은 미완료, PPTX unverified.

## 2026-10-12 08:49 web-ppt Worker 파싱/자산
- X-04/SPIKE-T-04: workerEnvelope 결과 기본구조/자산 한도 회귀23개 추가. check08:47:15 41파일420tests/TypeScript/Vite/MV3/5스킬 PASS. 고정 공식 Worker 초기화가 sideEffects로 제거된 초기 실패는 Worker만 treeshake:false로 수정하고 결과 초기화 assert/초기 실패 exit도 보강했다.
- 실제 Whale5.39.412.57 headless teacher profile1791762488028:23쪽/요소145/자산81·5884884bytes, main/Worker 모델 효과 요약·모든 자산 MIME/bytes/hash 일치. Worker DOM/DOMParser false. Worker 모델로 기존23쪽/12클릭·효과 수명·복귀2단계/재시작 화면 확인/이미지decode 유지.
- media profile1791762482260:3쪽/요소9/자산5·192105bytes 일치, Worker 자산의 WAV/MP4 원본hash·native muted재생/영상pixel·전환정지/수동대기복귀 PASS. 두 profile 외부0·원본불변·공격6거부 유지.
- ready 이후 무한 루프 Worker의500ms timeout/ready후50ms abort PASS, 메인5ms interval teacher100/15·media100/16회 진행. 실패/성공 모두 terminate, timeout/취소 잔여 message listener1개씩 제거. 손상 입력 고정오류 거부. [상세](pptx/WEBPPT_WORKER.md). 전체 import 무차단/대용량·물리 인수/제품 연결·고급효과 완료 아님.

## 2026-10-12 08:40 web-ppt 내장 미디어
- X-04/SPIKE-T-04: mediaReference의 소유 Blob/외부URI 차단·kind/MIME 경계 단위22개 추가, 기존 readMediaInput/header/hash 재사용. check08:38:26 40파일397tests/TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless media profile1791761961260: canonical 합성3쪽 렌더/이미지decode, WAVaudio/MP4video 종류·MIME·원본bytes/hash 일치, native muted metadata/time진행/영상320×180·붉은/흰 pixel readback PASS. 독립 B문맥 전환 시 pause·250ms시간정지, A복귀 bookmark/paused=true PASS. 원본hash불변/외부0/공격6거부.
- teacher-01 회귀 profile1791761912414: 기존23쪽/12클릭·busy/취소/기본커서복원/재시작·원본불변 유지. [상세와 제한](pptx/MEDIA_COMPARISON.md). 무음/합성 host 시험이며 제품 Player·DB·스피커·실제PPTX미디어·고급효과/트리거 인수 아님, PPTX unverified.

## 2026-10-12 08:35 PPTX 효과 수명/재진입
- X-04/SPIKE-T-04: PptxAnimationRuns 경계와 단위10개 추가. check08:32:15 39파일375tests/TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Whale5.39.412.57 headless profile1791761635954: 동일 teacher-01의 독립 A/B 파싱 문맥. A3 완료2단계 복원, 진행 중 busy/추가 커서 진행 없음, B9로 전환하여 이전 WAAPI idle·superseded·늦은 commit 없음, A 복귀 커서2/재시작0 PASS. 복귀2항목/재시작항목없음 화면 직접 확인. 기존23쪽/12단계/이미지decode/공격6거부·외부0·원본불변 유지.
- 엔진 cancel은 finish이므로 소유 WAAPI.cancel을 별도 호출했다. 초기 시험 코드의 예약 window.status/모듈 target 접근 오류 수정 후 최종 PASS. 두종 자료/영속 복원/제품 Player·미디어·고급 효과 인수 아님. [상세](pptx/WEBPPT_ANIMATION.md#실행-수명-후속-검증).

## 2026-10-12 08:28 web-ppt 기본 클릭 효과
- X-04/SPIKE-T-04: core/viewer-core0.4.5 MIT 원문·tarball SHA512 확인, 로컬 CSP bundle과 안전 SVG DOM 투영. SVG 경계 단위20개 추가. check08:27:21 38파일365tests/TypeScript/Vite/MV3/5스킬 PASS.
- 실제 Windows Whale5.39.412.57 headless profile1791761228209: teacher-01 전23쪽/이미지 decode, 3쪽6·9쪽1·12쪽2·19쪽3 클릭 단계 PASS. 대상/WAAPI/상태·하위 노드 숨김과 최종 표시 검사. 3쪽 클릭 전후 직접 스크린샷 확인. 최초 부모만 숨김 검사에서 놓친 자식 visible 오류를 수정했다. 외부0·원본 hash불변·SVG 공격6개 거부.
- 제품 연결/원본 시각·폰트/고급 효과·미디어·실물 모니터는 미완료. 후보500ms와 원본 duration null 차이는 충실도 미판정. [상세](pptx/WEBPPT_ANIMATION.md). PPTX unverified 유지.

## 2026-10-12 08:15 PPTX Worker SVG 출력 대조
- X-04/SPIKE-T-04: office 후보 Worker에서 전페이지 renderSlideToSvg를 실행하고 SHA256/byte 크기를 반환한다. 선택 페이지의 SVG는 로컬 메모리로만 전달해 이미지로 decode하고 Blob URL을 정리한다. 보고서에는 SVG 본문 대신 hash/크기/쪽 번호만 기록한다. 페이지별32MB/전체 생성256MB 제한과 기존15초 Worker 종료를 적용했다.
- check08:14:49:37파일345tests/TypeScript/Vite/MV3/5스킬 PASS. 새 단위 테스트가 아닌 실제 Whale SVG 생성·hash 대조·선택 decode·페이지 수 assert를 추가했다.
- Windows Whale5.39.412.57 headless teacher-01 profile1791760440213: office Worker 전23쪽의 SVG hash가 본 화면의 독립 렌더와 모두 일치했다. 생성 누적36515403bytes/최대3161560bytes(메타데이터 합계, 전체 SVG 보관은 아님). 선택1/3/15/23쪽을 Image.decode로 확인, natural267×150. 기존23쪽 렌더·효과 count·ZIP/XML/관계/콘텐츠 회귀·원본 hash불변·외부 요청0 유지.
- canonical media profile1791760476184: 전3쪽 SVG hash 일치와 Worker SVG3개 decode. 기존 두 후보 미디어 분류/hash/무음 재생 및 ZIP Worker 회귀 유지. canonical hash869e2fb781f71e0b35bf89eae6000b3a889fce8911125e4f740248fdd8005074 양 후보 동일. aiden Worker DOMParser 실패와 preview 기존 실패는 유지한다.
- 같은 엔진의 두 실행 위치에서 정적 SVG 문자열이 같다는 증거이며, PowerPoint 원본과의 시각적 일치·폰트 로드·효과 재생·전체미디어 안전은 증명하지 않는다. foreignObject Canvas taint로 픽셀 readback은 여전히 제한된다. Worker 전체 모델/렌더를 제품에 연결하지 않았고 XML 안전 검사도 아직 메인 실행이다. 큰 실제 자료의 메모리/시간 인수는 후속.

## 2026-10-12 08:11 PPTX 후보 파서 Worker/효과 요약
- X-04/SPIKE-T-04: pptxCandidateWorker.mjs와 격리 비교 script에 로컬 후보 파서 Worker·15초 제한/cleanup, 사본 transfer, 모델/효과 요약 본 화면 대조를 추가했다. 문서 텍스트나 URL은 반환하지 않는다. office-kit getSlideAnimations export로 실험 bundle806579bytes.
- check08:09:06:37파일345tests/TS/Vite/MV3/5스킬 PASS. 새 단위 테스트가 아닌 실제 Whale 실험/비교 assert를 추가했다. 실험 초기 office loadPresentation await 누락과 canonical Uint8Array의 잘못된 transfer를 발견·수정했다.
- 실제 Whale5.39.412.57 headless teacher-01 profile1791760229591: office Worker document/DOMParser 없이23쪽 파싱·효과 요약 성공, 본 화면 요약과 deepEqual. 별도 원본 XML presetClass 효과 count와도 전23쪽 일치:3쪽6/9쪽1/12쪽2/19쪽3. 총12개 API appear/click/mainSeq/playable=true, delay0/durationnull. 효과 재생이나 PowerPoint 일치 시험은 아니다.
- media profile1791760250343: office Worker3쪽·효과0 및 본 화면/원본 XML count 일치. 기존 canonical media hash/음원영상 분류·무음 재생 유지. canonical hash04501c04a3ee33c15a1fbb2f76d84bd826066eb9f8d516b30d956d94e19710d4 양 후보 동일.
- aiden Worker는 두 자료 모두 ZIP parse 이후 model 단계 ReferenceError/missingGlobal DOMParser로 실패한다. 설치된 XmlParser 소스 new DOMParser 의존성 확인. 본 화면23쪽/합성 렌더는 유지한다. preview 후보 기존 background 실패도 유지하며 모든 후보 성공으로 보고하지 않는다.
- 이전 ZIP Worker timeout/취소/원본 buffer·XML/관계/콘텐츠 회귀, 외부 요청0·실제 원본 hash불변 유지. 모델 전체 transfer·Worker 렌더·XML 안전 검사 시간 격리·고급효과/원본 충실도·제품 Player 연결은 미실시. [상세](pptx/WORKER_TIMING.md).

## 2026-10-12 08:04 PPTX ZIP Worker 격리
- X-04/SPIKE-T-04: isolatedPackage.ts/packageWorker.ts에서 로컬 module Worker로 기존 ZIP 2단계 검사·압축 해제를 실행한다. 15초 제한, AbortSignal, 성공·parser 오류·Worker 오류·message/transfer 실패에서 timer/listener를 정리하고 terminate한다. 원본은 복사본만 transfer하며 결과 항목은 ArrayBuffer transfer로 반환한다. 결과 개수/총 byte/항목 한도·필수 항목을 다시 확인한다.
- check08:02:52: 37파일345tests/TypeScript/Vite/MV3/5스킬 PASS. 새10단위 테스트로 성공/복사·timeout/취소/late result·오류/잘못된 응답/위험 오류 정보 비노출/전송 실패/입력 선검사를 확인했다.
- 실제 Windows Whale5.39.412.57 headless, 제품과 같은 CSP의 격리 확장: teacher-01 profile1791759821144에서 ZIP Worker 163항목·원본 buffer 유지·23쪽/image decode·기존 모든 XML/관계/콘텐츠 검사 유지·원본 파일 hash불변·외부 요청0. media profile1791759850360에서 ZIP52항목·원본 buffer 유지·기존 두 후보 음원/영상 hash와 무음 재생 유지. preview 후보 기존 실패는 유지.
- 두 프로필에서 먼저 실제 module Worker의 ready를 확인한 뒤 CPU 무한 루프 시험 메시지를 보냈다. 제한100ms의 PPTX_ZIP_TIMEOUT, 취소50ms의 AbortError와 손상 ZIP의 PPTX_INVALID_PACKAGE를 확인했다. listener null과 메인 interval 진행(teacher29회/media19회)을 assert했다. 실제 parser 15초 부하는 미실시이며 작은 강제 지연은 작업 수명 시험이다.
- 격리 Worker 산출물 assets/packageWorker-DwRqmjS9.js 7257bytes. Blob/원격 Worker·새 권한·새 라이브러리·제품 UI 변경 없음. 제품 dist에는 아직 PPTX 경로를 연결하지 않았다.
- 제한: 입력 최대128MB 사본과 해제 결과 최대256MB가 한시적으로 공존한다. 대용량 실제 메모리/성능은 미검증이다. DOMParser XML 검사 및 후보 엔진 자체 parser는 아직 메인 실행이므로 전체 import CPU 격리 완료가 아니다. XML 시간 격리·효과 재현·원본 충실도·제품 Player 연결은 후속이다.

## 2026-10-12 08:00 PPTX 콘텐츠 타입/미디어 헤더
- X-04/SPIKE-T-04: contentTypes.ts/packageGuard.ts에서 OPC Default/Override namespace·구조, 중복/잘못된 경로·MIME·위험 타입, 실제 항목의 타입 누락, presentation/relationship 타입을 검사한다. PNG/WAV/MP3/MP4/WebM은 확장자·MIME·초기 헤더를 대조하며 다른 형식은 uncheckedMediaParts로 남긴다. 전체 미디어 파싱이나 재생 판정은 아니다.
- check 07:59:38: 36파일335tests, TypeScript/Vite/MV3/5스킬 PASS. 새 단위 테스트18개. 기본/override·입력 불변, 잘못된/중복 선언, 매크로/HTML/JS MIME, 타입 누락·presentation/relationship 불일치, PNG와 음원/영상 헤더 정상·실패, 미검증 형식, 잔여 override 경고를 확인했다.
- 첫 canonical media run profile1791759513427은 PPTX_INVALID_CONTENT_TYPES로 실패했다. 합성 PptxGenJS 자료에 실제로 없는 slideMaster2/3 override가 있음을 확인했다. 계획을 변경해 경로/중복/위험 타입 검사 후 없는 항목의 잔여 선언만 orphanOverrides 경고로 기록한다. 실제 내부 관계의 없는 대상 거부는 유지했다. 이는 파일/슬라이드 생성이나 임의 우회가 아니다.
- Windows Whale5.39.412.57 headless teacher-01 profile1791759605373: 양 후보 typedParts162, checkedMediaHeaders81, uncheckedMediaParts1, orphanOverrides0. 기존23쪽 렌더 호출/image decode·관계192·원본 SHA256불변·외부 요청0 유지. 미검증1개를 전체 이미지 검증으로 주장하지 않는다.
- canonical media profile1791759584304: 양 후보 typedParts32(디렉터리 제외), checkedMediaHeaders5, uncheckedMediaParts0, orphanOverrides2. 기존 audio/video 분류·미디어 원본 hash·aiden native/office 별도 host 무음 시간 진행 PASS. canonical hash eccee739dd63497d121c340a21412402d5b6709c1d89adf4665539fd01d8c58e 동일. preview1.0.7은 기존 background TypeError로 실패 유지.
- 두 프로필 native DOMParser 콘텐츠 회귀5개: 중복 타입·없는 타입·손상 PNG 헤더·매크로 타입·namespace 오류를 정확한 오류 코드로 거부. 이전 XML/관계 공격 회귀도 유지. 화면 변경 없음, 새 의존성/권한/제품 지원 승격 없음.
- 미실시: JPEG/SVG/EMF 등 다른 미디어, 완전한 container/codec/압축 구조·signature/CPU 시간 Worker 격리·CRC/암호화/header 정합·XML 전체 스키마·원본 PowerPoint 충실도·제품 Player 연결. 헤더만 맞는 공격 파일도 가능하므로 전체 안전/지원으로 판정하지 않는다.

## 2026-10-12 07:55 PPTX 관계 대상 검사
- X-04/SPIKE-T-04: relationshipTargets.ts와 packageGuard.ts에 관계 소유 항목, 패키지 기준 경로 해석, 실제 내부 대상 존재 여부, 중복 ID, namespace/TargetMode/중첩 요소 검사를 연결했다. 정상 ../media, 루트 경로, fragment와 %20 공백을 허용하며 루트 이탈·인코딩된 traversal/separator·query/scheme 혼동은 거부한다.
- 외부 연결은 주소를 반환하거나 실행하지 않는다. URL parser로 http/https/mailto 외 프로토콜, 자격 증명, 상대 참조 등을 위험 개수로 분류한다. 위험 개수 0도 외부 연결 실행 허가가 아니다. 비교 시험의 모든 외부 요청 차단은 별도 장치이다.
- check 07:54:42: 35파일 317개 테스트, TypeScript/Vite/MV3/프로젝트 스킬 검사 PASS. 새 단위 테스트 24개: 소유 경로, 정상 내부 대상, 위험 대상 12개, 외부 위험 7개와 일반 URI 3개.
- Windows Whale 5.39.412.57 headless teacher-01 profile1791759288485: 두 후보에서 내부 관계 192개, 23쪽 렌더 호출·이미지 decode, 원본 SHA256 불변, 외부 요청 0. canonical media profile1791759303704: 내부 관계 35개, 양 후보 음원/영상 분류, aiden native AUDIO/VIDEO 무음 시간 진행, office 원본 미디어 hash 및 별도 host 무음 재생 유지. 두 후보 canonical hash는 0bf3f6a0f97acb1dd4694dc8b877987983ffd6ffbe3f15eaac1c3f1cba5a4513으로 동일하다.
- 두 프로필에서 native DOMParser 회귀: DTD/script/손상 XML 거부, 외부 2개 중 위험 1개 분류, 정상 내부 1개 확인, 경로 이탈/대상 누락/중복 ID/잘못된 mode/namespace/중첩 관계 거부 6개 PASS. preview1.0.7은 기존 background TypeError 실패가 유지되므로 전체 후보 통과가 아니다.
- 미실시: ContentTypes·미디어 signature 교차 검사, CRC/암호화/header 일치, Worker CPU 시간 격리, 실제 PowerPoint 원본 충실도/추가 교사 자료, 스피커와 물리 환경, 제품 Player 연결. 외부 상대 URI·fragment-only 내부 참조 등 일부 특수 URI는 보수적으로 제한한다. 제품 PPTX 지원 승격 없음.

## 2026-10-12 07:48 PPTX 공통 ZIP/XML 경계
- X-04/SPIKE-T-04: src/adapters/pptx/packageGuard.ts/fflate0.8.3 개발고정. metadata-only전체ZIP검사→해제2pass,128MB/4000항목/32MBentry/4MBXML/256MB총해제/압축비1000배한도,경로/대소문자중복·reservedkey/macro/script파일/없는필수part/압축방법/해제size불일치거부. 입력불변/abort. XMLUTF8·DOMParser/DTD/entity·script·잘못된XML거부,외부관계/타이밍은개수만. 원본글/URL내용로그없음.
- check07:48:34파일293tests·TS/Vite/MV3/5스킬PASS. 새15unit은정상/원본불변·위험경로9개·case중복·XML과대/압축비·activecontent/필수part·손상/빈파일/취소검사. CRC/encryption·모든ZIP공격/큰파일CPU시간격리인수는미실시.
- actualWhale5.39.412.57 headless teacher-01 profile1791758855077: 공통검사두후보163entry/6161507해제/81XML/타이밍4쪽/외부관계0,23쪽전체호출/decode·원본hash불변. canonicalmedia profile1791758864729:52entry/252904해제/28XML/타이밍0/외부0,이전음원영상분류/추출hash·무음진행PASS. 두프로필DTD/script/손상XML거부·외부relationship개수1 nativeassert PASS/외부요청0.
- 제품UI/PPTX활성화·renderer선정없음.새ZIP한도는실험용보수값이며큰실물성능·UTF16XML지원/CRC·암호화·header일치·relationship대상/protocol/MIME/signature/콘텐츠타입/효과/Player연계는후속. 전체보안완료라하지않음.

## 2026-10-12 07:44 표준 PPTX 음원 대조
- X-04/SPIKE-T-04: canonicalPptxAudio.mjs는합성3쪽XML/relationship을DOMParser로읽어audio관계의videoFile1개만audioFile로바꾼별도시험입력을생성. 사용자원본수정없음. XMLSerializer/ZIPmtime고정·두후보variant SHA256동일assert,미디어bytes보존.
- actualWhale profile1791758621500: aidenaudio1/video1/nativeAUDIO·VIDEO무음재생시간진행, officeaudio/video정확추출/MIMEkind일치·WAV/MP4hash원본일치·별도host무음재생. nativeMP4320×180,외부요청0,media쪽직접확인. 앞선분류불일치는생성태그경계이고일반음원버그라는판정은철회/보류한다.
- check07:43:33파일278tests·TS/Vite/MV3/5스킬PASS. [상세](pptx/MEDIA_COMPARISON.md). PowerPoint효과/실제media·스피커/독립Player계약연계/ZIP안전제품화·지원승격미완료.

## 2026-10-12 07:41 PPTX 내장 WAV/MP4
- X-04/SPIKE-T-04: createPptx optionalmedia/합성3쪽, 비교script --media 모델종류/native요소·재생과원본byteshash/별도host재생을분리. PptxGenJS WAV의videoFile/audiorelation/MIME불일치관측,시험원본수정없음. office추출2개hash원본일치.제품의존성/권한변경없음.
- actualWhale5.39.412.57 headless profile1791758453763: aidenVIDEO2개에서mutedWAV4초/time>.5·MP42.134767초/time>.6/320×180,office포스터/native0→원본추출후AUDIO/VIDEO별도mutedplay/시간진행/노트추출.각시험외부요청0·media쪽스크린샷직접확인. preview기존첫쪽실패유지. byte보존·재생은효과/timeline재현이나우리Player연계완료아님.
- check07:40 33파일278tests·TypeScript/Vite/MV3/5스킬PASS. [상세](pptx/MEDIA_COMPARISON.md).스피커/다른코덱·canonical audio fixture/실제media·충실도10종·독립Player소유/명령/checkpoint·제품선정미완료.

## 2026-10-12 07:37 사용자 실제 PPTX 첫 사례

- X-04/SPIKE-T-04: 제공23쪽 PPTX teacher-01 원본메모리→extension request fulfill, 원본복사/수정·외부업로드없음/SHA256불변. ZIP163항목/PNG81개/notes0/타이밍4쪽·transition0/외부relationship0. 추출텍스트로그없음. 실제음원/영상사례아님.
- 실제Whale5.39.412.57 headless profile1791758165878: aiden/office23쪽전체호출·현재이미지decode/스크린샷,외부요청0/pageerror0·aiden render callback0. 순회2661/3043ms(스크린샷포함단일관찰).1/3/15/23쪽직접비교에서텍스트위치·크기차이관측. 원본PowerPoint기준없어충실도판정안함. exactWindows fontfamily조회에서전용폰트이름들없음,실제브라우저fallback선택은미검증.
- check07:36:33파일278tests·TypeScript/Vite/MV3/5스킬PASS. [근거](pptx/TEACHER_01.md). 실제1/10종이상,미디어/효과·폰트/원본기준비교·제품통합미완료,goal active.

## 2026-10-12 07:33 PPTX 세 번째 후보

- X-04/SPIKE-T-04: verify-whale-pptx-spike에 office-kit preview0.15.0/core0.24.0 + fflate0.8.3 SHA512고정배포본을 추가. 제품의존성/manifest/권한 변경 없음. Vite browserentry만792516bytes, Node전용코드/폰트 미사용. 최초 core같은버전의missingexports를peer요구확인후 수정, getSlideText slide-only 계약 및 표텍스트별도검사 반영.
- actualWhale5.39.412.57 headless profile1791757983044: office 합성2쪽/SVG Image decode·한글·표·이동·노트추출 PASS, 스크린샷 직접확인. 외부요청차단/관측0건. aiden같은입력PASS, preview background실패. office첫쪽62ms/aiden346ms는단일관찰. 원본기준없이정렬/표배경차이만관측. Canvas foreignObject taint/SecurityError는제한으로남기고픽셀검증PASS로쓰지않음.
- check07:33 33파일278tests·TypeScript/Vite/MV3/5스킬 PASS. 실제10종/PowerPoint기준·media/behavior·공격입력·최종offline/성능 및 후보선정 미완료. [비교/재현](pptx/INITIAL_COMPARISON.md). 전체제품goal active.

## 2026-10-12 05:26 PDF 실제 렌더 및 PPTX 초기 비교

- C-PREFLIGHT-06 / PRD§8: 기존 PdfRenderer로 각 검사쪽을 1024×768/DPR최대2 Canvas에 렌더한 뒤만 renderedPages 증거를 반환한다. 실패/취소는 성공 cache에 넣지 않고 cleanup한다. cache 계약v3와 DPR/렌더 크기를 key에 포함, 이미지 bytes는 cache에 보관하지 않는다. 원본 화면 일치/폰트 대체 검사는 여전히 unknown.
- 진행 콜백이 없으면 completed가 증가하지 않던 optional-call 오류를 unit에서 발견해 분리 증가로 수정했다. check05:25:33파일278tests·TypeScript/Vite/MV3/5스킬 PASS. 렌더 성공/실패·재시도/cleanup, fidelity unknown 회귀 포함.
- 실제 Whale5.39.412.57 headless foundation profile1791750160201 PASS: 합성 Helvetica/중간쪽 PNG 포함8쪽, 8/8 Canvas 결과 명시 assertion, 부분/전체·cache/강제검사·세션/노트초안보호·380px 결과 직접 확인. 기존 PDF/저장/종료/미디어/owner/worker재시작 전체 회귀 PASS. 실물·원본pixel/font/effect 비교 및 물리교실 인수는 미실시.
- X-04/SPIKE-T-04: 고정 npm tarball을 lifecycle scripts 없이 받아 SHA512 검증 후 전용 MV3 확장으로 두 PPTX 후보 실행. 실제 Whale profile1791750300862: aiden1.3.0 합성2쪽 한글/영문·PNG decode/도형·표/페이지이동·스크린샷 직접 확인, 첫쪽511ms. preview1.0.7 첫쪽 background TypeError. 각 페이지 외부 요청 차단 설정/관측0건. 두 후보 제품 미통합, media/behavior/original fidelity는 unverified.
- preview의 registry ISC와 배포 README 소스 공개/변경 제한 충돌 발견: 재배포 조건 명확화 전 제외. aiden bundled MPL-2.0/ECMA notice도 최종 확인 필요. [비교와 재현](pptx/INITIAL_COMPARISON.md). 실제10종/PowerPoint 원본비교·다른후보·악성입력·미디어/효과·coldoffline·성능 반복시험은 후속. 전체StageC/D/제품 미완료.

## 2026-10-12 05:15 환경·범위 Preflight 캐시

- C-PREFLIGHT-05 / PRD§8: PDF inspection summary만 최대32개·5분 LRU 메모리에 저장한다. key=검사계약v2/SHA256/등록count/정확한pages/PDF.js version/UA/platform, 변경·TTL·역방향시계는 miss. clone/허용필드 재구성으로 bytes/노트/URL·오염된 caller 상태를 넣지 않는다. browser는 sourceVault.get→PDF 새hash 확인 이후만lookup, media는 항상nativemetadata/hash 재검사. cache는 원본접근가능/완전offline 보증이 아니다.
- Teacher에 cache사용 결과 항목과 강제검사 RefreshCw 아이콘 추가. 실패/취소·count mismatch는 새summary 저장 안함. partial/document가실제로 같은pages면 같은읽기증거를재사용할수있지만 결과scope는 요청대로이다. 영속화/새권한·패키지 없음.
- check05:14:33파일276tests·TypeScript/Vite/MV3/5스킬 PASS. 새 unit4개 key환경/범위/hash/count·LRU32/TTL5분·clone/개인정보배제·잘못된summary, browser회귀1개 source재확인→cachehit/parser미실행·접근실패거부/강제parser 실행을 검사한다.
- actualWhale5.39.412.57 headless foundation profile1791749673520 PASS: sample2/8→첫document8/8은cache아님, 같은document재검사는cache항목, 강제검사후cache항목없음·모든경고/노트draft/세션불변,380px 버튼/결과 직접확인·overflow없음. nativeWAV/MP4·coldsource없음/error·기존전체회귀/정상재시작PASS.
- 한계: 캐시는 현재 Editor 메모리만이고 parser/annotation 요약이다. 영속캐시·실물/큰파일benchmark/원본pixel·font/이미지/전체effect·물리offline/focus는 남는다. StageC/전체제품미완료.

## 2026-10-12 05:11 전체 페이지 읽기 점검

- C-PREFLIGHT-04 / PRD§8: PreflightReport.scope=registration/sample/document, Editor 범위 selector·진행 completed/total·취소, 전체1..count operator/annotation 검사 연결. 중간 페이지 누락/등록 count 불일치는 성공이 아니다. 전체120초/부분30초·abort destroy/페이지cleanup,128MB/2000pages 기존한도. 결과는 읽기범위만 보증하며 pixel/font/이미지/원본동작·완전offline는unknown 유지.
- check05:09:32파일271tests·TypeScript/Vite/MV3/5스킬 PASS. unit2개는 전체 pages/부분밖중간링크발견·범위/충실도미확인, 잘린전체검사성공거부를 검사한다.
- actualWhale5.39.412.57 headless foundation profile1791749413621 PASS: A8선택 부분2/8쪽·링크1, 전체8/8쪽·중간4쪽링크포함2개/전체범위표시, 노트draft·전체세션·Player보존, 취소/결과폐기·380px가로overflow없음/스크린샷직접확인, WAV/MP4/coldmissing/기존전체회귀·정상재시작PASS.
- 한계: 실제 검사량은 합성8쪽.2000쪽/performance·손상/큰파일·폰트/이미지pixel와원본비교/실물·코덱decode/환경cache/물리offline 인수는 남는다. 전체읽기 성공은 발표준비완료나 전체StageC 완료가 아니다.

## 2026-10-12 05:07 Preflight 실제 경계 확장

- C-PREFLIGHT-03: 합성 PDF A에 외부 URI(annotation Link, example.invalid)와 문서 JavaScript 이름 목록을 추가한 fixture를 실제 확장에서 검사했다. 첫 시험 warning1!=2로 스크립트 누락 발견. 설치 PDF.js6.4.299의 getJSActions는 Map|null인데 Object.keys로 읽던 결함을 size로 수정했다. 모의 browser 경계 회귀1개도 Map action·annotation/페이지/document cleanup을 검사한다.
- check05:06:32파일269tests·TypeScript/Vite/MV3/5스킬 PASS. actualWhale5.39.412.57 headless foundation profile1791749138124 PASS: PDF 외부링크1개/문서script 두warning과 부분범위unknown, 실제 WAV1/1·WAV+H.264 MP4 2/2 source/hash/native metadata 점검·세션불변, 정상프로세스 재시작 후 fallback 원본없음/error·세션복구보존. fixture JavaScript는 점검용이며 실행경로를 추가하지 않았다. 기존 전체회귀/정상재시작도 PASS.
- 등록결과 스크린샷은 native A8 canvas dataset·중앙pixel 비검정 준비 후 촬영하도록 보강했다. 새 preflight-380.png에서 두경고/문구·겹침없음 직접확인. 파일fixture/profile은 ignored cache only, 개인정보/업로드/새권한·패키지 없음.
- 한계: 합성 단일link/script·WAV/MP4 metadata이며 모든PDF action/annotation·코덱 decode/실제소리·완전offline 보장이 아니다. 정밀/font/image/효과·환경cache·실물/물리focus는 남는다. StageC/제품미완료.

## 2026-10-12 05:02 등록 fast 점검 연계

- C-PREFLIGHT-02 / PRD§8: preparePdfImport가 검증 직후 registrationPreflight를 반환하고, Editor Import가 strict 등록 ACK 후 자료별 가벼운 결과를 보여준다. 신규는 PDF parser 페이지수/헤더/SHA256 확인, 동일원본 재연결은 새hash확인·이번parser미실행을 unknown으로 구분한다. 내장미디어/원본동작/완전offline는unknown. 공통 PreflightResults를 두 실제사용처에서 재사용, 최대16개 실행메모리만/검사시이전결과제거. 등록실패/다른원본은 성공결과없음, DB/Player/백업계약 변경없음.
- check05:00:31파일268tests·TypeScript/Vite/MV3/5스킬 PASS. 새 unit3개는 신규parser증거/unknown·immutable/private배제, 재연결에서과거parser결과재사용금지, 잘못된hash/페이지count 거부를 검사한다.
- actualWhale5.39.412.57 headless foundation profile1791748894713 PASS: 신규A등록 pass2/unknown3, A선택중B원본재연결거부/결과없음·전체세션불변, 같은A재연결pass1/unknown4·전체세션불변,380px 결과문구/가로overflow없음·직접확인. 기존수동점검/취소/미확정노트·Player보호/PDF·저장·미디어·owner·worker재시작/정상재시작 전체회귀PASS.
- 한계: fast 결과는 현재 입력의 헤더/hash/count이지 시각충실도 성공이 아니다. 원본재연결 시 preview가 비동기 재로드 중일 수 있고 해당스크린샷은 결과문구 확인용이다. 실제파일·정밀/캐시/최종offline·미디어Preflight실기기 증거는 후속. StageC/전체제품미완료.

## 2026-10-12 04:59 선택 자료 Preflight

- C-PREFLIGHT-01 / PRD v5 §8·Stage C: 공통 visual/media/behavior/offline 결과의 pass/warning/unknown/error와 교사 Editor 수동 검사/취소 UI를 연결했다. 기존 Import fast PDF header/hash/count는 유지하며 결과 자동연계는 후속이다. 선택 자료의 첫/현재/마지막 최대3쪽 operator list/annotation, document JS presence, 원본 새 SHA256·등록 페이지수, 연결 미디어 원본 hash/native metadata 길이를 확인한다. 원본스크립트를 실행하지 않는다. 결과는 실행메모리만/teacher전용, 원본·세션·노트/Player 상태 변경 없음.
- PDF read는 일부 페이지 읽기 증거일 뿐 원본 화면 일치/폰트·overflow·전체 이미지/동작을 pass로 표시하지 않는다. 링크 발견은 해당 페이지 범위 warning이며 없다는 결과도 전체 offline 확정이 아니다. cold permission/완전offline는 unknown. native media metadata 확인은 actual decode/소리 재생 보장이 아니다. 다른형식은 범주별 unknown. 검사 중 대상변경/취소는 결과 폐기, PDF30초/abort cleanup, 기존파일128MB/2000pages 한도 유지.
- check04:57:30파일265tests·TypeScript/Vite/MV3/5스킬 PASS. 새 unit6개는 부분검사/네범주와미확인/immutable/private배제, script/외부링크warning, 원본없음/error메시지정보보호, 등록페이지수변경, 미디어길이변경/없음, 취소/잘못된대상을 검사한다.
- actualWhale5.39.412.57 headless foundation profile1791748661010 PASS: PDF A8 선택의 첫/마지막2/8쪽 읽기와 미확인 결과, 미확정 노트/Player A5/전체 세션 불변, 명시취소/결과없음/상태불변,380px 가로overflow없음·스크린샷직접확인. 기존 저장/PDF출력/종료/미디어·owner/worker재시작/정상재시작 전체회귀 PASS.
- 미실시: 실제 PDF 폰트/이미지/링크·폼·고급annotation fixtures/미디어 Preflight native 경로, 전체정밀검사·pixel diff/환경fingerprintcache·등록시경고/소스재연결 후캐시무효화·coldoffline. Stage C 전체완료/자료 발표 준비완료로 승격하지 않는다.

## 2026-10-12 04:53 타이머 완료 알림

- B-TIMER-SOUND-01 / FR-016: optional sound/completedEpoch/alarmClaimedEpoch, Remote-only SET_TIMER_SOUND(시간 불변), 소유 Player-only CLAIM_TIMER_ALARM을 연결했다. FINISH가 completedEpoch를 기록한 회차만 alarm claim strict 저장 후 자동 1회 시도한다. 중복/늦은 회차/조기/꺼짐/저장 실패는 재생 권한을 주지 않는다. 백업 복원은 과거 completedEpoch를 claimed로 처리해 지난 알림을 억제한다. sound 기본 false, visible과 독립.
- Player AudioContext 두 음660/880Hz·gain .12·약0.7초·close/취소를 사용한다. suspended resume은1.5초 제한, 거부 시 현재 Player에 수동 재시도 아이콘. worker 장기 실행/외부 음원·패키지·권한 없음. 자동 시도는 at-most-once이며 claim 직후 renderer crash로 소리가 유실될 수 있다. claim은 실제 소리 성공 증거가 아니다.
- check04:52:29파일259tests·TypeScript/Vite/MV3/5스킬 PASS. unit 추가3개: 완료회차 claim/중복·초기화·음소거·백업 억제, native 시간 두 음 예약/close, resume거부·재생없음/close. integration 추가1개: Player-only claim·strict 실패 뒤 pending/재시도·dedup/새명령중복거부.
- actualWhale5.39.412.57 headless timer profile1791748347635 PASS: Remote 소리 checkbox durable, Remote닫힘 후 B3초완료/claim, 중복 CLAIM NOT_PLAYER_OWNER, 첫 resume거부만 대역으로 주입→Player 재시도 실제 gesture/native AudioContext running에서 oscillator2개 start·자동 context1개+수동1개, 안내 해제/380px직접확인, 기존 timer 범위·모서리·정상재시작 상태보존. evidence.json의 soundEvidence 기록. 스피커 출력은 확인하지 않았다.
- 시험 첫 실패: 저장 완료를 읽고도 Remote UIrevision 미반영 상태에서 위치 적용이 경쟁했다. 비가시 data-session-revision 및 UIrevision 대기로 보강했다. 다음 checkbox.check 실패는 durable 설정 반영 전에 동기checked를 요구한 관찰 오류라 click→strict 상태/UIchecked 대기로 수정했다. 명령 자동 재적용은 추가하지 않았다.
- 기존 foundation 전체회귀도 profile1791748368804 PASS: PDF/비공개 편집·저장·종료·자동 넘김/WAV/MP4·worker재시작/단일소유권·정상프로세스 복구. git diff --check PASS.
- 남음: 물리 소리/절전·시계 변경/5분focus·Player 직접drag·자동 넘김과 도구 pause 정책. 전체 FR-016/제품 완료 아님.

## 2026-10-12 04:47 타이머 정규화 위치

- B-TIMER-POSITION-01 / FR-016: TimerState optional position={x,y}의 exact shape/finite0..1, Remote-only SET_TIMER_POSITION·현재 범위/revision·strict 저장을 연결했다. 위치 변경은 startedAt/epoch/elapsed/paused를 유지하며 설정 재적용과 백업에도 위치를 보존한다. Player는 inset12px 내부 anchor+자체 크기 transform으로 viewport 밖을 방지한다. 기본 수업(1,0)/자료(1,.12); 사용자가 같은 위치를 선택하면 자동 재배치하지 않는다.
- check04:45:28파일255tests·TypeScript/Vite/MV3/5스킬 PASS. 추가 unit2개는 실행 시간/선택/비공개 불변·설정/백업 보존·invalid좌표/extra필드/미설정/역할, integration1개는 strict 이동·dedup1회/실행 epoch 보존을 검사한다. 새 패키지·권한 없음.
- actualWhale5.39.412.57 headless verify-whale-timers profile1791747972366 PASS: Remote sliders Home/End·별도 위치 적용으로 실행 중 수업 타이머 (0,1) 이동·startedAt/epoch/paused 유지, Remote닫힘 진행·A/B/완료/중복거부 기존 회귀, 1366×768/380×760 각 네 모서리의 실제 bounding rect가12px 내부, 정상 재시작 전체 상태/position 동일.380px Remote/Player 스크린샷 직접 확인(수업 좌측아래/자료 우측위/잘림 없음). git diff --check PASS.
- 한계: Player 직접 드래그·소리/물리focus·절전은 미구현/미검증. 임의 동일 좌표의 겹침은 사용자 선택이며 자동 회피하지 않는다. 전체 FR-016/제품 미완료.

## 2026-10-12 04:43 수업·자료 타이머

- B-TIMER-01 / FR-016/004/006: Remote 범위·카운트다운/초시계·공개 표시·설정/시작/정지/초기화와 단일 Player 표시/완료 구현. 수업 타이머는 자료 전환에도 진행하며 각 자료 timer는 전환 때 정지·경과 보존한다. 시작 시각+누적 시간으로 계산하며 매초 DB에 쓰지 않는다. FINISH_TIMER는 소유권/현재 범위/revision/epoch/deadline 확인 후 strict commit. 백업은 exportedAt 경과를 포함해 정지 복원한다. 소리·위치 조절은 미구현.
- check04:38:28파일252tests·TypeScript/Vite/MV3/5스킬 PASS. 신규 unit8개는 시간/역방향 시계/독립 선택/A-B 보존/수업 진행/늦은 epoch/조기 완료/초기화/백업/legacy/shape/역할을 검사한다. integration2개는 strict 저장·중복 배포1회/새 Hub 읽기/조기 완료 거부/Player-only 완료/저장 실패 rollback을 검사한다.
- verify-whale-timers actualWhale5.39.412.57 headless profile1791747617706 PASS: 실제 PDF A/B, Remote 초시계 시작·닫힘 후 Player1→2초, A8초 진행→B 전환 때 A 정지/경과 보존, B3초 완료/Remote닫힘·durable3000ms, 중복 FINISH NOT_PLAYER_OWNER/표시 없음, A복귀8초/초기화, 정상 브라우저 재시작 전체 상태 동일. 380px Remote/Player 가로 overflow 없음·스크린샷 직접 확인. 합성 파일/전용 profile만 사용했다.
- 기존 foundation 전체회귀/정상재시작도 profile1791747642744 PASS(PDF/저장/종료/자동 넘김/WAV/MP4/소유권/worker 재시작).
- 첫 타이머 시험은 PDF 원본과 overlay canvas를 함께 찾은 strict locator 오류; 정확한 aria-label로 수정 후 PASS. 일시 GET_SESSION 실패 시 완료 재시도가 끊기는 코드 경로도 보완했다.
- 한계: 소리·위치 조절/물리 모니터·5분 다른 앱focus·절전/시계 변경·브라우저 crash 별도. FR-016 전체·Stage B·제품 전체 완료 아님.

## 2026-10-12 04:26 단일 Player 실행 소유권

- B-PLAYER-OWNER-01 / PRD v5 §11/17·Stage B / FR-004/005/006. 실제 MessageSender.documentId와 runtime.getContexts로 생존한 자체 Player를 확인하고, 별도 `naver-ppt-player-owner` v1/owners에 {sessionId,documentId}만 strict 저장한다. Web Locks로 생존 조회와 저장 판정을 직렬화한다. 기존 생존 소유자는 교체하지 않으며 없어진 경우에만 새 claim을 허용한다. focus/시간 만료/서비스워커 메모리에 의존하지 않는다.
- CLAIM_PLAYER는 자체 Player/해당 수업/exact2필드만 허용하고 응답은 owned Boolean만 보낸다. 기존 수업 존재도 확인한다. Player ADVANCE_AUTOPLAY/PLAY_MEDIA/CHECKPOINT_MEDIA는 생존 소유자만 backend에서 적용한다. 소유 확인 전 Player는 PDF/미디어/자동 넘김을 실행하지 않으며 중복은 검정 대기/2초 재시도다. 소유 창은 heartbeat 없이 생존 동안 유지하므로 worker 일시 재시작이나 포커스 이동이 native 정지 조건이 아니다. 공개 snapshot/노트 경계는 유지한다. 새 권한/패키지/원본복사 없음.
- check04:25 PASS:26파일242tests·TypeScript/Vite/MV3/5스킬. 신규 integration6개는 exact metadata/미지원 platform fail closed, 동시 claim 한 소유자/authority 재생성, 소유창 부재 후 승계/기존 sender거부, 다른 수업·역할·documentId누락, 생존/API/저장 실패, strict transaction abort 시 grant 금지와 이전 owner rollback을 검사한다. 대역 테스트를 Whale 증거로 대체하지 않는다.
- actualWhale5.39.412.57 headless profile1791746761053 전체회귀 PASS: 중복 Player의 검정 대기와 audio/video/PDF canvas없음, 직접 ADVANCE/PLAY/CHECKPOINT 요청 NOT_PLAYER_OWNER 거부, 기존 소유자가 시간 자동 넘김/미디어 계속 실행. 제품 worker만 CDP stopWorker→브라우저 이벤트 stopping/stopped/starting/running 기록→메시지 재연결; WAV native 시간이 계속 증가/pausedfalse, 기존 Player claim ownedtrue·새 중복도 대기 확인. worker-restart.json에 상태 전이/owned 응답 기록. 원래 소유창을 닫으면 대기창이 동일 페이지 PDF를 표시/소유 승계하고 세션 전체 상태는 불변이다. 기존 WAV·MP4/구간·음량·저장·종료·정상 프로세스 재시작 회귀도 PASS. duplicate-player-380.png 직접 확인: 검정 화면·상태 문구 겹침 없음.
- 실패/수정: 최초check는 모듈 초기화 중 IndexedDB 전역 접근으로 기존 Node mock6개 실패; lazy factory와 선택 플랫폼 API 접근으로 수정했다. 다음check는 undefined 선택필드 직접 주입의 TS오류라 해당 속성 없는 sender를 생성하도록 수정했다. worker 시험 첫 관찰은 Playwright serviceworker 이벤트15초 timeout이었으며 이를 실제 워커 미재시작으로 단정하지 않았다. CDP 실제 runningStatus와 메시지로 재검증한 뒤 stopped→running을 확인했다. 이후 영상 준비 timeout 진단에서 현재 발표 media=[]를 확인했다. Editor 선택/상태 배포와 자동 파일 입력의 경쟁을 방지하도록 비가시 data-session-revision 및 대상 slideId/입력 가능/등록 ref의 slideId 검사를 추가한 최종회귀 PASS. 이전 간헐적 영상 준비 실패를 코덱 결함으로 주장하지 않는다. 기존 반복 실패 후 분석 규칙에 해당하여 중복 전역 규칙은 추가하지 않았다.
- 한계: headless/합성 자료/native API 시험이다. 물리 모니터/5분 다른 앱focus·OS 정책/브라우저·렌더러 crash·재생 중 소유창 종료의 마지막 tail/실물 파일·다른코덱·실제소리·편집pause·타이머는 별도 인수다. 시간 만료가 없는 생존 기반 소유권이며 브라우저가 살아 있는 context를 보고하는 동안 자동 강탈하지 않는다. 전체 Stage B/제품 목표는 미완료다.

## 2026-10-12 04:12 미디어 구간·음량·탐색

- B-MEDIA-CONTROLS-01 / PRD v5 §11·Stage B / FR-004/005/006. optional ref.playback exact shape/구간·음량 범위, Remote 전용 SET_MEDIA_PLAYBACK/SEEK_MEDIA·현재 context/epoch/positionEpoch·늦은 보고 차단을 구현했다. 구간 변경은 해당 미디어와 autoplay 정지/시작 위치로 이동, 음량만 바꾸면 재생/위치/회차 유지, seek는 기존 재생 여부/자동 넘김 회차 보존이다. 기존 ref는 전체 길이·음량1로 읽고 백업은 설정/위치를 metadata로만 정지 복원한다.
- Remote 숫자 구간/음량·위치 slider/저장·음소거·이동 아이콘과 Player native volume/muted/구간 끝 timeupdate+실제 currentTime 기반 deadline을 연결했다. ended/자동 넘김은 설정 end를 사용한다. 단순 정지는 명시적 seek와 구분해 native 진행 위치를 보존한다. 새 패키지/권한/원본 변경·미디어 bytes 저장 없음.
- 최종check04:11 PASS:25파일236tests·TypeScript/Vite/MV3/5스킬. 신규 unit8개는 구간/비신뢰 shape·원본 immutable·private 유지/음량 재생 유지/seek 이전epoch/정지seek·잘못된 대상·끝점거부/trimended·자동 넘김/구간 시작 재시작/metadata 백업/역할을 검사한다. integration2개는 strict 설정·중복publish1회·Player거부/pausedseek 재조회와 commit 실패 rollback/배포 금지를 검사한다.
- actualWhale5.39.412.57 headless 최종profile1791745928224 PASS: Remote WAV3~5초 구간·1%음량·음소거→native 요소 값/시작3초·정지 확인→키보드PageUp두번으로약3.4초 선택·명시 이동/실제native paused위치 확인→media-end 재개/실제5초구간 종료→A2 이동과 durable ended/time5 보존. 영상 재생 중 음량1%만 변경해 native currentTime 증가/pausedfalse·bookmark epoch불변 확인. 기존 MP4 movingpixels/정지·교차위치·Remote닫힘·자연ended/정상재시작 및 전체 PDF·저장·종료·WAV·자동 넘김 회귀 PASS. media-settings-380.png 직접 확인: 구간입력·44pxslider/아이콘·문구 겹침/가로overflow없음.
- 실패/수정: 첫 신규unit의 예상 epoch가 fixture revision0을 가정해2개 실패; 실제 revision을 사용해 수정했다. 첫 실제 구간 시험에서 A2 전환 후 cleanup의 checkpoint(true)가 ended를 false로 덮는 버그를 발견했다. cleanup이 latest ended를 보존하도록 수정 후 실제 구간/전체회귀 PASS(profile1791745865548), 더 큰 seek/재생중 음량 검사를 추가한 최종회귀도 PASS했다.
- 한계: 실제 구간 인수는 합성 WAV, 재생 중 음량 인수는 합성 H.264 MP4/native 속성 기준이다. 실제 스피커 음량·영상 구간/실물·다른코덱·여러 미디어/OS picker·coldhandle·5분focus·Player lease·편집pause는 별도 인수다. Stage B 및 제품 전체는 미완료다.

## 2026-10-12 04:03 MP4 영상의 실제 Player 경로

- B-LOCAL-VIDEO-01 / PRD v5 §11·Stage B / FR-004/005/006. `verify-whale-video-spike.mjs`가 설치된 Whale5.39.412.57의 Canvas captureStream/MediaRecorder로 320×180 H.264 MP4를 만들었다. 네이티브 metadata 길이2.134767초, 디코딩 흰색 중앙/녹색 모서리 픽셀 확인 PASS. fixture/metadata는 `node_modules/.cache/whale-video-spike`에만 생성하며 인코더 설치·자료 업로드·제품 미디어 자동 복제는 없다.
- `verify-whale-foundation.mjs`에 제품 영상 인수를 추가했다. 실제 Editor 파일 입력→MP4 헤더/SHA256/길이 등록→Remote 재생→Player native video의320×180·흰색 중앙·녹색/빨간색 프레임 변화→Remote 정지와 durable 위치→A/B/A paused 위치 복원→재개 후 Remote 닫힘에도 시간 증가→seek 없이 자연 native ended와 durable ended/paused 확인. 원본 fingerprint/비공개 deltas 유지, Player 공개 응답에 파일명 없음. 1366×768 및380×760 요소 경계·가로 overflow 검사와 스크린샷 직접 확인 PASS.
- actualWhale 전용 headless profile1791745310673 및1791745360505에서 위 영상과 기존 PDF/저장/종료/시간·WAV·미디어 자동 넘김/정상 프로세스 재시작 전체 회귀 PASS. check04:02:23파일226tests·TypeScript/Vite/MV3/5스킬 PASS. 제품 런타임 코드·권한·패키지 변경 없이 기존 영상 경로에 실기기 증거를 추가한 작업이다.
- 실패 기록: spike 첫 실행은 extension URL.origin이null이라 잘못된 URL로 진입했다. runtime.getURL로 수정 후 PASS. 통합 첫 시험은 재생 전 readyState≥2 대기, 두 번째는≥1 대기에서 각각20초 timeout. 진단 수집과 정지 위치의 durable 대기를 추가한 뒤 두 번 PASS했다. 원인은 확정하지 않았고 안정성 해결로 주장하지 않는다. 다음 재현 실패 시 video-diagnostic.json의 src/networkState/error/공개 snapshot을 조사한다. RSI 검토: 기존 두 번 실패 후 원인 분석 규칙으로 처리 가능한 프로젝트 시험 문제이므로 중복 전역 규칙은 추가하지 않았다.
- 한계: 합성 MP4 한 종류, 무음·headless 시험이다. 다른 MP4 코덱/MP3/WebM·실제 스피커, 실제 OS 선택기/파일 핸들 cold restart, 여러 영상·5분 다른 앱 focus, trim/volume/seek UI·Player lease·편집pause는 미완료다. 입력 경로 전체나 Stage B/제품 완성으로 승격하지 않는다.

## 2026-10-12 03:51 미디어 종료 기반 자동 넘김

- B-MEDIA-AUTOPLAY-01 / PRD v5 §11·Stage B / FR-005/006. Remote의 media-end/later-of-time-and-media 모드를 활성화했다. 새 설정은 네 모드 모두 exact shape/시간 범위/편집pause=false를 검사한다. 미디어 기반 재개는 현재 페이지의 등록 미디어가 있어야 한다. 재개 시 해당 미디어를 현재 autoplay 회차에 묶어 요청하고 완료된 미디어는0부터, 미완료는 보존 위치부터 시작한다. 없는 미디어는 종료로 추정하지 않는다.
- MediaBookmark optional autoplayEpoch가 회차를 식별한다. 실제 Player CHECKPOINT의 ended/paused/길이와 모든 현재 페이지 ref의 회차가 일치해야 mediaEnded=true다. Player snapshot은 이 Boolean/null만 추가한다. gesture PLAY_MEDIA가 native 재생 epoch를 교체해도 현재 자동 넘김 회차 연결을 유지한다. 이전 회차 종료 기록은 사용하지 않는다. 반복은 새 회차·시간0/ended=false, 다음 페이지에 미디어가 없으면 해당 페이지에서 정지한다. 완료 회차 재시작은 경과시간도0으로 초기화한다.
- 최종check03:48 PASS:23파일226tests·TypeScript/Vite/MV3/5개 스킬. 신규8개는 네 모드/필수 seconds/편집pause 거부, native 종료 전 임의 장시간 경과 거부, 두 조건의 순서, 여러 미디어 전체 종료/이전 회차 거부, 새 회차 반복, Player gesture 연결, 없는 미디어 null/재개 거부, 중지·재개 위치 보존을 검사한다. 새 패키지/권한 없음.
- actualWhale5.39.412.57 headless PASS(profile1791744570856): 실제 Remote media-end 설정·재개가 WAV native 재생을 시작 → 끝부분 seek 후 실제 native ended → A1에서 A2로 이동/미디어 없는 A2에서정지. 결합 모드5초에서는 native WAV가 먼저 종료돼도 A1 유지, PLAY commit부터5초 이후에만A2 이동·정지. 같은 전체 시험에서 기존 시간 반복/Remote 닫힘·WAV 위치·거부 대역 복구·저장/PDF/종료·정상 재시작 회귀도PASS. media-ended-autoplay-380.png 직접 확인: 선택·44px 버튼·상태 문구 겹침 없음.
- 한계: WAV는 합성·muted 재생이며 끝부분 seek로 native ended를 발생시켰다. 실제 영상·다른 코덱/다중 미디어의 실물 동시 종료/스피커·장시간 focus/오프라인·Player lease·편집pause·trim/volume/seek UI는 남음. 번들 dependencies에서도 ffmpeg 바이너리를 찾지 못해 추가설치하지 않았다. 미디어종료 단위 구현을 Stage B/제품 전체 완료나 모든 포맷 지원으로 승격하지 않는다.

## 2026-10-12 03:40 로컬 미디어 연결과 WAV 재생

- 03:44 최종 산출물 확인: 노트 label을 미디어 연결 영역 아래로 정리한 뒤check03:43/218tests·빌드 PASS, 최종 actualWhale profile1791744207635에서 전체 동일 시험 PASS. git diff --check도 통과했다.

- B-LOCAL-MEDIA-01 / PRD v5 §11/12/14·Stage B / FR-004/005/006. Editor 파일 선택→헤더/128MB/SHA256·네이티브 metadata(15초/유한 duration≤24h)→자료별 optional localMedia 참조 strict 등록을 연결했다. WAV/MP3/MP4/WebM 입력 경로이며 실제 재생 검증은 아래 WAV 범위다. 같은 페이지·같은 fingerprint는 원본 재연결만 한다. 파일 바이트를 세션/백업/IndexedDB에 넣지 않고 별도 media channel/SourceVault와 같은 native handle 저장소만 사용한다.
- Remote PLAY_MEDIA/PAUSE_MEDIA, Player HTMLAudioElement/HTMLVideoElement·로컬 객체 URL·정지/종료·재생 거부 대응을 연결했다. CHECKPOINT_MEDIA는 Player만, sender 수업과 현재 context/epoch/시간/paused/ended를 검사하며 strict commit 후 반영한다. 교사 정지는 epoch를 바꿔 오래된 진행 보고가 재생을 되살리지 못하게 한다. 전환 뒤 마지막 위치의 paused tail만 허용, 약5초마다/정지·종료 시 의미 있는 checkpoint만 보낸다. 동일 paused 위치는 재저장하지 않는다. URL 해제 전 실제 요소를 정지하고 마지막 위치를 캡처한다. 파일명·크기·수정시각은 Player 공개 ref에서 제외한다.
- 최종check03:40 PASS:22파일218tests·TypeScript/Vite/MV3/5개 스킬. 신규11개는 헤더/hash·범위/비신뢰 필드·다른 MIME·ref 등록/중복·현재 재생/immutable 입력·정지epoch/오래된 보고·inactive tail·ended 검증/재시작·백업 정지/공개 filename 비노출·역할/원본 validator 재연결·__proto__ own-key를 검사한다. 새 패키지/권한 없음.
- actualWhale5.39.412.57/Chromium150/headless PASS(profile1791744016655): 합성12초 PCM WAV metadata·원본 SHA256 동일 → 의도적으로 .play 첫 호출에 NotAllowedError 대역 주입 → 정지 checkpoint 뒤 Player 실제 클릭/네이티브 muted audio 재생·currentTime 증가 → Remote 닫힘에도 증가 → 다른 자료 전환/실제 요소 정지·마지막 위치 저장 → A 복귀 시 저장 위치로 seek/paused → 재개·끝부분 seek 후 실제 native ended와 durable ended/paused 확인. Player 공개 응답에 Synthetic.wav 없음. 기존 전체회귀·정상 재시작 전체 상태 일치 PASS. 380px 가로overflow없음/media-remote-380.png 직접확인.
- 실패/수정: 첫check에서 optional retry에 undefined를 직접 넣은 exactOptionalPropertyTypes 오류를 수정했다. 첫 Whale 전체회귀는 WAV 재생/위치 보존 후 기존 metadata 시험의 즉시 A복귀가 tail commit과 경쟁해 STALE_REVISION을 정확히 반환했다. paused 동일위치 중복보고를 제거하고 시험만 최신 revision 재조회 후1회 재시도하도록 수정/재시험PASS. 실제 사용자 명령을 무조건 재적용하지 않는다. 최종 거부 시험은 대역 정책 거부와 실제 네이티브 재생을 구분한다.
- 한계: MP3/MP4/WebM 실제 파일/영상 픽셀·코덱·스피커 출력은 미실시. 자동재생 거부가 실제 OS 정책에 의해 발생한 조건은 검증하지 않았고 대역 거부 복구만 검증했다. 미디어 끝 기반 자동 넘김/trim·volume·seek UI/동시 영상 레이아웃/단일Player lease/편집pause/5분 물리focus/장시간 오프라인/native OS chooser·미디어 handle cold restart·큰 파일/손상 파일은 남는다. native ffmpeg는 PATH에서 찾지 못했고 새 설치는 하지 않았다. 전체 미디어 지원/Stage B/제품 완성으로 승격하지 않는다.

## 2026-10-12 03:21 Player 시간 자동 넘김 실행

- B-AUTOPLAY-EXEC-01 / PRD v5 §11·Stage B / FR-004/005/006. Remote의 수업/자료/페이지 설정과 상위 설정 복귀, 1~86400초 간격, 페이지·자료·범위 반복, 재개·정지를 연결했다. 미디어 종료 기반/편집pause는 아직 실행 엔진이 없어 새 설정/재개에서 거부하며 UI 미지원 표시다. 수업 범위의 페이지 범위 반복은 자료별 ID가 달라 허용하지 않는다.
- Player `useAutoplay`가 공개 rule/checkpoint와 PDF ready 정보를 받아 deadline 기반으로 실행한다. focus/visibility/Remote 존재를 정지 조건으로 쓰지 않고 worker에서 장기 타이머를 돌리지 않는다. ADVANCE는 Player만 허용하며 sender query 수업 일치, exact keys/session/document/slide/revision/epoch/진행 중 상태/실제 경과를 검사한다. 다음 대상은 core가 계산한다. terminal은 현재 페이지에서 정지, 반복은 새 epoch/시간0, 수동 다음 페이지는 정지, 미디어 bookmark와 자료 타이머 정책은 보존한다. 모든 이동 ACK는 strict commit 이후이고 실패/중복은 재이동·재배포하지 않는다.
- check03:20 PASS: 21파일/207테스트·TypeScript/Vite/MV3/5개 스킬. 신규15개는 재개·정지·누적 경과/조기·stale·paused 이동 거부/반복·종료/설정 상속/잘못된 범위/미지원 설정/역할·shape/공개 clone/strict DB 중복·실패 rollback/수동 이동 후 오래된 예약 거부다. 새 패키지/권한 없음.
- actual Whale5.39.412.57 headless PASS(profile1791742848555): 실제 Remote UI에서1초·A1~A2 범위 반복 설정/재개 → 실제 Player canvas A2 → Remote 닫힘 후 최소2회 추가 advance/비공개 델타·Editor 선택 유지 → 새 Remote 정지. 다른 수업 Player advance는 FORBIDDEN. 380px 전체 가로 overflow 없음, autoplay-remote-380.png 직접 확인:44px 아이콘/범위·상태 문구 겹침 없음. 기존 저장·빠른 편집·종료·PDF output/reader·metadata A-B-A·정상 재시작 회귀도 PASS.
- 실패/수정: 최초 공개 필드 exact-list 테스트와 PLAY/PAUSE union narrowing 오류를 분리해 수정했다. 이후 신규 테스트 helper 반환형이 전체 SessionCommand union이라 spread가 잘못 넓어져 실패, Extract로 좁혀 단독 typecheck 후 최종check PASS. 첫 Whale 시험은 select를 감싼 label의 옵션 텍스트가 accessible name에 포함돼 exact 라벨 탐색 timeout; label htmlFor/고유 ID로 분리 후 재시험 PASS. 반복 실패 RSI 분석/이력·critic 확인: 기존 원인 분석 규칙으로 충분하고 프로젝트 타입/라벨 오류를 전역 규칙으로 올리지 않았다.
- 한계: 실제 영상/음원·media ended/자동재생 거부, 편집pause 협의, 중복 Player의 단일 실행 권한/lease, 재시작 시 실행 주체 교체, 5분 물리 focus/듀얼 모니터/오프라인 장시간/렌더 지연 정책은 남음. PDF ready 전에는 넘어가지 않지만 경과시간은 PLAY commit부터 시작한다. 짧은 headless 시간 시험을 전체 재생·포커스 독립 지원이나 Stage B 완료로 승격하지 않는다.

## 2026-10-12 03:10 재생 체크포인트와 자료 교차 상태

- B-PLAYBACK-STATE-01 / PRD v5 §11·Stage B / FR-004/005/006. `media/autoplay.ts`는 슬라이드 > 자료 > 세션 규칙, 경과 시각, 시간·미디어 종료의 결합 조건, 페이지/자료/범위 반복 대상을 순수 함수로 계산한다. 실행 타이머가 아니다. 자료의 optional `autoplayCheckpoint`는 이전 schema1과 호환된다.
- core의 실제 다른 자료 전환/종료는 이전 미디어 bookmark를 정지하며 위치를 유지하고 자동 넘김 경과시간을 보존한다. 자료 타이머는 정지, 세션 타이머는 자료 전환만으로 정지하지 않는다. 같은 자료 활성화와 Editor 탐색은 정지 조건이 아니다. 수동 페이지 이동은 새 epoch/경과0/재개 대기로 바꾸되 자료 타이머는 계속한다.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check` 03:09 PASS: 19파일/192테스트, TypeScript/Vite/MV3/5개 스킬. 신규10개는 순수 우선순위·시간·반복·교차/동일 자료·수동 이동·검증/백업 불변·정지 복구와 fake IndexedDB strict 저장/실패 rollback/중복/재연결을 검사한다. 새 패키지/권한 없음.
- `verify-whale-foundation.mjs` actual Whale5.39.412.57/Chromium150 headless PASS, profile1791742195315. 전용 시험 DB에 합성 running metadata를 넣고 실제 Remote→worker→strict DB A→B→A를 실행했다. 경과시간은 commit 시각과 시작 시각의 차이로 정확히 계산, bookmark 7초 유지/paused, 자료 타이머 정지, 마지막 A5/Editor 선택/전체 델타 유지. Remote 닫힘 이후와 정상 Whale 프로세스 재실행 후 전체 상태 일치. 기존 빠른 편집/노트 보호/백업 확인/현재·전체 종료/PDF 복사본 출력·독립 reader 회귀도 통과했다.
- 한계: 이번 fixture는 실제 영상/음원 재생이 아닌 상태 metadata다. Player deadline 실행, Remote 규칙/재개 UI, 미디어 ended/자동재생 거부, 편집 pause 정책, 5분 다른 앱 focus/물리 창/실제 OS chooser·downloads·비정상 종료는 미실시다. 자동 넘김/미디어 기능 완료나 Stage B 전체 완료로 판정하지 않는다. 다음: 좁은 Player advance 권한·epoch/revision gate와 Remote 조작을 연결한다.

## 2026-10-12 02:59 Player 빠른 편집 진입

- B-QUICK-EDITOR-01/PRD v5 §13/StageB/FR-005/006. Player 현재PDF에서 우클릭/편집아이콘/600ms touch longpress로 현재페이지의독립Editor를연다. Escape/8px이동/up/cancel/leave/페이지변경/unmount에서timercleanup. hover/focus에서작은아이콘만표시하며 private내용은Player에없다.
- OPEN_CURRENT_EDITOR exact request/internalSELECT_EDITOR_SLIDE의sessionId/documentId/slideId/revision/commandId를검사한다. Player만허용, sender query수업과request수업일치, 현재presented target/closed·stale검사→strict선택commit/receipt→Editor창재사용. 원시Player편집권한은계속거부한다. Hub는publicsnapshot, worker최종응답은windowId만반환, 실패는generic문구. 창열기실패시Editor선택은남을수있으나발표/델타는변경하지않는다.
- 최종check02:58 PASS: 17파일/182테스트·타입/Vite/MV3/스킬. 신규5tests은선택만commit/public노트비노출·중복/현재target·stale/역할·raw권한/shape/다른수업window차단. 첫check182tests통과뒤 Extract가union discriminator때문에never타입이돼실패; 기존GOTO|SELECT union을Extract후SELECT교차타입으로좁혀수정/최종PASS. 새권한/패키지/외부쓰기없음.
- actualWhale5.39.412.57/Chromium150/headless PASS: A5발표/A8노트확정뒤미확정노트→Player우클릭/편집아이콘→동일Editor페이지수유지(새창없음)·발표선택/전체documents동일·Editor선택A5·held노트draft그대로유지. draft취소/A8복귀→합성pointertouch600ms메뉴/아이콘 재진입통과. 다른수업request는FORBIDDEN. 이후기존저장/current·allclose/PDFcopy/CSP/정상재시작시험도통과.
- profile1791741525867/player-quick-editor.png직접확인: A5그대로,44px아이콘은오른쪽아래·본문겹침없음. 실제물리longpress/터치IME/듀얼모니터Editor배치/5분focus·미디어/DB실패·window실패실기기인수는남음. headless에서선택불변증거를물리학생화면전체보장으로승격하지않는다. 창은수동교사화면배치가필요할수있다. 제품전체목표유지.

## 2026-10-12 02:51 PDF 수정본 저장 UI/확장 출력

- B-PDF-COPY-02/FR-013/014. Editor PdfExportControls 확정 snapshot/캡처revision/draft잠금/생성취소/작업중닫힘경고/이후변경안내 구현. chooser는 클릭중동기호출 후 원본참조/생성 await, 새emptyPDF만 저장. localFile의 기존JSON 경계를 format인자로 공유, savePdfFile은 PDFheader/MIME/256MB/ownbytes·write-close-readback/download완료를 검증한다. PDF에 .wcp.json 저널을 만들거나 dirty/상태를 지우지 않는다. 가리개는 redaction이 아님을 UI에 명시한다.
- 최종check01:05 PASS: 16파일/177테스트, TypeScript/Vite/MV3/스킬. 신규7테스트는 PDFpicker 동기/MIME·ownedbytes/readback·저널없음·nonempty/잘못된확장거부·write/close/readback실패·취소/비PDF/path거부·download완료를 검사한다. PDF writer가 실제localchunk로 빌드됨. 새패키지/권한은 이번 단계에 추가하지 않았다.
- 실제Whale5.39.412.57/Chromium150/headless extension PASS: B8 가리개 초안 중PDF저장잠금→확정→nativeOPFS handle선택→실제generator/font/PNG/worker·CSP→write-close-readback완료. 생성8pages PDF를Node가PC fixture에 저장, 별도Node PDF.js/canvas로8page열어 blackRGBA0,0,0,255/원본검색text B - Page 8 확인. 원본hash동일·수업전체상태완전동일, 같은출력파일재선택거부(내용불변), chooser취소상태불변. 기존current/all-close/twoEditordraft/정상재시작도 PASS.
- 최종profile1791741106632; pdf-copy-reader.png/380px editor-380.png 직접확인, 가로overflow없음/새저장버튼·경고·취소문구 겹침없음. 첫독립Node reader는 font file URL로경고가나와실제Windows경로로수정, 재시험에경고없음. 01:05에는check/Whale실행이겹쳐기존빌드가검사될수있었으므로02:51에는완성dist로실행하고가리개보안안내 exacttext존재까지assert해PASS. rg Windowsglob 경로실패는 -g대신literalglob사용오류였으며 코드검사실패아님.
- 한도/제한: chooser는OPFS대역이고Node가PC fixture를작성했다. nativeOSchooser/Whaledownloads/native외부PDF뷰어/실물교사PDF/암호·고급양식·action/annotation·대용량·비정상종료는미실시. 오버레이문자는raster이고가리개아래원본정보는남는다. 기존PDFactivecontent정화/보안삭제로보장하지않는다. PDF형식supported/StageB/전체제품완료로승격하지않는다. 다음: 물리출력인수/Player빠른편집·미디어·타이머/Preflight/후속포맷.

## 2026-10-12 00:58 PDF 수정본 생성 엔진 실험

- PRD v5 Stage B/§14, FR-013/014, B-PDF-COPY-01 일부. pdf-lib1.17.1 MIT 고정 writer 후보, src/export/pdfCopy.ts와pdfCopyCanvas.ts 구현. source hash/페이지·overlay 검증 후 원본페이지 유지/공개PNG레이어만 추가한다. crop/rotation/UserUnit viewport 역변환, hidden 제외, 원본/확정 document clone, 취소/렌더실패 유지, 이미지8MP/32MB·전체128MB·출력256MB 제한. 암호 우회 없음, 원본 active content 정화 보장은 아님.
- 최종 check00:57 PASS: 16파일/170테스트·타입/Vite/MV3/스킬. 신규11테스트는 실제PDF load/save·crop/rotation/원본bytes·델타 불변·private 제외/hidden·비동기 snapshot·hash/페이지/invalid/용량·취소·4회전+UserUnit 행렬·singular 검사. UI에서 아직 사용하지 않아 writer 코드의 production bundle/CSP 인수는 다음 단계다. 새고지5개 dist/licenses 포함, dependency inventory114개.
- 실제 Whale5.39.412.57/Chromium150 headless **dev origin** PASS: 합성4페이지 CropBox[20,30,520,430]/rotation0·90·180·270에 한글/빨간mask/파란pen 합성 후 writer와 독립적인 PDF.js로 재렌더. 모든page view/원본 검색text 동일, maskRGBA255,0,0,255·stroke0,0,255,255, progress1..4, source hash/delta 불변. rotations.png 직접 확인: 한글 읽힘, 오버레이 정방향, 원본 글씨만 각원래회전 유지. src에 UI변경 없음. Node가 생성한 PC synthetic-original.pdf/synthetic-modified.pdf이며 제품의 사용자 저장 API 검증은 아니다.
- 원본 SHA256 `776d805644a1bbe20603c0168f880d159ab83c044ecb5951898e32d4b5550460`, 수정본 `7cf8e395703f53b3a79ed2e41c72ba963cb255269689648a100c8ef8477c0251`, output node_modules/.cache/pdf-copy-spike. 오버레이글씨는 raster이며 검색성 없음; 원본텍스트는 검색가능 유지. 폰트 파일 embedding 없음.
- 실패/수정: 첫170테스트 PASS 뒤 fixtureSourceRef/mock tuple 타입오류, 다음검사에는 document 매개변수 DOM shadow/optional undefined 오류. 원인분리·source narrowing/mocksignature/매개변수rename/delete optional 후 단독 typecheck 및 전체 check 통과. 브라우저스크립트는 Windows dynamic import URL, Vite root(src) URL, 새 dependency optimizer page reload 각각 종료됐다. pathToFileURL/관찰한root 경로 수정, server최적화완료로그 후 재실행 PASS. RSI 이력/critic 검토: 기존2회실패원인분석 규칙 적용, 일회성타입/URL 문제를 전역규칙으로 올리지 않았다(C1/C4/C5). 전역하네스변경 없음.
- 미실시: 사용자 저장 UI/readback/chooser/downloads, 확장빌드 CSP의 PDF writer 실제 실행, native 외부PDF뷰어, 암호·양식·annotation/action·실제 교사자료/최대용량/회전별물리화면. PDF export supported/완료 승격하지 않는다. 제품전체목표 유지, 다음은 captured revision 기반 UI와 실제파일 저장검증 연결이다.

## 2026-10-12 00:48 전체 자료 종료

- 관련: PRD v5 §6.3/14/28, FR-015/020, B-ALL-CLOSE-01. Remote 별도 확인/자료별 saved·without-backup·unchanged/부분 결과/남은 자료 재확인 구현. 종료는 비삭제형이며 전체 제품 완료 판정이 아니다.
- 최종 check(00:49) PASS: 15파일/159테스트, TypeScript/Vite/MV3/스킬. 전체 saved·한 번 검증·중복/현재 실패 유지·현재 성공 검정대기·모든 저장 실패 무변경·dirty unchanged 거부·정확 scope/권한/raw batch 차단·경쟁 revision/CAS·put-success 뒤 abort rollback·전체 종료 session timer checkpoint와 Editor selection 보존을 검사했다.
- actual Whale5.39.412.57/Chromium150/Windows headless PASS: 기존 MV3/독립 창/PDF/private note/현재 종료/두 Editor 노트·판서 초안 보존 시험에 전체 종료 취소→수업 전체 동일, A without-backup/B saved·오래된 파일→A만 종료/B 전체 상태 유지/검정 대기, 남은 B 재확인→native OPFS 새 파일 write/close/readback·완료 저널→내용으로 생성한 PC fixture 선택→실제 worker 검증→전체 closed를 추가했다. B 미확정 노트는 두 종료에 걸쳐 그대로 유지되고 정상 process 재실행 후 all-closed session 전체 일치.
- 최종 profile `node_modules/.cache/whale-foundation/profile-1791733778085`. 380px `all-close-partial-380.png` 직접 확인, 내부 가로 overflow 없음. 첫 스크린샷의 재확인 버튼 단어 분리를 keep-all/flex basis로 수정하고 check/actual Whale 재시험 PASS. 제목/자료 선택/오류/결과/버튼 겹침 없음.
- runtime/windows/DB/PDF/파일 검증은 mock이 아니다. 사용자 PDF chooser와 출력 chooser는 대역이며 OPFS 출력을 Node로 PC fixture에 생성한 뒤 선택했다. 실제 OS chooser/Whale downloads/물리 모니터/IME·터치/비정상 종료/focus·미디어/교사 실물 파일은 미실시다. 합성 개인정보 없는 자료만 사용, 새 패키지/권한/원본 수정/커밋/푸시/배포 없음.
- 남음: PDF 복사본의 실제 출력·원본hash·외부뷰어, Player 빠른 편집 진입/미디어·타이머, 영구 정리·256저널 한도 UX, Preflight/PPTX/Bridge/후속 포맷/라이선스·공모전 최종 인수. Headless 통과를 전체 지원 확정으로 승격하지 않는다.

## 2026-10-12 00:31 현재 자료 종료

00:35 추가: 같은 Whale 시험에 두 번째 Editor의 노트 취소 후 판서 draft를 만들고 새 백업 없이 종료했다. 레이어 선택 ID/미확정 편집 상태가 그대로 남아 commit/unmount/학생 노출 없이 보존됨 PASS. 최종 profile `profile-1791732903703`; 아래00:31의 두 노트 시험도 함께 유지했다.

- 관련: PRD v5 §6.3/14/28, FR-015/020. 현재 자료의 발표 종료/검정 대기/명시적 재개를 구현했다. 전체 종료·영구 삭제·PDF 복사본·미디어 실행·전체 Stage B와 제품 완성은 남는다.
- 정책: doc.closed optional bool, 필드 없는 schema1 자료는 열림. 종료는 원본·델타·문서를 삭제하지 않고 발표 대상에서 제외한다. editorSelection/편집 UI key/초안은 유지하며 새 백업 없이 종료도 임시 복구 데이터를 제거하지 않는다. saved는 현재 전체 확정 편집정보만 대조하므로 미확정 초안은 파일에 포함되지 않음을 dialog에서 안내한다.
- check PASS: 14파일/150테스트, TypeScript/Vite/MV3/스킬. 현재만 closed/null 발표, 다른 자료/선택/델타 보존, 대상 media bookmark paused와 document timer checkpoint, 이전 필드없는 schema/잘못된flag·closed발표거부, implicit ACTIVATE 차단/명시적 REOPEN 마지막 위치, teacher 권한·raw CLOSE 우회 차단, worker saved 실패/unchanged dirty 거부/without-backup/unchanged 정상, strict CAS/중복/put success 뒤 abort/reconnect, closed 자료 private 편집 유지 확인.
- 실제 Whale5.39.412.57/Chromium150/Windows 전용 headless profile PASS. 실제 A/B 합성 PDF 등록, A5 발표/A8 노트, 실제 native OPFS 편집정보+완료 저널→PC fixture 선택/worker 재검증, 종료 취소·변조 파일 실패에서 수업 전체 동일, saved close→rgb(0,0,0) 대기, B 문서 전체 동일, **두 독립 Editor의 미확정 노트 그대로 보존**, A8 확정 델타 불변, 명시적 재개 A5, 새 백업 없이 종료→대기·초안 유지, 정상 전체 프로세스 재실행 후 closed session 전체 일치. runtime/windows/DB/PDF/worker 재검증은 mock이 아니다. 사용자 OS chooser는 대역이며 OPFS 출력 내용으로 생성된 PC fixture를 선택한 시험으로 실제 Whale downloads 인수는 아니다.
- 최종 profile `node_modules/.cache/whale-foundation/profile-1791732646678`; `close-dialog-380.png` 직접 확인. 380px dialog의 내부 가로 overflow 없고 세로 스크롤로 확정/취소 접근 가능, 제목/저장 선택/위험 안내/오류 문구 겹침 없음. Player는 검정 대기 스크린샷으로 기록했다.
- 첫 UI apply_patch는 같은 파일 add/update 중복 타깃으로 거부돼 단일 add로 수정했다. 문서 패치에서도 같은 제약으로 거부돼 파일당 단일 작업으로 수정했다. 거부 시 실제 쓰기는 없었다. check/Whale 기능 시험 실패는 없음. 새 패키지/권한/원본 변경/커밋/푸시/배포 없음.
- 남음: 전체 종료 자료별 선택, 영구 삭제/보존기간·256저널 정리 UX, closed 자료 수업 한도/메모리 관리, PDF 복사본·실제 OS chooser/downloads/IME/보이는 창·강제 종료·focus/media/후속 포맷·최종 라이선스/공모전 인수. closed가 텍스트 복구 데이터의 삭제를 의미한다고 보고하지 않는다.

## 2026-10-12 00:16 종료 전 저장 파일 재검증

- 관련: PRD v5 §14/28, FR-013/014, X-07 일부. Editor에서 선택한 로컬 `.wcp.json`을 VERIFY_SAVED_BACKUP으로 워커에 재검증한다. 종료/draft 동결/CAS는 아직 미구현이며 확인 결과를 종료 승인으로 쓰지 않는다.
- check PASS: 13파일/141테스트, TypeScript/Vite/MV3/스킬. arbitrary https/file/다른 extension/비정상 Blob URL을 fetch 전에 거부; 실제 stream 16MB/30초 한도, 빈/invalid/version/수업 ID/revision/전체 확정 내용/완료 저널 hash·bytes 대조. prepared/failed/다른 hash/다른 scope 거부. Player 권한 거부와 다른 연결의 확인 도중 revision 변화 재조회/오류, 무변경·publish 없음 확인.
- 실패 기록: 첫 check는141개 테스트 PASS였으나 TypeScript가 test fixture의 ArrayBufferLike/BodyInit 및 의도적 손상 cast를 거부했다. 소유 Uint8Array 복사 및 unknown 경계로 수정해 재검증 통과했다.
- 실제 Whale5.39.412.57/Chromium150 전용 headless profile PASS: native OPFS 새 출력 write/close/readback+저널→내용을 생성된 PC fixture에 저장→실제 file input 선택→실제 worker own Blob fetch/hash/전체 상태/완료 저널 재확인. 같은 revision의 노트 내용변조 거부/기존 수업 완전 일치. 기존 MV3/창재사용/A5·A8 비공개/Player권한/Remote닫힘/정상 재실행 복구도 PASS. OS chooser는 대역이고 OPFS 출력은 실제 PC 사용자 저장 위치 선택과 다른 경로다. PC fixture는 시험용 생성 파일이며 제품 다운로드 경로 인수로 확대하지 않는다.
- 실검증 실패/수정: 두 회의 file verification 대기는 PERSISTENCE_FAILED와 UI 오류로 끝났다. 브라우저 fetch를 dependencies 객체의 메서드로 호출한 문맥 문제를 `(...args) => fetch(...args)`로 고쳤고 파일 읽기 예외를 FILE_UNAVAILABLE로 분리했다. 수정 후 실제 Whale 통과. RSI 검토: 기존 '두 번 실패 시 원인 분석/방법 변경' 및 '실제 브라우저 검증' 규칙이 이미 있으므로 fetch 한 건용 전역 규칙을 추가하지 않았다(C1/C4 중복·과적합 방지). 전역 하네스 변경/배포 없음.
- 최종 profile `node_modules/.cache/whale-foundation/profile-1791731783972`, PC fixture `synthetic-backup.wcp.json` SHA-256 `6b13aa3381504d6109f88fa8e08b7101417fde93c84d283adf6fe197c8de612b`. 실제 extension Editor 380px 가로 overflow 검사 PASS, `editor-380.png`를 직접 열어 새 입력/긴 오류 문구 겹침 없음을 확인했다. 개인정보 없는 합성 자료만 사용했다.
- 미실시: OS chooser/Whale downloads/실제 사용자 PC 파일 저장 위치, 보이는 창/다중 모니터/IME/터치/강제 종료, 종료 CAS/다른 Editor draft freeze, PDF 복사본/미디어/PPTX/Bridge/웹 인수. 제품 전체 완성은 아니다.

## 2026-10-12 00:04 저장 저널·실제 Whale 기반 시험

- 관련: PRD v5 §14/22.6/28, FR-001/002/005/013/014/020, X-01 및 X-07의 일부. 종료 CAS/draft 동결/PDF 복사본/후속 포맷/최종 제품 인수는 미완료다.
- `scripts/dev.ps1 check`: Node24.19.0, 12파일/124테스트 PASS, TypeScript/Vite/MV3/스킬 검사 PASS. 저널 IDB add-only/terminal 불변/경쟁/abort/quota/strict/reconnect/256건 한도와 exporter picker 동기 호출·준비 전 writer 금지·captured mismatch·file complete/journal unrecorded·close 실패를 확인했다. fake-indexeddb는 디스크/Whale 증거가 아니다.
- `verify-session-files-browser.mjs <playwright> http://127.0.0.1:5173 http://127.0.0.1:5174`: production UI+manifest CSP PASS. 실제 PC JSON을 읽은 뒤 완료 대역 전달; 그 전 prepared/hash/bytes, 그 후 complete/downloadId, 다른 새 페이지에서 같은 저널 재조회, 취소 terminal, session/dirty 보존, native OPFS write/readback/no-overwrite 확인. backup SHA-256 `74071833550a86b3755b3e7c3d5e1443abbab08200affc302ddd1032dbb61f53`; 원본 `be751c4d0d51f7ff25f421971fdd5e50c3ec003083c7e9406dd0523c3f94009d`. Edge 보조이며 runtime/downloads broker/OS chooser는 대역이다. 380 Editor 화면을 직접 확인해 가로 overflow/겹침 없음을 확인했다.
- 설치 확인: `C:/Program Files/Naver/Naver Whale/Application/whale.exe` 및 version 폴더 실제 바이너리 `5.39.412.57/whale.exe`, Authenticode Valid/NAVER Corp. 사용자가 설치 진행했고 추가 installer는 실행하지 않았다. 앞선 winget hash mismatch는 설치 실패이며 우회하지 않았다.
- 실제 Whale: `verify-whale-foundation.mjs <playwright> <version-folder/whale.exe>` PASS. Chromium150/Whale5.39.412.57, Windows Win32, headless 전용 profile. 실제 dist MV3/background worker, `chrome.runtime.getContexts`/`whale.runtime.getContexts`, strict 수업 생성, 실제 windows API로 Player/Remote/Editor 생성·Player 재사용, 실제 합성 PDF A5 렌더, Editor A8 노트 확정 중 A5 유지, 공개 snapshot에 파일명/노트 없음, Player 쓰기 거부, Remote 닫힘 후 A5 유지, 정상 전체 context 종료/동일 profile 재실행 후 session 전체 일치. API mock을 주입하지 않았다. PDF file input 사용을 위해 native open picker만 비활성화했다. 실제 Player screenshot은 A - Page 5로 확인했다.
- 실패/수정 이력: Playwright 기본 launch에서 root executable exit0/version executable 0xC0000005. 최소 launch 진단 첫 회는 ignoreDefaultArgs로 transport/profile flags가 누락되어 180초 timeout; 이 회는 프로필 격리/제품 시험 증거로 사용하지 않는다. 명시적 user-data-dir/remote-debugging-pipe/15초 timeout을 추가했다. 이후 builtin 동영상 플러그인 worker를 제품 worker로 잘못 골라 ERR_FILE_NOT_FOUND/name mismatch; manifest.name 정확 대조로 제품 worker를 선택해 최종 PASS. 기본 옵션 오류 원인은 아직 확정하지 않았다.
- 출력: `node_modules/.cache/whale-foundation/{player,editor,launcher}.png`, 최종 profile `profile-1791731068880`; PC JSON/screenshot은 `node_modules/.cache/session-files-browser`. 개인 기본 프로필의 로그인/설정/파일을 읽거나 고치지 않았다. 임시5174 preview는 검증 후 종료하고 dev5173 유지.
- 미실시: 실제 보이는 창·듀얼 모니터/DPI, OS chooser/Whale downloads PC 출력, 실제 IME/터치, A/B 전환의 Whale 인수, autoplay/media/focus5분, 비정상 crash/PC 전원 손실, worker 출력 증거 재검증/종료, PDF 복사본/고급 PDF. 이번 headless PASS를 전체 지원/전체 Stage A/B 완료로 확대하지 않는다.

## 2026-10-11 23:42 Stage B 로컬 편집정보 저장·복구

- 관련: PRD v5 §14/28, FR-013/014/020, X-07/AT-13~15/IMPL-T-18/19/25의 일부. PDF 복사본·종료·실제 Whale/전체 Stage B는 미완료다.
- 환경: Windows / Node24.19.0 / 기존 Edge headless 보조. 실제 File/PDF·Hub·strict IDB·JSON parser·원본 재연결·브라우저 PC 다운로드·native OPFS writer 실행. 확장 runtime/downloads broker와 OS chooser는 대역이다. 개인정보 없는 합성 A PDF를 사용했다.
- 최종 `scripts/dev.ps1 check` PASS: 11파일/111테스트, TypeScript, Vite/MV3/스킬. 새23테스트는 version1 roundtrip/노트·stable ID·handle제외/복원대기·타이머정지, future schema/UTF-8/bytes/depth/node/document/page/fingerprint/형식 제한, 역할검증, native writer/write·close·readback 실패/취소/nonempty overwrite 거부/bytes복사, download 완료대기/조기event/own ID·owner/누락·크기·중단·취소·timeout, strict 새수업/기존보존/UUID충돌/invalid pre-DB이다.
- `verify-session-files-browser.mjs` build+manifest CSP PASS. actual PC .wcp.json 다운로드→Node read/hash 완료를 지연한 상태에서는 성공 문구가 나오지 않고 matching completion 이후 표시된다. 실제 파일의 format/version/notes/overlay/fingerprint 확인. draft 노트 중 저장 잠금, chooser 취소 후 기존 state/dirty 보존.
- Launcher에서 실제 PC 파일 재불러오기→strict 새수업(revision0, 발표 null, 마지막 A5/노트/마스크 보존)→동일 원본 File 재연결→Player 검정 대기→사용자 명시 ACTIVATE 후 A5 표시 PASS. 원래 수업 전체 state와 원본 SHA-256 불변. schema99 파일 거부 시 선택/기존 수업 유지.
- native FileSystemHandle 시험: 명시적으로 생성한 출력 OPFS 파일(원본 PDF 복제 아님) write→close→getFile bytes 검증 PASS. 같은 nonempty 파일을 두 번째 선택하면 writer 이전 거부, 실제 파일 내용 불변 PASS. 실제 탐색기·Whale 파일 chooser 경로와 구분한다.
- 원본 A hash: be751c4d0d51f7ff25f421971fdd5e50c3ec003083c7e9406dd0523c3f94009d. 최종 백업 hash: ccf9a709c1c101b42a8d5782872d355139df6ccff9766cf1d7ee2ed33354a706. exportedAt/sessionId 때문에 실행마다 백업 hash는 달라진다. 저장 파일·1366/380 Editor/Launcher screenshot은 node_modules/.cache/session-files-browser. 두 화면 직접 시각 확인, 가로 overflow/페이지 오류/외부 네트워크 요청 없음.
- 첫 보조 실행은 파일/복구 동작 후 Edge의 edge://downloads-hub 로컬 내부 자원을 외부 네트워크로 오분류해 검사 실패. 내부 스킴만 분리하고 최종 빌드 CSP 흐름을 재실행해 통과했다. 실제 외부 URL을 허용한 것은 아니다.
- downloads 권한만 추가했다. 공식 Chrome API의 saveAs/uniquify/onChanged/search/own extension metadata를 참조했고 실제 Whale API 보증으로 해석하지 않는다. 새 라이브러리/전역 설정·원본 수정·커밋/푸시/배포 없음.
- 제한: actual Whale downloads/OS chooser/파일명 충돌/권한 거부·디스크 full/PC 강제 종료/파일이 완료 직후 삭제된 경합/대용량 성능은 미검증. downloads의 exists 재조회는 OS 파일 삭제의 즉시 감시가 아니다. FSA 출력은 nonempty 기존 파일을 덮어쓰지 않아 새 이름이 필요하다.
- 다음: durable 저장 결과 저널과 종료 요청→선택→저장확인→CAS 확정, current close→검정 대기/전체 종료; PDF 복사본과 실제 외부 뷰어/원본hash; Player 빠른 편집 진입·autoplay/media·Whale 인수 및 Stage C~G.

## 2026-10-11 23:22 Stage B 오버레이 편집·확정

- 관련: PRD v5 §13/28, FR-008/009/010/014/016, X-06/AT-04~09/IMPL-T-04~10의 구현·보조 증거. Stage B/제품 전체/Whale 인수는 미완료.
- 환경: Windows, Node 24.19.0, 기존 설치 Edge headless. 실제 PDF A/B(이전 기록과 같은 SHA-256), Hub/strict IndexedDB/파일/Canvas/Windows Malgun Gothic. 확장 runtime transport만 대역이다. 개인정보·실제 학생 자료·외부 AI 요청 없음.
- 최종 `scripts/dev.ps1 check` PASS: 9파일/88테스트, TypeScript, Vite/MV3/스킬 검사. 새 8테스트는 양축 최대 크기·줄바꿈/grapheme·최소 overflow/수동 크기/빈 글/비정상 수치, overlay shape/추가 필드·색/좌표/중복·점수 제한, 선택/노트 보존·복사/revision·역할, strict DB 확정 및 quota 실패 rollback/재연결이다.
- `verify-pdf-browser.mjs` dev UI PASS, 최종 build UI + manifest CSP PASS(5173 control/5174 UI). B8 가리개 초안/undo/redo/확정 동안 A5 공개 레이어 불변. 현재 A5 가리개 확정 전 투명→확정 후 검정 pixel. 실제 판서와 한글 글상자 확정, 원본 PDF pixel/hash 불변. quota 실패 주입 시 초안·선택 잠금 유지/Player 불변, 재시도 성공. 외부 Editor 탐색 중 로컬 draft 대상 유지.
- 실제 Canvas 폰트 측정: 1280 기준 rect(.35×.25), 여백8/행간1.25, 16:9에서65px/4:3에서89px/세로에서상한96px. 다음1px 수동 크기가 들어가지 않는지 확인했다. 한글 1,000자 각 비율에서 최소12px 미수용 경고, UI 10,000자에서도 확정 불가/취소로 원문 복구. 이미 세로 한도를 넘은 숨은 뒷줄은 추가 측정하지 않아 불필요한 긴 입력 비용을 제한한다. 전체 성능 보장 수치는 아니다.
- compositionstart/end 이벤트 중 확정 잠금/종료 후 저장 PASS. 이는 실제 Windows IME 조작 검증이 아니다. 원본 검정 pixel 샘플은 검정을 그대로 반환하며 배경 후보는 원본 canvas만 읽는다.
- 5 viewport(1920/1366/1280/768/380) Editor/Player screenshot·가로 overflow PASS. 좁은 Editor와 Player 화면 직접 시각 확인. A5/B2/A5·비공개 노트·Remote 닫힘·중복 등록·warm offline·native handle IDB reload 기존 흐름도 함께 PASS. 외부 네트워크 요청/페이지 오류 없음. 산출물은 node_modules/.cache/pdf-browser.
- 개발 중 plugin 변경으로 Vite reload가 발생한 실행은 후반 locator timeout으로 실패했고 완료 판정에 사용하지 않았다. 수정 동결 후 dev와 production CSP 실행을 다시 통과했다.
- lucide-react 1.55.0 고정 도입(56패키지 audit/0 vulnerabilities), 실제 ISC/Feather MIT LICENSE 원문을 dist/licenses에 포함. 기존 libc metadata10개 보존, 라이선스 metadata 목록109개 갱신. 폰트 파일은 배포하지 않는다.
- 제한/미실시: 실제 Whale 확장·실제 IME/터치·Player 빠른 편집 진입·길게 누르기, 형광펜/레이어 순서 UI, 사용자 폰트/외부 PDF export, 수동 경계 이동·모서리 크기 변경 실기기, 비정상 PC 종료/다중 모니터/5분 미디어. 지원은 experimental 보조 증거이며 supported로 승격하지 않는다.
- 다음: 빠른 편집 진입 보완과 로컬 .wcp.json/PDF 복사본·저장 확인 후 현재 종료→검정 대기·전체 종료 → autoplay/media/Preflight → Stage D~G. 커밋/푸시/공개 배포 없음.

## 2026-10-11 22:56 Stage B PDF Import와 독립 렌더

- 관련: PRD v5 §5/7/14/19/24 Stage B 일부, FR-003/004/008/013/015, X-03/IMPL-T-02/03/04의 PDF 부분. 전체 제품/Stage B/실제 Whale 인수는 미완료.
- 환경: Windows, Node 24.19.0, PDF.js 6.4.299(Apache-2.0), Edge headless 보조 브라우저. extension sendMessage/port만 대역, 실제 Hub/IndexedDB/File/BroadcastChannel/PDF worker/캔버스 실행. dev 5173과 build preview 5174. 사용자 개인정보 없는 실제 바이트의 합성 A/B 각 8페이지(16:9/세로), standard Helvetica 폰트·색·선·문자.
- 설치: 정확 버전 npm install --ignore-scripts, 55 packages audit/0 vulnerabilities. 기존 libc metadata 10개 보존. PDF.js v6 API에서 제거된 isEvalSupported/proxy.destroy를 사용하지 않고 loadingTask.destroy 사용. SDK mjs에서 JS eval/Function 생성 로더를 도입하지 않았다. 부속 sandbox/QuickJS는 패키징 제외.
- `scripts/dev.ps1 check` PASS: 8파일/80개 테스트, TypeScript, Vite/MV3/로컬 PDF 자원/스킬 구조. 신규 PDF 테스트 14개: 입력/해시/형식·크기·헤더, 화면 양축/픽셀 상한, File runtime/handle-only 저장, 변경·누락·권한 실패/재연결, 16개 상한, 중복·델타 보존, 원본 bytes 거부, 3개/64MB LRU, 선행 렌더, abort/in-flight cancel/cleanup/destroy, 최대 페이지/실패 loading task.
- `verify-pdf-browser.mjs` PASS: 실제 File 입력 A/B 등록 → A5 렌더 → B8 독립 렌더/비공개 노트 저장(A5 불변) → B2 → A5 위치/중심 pixel 복원. 동일 File 재등록 document 수=2 유지, Remote 닫힘 후 Player 유지. 1920×1080/1366×768/1280×800/768×1024/380×760 Player/Editor screenshot·가로 overflow 확인. 대표 화면 직접 시각 확인. 외부 요청/페이지 오류 없음.
- build preview UI에 manifest CSP(script self/wasm-unsafe-eval, worker self)를 적용한 동일 흐름 PASS. 실제 worker와 PDF 표준 폰트는 자체 자원 경로. network offline에서 이미 열린 A의 6페이지 이동/픽셀 PASS. cold offline/새 worker 전환/Whale 확장 오리진을 대신하지 않는다.
- native handle: 시험에서만 명시적으로 생성한 OPFS PDF fixture의 FileSystemFileHandle을 제품 별도 IDB 참조 저장소에 저장 → 페이지 reload → 새 SourceVault/getFile/hash 확인 PASS. 제품은 원본 bytes를 OPFS에 복사하지 않는다. 실제 탐색기 파일/Whale 프로세스 재시작 권한은 미검증.
- hash A: be751c4d0d51f7ff25f421971fdd5e50c3ec003083c7e9406dd0523c3f94009d. B: 69849976e5c2669c6a22872a68c30ad2e8c2d91e177792ecb6a36ef412e764de. 등록 fingerprint와 일치, 시험 전후 합성 원본 buffer 불변. 생성 PDF/스크린샷: node_modules/.cache/pdf-browser.
- 엔진 chunk 약432KB/worker 약2.23MB, 자원 포함 패키지 약6MB(source map 제외). 렌더 캔버스별 800만 픽셀/DPR2/3페이지·64MB, 파일 실행 참조 16개·512MB/개별128MB. 이는 전체 프로세스 RAM/프레임 성능 보장이 아니다.
- 발견/수정: 등록은 성공했으나 port 응답이 완료 안내를 지워 초기 브라우저 wait 2회 실패. 실제 DOM/오류를 수집해 notice를 연결 오류와 분리하고 통과. 1회성 애플리케이션 경합이므로 RSI 비평상 전역 규칙 추가는 하지 않았다. 재등록 source-available이 이미 정상 렌더 중인 Player를 재생성하지 않도록 보존했다.
- 미실시: 실제 Whale 실행 파일/확장·탐색기 권한/고급 한글·사진·투명도·수식/암호 파일·대용량/PC 비정상 종료/미디어5분/전체 RAM. 라이선스/NOTICE와 Liberation 대응 source/재배포 조건은 공개 배포 전 검토. PDF experimental 정적 화면만, 다른 포맷 지원 승격 없음.
- 다음: overlay draft→commit/실제 font fit/판서·가리개 → 로컬 세션/PDF 복사본·저장 확인 후 종료 → autoplay/media/Preflight → 후속 Stage D~G. 전체 목표를 plans/2026-10-11-product-completion.md에 유지. 커밋/푸시/공개 배포 없음.

## 2026-10-11 22:22 Stage A 세션 메시지와 창 연결

- 관련: PRD v5 Stage A §6/14/17/20/22, FR-001/007/008/014/015. 제품은 Windows 네이버 웨일 전용이며 보조 Chromium 검사를 지원 브라우저 확장으로 해석하지 않는다.
- 환경: Windows, Node 24.19.0, Vitest/fake-indexeddb, 창/API 대역. 화면 배치는 설치된 Edge headless + 합성 runtime이다. 학생 정보/실제 수업 파일 없이 합성 자료만 사용했다.
- `scripts/dev.ps1 check`: 6개 파일/66개 테스트, TypeScript, Vite/MV3 빌드, 프로젝트 스킬 5개 구조 검사 통과.
- 추가 경계: sender.id/확장 페이지 URL, unknown 요청 shape/revision/원본 바이너리, 역할별 명령 허용, Player 공개 projection 복사/노트 배제, commit 실패/중복/stale 미배포, 최근 수업 생성/조회/새 Hub 복구.
- port 대역: 초기 Player 공개 상태, 다른 수업 미전송, Remote disconnect 후 Player 구독 유지, 새 worker의 DB snapshot 복구, unknown subscriber 차단. 실제 재생 지속 시험은 아니다.
- 창 대역: 동시 열기 합치기, 자체 runtime.getContexts 조회/기존 창 재사용, 수업 분리, Player focus 미회수, API 조회 불가 시 중복 생성 거부. 일반 탭 URL 조회에 의존하지 않으며 tabs 권한을 추가하지 않았다. 근거: [runtime.getContexts](https://developer.chrome.com/docs/extensions/reference/api/runtime#method-getContexts), [windows 탭 정보 권한](https://developer.chrome.com/docs/extensions/reference/api/windows).
- `verify-session-ui.mjs` PASS: 5개 viewport × Launcher/Remote/Editor/Player = 20화면, 가로 overflow 없음, 컨트롤 화면 폭/최소 44px, Player 검정 배경/교사 노트 비노출, editor dirty 선택 잠금/저장 확인. 대표 스크린샷 3개 직접 시각 확인. 저장 위치 node_modules/.cache/session-ui, 제품 패키지에 대역/Playwright 추가 없음.
- 실제 Whale: 표준 설치 경로와 등록에서 실행 파일을 현재 찾지 못했다. 과거 기록의 버전은 재확인되지 않았고 확장 로드/port 재연결/runtime.getContexts/strict DB를 실기기에서 검증하지 않았다. 지원 상태 승격 없음.
- 제한: 실제 PDF 가져오기/렌더, 미디어, 오버레이 편집, 종료/정식 export/다중 모니터는 미구현. 신규 수업은 자료 없는 상태이며 Player는 검정 대기 화면이다. 다음은 Whale 인수 및 Stage B PDF 수직 기능.
- 미리보기 서버: 이 작업에서 숨김 백그라운드 Vite를 127.0.0.1:5173에 실행했다. 일반 웹 미리보기에는 실제 확장 API가 없어 세션 기능은 실행되지 않는다. 배포/커밋/푸시 없음.

## 2026-10-11 22:04 Stage A IndexedDB 저장과 복구

- 관련: PRD v5 §14/22/24 Stage A, FR-014, AT-15/IMPL-T-11의 저장 계층 부분. 실제 Whale 인수 전체 통과를 뜻하지 않는다.
- 환경: Windows, Node 24.19.0, npm 10.2.4, fake-indexeddb 6.2.5(개발 전용), 실제 Edge 155.0.0.0 headless(웹 오리진 http://127.0.0.1:5173).
- 재현 설치: scripts/dev.ps1 install 통과. 51개 설치/52개 audit/0 vulnerabilities. 정확 버전 lockfile 사용, 기존 Linux libc metadata 보존.
- 전체 검증: scripts/dev.ps1 check 통과. Vitest 4개 파일/40개 테스트, TypeScript, Vite/MV3 산출물, 프로젝트 스킬 5개 구조 검사 통과.
- 신규 통합 테스트 13개: 생성/중복 생성/없는 세션, 페이지·편집 선택·노트·receipt 재연결 복구, 두 연결 CAS 경쟁, put success 후 abort 원자적 rollback, quota 오류/재시도, receipt 위조 거부, 손상/미지 schema 보존, 원본 바이너리 거부, 응답 불변성/닫힌 연결, 상위 DB 버전, receipt 상한/만료 명령, 선택/overlay 범위 검증, strict durability를 무시하는 브라우저의 쓰기 거부.
- 실제 브라우저: verify-storage-browser.mjs PASS. 전용 테스트 프로필에 A 자료 등록, A5 발표 선택/A8 편집 선택/비공개 노트 기록 후 브라우저 context 종료(프로세스 종료), 같은 프로필로 새 프로세스 실행. revision 5/자료 메타데이터/선택/노트/receipt 5개 복구, network offline 뒤 재조회 동일 확인.
- 실제 파일 PDF 렌더는 없다. 합성 metadata/페이지 ID의 저장 시험이다. PC 강제 종료/전원 차단/Whale 확장 오리진/미디어/정식 export/공개 상태 분리/UI 연결은 미실시.
- 브라우저 시험 시작 시 Playwright Chromium 바이너리 미설치로 실패하여 설치된 Edge channel을 명시했다. Vite root가 src이므로 import URL을 /storage와 /core로 수정한 뒤 통과했다.
- 재설치 중 실행 중이던 테스트 Vite 서버가 native 모듈을 잠가 EPERM이 발생했다. 이 작업에서 생성한 서버만 종료하고 npm ci/check를 재실행해 통과했다. 시스템 설정/개인 브라우저 프로필/기존 사용자 프로세스 변경 없음.
- 검증 근거: [IndexedDB transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [transaction complete](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event). strict 요청과 complete 판정은 실제 Whale에서 후속 확인해야 한다.

## 2026-10-11 PRD v5 개발 환경 / Stage A 첫 단위

- 환경: Windows, Asia/Seoul, 선택 런타임 Node 24.19.0, npm 10.2.4. 시스템 PATH의 Node는 20.11.1이며 변경하지 않았다.
- 저장소: LUCKYBRIDGE/naver-ppt의 origin/master에서 로컬 codex/prd-v5-foundation 브랜치 구성. 커밋/푸시 미실시.
- 설치: scripts/dev.ps1 install로 npm ci 통과, audit 51 packages / 0 vulnerabilities. 새 패키지와 lockfile 변경 없음.
- 검증: scripts/dev.ps1 check 통과. 스킬 5개 구조/참조, Vitest 3개 파일/27개 테스트, TypeScript, Vite 및 MV3 산출물 검사 통과.
- 신규 테스트 12개: 등록 중 학생 선택 보존, A5→B2→A5, A5 발표 중 B8 선택/노트, revision/session/target 검증, 중복 등록, 상속 키 거부, commit 후 성공, 실패 후 재시도, 서비스 재생성 중복 방지, 동시 요청 충돌, receipt 상한/응답 불변성.
- 관련: PRD v5 §6/14/22/24 Stage A, FR-003/004/008/014/015. 실제 기능 인수 전체를 통과한 것은 아니다.
- 설치 중 확인한 문제: npm.cmd는 인접 Node 20을 선택해 rolldown native optional binding을 설치하지 않았다. npm-cli.js를 Node 24로 직접 실행하여 재설치 후 해결. TLS 검증과 시스템 설정을 변경하지 않았다.
- 미실시: 실제 Whale 로드/창 조작, 실제 IndexedDB 트랜잭션/재시작 복구, PDF/미디어/저장/오프라인/E2E. 상태 테스트는 합성 페이지 ID와 repository 대역이며 실제 렌더/영속화 증거가 아니다.
- 원본 PRD v5 SHA-256: 0fd31e9d3766d99d056da274af819a001de1658e78715d3eb49ede63e71c15e3. 원본 수정 없음.

기준일: 2026-10-08 (Asia/Seoul). 개발 기반과 제품 기능 인수를 구분한다.

## 기반 구축 검증

실행 환경: Windows / Node.js 24.15.0 / npm 11.12.1. 프로젝트 의존성은 package-lock.json 기준이다.

| 검사 | 결과 | 범위 |
|---|---|---|
| 원문 복사·해시 | 통과 | 원문과 docs/source/spec-v4.md 바이트 일치; provenance.json SHA-256 |
| 요구사항 추출 | 통과 | FR 23개, AT 20개, X 10개, IMPL-T 28개 |
| 프로젝트 스킬 | 통과 | Node 구조/내부 참조 + skill-creator quick_validate 5개 + UI YAML 5개 |
| 타입 검사 | 통과 | tsc --noEmit; TypeScript 계약·UI·설정·테스트 |
| 자동 테스트 | 통과 | Vitest 2개 파일, 15개 테스트; 창 허용 목록·sender·오류/결과 누락 경로 |
| MV3 빌드 검사 | 통과 | Vite 8.3.3; manifest·module worker·네 HTML·패키지 script 경로 |
| 문서 내부 링크 | 통과 | 문서/스킬 Markdown 24개 검사; 보관 원문은 링크 검사 제외 |
| 라이선스 목록 생성 | 통과 | npm run licenses; lockfile 94개 항목 metadata, 법적 배포 검토 별도 |
| 웨일 실기기 | 미실시 | 설치 파일 존재 확인만; 로드/창/포커스/재생 검증 아님 |
| PDF·저장·E2E·다중 모니터 | 미실시 | 후속 기능 미구현 |

실행 명령: `npm run check`, 설정 경고 수정 후 `npm run build`, `npm run licenses`. 최종 빌드에 경고/오류가 없다. 초기 타입 검사에서 창 생성 결과 누락 가능성을 확인해 오류 응답을 보완하고 관련 테스트를 추가했다.

스킬 제작 도구의 공식 검사에는 PyYAML이 필요했다. `node_modules/.cache/skill-validator-python`에 PyYAML 6.0.3을 검증용으로만 설치해 실행했고 전역 Python/스킬 설정은 수정하지 않았다. 일반 `npm run check`는 Python에 의존하지 않는다. 시스템 CA 사용으로 의존성 설치 인증서를 검증했으며 TLS 검증을 비활성화하지 않았다.

웨일 설치 파일의 버전 정보는 5.39.412.57로 확인했다. 확장을 실제 브라우저에 로드하거나 기능을 조작한 결과는 아니다. 실제 제품 X/AT/IMPL 시험은 아직 통과한 것으로 표시하지 않는다.

## 후속 결과 양식

```text
실행 일시 / 변경 단계 / 관련 FR:
테스트 ID와 명령/수동 절차:
OS / 브라우저 버전 / 디스플레이·DPI / 권한:
샘플과 해시:
기대 결과 / 실제 결과:
판정: 통과 / 실패 / 미실시
로그·산출물:
제한·재현·후속 조치:
```

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

- docs/ACCEPTANCE_AUDIT.md에 10종 실제 웨일 1쪽 순회 결과와 페이지 불일치 재검증을 연결했다. 실행 성공은 기준 비교·충실도 완료와 분리한다.

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


## 2026-10-15 09:37 — 자동 회귀 재실행

- scripts/dev.ps1 check: PASS. sourceCount=10, pairedCount=10, 103 test files / 1,424 tests, TypeScript·Vite·MV3 build PASS.
- 실제 Whale 물리·cold-offline·전체 PPTX fidelity는 별도 미완료.


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


## 2026-10-16 01:55 — foundation 최신 재검증

- 최신 실제 Whale foundation PASS, profile 1792083025987.
## 2026-10-16 — 새 자료 inspection

- Downloads 새 PPTX 별도 inspection PASS(profile `1792083126421`): 3쪽·64요소·preview 3쪽·원본 보존·외부 요청 0. 대응 PDF가 없어 fidelity corpus에는 추가하지 않았다.
- inspection verifier의 0-based navigation bug를 수정했고 전체 check PASS.

## 2026-10-16 11:13 KST — owner PC GitHub 동기화 및 개발 환경 검증

- 범위: 기존 FR 전반의 개발 환경 회귀, 새 기능 추가 없음. `master` e49cdd2 → 8bf1175 fast-forward, 원격과 ahead/behind 0/0. 동기화 전 로컬 변경 없음.
- 환경: Windows 11 Home 10.0.26200, Node 24.15.0, npm 11.12.1, 설치 Whale 5.39.412.57. 작업 폴더 `C:/Users/owner/Documents/ChatGPT/naver-ppt`.
- 설치: 첫 `npm ci`에서 UNABLE_TO_VERIFY_LEAF_SIGNATURE로 중단. 설치 프로세스에만 NODE_OPTIONS=--use-system-ca를 적용한 재실행 성공(63 packages, audit 0 vulnerabilities). 전역 설정 및 lockfile 변경 없음.
- `npm run check` exit 0: 스킬 5개, 103파일 / 1,424테스트, TypeScript·Vite·MV3 빌드 PASS. `dist` 생성 완료.
- 자료 inventory는 sourceCount=0, pairedCount=0. Git 제외 test-materials와 이전 PC 검증 산출물은 GitHub 동기화 대상이 아니다. 자료 검사는 빈 목록에도 exit 0이므로 실제 자료 인수 통과로 해석하지 않는다.
- `node scripts/verify-whale-foundation.mjs <bundled Playwright index.mjs> <installed whale.exe>` exit 1. profile-1792116768728에서 브라우저 시작 직후 종료, launchPersistentContext의 Target page, context or browser has been closed. 제품 시나리오 미진입이며 원인은 미확정이다.
- 미실시: 이 PC의 실제 Whale 기능 인수, 물리 모니터/DPI·IME·장시간·cold-offline, 실제 PPTX/PDF 비교 및 성능. 이전 PC의 PASS/FAIL 기록과 지원 판정은 유지한다.
- 다음: 격리 Whale 자동 실행 환경 진단 및 합성 foundation 재검증, 실제 원본/기준 PDF 확보 후 충실도·메모리 검증 재개.

## 2026-10-16 KST — 개발 위치 변경 검증

- 사용자 지정 개발 위치 `C:/ai_dev/apps/naver-ppt`에 Git 이력·원격·미커밋 변경·의존성을 복사 보존했다. 기존 경로는 앱 사용 중 잠금으로 보존했고 자동 삭제하지 않았다.
- 복사 직후 Git porcelain 상태가 기존 경로와 동일함을 확인했다. 새 경로 `npm run check` exit 0: 103파일/1,424테스트, TypeScript·Vite·MV3 PASS. 실제 자료는 0종/0짝이며 Whale 재시험은 하지 않았다.
- 이후 개발은 새 경로에서 수행한다. Codex 프로젝트 UI 연결은 새 폴더로 다시 열어야 한다.

## 2026-10-16 KST — owner PC 로컬 검증 자료 준비

- 범위: FR-003/013, IMPL-T-02/17/28의 입력 자료 준비와 구조 검사. 제품 렌더링/미디어 인수와 구분한다.
- 기존 로컬 파일에서 PPTX/PDF 10쌍을 Git 제외 test-materials/originals 및 powerpoint-reference로 복사했다. 쌍 합계 47,445,663 bytes, 11~18쪽이며 모든 쌍의 슬라이드/쪽 수가 일치한다.
- SHA-256 복사 전후 대조와 PPTX ZIP CRC 검사 PASS. pypdf 구조 검사, PDFium으로 PDF 10종 첫/마지막 총 20쪽 렌더 PASS. 대표 2쪽을 이미지로 열어 확인했다. 첫 렌더 시도는 PyMuPDF 미설치로 실패했고 기존 번들 PDFium으로 완료했으며 새 의존성을 설치하지 않았다.
- 9쌍은 PowerPoint Producer와 16:9 종횡비가 일치한다. 나머지 1쌍은 종횡비가 불일치한다. 동일 버전/시각 충실도는 모두 미확인이다. 원본 경로·해시·수치·선정 스크립트·렌더 보고서는 Git 제외 manifest.local.json 및 reports에 보관한다. 본문/원본은 업로드하지 않았다.
- 사용자가 originals에 추가한 마스크(2)~(4) 3종도 다운로드 원본과 해시 일치를 확인했다. 각각 36/33/28쪽, audio/video 항목 6/5/5개, timing 존재 33/31/26쪽이다. 항목 존재는 재생 지원 판정이 아니다.
- 마스크(4)는 163,248,376 bytes로 현재 128MiB 입력 한도 초과 거부용이다. 마스크(2)/(3)은 한도 이내다. 같은 stem PDF는 모두 1쪽이므로 슬라이드 기준 출력으로 채택하지 않았다.
- npm run check:materials: sourceCount=13, pairedCount=10, exit 0. git check-ignore로 자료/manifest 제외 확인. 제품 코드 변경 없음으로 전체 check는 반복하지 않았다. 직전 새 경로의 1,424테스트·빌드 PASS를 유지한다.
- 실제 Whale 제품 렌더·미디어·원본 앱 3축 비교는 이번 준비 작업에서 미실시. 다음은 한도 이내 자료의 제품 경로 점검, 마스크(4) 거부 경계, 메모리 및 실제 미디어 재생이다.

## 2026-10-16 KST — 128MiB 한도 이내 실제 Whale 점검

- 사용자 요청대로 현재 입력 한도를 유지하고 한도 이내 12종만 제품 dist에서 검사했다. 마스크(4)는 거부 시험에도 사용하지 않았다. 한도 확대는 docs/plans/2026-10-16-input-limit-followup.md에 후속 개발로 기록했다.
- FR-003/004/008/013, IMPL-T-02/04/05/28. Windows 11 Home 10.0.26200 / Node 24.15.0 / 실제 Whale 5.39.412.57(Chromium 150), 격리 headless. 원본 지문/경로는 Git 제외 manifest와 reports에 보관한다.
- Application 루트 whale.exe의 시작 즉시 종료를 재확인했다. 버전 디렉터리의 실제 whale.exe를 사용해 제품 검증에 진입했다. 첫 foundation은 합성 MP4 캐시 부재로 ENOENT, 기존 video-spike로 합성 H.264 인코딩/디코딩/픽셀 시험 PASS 후 재실행했다. 환경 재현 방법을 DEVELOPMENT.md에 추가했다.
- foundation profile-1792129509904 exit 0 PASS: PDF 편집/비공개 노트/저장/복구/현재·전체 종료·자동 넘김·Player 소유권·Worker 재시작·실제 WAV 및 합성 H.264 Player 회귀. 무음·합성 입력·OPFS picker stand-in이며 물리 인수와 구분한다.
- 실제 PPTX 검사 12종 exit 0, 감지/모델 슬라이드 수 일치. 그러나 전체 쪽 미리보기 검사 통과 1종, 일부 쪽 표시 실패 9종, 첫 쪽 표시 실패 2종이다. 종료 코드만으로 화면 PASS라 하지 않는다. 자료별 실패 쪽과 결과 ID는 docs/pptx/OWNER_PC_IN_LIMIT.md에 기록했다.
- 마스크(2): 36쪽/156요소/116효과, 마스크(3): 33쪽/115요소/83효과. 둘 다 첫 쪽 미리보기 표시 실패다. 글꼴 참조는 각각 9종 중 1종, 8종 중 1종만 확인됐으며 실패 원인을 글꼴로 확정하지 않는다. 내장 MP3 실제 재생/원본 트리거 비교는 미실시다.
- 12종 모두 기존 세션·학생 canvas 보존 및 실행 후 SHA-256 일치를 확인했다. 완전 검사 경로를 마친 10종은 외부 요청 0, pageErrors 0, 5 viewport 무가로넘침을 확인했다. 조기 종료한 2종에는 이 최종 검사 결과를 확대 적용하지 않는다.
- 제품 소스·의존성·한도 변경 없음. 전체 check는 반복하지 않았고 직전 1,424테스트·타입·Vite·MV3 PASS를 유지한다. 문서 git diff --check 실행. 실제 PowerPoint 기준 3축/물리 메모리/가청 출력/OS chooser/다중 모니터/장시간은 별도 미완료이며 지원 등급을 유지한다.
- 다음: 한도 이내에서 발견한 쪽별 렌더링 실패 최소 재현과 원인 확인을 진행하고, 이후 자원 예산을 검증하며 입력 한도를 확대한다.
