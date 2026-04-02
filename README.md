# ⛳ Golf Charity Platform

A full-stack web application that allows users to participate in charity-based golf draws, subscribe to plans, and win prizes — while contributing a portion to charity.

---

## 🚀 Features

### 👤 User Features
- User authentication (Signup/Login)
- Subscription-based participation
- View past and current draws
- Upload proof for winning claims
- Track winnings and payout status

### 🛠️ Admin Features
- Manage users and roles (admin/user)
- Create and manage draw simulations
- Verify winner submissions
- Approve payouts
- Dashboard with platform statistics

---

## 🏗️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS (or custom styling)
- React Router

### Backend (BaaS)
- Supabase
  - Authentication
  - PostgreSQL Database
  - Row Level Security (RLS)

---

## 📊 Database Design

- **profiles** → User data & roles  
- **subscriptions** → User subscription plans  
- **draws** → Monthly draw results  
- **winners** → Winner details, proof, payout status  

---

## 🔐 Security

- Supabase Authentication for user management  
- Role-based access control (admin vs user)  
- Row Level Security (RLS) policies for data protection  

---

## ⚙️ Environment Variables

Create a `.env` file in your frontend:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

Installation & Setup
# Clone the repository
git clone https://github.com/musayyabb46/golf-charity-platform.git

# Navigate into project
cd golf-charity-platform

# Install dependencies
npm install

# Run development server
npm run dev

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
