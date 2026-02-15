
import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials
const SUPABASE_URL = 'https://xhncdveikphwxoazoudl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobmNkdmVpa3Bod3hvYXpvdWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTE4OTksImV4cCI6MjA4Njc2Nzg5OX0.ibEK1V95t8vzghnYU-tPnkyxVBBFs7Dos5Fjsmv3t_Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
