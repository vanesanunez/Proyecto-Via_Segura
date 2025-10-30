import { createClient } from '@supabase/supabase-js'; 

const SUPABASE_URL = "https://wztycrknmlvyicxgisfo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dHljcmtubWx2eWljeGdpc2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjMwMDEsImV4cCI6MjA3MjUzOTAwMX0.TlwjBNPBeCPRSQFeVW2tERsTdS29pYStDmf4KnKO00k"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export default supabase;