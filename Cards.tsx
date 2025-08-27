import React, { useMemo, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { NS } from "../obr";
import { Card, RoomState } from "../types";
import { logAction } from "./ChatLog";

function uid() { return Math.random().toString(36).slice(2,9); }

export function Cards({ room, meId }:{ room: RoomState, meId: string }) {
  const [query, setQuery] = useState("");

  const all = room.cards ?? [];
  const filtered = useMemo(()=>{
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(c => c.title.toLowerCase().includes(q) || c.text.toLowerCase().includes(q) || (c.tags??[]).some(t=>t.toLowerCase().includes(q)));
  }, [all, query]);

  async function addCard() {
    const title = prompt("Card title:")?.trim();
    if (!title) return;
    const text = prompt("Card text (rules summary):") ?? "";
    const tags = (prompt("Tags (comma-separated):") ?? "").split(",").map(s=>s.trim()).filter(Boolean);
    const md:any = await OBR.room.getMetadata();
    const cards:Card[] = md[`${NS}.cards`] ?? [];
    const card:Card = { id: uid(), title, text, tags };
    await OBR.room.setMetadata({ [`${NS}.cards`]: [...cards, card] });
  }

  async function importJson() {
    const raw = prompt("Paste cards JSON (array of {title,text,tags?}):");
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) throw new Error("Not an array");
      const md:any = await OBR.room.getMetadata();
      const cur:Card[] = md[`${NS}.cards`] ?? [];
      const mapped:Card[] = arr.map((c:any)=>({ id: uid(), title: String(c.title), text: String(c.text||""), tags: Array.isArray(c.tags)?c.tags:[] }));
      await OBR.room.setMetadata({ [`${NS}.cards`]: cur.concat(mapped) });
    } catch (e:any) {
      alert("Invalid JSON: " + e.message);
    }
  }

  async function drawToHand(card:Card) {
    const me = await OBR.player.getId();
    const md:any = await OBR.room.getMetadata();
    const key = `${NS}.hand.${me}`;
    const hand:string[] = md[key] ?? [];
    await OBR.room.setMetadata({ [key]: [...hand, card.id] });
    logAction(`draws "${card.title}"`);
  }

  async function attachToToken(card:Card) {
    const sel = await OBR.player.getSelection();
    if (!sel.length) { alert("Select a token first."); return; }
    const items = await OBR.scene.getItems(sel);
    await OBR.scene.updateItems(items.map(i=>i.id), (mut:any[]) => {
      for (const m of mut) {
        const ids = (m.metadata?.[`${NS}.tokenCards`] ?? []) as string[];
        m.metadata = { ...(m.metadata??{}), [`${NS}.tokenCards`]: listUnique(ids.concat(card.id)) };
      }
    });
    logAction(`attached "${card.title}" to ${items.length} token(s)`);
  }

  function listUnique<T>(arr:T[]):T[] { return Array.from(new Set(arr)); }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <b>Card Helpers</b>
        <button onClick={addCard}>New</button>
        <button onClick={importJson}>Import JSON</button>
        <input placeholder="Search…" value={query} onChange={(e)=>setQuery(e.target.value)} style={{ marginLeft: "auto", width: 160 }}/>
      </div>
      <div style={{ maxHeight: 160, overflow:"auto", border:"1px solid #ddd", borderRadius: 6, padding: 6, marginTop: 6 }}>
        {filtered.length === 0 ? <div style={{ fontSize: 12, opacity:.7 }}>No cards. Click “New” or “Import JSON”.</div> :
          filtered.map(c => (
            <div key={c.id} style={{ padding: 6, borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 12, whiteSpace:"pre-wrap" }}>{c.text}</div>
              {c.tags?.length ? <div style={{ fontSize: 11, opacity:.7, marginTop: 2 }}>{c.tags.join(" • ")}</div> : null}
              <div style={{ display:"flex", gap:6, marginTop: 4 }}>
                <button onClick={()=>drawToHand(c)}>Draw to my Hand</button>
                <button onClick={()=>attachToToken(c)} title="Attach to selected tokens">Attach to Token</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function MyHand({ meId, room }:{ meId:string, room:RoomState }) {
  const [cards, setCards] = React.useState<any[]>([]);
  React.useEffect(()=>{
    (async ()=>{
      const md:any = await OBR.room.getMetadata();
      const key = `${NS}.hand.${meId}`;
      const ids:string[] = md[key] ?? [];
      const byId = new Map((room.cards??[]).map(c=>[c.id,c]));
      setCards(ids.map(i=>byId.get(i)).filter(Boolean));
    })();
  }, [room.cards, meId, room.log]); // re-eval on changes

  async function discard(i:number) {
    const md:any = await OBR.room.getMetadata();
    const key = `${NS}.hand.${meId}`;
    const ids:string[] = md[key] ?? [];
    const [removed] = ids.splice(i,1);
    await OBR.room.setMetadata({ [key]: ids });
    if (removed) await logAction(`discards a card`);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <b>My Hand</b>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:6, maxHeight: 120, overflow:"auto", border:"1px solid #ddd", borderRadius:6, padding:6, marginTop:6 }}>
        {cards.length === 0 ? <div style={{ fontSize:12, opacity:.7 }}>No cards in hand.</div> : cards.map((c, i)=>(
          <div key={i} style={{ padding:6, border:"1px solid #eee", borderRadius:6 }}>
            <div style={{ fontWeight:600 }}>{c.title}</div>
            <div style={{ fontSize:12, whiteSpace:"pre-wrap" }}>{c.text}</div>
            <div style={{ textAlign:"right" }}>
              <button onClick={()=>discard(i)}>Discard</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
