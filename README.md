# 웨일 클래스 프레젠터

PPTX source 수명별 논리 자원 인벤토리를 연결했습니다. **1,424개 테스트·빌드와 실제 웨일 회귀는 통과했지만, 전체 origin byte 예산·물리 메모리·최종 성능 인수는 아직 미완료입니다.** [범위와 수치](docs/pptx/RESOURCE_INVENTORY.md). 열린 원본 참조는 편집창별 16개·512MiB이며, 이는 전체 브라우저 메모리 한도가 아닙니다.

PRD v5 최종 인수 상태는 [감사표](docs/ACCEPTANCE_AUDIT.md)에서 기준별로 확인할 수 있습니다. 현재 PPTX 지원 등급은 `unverified`입니다. W0 외부 링크는 저장 경계만 검증했고 실제 탭 실행은 미완료입니다.

PPTX 내장 미디어가 검증된 모델 URL을 공유하도록 바꾸고, 실제 웨일에서 추가 음원 URL 없이 재생·재준비·해제를 확인했습니다. **1,412테스트·빌드와 제품 회귀는 통과했지만, 전체 메모리 기준은 여전히 초과합니다.** [결과와 제한](docs/pptx/BORROWED_MEDIA_URL.md).

원본 재연결을 취소하면 대기 중인 검증을 제거하고 늦은 결과가 새 연결을 덮어쓰지 않도록 했습니다. **1,403테스트·빌드와 실제 웨일 준비/저장/미디어 회귀를 통과했습니다.** 전체 메모리 예산과 최종 제품 인수는 계속 진행합니다. [검증 범위](docs/pptx/SOURCE_CANCELLATION.md).

여러 창의 PPTX 읽기·등록·점검·모델 준비를 직렬화하고, 실제 웨일 popup 두 창에서 대기·취소·실패·닫힘을 확인했습니다. **1,395테스트·빌드와 제품 회귀는 통과했지만, 대용량 메모리 기준과 전체 모델 자원 예산은 미완료입니다.** [검증과 제한](docs/pptx/PREPARATION_ADMISSION.md).

임시 검증 버퍼를 사용 후 소비하고, 프로세스별 비용과 실제 웨일 회귀를 확인했습니다. **1,387테스트·빌드·52쪽 화면 회귀는 통과했지만, 전체 메모리 기준은 여전히 실패합니다.** 원본·재생 품질은 유지하며 여러 자료 준비의 자원 입장 제어를 계속 개발합니다. [증거와 남은 인수](docs/pptx/PRIVATE_BUFFERS.md).

검증된 이미지·작은 미디어의 중복 메모리 참조를 해제하고 실제 웨일 기능 회귀를 확인했습니다. **대용량 자료의 전체 메모리 사용량은 실험 기준을 넘어 성능 인수가 미완료입니다.** 원본 품질을 바꾸지 않았으며 자료 등록 한도를 원활한 전환 보장으로 해석하지 않습니다. [결과와 제한](docs/pptx/DUPLICATE_PARTS.md).

개발 진행(2026-10-14): 같은PPTX File을동시에준비할때작업을공유하고취소를소비자별로분리했습니다. **1,367테스트·빌드와실제웨일Worker/기능회귀통과**. 대용량최신메모리표본은기존기준을넘어성능인수는계속진행중입니다. [증거와범위](docs/pptx/INFLIGHT_SOURCE.md).

개발 진행(2026-10-14): PPTX 페이지 탐색과 미디어 연결의 반복 파싱·읽기를 줄였습니다. 실제 자료에서 모델 파싱4→1회, 음원 전체읽기3→1회를 확인했고 두 메모리 표본이 기존 실험 기준을 통과했습니다. **1,362테스트·빌드와 실제 웨일 기능 회귀 통과**. 다중 자료·장시간·전체 충실도/최종 인수는 이어갑니다. [근거와 한계](docs/pptx/SOURCE_REUSE_MEMORY.md).

