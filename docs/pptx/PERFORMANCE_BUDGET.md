# PPTX 성능·자원 예산 기준

이 문서는 PRD v5 §16·§25·§26의 실제 fixture 및 Windows 네이버 웨일 측정 요구를 위한 기준이다. PPTX 입력 128MiB, 내장 미디어 항목 64MiB, SourceVault 창별 16개/512MiB는 형식·참조 검증 한도이며, 여러 세션의 전체 메모리 한도가 아니다.

현재 확정된 관측:

- `whale-pptx-entry-limit/1791975862802`: teacher-02의 model/native URL 논리값은 22개/92,769,395bytes로 추가 URL 중복을 제거했지만 프로세스 WorkingSet 1,734,160,384bytes는 기존 1.5GiB 실험 기준을 초과했다. 이 결과는 성능 FAIL로 보존한다.
- `whale-pptx-source-sharing/1791976954035`: 두 격리 시험 realm의 논리 asset 합은 11,769,768bytes다. 이는 두 창의 관측 합일 뿐 origin 전체 예약 서비스나 물리 메모리 측정이 아니다.
- `whale-pptx-source-sharing/1792020469388`: teacher-02 실제 52쪽·98,050,517-byte source의 두 격리 realm logical asset 합은 185,538,790bytes다. 최종 해제와 화면/원본 보존은 PASS지만 physical/model 값은 null이며 성능 통과 근거가 아니다.
- `whale-pptx-entry-limit/1792022880826`: 최신 실제 `--media64` 재측정에서 sampled WorkingSet peak `1,735,835,648bytes`로 1.5GiB 실험 기준을 다시 초과했다. 원본 hash 불변·외부 요청 0·페이지 오류 0은 확인했지만 성능 FAIL이다.
- `resourceInventory`의 `physicalMemoryBytes`와 `modelHeapBytes`는 현재 `null`이다. raw backing/owned Blob alias는 source 내부에서만 dedup하며 native allocator, 브라우저 전체, 다른 realm의 공유 메모리는 알 수 없다.

예산 확정 전 필수 측정:

1. teacher-02를 포함한 실제 자료 최소 10종과 PowerPoint 기준 출력의 Visual/Media/Behavior 결과.
2. 두 창 이상의 current/ready/pending 수명, 취소·늦은 결과·창 종료 뒤 reservation 정리.
3. 같은 조건의 cold offline, 장시간 재생, 실제 물리 Whale 창·DPI·듀얼 모니터·오디오 출력.
4. native/model/renderer별 WorkingSet과 종료 후 retained 비용을 같은 프로필 조건에서 반복 측정.

이 항목들이 채워지기 전에는 전체 origin hard cap, 자동 eviction, 현재 발표 자료의 강제 거부, 품질 저하를 구현하거나 지원 등급을 올리지 않는다. 새 자료 입장 판단은 향후 작은 metadata reservation과 실제 완료·실패·close receipt를 연결하되 현재 학생 화면과 원본을 보존해야 한다.
