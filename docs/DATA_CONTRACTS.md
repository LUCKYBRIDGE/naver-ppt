# 데이터와 메시지 계약

코드의 기준 계약은 `src/core/types.ts`, `commands.ts`, `events.ts`, `src/overlays/types.ts`, `src/media/types.ts`, `src/storage/types.ts`, `src/export/types.ts`이다. 현재는 타입 계약이며 입력 검증·reducer·마이그레이션·DB 구현은 없다.

## 식별과 선택

- 자료 ID와 슬라이드 ID는 재정렬에 영향받지 않는다. 파일 경로를 ID로 쓰거나 배열 순서를 식별자로 저장하지 않는다.
- `presentedSelection`과 `editorSelection`을 독립 객체로 둔다. 자료 선택은 `ACTIVATE_DOCUMENT`, 자료 안 이동은 `GOTO_SLIDE`, 편집 선택은 `SELECT_EDITOR_SLIDE`로 분리한다.
- 웹 W0의 슬라이드 개수/위치는 `null`. 확인하지 않은 값을 1이나 가짜 썸네일로 대신하지 않는다.
- 명령의 `revision`은 적용 전 기대값이다. 늦은 변경 명령을 거부하고 snapshot을 갱신한다. 중복 commandId는 다시 적용하지 않는다.
- 대상 없는 전체 종료는 documentId/slideId를 명시적 null로 둔다. 세부 명령별 필수 대상과 같은 세션에 속하는지 검사한다.

## 공개 상태와 draft

편집 중인 텍스트·선택 핸들·DOM ref·File/Blob·object URL은 UI/실행 상태로 관리한다. 승인된 슬라이드 델타만 공개 snapshot과 영속 모델에 넣는다. 현재 발표 슬라이드에 대한 draft는 기본적으로 확정 전 청중에게 보이지 않는다. 즉시 반영 옵션은 명시적으로 선택한 경우에만 사용한다.

## 좌표·글꼴

- 오버레이 rect/point는 원본 슬라이드 기준 0..1. x/y/width/height와 경계가 유효한지 확인한다. 회전/shape는 이번 초기 UI에 추가하지 않았다.
- 글꼴 크기·내부 여백은 슬라이드 기준 viewport의 논리 px이다. 기준 viewport 치수, 폰트 파일 식별과 로드 상태를 renderer 구현 때 계약에 추가한다. Editor·Player·내보내기가 같은 기준을 사용해야 한다.
- `auto-max`는 실제 글꼴의 줄바꿈·폭·행 높이·여백을 측정한다. 상자 크기를 고정하고 최소 크기 불충족을 별도 결과로 반환한다.
- 스트로크는 정규화 점과 선 굵기를 저장하고, 마스크와 글상자는 별도 종류로 구분한다.

## 세션 파일

확장자는 가칭 `.wcp.json`, `format: whale-class-presenter`, `schemaVersion: 1`이다. `SessionBundle`은 원본 metadata/reference와 상태·델타만 가진다. 원본 바이트와 파일 핸들 자체는 포함하지 않는다. File System Access 핸들은 별도 저장 키로 참조한다.

내보내기 구현 시 JSON schema 또는 동등한 런타임 검증을 추가한다. 타입 검사만으로 가져온 JSON의 안전성을 가정하지 않는다. 지원 안 되는 버전은 작업 상태를 변경하지 않고 오류를 알린다. 버전 변경은 migration과 이전 fixture 복원 테스트를 함께 추가한다.

현재 종료 명령은 `REQUEST_CLOSE_*`이다. 저장/폐기 선택과 결과 확인 후 별도 확정 단계에서만 자료 제거와 검정 대기 화면을 적용한다. `ExportResult.complete`는 다운로드 완료가 확인된 결과만 나타낸다.
