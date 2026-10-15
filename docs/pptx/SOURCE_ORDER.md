# PPTX 원본 순서와 모델 효과 대응

PRD v5 §11/24/25, FR-005/013/014. 원본 타이밍의 구조를 보존하는 중간 계약이며 원본 미디어 실행 완료가 아니다.

## 구현

- `sourceOrder.ts`는 기존 bounded 원본 검사와 cTn 부모/조건 metadata를 재사용한다. mainSeq의 직접 자식 구조 그룹을 남기고 source timing ID별 미디어를 해당 그룹에 대응한다. mainSeq 밖 미디어는 independentMedia로 남겨 첫 클릭에 합치지 않는다.
- 원본 presetClass의 shape 효과와 모델 효과 개수·순서·대상·종류·click/withPrev/afterPrev 관계를 비교한다. 누락/추가/다른 대상·종류·시작 관계, 여러 mainSeq, 중첩 presetClass 등 확인하지 못한 구조는 대응 실패로 처리한다.
- 모델 효과 index만 저장해 같은 대상에 반복된 효과도 구분한다. 미디어 전용 그룹의 shapeSteps는 빈 배열이며 제거하지 않는다. 원문 명령 문자열은 결과에 포함하지 않는다.
- seq의 concurrent/nextAc/prevAc, 이전/다음 조건의 정해진 이벤트·지연·slide 대상 여부, subTnLst ID와 endSync 존재를 남긴다. 알 수 없는 값은 unknown/null이며 실행 기본값으로 해석하지 않는다.
- 반환값의 `executionVerified`는 항상 false다. 직접 자식 구조 그룹이 곧 검증된 실제 클릭/시간 실행 그룹이라는 뜻은 아니다. 중첩 seq/par의 전체 시간 의미, 조건 참조/종료, 지연·재생 기간과 효과 내용의 충실도는 후속 검증이다.
- 제품 runtime은 현재 쪽 구조 대응을 시도하고 Preflight 및 Player 상태 안내에 원본 구조/미디어 전용 개수를 추가한다. 대응 실패는 unknown으로 고지하며 원본 렌더와 기존 검증된 효과 엔진을 유지한다. 취소 시에는 runtime 준비를 중단한다. 원본 미디어 트리거를 자동 실행하지 않는다.
- 세션/백업/공개 snapshot schema, 원본 영속화·권한·라이브러리에 변화가 없다.

## 검증

- 최종 제품PPTX1791846625302/result.json exit0 PASS: 23쪽/Remote12클릭·취소/실패재시도/worker재시작·교차/새Player·독립편집/overlay/백업·5viewport·원본불변/pageerror0. foundation1791846465562도 PASS, 모든시험종료. 아래실행중메모를 대체한다.

- 수정 후 actualWhale1791846625428/result.json exit0: 실제 제품 Player의 원본구조1/미디어전용0 안내 대기·생성 확인, 교사12구조/12효과 및 합성3구조/shape1/media-only2/실행false, 내장 전체/타이밍/변조거부/원본불변/외부0/pageerror0 PASS. 1366 발표영역 캡처를 직접 확인해 기존 crop/ellipse 화면 보존을 확인했다. Teacher 도구의 안내는 DOM 검증이며 별도의 도구 표시 캡처는 미실시다.

- 제품연결 첫 검증1791846465520은 Player 안내 대기 timeout으로 종료했다. 구조 안내를 쓴 직후 report('ready')가 이전 효과 문구로 덮는 원인을 확인해, 모든 report 상태에 구조/미확인 고지를 함께 유지하도록 수정했다. check08:10:06 992tests/빌드/MV3 PASS. 변경 전 교사제품1791846465393/foundation1791846465562 회귀는 exit0 PASS. 변경 후 내장/교사제품 회귀는 실행 중이다.

- check08:07:16: 신규13개, 73파일992tests·빌드/MV3/스킬 PASS. 미디어 전용 앞뒤 그룹/영상과 shape동시·독립 미디어·모델 불일치·잘못된 구조/namespace/취소·한도·runtime 대응실패/원본그룹 고지 및 재생 미실행을 검사한다.
- 1차 Windows Whale5.39.412.57 격리 headless `whale-pptx-embedded-media/1791846343496/result.json` exit0: 교사23쪽 원본 구조12/모델효과12 대응, 합성 구조20/30/40→음원/영상+shape/명령, 모델효과1·미디어전용2·독립0·executionVerified=false. 기존 내장/타이밍/바이트변조 거부·세션/학생화면보존·원본불변/외부0/pageerror0 PASS.
- 제품runtime/Player 고지 연결 후 최종 내장/제품PPTX/foundation 회귀 실행 중. 모든 실제 실행 조건·원본 충실도·물리 스피커·10종 인수는 미완료다.

seq의 이전/다음 조건과 concurrent/seek 의미는 [Microsoft NextConditionList](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.nextconditionlist?view=openxml-3.0.1), [SequenceTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.sequencetimenode?view=openxml-3.0.1)를 근거로 구분했다. 확인일2026-10-13. 원본 구조 대응을 PowerPoint와 같은 실행의 증거로 대체하지 않는다.

## 다음

원본 그룹별 지연/시간·with/after/종료 의미를 명시적으로 검증하고 미디어-only 그룹을 소유 Player/requestId/run epoch·완료ACK/취소/실패·새Player복원과 연결한다. 미디어 선언과 실행 명령, 한 번만 실행할 동작과 완료pose 복원을 구분해야 한다. 계획2단계 및 전체 Stage F/PRD는 열린 상태다.
