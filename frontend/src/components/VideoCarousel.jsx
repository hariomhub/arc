import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize2, X } from 'lucide-react';



// ── Helpers ──────────────────────────────────────────────────────────────────
function isYouTube(url) {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function youtubeId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function youtubeEmbed(url) {
    const id = youtubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : null;
}

function youtubeThumbnail(url) {
    const id = youtubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

// ── Single Video Card ────────────────────────────────────────────────────────
const VideoCard = ({ video, isActive, onClick }) => {
    const isYT = isYouTube(video.source_url);
    const thumb = video.thumbnail_url ||
        (isYT ? youtubeThumbnail(video.source_url) : null);

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isActive ? '2px solid #4F8EF7' : '2px solid transparent',
                transition: 'all 0.25s ease',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isActive
                    ? '0 0 0 3px rgba(79,142,247,0.25), 0 8px 32px rgba(0,0,0,0.4)'
                    : '0 4px 16px rgba(0,0,0,0.3)',
                aspectRatio: '16/9',
                background: '#0a0a0a',
                flexShrink: 0,
            }}
        >
            {thumb ? (
                <img
                    src={thumb}
                    alt={video.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #0f2444 0%, #1a3a5c 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Play size={28} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
                </div>
            )}
            {/* Dark overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: isActive
                    ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)',
                transition: 'background 0.25s'
            }} />
            {/* Play icon */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    width: isActive ? '44px' : '36px',
                    height: isActive ? '44px' : '36px',
                    borderRadius: '50%',
                    background: isActive ? '#4F8EF7' : 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.25s',
                    border: '1.5px solid rgba(255,255,255,0.3)'
                }}>
                    <Play size={isActive ? 16 : 13} color="white" fill="white" style={{ marginLeft: '2px' }} />
                </div>
            </div>
            {/* Title */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '10px 12px 8px',
            }}>
                <p style={{
                    margin: 0, color: 'white',
                    fontSize: '0.72rem', fontWeight: '600',
                    lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>
                    {video.title}
                </p>
            </div>
        </div>
    );
};

// ── Main Player ──────────────────────────────────────────────────────────────
const VideoPlayer = ({ video, onClose }) => {
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(false);
    const isYT = isYouTube(video.source_url);
    const isBlobOrLocal = video.file_path && !isYouTube(video.file_path);

    return (
        <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#000',
            aspectRatio: '16/9',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}>
            {isYT ? (
                <iframe
                    src={youtubeEmbed(video.source_url)}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={video.title}
                />
            ) : (isBlobOrLocal || video.file_path) ? (
                <video
                    ref={videoRef}
                    src={video.file_path}
                    controls
                    autoPlay
                    muted={muted}
                    style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
                />
            ) : video.source_url ? (
                <iframe
                    src={video.source_url}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title={video.title}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem'
                }}>
                    No video source available
                </div>
            )}
        </div>
    );
};

