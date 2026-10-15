# 제품의 로컬 PPTX 모델 검사

2026-10-12 23:16 · Stage C/D, FR-004, X-04 / SPIKE-T-04.

## 변경과 경계
- 제품 Editor의 `후보 모델 검사`를 선택하면 구조·XML·원본 순서 검사 후 고정 `@web-ppt/core@0.4.5` 공식 Worker를 실행한다. 기본값은 꺼짐이다.
- 기존 aiden/office/web-ppt 비교, 실제 teacher-01과 합성 효과/미디어 실험을 근거로 **모델 진단에만** 이 파서를 사용한다. 일반 발표 렌더러 확정/고급 효과 활성화가 아니다. [공식 소스](https://github.com/unStone/web-ppt)와 로컬 고정 패키지/LICENSE 확인.
- 모델/자산은 Worker 안에서 envelope와 중첩 한도를 검사한다. 주 화면으로는 9개 숫자만 반환하며 본문·노트·링크·자산 bytes/Blob URL은 전달하지 않는다. 세션/SourceVault/DB/원본 파일을 쓰지 않는다.
- 전용 Worker `ready` 뒤 사본을 transfer한다. 시작/로딩 포함 최대 15초, 사전 취소·진행 취소·전송/런타임/응답 실패·성공 모두 terminate하고 이벤트/타이머를 정리한다. 응답 ID/숫자/개수 일관성과 원본 XML 쪽수 일치를 검사한다.
- library sideEffects 때문에 dynamic import와 Worker treeshake:false 각각으로도 초기화가 제거됐다. Worker 전용 Vite transform에서 **해당 공식 worker.js만 moduleSideEffects:true**로 보존한다. 본 화면/ZIP Worker tree shaking은 유지한다. 수정 없는 transform의 map:null로 경고도 제거했다.
- top-level await 로딩 중 최초 메시지가 사라지는 실제 실패를 진단하고 ready handshake로 수정했다. ready 전 응답/중복 ready는 거부한다.
- 0.4.5 MIT Copyright2026 unStone 원문을 `licenses/web-ppt-core-LICENSE`로 동봉한다. package-lock SHA512는 이전 검증 tarball과 같다. Worker 초기화/라이선스 누락은 빌드 검사에서 거부한다.

## 검증
- check23:14:57: **55파일729tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규20개: 모델 Worker 수명/응답/사본/취소/timeout/전송오류와 File 검사 opt-in/선행 guard/원본 쪽수 불일치/늦은 취소.
- Whale5.39.412.57 headless 실제 제품dist, profile `node_modules/.cache/whale-pptx-inspection/1791814518163/profile`.
- teacher-01: 원본23쪽·타이밍4쪽, 모델23쪽·요소174개·효과4쪽12개. 대체/미확인종류/미디어/전환/숨김은0이지만 absence를 완전 지원으로 판정하지 않는다.
- 구조 검사에서는 모델 Worker 미요청, opt-in 때만 요청. 외부 HTTP 요청0. 실제 로컬 공식 파서 응답과 terminate를 계측했다.
- 실행 전후 전체 수업·공개 snapshot/PDF Canvas 전체 SHA256 유지. 잘못된 새 파일은 성공 결과 폐기. ZIP 및 모델 Worker 각각 send 지연→키보드 취소→native terminate→늦은 send 이후 결과 없음·Canvas 불변.
- 1920/1366/1280/768/380px 가로 넘침 없음. 380px 결과 화면 직접 확인, 원본hash불변/pageerror0.
- 이전 제품의 전체 foundation 회귀도 profile1791813668333에서 PASS: PDF/비공개 편집·저장/복구·미디어·소유권/서비스 워커 재시작. 이 회귀는 이번 모델 패키징 전 실행이다.
- 제품 Worker 자산은 wrapper2980bytes+공식parser95413bytes(소스맵 제외). 미선택 때 로딩하지 않으며 PDF Player JS 크기12940bytes/해시는 이전과 동일하다. 실물 대용량 메모리/성능 보증은 아니다.

## 제한 / 다음
- headless/native File input와 send 지연 계측이며 물리 OSchooser/CPU 파싱 중 취소/스피커·듀얼모니터 인수는 아니다.
- 모델 검사 pass는 개수 경계만 의미한다. 원본 화면·정확한 순서/본문·폰트·효과 실행·미디어·전체 오프라인은 미검증이다.
- 실제 PowerPoint 기준/추가9종과 일반 PPTX 등록·Player 렌더 dispatch·비공개 미리보기·파일 백업은 계속 남는다. PPTX **unverified 유지**.
- 재현: DEVELOPMENT.md의 Node/Playwright/Whale 경로로 `verify-whale-pptx-inspection.mjs` 명령 실행. 사용자 자료는 외부 전송/저장/수정하지 않는다.
