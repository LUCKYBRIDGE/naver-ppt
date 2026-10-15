# 의존성·폰트·아이콘 라이선스

2026-10-14: 고정 @web-ppt/core0.4.5 parser의 bgRef 스타일 행렬 계산을 빌드 때 수정한다. 원본 MIT/저작권 고지를 유지하고 `licenses/web-ppt-core-MODIFICATIONS.txt`에 변경 내용을 동봉한다. node_modules/원본 PPTX는 수정하지 않는다. 변환 코드와 고정 입력 SHA256은 `scripts/pptx-background-patch.ts`, 산출물 수정고지/Worker marker는 verify-build가 확인한다. 새 라이브러리·폰트·권한·원격 코드는 없다. [검증과 범위](plans/2026-10-14-pptx-background-reference.md).

2026-10-12 23:45: 공식viewer-core0.4.5 MIT Copyright2026 unStone을실제PPTX Player state/playGroup 위해고정설치(ignore-scripts/audit취약점0). `licenses/web-ppt-viewer-core-LICENSE` 동봉/빌드검사. core0.4.5 peer/fflate0.8.3 재사용, 서버/폰트/원본전송/권한추가없음. 일반PPTX등록은아직미활성. [근거](pptx/PRODUCT_PLAYER_RUNTIME.md).

2026-10-12 23:29: 기존core0.4.5 MIT의로컬렌더함수를제품비공개미리보기의지연번들로사용한다. 공식Worker model/asset와safeSVG/소유Blob 경계, 기존LICENSE동봉. 새라이브러리/폰트/권한/업로드없음. embeddedFonts자동설치/로드없음. 일반발표렌더러판정은별도. [근거](pptx/PRIVATE_PREVIEW.md).

2026-10-12 23:16: `@web-ppt/core@0.4.5`를 제품의 선택형 로컬 모델 진단 Worker에만 고정 채택했다. MIT Copyright2026 unStone 실제 LICENSE를 `licenses/web-ppt-core-LICENSE`에 동봉한다. 기존 fflate0.8.3을 재사용, ignore-scripts 설치/audit 취약점0. 서버/CDN/폰트/원본업로드 없음. 일반 렌더러/발표 지원 결정과 구분한다. 아래 제품 미포함 문구는 이전 실험 시점 기록이다. [근거](pptx/PRODUCT_MODEL_WORKER.md).

2026-10-12 22:58: 고정된fflate0.8.3(MIT, Copyright2026 Arjun Barrett)을Editor PPTX 원본 점검/로컬 ZIP Worker에번들한다. `licenses/fflate-LICENSE` 실제원문을산출물에동봉하며verify-build에서확인한다. build dependency 위치/버전은유지, 서버/자료업로드/CDN없음. 렌더러지원활성화와는별개다. [근거](pptx/EDITOR_INSPECTION.md).

