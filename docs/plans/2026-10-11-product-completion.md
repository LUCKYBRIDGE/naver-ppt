# PRD v5 제품 완성 추적
- 목표: Windows 네이버 웨일에서 PRD v5의 발표 운영 제품을 완성하고 실제 검증 근거를 남긴다. PDF만 완성한 것을 전체 제품 완료로 판정하지 않는다.
- 승인: 사용자의 제품완성까지 개발 요청 및 기존 전체 승인.
- 완료 기준: PRD §25의 실제 샘플/Whale/Visual·Media·Behavior/오프라인/성능/라이선스/제한/테스트/매트릭스를 요구사항별로 확인한다.

## 단계와 증거
1. [ ] Stage A: 상태/저장/역할 경계/복구 실제 Whale 인수 (자동 계층 구현됨).
2. [ ] Stage B: PDF A/B 등록·A5/B2/A5·B8 독립 편집·overlay/note·현재 종료·로컬 세션/PDF 복사본·원본 hash·재시작·focus/autoplay.
3. [ ] Stage C: Visual/Media/Behavior/Offline Preflight, 캐시와 사용자 경고.
4. [ ] Stage D: PPTX 렌더러 후보 비교 및 실제 10종 이상의 충실도 근거.
5. [ ] Stage E: 선택적 Windows Quick Launch/우클릭/단일·복수/차가운·실행 중 Whale/인증된 IPC/실패 fallback.
6. [ ] Stage F: 검증된 PPTX 기능 부분 제품화, 미디어/효과 제한 고지.
7. [ ] Stage G: PPT/SHOW 경로 판정, Canva/미리캔버스 W0, 고급 웹 기능의 개별 검증.
8. [ ] 최종: 요구사항/테스트/호환성/시연/배포 패키지 감사. 공모전 공식 조건은 확인된 공고만 반영한다.

## 원칙

2026-10-13 방향감사 후 Stage D 우선: 합성20.001초 회전의 engine초기화 실패/빈표면 재현 및 신규등록 준비불가쪽/PDF대안 사전안내를 구현했다.1,211tests/빌드·실제Whale5화면/교사제품/내장media/PDFfoundation 회귀 PASS. 실제10종/기준PowerPoint·발표중대안UX·재연결재검사는 미완료이며 Stage완료/엔진최종선정 아님. [방향·계획](2026-10-13-pptx-fidelity-continuity.md), [범위](../pptx/DEGRADATION_PREFLIGHT.md).

2026-10-13 Stage F 후속: Player를연뒤내장등록/설정변경→동일runtime재준비·과거pending/action무실행·native연속성·invalid설정새Player sourcecursor복원/교정/백업 PASS.1,201tests/빌드·실제Whale내장1791885072296/교사제품1791885072190/PDF foundation1791884344131 검증. 혼합/복합조건·충실도/물리/전체인수는계속남는다. [근거](../pptx/MEDIA_TIMELINE_REFRESH.md).

2026-10-13 Stage F 후속: 검사한 순차media-only 원본750ms/5명령 그룹을 Remote→Player/native/source-v1 ACK에 연결했다. 신규21개/1,189tests·빌드 및실제Whale 내장1791883338948/교사제품1791883338827/owner1791883548865/foundation1791883548564 PASS. 혼합/복합조건·동적재준비/충실도와전체인수는남는다. [근거](../pptx/SOURCE_TIMELINE_EXECUTION.md).

2026-10-13 Stage F 후속: native Player endpoint·실제 미디어 요소 등록, 자기 ACK 중복 적용 방지·취소/늦은 commit·교사 소유권·새 Player 과거 source 재생 대기/위치 보존 구현. 1,168tests/빌드·actualWhale native checkpoint/교사제품/foundation PASS, 원본 timeline caller와 전체 인수 미완료. [근거](../pptx/NATIVE_PLAYER_ENDPOINT.md).

