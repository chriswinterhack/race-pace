import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hulnxhpottkbxfyoueif.supabase.co',
  'sb_secret_rIsKLZD90ZNYegJrH8kx7A_ukdMkk86'
);

async function resetSubscription() {
  // Get all users with active subscriptions
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, subscription_status')
    .eq('subscription_status', 'active');

  console.log('Users with active subscriptions:', users);

  if (users && users.length > 0) {
    // Reset subscription status to inactive
    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_status: 'inactive' })
      .eq('subscription_status', 'active');

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Reset subscription status for', users.length, 'users');
    }

    // Also delete subscription records
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .in('user_id', users.map(u => u.id));

    if (deleteError) {
      console.error('Delete subscriptions error:', deleteError);
    } else {
      console.log('Deleted subscription records');
    }
  } else {
    console.log('No active subscriptions found');
  }
}

resetSubscription();
