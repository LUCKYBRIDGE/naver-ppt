# 실제 교사 자료 두 번째 사례: 대용량 내장 음원

## 2026-10-14 선택 자료·미디어 재사용

동일자료의비공개1/26/52/3쪽탐색에서Editor파싱4→1,같은MP3전체읽기3→1로줄였다. 수정후정상Remote/Player준비·음원재생/정지/PDF복귀의두WorkingSet표본은1,600,827,392/1,581,264,896bytes로기존1.5GiB실험기준PASS. 원본2개hash불변/학생화면보호/추적Editor자산0·외부0/pageerror0. 이전FAIL/중간lease만수정한FAIL도보존한다. 전역한도·저사양/장시간/최종Visual/Media/Behavior인수와지원승격은남는다. [상세](SOURCE_REUSE_MEMORY.md).

## 최신: 2026-10-14 배경 스타일 참조 수정

- 1쪽 원본 master의 bgRef1001/bg1은 theme의 첫 단색 배경이다. 고정core0.4.5 parser가1001을배경style배열길이로clamp해마지막그라데이션으로표시한것을확인하고빌드transform으로수정했다. 원본/설치된패키지파일은불변,정확한source hash/교체지점검증과MIT변경고지를추가했다. 범위밖참조는흰색unsupported대체없이모델실패로반환한다. [공식규칙/계획](../plans/2026-10-14-pptx-background-reference.md).
- 최종 actualWhale `whale-pptx-visual/1791912346260/result.json` 전체52쪽raw720×540/재표본화없음·독립선택/원본2개hash불변/외부0/pageerror0. 1쪽 배경5표본은PDF와같은흰색,MAE10.6178→2.1825/차24초과픽셀18.1296%→1.9542%. nearwhite분포58.47%(PDF58.59%). 전체평균MAE21.4190/차픽셀중앙13.3318%. 원본↔제품텍스트hash52쪽일치/PDF33쪽기호차이유지. 같은폴더에comparison.html/summary.json/source-diagnosis.json.
- 합성10종1791912319024/교사제품1791912319303/합성내장1791912319742/PDFfoundation profile-1791912346550 모두exit0,1,304tests·빌드PASS. 최종Visual인수/원본앱환경/글꼴·배치차이·실물10종/물리전체제품인수는미완료다. 배경수정을최종엔진선정/전체지원승격으로해석하지않는다.

## 최신: 2026-10-14 01:38 텍스트·글꼴 원인 분리

- 원본XML의정규화본문hash는제품렌더와52/52일치한다. PDF만33쪽의So기호1개가적으며기호제외시일치한다. 기존33쪽불일치를렌더러텍스트누락으로해석하지않는다. 로컬근거는전체비교폴더1791908785569의source-diagnosis.json이며본문을로그/외부로내보내지않았다.
- 실제Whale선택쪽1/17/30/33/41/43(1791909257887)의CDP platformFonts는MalgunGothic+Calibri를확인했다. 원본지정글꼴과다르다. 1791909344156의테스트DOM전용MalgunGothic대조군에서MAE17쪽34.95→16.22,30쪽35.74→19.67,33쪽21.08→13.83,41쪽34.93→22.64,43쪽35.32→18.81로감소했다. 폰트선택기여를확인했지만원본정확재현/제품fallback채택은아니다. DOM style은finally복원,제품설정/원본변경없음.
- 1쪽10.62→10.51로개선작고near-white분포PDF58.59%/PPTX35.43%여서색/도형/이미지차이를별도진단한다. 두실제Whale시험은6쪽한정·raw720×540/독립선택/원본hash불변/외부0/pageerror0/exit0. 전체52쪽/실물10종/물리·원본앱·Visual인수와구분한다. [실행기록/재현](../TEST_RESULTS.md).

## 최신: 2026-10-14 전체52쪽 기준 PDF 비교

- 실제제품PPTX비공개뷰와PDF Player를전체52쪽순회했다. `node_modules/.cache/whale-pptx-visual/1791908785569/result.json` executionPassed, 양쪽720×540 raw·재표본화없음/private선택독립/원본hash불변/외부0/pageerror0. `comparison.html`과쪽별PNG·diff·`summary.json`은같은로컬ignored폴더다. 이실행성공은Visual인수통과를뜻하지않는다.
- NFC/공백제거텍스트hash51쪽일치,33쪽107/106글자불일치. 평균MAE21.5813/채널차24초과픽셀비율중앙13.5974%,차이큰쪽30/43/41/17/1. 안티앨리어싱/폰트·배치·추출순서·동작상태를분리하지못했으므로원인/내용누락을단정하지않는다.
- 기준PDF Creator는PowerPoint표시,BaseFont MalgunGothic. 원본typeface고유41종·주요명칭정상,UTF8/ASCIIescape재확인시U+FFFD이름0. 앞선CP949 stdout깨짐을원본손상으로본진단은정정했다. Windows설치목록의정확명조회에서주요대상중Calibri/맑은고딕만확인했으나실제browser fallback확정은아니다. 원본앱/내보내기환경·인간시각검토·실제10종·효과/음질/물리전체인수는미완료다.
- 신규등록과원본/모델사전검사에bounded글꼴참조/이름/내장파트숫자안내를추가했다. 정상명은unknown이며깨진값/한도초과는warning,실제설치/적용/license/원본일치pass아님. 최신89파일/1,278tests,교사제품1791908815500/합성내장1791908835589/PDFfoundation profile-1791908835991 회귀통과. [상세실행기록](../TEST_RESULTS.md).

