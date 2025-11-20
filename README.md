# 🚀 0Algo - Master DSA & System Design

![0Algo DSA Dashboard](./assets/hm-dsa.png)

[![Built with TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-FF4785?style=flat&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)

---

**0Algo** is a high-performance, full-stack DSA tracker designed to help engineers **ace technical interviews**. Unlike generic trackers, 0Algo focuses on **company-specific questions** and features an **AI-powered Assistant** to guide users through complex algorithms and system design concepts.

[Live Demo →](https://0algo.com)

---

## ✨ Key Features

* **🤖 AI Study Assistant:** Context-aware chatbot for problem explanation, debugging, and system design queries.
* **🏢 Company-Centric Filtering:** Target specific companies (Google, Amazon, Meta) and filter questions by recency.
* **💾 Hybrid Persistence:** Syncs progress to Supabase via Drizzle ORM with Optimistic UI for instant feedback.
* **📊 Live Statistics:** Dashboard visualizing progress across Easy, Medium, and Hard difficulties.
* **🎥 Integrated Video Solutions:** One-click access to video explanations.
* **🛠 System Design Hub:** Dedicated section for curated system design resources and roadmaps.

---

## 📸 Feature Preview

| **System Design Hub** | **AI Chatbot** | **Video Solutions** |
|:---:|:---:|:---:|
| ![System Design](./assets/hm-sys.png) | ![Chatbot](./assets/sys-design-ss.png) | ![Video](./assets/vid-sol.png) |
| *Curated roadmaps & resources* | *Context-aware explanations* | *Integrated video player* |

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn/UI |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Drizzle ORM |
| **AI Integration** | OpenAI API / Vercel AI SDK |
| **Auth** | Clerk |
| **State Mgmt** | React Hooks + Optimistic Updates |
| **Deployment** | Vercel |

---

## 📂 Project Structure

```bash
├── app/
│   ├── actions.ts           # Server Actions (DB writes)
│   ├── api/                 # Route Handlers
│   │   ├── chat/            # AI Chatbot Endpoint
│   │   └── user-progress/   # User Progress Sync
│   ├── dashboard/           # Protected Dashboard Client Page
│   └── system-design/       # System Design resources
├── components/
│   ├── Chatbot.tsx          # AI Chat Interface
│   ├── LeetCodeDashboard.tsx # Main Question Table
│   └── VideoDialog.tsx      # Video Solution Modal
├── lib/
│   ├── db.ts                # Drizzle Client Connection
│   └── schema.ts            # Database Schema (Questions, Progress, Chats)
└── public/                  # Static assets (images, icons)
```

## 🚀 Getting Started
Follow these steps to run 0Algo locally.

1. Clone the Repository
```
 git clone https://github.com/MrAsacker/0Algo.git
 cd 0Algo
```
## 2. Install Dependencies
We recommend using ``` pnpm```.
```
pnpm install
# or
npm install
```
## 3. Environment Setup
Create a .env.local file in the root directory and add the following keys:

```
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Supabase + Drizzle)
# Note: Use the Transaction Pooler URL (port 6543)
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres

# AI Chatbot
OPENAI_API_KEY=sk-proj-...
```

## 4. Database Migration
Push the Drizzle schema to your Supabase instance:

```
npx drizzle-kit push
```
## 5. Run the Development Server

```
pnpm dev
Here is the full, raw Markdown code for your README.md.

I have ensured that sections like "Getting Started" use proper headings (###) and code blocks (```bash) so they render beautifully on GitHub.

Copy the code block below exactly and paste it into your README.md file.

Markdown

# 🚀 0Algo - Master DSA & System Design

![0Algo DSA Dashboard](./assets/hm-dsa.png)

**0Algo** is a high-performance, full-stack DSA tracker designed to help engineers ace technical interviews. Unlike generic trackers, 0Algo focuses on **Company-Specific Questions** and features an **AI-powered Assistant** to guide users through complex algorithms and system design concepts.

Live Demo: **[0algo.com](https://0algo.com)**

## ✨ Key Features

* **🤖 AI Study Assistant:** A built-in context-aware chatbot that helps explain problems, debug logic, and answer system design queries.
* **🏢 Company-Centric Filtering:** Target specific companies (Google, Amazon, Meta) and filter questions by how recently they were asked.
* **💾 Hybrid Persistence:** Syncs progress to Supabase via Drizzle ORM while using Optimistic UI for instant feedback.
* **📊 Live Statistics:** Real-time dashboard visualizing progress across Easy, Medium, and Hard difficulties.
* **🎥 Integrated Video Solutions:** One-click access to video explanations directly within the UI.
* **🛠 System Design Hub:** Dedicated section for system design resources and roadmaps.

## 📸 Feature Preview

| **System Design Hub** | **AI Chatbot** | **Video Solutions** |
|:---:|:---:|:---:|
| ![System Design](./assets/hm-sys.png) | ![Chatbot](./assets/sys-design-ss.png) | ![Video](./assets/vid-sol.png) |
| *Curated roadmaps & resources* | *Context-aware explanations* | *Integrated video player* |

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** |
| **Language** | **TypeScript** |
| **Styling** | **Tailwind CSS** + **Shadcn/UI** |
| **Database** | **Supabase** (PostgreSQL) |
| **ORM** | **Drizzle ORM** |
| **AI Integration** | **OpenAI API / Vercel AI SDK** |
| **Auth** | **Clerk** |
| **State Mgmt** | React Hooks + Optimistic Updates |
| **Deployment** | **Vercel** |

## 📂 Project Structure

A quick look at the core structure of the application:

```bash
├── app/
│   ├── actions.ts           # Server Actions (DB writes)
│   ├── api/                 # Route Handlers
│   │   ├── chat/            # AI Chatbot Endpoint
│   │   └── user-progress/   # User Progress Sync
│   ├── dashboard/           # Protected Dashboard Client Page
│   └── system-design/       # System Design resources
├── components/
│   ├── Chatbot.tsx          # AI Chat Interface
│   ├── LeetCodeDashboard.tsx # Main Question Table
│   └── VideoDialog.tsx      # Video Solution Modal
├── lib/
│   ├── db.ts                # Drizzle Client Connection
│   └── schema.ts            # Database Schema (Questions, Progress, Chats)
└── public/
🚀 Getting Started
Follow these steps to run 0Algo locally.

1. Clone the Repository
Bash

git clone https://github.com/MrAsacker/0Algo.git
cd 0Algo
2. Install Dependencies
We recommend using pnpm.

Bash

pnpm install
# or
npm install
3. Environment Setup
Create a .env.local file in the root directory and add the following keys:

Code snippet

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Supabase + Drizzle)
# Note: Use the Transaction Pooler URL (port 6543)
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-region.pooler.supabase.com:6543/postgres

# AI Chatbot
OPENAI_API_KEY=sk-proj-...
4. Database Migration
Push the Drizzle schema to your Supabase instance:

Bash

npx drizzle-kit push
5. Run the Development Server
Bash

pnpm dev
Open http://localhost:3000 to view the app.
```



