# PPTX 원본 참조 연결
- 목표: Editor에서 읽은 PPTX 원본을 메모리 채널/허용된 핸들로 Player에 연결하고 내용 변경을 거부한다.
- 승인: 제품 완성까지 개발/기존 전체 승인.
- 완료 기준: bounded File/hash 입력 단위검사, 별도 PPTX vault, 실제 웨일 Editor→Player 및 새 Player 원본 재연결 후 효과 복원, check.
- 하지 않는 것: 일반 UI 지원 활성화, 원본 자동복사/업로드, ZIP·renderer 검사 대신 header를 충실도 증거로 사용.
## 영향 범위
- adapters/pptx/input.ts와source.ts, 단위검사, 격리 native owner fixture의 원본 전달 경로.
- 기존 PDF/media vault의 기본 검증은 유지한다. PPTX 전용 채널은 기존 SourceVault/128MB·16개/512MB 한도를 재사용한다.
- 위험: 다른 원본/위조 fingerprint/권한 만료. handle 또는 채널에서 읽은 원본은 SHA256 재검사하며 파싱 전 기존 package guard가 다시 검사한다.
## 단계
1. [x] 입력 및 전용 vault·내용변경/참조/메모리 정책 검사: 신규단위9개.
2. [x] 실제 제품 Player URL에 Editor 원본 연결·새 owner 복원/native와check 기록: 660tests/빌드와Whale1791811295375 PASS. 일반UI와물리핸들은후속.