개발 진행(2026-10-14): 준비 확인을 우회하는 PPTX 직접 전환·자동 넘김을 차단했습니다. **1,356테스트·빌드와 실제 웨일 기능 회귀 통과**. 실제 대용량 자료의 전환·음원 재생은 작동하지만 메모리 표본이 기존 기준을 넘어 성능 검증은 실패했습니다. 자원 사용 개선과 최종 인수를 이어갑니다. [근거](docs/pptx/TRANSITION_ADMISSION.md).

개발 진행(2026-10-14): Player가 현재 학생 화면과 재생을 유지하며 PPTX 목표를 준비하고, 성공하면 준비한 화면·미디어 요소를 그대로 발표에 사용하도록 연결했습니다. 취소·미지원·원본 누락/재연결·닫힌 자료 특정 쪽 재개·응답 유실을 실제 웨일에서 확인했습니다. **1,351테스트·빌드 및 회귀 통과**. 직접 전환 명령 차단·대용량/전체 충실도/최종 인수는 남습니다. [근거](docs/pptx/PREPARED_SCENE.md).

개발 진행(2026-10-14): Player 준비 후 전환을 위한 요청·취소·확정의 저장/소유권 계약과 교사 노트를 제외한 목표 조회를 추가했습니다. **1,344테스트·빌드와 실제 웨일 계약 검증 통과**. 현재 Remote UI는 기존 선행검사를 사용하며, 새 계약을 실제 Player 준비 화면과 연결하는 작업은 남아 있습니다. [단계별 근거](docs/plans/2026-10-14-player-transition-commit.md).

최신 추가(2026-10-14): 리모컨에서 PPTX 전환을 먼저 검사하고, 준비할 수 없거나 취소하면 현재 학생 화면을 유지합니다. 첫 쪽이 미지원인 자료도 정상 쪽을 선택해 직접 발표할 수 있습니다. **1,324테스트·빌드와 실제 웨일 검증 통과**. Player 준비 실패 전체를 보호하는 전환 절차와 대안 PDF 연결은 남아 있습니다. [범위와 검증](docs/plans/2026-10-14-pptx-transition-safety.md).

최신 수정(2026-10-14): PPTX의 배경 스타일 번호를 잘못 해석해 단색 배경이 그라데이션으로 표시되던 문제를 수정했습니다. 실제52쪽 비교에서1쪽의픽셀차이가줄었고원본·학생화면독립을확인했습니다. **1,304테스트·빌드와실제웨일회귀통과**, 전체충실도인수는계속진행중입니다. [근거와제한](docs/plans/2026-10-14-pptx-background-reference.md).

최신 추가(2026-10-14): PPTX 등록과 원본 점검에서 명시된 글꼴의 로컬 참조를 확인하고, 실패하면 대체·줄바꿈 위험과 기준 PDF 확인 방법을 안내합니다. 검사 중 취소와 시간초과에도 학생 화면을 유지하는 것을 실제 웨일에서 검증했습니다. **원본 글꼴의 실제 적용과 전체 충실도 인수는 남아 있습니다.** [검증과 제한](docs/plans/2026-10-14-pptx-local-font-preflight.md).

최신 추가(2026-10-14): PPTX 등록·사전 검사에 글꼴 이름과 참조 개수, 내장 글꼴 파트 안내를 추가했습니다. 제공된52쪽 자료와 기준PDF를 실제웨일에서전체비교해텍스트hash51쪽일치·1쪽불일치와시각차이를기록했습니다. **글꼴 실제 적용과 원본 시각 충실도 인수는 미완료**입니다. [비교 근거와 제한](docs/pptx/TEACHER_02.md).

최신 추가(2026-10-14): 외부 호환 참조와 함께 들어 있는 로컬 내장 음원을 안전하게 연결했습니다. 제공된52쪽 자료의57MB MP3 등록·실제 무음 재생/리모컨 정지/PDF복귀를 Whale에서 검증했습니다. 중복파싱·입력복사·큰미디어중복버퍼도 줄였습니다. **1,272테스트·빌드·기존회귀 통과**. 실제 스피커·원본 자동 타이밍·전체 충실도/최종인수는 남습니다. [근거·제한](docs/pptx/TEACHER_02.md).

