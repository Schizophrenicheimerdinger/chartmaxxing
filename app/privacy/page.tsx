import Link from 'next/link'

const BG = '#0a0a0f'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#666680'
const BLUE = '#4d7cff'

export const metadata = {
  title: 'Privacy Policy — Chartmaxxing',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 12px' }}>{title}</h2>
      <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '0 32px', height: 56,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: TEXT, textDecoration: 'none' }}>
          Chartmaxxing
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: TEXT }}>Privacy Policy</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: '0 0 56px' }}>Last updated: May 2, 2026</p>

        <Section title="What we collect">
          <p style={{ margin: '0 0 12px' }}>When you create an account we collect your <strong style={{ color: TEXT }}>email address</strong>. When you subscribe to Pro we collect payment information — this is processed entirely by <strong style={{ color: TEXT }}>Stripe</strong> and we never see or store your card details.</p>
          <p style={{ margin: 0 }}>We also store the chart projects you create (titles, data, and settings) so you can access them across sessions.</p>
        </Section>

        <Section title="How we use it">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>To authenticate your account and keep your projects saved</li>
            <li style={{ marginBottom: 8 }}>To process your Pro subscription payments via Stripe</li>
            <li style={{ marginBottom: 8 }}>To send transactional emails (password reset, subscription receipts)</li>
            <li>We do not sell your data or use it for advertising</li>
          </ul>
        </Section>

        <Section title="Third-party services">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Supabase</strong> — stores your account and project data. See their privacy policy at supabase.com/privacy.</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: TEXT }}>Stripe</strong> — handles all payment processing. See their privacy policy at stripe.com/privacy.</li>
            <li><strong style={{ color: TEXT }}>Vercel</strong> — hosts the application. See their privacy policy at vercel.com/legal/privacy-policy.</li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p style={{ margin: 0 }}>We use cookies only to keep you logged in. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="Data retention">
          <p style={{ margin: 0 }}>Your account and projects are retained until you delete them or request account deletion. To delete your account, email us at the address below.</p>
        </Section>

        <Section title="Your rights">
          <p style={{ margin: '0 0 12px' }}>You can request access to, correction of, or deletion of your personal data at any time by emailing:</p>
          <a href="mailto:schizophrenicheimerdinger@gmail.com" style={{ color: BLUE }}>schizophrenicheimerdinger@gmail.com</a>
        </Section>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16 }}>
          <Link href="/terms" style={{ color: BLUE, fontSize: 14, textDecoration: 'none' }}>View Terms of Service →</Link>
        </div>
      </div>
    </div>
  )
}
