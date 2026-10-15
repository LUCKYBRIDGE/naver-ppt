# PPTX Player 내장 미디어 수동 재생·복구

2026-10-13 09:12 원본 설정 연결: 새 등록은 strict 원본명시vol/mute/p14trim을 기존 MediaPlayback으로 가져오고 재연결은 사용자값을 보존한다. 실제Whale1791850286198 Editor→Player .10025..1.934267초/.25/muted·구간끝정지·재연결/백업 PASS. 1,131tests/빌드·교사제품1791850170029 회귀 PASS. 원본 trigger 자동재생은 미완료. [상세](SOURCE_MEDIA_SETTINGS.md).

## 2026-10-13 03:45 영상·원본 shape 효과 동시 실행
- 생성 합성 OOXML의 영상 target에 클릭 회전90도/200ms를 추가했다. 사용자 원본과 제품 실행 코드는 변경하지 않았다. `1791830666738/result.json` exit0: 실제 제품 Remote 다음효과 클릭→완료checkpoint 1그룹, 같은 연결 native영상 .1→1.414803초/paused=false·원본타원clip 유지·SVG screen matrix90도 PASS.
- Remote API로 정지/보존checkpoint 확인 뒤 새Player 생성: 원본 재추출/회전90도·clip 유지·1.434132초/paused=true 복원 PASS. 복구가 과거 미디어를 자동재생하지 않았다. `restored-rotated-cropped-video-1366.png` 직접 확인. 기존 연결/취소/실패·교차·백업/종료·worker/실패repaint·revision등록·5viewport·원본불변/외부0/pageerror0 회귀 포함.
- check03:41:22:69파일909tests·TypeScript/Vite/MV3/5스킬 PASS. 최신 제품PPTX1791830114796/foundation1791830114955 회귀는 같은 제품 코드의 이전 결과이며 이번 변경은 fixture/verifier뿐이다.
- 초기 시험은 종료된2초영상을 기준으로 replay시간을 비교해 실패했다. 이후 volatile슬라이더조건 timeout과 잘못된checkpoint 단수필드 접근을 바로잡았다. 명시적 Remote API PAUSE/SEEK로 독립 시작조건을 설정하고 실제 다음효과 버튼·strict DB 결과로 검증했다. 실패관측파일을 남겼고 제품 되감기 회귀로 판정하지 않는다.
- 이 근거는 crop+ellipse+회전 한 그룹과 수동 미디어 동시 실행이다. 원본media timing/trigger·다른그룹/flip/쌓임·반복/취소복합·실제교사충실도 전체를 증명하지 않는다. [다음 원본타이밍 계획](../plans/2026-10-13-pptx-media-timing.md).

