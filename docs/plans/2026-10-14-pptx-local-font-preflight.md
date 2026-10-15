# PPTX 로컬 글꼴 참조 사전검사

- 목적: PRDv5 §9/10/24 Stage C/D의 누락 글꼴을 조용히 대체하지 않는 안내를 개선한다. 전체 충실도 인수를 대체하지 않는다.
- 승인 근거: 제품 완성 지속 개발과 충실도 방향 점검 우선 요청. 기존 원본·변경은 보존한다.
- 실제 선행 실험: Whale5.39.412.57 headless 1791909685232, 동일MV3 CSP/권한에서 Calibri/MalgunGothic/맑은고딕 local참조 resolved, 원본지정2종/가짜명 unresolved. 원본불변/학생화면독립/외부0/pageerror0. 설치·실제사용·license 보증 아님.
- 영향: 기존XML파싱에optional 슬라이드typeface observer, bounded로컬probe, 신규등록/별도원본검사 Preflight, 단위/실제Whale검증·문서. 저장schema/권한/의존성/제품폰트선택 변경없음.
- 경계: 실제slide XML의명시typeface중유효한고유명최대64종만검사. theme token·제어문자·과도한이름은probe하지않는다. layout/master상속·theme해석/embedded활용·glyph coverage·줄바꿈/실제적용/라이선스는미확인. FontFace를document.fonts에추가하지않고local만사용한다. 결과는숫자만·이름/본문은저장하지않는다.
- 수명: 대기타이머1.5초/취소즉시전파/타이머·abort listener해제/늦은완료무시. API부재·시간초과는unknown,참조실패는warning이며미설치단정없음. 신규등록취소시vault/세션변경없음. 동일hash재사용/재연결은미검사안내를표시하고기존빠른경로를유지하며별도원본검사로재검사한다. OS lookup/브라우저event loop의실시간상한보증은아니다.

## 확인할 단계
1. [x] 실제Whale설치한글별칭/없는명/기존CSP 선행실험.
2. [x] bounded collector/probe/보고서·슬라이드observer·등록/파일검사 연결.
3. [x] 중복/64종/비신뢰이름·API부재·실패/시간초과·취소/늦은결과/원본안전 단위검증.
4. [x] 전체check·실제Whale제품등록안내/학생화면보호·별도파일검사/취소회귀·문서와인수인계.

## 결과와 남은 인수
- 최종 check 01:50:08: 90파일/1,288tests·타입/Vite/MV3/5스킬 PASS. 신규10개와 기존 재연결 안내 assert 포함. localFonts 생산 JS 1,963bytes, 실행은 명시적 등록/점검 때만이다.
- 실제 Whale 제품 경고1791909913244, 원본 점검1791910059593, 최종 교사제품1791910232777, PDFfoundation profile-1791910026064 모두 exit0. 원본 hash·학생화면 보존, 취소/늦은결과·timeout unknown·재연결 미검사 안내 확인. 초기 검사 취소 클릭 실패1791909982775는 별도 기록하고 Editor를 앞으로 가져와 사전 scroll·실제 버튼 focus/Enter로 검증했다. [상세](../TEST_RESULTS.md).
- 이 계획의 명시참조 검사 연결은 완료했으나 Stage C 전체 완료는 아니다. 실제 font 적용/줄바꿈·상속/theme/embedded/glyph/license·원본 앱/물리 인수와 1쪽 배경/이미지 차이, 실물10종·최종 충실도는 남는다.
