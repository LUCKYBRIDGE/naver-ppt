# 구현 경계의 보안과 개인정보

2026-10-12 08:15 후보 Worker SVG는 한 페이지32MB/전체 생성256MB를 제한하며 선택 페이지 본문만 로컬 메모리로 전달한다. decode 후 Blob URL을 정리하고 보고서는 hash/byte/쪽 번호만 반환한다. 이는 출력 한도와 비노출 시험이지 SVG 전체 보안 인증이 아니다. 격리 비교의 외부 요청 차단을 유지하며 제품 SVG 표시 경계는 별도 설계/검증이 필요하다.

2026-10-12 08:04 PPTX ZIP 검사/해제는 로컬 module Worker에서 수행한다. 15초 또는 취소로 terminate하며 원본 입력 사본과 해제 결과 buffer만 transfer한다. 성공/오류에서도 Worker를 종료하고 timer/listener를 정리한다. parser 오류는 PPTX 코드만 반환하며 파일명/문자열을 노출하지 않는다. DOMParser 및 후보 자체 parser는 아직 메인 실행이므로 전체 CPU 격리가 아니고, 대용량 메모리/CRC/암호화/전체 XML 인수도 후속이다(TEST_RESULTS08:04).

2026-10-12 08:00 PPTX 콘텐츠 타입: namespace/Default/Override·중복·경로·MIME·위험 타입 선언과 실제 항목 타입 누락을 검사한다. 없는 항목의 잔여 override는 위험 타입/중복/경로 검사 후 경고 개수로 기록하며 bytes를 생성하지 않는다. PNG/WAV/MP3/MP4/WebM 초기 헤더를 MIME/확장자와 대조하지만 전체 container/codec 안전은 아니다. 다른 미디어는 미검증 개수로 남는다. 제품 지원에 연결하지 않았고 Worker CPU 격리·CRC/암호화/전체 XML 스키마 등은 후속이다(TEST_RESULTS08:00).

2026-10-12 07:55 PPTX 관계 검사: 패키지/항목 소유 관계 파일과 namespace, ID 중복, mode, 중첩 요소를 검사한다. 내부 대상은 소유 항목 기준으로 해석해 루트 이탈/인코딩 우회·없는 항목·관계 파일 참조를 거부한다. 외부 URI는 자동 실행하지 않고 위험 프로토콜/자격 증명/상대 참조 등을 개수로만 요약한다. http/https/mailto 분류는 실행 허가가 아니다. 입력은 변경하지 않는다. ContentTypes·signature·CRC·CPU 시간 격리와 전체 포맷 보안은 후속이다(TEST_RESULTS 07:55).

2026-10-12 07:48 PPTX 실험입력경계: fflate0.8.3 metadata filter false로전체ZIP목록검사후압축해제.128MB입력/4000항목/32MBentry/4MBXML/256MB총해제/1000배압축한도,경로탈출·대소문자중복·위험키·macro/executable/script entry거부. 기본안전경계이며 encrypted flags/CRC/중앙-로컬header불일치·파서시간격리/전체ZIP공격인수는미완료. XML은UTF8엄격decode/DOMParser,DTD/entity·script/잘못된XML거부;외부관계는개수만요약하고접속허가로쓰지않는다. 비교시험외부통신차단은별도제어. 제품PPTX지원활성화없음(TEST_RESULTS07:48).

서버/자료 업로드/회원가입/기본 텔레메트리는 없다. 개인 파일과 학생 이름이 담긴 노트는 로컬에서 처리한다. 테스트 자료를 공개 저장소에 자동 추가하지 않는다.

## 기능 구현 때 적용할 항목

- 파일: 종류·크기·페이지/미디어 개수·압축 해제 크기에 한도. 손상/암호화 파일, ZIP 폭탄, XML 외부 엔터티, parser 오류를 정상 오류로 처리한다. 실제 상한은 성능 실험으로 정한다.
- 문자열: 가져온 텍스트/노트는 텍스트로 렌더링하고 임의 HTML 삽입을 하지 않는다.
- 링크: URL parser와 허용 protocol/정확한 hostname으로 검증한다. `canva.com.evil.example` 같은 유사 도메인은 허용하지 않는다. 페이지 접근 권한은 사이트별 필요 시 요청한다.
- 메시지: 현재 창 생성 경로는 자확장 sender ID와 role 허용 목록을 확인한다. 세션 명령 경로는 실제 라우팅 구현 때 세션·자료·슬라이드·revision·중복 ID를 추가 검증한다.
- 실행 코드: 패키지 안의 JS/WASM만 사용. CDN 코드/eval/원격 엔진 다운로드 금지. 로컬 폰트도 배포/내보내기 라이선스를 분리한다.
- 삭제: 캐시/작업본/정식 PC 파일을 구분한다. 개인정보 삭제 기능과 저장 안 함의 복구 정리 정책을 명시한다.
- 화면: Player에 교사용 노트를 렌더링하지 않는다. 단일/복제 모드의 노출 위험은 사용자 흐름에서 설명한다.

현재 .wcp.json은 최대16MB·UTF-8·깊이32·노드250,000·정확한 필드·형식/버전·PDF fingerprint와 델타를 검증한다. Launcher에서만 새 수업으로 복구한다. 원본/바이너리·native handle을 JSON에 넣지 않는다. downloads 권한은 명시적 로컬 파일 저장에만 사용하고 해당 요청 ID만 검색하며 전체 다운로드 이력/다른 파일을 수집하지 않는다. File System Access 출력은 기존 nonempty 파일을 덮어쓰지 않는다.

이 문서는 파일·웹 기능의 구현 조건이다. 기반 파일 생성만으로 파일 parser/출처 검증/개인정보 삭제 기능이 완료된 것으로 보지 않는다.