## 2026-10-13 crop·shape clip 후속
- 최신 코드 교사PPTX1791830114796/result.json·foundation profile-1791830114955/verification-result.json exit0 PASS. 내장1791830114932와함께 모든최종회귀종료. 909tests/빌드/git diff --check PASS.
- 최신 check03:34:59: **69파일909tests**·빌드 PASS. `1791830114932/result.json` exit0에서 아래 crop/clip 및 전체 내장 UI 회귀를 재검증했다. SVG 다음 대상 누락 오류에도 이전 SVG/native 동일 연결노드가 .36494→.546019초 재생을 유지했다. repaint는 모든 대상을 이동 전에 검사한다.
- 같은 시험에서 실제 워커 stopped→running 중 내장 영상 동일노드/소유권·재생 .107817→.273686초/paused=false 유지, 이후 Remote 정지 PASS. 자료 파일 읽기 보류 중 노트 revision 증가 뒤에도 새 PDF 등록·발표선택/노트 보존 PASS. 등록은 최신 teacher revision을 읽고 명시적 STALE_REVISION만 최대3회 재시도한다. 원본trigger·효과동시·진행중 미디어 추가는 아직 별도 검증이다.
- 양의 srcRect crop은 원본 viewport 내부 영상 확대·이동으로 적용한다. 안전한 shape clipPath는 foreignObject의 userSpaceOnUse clip으로 적용하고 outline은 영상 위에 보존한다. 아래 과거 crop/clip 미지원 기록은 이 변경 전이다. 음수 crop·남는 영역 1% 미만·reflection은 오류를 유지한다.
- check03:24:35: 68파일 **901 tests**·TypeScript/Vite/MV3/스킬5개 PASS. crop 비율/path 한도·거부 신규11개.
- `1791829563020/result.json` exit0: 기존 전체 내장 미디어 시험과 합성 OOXML srcRect 좌우25%+ellipse 제품 UI 등록/연결→Player 검증 PASS. native 너비는 원본 영역의 2배, 타원 밖 모서리와 확대된 중심 띠는 흰색, 타원 안 위쪽은 [32,179,89,255]. `cropped-ellipse-player-1366.png` 직접 확인. 교사 원본 불변/외부0/pageerror0.
- 변경 후 제품 PPTX `1791829591948/result.json` 및 foundation `profile-1791829592085/verification-result.json` exit0 회귀 PASS. 교사23쪽/12클릭·요청취소/복구·PDF/저장/소유권 포함, 모든 시험 종료.
- 원본trigger·그룹/회전/flip/효과동시·음수/과도crop/reflection·실물/실제파일 충실도는 계속 미완료다. 합성 ellipse 근거를 다른 도형·교사 파일에 확대하지 않는다.

## 이전 수동 재생 경로
- 2026-10-13 03:20, Windows Whale 5.39.412.57 headless 전용 profile.
- PRD v5 §6/11/14/24/25, FR-005/008/013/014. 전체 PPTX 지원·충실도 인수는 미완료다.

## 연결한 경로
- Editor가 명시적으로 등록한 `embeddedSource`를 Player의 `openPptxRuntime.resolveMedia`가 재검증한다. runtime이 이미 보유한 guarded 원본 모델/Blob을 재사용하고 현재쪽의 원본 지문·part·요소 경로·slideId·미디어 SHA-256/kind/MIME을 정확히 맞춘다. 별도 미디어 원본 재선택이나 media vault 요청 없이 로컬 File을 복원한다.
- 공개 snapshot에는 원본 파일명/size/lastModified가 없다. Player는 원본 지문·요소 경로·자산 해시로 대응하며 private metadata의 size 비교를 공개 정보로 오인하지 않는다. 바이너리는 서비스 워커/DB/백업으로 보내지 않는다.
- `PptxMediaSlots`는 원본 SVG의 단 하나인 `data-el` 아래 요소 변형 그룹 안에 foreignObject를 만든다. 기존 LocalMediaPlayer를 그 안에 portal로 배치한다. 영상은 원본 영역을 채우며 별도 global 영상으로 대체하지 않는다. poster/badge는 live video 아래에 중복 노출하지 않고 원본 outline은 보존한다. 음원은 원본 배지를 유지하고 native audio만 숨겨 재생한다.
- SVG의 원본 계층에서 그룹 변형·회전·쌓임·효과 target을 상속한다. 단순 사각형 위치는 실제 검증했으나 회전/flip/그룹/겹침/효과 합성은 추가 합성·실제 파일 검증이 필요하다. crop/clipPath/reflection·잘못된 좌표/target은 검증 오류로 남기며 원본 영역을 임의로 대체하지 않는다.
- repaint 때 연결된 새 SVG로 `moveBefore`하여 같은 native media 노드를 보존한다. 이를 지원하지 않는 환경은 명시적 오류다. 실제 웨일에서 노드 동일성·연결·재생 시간 증가를 확인했다. 동일 checkpoint의 노트/미디어 등 unrelated revision마다 원본 SVG를 다시 만들지 않는다. 새 미디어 slot을 준비할 때 기존 slot을 먼저 비우지 않으며 수업/자료/쪽/runtime 범위가 다른 slot은 렌더하지 않는다.
- Player 소유권, 기존 LocalMediaPlayer의 구간·음량·음소거·epoch/seek/checkpoint, Remote 제어를 재사용한다. 이 경로는 수동 재생이며 PPTX 원본 트리거를 자동으로 실행하지 않는다. 복귀/새 Player/정상 백업 복구는 보존 위치에서 정지 상태다.

