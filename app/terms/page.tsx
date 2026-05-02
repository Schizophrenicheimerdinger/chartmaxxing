import Link from 'next/link'

const BG = '#0a0a0f'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#666680'
const BLUE = '#4d7cff'

export const metadata = {
  title: 'Terms of Service — Chartmaxxing',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 12px' }}>{title}</h2>
      <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function Terms() {
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
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: TEXT }}>Terms of Service</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: '0 0 56px' }}>Last updated: May 2, 2026</p>

        <Section title="The service">
          <p style={{ margin: 0 }}>Chartmaxxing is a web app that lets you create animated chart videos. A free account lets you build and preview charts. A Pro subscription unlocks MP4 export at 1080p with no watermark.</p>
        </Section>

        <Section title="Your account">
          <p style={{ margin: '0 0 12px' }}>You must provide a valid email address to create an account. You are responsible for keeping your password secure and for all activity under your account.</p>
          <p style={{ margin: 0 }}>We reserve the right to suspend accounts that violate these terms or are used for abusive or illegal purposes.</p>
        </Section>

        <Section title="Pro subscription">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Pro costs <strong style={{ color: TEXT }}>$4.99/month</strong>, billed monthly via Stripe.</li>
            <li style={{ marginBottom: 8 }}>Your subscription renews automatically each month until you cancel.</li>
            <li style={{ marginBottom: 8 }}>You can cancel at any time from your account settings. Access continues until the end of the current billing period.</li>
            <li>All payments are processed by Stripe. We do not store your payment details.</li>
          </ul>
        </Section>

        <Section title="Refunds">
          <p style={{ margin: 0 }}>We offer a full refund within <strong style={{ color: TEXT }}>7 days</strong> of your first charge if you are not satisfied. After that, refunds are at our discretion. To request one, email <a href="mailto:schizophrenicheimerdinger@gmail.com" style={{ color: BLUE }}>schizophrenicheimerdinger@gmail.com</a>.</p>
        </Section>

        <Section title="Your content">
          <p style={{ margin: 0 }}>You own the data and videos you create with Chartmaxxing. By using the service you confirm you have the right to use any data you input. We do not claim ownership of your content.</p>
        </Section>

        <Section title="Acceptable use">
          <p style={{ margin: '0 0 12px' }}>You agree not to use Chartmaxxing to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Create or distribute misleading, fraudulent, or defamatory content</li>
            <li style={{ marginBottom: 8 }}>Attempt to reverse-engineer, scrape, or overload the service</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </Section>

        <Section title="Limitation of liability">
          <p style={{ margin: 0 }}>Chartmaxxing is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid us in the past 12 months.</p>
        </Section>

        <Section title="Changes to these terms">
          <p style={{ margin: 0 }}>We may update these terms occasionally. We will notify you by email of any material changes. Continued use of the service after changes take effect constitutes acceptance of the new terms.</p>
        </Section>

        <Section title="Contact">
          <p style={{ margin: 0 }}>Questions? Email us at <a href="mailto:schizophrenicheimerdinger@gmail.com" style={{ color: BLUE }}>schizophrenicheimerdinger@gmail.com</a>.</p>
        </Section>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16 }}>
          <Link href="/privacy" style={{ color: BLUE, fontSize: 14, textDecoration: 'none' }}>View Privacy Policy →</Link>
        </div>
      </div>
    </div>
  )
}