2026-10-12 07:48 초기기록: fflate0.8.3을PPTX공통입력경계실험의개발의존성으로고정했다. 실제node_modules/fflate/LICENSE MIT확인, [공식소스](https://github.com/101arrowz/fflate). ZIPparser를직접작성하지않고압축해제전metadata filter로전체한도를검사하는목적. 당시격리번들만사용, npm install은ignore-scripts 사용.

2026-10-12 07:33 격리실험 추가: office-kit core0.24.0/preview0.15.0 실제 LICENSE MIT, fflate0.8.3 MIT. Vite browser entry만번들·preview Node전용 resvg/fontkit/부속폰트미사용. tarball은ignoredcache/제품의존성아님, 라이선스 최종배포검토/NOTICE 수집은채택후 별도. [공식프로젝트 및 비교](pptx/INITIAL_COMPARISON.md).

2026-10-12 PPTX 격리 실험(제품 의존성 아님): @aiden0z/pptx-renderer1.3.0 Apache-2.0 원문과 bundled mtx-decompressor1.4.2 MPL-2.0 대응소스/ECMA notice를 배포본에서 확인했다. 최종 재배포 수집/검토는 미완료. pptx-preview1.0.7은 npm ISC와 README 소스공개/변경제한이 충돌하고 LICENSE파일이 없어 조건 명확화 전 채택 제외. bundled PptxGenJS4.0.1 MIT는 합성fixture 생성에만 사용한다. 서버/계정/자료업로드/런타임CDN 없음. [초기비교/공식출처](pptx/INITIAL_COMPARISON.md).

프로젝트 자체의 공개 배포 라이선스는 아직 선택하지 않았다. 이번 기반은 private package이며 임의의 오픈소스 LICENSE를 붙이지 않는다.

| 구성요소 | 역할 | 라이선스 metadata | 배포 확인 |
|---|---|---|---|
| React / react-dom | UI runtime | MIT | NOTICE/저작권 문구 검토 후 배포 |
| Vite / plugin-react | 빌드 | MIT | 빌드 도구·번들 포함물 구분 |
| TypeScript | 타입 검사 | Apache-2.0 | 개발 도구 |
| Vitest | 자동 테스트 | MIT | 개발 도구 |
| fake-indexeddb 6.2.5 | IndexedDB transaction/CAS/실패 회귀 테스트 | Apache-2.0 | 개발 테스트 전용, 제품 번들 미포함 |
| @types 패키지 | 타입 정의 | MIT | 개발 도구 |
| PyYAML 6.0.3 | 이번 스킬 공식 검증의 임시 Python 도구 | MIT | node_modules/.cache 내부; 제품/표준 npm 검증에 포함 안 됨 |
| PDF.js / pdfjs-dist 6.4.299 | lazy PDF 파싱·렌더/자체 worker | Apache-2.0 | 원본 LICENSE를 dist/pdf-resources에 포함; offline experimental 채택 |
| lucide-react 1.55.0 | Editor 도구 아이콘 | ISC / Feather 파생 아이콘 MIT | 실제 LICENSE 확인, dist/licenses에 원문 포함; 로컬 tree-shaken 번들 |
| PPTX/레거시 렌더러 | 후보 미선정 | 후보별 조사 | 서버/유료/오프라인/재배포 여부 비교 |
| Malgun Gothic | Windows 설치 글꼴로 글상자 측정/표시 | 시스템 글꼴 참조, 파일 미배포 | export embedding은 별도 판정 |

`npm run licenses`는 `package-lock.json`의 직접·전이 의존성 license 필드를 `docs/generated/dependency-licenses.json`에 기록한다. 이는 목록이며 법적 검토/NOTICE 수집 완료를 뜻하지 않는다. 배포 전 각 패키지의 실제 LICENSE/NOTICE와 번들 포함 여부를 검토한다.

## 추가 기록 양식

2026-10-12 web-ppt Worker 후속: 동일 고정0.4.5 MIT 공식 worker/parser를 로컬 실험 bundle로 포함했다. package sideEffects의 Worker 누락 때문에 해당 실험 bundle만 treeshake:false이다. 소스 원문/제품 의존성은 변경하지 않았다. fflate0.8.3 MIT도 해당 bundle에 포함되므로 공개 제품 채택 시 두 원문 고지를 패키징해야 한다. 현재는 ignored cache 전용/제품 미채택이며 runtime 서버·CDN·업로드 없음.

2026-10-12 web-ppt 후보 실험: @web-ppt/core0.4.5 / @web-ppt/viewer-core0.4.5, [공식 저장소](https://github.com/unStone/web-ppt), 실제 각 tarball의 LICENSE는 MIT copyright2026 unStone. 정확 tarball SHA512는 verify-whale-webppt-spike.mjs에서 검증한다. ignore-scripts로 내려받은 ignored cache 전용이며 package.json/lockfile와 제품 번들에는 추가하지 않았다. 로컬 Vite/fflate0.8.3으로 묶어 오프라인 CSP 실행, 서버/계정/유료/API 업로드/CDN 없음. 기본 Viewer innerHTML 대신 제공 상태/재생 API와 검증된 DOM 투영을 실험했다. 재배포 LICENSE 포함/전체 전이 의존성 고지는 제품 채택 시 다시 검토한다. 현재는 후보 미채택이다.

2026-10-11 lucide-react 1.55.0: 수업 중 사용하는 도구를 표준 아이콘으로 표시하기 위해 채택했다. node_modules/lucide-react/LICENSE에 ISC와 Feather 파생 아이콘 MIT 문구가 함께 있어 원문 전체를 빌드 산출물에 보존한다. 서버/CDN/계정/업로드 없이 오프라인 실행하며 글꼴 파일은 추가하지 않는다.

2026-10-11 PDF.js: [공식 API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html), [공식 배포/릴리스](https://github.com/mozilla/pdf.js/releases), 실제 npm registry 6.4.299와 패키지 LICENSE 확인. 서버/계정/유료/API 업로드가 필요 없다. worker·CMap·standard_fonts·wasm·iccs를 로컬 패키징한다. 미사용 QuickJS sandbox는 제외한다. Node 전용 optional @napi-rs/canvas 1.0.11(MIT)은 npm 설치에 존재하지만 브라우저 확장에 native Node 모듈을 포함하지 않는다.

부속물의 라이선스도 배포 폴더에 그대로 포함한다: CMaps의 Adobe LICENSE, Foxit 폰트의 PDFium BSD 계열, Liberation의 GPLv2+font embedding exception(패키지 LICENSE_LIBERATION 원문), OpenJPEG BSD-2, JBIG2 PDFium BSD, qcms MIT 및 PDF.js wrapper Apache 문구. Liberation을 OFL이라고 가정하지 않는다. 공개 배포 전 폰트의 대응 소스/재배포 조건과 전체 NOTICE 수집을 최종 검토해야 하며 현재 법적 배포 검토 완료로 표시하지 않는다. 결과 PDF embedding 조건은 내보내기 채택 시 별도로 확인한다.

2026-10-11: [fake-indexeddb 원본](https://github.com/dumbmatter/fakeIndexedDB), 정확 버전 6.2.5. 직접 메모리 repository 대역으로는 IndexedDB 트랜잭션/rollback/CAS를 검증할 수 없어 개발 의존성으로 채택했다. `node_modules/fake-indexeddb/LICENSE` 확인. 테스트 실행은 오프라인 가능하며 서버/계정/유료 서비스가 필요 없다. 패키지 metadata의 license 누락은 실제 Apache LICENSE 확인 후 lockfile에 기록했다. 실제 저장 동작은 별도 Edge 브라우저 시험으로 확인한다.

브라우저 smoke는 Codex에 이미 설치된 Playwright를 명시적 경로로 사용하며 제품 의존성에 추가하지 않았다. 전용 테스트 프로필은 node_modules/.cache/storage-browser에 두고 개인 프로필을 열지 않는다.

```text
이름/버전/출처:
사용 목적과 대안:
라이선스/NOTICE 경로:
런타임·빌드·내보내기 포함 여부:
오프라인/서버/유료 조건:
폰트 embedding/재배포 조건:
검토 결과·일자:
```

2026-10-12 02:51 갱신: pdf-lib writer를 Editor PDF 저장 UI의 local dynamic chunk로 연결하고 actual Whale extension+CSP/nativeOPFS/독립Node reader 시험을 통과했다. 기존 experimental/물리chooser·download·실물파일/배포법적검토 제한은 유지한다. 이번 UI연결 단계에서 새 패키지는 추가하지 않았다.

2026-10-12 PDF writer 실험: pdf-lib 정확1.17.1, [공식 저장소](https://github.com/Hopding/pdf-lib)/[API](https://pdf-lib.js.org/docs/api/classes/pdfdocument), MIT 원문 node_modules/pdf-lib/LICENSE.md. 원본 vector 페이지에 PNG 공개 레이어를 합성하기 위해 채택 후보로 추가했다. 실제 Whale dev-origin 합성4회전/crop/한글/판서/검색텍스트 재검증 PASS이며 UI와 확장 출력 인수 전 experimental이다. 런타임 코드는 로컬 번들, 서버/계정/CDN/유료 API 없음. 폰트파일을 embed하지 않고 기존 Canvas에서 그린 글씨를 PNG로 저장하므로 오버레이 문자는 검색되지 않는다. 원본 PDF의 embedding/저작권 조건을 변경하지 않는다.

추가 transitive는 @pdf-lib/standard-fonts1.0.0 MIT, @pdf-lib/upng1.0.1 MIT, pako1.0.11 MIT 및 포함 zlib 고지, tslib1.14.1의 Microsoft 저작권/허용 고지이다. 설치된 LICENSE.md/LICENSE/CopyrightNotice.txt를 직접 확인하고 scripts/pdf-resources.ts에서 모두 dist/licenses에 복사한다. 해당 패키지는 npm metadata에 license가 없어 생성 목록은 REVIEW_REQUIRED로 남으며 실제 원문 검토 근거는 이 항목이다. 공개 배포 최종 법적 검토와 기존 Liberation font source 조건은 여전히 남는다. 정확 dependency/lock 추가 외 기존 libc10개 metadata를 보존했다. npm 설치 --ignore-scripts, npm audit0 reported(설치 시점)이며 취약점 부재의 영구 보장은 아니다.
