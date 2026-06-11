import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#090a0f',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#f3f4f6',
      padding: '1.5rem',
      overflow: 'hidden',
    }}>
      {/* Decorative blurred spots */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.2)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.15)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(17, 18, 27, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1.5rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}>
        {/* Animated lock icon container */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          marginBottom: '2rem',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
        }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' }}>🔒</span>
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #c7d2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Plataforma Maia v4
        </h1>
        
        <p style={{
          fontSize: '1rem',
          color: '#a5b4fc',
          fontWeight: 500,
          marginBottom: '1.5rem',
        }}>
          Acesso Restrito
        </p>

        <p style={{
          fontSize: '0.9rem',
          color: '#9ca3af',
          lineHeight: '1.6',
          marginBottom: '2.5rem',
        }}>
          Este sistema é privado e reservado exclusivamente aos integrantes da equipe de desenvolvimento e controllers da Maia.
          <br /><br />
          Para entrar, clique no link de acesso com o hash exclusivo enviado a você por e-mail, WhatsApp ou Telegram.
        </p>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '2rem',
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
          }}>
            Se você acha que isso é um erro, entre em contato com o administrador da rede ou consulte o arquivo de credenciais local.
          </p>
        </div>
      </div>
    </div>
  );
}
