# PPTX 등록 준비와 원본 순서

2026-10-12 22:30, Stage C/D/F · FR-004. 일반 PPTX UI와 renderer 지원은 아직 미활성이다.

## 구현과 경계
- `slideOrder.ts`는 `ppt/presentation.xml`의 `sldIdLst`를 읽고 presentation 관계의 내부 slide Target을 연결한다. ZIP 파일명 정렬이나 추정 페이지 수를 쓰지 않는다.
- 1..2000쪽, 256..2147483647 원본 sldId, ID/관계/대상 중복, 외부·다른 종류·없는 관계, 경로 이탈, slide XML root/namespace·UTF8/DTD·크기 한도를 검사한다.
- `preparePptxImport`는 File/header/SHA256 → isolated ZIP → 전체 XML/관계/콘텐츠타입 → 원본 순서 검사 후 자료·슬라이드 UUID와 metadata를 준비한다. 세션은 변경하지 않는다. 원본은 기존 전용 vault에만 연결한다.
- 동일 지문 재사용/명시 재연결은 기존 document/slide ID·델타·발표/편집 선택·checkpoint를 그대로 유지한다. 이번 파서 재실행 근거는 없으므로 pages unknown이다. 내용이 다르거나 참조 저장 실패면 등록 성공을 반환하지 않는다.
- registrationPreflight는 PDF/PPTX를 구분한다. PPTX XML에서 확인한 개수는 원본 화면 재현·미디어·효과·재시작 오프라인 성공이 아니다. 결과는 메모리용이며 Session/Player/백업에 추가하지 않는다.
- UI가 연결될 때도 REGISTER_DOCUMENT의 strict ACK 전 성공 고지를 하지 않는다. parser/renderer 개수와 원본 순서의 대응 검사 및 역량별 고지가 후속이다.

## 근거
- check 22:28:35: 51파일670tests·TypeScript/Vite/MV3/5스킬 PASS. import 경계 mock 단위9개와 PPTX fast preflight1개 추가. 첫 typecheck의 exactOptionalPropertyTypes 오류는 undefined signal 필드를 생략하도록 수정했다.
- 실제 Whale5.39.412.57 headless owner1791811787600: 합성2쪽 등록 준비 → 실제 Editor sender REGISTER_DOCUMENT ACK/DB 일치, 같은 원본 재연결 시 같은 ID PASS.
- 실제 DOMParser에서 manifest 순서2/1 변경을2/1로 읽음. 중복ID/중복링크/없는쪽/외부/관계종류/경로이탈/빈목록/범위밖ID/잘못된namespace9가지 모두 거부.
- 기존 실제 source 채널/재해시/5효과·runtime ACK/DB/A/B/A·새Player재파싱pose/잘못된source거부·수업불변/owner·worker재시작 회귀 PASS.
- 사용자 제공 teacher-01 원본을 로컬 file input으로 읽어 등록 준비23쪽/23고유ID, SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 확인. 준비 전후 제품수업불변, 원본파일검증후hash불변. 원본 복사·업로드 없음, 보고서에 파일본문/노트 없음.
- 시험 확장 URL fetch 전달이2회실패해 경로를 재분석하고 로컬 파일입력으로 전환했다. native chooser 시험은 아니다.

## 재현과 미실시
기존 [Runtime Renderer](RUNTIME_RENDERER.md)의 준비/명령에 마지막 인자로 teacher-01의 로컬 파일 경로를 추가한다. 마지막 인자 없이 합성 검증만 실행할 수도 있다.

```powershell
node scripts/verify-whale-pptx-owner.mjs <Playwright-index.mjs> <Whale.exe> <teacher-01.pptx>
```

일반 제품 import/Player UI, 실제 teacher-01의 이번 등록 경로 화면/효과 재현, PowerPoint 기준 충실도/추가9종, 물리 창/OSchooser/DPI/핸들은 미실시다. PPTX unverified와 전체 완성 목표를 유지한다.