최신 추가(2026-10-13): 실험적 PPTX의 내장 MP3/WAV/MP4/WebM 항목을64MiB까지 읽도록 확대했습니다. 일반 항목/XML/전체 압축 해제 한도는 유지합니다. 실제98MB·52쪽 자료의 등록/모델 준비와 내장57MB MP3 metadata를 Whale에서 확인했고1,239테스트·빌드/기존회귀가 통과했습니다. **이 자료의 제품 음원 연결은 모델 주소 누락으로 미완료**입니다. [근거·메모리·제한](docs/pptx/TEACHER_02.md).

최신 추가(2026-10-13 18:53): 발표 창을 먼저 열고 내장 미디어를 나중에 연결하거나 설정을 바꿔도 같은 runtime에서 원본 클릭 그룹을 다시 준비합니다. 과거 요청은 자동 실행하지 않으며 재생 요소·완료 위치를 유지합니다. 준비할 수 없는 구간으로 새 창을 열어도 완료 위치를 복원하고, 구간을 고치면 회복합니다. **1,201테스트·빌드와 실제 웨일 검증 통과**. 혼합/복합 타이밍·충실도·최종 인수는 미완료입니다. [근거/제한](docs/pptx/MEDIA_TIMELINE_REFRESH.md).

최신 추가(2026-10-13 18:26): 검사한 **순차 미디어-only 클릭 그룹**을 원본 XML에서 Remote→Player 재생에 연결했습니다. 실제 웨일 합성 PPTX에서750ms지연·취소/저장실패재시도·play/pause/playFrom/stop/toggle 5그룹과 새Player 과거재생0을 확인했습니다. **1,189테스트·빌드 통과**. 혼합 도형 타이밍·고급 조건·발표 중 등록 후 재준비·원본 충실도·전체 인수는 남습니다. 아래는 이전 시점의 진행 기록입니다. [구현/제한/근거](docs/pptx/SOURCE_TIMELINE_EXECUTION.md).

최신 추가(2026-10-13): PPTX 원본 점검과 모델 사전 점검에 원본 음원·영상·명령 및 조건/설정 개수를 표시합니다. 모델에서 누락된 원본 명령도 별도로 안내합니다. 937테스트·빌드와 실제 웨일 검증을 통과했으며, 원본 미디어 트리거 실행은 아직 미완료입니다. [범위와 근거](docs/pptx/MEDIA_TIMING.md).

최신 검증(2026-10-13): 내장 영상의 양의 잘라내기·타원 마스크, 워커 재시작 및 SVG 대상 누락 오류 중 재생 연속성을 실제 웨일에서 확인했습니다. 자료 파일 검사 중 재생 위치·노트 revision이 증가해도 최신 상태로 등록하도록 보완했습니다. 909개 테스트·빌드 통과. 원본 트리거·고급 조합·원본 충실도와 최종 인수는 계속 미완료입니다. [근거](docs/pptx/PLAYER_MEDIA.md).

최신 추가(2026-10-13 03:20): 실험적 PPTX에서 명시적으로 연결한 내장 WAV·MP4를 Player 원본 영역에서 수동 재생하고 Remote로 제어할 수 있습니다. 자료 교차·새 Player·백업 복구 시 같은 PPTX를 다시 연결하면 내장 자산을 재추출해 보존 위치에서 대기합니다. 890개 테스트·빌드와 실제 웨일 합성 시험 통과. **원본 미디어 트리거·고급 변형·전체 충실도는 미완료**입니다. [검증 범위](docs/pptx/PLAYER_MEDIA.md).

