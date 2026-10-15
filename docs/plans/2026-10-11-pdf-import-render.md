# PDF 가져오기와 독립 렌더
- 목표: 실제 로컬 PDF 여러 개를 세션에 등록하고 학생 발표와 교사 미리보기를 독립 렌더한다.
- 완료 기준: 합성 실제 PDF A5→B2→A5 렌더, A5 중 B8 미리보기 불변, 원본 hash 불변, worker/폰트/디코더 오프라인 패키징, 입력/렌더 메모리 제한/취소 시험.
- 범위: Stage B의 가져오기/원본 참조/렌더. overlay/export/종료/media는 제품 전체 계획의 다음 연결이며 이 단위 완료와 구분한다.
- 승인: 사용자의 전체 개발 승인.

## 영향 범위
- PDF.js 6.4.299 Apache-2.0 정확 버전 채택 전 합성 파일 실험. 동적 모듈, 자체 worker, CMap/표준 폰트/WASM 패키지 자원. eval 금지, 원격 요청 없음.
- src/adapters/pdf: 검증/분석/렌더/최대 페이지 수/픽셀/LRU/취소.
- src/storage/sourceVault.ts: 원본 File은 실행 메모리만, FileSystemFileHandle은 별도 IDB 참조, 같은 확장 화면의 BroadcastChannel로 파일 재조회. 원본 바이트를 영속 저장하지 않는다.
- Editor: 자료 추가/원본 재연결/오류; Player: 공개 선택만 렌더; Remote: 실제 자료 명령.
- 메시지: Editor의 명시적 REGISTER_DOCUMENT 허용. 원본은 메시지에 넣지 않는다.
- 위험: PDF 파싱/대용량/암호/누락 원본/렌더 경합/취소, 브라우저 파일 권한·CSP 차이. 자료 추가는 발표를 자동 전환하지 않는다.

## 단계
1. [x] PRD/계약/스킬/공식 PDF.js 확인.
2. [x] 정확 의존성·로컬 자원 패키징·합성 PDF 파싱 실험.
3. [x] 입력/파일 참조/공통 Import/중복·변경/재연결 구현과 테스트.
4. [x] Player/Editor 독립 캔버스와 제한 있는 렌더/LRU/취소 연결.
5. [x] 자동 검증과 실제 PDF 보조 브라우저 warm offline/화면 픽셀/수직 흐름. 실제 Whale은 미실시.
6. [x] Whale 여부/제한·라이선스·결정·다음 단계 기록.
