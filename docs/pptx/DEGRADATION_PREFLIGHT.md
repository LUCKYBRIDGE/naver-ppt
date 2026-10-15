# 미지원 회전·확대 효과의 등록 사전 점검

## 2026-10-14 최신 리모컨 전환 보호

- 정상RemoteUI의PPTX발표/선택쪽/이전·다음은기존runtime를분리DOM에서검사한후현재발표/목표/지문/checkpoint를재확인해전환한다. 검사중기존학생화면과재생을건드리지않고취소/실패시명령없음. 원본재연결/PDF·원본앱을안내하고다시누르면재검사한다.
- ACTIVATE_DOCUMENT는등록된명시slideId를지원하므로첫쪽이미지원이어도정상다른쪽을1회commit으로직접발표할수있다. 현재자료의미지원이전쪽도전환없이현재쪽을유지한다. 자동정적완성화면/숨김정답노출없음.
- 실제Whale1791933132393 합성미지원20.001초회전·준비취소/늦은결과·PDF픽셀/세션보존·정상2쪽직접전환/5화면PASS,1,324tests/빌드PASS. [계획/한계](../plans/2026-10-14-pptx-transition-safety.md).
- 이보호는정상RemoteUI에한정된다. 직접runtime명령/Player실제준비실패/재시작복구까지보호하는입장receipt·표면staging과대안PDF연결/영속preflight는미완료다. 아래빈표면기록은이전직접명령경로의재현근거이며이경로를해결완료로세지않는다.

- PRD v5 P-03/P-08, §8/24 Stage C/D/F, FR-003/008/013, IMPL-T-28.
- 합성 2쪽 PPTX의 정상 200ms 회전을 20001ms로 바꾼다. OOXML의 양의 밀리초 duration이며 현재 제품의 검증 범위(60~10000ms)를 벗어난다. PowerPoint 기준 앱의 재생/스키마 인증은 이번 시험에서 하지 않았다.
- 실제 Whale에서 패키지/모델 로드는 성공하고 `createPptxEngineDriver`는 `PPTX_ROTATION_UNVERIFIED`로 실패했다. 정상 variant는 같은 API에서 실패하지 않았다. 제품 Player에서도 해당 쪽의 SVG가 0개가 되는 경로를 재현했다. 실행 guard와 Player catch는 완화하지 않았다.
- `behaviorPreflight.ts`가 guarded 패키지의 원본 순서에서 회전/확대 존재를 확인하고 해당 파일에만 공식 Worker 모델을 읽어 기존 두 binding 검사를 재사용한다. 쪽별 실패를 경고하고 원본 앱 또는 PDF 별도 자료 준비를 안내한다. 성공도 실제 재생/원본 충실도 pass로 표시하지 않는다.
- 신규 등록에서 실행하며 동일 hash 재사용/원본 재연결의 빠른 경로는 재검사하지 않는다. 보고서는 Editor 메모리이므로 창을 닫으면 사라진다. Remote 전환 차단·대안 PDF 페이지 연결·영속 Preflight/재검사 UI는 후속이다.
- 숨김 정답/클릭 순서 보호를 위해 정적 완성 화면으로 자동 전환하지 않는다. 준비 불가 쪽을 실제 선택하면 여전히 검정/빈 표면이며 다음 쪽 또는 기존 PDF로 명시 이동할 수 있다. 사전 경고를 전체 graceful degradation 완료로 부르지 않는다.
- 새 라이브러리/권한/저장 schema/원본 자동 복사 없음. 검사 자산은 finally 해제하고 취소/모델 오류는 source 보관·등록 성공 전에 전파한다.

## 재현

먼저 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 check`로 제품을 빌드한다. 프로젝트 루트에서:

```powershell
& "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe" scripts/verify-whale-pptx-degradation.mjs "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe' "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs"
```

원본 교사 자료는 사용하지 않는다. 합성 파일/전용 프로필/검사 probe/스크린샷/result는 ignored `node_modules/.cache/whale-pptx-degradation/<timestamp>`에 생성한다. probe는 진단 API만 추가하며 실제 Editor/Remote/Player 렌더러를 대체하지 않는다. OS chooser는 file input으로 대체하고 물리 교실 인수와 구분한다.

## 판단과 후속

현재 실험 엔진의 유효하지만 미지원인 효과가 초기화 전체에 전파되는 위험을 확인했다. 지원 범위 확대보다 사전 고지와 실제 자료·기준 화면 비교를 우선한다. 렌더러 교체는 [충실도 계획](../plans/2026-10-13-pptx-fidelity-continuity.md)의 실제10종·3축·오프라인/성능·라이선스 비교 결과로 판단한다.
