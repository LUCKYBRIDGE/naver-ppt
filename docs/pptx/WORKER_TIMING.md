# 후보 파서 Worker와 효과 구조
- 추가 확인: 2026-10-12 08:15, office Worker의 전페이지 정적 SVG 출력 hash 대조.
- 확인: 2026-10-12 08:11, Windows Whale5.39.412.57 headless, 고정 로컬 MV3/CSP.
- 범위: 격리 비교 실험이며 제품 지원이나 원본 수준 효과 재생 완료가 아니다.

## 파서 비교
| 후보 | 교사23쪽 | 합성 미디어3쪽 | 제한 |
|---|---|---|---|
| aiden1.3.0 | ZIP parse 이후 model 단계 ReferenceError | 동일 | missingGlobal=DOMParser. 설치된 XmlParser 소스도 new DOMParser 사용. Worker용 DOM 대체를 도입하지 않았다. 본 화면 렌더는 유지 |
| office-kit core0.24.0/preview0.15.0 | Worker loadPresentation/getSlides/getSlideAnimations 성공 | 성공 | document/DOMParser 없는 Worker에서 요약이 본 화면과 deepEqual. 모델 전체 전달·렌더·제품 Player 연결은 미실시 |

Worker 입력은 앞선 ZIP/XML/관계/콘텐츠 검사를 통과한 자료 사본이다. 전용 로컬 module Worker의 실행은 15초 제한·완료/오류 시 terminate한다. 예외는 고정 phase/code와 허용 오류 이름·미확인 global만 요약하며 파일 내용은 반환하지 않는다. 제품에는 아직 연결하지 않았다.

## 교사 자료의 효과
| 쪽 | 원본 XML presetClass 효과 노드 수 | office 단계 수 |
|---|---:|---:|
| 3 | 6 | 6 |
| 9 | 1 | 1 |
| 12 | 2 | 2 |
| 19 | 3 | 3 |

전체23쪽에서 입장/강조/퇴장 presetClass가 있는 cTn 개수를 원본 XML로 따로 세어 office API의 단계 수와 일치함을 assert했다. 12개 모두 API에서 effect=appear, start=click, delayMs=0, durationMs=null, sequence=mainSeq, targetCount=1, playable=true로 읽힌다. playable은 라이브러리의 모델 판정이지 우리 Player의 재생 성공이 아니다. null duration을 임의 값으로 바꾸지 않는다. 텍스트와 도형 ID는 문서/요약에 복사하지 않았다.

합성 미디어 자료의 효과는 원본/모델 모두0이다. 미디어 재생 시간을 애니메이션 성공 증거로 쓰지 않는다. 모션 경로·트리거·문단별/복합/동시 효과·장면 전환·PowerPoint 기준 대조는 미실시이다.

## 재현과 결과
- DEVELOPMENT.md의 verify-whale-pptx-spike 명령에 교사 파일 경로 또는 --media-canonical을 지정한다. 시험 입력 경로를 불특정 파일 corpus 지원으로 해석하지 않는다.
- teacher-01 profile1791760229591, media profile1791760250343. 기존23쪽 렌더/image decode·원본 hash 불변·미디어 hash/무음 진행·외부 요청0 유지.
- office bundle806579bytes: getSlideAnimations export 추가 후 크기. 제품 dist 비용이 아닌 격리 실험 크기이다.
- 초기 실험의 office await 누락과 canonical Uint8Array를 transfer list에 넣은 오류를 수정했다. 최종 실험에서는 ArrayBuffer 사본만 전송한다. aiden의 DOMParser 부족은 수정된 실험에서도 재현된다.
- 후보 비교 script exit0는 모든 후보 Worker 성공을 뜻하지 않는다. aiden Worker 실패와 preview 기존 background 실패를 명시적으로 남긴다.

## Worker SVG 출력
- 교사 profile1791760440213:23쪽 모두 Worker와 본 화면의 SVG SHA256 일치. 생성 byte 크기 누적36515403/최대3161560. 전체 본문을 보관하지 않고 선택1/3/15/23쪽만 로컬 Image.decode로 확인했다.
- 미디어 profile1791760476184:3쪽 hash 일치·3개 Worker SVG decode, 기존 원본 미디어 hash와 무음 재생 유지.
- 한 페이지32MB/전체 생성256MB 한도, 입력 사본/15초 제한, 완료/실패 terminate 및 Blob URL 정리. report에는 SVG 본문이나 원본 텍스트가 없다.
- 동일 엔진의 실행 위치 대조일 뿐 원본 PowerPoint 기준이 아니다. 정적 SVG가 같아도 애니메이션 재생은 미검증이며 foreignObject 픽셀 readback 제한도 유지한다. 제품 UI/Player에는 아직 연결하지 않았다.
