# PPTX 완료 효과의 영속 상태 계약
- 목표: Player 완료 효과와 pose를 원본 지문에 묶어 저장하고 A→B→A 복귀 시 보존하며 늦은 완료를 거부한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: core 순수 계약/명령·Player 역할/생존 소유자 검사, strict 저장 검증, 자료전환/독립편집/중복/실패·재접속 테스트.
- 하지 않는 것: 미검증 렌더러의 제품 활성화, 원본 bytes 저장, 기존 PDF 전용 백업을 PPTX 지원으로 승격.
## 영향 범위
- 순수 pose 검증을 core로 분리하고 기존 adapter API는 유지.
- core types/commands/session/playerSnapshot, 메시지·background 소유권, 저장 검증 및 테스트.
- 위험: 늦은 완료가 다른 자료에 적용되거나 DB에 실행 중 상태를 완료로 저장. 시작 회차와 완료 count CAS, 대상/지문/revision 검증으로 차단한다.
## 단계
1. [x] 순수 pose·완료 checkpoint/회차 계약과 메시지/저장 연결.
2. [x] 전환/중복/재접속/역할/실패 검증 및 check 기록.

근거: [DURABLE_CHECKPOINT](../pptx/DURABLE_CHECKPOINT.md). 원본 효과→제품 Player 화면→DB end-to-end는 후속이며 이번 저장 시험으로 대체하지 않는다.
## 제한
- 새 BEGIN은 이전 미완료 회차를 대체한다. 전환/페이지 변경은 run을 무효화하고 완료 checkpoint만 보존한다. native 재생/제품 UI 연결은 다음 단계다.
