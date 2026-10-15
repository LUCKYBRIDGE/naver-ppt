# 검증된 PPTX 미디어 URL 공유

PRD v5 §11/16/24/28/30·IMPL-T-28. [계획](../plans/2026-10-14-pptx-borrowed-media-url.md). 전체 자원 예산으로 가는 수명 개선이며 최종 성능 인수는 아니다.

Runtime은 원본 위치·해시·종류·geometry를 검증한 미디어에만 안정적인 URL 대여 factory를 제공한다. acquire 때 live signal·동일 ref/fingerprint/origin·MIME·owned Blob 정체성을 다시 검사한다. 재생 구간/음량 변경은 byte identity에서 제외해 같은 factory/DOM 재생을 유지한다. 원본·코덱·품질·preload·DB/RPC/public snapshot은 바꾸지 않는다.

source lease의 retain은 독립 native owner를 만든다. 부모 runtime이 먼저 해제돼도 native owner가 남으면 URL/자산을 보존한다. LocalMediaPlayer는 native pause·src 제거/load 뒤 대여 lease를 해제하고 URL을 직접 revoke하지 않는다. 마지막 owner만 source 자산/raw를 폐기한다. 해제된 lease의 재입장은 금지한다. 일반 로컬 미디어의 자체 URL 경로는 유지한다.

## 근거

Windows/Whale5.39.412.57 headless 격리 프로필, 원본 읽기 전용/외부 전송 없음. 아래 결과는 ignored node_modules/.cache 안에 있다.

| 검사 | 결과 |
|---|---|
| check20:02:54 | exit0,102파일/1,412tests·TypeScript/Vite/MV3/5스킬PASS. 신규9개: retained native owner/마지막 release·해제 parent 재입장 금지, borrowed URL 독립/idempotent lease·live/ownership/MIME/fingerprint/origin 거부·settings 안정성. Runtime unit은 같은 factory 재사용/해제 뒤 acquire 거부도 확인. |
| whale-pptx-entry-limit/1791975862802/result.json | model/native Player 모두22URL·92,769,395bytes. 이전 native149,548,498bytes/23URL의추가56,779,103bytes URL관리 제거. 실제muted재생0.215831초/Remote정지·PDF복귀·Editor자산0·원본두hash불변·외부0/pageerror0 작동. **WorkingSet최대1,734,160,384bytes로기존1.5GiB초과 FAIL.** |
| whale-pptx-source-sharing/1791975962216/result.json | PASS. actual nativeWorker/원본File·독립retained owner가부모들release뒤자산보존/마지막idempotent release raw/URL0·pending취소/재시도·native2popup입장/닫힘/validator취소·현재PDF/수업/원본hash보존. productRendering=false. |
| whale-pptx-embedded-media/1791975962212/result.json | exit0. actual native WAV/MP4·crop/rotation/효과·같은DOM 승격/play0·source5·reprepareContinuity 같은node/진행/음량유지·invalidClip/metadata/취소·worker/새Player·백업/원본/외부0/pageerror0. |
| whale-prepared-scene/1791975962097/result.json | PASS. 현재PDF/음원·queued validator취소·실패/누락·ACK유실/worker·닫힌명시쪽·같은표면승격/직접우회거부. |
| whale-foundation/profile-1791976075602/verification-result.json | PASS. 일반local ownURL의WAV/MP4·자동넘김·PDF저장/복사본/원본/종료·owner/worker·정상재시작. |
| whale-pptx-player/1791976075496/result.json | exit0. 실제교사23쪽/12효과·private/draft/overlay·worker/새Player·응답실패·백업/재연결/5화면·원본보존/pageerror0. |

초기 runtime unit의geometry helper 대역이 undefined를반환해새URL경로에서실패했다. 실제선택element를반환하도록대역을수정하고owned source retain·factory/acquire 조건을추가검증했다. 제품geometry/binding guard는약화시키지않았다.

URL size 합계 감소는 물리 메모리 복제 제거 또는 전체 성능 해결의 증거가 아니다. 현재source의강제evict·화질/음질저하·강제GC/기준상향은하지않았다. origin ready/current/pending 모델·원본·미디어의누적byte accounting/입장예산,실제10종/원본앱Visual/Media/Behavior·물리/장시간/coldoffline·나머지PRD StageA~G 최종인수는 계속 남는다.
