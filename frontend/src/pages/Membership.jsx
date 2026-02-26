import React, { useState, useRef, useEffect } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { Check, LogIn, UserPlus, Shield, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Password strength utility ────────────────────────────────────────────────
const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '#E2E8F0' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '', color: '#E2E8F0' },
        { label: 'Weak', color: '#EF4444' },
        { label: 'Fair', color: '#F59E0B' },
        { label: 'Good', color: '#3B82F6' },
        { label: 'Strong', color: '#10B981' },
    ];
    return { score, ...map[score] };
};

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, required = true, hint, error, rightElement }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
                {label}{required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
            </label>
            {hint && <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{hint}</span>}
        </div>
        <div style={{ position: 'relative' }}>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '0.75rem', paddingRight: rightElement ? '2.75rem' : '0.75rem',
                    border: `1.5px solid ${error ? '#FCA5A5' : '#CBD5E1'}`,
                    borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box',
                    fontFamily: 'var(--font-sans)', outline: 'none',
                    background: error ? '#FFF5F5' : 'white',
                    transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = error ? '#EF4444' : '#003366'}
                onBlur={e => e.target.style.borderColor = error ? '#FCA5A5' : '#CBD5E1'}
            />
            {rightElement && (
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8' }}>
                    {rightElement}
                </span>
            )}
        </div>
        {error && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {error}</p>}
    </div>
);

