# Requirements Document

## Introduction

Noir Philos is an agentic AI system integrated into the Noir AI platform. It accepts a high-level goal from the user, autonomously decomposes it into tasks and subtasks, spawns specialist sub-agents to execute those tasks in parallel, and delivers real, tangible outputs (documents, slides, emails, code, reports) — all without manual intervention between steps. It competes directly with Perplexity Computer, OpenClaw, and Claude Cowork by offering multi-model orchestration, persistent memory, external service integrations, and a safe sandboxed execution environment.

## Glossary

- **Philos**: The Noir Philos agentic system as a whole.
- **Orchestrator**: The top-level AI component that receives the user's goal, decomposes it into a plan, and coordinates all sub-agents.
- **Sub_Agent**: A specialist AI worker spawned by the Orchestrator to execute a single scoped task (e.g., web research, document creation, API call).
- **Task_Graph**: The directed acyclic graph of tasks and subtasks produced by the Orchestrator for a given goal.
- **Sandbox**: The isolated server-side execution environment in which Sub_Agents run code, browse the web, and manipulate files.
- **Artifact**: A real output produced by Philos — a file, document, slide deck, email draft, code file, or report.
- **Memory_Store**: The persistent, per-user storage layer (Supabase) that retains context, past runs, learned preferences, and intermediate results across sessions.
- **Integration**: A configured connection to an external service (Gmail, GitHub, Slack, Google Drive, Notion, etc.) authorized by the user.
- **Workflow**: A named, reusable sequence of tasks that can be triggered manually, on a schedule, or by an external condition.
- **Run**: A single execution instance of Philos for a given goal, with a unique ID, status, and log.
- **Tool**: A capability available to a Sub_Agent — web search, code execution, file read/write, API call, browser automation.
- **Model_Router**: The component that selects the appropriate AI model (SumoPod Gemini Flash Lite, OpenRouter GPT-5, Claude, Gemini Pro) for each Sub_Agent based on task type and user tier.

---

## Requirements

### Requirement 1: Goal Intake and Task Decomposition

**User Story:** As a user, I want to describe a high-level goal in plain language, so that Philos automatically figures out all the steps needed to achieve it without me having to plan anything.

#### Acceptance Criteria

1. WHEN a user submits a goal, THE Orchestrator SHALL parse the goal and produce a Task_Graph within 10 seconds.
2. THE Orchestrator SHALL decompose each top-level task into subtasks until each leaf node is executable by a single Sub_Agent in one step.
3. WHEN the Task_Graph is produced, THE Philos SHALL display the plan to the user as an interactive, collapsible tree before execution begins.
4. WHEN a user modifies the plan before execution, THE Orchestrator SHALL update the Task_Graph to reflect the changes.
5. IF the Orchestrator cannot decompose a goal into a valid Task_Graph, THEN THE Philos SHALL present the user with a clarifying question and wait for a response.

---

### Requirement 2: Parallel Sub-Agent Execution

**User Story:** As a user, I want independent tasks to run at the same time, so that complex goals complete faster than sequential execution would allow.

#### Acceptance Criteria

1. WHEN the Task_Graph contains tasks with no dependency on each other, THE Orchestrator SHALL execute those tasks via separate Sub_Agents concurrently.
2. THE Orchestrator SHALL enforce task dependency order, starting a Sub_Agent only after all of its prerequisite tasks have completed successfully.
3. WHEN a Sub_Agent completes a task, THE Orchestrator SHALL pass the Sub_Agent's output to all dependent downstream Sub_Agents as context.
4. THE Philos SHALL support a minimum of 5 concurrent Sub_Agents per Run.
5. WHEN a Sub_Agent fails, THE Orchestrator SHALL retry the task up to 3 times before marking it as failed and continuing with the remaining graph.

---

### Requirement 3: Specialist Sub-Agent Types

**User Story:** As a user, I want Philos to use the right kind of agent for each task, so that each step is handled by a tool optimized for that specific job.

#### Acceptance Criteria

1. THE Orchestrator SHALL assign a Web_Research Sub_Agent for tasks that require retrieving information from the internet.
2. THE Orchestrator SHALL assign a Code_Execution Sub_Agent for tasks that require writing or running code.
3. THE Orchestrator SHALL assign a Document_Creation Sub_Agent for tasks that require producing structured documents, slides, or reports.
4. THE Orchestrator SHALL assign an API_Call Sub_Agent for tasks that require interacting with external service APIs.
5. THE Orchestrator SHALL assign a Data_Processing Sub_Agent for tasks that require transforming, summarizing, or analyzing structured data.
6. WHERE a task does not match a specialist type, THE Orchestrator SHALL assign a General Sub_Agent capable of using all available Tools.

