import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import pgSession from 'connect-pg-simple';
import { config } from './config.js';
import { connectDB, pool } from './db.js';
import apiRoutes from './routes/api.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { initSocket } from './socket.js';

const app = express();
const server = http.createServer(app);
const PgSessionStore = pgSession(session);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const corsOptions = {
  origin: config.frontendUrl,
  credentials: true
};

app.use(cors(corsOptions));
initSocket(server, corsOptions);

app.use(
  session({
    name: 'repo_creator_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgSessionStore({
      pool,
      tableName: 'session'
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

connectDB().then(() => {
  if (!process.env.VERCEL) {
    server.listen(config.port, () => {
      console.log(`Backend running on http://localhost:${config.port}`);
    });
  }
});

export default app;
