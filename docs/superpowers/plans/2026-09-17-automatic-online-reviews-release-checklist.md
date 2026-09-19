# 어믜뜰 온라인 후기 자동 업데이트 배포 체크리스트

## 현재 상태

- 로컬 구현 완료: 네이버 블로그 검색 결과 수집, 중복 제거, 승인 대기, 관리자 승인·숨김·거절, 승인 후기 공개 노출
- 공개 기본값: 데이터베이스 또는 외부 API 설정이 없어도 기존 정적 후기 콘텐츠 유지
- 공개 범위: 승인된 후기만 홈 최대 3개, 후기 페이지 최대 6개 노출
- 자동 실행: Vercel Cron 기준 매일 09:00 KST (`0 0 * * *` UTC)
- 운영 배포 및 외부 계정 설정: 아직 수행하지 않음

## 로컬 검증 기록

- 전체 테스트: `npm test`
- 정적 분석: `npm run lint`
- 프로덕션 빌드: `npm run build`
- 화면 검수:
  - `/reviews` 기존 후기 콘텐츠와 예약·위치 정보 정상 표시
  - `/admin/reviews` 미인증 사용자를 `/admin/login?next=%2Fadmin%2Freviews`로 이동
  - 리뷰 데이터베이스 미설정 시 기존 정적 후기 콘텐츠로 안전하게 대체

## Preview 환경 설정 순서

1. NAVER API HUB에서 Blog Search API 애플리케이션을 등록한다.
2. Preview용 PostgreSQL 데이터베이스를 별도로 준비한다.
3. Preview 데이터베이스에 `npm run migrate:online-reviews`를 실행한다.
4. Vercel Preview 환경에 아래 환경 변수를 등록한다.
   - `NAVER_API_HUB_CLIENT_ID`
   - `NAVER_API_HUB_CLIENT_SECRET`
   - `REVIEWS_DATABASE_URL`
   - `CRON_SECRET`
   - `ADMIN_PASSWORD_HASH`
   - `ADMIN_SESSION_SECRET`
5. Preview 배포를 만든다.
6. `Authorization: Bearer <CRON_SECRET>`로 수집 엔드포인트를 한 번 실행한다.
7. 수집된 후보가 승인 전에는 공개 페이지에 나타나지 않는지 확인한다.
8. 관리자 화면에서 후보 1건을 승인한 뒤 홈과 `/reviews` 노출을 확인한다.
9. 원문 링크, 모바일 배치, 키보드 접근, 서버 로그를 확인한다.
10. 결과를 사용자에게 보여주고 Production 배포 최종 승인을 받는다.

## Production 승인 게이트

다음 작업은 사용자의 최종 승인 전에는 수행하지 않는다.

- Production 환경 변수 등록 또는 변경
- Production 데이터베이스 마이그레이션
- 운영 Vercel 배포
- 운영 Cron 활성화
- 승인된 후기의 실제 운영 사이트 공개

## 운영 후 확인

- 첫 자동 수집 실행 결과와 실패 로그 확인
- 중복 URL이 다시 저장되지 않는지 확인
- 관리자 승인 전 후보가 공개되지 않는지 재확인
- 승인 후기 원문 링크가 네이버 블로그 원문으로 연결되는지 확인
- 월 1회 API 오류율, 승인 대기 건수, 오래된 후기 링크를 점검
