# 실제 Player transport와 소유권 검증
- 목표: PPTX bridge가 제품 runtime 메시지로 strict ACK를 받고 소유 Player만 실행한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: 공개snapshot transport/ACK단조성·세션/명령 경계 단위검사, 실제웨일 제품background의owner/duplicate/다른수업/Editor/Remote 거부·전환/reset/재접속 검사, check.
- 하지 않는 것: PPTX 지원승격/제품renderer UI 활성화, 새 권한, 원본 자료 복제.
## 영향 범위
- player/pptxTransport.ts, 단위검사, 격리복제제품extension native 시험과기록.
- 위험: 과거 ACK가 새공개상태를덮거나비소유Player가commit. 현재공개revision/세션/종류와runtime의실제sender owner검사를확인한다.
## 단계
1. [x] transport 구현·단위검사.
2. [x] 실제제품background runtime/owner 검증·check 및기록.

결과/미검증 범위: [PLAYER_TRANSPORT](../pptx/PLAYER_TRANSPORT.md).
