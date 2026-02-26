import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Calendar, Users, FileText, CheckCircle, Trash2, Plus, XCircle, BookOpen, Upload, Download } from 'lucide-react';

const AdminDashboard = () => {
    const { token, isAdmin, loading, authFetch, API } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('approvals');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingResources, setPendingResources] = useState([]);
    const [events, setEvents] = useState([]);
    const [team, setTeam] = useState([]);
    const [playbooks, setPlaybooks] = useState([]);

    const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '', link: '', type: '', category: '', is_featured: '0', teams_link: '', recording_url: '' });
    const [newTeam, setNewTeam] = useState({ name: '', role: '', description: '', linkedin_url: '', image: null, categories: ['leadership'] });
    const [newPlaybook, setNewPlaybook] = useState({ title: '', brief: '', framework: 'EU AI Act', category: 'Guide', file: null });

    // Admin Auth Guard — wait for auth to finish loading before redirecting
    useEffect(() => {
        if (loading) return;
        if (!token || !isAdmin) {
            navigate('/membership', { state: { mode: 'login' } });
        } else {
            fetchData();
        }
    }, [token, isAdmin, loading]);

    const fetchData = async () => {
        try {
            // Fetch ALL users from admin endpoint, then filter pending locally
            // Backend uses /admin/users — there is no separate pending endpoint
            const uRes = await authFetch(`${API}/admin/users`).catch(() => null);
            if (uRes && uRes.ok) {
                const uData = await uRes.json();
                // Show users that are pending approval (not yet approved)
                setPendingUsers(uData.filter(u => u.approval_status === 'pending' || !u.is_approved));
            }

            // Fetch pending resources
            const prRes = await authFetch(`${API}/resources/pending`).catch(() => null);
            if (prRes && prRes.ok) setPendingResources(await prRes.json());

            // Fetch events (public endpoint)
            const eRes = await fetch(`${API}/events`).catch(() => null);
            if (eRes && eRes.ok) setEvents(await eRes.json());

            // Fetch team (public endpoint)
            const tRes = await fetch(`${API}/team`).catch(() => null);
            if (tRes && tRes.ok) setTeam(await tRes.json());

            // Fetch playbooks (public endpoint)
            const pbRes = await fetch(`${API}/playbooks`).catch(() => null);
            if (pbRes && pbRes.ok) setPlaybooks(await pbRes.json());

        } catch (err) {
            console.error('Error fetching admin data:', err);
        }
    };

    // Approval: promote user to 'member' role
    const handleApprove = async (userId) => {
        try {
            await authFetch(`${API}/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: 'member' })
            }).catch(() => null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    // Rejection: ban the user
    const handleReject = async (userId) => {
        try {
            await authFetch(`${API}/admin/users/${userId}/ban`, {
                method: 'PATCH',
                body: JSON.stringify({ is_banned: true })
            }).catch(() => null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleApproveResource = async (resId) => {
        try {
            await authFetch(`${API}/resources/${resId}/approve`, { method: 'PATCH' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleRejectResource = async (resId) => {
        try {
            await authFetch(`${API}/resources/${resId}/reject`, { method: 'PATCH' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await authFetch(`${API}/events`, {
                method: 'POST',
                body: JSON.stringify(newEvent)
            });
            setNewEvent({ title: '', date: '', location: '', link: '', type: '', category: '', is_featured: '0', teams_link: '', recording_url: '' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await authFetch(`${API}/events/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (newTeam.categories.length === 0) return alert('Please select at least one team category.');

        const formData = new FormData();
        formData.append('name', newTeam.name);
        formData.append('role', newTeam.role);
        formData.append('description', newTeam.description);
        formData.append('categories', JSON.stringify(newTeam.categories));
        formData.append('linkedin_url', newTeam.linkedin_url);
        if (newTeam.image) formData.append('image', newTeam.image);

        try {
            // Use authFetch — it now correctly skips Content-Type for FormData
            await authFetch(`${API}/team`, {
                method: 'POST',
                body: formData
            });
            setNewTeam({ name: '', role: '', description: '', linkedin_url: '', image: null, categories: ['leadership'] });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteTeam = async (id) => {
        try {
            await authFetch(`${API}/team/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleCreatePlaybook = async (e) => {
        e.preventDefault();
        if (!newPlaybook.file) return alert('Please select a file');
        const formData = new FormData();
        formData.append('title', newPlaybook.title);
        formData.append('brief', newPlaybook.brief);
        formData.append('framework', newPlaybook.framework);
        formData.append('category', newPlaybook.category);
        formData.append('file', newPlaybook.file);
        try {
            // Use authFetch — it now correctly skips Content-Type for FormData
            await authFetch(`${API}/playbooks`, {
                method: 'POST',
                body: formData
            });
            setNewPlaybook({ title: '', brief: '', framework: 'EU AI Act', category: 'Guide', file: null });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDeletePlaybook = async (id) => {
        try {
            await authFetch(`${API}/playbooks/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    // Show loading spinner while auth is being verified
    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B', fontFamily: 'var(--font-sans)' }}>Loading Admin Dashboard...</div>;
    if (!isAdmin) return null;

    return (
        <div style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text-main)' }}>
            <h1 style={{ marginBottom: '30px', fontSize: '2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={32} /> Admin Dashboard
            </h1>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', overflowX: 'auto' }}>
                <button onClick={() => setActiveTab('approvals')} style={tabStyle(activeTab === 'approvals')}>
                    <CheckCircle size={18} /> Member Approvals
                </button>
                <button onClick={() => setActiveTab('resources')} style={tabStyle(activeTab === 'resources')}>
                    <FileText size={18} /> Pending Resources
                </button>
                <button onClick={() => setActiveTab('events')} style={tabStyle(activeTab === 'events')}>
                    <Calendar size={18} /> Manage Events
                </button>
                <button onClick={() => setActiveTab('team')} style={tabStyle(activeTab === 'team')}>
                    <Users size={18} /> Manage Team
                </button>
                <button onClick={() => setActiveTab('playbooks')} style={tabStyle(activeTab === 'playbooks')}>
                    <BookOpen size={18} /> Manage Playbooks
                </button>
                <button onClick={() => navigate('/resources')} style={tabStyle(false)}>
                    <FileText size={18} /> Manage Resources (Go to Page)
                </button>
            </div>

            {/* APPROVALS TAB */}
            {activeTab === 'approvals' && (
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Pending Member Approvals</h2>
                    {pendingUsers.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <CheckCircle size={40} color="#10B981" style={{ marginBottom: '10px' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No pending users to approve.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {pendingUsers.map(u => (
                                <div key={u.id} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{u.name} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', textTransform: 'uppercase', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{u.role}</span></h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</p>

                                        {u.organization_name && (
                                            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                                                <strong>{u.organization_name}</strong>
                                                <br />
                                                {u.gst && `GST: ${u.gst} | `} {u.pan && `PAN: ${u.pan}`}
                                                <br />
                                                {u.incorporation_number && `Inc. No: ${u.incorporation_number} | `} {u.phone && `Phone: ${u.phone}`}
                                            </div>
                                        )}

                                        <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                            Registered: {new Date(u.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApprove(u.id)} style={{ padding: '8px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button onClick={() => handleReject(u.id)} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PENDING RESOURCES TAB */}
            {activeTab === 'resources' && (
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Pending Resources</h2>
                    {pendingResources.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <FileText size={40} color="#10B981" style={{ marginBottom: '10px' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>No pending resources to approve.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {pendingResources.map(res => (
                                <div key={res.id} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{res.title} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', textTransform: 'uppercase', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{res.type}</span></h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.description}</p>
                                        <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                            Submitted: {new Date(res.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApproveResource(res.id)} style={{ padding: '8px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button onClick={() => handleRejectResource(res.id)} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Trash2 size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Add New Event</h3>
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Event Title *" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} style={inputStyle} />
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Event Date *</label>
                                <input type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} style={inputStyle} />
                            </div>
                            <input type="text" placeholder="Location (e.g. Virtual) *" required value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} style={inputStyle} />
                            <input type="url" placeholder="Registration Link (Optional)" value={newEvent.link} onChange={e => setNewEvent({ ...newEvent, link: e.target.value })} style={inputStyle} />
                            <input type="url" placeholder="Microsoft Teams Link (Optional)" value={newEvent.teams_link} onChange={e => setNewEvent({ ...newEvent, teams_link: e.target.value })} style={inputStyle} />
                            <input type="url" placeholder="YouTube Recording URL (add after event)" value={newEvent.recording_url} onChange={e => setNewEvent({ ...newEvent, recording_url: e.target.value })} style={inputStyle} />

                            <select value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })} style={inputStyle} required>
                                <option value="" disabled>Select Event Category *</option>
                                <option value="webinar">Webinar</option>
                                <option value="seminar">Seminar</option>
                                <option value="workshop">Workshop</option>
                                <option value="podcast">Podcast</option>
                                <option value="conference">Conference</option>
                            </select>

                            <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} style={inputStyle} required>
                                <option value="" disabled>Select Timeline *</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                            </select>

                            <select value={newEvent.is_featured} onChange={e => setNewEvent({ ...newEvent, is_featured: e.target.value })} style={inputStyle}>
                                <option value="0">Normal Event</option>
                                <option value="1">⭐ Featured Event</option>
                            </select>
                            <button type="submit" style={primaryBtnStyle}>Create Event</button>
                        </form>
                    </div>
                    <div style={{ flex: '2 1 400px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Current Events</h3>
                        {events.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No events created yet.</p> : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {events.map(ev => (
                                    <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{ev.title} <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#003366', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{ev.category}</span>{ev.is_featured == 1 && <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>⭐ FEATURED</span>}</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ev.date} • {ev.location} • <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>{ev.type}</span></p>
                                        </div>
                                        <button onClick={() => handleDeleteEvent(ev.id)} style={deleteBtnStyle}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PLAYBOOKS TAB */}
            {activeTab === 'playbooks' && (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={20} /> Upload Playbook</h3>
                        <form onSubmit={handleCreatePlaybook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Playbook Title *" required value={newPlaybook.title} onChange={e => setNewPlaybook({ ...newPlaybook, title: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Brief Description" rows={3} value={newPlaybook.brief} onChange={e => setNewPlaybook({ ...newPlaybook, brief: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                            <select value={newPlaybook.framework} onChange={e => setNewPlaybook({ ...newPlaybook, framework: e.target.value })} style={inputStyle} required>
                                <option value="EU AI Act">EU AI Act</option>
                                <option value="NIST AI RMF">NIST AI RMF</option>
                                <option value="ISO 42001">ISO 42001</option>
                                <option value="GDPR">GDPR</option>
                                <option value="General">General Governance</option>
                            </select>
                            <select value={newPlaybook.category} onChange={e => setNewPlaybook({ ...newPlaybook, category: e.target.value })} style={inputStyle}>
                                <option value="Guide">Guide</option>
                                <option value="Checklist">Checklist</option>
                                <option value="Template">Template</option>
                                <option value="Policy">Policy</option>
                            </select>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Playbook File (PDF / Excel / Word) *</label>
                                <input type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx" required onChange={e => setNewPlaybook({ ...newPlaybook, file: e.target.files[0] })} style={{ ...inputStyle, padding: '8px' }} />
                            </div>
                            <button type="submit" style={primaryBtnStyle}>Upload Playbook</button>
                        </form>
                    </div>
                    <div style={{ flex: '2 1 400px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Uploaded Playbooks ({playbooks.length})</h3>
                        {playbooks.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No playbooks uploaded yet.</p> : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {playbooks.map(pb => (
                                    <div key={pb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{pb.title}</h4>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'white', background: '#003366', padding: '2px 7px', borderRadius: '4px' }}>{pb.framework}</span>
                                                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#475569', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{pb.category}</span>
                                                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748B', background: '#E2E8F0', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{pb.file_type}</span>
                                            </div>
                                            {pb.brief && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pb.brief}</p>}
                                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'inline-block' }}><Download size={11} /> {pb.download_count || 0} downloads</span>
                                        </div>
                                        <button onClick={() => handleDeletePlaybook(pb.id)} style={deleteBtnStyle}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'team' && (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Add Team Member</h3>
                        <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Name *" required value={newTeam.name} onChange={e => setNewTeam({ ...newTeam, name: e.target.value })} style={inputStyle} />
                            <input type="text" placeholder="Role (e.g. Chief Risk Officer) *" required value={newTeam.role} onChange={e => setNewTeam({ ...newTeam, role: e.target.value })} style={inputStyle} />

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Assign to Sections *</label>
                                <div style={{ display: 'flex', gap: '15px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newTeam.categories.includes('leadership')}
                                            onChange={(e) => {
                                                if (e.target.checked) setNewTeam({ ...newTeam, categories: [...newTeam.categories, 'leadership'] });
                                                else setNewTeam({ ...newTeam, categories: newTeam.categories.filter(c => c !== 'leadership') });
                                            }}
                                        />
                                        Leadership & Contributors
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={newTeam.categories.includes('industrial')}
                                            onChange={(e) => {
                                                if (e.target.checked) setNewTeam({ ...newTeam, categories: [...newTeam.categories, 'industrial'] });
                                                else setNewTeam({ ...newTeam, categories: newTeam.categories.filter(c => c !== 'industrial') });
                                            }}
                                        />
                                        Our Industrial AI Experts
                                    </label>
                                </div>
                            </div>

                            <textarea placeholder="Detailed Description / Bio" rows={3} value={newTeam.description} onChange={e => setNewTeam({ ...newTeam, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                            <input type="url" placeholder="LinkedIn URL (Optional)" value={newTeam.linkedin_url} onChange={e => setNewTeam({ ...newTeam, linkedin_url: e.target.value })} style={inputStyle} />
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Profile Image</label>
                                <input type="file" accept="image/*" onChange={e => setNewTeam({ ...newTeam, image: e.target.files[0] })} style={{ ...inputStyle, padding: '8px' }} />
                            </div>
                            <button type="submit" style={primaryBtnStyle}>Add Member</button>
                        </form>
                    </div>
                    <div style={{ flex: '2 1 400px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Current Team Members</h3>
                        {team.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No team members added yet.</p> : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {team.map(member => (
                                    <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                                                {member.image_url ? <img src={`${API.replace('/api', '')}${member.image_url}`} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} />}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem' }}>{member.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.role}</p>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                    {(() => {
                                                        try {
                                                            const cats = JSON.parse(member.categories || '["leadership"]');
                                                            return cats.map((cat, idx) => (
                                                                <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                                    {cat === 'industrial' ? 'Industrial' : 'Leadership'}
                                                                </span>
                                                            ));
                                                        } catch {
                                                            return (
                                                                <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                                    {member.category}
                                                                </span>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTeam(member.id)} style={deleteBtnStyle}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const tabStyle = (active) => ({
    padding: '12px 24px', border: 'none',
    background: active ? 'var(--primary)' : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    borderRadius: '8px', cursor: 'pointer',
    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', whiteSpace: 'nowrap'
});

const inputStyle = {
    padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1',
    fontFamily: 'var(--font-sans)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box'
};

const primaryBtnStyle = {
    padding: '12px', backgroundColor: 'var(--primary)', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    fontSize: '1rem', transition: 'background-color 0.2s', marginTop: '10px'
};

const deleteBtnStyle = {
    padding: '8px', background: '#fee2e2', color: '#ef4444', border: 'none',
    borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s'
};

export default AdminDashboard;