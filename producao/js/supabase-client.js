const SUPABASE_URL = 'https://vlnzhrhzzhbzdvhmsuap.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fmqGGaxEPBatRTMzL5sTnw_FWrgvqr6';

// Conexão renomeada para evitar conflito com a biblioteca global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
