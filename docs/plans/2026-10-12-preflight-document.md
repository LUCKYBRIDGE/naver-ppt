# 전체 페이지 점검
- 목표: 선택 PDF의 일부/전체 페이지 읽기를 분리해 검사 범위를 정확히 기록하고 진행·취소를 제공한다.
- 승인: 제품완성 개발/포괄 승인. adapter-validation/plan-feature 적용.
- 완료 기준: 전체1..count 검사/실패중간결과 미성공·동일원본/선택보호, progress/취소·한도, 일부밖링크의 실제Whale 발견.
- 영향: PreflightReport.scope·check mode, browser 진행/120초 전체 한도, Editor 범위 selector/결과범위·테스트.
- 범위: 전체 operator/annotation 읽기이지 pixel/font/이미지/원본효과 충실도 보증이 아니다. 환경cache·원본비교·전체StageC는 후속.
## 단계
1. [x] 모드·결과·취소·실패 테스트/check05:09(271tests) PASS.
2. [x] actualWhale 합성8쪽 중간링크/전체scope·상태불변/380px·기록(TEST_RESULTS05:11). pixel/font/원본효과·큰파일성능/환경cache 및전체StageC는후속.
