import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowRight, Mic, Monitor, BookOpen, Radio, Video } from 'lucide-react';

const API = '/api';

// ─── Type meta ───────────────────────────────────────────────────────────────
const TYPE_META = {
    Webinar: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: <Monitor size={14} />, image: '/event_webinar.png' },
    Seminar: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: <BookOpen size={14} />, image: '/event_seminar.png' },
    Workshop: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: <Mic size={14} />, image: '/event_workshop.png' },
    Podcast: { color: '#7C3AED', bg: '#FAF5FF', border: '#E9D5FF', icon: <Radio size={14} />, image: '/event_podcast.png' },
    Conference: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: <Users size={14} />, image: '/event_seminar.png' },
};

const ALL_CATEGORIES = ['All', 'Webinar', 'Seminar', 'Workshop', 'Podcast', 'Conference'];

// ─── Event data ──────────────────────────────────────────────────────────────
const STATIC_EVENTS = [
    {
        id: 'static-1',
        title: 'EU AI Act Compliance: What You Need to Know in 2026',
        category: 'Webinar',
        type: 'upcoming',
        date: new Date('2026-03-06'),
        time: '2:00 PM – 3:30 PM CET',
        location: 'Online (Teams)',
        attendees: '900+',
        description: 'A deep-dive webinar covering the EU AI Act\'s obligations for high-risk AI system providers. We walk through classification criteria, mandatory documentation, GPAI model rules, and enforcement timelines with a live Q&A.',
        tags: ['EU AI Act', 'Compliance', 'Regulatory'],
        featured: true,
        registrationUrl: '#',
    },
    {
        id: 'static-2',
        title: 'AI Model Risk Management: From Assessment to Audit',
        category: 'Seminar',
        type: 'upcoming',
        date: new Date('2026-03-18'),
        time: '10:00 AM – 12:00 PM EST',
        location: 'Online (MS Teams) + In-Person, New York',
        attendees: '200',
        description: 'An intensive half-day seminar led by SR 11-7-aligned practitioners covering the full model risk life cycle — from initial validation and stress testing to board-level reporting and third-party AI audits.',
        tags: ['Model Risk', 'MRM', 'Audit'],
        featured: true,
        registrationUrl: '#',
    },
    {
        id: 'static-3',
        title: 'Hands-On AI Red Teaming Workshop',
        category: 'Workshop',
        type: 'upcoming',
        date: new Date('2026-04-10'),
        time: '9:00 AM – 5:00 PM IST',
        location: 'Gurugram, India (Hybrid)',
        attendees: '60',
        description: 'A full-day practitioner workshop on adversarial testing of language models and AI systems. Participants perform prompt injection attacks, data poisoning tests, and jailbreak exercises on sandboxed models using industry tooling.',
        tags: ['Red Teaming', 'LLM Security', 'Practical'],
        featured: false,
        registrationUrl: '#',
    },
    {
        id: 'static-4',
        title: 'Episode 22: AI Procurement Risk with Sarah Mitchell (Microsoft)',
        category: 'Podcast',
        type: 'upcoming',
        date: new Date('2026-04-02'),
        time: 'Available on all platforms',
        location: 'Spotify / Apple Podcasts / YouTube',
        attendees: '—',
        description: 'Sarah Mitchell, AI Governance Lead at Microsoft, joins us to discuss how enterprises can assess and manage risks when procuring third-party AI tools — covering due diligence frameworks, contractual safeguards, and Microsoft Purview integration.',
        tags: ['Procurement', 'Enterprise AI', 'Podcast'],
        featured: false,
        registrationUrl: '#',
    },
    {
        id: 'static-5',
        title: 'NIST AI RMF for Financial Services',
        category: 'Webinar',
        type: 'upcoming',
        date: new Date('2026-05-14'),
        time: '1:00 PM – 2:30 PM EST',
        location: 'Online (Teams)',
        attendees: '1,100+',
        description: 'Practical implementation of the NIST AI Risk Management Framework tailored for banks, insurers, and asset managers. Covers govern, map, measure, and manage functions with real compliance case studies and a regulatory update from OCC/Fed perspectives.',
        tags: ['NIST AI RMF', 'Finance', 'Regulatory'],
        featured: false,
        registrationUrl: '#',
    },
    {
        id: 'static-6',
        title: 'Responsible AI for HR: Bias in Hiring Algorithms',
        category: 'Seminar',
        type: 'upcoming',
        date: new Date('2026-05-29'),
        time: '11:00 AM – 1:00 PM BST',
        location: 'London, UK + Online',
        attendees: '300',
        description: 'A specialist seminar on detecting and mitigating algorithmic bias in AI-driven recruitment and performance management tools. We examine NYC Local Law 144, EEOC guidance, and audit techniques using open-source fairness toolkits.',
        tags: ['Bias', 'HR Tech', 'Fairness'],
        featured: false,
        registrationUrl: '#',
    },
    {
        id: 'static-7',
        title: 'ISO/IEC 42001 Explained: Building an AI Management System',
        category: 'Webinar',
        type: 'past',
        date: new Date('2026-01-15'),
        time: '2:00 PM – 3:30 PM CET',
        location: 'Online (Teams)',
        attendees: '1,400+',
        description: 'A comprehensive overview of ISO/IEC 42001 — the world\'s first AI management system standard. Covered structure, clause-by-clause requirements, gap assessment methodology, and certification pathway. Over 1,400 risk professionals attended.',
        summary: 'Attendees received a detailed clause-by-clause breakdown and a downloadable gap-assessment template. Recording is available to Council members. 94% of participants rated the session "Excellent" or "Very Good".',
        tags: ['ISO 42001', 'Certification', 'AI Governance'],
        featured: false,
        recordingUrl: '#',
    },
    {
        id: 'static-8',
        title: 'AI Governance Workshop: Drafting Your Internal AI Policy',
        category: 'Workshop',
        type: 'past',
        date: new Date('2026-01-28'),
        time: '9:30 AM – 4:30 PM GMT',
        location: 'London, UK',
        attendees: '75',
        description: 'An in-depth, small-group workshop where legal, risk, and technology leaders collaboratively drafted an AI Acceptable Use Policy and AI Model Register using ARC-provided templates aligned to the EU AI Act and OECD AI Principles.',
        summary: 'Participants left with a customised draft AI policy and model inventory template. Three follow-up sessions were requested by participating organisations. The workshop was rated 4.9/5 by attendees.',
        tags: ['AI Policy', 'Internal Governance', 'Practical'],
        featured: false,
        recordingUrl: null,
    },
    {
        id: 'static-9',
        title: 'Episode 19: The Rise of Agentic AI and Enterprise Risk',
        category: 'Podcast',
        type: 'past',
        date: new Date('2026-02-05'),
        time: 'Available on all platforms',
        location: 'Spotify / Apple Podcasts / YouTube',
        attendees: '—',
        description: 'Dr. Priya Nair (Stanford HAI) joined us to discuss how autonomous AI agents introduce novel risk vectors — including goal misalignment, cascading failures, and accountability gaps — and what risk frameworks need to catch up.',
        summary: 'Streamed over 12,000 times in its first week. Listeners praised the actionable framing of agentic risk. Full transcript and show notes are available on the website.',
        tags: ['Agentic AI', 'Enterprise Risk', 'Stanford'],
        featured: false,
        recordingUrl: '#',
    },
    {
        id: 'static-10',
        title: 'AI Risk in Healthcare: Balancing Innovation & Patient Safety',
        category: 'Seminar',
        type: 'past',
        date: new Date('2026-02-12'),
        time: '10:00 AM – 12:30 PM EST',
        location: 'Boston, MA + Online',
        attendees: '420',
        description: 'A multi-speaker seminar examining how hospitals, biotech firms, and medtech companies are managing AI risks under FDA SaMD guidance, EU MDR, and emerging HIPAA interpretations. Case studies from real clinical AI deployments.',
        summary: 'Panellists included FDA advisors and senior compliance leads from Boston Children\'s Hospital and Philips Healthcare. A follow-up white paper based on the discussion is being drafted for Council members.',
        tags: ['Healthcare', 'SaMD', 'Regulation'],
        featured: true,
        recordingUrl: '#',
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateStr = (dObj) =>
    dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const getCategoryKey = (cat) => {
    if (!cat) return 'Webinar';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
};

// ─── EventCard ───────────────────────────────────────────────────────────────
const EventCard = ({ ev }) => {
    const defaultCatKey = getCategoryKey(ev.category);
    const meta = TYPE_META[defaultCatKey] || TYPE_META.Webinar;

    let dateStr = ev.date;
    if (ev.date instanceof Date) {
        dateStr = formatDateStr(ev.date);
    } else if (typeof ev.date === 'string' && ev.date.match(/^\d{4}-\d{2}-\d{2}/)) {
        dateStr = formatDateStr(new Date(ev.date));
    }

    return (
        <div
            style={{
                background: 'white', borderRadius: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transition: 'box-shadow 0.2s, transform 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,51,102,0.13)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {/* Thumbnail image */}
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden', flexShrink: 0 }}>
                <img
                    src={meta.image}
                    alt={defaultCatKey}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                />
                {/* Type badge over image */}
                <span style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                    fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px',
                    borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    {meta.icon} {defaultCatKey}
                </span>
                {ev.type === 'past' && (
                    <span style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.55)', color: 'white',
                        fontSize: '0.65rem', fontWeight: '700', padding: '3px 9px',
                        borderRadius: '20px',
                    }}>
                        PAST
                    </span>
                )}
            </div>

            {/* Card body */}
            <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} color={meta.color} /> {dateStr}
                </p>
                <h3 style={{ fontSize: '1.02rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.55rem', lineHeight: '1.4' }}>
                    {ev.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: '1.6', flexGrow: 1, marginBottom: '0.9rem' }}>
                    {ev.description || 'No description provided.'}
                </p>

                {/* Past event summary */}
                {ev.type === 'past' && ev.summary && (
                    <div style={{ background: '#F8FAFC', borderLeft: '3px solid #003366', borderRadius: '0 6px 6px 0', padding: '10px 12px', marginBottom: '0.9rem' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#003366', marginBottom: '4px' }}>Event Summary</p>
                        <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.55', margin: 0 }}>{ev.summary}</p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '0.9rem' }}>
                    {ev.time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.79rem', color: '#475569' }}>
                            <Clock size={12} color={meta.color} /> {ev.time}
                        </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.79rem', color: '#475569' }}>
                        <MapPin size={12} color={meta.color} /> {ev.location}
                    </span>
                    {ev.attendees && ev.attendees !== '—' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.79rem', color: '#475569' }}>
                            <Users size={12} color={meta.color} /> {ev.attendees} {ev.type === 'past' ? 'attended' : 'expected'}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {ev.tags && ev.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {ev.tags.map(tag => (
                            <span key={tag} style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.68rem', fontWeight: '600', padding: '2px 7px', borderRadius: '4px' }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ev.type === 'past' ? (
                        ev.recording_url || ev.recordingUrl || ev.link ? (
                            <a href={ev.recording_url || ev.recordingUrl || ev.link} target="_blank" rel="noopener noreferrer" style={{
                                flexGrow: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: '#003366', color: 'white', padding: '0.55rem 1rem',
                                borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none',
                            }}>
                                <Video size={13} /> Watch Recording <ArrowRight size={13} />
                            </a>
                        ) : (
                            <span style={{ flexGrow: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem 1rem', background: '#F1F5F9', color: '#94A3B8', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem' }}>
                                Recording Unavailable
                            </span>
                        )
                    ) : (
                        <>
                            {ev.teams_link && (
                                <a href={ev.teams_link} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    background: '#5B5FC7', color: 'white', padding: '0.55rem 1rem',
                                    borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none',
                                }}
                                    onMouseOver={e => e.currentTarget.style.background = '#4B4FB7'}
                                    onMouseOut={e => e.currentTarget.style.background = '#5B5FC7'}
                                >
                                    <Monitor size={13} /> Join on Teams
                                </a>
                            )}
                            <a href={ev.registrationUrl || ev.link || '#'} style={{
                                flexGrow: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: '#003366', color: 'white', padding: '0.55rem 1rem',
                                borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none',
                            }}
                                onMouseOver={e => e.currentTarget.style.background = '#00509E'}
                                onMouseOut={e => e.currentTarget.style.background = '#003366'}
                            >
                                Register Now <ArrowRight size={13} />
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Events Page ─────────────────────────────────────────────────────────
const Events = () => {
    const [eventsData, setEventsData] = useState(STATIC_EVENTS);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

    useEffect(() => {
        // Fetch events from backend and merge with STATIC_EVENTS
        fetch(`${API}/events`)
            .then(res => res.json())
            .then(data => {
                const combined = [...data, ...STATIC_EVENTS];
                setEventsData(combined);
            })
            .catch(err => console.error('Error fetching events:', err));
    }, []);

    const upcoming = eventsData.filter(e => e.type === 'upcoming');
    const past = eventsData.filter(e => e.type === 'past');

    const applyFilter = (list) =>
        activeCategory === 'All' ? list : list.filter(e => getCategoryKey(e.category) === activeCategory);

    const displayList = activeTab === 'upcoming' ? applyFilter(upcoming) : applyFilter(past);

    const featuredUpcoming = upcoming.filter(e => e.featured);

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>

            {/* ─── Hero ────────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #002244 0%, #003366 55%, #005599 100%)',
                padding: '5rem 2rem 4rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <Calendar size={24} color="#60A5FA" />
                        <span style={{ color: '#93C5FD', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Events & Learning</span>
                    </div>
                    <h1 style={{ color: 'white', fontSize: '2.9rem', fontWeight: '800', marginBottom: '1.1rem', lineHeight: '1.15' }}>
                        AI Governance Events<br />for Risk Professionals
                    </h1>
                    <p style={{ color: '#CBD5E1', fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '620px' }}>
                        Webinars, seminars, workshops, and podcast episodes designed for compliance leaders, risk officers, and technologists navigating the AI regulatory landscape.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => document.getElementById('all-events').scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#003366', padding: '0.7rem 1.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.92rem', border: 'none', cursor: 'pointer' }}>
                            Browse Events <ArrowRight size={15} />
                        </button>
                        <Link to="/membership" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0.7rem 1.75rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.92rem', textDecoration: 'none' }}>
                            Join the Council
                        </Link>
                    </div>
                </div>
            </div>

            {/* ─── Featured Upcoming ───────────────────────────────────────── */}
            {featuredUpcoming.length > 0 && (
                <div style={{ background: 'white', padding: '3rem 2rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '1.5rem' }}>⭐ Featured Upcoming Events</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
                            {featuredUpcoming.map(ev => {
                                const defaultCatKey = getCategoryKey(ev.category);
                                const meta = TYPE_META[defaultCatKey] || TYPE_META.Webinar;

                                let dateStr = ev.date;
                                if (ev.date instanceof Date) {
                                    dateStr = formatDateStr(ev.date);
                                } else if (typeof ev.date === 'string' && ev.date.match(/^\d{4}-\d{2}-\d{2}/)) {
                                    dateStr = formatDateStr(new Date(ev.date));
                                }

                                return (
                                    <div key={ev.id} style={{
                                        background: 'linear-gradient(135deg, #002244 0%, #004080 100%)',
                                        borderRadius: '16px', overflow: 'hidden',
                                        boxShadow: '0 8px 32px rgba(0,51,102,0.25)', display: 'flex', flexDirection: 'column',
                                    }}>
                                        <img src={meta.image} alt={defaultCatKey} style={{ width: '100%', height: '160px', objectFit: 'cover', opacity: 0.75 }} />
                                        <div style={{ padding: '1.75rem', color: 'white', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ background: meta.bg, color: meta.color, fontSize: '0.72rem', fontWeight: '700', padding: '3px 11px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start', marginBottom: '0.9rem' }}>
                                                {meta.icon} {defaultCatKey}
                                            </span>
                                            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.65rem', lineHeight: '1.3', color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{ev.title}</h3>
                                            <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: '1.65', flexGrow: 1, marginBottom: '1.25rem' }}>{ev.description}</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#BAE6FD', fontSize: '0.85rem' }}><Calendar size={13} /> {dateStr} {ev.time ? ` | ${ev.time}` : ''}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#BAE6FD', fontSize: '0.85rem' }}><MapPin size={13} /> {ev.location}</span>
                                            </div>
                                            <a href={ev.registrationUrl || ev.link || '#'} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'white', color: '#003366', padding: '0.6rem 1.4rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.87rem', textDecoration: 'none', alignSelf: 'flex-start' }}>
                                                Register Now <ArrowRight size={14} />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── All Events ──────────────────────────────────────────────── */}
            <div id="all-events" style={{ padding: '3.5rem 2rem 5rem' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>

                    {/* Tabs + filters */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>

                        {/* Past / Upcoming tabs */}
                        <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                            {[{ key: 'upcoming', label: `Upcoming (${upcoming.length})` }, { key: 'past', label: `Past (${past.length})` }].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                    padding: '7px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', border: 'none', cursor: 'pointer',
                                    background: activeTab === tab.key ? 'white' : 'transparent',
                                    color: activeTab === tab.key ? '#003366' : '#64748B',
                                    boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                                    transition: 'all 0.15s',
                                }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Category filter pills */}
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                            {ALL_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                                    padding: '5px 15px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                                    border: '1px solid', borderColor: activeCategory === cat ? '#003366' : '#CBD5E1',
                                    background: activeCategory === cat ? '#003366' : 'white',
                                    color: activeCategory === cat ? 'white' : '#475569',
                                    transition: 'all 0.15s',
                                }}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Count + heading */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                            {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '500' }}>{displayList.length} event{displayList.length !== 1 ? 's' : ''}</span>
                    </div>

                    {displayList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94A3B8' }}>
                            <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1.05rem' }}>No events found for this filter.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {displayList.map(ev => <EventCard key={ev.id} ev={ev} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── CTA ─────────────────────────────────────────────────────── */}
            <div style={{ background: '#1E293B', padding: '4rem 2rem', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '680px', margin: '0 auto' }}>
                    <h2 style={{ color: 'white', fontSize: '1.9rem', fontWeight: '800', marginBottom: '0.9rem' }}>Never Miss an Event</h2>
                    <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                        Council members receive priority registration, exclusive early-access invitations, and access to all session recordings in the members library.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/membership" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#003366', color: 'white', padding: '0.8rem 2rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none' }}>
                            Join the Council <ArrowRight size={15} />
                        </Link>
                        <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.2)', padding: '0.8rem 2rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.92rem', textDecoration: 'none' }}>
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Events;
