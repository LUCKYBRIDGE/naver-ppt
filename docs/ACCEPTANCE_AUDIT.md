# PRD v5 최종 인수 감사

2026-10-15 기준 감사표다. `완료`는 PRD §25의 범위를 실제로 증명한 경우에만 사용하며, 계약·합성 fixture·headless 보조 검사는 전체 인수를 대신하지 않는다.

| PRD §25 기준 | 현재 상태 | 근거와 남은 일 |
|---|---|---|
| 실제 샘플 fixture | 완료(자료 조건) | 실제 교사 자료 10종과 동일 stem 기준 PDF 10종을 `docs/pptx/TEACHER_CORPUS_10.md`에 고정했다. 페이지 수가 다른 3종은 충실도 통과로 세지 않는다. |
| 정의된 인수 기준 | 완료 | PRD §25, `docs/plans/2026-10-11-product-completion.md`, 기능별 계획과 이 감사표. |
| Windows 실제 Whale 검증 | 부분 | 5.39.412.57 headless 실제 회귀가 있다. 물리 창·DPI·듀얼 모니터·IME·터치·실제 스피커는 미검증이다. |
| Visual / Media / Behavior | 부분 | 10종 source-sharing 등록·취소·해제·원본 hash 보존, teacher-02 52쪽 및 여러 실제 자료 대표 쪽의 실제 Whale 비교, native WAV/MP4 근거가 있다. `1792022723220`에서 사회 자료 preview `unavailable` 상태도 확인했다. 10종의 PowerPoint 기준 3축 전체 비교와 복합 조건은 부족하다. |
| 오프라인 여부 | 부분 | 외부 요청 차단과 일부 cold 재시작 근거가 있다. 완전 cold-offline 수업 인수는 미완료다. |
| 성능·메모리 | 미완료 | resource inventory는 논리 수치만 제공한다. 최신 실제 `--media64` WorkingSet `1,734,987,776bytes`(`1792024769250`)가 1.5GiB 기준 FAIL이며 전체 origin 예산은 미확정이다. |
| 라이선스 검토 | 부분 | 패키지 라이선스와 web-ppt 변경 고지가 있다. 전체 제출 패키지 감사가 남았다. |
| 알려진 제한 사항 | 완료 | `COMPATIBILITY_MATRIX.md`, `TECH_SPIKES.md`, `PERFORMANCE_BUDGET.md`에 기록했다. |
| 테스트 결과 문서 | 부분 | 자동·headless 결과, 실제 자료 10종 source-sharing, 자료별 동적 inspection 결과(`1792022427288`, `1792022609951`)가 기록되어 있다. 물리 환경·10종 기준 3축 결과가 부족하다. |
| Compatibility Matrix 업데이트 | 완료 | PPTX를 `unverified`로 유지하고 근거·제한을 갱신했다. |

현재 판정은 전체 제품 `미완료`, PPTX `unverified`다. 실제 자료·기준 PDF 수 조건은 채웠지만, 다음 우선순위는 10종 PowerPoint 기준 3축 비교, 물리/cold-offline/장시간 검증과 그 결과를 이용한 성능 예산 확정이다. 현재 발표 자료를 자동 삭제하거나 품질을 낮추는 방식으로 기준을 통과시키지 않는다.

## 2026-10-16 추가: 새 실제 자료와 verifier 보정

- 새 Downloads PPTX는 기준 PDF 부재로 fidelity 통과 자료에 세지 않고, 등록·모델·preview·원본 보존만 PASS로 기록했다. 검증기 navigation bug 수정 후 실제 3쪽 inspection이 PASS했다.

2026-10-15 09:25 추가: 실제 10종 1쪽 순회 결과는 verifier 실행 근거로 기록했다(`1792023574416`, `1792023582383`, `1792023592274`, `1792023600811`, `1792023637192`, `1792023641662`, `1792023649681`, `1792023657722`, `1792023694066`; `1792023723700`은 페이지 수 불일치 자료 재검증). 실행 성공은 preview/기준 비교 완료와 다르며, 10종 PowerPoint 기준 3축 전체 인수는 여전히 부족하다.

2026-10-15 09:40 추가: 실제 Player `whale-pptx-player/1792024181632`에서 52쪽·15효과 그룹 자료의 직접 전환 차단, 준비/취소·Worker 재시작·편집 독립·오버레이·백업·원본 불변을 확인했다. 이는 한 자료의 Player/학생 화면 보호 근거이며 10종 전체 3축·물리/cold-offline/성능 최종 인수는 남는다.