2026-10-13 Stage F 후속: 소유Player source native결과 영속 저장/취소·늦은결과·receipt무재시작·복구 계약. 1,153tests/빌드 및actualWhale내장1791850866864/교사제품1791850786808/foundation1791850786972 PASS. 원본timeline→native실행/자기ACK 및전체인수는미완료. [근거](../pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 Stage F 후속: 명시적 원본 미디어 vol/mute/p14trim의 새등록/Player/Remote/백업 연결·재연결사용자값보존. 1,131tests/빌드·실제Whale내장1791850286198/교사제품1791850170029 전체회귀 PASS. 원본trigger·동시/seek·실제충실도/전체인수 미완료. [근거](../pptx/SOURCE_MEDIA_SETTINGS.md).

2026-10-13 Stage F 후속: root/mainSeq 전역 제어 gate·순차 next/선언 대기 검사. 1,116tests/빌드·actualWhale checkpoint1791849769204 XML/native 지연/취소·ACK·복원 PASS. concurrent/seek/skipTimed, 원본설정·Playerbookmark·제품 자동실행과 전체인수는 미완료. [범위](../pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 Stage F 후속: 클릭그룹내 명시적지연 계산·deadline native예약/취소. 1,098tests/빌드·actualWhale checkpoint1791849167813 원본XML150ms/실제mutedWAV예약 및기존ACK/복원회귀 PASS. root/seq·원본설정/Playerbookmark·제품실행 및 전체인수는 미완료. [범위](../pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 Stage F 후속: 원본cmd/root선언/등록path/hash 대응과 지연준비 API. 1,080tests/빌드·actualWhale 내장1791848744172 원본call 대응/중첩선언거부 및 제품PPTX1791848744061 회귀 PASS. 조건/설정/native bookmark·제품실행 및 전체인수는 미완료. [범위](../pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 Stage F 후속: native수락 뒤ACK대기 취소/동기start교체 격리. 1,063tests/빌드·actualWhale checkpoint1791848414351 실제WAV+bridge/strictDB 합성통합 및 내장1791848397991/제품PPTX1791848397880 회귀 PASS. 원본XML조건/제품Player미디어bookmark 통합과 전체인수는 미완료. [근거](../pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 Stage F 후속: bounded call정규화·native 실행기/취소·늦은성공/토글경쟁. 1,059tests/빌드·actualWhale checkpoint1791848003458 mutedWAV 명령, 내장1791848018631/제품PPTX1791848018527 회귀 PASS. 원본 조건/native bookmark/제품실행 통합과 전체인수 미완료. [근거](../pptx/NATIVE_MEDIA_ACTIONS.md).

2026-10-13 Stage F 후속: 원본shapeSteps→공식groupSteps 정확대응·runtime 엔진수검사/Preflight·Player고지. 1,029tests/빌드·actualWhale 최종내장1791847630526 교사공식12그룹/합성[null,0,null]/제품문구DOM 및 제품PPTX1791847538660 회귀 PASS. 원본시간 의미/native 실행과 전체인수는 미완료. [계약](../pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 Stage F 후속: 원본그룹 완료커서/source-v1 계약·기존계약 혼용거부·무미디어재실행 복원 기반. 1,012tests/빌드·actualWhale checkpoint1791847210123 합성3그룹/재시작factory0 및 제품PPTX1791847220462/foundation1791847220588 회귀 PASS. native미디어action/원본시간 의미→제품 연결은 미완료, 전체인수 체크 유지. [근거](../pptx/SOURCE_GROUP_PLAYBACK.md).

2026-10-13 Stage F 후속: 원본 mainSeq 구조그룹/모델shape 대응·media-only/독립media 보존과 runtime/Player진단 고지. 992tests/빌드·actualWhale 내장1791846625428/제품PPTX1791846625302/foundation1791846465562 PASS. 원본시간·조건/실제미디어트리거 실행은 아직미검증, 전체완성체크유지. [범위](../pptx/SOURCE_ORDER.md).

2026-10-13 Stage F 후속: 원본 cTn 부모/조건참조·반복·역재생/p14trim 분류와 Preflight17숫자, 979tests/빌드·actualWhale 내장1791845740393/제품PPTX1791845808198/foundation1791845808330 회귀 PASS. 실제클릭그룹/원본트리거·clip범위/전체충실도·물리인수는미완료. [근거](../pptx/MEDIA_TIMING.md).

2026-10-13 Stage F 후속: 원본 timing target→등록path→원본관계 bytes SHA256 대응 진단 API·956tests/빌드, 실제Whale 내장1791845299247/제품PPTX1791845299139/foundation1791845299672 회귀 PASS. clip·반복·조건 의미/실행순서·원본trigger 및 전체완성은 미완료. [범위](../pptx/MEDIA_TIMING.md).

2026-10-13 Stage F 후속: 원본 미디어 타이밍 bounded숫자검사·Preflight, 937tests/빌드·실제Whale 합성/교사원본·기존회귀 PASS. 원본트리거 실행과 등록path/조건 의미는 미완료이며 전체단계 체크는 유지한다. [근거](../pptx/MEDIA_TIMING.md).

2026-10-13 Stage F 후속: 내장 WAV/MP4 연결·원본영역수동재생·Remote·교차/새Player/백업/종료·양의crop/ellipse·worker재시작/실패repaint 연속성,파일읽기중revision증가등록까지909tests/빌드·actualWhale1791830114932 PASS. 원본trigger/고급조합·실제10종/PowerPoint기준·물리인수 및 전체Stage 완료는아니다.[근거](../pptx/PLAYER_MEDIA.md).

2026-10-13 내장 미디어 후속: 소유 Blob 추출·등록원본/part/요소경로/자산해시 및 출처 strict 저장/복구 계약 구현.855tests·빌드/실제Whale 합성 WAV·MP4 추출·제품sender등록·metadata복구·기존PPTX/PDF 회귀 PASS. 내장 연결UI/Player 재생·원본영상영역/트리거는후속이며Stage F 전체는미완료다.[계획](2026-10-13-pptx-embedded-media.md).

2026-10-11 진행 증거: Stage B의 실제 PDF Import/중복·원본 참조/독립 렌더/노트/A5-B2-A5 보조 검증 단위 구현. TEST_RESULTS.md 참고. Stage B 전체 및 최종 완성 체크는 유지한다.
2026-10-11 추가: Editor normalized 글상자/판서/가리개·실제 font fit·원본색·undo/redo·draft→저장확인→Player 반영 구현. 로컬 파일 저장/종료/미디어/빠른 진입/Whale 인수 등은 여전히 Stage B 미완료다.
2026-10-11 추가: .wcp.json version1/새 로컬 저장·실제PC 파일read·strict 복원/원본재연결·기존수업보존·발표대기 보조 검증. 실제Whale/종료결과저널·PDF복사본/미디어 등은 남아 Stage B 전체 체크는 유지한다.
- 실제 Whale를 찾지 못해도 코드/합성 파일 실험은 계속하며 외부 blocker를 제품 전체 완료로 바꾸지 않는다.
- 미검증 포맷/기능은 지원으로 표시하지 않는다. PRD에서 검증 후 결정하도록 둔 항목은 근거/제한/대안을 함께 남긴다.
- 커밋/외부 배포는 현재 요청에 포함하지 않는다. 원본/개인정보/권한 경계를 유지한다.
