
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ArrowDownCircle, ArrowUpCircle, Lightbulb } from "lucide-react";

const MobileNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-full">
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center ${isActive('/') ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Overview</span>
        </button>
        
        <button 
          onClick={() => navigate('/expenses')}
          className={`flex flex-col items-center justify-center ${isActive('/expenses') ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <ArrowDownCircle size={24} />
          <span className="text-xs mt-1">Expenses</span>
        </button>
        
        <button 
          onClick={() => navigate('/income')}
          className={`flex flex-col items-center justify-center ${isActive('/income') ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <ArrowUpCircle size={24} />
          <span className="text-xs mt-1">Income</span>
        </button>
        
        <button 
          onClick={() => navigate('/ideas')}
          className={`flex flex-col items-center justify-center ${isActive('/ideas') ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <Lightbulb size={24} />
          <span className="text-xs mt-1">Ideas</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavbar;
