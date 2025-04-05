
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { ProductIdea, Vote } from '@/types/crowdfunding';

// Generate a unique session ID for the current browser session
const generateSessionId = () => {
  if (!localStorage.getItem('session_id')) {
    localStorage.setItem('session_id', uuidv4());
  }
  return localStorage.getItem('session_id') || '';
};

const SESSION_ID = generateSessionId();

interface ProductIdeasState {
  ideas: ProductIdea[];
  votes: Vote[];
  loading: boolean;
  error: string | null;
}

type ProductIdeasAction =
  | { type: 'ADD_IDEA'; payload: ProductIdea }
  | { type: 'UPDATE_IDEA'; payload: ProductIdea }
  | { type: 'DELETE_IDEA'; payload: string }
  | { type: 'ADD_VOTE'; payload: Vote }
  | { type: 'REMOVE_VOTE'; payload: { ideaId: string, sessionId: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_IDEAS'; payload: ProductIdea[] }
  | { type: 'SET_VOTES'; payload: Vote[] };

const initialState: ProductIdeasState = {
  ideas: [],
  votes: [],
  loading: false,
  error: null
};

const ProductIdeasContext = createContext<{
  state: ProductIdeasState;
  dispatch: React.Dispatch<ProductIdeasAction>;
  addIdea: (idea: Omit<ProductIdea, 'id' | 'upvotes' | 'downvotes' | 'createdAt' | 'updatedAt' | 'votedSessions'>) => Promise<ProductIdea>;
  updateIdea: (idea: ProductIdea) => Promise<ProductIdea>;
  deleteIdea: (id: string) => Promise<void>;
  addVote: (ideaId: string, isUpvote: boolean) => Promise<void>;
  removeVote: (ideaId: string) => Promise<void>;
  getIdeaById: (id: string) => ProductIdea | undefined;
  hasVoted: (ideaId: string) => boolean;
  getVoteType: (ideaId: string) => boolean | null; // true for upvote, false for downvote, null if not voted
  getCurrentSessionId: () => string;
}>({
  state: initialState,
  dispatch: () => {},
  addIdea: async () => ({ 
    id: '', 
    title: '', 
    description: '', 
    detailedDescription: '', 
    upvotes: 0, 
    downvotes: 0, 
    createdAt: '', 
    updatedAt: '',
    votedSessions: [],
    currency: 'USD', 
    currencySymbol: '$' 
  }),
  updateIdea: async () => ({ 
    id: '', 
    title: '', 
    description: '', 
    detailedDescription: '', 
    upvotes: 0, 
    downvotes: 0, 
    createdAt: '', 
    updatedAt: '',
    votedSessions: [],
    currency: 'USD', 
    currencySymbol: '$' 
  }),
  deleteIdea: async () => {},
  addVote: async () => {},
  removeVote: async () => {},
  getIdeaById: () => undefined,
  hasVoted: () => false,
  getVoteType: () => null,
  getCurrentSessionId: () => '',
});

const productIdeasReducer = (state: ProductIdeasState, action: ProductIdeasAction): ProductIdeasState => {
  switch (action.type) {
    case 'ADD_IDEA':
      return {
        ...state,
        ideas: [...state.ideas, action.payload]
      };
    case 'UPDATE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map(idea => 
          idea.id === action.payload.id ? action.payload : idea
        )
      };
    case 'DELETE_IDEA':
      return {
        ...state,
        ideas: state.ideas.filter(idea => idea.id !== action.payload),
        votes: state.votes.filter(vote => vote.ideaId !== action.payload)
      };
    case 'ADD_VOTE': {
      const { ideaId, isUpvote, sessionId } = action.payload;
      
      // Remove any existing votes from this session for this idea
      const filteredVotes = state.votes.filter(
        vote => !(vote.ideaId === ideaId && vote.sessionId === sessionId)
      );
      
      // Update the idea's vote counts
      const updatedIdeas = state.ideas.map(idea => {
        if (idea.id === ideaId) {
          // First, recount all votes except the one from this session
          const existingVotes = state.votes.filter(vote => 
            vote.ideaId === ideaId && vote.sessionId !== sessionId
          );
          
          const currentUpvotes = existingVotes.filter(vote => vote.isUpvote).length;
          const currentDownvotes = existingVotes.filter(vote => !vote.isUpvote).length;
          
          // Then add the new vote
          return {
            ...idea,
            upvotes: currentUpvotes + (isUpvote ? 1 : 0),
            downvotes: currentDownvotes + (!isUpvote ? 1 : 0),
            votedSessions: [...idea.votedSessions.filter(id => id !== sessionId), sessionId],
            updatedAt: new Date().toISOString()
          };
        }
        return idea;
      });
      
      return {
        ...state,
        ideas: updatedIdeas,
        votes: [...filteredVotes, action.payload]
      };
    }
    case 'REMOVE_VOTE': {
      const { ideaId, sessionId } = action.payload;
      
      // Find the vote we're removing to determine if it was an upvote or downvote
      const voteToRemove = state.votes.find(
        vote => vote.ideaId === ideaId && vote.sessionId === sessionId
      );
      
      if (!voteToRemove) return state;
      
      // Update the idea's vote counts
      const updatedIdeas = state.ideas.map(idea => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            upvotes: idea.upvotes - (voteToRemove.isUpvote ? 1 : 0),
            downvotes: idea.downvotes - (!voteToRemove.isUpvote ? 1 : 0),
            votedSessions: idea.votedSessions.filter(id => id !== sessionId),
            updatedAt: new Date().toISOString()
          };
        }
        return idea;
      });
      
      return {
        ...state,
        ideas: updatedIdeas,
        votes: state.votes.filter(vote => 
          !(vote.ideaId === ideaId && vote.sessionId === sessionId)
        )
      };
    }
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
    case 'SET_IDEAS':
      return {
        ...state,
        ideas: action.payload
      };
    case 'SET_VOTES':
      return {
        ...state,
        votes: action.payload
      };
    default:
      return state;
  }
};

