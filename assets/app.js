/* Governança CTO · Visão do Time. A sequência de relatórios que o time propôs (26/10/2026), uma tela fixa por relatório, sem filtro.
   Os números vêm prontos no arquivo cifrado (window.FOTO), montados pelo mesmo motor de cálculo da Governança CTO: este código só desenha.
   Nomes de cliente, rede, loja e executivo e os textos do variável chegam só pelo arquivo cifrado; nada disso fica escrito aqui. */
(() => {
const F = window.FOTO || {}, T = F.telas || {};
const PRINCIPAL = 'https://andersonalmeidajeronimo-cpu.github.io/dash-geral-cto/';
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const mes = m => MESES[m - 1].toLowerCase();
const nf0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const ok = x => typeof x === 'number' && isFinite(x);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const n0 = x => (ok(x) ? nf0.format(x) : '');
const p1 = x => (ok(x) ? nf1.format(x * 100) + '%' : 'sem dado');
const rs = x => (!ok(x) ? 'sem dado' : Math.abs(x) >= 1e6 ? `R$ ${nf2.format(x / 1e6)} Mi` : Math.abs(x) >= 1e3 ? `R$ ${nf0.format(x / 1e3)} mil` : `R$ ${nf0.format(x)}`);
const rsCurto = x => (!ok(x) ? '' : Math.abs(x) >= 1e6 ? `${nf1.format(x / 1e6)} Mi` : `${nf0.format(x / 1e3)} mil`);
const cx = x => (!ok(x) ? 'sem dado' : Math.abs(x) >= 1e3 ? `${nf1.format(x / 1e3)} mil` : nf0.format(x));
const milC = x => (!ok(x) ? '' : x >= 1e5 ? nf0.format(x / 1e3) : nf1.format(x / 1e3));   // rótulo de barra em mil caixas
const pc = x => (ok(x) ? (x > 0 ? '+' : '') + nf1.format(x * 100) + '%' : '');
const ppv = d => (ok(d) ? `${d > 0.00049 ? '+' : d < -0.00049 ? '-' : ''}${nf1.format(Math.abs(d) < 0.00049 ? 0 : Math.abs(d * 100))} pp` : '');
const pp100 = d => (ok(d) ? `${d > 0.049 ? '+' : d < -0.049 ? '-' : ''}${nf1.format(Math.abs(d) < 0.049 ? 0 : Math.abs(d))} pp` : '');   // Painel 2.0: share já em %
const ppAbs = d => (ok(d) ? `${nf1.format(Math.abs(d * 100))} pp` : '');   // sem sinal, para o texto ('cai 3,2 pp')
const cls = (x, lim = 0.0005) => (!ok(x) ? '' : x > lim ? 'up' : x < -lim ? 'down' : '');
const selo = (txt, c) => `<span class="vr ${c || ''}">${txt}</span>`;
const vSel = x => (ok(x) ? selo((x > 0.0005 ? '▲ ' : x < -0.0005 ? '▼ ' : '') + pc(x), cls(x)) : '');
const ppSel = d => (ok(d) ? selo((d > 0.0005 ? '▲ ' : d < -0.0005 ? '▼ ' : '') + ppv(d), cls(d)) : '');
const pp100Sel = d => (ok(d) ? selo((d >= 0.3 ? '▲ ' : d <= -0.3 ? '▼ ' : '') + pp100(d), d >= 0.3 ? 'up' : d <= -0.3 ? 'down' : '') : '');
const mkCls = m => { const u = String(m).toUpperCase(); return u === 'VEJA' ? 'mk-veja' : u === 'VANISH' ? 'mk-vanish' : ''; };
const iniciais = n => String(n).split(/\s+/).filter(w => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const CADEADO = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const fixo = (t = 'Relatório fixo · não muda com filtro') => `<span class="fixo">${CADEADO}${t}</span>`;

/* semáforo do atingimento contra o ritmo do trimestre (dias úteis passados) */
const RITMO = T.time && T.time.reg ? T.time.reg.ritmo : NaN;
const clsMeta = p => (!ok(p) || !ok(RITMO) ? '' : p >= RITMO ? 'up' : p >= RITMO * 0.75 ? 'warn' : 'down');

/* ---------- gráficos (SVG desenhado aqui, sem biblioteca) ---------- */
function barrasQ4(meses, med, W = 380, H = 104) {   // 3 meses: real 25 (cinza), meta 26 (tracejado) e real 26 (rosa), valor em cima
  const k = med === 'nr' ? '_nr' : '_cx', vals = meses.flatMap(z => [z['r25' + k], z['ar' + k], z['r26' + k]]).filter(ok), mx = Math.max(1, ...vals);
  const pt = 15, pb = 17, gw = W / 3, bw = Math.min(26, gw / 4.2), alt = x => (ok(x) ? Math.max(1.5, x / mx * (H - pt - pb)) : 0);
  const rot = x => (med === 'nr' ? rsCurto(x) : milC(x));
  let s = `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Q4 mês a mês">`;
  s += `<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="#D2D2D7"/>`;
  meses.forEach((z, i) => {
    const cx0 = gw * i + gw / 2, xs = [cx0 - bw * 1.6, cx0 - bw / 2, cx0 + bw * 0.6];
    const L = [[z['r25' + k], 'r25'], [z['ar' + k], 'ar'], [z['r26' + k], 'r26']];
    L.forEach(([x, t], j) => {
      const h = alt(x), y = H - pb - h, xx = xs[j];
      if (t === 'ar') s += `<rect x="${xx.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="none" stroke="#6E6E73" stroke-width="1.3" stroke-dasharray="3 2"/>`;
      else if (t === 'r26' && z.tipo === 'futuro') { /* mês que não começou */ }
      else s += `<rect x="${xx.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${t === 'r25' ? '#D2D2D7' : '#FF007F'}"/>`;
      if (ok(x) && !(t === 'r26' && z.tipo === 'futuro')) s += `<text x="${(xx + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="${t === 'r26' ? '#FF007F' : '#6E6E73'}" font-weight="${t === 'r26' ? 700 : 400}">${rot(x)}</text>`;
    });
    s += `<text x="${cx0.toFixed(1)}" y="${H - 3}" text-anchor="middle" font-size="11" fill="#1D1D1F" font-weight="600">${mes(z.m)}${z.tipo === 'em_curso' ? '*' : ''}</text>`;
  });
  return s + '</svg>';
}
function barras12(serie, fmt, H = 150, W = 760) {   // 12 meses: 2025 cinza e 2026 rosa; meses do plano em tracejado; mês em curso com asterisco
  const vals = serie.flatMap(z => [z.r25, z.r26, z.ar]).filter(ok), mx = Math.max(1, ...vals);
  const pt = 16, pb = 20, gw = W / 12, bw = Math.min(18, gw / 2.8), alt = x => (ok(x) ? Math.max(1.5, x / mx * (H - pt - pb)) : 0);
  let s = `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mês a mês">`;
  s += `<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="#D2D2D7"/>`;
  serie.forEach((z, i) => {
    const c = gw * i + gw / 2, x5 = c - bw - 1, x6 = c + 1, h5 = alt(z.r25), h6 = alt(z.r26), ha = alt(z.ar);
    if (ok(z.r25)) s += `<rect x="${x5.toFixed(1)}" y="${(H - pb - h5).toFixed(1)}" width="${bw}" height="${h5.toFixed(1)}" rx="2.5" fill="#D2D2D7"/>`;
    if (ok(z.ar)) s += `<rect x="${x6.toFixed(1)}" y="${(H - pb - ha).toFixed(1)}" width="${bw}" height="${ha.toFixed(1)}" rx="2.5" fill="none" stroke="#6E6E73" stroke-width="1.2" stroke-dasharray="3 2"/>`;
    if (ok(z.r26) && z.tipo !== 'futuro') s += `<rect x="${x6.toFixed(1)}" y="${(H - pb - h6).toFixed(1)}" width="${bw}" height="${h6.toFixed(1)}" rx="2.5" fill="#FF007F" ${z.tipo === 'em_curso' ? 'fill-opacity=".85"' : ''}/>`;
    const top = Math.max(h6 && z.tipo !== 'futuro' ? h6 : 0, ok(z.ar) ? ha : 0), lab = z.tipo !== 'futuro' && ok(z.r26) ? z.r26 : z.ar;
    if (ok(lab)) s += `<text x="${(x6 + bw / 2).toFixed(1)}" y="${(H - pb - top - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="${z.tipo !== 'futuro' ? '#FF007F' : '#6E6E73'}" font-weight="600">${fmt(lab)}</text>`;
    s += `<text x="${c.toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="10.5" fill="#6E6E73">${mes(z.m)}${z.tipo === 'em_curso' || z.parcial ? '*' : ''}</text>`;
  });
  return s + '</svg>';
}
function linhas(series, rotulos, {W = 520, H = 170, fmt = p1, cores = ['#D2D2D7', '#FF007F'], larg = [2, 3]} = {}) {   // séries de mesmo tamanho; eixo justo nos dados; rótulo no primeiro, no menor e no último ponto da série principal
  const xs = series.flat().filter(ok); if (!xs.length) return '<div class="vazio">Sem dado.</div>';
  const lo = Math.min(...xs), hi = Math.max(...xs), folga = Math.max((hi - lo) * 0.18, Math.abs(hi) * 0.01), y0 = lo - folga, y1 = hi + folga;
  const pl = 6, pr = 6, pt = 16, pb = 20, n = rotulos.length, gx = (W - pl - pr) / Math.max(1, n - 1);
  const px = i => pl + i * gx, py = x => pt + (y1 - x) / (y1 - y0) * (H - pt - pb);
  let s = `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Série mês a mês">`;
  rotulos.forEach((r, i) => { s += `<text x="${px(i).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#86868B">${esc(r)}</text>`; });
  series.forEach((L, j) => {
    const pts = L.map((x, i) => (ok(x) ? [px(i), py(x), x, i] : null)).filter(Boolean); if (!pts.length) return;
    if (pts.length > 1) s += `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${cores[j] || '#1D1D1F'}" stroke-width="${larg[j] || 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (j === series.length - 1) {
      const mn = pts.reduce((a, b) => (b[2] < a[2] ? b : a)), marc = [pts[0], mn, pts[pts.length - 1]].filter((p, i, a) => a.indexOf(p) === i);
      marc.forEach(p => { s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="${cores[j]}"/><text x="${p[0].toFixed(1)}" y="${(p[1] - 7).toFixed(1)}" text-anchor="${p[3] === 0 ? 'start' : p[3] === n - 1 ? 'end' : 'middle'}" font-size="10.5" font-weight="700" fill="${cores[j]}">${fmt(p[2])}</text>`; });
    } else {
      const last = pts[pts.length - 1]; s += `<text x="${last[0].toFixed(1)}" y="${(last[1] + 14).toFixed(1)}" text-anchor="end" font-size="10" fill="#86868B">${fmt(last[2])}</text>`;
    }
  });
  return s + '</svg>';
}
const barra = (x, mx, pk, ref) => `<div class="barra"><i class="${pk ? 'pk' : ''}" style="width:${Math.max(0, Math.min(100, (ok(x) ? x : 0) / (mx || 1) * 100)).toFixed(1)}%"></i>${ok(ref) ? `<span class="ref" style="left:${Math.min(100, ref / (mx || 1) * 100).toFixed(1)}%"></span>` : ''}</div>`;

