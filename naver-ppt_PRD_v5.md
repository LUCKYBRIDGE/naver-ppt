# naver-ppt 제품 요구사항 문서 (PRD)

> 문서 상태: **제품 방향 확정본 / 설계 착수 기준**
>
> 문서 버전: **v5.0-draft**
>
> 작성 기준일: **2026-10-11**
>
> 우선 플랫폼: **Windows + Naver Whale Desktop + Manifest V3**
>
> 제품 성격: **Local-first / Offline-capable / Presentation
> Fidelity-first**
>
> 목적: 이 문서는 이후 아키텍처, 개발 지침, 프로젝트 스킬, 테스트 계획,
> 호환성 매트릭스와 구현 우선순위를 결정하는 상위 제품 기준이다.

------------------------------------------------------------------------

## 1. 제품 정의

**naver-ppt는 교사가 PDF, PowerPoint, 한쇼, Canva, 미리캔버스 등 서로
다른 수업 발표 자료를 하나의 발표 세션에서 안전하게 교차 사용하고,
발표를 중단하지 않은 채 제어·미리보기·빠른 수정·판서·노트·미디어
재생·복구·로컬 저장을 수행하기 위한 Naver Whale 기반 수업용 프레젠테이션
운영 시스템이다.**

naver-ppt의 목표는 PowerPoint, 한쇼, Canva, 미리캔버스의 전체 편집
기능을 복제하는 것이 아니다. 핵심 가치는 다음 세 가지다.

1.  **발표 운영 통합** --- 여러 형식과 여러 자료를 하나의 세션에서
    빠르게 전환한다.
2.  **Presentation Fidelity** --- 원본의 화면, 미디어, 발표 동작을
    가능한 한 그대로 보존한다.
3.  **수업 안정성** --- 네트워크, 창 포커스, 브라우저 재시작, 자료 전환
    등의 상황에서도 발표 흐름과 수정 상태를 최대한 유지한다.

------------------------------------------------------------------------

## 2. 해결하려는 문제

교실에서는 PDF, PPT/PPTX, 한쇼, Canva, 미리캔버스, 동영상 등 서로 다른
자료를 함께 사용한다. 현재는 자료마다 프로그램과 창이 달라 다음 문제가
발생한다.

-   자료를 바꿀 때 창과 프로그램을 반복해서 전환해야 한다.
-   PowerPoint/한쇼/웹 자료를 다른 프로그램에서 열면 글꼴, 줄바꿈, 도형,
    이미지, 애니메이션, 영상, 음원이 달라지거나 깨질 수 있다.
-   발표 중 다른 자료를 확인하거나 수정하면 학생 화면까지 바뀔 수 있다.
-   다른 앱으로 포커스를 옮기면 자동 넘김이나 미디어가 중단될 수 있다.
-   수업 중 빠른 글자 수정, 가리개, 판서, 메모를 원본을 손상시키지 않고
    처리하기 어렵다.
-   인터넷이 불안정하면 웹 기반 발표가 수업 전체에 영향을 줄 수 있다.
-   여러 자료의 마지막 페이지, 재생 위치, 판서와 노트를 다시 찾는 데
    시간이 든다.

naver-ppt는 이 문제를 **"원본 앱 대체"가 아니라 "발표 실행·운영 계층
통합"**으로 해결한다.

------------------------------------------------------------------------

## 3. 핵심 제품 원칙

### P-01. Presentation Fidelity First

파일이 단순히 "열리는 것"은 지원으로 간주하지 않는다.

지원 품질은 다음 세 축으로 평가한다.

-   **Visual Fidelity**: 글꼴, 줄바꿈, 자간, 위치, 크기, 이미지, 도형,
    표, 차트, 투명도, 배경 등
-   **Media Fidelity**: 이미지, 영상, 오디오, 효과음, 재생 위치, 반복,
    볼륨, 자동재생 등
-   **Behavioral Fidelity**: 애니메이션, 전환, 클릭 순서, 트리거,
    타이밍, 자동 넘김 등

세 축을 합쳐 **Presentation Fidelity**라고 정의한다.

### P-02. Offline by Default

핵심 발표 경로는 인터넷 연결을 전제로 하지 않는다.

로컬 PDF/PPTX 등 검증된 자료, Player, Remote, Editor, 판서, 노트, 세션
상태, 자동복구, 로컬 저장은 가능한 범위에서 오프라인으로 동작해야 한다.

온라인 연결은 웹 원본, 온라인 미디어 등 본질적으로 네트워크가 필요한
기능에만 요구한다.

### P-03. Graceful Degradation

