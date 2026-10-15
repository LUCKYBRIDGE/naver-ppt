# 원본 순서와 등록 UUID의 모델 대응

2026-10-12 22:39, Stage D/F · FR-004. 일반 PPTX 지원은 아직 unverified다.

## 구현
- `bindPptxSlideModel`은 등록 자료의 PPTX 지문/닫힘/쪽수/고유slideId와 원본 part 목록·Worker 모델을 검사한다. 잘못된 타입·지문·개수·ID·경로·없는 모델은 거부한다.
- `get(slideId)`는 명시적인 등록 ID만 받아 `{slideId, sourcePart, index, slide}`를 반환한다. null/없는 ID를 첫 쪽으로 바꾸지 않는다. descriptor는 freeze, Map은 비공개이며 등록 배열이 바뀌어도 기존 대응은 변하지 않는다.
- 반환 index는 후보 PresentationState 경계에서만 사용한다. 제품 명령/저장은 기존 UUID이며 원본 XML/모델을 세션에 넣지 않는다. 선택쪽은 `skipHidden:false`로 전달하여 원본의 hidden 플래그가 임의로 다른 쪽 선택을 만들지 않도록 한다. 숨김쪽 물리 시험은 후속이다.
- 모델은 기존 guarded/pinned Worker 파서 결과가 전제다. 이 helper는 원본 순서의 내용 일치나 전체 모델 보안 검사를 대신하지 않는다.

## 순서 근거
- 공식 web-ppt0.4.5 parser의 `parser-CJhMJQf-.js`는 presentation sldIdLst의 r:id 관계를 순회한 순서로 각 slide를 파싱한다. 모델 자체에는 원본 part 경로가 없다.
- 실제 Whale Worker에서 원본/순서를 바꾼 합성 PPTX를 각각 파싱했다. 기존 1/2는 제목A/표없음/효과5 → 제목B/표있음/효과0이며, 뒤집힌 2/1은 제목B/표있음/효과0 → 제목A/표없음/효과5였다. sourcePart도 함께 뒤집힘을 확인했다.
- 단순한 count 일치 대신 고유 제목·표·효과 모델이 원본 순서를 따라 움직이는 근거다. 이미지/전환/동일제목·빈슬라이드 전반 및 원본 PowerPoint 충실도까지 증명하지 않는다.

## 실제 등록 경로
- 시험 renderer를 임의 A/slide-1 대신 preparePptxImport가 만든 실제 document/slide UUID·원본 part·모델에 연결했다. 원본 XML의 transform과 공식 엔진의 같은쪽이 대응한다.
- 제품 Editor 등록 ACK → 해당 UUID 활성화 → 소유 Player 효과5단계/strict ACK/DB → 다른자료/복귀 → 새 Player 원본 재파싱/같은UUID/pose복원 PASS.
- 시험 fixture의 official parser wrapper는 15초 timeout/error/messageerror, 모든 종료경로 listener 정리/worker terminate, abandoned 모델 dispose를 공유한다. 제품 후보 의존성은 추가하지 않았다.

## 검증과 제한
- check22:35:16: 52파일687tests·TypeScript/Vite/MV3/5스킬 PASS. 신규 binding 단위17개.
- 실제 Whale5.39.412.57 headless: `verify-whale-pptx-owner.mjs`, 마지막 결과 profile은 TEST_RESULTS.md에 기록한다. 위의 Worker 순서/UUID 효과·새Player 복원과 기존source변경거부·권한/worker재시작/receipt/reset/승계 회귀 PASS. 복원 화면 직접 확인.
- teacher-01: 이번 경로의 실제 Worker 모델23쪽과 등록23개 UUID 대응, 첫/끝 index0/22, 원본hash불변/수업불변 PASS. 원본을 복사·업로드하지 않았다. 등록/모델 대응이며 교사 파일의 이번 화면·효과 재현 완료는 아니다.
- 일반 UI 활성화·역량별preflight, 실제10종/PowerPoint충실도·폰트·물리 교실 인수는 남는다. 등록은 최대2000쪽, 현재 후보 Worker envelope는1000쪽 한도이며 향후 UI는 이 차이를 명시해야 한다.
