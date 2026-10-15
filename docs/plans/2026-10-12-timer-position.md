# 타이머 위치 조절
- 목표: Remote에서 수업/현재 자료 타이머 위치를 0..1 좌표로 조절하고 실행 시간·epoch를 유지한다.
- 승인: 제품 완성 개발/포괄 승인. presenter-state/plan-feature 적용.
- 완료 기준: 범위/shape/revision/역할 검증, strict 저장·백업 복원, 실행 중 위치만 변경, Whale 380px/desktop 모서리 경계.
- 하지 않는 것: 타이머 소리·Player 직접 드래그(후속), 매프레임 저장/원본 변경.
## 영향 범위
- TimerState optional position, 순수 validator, SET_TIMER_POSITION Remote-only, 저장 validator/공개 clone.
- Remote X/Y slider·별도 적용 버튼, Player 정규화 anchor 배치. 없는 위치는 기본 우측 배치.
- 위험: 실행 시간을 초기화하거나 viewport 밖으로 나가지 않게 검증. 서로 같은 위치를 지정하면 겹칠 수 있으므로 사용자 선택은 자동 변경하지 않는다.
## 단계
1. [x] 상태·검증·UI·집중 테스트/check04:45(255tests) PASS.
2. [x] actualWhale 실행 중 이동/두 viewport 네모서리/복구·기록(TEST_RESULTS04:47/profile1791747972366) PASS.
