# Player의 원본 미디어 실행 경계

후속2026-10-13: 검사한 순차 미디어-only 원본 그룹의 runtime caller를 제품에 연결하고 실제Whale Remote→native5명령/source-v1 ACK·취소/실패재시도/새Player0호출을 확인했다. 아래 미연결 설명은18:00 이전 시점이며, 현재 범위와 잔여 요구는 [원본 실행 통합](SOURCE_TIMELINE_EXECUTION.md)을 따른다.

2026-10-13. PRD v5 §11/14/24/25, FR-005/013/014. `PptxNativeEndpoint`를 실제 `LocalMediaPlayer` 요소에 등록했다. 원본 타이밍 그룹을 이 endpoint에 호출하는 runtime 연결은 아직 남아 있다.

## 동작

- 현재 session/document/slide, 등록 미디어 지문·내장 출처, PPTX run을 확인한 뒤 정규 action을 실행한다. native 명령 수락 후 `CHECKPOINT_PPTX_MEDIA`의 durable ACK까지 기다린다. 자연 재생 종료를 기다리는 명령은 아니다.
- 실행기를 명령 사이에 유지해 pause/resume과 stop/toggle의 차이를 보존한다. 음량만 바뀌어도 stopped 상태를 잃지 않는다. 실행 구간이 바뀌면 실행기를 교체한다.
- 자신의 source bookmark 응답에는 native play/seek를 다시 적용하지 않는다. Remote의 새 미디어 epoch에는 이전 실행기의 소유권을 넘겨 늦은 promise·cancel이 교사의 재생을 정지시키지 않게 한다.
- 취소/해제는 native 수락 또는 저장 응답을 기다리지 않고 finished를 거부한다. 취소 뒤 늦게 commit된 자기 bookmark는 기존 `CHECKPOINT_MEDIA`로 paused=true 보정한다. 원래 command/run의 저장 계약을 완화하지 않는다.
- 새 Player에 과거 source bookmark가 playing으로 남아 있어도 native 요소를 정지하고 보존 위치에서 paused=true로 저장한다. 과거 명령을 실행하지 않으며 교사의 새 PLAY 요청은 기존 경로로 처리한다. 정지 저장 실패는 Player 오류 안내로 알린다.
- 명시적인 `STALE_REVISION`만 최신 revision으로 최대 3회 재시도한다. source 결과는 같은 commandId를 사용한다. 알 수 없는 응답/저장 실패는 재시도하지 않는다.

## 검증 범위

`tests/unit/pptxNativeEndpoint.test.ts`는 native 수락/자기 ACK, stop/resume, 음량 변경, stale 재시도, 저장 실패, pending 취소, 늦은 commit 보정, dispose, 교사 소유권, 새 Player 대기와 저장 실패 안내를 검사한다. `pptxTransport.test.ts`는 exact Player checkpoint와 명시 stale 코드를 검사한다.

실제 Whale checkpoint probe는 muted 합성 WAV와 strict IndexedDB/SessionHub에서 실행·위치 진행, 자기 ACK 억제, 새 endpoint의 과거 요청 대기/위치 보존, stop 뒤 clip 시작, ACK 전 취소·늦은 저장 보정, 교사 재생 유지와 기존 복원을 검사했다. 82파일1,168tests/빌드와 actualWhale checkpoint1791881623150/교사제품1791881623063/foundation1791881623768/내장1791881890233 모두 exit0 PASS. 내장380px 캡처를 직접 확인했다. 최종 실행 경로와 한계는 `docs/TEST_RESULTS.md`에 기록했다.

원본 XML→조건/지연/설정→source 그룹→endpoint 호출, concurrent/seek/복합 타이밍과 실제 10종/PowerPoint 충실도·물리 스피커/IME/다중 모니터 인수는 미완료다. muted native probe를 원본 타임라인 재생 또는 전체 제품 완료로 판정하지 않는다. 원본 bytes·native handle·원문 명령을 영속 저장하지 않는다. 새 패키지/권한/외부 서비스/커밋/배포는 추가하지 않았다.
