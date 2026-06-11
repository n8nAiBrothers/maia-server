import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Excluir rotas públicas e recursos estáticos do fluxo de autenticação
  const isPublic = 
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/verify') ||
    pathname.startsWith('/api/tasks/webhook') ||
    pathname.startsWith('/api/tokens/log') ||
    pathname.startsWith('/api/quotas/check') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/telegram/link-chat') ||
    pathname === '/unauthorized' ||
    pathname === '/apresentacao' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.'); // Evita bloquear imagens e outros assets estáticos

  if (isPublic) {
    return NextResponse.next();
  }

  // 2. Extrair token de acesso a partir da URL (?token=HASH)
  const tokenParam = searchParams.get('token');
  if (tokenParam) {
    try {
      const verifyUrl = new URL(`/api/auth/verify?token=${tokenParam}`, `http://127.0.0.1:3001`);
      const res = await fetch(verifyUrl.toString());
      
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          // Token é válido! Define cookie de sessão e continua (evita redirecionamento para não perder cookie no Safari/iOS)
          const response = NextResponse.next();
          response.cookies.set('maia_session', tokenParam, {
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 dias
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          // Adiciona headers para a página atual já funcionar
          response.headers.set('x-maia-member-id', data.member.id);
          response.headers.set('x-maia-member-name', data.member.name);
          response.headers.set('x-maia-member-role', data.member.role);
          response.headers.set('x-maia-member-roles', JSON.stringify(data.member.roles));
          response.headers.set('x-maia-member-financials', data.member.canViewFinancials.toString());
          return response;
        }
      }
    } catch (err) {
      console.error('Erro na validação do token param no middleware:', err);
    }
  }

  // 3. Se não há token na URL, verificar o cookie existente
  const sessionCookie = request.cookies.get('maia_session');
  if (sessionCookie?.value) {
    try {
      const verifyUrl = new URL(`/api/auth/verify?token=${sessionCookie.value}`, `http://127.0.0.1:3001`);
      const res = await fetch(verifyUrl.toString());
      
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          // Usuário validado com sucesso! Adiciona informações básicas nos headers para componentes filhos
          const response = NextResponse.next();
          response.headers.set('x-maia-member-id', data.member.id);
          response.headers.set('x-maia-member-name', data.member.name);
          response.headers.set('x-maia-member-role', data.member.role);
          response.headers.set('x-maia-member-roles', JSON.stringify(data.member.roles));
          response.headers.set('x-maia-member-financials', data.member.canViewFinancials.toString());
          return response;
        }
      }
    } catch (err) {
      console.error('Erro na validação do cookie no middleware:', err);
    }
  }

  // 4. Sem credenciais válidas -> Redirecionar para a tela não autorizada
  const unauthorizedUrl = new URL('/unauthorized', request.url);
  const response = NextResponse.redirect(unauthorizedUrl);
  if (sessionCookie) {
    response.cookies.delete('maia_session');
  }
  return response;
}

export const config = {
  // Aplica para tudo exceto arquivos de build estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
};
