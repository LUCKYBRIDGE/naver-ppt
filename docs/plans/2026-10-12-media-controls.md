# 로컬 미디어 구간·음량·탐색
- 목표: 현재 발표 페이지의 로컬 미디어를 Remote에서 구간 지정/음량·음소거/위치 이동하고 Player에서 실행한다. PRD v5 §11·Stage B, FR-004/005/006.
- 승인: 사용자의 제품 완성까지 개발 및 포괄 승인에 따라 진행한다. plan-feature/presenter-state 적용.
- 완료 기준: strict shape/현재 대상/revision·epoch 검증, 이전 보고 거부, 백업 metadata 복원, 실제 Whale WAV 및 MP4와 좁은 화면 인수.
- 하지 않는 것: 파일 자르기/원본 변경, bytes 저장, 미검증 코덱 지원 승격, 서비스워커 재생 엔진.
## 영향 범위
- optional LocalMediaRef.playback={startSec,endSec,volume,muted}; 없으면 전체 구간/음량1/음소거false. schema1 유지. 유한값·0≤start<end≤duration, 음량0..1.
- Remote 전용 SET_MEDIA_PLAYBACK/SEEK_MEDIA. 구간 변경은 해당 미디어 정지·새 epoch/시작 위치/ended=false 및 autoplay 정지, 음량만 변경은 재생을 유지한다. seek는 구간 안에서 실행·정지 여부 유지/새 epoch/ended=false이며 autoplay 회차를 보존한다.
- Player는 native volume/muted·구간 종료를 실행한다. timeupdate와 실제 currentTime 기반 deadline을 함께 사용하며 ended는 설정 end에서 판정한다. 백업/공개 projection도 동일 계약을 쓴다.
- 위험: 늦은 checkpoint가 명시 seek를 덮어씀, 구간 종료의 자동 넘김, 정지 위치 저장 경쟁, 음량 설정으로 재생 위치 초기화. 집중 테스트와 실제 영상 회귀로 검사한다.
## 단계
1. [x] 상태/shape/구간 끝 판정·명령·저장/복원·역할 테스트. unit8/integration2 포함236tests PASS.
2. [x] Remote slider/숫자입력/아이콘과 Player native 구간·음량 실행.
3. [x] check/실제 Whale WAV 구간·seek/MP4 재생중 음량·자동 넘김/1366·380px 및 문서. TEST_RESULTS04:12. 영상 구간/실물·소리·장시간 인수는 후속이다.
