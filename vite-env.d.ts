/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_SUMOPOD_API_KEY: string;
    readonly VITE_MIDTRANS_CLIENT_KEY: string;
    readonly VITE_YJS_SERVER_URL: string;
    readonly VITE_APP_URL: string;
    readonly VITE_GROQ_API_KEY: string;
    readonly VITE_OPENROUTER_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
