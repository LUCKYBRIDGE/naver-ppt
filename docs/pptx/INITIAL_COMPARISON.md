# PPTX 초기 후보 비교

## 추가 후보 결과: 2026-10-12 07:33

`@office-kit/pptx-preview 0.15.0` + peer 요구에 맞는 `@office-kit/pptx 0.24.0`, ZIP `fflate 0.8.3`을 추가했다. 세 tarball SHA512를 스크립트에 고정해 검사한다. core/preview 실제 LICENSE는 MIT이며 preview의 Node 전용 resvg/fontkit/폰트는 가져오지 않았다. [공식 프로젝트](https://github.com/office-kit/pptx)의 설명과 우리 실험 증거는 별개다.

- Whale5.39.412.57 headless profile1791757983044, 같은 MV3 CSP/권한없음/외부요청차단·관측0건. 합성 입력 SHA256 `622e022dbb0720895fbca9d7754d53304ca5fb3e801a17af419baa1132e553f0`.
- office browser bundle792516bytes, 첫쪽62ms; 같은 run aiden346ms. 단일 관찰이며 반복 benchmark가 아니다.
- office: SVG Blob→Image decode, 모델 한글/영문·2쪽, 생성SVG 표텍스트/페이지 이동, 첫쪽 노트 추출 PASS. 이미지자연크기267×150를960×540에 표시. 스크린샷1/2 직접확인.
- 제목 위치가 aiden과 다르고 표 배경도 다르다. PowerPoint 기준 화면이 없으므로 어느 쪽이 정확한지 아직 판정하지 않는다.
- `getSlideText(slide)`는 이번 표 내용을 포함하지 않아 표검사는 생성SVG의 DOMParser textContent로 확인한다. 생성SVG를 HTML로삽입하지 않는다.
- SVG foreignObject를 Canvas에 그린 후 pixel readback은 SecurityError/taint로 차단됐다. 표시성공과 픽셀읽기/내보내기 성공은 별개다. 외부사진/링크·악성SVG 안전성은 이번 합성자료로 증명되지 않는다.
- 처음 core0.15.0을 같은번호로 묶어 missing exports19개가 발생했다. 배포 package.json의 peer `^0.24.0`을 읽고 수정했다. 이어 ZIP dependency fflate를 격리 추가했다. 제품 npm/권한/manifest에는 변경 없음.
- check07:33:33파일278tests·TS/Vite/MV3/5스킬 PASS. media/behavior·실물10종·원본충실도·coldoffline는 미검증이며 아직 후보선정/제품화하지 않는다.

기존 재현 명령 전에 추가 배포본을 준비한다. 아래도 프로젝트 루트에서 실행한다.

```powershell
New-Item -ItemType Directory -Path 'node_modules/.cache/pptx-spike/office-core-024','node_modules/.cache/pptx-spike/office-preview','node_modules/.cache/pptx-spike/fflate' -Force
& $node $npmCli pack '@office-kit/pptx@0.24.0' '@office-kit/pptx-preview@0.15.0' 'fflate@0.8.3' --ignore-scripts --pack-destination 'node_modules/.cache/pptx-spike'
tar -xf 'node_modules/.cache/pptx-spike/office-kit-pptx-0.24.0.tgz' -C 'node_modules/.cache/pptx-spike/office-core-024'
tar -xf 'node_modules/.cache/pptx-spike/office-kit-pptx-preview-0.15.0.tgz' -C 'node_modules/.cache/pptx-spike/office-preview'
tar -xf 'node_modules/.cache/pptx-spike/fflate-0.8.3.tgz' -C 'node_modules/.cache/pptx-spike/fflate'
```

`$node/$npmCli`는 아래 원래 재현 절의 변수 정의를 사용한다. 현재 비교 스크립트는 세 후보 모두를 실행하고 각각의 실패를 결과에 남긴다.

## 최초 두 후보 실험

- 일시: 2026-10-12 05:25, PRD §7.2/24 Stage D, X-04/SPIKE-T-04.
- 환경: Windows / 실제 Whale 5.39.412.57 headless / 전용 MV3 확장 profile1791750300862. 제품과 동일한 script/worker CSP, 권한 없음. 제품 의존성/manifest는 변경하지 않았다.
- 자료: bundled PptxGenJS 4.0.1로 만든 합성 2쪽. 영문/한글, 도형, PNG, 표, 노트. 실제 교사 파일 및 PowerPoint 기준 출력 아님. 생성 시간 metadata 때문에 재생성 시 hash가 달라질 수 있다.
- 이번 입력 SHA256: `3011fe674435c0515db1ad374c0b0eb44b83afda9e8983ee99f9e66d47a9cabb`.

| 기준 | @aiden0z/pptx-renderer 1.3.0 | pptx-preview 1.0.7 |
|---|---|---|
| 정확한 배포본 | npm tarball SHA512 검증 | npm tarball SHA512 검증 |
| 비교에 쓴 번들 | browser ESM 1,825,514 bytes | UMD 1,362,014 bytes |
| 2쪽 화면/이동 | 합성 텍스트·한글·이미지 decode·표/페이지 이동 PASS, 스크린샷 직접 확인 | 첫 페이지 background 읽기 TypeError로 실패 |
| 첫쪽 관찰 시간 | 511ms, 단일 cold run; benchmark 아님 | 실패 |
| 외부 요청 | 해당 페이지 외부 요청 차단 설정, 관측 0건 | 해당 페이지 외부 요청 차단 설정, 관측 0건 |
| 영상/음원 | unverified | unverified |
| 애니메이션/trigger/timing/transition | unverified | unverified |
| 노트 분리/추출 | 입력에는 존재하지만 기능 미검증 | 미검증 |
| 원본 화면·폰트 충실도 | PowerPoint 기준 출력 없음, unverified | unverified |
| 라이선스 | Apache-2.0 원문 + bundled mtx-decompressor MPL-2.0 대응 소스/ECMA notice 조건 검토 필요 | registry ISC vs 실제 README 소스 공개·변경 제한 충돌, LICENSE 파일 없음 |

## 판단

`aiden`은 추가 평가 후보일 뿐 채택하지 않았다. [공식 저장소](https://github.com/aiden0z/pptx-renderer)의 기능 설명을 우리 제품의 검증 결과로 대신하지 않는다. 패키지 THIRD_PARTY_NOTICES.md의 대응 소스/라이선스 수집과 ZIP·XML·링크·미디어 안전성 검토가 필요하다.

`preview`는 [배포본 README와 공식 저장소](https://github.com/501351981/pptx-preview)의 사용/소스 제한이 registry 선언과 일치하지 않는다. 명확한 재배포 조건 확보 전 채택 대상에서 제외한다. 첫쪽 실패는 이번 합성 자료/UMD 경로에서 관측한 것이며 모든 PPTX에 대한 불능 판정은 아니다. 제한을 우회해 소스를 수정하지 않는다.

외부 요청 0건은 이번 합성 입력의 로컬 표시 근거다. 외부 링크/원격 미디어가 있는 실제 파일, 네트워크 완전 차단 후 재시작, 모든 코드 경로의 오프라인 보증이 아니다. 두 후보 모두 제품 지원 상태는 `unverified`다.

## 재현

프로젝트 루트 PowerShell에서 실행한다. npm lifecycle scripts를 비활성화하고 tarball만 ignored cache에 내려받는다. 기존 캐시 삭제는 필요 없다.

```powershell
New-Item -ItemType Directory -Path 'node_modules/.cache/pptx-spike/aiden','node_modules/.cache/pptx-spike/preview' -Force
$node = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"
$modules = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
$npmCli = Join-Path (Split-Path -Parent (Get-Command npm.cmd).Source) 'node_modules/npm/bin/npm-cli.js'
& $node $npmCli pack '@aiden0z/pptx-renderer@1.3.0' 'pptx-preview@1.0.7' --ignore-scripts --pack-destination 'node_modules/.cache/pptx-spike'
tar -xf 'node_modules/.cache/pptx-spike/aiden0z-pptx-renderer-1.3.0.tgz' -C 'node_modules/.cache/pptx-spike/aiden'
tar -xf 'node_modules/.cache/pptx-spike/pptx-preview-1.0.7.tgz' -C 'node_modules/.cache/pptx-spike/preview'
& $node scripts/verify-whale-pptx-spike.mjs "$modules/playwright/index.mjs" 'C:/Program Files/Naver/Naver Whale/Application/5.39.412.57/whale.exe' "$modules/pptxgenjs"
```

결과는 `node_modules/.cache/pptx-spike/result.json`과 PNG에 남는다. exit0은 비교 실험의 완료이며 두 후보의 성공을 뜻하지 않는다. 개별 `render`/`failure`를 확인한다.

## 次の判断材料

1. 재배포 조건이 명확한 다른 후보를 추가해 같은 입력으로 비교한다.
2. 실제 교사용 10종 이상과 PowerPoint 기준 이미지로 사진/표/차트/음원/영상/노트/효과/폰트 차이를 평가한다.
3. 원본 보존, ZIP/XML·링크 안전 경계, 장시간/대용량 성능과 클린 시작 후 오프라인을 검증한다.
