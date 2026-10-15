# PPTX 고급 효과와 완료 모습 복원
- 목표: 합성 OOXML의 입장/퇴장·90도 강조 회전·직선 이동을 실제 후보 파서로 읽고, 완료 모습의 자료 복귀를 검증한다.
- 승인: 제품 완성까지 계속 개발 포괄 승인. adapter-validation/presenter-state/plan-feature 적용.
- 완료 기준: 원본을 고치지 않는 합성 fixture, 효과별 실제 결과/의미 손실 기록, scope/revision이 맞는 완료 모습만 안전하게 적용, 자동/Whale 회귀.
- 하지 않는 것: 후보의 잘못 읽은 효과를 성공으로 판정, 임의 새 효과 엔진 구현, 제품 지원 승격/영속 저장 계약 변경.
## 영향 범위
- animationSnapshot.ts/단위 테스트, 합성 timing fixture, web-ppt --effects 모드 및 검증 문서.
- 위험: cursor만 복원하면 이동/강조 모습이 사라진다. 완료 CSS는 숫자 matrix/inset/opacity/visibility만 허용하고 session/document/slide/revision을 확인한다. 기본 모델에 원본 회전 각도가 누락될 수 있다.
## 단계
1. [x] 완료 모습 계약/검증·원자적 DOM 적용과 단위34개, check454tests.
2. [x] 합성 OOXML 파싱/실제 효과·90도 회전 의미 손실·cursor-only 이동 복원 실패 재현 및 pose 복원/스크린샷, 기존 teacher/media 회귀. 원본 회전 손실은 아직 미해결이다.
