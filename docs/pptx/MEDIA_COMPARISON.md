# PPTX 내장 미디어 초기 비교

## web-ppt 0.4.5: 2026-10-12 08:40
- X-04/SPIKE-T-04, Windows Whale5.39.412.57 headless profile1791761961260. 기존 합성3쪽의 별도 canonical 변형을 사용했다. 원래 생성 PPTX SHA256 `0fe162b0a831b112fdebe458b456af4413ed2441203699d1d56bc4388f1b746a`, 변형 hash `869e2fb781f71e0b35bf89eae6000b3a889fce8911125e4f740248fdd8005074`. 이전 office/aiden canonical 시험과 변형 hash가 같으며 새 실제 교사 자료로 세지 않는다.
- 52 ZIP항목/28XML/내부관계35/타입32/초기미디어헤더5/잔여override2 검사, 3쪽 SVG 렌더 및 이미지 decode PASS. 소유 Blob URL만 읽고 모델 MIME/종류를 검사한 뒤 기존 readMediaInput으로 파일 header와 SHA256를 확인했다. 참조 경계 단위22개 및 전체 check08:38:26 40파일397tests/TypeScript/Vite/MV3/5스킬 PASS.
- 모델은 audio/wav1개와 video/mp41개로 정확히 분류했다. WAV64044bytes/4초, MP416423bytes/2.134767초/320×180. 위 원본 WAV/MP4 hash와 추출 바이트 hash가 정확히 일치했다.
- 기본 SVG media badge만 사용하고 실제 재생 요소는 document.createElement로 생성했다. 기본 Viewer/player HTML 직접 삽입은 사용하지 않는다. 소유 Blob 객체를 참조했으며 외부 fetch는 실행하지 않았다.
- 두 요소 무음 재생/paused=false/time>0 PASS. native VIDEO Canvas readback의 가장자리 `[227,39,53,255]`, 중앙 `[255,255,255,255]`로 합성 붉은 배경/흰 사각형을 확인했다. 단일 프레임 체크이며 원본 충실도/전체 프레임의 움직임 일치는 아니다.
- 같은 합성 자료의 독립 B 문맥으로 전환 시 두 요소 pause, 250ms 뒤 시간 변화0(오차 한도0.05초). A 복귀 때 bookmark 약0.076439/0.250891초를 복원하고 두 요소는 paused=true로 수동 재개 대기. 스크린샷에서 실제 영상 프레임과 정지 컨트롤을 직접 확인했다.
- 외부 요청0, 합성 원본 파일 hash불변, SVG 공격6개 거부. 실제 teacher-01 회귀 profile1791761912414도23쪽/12클릭·재진입/취소·외부0·원본불변 PASS.
- **PPTX 제품 Player/단일 재생 권한/명령revision·DB bookmark에는 미연결.** 시험 helper의 메모리 bookmark와 두 모델 문맥이다. 실제 스피커·다른 코덱·고급 미디어 트리거·정확한 슬라이드 내 위치/레이어·동시 재생 정책/장시간·cold복원은 미검증. native 요소는 별도 host 위치에 배치했으며 렌더러의 media:'player' 재현을 보증하지 않는다. PPTX 지원은 unverified 유지한다.

재현: 기존 web-ppt 명령의 마지막 인자를 `--media`로 바꾼다. 기존 verify-whale-pptx-spike의 `--media-canonical` 실행으로 ignored 합성PPTX/WAV와 video-spike MP4가 준비돼 있어야 한다. 이 모드는 합성 입력에만 audioFile 변환을 적용하며 사용자 원본에는 적용하지 않는다. 결과는 ignored `node_modules/.cache/webppt-spike/media/result.json`과 native frame PNG이다.

## 표준 음원 태그 대조: 2026-10-12 07:44

