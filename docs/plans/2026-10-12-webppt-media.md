# web-ppt 미디어 후보 검증
- 목표: 합성 PPTX의 음원/영상을 안전하게 추출해 로컬 재생 가능성과 전환 정지를 확인한다.
- 승인: 전체 제품 완성까지 계속 개발 포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 소유 Blob URL/종류/MIME 경계 회귀, 기존 합성 WAV/MP4의 바이트 hash와 모델 비교, 실제 Whale metadata/무음 재생·전환 정지·외부0.
- 하지 않는 것: 원본 교사 파일 변환, SVG media player의 HTML 직접 삽입, 소리/모든 코덱/고급 효과 성공 주장, 제품 PPTX 지원 승격.
## 영향 범위
- src/adapters/pptx/mediaReference.ts 및 단위 테스트, 기존 web-ppt 스크립트의 명시적 --media 모드, 검증/인수인계 문서.
- 위험: 모델 종류와 원본 MIME 불일치, 외부 URI 자동 실행, Blob 해제 전 진행 중 미디어 정리. 기존 package guard/readMediaInput을 재사용한다.
## 단계
1. [x] 미디어 참조 경계 및 자동 회귀22개. check397tests.
2. [x] 실제 Whale 합성3쪽/원본 media hash·재생·픽셀·정지/대기복귀, 기존 teacher 회귀와 문서. 제품 연결 및 스피커/다른 코덱은 후속.
