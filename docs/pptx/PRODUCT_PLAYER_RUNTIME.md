# 제품 Player의 PPTX 재생 경로

2026-10-12 23:45 · Stage D/F 준비, FR-003/004/005/006/013.

## 변경
- `loadPptxSourceModel`을 비공개 미리보기와 실제 runtime에서 공유한다. bounded File/hash→ZIP/XML/순서→공식 Worker→소유 자산·개수/취소 경계. 실패/늦은 완료는 자산을 해제한다.
- `openPptxRuntime`는 등록 문서 지문/슬라이드 UUID/원본 part를 검증한 뒤 기존 engineDriver와 PptxDurablePlayback을 연결한다. 공식 state/playGroup과 원본 transform 보정, 완료pose/strict ACK 계약을 재사용한다.
- `PptxView`는 실제 Player에서 전용 PPTX source vault를 읽고 ShadowRoot 안전 SVG·원본 비율 화면을 표시한다. source metadata/델타/filename은 공개 snapshot으로 보내지 않고, 현재 PPTX의 slideIds만 복사한다. 실제 파일 크기/mtime은 Player 로컬 File에서 얻는다.
- snapshot과 transport ACK의 순서가 바뀌어도 높은 revision을 유지한다. 선택/원본 변경·unmount는 Worker/engine/재생/Observer/Blob을 정리한다. duplicate Player는 기존 소유 gate 때문에 renderer를 만들지 않는다.
- Player의 우클릭 도구 안에 다음 PPTX 효과 버튼을 연결했다. 이 단계의 제어는 Player 버튼이며 Remote의 효과 명령은 아직 없다. 그룹 완료를 확정한 뒤 pose를 복원한다.
- 현재 내장미디어는 badge, 원본 notes는 SVG에 포함하지 않는다. PPTX의 자동 넘김은 검증 전 Player에서 구동하지 않는다. PPTX overlay 합성은 아직 미연결이다.
- `@web-ppt/viewer-core@0.4.5` MIT Copyright2026 unStone을 고정 설치하고 원문을 `licenses/web-ppt-viewer-core-LICENSE`에 동봉했다. runtime은 지연 chunk이다. 새로운 권한·서버·폰트·사용자 원본 저장/수정/전송 없음.
- SourceVault의 원본 없음 안내는 PDF 고정 문구 대신 동일 원본 파일 재선택으로 바꿨다.

## 검증
- check23:42:55: **59파일754tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규7개: runtime 구성/복원·dispose·원본지문/ID/closed 거부·복원실패cleanup, 현재 PPTX ID만 복사/비공개 filename·노트·로그/다른자료 비노출.
- 실제 Windows Whale5.39.412.57 headless profile `node_modules/.cache/whale-pptx-player/1791816181361/profile`.
- 제품 dist를 격리 복제하고 **파일 등록 준비 helper만** 시험 bundle로 추가했다. 렌더러/엔진/Player UI/모델 Worker는 제품 경로 그대로다. 원본 File은 자동 input으로 선택하고 제품 REGISTER_DOCUMENT strict ACK로 등록한다. 일반 등록 UI 완료 증거는 아니다.
- teacher-01 23쪽, Player 버튼→원본3쪽 첫 그룹→공개 checkpoint1/run null 확인. PPTX→PDF→PPTX의 동일 쪽/전체 data-el visibility 일치, 기존 Editor 선택 유지. Player 닫고 새 소유 Player/새 Worker 재파싱 후 같은 visibility 복원.
- 원본3/9/12/19쪽 **12클릭 그룹 전부** 실행하고 각 완료를 실제 GET_SESSION에서 checkpoint/run null로 확인했다. 원본 효과 값·duration의 PowerPoint 일치까지 증명하는 시험은 아니다.
- 1920/1366/1280/768/380px에서 페이지 영역이 실제 viewport 안에 있으며 비율 유지·가로 넘침 없음. 첫 그룹 복원1366px 캡처 직접 확인: 첫 항목만 표시/나머지 숨김. pageerror0/원본hash불변.
- 최초 두 복귀 assertion은 저장 완료 전 상태를 읽었다. async waitForFunction 대신 Node 쪽 실제 GET_SESSION 응답의 완료checkpoint/run null을 반복 확인하고 최종 assert해 PASS. 모델 의미 손실/제품 복원 버그로 단정하지 않는다.
- 원본점검/모델/비공개미리보기 회귀도 profile1791816233332 PASS: 23쪽/174요소/12효과,117이미지decode·발표Canvas불변·URL해제·취소·5viewport/외부0/pageerror0/원본불변.

## 제한과 다음
- **일반 PPTX 파일 등록은 아직 비활성**이다. 이번 verifier의 실제 등록 helper를 일반 UI 전체 완료로 간주하지 않는다.
- Remote 효과 제어/고급 트리거·내장 미디어·자동넘김·PPTX overlay/비공개 편집·PPTX 백업 및 정밀 preflight gate는 남는다. 원본 10종+/PowerPoint 기준/폰트·실물 모니터/소리/OSchooser·오프라인/대용량 인수도 미완료다.
- 일부 효과가 재생되었다는 근거로 전체 PPTX 지원을 선언하지 않는다. **PPTX unverified** 및 전체 제품 goal active 유지.
- 다음은 일반 import/Remote→Player 효과 요청과 저장/편집 경계를 함께 연결하는 것이다. UI 활성화 전 실패·제한을 고지해야 한다.

## 재현
check 후 DEVELOPMENT.md의 bundled Node/Playwright/설치Whale 경로를 이용해:

```powershell
node scripts/verify-whale-pptx-player.mjs <Playwright-index.mjs> <Whale.exe> <teacher-01.pptx>
```
