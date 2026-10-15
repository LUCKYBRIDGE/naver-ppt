# 로컬 저장·종료·복구 정책

2026-10-14 자원 인벤토리는 DB/OPFS/chrome.storage에 쓰지 않는 실행 중 숫자 관측이다. queued candidate file size와 ready logical bytes를 구분하고 cancelling record는 실제 작업 종료까지 유지한다. 원본 자동 복제·byte 한도·물리 메모리 보증을 추가하지 않는다. [근거](pptx/RESOURCE_INVENTORY.md).

2026-10-14 미디어URL대여는실행source lease만추가한다. parent/native owner중마지막만자산/raw를폐기하고borrower는native src를비운뒤release한다. 영속복제/DB/backup·원본/품질정책변경없음. logicalURLcount/bytes는physicalWorkingSet보증이아니다. [검증](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 SourceVault.get 취소/close는해당request의timer/listener/await만정리하고현재원본·다른소비자의cache를삭제하지않는다. 취소뒤late결과는remember하지않으며검증중새연결이생기면보존한다. 원본/DB/backup자동복제정책변경없음. [검증](pptx/SOURCE_CANCELLATION.md).

2026-10-14 준비gate는실행중native lock/reservation만사용한다. queued/active취소가원본/수업/ready source를삭제하지않으며DB/backup schema·원본영속복제정책을바꾸지않는다. source validator는지문만반환하고읽은scratch를소비한다. 창닫힘시브라우저가그context lock을해제,모델전체byte한도/SourceVault 대기취소는아직없다. [근거](pptx/PREPARATION_ADMISSION.md).

2026-10-14 private scratch buffer 소비는 원본저장/복사가아니다. source가명시적으로소유한parser asset/raw는Blob 생성/검증뒤,File.arrayBuffer의미디어hash scratch는읽기성공·실패finally뒤에만소비한다. 다른part/view·source owner가사용중이면보존하고API부재/실패는기존동작유지. 원본File/표시·재생Blob/DB정책은보존,메모리상한보증은남는다. [검증](pptx/PRIVATE_BUFFERS.md).

2026-10-14 source-local raw 이미지·작은 미디어는 owned Blob과 exact byte 동일성이 확인된 항목만 hash/size 근거로 대체한다. XML/관계·폰트/미확인 원본·표시 Blob/File은 보존하고 마지막 lease 때 남은 private raw를 비운다. DB/OPFS 자동 원본 복제나 품질 변환은 없다. 참조 해제를 전체 메모리 상한 보장으로 해석하지 않는다. [검증](pptx/DUPLICATE_PARTS.md).

2026-10-14 sameFile pending WeakMap은실행창의진행중controller/소비자예약만보관한다. 한취소는상대유지,전체취소는abort/입장제거,성공은live예약lease/최종dispose로이전한다. 실패·모두취소한늦은성공/해제된발행자산은캐시재사용하지않는다. DB·원본bytes/비공개정보영속복제없음. latest메모리표본FAIL이므로전역예산보증아님. [근거](pptx/INFLIGHT_SOURCE.md).

2026-10-14 선택 자료 모델은 Editor의 현재 PPTX자료 하나의 source lease로만 유지하고 자료/수업/지문·등록쪽 변경/창닫기/취소에 해제한다. 쪽별 draft 경계는 유지한다. 성공한 동일 immutable File의 signature/hash 숫자와 guarded Blob의 File/identity는 WeakMap으로만 재사용하며 다른 객체/형식/크기/실패·소유권은 재검증한다. DB/백업/OPFS·원본bytes 영속 캐시를 추가하지 않는다. 두 메모리 표본 통과는 전역 한도/물리 인수와 별개다. [증거](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 raw PPTX 전환 거부는 상태/receipt/pending을 저장하거나 삭제하지 않는다. 원본/DB 영속 복제 정책은 같다. 실제 대용량 새 준비 경로의 추적 Blob 자산 해제0과 전체 WorkingSet 표본 기준 초과가 함께 관측됐으므로 자산 해제만으로 메모리 인수 완료라 하지 않는다. 원본 품질/기준을 낮추지 않고 native buffer·중복 읽기/모델 소유권을 후속 측정한다. [실패 근거](pptx/TRANSITION_ADMISSION.md).

2026-10-14 준비 표면은 실행 메모리/DOM/native 요소만 쓰고 DB에는 기존 작은 pending/receipt만 남긴다. 원본/미디어를 자동 영속 복제하지 않으며 passive checkpoint/transport 쓰기를 막는다. 취소/실패는 준비 자산 해제, 불명확 확정은 저장 상태 확인까지 현재/목표 자산 유지, 성공은 같은 자산 승격이다. 대용량 동시 모델의 전역 메모리 예산은 아직 없다. [검증](pptx/PREPARED_SCENE.md).

2026-10-14 전환pending은원본복제가아닌작은요청/복구메타데이터로기존SessionRecord와receipt에같이저장한다. Player context ID에묶여있어worker재시작은요청을보존하되새Player가과거요청을확정할수없고Remote가취소/새요청한다. 새수업backup복구는pending을null로제거한다. 원본/이미지/미디어/노트/파일명은pending에넣지않으며기존파일/DB를삭제하거나재설정하지않는다. schemaVersion1 optional확장/구세션읽기·strict검증을유지한다. [실제Whale증거](plans/2026-10-14-player-transition-commit.md).

2026-10-14 recovered내장Blob과largeMediaParts원본hash근거는sourceowner메모리만사용한다. 같은File공유도마지막ownerdispose후보존하지않는다. 원본복제/원문외부주소/미디어본문을DB·백업에추가하지않았다. 원본재연결은기존fingerprint/path계약을따른다. [범위](pptx/TEACHER_02.md).

2026-10-13 PPTX 음원/영상 항목64MiB 확대는 읽기/메모리 한도이며 영속 원본 복제를 추가하지 않는다. 검사·비공개/Player 자산은 기존 소유권으로 해제하며 실제 teacher-02 Editor 해제 뒤 추적 BlobURL bytes0을 확인했다. 자료의 모델 미디어 연결 실패를 저장/재생 완료로 처리하지 않는다. [범위](pptx/TEACHER_02.md).

2026-10-13 source media 재준비 키/promise/driver는 Player 메모리만 사용한다. 기존 source-v1 완료checkpoint/미디어 위치·백업계약은 유지하고 준비 실패/새Player에서 과거 action을 실행하지 않는다. run/request 진행 중 교체 금지, 원본/handle/bytes 영속화 추가 없음. [범위](pptx/MEDIA_TIMELINE_REFRESH.md).

2026-10-13 Player native endpoint는 취소 뒤 늦은 source bookmark와 새 Player의 과거 playing source bookmark를 기존 CHECKPOINT_MEDIA로 정지 보정한다. 새 Player 대기는 저장 위치를 유지하며 저장 실패 안내를 제공한다. source XML/bytes/native handle 저장이나 schema 변경 없음. [범위](pptx/NATIVE_PLAYER_ENDPOINT.md).

2026-10-13 MediaBookmark.sourceRunEpoch? 작은optional ID 추가. CHECKPOINT_PPTX_MEDIA의 source run/native 결과를 strict commit/receipt 뒤 공개하고, 진행취소/교체/reset은 해당 소유미디어를 정지한다. 기존 schema1 호환, 새 세션 백업복구는 표식 제거/paused=true. 원문/handle/bytes 저장과 원본 자동재생 승격 없음. [검증](pptx/SOURCE_MEDIA_CHECKPOINT.md).

2026-10-13 PPTX 로컬 편집정보:schema1은 PDF/PPTX metadata·델타·완료pose를 허용한다.PPTX1000쪽/PDF2000쪽·JSON16MB한도,원본bytes/nativehandle키제외.저장파일대조는수업의request/run을그대로비교하고,새수업복구때만제거하며완료pose scope의sessionId/revision을새ID/r0로맞춘다.원본재연결/명시발표전대기.[검증/제한](pptx/LOCAL_BACKUP.md).

2026-10-13 PPTX 요청: strict DB의 optional request metadata/receipt만 저장한다. ACK/배포는 commit 후다. 취소/전환/종료는 요청/run을 무효화하고 완료 pose를 보존한다. DB 재연결 후 pending 유지가 자동 재개를 허용하는 것은 아니다. 새 Player 명시적 재개 UI는 후속이다. 원본 자동 복제/백업 지원 확대는 없다. [근거](pptx/REMOTE_REQUEST.md).

2026-10-12 Editor PPTX구조점검: 선택File/검사bytes/보고서는해당작업·Editor메모리만. SourceVault/원본handle store/SessionDB/등록명령은호출하지않는다. File/header/hash와구조점검성공이원본복사본저장이나발표지원성공이아니다. [근거](pptx/EDITOR_INSPECTION.md).

2026-10-12 PPTX 원본: 전용 SourceVault 채널/검증함수로File을 런타임에만 연결한다. 자동DB원본저장 없음, 제공된 핸들만 기존 별도store에 저장한다. cold 채널/핸들원본은재해시; 위조fingerprint/변경bytes 거부 시수업불변. 일반UI와물리핸들은후속. [근거](pptx/SOURCE_BOUNDARY.md).

2026-10-12 ACK bridge: 실제 native 완료pose만checkpoint로전달하며 ACK전 cursor를확정하지않는다. 실패응답 시공개확정pose복원, 이미commit된응답유실은공개checkpoint를우선한다. 동일Whale 정상재실행·원본새파싱/지문확인후pose복원 PASS. 원본자동영속화/제품PPTX백업은추가하지않았다. [상세](pptx/PLAYBACK_BRIDGE.md).

2026-10-12 PPTX checkpoint: 완료그룹/pose·지문·renderer ID와 진행 epoch만 기존 strict IndexedDB 세션에 저장한다. 전환 시 진행 회차를 무효화하고 완료 pose는 유지한다. 원본 bytes/이미지 자동복제 없음. 실제 웨일 정상 종료/재실행 저장 확인, 비정상 crash/제품 PPTX 실행은 미확인. schema1 optional 호환이며 PDF 전용 .wcp.json 범위는 변경하지 않는다. [상세](pptx/DURABLE_CHECKPOINT.md).

2026-10-12 C-PREFLIGHT-06: 실제렌더 후 cache에는 renderedPages 개수만 추가하고 Canvas/이미지·원본bytes를 넣지 않는다. 렌더러 기존LRU3/64MB/8MP 제한과 destroy를 사용한다. PPTX 비교 배포본/합성fixture/스크린샷은 ignored node_modules/.cache/pptx-spike에만 존재, 교사원본 자동복사/제품영속저장 아님(TEST_RESULTS05:26).

2026-10-12 Preflight cache: 기존전체결과 영속화금지 유지. PDF 읽기summary만Editor 메모리32개/5분LRU로재사용하며원본bytes·노트·파일명/URL은저장하지않는다. source/hash를항상다시읽고media는항상metadata검사한다. 창/브라우저재시작cache없음,원본권한/완전offline증거가아니다(TEST_RESULTS05:15).

2026-10-12 Preflight: 결과는 Editor 메모리만이며 세션/백업/영속cache를 바꾸지 않는다. 파일 bytes 자동복사/자료업로드 없음, 같은 원본의 새hash·페이지수 확인 후 로컬 일부쪽과 metadata를 읽는다. 결과의 현재원본 접근가능은 coldoffline/저장완료와 다르다. 환경fingerprint 캐시는 후속(TEST_RESULTS04:59).

2026-10-12 소리: timer sound/완료회차/자동시도claim회차만 strict 저장한다. claim 후 재생하므로 재연결 중복을 억제하지만 renderer crash의 소리 유실은 가능하며 claim을 재생성공으로 표시하지 않는다. 백업의 과거 완료알림은 복원 때 억제, 새 timer reset/play 회차는 별도다. 원본음원/AudioContext는 영속화하지 않는다(TEST_RESULTS04:53).

2026-10-12 위치: TimerState optional position의 정규화 x/y만 저장하며 창 크기/스크린 좌표/원본은 저장하지 않는다. slider 조작은 Remote draft, 위치 적용 시에만 strict commit하고 실행 epoch/시간을 바꾸지 않는다. 백업/재시작 보존(TEST_RESULTS04:47).

2026-10-12 타이머: globalTimer(session)와 optional document.timer는 mode/visible/epoch·누적 경과/시작 시각만 strict 세션에 저장한다. 매초 저장하지 않고 설정·시작·정지·초기화·완료/자료 전환만 commit한다. 백업 복원은 exportedAt까지 경과를 포함한 정지 상태이며 원본 bytes·소유권 metadata는 포함하지 않는다. legacy document globalTimer는 명시 조작 때 이관한다(TEST_RESULTS04:43).

## Player 소유자 metadata
- `naver-ppt-player-owner` DB v1, `owners` store/keyPath=sessionId, exact {sessionId,documentId}만 strict transaction complete 뒤 grant한다. 실패/abort는 이전 owner를 보존한다. 원본·자료/노트·위치·URL은 넣지 않으며 세션 백업에 포함하지 않는 브라우저 실행 식별자다.
- Web Locks로 context 조회와 owner 판정을 직렬화한다. 생존한 원래 documentId는 worker 재시작/다른 앱focus로 만료하지 않는다. 창 종료/정상 브라우저 재실행으로 ID가 사라진 경우만 새 Player가 승계한다. worker 메모리가 단일 상태 저장소가 아니다. metadata 정리/브라우저 crash/재생 종료 tail 인수는 후속이다.

근거: [PRD v5 §14/28](../naver-ppt_PRD_v5.md). IndexedDB 복구·로컬 .wcp.json 저장/복원·현재/전체 비삭제형 종료와 PDF 수정본 저장 UI를 연결했다. 실제 Whale headless 기반으로 검증했으며 OS chooser/downloads/물리 인수는 남는다. IndexedDB 자체에 권한을 추가하지 않고 다운로드 완료 검증에 downloads만 요청한다.

## IndexedDB v1
- 2026-10-12 미디어 조작: optional ref.playback과 bookmark.positionEpoch도 상태 metadata로만 strict 저장한다. 원본 자르기/덮어쓰기/bytes 복제는 없다. 구간 변경·seek는 epoch를 교체해 늦은 native 위치 보고를 거부하고, 실패하면 기존 설정·위치를 유지한다. 음량 변경은 실행 위치/회차를 바꾸지 않는다. 백업은 설정/구간/위치를 유지하되 미디어 실행은 정지 복원한다.

- 2026-10-12 재생 상태 기반: optional autoplayCheckpoint는 자료별 페이지/epoch/누적 경과/시작 시각/정지 여부만 저장한다. 다른 자료 전환은 이전 bookmark 위치와 경과시간을 한 strict 상태 commit으로 정지·보존하며 세션 타이머는 별도다. 수동 페이지 이동은 자동 넘김을 새 epoch로 정지하지만 자료 타이머는 계속한다. 백업 복원은 exportedAt 기준으로 정지하고 사용자 재개를 기다린다. Remote 재개/정지·설정 변경과 Player ADVANCE에서 의미 있는 checkpoint만 strict 저장한다. 매 프레임/원본 미디어 bytes 저장 경로는 없다. 실제 MediaElement 위치 제출은 후속이다.

- DB 이름 `naver-ppt-sessions`, DB version 1, object store `sessions`, keyPath `session.id`.
- 한 레코드에 `{ schemaVersion: 1, session, receipts }`를 저장한다. receipts는 최대 256개로 제한한다. append/이전 기록 보존/revision 순서를 검증한다.
- readwrite 트랜잭션 안에서 기존 revision 조회와 새 상태 쓰기를 함께 처리한다. 새 revision은 expectedRevision+1이어야 한다. 두 연결이 경쟁하면 하나만 저장하며 나머지는 STALE_REVISION으로 재조회한다.
- 쓰기 durability strict를 요청하고 transaction complete 이후에만 성공한다. 요청 success 뒤 abort 또는 quota 오류면 상태/receipt가 함께 rollback된다. strict 미지원 시 낮은 내구성으로 조용히 전환하지 않는다.
- 전체 레코드의 필드/ID/페이지/선택/좌표/타이머/receipt를 읽기와 쓰기 양쪽에서 검사한다. 원본 File/Blob/바이트/미지 필드는 허용하지 않는다.
- 신규 생성은 revision 0에서 add만 사용한다. 기존 세션 덮어쓰기/자동 삭제/초기화 API가 없다. 손상/알 수 없는 schemaVersion/상위 DB 버전은 오류로 보존한다.
- versionchange 때 연결을 닫는다. 닫힌 repository를 재사용하지 않고 새로 open한다. 막힌 open은 STORAGE_BLOCKED이며 늦게 열려도 abandoned 연결은 닫는다.
- Edge 155의 웹 오리진에서 프로세스 종료/재실행 후 상태·비공개 노트·receipt 복구와 오프라인 조회를 확인했다. Whale 확장 오리진과 PC 비정상 종료/디스크 고장 내구성은 미검증이다. IndexedDB는 정식 로컬 백업을 대신하지 않는다.

| 저장 위치 | 내용 | 정식 백업 여부 |
|---|---|---|
| 원본 PC 파일 | PDF/PPTX/PPT/SHOW 원본; 읽기 참조 | 원본 보존 |
| 확장 오리진 IndexedDB | 편집 델타·노트·진행 설정·참조·한도 저널 | 임시 복구 |
| chrome.storage.local | 작은 사용자 설정·창 위치·최근 목록 | 임시 설정 |
| OPFS(필요 시) | 용량 상한과 LRU가 있는 썸네일/렌더 캐시 | 정식 백업 아님 |
| 로컬 `.wcp.json` | 원본 참조와 재편집 가능한 상태·델타 | 정식 편집정보 |
| 로컬 PDF/PPTX 복사본 | 지원 가능한 합성/추가 레이어 | 정식 결과물 |

## 원본과 재연결

- 로컬 미디어(2026-10-12): 별도 `mediaVault`/naver-ppt-media-v1 channel과 readMediaInput validator를 사용하며 native handle은 기존 source-handles store에3개ID key로 구분한다. 메모리 File은 미디어 vault도16개/512MB·개별128MB 한도다(PDF vault와 별도). 원본을 OPFS/세션DB/백업에 자동 복제하지 않는다. 같은 페이지의 같은 SHA256 파일 선택은 metadata 변경 없는 재연결이다. fallback File은 창 종료 후 재선택해야 한다. 약5초/정지·종료/자료 전환의 위치만 저장하고 비정상 종료 시 마지막 checkpoint 이후의 일부 경과는 잃을 수 있다. cold restart 파일 권한/보존 정책은 별도 인수다.

SourceVault: 별도 DB `naver-ppt-source-handles` v1 / `handles` store에 `{key,fingerprint,handle}`만 strict 저장한다. key는 JSON.stringify([sessionId,documentId])다. File/Blob/원본 bytes·미지 필드 저장을 거부한다. 일반 파일 입력의 File은 창별 실행 메모리에만 보관하며 16개/512MB, 개별 PDF 128MB 한도다. 핸들 권한/파일이 사라지면 같은 원본 재선택; 내용이 달라지면 델타 자동 병합/삭제를 하지 않는다. Player는 세션 fingerprint와 대조한다. 같은 오리진의 원본 요청은 BroadcastChannel을 쓰며 저장 완료가 아니다. Edge의 네이티브 핸들 IDB clone/페이지 재로드 시험은 생성된 OPFS 테스트 파일로만 확인했다. 제품에 원본 자동 OPFS 복사는 없다. 실제 탐색기 파일/Whale 재시작 권한은 미검증이다.

원본 덮어쓰기 기능은 제공하지 않는다. 기본 편집정보에 원본 바이트를 포함하지 않고 자료/미디어를 브라우저 저장소로 자동 복제하지 않는다. 위치 이동·권한 만료·파일 변경 시 사용자가 선택한 파일의 이름/크기/metadata와 필요 시 해시를 비교한다. 경로 추측으로 다른 개인 파일을 읽지 않는다. 확장 제거·캐시 정리 후에는 로컬 편집정보와 원본 재연결로 복구한다.

## 저장 결과

2026-10-11 구현: Editor의 확정된 snapshot만 전체 .wcp.json으로 저장한다. 노트/레이어 draft 중에는 버튼을 잠근다. 원본 bytes와 native fileHandleKey는 내보내지 않는다. 저장된 revision을 안내하고 저장 도중 바뀐 상태와 구분한다. dirty는 원본 대비 변경을 뜻하므로 백업 성공으로 지우지 않으며 PDF 복사본/종료 완료와 혼동하지 않는다.

File System Access: 사용자 제스처에서 picker를 연다. 비어 있는 새 .wcp.json만 허용하며 nonempty 기존 파일은 writer를 열기 전에 거부한다. write→close→getFile/bytes 완전 일치 뒤 complete다. 실패 시 가능한 writer.abort, 상태는 보존하며 사용자 새 출력 파일을 자동 삭제하지 않는다. 저장 chooser가 없으면 [downloads 공식 API](https://developer.chrome.com/docs/extensions/reference/api/downloads)의 saveAs/uniquify를 사용한다. 요청 ID·own extension ID·own Blob URL, complete/exists/bytesReceived/fileSize를 이벤트 뒤 최종 조회로 확인한다. ID 전 조기 이벤트는 최초 조회로 보완한다. 5분 동안 완료를 확인하지 못하면 미확인 오류/편집 보존이며 성공이나 취소로 단정하지 않는다. API의 존재 확인은 파일 삭제 감시/디스크 고장 보장이 아니다.

Launcher 복구: 16MB/UTF-8/format/schemaVersion1/깊이32/노드250,000/자료16개/각2000페이지 및 전체 상태 계약을 검증한다. 현재 PDF만 활성화하며 SHA-256 참조가 필요하다. IMPORT_SESSION은 Launcher만 허용하고 새 UUID/revision0/strict add로 만든다. 기존 수업을 합치거나 덮어쓰지 않는다. 원본 핸들 키를 제거하고 발표 선택은 null, 타이머/미디어는 정지 상태, 마지막 페이지/편집 선택/델타/노트는 보존한다. 원본 재선택·fingerprint 일치 확인 후 사용자가 발표를 시작한다. future schema/malformed/권한·quota 실패는 기존 수업을 유지한다.

저장 결과 저널은 별도 DB `naver-ppt-save-journal` v1 / `attempts` / keyPath `exportId`로 구현했다. schemaVersion1, exportId/sessionId/captured revision/출력 bytes 길이/SHA-256/시각만 준비 기록에 넣는다. native picker는 사용자 제스처에서 먼저 열고 writer/download 시작 전에 strict 준비 기록을 완료한다. 실제 파일 확인 뒤 strict terminal 기록을 완료하며 요청 success 뒤 abort는 rollback된다. terminal은 complete(transport/downloadId)/failed/cancelled이며 동일 결과 replay 외 변경은 거부한다. 파일 본문·원본·파일명·개인 절대경로·노트는 저널에 넣지 않는다.

전역 최대 256건이며 한도/손상/quota/strict 미지원이면 기존 증거를 자동 삭제하지 않고 새 파일 쓰기 전에 실패한다. 후속 정리 UX는 사용자가 보존/정리를 선택하도록 설계해야 한다. picker에서 취소/기존 nonempty 거부는 writer 이전이므로 준비 기록이 없을 수 있다. 준비 이후 중단은 prepared로 남아 성공으로 승격되지 않는다. 파일 완료 뒤 저널 실패는 complete + journal unrecorded이며 UI에서 복구 기록 실패를 별도 안내한다. 파일을 자동 삭제하거나 세션 dirty를 지우지 않는다.

이 저널은 종료 권한이 아니다. worker의 출력 증거 재검증, 동일 revision 종료 CAS, 다른 Editor의 미확정 draft 보호/동결은 후속이다. 현재 journal.read 및 페이지 재연결 조회까지만 구현하며 최근 저장 목록/재검증 UX는 남는다. UI의 성공 문구나 Blob을 종료 권한의 근거로 쓰지 않는다. Edge 보조에서 실제 PC JSON/hash·준비→완료·다른 페이지 조회를 검사했으며 OS chooser/Whale downloads/API/개인 파일 경로는 별도 인수가 필요하다.

- `원본명_편집정보.wcp.json`, `원본명_수정본.pdf` 등 새 파일명을 쓴다. 중복은 브라우저의 충돌 회피/새 이름 방식으로 처리한다.
- `chrome.downloads`를 도입하면 요청 ID와 완료/실패 이벤트를 추적한다. filename은 Downloads 기준 상대 경로이다. `saveAs` 또는 사용자 승인 File System Access 경로로 위치 선택을 제공한다.
- Blob/URL 생성, 다운로드 시작, 캐시에 보관한 결과는 완료가 아니다. 실패/취소 시 수정 데이터와 dirty 상태를 보존하고 재시도한다.
- File System Access를 도입할 때 쓰기/close 성공과 readback 검증 가능 범위를 기록한다. 성공 판정은 경로별 계약으로 나눈다.
- PDF는 영상·타이머·재생 설정을 보존하지 않으므로 편집정보 저장을 별도 선택으로 제공한다. PPTX는 객체 유지/이미지 기반 대안과 효과·영상 손실을 명시한다.
- 내보내기된 파일을 실제 외부 뷰어에서 열고 원본 해시 불변을 확인한다. 파일 생성 성공과 렌더 품질은 별도로 판정한다.

## 종료 상태 머신 계획

PDF 수정본 출력(2026-10-12): 확정된 document/revision만 캡처하고 Editor 초안이 있으면 저장을 잠근다. 클릭의 사용자gesture 중 chooser를 먼저 열며 empty 새.pdf만 선택한다. 원본128MB/2000pages/hash를 다시 검증, 원본vector 페이지에 공개PNG레이어만 추가하며 readback 일치 후 성공 표시한다. fallback downloads는 기존 자체 요청ID·owner/URL/complete/exists/bytes 검증을 공유한다. 노트/수업기록/미디어/타이머와 미확정초안은 추가하지 않는다. PDF 생성취소/저장취소/실패와 이후revision변경을 구분, 세션/dirty/델타는 그대로 둔다. PDF 출력은 백업완료저널/종료증거가 아니다. 가리개는 원본내용 삭제가 아니고 오버레이글씨는 raster이다. 기존PDF의action/annotation을 정화한다고 보장하지 않는다. actual Whale OPFS/Node reader는 통과했지만 native OS chooser/downloads/외부뷰어는 별도다.

전체 자료 종료 구현(2026-10-12): Remote만 CLOSE_ALL_DOCUMENTS를 요청하며 정확한 열린 자료 scope/revision/자료별 선택을 확인한다. saved는 수업 전체 확정 편집정보와 완료 저널 검증을 공유하고 해당 자료에만 적용한다. 실패 자료는 유지, 성공 대상은 한 strict CAS로 종료한다. revision 경쟁/저장소 실패는 모든 대상에 적용되지 않는다. 실패한 현재 자료는 계속 발표하고 현재가 종료되면 검정 대기로 전환하며 다른 자료를 자동 노출하지 않는다. 모든 자료가 닫히면 session timer도 checkpoint/pause한다. 부분 결과를 전체 성공으로 표시하지 않으며 남은 자료를 최신 revision으로 다시 확인한다. 편집창/미확정 초안/임시 복구 데이터/원본은 삭제하지 않는다. PDF 복사본과 영구 정리 UX는 후속이다.

현재 자료 종료 구현(2026-10-12): CLOSE_CURRENT_DOCUMENT는 Remote만 요청한다. request commandId/sessionId/documentId/null slide/revision/decision/blobUrl을 검증하고 raw SESSION_COMMAND CLOSE는 거부한다. saved는 실제 파일 내용·완료 저널을 현재 확정 상태와 대조한 직후 기존 SessionService/repository CAS로 commit한다. unchanged는 현재 자료 dirty=false일 때만 허용하며 without-backup은 명시 선택이다. 실패/취소/늦은 revision/transaction abort는 현재 발표·자료를 유지한다. ACK/port 배포는 strict commit 이후다.

종료는 `documents[id].closed=true`와 `presentedSelection=null`이다. 문서/델타/원본 참조/documentOrder/editorSelection은 삭제하지 않는다. 현재 자료의 bookmark를 pause하고 해당 document timer를 checkpoint/pause한다. 다른 자료와 session timer는 유지한다. Editor UI/선택 key가 유지되어 다른 Editor의 미확정 초안이 unmount로 사라지지 않는다. 확정 전 초안은 파일 저장 대상이 아니며 dialog에 명시한다. 이 비삭제형 현재 종료에서는 draft freeze가 필요 없지만 영구 삭제·전체 편집창 종료에는 별도 handshake/확인이 필요하다.

closed 자료는 목록에서 [종료]로 표시하고 ACTIVATE를 거부한다. 명시적 REOPEN_DOCUMENT/다시 발표만 마지막 위치를 복원한다. closed 필드 없는 schema1 자료는 열림이며 closed 자료도 로컬 편집정보/복구에 보존된다. 새 백업 없이 종료도 임시 복구 데이터 삭제/저장 성공을 뜻하지 않는다. 자동 영구 삭제/한도 정리는 없고 closed 자료도 기존 보존 수/실행 메모리 한도에 포함된다. 영구 정리 UX는 후속이다.

종료 전 저장 파일 재검증(2026-10-12): Editor의 `저장 파일 확인` 입력으로 교사가 고른 `.wcp.json`만 own Blob URL로 전달한다. 워커는 자기 extension root+UUID URL 외 fetch를 거부하며 16MB streaming/30초 한도를 적용한다. valid bundle의 수업 ID/revision/전체 확정 상태(원본 handle 제외), 완료 저널의 SHA-256/bytes를 대조하고 읽기 이후 durable revision을 다시 조회한다. 파일 내용/Blob URL/개인 경로를 영속 저장하지 않고 새로운 상태/receipt를 쓰거나 Player에 publish하지 않는다. Player/Launcher에는 요청 권한이 없고 Editor/Remote만 가능하다. 파일은 재선택을 통해 그 시점에 읽었음을 확인할 뿐 영구 존재/다른 Editor의 draft/종료 성공을 보장하지 않는다. 후속 종료에서 동결과 revision CAS가 필요하다.

`요청 → 대상 dirty 확인 → 편집정보/자료별 복사본/저장 안 함/취소 선택 → 선택 항목 저장 결과 → 성공 대상만 종료 확정`.

현재 자료만 종료하면 나머지 자료의 페이지·미디어 위치·편집정보를 유지하고 Player를 검정 대기로 전환한다. 모든 자료 종료는 별도 확인과 자료별 저장 선택을 제공한다. 변경 없는 자료는 기본 복사본 생성 대상에서 제외한다.

dirty 자료의 기본 저장 제안은 편집정보 로컬 저장, 복사본은 추가 선택이다. 저장 안 함은 별도 확인하며 '저장 완료'를 표시하지 않는다. 웹 탭 종료 시 서비스 자체의 미저장 편집 상태는 확장에서 알 수 없음을 안내한다.

## 구현 시 확정할 세부사항

저널 보관 한도, 자동 복구 checkpoint 간격, 캐시 상한과 정리 기준, 사용자가 저장 안 함을 선택한 델타의 보존/삭제 시점은 실험과 삭제 UX를 함께 설계한다. 현재 결정하지 않은 수치를 보장하거나 묵시적으로 영구 보관하지 않는다. ADR에 결정하고 실패/중단 복원 테스트를 추가한다.
