import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://fbripqxvotzmktkismuj.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicmlwcXh2b3R6bWt0a2lzbXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTY0MjUsImV4cCI6MjA5MjMzMjQyNX0.djAIgu4K0J0JbQdtobtXpCBWfaS9plMd74GAE34j1RY'

export const supabase = createClient(url, key)
