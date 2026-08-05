// ATENÇÃO: Substitua os valores abaixo pelas suas credenciais reais do Supabase
const SUPABASE_URL = 'https://vlnzhrhzzhbzdvhmsuap.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_fmqGGaxEPBatRTMzL5sTnw_FWrgvqr6';

// Inicializa a ponte de comunicação entre seu GitHub Pages e o Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