export const CrowdfundingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(productIdeasReducer, initialState);

  useEffect(() => {
    try {
      const savedIdeas = localStorage.getItem('product_ideas');
      const savedVotes = localStorage.getItem('product_idea_votes');

      if (savedIdeas) {
        dispatch({ 
          type: 'SET_IDEAS', 
          payload: JSON.parse(savedIdeas) 
        });
      }

      if (savedVotes) {
        dispatch({ 
          type: 'SET_VOTES', 
          payload: JSON.parse(savedVotes) 
        });
      }
    } catch (error) {
      console.error('Error loading product idea data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load product idea data' 
      });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('product_ideas', JSON.stringify(state.ideas));
      localStorage.setItem('product_idea_votes', JSON.stringify(state.votes));
    } catch (error) {
      console.error('Error saving product idea data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to save product idea data' 
      });
    }
  }, [state.ideas, state.votes]);

  const addIdea = async (ideaData: Omit<ProductIdea, 'id' | 'upvotes' | 'downvotes' | 'createdAt' | 'updatedAt' | 'votedSessions'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const now = new Date().toISOString();
      const newIdea: ProductIdea = {
        id: uuidv4(),
        ...ideaData,
        upvotes: 0,
        downvotes: 0,
        votedSessions: [],
        createdAt: now,
        updatedAt: now,
        currency: ideaData.currency || 'USD',
        currencySymbol: ideaData.currencySymbol || '$'
      };

      dispatch({ type: 'ADD_IDEA', payload: newIdea });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Product idea created successfully');
      return newIdea;
    } catch (error) {
      let errorMessage = 'Failed to create product idea';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateIdea = async (idea: ProductIdea) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const updatedIdea = {
        ...idea,
        updatedAt: new Date().toISOString()
      };

      dispatch({ type: 'UPDATE_IDEA', payload: updatedIdea });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Product idea updated successfully');
      return updatedIdea;
    } catch (error) {
      let errorMessage = 'Failed to update product idea';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteIdea = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ type: 'DELETE_IDEA', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Product idea deleted successfully');
    } catch (error) {
      let errorMessage = 'Failed to delete product idea';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const addVote = async (ideaId: string, isUpvote: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const newVote: Vote = {
        ideaId,
        sessionId: SESSION_ID,
        isUpvote,
        timestamp: new Date().toISOString()
      };

      dispatch({ type: 'ADD_VOTE', payload: newVote });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success(`Successfully ${isUpvote ? 'upvoted' : 'downvoted'} the idea`);
    } catch (error) {
      let errorMessage = 'Failed to submit vote';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const removeVote = async (ideaId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      dispatch({ 
        type: 'REMOVE_VOTE', 
        payload: { 
          ideaId, 
          sessionId: SESSION_ID 
        } 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Vote removed successfully');
    } catch (error) {
      let errorMessage = 'Failed to remove vote';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const getIdeaById = (id: string) => {
    return state.ideas.find(idea => idea.id === id);
  };

  const hasVoted = (ideaId: string) => {
    return !!state.votes.find(vote => 
      vote.ideaId === ideaId && vote.sessionId === SESSION_ID
    );
  };

  const getVoteType = (ideaId: string) => {
    const vote = state.votes.find(vote => 
      vote.ideaId === ideaId && vote.sessionId === SESSION_ID
    );
    return vote ? vote.isUpvote : null;
  };

  const getCurrentSessionId = () => SESSION_ID;

  return (
    <ProductIdeasContext.Provider value={{ 
      state, 
      dispatch, 
      addIdea, 
      updateIdea, 
      deleteIdea,
      addVote,
      removeVote,
      getIdeaById,
      hasVoted,
      getVoteType,
      getCurrentSessionId
    }}>
      {children}
    </ProductIdeasContext.Provider>
  );
};

export const useCrowdfunding = useContext(ProductIdeasContext);
