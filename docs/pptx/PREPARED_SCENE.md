# Player 준비 표면과 발표 확정

- 기준: PRD v5 §6/8/11/14/24/28/30, FR-004/005/008, IMPL-T-28.
- 상태: 정상 Remote UI의 Player 준비 후 전환을 연결·검증했다. 후속으로 [직접 전환 입장 차단](TRANSITION_ADMISSION.md)도 연결했다. 대용량 성능 실패·장기 복구/대안PDF·물리/전체 인수는 남는다.
- 계획: [전환 요청과 확정](../plans/2026-10-14-player-transition-commit.md).

## 구현 경계

Remote는 같은 수업의 현재 Player 소유자를 조회하고 명시 목표의 REQUEST_PRESENTATION을 저장한다. 기존 Remote의 별도 runtime 파싱을 대체한다. Player는 CLAIM 응답의 자기 context ID와 pending이 일치할 때만 교사 노트가 없는 공개 목표 snapshot을 조회한다.

PlayerScene은 수업/문서/쪽 ID를 key로 사용한다. 현재 표면을 유지하면서 목표를 같은 크기로 배치하고 visibility:hidden/aria-hidden을 적용한다. 준비 중 PptxView의 효과 요청·transport 쓰기·native start를 막고 LocalMediaPlayer는 passive로 재생·checkpoint를 금지한다. File/Blob/미디어를 세션 DB나 백업에 추가하지 않는다.

runtime 준비, SVG 이미지 decode, fonts.ready, 두 animation frame 및 등록된 native 미디어의 data/seek 완료·paused를 확인한다. 전체 준비 대기는30초이며 이미지·글꼴 Promise에도 취소/남은 시간을 적용한다. 이는 원본 글꼴 충실도나 모든 코덱 지원의 증명이 아니다.

확정 전 최신 공개 상태와 정확한 pending을 다시 조회한다. COMMIT ACK는 단조 revision의 receiveSnapshot으로 반영한다. 응답이 불명확하면 현재/목표 자산을 유지하고 저장 상태를 재조회하며 같은 command ID로 조정한다. 취소/무효화/실패는 준비 표면만 해제한다. 성공하면 같은 keyed PptxView/DOM/native 요소를 active로 승격해 재파싱·재마운트를 피한다. 새 Player는 이전 context의 pending을 실행하지 않으며 Remote에서 취소 후 새 요청할 수 있다.

준비 상태를 매 revision마다 ready로 재보고하면 효과 완료/취소/보류 안내가 사라진다. 활성화 때만 기존 상태를 알리고 기존 표면의 completed/cancelled/exhausted/held는 준비 가능 상태로 인정하되 running은 기다린다.

## 실제 증거

Windows / Whale5.39.412.57 headless 격리 프로필·로컬 패키지. 아래 경로는 모두 ignored node_modules/.cache 아래이며 실행은 종료됐다.

| 실행 | 결과·관찰 범위 |
|---|---|
| whale-prepared-scene/1791937459793/result.json | PASS. 정상 Remote UI·현재 PDF 픽셀/동일 음원 재생 유지·worker 재시작·숨긴 준비·COMMIT 응답 유실 조정/동일 DOM 승격·같은 쪽 재요청·새 owner 과거 pending 보류/취소·원본 보유 창 종료 후 누락 거부/PDF 유지·재연결·검정 대기에서 닫힌 자료의 다른 명시 쪽 재개. 원본hash 불변·외부0/pageerror0. |
| whale-pptx-degradation/1791937350812/result.json | PASS. 합성20.001초 미지원 회전 활성화/이전 쪽 거부·준비 취소/Worker 종료/늦은 결과 무반영·PDF/정상 쪽 유지·DOM 재사용·Editor/Remote 각5 화면. 380px 화면 직접 확인. |
| whale-pptx-embedded-media/1791937459925/result.json | PASS. 내장 WAV/MP4·원본5그룹 source-v1 회귀. 닫힌 목표 native video의 readyState≥2/paused 확인 후 COMMIT·동일 host/video 승격·전후 play0·완료 cursor5 보존. |
| whale-pptx-player/1791937273185/result.json | PASS. 실제 teacher-01 23쪽/12효과·비공개 편집/overlay·취소/실패·worker/새 Player·백업/재연결·5 화면. |
| whale-foundation/profile-1791937147796/verification-result.json | PASS. PDF 저장/복사본/종료·owner/worker·native WAV/MP4·자동 넘김/정상 재시작. 이후 제품 수정은 PPTX 효과 상태 안내뿐이며 PDF 구조는 같다. |
| whale-presentation-transition/1791937550630/result.json | PASS. 역할/owner·공개 투영·worker/취소·중복/닫힌 명시 쪽/새 백업 수업 계약. 시험 parser를 보류하고 수동 COMMIT하는 계약 시험이다. 실제 준비 완료 근거는 위 UI/내장 시험이다. |

최종 자동 검증: 2026-10-14 09:31:13 scripts/dev.ps1 check exit0, 95파일/1,351tests·TypeScript/Vite/MV3/5스킬 PASS. 신규 deadline/취소·native 준비·정착된 효과 상태·현재 owner 조회/역할·strict payload 회귀 포함. 실제 검증에 사용한 제품 코드와 번들 내용은 같다.

초기 교사1791937099783 취소 안내/내장1791937100084 완료 안내 대기는 실패했다. 새 ready 재보고가 효과 상태를 덮어쓴 코드 오류였고 수정 후 위 회귀가 통과했다. 추가 재연결 시험1791937350698은 비동기 Editor 선택 반영 전 파일을 넣어 실패했다. 선택 값/입력 활성화를 기다린 뒤 최종1791937459793이 통과했다. 실패를 완료 증거로 세지 않는다. RSI 검토 결과 전역 규칙 공백이 아닌 프로젝트 코드·시험 문제이므로 해당 회귀를 보완하고 전역 하네스는 수정하지 않았다.

## 남은 인수

1. 기존 직접 PPTX 전환 입장 차단과 시험 경로 이행은 [후속 근거](TRANSITION_ADMISSION.md)로 완료했다. core 내부 원자 전환은 재사용한다.
2. 지문 변조·취소/확정 경합, 장기 통신 불명확 복구·대안 PDF 연결을 보완한다.
3. 대용량 현재/목표 동시 모델·미디어 메모리 및 준비/전환 시간을 측정한다. 전역 모델 메모리 예산은 아직 없다.
4. 실제 교사10종 이상/PowerPoint 기준 Visual/Media/Behavior·스피커/물리 창·모니터/IME/터치/장시간/cold offline·원본 권한/OS 저장과 PRD Stage A~G 전체 인수는 계속 남는다. PPTX 지원 등급은 승격하지 않는다.
