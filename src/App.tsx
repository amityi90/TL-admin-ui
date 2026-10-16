import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Inventory from './pages/Inventory';
import Logistics from './pages/Logistics';
import UIEdit from './pages/UIEdit';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
         position="top-right"
         toastOptions={{
            style: {
                borderRadius: '0px',
                background: '#000',
                color: '#fff',
                fontFamily: 'serif'
            },
            success: {
                iconTheme: {
                    primary: '#D4AF37',
                    secondary: '#fff',
                },
            },
         }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/inventory" replace />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="ui-edit" element={<UIEdit />} />
          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
