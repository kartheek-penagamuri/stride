declare namespace NodeJS {
  interface ProcessEnv {
    // OpenAI Configuration
    OPENAI_API_KEY: string
    OPENAI_MODEL?: string
    OPENAI_MAX_TOKENS?: string
    OPENAI_TEMPERATURE?: string
    
    // Next.js Configuration
    NEXT_PUBLIC_APP_URL?: string
  }
}
