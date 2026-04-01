# Implementation Plan: Noir Philos Agentic System

## Overview

Implement the full Philos agentic system on the existing Noir stack: Supabase tables → backend services → Express API endpoints → SSE streaming → React frontend at `/philos`. Each task builds incrementally so the system is runnable and testable at every checkpoint.

## Tasks

- [ ] 1. Create Supabase database schema
  - Run the SQL migrations to create all seven Philos tables: `philos_runs`, `philos_tasks`, `philos_artifacts`, `philos_memory`, `philos_preferences`, `philos_integrations`, `philos_workflows`
  - Enable `pgvector` extension and add the `embedding vector(1536)` column on `philos_memory`
  - Create the `philos-artifacts` Storage bucket in Supabase
  - Write and apply Row-Level Security policies on all tables scoped to `auth.uid() = user_id`
  - Apply RLS policy on `philos_integrations` ensuring cross-user isolation (Property 16)
  - _Requirements: 6.1, 7.2_

- [ ] 2. Define shared TypeScript types and interfaces
  - [ ] 2.1 Create `server/philos/types.ts` with all shared types
    - Define `Run`, `Task`, `TaskGraph`, `AgentType`, `AgentContext`, `AgentResult`, `Artifact`, `ArtifactFormat`, `ArtifactRef`, `ToolCall`, `UserPreferences`, `RunOptions`, `WorkflowConfig`, `Workflow`, `IntegrationRecord`, `IntegrationProvider`, `PhilosEvent`, `RunSummary`, `MemoryEntry`, `ExecResult`
    - Define `TaskStatus` and `RunStatus` union types matching the DB enums
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 3. Implement MemoryStore service
  - [ ] 3.1 Create `server/philos/memoryStore.js`
    - Implement `saveRun(run)`, `getRelevantContext(userId, goal, limit)`, `savePreferences(userId, prefs)`, `getPreferences(userId)`, `deleteEntry(userId, entryId)`, `searchMemory(userId, query)` using the Supabase client already initialised in `server/index.js`
    - `getRelevantContext` performs a keyword/tag match on `philos_memory` (pgvector similarity if available, text search fallback)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Write property test for MemoryStore run persistence round-trip
    - **Property 13: Run persistence round-trip**
    - **Validates: Requirements 6.1**

  - [ ]* 3.3 Write property test for memory deletion completeness
    - **Property 14: Memory deletion is complete and timely**
    - **Validates: Requirements 6.4**

  - [ ]* 3.4 Write property test for preferences applied to new Runs
    - **Property 15: User preferences are applied to new Runs**
    - **Validates: Requirements 6.5**

- [ ] 4. Implement ModelRouter service
  - [ ] 4.1 Create `server/philos/modelRouter.js`
    - Implement `selectModel(task, userTier, runPreference)` with the priority list `['openai/gpt-5', 'anthropic/claude-opus-4', 'google/gemini-pro-2', 'sumopod/gemini-flash-lite']`
    - Free-tier always returns `sumopod/gemini-flash-lite`; pro-tier uses complexity classification; run-level preference overrides complexity for pro users
    - Implement `fallback(currentModel)` returning the next model in the priority list or `null`
    - Implement `classifyComplexity(taskDescription)` returning `'low' | 'high'`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test for model selection by tier and complexity
    - **Property 11: Model selection is determined by task complexity and user tier**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 4.3 Write property test for model fallback on error
    - **Property 12: Model fallback on error**
    - **Validates: Requirements 5.6**

  - [ ]* 4.4 Write unit tests for ModelRouter
    - Test each tier/complexity/preference combination
    - Test fallback chain exhaustion returns `null`
    - _Requirements: 5.1–5.6_

