# web-ppt Worker 파싱 결과

## 범위와 구현
- X-04 / SPIKE-T-04, 2026-10-12. Windows Whale5.39.412.57 headless, 고정 @web-ppt/core0.4.5 공식 worker.js/parseInWorker 경로. 제품 채택이 아닌 격리 후보 실험이다.
- `workerEnvelope.ts`가 반환 envelope의 양수 id, 모델 크기, 1~1000쪽/최상위 요소10만개, 자산4000개/개별32MB/합계256MB와 ArrayBuffer/MIME 문법을 검사한다. 빈 자산은 거부한다. MIME 안전 허용표·모든 중첩 요소 schema 검사가 아니며 package/XML/미디어/SVG 검증을 대체하지 않는다.
- 공식 Worker를 로컬 Vite bundle로 감싸 반환 전 검사와 고정 오류 코드를 적용했다. DOM/DOMParser가 없는 Worker에서 파싱하고 자산 ArrayBuffer를 transfer한다. 공식 API가 본 화면에서 Blob URL을 생성하고 dispose로 해제한다.
- 파서 실행은 기본15초 제한, 취소/실패/성공 모두 terminate한다. timeout/취소 때 공식 API의 남은 message listener도 제거한다. 취소 뒤 늦게 생성된 모델은 dispose한다. 원본 입력은 공식 API 내부에서 사본으로 transfer하며 원본 보존을 시험했다.
- 라이브러리 package.json의 sideEffects는 core.js만 선언해 정적 import된 worker.js가 초기 bundle에서 제거됐다. 선택 resolveId 설정도 보존에 실패했다. **실험 Worker bundle에만 treeshake:false**를 적용해 공식 초기화를 유지했다. 결과133464bytes, 실제 초기화/경계의 onmessage 할당2개를 빌드 assert한다. 제품 bundle 설정/패키지 원문은 변경하지 않았다.
- 최초 ready 시험은 완료 응답과 같은 id를 보내 라이브러리가 실패로 해석했다. ready 신호의 id를 제거해 실제 CPU 지연 구간을 관측한 뒤 timeout/취소를 검증했다. 초기 run.failure도 비정상 종료 코드로 나오도록 전체 스크립트 assert를 보강했다.

## 실제 웨일 결과
- teacher-01 profile1791762488028:23쪽, 최상위요소145, 자산81개/5884884bytes. 본 화면 파싱과 Worker의 쪽별 요소·효과 요약이 같고 모든 자산의 MIME/byte/SHA256도 같았다. Worker의 document/DOMParser는 모두 false였다.
- Worker 모델을 실제 렌더/효과 실행에 사용해 기존23쪽 이미지 decode·12클릭·재진입/취소·완료2단계 복원/재시작을 통과했다. 복귀 스크린샷에서 처음2항목만 표시하는 것을 직접 확인했다. teacher 원본 hash불변/외부0/SVG 공격6개 거부 유지.
- canonical media profile1791762482260:3쪽/최상위요소9, 자산5개/192105bytes. 본 화면 모델·모든 자산 hash 일치. Worker 자산으로 WAV/MP4 정확hash·native muted재생/영상320×180 붉은/흰 픽셀·문맥전환pause/수동대기복귀 PASS. 기존 canonical hash 동일.
- 두 profile 모두 실제 stall Worker가 ready 이후 CPU 무한 루프에 들어갔다. 시험500ms timeout과 ready 후50ms abort 시 종료, 메인5ms interval은 각각 teacher100/15회, media100/16회 진행했다. 각 timeout/취소의 잔여 공식 message listener1개 제거. 손상5bytes 입력은 고정 오류로 거부하고 종료했다. 정상2회·timeout·취소·손상 입력 총5개 Worker가 모두 terminate됐다.
- 자동 회귀23개 추가. check08:47:15:41파일420tests/TypeScript/Vite/MV3/프로젝트5스킬 PASS. 기존 입력 package guard/관계/콘텐츠 검사를 유지했다.

## 판정
- web-ppt의 이 두 샘플은 DOM 없이 Worker 파싱/자산 반환이 가능하다. aiden model Worker의 DOMParser 실패와 다른 결과이며, office 정적 Worker 결과와 함께 후보 선택 근거로 쓴다.
- 기본15초 제한 전체를 기다린 시험은 아니며 강제 지연 시험은500ms로 실행했다. 실제 대용량/메모리 상한·모든 문서의 무응답·절전/프로세스 crash 안정성을 증명하지 않는다.
- 본 화면 parser는 대조 기준으로 한 번 실행한다. XML 안전 검사·Blob 생성·SVG DOM/폰트/렌더링은 여전히 본 화면에서 실행한다. 전체 import/렌더가 메인 화면에서 무차단이라고 주장하지 않는다.
- 제품 Session/Player/revision·복구와는 미연결. 원본 PowerPoint 시각/폰트·고급효과·실물10종·실제 스피커/모니터는 남는다. **PPTX 제품 지원은 unverified 유지**한다.

## 재현
- 기존 `verify-whale-webppt-spike.mjs` teacher 절대경로 또는 --media 명령에 Worker 검증이 포함된다. 고정 후보 tarball/추출물과 합성 media cache가 필요하다. 경로는 DEVELOPMENT.md를 따른다.
- 원본 사용자 파일은 메모리 route로만 제공한다. 결과 JSON에는 모델 내용/원문 예외/URI 대신 개수·hash·고정 오류 코드만 남긴다. 스크린샷/번들은 ignored cache 안에만 있다.
