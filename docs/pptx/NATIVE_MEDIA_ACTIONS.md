# 원본 미디어 명령의 native 실행 경계

2026-10-13. PRD §11/24/25, FR-005/013/014. 원본 타이밍 실행의 제품 통합은 미완료다.

## 근거와 구현

[Microsoft cmd 구현 설명](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/b2f15f11-5b40-4f67-ae95-5a510c3bea06)은 미디어 call을 비지속 명령으로 설명한다. playFrom 인자는 클립 시작부터의 초 단위 위치이며 비활성 미디어의 togglePause는 처음부터 재생한다. type 생략은 PowerPoint에서 call 기본값이다. 실제 미디어 shape와 타이밍 루트 아래의 연관 audio/video 선언이 필요하므로 문자열 인식만으로 원본 실행을 허용할 수 없다.

`core/pptxMediaAction.ts`는 최대64자 call을 play/pause/resume/stop/togglePause 또는 playFrom(timeSec) 객체로 변환한다. 알 수 없는 명령, evt/verb, 음수·지수·무한 위치, 86,400초 초과는 null이다. extra 필드와 상속 type은 거부한다. 원문을 eval하거나 저장하지 않는다. 기존 Preflight 어휘 검사는 이를 재사용하며 type 생략 call도 인식한다. 인식은 지원 판정이 아니다.

`nativeMediaAction.ts`는 소유한 native media/clip 범위/현재회차 확인 callback을 받는다. metadata·길이·clip·위치를 실행 전에 검사한다. playFrom은 원본 절대 초 단위이고 범위 밖을 clamp하지 않고 거부한다. pause는 위치를 보존하고 stop은 비활성으로 만든다. 다음 inactive 재생/토글 또는 ended 재생은 clip 시작으로 이동한다. active pause 이후 resume은 위치를 보존한다. cmd 완료는 native play promise 수락 또는 pause 처리이며 자연 종료를 기다리지 않는다.

이전 pending 회차를 취소하고 늦은 성공/실패가 새 회차를 정지시키지 않게 한다. 현재회차의 늦은 성공이 취소·소유권 상실 뒤 도착하면 정지하고 실패한다. 수락 후에도 cancel은 해당 재생을 정지할 수 있다. dispose는 정지/후속 명령 거부다. toggle은 이전 pending 취소가 native를 정지하기 전에 실제 상태를 읽는다.

## 검증과 남은 통합

2026-10-13 09:03 전역 제어 검사: `mediaTimelineControls.ts`는 단일 sld/timing/tnLst/par/tmRoot, 직접 mainSeq, 두 컨테이너의 명시적 0ms 시작·indefinite 기간, 순차 onNext/slide 조건과 root 직속 미디어의 indefinite 대기를 검사한다. root restart는 생략 또는 never만 허용한다. [Microsoft SequenceTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.sequencetimenode?view=openxml-3.0.1)에 따라 생략한 concurrent/nextAc/prevAc는 disabled/none/none으로 해석한다. concurrent는 이전 요소를 활성 상태로 남기며 seek는 자연 종료 위치를 계산해야 하므로 현재 실행 경로로 치환하지 않는다. 해당 설정과 skipTimed, 중첩seq, 부모 지연·반복·종료, 자동 시작 미디어, 알 수 없는 속성은 거부한다. [CommonTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.commontimenode?view=openxml-3.0.1)의 restart 설명도 참조한다.

반환값은 root/main/group/declaration timing IDs와 controlsVerified=true, executionVerified=false다. 전역 제어 계층 확인이며 개별 그룹의 시간 의미·미디어 설정·등록 출처·Player bookmark 검증을 대체하지 않는다. 일반 PowerPoint의 concurrent/seek 지원은 열린 요구사항으로 유지한다.

