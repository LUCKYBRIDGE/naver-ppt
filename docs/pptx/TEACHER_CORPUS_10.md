# 실제 교사 자료 corpus 10종

2026-10-15 확인. `test-materials/originals`의 실제 PPTX 10종과 `test-materials/powerpoint-reference`의 동일 stem PDF 10종을 파일명·크기·구조 메타데이터만 확인했다. 원본 본문이나 학생 정보는 문서에 복사하지 않는다.

| 자료 | PPTX 슬라이드 XML 수 | 기준 PDF 페이지 수 | PPTX bytes |
|---|---:|---:|---:|
| (7~8쪽)소프트웨어랑 친해지기 교재_학교 홈페이지를 방문해요.pptx | 2 | 2 | 1,100,416 |
| 01. 2022 연수자료_국어_초등.pptx | 67 | 67 | 3,597,504 |
| [언플러그드] 명령어 가을 그림그리기.pptx | 19 | 4 | 939,507 |
| osung_ai_digital_problem_solving_part1_workspace_v20_polished_20260930.pptx | 93 | 59 | 8,059,483 |
| 고요한 우연(1).pptx | 52 | 52 | 98,050,517 |
| 사회 5학년 1학기 2단원 공책정리(공통) (1).pptx | 8 | 8 | 10,148,908 |
| 이게 정말 나일까.pptx | 17 | 2 | 7,413,227 |
| 프로젝트01 나는야 해바라기v2.pptx | 16 | 16 | 2,099,590 |
| 프로젝트02 바람이 조절되는 선풍기.pptx | 13 | 13 | 2,046,035 |
| 행복한 반이 되기 위한 행동요령.pptx | 23 | 23 | 11,583,769 |

`sourceCount=10`, `pairedCount=10`은 자료 짝과 입력 corpus 조건을 충족한다. 페이지 수가 다른 3종은 PowerPoint 기준 출력이 동일한 발표 결과라는 뜻이 아니므로 Visual/Media/Behavior 인수의 통과 근거로 사용하지 않는다. 다음은 페이지 매핑·원본 앱 출력 조건·차이 원인과 실제 Whale 제품 경로 비교다.

실제 Whale 대표 시각 비교:

- `고요한 우연(1).pptx`의 1·26·52쪽과 기준 PDF를 제품 경로에서 비교했다. `verify-whale-pptx-visual.mjs` 결과 `executionPassed=true`, 3쪽 캡처, 원본 hash/외부 요청/독립 선택 검사를 포함한다. 결과 디렉터리: `node_modules/.cache/whale-pptx-visual/1792021356653`.
- 첫 2쪽 자료의 기준 PDF는 제품 비교 도구가 고정한 720×540과 다른 374px 높이로 렌더되어 `374 !== 720` assertion에서 중단됐다. 이는 해당 기준 출력 종횡비와 도구 고정 크기의 불일치이며, 제품 충실도 PASS로 세지 않는다. 비교 도구를 임의로 맞춰 결과를 숨기지 않는다.
