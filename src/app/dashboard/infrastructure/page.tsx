'use client';

import { useState, useEffect } from 'react';
import './infrastructure.css';

interface SystemStats {
  cpuLoadPercentage: number;
  memPercentage: number;
  totalMemBytes: number;
  usedMemBytes: number;
  uptimeSeconds: number;
  cores: number;
  platform: string;
  release: string;
}

interface Pm2Process {
  name: string;
  pid: number;
  status: string;
  restarts: number;
  uptime: number;
  memoryBytes: number;
  cpuPercent: number;
}

interface Tunnel {
  name: string;
  status: string;
  type: string;
}

interface LlmAgent {
  id: string;
  name: string;
  type: string;
  platform: string;
  tokensUsed: number;
  costBrl: number;
  lastActiveAt: string | null;
  status: string;
}

interface InfrastructureData {
  timestamp: string;
  nodeName: string;
  systemStats: SystemStats;
  pm2Processes: Pm2Process[];
  tunnels: Tunnel[];
  llmAgents?: LlmAgent[];
  llmSubscriptions?: any[];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function InfrastructureDashboard() {
  const [data, setData] = useState<InfrastructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/infrastructure/status');
      if (!res.ok) throw new Error('Failed to fetch infrastructure data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="infra-loading">Estabelecendo conexão com sensores do servidor...</div>;
  }

  if (error && !data) {
    return <div className="infra-error">Erro de Conexão: {error}</div>;
  }

  return (
    <div className="infra-container fade-in">
      <header className="infra-header">
        <div>
          <h1 className="infra-title">Monitoramento de Infraestrutura</h1>
          <p className="infra-subtitle">Central de Comando Multi-Node • Atualização em tempo real</p>
        </div>
        <div className="infra-node-selector">
          <span className="node-badge active">🟢 {data?.nodeName}</span>
          <span className="node-badge disabled">⚪ Nuvem AWS (Em breve)</span>
        </div>
      </header>

      {/* Main Node Dashboard */}
      <div className="node-dashboard">
        {/* Hardware Health Section */}
        <section className="dashboard-section hardware-section">
          <h2 className="section-title">🖥️ Saúde do Hardware</h2>
          <div className="hardware-grid">
            
            <div className="hardware-card">
              <div className="hardware-header">
                <h3>Carga de CPU</h3>
                <span className="hardware-value">{data?.systemStats.cpuLoadPercentage.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className={`progress-fill ${data?.systemStats.cpuLoadPercentage && data.systemStats.cpuLoadPercentage > 80 ? 'danger' : 'safe'}`}
                  style={{ width: `${Math.min(data?.systemStats.cpuLoadPercentage || 0, 100)}%` }}
                ></div>
              </div>
              <div className="hardware-meta">
                {data?.systemStats.cores} Cores Lógicos • OS {data?.systemStats.platform}
              </div>
            </div>

            <div className="hardware-card">
              <div className="hardware-header">
                <h3>Uso de RAM</h3>
                <span className="hardware-value">{data?.systemStats.memPercentage.toFixed(1)}%</span>
              </div>
              <div className="progress-track">
                <div 
                  className={`progress-fill ${data?.systemStats.memPercentage && data.systemStats.memPercentage > 85 ? 'danger' : 'safe'}`}
                  style={{ width: `${Math.min(data?.systemStats.memPercentage || 0, 100)}%` }}
                ></div>
              </div>
              <div className="hardware-meta">
                {formatBytes(data?.systemStats.usedMemBytes || 0)} / {formatBytes(data?.systemStats.totalMemBytes || 0)}
              </div>
            </div>

            <div className="hardware-card uptime-card">
              <h3>Uptime da Máquina</h3>
              <div className="uptime-value">{formatUptime((data?.systemStats.uptimeSeconds || 0) * 1000)}</div>
              <div className="hardware-meta">Servidor Online 24/7</div>
            </div>

          </div>
        </section>

        {/* Services Section */}
        <section className="dashboard-section">
          <h2 className="section-title">⚙️ Serviços Gerenciados (PM2)</h2>
          <div className="services-grid">
            {data?.pm2Processes.map(proc => (
              <div key={proc.name} className="service-card">
                <div className="service-header">
                  <div className="service-title-wrap">
                    <div className={`status-dot ${proc.status === 'online' ? 'pulse-green' : 'pulse-red'}`}></div>
                    <h3 className="service-name">{proc.name}</h3>
                  </div>
                  <span className={`status-badge ${proc.status}`}>{proc.status.toUpperCase()}</span>
                </div>
                
                <div className="service-stats">
                  <div className="stat-item">
                    <span className="stat-label">RAM</span>
                    <span className="stat-value">{formatBytes(proc.memoryBytes)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">CPU</span>
                    <span className="stat-value">{proc.cpuPercent}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Uptime</span>
                    <span className="stat-value">{formatUptime(proc.uptime)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Restarts</span>
                    <span className="stat-value" style={{color: proc.restarts > 0 ? 'var(--alert)' : 'inherit'}}>{proc.restarts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Network & Tunnels */}
        <section className="dashboard-section">
          <h2 className="section-title">🌐 Rede & Zero Trust</h2>
          <div className="tunnels-grid">
            {data?.tunnels.map(tunnel => (
              <div key={tunnel.name} className="tunnel-card">
                <div className="tunnel-icon">🛡️</div>
                <div className="tunnel-info">
                  <h3>{tunnel.type}</h3>
                  <p>{tunnel.name}</p>
                </div>
                <div className={`status-badge ${tunnel.status}`}>
                  {tunnel.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* END of Tunnels */}
      </div>
    </div>
  );
}