최신 추가(2026-10-13 02:44): 실험적 PPTX에서도 글상자·판서·가리개를 비공개로 편집하고 확정하면 Player에 표시합니다. 최소 글씨 크기로도 맞지 않는 내용은 확정을 막고, 원본 효과·완료 화면과 레이어를 분리해 보존합니다.823tests·빌드/실제웨일 UI·백업복구 후 레이어 픽셀 일치 PASS. **원본색 추출은 미완료로 수동색 선택을 사용하며, 내장 미디어·원본 충실도·전체 인수도 미완료**입니다. [근거](docs/pptx/OVERLAYS.md).

최신 추가(2026-10-13): Editor에서 **PPTX 실험 사용**을 선택하면 일반 자료 추가와 원본 재연결을 사용할 수 있습니다. 등록한 PPTX의 비공개 페이지 탐색·노트, Remote 효과 제어, 편집정보 저장·복구까지 실제 웨일에서 연결을 확인했습니다.814tests·빌드와 기존PDF/미디어회귀 PASS. **PPTX 오버레이 편집·내장 미디어·원본 충실도·전체 인수는 미완료**이며 지원등급은 unverified입니다. [사용 범위와 근거](docs/pptx/PRODUCT_IMPORT.md).

최신 추가(2026-10-12 23:45): 등록된PPTX의제품Player 재생경로를연결했습니다. 실제웨일에서첨부자료12클릭효과·PDF교차/새Player복원을확인했습니다.754tests·빌드 PASS. 이번등록은시험helper경로이며 **일반PPTX추가UI·Remote효과·미디어/편집/백업·충실도인수는아직미완료**입니다. [범위](docs/pptx/PRODUCT_PLAYER_RUNTIME.md).

최신 추가(2026-10-12 23:29): Editor에서 **PPTX 비공개 미리보기**를 열고 쪽을 이동할 수 있습니다. 첨부23쪽/117이미지decode·PDF발표유지·닫기/취소·5화면을 실제웨일에서검증했습니다.747tests·빌드 PASS. 원본폰트/충실도와일반PPTX발표·효과/미디어재생은아직미확인입니다. [기록](docs/pptx/PRIVATE_PREVIEW.md).

최신 추가(2026-10-12 23:16): Editor에서 **후보 모델 검사**를 선택해 로컬 PPTX 모델의 손실·효과·미디어 개수를 확인할 수 있습니다. 실제 웨일에서 첨부 자료23쪽/174요소/효과12개·PDF발표불변·취소/5화면 검증,729tests·빌드 PASS. 모델검사는 원본충실도나 PPTX발표지원 완료가 아닙니다. [근거](docs/pptx/PRODUCT_MODEL_WORKER.md).

최신 추가(2026-10-12 22:58): 비공개 Editor에 **PPTX 원본 점검**을 연결했습니다. 로컬 원본의 구조·슬라이드 순서·타이밍/외부 참조를 검사하고, 화면 충실도·미디어·실제 효과 재생은 미확인으로 구분합니다. 자동709tests/빌드 및 실제웨일 제품dist에서teacher-01 23쪽/타이밍4쪽·PDF발표Canvas불변·취소/오류·5개화면 PASS. PPTX 발표/일반등록·원본PowerPoint충실도/물리교실인수는아직미완료입니다. [근거](docs/pptx/EDITOR_INSPECTION.md).

최신 검증(2026-10-12 05:26): PDF 사전 점검에서 실제 Canvas 렌더 완료도 구분합니다.278tests·빌드와 실제Whale headless 전체회귀 PASS. PPTX 두 후보의 격리 비교를 시작했으며 하나는 합성2쪽 표시 성공, 다른 하나는 렌더 실패와 라이선스 표기 충돌을 확인했습니다. PPTX 제품지원/원본충실도 인수는 아직 미완료입니다([비교](docs/pptx/INITIAL_COMPARISON.md)).

