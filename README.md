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
5. Run the Development Server
Bash

pnpm dev
Open http://localhost:3000 to view the app.

🔄 Data Flow & Architecture
0Algo uses a modern Next.js Server Action pattern for data mutation:

Read: When the dashboard loads, it fetches static question data + user progress + chat history via parallel API requests.

Write: When a user checks a box, an Optimistic Update flips the UI instantly.

Sync: A Server Action (toggleQuestionProgress) runs asynchronously to INSERT or DELETE the record in Supabase.

AI Context: The Chatbot utilizes the userChats table to store conversation history (JSONB), allowing users to revisit previous discussions.

🤝 Contributing
Contributions are welcome!

Fork the project.

Create your feature branch:

Bash

git checkout -b feature/AmazingFeature
Commit your changes:

Bash

git commit -m 'Add some AmazingFeature'
Push to your branch:

Bash

git push origin feature/AmazingFeature
Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information.

<p align="center"> <a href="https://github.com/MrAsacker"> <img src="https://img.shields.io/badge/Built%20with%20❤️%20by-MrAsacker-blue?style=for-the-badge" alt="Built with Love"> </a> </p>
