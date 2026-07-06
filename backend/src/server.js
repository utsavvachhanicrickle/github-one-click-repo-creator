import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import { config } from './config.js';
import { connectDB } from './db.js';
import apiRoutes from './routes/api.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true
  })
);

app.use(
  session({
    name: 'repo_creator_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/github-repo-creator',
      collectionName: 'sessions',
      touchAfter: 3600
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
  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
});
