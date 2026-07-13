---
id: eomeuittul-rib-shabu
name: Eomeuittul Deunggalbi-jjim Cheongju Bongmyeong Main
display_name_kr: 어믜뜰 등갈비찜 청주봉명동본점
country: KR
category: restaurant
homepage: "https://my-shop-ecru-six.vercel.app"
primary_color: "#9F2F1F"
omd: "0.1"
tokens:
  colors:
    primary: "#9F2F1F"
    primary-deep: "#6F1F17"
    gochujang: "#B83A24"
    straw: "#D8B86A"
    ocher: "#F4E4C8"
    rice: "#FFF8EA"
    hanji: "#F7EEDC"
    iron: "#2A2520"
    wood: "#6D4B32"
    green: "#496B3A"
    brass: "#B8873A"
    body: "#3A3028"
    muted: "#6F6258"
    hairline: "#D9C3A3"
    on-primary: "#FFF8EA"
  typography:
    family: { display: "Pretendard Bold", body: "Pretendard", accent: "system-serif" }
    section: { size: 34, weight: 700, lineHeight: 1.35, use: "Section headline" }
    title: { size: 24, weight: 700, lineHeight: 1.45, use: "Card and menu title" }
    lead: { size: 20, weight: 600, lineHeight: 1.55, use: "Hero subcopy" }
    body: { size: 18, weight: 400, lineHeight: 1.65, use: "Readable body copy" }
    caption: { size: 16, weight: 500, lineHeight: 1.50, use: "Smallest allowed UI text" }
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, section: 72 }
  rounded: { sm: 4, md: 6, lg: 8, xl: 12, pill: 9999 }
  shadow:
    none: "none"
    soft: "0 12px 28px rgba(42,37,32,0.08)"
components_harvested: true
---

# DESIGN.md

## 1. Visual Theme & Atmosphere

어믜뜰 등갈비찜 청주봉명동본점은 "어머니의 마음 같은 공간"을 화면으로 옮긴 샤브형 매운 등갈비찜 전문점이다. 첫인상은 젊은 손님에게는 "처음 보는 등갈비찜"으로, 나이 있는 손님에게는 "정갈하고 믿을 수 있는 한식당"으로 느껴져야 한다.

분위기는 볏짚, 황토, 한지, 나무, 무쇠솥, 놋그릇, 김 오르는 매운 국물에서 출발한다. 음식은 이색적이지만 공간은 낯설지 않아야 하며, 설명은 친절하고 글자는 충분히 커야 한다.

디자인은 과한 불맛 그래픽이나 번쩍이는 매운맛 연출을 피한다. 대신 깊은 고추장 레드, 황토 미색, 쌀빛 표면, 무쇠 차콜을 중심으로 따뜻하고 정돈된 옛 한식당의 신뢰를 만든다.

**Key Characteristics:**
- 황토와 볏짚에서 온 따뜻한 배경색
- 고추장 레드는 대표 메뉴와 CTA에만 사용하는 단일 행동색
- 본문은 18px 중심, 어떤 본문/버튼/안내도 16px 아래 금지
- 매장과 음식 사진은 선명하게, 흐릿한 분위기 사진만으로 채우지 않기
- shadcn card/button을 쓰되 radius는 8px 이하로 절제
- 어르신도 바로 이해하는 쉬운 문장과 넉넉한 줄간격

## 2. Color Palette & Roles

### Primary
- **Gochujang Red** (`#9F2F1F`): 브랜드 핵심색. 대표 메뉴명, 예약 문의, 오시는 길 CTA에 사용한다.
- **Deep Gochujang** (`#6F1F17`): 어두운 강조 밴드, 푸터, 깊은 국물감 표현에 사용한다.
- **Hot Broth Red** (`#B83A24`): hover, 작은 강조, 맵기 표시 보조색으로만 사용한다.

### Warm Surface
- **Ocher** (`#F4E4C8`): 페이지 기본 배경. 황토 벽과 따뜻한 매장 분위기를 만든다.
- **Rice** (`#FFF8EA`): 카드, 메뉴 표면, 읽기 영역의 기본 표면색.
- **Hanji** (`#F7EEDC`): 교차 섹션 배경. 오래 읽어도 눈이 편해야 한다.
- **Straw** (`#D8B86A`): 볏짚 포인트, 단계 번호, 얇은 배경 장식에 사용한다.

### Ink & Support
- **Iron** (`#2A2520`): 제목과 주요 텍스트. 순검정보다 따뜻한 먹색으로 쓴다.
- **Body Brown** (`#3A3028`): 본문 기본 텍스트.
- **Muted Brown** (`#6F6258`): 보조 설명. 대비가 낮아지지 않도록 16px 이상에서만 사용한다.
- **Wood** (`#6D4B32`): 테두리, 작은 라벨, 목재 느낌의 보조 강조.
- **Green Onion** (`#496B3A`): 신선한 재료, 채소, 안내성 배지에 사용한다.
- **Brass** (`#B8873A`): 놋그릇 느낌의 프리미엄 포인트. 남용 금지.
- **Hairline** (`#D9C3A3`): 카드 경계와 구분선.