## 2026-10-15 09:45 — 효과 checkpoint와 DOM 진단 분리

- 실제 Player 결과 `1792024181632`에서 `allOriginalClickGroups=15`, 각 요청의 checkpoint 완료·취소·복원이 통과했다. `effectVisibilityChanged=false`는 검증기에서 수집한 DOM visibility 배열이 달라지지 않았다는 진단값이며 효과 실행·원본 충실도 pass가 아니다.
- 이 값은 학생 화면의 효과 시각 충실도를 미확인으로 남기는 근거로 기록한다. PPTX 지원 등급과 전체 Visual/Behavior 인수는 승격하지 않는다.

## 2026-10-15 09:55 — 최신 번들 실제 Whale foundation 회귀

- `vverify-whale-foundation.mjs` 실제 네이버 웨일 5.39.412.57 결과 `PASS`, profile `1792024405807`. 학생 화면 연속성, Player owner/중복 창 차단·Worker 재시작, PDF 저장·복구·종료, WAV/합성 H.264 MP4 재생·전환·checkpoint, autoplay·Remote 닫힘·380px 경계를 확인했다.
- 외부 요청 0 및 원본/편집정보 보존 경계를 포함한다. 제한은 headless 격리 프로필·합성 입력·OPFS picker stand-in이며, 물리 모니터·실제 오디오·다른 코덱·IME/터치·장시간 focus·PPTX 전체 충실도는 별도 미완료다.

## 2026-10-15 09:58 — 비공개 PPTX 미리보기 timeout 경계 추가

- `PptxPrivatePreviewControls`에도 30초 bounded preparation을 추가했다. timeout 시 controller를 중단하고 `PPTX 미리보기를 준비하지 못했습니다... 발표 화면은 유지했습니다.` 상태로 전환하며, 일반 컴포넌트 취소는 조용히 처리한다. 등록 문서의 `RegisteredPptxPreview` timeout과 별도 파일 미리보기 경계를 맞췄다.
- 전체 `scripts/dev.ps1 check` 09:35:01 exit 0: 103 test files / 1,424 tests, TypeScript/Vite/MV3 build, materials 10/10.
- 실제 네이버 웨일 `whale-pptx-visual/1792024510039`에서 사회 자료 1쪽 실행 `executionPassed=true`.
- 실제 30초 timeout 대기는 이번 회귀에서 의도적으로 발생시키지 않았다. PPTX 충실도·WorkingSet·지원 등급은 승격하지 않는다.

## 2026-10-15 10:05 — 사회 자료 private preview 최종 실패 상태 재검증

- 보정한 inspection verifier로 사회 8쪽 자료를 실제 웨일에서 재실행했다. `whale-pptx-inspection/1792024566003`, 등록 11항목·모델 8쪽/225요소, 원본 hash·현재 세션·학생 canvas 보존, 글꼴 취소/시간초과 보존을 확인했다.
- private preview는 최종 `unavailable=true`, status `이 쪽을 표시하지 못했습니다. 원본 충실도를 확인할 수 없습니다. 발표 화면은 유지했습니다.`로 기록됐다. 이는 30초 timeout 자체의 단정이 아니라 최종 preview 실패 상태의 실제 증거이며, 자동 전환·정적 정답 노출은 없었다.
- PPTX 충실도 pass나 지원 승격으로 해석하지 않는다.


## 2026-10-15 09:37 추가: 자동 검증 재실행

- 전체 check가 PASS했지만, 자동 회귀는 실제 PowerPoint 기준 3축 전체 비교나 물리 메모리·cold-offline 인수를 대신하지 않는다. 최종 판정은 미완료/unverified를 유지한다.


## 2026-10-15 09:39 추가: 실제 웨일 foundation 회귀

- verify-whale-foundation.mjs 결과 PASS (1792024622331). 학생 화면·Player 권한·미디어·자료 전환·원본/편집정보 보존을 재확인했다.
- headless/합성·PPTX fidelity·물리/cold-offline 제한으로 전체 인수는 미완료다.

## 2026-10-15 09:42 추가: 2쪽 자료 전체 시각 비교

