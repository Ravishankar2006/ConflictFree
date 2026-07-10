import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StudentDashboard from '../components/StudentDashboard';
import FacultyDashboard from '../components/FacultyDashboard';
import AdminDashboard from '../components/AdminDashboard';
import '../styles/theme.css';
import '../styles/Dashboard.css';

function DashboardContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('timetable');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close on mobile after selection
  };

  const renderContent = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      default:
        return <div className="role-error">Unknown role. Please contact support.</div>;
    }
  };

  return (
    <div className="app-shell">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <Sidebar
        open={sidebarOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="app-main app-main-with-sidebar">
        {renderContent()}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
