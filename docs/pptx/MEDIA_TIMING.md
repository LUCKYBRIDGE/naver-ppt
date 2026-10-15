# PPTX 원본 미디어 타이밍 검사

PRD v5 §11/24/25, FR-005/013/014의 원본 미디어 연결을 위한 첫 단계다. 원본 명령 실행은 아직 연결하지 않았다.

## 구현 범위

2026-10-13 조건 분류 후속: `mediaTimeNode.ts`가 cTn의 부모 ID, nodeType, duration, repeatCount(1/1000 단위), repeatDur, autoRev와 직접 시작/종료 조건을 숫자·정해진 어휘로 보존한다. 조건의 time/shape/slide 참조 및 지연/indefinite를 구분하며 누락·미확인 값을 0이나 첫 클릭으로 바꾸지 않는다. time/shape 참조가 실제 존재하는지도 검사한다. 속도·시간필터·restart/sync·가속·반복 순회 등 아직 해석하지 않는 설정은 unverified다.

숫자 요약은 17개로 확장했다. 추가 필드는 전체 반복·역재생·종료조건·상호작용·p14 미디어 자르기·미검증 타이밍 수다. 반복/조건은 미디어 전용이 아닌 전체 원본 타이밍 기준이다. p14:trim은 timing 밖의 확장에서도 검사하며 0..86400000ms 소수 값을 진단 한도로 둔다. 자르기 총 길이와 재생 시간의 정합성은 아직 검사하지 않아 실행에는 적용하지 않는다.

[Microsoft MediaTrim](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.office2010.powerpoint.mediatrim?view=openxml-3.0.1)의 end는 끝에서 제거할 길이이며 종료 위치가 아니다. [CommonTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.commontimenode?view=openxml-3.0.1)의 조건/반복 정보를 근거로 분류한다. 확인일 2026-10-13. 원문 명령이나 임의 이벤트 이름은 복사하지 않는다.

2026-10-13 후속: `mediaTimingBinding.ts`에 원본 대상 대응 API를 추가했다. 등록 UUID/원본 지문·manifest 순서 검증 → 원본 timingId/shapeId → 모델 ID의 유일한 중첩 elementPath → 원본 pic의 audioFile/videoFile 관계 → 준비 자산과 원본 ZIP 미디어의 SHA-256을 확인한다. p14 media 확장도 같은 내부 자산을 가리켜야 한다. 대상·종류·경로·바이트·소유권 불일치, 취소, dispose는 부분 결과 없이 거부한다. 모델을 처음부터 찾아다니는 대신 ID/그림 map을 한 번 만들고 자산 해시는 재사용한다.

이 API는 현재 진단 모듈 검증에 사용하며 제품 Player의 원본 트리거 실행에는 아직 연결하지 않았다. 반환 순서는 XML 문서 순서이며 실제 클릭/시간 실행 순서를 뜻하지 않는다. 원문 명령 대신 node 종류/timingId/shapeId/등록 slideId/elementPath/원본 part·지문/미디어 지문만 반환하고 영속 저장하지 않는다.

원본 관계 검증은 [Microsoft Media Part](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-pptx/922b7818-6e5f-4641-a9c5-fab4063ec124)의 media relationship을 기준으로 하며, 제품에서는 내부 자산만 허용한다. 확인일 2026-10-13.

- 기존 안전 XML의 parsed Document를 재사용한다. PresentationML namespace/직접 자식, cTn ID 중복, shape ID 유일성, 미디어와 명령 대상 연결을 검사한다.
- `mediaTiming`은 audio/video/cmd/인식호출/기타명령/구조·값경고/미확인대상/비도형대상/전체조건·지연/설정/여러쪽재생의 11개 숫자 요약이다. 조건 수는 전체 타이밍 기준이다.
- 최대100000노드·깊이128·AbortSignal·문서 집계100000 한도를 적용한다. 기존 ZIP/XML 제한을 유지한다.
- play/pause/resume/stop/togglePause 및 한도 내 playFrom(seconds)의 어휘 인식은 실행 지원이 아니다. event/verb는 실행하지 않는다.
- 파일 원본 점검과 모델 Preflight에 연결했다. 모델 미디어0이어도 원본 명령을 고지한다. 미발견은 원본 미디어 부재나 재생 지원을 뜻하지 않는다.
- 요약은 strict 필드/0..100000 안전한 정수/recognizedCalls+otherCommands=commands를 검사한다. 원문 명령·본문·URL을 복사하지 않는다. 저장/백업 schema·권한·패키지·원본 보관 정책 변화는 없다.

## 검증

- 조건 분류 후 제품PPTX1791845808198/result.json/foundation profile-1791845808330/verification-result.json 모두 exit0 PASS. 교사23쪽/Remote12클릭·취소/재시도·worker재시작·교차/새Player·독립편집/overlay/백업·5viewport 및 PDF 기반 회귀 확인. 모든 시험 종료, 아래 실행 중 기록을 대체한다.

