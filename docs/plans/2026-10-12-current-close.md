# 현재 자료 종료와 재개
- 목표: 현재 자료만 종료해 Player를 검정 대기로 만들고, 선택한 저장 실패/취소에는 발표를 유지한다. PRD v5 §6.3/14/28, FR-015/020.
- 완료 기준: Remote 종료 선택→필요 시 실제 backup worker 재검증→revision CAS commit→현재만 closed/검정 대기. 다른 자료/Editor 선택/미확정 draft 유지. 명시적 재개 및 재시작 복구, 자동·실제 Whale 검증.
- 하지 않는 것: 전체 종료, 영구 삭제, PDF 복사본/미디어 구현, 전체 제품 완성 판정.

## 영향 범위
- core doc `closed?: boolean`, CLOSE_DOCUMENT/REOPEN_DOCUMENT; 저장 schema1 이전 필드 없는 자료는 열린 상태. 문서/델타/Editor를 삭제·unmount하지 않는다.
- teacher close 전용 요청만 내부 CLOSE 명령으로 변환. SESSION_COMMAND로 saved gate 우회 불가. saved는 file 재검증 직후 기존 repository CAS; without-backup은 명시 확인, unchanged는 대상 dirty=false만 허용.
- Remote dialog/SaveControls/재개 버튼, validator/테스트/실제 Whale script/정책·ADR.
- 위험: 현재 종료에 다른 자료 자동 노출, 다른 Editor 초안 손실, 저장 확정과 임시 복구 혼동, 늦은 saved 명령.

## 단계
1. [x] pure close/reopen 및 이전 schema fixture, 현재만 변경/타이머·북마크 정지/정규화 검증.
2. [x] worker saved 검증과 unchanged/without-backup 정책, strict CAS/receipt 후 ACK.
3. [x] Remote 선택/취소/실패/재개 UI, Editor 종료 표시(초안 보존).
4. [x] 단위/통합/Whale current close→black/다른 자료 유지/초안 보존/재개/restart 및 문서.

## 결정
- 앞선 메모의 '모든 Editor draft freeze'는 삭제형 종료의 위험을 가정한 구현 후보였다. 현재 종료는 발표 대상에서만 제외하고 모든 데이터·Editor 초안을 그대로 보존하므로 freeze/파괴적 정리를 도입하지 않는다. saved 선택도 '확정 편집정보'만 저장함을 명시한다. 실제 영구 삭제나 전체 창 종료를 구현할 때 별도의 draft handshake/확인이 필요하다.
- closed 자료는 보존 목록에 남고 다시 발표는 명시적 명령이다. '새 백업 없이 종료'도 임시 복구 데이터를 삭제하지 않으며 성공 저장으로 표시하지 않는다. 원본/로컬 결과 파일은 삭제하지 않는다.
- user 포괄 진행 승인 적용. 전체 제품 Stage A~G 범위는 유지한다.
