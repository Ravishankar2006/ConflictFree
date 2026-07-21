import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getAnalyticsOverview,
  getFacultyWorkload,
  getRoomUtilization,
  getDailyDistribution,
  getTimeDistribution,
} from '../services/api';
import './AnalyticsTab.css';

const COLORS = ['#38bdf8', '#34d399', '#c084fc', '#fb923c', '#fb7185', '#a7f3d0'];

export default function AnalyticsTab({ toast }) {
  const [overview, setOverview]       = useState(null);
  const [workload, setWorkload]       = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [daily, setDaily]             = useState([]);
  const [timeSlots, setTimeSlots]     = useState([]);
  const [loading, setLoading]         = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, wlRes, utRes, dlRes, tsRes] = await Promise.all([
        getAnalyticsOverview(),
        getFacultyWorkload(),
        getRoomUtilization(),
        getDailyDistribution(),
        getTimeDistribution(),
      ]);
      setOverview(ovRes.data);
      setWorkload(wlRes.data);
      setUtilization(utRes.data);
      setDaily(dlRes.data);
      setTimeSlots(tsRes.data);
    } catch (err) {
      toast('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="loading" />;

  // Custom tooltips for dark theme charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((p, index) => (
            <p key={index} style={{ color: p.color || p.fill }}>
              {p.name}: <strong>{p.value}</strong>
              {p.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <h2 className="tab-title">📊 Timetable Analytics</h2>
        <button className="btn-ghost" onClick={loadData}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      {overview && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-value">{overview.totalSlots}</div>
            <div className="stat-label">Total Slots</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{overview.totalCourses}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-value">{overview.totalFaculty}</div>
            <div className="stat-label">Total Faculty</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-value">{overview.totalRooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
          <div className="stat-card" style={{ '--stat-color': 'var(--accent-blue, #38bdf8)' }}>
            <div className="stat-value">{overview.utilization}%</div>
            <div className="stat-label">Room Utilization</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Daily Distribution Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">📅 Sessions by Day of Week</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Slots Assigned" radius={[4, 4, 0, 0]}>
                  {daily.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time-Slot Distribution Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">⏰ Schedule Time Distribution</h3>
          <div className="chart-container pie-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={timeSlots}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="period"
                >
                  {timeSlots.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Utilization Horizontal Bar Chart */}
        <div className="chart-card full-width">
          <h3 className="chart-title">🏛️ Room Utilization & Booking Hours</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={utilization} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#64748b" tickLine={false} unit="%" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="utilization" name="Utilization Rate" fill="#38bdf8" radius={[0, 4, 4, 0]} unit="%" />
                <Bar dataKey="bookedHours" name="Booked Hours" fill="#c084fc" radius={[0, 4, 4, 0]} unit=" hrs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Workload List / Table */}
        <div className="chart-card full-width">
          <h3 className="chart-title">👨‍🏫 Faculty Workload Distribution</h3>
          <div className="faculty-workload-table">
            <div className="table-container" style={{ marginTop: 0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Email</th>
                      <th>Slots Booked</th>
                      <th>Total Teaching Hours</th>
                      <th>Workload Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workload.map((f, i) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</td>
                        <td>{f.email}</td>
                        <td>
                          <span className="course-code-badge" style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.2)' }}>
                            {f.slotCount} sessions
                          </span>
                        </td>
                        <td><strong>{f.totalHours} hrs</strong></td>
                        <td style={{ minWidth: 160 }}>
                          <div className="workload-bar-wrapper">
                            <div
                              className="workload-bar-fill"
                              style={{
                                width: `${Math.min((f.totalHours / 16) * 100, 100)}%`,
                                background: f.totalHours > 12 ? 'var(--accent-orange, #fb923c)' : 'var(--accent-blue, #38bdf8)',
                              }}
                            />
                            <span className="workload-bar-label">
                              {f.totalHours > 12 ? '⚠️ High' : '✅ Balanced'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {workload.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>No faculty records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
