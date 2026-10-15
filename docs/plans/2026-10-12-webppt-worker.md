# web-ppt Worker 파싱 검증
- 목표: 고정 후보의 공식 Worker 파싱/자산 전달을 로컬 웨일에서 실행하고 본 화면 결과와 대조한다.
- 승인: 전체 제품 완성까지 개발 포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 결과 모델 기본 구조/자산 크기 제한 회귀, 교사23쪽 및 합성미디어3쪽 Worker 요약 대조·기존 실제 재생 회귀, 시간초과/취소/원본 보존/외부0.
- 하지 않는 것: 라이브러리 보안 인증, XML 검사 전체 Worker 이전, 제품 채택/지원 승격.
## 영향 범위
- adapters/pptx/workerEnvelope.ts 및 테스트, 기존 web-ppt 실험의 Worker bundle/실행 수명, 검증 문서.
- 위험: Worker API에는 timeout/취소가 없고 원시 예외를 반환한다. 결과 제한/오류 비노출 및 모든 종료 경로 terminate가 필요하다. 기본 모델 검사는 전체 schema 검사와 다르다.
## 단계
1. [x] Worker 결과 제한/회귀23개 및 로컬 고정 bundle. Worker 초기화 보존/실패 exit 검사 추가.
2. [x] 실제 Whale teacher/media 모델·전체 자산 hash 대조·강제 지연 timeout/취소·기존 실제 효과/미디어 회귀와 문서. 제품 지원 승격 아님.
