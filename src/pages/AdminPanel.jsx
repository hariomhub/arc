import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, UserPlus, Users, Trash2, Edit2,
    CheckCircle, AlertCircle, Eye, EyeOff,
    Crown, User, ChevronDown, Search, RefreshCw,
    Ban, MoreVertical, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const ROLE_CONFIG = {
    admin:  { label: 'Admin',  bg: '#7C3AED', light: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
    member: { label: 'Member', bg: '#003366', light: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    user:   { label: 'User',   bg: '#475569', light: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

const Avatar = ({ name, role, size = 36 }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: cfg.bg, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.38, fontWeight: '800', flexShrink: 0,
        }}>
            {name?.charAt(0).toUpperCase() || '?'}
        </div>
    );
};

const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: cfg.light, color: cfg.text, border: `1px solid ${cfg.border}`,
            padding: '0.2rem 0.65rem', borderRadius: '100px',
            fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.bg }} />
            {cfg.label}
        </span>
    );
};

const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            background: toast.type === 'error' ? '#DC2626' : '#065F46',
            color: 'white', padding: '0.75rem 1.25rem',
            borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 600,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            animation: 'slideUp 0.2s ease',
        }}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
        </div>
    );
};

// ── Create User Form ──────────────────────────────────────────────────────────
const CreateUserTab = ({ token, onCreated }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = e => {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setError(''); setSuccess('');
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            setError('All fields are required.'); return;
        }
        setLoading(true); setError(''); setSuccess('');
        try {
            // Step 1: Register the user
            const regRes = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
            });
            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

            const newUserId = regData.user.id;

            // Step 2: If role is not 'user', promote via admin endpoint
            if (form.role !== 'user') {
                const roleRes = await fetch(`${API}/users/${newUserId}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ role: form.role })
                });
                if (!roleRes.ok) throw new Error('User created but role promotion failed. Check token.');
            }

            setSuccess(`✓ ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created for ${form.email}`);
            setForm({ name: '', email: '', password: '', role: 'user' });
            onCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
            {/* Form */}
            <div style={card}>
                <h3 style={cardTitle}>
                    <UserPlus size={18} color="var(--primary)" /> Create New Account
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                        <label style={labelSt}>Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange}
                            placeholder="John Doe" style={inputSt} />
                    </div>
                    <div>
                        <label style={labelSt}>Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            placeholder="user@organization.com" style={inputSt} />
                    </div>
                    <div>
                        <label style={labelSt}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input name="password" type={showPass ? 'text' : 'password'}
                                value={form.password} onChange={handleChange}
                                placeholder="Min. 8 characters"
                                style={{ ...inputSt, paddingRight: '3rem' }} />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={labelSt}>Assign Role</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                            {['user', 'member', 'admin'].map(r => {
                                const cfg = ROLE_CONFIG[r];
                                const selected = form.role === r;
                                return (
                                    <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))}
                                        style={{
                                            padding: '0.65rem', borderRadius: '8px', cursor: 'pointer',
                                            border: `2px solid ${selected ? cfg.bg : '#E2E8F0'}`,
                                            background: selected ? cfg.light : 'white',
                                            fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem'
                                        }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: selected ? cfg.bg : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {r === 'admin' ? <Crown size={13} color={selected ? 'white' : '#94A3B8'} /> :
                                             r === 'member' ? <Shield size={13} color={selected ? 'white' : '#94A3B8'} /> :
                                             <User size={13} color={selected ? 'white' : '#94A3B8'} />}
                                        </div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: selected ? cfg.text : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {cfg.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div style={errorBox}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={successBox}>
                            <CheckCircle size={14} /> {success}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        style={{ ...btnPrim, opacity: loading ? 0.75 : 1, marginTop: '0.25rem' }}>
                        {loading ? 'Creating...' : `Create ${ROLE_CONFIG[form.role].label} Account`}
                    </button>
                </form>
            </div>

            {/* Role info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ ...cardTitle, marginBottom: '0.25rem' }}>
                    <Shield size={18} color="var(--primary)" /> Role Permissions
                </h3>
                {[
                    { role: 'admin', permissions: ['Full resource management', 'Upload / Edit / Delete files', 'Create & manage users', 'Ban / promote users', 'View all member content'] },
                    { role: 'member', permissions: ['View all public resources', 'Access member-only content', 'Download all files', 'No management access'] },
                    { role: 'user', permissions: ['View public resources only', 'Download public files', 'No member content access'] },
                ].map(({ role, permissions }) => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                        <div key={role} style={{
                            background: 'white', border: `1px solid ${cfg.border}`,
                            borderLeft: `4px solid ${cfg.bg}`,
                            borderRadius: '8px', padding: '1rem 1.25rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                <RoleBadge role={role} />
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {permissions.map(p => (
                                    <li key={p} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', color: '#4A5568', alignItems: 'center' }}>
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.bg, flexShrink: 0 }} />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Manage Users Tab ─────────────────────────────────────────────────────────
const ManageUsersTab = ({ token, currentUserId, showToast }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [actionMenu, setActionMenu] = useState(null); // userId with open menu
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editRole, setEditRole] = useState(null); // { id, current }

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch { setUsers([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await fetch(`${API}/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast(`Role updated to ${newRole}`);
        } catch { showToast('Failed to update role', 'error'); }
        setEditRole(null);
        setActionMenu(null);
    };

    const handleBan = async (userId, isBanned) => {
        try {
            const res = await fetch(`${API}/users/${userId}/ban`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ is_banned: isBanned })
            });
            if (!res.ok) throw new Error();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: isBanned ? 1 : 0 } : u));
            showToast(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
        } catch { showToast('Failed to update ban status', 'error'); }
        setActionMenu(null);
    };

    const handleDelete = async (userId) => {
        try {
            const res = await fetch(`${API}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            setUsers(prev => prev.filter(u => u.id !== userId));
            showToast('User deleted');
        } catch { showToast('Failed to delete user', 'error'); }
        setDeleteConfirm(null);
    };

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const counts = { all: users.length, admin: 0, member: 0, user: 0 };
    users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        style={{ ...inputSt, paddingLeft: '2.25rem', margin: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['all', 'admin', 'member', 'user'].map(r => (
                        <button key={r} onClick={() => setFilterRole(r)}
                            style={{
                                padding: '0.45rem 0.85rem', borderRadius: '6px', cursor: 'pointer',
                                border: '1px solid',
                                borderColor: filterRole === r ? 'var(--primary)' : '#E2E8F0',
                                background: filterRole === r ? 'var(--primary)' : 'white',
                                color: filterRole === r ? 'white' : '#4A5568',
                                fontSize: '0.8rem', fontWeight: '600', fontFamily: 'var(--font-sans)',
                                transition: 'all 0.15s',
                            }}>
                            {r.charAt(0).toUpperCase() + r.slice(1)} ({counts[r] ?? 0})
                        </button>
                    ))}
                </div>
                <button onClick={fetchUsers} style={{ ...btnSec, padding: '0.45rem 0.75rem' }}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i}>
                                    {[...Array(6)].map((_, j) => (
                                        <td key={j} style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ height: '16px', background: '#F1F5F9', borderRadius: '4px', animation: 'shimmer 1.5s infinite' }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                                    No users found
                                </td>
                            </tr>
                        ) : filtered.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                {/* User */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <Avatar name={u.name} role={u.role} size={32} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F2444', whiteSpace: 'nowrap' }}>
                                            {u.name}
                                            {u.id === currentUserId && (
                                                <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', background: '#EFF6FF', color: '#1E40AF', padding: '0.1rem 0.4rem', borderRadius: '100px', fontWeight: '700' }}>You</span>
                                            )}
                                        </span>
                                    </div>
                                </td>
                                {/* Email */}
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {u.email}
                                </td>
                                {/* Role */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {editRole?.id === u.id ? (
                                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                            <select
                                                defaultValue={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                                style={{ ...inputSt, margin: 0, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                                                autoFocus
                                            >
                                                <option value="user">User</option>
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button onClick={() => setEditRole(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <RoleBadge role={u.role} />
                                    )}
                                </td>
                                {/* Status */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        fontSize: '0.72rem', fontWeight: '700',
                                        color: u.is_banned ? '#DC2626' : '#065F46',
                                        background: u.is_banned ? '#FEF2F2' : '#D1FAE5',
                                        padding: '0.2rem 0.6rem', borderRadius: '100px'
                                    }}>
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: u.is_banned ? '#DC2626' : '#10B981' }} />
                                        {u.is_banned ? 'Banned' : 'Active'}
                                    </span>
                                </td>
                                {/* Joined */}
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                {/* Actions */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {u.id !== currentUserId ? (
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                onClick={() => setEditRole({ id: u.id, current: u.role })}
                                                title="Change role"
                                                style={{ ...actionBtn, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleBan(u.id, !u.is_banned)}
                                                title={u.is_banned ? 'Unban user' : 'Ban user'}
                                                style={{ ...actionBtn, background: u.is_banned ? '#D1FAE5' : '#FEF3C7', color: u.is_banned ? '#065F46' : '#92400E', border: `1px solid ${u.is_banned ? '#6EE7B7' : '#FDE68A'}` }}>
                                                <Ban size={13} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(u.id)}
                                                title="Delete user"
                                                style={{ ...actionBtn, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete confirm dialog */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setDeleteConfirm(null)}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '380px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <Trash2 size={20} color="#DC2626" />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#0F2444' }}>Delete User?</h3>
                        <p style={{ margin: '0 0 1.5rem', color: '#64748B', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            This will permanently delete the user and all their data. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{ ...btnSec, flex: 1 }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrim, flex: 1, background: '#DC2626' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Admin Panel ─────────────────────────────────────────────────────────
const AdminPanel = () => {
    const { user, token, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('create');
    const [toast, setToast] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Redirect non-admins
    useEffect(() => {
        if (!loading && !isAdmin) navigate('/', { replace: true });
    }, [loading, isAdmin]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    if (loading || !isAdmin) return null;

    const tabs = [
        { id: 'create', label: 'Create User', icon: <UserPlus size={16} /> },
        { id: 'manage', label: 'Manage Users', icon: <Users size={16} /> },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: 'var(--font-sans)' }}>
            {/* Header bar */}
            <div style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003366 100%)', color: 'white', padding: '2rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Crown size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'white', fontFamily: 'var(--font-serif)' }}>Admin Panel</h1>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                                Signed in as <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.name}</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '0' }}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '1rem 1.5rem', background: 'none', border: 'none',
                                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                    fontSize: '0.875rem', fontWeight: '600',
                                    color: activeTab === tab.id ? 'var(--primary)' : '#64748B',
                                    borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                                    transition: 'all 0.15s',
                                }}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                {activeTab === 'create' && (
                    <CreateUserTab
                        token={token}
                        onCreated={() => { setRefreshKey(k => k + 1); showToast('User created successfully!'); }}
                    />
                )}
                {activeTab === 'manage' && (
                    <ManageUsersTab
                        key={refreshKey}
                        token={token}
                        currentUserId={user?.id}
                        showToast={showToast}
                    />
                )}
            </div>

            <Toast toast={toast} />

            <style>{`
                @keyframes shimmer {
                    0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// Shared micro styles
const card = {
    background: 'white', border: '1px solid #E2E8F0',
    borderRadius: '10px', padding: '1.75rem',
    boxShadow: '0 2px 8px rgba(0,51,102,0.06)',
};
const cardTitle = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: '700', color: '#0F2444',
};
const labelSt = { display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: '600', color: '#1A202C' };
const inputSt = {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1px solid #CBD5E0', borderRadius: '6px',
    fontSize: '0.875rem', color: '#1A202C',
    fontFamily: 'var(--font-sans)', background: '#FAFBFC',
    boxSizing: 'border-box', outline: 'none',
};
const btnPrim = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    padding: '0.75rem 1.25rem', background: 'var(--primary)', color: 'white',
    border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
};
const btnSec = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    padding: '0.75rem 1.25rem', background: 'white', color: '#4A5568',
    border: '1px solid #E2E8F0', borderRadius: '6px', fontWeight: '600',
    fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
};
const actionBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
};
const errorBox = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: '6px', padding: '0.65rem 0.9rem',
    color: '#DC2626', fontSize: '0.82rem',
};
const successBox = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#D1FAE5', border: '1px solid #6EE7B7',
    borderRadius: '6px', padding: '0.65rem 0.9rem',
    color: '#065F46', fontSize: '0.82rem',
};

export default AdminPanel;