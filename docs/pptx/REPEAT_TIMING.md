# 유한 반복·역재생 시간 전달

후속21:34: 기본/명시적0 가속·감속의 회전·확대는 linear로 수정하고 분수 종료 progress를 독립 검증했다. 아래 기록은21:29 시점이며 최신 근거는 [LINEAR_TIMING](LINEAR_TIMING.md).

## 범위
- 2026-10-12 21:29, PRD v5 Stage D / X-04 / SPIKE-T-04 / FR-004의 격리 실험이다. 제품 Player에는 연결하지 않았고 PPTX 지원 상태는 unverified다.
- `repeatTiming.ts`가 원본 회전·확대의 repeatCount를 천분의1 횟수로 읽고 autoRev를 전달한다. behavior 또는 effect 한 계층의 조건만 허용한다.
- 횟수 0.001~100, 단일 시간 60~10000ms, 전체 시간 최대120000ms로 제한한다. 무한 반복, repeatDur, 두 계층 동시 반복, 상위 mainSeq 반복, accel/decel·spd·tmFilter는 거부한다.
- 기존 엔진에 전체 활성 시간을 전달하여 afterPrev를 계산하고, 새로 생성된 소유 WAAPI에 원래 duration/iterations/direction을 적용한다. 자체 타이머나 스케줄러를 추가하지 않았다. 실패 시 새 애니메이션만 정리한다.

## 확인한 것
- `scripts/dev.ps1 check`: 21:24:57 기준 45파일581tests, TypeScript/Vite/MV3 검사 PASS. 반복 경계 단위35개 추가.
- Whale5.39.412.57 headless, effects profile1791807905223: 실제 합성 OOXML을 Worker로 다시 파싱한 6조건(회전 2회, 역재생, 2.5회, 2회+역재생, effect계층 반복, 확대 반복+역재생) PASS.
- native 활성시간400/500/800ms 및 뒤따르는 이동+30ms/확대+50ms 지연, 중간 행렬, 완료 pose 복원, 자료전환 취소·늦은 commit0·소유 WAAPI idle 확인. 지연 비교만 부동소수점 오차0.001ms를 허용한다.
- effects 원본합성 SHA256 `254eab699e3be2232eb633472b0c919921dd1bae49ed5a2085ac86f4a0190a6a`, 변형 `2ded169884551ca5122ecc44372bb86e47cdeb82891710869643066fae1630d1`.
- teacher profile1791808101595: 첨부23쪽/12클릭 및 수명 회귀 PASS. 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 불변.
- media profile1791808112045: WAV/MP4 bytes/hash·무음 재생·영상 pixel·자료 전환 정지/복귀 PASS. 모든 시험 외부 요청0. Worker 종료·SVG 공격 경계 유지. 기본5효과 완료복귀 스크린샷 직접 확인.
- 초기 검증의 선택적 필드 TypeScript 오류와 시간값 미세 오차 assertion은 수정 후 재검증했다.

## 확인하지 못한 것
- 후보의 기존 cubic-bezier 곡선을 유지한다. native 계산 progress에 대한 행렬 비교이며 PowerPoint 원본 시간곡선 일치 증거가 아니다.
- 2.5회는 native timing/pose 복원을 확인했지만 최종 분수 progress를 별도 기준값과 비교하지 않았다.
- 첨부 수업 PPTX에는 반복·역재생 원본 효과가 없다. 이번 결과는 합성 자료이며 실제 PowerPoint 기준 PDF/PNG·추가 실제10종 비교를 대신하지 않는다.
- 제품의 세션/revision·Player·영속 checkpoint/pose 연결, 미디어 고급 트리거, 실제 스피커·다중 모니터/DPI·포커스·절전 인수는 남아 있다.

## 근거
[Microsoft CommonTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.commontimenode?view=openxml-3.0.1)는 repeatCount의 천분의1 단위와 autoRev의 순방향 후 역방향 동작을 설명한다. 전체 원본 타임라인 충실도는 별도 검증한다.