- `--media-canonical`을 추가했다. 브라우저 DOMParser가 합성3쪽 XML과 relationship을 읽고, audio관계로확인된 videoFile1개만 audioFile로바꾼 별도 시험입력을 생성한다. XMLSerializer/fflate로직렬화, ZIP mtime고정. 일반사용자파일에정규화하지않고 원본PPTX를고치지않는다.
- 두후보가받은variant SHA256가같다는assert PASS: `294096bd1afaa95f646d825684e9f11efec638aababe91b9c743d2cddcfe9ccf`. 원래생성PPTX hash는 `9fee1973a4924332978408686845f45070179d5c20c0fc2541370f7a74f7f96a`.
- actualWhale5.39.412.57 headless profile1791758621500: aiden모델audio1/video1, AUDIO/WAV4초 time0.539305 및 VIDEO/MP42.134767초 time0.651236·320×180. media쪽스크린샷직접확인.
- office도audio1/video1로정확추출, MIME과kind불일치없음, WAV/MP4 원본hash보존. 별도hostAUDIO/VIDEO무음재생/time0.539186/0.650405 PASS. SVG 포스터만 표시하는경계는그대로.
- 결론: 앞선음원분류불일치를후보의일반음원버그로확대하지않는다. 생성물이 audio관계/MIME과video태그를섞는경우를경고대상으로남긴다. 이는PowerPoint네이티브저장본의효과/미디어전체호환성증거가아니다.
- check07:43:33파일278tests·TS/Vite/MV3/5스킬PASS. 제품채택·권한·의존성변경없음. 다음패키지입력/태그·관계·MIME·signature검증경계와효과정보실험.

`canonicalPptxAudio`는합성fixture전용구조변환이다. 외부ZIP안전한도검사나제품수리기능으로재사용하면안된다. 모든효과/스피커·장시간/재시작/Player상태계약시험은아직별도다.

## 원래 생성물 실험
- 2026-10-12 07:41, X-04/SPIKE-T-04 / PRD§7.2. 격리실험이며 제품 통합 아님.
- 합성3쪽: 기존텍스트/PNG/표/노트 + 4초PCM WAV(8kHz/mono/16bit), 실제Whale MediaRecorder가만든H.264MP4(320×180/2.134767초). PptxGenJS4.0.1로생성, PowerPoint네이티브저장본은아님.
- 최종PPTX SHA256 `61a6be877bb1292d5a8493b4f53ec48a40998293f982e6912f7094d0a2ef5289`, 실제Whale5.39.412.57 headless profile1791758453763.

## 관측
| 기준 | aiden1.3.0 | office preview0.15.0/core0.24.0 |
|---|---|---|
| 미디어쪽 표시 | nativeVIDEO2개 | SVG 포스터만, nativeaudio/video0개 |
| WAV/MP4 모델 종류 | 둘다video | 둘다video; WAV MIME은audio/wav |
| 재생 | mutedWAV4초/time0.54032, MP42.134767초/time0.651799·320×180 | 렌더러자체재생없음 |
| 원본bytes추출hash | 별도추출비교미실시 | WAV64044bytes/MP416423bytes 모두원본hash일치 |
| 추출후별도host재생 | 해당없음 | AUDIO/WAV time0.539848, VIDEO/MP4 time0.651042·320×180, pausedfalse |
| 효과/timeline/트리거 | unverified | unverified |

office는직접슬라이드재생을제공하지않아 hostPlayer연결이필요하다. aiden이만든재생요소도우리단일Player소유권/명령revision·checkpoint·자료전환정지와자동으로연결되지않는다. 둘다그대로제품에넣어미디어지원완료라할수없다.

## 분류 불일치
생성PPTX XML의WAV는`a:videoFile`을사용하지만해당relationship은audio이고ContentTypes는audio/wav이다. 두후보가영상으로분류한것은이생성물에서관측한경계이며 모든PowerPoint음원이오분류된다는증거는아니다. office원본bytes는보존됐다. 시험host는MIME으로audio/video요소를고르고SHA256를검사했다. 제품에서는MIME만신뢰하지말고압축entry·relationship·파일signature·native metadata를교차확인해야한다. 검사를통과하려고불일치원본을고치지는않았다.

WAV hash `795604ab1a6eb6c6790e6263d4183bfd94521c5f45253a8b6504e4d3ce727deb`, MP4 hash `89e450034a5fe5495118d08a7209208c05bbdce474f089e440f42074107aca80`.

## 재현/제한
[초기후보준비](INITIAL_COMPARISON.md) 및 verify-whale-video-spike로MP4fixture생성후 기존비교명령의마지막인자로`--media`를추가한다. 결과는ignored `node_modules/.cache/pptx-spike/media/result.json`, 후보media쪽PNG. 모델종류/renderer요소개수/정확추출/host시간진행을별도필드로남긴다.

실험페이지외부요청차단/관측0건,음소거native재생만. 실제스피커/다른코덱·PowerPoint원본효과·동시재생규칙·목표슬라이드정확위치·차단복구·자료전환·Player권한연계는미실시. officeSVG Canvas taint제한은그대로이다. 실제교사음원/영상파일과canonical audioFile fixture도후속이다.

check07:40:33파일278tests/TypeScript/Vite/MV3/5스킬PASS. 렌더러채택/제품지원승격없음.
