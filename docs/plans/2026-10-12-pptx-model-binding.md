# PPTX 등록 ID와 모델 대응
- 목표: 원본 manifest 순서/등록 UUID를 검증된 Worker 모델에 연결해 다른 쪽 효과를 잘못 적용하지 않는다.
- 승인: 제품 완성까지 개발/전체 승인.
- 완료 기준: 지문·개수·ID·경로 불일치 거부 단위검사, 실제 Worker 순서변경의 내용/효과 대응, 실제 등록 UUID로 runtime 효과 저장/새 Player 복원, check.
- 하지 않는 것: 파서순서의 개수만으로 검증완료 주장, 일반 UI 활성화/원본 충실도 승격.
## 영향 범위
- PPTX modelBinding, 단위검사, native fixture/owner검증의 임의A/slide-1 대신 실제 등록 UUID 연결.
- 공식0.4.5 parser는원본sldIdLst/관계순서로모델을만든다. 실제Worker순서변경에서도고유제목/표/효과가같이이동하는지검사한다.
## 단계
1. [x] 등록/원본/모델 대응 경계: 단위17개.
2. [x] 실제Worker순서/등록UUID 효과저장·복원/check기록: 687tests·빌드/Whale원본순서·제목/표/효과모델 대응·등록UUID5단계/새Player복원·teacher-01 23쪽대응 PASS. 일반UI/충실도는후속.
