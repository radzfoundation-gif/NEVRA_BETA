import express from 'express';
import {
  addProjectNote,
  createChatSession,
  createDocument,
  createProject,
  createUserSkill,
  deleteChatSession,
  deleteUserSkill,
  ensureCatalogSeeded,
  getChatMessages,
  getChatSession,
  getCreditUsage,
  getProjectDetail,
  incrementCreditUsage,
  listChatSessions,
  listDocuments,
  listUserSkills,
  listWorkspace,
  saveChatMessage,
  saveOutput,
  shareChatSession,
  updateChatSession,
  updateUserSkill,
} from './firestore.js';

export const firestoreRouter = express.Router();

let seededOnce = false;
const ensureReady = async () => {
  if (seededOnce) return;
  try {
    await ensureCatalogSeeded();
    seededOnce = true;
  } catch (err) {
    // Don't block requests on seeding — log and continue.
    console.warn('[firestoreRoutes] catalog seed deferred:', err?.message || err);
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
    console.error('[firestoreRoutes] error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Firestore request failed' });
  }
};

firestoreRouter.get('/health', asyncRoute(async (_req, res) => {
  res.json({ ok: true, provider: 'firestore' });
}));

firestoreRouter.get('/credits', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await getCreditUsage(userId));
}));

firestoreRouter.post('/credits/increment', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await incrementCreditUsage(userId, Number(req.body.amount || 1)));
}));

firestoreRouter.get('/workspace', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await listWorkspace(userId));
}));

firestoreRouter.post('/projects', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createProject(userId, req.body.name, req.body.description));
}));

firestoreRouter.get('/projects/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await getProjectDetail(userId, req.params.id));
}));

firestoreRouter.post('/projects/:id/notes', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await addProjectNote(userId, req.params.id, req.body.content || ''));
}));

firestoreRouter.post('/outputs', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await saveOutput(userId, req.body));
}));

firestoreRouter.get('/sessions', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json({ sessions: await listChatSessions(userId) });
}));

firestoreRouter.post('/sessions', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createChatSession(userId, req.body));
}));

firestoreRouter.get('/sessions/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const session = await getChatSession(userId, req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
}));

firestoreRouter.patch('/sessions/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const session = await updateChatSession(userId, req.params.id, req.body);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
}));

firestoreRouter.delete('/sessions/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await deleteChatSession(userId, req.params.id));
}));

firestoreRouter.get('/sessions/:id/messages', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json({ messages: await getChatMessages(userId, req.params.id) });
}));

firestoreRouter.post('/sessions/:id/messages', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const message = await saveChatMessage(userId, req.params.id, req.body);
  if (!message) return res.status(404).json({ error: 'Session not found' });
  res.json(message);
}));

firestoreRouter.post('/sessions/:id/share', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const shareId = await shareChatSession(userId, req.params.id);
  res.json({ shareId });
}));

firestoreRouter.get('/documents', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json({ documents: await listDocuments(userId) });
}));

firestoreRouter.post('/documents', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createDocument(userId, req.body));
}));

firestoreRouter.get('/skills', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json({ skills: await listUserSkills(userId) });
}));

firestoreRouter.post('/skills', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await createUserSkill(userId, req.body));
}));

firestoreRouter.patch('/skills/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const skill = await updateUserSkill(userId, req.params.id, req.body);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json(skill);
}));

firestoreRouter.delete('/skills/:id', asyncRoute(async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  res.json(await deleteUserSkill(userId, req.params.id));
}));
