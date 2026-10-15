# 종료 전 로컬 저장 증거 재검증
- 목표: 교사가 PC에서 선택한 편집정보가 완료 저널 및 현재 durable 수업과 일치하는지 워커가 독립적으로 확인한다. PRD v5 §14/28, FR-013/014.
- 완료 기준: 선택 파일→own Blob URL→bounded worker read→완료 저널/hash/bytes/session/revision/전체 확정 내용 대조→다시 revision 확인. Player 접근/remote URL/상태 불일치 거부, 자동·실제 Whale 시험.
- 하지 않는 것: 자료 종료/상태 삭제/dirty 해제/다른 Editor의 draft 승인. 후속 종료 동결·CAS 및 PDF 복사본 등 전체 제품 범위는 유지한다.

## 영향 범위
- `saveJournal.ts`: 완료 증거 조회. `backupVerification.ts`: bounded local read와 검증.
- `sessionMessages.ts`, `sessionHub.ts`, `background/index.ts`: teacher 요청 및 durable 현재 상태 대조.
- `SessionSaveControls.tsx`: 파일 재선택 확인. 단위/통합/Whale/PC 시험과 정책/결과/인수인계.
- 위험: arbitrary URL fetch/메모리 상한/과거 revision을 현재 저장으로 오인/외부 창 변경/개인 내용 Player 유출.

## 단계
1. [x] 완료 metadata 조회와 bounded own Blob URL 검증 구현. 원본·출력 자동 복제 없음.
2. [x] teacher-only 메시지/UI 연결, 확인 도중 현재 revision 재조회; 상태 변경/삭제 없음.
3. [x] 성공/내용변조/다른수업/old revision/준비·실패/외부 URL/권한/한도·경쟁 테스트와 실제 Whale 로컬 읽기.
4. [x] 기록/후속 종료 CAS/draft 보호 경계 명시.

## 열린 질문
- 반환된 확인 결과는 파일 확인 시점 증거이지 영구 파일 존재 또는 종료 토큰이 아니다. 종료 확정 때 다시 revision CAS와 draft 동결이 필요하다.
- 사용자의 포괄 진행 승인을 적용한다. 저널256건 보존/정리 UX는 다음 설계 항목이다.
