# AI·검색봇 방문 추적 및 관리자 대시보드 설계

- 작성일: 2026-07-26
- 대상 도메인: `https://eomeutteull.com`
- 대상 코드: `codex/eomeutteull-search-growth-implementation`
- 운영 환경: Next.js 16 App Router, React 19, Vercel
- 데이터 저장소: Vercel Marketplace Neon Postgres
- 화면 기준: Pencil `C:\vibecoding\my-shop\초안`의 `AI 방문 관리자 대시보드 데스크톱 B안`, `AI 방문 관리자 대시보드 모바일 B안`
- 상태: 사용자 확정

## 1. 목표

공개 페이지에 방문하는 검색봇, AI 학습 크롤러, AI 어시스턴트의 실시간 출처 확인 요청을 애플리케이션 계층에서 수집한다. 운영자는 `/admin/ai-visits`에서 최근 30일 기록을 목적별·봇별로 확인하고 직전 30일과 비교한다.

이 기능은 실제 방문 요청을 분류해 보여줄 뿐 검색 노출, AI 답변 인용, 고객 유입 또는 매출 성과를 보장하거나 추정하지 않는다.

## 2. 현재 시스템과 제약

- 사이트는 Vercel에 배포된 정적 콘텐츠 중심 Next.js App Router 애플리케이션이다.
- 공개 경로는 `/`, `/menu`, `/store`, `/location`, `/faq`, `/reviews`, `/stories`, `/stories/[slug]`다.
- 기존 관리자 페이지, 관리자 인증, 서버 데이터베이스는 없다.
- 기존 분석은 브라우저 GA4 행동 이벤트뿐이며 서버 방문 수집 기능은 없다.
- Vercel 배포 파일시스템은 영구 분석 저장소로 사용할 수 없으므로 JSONL 대신 Neon Postgres를 사용한다.
- 정적 렌더링과 CDN 캐시를 유지해야 하므로 공개 페이지를 동적 렌더링으로 전환하지 않는다.

## 3. 채택한 접근

루트 `proxy.ts`에서 공개 페이지 요청을 확인하고 User-Agent를 분류한다. 알려진 봇 또는 일반 크롤러 패턴일 때만 `NextFetchEvent.waitUntil()`로 Neon 저장을 시작하고 즉시 `NextResponse.next()`를 반환한다.

채택 이유:

- 정적 페이지와 CDN 캐시를 유지하면서 요청 계층에서 빠짐없이 분류할 수 있다.
- 사람 방문에는 DB 호출이 발생하지 않는다.
- 별도 내부 수집 API가 없어 인증·재시도·추가 함수 호출 복잡도가 없다.
- 저장 장애가 고객 응답에 영향을 주지 않는다.

제외한 접근:

- `proxy.ts`에서 내부 API를 다시 호출하는 구조: 현재 규모에 비해 함수 호출과 보안 경계가 불필요하게 늘어난다.
- 페이지·레이아웃별 기록: 신규 페이지 누락 위험이 있고 정적 렌더링을 약화시킬 수 있다.
- 배포 디렉토리 JSONL: Vercel에서 영속성을 보장하지 못한다.

## 4. 모듈 경계

### `lib/ai-visits/bot-registry.ts`

- 단일 분류표를 소유한다.
- 각 항목은 `botId`, `botName`, `vendor`, `purpose`, 대소문자를 구분하지 않는 UA 패턴을 가진다.
- 구체적인 패턴을 일반 패턴보다 앞에 둔다. 예를 들어 `Googlebot-Image`를 `Googlebot`보다 먼저 판정한다.
- 새 봇은 이 파일의 항목만 추가해 확장한다.

### `lib/ai-visits/classify.ts`

- 공개 API: `classifyAiBot(userAgent)`.
- 알려진 항목을 순서대로 검사한다.
- 알려진 항목이 없고 `bot`, `crawler`, `spider`, `fetcher`, `slurp`가 있으면 `other`를 반환한다.
- 일반 브라우저이면 `null`을 반환해 저장을 건너뛴다.

### `lib/ai-visits/privacy.ts`

- pathname만 허용하고 쿼리와 fragment는 저장하지 않는다.
- User-Agent의 제어문자를 제거하고 최대 길이를 제한한다.
- raw IP, IP hash, 쿠키, 세션 원문, 이름, 전화번호는 읽거나 저장하지 않는다.
- 1차 버전에서는 referrer도 저장하지 않는다.

### `lib/ai-visits/event.ts`

