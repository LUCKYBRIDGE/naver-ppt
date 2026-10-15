# 실제 renderer와 제품 runtime의 결합
- 목표: 실제 Worker 모델의 효과 완료pose를 소유Player runtime ACK로 저장하고 A/B/A·원본재파싱 복원한다.
- 승인: 제품완성까지 개발 및 기존전체승인.
- 완료 기준: 공식엔진 상태/그룹과 원본 transform 전달을 재사용하는 driver·모델/수명 경계 단위검사, 실제 제품 background/Player sender의 원본효과→strict ACK→복귀 시험, check.
- 하지 않는 것: 미검증 renderer의 일반지원 활성화, 새 권한/원본 자동저장, 실제10종/PowerPoint 충실도 대체.
## 영향 범위
- adapters/pptx/engineDriver.ts, 단위검사, 실제owner시험의 격리 renderer 모듈 연결/결과기록.
- 위험: 같은쪽의 모델과 checkpoint 불일치/늦은 engine start/사라진 source 대상. 파싱모델 동일성/그룹수·target·disposal 검증과 기존 bridge invalidation을 사용한다.
## 단계
1. [x] 재사용 engine driver 및모델/수명 검증: 단위11개.
2. [x] 실제renderer+제품runtime 통합/회귀/check 기록: 651tests·빌드 및 Whale owner1791810925735 PASS. 일반 제품 UI 활성화는 별도 후속이다.