- [ ] 5. Implement SandboxManager service
  - [ ] 5.1 Create `server/philos/sandboxManager.js`
    - Implement `createWorkspace(runId)` creating `/tmp/philos/{runId}/`
    - Implement `executeCode(workdir, code, timeoutMs)` using `child_process.exec` with a 300 s default timeout; reject paths outside workdir
    - Implement `readFile(workdir, relativePath)` and `writeFile(workdir, relativePath, content)` with path traversal guards
    - Implement `cleanup(runId)` removing `/tmp/philos/{runId}/` recursively
    - Implement `isAllowedDomain(domain, allowlist)` supporting exact match and wildcard prefix
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Write property test for sandbox filesystem isolation
    - **Property 8: Sandbox filesystem isolation**
    - **Validates: Requirements 4.1**

  - [ ]* 5.3 Write property test for sandbox network allowlist enforcement
    - **Property 9: Sandbox network allowlist enforcement**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 5.4 Write property test for sandbox workspace cleanup
    - **Property 10: Sandbox workspace cleanup**
    - **Validates: Requirements 4.5**

  - [ ]* 5.5 Write unit tests for SandboxManager
    - Test path traversal attempts are blocked
    - Test timeout enforcement terminates the process
    - Test `isAllowedDomain` with exact, subdomain, and wildcard cases
    - _Requirements: 4.1–4.5_

- [ ] 6. Checkpoint — core services
  - Ensure MemoryStore, ModelRouter, and SandboxManager unit tests pass. Ask the user if questions arise.

- [ ] 7. Implement SubAgentRunner service
  - [ ] 7.1 Create `server/philos/subAgentRunner.js`
    - Implement `getAgentType(taskDescription)` classifying descriptions into `web_research | code_execution | document_creation | api_call | data_processing | general` using keyword heuristics + LLM fallback
    - Implement `run(task, context)` dispatching to the correct specialist handler based on `agentType`
    - Each specialist handler calls the model selected by `ModelRouter`, executes inside the Sandbox, and returns an `AgentResult`
    - Implement `web_research` handler: uses SumoPod/OpenRouter to generate search queries, fetches allowed domains via `node-fetch`, returns summarised content
    - Implement `code_execution` handler: writes code to sandbox workdir, executes via `SandboxManager.executeCode`, captures stdout/stderr
    - Implement `document_creation` handler: generates content via LLM, writes output files (md, html); PDF/DOCX/PPTX/XLSX conversion stubs using existing `html-pdf-node` and `mammoth` packages
    - Implement `api_call` handler: retrieves integration token via `IntegrationManager`, makes HTTP request, returns response
    - Implement `data_processing` handler: loads data from context, applies LLM transformation, returns structured result
    - Implement `general` handler: uses all tools with LLM-directed tool selection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4_

  - [ ]* 7.2 Write property test for agent type assignment
    - **Property 7: Agent type assignment matches task classification**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

  - [ ]* 7.3 Write property test for retry count bounded
    - **Property 6: Sub_Agent retry count is bounded**
    - **Validates: Requirements 2.5**

- [ ] 8. Implement OrchestratorService
  - [ ] 8.1 Create `server/philos/orchestratorService.js`
    - Implement `createRun(userId, goal, options)`: inserts into `philos_runs`, queries `MemoryStore.getRelevantContext`, calls `buildTaskGraph`
    - Implement `buildTaskGraph(runId, goal, memoryContext)`: calls LLM with a structured decomposition prompt, validates the returned graph is a DAG (cycle detection), stores `task_graph` JSONB in `philos_runs`, inserts each node into `philos_tasks`
    - Implement `executeGraph(runId, graph)`: topological sort; dispatch independent tasks concurrently (up to 5 via `Promise.all` batching); enforce dependency ordering; pass upstream outputs into downstream `input_context`
    - Implement `retryTask(taskId)`: re-runs a single task up to 3 total attempts, incrementing `retry_count`
    - Implement `cancelRun(runId)`, `pauseRun(runId)`, `resumeRun(runId)` updating `philos_runs.status` with valid state machine transitions only
    - Emit SSE events via the shared event emitter for every task status change and tool call
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 8.6, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 8.2 Write property test for Task_Graph leaf nodes are single-step
    - **Property 1: Task_Graph leaf nodes are single-step**
    - **Validates: Requirements 1.2**

  - [ ]* 8.3 Write property test for plan modification round-trip
    - **Property 2: Plan modification is reflected in Task_Graph**
    - **Validates: Requirements 1.4**

  - [ ]* 8.4 Write property test for independent tasks execute concurrently
    - **Property 3: Independent tasks execute concurrently**
    - **Validates: Requirements 2.1**

  - [ ]* 8.5 Write property test for dependency ordering enforced
    - **Property 4: Dependency ordering is enforced**
    - **Validates: Requirements 2.2**

  - [ ]* 8.6 Write property test for upstream output injected into downstream context
    - **Property 5: Upstream output is injected into downstream context**
    - **Validates: Requirements 2.3, 10.2**

  - [ ]* 8.7 Write property test for run state machine validity
    - **Property 20: Run state transitions are valid**
    - **Validates: Requirements 8.6**

  - [ ]* 8.8 Write property test for chain failure halts downstream and preserves outputs
    - **Property 25: Chain failure halts downstream and preserves completed outputs**
    - **Validates: Requirements 10.4**

