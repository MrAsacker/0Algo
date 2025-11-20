
## 🌟 Project Overview

This is a comprehensive Data Structures and Algorithms (DSA) interview question tracker designed for software engineers preparing for technical interviews. It aggregates popular questions, tracks user progress persistently, and provides quick links to solutions.

### Key Features

  * **Persistent Progress Tracking:** Tracks solved/unsolved status for each question per user, saved securely in the database.
  * **Powerful Filtering:** Filter questions by Difficulty (Easy, Medium, Hard), Company, Topic, and Recency (Timeframe).
  * **Dynamic Statistics:** Live progress bars and stats for total solved, Easy, Medium, and Hard categories.
  * **Video Solution Links:** Provides integrated links to external video solutions (YouTube/other sources).

## ⚙️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js** (App Router), **React**, **TypeScript** | Full-stack framework for rendering and routing. |
| **Styling** | **Tailwind CSS**, **Shadcn/UI** | Utility-first CSS framework and accessible UI components. |
| **Authentication** | **Clerk** | Secure, drop-in solution for user sign-up and sign-in. |
| **Database** | **Supabase** (PostgreSQL) | Primary database and backend-as-a-Service. |
| **ORM** | **Drizzle ORM** | TypeScript ORM for interacting with the Supabase database. |
| **API** | **Next.js Route Handlers** | Secure endpoints for fetching questions and updating user progress. |
| **AI (Optional)** | **OpenAI / Gemini** | Used for generating explanations or summary content (if implemented). |

-----

## 🚀 Getting Started (Local Setup)

Follow these steps to get a development environment running locally.

### 1\. Clone the Repository

```bash
git clone YOUR_GITHUB_REPO_URL
cd leetcode-interview-dashboard
```

### 2\. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3\. Setup Environment Variables

You must create a local file named `.env.local` and populate it with your keys.

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** | `pk_test_...` | Clerk's public key (Client-side). |
| **`CLERK_SECRET_KEY`** | `sk_test_...` | Clerk's secret key (Server-side). |
| **`DATABASE_URL`** | `postgresql://postgres....` | **Supabase Pooler URL** for Drizzle ORM. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-id].supabase.co` | Supabase Project URL. |
| `openai_api_key` | `sk-proj-...` | AI API key for backend functions. |

### 4\. Database Setup (Drizzle Migrations)

Run your database migrations to ensure your Supabase schema matches the Drizzle schema (`schema.ts`).

```bash
# Example command (adjust based on your Drizzle setup)
npx drizzle-kit push:pg
```

### 5\. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

-----

## 🌍 Deployment

This application is optimized for **Vercel** deployment, which offers seamless integration with Next.js, Clerk, and Supabase.

1.  Push your code to the `main` branch on GitHub.
2.  Import the project into Vercel.
3.  Set the environment variables (listed above) in the Vercel project settings, ensuring **Runtime** is selected for all secret keys (`CLERK_SECRET_KEY`, `DATABASE_URL`, etc.).

-----

## 👨‍💻 Contributing

We welcome contributions\! If you find a bug, have a feature request, or want to submit a pull request:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/new-feature`).
3.  Commit your changes (`git commit -m 'feat: added a new filter option'`).
4.  Push to the branch (`git push origin feature/new-feature`).
5.  Open a Pull Request.

-----

## 📜 License

