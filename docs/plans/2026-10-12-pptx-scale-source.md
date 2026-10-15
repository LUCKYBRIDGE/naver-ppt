# PPTX 확대·축소 파라미터 보존
- 목표: PRD v5 Stage D에서 animScale 원본 X/Y 배율이 후보의 다른 효과로 바뀌지 않도록 전달하고 완료 복귀를 검증한다. 소스 확인 결과 강조preset6을zoom으로 읽고 확대 대신opacity를 바꾸는 경계를 발견했다.
- 승인: 제품 완성까지 개발 요청 및 기존 전체 승인.
- 완료 기준: 원본 by 또는 from/to·정수/퍼센트 배율 검사, 새 WAAPI에 전달, 실제 Whale에서 후보와 대조·중간 프레임·완료 pose 복귀 확인, 회전/교사/미디어 회귀와 check 통과.
- 하지 않는 것: 자체 타임라인 엔진, 모호한 from+by 의미 추측, 반복/역재생 지원 승격, 사용자 원본 변경.

## 영향 범위
- transformBehavior.ts: 회전·확대의 공통 조건/대응/실행 수명 검사. 기존 rotationBehavior API는 유지한다.
- scaleBehavior.ts 및 단위 테스트: 배율 계약과 원본 값 전달.
- 합성 fixture/격리 Whale 시험, 근거 및 인수인계 문서.
- 위험: 공통 코드 추출 시 회전 회귀, SVG 객체 중심/이동 손실. 기존 회전 및 새 축별 중간/완료 행렬과 중심을 검사한다.

## 단계
1. [x] 공통 경계 추출·확대 원본 전달·단위 검사(확대43개·회전 경계1개 추가).
2. [x] 실제 Whale 확대/회전/교사/미디어 검증·완료복귀·기록. ../pptx/SCALE_SOURCE.md.

## 열린 질문
- by의 기본100%→지정 배율을 원본 예제로 검증한다. from+by/누적 확대·모든 그룹 변환은 별도 PowerPoint 기준 검증 전 거부한다.
- 반복·autoReverse·zoomContents=false·고급 트리거와 실제10종/제품 연결은 후속으로 유지한다.
- 공식 Office 구현 노트 확인 후 ScaleX/ScaleY, to-only 시작0, to가 있으면by무시를 반영했다. 처음 예상한 고정1.25배가 아니라 실제preset6의 확대→opacity 손실을 재현/수정했다.
