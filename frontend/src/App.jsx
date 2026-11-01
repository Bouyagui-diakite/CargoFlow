import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import AWBList from './pages/awb/AWBList'
import AWBCreate from './pages/awb/AWBCreate'
import AWBDetail from './pages/awb/AWBDetail'
import AWBEdit from './pages/awb/AWBEdit'
import DGRList from './pages/dgr/DGRList'
import DGRCreate from './pages/dgr/DGRCreate'
import DGREdit from './pages/dgr/DGREdit'
import NOTOCView from './pages/dgr/NOTOCView'
import FlightList from './pages/flights/FlightList'
import FlightCreate from './pages/flights/FlightCreate'
import FlightDetail from './pages/flights/FlightDetail'
import UserList from './pages/users/UserList'
import ActivityLog from './pages/ActivityLog'
import Notifications from './pages/Notifications'
import DocumentList from './pages/documents/DocumentList'
import ImportList from './pages/import/ImportList'
import ExportList from './pages/export/ExportList'
import PaymentList from './pages/payments/PaymentList'
import AWBInvoice from './pages/awb/AWBInvoice'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children, adminOnly = false, permission = null }) {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !can('manage_users')) return <Navigate to="/awb" replace />
  if (permission && !can(permission)) return <Navigate to="/awb" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="awb" element={<AWBList />} />
        <Route path="awb/new" element={<AWBCreate />} />
        <Route path="awb/:id" element={<AWBDetail />} />
        <Route path="awb/:id/edit" element={<AWBEdit />} />
        <Route path="awb/:id/invoice" element={<AWBInvoice />} />
        <Route path="dgr" element={<DGRList />} />
        <Route path="dgr/new" element={<ProtectedRoute permission="create_dgr"><DGRCreate /></ProtectedRoute>} />
        <Route path="dgr/:id/edit" element={<DGREdit />} />
        <Route path="dgr/:id/notoc" element={<NOTOCView />} />
        <Route path="flights" element={<FlightList />} />
        <Route path="flights/new" element={<FlightCreate />} />
        <Route path="flights/:id" element={<FlightDetail />} />
        <Route path="import" element={<ImportList />} />
        <Route path="export" element={<ExportList />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="documents" element={<DocumentList />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="users" element={<ProtectedRoute adminOnly><UserList /></ProtectedRoute>} />
        <Route path="activity" element={<ProtectedRoute adminOnly><ActivityLog /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