최신 추가(2026-10-12 05:15): 사전 점검의 PDF 읽기 결과를 같은 원본·범위·실행 환경에서만 메모리 재사용하고 강제검사도 제공합니다. 원본/hash·연결 미디어 상태는 매번 다시 확인합니다.276tests/check·actualWhale headless hit/force·범위구분/cold원본오류·상태보존 PASS. 시각충실도/실물·물리 환경 검증은 남았습니다(TEST_RESULTS05:15).

최신 추가(2026-10-12 05:11): 일부/전체 PDF 페이지 읽기 범위·진행·취소를 구분합니다.271tests/check와 실제Whale headless 합성8쪽 전체읽기/중간링크발견·세션보존/380px PASS. 전체읽기는 원본화면/폰트·효과 충실도나 완전오프라인 보증이 아니며 환경cache·실물검증은 남았습니다(TEST_RESULTS05:11).

최신 검증(2026-10-12 05:07):269tests·빌드 PASS. 실제Whale headless에서 합성PDF 외부링크/문서스크립트 경고, WAV·MP4 원본/metadata 점검, 재시작 후 원본없음/error·세션보존을 확인했고 스크립트 목록 Map 처리 누락을 수정했습니다. 전체충실도·실물코덱/소리·정밀/캐시/완전오프라인은 남았습니다(TEST_RESULTS05:07).

최신 추가(2026-10-12 05:02): PDF 등록 직후 가벼운 점검 결과를 표시합니다. 신규 파서 페이지수 확인과 동일원본 재연결의 해시 확인을 구분하고 나머지 항목은 미확인으로 둡니다.268tests/check·actualWhale headless 등록/재연결·실패결과없음/세션보호·380px PASS. 정밀·캐시·최종오프라인 검증은 후속(TEST_RESULTS05:02).

최신 추가(2026-10-12 04:59): Editor 발표 전 점검/취소·Visual/Media/Behavior/Offline 결과를 연결했다. PDF 일부 페이지 읽기·원본과 미디어 metadata를 확인하며 전체 충실도/완전 오프라인은 미확인으로 표시한다.265tests/check·actualWhale headless PDF 결과/노트초안·발표보존/취소·380px PASS. 정밀검사·캐시·등록연계/실물 인수는 후속(TEST_RESULTS04:59).

최신 추가(2026-10-12 04:53): 타이머 완료 소리 선택·Player 로컬 두음/차단 수동재시도·회차별 중복 자동시도 방지 연결.259tests/check·actualWhale headless 첫재생거부대역→실제native재생/재시작 PASS. 물리스피커·절전·5분focus는 별도이며 제품전체 미완료(TEST_RESULTS04:53).

최신 추가(2026-10-12 04:47): Remote 타이머 위치 조절·실행시간 보존·백업/재시작 위치 복원 구현.255tests/check, actualWhale headless1366/380 각네모서리 확인 PASS. 소리·직접드래그·물리교실 검증은 남았다(TEST_RESULTS04:47).

교사 대상 네이버 웨일 공모전 참가를 위해 만드는 로컬 우선 수업 발표 확장 프로그램이다. 최상위 제품 기준은 [PRD v5](naver-ppt_PRD_v5.md)이며, [v4 지시서](docs/source/spec-v4.md)는 상세 요구와 기존 테스트 ID의 참고 자료다.

