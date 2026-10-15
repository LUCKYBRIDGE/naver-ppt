# 제품 PPTX 비공개 미리보기

2026-10-12 23:29 · Stage C/D/F 준비 · FR-004/006/007, X-04.

## 구현
- 제품 Editor의 별도 로컬 파일 입력으로 `loadPptxPrivatePreview`를 지연 로딩한다. 원본 header/SHA256→ZIP Worker→전체 XML/원본 순서→공식0.4.5 파서 Worker→주 화면의 안전 SVG 순서다.
- 기존 숫자 검사 응답과 명시적 `presentation` 응답을 분리했다. 양쪽 모두 ready/사본 transfer/15초/취소/오류/terminate 계약을 공유한다. 미리보기에서만 모델/자산을 해당 Editor 메모리로 전달한다.
- `hydratePptxAssets`는 공식 파서의 asset:N 참조를 직접 소유한 Blob URL로 연결한다. 배경/이미지/도형fill/글머리표/그룹/표/폰트 참조를 처리하며 임의 URL·없는 인덱스·활성 SVG/HTML/스크립트 자산을 거부한다. 실패 시 부분 자원도 해제하고 dispose는 멱등이다. 글로벌 URL API를 제품에서 바꾸지 않는다.
- 외부 미디어는 모델에 남지만 `media:'badge'`로 재생하지 않으며, SVG의 외부 참조는 기존 `parseDisplaySvg` 경계가 거부한다. notes 제외. embeddedFonts를 자동 설치/로드하지 않는다.
- 원본 순서와 임시 UUID·지문/개수로 모델을 대응한다. 이 ID는 세션 등록/명령/DB/SourceVault에 쓰지 않는다. 탐색은 미리보기 내부 선택만 바꾸며 학생 발표/Editor의 등록 자료 선택에 영향이 없다.
- 안전 DOM을 ShadowRoot에 넣고 원본 페이지 비율을 유지해 ResizeObserver로 화면 크기에 맞춘다. 이전/다음 아이콘·쪽 선택·닫기·준비 취소 제공. 기본 효과의 모든 내용은 정적으로 표시하며 원본 행동을 그대로 재생한다고 주장하지 않는다.
- 새 파일/수업 변경/취소/닫기/실패에서 이전 작업을 무효화하고 원본/자산 URL을 해제한다. 늦은 완료 결과도 dispose한다. File bytes를 저장하거나 사용자 원본을 수정/업로드하지 않는다.
- 기존 @web-ppt/core0.4.5 MIT/fflate0.8.3 동봉 재사용, 추가 의존성/권한 없음. render entry는 선택 후만 로딩되며 privatePreview 번들48883bytes(소스맵 제외). 전체 문서/자산은 미리보기 생존 중 메모리에 있다.

## 근거
- check23:26:23: **57파일747tests·TypeScript/Vite/MV3/5스킬 PASS**. 새18개: asset 소유/임의참조/활성 MIME/부분실패/멱등해제/중첩참조와 preview guard/UUID/notes·badge/모델 불일치·취소/해제 후 렌더 금지. 첫 fixture의 PPTX_MAX_SLIDES mock 누락 수정.
- 실제 Windows Whale5.39.412.57 headless, 제품dist 그대로 profile `node_modules/.cache/whale-pptx-inspection/1791815304372/profile`.
- teacher-01 원본23쪽 모두 탐색·각 SVG의 실제 이미지 디코딩117회 PASS(중복 이미지 사용 포함, 고유자산 수가 아님). 이전/다음·쪽 선택 PASS.
- 미리보기 전후 전체 수업·공개 Player snapshot·PDF Canvas 전체 SHA256 동일. 닫기 및 열린 파일을 잘못된 새 파일로 교체할 때 소유 URL 수가 초기값으로 복원되고 SVG 비워짐.
- 별도 Editor에서 실제 모델 Worker send를 지연한 뒤 준비 취소·native terminate·늦은 send 이후 미리보기/쪽 선택 없음·PDF 화면 불변 PASS. CPU 파싱 중 물리 취소는 아니다.
- 기존 구조/모델 검사23/174/12, ZIP·모델 취소, 5viewport 가로 넘침 없음, 외부 HTTP0/pageerror0/원본hash불변 유지. 1366px·380px 3쪽 미리보기 캡처 직접 확인: 텍스트/이미지 표시, UI 겹침 없음.
- 변경 후 foundation 전체회귀도 profile1791815323335에서 PASS: PDF/비공개 편집·저장/복구·WAV/합성H.264·자동넘김·Player 소유권/서비스 워커 재시작. headless/합성/OPFS picker 대체이며 물리 교실 인수는 아니다.

## 제한 / 다음
- 원본 PowerPoint 기준 화면·원래 글꼴·추가 실제9종 이상, 실물 OSchooser/모니터/IME/스피커·대용량 성능/메모리 인수는 미확인이다. 정적 내용 표시를 고급효과/미디어 재생으로 대체한 것이 아니라 비공개 확인 경로다.
- source/model 전체 schema 완전성·모든 파서/렌더 CPU 시간 한도를 증명하지 않는다. SVG 결과 크기/노드·패키지/model 한도가 있지만 SVG 생성 자체는 현재 메인 화면 동기 코드다.
- 실패 페이지는 빈 미리보기와 오류로 고지하며 발표는 유지한다. 지원 여부는 **PPTX unverified** 유지.
- 다음은 일반 PPTX import/Player 타입 dispatch와 실제 effects/media·로컬 백업, 정밀 원본 비교를 연결하는 단계다. 전체 목표/Stage A~G 인수는 미완료.
- 재현: `verify-whale-pptx-inspection.mjs`에 bundled Playwright/설치Whale/teacher-01 절대경로를 전달한다. DEVELOPMENT.md 경로 참조.
