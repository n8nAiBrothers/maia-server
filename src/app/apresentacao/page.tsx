'use client';
import React, { useState, useEffect } from 'react';

const slides = [
  {
    title: "Maia OS V4.0",
    subtitle: "A Nova Era da Inteligência Waia88",
    content: "O Orquestrador Autônomo Definitivo. Mais que um assistente: o coração tecnológico do nosso time para transformar ideias em produtos reais em questão de horas. A Maia agora é totalmente agêntica.",
    icon: "✨",
    bgClass: "bg-slide-1"
  },
  {
    title: "Inteligência Multimodal & Voz",
    subtitle: "Sem Atrito. 100% Fluido.",
    content: "Você não precisa mais digitar. Pressione o microfone: a Maia transcreve sua fala usando Web Speech API e te responde em viva-voz. Envie fotos, PDFs ou links, e a Maia usará a IA adequada (Ollama Local, Gemini Flash, Claude Pro) para analisar tudo instantaneamente.",
    icon: "🎙️",
    bgClass: "bg-slide-2"
  },
  {
    title: "As 91 Skills do Cloud Code",
    subtitle: "Cérebro Local e Escalável",
    content: "O nosso Segundo Cérebro (Obsidian) cresce a cada interação. Hoje, a Maia nasce com 91 Skills (ex: firebase-auth, chrome-devtools, alphafold, kanban-automation). Qualquer novo recurso solicitado por vocês se torna uma Nova Skill permanentemente injetada no sistema.",
    icon: "🧠",
    bgClass: "bg-slide-3"
  },
  {
    title: "Orquestração Autônoma do Kanban",
    subtitle: "Menos burocracia, mais ação",
    content: "Se estivermos debatendo um novo projeto (como o App do CRM, Bot de Notas Fiscais ou a automação do N8N), a Maia não pergunta: ela invoca as ferramentas em background, cria o Projeto e injeta as tarefas no seu Dashboard com suas hashtags exclusivas.",
    icon: "📊",
    bgClass: "bg-slide-4"
  },
  {
    title: "O Bypass das Gigantes Tech",
    subtitle: "LLMs de ponta a Custo Zero",
    content: "Cansado de limite de tokens de $5? O nosso Intelligent Router desvia tarefas diárias para o Gemma 2b (Local) e aciona o Claude CLI de forma automatizada por baixo dos panos para arquitetura pesada. Segurança 100% garantida.",
    icon: "🛡️",
    bgClass: "bg-slide-5"
  },
  {
    title: "O Pacto de Evolução",
    subtitle: "Nosso Investimento no Futuro",
    content: "Nossa contribuição mensal não é custo: é combustível. É esse pacto que garante ao time da Waia88 acesso infinito e instantâneo às mentes artificiais mais brilhantes do planeta. O sucesso do time depende dessa engrenagem não parar.",
    icon: "🤝",
    bgClass: "bg-slide-6"
  }
];

export default function ApresentacaoSlides() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = slides[currentSlide];

  return (
    <div style={styles.container}>
      {/* Background Pulse / Gradient for current slide */}
      <div style={styles.backgroundGlow} key={currentSlide} className="fade-in-glow" />

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
      </div>

      <div style={styles.contentWrapper} key={currentSlide} className="slide-content">
        <div style={styles.icon}>{slide.icon}</div>
        <h2 style={styles.subtitle}>{slide.subtitle}</h2>
        <h1 style={styles.title}>{slide.title}</h1>
        <p style={styles.text}>{slide.content}</p>
      </div>

      <div style={styles.controls}>
        <button 
          onClick={prevSlide} 
          disabled={currentSlide === 0} 
          style={{ ...styles.button, opacity: currentSlide === 0 ? 0.3 : 1 }}
        >
          ← Anterior
        </button>
        <span style={styles.pageCount}>{currentSlide + 1} / {slides.length}</span>
        <button 
          onClick={nextSlide} 
          disabled={currentSlide === slides.length - 1} 
          style={{ ...styles.button, opacity: currentSlide === slides.length - 1 ? 0.3 : 1 }}
        >
          Próximo →
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.2; }
        }
        .slide-content {
          animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fade-in-glow {
          animation: subtlePulse 8s infinite ease-in-out;
        }
        html, body {
          overflow: hidden;
          background-color: #020617;
        }
      `}} />
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#020617',
    color: '#F8FAFC',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  backgroundGlow: {
    position: 'absolute' as const,
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80vw', height: '80vw',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 60%)',
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  progressContainer: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
    transition: 'width 0.4s ease',
  },
  contentWrapper: {
    zIndex: 10,
    maxWidth: '900px',
    textAlign: 'center' as const,
    padding: '0 2rem',
  },
  icon: {
    fontSize: '5rem',
    marginBottom: '2rem',
    filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))',
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    marginBottom: '1rem',
  },
  title: {
    fontSize: '4.5rem',
    fontWeight: '800',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    marginBottom: '2.5rem',
    background: 'linear-gradient(to bottom right, #FFFFFF 0%, #94A3B8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  text: {
    fontSize: '1.5rem',
    color: '#94A3B8',
    lineHeight: '1.6',
    maxWidth: '800px',
    margin: '0 auto',
  },
  controls: {
    position: 'absolute' as const,
    bottom: '3rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    zIndex: 10,
  },
  pageCount: {
    fontSize: '1rem',
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: '0.1em',
  },
  button: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
