import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { authMiddleware } from './authMiddleware.js'
import {
  cloudConfigured,
  createCloudSession,
  getCloudSession,
} from './browserUseCloud.js'
import { planFoodAssist } from './foodAssist.js'
import { mealPlanFromProfile } from './mealPlan.js'
import { planFromPatientMessage } from './planFromPatientMessage.js'
import { normalizeProfile } from './profileSchema.js'
import { createSession, deleteSession } from './sessionStore.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'carepilot-backend' })
})

app.post('/api/auth/login', (req, res) => {
  const username = req.body?.username
  const email = req.body?.email
  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'body.username (non-empty string) required' })
    return
  }
  if (typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'body.email (non-empty string) required' })
    return
  }
  const token = createSession(username, email)
  res.json({
    token,
    user: { username: username.trim(), email: String(email).trim() },
    hasProfile: false,
  })
})

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  deleteSession(req.careToken)
  res.json({ ok: true })
})

app.get('/api/profile', authMiddleware, (req, res) => {
  const s = req.careSession
  res.json({
    user: { username: s.username, email: s.email },
    profile: s.profile,
    profileComplete: Boolean(
      s.profile &&
        (s.profile.heightCm != null || s.profile.weightKg != null || s.profile.bmi != null),
    ),
  })
})

app.put('/api/profile', authMiddleware, (req, res) => {
  const profile = normalizeProfile(req.body ?? {})
  req.careSession.profile = profile
  res.json({ profile })
})

/** Food + wellness chat (uses saved profile when present). */
app.post('/api/chat/assist', authMiddleware, (req, res) => {
  const message = req.body?.message
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'body.message (non-empty string) required' })
    return
  }
  const plan = planFoodAssist(message, req.careSession.profile)
  res.json(plan)
})

/** Personalized demo meal plan from Basics. */
app.get('/api/plan/meals', authMiddleware, (req, res) => {
  res.json(mealPlanFromProfile(req.careSession.profile))
})

/** Whether Browser Use Cloud API key is set (never expose the key to the client). */
app.get('/api/journey/cloud-status', (_req, res) => {
  res.json({ configured: cloudConfigured() })
})

/**
 * Start a task on Browser Use Cloud (https://cloud.browser-use.com/).
 * Body: { task: string, model?: string } — see API v3 Create Session.
 */
app.post('/api/journey/cloud-task', async (req, res) => {
  const task = req.body?.task
  if (typeof task !== 'string' || !task.trim()) {
    res.status(400).json({ error: 'body.task (non-empty string) required' })
    return
  }
  try {
    const session = await createCloudSession(task.trim(), {
      model: typeof req.body?.model === 'string' ? req.body.model : undefined,
    })
    res.json(session)
  } catch (e) {
    const status = e.statusCode && e.statusCode >= 400 && e.statusCode < 600 ? e.statusCode : 500
    res.status(status).json({ error: e.message ?? 'Cloud request failed' })
  }
})

app.get('/api/journey/cloud-task/:sessionId', async (req, res) => {
  try {
    const session = await getCloudSession(req.params.sessionId)
    res.json(session)
  } catch (e) {
    const status = e.statusCode && e.statusCode >= 400 && e.statusCode < 600 ? e.statusCode : 500
    res.status(status).json({ error: e.message ?? 'Cloud request failed' })
  }
})

/**
 * Patient chat + structured Browser Use–style payload (mock planner).
 * Optional: after planning, call POST /api/journey/cloud-task with a concrete task string
 * to run the agent on Browser Use Cloud (hosted browsers + liveUrl).
 */
app.post('/api/journey/assist', (req, res) => {
  const message = req.body?.message
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'body.message (non-empty string) required' })
    return
  }
  const plan = planFromPatientMessage(message)
  res.json(plan)
})

app.listen(PORT, () => {
  console.log(`CarePilot API listening on http://localhost:${PORT}`)
})
