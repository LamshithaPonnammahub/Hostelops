import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ category: 'Electrical', description: '', priority: 'low' });

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/complaints/me');
            setComplaints(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/complaints', formData);
            setShowForm(false);
            setFormData({ category: 'Electrical', description: '', priority: 'low' });
            fetchComplaints();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, {user?.name}</p>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginRight: '1rem' }}>
                        {showForm ? 'Cancel' : 'New Complaint'}
                    </button>
                    <button className="btn" onClick={logout} style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'white' }}>
                        Logout
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <h2>Submit a Complaint</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Electrical">Electrical</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Carpentry">Carpentry</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="IT/Network">IT/Network</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Priority</label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the issue in detail..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Submit Complaint</button>
                    </form>
                </div>
            )}

            <h2>My Complaints</h2>
            {complaints.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>You haven't submitted any complaints yet.</p>
                </div>
            ) : (
                <div className="grid">
                    {complaints.map(c => (
                        <div key={c.id} className="glass-card complaint-card">
                            <div className="card-header">
                                <h3>{c.category}</h3>
                                <span className={`badge badge-${c.status}`}>{c.status}</span>
                            </div>
                            <p style={{ marginBottom: '1rem', flex: 1 }}>{c.description}</p>
                            <div className="card-footer">
                                <span className={`badge badge-${c.priority}`}>{c.priority} Priority</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {new Date(c.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
