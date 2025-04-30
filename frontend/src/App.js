import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Navbar from './components/Shared/Navbar';
import LoadingSpinner from './components/Shared/LoadingSpinner';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const AddWorkout = lazy(() => import('./components/Workouts/AddWorkout'));
const WorkoutList = lazy(() => import('./components/Workouts/WorkoutList'));

// Route Protectors
const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AuthRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Auth Routes (Only for non-authenticated users) */}
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes (Requires authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts/add" element={<AddWorkout />} />
            <Route path="/workouts" element={<WorkoutList />} />
          </Route>

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div className="p-8 text-center">404 - Page Not Found</div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