- [ ] 9. Implement IntegrationManager service
  - [ ] 9.1 Create `server/philos/integrationManager.js`
    - Implement `getAuthUrl(provider, userId)` returning the OAuth 2.0 authorization URL for each provider
    - Implement `handleCallback(provider, code, userId)` exchanging the auth code for tokens and upserting into `philos_integrations`
    - Implement `getToken(userId, provider)` fetching from `philos_integrations`; if `expires_at` is past, call `refreshToken` first
    - Implement `refreshToken(userId, provider)` using the stored `refresh_token`; on failure, throw so the Orchestrator can pause the Run
    - Implement `revokeIntegration(userId, provider)` deleting the row and clearing in-memory cache
    - Implement `listIntegrations(userId)` returning all active integration records for the user
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test for OAuth token RLS isolation
    - **Property 16: OAuth token RLS isolation**
    - **Validates: Requirements 7.2**

  - [ ]* 9.3 Write property test for token refresh on expiry
    - **Property 17: Token refresh on expiry**
    - **Validates: Requirements 7.4**

  - [ ]* 9.4 Write property test for revocation prevents future use
    - **Property 18: Integration revocation prevents future use**
    - **Validates: Requirements 7.5**

- [ ] 10. Implement WorkflowScheduler service
  - [ ] 10.1 Create `server/philos/workflowScheduler.js`
    - Implement `saveWorkflow(userId, config)` inserting into `philos_workflows`
    - Implement `scheduleWorkflow(workflowId, cronExpression)` using `node-cron`; store the cron job handle in a `Map`
    - Implement `unscheduleWorkflow(workflowId)` stopping and removing the cron job
    - Implement `triggerWorkflow(workflowId)` loading the workflow config and calling `OrchestratorService.createRun`
    - Implement `listWorkflows(userId)` querying `philos_workflows`
    - On scheduled run completion, insert a notification record for the user and send email summary if Gmail integration is active
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.2 Write property test for workflow save round-trip
    - **Property 19: Workflow save round-trip**
    - **Validates: Requirements 8.1**

  - [ ]* 10.3 Write property test for scheduled run completion triggers notification
    - **Property 21: Scheduled Run completion triggers notification**
    - **Validates: Requirements 8.5**

- [ ] 11. Checkpoint — backend services
  - Ensure all service unit and property tests pass. Ask the user if questions arise.

- [ ] 12. Implement Artifact production and storage
  - [ ] 12.1 Extend `document_creation` handler in `subAgentRunner.js` with full format support
    - PDF: use `html-pdf-node` to convert LLM-generated HTML to PDF
    - DOCX: use `mammoth` (or raw XML generation) to produce `.docx`
    - PPTX: generate a minimal PPTX via XML template
    - XLSX: generate CSV-compatible XLSX via a simple XML template
    - MD and HTML: write directly as text files
    - _Requirements: 9.1_

  - [ ] 12.2 Implement artifact upload and storage in `server/philos/artifactStore.js`
    - After a file is written to the sandbox workdir, upload it to the `philos-artifacts` Supabase Storage bucket
    - Insert a record into `philos_artifacts` with `storage_path` and `download_url`
    - Emit `artifact_ready` SSE event with the download URL
    - _Requirements: 9.2, 9.3_

  - [ ]* 12.3 Write property test for artifact format validity
    - **Property 22: Artifact format support**
    - **Validates: Requirements 9.1**

  - [ ]* 12.4 Write property test for artifact storage round-trip
    - **Property 23: Artifact storage round-trip**
    - **Validates: Requirements 9.2**

  - [ ]* 12.5 Write property test for artifact generation failure surfaces error
    - **Property 24: Artifact generation failure surfaces error**
    - **Validates: Requirements 9.5**

