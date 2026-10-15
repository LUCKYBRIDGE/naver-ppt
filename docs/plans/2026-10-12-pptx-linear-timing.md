# PPTX 기본 시간곡선 보존
- 목표: 원본 가속·감속이 없거나 명시적으로0인 회전/확대를 선형 시간으로 재생한다.
- 승인: 제품 완성까지 개발 및 기존 전체 승인.
- 완료 기준: 새 소유 WAAPI에만 linear 적용, 조건 경계 및 실패 정리 단위검사, 실제 Whale 원본시간 기준 중간값/역재생/분수완료 검사와 check 통과.
- 하지 않는 것: 비영 가속·감속, speed/필터/중첩 시간곡선 지원 승격, 실제 PowerPoint 픽셀 기준 대체.
## 영향 범위
- transformBehavior.ts, 회전/확대 단위 mock, 반복 합성probe/Whale verifier, 증거 문서.
- 위험: 원본 타임라인과 무관한 효과 변경. 검증된 회전/확대 source map에 한정한다.
## 단계
1. [x] 기본/명시적0 조건과 native linear 적용 및 실패 검사.
2. [x] 실제 Whale 중간/분수 완료·기존 회귀/check 및 결과 기록.

결과와 미검증 범위: [LINEAR_TIMING](../pptx/LINEAR_TIMING.md).
## 근거
- Microsoft CommonTimeNode의 accel/decel 정의 및 python-pptx 공식 저장소의 CT_TLCommonTimeNodeData 기본0% 스키마.