// ─── Membership Page ──────────────────────────────────────────────────────────
const Membership = () => {
    const { login, register, isLoggedIn, user, isAdmin, isMember, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [authMode, setAuthMode] = useState(location.state?.mode || 'login');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        // FIX: field name is organization_name (matches AuthContext + backend), not 'organisation'
        organization_name: '',
        role: 'user', // user | university | company
        gst: '', pan: '', incorporation_number: '', phone: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const authSectionRef = useRef(null);
    const pwStrength = getPasswordStrength(form.password);

    useEffect(() => {
        if (location.state?.mode) {
            setTimeout(() => authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, []);

    const scrollToAuth = (mode) => {
        setAuthMode(mode);
        setTimeout(() => authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
        setGlobalError('');
    };

    const validate = () => {
        const errors = {};
        if (authMode === 'register') {
            if (!form.name.trim() || form.name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
            if (!form.organization_name.trim()) errors.organization_name = 'Organisation / affiliation is required.';
            if (form.role === 'company') {
                if (!form.gst.trim()) errors.gst = 'GST Number is required.';
                if (!form.pan.trim()) errors.pan = 'PAN is required.';
                if (!form.incorporation_number.trim()) errors.incorporation_number = 'Incorporation Number is required.';
                if (!form.phone.trim()) errors.phone = 'Phone number is required.';
            }
            if (form.role === 'university') {
                if (!form.phone.trim()) errors.phone = 'Phone number is required.';
            }
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Please enter a valid email address.';
        if (!form.password) {
            errors.password = 'Password is required.';
        } else if (authMode === 'register' && form.password.length < 8) {
            errors.password = 'Password must be at least 8 characters.';
        }
        if (authMode === 'register' && form.password !== form.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError('');
        setSuccess('');
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setLoading(true);
        try {
            if (authMode === 'login') {
                await login(form.email, form.password);
                navigate('/');
            } else {
                // FIX: pass form.organization_name (was incorrectly form.organisation before)
                await register(
                    form.name, form.email, form.password, form.role,
                    form.organization_name, form.gst, form.pan,
                    form.incorporation_number, form.phone
                );
                setSuccess('Account created successfully! Welcome to the AI Risk Council.');
                setTimeout(() => navigate('/'), 1800);
            }
        } catch (err) {
            setGlobalError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const ROLE_INFO = {
        admin:      { color: '#7C3AED', label: 'Administrator',    desc: 'Full access to all resources, uploads, and user management.' },
        executive:  { color: '#7C3AED', label: 'Executive Member', desc: 'Secondary admin access to all council resources and management tools.' },
        member:     { color: '#003366', label: 'Member',           desc: 'Access to all public and member-only resources, templates, and community.' },
        university: { color: '#0369A1', label: 'University',       desc: 'University / educational institution account with member-level access.' },
        company:    { color: '#059669', label: 'Company',          desc: 'Corporate account with member-level access and company profile.' },
        user:       { color: '#64748B', label: 'User',             desc: 'Access to public resources only.' },
    };
    const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.user;

    return (
        <>
            {/* Hero */}
            <Section style={{ background: 'linear-gradient(135deg, #002244 0%, #003366 60%, #005599 100%)', color: 'white', textAlign: 'center', padding: '4rem 2rem' }}>
                <h1 style={{ color: 'white', marginBottom: '0.9rem', fontSize: '2.5rem' }}>Council Membership</h1>
                <p style={{ fontSize: '1.15rem', color: '#CBD5E1', maxWidth: '580px', margin: '0 auto', lineHeight: '1.7' }}>
                    Join the leading community of AI risk professionals. Gain access to governance tools, audit templates, research, and a global peer network.
                </p>
            </Section>

            {isLoggedIn ? (
                /* ── Logged-in account view ─────────────────────────────── */
                <Section>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ border: `2px solid ${roleInfo.color}`, borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: roleInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: '700' }}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B' }}>{user?.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>{user?.email}</p>
                                </div>
                                <span style={{ background: roleInfo.color, color: 'white', padding: '0.3rem 0.85rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {roleInfo.label}
                                </span>
                            </div>
                            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>{roleInfo.desc}</p>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#003366', marginBottom: '1rem', fontSize: '0.95rem' }}>Your Access Level</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {[
                                    { label: 'Public Resources & News', allowed: true },
                                    { label: 'Events & Webinar Access', allowed: true },
                                    { label: 'Member-Only Audit Templates', allowed: isMember },
                                    { label: 'Community Q&A Full Access', allowed: true },
                                    { label: 'Event Priority Registration', allowed: isMember },
                                ].map(({ label, allowed }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        {allowed
                                            ? <CheckCircle2 size={17} color="#10B981" />
                                            : <XCircle size={17} color="#CBD5E1" />}
                                        <span style={{ fontSize: '0.9rem', color: allowed ? '#1E293B' : '#94A3B8' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={logout} style={{ width: '100%', padding: '0.85rem', background: 'none', border: '1.5px solid #EF4444', color: '#EF4444', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
                        >
                            Sign Out
                        </button>
                    </div>
                </Section>
            ) : (
                <>
                    {/* ── Pricing cards ─────────────────────────────────── */}
                    <Section>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <h2 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>Choose Your Plan</h2>
                            <p style={{ color: '#64748B', fontSize: '1rem' }}>Start free or unlock full council access for just $1/year.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '820px', margin: '0 auto 1rem' }}>
                            {/* Free */}
                            <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '2rem', background: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Shield size={20} color="#64748B" />
                                    <h3 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>User</h3>
                                </div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '800', margin: '1rem 0', color: '#1E293B' }}>Free</div>
                                <p style={{ color: '#64748B', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: '1.6' }}>For individuals exploring AI governance content and community resources.</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem', padding: 0 }}>
                                    {['Public resources & news', 'Events calendar access', 'Monthly newsletter'].map(f => (
                                        <li key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#475569' }}><Check size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />{f}</li>
                                    ))}
                                    {['Audit templates', 'Member-only research'].map(f => (
                                        <li key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#CBD5E1' }}><Check size={16} color="#CBD5E1" style={{ flexShrink: 0, marginTop: '1px' }} />{f}</li>
                                    ))}
                                </ul>
                                <Button variant="secondary" onClick={() => scrollToAuth('register')} style={{ width: '100%' }}>Create Free Account</Button>
                            </div>

                            {/* Member */}
                            <div style={{ border: '2px solid #003366', borderRadius: '14px', padding: '2rem', background: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,51,102,0.12)' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, background: '#003366', color: 'white', padding: '0.3rem 1.1rem', fontSize: '0.7rem', fontWeight: '700', borderBottomLeftRadius: '10px', letterSpacing: '0.05em' }}>RECOMMENDED</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Shield size={20} color="#003366" fill="#003366" />
                                    <h3 style={{ fontSize: '1.2rem', color: '#003366', margin: 0 }}>Member</h3>
                                </div>
                                <div style={{ margin: '1rem 0' }}>
                                    <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#003366' }}>$1</span>
                                    <span style={{ fontSize: '1rem', fontWeight: '400', color: '#64748B' }}> / year</span>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Billed annually · Cancel anytime</p>
                                </div>
                                <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: '1.6' }}>Full council access for risk professionals, compliance leaders, and AI governance practitioners.</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem', padding: 0 }}>
                                    {[
                                        'Everything in User plan',
                                        'All audit templates (6 templates)',
                                        'Member-only research & whitepapers',
                                        'Event priority registration',
                                        'Peer benchmarking data',
                                        'Community Q&A full access',
                                    ].map(f => (
                                        <li key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#475569' }}><Check size={16} color="#003366" style={{ flexShrink: 0, marginTop: '1px' }} />{f}</li>
                                    ))}
                                </ul>
                                <Button variant="primary" onClick={() => scrollToAuth('register')} style={{ width: '100%' }}>Join for $1 / Year</Button>
                            </div>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94A3B8', marginTop: '1rem' }}>
                            🔒 Secure sign-up. No credit card required for the free plan.
                        </p>
                    </Section>

                    {/* ── Auth form ─────────────────────────────────────── */}
                    <div ref={authSectionRef}>
                        <Section background="light">
                            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                                <h2 style={{ textAlign: 'center', color: '#1E293B', marginBottom: '0.4rem', fontSize: '1.6rem' }}>
                                    {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                                </h2>
                                <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                                    {authMode === 'login' ? 'Sign in to access your council resources.' : 'Join the AI Risk Council community in seconds.'}
                                </p>

                                {/* Tab switcher */}
                                <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: '10px', padding: '3px', gap: '2px', marginBottom: '1.75rem' }}>
                                    {[
                                        { mode: 'login', icon: <LogIn size={15} />, label: 'Sign In' },
                                        { mode: 'register', icon: <UserPlus size={15} />, label: 'Register' },
                                    ].map(({ mode, icon, label }) => (
                                        <button key={mode} onClick={() => { setAuthMode(mode); setFieldErrors({}); setGlobalError(''); setSuccess(''); }} style={{
                                            flex: 1, padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                            background: authMode === mode ? 'white' : 'transparent',
                                            color: authMode === mode ? '#003366' : '#64748B',
                                            border: 'none', cursor: 'pointer', borderRadius: '8px',
                                            fontWeight: '700', fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
                                            boxShadow: authMode === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                                            transition: 'all 0.15s',
                                        }}>
                                            {icon} {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Global success */}
                                {success && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.85rem 1rem', color: '#15803D', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                                        <CheckCircle2 size={18} /> {success}
                                    </div>
                                )}

                                {/* Global error */}
                                {globalError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', color: '#DC2626', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                                        <AlertCircle size={18} /> {globalError}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} noValidate>
                                    {authMode === 'register' && (
                                        <>
                                            <div style={{ marginBottom: '0.8rem' }}>
                                                <label style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
                                                    Account Type
                                                </label>
                                                <select
                                                    name="role"
                                                    value={form.role}
                                                    onChange={handleChange}
                                                    style={{
                                                        width: '100%', padding: '0.75rem', border: '1.5px solid #CBD5E1',
                                                        borderRadius: '8px', fontSize: '0.92rem', boxSizing: 'border-box',
                                                        fontFamily: 'var(--font-sans)', outline: 'none', background: 'white',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="user">Standard User / Individual</option>
                                                    <option value="university">University / Educational Institution</option>
                                                    <option value="company">Corporate / Product Company</option>
                                                </select>
                                            </div>

                                            <InputField
                                                label="Full Name" name="name" value={form.name}
                                                onChange={handleChange} placeholder="Jane Smith"
                                                error={fieldErrors.name}
                                            />

                                            {/* FIX: name="organization_name" (was "organisation") */}
                                            <InputField
                                                label={
                                                    form.role === 'university' ? 'University Name' :
                                                    form.role === 'company'    ? 'Company Name' :
                                                    'Organisation / Affiliation'
                                                }
                                                name="organization_name"
                                                value={form.organization_name}
                                                onChange={handleChange}
                                                placeholder={form.role === 'company' ? 'Acme Corp' : form.role === 'university' ? 'Harvard University' : 'Organisation Name'}
                                                error={fieldErrors.organization_name}
                                            />

                                            {/* Phone for university too */}
                                            {(form.role === 'university' || form.role === 'company') && (
                                                <InputField
                                                    label="Phone Number" name="phone" value={form.phone} type="tel"
                                                    onChange={handleChange} placeholder="+91 98765 43210"
                                                    error={fieldErrors.phone}
                                                />
                                            )}

                                            {form.role === 'company' && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <InputField
                                                        label="GST Number" name="gst" value={form.gst}
                                                        onChange={handleChange} placeholder="22AAAAA0000A1Z5"
                                                        error={fieldErrors.gst}
                                                    />
                                                    <InputField
                                                        label="PAN" name="pan" value={form.pan}
                                                        onChange={handleChange} placeholder="AAAAA0000A"
                                                        error={fieldErrors.pan}
                                                    />
                                                    <InputField
                                                        label="Incorporation No." name="incorporation_number" value={form.incorporation_number}
                                                        onChange={handleChange} placeholder="U12345SK2000PTC123456"
                                                        error={fieldErrors.incorporation_number}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <InputField
                                        label="Email Address" type="email" name="email" value={form.email}
                                        onChange={handleChange} placeholder="name@company.com"
                                        error={fieldErrors.email}
                                    />

                                    <InputField
                                        label="Password" type={showPw ? 'text' : 'password'} name="password"
                                        value={form.password} onChange={handleChange}
                                        placeholder={authMode === 'register' ? 'Min. 8 characters' : '••••••••'}
                                        hint={authMode === 'register' ? 'Min. 8 chars, include a number & symbol' : ''}
                                        error={fieldErrors.password}
                                        rightElement={
                                            <span onClick={() => setShowPw(!showPw)}>
                                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </span>
                                        }
                                    />

                                    {/* Password strength bar */}
                                    {authMode === 'register' && form.password && (
                                        <div style={{ marginTop: '-0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= pwStrength.score ? pwStrength.color : '#E2E8F0', transition: 'background 0.2s' }} />
                                                ))}
                                            </div>
                                            {pwStrength.label && <p style={{ margin: 0, fontSize: '0.72rem', color: pwStrength.color, fontWeight: '600' }}>{pwStrength.label} password</p>}
                                        </div>
                                    )}

                                    {authMode === 'register' && (
                                        <InputField
                                            label="Confirm Password" type={showConfirm ? 'text' : 'password'}
                                            name="confirmPassword" value={form.confirmPassword}
                                            onChange={handleChange} placeholder="Re-enter password"
                                            error={fieldErrors.confirmPassword}
                                            rightElement={
                                                <span onClick={() => setShowConfirm(!showConfirm)}>
                                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </span>
                                            }
                                        />
                                    )}

                                    {authMode === 'register' && (
                                        <p style={{ fontSize: '0.775rem', color: '#94A3B8', margin: '0', lineHeight: '1.55' }}>
                                            By creating an account you agree to our{' '}
                                            <a href="#" style={{ color: '#003366', fontWeight: '600' }}>Terms of Service</a> and{' '}
                                            <a href="#" style={{ color: '#003366', fontWeight: '600' }}>Privacy Policy</a>.
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: '100%', padding: '0.9rem', background: loading ? '#94A3B8' : '#003366',
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            fontWeight: '700', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'var(--font-sans)', transition: 'background 0.15s', marginTop: '0.25rem',
                                        }}
                                        onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#00509E'; }}
                                        onMouseOut={e => { if (!loading) e.currentTarget.style.background = loading ? '#94A3B8' : '#003366'; }}
                                    >
                                        {loading
                                            ? (authMode === 'login' ? 'Signing in…' : 'Creating account…')
                                            : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                                    </button>

                                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                                        {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                        <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setFieldErrors({}); setGlobalError(''); }}
                                            style={{ background: 'none', border: 'none', color: '#003366', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', padding: 0 }}>
                                            {authMode === 'login' ? 'Register' : 'Sign In'}
                                        </button>
                                    </p>
                                </form>
                            </div>
                        </Section>
                    </div>
                </>
            )}
        </>
    );
};

export default Membership;