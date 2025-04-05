
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../client';

// Table creation operations for the Grow feature

export const createProjectsTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create projects table...');
    
    // Check if the table already exists
    const { error: checkError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    if (!checkError) {
      console.log('Projects table already exists');
      return true;
    }
      
    if (checkError && checkError.code !== '42P01') {
      console.error('Error checking projects table:', checkError);
      return false;
    }
    
    // Create projects table using SQL directly - more reliable than inserts
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          amount NUMERIC,
          live_link TEXT,
          more_details TEXT,
          expiration_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0
        );
      `
    });
    
    if (sqlError) {
      console.error('Error creating projects table via SQL:', sqlError);
      
      // Fallback to the insertion method if RPC fails (may not have permissions)
      console.log('Falling back to insert method for projects table...');
      
      // Use the exported constants instead of accessing protected properties
      const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Test Project',
          description: 'This is a test project to create the table',
          upvotes: 0,
          downvotes: 0,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok && response.status !== 409) { // 409 means it already exists
        console.error('Error creating projects table via REST:', await response.text());
        return false;
      }
    }
    
    console.log('Projects table created or already exists');
    return true;
    
  } catch (error) {
    console.error('Exception in projects table creation:', error);
    return false;
  }
};

export const createProjectVotesTable = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting to create project_votes table...');
    
    // Check if the table already exists
    const { error: checkError } = await supabase
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
    
    // Create votes table using SQL directly - more reliable than inserts
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS project_votes (
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_uuid UUID NOT NULL,
          vote INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (project_id, user_uuid)
        );
      `
    });
    
    if (sqlError) {
      console.error('Error creating project_votes table via SQL:', sqlError);
      
      // Fallback to the insertion method if RPC fails
      console.log('Falling back to insert method for project_votes table...');
      
      // Use the exported constants instead of accessing protected properties
      const response = await fetch(`${SUPABASE_URL}/rest/v1/project_votes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          project_id: '00000000-0000-0000-0000-000000000000',
          user_uuid: '00000000-0000-0000-0000-000000000000',
          vote: 0,
          created_at: new Date().toISOString()
        })
      });
      
      if (!response.ok && response.status !== 409) { // 409 means it already exists
        console.error('Error creating project_votes table via REST:', await response.text());
        return false;
      }
    }
    
    console.log('Project_votes table created or already exists');
    return true;
    
  } catch (error) {
    console.error('Exception in project_votes table creation:', error);
    return false;
  }
};

// Create all dependent tables in the correct order with improved error handling
export const createAllGrowTables = async (): Promise<boolean> => {
  console.log('Creating all Grow tables in sequence...');
  
  // Create projects table first
  const projectsCreated = await createProjectsTable();
  if (!projectsCreated) {
    console.error('Failed to create projects table');
    toast.error("Could not initialize projects table", { 
      description: "Please try again or check database permissions",
      duration: 5000
    });
    return false;
  }
  
  // Create votes table second (depends on projects table)
  const votesCreated = await createProjectVotesTable();
  if (!votesCreated) {
    console.error('Failed to create project votes table');
    toast.error("Could not initialize votes table", { 
      description: "Projects table was created, but votes table failed",
      duration: 5000
    });
    return false;
  }
  
  toast.success("Database tables created successfully");
  return true;
};
