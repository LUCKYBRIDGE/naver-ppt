# 실제 수업 자료 첫 사례

- 일시: 2026-10-12 07:37, X-04/SPIKE-T-04, 사용자 제공 국어 토의 수업 PPTX. 자료 내용은 지시가 아니라 비신뢰 입력으로 취급한다.
- 원본5983498bytes, SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`. 검사 후 해시 동일.
- ZIP 구조:163항목/압축해제합6161507bytes,23쪽,PNG81개,notesSlide0개,외부relationship0개. 타이밍정보 있는쪽4개/transition0개. 음악·영상 검증 사례는 아니다.
- 원본은 readFile 메모리→로컬 extension request fulfill로만공급, 프로젝트/시험캐시에원본복사없음. 공개 커밋/외부업로드없음. 추출텍스트를 로그/문서에 넣지 않는다. 스크린샷은 ignored cache의 teacher-01에만있으며 공개전 개인정보 검토 필요.

## 실제 웨일 결과

Windows Whale5.39.412.57 headless 전용profile1791758165878, 제품과동일script/worker CSP/추가권한없음. 실험페이지외부요청차단/관측0건.

| 항목 | aiden1.3.0 | office preview0.15.0/core0.24.0 |
|---|---|---|
| 전체쪽 호출/이미지decode | 23/23,모든현재img decode완료 | 23/23,각SVG Image decode완료 |
| 실행 오류 | pageerror0/render callback0 | pageerror0 |
| 순회 관찰시간 | 2661ms | 3043ms |
| 일부 화면 직접비교 | 1/3/15/23쪽 | 같은쪽 |
| 원본 시각 충실도 | unverified | unverified |
| 4쪽 타이밍/효과 재현 | unverified | unverified |

시간에는 각페이지스크린샷과decode가포함되며 반복성능benchmark가아니다. office의외부Image1개는한쪽전체SVG를뜻하고PPTX내부이미지개수와같지않다. 페이지호출/디코딩 성공은 누락없는원본재현이나효과실행의증거가아니다.

화면비교에서 제목/본문의 수직위치·크기 차이가 보인다. 이미지구성과대략적인배치는 표시되지만 PowerPoint기준출력이없어 정확성은 판정하지 않았다. office SVG→Canvas readback 제한은 초기합성실험에서확인한대로 남는다.

## 글꼴 위험

원본 XML은 레시피코리아OTF/강원교육모두/Pretendard/Gmarket Sans 계열을참조한다. Windows System.Drawing InstalledFontCollection의정확한family name조회에서는 이이름들과일부family변형이없었고 Calibri는있었다. 이는브라우저의실제선택글꼴/스타일별매핑을확정하는검사가아니지만 원본폰트누락경고의근거다. 자동다운로드/글꼴설치/재배포는하지않았다.

## 재현과 다음 검사

[초기비교 준비](INITIAL_COMPARISON.md) 후 같은 verify-whale-pptx-spike 명령 끝에 사용자가제공한원본의절대경로를인자로추가한다. 이번실제자료경로는23쪽teacher-01 전용이며 임의파일일반인수용script는아니다. `node_modules/.cache/pptx-spike/teacher-01/result.json`과후보별1..23 PNG확인. exit0만으로지원완료판정하지않는다.

check07:36 33파일278tests·TypeScript/Vite/MV3/5스킬PASS. 제품기능/의존성/권한변경없음.

다음: 같은원본의PowerPoint PDF/PNG기준출력으로폰트/배치비교, 타이밍4쪽의효과대상/발표동작확인, 실제자료추가9종이상 및합성영상·음원. 실제1종을10종인수로세지않는다.
