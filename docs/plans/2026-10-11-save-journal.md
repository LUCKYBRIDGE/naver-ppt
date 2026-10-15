# 로컬 저장 결과 저널
- 목표: 실제 파일 완료 확인을 통과한 captured revision의 저장 결과를 재시작 후에도 조회한다. PRD v5 §14, FR-013/014의 종료 게이트 기반이다.
- 완료 기준: 준비/완료/실패/취소 기록 strict transaction 완료, exact shape·해시·상태전이 검증, 재연결 및 실패/경쟁 테스트, 기존 저장/복구 보조 시험 통과.
- 하지 않는 것: 이번 저널만으로 자료 종료 승인, 원본/출력 bytes 자동 복제, 파일 존재 영구 보장. 전체 제품 계획의 종료 CAS·draft 조정·PDF 복사본은 남는다.

## 영향 범위
- 새 파일: `src/storage/saveJournal.ts`, 저널 통합 테스트.
- 변경: `src/export/localFile.ts`, `src/export/types.ts`, `src/editor/SessionSaveControls.tsx`, 검증 스크립트/정책/결과/인수인계.
- 별도 DB `naver-ppt-save-journal` v1로 기존 sessions v1을 변경하지 않는다. 저널에는 ID/revision/hash/bytes/time/transport/downloadId만 저장한다.
- 위험: picker 사용자 제스처 유지, 파일 완료 뒤 quota 실패를 저장 자체 실패와 혼동, 요청 success 뒤 abort, 중복 완료 덮어쓰기.

## 단계
1. [x] bounded 256건, add-only 준비/불변 captured 정보/단일 terminal 전이/strict 완료 저장. 한도 초과는 새 파일 쓰기 전 오류, 자동 삭제 없음.
2. [x] picker는 await 전에 실행. 준비 기록은 실제 writer/download 시작 전에 완료; terminal 기록은 파일 결과 확인 후. 저널 실패는 파일 성공과 구별하고 상태 보존.
3. [x] 단위/IDB 경쟁·abort·quota·재연결 검증과 빌드, actual PC 출력 보조 스크립트 실행.
4. [x] 정책/ADR/실험 결과/후속 종료 게이트를 기록.

## 열린 질문
- 사용자의 Whale 설치 후 5.39.412.57 실제 바이너리/전용 headless 프로필에서 기본 MV3/API/DB 시험이 통과했다. 설치 프로그램은 중복 실행하지 않았다. 보이는 창/OS chooser/Whale downloads 인수는 별도 증거가 필요하다.
- 종료 권한은 후속 worker 재검증 및 session CAS/draft freeze를 거쳐야 한다. 이 저널은 종료 토큰이 아니다.
- 사용자의 포괄 진행 승인을 적용해 계획 후 구현을 이어간다.
