# 구현 순서와 현재 진행 상태

최상위 기준은 [PRD v5 §24](../naver-ppt_PRD_v5.md)이며 교사 대상 네이버 웨일 공모전 참가를 위해 개발한다. 아래 v4 단계 표는 기존 작업 추적 자료다. 현재 순서는 **A Core Reliability → B PDF Vertical Slice → C Preflight → D PPTX Fidelity Spike → E Windows Quick Launch → F PPTX Partial → G Legacy/Web**이다.

## v5 현재 상태와 다음 작업

Stage A에 세션/창 UI를 연결했고 Stage B의 PDF.js 6.4.299 Import/독립 렌더/중복·원본 재연결을 구현했다. 80개 자동 테스트 및 실제 합성 PDF A5/B2/A5·B8 독립 노트·빌드 CSP·warm offline page 보조 검증 통과. 실제 Whale·overlay/export/종료/media와 후속 포맷/Bridge가 남아 있다. 다음은 글상자/판서/가리개 draft→commit·정식 저장/종료다. [제품 전체 계획](plans/2026-10-11-product-completion.md), [PDF 단위 계획](plans/2026-10-11-pdf-import-render.md), [인수인계](tasks/current.md)를 확인한다.

## v4 추적표 (역사적 단계 이름)

| 작업 | 관련 FR/실험 | 다음 결과물 | 현재 |
|---|---|---|---|
| 준비 | 전체 기반 | 지침·스킬·타입·빌드·검증 경로 | 구축; 실행 결과는 TEST_RESULTS 확인 |
| A1 창 경로 | FR-001/007, X-01 | 네 화면과 독립 창, 창 재사용/재연결 | 수업별 창 재사용/재연결 구현(자동검증), 웨일 미검증 |
| A2 상태/동기화 | FR-004/008/014 | 명령 검증, revision, 순수 reducer, durable commit | 상태·저장·공개 projection·UI 동기화 자동검증; Whale 미검증 |
| A3 화면 배치 | FR-002, X-02 | 모니터 지정/해제 복구, 단일 화면 대안 | 예정 |
| B PDF 수직 기능 | FR-003/004/006/008/011 | PDF.js, 2개 자료 전환, 위치·레이어 복원 | Import/독립 렌더·노트 보조 검증; overlay/media/export/종료/Whale 남음 |
| C 빠른 수정 | FR-009/010/016/017 | 우클릭·터치, 색 후보, 고정 상자, 폰트 맞춤 | 타입 계약만 있음 |
| D 재생·노트·도구 | FR-005/006/015/016 | Player 타임라인, 미디어, 노트·타이머 | 비공개 노트 UI/저장 연결; 재생/타이머/도구 미구현 |
| E 저장·복구·종료 | FR-011~014/018/020 | IndexedDB 델타, wcp.json, PDF 복사본, 복원 | IndexedDB 저장/재연결 구현; 정식 export/종료 UI 미구현 |
| F 형식/웹 확장 | FR-019/021~023 | PPTX 비교·부분 지원, W0 후 W1~3 실험 | 예정 |
| 안정화 | 전체 | 큰 파일·폰트·오프라인·권한·장애 회귀 | 예정 |

## 첫 제품 수직 기능의 완료 조건

PDF A와 B를 등록하고 A 5→B 2→A 5를 정확히 복원한다. A 5를 출력한 채 B 8을 편집하고, 글상자·판서·노트를 델타 저장한다. 현재 자료 종료는 나머지 자료를 보존하고 검정 대기로 전환한다. `.wcp.json`과 PDF 복사본을 로컬 PC에 저장하고 원본 해시 불변·재연결 복원을 확인한다. Player 표시 상태에서 다른 앱을 5분 조작하는 자동 넘김/지원 미디어 시험을 통과한다.

PPTX/한쇼/구형 PPT/온라인 고급 제어 결과를 기다리며 위 수직 기능을 중단하지 않는다. 대신 각 포맷의 역량과 제한을 별도로 표시한다.
