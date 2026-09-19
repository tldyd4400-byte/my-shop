# 어믜뜰 온라인 후기 자동 수집·승인 설계

## 1. 목표

어믜뜰 홈페이지가 네이버 블로그 검색에서 새로 발견한 매장 후기를 매일 자동으로 수집하고, 관리자가 원문을 확인해 승인한 후기만 홈페이지에 공개한다.

성공 조건은 다음과 같다.

- 공식 NAVER API HUB 블로그 검색 API만 사용한다.
- 새 검색 결과는 승인 전까지 공개 페이지에 나타나지 않는다.
- 관리자는 기존 관리자 로그인으로 승인·제외할 수 있다.
- 승인된 후기에는 출처, 게시일, 원문 링크가 표시된다.
- 수집이나 데이터베이스 장애가 발생해도 현재 공개 중인 홈페이지와 기존 후기 요약은 정상 표시된다.
- 운영 배포와 외부 서비스 설정은 사용자의 최종 승인 이후에만 수행한다.

## 2. 현재 상태

홈과 `/reviews`는 `lib/content/store.ts`의 `REVIEW_ITEMS` 세 항목을 정적으로 사용한다. 확인일은 `2026-07-19`이며 자동 갱신되지 않는다. 관리자 로그인과 `/admin/ai-visits` 화면, Neon 연결 패턴은 이미 존재한다.

## 3. 범위

### 포함

- NAVER API HUB 블로그 검색 결과의 하루 1회 자동 수집
- 검색어 `어믜뜰`, `어믜뜰 등갈비찜`, `어믜뜰 청주` 사용
- URL 기준 중복 제거
- 제목 또는 설명에 `어믜뜰`이 포함된 결과만 승인 대기로 저장
- `/admin/reviews` 승인 대기·공개·제외 목록
- 관리자 승인과 제외 처리
- 홈 최신 3건, `/reviews` 최신 6건 표시
- 승인된 후기가 없거나 조회가 실패하면 기존 `REVIEW_ITEMS` 유지
- 마지막 수집 시각과 수집 성공·실패 상태 표시

### 제외

- 네이버 플레이스 방문자 리뷰의 비공식 API 호출 또는 화면 수집
- 리뷰의 자동 공개
- 리뷰 본문 전문 복제
- 별점, 평점 평균, 리뷰 수 또는 `AggregateRating` 생성
- 작성자 프로필 이미지나 개인 식별 정보 저장
- 관리자가 제목이나 설명을 임의로 편집하는 기능
- 댓글, 답글, 알림 발송 기능

## 4. 공식 API 계약

호출 대상은 NAVER API HUB의 `GET https://naverapihub.apigw.ntruss.com/search/v1/blog`이다.

- 헤더: `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`
- 쿼리: `query`, `display=20`, `start=1`, `sort=date`, `format=json`
- 사용 필드: `title`, `link`, `description`, `bloggername`, `bloggerlink`, `postdate`
- 제목과 설명의 `<b>` 검색 강조 태그와 HTML 엔티티만 안전한 일반 텍스트로 변환한다. 문구를 요약하거나 재작성하지 않는다.
- 공개 화면에는 `네이버 블로그 검색 결과`라는 출처와 원문 링크를 명확히 표시한다.

공식 문서:

- https://api.ncloud-docs.com/docs/naver-api-hub-search-blog
- https://guide.ncloud-docs.com/docs/apihub-application

## 5. 데이터 흐름

1. Vercel Cron이 매일 한국시간 오전 9시 무렵 `/api/cron/reviews`를 호출한다.
2. 엔드포인트는 `Authorization: Bearer <CRON_SECRET>`을 검증한다.
3. 세 검색어를 NAVER API HUB에 요청한다.
4. 응답을 안전한 문자열과 정규화 URL로 변환한다.
5. `어믜뜰`이 제목 또는 설명에 포함된 네이버 블로그 URL만 남긴다.
6. 같은 원문 URL이 이미 있으면 다시 저장하지 않는다.
7. 새 결과는 `pending` 상태로 저장한다.
8. 관리자가 원문을 확인하고 승인하면 `approved`, 제외하면 `rejected`로 바뀐다.
9. 승인 처리 직후 `/`와 `/reviews`를 재검증해 공개 화면에 반영한다.

Vercel Hobby의 Cron은 하루 한 번 실행할 수 있으며 지정 시간의 한 시간 범위 안에서 실행될 수 있다. 정확한 분 단위 실행은 요구하지 않는다.

## 6. 데이터 모델

### `online_reviews`

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `source_url` | text primary key | 정규화한 HTTPS 네이버 블로그 원문 URL |
| `title` | text | 검색 결과 제목의 안전한 일반 텍스트 |
| `description` | text | 검색 결과 설명의 안전한 일반 텍스트 |
| `blogger_name` | text | 검색 결과 블로그 이름 |
| `blogger_url` | text | 블로그 홈 URL |
| `published_on` | date | `postdate`를 변환한 날짜 |
| `discovered_at` | timestamptz | 최초 수집 시각 |
| `status` | text | `pending`, `approved`, `rejected` 중 하나 |
| `moderated_at` | timestamptz nullable | 승인 또는 제외 시각 |

### `online_review_sync_runs`

| 필드 | 형식 | 규칙 |
| --- | --- | --- |
| `id` | bigserial primary key | 실행 식별자 |
| `started_at` | timestamptz | 수집 시작 시각 |
| `finished_at` | timestamptz nullable | 수집 종료 시각 |
| `status` | text | `running`, `success`, `failed` 중 하나 |
| `discovered_count` | integer | 새 승인 대기 항목 수 |
| `error_code` | text nullable | 비밀정보가 없는 내부 오류 코드 |

