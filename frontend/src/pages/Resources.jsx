import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, X, Filter, ChevronLeft, ChevronRight,
    Download, Trash2, Upload, FileText, BookOpen,
    Video, Globe, Lock, Plus, AlertCircle, CheckCircle,
    Edit2, Shield
} from 'lucide-react';
import './Resources.css';
import { useAuth } from '../context/AuthContext';

const API = '/api';

const TYPE_ICONS = {
    article: <FileText size={12} />,
    whitepaper: <BookOpen size={12} />,
    video: <Video size={12} />,
    tool: <Globe size={12} />,
    news: <FileText size={12} />,
    'homepage video': <Video size={12} />,
    'lab result': <FileText size={12} />,
    product: <Globe size={12} />,
};

const TYPE_OPTIONS = ['article', 'whitepaper', 'video', 'tool', 'news', 'homepage video', 'lab result', 'product'];

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ---- Upload / Edit Modal (Admin only) ----
const ResourceModal = ({ resource, onClose, onSaved, token, isAdmin, user }) => {
    const isEdit = !!resource;
    const isUniversity = user?.role === 'university';
    const isCompany = user?.role === 'company';
    const defaultType = isAdmin ? 'article' : isUniversity ? 'whitepaper' : isCompany ? 'product' : 'article';

    const [form, setForm] = useState({
        title: resource?.title || '',
        summary: resource?.summary || '',
        source_url: resource?.source_url || '',
        category_slug: resource?.category_slug || '',
        type: resource?.type || defaultType,
        access_level: resource?.access_level || 'public',
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.summary) { setError('Title and summary are required.'); return; }
        setLoading(true); setError('');
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (file) fd.append('file', file);

            const url = isEdit ? `${API}/resources/${resource.id}` : `${API}/resources`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            onSaved(data, isEdit);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: 'white', borderRadius: 'var(--radius-md)',
                width: '100%', maxWidth: '560px', maxHeight: '90vh',
                overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
            }}>
                <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {isEdit ? 'Edit Resource' : 'Upload New Resource'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                        <label style={labelStyle}>Title *</label>
                        <input name="title" value={form.title} onChange={handleChange} style={inputStyle} placeholder="Resource title" />
                    </div>
                    <div>
                        <label style={labelStyle}>Summary *</label>
                        <textarea name="summary" value={form.summary} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Type</label>
                            <select name="type" value={form.type} onChange={handleChange} style={inputStyle} disabled={!isAdmin}>
                                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Access Level</label>
                            <select name="access_level" value={form.access_level} onChange={handleChange} style={inputStyle}>
                                <option value="public">Public</option>
                                <option value="registered">Member Only</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Category Slug</label>
                        <input name="category_slug" value={form.category_slug} onChange={handleChange} style={inputStyle} placeholder="e.g. governance" />
                    </div>
                    <div>
                        <label style={labelStyle}>Source URL</label>
                        <input name="source_url" value={form.source_url} onChange={handleChange} style={inputStyle} placeholder="https://..." />
                    </div>
                    <div>
                        <label style={labelStyle}>File (PDF / DOCX / XLSX)</label>
                        <input type="file" accept=".pdf,.docx,.xlsx" onChange={e => setFile(e.target.files[0])}
                            style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                        {resource?.file_path && !file && (
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                Current: {resource.file_path.split('/').pop()}
                            </p>
                        )}
                    </div>
                    {error && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', padding: '0.65rem 0.9rem', color: '#DC2626', fontSize: '0.85rem' }}>
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} style={{ ...btnSecStyle, flex: 1 }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{ ...btnPrimStyle, flex: 2 }}>
                            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Upload Resource')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---- Main Resources Page ----
const Resources = () => {
    const { user, token, isAdmin, isMember, isLoggedIn } = useAuth();

    // Derive these locally to avoid depending on AuthContext exports
    const isUniversity = user?.role === 'university';
    const isCompany = user?.role === 'company';

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterAccess, setFilterAccess] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [modal, setModal] = useState(null);
    const [expandedNews, setExpandedNews] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchResources = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== 'all') params.set('type', filterType);
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${API}/resources?${params}`, { headers });
            const data = await res.json();
            setResources(Array.isArray(data) ? data : []);
        } catch {
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(); }, [filterType, token]);

    const mainFiltered = resources.filter(r => r.type !== 'news').filter(r => {
        const matchSearch = !search ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.summary?.toLowerCase().includes(search.toLowerCase());
        const matchAccess = filterAccess === 'all' || r.access_level === filterAccess;
        const matchType = filterType === 'all' || r.type === filterType;
        return matchSearch && matchAccess && matchType;
    });

    const newsFiltered = resources.filter(r => r.type === 'news').filter(r => {
        const matchSearch = !search ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.summary?.toLowerCase().includes(search.toLowerCase());
        const matchAccess = filterAccess === 'all' || r.access_level === filterAccess;
        return matchSearch && matchAccess;
    });

    const handleDownload = async (r) => {
        try {
            await fetch(`${API}/resources/${r.id}/download`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setResources(prev => prev.map(x => x.id === r.id ? { ...x, download_count: (x.download_count || 0) + 1 } : x));
        } catch { }
        if (r.file_path) {
            window.open(`${r.file_path}`, '_blank');
        } else if (r.source_url) {
            window.open(r.source_url, '_blank');
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/resources/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            setResources(prev => prev.filter(r => r.id !== id));
            showToast('Resource deleted.');
        } catch {
            showToast('Failed to delete.', 'error');
        }
        setDeleteConfirm(null);
    };

    const handleSaved = (saved, isEdit) => {
        if (isEdit) {
            setResources(prev => prev.map(r => r.id === saved.id ? saved : r));
            showToast('Resource updated!');
        } else {
            setResources(prev => [saved, ...prev]);
            showToast('Resource uploaded!');
        }
        setModal(null);
    };

    const typeCounts = TYPE_OPTIONS.reduce((acc, t) => {
        acc[t] = resources.filter(r => r.type === t).length;
        return acc;
    }, {});

    return (
        <div className="resources-page">
            {/* Hero */}
            <div className="resources-hero">
                <div className="resources-hero__bg" />
                <div className="resources-hero__content">
                    <span className="resources-badge">Knowledge Library</span>
                    <h1>AI Governance Resources</h1>
                    <p>
                        {isAdmin ? 'Admin view — manage all resources.' :
                            isMember ? 'Member access — full library available.' :
                                'Browse public AI risk governance resources.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {isAdmin ? <><Shield size={14} color="#A78BFA" /><span style={{ color: '#A78BFA', fontWeight: '700' }}>Admin</span> — full access</> :
                            isMember ? <><Shield size={14} color="#93C5FD" /><span style={{ color: '#93C5FD', fontWeight: '700' }}>Member</span> — all resources visible</> :
                                isLoggedIn ? <><Lock size={14} /><span>User — public resources only</span></> :
                                    <><Lock size={14} /><span>Sign in for more access</span></>}
                    </div>
                    <div className="resources-search">
                        <Search size={16} className="resources-search__icon" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search resources..."
                        />
                        {search && (
                            <button className="resources-search__clear" onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="resources-body">
                {/* Sidebar */}
                <aside className={`resources-sidebar ${sidebarOpen ? '' : 'closed'}`}>
                    <div className="resources-sidebar__header">
                        <Filter size={16} />
                        {sidebarOpen && <span>Filters</span>}
                        <button className="resources-sidebar__toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>

                    {sidebarOpen && (
                        <div className="resources-sidebar__filters">
                            <div className="filter-group">
                                <p className="filter-group__label">Type</p>
                                <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
                                    All Types
                                    {filterType === 'all' && <span className="filter-btn__dot" />}
                                </button>
                                {TYPE_OPTIONS.map(t => (
                                    <button key={t} className={`filter-btn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
                                        {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                                        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.75rem' }}>
                                            {typeCounts[t] || 0}
                                        </span>
                                        {filterType === t && <span className="filter-btn__dot" />}
                                    </button>
                                ))}
                            </div>

                            <div className="filter-group">
                                <p className="filter-group__label">Access</p>
                                <button className={`filter-btn ${filterAccess === 'all' ? 'active' : ''}`} onClick={() => setFilterAccess('all')}>
                                    All
                                </button>
                                <button className={`filter-btn ${filterAccess === 'public' ? 'active' : ''}`} onClick={() => setFilterAccess('public')}>
                                    <Globe size={13} /> Public
                                </button>
                                {(isMember || isAdmin) && (
                                    <button className={`filter-btn ${filterAccess === 'registered' ? 'active' : ''}`} onClick={() => setFilterAccess('registered')}>
                                        <Lock size={13} /> Member Only
                                    </button>
                                )}
                            </div>

                            <div className="filter-stats">
                                <p>{mainFiltered.length} resource{mainFiltered.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Grid */}
                <div className="resources-grid-wrapper">

                    {/* Upload Button */}
                    {(isAdmin || isUniversity || isCompany) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setModal({ mode: 'create' })}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.7rem 1.5rem', background: 'var(--primary)',
                                    color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                                    fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)'
                                }}
                            >
                                <Plus size={16} /> Upload Resource {isAdmin ? '' : '(Pending Approval)'}
                            </button>
                        </div>
                    )}

                    {/* Not logged in banner */}
                    {!isLoggedIn && (
                        <div style={{
                            background: '#EFF6FF', border: '1px solid #BFDBFE',
                            borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            marginBottom: '1.5rem', fontSize: '0.875rem', color: '#1E40AF'
                        }}>
                            <Lock size={16} />
                            <span><strong>Member resources are hidden.</strong> <Link to="/membership" style={{ color: '#1D4ED8', fontWeight: '600' }}>Sign in or register</Link> to unlock more content.</span>
                        </div>
                    )}

                    {/* User (non-member) banner */}
                    {isLoggedIn && !isMember && (
                        <div style={{
                            background: '#FFFBEB', border: '1px solid #FDE68A',
                            borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            marginBottom: '1.5rem', fontSize: '0.875rem', color: '#92400E'
                        }}>
                            <Lock size={16} />
                            <span><strong>You have User access.</strong> Upgrade to Member to access all resources. <Link to="/contact" style={{ color: '#B45309', fontWeight: '600' }}>Contact us</Link> to upgrade.</span>
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="resources-skeleton-grid">
                            {[...Array(6)].map((_, i) => <div key={i} className="resource-skeleton" />)}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && mainFiltered.length === 0 && newsFiltered.length === 0 && (
                        <div className="resources-empty">
                            <span>📭</span>
                            <p>{search ? `No results for "${search}"` : 'No resources found.'}</p>
                            {search && <button onClick={() => setSearch('')}>Clear search</button>}
                        </div>
                    )}

                    {/* Resource cards */}
                    {!loading && mainFiltered.length > 0 && (
                        <div className="resources-grid">
                            {mainFiltered.map(r => (
                                <div key={r.id} className="resource-card">
                                    <div className="resource-card__top">
                                        <span className="resource-card__type-badge">
                                            {TYPE_ICONS[r.type] || <FileText size={12} />}
                                            {r.type}
                                        </span>
                                        <span className="resource-card__date">{formatDate(r.created_at)}</span>
                                    </div>
                                    <div className="resource-card__body">
                                        <h3>{r.title}</h3>
                                        <p>{r.summary}</p>
                                    </div>
                                    <div className="resource-card__tags">
                                        {r.category_slug && <span className="tag">{r.category_slug}</span>}
                                        <span className={`tag tag--access ${r.access_level === 'public' ? 'tag--public' : 'tag--locked'}`}>
                                            {r.access_level === 'public' ? <Globe size={10} /> : <Lock size={10} />}
                                            &nbsp;{r.access_level === 'public' ? 'Public' : 'Member'}
                                        </span>
                                    </div>
                                    <div className="resource-card__footer">
                                        <button
                                            className="resource-card__download"
                                            onClick={() => handleDownload(r)}
                                        >
                                            <Download size={15} /> Download
                                        </button>
                                        <span className="resource-card__downloads">
                                            {r.download_count || 0} downloads
                                        </span>
                                        {isAdmin && (
                                            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                                                <button
                                                    onClick={() => setModal({ mode: 'edit', resource: r })}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: '#EFF6FF', border: '1px solid #BFDBFE',
                                                        borderRadius: '6px', padding: '0.35rem 0.6rem',
                                                        cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={13} color="#1D4ED8" />
                                                </button>
                                                <button
                                                    className="resource-card__delete"
                                                    onClick={() => setDeleteConfirm(r.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload / Edit Modal */}
            {modal && (
                <ResourceModal
                    resource={modal.mode === 'edit' ? modal.resource : null}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                    token={token}
                    isAdmin={isAdmin}
                    user={user}
                />
            )}

            {/* Read More News Modal */}
            {expandedNews && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                    onClick={() => setExpandedNews(null)}
                >
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-md)',
                        padding: '2.5rem', maxWidth: '600px', width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setExpandedNews(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ backgroundColor: '#EFF6FF', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>News</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>{formatDate(expandedNews.created_at)}</span>
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '20px', color: 'var(--text-main)' }}>{expandedNews.title}</h2>
                        {/* Fixed: use summary (backend field name), fall back to description for safety */}
                        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {expandedNews.summary || expandedNews.description}
                        </div>
                        {(expandedNews.source_url || expandedNews.file_path) && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                                <button
                                    className="resource-card__download"
                                    onClick={() => handleDownload(expandedNews)}
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                >
                                    <Globe size={16} style={{ marginRight: '8px' }} /> View Full Source
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirm Dialog */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-md)',
                        padding: '2rem', maxWidth: '380px', width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>Delete Resource?</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            This action cannot be undone. The file and all associated data will be permanently removed.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteConfirm(null)} style={btnSecStyle}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrimStyle, background: '#DC2626', flex: 1 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    background: toast.type === 'error' ? '#DC2626' : '#065F46',
                    color: 'white', padding: '0.75rem 1.25rem',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

// Shared micro styles
const labelStyle = {
    display: 'block', marginBottom: '0.4rem',
    fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-main)'
};
const inputStyle = {
    width: '100%', padding: '0.65rem 0.85rem',
    border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
    color: 'var(--text-main)', background: '#FAFAFA', boxSizing: 'border-box'
};
const btnPrimStyle = {
    padding: '0.7rem 1.25rem', background: 'var(--primary)',
    color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
    fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
    fontFamily: 'var(--font-sans)'
};
const btnSecStyle = {
    padding: '0.7rem 1.25rem', background: 'white',
    color: 'var(--text-secondary)', border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'var(--font-sans)'
};

export default Resources;