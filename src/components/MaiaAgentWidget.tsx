'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MaiaAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [autoStartMic, setAutoStartMic] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const savedSetting = localStorage.getItem('maia_autoStartMic');
    if (savedSetting === 'true') {
      setAutoStartMic(true);
    }
  }, []);

  const toggleAutoStartMic = () => {
    const newVal = !autoStartMic;
    setAutoStartMic(newVal);
    localStorage.setItem('maia_autoStartMic', newVal ? 'true' : 'false');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = 'pt-BR';
        
        recog.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setInput(finalTranscript);
            setIsRecording(false);
            handleSend(finalTranscript); // auto-send when speech ends
          } else {
            setInput(interimTranscript);
          }
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recog.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recog);
        
        // Custom events & URL params handling
        const handleOpenEvent = () => {
          setIsOpen(true);
          if (messages.length === 0) {
            setMessages([{ role: 'agent', text: 'Olá! Sou a Maia OS. Pressione o microfone para se identificar por voz (ex: "Aqui é o Flavio") ou digite seu comando para criarmos projetos e tarefas.' }]);
          }
        };

        window.addEventListener('open-maia-os', handleOpenEvent);

        if (searchParams?.get('openChat') === 'true') {
          handleOpenEvent();
          const shouldAutoStart = localStorage.getItem('maia_autoStartMic') === 'true';
          if (shouldAutoStart) {
            // Need a slight delay to ensure UI is ready before grabbing mic
            setTimeout(() => {
              try {
                recog.start();
                setIsRecording(true);
              } catch (e) {
                console.error("Auto-start mic failed", e);
              }
            }, 500);
          }
          // Remove param from URL
          const newUrl = window.location.pathname;
          router.replace(newUrl);
        }

        return () => {
          window.removeEventListener('open-maia-os', handleOpenEvent);
        };
      }
    }
  }, [searchParams, router, messages.length]); // Dependencies for initial check

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([{ role: 'agent', text: 'Olá! Sou a Maia OS. Pressione o microfone para se identificar por voz (ex: "Aqui é o Flavio") ou digite seu comando para criarmos projetos e tarefas.' }]);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() && !attachedFile) return;
    
    let userDisplay = text;
    if (attachedFile) userDisplay += ` [Anexo: ${attachedFile.name}]`;
    
    const newMessages = [...messages, { role: 'user', text: userDisplay }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      if (attachedFile) {
        formData.append('file', attachedFile);
        setAttachedFile(null); 
      }

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        body: formData, 
      });
      const data = await response.json();
      
      setMessages([...newMessages, { role: 'agent', text: data.reply }]);
      
      // Falar a resposta automaticamente
      if (data.reply) {
        speakText(data.reply);
      }
      
    } catch (e) {
      setMessages([...newMessages, { role: 'agent', text: 'Erro ao comunicar com a IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend(input);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) recognition.stop();
      setIsRecording(false);
    } else {
      if (recognition) {
        try {
          recognition.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Erro ao iniciar microfone", e);
        }
      } else {
        alert("Seu navegador não suporta reconhecimento de voz.");
      }
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      <style>{`
        @keyframes pulseMic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .mic-recording {
          animation: pulseMic 1.5s infinite;
          background-color: #ef4444 !important;
          color: white !important;
        }
      `}</style>
      
      {isOpen && (
        <div style={{
          width: '350px', maxWidth: 'calc(100vw - 40px)', height: '500px', maxHeight: 'calc(100vh - 100px)', backgroundColor: 'var(--surface)',
          borderRadius: '16px', border: '1px solid var(--border)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
          marginBottom: '15px', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '12px 15px', background: '#3b82f6', color: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Maia OS
                {isPlayingAudio && (
                  <button onClick={stopAudio} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', 
                    borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer'
                  }}>
                    🔇 Parar
                  </button>
                )}
              </h3>
              <button onClick={toggleOpen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.9 }}>
              <input 
                type="checkbox" 
                id="autoStartMic" 
                checked={autoStartMic} 
                onChange={toggleAutoStartMic}
                style={{ cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="autoStartMic" style={{ cursor: 'pointer' }}>Iniciar microfone automaticamente ao abrir</label>
            </div>
          </div>
          
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: m.role === 'user' ? '#3b82f6' : 'var(--surface-raised)',
                color: m.role === 'user' ? 'white' : 'var(--text)',
                padding: '10px 14px', borderRadius: '12px', maxWidth: '85%',
                fontSize: '0.9rem', lineHeight: '1.4'
              }}>
                {m.text}
              </div>
            ))}
            {isLoading && <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>Pensando...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 15px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--background)', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => fileInputRef.current?.click()} style={{
                background: attachedFile ? '#10b981' : 'var(--surface-hover)',
                color: attachedFile ? 'white' : 'var(--text)',
                border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s', flexShrink: 0, fontSize: '1.1rem'
              }} title={attachedFile ? attachedFile.name : 'Anexar arquivo'}>
                📎
              </button>

              <button 
                onClick={toggleRecording} 
                className={isRecording ? 'mic-recording' : ''}
                style={{
                  background: 'var(--surface-hover)',
                  color: 'var(--text)',
                  border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', flexShrink: 0, fontSize: '1.1rem'
                }}
                title={isRecording ? 'Parar gravação' : 'Falar com a Maia'}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Ouvindo..." : "Digite..."}
                style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none', fontSize: '0.9rem' }}
              />
              <button onClick={() => handleSend(input)} style={{
                background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', flexShrink: 0, fontSize: '0.9rem', fontWeight: 500
              }}>Enviar</button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={e => setAttachedFile(e.target.files?.[0] || null)} 
            />
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button onClick={toggleOpen} style={{
          width: '60px', height: '60px', borderRadius: '30px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✨
        </button>
      )}
    </div>
  );
}
