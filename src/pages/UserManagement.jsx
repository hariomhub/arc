import React, { useState, useEffect } from 'react';
import Section from '../components/Section';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Shield, UserPlus, Trash2, ChevronDown, Ban, CheckCircle,
    AlertCircle, X, Search, Users, Crown, User
} from 'lucide-react';

const ROLE_STYLES = {
    admin: { bg: '#7C3AED', label: 'Admin', icon: <Crown size={12} /> },
    member: { bg: '#003366', label: 'Member', icon: <Shield size={12} /> },
    user: { bg: '#64748B', label: 'User', icon: <User size={12} /> },
};

const Badge = ({ role }) => {
    const s = ROLE_STYLES[role] || ROLE_STYLES.user;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: s.bg, color: 'white',
            padding: '0.2rem 0.6rem', borderRadius: '100px',
            fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            {s.icon} {s.label}
        </span>
    );
};

const Toast = ({ message, type, onClose }) => (
    <div style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999,
        background: type === 'error' ? '#FEF2F2' : '#F0FDF4',
        border: `1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'}`,
        color: type === 'error' ? '#DC2626' : '#15803D',
        padding: '0.85rem 1.25rem', borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontSize: '0.875rem', fontWeight: '500', maxWidth: '360px',
        animation: 'slideUp 0.25s ease'
    }}>
        {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
        {message}
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
        </button>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
);

const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, padding: '1rem'
    }} onClick={onClose}>
        <div style={{
            background: 'white', borderRadius: '16px', padding: '2rem',
            width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease'
        }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={20} />
                </button>
            </div>
            {children}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>
);

const inputStyle = {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1px solid var(--border-medium)', borderRadius: '8px',
    fontSize: '0.9rem', boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', outline: 'none'
};

