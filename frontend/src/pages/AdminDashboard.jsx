import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function AdminDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/complaints');
            setComplaints(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`/api/complaints/${id}/status`, { status });
            fetchComplaints();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredComplaints = filter === 'all'
        ? complaints
        : complaints.filter(c => c.status === filter);

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Hostel Maintenance Overview</p>
                </div>
                <button className="btn" onClick={logout} style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'white' }}>
                    Logout
                </button>
            </div>

            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <p>Total Complaints</p>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
                    <p>Pending Processing</p>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.resolved}</div>
                    <p>Resolved Issues</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>All Complaints</h2>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ width: '200px', margin: 0 }}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            <div className="grid">
                {filteredComplaints.map(c => (
                    <div key={c.id} className="glass-card complaint-card">
                        <div className="card-header">
                            <div>
                                <h3>{c.category}</h3>
                                <p style={{ fontSize: '0.875rem' }}>By: {c.student_name}</p>
                            </div>
                            <span className={`badge badge-${c.status}`}>{c.status}</span>
                        </div>
                        <p style={{ marginBottom: '1rem', flex: 1 }}>{c.description}</p>
                        <div className="card-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span className={`badge badge-${c.priority}`}>{c.priority} Priority</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {new Date(c.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="admin-controls" style={{ width: '100%' }}>
                                <select
                                    value={c.status}
                                    onChange={(e) => updateStatus(c.id, e.target.value)}
                                    style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                                >
                                    <option value="pending">Mark Pending</option>
                                    <option value="in-progress">Mark In-Progress</option>
                                    <option value="resolved">Mark Resolved</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredComplaints.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }} className="glass-card">
                        <p>No complaints found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
