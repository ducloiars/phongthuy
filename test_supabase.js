const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ocyvmphtcwpmxmzwqhym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeXZtcGh0Y3dwbXhtendxaHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDE2OTgsImV4cCI6MjA5NDQ3NzY5OH0.pB2XLzlTjpIit0IJJeDim3wMvy1bYvIWcl5raC2CQeI';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
  const phone = '0987654321';
  const email = 'test_ads@gmail.com';
  const name = 'Test Ads Customer';

  try {
    console.log("1. Thử tìm khách hàng...");
    const { data: existingCustomer, error: findError } = await db
        .from('customers')
        .select('id')
        .eq('phone', phone);
    
    console.log("findError:", findError);
    console.log("existingCustomer:", existingCustomer);

    console.log("2. Thử insert khách hàng...");
    const { data: newCustomer, error: createError } = await db
        .from('customers')
        .insert([{ name, phone, email }])
        .select();
    
    console.log("createError:", createError);
    console.log("newCustomer:", newCustomer);

  } catch (err) {
    console.error("Catch error:", err);
  }
}

testInsert();
