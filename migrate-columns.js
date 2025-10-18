// Script to verify the new columns exist in trucks table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hgupbhapsedcszmwtcws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndXBiaGFwc2VkY3N6bXd0Y3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk1MzIsImV4cCI6MjA3NjE0NTUzMn0.BJtJoMuz7hMDs3BWRcroipbaxU4jj2UUbziS9Q85pG0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyNewColumns() {
  try {
    console.log('Verifying new columns in trucks table...');
    
    // Try to select the new columns specifically
    const { data, error } = await supabase
      .from('trucks')
      .select('vg_id, longitude, latitude, tracking_link')
      .limit(1);

    if (error) {
      console.error('❌ Error selecting new columns:', error.message);
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('The new columns have not been added yet or the schema cache needs to refresh.');
      }
      return false;
    }

    console.log('✅ Successfully selected new columns! The migration was successful.');
    console.log('Data structure:', data);
    
    // Also try to select all columns to see the full structure
    const { data: allData, error: allError } = await supabase
      .from('trucks')
      .select('*')
      .limit(1);
      
    if (!allError && allData) {
      console.log('All available columns:', allData.length > 0 ? Object.keys(allData[0]) : 'No data to show columns');
    }
    
    return true;
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

verifyNewColumns().then(success => {
  if (success) {
    console.log('\n🎉 Database migration verification completed successfully!');
    console.log('The application should now work with the new tracking columns.');
  } else {
    console.log('\n⚠️  Migration verification failed. Please check the database.');
  }
});