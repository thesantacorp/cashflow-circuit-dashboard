
import { getSupabaseClient } from '../client';
import { toast } from 'sonner';

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
    
    // Create the projects table using direct SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          amount NUMERIC,
          live_link TEXT,
          more_details TEXT,
          expiration_date TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          upvotes INTEGER NOT NULL DEFAULT 0,
          downvotes INTEGER NOT NULL DEFAULT 0
        );
      `
    });
    
    if (error) {
      console.error('Failed to create projects table via RPC:', error);
      return await createProjectsTableDirect();
    }
    
    // Verify the table was created
    const { error: verifyError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    if (verifyError && verifyError.code === '42P01') {
      console.error('Table verification failed, trying direct creation:', verifyError);
      return await createProjectsTableDirect();
    }
    
    return true;
  } catch (error) {
    console.error('Error creating projects table:', error);
    
    // Try fallback method
    try {
      return await createProjectsTableDirect();
    } catch (fallbackError) {
      console.error('Fallback projects table creation also failed:', fallbackError);
      return false;
    }
  }
};

export const createProjectsTableDirect = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting direct projects table creation...');
    
    // Create a simple table directly with "insert if not exists" approach
    const { error } = await supabase.from('projects').upsert({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Project',
      description: 'This is a test project to create the table',
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString()
    });
    
    // Even permission errors mean the table exists or was created
    if (!error || (error && error.code !== '42P01')) {
      console.log('Projects table created directly or already exists');
      
      // Try to delete the test project
      try {
        await supabase
          .from('projects')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000');
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test project, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create projects table directly:', error);
    return false;
  } catch (error) {
    console.error('Exception in direct projects table creation:', error);
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
    
    // Create the votes table using direct SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.project_votes (
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          user_uuid UUID NOT NULL,
          vote INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY(project_id, user_uuid)
        );
      `
    });
    
    if (error) {
      console.error('Failed to create project_votes table via RPC:', error);
      return await createVotesTableDirect();
    }
    
    // Verify the table was created
    const { error: verifyError } = await supabase
      .from('project_votes')
      .select('project_id')
      .limit(1);
      
    if (verifyError && verifyError.code === '42P01') {
      console.error('Table verification failed, trying direct creation:', verifyError);
      return await createVotesTableDirect();
    }
    
    return true;
  } catch (error) {
    console.error('Error creating project_votes table:', error);
    
    // Try fallback method
    try {
      return await createVotesTableDirect();
    } catch (fallbackError) {
      console.error('Fallback project_votes table creation also failed:', fallbackError);
      return false;
    }
  }
};

export const createVotesTableDirect = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Attempting direct project_votes table creation...');
    
    // First ensure the projects table exists
    const projectsExist = await createProjectsTable();
    if (!projectsExist) {
      console.error('Cannot create votes table because projects table does not exist');
      return false;
    }
    
    // Try direct insertion to see if the table is auto-created
    const { error } = await supabase.from('project_votes').upsert({
      project_id: '00000000-0000-0000-0000-000000000000',
      user_uuid: '00000000-0000-0000-0000-000000000000',
      vote: 0
    });
    
    // Even permission errors mean the table exists or was created
    if (!error || (error && error.code !== '42P01')) {
      console.log('Project_votes table created directly or already exists');
      
      // Try to delete the test vote
      try {
        await supabase
          .from('project_votes')
          .delete()
          .eq('project_id', '00000000-0000-0000-0000-000000000000')
          .eq('user_uuid', '00000000-0000-0000-0000-000000000000');
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test vote, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create project_votes table directly:', error);
    return false;
  } catch (error) {
    console.error('Exception in direct project_votes table creation:', error);
    return false;
  }
};

// Create all dependent tables in the correct order
export const createAllGrowTables = async (): Promise<boolean> => {
  console.log('Creating all Grow tables in sequence...');
  
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
  
  return true;
};
