# 여러 창의 PPTX 준비 입장 제어

- 목표: 서로 다른 자료·창의 읽기/ZIP/model 준비가 겹치지 않게 하면서 현재 발표·이미 준비된 source·원본을 유지한다.
- 승인 근거: 제품 완성 지속 개발 및 최신 인수인계. PRD v5 §6/11/16/24/28/30·FR-003/008·IMPL-T-28.
- 완료 기준: 같은 extension origin의 준비 job 하나만 실행, queued 취소는 읽기/Worker 시작 없이 제거, active 취소는 비취소 File 읽기의 실제 완료까지 slot 유지, 실패/닫힌 context 뒤 후속 입장 가능. 기존 동일File pending/ready 공유·owner 수명은 유지한다.
- 범위의 한계: 동시 준비 제어는 단일 대용량 자료의 WorkingSet FAIL이나 ready/current/pending 모델 전체 byte 예산의 해결이 아니다. 원본 품질/한도를 낮추거나 현재 source를 evict하지 않는다.

## 영향 범위

- 새 adapter `preparationAdmission.ts`: extension-origin Web Locks exclusive gate, queued signal, 입장 직전 재검증·callback 실제 완료까지 reservation. API 부재는 fail closed이며 조용한 동시 실행 fallback은 없다. 원본명/자료ID는 lock 이름에 넣지 않는다.
- `sourceModel.ts`: 같은File pending job만 gate를 잡으며 ready lease는 그대로 반환한다. 기존 최종소비자 취소/늦은결과 dispose를 유지한다.
- `import.ts`, `fileInspection.ts`: 전체 heavy pipeline 진입점에 gate를 연결한다. import 내부 behaviorPreflight helper는 재진입하지 않는다.
- `source.ts`: SourceVault 재연결 validator의 File 해시 읽기도 gate에 연결한다. 이 validator는 fingerprint만 반환하며 읽은 scratch를 소비한다. import의 vault.remember는 validator를 재호출하지 않아 중첩 잠금이 없다.
- unit: gate의 native 계약/queued/active/실패·API부재, source/import/inspection 경계의 scope를 분리한다. 기존 ownership 단위는 gate를 명시적으로 대역 처리하고 새 admission 검증과 actual Whale로 입장 계약을 확인한다.
- actual Whale: 두 독립 extension context·실제File/native Worker/Web Locks에서 queued취소·실행중읽기 취소와 후속 입장·owner닫힘·현재PDF/원본hash 보존. 제품 기능 회귀와 최종 check.

## 위험과 보존

- 긴 다른 준비가 현재 전환의30초 deadline을 소모할 수 있다. 기존 취소/실패 절차로 현재 학생 화면을 유지하고, 준비를 강제 실행하거나 완료로 위장하지 않는다.
- active signal abort만으로 slot을 조기에 놓으면 미완료 File 읽기와 새 준비가 겹칠 수 있다. callback promise 완료 때만 release한다. source waiter는 별도로 즉시 취소 응답한다.
- Web Locks는 같은 origin 범위이며 다른 extension/브라우저에 대한 OS 전역 한도가 아니다. 프로세스 종료/모델 전체 byte·미디어 해시 budget은 별도다.
- 공용 상태·DB/RPC/권한·의존성·원본/폰트/코덱/품질/재생정책은 변경하지 않는다.

## 단계

1. [x] gate/entry 연결·queued/active·실패/대역/API부재·같은File owner unit/빌드 검증.
2. [x] 실제Whale 두context의 native 입장/취소/닫힘·원본hash/현재PDF 보호 확인.
3. [x] 준비/교사/내장·PDF 기능 회귀와 대용량 성능 결과를 분리해 확인. 성능FAIL과교사첫timeout 원인미확정을보존한다.
4. [x] 검증/호환성/저장정책/계약/계획/인수인계 갱신. StageA~G/전체인수목표 유지.

완료한 범위는origin-wide 준비 입장 계약이다. SourceVault.get의signal없는validator대기취소·ready/current/pending 모델byte예산과단일대용량성능은미완료다. 최종1,395tests/빌드·실제native2popup·제품회귀/성능FAIL·중간시험실패는[증거](../pptx/PREPARATION_ADMISSION.md)를따른다.