- 분류 결과와 정제된 요청 값으로 저장 이벤트를 생성한다.
- 이벤트 값은 `createdAt`, `path`, `userAgent`, `botId`, `botName`, `vendor`, `purpose`로 제한한다.
- 클라이언트가 보낸 봇 이름·목적값을 신뢰하지 않고 서버 분류 결과만 사용한다.

### `lib/ai-visits/repository.ts`

- Neon serverless driver를 통한 insert와 집계 query를 소유한다.
- SQL 값은 모두 parameter binding으로 전달한다.
- proxy의 저장 경로와 관리자 조회 경로가 같은 스키마·타입을 사용한다.

### `lib/ai-visits/summary.ts`

- 최근 30일 `[now-30d, now)`와 직전 30일 `[now-60d, now-30d)`을 비교한다.
- 목적별 합계, 봇별 합계, 최근 방문, 최다 path를 계산한다.
- 변화는 현재 건수와 이전 건수의 차이 및 변화율로 표시한다.
- 이전 0건·현재 양수이면 `신규`, 두 기간 모두 0건이면 `0%`로 처리한다.
- 동률인 최다 path는 방문 수 내림차순 후 path 오름차순으로 결정해 결과를 안정화한다.

### `lib/admin/auth.ts`

- `ADMIN_PASSWORD_HASH`의 scrypt 해시와 입력 비밀번호를 timing-safe 방식으로 비교한다.
- `ADMIN_SESSION_SECRET`으로 만료시각을 포함한 세션 payload에 HMAC 서명한다.
- 쿠키는 `HttpOnly`, `Secure`(운영), `SameSite=Lax`, `Path=/admin`, 명시적 만료를 사용한다.
- 비밀번호 원문과 쿠키 원문을 DB 또는 로그에 저장하지 않는다.

### 관리자 라우트

- `/admin/login`: 비밀번호 로그인 화면.
- `/admin/login` Server Action 또는 route handler: 인증 검증, 안전한 next 경로 적용, 세션 쿠키 발급.
- `/admin/logout`: 세션 쿠키 만료.
- `/admin/ai-visits`: 인증된 운영자만 접근 가능한 서버 렌더링 대시보드.
- 인증되지 않은 접근은 `/admin/login?next=%2Fadmin%2Fai-visits`로 이동한다.

## 5. 요청 수집 흐름

1. 요청이 `proxy.ts`에 도착한다.
2. 잘못된 관리자 URL이면 정식 URL로 308 보정한다.
3. 관리자, API, Next 내부 자산, 정적 파일, 이미지, JS, CSS, 업로드 경로인지 확인한다.
4. 제외 대상이면 기록 없이 다음 응답으로 진행한다.
5. 공개 HTML 페이지 요청의 User-Agent를 `classifyAiBot`으로 분류한다.
6. 일반 브라우저이면 기록 없이 진행한다.
7. 봇이면 개인정보 최소화 모듈로 path와 User-Agent를 정제한다.
8. `event.waitUntil(recordAiVisit(event).catch(...))`로 저장을 예약한다.
9. DB 완료를 기다리지 않고 원래 사이트 응답을 계속한다.
10. 저장 실패는 `[ai-visits] record failed` warning만 남기고 요청을 실패시키지 않는다.

HEAD 요청은 실제 수집·확인 방문으로 볼 수 있어 GET과 함께 기록한다. OPTIONS, POST, PUT, PATCH, DELETE는 공개 페이지 방문 집계에서 제외한다.

## 6. 수집 제외 규칙

다음 경로와 요청은 수집하지 않는다.

- `/admin`, `/admin/**`
- `/api`, `/api/**`
- `/_next`, `/_next/**`
- `/images`, `/images/**`
- `/media`, `/media/**`
- `/uploads`, `/uploads/**`
- `/favicon.ico`, `/robots.txt`, `/sitemap.xml`
- 확장자가 있는 정적 자산: 이미지, 영상, 폰트, JS, CSS, source map, 문서·압축 파일
- GET·HEAD 이외 메서드

공개 페이지 목록을 하드코딩하지 않고 제외 규칙을 적용하므로 향후 새 공개 HTML 경로도 자동 수집 대상이 된다.

## 7. 봇 분류

목적값은 다음 네 개로 제한한다.

- `search_indexing`: 검색 결과나 AI 검색 결과의 후보 페이지 탐색
- `training`: 모델 학습 또는 지식 수집
- `realtime_citation`: 사용자의 질문에 답하거나 출처를 확인하기 위한 실시간 방문
- `other`: 역할이 명확하지 않은 크롤러

분류표는 사용자 요구사항의 OpenAI, Anthropic, Perplexity, Google, Naver, Microsoft, Apple, DuckDuckGo, Amazon, Meta 및 기타 봇을 모두 포함한다.

