import express from 'express';
import {
  addProjectNote,
  createDocument,
  createProject,
  getCreditUsage,
  getProjectDetail,
  incrementCreditUsage,
  initTursoSchema,
  listDocuments,
  listWorkspace,
  saveOutput,
} from './turso.js';

export const tursoRouter = express.Router();

let schemaReady = false;
const ensureReady = async () => {
  if (!schemaReady) {
    await initTursoSchema();
    schemaReady = true;
  }
};

const userIdFromReq = (req) => req.query.userId || req.body?.userId || req.headers['x-user-id'];
const requireUser = (req, res) => {
  const userId = userIdFromReq(req);
  if (!userId || typeof userId !== 'string') {
    res.status(401).json({ error: 'Missing userId' });
    return null;
  }
  return userId;
};

const asyncRoute = (handler) => async (req, res) => {
  try {
    await ensureReady();
    await handler(req, res);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Turso request failed' });
  }
};

tursoRouter.get('/health', asyncRoute(async (_req, res) => {
  res.json({ ok: true, provider: 'turso' });
}));

tursoRouter.get('/credits', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await getCreditUsage(userId));
}));

tursoRouter.post('/credits/increment', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await incrementCreditUsage(userId, Number(req.body.amount || 1)));
}));

tursoRouter.get('/workspace', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await listWorkspace(userId));
}));

tursoRouter.post('/projects', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createProject(userId, req.body.name, req.body.description));
}));

tursoRouter.get('/projects/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await getProjectDetail(userId, req.params.id));
}));

tursoRouter.post('/projects/:id/notes', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await addProjectNote(userId, req.params.id, req.body.content || ''));
}));

tursoRouter.post('/outputs', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await saveOutput(userId, req.body));
}));

tursoRouter.get('/documents', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json({ documents: await listDocuments(userId) });
}));

tursoRouter.post('/documents', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createDocument(userId, req.body));
}));