const UserManagement = () => {
    const { authFetch, API, user: currentUser, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // user to delete
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        if (!isAdmin) { navigate('/'); return; }
        fetchUsers();
    }, [isAdmin]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API}/admin/users`);
            const data = await res.json();
            if (res.ok) setUsers(data);
            else showToast(data.error || 'Failed to load users', 'error');
        } catch {
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await authFetch(`${API}/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                showToast(`Role updated to ${newRole}`);
            } else {
                showToast(data.error, 'error');
            }
        } catch {
            showToast('Failed to update role', 'error');
        }
    };

    const handleBanToggle = async (userId, currentBanned) => {
        try {
            const res = await authFetch(`${API}/admin/users/${userId}/ban`, {
                method: 'PATCH',
                body: JSON.stringify({ is_banned: !currentBanned })
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanned } : u));
                showToast(`User ${!currentBanned ? 'banned' : 'unbanned'} successfully`);
            } else {
                showToast(data.error, 'error');
            }
        } catch {
            showToast('Failed to update ban status', 'error');
        }
    };

    const handleDelete = async (userId) => {
        try {
            const res = await authFetch(`${API}/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                showToast('User deleted successfully');
            } else {
                showToast(data.error, 'error');
            }
        } catch {
            showToast('Failed to delete user', 'error');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const res = await authFetch(`${API}/admin/users`, {
                method: 'POST',
                body: JSON.stringify(createForm)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`${createForm.role} account created for ${createForm.name}`);
                setShowCreateModal(false);
                setCreateForm({ name: '', email: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                showToast(data.error, 'error');
            }
        } catch {
            showToast('Failed to create user', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        members: users.filter(u => u.role === 'member').length,
        banned: users.filter(u => u.is_banned).length,
    };

    return (
        <>
            {/* Header */}
            <Section style={{ background: 'var(--primary)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <Users size={28} color="white" />
                            <h1 style={{ color: 'white', margin: 0 }}>User Management</h1>
                        </div>
                        <p style={{ color: '#CBD5E1', margin: 0 }}>Manage roles, access, and accounts across the council.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'white', color: 'var(--primary)',
                            border: 'none', borderRadius: '8px',
                            padding: '0.7rem 1.25rem', fontWeight: '700',
                            fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)'
                        }}
                    >
                        <UserPlus size={16} /> Create User
                    </button>
                </div>
            </Section>

            <Section>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Users', value: stats.total, color: '#003366' },
                        { label: 'Admins', value: stats.admins, color: '#7C3AED' },
                        { label: 'Members', value: stats.members, color: '#0369A1' },
                        { label: 'Banned', value: stats.banned, color: '#DC2626' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            background: 'white', border: '1px solid var(--border-light)',
                            borderRadius: '12px', padding: '1.25rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                    />
                </div>

                {/* Table */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-light)' }}>
                                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => {
                                    const isSelf = u.id === currentUser?.id;
                                    return (
                                        <tr key={u.id} style={{
                                            borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            background: u.is_banned ? '#FFF7F7' : 'white',
                                            transition: 'background 0.15s'
                                        }}>
                                            {/* User */}
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                                        background: ROLE_STYLES[u.role]?.bg || '#64748B',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontSize: '0.85rem', fontWeight: '700'
                                                    }}>
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                            {u.name} {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '400' }}>(you)</span>}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role selector */}
                                            <td style={{ padding: '1rem' }}>
                                                {isSelf ? (
                                                    <Badge role={u.role} />
                                                ) : (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <select
                                                            value={u.role}
                                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                                            style={{
                                                                appearance: 'none', padding: '0.3rem 1.8rem 0.3rem 0.7rem',
                                                                borderRadius: '100px', border: `1.5px solid ${ROLE_STYLES[u.role]?.bg}`,
                                                                background: 'white', color: ROLE_STYLES[u.role]?.bg,
                                                                fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                fontFamily: 'var(--font-sans)'
                                                            }}
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="member">Member</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <ChevronDown size={10} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: ROLE_STYLES[u.role]?.bg }} />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                    padding: '0.2rem 0.65rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '600',
                                                    background: u.is_banned ? '#FEE2E2' : '#D1FAE5',
                                                    color: u.is_banned ? '#DC2626' : '#065F46'
                                                }}>
                                                    {u.is_banned ? <Ban size={11} /> : <CheckCircle size={11} />}
                                                    {u.is_banned ? 'Banned' : 'Active'}
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '1rem' }}>
                                                {!isSelf && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleBanToggle(u.id, u.is_banned)}
                                                            title={u.is_banned ? 'Unban user' : 'Ban user'}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                                padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer',
                                                                border: `1px solid ${u.is_banned ? '#059669' : '#F59E0B'}`,
                                                                background: u.is_banned ? '#ECFDF5' : '#FFFBEB',
                                                                color: u.is_banned ? '#059669' : '#B45309',
                                                                fontSize: '0.75rem', fontWeight: '600', fontFamily: 'var(--font-sans)'
                                                            }}
                                                        >
                                                            {u.is_banned ? <CheckCircle size={13} /> : <Ban size={13} />}
                                                            {u.is_banned ? 'Unban' : 'Ban'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(u)}
                                                            title="Delete user"
                                                            style={{
                                                                display: 'flex', alignItems: 'center',
                                                                padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer',
                                                                border: '1px solid #FECACA', background: '#FEF2F2',
                                                                color: '#DC2626', fontFamily: 'var(--font-sans)'
                                                            }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </Section>

            {/* Create User Modal */}
            {showCreateModal && (
                <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Jane Smith' },
                            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'jane@example.com' },
                            { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
                        ].map(({ label, name, type, placeholder }) => (
                            <div key={name}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{label}</label>
                                <input
                                    type={type} name={name} placeholder={placeholder} required
                                    value={createForm[name]}
                                    onChange={e => setCreateForm(prev => ({ ...prev, [name]: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                        ))}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Role</label>
                            <select
                                value={createForm.role}
                                onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                                style={{ ...inputStyle }}
                            >
                                <option value="user">User — Public access only</option>
                                <option value="member">Member — Member-only resources</option>
                                <option value="admin">Admin — Full access</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="button" onClick={() => setShowCreateModal(false)} style={{
                                flex: 1, padding: '0.75rem', background: 'none',
                                border: '1px solid var(--border-medium)', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)'
                            }}>Cancel</button>
                            <button type="submit" disabled={createLoading} style={{
                                flex: 1, padding: '0.75rem', background: 'var(--primary)',
                                border: 'none', borderRadius: '8px', color: 'white',
                                cursor: 'pointer', fontWeight: '700', fontFamily: 'var(--font-sans)',
                                opacity: createLoading ? 0.7 : 1
                            }}>
                                {createLoading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <Modal title="Delete User" onClose={() => setConfirmDelete(null)}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                        Are you sure you want to permanently delete <strong style={{ color: 'var(--text-main)' }}>{confirmDelete.name}</strong>? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setConfirmDelete(null)} style={{
                            flex: 1, padding: '0.75rem', background: 'none',
                            border: '1px solid var(--border-medium)', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)'
                        }}>Cancel</button>
                        <button onClick={() => handleDelete(confirmDelete.id)} style={{
                            flex: 1, padding: '0.75rem', background: '#DC2626',
                            border: 'none', borderRadius: '8px', color: 'white',
                            cursor: 'pointer', fontWeight: '700', fontFamily: 'var(--font-sans)'
                        }}>Delete User</button>
                    </div>
                </Modal>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default UserManagement;