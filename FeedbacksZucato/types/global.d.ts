// types/global.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string
      ADMIN_SECRET: string
      NEXT_PUBLIC_API_URL: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}