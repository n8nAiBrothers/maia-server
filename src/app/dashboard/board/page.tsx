import styles from "../../page.module.css";
import KanbanBoard from "../../components/KanbanBoard";
import Link from "next/link";
import prisma from "../../../lib/prisma";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('maia_session')?.value;

  let currentMember = null;
  if (sessionToken) {
    currentMember = await prisma.member.findUnique({
      where: { accessHash: sessionToken }
    });
  }

  const initials = currentMember
    ? currentMember.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const lists = await prisma.list.findMany({
    orderBy: { order: "asc" },
    include: {
      cards: {
        orderBy: { createdAt: "desc" },
        include: {
          subtasks: {
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  const formattedColumns = lists.map((list: any) => ({
    id: list.id,
    title: list.title,
    tasks: list.cards
      .sort((a: any, b: any) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      })
      .map((card: any) => ({
        id: card.id,
        title: card.title,
        description: card.description || "",
        priority: card.priority as "High" | "Medium" | "Low",
        assignee: card.assignee || undefined,
        dueDate: card.dueDate || undefined,
        status: card.status,
        history: card.history as any || [],
        subtasks: card.subtasks || []
      }))
  }));

  const boardId = lists[0]?.boardId || "default";

  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const projects = await prisma.project.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container} style={{ height: 'calc(100vh - 4rem)', padding: '0' }}>
      <main className={styles.main} style={{ padding: '0', height: '100%' }}>
        <KanbanBoard initialColumns={formattedColumns} boardId={boardId} members={members} projects={projects} />
      </main>
    </div>
  );
}
