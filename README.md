# Duka System - Phase 2

A modern, full-featured small-business POS (Point of Sale) & inventory management system built with React, Vite, and Tailwind CSS, with Supabase integration foundation.

## 🚀 Key Features

- **Dashboard & Analytics**: Real-time sales metrics, revenue overview, profit margin tracking, and low-stock alerts.
- **POS / Sales Workflow**: Rapid checkout flow, item quantity management, discount handling, and receipt generation.
- **Product & Inventory Management**: Categorized product catalog, stock level monitoring, and reorder triggers.
- **Expense Tracking**: Categorized expense management to accurately monitor operational costs and net profits.
- **Reports & Insights**: Comprehensive business reports, sales trends, and profit/loss summaries.
- **Role-Based Views**: Tailored interfaces for business owners and sales cashiers/staff.
- **Customizable Themes**: Flexible UI theming support.
- **Supabase Foundation**: Prepared database schema and client configuration for cloud synchronization, authentication, and RLS.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend / Database**: Supabase (PostgreSQL, Row-Level Security)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Setup

1. Navigate to the frontend directory:
   ```bash
   cd duka-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at the local URL shown in your terminal (typically `http://localhost:5173`).

## 📁 Project Structure

```
Duka-system-phase2/
├── duka-app/
│   ├── public/              # Static assets and icons
│   ├── src/
│   │   ├── components/      # UI components (ThemeModal, etc.)
│   │   ├── lib/             # Utilities, theme config, and Supabase client
│   │   ├── App.jsx          # Main application core
│   │   ├── main.jsx         # App entrypoint
│   │   └── index.css        # Global Tailwind CSS styles
│   ├── supabase/
│   │   └── schema.sql       # Database schema & RLS policies
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 📄 License

This project is licensed under the MIT License.
