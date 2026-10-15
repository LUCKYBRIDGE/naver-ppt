---
name: local-save
description: 웨일 클래스 프레젠터의 IndexedDB 델타, 로컬 편집정보와 PDF 복사본, 다운로드 완료, 원본 재연결 및 복구를 구현할 때 사용한다.
---

# 로컬 저장과 복구

[PRD v5](../../../naver-ppt_PRD_v5.md) §14/28을 우선한다. 상태와 command receipt의 원자적 저장 및 revision CAS를 구현하고 실제 브라우저 재시작 복구로 검증한다. repository 대역 통과는 실제 영속화 증거가 아니다.

[STORAGE_POLICY.md](../../../docs/STORAGE_POLICY.md)와 [DATA_CONTRACTS.md](../../../docs/DATA_CONTRACTS.md)를 기준으로 한다.

- 원본은 참조/읽기만. IndexedDB는 델타·참조·복구 저널이고 정식 백업은 로컬 `.wcp.json`이다. Blob/File/원본 바이트·미디어 전체를 기본 세션 JSON에 넣지 않는다.
- File System Access 핸들은 별도 키/권한으로 관리한다. 원본 이동·만료 시 사용자 재선택과 metadata/필요 시 fingerprint 확인을 거친다. 추정 경로에서 개인 파일을 찾지 않는다.
- schemaVersion과 format을 저장하고 가져온 JSON을 런타임 검증한다. migration과 이전 파일 fixture 복원 시험을 함께 추가한다.
- PC 파일 생성 완료를 확인한다. 다운로드 시작/Blob 생성/캐시 저장은 성공이 아니다. downloads 이벤트와 요청 ID를 연결하고 취소/실패 시 dirty·델타를 보존한다.
- 새 파일명과 충돌 회피를 사용한다. 임의 절대경로 접근을 가정하지 않는다. 정식 편집정보와 PDF/PPTX 복사본을 별도 선택으로 제공한다.
- 종료는 요청→저장/폐기 의사→결과→확정 순서다. 개별 종료는 다른 자료 상태를 유지하고 전체 종료는 자료별 선택을 제공한다. 선택 저장이 실패한 대상은 제거하지 않는다.
- 원본/편집정보/캐시 삭제를 구분한다. 사용자가 저장 안 함을 선택한 작업본 보존 시점은 명시적인 정책으로 결정하고 기록한다.
- PDF의 미디어/타이머 제외, PPTX 정적 대안/효과 손실, 폰트 embedding 조건을 내보내기 흐름에 반영한다.

시험에는 다운로드 완료/취소/오류, 이름 충돌, 원본 해시 불변, 외부 뷰어 열기, 강제 종료 복구, 파일 이동/권한 만료 후 재연결을 포함한다. 브라우저 mock 테스트와 실제 PC 파일 확인 결과를 분리해 [TEST_RESULTS.md](../../../docs/TEST_RESULTS.md)에 기록한다.
