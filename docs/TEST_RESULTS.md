# 검증 실행 기록

기준일: 2026-10-08 (Asia/Seoul). 개발 기반과 제품 기능 인수를 구분한다.

## 기반 구축 검증

실행 환경: Windows / Node.js 24.15.0 / npm 11.12.1. 프로젝트 의존성은 package-lock.json 기준이다.

| 검사 | 결과 | 범위 |
|---|---|---|
| 원문 복사·해시 | 통과 | 원문과 docs/source/spec-v4.md 바이트 일치; provenance.json SHA-256 |
| 요구사항 추출 | 통과 | FR 23개, AT 20개, X 10개, IMPL-T 28개 |
| 프로젝트 스킬 | 통과 | Node 구조/내부 참조 + skill-creator quick_validate 5개 + UI YAML 5개 |
| 타입 검사 | 통과 | tsc --noEmit; TypeScript 계약·UI·설정·테스트 |
| 자동 테스트 | 통과 | Vitest 2개 파일, 15개 테스트; 창 허용 목록·sender·오류/결과 누락 경로 |
| MV3 빌드 검사 | 통과 | Vite 8.3.3; manifest·module worker·네 HTML·패키지 script 경로 |
| 문서 내부 링크 | 통과 | 문서/스킬 Markdown 24개 검사; 보관 원문은 링크 검사 제외 |
| 라이선스 목록 생성 | 통과 | npm run licenses; lockfile 94개 항목 metadata, 법적 배포 검토 별도 |
| 웨일 실기기 | 미실시 | 설치 파일 존재 확인만; 로드/창/포커스/재생 검증 아님 |
| PDF·저장·E2E·다중 모니터 | 미실시 | 후속 기능 미구현 |

실행 명령: `npm run check`, 설정 경고 수정 후 `npm run build`, `npm run licenses`. 최종 빌드에 경고/오류가 없다. 초기 타입 검사에서 창 생성 결과 누락 가능성을 확인해 오류 응답을 보완하고 관련 테스트를 추가했다.

스킬 제작 도구의 공식 검사에는 PyYAML이 필요했다. `node_modules/.cache/skill-validator-python`에 PyYAML 6.0.3을 검증용으로만 설치해 실행했고 전역 Python/스킬 설정은 수정하지 않았다. 일반 `npm run check`는 Python에 의존하지 않는다. 시스템 CA 사용으로 의존성 설치 인증서를 검증했으며 TLS 검증을 비활성화하지 않았다.

웨일 설치 파일의 버전 정보는 5.39.412.57로 확인했다. 확장을 실제 브라우저에 로드하거나 기능을 조작한 결과는 아니다. 실제 제품 X/AT/IMPL 시험은 아직 통과한 것으로 표시하지 않는다.

## 후속 결과 양식

```text
실행 일시 / 변경 단계 / 관련 FR:
테스트 ID와 명령/수동 절차:
OS / 브라우저 버전 / 디스플레이·DPI / 권한:
샘플과 해시:
기대 결과 / 실제 결과:
판정: 통과 / 실패 / 미실시
로그·산출물:
제한·재현·후속 조치:
```
