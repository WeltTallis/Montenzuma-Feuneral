import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Menu, X } from 'lucide-react';
import './AmaniLanding.css';


const faqs = [
  ['Who is Amani Cover for?', 'Amani Cover is for families and individuals planning ahead with Montezuma Monalisa Funeral Home. Our team will guide you through the available options.'],
  ['How do I make a claim?', 'Contact Montezuma Monalisa Funeral Home directly and our care team will explain the next steps and documents needed.'],
  ['Can I speak to someone before applying?', 'Yes. Start with a conversation and our team will answer your questions without pressure.'],
];

export default function AmaniCover() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="amani-landing">
      <main id="top">
        <header className="site-header">
          <nav className="nav frame" aria-label="Main navigation">
            <a className="wordmark" href="#top" aria-label="Amani Cover home">
              <span className="wordmark-symbol">A</span>
              <span className="wordmark-text">amani<small>cover</small></span>
            </a>
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
            <div className={`nav-menu ${menuOpen ? 'nav-menu-open' : ''}`}>
              <a href="#about">Our approach</a>
              <a href="#cover">Your cover</a>
              <a href="#support">Support</a>
              <a className="header-apply" href="#contact">Get started <ArrowUpRight size={16} /></a>
            </div>
          </nav>
        </header>

        <section className="hero-new">
          <div className="hero-photo" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="frame hero-layout">
            <div className="hero-copy-new">
              <p className="kicker">Montezuma Monalisa Funeral Home</p>
              <h1>Peace for today.<br /><i>Care for tomorrow.</i></h1>
              <p className="hero-lede">Amani means peace in Kiswahili. Amani Cover helps you plan with dignity, clarity and a trusted hand beside your family.</p>
              <div className="hero-buttons">
                <a className="primary-button" href="#contact">Explore Amani Cover <ArrowUpRight size={18} /></a>
                <a className="quiet-link" href="#about">Why families choose Amani</a>
              </div>
            </div>
            <div className="hero-caption">
              <span className="caption-line" />
              <span>Thoughtful planning<br />for the people you love</span>
            </div>
          </div>
          <div className="hero-index frame"><span>01</span><span className="index-rule" /><span>AMANI / 2026</span></div>
        </section>
        <section className="quick-actions frame" aria-label="Amani Cover services">
          <p className="quick-label">How can we help?</p>
          <div className="quick-action-grid">
            <a href="#contact"><span>Apply for cover</span><ArrowUpRight size={19} /></a>
            <a href="#contact"><span>Make a payment</span><ArrowUpRight size={19} /></a>
            <a href="#contact"><span>Start a claim</span><ArrowUpRight size={19} /></a>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="frame split-layout">
            <div className="section-number">02 <span>/</span></div>
            <div>
              <p className="kicker blue">A different kind of assurance</p>
              <h2>When planning feels like <i>an act of love.</i></h2>
              <p className="body-copy">The most meaningful care starts before it is needed. Amani Cover gives families a clear way to prepare for a funeral, so hard decisions do not have to be made in the hardest moments.</p>
              <p className="body-copy">We bring the trusted care of Montezuma Monalisa Funeral Home together with a simple, human approach to planning.</p>
              <a className="underlined-link" href="#cover">See what your plan includes <ArrowUpRight size={16} /></a>
            </div>
          </div>
        </section>

        <section className="image-break">
          <div className="image-break-photo" aria-hidden="true" />
          <div className="image-break-note">
            <span>WITH DIGNITY</span>
            <strong>Dignity, care<br />and peace of mind.</strong>
          </div>
        </section>


        <section className="cover-section" id="cover">
          <div className="frame">
            <div className="section-intro">
              <div>
                <p className="kicker blue">What your plan gives you</p>
                <h2>Clarity when<br /><i>it matters.</i></h2>
              </div>
              <p className="body-copy">Your family deserves a plan that is easy to understand and support that feels close. Begin with a conversation about what matters to you.</p>
            </div>
            <div className="cover-list">
              <article><span>01</span><div><h3>Clear guidance</h3><p>Talk through your wishes and available cover with a team that listens carefully and explains things plainly.</p></div><Check size={18} /></article>
              <article><span>02</span><div><h3>Trusted funeral care</h3><p>Plan with Montezuma Monalisa Funeral Home, a familiar name for compassionate, dignified service.</p></div><Check size={18} /></article>
              <article><span>03</span><div><h3>Support when needed</h3><p>When your family needs help, you have a direct place to turn for the next step.</p></div><Check size={18} /></article>
            </div>
          </div>
        </section>

        <section className="support-section" id="support">
          <div className="frame support-layout">
            <div>
              <p className="kicker">A calm next step</p>
              <h2>Let&apos;s talk<br /><i>without pressure.</i></h2>
              <p className="light-copy">You do not need to know exactly what you need yet. Our team is here to listen and help you take one clear step at a time.</p>
              <a className="light-outline" href="#contact">Speak with our team <ArrowUpRight size={17} /></a>
            </div>
            <div className="support-aside">
              <span className="support-mark">&ldquo;</span>
              <p>Planning ahead leaves more space for what matters most: remembering, gathering and being together.</p>
              <span className="support-rule" />
            </div>
          </div>
        </section>


        <section className="faq-section">
          <div className="frame faq-layout">
            <div>
              <p className="kicker blue">Questions, answered</p>
              <h2>A little more<br /><i>peace of mind.</i></h2>
            </div>
            <div>
              {faqs.map(([question, answer], index) => (
                <div className="faq-row" key={question}>
                  <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                    <span>{question}</span>
                    <ChevronDown className={openFaq === index ? 'faq-open' : ''} size={18} />
                  </button>
                  {openFaq === index && <p>{answer}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="frame contact-layout">
            <div>
              <p className="kicker blue">Begin here</p>
              <h2>Make a plan<br /><i>with care.</i></h2>
              <p className="body-copy">Leave your details and the Amani Cover team will get back to you.</p>
            </div>
            {submitted ? (
              <div className="submitted">
                <Check size={24} />
                <h3>Thank you.</h3>
                <p>Your request has been received. We&apos;ll be in touch with care.</p>
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
                <label>Name<input required name="name" placeholder="Your full name" /></label>
                <label>Phone<input required name="phone" type="tel" placeholder="Your phone number" /></label>
                <label className="form-wide">
                  How can we help?
                  <select defaultValue="" name="help" required>
                    <option value="" disabled>Select one</option>
                    <option>Tell me about Amani Cover</option>
                    <option>Make a payment</option>
                    <option>Start a claim</option>
                  </select>
                </label>
                <button className="primary-button form-wide" type="submit">Request a conversation <ArrowUpRight size={18} /></button>
                <p className="privacy-note">Your information is private and only used to respond to your request.</p>
              </form>
            )}
          </div>
        </section>

        <footer className="site-footer">
          <div className="frame footer-top">
            <a className="wordmark" href="#top">
              <span className="wordmark-symbol">A</span>
              <span className="wordmark-text">amani<small>cover</small></span>
            </a>
            <p>Peace, planned with care.</p>
            <div className="footer-links">
              <a href="#about">Our approach</a>
              <a href="#contact">Contact</a>
              <a href="#top">Back to top &uarr;</a>
            </div>
          </div>
          <div className="frame footer-bottom">
            <span>&copy; 2026 Amani Cover</span>
            <span>A service of Montezuma Monalisa Funeral Home</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

