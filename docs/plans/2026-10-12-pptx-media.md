# PPTX 미디어 경계 실험
- 목표: 합성 PPTX에 포함된 WAV/MP4의 모델인식·렌더러재생·정확한추출과별도Player 재생을 구분한다.
- 승인: 전체제품개발/포괄승인. adapter-validation 적용.
- 완료 기준: 내부2개media의원본hash일치, 후보의nativeaudio/video존재/진행관측, 추출bytes의Whale muteddecode/시간진행, 제한기록.
- 범위: 격리실험만, 자동제품지원/효과timeline재현·실제코덱전반/스피커는포함안함.
- 영향: createPptx optionalmedia, 비교script --media와모델필드/추출bytes검사; ignoredcache만,제품권한/의존성변경없음.
## 단계
1. [x] 합성3쪽/WAV/MP4 fixture와모델/hash검사. PptxGenJS WAV의videoFile 태그/음원relation·MIME불일치관측, office추출hash2개일치.
2. [x] 실제Whale profile1791758453763: aiden nativeVIDEO2개/WAV·MP4 진행,office포스터만/추출후별도audio·video무음진행. 스피커/원본효과·제품연결은미검증.
3. [x] 태그만정규화한별도합성variant: DOMParser/relationship검사로audioFile1개생성, deterministicZIP/두후보입력hash동일, WAV/MP4hash보존·audio/video모델/재생PASS(profile1791758621500). 사용자원본변경없음.
