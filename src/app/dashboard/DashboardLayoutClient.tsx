"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayoutClient({ 
  children, initials, memberName, memberRole, canViewFinancials 
}: any) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const pathname = usePathname() || '';

  const isBoard = pathname === '/dashboard/board';

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleRefresh = () => {
    setShowRefreshToast(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const navLinks = [
    { section: 'Principal' },
    { href: '/dashboard', icon: '📊', label: 'Visão Geral' },
    { href: '/dashboard/board', icon: '📋', label: 'Kanban Board' },
    { onClick: () => window.dispatchEvent(new Event('open-maia-os')), icon: '✨', label: 'Maia OS' },
    { section: 'Plataforma Maia' },
    { href: '/dashboard/tokens', icon: '🧠', label: 'Controle de IA' },
    { href: '/dashboard/infrastructure', icon: '🖥️', label: 'Infraestrutura' },
    { section: 'Gestão' },
    { href: '/dashboard/team', icon: '👥', label: 'Equipe' },
    ...(canViewFinancials ? [
      { href: '/dashboard/financeiro', icon: '💰', label: 'Balanço' }
    ] : []),
  ];

  return (
    <div className={`dashboard-layout ${isCollapsed ? 'pc-collapsed' : ''}`}>
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsMobileOpen(true)}>☰</button>
        <div className="mobile-logo">Maia OS</div>
        <button className="refresh-btn" onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.5rem', cursor: 'pointer', marginLeft: 'auto', marginRight: '0.5rem' }}>⟳</button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">M</div>
          <div className="sidebar-brand-container">
            <div className="sidebar-brand">Maia OS</div>
            <div className="sidebar-version">v4.0 — Workspace Unificado</div>
          </div>
          
          <button className="collapse-btn pc-only" onClick={handleRefresh} style={{ marginRight: '0.5rem', fontSize: '1.2rem' }} title="Atualizar">
            ⟳
          </button>
          
          <button className="collapse-btn pc-only" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? '▶' : '◀'}
          </button>
          
          <button className="collapse-btn mobile-only" onClick={() => setIsMobileOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link, idx) => {
            if (link.section) {
              return <div key={idx} className="sidebar-section-title">{link.section}</div>;
            }
            
            if (link.onClick) {
              return (
                <button 
                  key={idx} 
                  onClick={link.onClick} 
                  className="sidebar-link" 
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  <span className="sidebar-link-label">{link.label}</span>
                </button>
              );
            }
            
            const exactActive = link.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(link.href!);

            return (
              <Link key={idx} href={link.href!} className={`sidebar-link ${exactActive ? 'active' : ''}`}>
                <span className="sidebar-link-icon">{link.icon}</span>
                <span className="sidebar-link-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="member-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
              {initials}
            </div>
            <div className="sidebar-member-info">
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {memberName || 'Visitante'}
              </div>
              <div style={{ fontSize: '0.65rem' }}>
                {memberRole || 'Acesso Temporário'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${isBoard ? 'board-mode' : ''}`}>
        {children}
      </main>

      {/* Refresh Toast */}
      {showRefreshToast && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10000, fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          ✨ Maia Atualizada!
        </div>
      )}
    </div>
  );
}
