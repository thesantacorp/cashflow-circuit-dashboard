
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { CrowdfundingProject, Backer } from '@/types/crowdfunding';

interface CrowdfundingState {
  projects: CrowdfundingProject[];
  backers: Backer[];
  loading: boolean;
  error: string | null;
}

type CrowdfundingAction =
  | { type: 'ADD_PROJECT'; payload: CrowdfundingProject }
  | { type: 'UPDATE_PROJECT'; payload: CrowdfundingProject }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_BACKER'; payload: Backer }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROJECTS'; payload: CrowdfundingProject[] }
  | { type: 'SET_BACKERS'; payload: Backer[] };

const initialState: CrowdfundingState = {
  projects: [],
  backers: [],
  loading: false,
  error: null
};

const CrowdfundingContext = createContext<{
  state: CrowdfundingState;
  dispatch: React.Dispatch<CrowdfundingAction>;
  addProject: (project: Omit<CrowdfundingProject, 'id' | 'raisedAmount' | 'isFullyFunded' | 'createdAt' | 'updatedAt'>) => Promise<CrowdfundingProject>;
  updateProject: (project: CrowdfundingProject) => Promise<CrowdfundingProject>;
  deleteProject: (id: string) => Promise<void>;
  addBacker: (backer: Omit<Backer, 'id' | 'timestamp'>) => Promise<Backer>;
  getProjectById: (id: string) => CrowdfundingProject | undefined;
  getBackersForProject: (projectId: string) => Backer[];
}>({
  state: initialState,
  dispatch: () => {},
  addProject: async () => ({ id: '', title: '', description: '', targetAmount: 0, raisedAmount: 0, startDate: '', endDate: '', projectDetails: '', isFullyFunded: false, createdAt: '', updatedAt: '' }),
  updateProject: async () => ({ id: '', title: '', description: '', targetAmount: 0, raisedAmount: 0, startDate: '', endDate: '', projectDetails: '', isFullyFunded: false, createdAt: '', updatedAt: '' }),
  deleteProject: async () => {},
  addBacker: async () => ({ id: '', projectId: '', firstName: '', email: '', amount: 0, paymentId: '', timestamp: '' }),
  getProjectById: () => undefined,
  getBackersForProject: () => []
});

const crowdfundingReducer = (state: CrowdfundingState, action: CrowdfundingAction): CrowdfundingState => {
  switch (action.type) {
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => 
          project.id === action.payload.id ? action.payload : project
        )
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };
    case 'ADD_BACKER':
      // Update both backers and corresponding project's raised amount
      const updatedProjects = state.projects.map(project => {
        if (project.id === action.payload.projectId) {
          const newRaisedAmount = project.raisedAmount + action.payload.amount;
          const isFullyFunded = newRaisedAmount >= project.targetAmount;
          
          // If project becomes fully funded, show a toast notification
          if (!project.isFullyFunded && isFullyFunded) {
            toast.success(`🎉 Project "${project.title}" has been fully funded!`);
          }
          
          return {
            ...project,
            raisedAmount: newRaisedAmount,
            isFullyFunded: isFullyFunded,
            updatedAt: new Date().toISOString()
          };
        }
        return project;
      });
      
      return {
        ...state,
        backers: [...state.backers, action.payload],
        projects: updatedProjects
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload
      };
    case 'SET_BACKERS':
      return {
        ...state,
        backers: action.payload
      };
    default:
      return state;
  }
};

export const CrowdfundingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(crowdfundingReducer, initialState);

  // Load data from localStorage on initial load
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('crowdfunding_projects');
      const savedBackers = localStorage.getItem('crowdfunding_backers');

      if (savedProjects) {
        dispatch({ 
          type: 'SET_PROJECTS', 
          payload: JSON.parse(savedProjects) 
        });
      }

      if (savedBackers) {
        dispatch({ 
          type: 'SET_BACKERS', 
          payload: JSON.parse(savedBackers) 
        });
      }
    } catch (error) {
      console.error('Error loading crowdfunding data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load crowdfunding data' 
      });
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem('crowdfunding_projects', JSON.stringify(state.projects));
      localStorage.setItem('crowdfunding_backers', JSON.stringify(state.backers));
    } catch (error) {
      console.error('Error saving crowdfunding data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to save crowdfunding data' 
      });
    }
  }, [state.projects, state.backers]);

  // Helper functions
  const addProject = async (projectData: Omit<CrowdfundingProject, 'id' | 'raisedAmount' | 'isFullyFunded' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const now = new Date().toISOString();
      const newProject: CrowdfundingProject = {
        id: uuidv4(),
        ...projectData,
        raisedAmount: 0,
        isFullyFunded: false,
        createdAt: now,
        updatedAt: now
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Project created successfully');
      return newProject;
    } catch (error) {
      let errorMessage = 'Failed to create project';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateProject = async (project: CrowdfundingProject) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString()
      };

      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Project updated successfully');
      return updatedProject;
    } catch (error) {
      let errorMessage = 'Failed to update project';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ type: 'DELETE_PROJECT', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Project deleted successfully');
    } catch (error) {
      let errorMessage = 'Failed to delete project';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const addBacker = async (backerData: Omit<Backer, 'id' | 'timestamp'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const newBacker: Backer = {
        id: uuidv4(),
        ...backerData,
        timestamp: new Date().toISOString()
      };

      dispatch({ type: 'ADD_BACKER', payload: newBacker });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newBacker;
    } catch (error) {
      let errorMessage = 'Failed to add backer';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const getProjectById = (id: string) => {
    return state.projects.find(project => project.id === id);
  };

  const getBackersForProject = (projectId: string) => {
    return state.backers.filter(backer => backer.projectId === projectId);
  };

  return (
    <CrowdfundingContext.Provider value={{ 
      state, 
      dispatch, 
      addProject, 
      updateProject, 
      deleteProject,
      addBacker,
      getProjectById,
      getBackersForProject
    }}>
      {children}
    </CrowdfundingContext.Provider>
  );
};

export const useCrowdfunding = () => useContext(CrowdfundingContext);
