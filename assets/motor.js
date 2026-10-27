/* Governança CTO · Visão do Time: o motor de cálculo da Governança CTO (assets/app.js do site principal, sem desenhar a página)
   com o cálculo das telas da Visão do Time no fim. Gerado pelo gerar_foto.py; não editar à mão. */
/* Governança CTO · site com cinco pernas: Sell Out (Dash Geral, mesma lógica do DASH_GERAL_CTO_POWERQUERY.xlsx), Sell In (P&L Restated + Order Management),
   MSL Direto (MSL das lojas das contas de atendimento direto, Power BI Execution Report), MSL Indireto (MSL das lojas do canal indireto, recalculado no Colecta)
   e Nielsen (mercado e share da Reckitt nas categorias Nielsen e IQVIA, base mensal do CMI).
   Sell Out: R$ e caixas somam o nível SEGMENTO; PDV vem do TOTAL, da MARCA ou do SEGMENTO conforme o recorte (sem soma dupla no total).
   Sell In: mesmo formato de linha; R$ = NR, caixas = VOL do P&L, sem positivação.
   MSL Direto: base própria (mês x loja x SKU com Target e Compliance); MSL = soma do Compliance / soma do Target, lido em janela de 3 meses. */
(() => {
const DSO = window.DASH, DSI = window.DASH.sellin || null;
const DEX = (() => { try { return montarDEX(window.DASH.execucao); } catch (e) { console.warn('MSL Direto fora do site: base fora do formato.', e); return null; } })();
const DNI = (() => { try { return montarDNI(window.DASH.nielsen); } catch (e) { console.warn('Nielsen fora do site: base fora do formato.', e); return null; } })();   // perna Nielsen: base própria (cubo de mercado), só existe quando o arquivo cifrado traz a base
const DMI = (() => { try { return montarDMI(window.DASH.msl_indireto); } catch (e) { console.warn('MSL Indireto fora do site: base fora do formato.', e); return null; } })();   // perna MSL Indireto: mesma regra, base própria (lojas do canal indireto)   // perna MSL Direto: só existe quando o arquivo cifrado traz a base de MSL; base quebrada não derruba as outras pernas
let MODO = 'so', D = DSO;
const T = (so, si) => (MODO === 'si' ? si : so);   // texto conforme a perna
const PERNA = () => ({si: 'Sell In', ex: 'MSL Direto', mi: 'MSL Indireto', ni: 'Nielsen'}[MODO] || 'Sell Out');
const EXM = () => MODO === 'ex' || MODO === 'mi';   // as duas pernas de MSL usam o mesmo motor (Target e Compliance)
const COL = {recorte:2, uf:3, grp:4, executivo:5, canal:6, fonte:7, janela:8, nivel:9, marca:10, segmento:11};
const RS = 12, CX = 13, PDV = 14, ANO0 = 2023;
let ANOS = [2023, 2024, 2025, 2026];
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const mes = k => MESES[k-1].toLowerCase();
const MES_LONGO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
let dic = D.dic;
const id = (c, v) => dic[c].indexOf(v);
let NIV, TODAS, TODOS, MED, MEDS, FILTROS, PAGES, MARCA_PAG, HN;
const FILTROS_SO = [['recorte','Recorte'],['uf','UF'],['grp','Grp. Econômico'],['executivo','Executivo de Vendas'],['canal','Canal'],
                    ['fonte','Fonte'],['janela','Comparabilidade'],['marca','Marca'],['segmento','Segmento']];
const FILTROS_SI = [['grp','Cliente'],['recorte','Cliente (L4)'],['executivo','Executivo'],['canal','Canal'],['uf','BU'],['marca','Marca'],['segmento','Segmento']];
const FILTROS_EX = [['bandeira','Cliente'],['executivo','Executivo'],['uf','UF'],['canal','Canal'],['ambiente','Ambiente'],['marca','Marca'],['segmento','Segmento']];
const FILTROS_MI = [['dist','Distribuidor'],['rede','Rede'],['executivo','Executivo'],['perfil','Perfil da loja'],['tipo','Tipo de loja'],['lista','Lista'],['marca','Marca'],['segmento','Segmento']];
const PAGES_MI = [['mi-inicio','Início'], ['mi-dados','Dados gerais'], ['mi-diretor','Visão do Diretor'], ['mi-redes','Distribuidores e redes'], ['mi-lojas','Lojas'], ['mi-executivos','Executivos'], ['mi-skus','SKUs e faltas'], ['mi-auditoria','Auditoria do PBI']];
const FILTROS_NI = [['canal','Canal'],['segmento','Segmento'],['fab','Fabricante'],['marca','Marca']];
const PAGES_NI = [['ni-inicio','Início'], ['ni-categorias','Categorias'], ['ni-segmentos','Segmentos'], ['ni-concorrencia','Concorrência'], ['ni-canais','Canais'], ['ni-geografia','Geografia'], ['ni-skus','SKUs'], ['ni-mes','Mês a mês']];
const PAGES_EX = [['ex-inicio','Início'], ['ex-dados','Dados gerais'], ['ex-diretor','Visão do Diretor'], ['ex-clientes','Clientes'], ['ex-lojas','Lojas'], ['ex-executivos','Executivos'], ['ex-skus','SKUs e faltas']];
const PAGES_SO = [
  ['inicio','Início'], ['geral','Dados gerais'], ['veja','Veja'], ['vanish','Vanish'], ['harpic','Harpic'], ['finish','Finish'],
  ['hn','H&N'], ['diretor','Visão do Diretor'], ['clientes','Clientes'], ['executivos','Executivos'], ['redes-scan','Redes Scanntech'], ['redes-col','Redes Colecta'], ['confronto','Confronto de fontes'], ['depara','De-para'], ['base','Base geral']];
const PAGES_SI = [
  ['si-inicio','Início'], ['si-geral','Dados gerais'], ['si-veja','Veja'], ['si-vanish','Vanish'], ['si-harpic','Harpic'], ['si-finish','Finish'],
  ['si-hn','H&N'], ['si-diretor','Visão do Diretor'], ['si-clientes','Clientes'], ['si-exec','Executivos'], ['si-q4','Plano Q4'], ['si-mes','Mês em curso'], ['si-rv','RV'], ['si-base','Base geral']];
/* linha das visões: as mesmas nas duas pernas; Plano Q4, Mês em curso e RV são do sell in (levam para a perna Sell In) */
const NAV = [['Início', 'inicio', 'si-inicio'], ['Dados gerais', 'geral', 'si-geral'], ['Visão do Diretor', 'diretor', 'si-diretor'], ['Clientes', 'clientes', 'si-clientes'],
  ['Executivos', 'executivos', 'si-exec'], ['Plano Q4', null, 'si-q4'], ['Mês em curso', null, 'si-mes'], ['RV', null, 'si-rv']];
const PAI = {veja: 'geral', vanish: 'geral', harpic: 'geral', finish: 'geral', hn: 'geral', 'si-veja': 'si-geral', 'si-vanish': 'si-geral', 'si-harpic': 'si-geral', 'si-finish': 'si-geral', 'si-hn': 'si-geral',
  'redes-scan': 'clientes', 'redes-col': 'clientes', confronto: 'inicio', depara: 'inicio', base: 'inicio', 'si-base': 'si-inicio'};
const TODAS_PAGES = [...PAGES_SO, ...PAGES_SI];
const S = {page: 'inicio', f: {}, corte: DSO.corte, ui: {}, uiSO: {}, uiSI: {}, fSO: {}, fSI: {}, corteSO: DSO.corte, corteSI: DSI ? DSI.corte : DSO.corte,
  uiEX: {}, fEX: {}, corteEX: DEX ? DEX.corte : DSO.corte, uiMI: {}, fMI: {}, corteMI: DMI ? DMI.corte : DSO.corte,
  uiNI: {}, fNI: {}, corteNI: DNI ? DNI.corte : DSO.corte, niCat: 0, niGeo: 'CTO', niMed: 0, niMk: 'padrao'};
FILTROS_SO.forEach(([k]) => { S.fSO[k] = new Set(); S.fSI[k] = new Set(); });
FILTROS_EX.forEach(([k]) => { S.fEX[k] = new Set(); });
FILTROS_MI.forEach(([k]) => { S.fMI[k] = new Set(); });
FILTROS_NI.forEach(([k]) => { S.fNI[k] = new Set(); });
function aplicarModo(m) {   // troca a perna: dados, dicionário, medidas, filtros e páginas
  if (m === 'si' && !DSI) m = 'so';
  if (m === 'ex' && !DEX) m = 'so';
  if (m === 'mi' && !DMI) m = 'so';
  if (m === 'ni' && !DNI) m = 'so';
  if (MODO === m && NIV) return;
  if (NIV) { if (MODO === 'si') S.corteSI = S.corte; else if (MODO === 'ex') S.corteEX = S.corte; else if (MODO === 'mi') S.corteMI = S.corte; else if (MODO === 'ni') S.corteNI = S.corte; else S.corteSO = S.corte; }
  if (m === 'mi') {   // MSL Indireto: o mesmo motor do MSL Direto sobre a base do canal indireto (lojas da lista oficial, sell out do Colecta)
    MODO = m; D = DMI; dic = D.dic; FILTROS = FILTROS_MI; PAGES = PAGES_MI; S.f = S.fMI; S.ui = S.uiMI; S.corte = S.corteMI;
    return;
  }
  if (m === 'ni') {   // Nielsen: cubo de mercado próprio; categoria, geografia e medida são seletores únicos
    MODO = m; D = DNI; dic = D.dic; FILTROS = FILTROS_NI; PAGES = PAGES_NI; S.f = S.fNI; S.ui = S.uiNI; S.corte = S.corteNI;
    return;
  }
  if (m === 'ex') {   // MSL Direto: base própria; as medidas, níveis e anos das outras pernas não se aplicam (o mês de corte vira o mês vigente, em AAAAMM)
    MODO = m; D = DEX; dic = D.dic; FILTROS = FILTROS_EX; PAGES = PAGES_EX; S.f = S.fEX; S.ui = S.uiEX; S.corte = S.corteEX;
    return;
  }
  MODO = m; D = m === 'si' ? DSI : DSO; dic = D.dic;
  NIV = {TOTAL: id('nivel','TOTAL'), MARCA: id('nivel','MARCA'), SEG: id('nivel','SEGMENTO')};
  TODAS = id('marca','(TODAS AS MARCAS)'); TODOS = id('segmento','(TODOS OS SEGMENTOS)');
  MED = m === 'si'
    ? {rs: {col: RS, nome: 'NR R$', curto: 'NR', media: false}, cx: {col: CX, nome: 'Caixas', curto: 'Caixas', media: false}}
    : {rs: {col: RS, nome: 'Sell out R$', curto: 'R$', media: false}, cx: {col: CX, nome: 'Caixas', curto: 'Caixas', media: false},
       pdv: {col: PDV, nome: 'PDVs positivados', curto: 'PDVs', media: true}};
  MEDS = Object.keys(MED);
  ANOS = m === 'si' ? [2024, 2025, 2026] : [2023, 2024, 2025, 2026];
  FILTROS = m === 'si' ? FILTROS_SI : FILTROS_SO;
  PAGES = m === 'si' ? PAGES_SI : PAGES_SO;
  MARCA_PAG = m === 'si' ? {'si-veja': ['VEJA'], 'si-vanish': ['VANISH'], 'si-harpic': ['HARPIC'], 'si-finish': ['FINISH']}
                         : {veja: ['VEJA'], vanish: ['VANISH'], harpic: ['HARPIC'], finish: ['FINISH']};
  HN = m === 'si'
    ? [['BEM ESTAR SEXUAL (JONTEX + OLLA)', ['JONTEX','OLLA']], ['SUSTAGEN', ['SUSTAGEN']], ['VEET E DERMODEX', ['VEET','DERMODEX']],
       ['OUTRAS DE HEALTH', ['LUFTAL','LUFTAGASTRO','LUFTALAX','STREPSILS','NALDECON','NUROMOL','LUFTAFEM']]]
    : [['SUSTAGEN', ['SUSTAGEN']], ['BEM ESTAR SEXUAL (JONTEX + OLLA)', ['JONTEX','OLLA']], ['VEET', ['VEET']]];
  S.f = m === 'si' ? S.fSI : S.fSO;
  S.ui = m === 'si' ? S.uiSI : S.uiSO;   // ordenação, abas internas e seleção não vazam de uma perna para a outra
  S.corte = m === 'si' ? S.corteSI : S.corteSO;
}
aplicarModo('so');
const modoDaPagina = pg => (String(pg).startsWith('si-') ? 'si' : String(pg).startsWith('ex-') ? 'ex' : String(pg).startsWith('mi-') ? 'mi' : String(pg).startsWith('ni-') ? 'ni' : 'so');
const INICIO = () => ({si: 'si-inicio', ex: 'ex-inicio', mi: 'mi-inicio', ni: 'ni-inicio'}[MODO] || 'inicio');

/* ---------- estado ----------
   Site (GitHub): o recorte fica no endereço da página, então o link já abre filtrado.
   Link do claude.ai (window.DASH_ARTIFACT): o endereço só aceita a página (#veja); o recorte fica lembrado neste navegador. */
const ART = !!window.DASH_ARTIFACT, CHAVE = 'dash-geral-cto';
function lerHash() {
  if (ART) {
    FILTROS.forEach(([k]) => S.f[k] = new Set()); S.corte = D.corte; S.page = 'inicio';
    let st = null; try { st = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { st = null; }
    if (st && typeof st === 'object') {
      if (PAGES.some(p => p[0] === st.page)) S.page = st.page;
      if (st.gerado === D.gerado && st.corte >= 1 && st.corte <= D.ult26) S.corte = st.corte;
      Object.entries(st.f || {}).forEach(([k, vs]) => { if (S.f[k] && Array.isArray(vs)) vs.forEach(x => { const i = id(k, x); if (i >= 0) S.f[k].add(i); }); });
    }
    const h = location.hash.slice(1); if (PAGES.some(p => p[0] === h)) S.page = h;
    return;
  }
  const partes = location.hash.slice(1).split('&').map(x => { try { return decodeURIComponent(x); } catch (e) { return ''; } });
  const [pg, ...qs] = partes;
  aplicarModo(modoDaPagina(pg));
  S.page = PAGES.some(p => p[0] === pg) ? pg : INICIO();
  FILTROS.forEach(([k]) => S.f[k].clear());
  S.corte = D.corte;
  let rg = MODO === 'mi' ? (D.RG[D.regra.padrao] ? D.regra.padrao : D.RGL[0][0]) : null;   // MSL Indireto: a régua vem do link (sem ela, a oficial)
  if (MODO === 'ni') { S.niCat = 0; S.niGeo = 'CTO'; S.niMed = 0; S.niMk = 'padrao'; }   // Nielsen: categoria, geografia, medida e mercado vêm do link
  qs.forEach(q => {
    const i = q.indexOf('='); if (i < 0) return;
    const k = q.slice(0, i), v = q.slice(i + 1);
    if (k === 'corte') { const n = +v; if (n >= 1 && n <= D.ult26) S.corte = n; }
    else if (k === 'reg' && MODO === 'mi') { if (D.RG[v]) rg = v; }
    else if (MODO === 'ni' && k === 'cat') { const i = D.cats.findIndex(c => c.cod === v); if (i >= 0) S.niCat = i; }
    else if (MODO === 'ni' && k === 'geo') { if (D.dic.geo.includes(v)) S.niGeo = v; }
    else if (MODO === 'ni' && k === 'med') S.niMed = v === '1' ? 1 : 0;
    else if (MODO === 'ni' && k === 'mk') S.niMk = v === 'total' ? 'total' : 'padrao';
    else if (S.f[k] && v) v.split('|').forEach(x => { const i = id(k, x); if (i >= 0) S.f[k].add(i); });
  });
  if (rg) { D.reg = rg; D.col.c = D.RG[rg].c; D.col.r = D.RG[rg].r; }
}
function gravarHash(novaEntrada = false) {
  if (ART) {
    const f = {}; FILTROS.forEach(([k]) => { if (S.f[k].size) f[k] = [...S.f[k]].map(i => dic[k][i]); });
    try { localStorage.setItem(CHAVE, JSON.stringify({page: S.page, corte: S.corte, gerado: D.gerado, f})); } catch (e) { /* sem memória neste navegador */ }
    return;
  }
  const p = [S.page];
  if (MODO === 'ni') { if (S.niCat) p.push('cat=' + D.cats[S.niCat].cod); if (S.niGeo !== 'CTO') p.push('geo=' + S.niGeo); if (S.niMed === 1) p.push('med=1'); if (S.niMk === 'total') p.push('mk=total'); }
  FILTROS.forEach(([k]) => { if (S.f[k].size) p.push(k + '=' + [...S.f[k]].map(i => dic[k][i]).join('|')); });
  if (S.corte !== D.corte) p.push('corte=' + S.corte);
  if (MODO === 'mi' && D.reg !== (D.regra.padrao || D.RGL[0][0])) p.push('reg=' + D.reg);
  const url = '#' + p.map(encodeURIComponent).join('&').replace(/%3D/g, '=');
  try { if (novaEntrada) history.pushState(null, '', url); else history.replaceState(null, '', url); } catch (e) { /* navegador sem histórico */ }
  ULTIMO = location.hash;   // pushState não dispara evento: a guarda do doEndereco passa a comparar com o endereço atual
}

/* ---------- motor de cálculo ---------- */
let BASE = [], PBASE = [], OMB = [], OMB_ANT = [];
function filtrar() {
  if (EXM()) { exFiltrar(); return; }   // MSL Direto e Indireto: filtra lojas e SKUs da base de MSL
  if (NIM()) { niFiltrar(); return; }   // Nielsen: as páginas somam o cubo na hora, no recorte marcado
  const ativos = FILTROS.filter(([k]) => k !== 'marca' && k !== 'segmento' && S.f[k].size).map(([k]) => [COL[k], S.f[k]]);
  BASE = D.rows.filter(r => ativos.every(([c, s]) => s.has(r[c])));
  PBASE = MODO === 'si' ? (D.plano || []).filter(r => ativos.every(([c, s]) => s.has(r[c]))) : [];
  OMB = MODO === 'si' ? omFiltrado() : [];
  OMB_ANT = MODO === 'si' && D.om && D.om.linhas_ant ? omFiltrado(D.om.linhas_ant) : [];   // faturado dos meses anteriores do trimestre
}
/* Order Management (mês em curso): [grp, executivo, canal, BU, marca, segmento, flag do item 1 da régua (definição no arquivo cifrado), faturado cx, carteira liberada cx, alocação cx, futura cx, NR/cx, sold to, UF, L4 (-1 sem par), carteira bloqueada cx] */
const OMC = {grp: 0, executivo: 1, canal: 2, uf: 3, marca: 4, segmento: 5};
function omFiltrado(linhas) {
  if (!D.om) return [];
  const at = ['grp', 'executivo', 'canal', 'uf'].filter(k => S.f[k].size).map(k => [OMC[k], S.f[k]]);
  const l4 = S.f.recorte.size ? S.f.recorte : null;   // L4 do P&L pelo código Plan to de cada pedido (coluna 14)
  return (linhas || D.om.linhas).filter(l => at.every(([c, st]) => st.has(l[c])) && (!l4 || l4.has(l[14])));
}
function omSoma({marcas = null, segs = null, chave = null, sub = null, so = null, linhas = null} = {}) {   // so: 'hyg' = só Hygiene (a régua do Q4)
  const out = new Map(), hy = id('uf', 'Hygiene');
  for (const l of linhas || OMB) {
    if (marcas && !marcas.has(l[4])) continue;
    if (segs && !segs.has(l[5])) continue;
    if (so === 'hyg' && l[3] !== hy) continue;
    if (sub && !sub(l)) continue;
    const k = chave ? chave(l) : '_';
    let o = out.get(k); if (!o) { o = {...ZERO_OM}; out.set(k, o); }
    const bq = l[15] || 0;
    o.fat += l[7]; o.cart += l[8]; o.aloc += l[9]; o.fut += l[10]; o.bloq += bq; o.nfat += l[7] * l[11]; o.ncart += (l[8] + l[9]) * l[11]; o.nfut += l[10] * l[11]; o.nbloq += bq * l[11];
    if (l[6]) { o.vfat += l[7]; o.vped += l[7] + l[8] + l[9]; }
  }
  return out;
}
const setOuNull = s => (s && s.size ? s : null);
const gMarcas = () => setOuNull(S.f.marca);
const gSegs = () => setOuNull(S.f.segmento);
const marcasDe = nomes => new Set(nomes.map(n => id('marca', n)).filter(i => i >= 0));
/* devolve Map chave -> Float64Array(48) [ano x mês], NaN = sem dado */
function cubo(med, {marcas = null, segs = null, chave = null, porMarca = false, rows = BASE, sub = null, semCorte = false} = {}) {
  const col = MED[med].col;
  const nivel = med !== 'pdv' ? NIV.SEG : (segs ? NIV.SEG : ((marcas || porMarca) ? NIV.MARCA : NIV.TOTAL));
  const out = new Map();
  for (const r of rows) {
    if (r[COL.nivel] !== nivel) continue;
    if (marcas && !marcas.has(r[COL.marca])) continue;
    if (segs && !segs.has(r[COL.segmento])) continue;
    if (sub && !sub(r)) continue;
    const k = chave ? chave(r) : '_';
    let a = out.get(k); if (!a) { a = new Float64Array(48).fill(NaN); out.set(k, a); }
    const i = (r[0] - ANO0) * 12 + r[1] - 1;
    a[i] = (isNaN(a[i]) ? 0 : a[i]) + r[col];
  }
  if (!semCorte) { const fs = fimSerie('base'); for (const a of out.values()) for (let m = fs; m < 12; m++) a[36 + m] = NaN; }   // 2026 só até o corte (e o mês parcial logo depois dele, marcado)
  return out;
}
const um = (med, o) => cubo(med, o).get('_') || new Float64Array(48).fill(NaN);
/* plano do Q4 (AR 29/09): mesmas segmentações, meses out a dez de 2026 */
const cuboP = (med, o = {}) => cubo(med, {...o, rows: PBASE, semCorte: true});
const umP = (med, o = {}) => cuboP(med, o).get('_') || new Float64Array(48).fill(NaN);
const Q4M = [10, 11, 12];
const subHyg = sub => { const hy = dic.uf.indexOf('Hygiene'); return sub ? r => r[COL.uf] === hy && sub(r) : r => r[COL.uf] === hy; };   // a régua do Q4 (página Plano Q4) usa só Hygiene
const temPlano = pa => !!pa && Q4M.some(m => v(pa, 2026, m) > 0);
const v = (a, ano, m) => a[(ano - ANO0) * 12 + m - 1];
function agg(a, ano, meses, media) {
  let s = 0, n = 0;
  for (const m of meses) { const x = v(a, ano, m); if (!isNaN(x)) { s += x; n++; } }
  return n ? (media ? s / n : s) : NaN;
}
const ate = n => Array.from({length: n}, (_, i) => i + 1);
const ytd = (a, ano, med) => agg(a, ano, ate(S.corte), MED[med].media);
const ano = (a, y, med) => agg(a, y, ate(12), MED[med].media);
const varr = (n, d) => (isFinite(n) && isFinite(d) && d > 0 && d >= 0.01 * Math.abs(n) ? n / d - 1 : NaN);   // sem % absurdo sobre base mínima (ex.: R$ 1 no mês)   // base zero ou negativa (devolução no P&L) não gera %

/* ---------- formatos pt-BR ---------- */
const nf0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const n0 = x => (isFinite(x) ? nf0.format(x) : '');
const n2 = x => (isFinite(x) ? nf2.format(x) : '');
const mi = x => (isFinite(x) ? 'R$ ' + nf2.format(x / 1e6) + ' Mi' : 'sem dado');
const curto = x => !isFinite(x) ? '' : Math.abs(x) >= 1e6 ? nf1.format(x / 1e6) + ' Mi' : Math.abs(x) >= 1e4 ? nf0.format(x / 1e3) + ' mil' : nf0.format(x);
const pc = x => (isFinite(x) ? (x > 0 ? '+' : '') + nf1.format(x * 100) + '%' : '');
const p1 = x => (isFinite(x) ? nf1.format(x * 100) + '%' : '');
const cls = x => (!isFinite(x) ? '' : x > 0.0005 ? 'up' : x < -0.0005 ? 'down' : '');
const vc = x => (isFinite(x) ? `<span class="vr ${cls(x) || 'flat'}">${pc(x)}</span>` : '');   // selo de crescimento/perda nas tabelas
const vcm = (x, m, k) => (ehParcial(m, 2026, k) && isFinite(x) ? `<span class="vr parc">${pc(x)}</span>` : vc(x));   // variação do mês parcial em cinza: ainda não é perda nem ganho
const vbig = x => (isFinite(x) ? `<span class="vbig ${cls(x) || 'flat'}">${x > 0.0005 ? '▲' : x < -0.0005 ? '▼' : '●'} ${pc(x)}</span>` : '');   // destaque nos cards e títulos
const fmtMed = (med, x) => (med === 'rs' ? mi(x) : isFinite(x) ? nf0.format(x) : 'sem dado');
const semAcento = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tit = s => esc(s).toLowerCase().replace(/(^|[\s(+.-])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bDf\b|\bGo\b|\bMs\b|\bMt\b|\bTo\b|\bPa\b|\bJc\b|\bDac\b|\bSto\b|\bVmu\b|\bVlp\b|\bVps\b|\bA\.s\.e\b/g, x => x.toUpperCase());
const mkCls = m => (m === 'VEJA' ? 'mk-veja' : m === 'VANISH' ? 'mk-vanish' : '');
const corteTxt = () => `jan a ${mes(cR())}${marcaParc(cR())}`;   // "jan a out*" quando o corte é o mês parcial; nas redes, o corte da fonte

/* ---------- componentes ---------- */
const tip = document.getElementById('tip');
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) { tip.style.opacity = 0; return; }
  tip.innerHTML = t.dataset.tip; tip.style.opacity = 1;
});
document.addEventListener('mousemove', e => {
  if (tip.style.opacity !== '1') return;
  const w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(e.clientX + 14, innerWidth - w - 8)) + 'px'; tip.style.top = (e.clientY + 16) + 'px';
});

let SLIDE = false;   // ligado enquanto os slides são montados: gráficos no tamanho do slide, não da tela de quem gera
function larguraCard() {
  if (SLIDE) return 1160;
  const app = document.getElementById('app'), w = app ? app.clientWidth : 1000;
  return w - (innerWidth < 640 ? 80 : 100);   // padding do main + padding do card
}
function chart(a, med, alto = 250, larg = null, rotulos = true, opc = {}) {
  const W = Math.round(Math.max(240, Math.min(1180, larg || larguraCard()))), H = alto, pt = 26, gw = W / 12, bw = gw * 0.3;
  const comValor = rotulos && gw >= 46, comVar = rotulos && !opc.semVar && gw >= 50;
  const pb = comVar ? 50 : 28;
  const pa = temPlano(opc.plano) ? opc.plano : null;
  let mx = 0; for (let m = 1; m <= 12; m++) for (const y of [2025, 2026]) { const x = v(a, y, m); if (x > mx) mx = x; }
  if (pa) for (const m of Q4M) { const x = v(pa, 2026, m); if (x > mx) mx = x; }
  if (!mx) return '<div class="empty">Sem dado para este recorte.</div>';
  const h = x => (isFinite(x) && x > 0 ? (x / mx) * (H - pt - pb) : 0);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MED[med].nome} 2025 e 2026 por mês">`;
  for (let m = 1; m <= 12; m++) {
    const x0 = (m - 1) * gw + gw / 2, a25 = v(a, 2025, m), a26 = v(a, 2026, m), h25 = h(a25), h26 = h(a26);
    s += `<rect x="${x0 - bw - 2}" y="${H - pb - h25}" width="${bw}" height="${h25}" rx="4" fill="#D2D2D7"/>`;
    if (h26) s += `<rect x="${x0 + 2}" y="${H - pb - h26}" width="${bw}" height="${h26}" rx="4" fill="#FF007F"/>`;
    if (h26 && comValor) s += `<text class="vl" x="${x0 + 2 + bw / 2}" y="${H - pb - h26 - 7}" text-anchor="middle" font-size="12" font-weight="600" fill="#1D1D1F">${curto(a26)}</text>`;
    const p26 = pa && !h26 ? v(pa, 2026, m) : NaN, hp = h(p26);
    if (hp) {
      s += `<rect x="${x0 + 2}" y="${H - pb - hp}" width="${bw}" height="${hp}" rx="4" fill="#6E6E73"/>`;
      if (comValor) s += `<text class="vl" x="${x0 + 2 + bw / 2}" y="${H - pb - hp - 7}" text-anchor="middle" font-size="12" font-weight="600" fill="#6E6E73">${curto(p26)}</text>`;
      const vp = varr(p26, a25), rs_ = med === 'rs' ? 'R$ ' : '';
      s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${(gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]) + marcaParc(m, 2026, opc.pk)}</text>`;
      if (comVar && isFinite(vp)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#6E6E73">${pc(vp)}</text>`;
      s += `<rect x="${(m - 1) * gw}" y="0" width="${gw}" height="${H}" fill="transparent" data-tip="${esc(`<b>${MESES[m - 1]}</b> · 2025: ${rs_}${n0(a25) || 'sem dado'} · Plano Q4 (AR): ${rs_}${n0(p26)} ${isFinite(vp) ? '· ' + pc(vp) : ''}`)}"/>`;
      continue;
    }
    s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${(gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]) + marcaParc(m, 2026, opc.pk)}</text>`;
    const vm = (opc.fv || varr)(a26, a25);
    if (comVar && isFinite(vm)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ehParcial(m, 2026, opc.pk) || Math.abs(vm) <= 0.0005 ? '#6E6E73' : vm > 0 ? '#1D7A34' : '#D70015'}">${pc(vm)}</text>`;   // mês parcial em cinza: ainda não é perda nem ganho
    const vt = opc.semVar ? NaN : (opc.fv || varr)(a26, a25);
    const t = `<b>${mesRot(m, 2026, opc.pk)}</b> · 2025: ${med === 'rs' ? 'R$ ' : ''}${n0(a25) || 'sem dado'} · 2026${ehParcial(m, 2026, opc.pk) ? ` parcial até ${parcialDe(opc.pk).ate}` : ''}: ${med === 'rs' ? 'R$ ' : ''}${n0(a26) || 'sem dado'} ${isFinite(vt) ? '· ' + pc(vt) : ''}`;
    s += `<rect x="${(m - 1) * gw}" y="0" width="${gw}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`;
  }
  return s + '</svg><div class="legend"><span><i style="background:#D2D2D7"></i>2025</span><span><i style="background:#FF007F"></i>2026 até ' + mes(fimSerie(opc.pk)) + marcaParc(fimSerie(opc.pk), 2026, opc.pk) + '</span>' +
    (pa ? '<span><i style="background:#6E6E73"></i>Plano do Q4 (AR de 29/09)</span>' : '') + (notaParcial(opc.pk) ? `<span class="parc-nota">${esc(notaParcial(opc.pk))}</span>` : '') + '</div>';
}

function tabelaMensal(a, med, pa = null) {
  const media = MED[med].media, A = ANOS, U = A.length - 1, tp = temPlano(pa), rf = a;   // o plano cobre as mesmas BUs do recorte
  const vs = j => `${String(A[j + 1]).slice(2)} vs ${String(A[j]).slice(2)}`;
  let h = '<div class="tw"><table><thead><tr><th>Mês</th>' + A.map(y => `<th>${y}</th>`).join('') + (tp ? '<th>Plano Q4</th>' : '') +
          A.slice(1).map((_, j) => `<th>${vs(j)}</th>`).join('') + (tp ? '<th>Plano vs 25</th>' : '') + '<th>Tri 26 vs 25</th></tr></thead><tbody>';
  for (let m = 1; m <= 12; m++) {
    const p = tp ? v(pa, 2026, m) : NaN;
    h += `<tr><td class="b">${mesRot(m)}</td>` + A.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(a, y, m))}</td>`).join('') + (tp ? `<td class="b pl">${n0(p)}</td>` : '');
    for (let j = 0; j < U; j++) h += `<td>${A[j + 1] === 2026 ? vcm(varr(v(a, 2026, m), v(a, A[j], m)), m) : vc(varr(v(a, A[j + 1], m), v(a, A[j], m)))}</td>`;
    if (tp) h += `<td>${vc(varr(p, v(rf, 2025, m)))}</td>`;
    if (m % 3 === 1) {
      const ms = [m, m + 1, m + 2].filter(x => x <= S.corte && isFinite(v(a, 2026, x)));
      let q = ms.length ? varr(agg(a, 2026, ms, media), agg(a, 2025, ms, media)) : NaN, pl = '';
      if (!ms.length && tp && m === 10) { q = varr(agg(pa, 2026, Q4M, false), agg(rf, 2025, Q4M, false)); pl = '<small class="pl"> plano</small>'; }
      const qp = ms.some(x => ehParcial(x));   // trimestre com o mês parcial: cinza e com asterisco
      h += `<td class="q" rowspan="3">${qp && isFinite(q) ? `<span class="vr parc">${pc(q)}*</span>` : vc(q)}${isFinite(q) ? pl : ''}</td>`;
    }
    h += '</tr>';
  }
  const y = A.map(x => ytd(a, x, med)), t = A.map(x => ano(a, x, med)), pt = tp ? agg(pa, 2026, Q4M, false) : NaN;
  h += `<tr class="tot"><td>${media ? 'Média' : 'Total'} ${corteTxt()}</td>` + y.map(x => `<td>${n0(x)}</td>`).join('') + (tp ? '<td></td>' : '') +
       A.slice(1).map((_, j) => `<td>${vc(varr(y[j + 1], y[j]))}</td>`).join('') + (tp ? '<td></td>' : '') + `<td>${vc(varr(y[U], y[U - 1]))}</td></tr>`;
  h += `<tr class="sub"><td>${media ? 'Média' : 'Total'} do ano</td>` + t.map(x => `<td>${n0(x)}</td>`).join('') + (tp ? `<td class="pl">${n0(pt)}</td>` : '') +
       A.slice(1).map((_, j) => `<td>${j < U - 1 ? vc(varr(t[j + 1], t[j])) : ''}</td>`).join('') + (tp ? `<td>${vc(varr(pt, agg(rf, 2025, Q4M, false)))}</td>` : '') + '<td></td></tr>';
  if (tp && !media) {
    const n = A.length + 2 + U + 1;
    const r26 = ano(rf, 2026, med), r25 = ano(rf, 2025, med);
    h += S.corte === D.ult26
      ? `<tr class="sub"><td>2026 com o plano</td><td colspan="${n}" class="l">${n0(r26 + pt)} = realizado de ${corteTxt()} + plano de out a dez, contra ${n0(r25)} em 2025: ${vc(varr(r26 + pt, r25))}</td></tr>`
      : `<tr class="sub"><td>2026 com o plano</td><td colspan="${n}" class="l">Volte o mês de corte para ${mes(D.ult26)} para somar o ano realizado com o plano do Q4.</td></tr>`;
  }
  return h + '</tbody></table></div>';
}

/* bloco com controle R$ · Caixas · PDVs (os três blocos do Power Query num card só) */
const BLOCOS = {};
function bloco(bid, rotulo, opts) {
  BLOCOS[bid] = {rotulo, opts};
  return `<div class="card" id="b-${bid}">${blocoIn(bid)}</div>`;
}
function blocoIn(bid) {
  const {rotulo, opts} = BLOCOS[bid], med = MED[S.ui['m' + bid]] ? S.ui['m' + bid] : 'rs';
  const a = um(med, opts), y26 = ytd(a, 2026, med), y25 = ytd(a, 2025, med), d = varr(y26, y25);
  const pa = MODO === 'si' ? umP(med, opts) : null;
  const ac = mes(S.corte) + marcaParc(S.corte), frase = med === 'pdv' ? `${n0(y26)} PDVs por mês.` : med === 'rs' ? `${mi(y26)} até ${ac}.` : `${n0(y26)} caixas até ${ac}.`;
  const resto = isFinite(d) ? ` ${vbig(d)} <span>sobre 2025${med === 'pdv' ? ', na média mensal' : ''}.</span>` : ' <span>Sem base de 2025 para comparar.</span>';
  return `<p class="eyebrow">${esc(rotulo)} · ${MED[med].nome}</p><h3>${frase}${resto}</h3>
    <div class="seg" data-bid="${bid}">${Object.keys(MED).map(k => `<button data-act="med" data-bid="${bid}" data-m="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>
    ${chart(a, med, 250, null, true, {plano: pa})}${tabelaMensal(a, med, pa)}`;
}

function kpis(opts, extra = true) {
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${vbig(d)}<span>${sub}</span></div></div>`;
  if (MODO === 'si') {   // Sell In: NR, caixas, NR por caixa e clientes com compra
    const r = um('rs', opts), c = um('cx', opts), r26 = ytd(r, 2026, 'rs'), r25 = ytd(r, 2025, 'rs'), c26 = ytd(c, 2026, 'cx'), c25 = ytd(c, 2025, 'cx');
    const G = cubo('rs', {...opts, chave: x => x[COL.grp]}), cli = y => [...G.values()].filter(a => agg(a, y, ate(S.corte), false) > 0).length;
    return `<div class="grid g4">` + card('NR ' + corteTxt(), mi(r26), varr(r26, r25), `sobre ${mi(r25)} em 2025`) +
      card('Caixas ' + corteTxt(), n0(c26), varr(c26, c25), `sobre ${n0(c25)} em 2025`) +
      card('NR por caixa', 'R$ ' + n2(r26 / c26), varr(r26 / c26, r25 / c25), `contra R$ ${n2(r25 / c25)} em 2025`) +
      card('Clientes com compra', n0(cli(2026)), varr(cli(2026), cli(2025)), `contra ${n0(cli(2025))} em 2025`) + '</div>';
  }
  const r = um('rs', opts), c = um('cx', opts), p = um('pdv', opts);
  const r26 = ytd(r, 2026, 'rs'), r25 = ytd(r, 2025, 'rs'), p26 = ytd(p, 2026, 'pdv'), p25 = ytd(p, 2025, 'pdv');
  let h = card('Sell out ' + corteTxt(), mi(r26), varr(r26, r25), `sobre ${mi(r25)} em 2025`) +
          card('Caixas ' + corteTxt(), n0(ytd(c, 2026, 'cx')), varr(ytd(c, 2026, 'cx'), ytd(c, 2025, 'cx')), 'sobre 2025') +
          card('PDVs positivados' + marcaParc(S.corte), n0(p26), varr(p26, p25), `média por mês, contra ${n0(p25)}`);
  if (extra) {
    const t26 = r26 / agg(p, 2026, ate(S.corte), false), t25 = r25 / agg(p, 2025, ate(S.corte), false);   // R$ por PDV-mês, mesmos meses
    h += card('Ticket por PDV' + marcaParc(S.corte), 'R$ ' + n0(t26), varr(t26, t25), `por mês, contra R$ ${n0(t25)}`);
  }
  return `<div class="grid ${extra ? 'g4' : 'g3'}">${h}</div>`;
}

/* tabela YTD por chave (marca, UF, distribuidor) */
function tabelaYTD(rotulo, itens, chaveFn, opts, porMarca = false) {
  const si = MODO === 'si', m2 = si ? 'cx' : 'pdv', A = ANOS, U = A.length - 1;
  const R = cubo('rs', {...opts, chave: chaveFn}), P = cubo(m2, {...opts, chave: chaveFn, porMarca});
  const PL = si ? cuboP('rs', {...opts, chave: chaveFn}) : new Map();
  const linhas = itens.map(([k, nome, extra]) => {
    const a = R.get(k), p = P.get(k), pl = PL.get(k);
    const y = A.map(x => (a ? agg(a, x, ate(S.corte), false) : NaN));
    const pp = [2025, 2026].map(x => (p ? agg(p, x, ate(S.corte), !si) : NaN));   // Sell Out: média de PDV; Sell In: soma de caixas
    const q4 = [pl ? agg(pl, 2026, Q4M, false) : NaN, a ? agg(a, 2025, Q4M, false) : NaN];
    return {nome, extra, y, pp, q4};
  }).filter(l => l.y.some(isFinite) || isFinite(l.q4[0]));
  const comPl = si && linhas.some(l => l.q4[0] > 0);
  const soma = f => linhas.reduce((s, l) => s + (isFinite(f(l)) ? f(l) : 0), 0);
  const tot = A.map((_, j) => soma(l => l.y[j]));
  const PT = um(m2, opts), tp = [ytd(PT, 2025, m2), ytd(PT, 2026, m2)];   // total do recorte, igual ao card
  linhas.sort((a, b) => (b.y[U] || 0) - (a.y[U] || 0));
  const row = (l, c) => `<tr class="${c || ''}"><td class="l">${l.nome}</td>${l.extra !== undefined ? `<td class="l">${l.extra}</td>` : ''}` +
    l.y.map((x, j) => `<td class="${j === U ? 'b' : ''}">${n0(x)}</td>`).join('') +
    A.slice(1).map((_, j) => `<td>${vc(varr(l.y[j + 1], l.y[j]))}</td>`).join('') + `<td>${p1(l.y[U] / tot[U])}</td>` +
    `<td>${n0(l.pp[0])}</td><td class="b">${n0(l.pp[1])}</td><td>${vc(varr(l.pp[1], l.pp[0]))}</td>` +
    (comPl ? `<td class="b pl">${n0(l.q4[0])}</td><td>${n0(l.q4[1])}</td><td>${vc(varr(l.q4[0], l.q4[1]))}</td>` : '') + '</tr>';
  const temExtra = itens.length && itens[0][2] !== undefined;
  const vs = j => `${String(A[j + 1]).slice(2)} vs ${String(A[j]).slice(2)}`;
  return `<div class="tw"><table><thead><tr><th class="l">${rotulo}</th>${temExtra ? `<th class="l">${T('UF', 'Canal')}</th>` : ''}${A.map(y => `<th>${T('R$', 'NR')} ${y}</th>`).join('')}
    ${A.slice(1).map((_, j) => `<th>${vs(j)}</th>`).join('')}<th>Peso 26</th><th>${T('PDVs', 'Caixas')} 25</th><th>${T('PDVs', 'Caixas')} 26</th><th>Var.</th>
    ${comPl ? '<th>Plano Q4</th><th>Q4 2025</th><th>Plano vs Q4/25</th>' : ''}</tr></thead><tbody>
    ${linhas.map(l => row(l)).join('')}${row({nome: 'Total', extra: temExtra ? '' : undefined, y: tot, pp: tp, q4: [soma(l => l.q4[0]), soma(l => l.q4[1])]}, 'tot')}</tbody></table></div>`;
}

/* ---------- selo de validade: avisa o time quando o dado está velho (mesma régua da pasta de chegada) ---------- */
const FERIADOS = new Set(['2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25', '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21',
  '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25']);   // igual ao chegada.py
function validade() {
  if (MODO === 'ex') return validadeEx();
  if (MODO === 'mi') return validadeMi();
  if (MODO === 'ni') return validadeNi();
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (MODO === 'si') {
    if (!D.om) return null;
    const o = D.om.data, d = new Date(+o.slice(0, 4), +o.slice(4, 6) - 1, +o.slice(6, 8)), dias = Math.round((hoje - d) / 864e5), dw = hoje.getDay();
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const util = dw >= 1 && dw <= 5 && !FERIADOS.has(iso), outroMes = d.getMonth() !== hoje.getMonth() || d.getFullYear() !== hoje.getFullYear();
    const velho = dias >= 4 || (dias > 0 && util && (dw === 1 || dw === 4 || hoje.getDate() >= 20 || outroMes));
    return {velho, txt: `Pedidos de ${o.slice(6, 8)}/${o.slice(4, 6)}${dias > 0 ? ` · há ${dias} dia${dias > 1 ? 's' : ''}` : ' · hoje'}`};
  }
  const esp = mesEsperado(), a = +esp.slice(0, 4), m = +esp.slice(4), co = fonte('colecta'), p = parcialDe('base');   // último mês fechado que o site precisa ter
  const fech = p ? p.mes - 1 : D.ult26, velho = 2026 < a || (2026 === a && fech < m);   // o mês parcial não conta como fechado
  const falta = velho ? ` · falta ${p && p.mes === m && a === 2026 ? 'fechar ' : ''}${mes(m)}/${String(a).slice(2)}` : '';
  return {velho, parcial: !!p, txt: `Sell out até ${mes(D.ult26)}/26${p ? ` · parcial até ${p.ate}` : ''}${co && co.extraido ? ` · Colecta de ${co.extraido.slice(0, 5)}` : ''}${falta}`};
}
const seloValidade = () => { const x = validade(); if (!x) return ''; const c = x.velho ? 'warn' : x.parcial ? 'parc' : 'ok';
  return `<span class="selo ${c}" title="${{warn: 'Dado desatualizado: veja o lembrete da Governança CTO', parc: 'Meses fechados em dia; o mês em curso entra parcial e ainda cresce até o fechamento', ok: 'Dado em dia'}[c]}">${esc(x.txt)}</span>`; };

/* ---------- data de cada fonte do Sell Out: quando foi extraída e até quando vai o dado (textos e datas vêm do arquivo cifrado) ---------- */
const FONTES_PG = {'redes-scan': ['scanntech', 'scanntech_marcas', 'scanntech_share_uf', 'redes_colecta'], 'redes-col': ['redes_colecta', 'colecta_marcas', 'scanntech']};
const FONTES_PADRAO = ['colecta', 'mtrix'];
function mesEsperado() {   // AAAAMM do último mês fechado que o site precisa ter: a partir do dia 8, o mês anterior
  const h = new Date(); let a = h.getFullYear(), m = h.getMonth() + 1 - (h.getDate() >= 8 ? 1 : 2); if (m <= 0) { m += 12; a--; }
  return `${a}${String(m).padStart(2, '0')}`;
}
const amTxt = am => `${mes(+am.slice(4))}/${am.slice(2, 4)}`;
const fonte = k => ((DSO.atualizacao || {}).fontes || []).find(f => f.id === k) || null;
const fontesDaPagina = (pg = S.page) => (FONTES_PG[pg] || FONTES_PADRAO).map(fonte).filter(Boolean);
const fechadoFonte = f => f.fechado || f.ate;   // a régua compara o último mês FECHADO: o parcial não conta
const espFonte = f => (f && f.id === 'nielsen' ? mesEsperadoNi() : mesEsperado());   // a Nielsen chega cerca de 4 semanas depois do fim do mês
const estadoFonte = f => (f.congelada ? 'flat' : fechadoFonte(f) < espFonte(f) ? 'warn' : f.parcial ? 'parc' : 'ok');
const faltaFonte = f => `Falta ${f.parcial && f.ate === espFonte(f) ? 'fechar ' : ''}${amTxt(espFonte(f))}`;
function quandoFonte(f, curto) {   // "extraído em 22/10/2026 · out/26 parcial até 21/10"; curto: "extraído em 22/10, out/26 parcial até 21/10"
  if (f.congelada) return `base encerrada, dado até ${f.ate_txt}`;
  const ext = f.extraido ? `${f.id === 'nielsen' ? 'recebido' : 'extraído'} em ${curto ? f.extraido.slice(0, 5) : f.extraido}` : '';   // a Nielsen não é extraída: o CMI manda a base
  return [ext, f.parcial ? `${f.ate_txt} parcial até ${f.ate_dia.slice(0, 5)}` : `dado até ${f.ate_txt}`].filter(Boolean).join(curto ? ', ' : ' · ');
}
const avisoFonte = f => (estadoFonte(f) === 'warn' ? `Desatualizado: ${faltaFonte(f).toLowerCase()}. ` : '') + (f.obs || '');
function faixaFontes() {   // selos "Dados de" logo abaixo do título de cada página do Sell Out, com a nota do mês parcial
  const L = MODO === 'so' ? fontesDaPagina() : MODO === 'ex' ? fontesEx() : MODO === 'mi' ? fontesMi() : MODO === 'ni' ? fontesNi() : []; if (!L.length) return '';
  const np = MODO === 'ex' ? exNotaParcial() : MODO === 'mi' ? miNotaParcial() : notaParcial();
  return `<div class="fontes"><span class="fontes-lab">Dados de</span>` +
    L.map(f => `<span class="selo ${estadoFonte(f)}" title="${esc(avisoFonte(f))}">${esc(f.nome)} · ${esc(quandoFonte(f))}</span>`).join('') +
    `<span class="fontes-site">site publicado em ${esc(DSO.gerado.split(' ')[0])}</span>${MODO === 'mi' ? `<span class="fontes-site">régua ${esc(miRegNome())}</span>` : ''}${np ? `<span class="fontes-nota">${esc(np)}</span>` : ''}</div>`;
}
const topoFontes = () => (DSO.atualizacao ? ['Sell Out', ...['scanntech'].map(fonte).filter(f => f && f.extraido).map(f => `${f.nome} de ${f.extraido.slice(0, 5)}`), `site de ${DSO.gerado.slice(0, 5)}`].join(' · ')
  : `Atualizado em ${DSO.gerado.split(' ')[0]} · Sell Out`);   // arquivo antigo, sem a data das fontes: o texto de antes

/* ---------- mês parcial do Sell Out: o mês em curso entra na base marcado como parcial ----------
   base (Colecta por segmento) = DSO.parcial; redes = a fonte da página. Sell In nunca marca. */
const PARC_PG = {'redes-scan': 'scanntech', 'redes-col': 'redes_colecta'};
const ULT_RD = {scanntech: ['ult_scan'], scanntech_marcas: ['ult_scanm', 'ult_scan'], redes_colecta: ['ult_col'], colecta_marcas: ['ult_colm', 'ult_col']};
const ultRd = k => String((ULT_RD[k] || []).map(x => RD && RD[x]).find(Boolean) || '');   // último mês (AAAAMM) que a base de redes tem desta fonte
let FR = null;   // fonte de redes da conta em curso (scanntech, scanntech_marcas, redes_colecta, colecta_marcas); null = a da página
const emFonte = (k, fn) => { const o = FR; FR = k; try { return fn(); } finally { FR = o; } };
const kPadrao = () => FR || PARC_PG[S.page] || 'base';
function parcialDe(k = kPadrao()) {   // {mes, ate: 'DD/MM'} do mês parcial da série, ou null
  if (MODO !== 'so') return null;
  if (k === 'base') return DSO.parcial && DSO.parcial.mes === DSO.ult26 ? DSO.parcial : null;
  const f = fonte(k), ult = RD ? ultRd(k) : '';
  return f && f.parcial && f.ate === ult && f.ate.startsWith('2026') ? {mes: +f.ate.slice(4), ate: f.ate_dia.slice(0, 5)} : null;
}
function corteDe(k = kPadrao()) {   // último mês de 2026 do acumulado e da tendência: o corte do site, limitado ao último mês da fonte (mês que a fonte não tem não entra como zero)
  const u = k !== 'base' ? ultRd(k) : '';
  return u.startsWith('2026') ? Math.min(S.corte, +u.slice(4)) : S.corte;
}
function fimSerie(k = kPadrao()) {   // até onde vai a série mês a mês: o corte e, quando ele é o último mês fechado, também o mês parcial, marcado
  const c = corteDe(k), p = parcialDe(k);
  return p && p.mes === c + 1 ? p.mes : c;
}
const cR = () => corteDe(FR || 'base');   // corte da conta em curso (nas redes, o da fonte)
const ehParcial = (m, ano = 2026, k) => { const p = ano === 2026 ? parcialDe(k) : null; return !!p && m === p.mes && m <= fimSerie(k); };   // o mês parcial aparece no corte ou logo depois dele
const marcaParc = (m, ano = 2026, k) => (ehParcial(m, ano, k) ? '*' : '');
const mesRot = (m, ano = 2026, k) => MESES[m - 1] + marcaParc(m, ano, k);   // rótulo de mês nos eixos e tabelas: OUT* no mês parcial
const corteRot = () => { const p = parcialDe('base'); return `${mes(S.corte)}/26${ehParcial(S.corte, 2026, 'base') ? ` (parcial até ${p.ate})` : ''}`; };
function notaParcial(k) {
  const p = parcialDe(k); if (!p || p.mes > fimSerie(k)) return '';
  return p.mes > corteDe(k) ? `* ${mes(p.mes)}/26 parcial até ${p.ate}: aparece só na série mês a mês; o acumulado e a tendência vão até ${mes(corteDe(k))}/26, último mês fechado.`
    : `* ${mes(p.mes)}/26 parcial até ${p.ate}: comparar com ${mes(p.mes)}/25 inteiro subestima o mês.`;
}

/* ---------- barra global e segmentações ---------- */
function nav() {
  const topo = document.getElementById('topo');
  const ini = INICIO();
  if (topo) topo.innerHTML = `<div class="topo-in"><a class="topo-tit" href="#${ini}" data-act="pg" data-pg="${ini}"><h1>Governança CTO</h1></a>
    <div class="topo-meio">${seloValidade()}<span>${MODO === 'so' ? esc(topoFontes()) : MODO === 'ex' ? esc(topoEx()) : MODO === 'mi' ? esc(topoMi()) : MODO === 'ni' ? esc(topoNi()) : `Atualizado em ${D.gerado.split(' ')[0]} · Sell In`}</span>${window.DASH_COFRE ? '<a href="#sair" data-act="sair" title="Fechar o acesso neste aparelho">Sair</a>' : ''}</div>
    <div class="topo-logo"><img src="assets/reckitt_logo.png" alt="Reckitt"></div></div>`;
  const atual = PAI[S.page] || S.page;
  document.getElementById('gnav').innerHTML = '<div class="nav-rol">' + (EXM() || NIM() ? PAGES.map(([pg, n]) => `<a class="nav ${atual === pg ? 'on' : ''}" href="#${pg}" data-act="pg" data-pg="${pg}">${n}</a>`).join('') : NAV.filter(([, so, si]) => (MODO === 'si' ? si : so || (DSI && si))).map(([n, so, si]) => {
    const alvo = MODO === 'si' ? si : (so || si), on = atual === so || atual === si;
    return `<a class="nav ${on ? 'on' : ''} ${n === 'RV' ? 'rv' : ''}" href="#${alvo}" data-act="pg" data-pg="${alvo}">${n}</a>`;
  }).join('')) + `</div><span class="acoes"><button class="btn-top" data-act="apres" title="Abre a página aberta como slides, no recorte marcado"><span class="lg">Modo Apresentação</span><span class="sm">Slides</span></button>
    <button class="btn-top" data-act="pdf" title="Gera a apresentação em PDF da página aberta, no recorte marcado">⤓ PDF</button>
    <button class="btn-top" data-act="excel" title="Baixa um Excel com as tabelas desta página, no recorte marcado">⤓ Excel</button></span>`;
}
function opcoes(k) {
  if (EXM()) return exOpcoes(k);
  if (NIM()) return niOpcoes(k);
  let ids = dic[k].map((_, i) => i);
  if (k === 'marca') ids = ids.filter(i => i !== TODAS);
  if (k === 'segmento') {
    const mk = gMarcas(), ok = new Set(D.rows.filter(r => r[COL.nivel] === NIV.SEG && (!mk || mk.has(r[COL.marca]))).map(r => r[COL.segmento]));
    ids = ids.filter(i => i !== TODOS && ok.has(i));
  }
  if (k === 'nivel') return ids;
  const lab = i => dic[k][i];
  return ids.sort((a, b) => lab(a).localeCompare(lab(b), 'pt-BR'));
}
function fbar() {
  const ativo = FILTROS.some(([k]) => S.f[k].size);
  document.getElementById('fbar').innerHTML = (EXM() ? exSeletorMes() + (MODO === 'mi' && D.RGL.length > 1 ? `<label class="cut">Régua <select data-act="mireg" title="Muda a régua do MSL no site inteiro">${D.RGL.map(([k, n]) => `<option value="${esc(k)}" ${k === D.reg ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>` : '') : NIM() ? niBarra() : `<label class="cut">Mês de corte <select data-act="corte">${ate(D.ult26).map(m => `<option value="${m}" ${m === S.corte ? 'selected' : ''}>${mes(m)}/26${parcialDe('base') && parcialDe('base').mes === m ? ' (parcial)' : ''}</option>`).join('')}</select></label>`) +
    (DSI || DEX || DMI || DNI ? `<span class="modo" role="tablist" aria-label="Perna"><button data-act="modo" data-m="so" class="${MODO === 'so' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'so'}">Sell Out</button>${DSI ? `<button data-act="modo" data-m="si" class="${MODO === 'si' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'si'}">Sell In</button>` : ''}${DEX ? `<button data-act="modo" data-m="ex" class="${MODO === 'ex' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'ex'}">MSL Direto</button>` : ''}${DMI ? `<button data-act="modo" data-m="mi" class="${MODO === 'mi' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'mi'}">MSL Indireto</button>` : ''}${DNI ? `<button data-act="modo" data-m="ni" class="${MODO === 'ni' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'ni'}">Nielsen</button>` : ''}</span>` : '') +
    FILTROS.map(([k, n]) => {
      const st = S.f[k];
      const txt = st.size === 1 ? nomeFiltro(k, [...st][0]) : n;
      return `<button class="chip ${st.size ? 'on' : ''}" data-act="pop" data-k="${k}">${txt}${st.size > 1 ? ` <span class="n">${st.size}</span>` : ''} <span aria-hidden="true">▾</span></button>`;
    }).join('');
  // faixa "Filtros:": cada seleção vira uma etiqueta que sai com um clique
  const tags = FILTROS.flatMap(([k, n]) => [...S.f[k]].map(i => `<button class="ftag" data-act="rmf" data-k="${k}" data-i="${i}" title="Tirar este filtro">${n}: ${nomeFiltro(k, i)} <span aria-hidden="true">×</span></button>`));
  const fs = document.getElementById('fsel');
  if (fs) fs.innerHTML = `<span class="fsel-lab">Filtros:</span><div class="fsel-box">${tags.join('') || '<span class="vazio">Nenhum filtro: visão completa da regional.</span>'}</div>
    <button class="chip clear" data-act="limpar" ${ativo ? '' : 'disabled'}>Limpar</button>`;
}
const nomeFiltro = (k, i) => (NIM() && k === 'segmento' ? esc(niSegTxt(i)) : NIM() && k === 'canal' ? niCanal(i) : !EXM() && (k === 'grp' || k === 'executivo') ? tit(dic[k][i]) : esc(dic[k][i]));   // Execução: nomes como no PBI
let POP = null;
function abrirPop(k, btn) {
  fecharPop();
  const nome = FILTROS.find(f => f[0] === k)[1], ids = opcoes(k);
  const el = document.createElement('div'); el.className = 'pop';
  el.innerHTML = `<header>${nome}<button data-act="popclear">Limpar</button></header>${ids.length > 8 ? '<input type="search" placeholder="Buscar">' : ''}
    <div class="opts">${ids.map(i => `<label class="opt"><input type="checkbox" value="${i}" ${S.f[k].has(i) ? 'checked' : ''}>${nomeFiltro(k, i)}</label>`).join('')}</div>`;
  document.body.appendChild(el);
  const r = btn.getBoundingClientRect();
  el.style.top = (r.bottom + 8) + 'px'; el.style.left = Math.max(8, Math.min(r.left, innerWidth - el.offsetWidth - 8)) + 'px';
  el.addEventListener('change', e => {
    const i = +e.target.value; e.target.checked ? S.f[k].add(i) : S.f[k].delete(i);
    if (k === 'marca') { const ok = new Set(opcoes('segmento')); S.f.segmento.forEach(s => { if (!ok.has(s)) S.f.segmento.delete(s); }); }
    atualizar(true);
  });
  el.addEventListener('click', e => {
    if (e.target.dataset.act === 'popclear') { S.f[k].clear(); el.querySelectorAll('input[type=checkbox]').forEach(c => (c.checked = false)); atualizar(true); }
  });
  const busca = el.querySelector('input[type=search]');
  if (busca) {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) busca.focus();
    busca.addEventListener('input', () => { const q = semAcento(busca.value); el.querySelectorAll('.opt').forEach(o => { o.hidden = !semAcento(o.textContent).includes(q); }); });
  }
  POP = {el, k};
}
function fecharPop() { if (POP) { POP.el.remove(); POP = null; } }
document.addEventListener('click', e => {
  if (e.target.closest('#apres, #impressao')) return;
  const t = e.target.closest('[data-act]');
  if (POP && !e.target.closest('.pop') && !(t && t.dataset.act === 'pop')) fecharPop();
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'pop') { if (POP && POP.k === t.dataset.k) fecharPop(); else abrirPop(t.dataset.k, t); }
  else if (act === 'limpar') { FILTROS.forEach(([k]) => S.f[k].clear()); atualizar(); }
  else if (act === 'rmf') { const k = t.dataset.k; S.f[k].delete(+t.dataset.i); if (k === 'marca') { const ok = new Set(opcoes('segmento')); S.f.segmento.forEach(x => { if (!ok.has(x)) S.f.segmento.delete(x); }); } atualizar(); }
  else if (act === 'apres') abrirApresentacao();
  else if (act === 'pdf') gerarPDF(t);
  else if (act === 'med') { S.ui['m' + t.dataset.bid] = t.dataset.m; document.getElementById('b-' + t.dataset.bid).innerHTML = blocoIn(t.dataset.bid); }
  else if (act === 'ui') {
    S.ui[t.dataset.k] = t.dataset.v; if (t.dataset.k === 'bnv') S.ui.pag = 0; render(false);
    if ((t.dataset.k === 'scsel' || t.dataset.k === 'clsel' || t.dataset.k.startsWith('sel')) && t.dataset.v) { const d = document.querySelector('#app .det'); if (d) { const off = document.querySelector('.gnav').offsetHeight + document.querySelector('.fbar').offsetHeight + 12; scrollTo({top: d.getBoundingClientRect().top + scrollY - off}); } }
  }
  else if (act === 'pg') { e.preventDefault(); irPara(t.dataset.pg); }
  else if (act === 'modo') { if (t.dataset.m !== MODO) irPara({si: 'si-inicio', ex: 'ex-inicio', mi: 'mi-inicio', ni: 'ni-inicio'}[t.dataset.m] || 'inicio'); }
  else if ((act === 'nimed' || act === 'nimk') && NIM()) { if (act === 'nimed') S.niMed = t.dataset.v === '1' ? 1 : 0; else S.niMk = t.dataset.v === 'total' ? 'total' : 'padrao'; atualizar(); }
  else if (act === 'nicat') { e.preventDefault(); if (NIM() && D.cats[+t.dataset.v]) { S.niCat = +t.dataset.v; ['segmento', 'fab', 'marca'].forEach(k => S.f[k].clear()); atualizar(); scrollTo({top: 0}); } }   // Nielsen: troca a categoria (segmento, fabricante e marca são da categoria)
  else if (act === 'exir') { e.preventDefault(); S.ui[t.dataset.k] = t.dataset.v; irPara(t.dataset.pg); exRolarDet(t.dataset.k, t.dataset.v); }   // Execução: abre outra página já com a aba ou o item escolhido
  else if (act === 'excel') exportarExcel(t);
  else if (act === 'csv') baixarCSV(t);
  else if (act === 'sair') { e.preventDefault(); try { localStorage.removeItem('dash-geral-cto-chave'); } catch (x) { /* nada guardado */ } location.replace(location.pathname); }
  else if (act === 'pag') { const np = Math.max(1, Math.ceil(linhasBase().length / 50)); S.ui.pag = Math.min(np - 1, Math.max(0, (S.ui.pag || 0) + +t.dataset.d)); render(false); }
  else if (act === 'sort') { const k = 'sort' + t.dataset.t; S.ui[k] = S.ui[k] === t.dataset.c ? '-' + t.dataset.c : t.dataset.c; render(false); }
});
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'corte') { S.corte = +e.target.value; atualizar(); }
  if (NIM() && ['nicat', 'nigeo', 'nimed', 'nimk'].includes(e.target.dataset.act)) {   // Nielsen: seletores únicos da barra
    const a = e.target.dataset.act, v = e.target.value;
    if (a === 'nicat' && D.cats[+v]) { S.niCat = +v; ['segmento', 'fab', 'marca'].forEach(k => S.f[k].clear()); }
    else if (a === 'nigeo') S.niGeo = v; else if (a === 'nimed') S.niMed = v === '1' ? 1 : 0; else if (a === 'nimk') S.niMk = v === 'total' ? 'total' : 'padrao';
    atualizar();
  }
  if (e.target.dataset.act === 'mireg' && MODO === 'mi' && D.RG[e.target.value]) { D.reg = e.target.value; D.col.c = D.RG[D.reg].c; D.col.r = D.RG[D.reg].r; atualizar(); }   // atualizar grava a régua no link
});
function irPara(pg) {
  fecharPop();
  const mudou = pg !== S.page, m = modoDaPagina(pg);
  if (m !== MODO) { aplicarModo(m); filtrar(); fbar(); }
  S.page = pg; S.ui.pag = 0; gravarHash(mudou); render(); scrollTo({top: 0});
}
function atualizar(manterPop) {
  S.ui.pag = 0; filtrar(); gravarHash(); fbar(); render(false);
  if (manterPop && POP) { const btn = document.querySelector(`.chip[data-k="${POP.k}"]`); if (btn) { const r = btn.getBoundingClientRect(); POP.el.style.top = (r.bottom + 8) + 'px'; } }
}
// voltar/avançar do navegador e links colados: relê o endereço
var ULTIMO = location.hash;
function doEndereco() {
  if (ART || location.hash === ULTIMO) return;
  ULTIMO = location.hash; const antes = S.page; fecharPop(); if (APRES) fecharApresentacao();
  lerHash(); filtrar(); gravarHash(); fbar(); render(); if (S.page !== antes) scrollTo({top: 0});
}
addEventListener('hashchange', doEndereco);
addEventListener('popstate', doEndereco);
// gráficos acompanham a largura da tela
let LARG = innerWidth, tRz = null;
addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => { if (Math.abs(innerWidth - LARG) > 60) { LARG = innerWidth; render(false); } }, 200); });

/* ---------- páginas (mesma ordem das abas do Dash Power Query) ---------- */
function hero(eyebrow, t1, t2, side = '', sub = '') {   // sub: frase descritiva abaixo do título, quando a parte cinza do título traz a conclusão
  return `<section class="hero${eyebrow ? ' sm' : ''}"><div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${t1} <span>${t2}</span></h1>${sub ? `<p class="hero-sub">${sub}</p>` : ''}${faixaFontes()}</div>${side}</section>`;
}
const recorteResumo = () => FILTROS.filter(([k]) => S.f[k].size).map(([k, n]) => `${n}: ${[...S.f[k]].map(i => (NIM() ? nomeFiltro(k, i) : EXM() ? esc(dic[k][i]) : tit(dic[k][i]))).join(', ')}`).join(' · ');
function recorteTxt() { return ''; }   // o recorte aparece na faixa "Filtros:" do topo, nos slides e no Excel

function pgInicio() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  const side = `<div class="side">${(D.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Corte ${corteRot()} · ${n0(D.rows.length)} linhas na base</div>`;
  let h = hero('', 'Governança CTO.', 'Sell out do Centro-Oeste, mês a mês.', side);
  // linha de marcas
  const pn = [['geral', 'Total', null], ...['VEJA','VANISH','HARPIC','FINISH'].map(m => [m.toLowerCase(), tit(m), [m]]), ['hn', 'H&N', ['SUSTAGEN','JONTEX','OLLA','VEET']]];
  h += '<div class="pnav">' + pn.map(([pg, nome, mk]) => {
    const a = um('rs', {marcas: mk ? marcasDe(mk) : op.marcas, segs: op.segs}); const d = varr(ytd(a, 2026, 'rs'), ytd(a, 2025, 'rs'));
    return `<a href="#${pg}" data-act="pg" data-pg="${pg}"><div class="mk ${mkCls(mk && mk[0])}">${nome}</div><div class="v">${mi(ytd(a, 2026, 'rs'))} · ${vc(d)}</div></a>`;
  }).join('') + '</div>';
  h += recorteTxt();
  h += `<h2 class="sec">O ano em números. <span>Acumulado de ${corteTxt()} contra o mesmo período de 2025.</span></h2>` + kpis(op);
  // prateleira de marcas
  const MK = ['VEJA','VANISH','HARPIC','FINISH','SUSTAGEN','JONTEX','OLLA','VEET'];
  const R = cubo('rs', {chave: r => r[COL.marca], segs: op.segs});
  h += `<h2 class="sec">As marcas. <span>Cada uma com a sua curva.</span></h2><div class="shelf">` + MK.map(m => {
    const a = R.get(id('marca', m)); if (!a) return '';
    const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs');
    const pg = MARCA_PAG[m.toLowerCase()] ? m.toLowerCase() : 'hn';
    return `<a class="card" href="#${pg}" data-act="pg" data-pg="${pg}"><p class="eyebrow ${mkCls(m)}">${tit(m)}</p><div class="kpi"><div class="val" style="font-size:30px">${mi(y26)}</div>
      <div class="sub">${vc(varr(y26, y25))} sobre 2025</div></div>${chart(a, 'rs', 120, 244, false).replace(/<div class="legend">.*<\/div>$/, '')}</a>`;
  }).join('') + '</div>';
  // prateleira de distribuidores
  const G = cubo('rs', {...op, chave: r => r[COL.grp]});
  const gl = [...G.entries()].map(([k, a]) => ({k, y26: ytd(a, 2026, 'rs'), y25: ytd(a, 2025, 'rs')})).filter(x => isFinite(x.y26)).sort((a, b) => b.y26 - a.y26);
  h += `<h2 class="sec">Os distribuidores. <span>Quem puxa e quem segura o ano.</span></h2><div class="shelf">` + gl.map(x => {
    const nome = dic.grp[x.k], uf = D.depara.find(d => d.grp === nome);
    return `<div class="card kpi"><p class="eyebrow">${uf ? uf.uf + ' · ' + tit(uf.canal) : ''}</p><h3>${tit(nome)}</h3><div class="val" style="font-size:28px">${mi(x.y26)}</div>
      <div class="sub">${vc(varr(x.y26, x.y25))} sobre 2025${uf ? ' · ' + uf.executivo : ''}</div></div>`;
  }).join('') + '</div>';
  // índice
  const IDX = [['geral','Dados gerais','Total da carteira: R$, caixas e PDVs mês a mês, ticket, R$ por caixa, marca a marca, UF contra UF e distribuidor a distribuidor.'],
    ['veja','Veja','Visão marca e segmentos: VMU, VLP, VPS, Cozinha, Banheiro, Vidros, Desinfetante e Gel.'],
    ['vanish','Vanish','Visão marca e segmentos: Líquido, Pó, Barra e Outros.'],
    ['harpic','Harpic','Visão marca e segmentos: Pedra, Pastilha, Caixa Acoplada, Líquido, Fresh Power 6, Bloco e Click Gel.'],
    ['finish','Finish','Visão marca e segmentos: Pó, Secante e Tabletes.'],
    ['hn','H&N','Health & Nutrition: Sustagen, Bem Estar Sexual (Jontex + Olla) e Veet.'],
    ['diretor','Visão do Diretor','Distribuidor x marca x ano, no acumulado.'],
    ['clientes','Clientes','Curvas por distribuidor, quem soma e quem tira do ano, e as abas das redes compradoras.'],
    ['executivos','Executivos','As mesmas curvas por executivo, com os distribuidores de cada carteira.'],
    ['redes-scan','Redes Scanntech','Redes de varejo: Reckitt, mercado e share por rede e UF, quem cresce e quem cai, mês a mês.'],
    ['redes-col','Redes Colecta','Redes que compram dos distribuidores, por executivo, UF e distribuidor, cruzadas com a Scanntech.'],
    ['confronto','Confronto de fontes','MTRIX x Colecta nos mesmos meses, distribuidor, marca e segmento.'],
    ['depara','De-para','Hierarquia, fonte por período e a régua única de segmentos.'],
    ['base','Base geral','A base longa que alimenta tudo, filtrada pelas segmentações, com download em CSV.']];
  h += `<h2 class="sec">O índice. <span>Na mesma ordem das abas do Dash Power Query.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como usar as segmentações. <span>As mesmas regras do Excel.</span></h2><div class="card"><ol class="num">
    <li>As segmentações no topo valem para o site inteiro: marcar GO em Veja filtra também Dados gerais, Vanish e o resto. ${ART ? 'O recorte fica lembrado neste navegador na próxima vez que você abrir o link.' : 'O link da página guarda o recorte, então dá para mandar a visão já filtrada.'}</li>
    <li>Marca e Segmento: escolha Veja e depois Cozinha para ver só Veja Cozinha. Sem marca marcada, a positivação vem do total do distribuidor, sem soma dupla.</li>
    <li>Comparabilidade: "1. Mesma régua" mostra só os meses em que os dois anos vêm da mesma ferramenta (a leitura mais limpa de crescimento). Marque 1 e 2 para a série emendada. "3. Fora da janela" são meses que um dos anos não tem.</li>
    ${(D.regras || []).map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>`;
  return h;
}

function pgGeral() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('Dados gerais', 'Total da carteira.', 'Sell out do canal indireto CTO, em R$, caixas e PDVs, mês a mês.') + recorteTxt() + kpis(op);
  h += `<h2 class="sec">Visão total. <span>Os três blocos do Power Query num card só.</span></h2>` + bloco('geral', 'Total', op);
  // ticket e R$ por caixa
  const r = um('rs', op), c = um('cx', op), p = um('pdv', op);
  const div = (a, b) => { const o = new Float64Array(48).fill(NaN); for (let i = 0; i < 48; i++) o[i] = a[i] / b[i]; return o; };
  const tk = div(r, p), rc = div(r, c);
  const mini = (a, den, t, sub) => `<div class="card"><p class="eyebrow">${t}</p><h3>R$ ${n2(agg(r, 2026, ate(S.corte), false) / agg(den, 2026, ate(S.corte), false))} no acumulado. <span>${sub}</span></h3><div class="tw"><table><thead><tr><th>Mês</th>${ANOS.map(y => `<th>${y}</th>`).join('')}<th>26 vs 25</th></tr></thead><tbody>` +
    ate(12).map(m => `<tr><td class="b">${mesRot(m)}</td>${ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n2(v(a, y, m))}</td>`).join('')}<td>${vcm(varr(v(a, 2026, m), v(a, 2025, m)), m)}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<h2 class="sec">Ticket e R$ por caixa. <span>Quanto cada PDV compra e quanto vale cada caixa.</span></h2><div class="grid g2">` +
    mini(tk, p, 'Ticket médio · R$ por PDV', 'Por PDV positivado no mês.') + mini(rc, c, 'R$ por caixa', 'Caixas não comparam entre ferramentas.') + '</div>';
  const MK = dic.marca.map((m, i) => [i, tit(m)]).filter(([i]) => i !== TODAS);
  h += `<h2 class="sec">Marca a marca. <span>Acumulado de ${corteTxt()}.</span></h2><div class="card">` + tabelaYTD('Marca', MK, r => r[COL.marca], op, true) + '</div>';
  const UFS = ['DF','GO','MS','MT','TO','PA'].map(u => [id('uf', u), u]);
  h += `<h2 class="sec">UF contra UF. <span>PA é o JC PA, fora da Área 7.</span></h2><div class="card">` + tabelaYTD('UF', UFS, r => r[COL.uf], op) + '</div>';
  const GR = D.depara.map(d => [id('grp', d.grp), tit(d.grp), d.uf]);
  h += `<h2 class="sec">Distribuidor a distribuidor. <span>Ordenado pelo sell out de 2026.</span></h2><div class="card">` + tabelaYTD('Grp. econômico', GR, r => r[COL.grp], op) + '</div>';
  return h;
}

function segsDaMarca(nomes) {
  const mk = marcasDe(nomes), s = new Set();
  D.rows.forEach(r => { if (r[COL.nivel] === NIV.SEG && mk.has(r[COL.marca])) s.add(r[COL.segmento]); });
  return [...s];
}
function secaoMarca(chave, rotulo, nomes) {
  const mk = marcasDe(nomes), segsG = gSegs(), op = {marcas: mk, segs: segsG};
  let h = kpis(op) + `<h2 class="sec">${tit(rotulo)} · visão marca. <span>${T('R$, caixas e PDVs mês a mês.', 'NR e caixas mês a mês.')}</span></h2>` + bloco(chave, tit(rotulo), op);
  // matriz segmento x mês
  const med = MED[S.ui['mat' + chave]] ? S.ui['mat' + chave] : 'rs';
  const segs = segsDaMarca(nomes).filter(s => !segsG || segsG.has(s));
  const C = cubo(med, {marcas: mk, segs: segsG || new Set(segsDaMarca(nomes)), chave: r => r[COL.segmento]});   // matriz sempre no nível segmento
  const L = segs.map(s => ({s, a: C.get(s)})).filter(x => x.a).map(x => ({...x, y25: ytd(x.a, 2025, med), y26: ytd(x.a, 2026, med)})).sort((a, b) => (b.y26 || 0) - (a.y26 || 0));
  const botoesMat = `<div class="seg">${Object.keys(MED).map(k => `<button data-act="ui" data-k="mat${chave}" data-v="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>`;
  if (!L.length) return h + `<div class="card">${botoesMat}<div class="empty">Sem segmento para este recorte.</div></div>`;
  const tot = new Float64Array(48).fill(NaN);
  L.forEach(x => x.a.forEach((val, i) => { if (!isNaN(val)) tot[i] = (isNaN(tot[i]) ? 0 : tot[i]) + val; }));
  const TT = {s: -1, a: tot, y25: ytd(tot, 2025, med), y26: ytd(tot, 2026, med)};
  const media = MED[med].media, nomeS = s => (s < 0 ? 'Total' : tit(dic.segmento[s]));
  const meses = [...ate(12).map(m => [2025, m]), ...ate(12).map(m => [2026, m])];
  h += `<h2 class="sec">Segmentos mês a mês. <span>${med === 'pdv' ? 'PDVs somam segmentos (o mesmo PDV aparece em mais de um).' : 'Peso de cada segmento no acumulado de 2026.'}</span></h2><div class="card">
    ${botoesMat}
    <div class="tw"><table><thead><tr><th>Segmento</th>${meses.map(([y, m]) => `<th>${MESES[m - 1]}/${String(y).slice(2)}${marcaParc(m, y)}</th>`).join('')}<th>${media ? 'Média' : 'YTD'} 25</th><th>${media ? 'Média' : 'YTD'} 26</th><th>26 vs 25</th>${media ? '' : '<th>Peso 26</th>'}</tr></thead><tbody>` +
    [...L, TT].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>${meses.map(([y, m]) => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(x.a, y, m))}</td>`).join('')}
      <td>${n0(x.y25)}</td><td class="b">${n0(x.y26)}</td><td>${vc(varr(x.y26, x.y25))}</td>${media ? '' : `<td>${p1(x.y26 / TT.y26)}</td>`}</tr>`).join('') + '</tbody></table></div>';
  // trimestres
  h += `<p class="eyebrow" style="margin-top:26px">Trimestres · ${MED[med].nome}</p><div class="tw"><table><thead><tr><th>Segmento</th>` +
    [1, 2, 3, 4].map(q => { const ms = [q * 3 - 2, q * 3 - 1, q * 3], pq = ms.some(m => ehParcial(m)) ? '*' : '', pd = ms.some(m => ehParcial(m) && m <= S.corte) ? '*' : ''; return `<th>Q${q}'25</th><th>Q${q}'26${pq}</th><th>Desvio Q${q}${pd}</th>`; }).join('') + `${media ? '' : '<th>Peso seg.</th>'}<th>YTD</th></tr></thead><tbody>` +
    [...L, TT].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>` + [1, 2, 3, 4].map(q => {
      const ms = [q * 3 - 2, q * 3 - 1, q * 3], ok = ms.filter(m => m <= S.corte && isFinite(v(x.a, 2026, m)));
      const a26 = agg(x.a, 2026, ms, media), a25 = agg(x.a, 2025, ms, media), d = ok.length ? varr(agg(x.a, 2026, ok, media), agg(x.a, 2025, ok, media)) : NaN;
      return `<td>${n0(a25)}</td><td class="b">${n0(a26)}</td><td>${vc(d)}</td>`;
    }).join('') + `${media ? '' : `<td>${p1(x.y26 / TT.y26)}</td>`}<td class="b">${vc(varr(x.y26, x.y25))}</td></tr>`).join('') + '</tbody></table></div>' +
    `<p class="note" style="margin:10px 0 0">O desvio do trimestre compara só os meses de 2026 ${parcialDe() && parcialDe().mes <= S.corte ? 'até o corte' : 'já fechados'} contra os mesmos meses de 2025.${notaParcial() ? ' ' + esc(notaParcial()) : ''}</p></div>`;
  // segmento a segmento
  const RS_ = med === 'rs' ? C : cubo('rs', {marcas: mk, segs: segsG, chave: r => r[COL.segmento]});
  const ordem = L.map(x => x.s);
  let sel = +(S.ui['sg' + chave] ?? ordem[0]); if (!ordem.includes(sel)) sel = ordem[0];
  h += `<h2 class="sec">Segmento a segmento. <span>Escolha o segmento para abrir ${T('R$, caixas e PDVs', 'NR e caixas')}.</span></h2><div class="shelf">` + ordem.map(s => {
    const a = RS_.get(s); if (!a) return ''; const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs');
    return `<button class="card kpi" data-act="ui" data-k="sg${chave}" data-v="${s}" style="border:0;text-align:left;cursor:pointer;flex-basis:220px;${s === sel ? 'box-shadow:inset 0 0 0 2px #1D1D1F' : ''}">
      <div class="lab">${tit(dic.segmento[s])}</div><div class="val" style="font-size:26px">${mi(y26)}</div><div class="sub">${vc(varr(y26, y25))} sobre 2025</div></button>`;
  }).join('') + '</div>';
  h += bloco(chave + '_s' + sel, `${tit(rotulo)} · ${tit(dic.segmento[sel])}`, {marcas: mk, segs: new Set([sel])});
  if (MODO === 'si') {   // Sell In: curvas por cliente dentro da marca
    const Lc = curvasDados(r => r[COL.grp], op);
    h += `<h2 class="sec">Cliente a cliente em ${tit(rotulo)}. <span>Quem cresce e quem cai na marca, com o plano do Q4. Clique no nome para abrir.</span></h2>` + termometro(Lc.map(x => ({v: x.d}))) +
      `<div class="card">${tabelaCurvas('mk' + chave, 'Cliente', Lc, k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? esc(d.executivo) : ''; })}</div>`;
    const sl = S.ui['selmk' + chave];
    if (sl !== undefined && sl !== '' && Lc.some(x => String(x.k) === String(sl))) h += detalheChave('mk' + chave, +sl, COL.grp, `${tit(dic.grp[+sl])} · ${tit(rotulo)}`, op);
  }
  return h;
}
function pgMarca(pg) {
  const nome = MARCA_PAG[pg][0];
  const sub = {VEJA: 'Multiuso, limpeza pesada, cozinha, banheiro e vidros.', VANISH: 'Tira manchas em líquido, pó e barra.', HARPIC: 'Cuidado do vaso: pedra, pastilha, caixa acoplada e líquido.', FINISH: 'Lava-louças: pó, secante e tabletes.'}[nome];
  return hero(`<span class="${mkCls(nome)}">${tit(nome)}</span>`, `${tit(nome)}.`, sub) + recorteTxt() + secaoMarca(pg, nome, MARCA_PAG[pg]);
}
function pgHN() {
  let h = hero('H&N', 'Health & Nutrition.', T('Sustagen, Bem Estar Sexual (Jontex + Olla) e Veet.', 'Jontex e Olla, Sustagen, Veet e as outras marcas de Health, com o AR do Q4 de H&N.')) + recorteTxt();
  h += `<div class="pills">${HN.map(([r], i) => `<button data-act="ui" data-k="hn" data-v="${i}" class="${+(S.ui.hn || 0) === i ? 'on' : ''}">${tit(r)}</button>`).join('')}</div>`;
  const [rot, mks] = HN[+(S.ui.hn || 0)];
  return h + secaoMarca('hn' + (S.ui.hn || 0), rot, mks);
}

function pgDiretor() {
  const segs = gSegs(), MK = ['VEJA','VANISH','HARPIC','FINISH'], si = MODO === 'si';
  const R = cubo('rs', {segs, chave: r => r[COL.grp] + '|' + r[COL.marca]});
  const RT = cubo('rs', {marcas: gMarcas(), segs, chave: r => r[COL.grp]}), CT = cubo('cx', {marcas: gMarcas(), segs, chave: r => r[COL.grp]});
  const PT = si ? cuboP('rs', {marcas: gMarcas(), segs, chave: r => r[COL.grp]}) : new Map();
  const y = (a, yr) => (a ? agg(a, yr, ate(S.corte), false) : NaN);
  const linhas = D.depara.map(d => {
    const g = id('grp', d.grp);
    const cols = MK.map(m => [y(R.get(g + '|' + id('marca', m)), 2025), y(R.get(g + '|' + id('marca', m)), 2026)]);
    cols.push([y(RT.get(g), 2025), y(RT.get(g), 2026)], [y(CT.get(g), 2025), y(CT.get(g), 2026)]);
    if (si) cols.push([RT.get(g) ? agg(RT.get(g), 2025, Q4M, false) : NaN, PT.get(g) ? agg(PT.get(g), 2026, Q4M, false) : NaN]);
    return {nome: tit(d.grp), uf: si ? tit(d.uf) : d.uf, cols};
  }).filter(l => l.cols.some(c => isFinite(c[0]) || isFinite(c[1])));
  const tsum = j => [0, 1].map(k => linhas.reduce((s, l) => s + (isFinite(l.cols[j][k]) ? l.cols[j][k] : 0), 0));
  const tot = {nome: T('Total Área 7 + JC PA', 'Total CTO'), uf: '', cols: linhas[0] ? linhas[0].cols.map((_, j) => tsum(j)) : []};
  const sk = S.ui.sortrob || '-5';
  const j = Math.abs(+sk), desc = sk.startsWith('-');
  linhas.sort((a, b) => ((b.cols[j][1] || 0) - (a.cols[j][1] || 0)) * (desc ? 1 : -1));
  const heads = [...MK.map(tit), T('Total R$', 'Total NR'), 'Caixas', ...(si ? ['Q4: plano'] : [])];
  const row = (l, c) => `<tr class="${c || ''}"><td class="l b">${l.nome}</td><td class="l">${l.uf}</td>` + l.cols.map(([a, b]) => `<td>${n0(a)}</td><td class="b">${n0(b)}</td><td>${vc(varr(b, a))}</td>`).join('') + '</tr>';
  return hero('Visão do Diretor', T('Distribuidor x marca.', 'Cliente x marca.'), `Acumulado de ${corteTxt()}, 2025 contra 2026${T('.', '; no fim, o plano do Q4 contra o Q4 de 2025.')}`) + recorteTxt() +
    `<div class="card"><div class="tw"><table><thead><tr><th class="l">${T('Grp. econômico', 'Cliente')}</th><th class="l">${T('UF', 'Canal')}</th>` +
    heads.map((hh, i) => `<th class="sort" data-act="sort" data-t="rob" data-c="${i}" colspan="3" style="text-align:center">${hh} ${Math.abs(+sk) === i ? (desc ? '↓' : '↑') : ''}</th>`).join('') +
    `</tr><tr><th></th><th></th>${heads.map((_, i) => (si && i === heads.length - 1 ? '<th>Q4 2025</th><th>Plano</th><th>Var.</th>' : '<th>2025</th><th>2026</th><th>Var.</th>')).join('')}</tr></thead><tbody>${linhas.map(l => row(l)).join('')}${row(tot, 'tot')}</tbody></table></div>
    <p class="note" style="margin:12px 0 0">Clique no nome da coluna para ordenar pelo valor de 2026${T('', ' (ou do plano)')}. As colunas de marca respeitam o filtro de segmento; ${T('Total R$', 'Total NR')} e Caixas respeitam marca e segmento.</p></div>`;
}

let GRP_INFO = null;
function grpInfo() {   // recorte, executivo e canal de cada distribuidor, para filtrar o confronto
  if (GRP_INFO) return GRP_INFO;
  GRP_INFO = {};
  D.rows.forEach(r => {
    const g = dic.grp[r[COL.grp]], x = GRP_INFO[g] || (GRP_INFO[g] = {recorte: new Set(), executivo: new Set(), canal: new Set()});
    x.recorte.add(r[COL.recorte]); x.executivo.add(r[COL.executivo]); x.canal.add(r[COL.canal]);
  });
  return GRP_INFO;
}
function confLinhas() {
  const nivel = S.ui.cnv || 'TOTAL', busca = semAcento(S.ui.cbusca || ''), G = grpInfo();
  const nomes = k => (S.f[k].size ? new Set([...S.f[k]].map(i => dic[k][i])) : null);
  const uf = nomes('uf'), gr = nomes('grp'), mk = nomes('marca'), sg = nomes('segmento');
  const porGrp = ['recorte', 'executivo', 'canal'].filter(k => S.f[k].size);
  return D.confronto.filter(x => {
    const nv = x.marca === '(TODAS AS MARCAS)' ? 'TOTAL' : x.segmento === '(TODOS OS SEGMENTOS)' ? 'MARCA' : 'SEGMENTO';
    const info = G[x.grp];
    return nv === nivel && (!uf || uf.has(x.uf)) && (!gr || gr.has(x.grp)) && (!mk || nv === 'TOTAL' || mk.has(x.marca)) &&
      (!sg || nv !== 'SEGMENTO' || sg.has(x.segmento)) &&
      porGrp.every(k => info && [...S.f[k]].some(i => info[k].has(i))) &&
      (!busca || semAcento(x.grp + ' ' + x.marca + ' ' + x.segmento).includes(busca));
  });
}
const leitConf = x => { if (x.mx_rs <= 0) return ['Só no Colecta', 'warn']; const q = x.co_rs / x.mx_rs; return q >= 0.95 && q <= 1.05 ? ['Bate (±5%)', 'up'] : q > 1.05 ? ['Colecta mede mais', 'warn'] : ['Colecta mede menos', 'down']; };
function confRes() {
  const nivel = S.ui.cnv || 'TOTAL', L = confLinhas(), bate = L.filter(x => leitConf(x)[0].startsWith('Bate')).length;
  return `<div class="grid g3"><div class="card kpi"><div class="lab">Comparações</div><div class="val">${n0(L.length)}</div><div class="sub">no nível ${nivel.toLowerCase()}</div></div>
     <div class="card kpi"><div class="lab">Batem em ±5%</div><div class="val">${n0(bate)}</div><div class="sub">${L.length ? p1(bate / L.length) + ' das comparações' : 'nada neste recorte'}</div></div>
     <div class="card kpi"><div class="lab">Regra adotada</div><div class="val" style="font-size:22px;line-height:1.3">Colecta é o padrão</div><div class="sub">MTRIX onde o Colecta não tem o dado</div></div></div>
    <div class="card"><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th><th class="l">Período</th><th>Meses</th><th class="l">Marca</th><th class="l">Segmento</th>
      <th>R$ MTRIX</th><th>R$ Colecta</th><th>Colecta / MTRIX</th><th>PDVs/mês MTRIX</th><th>PDVs/mês Colecta</th><th>Colecta / MTRIX</th><th class="l">Leitura</th><th class="l">Fonte adotada</th></tr></thead><tbody>` +
    (L.map(x => { const [t, c] = leitConf(x); return `<tr><td class="l b">${tit(x.grp)}</td><td class="l">${x.uf}</td><td class="l">${x.periodo}</td><td>${x.meses}</td><td class="l ${mkCls(x.marca)}">${tit(x.marca)}</td><td class="l">${tit(x.segmento)}</td>
      <td>${n0(x.mx_rs)}</td><td>${n0(x.co_rs)}</td><td class="b">${x.mx_rs ? n2(x.co_rs / x.mx_rs) : ''}</td><td>${n0(x.mx_pdv)}</td><td>${n0(x.co_pdv)}</td><td>${x.mx_pdv ? n2(x.co_pdv / x.mx_pdv) : ''}</td>
      <td class="l ${c}">${t}</td><td class="l">${esc(x.adotada)}</td></tr>`; }).join('') || '<tr><td colspan="14" class="empty">Nada neste recorte.</td></tr>') + '</tbody></table></div></div>';
}
function pgConfronto() {
  const nivel = S.ui.cnv || 'TOTAL';
  const fora = (S.f.fonte.size || S.f.janela.size) ? '<p class="note">Fonte e Comparabilidade não se aplicam aqui: o confronto já compara as duas fontes nos mesmos meses.</p>' : '';
  return hero('Confronto de fontes', 'MTRIX x Colecta.', 'Mesmos meses, mesmo distribuidor. Razão perto de 1,00 = as duas medem igual.') + recorteTxt() + fora +
    `<div class="pills" style="margin-bottom:16px">${['TOTAL','MARCA','SEGMENTO'].map(n => `<button data-act="ui" data-k="cnv" data-v="${n}" class="${n === nivel ? 'on' : ''}">${tit(n)}</button>`).join('')}
      <input class="find" id="cbusca" type="search" placeholder="Buscar distribuidor, marca ou segmento" value="${esc(S.ui.cbusca || '')}" aria-label="Buscar no confronto"></div>
    <div id="conf-res">${confRes()}</div>`;
}

/* ---------- Redes: Scanntech (varejo) e Colecta (clientes dos distribuidores) ---------- */
const RD = D.redes || null;
let RD_ULT = null;
if (RD && RD.scanm) Object.keys(RD.scanm).forEach(k => { RD.scanm[k] = RD.scanm[k].filter(l => l[0] !== 'Tudo' && l[1] !== 'Tudo'); });   // 'Tudo' = total do Tableau
const BASE_COMP = new Set(RD && RD.base_comp ? RD.base_comp : []);
const RM = RD ? RD.meses : [];
const nomeRaiz = r => { if (r === 'DEMAIS') return 'Demais clientes'; if (r === 'PF') return 'Pessoa física e sem CNPJ'; const n = RD.nomes[r] || {}; return (n.fantasia || n.razao || 'CNPJ ' + r); };
const mesesAte = (ano, n) => ate(n).map(m => RM.indexOf(`${ano}${String(m).padStart(2, '0')}`)).filter(i => i >= 0);
const varR = (a, b) => (isFinite(a) && isFinite(b) && b >= 1000 && a > 0 && a / b <= 10 ? a / b - 1 : NaN);   // evita % absurdo sobre base mínima
const rsx = v => (Math.abs(v) >= 1e6 ? mi(v) : 'R$ ' + n0(v));   // R$ Mi só a partir de 1 milhão
const varQ = (a, b) => (isFinite(b) && b >= 1000 && !(a > 0) ? -1 : varR(a, b));   // base relevante e zero agora = parou de vender (-100%)
function parR(arr, ref) {   // soma 26 e 25 só nos meses até o corte (da fonte) com valor nos dois anos (ref decide o pareamento)
  ref = ref || arr; let a = 0, b = 0;
  for (let m = 1, c = cR(); m <= c; m++) { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`);
    if (ref[i5] > 0 && ref[i6] > 0) { a += arr[i6] || 0; b += arr[i5] || 0; } }
  return [a, b];
}
const somaI = (arr, idx) => idx.reduce((s, i) => s + (arr[i] || 0), 0);
const ytdR = (arr, ano) => somaI(arr, mesesAte(ano, cR()));
function triR(arr) {   // últimos 3 meses até o corte (da fonte) contra os 3 anteriores (tendência dentro de 2026)
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
  if (fim < 5) return [NaN, NaN];
  return [somaI(arr, [fim - 2, fim - 1, fim]), somaI(arr, [fim - 5, fim - 4, fim - 3])];
}
function serie48(arr) {
  const a = new Float64Array(48).fill(NaN);
  RM.forEach((m, i) => { const y = +m.slice(0, 4), mo = +m.slice(4); if (arr[i]) a[(y - ANO0) * 12 + mo - 1] = arr[i]; });
  for (let m = fimSerie(FR || undefined); m < 12; m++) a[36 + m] = NaN;   // até o corte da fonte, mais o mês parcial logo depois dele
  return a;
}
const somaArr = (lista, campo) => { const o = new Array(RM.length).fill(0); lista.forEach(x => x[campo].forEach((v, i) => { o[i] += v || 0; })); return o; };
const nomesSel = k => (S.f[k].size ? new Set([...S.f[k]].map(i => dic[k][i])) : null);
const GRUPO_MARCA = m => (['SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'].includes(m) ? 'HN' : m);
const marcasRede = () => (S.f.marca.size ? new Set([...S.f.marca].map(i => GRUPO_MARCA(dic.marca[i]))) : null);
const marcasScan = () => (S.f.marca.size ? new Set([...S.f.marca].map(i => dic.marca[i])) : null);
const temHN = () => [...S.f.marca].some(i => GRUPO_MARCA(dic.marca[i]) === 'HN');
const CRUZ = {};   // 'REDE|UF' -> raízes do Colecta; 'raiz' -> [rede|uf]
if (RD) (RD.cruz || []).forEach(c => { CRUZ[c.rede + '|' + c.uf] = c.raizes; c.raizes.forEach(r => { (CRUZ['r:' + r] = CRUZ['r:' + r] || []).push(c.rede + '|' + c.uf); }); });
function leituraRede(r, m, so, motivo) {
  if (motivo) return motivo;
  if (so) return ['Só Reckitt (rede não libera o mercado)', 'flat'];
  if (r === -1) return ['Parou de vender', 'down'];
  if (!isFinite(r)) return ['Sem base de 2025', 'flat'];
  const cr = r > 0.02 ? 1 : r < -0.02 ? -1 : 0;
  if (!isFinite(m)) return cr > 0 ? ['Cresce', 'up'] : cr < 0 ? ['Cai', 'down'] : ['Estável', 'flat'];
  const d = r - m;
  if (Math.abs(d) <= 0.02) return cr > 0 ? ['Cresce em linha com a rede', 'up'] : cr < 0 ? ['Cai junto com a rede', 'down'] : ['Estável, em linha com a rede', 'flat'];
  if (d > 0) return cr > 0 ? ['Cresce acima da rede (ganha share)', 'up'] : cr === 0 ? ['Estável com a rede caindo (ganha share)', 'flat'] : ['Cai menos que a rede (ganha share)', 'flat'];
  if (cr > 0) return ['Cresce abaixo da rede (perde share)', 'flat'];
  if (cr === 0) return ['Estável com a rede crescendo (perde share)', 'down'];
  return m > 0.02 ? ['Perde share: a rede cresce e a Reckitt cai', 'down'] : ['Cai mais que a rede (perde share)', 'down'];
}
const vpp = d => (isFinite(d) ? `<span class="vbig ${cls(d) || 'flat'}">${d > 0.0005 ? '▲' : d < -0.0005 ? '▼' : '●'} ${d > 0 ? '+' : ''}${nf1.format(d * 100)} pp</span>` : '');
const selo = ([t, c]) => `<span class="vr ${c}">${t}</span>`;
function termometro(itens) {   // quantas crescem, ficam estáveis e caem
  const c = {up: 0, flat: 0, down: 0}; itens.forEach(x => { const v = x.v; if (!isFinite(v)) return; c[v > 0.02 ? 'up' : v < -0.02 ? 'down' : 'flat']++; });
  return `<div class="termo"><span class="vbig up">▲ ${c.up} crescem</span><span class="vbig flat">● ${c.flat} estáveis</span><span class="vbig down">▼ ${c.down} caem</span></div>`;
}
function thSort(t, c, rot, cls = '') { const k = S.ui['sort' + t] || ''; const on = k.replace('-', '') === String(c); return `<th class="sort ${cls}" data-act="sort" data-t="${t}" data-c="${c}">${rot}${on ? (k.startsWith('-') ? ' ↑' : ' ↓') : ''}</th>`; }
function ordena(lista, t, colunas, padrao) {
  const k = S.ui['sort' + t] || String(padrao), asc = k.startsWith('-'), f = colunas[+k.replace('-', '')] || colunas[+String(padrao).replace('-', '')] || (() => 0);   // coluna guardada que não existe mais (a tabela mudou de colunas): a ordem padrão
  return lista.sort((a, b) => { const x = f(a), y = f(b);
    if (typeof x === 'string') return (asc ? 1 : -1) * String(y).localeCompare(String(x), 'pt-BR');
    const fx = Number.isFinite(x), fy = Number.isFinite(y); if (fx !== fy) return fx ? -1 : 1; if (!fx) return 0;   // sem valor vai para o fim
    return asc ? x - y : y - x; });
}
const notaCorteRd = () => { const c = cR(), f = FR && fonte(FR);   // fonte atrasada: a página para no último mês que ela tem
  return FR && c < S.corte ? `<p class="note">${esc(f ? f.nome : 'A base desta página')} tem dado só até ${mes(c)}/26: nesta página o acumulado e a tendência vão até ${mes(c)}/26.</p>` : ''; };
const buscaRede = (id, valor, ph) => `<input class="find" id="${id}" type="search" placeholder="${ph}" value="${esc(valor || '')}" aria-label="${ph}">`;

/* ----- Redes Scanntech ----- */
function scanLinhas() {
  const uf = nomesSel('uf'), mk = marcasScan(), rc = nomesSel('recorte');
  if (rc && !rc.has('ÁREA 7')) return [];   // a Scanntech desta base é só a Área 7 (sem PA)
  if (mk && RD.scanm) {   // modo marca: Reckitt = marcas escolhidas; mercado = categorias em que elas vendem (top SKUs da rede)
    return Object.entries(RD.scanm).map(([k, L]) => { const [rede, u] = k.split('|'); if (uf && !uf.has(u)) return null;
      const minhas0 = L.filter(l => mk.has(l[1])); if (!minhas0.length) return null;
      // mercado da marca = só as categorias em que ela pesa (5% ou mais da categoria); evita, por exemplo, Desinfetante inteiro no mercado da Veja
      const tot = l => l[3].reduce((a, v) => a + (v || 0), 0), cats = new Set();
      [...new Set(minhas0.map(l => l[0]))].forEach(c => { const m = minhas0.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0), t = L.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0); if (t > 0 && m / t >= 0.05) cats.add(c); });
      const minhas = minhas0.filter(l => cats.has(l[0])); if (!minhas.length) return null;
      const so = (RD.scan.find(z => z.rede === rede && z.uf === u) || {}).so;
      return {rede, uf: u, so: !!so, rk: somaArr(minhas.map(l => ({v: l[3]})), 'v'), mk: somaArr(L.filter(l => cats.has(l[0])).map(l => ({v: l[3]})), 'v')}; }).filter(Boolean);
  }
  return RD.scan.filter(s => !uf || uf.has(s.uf));
}
/* ----- market share por UF no título das Redes Scanntech: share oficial por UF (Scanntech Painel 2.0), um mini gráfico por UF e o consolidado da Área 7 ----- */
const SU_ORDEM = ['A7', 'DF', 'GO', 'MT', 'MS', 'TO'];
const shareUF = () => { const Q = RD && RD.share_uf; return Q && Q.ufs && Array.isArray(Q.meses) && Q.ufs.A7 ? Q : null; };   // arquivo de dados antigo, sem o campo: o bloco não aparece
const suNum = x => (typeof x === 'number' && isFinite(x) ? x : NaN);
const suVal = (Q, u, ano, m) => { const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`); return i >= 0 && Array.isArray(u.sh) ? suNum(u.sh[i]) : NaN; };
const suPct = x => (isFinite(x) ? nf1.format(x) + '%' : 'sem dado');
const suPP = d => (isFinite(d) ? `${d >= 0.05 ? '+' : ''}${nf1.format(Math.abs(d) < 0.05 ? 0 : d)} pp` : '');
const suCls = d => (!isFinite(d) ? 'flat' : d >= 0.3 - 1e-9 ? 'up' : d <= -0.3 + 1e-9 ? 'down' : 'flat');   // semáforo: estável quando a variação fica abaixo de 0,3 pp
const suRot = am => `${mes(+am.slice(4))}/${am.slice(2, 4)}`;
const suUm = x => Math.round(x * 10) / 10;   // 1 casa, como na tela
function suAcum(Q, u, ano, ate) {   // acumulado jan a 'ate' = Reckitt (share x mercado) somada sobre o mercado somado, mês a mês (a mesma conta do arquivo de dados)
  let r = 0, t = 0;
  for (let m = 1; m <= ate; m++) {
    const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`), s = i >= 0 ? suNum(u.sh[i]) : NaN, k = i >= 0 && Array.isArray(u.mk) ? suNum(u.mk[i]) : NaN;
    if (isFinite(s) && k > 0) { r += s / 100 * k; t += k; }
  }
  return t > 0 ? r / t * 100 : NaN;
}
function suPeriodo(Q) {   // período do card: o mês de corte do site, limitado ao que o painel tem; no último mês fechado, vale o YTD do próprio painel
  const ya = String(Q.ytd_ate || ''), ano = +Q.ano || +ya.slice(0, 4), mY = +ya.slice(4) || 9, pa = String(Q.parcial || ''), mP = pa.slice(0, 4) === String(ano) ? +pa.slice(4) : 0;
  const segue = ano === 2026, c = segue ? Math.max(1, Math.min(S.corte, Math.max(mY, mP))) : mY;   // o mês de corte do site é de 2026
  return {ano, ant: ano - 1, mY, mP, pa, c, cP: c === mP, fim: c === mY && mP === mY + 1 ? mP : c, segue};   // fim = até onde vai a curva do ano: o corte e, no último mês fechado, também o parcial
}
function suVals(Q, P, u) {   // acumulado do ano e do anterior e a variação (diferença dos shares já arredondados, a conta fecha na tela)
  if (P.c === P.mY) return {y6: suNum(u.ytd26), y5: suNum(u.ytd25), d: suNum(u.d)};
  const y6 = suAcum(Q, u, P.ano, P.c), y5 = suAcum(Q, u, P.ant, P.c);
  return {y6, y5, d: isFinite(y6) && isFinite(y5) ? suUm(suUm(y6) - suUm(y5)) : NaN};
}
function suMini(Q, k, W, P) {   // ano anterior cinza, ano atual rosa; eixo vertical justo nos dados da UF; o mês parcial em ponto vazado, ligado por tracejado
  const u = Q.ufs[k], H = 92, pl = 28, pr = 8, pt = 8, pb = 18, gw = (W - pl - pr) / 11;
  const ehP = m => P.mP > 0 && m === P.mP, v6 = m => (m <= P.fim ? suVal(Q, u, P.ano, m) : NaN);
  const s25 = [], s26 = [];
  for (let m = 1; m <= 12; m++) { const a = suVal(Q, u, P.ant, m), b = v6(m); if (isFinite(a)) s25.push([m, a]); if (isFinite(b)) s26.push([m, b]); }
  const xs = [...s25, ...s26].map(p => p[1]); if (!xs.length) return '';
  const lo = Math.min(...xs), hi = Math.max(...xs), folga = Math.max(0.4, (hi - lo) * 0.12), y0 = Math.floor(lo - folga), y1 = Math.ceil(hi + folga);
  const px = m => (pl + (m - 1) * gw).toFixed(1), py = x => (pt + (y1 - x) / (y1 - y0) * (H - pt - pb)).toFixed(1);
  const lin = (L, cor, w) => (L.length > 1 ? `<polyline points="${L.map(([m, x]) => px(m) + ',' + py(x)).join(' ')}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>` : '');
  const fech = s26.filter(([m]) => !ehP(m)), ult = fech[fech.length - 1], par = s26.find(([m]) => ehP(m));
  let s = `<svg class="su-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`Share ${u.nome} ${P.ant} e ${P.ano} por mês`)}">` +
    `<line x1="${pl}" x2="${W - pr}" y1="${py(y0)}" y2="${py(y0)}" stroke="#ECECEF" stroke-width="1"/>` +
    `<text x="${pl - 6}" y="${(+py(y1) + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#86868B">${y1}%</text><text x="${pl - 6}" y="${(+py(y0) + 1).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#86868B">${y0}%</text>`;
  for (let m = 1; m <= 12; m++) s += `<text x="${px(m)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#86868B">${MESES[m - 1][0]}</text>`;
  s += lin(s25, '#D2D2D7', 2) + lin(fech, '#FF007F', 3);
  if (ult && par) s += `<line x1="${px(ult[0])}" y1="${py(ult[1])}" x2="${px(par[0])}" y2="${py(par[1])}" stroke="#FF007F" stroke-width="1.6" stroke-dasharray="2 3" stroke-linecap="round"/>`;
  if (ult) s += `<circle cx="${px(ult[0])}" cy="${py(ult[1])}" r="3.2" fill="#FF007F"/>`;
  if (par) s += `<circle cx="${px(par[0])}" cy="${py(par[1])}" r="3.4" fill="#FFFFFF" stroke="#FF007F" stroke-width="1.8"/>`;
  for (let m = 1; m <= 12; m++) {   // dica do mês
    const a = suVal(Q, u, P.ant, m), b = v6(m); if (!isFinite(a) && !isFinite(b)) continue;
    const t = `<b>${esc(u.nome)} · ${MESES[m - 1]}${ehP(m) ? '*' : ''}</b> · ${P.ant}: ${suPct(a)} · ${P.ano}${ehP(m) ? ` parcial até ${esc(Q.parcial_ate || '')}` : ''}: ${suPct(b)}`;
    s += `<rect x="${(+px(m) - gw / 2).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`;
  }
  return s + '</svg>';
}
function blocoShareUF() {   // um card só: Área 7 primeiro e as 5 UFs; a tabela mês x UF fica escondida na tela e sai no Excel da página
  const Q = shareUF(); if (!Q) return '';
  const P = suPeriodo(Q), ks = SU_ORDEM.filter(k => Q.ufs[k] && Array.isArray(Q.ufs[k].sh)), U5 = ks.filter(k => k !== 'A7');
  const cols = SLIDE ? 6 : innerWidth <= 640 ? 2 : innerWidth <= 900 ? 3 : 6, gap = SLIDE || innerWidth > 640 ? 18 : 14;
  const W = Math.max(120, Math.floor((larguraCard() - gap * (cols - 1)) / cols));
  const aa = String(P.ano).slice(2), a5 = String(P.ant).slice(2), rotC = mes(P.c) + (P.cP ? '*' : '');
  const V = Object.fromEntries(ks.map(k => [k, suVals(Q, P, Q.ufs[k])]));
  const fUF = nomesSel('uf'), dest = fUF ? U5.filter(k => fUF.has(k)) : [];   // filtro de UF: a UF escolhida em destaque, as outras esmaecidas
  const iC = Q.meses.indexOf(`${P.ano}${String(P.c).padStart(2, '0')}`), iP = P.mP && P.fim === P.mP && !P.cP ? Q.meses.indexOf(P.pa) : -1;
  const mini = k => {
    const u = Q.ufs[k], {y6, y5, d} = V[k], c = suCls(d), vC = iC >= 0 ? suNum(u.sh[iC]) : NaN, vP = iP >= 0 ? suNum(u.sh[iP]) : NaN;
    return `<div class="su-mini${k === 'A7' ? ' a7' : ''}${dest.length && !dest.includes(k) ? ' su-off' : ''}"><div class="su-uf"><b>${k === 'A7' ? 'Área 7' : k}</b><span>${k === 'A7' ? `${U5.length} UFs` : esc(u.nome)}</span></div>
      <div class="su-val">${suPct(y6)}</div>
      <div class="su-dl"><span class="su-d ${c}">${c === 'up' ? '▲' : c === 'down' ? '▼' : '●'} ${suPP(d)}</span><span>${P.ant}: ${suPct(y5)}</span></div>
      ${suMini(Q, k, W, P)}<div class="su-ult">${isFinite(vC) ? `<span>${mes(P.c)}/${aa}${P.cP ? '*' : ''} <b>${suPct(vC)}</b></span>` : ''}${isFinite(vP) ? `<span>${suRot(P.pa)}* ${suPct(vP)}</span>` : ''}</div></div>`;
  };
  const nq = U5.filter(k => suCls(V[k].d) === 'down').length, ng = U5.filter(k => suCls(V[k].d) === 'up').length, n = U5.length;
  const manchete = nq ? (nq === n ? `Share cai nas ${n} UFs.` : `Share cai em ${nq} de ${n} UFs.`) : ng ? (ng === n ? `Share sobe nas ${n} UFs.` : `Share sobe em ${ng} de ${n} UFs.`) : `Share estável nas ${n} UFs.`;
  const temP = P.mP > 0 && P.fim >= P.mP, txP = temP ? `${suRot(P.pa)}* parcial até ${Q.parcial_ate || ''}` : '';
  const filtro = FILTROS.some(([k]) => S.f[k].size);
  const notas = ['Share oficial de cada UF, com todas as lojas da Scanntech no estado. O share das redes, nos números abaixo, conta só as redes do Resumo por Rede Mensal que liberam o mercado e por isso dá outro número.',
    temP ? (P.cP ? `* ${suRot(P.pa)} parcial até ${Q.parcial_ate}, dentro do acumulado: compara um mês ainda incompleto com o mês cheio de ${P.ant}.` : `* ${suRot(P.pa)} parcial até ${Q.parcial_ate}, fora do acumulado (ponto vazado na curva).`) : '',
    filtro ? `Reckitt inteira nas ${n} UFs: o share por UF não abre por marca nem segue os filtros do site${dest.length ? '; a UF filtrada fica em destaque' : ''}.` : '',
    !P.segue && S.corte !== P.mY ? `O share por UF fica em jan a ${mes(P.mY)}/${aa}: não segue o mês de corte do site.` : ''].filter(Boolean).join(' ');
  const celula = x => (isFinite(x) ? nf1.format(x) + '%' : '');
  const tot = (rot, f) => `<tr class="tot"><td class="l">${rot}</td>${ks.map(k => `<td>${f(V[k])}</td>`).join('')}</tr>`;
  const notaXls = `Redes Scanntech · Share por UF · Scanntech Painel 2.0, Reckitt inteira por UF (não abre por marca nem segue os filtros do site) · acumulado jan a ${rotC}/${aa} contra jan a ${mes(P.c)}/${a5}${txP ? ' · ' + txP : ''}`;
  const tabela = `<p class="eyebrow su-xls">Share por UF</p><div class="tw su-xls" data-xls-nota="${esc(notaXls)}"><table><thead><tr><th class="l">Mês</th>${ks.map(k => `<th>${k === 'A7' ? 'Área 7' : k}</th>`).join('')}</tr></thead><tbody>` +
    Q.meses.map((am, i) => `<tr><td class="l">${suRot(am)}${am === P.pa ? '*' : ''}</td>${ks.map(k => `<td>${celula(suNum(Q.ufs[k].sh[i]))}</td>`).join('')}</tr>`).join('') +
    tot(`Acumulado jan a ${mes(P.c)}/${a5}`, x => celula(x.y5)) + tot(`Acumulado jan a ${rotC}/${aa}`, x => celula(x.y6)) + tot(`Variação ${aa} contra ${a5}`, x => suPP(x.d)) + '</tbody></table></div>';
  return `<div class="card shareuf"><div class="su-top"><div><p class="eyebrow">Market share por UF</p><h3>${manchete} <span>Acumulado de jan a ${rotC} de ${P.ano} contra o mesmo período de ${P.ant}.</span></h3></div>
    <div class="legend su-leg"><span><i class="su-ln" style="background:#D2D2D7"></i>${P.ant}</span><span><i class="su-ln su-26" style="background:#FF007F"></i>${P.ano}</span></div></div>
    <div class="su-grid">${ks.map(mini).join('')}</div>${notas ? `<p class="su-nota">${esc(notas)}</p>` : ''}<p class="su-fonte">${esc(String(Q.fonte || 'Scanntech Painel 2.0').replace(/YTD jan-[a-zç]+\*?$/, `YTD jan-${rotC}`))}</p>${tabela}</div>`;   // o período da fonte segue o do card
}
function pgRedesScan() {
  if (!RD) return hero('Redes Scanntech', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
  return emFonte(marcasScan() && RD.scanm ? 'scanntech_marcas' : 'scanntech', pgRedesScanFonte);
}
function pgRedesScanFonte() {
  const L = scanLinhas(), mer = L.filter(s => !s.so);
  // mesmas redes e mesmos meses: só os meses até o corte em que a rede vendeu nos dois anos
  let rk26 = 0, rk25 = 0, mk26 = 0, mk25 = 0;
  mer.forEach(s => { const [a, b] = parR(s.rk, s.mk), [c, d] = parR(s.mk); rk26 += a; rk25 += b; mk26 += c; mk25 += d; });
  const sh26 = rk26 / mk26, sh25 = rk25 / mk25;
  const tudo26 = L.reduce((a, s) => a + ytdR(s.rk, 2026), 0);
  const itens = L.map(s => {
    const r26 = ytdR(s.rk, 2026), r25 = ytdR(s.rk, 2025), m26 = ytdR(s.mk, 2026), [t3, t0] = triR(s.rk);
    const [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
    const [k3] = triR(s.mk), foraPainel = !(m26 > 0), saiu3 = !(k3 > 0);
    let vr = varR(p26, p25), motivo = null;
    if (foraPainel && r25 >= 1000) { vr = NaN; motivo = ['Sem leitura da Scanntech em 2026 (saiu do painel)', 'flat']; }
    else if (r25 >= 1000 && !(r26 > 0)) vr = -1;
    else if (!isFinite(vr) && r25 >= 1000) motivo = p25 >= 1000 && p26 / p25 > 10 ? ['Variação acima de 10x', 'flat'] : ['Sem meses comparáveis entre 25 e 26', 'flat'];
    const vm = !s.so ? varR(q26, q25) : NaN;
    return {s, r26, r25, vr, vm, motivo, sh: s.so || !(m26 > 0) ? NaN : r26 / m26, dsh: s.so || !(q25 > 0) || !(q26 > 0) ? NaN : (p26 / q26 - p25 / q25) * 100, tr: saiu3 ? NaN : varQ(t3, t0), v: vr, col: CRUZ[s.rede + '|' + s.uf]};
  }).filter(x => x.r26 > 0 || x.r25 > 0);
  const sel = S.ui.scsel ? itens.find(x => x.s.rede + '|' + x.s.uf === S.ui.scsel) : null;
  let h = hero('Redes Scanntech', 'Redes de varejo.', 'Venda das lojas, mercado da rede e share da Reckitt. Clique numa rede para abrir.', blocoShareUF()) + recorteTxt() + notaCorteRd();
  if (nomesSel('recorte') && !nomesSel('recorte').has('ÁREA 7')) h += '<p class="note">A Scanntech desta base cobre só a Área 7 (DF, GO, MT, MS e TO): não há redes do JC PA.</p>';
  else if (nomesSel('uf') && ![...nomesSel('uf')].some(u => ['DF', 'GO', 'MT', 'MS', 'TO'].includes(u))) h += '<p class="note">A Scanntech desta base cobre só DF, GO, MT, MS e TO: não há redes do PA.</p>';
  const semAbertura = S.f.marca.size && RD.scanm ? [...S.f.marca].map(i => dic.marca[i]).filter(m => !Object.values(RD.scanm).some(L => L.some(l => l[1] === m))) : [];
  if (semAbertura.length) h += `<p class="note">${semAbertura.map(tit).join(', ')} não aparece na abertura por marca da Scanntech (as categorias de H&N não estão nesta consulta)${semAbertura.length < S.f.marca.size ? ' e ficou de fora da conta' : '. Desmarque a marca para ver a Reckitt inteira'}.</p>`;
  if (!L.length) return h + `<div class="card empty">Nada neste recorte.</div>`;
  if (S.f.marca.size && RD.scanm) h += `<p class="note">Recorte por marca (${[...S.f.marca].map(i => tit(dic.marca[i])).join(', ')}): abertura das ${Object.keys(RD.scanm).length} maiores redes. Mercado = categorias em que a marca pesa 5% ou mais, pelos SKUs mais vendidos de cada rede. O Vanish pó não vem nesta consulta. Como a lista de SKUs é a dos mais vendidos hoje, as variações por marca tendem a sair alguns pontos acima das do Resumo Mensal.</p>`;
  else if (S.f.marca.size) h += '<p class="note">A abertura por marca da Scanntech ainda não está na base: os números são da Reckitt inteira.</p>';
  if (S.f.segmento.size) h += '<p class="note">O segmento não abre nas redes da Scanntech: os números são da marca inteira.</p>';
  if (['executivo', 'grp', 'canal', 'fonte', 'janela'].some(k => S.f[k].size)) h += '<p class="note">Executivo, distribuidor, canal, fonte e comparabilidade não se aplicam à Scanntech (venda das lojas). Aqui vale só a UF; para ver por executivo, use Redes Colecta.</p>';
  h += `<div class="grid g4">
    <div class="card kpi"><div class="lab">Reckitt nas redes ${corteTxt()}</div><div class="val">${mi(mer.reduce((a, s) => a + ytdR(s.rk, 2026), 0))}</div><div class="sub dv">${vbig(varr(rk26, rk25))}<span>mesmas redes e meses: ${mi(rk26)} contra ${mi(rk25)}</span></div></div>
    <div class="card kpi"><div class="lab">Mercado das redes</div><div class="val">${mi(mer.reduce((a, s) => a + ytdR(s.mk, 2026), 0))}</div><div class="sub dv">${vbig(varr(mk26, mk25))}<span>mesmas redes e meses, nossas categorias</span></div></div>
    <div class="card kpi"><div class="lab">Share da Reckitt nas redes</div><div class="val">${p1(sh26)}</div><div class="sub dv">${vpp(sh26 - sh25)}<span>${p1(sh25)} em 2025</span></div></div>
    <div class="card kpi"><div class="lab">Redes com venda</div><div class="val">${n0(itens.length)}</div><div class="sub">${mi(tudo26)} de Reckitt em 2026, incluindo as que só liberam a Reckitt</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Reckitt ${corteTxt()} 2026 contra 2025, por rede e UF.</span></h2>` + termometro(itens);
  if (sel) h += detalheScan(sel);
  RD_ULT = {tipo: 'sc', itens, fr: FR};
  h += `<h2 class="sec">Todas as redes. <span>Ordene pelo cabeçalho; busque pelo nome.</span></h2><div class="card"><div class="pills">${buscaRede('scbusca', S.ui.scbusca, 'Buscar rede')}</div><div id="rd-tab">${tabelaScan(itens)}</div></div>`;
  return h;
}
function tabelaScan(itens) {
  const busca = semAcento(S.ui.scbusca || '');
  let lista = itens.filter(x => !busca || semAcento(x.s.rede).includes(busca));
  lista = ordena(lista, 'sc', [x => x.s.rede, x => x.s.uf, x => x.r25, x => x.r26, x => x.vr, x => x.vm, x => x.sh, x => x.dsh, x => x.tr], 3);
  const mostra = S.ui.sctodas ? lista : lista.slice(0, 60);
  return `<div class="tw"><table><thead><tr>${thSort('sc', 0, 'Rede', 'l')}${thSort('sc', 1, 'UF', 'l')}${thSort('sc', 2, 'Reckitt 25')}${thSort('sc', 3, 'Reckitt 26')}${thSort('sc', 4, 'Reckitt var.')}${thSort('sc', 5, 'Mercado var.')}${thSort('sc', 6, 'Share 26')}${thSort('sc', 7, 'Δ share')}${thSort('sc', 8, 'Últ. 3m vs 3 ant.' + marcaParc(cR()))}<th class="l">Leitura</th><th class="l">No Colecta</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="11" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => `<tr class="clk" data-act="ui" data-k="scsel" data-v="${esc(x.s.rede + '|' + x.s.uf)}"><td class="l b">${tit(x.s.rede)}</td><td class="l">${x.s.uf}</td><td>${n0(x.r25)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}</td><td>${vc(x.vm)}</td><td>${p1(x.sh)}</td><td>${isFinite(x.dsh) ? `<span class="vr ${cls(x.dsh / 100) || 'flat'}">${x.dsh > 0 ? '+' : ''}${nf1.format(x.dsh)} pp</span>` : ''}</td><td>${vc(x.tr)}</td><td class="l">${selo(leituraRede(x.vr, x.vm, x.s.so, x.motivo))}</td><td class="l">${x.col ? '<span class="tag">✓ cruzada</span>' : ''}</td></tr>`).join('') +
    `</tbody></table></div>${!S.ui.sctodas && lista.length > 60 ? `<div class="pager"><button data-act="ui" data-k="sctodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Reckitt R$ = mercado da rede × share da Reckitt (Scanntech, Resumo por Rede Mensal). A variação compara só os meses em que a rede vendeu nos dois anos (mesmas redes e mesmos meses); "Parou de vender" = tinha venda em 2025 e zerou em 2026. Redes que só liberam a venda da Reckitt ficam fora do mercado e do share.</p>`;
}
function detalheScan(x) {
  const s = x.s, a = serie48(s.rk);
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${s.uf} · Scanntech</p><h3>${tit(s.rede)}. <span>${x.motivo ? x.motivo[0] + '.' : !(x.r26 > 0) ? 'Sem venda da Reckitt em 2026.' : s.so ? 'Só libera a venda da Reckitt.' : `Share de ${p1(x.sh)} em 2026.`}</span></h3></div><button class="btn" data-act="ui" data-k="scsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">Reckitt 26 contra 25</span>' : ''}${!s.so && isFinite(x.vm) ? vbig(x.vm) + '<span class="sub">mercado da rede</span>' : ''}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(a, 'rs', 250, null, true, {fv: varR})}<div class="tw"><table><thead><tr><th>Mês</th><th>Mercado 25</th><th>Mercado 26</th><th>Reckitt 25</th><th>Reckitt 26</th><th>Reckitt var.</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= fimSerie();
      const m5 = s.mk[i5], m6 = ok6 ? s.mk[i6] : 0, r5 = s.rk[i5], r6 = ok6 ? s.rk[i6] : 0, s5 = m5 ? r5 / m5 : NaN, s6 = m6 ? r6 / m6 : NaN, d = (s6 - s5) * 100;
      return `<tr><td class="b">${mesRot(m)}</td><td>${n0(m5 || NaN)}</td><td class="b">${n0(m6 || NaN)}</td><td>${n0(r5 || NaN)}</td><td class="b">${n0(r6 || NaN)}</td><td>${vcm(varR(r6, r5), m)}</td><td>${s.so ? '' : p1(s5)}</td><td>${s.so ? '' : p1(s6)}</td><td>${!s.so && isFinite(d) ? `<span class="vr ${cls(d / 100) || 'flat'}">${d > 0 ? '+' : ''}${nf1.format(d)} pp</span>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>';
  h += emFonte('scanntech_marcas', () => marcasScanDet(s.rede + '|' + s.uf));
  h += emFonte(marcasRede() && RD.colm ? 'colecta_marcas' : 'redes_colecta', () => cruzadoColecta(x.col, s.uf));
  return h + '</div>';
}
function marcasScanDet(k) {
  const L = RD.scanm && RD.scanm[k]; if (!L || !L.length) return RD.scanm ? '<p class="note" style="margin-top:16px">Abertura por marca disponível só nas maiores redes (Reckitt acima de R$ 100 mil em 2026).</p>' : '';
  const cats = [...new Set(L.map(l => l[0]))].map(c => { const Lc = L.filter(l => l[0] === c), t26 = Lc.reduce((a, l) => a + ytdR(l[3], 2026), 0), t25 = Lc.reduce((a, l) => a + ytdR(l[3], 2025), 0);
    return {c, Lc, t26, t25, rk: Lc.filter(l => l[2]).reduce((a, l) => a + ytdR(l[3], 2026), 0)}; }).filter(x => x.rk > 0).sort((a, b) => b.rk - a.rk);
  if (!cats.length) return '';
  const cob = RD.scancob && RD.scancob[k];
  return `<div class="cruz"><p class="eyebrow">Marcas e concorrentes na rede · Scanntech</p><h3>Onde a Reckitt ganha e onde perde espaço. <span>Share dentro de cada categoria, ${corteTxt()} 2026 contra 2025.</span></h3>` +
    (cob ? `<p class="note">A abertura por marca cobre ${p1(Math.min(cob, 1))} da Reckitt desta rede no Resumo Mensal${cob < 0.9 ? ' (falta principalmente o Vanish pó, que não vem nesta consulta)' : ''}.</p>` : '') +
    cats.map(x => `<p class="eyebrow" style="margin-top:18px;color:var(--slate)">${esc(x.c)}</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.${marcaParc(cR())}</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
      x.Lc.map(l => ({l, a: ytdR(l[3], 2025), b: ytdR(l[3], 2026)})).sort((p, q) => (q.l[2] - p.l[2]) || (q.b - p.b)).map(({l, a, b}) => { const s5 = x.t25 ? a / x.t25 : NaN, s6 = x.t26 ? b / x.t26 : NaN, d = (s6 - s5) * 100;
        return `<tr><td class="l ${l[2] ? 'b ' + mkCls(l[1]) : ''}">${l[1] === 'OUTRAS' ? 'Outras marcas' : tit(l[1])}${l[2] ? ' <span class="mini">Reckitt</span>' : ''}</td><td>${n0(a || NaN)}</td><td class="${l[2] ? 'b' : ''}">${n0(b || NaN)}</td><td>${vc(varR(b, a))}</td><td>${vc(varR(...triR(l[3])))}</td><td>${p1(s5)}</td><td>${p1(s6)}</td><td>${isFinite(d) ? `<span class="vr ${cls(d / 100) || 'flat'}">${d > 0 ? '+' : ''}${nf1.format(d)} pp</span>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>').join('') +
    '<p class="note" style="margin-top:10px">Fonte: Scanntech, KPIs por SKU da rede (SKUs mais vendidos, Reckitt e concorrentes). O Vanish pó não vem nesta consulta; o total da Reckitt da rede, no alto, inclui tudo.</p></div>';
}
function cruzadoColecta(raizes, uf) {
  if (!raizes || !raizes.length) return '<p class="note" style="margin-top:16px">Esta rede não foi encontrada entre os clientes dos distribuidores no Colecta (pode comprar direto da Reckitt ou de distribuidor fora da base).</p>';
  const mk = marcasRede(), fonte = mk && RD.colm ? RD.colm.filter(c => mk.has(c.marca)) : RD.col;
  const todas = fonte.filter(c => raizes.includes(c.raiz)), L = todas.filter(c => c.uf === uf), tot = somaArr(L, 'rs');
  const outras = ytdR(somaArr(todas.filter(c => c.uf !== uf), 'rs'), 2026);
  const lb = somaArr(L.filter(c => BASE_COMP.has(c.grp)), 'rs'), r26c = ytdR(lb, 2026), r25 = ytdR(lb, 2025), r26 = ytdR(tot, 2026);
  const grps = [...new Set(L.map(c => c.grp))].map(tit).join(', ');
  return `<div class="cruz"><p class="eyebrow">A mesma rede no Colecta · ${uf}${mk ? ' · ' + [...mk].map(m => m === 'HN' ? 'H&N' : tit(m)).join(', ') : ''}</p><h3>${rsx(r26)} comprados dos distribuidores em ${uf} ${corteTxt()}. <span>${raizes.map(nomeRaiz).map(tit).join(' · ')}</span></h3>
    <div class="termo">${r25 >= 1000 ? vbig(varQ(r26c, r25)) + '<span class="sub">26 contra 25 nos distribuidores com 2025 completo</span>' : '<span class="sub">Sem base comparável de 2025 no Colecta (distribuidor entrou depois ou 2025 incompleto)</span>'}${isFinite(varQ(...triCol(L))) ? vbig(varQ(...triCol(L))) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    <p class="note">${grps ? 'Distribuidores: ' + grps + '. ' : 'Sem compra pelos distribuidores nesta UF. '}${outras >= 1000 ? `A mesma empresa compra mais ${rsx(outras)} em outras UFs. ` : ''}Compra do distribuidor (Colecta) e venda ao consumidor (Scanntech) andam em ritmos diferentes: a compra concentra pedidos e a loja vende todo dia.</p>
    ${r26 >= 1000 ? chart(serie48(tot), 'rs', 200, null, true, {semVar: true, pk: FR || 'redes_colecta'}) : ''}</div>`;
}

/* ----- Redes Colecta ----- */
const FORA_A7 = new Set(RD && RD.fora_area7 ? RD.fora_area7 : []);
const recorteGrp = g => (FORA_A7.has(g) ? dic.recorte.find(x => x !== 'ÁREA 7') || 'FORA' : 'ÁREA 7');   // recorte é do distribuidor, como no resto do site
function colLinhas(semMarca) {
  const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte'), mk = semMarca ? null : marcasRede();
  const fonte = mk && RD.colm ? RD.colm.filter(c => mk.has(c.marca)) : RD.col;
  return fonte.filter(c => (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec)) && (!rc || rc.has(recorteGrp(c.grp))));
}
const temBase = c => BASE_COMP.has(c.grp);
function triFora(L) {   // distribuidores do recorte que ficam fora da tendência por não cobrirem as 6 janelas
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`), ini = RD.inicio_tend || RD.dist_inicio; if (fim < 5) return [];
  return [...new Set(L.filter(c => (ini[c.grp] || '9') > RM[fim - 5]).map(c => tit(c.grp)))];
}
function triCol(L) {   // tendência só com distribuidores que já existiam nas 6 janelas
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`); if (fim < 5) return [NaN, NaN];
  const ini = RD.inicio_tend || RD.dist_inicio;
  return triR(somaArr(L.filter(c => (ini[c.grp] || '9') <= RM[fim - 5]), 'rs'));
}
const EXEC_GRP = {}; if (RD) RD.col.forEach(c => { EXEC_GRP[c.grp] = c.exec; }); if (RD && RD.colm) RD.colm.forEach(c => { c.exec = EXEC_GRP[c.grp] || ''; });
function pgRedesCol() {
  if (!RD) return hero('Redes Colecta', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
  return emFonte(marcasRede() && RD.colm ? 'colecta_marcas' : 'redes_colecta', pgRedesColFonte);
}
function pgRedesColFonte() {
  const L = colLinhas(), mk = marcasRede(), lojasDe = mk && mk.size > 1 ? colLinhas(true) : null;   // várias marcas: lojas da rede inteira (sem somar marca a marca)
  const por = new Map();
  L.forEach(c => { const x = por.get(c.raiz) || {raiz: c.raiz, linhas: []}; x.linhas.push(c); por.set(c.raiz, x); });
  const itens = [...por.values()].map(x => {
    const rs = somaArr(x.linhas, 'rs'), lj = somaArr(lojasDe ? lojasDe.filter(c => c.raiz === x.raiz) : x.linhas, 'lj'), base = x.linhas.filter(temBase), rb = somaArr(base, 'rs');
    const r26 = ytdR(rs, 2026), b25 = ytdR(rb, 2025), b26 = ytdR(rb, 2026), [t3, t0] = triCol(x.linhas);
    const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
    return {raiz: x.raiz, linhas: x.linhas, rs, lj, r26, b26, b25, vr: varQ(b26, b25), parcial: base.length < x.linhas.length, tr: varQ(t3, t0), v: varQ(t3, t0),
      lojas: lj[ult] || 0, ufs: [...new Set(x.linhas.map(c => c.uf))].join(', '), grps: [...new Set(x.linhas.map(c => c.grp))], sc: CRUZ['r:' + x.raiz]};
  }).filter(x => x.r26 > 0 || x.b25 > 0);
  const tot = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs'), r26 = ytdR(tot, 2026), b26 = ytdR(base, 2026), b25 = ytdR(base, 2025);
  const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`), lojasUlt = somaArr(lojasDe || L, 'lj')[ult] || 0;
  const chU = (() => { if (mk || S.f.recorte.size) return null; const ex = nomesSel('executivo'), uf = nomesSel('uf'), gr = nomesSel('grp'); const p = [];
    if (ex) { if (ex.size > 1) return null; p.push('exec:' + [...ex][0]); } if (gr) { if (gr.size > 1 || ex) return null; p.push('grp:' + [...gr][0]); } if (uf) { if (uf.size > 1) return null; p.push('uf:' + [...uf][0]); } return p.join('|'); })();
  const unicosUlt = chU !== null && RD.unicos && RD.unicos[chU] ? RD.unicos[chU][ult] || 0 : null;
  const nomeadas = itens.filter(x => x.raiz !== 'DEMAIS' && x.raiz !== 'PF').sort((a, b) => b.r26 - a.r26);
  const top20 = nomeadas.slice(0, 20).reduce((a, x) => a + x.r26, 0);
  const sel = S.ui.clsel ? itens.find(x => x.raiz === S.ui.clsel) : null;
  let h = hero('Redes Colecta', 'Redes compradoras.', 'Clientes dos distribuidores agrupados por rede (raiz do CNPJ). Filtre executivo, UF e distribuidor no topo.') + recorteTxt() + notaCorteRd();
  if (S.f.marca.size && !RD.colm) h += '<p class="note">A abertura por marca das redes do Colecta ainda não está na base: os números são de todas as marcas.</p>';
  else if (S.f.marca.size) h += `<p class="note">Recorte por marca: ${[...S.f.marca].map(i => tit(dic.marca[i])).join(', ')}.${temHN() ? ' Sustagen, Jontex, Olla e Veet aparecem juntos como H&N nas redes.' : ''}</p>`;
  if (S.f.segmento.size) h += '<p class="note">O segmento não abre nas redes: os números são da marca inteira.</p>';
  if (['canal', 'fonte', 'janela'].some(k => S.f[k].size)) h += '<p class="note">Canal, fonte e comparabilidade não se aplicam às redes do Colecta: os números são de todos os canais. Aqui valem UF da loja, distribuidor, executivo, recorte e marca.</p>';
  if (S.f.uf.size) h += '<p class="note">A UF aqui é a da loja (cadastro do CNPJ), não a do distribuidor. Lojas de UFs fora da lista do filtro (BA e MA) só aparecem sem filtro de UF.</p>';
  h += `<div class="grid g4">
    <div class="card kpi"><div class="lab">Compra das redes ${corteTxt()}</div><div class="val">${mi(r26)}</div><div class="sub dv">${b25 >= 1000 ? vbig(varr(b26, b25)) + `<span>26 contra 25 na base comparável (${[...new Set(L.filter(temBase).map(c => tit(c.grp)))].join(', ')})</span>` : '<span>sem base comparável de 2025 neste recorte</span>'}</div></div>
    <div class="card kpi"><div class="lab">Tendência${marcaParc(cR())}</div><div class="val ${cls(varR(...triCol(L)))}">${isFinite(varR(...triCol(L))) ? pc(varR(...triCol(L))) : '·'}</div><div class="sub">${isFinite(varR(...triCol(L))) ? 'últimos 3 meses contra os 3 anteriores' + (triFora(L).length ? ' (sem ' + triFora(L).join(', ') + ', que não cobre as 6 janelas)' : '') : 'sem as 6 janelas de comparação: o distribuidor entrou depois'}</div></div>
    <div class="card kpi"><div class="lab">Lojas compradoras em ${mes(cR())}${marcaParc(cR())}</div><div class="val">${n0(unicosUlt !== null ? unicosUlt : lojasUlt)}</div><div class="sub">${unicosUlt !== null ? `CNPJs únicos; soma por distribuidor ${n0(lojasUlt)} (sobreposição ${p1(1 - unicosUlt / lojasUlt)})` : `CNPJs, soma por distribuidor${lojasDe ? ' (todas as marcas)' : ''}`}; ${n0(nomeadas.length)} redes nomeadas</div></div>
    <div class="card kpi"><div class="lab">Concentração</div><div class="val">${p1(top20 / r26)}</div><div class="sub">do R$ nas 20 maiores redes</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Tendência dos últimos 3 meses contra os 3 anteriores, por rede.</span></h2>` + termometro(nomeadas);
  if (sel) h += detalheCol(sel);
  RD_ULT = {tipo: 'cl', itens, fr: FR};
  if (!L.length) h += '<p class="note">Nenhuma rede neste recorte: o executivo ou o distribuidor escolhido não tem distribuidor no Colecta.</p>';
  h += `<h2 class="sec">Todas as redes. <span>Ordene pelo cabeçalho; busque por nome ou cidade.</span></h2><div class="card"><div class="pills">${buscaRede('clbusca', S.ui.clbusca, 'Buscar rede ou cidade')}</div><div id="rd-tab">${tabelaCol(itens)}</div></div>`;
  return h;
}
function tabelaCol(itens) {
  const busca = semAcento(S.ui.clbusca || '');
  let lista = itens.filter(x => !busca || semAcento(nomeRaiz(x.raiz) + ' ' + ((RD.nomes[x.raiz] || {}).razao || '') + ' ' + ((RD.nomes[x.raiz] || {}).municipio || '')).includes(busca));
  lista = ordena(lista, 'cl', [x => nomeRaiz(x.raiz), x => x.ufs, x => x.b25, x => x.r26, x => x.vr, x => x.tr, x => x.lojas], 3);
  lista = [...lista.filter(x => x.raiz !== 'DEMAIS' && x.raiz !== 'PF'), ...lista.filter(x => x.raiz === 'DEMAIS' || x.raiz === 'PF')];
  const mostra = S.ui.cltodas ? lista : lista.slice(0, 80);
  return `<div class="tw"><table><thead><tr>${thSort('cl', 0, 'Rede', 'l')}${thSort('cl', 1, 'UF', 'l')}<th class="l">Distribuidor</th>${thSort('cl', 2, 'R$ 25 (base)')}${thSort('cl', 3, 'R$ 26')}${thSort('cl', 4, '26 vs 25')}${thSort('cl', 5, 'Últ. 3m vs 3 ant.' + marcaParc(cR()))}${thSort('cl', 6, `Lojas ${mes(cR())}${marcaParc(cR())}`)}<th class="l">Na Scanntech</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="9" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => { const n = RD.nomes[x.raiz] || {}; return `<tr class="clk" data-act="ui" data-k="clsel" data-v="${x.raiz}"><td class="l b">${tit(nomeRaiz(x.raiz))}${n.municipio ? `<div class="mini">${esc(n.municipio)}</div>` : ''}</td><td class="l">${x.ufs}</td><td class="l">${x.grps.map(tit).join(', ')}</td><td>${n0(x.b25 || NaN)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}${x.parcial && isFinite(x.vr) ? '<span class="mini"> base parcial</span>' : ''}</td><td>${vc(x.tr)}</td><td>${n0(x.lojas || NaN)}</td><td class="l">${x.sc ? `<span class="tag">✓ ${x.sc.map(k => tit(k.split('|')[0])).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</span>` : ''}</td></tr>`; }).join('') +
    `</tbody></table></div>${!S.ui.cltodas && lista.length > 80 ? `<div class="pager"><button data-act="ui" data-k="cltodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Rede = raiz do CNPJ (8 dígitos); nome pela Receita. As 1.000 maiores redes aparecem nomeadas; o resto está em "Demais clientes". 26 contra 25 só nos distribuidores com 2025 completo no Colecta (${[...BASE_COMP].map(tit).join(', ')}) (acumulado, mês sem compra conta como zero). Os distribuidores que entraram no Colecta depois de jan/25 ou têm 2025 incompleto ficam fora dessa conta: para eles vale a tendência dos últimos 3 meses. Lojas = soma de CNPJs por distribuidor.</p>`;
}
function detalheCol(x) {
  const n = RD.nomes[x.raiz] || {};
  const porG = x.grps.map(g => { const L = x.linhas.filter(c => c.grp === g), rs = somaArr(L, 'rs'); return {g, r26: ytdR(rs, 2026), r25: temBase({grp: g}) ? ytdR(rs, 2025) : NaN, vr: temBase({grp: g}) ? varQ(ytdR(rs, 2026), ytdR(rs, 2025)) : NaN, tr: varQ(...triCol(L))}; }).sort((a, b) => b.r26 - a.r26);
  const rb = somaArr(x.linhas.filter(temBase), 'rs');
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${x.ufs} · Colecta</p><h3>${tit(nomeRaiz(x.raiz))}. <span>${n.razao ? tit(n.razao) : ''}${n.municipio ? ' · ' + esc(n.municipio) + '/' + (n.uf || '') : ''}${x.raiz.length === 8 ? ' · raiz ' + x.raiz : ''}</span></h3></div><button class="btn" data-act="ui" data-k="clsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">26 contra 25 na base comparável</span>' : '<span class="sub">Sem base comparável de 2025 no Colecta</span>'}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(serie48(x.rs), 'rs', 250, null, true, {fv: varR, semVar: x.parcial})}<div class="tw"><table><thead><tr><th>Mês</th><th>R$ 25</th><th>R$ 26</th><th>Var. (base comparável)</th><th>Lojas 25</th><th>Lojas 26</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= fimSerie();
      const a5 = x.rs[i5], a6 = ok6 ? x.rs[i6] : 0; return `<tr><td class="b">${mesRot(m)}</td><td>${n0(a5 || NaN)}</td><td class="b">${n0(a6 || NaN)}</td><td>${vcm(varR(ok6 ? rb[i6] : 0, rb[i5]), m)}</td><td>${n0(x.lj[i5] || NaN)}</td><td class="b">${n0(ok6 ? x.lj[i6] || NaN : NaN)}</td></tr>`; }).join('') + '</tbody></table></div>' +
    `<p class="eyebrow" style="margin-top:22px">Por distribuidor</p><div class="tw"><table><thead><tr><th class="l">Distribuidor</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.</th></tr></thead><tbody>` +
    porG.map(p => `<tr><td class="l b">${tit(p.g)}</td><td>${n0(p.r25)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vr)}</td><td>${vc(p.tr)}</td></tr>`).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">Lojas = soma de CNPJs por distribuidor. 26 contra 25 só nos distribuidores com 2025 completo no Colecta (acumulado; mês sem compra conta como zero).</p>';
  if (RD.colm) h += emFonte('colecta_marcas', () => marcasColDet(x));
  if (x.sc) h += emFonte('scanntech', () => scanCruzDet(x));
  else h += '<p class="note" style="margin-top:16px">Esta rede não foi encontrada na Scanntech (a loja pode não ter leitura de caixa na Scanntech ou ter outro nome de rede).</p>';
  return h + '</div>';
}
function marcasColDet(x) {   // marcas da rede no Colecta (abertura por marca, no corte dela)
  let h = '';
  const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte');
  const Lm = RD.colm.filter(c => c.raiz === x.raiz && (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec || '')) && (!rc || rc.has(recorteGrp(c.grp))));
  const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
  const pm = ['VEJA', 'VANISH', 'FINISH', 'HARPIC', 'HN'].map(m => { const L = Lm.filter(c => c.marca === m); if (!L.length) return null; const rs = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs');
    return {m, r26: ytdR(rs, 2026), b25: ytdR(base, 2025), vb: varQ(ytdR(base, 2026), ytdR(base, 2025)), tr: varQ(...triCol(L)), lj: somaArr(L, 'lj')[ult] || 0}; }).filter(Boolean);
  const t26 = pm.reduce((a, p) => a + p.r26, 0);
  if (pm.length) h += `<p class="eyebrow" style="margin-top:22px">Marcas na rede</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25 (base)</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.${marcaParc(cR())}</th><th>Peso 26</th><th>Lojas em ${mes(cR())}${marcaParc(cR())}</th></tr></thead><tbody>` +
    pm.sort((a, b) => b.r26 - a.r26).map(p => `<tr><td class="l b ${mkCls(p.m)}">${p.m === 'HN' ? 'H&N' : tit(p.m)}</td><td>${n0(p.b25 || NaN)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vb)}</td><td>${vc(p.tr)}</td><td>${p1(p.r26 / t26)}</td><td>${n0(p.lj || NaN)}</td></tr>`).join('') + '</tbody></table></div>';
  return h;
}
function scanCruzDet(x) {   // a mesma rede na Scanntech (Resumo Mensal, no corte dele)
  return x.sc.map(k => { const s = RD.scan.find(z => z.rede + '|' + z.uf === k); if (!s) return ''; const r26 = ytdR(s.rk, 2026), m26 = ytdR(s.mk, 2026), [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
    const r25 = p25, m25 = q25;
    return `<div class="cruz"><p class="eyebrow">A mesma rede na Scanntech · ${s.uf}${S.f.marca.size ? ' · Reckitt inteira' : ''}</p><h3>${tit(s.rede)}: ${mi(r26)} de Reckitt vendidos nas lojas ${corteTxt()}. <span>${s.so ? 'Só libera a Reckitt.' : 'Share de ' + p1(r26 / m26) + '.'}</span></h3>
      <div class="termo">${isFinite(varQ(p26, p25)) ? vbig(varQ(p26, p25)) + '<span class="sub">Reckitt nas lojas, 26 contra 25 (mesmos meses)</span>' : ''}${!s.so && isFinite(varR(q26, q25)) ? vbig(varR(q26, q25)) + '<span class="sub">mercado da rede</span>' : ''}</div>${chart(serie48(s.rk), 'rs', 200, null, true, {fv: varR, pk: 'scanntech'})}</div>`; }).join('');
}

function pgDepara() {
  return hero('De-para', 'Distribuidores, fontes e segmentos.', 'Hierarquia do CTO, regra de fonte por período e a régua única entre MTRIX e Colecta.') + tabelaFontes() +
    `<div class="card"><p class="eyebrow">Hierarquia e fonte</p><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th><th class="l">Canal</th><th class="l">Executivo de vendas</th>
    <th class="l">Fonte 2023-2024</th><th class="l">Fonte 2025</th><th class="l">Fonte 2026</th><th class="l">Série emendada</th><th class="l">Mesma régua</th></tr></thead><tbody>` +
    D.depara.map(d => `<tr><td class="l b">${tit(d.grp)}</td><td class="l">${d.uf}</td><td class="l">${tit(d.canal)}</td><td class="l">${esc(d.executivo)}</td><td class="l">${esc(d.f2324)}</td><td class="l">${esc(d.f25)}</td><td class="l">${esc(d.f26)}</td><td class="l">${d.emendada}</td><td class="l">${d.regua}</td></tr>`).join('') +
    `</tbody></table></div></div><div class="card"><p class="eyebrow">Régua de segmentos · MTRIX (Segmento AR) x Colecta (Subcategoria)</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th class="l">Segmento no dash</th><th class="l">MTRIX</th><th class="l">Colecta</th></tr></thead><tbody>` +
    D.regua.map(x => `<tr><td class="l b ${mkCls(x.marca)}">${tit(x.marca)}</td><td class="l">${tit(x.segmento)}</td><td class="l">${esc(x.mtrix)}</td><td class="l">${esc(x.colecta)}</td></tr>`).join('') + '</tbody></table></div></div>';
}

function tabelaFontes() {
  const L = ((DSO.atualizacao || {}).fontes || []).filter(f => f.id !== 'execucao' && f.id !== 'msl_indireto' && f.id !== 'nielsen'); if (!L.length) return '';   // De-para do Sell Out: as fontes do MSL Direto e do MSL Indireto têm a própria faixa "Dados de"
  const sit = f => ({ok: ['Em dia', 'up'], parc: [`Em dia, ${f.ate_txt} parcial`, 'parc'], warn: [faltaFonte(f), 'warn'], flat: ['Encerrada', 'flat']})[estadoFonte(f)];
  return `<div class="card"><p class="eyebrow">Data de cada fonte</p><div class="tw"><table><thead><tr><th class="l">Fonte</th><th class="l">Extraída em</th><th class="l">Dado até</th><th class="l">Último mês fechado</th><th class="l">Situação</th><th class="l">O que é</th></tr></thead><tbody>` +
    L.map(f => `<tr><td class="l b">${esc(f.nome)}</td><td class="l">${esc(f.extraido ? f.extraido + (f.hora ? ' ' + f.hora : '') : '-')}</td><td class="l">${esc(f.ate_dia + (f.parcial ? ` (${f.ate_txt} parcial)` : ''))}</td><td class="l">${esc(f.fechado_txt || f.ate_txt)}</td><td class="l">${selo(sit(f))}</td><td class="l txt">${esc(f.obs || '')}</td></tr>`).join('') +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">Site publicado em ${esc(DSO.gerado)}. A data de publicação muda a cada republicação do site; a data que vale para o número é a da extração de cada fonte. A régua de em dia compara o último mês fechado: a partir do dia 8, o site precisa ter o mês anterior fechado.</p></div>`;
}
function linhasBase() {
  const nv = MODO === 'si' ? 'SEGMENTO' : (S.ui.bnv || 'TOTAL'), mk = gMarcas(), sg = gSegs();
  return BASE.filter(r => (nv === 'TODOS' || r[COL.nivel] === NIV[nv === 'SEGMENTO' ? 'SEG' : nv]) && (!mk || mk.has(r[COL.marca]) || r[COL.marca] === TODAS) && (!sg || sg.has(r[COL.segmento]) || r[COL.segmento] === TODOS));
}
const CAB = () => (MODO === 'si'
  ? ['AnoMes','Ano','Mês','Cliente (L4)','BU','Cliente','Executivo','Canal','Fonte','Executivo na época','Nível','Marca','Segmento','NR R$','Caixas']
  : ['AnoMes','Ano','Mês','Recorte','UF','Grp. Econômico','Executivo de Vendas','Canal','Fonte','Comparabilidade','Nível','Marca','Segmento','Sell out R$','Caixas','PDVs']);
const celulas = r => [r[0] * 100 + r[1], r[0], MESES[r[1] - 1], ...['recorte','uf','grp','executivo','canal','fonte','janela','nivel','marca','segmento'].map(k => dic[k][r[COL[k]]]), r[RS], r[CX], ...(MODO === 'si' ? [] : [r[PDV]])];
function pgBase() {
  const L = linhasBase().slice().sort((a, b) => b[0] * 100 + b[1] - (a[0] * 100 + a[1])), pg = S.ui.pag || 0, por = 50, np = Math.max(1, Math.ceil(L.length / por));
  const p = Math.min(pg, np - 1); S.ui.pag = p;
  return hero('Base geral', 'A base que alimenta tudo.', `${n0(L.length)} linhas no recorte atual${T('', ' (P&L Restated, meses fechados)')}. As segmentações filtram aqui também.`) +
    `<div class="card"><div class="pills">${MODO === 'si' ? '<span class="note" style="margin:0">P&L Restated no nível segmento. NR e caixas somam direto.</span>' : ['TOTAL','MARCA','SEGMENTO','TODOS'].map(n => `<button data-act="ui" data-k="bnv" data-v="${n}" class="${n === (S.ui.bnv || 'TOTAL') ? 'on' : ''}">Nível ${tit(n)}</button>`).join('')}
    <button class="btn dark" data-act="csv" style="margin-left:auto">${ART ? 'Copiar o recorte para o Excel' : 'Baixar CSV do recorte'}</button></div>
    ${ART ? '<textarea id="csvbox" class="csvbox" hidden readonly aria-label="Recorte em texto para copiar"></textarea>' : ''}
    <div class="tw"><table><thead><tr>${CAB().map((c, i) => `<th class="${i > 2 && i < 13 ? 'l' : ''}">${c}</th>`).join('')}</tr></thead><tbody>` +
    L.slice(p * por, p * por + por).map(r => `<tr>${celulas(r).map((c, i) => `<td class="${i > 2 && i < 13 ? 'l' : ''}">${i >= 13 ? n0(c) : esc(c)}</td>`).join('')}</tr>`).join('') +
    `</tbody></table></div><div class="pager"><button data-act="pag" data-d="-1" ${p === 0 ? 'disabled' : ''}>‹ Anterior</button>Página ${p + 1} de ${np}<button data-act="pag" data-d="1" ${p >= np - 1 ? 'disabled' : ''}>Próxima ›</button></div></div>`;
}
function baixarCSV(btn) {
  const L = linhasBase();
  if (ART) {   // o link do claude.ai não deixa a página baixar arquivo: copia em colunas (tab) para colar no Excel
    const c = s => (typeof s === 'number' ? String(s).replace('.', ',') : String(s).replace(/[\t\n]/g, ' '));
    const txt = [CAB().join('\t'), ...L.map(r => celulas(r).map(c).join('\t'))].join('\n');
    const falha = () => { const ta = document.getElementById('csvbox'); if (!ta) return; ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); btn.textContent = 'Texto selecionado: use Cmd+C ou Ctrl+C'; };
    try { navigator.clipboard.writeText(txt).then(() => { btn.textContent = `Copiado: ${n0(L.length)} linhas. Cole no Excel`; }, falha); } catch (e) { falha(); }
    return;
  }
  const q = s => (typeof s === 'number' ? String(s).replace('.', ',') : '"' + String(s).replace(/"/g, '""') + '"');
  const txt = '﻿' + [CAB().map(q).join(';'), ...L.map(r => celulas(r).map(q).join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'text/csv;charset=utf-8'}));
  a.download = `base_governanca_cto_${T('sellout', 'sellin')}_corte_${S.corte}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ======================= Perna Sell In: clientes, executivos, plano do Q4 e mês em curso ======================= */
const MK_HYG = ['VEJA', 'VANISH', 'HARPIC', 'FINISH'];
const MK_HN_SI = ['JONTEX', 'OLLA', 'SUSTAGEN', 'VEET', 'DERMODEX', 'LUFTAL', 'LUFTAGASTRO', 'LUFTALAX', 'STREPSILS', 'NALDECON', 'NUROMOL', 'LUFTAFEM'];
const idHyg = () => id('uf', 'Hygiene');
const infoGrp = nome => D.depara.find(d => d.grp === nome);
const omMes = () => (D.om ? +D.om.data.slice(4, 6) : NaN);
const omData = () => (D.om ? `${D.om.data.slice(6, 8)}/${D.om.data.slice(4, 6)}` : 'sem Order Management');
const ZERO_OM = {fat: 0, cart: 0, aloc: 0, fut: 0, bloq: 0, nfat: 0, ncart: 0, nfut: 0, nbloq: 0, vfat: 0, vped: 0};
const Q4P = () => D.q4 || {piso: NaN, alvo: NaN, regua_item1: NaN, regua_item2: NaN, rot: {}, txt: {}};   // parâmetros da régua: só no arquivo cifrado
const rq = k => esc((Q4P().rot || {})[k] || ''), tq = k => esc((Q4P().txt || {})[k] || '');
const om1 = o => Object.assign({...ZERO_OM}, omSoma(o).get('_') || {});
const dRS = x => (isFinite(x) ? `<span class="vr ${x > 0.5 ? 'up' : x < -0.5 ? 'down' : 'flat'}">${x > 0 ? '+' : ''}${n0(x)}</span>` : '');
const pctMeta = x => (isFinite(x) ? `<span class="vr ${x >= 1 ? 'up' : x >= Q4P().piso ? 'warn' : 'down'}">${p1(x)}</span>` : '');
const pctMetaG = pctMeta;   // atingimento: verde a partir de 100%, amarelo a partir do piso
const zeroNaN = x => (x ? x : NaN);

/* curva do ano numa linha: 2025 cinza, 2026 rosa e o plano do Q4 tracejado */
function spark(a, pa) {
  const W = 132, H = 34, px = m => 4 + (m - 1) * (W - 8) / 11;
  let mx = 0;
  for (let m = 1; m <= 12; m++) [v(a, 2025, m), v(a, 2026, m), pa ? v(pa, 2026, m) : NaN].forEach(x => { if (x > mx) mx = x; });
  if (!mx) return '';
  const py = x => (H - 3 - Math.max(0, x) / mx * (H - 6)).toFixed(1);
  const linha = (pts, cor, extra = '') => (pts.length > 1 ? `<polyline points="${pts.map(([m, x]) => px(m).toFixed(1) + ',' + py(x)).join(' ')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${extra}/>` : '');
  const p25 = [], p26 = [], pp = [];
  for (let m = 1; m <= 12; m++) { const x = v(a, 2025, m), y = v(a, 2026, m); if (isFinite(x)) p25.push([m, x]); if (isFinite(y) && !ehParcial(m)) p26.push([m, y]); }
  if (pa) {
    Q4M.forEach(m => { const x = v(pa, 2026, m); if (x > 0) pp.push([m, x]); });
    const ult = p26[p26.length - 1]; if (pp.length && ult && ult[0] === pp[0][0] - 1) pp.unshift(ult);
  }
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${linha(p25, '#D2D2D7')}${linha(pp, '#6E6E73', 'stroke-dasharray="3 3"')}${linha(p26, '#FF007F')}</svg>`;
}

/* curvas de crescimento e queda: uma linha por chave (cliente, executivo, marca) */
function curvasDados(chaveFn, opts) {
  const R = cubo('rs', {...opts, chave: chaveFn}), C = cubo('cx', {...opts, chave: chaveFn}), P = cuboP('rs', {...opts, chave: chaveFn});
  const c = S.corte, u3 = [c - 2, c - 1, c].filter(m => m >= 1), a3 = [c - 5, c - 4, c - 3].filter(m => m >= 1);
  const vazio = () => new Float64Array(48).fill(NaN);
  return [...new Set([...R.keys(), ...P.keys()])].map(k => {
    const a = R.get(k) || vazio(), cx = C.get(k) || vazio(), pa = P.get(k) || null;
    const r25 = agg(a, 2025, ate(c), false), r26 = agg(a, 2026, ate(c), false), c25 = agg(cx, 2025, ate(c), false), c26 = agg(cx, 2026, ate(c), false);
    const pl = pa ? agg(pa, 2026, Q4M, false) : NaN, q425 = agg(a, 2025, Q4M, false);
    return {k, a, pa, r25, r26, c25, c26, q425, pl, d: varr(r26, r25), dr: (isFinite(r26) ? r26 : 0) - (isFinite(r25) ? r25 : 0),
      t3: a3.length === 3 && u3.length === 3 ? varr(agg(a, 2026, u3, false), agg(a, 2026, a3, false)) : NaN, t3a: u3.length === 3 ? varr(agg(a, 2026, u3, false), agg(a, 2025, u3, false)) : NaN,
      dc: varr(c26, c25), nc: r26 / c26, dnc: varr(r26 / c26, r25 / c25), dpl: varr(pl, q425)};
  }).filter(x => isFinite(x.r25) || isFinite(x.r26) || x.pl > 0);
}
function tabelaCurvas(t, rotulo, L, nomeFn, extraFn) {
  const cols = [x => semAcento(nomeFn(x.k)), x => x.r25, x => x.r26, x => x.d, x => x.dr, x => x.t3a, x => x.t3, x => x.c26, x => x.dc, x => x.nc, x => x.dnc, x => x.pl, x => x.dpl];
  ordena(L, t, cols, 2);
  const comPl = L.some(x => x.pl > 0), sel = String(S.ui['sel' + t] ?? '');
  const u = S.corte, tri = u >= 3 ? `${mes(u - 2)} a ${mes(u)}${marcaParc(u)}` : 'últimos meses';
  const soma = f => L.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0);
  const T0 = {r25: soma(x => x.r25), r26: soma(x => x.r26), c25: soma(x => x.c25), c26: soma(x => x.c26), pl: soma(x => x.pl), q425: soma(x => x.q425)};
  const linha = (x, tot) => `<tr class="${tot ? 'tot' : String(x.k) === sel ? 'on' : ''}"><td class="l b">${tot ? 'Total' : `<button class="lnk" data-act="ui" data-k="sel${t}" data-v="${String(x.k) === sel ? '' : x.k}">${nomeFn(x.k)}</button>`}</td>` +
    (extraFn ? `<td class="l">${tot ? '' : extraFn(x.k)}</td>` : '') + `<td>${tot ? '' : spark(x.a, x.pa)}</td>` +
    `<td>${n0(x.r25)}</td><td class="b">${n0(x.r26)}</td><td>${vc(varr(x.r26, x.r25))}</td><td>${dRS((x.r26 || 0) - (x.r25 || 0))}</td><td>${tot ? '' : vc(x.t3a)}</td><td>${tot ? '' : vc(x.t3)}</td>` +
    `<td>${n0(x.c26)}</td><td>${vc(varr(x.c26, x.c25))}</td><td>${n2(x.r26 / x.c26)}</td><td>${vc(varr(x.r26 / x.c26, x.r25 / x.c25))}</td>` +
    (comPl ? `<td class="b pl">${n0(zeroNaN(x.pl))}</td><td>${n0(x.q425)}</td><td>${vc(varr(x.pl, x.q425))}</td>` : '') + '</tr>';
  return `<div class="tw"><table><thead><tr>${thSort(t, 0, rotulo, 'l')}${extraFn ? '<th class="l"></th>' : ''}<th>Curva 25 · 26${comPl ? ' · plano' : ''}</th>
    ${thSort(t, 1, `${T('R$', 'NR')} 25 ${corteTxt()}`)}${thSort(t, 2, `${T('R$', 'NR')} 26`)}${thSort(t, 3, '26 vs 25')}${thSort(t, 4, T('Δ R$', 'Δ NR R$'))}${thSort(t, 5, `${tri} vs 25`)}${thSort(t, 6, `${tri} vs 3 ant.`)}
    ${thSort(t, 7, 'Caixas 26')}${thSort(t, 8, 'Var. cx')}${thSort(t, 9, T('R$/cx 26', 'NR/cx 26'))}${thSort(t, 10, T('Var. R$/cx', 'Var. NR/cx'))}
    ${comPl ? `${thSort(t, 11, 'Plano Q4')}<th>Q4 2025</th>${thSort(t, 12, 'Plano vs Q4/25')}` : ''}</tr></thead><tbody>
    ${L.map(x => linha(x)).join('') || '<tr><td colspan="16" class="empty">Nada neste recorte.</td></tr>'}${L.length ? linha(T0, true) : ''}</tbody></table></div>
    <p class="note" style="margin:10px 0 0">Clique no título da coluna para ordenar. ${T('Δ R$', 'Δ NR R$')} = quanto somou ou tirou do ano.${T(' Caixas não comparam entre ferramentas (MTRIX e Colecta).', '')} A curva mostra 2025 em cinza, 2026 em rosa${comPl ? ' e o plano do Q4 tracejado' : ''}.</p>`;
}
function ponte(L, nomeFn) {
  const up = L.filter(x => x.dr > 0.5).sort((a, b) => b.dr - a.dr).slice(0, 6), dn = L.filter(x => x.dr < -0.5).sort((a, b) => a.dr - b.dr).slice(0, 6);
  const tot = L.reduce((s, x) => s + x.dr, 0);
  const lista = X => X.map(x => `<tr><td class="l b">${nomeFn(x.k)}</td><td>${dRS(x.dr)}</td><td>${vc(x.d)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Ninguém neste recorte.</td></tr>';
  const cab = `<thead><tr><th class="l">Nome</th><th>${T('Δ R$', 'Δ NR R$')}</th><th>26 vs 25</th></tr></thead>`;
  return `<h2 class="sec">Quem puxa e quem segura. <span>Variação ${T('do sell out', 'do NR')} em R$, ${corteTxt()} de 2026 contra 2025: ${dRS(tot)} no total.</span></h2><div class="grid g2">
    <div class="card"><p class="eyebrow">Mais somaram</p><div class="tw"><table>${cab}<tbody>${lista(up)}</tbody></table></div></div>
    <div class="card"><p class="eyebrow">Mais tiraram</p><div class="tw"><table>${cab}<tbody>${lista(dn)}</tbody></table></div></div></div>`;
}
function detalheChave(t, k, col, nome, op) {
  const o = {...op, sub: r => r[col] === k};
  let h = `<div class="det"><h2 class="sec">${nome}. <span>Curva do ano, marca a marca${col === COL.grp ? (MODO === 'si' ? ' e segmento a segmento' : '') : T(' e distribuidor a distribuidor', ' e cliente a cliente')}.</span></h2>` + bloco('det' + t + '_' + k, nome, o);
  const MK = dic.marca.map((m, i) => [i, `<span class="${mkCls(m)}">${tit(m)}</span>`]).filter(([i]) => i !== TODAS);
  h += `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${tabelaYTD('Marca', MK, r => r[COL.marca], o, true)}</div>`;
  if (col === COL.grp && MODO === 'si') h += `<div class="card"><p class="eyebrow">${nome} · segmento a segmento</p>${tabelaYTD('Segmento', dic.segmento.map((g, i) => [i, tit(g)]), r => r[COL.segmento], o)}</div>`;
  else if (col !== COL.grp) h += `<div class="card"><p class="eyebrow">${nome} · ${T('distribuidor a distribuidor', 'cliente a cliente')}</p>${tabelaYTD(T('Distribuidor', 'Cliente'), D.depara.map(d => [id('grp', d.grp), tit(d.grp), T(d.uf, tit(d.canal))]), r => r[COL.grp], o)}</div>`;
  return h + '</div>';
}

/* números do Q4 no recorte, só Hygiene (a base da régua do time): plano, Q4 de 2025 e o mês em curso no Order Management */
function q4Num(op) {
  const opH = {...op, sub: subHyg(op.sub)}, pa = umP('rs', opH), pc_ = umP('cx', opH), a = um('rs', opH), c = um('cx', opH);
  return {ar: agg(pa, 2026, Q4M, false), arM: Q4M.map(m => v(pa, 2026, m)), arC: agg(pc_, 2026, Q4M, false), arCM: Q4M.map(m => v(pc_, 2026, m)),
    q425: agg(a, 2025, Q4M, false), q425M: Q4M.map(m => v(a, 2025, m)), q425C: agg(c, 2025, Q4M, false), q425CM: Q4M.map(m => v(c, 2025, m)), om: om1({...op, so: 'hyg'}), mOM: omMes()};
}
function q4Resumo(op) {
  if (!temPlano(umP('rs', {...op, sub: subHyg(null)}))) return '<p class="note">Plano do Q4: este recorte não tem AR de Hygiene.</p>';
  const Q = Q4P(), N = q4Num(op), i = Q4M.indexOf(N.mOM), arm = i >= 0 ? N.arM[i] : NaN, ped = N.om.nfat + N.om.ncart;
  const nm = i >= 0 ? MES_LONGO[N.mOM - 1] : 'outubro';
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  return `<h2 class="sec">O Q4 em uma linha. <span>AR de Hygiene e ${nm} em curso no Order Management até ${omData()}.</span></h2><div class="grid g4">` +
    card('Plano do Q4 · Hygiene', mi(N.ar), `${vbig(varr(N.ar, N.q425))}<span>sobre o Q4 de 2025 em Hygiene (${mi(N.q425)})</span>`) +
    card(`AR de ${nm}`, mi(arm), `<span>${rq('piso_txt')}: ${mi(arm * Q.piso)}</span>`) +
    card(`Faturado em ${nm}`, mi(N.om.nfat), `${pctMeta(N.om.nfat / arm)}<span>do AR do mês · NR estimado</span>`) +
    card('Faturado + carteira', mi(ped), `${pctMeta(ped / arm)}<span>do AR do mês · falta ${mi(Math.max(0, arm - ped))}</span>`) +
    `</div><p class="note"><a href="#si-q4" data-act="pg" data-pg="si-q4">Abrir o Plano Q4 ›</a> com a meta por executivo, cliente e marca. A régua do variável e os itens da campanha estão no <a href="#si-rv" data-act="pg" data-pg="si-rv">RV</a>.</p>`;
}

function pgSiInicio() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  const side = `<div class="side">${(D.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Corte ${mes(S.corte)}/26 · Order Management de ${omData()}</div>`;
  let h = hero('', 'Governança CTO.', 'Sell in do Centro-Oeste, mês a mês, com o plano do Q4.', side);
  const pn = [['si-geral', 'Total', null], ...MK_HYG.map(m => ['si-' + m.toLowerCase(), tit(m), MARCA_PAG['si-' + m.toLowerCase()]]), ['si-hn', 'H&N', MK_HN_SI]];
  h += '<div class="pnav">' + pn.map(([pg, nome, mk]) => {
    const a = um('rs', {marcas: mk ? marcasDe(mk) : op.marcas, segs: op.segs}), d = varr(ytd(a, 2026, 'rs'), ytd(a, 2025, 'rs'));
    return `<a href="#${pg}" data-act="pg" data-pg="${pg}"><div class="mk ${mkCls(mk && mk[0])}">${nome}</div><div class="v">${mi(ytd(a, 2026, 'rs'))} · ${vc(d)}</div></a>`;
  }).join('') + '</div>';
  h += recorteTxt();
  h += `<h2 class="sec">O ano em números. <span>NR e caixas de ${corteTxt()} contra o mesmo período de 2025.</span></h2>` + kpis(op);
  h += q4Resumo(op);
  // marcas
  const chM = r => r[COL.marca];
  const R = cubo('rs', {chave: chM, segs: op.segs}), PR = cuboP('rs', {chave: chM, segs: op.segs});
  h += `<h2 class="sec">As marcas. <span>Cada uma com a sua curva; out a dez em cinza é o plano.</span></h2><div class="shelf">` + [...MK_HYG, 'SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'].map(m => {
    const k = id('marca', m), a = R.get(k); if (!a) return '';
    const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs'), pg = MARCA_PAG['si-' + m.toLowerCase()] ? 'si-' + m.toLowerCase() : 'si-hn';
    return `<a class="card" href="#${pg}" data-act="pg" data-pg="${pg}"><p class="eyebrow ${mkCls(m)}">${tit(m)}</p><div class="kpi"><div class="val" style="font-size:30px">${mi(y26)}</div>
      <div class="sub">${vc(varr(y26, y25))} sobre 2025</div></div>${chart(a, 'rs', 120, 244, false, {plano: PR.get(k)}).replace(/<div class="legend">.*<\/div>$/, '')}</a>`;
  }).join('') + '</div>';
  // clientes
  const L = curvasDados(r => r[COL.grp], op).filter(x => isFinite(x.r26)).sort((a, b) => b.r26 - a.r26);
  h += `<h2 class="sec">Os clientes. <span>Quem puxa e quem segura o ano.</span></h2><div class="shelf">` + L.map(x => {
    const nome = dic.grp[x.k], d = infoGrp(nome);
    return `<a class="card kpi" href="#si-clientes" data-act="pg" data-pg="si-clientes"><p class="eyebrow">${d ? tit(d.canal) : ''}</p><h3>${tit(nome)}</h3><div class="val" style="font-size:28px">${mi(x.r26)}</div>
      <div class="sub">${vc(x.d)} sobre 2025${d ? ' · ' + esc(d.executivo) : ''}</div>${spark(x.a, x.pa)}</a>`;
  }).join('') + '</div>';
  h += ponte(curvasDados(r => r[COL.grp], op), k => tit(dic.grp[k]));
  const IDX = [['si-geral', 'Dados gerais', 'Total da carteira: NR e caixas mês a mês com o plano do Q4, NR por caixa, marca a marca, canal, BU, cliente e executivo.'],
    ['si-veja', 'Veja', 'Visão marca e segmentos, com as curvas por cliente dentro da marca.'], ['si-vanish', 'Vanish', 'Líquido, pó, barra e Vanish Others.'],
    ['si-harpic', 'Harpic', 'Pedra, ITC, ITB, líquido, blocos e Click Gel.'], ['si-finish', 'Finish', 'Pó, secante e tabletes.'],
    ['si-hn', 'H&N', 'Jontex e Olla, Sustagen, Veet e as outras marcas de Health, com o AR do Q4 de H&N.'],
    ['si-diretor', 'Visão do Diretor', 'Cliente x marca x ano no acumulado, com o plano do Q4 ao lado.'],
    ['si-clientes', 'Clientes', 'Curvas de crescimento e queda por cliente, quem soma e quem tira do ano.'],
    ['si-exec', 'Executivos', 'As mesmas curvas por executivo, com a carteira de clientes de cada um.'],
    ['si-q4', 'Plano Q4', 'AR por mês, executivo, cliente e marca, com a escada da regional.'],
    ['si-mes', 'Mês em curso', 'Order Management: faturado, carteira, alocação e carteira futura contra o AR do mês.'],
    ['si-rv', 'RV', 'Faixa de NR de cada executivo no mês, marcos do trimestre, itens da campanha e a régua.'],
    ['si-base', 'Base geral', 'A base longa do P&L Restated, filtrada pelas segmentações, com download.']];
  h += `<h2 class="sec">O índice. <span>A mesma lógica da perna Sell Out.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como ler. <span>Regras da perna Sell In.</span></h2><div class="card"><ol class="num">
    <li>As segmentações no topo valem para a perna inteira: marcar um executivo filtra também marcas, clientes, o plano do Q4 e o mês em curso. O link da página guarda o recorte.</li>
    <li>O botão Excel, na barra das segmentações, baixa as tabelas da página aberta já no recorte marcado.</li>
    ${(D.regras || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
  return h;
}

function pgSiGeral() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('Dados gerais', 'Total da carteira.', 'Sell in do CTO em NR e caixas, mês a mês; out a dez de 2026 em cinza é o plano do Q4.') + recorteTxt() + kpis(op);
  h += `<h2 class="sec">Visão total. <span>NR e caixas num card só, com o plano do Q4.</span></h2>` + bloco('sgeral', 'Total', op);
  const r = um('rs', op), c = um('cx', op), pr = umP('rs', op), pcx = umP('cx', op);
  const tp = temPlano(pr);
  h += `<h2 class="sec">NR por caixa. <span>Quanto vale cada caixa vendida, mês a mês.</span></h2><div class="card"><h3>R$ ${n2(ytd(r, 2026, 'rs') / ytd(c, 2026, 'cx'))} no acumulado de 2026. <span>Contra R$ ${n2(ytd(r, 2025, 'rs') / ytd(c, 2025, 'cx'))} em 2025.</span></h3>
    <div class="tw"><table><thead><tr><th>Mês</th>${ANOS.map(y => `<th>${y}</th>`).join('')}${tp ? '<th>Plano Q4</th>' : ''}<th>26 vs 25</th></tr></thead><tbody>` +
    ate(12).map(m => { const q = y => v(r, y, m) / v(c, y, m), p = v(pr, 2026, m) / v(pcx, 2026, m);
      return `<tr><td class="b">${MESES[m - 1]}</td>${ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n2(q(y))}</td>`).join('')}${tp ? `<td class="pl">${n2(p)}</td>` : ''}<td>${vc(varr(q(2026), q(2025)))}</td></tr>`; }).join('') +
    '</tbody></table></div></div>';
  const MK = dic.marca.map((m, i) => [i, `<span class="${mkCls(m)}">${tit(m)}</span>`]);
  h += `<h2 class="sec">Marca a marca. <span>Acumulado de ${corteTxt()}; o plano do Q4 ao lado.</span></h2><div class="card">` + tabelaYTD('Marca', MK, r_ => r_[COL.marca], op) + '</div>';
  h += `<h2 class="sec">Canal a canal. <span>Canal L2 do P&L.</span></h2><div class="card">` + tabelaYTD('Canal', dic.canal.map((x, i) => [i, tit(x)]), r_ => r_[COL.canal], op) + '</div>';
  h += `<h2 class="sec">BU a BU. <span>Cada BU com o seu AR do Q4; a página Plano Q4 usa só Hygiene.</span></h2><div class="card">` + tabelaYTD('BU', dic.uf.map((x, i) => [i, esc(x)]), r_ => r_[COL.uf], op) + '</div>';
  h += `<h2 class="sec">Cliente a cliente. <span>Ordenado pelo NR de 2026.</span></h2><div class="card">` + tabelaYTD('Cliente', D.depara.map(d => [id('grp', d.grp), tit(d.grp), tit(d.canal)]), r_ => r_[COL.grp], op) + '</div>';
  h += `<h2 class="sec">Executivo a executivo. <span>Carteira atual de cada um, com o histórico dos clientes.</span></h2><div class="card">` + tabelaYTD('Executivo', dic.executivo.map((x, i) => [i, esc(x)]), r_ => r_[COL.executivo], op) + '</div>';
  return h;
}

function pgSiClientes() {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[COL.grp], op);
  let h = hero('Clientes', 'Curvas por cliente.', `Quem cresce e quem cai no sell in, ${corteTxt()} de 2026 contra 2025, com o plano do Q4.`) + recorteTxt();
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>NR de ${corteTxt()}, 2026 contra 2025, por cliente.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, k => tit(dic.grp[k]));
  h += `<h2 class="sec">Cliente a cliente. <span>Clique no nome para abrir a curva, as marcas e os segmentos.</span></h2><div class="card">` +
    tabelaCurvas('cli', 'Cliente', L, k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? `${tit(d.canal)} · ${esc(d.executivo)}` : ''; }) + '</div>';
  const sl = S.ui.selcli;
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) h += detalheChave('cli', +sl, COL.grp, tit(dic.grp[+sl]), op);
  h += (D.notas_clientes || []).map(t => `<p class="note">${esc(t)}</p>`).join('');
  return h;
}
function pgSiExec() {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[COL.executivo], op);
  let h = hero('Executivos', 'Curvas por executivo.', `Carteira atual de cada executivo, ${corteTxt()} de 2026 contra 2025, com o plano do Q4.`) + recorteTxt();
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>NR de ${corteTxt()}, 2026 contra 2025, por executivo.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, k => esc(dic.executivo[k]));
  h += `<h2 class="sec">Executivo a executivo. <span>Clique no nome para abrir a curva, as marcas e a carteira de clientes.</span></h2><div class="card">` +
    tabelaCurvas('exe', 'Executivo', L, k => esc(dic.executivo[k]), null) + '</div>';
  const sl = S.ui.selexe;
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) {
    const k = +sl, Lc = curvasDados(r => r[COL.grp], {...op, sub: r => r[COL.executivo] === k});
    h += detalheChave('exe', k, COL.executivo, esc(dic.executivo[k]), op);
    h += `<div class="card"><p class="eyebrow">${esc(dic.executivo[k])} · curvas por cliente</p>${tabelaCurvas('exc' + k, 'Cliente', Lc, x => tit(dic.grp[x]), x => { const d = infoGrp(dic.grp[x]); return d ? tit(d.canal) : ''; })}</div>`;
  }
  h += (D.notas_exec || []).map(t => `<p class="note">${esc(t)}</p>`).join('');
  return h;
}

/* executivos no Q4 (só Hygiene): meta, mês em curso no Order Management e itens da campanha; usado no Plano Q4 e no RV */
function execQ4(op) {
  const hy = idHyg(), ehH = r => r[COL.uf] === hy, opH = {...op, sub: ehH}, Q = Q4P(), N = q4Num(op), iM = Q4M.indexOf(N.mOM);
  const semRecorte = !FILTROS.some(([k]) => S.f[k].size);
  const chE = r => r[COL.executivo], P = cuboP('rs', {...opH, chave: chE}), PC = cuboP('cx', {...opH, chave: chE}), A25 = cubo('rs', {...opH, chave: chE});
  const OM = omSoma({...op, so: 'hyg', chave: l => l[1]}), I2 = id('segmento', Q.seg_item2 || '');
  const I1 = cuboP('cx', {...op, sub: r => r[14] === 1, chave: chE}), I1R = cuboP('rs', {...op, sub: r => r[14] === 1, chave: chE});
  const I2P = cuboP('rs', {...opH, sub: r => ehH(r) && r[COL.segmento] === I2, chave: chE}), I2O = omSoma({...op, so: 'hyg', sub: l => l[5] === I2, chave: l => l[1]});
  const car = nome => (D.cenarios && D.cenarios.carteiras || []).find(c => c.exec === nome) || {};
  const prev = Q4M.filter(m => m < N.mOM), RP = cubo('rs', {...opH, chave: chE, semCorte: true}), OMA = new Map();
  prev.filter(m => m > D.ult26).forEach(m => omSoma({...op, so: 'hyg', chave: l => l[1], linhas: OMB_ANT.filter(l => l[16] === m)}).forEach((o, k) => OMA.set(k, (OMA.get(k) || 0) + o.nfat)));
  const realAnt = k => prev.reduce((t, m) => t + (m <= D.ult26 && RP.get(k) ? (v(RP.get(k), 2026, m) || 0) : 0), 0) + (OMA.get(k) || 0);
  const ex = [...P.keys()].map(k => {
    const pa = P.get(k), o = Object.assign({...ZERO_OM}, OM.get(k) || {}), a = A25.get(k), i1 = I1.get(k), i2 = I2P.get(k), i2o = Object.assign({...ZERO_OM}, I2O.get(k) || {});
    const arQ = agg(pa, 2026, Q4M, false), arMes = iM >= 0 ? v(pa, 2026, N.mOM) : NaN, arM3 = Q4M.map(m => v(pa, 2026, m));
    return {k, nome: dic.executivo[k], arQ, arMes, arM3, real: realAnt(k), q425: a ? agg(a, 2025, Q4M, false) : NaN, arC: agg(PC.get(k), 2026, Q4M, false), o, rec: semRecorte ? car(dic.executivo[k]).rec : NaN,
      i1AR: i1 ? agg(i1, 2026, Q4M, false) : NaN, i1RS: I1R.get(k) ? agg(I1R.get(k), 2026, Q4M, false) : NaN, i2AR: i2 ? agg(i2, 2026, Q4M, false) : NaN, i2Ped: i2o.nfat + i2o.ncart};
  }).filter(x => x.arQ > 0).sort((a, b) => b.arQ - a.arQ);
  return {ex, N, iM, Q, semRecorte, nomeM: iM >= 0 ? MES_LONGO[N.mOM - 1] : 'mês'};
}
/* ----- Plano do Q4 (só Hygiene; parâmetros e textos da régua vêm do arquivo de dados cifrado) ----- */
function regrasQ4() {
  return `<h2 class="sec">A régua do variável. <span>${tq('regua')}</span></h2><div class="card"><ol class="num">${(D.regras_q4 || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
    <p class="note" style="margin:12px 0 0">O site mostra metas e atingimento. Valores de salário e de RV individual ficam fora.</p></div>`;
}
const notaL4 = () => ((S.f.recorte.size || S.f.canal.size) && D.nota_l4_om ? `<p class="note">${esc(D.nota_l4_om)}</p>` : '');
function pgSiQ4() {
  const op = {marcas: gMarcas(), segs: gSegs()}, hy = idHyg(), ehH = r => r[COL.uf] === hy, opH = {...op, sub: ehH}, Q = Q4P();
  let h = hero('Plano Q4', 'O plano do Q4.', `AR oficial de 29/09 em Hygiene, o Q4 de 2025 e o mês em curso no Order Management até ${omData()}.`) + recorteTxt();
  if (!temPlano(umP('rs', opH))) return h + notaL4() + '<div class="card"><div class="empty">Este recorte não tem AR de Hygiene no Q4.</div></div><p class="note"><a href="#si-rv" data-act="pg" data-pg="si-rv">Abrir o RV ›</a> com a régua do variável.</p>';
  h += `<p class="note">${tq('base')}</p>` + notaL4();
  const N = q4Num(op), iM = Q4M.indexOf(N.mOM), arm = iM >= 0 ? N.arM[iM] : NaN, ped = N.om.nfat + N.om.ncart, nomeM = iM >= 0 ? MES_LONGO[N.mOM - 1] : 'mês';
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g4">` + card('Plano do Q4 · Hygiene', mi(N.ar), `${vbig(varr(N.ar, N.q425))}<span>sobre o Q4 de 2025 em Hygiene (${mi(N.q425)})</span>`) +
    card('Caixas do plano', n0(N.arC), `${vbig(varr(N.arC, N.q425C))}<span>sobre ${n0(N.q425C)} caixas no Q4 de 2025</span>`) +
    card(`Faturado em ${nomeM}`, mi(N.om.nfat), `${pctMeta(N.om.nfat / arm)}<span>do AR de ${nomeM} (${mi(arm)})</span>`) +
    card('Faturado + carteira', mi(ped), `${pctMeta(ped / arm)}<span>do AR · ${rq('piso_txt')}: ${mi(arm * Q.piso)}</span>`) + '</div>';
  // mês a mês
  h += `<h2 class="sec">Mês a mês. <span>${tq('mes_a_mes')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Mês</th><th>AR NR</th><th>AR caixas</th><th>Peso no Q4</th><th>${rq('piso')}</th><th>${rq('alvo')}</th><th>Q4 2025 NR</th><th>AR vs 25</th><th>NR/cx AR</th><th>NR/cx 25</th></tr></thead><tbody>` +
    Q4M.map((m, i) => `<tr><td class="l b">${MESES[m - 1]}</td><td class="b">${n0(N.arM[i])}</td><td>${n0(N.arCM[i])}</td><td>${p1(N.arM[i] / N.ar)}</td><td>${n0(N.arM[i] * Q.piso)}</td><td>${n0(N.arM[i] * Q.alvo)}</td><td>${n0(N.q425M[i])}</td><td>${vc(varr(N.arM[i], N.q425M[i]))}</td><td>${n2(N.arM[i] / N.arCM[i])}</td><td>${n2(N.q425M[i] / N.q425CM[i])}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Q4</td><td>${n0(N.ar)}</td><td>${n0(N.arC)}</td><td>${p1(1)}</td><td>${n0(N.ar * Q.piso)}</td><td>${n0(N.ar * Q.alvo)}</td><td>${n0(N.q425)}</td><td>${vc(varr(N.ar, N.q425))}</td><td>${n2(N.ar / N.arC)}</td><td>${n2(N.q425 / N.q425C)}</td></tr></tbody></table></div></div>`;
  // escada de cenários da regional (só sem recorte: os cenários são da regional inteira)
  const semRecorte = !FILTROS.some(([k]) => S.f[k].size);
  if (semRecorte && D.cenarios) {
    const esc_ = D.cenarios.regional, mx = Math.max(...esc_.map(x => x[1])), ar = N.ar;
    h += `<h2 class="sec">A escada da regional. <span>${tq('escada')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Cenário</th><th class="l">Origem</th><th>NR do Q4</th><th>% do AR</th><th>vs Q4 2025</th><th class="l"></th></tr></thead><tbody>` +
      esc_.map(([n, val, orig]) => `<tr><td class="l b">${esc(n)}</td><td class="l">${esc(orig)}</td><td class="b">${n0(val)}</td><td>${p1(val / ar)}</td><td>${vc(varr(val, N.q425))}</td><td class="l"><div class="barra"><i class="${Math.abs(val - ar) < 1 ? 'pk' : ''}" style="width:${(val / mx * 100).toFixed(1)}%"></i></div></td></tr>`).join('') +
      `</tbody></table></div><p class="note" style="margin:12px 0 0">Q4 de 2025 realizado em Hygiene: ${mi(N.q425)}. ${tq('escada_nota')}</p></div>`;
  }
  // por executivo: meta e mês em curso
  const {ex} = execQ4(op);
  const falta = (x, alvo) => (!(alvo > 0) ? '' : alvo - x > 0.5 ? n0(alvo - x) : '<span class="vr up">batido</span>');
  h += `<h2 class="sec">Executivo a executivo. <span>Meta do Q4 em Hygiene e ${nomeM} em curso. Faturado e carteira em NR estimado pelo NR por caixa do segmento.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th><th>AR Q4</th><th>${rq('alvo')}</th><th>${rq('rec')}</th><th>Q4 2025</th><th>AR vs 25</th>
    <th>AR ${nomeM}</th><th>${rq('piso')}</th><th>Faturado</th><th>Carteira + alocação</th><th>% do AR</th><th>${rq('falta_piso')}</th><th>${rq('falta_100')}</th></tr></thead><tbody>` +
    ex.map(x => { const pd = x.o.nfat + x.o.ncart;
      return `<tr><td class="l b">${esc(x.nome)}</td><td class="b">${n0(x.arQ)}</td><td>${n0(x.arQ * Q.alvo)}</td><td>${n0(x.rec)}</td><td>${n0(x.q425)}</td><td>${vc(varr(x.arQ, x.q425))}</td>
        <td class="b">${n0(x.arMes)}</td><td>${n0(x.arMes * Q.piso)}</td><td>${n0(x.o.nfat)}</td><td>${n0(x.o.ncart)}</td><td>${pctMeta(pd / x.arMes)}</td><td>${falta(pd, x.arMes * Q.piso)}</td><td>${falta(pd, x.arMes)}</td></tr>`; }).join('') +
    (() => { const t = f => ex.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0), pd = t(x => x.o.nfat + x.o.ncart), am = t(x => x.arMes);
      return `<tr class="tot"><td class="l">Total</td><td>${n0(t(x => x.arQ))}</td><td>${n0(t(x => x.arQ) * Q.alvo)}</td><td>${semRecorte ? n0(t(x => x.rec)) : ''}</td><td>${n0(t(x => x.q425))}</td><td>${vc(varr(t(x => x.arQ), t(x => x.q425)))}</td>
        <td>${n0(am)}</td><td>${n0(am * Q.piso)}</td><td>${n0(t(x => x.o.nfat))}</td><td>${n0(t(x => x.o.ncart))}</td><td>${pctMeta(pd / am)}</td><td>${falta(pd, am * Q.piso)}</td><td>${falta(pd, am)}</td></tr>`; })() +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">${tq('exec_nota')}</p></div>`;
  // por cliente
  const chG = r => r[COL.grp], PG = cuboP('rs', {...opH, chave: chG}), AG = cubo('rs', {...opH, chave: chG}), OG = omSoma({...op, so: 'hyg', chave: l => l[0]});
  const cl = [...PG.keys()].map(k => { const pa = PG.get(k), a = AG.get(k), o = Object.assign({...ZERO_OM}, OG.get(k) || {});
    return {k, m: Q4M.map(m => v(pa, 2026, m)), q: agg(pa, 2026, Q4M, false), q25: a ? agg(a, 2025, Q4M, false) : NaN, ped: o.nfat + o.ncart, fat: o.nfat}; }).filter(x => x.q > 0).sort((a, b) => b.q - a.q);
  h += `<h2 class="sec">Cliente a cliente. <span>AR de Hygiene por mês contra o Q4 de 2025 e o pedido de ${nomeM} em mãos.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Cliente</th><th class="l">Executivo</th>${Q4M.map(m => `<th>AR ${mes(m)}</th>`).join('')}<th>AR Q4</th><th>Q4 2025</th><th>AR vs 25</th><th>Faturado ${nomeM}</th><th>Fat. + carteira</th><th>% do AR ${nomeM}</th></tr></thead><tbody>` +
    cl.map(x => { const d = infoGrp(dic.grp[x.k]), am = iM >= 0 ? x.m[iM] : NaN;
      return `<tr><td class="l b">${tit(dic.grp[x.k])}</td><td class="l">${d ? esc(d.executivo) : ''}</td>${x.m.map(y => `<td>${n0(y)}</td>`).join('')}<td class="b">${n0(x.q)}</td><td>${n0(x.q25)}</td><td>${vc(varr(x.q, x.q25))}</td><td>${n0(x.fat)}</td><td>${n0(x.ped)}</td><td>${pctMeta(x.ped / am)}</td></tr>`; }).join('') +
    '</tbody></table></div></div>';
  // por marca e segmento
  const chS = r => r[COL.marca] + '|' + r[COL.segmento], PS = cuboP('rs', {...opH, chave: chS}), PSC = cuboP('cx', {...opH, chave: chS}), AS = cubo('rs', {...opH, chave: chS}), ASC = cubo('cx', {...opH, chave: chS});
  const sg = [...PS.keys()].map(k => { const [m, g] = k.split('|').map(Number); return {m, g, q: agg(PS.get(k), 2026, Q4M, false), qc: agg(PSC.get(k), 2026, Q4M, false), q25: AS.get(k) ? agg(AS.get(k), 2025, Q4M, false) : NaN, qc25: ASC.get(k) ? agg(ASC.get(k), 2025, Q4M, false) : NaN}; })
    .sort((a, b) => a.m - b.m || b.q - a.q);
  h += `<h2 class="sec">Marca e segmento. <span>O plano do Q4 contra o Q4 de 2025, em NR e caixas.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Marca</th><th class="l">Segmento</th><th>AR Q4 NR</th><th>Q4 2025 NR</th><th>Var. NR</th><th>AR Q4 caixas</th><th>Q4 2025 caixas</th><th>Var. caixas</th></tr></thead><tbody>` +
    sg.map(x => `<tr><td class="l b ${mkCls(dic.marca[x.m])}">${tit(dic.marca[x.m])}</td><td class="l">${tit(dic.segmento[x.g])}</td><td class="b">${n0(x.q)}</td><td>${n0(x.q25)}</td><td>${vc(varr(x.q, x.q25))}</td><td>${n0(x.qc)}</td><td>${n0(x.qc25)}</td><td>${vc(varr(x.qc, x.qc25))}</td></tr>`).join('') +
    '</tbody></table></div><p class="note" style="margin:12px 0 0">O P&L não separa o VPS concentrado do diluído: no plano, os dois somam em VPS.</p></div>';
  return h + `<p class="note"><a href="#si-rv" data-act="pg" data-pg="si-rv">Abrir o RV ›</a> com a régua do variável, a faixa de cada executivo e os itens da campanha.</p>`;
}

/* ----- RV: onde cada executivo está na régua do Q4 (textos e faixas vêm do arquivo cifrado; sem salário nem valor de RV) ----- */
function pgSiRV() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('RV', 'O variável do time.', tq('rv_sub'));
  if (!temPlano(umP('rs', {...op, sub: subHyg(null)}))) return h + notaL4() + '<div class="card"><div class="empty">Este recorte não tem AR de Hygiene no Q4.</div></div>' + regrasQ4();
  const {ex, Q, nomeM, N} = execQ4(op);
  const pctMeta = x => pctMetaG(isFinite(x) ? Math.floor(x * 1000 + 1e-9) / 1000 : x);   // trunca: 99,96% não aparece como 100,0%
  const ant = Q4M.filter(m => m < N.mOM);
  h += `<p class="note">${tq('rv_base')}${ant.length ? ` O trimestre soma ${ant.map(m => `${MES_LONGO[m - 1]} (${m <= D.ult26 ? 'P&L fechado' : 'último Order Management do mês'})`).join(' e ')} ao mês em curso.` : ''}</p>` + notaL4();
  const faixas = (Q.escala || []).slice().sort((a, b) => b[0] - a[0]);
  const faixa = x => { if (!isFinite(x)) return ''; const e = faixas.find(([lim]) => x >= lim - 1e-9); return e ? `<span class="vr ${x >= 1 ? 'up' : 'warn'}">${esc(e[1])}</span>` : `<span class="vr down">${rq('abaixo')}</span>`; };
  const marco = (feito, alvo, rot) => (!(alvo > 0) ? '' : feito >= alvo - 0.5 ? `<span class="vr up">${rot}</span>` : 'falta ' + n0(alvo - feito));
  const t = f => ex.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0);
  const pedM = t(x => x.o.nfat + x.o.ncart), arM = t(x => x.arMes), arQ = t(x => x.arQ), pedQ = t(x => x.real + x.o.nfat + x.o.ncart + x.o.nfut);
  const naFaixa = ex.filter(x => (x.o.nfat + x.o.ncart) / x.arMes >= (faixas.length ? faixas[faixas.length - 1][0] : 1)).length;
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g3">` + card(`Time em ${nomeM}`, mi(pedM), `${pctMeta(pedM / arM)}<span>do AR de ${mi(arM)} · ${faixa(pedM / arM)}</span>`) +
    card('Q4 em pedidos', mi(pedQ), `${pctMeta(pedQ / arQ)}<span>do AR do Q4 (${mi(arQ)})</span>`) +
    card('Executivos já na faixa', `${naFaixa} de ${ex.length}`, `<span>no NR de ${nomeM}, com o pedido de hoje</span>`) + '</div>';
  h += `<h2 class="sec">Executivo a executivo. <span>Faixa de NR de ${nomeM} e os marcos do trimestre.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>
    <th>AR ${nomeM}</th><th>Pedido ${nomeM}</th><th>% do AR</th><th class="l">${rq('faixa_col')}</th><th class="l">${rq('acel_col')}</th><th>AR Q4</th><th>Pedidos Q4</th><th>% do Q4</th><th class="l">${rq('marco_q4_col')}</th><th class="l">${rq('alvo')}</th></tr></thead><tbody>` +
    ex.map(x => { const pd = x.o.nfat + x.o.ncart, pq = x.real + x.o.nfat + x.o.ncart + x.o.nfut;
      return `<tr><td class="l b">${esc(x.nome)}</td><td>${n0(x.arMes)}</td><td class="b">${n0(pd)}</td><td>${pctMeta(pd / x.arMes)}</td><td class="l">${faixa(pd / x.arMes)}</td><td class="l">${marco(pd, x.arMes * Q.piso, rq('destravado'))}</td>
        <td>${n0(x.arQ)}</td><td class="b">${n0(pq)}</td><td>${pctMeta(pq / x.arQ)}</td><td class="l">${marco(pq, x.arQ, rq('atingido'))}</td><td class="l">${marco(pq, x.arQ * Q.alvo, rq('atingido'))}</td></tr>`; }).join('') +
    `<tr class="tot"><td class="l">Time</td><td>${n0(arM)}</td><td>${n0(pedM)}</td><td>${pctMeta(pedM / arM)}</td><td class="l">${faixa(pedM / arM)}</td><td class="l">${marco(pedM, arM * Q.piso, rq('destravado'))}</td><td>${n0(arQ)}</td><td>${n0(pedQ)}</td><td>${pctMeta(pedQ / arQ)}</td><td class="l">${marco(pedQ, arQ, rq('atingido'))}</td><td class="l">${marco(pedQ, arQ * Q.alvo, rq('atingido'))}</td></tr>` +
    `</tbody></table></div></div>`;
  h += `<h2 class="sec">Meta de cada mês. <span>AR de Hygiene por executivo e o mínimo de cada mês.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>` +
    Q4M.map(m => `<th>AR ${mes(m)}</th><th>${rq('piso')} ${mes(m)}</th>`).join('') + `<th>AR Q4</th></tr></thead><tbody>` +
    ex.map(x => `<tr><td class="l b">${esc(x.nome)}</td>${x.arM3.map(a => `<td class="b">${n0(a)}</td><td>${n0(a * Q.piso)}</td>`).join('')}<td class="b">${n0(x.arQ)}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Time</td>${Q4M.map((m, i) => { const a = t(x => x.arM3[i]); return `<td>${n0(a)}</td><td>${n0(a * Q.piso)}</td>`; }).join('')}<td>${n0(arQ)}</td></tr></tbody></table></div></div>`;
  // itens da campanha
  h += `<h2 class="sec">Itens da campanha. <span>${tq('itens')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>
    <th>${rq('item1')} AR (cx)</th><th>${rq('regua1')} (cx)</th><th>${rq('item1')} AR (R$)</th><th>${rq('item1')} pedido ${nomeM} (cx)</th><th>% da régua</th><th>${rq('item2')} AR (R$)</th><th>${rq('item2')} pedido ${nomeM} (R$)</th><th>% do AR</th><th>${rq('booster')}</th><th>Pedidos no OM (R$)</th><th>% do AR Q4</th></tr></thead><tbody>` +
    ex.map(x => { const pedQ = x.real + x.o.nfat + x.o.ncart + x.o.nfut, r1 = x.i1AR * Q.regua_item1, r2 = x.i2AR * Q.regua_item2;
      return `<tr><td class="l b">${esc(x.nome)}</td><td>${n0(x.i1AR)}</td><td class="b">${n0(r1)}</td><td>${n0(x.i1RS)}</td><td>${n0(x.o.vped)}</td><td>${p1(x.o.vped / r1)}</td>
        <td class="b">${n0(x.i2AR)}</td><td>${n0(x.i2Ped)}</td><td>${p1(x.i2Ped / r2)}</td><td class="b">${n0(x.arQ)}</td><td>${n0(pedQ)}</td><td>${p1(pedQ / x.arQ)}</td></tr>`; }).join('') +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">${tq('itens_nota')}</p></div>`;
  h += `<p class="note">${tq('rv_fora')}</p>`;
  return h + regrasQ4();
}

/* ----- Sell Out: curvas por distribuidor e por executivo (as redes compradoras ficam nas abas de Clientes) ----- */
const abasMarcas = pg => { const si = MODO === 'si' ? 'si-' : ''; return `<div class="pills" style="margin:0 0 18px">${[['geral', 'Total'], ['veja', 'Veja'], ['vanish', 'Vanish'], ['harpic', 'Harpic'], ['finish', 'Finish'], ['hn', 'H&N']].map(([p, n]) => `<button data-act="pg" data-pg="${si + p}" class="${si + p === pg ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
const comAbasMarca = (html, pg) => { const i = html.indexOf('</section>'); return i < 0 ? abasMarcas(pg) + html : html.slice(0, i + 10) + abasMarcas(pg) + html.slice(i + 10); };
const abasClientesSO = pg => `<div class="pills" style="margin:0 0 18px">${[['clientes', 'Distribuidores'], ['redes-col', 'Redes Colecta'], ['redes-scan', 'Redes Scanntech']].map(([p, n]) => `<button data-act="pg" data-pg="${p}" class="${p === pg ? 'on' : ''}">${n}</button>`).join('')}</div>`;
const comAbas = (html, pg) => {
  const j = !SLIDE && innerWidth <= 640 ? html.indexOf('<div class="card shareuf"') : -1;   // celular: as abas vêm antes do market share por UF, que é alto
  if (j >= 0) return html.slice(0, j) + abasClientesSO(pg) + html.slice(j);
  const i = html.indexOf('</section>'); return i < 0 ? abasClientesSO(pg) + html : html.slice(0, i + 10) + abasClientesSO(pg) + html.slice(i + 10); };
function pgSoCurvas(t, col, rot, plural, nomeFn, extraFn, sub) {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[col], op);
  let h = `<h2 class="sec">Quantas crescem e quantas caem. <span>Sell out de ${corteTxt()}, 2026 contra 2025, por ${rot.toLowerCase()}.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, nomeFn);
  h += `<h2 class="sec">${plural}. <span>${sub}</span></h2><div class="card">` + tabelaCurvas(t, rot, L, nomeFn, extraFn) + '</div>';
  const sl = S.ui['sel' + t];
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) h += detalheChave(t, +sl, col, nomeFn(+sl), op);
  return h;
}
function pgSoClientes() {
  return hero('Clientes', 'Curvas por distribuidor.', `Quem cresce e quem cai no sell out, ${corteTxt()} de 2026 contra 2025. As redes compradoras estão nas abas.`) + abasClientesSO('clientes') +
    pgSoCurvas('cliso', COL.grp, 'Distribuidor', 'Distribuidor a distribuidor', k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? `${esc(d.uf)} · ${esc(d.executivo)}` : ''; }, 'Clique no nome para abrir a curva e as marcas.');
}
function pgSoExec() {
  return hero('Executivos', 'Curvas por executivo.', `Sell out da carteira de cada executivo, ${corteTxt()} de 2026 contra 2025.`) +
    pgSoCurvas('exeso', COL.executivo, 'Executivo', 'Executivo a executivo', k => tit(dic.executivo[k]), null, 'Clique no nome para abrir a curva, as marcas e os distribuidores.');
}

/* ----- Mês em curso (Order Management, todas as BUs, cada uma contra o seu AR) ----- */
function pgSiMes() {
  const op = {marcas: gMarcas(), segs: gSegs()}, M = omMes();
  const vd = validade();
  let h = hero('Mês em curso', `${isFinite(M) ? MES_LONGO[M - 1][0].toUpperCase() + MES_LONGO[M - 1].slice(1) + ' de 2026' : 'O mês'} no Order Management.`, `Faturado (GIT), carteira, processo de alocação e carteira futura até ${omData()}. NR estimado pelo NR por caixa do segmento no P&L.`) + recorteTxt() + notaL4() +
    (vd && vd.velho ? `<p class="note"><span class="selo warn">${esc(vd.txt)}</span> Os pedidos estão desatualizados: o próximo export do Order Management republica o site sozinho.</p>` : '');
  if (!D.om) return h + '<div class="card"><div class="empty">Sem Order Management nesta versão.</div></div>';
  const t = om1(op), pa = umP('rs', op), arm = isFinite(M) ? v(pa, 2026, M) : NaN, ped = t.nfat + t.ncart;
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g3">` + card('Faturado', n0(t.fat) + ' cx', `<span>${mi(t.nfat)} de NR estimado</span>`) + card('Carteira liberada', n0(t.cart) + ' cx', '<span>pedido sem bloqueio, ainda não faturado</span>') +
    card('Processo de alocação', n0(t.aloc) + ' cx', '<span>pedido em alocação de estoque</span>') + card('Pedido do mês', n0(t.fat + t.cart + t.aloc) + ' cx', `<span>${mi(ped)} entre faturado, carteira e alocação</span>`) +
    card('Carteira bloqueada', n0(t.bloq) + ' cx', `<span>remessa ou crédito travado · ${mi(t.nbloq)} fora da conta</span>`) + card('Carteira futura', n0(t.fut) + ' cx', '<span>pedido com data para frente</span>') + '</div>';
  if (arm > 0) h += `<div class="card"><p class="eyebrow">Contra o AR de ${MES_LONGO[M - 1]} (todas as BUs do recorte)</p><h3>${mi(ped)} entre faturado, carteira liberada e alocação: ${p1(ped / arm)} do AR de ${mi(arm)}. <span>Falta ${mi(Math.max(0, arm - ped))} para 100%. A carteira bloqueada fica fora até liberar.</span></h3>
    <div class="barra lg"><i class="pk" style="width:${Math.min(100, ped / arm * 100).toFixed(1)}%"></i></div></div>`;
  const tab = (rot, chave, nomeFn, extraFn, Mp) => {
    const arPor = Mp ? k => { const a = Mp.get(k); return a ? v(a, 2026, M) : NaN; } : null;
    const G = omSoma({...op, chave});
    if (Mp) for (const k of Mp.keys()) if (!G.has(k) && arPor(k) > 0) G.set(k, {...ZERO_OM});   // AR do mês sem pedido entra com zero (lista de cobrança)
    const L = [...G.entries()].map(([k, o]) => ({k, ...o})).sort((a, b) => (b.fat + b.cart + b.aloc) - (a.fat + a.cart + a.aloc));
    const tot = L.reduce((s, x) => { Object.keys(ZERO_OM).forEach(c => { s[c] += x[c]; }); return s; }, {...ZERO_OM});
    const linha = (x, c) => { const ar = arPor && !c ? arPor(x.k) : arPor ? [...Mp.keys()].reduce((s, k) => s + (arPor(k) || 0), 0) : NaN, pd = x.nfat + x.ncart;
      return `<tr class="${c || ''}"><td class="l b">${c ? 'Total' : nomeFn(x.k)}</td>${extraFn ? `<td class="l">${c ? '' : extraFn(x.k)}</td>` : ''}<td>${n0(x.fat)}</td><td>${n0(x.cart)}</td><td>${n0(x.aloc)}</td><td class="b">${n0(x.fat + x.cart + x.aloc)}</td><td>${n0(x.bloq)}</td><td>${n0(x.fut)}</td><td>${n0(x.nfat)}</td><td class="b">${n0(pd)}</td>` +
        (arPor ? `<td>${n0(zeroNaN(ar))}</td><td>${pctMeta(pd / ar)}</td>` : '') + '</tr>'; };
    return `<div class="tw"><table><thead><tr><th class="l">${rot}</th>${extraFn ? '<th class="l"></th>' : ''}<th>Faturado cx</th><th>Carteira cx</th><th>Alocação cx</th><th>Pedido do mês cx</th><th>Bloqueada cx</th><th>Futura cx</th><th>NR faturado</th><th>NR do pedido</th>${arPor ? `<th>AR ${mes(M)}</th><th>% do AR</th>` : ''}</tr></thead><tbody>` +
      (L.map(x => linha(x)).join('') || `<tr><td colspan="12" class="empty">Nada neste recorte.</td></tr>`) + (L.length ? linha(tot, 'tot') : '') + '</tbody></table></div>';
  };
  const arE = cuboP('rs', {...op, chave: r => r[COL.executivo]}), arG = cuboP('rs', {...op, chave: r => r[COL.grp]}), arMk = cuboP('rs', {...op, chave: r => r[COL.marca]});
  h += `<h2 class="sec">Executivo a executivo. <span>Pedido do mês = faturado + carteira liberada + alocação, contra o AR de todas as BUs.</span></h2><div class="card">${tab('Executivo', l => l[1], k => esc(dic.executivo[k]), null, arE)}</div>`;
  h += `<h2 class="sec">Cliente a cliente. <span>Cliente (grupo) do P&L pelo código Plan to.</span></h2><div class="card">${tab('Cliente', l => l[0], k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? esc(d.executivo) : ''; }, arG)}</div>`;
  h += `<h2 class="sec">Marca a marca. <span>Cada marca contra o seu AR do mês.</span></h2><div class="card">${tab('Marca', l => l[4], k => `<span class="${mkCls(dic.marca[k])}">${tit(dic.marca[k])}</span>`, null, arMk)}</div>`;
  h += `<h2 class="sec">Segmento a segmento. <span>Segmento do Order Management levado para a régua do P&L.</span></h2><div class="card">${tab('Segmento', l => l[4] + '|' + l[5], k => { const [m, g] = k.split('|').map(Number); return `${tit(dic.marca[m])} · ${tit(dic.segmento[g])}`; }, null, null)}</div>`;
  h += `<h2 class="sec">Ponto de entrega. <span>Sold to e UF de cada pedido.</span></h2><div class="card">${tab('Sold to', l => l[12] + '|' + l[13] + '|' + l[0], k => { const [s, u] = k.split('|'); return esc(s) + ' · ' + esc(u); }, k => tit(dic.grp[+k.split('|')[2]]), null)}</div>`;
  return h;
}

/* ======================= Perna MSL Direto: MSL das lojas das contas de atendimento direto (Power BI Execution Report) =======================
   Base (arquivo cifrado): f = [mês, loja, SKU, Target, Compliance] por mês x loja x SKU, só Target > 0; auditorias = dias com auditoria por loja e mês.
   MSL = soma do Compliance / soma do Target, nunca média de %. Leitura oficial na janela de 3 meses (mês vigente e os 2 anteriores), contra a mesma
   janela do ano anterior; a curva mês a mês serve só para tendência. Falta = Target menos Compliance. Patamar do PBI: loja com MSL acima de 65%.
   Nomes de loja, rede, executivo e SKU vêm só do arquivo cifrado: este código só desenha. */
function montarDEX(e) {
  if (!e || !Array.isArray(e.f) || !e.f.length || !Array.isArray(e.lojas) || !Array.isArray(e.skus) || !Array.isArray(e.meses) || !e.meses.length) return null;
  const ok = (r, n, lim) => Array.isArray(r) && r.length >= n && lim.every((x, j) => Number.isInteger(r[j]) && r[j] >= 0 && r[j] < x);
  if (!e.lojas.every(l => l && typeof l === 'object') || !e.skus.every(s => s && typeof s === 'object')
    || !e.f.every(r => ok(r, 5, [e.meses.length, e.lojas.length, e.skus.length]) && r[3] > 0 && r[4] >= 0 && r[4] <= r[3])) return null;   // base fora do formato: a perna sai do site
  const vazio = '(sem dado)', uniq = a => [...new Set(a)].sort((x, y) => String(x).localeCompare(String(y), 'pt-BR'));
  const dic = {}, L = {}, K = {};
  ['bandeira', 'executivo', 'uf', 'canal', 'ambiente'].forEach(k => { const v = e.lojas.map(l => String(l[k] || vazio)); dic[k] = uniq(v); L[k] = v.map(x => dic[k].indexOf(x)); });
  ['marca', 'segmento'].forEach(k => { const v = e.skus.map(s => String(s[k] || vazio)); dic[k] = uniq(v); K[k] = v.map(x => dic[k].indexOf(x)); });
  const segMarca = []; K.segmento.forEach((g, j) => { if (segMarca[g] === undefined) segMarca[g] = K.marca[j]; });   // cada segmento pertence a uma marca
  const meses = e.meses.map(String), fx = e.fonte || {}, tem = new Uint8Array(meses.length);
  e.f.forEach(r => { if (r[3] > 0) tem[r[0]] = 1; });
  const ult = tem.lastIndexOf(1), da = String(fx.dado_ate || '');
  // dias de auditoria: por loja e mês (audN) e, para o filtro de marca e segmento, a máscara dos dias de cada segmento que não foi auditado em todos os dias (audSeg)
  const aud = (Array.isArray(e.auditorias) ? e.auditorias : []).filter(r => ok(r, 3, [meses.length, e.lojas.length, 32])), audN = new Map();
  aud.forEach(([m, l, n]) => audN.set(m * 100000 + l, n));
  const as = e.auditorias_seg, audSeg = as && Array.isArray(as.segs) && Array.isArray(as.f) ? new Map() : null;
  if (audSeg) { const gi = as.segs.map(s => dic.segmento.indexOf(String(s))); as.f.forEach(r => { if (ok(r, 4, [meses.length, e.lojas.length, gi.length, 2 ** 30]) && gi[r[2]] >= 0) audSeg.set((r[0] * 100000 + r[1]) * 1000 + gi[r[2]], r[3]); }); }
  const nNome = new Map(); e.lojas.forEach(l => nNome.set(String(l.nome), (nNome.get(String(l.nome)) || 0) + 1));   // nome de loja repetido na base: a tela mostra o código junto
  return {gerado: DSO.gerado, meses, M: meses.length, tem, parc: meses.indexOf(String(fx.parcial || '')), ateDia: da.length >= 10 ? `${da.slice(8, 10)}/${da.slice(5, 7)}` : '',
    lojas: e.lojas, skus: e.skus, dic, L, K, segMarca, f: e.f, aud, audN, audSeg, nomeDup: e.lojas.map(l => nNome.get(String(l.nome)) > 1),
    vis: e.visitas && Array.isArray(e.visitas.f) && Array.isArray(e.visitas.campos) ? e.visitas : null, fonte: fx,
    corte: +meses[ult >= 0 ? ult : meses.length - 1], ult26: +meses[meses.length - 1],
    rodape: ['Reckitt · Governança CTO · Execução das contas de atendimento direto (MSL das lojas).', `Fonte: ${fx.nome || 'Power BI Execution Report'}${fx.pagina ? ', página ' + fx.pagina : ''}. Uso interno.`]};
}
const EX_CTO = ['VEJA', 'VANISH', 'HARPIC', 'FINISH'], EX_PAT = 0.65 + 1e-9, EZ = {t: 0, c: 0};   // patamar oficial do PBI: loja com MSL acima de 65%
const exEhCTO = nome => EX_CTO.includes(String(nome).toUpperCase());
const exMarcaNome = i => { const m = String(dic.marca[i]); return `<span class="${mkCls(m.toUpperCase())}">${esc(m)}</span>${exEhCTO(m) ? ' <small class="tag" data-xls="fora">CTO</small>' : ''}`; };
const exSegNome = g => `${esc(dic.marca[D.segMarca[g]])} · ${esc(dic.segmento[g])}`;
const exLojaNome = (i, semCod) => esc(D.lojas[i].nome).replace(/_/g, ' · ') + (!semCod && D.nomeDup[i] ? ` <small class="ex-codl">${esc(D.lojas[i].id)}</small>` : '');   // mesmo nome em mais de uma loja: o código junto (tela, slide e Excel)
const exSkuNome = i => esc(D.skus[i].desc || D.skus[i].cod);
const msl = o => (o && o.t > 0 ? o.c / o.t : NaN);
const exRot = i => (i >= 0 && i < D.M ? `${mes(+D.meses[i].slice(4))}/${D.meses[i].slice(2, 4)}${i === D.parc ? '*' : ''}` : '');
const ppTxt = (d, sem) => (isFinite(d) ? `${d >= 0.0005 ? '+' : ''}${nf1.format(Math.abs(d) < 0.0005 ? 0 : d * 100)}${sem ? '' : ' pp'}` : '');
const vppt = d => (isFinite(d) ? `<span class="vr ${cls(d) || 'flat'}">${ppTxt(d)}</span>` : '');   // variação em pp nas tabelas
const n2p = x => (isFinite(x) ? nf2.format(x * 100) + '%' : '');
const pEx = x => (isFinite(x) && Math.abs(x * 100 - 65) < 0.05 ? n2p(x) : p1(x));   // MSL de loja colado no patamar: 65,03% não aparece como 65,0% ao lado do selo Acima de 65%
const exFaixa = m => (!isFinite(m) ? '<span class="vr flat">Sem auditoria na janela</span>' : m > EX_PAT ? '<span class="vr up">Acima de 65%</span>' : m >= 0.5 ? '<span class="vr warn">Entre 50% e 65%</span>' : '<span class="vr down">Abaixo de 50%</span>');
const EXC = {loja: r => r[1], sku: r => r[2], marca: r => D.K.marca[r[2]], segmento: r => D.K.segmento[r[2]],
  bandeira: r => D.L.bandeira[r[1]], executivo: r => D.L.executivo[r[1]], uf: r => D.L.uf[r[1]], canal: r => D.L.canal[r[1]], ambiente: r => D.L.ambiente[r[1]]};

/* recorte: lojas (cliente, executivo, UF, canal, ambiente) e SKUs (marca, segmento)
   Duas formas de base: linhas [mês, loja, SKU, Target, Compliance] (MSL Direto) ou colunas tipadas ordenadas por mês (D.col, MSL Indireto, base grande).
   Na base em colunas, EXF guarda os índices das linhas do recorte e EXFO o início de cada mês; exCada passa ao cálculo uma linha reaproveitada. */
let EXF = [], EXFO = null;
function exFiltrar() {
  if (D.meses.indexOf(String(S.corte)) < 0 || (D.col && !D.tem[D.meses.indexOf(String(S.corte))])) S.corte = D.corte;   // mês vigente fora da base ou sem dado (link antigo): volta ao último mês com dado
  const lk = (D.chavesLoja || ['bandeira', 'executivo', 'uf', 'canal', 'ambiente']).filter(k => S.f[k] && S.f[k].size);
  const okL = D.lojas.map((_, i) => lk.every(k => S.f[k].has(D.L[k][i])));
  const okS = D.skus.map((_, i) => (!S.f.marca.size || S.f.marca.has(D.K.marca[i])) && (!S.f.segmento.size || S.f.segmento.has(D.K.segmento[i])));
  if (!D.col) { EXF = D.f.filter(r => okL[r[1]] && okS[r[2]]); EXFO = null; return; }
  const C = D.col, n = C.m.length, ix = new Int32Array(n); let p = 0;
  for (let j = 0; j < n; j++) if (okL[C.l[j]] && okS[C.k[j]]) ix[p++] = j;
  EXF = ix.subarray(0, p); EXFO = new Int32Array(D.M + 1);
  for (let i = 0, q = 0; i <= D.M; i++) { while (q < p && C.m[EXF[q]] < i) q++; EXFO[i] = q; }
}
function exCada(idx, fn) {   // percorre as linhas do recorte nos meses idx (null = todos) e chama fn(linha); a linha não pode ser guardada
  if (!D.col) {
    if (!idx) { for (const r of EXF) fn(r); return; }
    const ms = new Uint8Array(D.M); idx.forEach(i => { if (i >= 0 && i < D.M) ms[i] = 1; });
    for (const r of EXF) if (ms[r[0]]) fn(r);
    return;
  }
  const C = D.col, r = [0, 0, 0, 0, 0, 0], R5 = C.r || null;   // r[5]: SKU em risco (só está na janela pela compra do mês mais antigo)
  const faixa = (a, b) => { for (let p = a; p < b; p++) { const j = EXF[p]; r[0] = C.m[j]; r[1] = C.l[j]; r[2] = C.k[j]; r[3] = C.t[j]; r[4] = C.c[j]; r[5] = R5 ? R5[j] : 0; fn(r); } };
  if (!idx) { faixa(0, EXF.length); return; }
  [...new Set(idx)].filter(i => i >= 0 && i < D.M).sort((a, b) => a - b).forEach(i => faixa(EXFO[i], EXFO[i + 1]));
}
function exOpcoes(k) {
  let ids = dic[k].map((_, i) => i);
  if (k === 'segmento') { const mk = gMarcas(); ids = ids.filter(g => !mk || mk.has(D.segMarca[g])); }
  return ids.sort((a, b) => String(dic[k][a]).localeCompare(String(dic[k][b]), 'pt-BR'));
}
function exFaixaTxt(L) {   // "ago a out/26*", "dez/25 a fev/26" ou "out/26*"
  if (!L.length) return '';
  const a = L[0], b = L[L.length - 1];
  if (a === b) return exRot(a);
  return `${D.meses[a].slice(0, 4) === D.meses[b].slice(0, 4) ? mes(+D.meses[a].slice(4)) : exRot(a)} a ${exRot(b)}`;
}
function exJanela() {   // mês vigente e os 2 anteriores; comparação = os mesmos meses do ano anterior; ano = jan até o mês vigente
  let v = D.meses.indexOf(String(S.corte)); if (v < 0) v = D.meses.indexOf(String(D.corte));
  const Y = +D.meses[v].slice(0, 4), menos1 = i => D.meses.indexOf(`${+D.meses[i].slice(0, 4) - 1}${D.meses[i].slice(4)}`);
  const idx = [v - 2, v - 1, v].filter(i => i >= 0), antT = idx.map(menos1), ant = antT.filter(i => i >= 0);
  const anoI = D.meses.map((_, i) => i).filter(i => +D.meses[i].slice(0, 4) === Y && i <= v), anoAT = anoI.map(menos1), anoAnt = anoAT.filter(i => i >= 0);
  const temAnt = ant.length === idx.length && ant.some(i => D.tem[i]), temAnoAnt = anoAnt.length === anoI.length && anoAnt.some(i => D.tem[i]);
  const temY0 = D.meses.some((m, i) => +m.slice(0, 4) === Y - 1 && D.tem[i]);   // a base tem algum mês do ano anterior (mês vigente em 2025: não tem 2024)
  return {v, Y, idx, ant, temAnt, ano: anoI, anoAnt, temAnoAnt, temY0, parc: idx.includes(D.parc), a5: String(Y - 1).slice(2), a6: String(Y).slice(2),
    txt: exFaixaTxt(idx), antTxt: temAnt ? exFaixaTxt(ant) : String(Y - 1), anoTxt: exFaixaTxt(anoI), anoAntTxt: temAnoAnt ? exFaixaTxt(anoAnt) : String(Y - 1)};
}
const exSeletorMes = () => `<label class="cut">Mês vigente <select data-act="corte" title="Muda a janela de 3 meses do site inteiro">${D.meses.map((m, i) => `<option value="${m}" ${+m === +S.corte ? 'selected' : ''}${MODO === 'mi' && !D.tem[i] ? ' disabled' : ''}>${exRot(i).replace('*', '')}${i === D.parc ? ' (parcial)' : !D.tem[i] ? (MODO === 'mi' ? ' (sem dado)' : ' (sem auditoria)') : ''}</option>`).join('')}</select></label>`;

/* motor: somas de Target e Compliance */
function exSoma(idx, chave, sub) {   // Map chave -> {t, c} nos meses idx
  const out = new Map();
  exCada(idx, r => {
    if (sub && !sub(r)) return;
    const k = chave ? chave(r) : '_'; let o = out.get(k); if (!o) out.set(k, o = {t: 0, c: 0});
    o.t += r[3]; o.c += r[4];
  });
  return out;
}
const exUm = (idx, sub) => exSoma(idx, null, sub).get('_') || EZ;
function exMeses(chave, sub) {   // Map chave -> {t, c} mês a mês (um valor por mês da base)
  const out = new Map();
  exCada(null, r => {
    if (sub && !sub(r)) return;
    const k = chave ? chave(r) : '_'; let o = out.get(k); if (!o) out.set(k, o = {t: new Float64Array(D.M), c: new Float64Array(D.M)});
    o.t[r[0]] += r[3]; o.c[r[0]] += r[4];
  });
  return out;
}
const exSerie = sub => exMeses(null, sub).get('_') || {t: new Float64Array(D.M), c: new Float64Array(D.M)};
const exFiltroSku = () => !!(S.f.marca.size || S.f.segmento.size);
function exAudPor(idx, sub) {   // dias de auditoria por loja nos meses idx; com filtro de marca ou segmento (ou sub), só os dias em que algum SKU do recorte foi auditado
  const ms = new Set(idx), out = new Map();
  if ((!exFiltroSku() && !sub) || !D.audSeg) { for (const [m, l, n] of D.aud) if (ms.has(m)) out.set(l, (out.get(l) || 0) + n); return out; }
  const mk = new Map();   // mês x loja -> dias (bit j = j-ésimo dia de auditoria da loja no mês) dos segmentos do recorte; segmento sem máscara = todos os dias
  exCada(idx, r => {
    if (sub && !sub(r)) return;
    const k = r[0] * 100000 + r[1], x = D.audSeg.get(k * 1000 + D.K.segmento[r[2]]);
    mk.set(k, (mk.get(k) || 0) | (x === undefined ? 2 ** (D.audN.get(k) || 0) - 1 : x));
  });
  mk.forEach((m, k) => { let c = 0; for (let b = m; b; b &= b - 1) c++; const l = k % 100000; out.set(l, (out.get(l) || 0) + c); });
  return out;
}
function exLinhas(J, chave, sub) {   // uma linha por chave: janela e mesma janela do ano anterior, variação em pp, faltas, peso nas faltas e impacto no MSL total
  const A = exSoma(J.idx, chave, sub), B = J.temAnt ? exSoma(J.ant, chave, sub) : new Map();
  let tt = 0, tc = 0; A.forEach(o => { tt += o.t; tc += o.c; });
  const mt = tt > 0 ? tc / tt : NaN, ft = tt - tc;
  return [...new Set([...A.keys(), ...B.keys()])].map(k => {
    const a = A.get(k) || EZ, b = B.get(k) || EZ, m = msl(a), mb = msl(b);
    return {k, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.t - a.c : NaN, peso: ft > 0 && a.t > 0 ? (a.t - a.c) / ft : NaN, imp: tt > 0 && a.t > 0 ? (a.c - mt * a.t) / tt : NaN};
  });
}
function exTotal(L) {
  const a = {t: 0, c: 0}, b = {t: 0, c: 0}; L.forEach(x => { a.t += x.a.t; a.c += x.a.c; b.t += x.b.t; b.c += x.b.c; });
  const m = msl(a), mb = msl(b); return {k: -1, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.t - a.c : NaN, peso: a.t - a.c > 0 ? 1 : NaN, imp: NaN};
}
const ZL = () => ({n: 0, acima: 0, aud: 0, nb: 0, acimab: 0, audb: 0});
function exLojasPor(J, gk, sub) {   // por grupo de loja: lojas auditadas, lojas acima de 65% e dias de auditoria, na janela e na mesma janela do ano anterior
  const A = exSoma(J.idx, EXC.loja, sub), B = J.temAnt ? exSoma(J.ant, EXC.loja, sub) : new Map(), UA = exAudPor(J.idx, sub), UB = exAudPor(J.ant, sub);
  const out = new Map(), g = k => { let o = out.get(k); if (!o) out.set(k, o = ZL()); return o; };
  A.forEach((o, l) => { if (!(o.t > 0)) return; const x = g(gk(l)); x.n++; if (o.c / o.t > EX_PAT) x.acima++; x.aud += UA.get(l) || 0; });
  B.forEach((o, l) => { if (!(o.t > 0)) return; const x = g(gk(l)); x.nb++; if (o.c / o.t > EX_PAT) x.acimab++; x.audb += UB.get(l) || 0; });
  return out;
}
function exResumo(J, sub) {   // os números da janela no recorte (e numa rede, executivo ou loja, com sub)
  const a = exUm(J.idx, sub), b = J.temAnt ? exUm(J.ant, sub) : EZ, lj = exLojasPor(J, () => '_', sub).get('_') || ZL();
  const y = exUm(J.ano, sub), yb = J.temAnoAnt ? exUm(J.anoAnt, sub) : EZ;
  return {a, b, m: msl(a), mb: msl(b), d: msl(a) - msl(b), f: a.t - a.c, fb: J.temAnt ? b.t - b.c : NaN, n: lj.n, nb: J.temAnt ? lj.nb : NaN, acima: lj.acima, acimab: lj.acimab,
    pa: lj.n ? lj.acima / lj.n : NaN, pb: J.temAnt && lj.nb ? lj.acimab / lj.nb : NaN, aud: lj.aud, audb: J.temAnt ? lj.audb : NaN, my: msl(y), myb: msl(yb)};
}
function exLojasSku(J, sub) {   // por SKU: lojas auditadas e lojas onde faltou na janela
  const A = exSoma(J.idx, r => r[2] * 10000 + r[1], sub), out = new Map();
  A.forEach((o, k) => { if (!(o.t > 0)) return; const s = Math.floor(k / 10000); let x = out.get(s); if (!x) out.set(s, x = {aud: 0, falta: 0}); x.aud++; if (o.t - o.c > 0) x.falta++; });
  return out;
}
function exOrdemMarcas(L) {   // as 4 marcas do CTO primeiro (Veja, Vanish, Harpic, Finish), depois as demais pelo Target da janela
  const p = x => { const i = EX_CTO.indexOf(String(dic.marca[x.k]).toUpperCase()); return i < 0 ? 9 : i; };
  return L.sort((a, b) => p(a) - p(b) || b.a.t - a.a.t || b.b.t - a.b.t);
}

/* componentes */
function exKpis(R, J, quais) {
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${d}<span>${sub}</span></div></div>`;
  const ant = J.antTxt, neutro = x => (isFinite(x) ? `<span class="vbig flat">${pc(x)}</span>` : ''), pv = x => (isFinite(x) ? p1(x) : 'sem dado'), pm = x => (isFinite(x) ? pEx(x) : 'sem dado');
  const C = [
    () => card(`MSL · ${esc(J.txt)}`, pm(R.m), vpp(R.d), J.temAnt && isFinite(R.mb) ? `contra ${p1(R.mb)} em ${esc(ant)}` : 'sem a mesma janela no ano anterior'),
    () => card('Lojas acima de 65%', pv(R.pa), vpp(R.pa - R.pb), `${n0(R.acima)} de ${n0(R.n)} lojas auditadas${J.temAnt && isFinite(R.pb) ? ` · ${p1(R.pb)} em ${esc(ant)}` : ''}`),
    () => card('Lojas auditadas', n0(R.n), vbig(varr(R.n, R.nb)), J.temAnt ? `contra ${n0(R.nb)} em ${esc(ant)}` : 'na janela'),
    () => card('Auditorias', n0(R.aud), vbig(varr(R.aud, R.audb)), `${exFiltroSku() ? 'dias em que a marca ou o segmento do recorte foi auditado' : 'dias de auditoria'}, somados loja a loja${J.temAnt ? `, contra ${n0(R.audb)}` : ''}`),
    () => card('Faltas', n0(R.f), neutro(varr(R.f, R.fb)), `SKUs do MSL não encontrados na loja${J.temAnt ? ` · ${n0(R.fb)} em ${esc(ant)}` : ''}`),
    () => card(`MSL no ano · ${esc(J.anoTxt)}`, pv(R.my), vpp(R.my - R.myb), J.temAnoAnt && isFinite(R.myb) ? `contra ${p1(R.myb)} em ${esc(J.anoAntTxt)}` : 'sem o mesmo período no ano anterior')];
  const q = quais || [0, 1, 2, 3, 4, 5];
  return `<div class="grid ${q.length === 4 ? 'g4' : 'g3'}">${q.map(i => C[i]()).join('')}</div>`;
}
function exCurva(o, J, alto = SLIDE ? 330 : 240) {   // MSL % mês a mês: ano anterior cinza, ano do mês vigente rosa; a janela sombreada; eixo justo nos dados
  const Y = J.Y, W = Math.round(Math.max(240, Math.min(1180, larguraCard()))), H = alto;
  const val = (y, m) => { const i = D.meses.indexOf(`${y}${String(m).padStart(2, '0')}`); return i >= 0 && i <= J.v && o.t[i] > 0 ? o.c[i] / o.t[i] : NaN; };
  const s0 = [], s1 = [];
  for (let m = 1; m <= 12; m++) { s0.push(val(Y - 1, m)); s1.push(val(Y, m)); }
  const xs = [...s0, ...s1].filter(isFinite).map(x => x * 100), tem0 = s0.some(isFinite), temVar = s0.some((a, j) => isFinite(a) && isFinite(s1[j]));
  if (!xs.length) return `<div class="empty">${MODO === 'mi' || MODO === 'ni' ? 'Sem dado neste recorte.' : 'Sem auditoria neste recorte.'}</div>`;
  const pl = 40, pr = 12, pt = 24, gw = (W - pl - pr) / 12, comVal = gw >= 40, comVar = gw >= 46, pb = comVar ? 50 : 28;
  const lo = Math.min(...xs), hi = Math.max(...xs), folga = Math.max(2, (hi - lo) * 0.15);
  let y0 = Math.max(0, Math.floor((lo - folga) / 5) * 5); const y1 = Math.min(100, Math.ceil((hi + folga) / 5) * 5); if (y1 - y0 < 10) y0 = Math.max(0, y1 - 10);
  const passo = y1 - y0 > 40 ? 20 : y1 - y0 > 20 ? 10 : 5, px = m => pl + (m - 0.5) * gw, py = x => pt + (y1 - x * 100) / (y1 - y0) * (H - pt - pb);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MODO === 'ni' ? 'Share' : 'MSL'} ${tem0 ? `${Y - 1} e ` : ''}${Y} por mês">`;
  const jm = J.idx.filter(i => +D.meses[i].slice(0, 4) === Y).map(i => +D.meses[i].slice(4));
  if (jm.length) s += `<rect x="${(pl + (Math.min(...jm) - 1) * gw + 2).toFixed(1)}" y="${pt - 18}" width="${((Math.max(...jm) - Math.min(...jm) + 1) * gw - 4).toFixed(1)}" height="${(H - pb - pt + 18).toFixed(1)}" rx="10" fill="#F5F5F7"/>`;
  for (let g = y0; g <= y1 + 1e-9; g += passo) { const y = py(g / 100).toFixed(1); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#ECECEF"/><text x="${pl - 6}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#86868B">${g}%</text>`; }
  const trechos = (L, ok) => { const out = []; let cur = []; L.forEach((x, j) => { if (isFinite(x) && ok(j + 1)) cur.push([j + 1, x]); else { if (cur.length) out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out; };
  const poly = (pts, cor, w, extra = '') => (pts.length > 1 ? `<polyline points="${pts.map(([m, x]) => px(m).toFixed(1) + ',' + py(x).toFixed(1)).join(' ')}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>` : '');
  trechos(s0, () => true).forEach(p => { s += poly(p, '#D2D2D7', 2.5); });
  s0.forEach((x, j) => { if (isFinite(x)) s += `<circle cx="${px(j + 1).toFixed(1)}" cy="${py(x).toFixed(1)}" r="3" fill="#D2D2D7"/>`; });
  const pm = D.parc >= 0 && D.parc <= J.v && +D.meses[D.parc].slice(0, 4) === Y ? +D.meses[D.parc].slice(4) : 0;   // mês parcial no ano rosa: ponto vazado, ligado por tracejado
  trechos(s1, m => m !== pm).forEach(p => { s += poly(p, '#FF007F', 3); });
  if (pm > 1 && isFinite(s1[pm - 1]) && isFinite(s1[pm - 2])) s += poly([[pm - 1, s1[pm - 2]], [pm, s1[pm - 1]]], '#FF007F', 2, 'stroke-dasharray="4 4"');
  s1.forEach((x, j) => {
    if (!isFinite(x)) return; const m = j + 1, cx = px(m).toFixed(1), cy = py(x).toFixed(1);
    s += m === pm ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#FFFFFF" stroke="#FF007F" stroke-width="2"/>` : `<circle cx="${cx}" cy="${cy}" r="4" fill="#FF007F"/>`;
    if (comVal) s += `<text class="vl" x="${cx}" y="${(+cy - 10).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="#1D1D1F">${nf1.format(x * 100)}</text>`;
  });
  for (let m = 1; m <= 12; m++) {
    const x0 = px(m).toFixed(1), a = s0[m - 1], b = s1[m - 1], d = b - a, parc = m === pm;
    s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]}${parc ? '*' : ''}</text>`;
    if (comVar && isFinite(d)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${parc || Math.abs(d) < 0.0005 ? '#6E6E73' : d > 0 ? '#1D7A34' : '#D70015'}">${ppTxt(d, true)}</text>`;
    const tt = `<b>${MESES[m - 1]}${parc ? '*' : ''}</b> · ${tem0 ? `${Y - 1}: ${isFinite(a) ? p1(a) : 'sem dado'} · ` : ''}${Y}${parc ? ` parcial até ${D.ateDia}` : ''}: ${isFinite(b) ? p1(b) : 'sem dado'}${isFinite(d) ? ' · ' + ppTxt(d) : ''}`;
    s += `<rect x="${(pl + (m - 1) * gw).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent" data-tip="${esc(tt)}"/>`;
  }
  return s + `</svg><div class="legend">${tem0 ? `<span><i style="background:#D2D2D7"></i>${Y - 1}</span>` : ''}<span><i style="background:#FF007F"></i>${Y} até ${esc(exRot(J.v))}</span>` +
    (jm.length ? `<span><i style="background:#F5F5F7;box-shadow:inset 0 0 0 1px #D2D2D7"></i>Janela ${esc(J.txt)}</span>` : '') + (comVar && temVar ? '<span>Embaixo, a variação contra o ano anterior em pp</span>' : '') +
    (pm ? `<span class="parc-nota">* ${esc(exRot(D.parc).replace('*', ''))} parcial até ${esc(D.ateDia)}.</span>` : '') + '</div>';
}
function exSpark(o, J) {   // curva do ano numa linha: ano anterior cinza, ano do mês vigente rosa (MSL %)
  if (!o) return '';
  const W = 132, H = 34, Y = J.Y, px = m => 4 + (m - 1) * (W - 8) / 11;
  const val = (y, m) => { const i = D.meses.indexOf(`${y}${String(m).padStart(2, '0')}`); return i >= 0 && i <= J.v && o.t[i] > 0 ? o.c[i] / o.t[i] : NaN; };
  const q0 = [], q1 = [];
  for (let m = 1; m <= 12; m++) { const a = val(Y - 1, m), b = val(Y, m); if (isFinite(a)) q0.push([m, a]); if (isFinite(b)) q1.push([m, b]); }
  const xs = [...q0, ...q1].map(p => p[1]); if (!xs.length) return '';
  let lo = Math.min(...xs), hi = Math.max(...xs); if (hi - lo < 0.06) { const c = (hi + lo) / 2; lo = c - 0.03; hi = c + 0.03; }
  const py = x => (H - 3 - (x - lo) / (hi - lo) * (H - 6)).toFixed(1);
  const linha = (pts, cor) => (pts.length > 1 ? `<polyline points="${pts.map(([m, x]) => px(m).toFixed(1) + ',' + py(x)).join(' ')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
    : pts.length ? `<circle cx="${px(pts[0][0]).toFixed(1)}" cy="${py(pts[0][1])}" r="2.5" fill="${cor}"/>` : '');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${linha(q0, '#D2D2D7')}${linha(q1, '#FF007F')}</svg>`;
}
function exConclusao(L, nomeFn, J, plural) {   // a parte cinza do título: quantas sobem e caem e quem mais cai (ou o maior e o menor MSL, sem o ano anterior)
  const comp = L.filter(x => x.a.t > 0 && x.b.t > 0 && isFinite(x.d)), aud = L.filter(x => x.a.t > 0);
  if (!aud.length) return `Sem auditoria na janela ${esc(J.txt)}.`;
  if (J.temAnt && comp.length) {
    const c = {up: 0, flat: 0, down: 0}; comp.forEach(x => { c[x.d >= 0.01 ? 'up' : x.d <= -0.01 ? 'down' : 'flat']++; });
    const p = [c.up ? `${c.up} ${c.up > 1 ? 'sobem' : 'sobe'}` : '', c.flat ? `${c.flat} ${c.flat > 1 ? 'ficam estáveis' : 'fica estável'}` : '', c.down ? `${c.down} ${c.down > 1 ? 'caem' : 'cai'}` : ''].filter(Boolean);
    const termo = p.length > 1 ? p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1] : p[0];
    const pior = comp.reduce((a, b) => (b.d < a.d ? b : a)), melhor = comp.reduce((a, b) => (b.d > a.d ? b : a));
    if (comp.length === 1) return `${nomeFn(pior.k)} ${pior.d >= 0.01 ? 'sobe' : pior.d <= -0.01 ? 'cai' : 'fica estável'} (${ppTxt(pior.d)}, ${p1(pior.m)}).`;
    return `${termo}; ` + (pior.d <= -0.005 ? `${nomeFn(pior.k)} é a maior queda (${ppTxt(pior.d)}, ${p1(pior.m)}).` : `${nomeFn(melhor.k)} é a maior alta (${ppTxt(melhor.d)}, ${p1(melhor.m)}).`);
  }
  const mx = aud.reduce((a, b) => (b.m > a.m ? b : a)), mn = aud.reduce((a, b) => (b.m < a.m ? b : a));
  return aud.length === 1 ? `${nomeFn(mx.k)} com ${p1(mx.m)}.` : `${n0(aud.length)} ${plural} auditadas; ${nomeFn(mx.k)} tem o maior MSL (${p1(mx.m)}) e ${nomeFn(mn.k)} o menor (${p1(mn.m)}).`;
}
const exTermo = ds => { const c = {up: 0, flat: 0, down: 0}; ds.forEach(d => { if (isFinite(d)) c[d >= 0.01 ? 'up' : d <= -0.01 ? 'down' : 'flat']++; });
  return `<div class="termo"><span class="vbig up">▲ ${c.up} sobem</span><span class="vbig flat">● ${c.flat} estáveis</span><span class="vbig down">▼ ${c.down} caem</span></div>`; };
function exTabela(t, linhas, colunas, opc = {}) {   // colunas: {c: cabeçalho, v: valor para ordenar, h: célula, t: total (true = mesma célula), l: à esquerda, b: negrito, k: classe, oc: fica fora do slide}
  if (S.ui['sort' + t] || opc.padrao !== undefined) ordena(linhas, t, colunas.map(c => c.v || (() => 0)), opc.padrao);
  const cl = c => [c.l ? 'l' : '', c.b ? 'b' : '', c.k || '', c.oc ? 'ex-oc' : ''].filter(Boolean).join(' '), ch = c => [c.l ? 'l' : '', c.oc ? 'ex-oc' : ''].filter(Boolean).join(' ');
  const th = colunas.map((c, i) => (c.v ? thSort(t, i, c.c, ch(c)) : `<th class="${ch(c)}">${c.c}</th>`)).join('');
  const tr = x => `<tr class="${opc.on && opc.on(x) ? 'on' : ''}">${colunas.map(c => `<td class="${cl(c)}">${c.h(x)}</td>`).join('')}</tr>`;
  const tot = opc.tot ? `<tr class="tot">${colunas.map(c => `<td class="${ch(c)}">${c.t === true ? c.h(opc.tot) : c.t ? c.t(opc.tot) : ''}</td>`).join('')}</tr>` : '';
  return `<div class="tw"><table><thead><tr>${th}</tr></thead><tbody>${linhas.map(tr).join('') || `<tr><td colspan="${colunas.length}" class="empty">Nada neste recorte.</td></tr>`}${linhas.length ? tot : ''}</tbody></table></div>`;
}
function exTabJanela(t, rot, L, nomeFn, J, opc = {}) {   // janela x mesma janela do ano anterior; opc: sel (abre o item), spark (Map mês a mês), lojas (Map do exLojasPor), extra, extraCedo (logo depois do Δ pp), curvaCedo, compacto, semContagem
  const tot = exTotal(L), lj = opc.lojas || null, sel = opc.sel ? String(S.ui[opc.sel] ?? '') : null;
  if (lj) { L.forEach(x => { x.lj = lj.get(x.k) || ZL(); }); tot.lj = ZL(); L.forEach(x => Object.keys(tot.lj).forEach(c => { tot.lj[c] += x.lj[c]; })); }
  const sem = s => semAcento(String(s).replace(/<[^>]+>/g, ''));
  // ordem: o MSL primeiro (no celular é o que aparece sem rolar a tabela), depois faltas, lojas, a curva e as contagens
  const cols = [{c: rot, v: x => sem(nomeFn(x.k)), l: true, b: true, t: () => 'Total',
    h: x => (opc.sel ? `<button class="lnk" data-act="ui" data-k="${opc.sel}" data-v="${String(x.k) === sel ? '' : x.k}">${nomeFn(x.k)}</button>` : nomeFn(x.k))},
    {c: `MSL ${J.a5}`, v: x => x.mb, h: x => p1(x.mb), t: true}, {c: `MSL ${J.a6}`, v: x => x.m, h: x => p1(x.m), b: true, t: true}, {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d), t: true}];
  const curva = {c: `Curva ${J.a5} · ${J.a6}`, h: x => exSpark(opc.spark.get(x.k), J), oc: true};
  if (opc.spark && opc.curvaCedo) cols.push(curva);   // a curva que a página anuncia fica na área visível em 1280 px
  cols.push(...(opc.extraCedo || []), {c: `Faltas ${J.a6}`, v: x => x.f, h: x => n0(x.f), t: true}, {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true});
  if (!opc.compacto) cols.push({c: 'Impacto no MSL', v: x => x.imp, h: x => vppt(x.imp)});
  if (lj) {
    const pa = o => (o.n ? o.acima / o.n : NaN), pb = o => (o.nb ? o.acimab / o.nb : NaN);
    cols.push({c: 'Lojas', v: x => x.lj.n, h: x => n0(x.lj.n), t: x => n0(x.lj.n)}, {c: 'Acima de 65%', v: x => x.lj.acima, h: x => n0(x.lj.acima), t: x => n0(x.lj.acima)},
      {c: `% acima ${J.a6}`, v: x => pa(x.lj), h: x => p1(pa(x.lj)), t: x => p1(pa(x.lj))}, {c: `% acima ${J.a5}`, v: x => pb(x.lj), h: x => p1(pb(x.lj)), t: x => p1(pb(x.lj))},
      {c: 'Auditorias', v: x => x.lj.aud, h: x => n0(x.lj.aud), t: x => n0(x.lj.aud)});
  }
  if (opc.spark && !opc.curvaCedo) cols.push(curva);
  if (!opc.compacto && !opc.semContagem) cols.push({c: `Target ${J.a5}`, v: x => x.b.t, h: x => (x.b.t ? n0(x.b.t) : ''), t: true, oc: true}, {c: `Compl. ${J.a5}`, v: x => x.b.c, h: x => (x.b.t ? n0(x.b.c) : ''), t: true, oc: true},
    {c: `Target ${J.a6}`, v: x => x.a.t, h: x => (x.a.t ? n0(x.a.t) : ''), t: true, oc: true}, {c: `Compl. ${J.a6}`, v: x => x.a.c, h: x => (x.a.t ? n0(x.a.c) : ''), t: true, oc: true});
  cols.push(...(opc.extra || []));
  return exTabela(t, L, cols, {tot, padrao: opc.padrao, on: opc.sel ? x => String(x.k) === sel : null});
}
function exTabMeses(rot, keys, nomeFn, Mp, J, med = 'msl') {   // matriz item x mês: ano anterior e ano do mês vigente, até o mês vigente
  const Y = J.Y, idx = [];
  for (const y of [Y - 1, Y]) for (let m = 1; m <= 12; m++) { const i = D.meses.indexOf(`${y}${String(m).padStart(2, '0')}`); if (i >= 0 && i <= J.v) idx.push(i); }
  const cel = (t_, c_) => (!(t_ > 0) ? '' : med === 'falta' ? n0(t_ - c_) : med === 'target' ? n0(t_) : p1(c_ / t_));
  const ks = keys.filter(k => Mp.has(k)), tt = new Float64Array(D.M), tc = new Float64Array(D.M);
  ks.forEach(k => { const o = Mp.get(k); idx.forEach(i => { tt[i] += o.t[i]; tc[i] += o.c[i]; }); });
  const jn = new Set(J.idx), linha = (nome, a, b, c) => `<tr class="${c || ''}"><td class="l b">${nome}</td>${idx.map(i => `<td class="${jn.has(i) ? 'b' : ''}">${cel(a[i], b[i])}</td>`).join('')}</tr>`;
  if (!ks.length) return '<div class="empty">Nada neste recorte.</div>';
  return `<div class="tw fim"><table><thead><tr><th class="l">${rot}</th>${idx.map(i => `<th>${exRot(i)}</th>`).join('')}</tr></thead><tbody>` +
    ks.map(k => linha(nomeFn(k), Mp.get(k).t, Mp.get(k).c)).join('') + linha('Total', tt, tc, 'tot') + '</tbody></table></div>';
}
const exSegMM = () => { const med = S.ui.exmm || 'msl'; return `<div class="seg">${[['msl', 'MSL %'], ['falta', 'Faltas'], ['target', 'Target']].map(([k, n]) => `<button data-act="ui" data-k="exmm" data-v="${k}" class="${k === med ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
const exNotaMM = () => `<p class="note" style="margin:10px 0 0">Mês a mês só para tendência; em negrito, os meses da janela. ${S.ui.exmm === 'falta' ? 'Faltas = Target menos Compliance.' : S.ui.exmm === 'target' ? 'Target = SKUs do MSL auditados na loja (contagem).' : 'MSL = Compliance sobre Target do mês.'}</p>`;
function exTabLojas(t, J, sub, opc = {}) {   // loja a loja: MSL da janela contra a própria loja no ano anterior
  const A = exSoma(J.idx, EXC.loja, sub), B = J.temAnt ? exSoma(J.ant, EXC.loja, sub) : new Map(), AU = exAudPor(J.idx, sub), Mm = exMeses(EXC.loja, sub);
  let L = [...new Set([...A.keys(), ...B.keys()])].map(k => { const a = A.get(k) || EZ, b = B.get(k) || EZ, m = msl(a), mb = msl(b);
    return {k, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.t - a.c : NaN, aud: a.t > 0 ? AU.get(k) || 0 : NaN}; }).filter(x => x.a.t > 0 || x.b.t > 0);
  const q = semAcento(String(opc.busca || '').trim());
  if (q) L = L.filter(x => { const l = D.lojas[x.k]; return semAcento([l.nome, l.id, l.cidade, l.bandeira, l.uf, l.executivo].join(' ')).includes(q); });
  const lj = x => D.lojas[x.k], sel = String(S.ui.selloja ?? ''), aqui = (opc.link || 'ui') === 'ui';
  const tot = exTotal(L); tot.aud = L.reduce((s, x) => s + (isFinite(x.aud) ? x.aud : 0), 0);
  const cols = [
    {c: 'Loja', v: x => semAcento(lj(x).nome), l: true, b: true, k: 'nm', t: () => `Total · ${n0(L.filter(x => x.a.t > 0).length)} lojas auditadas`,
      h: x => (aqui ? `<button class="lnk" data-act="ui" data-k="selloja" data-v="${String(x.k) === sel ? '' : x.k}">${exLojaNome(x.k)}</button>`
        : `<button class="lnk" data-act="exir" data-pg="ex-lojas" data-k="selloja" data-v="${x.k}">${exLojaNome(x.k)}</button>`)},
    {c: `MSL ${J.a6}`, v: x => x.m, h: x => pEx(x.m), b: true, t: true}, {c: `MSL ${J.a5}`, v: x => x.mb, h: x => pEx(x.mb), t: true}, {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d), t: true},
    {c: 'Faixa', v: x => x.m, l: true, h: x => exFaixa(x.m)}, {c: 'Auditorias', v: x => x.aud, h: x => n0(x.aud), t: true}, {c: `Faltas ${J.a6}`, v: x => x.f, h: x => n0(x.f), t: true},
    ...(opc.semRede ? [] : [{c: 'Cliente', v: x => lj(x).bandeira, l: true, h: x => esc(lj(x).bandeira)}]),
    ...(opc.semExec ? [] : [{c: 'Executivo', v: x => lj(x).executivo, l: true, h: x => esc(lj(x).executivo)}]),
    {c: 'UF', v: x => lj(x).uf, l: true, h: x => esc(lj(x).uf)}, {c: 'Cidade', v: x => lj(x).cidade, l: true, h: x => esc(lj(x).cidade), oc: true},
    {c: 'Ambiente', v: x => lj(x).ambiente, l: true, h: x => esc(lj(x).ambiente), oc: true},
    {c: `Curva ${J.a5} · ${J.a6}`, h: x => exSpark(Mm.get(x.k), J), oc: true}, {c: 'Código', v: x => lj(x).id, l: true, k: 'ex-cod', h: x => esc(lj(x).id), oc: true}];
  return exTabela(t, L, cols, {tot, padrao: '-' + cols.findIndex(c => c.c === `MSL ${J.a6}`), on: aqui ? x => String(x.k) === sel : null}) +
    `<p class="note" style="margin:10px 0 0">${aqui ? 'Clique no nome para abrir a loja; no título da coluna, para ordenar.' : 'Clique no nome para abrir a loja na página Lojas.'} Loja sem auditoria na janela aparece no fim, com o MSL do ano anterior.</p>`;
}
function exRolarDet(k, v) {   // depois de abrir a página: leva até o item aberto
  if (!String(k).startsWith('sel') || v === '' || v === undefined) return;
  const d = document.querySelector('#app .det'); if (!d) return;
  const off = document.querySelector('.gnav').offsetHeight + document.querySelector('.fbar').offsetHeight + 12;
  scrollTo({top: d.getBoundingClientRect().top + scrollY - off});
}
const exSelValido = (k, L) => { const s = S.ui[k]; return s !== undefined && s !== '' && L.some(x => String(x.k) === String(s)) ? +s : null; };

/* data da fonte (o mesmo selo "Dados de" das outras pernas) */
const fontesEx = () => [fonte('execucao')].filter(Boolean);
function validadeEx() {
  const f = fonte('execucao');
  if (!f) return {velho: false, parcial: D.parc === D.M - 1, txt: `Execução até ${exRot(D.M - 1).replace('*', '')}`};
  const velho = fechadoFonte(f) < mesEsperado();
  return {velho, parcial: !!f.parcial, txt: `Execução até ${f.ate_txt}${f.parcial ? ` · parcial até ${String(f.ate_dia).slice(0, 5)}` : ''}${f.extraido ? ` · PBI de ${f.extraido.slice(0, 5)}` : ''}${velho ? ` · ${faltaFonte(f).toLowerCase()}` : ''}`};
}
const topoEx = () => { const f = fonte('execucao'); return ['MSL Direto', f && f.extraido ? `${f.nome} de ${f.extraido.slice(0, 5)}` : '', `site de ${DSO.gerado.slice(0, 5)}`].filter(Boolean).join(' · '); };
function exNotaParcial() {
  const J = exJanela();
  return J.parc && D.parc >= 0 ? `* ${exRot(D.parc).replace('*', '')} parcial até ${D.ateDia}: a janela vigente já usa o mês parcial. O MSL é razão (Compliance sobre Target) e já vale; Target, faltas e auditorias ainda crescem até o fechamento.` : '';
}
function linhasRecorteEx() {
  const J = exJanela(), f = fonte('execucao');
  const L = [['Perna', 'MSL Direto'], ['Página', PAGES.find(p => p[0] === S.page)[1]], ['Mês vigente', exRot(J.v) + (J.v === D.parc ? ` (parcial até ${D.ateDia})` : '')],
    ['Janela de 3 meses', J.txt], ['Comparação', J.temAnt ? `mesma janela de ${J.Y - 1}: ${J.antTxt}` : `sem a mesma janela em ${J.Y - 1}`],
    ['Regra', 'MSL = soma do Compliance sobre a soma do Target; loja no patamar = MSL acima de 65% na janela; falta = Target menos Compliance']];
  if (exNotaParcial()) L.push(['Mês parcial', exNotaParcial()]);
  FILTROS.forEach(([k, n]) => L.push([n, S.f[k].size ? [...S.f[k]].map(i => dic[k][i]).join(', ') : 'Todos']));
  if (S.page === 'ex-lojas' && S.ui.exbusca) L.push(['Busca na tabela', S.ui.exbusca]);
  L.push(['Site publicado em', DSO.gerado]);
  if (f) L.push([`Fonte ${f.nome}`, `${quandoFonte(f)}${f.hora ? ' (extração às ' + f.hora + ')' : ''}${f.obs ? '. ' + f.obs : ''}`]);
  (D.fonte.obs || []).forEach((x, i) => L.push([`Premissa ${i + 1}`, String(x)]));
  L.push(['Exportado em', new Date().toLocaleString('pt-BR')], ['Link desta visão', location.href]);
  return L;
}

/* ----- leitura automática: onde ganha e onde cai (nomes vêm da base cifrada) ----- */
function exLeitura(J, R) {
  if (!(R.a.t > 0)) return `<div class="card"><div class="empty">Sem auditoria de MSL neste recorte na janela ${esc(J.txt)}${J.temAnt && R.b.t > 0 ? `; em ${esc(J.antTxt)} o MSL era ${p1(R.mb)}` : ''}.</div></div>`;
  const L = [], lista = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || ''), nm = k => esc(dic.marca[k]);
  L.push(`MSL de ${p1(R.m)} na janela ${esc(J.txt)}${J.temAnt && isFinite(R.mb) ? `, ${ppTxt(R.d)} sobre ${esc(J.antTxt)} (${p1(R.mb)})` : ''}. ${n0(R.acima)} de ${n0(R.n)} lojas auditadas ficam acima de 65% (${p1(R.pa)}).`);
  const MK = exLinhas(J, EXC.marca), MKc = MK.filter(x => x.a.t >= 50 && x.b.t >= 50 && isFinite(x.d));
  const fora = MK.filter(x => !(x.a.t > 0) && x.b.t > 0).sort((a, b) => b.b.t - a.b.t);
  if (J.temAnt && fora.length && R.b.t > 0) {   // a cesta de marcas mudou: compara só as marcas auditadas nos dois períodos
    const bt = fora.reduce((s, x) => s + x.b.t, 0), bc = fora.reduce((s, x) => s + x.b.c, 0), mc = R.b.t - bt > 0 ? (R.b.c - bc) / (R.b.t - bt) : NaN;
    L.push(`${n0(fora.length)} ${fora.length > 1 ? 'marcas auditadas' : 'marca auditada'} em ${esc(J.antTxt)} ${fora.length > 1 ? 'ficaram' : 'ficou'} sem auditoria na janela vigente (${lista(fora.slice(0, 3).map(x => nm(x.k)).concat(fora.length > 3 ? ['outras'] : []))}): ${p1(bt / R.b.t)} do Target do ano anterior. Na mesma cesta de marcas, o MSL vai de ${p1(mc)} para ${p1(R.m)} (${ppTxt(R.m - mc)}).`);
  }
  const sobe = MKc.filter(x => x.d >= 0.005).sort((a, b) => b.d - a.d).slice(0, 3), cai = MKc.filter(x => x.d <= -0.005).sort((a, b) => a.d - b.d).slice(0, 3);
  if (sobe.length) L.push(`Ganha em ${lista(sobe.map(x => `${nm(x.k)} (${ppTxt(x.d)}, ${p1(x.m)})`))}.`);
  if (cai.length) L.push(`Cai em ${lista(cai.map(x => `${nm(x.k)} (${ppTxt(x.d)}, ${p1(x.m)})`))}.`);
  const baixo = MK.filter(x => x.imp <= -0.003).sort((a, b) => a.imp - b.imp).slice(0, 4);
  if (baixo.length) L.push(`O que mais tira do MSL total: ${lista(baixo.map(x => `${nm(x.k)} (${p1(x.m)}, tira ${nf1.format(-x.imp * 100)} pp)`))}.`);
  const CL = exLinhas(J, EXC.bandeira).filter(x => x.a.t >= 100 && x.b.t >= 100 && isFinite(x.d)).sort((a, b) => b.d - a.d);
  if (CL.length > 1) {
    const g = CL[0], p = CL[CL.length - 1], nc = k => esc(dic.bandeira[k]), partes = [];
    if (g.d >= 0.005) partes.push(`${nc(g.k)} é quem mais ganha (${ppTxt(g.d)}, ${p1(g.m)})`);
    if (p.d <= -0.005) partes.push(`${nc(p.k)} quem mais cai (${ppTxt(p.d)}, ${p1(p.m)})`);
    if (partes.length) L.push(`Entre os clientes, ${partes.join(' e ')}.`);
  }
  const LO = exLinhas(J, EXC.loja).filter(x => x.a.t > 0), abaixo = LO.filter(x => x.m < 0.5).sort((a, b) => a.m - b.m);
  if (abaixo.length) L.push(`${n0(abaixo.length)} ${abaixo.length > 1 ? 'lojas ficam' : 'loja fica'} abaixo de 50%; a menor é ${exLojaNome(abaixo[0].k)} (${esc(D.lojas[abaixo[0].k].bandeira)}, ${p1(abaixo[0].m)}).`);
  const SK = exLinhas(J, EXC.sku).filter(x => x.f > 0).sort((a, b) => b.f - a.f)[0];
  if (SK) { const lf = exLojasSku(J).get(SK.k) || {falta: 0};
    L.push(`A maior falta é ${exSkuNome(SK.k)} (${esc(D.skus[SK.k].marca)}): ${n0(SK.f)} faltas em ${n0(lf.falta)} ${lf.falta === 1 ? 'loja' : 'lojas'}, ${p1(SK.peso)} das faltas da janela.`); }
  if (J.temAnt && R.nb > 0 && R.n < R.nb * 0.9) L.push(`Cobertura menor: ${n0(R.n)} lojas auditadas contra ${n0(R.nb)} em ${esc(J.antTxt)}. Leia o % de lojas acima de 65% junto com o número de lojas.`);
  return `<div class="card"><ol class="num">${L.map(x => `<li><span>${x}</span></li>`).join('')}</ol></div>`;
}

/* ----- páginas ----- */
function pgExInicio() {
  const J = exJanela(), R = exResumo(J);
  const side = `<div class="side">${(DSO.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Janela ${esc(J.txt)} · ${n0(R.n)} lojas auditadas</div>`;
  let h = hero('', 'MSL Direto.', 'O MSL das contas diretas, loja a loja.', side);
  h += exKpis(R, J);
  h += `<h2 class="sec">A leitura. <span>Onde ganha e onde cai, calculada sobre o recorte marcado.</span></h2>` + exLeitura(J, R);
  h += `<h2 class="sec">A curva do MSL. <span>Mês a mês, só para tendência: a leitura oficial é a janela.</span></h2><div class="card"><p class="eyebrow">MSL mês a mês · ${J.temY0 ? `${J.Y - 1} e ` : ''}${J.Y}</p>${exCurva(exSerie(), J)}</div>`;
  const MK = exOrdemMarcas(exLinhas(J, EXC.marca).filter(x => x.a.t > 0)), Mm = exMeses(EXC.marca);
  const cartao = x => `<a class="card" href="#ex-dados" data-act="exir" data-pg="ex-dados" data-k="exab" data-v="marca"><p class="eyebrow ${mkCls(String(dic.marca[x.k]).toUpperCase())}">${esc(dic.marca[x.k])}</p>
    <div class="kpi"><div class="val" style="font-size:30px">${p1(x.m)}</div><div class="sub">${[isFinite(x.d) ? vppt(x.d) + (J.temAnt ? ' sobre ' + esc(J.antTxt) : '') : '', `${n0(x.f)} faltas`].filter(Boolean).join(' · ')}</div></div>${exSpark(Mm.get(x.k), J)}</a>`;
  const cto = MK.filter(x => exEhCTO(dic.marca[x.k])), outras = MK.filter(x => !exEhCTO(dic.marca[x.k]));
  if (cto.length) h += `<h2 class="sec">As marcas do CTO. <span>MSL da janela e a variação contra o ano anterior.</span></h2><div class="grid g4 ex-cto">${cto.map(cartao).join('')}</div>`;   // 4 cartões fixos, sem rolagem
  if (outras.length) h += `<h2 class="sec">As demais marcas. <span>Entram no total, como no PBI.</span></h2><div class="shelf">${outras.map(cartao).join('')}</div>`;
  const IDX = [['ex-dados', 'Dados gerais', 'Janela, ano e mês para conferir com o PBI, e as abas Marca, Segmento, Canal e ambiente e UF, com o mês a mês.'],
    ['ex-diretor', 'Visão do Diretor', 'Os números da janela, os clientes e as lojas que mais puxam o MSL para baixo e as faltas que mais pesam.'],
    ['ex-clientes', 'Clientes', 'MSL por rede e lojas acima de 65%; ao abrir, as lojas da rede e a matriz marca x mês.'],
    ['ex-lojas', 'Lojas', 'Ranking de todas as lojas, busca por nome e a página da loja: marcas, segmentos, faltas, curva e a última visita.'],
    ['ex-executivos', 'Executivos', 'MSL da carteira de lojas de cada executivo, a pior marca e as lojas de cada um.'],
    ['ex-skus', 'SKUs e faltas', 'SKUs que mais faltam, marca a marca, e as lojas onde cada SKU falta.']];
  h += `<h2 class="sec">O índice. <span>A mesma lógica das pernas Sell Out e Sell In.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como ler. <span>Regras da perna MSL Direto.</span></h2><div class="card"><ol class="num">
    <li>MSL = soma do Compliance dividida pela soma do Target, nunca média de %. A leitura oficial é a janela de 3 meses: o mês vigente e os 2 anteriores (out = ago, set e out), contra a mesma janela do ano anterior.</li>
    <li>O seletor Mês vigente, no canto da barra, muda a janela do site inteiro. A curva mês a mês serve só para tendência.</li>
    <li>Patamar oficial do PBI: loja com MSL acima de 65% na janela. Leia o % de lojas acima do patamar junto com o número de lojas auditadas.</li>
    <li>Falta = Target menos Compliance: SKU do MSL que a auditoria não encontrou na loja. Impacto no MSL = pontos que o item tira ou soma no MSL total (o MSL dele contra o total, pesado pelo Target).</li>
    <li>Todas as marcas do relatório entram no total, como no PBI. As 4 marcas do CTO (Veja, Vanish, Harpic e Finish) aparecem primeiro, com a etiqueta CTO.</li>
    <li>Cliente, Executivo, UF, Canal e Ambiente filtram lojas; Marca e Segmento filtram SKUs. O link da página guarda o recorte e o mês vigente.</li></ol></div>`;
  if ((D.fonte.obs || []).length) h += `<h2 class="sec">Como ler a base. <span>Premissas da extração do PBI.</span></h2><div class="card"><ol class="num">${D.fonte.obs.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
  return h;
}

function exTabPeriodos(J) {   // os totais que o PBI mostra, para conferir (MSL com 2 casas)
  const Y1 = D.meses.map((_, i) => i).filter(i => +D.meses[i].slice(0, 4) === J.Y - 1 && D.tem[i]);
  const P = [[`Janela vigente · ${J.txt}`, J.idx], ...(J.temAnt ? [[`Mesma janela · ${J.antTxt}`, J.ant]] : []), [`Acumulado ${J.Y} · ${J.anoTxt}`, J.ano],
    ...(J.temAnoAnt ? [[`Mesmo período ${J.Y - 1} · ${J.anoAntTxt}`, J.anoAnt]] : []), ...(Y1.length ? [[`Ano ${J.Y - 1} inteiro`, Y1]] : []), [`Mês vigente · ${exRot(J.v)}`, [J.v]]];
  const linhas = P.map(([n, idx]) => { const o = exUm(idx), A = exSoma(idx, EXC.loja); let lj = 0, ac = 0; A.forEach(x => { if (x.t > 0) { lj++; if (x.c / x.t > EX_PAT) ac++; } }); return {n, o, lj, ac}; });
  return `<div class="tw"><table><thead><tr><th class="l">Período</th><th>Target</th><th>Compliance</th><th>MSL</th><th>Faltas</th><th>Lojas auditadas</th><th>Acima de 65%</th><th>% acima</th></tr></thead><tbody>` +
    linhas.map(x => `<tr><td class="l b">${esc(x.n)}</td><td>${n0(x.o.t)}</td><td>${n0(x.o.c)}</td><td class="b">${n2p(msl(x.o))}</td><td>${n0(x.o.t - x.o.c)}</td><td>${n0(x.lj)}</td><td>${n0(x.ac)}</td><td>${p1(x.lj ? x.ac / x.lj : NaN)}</td></tr>`).join('') +
    `</tbody></table></div><p class="note" style="margin:10px 0 0">Target e Compliance são contagens de SKU auditado na loja. Lojas e % acima de 65% são de cada período inteiro.</p>`;
}
function pgExDados() {
  const J = exJanela(), R = exResumo(J), ab = S.ui.extodas ? 'todas' : (S.ui.exab || 'marca'), med = S.ui.exmm || 'msl', ver = k => ab === 'todas' || ab === k;
  let h = hero('Dados gerais', 'MSL por marca, segmento, canal e UF.', `Janela ${esc(J.txt)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`) + exKpis(R, J);
  h += `<h2 class="sec">Janela, ano e mês. <span>Os mesmos totais do PBI, para conferência.</span></h2><div class="card"><p class="eyebrow">Totais por período</p>${exTabPeriodos(J)}</div>`;
  h += `<div class="pills" style="margin:28px 0 0">${[['marca', 'Marca'], ['segmento', 'Segmento'], ['canal', 'Canal e ambiente'], ['uf', 'UF']].map(([k, n]) => `<button data-act="ui" data-k="exab" data-v="${k}" class="${k === ab ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const sub = `Janela ${esc(J.txt)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}`;
  if (ver('marca')) {
    const L = exOrdemMarcas(exLinhas(J, EXC.marca)), Mm = exMeses(EXC.marca);
    h += `<h2 class="sec">Marca a marca. <span>${sub}; as 4 marcas do CTO primeiro.</span></h2><div class="card"><p class="eyebrow">Marca · janela</p>${exTabJanela('dxm', 'Marca', L, exMarcaNome, J, {spark: Mm})}</div>` +
      `<div class="card"><p class="eyebrow">Marca · mês a mês</p>${exSegMM()}${exTabMeses('Marca', L.map(x => x.k), exMarcaNome, Mm, J, med)}${exNotaMM()}</div>` +
      (L.some(x => !(x.a.t > 0)) ? `<p class="note">Marca sem MSL ${J.a6} = sem auditoria na janela vigente, só no ano anterior: ela pesa no total de ${J.a5} e não no de ${J.a6}.</p>` : '');
  }
  if (ver('segmento')) {
    const ordM = new Map(exOrdemMarcas(exLinhas(J, EXC.marca)).map((x, i) => [x.k, i]));
    const L = exLinhas(J, EXC.segmento).sort((a, b) => (ordM.get(D.segMarca[a.k]) ?? 99) - (ordM.get(D.segMarca[b.k]) ?? 99) || b.a.t - a.a.t || b.b.t - a.b.t), Mm = exMeses(EXC.segmento);
    h += `<h2 class="sec">Segmento a segmento. <span>${sub}; segmentos da marca no PBI.</span></h2><div class="card"><p class="eyebrow">Segmento · janela</p>${exTabJanela('dxs', 'Marca · segmento', L, exSegNome, J, {spark: Mm})}</div>` +
      `<div class="card"><p class="eyebrow">Segmento · mês a mês</p>${exSegMM()}${exTabMeses('Marca · segmento', L.map(x => x.k), exSegNome, Mm, J, med)}${exNotaMM()}</div>`;
  }
  if (ver('canal')) {
    const L = exLinhas(J, EXC.canal).sort((a, b) => b.a.t - a.a.t), chA = r => D.L.canal[r[1]] * 100 + D.L.ambiente[r[1]];
    const LA = exLinhas(J, chA).sort((a, b) => Math.floor(a.k / 100) - Math.floor(b.k / 100) || b.a.t - a.a.t);
    const nA = k => `${esc(dic.canal[Math.floor(k / 100)])} · ${esc(dic.ambiente[k % 100])}`;
    h += `<h2 class="sec">Canal e ambiente. <span>${sub}; canal e ambiente da loja no PBI.</span></h2><div class="card"><p class="eyebrow">Canal · janela</p>${exTabJanela('dxc', 'Canal', L, k => esc(dic.canal[k]), J, {lojas: exLojasPor(J, l => D.L.canal[l]), spark: exMeses(EXC.canal)})}</div>` +
      `<div class="card"><p class="eyebrow">Canal e ambiente · janela</p>${exTabJanela('dxa', 'Canal · ambiente', LA, nA, J, {lojas: exLojasPor(J, l => D.L.canal[l] * 100 + D.L.ambiente[l]), spark: exMeses(chA)})}</div>` +
      `<div class="card"><p class="eyebrow">Canal e ambiente · mês a mês</p>${exSegMM()}${exTabMeses('Canal · ambiente', LA.map(x => x.k), nA, exMeses(chA), J, med)}${exNotaMM()}</div>`;
  }
  if (ver('uf')) {
    const L = exLinhas(J, EXC.uf).sort((a, b) => b.a.t - a.a.t), Mm = exMeses(EXC.uf);
    h += `<h2 class="sec">UF contra UF. <span>${sub}; UF da loja.</span></h2><div class="card"><p class="eyebrow">UF · janela</p>${exTabJanela('dxu', 'UF', L, k => esc(dic.uf[k]), J, {lojas: exLojasPor(J, l => D.L.uf[l]), spark: Mm})}</div>` +
      `<div class="card"><p class="eyebrow">UF · mês a mês</p>${exSegMM()}${exTabMeses('UF', L.map(x => x.k), k => esc(dic.uf[k]), Mm, J, med)}${exNotaMM()}</div>`;
  }
  return h + `<p class="note">Impacto no MSL = pontos que o item tira ou soma no MSL total: o MSL dele contra o total, pesado pelo Target. Peso nas faltas = parte do item nas faltas da janela.</p>`;
}

function pgExDiretor() {
  const J = exJanela(), R = exResumo(J);
  let h = hero('Visão do Diretor', 'A execução em uma página.', `Janela ${esc(J.txt)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`);
  h += exKpis(R, J, [0, 1, 2, 4]);
  const LJ = exLojasPor(J, l => D.L.bandeira[l]);
  const CL = exLinhas(J, EXC.bandeira).filter(x => x.a.t > 0).sort((a, b) => a.imp - b.imp).slice(0, 3);
  const LO = exLinhas(J, EXC.loja).filter(x => x.a.t > 0).sort((a, b) => a.imp - b.imp).slice(0, 5);
  const pa = k => { const o = LJ.get(k); return o && o.n ? o.acima / o.n : NaN; };
  h += `<h2 class="sec">Quem puxa para baixo. <span>Impacto = pontos que o item tira do MSL total: o MSL dele contra o total, pesado pelo Target.</span></h2>
    <div class="card"><p class="eyebrow">Os 3 clientes</p>${exTabela('dic', CL, [{c: 'Cliente', l: true, b: true, h: x => esc(dic.bandeira[x.k])}, {c: `MSL ${J.a6}`, b: true, h: x => p1(x.m)}, {c: 'Δ pp', h: x => vppt(x.d)},
      {c: 'Lojas', h: x => n0((LJ.get(x.k) || {}).n)}, {c: '% acima de 65%', h: x => p1(pa(x.k))}, {c: 'Impacto', h: x => vppt(x.imp)}])}</div>
    <div class="card"><p class="eyebrow">As 5 lojas</p>${exTabela('dil', LO, [{c: 'Loja', l: true, b: true, k: 'nm', h: x => `<button class="lnk" data-act="exir" data-pg="ex-lojas" data-k="selloja" data-v="${x.k}">${exLojaNome(x.k)}</button>`},
      {c: 'Cliente', l: true, h: x => esc(D.lojas[x.k].bandeira)}, {c: `MSL ${J.a6}`, b: true, h: x => pEx(x.m)}, {c: 'Δ pp', h: x => vppt(x.d)}, {c: 'Faltas', h: x => n0(x.f)}, {c: 'Impacto', h: x => vppt(x.imp)}])}</div>`;
  const LF = exLojasSku(J), SK = exLinhas(J, EXC.sku).filter(x => x.f > 0).sort((a, b) => b.f - a.f).slice(0, 5);
  h += `<h2 class="sec">As faltas que mais pesam. <span>Os 5 SKUs com mais faltas na janela ${esc(J.txt)}.</span></h2><div class="card"><p class="eyebrow">SKUs com mais faltas</p>${exTabela('dis', SK, [
    {c: 'SKU', l: true, b: true, k: 'sk', h: x => `<button class="lnk" data-act="exir" data-pg="ex-skus" data-k="selsku" data-v="${x.k}">${exSkuNome(x.k)}</button>`}, {c: 'Marca', l: true, h: x => exMarcaNome(D.K.marca[x.k])},
    {c: 'Segmento', l: true, h: x => esc(dic.segmento[D.K.segmento[x.k]])}, {c: 'Faltas', b: true, h: x => n0(x.f)}, {c: 'Peso nas faltas', h: x => p1(x.peso)},
    {c: 'Lojas onde falta', h: x => n0((LF.get(x.k) || {}).falta)}, {c: 'Lojas auditadas', h: x => n0((LF.get(x.k) || {}).aud)}, {c: 'Presença', h: x => p1(x.m)}])}</div>`;
  // cliente x marca (as 4 do CTO e o total)
  const CM = EX_CTO.map(n => dic.marca.findIndex(m => String(m).toUpperCase() === n)).filter(i => i >= 0);
  const ch = r => D.L.bandeira[r[1]] * 1000 + D.K.marca[r[2]], A = exSoma(J.idx, ch), B = J.temAnt ? exSoma(J.ant, ch) : new Map();
  const AT = exSoma(J.idx, EXC.bandeira), BT = J.temAnt ? exSoma(J.ant, EXC.bandeira) : new Map(), AM = exSoma(J.idx, EXC.marca), BM = J.temAnt ? exSoma(J.ant, EXC.marca) : new Map();
  const reds = [...new Set([...AT.keys(), ...BT.keys()])].sort((a, b) => (msl(AT.get(b)) || -1) - (msl(AT.get(a)) || -1));
  const tri = (a, b) => `<td>${p1(msl(b))}</td><td class="b">${p1(msl(a))}</td><td>${vppt(msl(a) - msl(b))}</td>`, duo = (a, b) => `<td class="b">${p1(msl(a))}</td><td>${vppt(msl(a) - msl(b))}</td>`;
  const totA = exUm(J.idx), totB = J.temAnt ? exUm(J.ant) : EZ;
  // na tela: o Total completo logo depois do cliente e, por marca, o MSL da janela e o Δ pp (cabe em 1280 px); o Excel leva a matriz completa, com o ano anterior de cada marca
  const tela = `<div class="tw" data-xls="fora"><table><thead><tr><th class="l">Cliente</th><th colspan="3" style="text-align:center">Total</th>` +
    CM.map(m => `<th colspan="2" style="text-align:center">${esc(dic.marca[m])}</th>`).join('') + `</tr><tr><th></th><th>${J.a5}</th><th>${J.a6}</th><th>Δ pp</th>${CM.map(() => `<th>${J.a6}</th><th>Δ pp</th>`).join('')}</tr></thead><tbody>` +
    reds.map(b => `<tr><td class="l b">${esc(dic.bandeira[b])}</td>${tri(AT.get(b), BT.get(b))}${CM.map(m => duo(A.get(b * 1000 + m), B.get(b * 1000 + m))).join('')}</tr>`).join('') +
    `<tr class="tot"><td class="l">Total</td>${tri(totA, totB)}${CM.map(m => duo(AM.get(m), BM.get(m))).join('')}</tr></tbody></table></div>`;
  const xls = `<div class="tw xls-so"><table><thead><tr><th class="l">Cliente</th>` +
    ['Total', ...CM.map(m => esc(dic.marca[m]))].map(n => `<th colspan="3" style="text-align:center">${n}</th>`).join('') + `</tr><tr><th></th>${[-1, ...CM].map(() => `<th>${J.a5}</th><th>${J.a6}</th><th>Δ pp</th>`).join('')}</tr></thead><tbody>` +
    reds.map(b => `<tr><td class="l b">${esc(dic.bandeira[b])}</td>${tri(AT.get(b), BT.get(b))}${CM.map(m => tri(A.get(b * 1000 + m), B.get(b * 1000 + m))).join('')}</tr>`).join('') +
    `<tr class="tot"><td class="l">Total</td>${tri(totA, totB)}${CM.map(m => tri(AM.get(m), BM.get(m))).join('')}</tr></tbody></table></div>`;
  h += `<h2 class="sec">Cliente x marca. <span>MSL da janela por rede no total e nas 4 marcas do CTO, contra o ano anterior.</span></h2><div class="card"><p class="eyebrow">Cliente x marca</p>${tela}${xls}
    <p class="note" style="margin:12px 0 0">O Total soma todas as marcas do relatório, como no PBI. Por marca, o MSL da janela e a variação em pp; o MSL de ${J.Y - 1} de cada marca sai no Excel. Célula vazia = a rede não teve auditoria da marca no período.</p></div>`;
  return h;
}

function pgExClientes() {
  const J = exJanela(), L = exLinhas(J, EXC.bandeira).filter(x => x.a.t > 0 || x.b.t > 0).sort((a, b) => b.a.t - a.a.t), LJ = exLojasPor(J, l => D.L.bandeira[l]), Mm = exMeses(EXC.bandeira);
  const execs = new Map(); D.lojas.forEach((l, i) => { const b = D.L.bandeira[i]; if (!execs.has(b)) execs.set(b, new Set()); execs.get(b).add(l.executivo); });
  const nc = k => esc(dic.bandeira[k]);
  let h = hero('Clientes', 'MSL por rede.', exConclusao(L, nc, J, 'redes'), '', `Janela ${esc(J.txt)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}. Clique no nome da rede para abrir as lojas.`);
  h += `<h2 class="sec">Quantas sobem e quantas caem. <span>MSL da janela contra a mesma janela do ano anterior, por rede (estável = menos de 1 pp).</span></h2>` + exTermo(L.map(x => x.d));
  h += `<h2 class="sec">Rede a rede. <span>Clique no nome para abrir; no título da coluna, para ordenar.</span></h2><div class="card"><p class="eyebrow">Clientes · janela</p>${exTabJanela('exc', 'Cliente', L, k => esc(dic.bandeira[k]), J,
    {sel: 'selcli', spark: Mm, curvaCedo: true, lojas: LJ, semContagem: true, extra: [{c: 'Executivo', l: true, v: x => [...(execs.get(x.k) || [])].join(', '), h: x => esc([...(execs.get(x.k) || [])].join(', '))}]})}</div>`;
  const k = exSelValido('selcli', L);
  if (k !== null) {
    const sub = r => D.L.bandeira[r[1]] === k, nome = esc(dic.bandeira[k]), med = S.ui.exmm || 'msl';
    const LM = exOrdemMarcas(exLinhas(J, EXC.marca, sub));
    h += `<div class="det"><h2 class="sec">${nome}. <span>Janela ${esc(J.txt)}: os números, as lojas da rede e a matriz marca x mês.</span></h2>` + exKpis(exResumo(J, sub), J) +
      `<div class="card"><p class="eyebrow">${nome} · MSL mês a mês</p>${exCurva(exSerie(sub), J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · lojas</p>${exTabLojas('excl', J, sub, {link: 'exir', semRede: true})}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${exTabJanela('excm', 'Marca', LM, exMarcaNome, J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca x mês</p>${exSegMM()}${exTabMeses('Marca', LM.map(x => x.k), exMarcaNome, exMeses(EXC.marca, sub), J, med)}${exNotaMM()}</div></div>`;
  }
  return h;
}

function exVisita(k, v) {   // última visita registrada da loja (página Performance de Lojas por KPI): média do mês
  if (!D.vis) return null;
  const C = D.vis.campos, iM = C.indexOf('iMes'), iL = C.indexOf('iLoja');
  let best = null;   // a visita mais recente até o mês vigente
  D.vis.f.forEach(r => { if (r[iL] === k && r[iM] <= v && (!best || r[iM] > best[iM])) best = r; });
  return best ? {r: best, C, m: best[iM]} : null;
}
const EX_SOS = {SOS_DESIN: 'Desinfetante', SOS_FIN: 'Finish', SOS_HAR: 'Harpic', SOS_COND: 'COND', SOS_SUST_KI: 'Sustagen Kids', SOS_VAN: 'Vanish', SOS_BAN: 'Banheiro', SOS_COZ: 'Cozinha', SOS_VIDROS: 'Vidros', SOS_VLP: 'VLP', SOS_VMU: 'VMU', SOS_VPS: 'VPS'};
function exDetLoja(k, J) {
  const l = D.lojas[k], sub = r => r[1] === k, R = exResumo(J, sub), nome = exLojaNome(k, true);
  let h = `<div class="det"><h2 class="sec">${nome}. <span>${esc(l.bandeira)} · ${esc(l.cidade)}/${esc(l.uf)} · ${esc(l.ambiente)} · ${esc(l.executivo)} · código ${esc(l.id)}.</span></h2>` + exKpis(R, J, [0, 3, 4, 5]);
  h += `<div class="card"><p class="eyebrow">MSL mês a mês da loja</p>${exCurva(exSerie(sub), J)}</div>`;
  const LM = exOrdemMarcas(exLinhas(J, EXC.marca, sub)), LS = exLinhas(J, EXC.segmento, sub).sort((a, b) => a.m - b.m || b.a.t - a.a.t);
  h += `<div class="grid g2"><div class="card"><p class="eyebrow">Marca a marca</p>${exTabJanela('exlm', 'Marca', LM, exMarcaNome, J, {compacto: true})}</div>
    <div class="card"><p class="eyebrow">Segmento a segmento</p>${exTabJanela('exls', 'Marca · segmento', LS, exSegNome, J, {compacto: true})}</div></div>`;
  const MS = exMeses(EXC.sku, sub), FS = exLinhas(J, EXC.sku, sub).filter(x => x.f > 0).sort((a, b) => b.f - a.f || a.m - b.m);
  const mesesFalta = s => { const o = MS.get(s); return o ? J.idx.filter(i => o.t[i] - o.c[i] > 0).map(exRot).join(', ') : ''; };
  h += `<div class="card"><p class="eyebrow">Faltas de SKU da loja · ${esc(J.txt)}</p>${exTabela('exlf' + k, FS, [
    {c: 'SKU', l: true, b: true, k: 'sk', v: x => semAcento(D.skus[x.k].desc || ''), h: x => exSkuNome(x.k)},
    {c: 'Vezes que faltou', b: true, v: x => x.f, h: x => n0(x.f)}, {c: 'Target', v: x => x.a.t, h: x => n0(x.a.t)}, {c: 'Presença', v: x => x.m, h: x => p1(x.m)}, {c: 'Meses com falta', l: true, h: x => esc(mesesFalta(x.k))},
    {c: 'Marca', l: true, v: x => dic.marca[D.K.marca[x.k]], h: x => exMarcaNome(D.K.marca[x.k])}, {c: 'Segmento', l: true, v: x => dic.segmento[D.K.segmento[x.k]], h: x => esc(dic.segmento[D.K.segmento[x.k]])},
    {c: 'Código', l: true, k: 'ex-cod', v: x => D.skus[x.k].cod, h: x => esc(D.skus[x.k].cod), oc: true}])}
    <p class="note" style="margin:10px 0 0">Vezes que faltou = Target menos Compliance do SKU na loja, na janela (uma vez por auditoria em que o SKU não foi encontrado).</p></div>`;
  const V = exVisita(k, J.v);
  if (V) {
    const val = c => V.r[V.C.indexOf(c)], sos = V.C.filter(c => c.startsWith('SOS_') && isFinite(val(c)) && val(c) !== null);
    h += `<div class="card"><p class="eyebrow">Última visita registrada · ${esc(exRot(V.m))}</p><h3>Pontuação da loja: ${n0(val('pontuacao'))} de 100. <span>${n0(val('n_visitas'))} ${val('n_visitas') === 1 ? 'visita' : 'visitas'} no mês; média do mês. ${esc(D.vis.obs || '')}</span></h3>` +
      (sos.length ? `<div class="tw"><table><thead><tr><th class="l">Categoria</th><th>SOS (espaço de gôndola)</th></tr></thead><tbody>${sos.map(c => `<tr><td class="l">${esc(EX_SOS[c] || c.replace('SOS_', ''))}</td><td>${nf1.format(val(c))}%</td></tr>`).join('')}</tbody></table></div>` : '<p class="note" style="margin:10px 0 0">Sem SOS registrado na visita.</p>') + '</div>';
  }
  return h + '</div>';
}
const exLojasPrincipal = () => exTabLojas('exl', exJanela(), null, {busca: S.ui.exbusca});
function pgExLojas() {
  const J = exJanela(), L = exLinhas(J, EXC.loja).filter(x => x.a.t > 0 || x.b.t > 0);
  const c = {up: 0, warn: 0, down: 0, sem: 0}; L.forEach(x => { if (!(x.a.t > 0)) c.sem++; else if (x.m > EX_PAT) c.up++; else if (x.m >= 0.5) c.warn++; else c.down++; });
  const audL = L.filter(x => x.a.t > 0), menor = audL.length ? audL.reduce((a, b) => (b.m < a.m ? b : a)) : null;
  const conclL = menor ? `${n0(c.up)} de ${n0(audL.length)} ${audL.length > 1 ? 'lojas auditadas ficam' : 'loja auditada fica'} acima de 65%${c.down ? `, ${n0(c.down)} abaixo de 50%` : ''}; a menor é ${exLojaNome(menor.k)} (${pEx(menor.m)}).` : `Sem auditoria na janela ${esc(J.txt)}.`;
  let h = hero('Lojas', 'MSL loja a loja.', conclL, '', `Janela ${esc(J.txt)}, do menor para o maior MSL, contra a própria loja${J.temAnt ? ` em ${esc(J.antTxt)}` : ''}.`);
  h += `<h2 class="sec">As faixas. <span>Patamar oficial do PBI: loja com MSL acima de 65% na janela.</span></h2><div class="termo"><span class="vbig up">▲ ${c.up} acima de 65%</span><span class="vbig warn">● ${c.warn} entre 50% e 65%</span><span class="vbig down">▼ ${c.down} abaixo de 50%</span>${c.sem ? `<span class="vbig flat">${c.sem} sem auditoria na janela</span>` : ''}</div>`;
  h += `<h2 class="sec">Loja a loja. <span>Busque pelo nome, código, cidade ou rede.</span></h2>` +
    `<div class="card"><p class="eyebrow">Lojas · janela</p><div class="pills" style="margin:6px 0 0">${buscaRede('exbusca', S.ui.exbusca, 'Buscar loja, código, cidade ou rede')}</div><div id="ex-lojas-tab">${exLojasPrincipal()}</div></div>`;
  const k = exSelValido('selloja', L);
  if (k !== null) h += exDetLoja(k, J);
  return h;
}

function pgExExecutivos() {
  const J = exJanela(), L = exLinhas(J, EXC.executivo).filter(x => x.a.t > 0 || x.b.t > 0).sort((a, b) => b.a.t - a.a.t), LJ = exLojasPor(J, l => D.L.executivo[l]), Mm = exMeses(EXC.executivo);
  const pior = new Map();
  exSoma(J.idx, r => D.L.executivo[r[1]] * 1000 + D.K.marca[r[2]]).forEach((o, key) => { if (o.t < 30) return; const e = Math.floor(key / 1000), x = msl(o), p = pior.get(e); if (!p || x < p.m) pior.set(e, {m: x, mk: key % 1000}); });
  const redes = new Map(); exSoma([...J.idx, ...J.ant], EXC.loja).forEach((o, l) => { const e = D.L.executivo[l]; if (!redes.has(e)) redes.set(e, new Set()); redes.get(e).add(D.lojas[l].bandeira); });
  const rd = k => [...(redes.get(k) || [])].sort().join(', ');
  let h = hero('Executivos', 'MSL por executivo.', exConclusao(L, k => esc(dic.executivo[k]), J, 'carteiras'), '', `A carteira de lojas de cada um, na janela ${esc(J.txt)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`);
  h += `<h2 class="sec">Executivo a executivo. <span>Pior marca = menor MSL da carteira na janela, entre as marcas com pelo menos 30 de Target.</span></h2><div class="card"><p class="eyebrow">Executivos · janela</p>${exTabJanela('exe', 'Executivo', L, k => esc(dic.executivo[k]), J,
    {sel: 'selexe', spark: Mm, lojas: LJ, semContagem: true, extraCedo: [{c: 'Pior marca', l: true, v: x => (pior.get(x.k) || {}).m, h: x => { const p = pior.get(x.k); return p ? `${exMarcaNome(p.mk)} <span class="mini">${p1(p.m)}</span>` : ''; }},
      {c: 'Clientes', l: true, v: x => rd(x.k), h: x => esc(rd(x.k))}]})}</div>`;
  const k = exSelValido('selexe', L);
  if (k !== null) {
    const sub = r => D.L.executivo[r[1]] === k, nome = esc(dic.executivo[k]), LM = exOrdemMarcas(exLinhas(J, EXC.marca, sub));
    h += `<div class="det"><h2 class="sec">${nome}. <span>Janela ${esc(J.txt)}: os números, as marcas e as lojas da carteira.</span></h2>` + exKpis(exResumo(J, sub), J) +
      `<div class="card"><p class="eyebrow">${nome} · MSL mês a mês</p>${exCurva(exSerie(sub), J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${exTabJanela('exem', 'Marca', LM, exMarcaNome, J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · lojas</p>${exTabLojas('exel', J, sub, {link: 'exir', semExec: true})}</div></div>`;
  }
  return h;
}

function pgExSkus() {
  const J = exJanela(), R = exResumo(J), LF = exLojasSku(J), SK = exLinhas(J, EXC.sku).filter(x => x.a.t > 0 || x.b.t > 0);
  const aud = SK.filter(x => x.a.t > 0), comF = aud.filter(x => x.f > 0);
  const lojasF = new Set(); exSoma(J.idx, EXC.loja).forEach((o, l) => { if (o.t - o.c > 0) lojasF.add(l); });
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv"><span>${sub}</span></div></div>`;
  const topF = comF.length ? comF.reduce((a, b) => (b.f > a.f ? b : a)) : null;
  const conclS = topF ? `${n0(comF.length)} de ${n0(aud.length)} SKUs auditados tiveram falta; o que mais falta é <span class="ex-quebra">${exSkuNome(topF.k)}</span> (${n0(topF.f)} faltas em ${n0((LF.get(topF.k) || {}).falta)} ${(LF.get(topF.k) || {}).falta === 1 ? 'loja' : 'lojas'}).`
    : aud.length ? `Nenhuma falta nos ${n0(aud.length)} SKUs auditados.` : `Sem auditoria na janela ${esc(J.txt)}.`;
  let h = hero('SKUs e faltas', 'Onde o MSL falha.', conclS, '', `SKUs que a auditoria não encontrou na loja, na janela ${esc(J.txt)}.`);
  h += `<div class="grid g3">${card('Faltas na janela', n0(R.f), `${p1(R.a.t ? R.f / R.a.t : NaN)} do Target de ${n0(R.a.t)}`)}${card('SKUs com falta', `${n0(comF.length)} de ${n0(aud.length)}`, 'SKUs auditados na janela')}${card('Lojas com alguma falta', `${n0(lojasF.size)} de ${n0(R.n)}`, 'lojas auditadas na janela')}</div>`;
  // marca a marca
  const LFm = new Map(); exSoma(J.idx, r => D.K.marca[r[2]] * 1000 + r[1]).forEach((o, key) => { const m = Math.floor(key / 1000); let x = LFm.get(m); if (!x) LFm.set(m, x = {aud: 0, falta: 0}); x.aud++; if (o.t - o.c > 0) x.falta++; });
  const nS = new Map(), nSF = new Map(); aud.forEach(x => { const m = D.K.marca[x.k]; nS.set(m, (nS.get(m) || 0) + 1); if (x.f > 0) nSF.set(m, (nSF.get(m) || 0) + 1); });
  const LM = exOrdemMarcas(exLinhas(J, EXC.marca));
  h += `<h2 class="sec">Marca a marca. <span>Faltas, peso e presença (MSL) de cada marca na janela.</span></h2><div class="card"><p class="eyebrow">Faltas por marca</p>${exTabela('exsm', LM, [
    {c: 'Marca', l: true, b: true, v: x => semAcento(dic.marca[x.k]), h: x => exMarcaNome(x.k), t: () => 'Total'}, {c: 'SKUs auditados', v: x => nS.get(x.k) || 0, h: x => n0(nS.get(x.k) || 0), t: () => n0(aud.length)},
    {c: 'SKUs com falta', v: x => nSF.get(x.k) || 0, h: x => n0(nSF.get(x.k) || 0), t: () => n0(comF.length)}, {c: `Faltas ${J.a6}`, b: true, v: x => x.f, h: x => n0(x.f), t: true},
    {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true}, {c: `Presença ${J.a6}`, v: x => x.m, h: x => p1(x.m), t: true}, {c: `Presença ${J.a5}`, v: x => x.mb, h: x => p1(x.mb), t: true},
    {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d), t: true}, {c: 'Lojas com falta', v: x => (LFm.get(x.k) || {}).falta, h: x => n0((LFm.get(x.k) || {}).falta), t: () => n0(lojasF.size)},
    {c: 'Lojas auditadas', v: x => (LFm.get(x.k) || {}).aud, h: x => n0((LFm.get(x.k) || {}).aud), t: () => n0(R.n)}], {tot: exTotal(LM)})}</div>`;
  // SKU a SKU
  const sel = String(S.ui.selsku ?? '');
  const L = SK.filter(x => x.a.t > 0).sort((a, b) => b.f - a.f || a.m - b.m);
  h += `<h2 class="sec">SKU a SKU. <span>Do SKU que mais falta para o que menos falta; clique no SKU para abrir as lojas.</span></h2><div class="card"><p class="eyebrow">SKUs · janela</p>${exTabela('exss', L, [
    {c: 'SKU', l: true, b: true, k: 'sk', v: x => semAcento(D.skus[x.k].desc || ''), h: x => `<button class="lnk" data-act="ui" data-k="selsku" data-v="${String(x.k) === sel ? '' : x.k}">${exSkuNome(x.k)}</button>`, t: () => 'Total dos SKUs da janela'},
    {c: `Faltas ${J.a6}`, b: true, v: x => x.f, h: x => n0(x.f), t: true}, {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true},
    {c: 'Lojas onde falta', v: x => (LF.get(x.k) || {}).falta, h: x => n0((LF.get(x.k) || {}).falta)}, {c: 'Lojas auditadas', v: x => (LF.get(x.k) || {}).aud, h: x => n0((LF.get(x.k) || {}).aud)},
    {c: `Presença ${J.a6}`, v: x => x.m, h: x => p1(x.m), t: true}, {c: `Presença ${J.a5}`, v: x => x.mb, h: x => p1(x.mb), t: true}, {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d), t: true},
    {c: 'Marca', l: true, v: x => dic.marca[D.K.marca[x.k]], h: x => exMarcaNome(D.K.marca[x.k])}, {c: 'Segmento', l: true, v: x => dic.segmento[D.K.segmento[x.k]], h: x => esc(dic.segmento[D.K.segmento[x.k]])},
    {c: 'Código', l: true, k: 'ex-cod', v: x => D.skus[x.k].cod, h: x => esc(D.skus[x.k].cod), oc: true}],
    {tot: exTotal(L), on: x => String(x.k) === sel})}<p class="note" style="margin:10px 0 0">Presença = Compliance sobre Target do SKU (o MSL do SKU). Lojas onde falta = lojas auditadas em que o SKU faltou ao menos uma vez na janela. O total compara só os SKUs auditados na janela vigente, nos dois anos.</p></div>`;
  const k = exSelValido('selsku', L);
  if (k !== null) {
    const sub = r => r[2] === k, LL = exLinhas(J, EXC.loja, sub).filter(x => x.a.t > 0).sort((a, b) => b.f - a.f || a.m - b.m);
    h += `<div class="det"><h2 class="sec">${exSkuNome(k)}. <span>${esc(D.skus[k].marca)} · ${esc(D.skus[k].segmento)} · código ${esc(D.skus[k].cod)}: as lojas auditadas na janela, da que mais faltou para a que menos faltou.</span></h2>` +
      `<div class="card"><p class="eyebrow">Lojas do SKU · janela</p>${exTabela('exsl', LL, [
        {c: 'Loja', l: true, b: true, k: 'nm', h: x => `<button class="lnk" data-act="exir" data-pg="ex-lojas" data-k="selloja" data-v="${x.k}">${exLojaNome(x.k)}</button>`, t: () => 'Total'},
        {c: 'Cliente', l: true, h: x => esc(D.lojas[x.k].bandeira)}, {c: 'UF', l: true, h: x => esc(D.lojas[x.k].uf)}, {c: 'Executivo', l: true, h: x => esc(D.lojas[x.k].executivo)},
        {c: 'Vezes que faltou', b: true, h: x => n0(x.f), t: true}, {c: 'Target', h: x => n0(x.a.t), t: x => n0(x.a.t)}, {c: `Presença ${J.a6}`, h: x => p1(x.m), t: true}, {c: `Presença ${J.a5}`, h: x => p1(x.mb), t: true}],
        {tot: exTotal(LL)})}</div>` + `<div class="card"><p class="eyebrow">SKU · presença mês a mês</p>${exCurva(exSerie(sub), J)}</div></div>`;
  }
  return h;
}

/* ======================= Perna MSL Indireto: MSL das lojas do canal indireto (lista oficial de lojas e de SKUs; sell out do Colecta, MTRIX no ano sem Colecta) =======================
   Base (arquivo cifrado): as lojas da lista oficial, os SKUs exigidos por perfil de loja (alvo) e, mês a mês, um bit por loja x SKU exigido:
   1 = a loja comprou do próprio distribuidor pelo menos a unidade mínima do SKU na janela móvel de 3 meses (o mês e os 2 anteriores).
   O MSL de cada mês já é a leitura de 3 meses. MSL da loja = SKUs positivados / SKUs exigidos; o número do PBI é a média simples das lojas ("Média de MSL"),
   com a média por marca quando a regra do arquivo pede (regra.media_por_marca). Nomes de loja, rede e executivo vêm só do arquivo cifrado. */
function montarDMI(e) {
  if (!e || !Array.isArray(e.meses) || !e.meses.length || e.meses.length > 63 || !Array.isArray(e.lojas) || !e.lojas.length || e.lojas.length > 65000 || !Array.isArray(e.skus) || !e.skus.length
    || !e.alvo || typeof e.alvo !== 'object' || !Array.isArray(e.bits) || e.bits.length !== e.meses.length || !e.cob || typeof e.cob !== 'object') return null;
  if (!e.lojas.every(l => l && typeof l === 'object') || !e.skus.every(x => x && typeof x === 'object')) return null;
  const M = e.meses.length, NK = e.skus.length, NL = e.lojas.length, vazio = '(sem dado)', uniq = a => [...new Set(a)].sort((x, y) => String(x).localeCompare(String(y), 'pt-BR'));
  const CH = ['dist', 'rede', 'executivo', 'perfil', 'tipo', 'lista'], dic = {}, L = {}, K = {};
  CH.forEach(k => { const v = e.lojas.map(l => String(l[k] || vazio)); dic[k] = uniq(v); L[k] = v.map(x => dic[k].indexOf(x)); });
  ['marca', 'segmento'].forEach(k => { const v = e.skus.map(x => String(x[k] || vazio)); dic[k] = uniq(v); K[k] = v.map(x => dic[k].indexOf(x)); });
  if (dic.marca.length > 60) return null;
  const segMarca = []; K.segmento.forEach((g, j) => { if (segMarca[g] === undefined) segMarca[g] = K.marca[j]; });
  const alvo = e.lojas.map(l => { const a = e.alvo[l.perfil]; return Array.isArray(a) && a.every(k => Number.isInteger(k) && k >= 0 && k < NK) ? a : []; });
  const cob = e.lojas.map(l => { const c = e.cob[l.dist]; return Array.isArray(c) && c.length === M ? c : new Array(M).fill(0); });
  const b64 = x => { const t = atob(x), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  let n = 0; for (let m = 0; m < M; m++) for (let l = 0; l < NL; l++) if (cob[l][m]) n += alvo[l].length;
  const col = {m: new Uint8Array(n), l: new Uint16Array(n), k: new Uint16Array(n), t: new Uint8Array(n).fill(1), c: null, r: null};
  const tem = new Uint8Array(M); let p = 0;
  for (let m = 0; m < M; m++) {   // a grade (mês x loja x SKU exigido) é a mesma nas réguas; só os bits mudam
    const p0 = p;
    for (let l = 0; l < NL; l++) { if (!cob[l][m]) continue; for (const k of alvo[l]) { col.m[p] = m; col.l[p] = l; col.k[p] = k; p++; } }
    if (p > p0) tem[m] = 1;
  }
  const decod = (bits, risco) => {   // bits de positivação e de risco de uma régua -> {c, r} na ordem da grade
    if (!Array.isArray(bits) || bits.length !== M) return null;
    const c = new Uint8Array(n), r = new Uint8Array(n); let q0 = 0;
    for (let m = 0; m < M; m++) {
      let q = 0, nm = 0; for (let l = 0; l < NL; l++) if (cob[l][m]) nm += alvo[l].length;
      if (!nm) continue;
      if (!bits[m]) return null;
      const B = b64(bits[m]), RB = Array.isArray(risco) && risco[m] ? b64(risco[m]) : null;
      if (B.length !== Math.ceil(nm / 8) || (RB && RB.length !== B.length)) return null;   // bits a mais ou a menos que a grade: base fora do formato
      for (; q < nm; q++) { const j = q0 + q; c[j] = (B[q >> 3] >> (q & 7)) & 1; if (RB) r[j] = (RB[q >> 3] >> (q & 7)) & 1 & c[j]; }
      q0 += nm;
    }
    return {c, r};
  };
  const RG = {}, RGL = [];
  ((e.regra && Array.isArray(e.regra.reguas)) ? e.regra.reguas : []).forEach(x => { const o = e.reguas && e.reguas[x.id] ? decod(e.reguas[x.id].bits, e.reguas[x.id].risco) : null; if (o) { RG[x.id] = o; RGL.push([x.id, String(x.nome || x.id)]); } });
  if (!RGL.length) { const o = decod(e.bits, e.risco); if (!o) return null; RG.unica = o; RGL.push(['unica', 'Régua única']); }
  const reg0 = RG[e.regra && e.regra.padrao] ? e.regra.padrao : RGL[0][0];
  col.c = RG[reg0].c; col.r = RG[reg0].r;
  const meses = e.meses.map(String), fx = e.fonte || {}, ult = tem.lastIndexOf(1), da = String(fx.dado_ate || '');
  const rs = new Map(); (Array.isArray(e.rs) ? e.rs : []).forEach(r => { if (Array.isArray(r) && Number.isInteger(r[0]) && r[0] >= 0 && r[0] < NL && Number.isInteger(r[1]) && r[1] >= 0 && r[1] < M && isFinite(r[2])) { let a = rs.get(r[0]); if (!a) rs.set(r[0], a = new Float64Array(M)); a[r[1]] += r[2]; } });
  const pb = e.pbi && Array.isArray(e.pbi.meses) && Array.isArray(e.pbi.f) ? {meses: e.pbi.meses.map(String), f: e.pbi.f.filter(r => Array.isArray(r) && Number.isInteger(r[0]) && r[0] >= 0 && r[0] < NL && Number.isInteger(r[1]) && r[1] >= 0 && r[1] < e.pbi.meses.length && isFinite(r[2])), fora: Array.isArray(e.pbi.fora) ? e.pbi.fora : [], nome: String(e.pbi.nome || 'Power BI')} : null;
  const nNome = new Map(); e.lojas.forEach(l => nNome.set(String(l.nome), (nNome.get(String(l.nome)) || 0) + 1));
  const parcI = meses.indexOf(String(fx.parcial || ''));
  return {gerado: DSO.gerado, meses, M, tem, parc: parcI, ateDia: da.length >= 10 ? `${da.slice(8, 10)}/${da.slice(5, 7)}` : '',
    lojas: e.lojas, skus: e.skus, dic, L, K, segMarca, col, f: null, aud: [], audN: new Map(), audSeg: null, vis: null, nomeDup: e.lojas.map(l => nNome.get(String(l.nome)) > 1),
    chavesLoja: CH, alvo, cob, fonteMes: e.fonte_mes || {}, rs, pbi: pb, regra: e.regra || {}, achados: Array.isArray(e.achados) ? e.achados : [], fonte: fx, RG, RGL, reg: reg0,
    corte: +meses[ult >= 0 ? (parcI === ult && ult > 0 && tem[ult - 1] ? ult - 1 : ult) : M - 1], ult26: +meses[M - 1],
    rodape: ['Reckitt · Governança CTO · MSL das lojas do canal indireto.', `Fonte: ${fx.nome || 'Colecta & Sales'} e lista oficial de lojas e SKUs do MSL. Uso interno.`]};
}
const MIC = {loja: r => r[1], sku: r => r[2], marca: r => D.K.marca[r[2]], segmento: r => D.K.segmento[r[2]],
  dist: r => D.L.dist[r[1]], rede: r => D.L.rede[r[1]], executivo: r => D.L.executivo[r[1]], perfil: r => D.L.perfil[r[1]], tipo: r => D.L.tipo[r[1]], lista: r => D.L.lista[r[1]]};
const EZM = {t: 0, c: 0, et: 0, ec: 0, rk: 0};
const miPorMarca = () => !!(D.regra && D.regra.media_por_marca);
const miLojaNome = (i, semCod) => esc(D.lojas[i].nome) + (!semCod && D.nomeDup[i] ? ` <small class="ex-codl">${esc(D.lojas[i].id)}</small>` : '');
const miCnpj = c => { const s = String(c); return s.length === 14 ? `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}` : s; };
const miDist = k => esc(dic.dist[k]);
const miRs = x => (isFinite(x) && x ? 'R$ ' + nf0.format(x) : '');

/* unidades da média (loja x mês, ou loja x mês x marca): t = quantas unidades, c = soma do MSL delas; et e ec = SKUs exigidos e positivados; rk = positivados em risco */
function miAgr(idx, chave, sub) {
  const U = new Map(), pm = miPorMarca();
  exCada(idx, r => {
    if (sub && !sub(r)) return;
    const g = chave ? chave(r) : 0, u = ((g * 64 + (pm ? D.K.marca[r[2]] : 0)) * 64 + r[0]) * 65536 + r[1];
    let o = U.get(u); if (!o) U.set(u, o = {t: 0, c: 0, r: 0}); o.t += r[3]; o.c += r[4]; o.r += r[5];
  });
  const out = new Map();
  U.forEach((o, u) => { if (!(o.t > 0)) return; const g = Math.floor(u / 268435456); let x = out.get(g); if (!x) out.set(g, x = {t: 0, c: 0, et: 0, ec: 0, rk: 0, lj: new Set()});
    x.t++; x.c += o.c / o.t; x.et += o.t; x.ec += o.c; x.rk += o.r; x.lj.add(u % 65536); });
  return out;
}
const miUm = (idx, sub) => miAgr(idx, null, sub).get(0) || EZM;
function miMeses(chave, sub) {   // Map grupo -> {t, c} mês a mês, com c / t = MSL médio (serve para exCurva e exSpark)
  const U = new Map(), pm = miPorMarca();
  exCada(null, r => {
    if (sub && !sub(r)) return;
    const g = chave ? chave(r) : 0, u = ((g * 64 + (pm ? D.K.marca[r[2]] : 0)) * 64 + r[0]) * 65536 + r[1];
    let o = U.get(u); if (!o) U.set(u, o = {t: 0, c: 0}); o.t += r[3]; o.c += r[4];
  });
  const out = new Map();
  U.forEach((o, u) => { if (!(o.t > 0)) return; const g = Math.floor(u / 268435456), m = Math.floor(u / 65536) % 64; let x = out.get(g); if (!x) out.set(g, x = {t: new Float64Array(D.M), c: new Float64Array(D.M)}); x.t[m]++; x.c[m] += o.c / o.t; });
  return out;
}
const miSerie = sub => miMeses(null, sub).get(0) || {t: new Float64Array(D.M), c: new Float64Array(D.M)};
function miLinhas(J, chave, sub) {   // uma linha por grupo: MSL médio no mês e no mesmo mês do ano anterior, faltas, peso nas faltas e impacto no MSL total
  const A = miAgr(J.idx, chave, sub), B = J.temAnt ? miAgr(J.ant, chave, sub) : new Map();
  let tt = 0, tc = 0, ft = 0; A.forEach(o => { tt += o.t; tc += o.c; ft += o.et - o.ec; });
  const mt = tt > 0 ? tc / tt : NaN;
  return [...new Set([...A.keys(), ...B.keys()])].map(k => {
    const a = A.get(k) || EZM, b = B.get(k) || EZM, m = msl(a), mb = msl(b);
    return {k, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.et - a.ec : NaN, peso: ft > 0 && a.t > 0 ? (a.et - a.ec) / ft : NaN, imp: tt > 0 && a.t > 0 ? (a.c - mt * a.t) / tt : NaN,
      w: a.et > 0 ? a.ec / a.et : NaN, wb: b.et > 0 ? b.ec / b.et : NaN, nl: a.lj ? a.lj.size : 0, nlb: b.lj ? b.lj.size : 0, rk: a.rk || 0};
  });
}
function miTotal(L) {
  const a = {t: 0, c: 0, et: 0, ec: 0, rk: 0}, b = {t: 0, c: 0, et: 0, ec: 0, rk: 0}, la = new Set(), lb = new Set();
  L.forEach(x => { ['t', 'c', 'et', 'ec', 'rk'].forEach(c => { a[c] += x.a[c] || 0; b[c] += x.b[c] || 0; }); if (x.a.lj) x.a.lj.forEach(l => la.add(l)); if (x.b.lj) x.b.lj.forEach(l => lb.add(l)); });
  const m = msl(a), mb = msl(b);
  return {k: -1, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.et - a.ec : NaN, peso: a.et - a.ec > 0 ? 1 : NaN, imp: NaN, w: a.et > 0 ? a.ec / a.et : NaN, wb: b.et > 0 ? b.ec / b.et : NaN, nl: la.size, nlb: lb.size, rk: a.rk};
}
function miTotalRecorte(J, sub) {   // a linha Total quando o grupo divide os SKUs (marca, segmento, SKU): o MSL das lojas no recorte, não a média dos grupos
  const a = miUm(J.idx, sub), b = J.temAnt ? miUm(J.ant, sub) : EZM, m = msl(a), mb = msl(b);
  return {k: -1, a, b, m, mb, d: m - mb, f: a.t > 0 ? a.et - a.ec : NaN, peso: a.et - a.ec > 0 ? 1 : NaN, imp: NaN, w: a.et > 0 ? a.ec / a.et : NaN, wb: b.et > 0 ? b.ec / b.et : NaN,
    nl: a.lj ? a.lj.size : 0, nlb: b.lj ? b.lj.size : 0, rk: a.rk || 0};
}
function miLojas(idx, sub) {   // MSL de cada loja no mês (soma das marcas ou média das marcas, conforme a regra): Map loja -> {m, et, ec, rk}
  const A = miAgr(idx, r => r[1], sub), out = new Map();
  A.forEach((o, l) => out.set(l, {m: msl(o), et: o.et, ec: o.ec, rk: o.rk}));
  return out;
}
const MI_FX = [[0, 'Zerada', 'down'], [0.25, 'Até 25%', 'down'], [0.5, '25% a 50%', 'warn'], [9, 'Acima de 50%', 'up']];
const miFaixa = m => (!isFinite(m) ? '<span class="vr flat">Sem dado no mês</span>' : m <= 0 ? '<span class="vr down">Zerada</span>' : m <= 0.25 ? '<span class="vr down">Até 25%</span>' : m <= 0.5 ? '<span class="vr warn">25% a 50%</span>' : '<span class="vr up">Acima de 50%</span>');
function miResumo(J, sub) {
  const a = miUm(J.idx, sub), b = J.temAnt ? miUm(J.ant, sub) : EZM, y = miUm(J.ano, sub), yb = J.temAnoAnt ? miUm(J.anoAnt, sub) : EZM;
  const LJ = miLojas(J.idx, sub); let zero = 0, acima = 0; LJ.forEach(o => { if (o.ec === 0) zero++; if (o.m > 0.5) acima++; });
  const LB = J.temAnt ? miLojas(J.ant, sub) : new Map(); let zerob = 0; LB.forEach(o => { if (o.ec === 0) zerob++; });
  return {a, b, m: msl(a), mb: msl(b), d: msl(a) - msl(b), w: a.et > 0 ? a.ec / a.et : NaN, wb: b.et > 0 ? b.ec / b.et : NaN, f: a.et - a.ec, fb: J.temAnt ? b.et - b.ec : NaN,
    n: LJ.size, nb: J.temAnt ? LB.size : NaN, zero, zerob: J.temAnt ? zerob : NaN, acima, rk: a.rk, et: a.et, my: msl(y), myb: msl(yb)};
}

/* janela: o mês vigente (o MSL do mês já cobre os 3 meses) contra o mesmo mês do ano anterior; ano = média dos meses do ano até o vigente */
function miJanela() {
  let v = D.meses.indexOf(String(S.corte)); if (v < 0 || !D.tem[v]) v = D.meses.indexOf(String(D.corte));
  const Y = +D.meses[v].slice(0, 4), menos1 = i => D.meses.indexOf(`${+D.meses[i].slice(0, 4) - 1}${D.meses[i].slice(4)}`);
  const a1 = menos1(v), ant = a1 >= 0 && D.tem[a1] ? [a1] : [];
  const anoI = D.meses.map((_, i) => i).filter(i => +D.meses[i].slice(0, 4) === Y && i <= v && D.tem[i]), anoAnt = anoI.map(menos1).filter(i => i >= 0 && D.tem[i]);
  const jan = i => `${mes(+D.meses[Math.max(0, i - 2)].slice(4))} a ${mes(+D.meses[i].slice(4))}`;
  const tri = [v - 2, v - 1, v].filter(i => i >= 0 && D.tem[i]);
  return {v, Y, idx: [v], ant, temAnt: ant.length === 1, ano: anoI, anoAnt, temAnoAnt: anoAnt.length > 0 && anoAnt.length === anoI.length,
    temY0: D.meses.some((m, i) => +m.slice(0, 4) === Y - 1 && D.tem[i]), parc: v === D.parc, a5: String(Y - 1).slice(2), a6: String(Y).slice(2), tri,
    txt: exRot(v), jan: jan(v), antTxt: ant.length ? exRot(a1) : String(Y - 1), anoTxt: exFaixaTxt(anoI), anoAntTxt: anoAnt.length ? exFaixaTxt(anoAnt) : String(Y - 1)};
}
const miTxtMes = J => `${esc(J.txt)} (compras de ${esc(J.jan)})`;
const miRegNome = () => { const x = D.RGL.find(([k]) => k === D.reg); return x ? x[1] : ''; };

/* data da fonte, selo e recorte */
const fontesMi = () => [fonte('msl_indireto')].filter(Boolean);
function validadeMi() {
  const f = fonte('msl_indireto');
  if (!f) return {velho: false, parcial: D.parc === D.M - 1, txt: `MSL até ${exRot(D.M - 1).replace('*', '')}`};
  const velho = fechadoFonte(f) < mesEsperado();
  return {velho, parcial: !!f.parcial, txt: `MSL até ${f.ate_txt}${f.parcial ? ` · parcial até ${String(f.ate_dia).slice(0, 5)}` : ''}${f.extraido ? ` · Colecta de ${f.extraido.slice(0, 5)}` : ''}${velho ? ` · ${faltaFonte(f).toLowerCase()}` : ''}`};
}
const topoMi = () => { const f = fonte('msl_indireto'); return ['MSL Indireto', f && f.extraido ? `${f.nome} de ${f.extraido.slice(0, 5)}` : '', `site de ${DSO.gerado.slice(0, 5)}`].filter(Boolean).join(' · '); };
function miNotaParcial() {
  const J = miJanela();
  return J.parc && D.parc >= 0 ? `* ${exRot(D.parc).replace('*', '')} parcial até ${D.ateDia}: a loja ainda pode completar a unidade mínima até o fim do mês; o MSL do mês só cresce até o fechamento.` : '';
}
function linhasRecorteMi() {
  const J = miJanela(), f = fonte('msl_indireto');
  const L = [['Perna', 'MSL Indireto'], ['Página', PAGES.find(p => p[0] === S.page)[1]], ['Mês vigente', exRot(J.v) + (J.v === D.parc ? ` (parcial até ${D.ateDia})` : '')],
    ['Janela das compras', J.jan], ['Régua', miRegNome()], ['Comparação', J.temAnt ? `mesmo mês de ${J.Y - 1}: ${J.antTxt}` : `sem o mesmo mês em ${J.Y - 1}`],
    ['Regra', D.regra.texto || 'MSL da loja = SKUs positivados sobre SKUs exigidos do perfil; MSL do recorte = média das lojas']];
  if (miNotaParcial()) L.push(['Mês parcial', miNotaParcial()]);
  FILTROS.forEach(([k, n]) => L.push([n, S.f[k].size ? [...S.f[k]].map(i => dic[k][i]).join(', ') : 'Todos']));
  if (S.page === 'mi-lojas' && S.ui.mibusca) L.push(['Busca na tabela', S.ui.mibusca]);
  L.push(['Site publicado em', DSO.gerado]);
  if (f) L.push([`Fonte ${f.nome}`, `${quandoFonte(f)}${f.hora ? ' (extração às ' + f.hora + ')' : ''}${f.obs ? '. ' + f.obs : ''}`]);
  (D.fonte.obs || []).forEach((x, i) => L.push([`Premissa ${i + 1}`, String(x)]));
  L.push(['Exportado em', new Date().toLocaleString('pt-BR')], ['Link desta visão', location.href]);
  return L;
}

/* componentes */
function miKpis(R, J, quais) {
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${d}<span>${sub}</span></div></div>`;
  const ant = J.antTxt, pv = x => (isFinite(x) ? p1(x) : 'sem dado'), neutro = x => (isFinite(x) ? `<span class="vbig flat">${pc(x)}</span>` : '');
  const C = [
    () => card(`MSL · ${esc(J.txt)}`, pv(R.m), vpp(R.d), J.temAnt && isFinite(R.mb) ? `média das lojas, contra ${p1(R.mb)} em ${esc(ant)}` : `média das lojas; compras de ${esc(J.jan)}`),
    () => card('MSL ponderado', pv(R.w), vpp(R.w - R.wb), `SKUs positivados sobre exigidos, somando as lojas${J.temAnt && isFinite(R.wb) ? ` · ${p1(R.wb)} em ${esc(ant)}` : ''}`),
    () => card('Lojas medidas', n0(R.n), vbig(varr(R.n, R.nb)), `lojas da lista com o distribuidor no ar no mês${J.temAnt ? ` · ${n0(R.nb)} em ${esc(ant)}` : ''}`),
    () => card('Lojas zeradas', n0(R.zero), neutro(varr(R.zero, R.zerob)), `nenhum SKU do mix na unidade mínima (${p1(R.n ? R.zero / R.n : NaN)} das lojas)${J.temAnt ? ` · ${n0(R.zerob)} em ${esc(ant)}` : ''}`),
    () => card('SKUs em falta', n0(R.f), neutro(varr(R.f, R.fb)), `de ${n0(R.et)} exigidos, somando as lojas${J.temAnt ? ` · ${n0(R.fb)} em ${esc(ant)}` : ''}`),
    () => card('Em risco', n0(R.rk), '', 'SKUs positivados só pela compra do mês mais antigo da janela: saem no mês seguinte se a loja não recomprar'),
    () => card(`MSL no ano · ${esc(J.anoTxt)}`, pv(R.my), vpp(R.my - R.myb), J.temAnoAnt && isFinite(R.myb) ? `média dos meses, contra ${p1(R.myb)} em ${esc(J.anoAntTxt)}` : 'média dos meses do ano')];
  const q = quais || [0, 1, 2, 3, 4, 6];
  return `<div class="grid ${q.length === 4 ? 'g4' : 'g3'}">${q.map(i => C[i]()).join('')}</div>`;
}
function miTabJanela(t, rot, L, nomeFn, J, opc = {}) {   // grupo a grupo: MSL do mês contra o mesmo mês do ano anterior, curva, lojas, faltas, peso e impacto
  const tot = opc.tot || miTotal(L), sel = opc.sel ? String(S.ui[opc.sel] ?? '') : null, sem = s => semAcento(String(s).replace(/<[^>]+>/g, ''));
  const cols = [{c: rot, v: x => sem(nomeFn(x.k)), l: true, b: true, t: () => 'Total',
      h: x => (opc.sel ? `<button class="lnk" data-act="ui" data-k="${opc.sel}" data-v="${String(x.k) === sel ? '' : x.k}">${nomeFn(x.k)}</button>` : nomeFn(x.k))},
    {c: `MSL ${J.a5}`, v: x => x.mb, h: x => p1(x.mb), t: true}, {c: `MSL ${J.a6}`, v: x => x.m, h: x => p1(x.m), b: true, t: true}, {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d), t: true}];
  if (opc.spark) cols.push({c: `Curva ${J.a5} · ${J.a6}`, h: x => exSpark(opc.spark.get(x.k), J), oc: true});
  cols.push(...(opc.extraCedo || []));
  if (!opc.semLojas) cols.push({c: 'Lojas', v: x => x.nl, h: x => n0(x.nl), t: true});
  cols.push({c: `Faltas ${J.a6}`, v: x => x.f, h: x => n0(x.f), t: true}, {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true});
  if (!opc.compacto) cols.push({c: 'Impacto no MSL', v: x => x.imp, h: x => vppt(x.imp)}, {c: 'Ponderado', v: x => x.w, h: x => p1(x.w), t: true, oc: true},
    {c: 'Exigidos', v: x => x.a.et, h: x => n0(x.a.et), t: x => n0(x.a.et), oc: true}, {c: 'Positivados', v: x => x.a.ec, h: x => n0(x.a.ec), t: x => n0(x.a.ec), oc: true},
    {c: 'Em risco', v: x => x.rk, h: x => n0(x.rk), t: x => n0(x.rk), oc: true});
  cols.push(...(opc.extra || []));
  return exTabela(t, L, cols, {tot, padrao: opc.padrao, on: opc.sel ? x => String(x.k) === sel : null});
}
const miSegMM = () => { const med = S.ui.mimm || 'msl'; return `<div class="seg">${[['msl', 'MSL %'], ['lojas', 'Lojas medidas']].map(([k, n]) => `<button data-act="ui" data-k="mimm" data-v="${k}" class="${k === med ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
function miTabMeses(rot, keys, nomeFn, Mp, J, serieTot) {   // matriz grupo x mês: MSL médio (ou lojas medidas); serieTot = a linha Total quando o grupo divide os SKUs
  const Y = J.Y, idx = [], med = S.ui.mimm || 'msl';
  for (const y of [Y - 1, Y]) for (let m = 1; m <= 12; m++) { const i = D.meses.indexOf(`${y}${String(m).padStart(2, '0')}`); if (i >= 0 && i <= J.v && D.tem[i]) idx.push(i); }
  const ks = keys.filter(k => Mp.has(k)); if (!ks.length) return '<div class="empty">Nada neste recorte.</div>';
  let tt = new Float64Array(D.M), tc = new Float64Array(D.M); ks.forEach(k => { const o = Mp.get(k); idx.forEach(i => { tt[i] += o.t[i]; tc[i] += o.c[i]; }); });
  if (serieTot) { tt = serieTot.t; tc = serieTot.c; }
  const cel = (t_, c_) => (!(t_ > 0) ? '' : med === 'lojas' ? n0(t_) : p1(c_ / t_));
  const linha = (nome, a, b, c) => `<tr class="${c || ''}"><td class="l b">${nome}</td>${idx.map(i => `<td class="${i === J.v ? 'b' : ''}">${cel(a[i], b[i])}</td>`).join('')}</tr>`;
  return `<div class="tw fim"><table><thead><tr><th class="l">${rot}</th>${idx.map(i => `<th>${exRot(i)}</th>`).join('')}</tr></thead><tbody>` +
    ks.map(k => linha(nomeFn(k), Mp.get(k).t, Mp.get(k).c)).join('') + linha('Total', tt, tc, 'tot') + '</tbody></table></div>' +
    `<p class="note" style="margin:10px 0 0">${med === 'lojas' ? `Lojas medidas = ${miPorMarca() ? 'loja x marca exigida' : 'lojas'} com o distribuidor no ar no mês.` : 'MSL médio das lojas no mês; cada mês já lê as compras dos 3 meses.'} Em negrito, o mês vigente.</p>`;
}
function miConclusao(L, nomeFn, J, plural) {
  const comp = L.filter(x => x.a.t > 0 && x.b.t > 0 && isFinite(x.d)), med = L.filter(x => x.a.t > 0);
  if (!med.length) return `Sem lojas medidas em ${esc(J.txt)}.`;
  if (J.temAnt && comp.length > 1) {
    const c = {up: 0, flat: 0, down: 0}; comp.forEach(x => { c[x.d >= 0.01 ? 'up' : x.d <= -0.01 ? 'down' : 'flat']++; });
    const p = [c.up ? `${c.up} ${c.up > 1 ? 'sobem' : 'sobe'}` : '', c.flat ? `${c.flat} ${c.flat > 1 ? 'ficam estáveis' : 'fica estável'}` : '', c.down ? `${c.down} ${c.down > 1 ? 'caem' : 'cai'}` : ''].filter(Boolean);
    const pior = comp.reduce((a, b) => (b.d < a.d ? b : a)), melhor = comp.reduce((a, b) => (b.d > a.d ? b : a));
    return `${p.length > 1 ? p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1] : p[0]}; ` + (pior.d <= -0.005 ? `${nomeFn(pior.k)} é a maior queda (${ppTxt(pior.d)}, ${p1(pior.m)}).` : `${nomeFn(melhor.k)} é a maior alta (${ppTxt(melhor.d)}, ${p1(melhor.m)}).`);
  }
  const mx = med.reduce((a, b) => (b.m > a.m ? b : a)), mn = med.reduce((a, b) => (b.m < a.m ? b : a));
  return med.length === 1 ? `${nomeFn(mx.k)} com ${p1(mx.m)}.` : `${n0(med.length)} ${plural} medidas; ${nomeFn(mx.k)} tem o maior MSL (${p1(mx.m)}) e ${nomeFn(mn.k)} o menor (${p1(mn.m)}).`;
}
function miOrdemMarcas(L) {
  const p = x => { const i = EX_CTO.indexOf(String(dic.marca[x.k]).toUpperCase()); return i < 0 ? 9 : i; };
  return L.sort((a, b) => p(a) - p(b) || b.a.et - a.a.et || b.b.et - a.b.et);
}
function miRS(l, J) {   // sell out R$ da loja no distribuidor dela: o mês vigente e a média dos 3 meses da janela
  const a = D.rs.get(l); if (!a) return {mes: 0, jan: 0};
  const v = J.v; return {mes: a[v] || 0, jan: ((a[v] || 0) + (v > 0 ? a[v - 1] || 0 : 0) + (v > 1 ? a[v - 2] || 0 : 0)) / 3};
}
function miTabLojas(t, J, sub, opc = {}) {   // loja a loja: MSL do mês, o mesmo mês do ano anterior, faixa, faltas, em risco e o sell out da loja
  const A = miLojas(J.idx, sub), B = J.temAnt ? miLojas(J.ant, sub) : new Map(), Mm = miMeses(MIC.loja, sub);
  let L = [...new Set([...A.keys(), ...B.keys()])].map(k => { const a = A.get(k) || {m: NaN, et: 0, ec: 0, rk: 0}, b = B.get(k) || {m: NaN}; return {k, a, m: a.m, mb: b.m, d: a.m - b.m, rs: miRS(k, J)}; });
  const q = semAcento(String(opc.busca || '').trim());
  if (q) L = L.filter(x => { const l = D.lojas[x.k]; return semAcento([l.nome, l.id, l.rede, l.dist, l.executivo, l.perfil].join(' ')).includes(q); });
  const lj = x => D.lojas[x.k], sel = String(S.ui.selloja ?? ''), aqui = (opc.link || 'ui') === 'ui';
  const med = L.filter(x => isFinite(x.m)), mT = med.length ? med.reduce((s, x) => s + x.m, 0) / med.length : NaN;
  const cols = [
    {c: 'Loja', v: x => semAcento(lj(x).nome), l: true, b: true, k: 'nm', t: () => `Média · ${n0(med.length)} lojas medidas`,
      h: x => (aqui ? `<button class="lnk" data-act="ui" data-k="selloja" data-v="${String(x.k) === sel ? '' : x.k}">${miLojaNome(x.k)}</button>`
        : `<button class="lnk" data-act="exir" data-pg="mi-lojas" data-k="selloja" data-v="${x.k}">${miLojaNome(x.k)}</button>`)},
    {c: `MSL ${J.a6}`, v: x => x.m, h: x => p1(x.m), b: true, t: () => p1(mT)}, {c: `MSL ${J.a5}`, v: x => x.mb, h: x => p1(x.mb)}, {c: 'Δ pp', v: x => x.d, h: x => vppt(x.d)},
    {c: 'Faixa', v: x => x.m, l: true, h: x => miFaixa(x.m)}, {c: 'Positivados', v: x => x.a.ec, h: x => (x.a.et ? `${n0(x.a.ec)} de ${n0(x.a.et)}` : '')},
    {c: `Faltas ${J.a6}`, v: x => x.a.et - x.a.ec, h: x => (x.a.et ? n0(x.a.et - x.a.ec) : '')}, {c: 'Em risco', v: x => x.a.rk, h: x => (x.a.et ? n0(x.a.rk) : '')},
    {c: `Sell out ${esc(J.txt)}`, v: x => x.rs.mes, h: x => (x.rs.mes ? miRs(x.rs.mes) : '')},
    ...(opc.semRede ? [] : [{c: 'Rede', v: x => lj(x).rede, l: true, h: x => esc(lj(x).rede)}]),
    ...(opc.semDist ? [] : [{c: 'Distribuidor', v: x => lj(x).dist, l: true, h: x => esc(lj(x).dist)}]),
    {c: 'Perfil', v: x => lj(x).perfil, l: true, h: x => esc(lj(x).perfil)}, {c: 'Tipo', v: x => lj(x).tipo, l: true, h: x => esc(lj(x).tipo), oc: true},
    ...(opc.semExec ? [] : [{c: 'Executivo', v: x => lj(x).executivo, l: true, h: x => esc(lj(x).executivo), oc: true}]),
    {c: `Curva ${J.a5} · ${J.a6}`, h: x => exSpark(Mm.get(x.k), J), oc: true}, {c: 'CNPJ', v: x => lj(x).id, l: true, k: 'ex-cod', h: x => esc(miCnpj(lj(x).id)), oc: true}];
  return exTabela(t, L, cols, {tot: {}, padrao: '-' + cols.findIndex(c => c.c === `MSL ${J.a6}`), on: aqui ? x => String(x.k) === sel : null}) +
    `<p class="note" style="margin:10px 0 0">${aqui ? 'Clique no nome para abrir a loja; no título da coluna, para ordenar.' : 'Clique no nome para abrir a loja na página Lojas.'} Sell out = R$ que a loja comprou do distribuidor dela no mês (todas as marcas Reckitt). Loja sem dado no mês aparece no fim.</p>`;
}
function miDetLoja(k, J) {
  const l = D.lojas[k], sub = r => r[1] === k, R = miResumo(J, sub);
  let h = `<div class="det"><h2 class="sec">${miLojaNome(k, true)}. <span>${esc(l.rede)} · ${esc(l.dist)} · perfil ${esc(l.perfil)} · ${esc(l.tipo)} · ${esc(l.executivo)} · CNPJ ${esc(miCnpj(l.id))}.</span></h2>` + miKpis(R, J, [0, 4, 5, 6]);
  h += `<div class="card"><p class="eyebrow">MSL mês a mês da loja</p>${exCurva(miSerie(sub), J)}</div>`;
  const rs = D.rs.get(k);
  if (rs) { const o = {t: new Float64Array(D.M), c: new Float64Array(D.M)}; let mx = 0; rs.forEach(v => { mx = Math.max(mx, v); });
    h += `<div class="card"><p class="eyebrow">Sell out da loja no distribuidor · R$ por mês</p><div class="tw fim"><table><thead><tr><th class="l">Mês</th>${D.meses.map((_, i) => (i <= J.v ? `<th>${exRot(i)}</th>` : '')).join('')}</tr></thead><tbody><tr><td class="l b">R$</td>${D.meses.map((_, i) => (i <= J.v ? `<td class="${i === J.v ? 'b' : ''}">${rs[i] ? miRs(rs[i]) : ''}</td>` : '')).join('')}</tr></tbody></table></div>
      <p class="note" style="margin:10px 0 0">Todas as marcas Reckitt que a loja comprou do distribuidor dela. Loja que compra e não tem o mix é oportunidade de sortimento; loja que não compra é cobertura.</p></div>`; }
  const LM = miOrdemMarcas(miLinhas(J, MIC.marca, sub).filter(x => x.a.t > 0 || x.b.t > 0)), LS = miLinhas(J, MIC.segmento, sub).filter(x => x.a.t > 0).sort((a, b) => a.m - b.m || b.a.et - a.a.et);
  const TR = miTotalRecorte(J, sub);
  h += `<div class="grid g2"><div class="card"><p class="eyebrow">Marca a marca</p>${miTabJanela('mlm', 'Marca', LM, exMarcaNome, J, {compacto: true, semLojas: true, tot: TR})}</div>
    <div class="card"><p class="eyebrow">Segmento a segmento</p>${miTabJanela('mls', 'Marca · segmento', LS, exSegNome, J, {compacto: true, semLojas: true, tot: TR})}</div></div>`;
  const FS = []; exCada(J.idx, r => { if (r[1] === k) FS.push({k: r[2], c: r[4], rk: r[5]}); });
  const MS = new Map(); exCada(null, r => { if (r[1] === k) { let a = MS.get(r[2]); if (!a) MS.set(r[2], a = new Int8Array(D.M).fill(-1)); a[r[0]] = r[4]; } });
  const ultimo = s => { const a = MS.get(s); if (!a) return ''; for (let i = J.v; i >= 0; i--) if (a[i] === 1) return exRot(i); return 'nunca na base'; };
  const falt = FS.filter(x => !x.c).sort((a, b) => String(dic.marca[D.K.marca[a.k]]).localeCompare(String(dic.marca[D.K.marca[b.k]])) || String(D.skus[a.k].desc).localeCompare(String(D.skus[b.k].desc)));
  const risco = FS.filter(x => x.c && x.rk);
  h += `<div class="card"><p class="eyebrow">SKUs do mix em falta · ${esc(J.txt)}</p>${exTabela('mlf' + k, falt, [
    {c: 'SKU', l: true, b: true, k: 'sk', v: x => semAcento(D.skus[x.k].desc || ''), h: x => exSkuNome(x.k)}, {c: 'Marca', l: true, v: x => dic.marca[D.K.marca[x.k]], h: x => exMarcaNome(D.K.marca[x.k])},
    {c: 'Segmento', l: true, v: x => dic.segmento[D.K.segmento[x.k]], h: x => esc(dic.segmento[D.K.segmento[x.k]])}, {c: 'Último mês positivado', l: true, h: x => esc(ultimo(x.k))},
    {c: 'EAN', l: true, k: 'ex-cod', v: x => D.skus[x.k].cod, h: x => esc(D.skus[x.k].cod), oc: true}])}
    <p class="note" style="margin:10px 0 0">Falta = SKU exigido no perfil da loja que ela não comprou na unidade mínima nos 3 meses. ${risco.length ? `Em risco: ${n0(risco.length)} ${risco.length > 1 ? 'SKUs só estão' : 'SKU só está'} no mix pela compra de 2 meses atrás (${risco.slice(0, 6).map(x => exSkuNome(x.k)).join(', ')}${risco.length > 6 ? ' e outros' : ''}).` : ''}</p></div>`;
  return h + '</div>';
}
function miLeitura(J, R) {
  if (!(R.a.t > 0)) return `<div class="card"><div class="empty">Sem lojas medidas neste recorte em ${esc(J.txt)}.</div></div>`;
  const L = [], lista = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '');
  L.push(`MSL de ${p1(R.m)} em ${esc(J.txt)} (média das ${n0(R.n)} lojas medidas; compras de ${esc(J.jan)})${J.temAnt && isFinite(R.mb) ? `, ${ppTxt(R.d)} sobre ${esc(J.antTxt)} (${p1(R.mb)})` : ''}. Somando as lojas, ${n0(R.a.ec)} de ${n0(R.et)} SKUs exigidos estão positivados (${p1(R.w)}).`);
  if (R.zero) L.push(`${n0(R.zero)} ${R.zero > 1 ? 'lojas estão zeradas' : 'loja está zerada'} (${p1(R.zero / R.n)}): não compraram nenhum SKU do mix na unidade mínima. Antes de mix, é cobertura: a loja precisa voltar a comprar do distribuidor.`);
  const DI = miLinhas(J, MIC.dist).filter(x => x.a.t > 0), DIm = [...DI].sort((a, b) => b.m - a.m), DIi = [...DI].sort((a, b) => a.imp - b.imp);
  if (DI.length > 1) L.push(`Entre os distribuidores, ${miDist(DIm[0].k)} tem o maior MSL (${p1(DIm[0].m)}) e ${miDist(DIm[DIm.length - 1].k)} o menor (${p1(DIm[DIm.length - 1].m)}); quem mais tira do total é ${miDist(DIi[0].k)} (${ppTxt(DIi[0].imp)}, ${n0(DIi[0].nl)} lojas).`);
  const MK = miLinhas(J, MIC.marca).filter(x => x.a.t > 0 && x.b.t > 0 && isFinite(x.d)), nm = k => esc(dic.marca[k]);
  const sobe = MK.filter(x => x.d >= 0.005).sort((a, b) => b.d - a.d).slice(0, 3), cai = MK.filter(x => x.d <= -0.005).sort((a, b) => a.d - b.d).slice(0, 3);
  if (J.temAnt && sobe.length) L.push(`Ganha em ${lista(sobe.map(x => `${nm(x.k)} (${ppTxt(x.d)}, ${p1(x.m)})`))}.`);
  if (J.temAnt && cai.length) L.push(`Cai em ${lista(cai.map(x => `${nm(x.k)} (${ppTxt(x.d)}, ${p1(x.m)})`))}.`);
  const SK = miLinhas(J, MIC.sku).filter(x => x.f > 0).sort((a, b) => b.f - a.f)[0];
  if (SK) L.push(`A maior falta é ${exSkuNome(SK.k)} (${esc(D.skus[SK.k].marca)}): falta em ${n0(SK.f)} lojas, ${p1(SK.peso)} das faltas do mês.`);
  if (R.rk) L.push(`${n0(R.rk)} SKUs positivados estão em risco: só contam pela compra de ${esc(mes(+D.meses[Math.max(0, J.v - 2)].slice(4)))}; se a loja não recomprar, saem no mês seguinte.`);
  return `<div class="card"><ol class="num">${L.map(x => `<li><span>${x}</span></li>`).join('')}</ol></div>`;
}

/* ----- páginas ----- */
function pgMiInicio() {
  const J = miJanela(), R = miResumo(J);
  const side = `<div class="side">${(DSO.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>${esc(J.txt)} · compras de ${esc(J.jan)} · ${n0(R.n)} lojas medidas<br>Régua <span class="lk">${esc(miRegNome())}</span></div>`;
  let h = hero('', 'MSL Indireto.', 'O mix mínimo nas lojas do canal indireto, mês a mês.', side);
  h += miKpis(R, J);
  h += `<h2 class="sec">A leitura. <span>Onde ganha e onde cai, calculada sobre o recorte marcado.</span></h2>` + miLeitura(J, R);
  h += `<h2 class="sec">A curva do MSL. <span>Mês a mês; cada mês já lê as compras dos 3 meses.</span></h2><div class="card"><p class="eyebrow">MSL médio das lojas · ${J.temY0 ? `${J.Y - 1} e ` : ''}${J.Y}</p>${exCurva(miSerie(), J)}${miNotaFonteCurva()}</div>`;
  const DI = miLinhas(J, MIC.dist).filter(x => x.a.t > 0).sort((a, b) => b.nl - a.nl), Mm = miMeses(MIC.dist);
  h += `<h2 class="sec">Os distribuidores. <span>MSL do mês e a variação contra o mesmo mês do ano anterior.</span></h2><div class="grid g3">${DI.map(x => `<a class="card" href="#mi-redes" data-act="exir" data-pg="mi-redes" data-k="seldist" data-v="${x.k}">
    <p class="eyebrow">${miDist(x.k)}</p><div class="kpi"><div class="val" style="font-size:30px">${p1(x.m)}</div><div class="sub">${[isFinite(x.d) ? vppt(x.d) + ' sobre ' + esc(J.antTxt) : '', `${n0(x.nl)} lojas`].filter(Boolean).join(' · ')}</div></div>${exSpark(Mm.get(x.k), J)}</a>`).join('')}</div>`;
  const IDX = [['mi-dados', 'Dados gerais', 'Mês, trimestre e ano, e as abas Distribuidor, Perfil, Tipo de loja, Marca, Segmento e Lista, com o mês a mês.'],
    ['mi-diretor', 'Visão do Diretor', 'Os números do mês, os distribuidores, redes e lojas que mais puxam o MSL para baixo e as faltas que mais pesam.'],
    ['mi-redes', 'Distribuidores e redes', 'MSL por distribuidor e por rede; ao abrir, as lojas e a matriz marca x mês.'],
    ['mi-lojas', 'Lojas', 'Todas as lojas da lista, com busca, faixa, faltas, em risco e o sell out da loja no distribuidor.'],
    ['mi-executivos', 'Executivos', 'MSL da carteira de cada executivo, a pior marca e as lojas de cada um.'],
    ['mi-skus', 'SKUs e faltas', 'Os SKUs do mix que mais faltam, marca a marca, e as lojas onde cada um falta.'],
    ['mi-auditoria', 'Auditoria do PBI', 'O número oficial do Power BI contra o recálculo loja a loja, e o que a apuração precisa corrigir.']];
  h += `<h2 class="sec">O índice. <span>A mesma lógica do MSL Direto.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como ler. <span>Regras da perna MSL Indireto.</span></h2><div class="card"><ol class="num">${(D.regra.como_ler || [
    'Base: as lojas da lista oficial do MSL do trimestre (PDV Premiado Diamond e Gold, Lista MSL e Exclusiva) e, para cada perfil de loja, a lista oficial de SKUs exigidos.',
    'O SKU está positivado quando a loja comprou do próprio distribuidor pelo menos a unidade mínima nos 3 meses: o mês e os 2 anteriores. Por isso o MSL de cada mês já é a leitura de 3 meses.',
    'MSL da loja = SKUs positivados sobre SKUs exigidos. O MSL do recorte é a média das lojas, como o "Média de MSL" do Power BI. O ponderado soma os SKUs de todas as lojas.',
    'Lojas zeradas não compraram nenhum SKU do mix na unidade mínima: antes de mix, é cobertura. Em risco = SKU que só conta pela compra do mês mais antigo da janela.',
    'O seletor Mês vigente muda o mês do site inteiro. A comparação é sempre contra o mesmo mês do ano anterior.',
    'Distribuidor, Rede, Executivo, Perfil, Tipo de loja e Lista filtram lojas; Marca e Segmento filtram SKUs. O link da página guarda o recorte e o mês.']).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
  if ((D.fonte.obs || []).length) h += `<h2 class="sec">Como ler a base. <span>Premissas da extração.</span></h2><div class="card"><ol class="num">${D.fonte.obs.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
  return h;
}
function miNotaFonteCurva() {   // de onde vem cada mês da curva (Colecta ou MTRIX), por distribuidor do recorte
  const fm = D.fonteMes || {}, ds = S.f.dist.size ? [...S.f.dist].map(i => dic.dist[i]) : dic.dist, part = [];
  ds.forEach(d => { const a = fm[d]; if (!Array.isArray(a)) return; const mt = a.map((x, i) => (x === 'M' ? i : -1)).filter(i => i >= 0 && D.tem[i]); if (mt.length) part.push(`${esc(d)}: ${exFaixaTxt(mt)}`); });
  return part.length ? `<p class="note" style="margin:10px 0 0">Meses lidos na MTRIX (o distribuidor ainda não estava no Colecta): ${part.join(' · ')}. Os demais meses são do Colecta.</p>` : '';
}

function miTabPeriodos(J) {
  const Y1 = D.meses.map((_, i) => i).filter(i => +D.meses[i].slice(0, 4) === J.Y - 1 && D.tem[i]);
  const P = [[`Mês vigente · ${J.txt}`, J.idx], ...(J.temAnt ? [[`Mesmo mês · ${J.antTxt}`, J.ant]] : []), ...(J.tri.length > 1 ? [[`Últimos 3 meses · ${exFaixaTxt(J.tri)} (média)`, J.tri]] : []),
    [`Ano ${J.Y} · ${J.anoTxt} (média)`, J.ano], ...(J.temAnoAnt ? [[`Mesmo período ${J.Y - 1} · ${J.anoAntTxt}`, J.anoAnt]] : []), ...(Y1.length ? [[`Ano ${J.Y - 1} (média)`, Y1]] : [])];
  const linhas = P.map(([n, idx]) => { const o = miUm(idx); const LJ = miLojas(idx); let z = 0; LJ.forEach(x => { if (x.ec === 0) z++; }); return {n, o, nl: o.lj ? o.lj.size : 0, z}; });
  return `<div class="tw"><table><thead><tr><th class="l">Período</th><th>MSL (média)</th><th>Ponderado</th><th>Exigidos</th><th>Positivados</th><th>Faltas</th><th>Lojas</th><th>Zeradas</th></tr></thead><tbody>` +
    linhas.map(x => `<tr><td class="l b">${esc(x.n)}</td><td class="b">${n2p(msl(x.o))}</td><td>${n2p(x.o.et ? x.o.ec / x.o.et : NaN)}</td><td>${n0(x.o.et)}</td><td>${n0(x.o.ec)}</td><td>${n0(x.o.et - x.o.ec)}</td><td>${n0(x.nl)}</td><td>${n0(x.z)}</td></tr>`).join('') +
    `</tbody></table></div><p class="note" style="margin:10px 0 0">Nos períodos de mais de um mês, o MSL é a média das lojas em cada mês (como o PBI lê o trimestre); exigidos e positivados somam os meses; lojas = lojas distintas medidas no período.</p>`;
}
function pgMiDados() {
  const J = miJanela(), R = miResumo(J), ab = S.ui.miab || 'dist', sub = `${miTxtMes(J)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}`;
  let h = hero('Dados gerais', 'MSL por distribuidor, perfil, marca e segmento.', `${miTxtMes(J)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`) + miKpis(R, J);
  h += `<h2 class="sec">Mês, trimestre e ano. <span>Os totais para conferir com o PBI.</span></h2><div class="card"><p class="eyebrow">Totais por período</p>${miTabPeriodos(J)}</div>`;
  const AB = [['dist', 'Distribuidor', MIC.dist, k => miDist(k)], ['perfil', 'Perfil da loja', MIC.perfil, k => esc(dic.perfil[k])], ['tipo', 'Tipo de loja', MIC.tipo, k => esc(dic.tipo[k])],
    ['marca', 'Marca', MIC.marca, exMarcaNome], ['segmento', 'Segmento', MIC.segmento, exSegNome], ['lista', 'Lista', MIC.lista, k => esc(dic.lista[k])]];
  h += `<div class="pills" style="margin:28px 0 0">${AB.map(([k, n]) => `<button data-act="ui" data-k="miab" data-v="${k}" class="${k === ab ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const TT = {dist: 'Distribuidor a distribuidor', perfil: 'Perfil a perfil', tipo: 'Tipo de loja', marca: 'Marca a marca', segmento: 'Segmento a segmento', lista: 'Lista a lista'};
  const TR = miTotalRecorte(J), ST = miSerie();
  (S.ui.miabtodas ? AB : [AB.find(x => x[0] === ab) || AB[0]]).forEach(([k, n, ch, nf]) => {
    const div = k === 'marca' || k === 'segmento';   // divide os SKUs: o Total é o MSL das lojas no recorte
    let L = miLinhas(J, ch).filter(x => x.a.t > 0 || x.b.t > 0); L = k === 'marca' ? miOrdemMarcas(L) : L.sort((a, b) => b.a.et - a.a.et);
    const Mm = miMeses(ch);
    h += `<h2 class="sec">${TT[k]}. <span>${sub}.</span></h2><div class="card"><p class="eyebrow">${n} · mês vigente</p>${miTabJanela('mdx' + k, n, L, nf, J, {spark: Mm, semLojas: div, tot: div ? TR : null})}</div>` +
      `<div class="card"><p class="eyebrow">${n} · mês a mês</p>${miSegMM()}${miTabMeses(n, L.map(x => x.k), nf, Mm, J, div ? ST : null)}</div>`;
  });
  return h + `<p class="note">Impacto no MSL = pontos que o item tira ou soma no MSL total (o MSL dele contra o total, pesado pelas lojas). Peso nas faltas = parte do item nas faltas do mês.</p>`;
}
function pgMiDiretor() {
  const J = miJanela(), R = miResumo(J);
  let h = hero('Visão do Diretor', 'O mix do canal indireto em uma página.', `${miTxtMes(J)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`) + miKpis(R, J, [0, 2, 3, 4]);
  const DI = miLinhas(J, MIC.dist).filter(x => x.a.t > 0).sort((a, b) => a.imp - b.imp);
  const RD = miLinhas(J, MIC.rede).filter(x => x.a.t > 0 && x.nl >= 3).sort((a, b) => a.imp - b.imp).slice(0, 5);
  const LO = [...miLojas(J.idx).entries()].map(([k, o]) => ({k, ...o, rs: miRS(k, J)})).filter(x => x.ec === 0 && x.rs.jan > 0).sort((a, b) => b.rs.jan - a.rs.jan).slice(0, 8);
  h += `<h2 class="sec">Quem puxa para baixo. <span>Impacto = pontos que o item tira do MSL total: o MSL dele contra o total, pesado pelas lojas.</span></h2>
    <div class="card"><p class="eyebrow">Distribuidores</p>${miTabJanela('mdd', 'Distribuidor', DI, k => miDist(k), J, {compacto: true})}</div>
    <div class="card"><p class="eyebrow">As 5 redes (3 lojas ou mais)</p>${miTabJanela('mdr', 'Rede', RD, k => esc(dic.rede[k]), J, {compacto: true, extra: [{c: 'Distribuidor', l: true, h: x => esc([...new Set(D.lojas.filter((_, i) => D.L.rede[i] === x.k).map(l => l.dist))].join(', '))}]})}</div>
    <div class="card"><p class="eyebrow">Compram e estão zeradas · as 8 que mais compram</p>${exTabela('mdl', LO, [{c: 'Loja', l: true, b: true, k: 'nm', h: x => `<button class="lnk" data-act="exir" data-pg="mi-lojas" data-k="selloja" data-v="${x.k}">${miLojaNome(x.k)}</button>`},
      {c: 'Rede', l: true, h: x => esc(D.lojas[x.k].rede)}, {c: 'Distribuidor', l: true, h: x => esc(D.lojas[x.k].dist)}, {c: 'Perfil', l: true, h: x => esc(D.lojas[x.k].perfil)},
      {c: 'Sell out médio · 3 meses', b: true, h: x => miRs(x.rs.jan)}, {c: 'SKUs exigidos', h: x => n0(x.et)}])}
      <p class="note" style="margin:10px 0 0">Loja que compra do distribuidor e não tem nenhum SKU do mix na unidade mínima: a oportunidade mais rápida de MSL, porque o pedido já existe.</p></div>`;
  const SK = miLinhas(J, MIC.sku).filter(x => x.f > 0).sort((a, b) => b.f - a.f).slice(0, 5);
  h += `<h2 class="sec">As faltas que mais pesam. <span>Os 5 SKUs que mais faltam em ${esc(J.txt)}.</span></h2><div class="card"><p class="eyebrow">SKUs com mais faltas</p>${exTabela('mds', SK, [
    {c: 'SKU', l: true, b: true, k: 'sk', h: x => `<button class="lnk" data-act="exir" data-pg="mi-skus" data-k="selsku" data-v="${x.k}">${exSkuNome(x.k)}</button>`}, {c: 'Marca', l: true, h: x => exMarcaNome(D.K.marca[x.k])},
    {c: 'Segmento', l: true, h: x => esc(dic.segmento[D.K.segmento[x.k]])}, {c: 'Lojas onde falta', b: true, h: x => n0(x.f)}, {c: 'Lojas que exigem', h: x => n0(x.a.et)}, {c: 'Peso nas faltas', h: x => p1(x.peso)}, {c: 'Presença', h: x => p1(x.w)}])}</div>`;
  const CM = EX_CTO.map(n => dic.marca.findIndex(m => String(m).toUpperCase() === n)).filter(i => i >= 0), ch = r => D.L.dist[r[1]] * 64 + D.K.marca[r[2]];
  const A = miAgr(J.idx, ch), B = J.temAnt ? miAgr(J.ant, ch) : new Map(), AT = miAgr(J.idx, MIC.dist), BT = J.temAnt ? miAgr(J.ant, MIC.dist) : new Map(), AM = miAgr(J.idx, MIC.marca), BM = J.temAnt ? miAgr(J.ant, MIC.marca) : new Map();
  const ds = [...AT.keys()].sort((a, b) => (msl(AT.get(b)) || -1) - (msl(AT.get(a)) || -1)), tA = miUm(J.idx), tB = J.temAnt ? miUm(J.ant) : EZM;
  const duo = (a, b) => `<td class="b">${p1(msl(a))}</td><td>${vppt(msl(a) - msl(b))}</td>`;
  h += `<h2 class="sec">Distribuidor x marca. <span>MSL do mês por distribuidor, no total e nas 4 marcas do CTO, contra o mesmo mês do ano anterior.</span></h2><div class="card"><p class="eyebrow">Distribuidor x marca</p><div class="tw"><table><thead><tr><th class="l">Distribuidor</th><th colspan="2" style="text-align:center">Total</th>` +
    CM.map(m => `<th colspan="2" style="text-align:center">${esc(dic.marca[m])}</th>`).join('') + `</tr><tr><th></th><th>${J.a6}</th><th>Δ pp</th>${CM.map(() => `<th>${J.a6}</th><th>Δ pp</th>`).join('')}</tr></thead><tbody>` +
    ds.map(d => `<tr><td class="l b">${miDist(d)}</td>${duo(AT.get(d), BT.get(d))}${CM.map(m => duo(A.get(d * 64 + m), B.get(d * 64 + m))).join('')}</tr>`).join('') +
    `<tr class="tot"><td class="l">Total</td>${duo(tA, tB)}${CM.map(m => duo(AM.get(m), BM.get(m))).join('')}</tr></tbody></table></div></div>`;
  return h;
}
function pgMiRedes() {
  const J = miJanela(), DI = miLinhas(J, MIC.dist).filter(x => x.a.t > 0 || x.b.t > 0).sort((a, b) => b.nl - a.nl), Md = miMeses(MIC.dist);
  let h = hero('Distribuidores e redes', 'MSL por distribuidor e por rede.', miConclusao(DI, k => miDist(k), J, 'distribuidores'), '', `${miTxtMes(J)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}. Clique no nome para abrir.`);
  h += `<h2 class="sec">Distribuidor a distribuidor. <span>As lojas da lista de cada distribuidor.</span></h2><div class="card"><p class="eyebrow">Distribuidores · mês vigente</p>${miTabJanela('mrd', 'Distribuidor', DI, k => miDist(k), J, {sel: 'seldist', spark: Md,
    extra: [{c: 'Executivo', l: true, h: x => esc([...new Set(D.lojas.filter((_, i) => D.L.dist[i] === x.k).map(l => l.executivo))].join(', '))}]})}</div>`;
  const kd = exSelValido('seldist', DI);
  if (kd !== null) {
    const sub = r => D.L.dist[r[1]] === kd, nome = miDist(kd), LM = miOrdemMarcas(miLinhas(J, MIC.marca, sub).filter(x => x.a.t > 0 || x.b.t > 0));
    const RDd = miLinhas(J, MIC.rede, sub).filter(x => x.a.t > 0 || x.b.t > 0).sort((a, b) => b.nl - a.nl || a.m - b.m);
    h += `<div class="det"><h2 class="sec">${nome}. <span>${miTxtMes(J)}: os números, as redes, as marcas e as lojas.</span></h2>` + miKpis(miResumo(J, sub), J) +
      `<div class="card"><p class="eyebrow">${nome} · MSL mês a mês</p>${exCurva(miSerie(sub), J)}${miNotaFonteCurva()}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · redes</p>${miTabJanela('mrdr', 'Rede', RDd, k => esc(dic.rede[k]), J, {compacto: true})}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${miTabJanela('mrdm', 'Marca', LM, exMarcaNome, J, {semLojas: true, tot: miTotalRecorte(J, sub)})}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca x mês</p>${miSegMM()}${miTabMeses('Marca', LM.map(x => x.k), exMarcaNome, miMeses(MIC.marca, sub), J, miSerie(sub))}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · lojas</p>${miTabLojas('mrdl', J, sub, {link: 'exir', semDist: true})}</div></div>`;
  }
  const RD = miLinhas(J, MIC.rede).filter(x => (x.a.t > 0 || x.b.t > 0) && Math.max(x.nl, x.nlb) >= (S.ui.mitodas ? 1 : 2)).sort((a, b) => b.nl - a.nl || a.m - b.m), Mr = miMeses(MIC.rede);
  h += `<h2 class="sec">Rede a rede. <span>${S.ui.mitodas ? 'Todas as redes, inclusive as de 1 loja.' : 'Redes com 2 lojas ou mais na lista.'} <button class="lnk" data-act="ui" data-k="mitodas" data-v="${S.ui.mitodas ? '' : '1'}">${S.ui.mitodas ? 'Só redes com 2 lojas ou mais' : 'Ver todas as redes'}</button></span></h2>` + exTermo(RD.map(x => x.d)) +
    `<div class="card"><p class="eyebrow">Redes · mês vigente</p>${miTabJanela('mrr', 'Rede', RD, k => esc(dic.rede[k]), J, {sel: 'selrede', spark: Mr,
      extra: [{c: 'Distribuidor', l: true, h: x => esc([...new Set(D.lojas.filter((_, i) => D.L.rede[i] === x.k).map(l => l.dist))].join(', '))}]})}</div>`;
  const kr = exSelValido('selrede', RD);
  if (kr !== null) {
    const sub = r => D.L.rede[r[1]] === kr, nome = esc(dic.rede[kr]), LM = miOrdemMarcas(miLinhas(J, MIC.marca, sub).filter(x => x.a.t > 0 || x.b.t > 0));
    h += `<div class="det"><h2 class="sec">${nome}. <span>${miTxtMes(J)}: os números, as lojas da rede e a matriz marca x mês.</span></h2>` + miKpis(miResumo(J, sub), J) +
      `<div class="card"><p class="eyebrow">${nome} · MSL mês a mês</p>${exCurva(miSerie(sub), J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · lojas</p>${miTabLojas('mrrl', J, sub, {link: 'exir', semRede: true})}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca x mês</p>${miSegMM()}${miTabMeses('Marca', LM.map(x => x.k), exMarcaNome, miMeses(MIC.marca, sub), J, miSerie(sub))}</div></div>`;
  }
  return h;
}
const miLojasPrincipal = () => miTabLojas('mil', miJanela(), null, {busca: S.ui.mibusca});
function pgMiLojas() {
  const J = miJanela(), A = miLojas(J.idx);
  const c = [0, 0, 0, 0]; A.forEach(o => { c[o.ec === 0 ? 0 : o.m <= 0.25 ? 1 : o.m <= 0.5 ? 2 : 3]++; });
  const sem = D.lojas.length - A.size, menor = [...A.entries()].filter(([, o]) => o.ec > 0).sort((a, b) => a[1].m - b[1].m)[0];
  const concl = A.size ? `${n0(c[3])} de ${n0(A.size)} lojas medidas ficam acima de 50% e ${n0(c[0])} estão zeradas${menor ? `; entre as que compram algum SKU do mix, a menor é ${miLojaNome(menor[0])} (${p1(menor[1].m)})` : ''}.` : `Sem lojas medidas em ${esc(J.txt)}.`;
  let h = hero('Lojas', 'MSL loja a loja.', concl, '', `${miTxtMes(J)}, do menor para o maior MSL, contra a própria loja${J.temAnt ? ` em ${esc(J.antTxt)}` : ''}.`);
  h += `<h2 class="sec">As faixas. <span>MSL da loja no mês.</span></h2><div class="termo"><span class="vbig down">${n0(c[0])} zeradas</span><span class="vbig down">${n0(c[1])} até 25%</span><span class="vbig warn">${n0(c[2])} de 25% a 50%</span><span class="vbig up">${n0(c[3])} acima de 50%</span>${sem > 0 ? `<span class="vbig flat">${n0(sem)} sem dado no mês</span>` : ''}</div>`;
  h += `<h2 class="sec">Loja a loja. <span>Busque pelo nome, CNPJ, rede ou distribuidor.</span></h2><div class="card"><p class="eyebrow">Lojas · mês vigente</p><div class="pills" style="margin:6px 0 0">${buscaRede('mibusca', S.ui.mibusca, 'Buscar loja, CNPJ, rede ou distribuidor')}</div><div id="mi-lojas-tab">${miLojasPrincipal()}</div></div>`;
  const Ls = [...new Set([...A.keys()])].map(k => ({k}));
  const k = exSelValido('selloja', Ls.length ? Ls : D.lojas.map((_, i) => ({k: i})));
  if (k !== null) h += miDetLoja(k, J);
  return h;
}
function pgMiExecutivos() {
  const J = miJanela(), L = miLinhas(J, MIC.executivo).filter(x => x.a.t > 0 || x.b.t > 0).sort((a, b) => b.nl - a.nl), Mm = miMeses(MIC.executivo);
  const pior = new Map(); miAgr(J.idx, r => D.L.executivo[r[1]] * 64 + D.K.marca[r[2]]).forEach((o, key) => { if (o.t < 20) return; const e = Math.floor(key / 64), x = msl(o), p = pior.get(e); if (!p || x < p.m) pior.set(e, {m: x, mk: key % 64}); });
  const dists = k => [...new Set(D.lojas.filter((_, i) => D.L.executivo[i] === k).map(l => l.dist))].sort().join(', ');
  let h = hero('Executivos', 'MSL por executivo.', miConclusao(L, k => esc(dic.executivo[k]), J, 'carteiras'), '', `A carteira de lojas de cada um, em ${miTxtMes(J)}${J.temAnt ? ` contra ${esc(J.antTxt)}` : ''}.`);
  h += `<h2 class="sec">Executivo a executivo. <span>Pior marca = menor MSL da carteira no mês, entre as marcas com pelo menos 20 lojas exigindo.</span></h2><div class="card"><p class="eyebrow">Executivos · mês vigente</p>${miTabJanela('mie', 'Executivo', L, k => esc(dic.executivo[k]), J,
    {sel: 'selexe', spark: Mm, extraCedo: [{c: 'Pior marca', l: true, v: x => (pior.get(x.k) || {}).m, h: x => { const p = pior.get(x.k); return p ? `${exMarcaNome(p.mk)} <span class="mini">${p1(p.m)}</span>` : ''; }},
      {c: 'Distribuidores', l: true, v: x => dists(x.k), h: x => esc(dists(x.k))}]})}</div>`;
  const k = exSelValido('selexe', L);
  if (k !== null) {
    const sub = r => D.L.executivo[r[1]] === k, nome = esc(dic.executivo[k]), LM = miOrdemMarcas(miLinhas(J, MIC.marca, sub).filter(x => x.a.t > 0 || x.b.t > 0));
    h += `<div class="det"><h2 class="sec">${nome}. <span>${miTxtMes(J)}: os números, as marcas e as lojas da carteira.</span></h2>` + miKpis(miResumo(J, sub), J) +
      `<div class="card"><p class="eyebrow">${nome} · MSL mês a mês</p>${exCurva(miSerie(sub), J)}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${miTabJanela('miem', 'Marca', LM, exMarcaNome, J, {semLojas: true, tot: miTotalRecorte(J, sub)})}</div>` +
      `<div class="card"><p class="eyebrow">${nome} · lojas</p>${miTabLojas('miel', J, sub, {link: 'exir', semExec: true})}</div></div>`;
  }
  return h;
}
function pgMiSkus() {
  const J = miJanela(), R = miResumo(J), SK = miLinhas(J, MIC.sku).filter(x => x.a.t > 0 || x.b.t > 0), med = SK.filter(x => x.a.t > 0), comF = med.filter(x => x.f > 0);
  const topF = comF.length ? comF.reduce((a, b) => (b.f > a.f ? b : a)) : null;
  const concl = topF ? `${n0(comF.length)} de ${n0(med.length)} SKUs do mix faltam em pelo menos uma loja; o que mais falta é <span class="ex-quebra">${exSkuNome(topF.k)}</span> (falta em ${n0(topF.f)} de ${n0(topF.a.et)} lojas).` : `Sem faltas em ${esc(J.txt)}.`;
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv"><span>${sub}</span></div></div>`;
  let h = hero('SKUs e faltas', 'Onde o mix falha.', concl, '', `SKUs exigidos que a loja não comprou na unidade mínima, em ${miTxtMes(J)}.`);
  h += `<div class="grid g3">${card('Faltas no mês', n0(R.f), `${p1(R.et ? R.f / R.et : NaN)} dos ${n0(R.et)} SKUs exigidos`)}${card('SKUs com falta', `${n0(comF.length)} de ${n0(med.length)}`, 'SKUs do mix exigidos no mês')}${card('Em risco', n0(R.rk), 'positivados só pela compra do mês mais antigo da janela')}</div>`;
  const LM = miOrdemMarcas(miLinhas(J, MIC.marca).filter(x => x.a.t > 0 || x.b.t > 0));
  h += `<h2 class="sec">Marca a marca. <span>Faltas, peso e presença de cada marca no mês.</span></h2><div class="card"><p class="eyebrow">Faltas por marca</p>${exTabela('misk', LM, [
    {c: 'Marca', l: true, b: true, v: x => semAcento(dic.marca[x.k]), h: x => exMarcaNome(x.k), t: () => 'Total'}, {c: `Faltas ${J.a6}`, b: true, v: x => x.f, h: x => n0(x.f), t: true},
    {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true}, {c: `Presença ${J.a6}`, v: x => x.w, h: x => p1(x.w), t: true}, {c: `Presença ${J.a5}`, v: x => x.wb, h: x => p1(x.wb), t: true},
    {c: 'Δ pp', v: x => x.w - x.wb, h: x => vppt(x.w - x.wb), t: x => vppt(x.w - x.wb)}, {c: `MSL médio ${J.a6}`, v: x => x.m, h: x => p1(x.m), t: true}, {c: 'Em risco', v: x => x.rk, h: x => n0(x.rk), t: x => n0(x.rk)}], {tot: miTotalRecorte(J)})}
    <p class="note" style="margin:10px 0 0">Presença = SKUs positivados sobre exigidos da marca, somando as lojas. MSL médio = média das lojas na marca.</p></div>`;
  const sel = String(S.ui.selsku ?? ''), L = med.sort((a, b) => b.f - a.f || a.w - b.w);
  h += `<h2 class="sec">SKU a SKU. <span>Do SKU que mais falta para o que menos falta; clique no SKU para abrir as lojas.</span></h2><div class="card"><p class="eyebrow">SKUs · mês vigente</p>${exTabela('miss', L, [
    {c: 'SKU', l: true, b: true, k: 'sk', v: x => semAcento(D.skus[x.k].desc || ''), h: x => `<button class="lnk" data-act="ui" data-k="selsku" data-v="${String(x.k) === sel ? '' : x.k}">${exSkuNome(x.k)}</button>`, t: () => 'Total'},
    {c: 'Lojas onde falta', b: true, v: x => x.f, h: x => n0(x.f), t: true}, {c: 'Lojas que exigem', v: x => x.a.et, h: x => n0(x.a.et), t: x => n0(x.a.et)}, {c: 'Peso nas faltas', v: x => x.peso, h: x => p1(x.peso), t: true},
    {c: `Presença ${J.a6}`, v: x => x.w, h: x => p1(x.w), t: true}, {c: `Presença ${J.a5}`, v: x => x.wb, h: x => p1(x.wb), t: true}, {c: 'Δ pp', v: x => x.w - x.wb, h: x => vppt(x.w - x.wb)},
    {c: 'Em risco', v: x => x.rk, h: x => n0(x.rk)}, {c: 'Marca', l: true, v: x => dic.marca[D.K.marca[x.k]], h: x => exMarcaNome(D.K.marca[x.k])},
    {c: 'Segmento', l: true, v: x => dic.segmento[D.K.segmento[x.k]], h: x => esc(dic.segmento[D.K.segmento[x.k]])}, {c: 'EAN', l: true, k: 'ex-cod', v: x => D.skus[x.k].cod, h: x => esc(D.skus[x.k].cod), oc: true}],
    {tot: miTotalRecorte(J), on: x => String(x.k) === sel})}</div>`;
  const k = exSelValido('selsku', L);
  if (k !== null) {
    const sub = r => r[2] === k, A = miLojas(J.idx, sub), LL = [...A.entries()].filter(([, o]) => o.ec === 0).map(([l]) => ({k: l, rs: miRS(l, J)})).sort((a, b) => b.rs.jan - a.rs.jan);
    h += `<div class="det"><h2 class="sec">${exSkuNome(k)}. <span>${esc(D.skus[k].marca)} · ${esc(D.skus[k].segmento)} · EAN ${esc(D.skus[k].cod)}: as ${n0(LL.length)} lojas onde falta, da que mais compra do distribuidor para a que menos compra.</span></h2>` +
      `<div class="card"><p class="eyebrow">Lojas onde o SKU falta · ${esc(J.txt)}</p>${exTabela('misl', LL, [
        {c: 'Loja', l: true, b: true, k: 'nm', h: x => `<button class="lnk" data-act="exir" data-pg="mi-lojas" data-k="selloja" data-v="${x.k}">${miLojaNome(x.k)}</button>`},
        {c: 'Rede', l: true, h: x => esc(D.lojas[x.k].rede)}, {c: 'Distribuidor', l: true, h: x => esc(D.lojas[x.k].dist)}, {c: 'Perfil', l: true, h: x => esc(D.lojas[x.k].perfil)},
        {c: 'Sell out médio · 3 meses', b: true, h: x => (x.rs.jan ? miRs(x.rs.jan) : '')}, {c: 'Executivo', l: true, h: x => esc(D.lojas[x.k].executivo)}])}</div>` +
      `<div class="card"><p class="eyebrow">SKU · presença mês a mês</p>${exCurva(exSerie(sub), J)}</div></div>`;
  }
  return h;
}
function pgMiAuditoria() {
  const J = miJanela(), P = D.pbi;
  let h = hero('Auditoria do PBI', 'O número oficial contra o recálculo loja a loja.', P ? `${esc(P.nome)}: ${P.meses.map(m => exRot(D.meses.indexOf(m))).join(', ')}.` : 'Sem o export do PBI nesta base.');
  if ((D.achados || []).length) h += `<h2 class="sec">O que a auditoria achou. <span>Pontos da apuração oficial para corrigir ou confirmar.</span></h2><div class="card"><ol class="num">${D.achados.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol></div>`;
  if (!P) return h;
  if (S.f.marca.size || S.f.segmento.size) return h + `<div class="card"><div class="empty">O PBI mede o MSL total da loja: tire os filtros de Marca e Segmento para comparar o oficial com o recálculo.</div></div>`;
  const mi = P.meses.map(m => D.meses.indexOf(m)), lk = (D.chavesLoja || []).filter(k => S.f[k] && S.f[k].size), okL = l => lk.every(k => S.f[k].has(D.L[k][l]));
  const RC = new Map(); mi.forEach((i, j) => { if (i < 0) return; miLojas([i]).forEach((o, l) => RC.set(l * 64 + j, o.m)); });
  const T = new Map(), dd = []; let ex = 0, n = 0, semR = 0;
  P.f.forEach(([l, j, v]) => { if (!okL(l)) return; const pv = v / 1e4, rc = RC.get(l * 64 + j), d = D.L.dist[l], k = d * 64 + j; let o = T.get(k); if (!o) T.set(k, o = {n: 0, sp: 0, nr: 0, sr: 0, ex: 0});
    o.n++; o.sp += pv; if (isFinite(rc)) { o.nr++; o.sr += rc; if (Math.abs(rc - pv) < 0.0005) { o.ex++; ex++; } dd.push({l, j, pv, rc, df: rc - pv}); } else semR++; n++; });
  const ds = [...new Set([...T.keys()].map(k => Math.floor(k / 64)))].sort((a, b) => String(dic.dist[a]).localeCompare(String(dic.dist[b])));
  const tot = j => { const o = {n: 0, sp: 0, nr: 0, sr: 0, ex: 0}; T.forEach((x, k) => { if (k % 64 === j) Object.keys(o).forEach(c => { o[c] += x[c]; }); }); return o; };
  const cel = o => (o && o.n ? `<td>${p1(o.sp / o.n)}</td><td class="b">${p1(o.nr ? o.sr / o.nr : NaN)}</td><td>${vppt(o.nr ? o.sr / o.nr - o.sp / o.n : NaN)}</td><td>${p1(o.nr ? o.ex / o.nr : NaN)}</td>` : '<td></td><td></td><td></td><td></td>');
  h += `<h2 class="sec">PBI contra recálculo. <span>Média de MSL das lojas, distribuidor a distribuidor e mês a mês; exato = mesma loja e mesmo mês com o mesmo MSL.</span></h2><div class="card"><p class="eyebrow">Média de MSL · PBI x recálculo</p><div class="tw"><table><thead><tr><th class="l">Distribuidor</th>${mi.map(i => `<th colspan="4" style="text-align:center">${exRot(i)}</th>`).join('')}</tr>
    <tr><th></th>${mi.map(() => '<th>PBI</th><th>Recálculo</th><th>Δ pp</th><th>Exato</th>').join('')}</tr></thead><tbody>` +
    ds.map(d => `<tr><td class="l b">${miDist(d)}</td>${mi.map((_, j) => cel(T.get(d * 64 + j))).join('')}</tr>`).join('') + `<tr class="tot"><td class="l">Total</td>${mi.map((_, j) => cel(tot(j))).join('')}</tr></tbody></table></div>
    <p class="note" style="margin:10px 0 0">${n0(n)} lojas x mês no PBI dentro do recorte; ${n0(ex)} batem exato (${p1(n ? ex / n : NaN)}). ${semR ? `${n0(semR)} sem recálculo (loja fora da lista oficial ou distribuidor sem dado no mês). ` : ''}O recálculo usa o sell out do Colecta; o PBI usa a base de sell out do próprio relatório.</p></div>`;
  // as três réguas lado a lado contra o PBI, no recorte: média das lojas em cada mês do PBI
  if (D.RGL.length > 1) {
    const reg0 = D.reg, linhasR = D.RGL.map(([id, nome]) => { D.col.c = D.RG[id].c; D.col.r = D.RG[id].r; return [nome, mi.map(i => (i >= 0 ? msl(miUm([i])) : NaN)), msl(miUm(mi.filter(i => i >= 0)))]; });
    D.col.c = D.RG[reg0].c; D.col.r = D.RG[reg0].r;
    const pbiM = mi.map((_, j) => { const o = tot(j); return o.n ? o.sp / o.n : NaN; }), pbiT = (() => { let n = 0, sp = 0; T.forEach(x => { n += x.n; sp += x.sp; }); return n ? sp / n : NaN; })();
    h += `<h2 class="sec">As três réguas. <span>O PBI contra o recálculo pelo Colecta em cada régua, no recorte marcado.</span></h2><div class="card"><p class="eyebrow">Média de MSL das lojas</p><div class="tw"><table><thead><tr><th class="l">Leitura</th>${mi.map(i => `<th>${exRot(i)}</th>`).join('')}<th>Trimestre</th><th>Δ pp contra o PBI</th></tr></thead><tbody>
      <tr><td class="l b">PBI oficial (base do relatório)</td>${pbiM.map(x => `<td>${p1(x)}</td>`).join('')}<td class="b">${p1(pbiT)}</td><td></td></tr>` +
      linhasR.map(([nome, v, t]) => `<tr><td class="l b">${esc(nome)} · Colecta</td>${v.map(x => `<td>${p1(x)}</td>`).join('')}<td class="b">${p1(t)}</td><td>${vppt(t - pbiT)}</td></tr>`).join('') +
      `</tbody></table></div><p class="note" style="margin:10px 0 0">A diferença entre o PBI e a régua Oficial pelo Colecta é de fonte: a mesma regra, aplicada a uma base de sell out mais completa. ${esc((D.regra && D.regra.nota_fonte) || '')}</p></div>`;
  }
  const div = dd.filter(x => Math.abs(x.df) >= 0.0005).sort((a, b) => Math.abs(b.df) - Math.abs(a.df)).slice(0, 60);
  h += `<h2 class="sec">As maiores diferenças. <span>Loja x mês em que o recálculo e o PBI mais se afastam (as 60 maiores).</span></h2><div class="card"><p class="eyebrow">Lojas com diferença</p>${exTabela('mau', div, [
    {c: 'Loja', l: true, b: true, k: 'nm', h: x => `<button class="lnk" data-act="exir" data-pg="mi-lojas" data-k="selloja" data-v="${x.l}">${miLojaNome(x.l)}</button>`}, {c: 'Mês', l: true, h: x => exRot(mi[x.j])},
    {c: 'PBI', v: x => x.pv, h: x => p1(x.pv)}, {c: 'Recálculo', b: true, v: x => x.rc, h: x => p1(x.rc)}, {c: 'Δ pp', v: x => x.df, h: x => vppt(x.df)},
    {c: 'Distribuidor', l: true, h: x => esc(D.lojas[x.l].dist)}, {c: 'Perfil', l: true, h: x => esc(D.lojas[x.l].perfil)}, {c: 'CNPJ', l: true, k: 'ex-cod', h: x => esc(miCnpj(D.lojas[x.l].id))}])}</div>`;
  if ((P.fora || []).length) h += `<div class="card"><p class="eyebrow">No PBI e fora da lista oficial de lojas</p>${exTabela('maf', P.fora, [{c: 'CNPJ', l: true, k: 'ex-cod', h: x => esc(miCnpj(x[0]))}, {c: 'Distribuidor', l: true, h: x => esc(x[1])}, {c: 'Categoria no PBI', l: true, h: x => esc(x[2])}, {c: 'Média de MSL no PBI', h: x => p1(x[3])}])}</div>`;
  return h;
}

/* ---------- Exportar para Excel: as tabelas da página aberta, no recorte marcado (sem biblioteca externa) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function deflar(u) {
  if (typeof CompressionStream === 'undefined') return null;
  try { return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch (e) { return null; }
}
async function zipar(arqs) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const [nome, txt] of arqs) {
    const nm = enc.encode(nome), dado = enc.encode(txt), crc = crc32(dado), z = await deflar(dado), met = z ? 8 : 0, corpo = z || dado;
    const lh = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, met, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, corpo.length, 4], [22, dado.length, 4], [26, nm.length, 2], [28, 0, 2]]
      .forEach(([o, x, n]) => (n === 4 ? lh.setUint32(o, x, true) : lh.setUint16(o, x, true)));
    partes.push(new Uint8Array(lh.buffer), nm, corpo);
    const ch = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, met, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, corpo.length, 4], [24, dado.length, 4], [28, nm.length, 2], [42, off, 4]]
      .forEach(([o, x, n]) => (n === 4 ? ch.setUint32(o, x, true) : ch.setUint16(o, x, true)));
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + corpo.length;
  }
  const tamC = central.reduce((s, x) => s + x.length, 0), fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arqs.length, true); fim.setUint16(10, arqs.length, true); fim.setUint32(12, tamC, true); fim.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xesc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const colL = i => { let s = ''; i++; while (i) { const q = (i - 1) % 26; s = String.fromCharCode(65 + q) + s; i = Math.floor((i - 1) / 26); } return s; };
/* estilos: 0 normal · 1 cabeçalho grafite · 2 inteiro · 3 percentual · 4 decimal · 5 título · 6 nota · 7 número sem milhar (ano, ano-mês) */
const XL_EST = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="#,##0.00"/></numFmts>' +
  '<fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="13"/><color rgb="FF1D1D1F"/><name val="Arial"/></font><font><i/><sz val="9"/><color rgb="FF6E6E73"/><name val="Arial"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D1D1F"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function folhaXml(ab) {   // ab = {titulo, nota, cab: [[...]], linhas: [[...]]}; célula = texto | número | {v, s}
  const L = []; let r = 0;
  const cel = (c, i, est) => {
    const ref = colL(i) + r;
    if (c === null || c === undefined || c === '') return '';
    if (typeof c === 'object') return Number.isFinite(c.v) ? `<c r="${ref}" s="${c.s}"><v>${c.v}</v></c>` : '';
    if (typeof c === 'number') return Number.isFinite(c) ? `<c r="${ref}" s="${est || 2}"><v>${c}</v></c>` : '';
    return `<c r="${ref}" t="inlineStr"${est ? ` s="${est}"` : ''}><is><t xml:space="preserve">${xesc(c)}</t></is></c>`;
  };
  const linha = (cs, est) => { r++; L.push(`<row r="${r}">${cs.map((c, i) => cel(c, i, est)).join('')}</row>`); };
  linha([ab.titulo], 5); if (ab.nota) linha([ab.nota], 6); linha([]);
  ab.cab.forEach(c => linha(c, 1)); const fz = r;
  ab.linhas.forEach(c => linha(c));
  const amostra = [...ab.cab, ...ab.linhas.slice(0, 400)], nc = Math.max(1, ...amostra.map(c => c.length));
  const larg = Array.from({length: nc}, (_, i) => Math.min(46, 2 + Math.max(8, ...amostra.map(c => { const x = c[i]; return x === null || x === undefined ? 0 : typeof x === 'string' ? x.length : 12; }))));
  const pane = ab.cab.length ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="1" ySplit="${fz}" topLeftCell="B${fz + 1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}<cols>${larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${L.join('')}</sheetData></worksheet>`;
}
async function gerarXlsx(abas) {
  const usados = new Set();
  const curtoAba = x => { x = x.replace(/[\[\]:*?\/\\']/g, ' ').replace(/\s+/g, ' ').trim(); if (x.length <= 31 || !x.includes(' · ')) return x;
    const p = x.split(' · '), fim = p.slice(1).join(' · '), r1 = p[0].replace(/\s*\(.*\)\s*$/, '').trim() + ' · ' + fim; return r1.length <= 31 ? r1 : (fim.length <= 31 ? fim : r1); };
  abas.forEach(a => { const n = curtoAba(a.nome || 'Aba').slice(0, 31).trim() || 'Aba'; let k = n, i = 2; while (usados.has(k.toLowerCase())) { const suf = ' ' + i++; k = n.slice(0, 31 - suf.length).trimEnd() + suf; } usados.add(k.toLowerCase()); a.nomeF = k; });
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  return zipar([
    ['[Content_Types].xml', `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${R}"><sheets>${abas.map((a, i) => `<sheet name="${xesc(a.nomeF)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${abas.length + 1}" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', XL_EST],
    ...abas.map((a, i) => [`xl/worksheets/sheet${i + 1}.xml`, folhaXml(a)])]);
}
function numBR(t0) {   // texto da tabela -> número do Excel (pt-BR), mantendo o formato
  const t = t0.replace(/[▲▼●↑↓]/g, '').replace(/\s+/g, ' ').trim(), num = (sg, x) => +(sg + x.replace(/\./g, '').replace(',', '.'));
  let m;
  if ((m = t.match(/^([+-]?)R\$ ?(\d{1,3}(?:\.\d{3})*(?:,\d+)?) Mi$/))) return {v: num(m[1], m[2]) * 1e6, s: 2};
  if ((m = t.match(/^([+-]?)R\$ ?(\d{1,3}(?:\.\d{3})*(?:,\d+)?)$/))) return {v: num(m[1], m[2]), s: m[2].includes(',') ? 4 : 2};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})*(?:,\d+)?)%$/))) return {v: num(m[1], m[2]) / 100, s: 3};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})*(?:,\d+)?) pp$/))) return {v: num(m[1], m[2]), s: 4};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?$/))) return {v: num(m[1], m[2] + (m[3] || '')), s: m[3] ? 4 : 2};
  return t;
}
function tabelaParaLinhas(tb) {   // respeita colspan e rowspan; qualificadores (base parcial, plano) vão para a coluna Obs.
  const cab = [], linhas = [], obs = [], ocup = new Set();
  [...tb.querySelectorAll('tr')].forEach((tr, ri) => {
    const out = [], ob = [], eCab = tr.parentElement && tr.parentElement.tagName === 'THEAD'; let c = 0;
    const pula = () => { while (ocup.has(ri + ',' + c)) { out[c] = ''; c++; } };
    for (const td of tr.children) {
      pula();
      const cl = td.cloneNode(true);
      cl.querySelectorAll('[data-xls="fora"]').forEach(d => d.remove());   // etiqueta só de tela (ex.: CTO da marca na Execução)
      cl.querySelectorAll('div.mini').forEach(d => d.replaceWith(' · ' + d.textContent.trim()));
      cl.querySelectorAll('svg').forEach(d => d.remove());
      const q = [...cl.querySelectorAll('span.mini, small')].map(d => { const x = d.textContent.trim(); d.remove(); return x; }).filter(Boolean);
      const t = cl.textContent.replace(/\s+/g, ' ').trim(), cs = +(td.getAttribute('colspan') || 1), rs = +(td.getAttribute('rowspan') || 1);
      let val = eCab ? t.replace(/ [↑↓]$/, '') : td.classList.contains('ex-cod') ? t : numBR(t);   // código (SKU SAP, loja) fica texto: '01700' não vira 1700
      if (!eCab && q.length) {
        if (val && typeof val === 'object') { const hd = (cab[cab.length - 1] || [])[c]; ob.push((hd ? hd + ': ' : '') + q.join(', ')); }
        else val = [val, ...q].filter(Boolean).join(' · ');
      }
      out[c] = val;
      for (let k = 1; k < cs; k++) out[c + k] = '';
      for (let q2 = 1; q2 < rs; q2++) for (let k = 0; k < cs; k++) ocup.add((ri + q2) + ',' + (c + k));
      c += cs;
    }
    pula();
    if (eCab) cab.push(out); else { linhas.push(out); obs.push(ob.join('; ')); }
  });
  if (obs.some(Boolean)) {
    const nc = Math.max(0, ...cab.map(x => x.length), ...linhas.map(x => x.length));
    if (cab.length) { const hh = cab[cab.length - 1]; for (let k = hh.length; k < nc; k++) hh[k] = ''; hh[nc] = 'Obs.'; }
    linhas.forEach((x, i) => { for (let k = x.length; k < nc; k++) x[k] = ''; x[nc] = obs[i] || ''; });
  }
  return {cab, linhas};
}
/* ======================= Perna Nielsen: mercado e share da Reckitt nas categorias Nielsen e IQVIA (base mensal do time de CMI) =======================
   Linha do cubo: [geografia, categoria, canal, fabricante, marca, segmento, reckitt (0/1), medida (0 = R$, 1 = unidades ou volume), um valor por mês].
   Categoria e geografia são seletores únicos (não se somam); Canal e Segmento definem o mercado; Fabricante e Marca trocam o foco
   (sem eles, o foco é a Reckitt). Share do mês = foco sobre mercado; share de período = média simples das shares mensais (método do slide de share do CMI).
   Mês antes do primeiro mês com dado da categoria (cats[].ini) não entra em período nenhum: o período fica "sem dado". */
function montarDNI(n) {
  if (!n || !Array.isArray(n.meses) || !n.meses.length || !n.dic || !Array.isArray(n.f) || !n.f.length || !Array.isArray(n.cats) || !n.cats.length) return null;
  const M = n.meses.length, dic = {cat: n.dic.cat, geo: n.dic.geo, canal: n.dic.canal, fab: n.dic.fab, marca: n.dic.marca, segmento: n.dic.seg};
  const por = new Map();   // categoria x geografia -> linhas
  n.f.forEach(r => { if (!Array.isArray(r) || r.length !== 8 + M) throw new Error('linha do cubo fora do formato'); const k = r[1] * 64 + r[0]; let a = por.get(k); if (!a) por.set(k, a = []); a.push(r); });
  const bench = new Map(); ((n.bench || {}).f || []).forEach(r => { let a = bench.get(r[0]); if (!a) bench.set(r[0], a = []); a.push(r); });
  const sk = n.skus || {}, skf = new Map(); (sk.f || []).forEach(r => skf.set(r[0] * 2 + r[1], r.slice(2)));
  const fx = n.fonte || {};
  return {M, meses: n.meses.map(String), dic, cats: n.cats, por, bench, bgeos: (n.bench || {}).geos || [], skItens: sk.itens || [], skf, canalTxt: n.canal_txt || {}, segTxt: n.seg_txt || {}, fonte: fx,
    tem: n.meses.map(() => true), parc: -1, ateDia: '', corte: +n.meses[M - 1], ult26: +n.meses[M - 1], gerado: DSO.gerado,
    rodape: ['Reckitt · Governança CTO · Nielsen e IQVIA: mercado e share da Reckitt nas categorias da base do CMI.', `Fonte: ${fx.nome || 'base do CMI'}. Dado licenciado, uso interno.`]};
}
const NIM = () => MODO === 'ni';
const titTxt = s => String(s).toLowerCase().replace(/(^|[\s(+.\-/&])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase());   // nome em texto puro (o esc vem depois)
const niCat = () => D.cats[S.niCat] || D.cats[0];
const niIni = (ci = S.niCat) => (D.cats[ci] && D.cats[ci].ini) || 0;   // primeiro mês com dado da categoria
const niGeoDe = (c, g = S.niGeo) => (c.geo_txt[g] ? g : 'CTO');   // UF escolhida numa categoria que só abre por área: lê a Área VII
const niGeoEf = (c = niCat()) => niGeoDe(c);
const niGeoTxt = (g = niGeoEf(), c = niCat()) => c.geo_txt[g] || g;
const niNaGeo = (g = niGeoEf(), c = niCat()) => (g === 'BR' ? 'no Brasil' : g === 'CTO' ? (c.abre === 'area' ? 'na Área VII (Centro-Oeste)' : 'na região CTO (DF, GO, MT, MS e TO/PA/AP)')
  : g === 'CO' ? 'no Centro-Oeste (DF, GO, MT e MS)' : g === 'TO_PA_AP' ? 'em TO, PA e AP' : 'em ' + g);
const niGi = g => D.dic.geo.indexOf(g);
const niUn = (c = niCat()) => c.un || 'Unidades';
const niMedNome = () => (S.niMed === 1 ? niUn() : 'Valor (R$)');
const niMedTxt = () => (S.niMed === 1 ? niUn().toLowerCase() : 'valor');   // no meio da frase: em valor, em unidades, em volume
const niVar = x => `${x >= 0 ? 'cresceu' : 'caiu'} ${pc(Math.abs(x)).replace('+', '')}`;
const niRs = x => (!isFinite(x) ? '' : Math.abs(x) >= 1e6 ? mi(x) : Math.abs(x) >= 1e3 ? `R$ ${nf1.format(x / 1e3)} mil` : `R$ ${nf0.format(x)}`);
const niQtd = x => (!isFinite(x) ? '' : Math.abs(x) >= 1e4 ? curto(x) : Math.abs(x) >= 100 ? nf0.format(x) : Math.abs(x) >= 10 ? nf1.format(x) : Math.abs(x) >= 1 || x === 0 ? nf2.format(x) : new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 3, maximumFractionDigits: 3}).format(x));
const niFmt = (x, med = S.niMed) => (med === 1 ? niQtd(x) : niRs(x));
const niCanal = i => esc(D.canalTxt[D.dic.canal[i]] || D.dic.canal[i]);
const niSegTxt = i => D.segTxt[D.dic.segmento[i]] || titTxt(D.dic.segmento[i]);
const niSeg = i => esc(niSegTxt(i));
const niFab = i => (D.dic.fab[i] === 'RECKITT' ? '<b>Reckitt</b>' : tit(D.dic.fab[i]));
const niMarca = i => { const m = String(D.dic.marca[i]); return `<span class="${mkCls(m)}">${tit(m)}</span>`; };
const niFocoAtivo = () => !!(S.f.fab.size || S.f.marca.size);
const niEhFoco = r => (niFocoAtivo() ? (!S.f.fab.size || S.f.fab.has(r[3])) && (!S.f.marca.size || S.f.marca.has(r[4])) : r[6] === 1);   // fabricante E marca: a marca daquele fabricante
const niFocoNome = () => { if (!niFocoAtivo()) return 'Reckitt';   // texto puro; "Veja (Reckitt)" quando marca e fabricante estão marcados
  const f = [...S.f.fab].map(i => (D.dic.fab[i] === 'RECKITT' ? 'Reckitt' : titTxt(D.dic.fab[i]))).join(' + '), m = [...S.f.marca].map(i => titTxt(D.dic.marca[i])).join(' + ');
  return f && m ? `${m} (${f})` : f || m; };
const niFocoDe = () => (niFocoAtivo() ? 'de ' + niFocoNome() : 'da Reckitt');   // "o share da Reckitt", "o share de Veja"
const niMkTxt = (c = niCat()) => (S.f.segmento.size ? 'segmentos do filtro' : (c.fora_padrao || []).length && S.niMk !== 'total' ? `sem ${(c.fora_padrao || []).map(titTxt).join(', ')}` : 'categoria inteira');
const niCap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const niGeoCats = (g = S.niGeo) => (g === 'BR' ? 'no Brasil' : g === 'CTO' || !g ? 'na Área VII nas categorias por área e na região CTO nas categorias por UF'
  : `${niNaGeo(g, D.cats.find(c => c.abre === 'uf') || niCat())} nas categorias por UF e na Área VII nas categorias por área`);   // o título de quem mostra todas as categorias

function niLinhas(ci, g, opc = {}) {   // linhas da categoria na geografia, no mercado do recorte (Canal e Segmento; Superfícies sem Desinfetante no padrão)
  const c = D.cats[ci], rows = D.por.get(ci * 64 + niGi(g)) || [];
  const fc = !opc.semCanal && !opc.inteira && S.f.canal.size ? S.f.canal : null, fs = !opc.inteira && S.f.segmento.size ? S.f.segmento : null;
  const fora = !fs && S.niMk !== 'total' && (c.fora_padrao || []).length ? new Set(c.fora_padrao.map(x => D.dic.segmento.indexOf(x))) : null;
  return rows.filter(r => (!fc || fc.has(r[2])) && (!fs || fs.has(r[5])) && (!fora || !fora.has(r[5])));
}
function niSerie(rows, med = S.niMed, foco = niEhFoco) {   // {t: mercado, c: foco} mês a mês
  const t = new Float64Array(D.M), c = new Float64Array(D.M);
  for (const r of rows) { if (r[7] !== med) continue; const f = foco(r); for (let j = 0; j < D.M; j++) { const v = r[8 + j]; t[j] += v; if (f) c[j] += v; } }
  return {t, c};
}
const niRb = r => r[6] === 1;
function niFatias(rows, chave, med = S.niMed) {   // fatias do mercado (segmento, canal): t = mercado da fatia, c = foco dentro dela
  const out = new Map();
  for (const r of rows) { if (r[7] !== med) continue; const k = chave(r); let o = out.get(k); if (!o) out.set(k, o = {t: new Float64Array(D.M), c: new Float64Array(D.M)}); const f = niEhFoco(r); for (let j = 0; j < D.M; j++) { const v = r[8 + j]; o.t[j] += v; if (f) o.c[j] += v; } }
  return out;
}
function niJogadores(rows, chave, med = S.niMed) {   // fabricantes e marcas: t = mercado do recorte inteiro, c = valor do grupo
  const T = niSerie(rows, med).t, out = new Map();
  for (const r of rows) { if (r[7] !== med) continue; const k = chave(r); let o = out.get(k); if (!o) out.set(k, o = {t: T, c: new Float64Array(D.M)}); for (let j = 0; j < D.M; j++) o.c[j] += r[8 + j]; }
  return out;
}
function niJanela(ci = S.niCat) {   // mês, trimestre (o mês e os 2 anteriores), ano (jan até o mês) e 12 meses; b = mesmo período do ano anterior, p = período anterior
  let v = D.meses.indexOf(String(S.corte)); if (v < 0) v = D.M - 1;
  const ini = niIni(ci), Y = +D.meses[v].slice(0, 4), mm = +D.meses[v].slice(4);
  const fx = (a, b) => { if (a < ini || b >= D.M || a > b) return null; const L = []; for (let i = a; i <= b; i++) L.push(i); return L; };   // mês sem dado na categoria: período indisponível
  const P = {mes: {nome: 'Mês', a: fx(v, v), b: fx(v - 12, v - 12), p: fx(v - 1, v - 1)}, tri: {nome: 'Trimestre', a: fx(v - 2, v), b: fx(v - 14, v - 12), p: fx(v - 5, v - 3)},
    ano: {nome: 'Ano', a: fx(v - mm + 1, v), b: fx(v - mm - 11, v - 12), p: null}, m12: {nome: '12 meses', a: fx(v - 11, v), b: fx(v - 23, v - 12), p: null}};
  Object.values(P).forEach(o => { o.txt = o.a ? exFaixaTxt(o.a) : ''; o.btxt = o.b ? exFaixaTxt(o.b) : 'sem o ano anterior'; o.ptxt = o.p ? exFaixaTxt(o.p) : ''; });
  const per = P[S.ui.niper] && P[S.ui.niper].a ? S.ui.niper : ['tri', 'mes', 'ano', 'm12'].find(k => P[k].a) || 'mes';
  return {v, Y, P, per, X: P[per], txt: exRot(v), a5: String(Y - 1).slice(2), a6: String(Y).slice(2), idx: P.tri.a || [v], ant: P.tri.b || [], temAnt: !!P.tri.b, temY0: v - 12 >= ini, parc: false};
}
const niSoma = (a, idx) => (idx ? idx.reduce((s, i) => s + a[i], 0) : NaN);
function niShare(o, idx) { if (!idx) return NaN; let s = 0, n = 0; idx.forEach(i => { if (o.t[i] > 0) { s += o.c[i] / o.t[i]; n++; } }); return n ? s / n : NaN; }   // média simples das shares mensais
function niNum(o, X) {   // os números de um grupo no período: mercado, foco, share e variações
  const ma = niSoma(o.t, X.a), mb = niSoma(o.t, X.b), ca = niSoma(o.c, X.a), cb = niSoma(o.c, X.b), sa = niShare(o, X.a), sb = niShare(o, X.b), sp = niShare(o, X.p);
  return {ma, mb, ca, cb, sa, sb, sp, dm: varr(ma, mb), dc: varr(ca, cb), ds: sa - sb, dsp: sa - sp};
}
const niPills = () => { const J = niJanela(); return `<div class="pills" style="margin:0 0 18px">${Object.entries(J.P).map(([k, o]) => (o.a ? `<button data-act="ui" data-k="niper" data-v="${k}" class="${k === J.per ? 'on' : ''}">${o.nome} · ${esc(o.txt)}</button>` : '')).join('')}</div>`; };
const niPerTxt = J => (J.X.a ? `${J.X.nome.toLowerCase()} ${J.X.txt}` : 'período sem dado');

/* recorte, selos e seletores */
function niFiltrar() {
  if (!(S.niCat >= 0 && S.niCat < D.cats.length)) S.niCat = 0;
  const v = D.meses.indexOf(String(S.corte)); if (v < 0 || v < niIni()) S.corte = D.corte;   // mês sem dado nesta categoria (link antigo ou troca de categoria): volta ao último mês
  const ok = {canal: new Set(), segmento: new Set(), fab: new Set(), marca: new Set()};
  (D.por.get(S.niCat * 64 + niGi(niGeoEf())) || []).forEach(r => { ok.canal.add(r[2]); ok.segmento.add(r[5]); ok.fab.add(r[3]); ok.marca.add(r[4]); });
  Object.keys(ok).forEach(k => S.f[k].forEach(i => { if (!ok[k].has(i)) S.f[k].delete(i); }));   // link de outra categoria: o filtro que não existe nesta sai
}
function niOpcoes(k) {
  const col = {canal: 2, segmento: 5, fab: 3, marca: 4}[k], s = new Set();
  (D.por.get(S.niCat * 64 + niGi(niGeoEf())) || []).forEach(r => s.add(r[col]));
  const ids = [...s], nome = i => (k === 'segmento' ? niSegTxt(i) : String(D.dic[k][i]));
  return k === 'canal' ? ids.sort((a, b) => a - b) : ids.sort((a, b) => nome(a).localeCompare(nome(b), 'pt-BR'));
}
function mesEsperadoNi() {   // a base do CMI chega cerca de 4 semanas depois do fim do mês: a partir do dia 28, o selo cobra o mês anterior
  const h = new Date(); let a = h.getFullYear(), m = h.getMonth() + 1 - (h.getDate() >= 28 ? 1 : 2); if (m <= 0) { m += 12; a--; }
  return `${a}${String(m).padStart(2, '0')}`;
}
const fontesNi = () => [fonte('nielsen')].filter(Boolean);
function validadeNi() {
  const f = fonte('nielsen'), ult = D.meses[D.M - 1], velho = ult < mesEsperadoNi();
  return {velho, parcial: false, txt: `Nielsen até ${amTxt(ult)}${f && f.extraido ? ` · base do CMI de ${f.extraido.slice(0, 5)}` : ''}${velho ? ` · falta ${amTxt(mesEsperadoNi())}` : ''}`};
}
const topoNi = () => { const f = fonte('nielsen'); return ['Nielsen', f && f.extraido ? `base do CMI de ${f.extraido.slice(0, 5)}` : '', `site de ${DSO.gerado.slice(0, 5)}`].filter(Boolean).join(' · '); };
const niGeoCurto = (g, c = niCat()) => ({CTO: c.abre === 'area' ? 'Área VII' : 'Região CTO', CO: 'Centro-Oeste', TO_PA_AP: 'TO, PA e AP', BR: 'Brasil'}[g] || g);
function niBarra() {   // barra do topo: mês, categoria e geografia (medida e mercado ficam no topo de cada página, para a barra caber na tela)
  const c = niCat(), ini = niIni();
  return `<label class="cut">Mês <select data-act="corte" title="Muda o mês do site inteiro">${D.meses.map((m, i) => `<option value="${m}" ${+m === +S.corte ? 'selected' : ''}${i < ini ? ' disabled' : ''}>${exRot(i)}${i < ini ? ' (sem dado)' : ''}</option>`).join('')}</select></label>` +
    `<label class="cut">Categoria <select data-act="nicat">${D.cats.map((x, i) => `<option value="${i}" ${i === S.niCat ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>` +
    `<label class="cut">Geografia <select data-act="nigeo" title="${esc(niGeoTxt())}">${Object.keys(c.geo_txt).map(k => `<option value="${esc(k)}" ${k === niGeoEf() ? 'selected' : ''}>${esc(niGeoCurto(k))}</option>`).join('')}</select></label>`;
}
function niOpcBar(pills = true, semMed = false) {   // medida e mercado (Superfícies), mais o período das tabelas; semMed: página que só lê valor
  const c = niCat(), seg = (act, L, on) => `<div class="seg">${L.map(([v, n]) => `<button data-act="${act}" data-v="${v}" class="${v === on ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:0 0 14px">${semMed ? '' : seg('nimed', [['0', 'Valor (R$)'], ['1', niUn()]], String(S.niMed === 1 ? 1 : 0))}` +
    ((c.fora_padrao || []).length ? seg('nimk', [['padrao', 'Sem ' + c.fora_padrao.map(titTxt).join(', ')], ['total', 'Categoria inteira']], S.niMk === 'total' ? 'total' : 'padrao') : '') + '</div>' + (pills ? niPills() : '');
}
function linhasRecorteNi() {
  const J = niJanela(), f = fonte('nielsen'), c = niCat(), usaPer = !['ni-inicio', 'ni-mes'].includes(S.page);
  const L = [['Perna', 'Nielsen'], ['Página', PAGES.find(p => p[0] === S.page)[1]], ['Mês', exRot(J.v)]];
  if (usaPer) L.push(['Período das tabelas', J.X.a ? `${J.X.nome}: ${J.X.txt}, contra ${J.X.btxt}` : 'sem dado']);
  L.push(['Categoria', `${c.nome} (${c.fonte})`], ['Geografia', niGeoTxt()], ['Medida', niMedNome()], ['Mercado', niMkTxt()], ['Foco do share', niFocoNome()],
    ['Regra', 'Share do mês = foco sobre o mercado; share de período = média simples das shares mensais; mercado e R$ somam os meses']);
  FILTROS.forEach(([k, n]) => L.push([n, S.f[k].size ? [...S.f[k]].map(i => (k === 'segmento' ? niSegTxt(i) : dic[k][i])).join(', ') : 'Todos']));
  L.push(['Site publicado em', DSO.gerado]);
  if (f) L.push([`Fonte ${f.nome}`, `${quandoFonte(f)}${f.obs ? '. ' + f.obs : ''}`]);
  (D.fonte.obs || []).forEach((x, i) => L.push([`Premissa ${i + 1}`, String(x)]));
  L.push(['Exportado em', new Date().toLocaleString('pt-BR')], ['Link desta visão', location.href]);
  return L;
}
const niRecSlide = () => { const J = niJanela(); return `${niCat().nome} · ${niGeoTxt()} · mês ${exRot(J.v)}`; };
const niCapaSlide = () => { const J = niJanela(); return ['ni-inicio', 'ni-mes'].includes(S.page) ? `share ${niFocoDe()} em ${niCat().nome}, ${niGeoTxt()}, mês ${J.txt}` : `share ${niFocoDe()} em ${niCat().nome}, ${niGeoTxt()}: ${niPerTxt(J)} contra ${J.X.btxt}`; };

/* componentes */
function niKpis(o, J, oBR) {
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${d}<span>${sub}</span></div></div>`;
  const sh = k => { const X = J.P[k]; if (!X.a) return card(`Share ${X.nome.toLowerCase()}`, 'sem dado', '', 'a categoria ainda não tinha dado na base'); const x = niNum(o, X), b = oBR ? niNum(oBR, X) : null;
    return card(`Share ${X.nome.toLowerCase()} · ${esc(X.txt)}`, isFinite(x.sa) ? p1(x.sa) : 'sem dado', vpp(x.ds), `${X.b ? `contra ${p1(x.sb)} em ${esc(X.btxt)}` : 'sem o ano anterior na base'}${b && isFinite(b.sa) ? ` · Brasil ${p1(b.sa)}${isFinite(b.ds) ? ` (${ppTxt(b.ds)})` : ''}` : ''}`); };
  const X = J.P.tri, x = niNum(o, X), F = esc(niFocoNome());
  return `<div class="grid g3">${sh('mes')}${sh('tri')}${sh('ano')}${sh('m12')}` +
    card(`Mercado · ${esc(X.txt || 'trimestre')}`, X.a ? niFmt(x.ma) : 'sem dado', vbig(x.dm), X.b ? `em ${esc(niMedTxt())}, contra ${niFmt(x.mb)} em ${esc(X.btxt)}` : `em ${esc(niMedTxt())}`) +
    card(`${F} · ${esc(X.txt || 'trimestre')}`, X.a ? niFmt(x.ca) : 'sem dado', vbig(x.dc), X.b ? `contra ${niFmt(x.cb)} em ${esc(X.btxt)}` : '') + '</div>';
}
function niCurvaGeo(oA, oB, nA, nB, J, alto = SLIDE ? 330 : 240) {   // share mês a mês nos últimos 24 meses: a geografia em rosa, o Brasil em cinza
  const W = Math.round(Math.max(240, Math.min(1180, larguraCard()))), H = alto, i0 = Math.max(niIni(), J.v - 23), idx = []; for (let i = i0; i <= J.v; i++) idx.push(i);
  const sa = idx.map(i => (oA.t[i] > 0 ? oA.c[i] / oA.t[i] : NaN)), sb = oB ? idx.map(i => (oB.t[i] > 0 ? oB.c[i] / oB.t[i] : NaN)) : [];
  const xs = [...sa, ...sb].filter(isFinite).map(x => x * 100); if (!xs.length) return '<div class="empty">Sem dado neste recorte.</div>';
  const pl = 40, pr = 12, pt = 20, pb = 30, gw = (W - pl - pr) / idx.length, lo = Math.min(...xs), hi = Math.max(...xs), folga = Math.max(1, (hi - lo) * 0.15);
  let y0 = Math.max(0, Math.floor((lo - folga) / 5) * 5); const y1 = Math.min(100, Math.ceil((hi + folga) / 5) * 5); if (y1 - y0 < 10) y0 = Math.max(0, y1 - 10);
  const passo = y1 - y0 > 40 ? 20 : y1 - y0 > 20 ? 10 : 5, px = j => pl + (j + 0.5) * gw, py = x => pt + (y1 - x * 100) / (y1 - y0) * (H - pt - pb);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share mês a mês">`;
  for (let g = y0; g <= y1 + 1e-9; g += passo) { const y = py(g / 100).toFixed(1); s += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#ECECEF"/><text x="${pl - 6}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#86868B">${g}%</text>`; }
  const linha = (L, cor, w) => { let out = '', cur = []; const fecha = () => { if (cur.length > 1) out += `<polyline points="${cur.join(' ')}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`; cur = []; };
    L.forEach((x, j) => { if (isFinite(x)) cur.push(px(j).toFixed(1) + ',' + py(x).toFixed(1)); else fecha(); }); fecha(); return out; };
  s += linha(sb, '#B0B0B8', 2.5) + linha(sa, '#FF007F', 3);
  sa.forEach((x, j) => { if (!isFinite(x)) return; s += `<circle cx="${px(j).toFixed(1)}" cy="${py(x).toFixed(1)}" r="3.5" fill="#FF007F"/>`; if (gw >= 40 || j === sa.length - 1 || j === 0) s += `<text class="vl" x="${px(j).toFixed(1)}" y="${(py(x) - 9).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#1D1D1F">${nf1.format(x * 100)}</text>`; });
  idx.forEach((i, j) => { const m = +D.meses[i].slice(4); if (gw >= 30 || m === 1 || j === 0 || j === idx.length - 1) s += `<text x="${px(j).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="#6E6E73">${gw >= 30 ? MESES[m - 1] : MESES[m - 1][0]}${m === 1 || j === 0 ? '/' + D.meses[i].slice(2, 4) : ''}</text>`;
    s += `<rect x="${(pl + j * gw).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent" data-tip="${esc(`<b>${exRot(i)}</b> · ${esc(nA)}: ${isFinite(sa[j]) ? p1(sa[j]) : 'sem dado'}${oB ? ` · ${esc(nB)}: ${isFinite(sb[j]) ? p1(sb[j]) : 'sem dado'}` : ''}`)}"/>`; });
  return s + `</svg><div class="legend"><span><i style="background:#FF007F"></i>${esc(nA)}</span>${oB ? `<span><i style="background:#B0B0B8"></i>${esc(nB)}</span>` : ''}<span>Share do mês, últimos ${idx.length} meses</span></div>`;
}
const niSpark = (o, J) => exSpark(o, J);
function niColsShare(J) {   // colunas fixas de share (a ordenação guarda a posição da coluna): ano anterior, período, Δ pp e Δ pp sobre o período anterior (vazia em ano e 12 meses)
  const X = J.X;
  return [{c: `Share ${esc(X.btxt)}`, v: x => x.n.sb, h: x => p1(x.n.sb), t: true}, {c: `Share ${esc(X.txt)}`, v: x => x.n.sa, h: x => p1(x.n.sa), b: true, t: true},
    {c: 'Δ pp vs ano anterior', v: x => x.n.ds, h: x => vppt(x.n.ds), t: true}, {c: X.p ? `Δ pp sobre ${esc(X.ptxt)}` : 'Δ pp sobre o período anterior', v: x => x.n.dsp, h: x => vppt(x.n.dsp), t: true}];
}
function niTabFatias(t, rot, Mp, nomeFn, J, opc = {}) {   // segmento ou canal: tamanho, peso, crescimento do mercado e share do foco dentro da fatia, com o Brasil ao lado
  const X = J.X, tot = opc.tot, mt = tot ? niSoma(tot.t, X.a) : 0, F = esc(niFocoNome());
  const L = [...Mp.entries()].map(([k, o]) => ({k, o, n: niNum(o, X), br: opc.br && opc.br.get(k) ? niShare(opc.br.get(k), X.a) : NaN})).filter(x => x.n.ma > 0 || x.n.mb > 0);
  const T = tot ? {k: -1, o: tot, n: niNum(tot, X), br: opc.brTot ? niShare(opc.brTot, X.a) : NaN} : null;
  const cols = [{c: rot, v: x => semAcento(String(nomeFn(x.k)).replace(/<[^>]+>/g, '')), h: x => nomeFn(x.k), l: true, b: true, t: () => 'Total'},
    {c: `Mercado ${esc(X.txt)}`, v: x => x.n.ma, h: x => niFmt(x.n.ma), t: true}, {c: 'Peso', v: x => (mt ? x.n.ma / mt : NaN), h: x => p1(mt ? x.n.ma / mt : NaN), t: () => (mt ? '100,0%' : '')},
    {c: 'Mercado vs ano anterior', v: x => x.n.dm, h: x => vc(x.n.dm), t: true}, {c: `${F} ${esc(X.txt)}`, v: x => x.n.ca, h: x => niFmt(x.n.ca), t: true},
    {c: `${F} vs ano anterior`, v: x => x.n.dc, h: x => vc(x.n.dc), t: true}, ...niColsShare(J),
    {c: 'Share Brasil', v: x => x.br, h: x => p1(x.br), t: true}, {c: 'Gap pp', v: x => x.n.sa - x.br, h: x => vppt(x.n.sa - x.br), t: true},
    {c: `Curva ${J.a5} · ${J.a6}`, h: x => niSpark(x.o, J), oc: true}];
  return exTabela(t, L, cols, {tot: T, padrao: 1});
}
function niPreco(rows, chave, X) {   // preço médio do grupo e do mercado no período e o índice (mercado = 100); X explícito
  const V = niJogadores(rows, chave, 0), U = niJogadores(rows, chave, 1), out = new Map();
  const mv = niSoma(niSerie(rows, 0).t, X.a), mu = niSoma(niSerie(rows, 1).t, X.a), pm = mu > 0 ? mv / mu : NaN;
  V.forEach((o, k) => { const u = U.get(k), va = niSoma(o.c, X.a), ua = u ? niSoma(u.c, X.a) : NaN, p = ua > 0 ? va / ua : NaN; out.set(k, {p, ix: p / pm * 100}); });
  return {mapa: out, pm};
}
const niComPreco = () => niUn() === 'Unidades';   // em volume a unidade da base não é clara: só o índice de preço (mercado = 100), que não depende dela
function niTabJog(t, rot, rows, chave, nomeFn, J, opc = {}) {
  const X = J.X, Mp = niJogadores(rows, chave), PR = niPreco(rows, chave, X), BR = opc.brRows ? niJogadores(opc.brRows, chave) : null;
  const L = [...Mp.entries()].map(([k, o]) => ({k, o, n: niNum(o, X), pr: (PR.mapa.get(k) || {}).p, ix: (PR.mapa.get(k) || {}).ix, br: BR && BR.get(k) ? niShare(BR.get(k), X.a) : NaN})).filter(x => x.n.ca > 0 || x.n.cb > 0);
  const cols = [{c: rot, v: x => semAcento(String(nomeFn(x.k)).replace(/<[^>]+>/g, '')), h: x => nomeFn(x.k), l: true, b: true}, ...niColsShare(J),
    {c: `${esc(niMedNome())} ${esc(X.txt)}`, v: x => x.n.ca, h: x => niFmt(x.n.ca)}, {c: 'vs ano anterior', v: x => x.n.dc, h: x => vc(x.n.dc)},
    {c: 'Share Brasil', v: x => x.br, h: x => p1(x.br)},
    {c: niComPreco() ? 'Preço médio (R$ por unidade)' : 'Preço médio', v: x => (niComPreco() ? x.pr : NaN), h: x => (niComPreco() && isFinite(x.pr) ? 'R$ ' + n2(x.pr) : '')},
    {c: 'Índice de preço', v: x => x.ix, h: x => (isFinite(x.ix) ? n0(x.ix) : '')}, {c: `Curva ${J.a5} · ${J.a6}`, h: x => niSpark(x.o, J), oc: true}];
  return {html: exTabela(t, L, cols, {padrao: 2}), L, pm: PR.pm};
}
function niMatriz(rot, itens, J, opc = {}) {   // grupo x mês: share do mês (ou o valor), dos últimos 13 meses com dado
  const i0 = Math.max(niIni(opc.ci), J.v - 12), idx = []; for (let i = i0; i <= J.v; i++) idx.push(i);
  const cel = o => i => (opc.valor ? niFmt(o.c[i]) : o.t[i] > 0 ? p1(o.c[i] / o.t[i]) : '');
  if (!itens.length) return '<div class="empty">Nada neste recorte.</div>';
  return `<div class="tw fim"><table><thead><tr><th class="l">${rot}</th>${idx.map(i => `<th>${exRot(i)}</th>`).join('')}</tr></thead><tbody>` +
    itens.map(([nome, o, cl]) => `<tr class="${cl || ''}"><td class="l b">${nome}</td>${idx.map(i => `<td class="${i === J.v ? 'b' : ''}">${cel(o)(i)}</td>`).join('')}</tr>`).join('') + '</tbody></table></div>';
}
function niPesoTPA(ci, X) {   // nas categorias por UF: quanto o bloco TO, PA e AP pesa no mercado da região CTO (valor, categoria inteira)
  const c = D.cats[ci]; if (c.abre !== 'uf' || !X || !X.a) return NaN;
  const so = s => s.filter(r => r[7] === 0), a = niSerie(so(D.por.get(ci * 64 + niGi('CTO')) || []), 0, niRb).t, b = niSerie(so(D.por.get(ci * 64 + niGi('TO_PA_AP')) || []), 0, niRb).t;
  const ta = niSoma(a, X.a); return ta > 0 ? niSoma(b, X.a) / ta : NaN;
}

/* leitura automática: onde ganha e onde perde (nomes vêm da base cifrada) */
function niLeitura(J, rows, rowsBR) {
  const X = J.P.tri, o = niSerie(rows), x = niNum(o, X), L = [], lista = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '');
  if (!X.a) return '<div class="card"><div class="empty">A categoria ainda não tinha dado na base no trimestre escolhido.</div></div>';
  if (!(x.ma > 0)) return '<div class="card"><div class="empty">Sem mercado neste recorte no trimestre.</div></div>';
  if (niFocoAtivo() && !(x.ca > 0)) return '<div class="card"><div class="empty">A combinação de fabricante e marca marcada não tem venda neste recorte. Tire um dos dois filtros.</div></div>';
  const g = niGeoEf(), b = rowsBR ? niNum(niSerie(rowsBR), X) : null, foco = niFocoAtivo() ? esc(niFocoNome()) : 'a Reckitt', Foco = niFocoAtivo() ? foco : 'A Reckitt';
  const valorDs = S.niMed === 0 && isFinite(x.ds) ? ` A variação de ${ppTxt(x.ds)} equivale a cerca de ${niRs(Math.abs(x.ds) * x.ma)} no trimestre (pp vezes o mercado).` : '';
  L.push(`${Foco} tem ${p1(x.sa)} de share em ${esc(niCat().nome.toLowerCase())} no trimestre ${esc(X.txt)}, em ${esc(niMedTxt())}, ${esc(niNaGeo(g))}${X.b ? `: ${ppTxt(x.ds)} sobre o mesmo trimestre do ano anterior (${p1(x.sb)})${X.p ? ` e ${ppTxt(x.dsp)} sobre ${esc(X.ptxt)}` : ''}` : X.p ? `: ${ppTxt(x.dsp)} sobre ${esc(X.ptxt)} (sem o mesmo trimestre do ano anterior na base)` : ''}.${valorDs}` +
    (b && isFinite(b.sa) ? ` No Brasil, ${p1(b.sa)}${isFinite(b.ds) ? ` (${ppTxt(b.ds)} sobre ${esc(X.btxt)})` : ''}: ${x.sa >= b.sa ? `${ppTxt(x.sa - b.sa).replace('+', '')} acima` : `${ppTxt(b.sa - x.sa).replace('+', '')} abaixo`}.` : ''));
  if (X.b && isFinite(x.dm) && isFinite(x.dc)) {
    const rel = x.dc - x.dm;
    const porque = rel < -0.005 ? (x.dc < 0 && x.dm < 0 ? `${Foco} cai mais que o mercado, e é isso que explica a perda de share.` : x.dc < 0 ? `${Foco} cai com o mercado crescendo, e é isso que explica a perda de share.` : `${Foco} cresce menos que o mercado, e é isso que explica a perda de share.`)
      : rel > 0.005 ? (x.dc >= 0 && x.dm >= 0 ? `${Foco} cresce mais que o mercado, e é isso que sustenta o ganho de share.` : x.dc >= 0 ? `${Foco} cresce com o mercado caindo, e é isso que sustenta o ganho de share.` : `${Foco} cai menos que o mercado, e é isso que segura o share.`)
      : `${Foco} e o mercado andam juntos.`;
    L.push(`O mercado ${niVar(x.dm)} no trimestre (${niFmt(x.ma)}); ${foco} ${niVar(x.dc)} (${niFmt(x.ca)}). ${porque}`);
  }
  const i0 = Math.max(niIni(), J.v - 12), sm = []; for (let i = i0; i <= J.v; i++) if (o.t[i] > 0) sm.push([i, o.c[i] / o.t[i]]);
  if (sm.length >= 6) { const mn = sm.reduce((a, z) => (z[1] < a[1] ? z : a)), mx = sm.reduce((a, z) => (z[1] > a[1] ? z : a));
    if (mn[0] === J.v) L.push(`${esc(niCap(J.txt))} é o menor share dos últimos ${sm.length} meses (${p1(mn[1])}).`); else if (mx[0] === J.v) L.push(`${esc(niCap(J.txt))} é o maior share dos últimos ${sm.length} meses (${p1(mx[1])}).`); }
  const FB = [...niJogadores(rows, r => r[3]).entries()].map(([k, oo]) => ({k, n: niNum(oo, X)})).filter(z => isFinite(z.n.ds) && D.dic.fab[z.k] !== 'OUTROS FABRICANTES' && (niFocoAtivo() || D.dic.fab[z.k] !== 'RECKITT'));   // com o foco na Reckitt, a 1ª frase já diz o quanto ela ganha ou perde
  const ganha = FB.filter(z => z.n.ds >= 0.002).sort((a, b) => b.n.ds - a.n.ds).slice(0, 3), perde = FB.filter(z => z.n.ds <= -0.002).sort((a, b) => a.n.ds - b.n.ds).slice(0, 3);
  if (X.b && (ganha.length || perde.length)) L.push(`${ganha.length ? `Quem mais ganha share: ${lista(ganha.map(z => `${niFab(z.k)} (${ppTxt(z.n.ds)}, ${p1(z.n.sa)})`))}.` : ''} ${perde.length ? `Quem mais perde: ${lista(perde.map(z => `${niFab(z.k)} (${ppTxt(z.n.ds)}, ${p1(z.n.sa)})`))}.` : ''}`.trim());
  const mt = x.ma, impacto = M => [...M.entries()].map(([k, oo]) => ({k, n: niNum(oo, X)})).filter(z => z.n.ma > 0 && isFinite(z.n.ds)).map(z => ({...z, imp: z.n.ds * z.n.ma / mt})).sort((a, b) => a.imp - b.imp);
  const frase = (rotulo, I, nomeFn) => { if (!X.b || I.length < 2) return; const pi = I[0], me = I[I.length - 1], q = z => `${nomeFn(z.k)} (${ppTxt(z.n.ds)} no ${rotulo}, que pesa ${p1(z.n.ma / mt)} do mercado)`;
    L.push(`Por ${rotulo}, ${pi.imp < -0.0005 ? `quem mais tira share é ${q(pi)}` : `nenhum ${rotulo} tira share relevante`}${me.imp > 0.0005 ? `; quem mais põe é ${q(me)}` : ''}.`); };
  frase('segmento', impacto(niFatias(rows, r => r[5])), niSeg);
  frase('canal', impacto(niFatias(rows, r => r[2])), niCanal);
  const PR = niPreco(rows, r => (niEhFoco(r) ? 1 : 0), X), pf = PR.mapa.get(1);
  if (S.niMed === 0 && pf && isFinite(pf.ix)) L.push(niComPreco() ? `O preço médio ${niFocoAtivo() ? 'de ' + foco : 'da Reckitt'} no trimestre é R$ ${n2(pf.p)} por unidade, índice ${n0(pf.ix)} contra o mercado (mercado = 100).`
    : `O índice de preço ${niFocoAtivo() ? 'de ' + foco : 'da Reckitt'} no trimestre é ${n0(pf.ix)} contra o mercado (mercado = 100; R$ por volume sobre o R$ por volume do mercado).`);
  const tpa = g === 'CTO' ? niPesoTPA(S.niCat, X) : NaN;
  if (isFinite(tpa)) L.push(`O bloco TO, PA e AP pesa ${p1(tpa)} do mercado da região CTO nesta categoria. Para comparar com a Área VII das categorias por área, use a geografia Centro-Oeste (DF, GO, MT e MS).`);
  return `<div class="card"><ol class="num">${L.map(t => `<li><span>${t}</span></li>`).join('')}</ol></div>`;
}

/* ----- páginas ----- */
const niNotaFiltros = txt => `<p class="note" style="margin:10px 0 0">${txt}</p>`;
function niAvisoGeo() {
  const c = niCat(); return c.geo_txt[S.niGeo] || !S.niGeo ? '' : `<p class="note">${esc(c.nome)} só abre até a Área VII na base Nielsen: a página mostra a Área VII. A geografia ${esc(niGeoCurto(S.niGeo))} vale para Sanitário, Lava-louças e as categorias da IQVIA.</p>`;
}
function niCartaoCat(i, J0) {   // um cartão por categoria: share da Reckitt no trimestre, na geografia escolhida (categoria por área: Área VII), sem os filtros
  const cc = D.cats[i], gg = niGeoDe(cc), X = niJanela(i).P.tri, so = s => ((cc.fora_padrao || []).length && S.niMk !== 'total' ? s.filter(r => !cc.fora_padrao.includes(D.dic.segmento[r[5]])) : s);
  const oo = niSerie(so(D.por.get(i * 64 + niGi(gg)) || []), 0, niRb), n = niNum(oo, X), b = gg === 'BR' ? null : niNum(niSerie(so(D.por.get(i * 64 + niGi('BR')) || []), 0, niRb), X), tpa = gg === 'CTO' ? niPesoTPA(i, X) : NaN;
  return `<a class="card" href="#ni-inicio" data-act="nicat" data-v="${i}" style="color:inherit;text-decoration:none"><p class="eyebrow">${esc(cc.nome)} · ${esc(cc.fonte)}</p><div class="kpi"><div class="val" style="font-size:30px">${X.a ? p1(n.sa) : 'sem dado'}</div>
    <div class="sub">${[isFinite(n.ds) ? `${vppt(n.ds)} sobre ${esc(X.btxt)}` : '', b && isFinite(b.sa) ? `Brasil ${p1(b.sa)}${isFinite(b.ds) ? ` (${ppTxt(b.ds)})` : ''}` : '', X.a ? `mercado ${niRs(n.ma)}${isFinite(n.dm) ? ` (${pc(n.dm)})` : ''}` : ''].filter(Boolean).join(' · ')}</div></div>${niSpark(oo, {...J0, temY0: true})}
    <p class="note" style="margin:6px 0 0">${esc(cc.geo_txt[gg])}${isFinite(tpa) ? ` · TO, PA e AP pesam ${p1(tpa)}` : ''}${i === S.niCat ? ' · aberta nas páginas' : ''}</p></a>`;
}
function pgNiInicio() {
  const J = niJanela(), c = niCat(), g = niGeoEf(), rows = niLinhas(S.niCat, g), rowsBR = g === 'BR' ? null : niLinhas(S.niCat, 'BR'), o = niSerie(rows), oBR = rowsBR ? niSerie(rowsBR) : null;
  const side = `<div class="side">${(DSO.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>${esc(c.nome)} · ${esc(niGeoTxt())}<br>Mês ${esc(J.txt)} · ${esc(niMedNome())} · foco <span class="lk">${esc(niFocoNome())}</span></div>`;
  let h = hero('', 'Nielsen.', 'Mercado e share da Reckitt nas categorias Nielsen e IQVIA, mês a mês.', side);
  h += niAvisoGeo() + niOpcBar(false);
  h += `<h2 class="sec">${esc(c.nome)} em números. <span>${esc(niCap(niNaGeo(g)))}, ${esc(niMkTxt())}; share de período = média das shares mensais.</span></h2>` + niKpis(o, J, oBR);
  const X = J.P.tri;
  h += `<h2 class="sec">As categorias. <span>Share da Reckitt ${X.a ? 'no trimestre ' + esc(X.txt) : 'em ' + esc(J.txt)} em cada categoria, ${esc(niGeoCats())}.</span></h2><div class="grid g3">` +
    D.cats.map((cc, i) => niCartaoCat(i, J)).join('') + '</div>' + niNotaFiltros('Os cartões leem a Reckitt inteira em valor, sem os filtros de canal, segmento, fabricante e marca. Clique numa categoria para abrir as páginas nela.');
  h += `<h2 class="sec">A leitura. <span>Onde ganha e onde perde share, calculada sobre o recorte marcado.</span></h2>` + niLeitura(J, rows, rowsBR);
  h += `<h2 class="sec">A curva do share. <span>${esc(niFocoNome())} mês a mês, ${J.temY0 ? `${J.Y - 1} contra ${J.Y}` : String(J.Y)}${oBR ? ', e contra o Brasil' : ''}.</span></h2><div class="card"><p class="eyebrow">Share do mês · ${esc(niGeoTxt())}</p>${exCurva(o, {...J, txt: X.txt || J.txt})}</div>`;
  if (oBR) h += `<div class="card"><p class="eyebrow">${esc(niGeoTxt())} contra o Brasil · últimos ${J.v - Math.max(niIni(), J.v - 23) + 1} meses</p>${niCurvaGeo(o, oBR, niGeoTxt(), 'Brasil', J)}</div>`;
  const IDX = [['ni-categorias', 'Categorias', 'Todas as categorias lado a lado: mercado, crescimento, share, o Brasil e quanto o Δ de share vale em R$.'],
    ['ni-segmentos', 'Segmentos', 'Dentro da categoria: o tamanho de cada segmento, quanto cresce e o share da Reckitt em cada um.'],
    ['ni-concorrencia', 'Concorrência', 'Fabricantes e marcas: share, crescimento, preço e quem ganha e quem perde.'],
    ['ni-canais', 'Canais', 'Hiper, super, tradicional, independentes, atacado e cash & carry: peso, crescimento e share em cada canal.'],
    ['ni-geografia', 'Geografia', 'A região CTO contra as outras áreas e UFs e o Brasil.'],
    ['ni-skus', 'SKUs', 'Os SKUs da Reckitt e os maiores da concorrência na região CTO.'],
    ['ni-mes', 'Mês a mês', 'Mercado, Reckitt e share mês a mês, marca a marca.']];
  h += `<h2 class="sec">O índice. <span>As páginas da perna Nielsen.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como ler. <span>Regras da perna Nielsen.</span></h2><div class="card"><ol class="num">${[
    'Fonte: a base mensal do time de CMI, com Nielsen (Superfícies, Alvejantes seguros, Sanitário e Lava-louças) e IQVIA (Complementos nutricionais, Preservativos e Lubrificantes). Dado licenciado: uso interno.',
    'Categoria e Geografia são seletores únicos: categorias diferentes são mercados diferentes e não se somam.',
    'Superfícies e Alvejantes seguros só abrem até a Área VII, o recorte Nielsen do Centro-Oeste. Sanitário, Lava-louças e IQVIA abrem por UF; a região CTO soma DF, GO, MT, MS e o bloco TO, PA e AP, que vem junto na base. Para comparar com a Área VII, use Centro-Oeste.',
    'Share do mês = foco sobre o mercado. Share de trimestre, ano e 12 meses = média simples das shares mensais, o mesmo método do slide de share do CMI. Mercado e R$ somam os meses.',
    'Canal e Segmento definem o mercado. Fabricante e Marca trocam o foco: sem eles, o foco é a Reckitt; com eles, o share passa a ser o do fabricante ou da marca marcados (os dois juntos: a marca daquele fabricante).',
    'Em Superfícies, o padrão do site é o mercado sem Desinfetante, segmento praticamente sem marca Reckitt; o botão Categoria inteira inclui o Desinfetante.',
    'O seletor Mês muda o site inteiro. A comparação é sempre contra o mesmo período do ano anterior; no mês e no trimestre, também contra o período anterior. Sanitário, Lava-louças e IQVIA só têm dado a partir de jul/24 ou ago/24.',
    'Marcas e fabricantes com menos de 0,4% do mercado de 12 meses viram Outras marcas e Outros fabricantes; a Reckitt fica sempre aberta. Lysoform (SC Johnson) e K-Y não entram como Reckitt.',
    'Unidades: Superfícies e Alvejantes trazem unidades; as outras categorias trazem o volume, que é sempre unidade (o da IQVIA vem em milhares e o site multiplica por 1.000). Os meses têm 4 ou 5 semanas, conforme o calendário do ano: compare com o mesmo mês do ano anterior.'].map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
  return h;
}
function pgNiCategorias() {
  const J = niJanela(), g = niGeoEf(), per = J.per;
  let h = hero('NIELSEN · CATEGORIAS', 'As categorias.', `Share da Reckitt no ${esc(niPerTxt(J))} em cada categoria, ${esc(niGeoCats())}.`);
  h += niPills();
  const L = D.cats.map((cc, i) => {
    const gg = niGeoDe(cc), Ji = niJanela(i), X = Ji.P[per].a ? Ji.P[per] : {a: null, b: null, p: null}, so = s => ((cc.fora_padrao || []).length && S.niMk !== 'total' ? s.filter(r => !cc.fora_padrao.includes(D.dic.segmento[r[5]])) : s);
    const o = niSerie(so(D.por.get(i * 64 + niGi(gg)) || []), 0, niRb), ob = niSerie(so(D.por.get(i * 64 + niGi('BR')) || []), 0, niRb), n = niNum(o, X), nb = niNum(ob, X);
    return {k: i, o, n, br: nb.sa, dbr: nb.ds, gg, rs: n.ds * n.ma};
  });
  const X = J.X;
  const cols = [{c: 'Categoria', v: x => semAcento(D.cats[x.k].nome), h: x => `<button class="lnk" data-act="nicat" data-v="${x.k}">${esc(D.cats[x.k].nome)}</button>`, l: true, b: true},
    {c: 'Fonte', v: x => D.cats[x.k].fonte, h: x => esc(D.cats[x.k].fonte), l: true}, {c: 'Geografia', v: x => x.gg, h: x => esc(niGeoCurto(x.gg, D.cats[x.k])), l: true},
    {c: `Mercado ${esc(X.txt)}`, v: x => x.n.ma, h: x => niRs(x.n.ma)}, {c: 'Mercado vs ano anterior', v: x => x.n.dm, h: x => vc(x.n.dm)},
    {c: `Reckitt ${esc(X.txt)}`, v: x => x.n.ca, h: x => niRs(x.n.ca)}, {c: 'Reckitt vs ano anterior', v: x => x.n.dc, h: x => vc(x.n.dc)}, ...niColsShare(J),
    {c: 'Δ de share em R$', v: x => x.rs, h: x => (isFinite(x.rs) ? `<span class="vr ${cls(x.rs) || 'flat'}">${x.rs < 0 ? '-' : '+'}${niRs(Math.abs(x.rs))}</span>` : '')},
    {c: 'Share Brasil', v: x => x.br, h: x => (x.gg === 'BR' ? '' : p1(x.br))}, {c: 'Δ pp Brasil', v: x => x.dbr, h: x => (x.gg === 'BR' ? '' : vppt(x.dbr))},
    {c: 'Gap pp', v: x => x.n.sa - x.br, h: x => (x.gg === 'BR' ? '' : vppt(x.n.sa - x.br))}, {c: `Curva ${J.a5} · ${J.a6}`, h: x => niSpark(x.o, {...J, temY0: true}), oc: true}];
  h += `<h2 class="sec">Lado a lado. <span>Em valor (R$), a Reckitt inteira em cada categoria; ${S.niMk === 'total' ? 'Superfícies com a categoria inteira' : 'Superfícies sem Desinfetante'}.</span></h2><div class="card">${exTabela('nicat', L, cols, {padrao: 3})}` +
    niNotaFiltros('Esta página lê o total de cada categoria, sem os filtros de canal, segmento, fabricante e marca (Superfícies segue o botão Sem Desinfetante ou Categoria inteira). Categoria por área lê a Área VII. Δ de share em R$ = variação do share vezes o mercado do período: quanto a Reckitt venderia a mais (ou a menos) com o share do ano anterior. Clique na categoria para abrir as outras páginas nela.') + '</div>';
  h += `<h2 class="sec">O share mês a mês. <span>Reckitt em valor, últimos 13 meses; em negrito, o mês escolhido.</span></h2><div class="card">${niMatriz('Categoria', L.map(x => [esc(D.cats[x.k].nome), x.o]), J, {ci: -1})}</div>`;
  return h;
}
function pgNiSegmentos() {
  const J = niJanela(), c = niCat(), g = niGeoEf(), rows = niLinhas(S.niCat, g), rowsBR = g === 'BR' ? null : niLinhas(S.niCat, 'BR');
  let h = hero('NIELSEN · SEGMENTOS', `${esc(c.nome)}.`, `O tamanho de cada segmento e o share ${esc(niFocoDe())} dentro dele, ${esc(niNaGeo(g))}.`) + niAvisoGeo() + niOpcBar();
  const Mp = niFatias(rows, r => r[5]), BRm = rowsBR ? niFatias(rowsBR, r => r[5]) : null;
  h += `<h2 class="sec">Segmento a segmento. <span>${esc(niCap(niPerTxt(J)))} contra ${esc(J.X.btxt)}, em ${esc(niMedTxt())}; ${esc(niMkTxt())}.</span></h2><div class="card">${niTabFatias('niseg', 'Segmento', Mp, niSeg, J, {tot: niSerie(rows), br: BRm, brTot: rowsBR ? niSerie(rowsBR) : null})}${niNotaFiltros('Peso = parte do mercado do recorte. Share = foco dentro do segmento. Gap = share na geografia menos o share do Brasil no mesmo segmento.')}</div>`;
  h += `<h2 class="sec">O share mês a mês. <span>Share ${esc(niFocoDe())} dentro de cada segmento.</span></h2><div class="card">${niMatriz('Segmento', [...Mp.entries()].sort((a, b) => niSoma(b[1].t, J.P.tri.a || [J.v]) - niSoma(a[1].t, J.P.tri.a || [J.v])).map(([k, o]) => [niSeg(k), o]).concat([['Total', niSerie(rows), 'tot']]), J)}</div>`;
  return h;
}
function pgNiConcorrencia() {
  const J = niJanela(), c = niCat(), g = niGeoEf(), rows = niLinhas(S.niCat, g), rowsBR = g === 'BR' ? null : niLinhas(S.niCat, 'BR');
  let h = hero('NIELSEN · CONCORRÊNCIA', `${esc(c.nome)}.`, `Quem ganha e quem perde share ${esc(niNaGeo(g))}.`) + niAvisoGeo() + niOpcBar();
  const F = niTabJog('nifab', 'Fabricante', rows, r => r[3], niFab, J, {brRows: rowsBR}), Mk = niTabJog('nimk', 'Marca', rows, r => r[4], niMarca, J, {brRows: rowsBR});
  const X = J.X, lista = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : a[0] || '');
  const mv = F.L.filter(x => isFinite(x.n.ds) && D.dic.fab[x.k] !== 'OUTROS FABRICANTES'), sobe = mv.filter(x => x.n.ds >= 0.002).sort((a, b) => b.n.ds - a.n.ds).slice(0, 4), cai = mv.filter(x => x.n.ds <= -0.002).sort((a, b) => a.n.ds - b.n.ds).slice(0, 4);
  h += `<h2 class="sec">Quem ganha e quem perde. <span>Variação do share no ${esc(niPerTxt(J))} contra ${esc(X.btxt)}.</span></h2><div class="card"><ol class="num">` +
    (X.b ? [sobe.length ? `Ganham share: ${lista(sobe.map(x => `${niFab(x.k)} (${ppTxt(x.n.ds)}, ${p1(x.n.sa)})`))}.` : 'Nenhum fabricante ganha mais de 0,2 pp.', cai.length ? `Perdem share: ${lista(cai.map(x => `${niFab(x.k)} (${ppTxt(x.n.ds)}, ${p1(x.n.sa)})`))}.` : 'Nenhum fabricante perde mais de 0,2 pp.'] : ['Sem o mesmo período do ano anterior na base.']).map(t => `<li><span>${t}</span></li>`).join('') + '</ol></div>';
  const notaPreco = niComPreco() ? `Índice de preço = preço médio sobre o preço médio do mercado (R$ ${n2(F.pm)} por unidade), vezes 100.` : 'Índice de preço = R$ por volume do fabricante sobre o R$ por volume do mercado, vezes 100. A base não diz a unidade do volume, por isso o preço em R$ não aparece.';
  h += `<h2 class="sec">Os fabricantes. <span>Share no mercado do recorte (${esc(niMkTxt())}), em ${esc(niMedTxt())}, com o índice de preço.</span></h2><div class="card">${F.html}${niNotaFiltros(`${notaPreco} O share aqui não muda com o filtro de fabricante ou marca: a tabela mostra todos.`)}</div>`;
  h += `<h2 class="sec">As marcas. <span>As marcas da Reckitt sempre abertas; as da concorrência com menos de 0,4% do mercado somadas em Outras marcas.</span></h2><div class="card">${Mk.html}` +
    niNotaFiltros((c.fora_padrao || []).length && S.niMk !== 'total' ? 'O corte de 0,4% é medido no padrão do site e na categoria inteira: marcas fortes no Desinfetante (como Lysoform) ficam abertas, mas aparecem pequenas sem o Desinfetante.' : 'O corte de 0,4% é medido no mercado de 12 meses da região.') + '</div>';
  return h;
}
function pgNiCanais() {
  const J = niJanela(), c = niCat(), g = niGeoEf(), rows = niLinhas(S.niCat, g), rowsBR = g === 'BR' ? null : niLinhas(S.niCat, 'BR');
  let h = hero('NIELSEN · CANAIS', `${esc(c.nome)}.`, `O peso de cada canal e o share ${esc(niFocoDe())} em cada um, ${esc(niNaGeo(g))}.`) + niAvisoGeo() + niOpcBar();
  const Mp = niFatias(rows, r => r[2]), BRm = rowsBR ? niFatias(rowsBR, r => r[2]) : null;
  h += `<h2 class="sec">Canal a canal. <span>${esc(niCap(niPerTxt(J)))} contra ${esc(J.X.btxt)}, em ${esc(niMedTxt())}.</span></h2><div class="card">${niTabFatias('nican', 'Canal', Mp, niCanal, J, {tot: niSerie(rows), br: BRm, brTot: rowsBR ? niSerie(rowsBR) : null})}${niNotaFiltros(c.abre === 'area' ? 'Nas categorias por área, a Nielsen separa o varejo alimentar (hiper, super, tradicional, independentes, conveniência) do cash & carry. O cash & carry vem como C&C OTHER na Área VII e como C&C no Brasil: o site junta os dois.' : `Nas categorias por UF, a ${esc(c.fonte)} separa as lojas pelo número de checkouts e o atacado.`)}</div>`;
  h += `<h2 class="sec">O share mês a mês. <span>Share ${esc(niFocoDe())} em cada canal.</span></h2><div class="card">${niMatriz('Canal', [...Mp.entries()].sort((a, b) => a[0] - b[0]).map(([k, o]) => [niCanal(k), o]).concat([['Total', niSerie(rows), 'tot']]), J)}</div>`;
  return h;
}
const niAreaNome = s => (s === 'TT. AREA BR' || s === 'TT. REGIAO BR' ? 'Brasil' : s === 'TO_PA_AP' ? 'TO, PA e AP' : s === 'RR_AM_RO_AC' ? 'RR, AM, RO e AC' : s === 'MA_PI' ? 'MA e PI' : s === 'AL_SE' ? 'AL e SE'
  : s === 'MET - SP' ? 'Grande SP' : s === 'INT - SP' ? 'Interior SP' : /^AREA /.test(s) ? 'Área ' + s.slice(5) : s);
function pgNiGeografia() {
  const J = niJanela(), X = J.X, c = niCat(), ci = S.niCat, rb = D.bench.get(ci) || [], tot = S.niMk === 'total' || !(c.fora_padrao || []).length;
  let h = hero('NIELSEN · GEOGRAFIA', `${esc(c.nome)}.`, 'A região CTO contra as outras áreas e UFs e o Brasil, em valor.') + niOpcBar(true, true);
  const por = new Map(), add = (k, r) => { let o = por.get(k); if (!o) por.set(k, o = {t: new Float64Array(D.M), c: new Float64Array(D.M)}); for (let j = 0; j < D.M; j++) { const v = r[4 + j]; if (r[2] === 0) o.t[j] += v; else o.c[j] += v; } };
  const UF_CTO = ['DF', 'GO', 'MT', 'MS', 'TO_PA_AP'], UF_CO = ['DF', 'GO', 'MT', 'MS'];
  rb.forEach(r => { if (r[3] === 1 && !tot) return; const s = String(D.bgeos[r[1]]); add(s, r); if (c.abre === 'uf' && UF_CTO.includes(s)) add('Região CTO', r); if (c.abre === 'uf' && UF_CO.includes(s)) add('Centro-Oeste', r); });
  const cto = new Set(c.abre === 'area' ? ['AREA VII'] : [...UF_CTO, 'Região CTO', 'Centro-Oeste']), soma = new Set(['Região CTO', 'Centro-Oeste']);
  const L = [...por.entries()].map(([k, o]) => ({k, o, n: niNum(o, X), cto: cto.has(k), br: /^TT\./.test(k), soma: soma.has(k)})).filter(x => x.n.ma > 0);
  const ordemTopo = x => (x.k === 'Região CTO' ? 0 : x.k === 'Centro-Oeste' ? 1 : x.br ? 2 : 3);
  L.sort((a, b) => ordemTopo(a) - ordemTopo(b));
  const cols = [{c: c.abre === 'area' ? 'Área' : 'UF', v: x => (x.soma || x.br ? '0' : '1') + semAcento(niAreaNome(x.k)), h: x => (x.soma ? `<b>${esc(x.k)}</b>` : x.cto ? `<b>${esc(niAreaNome(x.k))}</b> <small class="tag">CTO</small>` : esc(niAreaNome(x.k))), l: true},
    {c: `Mercado ${esc(X.txt)}`, v: x => x.n.ma, h: x => niRs(x.n.ma)}, {c: 'Mercado vs ano anterior', v: x => x.n.dm, h: x => vc(x.n.dm)}, {c: `Reckitt ${esc(X.txt)}`, v: x => x.n.ca, h: x => niRs(x.n.ca)},
    {c: 'Reckitt vs ano anterior', v: x => x.n.dc, h: x => vc(x.n.dc)}, ...niColsShare(J), {c: `Curva ${J.a5} · ${J.a6}`, h: x => niSpark(x.o, J), oc: true}];
  const lin = L.filter(x => !x.soma && !x.br && isFinite(x.n.ds)), alvo = c.abre === 'area' ? L.find(x => x.k === 'AREA VII') : L.find(x => x.k === 'Região CTO'), brl = L.find(x => x.br);
  let leit = '';
  if (alvo && X.b && lin.length > 2) { const rk = [...lin].sort((a, b) => a.n.ds - b.n.ds), pos = c.abre === 'area' ? rk.findIndex(x => x.k === 'AREA VII') + 1 : 0;
    leit = `<div class="card"><ol class="num"><li><span>${esc(c.abre === 'area' ? 'Área VII' : 'Região CTO')}: share de ${p1(alvo.n.sa)} (${ppTxt(alvo.n.ds)} sobre ${esc(X.btxt)}), mercado ${pc(alvo.n.dm)} e Reckitt ${pc(alvo.n.dc)}${brl ? `; no Brasil, ${p1(brl.n.sa)} (${ppTxt(brl.n.ds)}), mercado ${pc(brl.n.dm)} e Reckitt ${pc(brl.n.dc)}` : ''}.</span></li>` +
      `<li><span>${(() => { const a = rk[0], z = rk[rk.length - 1], nA = q => `${esc(niAreaNome(q.k))} (${ppTxt(q.n.ds)})`, tipo = c.abre === 'area' ? 'as áreas' : 'as UFs';
        return z.n.ds < 0.0005 ? `Nenhuma ${tipo === 'as áreas' ? 'área' : 'UF'} ganha share: a maior perda é ${nA(a)} e a menor é ${nA(z)}` : a.n.ds > -0.0005 ? `Nenhuma ${tipo === 'as áreas' ? 'área' : 'UF'} perde share: o maior ganho é ${nA(z)} e o menor é ${nA(a)}` : `A maior perda de share é ${nA(a)} e o maior ganho é ${nA(z)}`; })()}${c.abre === 'area' && pos ? (pos === 1 ? `; a Área VII é a que mais perde entre as ${lin.length} áreas` : `; a Área VII é a ${pos}ª que mais perde entre as ${lin.length} áreas`) : ''}.</span></li></ol></div>`; }
  h += `<h2 class="sec">A leitura. <span>A região contra o Brasil e as outras ${c.abre === 'area' ? 'áreas' : 'UFs'}.</span></h2>${leit || '<div class="card"><div class="empty">Sem o mesmo período do ano anterior na base.</div></div>'}`;
  h += `<h2 class="sec">${c.abre === 'area' ? 'Área a área' : 'UF a UF'}. <span>Share da Reckitt no ${esc(niPerTxt(J))}, ${tot ? 'categoria inteira' : 'sem ' + esc(c.fora_padrao.map(titTxt).join(', '))}.</span></h2><div class="card">${exTabela('nigeo', L, cols, {on: x => x.cto})}` +
    niNotaFiltros(`${c.abre === 'area' ? 'Esta categoria só abre por área na Nielsen. O Brasil da Nielsen inclui regiões fora das áreas I a VII.' : 'Esta categoria abre por UF: as UFs somam o Brasil. Região CTO = DF + GO + MT + MS + TO, PA e AP; Centro-Oeste = DF + GO + MT + MS.'} A página lê o total da categoria em valor, sem os filtros de canal, segmento, fabricante e marca (Superfícies segue o botão Sem Desinfetante ou Categoria inteira).`) + '</div>';
  return h;
}
function pgNiSkus() {
  const J = niJanela(), X = J.X, c = niCat(), ci = S.niCat, quem = S.ui.nisk || 'rb';
  let h = hero('NIELSEN · SKUs', `${esc(c.nome)}.`, `Os SKUs da Reckitt e os maiores da concorrência ${esc(niNaGeo('CTO'))}.`) + niOpcBar();
  const mk = niSerie(niLinhas(ci, 'CTO', {semCanal: true}), S.niMed, niRb), fs = S.f.segmento.size ? S.f.segmento : null;
  const fora = !fs && S.niMk !== 'total' && (c.fora_padrao || []).length ? new Set(c.fora_padrao.map(x => D.dic.segmento.indexOf(x))) : null;
  const L = D.skItens.map((it, i) => ({it, i})).filter(({it}) => it[0] === ci && (quem === 'todos' || (quem === 'rb') === (it[6] === 1)) && (!fs || fs.has(it[5])) && (!fora || !fora.has(it[5])) &&
      (!S.f.fab.size || S.f.fab.has(it[4])) && (!S.f.marca.size || S.f.marca.has(it[3])))
    .map(({it, i}) => { const v = D.skf.get(i * 2 + S.niMed) || [], o = {t: mk.t, c: Float64Array.from(v.length ? v : new Array(D.M).fill(0))}, vv = D.skf.get(i * 2) || [], uu = D.skf.get(i * 2 + 1) || [];
      const va = X.a ? X.a.reduce((s, j) => s + (vv[j] || 0), 0) : NaN, ua = X.a ? X.a.reduce((s, j) => s + (uu[j] || 0), 0) : NaN;
      return {k: i, it, o, n: niNum(o, X), pr: ua > 0 ? va / ua : NaN}; })
    .filter(x => (quem === 'todos' ? x.n.ca > 0 || x.n.cb > 0 : x.n.ca > 0));   // sem venda no período só aparece em Todos
  const cols = [{c: 'SKU', v: x => semAcento(x.it[1]), h: x => esc(x.it[1]) + (x.it[7] ? ' <small class="tag" title="A Nielsen mudou a descrição deste EAN; as descrições estão somadas">renomeado</small>' : ''), l: true, b: true},
    {c: 'Marca', v: x => D.dic.marca[x.it[3]], h: x => niMarca(x.it[3]), l: true},
    {c: `${esc(niMedNome())} ${esc(X.txt)}`, v: x => x.n.ca, h: x => niFmt(x.n.ca)}, {c: `${esc(niMedNome())} ${esc(X.btxt)}`, v: x => x.n.cb, h: x => niFmt(x.n.cb)}, {c: 'vs ano anterior', v: x => x.n.dc, h: x => vc(x.n.dc)},
    {c: 'Share na categoria', v: x => x.n.sa, h: x => p1(x.n.sa)}, {c: 'Δ pp vs ano anterior', v: x => x.n.ds, h: x => vppt(x.n.ds)},
    {c: niComPreco() ? 'Preço médio' : 'Preço médio (só em unidades)', v: x => (niComPreco() ? x.pr : NaN), h: x => (niComPreco() && isFinite(x.pr) ? 'R$ ' + n2(x.pr) : '')}, {c: 'Segmento', v: x => niSegTxt(x.it[5]), h: x => niSeg(x.it[5]), l: true},
    {c: 'Fabricante', v: x => D.dic.fab[x.it[4]], h: x => niFab(x.it[4]), l: true, oc: true}, {c: 'EAN', v: x => x.it[2], h: x => esc(x.it[2]), l: true, k: 'ex-cod', oc: true}, {c: `Curva ${J.a5} · ${J.a6}`, h: x => niSpark(x.o, J), oc: true}];
  h += `<h2 class="sec">SKU a SKU. <span>${esc(niCap(niPerTxt(J)))} contra ${esc(X.btxt)}, em ${esc(niMedTxt())}, todos os canais.</span></h2><div class="card">` +
    `<div class="pills" style="margin:0 0 14px">${[['rb', 'Reckitt'], ['conc', 'Concorrência (os 40 maiores)'], ['todos', 'Todos, com os sem venda no período']].map(([k, n]) => `<button data-act="ui" data-k="nisk" data-v="${k}" class="${k === quem ? 'on' : ''}">${n}</button>`).join('')}</div>` +
    exTabela('nisku', L, cols, {padrao: 2}) + niNotaFiltros(`SKUs ${esc(niNaGeo('CTO'))}, somando todos os canais: o filtro de canal e a geografia não mudam esta tabela. Share na categoria = SKU sobre o mercado da categoria (${esc(niMkTxt())}). Segmento, fabricante e marca filtram a lista. O mesmo EAN com descrição nova na Nielsen fica numa linha só, marcada como renomeado.`) + '</div>';
  return h;
}
function pgNiMes() {
  const J = niJanela(), c = niCat(), g = niGeoEf(), rows = niLinhas(S.niCat, g), rowsBR = g === 'BR' ? null : niLinhas(S.niCat, 'BR'), o = niSerie(rows);
  let h = hero('NIELSEN · MÊS A MÊS', `${esc(c.nome)}.`, `Mercado, ${esc(niFocoNome())} e share mês a mês, ${esc(niNaGeo(g))}.`) + niAvisoGeo() + niOpcBar(false);
  const tot = {t: o.t, c: o.t}, foco = {t: o.t, c: o.c};
  h += `<h2 class="sec">Mercado e ${esc(niFocoNome())}. <span>${esc(niMedNome())}, últimos 13 meses; em negrito, o mês escolhido.</span></h2><div class="card">${niMatriz('Linha', [['Mercado', tot], [esc(niFocoNome()), foco]], J, {valor: true})}` +
    niNotaFiltros('Os meses têm 4 ou 5 semanas, conforme o calendário do ano: o mês de 5 semanas soma mais venda que o de 4. Compare com o mesmo mês do ano anterior ou pelo trimestre, e não com o mês anterior; o share não é afetado.') + '</div>';
  const linhas = [[`Share ${esc(niFocoNome())}`, o]]; if (rowsBR) linhas.push(['Share Brasil', niSerie(rowsBR)]);
  const MK = [...niJogadores(rows, r => r[4]).entries()].filter(([k]) => D.dic.marca[k] !== 'OUTRAS MARCAS').sort((a, b) => niSoma(b[1].c, J.P.tri.a || [J.v]) - niSoma(a[1].c, J.P.tri.a || [J.v])).slice(0, 12);
  h += `<h2 class="sec">O share mês a mês. <span>${esc(niFocoNome())}, o Brasil e as 12 maiores marcas no mercado do recorte.</span></h2><div class="card">${niMatriz('Linha', linhas.concat(MK.map(([k, oo]) => [niMarca(k), oo])), J)}</div>`;
  return h;
}

const PAGINAS = {};   // preenchido junto do render
const paginaHTML = () => (PAGINAS[S.page] || (() => comAbasMarca(pgMarca(S.page), S.page)))();
function linhasRecorte() {
  if (MODO === 'ex') return linhasRecorteEx();
  if (MODO === 'mi') return linhasRecorteMi();
  if (MODO === 'ni') return linhasRecorteNi();
  const L = [['Perna', T('Sell Out', 'Sell In')], ['Página', PAGES.find(p => p[0] === S.page)[1]], ['Mês de corte', ehParcial(S.corte, 2026, 'base') ? `${corteRot()}, acumulado de ${corteTxt()}` : `${mes(S.corte)}/26 (acumulado de ${PARC_PG[S.page] ? emFonte(PARC_PG[S.page], corteTxt) : corteTxt()})`]];
  if (notaParcial()) L.push(['Mês parcial', notaParcial()]);
  FILTROS.forEach(([k, n]) => L.push([n, S.f[k].size ? [...S.f[k]].map(i => dic[k][i]).join(', ') : 'Todos']));
  const busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca}[S.page];
  if (busca) L.push(['Busca na tabela', busca]);
  L.push([MODO === 'so' && fontesDaPagina().length ? 'Site publicado em' : 'Base atualizada em', D.gerado]);
  if (MODO === 'so') fontesDaPagina().forEach(f => L.push([`Fonte ${f.nome}`, `${quandoFonte(f)}${f.hora ? ' (extração às ' + f.hora + ')' : ''}${f.obs ? '. ' + f.obs : ''}`]));
  if (MODO === 'si') {
    const bus = S.f.uf.size ? [...S.f.uf].map(i => dic.uf[i]).join(', ') : 'Hygiene, Health e Nutrition';
    L.push(['Order Management', omData()], ['Plano do Q4', S.page === 'si-q4' ? 'AR oficial de 29/09, só Hygiene (base da régua do Q4)' : `AR oficial de 29/09 das BUs do recorte (${bus}); a página Plano Q4 usa só Hygiene`]);
  }
  L.push(['Exportado em', new Date().toLocaleString('pt-BR')], ['Link desta visão', location.href]);
  return L;
}
async function exportarExcel(btn) {
  if (!btn || btn.disabled) return;
  const rot = btn.innerHTML; btn.disabled = true; btn.textContent = 'Gerando…';
  try {
    const ui0 = JSON.stringify(S.ui); S.ui.sctodas = 1; S.ui.cltodas = 1; S.ui.extodas = 1; S.ui.mitodas = 1; S.ui.miabtodas = 1;   // listas de redes completas no Excel; na Execução, todas as abas dos Dados gerais
    const div = document.createElement('div');
    try { div.innerHTML = paginaHTML(); } finally { Object.keys(S.ui).forEach(k => delete S.ui[k]); Object.assign(S.ui, JSON.parse(ui0)); }
    const nomePg = PAGES.find(p => p[0] === S.page)[1], busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca, 'ex-lojas': S.ui.exbusca, 'mi-lojas': S.ui.mibusca}[S.page];
    const resumo = [...FILTROS.filter(([k]) => S.f[k].size).map(([k, n]) => `${n}: ${[...S.f[k]].map(i => (NIM() && k === 'segmento' ? niSegTxt(i) : dic[k][i])).join(', ')}`), ...(busca ? [`Busca: ${busca}`] : [])].join(' · ') || 'Sem recorte';
    const nota = `${PERNA()} · ${nomePg} · ${MODO === 'ex' ? 'janela ' + exJanela().txt : MODO === 'mi' ? 'mês ' + miJanela().txt : MODO === 'ni' ? niRecSlide() : 'corte ' + corteRot()} · ${resumo}`;
    const abas = [{nome: 'Recorte', titulo: `Governança CTO · ${PERNA()} · ${nomePg}`, nota: 'Recorte marcado no site no momento da exportação.', cab: [['Item', 'Valor']], linhas: linhasRecorte()}];
    if (S.page === 'base' || S.page === 'si-base') {
      const B = linhasBase();
      abas.push({nome: 'Base do recorte', titulo: 'Base do recorte', nota, cab: [CAB()], linhas: B.map(r => celulas(r).map((x, i) => (i < 2 ? {v: x, s: 7} : typeof x === 'number' ? {v: x, s: i === 15 ? 2 : 4} : x)))});
    } else {
      let h2 = nomePg, h2sub = '';
      div.querySelectorAll('h2.sec, table').forEach(el => {
        if (el.tagName === 'H2') { const sp = el.querySelector('span'); h2sub = sp ? sp.textContent.trim() : ''; h2 = el.textContent.replace(h2sub, '').trim().replace(/\.$/, '') || nomePg; return; }
        if (el.closest('[data-xls="fora"]')) return;   // versão de tela de uma tabela que sai completa no Excel por outra (escondida)
        const card = el.closest('.card');   // o rótulo da tabela é o último eyebrow do card que vem ANTES dela
        const ebs = card ? [...card.querySelectorAll('.eyebrow')].filter(e => e.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) : [];
        const eb = ebs[ebs.length - 1], te = eb ? eb.textContent.trim() : '';
        const nome = te && !/^\d+$/.test(te) ? te : h2;
        const {cab, linhas} = tabelaParaLinhas(el);
        const nx = el.closest('[data-xls-nota]');   // tabela com recorte próprio (share por UF: Reckitt inteira, sem os filtros do site)
        if (linhas.length) abas.push({nome, titulo: nome, nota: nx ? nx.getAttribute('data-xls-nota') : h2sub ? `${nota} · ${h2sub}` : nota, cab, linhas});
      });
    }
    if (abas.length === 1) abas[0].linhas.push(['Observação', 'Esta página não tem tabela; o recorte segue registrado acima.']);
    const blob = await gerarXlsx(abas);
    const a = document.createElement('a'), d0 = new Date(), data = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
    a.href = URL.createObjectURL(blob); a.download = `Governanca_CTO_${MODO === 'ex' ? 'MSLDireto' : MODO === 'mi' ? 'MSLIndireto' : MODO === 'ni' ? 'Nielsen' : T('SellOut', 'SellIn')}_${semAcento(nomePg).replace(/[^a-z0-9]+/g, '_')}_${data}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = 'Excel baixado';
  } catch (e) { btn.textContent = 'Não deu para gerar'; console.error(e); }
  setTimeout(() => { btn.disabled = false; btn.innerHTML = rot; }, 2200);
}

/* ---------- Modo Apresentação e PDF: a página aberta vira slides 16:9 (1280 x 720), no recorte marcado ---------- */
const SW = 1280, SH = 720, S_MAX_LINHAS = 18, SECOES_FORA = /^(O índice|Como usar|Como ler)/;
const tiraInstrucao = t => t.replace(/(^|\.\s+)(Clique|Escolha|Ordene|Marque|Arraste)[^.]*\.?/g, '$1').trim();   // frase de instrução de tela não vai para o slide
function limparParaSlide(el) {   // tira o que é de clicar e corta tabela longa (a lista completa sai no Excel)
  if (el.matches('.seg, .pills, .pager, .csvbox, input, select, textarea, button.btn, .termo:empty')) return null;
  if (el.matches('p.note') && el.children.length && [...el.childNodes].every(n => (n.nodeType === 3 && !n.textContent.trim()) || n.tagName === 'A' || n.textContent.trim().length < 3)) return null;   // nota que só tem link
  const caixa = document.createElement('div'); caixa.appendChild(el);   // assim as buscas abaixo também pegam o próprio bloco
  caixa.querySelectorAll('.seg, .pills, input, textarea, select, .pager, button.btn, .csvbox').forEach(x => x.remove());
  caixa.querySelectorAll('[data-act]').forEach(x => x.removeAttribute('data-act'));
  caixa.querySelectorAll('a').forEach(a => { const sp = document.createElement('span'); sp.className = a.className; sp.setAttribute('style', a.getAttribute('style') || ''); sp.innerHTML = a.innerHTML; a.replaceWith(sp); });
  caixa.querySelectorAll('button').forEach(b => { const sp = document.createElement('span'); sp.className = b.className; sp.setAttribute('style', b.getAttribute('style') || ''); sp.innerHTML = b.innerHTML; b.replaceWith(sp); });
  caixa.querySelectorAll('tbody').forEach(tb => {
    const corpo = [...tb.rows].filter(x => !x.classList.contains('tot') && !x.classList.contains('sub'));
    if (corpo.length > S_MAX_LINHAS) {
      corpo.slice(S_MAX_LINHAS).forEach(x => x.remove());
      const tw = tb.closest('.tw') || tb.closest('table'), n = document.createElement('p');
      n.className = 'note s-corte'; n.textContent = `Mostrando ${S_MAX_LINHAS} de ${corpo.length} linhas, na ordem da tela. A lista completa sai no Excel.`; tw.after(n);
    }
  });
  caixa.querySelectorAll('table').forEach(tb => {   // tabela larga demais (ex.: 24 meses): fica a 1ª coluna e as 15 mais recentes
    const linhas = [...tb.rows], nc = Math.max(...linhas.map(x => x.cells.length));
    if (nc <= 16 || tb.querySelector('[colspan], [rowspan]')) return;
    linhas.forEach(x => { [...x.cells].slice(1, nc - 15).forEach(c => c.remove()); });
    const n = document.createElement('p'); n.className = 'note s-corte'; n.textContent = `Mostrando as ${15} colunas mais recentes de ${nc - 1}. A tabela completa sai no Excel.`;
    (tb.closest('.tw') || tb).after(n);
  });
  caixa.querySelectorAll('.shelf').forEach(sh => { [...sh.children].slice(8).forEach(c => c.remove()); });
  return caixa.firstElementChild;
}
function gruposDaPagina() {
  const div = document.createElement('div'); div.innerHTML = paginaHTML();
  const nos = []; const plano = el => { [...el.children].forEach(c => { if (c.classList.contains('det') && c.querySelector(':scope > h2.sec')) plano(c); else nos.push(c); }); };
  plano(div);
  let capa = null; const grupos = []; let atual = {titulo: '', sub: '', nos: []};
  nos.forEach(el => {
    if (el.matches('section.hero')) { capa = el; return; }
    if (el.matches('h2.sec')) {
      if (atual.nos.length) grupos.push(atual);
      const sp = el.querySelector('span'), sub = sp ? sp.textContent.trim() : '';
      atual = {titulo: el.textContent.replace(sub, '').trim().replace(/\.$/, ''), sub: tiraInstrucao(sub), nos: []}; return;
    }
    atual.nos.push(el);
  });
  if (atual.nos.length) grupos.push(atual);
  return {capa, grupos: grupos.filter(g => !SECOES_FORA.test(g.titulo))};
}
function recorteSlide() {   // o resumo já sai escapado (tit); soma a busca digitada na tabela, como no Excel
  const busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca, 'ex-lojas': S.ui.exbusca, 'mi-lojas': S.ui.mibusca}[S.page];
  return [recorteResumo(), busca ? 'Busca: ' + esc(busca) : ''].filter(Boolean).join(' · ') || 'Visão completa da regional, sem filtro';
}
function moldeSlide(nomePg, titulo, sub) {
  const s = document.createElement('div'); s.className = 'slide';
  s.innerHTML = `<div class="s-top"><img src="assets/reckitt_logo.png" alt="Reckitt"><b>Governança CTO</b><span>${PERNA()} · ${esc(nomePg)}</span><span class="s-rec">${recorteSlide()} · ${MODO === 'ex' ? 'janela ' + esc(exJanela().txt) : MODO === 'mi' ? 'mês ' + esc(miJanela().txt) + ' · régua ' + esc(miRegNome()) : MODO === 'ni' ? esc(niRecSlide()) : 'corte ' + esc(corteRot())}</span></div>
    ${titulo ? `<div class="s-tit"><h2>${esc(titulo)}. <span>${esc(sub)}</span></h2></div>` : ''}<div class="s-corpo"><div class="s-escala"></div></div>
    <div class="s-pe"><span>${MODO === 'so' && fontesDaPagina().length ? esc(fontesDaPagina().filter(f => !f.congelada).map(f => `${f.nome} ${quandoFonte(f, true)}`).join(' · ')) : MODO === 'ex' && fontesEx().length ? esc(fontesEx().map(f => `${f.nome} ${quandoFonte(f, true)}`).join(' · ')) : MODO === 'mi' && fontesMi().length ? esc(fontesMi().map(f => `${f.nome} ${quandoFonte(f, true)}`).join(' · ')) : MODO === 'ni' && fontesNi().length ? esc(fontesNi().map(f => `${f.nome} ${quandoFonte(f, true)}`).join(' · ')) : `Atualizado em ${esc(D.gerado.split(' ')[0])}`}${MODO === 'si' && D.om ? ` · pedidos de ${omData()}` : ''} · uso interno</span><span class="s-num"></span></div>`;
  return s;
}
function encaixar(s) {   // mede, aplica a escala e mede de novo (gráfico e tabela mudam de altura quando a largura muda)
  const corpo = s.querySelector('.s-corpo'), es = s.querySelector('.s-escala'), W = corpo.clientWidth, H = corpo.clientHeight;
  es.style.transform = ''; es.style.width = W + 'px';
  let k = Math.min(1, H / Math.max(1, es.scrollHeight), W / Math.max(1, es.scrollWidth));
  for (let i = 0; i < 4 && k < 1; i++) {
    es.style.width = (W / k) + 'px';
    const k2 = Math.min(H / Math.max(1, es.scrollHeight), (W / k) / Math.max(1, es.scrollWidth) * k);
    if (k2 >= k - 0.002) break; k = k2;
  }
  es.style.transform = k < 1 ? `scale(${k})` : ''; if (k >= 1) es.style.width = W + 'px';
  return k;
}
const altura = s => s.querySelector('.s-escala').scrollHeight, cabe = s => altura(s) <= s.querySelector('.s-corpo').clientHeight;
function montarSlides() {
  const caixa = document.getElementById('impressao'); caixa.innerHTML = '';
  SLIDE = true;
  let capa, grupos;
  try { ({capa, grupos} = gruposDaPagina()); } finally { SLIDE = false; }
  const nomePg = PAGES.find(p => p[0] === S.page)[1], slides = [];
  // capa: o título da página, o recorte e o primeiro bloco (os números do topo)
  const sc = moldeSlide(nomePg, '', ''); sc.classList.add('capa');
  const h1 = capa ? capa.querySelector('h1') : null;
  sc.querySelector('.s-escala').innerHTML = `<p class="eyebrow">${esc(PERNA())} · ${esc(nomePg)}</p><h1 class="s-h1">${h1 ? h1.innerHTML : esc(nomePg)}</h1>
    <p class="s-sub">${recorteSlide()} · ${MODO === 'ex' ? `MSL na janela de ${esc(exJanela().txt)}, contra ${esc(exJanela().antTxt)}` : MODO === 'mi' ? `MSL de ${esc(miJanela().txt)}, contra ${esc(miJanela().antTxt)}` : MODO === 'ni' ? esc(niCapaSlide()) : `acumulado de jan a ${esc(corteRot())}`}</p>`;
  const su = capa ? capa.querySelector('.shareuf') : null;   // market share por UF (Redes Scanntech): fica no título, então vai para a capa; a tabela escondida é só do Excel
  if (su) { su.querySelectorAll('.su-xls').forEach(x => x.remove()); const b = limparParaSlide(su); if (b) sc.querySelector('.s-escala').appendChild(b); }
  const prim = grupos.length && !grupos[0].titulo ? grupos.shift() : null;
  if (prim) prim.nos.forEach(n => { const b = limparParaSlide(n); if (b) sc.querySelector('.s-escala').appendChild(b); });
  caixa.appendChild(sc); slides.push(sc); encaixar(sc);
  let s = null;
  grupos.forEach(g => {
    const blocos = g.nos.map(limparParaSlide).filter(Boolean); if (!blocos.length) return;
    // seção pequena entra no slide anterior, se couber sem encolher
    if (s && s !== sc) {
      const alvo = s.querySelector('.s-escala'), h3 = document.createElement('h3'); h3.className = 's-subtit'; h3.innerHTML = `${esc(g.titulo)}. <span>${esc(g.sub)}</span>`;
      alvo.style.transform = ''; alvo.style.width = s.querySelector('.s-corpo').clientWidth + 'px';
      alvo.appendChild(h3); blocos.forEach(b => alvo.appendChild(b));
      if (cabe(s)) { encaixar(s); return; }
      h3.remove(); blocos.forEach(b => b.remove()); encaixar(s);
    }
    s = moldeSlide(nomePg, g.titulo || nomePg, g.sub); caixa.appendChild(s); slides.push(s);
    blocos.forEach(bloco => {
      const alvo = s.querySelector('.s-escala'); alvo.appendChild(bloco);
      if (alvo.children.length > 1 && altura(s) > s.querySelector('.s-corpo').clientHeight * 1.15) {   // não coube: slide de continuação
        bloco.remove(); encaixar(s);
        s = moldeSlide(nomePg, g.titulo + ' (continuação)', g.sub); caixa.appendChild(s); slides.push(s); s.querySelector('.s-escala').appendChild(bloco);
      }
    });
    encaixar(s);
  });
  slides.forEach((x, i) => { x.querySelector('.s-num').textContent = `${i + 1}/${slides.length}`; });
  return slides;
}
let APRES = null;
function abrirApresentacao() {
  fecharPop();
  const slides = montarSlides(), box = document.getElementById('apres');
  box.innerHTML = `<div class="ap-palco"></div><div class="ap-ctl"><button data-ap="ant" aria-label="Slide anterior">‹</button><span class="ap-n"></span><button data-ap="prox" aria-label="Próximo slide">›</button>
    <button data-ap="pdf">⤓ PDF</button><button data-ap="sair">Sair (Esc)</button></div>`;
  const palco = box.querySelector('.ap-palco'); slides.forEach(s => palco.appendChild(s));
  box.hidden = false; document.body.classList.add('apresentando');
  APRES = {i: 0, slides};
  try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* sem tela cheia */ }
  mostrarSlide(0);
}
function mostrarSlide(i) {
  if (!APRES) return;
  const n = APRES.slides.length; APRES.i = Math.max(0, Math.min(n - 1, i));
  const k = Math.min(innerWidth / SW, (innerHeight - 56) / SH);
  APRES.slides.forEach((s, j) => { s.style.display = j === APRES.i ? '' : 'none'; s.style.transform = `scale(${k})`; });
  document.querySelector('#apres .ap-n').textContent = `${APRES.i + 1} de ${n}`;
}
function fecharApresentacao(manter) {
  const box = document.getElementById('apres'); box.hidden = true; if (!manter) box.innerHTML = ''; APRES = null; document.body.classList.remove('apresentando');
  if (!manter) document.getElementById('impressao').innerHTML = '';
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* já saiu */ }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ap]'); if (!b) { if (APRES && e.target.closest('.ap-palco')) mostrarSlide(APRES.i + 1); return; }
  const a = b.dataset.ap;
  if (a === 'ant') mostrarSlide(APRES.i - 1); else if (a === 'prox') mostrarSlide(APRES.i + 1);
  else if (a === 'sair') fecharApresentacao(); else if (a === 'pdf') { const prontos = APRES.slides; fecharApresentacao(true); gerarPDF(null, prontos); }
});
document.addEventListener('keydown', e => {
  if (!APRES) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); mostrarSlide(APRES.i + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); mostrarSlide(APRES.i - 1); }
  else if (e.key === 'Escape') fecharApresentacao();
});
document.addEventListener('fullscreenchange', () => { if (APRES && !document.fullscreenElement) mostrarSlide(APRES.i); });
addEventListener('resize', () => { if (APRES) mostrarSlide(APRES.i); });
function gerarPDF(btn, prontos) {
  fecharPop();
  let slides;
  if (prontos) {   // PDF de dentro da apresentação: imprime os mesmos slides que estavam na tela
    const caixa = document.getElementById('impressao'); caixa.innerHTML = '';
    prontos.forEach(x => { x.style.display = ''; x.style.transform = ''; caixa.appendChild(x); }); slides = prontos;
    document.getElementById('apres').innerHTML = '';
  } else slides = montarSlides();
  const titulo0 = document.title, d0 = new Date(), nomePg = PAGES.find(p => p[0] === S.page)[1];
  const rc = FILTROS.filter(([k]) => S.f[k].size).map(([k]) => [...S.f[k]].map(i => dic[k][i]).join('+')).join(' · ').replace(/[\/:*?"<>|]/g, '').slice(0, 60);
  document.title = `Governança CTO · ${PERNA()} · ${nomePg}${rc ? ' · ' + rc : ''} · ${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
  const css = document.createElement('style'); css.id = 'estilo-pdf'; css.textContent = '@page { size: 13.333in 7.5in; margin: 0; }';
  document.head.appendChild(css); document.body.classList.add('imprimindo');
  let feito = false;
  const fim = () => { if (feito) return; feito = true; document.body.classList.remove('imprimindo'); css.remove(); document.title = titulo0; document.getElementById('impressao').innerHTML = ''; removeEventListener('afterprint', fim); };
  addEventListener('afterprint', fim);
  if (btn) { const r0 = btn.innerHTML; btn.textContent = `${slides.length} slides: escolha "Salvar como PDF"`; setTimeout(() => { btn.innerHTML = r0; }, 6000); }
  const imgs = [...document.querySelectorAll('#impressao img')].map(im => (im.complete ? Promise.resolve() : new Promise(ok => { im.onload = im.onerror = ok; })));
  Promise.all(imgs).then(() => setTimeout(() => { window.print(); setTimeout(fim, 1500); }, 60));
}

const rod = document.getElementById('rodape');
function render(topo = true) {
  nav();
  const y = scrollY;
  const lados = [...document.querySelectorAll('#app .shelf, #app .tw')].map(x => x.scrollLeft);
  const app = document.getElementById('app');
  app.innerHTML = paginaHTML();
  document.title = (S.page === INICIO() ? '' : PAGES.find(p => p[0] === S.page)[1] + ' · ') + 'Governança CTO · ' + PERNA();
  if (rod) rod.innerHTML = (D.rodape || []).map(t => `<p>${esc(t)}</p>`).join('');
  ['scbusca', 'clbusca'].forEach(idb => {   // busca das redes: redesenha só a tabela
    const inp = document.getElementById(idb); if (!inp) return;
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui[idb] = inp.value; const box = document.getElementById('rd-tab'); if (box && RD_ULT) box.innerHTML = emFonte(RD_ULT.fr || null, () => (RD_ULT.tipo === 'sc' ? tabelaScan(RD_ULT.itens) : tabelaCol(RD_ULT.itens))); }, 150); };
    inp.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    inp.addEventListener('compositionend', aplica);
  });
  const cb = document.getElementById('cbusca');
  if (cb) {
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui.cbusca = cb.value; document.getElementById('conf-res').innerHTML = confRes(); }, 150); };
    cb.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    cb.addEventListener('compositionend', aplica);
  }
  const mb = document.getElementById('mibusca');   // busca das lojas do MSL Indireto: redesenha só a tabela
  if (mb) {
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui.mibusca = mb.value; const box = document.getElementById('mi-lojas-tab'); if (box) box.innerHTML = miLojasPrincipal(); }, 150); };
    mb.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    mb.addEventListener('compositionend', aplica);
  }
  const xb = document.getElementById('exbusca');   // busca das lojas da Execução: redesenha só a tabela
  if (xb) {
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui.exbusca = xb.value; const box = document.getElementById('ex-lojas-tab'); if (box) box.innerHTML = exLojasPrincipal(); }, 150); };
    xb.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    xb.addEventListener('compositionend', aplica);
  }
  let mantidos = false;
  if (!topo) {
    scrollTo({top: y});
    const novos = document.querySelectorAll('#app .shelf, #app .tw');
    if (novos.length === lados.length) { novos.forEach((x, i) => { x.scrollLeft = lados[i]; }); mantidos = true; }
  }
  if (!mantidos) document.querySelectorAll('#app .tw.fim').forEach(x => { x.scrollLeft = x.scrollWidth; });   // matriz mês a mês da Execução: abre nos meses mais recentes, os da janela (a 1ª coluna fica fixa)
}

Object.assign(PAGINAS, {inicio: pgInicio, geral: () => comAbasMarca(pgGeral(), 'geral'), hn: () => comAbasMarca(pgHN(), S.page), diretor: pgDiretor, clientes: pgSoClientes, executivos: pgSoExec,
  'redes-scan': () => comAbas(pgRedesScan(), 'redes-scan'), 'redes-col': () => comAbas(pgRedesCol(), 'redes-col'), confronto: pgConfronto, depara: pgDepara, base: pgBase,
  'si-inicio': pgSiInicio, 'si-geral': () => comAbasMarca(pgSiGeral(), 'si-geral'), 'si-hn': () => comAbasMarca(pgHN(), 'si-hn'), 'si-diretor': pgDiretor, 'si-clientes': pgSiClientes, 'si-exec': pgSiExec, 'si-q4': pgSiQ4, 'si-mes': pgSiMes, 'si-rv': pgSiRV, 'si-base': pgBase});
Object.assign(PAGINAS, {'mi-inicio': pgMiInicio, 'mi-dados': pgMiDados, 'mi-diretor': pgMiDiretor, 'mi-redes': pgMiRedes, 'mi-lojas': pgMiLojas, 'mi-executivos': pgMiExecutivos, 'mi-skus': pgMiSkus, 'mi-auditoria': pgMiAuditoria});
Object.assign(PAGINAS, {'ni-inicio': pgNiInicio, 'ni-categorias': pgNiCategorias, 'ni-segmentos': pgNiSegmentos, 'ni-concorrencia': pgNiConcorrencia, 'ni-canais': pgNiCanais, 'ni-geografia': pgNiGeografia, 'ni-skus': pgNiSkus, 'ni-mes': pgNiMes});
Object.assign(PAGINAS, {'ex-inicio': pgExInicio, 'ex-dados': pgExDados, 'ex-diretor': pgExDiretor, 'ex-clientes': pgExClientes, 'ex-lojas': pgExLojas, 'ex-executivos': pgExExecutivos, 'ex-skus': pgExSkus});
lerHash(); filtrar();   // só o estado inicial: quem desenha é a Visão do Time
/* ---- cálculo das telas da Visão do Time ---- */
/* Visão do Time · cálculo das telas DENTRO do motor da Governança CTO.
   O gerar_foto.py cola este arquivo no fim do bloco do motor, numa cópia do app.js do site principal (assets/motor.js). Ele roda em dois lugares:
   1. Na montagem (Chrome sem janela, com window.FOTO_MONTAGEM): calcula todas as telas sem filtro e devolve a foto, que vai cifrada no data/foto.enc.js.
   2. No navegador, num quadro escondido, quando alguém usa um filtro: window.MOTOR_TIME.calc(tela, filtros) refaz a tela com as mesmas funções do site principal.
   Nomes de cliente, rede, loja e executivo não ficam escritos aqui: o de-para entre as bases chega no window.FOTO_CONF, que vem do arquivo cifrado. */
(() => {
const CONF = window.FOTO_CONF || {};
const OUT = {versao: 2, base_gerada: DSO.gerado, telas: {}, avisos: [], fontes: {}};
const txt = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const SIGLAS = (CONF.siglas || []).length ? new RegExp('\\b(' + CONF.siglas.join('|') + ')\\b', 'gi') : null;
const TROCAS = (CONF.trocas || []).map(([a, b]) => [new RegExp(a, 'gi'), b]);
const nm = s => { let t = txt(tit(s)); TROCAS.forEach(([a, b]) => { t = t.replace(a, b); }); return SIGLAS ? t.replace(SIGLAS, x => x.toUpperCase()) : t; };   // nome como o site mostra, em texto puro
const fin = x => (typeof x === 'number' && isFinite(x) ? x : null);   // o JSON não aceita NaN
const num = x => typeof x === 'number' && isFinite(x);   // isFinite(null) é true: use num para filtrar valor que pode ter virado null
const soma = (L, f) => L.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0);
const pct = (a, b) => (isFinite(a) && b > 0 ? a / b : NaN);
const modo = m => { aplicarModo(m); FILTROS.forEach(([k]) => S.f[k].clear()); S.corte = D.corte; filtrar(); };
const nf1b = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const pTxt = x => (isFinite(x) ? nf1b.format(x * 100) + '%' : 'sem dado');
const ppT = d => (isFinite(d) ? `${d >= 0 ? '+' : '-'}${nf1b.format(Math.abs(d * 100))} pp` : '');
const rsT = x => (!isFinite(x) ? '' : Math.abs(x) >= 1e6 ? `R$ ${nf2.format(x / 1e6)} Mi` : Math.abs(x) >= 1e3 ? `R$ ${nf0.format(x / 1e3)} mil` : `R$ ${nf0.format(x)}`);
const fonteTxt = k => { const f = fonte(k); return f ? {nome: f.nome, quando: quandoFonte(f, true), extraido: f.extraido || '', ate: f.ate_txt || ''} : null; };
const up = s => String(s || '').toUpperCase().trim();

/* dias úteis do Q4 (mesmos feriados do site principal) */
const du = (a, b) => { let n = 0; for (let d = new Date(a + 'T12:00:00'); d <= new Date(b + 'T12:00:00'); d.setDate(d.getDate() + 1)) { const w = d.getDay(), iso = d.toISOString().slice(0, 10); if (w >= 1 && w <= 5 && !FERIADOS.has(iso)) n++; } return n; };
const isoMenos1 = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

/* ================= filtros =================
   F = {canal: 'd' (direto) | 'i' (indireto) | '', exec: nome do executivo, cli: cliente como no Sell In, marca: 'VEJA'..., uf: 'GO'...}
   Cada perna recebe só o que tem: o Sell In não abre por UF; o sell out do indireto não tem cliente direto; o MSL Indireto lê a UF pelo distribuidor. */
const DIRETO = new Set(['CASH & CARRY', 'VAREJO NACIONAL']);
let CANAL_CLI = null;
function canalDosClientes() {   // direto ou indireto por cliente do Sell In: canal do cliente no P&L ou, se o pedido sai por outro código, o canal do pedido no Order Management
  if (CANAL_CLI) return CANAL_CLI;
  modo('si');
  const om = new Map(); (D.om ? D.om.linhas : []).forEach(l => { const k = l[0], c = dic.canal[l[2]], q = (l[7] || 0) + (l[8] || 0) + (l[9] || 0); let o = om.get(k); if (!o) om.set(k, o = {d: 0, t: 0}); o.t += q; if (DIRETO.has(c)) o.d += q; });
  const fixo = new Map((CONF.clientes || []).filter(c => c.canal).map(c => [c.si, c.canal]));   // canal fixado no de-para vale antes do pedido do dia
  CANAL_CLI = new Map(dic.grp.map((g, i) => { const d = infoGrp(g), o = om.get(i); return [g, fixo.get(g) || ((d && DIRETO.has(d.canal)) || (o && o.t > 0 && o.d / o.t >= 0.5) ? 'd' : 'i')]; }));
  return CANAL_CLI;
}
const cliConf = nome => (CONF.clientes || []).find(c => c.si === nome) || null;
const execSO = n => (CONF.exec_so && CONF.exec_so[n]) || n;
function marcar(k, nomes) {   // põe no filtro do motor os itens com esses nomes; false = nenhum existe nesta base
  S.f[k].clear(); if (!nomes) return true;
  const alvo = new Set(nomes.map(up)), comeca = k === 'marca' ? [...alvo] : [];   // marca: 'SUSTAGEN' também pega 'SUSTAGEN KIDS' nas bases de MSL
  dic[k].forEach((x, i) => { const u = up(x); if (alvo.has(u) || comeca.some(a => u.startsWith(a + ' '))) S.f[k].add(i); });
  return S.f[k].size > 0;
}
const tem = F => !!(F && (F.canal || F.exec || F.cli || F.marca || F.uf));
function filtroSI(F) {
  canalDosClientes(); modo('si');
  let grps = null;
  if (F.cli) grps = [F.cli];
  if (F.canal) { const C = [...CANAL_CLI].filter(([, c]) => c === F.canal).map(([g]) => g); grps = grps ? grps.filter(g => C.includes(g)) : C; }
  if (grps && !marcar('grp', grps)) return {ok: false, motivo: 'Nenhum cliente do Sell In neste recorte.'};
  if (F.exec && !marcar('executivo', [F.exec])) return {ok: false, motivo: 'Este executivo não tem carteira no Sell In.'};
  if (F.marca && !marcar('marca', [F.marca])) return {ok: false, motivo: 'Esta marca não tem venda no Sell In.'};
  filtrar();
  return {ok: true};
}
function filtroSO(F) {   // positivação do sell out do indireto
  modo('so');
  if (F.canal === 'd') return {ok: false, motivo: 'A positivação vem do sell out do canal indireto: não se aplica ao direto.'};
  if (F.cli) { const c = cliConf(F.cli); if (!c || !(c.so || []).length || !marcar('grp', c.so)) return {ok: false, motivo: 'Este cliente não tem sell out de distribuidor no Colecta.'}; }
  if (F.exec && (/^carteira /i.test(F.exec) || !marcar('executivo', [execSO(F.exec)]))) return {ok: false, motivo: 'Esta carteira não tem sell out de distribuidor no Colecta (atende clientes diretos).'};
  if (F.uf && !marcar('uf', [F.uf])) return {ok: false, motivo: 'Sem sell out nesta UF.'};
  if (F.marca && !marcar('marca', [F.marca])) return {ok: false, motivo: 'Esta marca não abre no sell out.'};
  filtrar();
  return {ok: true};
}
function filtroEX(F) {   // MSL Direto: lojas (cliente, executivo, UF) e SKUs (marca)
  modo('ex');
  if (F.canal === 'i') return {ok: false, motivo: 'Filtro no indireto.'};
  if (F.cli) { const c = cliConf(F.cli); if (!c || !(c.ex || []).length || !marcar('bandeira', c.ex)) return {ok: false, motivo: 'Este cliente não tem lojas no MSL Direto.'}; }
  if (F.exec && !marcar('executivo', [F.exec])) return {ok: false, motivo: 'Este executivo não tem lojas no MSL Direto.'};
  if (F.uf && !marcar('uf', [F.uf])) return {ok: false, motivo: 'Sem lojas do MSL Direto nesta UF.'};
  if (F.marca && !marcar('marca', [F.marca])) return {ok: false, motivo: 'Esta marca não tem SKU no MSL Direto.'};
  filtrar();
  return {ok: true};
}
function filtroMI(F) {   // MSL Indireto: lojas (distribuidor, executivo) e SKUs (marca); a UF é a do distribuidor
  modo('mi');
  if (F.canal === 'd') return {ok: false, motivo: 'Filtro no direto.'};
  let dist = null;
  if (F.cli) { const c = cliConf(F.cli); dist = c && (c.mi || []).length ? c.mi : []; }
  if (F.uf) { const U = Object.entries(CONF.mi_uf || {}).filter(([, u]) => u === F.uf).map(([d]) => d); dist = dist ? dist.filter(d => U.includes(d)) : U; }
  if (dist && (!dist.length || !marcar('dist', dist))) return {ok: false, motivo: F.cli ? 'Este cliente não tem lojas no MSL Indireto.' : 'Nenhum distribuidor do MSL Indireto nesta UF.'};
  if (F.exec && !marcar('executivo', [F.exec])) return {ok: false, motivo: 'Este executivo não tem lojas no MSL Indireto.'};
  if (F.marca && !marcar('marca', [F.marca])) return {ok: false, motivo: 'Esta marca não tem SKU no MSL Indireto.'};
  filtrar();
  return {ok: true};
}

/* ================= Sell In: Q4 em Hygiene, executivo a executivo (mesma conta do Plano Q4) ================= */
function q4Base(F = {}) {
  const fx = tem(F) ? filtroSI(F) : (modo('si'), {ok: true});
  if (!fx.ok) return {vazio: true, motivo: fx.motivo};
  const hy = idHyg(), ehH = r => r[COL.uf] === hy, chE = r => r[COL.executivo], M = gMarcas();
  const op = {marcas: M, segs: null};
  if (!temPlano(umP('rs', {...op, sub: ehH}))) return {vazio: true, motivo: 'Este recorte não tem AR de Hygiene no Q4.'};
  const X = execQ4(op), N = X.N, mOM = N.mOM, ult = D.ult26;
  const om = D.om.data, omIso = `${om.slice(0, 4)}-${om.slice(4, 6)}-${om.slice(6, 8)}`;
  // caixas e NR por mês: AR 26, real 25 e real 26 (P&L nos meses fechados; meses anteriores do trimestre pelo último retrato do OM; mês em curso = faturado + carteira)
  const PC = cuboP('cx', {...op, sub: ehH, chave: chE}), PR = cuboP('rs', {...op, sub: ehH, chave: chE});
  const AC = cubo('cx', {...op, sub: ehH, chave: chE, semCorte: true}), AR = cubo('rs', {...op, sub: ehH, chave: chE, semCorte: true});
  const OM = omSoma({...op, so: 'hyg', chave: l => l[1]});
  const OMA = new Map(); Q4M.filter(m => m < mOM && m > ult).forEach(m => omSoma({...op, so: 'hyg', chave: l => l[1], linhas: OMB_ANT.filter(l => l[16] === m)}).forEach((o, k) => OMA.set(k + '|' + m, o)));
  const mesExec = (k, m) => {
    const ac = AC.get(k), ar = AR.get(k), pc = PC.get(k), pr = PR.get(k), o = OM.get(k) || ZERO_OM, oa = OMA.get(k + '|' + m) || ZERO_OM;
    let r26c = NaN, r26n = NaN, tipo = 'futuro';
    if (m <= ult) { r26c = ac ? v(ac, 2026, m) : NaN; r26n = ar ? v(ar, 2026, m) : NaN; tipo = 'fechado'; }
    else if (m < mOM) { r26c = oa.fat; r26n = oa.nfat; tipo = 'om_anterior'; }
    else if (m === mOM) { r26c = o.fat + o.cart + o.aloc; r26n = o.nfat + o.ncart; tipo = 'em_curso'; }
    return {m, tipo, r25_cx: fin(ac ? v(ac, 2025, m) : NaN), r25_nr: fin(ar ? v(ar, 2025, m) : NaN), ar_cx: fin(pc ? v(pc, 2026, m) : NaN), ar_nr: fin(pr ? v(pr, 2026, m) : NaN), r26_cx: fin(r26c), r26_nr: fin(r26n)};
  };
  // carteira de cada executivo: clientes pelo AR do Q4 e o canal do cliente
  const CC = canalDosClientes(), PG = cuboP('rs', {...op, sub: ehH, chave: r => r[COL.executivo] * 1000 + r[COL.grp]});
  const cart = new Map();
  PG.forEach((a, key) => { const k = Math.floor(key / 1000), g = key % 1000, q = agg(a, 2026, Q4M, false); if (!(q > 0)) return; let L = cart.get(k); if (!L) cart.set(k, L = []); L.push({g, nome: nm(dic.grp[g]), canal: CC.get(dic.grp[g]), q}); });
  const ex = X.ex.map(x => {
    const meses = Q4M.map(m => mesExec(x.k, m)), L = (cart.get(x.k) || []).sort((a, b) => b.q - a.q);
    const dir = soma(L.filter(c => c.canal === 'd'), c => c.q), tot = soma(L, c => c.q);
    const rc_nr = x.real + x.o.nfat + x.o.ncart, rc_cx = soma(meses, z => (z.tipo === 'futuro' ? NaN : z.r26_cx));
    return {nome: x.nome, vaga: /^carteira /i.test(x.nome), canal: !(tot > 0) ? '' : dir / tot >= 0.7 ? 'Direto' : dir / tot <= 0.3 ? 'Indireto' : 'Direto e indireto',
      clientes: L.slice(0, 4).map(c => c.nome), mais: Math.max(0, L.length - 4), n_clientes: L.length,
      ar_nr: x.arQ, ar_cx: x.arC, rc_nr, rc_cx, pct_nr: fin(pct(rc_nr, x.arQ)), pct_cx: fin(pct(rc_cx, x.arC)), q425_nr: fin(x.q425), q425_cx: fin(soma(meses, z => z.r25_cx)),
      ar_mes: fin(x.arMes), ped_mes: x.o.nfat + x.o.ncart, fat_mes: x.o.nfat, ped_q4: x.real + x.o.nfat + x.o.ncart + x.o.nfut, meses};   // ped_q4 = pedidos do Q4 do RV do site principal (com a carteira futura)
  });
  const o1 = om1({...op, so: 'hyg'}), oaT = Q4M.filter(m => m < mOM && m > ult).reduce((s, m) => s + om1({...op, so: 'hyg', linhas: OMB_ANT.filter(l => l[16] === m)}).nfat, 0);
  const R1 = um('rs', {...op, sub: ehH, semCorte: true}), fechT = Q4M.filter(m => m <= ult).reduce((s, m) => s + (v(R1, 2026, m) || 0), 0);
  const reg = {ar_nr: N.ar, ar_cx: N.arC, q425_nr: N.q425, q425_cx: N.q425C, rc_nr: fechT + oaT + o1.nfat + o1.ncart, fat_mes: o1.nfat, cart_mes: o1.ncart};
  reg.rc_cx = soma(ex, x => x.rc_cx);
  if (!tem(F)) {
    if (Math.abs(soma(ex, x => x.ar_nr) - reg.ar_nr) > 1) OUT.avisos.push(`A soma do AR dos executivos (${rsT(soma(ex, x => x.ar_nr))}) não fecha com o AR da regional (${rsT(reg.ar_nr)}).`);
    if (Math.abs(soma(ex, x => x.rc_nr) - reg.rc_nr) > 1) OUT.avisos.push(`A soma do realizado com carteira dos executivos (${rsT(soma(ex, x => x.rc_nr))}) não fecha com a regional (${rsT(reg.rc_nr)}).`);
  }
  reg.pct_nr = pct(reg.rc_nr, reg.ar_nr); reg.pct_cx = pct(reg.rc_cx, reg.ar_cx);
  const q4i = '2026-10-01', q4f = '2026-12-31';
  reg.du_passados = du(q4i, isoMenos1(omIso)); reg.du_total = du(q4i, q4f); reg.ritmo = reg.du_passados / reg.du_total;
  const PCt = umP('cx', {...op, sub: ehH}), PRt = umP('rs', {...op, sub: ehH});
  reg.meses = Q4M.map(m => ({m, ar_cx: fin(v(PCt, 2026, m)), ar_nr: fin(v(PRt, 2026, m)), r25_cx: fin(soma(ex, x => x.meses.find(z => z.m === m).r25_cx)), r25_nr: fin(soma(ex, x => x.meses.find(z => z.m === m).r25_nr)),
    r26_cx: fin(soma(ex, x => x.meses.find(z => z.m === m).r26_cx)), r26_nr: fin(soma(ex, x => x.meses.find(z => z.m === m).r26_nr)), tipo: m <= ult ? 'fechado' : m < mOM ? 'om_anterior' : m === mOM ? 'em_curso' : 'futuro'}));
  ['pct_nr', 'pct_cx', 'q425_nr', 'q425_cx'].forEach(k => { reg[k] = fin(reg[k]); });
  return {X, N, ex, reg, mOM, omTxt: omData(), ehH, chE, ult, op};
}

function telaTime() {
  const B = q4Base(), {ex, reg} = B, nomeM = MES_LONGO[B.mOM - 1];
  const agir = [];
  const vivos = ex.filter(x => x.ar_nr > 0 && isFinite(x.pct_nr));
  const pior = [...vivos].sort((a, b) => a.pct_nr - b.pct_nr)[0], melhor = [...vivos].sort((a, b) => b.pct_nr - a.pct_nr)[0];
  if (pior) agir.push({t: `${pior.nome}: ${pTxt(pior.pct_nr)} da meta do Q4 com carteira`, d: `o mais atrasado do time; faltam ${rsT(Math.max(0, pior.ar_mes - pior.ped_mes))} para o AR de ${nomeM}.`});
  // cliente com a maior falta para o AR do mês (mesma conta do Plano Q4, cliente a cliente)
  const hy = B.ehH, chG = r => r[COL.grp], PG = cuboP('rs', {sub: hy, chave: chG}), OG = omSoma({so: 'hyg', chave: l => l[0]});
  const cl = [...PG.keys()].map(k => { const am = v(PG.get(k), 2026, B.mOM), o = OG.get(k) || ZERO_OM, d = infoGrp(dic.grp[k]); return {nome: nm(dic.grp[k]), exe: d ? d.executivo : '', am, ped: o.nfat + o.ncart}; })
    .filter(c => c.am > 0).map(c => ({...c, falta: c.am - c.ped})).sort((a, b) => b.falta - a.falta);
  if (cl[0] && cl[0].falta > 0) agir.push({t: `${cl[0].nome}: a maior falta para o AR de ${nomeM}`, d: `${rsT(cl[0].falta)} (${pTxt(pct(cl[0].ped, cl[0].am))} do mês em pedido)${cl[0].exe ? ', carteira de ' + cl[0].exe : ''}.`});
  if (melhor && melhor !== pior) agir.push({t: `${melhor.nome} lidera com ${pTxt(melhor.pct_nr)} da meta do Q4`, d: 'a rotina de pedido dele é a referência do time neste trimestre.'});
  return {reg, ex, agir, mes_om: B.mOM, om_data: B.omTxt, nome_mes: nomeM, gerente: (DSI.equipe || []).map(([c, n]) => ({cargo: c, nome: n})),
    nota: 'Meta = AR oficial de 29/09 em Hygiene (Veja, Vanish, Harpic e Finish), a régua do Q4. Real + carteira = meses fechados do P&L e, no mês em curso, faturado + carteira liberada + alocação do Order Management, com o NR estimado pelo NR por caixa do segmento, como no Plano Q4 do site principal. Carteira bloqueada e carteira futura ficam fora (o RV soma a futura).'};
}

function posit(F) {   // positivação no sell out do indireto (régua do site, PDVs positivados por mês)
  const fx = tem(F) ? filtroSO(F) : (modo('so'), {ok: true});
  if (!fx.ok) return {vazio: true, motivo: fx.motivo};
  const P = um('pdv', {marcas: gMarcas()}), pFim = fimSerie('base'), pPar = parcialDe('base');
  // média por mês só nos meses com dado nos dois anos (distribuidor que saiu da base no meio do ano não compara meses diferentes)
  const par = ate(S.corte).filter(m => v(P, 2025, m) > 0 && v(P, 2026, m) > 0), med = (ano, L) => (L.length ? L.reduce((s, m) => s + v(P, ano, m), 0) / L.length : NaN);
  const faixa = !par.length ? '' : par.length === S.corte ? `jan a ${mes(S.corte)}` : par.length === par[par.length - 1] - par[0] + 1 ? `${mes(par[0])} a ${mes(par[par.length - 1])}` : par.map(mes).join(', ');
  if (!par.length) return {vazio: true, motivo: 'Sem positivação comparável entre 2025 e 2026 neste recorte.'};
  return {meses: ate(12).map(m => ({m, p25: fin(v(P, 2025, m)), p26: fin(m <= pFim ? v(P, 2026, m) : NaN), parcial: !!(pPar && pPar.mes === m)})), corte: D.ult26, parcial_ate: pPar ? pPar.ate : '',
    ytd26: fin(med(2026, par)), ytd25: fin(med(2025, par)), corte_txt: faixa, pareado: par.length < S.corte};
}
function telaVendas(F = {}) {
  const B = q4Base(F); if (B.vazio) return B;
  const {reg, ehH, op} = B, ult = B.ult, mOM = B.mOM;
  const C = um('cx', {...op, sub: ehH, semCorte: true}), R = um('rs', {...op, sub: ehH, semCorte: true}), PC = umP('cx', {...op, sub: ehH}), PR = umP('rs', {...op, sub: ehH});
  const o1 = om1({...op, so: 'hyg'});
  const serie = med => ate(12).map(m => {
    const a25 = v(med === 'cx' ? C : R, 2025, m), ar = Q4M.includes(m) ? v(med === 'cx' ? PC : PR, 2026, m) : NaN;
    let a26 = NaN, tipo = 'futuro';
    if (m <= ult) { a26 = v(med === 'cx' ? C : R, 2026, m); tipo = 'fechado'; }
    else if (m < mOM) { const o = om1({...op, so: 'hyg', linhas: OMB_ANT.filter(l => l[16] === m)}); a26 = med === 'cx' ? o.fat : o.nfat; tipo = 'om_anterior'; }
    else if (m === mOM) { a26 = med === 'cx' ? o1.fat + o1.cart + o1.aloc : o1.nfat + o1.ncart; tipo = 'em_curso'; }
    return {m, r25: fin(a25), r26: fin(a26), ar: fin(ar), tipo};
  });
  const ytdC = [agg(C, 2026, ate(ult), false), agg(C, 2025, ate(ult), false)], ytdR_ = [agg(R, 2026, ate(ult), false), agg(R, 2025, ate(ult), false)];
  // metas por marca (Hygiene): AR do Q4, real + carteira, Q4 de 2025
  const chM = r => r[COL.marca], PMc = cuboP('cx', {...op, sub: ehH, chave: chM}), PMr = cuboP('rs', {...op, sub: ehH, chave: chM}), AMc = cubo('cx', {...op, sub: ehH, chave: chM, semCorte: true}), AMr = cubo('rs', {...op, sub: ehH, chave: chM, semCorte: true});
  const OMm = omSoma({...op, so: 'hyg', chave: l => l[4]});
  const realQ4 = (Ac, Ar, o, med) => Q4M.reduce((s, m) => s + (m <= ult ? (v(med === 'cx' ? Ac : Ar, 2026, m) || 0) : 0), 0) + (med === 'cx' ? o.fat + o.cart + o.aloc : o.nfat + o.ncart);
  const marcas = ['VEJA', 'VANISH', 'HARPIC', 'FINISH'].filter(n => !F.marca || up(F.marca) === n).map(n => { const k = id('marca', n), o = OMm.get(k) || ZERO_OM, pc = PMc.get(k), pr = PMr.get(k), ac = AMc.get(k), ar = AMr.get(k);
    const arc = pc ? agg(pc, 2026, Q4M, false) : NaN, arn = pr ? agg(pr, 2026, Q4M, false) : NaN, rcc = realQ4(ac, ar, o, 'cx'), rcn = realQ4(ac, ar, o, 'rs');
    const q25c = ac ? agg(ac, 2025, Q4M, false) : NaN, y26 = ar ? agg(ar, 2026, ate(ult), false) : NaN, y25 = ar ? agg(ar, 2025, ate(ult), false) : NaN;
    return {marca: n, ar_cx: fin(arc), rc_cx: fin(rcc), pct_cx: fin(pct(rcc, arc)), ar_nr: fin(arn), rc_nr: fin(rcn), pct_nr: fin(pct(rcn, arn)), q425_cx: fin(q25c), ar_vs25: fin(varr(arc, q25c)), ytd_var: fin(varr(y26, y25))}; })
    .filter(m => m.ar_nr > 0 || m.rc_nr > 0);
  // canal do cliente nos dois lados: AR e pedido do mesmo cliente caem no mesmo canal
  const canalG = g => { const d = infoGrp(dic.grp[g]); return d ? d.canal : 'SEM CANAL'; };
  const chG = r => r[COL.grp], PGr = cuboP('rs', {...op, sub: ehH, chave: chG}), AGr = cubo('rs', {...op, sub: ehH, chave: chG, semCorte: true}), OG = omSoma({...op, so: 'hyg', chave: l => l[0]});
  const can = new Map(), gc = k => { let o = can.get(k); if (!o) can.set(k, o = {canal: k, ar_nr: 0, rc_nr: 0, q425_nr: 0, n: 0}); return o; };
  PGr.forEach((a, g) => { const q = agg(a, 2026, Q4M, false); if (q > 0) { const o = gc(canalG(g)); o.ar_nr += q; o.n++; } });
  AGr.forEach((a, g) => { const o = gc(canalG(g)); o.q425_nr += agg(a, 2025, Q4M, false) || 0; o.rc_nr += Q4M.reduce((s, m) => s + (m <= ult ? (v(a, 2026, m) || 0) : 0), 0); });
  OG.forEach((o, g) => { gc(canalG(g)).rc_nr += o.nfat + o.ncart; });
  const canais = [...can.values()].filter(c => c.ar_nr > 0 || c.rc_nr > 0).map(c => ({...c, nome: titTxt(c.canal), pct: fin(pct(c.rc_nr, c.ar_nr)), ar_vs25: fin(varr(c.ar_nr, c.q425_nr))})).sort((a, b) => b.ar_nr - a.ar_nr);
  // clientes do recorte: AR do Q4 e o pedido em mãos (ajuda a ler o filtro)
  const clientes = [...PGr.keys()].map(g => { const q = agg(PGr.get(g), 2026, Q4M, false), a = AGr.get(g), o = OG.get(g) || ZERO_OM, rc = (a ? Q4M.reduce((s, m) => s + (m <= ult ? (v(a, 2026, m) || 0) : 0), 0) : 0) + o.nfat + o.ncart;
    return {nome: nm(dic.grp[g]), ar_nr: q, rc_nr: rc, pct: fin(pct(rc, q))}; }).filter(c => c.ar_nr > 0).sort((a, b) => b.ar_nr - a.ar_nr).slice(0, 8);
  const pos = posit(F);
  const agir = [];
  const mPior = [...marcas].filter(x => isFinite(x.pct_nr)).sort((a, b) => a.pct_nr - b.pct_nr)[0];
  if (mPior && marcas.length > 1) agir.push({t: `${titTxt(mPior.marca)}: ${pTxt(mPior.pct_nr)} da meta de NR do Q4 com carteira`, d: `a marca mais atrasada; o AR do Q4 é ${rsT(mPior.ar_nr)}.`});
  const cPior = clientes.length > 1 ? clientes.filter(c => c.ar_nr > 2e5 && num(c.pct) && c.pct < 1).sort((a, b) => a.pct - b.pct)[0] : null;
  if (cPior) agir.push({t: `${cPior.nome}: ${pTxt(cPior.pct)} do AR do Q4`, d: `o cliente mais atrasado do recorte, com ${rsT(Math.max(0, cPior.ar_nr - cPior.rc_nr))} para fechar o trimestre.`});
  else if (clientes.length === 1 && num(clientes[0].pct)) { const c = clientes[0]; agir.push({t: `${c.nome}: ${pTxt(c.pct)} do AR do Q4`, d: c.pct >= 1 ? 'o AR do trimestre já está em pedido: o foco passa a ser o mix e a positivação.' : `faltam ${rsT(c.ar_nr - c.rc_nr)} para fechar o trimestre.`}); }
  const dp = pos.vazio ? NaN : pct(pos.ytd26, pos.ytd25) - 1;
  if (num(dp)) agir.push({t: `Positivação ${dp >= 0 ? '+' : ''}${nf1b.format(dp * 100)}% no ano (${pos.corte_txt})`, d: `${nf0.format(pos.ytd26)} PDVs por mês no sell out do indireto, contra ${nf0.format(pos.ytd25)} em 2025 (soma dos distribuidores).`});
  if (agir.length < 3) { const m2 = marcas.filter(m => m !== mPior && num(m.pct_nr)).sort((a, b) => (b.ar_nr - b.rc_nr) - (a.ar_nr - a.rc_nr))[0];
    if (m2 && m2.ar_nr - m2.rc_nr > 0) agir.push({t: `${titTxt(m2.marca)}: ${rsT(m2.ar_nr - m2.rc_nr)} para fechar o AR do Q4`, d: `${pTxt(m2.pct_nr)} da meta de NR em pedido.`}); }
  return {reg, cx: serie('cx'), nr: serie('rs'), ytd_cx: ytdC.map(fin), ytd_nr: ytdR_.map(fin), ult, mes_om: mOM, om_data: B.omTxt, marcas, canais, clientes, pos, agir,
    nota: 'BU Hygiene (Veja, Vanish, Harpic, Finish e ajustes financeiros), a régua do AR do Q4. Jan a set: P&L Restated. Mês em curso: faturado + carteira do Order Management, NR estimado. Nov e dez: AR. Canal = canal do cliente no P&L, nos dois lados (AR e pedido).'};
}

const SEG_PT = {VMU: 'VMU · multiuso', 'HEAVY DUTY': 'Limpeza pesada', VPS: 'VPS · perfumado', KITCHEN: 'Cozinha', BATHROOM: 'Banheiro', GLASS: 'Vidros', GEL: 'Gel', DESINFECTANT: 'Desinfetante', PETS: 'Pets',
  LIQUID: 'Líquido', POWDERS: 'Pó', BARS: 'Barra', 'VANISH OTHERS': 'Outros', POWDER: 'Pó', TABS: 'Tabletes', RINSE: 'Secante', ITB: 'ITB · bloco', ITC: 'ITC · caixa acoplada', 'ADHESIVE BLOCKS': 'Adesivo', LIQUIDS: 'Líquido', BLOCKS: 'Blocos', WAVE: 'Wave', 'CLICK GEL': 'Click Gel',
  'JONTEX CONDOMS': 'Preservativos', 'JONTEX LUBS': 'Lubrificantes', 'JONTEX CONDOMS - PACKS': 'Preservativos · packs', 'OLLA CONDOMS': 'Preservativos', 'OLLA LUBS': 'Lubrificantes', VEET: 'Depilação', 'SUSTAGEN KIDS': 'Kids', 'SUSTAGEN ADULTOS': 'Adulto', 'SUSTAGEN SENIOR': 'Sênior', 'SUSTAGEN KIDS - PACKS': 'Kids · packs', SUSTAGEN: 'Outros', 'NOT AVAILABLE': 'Sem segmento'};
const segPT = s => SEG_PT[s] || titTxt(s);
function telaMarcas(F = {}) {
  const fx = tem(F) ? filtroSI(F) : (modo('si'), {ok: true});
  if (!fx.ok) return {vazio: true, motivo: fx.motivo};
  const M = gMarcas(), ult = D.ult26, mOM = omMes(), chMS = r => r[COL.marca] * 100 + r[COL.segmento];
  const A = cubo('rs', {marcas: M, chave: chMS, semCorte: true}), AC = cubo('cx', {marcas: M, chave: chMS, semCorte: true}), P = cuboP('rs', {marcas: M, chave: chMS}), PC = cuboP('cx', {marcas: M, chave: chMS});
  const OM = omSoma({marcas: M, chave: l => l[4] * 100 + l[5]});
  const lin = new Map();
  const g = k => { let o = lin.get(k); if (!o) lin.set(k, o = {k, y26: 0, y25: 0, c26: 0, c25: 0, ar_cx: 0, ar_nr: 0, rc_cx: 0, rc_nr: 0}); return o; };
  A.forEach((a, k) => { const o = g(k); o.y26 = agg(a, 2026, ate(ult), false) || 0; o.y25 = agg(a, 2025, ate(ult), false) || 0; o.rc_nr += Q4M.reduce((s, m) => s + (m <= ult ? (v(a, 2026, m) || 0) : 0), 0); });
  AC.forEach((a, k) => { const o = g(k); o.c26 = agg(a, 2026, ate(ult), false) || 0; o.c25 = agg(a, 2025, ate(ult), false) || 0; o.rc_cx += Q4M.reduce((s, m) => s + (m <= ult ? (v(a, 2026, m) || 0) : 0), 0); });
  P.forEach((a, k) => { g(k).ar_nr = agg(a, 2026, Q4M, false) || 0; });
  PC.forEach((a, k) => { g(k).ar_cx = agg(a, 2026, Q4M, false) || 0; });
  OM.forEach((o, k) => { const x = g(k); x.rc_cx += o.fat + o.cart + o.aloc; x.rc_nr += o.nfat + o.ncart; });
  const ORD = ['VEJA', 'VANISH', 'HARPIC', 'FINISH', 'SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'];
  const todos = [...lin.values()].map(o => ({...o, marca: dic.marca[Math.floor(o.k / 100)], seg: dic.segmento[o.k % 100]}));
  const segs = todos.filter(o => ORD.includes(o.marca) && (o.y26 || o.y25 || o.ar_nr || o.rc_nr));   // a marca soma todos os segmentos, inclusive NR negativo (devolução no P&L)
  if (!segs.some(o => o.y26 > 0 || o.ar_nr > 0)) return {vazio: true, motivo: 'Sem venda das marcas neste recorte.'};
  const totY26 = soma(todos, o => o.y26);   // peso sobre o NR do recorte inteiro, como o Peso 26 do site principal
  const marcas = ORD.map(mk => {
    const S_ = segs.filter(o => o.marca === mk); if (!S_.length) return null;
    const t = f => soma(S_, f), y26 = t(o => o.y26), y25 = t(o => o.y25), arc = t(o => o.ar_cx), rcc = t(o => o.rc_cx), arn = t(o => o.ar_nr), rcn = t(o => o.rc_nr);
    return {marca: mk, nome: titTxt(mk), y26, y25, var_nr: fin(varr(y26, y25)), var_cx: fin(varr(t(o => o.c26), t(o => o.c25))), peso: fin(pct(y26, totY26)), ar_cx: arc, rc_cx: rcc, pct_cx: fin(pct(rcc, arc)), ar_nr: arn, rc_nr: rcn, pct_nr: fin(pct(rcn, arn)),
      segs: S_.filter(o => o.y26 > 0 || o.ar_nr > 0).sort((a, b) => b.y26 - a.y26).map(o => ({nome: segPT(o.seg), y26: o.y26, var_nr: fin(varr(o.y26, o.y25)), var_cx: fin(varr(o.c26, o.c25)), peso: fin(pct(o.y26, totY26)), ar_cx: o.ar_cx, rc_cx: o.rc_cx, pct_cx: fin(pct(o.rc_cx, o.ar_cx))}))};
  }).filter(m => m && (m.y26 > 0 || m.ar_nr > 0));
  marcas.sort((a, b) => b.y26 - a.y26).forEach((m, i) => { m.rank = i + 1; });
  const lim = tem(F) ? 5e4 : 5e5, limM = tem(F) ? 1e5 : 1e6;   // sem filtro, destaque só de marca com R$ 1 Mi ou mais no ano
  const grandes = marcas.filter(m => m.y26 >= limM && num(m.var_nr));
  const sobe = grandes.length > 1 ? [...grandes].filter(m => m.var_nr > 0).sort((a, b) => b.var_nr - a.var_nr)[0] || null : null, cai = grandes.length > 1 ? [...grandes].filter(m => m.var_nr < 0).sort((a, b) => a.var_nr - b.var_nr)[0] || null : null;
  const segG = marcas.flatMap(m => m.segs.map(s => ({...s, marca: m.nome}))).filter(s => s.y26 >= lim && num(s.var_nr));
  const sCai = [...segG].filter(s => s.var_nr < 0).sort((a, b) => a.var_nr - b.var_nr)[0], sSobe = [...segG].filter(s => s.var_nr > 0).sort((a, b) => b.var_nr - a.var_nr)[0];
  const agir = [];
  if (sCai) agir.push({t: `${sCai.marca} ${sCai.nome}: ${pc(sCai.var_nr)} de NR no ano`, d: `o segmento que mais cai entre os que vendem mais de ${rsT(lim)} (${rsT(sCai.y26)} de jan a ${mes(ult)}).`});
  if (sSobe && sSobe !== sCai) agir.push({t: `${sSobe.marca} ${sSobe.nome}: ${pc(sSobe.var_nr)} de NR no ano`, d: 'o segmento que mais cresce: proteger estoque e exposição.'});
  const mQ4 = marcas.filter(m => m.ar_nr > (tem(F) ? 5e4 : 5e5) && num(m.pct_nr)).sort((a, b) => a.pct_nr - b.pct_nr)[0];
  if (mQ4) agir.push({t: `${mQ4.nome}: ${pTxt(mQ4.pct_nr)} do AR de NR do Q4 com carteira`, d: marcas.length > 1 ? 'a marca mais longe do plano do trimestre.' : `${rsT(Math.max(0, mQ4.ar_nr - mQ4.rc_nr))} para fechar o AR do trimestre.`});
  return {marcas, destaques: {sobe: sobe ? {nome: sobe.nome, v: sobe.var_nr} : null, cai: cai ? {nome: cai.nome, v: cai.var_nr} : null, seg_cai: sCai ? {nome: `${sCai.marca} ${sCai.nome}`, v: sCai.var_nr} : null},
    lim, limM, ult, corte_txt: `jan a ${mes(ult)}`, mes_om: mOM, om_data: omData(), agir,
    nota: 'Sell in das 3 BUs (P&L Restated) de jan ao último mês fechado contra o mesmo período de 2025. Q4: AR de 29/09 de cada marca contra os meses fechados mais o faturado e a carteira do Order Management. Peso = participação no NR do ano do recorte (todas as marcas); a marca soma todos os segmentos, inclusive devolução.'};
}

/* RV: só metas e atingimento (sem salário nem valor de RV), como a página RV do site principal */
function telaRV() {
  const B = q4Base(), Q = Q4P(), nomeM = MES_LONGO[B.mOM - 1];
  const faixa = p => { const e = (Q.escala || []).find(([lim]) => p >= lim - 1e-9); return e ? e[1] : (Q.rot && Q.rot.abaixo) || ''; };
  const ex = B.ex.map(x => ({nome: x.nome, vaga: x.vaga, canal: x.canal, ar_mes: x.ar_mes, ped_mes: x.ped_mes, pct_mes: fin(pct(x.ped_mes, x.ar_mes)), falta_piso: fin(Math.max(0, x.ar_mes * Q.piso - x.ped_mes)), falta_100: fin(Math.max(0, x.ar_mes - x.ped_mes)),
    faixa_mes: faixa(pct(x.ped_mes, x.ar_mes)), ar_q4: x.ar_nr, rc_q4: x.ped_q4, pct_q4: fin(pct(x.ped_q4, x.ar_nr)), falta_q4: fin(Math.max(0, x.ar_nr - x.ped_q4)), falta_alvo: fin(Math.max(0, x.ar_nr * Q.alvo - x.ped_q4))}));
  return {ex, nome_mes: nomeM, om_data: B.omTxt, piso: Q.piso, alvo: Q.alvo, rot: Q.rot || {}, regras: (DSI.regras_q4 || []).filter(t => !/hierarquia do sistema/i.test(t)), escala: Q.escala || [],
    nota: 'Pedido do mês = faturado + carteira do mês; pedidos do Q4 = meses fechados + faturado + carteira + carteira futura, como o RV do site principal (percentuais truncados). O canal é o da carteira; o RV é por carteira, então o filtro de cliente não se aplica. O site mostra metas e atingimento: valores de salário e de RV individual ficam fora.'};
}

/* ================= Nielsen: share da Reckitt por categoria, trimestre contra o mesmo trimestre do ano anterior ================= */
function telaNielsen() {
  modo('ni');
  const cats = D.cats.map((c, ci) => {
    S.niCat = ci; S.niGeo = 'CTO'; S.niMed = 0; S.ui.niper = 'tri'; S.corte = D.corte; niFiltrar();   // o mercado fica no padrão do site (Superfícies sem Desinfetante), que ninguém troca aqui
    const J = niJanela(ci), X = J.P.tri, g = niGeoEf(c), rows = niLinhas(ci, g), o = niSerie(rows), n = niNum(o, X);
    const vol = niNum(niSerie(rows, 1), X);
    const fab = niJogadores(rows, r => r[3]), rank = [...fab.entries()].map(([k, f]) => ({k, nome: D.dic.fab[k], v: niSoma(f.c, X.a), s: niShare(f, X.a)})).filter(f => f.nome !== 'OUTROS FABRICANTES' && f.v > 0).sort((a, b) => b.v - a.v);
    const iR = rank.findIndex(f => f.nome === 'RECKITT'), lider = rank.find(f => f.nome !== 'RECKITT');
    const marcas = niJogadores(rows, r => r[4]), mk = [...marcas.entries()].map(([k, f]) => ({nome: D.dic.marca[k], s: niShare(f, X.a), sb: niShare(f, X.b), v: niSoma(f.c, X.a)}))
      .filter(m => m.nome !== 'OUTRAS MARCAS' && m.v > 0).sort((a, b) => b.v - a.v);
    const rb = mk.filter(m => (c.marcas_rb || []).includes(m.nome)).slice(0, 2), concor = mk.find(m => !(c.marcas_rb || []).includes(m.nome));
    const br = c.geo_txt.BR ? niNum(niSerie(niLinhas(ci, 'BR')), X) : null;
    const can = niFatias(niLinhas(ci, g, {semCanal: true}), r => r[2]), canais = [...can.entries()].map(([k, f]) => ({nome: niCanal(k).replace(/&amp;/g, '&'), cod: D.dic.canal[k], s: niShare(f, X.a), sb: niShare(f, X.b), m: niSoma(f.t, X.a)})).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
    const ufs = c.abre === 'uf' ? ['DF', 'GO', 'MT', 'MS', 'TO_PA_AP'].filter(u => c.geo_txt[u]).map(u => { const z = niNum(niSerie(niLinhas(ci, u)), X); return {uf: u === 'TO_PA_AP' ? 'TO, PA e AP' : u, s: z.sa, d: z.ds, dm: z.dm}; }) : [];
    const ult13 = []; for (let i = Math.max(niIni(ci), J.v - 12); i <= J.v; i++) ult13.push({mes: exRot(i), s: fin(o.t[i] > 0 ? o.c[i] / o.t[i] : NaN)});
    const preco = (n.ca / vol.ca) / (n.ma / vol.ma) * 100;
    return {cod: c.cod, nome: c.nome, fonte: c.fonte, bu: c.bu, geo: niGeoTxt(g, c), marcas_rb: rb.map(m => ({nome: titTxt(m.nome), s: fin(m.s), d: fin(m.s - m.sb)})),
      s: fin(n.sa), d: fin(n.ds), dp: fin(n.dsp), sv: fin(vol.sa), dv: fin(vol.ds), dm: fin(n.dm), dc: fin(n.dc), mercado: fin(n.ma), reckitt: fin(n.ca), preco: fin(preco),
      rank: iR >= 0 ? iR + 1 : null, n_fab: rank.length, lider: lider ? {nome: titTxt(lider.nome), s: fin(lider.s)} : null, concorrente: concor ? {nome: titTxt(concor.nome), s: fin(concor.s)} : null, lidera: iR === 0,
      br: br ? {s: fin(br.sa), d: fin(br.ds)} : null, canais: canais.map(x => ({nome: x.nome, s: fin(x.s), d: fin(x.s - x.sb)})), ufs: ufs.map(u => ({uf: u.uf, s: fin(u.s), d: fin(u.d)})), serie: ult13,
      periodo: X.txt, periodo_ant: X.btxt, sem_desinf: !!(c.fora_padrao || []).length};
  });
  const ok = cats.filter(c => isFinite(c.d));
  const ganham = ok.filter(c => c.d >= 0.0005).length, perdem = ok.filter(c => c.d <= -0.0005).length;
  const maiorG = [...ok].sort((a, b) => b.d - a.d)[0], maiorP = [...ok].sort((a, b) => a.d - b.d)[0];
  const agir = [];
  if (maiorP && maiorP.d < 0) agir.push({t: `${maiorP.nome} ${ppT(maiorP.d)}`, d: `a maior perda de share no trimestre (${pTxt(maiorP.s)} ${maiorP.geo.split(' (')[0]}); ${maiorP.lider && maiorP.rank !== 1 ? `${maiorP.lider.nome} lidera com ${pTxt(maiorP.lider.s)}` : `mercado ${maiorP.dm >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(maiorP.dm)).replace('+', '')} e a Reckitt ${maiorP.dc >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(maiorP.dc)).replace('+', '')}`}.`});
  const canP = ok.flatMap(c => c.canais.filter(x => isFinite(x.d)).map(x => ({...x, cat: c.nome}))).sort((a, b) => a.d - b.d)[0];
  if (canP && canP.d < 0) agir.push({t: `${canP.cat} no ${canP.nome}: ${ppT(canP.d)}`, d: `o canal que mais perde share (${pTxt(canP.s)} no trimestre).`});
  const gapBR = ok.filter(c => c.br && isFinite(c.br.s)).map(c => ({...c, gap: c.s - c.br.s})).sort((a, b) => a.gap - b.gap)[0];
  if (gapBR && gapBR.gap < 0) agir.push({t: `${gapBR.nome}: ${ppT(gapBR.gap).replace('-', '')} abaixo do Brasil`, d: `${pTxt(gapBR.s)} na região contra ${pTxt(gapBR.br.s)} no Brasil: o maior espaço para crescer.`});
  else if (maiorG && maiorG.d > 0) agir.push({t: `${maiorG.nome} ${ppT(maiorG.d)}`, d: 'o maior ganho de share no trimestre: manter a execução.'});
  const f = D.fonte || {};
  return {cats, ganham, perdem, n: ok.length, maiorG: maiorG ? {nome: maiorG.nome, d: maiorG.d} : null, maiorP: maiorP ? {nome: maiorP.nome, d: maiorP.d} : null, agir,
    fonte: {nome: f.nome || 'Nielsen e IQVIA (base do CMI)', recebido: f.extraido || '', ate: exRot(D.M - 1)}, periodo: cats[0] ? cats[0].periodo : '', periodo_ant: cats[0] ? cats[0].periodo_ant : '',
    nota: 'Share em valor (R$ da Reckitt sobre o R$ do mercado); share do trimestre = média das shares mensais, contra o mesmo trimestre do ano anterior. Superfícies sem Desinfetante. Superfícies e Alvejantes leem a Área VII; as demais, a região CTO (DF, GO, MT, MS e TO/PA/AP). Índice de preço = preço médio da Reckitt sobre o do mercado (100 = igual). Dado licenciado, uso interno.'};
}

/* ================= Scanntech: share oficial por UF (Painel 2.0) e as redes (Resumo por Rede Mensal) ================= */
function redesScan() {   // mesma conta da página Redes Scanntech, sem filtro
  return emFonte('scanntech', () => {
    const L = scanLinhas(), mer = L.filter(s => !s.so);
    let rk26 = 0, rk25 = 0, mk26 = 0, mk25 = 0;
    mer.forEach(s => { const [a, b] = parR(s.rk, s.mk), [c, d] = parR(s.mk); rk26 += a; rk25 += b; mk26 += c; mk25 += d; });
    const itens = L.map(s => {
      const r26 = ytdR(s.rk, 2026), r25 = ytdR(s.rk, 2025), m26 = ytdR(s.mk, 2026), [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
      let vr = varR(p26, p25); if (r25 >= 1000 && !(r26 > 0)) vr = -1;
      return {rede: s.rede, uf: s.uf, so: !!s.so, r26, r25, vr, vm: !s.so ? varR(q26, q25) : NaN, sh: s.so || !(m26 > 0) ? NaN : r26 / m26, dsh: s.so || !(q25 > 0) || !(q26 > 0) ? NaN : (p26 / q26 - p25 / q25), s};
    }).filter(x => x.r26 > 0 || x.r25 > 0);
    return {itens, sh26: rk26 / mk26, sh25: rk25 / mk25, vr: varr(rk26, rk25), vm: varr(mk26, mk25), corte: cR(), corte_txt: corteTxt(), parcial: parcialDe('scanntech')};
  });
}
function telaScan() {
  modo('so');
  const Q = shareUF(); if (!Q) throw new Error('base sem o share por UF do Painel 2.0');
  const P = suPeriodo(Q), ks = SU_ORDEM.filter(k => Q.ufs[k] && Array.isArray(Q.ufs[k].sh));
  const mes12 = (u, ano) => ate(12).map(m => fin(m <= (ano === P.ano ? P.fim : 12) ? suVal(Q, u, ano, m) : NaN));
  const mkY = (u, ano) => { let t = 0; for (let m = 1; m <= P.c; m++) { const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`); if (i >= 0 && Array.isArray(u.mk)) t += suNum(u.mk[i]) || 0; } return t; };
  const rkY = (u, ano) => { let t = 0; for (let m = 1; m <= P.c; m++) { const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`), s = i >= 0 ? suNum(u.sh[i]) : NaN, k = i >= 0 && Array.isArray(u.mk) ? suNum(u.mk[i]) : NaN; if (isFinite(s) && k > 0) t += s / 100 * k; } return t; };
  const ufs = ks.map(k => { const u = Q.ufs[k], V = suVals(Q, P, u); return {k, nome: k === 'A7' ? 'Área 7' : k, desc: u.nome, y26: fin(V.y6), y25: fin(V.y5), d: fin(V.d), m25: mes12(u, P.ant), m26: mes12(u, P.ano),
    vm: fin(varr(mkY(u, P.ano), mkY(u, P.ant))), vr: fin(varr(rkY(u, P.ano), rkY(u, P.ant)))}; });
  const A7 = ufs.find(u => u.k === 'A7'), U5 = ufs.filter(u => u.k !== 'A7');
  const R = redesScan(), its = R.itens.filter(x => !x.so && x.r26 >= 1e5 && isFinite(x.sh)).sort((a, b) => b.r26 - a.r26);
  const redes = its.slice(0, 24).map(x => ({nome: nm(x.rede), uf: x.uf, sh: fin(x.sh), d: fin(x.dsh), vr: fin(x.vr), vm: fin(x.vm), r26: x.r26}));
  // marcas nas maiores redes (abertura por marca da Scanntech): share da marca nas categorias em que ela pesa, mesmas redes e meses
  const marcas = ['VEJA', 'VANISH', 'HARPIC', 'FINISH'].map(mk => {
    const k = id('marca', mk); if (k < 0 || !RD.scanm) return null;
    S.f.marca.clear(); S.f.marca.add(k);
    const L = emFonte('scanntech_marcas', () => scanLinhas()).filter(s => !s.so);
    S.f.marca.clear();
    let a6 = 0, a5 = 0, m6 = 0, m5 = 0; emFonte('scanntech_marcas', () => L.forEach(s => { const [a, b] = parR(s.rk, s.mk), [c, d] = parR(s.mk); a6 += a; a5 += b; m6 += c; m5 += d; }));
    // principal concorrente nas mesmas categorias da conta da marca (a marca pesa 5% ou mais da categoria na rede), soma das redes no ano
    const conc = new Map(), catsN = new Map(); let mkT = 0;
    emFonte('scanntech_marcas', () => Object.entries(RD.scanm).forEach(([kr, Lr]) => {
      if ((RD.scan.find(z => z.rede + '|' + z.uf === kr) || {}).so) return;
      const tot = l => l[3].reduce((a, x) => a + (x || 0), 0), minhas = Lr.filter(l => l[1] === mk), cats = new Set();
      [...new Set(minhas.map(l => l[0]))].forEach(c => { const m = minhas.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0), t = Lr.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0); if (t > 0 && m / t >= 0.05) cats.add(c); });
      Lr.filter(l => cats.has(l[0])).forEach(l => { const y = ytdR(l[3], 2026); mkT += y; catsN.set(l[0], (catsN.get(l[0]) || 0) + (l[1] === mk ? y : 0)); if (!l[2] && l[1] !== 'OUTRAS') conc.set(l[1], (conc.get(l[1]) || 0) + y); });
    }));
    const top = [...conc.entries()].sort((a, b) => b[1] - a[1])[0];
    return {marca: mk, nome: titTxt(mk), sh: fin(a6 / m6), d: fin(a6 / m6 - a5 / m5), vr: fin(varr(a6, a5)), redes: L.length, conc: top && mkT > 0 ? {nome: titTxt(top[0]), sh: fin(top[1] / mkT)} : null,
      cats: [...catsN.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c)};
  }).filter(Boolean);
  const agir = [];
  const pU = [...U5].filter(u => isFinite(u.d)).sort((a, b) => a.d - b.d)[0];
  if (pU && pU.d < 0) agir.push({t: `${pU.k}: ${nf1b.format(pU.d)} pp no ano`, d: `a UF que mais perde share (${nf1b.format(pU.y26)}% contra ${nf1b.format(pU.y25)}% em ${P.ant}).`});
  const mP = [...marcas].filter(m => isFinite(m.d)).sort((a, b) => a.d - b.d)[0];
  if (mP && mP.d < 0) agir.push({t: `${mP.nome} ${ppT(mP.d)} nas maiores redes`, d: mP.conc ? `${mP.conc.nome} é o principal concorrente nas categorias da marca.` : 'a marca que mais perde share nas redes.'});
  const rP = [...redes].filter(r => isFinite(r.d) && r.r26 >= 5e5).sort((a, b) => a.d - b.d)[0];
  if (rP && rP.d < 0) agir.push({t: `${rP.nome} (${rP.uf}) ${ppT(rP.d)}`, d: `a rede grande que mais perde share (${pTxt(rP.sh)} no ano).`});
  const sf = fonte('scanntech_share_uf'), sc = fonte('scanntech');
  return {a7: A7, ufs: U5, ano: P.ano, ant: P.ant, corte: P.c, corte_txt: `jan a ${mes(P.c)}`, parcial: P.mP > 0 && P.fim >= P.mP ? {mes: P.mP, ate: Q.parcial_ate || ''} : null,
    redes, redes_tot: {sh26: fin(R.sh26), sh25: fin(R.sh25), vr: fin(R.vr), vm: fin(R.vm), n: R.itens.length, corte_txt: R.corte_txt}, marcas, agir,
    fonte: {painel: String(Q.fonte || 'Scanntech Painel 2.0'), extraido: Q.extraido || (sf && sf.extraido) || '', redes: sc ? quandoFonte(sc, true) : ''},
    nota: 'Share oficial por UF: Scanntech Painel 2.0, todas as lojas da Scanntech no estado, sem Desinfetantes. Redes e marcas: Resumo por Rede Mensal e KPIs por SKU das maiores redes, que contam só as redes que liberam o mercado e por isso dão outro número. Variações com mesmas redes e mesmos meses.'};
}

/* Share por cliente: as maiores redes da Scanntech, uma a uma (o seletor e os filtros de UF e marca da tela escolhem) */
function telaCliente() {
  modo('so');
  const R = redesScan(), its = R.itens.filter(x => x.r26 >= 2e5).sort((a, b) => b.r26 - a.r26).slice(0, 40);
  const RMi = mo => RM.indexOf(mo), fimS = emFonte('scanntech', () => fimSerie('scanntech'));
  const lista = its.map(x => {
    const s = x.s, mes2 = ano => ate(12).map(m => { const i = RMi(`${ano}${String(m).padStart(2, '0')}`); if (i < 0 || (ano === 2026 && m > fimS)) return null; const mk = s.mk[i], rk = s.rk[i]; return fin(!x.so && mk > 0 ? rk / mk : NaN); });
    const rkm = ano => ate(12).map(m => { const i = RMi(`${ano}${String(m).padStart(2, '0')}`); if (i < 0 || (ano === 2026 && m > fimS)) return null; return fin(s.rk[i] || NaN); });
    let cats = [];
    const Lm = RD.scanm && RD.scanm[s.rede + '|' + s.uf];
    if (Lm) emFonte('scanntech_marcas', () => {
      cats = [...new Set(Lm.map(l => l[0]))].map(c => { const Lc = Lm.filter(l => l[0] === c), t26 = Lc.reduce((a, l) => a + ytdR(l[3], 2026), 0), t25 = Lc.reduce((a, l) => a + ytdR(l[3], 2025), 0);
        const rb = Lc.filter(l => l[2]), r26 = rb.reduce((a, l) => a + ytdR(l[3], 2026), 0), r25 = rb.reduce((a, l) => a + ytdR(l[3], 2025), 0);
        const cc = Lc.filter(l => !l[2] && l[1] !== 'OUTRAS').map(l => ({nome: titTxt(l[1]), v: ytdR(l[3], 2026)})).sort((a, b) => b.v - a.v)[0];
        const marca = rb.length ? titTxt(rb.sort((a, b) => ytdR(b[3], 2026) - ytdR(a[3], 2026))[0][1]) : '';
        if (x.so) return {cat: c, marca, r26, sh: null, d: null, vr: fin(varR(r26, r25)), vm: null, conc: null};
        return {cat: c, marca, r26, sh: fin(t26 > 0 ? r26 / t26 : NaN), d: fin(t26 > 0 && t25 > 0 ? r26 / t26 - r25 / t25 : NaN), vr: fin(varR(r26, r25)), vm: fin(varR(t26, t25)), conc: cc && cc.v > 0 ? {nome: cc.nome, sh: fin(cc.v / t26)} : null};
      }).filter(z => z.r26 > 0).sort((a, b) => b.r26 - a.r26).slice(0, 10);
    });
    return {id: s.rede + '|' + s.uf, nome: nm(s.rede), uf: s.uf, so: x.so, r26: x.r26, r25: x.r25, vr: fin(x.vr), vm: fin(x.vm), sh: fin(x.sh), d: fin(x.dsh), m25: mes2(2025), m26: mes2(2026), rk25: rkm(2025), rk26: rkm(2026), cats,
      col: !!(CRUZ[s.rede + '|' + s.uf] || []).length};
  });
  const ord = [...lista].filter(x => isFinite(x.sh)).sort((a, b) => b.sh - a.sh);
  lista.forEach(x => { const i = ord.indexOf(x); x.pos = i >= 0 ? i + 1 : null; });
  return {lista, n_rank: ord.length, ref: {sh26: fin(R.sh26), sh25: fin(R.sh25)}, corte_txt: R.corte_txt, parcial: R.parcial ? {mes: R.parcial.mes, ate: R.parcial.ate} : null,
    fonte: fonteTxt('scanntech'), fonte_m: fonteTxt('scanntech_marcas'),
    nota: 'Scanntech, Resumo por Rede Mensal (as 40 maiores redes pela venda da Reckitt no ano). Share da rede = Reckitt sobre o mercado das nossas categorias na rede; referência = as redes que liberam o mercado, mesmas redes e meses. Categorias: KPIs por SKU da rede (SKUs mais vendidos; o Vanish pó não vem nesta consulta).'};
}

/* ================= MSL: Direto (Execution Report, soma do Compliance sobre o Target) e Indireto (média das lojas) ================= */
function blocoDireto(F) {
  const fx = tem(F) ? filtroEX(F) : (modo('ex'), {ok: true});
  if (!fx.ok) return {vazio: true, motivo: fx.motivo};
  const J = exJanela(), R = exResumo(J);
  if (!(R.a.t > 0)) return {vazio: true, motivo: 'Sem lojas auditadas do MSL Direto neste recorte.'};
  const cli = exLinhas(J, EXC.bandeira).filter(x => x.a.t > 0).map(x => ({nome: nm(dic.bandeira[x.k]), m: fin(x.m), d: fin(x.d), f: fin(x.f)})).sort((a, b) => b.m - a.m);
  const mk = exOrdemMarcas(exLinhas(J, EXC.marca).filter(x => x.a.t > 0)).slice(0, 8).map(x => ({nome: titTxt(dic.marca[x.k]), m: fin(x.m), d: fin(x.d)}));
  const se = exSerie(), serie = D.meses.map((am, i) => ({am, m: fin(se.t[i] > 0 ? se.c[i] / se.t[i] : NaN), rot: exRot(i)}));
  const LS = exLojasSku(J), sk0 = [...LS.entries()].map(([k, o]) => ({nome: txt(esc(D.skus[k].desc || D.skus[k].cod)), marca: titTxt(dic.marca[D.K.marca[k]]), cto: EX_CTO.includes(String(dic.marca[D.K.marca[k]]).toUpperCase()), falta: o.falta, aud: o.aud})).sort((a, b) => b.falta - a.falta);
  const skus = sk0.filter(x => (x.cto || F.marca) && x.falta > 0).slice(0, 8), hn = sk0.filter(x => !x.cto && x.aud > 0 && x.falta / x.aud >= 0.9).length;
  const LJ = exSoma(J.idx, EXC.loja), lojas = [...LJ.entries()].filter(([, o]) => o.t > 0).map(([l, o]) => ({nome: nm(txt(exLojaNome(l, true))), cli: nm(dic.bandeira[D.L.bandeira[l]]), m: o.c / o.t})).sort((a, b) => a.m - b.m).slice(0, 6).map(x => ({...x, m: fin(x.m)}));
  return {m: fin(R.m), mb: fin(R.mb), d: fin(R.d), n: R.n, pa: fin(R.pa), acima: R.acima, f: R.f, janela: J.txt, ant: J.antTxt, parcial: !!J.parc, clientes: cli, marcas: mk, serie: serie.slice(-15), skus, hn, lojas,
    fonte: fonteTxt('execucao'), regra: 'Soma do Compliance sobre a soma do Target, na janela de 3 meses; loja acima de 65% é o patamar do Power BI.'};
}
function blocoIndireto(F) {
  const fx = tem(F) ? filtroMI(F) : (modo('mi'), {ok: true});
  if (!fx.ok) return {vazio: true, motivo: fx.motivo};
  const J = miJanela(), R = miResumo(J);
  if (!(R.n > 0)) return {vazio: true, motivo: 'Sem lojas medidas do MSL Indireto neste recorte.'};
  const LJm = miLojas(J.idx), zDist = new Map(); LJm.forEach((o, l) => { if (o.ec === 0) zDist.set(D.L.dist[l], (zDist.get(D.L.dist[l]) || 0) + 1); });
  const dist = miLinhas(J, MIC.dist).filter(x => x.a.t > 0).map(x => ({nome: nm(dic.dist[x.k]), m: fin(x.m), d: fin(x.d), nl: x.nl, zero: zDist.get(x.k) || 0})).sort((a, b) => b.m - a.m);
  const mk = miOrdemMarcas(miLinhas(J, MIC.marca).filter(x => x.a.t > 0)).slice(0, 8).map(x => ({nome: titTxt(dic.marca[x.k]), m: fin(x.m), d: fin(x.d)}));
  const se = miSerie(), serie = D.meses.map((am, i) => ({am, m: fin(se.t[i] > 0 ? se.c[i] / se.t[i] : NaN), rot: exRot(i)}));
  const LS = exLojasSku(J), sk0 = [...LS.entries()].map(([k, o]) => ({nome: txt(esc(D.skus[k].desc || D.skus[k].cod)), marca: titTxt(dic.marca[D.K.marca[k]]), cto: EX_CTO.includes(String(dic.marca[D.K.marca[k]]).toUpperCase()), falta: o.falta, aud: o.aud})).sort((a, b) => b.falta - a.falta);
  const skus = sk0.filter(x => (x.cto || F.marca) && x.falta > 0).slice(0, 8), hn = sk0.filter(x => !x.cto && x.aud > 0 && x.falta / x.aud >= 0.9).length;
  return {m: fin(R.m), mb: fin(R.mb), d: fin(R.d), n: R.n, zero: R.zero, zerob: num(R.mb) ? fin(R.zerob) : null, acima: R.acima, mes: J.txt, jan: J.jan, ant: J.antTxt, parcial: !!J.parc, dist, marcas: mk, serie: serie.slice(-15), skus, hn,
    fonte: fonteTxt('msl_indireto'), regra: `MSL do mês já cobre as compras de 3 meses (${J.jan}); média simples das lojas da lista oficial. Régua ${miRegNome()}.`};
}
function telaMSL(F = {}) {
  const out = {};
  if (DEX) out.direto = F.canal === 'i' ? null : blocoDireto(F);
  if (DMI) out.indireto = F.canal === 'd' ? null : blocoIndireto(F);
  const d0 = out.direto && !out.direto.vazio ? out.direto : null, i0 = out.indireto && !out.indireto.vazio ? out.indireto : null;
  if (!d0 && !i0) return {vazio: true, motivo: [out.direto && out.direto.motivo, out.indireto && out.indireto.motivo].filter(Boolean).join(' ') || 'Sem lojas do MSL neste recorte.'};
  const agir = [];
  if (d0) { const p = d0.clientes.filter(c => isFinite(c.m)).sort((a, b) => a.m - b.m)[0]; if (p) agir.push({t: `${p.nome}: MSL de ${pTxt(p.m)} no direto`, d: `o cliente mais baixo na janela ${d0.janela} (${ppT(p.d)} contra o ano anterior).`}); }
  if (i0) { const p = i0.dist.filter(c => isFinite(c.m) && c.nl >= 20).sort((a, b) => a.m - b.m)[0]; if (p) agir.push({t: `${p.nome}: MSL de ${pTxt(p.m)} no indireto`, d: `o distribuidor mais baixo em ${i0.mes} (${n0(p.nl)} lojas medidas).`}); }
  const sk = (i0 && i0.skus[0]) || (d0 && d0.skus[0]);
  if (sk) agir.push({t: `${sk.nome}: falta em ${n0(sk.falta)} lojas${i0 && i0.skus[0] === sk ? ' do indireto' : ' do direto'}`, d: `a maior falta do recorte (${pTxt(pct(sk.falta, sk.aud))} das lojas ${i0 && i0.skus[0] === sk ? `medidas em ${i0.mes}` : 'auditadas'}).`});
  if (d0 && agir.length < 3 && d0.lojas[0]) agir.push({t: `${d0.lojas[0].nome}: MSL de ${pTxt(d0.lojas[0].m)}`, d: 'a loja mais baixa do direto na janela.'});
  out.agir = agir;
  out.nota = 'MSL sempre em janela de 3 meses. Direto = soma do Compliance sobre a soma do Target (Power BI Execution Report). Indireto = média simples das lojas da lista oficial, recalculado no Colecta.';
  return out;
}

/* Fórmula Reckitt: a base ainda não está na Governança CTO */
const telaFormula = () => ({sem_base: true,
  fonte: 'Power BI Tracking CLC & Sell-Through (Trade Canal Indireto), páginas 3 a 5: Fórmula Reckitt 2026.',
  texto: 'A tela do campeonato dos distribuidores entra quando a base do Tracking estiver na Governança CTO. O MSL do programa (item 2.1) já foi reproduzido exato em outubro; falta trazer faturamento, CLC e segmentos foco por distribuidor.'});

/* opções dos filtros (montadas sem filtro): executivos, clientes do Sell In com o canal, o dono e onde mais o cliente aparece */
function opcoes(time) {
  const CC = canalDosClientes(); modo('si');
  const hy = idHyg(), PG = cuboP('rs', {sub: r => r[COL.uf] === hy, chave: r => r[COL.grp]}), AG = cubo('rs', {sub: r => r[COL.uf] === hy, chave: r => r[COL.grp], semCorte: true});
  const ate9 = ate(D.ult26);
  const clientes = dic.grp.map((g, i) => { const q = PG.get(i) ? agg(PG.get(i), 2026, Q4M, false) : 0, y = AG.get(i) ? agg(AG.get(i), 2026, ate9, false) : 0, d = infoGrp(g), c = cliConf(g) || {};
    return {si: g, nome: nm(g), exec: d ? d.executivo : '', canal: CC.get(g), ar: q || 0, ytd: y || 0, ex: !!(c.ex || []).length, mi: !!(c.mi || []).length, so: !!(c.so || []).length, scan: c.scan || []}; })
    .filter(c => (c.ar > 0 || c.ytd > 0) && (time.ex || []).some(x => x.nome === c.exec)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return {execs: (time.ex || []).map(x => ({nome: x.nome, canal: x.canal, vaga: x.vaga})), clientes, marcas: ['VEJA', 'VANISH', 'HARPIC', 'FINISH', 'SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'].map(m => ({cod: m, nome: titTxt(m)})),
    ufs: ['DF', 'GO', 'MT', 'MS', 'TO', 'PA']};
}

/* ================= saída ================= */
const CALC = {time: telaTime, nielsen: telaNielsen, scanntech: telaScan, cliente: telaCliente, vendas: telaVendas, msl: telaMSL, marcas: telaMarcas, formula: telaFormula, rv: telaRV};
const calc = (k, F) => { const fn = CALC[k]; if (!fn) throw new Error('tela desconhecida: ' + k); return JSON.parse(JSON.stringify(fn(F || {}))); };   // cópia limpa: sem NaN, sem objetos do motor
window.MOTOR_TIME = {versao: 2, calc};
if (window.FOTO_MONTAGEM) {
  Object.keys(CALC).forEach(k => { try { OUT.telas[k] = calc(k, {}); } catch (e) { OUT.erro = (OUT.erro || '') + `[${k}] ${e && e.stack ? e.stack : e}\n`; } });
  try { OUT.filtros = opcoes(OUT.telas.time || {}); } catch (e) { OUT.erro = (OUT.erro || '') + `[filtros] ${e && e.stack ? e.stack : e}\n`; }
  const o = DSI.om && DSI.om.data;
  OUT.fontes = {om: o ? `${o.slice(6, 8)}/${o.slice(4, 6)}/${o.slice(0, 4)}` : '', pl: `jan a ${mes(DSI.ult26)}/26`, site_principal: DSO.gerado};
  const pre = document.createElement('pre');
  if (OUT.erro) { pre.id = 'foto-erro'; pre.textContent = OUT.erro; }
  else { pre.id = 'foto-ok'; pre.textContent = JSON.stringify(OUT); }
  document.body.appendChild(pre);
}
})();

})();
