# 어믜뜰 검색엔진 등록 설계

## 목표

- `https://eomeutteull.com`을 Google과 네이버의 공식 웹마스터 도구에 등록한다.
- 검색로봇이 대표 페이지를 발견하고 수집할 수 있도록 표준 파일을 제공한다.
- 검색 반영 여부와 수집 오류를 각 검색도구에서 확인할 수 있게 한다.
- 검색 노출 시점이나 순위를 보장하지 않고, 공식 수집·색인 절차를 정확히 완료한다.

## 선택한 방식

- Google Search Console은 URL 접두어 속성과 HTML 메타태그 인증을 사용한다.
- 네이버 서치어드바이저도 HTML 메타태그 인증을 사용한다.
- DNS 레코드를 바꾸는 도메인 인증은 이번 범위에서 제외한다.
- 인증 코드는 공개 HTML에 들어가는 값이므로 보안 비밀로 취급하지 않되, 사이트 설정 한 곳에서 관리한다.

## 사이트 변경

- `app/robots.ts`에서 모든 일반 검색로봇의 공개 페이지 수집을 허용한다.
- robots 응답에는 절대 주소 `https://eomeutteull.com/sitemap.xml`을 기록한다.
- `app/sitemap.ts`에서 canonical 홈 URL 하나를 포함한 XML 사이트맵을 생성한다.
- 홈 페이지의 중요한 콘텐츠나 구조화 데이터가 바뀐 날짜만 사이트맵 수정일에 반영한다.
- `app/layout.tsx`의 Next.js metadata verification 설정에 Google과 네이버 인증값을 연결한다.
- 기존 canonical, Open Graph, Restaurant·FAQPage·WebSite JSON-LD는 유지한다.

## 등록 흐름

1. 기술 파일을 테스트하고 Vercel에 `--prod --yes`로 배포한다.
2. 공개 `/robots.txt`와 `/sitemap.xml`이 HTTP 200과 올바른 콘텐츠 유형으로 응답하는지 확인한다.
3. Google Search Console에서 `https://eomeutteull.com` URL 접두어 속성을 추가한다.
4. Google HTML 태그 값을 사이트에 반영하고 소유권을 확인한다.
5. Google에 `sitemap.xml`을 제출하고 홈 URL의 색인 생성을 요청한다.
6. 네이버 서치어드바이저에 동일한 사이트를 추가한다.
7. 네이버 HTML 태그 값을 반영하고 소유권을 확인한다.
8. 네이버에 사이트맵을 제출하고 홈 URL 수집을 요청한다.

## 사용자 상호작용

- 로그인 정보와 비밀번호는 사용자가 검색엔진 화면에서 직접 입력한다.
- Codex는 인증 코드가 화면에 나타난 뒤 사이트 설정 반영과 배포를 담당한다.
- 사이트 속성 추가, 소유권 확인, 사이트맵 제출처럼 외부 상태를 바꾸는 최종 버튼은 실행 직전에 확인한다.
- CAPTCHA나 추가 보안 인증이 나타나면 사용자가 직접 완료한다.

## 오류 처리

- 인증 실패 시 배포된 HTML의 실제 meta 태그 값과 canonical 호스트를 먼저 비교한다.
- 사이트맵 실패 시 HTTP 상태, XML 내용, 절대 URL, 소유확인 도메인 일치를 검사한다.
- robots 검사 실패 시 응답 콘텐츠 유형과 `Allow: /`, Sitemap 절대 URL을 검사한다.
- 검색 반영 지연은 오류로 단정하지 않고 각 도구의 수집·색인 상태를 기준으로 판단한다.

## 테스트와 완료 조건

- 계약 테스트가 robots와 sitemap 소스, canonical 도메인, 두 인증 metadata 키를 검증한다.
- `npm test`, `npm run lint`, `npm run build`가 모두 통과한다.
- 공개 robots와 sitemap이 HTTP 200으로 응답한다.
- Google과 네이버에서 사이트 소유권 확인이 완료된다.
- 두 도구 모두 `https://eomeutteull.com/sitemap.xml`을 오류 없이 접수한다.
- 홈 URL 수집 또는 색인 요청이 접수된 상태를 확인한다.

## 범위 밖

- 검색 순위 보장, 광고 집행, 키워드 구매, 백링크 대행은 포함하지 않는다.
- 블로그·메뉴 상세 페이지 같은 신규 콘텐츠 생성은 별도 SEO 콘텐츠 단계로 다룬다.
- Google 비즈니스 프로필과 네이버 플레이스의 매장 정보 수정은 이번 등록과 분리한다.
