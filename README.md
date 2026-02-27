# TGIF Food Cost Calculator

TGIF Food Cost Calculator is a modern Next.js application designed to seamlessly streamline and automate the weekly Friday food ordering and cost calculation process.

## Features

- **File Uploads:** Supports parsing both `.csv` and `.xlsx` files natively.
- **Smart Cost Allocation:** Reads individual item prices from food orders, applies a configurable overall company discount amount, and automatically determines the employee portion ("Extra Cost") versus the company portion ("Nubiaville Cost").
- **Responsive UI:** Features dark/light mode toggling, beautiful glassmorphism tables, sorting, filtering, and smooth animations.
- **Data Persistence:** Utilizes Prisma to keep track of all historical uploads and individual orders.

## Getting Started

First, install the necessary dependencies:

```bash
npm install
```

If using a local SQLite database, be sure to run Prisma migrations:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Technologies Used

- **Framework:** Next.js 15 (App Router)
- **UI & Styling:** Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide Icons
- **Database ORM:** Prisma
- **Data Parsing:** PapaParse (for CSV), xlsx (for Excel)
