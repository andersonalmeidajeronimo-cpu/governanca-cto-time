/* Tela de senha da Governança CTO · Visão do Time (a mesma senha e o mesmo cofre da Governança CTO; a memória do aparelho é própria deste site). Os dados chegam criptografados (data/data.enc.js, AES-256-GCM);
   a senha deriva a chave no próprio navegador (PBKDF2-SHA256) e nada sai do aparelho.
   "Lembrar neste aparelho" guarda só a chave derivada, nunca a senha. */
(() => {
const C = window.FOTO_COFRE, GUARDA = 'governanca-cto-time-chave';
const VER = ((document.currentScript && document.currentScript.src) || '').split('?v=')[1] || '';   // mesma versão do index para o app.js
const el = id => document.getElementById(id);
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function abrir(chave) {
  const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b64(C.iv)}, chave, b64(C.ct));
  const txt = await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  window.FOTO = JSON.parse(txt);
}
async function derivar(senha) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt: b64(C.sal), iterations: C.iter, hash: 'SHA-256'},
                                 base, {name: 'AES-GCM', length: 256}, true, ['decrypt']);
}
function iniciar() {
  el('cofre').remove();
  document.body.classList.remove('trancado');
  const s = document.createElement('script'); s.src = 'assets/app.js' + (VER && VER !== '__V__' ? '?v=' + VER : ''); document.body.appendChild(s);
}
function mostrar(msg) {
  el('cofre').hidden = false;
  if (msg) el('cofre-msg').textContent = msg;
  el('senha').focus();
}

async function comecar() {
  if (!C || !window.crypto || !crypto.subtle || typeof DecompressionStream === 'undefined') {
    return mostrar('Este navegador não abre o site. Use Chrome, Safari ou Edge atualizados.');
  }
  let guardada = null;
  try { guardada = localStorage.getItem(GUARDA); } catch (e) { guardada = null; }
  if (guardada) {
    try {
      const chave = await crypto.subtle.importKey('jwk', JSON.parse(guardada), {name: 'AES-GCM'}, false, ['decrypt']);
      await abrir(chave); return iniciar();
    } catch (e) {
      try { localStorage.removeItem(GUARDA); } catch (x) { /* nada guardado */ }
      return mostrar('A senha mudou. Digite a senha nova.');
    }
  }
  mostrar('');
}

el('cofre-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = el('entrar'), senha = el('senha').value;
  if (!senha) return mostrar('Digite a senha.');
  btn.disabled = true; btn.textContent = 'Abrindo…'; el('cofre-msg').textContent = '';
  try {
    const chave = await derivar(senha);
    await abrir(chave);
    if (el('lembrar').checked) {
      try { localStorage.setItem(GUARDA, JSON.stringify(await crypto.subtle.exportKey('jwk', chave))); } catch (e) { /* aparelho sem memória: pede a senha da próxima vez */ }
    }
    iniciar();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Entrar';
    el('senha').select();
    mostrar('Senha incorreta. Confira a senha com o seu gerente.');
  }
});
comecar();
})();