// ── Main Carousel Component ──────────────────────────────────────────────────
const VideoCarousel = ({ API = '/api' }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIdx, setActiveIdx] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [thumbOffset, setThumbOffset] = useState(0);
    const thumbsRef = useRef(null);

    const THUMB_VISIBLE = 4; // visible thumbnails at once

    useEffect(() => {
        fetch(`${API}/resources/videos`)
            .then(r => r.json())
            .then(data => {
                setVideos(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const active = videos[activeIdx] || null;

    const goTo = useCallback((idx) => {
        setActiveIdx(idx);
        setPlaying(false);
        // Auto-scroll thumbnails to keep active visible
        const maxOffset = Math.max(0, videos.length - THUMB_VISIBLE);
        const newOffset = Math.min(maxOffset, Math.max(0, idx - 1));
        setThumbOffset(newOffset);
    }, [videos.length]);

    const prev = () => goTo((activeIdx - 1 + videos.length) % videos.length);
    const next = () => goTo((activeIdx + 1) % videos.length);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') setPlaying(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeIdx, videos.length]);

    if (loading) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #0a0f1e 0%, #0f2444 100%)',
                padding: '5rem 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '3px solid rgba(79,142,247,0.3)',
                    borderTopColor: '#4F8EF7',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!videos.length) return null;

    return (
        <section style={{
            background: 'linear-gradient(160deg, #060d1a 0%, #0c1d33 50%, #071020 100%)',
            padding: '5rem 0 4rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background glow effects */}
            <div style={{
                position: 'absolute', top: '-20%', left: '30%',
                width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', right: '20%',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>

                {/* Section header */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(79,142,247,0.12)',
                        border: '1px solid rgba(79,142,247,0.25)',
                        borderRadius: '100px', padding: '5px 14px',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#4F8EF7',
                            animation: 'pulse 2s infinite'
                        }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4F8EF7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Video Library
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{
                                margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                                fontWeight: '800', color: 'white', lineHeight: 1.2,
                                letterSpacing: '-0.02em'
                            }}>
                                Featured Content
                            </h2>
                            <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                                {videos.length} video{videos.length !== 1 ? 's' : ''} · AI governance insights & briefings
                            </p>
                        </div>
                        {videos.length > 1 && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={prev} style={navBtnStyle}>
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={next} style={navBtnStyle}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content: Player + Info side by side */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 340px',
                    gap: '2rem',
                    alignItems: 'start',
                    marginBottom: '2rem',
                }}>
                    {/* Player area */}
                    <div>
                        {playing ? (
                            <div style={{ position: 'relative' }}>
                                <VideoPlayer video={active} />
                                <button
                                    onClick={() => setPlaying(false)}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(0,0,0,0.6)', border: 'none',
                                        borderRadius: '50%', width: '36px', height: '36px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'white', zIndex: 10,
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    title="Close player"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            // Thumbnail with big play button
                            <div
                                onClick={() => setPlaying(true)}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#0a0a0a',
                                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.005)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {/* Thumbnail */}
                                {(active?.thumbnail_url || (isYouTube(active?.source_url) && youtubeThumbnail(active?.source_url))) ? (
                                    <img
                                        src={active?.thumbnail_url || youtubeThumbnail(active?.source_url)}
                                        alt={active?.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        background: 'linear-gradient(135deg, #0f2444 0%, #1a3a5c 50%, #0f1f3d 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Play size={64} color="rgba(255,255,255,0.15)" fill="rgba(255,255,255,0.15)" />
                                    </div>
                                )}

                                {/* Gradient overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
                                }} />

                                {/* Big play button */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: '72px', height: '72px', borderRadius: '50%',
                                        background: 'rgba(79,142,247,0.9)',
                                        backdropFilter: 'blur(12px)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 0 0 12px rgba(79,142,247,0.2), 0 8px 32px rgba(79,142,247,0.4)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}>
                                        <Play size={28} color="white" fill="white" style={{ marginLeft: '4px' }} />
                                    </div>
                                </div>

                                {/* Duration badge if available */}
                                <div style={{
                                    position: 'absolute', bottom: '16px', left: '16px', right: '16px',
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <p style={{
                                            margin: '0 0 4px', color: 'rgba(255,255,255,0.6)',
                                            fontSize: '0.72rem', fontWeight: '600',
                                            textTransform: 'uppercase', letterSpacing: '0.06em'
                                        }}>
                                            {activeIdx + 1} / {videos.length}
                                        </p>
                                        <h3 style={{
                                            margin: 0, color: 'white',
                                            fontSize: 'clamp(0.95rem, 2vw, 1.25rem)',
                                            fontWeight: '700', lineHeight: 1.3,
                                            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                                        }}>
                                            {active?.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info panel */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        backdropFilter: 'blur(12px)',
                        minHeight: '200px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(79,142,247,0.15)',
                                border: '1px solid rgba(79,142,247,0.2)',
                                borderRadius: '100px', padding: '3px 10px',
                                marginBottom: '1rem'
                            }}>
                                <Play size={10} color="#4F8EF7" fill="#4F8EF7" />
                                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#4F8EF7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Video
                                </span>
                            </div>
                            <h3 style={{
                                margin: '0 0 0.75rem', color: 'white',
                                fontSize: '1.1rem', fontWeight: '700', lineHeight: 1.4
                            }}>
                                {active?.title}
                            </h3>
                            {active?.summary && (
                                <p style={{
                                    margin: 0, color: 'rgba(255,255,255,0.55)',
                                    fontSize: '0.85rem', lineHeight: 1.65,
                                    display: '-webkit-box', WebkitLineClamp: 5,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {active.summary}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setPlaying(true)}
                            style={{
                                marginTop: '1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                width: '100%', padding: '0.75rem',
                                background: '#4F8EF7', border: 'none',
                                borderRadius: '10px', color: 'white',
                                fontWeight: '700', fontSize: '0.875rem',
                                cursor: 'pointer', transition: 'background 0.2s, transform 0.1s',
                                fontFamily: 'inherit'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#3a7de8'}
                            onMouseOut={e => e.currentTarget.style.background = '#4F8EF7'}
                        >
                            <Play size={15} fill="white" /> Watch Now
                        </button>
                    </div>
                </div>

                {/* Thumbnail strip */}
                {videos.length > 1 && (
                    <div style={{ position: 'relative' }}>
                        {/* Fade edges */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '40px',
                            background: 'linear-gradient(to right, #060d1a, transparent)',
                            zIndex: 2, pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
                            background: 'linear-gradient(to left, #060d1a, transparent)',
                            zIndex: 2, pointerEvents: 'none'
                        }} />

                        <div
                            ref={thumbsRef}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(videos.length, THUMB_VISIBLE)}, 1fr)`,
                                gap: '12px',
                                overflow: 'hidden',
                            }}
                        >
                            {videos.slice(thumbOffset, thumbOffset + THUMB_VISIBLE).map((v, i) => (
                                <VideoCard
                                    key={v.id}
                                    video={v}
                                    isActive={thumbOffset + i === activeIdx}
                                    onClick={() => goTo(thumbOffset + i)}
                                />
                            ))}
                        </div>

                        {/* Dot indicators */}
                        <div style={{
                            display: 'flex', justifyContent: 'center',
                            gap: '6px', marginTop: '1.25rem'
                        }}>
                            {videos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    style={{
                                        width: i === activeIdx ? '20px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: i === activeIdx ? '#4F8EF7' : 'rgba(255,255,255,0.2)',
                                        border: 'none', cursor: 'pointer', padding: 0,
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @media (max-width: 900px) {
                    .video-carousel-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
};

const navBtnStyle = {
    width: '38px', height: '38px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
};

export default VideoCarousel;