## 최신: 2026-10-14 내장 참조 연결과 실제 무음 재생

- `localMediaPart`가 External 호환 참조의 Target을 읽지 않고 같은 도형의 내부 p14 관계를 선택한다. 내부 primary와 p14가 모두 있으면 같은 part여야 한다. 모호한 관계·다른 kind·위험 경로는 거부한다.
- `recoverEmbeddedMedia`는 src가 없는 모델 미디어만 원본 순서/고유 shape ID·header·관계로 대응시켜 소유 Blob에 추가한다. 타이밍 binder도 같은 선택 규칙과 원본 바이트 hash 대조를 사용한다. 외부 접속이나 원본 수정 없음.
- 최종 `whale-pptx-entry-limit/1791906468561/result.json` PASS: 52쪽 등록/비공개1·26·52·3쪽/57MB MP3 제품 등록·Player native metadata3547.92초·무음 실제 재생0.215834초 진행/Remote 정지/PDF복귀/Editor추적BlobURL bytes0/기존PDF보호/원본hash불변/외부0/pageerror0. 아래 src=null 연결 실패는 이전 기록이다.
- 중복 비용을 줄이기 위해 같은 창의 동일 불변 File에 대해 준비 완료 모델 소유권을 공유하고 마지막 owner 해제 시 자산을 폐기한다. 원본 검사 후 private input buffer는 parser Worker로 transfer한다. 32MiB초과 media의 원본 size/hash를 source 메모리에 캡처한 뒤 중복 압축해제 buffer는 해제한다. 실제 내장 Blob/등록파일 hash를 이 근거와 계속 대조한다.
- 최종 전용browser WorkingSet합계 표본 최대1,568,329,728bytes(약1.46GiB). 최초 연결 후1,917,026,304bytes와 중간1,637,879,808/1,696,993,280/1,658,781,696bytes 기준 초과 실패를 보존했다. 단일 측정이므로 메모리 상한/장시간 누수/저사양 보증은 아니다. 최종은 불필요한 추가 진단 parse를 제외한 제품 경로이고 이전 진단 경로와 직접 benchmark 비교하지 않는다.
- 1,272tests/빌드 PASS. 실제 스피커/음질·전체 음원 재생·원본 자동 타이밍/슬라이드간음원·52쪽 시각충실도·물리/전체제품 인수는 계속 미완료다. [계획](../plans/2026-10-14-pptx-embedded-reference.md).

현재 재현 명령은 기존 명령에 `--media64`를 붙인다. 추가 모델 진단은 `--diagnostics`이며 별도 추가 파싱 비용을 측정에 포함한다. 기본 실제 제품 경로에서는 추가 진단을 수행하지 않는다.

## 최신: 64MiB 음원·영상 한도 확대

2026-10-13 사용자 제안에 따라 음원·영상 항목만 64MiB로 확대했다. 일반 항목32MiB/XML4MiB/총256MiB/입력128MiB/압축비율·경로·활성콘텐츠 검사는 유지한다. 아래 초기32MiB거부는 당시 결과이며 현재등록상태와구분한다.

- 최종실제Whale `whale-pptx-entry-limit/1791901996577/result.json`:원본52쪽등록/비공개1·26·52·3쪽준비/Player3쪽표시·PDF복귀·Editor자산URL해제0·기존PDF선택/픽셀보존·원본hash불변/외부0/pageerror0 PASS. 별도진단API는추가했으나제품renderer/Worker는대체하지않았다.
- guarded원본의57MB MP3를실제nativemetadata로읽어3547.92초 확인. 본문/소리·외부참조를실행하지않았으며재생지속·음질인수는아니다.
- 별도제품연결문제:선택쪽공식모델의shapeId3/audio/mpeg는src=null/ownedfalse여서내장미디어연결은PPTX_UNOWNED_MEDIA로거부. 원본a:audioFile은rId1/External, p14내장관계는rId2/내부media1.mp3이다. 외부주소는실행/로그하지않았다. 안전한내장관계복원이후음원재생을검증해야한다.
- 전용browserCDP의processID들WorkingSet합계표본최대1,552,617,472bytes(약1.45GiB). 초기2회는1,586,167,808/1,511,288,832bytes와수동연결실패를기록했다. 최종실험1.5GiB기준이내이나실제최대값/장시간누수/저사양보증은아니다.
- 64MiB경계/초과·일반항목/XML/ratio/Worker MIME·전체asset한도신규24개포함1,239tests/빌드PASS. 기존교사/합성media/PDF회귀도통과. [계획/범위](../plans/2026-10-13-pptx-large-media.md).

