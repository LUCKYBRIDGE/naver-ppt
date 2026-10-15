# 모델 기반 사전 검사와 제한 고지

2026-10-12 22:45, Stage C/D · FR-004. 일반 PPTX UI/지원은 아직 미활성이다.

## 구현
- `modelInspection.ts`: 모델 전체의 그룹 자식까지 방문해 대체 요소/미확인 종류·미디어·효과 쪽/개수·전환·숨김쪽의 숫자만 반환한다. 원본 텍스트/URL/노트/label을 보고서에 복사하지 않는다.
- 최대1000쪽/100000요소/100000효과/쪽당5000효과/그룹32계층, 순환·빈값·잘못된 배열·희소 효과 배열은 거부한다. 요약은 모델 의미 검증이나 실제 재생 검사가 아니다.
- `pptxModelPreflight`: 등록지문/ID/원본part/모델 대응을 확인한 후 원본XML 타이밍·전환·외부관계 요약과 모델 수치를 구분한다. 기존 PreflightReport 형식/전체문서 scope를 사용하나 실제 Canvas/SVG 전페이지 렌더 결과는 아니다.
- model 항목의 pass는 등록/모델 개수·순서 경계만 의미한다. 대체 요소/효과/전환/미디어/숨김/외부참조 발견은 warning, 미발견은 unknown이다. 모델에 없는 원본 내용/폰트/이미지·PowerPoint 일치와 실제 소리/동작·cold offline은 unknown으로 유지한다.
- 외부 주소와 위험 참조를 실행하거나 지원되는 기능으로 승격하지 않는다. 결과는 메모리용이고 세션/백업/Player projection에 넣지 않는다. 현재 통합검증용 renderer 객체에서만 확인하며 일반 UI는 연결하지 않았다.

## 검증
- check22:44:05: 53파일702tests·TypeScript/Vite/MV3/5스킬 PASS. 신규15개: nested counts/비노출·잘못된입력·희소배열·한도/순환/깊이·미발견unknown/원본효과와모델불일치warning·지문/요약검증.
- 실제 Whale5.39.412.57 headless owner1791812610053: 실제 합성 Worker모델/5효과의 preflight는 model만pass, animation warning·충실도 unknown. 기존등록UUID/runtime DB/자료복귀/새Player·source변경거부·owner·worker재시작 회귀 PASS.
- teacher-01 실제 Worker 모델:23쪽/174요소/대체0/미확인종류0/모델미디어0/효과4쪽12개/전환0/숨김0. 원본타이밍4쪽·모델효과4쪽12개는warning, 대체/미디어미발견은unknown이며원본부재/충실도성공으로해석하지않았다.
- teacher-01 원본hash불변/수업불변 유지. 파일본문/노트/주소는보고서에없다. 이번단계는화면변경없음, UI/브라우저실제검증은격리확장경로에한정한다.

## 남은 작업
- 일반 Editor preflight/import/Player UI 연결과원본별역량검증. 기존 `checkPreflight`의 PPTX 분기는아직unknown이고이함수로자동교체하지않았다.
- parser가실패쪽을unsupported label로대체하는경우도warning이므로제품재생정책에서원본손실/추가검사대안을고지해야한다. 대체0은누락0증거가아니다.
- 실제10종/PowerPoint기준·폰트·미디어트리거/물리창/OSchooser/DPI·완전offline 인수는미완료. 전체목표/PPTX unverified 유지.
- 재현은 [Model Binding](MODEL_BINDING.md)의 owner verifier와teacher-01 선택인자를사용한다.