## 3. Typography Rules

### Font Family
- **Display**: Pretendard Bold 또는 시스템 sans-serif 700. 제목과 대표 문구에 사용한다.
- **Body**: Pretendard 또는 시스템 sans-serif 400-500. 모든 설명과 정보에 사용한다.
- **Accent**: 시스템 serif는 큰 인용문이나 짧은 감성 문구에만 제한적으로 사용한다.

### Hierarchy

| Role | Size | Weight | Line Height | Use |
|---|---:|---:|---:|---|
| Hero | 42px | 700 | 1.25 | 첫 화면 대표 문구 |
| Section | 34px | 700 | 1.35 | 주요 섹션 제목 |
| Title | 24px | 700 | 1.45 | 메뉴명, 카드 제목 |
| Lead | 20px | 600 | 1.55 | 히어로 설명, 핵심 소개 |
| Body | 18px | 400 | 1.65 | 본문 기본 |
| Caption | 16px | 500 | 1.50 | 가장 작은 안내, 배지, 메타 정보 |

### Principles
- 본문 글씨는 절대 16px 아래로 내리지 않는다.
- 메뉴 설명, 영업시간, 주소, 전화번호는 18px 이상을 권장한다.
- 자간은 0으로 둔다. 음수 자간은 한글 가독성을 해치므로 금지한다.
- 흐린 회색의 작은 안내문은 금지한다. 어르신이 읽는 것을 기준으로 대비를 잡는다.
- 문장은 짧게 쓴다: "샤브처럼 즐기는 매운 등갈비찜", "예약 문의", "오시는 길".

## 4. Component Stylings

### Buttons

**Primary CTA**
- Background: `#9F2F1F`
- Text: `#FFF8EA`
- Radius: 8px
- Height: 52px minimum
- Padding: 14px 22px
- Font: 18px / 700
- Use: 예약 문의, 전화하기, 오시는 길

**Secondary CTA**
- Background: `#FFF8EA`
- Text: `#2A2520`
- Border: 1px solid `#6D4B32`
- Radius: 8px
- Height: 52px minimum
- Font: 18px / 700
- Use: 메뉴 보기, 먹는 방법 보기

**Quiet Text Link**
- Text: `#6F1F17`
- Underline: visible on hover/focus
- Font: 18px / 600
- Use: 지도 앱 열기, 자세히 보기

### Cards & Containers

**Menu Card**
- Background: `#FFF8EA`
- Border: 1px solid `#D9C3A3`
- Radius: 8px
- Padding: 24px
- Shadow: `0 12px 28px rgba(42,37,32,0.08)` only when separation is needed
- Use: 대표 메뉴, 사리, 마무리 메뉴

**Step Card**
- Background: `#F7EEDC`
- Radius: 8px
- Padding: 20px
- Number color: `#9F2F1F`
- Use: 끓인다, 담근다, 익힌다, 나누어 먹는다

**Info Band**
- Background: `#2A2520`
- Text: `#FFF8EA`
- Accent: `#D8B86A`
- Use: 예약/방문 정보, 영업시간, 주소 요약

### Badges

**Spicy Badge**
- Background: `#F4E4C8`
- Text: `#9F2F1F`
- Border: 1px solid `#D9C3A3`
- Radius: 9999px
- Font: 16px / 700

**Fresh Badge**
- Background: `#EEF5E7`
- Text: `#496B3A`
- Radius: 9999px
- Font: 16px / 700

## 5. Layout Principles

### Page Flow
1. Hero: 가게 이름, 한 줄 소개, 음식 이미지, 예약/길찾기 CTA
2. Signature: "등갈비찜을 샤브처럼?" 차별점 설명
3. Eating Steps: 끓이고, 담그고, 익히고, 나누어 먹는 방식
4. Menu: 매운 등갈비찜, 사리, 마무리 메뉴
5. Atmosphere: 볏짚과 황토 느낌의 따뜻하고 정갈한 매장 소개
6. Visit Info: 주소, 영업시간, 전화, 주차, 지도

### Grid & Container
- 모바일은 단일 컬럼을 기본으로 한다.
- 데스크톱은 최대 1120px 컨테이너 안에서 2-3컬럼 카드 그리드를 사용한다.
- 첫 화면은 음식 이미지가 작게 밀리지 않도록 텍스트와 이미지의 균형을 크게 잡는다.
- 방문 정보는 페이지 하단뿐 아니라 상단 CTA에서도 접근 가능해야 한다.

### Whitespace
- 섹션 간격은 72px 이상으로 넉넉하게 둔다.
- 카드 내부 여백은 20-24px 이상을 유지한다.
- 정보가 많아져도 줄간격과 여백을 줄여 해결하지 않는다.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | `box-shadow: none` | 넓은 배경, 정보 밴드 |
| Hairline | `1px solid #D9C3A3` | 카드, 메뉴 구분, 표 |
| Soft Lift | `0 12px 28px rgba(42,37,32,0.08)` | 대표 메뉴 카드 |
| Dark Band | `#2A2520` fill | 방문 정보, 푸터 |

