# Nevra | Neural Automation

Nevra is an advanced AI-powered SaaS platform that integrates multiple generative AI capabilities into a unified workspace. It features intelligent chat, UI/UX design generation, collaborative whiteboarding, and a personalized knowledge base.

## 🚀 Key Features

*   **AI Chat Interface**: Multi-model support (Gemini, Deepseek, etc.) via SumoPod wrapper with rich text formatting and code syntax highlighting.
*   **Design Studio**: Generate high-fidelity HTML/CSS prototypes from text prompts or reference images ("Redesign" feature).
*   **Collaborative Canvas**: Integrated Excalidraw whiteboarding for brainstorming and diagramming.
*   **Knowledge Base (RAG)**: Upload identifiers and embed documents to create a personalized context for AI responses.
*   **Shared Chats**: Generate public links to share interesting AI conversations with others.
*   **Subscription System**: Tiered access (Free, Pro, Enterprise) with granular token usage tracking and payment integration (Midtrans & Stripe).
*   **Authentication**: Secure user management via Supabase Auth.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19 (via Vite)
*   **Styling**: TailwindCSS, Framer Motion
*   **State/Logic**: React Router v7, Lucide React
*   **Key Libraries**: `@excalidraw/excalidraw`, `react-markdown`, `three.js`

### Backend
*   **Runtime**: Node.js (Express.js)
*   **Database**: Supabase (PostgreSQL)
*   **AI Integration**: OpenAI SDK (acting as client for SumoPod/Gemini models)
*   **Storage**: Supabase Storage / Local Uploads
*   **Payments**: `midtrans-client`, `stripe`

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+ recommended)
*   Supabase Account & Project
*   API Keys (SumoPod/OpenAI, Midtrans - optional)

### 1. Clone & Install
```bash
git clone <repository-url>
cd Nevra
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory. You can copy `.env.local.example` if available. Required variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key (for backend admin tasks)

# AI Service (SumoPod / OpenAI compatible)
SUMOPOD_API_KEY=your_ai_api_key
SUMOPOD_BASE_URL=https://api.sumopod.com (or other base URL)
SUMOPOD_MODEL_ID=gemini/gemini-pro (default model)

# Payments (Optional)
MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
```

### 3. Database Migration
Run the SQL scripts located in `supabase/migrations` in your Supabase SQL Editor to set up the schema:
1.  `001_initial_schema.sql` (Core tables: user_profiles, subscriptions, ai_usage)
2.  `002_safe_migration.sql` (Safety checks and additional indexes)
3.  `003_share_chat.sql` (Policies for shared chats)

### 4. Running the Application
The project requires both the separate backend API and the frontend dev server.

**Start the Backend API:**
```bash
npm run api
# server running on http://localhost:8788
```

**Start the Frontend:**
```bash
npm run dev
# frontend running on http://localhost:5173
```

## 📂 Project Structure

*   `/app` - Core application layout and logic.
*   `/components` - React components (Pages, UI elements, Auth forms).
*   `/lib` - Utility libraries (AI clients, Supabase client, helpers).
*   `/server` - Express.js backend server code.
*   `/supabase` - Database migrations and configuration.
*   `/public` - Static assets.

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---
© 2024 Nevra. All rights reserved.