---

### Requirement 4: Safe Sandboxed Execution Environment

**User Story:** As a user, I want Philos to run code and browse the web safely, so that agent actions cannot harm my system or expose sensitive data.

#### Acceptance Criteria

1. THE Sandbox SHALL execute all Sub_Agent code in an isolated server-side environment with no access to the host filesystem outside the designated workspace directory.
2. THE Sandbox SHALL restrict outbound network access to a configurable allowlist of domains per Run.
3. WHEN a Sub_Agent attempts a disallowed operation, THE Sandbox SHALL block the operation, log the attempt, and notify the Orchestrator.
4. THE Sandbox SHALL enforce a maximum execution time of 300 seconds per Sub_Agent task, after which the task is terminated and marked as timed out.
5. THE Sandbox SHALL provide each Run with an isolated virtual filesystem that is cleaned up after the Run completes, unless the user requests Artifact persistence.

---

### Requirement 5: Multi-Model AI Routing

**User Story:** As a user, I want Philos to automatically pick the best AI model for each task, so that I get high quality results without paying for expensive models when cheaper ones are sufficient.

#### Acceptance Criteria

1. THE Model_Router SHALL select SumoPod Gemini Flash Lite for Sub_Agent tasks classified as low-complexity (summarization, simple Q&A, formatting).
2. THE Model_Router SHALL select an OpenRouter model (GPT-5, Claude, or Gemini Pro) for Sub_Agent tasks classified as high-complexity (multi-step reasoning, code generation, long-form writing).
3. WHILE a user is on the free tier, THE Model_Router SHALL restrict Sub_Agent model selection to SumoPod Gemini Flash Lite only.
4. WHILE a user is on the pro tier, THE Model_Router SHALL allow Sub_Agent model selection from all available OpenRouter models.
5. WHEN a user specifies a preferred model for a Run, THE Model_Router SHALL use that model for all Sub_Agents in that Run unless overridden per task.
6. IF a selected model returns an error or rate-limit response, THEN THE Model_Router SHALL fall back to the next available model in the priority list and log the fallback event.

---

### Requirement 6: Persistent Memory Across Sessions

**User Story:** As a user, I want Philos to remember context from past runs, so that I don't have to re-explain my preferences, projects, or prior research every time.

#### Acceptance Criteria

1. THE Memory_Store SHALL persist the Task_Graph, all Sub_Agent outputs, and all produced Artifacts for every completed Run, linked to the user's account in Supabase.
2. WHEN a new Run begins, THE Orchestrator SHALL query the Memory_Store for relevant context from prior Runs and inject it into the Orchestrator's planning prompt.
3. THE Philos SHALL allow users to view, search, and delete entries in their Memory_Store from the Philos UI.
4. WHEN a user deletes a memory entry, THE Memory_Store SHALL remove that entry and all associated Artifacts within 5 seconds.
5. THE Memory_Store SHALL store user-defined preferences (preferred output format, tone, language, default integrations) and apply them automatically to new Runs.

---

### Requirement 7: External Service Integrations

**User Story:** As a user, I want Philos to connect to my existing tools like Gmail, GitHub, and Slack, so that it can take real actions in those services as part of a workflow.

#### Acceptance Criteria

1. THE Philos SHALL support OAuth 2.0 authorization for Gmail, GitHub, Slack, Google Drive, and Notion integrations.
2. WHEN a user authorizes an Integration, THE Philos SHALL store the OAuth tokens securely in Supabase using row-level security scoped to that user.
3. THE API_Call Sub_Agent SHALL use authorized Integration tokens to send emails via Gmail, create issues via GitHub, post messages via Slack, upload files via Google Drive, and create pages via Notion.
4. WHEN an Integration token expires, THE Philos SHALL attempt a silent token refresh and, if unsuccessful, notify the user and pause the Run until re-authorization is completed.
5. IF a user revokes an Integration, THEN THE Philos SHALL immediately invalidate the stored tokens and prevent any Sub_Agent from using that Integration in future Runs.
6. THE Philos SHALL display the list of active Integrations and their permission scopes in the user's settings panel.

---

### Requirement 8: Long-Running, Scheduled, and Condition-Triggered Workflows

**User Story:** As a user, I want to set up workflows that run automatically on a schedule or when something happens, so that Philos can work for me in the background without me being present.