- 신규18개/79파일 **1,116tests**, 타입/빌드/MV3/5스킬 PASS(09:02:14 시작).
- 실제 Whale 5.39.412.57 headless `node_modules/.cache/pptx-checkpoint/1791849769204/result.json` exit0. 생성XML root1/main10/group40/declaration2 대응과 concurrent/seek/skipTimed 거부, 실제 mutedWAV 151.4ms 뒤 1회 실행/취소·대기취소0 및 strictDB/ACK/복원 회귀 PASS. 사람이 듣는 소리 검증은 아니다.
- 새 모듈은 아직 제품 runtime 호출 경로가 없다. 직전 제품PPTX1791848744061/내장1791848744172 근거는 유지하며 이번 probe를 제품 원본 자동 재생 성공으로 확대하지 않는다. 다음은 원본 미디어 설정과 source 그룹/명령 준비를 묶고 durable bookmark/native Player 연결, concurrent/seek 의미를 구현하는 것이다.

2026-10-13 후속 지연 계약: `mediaCallDelay.ts`는 mainSeq 직접 클릭그룹부터 cmd cTn까지의 명시적 무조건 start delay를 합산한다. [Microsoft Condition](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.condition?view=openxml-3.0.1)의 delay 예제와 trigger 구분을 근거로 한다. start가 없거나 indefinite, event/참조, 추가클릭/afterEffect, 반복·종료조건·알 수 없는 기간/속성·중첩seq는 거부한다. 반환 executionVerified=false는 root/seq 전체, 미디어 설정과 영속 위치를 검증하지 않았다는 뜻이다. 클릭그룹 내부 지연 판정만으로 전체 source 실행을 승인하지 않는다.

`startPptxDelayedMediaAction`은 performance deadline 기준으로 native action을 한 번 예약하고 실행 전/수락 뒤 현재회차를 확인한다. 취소는 타이머와 시작한 native handle을 정리한다. 수락 후 취소도 유효하며 소유권 확인 실패·예외는 실행하지 않는다. 기존미디어가 아직 시작되지 않은 예약을 취소한다고 무관한 재생을 정지하지 않는다. 서비스워커 timer를 사용하지 않는다.

- 신규18개/78파일1,098tests·타입/빌드/MV3/5스킬 PASS(08:51:51). 초기 시험 fixture의 중첩 배열 닫힘 누락은 XML 노드를 나눠 구성하도록 수정했다.
- actualWhale checkpoint `node_modules/.cache/pptx-checkpoint/1791849167813/result.json` exit0. 생성한 원본XML의 부모50ms+cmd100ms→150ms, 실제 mutedWAV는 정확히150ms 이후 한 번 실행·수락후취소정지, deadline전취소는 nativeStarts0, onClick 조건은 거부. 기존 strictDB/ACK보류/재시작 무재실행·native 명령 전체회귀 포함.
- 이 모듈은 제품 runtime에서 아직 호출하지 않는다. 제품 코드/화면 경로는 변하지 않아 직전 내장1791848744172/제품PPTX1791848744061 회귀 근거를 유지한다. 다음은 root/seq concurrent·seek/부모조건과 원본 설정, 검증된 그룹/native bookmark의 제품 통합이다.

2026-10-13 08:46 원본 call 준비: `sourceMediaCalls.ts`가 기존 strict 원본/shape/path/자산hash binder를 호출한 뒤 bounded XML의 cmd를 정규화한다. tmRoot는 sld/timing/tnLst/par/cTn 경로에 하나여야 하며 연관 audio/video는 그 root의 직접 childTnLst 안에 있어야 한다. cmd는 같은 root 아래에 있고 declaration과 kind/slide/part/원본hash/미디어hash/elementPath가 모두 같아야 한다. 알 수 없는 cmd 속성·다른 어휘·누락/중복은 거부한다. 선언만 있는 노드를 명령으로 바꾸지 않는다. 반환값은 timingId/declarationTimingId/등록target/action이며 원문 문자열은 없다.

