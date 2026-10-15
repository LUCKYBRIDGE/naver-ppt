# PPTX 편집정보 로컬 백업

2026-10-13 02:18. PRD v5 §14/28, FR-013/014/020.

## 구현
- schema1 `.wcp.json`에 PDF/PPTX metadata·델타·완료 효과를 허용한다. PDF2000쪽/PPTX1000쪽·원본metadata128MB/JSON16MB/strict pose·구조 한도를 적용한다. PPT/SHOW/웹은 복구 허용하지 않는다.
- 저장과 파일 재검증은 원본 수업 ID/revision/request/run을 유지한다. native 원본 handle 키는 제거하고 원본 bytes를 포함하지 않는다.
- Launcher 복구만 새 수업ID/revision0/발표null을 만든다. run/과거request를 제거하고 완료 그룹/pose entries/slideId/documentId/지문을 보존하며, 검증을 통과한 pose.scope의 sessionId/revision만 변경한다. 변경 전 scope/지문/CSS 변조는 거부한다.
- 같은 원본 지문/등록ID를 재연결하고 명시 발표해야 완료 pose가 복원된다. 원본 자동 복제·덮어쓰기 없음.

## 검증
- check2026-10-13 02:16:05: 61파일802tests·TypeScript/Vite/MV3/5스킬 PASS. 신규11개: roundtrip,run/request정지·scope재설정,입력보존,optional이전필드,지문/다른수업/다른쪽/미래revision/CSS/bytes변조,형식별쪽한도.
- 실제 Windows Whale5.39.412.57 headless `verify-whale-pptx-player.mjs` profile1791825423523/result.json·exit0: 제품Editor 저장버튼→nativeOPFS새파일 write/readback→PCJSON→저장파일확인→Launcher파일입력→새수업strictDB/대기Player→같은원본 준비helper재연결→명시ACTIVATE→완료visibility동일. 과거pending제거/완료scope새ID·r0/델타유지/기존수업불변. 기존Remote12클릭/자료복귀/새Player/worker재시작·native취소/실패주입/5viewport·원본SHA256불변/pageerror0 PASS.
- foundation1791825446215/verification-result.json·exit0: PDF백업/재검증/종료/PDF복사본/비공개편집·노트/자동넘김/native muted WAV·합성H.264/소유권/정상재시작 회귀 PASS.

## 제한
- OS save chooser는 OPFS 출력으로 대체한 시험이다. 실제chooser/downloads·비정상crash/물리교실인수는별도.
- PPTX등록·복구후원본재연결은 준비helper이며 일반DocumentImport UI는 아니다. PPTX Editor overlay/노트/내장미디어·충실도연결은별도미완료.
- 원본PowerPoint기준·추가실제9종·PRD전체인수 없이 지원승격하지 않는다. 전체목표active/PPTX unverified.
