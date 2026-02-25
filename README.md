# 🏨 StayMind AI – Smart Hotel Operating System

A full-stack SaaS hotel management platform with AI-powered features, built with **Next.js 14**, **Flutter**, **Supabase**, and **Google Gemini API**.

## 🌟 Features

### Web Admin Dashboard
- **Hotel Owner Portal** — KPI dashboard, room/booking/staff management, housekeeping, maintenance, reviews, marketing, reports, billing, settings
- **Super Admin Console** — Platform analytics, hotel management, user administration, AI usage monitoring, system configuration

### Flutter Mobile App
- **Guest App** — Hotel search, room booking, payment, AI chatbot concierge, notifications, reviews
- **Staff App** — Dashboard with arrivals/departures, housekeeping tasks, room status, maintenance, QR check-in/out

### AI-Powered Features
- Dynamic pricing engine with occupancy, seasonality, and demand factors
- 30-day occupancy forecast with historical pattern analysis
- AI chatbot concierge (Gemini-powered, hotel-context aware)
- Review sentiment analysis with auto-response suggestions
- Marketing content generator (social, email, ads, SMS)

### Booking Engine
- Real-time availability with overbooking prevention
- Stripe payment integration (checkout sessions + webhooks)
- Automated refund flow with time-based cancellation policies
- Promo code validation with usage tracking

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Web** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Recharts |
| **Mobile** | Flutter 3.16+, Riverpod, GoRouter, Material 3 |
| **Backend** | Supabase (Postgres, Auth, Edge Functions, Storage, Realtime) |
| **AI** | Google Gemini 2.0 Flash API |
| **Payments** | Stripe (Checkout, Webhooks, Subscriptions) |
| **Validation** | Zod (web), built-in (mobile) |

---

## 📂 Project Structure

```
StayMind-AI/
├── web/                      # Next.js 14 web application
│   └── src/
│       ├── app/              # App Router pages
│       │   ├── dashboard/    # Hotel owner pages (13 routes)
│       │   ├── admin/        # Super admin pages (4 routes)
│       │   ├── api/          # API routes
│       │   └── ...           # Auth pages
│       ├── components/       # Reusable UI components
│       └── lib/              # Utilities, services, validations
├── mobile/                   # Flutter mobile application
│   └── lib/
│       ├── core/             # Theme, router, constants
│       ├── features/
│       │   ├── auth/         # Login, register, forgot password
│       │   ├── guest/        # 10 guest screens
│       │   └── staff/        # 8 staff screens
│       └── services/         # Supabase service layer
├── supabase/
│   ├── schema.sql            # Database schema (24 tables, RLS)
│   ├── seed.sql              # Sample data
│   └── functions/            # Edge Functions (5 AI functions)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Flutter 3.16+ & Dart 3.2+
- Supabase account
- Stripe account
- Google AI Studio API key

### 1. Clone & Install

```bash
git clone https://github.com/your-org/StayMind-AI.git
cd StayMind-AI/web
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

In Supabase SQL Editor, run:
1. `supabase/schema.sql` — creates all tables, indexes, RLS policies
2. `supabase/seed.sql` — populates sample data

### 4. Deploy Edge Functions

```bash
supabase functions deploy dynamic-pricing
supabase functions deploy occupancy-forecast
supabase functions deploy chatbot
supabase functions deploy sentiment-analysis
supabase functions deploy marketing-generator
```

### 5. Run Development Server

```bash
cd web
npm run dev    # Opens http://localhost:3000
```

### 6. Flutter Mobile (optional)

```bash
cd mobile
flutter pub get
flutter run
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@staymind.ai | Admin123! |
| Hotel Owner | owner@grandhotel.com | Owner123! |
| Staff | staff@grandhotel.com | Staff123! |
| Guest | guest@example.com | Guest123! |

---

## 🔒 Security

- **Row Level Security (RLS)** on all tables for tenant isolation
- **JWT-based auth** with middleware route protection
- **Rate limiting** — 100 req/min API, 10 req/hr auth, 500 req/day AI
- **Input validation** — Zod schemas for all endpoints
- **XSS protection** — HTML sanitization on user inputs
- **Audit logging** — All admin actions tracked

---

## 📊 API Routes

| Route | Method | Description |
|---|---|---|
| `/api/bookings` | GET, POST | List/create bookings |
| `/api/bookings/availability` | POST | Check room availability |
| `/api/bookings/refund` | POST | Process refund |
| `/api/payments/checkout` | POST | Create Stripe session |
| `/api/webhooks/stripe` | POST | Stripe event handler |
| `/api/notifications` | GET, PATCH | List/mark-read notifications |
| `/api/audit-logs` | GET, POST | Audit trail (admin only) |

---

## 🤖 AI Edge Functions

| Function | Description |
|---|---|
| `dynamic-pricing` | Price optimization using occupancy, seasonality, demand |
| `occupancy-forecast` | 30-day prediction with historical analysis |
| `chatbot` | Context-aware guest concierge |
| `sentiment-analysis` | Review analysis with suggested responses |
| `marketing-generator` | Social, email, ad copy generation |

---

## 📱 Deployment

### Web (Vercel)
```bash
cd web
npm run build
# Deploy to Vercel via GitHub integration
```

### Mobile (Android/iOS)
```bash
cd mobile
flutter build apk --release    # Android
flutter build ios --release     # iOS
```

---

## 📄 License

MIT License © 2026 StayMind AI
