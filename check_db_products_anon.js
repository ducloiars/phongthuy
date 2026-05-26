const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ocyvmphtcwpmxmzwqhym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXZtcGh0Y3dwbXhtendxaHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDE2OTgsImV4cCI6MjA5NDQ3NzY5OH0.pB2XLzlTjpIit0IJJeDim3wMvy1bYvIWcl5raC2CQeI';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await db.from('products').select('*');
  console.log("Error:", error);
  console.log("Products count (Anon):", data ? data.length : 0);
  console.log("Products:", data);
}

check();