현재재현은아래명령끝에`--media64`를붙인다. 옵션없는거부시험과`--baseline`은과거32MiB버전용이므로현재teacher-02에그대로실행하지않는다.

- 확인: 2026-10-13 23:09 KST. 사용자 제공 `test-materials/originals/고요한 우연(1).pptx`와 `test-materials/powerpoint-reference/고요한 우연(1).pdf`. 폴더 전체 Git 제외 확인. 원본 읽기 전용, 외부 요청/업로드/텍스트·음원 본문 로그/원본 자동 복사 없음.
- PPTX 98,050,517bytes, SHA256 `967de5c0d83960835c93cf7f88a2336ad915df2b588ad5da5afe949581bff1ed`.
- PDF 1,714,027bytes, SHA256 `57764540ed45e7932df9f8047b07b780dc0e25ddcc75aa76a8d2749af4be46f8`,52쪽. 앞3쪽 MediaBox720×540pt. 사용자 제공 비교 기준이며 PowerPoint 버전/글꼴·내보내기 설정/생성 앱은 미확인.
- Python ZIP metadata:287항목/압축해제합102,104,579bytes/슬라이드52/미디어항목37. 슬라이드XML localName 집계: timing있는쪽50/transition있는쪽51/audio32/video0/animRot0/animScale0. audio32는 XML 노드 개수이며 독립음원파일32개나 실제재생지원32개를 뜻하지 않는다.
- `ppt/media/media1.mp3` 56,779,103bytes. 파일총128MiB/압축해제합256MiB 이내지만 개별항목32MiB한도 초과다. 한도 또는 원본을 변경하지 않았다.

## 실제 Whale 결과

Windows Whale5.39.412.57 headless/전용프로필/Node24.19.0, 제품dist의 실제 File→Worker→등록UI 경로. 별도 renderer나 원본bytes mock 없음. OS chooser만 파일input 사용.

- 수정전 `node_modules/.cache/whale-pptx-entry-limit/1791900425545/result.json` PASS: 원본PPTX 등록시 `PPTX_ENTRY_LIMIT`가 사용자화면에 그대로 나오는 문제 재현. 기존PDF 전체세션/선택/Canvas픽셀 불변 확인.
- 수정후 `node_modules/.cache/whale-pptx-entry-limit/1791900499495/result.json` PASS: 내장파일/문서구조의 크기·압축한도 실패와 PDF별도추가/원본앱 대안을 설명. PPTX등록0/기존세션deepEqual·선택·픽셀불변.
- 기준PDF는52쪽으로등록하고1/26/52쪽Canvas 렌더완료/쪽ID/픽셀hash 확인. 전체52쪽의시각적동등성/폰트일치는 미검증이다. 문서내용/스크린샷은 외부AI에 보내지 않았다.
- 외부요청0/pageerror0/두원본전후SHA256불변. 원본보존·실패격리 시험 PASS와 PPTX기능수용 FAIL을 구분한다.

## 판단

현재경로에서 이 PPTX의 Visual/Media/Behavior 비교는 **entry-limit으로 차단**됐다. PDF대안은 가능하지만 원본음원/타이밍/전환이PDF에서보존된다는뜻이아니다. 실제샘플은기존teacher-01과합쳐2종/기준PDF1종이며 실제10종인수는미완료다.

다음: 대용량미디어의 안전한지연읽기/Worker전체복사·자산메모리상한을 먼저실험한 뒤 제한조정여부를판단한다. 단일파일을통과시키려고32MiB검사만삭제하지않는다. 원본앱발표/명시적PDF대안안내·학생화면보호를유지한다.

## 재현

프로젝트루트에서제품을check로빌드한후:

```powershell
& "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" scripts/verify-whale-pptx-entry-limit.mjs "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe' 'C:/ai_dev/apps/naver-ppt/test-materials/originals/고요한 우연(1).pptx' 'C:/ai_dev/apps/naver-ppt/test-materials/powerpoint-reference/고요한 우연(1).pdf'
```

`--baseline`은수정전dist의rawcode재현전용이며수정후실행하면실패해야한다. 결과·전용프로필은ignoredcache에남긴다. PDF픽셀hash는브라우저에서계산하고화면본문을출력하지않는다.