일부 기능을 재현할 수 없다고 전체 발표가 실패해서는 안 된다.

지원하지 않는 효과가 있으면: 1. 정확한 대체가 가능하면 호환 효과로
대체한다. 2. 시각적 결과를 보존할 수 있으면 고충실도 fallback을
사용한다. 3. 불가능하면 발표 전에 명확하게 알린다. 4. 조용히 깨뜨리거나
지원하는 척하지 않는다.

### P-04. Lazy Capability

기능이 많아져도 사용하지 않는 기능이 초기 로딩과 상시 메모리 비용을
만들지 않도록 한다.

PDF를 열면 PDF 기능, PPTX를 열면 PPTX 기능, 웹 자료를 사용할 때만 웹
Adapter를 활성화한다.

### P-05. Bounded Cache

페이지 렌더, 썸네일, 분석 결과, 웹 fallback 등의 캐시는 상한을 둔다.
대용량 원본을 무제한 복제하지 않는다.

### P-06. No Office Clone

PowerPoint/한쇼 전체 렌더링·편집 엔진을 복제하는 것을 목표로 하지
않는다. 원본 엔진, 표준 포맷, 검증된 라이브러리, 사전 렌더링 등 더 높은
충실도를 더 낮은 복잡도로 얻는 경로를 우선 검토한다.

### P-07. Original Immutable

원본 파일은 읽기·참조 대상으로 취급하며 자동 덮어쓰기를 금지한다. 편집은
별도 delta/overlay로 관리하고 내보내기는 새로운 파일로 만든다.

### P-08. Audience Safety

교사가 탐색·미리보기·편집하는 화면과 학생에게 실제 표시되는 화면을 독립
상태로 유지한다. 외부에서 새 자료가 추가되어도 Player를 자동 전환하지
않는다.

### P-09. Local-first Privacy

자체 서버, 계정, 클라우드 DB, 사용자 자료 업로드를 핵심 동작의 전제로
두지 않는다. 네트워크가 필요한 서비스는 해당 서비스와의 연결 범위로
격리한다.

### P-10. Evidence-based Compatibility

"Chromium 기반이므로 될 것", "파일이 열렸으므로 지원" 같은 추정을 지원
판정으로 사용하지 않는다. 실제 샘플과 실제 Whale 환경에서 검증된 기능만
supported로 승격한다.

------------------------------------------------------------------------

## 4. 제품 구성

### 4.1 Whale Extension --- 제품 본체

실제 애플리케이션은 Naver Whale 확장 프로그램이다.

주요 구성: - **Launcher UI**: 수업/자료 시작점 - **Player**: 학생에게
보이는 실제 발표 화면 - **Remote**: 교사용 발표 제어 - **Editor**:
학생에게 노출되지 않는 미리보기/빠른 편집 - **Core**: 세션, 명령,
revision, 상태 전환 - **Adapters**: PDF/PPTX/PPT/SHOW/Web 등 형식별
처리 - **Media Engine**: 영상/음원/자동 넘김/타임라인 - **Overlay
Engine**: 글상자, 판서, 가리개 등 - **Storage/Recovery**: delta,
journal, 복구 - **Export**: 로컬 편집정보 및 지원 가능한 복사본 생성 -
**Preflight**: 발표 전 호환성/오프라인/미디어 검사

### 4.2 Windows naver-ppt Launcher --- 선택적 Bridge

Windows Launcher는 제품 본체가 아니다.

역할: - Windows 탐색기에서 선택한 파일 경로를 받는다. -
`naver-ppt로 발표` 진입점을 제공한다. - Whale/naver-ppt에 자료 열기
요청을 전달한다. - 필요한 경우 Whale 실행을 유도한다. - 전달 후 종료하는
비상주형을 기본으로 한다.

하지 않는 일: - 슬라이드 렌더링 - 편집 - 세션 엔진 - 미디어 재생 - 독립
발표 앱 역할

Launcher가 설치되지 않거나 고장 나도 Whale 확장 내부의 `자료 추가`
기능은 정상 작동해야 한다.

------------------------------------------------------------------------

## 5. 자료 진입 경로

### 5.1 기본 경로

`Whale → naver-ppt → 자료 추가 → 파일/링크 선택 → Document Import`

이 경로는 Launcher 없이 항상 사용할 수 있어야 한다.

### 5.2 Windows 빠른 실행

`탐색기 파일 선택 → 우클릭 → naver-ppt로 발표 → Windows Launcher → Whale Extension → Document Import`

단일 파일과 복수 파일을 지원하는 것을 목표로 한다.

