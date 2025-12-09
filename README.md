# Asset Insight

A modern web application built with Next.js and React.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library

### State Management & Data Fetching
- **React Query** (@tanstack/react-query) - Server state management
- **Jotai** - Atomic state management

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Getting Started

### Prerequisites
- Node.js 20+ or Go (for server)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utility functions
├── providers/       # Context providers (React Query)
└── store/           # Jotai atoms for state management
```
