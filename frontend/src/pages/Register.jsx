import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const { user, register } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password, role);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center' }}>Create Account</h2>
                <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Join HostelOps today</p>
                {error && <div className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="student@college.edu"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Account Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)}>
                            <option value="student">Student</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Create Account</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
