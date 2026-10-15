# PPTX 직접 전환 입장 차단

- 기준: PRD v5 §6/8/11/16/24/28/30, FR-004/005/008, IMPL-T-28.
- 구현: `src/background/sessionHub.ts`. 직렬 처리 큐 안에서 저장된 대상 형식을 읽고 PPTX의 ACTIVATE_DOCUMENT/GOTO_SLIDE/REOPEN_DOCUMENT를 PRESENTATION_PREPARATION_REQUIRED로 거부한다. ADVANCE_AUTOPLAY는 실제 현재 발표 자료가 PPTX일 때 같은 방식으로 거부한다. PDF 경로와 core 내부 COMMIT 원자 전환은 유지한다.
- 거부는 세션/receipt/pending/발행을 바꾸지 않는다. 늦은 revision이나 이전 raw receipt도 입장 허가로 재사용하지 않는다. 기존 형식/schema/원본/권한/의존성 변경 없음.

## 검증 경계와 결과

2026-10-14 Windows / Whale5.39.412.57 headless 격리 프로필. 아래 경로는 ignored node_modules/.cache 아래이며 모두 실행 종료. 원본 bytes/본문/교사 노트는 외부 전송하지 않는다.

| 실행 | 판정 |
|---|---|
| check09:35:17 | PASS. 96파일/1,356tests·TypeScript/Vite/MV3/5스킬. 신규5개는 실제 strict IndexedDB의 raw3종/닫힘·이전receipt/늦은revision·pending 불변/COMMIT/PPTX자동넘김/PDF·없는 대상을 검사. |
| whale-pptx-degradation/1791938154481/result.json | PASS. 미지원 쪽의 직접3종 거부와 PDF 픽셀/세션 불변. 정상 UI의 준비/취소·늦은 결과·정상 쪽 승격/미지원 이전 쪽·5 화면 회귀. directCommandAdmissionVerified=true. |
| whale-prepared-scene/1791938154353/result.json | PASS. 실제 pending 중 raw3종 거부·pending/발표 유지, 실제 소유 Player의 PPTX ADVANCE_AUTOPLAY 거부. 동일 음원/PDF·worker·응답 유실·누락/재연결/닫힌 명시 쪽 회귀. |
| whale-pptx-player/1791938154371/result.json | PASS. teacher-01 23쪽/12효과·비공개 편집/overlay·새 Player/worker/백업·5 화면. PPTX 정상 전환은 Remote UI/Player 준비로 이행. |
| whale-pptx-embedded-media/1791938154506/result.json | PASS. WAV/MP4/native·5 source그룹/cursor·동일 요소/승격 play0·저장/닫힘. 최초/복귀/복원/다른 시험 수업도 정상 Remote 요청으로 이행. |
| whale-foundation/profile-1791938264552/verification-result.json | PASS. PDF 전환/저장/복사본/종료/owner·음원/영상/자동 넘김·정상 재시작. |
| whale-presentation-transition/1791938265086/result.json | PASS. 공개 투영/역할/owner·worker/취소·수동확정/닫힌 명시 쪽/새 backup 수업 계약. parser 보류/수동 COMMIT 시험이며 실제 준비 인수와 구분. |
| whale-pptx-owner/1791938303677/result.json | PASS. owner·worker·늦은 checkpoint·교체/모델/원본hash. 전환은 시험 준비 consumer를 보류하고 수동 REQUEST/COMMIT한 계약 범위이며 자체 렌더러 probe를 사용한다. 일반 제품 준비 완료 근거가 아니다. |
| pptx-checkpoint/1791938332627/result.json | PASS. 실제 Whale localhost strict DB/native muted WAV·restart/cursor·늦은결과 계약. REQUEST/COMMIT 이후 revision/receipt7 일치. MV3/실제 PPTX 렌더 증거가 아니다. |

`scripts/presentation-ui.mjs`는 정상 Remote의 버튼을 누르고 durable 공개 결과를 명시 await/poll한다. `scripts/presentation-contract.mjs`는 메타데이터/owner 시험 전용 consumer 보류/수동 확정이며 실제 준비를 대신하지 않는다. 제품에 시험 우회 권한·전역 플래그를 추가하지 않았다.

초기 신규 DB fixture의 revision4 create와 TypeScript discriminated union 구성 오류를 수정한 뒤 전체check가 통과했다. 과거 checkpoint 시험은 Player ACK를 teacher 응답으로 가정하고 revision/receipt5를 고정해 두 번 실패했다. 공개/비공개 응답을 구분해 다시 조회하고 새 요청/확정의7회 저장을 확인한 뒤 통과했다. owner 시험의 오래된 기본iife Worker 빌드도 ES module/고정 parser patch로 수정했다. 기존 실패 프로필/출력을 지우지 않으며 성공으로 세지 않는다. 반복 실패는 시험 가정과 현재 계약의 차이로 분석해 프로젝트 코드/시험에서 해결했다.

## 대용량 성능 실패와 다음 작업

teacher-02 실제52쪽/98,050,517bytes와 기준PDF를 정상 Remote/Player 준비 경로로 시험했다. 두 실행 모두 등록/일부 화면/57MB MP3 연결·실제 muted 재생/정지·PDF복귀·Editor 추적자산0·원본hash 불변·외부0/pageerror0은 작동했다. 그러나 전체 시험 브라우저 프로세스의 WorkingSet64 표본 합이 기존1.5GiB 실험 기준을 초과해 전체 실행 exit1/pass=false다.

| 실행 | 표본 최대 |
|---|---:|
| whale-pptx-entry-limit/1791938333066/result.json | 1,640,394,752bytes |
| whale-pptx-entry-limit/1791938439233/result.json | 1,620,353,024bytes |

두 번째 실행은 단순 재시도가 아니라 단계/CDP 관측을 추가했다. 첫 쪽 확정 후 약1.47GB, 미디어 쪽 확정·음원 재생/정지·PDF 복귀 근처 마지막 표본1.62GB였다. 표본 최대는 단단한 peak가 아니며 단계의 JSHeap 수치는 CDP target에서 얻었으나 Editor/Player가 같은 renderer process를 공유해 동일한 값일 수 있다. 이를 창별 독립 메모리나 누수 확정으로 해석하지 않는다. GC 강제·예산 상향·원본 화질/음질 저하로 통과시키지 않았다.

다음은 준비 native preload=auto의 대용량 전체 버퍼링, media hash/metadata 재검사와 Blob 소유권, 현재/목표 동일 File source 공유 및 해제 후 retained 메모리를 구분해 측정한다. 필요 구간만 준비하되 재생 가능 상태와 첫 화면 충실도·원본을 보존하는 자원 예산/해제 정책을 설계·검증한다. 전역 모델/미디어 메모리 상한은 아직 없다. 이 실패가 있어 계획5/PRD 성능 및 제품 전체 인수는 계속 미완료다.

대안 PDF 연결, 지문/취소·확정 경합/장기 통신 복구·실제10종/PowerPoint 기준/물리/장시간/cold offline·Stage A~G 나머지 인수도 유지한다. PPTX 전체 지원 등급을 승격하지 않는다.
