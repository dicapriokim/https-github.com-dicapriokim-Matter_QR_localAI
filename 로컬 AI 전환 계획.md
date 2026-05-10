HA 버전(_HA 폴더) 단일 스크립트 기반 로컬 LLM 전환 계획
사용자님의 지적대로 다른 폴더(_web)나 과거 기억을 배제하고, 오직 현재 목표인 D:\Antigravity\QR manager\matter_code_vault _HA\matter_code_vault\public\script.js 파일 자체를 뜯어고치는 계획을 세웠습니다.

현재 HA 애드온 버전은 무결성 검사 때문에 모듈화(여러 파일로 쪼개기)를 적용하기 어렵습니다. 따라서 67KB짜리 단일 script.js 파일 내에서 기존 구글 Gemini 코드를 걷어내고, 요청하신 로컬 Ollama 환경으로 완벽히 교체합니다.

User Review Required
IMPORTANT

기존 askGemini 함수와 Google API 관련 코드를 모두 삭제하고, Ollama 전용 통신 함수(callOllama)를 단일 파일 내에 새로 작성합니다.
옵션 연동: 기존에는 HA 애드온 설정에서 api_key를 받아와 Gemini에 썼지만, 로컬 Ollama(192.168.0.32:11434)는 API 키가 필요 없습니다. 기존의 API Key 관련 로직을 제거할지 여부를 승인해 주세요.
계획 내용 확인 후 승인해 주시면 바로 script.js 수정을 시작하겠습니다.
Open Questions
AI 호스트 주소를 http://192.168.0.32:11434로 코드에 하드코딩해도 괜찮을까요? 아니면 기존 HA 애드온 옵션(config.yaml)을 수정하여 사용자가 Ollama 주소를 입력받게끔 할까요? (일단은 하드코딩으로 빠르게 가겠습니다.)
Proposed Changes
[MODIFY] 
script.js
script.js 파일에서 다음 항목들을 중점적으로 수정합니다.

1. Gemini 제거 및 Ollama 통신 모듈 구축 (Keep-alive 강제)
기존 const CURRENT_AI_MODEL = "gemini-2.5-flash-preview-09-2025"; 삭제.
LOCAL_AI_CONFIG (moondream, antigravity-model:3b) 정의 추가.
askGemini 함수를 삭제하고, keep_alive: "5m"이 포함된 callOllama 함수를 새로 작성하여 메모리를 스마트하게 관리합니다.
2. QR 판독 과정 (Dual Model Workflow 적용)
기존 executeAiAnalysis 함수를 완전히 재작성하여 두 단계를 거치게 합니다.

Step 1: Vision Pass (moondream): 이미지에서 MT 코드와 11자리 숫자를 우선 추출.
Step 2: Reasoning Pass (antigravity-model:3b) 및 V3 오타 교정: Step 1 결과와 장소(Location)를 조합해 V3 프롬프트("플립스 섹서 -> Philips 센서" 등 명백한 오타 자동 교정 및 포맷 준수)를 던져 최종 JSON 포맷을 받습니다.
3. 무중단 폴백(Fallback) 시스템 도입
Step 2 (antigravity-model:3b) 연산 중 타임아웃이나 오류 발생 시, 앱이 멈추거나 분석 실패 알림을 띄우는 대신 Step 1(moondream)에서 뽑은 날것의 MT 데이터라도 즉시 UI에 뿌려주도록 예외 처리(try-catch)를 견고하게 설계합니다.
4. 부가 기능 전환
기기명 추천(suggestDeviceName)과 AI 문답(sendAiQuery) 기능도 구글 API 대신 callOllama(antigravity-model:3b)를 타도록 프롬프트를 교체합니다.
Verification Plan
코드 정적 검증: script.js 내에 Gemini 관련 URL이나 변수가 완전히 사라졌는지 확인.
동작 검증 (사고 실험):
사용자가 QR 이미지를 올리면 executeAiAnalysis가 moondream -> antigravity-model:3b 순으로 잘 호출되는가?
antigravity-model:3b 응답을 임의로 차단했을 때, moondream 데이터만으로 정상적으로 모달에 값이 채워지는가?


# 🏛️ Matter Code Vault: Local AI Architecture
**Status**: 🟢 모듈화 리팩토링 완료 & 로컬 AI 전환 시공 중
**Architect**: 안티그라비티 설계자

> [!ABSTRACT] 프로젝트 개요
> 기존 단일 파일(Monolithic) 구조의 Matter Code Vault를 현대적인 모듈형 웹 애플리케이션으로 리팩토링하고, 의존성이 높은 외부 API(Google Gemini)를 제거하여 **Intel N95 로컬 서버 기반의 독립형 AI 비전 시스템**으로 전환하는 프로젝트입니다.

---

