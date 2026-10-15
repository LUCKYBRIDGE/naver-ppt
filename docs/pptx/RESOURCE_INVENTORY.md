# Source 수명별 숫자 자원 집계

PRD v5 §11/16/24/28/30·FR-003/008·IMPL-T-28. [계획](../plans/2026-10-14-pptx-resource-inventory.md). 입장 예산의 근거를 만드는 첫 관측이며 전체 byte 제한을 구현한 것은 아니다.

resourceInventory는 작은 숫자 record만 저장한다. File/Blob/모델/본문/파일명/지문과 source token은 snapshot에 포함하지 않는다. 같은 File의 공유 source와 native retain은 record 하나에서 lease 수만 바꾼다. raw backing buffer와 owned Blob alias는 해당 source 내에서 identity로 한 번만 센다. snapshot은 복사본이다.

회계 입력은 유한한 0 이상 값으로 정규화한다. byte는 실수도 허용하지만 음수·NaN·Infinity를 0으로 만들고, lease·Blob·URL 수는 0 이상 정수만 허용한다. 이 검사는 잘못된 관측값을 입장 승인이나 물리 메모리 판정으로 확대하지 않는다.

sourceModel에서 queued/preparing/ready를 연결하고, 마지막 소비자 취소는 실제 작업이 끝날 때까지 cancelling record로 남긴다. 실패·늦은 결과·마지막 owner 해제는 record를 제거한다. 준비의 file size는 후보/예약량이며 실제 RAM이 아니다. ready bytes는 준비 완료 시점의 raw/owned Blob logical값이다. 모델 heap/native/allocator·SourceVault 전체·다른창 합계는 이 API로 측정하지 않는다. physicalMemoryBytes/modelHeapBytes는 null이다. 기록이 자산을 보관하거나 원본을 자동 복제하지 않는다. DB/RPC/public snapshot·권한/의존성·원본/품질·재생 정책 변경은 없다.

## 검증

Windows/Whale5.39.412.57 headless 격리 프로필, 결과는 ignored node_modules/.cache 아래다.

| 검사 | 근거 |
|---|---|
| check08:25:30 | exit0,103파일/1,418tests·TypeScript/Vite/MV3/5스킬PASS. 신규6개: 기존 backing/Blob alias·준비/취소/ready/lease·숫자복사/정보제외·sameFile source1/lease3/final0·취소후actual latework 완료까지record 유지에 음수/NaN/Infinity/소수 입력 정규화 검사를 추가. |
| whale-pptx-source-sharing/1792020367211/result.json | PASS. 실제23쪽File/nativeWorker source1·lease2에서file5,983,498/raw backing276,623/asset5,884,884bytes. nativeowner1로남아도bytes동일,마지막release뒤job/source/lease/bytes0. nativepopup2창각source1/lease1·두시험realm의logicalasset합11,769,768bytes. 실제준비/취소/재시도·owner닫힘·원본/현재PDF/수업·외부0/pageerror0보존. productRendering=false. |
| whale-pptx-source-sharing/1792020469388/result.json | PASS. 실제52쪽·98,050,517-byte File/nativeWorker source1·lease2에서asset92,769,395/raw backing9,335,184bytes. nativeowner1 이후최종release에서job/source/bytes0. nativepopup2창 logicalasset합185,538,790bytes. queued 5종·재시도·owner닫힘·원본/현재PDF/수업·외부0/pageerror0보존. physical/model null, productRendering=false. |
| whale-prepared-scene/1791976953909/result.json | PASS. 실제Remote queued취소/현재PDF·음원/응답유실·worker/실패/누락·원본재연결/명시쪽·직접우회거부. |
| whale-pptx-embedded-media/1791976954047/result.json | exit0. actual WAV/MP4·같은DOM/crop/rotation/효과/source5·재준비진행/음량·취소/metadata실패·worker/새Player·백업/원본/외부0/pageerror0. |

두시험realm의logical합은브라우저전체origin registry/예약서비스가아니다. ready source의추가일반ownedAsset/직접모델폐기는이준비완료snapshot에자동반영되지않으며현재product는준비뒤동적추가를하지않는다. 관측값을physical상한/JS heap 또는전체누수판정으로쓰지않는다.

이번순수숫자관측의대용량WorkingSet재측정은미실시다. 직전URL공유버전1791975862802의1,734,160,384bytes FAIL을현재성능통과근거로쓰지않는다. origin서비스·window close정리/late입장·실제byte예약/수락·보류/거부예산·현재발표보존과단일WorkingSet은후속이다. 실제교사10종(현재2/PDF1)/원본앱3축/물리·장시간/coldoffline·나머지PRD StageA~G 최종인수목표는유지한다.
