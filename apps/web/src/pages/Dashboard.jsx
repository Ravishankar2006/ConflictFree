import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from '../components/StudentDashboard';
import FacultyDashboard from '../components/FacultyDashboard';
import AdminDashboard from '../components/AdminDashboard';
import '../styles/theme.css';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  const getRoleBadgeClass = () => {
    return `role-badge role-${user?.role}`;
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h1 className="navbar-brand">⚡ Smart Timetable</h1>
        <div className="navbar-user">
          <span className="user-info">
            <strong>{user?.name}</strong>
            <span className={getRoleBadgeClass()}>{user?.role}</span>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        {renderDashboard()}
      </div>
    </div>
  );
}
