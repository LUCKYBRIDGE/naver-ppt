# Editor의 PPTX 원본 점검

2026-10-12 22:58, Stage C/D · FR-004. Windows 웨일 제품 Editor에 로컬 PPTX 구조 점검을 연결했다. PPTX 발표/일반 등록은 아직 활성화하지 않았다.

## 변경
- `PptxInspectionControls`: 파일 선택·진행·취소·결과/실패 상태. 새 파일과 수업 변경은 이전 작업을 abort하고 성공 결과를 지운다. 늦은 결과는 현재 controller와 일치할 때만 공개한다.
- `inspectPptxFile`: bounded File/header/SHA256 → 실제 로컬 ZIP Worker → 전체 XML/관계/콘텐츠타입 → 원본 슬라이드 순서. 23쪽 등의 구조 결과와 효과/전환/미디어/화면 충실도 미확인을 구분한다.
- SourceVault/등록명령/DB를 호출하지 않는다. 점검 File과 package bytes는 작업 메모리만 사용하며 원본 자동보관·복사·업로드·원본 덮어쓰기 없음. 파일명은 React text로만 표시한다.
- fflate0.8.3 MIT가 이제 실제 점검 bundle에 포함되므로 `licenses/fflate-LICENSE`를 산출물에 넣었다. 빌드 검증은 license와 로컬 packageWorker 자산을 확인한다. 새 dependency/권한·후보 renderer 채택은 없다.

## 검증
- check22:56:24: 54파일709tests·TypeScript/Vite/MV3/5스킬 PASS. 신규 file inspection 단위7개, ZIP/XML/순서 실패·취소·미발견unknown·원본문구 비노출.
- 실제 제품 dist 그대로, Whale5.39.412.57 headless profile `node_modules/.cache/whale-pptx-inspection/1791813389908/profile`. 후보/시험 renderer 주입 없는 제품 UI다.
- 실제 Editor PDF 등록·Remote 활성화·Player Canvas 렌더 후 teacher-01 File input 원본 점검. ZIP163/XML81/23쪽·타이밍4쪽, pass3/warning1/unknown5 표시 PASS.
- 점검 전후 전체 teacher session·공개 Player snapshot·실제 PDF Canvas 전체 픽셀 SHA256 일치. 잘못된 새 파일은 성공 결과를 지우고 오류 표시, 세션/Canvas 보존 PASS.
- 취소 시험은 실제 로컬 native Worker를 만들고 postMessage 전송만 시험 wrapper로 지연했다. 키보드 Enter 취소→native terminate1회→늦은 전송 시도 뒤에도 결과 없음/수업·Canvas 불변 PASS. 원본 파싱 CPU 실행 중 물리 취소/OSchooser는 이 시험 범위가 아니다.
- 1920×1080/1366×768/1280×800/768×1024/380×820 가로 넘침 없음. 데스크톱/작은 화면 스크린샷 직접 확인, pageerror0/원본hash불변.
- 처음 비활성 Editor의 element/page screenshot이 각각 시간초과했다. Editor.bringToFront 후 캡처 통과했다. 모듈 요청 지연은 취소 시점을 고정하지 못해 실제 Worker send 지연으로 시험 경계를 명확히 했다.

## 재현
먼저 check로 dist를 빌드한다. 다음 명령에 DEVELOPMENT.md의 bundled Node/Playwright와 설치된 Whale 경로를 사용한다.

```powershell
node scripts/verify-whale-pptx-inspection.mjs <Playwright-index.mjs> <Whale.exe> <teacher-01.pptx>
```

## 제한과 다음 단계
- OSchooser는 자동 파일입력으로 대체했다. 실제 스피커/듀얼모니터/DPI·물리교실/PowerPoint 기준/추가9종은 미검증이다.
- 이 UI는 구조 점검이며 현재 별도 모델검사 함수/후보 렌더러를 제품에 넣지 않았다. renderer 패키징·역량 gate·일반 PPTX import/Player UI 및 원본 충실도 검증은 남는다.
- 전체 목표와 PPTX unverified 유지. 웹 미리보기는 확장 API를 대신하지 않는다.
