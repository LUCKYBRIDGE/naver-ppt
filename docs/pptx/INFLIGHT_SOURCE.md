# 진행 중 동일 File 준비 공유

- PRDv5 §6/11/16/24/28/30·IMPL-T-28. [계획](../plans/2026-10-14-pptx-inflight-source.md).
- 구현은 `src/adapters/pptx/sourceModel.ts`의 같은 실행 창/같은 immutable File 객체에만 적용한다. 이름/지문만 같은 다른 File·다른 창의 공유나 전역 메모리 상한은 아니다.

## 수명 계약

ready source에 더해 pending source WeakMap을 사용한다. 작업 AbortController는 소비자 signal과 분리한다. 동시에 들어온 소비자는 같은 read/guard/package/model Worker를 기다린다. 한 소비자 취소는 그 소비자만 즉시 거부한다. 마지막 waiter 취소는 pending 입장을 제거하고 작업을 abort한다. 실패/취소 promise는 새 요청을 막지 않는다.

완료 때 live waiter 수만큼 lease를 먼저 예약해 다른 소비자의 취소/해제가 아직 결과를 받지 못한 소비자의 자산을 폐기하지 않게 한다. 성공한pending입장은ready발행전에제거해,결과전달직전전체취소로폐기된자산을새요청이재사용하지않게한다. 마지막 lease만 자산을 dispose하고 ready입장을 제거한다. 모두 취소한 작업의 늦은 성공은 dispose한다. 새 요청의 ready입장과 이전작업 cleanup은 객체 일치로 구분한다. signal listener는 완료/실패/취소에 제거한다. bytes/모델/notes를DB/backup에 저장하지 않고 기존 package/원본hash/모델 guards를 모두 수행한다.

## 증거

Windows/Whale5.39.412.57 headless 격리 프로필. 결과는 ignored node_modules/.cache 아래이며 원본은 읽기 전용이다.

| 실행 | 결과 |
|---|---|
| 최종check17:44:49 | PASS. 97파일/1,367tests·TypeScript/Vite/MV3/5스킬. 신규5개:동시1회파싱/독립owner·한취소격리·전체abort/늦은결과폐기/새요청·실패재시도·발행후전달전취소의재입장. 기존최종owner/다른File/취소창/문서lease검사도유지. |
| whale-pptx-source-sharing/1791967531723/result.json | 최종PASS. 제품source모듈·실제nativeWorker/MV3 CSP·실제teacher-01 File. 두동시요청Worker1·첫취소후Worker유지/두번째성공·ready추가owner/최종해제81자산·전체취소Worker종료/늦은post무반영/새요청재시도. 기존PDF픽셀/수업불변·원본hash불변·외부0/pageerror0. productRendering=false이며렌더충실도검사가아니다. 초기1791966950756도PASS. |
| whale-pptx-player/1791967187074/result.json | PASS. 실제23쪽/12효과·private/draft/overlay·worker/새Player·백업/재연결·5화면. |
| whale-foundation/profile-1791967187239/verification-result.json | PASS. PDF저장/복사본/종료·owner/worker·WAV/MP4·자동넘김·정상restart. |
| whale-prepared-scene/1791967187096/result.json | PASS. pending/직접거부·현재PDF/음원·worker/ACK유실·누락/재연결·닫힌명시쪽. |
| whale-prepared-scene/1791967531603/result.json | 최종publication경합보완후정상준비회귀PASS. 위의현재화면/소유권·취소/실패·응답유실/재연결경계재확인. |
| whale-pptx-embedded-media/1791967311807/result.json | PASS. 내장 WAV/MP4·실제native효과공존/metadata오류/취소·source5그룹/cursor·동일DOM승격/play0·백업/닫힘. |
| whale-pptx-entry-limit/1791967047533/result.json | **FAIL(성능)**. parser1/MP3전체읽기1·등록/화면/실제음원재생·정지/PDF복귀·Editor추적자산0·원본2개hash불변·외부0/pageerror0은작동했지만WorkingSet표본1,624,035,328bytes로기존1.5GiB기준초과. |

이전 SOURCE_REUSE_MEMORY의통과2표본을현재성능완료의증거로선택하지않는다. 새표본실패만으로진행중공유가메모리증가의원인이라고확정하지도않는다. 기능/소유권은통과했으나전역자원예산·성능인수는미완료다. 원본축소/화질·음질/preload·기준상향/강제GC는하지않았다.

교사/PDF/내장/대용량회귀는마지막pending발행시점보완전의진행중공유를검증했다. 최종보완은단위의예약/재입장경합과최종actual공유·정상준비회귀로다시검증한다. 검증범위를확대해주장하지않는다.

## 다음 경계

서로다른File/창의admission·활성/대기parser수·누적원본/자산예산,비취소File.arrayBuffer가끝날때까지의일시적입력수명은후속이다. 현재발표중source를evict하지않고새준비를안전하게수락/거부해야한다.

현재files에는largeaudio버퍼의hash/size근거후해제는있지만hydratedBlob과중복된작은바이너리/image버퍼가남는다. source.files사용지점을검색해XML/관계/타이밍바이너리근거와표시자산을구분했다. 단순삭제하지말고guard/hydration/미디어근거를보존하는방출정책을새계획으로검증한다. 실제모든자료/10종/PowerPoint비교·물리/장시간/coldoffline·PDF대안/전체Stage A~G 인수와지원승격은계속남는다.
