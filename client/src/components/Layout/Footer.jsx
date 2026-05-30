import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

// lucide-react removed brand icons — inline SVGs keep them recognizable without adding deps.
const brandIconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg' };

const Facebook = (props) => (
  <svg {...brandIconProps} {...props}>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const Instagram = (props) => (
  <svg {...brandIconProps} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
  </svg>
);

const Twitter = (props) => (
  <svg {...brandIconProps} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const Linkedin = (props) => (
  <svg {...brandIconProps} {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const Youtube = (props) => (
  <svg {...brandIconProps} {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Footer = () => {
  const year = new Date().getFullYear();

  const colA = [
    { label: 'Destinations', to: '/destinations' },
    { label: 'Explore (AI)', to: '/explore' },
    { label: 'Blog', to: '/blog' },
    { label: 'About us', to: '/contact' },
    { label: 'Contact us', to: '/contact' },
  ];

  const colB = [
    { label: 'Booking guide', to: '/destinations' },
    { label: 'Travel tips', to: '/blog' },
    { label: 'Support', to: '/support' },
    { label: 'Visa info', to: '/contact' },
    { label: 'Partnerships', to: '/contact' },
  ];

  const socials = [
    { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { Icon: Twitter, href: 'https://twitter.com', label: 'X / Twitter' },
    { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { Icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer
      className="system-footer"
      style={{ background: 'var(--obsidian, #0D0A02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div style={{ padding: '4rem 8% 2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gap: '3rem',
            gridTemplateColumns: 'minmax(240px, 2fr) 1fr 1fr',
          }}
          className="footer-top-grid"
        >
          {/* BRANDING COLUMN */}
          <div>
            <h3
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '6px',
                color: 'var(--himalayan-mist, #F4F2F3)',
                marginBottom: '1.25rem',
              }}
            >
              YAATRI
            </h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: 360 }}>
              Discover Nepal through real journeys, real guides, and real terrain data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', opacity: 0.75 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} style={{ color: 'var(--hill-green, #059D72)' }} />
                Lalitpur, Bagmati, Nepal
              </span>
              <a
                href="tel:+97714000000"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
              >
                <Phone size={14} style={{ color: 'var(--hill-green, #059D72)' }} />
                +977 1-400-0000
              </a>
              <a
                href="mailto:support@yaatri.np"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
              >
                <Mail size={14} style={{ color: 'var(--hill-green, #059D72)' }} />
                support@yaatri.np
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 36,
                    height: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    color: 'var(--himalayan-mist, #F4F2F3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--hill-green, #059D72)';
                    e.currentTarget.style.color = 'var(--hill-green, #059D72)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'var(--himalayan-mist, #F4F2F3)';
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* COLUMN A */}
          <div>
            <h4
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '3px',
                color: 'var(--hill-green, #059D72)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Explore
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {colA.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ fontSize: '0.85rem', opacity: 0.75, color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.75)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN B */}
          <div>
            <h4
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '3px',
                color: 'var(--hill-green, #059D72)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Resources
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {colB.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ fontSize: '0.85rem', opacity: 0.75, color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.75)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SUB-FOOTER */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.75rem',
            opacity: 0.55,
          }}
        >
          <span>© {year} Yaatri Hub. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/policies" style={{ color: 'inherit', textDecoration: 'none' }}>Policies & contract</Link>
            <Link to="/policies" style={{ color: 'inherit', textDecoration: 'none' }}>Cancellation terms</Link>
            <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
