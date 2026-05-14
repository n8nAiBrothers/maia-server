const http = require('http');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjM1M2YyNy04MmRmLTQ1MGItODU5NC01NjgwYWM0NjRlMTYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMTQ3YjRhMDEtMzExNi00ZGE0LWE0MDctODljOTc0NGExMWZiIiwiaWF0IjoxNzc3ODIxNDMwfQ.NKdFuyN2hFy_9drng88frhua8sZ0Am4Jt0f-SEWO8Ak";
const BASE_URL = "http://localhost:5678/api/v1/workflows";
const headers = {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json'
};

async function fetchWorkflows() {
    return new Promise((resolve, reject) => {
        http.get(BASE_URL, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function updateWorkflow(id, workflowData) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers
        }, (res) => {
            res.on('data', () => {});
            res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(JSON.stringify(workflowData));
        req.end();
    });
}

async function run() {
    const data = await fetchWorkflows();
    const workflows = data.data;
    const nocWorkflow = workflows.find(w => w.name.includes("Monitor de Falhas Globais"));
    
    if (!nocWorkflow) {
        console.error("ERRO: Fluxo do Monitor de Falhas (NOC) não foi encontrado.");
        return;
    }
    const nocId = nocWorkflow.id;
    console.log(`[+] Encontrado o ID do Monitor de Falhas: ${nocId}`);

    let updatedCount = 0;
    for (const w of workflows) {
        if (w.id === nocId) continue;
        
        let settings = w.settings || {};
        if (settings.errorWorkflow !== nocId) {
            settings.errorWorkflow = nocId;
            w.settings = settings;
            
            await updateWorkflow(w.id, w);
            updatedCount++;
            console.log(`[+] Atualizado: "${w.name}" agora enviará erros para o Monitor.`);
        } else {
            console.log(`[-] Skip: "${w.name}" já estava configurado.`);
        }
    }
    console.log(`\n✅ Sucesso! ${updatedCount} workflows foram atualizados.`);
}

run();
