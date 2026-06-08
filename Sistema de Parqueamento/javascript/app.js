/* ===== ESTADO ===== */
const D = {
  totalVagas: 50,
  vagas: [],
  viaturas: [
    { id:1, nome:'Ligeiro',  desc:'AutomÃ³vel de passageiros', hora:50,  dia:300, mes:5000 },
    { id:2, nome:'Pesado',   desc:'CaminhÃ£o / autocarro',      hora:100, dia:600, mes:9000 },
    { id:3, nome:'Moto',     desc:'Motociclo / scooter',       hora:20,  dia:120, mes:2000 },
    { id:4, nome:'SUV/4x4',  desc:'VeÃ­culo todo-o-terreno',   hora:70,  dia:400, mes:6500 },
  ],
  ocupacoes: [],
  historico: [],
  users: [
    { id:1, nome:'Administrador', login:'admin',    senha:'admin123', perfil:'admin',    ativo:true },
    { id:2, nome:'Operador',      login:'operador', senha:'op123',    perfil:'operador', ativo:true },
  ],
};

/* ===== SEED DEMO ===== */
(function seed() {
  for (let i = 1; i <= D.totalVagas; i++) D.vagas.push({ num:i, livre:true, mat:null, tipo:null });
  const now   = new Date();
  const mats  = ['MBQ-1234','MPT-5678','MTL-9012','MMZ-3456','MPE-7890','MAT-2211'];
  const tipos = ['Ligeiro','Moto','SUV/4x4','Ligeiro','Pesado','Moto'];
  for (let i = 0; i < 6; i++) {
    const ent  = new Date(now - i * 3600000 - Math.random() * 1800000);
    const pago = i >= 2;
    const sai  = pago ? new Date(ent.getTime() + (Math.floor(Math.random()*3)+1) * 3600000) : null;
    const vt   = D.viaturas.find(v => v.nome === tipos[i]);
    const hrs  = sai ? Math.max(1, Math.ceil((sai - ent) / 3600000)) : null;
    const val  = sai ? hrs * vt.hora : null;
    const r    = { id: Date.now() - i*999, mat: mats[i], tipo: tipos[i], vaga: i+1, entrada: ent, saida: sai, horas: hrs, valor: val };
    D.historico.push(r);
    if (!pago) {
      D.ocupacoes.push(r);
      D.vagas[i].livre = false; D.vagas[i].mat = mats[i]; D.vagas[i].tipo = tipos[i];
    }
  }
})();

/* ===== NAVEGAÃ‡ÃƒO ===== */
const TITULOS = {
  dashboard:'Dashboard', mapa:'Mapa de Vagas', entrada:'Registo de Entrada',
  saida:'Registo de SaÃ­da', viaturas:'Viaturas & Tarifas',
  relatorios:'RelatÃ³rios Financeiros', historico:'HistÃ³rico de MovimentaÃ§Ãµes',
  utilizadores:'GestÃ£o de Utilizadores'
};
function ir(pg) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('pg-' + pg).classList.add('active');
  document.getElementById('topTitle').textContent = TITULOS[pg] || pg;
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.getAttribute('onclick') && l.getAttribute('onclick').includes("'" + pg + "'")) l.classList.add('active');
  });
  const acoes = {
    dashboard: renderDashboard, mapa: renderMapa, entrada: initEntrada,
    saida: initSaida, viaturas: renderViaturas, relatorios: renderRelatorios,
    historico: () => { preencherFiltros(); renderHistorico(); },
    utilizadores: renderUsers
  };
  if (acoes[pg]) acoes[pg]();
  checarAlerta();
}

