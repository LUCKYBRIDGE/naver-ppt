# PPTX 배경 스타일 참조 계산 수정

- 목적: PRDv5 §7/24 Stage D의 실제 1쪽 비교에서 발견한 잘못된 그라데이션을 원본 스타일 행렬에 맞춰 수정한다.
- 승인 근거: 제품 완성 지속 개발·충실도 방향 점검 우선 요청. 원본/기존변경 보존, 커밋·배포 없음.
- 원인: teacher-02 slide/layout에 bg가 없고 master가 bgRef1001/bg1을 지정한다. theme 첫 배경은 단색 phClr, 세 번째는 그라데이션이다. core0.4.5 parser가 idx를 bgFillStyles 길이로 clamp하여1001을마지막항목으로선택한다. PDF배경white/원본사진과좌표는대응하며제품배경은아래로어두워진다.
- 근거: [Microsoft style matrix reference 규칙](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.drawing.fillreference?view=openxml-3.0.1), 0/1000 없음,1..999 fillStyleLst,1001.. bgFillStyleLst의1-based index. 로컬first-page-diagnosis.json/설치파서source3288줄.
- 영향: Vite의client/worker용좁은빌드transform과공유순수selector/테스트/변경고지. node_modules·원본PPTX는수정하지않는다. 고정parser경로/SHA256/정확한변환대상을확인하고업데이트/불일치는빌드를실패시켜재검토한다. 유효하지않은범위를마지막style로자동대체하지않는다.
- 라이선스: 기존MIT/원저작권고지유지,변경고지를배포파일에추가. 새의존성/권한/폰트설치/네트워크없음.

## 검증
1. [x] 원본/PDF이미지크기·위치/fill/master/layout/theme와파서원인확인.
2. [x] selector0/1000/1..999/1001..·범위오류와고정source변환테스트,client/worker빌드연결.
3. [x] 실제Whale teacher-02 1쪽배경픽셀·차이개선/52쪽전체·원본불변/학생화면독립,교사제품·내장미디어/PDF회귀.
4. [x] check/라이선스·기술/호환·계획·인수인계갱신. 최종Visual/Media/Behavior/실물10종은별도미완료유지.

## 최종 결과
- check02:24:58 91파일/1,304tests·TypeScript/Vite/MV3/5스킬PASS. MIT변경고지/실제Worker marker 빌드검사포함. 초기undefined타입오류는수정했다.
- actualWhale합성10종1791912319024/전체52쪽1791912346260/교사제품1791912319303/내장1791912319742/foundation profile-1791912346550 모두exit0. 1쪽MAE10.62→2.18·차픽셀18.13%→1.95%/흰배경5표본확인,원본hash불변/학생화면독립/외부0. [상세](../TEST_RESULTS.md).
- 최종충실도·원본앱/실물10종/물리·미지원쪽학생화면보호UX 인수는남는다. 표본개선으로지원승격하지않는다. 이번동시회귀를메모리benchmark로사용하지않는다.

## 실제 검증에서 보완
- 초기 합성 probe1791910963270은Worker ready 메시지를결과로오해해실패,명시ready→input handshake로교정했다. 1791911011324는RGB와HEX표기직접비교오류로실패,숫자채널비교로교정했다.
- 1791912227531에서유효7종은통과했으나범위밖idx3을파서가catch하여흰색unsupported쪽으로바꾸는실제경로를확인했다. 고정source의그catch는배경참조오류만재전파하도록보완한다. 다른종류의기존fallback/guard는변경하지않는다. 실패자료/결과는보존한다.
