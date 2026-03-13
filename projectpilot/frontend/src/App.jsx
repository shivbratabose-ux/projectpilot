import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import Partners from './pages/Partners';
import { Issues, GTM, JV, Marketing, AuditLog, Settings } from './pages/OtherPages';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/portfolio"    element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<ProjectDetail />} />
        <Route path="/partners"     element={<Partners />} />
        <Route path="/gtm"          element={<GTM />} />
        <Route path="/marketing"    element={<Marketing />} />
        <Route path="/issues"       element={<Issues />} />
        <Route path="/jv"           element={<JV />} />
        <Route path="/audit"        element={<AuditLog />} />
        <Route path="/settings"     element={<Settings />} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
