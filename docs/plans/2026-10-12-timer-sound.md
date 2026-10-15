# 타이머 완료 소리
- 목표: Remote 소리 선택, 소유 Player 완료 후 로컬 알림음·차단 시 수동 재생.
- 승인: 제품 완성 개발 및 포괄 승인. presenter-state/plan-feature 적용.
- 완료 기준: 완료 epoch/소리 claim strict 저장으로 자동 시도 중복 방지, Remote닫힘/중복Player·저장실패 테스트, 네이티브 Whale 오디오 실행/차단 UI.
- 영향: TimerState optional sound/completedEpoch/alarmClaimedEpoch, Remote SET_TIMER_SOUND, Player CLAIM_TIMER_ALARM/AudioContext, 저장 validator/백업 재알림 방지.
- 결정: 자동 시도는 at-most-once claim이다. claim 후 renderer crash는 소리를 놓칠 수 있으며 성공을 저장/보장하지 않는다. 거부 시 현재 Player만 명시 수동 재시도한다. 학생 화면 표시와 소리는 독립. 새 파일/CDN/권한/패키지 없음.
## 단계
1. [x] 상태·역할·저장/백업·단위/통합 테스트(259tests).
2. [x] Remote 설정·Player 로컬 소리/차단 복구·check04:52 PASS.
3. [x] actualWhale 대역첫거부→native재생/중복거부·기록(TEST_RESULTS04:53/profile1791748347635). 물리 스피커는 별도.
