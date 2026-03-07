// types/global.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: "https://jdzbffrnbzjsljnzlqmh.supabase.co"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "CHAVE_REMOVIDA"
      SUPABASE_SERVICE_ROLE_KEY: "CHAVE_REMOVIDA"
      ADMIN_SECRET: string
      NEXT_PUBLIC_API_URL: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}