import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pxhchfyluyagjtkbjwoc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aGNoZnlsdXlhZ2p0a2Jqd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NDkxNTEsImV4cCI6MjA2MjUyNTE1MX0.QPTUsCmPtNZDyIXZGHcmRuyGhGrgX8bdpeQddweGlbw";

export const supabase = createClient(supabaseUrl, supabaseKey);