/* ===== RELÃ“GIO ===== */
setInterval(() => {
  document.getElementById('relogio').textContent = new Date().toLocaleString('pt-MZ', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
}, 1000);

/* ===== ALERTA OCUPAÃ‡ÃƒO ===== */
function checarAlerta() {
  const livres = D.vagas.filter(v => v.livre).length;
  const show   = livres / D.totalVagas < 0.10;
  document.getElementById('alertaGeral').style.display  = show ? 'block' : 'none';
  document.getElementById('alertaTopbar').style.display = show ? 'inline-flex' : 'none';
}

/* ===== DASHBOARD ===== */
function applyBarFillStyles(root = document) {
  root.querySelectorAll('.bar-fill[data-fill]').forEach(el => {
    el.style.width = el.dataset.fill + '%';
    el.style.background = el.dataset.bg;
  });
}

function renderDashboard() {
  const livres = D.vagas.filter(v => v.livre).length;
  document.getElementById('stTotal').textContent  = D.totalVagas;
  document.getElementById('stLivres').textContent = livres;
  document.getElementById('stOcup').textContent   = D.totalVagas - livres;
  const hoje = diaInicio(new Date());
  const rec  = D.historico.filter(h => h.saida && new Date(h.saida) >= hoje).reduce((s,h) => s + h.valor, 0);
  document.getElementById('stReceita').textContent = fmt(rec);

  const movs = [...D.historico].sort((a,b) => new Date(b.entrada) - new Date(a.entrada)).slice(0, 10);
  document.getElementById('dashMovs').innerHTML = movs.map(h => `
    <tr>
      <td><strong>${h.mat}</strong></td>
      <td>${h.tipo}</td>
      <td>V${pad(h.vaga)}</td>
      <td>${h.saida
        ? '<span class="badge bg-secondary">SaÃ­da</span>'
        : '<span class="badge bg-success">Em curso</span>'}</td>
      <td class="text-muted small-text">${hora(h.saida || h.entrada)}</td>
    </tr>`).join('');

  const dias  = ['Seg','Ter','Qua','Qui','Sex','SÃ¡b','Dom'];
  const cores = ['#0d6efd','#198754','#ffc107','#fd7e14','#dc3545','#0d6efd','#198754'];
  const vals  = dias.map((_, i) => {
    const d = diaInicio(new Date()); d.setDate(d.getDate() - (6 - i));
    const d2 = new Date(d); d2.setDate(d2.getDate() + 1);
    return D.historico.filter(h => h.saida && new Date(h.saida) >= d && new Date(h.saida) < d2).reduce((s,h) => s + h.valor, 0);
  });
  const mx = Math.max(...vals, 1);
  document.getElementById('chartSem').innerHTML = vals.map((v, i) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="chart-label">${dias[i]}</span>
      <div class="bar-bg flex-grow-1">
        <div class="bar-fill" data-fill="${Math.round((v/mx)*100)}" data-bg="${cores[i]}">${v > 0 ? fmt(v) : ''}</div>
      </div>
    </div>`).join('');
  applyBarFillStyles(document.getElementById('chartSem'));

  checarAlerta();
}

/* ===== MAPA ===== */
function renderMapa() {
  const livres = D.vagas.filter(v => v.livre).length;
  document.getElementById('mapaLivres').textContent = livres;
  document.getElementById('mapaOcup').textContent   = D.totalVagas - livres;
  document.getElementById('vagaGrid').innerHTML = D.vagas.map(v => `
    <div class="vaga-box ${v.livre ? 'livre' : 'occ'}" title="${v.livre ? 'Livre' : v.mat + ' â€” ' + v.tipo}">
      <span>V${pad(v.num)}</span>
      ${!v.livre ? `<span class="vaga-mat">${v.mat}</span>` : ''}
    </div>`).join('');
}

/* ===== ENTRADA ===== */
function initEntrada() {
  const sel = document.getElementById('entTipo');
  sel.innerHTML = '<option value="">â€” Seleccionar â€”</option>' + D.viaturas.map(v => `<option value="${v.id}">${v.nome}</option>`).join('');
  document.getElementById('entMat').value  = '';
  document.getElementById('entHora').value = localDT(new Date());
  document.getElementById('entTarifaInfo').style.display = 'none';
  atualizarSelectVagas();
}
function atualizarSelectVagas() {
  const sel    = document.getElementById('entVaga');
  const livres = D.vagas.filter(v => v.livre);
  sel.innerHTML = livres.length
    ? livres.map(v => `<option value="${v.num}">Vaga V${pad(v.num)}</option>`).join('')
    : '<option>Sem vagas livres</option>';
}
function autoVaga() {
  const l = D.vagas.find(v => v.livre);
  if (!l) { toast('Sem vagas livres!', 'danger'); return; }
  document.getElementById('entVaga').value = l.num;
  toast('Vaga V' + pad(l.num) + ' atribuÃ­da automaticamente.', 'success');
}
function mostrarTarifa() {
  const id = document.getElementById('entTipo').value;
  if (!id) { document.getElementById('entTarifaInfo').style.display = 'none'; return; }
  const v = D.viaturas.find(x => x.id == id);
  document.getElementById('entTarifaInfo').textContent = `Tarifas: ${fmt(v.hora)}/hora Â· ${fmt(v.dia)}/dia Â· ${fmt(v.mes)}/mÃªs`;
  document.getElementById('entTarifaInfo').style.display = 'block';
}
function doEntrada() {
  const mat = document.getElementById('entMat').value.trim();
  const tid = document.getElementById('entTipo').value;
  const vn  = parseInt(document.getElementById('entVaga').value);
  const h   = document.getElementById('entHora').value;
  if (!mat || !tid || !vn || !h) { toast('Preencha todos os campos obrigatÃ³rios.', 'danger'); return; }
  if (D.ocupacoes.find(o => o.mat === mat)) { toast('MatrÃ­cula jÃ¡ registada no parque.', 'warning'); return; }
  const vt = D.viaturas.find(v => v.id == tid);
  const r  = { id: Date.now(), mat, tipo: vt.nome, vaga: vn, entrada: new Date(h), saida: null, horas: null, valor: null };
  D.historico.push(r);
  D.ocupacoes.push(r);
  D.vagas[vn-1].livre = false; D.vagas[vn-1].mat = mat; D.vagas[vn-1].tipo = vt.nome;
  toast(`Entrada registada: ${mat} â†’ Vaga V${pad(vn)}`, 'success');
  initEntrada();
  checarAlerta();
}

/* ===== SAÃDA ===== */
function initSaida() {
  document.getElementById('saiMat').value = '';
  document.getElementById('saidaPanel').style.display = 'none';
}
function buscarSaida() {
  const mat = document.getElementById('saiMat').value.trim();
  if (!mat) { toast('Insira a matrÃ­cula.', 'warning'); return; }
  const ocp = D.ocupacoes.find(o => o.mat === mat);
  if (!ocp) { toast('Viatura nÃ£o encontrada no parque.', 'danger'); document.getElementById('saidaPanel').style.display = 'none'; return; }
  const vt  = D.viaturas.find(v => v.nome === ocp.tipo);
  const now = new Date();
  const hrs = Math.max(1, Math.ceil((now - new Date(ocp.entrada)) / 3600000));
  const val = hrs * (vt ? vt.hora : 50);
  document.getElementById('saiTipo').textContent    = ocp.tipo;
  document.getElementById('saiVaga').textContent    = 'V' + pad(ocp.vaga);
  document.getElementById('saiEntrada').textContent = dt(ocp.entrada);
  document.getElementById('saiTempo').textContent   = hrs + 'h';
  document.getElementById('saiValor').textContent   = fmt(val);
  const p = document.getElementById('saidaPanel');
  p.dataset.id = ocp.id; p.dataset.val = val; p.dataset.hrs = hrs;
  p.style.display = 'block';
}
function doSaida() {
  const p   = document.getElementById('saidaPanel');
  const id  = parseInt(p.dataset.id);
  const val = parseFloat(p.dataset.val);
  const hrs = parseInt(p.dataset.hrs);
  const r   = D.historico.find(h => h.id === id);
  if (!r) return;
  r.saida = new Date(); r.horas = hrs; r.valor = val;
  D.ocupacoes = D.ocupacoes.filter(o => o.id !== id);
  const vg = D.vagas[r.vaga-1]; vg.livre = true; vg.mat = null; vg.tipo = null;
  mostrarRecibo(r);
  initSaida();
  checarAlerta();
}
function mostrarRecibo(r) {
  const n = 'REC-' + String(r.id).slice(-6).toUpperCase();
  document.getElementById('reciboBody').innerHTML = `
    <div class="recibo">
      <div class="recibo-header">
        <div class="recibo-title">ðŸ…¿ PARKFLOW</div>
        <div class="recibo-subtitle">Recibo de Estacionamento</div>
        <div class="recibo-meta">${dt(new Date())}</div>
        <div class="recibo-number">${n}</div>
      </div>
      <div class="recibo-row"><span>MatrÃ­cula</span><span><strong>${r.mat}</strong></span></div>
      <div class="recibo-row"><span>Tipo</span><span>${r.tipo}</span></div>
      <div class="recibo-row"><span>Vaga</span><span>V${pad(r.vaga)}</span></div>
      <div class="recibo-row"><span>Entrada</span><span>${dt(r.entrada)}</span></div>
      <div class="recibo-row"><span>SaÃ­da</span><span>${dt(r.saida)}</span></div>
      <div class="recibo-row"><span>PermanÃªncia</span><span>${r.horas}h</span></div>
      <div class="recibo-total"><span>TOTAL PAGO</span><span>${fmt(r.valor)}</span></div>
      <div class="recibo-note">Obrigado pela preferÃªncia. Conserve este recibo.</div>
    </div>`;
  new bootstrap.Modal(document.getElementById('mdRecibo')).show();
}

/* ===== VIATURAS ===== */
function renderViaturas() {
  document.getElementById('tblViat').innerHTML = D.viaturas.map(v => `
    <tr>
      <td><strong>${v.nome}</strong></td>
      <td class="text-muted">${v.desc}</td>
      <td>${fmt(v.hora)}</td>
      <td>${fmt(v.dia)}</td>
      <td>${fmt(v.mes)}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editarViatura(${v.id})"></button>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarTarifa(${v.id})"></button>
        <button class="btn btn-sm btn-outline-danger" onclick="apagarViatura(${v.id})"></button>
      </td>
    </tr>`).join('');
}
document.getElementById('mdViat').addEventListener('show.bs.modal', () => {
  if (!document.getElementById('vId').value) {
    ['vNome','vDesc'].forEach(i => document.getElementById(i).value = '');
    ['vH','vD','vM'].forEach(i => document.getElementById(i).value = 0);
  }
});
function editarViatura(id) {
  const v = D.viaturas.find(x => x.id === id);
  document.getElementById('vId').value = id; document.getElementById('vNome').value = v.nome;
  document.getElementById('vDesc').value = v.desc; document.getElementById('vH').value = v.hora;
  document.getElementById('vD').value = v.dia; document.getElementById('vM').value = v.mes;
  new bootstrap.Modal(document.getElementById('mdViat')).show();
}
function salvarViatura() {
  const id   = document.getElementById('vId').value;
  const nome = document.getElementById('vNome').value.trim();
  if (!nome) { toast('Nome obrigatÃ³rio.', 'danger'); return; }
  const o = { nome, desc: document.getElementById('vDesc').value.trim(), hora: +document.getElementById('vH').value||0, dia: +document.getElementById('vD').value||0, mes: +document.getElementById('vM').value||0 };
  id ? Object.assign(D.viaturas.find(v => v.id == id), o) : D.viaturas.push({ id: Date.now(), ...o });
  bootstrap.Modal.getInstance(document.getElementById('mdViat')).hide();
  document.getElementById('vId').value = '';
  renderViaturas();
  toast('Guardado com sucesso.', 'success');
}
function apagarViatura(id) {
  if (!confirm('Apagar este tipo de viatura?')) return;
  D.viaturas = D.viaturas.filter(v => v.id !== id);
  renderViaturas();
}
function editarTarifa(id) {
  const v = D.viaturas.find(x => x.id === id);
  document.getElementById('tId').value = id;
  document.getElementById('tarNome').textContent = v.nome;
  document.getElementById('tH').value = v.hora; document.getElementById('tD').value = v.dia; document.getElementById('tM').value = v.mes;
  new bootstrap.Modal(document.getElementById('mdTar')).show();
}
function salvarTarifa() {
  const v = D.viaturas.find(x => x.id == document.getElementById('tId').value);
  v.hora = +document.getElementById('tH').value||0;
  v.dia  = +document.getElementById('tD').value||0;
  v.mes  = +document.getElementById('tM').value||0;
  bootstrap.Modal.getInstance(document.getElementById('mdTar')).hide();
  renderViaturas();
  toast('Tarifa actualizada.', 'success');
}

/* ===== RELATÃ“RIOS ===== */
function renderRelatorios() {
  const hoje = diaInicio(new Date());
  const mesI = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const anoI = new Date(hoje.getFullYear(), 0, 1);
  const pgs  = D.historico.filter(h => h.saida && h.valor != null);
  document.getElementById('relHoje').textContent = fmt(pgs.filter(h => new Date(h.saida) >= hoje).reduce((s,h) => s+h.valor, 0));
  document.getElementById('relMes').textContent  = fmt(pgs.filter(h => new Date(h.saida) >= mesI).reduce((s,h) => s+h.valor, 0));
  document.getElementById('relAno').textContent  = fmt(pgs.filter(h => new Date(h.saida) >= anoI).reduce((s,h) => s+h.valor, 0));

  const cores = ['#0d6efd','#198754','#ffc107','#fd7e14'];
  const bt = {};
  D.viaturas.forEach(v => { bt[v.nome] = pgs.filter(h => h.tipo === v.nome && new Date(h.saida) >= mesI).reduce((s,h) => s+h.valor, 0); });
  const mx = Math.max(...Object.values(bt), 1);
  document.getElementById('chartTipo').innerHTML = Object.entries(bt).map(([k,v], i) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="chart-label-lg">${k}</span>
      <div class="bar-bg flex-grow-1"><div class="bar-fill" data-fill="${Math.round((v/mx)*100)}" data-bg="${cores[i%cores.length]}">${v>0?fmt(v):''}</div></div>
    </div>`).join('');
  applyBarFillStyles(document.getElementById('chartTipo'));

  const dias7 = Array.from({length:7}, (_, i) => { const d = diaInicio(new Date()); d.setDate(d.getDate()-(6-i)); return d; });
  const labD  = ['D-6','D-5','D-4','D-3','D-2','Ont.','Hoje'];
  const vD    = dias7.map(d => { const d2=new Date(d); d2.setDate(d2.getDate()+1); return pgs.filter(h=>new Date(h.saida)>=d&&new Date(h.saida)<d2).reduce((s,h)=>s+h.valor,0); });
  const mxD   = Math.max(...vD, 1);
  document.getElementById('chartDias').innerHTML = vD.map((v, i) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="chart-label">${labD[i]}</span>
      <div class="bar-bg flex-grow-1"><div class="bar-fill" data-fill="${Math.round((v/mxD)*100)}" data-bg="#0d6efd">${v>0?fmt(v):''}</div></div>
    </div>`).join('');
  applyBarFillStyles(document.getElementById('chartDias'));
}
function exportCSV() {
  const rows = [
    ['MatrÃ­cula','Tipo','Vaga','Entrada','SaÃ­da','Horas','Valor(MT)'],
    ...D.historico.filter(h=>h.saida).map(h=>[h.mat,h.tipo,h.vaga,dt(h.entrada),dt(h.saida),h.horas,h.valor].join(','))
  ];
  dl('historico.csv', rows.join('\n'), 'text/csv');
}
function exportJSON() { dl('historico.json', JSON.stringify(D.historico, null, 2), 'application/json'); }
function dl(n, data, type) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type})); a.download=n; a.click(); }

/* ===== HISTÃ“RICO ===== */
function preencherFiltros() {
  const s = document.getElementById('filtTipo');
  const c = s.value;
  s.innerHTML = '<option value="">Todos os tipos</option>' + D.viaturas.map(v => `<option value="${v.nome}"${v.nome===c?' selected':''}>${v.nome}</option>`).join('');
}
function renderHistorico() {
  const mat  = document.getElementById('filtMat').value.trim().toUpperCase();
  const tipo = document.getElementById('filtTipo').value;
  const est  = document.getElementById('filtEst').value;
  const lista = [...D.historico]
    .sort((a,b) => new Date(b.entrada) - new Date(a.entrada))
    .filter(h => (!mat || h.mat.includes(mat)) && (!tipo || h.tipo === tipo) &&
      (!est || (est==='activo' && !h.saida) || (est==='enc' && h.saida)));
  document.getElementById('tblHist').innerHTML = lista.map(h => `
    <tr>
      <td><strong>${h.mat}</strong></td>
      <td>${h.tipo}</td>
      <td>V${pad(h.vaga)}</td>
      <td class="small-text">${dt(h.entrada)}</td>
      <td class="small-text">${h.saida ? dt(h.saida) : '<span class="text-success fw-bold">Em curso</span>'}</td>
      <td>${h.horas != null ? h.horas+'h' : 'â€”'}</td>
      <td>${h.valor != null ? '<strong class="text-success">'+fmt(h.valor)+'</strong>' : 'â€”'}</td>
      <td>${h.saida
        ? '<span class="badge bg-secondary">Encerrado</span>'
        : '<span class="badge bg-success">Activo</span>'}</td>
    </tr>`).join('');
}

/* ===== UTILIZADORES ===== */
function renderUsers() {
  document.getElementById('tblUsers').innerHTML = D.users.map(u => `
    <tr>
      <td><strong>${u.nome}</strong></td>
      <td>${u.login}</td>
      <td><span class="badge ${u.perfil==='admin'?'bg-warning text-dark':'bg-primary'}">${u.perfil==='admin'?'Administrador':'Operador'}</span></td>
      <td><span class="badge ${u.ativo?'bg-success':'bg-secondary'}">${u.ativo?'Activo':'Inactivo'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editUser(${u.id})"></button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUser(${u.id})" title="${u.ativo?'Desactivar':'Activar'}"></button>
        ${u.login!=='admin'?`<button class="btn btn-sm btn-outline-danger" onclick="delUser(${u.id})"></button>`:''}
      </td>
    </tr>`).join('');
}
function abrirModalUser() {
  document.getElementById('uId').value = '';
  ['uNome','uLogin','uSenha'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('uPerfil').value = 'operador';
  new.bootstrap.Modal(document.getElementById('mdUser')).show();
}
function editUser(id) {
  const u = D.users.find(x => x.id === id);
  document.getElementById('uId').value = id; document.getElementById('uNome').value = u.nome;
  document.getElementById('uLogin').value = u.login; document.getElementById('uSenha').value = u.senha;
  document.getElementById('uPerfil').value = u.perfil;
  new bootstrap.Modal(document.getElementById('mdUser')).show();
}
function salvarUser() {
  const id    = parseInt(document.getElementById('uId').value);
  const nome  = document.getElementById('uNome').value.trim();
  const login = document.getElementById('uLogin').value.trim();
  const senha = document.getElementById('uSenha').value;
  const perfil= document.getElementById('uPerfil').value;
  if (!nome || !login || !senha) { toast('Preencha todos os campos.', 'danger'); return; }
  if (id) { Object.assign(D.users.find(u => u.id === id), { nome, login, senha, perfil }); }
  else    { D.users.push({ id: Date.now(), nome, login, senha, perfil, ativo: true }); }
  bootstrap.Modal.getInstance(document.getElementById('mdUser')).hide();
  renderUsers();
  toast('Utilizador guardado.', 'success');
}
function toggleUser(id) { const u = D.users.find(x => x.id === id); u.ativo = !u.ativo; renderUsers(); }
function delUser(id) {
  if (!confirm('Eliminar este utilizador?')) return;
  D.users = D.users.filter(u => u.id !== id);
  renderUsers();
}

/* ===== HELPERS ===== */
function fmt(v)    { return new Intl.NumberFormat('pt-MZ',{maximumFractionDigits:0}).format(v||0)+' MT'; }
function pad(n)    { return String(n).padStart(2,'0'); }
function hora(d)   { return new Date(d).toLocaleTimeString('pt-MZ',{hour:'2-digit',minute:'2-digit'}); }
function dt(d)     { if(!d)return'â€”'; return new Date(d).toLocaleString('pt-MZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function diaInicio(d){ const r=new Date(d); r.setHours(0,0,0,0); return r; }
function localDT(d){ const o=d.getTimezoneOffset()*60000; return new Date(d-o).toISOString().slice(0,16); }
function toast(msg, type='success') {
  const t = document.createElement('div');
  t.className = `alert alert-${type} position-fixed shadow-sm`;
  t.style.cssText = 'bottom:20px;right:20px;z-index:9999;min-width:240px;font-size:.84rem;padding:10px 16px;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ===== ARRANQUE ===== */
renderDashboard();

