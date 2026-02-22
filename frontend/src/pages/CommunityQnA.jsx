import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, PlusCircle, CheckCircle, User, AlertCircle, Loader, Search, X } from 'lucide-react';
import Section from '../components/Section';

const API = 'http://localhost:5000/api';

// Common English stopwords to strip before keyword matching
const STOPWORDS = new Set(['how', 'to', 'a', 'the', 'my', 'i', 'is', 'in', 'and', 'or', 'for', 'of', 'do', 'does', 'can', 'this', 'that', 'what', 'why', 'when', 'where', 'which', 'should', 'would', 'could', 'will', 'be', 'have', 'has', 'are', 'was', 'were', 'an', 'it', 'its', 'about', 'with', 'from', 'by', 'at', 'on', 'as']);

const tokenize = (query) =>
    query.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 1 && !STOPWORDS.has(t));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const AuthorBadge = ({ name, role }) => {
    const roleColors = { admin: '#7C3AED', member: '#003366', user: '#64748B' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: roleColors[role] || '#64748B', fontWeight: '600' }}>
            <User size={11} /> {name}
            {role === 'admin' && <span style={{ background: '#7C3AED', color: 'white', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>ADMIN</span>}
            {role === 'member' && <span style={{ background: '#003366', color: 'white', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>MEMBER</span>}
        </span>
    );
};

// ─── Answer box for a single question ─────────────────────────────────────────
const AnswerBox = ({ questionId, token, isLoggedIn }) => {
    const [answers, setAnswers] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyError, setReplyError] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);

    const loadAnswers = useCallback(async () => {
        const res = await fetch(`${API}/questions/${questionId}/answers`);
        if (res.ok) setAnswers(await res.json());
    }, [questionId]);

    useEffect(() => { loadAnswers(); }, [loadAnswers]);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setReplyLoading(true);
        setReplyError('');
        try {
            const res = await fetch(`${API}/questions/${questionId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: replyText }),
            });
            const data = await res.json();
            if (!res.ok) {
                setReplyError(data.error || 'Failed to post answer.');
            } else {
                setReplyText('');
                setReplyOpen(false);
                loadAnswers();
            }
        } catch {
            setReplyError('Network error. Please try again.');
        } finally {
            setReplyLoading(false);
        }
    };

    const count = answers?.length ?? 0;

    return (
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '4px' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#003366', fontWeight: '600', fontSize: '0.85rem', padding: '0', marginBottom: expanded ? '14px' : 0 }}
            >
                <MessageSquare size={15} color="#003366" />
                {count > 0 ? `${count} Answer${count !== 1 ? 's' : ''}` : 'No answers yet'} {expanded ? '▲' : '▼'}
            </button>

            {expanded && (
                <>
                    {answers && answers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                            {answers.map(ans => (
                                <div key={ans.id} style={{
                                    background: ans.is_official ? '#EFF6FF' : '#F8FAFC',
                                    padding: '12px 14px', borderRadius: '8px',
                                    borderLeft: `3px solid ${ans.is_official ? '#3B82F6' : '#CBD5E1'}`
                                }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.92rem', color: '#1E293B', lineHeight: '1.55' }}>{ans.content}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <AuthorBadge name={ans.author_name} role={ans.author_role} />
                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{fmtDate(ans.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.87rem', color: '#94A3B8', marginBottom: '14px' }}>No answers yet — be the first to help!</p>
                    )}

                    {isLoggedIn && !replyOpen && (
                        <button
                            onClick={() => setReplyOpen(true)}
                            style={{ border: '1px solid #CBD5E1', background: 'white', color: '#003366', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            + Add Answer
                        </button>
                    )}

                    {!isLoggedIn && (
                        <p style={{ fontSize: '0.83rem', color: '#94A3B8' }}>Please <a href="/membership" style={{ color: '#003366', fontWeight: '700' }}>sign in</a> to post an answer.</p>
                    )}

                    {replyOpen && (
                        <div style={{ marginTop: '10px' }}>
                            <textarea
                                rows="3" placeholder="Write your answer..."
                                value={replyText} onChange={e => { setReplyText(e.target.value); setReplyError(''); }}
                                style={{ width: '100%', padding: '10px', border: `1.5px solid ${replyError ? '#FCA5A5' : '#CBD5E1'}`, borderRadius: '8px', marginBottom: '8px', fontFamily: 'var(--font-sans)', resize: 'vertical', boxSizing: 'border-box', fontSize: '0.9rem' }}
                            />
                            {replyError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '0.82rem', marginBottom: '8px' }}>
                                    <AlertCircle size={13} /> {replyError}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleReply} disabled={replyLoading || !replyText.trim()}
                                    style={{ background: '#003366', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.87rem', opacity: (replyLoading || !replyText.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {replyLoading && <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                                    Post Answer
                                </button>
                                <button onClick={() => { setReplyOpen(false); setReplyText(''); setReplyError(''); }}
                                    style={{ background: 'transparent', color: '#64748B', border: 'none', padding: '8px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '0.87rem' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ─── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ q, token, isLoggedIn }) => (
    <div style={{ background: 'white', padding: '22px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1E293B', lineHeight: '1.4', flexGrow: 1 }}>{q.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{fmtDate(q.created_at)}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: q.status === 'answered' ? '#D1FAE5' : q.status === 'closed' ? '#FEE2E2' : '#EFF6FF', color: q.status === 'answered' ? '#065F46' : q.status === 'closed' ? '#991B1B' : '#1D4ED8', textTransform: 'uppercase' }}>
                    {q.status || 'open'}
                </span>
            </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
            <AuthorBadge name={q.author_name} role={q.author_role} />
        </div>
        {q.details && (
            <p style={{ color: '#475569', fontSize: '0.93rem', lineHeight: '1.65', marginBottom: '14px' }}>{q.details}</p>
        )}
        <AnswerBox questionId={q.id} token={token} isLoggedIn={isLoggedIn} />
    </div>
);

// ─── My Q&A Panel ─────────────────────────────────────────────────────────────
const MyQnAPanel = ({ token }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/questions/my`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
                else setError('Could not load your Q&A.');
            } catch {
                setError('Network error.');
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}><Loader size={28} /></div>;
    if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: '#EF4444' }}>{error}</div>;

    const { questions = [], answers = [] } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* My Questions */}
            <div>
                <h3 style={{ color: '#1E293B', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} color="#003366" /> My Questions
                    <span style={{ fontWeight: '400', color: '#94A3B8', fontSize: '0.85rem' }}>({questions.length})</span>
                </h3>
                {questions.length === 0 ? (
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>You haven't asked any questions yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {questions.map(q => (
                            <div key={q.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <h4 style={{ margin: '0 0 4px', color: '#1E293B', fontSize: '0.97rem', fontWeight: '700' }}>{q.title}</h4>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: q.status === 'answered' ? '#D1FAE5' : '#EFF6FF', color: q.status === 'answered' ? '#065F46' : '#1D4ED8', textTransform: 'uppercase', flexShrink: 0 }}>{q.status || 'open'}</span>
                                </div>
                                {q.details && <p style={{ margin: '0 0 6px', color: '#64748B', fontSize: '0.85rem', lineHeight: '1.5' }}>{q.details}</p>}
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{fmtDate(q.created_at)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Answers */}
            <div>
                <h3 style={{ color: '#1E293B', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="#10B981" /> My Answers
                    <span style={{ fontWeight: '400', color: '#94A3B8', fontSize: '0.85rem' }}>({answers.length})</span>
                </h3>
                {answers.length === 0 ? (
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>You haven't answered any questions yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {answers.map(a => (
                            <div key={a.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', borderLeft: '3px solid #10B981' }}>
                                <p style={{ margin: '0 0 6px', color: '#374151', fontSize: '0.88rem', lineHeight: '1.55' }}>{a.content}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                        On: <strong style={{ color: '#003366' }}>{a.question_title}</strong>
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{fmtDate(a.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CommunityQnA = () => {
    const { token, isLoggedIn, user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [formParams, setFormParams] = useState({ title: '', details: '' });
    const [isAsking, setIsAsking] = useState(false);
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [tab, setTab] = useState('all'); // 'all' | 'mine'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchQuestions = useCallback(async () => {
        try {
            const res = await fetch(`${API}/questions`);
            if (res.ok) setQuestions(await res.json());
        } catch (err) {
            console.error('Failed to fetch questions:', err);
        }
    }, []);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!formParams.title.trim()) { setFormError('Question title is required.'); return; }
        setFormLoading(true);
        setFormError('');
        try {
            const res = await fetch(`${API}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formParams),
            });
            const data = await res.json();
            if (!res.ok) { setFormError(data.error || 'Failed to post question.'); return; }
            setFormParams({ title: '', details: '' });
            setIsAsking(false);
            fetchQuestions();
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const TABS = [
        { key: 'all', label: `All Questions (${questions.length})` },
        ...(isLoggedIn ? [{ key: 'mine', label: 'My Q&A' }] : []),
    ];

    // Multi-keyword client-side search
    const keywords = tokenize(searchQuery);
    const filteredQuestions = keywords.length === 0
        ? questions
        : questions.filter(q => {
            const haystack = `${q.title} ${q.details || ''}`.toLowerCase();
            return keywords.some(kw => haystack.includes(kw));
        });

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '48px 0 64px' }}>
            <Section>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ color: '#003366', fontSize: '2.2rem', marginBottom: '6px' }}>Community Q&A</h1>
                        <p style={{ color: '#64748B', fontSize: '1rem' }}>Ask questions, share knowledge, and connect with global AI risk professionals.</p>
                    </div>
                    {isLoggedIn && (
                        <button
                            onClick={() => { setIsAsking(!isAsking); setFormError(''); }}
                            style={{ backgroundColor: isAsking ? '#E2E8F0' : '#003366', color: isAsking ? '#475569' : 'white', padding: '10px 22px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <PlusCircle size={18} /> {isAsking ? 'Cancel' : 'Ask a Question'}
                        </button>
                    )}
                </div>

                {/* Not logged in banner */}
                {!isLoggedIn && (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem 1.25rem', borderRadius: '10px', color: '#1D4ED8', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                        <MessageSquare size={17} />
                        <span>Please <a href="/membership" style={{ fontWeight: '700', color: '#1D4ED8' }}>sign in</a> to ask questions or post answers.</span>
                    </div>
                )}

                {/* Ask question form */}
                {isAsking && (
                    <form onSubmit={handleAskQuestion} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '2rem', border: '1px solid #E2E8F0' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.1rem', color: '#1E293B' }}>Ask the Community</h3>
                        <input
                            type="text" placeholder="Briefly summarize your question…" required
                            value={formParams.title}
                            onChange={e => { setFormParams(p => ({ ...p, title: e.target.value })); setFormError(''); }}
                            style={{ width: '100%', padding: '11px', border: '1.5px solid #CBD5E1', borderRadius: '8px', marginBottom: '12px', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                        />
                        <textarea
                            placeholder="Add more context or details (optional)…"
                            rows="4" value={formParams.details}
                            onChange={e => setFormParams(p => ({ ...p, details: e.target.value }))}
                            style={{ width: '100%', padding: '11px', border: '1.5px solid #CBD5E1', borderRadius: '8px', marginBottom: '12px', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        {formError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#DC2626', fontSize: '0.83rem', marginBottom: '12px' }}>
                                <AlertCircle size={14} /> {formError}
                            </div>
                        )}
                        <button type="submit" disabled={formLoading} style={{ background: '#003366', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '7px', fontWeight: '700', cursor: formLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: formLoading ? 0.7 : 1 }}>
                            {formLoading ? 'Posting…' : 'Post Question'}
                        </button>
                    </form>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '4px', background: '#E2E8F0', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: '7px 18px', borderRadius: '6px', fontSize: '0.855rem', fontWeight: '700', border: 'none', cursor: 'pointer',
                                background: tab === t.key ? 'white' : 'transparent',
                                color: tab === t.key ? '#003366' : '#64748B',
                                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.15s',
                            }}>{t.label}</button>
                        ))}
                    </div>

                    {/* Search bar — only on All Questions tab */}
                    {tab === 'all' && (
                        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search questions… e.g. fix purview solution"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '8px 32px 8px 33px', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.87rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#003366'}
                                onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94A3B8' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                {tab === 'all' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Search result summary */}
                        {keywords.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569', marginBottom: '2px' }}>
                                <Search size={14} color="#003366" />
                                <span>Showing <strong style={{ color: '#003366' }}>{filteredQuestions.length}</strong> result{filteredQuestions.length !== 1 ? 's' : ''} for keywords: </span>
                                {keywords.map(kw => (
                                    <span key={kw} style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>{kw}</span>
                                ))}
                            </div>
                        )}

                        {filteredQuestions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                                <Search size={36} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: '#94A3B8', fontSize: '1rem' }}>
                                    {keywords.length > 0 ? `No questions matched your search. Try different keywords.` : 'No questions yet. Start the conversation!'}
                                </p>
                                {keywords.length > 0 && (
                                    <button onClick={() => setSearchQuery('')} style={{ marginTop: '0.75rem', background: '#003366', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.87rem' }}>Clear Search</button>
                                )}
                            </div>
                        ) : (
                            filteredQuestions.map(q => (
                                <QuestionCard key={q.id} q={q} token={token} isLoggedIn={isLoggedIn} />
                            ))
                        )}
                    </div>
                )}

                {tab === 'mine' && isLoggedIn && (
                    <MyQnAPanel token={token} />
                )}
            </Section>
        </div>
    );
};

export default CommunityQnA;
