# PPTX 선택 자료 수명과 미디어 검증 재사용

- 기준: PRD v5 §6/11/16/24/28/30, FR-004/005/008, IMPL-T-28. [계획](../plans/2026-10-14-pptx-preparation-memory.md).
- 결과: 실제 teacher-02의 Editor 페이지 탐색에서 presentation 파싱4회→1회, 같은57MB MP3 전체읽기3회→1회. 원본/재생/편집 경계를 유지했고 두 수정 후 메모리 표본은 기존1.5GiB 실험 기준 안이었다. 전역 메모리 상한·hard peak·저사양/장시간·전체 성능 인수는 아니다.

## 원인과 구현

시험 전용 `scripts/media-memory-observer.mjs`가 File/Blob 읽기 크기·횟수, Worker mode, URL 추적 bytes, native 이벤트/preload/readyState/buffered를 숫자로 기록한다. 이름/URL/자료 본문은 기록하지 않는다. 제품에 관측/텔레메트리를 추가하지 않았다.

이전 결과1791938834124에서 같은98MB File을 Editor가5회 읽고 presentation Worker4회를 실행했다. Player는1회였다. Editor의 OverlayEditor 쪽별 key가 미리보기를 재마운트하면서 마지막 source lease를 해제했다. `usePptxDocumentSource.ts`가 현재 선택한 PPTX자료 하나의 source lease/같은 File을 유지하고 `RegisteredPptxPreview`에 전달한다. 페이지별 overlay draft 초기화는 그대로다. 자료/수업/지문·등록쪽 집합 변경/창닫기는 해제하며 늦은 성공/취소는 dispose한다. 다른 자료에서 돌아올 때 이전 ready 상태를 재사용하지 않는다. 모델 준비 전 내장미디어 연결을 잠가 동시 중복 파싱을 피한다. 초기 PDF는 PPTX 모델을 로드하지 않는다.

같은 guarded Blob을 등록/원본 설정 점검에서 각각 File로 만들고 metadata probe가 재hash하던 경로도 확인했다. `embeddedMedia.ts`는 같은 Blob의 성공한 File/identity Promise를 WeakMap으로 공유한다. `media/input.ts`는 같은 immutable File의 성공한 signature/hash 숫자만 재사용한다. 후보 전체의 모델/쪽/지문/관계/소유권·개수/총크기/종류 검사는 매번 유지한다. 다른 File/Blob·바뀐 형식/크기·실패는 재검증하며 반환 metadata는 복사한다. 한 소비자 취소가 다른 소비자를 취소하지 않는다. rawbytes/파일명·지문별 전역 캐시/영속 복제/추가 권한은 없다. native metadata/길이/코덱 검사는 계속 수행한다.

긴 MP3는 loadedmetadata 시점에 이미 전체3547.92초 buffered를 보고했다. loadeddata 뒤 preload 변경이 메모리를 줄인다고 단정하지 않았고 native 재생/preload 정책을 바꾸지 않았다. Blob buffered는 실제 전체 PCM decode 크기의 증거가 아니다.

## 검증과 한계

Windows / Whale5.39.412.57 headless 격리 프로필. 아래는 ignored node_modules/.cache 경로. 자동검증09:58:24 exit0 **97파일/1,362tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규6개는 문서 owner/순차 view 해제·동일 File identity와 복사/형식·크기/실패 재검증·동일 Blob 소유권/다른 Blob·취소 격리/실패 Promise 재시도를 검사한다.

| 실행 | 결과 |
|---|---|
| whale-pptx-entry-limit/1791938834124/result.json | 관측 추가 후 FAIL, 표본1,613,365,248bytes. Editor parser4/MP3읽기3과 Player parser1·긴 native buffered 확인. |
| whale-pptx-entry-limit/1791939042121/result.json | 문서 lease만 수정한 중간 실행 FAIL,1,700,364,288bytes. parser1은 확인했지만 MP3읽기3이 남아 성능 완료로 세지 않았다. |
| whale-pptx-entry-limit/1791939374011/result.json | identity 재사용 추가 후 PASS,1,600,827,392bytes(약1.49GiB). parser1/MP3읽기1·등록/표본쪽/native muted 재생·정지/PDF복귀·추적Editor자산0·원본hash불변·외부0/pageerror0. |
| whale-pptx-entry-limit/1791939705851/result.json | 최종 Editor 준비 잠금 코드 포함 PASS,1,581,264,896bytes(약1.47GiB). 같은 parser1/읽기1/음원·복귀/보호·해제 조건 확인. |
| whale-pptx-embedded-media/1791939613889/result.json | PASS. 취소/metadata오류/재연결·WAV/MP4·native/효과 공존·source5그룹/완료cursor·준비 DOM/native 동일성·승격 play0·백업/닫힘. |
| whale-prepared-scene/1791939760176/result.json | PASS. 직접 우회 거부/pending·현재 PDF/음원 유지·worker/ACK 유실·누락/재연결·닫힌 명시 쪽. |
| whale-pptx-degradation/1791939760290/result.json | PASS. 미지원/취소·늦은 결과/직접 명령 거부·현재 화면과 정상 쪽·5 화면. |
| whale-foundation/profile-1791939760310/verification-result.json | PASS. PDF저장/복사본/종료·owner/worker·WAV/MP4/자동 넘김·정상 재시작. |
| whale-pptx-player/1791939760177/result.json | PASS. 실제23쪽/12효과·독립 편집/노트/overlay draft·원본 변경 거부/재연결·worker/새Player/백업·5 화면. |

중간 내장 시험1791939042053은 관측 JSON에서 동일 native video가2.134767초 자연 종료돼 paused 기대가 실패했다. 대용량 동시 실행을 끝내고 독립 회귀로 확인했다. 그 뒤1791939511285의 기존 File read 오류 주입은 성공 identity 재사용 때문에 실행되지 않아 대기 실패했다. 실제로 계속 수행하는 native metadata 오류를 주입하도록 시험을 변경하고 최종1791939613889가 통과했다. 캐시 실패/다른 File의 재읽기는 단위시험으로 별도 확인했다. 초기 optional File prop의 exactOptionalPropertyTypes 오류도 수정 후 최종check PASS.

WorkingSet은 시험 브라우저의 CDP process ID별 표본 합이며 hard peak가 아니다. heap 값은 공유 renderer process에 대해 같을 수 있고 창별 독립 메모리/누수 확정으로 해석하지 않는다. 기준 상향/강제GC/원본 축소·재인코딩·화질/음질 저하 없이 측정했다. 이전 FAIL은 보존한다.

남은 일은 다중 자료/창·동시 parse의 실제 전역/창별 자원 예산과 pressure 거부·해제, 빠른 재연결/미리보기 종료 수명, 장시간·cold offline·실물10종/PowerPoint 기준 Visual/Media/Behavior·물리·대안PDF/나머지 Stage A~G 인수다. renderer 최종 채택이나 PPTX 전체 supported 승격으로 해석하지 않는다.