### 5.3 기본 앱 연결

선택 기능이다. 설치 시 PDF/PPTX 등의 기존 기본 앱을 강제로 변경하지
않는다.

사용자가 명시적으로 원할 때만 Windows 기본 앱으로 naver-ppt Launcher를
선택할 수 있도록 한다.

### 5.4 공통 Import Pipeline

File Picker와 Windows Launcher는 서로 다른 렌더링 경로를 만들지 않는다.

모든 입력은 공통 `Document Import` 계약으로 합류해야 한다.

개념:

`Input → SourceRef → Preflight → Adapter Selection → Document Registration → Session → Player/Remote/Editor`

------------------------------------------------------------------------

## 6. 세션 모델

하나의 수업 세션에 여러 자료를 동시에 등록할 수 있다.

자료별로 최소 다음 상태를 독립 보존한다.

-   마지막 슬라이드/페이지
-   presenter note
-   class log
-   overlay/판서/가리개
-   autoplay 설정
-   미디어 재생 위치/bookmark
-   dirty 상태
-   호환성/Preflight 결과
-   원본 식별 정보

### 6.1 Presented Selection / Editor Selection 분리

-   **Presented Selection**: 학생 화면에 실제 표시 중인 자료/슬라이드
-   **Editor Selection**: 교사가 미리보기/편집 중인 자료/슬라이드

둘은 독립적이다.

예:
`A.pdf 5페이지 발표 중 → B.pptx 8페이지 비공개 편집 → 학생 화면은 A.pdf 5페이지 유지`

### 6.2 외부 자료 추가

수업 중 Windows에서 새 파일을 `naver-ppt로 발표`로 전달해도 현재
Player를 자동 전환하지 않는다.

새 자료는 세션에 등록하고 교사에게 추가 완료를 알린다. 실제 발표 전환은
교사가 명시적으로 수행한다.

### 6.3 자료 종료

-   기본 종료: 현재 자료만 종료
-   전체 종료: 별도 명령 + 저장 상태 확인
-   현재 자료 종료 후 다른 자료를 자동으로 학생 화면에 노출하지 않는다.
-   기본 fallback은 검정/대기 화면이다.

------------------------------------------------------------------------

## 7. 형식별 제품 전략

### 7.1 PDF

첫 번째 완성 대상이며 고충실도 기준 포맷이다.

목표: - 정확한 페이지 렌더링 - 빠른 페이지 전환 - 앞/뒤 페이지 선행
렌더 - bounded cache - 링크/주석 등 검증된 PDF 기능 - naver-ppt
overlay - 로컬 저장/복사본 - 오프라인 완전 사용

PDF 자체에 존재하지 않는 PowerPoint 애니메이션을 만들어내지는 않는다.

### 7.2 PPTX

PPTX는 단순 화면 변환이 아니라 발표 구조로 취급한다.

가능한 범위에서 다음을 구분하여 처리한다.

-   Visual: text, image, shape, table, chart 등
-   Media: video, audio
-   Timeline: animation, trigger, timing
-   Transition
-   Notes/metadata
-   Embedded/linked resources

지원 전략: - 자주 사용되는 기능부터 직접 지원 - 복잡한 기능은 검증된
호환 처리 - 정확한 재현이 어려우면 fidelity fallback 검토 - 지원 불가능
요소는 Preflight에서 사전 고지

PPTX를 지원한다고 표시하려면 화면만이 아니라 미디어와 발표 동작의 검증
결과를 함께 제공한다.

### 7.3 PPT / 한쇼 SHOW

초기에는 지원을 선언하지 않는다.

검증 대상: - 안정적인 파서 존재 여부 - 원본 앱 또는 변환 경로 활용
가능성 - 오프라인 가능 여부 - 라이선스 - 글꼴/미디어/애니메이션 보존
수준 - 변환으로 인한 손실

검증된 수준만 experimental → partial → supported로 승격한다.

### 7.4 Canva / 미리캔버스

웹 원본과 PPTX/PDF 내보내기 결과를 동일한 것으로 취급하지 않는다.

가능한 경로: - **Web Adapter**: 원래 서비스의 발표 경험을 활용 -
**Export Adapter**: PPTX/PDF로 내려받은 결과를 해당 형식 Adapter로
처리 - **Offline Prepared Copy**: 서비스 정책과 기술 조건이 허용되는
범위에서 수업 전 로컬 발표본 준비

웹 원본에만 존재하고 내보내기 과정에서 사라진 애니메이션/미디어 정보는
naver-ppt가 임의 복원할 수 있다고 약속하지 않는다.

