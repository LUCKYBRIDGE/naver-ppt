# PPTX 편집정보 백업과 안전 복구
- 목표: PPTX 자료의 델타·완료 효과를 원본 복제 없이 기존 로컬 편집정보에 저장하고 새 수업에서 안전하게 복구한다.
- 근거: PRD v5 §14/28, FR-013/014/020. 제품 완성 요청의 기존 승인 범위다.
- 완료 기준: PDF schema1 호환, PPTX strict 검증/한도, 완료 pose 보존·새 scope/revision, 과거 request/run·native handle 제거, 실제 Whale 저장/복구/재연결 후 완료 효과 확인.
- 원본 업로드/덮어쓰기·자동 원본 복제·일반 PPTX 지원 승격은 하지 않는다.

## 영향 범위
- `src/storage/sessionBundle.ts`: 형식별 한도와 safe restore.
- `tests/unit/sessionBundle.test.ts`: 변조/호환/완료 pose/요청 제거/입력 불변.
- `scripts/verify-whale-pptx-player.mjs`: 실제 저장·복구·원본 재연결 후 제품 Player 검증.
- 위험: 저장파일 검증 시 상태를 바꾸면 원본 snapshot과 불일치, 복구 scope 불일치, 과거 요청 재실행.

## 단계
1. [x] strict bundle의 PPTX metadata/checkpoint 허용·복구 scope 변경·실행/요청 정지를 구현한다. (802tests·빌드 PASS)
2. [x] 기존 PDF 호환/변조 경계와 실제 Whale 백업·복구·재연결/Player를 검증한다. (PPTX1791825423523/foundation1791825446215 PASS)
3. [x] 결과/제한과 인수인계 기록을 갱신한다. ([근거](../pptx/LOCAL_BACKUP.md))
