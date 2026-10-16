import { User } from 'lucide-react';
import { getAdminEmail } from '../api/session';

const Header = () => {
  const email = getAdminEmail();

  return (
    <header className="flex justify-between items-center bg-white px-8 py-4 shadow-sm h-16 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-serif text-deep-black tracking-widest">
            ADMIN DASHBOARD
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-deep-black">{email || 'Signed in'}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="text-gray-600" size={20} />
        </div>
      </div>
    </header>
  );
};

export default Header;