------------------------------------------------------------------------

## 8. Presentation Preflight

자료를 세션에 등록할 때 가벼운 1차 검사를 수행하고 필요할 때만 정밀
검사를 수행한다.

검사 범주:

### 8.1 Visual

-   사용 글꼴
-   누락 글꼴
-   embedded font 여부
-   텍스트 overflow 가능성
-   unsupported shape/effect
-   이미지/차트/표 처리 가능 여부

### 8.2 Media

-   이미지 접근 가능 여부
-   영상/오디오 codec
-   embedded/linked 여부
-   외부 링크 의존성
-   autoplay/loop/trim/bookmark 처리 가능 여부

### 8.3 Behavior

-   animation 종류
-   transition 종류
-   click sequence
-   trigger
-   timing
-   자동 넘김

### 8.4 Offline

-   완전 오프라인 가능
-   일부 온라인 요소 필요
-   핵심 발표가 온라인에 의존

### 8.5 결과 UX

예:

**발표 준비 완료** - 화면: 정상 - 글꼴: 정상 - 이미지: 14/14 - 영상:
2/2 - 오디오: 1/1 - 애니메이션: 23/24 - 전환: 9/9 - 오프라인: 완전 사용
가능 - 주의: 애니메이션 1개는 호환 효과로 대체

지원하지 않는 기능을 조용히 누락시키지 않는다.

동일 파일 fingerprint와 동일 실행 환경에서 유효한 검사 결과는 캐시할 수
있다.

------------------------------------------------------------------------

## 9. Fidelity 지원 등급

기능/포맷별 상태는 다음으로 통일한다.

-   **unverified**: 아직 검증하지 않음
-   **experimental**: 기술 실험 성공, 일반 수업 보증 없음
-   **partial**: 검증된 기능과 제한 사항이 명확함
-   **supported**: 정의된 환경/샘플/인수 기준을 통과
-   **unsupported**: 기술/정책/라이선스 등의 이유로 제공하지 않음

추가로 실제 발표 요소에는 다음 처리 등급을 적용할 수 있다.

-   **A --- Native/Exact**: 정상 재현
-   **B --- Compatible**: 실질적으로 동등한 호환 표현
-   **C --- Fidelity Fallback**: 사전 렌더 등으로 시각/발표 결과를 보존
-   **X --- Unsupported**: 사전 경고 후 제한

------------------------------------------------------------------------

## 10. 글꼴 정책

글꼴은 Presentation Fidelity의 핵심 요소다.

원칙: - 누락 글꼴을 조용히 다른 글꼴로 대체하지 않는다. - 글꼴 대체로
줄바꿈/텍스트 overflow가 발생할 가능성을 검사한다. - 문서 embedded font,
로컬 설치 font, naver-ppt가 적법하게 배포 가능한 bundled font를
구분한다. - 인터넷에서 런타임에 글꼴을 받아야만 정상 발표되는 구조를
핵심 경로로 사용하지 않는다. - 폰트 라이선스를 기록한다. - 실제 렌더링에
사용된 font metrics로 텍스트 fit을 검증한다.

------------------------------------------------------------------------

## 11. 미디어 및 타임라인

Player가 발표 재생 권한(authority)을 가진다.

목표: - 다른 앱으로 포커스를 옮겨도 지원되는 영상/음원/자동 넘김이
계속된다. - Remote가 닫히거나 재연결되어도 Player가 임의로
정지/재시작하지 않는다. - 자료를 전환하면 이전 자료의 미디어/자동재생은
정책에 따라 중지하고 위치를 보존한다. - 돌아왔을 때 저장된 위치/상태를
복원할 수 있다. - 매 프레임 상태를 저장하지 않고 의미 있는 checkpoint만
영속화한다. - 서비스 워커 메모리를 장기 타임라인의 단일 진실 공급원으로
사용하지 않는다.

브라우저/OS가 background/hidden media를 제한하는 실제 조건은 별도 실기기
검증 대상으로 둔다.

------------------------------------------------------------------------

## 12. 오프라인 동작

별도의 "오프라인 앱"을 만드는 것이 아니라 핵심 기능 자체가
offline-capable이어야 한다.

오프라인에서도 목표로 하는 기능: - 확장 실행 - 로컬 자료 열기 - PDF
발표 - 검증된 범위의 PPTX 발표 - Player/Remote/Editor -
판서/글상자/가리개 - 노트/수업 기록 - 자동복구 - 로컬 저장 - 로컬
영상/오디오 - Windows Launcher/로컬 Bridge

