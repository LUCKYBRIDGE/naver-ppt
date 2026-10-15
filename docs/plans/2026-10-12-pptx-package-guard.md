# PPTX 압축 입력 경계
- 목표: 렌더러 비교 전 같은 ZIP 한도와 XML 비실행 검사를 적용한다.
- 승인: 제품완성/포괄승인, adapter-validation/plan-feature 적용.
- 완료 기준: fflate 검증된 ZIP parser로 압축해제 전 전체목록 검증, 위험경로/중복/한도/잘못된형식 거부, XML DTD/entity 및 script·외부관계 검사, 합성공격+실제teacher-01검증.
- 영향: src/adapters/pptx/packageGuard.ts, unit, 비교script/문서. fflate0.8.3 MIT를실험개발의존성으로고정,제품renderer선정/권한변경없음.
- 한계: CRC/암호화세부/ZIP구조모든공격인수·파서시간격리/원본충실도는후속. 단순header검사로전체안전보장안함.
## 단계
1. [x] ZIP2-pass목록/한도·XML검사와unit/check: 15새unit,34파일293tests/TS/Vite/MV3/5스킬PASS(07:48).
2. [x] 실제Whale teacher-01 profile1791758855077/합성canonicalmedia profile1791758864729 PASS,DTD/script/잘못된XML거부·외부관계개수검사. 단일타이밍추출/원본불변,전체보안인수아님.