## 검증 근거
- `scripts/dev.ps1 check` 03:19:38: 68파일 **890 tests**, TypeScript/Vite/MV3/스킬5개 PASS. 신규21개(원본 위치 경계19/runtime 원본 대응2).
- `verify-whale-pptx-embedded-media.mjs`, `1791829184123/result.json`, exit0:
  - 합성 WAV/MP4 원래 bytes/hash/duration 일치, 교사23쪽·내장0/원본 SHA-256 불변, 외부0/pageerror0.
  - 제품 Editor 등록/내장 연결 → 실제 Player audio/video metadata·Remote 음소거/영상 재생·정지 → decoded 320×180 픽셀 확인.
  - 원본 video 영역의 정규화 x=.3/y=2÷7.5/w=.3/h=.3 일치, global native 영상0. 1366px 캡처 직접 확인.
  - unrelated 노트 저장 뒤 같은 native video가 계속 재생. 별도 Slot repaint 경계 시험에서도 같은 연결 노드가 .181289→.362237초/paused=false를 유지했다. 이 경계 시험은 PPTX 효과와 영상의 전체 동시 실행 인수는 아니다.
  - PDF 자료 교차→이전 영상 위치1.033327초/정지→PPTX 복귀 같은 위치 정지. 새 Player가 원본 재추출/별도 미디어 channel 요청0으로 복원.
  - 음원 재생 중 Remote 닫기·Editor 다른쪽 탐색 후 시간 증가. 음소거된 native 재생이며 물리 스피커 검증은 아니다.
  - Editor OPFS 새 파일 저장/readback→저장파일 재검증→Launcher 실제 file import→새 수업 발표대기→Editor 같은 PPTX 원본만 재연결→명시 발표→내장 연결 버튼 없이 영상 보존 위치 정지. 기존 수업 불변. Remote 현재 종료 UI→native media 제거·검정 대기·다른 자료 자동 노출 없음.
  - Editor의 취소/실패/중복 재연결/5viewport·키보드 회귀도 포함.
- 제품 PPTX `1791828963478/result.json` exit0: 교사23쪽/12클릭·Remote 취소/재시도·overlay·새Player/백업·3창5viewport/원본불변 회귀 PASS. foundation `profile-1791828963625/verification-result.json` exit0: 기존 PDF·로컬미디어·저장/종료/복구·자동넘김·소유권 회귀 PASS. 마지막 보완은 media slot poster와 scope 보존이며 최종 내장미디어 시험에 포함했다.
- 종료 시험의 첫 직접 CLOSE_DOCUMENT 전송은 역할 경계에서 거부됐다. 제품 Remote 종료 UI의 저장 선택·확정 경로로 수정해 검증했다. OS chooser/downloads는 OPFS 시험으로 대체하지 않는다.

## 다음 필수 검증
1. 원본 media timing/trigger·구간·음량/자동 재생 의미와 원본 효과 동시 실행. 진행 중 media 추가·worker 재시작에서도 native 연속성을 직접 확인한다.
2. 실제 그룹/회전/flip/앞뒤 겹침·overlay 가리개·crop/clip/reflection과 여러 codec. 지원되지 않는 변형을 구현·검증하고 역량/실패 대안을 고지한다.
3. 새 원본 연결 실패·물리 스피커/5분 focus·절전/crash/재연결/교사10종·PowerPoint 비교·원본색 픽셀 추출. 전체 PRD 목표와 PPTX unverified 유지.
