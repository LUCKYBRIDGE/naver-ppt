# PPTX 글상자·판서·가리개 연결

2026-10-13 02:44. PRD v5 §6/13/14, FR-008/009/010/013/016.

## 구현과 경계
- 기존 OverlayEditor의 draft/정규화좌표/undo·redo/고정상자/실제font측정·overflow/strict확정을 재사용한다. sourceView로 PDF/PPTX 원본뷰를 분리한다.
- PPTX 비공개 원본SVG와 별도 overlay portal을 같은 원본 비율 표면에 겹친다. Player도 runtime의원본효과루트와 별도 sibling overlay portal을 사용한다. 원본효과·완료pose 복원으로 레이어가 지워지거나 레이어가 애니메이션target으로 취급되지 않는다.
- 좌표/폰트 측정용 canvas는1280 기준/원본aspect,높이1..8192로상한을검사한뒤생성한다. 실제원본픽셀이아니므로pixelSampling=unavailable이며 colorCandidates는픽셀API를호출하지않고후보없음을반환한다. 원본색으로가짜검정/주변색을표시하지않는다. 기본글상자는흰색이며수동색선택을제공한다.
- PPTX HTML SVG의foreignObject와원본Blob이미지를충실하게유지하면서읽을수있는원본픽셀을얻는경로는미확정이다. SVG text모드로바꿔다른픽셀을원본색으로샘플링하지않는다. **원본색추출·전체충실도는미완료**로명시한다.
- 초안은Editor에만유지한다. 다른쪽확정은현재Player불변,현재쪽확정은strictACK후Player레이어에반영한다. 원본/노트/원본bytes를추가저장하지않고기존델타와백업을사용한다.

## 검증
- check2026-10-13 02:40:57:63파일823tests·TypeScript/Vite/MV3/5스킬 PASS. 신규9개:16:9/4:3/세로좌표표면,원본색가짜샘플링차단/픽셀API미호출,과대/잘못된aspect를canvas할당전에거부.
- 실제Windows Whale5.39.412.57 headless profile1791826916205/result.json·exit0 PASS. 제품UI만사용. private6쪽글상자draft/확정→발표3쪽overlayCanvas불변,현재3쪽draft불변→긴한글최소font overflow확정불가→짧은한글/가리개/판서확정→Player레이어변경/원본효과완료visibility불변.
- 같은실행의취소/worker재시작·완료pose보존,자료교차/새Player의overlayPNG동일,백업파일재검증/Launcher복구·같은원본UI재연결→3쪽overlayPNG동일 PASS. 12클릭효과/3창5viewport/원본SHA256불변/pageerror0 유지.
- `pptx-overlays-player.png` 직접확인:한글글상자/검정가리개/판서가원본위에표시됨. Editor380캡처도생성. 다른원본PowerPoint기준충실도비교가아니다.
- foundation1791826934209/verification-result.json·exit0:기존PDF overlay/글꼴측정·비공개편집/노트/저장·복원/종료/PDF복사본/native muted WAV·합성H.264/자동넘김/소유권/정상재시작 회귀PASS.

## 남은 작업
- 실제원본픽셀색샘플링/폰트·PowerPoint기준충실도,더많은원본/모든비율·물리IME/touch/모니터,내장미디어/정밀Preflight·고급효과/전환/원본10종/최종인수.
- OSchooser/downloads/스피커/비정상crash/장시간focus는별도인수다. 저장picker는OPFS새출력대체. **PPTX unverified/전체목표active** 유지.