`REVIEWS_DATABASE_URL`은 기존 Neon 데이터베이스와 같은 연결 문자열을 사용할 수 있지만 별도 환경 변수로 둔다. 이를 통해 후기 기능의 설정 누락이 AI 방문 통계 기능에 영향을 주지 않도록 한다.

## 7. 화면 설계

Pencil 원본 `C:\vibecoding\my-shop\초안`에 `후기 자동 업데이트 관리자·공개 흐름 승인안` 프레임을 추가했다.

### 관리자 `/admin/reviews`

- 기존 관리자 세션을 재사용한다.
- 상단에 승인 대기 수, 공개 중 수, 마지막 수집 시각을 표시한다.
- 승인 대기 카드에는 출처, 수집일, 제목, 설명, 원문 링크를 표시한다.
- `홈페이지 공개`와 `제외` 버튼을 제공한다.
- 공개 목록에서는 `공개 중지`로 다시 `pending` 상태로 돌릴 수 있다.
- 데이터 조회 실패 시 빈 목록처럼 보이지 않도록 오류 안내를 표시한다.

### 공개 홈 `/`

- 승인된 온라인 후기가 있으면 최신 3건을 표시한다.
- 승인된 온라인 후기가 없거나 데이터베이스를 읽지 못하면 현재 정적 후기 3건을 표시한다.
- 각 온라인 후기에는 게시일, 블로그 이름, 제목, 설명, 원문 링크를 표시한다.

### 공개 후기 `/reviews`

- 기존 네이버 방문자 후기 요약 영역은 유지한다.
- 그 아래 `최근 온라인 후기` 영역에 승인된 최신 6건을 표시한다.
- 자동 수집 글과 기존 네이버 방문자 리뷰 요약을 서로 다른 출처로 명확히 구분한다.

## 8. 보안과 안전장치

- API 키와 데이터베이스 URL은 서버 환경 변수에서만 읽고 브라우저 번들에 포함하지 않는다.
- Cron 엔드포인트는 `CRON_SECRET` 검증에 실패하면 `401`을 반환한다.
- 승인·제외 작업은 유효한 관리자 세션을 다시 확인한다.
- 원문 URL은 HTTPS `blog.naver.com`만 허용한다.
- 검색 결과 HTML은 실행 가능한 마크업으로 렌더링하지 않는다.
- API 응답 전체나 인증 헤더를 로그에 남기지 않는다.
- 수집 실패는 공개 데이터를 삭제하지 않으며 마지막 성공 데이터가 유지된다.
- 한 실행에서 최대 60개 검색 결과만 처리한다.

## 9. 오류 처리

- NAVER API HUB 인증 또는 호출 실패: 실행 기록을 `failed`로 남기고 공개 후기 상태는 변경하지 않는다.
- 일부 검색어만 실패: 성공한 결과는 저장하되 실행 상태는 `failed`로 기록한다.
- 잘못된 날짜나 URL: 해당 항목만 버리고 나머지는 처리한다.
- 데이터베이스 조회 실패: 공개 페이지는 정적 후기로 대체하고 관리자 페이지는 오류 상태를 표시한다.
- 중복 승인 요청: 현재 상태를 다시 확인하고 동일 상태 변경은 성공으로 처리한다.

## 10. 테스트와 검증

- API 응답의 강조 태그·엔티티 제거 테스트
- URL 정규화와 허용 도메인 테스트
- 매장명 필터와 중복 제거 테스트
- 새 항목이 항상 `pending`으로 저장되는 테스트
- Cron 비밀키 인증과 부분 실패 테스트
- 관리자 세션이 없는 승인·제외 차단 테스트
- 승인 후 홈과 후기 페이지에만 표시되는 테스트
- 데이터베이스 실패 시 정적 후기 대체 테스트
- 전체 `npm test`, `npm run lint`, `npm run build`
- 데스크톱과 390px 모바일에서 관리자 및 공개 후기 영역 시각 검수
- Preview에서 실제 API 키로 1회 수집 후, 승인 전 비공개와 승인 후 공개를 확인

## 11. 환경 변수와 운영 준비

- `NAVER_API_HUB_CLIENT_ID`
- `NAVER_API_HUB_CLIENT_SECRET`
- `REVIEWS_DATABASE_URL`
- `CRON_SECRET`
- 기존 `ADMIN_PASSWORD_HASH`
- 기존 `ADMIN_SESSION_SECRET`

운영 준비에는 NAVER API HUB 이용 신청, 블로그 API 애플리케이션 등록, 키 발급, Neon 테이블 생성, Vercel 환경 변수 등록이 필요하다. 이러한 외부 상태 변경과 운영 배포는 구현·Preview 검증 후 사용자에게 최종 승인을 받아 수행한다.

## 12. 완료 기준

- Pencil 설계와 구현 화면이 일치한다.
- 하루 1회 수집이 중복 없이 동작한다.
- 승인 전 결과가 공개되지 않는다.
- 승인과 제외가 관리자 세션 안에서만 가능하다.
- 공개 페이지는 API·DB 장애 때도 기존 정적 후기와 함께 정상 렌더링된다.
- 원문 출처와 링크가 분명하고 평점 또는 리뷰 수를 임의 생성하지 않는다.
- 운영 배포 전 사용자 최종 승인을 받는다.
