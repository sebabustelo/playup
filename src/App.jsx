import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@/pages/Home'
import Registrarse from '@/pages/auth/Registrarse'
import IniciarSesion from '@/pages/auth/IniciarSesion'
import NotFound from '@/pages/NotFound'
const Admin = lazy(() => import('@/pages/admin/Admin'))
const AdminPredios = lazy(() => import('@/pages/admin/AdminPredios'))
const AdminCanchas = lazy(() => import('@/pages/admin/AdminCanchas'))
const AdminPrecios = lazy(() => import('@/pages/admin/AdminPrecios'))
const AdminPromociones = lazy(() => import('@/pages/admin/AdminPromociones'))
const AdminDeportes = lazy(() => import('@/pages/admin/AdminDeportes'))
import BuscarCanchas from '@/pages/BuscarCanchas'
import CrearPartido from '@/pages/CrearPartido'
import MisPartidos from '@/pages/MisPartidos'
import DetallePartido from '@/pages/DetallePartido'
import RutasProtegidas from '@/auth/RutasProtegidas'
import { AuthProvider, useAuth, ToastProvider, useToast } from '@/context'
import ToastContainer from '@/components/ToastContainer'
import ErrorBoundary from '@/components/ErrorBoundary'
import ScrollToTop from '@/components/ScrollToTop'
import Header from '@/components/estaticos/Header'
import Footer from '@/components/estaticos/Footer'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<div style={{padding:16}}>Cargando…</div>}>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  )
}

function AppRoutes() {
  const { user } = useAuth();
  const { toasts, removeToast } = useToast();

  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/buscar-canchas' element={<BuscarCanchas />} />
          <Route path='/crear-partido' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <CrearPartido />
            </RutasProtegidas>
          } />
          <Route path='/mis-partidos' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <MisPartidos />
            </RutasProtegidas>
          } />
          <Route path='/partido/:id' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <DetallePartido />
            </RutasProtegidas>
          } />
          <Route path='/admin' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <Admin />
            </RutasProtegidas>
          } />
          <Route path='/admin/predios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminPredios />
            </RutasProtegidas>
          } />
          <Route path='/admin/canchas' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminCanchas />
            </RutasProtegidas>
          } />
          <Route path='/admin/precios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminPrecios />
            </RutasProtegidas>
          } />
          <Route path='/admin/promociones' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminPromociones />
            </RutasProtegidas>
          } />
          <Route path='/admin/deportes' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminDeportes />
            </RutasProtegidas>
          } />
          <Route path='/login' element={<IniciarSesion />} />
          <Route path='/registrarse' element={<Registrarse />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default App




