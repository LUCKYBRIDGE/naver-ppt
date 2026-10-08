# 의존성·폰트·아이콘 라이선스

프로젝트 자체의 공개 배포 라이선스는 아직 선택하지 않았다. 이번 기반은 private package이며 임의의 오픈소스 LICENSE를 붙이지 않는다.

| 구성요소 | 역할 | 라이선스 metadata | 배포 확인 |
|---|---|---|---|
| React / react-dom | UI runtime | MIT | NOTICE/저작권 문구 검토 후 배포 |
| Vite / plugin-react | 빌드 | MIT | 빌드 도구·번들 포함물 구분 |
| TypeScript | 타입 검사 | Apache-2.0 | 개발 도구 |
| Vitest | 자동 테스트 | MIT | 개발 도구 |
| @types 패키지 | 타입 정의 | MIT | 개발 도구 |
| PyYAML 6.0.3 | 이번 스킬 공식 검증의 임시 Python 도구 | MIT | node_modules/.cache 내부; 제품/표준 npm 검증에 포함 안 됨 |
| PDF.js | PDF 렌더러 후보 | 설치/선정 시 확인 | 현재 미도입 |
| PPTX/레거시 렌더러 | 후보 미선정 | 후보별 조사 | 서버/유료/오프라인/재배포 여부 비교 |
| 폰트/아이콘 | 아직 포함 없음 | 도입 시 검토 | 폰트 패키지 배포와 결과 파일 embedding을 별도 판정 |

`npm run licenses`는 `package-lock.json`의 직접·전이 의존성 license 필드를 `docs/generated/dependency-licenses.json`에 기록한다. 이는 목록이며 법적 검토/NOTICE 수집 완료를 뜻하지 않는다. 배포 전 각 패키지의 실제 LICENSE/NOTICE와 번들 포함 여부를 검토한다.

## 추가 기록 양식

```text
이름/버전/출처:
사용 목적과 대안:
라이선스/NOTICE 경로:
런타임·빌드·내보내기 포함 여부:
오프라인/서버/유료 조건:
폰트 embedding/재배포 조건:
검토 결과·일자:
```
