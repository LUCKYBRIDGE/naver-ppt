# 원본 그룹 완료 위치와 복원 계약

2026-10-13. PRD §11/24/25, FR-005/013/014. 원본 시간 의미와 native 미디어 연결은 미완료다.

`sourceGroupDriver.ts`는 원본 그룹에 순차 공식 엔진 그룹 번호 또는 미디어 action factory를 대응한다. 미디어 전용 그룹도 총 그룹 수와 완료 위치에 포함한다. 중복 timing ID, 누락·역순·중복 엔진 그룹, 실행할 대상 없는 그룹, 5,000개 초과를 실행 전에 거부한다. 입력 대응은 복사하며 도형 pose 대상에 미디어 ID를 임의 추가하지 않는다.

restore는 완료 원본 그룹 앞에 포함된 도형 그룹 수만 공식 엔진에 전달한다. 미디어 factory와 next/start는 호출하지 않는다. 새 그룹 실행은 도형·미디어 양쪽 완료를 기다리며 시작 또는 완료 실패 시 시작한 동작을 모두 취소한다. restore 이후의 지연 실행, 중복 start/complete와 취소 후 완료는 거부한다. requestId/run epoch/소유권은 기존 durable bridge를 통과한다.

새 완료값의 renderer는 `web-ppt-0.4.5/source-v1`이다. 기존 `web-ppt-0.4.5/transform-v1`은 계속 읽는다. bridge는 실행 driver와 다른 renderer의 기록을 재생·복원 전에 거부한다. reducer는 같은 쪽의 진행 중 완료 기록을 다른 renderer로 바꾸는 것을 거부한다. 기존 완료 수를 새 원본 그룹 수로 자동 해석하거나 clamp하지 않는다. 명시적 RESET이 기존 기록을 삭제하는 계약은 유지한다. 저장된 네 필드 구조와 원본 fingerprint/pose scope 검사는 유지한다.

제품 runtime은 기존 transform driver를 계속 사용한다. `sourceOrder.executionVerified=false` 진단을 실행 권한으로 사용하지 않는다. 원본 조건의 의미를 검증하고 source 그룹→공식 엔진 그룹을 정확히 대응한 뒤 native Player 미디어 action을 연결해야 한다. factory는 검증된 실행 계층에서 제공해야 하며 이 adapter 자체가 원본 명령 문자열을 실행하지 않는다.

## 검증

2026-10-13 08:27 후속: `sourceShapeGroups.ts`는 실제 공식 `groupSteps` 반환값을 모델 객체 identity→index로 대응한다. source 비어 있지 않은 그룹이 공식 한 그룹 전체와 정확히 일치해야 한다. 클릭 관계 문자열로 새 batch를 추정하지 않는다. sparse clickGroup은 공식 동작대로 압축되며 -1/소수/NaN/5,000 이상은 호출 전에 거부한다. 모델 객체 중복, timing ID 중복, split/merge/누락/재정렬은 거부한다. runtime은 엔진의 총 그룹 수도 비교한 뒤 sourceShapeGroups 또는 null과 Preflight를 반환하고 Player 상태 안내에 대응 여부를 표시한다. 이 결과는 원본 시간 의미의 실행 승인과 별개다.

- 신규17개/75파일1,029tests·빌드08:26:48 PASS. 초기 fixture의 optional clickGroup에 undefined를 명시해 타입 검사 실패→속성을 생략하는 정확한 모델 형태로 수정했다.
- actualWhale 최종 내장1791847630526 exit0: 교사23쪽 원본12구조/12효과/공식12그룹 정확 대응, 합성3그룹→[null,0,null], 마지막 Player 대응 문구 DOM·기존 내장/원본불변/외부0/pageerror0 PASS. 제품PPTX1791847538660도 회귀 exit0 PASS. 모든 시험 종료.

- 자동: 74파일/1,012개 테스트, 타입 검사·빌드·MV3·5개 스킬 검사 PASS. 신규 20개는 커서/무재실행 복원/동시 완료/취소/실패 정리/계약 혼용을 검사한다.
- 실제 Whale 5.39.412.57 headless: `scripts/verify-whale-pptx-checkpoint.mjs`, 결과 `node_modules/.cache/pptx-checkpoint/1791847210123/result.json`, exit0. 합성 미디어 전용→도형 동시→미디어 전용 3개 완료, 원본 커서3/도형 커서1, 소진, 재시작 후 동일 완료값·미디어 factory 호출0 확인. 도형은 실제 WAAPI, 미디어 action은 합성 완료 promise다. native audio/video·제품 원본 타이밍 실행 시험으로 해석하지 않는다.
- 초기 새 시험 두 번은 BEGIN 성공 후 bridge 실패. 상세 기록으로 Player 응답이 `{kind:'player',snapshot}`인데 시험 transport가 `result.session`을 읽는 원인을 확인하고 수정했다. 제품 bridge 오류가 아니며 실패 출력을 보존했다.
- 교사 PPTX/PDF 제품 회귀는 별도 결과를 TEST_RESULTS에 기록한다. PowerPoint 기준 충실도, 실제 10종, 원본 미디어 트리거 및 물리 음향 검증은 남아 있다.
