# Editor의 PPTX 원본 점검
- 목표: 교사가 실제 Editor에서 로컬 PPTX 구조/쪽순서/제한을 확인하고 발표 화면을 유지한다.
- 승인: 제품 완성까지 개발/전체 승인.
- 완료 기준: 원본검사/취소·실패·보고범위 단위검사, 실제Editor file input→결과/수업불변/Player불변·작은화면/오류확인, check.
- 하지 않는 것: 미검증PPTX 발표활성화, 원본자동보관/등록/업로드·model파싱/충실도성공으로오인.
## 영향 범위
- PPTX file inspection helper, Editor 원본점검 컴포넌트/기존CSS, 단위검사·실제owner시험UI회귀.
- 기존PPTX 원본/File·isolated ZIP/XML/순서 경계를사용하고SourceVault/DB/등록명령은호출하지않는다.
- 파일변경·취소·수업변경 시기존동작abort/결과폐기, 실패는새결과성공없음. 실제Viewer역량검사는렌더러패키징후후속.
## 단계
1. [x] 원본점검 helper/UI·단위검사:7개,fflate LICENSE/로컬Worker빌드검사.
2. [x] 실제Editor/Player불변·반응형/오류/check와문서기록:709tests·빌드/Whale1791813389908 실제dist UI·23쪽/타이밍4·session/snapshot/Canvas해시불변·오류/Worker취소·5화면 PASS. 발표활성화/물리인수는후속.
