import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) return NextResponse.json({ error: 'Token ausente' }, { status: 400 });

  const member = await prisma.member.findUnique({
    where: { accessHash: token }
  });

  if (!member) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

  // Injeta o cookie via HTML/JS para ser à prova de falhas no Cloudflare Proxy
  const html = `
    <html>
      <head><title>Autenticando...</title></head>
      <body>
        <script>
          document.cookie = "maia_session=${token}; path=/; max-age=2592000; SameSite=Lax; Secure";
          window.location.href = "/dashboard";
        </script>
        <p>Autenticando na Plataforma Maia... Se não for redirecionado, <a href="/dashboard">clique aqui</a>.</p>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
