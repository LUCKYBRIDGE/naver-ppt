# PPTX 유한 반복·역재생 시간 전달
- 목표: PRD v5 Stage D에서 회전/확대의 유한 repeatCount와 autoRev 및 이후 afterPrev 시작 시점을 보존한다.
- 승인: 제품 완성까지 개발 요청 및 기존 전체 승인.
- 완료 기준: 천분의1 횟수/boolean·한도 검사, 기존 엔진에 전체 소요시간을 전달하고 native WAAPI에 반복 조건 적용, 실제 Whale 반복/역재생/afterPrev·자료전환취소와 기존 회귀·check 통과.
- 하지 않는 것: 자체 스케줄러/타이머, 무한반복·repeatDur/중첩 상위 반복·accel/decel 지원 승격, 원본 수정.

## 영향 범위
- repeatTiming.ts 및 단위 검사, transformBehavior 원본조건 연결.
- 격리 Whale 시험과 합성 반복 probe, 결과/인수인계 문서.
- 위험: 역재생 소요시간 계산·다음 그룹 시작이 잘못되는 것. 기존 playGroup에 active span을 전달하고 실제 native delay와 중간/완료값을 확인한다.

## 단계
1. [x] 원본 유한 조건 계약/시간 투영/네이티브 적용 구현·단위 검사.
2. [x] 합성 원본을 실제 parser/Worker로 읽어 반복/역재생/afterPrev/취소·기존 회귀 검사 및 기록.

검증 결과와 미실시 항목: [REPEAT_TIMING](../pptx/REPEAT_TIMING.md). 전체 제품 완성과는 별도다.

## 열린 질문
- 전체 PowerPoint 시간곡선·원본에 의한 pixel 비교/실물10종 및 제품 Player/DB 연결은 미완료로 유지한다.
- 단일 behavior 또는 단일 effect의 조건만 전달한다. 두 계층 동시/상위 mainSeq 반복은 전체 타임라인 의미를 검증하기 전 거부한다.
