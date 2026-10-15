# 실제 효과와 저장 ACK 연결
- 목표: 실제 PPTX 엔진의 완료 pose를 strict 세션 checkpoint 명령에 연결하고 ACK 실패/전환 때 확정 화면을 유지한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: 모델 그룹수/target·지문 검증, BEGIN→기존 재생→캡처→durable ACK 순서, ACK 대기 busy/취소·실패 복구, 단위 및 실제 Whale 원본 효과→DB→복귀 시험.
- 하지 않는 것: 후보 라이브러리 제품 의존성 채택/지원 승격, 물리 교실/전체 원본 충실도 완료 주장.
## 영향 범위
- adapter durablePlayback.ts, 단위 검사, 격리 native effects fixture와 결과/계약 문서.
- 위험: 엔진 cursor 선증가/저장실패·전환 후 늦은 ACK가 새 화면 변경. 기존 AnimationRuns 수명과 별도 ACK 토큰 및 확정 checkpoint 재투영으로 보호한다.
## 단계
1. [x] 모델·실행/ACK 연결 및 취소/실패/복원 검증.
2. [x] 실제 native 효과/strict DB/복귀·회귀/check 기록.

결과와 제품미연결 범위: [PLAYBACK_BRIDGE](../pptx/PLAYBACK_BRIDGE.md).
