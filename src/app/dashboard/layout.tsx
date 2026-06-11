import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '../../lib/prisma';
import DashboardLayoutClient from './DashboardLayoutClient';
import MaiaAgentWidget from '../../components/MaiaAgentWidget';
import './dashboard.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;

  let member = null;
  if (sessionToken) {
    member = await prisma.member.findUnique({
      where: { accessHash: sessionToken },
    });
  }

  const initials = member
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const canViewFinancials = member?.canViewFinancials ?? false;

  return (
    <DashboardLayoutClient 
      initials={initials}
      memberName={member?.name}
      memberRole={member?.role}
      canViewFinancials={canViewFinancials}
    >
      {children}
      <MaiaAgentWidget />
    </DashboardLayoutClient>
  );
}