온라인이 필요한 기능: - Canva/미리캔버스 원본 서비스 접속 - 온라인 URL
미디어 - 외부 API가 필수인 기능

네트워크 단절 시: - 현재 로컬 발표를 중단하지 않는다. - 온라인 기능만
비활성/경고한다. - 상태 영역에 간결하게 오프라인임을 표시할 수 있다. -
재연결 시 전체 앱을 재시작하지 않는다.

------------------------------------------------------------------------

## 13. 빠른 편집

naver-ppt는 원본 Office 객체 전체 편집기가 아니다.

우선 편집 범위: - 고정 크기 글상자 - 배경색/글자색 - 자동 font fit -
판서 - 가리개 - 발표자 노트 - 수업 기록 - 필요한 발표 보조 overlay

원본 위에 normalized coordinate 기반 overlay/delta로 저장한다.

Editor의 변경은 명시적인 commit 전까지 Player에 영향을 주지 않으며, 현재
발표 중 슬라이드 수정의 적용 시점도 안전한 정책을 사용한다.

------------------------------------------------------------------------

## 14. 저장 및 복구

### 14.1 임시 상태

IndexedDB: - edit delta - session state - recovery journal - file
reference metadata - bounded analysis/render cache

작은 사용자 설정은 `chrome.storage.local` 등 적절한 소형 저장소를
사용한다.

### 14.2 원본

대용량 원본을 자동으로 IndexedDB/OPFS 등에 복제하지 않는다.

### 14.3 정식 저장

사용자가 요청하면: - naver-ppt 편집/세션 정보 파일 - 지원 가능한 PDF
복사본 - 검증된 범위의 기타 export

등을 새 로컬 파일로 저장한다.

다운로드 요청을 보낸 것과 실제 저장 성공을 구분한다. 저장 완료가
확인되기 전에 상태를 삭제하지 않는다.

### 14.4 복구

Whale/확장/PC의 비정상 종료 후 가능한 범위에서 마지막 durable state를
복구한다.

------------------------------------------------------------------------

## 15. Windows Launcher 요구사항

### 15.1 UX

기본 추천 진입: **파일 우클릭 → naver-ppt로 발표**

지원 목표: - 단일 파일 - 여러 파일 선택 - Whale 미실행 - Whale 실행 중 -
기존 세션 존재 - 새 세션 필요

### 15.2 기본 앱

기본 앱 지정은 선택 기능이다. 설치 프로그램이 기존 PDF/PPTX/PPT/SHOW
연결을 임의로 탈취하지 않는다.

### 15.3 상주 정책

기본적으로 Launcher를 상주 프로세스로 만들지 않는다.

### 15.4 전달 정책

대용량 파일 바이너리를 메시징 채널에 그대로 싣는 설계를 피한다. 파일
참조/메타데이터와 안전한 로컬 접근 경계를 사용한다.

### 15.5 통신 방식

제품 계약은 확정하지만 구현 수단은 기술 검증 후 확정한다.

후보: - Native Messaging - Native Host + Local IPC - 기타 Whale에서
검증된 안전한 로컬 bridge

Native Messaging을 사용할 경우 확장 ID allowlist, 입력 검증, path
normalization, extension/type allowlist, 크기 제한, shell injection 방지
등을 필수로 한다.

------------------------------------------------------------------------

## 16. 성능 요구사항

제품 기능 수와 상시 비용을 분리한다.

원칙: - 초기 실행에 모든 Adapter를 로드하지 않는다. - 문서 종류에 따라
code splitting/lazy loading을 사용한다. - 100장 문서를 처음부터
고해상도로 전부 렌더하지 않는다. - 현재 페이지와 인접 페이지를 우선
준비한다. - thumbnail/full render cache를 분리할 수 있다. - 메모리
pressure 시 재생에 필요하지 않은 캐시부터 제거한다. - Preflight는 fast
scan → 필요 시 deep scan 구조로 한다. - 동일 fingerprint 분석 결과
재사용을 허용한다. - Launcher는 비상주를 기본으로 한다. - background
service worker에 장기 미디어/렌더링 작업을 두지 않는다.

성능 최적화 때문에 현재 발표 품질이나 원본 충실도를 조용히 희생해서는 안
된다.

------------------------------------------------------------------------

## 17. 보안 및 개인정보

-   최소 권한 원칙
-   불필요한 `<all_urls>` 금지
-   원격 executable code/CDN script/eval loader 금지
-   외부 파일/URL은 untrusted input으로 취급
-   raw HTML 직접 주입 금지
-   Native Bridge는 특정 extension identity만 허용
-   외부 경로 입력 정규화 및 검증
-   파일 형식/크기 검증
-   사용자 자료 자동 업로드 금지
-   telemetry는 명시적 제품 결정 없이 추가하지 않음
-   웹 Adapter는 서비스 정책/로그인/권한 범위를 존중

