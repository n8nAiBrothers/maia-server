import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Authentication Check
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('maia_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { accessHash: sessionToken }
    });

    // We can restrict to controllers or developers if we want, but for now just authenticated users.
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Hardware Sensors (OS)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;
    
    // CPU Load estimation (1 minute load average divided by logical cores)
    const cores = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuLoadPercentage = Math.min((loadAvg / cores) * 100, 100);

    const systemStats = {
      cpuLoadPercentage,
      memPercentage,
      totalMemBytes: totalMem,
      usedMemBytes: usedMem,
      uptimeSeconds: os.uptime(),
      cores,
      platform: os.platform(),
      release: os.release()
    };

    // 3. PM2 Sensors
    let pm2Processes = [];
    try {
      const { stdout } = await execAsync('npx pm2 jlist');
      const pm2Data = JSON.parse(stdout);
      
      pm2Processes = pm2Data.map((proc: any) => ({
        name: proc.name,
        pid: proc.pid,
        status: proc.pm2_env.status, // 'online', 'stopping', 'stopped', 'launching', 'errored', or 'one-launch-status'
        restarts: proc.pm2_env.restart_time,
        uptime: proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
        memoryBytes: proc.monit?.memory || 0,
        cpuPercent: proc.monit?.cpu || 0,
      }));
    } catch (pm2Error) {
      console.error('Error fetching PM2 stats:', pm2Error);
      // Fails gracefully if PM2 is not accessible
    }

    // 4. Cloudflare Tunnel Sensor
    let cloudflaredStatus = 'offline';
    try {
      // pgrep returns exit code 0 if found, 1 if not found
      await execAsync('pgrep -x cloudflared');
      cloudflaredStatus = 'online';
    } catch (e) {
      cloudflaredStatus = 'offline';
    }

    // 5. LLM Traffic Sensors (Deliverables / Agents)
    const agents = await prisma.deliverable.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 6. LLM Subscriptions (Google Pro, Claude, etc)
    const subscriptions = await prisma.llmSubscription.findMany({
      orderBy: { provider: 'asc' },
    });

    // Construct response
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      nodeName: 'Maia Root Server (Local)',
      systemStats,
      pm2Processes,
      tunnels: [
        {
          name: 'cloudflared-zero-trust',
          status: cloudflaredStatus,
          type: 'Cloudflare Tunnel'
        }
      ],
      llmSubscriptions: subscriptions.map((s: any) => ({
        id: s.id,
        provider: s.provider,
        planName: s.planName,
        tokenLimit: s.tokenLimit ? Number(s.tokenLimit) : null,
        tokensUsed: Number(s.tokensUsed),
        isLocal: s.isLocal,
        status: s.status
      })),
      llmAgents: agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.agentType || 'unknown',
        platform: a.platform || 'unknown',
        tokensUsed: Number(a.totalTokensUsed),
        costBrl: a.totalCostBrl,
        lastActiveAt: a.lastActiveAt,
        status: a.status
      }))
    });

  } catch (error) {
    console.error('Error fetching infrastructure status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
