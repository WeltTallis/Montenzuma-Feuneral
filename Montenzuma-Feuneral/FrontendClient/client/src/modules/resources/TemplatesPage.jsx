import { Helmet } from 'react-helmet-async';
import Footer from '../../components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Users, ClipboardList, CheckCircle, Clock, Zap, Shield, Cloud, Settings, ArrowRight } from '../../utils/icons/icons';

const TemplatesPage = () => {
    const navigate = useNavigate();

    // Empty templates array - no templates available yet
    const templates = [];

    // Coming soon integrations
    const integrations = [
        {
            icon: Cloud,
            title: 'Cloud Storage Integration',
            description: 'Seamless integration with Google Drive, Dropbox, and OneDrive for automatic backup and file management.'
        },
        {
            icon: Zap,
            title: 'M-Pesa API Integration',
            description: 'Automated contribution collection and payment processing directly integrated with M-Pesa.'
        },
        {
            icon: Shield,
            title: 'Digital Signatures',
            description: 'Secure digital signature support for all forms and documents. No more printing and scanning.'
        },
        {
            icon: Settings,
            title: 'Custom Workflow Builder',
            description: 'Create custom approval workflows, notification rules, and automation for your organization.'
        }
    ];

    return (
        <>
            <Helmet>
                <title>Free Funeral Welfare Templates & Forms | RestPoint</title>
                <meta name="description" content="Download free funeral welfare management templates including member registration forms, contribution tracking sheets, claim forms, and committee minutes templates." />
                <link rel="canonical" href="https://restpoint.co.ke/resources/templates" />
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
                            Resources
                        </div>

                        <h1 style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 500,
                            lineHeight: 1.1,
                            marginBottom: '1.5rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Templates & Integrations
                        </h1>

                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.7,
                            opacity: 0.9,
                            maxWidth: '700px',
                            marginBottom: '2rem'
                        }}>
                            Explore our upcoming template library and powerful integrations designed to streamline your funeral welfare management.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
                    {/* No Templates Message */}
                    <section style={{ marginBottom: '4rem' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #E3DDD0',
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Background decoration */}
                            <div style={{
                                position: 'absolute',
                                top: -100,
                                right: -100,
                                width: 300,
                                height: 300,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(61,79,71,0.05) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: -80,
                                left: -80,
                                width: 250,
                                height: 250,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(139,115,85,0.05) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />

                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <FileText size={40} color="#FAF8F4" />
                            </div>
                            <h2 style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: '2rem',
                                color: '#15171A',
                                marginBottom: '1rem',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                Templates Coming Soon
                            </h2>
                            <p style={{
                                fontSize: '1.1rem',
                                color: '#6B6862',
                                maxWidth: '550px',
                                margin: '0 auto 0.5rem',
                                lineHeight: 1.7,
                                position: 'relative',
                                zIndex: 1
                            }}>
                                We're working on a comprehensive library of professionally designed templates for funeral welfare management.
                            </p>
                            <p style={{
                                fontSize: '1rem',
                                color: '#8B7355',
                                maxWidth: '500px',
                                margin: '0 auto 2rem',
                                lineHeight: 1.6,
                                position: 'relative',
                                zIndex: 1
                            }}>
                                Our templates will include member registration, contribution tracking, claim forms, committee minutes, and more.
                            </p>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '1rem',
                                position: 'relative',
                                zIndex: 1
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
                                        transition: 'transform 0.2s',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Get Early Access
                                    <ArrowRight size={18} />
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
                                    Request a Template
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Integrations Coming Soon */}
                    <section style={{ marginBottom: '4rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            marginBottom: '0.5rem'
                        }}>
                            <Clock size={28} color="#3D4F47" />
                            <h2 style={{
                                fontFamily: "'Fraunces', serif",
                                fontSize: '2rem',
                                color: '#15171A',
                                margin: 0,
                                textAlign: 'center'
                            }}>
                                Integrations Coming Soon
                            </h2>
                        </div>
                        <p style={{
                            textAlign: 'center',
                            color: '#6B6862',
                            marginBottom: '2rem',
                            fontSize: '1.05rem'
                        }}>
                            Powerful integrations to connect RestPoint with the tools you already use
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {integrations.map((integration, idx) => {
                                const IconComponent = integration.icon;
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: 'white',
                                            padding: '2rem',
                                            borderRadius: '12px',
                                            border: '1px solid #E3DDD0',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Coming Soon Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                            color: '#FAF8F4',
                                            padding: '0.25rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Coming Soon
                                        </div>

                                        <div style={{
                                            background: 'linear-gradient(135deg, #3D4F47 0%, #2E3F37 100%)',
                                            color: '#FAF8F4',
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <IconComponent size={28} />
                                        </div>

                                        <h3 style={{
                                            fontFamily: "'Fraunces', serif",
                                            fontSize: '1.2rem',
                                            color: '#15171A',
                                            marginBottom: '0.8rem'
                                        }}>
                                            {integration.title}
                                        </h3>

                                        <p style={{
                                            fontSize: '0.95rem',
                                            color: '#6B6862',
                                            lineHeight: 1.6,
                                            margin: 0
                                        }}>
                                            {integration.description}
                                        </p>
                                    </div>
                                );
                            })}
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
                        <h3 style={{
                            fontFamily: "'Fraunces', serif",
                            fontSize: '2rem',
                            marginBottom: '1rem'
                        }}>
                            Don't Wait for Templates - Start Now
                        </h3>
                        <p style={{
                            fontSize: '1.05rem',
                            lineHeight: 1.7,
                            opacity: 0.9,
                            maxWidth: '600px',
                            margin: '0 auto 2rem'
                        }}>
                            RestPoint already includes all these forms built-in and automated. Start managing your funeral welfare program today.
                        </p>
                        <button
                            onClick={() => navigate('/register')}
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
                            Start Free Trial
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <Footer navigate={navigate} />
            </div>
        </>
    );
};

export default TemplatesPage;