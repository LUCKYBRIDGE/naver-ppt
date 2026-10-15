# 제품 PPTX 실험 등록과 비공개 탐색

2026-10-13 02:35. PRD v5 §5/6/7/8/13/14, FR-003/004/008/013/014/015.

## 제품 경로
- Editor의 `PPTX 실험 사용`을 명시적으로 선택하면 기존 자료 입력/native picker에 PPTX를 추가한다. 기본값과 새 수업에서는 PDF만 허용한다. 원본 충실도·내장 미디어·오버레이 편집 미확인을 고지한다.
- `prepareDocumentImport`가 확장자/실험 gate를 검사하고 PDF/PPTX별 원본 vault/검증 경계로 lazy dispatch한다. PPT/SHOW/임의 형식은 거부한다. 신규 PPTX는1000쪽까지, strict 등록 ACK 뒤에 결과를 표시한다. 입력 취소·세션 변경 후 늦은 파싱 결과는 등록하지 않는다. 일부 파일이 이미 등록된 묶음의 취소는 그 자료를 삭제하지 않는다.
- 같은 원본의 추가는 지문으로 재사용하며, 재연결은 선택 자료의 형식/지문을 확인한다. 다른 원본은 기존 델타/세션을 유지하고 거부한다. 원본 자동 업로드·덮어쓰기·영속 bytes 복제는 없다.
- 등록 PPTX Editor는 기존 PDF 전용 OverlayEditor 대신 등록UUID/원본part/지문으로 바인딩한 안전 SVG/ShadowRoot 비공개 미리보기를 사용한다. 원본 준비/선택/ResizeObserver/취소/자산수명을 분리한다. 종료자료도 clone한 비공개 모델만 열며 세션을 재활성화하지 않는다.
- Editor 페이지와 노트는 발표 선택과 독립이다. 현재 미리보기는 효과/내장 미디어를 실행하지 않고 노트를 렌더러에 포함하지 않는다. 노트 저장은 기존 strict 명령/델타에 저장하고 Player 공개 snapshot에서 제외한다.
- PPTX overlay 편집은 아직 제공하지 않는다. PDF 도구를 PPTX에 잘못 열거나 동작한다고 표시하지 않는다. **PPTX Player 오버레이 표시와 Editor 오버레이 편집·원본색 샘플링은 다음 필수 구현**이다.

## 검증
- check2026-10-13 02:30:29:62파일814tests·TypeScript/Vite/MV3/5스킬 PASS. 신규12개: 공통Import gate/형식별dispatch/abort/원본vault/reconnect/nativepicker·등록preview UUID/지문/자산해제·1000쪽한도.
- 실제 Windows Whale5.39.412.57 headless, profile1791826400096/result.json·exit0 PASS. 제품 dist만 복제했으며 seed/helper bundle을 제거했다. 실제 Editor UI로 원본 입력/opt-in 거부→승인등록/중복재사용/PDF현재선택·Canvas픽셀불변, 변경원본거부/수업불변, File 읽기를 명시적으로 보류→취소→늦은결과등록없음 확인. 보류는 검증 계측이며 원본 파일 변경이 아니다.
- 같은 실행에서 등록UUID 비공개 6쪽 탐색/노트저장→현재3쪽의 완료효과visibility 유지·공개snapshot 노트비노출. Editor/Remote/Player 각각5viewport 무가로넘침·Editor380캡처직접확인.
- helper 없이 Editor 원본등록→Remote 원본12클릭효과/strict checkpoint·과거pending보류·worker재시작·native취소/실패재요청→저장파일검증/Launcher복구→제품UI 같은원본재연결→명시발표·완료화면복원/기존수업불변/원본SHA256불변/pageerror0 PASS.
- foundation1791826254333/verification-result.json·exit0:기존PDF/편집·노트/로컬저장·종료/PDF복사본/자동넘김/native muted WAV·합성H.264/소유권·정상재시작 회귀PASS.
- 첫시험의 캔버스선택자중복은 원본Canvas aria-label로좁혔다. 취소계측400ms지연이클릭전에끝난경우는명시적보류/해제로바꿔검증했다.

## 남은 필수 범위
- PPTX overlay Editor/Player 연결, 원본색과폰트·내장미디어/고급동작·전환/정밀Preflight.
- 원본PowerPoint기준충실도·추가실제9종/실제10종비교, 성능/오프라인인수, 물리모니터·IME/touch/스피커/OSchooser/downloads/비정상crash.
- 저장시험의picker는OPFS 새출력대체다. 일반 입력은native file input으로PC원본을읽었지만OSchooser물리조작근거는아니다.
- **PPTX unverified**, 명시적실험경로만활성화. 전체PRD목표active이며StageF/전체제품완료로표시하지 않는다.
