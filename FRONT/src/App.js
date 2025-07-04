import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Empresas from './pages/Empresas/Empresas';
import Clientes from './pages/Clientes/Clientes';
import Produtos from './pages/Produtos/Produtos';
import Pedidos from './pages/Pedidos/Pedidos';
import PedidoForm from './pages/Pedidos/PedidoForm';
import PedidoView from './pages/Pedidos/PedidoView';
import Profile from './pages/Profile/Profile';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Componente para rotas públicas (redireciona se já logado)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rotas públicas */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Rotas protegidas */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/pedidos/novo" element={<PedidoForm />} />
                  <Route path="/pedidos/:id" element={<PedidoView />} />
                  <Route path="/pedidos/editar/:id" element={<PedidoForm />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;