Depth는 그림자보다 재료감과 색면으로 만든다. 황토 배경 위에 쌀빛 카드, 무쇠 차콜 밴드, 고추장 레드 CTA를 얹어 한식당의 층위를 만든다.

## 7. Do's and Don'ts

### Do
- 실제 음식과 실제 매장 질감을 우선한다.
- 고추장 레드는 CTA와 대표 메뉴에 집중해서 사용한다.
- 본문, 버튼, 안내 텍스트는 16px 아래로 내리지 않는다.
- "샤브형 등갈비찜"은 단계형 설명으로 쉽게 풀어쓴다.
- 어르신이 읽기 편한 대비, 크기, 줄간격을 유지한다.
- 따뜻한 황토/볏짚/쌀빛 배경을 중심으로 정갈한 인상을 만든다.

### Don't
- 매운맛을 불꽃, 경고색, 과한 빨강으로만 표현하지 않는다.
- 카드 안에 카드를 중첩하지 않는다.
- 둥근 radius를 과하게 키우지 않는다. 기본 8px 이하를 지킨다.
- 음식 사진을 어둡고 흐릿하게 처리하지 않는다.
- 작은 회색 글씨로 중요한 정보를 숨기지 않는다.
- 메뉴와 가격을 장식 문구보다 읽기 어렵게 만들지 않는다.

## 8. Responsive Behavior

| Breakpoint | Width | Key Changes |
|---|---:|---|
| Mobile | <640px | 단일 컬럼, CTA는 화면 폭에 맞게 크게, 본문 18px 유지 |
| Tablet | 640-1024px | 2열 카드, 이미지와 설명을 번갈아 배치 |
| Desktop | 1024px+ | 1120px 컨테이너, 대표 메뉴 3열, 방문 정보 2열 |

Touch targets are at least 48px high. Primary actions should be 52px high. Sticky or repeated CTA may be used on mobile, but it must not cover menu text or map information.

Images crop from the center and keep the food recognizable. Do not use extreme dark overlays. If text sits on an image, add a warm translucent overlay and keep contrast high.

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary action: Gochujang Red (`#9F2F1F`)
- Deep action/footer: Deep Gochujang (`#6F1F17`)
- Main background: Ocher (`#F4E4C8`)
- Card surface: Rice (`#FFF8EA`)
- Alternating surface: Hanji (`#F7EEDC`)
- Text: Iron (`#2A2520`) and Body Brown (`#3A3028`)
- Border: Hairline (`#D9C3A3`)
- Fresh accent: Green Onion (`#496B3A`)
- Warm accent: Brass (`#B8873A`)

### Example Component Prompts
- "Create a warm restaurant hero for 어믜뜰 등갈비찜 청주봉명동본점. Use an ocher #F4E4C8 background, iron #2A2520 headline, 42px bold type, 18px readable body, and a #9F2F1F primary CTA. Show a clear food image of steaming spicy rib shabu."
- "Design menu cards on #FFF8EA with 1px #D9C3A3 border, 8px radius, 24px padding, no nested cards. Title 24px bold, body 18px, caption no smaller than 16px."
- "Build a four-step eating guide: 끓인다, 담근다, 익힌다, 나누어 먹는다. Use #F7EEDC cards, red step numbers, 18px body text, and lucide icons."
- "Create a dark visit-info band using #2A2520 background and #FFF8EA text. Include phone, address, hours, and map CTA with 52px-tall buttons."

### Iteration Guide
1. First check readability: no text below 16px, body ideally 18px.
2. Spend red only on action and signature menu emphasis.
3. Keep the page warm, not beige-only: include iron, green, brass, and red accents.
4. Prefer real food and interior photos over abstract decoration.
5. Explain unfamiliar shabu-style rib jjim with steps, not long paragraphs.
6. Confirm mobile CTA, phone, and directions are easy to tap.

---

## Included Components

- Button
- Card
- Badge
- Tabs
- Dialog
- Table
- Input

---

## Iconography & SVG Guidelines

Use **lucide-react** as the single icon library. Do not mix icon sets.

- Icons must be inline SVG components, not image files.
- Icon color inherits from `currentColor`.
- Button icons: 18-20px.
- Standalone info icons: 24px.
- Feature icons: 32px.
- Use icons for phone, map pin, clock, flame/spicy level, bowl/pot, and parking.
- Do not use emojis in UI labels, cards, headings, or documentation.

---

## Document Policies

This document follows the Google Stitch style DESIGN.md structure:
1. Visual Theme & Atmosphere
2. Color Palette & Roles
3. Typography Rules
4. Component Stylings
5. Layout Principles
6. Depth & Elevation
7. Do's and Don'ts
8. Responsive Behavior
9. Agent Prompt Guide

Every future UI change should respect the restaurant identity: 어머니의 마음, 볏짚과 황토, 따뜻하고 정갈한 옛 한식당, and readable typography for older guests.
