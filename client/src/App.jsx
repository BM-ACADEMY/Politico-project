// src/App.jsx
import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { rootAdminRoutes } from './modules/Common/routes/RootAdminRoutes';
import { adminRoutes } from './modules/Common/routes/AdminRoutes';
import { volunteerRoutes } from './modules/Common/routes/VolunteerRoutes';
import { candidateRoutes } from './modules/Common/routes/CandidateRoutes';
import Login from './modules/Common/Auth/Login';
import { AuthProvider } from './modules/Common/context/AuthContext';
import Page from './modules/Common/Pages/main-dashboard/Page';
import PrivateRoute from './modules/Common/context/PrivateRoute';
// import { AuthProvider } from '@/context/AuthContext';
// import PrivateRoute from '@/context/PrivateRoute';
// import LoginPage from '@/Modules/Auth/Login';
// import { rootAdminRoutes } from '@/routes/RootAdminRoutes';
// import { adminRoutes } from '@/routes/AdminRoutes';
// import { candidateRoutes } from '@/routes/CandidateRoutes';
// import { volunteerRoutes } from '@/routes/VolunteerRoutes';
// import Page from './Modules/Pages/main-dashboard/Page';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PrivateRoute allowedRole="public"><Login /></PrivateRoute>} />
        <Route path="/" element={<PrivateRoute allowedRole="public"><Login /></PrivateRoute>} />

        {/* Protected Routes */}
        <Route element={<Page />}>
          {rootAdminRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {adminRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {candidateRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {volunteerRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;