
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../client';

// Table creation operations for the Grow feature

export const createProjectsTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create projects table...');
    
    // Check if the table already exists by trying to select from it
    const { data, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('Projects table already exists');
      return true;
    }
      
    if (checkError && checkError.code !== '42P01') {
      // 42P01 is "table does not exist" - any other error is unexpected
      console.error('Error checking projects table:', checkError);
      return false;
    }
    
    // Fallback to the direct REST API method to create the table through insertion
    console.log('Creating projects table via REST API...');
    
    // Try REST approach with fetching and set authorization headers properly
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Table Initialization',
        description: 'This is a record to initialize the table structure',
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString()
      })
    });
    
    // If we get a 201, 200, or 409 response, the table exists or was created
    if (createResponse.ok || createResponse.status === 409) {
      console.log('Projects table created or already exists');
      
      // Verify the table was created
      const { error: verifyError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
      
      if (!verifyError) {
        console.log('Projects table verified and accessible');
        return true;
      } else {
        console.error('Failed to verify projects table after creation:', verifyError);
        return false;
      }
    }
    
    console.error('Error creating projects table via REST:', await createResponse.text());
    return false;
    
  } catch (error) {
    console.error('Exception in projects table creation:', error);
    return false;
  }
};

export const createProjectVotesTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create project_votes table...');
    
    // Check if the table already exists by trying to select from it
    const { data, error: checkError } = await supabase
      .from('project_votes')
      .select('project_id')
      .limit(1);
    
    if (!checkError) {
      console.log('Project_votes table already exists');
      return true;
    }
      
    if (checkError && checkError.code !== '42P01') {
      console.error('Error checking project_votes table:', checkError);
      return false;
    }
    
    // First ensure the projects table exists
    const projectsExist = await createProjectsTable();
    if (!projectsExist) {
      console.error('Cannot create votes table because projects table failed to create');
      return false;
    }
    
    // Try REST approach with fetching
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/project_votes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({
        project_id: '00000000-0000-0000-0000-000000000000',
        user_uuid: '00000000-0000-0000-0000-000000000000',
        vote: 0,
        created_at: new Date().toISOString()
      })
    });
    
    // If we get a successful response or 409 (conflict), the table exists or was created
    if (createResponse.ok || createResponse.status === 409) {
      console.log('Project_votes table created or already exists');
      
      // Verify the table was created
      const { error: verifyError } = await supabase
        .from('project_votes')
        .select('project_id')
        .limit(1);
      
      if (!verifyError) {
        console.log('Project_votes table verified and accessible');
        return true;
      } else {
        console.error('Failed to verify project_votes table after creation:', verifyError);
        return false;
      }
    }
    
    console.error('Error creating project_votes table via REST:', await createResponse.text());
    return false;
    
  } catch (error) {
    console.error('Exception in project_votes table creation:', error);
    return false;
  }
};

// Create all dependent tables in the correct order with improved error handling
export const createAllGrowTables = async (): Promise<boolean> => {
  console.log('Creating all Grow tables in sequence...');
  
  try {
    // Create projects table first
    const projectsCreated = await createProjectsTable();
    if (!projectsCreated) {
      console.error('Failed to create projects table');
      return false;
    }
    
    // Create votes table second (depends on projects table)
    const votesCreated = await createProjectVotesTable();
    if (!votesCreated) {
      console.error('Failed to create project votes table');
      return false;
    }
    
    console.log('All Grow tables created successfully');
    toast.success("Database tables created successfully");
    
    return true;
  } catch (error) {
    console.error('Exception creating Grow tables:', error);
    return false;
  }
};

// Disable RLS policies for Grow tables - this might not be necessary if we're using direct API calls
export const disableRlsPoliciesForGrowTables = async (): Promise<boolean> => {
  try {
    console.log('Note: RLS policies are handled via direct API calls instead');
    return true;
  } catch (error) {
    console.error('Exception handling RLS policies:', error);
    return false;
  }
};
