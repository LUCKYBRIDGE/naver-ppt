# web-ppt 클릭 효과 실험

## 환경과 범위
- X-04 / SPIKE-T-04, 2026-10-12. Windows, Whale 5.39.412.57 headless, 전용 profile1791761228209.
- @web-ppt/core 및 @web-ppt/viewer-core 정확 0.4.5. 실제 두 패키지 LICENSE는 MIT, copyright 2026 unStone. npm tarball SHA512를 매 실행 검사한다. 값은 `scripts/verify-whale-webppt-spike.mjs`에 기록했다.
- [공식 저장소](https://github.com/unStone/web-ppt)의 API와 고정 패키지 타입/소스를 조사했다. 기본 Viewer의 innerHTML 경로는 쓰지 않고 제공된 PresentationState/playGroup과 자체 DOM 투영을 사용했다. 로컬 fflate 0.8.3 및 Vite bundle, MV3 제품과 같은 CSP, 서버/계정/CDN/자료 업로드 없음.
- 사용자가 제공한 teacher-01 원본은 메모리 route로만 공급했다. 5983498 bytes, SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`. 원본 파일은 변경하거나 저장소에 복사하지 않았다.

## 결과
- ZIP Worker/관계/콘텐츠 검사 유지: 163항목, 81XML, 내부 관계192, 타이밍4쪽, 외부 관계0.
- 23쪽 순회 렌더 및 각 쪽의 SVG 이미지 decode 성공. 1/3/15/23쪽과 3쪽 클릭 전후 스크린샷은 ignored 로컬 cache에만 보관했다.
- 클릭 단계: 3쪽6개, 9쪽1개, 12쪽2개, 19쪽3개. 각 단계의 대상 존재·네이티브 WAAPI 생성·동일 페이지 유지·상태 진행·대상 표시·남은 숨김 그룹의 전체 하위 노드 숨김을 검사했다. 마지막 단계 뒤 추가 진행은 null이었다. 총12단계 PASS.
- 최초 시험은 숨겨진 그룹의 자식에 explicit visible을 지정해 항목이 미리 노출됐다. 부모 visibility만 세던 검사로는 발견되지 않았다. 화면 직접 확인 후 일반 자식 visibility를 상속으로 수정하고 하위 노드 검증을 추가했다. 최종 3쪽 before는 항목 없음, after는6개 항목 표시를 직접 확인했다.
- SVG DOM 경계: XMLParser 후 제한된 SVG/XHTML 요소·URI/CSS·노드/문자 한도 검사, importNode 사용, ShadowDOM 안에 표시. 단위20개 및 실제 웨일 script/event/외부URI/다른 접두사 xlink/외부CSS/iframe 공격6개 거부. 포괄적인 SVG 보안 인증은 아니다.
- 외부 요청0, 원본 hash 불변. check 08:27:21: 38파일365tests, TypeScript/Vite/MV3/프로젝트5스킬 PASS.

## 판정과 제한
- 이 한 파일의 기본 appear/click 진행은 격리 실험에서 확인했다. **제품 Player에 연결하지 않았으며 PPTX 지원은 unverified 유지**한다.
- 원본 비교 엔진의 duration은 null인데 후보는500ms로 읽었다. 원본 효과 지속 시간/순서/모션 충실도를 동일하다고 판정하지 않는다. 고급 효과·전환·음원/영상·seek/replay·취소/자료 교차 복구는 후속이다.
- 원본 PowerPoint PDF/PNG 기준이 없어 시각 충실도는 미판정. 실제 폰트 부재·텍스트 위치 차이, 실제 교사 자료10종 이상 비교 조건은 남는다. 물리 모니터/DPI/소리/포커스 시험도 미실시.
- 새 npm 제품 의존성이나 권한을 추가하지 않았다. 후보 tarball/추출물/번들은 ignored cache의 실험 도구이다. 재배포 고지는 제품 채택 시 별도 포함해야 한다.

## 실행 수명 후속 검증
- 2026-10-12 08:35, X-04/SPIKE-T-04, 실제 Windows Whale5.39.412.57 headless profile1791761635954. 동일 teacher-01 bytes를 별도로 두 번 파싱한 독립 A/B 문맥이다. 서로 다른 실제 자료2종 시험으로 세지 않는다.
- `src/adapters/pptx/animationRun.ts`: 실행 중 중복 시작은 busy, 전환은 superseded로 즉시 반환한다. 엔진이 영원히 완료되지 않아도 취소 결과는 반환된다. 늦은 완료는 commit하지 않는다. 실행 전부터 있던 무관한 애니메이션은 건드리지 않고 해당 엔진이 동기 생성한 WAAPI만 소유/정리한다.
- 고정 후보의 playGroup.cancel은 native finish를 호출했다. 이것만으로는 fill 효과가 남으므로 네이티브 Animation.cancel도 명시적으로 호출한다. 정상 완료의 fill은 현재 화면에서 유지하고 탐색/전환 때 정리한다.
- A3에서2단계 완료→1쪽 탐색→A3 커서2 복원(4그룹 숨김/잔여 네이티브0) PASS. A3의3번째 단계 진행 중 연속 클릭은 busy/추가 진행 없음. B9 전환 후 이전 실행은 superseded, 이전 WAAPI1개 idle, B의 새 단계 완료와650ms 대기 후에도 완료 commit은 B의1회만 반영. A3 복귀는 완료 커서2만 복원하며 중단한3번째 효과는 표시하지 않는다. 명시적 재시작은 커서0/숨김6으로 초기화한다.
- 복귀/재시작 스크린샷을 직접 확인했다: 복귀는 처음2항목만 표시, 재시작은 모든 항목 숨김. 기존23쪽/12단계/이미지 decode/공격6개 거부·외부0·원본 hash불변 유지.
- 단위10개: 정상 완료/busy/무한 대기 취소/늦은 완료/소유 분리/완료 fill 정리/엔진 취소 예외/동기·비동기 실패/최종 투영 실패와 교체 실행 보존. check08:32:15 39파일375tests/TypeScript/Vite/MV3/5스킬 PASS.
- 첫 native 검증의 window.status 예약 문자열/모듈 내부 target 접근 오류는 시험 코드에서 수정했다. 최종 성공 결과만 위 profile로 기록했다.
- **영속 체크포인트나 제품 Session/Player에 연결한 결과가 아니다.** 시험 helper가 완료 커서를 명시적으로 전달했다. 엔진은 시작 시 cursor를 먼저 증가시키므로 제품 연결 때는 완료한 단계와 진행 중 단계를 구분해야 한다. 재개에서 motion/emphasis의 최종 위치 복원은 미검증이며 동기 생성 WAAPI 외 지연 생성/미디어/타이머의 수명은 포함하지 않는다.

## 재현
`scripts/verify-whale-webppt-spike.mjs`에 Playwright 모듈 경로, Whale exe, teacher-01 절대 경로를 순서대로 전달한다. 정확 tarball과 추출 패키지/fflate는 기존 ignored pptx-spike cache가 필요하다. 실패 시 `result.json`은 고정 오류 단계/이름만 기록하고 원본 본문이나 외부 주소를 기록하지 않는다. 상세 실행 경로는 DEVELOPMENT.md를 따른다.
