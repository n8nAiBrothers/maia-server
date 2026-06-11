import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token não fornecido' }, { status: 400 });
  }

  try {
    const member = await prisma.member.findUnique({
      where: { accessHash: token },
      select: {
        id: true,
        name: true,
        role: true,
        roles: true,
        canViewFinancials: true,
        isActive: true,
      },
    });

    if (!member || !member.isActive) {
      return NextResponse.json({ valid: false, error: 'Token inválido ou membro inativo' }, { status: 401 });
    }

    return NextResponse.json({ valid: true, member });
  } catch (error) {
    console.error('Erro na validação do token:', error);
    return NextResponse.json({ valid: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