- [ ] 13. Implement SSE streaming infrastructure
  - [ ] 13.1 Create `server/philos/sseManager.js`
    - Maintain a `Map<runId, Set<Response>>` of active SSE connections
    - Implement `addClient(runId, res)` setting SSE headers and registering the response
    - Implement `emit(runId, event: PhilosEvent)` serialising and writing to all connected clients
    - Implement `removeClient(runId, res)` on connection close
    - Wire the SSE manager to the shared event emitter used by `OrchestratorService` and `SubAgentRunner`
    - _Requirements: 11.1, 11.2_

  - [ ]* 13.2 Write property test for live run events streamed
    - **Property 26: Live run events are streamed to the client**
    - **Validates: Requirements 11.1, 11.2**

- [ ] 14. Implement Express API endpoints in server/index.js
  - [ ] 14.1 Add Philos run management endpoints
    - `POST /api/philos/runs` — authenticate user, validate goal, call `OrchestratorService.createRun`, return `{ runId }`
    - `GET /api/philos/runs` — return paginated list of `philos_runs` for the authenticated user
    - `GET /api/philos/runs/:runId` — return full run detail including task graph and artifacts
    - `PATCH /api/philos/runs/:runId` — accept `{ action: 'pause' | 'resume' | 'cancel' }`, call corresponding Orchestrator method
    - `POST /api/philos/runs/:runId/tasks/:taskId/retry` — call `OrchestratorService.retryTask`
    - `PATCH /api/philos/runs/:runId/tasks/:taskId` — accept task graph modification, update `philos_tasks` and `philos_runs.task_graph`
    - _Requirements: 1.1, 1.4, 8.6, 10.5_

  - [ ] 14.2 Add SSE stream endpoint
    - `GET /api/philos/runs/:runId/stream` — set `Content-Type: text/event-stream`, call `sseManager.addClient`, handle client disconnect
    - _Requirements: 11.1, 11.2_

  - [ ] 14.3 Add memory and preferences endpoints
    - `GET /api/philos/memory` — return paginated memory entries for the user
    - `DELETE /api/philos/memory/:entryId` — call `MemoryStore.deleteEntry`
    - `GET /api/philos/preferences` — call `MemoryStore.getPreferences`
    - `PUT /api/philos/preferences` — call `MemoryStore.savePreferences`
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 14.4 Add integration endpoints
    - `GET /api/philos/integrations` — call `IntegrationManager.listIntegrations`
    - `GET /api/philos/integrations/:provider/auth` — return OAuth auth URL
    - `GET /api/philos/integrations/:provider/callback` — handle OAuth callback
    - `DELETE /api/philos/integrations/:provider` — call `IntegrationManager.revokeIntegration`
    - _Requirements: 7.1, 7.5, 7.6_

  - [ ] 14.5 Add workflow endpoints
    - `GET /api/philos/workflows` — call `WorkflowScheduler.listWorkflows`
    - `POST /api/philos/workflows` — call `WorkflowScheduler.saveWorkflow`; if `cron_expression` present, call `scheduleWorkflow`
    - `DELETE /api/philos/workflows/:workflowId` — call `unscheduleWorkflow` and delete from DB
    - _Requirements: 8.1, 8.2, 8.6_

  - [ ] 14.6 Add artifact download endpoint
    - `GET /api/philos/artifacts/:artifactId/download` — verify ownership, return signed Supabase Storage URL
    - _Requirements: 9.2, 9.3_

- [ ] 15. Checkpoint — API layer
  - Ensure all Express endpoints respond correctly with mock service calls. Ask the user if questions arise.

- [ ] 16. Implement frontend PhilosPage and routing
  - [ ] 16.1 Add `/philos` route to `App.tsx`
    - Lazy-import `PhilosPage` from `components/pages/PhilosPage.tsx`
    - Wrap in `ProtectedRoute`
    - _Requirements: 12.1_

  - [ ] 16.2 Create `components/pages/PhilosPage.tsx` shell
    - Render a two-column layout: left sidebar (`RunHistorySidebar`) + main area (`GoalInput` / `ActiveRunPanel` / `ResultsPanel`)
    - Apply responsive breakpoint: single-column below 768 px, two-column at 768 px+
    - Show pro badge or usage indicator based on user tier (query `getUserTier` from existing auth context)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 17. Implement GoalInput component
  - [ ] 17.1 Create `components/philos/GoalInput.tsx`
    - Textarea for goal entry with submit button
    - Optional model selector (reuse existing `components/ui/ModelSelector.tsx`) and domain allowlist input
    - On submit: `POST /api/philos/runs`, navigate to the new run view
    - Disable submit while a run is active; show loading state
    - _Requirements: 1.1, 5.5, 12.2_