구체 패턴 우선순위 예:

- `Googlebot-Image`, `Googlebot-Video` → `Googlebot`
- `GoogleOther-Image`, `GoogleOther-Video` → `GoogleOther`
- `Applebot-Extended` → `Applebot`
- `Meta-ExternalFetcher`, `Meta-ExternalAgent`, `Meta-ExternalAds`는 서로 독립적으로 먼저 판정

## 8. 데이터 모델

테이블: `ai_visits`

| 열 | 타입 | 규칙 |
| --- | --- | --- |
| `id` | `bigint generated always as identity` | 기본키 |
| `created_at` | `timestamptz` | 서버 UTC 시각, 기본값 `now()` |
| `path` | `text` | query 없는 pathname, 길이 제한 |
| `user_agent` | `text` | 제어문자 제거, 길이 제한 |
| `bot_id` | `text` | registry 식별자 |
| `bot_name` | `text` | 운영자 표시 이름 |
| `vendor` | `text` | 회사 이름 |
| `purpose` | `text` | 네 목적값 check constraint |

인덱스:

- `created_at desc`
- `(purpose, created_at desc)`
- `(bot_id, created_at desc)`

`ip_hash`와 `referrer` 열은 개인정보 최소화를 위해 1차 마이그레이션에 포함하지 않는다. 나중에 실제 운영 필요가 확인될 때 별도 승인과 마이그레이션으로 추가한다.

## 9. 관리자 대시보드

확정된 B형 균형 레이아웃을 사용한다.

### 상단

- 제목: `AI 어시스턴트별 방문`
- 기간: `최근 30일 · 직전 30일 대비`
- 전체 AI/크롤러 방문 수
- 검색 인덱싱 방문 수
- 학습 방문 수
- 실시간 인용 방문 수

`other`는 전체 방문에는 포함하되 별도 KPI는 만들지 않는다. 봇별 표의 목적 라벨로 확인한다.

### 봇별 표

열:

- 봇 이름
- 회사/vendor
- 목적 라벨
- 방문 수
- 최근 방문 시간
- 가장 많이 본 페이지
- 변화

데스크톱에서는 표, 모바일에서는 같은 정보를 봇별 카드로 표시한다. 변화는 `+N (+P%)`, `-N (-P%)`, `신규` 중 하나로 표시한다.

### 목적 설명 카드

- 검색 인덱싱: 검색 결과나 AI 검색에 보여줄 후보 페이지를 찾는 방문
- 학습: 모델 학습·지식 수집 목적의 방문
- 실시간 인용: 사용자가 AI에게 질문했을 때 답변·출처 확인을 위해 들어오는 방문

### 빈 상태

`아직 기록된 AI/크롤러 방문이 없습니다. 공개 페이지에 봇 방문이 기록되면 이곳에 표시됩니다.`

## 10. URL 보정과 open redirect 방지

다음 잘못된 경로는 `/admin/ai-visits`로 308 보정한다.

- `/admin/ai-visits%22`
- `/admin/ai-visits"`
- `/admin/ai-visit`
- trailing quote가 반복된 동등 변형

보정은 관리자 인증 판단보다 먼저 수행한다. 보정 후 인증되지 않은 사용자는 정식 경로를 next로 가진 로그인 화면으로 이동한다.

`next` sanitizer 규칙:

- URL decode 실패 시 기본값 `/admin/ai-visits`
- `/` 한 개로 시작하는 로컬 절대 경로만 허용
- `//`, `\\`, scheme, host, 제어문자 차단
- 최종 허용 경로는 `/admin/ai-visits`로 제한

## 11. 오류 처리

- DB 환경변수 없음: proxy 기록은 warning 후 건너뛰며 사이트는 계속 동작한다. 관리자 화면은 구성 오류를 일반 사용자에게 노출하지 않고 운영 로그에만 남긴다.
- DB insert 실패: warning 후 원래 페이지 응답 유지.
- DB query 실패: 인증된 관리자 화면에 `방문 통계를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.` 표시, stack·SQL·자격증명 비노출.
- 잘못된 User-Agent: 빈 값은 일반 방문으로 처리, 과도한 길이와 제어문자 정제.
- 잘못된 쿠키 서명 또는 만료: 인증 실패로 처리하고 로그인으로 이동.
- 잘못된 next: `/admin/ai-visits`로 고정.
- 로그인 실패: 비밀번호 존재 여부를 구분하지 않는 일반 오류 문구 사용.

## 12. 테스트 전략

테스트는 생산 코드보다 먼저 작성하고 각 동작을 RED → GREEN → REFACTOR로 진행한다.

### 분류 테스트

