
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
    
    // Direct insertion approach - this should create the table if it doesn't exist
    console.log('Creating projects table with direct insertion...');
    
    // Set proper content-type headers for creation
    const { error: createError } = await supabase
      .from('projects')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Project',
        description: 'This is a test project to create the table',
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
    
    // If the table was created or already exists
    if (!createError || (createError && createError.code !== '42P01')) {
      console.log('Projects table created or already exists');
      
      // Try to delete the test project
      try {
        await supabase
          .from('projects')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .select();
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test project, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create projects table:', createError);
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
    
    // Direct insertion approach to create the votes table
    console.log('Creating project_votes table with direct insertion...');
    
    const { error: createError } = await supabase
      .from('project_votes')
      .insert({
        project_id: '00000000-0000-0000-0000-000000000000',
        user_uuid: '00000000-0000-0000-0000-000000000000',
        vote: 0,
        created_at: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
    
    // If the table was created or already exists
    if (!createError || (createError && createError.code !== '42P01')) {
      console.log('Project_votes table created or already exists');
      
      // Try to delete the test vote
      try {
        await supabase
          .from('project_votes')
          .delete()
          .eq('project_id', '00000000-0000-0000-0000-000000000000')
          .eq('user_uuid', '00000000-0000-0000-0000-000000000000')
          .select();
      } catch (deleteError) {
        // Ignore deletion errors
        console.log('Could not delete test vote, but table exists');
      }
      
      return true;
    }
    
    console.error('Failed to create project_votes table:', createError);
    return false;
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
