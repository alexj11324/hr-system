
import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials
const SUPABASE_URL = 'https://gordmkodxmpymwqnockm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcmRta29keG1weW13cW5vY2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTQ5NzAsImV4cCI6MjA4NjU5MDk3MH0.zgYhy-Ds_XBIe2xnS04Yv8T9IHxydMYunZWMzx-MKTc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
