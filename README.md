# 🚀 0Algo - Master DSA, CP & System Design

![0Algo DSA Dashboard](./assets/hm-dsa.png)

[![Built with TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-FF4785?style=flat&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

---

**0Algo** is a high-performance, full-stack learning platform designed to help engineers **ace technical interviews and master competitive programming**. It features curated DSA questions, CP ladders, interactive roadmaps, and an **AI-powered Assistant** powered by Google Gemini.

[Live Demo →](https://0algo.com)

---

## ✨ Key Features

- **🤖 AI Study Assistant:** Context-aware chatbot powered by **Google Gemini** for problem explanation, debugging, and system design queries.
- **🏆 CP Ladder:** Curated ladders for Competitive Programming (C++ STL, Math, Codeforces A-grind) with progress tracking.
- **🛤️ Interactive Roadmaps:** Detailed learning paths for JavaScript, C++, Data Structures, and more.
- **🏢 Company-Centric Filtering:** Target specific companies (Google, Amazon, Meta) and filter DSA questions by recency.
- **💾 Persistent Progress:** All your progress is synced to **Supabase** via **Drizzle ORM**. Supports automatic migration from local storage.
- **📊 Visual Dashboard:** Track your stats across Easy, Medium, and Hard difficulties with a live activity heatmap.
- **🎥 Integrated Solutions:** One-click access to video explanations and curated notes.

---

## 🛠 Tech Stack

| Category           | Technology                        |
| :----------------- | :-------------------------------- |
| **Framework**      | Next.js 15 (App Router)           |
| **Language**       | TypeScript                        |
| **Styling**        | Tailwind CSS + Shadcn/UI          |
| **Database**       | Supabase (PostgreSQL)             |
| **ORM**            | Drizzle ORM                       |
| **AI Integration** | Google Gemini API (Generative AI) |
| **Auth**           | Clerk                             |
| **State Mgmt**     | React Hooks + Server Actions      |
| **Deployment**     | Vercel                            |

---

## 📂 Project Structure

```bash
├── actions/             # Server Actions (DB reads/writes)
├── app/                 # Next.js App Router
│   ├── api/             # Route Handlers
│   ├── cp-ladder/       # CP Ladder pages & logic
│   ├── roadmaps/        # Interactive roadmaps
│   ├── system-design/   # System Design hub
│   └── dashboard/       # User statistics & progress
├── components/          # Reusable UI components
├── lib/                 # Core utilities (DB client, Schema)
├── public/              # Static assets (images, icons)
└── scripts/             # Utility scripts (database maintenance)
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MrAsacker/0Algo.git
cd 0Algo
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add the following keys:

```bash
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Supabase + Drizzle)
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres

# AI Integration (Google Gemini)
GEMINI_API_KEY=AIzaSy...

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Database Migration

Push the Drizzle schema to your Supabase instance:

```bash
pnpm db:push
```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🌐 Deployment on Vercel

1. Push your code to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add the environment variables from your `.env.local` to the Vercel project settings.
4. Vercel will automatically detect the Next.js project and deploy it.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="center"> 
  <a href="https://github.com/MrAsacker"> 
    <img src="https://img.shields.io/badge/Built%20with%20❤️%20by-MrAsacker-blue?style=for-the-badge" alt="Built with Love"> 
  </a> 
</p>
