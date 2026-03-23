# Artlog — Game Artist Task Manager

Task management tool for game artists — track art tasks, deadlines, and team feedback in one place.

**Live:** [https://hnanahanh.github.io/artlog/](https://hnanahanh.github.io/artlog/)

## Features

### Kanban Board
- Drag-and-drop task cards between status columns (Todo, In Progress, Done)
- Click card to edit — no inline buttons cluttering the UI
- Color-coded cards by status (yellow/lime/green kanban palette)

### Calendar View
- Monthly calendar grid with multi-day task bars
- Task bars color-coded by status
- Drag & resize tasks to reschedule (touch support on mobile)
- Today highlighted with red circle marker
- Hide weekend columns on mobile for compact view

### Table View
- Sortable, filterable task list with inline editing
- Inline NeoRangePicker for date selection
- Color-coded rows by task status
- Bulk selection and delete

### KPI Dashboard
- Task completion analytics with interactive recharts pie charts
- Stat cards: total tasks, overdue rate, estimated days
- Export to Excel
- Responsive layout: stats row + charts row

### Quick Task Input
- Spreadsheet-style input table (keyboard navigation: ↑↓←→, Enter, Delete)
- Auto-parse project/type from dropdown
- Persistent draft (saved to localStorage)
- Bottom drawer on mobile

### Overdue Notification
- Skull icon notification popup at bottom-right
- Click to navigate to calendar showing overdue tasks
- Slide-in/out toggle with skull tab

### Settings
- Working days configuration (auto deadline calculation)
- Feedback keyword matching with similarity threshold
- Task sorting rules
- Language & theme toggles (inside Settings modal)

### Multi-language
- Vietnamese and English interface
- i18n keys for all UI text including footer marquee

### Design
- Neo-brutalism theme inspired by [neobrutalism.dev](https://www.neobrutalism.dev/)
- Color palette inspired by [eigenpal.com](https://www.eigenpal.com/)
- JetBrains Mono typography
- Bold borders, hard shadows, flat colors
- Dark / light mode
- Fully responsive mobile layout (sticky header, fixed footer)
- Colorful footer marquee with credits

## Tech Stack
- **Frontend:** React 19 + Vite + Ant Design v5
- **Charts:** Recharts
- **Calendar:** react-day-picker
- **Storage:** localStorage (no backend required)
- **Hosting:** GitHub Pages (free, auto-deploy via GitHub Actions)
- **Data:** Sample data auto-seeded on first visit

## Development

```bash
cd client
npm install
npm run dev
```

## Deploy

Push to `main` branch → GitHub Actions auto-builds and deploys to GitHub Pages.