------------------------------------------------------------------------

## 18. 주요 사용자 흐름

### Flow A --- 수업 시작

1.  Whale에서 naver-ppt 실행
2.  새 수업 또는 최근 수업 선택
3.  PDF/PPTX/링크 여러 개 등록
4.  Presentation Preflight
5.  Player/Remote 준비
6.  발표 시작

### Flow B --- 수업 중 자료 전환

1.  A 자료 발표
2.  B 자료 선택
3.  A 상태 checkpoint
4.  B의 마지막 위치 복원
5.  B 발표
6.  A로 돌아오면 이전 위치/overlay/media 상태 복원

### Flow C --- 비공개 편집

1.  A를 학생에게 발표
2.  Editor에서 B의 다른 슬라이드 탐색
3.  overlay/노트 편집
4.  학생 화면은 A 유지
5.  commit
6.  B를 실제 발표할 때 변경 내용 적용

### Flow D --- Windows에서 즉시 추가

1.  탐색기에서 파일 선택
2.  `naver-ppt로 발표`
3.  Launcher가 Whale/naver-ppt에 전달
4.  기존 세션이 있으면 자료만 추가
5.  현재 학생 화면 유지
6.  교사가 선택할 때 발표 전환

### Flow E --- 인터넷 단절

1.  로컬 자료 발표 중 연결 끊김
2.  Player/Remote/Editor 핵심 기능 유지
3.  온라인 요소만 제한
4.  교사에게 간결한 상태 표시
5.  재연결 후 가능한 기능 복구

------------------------------------------------------------------------

## 19. 중복 자료 및 파일 변경

동일 파일을 반복해서 추가했을 때 무조건 복제하지 않는다.

식별 후보: - path/reference - size - lastModified - fingerprint/hash

정책: - 동일 자료로 확실하면 기존 document 재사용 - 원본이 변경되었으면
변경 감지 - delta가 있는 상태에서 원본 변경 시 자동 병합하지 않고 안전한
선택 제공 - fingerprint 계산 비용은 필요 수준에 맞춰 단계화

------------------------------------------------------------------------

## 20. 사용자 경험 원칙

-   수업 중 modal 남발 금지
-   오류 메시지는 "왜 실패했는지 + 지금 할 수 있는 안전한 다음 행동"을
    제공
-   기술 용어보다 발표 영향 중심으로 설명
-   위험한 자동 전환 금지
-   저장 성공/실패/취소를 명확히 구분
-   Preflight 경고는 심각도에 따라 구분하되 발표 자체를 불필요하게 막지
    않음
-   지원되지 않는 기능을 버튼만 보여주고 실패시키지 않음
-   Player에는 교사용 정보가 노출되지 않음
-   Remote/Editor가 사라져도 Player를 불필요하게 종료하지 않음

------------------------------------------------------------------------

## 21. 비목표(Non-goals)

초기/핵심 제품 범위가 아닌 것: - PowerPoint/한쇼/Canva 전체 편집기
복제 - 원본 Office 파일 자동 덮어쓰기 - 자체 클라우드 계정/동기화
서비스 - 서버 기반 문서 업로드를 필수 경로로 사용 - 모든 PPTX
애니메이션을 처음부터 자체 구현 - 검증되지 않은 SHOW/PPT/Web 기능을 완전
지원으로 표시 - Windows 기본 앱 강제 변경 - Launcher를 별도 프레젠테이션
앱으로 발전시키기 - 모든 슬라이드를 상시 고해상도 메모리 상주 - 인터넷이
끊겼다는 이유만으로 로컬 발표 중단

------------------------------------------------------------------------

## 22. 테스트 전략

### 22.1 기능 테스트

-   상태/revision/commandId
-   중복 명령
-   세션 복구
-   A→B→A 위치 복원
-   presented/editor selection 분리
-   save success/failure/cancel
-   close current / close all

### 22.2 Visual Regression

기준 렌더와 naver-ppt 결과를 비교한다.

테스트 fixture: - 한글/영문 혼합 - 다양한 글꼴 - 긴 텍스트/줄바꿈 경계 -
표/차트 - 이미지 crop - 투명도 - gradient - shadow - rotation - 특수
도형 - 수식 - 다양한 aspect ratio

### 22.3 Media Regression