- 실제 웨일 비교 결과 `1792024668754`는 두 쪽 모두 비교 가능했지만 PDF 374×540 대 PPTX 720×540, MAE 117~119로 차이가 컸다. 이 결과는 충실도 미검증/인간 검토 필요를 강화하며 통과 근거가 아니다.

## 2026-10-15 09:44 추가: 소형 자료 inspection 성공

- 실제 웨일 `1792024717980`에서 2쪽 자료 private preview가 2쪽 모두 decoded되고 `unavailableSlides=0`이었다. 모델/취소/학생 canvas·세션·원본 보존도 통과했다.
- 사회 자료의 preview 실패와 분리해 자료별 결과로 남긴다. 이는 10종 전체 Visual/Media/Behavior 또는 PowerPoint 충실도 인수 근거가 아니다.

## 2026-10-15 09:47 추가: 98MB·52쪽 inspection

- 실제 웨일 `1792024738254`에서 98MB 자료의 52쪽 private preview가 모두 디코드되고 233개 효과·240개 요소 모델을 만들었다. 취소/Worker 늦은 결과·학생 화면·세션·원본 보존도 통과했다.
- 글꼴 4종 미해결과 headless/기준 출력 부재는 남아 있다. 따라서 PPTX 전체 충실도와 성능 인수는 미완료다.

## 2026-10-15 09:50 추가: 최신 성능 예산 재측정

- 실제 웨일 대용량 시험 `1792024769250`에서 sampled Working Set `1,734,987,776 bytes`, 실험 예산 1.5GiB 초과로 `pass=false`였다. PPTX 성능·전체 origin 예산은 미완료 상태를 유지한다.

## 2026-10-15 09:41 추가: 원본 미디어 연결 회귀

- 자동 check PASS와 기존 실제 Player 근거를 코드 경계와 대조했다. 검증된 순차 source timeline만 실행하며 불확실한 조건은 보류한다.
- 복합 미디어 조건·PowerPoint 원본 기준 비교·물리 성능은 미완료이므로 전체 제품 및 PPTX 지원 등급을 유지한다.

## 2026-10-15 09:46 추가: 최신 번들 실제 웨일 회귀

- foundation 실제 웨일 결과 `PASS` (`1792024862134`)를 최신 근거로 추가했다. 학생 화면·원본/편집정보 보존 회귀는 유지됐다.
- headless/합성·물리/PPTX 전체 충실도 제한으로 최종 제품 완료 판정은 유지하지 않는다.

## 2026-10-15 09:53 추가: 원본 한도 단위 표기

- SourceVault 오류 메시지의 단위를 `MiB`로 명확히 했다. 64MiB 개별 미디어와 512MiB 창별 원본 참조 합계를 구분하는 사용자 안내를 강화했다.
- 자동 check와 실제 웨일 foundation 회귀가 PASS했으며, 전체 메모리·PPTX fidelity 판정은 그대로 유지한다.

## 2026-10-15 09:57 추가: MiB 안내 회귀 테스트

- SourceVault 합계 초과 테스트가 `MiB` 단위를 직접 고정했다. 한도 변경이나 PPTX 지원 등급 변경은 없다.



## 2026-10-15 10:10 추가: 최신 번들 2쪽 시각 비교

- 1792025038257에서 2쪽 모두 비교 가능하고 원본 hash가 불변임을 재확인했다. 기준 출력 종횡비/픽셀 차이 때문에 전체 충실도 PASS로 해석하지 않는다.

## 2026-10-15 10:22 추가: 종횡비 진단 명시화

- 시각 검증기가 기준·제품 종횡비와 mismatch 여부를 결과 JSON에 기록하도록 보강됐다. 실제 2쪽 실행 `1792025133774`는 비교 실행은 통과했지만 충실도 최종 PASS로 승격하지 않았다.

## 2026-10-15 10:29 추가: 종횡비 불일치 집계

- 시각 결과가 불일치 페이지 목록을 직접 제공하도록 보강됐다. 실제 웨일 1792025180795는 비교 실행은 통과했지만 충실도 최종 PASS로 승격하지 않았다.


## 2026-10-16 01:55 추가: foundation 최신 재검증

- 최신 번들 실제 웨일 foundation PASS(profile 1792083025987)를 추가했다. PPTX fidelity·물리·cold-offline 판정은 변하지 않는다.