- [ ] 18. Implement RunHistorySidebar component
  - [ ] 18.1 Create `components/philos/RunHistorySidebar.tsx`
    - Fetch `GET /api/philos/runs` on mount; display list of past runs with status badge, goal truncated to 60 chars, and relative timestamp
    - Clicking a run loads it into the main panel
    - Show "No runs yet" empty state
    - _Requirements: 11.5, 12.2_

- [ ] 19. Implement ActiveRunPanel with live Task_Graph and SSE
  - [ ] 19.1 Create `components/philos/ActiveRunPanel.tsx`
    - On run selection, open SSE connection to `GET /api/philos/runs/:runId/stream` using `EventSource`
    - Render a visual Task_Graph: nodes as cards showing agent type icon, status badge, elapsed timer; edges as connecting lines (CSS or SVG)
    - Update node status in real time from `task_status` SSE events
    - Show current tool call detail from `tool_call` SSE events beneath the active node
    - Show partial output stream from `task_output` SSE events in a scrollable pre block
    - Clicking a node opens a detail drawer with prompt, partial output, and tool call log
    - Render pause/resume/cancel buttons wired to `PATCH /api/philos/runs/:runId`
    - _Requirements: 1.3, 11.1, 11.2, 11.3, 11.4, 8.6_

  - [ ]* 19.2 Write property test for usage indicator by tier
    - **Property 28: Usage indicator reflects user tier**
    - **Validates: Requirements 12.3, 12.4**

- [ ] 20. Implement ResultsPanel component
  - [ ] 20.1 Create `components/philos/ResultsPanel.tsx`
    - On `run_complete` SSE event, display the `RunSummary`: each step's status, duration, and artifact link
    - For each artifact: show name, format badge, file size, and download button (calls `/api/philos/artifacts/:id/download`)
    - Inline preview for `md` and `html` artifacts using `react-markdown`
    - On `artifact_ready` SSE event, append the new artifact card without full re-render
    - On task failure, show the human-readable error message from `philos_tasks.output`
    - _Requirements: 9.2, 9.4, 9.5, 10.3, 10.4, 10.5_

- [ ] 21. Implement log retention enforcement
  - [ ] 21.1 Add a `node-cron` job in `server/philos/workflowScheduler.js` (or a dedicated `server/philos/maintenance.js`)
    - Schedule a daily job that deletes `philos_tasks` records where `completed_at < now() - interval '30 days'`
    - Log the number of deleted rows
    - _Requirements: 11.5_

  - [ ]* 21.2 Write property test for execution log retention 30 days
    - **Property 27: Execution logs are retained for 30 days**
    - **Validates: Requirements 11.5**

- [ ] 22. Wire all services together in server/index.js
  - [ ] 22.1 Import and initialise all Philos services at server startup
    - Import `OrchestratorService`, `SubAgentRunner`, `ModelRouter`, `SandboxManager`, `MemoryStore`, `IntegrationManager`, `WorkflowScheduler`, `SseManager` from their respective modules
    - Initialise `WorkflowScheduler` to reload active workflows from `philos_workflows` on startup and re-register cron jobs
    - Pass the shared Supabase client and SSE manager into each service constructor/init function
    - _Requirements: 8.2, 11.1_

- [ ] 23. Final checkpoint — full integration
  - Ensure all property-based and unit tests pass. Verify the `/philos` route renders, a goal can be submitted, the SSE stream connects, and task nodes update in real time. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (add to devDependencies: `npm install --save-dev fast-check`)
- Checkpoints ensure incremental validation before moving to the next layer
- The existing `supabase` client, `sumopodClient`, `openrouterClient`, and `getUserTier` helpers in `server/index.js` should be reused by the Philos services rather than re-initialised
