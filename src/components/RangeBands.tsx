import React, { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { ready, NS } from "../obr";
import { logAction } from "./ChatLog";

// Defaults (you can tweak in UI)
const DEFAULT_CELL_PX = 100; // pixels per 5 ft square (fallback)
const FEET_PER_CELL = 5;

const PRESETS = [
  { label: "Melee", feet: 5 },
  { label: "Close", feet: 30 },
  { label: "Far", feet: 60 },
  { label: "Very Far", feet: 120 }
] as const;

export function RangeBands() {
  const [cellPx, setCellPx] = useState<number>(DEFAULT_CELL_PX);
  const [ttlMs, setTtlMs] = useState<number>(10000);
  const [includeBands, setIncludeBands] = useState<Record<string, boolean>>(() => ({
    Melee: true, Close: true, Far: true, "Very Far": true
  }));

  useEffect(() => { ready(); }, []);

  async function detectGrid() {
    try {
      // Not all scenes expose grid size; we attempt to infer from background scale
      // As a safe fallback, keep DEFAULT_CELL_PX.
      const scene = await OBR.scene.getMetadata();
      // If a previous value was used, keep it in room metadata for convenience
      const px = Number(scene?.[`${NS}.cellPx`]);
      if (Number.isFinite(px) && px > 10) setCellPx(px);
    } catch {}
  }
  useEffect(() => { detectGrid(); }, []);

  async function saveCellPx(px:number) {
    setCellPx(px);
    const md:any = await OBR.room.getMetadata();
    await OBR.room.setMetadata({ [`${NS}.cellPx`]: px });
  }

  function feetToPixels(feet:number) {
    const cells = feet / FEET_PER_CELL;
    return Math.max(4, cells * cellPx);
  }

  async function placeBands() {
    const sel = await OBR.player.getSelection();
    if (!sel.length) {
      alert("Select a token first to place range bands centered on it.");
      return;
    }
    const items = await OBR.scene.getItems(sel);
    const center = items[0].position; // approximate center of first selected item
    const now = Date.now();
    const expires = now + ttlMs;

    const rings:any[] = [];
    for (const p of PRESETS) {
      if (!includeBands[p.label]) continue;
      const r = feetToPixels(p.feet);
      rings.push({
        type: "ELLIPSE",
        layer: "DRAWING",
        position: center,
        width: r*2,
        height: r*2,
        strokeColor: "#000000",
        strokeOpacity: 0.6,
        strokeWidth: 2,
        fillOpacity: 0,
        locked: true,
        visible: true,
        metadata: { [`${NS}.ttl`]: expires, [`${NS}.band`]: p.label }
      });
      // Label
      rings.push({
        type: "LABEL",
        layer: "DRAWING",
        position: { x: center.x + r + 8, y: center.y },
        text: { text: `${p.label} (${p.feet} ft)`, size: 20, align: "LEFT" },
        visible: true,
        metadata: { [`${NS}.ttl`]: expires, [`${NS}.band`]: p.label }
      });
    }

    // Add as local (only you see) or global? We'll add to LOCAL by default to reduce clutter.
    await OBR.scene.local.addItems(rings as any);
    setTimeout(async () => {
      const local = await OBR.scene.local.getItems();
      const old = local.filter(i => (i.metadata?.[`${NS}.ttl`] ?? 0) <= Date.now());
      if (old.length) await OBR.scene.local.deleteItems(old.map(i=>i.id));
    }, ttlMs + 500);

    await logAction(`places range bands ${Object.keys(includeBands).filter(k=>includeBands[k]).join(", ")} (TTL ${Math.round(ttlMs/1000)}s)`);
  }

  async function clearMyBands() {
    const local = await OBR.scene.local.getItems();
    const mine = local.filter(i => i.metadata?.[`${NS}.band`]);
    if (mine.length) await OBR.scene.local.deleteItems(mine.map(i=>i.id));
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #ddd" }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <b>Range Band Rulers</b>
        <div title="Pixels per 5 ft (grid cell)">
          <label style={{ fontSize:12, opacity:.8 }}>px/5ft </label>
          <input type="number" value={cellPx} onChange={e=>saveCellPx(parseInt(e.target.value||"100"))} style={{ width: 70 }} />
        </div>
        <div title="How long the bands should stick around (ms)">
          <label style={{ fontSize:12, opacity:.8 }}>TTL(ms) </label>
          <input type="number" value={ttlMs} onChange={e=>setTtlMs(parseInt(e.target.value||"10000"))} style={{ width: 90 }} />
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap" }}>
        {PRESETS.map(p => (
          <label key={p.label} style={{ fontSize: 12 }}>
            <input type="checkbox" checked={!!includeBands[p.label]} onChange={e=>setIncludeBands(s=>({...s, [p.label]: e.target.checked}))} />
            {" "}{p.label} {p.feet}ft
          </label>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:6 }}>
        <button onClick={placeBands}>Place on Selected Token</button>
        <button onClick={clearMyBands}>Clear My Bands</button>
      </div>
      <div style={{ fontSize:11, opacity:.7, marginTop:4 }}>Tip: These are local overlays (only you see them). Increase px/5ft to match your map’s grid.</div>
    </div>
  );
}
