import React, { useState, useEffect } from 'react';
import Section from '../components/Section';
import { Shield, Award, Users, Linkedin, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const About = () => {
    const { API } = useAuth();
    const [team, setTeam] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    const TeamGrid = ({ members }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {members.map(member => (
                <div key={member.id}
                    onClick={() => setSelectedMember(member)}
                    style={{
                        backgroundColor: 'white', borderRadius: 'var(--radius-md)',
                        padding: '2rem', textAlign: 'center', border: '1px solid var(--border-light)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{
                        width: '100px', height: '100px', margin: '0 auto 1.5rem',
                        borderRadius: '50%', backgroundColor: 'var(--bg-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', fontSize: '2rem', fontWeight: 'bold', overflow: 'hidden'
                    }}>
                        {member.image_url ? (
                            <img src={`${API.replace('/api', '')}${member.image_url}`} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            member.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{member.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{member.role}</p>
                    {member.linkedin_url && (
                        <div onClick={e => e.stopPropagation()}>
                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                                <Linkedin size={16} /> LinkedIn
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API}/team`);
                if (res.ok) {
                    const data = await res.json();
                    setTeam(data);
                }
            } catch (err) {
                console.error('Failed to fetch team', err);
            }
        };
        fetchTeam();
    }, [API]);

    return (
        <>
            <Section background="light">
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ marginBottom: '1.5rem' }}>About the Council</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                        Advancing the global standard for Artificial Intelligence governance through independent research, rigorous assessment frameworks, and expert collaboration.
                    </p>
                </div>
            </Section>

            <Section>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem' }}>Our Mission</h2>
                            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                                To empower organizations to deploy Artificial Intelligence technology safely, ethically, and responsibly. We provide comprehensive insight reports and security assessments to help you align with global frameworks.
                            </p>
                            <p style={{ fontSize: '1.1rem' }}>
                                As an independent service provider, we operate free from vendor influence, focusing strictly on delivering actionable insights tailored to your framework dependencies.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '50%', height: 'fit-content' }}>
                                    <Shield size={32} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem' }}>Independence</h3>
                                    <p>Unbiased research and standards not tied to any specific tech platform or lobby.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '50%', height: 'fit-content' }}>
                                    <Award size={32} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem' }}>Excellence</h3>
                                    <p>Rigorous, peer-reviewed methodologies developed by world-class risk professionals.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '50%', height: 'fit-content' }}>
                                    <Users size={32} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem' }}>Collaboration</h3>
                                    <p>A global network of regulators, academics, and industry leaders.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            <Section background="light">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2>Council Components</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', borderTop: '4px solid var(--primary)' }}>
                        <h3 style={{ fontSize: '1.5rem' }}>Risk Advisory</h3>
                        <p>Providing specialized insight reports for organizations dependent on distinct AI frameworks to ensure robust security and compliance.</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', borderTop: '4px solid var(--accent)' }}>
                        <h3 style={{ fontSize: '1.5rem' }}>Research Institute</h3>
                        <p>Dedicated team publishing quarterly risk assessments and emerging threat analyses.</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', borderTop: '4px solid var(--text-secondary)' }}>
                        <h3 style={{ fontSize: '1.5rem' }}>Assessment Committee</h3>
                        <p>Oversees the certification of external auditors and validates compliance reports.</p>
                    </div>
                </div>
            </Section>

            {/* Our Team Section */}
            {team.length > 0 && (
                <Section>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2>Leadership & Contributors</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Meet the experts guiding our initiatives.</p>
                    </div>
                    <TeamGrid members={team.filter(m => {
                        try {
                            const cats = JSON.parse(m.categories || '["leadership"]');
                            return cats.includes('leadership');
                        } catch {
                            return m.category === 'leadership' || !m.category;
                        }
                    })} />

                    {team.some(m => {
                        try {
                            const cats = JSON.parse(m.categories || '["leadership"]');
                            return cats.includes('industrial');
                        } catch {
                            return m.category === 'industrial';
                        }
                    }) && (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '5rem' }}>
                                    <h2>Our Industrial AI Experts</h2>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Specialists in automation, manufacturing, and edge computing.</p>
                                </div>
                                <TeamGrid members={team.filter(m => {
                                    try {
                                        const cats = JSON.parse(m.categories || '["leadership"]');
                                        return cats.includes('industrial');
                                    } catch {
                                        return m.category === 'industrial';
                                    }
                                })} />
                            </>
                        )}
                </Section>
            )}
            {/* Team Member Modal */}
            {selectedMember && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                    onClick={() => setSelectedMember(null)}
                >
                    <div style={{
                        background: 'white', borderRadius: 'var(--radius-md)',
                        padding: '2.5rem', maxWidth: '600px', width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)', fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden'
                            }}>
                                {selectedMember.image_url ? (
                                    <img src={`${API.replace('/api', '')}${selectedMember.image_url}`} alt={selectedMember.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    selectedMember.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.75rem', marginBottom: '5px', color: 'var(--text-main)' }}>{selectedMember.name}</h2>
                                <p style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '600' }}>{selectedMember.role}</p>
                            </div>
                        </div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                            {selectedMember.description || "No detailed description available."}
                        </div>
                        {selectedMember.linkedin_url && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
                                <a href={selectedMember.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem' }}>
                                    <Linkedin size={20} /> Connect on LinkedIn
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default About;
