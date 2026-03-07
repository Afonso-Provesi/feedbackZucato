// types/global.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: "https://jdzbffrnbzjsljnzlqmh.supabase.co"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkemJmZnJuYnpqc2xqbnpscW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mzg3NjcsImV4cCI6MjA4ODQxNDc2N30.LJmsTjpZdZOHvXbZaHDTDbwK6cYm4pjhRl34T7Qx_Ng"
      SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkemJmZnJuYnpqc2xqbnpscW1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzODc2NywiZXhwIjoyMDg4NDE0NzY3fQ.Syuj6EQS3WmhIBI9KiozKiIQhT6L4AuLuBXHCGjiZs8"
      ADMIN_SECRET: string
      NEXT_PUBLIC_API_URL: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}