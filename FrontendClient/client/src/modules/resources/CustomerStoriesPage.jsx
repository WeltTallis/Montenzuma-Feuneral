import { Helmet } from 'react-helmet-async';
import Footer from '../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { Quote, Users, TrendingUp, CheckCircle, Clock, MessageCircle } from '../../utils/icons/icons';

const CustomerStoriesPage = () => {
    const navigate = useNavigate();

    // Empty stories array - no stories available yet
    const stories = [];

    // Statistics remain visible
    const stats = [
        { icon: Users, number: '500+', label: 'Organizations' },
        { icon: TrendingUp, number: '50K+', label: 'Members Served' },
        { icon: CheckCircle, number: '10K+', label: 'Claims Processed' },
        { icon: Quote, number: '98%', label: 'Satisfaction Rate' }
    ];

    return (
        <>
            <Helmet>
                <title>Customer Stories - Funeral Welfare Success Stories | RestPoint</title>
                <meta name="description" content="Read success stories from Kenyan churches, SACCOs, and chamas using RestPoint for funeral welfare management. See real results and transformations." />
                <link rel="canonical" href="https://restpoint.co.ke/resources/customer-stories" />
            </Helmet>

            <div style={{ minHeight: '100vh', background: '#FAF8F4' }}>
                {/* Hero Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #15171A 0%, #2E3F37 100%)',
                    color: '#FAF8F4',
                    padding: '5rem 2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 20% 50%, rgba(61,79,71,0.3) 0%, transparent 60%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(61,79,71,0.4)',
                            color: '#EBEFEF',
                            padding: '0.5rem 1rem',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            marginBottom: '1.5rem'
                        }}>
                            Coming Soon
                        </div>

                        <h1 style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 500,
                            lineHeight: 1.1,
                            marginBottom: '1.5rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Customer Success Stories
                        </h1>

                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.7,
                            opacity: 0.9,
                            maxWidth: '700px',
                            marginBottom: '2rem'
                        }}>
                            Real stories from organizations transforming their funeral welfare programs with RestPoint.
                            Check back soon for inspiring success stories.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
                    {/* Stats Overview */}
                    <section style={{ marginBottom: '4rem' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {stats.map((stat, idx) => {
                                const IconComponent = stat.icon;
                                return (
                                    <div key={idx} style={{
                                        background: 'white',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        border: '1px solid #E3DDD0',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                            color: '#FAF8F4',
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem'
                                        }}>
                                            <IconComponent size={24} />
                                        </div>
                                        <div style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: '#3D4F47',
                                            marginBottom: '0.5rem',
                                            fontFamily: "'Fraunces', serif"
                                        }}>{stat.number}</div>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: '#6B6862'
                                        }}>{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* No Stories Message */}
                    <section style={{ marginBottom: '4rem' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #E3DDD0',
                            padding: '4rem 2rem',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <Clock size={40} color="#FAF8F4" />
                            </div>
                            <h2 style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: '2rem',
                                color: '#15171A',
                                marginBottom: '1rem'
                            }}>
                                No Stories Yet
                            </h2>
                            <p style={{
                                fontSize: '1.1rem',
                                color: '#6B6862',
                                maxWidth: '500px',
                                margin: '0 auto 0.5rem',
                                lineHeight: 1.7
                            }}>
                                We're currently collecting inspiring stories from our users.
                            </p>
                            <p style={{
                                fontSize: '1rem',
                                color: '#8B7355',
                                maxWidth: '500px',
                                margin: '0 auto 2rem',
                                lineHeight: 1.6
                            }}>
                                Check back soon to see how organizations are transforming their funeral welfare management with RestPoint.
                            </p>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '1rem'
                            }}>
                                <button
                                    onClick={() => navigate('/register')}
                                    style={{
                                        background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                        color: '#FAF8F4',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '4px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Get Started
                                </button>
                                <button
                                    onClick={() => navigate('/contact')}
                                    style={{
                                        background: 'transparent',
                                        color: '#3D4F47',
                                        border: '1px solid #3D4F47',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '4px',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#3D4F47';
                                        e.currentTarget.style.color = '#FAF8F4';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#3D4F47';
                                    }}
                                >
                                    Share Your Story
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <div style={{
                        background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                        color: '#FAF8F4',
                        padding: '3rem',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            marginBottom: '1rem'
                        }}>
                            <MessageCircle size={28} color="#FAF8F4" />
                            <h3 style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: '2rem',
                                margin: 0
                            }}>
                                Got a Success Story?
                            </h3>
                        </div>
                        <p style={{
                            fontSize: '1.05rem',
                            lineHeight: 1.7,
                            opacity: 0.9,
                            maxWidth: '600px',
                            margin: '0 auto 2rem'
                        }}>
                            We'd love to hear how RestPoint has helped your organization. Share your story with us.
                        </p>
                        <button
                            onClick={() => navigate('/contact')}
                            style={{
                                background: '#FAF8F4',
                                color: '#3D4F47',
                                border: 'none',
                                padding: '1rem 2.5rem',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Share Your Story
                            <Quote size={18} />
                        </button>
                    </div>
                </div>

                <Footer navigate={navigate} />
            </div>
        </>
    );
};

export default CustomerStoriesPage;