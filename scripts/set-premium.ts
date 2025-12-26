import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hulnxhpottkbxfyoueif.supabase.co';
const supabaseServiceKey = 'sb_secret_rIsKLZD90ZNYegJrH8kx7A_ukdMkk86';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setPremium() {
  // Get all users
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, email, subscription_status');

  if (fetchError) {
    console.error('Error fetching users:', fetchError);
    return;
  }

  console.log('Found users:', users);

  // Update all users to active
  const { data, error } = await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select();

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Updated users to premium:', data);
  }
}

setPremium();
