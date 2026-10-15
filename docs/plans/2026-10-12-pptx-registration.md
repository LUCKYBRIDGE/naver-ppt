# PPTX 등록 준비와 빠른 검사
- 목표: 검사된 PPTX의 원본 슬라이드 순서·고유 ID·지문으로 등록metadata를 준비하고 기존 자료 재연결 시 상태를 유지한다.
- 승인: 제품 완성까지 개발/전체 승인.
- 완료 기준: manifest 관계/순서·중복·외부/없는쪽 거부, import 실패/재연결 불변 단위검사, 실제 Whale XML 공격/등록준비·기존 통합회귀, check.
- 하지 않는 것: 일반 UI 지원 활성화/충실도 확정, 원본자동저장·새제품후보의존성.
## 영향 범위
- PPTX slideOrder/import, 기존 registrationPreflight의형식별문구, 단위검사·owner native fixture.
- XML 순서는 presentation.xml의 sldIdLst/relationship을 사용하며 ZIP 파일명 정렬을 사용하지 않는다.
- 위험: 잘못된자료/개수·재연결로델타손실/읽기실패성공고지. 준비함수는세션불변/등록ACK 전고지금지, 신규package검사와재연결hash확인을구분한다.
## 단계
1. [x] 원본순서/등록준비/빠른검사 및단위검사: 신규10개.
2. [x] 실제XML/등록준비·기존통합회귀/check와문서기록: 670tests·빌드/Whale1791811787600 합성등록·9거부·teacher-01 23쪽 준비 PASS. 일반UI/충실도는후속.
