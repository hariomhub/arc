// import React from 'react';
// import Section from '../components/Section';
// import Button from '../components/Button';
// import { Check } from 'lucide-react';

// const Membership = () => {
//     return (
//         <>
//             <Section style={{ background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
//                 <h1 style={{ color: 'white' }}>Council Membership</h1>
//                 <p style={{ fontSize: '1.25rem', color: '#E2E8F0', maxWidth: '600px', margin: '0 auto' }}>
//                     Join the leading community of AI risk professionals. Gain access to tools, research, and a global network.
//                 </p>
//             </Section>

//             <Section>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
//                     {/* Free Tier */}
//                     <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
//                         <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Associate</h3>
//                         <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '1rem 0' }}>Free</div>
//                         <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>For individuals interested in staying updated.</p>

//                         <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'auto' }}>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Public Research Access</li>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Monthly Newsletter</li>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Webinar Invites</li>
//                         </ul>

//                         <Button variant="secondary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>Join for Free</Button>
//                     </div>

//                     {/* Corporate Tier */}
//                     <div style={{ border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
//                         <div style={{ position: 'absolute', top: '0', right: '0', background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', fontSize: '0.8rem', fontWeight: '600', borderBottomLeftRadius: '8px' }}>RECOMMENDED</div>
//                         <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Executive Council</h3>
//                         <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '1rem 0' }}>$2,500<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/yr</span></div>
//                         <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Full access for organizations and risk leaders.</p>

//                         <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: 'auto' }}>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> <strong>All Audit Templates</strong> (XLS/Word)</li>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Policy Generator Tools</li>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Peer Benchmarking Data</li>
//                             <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={20} color="var(--primary)" /> Priority Certification Support</li>
//                         </ul>

//                         <Button variant="primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}>Apply for Membership</Button>
//                     </div>
//                 </div>
//             </Section>

//             <Section background="light">
//                 <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
//                     <h3>Already a member?</h3>
//                     <p style={{ margin: '1rem 0' }}>Sign in to access your dashboard and resources.</p>
//                     <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
//                         <div>
//                             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
//                             <input type="email" placeholder="name@company.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-medium)' }} />
//                         </div>
//                         <div>
//                             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
//                             <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-medium)' }} />
//                         </div>
//                         <Button variant="primary" style={{ justifyContent: 'center' }}>Sign In</Button>
//                     </form>
//                 </div>
//             </Section>
//         </>
//     );
// };