## 💻 하드웨어 및 시스템 환경

| 항목 | 상세 사양 | 비고 |
| :--- | :--- | :--- |
| **물리 서버** | Intel N95 CPU / 16GB RAM | Proxmox VE 호스트 |
| **가상 환경** | Ubuntu 24.04 Standard LXC | **RAM 8GB+ 권장** (증설 필요) |
| **AI 백엔드** | Ollama | `OLLAMA_ORIGINS="*"` 설정 필수 |
| **통신 주소** | `http://192.168.0.32:11434` | 로컬 네트워크 내부 통신 |

---

## 🏗️ AI 파이프라인 아키텍처

Matter Code Vault는 클라이언트 자원과 서버 자원을 효율적으로 분배하는 **하이브리드 듀얼 모델 구조**를 채택합니다.

### 1단계: Client-Side OCR (Fast Pass)
- **도구**: `Tesseract.js`
- **역할**: 스마트폰 브라우저에서 즉시 실행되는 1차 텍스트 추출.
- **장점**: 서버 부하 0%, 즉각적인 반응성.

### 2단계: Server-Side AI (Deep Analysis)
Ollama를 통해 두 단계의 모델이 순차적으로 협력(Chaining)합니다.

| 단계 | 모델명 | 역할 | 상세 임무 |
| :--- | :--- | :--- | :--- |
| **Step 1: Vision** | `moondream` | **눈 (Eye)** | 이미지 분석, Matter QR(MT:) 및 페어링 코드 식별 |
| **Step 2: Reasoning** | `antigravity-model:3b` | **뇌 (Brain)** | 데이터 정제, **오타 교정**, 지능형 기기 작명 |

---

## 🛠️ 핵심 시공 로직 (`ai.js`)

> [!IMPORTANT] 스마트 메모리 관리 (Keep-alive)
> N95의 한정된 자원을 위해 모델 호출 시 반드시 `keep_alive: "5m"` 옵션을 부여하여 5분 후 자동 언로드되도록 설계되었습니다.

### 🎯 철통 방어 작명 프롬프트 (V3)
`antigravity-model:3b`에게 부여된 오타 교정 및 작명 지침입니다.

```text
너는 스마트홈 기기 작명 전문가이자 뛰어난 오타 교정기야. 
주어진 정보를 바탕으로 명백한 오타를 스스로 교정하고, 직관적인 기기 이름을 추천해.

[절대 규칙]
1. 오타 교정: 명백한 오타는 자동 교정할 것 (예: 플립스 섹서 -> Philips 센서)
2. 특수기호 사용 금지, 영문 제조사는 정확한 발음이나 영문 유지.
3. 결과는 오직 '추천 이름'만 텍스트로 출력.

[실제 입력]
제조사: ${manufacturer}, 종류: ${type}, 장소: ${location}
출력:

진행 계획
1. googe AI로 진행되는 내용을 로컬 LLM로 되도록 변경할거야
2. QR 로직 스캔 로직은 핸재 그대로 유지 할건데, AI 부분에 수정이 필요해
 - 1차 (Client) Tesseract.js 단순 OCR / QR 스캔
 - 2차 Ollama (AI) 정밀 분석 / 작명 
 - 2차 AI 서버(Ollama)는 다음 두 단계를 순차적으로 거쳐야 한다.
   Step 1: Vision Pass (moondream)
   Step 2: Reasoning Pass (antigravity-model:3b)


Open Questions에 대한 설계자의 추가 처방
Q. 추가되어야 할 특이한 오타 사례나 피해야 할 기호가 더 있을까요?

네, 스마트홈 환경의 특성을 고려하여 아래의 세부 규칙을 V3 프롬프트에 한 스푼 더 추가하면 무결성이 더욱 높아집니다.

플랫폼/브랜드명 오타 및 정규화 (추가 사례)

스마트싱스, 스맛싱 ➔ SmartThings

에플, 홈킽 ➔ Apple HomeKit

구글홈, 구글 ➔ Google Home

이유: Tesseract가 영어 브랜드명을 한글로 이상하게 읽어오는 경우가 잦습니다.

기기 종류(Type)의 표준화

전등, 램프, 불빛 ➔ 조명

스위찌, 스위치버튼 ➔ 스위치

도워락, 문잠금 ➔ 도어락

이유: 앱 내에서 기기를 카테고리별로 관리하기 위해 명칭을 깔끔하게 통일하는 것이 좋습니다.

절대 금지 기호 (추가)

이모지(💡, 🚪 등) 절대 금지: LLM이 신나서 이모지를 붙이는 경우가 있는데, 이는 DB 저장이나 UI 렌더링에서 예기치 않은 오류를 낼 수 있습니다.

괄호((), []) 금지: 이름에 부연 설명이 들어가는 것을 원천 차단합니다.
