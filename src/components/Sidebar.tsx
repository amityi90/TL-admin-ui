import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 h-screen bg-deep-black text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 border-b border-gray-800 flex items-center justify-center">
        <h1 className="text-2xl font-serif tracking-widest text-champagne-gold">TL-LUXURY</h1>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2">
        <NavLink 
          to="/inventory" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors ${
              isActive 
                ? 'text-champagne-gold bg-white/5 border-l-2 border-champagne-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <ShoppingBag size={20} />
          INVENTORY
        </NavLink>

        <NavLink 
          to="/logistics" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors ${
              isActive 
                ? 'text-champagne-gold bg-white/5 border-l-2 border-champagne-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Package size={20} />
          ORDERS & LOGISTICS
        </NavLink>
        
        <div className="pt-8 mt-8 border-t border-gray-800">
             <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors ${
                    isActive 
                        ? 'text-champagne-gold bg-white/5 border-l-2 border-champagne-gold' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                }
                >
                <Settings size={20} />
                SETTINGS
            </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          LOGOUT
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
