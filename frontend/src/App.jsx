import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';

// Farmer pages
import MyAnimals from './pages/farmer/MyAnimals';
import AnimalDetail from './pages/farmer/AnimalDetail';
import MyMedicines from './pages/farmer/MyMedicines';

// Vet pages
import TreatmentRecords from './pages/vet/TreatmentRecords';
import NewTreatment from './pages/vet/NewTreatment';
import AllDiagnoses from './pages/vet/AllDiagnoses';

// Pharmacist pages
import MedicineInventory from './pages/pharmacist/MedicineInventory';
import SellMedicine from './pages/pharmacist/SellMedicine';
import SalesRecords from './pages/pharmacist/SalesRecords';

// Center pages
import CenterStakeholders from './pages/center/CenterStakeholders';
import FarmerCompliance from './pages/center/FarmerCompliance';

// Admin pages
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLocations from './pages/admin/AdminLocations';

// Inspector pages
import InspectorOverview from './pages/inspector/InspectorOverview';

// Shared
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Farmer */}
        <Route path="animals" element={<ProtectedRoute roles={['farmer','admin','inspector']}><MyAnimals /></ProtectedRoute>} />
        <Route path="animals/:id" element={<ProtectedRoute roles={['farmer','vet','admin','inspector','slaughterhouse','milk_center']}><AnimalDetail /></ProtectedRoute>} />
        <Route path="my-medicines" element={<ProtectedRoute roles={['farmer']}><MyMedicines /></ProtectedRoute>} />

        {/* Vet */}
        <Route path="treatments" element={<ProtectedRoute roles={['vet','farmer','admin','inspector']}><TreatmentRecords /></ProtectedRoute>} />
        <Route path="treatments/new" element={<ProtectedRoute roles={['vet']}><NewTreatment /></ProtectedRoute>} />
        <Route path="all-diagnoses" element={<ProtectedRoute roles={['vet','inspector','admin']}><AllDiagnoses /></ProtectedRoute>} />

        {/* Pharmacist */}
        <Route path="inventory" element={<ProtectedRoute roles={['pharmacist','admin','inspector']}><MedicineInventory /></ProtectedRoute>} />
        <Route path="sell-medicine" element={<ProtectedRoute roles={['pharmacist']}><SellMedicine /></ProtectedRoute>} />
        <Route path="sales" element={<ProtectedRoute roles={['pharmacist','admin','inspector']}><SalesRecords /></ProtectedRoute>} />

        {/* Center */}
        <Route path="stakeholders" element={<ProtectedRoute roles={['slaughterhouse','milk_center','admin']}><CenterStakeholders /></ProtectedRoute>} />
        <Route path="compliance/:farmerId" element={<ProtectedRoute roles={['slaughterhouse','milk_center','inspector','admin']}><FarmerCompliance /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/locations" element={<ProtectedRoute roles={['admin']}><AdminLocations /></ProtectedRoute>} />

        {/* Inspector */}
        <Route path="inspector" element={<ProtectedRoute roles={['inspector','admin']}><InspectorOverview /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
