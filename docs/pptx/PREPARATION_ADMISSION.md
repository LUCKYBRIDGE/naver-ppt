# PPTX 준비 입장 제어

PRD v5 §6/11/16/24/28/30·FR-003/008·IMPL-T-28. [계획](../plans/2026-10-14-pptx-preparation-admission.md). 현재 발표를 유지하면서 여러 자료·창의 무거운 준비 작업이 겹치지 않도록 한다. 완료 모델의 전체 byte 예산과 단일 자료 성능 인수는 별도다.

## 실행 계약

`preparationAdmission.ts`는 같은 extension origin의 고정된 Web Locks 이름으로 exclusive 준비 gate를 요청한다. 자료명/파일명/세션 ID를 lock 이름에 넣지 않는다. API가 없으면 읽기/Worker를 시작하지 않고 실패한다. 조용한 동시 실행 fallback은 없다.

source의 새 pending job, 신규/재연결 등록, 원본 파일 점검, SourceVault 재연결의 원본 해시 읽기에 연결했다. 등록 내부의 도형 효과 점검은 이미 입장한 작업 안에서 실행하며 잠금을 다시 요청하지 않는다. 이미 준비된 같은 File의 source lease는 gate를 잡지 않는다. 현재 발표/ready source/Blob은 폐기하지 않는다.

대기 중 취소는 Native request의 signal로 제거하고, 입장 직전에도 signal을 확인한다. 실행 중 취소는 callback의 실제 완료까지 slot을 유지한다. 취소 불가능한 File 읽기의 결과가 전달되기 전에 다음 job을 시작하지 않는다. source 소비자의 취소 응답은 기존 waiter 경계에서 즉시 처리하고, 마지막 소비자만 작업 controller를 취소한다. 늦은 결과와 실패는 기존 소유권/폐기 계약을 따른다. 준비 창을 닫으면 브라우저가 그 context의 native gate를 해제한다.

SourceVault validator는 fingerprint만 반환하고 해시 읽기의 private scratch를 소비한다. DB/RPC·영구 원본 복제·권한/의존성·품질/재생 정책은 바꾸지 않았다. 현재 SourceVault.get에는 signal 계약이 없어 **validator의 대기 자체는 사용자 취소로 제거할 수 없다.** source/등록/점검의 취소 가능한 요청과 구분한다. 이 제한과 활성/대기 모델의 byte 예산은 후속이다.

## 검증

Windows/Whale5.39.412.57 headless 격리 프로필. 실제 근거는 ignored `node_modules/.cache/` 아래다. 읽기 전용 교사 원본은 변경하거나 외부로 보내지 않았다.

| 검사 | 결과 |
|---|---|
| check18:56:38 | exit0,100파일/1,395tests·TypeScript/Vite/MV3/5스킬PASS. 신규8개: exclusive/native options·preabort·API부재·queued 취소/입장 직전 재검증·active read 실제 완료까지 예약·실패 재요청·granted lock 부재. 기존 source/import/inspection 단위는 gate를 명시적으로 대역 처리해 그 경계의 기존 계약을 검사한다. |
| whale-pptx-source-sharing/1791972551721/result.json | 최종PASS. 실제 popup창2개/서로 다른File객체/nativeWorker/WebLocks. source·등록·원본점검·identity 모두queued 읽기0/Worker0, 취소 가능한3종의queued 취소/재시도, active 읽기 결과 전달까지 예약, malformedZIP 실패 뒤 후속 입장, owner창닫힘 뒤입장, API부재 읽기0/Worker0, ready owner/현재PDF·수업/원본hash 보존. 외부0/pageerror0. productRendering=false이며 원본 렌더 충실도 시험이 아니다. |
| whale-prepared-scene/1791972236337/result.json | PASS. 정상 준비·현재PDF/음원·취소/실패/누락·worker/ACK유실·닫힌 명시 쪽·직접 명령 거부. |
| whale-pptx-embedded-media/1791972236491/result.json | exit0. actual native WAV/MP4·동일DOM/crop/rotation/효과·source5 타이밍·metadata실패/취소·worker/교체Player·백업/원본보존/외부0/pageerror0. |
| whale-pptx-player/1791972551567/result.json | exit0. 실제교사23쪽/12효과·private/draft/overlay·worker/새Player·응답실패·백업/재연결/5화면·원본보존/pageerror0. |
| whale-foundation/profile-1791972605104/verification-result.json | PASS. PDF 저장/확인/복사본/종료·owner/worker·WAV/MP4·자동넘김·정상재시작. OSchooser/물리모니터/가청출력 등은 별도다. |
| whale-pptx-entry-limit/1791972762706/result.json | **성능FAIL**. 전체 WorkingSet 최대1,794,793,472bytes로 기존1.5GiB 초과. parser1/MP3읽기1·등록/표본화면/실제muted재생·정지/PDF복귀·원본두hash불변·외부0/pageerror0은 작동. gate로 단일 자료 성능을 해결했다고 하지 않는다. |

초기 admission1791972109118은 기본두창/취소/닫힘PASS였다. 추가 malformed입장 검사1791972322887은4바이트의잘못된헤더가전체File읽기보다앞에서거부돼,읽기hold를기다리는시험가정에서timeout했다. PK헤더/64바이트의실제invalidZIP File로바꿔실제읽기·ZIP실패 뒤release를최종확인했다. 제품guard를약화시키지 않았다.

교사 회귀 첫1791972236334는후반 효과버튼disabled timeout으로실패했다. gate가원인인지는확인되지 않았다. `player-restored.png`,overlay/preview 캡처와도구출력실패를보존했다. 실패시 gate점유/효과status·preparation의숫자/일반문구만failure.json에기록하도록verifier를보완한1791972551567은전체PASS여서원인은재현되지않음/미확정이다. 이재시도를제품수정에의한회귀해결로보고하지않는다.

## 남은 인수

gate는같은origin의동시준비 job수만제어한다. ready/현재/대기 모델·원본·native미디어의누적량, SourceVault대기취소, 긴준비/통신경합의UIdeadline과물리교실·장시간/coldoffline는남는다. 실제교사10종(현재2/PDF1)·원본앱기준환경의Visual/Media/Behavior·최종renderer선정·지원승격·PDF대안/QuickLaunch/legacy/web·PRD Stage A~G 전체 인수목표를유지한다. 원본/기존변경보존,커밋·배포·파괴적작업없음.
