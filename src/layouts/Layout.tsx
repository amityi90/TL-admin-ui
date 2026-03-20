import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Layout = () => {
    return (
        <div className="flex w-full min-h-screen bg-gray-50">
            {/* Sidebar with fixed width */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header />
                <div className="p-8 w-full max-w-7xl mx-auto flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