runtime.resolveSourceMediaCalls는 명시 호출 때만 준비하며 dispose/취소 전후를 검사한다. 아직 실행하지 않고, root 선언 일치는 조건·지연/미디어설정 검증을 대신하지 않는다. 기존 구조용 media-only fixture는 선언을 클릭그룹 안으로 옮겼으므로 실행용 root 대응에 실패해야 한다.

- 신규17개/77파일1,080tests·빌드08:45:38 PASS. root 위치/다른branch·경로·hash·kind·scope/중복·어휘·취소·runtime 지연반환 차단 검사.
- 실제 Whale 내장 `node_modules/.cache/whale-pptx-embedded-media/1791848744172/result.json` exit0 PASS: 원본 XML playFrom(.25)→root video timingId3/등록경로[2]/자산hash 대응, 중첩선언 자료는 PPTX_SOURCE_MEDIA_CALL_UNVERIFIED 거부. 기존 내장/교사공식12그룹·원본불변/외부0/pageerror0 포함. 제품PPTX1791848744061도 회귀 exit0 PASS. 모든 시험 종료. 원본 조건/미디어설정 실행은 여전히 미검증이다.

2026-10-13 08:40 ACK 대기 보완: durablePlayback 회차 token이 playback cancel handle을 완료ACK까지 유지한다. invalidate/실패는 한 번 정리하고 성공ACK 뒤 restore는 재생 중 미디어를 정지하지 않는다. 동기 start 안에서 invalidate된 경우에도 반환된 native handle을 즉시 정리한다. animationRun은 동기 교체가 소유한 새 WAAPI를 이전 회차에 포함하지 않으며, 취소된 promise의 늦은 reject도 처리한다.

- 신규4개/76파일1,063tests·빌드08:39:51 PASS. ACK보류 취소/실패·성공 재생유지·동기start취소/중첩WAAPI 소유권을 검증했다.
- actualWhale checkpoint `node_modules/.cache/pptx-checkpoint/1791848414351/result.json` exit0. 실제 mutedWAV+sourceGroupDriver+durablePlayback+strictDB에서 ACK 보류 중 .209208→.239541초 재생, 취소→superseded/paused, 늦은ACK 이후 정지·이미commit된 완료1 유지, 다음 성공ACK에서재생유지/nativeStarts2 PASS. 원본XML timing/제품Player 통합 시험과 구분한다.

- 신규30개/76파일1,059tests·타입/빌드/MV3/5스킬 PASS(08:33:17). 어휘·악성/범위·metadata/소유권·지연 성공/실패·토글 경쟁·dispose 확인.
- actualWhale5.39.412.57 headless `verify-whale-pptx-checkpoint.mjs`, `node_modules/.cache/pptx-checkpoint/1791848003458/result.json` exit0. muted 합성WAV4초: .200901→.250040초 진행, pause .250094초 유지, resume .375406초, playFrom1.25→1.250084초, stop/토글 .200029초·수락후취소/늦은성공 정지 PASS. 기존 strictDB/WAAPI/source커서/재시작factory0 회귀 포함.
- WAV는 이 PC에서 만든 합성 입력이며 음향 출력·교사 원본 미디어 근거가 아니다. 교사 원본은 미디어0. 제품 renderer/Remote가 이 실행기를 호출하지 않으며 `productTimingConnected=false`다.
- 다음: guarded cmd→등록target/연관 root audio-video→정확 source 그룹 및 조건/지연→Player native handle/durable bookmark→수락/실패/ACK로 연결. 완료ACK 대기 중 취소에도 media handle을 유지해야 한다. 새 Player/백업 restore는 과거 cmd 실행이 아니며 inactive/paused/저장위치를 연결해야 한다. clip 끝 정지·원본설정·선언 audio/video의 지속 타이밍은 기존 Player와 함께 통합한다.
- PowerPoint 기준충실도·실제10종/물리음향·전체PRD 인수는 미완료다.
