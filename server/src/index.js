import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task-routes.js';
import kpiRoutes from './routes/kpi-routes.js';
import settingsRoutes from './routes/settings-routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Task Manager server running on http://localhost:${PORT}`);
});