GitHub 저장소: [LUCKYBRIDGE/naver-ppt](https://github.com/LUCKYBRIDGE/naver-ppt).

최신 검증(2026-10-12 04:43):252개 테스트·TypeScript/MV3 빌드 PASS. 수업·자료별 카운트다운/초시계, 공개 표시·시작/정지/초기화, 단일 Player 완료와 백업 경과 복원을 추가했다. 실제 Whale headless Remote닫힘 진행·자료 시간 보존·완료·중복 거부·정상재시작/380px 및 기존전체회귀 PASS. 타이머 소리·위치 조절/물리 교실 시험은 남았다. 아래 테스트 수와 미연결 상태는 당시 기록이며 최신 근거는 TEST_RESULTS04:43을 따른다.

**현재 상태: Stage B PDF·편집·로컬 저장과 재생 개발 중. Windows 네이버 웨일 전용 제품이다.** 독립 발표/편집, 글상자·판서·가리개, .wcp.json 저장·복구·저널·worker 파일 재검증, 현재·전체 비삭제형 종료, PDF 수정본 저장, Player 빠른 편집 진입·시간/미디어 자동 넘김·로컬 미디어 재생 경로를 연결했다. 226개 자동 테스트와 빌드가 통과했고 실제 Whale5.39.412.57 headless에서 기존 흐름, Remote 닫힘 후 자동 넘김·WAV·합성 H.264 MP4 재생, 교차 자료 위치·정지 복귀/정상 재시작을 검증했다. 실물 영상·다른 코덱·스피커 출력, 보이는 창·듀얼 모니터·5분 focus·OS 파일 선택/다운로드, PPTX 등은 남아 전체 제품 완성은 아니다. Edge는 지원 브라우저가 아닌 보조 검증 환경이다.

## 실행

2026-10-12 단일 발표 창: 같은 수업의 중복 Player는 검정 대기로 남고 재생·자동 넘김을 실행하지 않는다. 원래 창을 닫으면 대기창이 실행 권한을 이어받는다. 실제 Whale headless에서 중복 명령거부·서비스워커 재시작 중 WAV계속/소유유지·승계를 확인했다. 최신242tests·빌드 PASS. 브라우저 crash·물리5분focus·편집pause·타이머는 후속이며 [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 미디어 조작: Remote에서 시작·끝 구간/음량/음소거·재생 위치를 조절할 수 있다. 구간 변경은 정지하며 음량만 바꾸면 재생을 유지한다. 실제 Whale headless WAV 구간끝 자동넘김/정지seek·MP4 재생중 음량·380px 확인, 최신236tests·빌드 PASS. 영상 구간/실물·실제 소리·장시간 검증은 별도다. [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 영상 검증: 합성 H.264 MP4를 Editor에 연결하고 Remote 재생·정지, Player의 실제 움직이는 프레임·자료 전환 후 위치 복원·Remote 닫힘 뒤 자연 종료를 실제 Whale headless에서 확인했다.1366/380px 화면도 확인했다. 다른 코덱/실물·실제 소리·장시간focus는 별도이며, 초기 준비 대기 timeout의 원인은 아직 미확정이다. [검증 기록](docs/TEST_RESULTS.md)과 [재현 명령](docs/DEVELOPMENT.md)을 따른다. 아래 날짜별 기록은 이전 단계의 증거다.

2026-10-12 미디어 종료 자동 넘김: 현재 페이지의 미디어 종료 후, 또는 시간과 미디어 종료가 모두 충족된 뒤 이동하도록 설정할 수 있다. 실제 Whale headless WAV의 native ended와5초 결합 조건을 검증했다. 최신226tests·빌드 PASS. 미디어 없는 다음 페이지는 정지하며 영상/다른 코덱·실제소리·장시간focus는 아직 별도 인수다. [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 로컬 미디어: Editor에서 로컬 파일을 연결하고 Remote에서 재생·정지할 수 있다. 실제 Whale headless 합성WAV(native muted 재생)·Remote 닫힘/자료 교차 위치·정지 복귀/종료 이벤트를 확인했다. 최신218tests·빌드 PASS. 영상/다른 코덱·실제 스피커·5분focus·미디어 종료 기반 자동 넘김은 별도 미완료다. 원본 미디어 bytes는 백업에 포함하지 않는다. [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 시간 자동 넘김: Remote에서 적용 범위·간격·반복을 설정하고 재개/정지할 수 있다. 실제 Whale headless에서1초 범위 반복과 Remote 닫힘 이후 Player 진행·재접속정지를 검증했다. 최신207tests·빌드 PASS. 영상/음원·미디어 종료 기반·편집pause·5분 다른 앱 focus는 아직 미검증/미지원이며 [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 빠른 편집: Player에서 우클릭, 편집 아이콘 또는 길게 누르기로 현재 페이지의 Editor를 열 수 있다. 발표 선택과 확정 델타는 바뀌지 않고 기존 Editor 초안은 유지한다. 실제 Whale headless에서 우클릭·합성 longpress·창 재사용을 검증했다. 최신 자동 테스트는182개다. 물리 터치와 듀얼 모니터 창 배치는 별도 인수다. [검증 기록](docs/TEST_RESULTS.md)을 따른다.

2026-10-12 추가: Editor의 **PDF 수정본 저장**을 연결했다. 확정 오버레이만 원본 vector PDF에 합치고 새empty 파일의 write/close/readback 후 성공을 표시한다. 실제 Whale extension+CSP/nativeOPFS 출력/취소·기존파일거부와 별도Node PDF.js reader 검증, dev-origin4회전/crop/한글·가리개·판서/검색text 보존을 통과했다. 최신 자동 테스트는177개다. 가리개는 원본삭제가 아니며 오버레이글씨는 이미지다. OS chooser/downloads/native외부뷰어/실물자료 인수는 남아 experimental이다. [계획](docs/plans/2026-10-12-pdf-copy.md), [검증 기록](docs/TEST_RESULTS.md)을 따른다.

Node.js 22.12 이상의 22.x, 24.x 또는 26 이상, npm 10 이상. 이 PC의 PATH는 Node 20이므로 아래 스크립트가 Codex의 Node 24 런타임을 선택한다. 시스템 PATH/기본 Node는 바꾸지 않는다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 install
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check
```

빌드 산출물은 `dist/`. 웨일 확장 관리 화면에서 개발자 모드를 켜고 압축해제된 확장앱으로 **dist 폴더**를 로드한다. 수업 선택 후 편집창에서 PDF를 추가하고 Remote에서 자료/페이지를 발표한다. 새 자료 추가는 Player를 자동 전환하지 않는다. 같은 수업/역할 창은 재사용한다. Whale의 runtime.getContexts/파일 권한은 실제 확인이 필요하다. 일반 파일 입력 fallback은 모든 창을 닫은 뒤 원본 재선택이 필요하다.

Editor에서 확정된 편집정보를 .wcp.json 새 파일로 저장한다. native chooser는 nonempty 기존 파일 덮어쓰기를 거부하며, 대안은 downloads/saveAs/uniquify다. 저장 완료와 취소/실패를 구분한다. Launcher의 ‘편집정보 불러오기’는 기존 수업을 덮어쓰지 않는 새 복구 수업을 만든다. 편집창에서 동일 원본을 다시 연결한 뒤 명시적으로 발표를 시작한다. JSON 백업은 PDF 복사본이나 안전한 종료를 대신하지 않는다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 dev
# UI 미리보기: http://127.0.0.1:5173/launcher/
# 아래 직접 npm 명령은 호환 Node가 PATH에 있을 때 사용한다.
npm run typecheck
npm test
npm run build
npm run check:skills
npm run licenses
```

개발 서버는 개발 편의용 로컬 서버이며 제품 런타임 의존성이 아니다. 일반 웹 페이지 미리보기에서는 chrome API 창 생성이 실행되지 않는다. 확장 검증은 빌드한 dist에서 수행한다. 현재 manifest에는 host 권한과 추가 API 권한이 없다.

Windows의 신뢰된 시스템 인증서를 Node가 사용하지 못해 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`가 발생할 때는 해당 터미널 세션에서 `$env:NODE_OPTIONS = '--use-system-ca'`를 설정해 다시 설치한다. TLS 검증을 끄거나 npm 전역 설정을 바꾸지 않는다.

## 개발 자료

| 목적 | 파일 |
|---|---|
| AI/개발자의 기본 지침 | [AGENTS.md](AGENTS.md) |
| 개발 순서·작업 규칙 | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| 요구사항·구현 추적 | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| 아키텍처·모듈 책임 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 타입·명령·좌표 계약 | [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md) |
| 저장·종료·복구 정책 | [docs/STORAGE_POLICY.md](docs/STORAGE_POLICY.md) |
| 결정과 문서 충돌 해석 | [docs/DECISIONS.md](docs/DECISIONS.md) |
| 기술 실험 | [docs/TECH_SPIKES.md](docs/TECH_SPIKES.md) |
| 지원 상태 | [docs/COMPATIBILITY_MATRIX.md](docs/COMPATIBILITY_MATRIX.md) |
| 검증 계획과 실행 결과 | [docs/TEST_PLAN.md](docs/TEST_PLAN.md), [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) |
| 라이선스와 보안 | [docs/LICENSES.md](docs/LICENSES.md), [docs/SECURITY.md](docs/SECURITY.md) |
| 프로젝트 스킬 5개 | [.agents/skills](.agents/skills) |

## 폴더 구조

```text
.agents/skills/           프로젝트 전용 스킬 5개
docs/source/             원문과 출처·해시
docs/                    요구사항·설계·저장·실험·테스트·라이선스
docs/generated/          lockfile에서 생성한 의존성 라이선스 목록
src/background/          서비스 워커·창 관리
src/launcher/            툴바 메뉴
src/player/              청중 화면
src/remote/              교사용 독립 리모컨
src/editor/              발표와 독립된 비공개 편집
src/core/                UI와 독립된 상태·명령·이벤트·역량 계약
src/adapters/            파일·웹 어댑터 계약 및 향후 구현
src/overlays/            레이어 검증·실제 글꼴 맞춤·Canvas 렌더
src/media/               미디어·자동 넘김·타이머 계약
src/storage/             수정 델타·복구·세션 파일 계약
src/export/              로컬 내보내기 결과 계약
src/shared/, styles/     공통 코드와 스타일
public/icons/, fonts/    검토 후 배포할 정적 자산
scripts/                 빌드·스킬·라이선스 검증 도구
tests/unit/              순수 함수·정책 테스트
tests/integration/       브라우저 API mock 테스트
tests/e2e/, manual/      추후 브라우저 자동화·웨일 실기기 절차
tests/fixtures/          합성 예제와 private 샘플 정책
dist/                    확장 배포 산출물(Git 제외)
```

다음은 Stage B의 빠른 편집 진입 보완·로컬 저장·저장 확인 후 종료·자동 넘김과 실제 Whale 검증이다. [제품 전체 완성 추적](docs/plans/2026-10-11-product-completion.md)에 Stage A~G와 최종 인수 조건을 유지한다. [현재 인수인계](docs/tasks/current.md), [구현 순서](docs/IMPLEMENTATION_PLAN.md), [공모전 시연 기준](docs/CONTEST.md)을 확인한다.

## 다른 PC나 새 대화에서 개발 이어가기

```powershell
git clone https://github.com/LUCKYBRIDGE/naver-ppt.git
cd naver-ppt
npm ci
npm run check
```

이 폴더를 Codex 프로젝트로 열고 `AGENTS.md`, `naver-ppt_PRD_v5.md`, `docs/tasks/current.md`부터 확인한다. 프로젝트 스킬은 `.agents/skills`에 함께 저장되어 있다. 실제 웨일 headless 기반은 통과했지만 보이는 창/OS chooser/downloads 등 인수는 남아 있으므로 자동 테스트를 전체 브라우저 검증 완료로 해석하지 않는다.

개발을 다시 맡길 때 사용할 수 있는 문구:

> AGENTS.md, naver-ppt_PRD_v5.md, docs/tasks/current.md와 제품 완성 계획을 읽고 Stage B의 오버레이·로컬 저장·종료와 실제 Whale 검증을 이어줘. 제품 전체 완성 목표를 줄이지 말고 공모전 목적과 학생 화면 보호, 원본 보존을 유지해줘.
