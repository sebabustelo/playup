import React, { Suspense, lazy, useEffect } from 'react';
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
const AdminFranjasHorarias = lazy(() => import('@/pages/admin/AdminFranjasHorarias'))
const AdminServicios = lazy(() => import('@/pages/admin/AdminServicios'))
const AdminUsuarios = lazy(() => import('@/pages/admin/AdminUsuarios'))
const AdminPartidos = lazy(() => import('@/pages/admin/AdminPartidos'))
const CargarDatosEjemplo = lazy(() => import('@/pages/admin/CargarDatosEjemplo'))
const BuscarCanchas = lazy(() => import('@/pages/BuscarCanchas'))
const CrearPartido = lazy(() => import('@/pages/CrearPartido'))
const MisPartidos = lazy(() => import('@/pages/MisPartidos'))
const DetallePartido = lazy(() => import('@/pages/DetallePartido'))
const PagoExitoso = lazy(() => import('@/pages/PagoExitoso'))
const PagoError = lazy(() => import('@/pages/PagoError'))
const PagoPendiente = lazy(() => import('@/pages/PagoPendiente'))
import RutasProtegidas from '@/auth/RutasProtegidas'
import { AuthProvider, useAuth, ToastProvider, useToast } from '@/context'
import ToastContainer from '@/components/ToastContainer'
import ErrorBoundary from '@/components/ErrorBoundary'
import ScrollToTop from '@/components/ScrollToTop'
import Header from '@/components/estaticos/Header'
import Footer from '@/components/estaticos/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import './App.css'

// Configuración optimizada de React Query para escalabilidad
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutos - datos frescos
      cacheTime: 10 * 60 * 1000,       // 10 minutos - mantener en caché
      refetchOnWindowFocus: false,      // No refetch al cambiar de ventana
      refetchOnMount: true,             // Refetch al montar componente
      retry: 1,                         // Solo 1 reintento en caso de error
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0,                         // No reintentar mutaciones
    },
  },
})

// Inicializar MercadoPago con la Public Key (solo si el SDK está disponible)
const initializeMercadoPago = async () => {
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.warn('MercadoPago Public Key no configurada');
    return;
  }

  try {
    const mercadoPagoModule = await import('@mercadopago/sdk-react');
    if (mercadoPagoModule.initMercadoPago) {
      mercadoPagoModule.initMercadoPago(publicKey);
      console.log('MercadoPago SDK inicializado correctamente');
    }
  } catch (error) {
    console.warn('SDK de MercadoPago no disponible. Ejecuta: npm install @mercadopago/sdk-react');
    console.warn('El sistema usará redirección directa a MercadoPago como alternativa');
  }
};

function App() {
  useEffect(() => {
    initializeMercadoPago();
  }, []);

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingSpinner size="large" />}>
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
          <Route path='/partido/:id/pago-exitoso' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <PagoExitoso />
            </RutasProtegidas>
          } />
          <Route path='/partido/:id/pago-error' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <PagoError />
            </RutasProtegidas>
          } />
          <Route path='/partido/:id/pago-pendiente' element={
            <RutasProtegidas isAuthenticated={!!user}>
              <PagoPendiente />
            </RutasProtegidas>
          } />
          <Route path='/admin' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin', 'admin_predios']}>
              <Admin />
            </RutasProtegidas>
          } />
          <Route path='/admin/predios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminPredios />
            </RutasProtegidas>
          } />
          <Route path='/admin/canchas' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin', 'admin_predios']}>
              <AdminCanchas />
            </RutasProtegidas>
          } />
          <Route path='/admin/precios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin', 'admin_predios']}>
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
          <Route path='/admin/franjas-horarias' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminFranjasHorarias />
            </RutasProtegidas>
          } />
          <Route path='/admin/servicios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminServicios />
            </RutasProtegidas>
          } />
          <Route path='/admin/usuarios' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <AdminUsuarios />
            </RutasProtegidas>
          } />
          <Route path='/admin/partidos' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin', 'admin_predios']}>
              <AdminPartidos />
            </RutasProtegidas>
          } />
          <Route path='/admin/cargar-datos' element={
            <RutasProtegidas isAuthenticated={!!user} roles={['admin']}>
              <CargarDatosEjemplo />
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




