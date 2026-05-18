// ══════════════════════════════════════════════════
//   Infinite Craft — Auto-Craft UI
//   Sans DB externe — mémoire localStorage uniquement
//   Colle sur : neal.fun/infinite-craft
// ══════════════════════════════════════════════════

(async () => {

  const DELAY_AFTER_DROP = 400;
  const DELAY_DRAG_STEP  = 14;
  const DROP = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.45 };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── Mémoire localStorage ─────────────────────────
  const LS_KEY = "ic_tried_combos";
  const tried  = new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"));
  console.log(`%c💾 ${tried.size} combos déjà en mémoire (skippées)`, "color:#a78bfa;font-weight:bold");

  function saveTried() {
    localStorage.setItem(LS_KEY, JSON.stringify([...tried]));
  }

  // ── Scan sidebar ──────────────────────────────────
  function scanElements() {
    const items = [];
    const seen  = new Set();
    for (const el of document.querySelectorAll("div.item")) {
      const emoji = el.querySelector("span.item-emoji")?.innerText?.trim() ?? "";
      const name  = el.innerText?.trim().replace(emoji, "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) continue;
      items.push({ el, name, emoji });
    }
    return items;
  }

  // ── Drag & Drop ───────────────────────────────────
  function fireEv(type, target, x, y) {
    const Cls = type.startsWith("pointer") ? PointerEvent : MouseEvent;
    target.dispatchEvent(new Cls(type, {
      bubbles: true, cancelable: true,
      clientX: x, clientY: y,
      buttons: type.endsWith("up") ? 0 : 1,
      pointerId: 1, isPrimary: true,
    }));
  }

  async function dragTo(el, destX, destY) {
    const r     = el.getBoundingClientRect();
    const fromX = r.left + r.width  / 2;
    const fromY = r.top  + r.height / 2;

    fireEv("pointerdown", el, fromX, fromY);
    fireEv("mousedown",   el, fromX, fromY);
    await sleep(DELAY_DRAG_STEP * 2);

    const steps = 15;
    for (let i = 1; i <= steps; i++) {
      const x = fromX + (destX - fromX) * (i / steps);
      const y = fromY + (destY - fromY) * (i / steps);
      const under = document.elementFromPoint(x, y) ?? el;
      fireEv("pointermove", under, x, y);
      fireEv("mousemove",   under, x, y);
      await sleep(DELAY_DRAG_STEP);
    }

    const dest = document.elementFromPoint(destX, destY) ?? document.body;
    fireEv("pointerup", dest, destX, destY);
    fireEv("mouseup",   dest, destX, destY);
    await sleep(DELAY_DRAG_STEP);
  }

  // ── HUD ───────────────────────────────────────────
  document.getElementById("ic-hud")?.remove();
  const hud = document.createElement("div");
  hud.id = "ic-hud";
  Object.assign(hud.style, {
    position: "fixed", top: "12px", right: "12px", zIndex: "99999",
    background: "rgba(10,10,20,0.93)", color: "#fff",
    fontFamily: "monospace", fontSize: "13px",
    padding: "14px 18px", borderRadius: "12px",
    border: "1px solid #444", minWidth: "250px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
    backdropFilter: "blur(10px)", lineHeight: "1.9",
  });
  hud.innerHTML = `
    <div style="font-weight:bold;font-size:15px;margin-bottom:6px;">🤖 Auto-Craft</div>
    <div>Éléments : <b id="hc-total">—</b></div>
    <div>Skippées (mémoire) : <b id="hc-skip">0</b></div>
    <div>Testées : <b id="hc-combos">0</b></div>
    <div id="hc-last" style="color:#9ca3af;font-size:11px;margin-top:4px;">Démarrage...</div>
    <div style="margin-top:10px;display:flex;gap:8px;">
      <button id="hc-stop" style="background:#ef4444;border:none;color:#fff;
        padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">⏹ Stop</button>
      <button id="hc-reset" style="background:#374151;border:none;color:#fff;
        padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️ Reset mémoire</button>
    </div>
  `;
  document.body.appendChild(hud);

  let stopped = false;
  document.getElementById("hc-stop").onclick = () => {
    stopped = true;
    document.getElementById("hc-last").textContent = "Arrêté.";
  };
  document.getElementById("hc-reset").onclick = () => {
    localStorage.removeItem(LS_KEY);
    alert("Mémoire effacée. Relance le script pour tout retester.");
  };

  // ── Init ──────────────────────────────────────────
  let items = scanElements();
  if (items.length === 0) {
    console.error(" Aucun élément trouvé (div.item). Es-tu bien sur neal.fun/infinite-craft ?");
    hud.remove(); return;
  }

  console.log(`%c ${items.length} éléments dans ta partie :`, "color:#60a5fa;font-weight:bold");
  items.forEach(i => console.log(`  ${i.emoji} ${i.name}`));
  document.getElementById("hc-total").textContent = items.length;

  // ── Construction de la queue ──────────────────────
  const queue = [];
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i; j < items.length; j++) {
      const key = [items[i].name, items[j].name].sort().join("|");
      if (tried.has(key)) { skipped++; continue; }
      queue.push({ a: items[i].name, b: items[j].name, key });
    }
  }

  document.getElementById("hc-skip").textContent = skipped;
  console.log(`%c ${queue.length} combos à tester (${skipped} skippées)`, "color:#4ade80;font-weight:bold");

  // ── BFS ───────────────────────────────────────────
  let combos = 0;

  while (queue.length > 0 && !stopped) {
    const { a: nameA, b: nameB, key } = queue.shift();
    if (tried.has(key)) { skipped++; continue; }

    tried.add(key);
    saveTried();

    const fresh = scanElements();
    const elA   = fresh.find(x => x.name === nameA);
    const elB   = fresh.find(x => x.name === nameB);
    if (!elA || !elB) continue;

    combos++;
    document.getElementById("hc-combos").textContent = combos;
    document.getElementById("hc-skip").textContent   = skipped;
    document.getElementById("hc-last").textContent   = `${elA.emoji} ${nameA} + ${elB.emoji} ${nameB}`;

    // Drag A → canvas, puis B → sur A
    await dragTo(elA.el, DROP.x, DROP.y);
    await sleep(DELAY_AFTER_DROP);

    const elB2 = scanElements().find(x => x.name === nameB)?.el;
    if (elB2) {
      await dragTo(elB2, DROP.x, DROP.y);
      await sleep(DELAY_AFTER_DROP);
    }

    // Détecte les nouveaux éléments
    const newItems = scanElements().filter(x => !items.some(i => i.name === x.name));
    for (const ni of newItems) {
      console.log(`%c ${ni.emoji} ${ni.name}  ←  ${nameA} + ${nameB}`, "color:#4ade80;font-weight:bold");
      for (const old of items) {
        const nkey = [old.name, ni.name].sort().join("|");
        if (!tried.has(nkey)) queue.push({ a: old.name, b: ni.name, key: nkey });
        else skipped++;
      }
      items.push(ni);
      document.getElementById("hc-total").textContent = items.length;
    }
  }

  document.getElementById("hc-last").textContent = `Terminé — ${combos} testées, ${skipped} skippées`;
  console.log(`%c Fini ! ${combos} testées, ${skipped} skippées.`, "color:#4ade80;font-weight:bold");

})();
