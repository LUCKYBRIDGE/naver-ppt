# PPTX 내장 음원·영상 한도 확대
- 목표: teacher-02의 56,779,103bytes MP3가 있는 원본을 수정하지 않고 등록·모델/미디어 준비할 수 있는지 실제 Whale에서 판단한다.
- 승인: 사용자의 32MB 초과 한도 확대 제안과 기존 제품 완성 개발 요청.
- 선택: 음원/영상 항목만 64MiB 후보로 검증한다. 일반 항목32MiB/XML4MiB/입력128MiB/전체압축해제256MiB/압축비율·경로·활성콘텐츠 검사는 유지한다.
- 완료 기준: metadata/Worker수신/공식모델asset 경계가 같은한도를검사, 정상57MB실물과64MiB경계/초과·일반항목거부 테스트, 실제Whale등록/기존PDF보호/자산해제·원본불변·메모리실측, 결과/인수인계 갱신.
- 위험: Worker전송복사+공식parser의ZIP전체해제/asset복사+Blob+원본files 유지 비용. 64MiB 허용이 모든파일/저사양PC 지원을 뜻하지 않는다.

## 영향 범위
- packageGuard/isolatedPackage/workerEnvelope: 음원·영상만 제한적으로 확대. 새 라이브러리/권한/저장 schema 없음.
- tests: 모의metadata로 경계검사(대량 할당 회피)와 실제 자산/Worker 계약.
- scripts: 전용Whale 실제teacher-02/기준PDF 등록·모델준비/해제·메모리 측정. 원본문서내용/미디어를 로그/외부에 보내지 않는다.

## 단계
1. [x] 복사/해제 경계 조사. 공식parser의asset deferredIndex 재사용과Worker asset.slice/transfer 확인.
2. [x] 64MiB 음원·영상후보 구현 및 경계/회귀 테스트. 일반항목/XML/입력/전체압축해제/ratio유지,1,239tests/빌드PASS.
3. [x] 실제Whale에서등록/모델준비/해제 및브라우저프로세스WorkingSet측정. 전용browserCDP가반환한PID만읽었다. 프로세스강제종료/사용자프로필조작없음. 최종1791901996577:52쪽등록/원본3·1·26·52준비·nativeMP3길이3547.92초/Editor자산해제0/PDF복귀PASS. 모델에서선택쪽audio주소null로제품내장연결은미완료다.
4. [x] 전용browser전체WorkingSet표본최대1,552,617,472bytes(약1.45GiB),실험1.5GiB범위이내. 표본측정은프로세스메모리상한보증/장시간누수/저사양인수가아님. 초기2회는등록/비공개뷰성공뒤수동미디어연결UNOWNED_MEDIA로실패했고성공으로세지않았다.
5. [x] check·기존PDF/합성media/teacher-01회귀·문서/인수인계 갱신.1,239tests/빌드·교사1791902089644/내장1791902089803/foundation1791902089861 PASS. 실제teacher-02효과/제품음원연결·미디어충실도는 미완료로 별도판정.

## 남은 별도 문제
- teacher-02 slide3의a:audioFile은audio relationship rId1/TargetModeExternal을가리키고p14내장media는rId2/내부media1.mp3이다. 외부대상본문/주소는로그·실행하지않았다. 공식모델은audio/mpeg/shapeId3의src=null이라현재수동연결guard가거부한다.
- 다음은내장관계만독립검증해연결할수있는지설계한다. 외부참조허용/guard삭제로우회하지않는다. 64MiB파일크기수용이이원본의음원재생/효과충실도완료를뜻하지않는다.