-   embedded video
-   linked video
-   audio
-   autoplay
-   loop
-   trim
-   bookmark
-   슬라이드 전환 후 stop/resume 정책
-   다른 앱 focus 5분

### 22.4 Behavioral Regression

-   기본 animation
-   entrance/exit
-   motion
-   click sequence
-   trigger
-   transition
-   자동 넘김
-   지원 가능한 고급 효과

### 22.5 Offline Test

네트워크 완전 차단 상태에서: - 앱 시작 - 로컬 자료 등록 - 발표 - 편집 -
저장 - 복구 - Launcher handoff

### 22.6 실제 Whale 검증

Chromium mock 통과를 Whale 지원의 근거로 사용하지 않는다. 실제 Windows
Whale 버전/권한/샘플/결과를 기록한다.

------------------------------------------------------------------------

## 23. 호환성 매트릭스 운영

각 포맷은 하나의 "지원/미지원" 값이 아니라 기능별 matrix를 가진다.

예: \| 기능 \| PDF \| PPTX \| PPT \| SHOW \| Canva Web \| Miricanvas Web
\| \|---\|---\|---\|---\|---\|---\|---\| \| 정적 화면 \| 검증 \| 검증
필요 \| 검증 필요 \| 검증 필요 \| 서비스 의존 \| 서비스 의존 \| \| 글꼴
\| 해당 범위 \| 검증 필요 \| 검증 필요 \| 검증 필요 \| 서비스 렌더 \|
서비스 렌더 \| \| 영상 \| PDF 기능 범위 \| 검증 필요 \| 검증 필요 \|
검증 필요 \| 서비스 의존 \| 서비스 의존 \| \| 오디오 \| PDF 기능 범위 \|
검증 필요 \| 검증 필요 \| 검증 필요 \| 서비스 의존 \| 서비스 의존 \| \|
애니메이션 \| 제한 \| 검증 필요 \| 검증 필요 \| 검증 필요 \| 서비스 의존
\| 서비스 의존 \| \| 오프라인 \| 높음 \| 목표: 높음 \| 미정 \| 미정 \|
낮음 \| 낮음 \| \| overlay \| 지원 목표 \| 지원 목표 \| 지원 목표 \|
지원 목표 \| 제한/별도 \| 제한/별도 \|

실제 상태는 테스트 결과에 따라 업데이트한다.

------------------------------------------------------------------------

## 24. 개발 우선순위

### Stage A --- Core Reliability

-   command/revision/duplicate validation
-   durable state
-   Player/Remote/Editor state boundary
-   recovery
-   presented/editor independence

### Stage B --- PDF Vertical Slice

완료 기준: - PDF A/B 등록 - A5 → B2 → A5 정확 복원 - B8 비공개 편집 중
A5 유지 - overlay/note 저장 - current close → black waiting - 로컬
세션/편집정보 및 PDF 복사본 - 원본 hash 불변 - 재시작 복구 - focus 이동
중 지원 autoplay/media 유지

### Stage C --- Presentation Preflight

-   font/media/offline fast scan
-   capability result
-   사용자 경고 UX
-   fingerprint cache

### Stage D --- PPTX Fidelity Spike

렌더러 후보를 실제 fixture로 비교한다. 평가 기준: - visual fidelity -
media fidelity - behavioral fidelity - offline - performance - bundle
size - license - maintainability

렌더러를 먼저 정하고 요구사항을 맞추지 않는다. 요구사항을 기준으로
후보를 평가한다.

### Stage E --- Windows Quick Launch

-   우클릭 `naver-ppt로 발표`
-   single/multi file
-   Whale cold/warm start
-   existing session handoff
-   Native Messaging/IPC spike
-   Launcher failure fallback

### Stage F --- PPTX Partial Productization

검증된 기능만 활성화한다.

### Stage G --- Legacy/Web Expansion

-   PPT/SHOW
-   Canva/Miricanvas W0
-   W1\~W3
-   offline prepared copy 가능성
-   실제 capability matrix 기반 확대

------------------------------------------------------------------------

## 25. 출시/지원 승격 기준

어떤 포맷/기능도 다음 없이 `supported`로 표시하지 않는다.

1.  실제 샘플 fixture
2.  정의된 인수 기준
3.  Windows 실제 Whale 검증
4.  Visual/Media/Behavior 결과
5.  오프라인 여부
6.  성능/메모리 결과
7.  라이선스 검토
8.  알려진 제한 사항
9.  테스트 결과 문서
10. Compatibility Matrix 업데이트

------------------------------------------------------------------------

## 26. 성공 지표

초기 제품의 성공은 "지원 포맷 개수"가 아니라 다음으로 판단한다.