/* ---------- peças comuns ---------- */
function topo(n, rotulo, t1, t2, sub, dir) {
  return `<div class="topo"><div><p class="eyebrow">${n} · ${rotulo}</p><h2>${t1} <span>${t2}</span></h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="dir">${dir || ''}</div></div>`;
}
const fonteDir = (linhasFonte, fixar = true) => `${fixar ? fixo() : ''}<div>${linhasFonte.filter(Boolean).join('<br>')}</div>`;
const kpi = (lab, val, sb, c = '') => `<div class="kpi"><div class="lab">${lab}</div><div class="val ${c}">${val}</div><div class="sb">${sb || ''}</div></div>`;
function agir(itens, sub = 'Os 3 pontos desta tela, gerados a partir dos números.') {
  if (!itens || !itens.length) return '';
  return `<div class="card agir"><div class="t">Onde agir.<span>${sub}</span></div>${itens.slice(0, 3).map((x, i) => `<div class="it"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><b>${esc(x.t)}</b>: ${esc(x.d)}</div></div>`).join('')}</div>`;
}
const aprofundar = (pg, rot = 'Aprofundar na Governança CTO completa') => `<a href="${PRINCIPAL}#${pg}" target="_blank" rel="noopener">${rot} ›</a>`;
const nota = (txt, pg, rot) => `<p class="nota">${esc(txt)}${pg ? ' ' + aprofundar(pg, rot) : ''}</p>`;
const vazioTela = msg => `<div class="card vazio">${esc(msg)}</div>`;

/* =================== 1. Time CTO =================== */
function telaTime() {
  const D = T.time; if (!D) return vazioTela('Sem a base do Sell In.');
  const R = D.reg, g = (D.gerente || [])[0] || {};
  const titulo = `${p1(R.pct_nr)} da meta de NR do Q4 com carteira.`, cinza = `Ritmo de ${p1(R.ritmo)}: ${R.du_passados} de ${R.du_total} dias úteis já passaram.`;
  let h = topo(1, 'Time CTO', titulo, cinza, `Q4/2026 em Hygiene, out a dez · real + carteira até ${esc(D.om_data)} · ${D.ex.length} carteiras`,
    fonteDir([`Fonte: <b>P&L Restated</b> e <b>Order Management</b>`, `Pedidos de ${esc(D.om_data)}`]));
  h += `<div class="kpis"><div class="kpi pessoa"><span class="av">${esc(iniciais(g.nome || ''))}</span><div><b>${esc(g.nome || '')}</b><span>${esc(g.cargo || '')} · ${D.ex.length} carteiras · total = soma do time</span></div></div>` +
    kpi('Meta · cx', cx(R.ar_cx), 'AR do Q4, out a dez') + kpi('Real + cart · cx', cx(R.rc_cx), `faturado + carteira de ${mes(D.mes_om)}`) +
    kpi('% meta · cx', p1(R.pct_cx), `ritmo: ${p1(R.ritmo)} do Q4`, clsMeta(R.pct_cx)) +
    kpi('Meta · NR', rs(R.ar_nr), `${vSel(R.ar_nr / R.q425_nr - 1)} sobre o Q4/25`) + kpi('Real + cart · NR', rs(R.rc_nr), `faturado ${rs(R.fat_mes)} + carteira ${rs(R.cart_mes)}`) +
    kpi('% meta · NR', p1(R.pct_nr), `ritmo: ${p1(R.ritmo)} do Q4`, clsMeta(R.pct_nr)) + '</div>';
  h += `<div class="grid g3">${D.ex.map(x => cardExec(x)).join('')}</div>`;
  h += agir(D.agir);
  h += nota(`${D.nota} Cor do %: verde no ritmo dos dias úteis do Q4 ou acima, âmbar até 25% abaixo, vermelho mais longe. ${(D.notas_exec || []).join(' ')}`, 'si-q4', 'Abrir o Plano Q4 completo');
  return h;
}
function cardExec(x) {
  const cl = x.clientes.join(', ') + (x.mais ? ` e mais ${x.mais}` : '');
  const tag = x.canal ? `<span class="tag ${x.canal === 'Direto' ? 'dark' : ''}">${esc(x.canal)}</span>` : '';
  const rod = x.meses.map(z => { const vs = ok(z.ar_cx) && ok(z.r25_cx) && z.r25_cx > 0 ? z.ar_cx / z.r25_cx - 1 : NaN, at = z.tipo !== 'futuro' && ok(z.r26_cx) && z.ar_cx > 0 ? z.r26_cx / z.ar_cx : NaN;
    return `<div>meta x 25: <b style="display:inline">${ok(vs) ? pc(vs) : 'sem base'}</b><br>real x meta: <b style="display:inline">${ok(at) ? p1(at) : 'a começar'}</b></div>`; }).join('');
  return `<div class="card exe"><div class="top"><span class="av">${esc(iniciais(x.vaga ? 'Vaga Aberta' : x.nome))}</span><div class="nm"><b>${esc(x.nome)}</b><small>${x.vaga ? 'Vaga em aberto · ' : ''}${esc(cl)}</small></div>${tag}</div>
    <div class="quad"><div><div class="l">Meta · cx</div><div class="v">${cx(x.ar_cx)}</div></div><div><div class="l">Real + cart · cx</div><div class="v">${cx(x.rc_cx)}</div></div><div><div class="l">% meta · cx</div><div class="v c-${clsMeta(x.pct_cx) || 'mut'}">${p1(x.pct_cx)}</div></div>
    <div class="hr"></div><div><div class="l">Meta · NR</div><div class="v">${rs(x.ar_nr)}</div></div><div><div class="l">Real + cart · NR</div><div class="v">${rs(x.rc_nr)}</div></div><div><div class="l">% meta · NR</div><div class="v c-${clsMeta(x.pct_nr) || 'mut'}">${p1(x.pct_nr)}</div></div></div>
    <div class="cab" style="margin-bottom:2px"><div class="leg"><b style="color:var(--ink);font-size:11.5px">Q4 em mil caixas</b><span><i class="c25"></i>real 25</span><span><i class="cm"></i>meta 26</span><span><i class="c26"></i>real 26</span></div></div>
    ${barrasQ4(x.meses, 'cx', 380, 104)}<div class="rodmes">${rod}</div></div>`;
}