#### Acceptance Criteria

1. THE Philos SHALL allow users to save a Run configuration as a named Workflow.
2. WHEN a user sets a cron schedule on a Workflow, THE Philos SHALL trigger a new Run of that Workflow at each scheduled time using node-cron.
3. WHEN a user defines a condition trigger (e.g., "when a new GitHub issue is opened"), THE Philos SHALL poll or subscribe to the relevant Integration event and start a Run when the condition is met.
4. THE Philos SHALL support Runs with a total duration of up to 30 minutes before requiring user confirmation to continue.
5. WHEN a scheduled or triggered Run completes, THE Philos SHALL notify the user via in-app notification and, where an email Integration is authorized, via email summary.
6. THE Philos SHALL allow users to pause, resume, or cancel any active Run or scheduled Workflow from the Philos UI.

---

### Requirement 9: Artifact Production and Delivery

**User Story:** As a user, I want Philos to produce real, usable files as output, so that I can immediately use or share the results without additional manual work.

#### Acceptance Criteria

1. THE Document_Creation Sub_Agent SHALL produce Artifacts in at least the following formats: PDF, DOCX, PPTX, XLSX, Markdown, and plain HTML.
2. WHEN an Artifact is produced, THE Philos SHALL store it in Supabase Storage and display a download link in the Run results panel.
3. WHEN a user's Workflow includes a delivery step (e.g., "send via Gmail"), THE API_Call Sub_Agent SHALL attach the Artifact to the outbound message automatically.
4. THE Philos SHALL display a preview of text-based and slide Artifacts inline in the Run results panel without requiring a download.
5. IF Artifact generation fails, THEN THE Philos SHALL log the error, surface a human-readable failure message in the UI, and retain any partial output for user inspection.

---

### Requirement 10: Natural Workflow Chaining

**User Story:** As a user, I want to describe an end-to-end outcome like "research competitors, analyze findings, create a slide deck, and email it to my team", so that Philos executes the entire chain without me having to trigger each step manually.

#### Acceptance Criteria

1. WHEN a user's goal implies a sequence of dependent outcomes, THE Orchestrator SHALL automatically chain the corresponding Sub_Agent types into a linear or branching Task_Graph.
2. THE Orchestrator SHALL pass the output of each completed chain step as structured context to the next step's Sub_Agent prompt.
3. WHEN all steps in a chain complete successfully, THE Philos SHALL present a unified Run summary showing each step's status, duration, and produced Artifact.
4. IF any step in a chain fails after all retries, THEN THE Orchestrator SHALL halt downstream steps, preserve all completed step outputs, and present the user with options to retry the failed step or skip it and continue.
5. THE Philos SHALL allow users to inspect the input and output of every individual step in a completed or failed chain from the Run detail view.

---

### Requirement 11: Real-Time Run Visibility

**User Story:** As a user, I want to see what Philos is doing at every moment while it runs, so that I can trust the process and intervene if something looks wrong.

#### Acceptance Criteria

1. WHILE a Run is active, THE Philos SHALL stream live status updates for each Sub_Agent (queued, running, completed, failed) to the UI without requiring a page refresh.
2. WHILE a Run is active, THE Philos SHALL display the current Tool being used by each active Sub_Agent (e.g., "Searching web for X", "Writing file Y").
3. THE Philos SHALL display a real-time elapsed time counter for each active Sub_Agent task.
4. WHEN a user clicks on a Sub_Agent node in the live Task_Graph view, THE Philos SHALL display the Sub_Agent's current prompt, partial output, and tool call log.
5. THE Philos SHALL retain the full execution log for every Run for a minimum of 30 days, accessible from the Run history panel.

---

### Requirement 12: Philos UI Entry Point

**User Story:** As a user, I want a dedicated Philos interface within Noir, so that I can access the agentic system separately from the standard chat interface.

#### Acceptance Criteria

1. THE Philos SHALL be accessible via a dedicated route (`/philos`) in the Noir React application.
2. THE Philos UI SHALL include a goal input field, a Run history sidebar, an active Run panel with live Task_Graph visualization, and a results/Artifacts panel.
3. WHEN a user is on the free tier, THE Philos SHALL display a usage indicator showing the number of Runs used and the monthly limit.
4. WHEN a user is on the pro tier, THE Philos SHALL remove the usage cap indicator and display the pro badge on the Philos header.
5. THE Philos UI SHALL be responsive and functional on viewport widths of 768px and above.
