---
name: whale-extension
description: 웨일 클래스 프레젠터의 MV3 패키지, 독립 창, 브라우저 API와 최소 권한을 구현하거나 검증할 때 사용한다.
---

# 웨일 확장 기반

저장소 루트의 [AGENTS.md](../../../AGENTS.md)와 [아키텍처](../../../docs/ARCHITECTURE.md)를 기준으로 한다. 현재 요청 범위에서 필요한 브라우저 경계를 구현한다.

- Launcher는 action popup, Remote는 독립 popup **window**이다. Player/Editor는 별도 확장 페이지. Launcher가 닫혀도 Player는 유지한다.
- `manifest.config.ts`와 `vite.config.ts`를 함께 확인한다. service worker와 HTML/asset 경로는 dist 기준이다. `npm run build`로 MV3 manifest·모듈 worker·네 페이지·로컬 script 경로를 검사한다.
- 서비스 워커는 창·라우팅만 담당하고 장기 타이머/재생/글꼴 측정을 소유하지 않는다. 유휴 종료 후 상태는 저장소로 복원한다.
- 창·상태 메시지는 비신뢰 입력이다. sender, 허용 대상, session/revision 등을 해당 경계에서 검사한다. 전달받은 문자열로 임의 URL/파일 경로를 열지 않는다.
- 현재 manifest는 추가 권한이 없다. storage/downloads/system.display/scripting은 기능 구현 시 목적·대체 경로·환경 검증을 함께 추가한다. 웹 host 접근은 출처별 선택 권한으로 설계한다.
- 모니터 탐색/자동 위치가 불가능하면 수동 배치를 제공한다. 창 focus 강제 회수로 다른 앱 사용을 방해하지 않는다.
- Chrome API mock 통과와 웨일 실기기 통과를 구분한다. [수동 체크리스트](../../../tests/manual/WHALE_CHECKLIST.md)와 [검증 결과](../../../docs/TEST_RESULTS.md)에 OS/브라우저/DPI/권한/결과를 기록한다.

제출 결과에는 작동하는 창 경로, 필요한 권한, 빌드 검사, 실제 웨일 검증 여부를 포함한다. 확장 설치/스토어 공개/외부 배포가 현재 요청에 포함되는지 별도로 판단한다.
