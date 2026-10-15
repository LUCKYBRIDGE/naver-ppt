---
name: presenter-state
description: 웨일 클래스 프레젠터의 자료 교차, 발표와 편집 선택 분리, 명령 리비전, 미디어 및 종료 상태를 구현할 때 사용한다.
---

# 발표 상태와 명령

[PRD v5](../../../naver-ppt_PRD_v5.md) §6/11/14/24가 제품 기준이다. 교사 대상 웨일 공모전 시연에서도 학생 화면 보호를 먼저 검증한다. core/session.ts와 storage/sessionService.ts는 UI/strict DB에 연결됐으며 현재 종료/재개는 실제 Whale headless 시험을 통과했다. 보이는 창/미디어·전체 종료 인수는 별도다.

[데이터 계약](../../../docs/DATA_CONTRACTS.md)과 [저장 정책](../../../docs/STORAGE_POLICY.md)을 읽는다. core는 UI/브라우저 API에 독립된 순수 함수로 유지한다.

- `presentedSelection`과 `editorSelection`은 독립이다. `SELECT_EDITOR_SLIDE`로 발표 선택·Player 미디어를 바꾸지 않는다.
- `ACTIVATE_DOCUMENT`는 이전 자료를 체크포인트 저장하고 미디어/자동 넘김을 정지한 뒤 대상의 마지막 페이지·레이어를 복원한다. 복귀 기본값은 보존 위치에서 수동 재개 대기다.
- UI 탐색 draft와 공개 commit을 분리한다. 현재 발표 슬라이드 수정은 기본 확정 후 반영하며 다른 슬라이드 편집은 해당 슬라이드를 발표할 때 표시한다.
- 명령마다 session/document/slide/revision/commandId를 검사한다. 중복/늦은 명령이 다른 자료를 바꾸거나 같은 편집을 재적용하지 않게 한다. 성공 ACK는 durable commit 이후 보낸다.
- Player가 활성 자료의 재생 실행 주체다. Remote 닫힘·포커스 상실·Editor 탐색은 정지 이유가 아니다. elapsed/deadline과 미디어 이벤트로 진행하고 interval 실행 횟수를 시간으로 쓰지 않는다.
- 자동 넘김 우선순위는 슬라이드 > 자료 > 세션. 비활성 자료는 정지하며 세션 타이머는 별도 범위이다.
- 종료 요청과 확정을 분리한다. 현재 자료는 closed로 발표에서만 제외하고 검정 대기, 원본/델타/Editor 선택·초안을 삭제하지 않는다. 저장 실패/취소 시 발표를 유지한다. 전체 종료/영구 정리는 별도 확인·초안 보호가 필요하다.

상태 전환 구현에 필수 테스트를 추가한다. A5→B2→A5, A5 발표 중 B8 선택/편집, 자료 전환 미디어 bookmark, 중복/늦은 명령, 현재/전체 종료와 저장 실패를 관찰 가능한 결과로 검증한다. [TEST_PLAN.md](../../../docs/TEST_PLAN.md)의 관련 FR/AT/IMPL ID를 기록한다.