- 조건 분류 check07:57:45: 신규23개/72파일979tests·빌드/MV3/스킬 PASS. 부모/조건참조/indefinite/소수 반복/역재생·잘못된 값·미확인 어휘·자르기/네임스페이스 및 모델미디어0일 때 경고를 확인했다. 최초 TypeScript 문자열 union 추론 오류를 명시 타입으로 수정했다.
- actualWhale1791845740393/result.json exit0: 합성 반복1/역재생1/종료조건1/자르기1·미검증0, time ID1~4의 부모 관계와 onEnd→time2 참조, 기존 대상/바이트변조 거부 및 내장 전체 회귀 PASS. 실제 Editor380px 긴 설명 정상 줄바꿈을 직접 확인, 세션/학생SVG/정지 상태 보존·외부0/pageerror0/원본불변.
- 교사 원본23쪽/audio-video-cmd0/전체조건20, 미검증 타이밍4를 별도로 고지한다. 이를 미디어 재생 지원으로 해석하지 않는다. 제품PPTX/foundation 후속 회귀는 실행 중이다. missing ID를 unverified로 표시하는 마지막 보완은 단위 테스트로 확인했다.

- 교사 제품PPTX1791845299139/result.json exit0 최종 PASS: 23쪽/Remote12클릭·취소/실패재시도/worker재시작·교차/새Player·독립편집/overlay/로컬백업·5viewport·원본불변/pageerror0. 모든 시험 종료, 아래 실행 중 메모를 대체한다.

- 최종 내장1791845299247/result.json exit0 및 foundation profile-1791845299672/verification-result.json exit0 PASS. map/소유권 최적화 후 원본대응·변조거부·내장전체·PDF기반 회귀를 재확인했다. 교사PPTX 제품회귀 session14954는 실행 중이다.

- 후속 check 07:48:03: 신규19개, 71파일956tests·빌드/MV3/스킬 PASS. 중첩 경로/원본 part 순서·cmd 대응, 모델 대상 누락·중복/종류/경로, 동일크기 자산 변조, 외부·다른종류·누락 관계, p14 관계, timing ID 중복, 빈 타이밍, XML 한도/DTD, 취소·dispose를 검증한다. 최초 순회 스택이 문서 순서를 뒤집던 문제를 수정했고, p14 음성 fixture의 모의 DOM 자식 갱신 오류도 수정했다.
- 1차 actualWhale1791845191834/result.json exit0: 합성 audio/video/cmd → 경로[1]/[2]/[2] 및 개별 hash 대응, 모델 대상 제거/원본 바이트변조 모두 거부, 기존 내장 전체 회귀 PASS. map/소유권 최적화 후 최종 회귀는 실행 중이며 종료 결과를 아래에 추가한다.

- 2026-10-13 07:31:25 check: 70파일937테스트·TypeScript/Vite/MV3/스킬 PASS. 신규28개는 어휘/대상/namespace/ID·설정/취소·깊이/strict요약과 모델 누락 고지를 다룬다.
- Windows Whale5.39.412.57 격리 headless, `node_modules/.cache/whale-pptx-embedded-media/1791844433682/result.json`, exit0: 합성 음원1/영상1/명령1/인식호출1/전체조건1/설정2/여러쪽2/경고0/미확인대상0. 실제 Editor 점검 중 세션·학생 SVG·정지 상태 보존. 380px DOM 너비·스크롤 경계 PASS.
- 최종 실제 Whale `1791844808158/result.json` exit0 PASS. bringToFront 후 380px 뷰포트 두 구간을 직접 확인해 정상 줄바꿈/잘림 없음을 확인했다. 제품 CSS 변경은 불필요했다. 첫 구간 캡처는 백그라운드 timeout, 다음 시험은 사전조건 명령의 STALE_REVISION으로 종료됐다. 사전조건은 늦은 native checkpoint와 경쟁하므로 명시적 stale 거부만 같은 commandId로 최대3회 재시도한다. 응답 불명이나 다른 실패는 재시도하지 않는다.
- 교사23쪽: 원본 audio/video/cmd0·전체조건20. SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 불변, 외부0/pageerror0.
- 제품 PPTX `whale-pptx-player/1791844300778/result.json`, foundation `profile-1791844300776/verification-result.json`: exit0 PASS. 12클릭/교차/새 Player/편집/백업 및 PDF 경계 회귀.

## 남은 작업

원본 순서 구조/모델 shape index 대응과 미디어-only 그룹 보존을 후속 구현하고 제품 runtime 진단에 연결했다. 실제 실행 계약과 시간 의미는 미완료다. [범위·증거](SOURCE_ORDER.md).

계획1단계는 부분 구현이다. 원본 검사·등록 대상 대응과 조건/반복/자르기 존재 분류를 추가했으며 전체 cTn 계층의 실행 의미, 원본 clip 실제 범위 및 고급 조건은 아직 검증하지 않았다. 다음은 클릭그룹/media-only 순서, 소유 Player/requestId 실행·취소·실패·ACK와 원본 설정 적용이다. 실제10종/PowerPoint기준/물리 스피커·교실 인수는 미실시, PPTX unverified 및 전체 Stage A~G 미완료를 유지한다.
