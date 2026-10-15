# 재생 중 자료 등록 revision 보존
- 사용자 제품 완성 요청 범위, FR-002/005/014. 파일 검사 도중 Player checkpoint가 증가해도 자료 추가가 가능해야 한다.
- 관찰: 내장미디어 시험1791829923869에서 정지 직후 PDF 등록 성공 안내 timeout. 현재 DocumentImportControls는 async 파일 검사 이전 session.revision으로 REGISTER_DOCUMENT를 보내므로 경쟁 가능성이 있다. 정확한 실패 안내는 당시 미수집이므로 원인 확정과 구분한다.
- 범위: 등록 직전 GET_SESSION, strict teacher/session 확인, STALE_REVISION만 최대3회 최신revision 재시도, 취소/다른오류/응답불명 재시도 금지. 원본/발표선택/기존 델타 변경 없이 새 자료만 등록.
- 검증: 순수 helper의 revision 증가/취소/오류 경계 단위, 실제Whale에서 원본 읽기 보류 중 노트명령으로 revision을 증가시켜 등록 성공/발표 보호 확인. 기존 PPTX·내장미디어·foundation 회귀/빌드, 결과·인수인계 갱신.
- [x] 구현과 단위검증: registerPreparedDocument/실제DocumentImportControls 연결, 최신read·동일commandId·stale최대3회·다른오류/응답불명·취소·다른session 거부 신규8개. check03:34:59 69파일909tests/빌드 PASS.
- [x] 실제Whale 및 문서 근거:1791830114932 실제Editor PDF읽기보류→노트revision증가→등록성공/발표선택·노트보존 PASS,내장 전체회귀 exit0. foundation1791830114955 회귀 exit0 PASS. 원래timeout의정확한오류는미수집으로남긴다. TEST_RESULTS 및 current에 기록.