-   수업 중 자료 전환 실패가 없는가
-   학생 화면에 의도하지 않은 자료/교사용 정보가 노출되지 않는가
-   원본 파일이 손상되지 않는가
-   복구 가능한 편집 상태를 잃지 않는가
-   PDF 기준 수직 기능이 안정적인가
-   검증된 PPTX에서 원본 대비 시각/미디어/동작 차이가 허용 범위인가
-   인터넷 단절이 로컬 발표를 중단시키지 않는가
-   사용하지 않는 고급 기능이 상시 성능 비용을 만들지 않는가
-   사용자에게 실제 지원 수준을 정직하게 보여주는가

정량 임계치는 실제 fixture와 Whale 성능 측정 후 별도 Performance Budget
문서에서 확정한다.

------------------------------------------------------------------------

## 27. 아직 기술 검증 후 확정할 사항

제품 요구사항은 확정하되 다음 구현 기술은 spike 결과로 결정한다.

-   PPTX 렌더링/미디어/애니메이션 엔진 조합
-   PPT/SHOW 변환 또는 원본 앱 연계 방식
-   Whale의 Native Messaging 실제 등록/동작 방식
-   Launcher → 실행 중 Extension handoff의 최종 IPC 구조
-   Canva/Miricanvas W1\~W3 가능 범위
-   웹 자료의 합법적/기술적 offline prepared copy 범위
-   다중 모니터 자동 배치 API 실제 동작
-   File System Access/downloads 저장 UX
-   고급 효과 fidelity fallback 방식

이 항목들은 미확정이지만 개발을 막지 않는다. 지원하는 척하지 않고
capability로 격리한다.

------------------------------------------------------------------------

## 28. 이후 설계 문서가 따라야 할 규칙

이 PRD 이후 작성하는 `ARCHITECTURE`, `REQUIREMENTS`, `DATA_CONTRACTS`,
`STORAGE_POLICY`, `DECISIONS`, `TECH_SPIKES`, `COMPATIBILITY_MATRIX`,
`TEST_PLAN`, 프로젝트 스킬은 다음을 위반해서는 안 된다.

1.  Presentation Fidelity를 성능 편의를 위해 암묵적으로 포기하지 않는다.
2.  그렇다고 Office 전체 복제를 시도하지 않는다.
3.  핵심 발표 경로에 서버/인터넷 의존성을 넣지 않는다.
4.  Player의 공개 상태와 Editor의 비공개 상태를 합치지 않는다.
5.  원본 파일을 직접 수정하지 않는다.
6.  미검증 기능을 supported로 선언하지 않는다.
7.  서비스 워커 메모리를 영구 상태/장기 재생 엔진으로 사용하지 않는다.
8.  대용량 원본을 브라우저 저장소에 자동 복제하지 않는다.
9.  Launcher를 필수 구성요소로 만들지 않는다.
10. 새로운 포맷은 공통 Document Import/Capability/Preflight 경계를
    통과한다.
11. 포맷별 특수 코드는 Adapter 경계 안에 둔다.
12. 실제 저장 성공 확인 전에 작업 상태를 삭제하지 않는다.
13. 온라인 기능 장애가 로컬 발표를 무너뜨리지 않도록 격리한다.
14. 기능 추가 시 초기 로딩·상시 메모리 비용을 평가한다.
15. 구현 완료와 실제 Whale 호환성 검증을 구분한다.

------------------------------------------------------------------------

## 29. 최종 제품 문장

> **naver-ppt는 여러 형식의 수업 자료를 Naver Whale 안에서 하나의 발표
> 세션으로 운영하고, 원본의 화면·미디어·발표 동작을 가능한 한
> 보존하면서, 교사가 학생 화면을 방해하지 않고 자료 전환·미리보기·빠른
> 수정·판서·노트·재생·복구·로컬 저장을 수행할 수 있게 하는 Local-first,
> Offline-capable 프레젠테이션 운영 시스템이다.**

------------------------------------------------------------------------

## 30. 본 PRD의 의사결정 우선순위

충돌하는 요구가 생기면 다음 순서로 판단한다.

1.  **수업 중 안전성과 발표 연속성**
2.  **Presentation Fidelity**
3.  **원본/사용자 데이터 보존**
4.  **오프라인 및 로컬 독립성**
5.  **정확한 지원 수준 고지**
6.  **성능과 자원 효율**
7.  **사용 편의성**
8.  **지원 포맷/기능의 양**

단, 보안·개인정보·라이선스 요구사항은 위 우선순위와 별개로 항상 충족해야
한다.