- 사용자 요구사항의 모든 명시된 봇과 목적값
- 대소문자 변형
- 구체 패턴 우선순위
- 일반 `bot/crawler/spider/fetcher/slurp` → `other`
- 일반 브라우저 → `null`

### 개인정보 보호·이벤트 테스트

- raw IP가 이벤트와 repository 입력에 없음
- 쿠키·세션·전화·이름 필드가 없음
- query와 fragment 제거
- User-Agent 제어문자·길이 제한
- 클라이언트 제공 분류값을 사용하지 않음

### 수집 테스트

- 공개 GET·HEAD만 기록
- 관리자/API/정적 파일/이미지/JS/CSS/업로드 제외
- 일반 브라우저 제외
- 저장 실패가 응답을 실패시키지 않음

### 요약 통계 테스트

- 최근 30일 목적별 합계
- 봇별 합계, 최근 방문, 최다 path
- 직전 30일 변화량·변화율
- 이전 0건의 `신규`
- 기간 경계와 동률 path 결정

### 인증·URL 테스트

- 올바른 scrypt 비밀번호만 승인
- 서명 위조·만료 쿠키 거부
- 쿠키 보안 속성
- 잘못된 관리자 URL의 정식 경로 보정
- 외부 URL·protocol-relative·역슬래시 next 차단

### 대시보드 테스트

- 인증 없는 접근 차단
- KPI·표·목적 설명·빈 상태 렌더링
- 요구된 운영자 문구 포함
- 모바일 카드와 데스크톱 표의 동일 데이터

### 고객 화면 금지 용어 테스트

공개 페이지를 렌더링한 뒤 `script`, `style`, 비표시 메타 영역을 제외한 가시 텍스트에서 다음 개발자 용어가 나타나지 않는지 검사한다.

- SEO
- GEO
- LLM
- JSON-LD
- schema.org
- 구조화 데이터

관리자 경로와 내부 코드는 검사 대상에서 제외한다.

## 13. 배포 설계

### 운영 전

1. 현재 Production 배포 ID와 Git commit을 릴리스 기준으로 기록한다.
2. Vercel Marketplace에서 Neon Postgres를 `my-shop` 프로젝트의 Production/Preview/Development에 연결한다.
3. 마이그레이션을 실행하고 테이블·인덱스·constraint를 조회해 확인한다.
4. 강한 임시 관리자 비밀번호와 별도 session secret을 생성한다.
5. 비밀번호 원문은 Vercel에 넣지 않고 scrypt hash만 `ADMIN_PASSWORD_HASH`로 설정한다.
6. `ADMIN_SESSION_SECRET`은 Vercel encrypted env로 설정한다.
7. 테스트, lint, production build를 fresh 실행한다.
8. Preview에서 synthetic UA와 관리자 화면을 먼저 검증한다.

### 운영 후

1. Production 배포 Ready 확인.
2. `https://eomeutteull.com/` 200 확인.
3. `/admin/ai-visits`가 로그인으로 안전하게 이동하는지 확인.
4. 로그인 후 관리자 페이지 200 확인.
5. 잘못된 관리자 URL 3종이 정식 경로로 보정되는지 확인.
6. 사용자 요구사항의 synthetic User-Agent 15종으로 공개 페이지 요청.
7. DB에서 `bot_id`, `purpose`, path를 조회해 기대값과 일치하는지 확인.
8. 브라우저 콘솔 오류 0 확인.
9. Vercel runtime 로그에서 `EACCES`, `permission denied`, `TypeError`, `ReferenceError`가 없는지 확인.

## 14. 완료 기준

다음 항목이 모두 실제 실행 증거와 함께 확인되어야 완료로 보고한다.

- User-Agent 분류 테스트 PASS
- 개인정보 보호·방문 이벤트 테스트 PASS
- 수집 제외·장애 격리 테스트 PASS
- 요약 통계 테스트 PASS
- 관리자 인증·URL 보정 테스트 PASS
- 관리자 대시보드 테스트 PASS
- 고객 화면 금지 용어 테스트 PASS
- 전체 테스트 PASS
- lint PASS
- production build PASS
- 공개 홈페이지 200
- 관리자 로그인·AI 방문 페이지 정상 응답
- 잘못된 관리자 URL 정상 보정
- synthetic User-Agent 실제 DB 기록 일치
- 브라우저 콘솔 오류 0
- 최근 운영 로그의 지정 오류 0

운영 배포 또는 외부 저장소 연결이 권한·결제·인증 문제로 차단되면 구현·로컬 검증과 운영 검증을 분리하고, 확인하지 못한 항목을 PASS로 표시하지 않는다.
