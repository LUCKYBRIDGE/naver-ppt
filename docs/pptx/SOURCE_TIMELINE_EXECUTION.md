# 원본 미디어 클릭 그룹의 제품 실행

후속2026-10-13: 발표 중 늦은 미디어 등록/설정 변경의 같은 runtime 재준비와 준비불가 source checkpoint 복원 경계를 추가했다. [현재 재준비 범위와 검증](MEDIA_TIMELINE_REFRESH.md).

2026-10-13. PRD v5 §11/14/24/25, FR-005/013/014. 원본 XML의 검사한 순차 미디어 클릭 그룹을 기존 Remote 요청→Player runtime→native endpoint→durable 결과/그룹 ACK 경로로 연결했다. 전체 PPTX 타임라인 지원 완료는 아니다.

## 준비와 실행

`sourceTimeline.ts`는 원본/모델/소유 Blob의 strict 바인딩을 먼저 수행한다. 동일 XML에서 전역 root/mainSeq/next 조건, source 그룹과 공식 그룹 대응, cmd와 root 미디어 선언, 명시 설정·clip, 현재 등록 ref의 원본·지문·요소 경로를 함께 확인한다. 등록되지 않은 대상이나 중복 대응은 거부한다. cmd 하나의 조상만 검사하지 않고 전체 그룹의 cTn/par/list/cBhvr/target 자식을 검사해 숨은 동작이나 알 수 없는 속성을 버리지 않는다.

현재 실행하는 경로는 도형 효과가 없는 media-only 클릭 그룹, 명시적인 무조건 지연, 순차 next 및 검증한 원본 설정이다. 준비 결과에는 mediaId·출처 바인딩·정규 action·delayMs만 보존하고 원문 cmd/XML을 세션에 넣지 않는다. `executionVerified:false`는 준비 결과 자체가 실행 증거가 아니라는 의미다. 실제 실행 결과는 아래 제품 시험으로 구분한다.

runtime은 source-v1 driver의 전체 클릭 그룹 수에 미디어-only 그룹도 포함한다. BEGIN_REQUESTED의 현재 run epoch를 확인하고 deadline 뒤 등록 endpoint를 호출한다. 호출 직전에도 미디어 바인딩을 다시 확인한다. endpoint도 생성 때의 source occurrence를 보관해 같은 bytes 지문이라도 다른 요소 경로로 교체되면 거부한다. 취소/실패는 소유한 native/delay handle을 정리하며, 완료는 미디어의 자연 종료와 별도로 결과 저장 및 그룹 ACK 이후 확정한다.

새 Player의 restore는 도형 prefix와 완료 cursor만 복원하며 과거 native action을 호출하지 않는다. 기존 transform-v1 checkpoint를 source-v1으로 자동 변환하지 않는다. `createPptxMediaCallDelayReader`는 준비 한 번에 검증한 index를 공유해 cmd마다 전체 XML 타이밍을 다시 순회하지 않는다. 원본 자체는 수정하지 않는다.

## 확인한 근거

- 신규21개, 83파일 **1,189tests**·타입/빌드/MV3/5스킬 PASS(18:21:55 check, exit0). compiler의 그룹/조건/숨은 동작·등록 출처/중복/설정/clip/취소와 endpoint occurrence 교체를 확인했다.
- 실제 Whale5.39.412.57 headless, `whale-pptx-embedded-media/1791883200846/result.json`의 sourceTimelineExecution: 일반 Editor opt-in 등록·내장 연결, 실제 Remote 버튼, 원본750ms 지연 중 취소·native 미실행, 결과 저장 실패 후 정지/명시 재시도, play→pause→playFrom(0.5)→stop→togglePause 5그룹, source-v1 완료 ACK/효과 소진 PASS. 실제 영상 위치는 첫 재생0.043894초, 일시정지0.271628초, 탐색후0.558395초, stop 이후 시작0.040754초였다. 새 Player native play 호출0/완료5 보존을 확인했다.
- 최종 코드의 내장 `whale-pptx-embedded-media/1791883338948/result.json` exit0:같은5그룹·지연/취소/실패재시도·새 Player action0과 기존전체내장 회귀 PASS. 최초재생0.033956초, pause0.234873초, 탐색0.534932초, stop 뒤 시작0.037761초. 외부0/pageerror0/원본불변. 교사제품 `whale-pptx-player/1791883338827/result.json` exit0:23쪽12효과·Remote/편집/백업/교차/복원 전체 PASS. owner `whale-pptx-owner/1791883548865/result.json` exit0:비동기소유권대기 보완 후 role/중복/worker/승계·효과/복원 PASS. foundation의 비동기대기6곳 보완 뒤 `whale-foundation/profile-1791883548564/verification-result.json` exit0 전체 PASS. 모든 시험 종료를 확인했다.

Microsoft cmd 정의는 playFrom의 초 단위·clip 시작 기준과 root audio/video 연관을 명시한다. trim 시작이 있는 playFrom의 시간축을 원본 파일 절대 위치와 같다고 가정하지 않고 현재 compiler는 그 조합을 거부한다. [공식 근거](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/b2f15f11-5b40-4f67-ae95-5a510c3bea06).

시험의 async waitForFunction은 설치 Playwright 구현이 Promise 자체를 참으로 처리해 완료 전 진행했던 오류가 있었다. 실제 Session 응답을 Node에서 await한 뒤 checkpoint 값을 폴링하도록 바꿔 최종 실행 근거를 다시 얻었다. 실패 프로필을 보존했고 false-positive 관찰은 완료 근거로 사용하지 않는다.

## 남은 요구사항

혼합 도형·미디어의 정확한 시간 대응, concurrent/seek/skipTimed·대상 클릭/종료/반복 조건, trim+playFrom 시간축, 여러 미디어 동시 그룹의 실제 검증이 남는다. 발표 중 등록/설정 변경 후 재준비는 위 후속 문서의 범위를 따른다. 교사 원본은 미디어0이며 이 native 실행 증거는 합성 자료다. 실제10종/PowerPoint 기준의 Visual/Media/Behavior 충실도·물리 스피커/IME/다중모니터·오프라인/성능/최종 인수와 Stage A~G 전체 목표는 계속 미완료다.
