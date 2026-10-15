# 단일 Player 실행 소유권
- 목표: 수업당 생존 Player 하나만 미디어·자동 넘김을 실행하고 Player 실행 명령을 보낼 수 있다. PRD v5 §11/17·Stage B, FR-004/005/006.
- 승인: 기존 제품 완성 개발 및 포괄 승인. presenter-state/whale-extension/plan-feature 적용.
- 완료 기준: 실제 sender.documentId/getContexts, 엄격한 소유자 metadata 저장·경쟁 직렬화, 중복 창 검정 대기/명령 거부, 소유 창 닫힘 후 승계, worker 재생성에도 소유자 유지.
- 하지 않는 것: 서비스워커 heartbeat/재생 타이머, focus 기반 만료, 사용자 창 강제 종료, 원본/미디어 복제.
## 설계와 영향
- storage/playerOwner.ts 별도DB v1/owners/sessionId→documentId만. Web Locks로 실제 창 조회와 strict IDB 소유 판정을 한 순서로 묶는다. 이전 조회 결과로 새 생존 소유자를 탈취하지 않는다.
- background/playerAuthority.ts: 자체 Player sender URL·session·documentId/getContexts 생존 확인. 기존 소유자가 생존하면 교체 금지, 없는 경우만 새 claim 허용. 실패 시 grant/실행 명령 금지.
- background index: Player ADVANCE/PLAY_MEDIA/CHECKPOINT를 gate. 공개 snapshot/비공개 편집창 진입은 기존 경계 유지.
- worker 재시작 회귀의 Editor에는 비가시 data-session-revision을 노출해 상태 배포 완료를 관찰한다. 자동 입력은 원격 GOTO의 새revision이 실제 UI에 도착한 후만 실행하고, 실패 시 UI/서버 revision·status를 기록한다. stale 명령을 조용히 재적용하지 않는다.
- Player hook은 소유 확인 전 실행 요소를 만들지 않는다. 중복 창은2초 후 재시도, 소유 창은 TTL/heartbeat 없이 생존 동안 유지한다. worker 일시 연결 실패가 native 재생을 정지시키지 않는다.
- 위험: 구형 API/documentId 미지원, getContexts 순간 조회 경쟁, worker 중단 중 응답, 창 종료 tail 보고 거부. 실제 Whale 시험과 집중 자동 테스트로 검사한다.
## 단계
1. [x] strict owner metadata/생존 판정·직렬화/strict abort와 자동 테스트6개.
2. [x] 실제 메시지 gate/Player 실행 보호와 check242tests·빌드 PASS.
3. [x] 실제 Whale 중복/명령거부·소유창 닫힘 승계/제품 worker 실제 stopped→running 동안 WAV유지·소유유지/기존회귀 및 문서. TEST_RESULTS04:26. 장시간 물리focus/browsercrash·재생종료tail은 후속 인수다.