/* =================== 2. Market Share Nielsen =================== */
const NI_MARCA = {SURFACE: 'Veja', 'SAFE BLEACH': 'Vanish', 'LAV CARE': 'Harpic', ADW: 'Finish'};
function telaNielsen() {
  const D = T.nielsen; if (!D) return vazioTela('Sem a base Nielsen.');
  const cats = D.cats, hyg = cats.filter(c => NI_MARCA[c.cod]), hn = cats.filter(c => !NI_MARCA[c.cod]);
  const abaixoBR = cats.filter(c => c.br && ok(c.br.s) && ok(c.s) && c.s < c.br.s).length;
  const titulo = `Reckitt ganha share em ${D.ganham} de ${D.n} categorias.`, cinza = `Perde em ${D.perdem}. Trimestre ${esc(D.periodo)} contra ${esc(D.periodo_ant)}.`;
  let h = topo(2, 'Market Share Nielsen', titulo, cinza, 'Share em valor por categoria · Área VII em Superfícies e Alvejantes, região CTO nas demais',
    fonteDir([`Fonte: <b>${esc(D.fonte.nome)}</b>`, `Dado até ${esc(D.fonte.ate)} · recebido em ${esc(String(D.fonte.recebido).slice(0, 10))}`]));
  h += '<div class="kpis">' + kpi('Categorias que ganham share', `${D.ganham} de ${D.n}`, `${D.perdem} perdem no trimestre`, D.ganham >= D.perdem ? 'up' : 'down') +
    (D.maiorG ? kpi('Maior ganho', esc(D.maiorG.nome), ppSel(D.maiorG.d)) : '') + (D.maiorP ? kpi('Maior perda', esc(D.maiorP.nome), ppSel(D.maiorP.d)) : '') +
    kpi('Abaixo do Brasil', `${abaixoBR} de ${cats.filter(c => c.br).length}`, 'categorias com share menor que o do Brasil') + '</div>';
  const cardCat = c => {
    const marca = NI_MARCA[c.cod] || (c.marcas_rb[0] ? c.marcas_rb.map(m => m.nome).join(' + ') : c.nome);
    const outro = c.lidera ? ['Maior concorrente', c.lider] : ['Líder', c.lider];
    return `<div class="card cat"><div class="linha"><span class="marca ${mkCls(marca)}">${esc(marca)}</span><span class="cn">${esc(c.nome)}</span></div>
      <div class="sh">${p1(c.s)} ${ppSel(c.d)}</div>
      <dl><dt>Ranking</dt><dd>${c.rank ? c.rank + 'º de ' + c.n_fab + ' fabricantes' : 'sem dado'}</dd><dt>${outro[0]}</dt><dd>${outro[1] ? `${esc(outro[1].nome)} ${p1(outro[1].s)}` : ''}</dd>
      <dt>Volume</dt><dd>${p1(c.sv)} ${ppSel(c.dv)}</dd><dt>Índice de preço</dt><dd>${ok(c.preco) ? n0(c.preco) : 'sem dado'}</dd>
      <dt>Mercado · Reckitt</dt><dd>${pc(c.dm)} · ${pc(c.dc)}</dd>${c.br ? `<dt>Brasil</dt><dd>${p1(c.br.s)} ${ppSel(c.br.d)}</dd>` : ''}</dl></div>`;
  };
  const tHN = `<div class="card"><div class="cab"><h3>Health e Nutrition. <span>IQVIA, região CTO.</span></h3><small>trimestre</small></div><div class="tw"><table><thead><tr><th class="l">Categoria</th><th>Share</th><th>Brasil</th></tr></thead><tbody>` +
    hn.map(c => `<tr><td class="l"><b>${esc(c.nome)}</b><br><span class="sm" style="margin:0">${esc(c.marcas_rb.map(m => m.nome).join(' + '))} · ${c.rank ? c.rank + 'º' : ''}${c.lider && !c.lidera ? `, ${esc(c.lider.nome)} lidera` : ''}</span></td><td class="b">${p1(c.s)}<br>${ppSel(c.d)}</td><td>${c.br ? p1(c.br.s) : ''}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<div class="grid g4">${hyg.map(cardCat).join('')}</div>`;
  // share por canal (Área VII) e por UF (categorias que abrem por UF)
  const area = cats.filter(c => !c.ufs.length && c.canais.length), canais = [...new Set(area.flatMap(c => c.canais.map(x => x.nome)))], canRot = n => n.replace(/\s*\(.*\)$/, '');
  const heat = (s, d) => (ok(s) ? `<td class="h">${p1(s)}<br><span class="sm ${'c-' + (cls(d) || 'mut')}" style="margin:0">${ppv(d)}</span></td>` : '<td></td>');
  const tCanal = `<div class="card"><div class="cab"><h3>Share por canal. <span>Área VII.</span></h3><small>pp contra o ano anterior</small></div><div class="tw"><table class="heat"><thead><tr><th class="l">Canal</th>${area.map(c => `<th>${esc(NI_MARCA[c.cod] || c.nome)}</th>`).join('')}</tr></thead><tbody>` +
    canais.map(cn => `<tr><td class="l">${esc(canRot(cn))}</td>${area.map(c => { const x = c.canais.find(y => y.nome === cn); return x ? heat(x.s, x.d) : '<td></td>'; }).join('')}</tr>`).join('') + '</tbody></table></div></div>';
  const porUF = cats.filter(c => c.ufs.length && NI_MARCA[c.cod]), ufs = [...new Set(porUF.flatMap(c => c.ufs.map(u => u.uf)))], ufRot = u => (u.startsWith('TO') ? 'TO/PA/AP' : u);
  const tUF = `<div class="card"><div class="cab"><h3>Share por estado. <span>Sanitário e Lava-louças.</span></h3><small>pp contra o ano anterior</small></div><div class="tw"><table class="heat"><thead><tr><th class="l">Categoria</th>${ufs.map(u => `<th>${esc(ufRot(u))}</th>`).join('')}<th>Região</th></tr></thead><tbody>` +
    porUF.map(c => `<tr><td class="l"><b>${esc(NI_MARCA[c.cod])}</b></td>${ufs.map(u => { const x = c.ufs.find(y => y.uf === u); return x ? heat(x.s, x.d) : '<td></td>'; }).join('')}${heat(c.s, c.d)}</tr>`).join('') + '</tbody></table></div></div>';
  const serie = `<div class="card"><div class="cab"><h3>Share mês a mês. <span>Últimos 13 meses.</span></h3></div>${hyg.map(c => `<div style="margin-bottom:6px"><div class="leg" style="justify-content:space-between"><b class="${mkCls(NI_MARCA[c.cod])}" style="font-size:12px">${esc(NI_MARCA[c.cod])}</b><span>${esc(c.serie[0].mes)} a ${esc(c.serie[c.serie.length - 1].mes)}</span></div>${linhas([c.serie.map(z => z.s)], c.serie.map(() => ''), {W: 300, H: 62, cores: ['#FF007F'], larg: [2.2]})}</div>`).join('')}</div>`;
  h += `<div class="grid mt" style="grid-template-columns:minmax(0,.8fr) minmax(0,1.05fr) minmax(0,1.45fr) minmax(0,1fr)">${serie}${tCanal}${tUF}${tHN}</div>`;
  h += agir(D.agir);
  h += nota(D.nota, 'ni-inicio', 'Abrir a perna Nielsen completa');
  return h;
}

/* =================== 3. Market Share Scanntech =================== */
function telaScan() {
  const D = T.scanntech; if (!D) return vazioTela('Sem a base da Scanntech.');
  const A = D.a7, gap = ok(A.vr) && ok(A.vm) ? A.vr - A.vm : NaN, nq = D.ufs.filter(u => ok(u.d) && u.d <= -0.3).length;
  const titulo = `Share da Reckitt ${A.d < 0 ? 'cai' : 'sobe'} ${nf1.format(Math.abs(A.d))} pp na Área 7.`, cinza = `${nf1.format(A.y26)}% no ano; mercado ${pc(A.vm)}, Reckitt ${pc(A.vr)}.`;
  let h = topo(3, 'Market Share Scanntech', titulo, cinza, `Sell out das lojas · ${esc(D.corte_txt)}/${String(D.ano).slice(2)} contra ${esc(D.corte_txt)}/${String(D.ant).slice(2)} · DF, GO, MT, MS e TO`,
    fonteDir([`Fonte: <b>Scanntech Painel 2.0</b> (share oficial, ${esc(String(D.fonte.extraido).slice(0, 5))})`, `Redes: ${esc(D.fonte.redes)}`]));
  h += '<div class="kpis">' + kpi('Share Reckitt · Área 7', `${nf1.format(A.y26)}%`, `${pp100Sel(A.d)} contra ${nf1.format(A.y25)}% em ${D.ant}`) +
    kpi('Mercado cresce', pc(A.vm), 'nossas categorias, R$', A.vm >= 0 ? '' : 'down') + kpi('Reckitt cresce', pc(A.vr), 'sell out da Reckitt, R$', cls(A.vr)) +
    kpi('Gap de crescimento', ok(gap) ? ppv(gap) : 'sem dado', ok(gap) ? (gap < 0 ? 'a Reckitt cresce abaixo do mercado' : 'a Reckitt cresce acima do mercado') : '', cls(gap)) +
    kpi('UFs que perdem share', `${nq} de ${D.ufs.length}`, 'queda de 0,3 pp ou mais', nq ? 'down' : 'up') + '</div>';
  const cardMarca = m => `<div class="card cat"><div class="linha"><span class="marca ${mkCls(m.marca)}">${esc(m.nome)}</span><span class="cn">${n0(m.redes)} redes</span></div><div class="cats" title="${esc(m.cats.join(', '))}">${esc(m.cats.join(', '))}</div>
    <div class="sh">${p1(m.sh)} ${ppSel(m.d)}</div><dl><dt>Concorrente</dt><dd>${m.conc ? `${esc(m.conc.nome)} ${p1(m.conc.sh)}` : 'sem dado'}</dd><dt>Venda da marca</dt><dd>${pc(m.vr)}</dd></dl></div>`;
  const anoC = String(D.ano).slice(2), antC = String(D.ant).slice(2);
  const curva = `<div class="card"><div class="cab"><h3>Share da Área 7 mês a mês. <span>${D.ant} em cinza, ${D.ano} em rosa.</span></h3><small>Painel 2.0</small></div>${linhas([A.m25, A.m26], MESES.map(x => x.toLowerCase()), {W: 400, H: 150, fmt: x => nf1.format(x) + '%'})}
    ${D.parcial ? `<p class="nota" style="margin-top:6px">* ${mes(D.parcial.mes)}/${anoC} parcial até ${esc(D.parcial.ate)}, fora do acumulado.</p>` : ''}</div>`;
  const tUF = `<div class="card"><div class="cab"><h3>Share por estado. <span>Acumulado ${esc(D.corte_txt)}.</span></h3><small>Painel 2.0</small></div><div class="tw"><table><thead><tr><th class="l">UF</th><th>${anoC}</th><th>${antC}</th><th>Δ</th><th>Mercado</th><th>Reckitt</th></tr></thead><tbody>` +
    D.ufs.map(u => `<tr><td class="l b">${esc(u.k)}</td><td class="b">${ok(u.y26) ? nf1.format(u.y26) + '%' : ''}</td><td>${ok(u.y25) ? nf1.format(u.y25) + '%' : ''}</td><td>${pp100Sel(u.d)}</td><td>${pc(u.vm)}</td><td class="c-${cls(u.vr) || 'mut'}">${pc(u.vr)}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Área 7</td><td>${nf1.format(A.y26)}%</td><td>${nf1.format(A.y25)}%</td><td>${pp100Sel(A.d)}</td><td>${pc(A.vm)}</td><td>${pc(A.vr)}</td></tr></tbody></table></div></div>`;
  const mxR = Math.max(...D.redes.map(r => r.sh || 0)), ref = D.redes_tot.sh26;
  const tRedes = `<div class="card"><div class="cab"><h3>Share por rede. <span>As maiores pela venda da Reckitt.</span></h3><small>traço = média das redes, ${p1(ref)}</small></div><div class="tw rolo" style="--alto:470px"><table class="lista-rk"><thead><tr><th class="l">Rede</th><th>Share</th><th class="l"></th><th>vs ${antC}</th></tr></thead><tbody>` +
    D.redes.map(r => `<tr><td class="l">${esc(r.nome)} <span class="sm">${esc(r.uf)}</span></td><td class="b">${p1(r.sh)}</td><td class="l" style="width:34%">${barra(r.sh, mxR, false, ref)}</td><td>${ppSel(r.d)}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)"><div><div class="grid g4">${D.marcas.map(cardMarca).join('')}</div><div class="grid g2 mt">${curva}${tUF}</div></div>${tRedes}</div>`;
  h += agir(D.agir);
  h += nota(`${D.nota} Marcas: share nas categorias em que a marca pesa 5% ou mais, nas maiores redes (${esc(D.redes_tot.corte_txt)}).`, 'redes-scan', 'Abrir as Redes Scanntech completas');
  return h;
}

/* =================== 4. Share por cliente (rede da Scanntech) =================== */
let CLI = null;
function telaCliente() {
  const D = T.cliente; if (!D || !D.lista.length) return vazioTela('Sem a base de redes da Scanntech.');
  const primeira = D.lista.findIndex(x => !x.so), i = CLI !== null && D.lista[CLI] ? CLI : Math.max(0, primeira), x = D.lista[i];
  const opc = D.lista.map((r, j) => `<option value="${j}" ${j === i ? 'selected' : ''}>${esc(r.nome)} · ${esc(r.uf)}${r.so ? ' (só Reckitt)' : ''}</option>`).join('');
  const ref = D.ref.sh26, gapR = ok(x.sh) && ok(ref) ? x.sh - ref : NaN;
  const titulo = x.so ? `${esc(x.nome)} (${esc(x.uf)}): venda da Reckitt ${x.vr >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(x.vr)).replace('+', '')}.` : `${esc(x.nome)} (${esc(x.uf)}): share de ${p1(x.sh)}.`;
  const cinza = x.so ? 'A rede só libera a venda da Reckitt: sem share nem mercado.' : `${ok(gapR) ? `${ppAbs(gapR)} ${gapR >= 0 ? 'acima' : 'abaixo'} da média das redes` : ''}; ${x.pos ? `${x.pos}º de ${D.n_rank} no ranking de share` : ''}.`;
  let h = topo(4, 'Share por cliente', titulo, cinza, `Sell out das lojas da rede · ${esc(D.corte_txt)}/26 contra ${esc(D.corte_txt)}/25`,
    `<div class="sel"><label for="cli-sel">Rede</label><select id="cli-sel" data-act="cli">${opc}</select></div><div>Fonte: <b>Scanntech</b> · ${esc(D.fonte ? D.fonte.quando : '')}</div>`);
  h += '<div class="kpis">' + kpi('Share Reckitt na rede', x.so ? 'só Reckitt' : p1(x.sh), x.so ? 'a rede não libera o mercado' : `${ppSel(x.d)} contra 2025`) +
    kpi('Gap contra a média das redes', ok(gapR) ? ppv(gapR) : 'sem dado', `média das redes: ${p1(ref)}`, cls(gapR)) +
    kpi('Mercado na rede', ok(x.vm) ? pc(x.vm) : 'sem dado', 'nossas categorias, mesmos meses') + kpi('Reckitt na rede', pc(x.vr), `${rs(x.r26)} de ${esc(D.corte_txt)}`, cls(x.vr)) +
    kpi('Posição no ranking', x.pos ? `${x.pos}º de ${D.n_rank}` : 'fora', 'share entre as maiores redes') + '</div>';
  const rot12 = MESES.map(m => m.toLowerCase());
  const curva = x.so
    ? `<div class="card"><div class="cab"><h3>Venda da Reckitt mês a mês. <span>2025 em cinza, 2026 em rosa.</span></h3><small>R$</small></div>${linhas([x.rk25, x.rk26], rot12, {W: 560, H: 230, fmt: v => rsCurto(v)})}</div>`
    : `<div class="card"><div class="cab"><h3>Share da Reckitt mês a mês. <span>2025 em cinza, 2026 em rosa.</span></h3><small>média das redes: ${p1(ref)}</small></div>${linhas([x.m25, x.m26], rot12, {W: 560, H: 230})}</div>`;
  const cats = x.cats.length ? `<div class="card"><div class="cab"><h3>Categoria a categoria. <span>Share da Reckitt e o principal concorrente na rede.</span></h3><small>SKUs mais vendidos da rede</small></div><div class="tw"><table><thead><tr><th class="l">Categoria</th><th class="l">Marca</th><th>Reckitt</th><th>Share</th><th>Δ share</th><th>Mercado</th><th class="l">Principal concorrente</th></tr></thead><tbody>` +
    x.cats.map(c => `<tr><td class="l">${esc(c.cat)}</td><td class="l b ${mkCls(c.marca)}">${esc(c.marca)}</td><td>${rs(c.r26)}</td><td class="b">${x.so ? '' : p1(c.sh)}</td><td>${x.so ? '' : ppSel(c.d)}</td><td>${x.so ? vSel(c.vr) : pc(c.vm)}</td><td class="l">${c.conc ? `${esc(c.conc.nome)} <span class="sm">${p1(c.conc.sh)}</span>` : ''}</td></tr>`).join('') + '</tbody></table></div></div>'
    : '<div class="card vazio">A abertura por categoria só existe para as maiores redes.</div>';
  h += `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.25fr)">${curva}${cats}</div>`;
  // onde agir, montado aqui com os números da rede escolhida
  const it = [];
  if (!x.so && ok(x.d)) it.push({t: `Share ${x.d >= 0 ? 'sobe' : 'cai'} ${ppAbs(x.d)} contra 2025`, d: `o mercado da rede ${x.vm >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(x.vm)).replace('+', '')} e a Reckitt ${x.vr >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(x.vr)).replace('+', '')}.`});
  const pior = x.cats.filter(c => ok(c.d)).sort((a, b) => a.d - b.d)[0];
  if (pior && pior.d < 0) it.push({t: `${pior.cat}: ${ppv(pior.d)}`, d: `a categoria que mais perde share na rede${pior.conc ? `; ${pior.conc.nome} tem ${p1(pior.conc.sh)}` : ''}.`});
  const maior = x.cats[0]; if (maior) it.push({t: `${maior.cat} é a maior categoria da Reckitt na rede`, d: `${rs(maior.r26)} no ano${ok(maior.sh) && !x.so ? `, com ${p1(maior.sh)} de share` : ''}: é onde a execução mais pesa.`});
  if (x.col) it.push({t: 'A rede compra dos distribuidores no Colecta', d: 'a abertura da compra por distribuidor está nas Redes Scanntech da Governança completa.'});
  h += agir(it, 'Os pontos da rede escolhida, a partir dos números.');
  h += nota(D.nota, 'redes-scan', 'Abrir a rede nas Redes Scanntech');
  return h;
}

/* =================== 5. Vendas · Sell In =================== */
function telaVendas() {
  const D = T.vendas; if (!D) return vazioTela('Sem a base do Sell In.');
  const R = D.reg, mOM = D.mes_om;
  const titulo = `${rs(R.rc_nr)} do Q4 em mãos: ${p1(R.pct_nr)} do AR.`, cinza = `Faltam ${rs(Math.max(0, R.ar_nr - R.rc_nr))} para fechar o trimestre.`;
  let h = topo(5, 'Vendas · Sell In', titulo, cinza, `Regional CTO em Hygiene · Q4/2026 (out a dez) · real + carteira até ${esc(D.om_data)} · gráficos: 2025 completo contra 2026`,
    fonteDir([`Fonte: <b>P&L Restated</b> (jan a ${mes(D.ult)}) e <b>Order Management</b>`, `Pedidos de ${esc(D.om_data)}`]));
  h += '<div class="kpis">' + kpi('Meta · cx', cx(R.ar_cx), 'AR do Q4') + kpi('Real + cart · cx', cx(R.rc_cx), `${mes(mOM)}* em curso`) + kpi('% meta · cx', p1(R.pct_cx), `ritmo: ${p1(R.ritmo)}`, clsMeta(R.pct_cx)) +
    kpi('Meta · NR', rs(R.ar_nr), `${vSel(R.ar_nr / R.q425_nr - 1)} sobre o Q4/25`) + kpi('Real + cart · NR', rs(R.rc_nr), 'NR estimado no mês em curso') + kpi('% meta · NR', p1(R.pct_nr), `ritmo: ${p1(R.ritmo)}`, clsMeta(R.pct_nr)) + '</div>';
  const ycx = D.ytd_cx, ynr = D.ytd_nr;
  const leg = `<div class="leg"><span><i class="c25"></i>2025</span><span><i class="c26"></i>2026</span><span><i class="cm"></i>meta (AR)</span></div>`;
  const gCx = `<div class="card"><div class="cab"><h3>Caixas mês a mês. <span>Jan a ${mes(D.ult)}: ${cx(ycx[0])} em 2026, ${vSel(ycx[0] / ycx[1] - 1)} sobre 2025.</span></h3>${leg}</div>${barras12(D.cx, milC, 168, 820)}<p class="nota" style="margin-top:4px">Em mil caixas. ${mes(mOM)}* = faturado + carteira até ${esc(D.om_data)}.</p></div>`;
  const gNr = `<div class="card"><div class="cab"><h3>NR mês a mês. <span>Jan a ${mes(D.ult)}: ${rs(ynr[0])} em 2026, ${vSel(ynr[0] / ynr[1] - 1)} sobre 2025.</span></h3>${leg}</div>${barras12(D.nr, rsCurto, 168, 820)}<p class="nota" style="margin-top:4px">R$. ${mes(mOM)}* com o NR estimado pelo NR por caixa do segmento.</p></div>`;
  const P = D.pos, gPos = `<div class="card"><div class="cab"><h3>Positivação. <span>Sell out do indireto: ${n0(P.ytd26)} PDVs por mês, ${vSel(P.ytd26 / P.ytd25 - 1)} sobre 2025.</span></h3></div>${barras12(P.meses.map(z => ({m: z.m, r25: z.p25, r26: z.p26, tipo: z.p26 == null ? 'futuro' : 'fechado', parcial: z.parcial})), x => nf1.format(x / 1e3), 120, 480)}<p class="nota" style="margin-top:4px">Em mil PDVs com compra (régua do site).${P.parcial_ate ? ` * parcial até ${esc(P.parcial_ate)}.` : ''}</p></div>`;
  const tM = `<div class="card"><div class="cab"><h3>Metas por marca. <span>Q4 em Hygiene.</span></h3><small>caixas</small></div><div class="tw"><table><thead><tr><th class="l">Marca</th><th>Meta</th><th>Real + cart</th><th>% cx</th><th>% NR</th><th>vs Q4/25</th></tr></thead><tbody>` +
    D.marcas.map(m => `<tr><td class="l b ${mkCls(m.marca)}">${esc(m.marca.charAt(0) + m.marca.slice(1).toLowerCase())}</td><td>${cx(m.ar_cx)}</td><td>${cx(m.rc_cx)}</td><td class="b c-${clsMeta(m.pct_cx) || 'mut'}">${p1(m.pct_cx)}</td><td class="c-${clsMeta(m.pct_nr) || 'mut'}">${p1(m.pct_nr)}</td><td>${pc(m.ar_vs25)}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Total</td><td>${cx(R.ar_cx)}</td><td>${cx(R.rc_cx)}</td><td>${p1(R.pct_cx)}</td><td>${p1(R.pct_nr)}</td><td>${pc(R.ar_cx / R.q425_cx - 1)}</td></tr></tbody></table></div></div>`;
  const mxC = Math.max(...D.canais.map(c => c.ar_nr));
  const tC = `<div class="card"><div class="cab"><h3>NR por canal. <span>Canal do cliente no P&L.</span></h3><small>R$ · Q4</small></div><div class="tw"><table><thead><tr><th class="l">Canal</th><th>Meta</th><th>Real + cart</th><th>%</th><th>vs Q4/25</th></tr></thead><tbody>` +
    D.canais.map(c => `<tr><td class="l b">${esc(c.nome)}</td><td>${rs(c.ar_nr)}</td><td>${rs(c.rc_nr)}</td><td class="b c-${clsMeta(c.pct) || 'mut'}">${p1(c.pct)}</td><td>${pc(c.ar_vs25)}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)"><div class="grid" style="align-content:start">${gCx}${gNr}</div><div class="grid" style="align-content:start">${tM}${tC}${gPos}</div></div>`;
  h += agir(D.agir);
  h += nota(D.nota, 'si-geral', 'Abrir o Sell In completo');
  return h;
}

/* =================== 6. MSL · Execução =================== */
function telaMSL() {
  const D = T.msl; if (!D || (!D.direto && !D.indireto)) return vazioTela('Sem as bases de MSL.');
  const d = D.direto, i = D.indireto;
  const titulo = `MSL de ${d ? p1(d.m) : 'sem dado'} no direto e ${i ? p1(i.m) : 'sem dado'} no indireto.`;
  const cinza = `${d ? `Direto ${ppv(d.d)}` : ''}${d && i ? ', ' : ''}${i ? `indireto ${ppv(i.d)}` : ''} contra o ano anterior.`;
  let h = topo(6, 'MSL · Execução', titulo, cinza, 'MSL sempre em janela de 3 meses · direto: lojas das contas de atendimento direto · indireto: lista oficial de lojas do canal indireto',
    fonteDir([d && d.fonte ? `Direto: <b>${esc(d.fonte.nome)}</b> · ${esc(d.fonte.quando)}` : '', i && i.fonte ? `Indireto: <b>${esc(i.fonte.nome)}</b> · ${esc(i.fonte.quando)}` : '']));
  h += '<div class="kpis">' + (d ? kpi('MSL Direto', p1(d.m), `${ppSel(d.d)} contra ${esc(d.ant)} · ${esc(d.janela)}`) + kpi('Lojas acima de 65% · direto', `${n0(d.acima)} de ${n0(d.n)}`, `${p1(d.pa)} das lojas auditadas`, d.pa >= 0.8 ? 'up' : d.pa >= 0.6 ? 'warn' : 'down') : '') +
    (i ? kpi('MSL Indireto', p1(i.m), `${ppSel(i.d)} contra ${esc(i.ant)} · compras de ${esc(i.jan)}`) + kpi('Lojas zeradas · indireto', `${n0(i.zero)} de ${n0(i.n)}`, `nenhum SKU exigido comprado${ok(i.zerob) ? ` · ${n0(i.zerob)} um ano antes` : ''}`, i.zero / i.n > 0.1 ? 'down' : '') : '') + '</div>';
  const mxC = 1;
  const barrasCli = (L, rot, n) => `<div class="card"><div class="cab"><h3>${rot}</h3><small>${n}</small></div><div class="tw"><table class="lista-rk"><tbody>` +
    L.map(c => `<tr><td class="l">${esc(c.nome)}</td><td class="l" style="width:42%">${barra(c.m, mxC, false)}</td><td class="b">${p1(c.m)}</td><td>${ppSel(c.d)}</td></tr>`).join('') + '</tbody></table></div></div>';
  const curva = `<div class="card"><div class="cab"><h3>MSL mês a mês. <span>Direto em grafite, indireto em rosa.</span></h3></div>${(() => {
    const ref = d ? d.serie : i.serie, rot = ref.map(z => z.rot), mapa = L => rot.map(r => { const z = (L || []).find(y => y.rot === r); return z ? z.m : null; });
    return linhas([mapa(d && d.serie), mapa(i && i.serie)], rot.map((r, j) => (j % 3 === 0 || j === rot.length - 1 ? r : '')), {W: 400, H: 190, cores: ['#1D1D1F', '#FF007F'], larg: [2.5, 2.5]}); })()}
    <p class="nota" style="margin-top:4px">Direto: janela de 3 meses terminando no mês. Indireto: o mês já cobre as compras de 3 meses. * mês parcial.</p></div>`;
  const marcas = (() => { const nomes = [...new Set([...(d ? d.marcas : []), ...(i ? i.marcas : [])].map(m => m.nome))];
    return `<div class="card"><div class="cab"><h3>MSL por marca. <span>Direto e indireto.</span></h3><small>pp contra o ano anterior</small></div><div class="tw"><table><thead><tr><th class="l">Marca</th><th>Direto</th><th></th><th>Indireto</th><th></th></tr></thead><tbody>` +
      nomes.map(n => { const a = d && d.marcas.find(m => m.nome === n), b = i && i.marcas.find(m => m.nome === n); return `<tr><td class="l b ${mkCls(n)}">${esc(n)}</td><td class="b">${a ? p1(a.m) : ''}</td><td>${a ? ppSel(a.d) : ''}</td><td class="b">${b ? p1(b.m) : ''}</td><td>${b ? ppSel(b.d) : ''}</td></tr>`; }).join('') + '</tbody></table></div></div>'; })();
  const faltas = `<div class="card"><div class="cab"><h3>Maiores faltas. <span>Veja, Vanish, Harpic e Finish.</span></h3><small>lojas sem o SKU</small></div><div class="tw"><table class="wrap"><thead><tr><th class="l">SKU</th><th class="l">Canal</th><th>Lojas</th><th>% das lojas</th></tr></thead><tbody>` +
    [...(d ? d.skus.slice(0, 5).map(s => ({...s, c: 'Direto'})) : []), ...(i ? i.skus.slice(0, 5).map(s => ({...s, c: 'Indireto'})) : [])].map(s => `<tr><td class="l"><span class="${mkCls(s.marca)}">${esc(s.nome)}</span></td><td class="l">${s.c}</td><td class="b">${n0(s.falta)}</td><td>${p1(s.falta / s.aud)}</td></tr>`).join('') +
    `</tbody></table></div><p class="nota" style="margin-top:6px">Fora das 4 marcas: ${d ? `${n0(d.hn)} SKUs de H&N faltam em 90% ou mais das lojas do direto` : ''}${d && i ? ' e ' : ''}${i ? `${n0(i.hn)} no indireto` : ''}.</p></div>`;
  const lojas = d ? `<div class="card"><div class="cab"><h3>Lojas críticas · direto. <span>Menor MSL na janela.</span></h3></div><div class="tw"><table class="wrap"><tbody>` +
    d.lojas.map(l => `<tr><td class="l">${esc(l.nome)}</td><td class="b c-${l.m > 0.65 ? 'up' : l.m >= 0.5 ? 'warn' : 'down'}">${p1(l.m)}</td></tr>`).join('') + '</tbody></table></div></div>' : '';
  const distZ = i ? `<div class="card"><div class="cab"><h3>Distribuidores · indireto. <span>MSL médio das lojas e lojas zeradas.</span></h3><small>${esc(i.mes)}</small></div><div class="tw"><table><thead><tr><th class="l">Distribuidor</th><th>MSL</th><th></th><th>Lojas</th><th>Zeradas</th></tr></thead><tbody>` +
    i.dist.map(c => `<tr><td class="l b">${esc(c.nome)}</td><td class="b">${p1(c.m)}</td><td>${ppSel(c.d)}</td><td>${n0(c.nl)}</td><td>${n0(c.zero)}</td></tr>`).join('') + '</tbody></table></div></div>' : '';
  h += `<div class="grid g3">${d ? barrasCli(d.clientes, 'MSL por cliente · direto.', esc(d.janela)) : ''}${distZ}${curva}</div><div class="grid g3 mt">${marcas}${faltas}${lojas}</div>`;
  h += agir(D.agir);
  h += `<p class="nota">${esc(D.nota)} ${d ? esc(d.regra) : ''} ${i ? esc(i.regra) : ''} ${aprofundar('ex-inicio', 'Abrir o MSL Direto')} · ${aprofundar('mi-inicio', 'Abrir o MSL Indireto')}</p>`;
  return h;
}

/* =================== 7. Marcas e Categorias =================== */
function telaMarcas() {
  const D = T.marcas; if (!D) return vazioTela('Sem a base do Sell In.');
  const ds = D.destaques;
  const titulo = ds.sobe && ds.cai ? `${esc(ds.sobe.nome)} ${ds.sobe.v >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(ds.sobe.v)).replace('+', '')} e ${esc(ds.cai.nome)} ${ds.cai.v >= 0 ? 'cresce' : 'cai'} ${pc(Math.abs(ds.cai.v)).replace('+', '')} no ano.` : 'Marcas e categorias.';
  let h = topo(7, 'Marcas e Categorias', titulo, `NR de ${esc(D.corte_txt)}/26 contra 2025.`, `Sell in das 3 BUs · ${D.marcas.length} marcas e ${D.marcas.reduce((s, m) => s + m.segs.length, 0)} segmentos · Q4 com pedidos até ${esc(D.om_data)}`,
    fonteDir([`Fonte: <b>P&L Restated</b> e <b>Order Management</b>`, `Pedidos de ${esc(D.om_data)}`]));
  h += '<div class="kpis">' + (ds.sobe ? kpi('Marca que mais cresce', esc(ds.sobe.nome), `${vSel(ds.sobe.v)} de NR no ano`) : '') + (ds.cai ? kpi('Marca que mais cai', esc(ds.cai.nome), `${vSel(ds.cai.v)} de NR no ano`) : '') +
    (ds.seg_cai ? kpi('Segmento que mais cai', esc(ds.seg_cai.nome), `${vSel(ds.seg_cai.v)} · acima de R$ 500 mil`) : '') +
    kpi('Peso da maior marca', esc(D.marcas[0].nome), `${p1(D.marcas[0].peso)} do NR do ano`) + '</div>';
  const mx = Math.max(...D.marcas.map(m => m.peso || 0));
  const rep = `<div class="card"><div class="cab"><h3>Representatividade. <span>Peso de cada marca no NR do ano.</span></h3></div><div class="tw"><table class="lista-rk"><tbody>` +
    D.marcas.map(m => `<tr><td class="l b ${mkCls(m.marca)}">${esc(m.nome)}</td><td class="l" style="width:46%">${barra(m.peso, mx, false)}</td><td class="b">${p1(m.peso)}</td><td>${vSel(m.var_nr)}</td></tr>`).join('') + '</tbody></table></div></div>';
  const q4 = `<div class="card"><div class="cab"><h3>Q4 por marca. <span>Real + carteira contra o AR, em caixas.</span></h3><small>traço = meta</small></div><div class="tw"><table class="lista-rk"><tbody>` +
    D.marcas.filter(m => m.ar_cx > 0).map(m => `<tr><td class="l b ${mkCls(m.marca)}">${esc(m.nome)}</td><td class="l" style="width:40%">${barra(m.pct_cx, 1, true, 1)}</td><td class="b c-${clsMeta(m.pct_cx) || 'mut'}">${p1(m.pct_cx)}</td><td><span class="sm">${cx(m.rc_cx)} de ${cx(m.ar_cx)}</span></td></tr>`).join('') + '</tbody></table></div></div>';
  const tab = `<div class="card"><div class="cab"><h3>Categoria por marca. <span>NR e caixas do ano e o Q4.</span></h3><small>peso e ranking sobre o total</small></div><div class="tw rolo" style="--alto:520px"><table><thead><tr><th class="l">Marca · segmento</th><th>NR ${esc(D.corte_txt)}</th><th>vs 25 NR</th><th>vs 25 cx</th><th>Peso</th><th>Meta Q4 cx</th><th>Real + cart</th><th>%</th></tr></thead><tbody>` +
    D.marcas.map(m => `<tr class="grupo"><td class="l ${mkCls(m.marca)}">${esc(m.nome)} <span class="tag">${m.rank}º</span></td><td>${rs(m.y26)}</td><td>${vSel(m.var_nr)}</td><td>${pc(m.var_cx)}</td><td>${p1(m.peso)}</td><td>${cx(m.ar_cx)}</td><td>${cx(m.rc_cx)}</td><td class="c-${clsMeta(m.pct_cx) || 'mut'}">${p1(m.pct_cx)}</td></tr>` +
      m.segs.filter(s => s.y26 > 0 || s.ar_cx > 0).map(s => `<tr><td class="l" style="padding-left:20px">${esc(s.nome)}</td><td>${rs(s.y26)}</td><td>${vSel(s.var_nr)}</td><td>${pc(s.var_cx)}</td><td>${p1(s.peso)}</td><td>${s.ar_cx ? cx(s.ar_cx) : ''}</td><td>${s.ar_cx || s.rc_cx ? cx(s.rc_cx) : ''}</td><td>${s.ar_cx ? p1(s.pct_cx) : ''}</td></tr>`).join('')).join('') +
    '</tbody></table></div></div>';
  h += `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.7fr)"><div class="grid" style="align-content:start">${rep}${q4}</div>${tab}</div>`;
  h += agir(D.agir);
  h += nota(D.nota, 'si-diretor', 'Abrir a Visão do Diretor');
  return h;
}

/* =================== 8. Fórmula Reckitt =================== */
function telaFormula() {
  const D = T.formula || {};
  let h = topo(8, 'Fórmula Reckitt', 'O campeonato dos distribuidores entra na próxima versão.', 'Falta a base do programa.', 'Programa Fórmula Reckitt 2026 · canal indireto', fixo());
  h += `<div class="card"><h3>O que falta. <span>${esc(D.texto || '')}</span></h3><p class="nota" style="margin-top:10px">Fonte prevista: ${esc(D.fonte || '')}</p></div>`;
  h += `<div class="pend mt">${[['Faturamento', 'Meta e realizado do distribuidor no trimestre, mês a mês.'], ['Positivação (CLC)', 'Lojas com compra no mês, como no Tracking.'], ['Segmentos foco', 'Lojas com compra em cada segmento foco do trimestre.'], ['MSL', 'Média dos 3 meses do programa, a mesma conta já validada em outubro.']]
    .map(([t, d], j) => `<div class="card"><p class="eyebrow">${String(j + 1).padStart(2, '0')}</p><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>`;
  return h;
}

/* =================== 9. RV do time =================== */
function telaRV() {
  const D = T.rv; if (!D) return vazioTela('Sem a base do Sell In.');
  const r = D.rot || {}, acima = D.ex.filter(x => ok(x.pct_mes) && x.pct_mes >= D.piso).length;
  let h = topo(9, 'RV do time', `${acima} de ${D.ex.length} carteiras já passam do ${esc((r.piso || '').toLowerCase())} em ${esc(D.nome_mes)}.`, `Pedido em mãos contra o AR do mês, até ${esc(D.om_data)}.`, 'Metas e atingimento do Q4 · sem salário nem valor de RV',
    fonteDir([`Fonte: <b>P&L Restated</b> e <b>Order Management</b>`, `Pedidos de ${esc(D.om_data)}`]));
  const fx = p => (!ok(p) ? '' : p >= 1 ? 'up' : p >= D.piso ? 'warn' : 'down');
  h += `<div class="card"><div class="cab"><h3>Executivo a executivo. <span>${esc(D.nome_mes.charAt(0).toUpperCase() + D.nome_mes.slice(1))} e o Q4.</span></h3><small>NR em R$</small></div><div class="tw"><table><thead><tr><th class="l">Executivo</th><th>AR do mês</th><th>Pedido</th><th>% do mês</th><th class="l">${esc(r.faixa_col || '')}</th><th>${esc(r.falta_piso || '')}</th><th>${esc(r.falta_100 || '')}</th><th>AR do Q4</th><th>Real + cart</th><th>% do Q4</th><th>${esc(r.alvo || '')}: falta</th></tr></thead><tbody>` +
    D.ex.map(x => `<tr><td class="l b">${esc(x.nome)}${x.vaga ? ' <span class="tag">vaga</span>' : ''}</td><td>${rs(x.ar_mes)}</td><td>${rs(x.ped_mes)}</td><td class="b c-${fx(x.pct_mes) || 'mut'}">${p1(x.pct_mes)}</td><td class="l">${selo(esc(x.faixa_mes), fx(x.pct_mes))}</td><td>${x.falta_piso > 0.5 ? rs(x.falta_piso) : selo('ok', 'up')}</td><td>${x.falta_100 > 0.5 ? rs(x.falta_100) : selo('ok', 'up')}</td>
      <td>${rs(x.ar_q4)}</td><td>${rs(x.rc_q4)}</td><td class="b c-${clsMeta(x.pct_q4) || 'mut'}">${p1(x.pct_q4)}</td><td>${x.falta_alvo > 0.5 ? rs(x.falta_alvo) : selo('ok', 'up')}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<div class="card mt"><h3>A régua. <span>As regras do Q4, como no site principal.</span></h3><ol style="margin:10px 0 0;padding-left:20px;font-size:12.5px;line-height:1.55">${(D.regras || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol><p class="nota">${esc(D.nota)}</p></div>`;
  h += nota('', 'si-rv', 'Abrir o RV completo');
  return h;
}

/* ---------- navegação ---------- */
const TELAS = [
  ['time', 'Time CTO', 'fixo', telaTime], ['nielsen', 'Market Share Nielsen', 'fixo', telaNielsen], ['scanntech', 'Market Share Scanntech', 'fixo', telaScan],
  ['cliente', 'Share por Cliente', 'Scanntech', telaCliente], ['vendas', 'Vendas', 'Sell in', telaVendas], ['msl', 'MSL', 'Execução', telaMSL],
  ['marcas', 'Marcas e Categorias', 'Mix', telaMarcas], ['formula', 'Fórmula Reckitt', 'Distribuidores', telaFormula], ['rv', 'RV do time', 'Q4', telaRV]];
const atual = () => { const k = location.hash.slice(1).split('&')[0]; return TELAS.some(t => t[0] === k) ? k : 'time'; };
function lado(k) {
  const f = F.fontes || {};
  return `<div class="marca"><img src="assets/reckitt_logo.png" alt="Reckitt"><p class="eyebrow">Governança CTO</p><h1>Visão do Time. <span>Uma tela por relatório.</span></h1><p>Regional Centro-Oeste, Tocantins e Pará</p></div>
    <nav class="rel" aria-label="Relatórios"><p class="eyebrow">Relatórios</p>${TELAS.map(([id, nome, tag], j) => `${j === 3 || j === 7 ? '<div class="sep"></div>' : ''}<a href="#${id}" class="${id === k ? 'on' : ''}"><span class="n">${j + 1}</span><span class="t">${nome}</span><span class="k">${tag}</span></a>`).join('')}</nav>
    <div class="rodape">Foto de ${esc(F.gerado || '')}<br>Base da Governança de ${esc(f.site_principal || F.base_gerada || '')}<a href="${PRINCIPAL}" target="_blank" rel="noopener">Abrir a Governança CTO completa ›</a><button type="button" data-act="sair">Sair deste aparelho</button></div>`;
}
function render() {
  const k = atual(), t = TELAS.find(x => x[0] === k);
  document.getElementById('lado').innerHTML = lado(k);
  let h; try { h = t[3](); } catch (e) { console.error(e); h = vazioTela('Esta tela não abriu com a foto atual. Avise o gerente.'); }
  const tela = document.getElementById('tela'); tela.innerHTML = h; tela.scrollTop = 0; window.scrollTo(0, 0);
  document.title = `${t[1]} · Visão do Time`;
}
document.addEventListener('change', e => { if (e.target.matches('[data-act="cli"]')) { CLI = +e.target.value; render(); } });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act="sair"]'); if (!b) return;
  try { localStorage.removeItem('governanca-cto-time-chave'); } catch (x) { /* nada guardado */ }
  location.reload();
});
window.addEventListener('hashchange', render);
render();
})();