// export default Membership;
import React, { useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { Check, LogIn, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Membership = () => {
    const { login, register, isLoggedIn, user, isAdmin, isMember, logout } = useAuth();
    const navigate = useNavigate();

    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (authMode === 'login') {
                await login(form.email, form.password);
            } else {
                await register(form.name, form.email, form.password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const ROLE_INFO = {
        admin: { color: '#7C3AED', label: 'Administrator', desc: 'Full access to all resources, uploads, and user management.' },
        member: { color: '#003366', label: 'Member', desc: 'Access to all public and member-only resources.' },
        user: { color: '#64748B', label: 'User', desc: 'Access to public resources only.' },
    };

    const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.user;

    return (
        <>
            <Section style={{ background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
                <h1 style={{ color: 'white' }}>Council Membership</h1>
                <p style={{ fontSize: '1.25rem', color: '#E2E8F0', maxWidth: '600px', margin: '0 auto' }}>
                    Join the leading community of AI risk professionals. Gain access to tools, research, and a global network.
                </p>
            </Section>

            {/* If logged in: show account info */}
            {isLoggedIn ? (
                <Section>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        {/* Role Card */}
                        <div style={{
                            border: `2px solid ${roleInfo.color}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '2rem',
                            marginBottom: '2rem',
                            background: 'white',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%',
                                    background: roleInfo.color, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: '700'
                                }}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>{user?.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
                                </div>
                                <span style={{
                                    marginLeft: 'auto',
                                    background: roleInfo.color, color: 'white',
                                    padding: '0.3rem 0.85rem', borderRadius: '100px',
                                    fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {roleInfo.label}
                                </span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                {roleInfo.desc}
                            </p>
                        </div>

                        {/* Access Summary */}
                        <div style={{
                            background: 'var(--bg-light)', borderRadius: 'var(--radius-md)',
                            padding: '1.5rem', marginBottom: '2rem'
                        }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Your Access Level</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { label: 'Public Resources', allowed: true },
                                    { label: 'Member-Only Resources', allowed: isMember },
                                    { label: 'Upload Resources', allowed: isAdmin },
                                    { label: 'Edit & Delete Resources', allowed: isAdmin },
                                    { label: 'User Management', allowed: isAdmin },
                                ].map(({ label, allowed }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            background: allowed ? '#D1FAE5' : '#FEE2E2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <span style={{ fontSize: '0.7rem', color: allowed ? '#065F46' : '#991B1B' }}>
                                                {allowed ? '✓' : '✕'}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: allowed ? 'var(--text-main)' : 'var(--text-light)' }}>
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            style={{
                                width: '100%', padding: '0.85rem',
                                background: 'none', border: '1px solid #DC2626',
                                color: '#DC2626', borderRadius: 'var(--radius-sm)',
                                fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
                                fontFamily: 'var(--font-sans)'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </Section>
            ) : (
                <>
                    {/* Pricing Tiers */}
                    <Section>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto 3rem' }}>
                            {/* User */}
                            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Shield size={20} color="#64748B" />
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>User</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', margin: '1rem 0' }}>Free</div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>For individuals exploring AI governance.</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} color="var(--primary)" /> Public resources access</li>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} color="var(--primary)" /> Monthly newsletter</li>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.4 }}><Check size={16} /> Member-only content</li>
                                </ul>
                                <Button variant="secondary" onClick={() => setAuthMode('register')} style={{ width: '100%' }}>Create Account</Button>
                            </div>

                            {/* Member */}
                            <div style={{ border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', fontSize: '0.75rem', fontWeight: '600', borderBottomLeftRadius: '8px' }}>RECOMMENDED</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Shield size={20} color="var(--primary)" fill="var(--primary)" />
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>Member</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', margin: '1rem 0' }}>$2,500<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/yr</span></div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Full access for organizations and risk leaders.</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} color="var(--primary)" /> All audit templates</li>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} color="var(--primary)" /> Member-only resources</li>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><Check size={16} color="var(--primary)" /> Peer benchmarking data</li>
                                    <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.4 }}><Check size={16} /> Upload & manage resources</li>
                                </ul>
                                <Button variant="primary" onClick={() => setAuthMode('register')} style={{ width: '100%' }}>Apply for Membership</Button>
                            </div>
                        </div>
                    </Section>

                    {/* Auth Form */}
                    <Section background="light">
                        <div style={{ maxWidth: '460px', margin: '0 auto' }}>
                            {/* Tabs */}
                            <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '2rem', background: 'white' }}>
                                {[
                                    { mode: 'login', icon: <LogIn size={16} />, label: 'Sign In' },
                                    { mode: 'register', icon: <UserPlus size={16} />, label: 'Register' }
                                ].map(({ mode, icon, label }) => (
                                    <button
                                        key={mode}
                                        onClick={() => { setAuthMode(mode); setError(''); }}
                                        style={{
                                            flex: 1, padding: '0.85rem',
                                            background: authMode === mode ? 'var(--primary)' : 'transparent',
                                            color: authMode === mode ? 'white' : 'var(--text-secondary)',
                                            border: 'none', cursor: 'pointer',
                                            fontWeight: '600', fontSize: '0.9rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
                                        }}
                                    >
                                        {icon} {label}
                                    </button>
                                ))}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {authMode === 'register' && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Full Name</label>
                                        <input
                                            type="text" name="name" value={form.name}
                                            onChange={handleChange} required
                                            placeholder="Jane Smith"
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Email Address</label>
                                    <input
                                        type="email" name="email" value={form.email}
                                        onChange={handleChange} required
                                        placeholder="name@company.com"
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
                                    <input
                                        type="password" name="password" value={form.password}
                                        onChange={handleChange} required
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }}
                                    />
                                </div>

                                {error && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        background: '#FEF2F2', border: '1px solid #FECACA',
                                        borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                                        color: '#DC2626', fontSize: '0.875rem'
                                    }}>
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <Button
                                    variant="primary"
                                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}
                                    disabled={loading}
                                >
                                    {loading
                                        ? (authMode === 'login' ? 'Signing in...' : 'Creating account...')
                                        : (authMode === 'login' ? 'Sign In' : 'Create Account')
                                    }
                                </Button>
                            </form>
                        </div>
                    </Section>
                </>
            )}
        </>
    );
};

export default Membership;