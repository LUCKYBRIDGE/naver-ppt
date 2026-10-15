# 발표 중 미디어 타임라인 재준비

2026-10-13. PRD v5 §11/14/24/25, FR-005/013/014. Player를 먼저 연 뒤 내장 미디어를 등록하거나 재생 설정을 바꿔도 같은 runtime에서 검증한 source 미디어 그룹을 준비한다. 원본/모델/Blob/미디어 슬롯을 다시 만들지 않는다.

## 경계와 동작

- `refreshMediaTimeline()`은 source scope와 등록 ref의 바인딩·재생 설정으로 입력 키를 만든다. 노트/위치 bookmark만 바뀌면 재파싱하지 않는다. 같은 입력의 준비 promise를 공유하고, 최신 입력의 준비 회차만 적용한다.
- 재생 중인 PPTX 그룹, run 또는 대기 request가 있으면 교체를 미룬다. 준비 중에는 busy로 표시해 로컬 효과 요청도 실행하지 않는다. await 뒤 입력·scope·생존회차·run/request를 다시 검사한다. 준비가 끝났다고 과거 request를 자동 소비하지 않는다.
- 유효 후보의 source-v1 driver/bridge를 현재 완료 checkpoint로 복원한 뒤 교체한다. transform-v1 checkpoint는 자동 변환하지 않는다. 준비 실패는 기존 cursor/원본 화면/native 요소를 보존하고 실행 준비 상태와 Preflight를 unknown으로 바꾼다. 수정된 연결/설정은 다시 준비할 수 있다.
- 이미 source-v1 완료 cursor가 있지만 현재 미디어 설정으로 명령을 준비할 수 없는 새 Player는, 동일 원본의 media-only 구조를 검증해 **복원만 가능한 driver**로 원본 화면과 완료 위치를 표시한다. 이 driver는 native action을 허용하지 않는다. 설정을 고치면 같은 runtime에서 준비하고 완료 위치를 유지한다. renderer 자동 변환은 없다.
- `PptxView`는 등록/ref 설정 revision에 맞춰 준비/완료/실패를 알린다. request/run이 있는 동안 준비 feedback으로 진행 상태를 덮지 않는다. 일부 refs만 먼저 도착해 아직 실행할 수 없는 경우도 준비 중 상태에 고정하지 않는다.

## 검증

신규12개,83파일 **1,201tests**·타입/빌드/MV3/5스킬 PASS(최종check18:50:49 exit0). runtime composition 시험은 늦은 등록·단일 모델 유지/native 미호출, busy/run/request 보류, 같은 준비 promise 공유, notes 무효화 없음, dispose/metadata/새request의 늦은 결과 폐기, 오래된 결과의 최신 입력 덮어쓰기 방지, renderer 혼용 거부, 실패한 source checkpoint 보존·수정 후 회복, 준비 불가 source checkpoint의 새 Player 복원 경계를 검사했다. 실제 native 요소 연속성은 별도 Whale 시험으로 확인했다.

실제 Whale5.39.412.57 headless 최종내장 `whale-pptx-embedded-media/1791885072296/result.json` exit0에서 Player 먼저→과거 pending→내장등록→pending 무실행→명시취소→같은 surface/runtime 준비를 확인했다. 원본5그룹/750ms·취소/실패재시도·새Player0호출, 재생 중 음량 변경 후 같은 native 요소(0.182305→0.224682초)/volume.35/완료cursor 유지, 준비 불가 구간에서 새 Player의 완료5그룹 복원→설정 교정 후 같은 runtime 회복·native0호출, source metadata 백업의 새세션 정지/대기·완료5/source-v1/과거run·request제거 PASS. Remote의 원본연결·재생구간 교정 안내도 실제로 표시했다. 교사제품 `whale-pptx-player/1791885072190/result.json` exit0:23쪽12효과·Remote/편집/백업/교차/복원·5viewport PASS. 앞선 foundation `whale-foundation/profile-1791884344131/verification-result.json` exit0:PDF/미디어/소유권·저장/종료/재시작 PASS. 그 뒤의 변경은 PPTX runtime/Remote 안내만이며 PDF 경로는 동일하다. 모든 실행 종료를 확인했다.

합성 미디어-only5그룹에 대한 근거다. 도형·미디어 혼합/다중 미디어 동시·concurrent/seek/skipTimed·반복/대상클릭/종료조건, trim+playFrom 시간축, 실제10종/PowerPoint 충실도·물리 인수/전체 Stage A~G는 계속 미완료다. 원본 bytes/명령/native handle 저장, 자료 업로드, 권한·패키지 추가, 커밋·배포 없음.
