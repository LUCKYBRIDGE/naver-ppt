# 로컬 편집정보 저장과 복원
- 목표: 확정된 수업·델타·원본 참조를 .wcp.json 새 파일로 저장하고 기존 수업을 건드리지 않고 복구한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: 실제 PC 파일 bytes와 재불러오기 일치, 성공/취소/실패 구분, 비신뢰 JSON 제한/버전 검사, 원본 바이너리·native handle 미포함, 새 수업 복원과 원본 재연결.
- 전체 범위: PRD v5 §14/28 Stage B 일부. PDF 복사본·종료 저장 게이트·재생·후속 포맷과 실제 Whale 인수는 후속이며 전체 목표는 유지한다.

## 영향
- storage/sessionBundle.ts: 버전1 JSON 생성/입력 크기·깊이·자료·페이지/shape 제한과 복원용 정규화.
- export/localFile.ts: File System Access 새 파일만 쓰기/close/readback; fallback downloads saveAs/uniquify/요청ID 이벤트와 최종 검색 검증. 필요 권한 downloads만 추가.
- shared/sessionMessages + SessionHub: Launcher IMPORT_SESSION만 허용, 생성 UUID/strict add/revision0/발표 대기/기존 수업 덮어쓰기 금지.
- Editor/Launcher: 확정 초안만 파일 저장, 편집 중 저장 잠금, 불러오기 오류 보존/완료 여부 상태.
- 위험: 원본 덮어쓰기, 다운로드 조기 완료, 오래된 snapshot 저장, 원격 편집 중 성공 상태 오표시, 악성 파일/과대 입력/노트 노출.

## 단계
1. [x] 순수 bundle 생성/검증/안전 복원 및 단위 테스트.
2. [x] 파일 저장 경계/완료·실패·취소 테스트와 최소 권한.
3. [x] 실제 strict Hub 복구와 UI 저장/불러오기 연결.
4. [x] check + 실제 PC 파일/재불러오기 보조 브라우저 시험, Whale 제한/다음 단계 기록.

2026-10-11: 111개 자동 테스트/check 및 build+CSP 실제 PC JSON/read/import·native OPFS 출력 PASS. 종료 권한 저널/PDF 복사본/actual Whale/OS chooser는 아직 미완료이며 전체 제품 목표는 plans/2026-10-11-product-completion.md에 유지한다.

## 정책
- dirty는 원본 대비 변경으로 유지한다. 백업 성공만으로 PDF 복사본 저장 여부나 안전한 종료를 자동 확정하지 않는다. 저장된 snapshot revision을 안내하며 쓰는 도중 생긴 변경은 별도 백업이 필요하다.
- 확정 전 Editor draft는 백업 대상이 아니다. 파일 선택/저장 중 창 닫힘은 성공으로 판정하지 않는다.
- native 파일 참조는 새 복구 수업에 이식하지 않는다. 동일 fingerprint의 원본을 사용자에게 재선택받는다.
- 최신 구현 포맷 PDF만 복구 활성화한다. 미래/미검증 포맷은 구체적인 오류로 거부하며 기존 상태는 유지한다.
