import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import OBR from "@owlbear-rodeo/sdk";
import { ready, NS } from "./obr";
import { RoomState } from "./types";
import { ChatLog, logAction } from "./components/ChatLog";
import { Cards, MyHand } from "./components/Cards";
import { RangeBands } from "./components/RangeBands";

const CAP_HOPE = 6, CAP_FEAR = 12;

function App() {
  const [room, setRoom] = useState<RoomState>({ hopeByPlayer: {}, fear: 0, log: [], cards: [] });
  const [me, setMe] = useState<{id:string,name:string}|null>(null);
  const [mod, setMod] = useState(0);

  useEffect(() => {
    ready().then(async () => {
      const meId = await OBR.player.getId();
      const meName = await OBR.player.getName();
      setMe({ id: meId, name: meName ?? "Player" });

      OBR.room.onMetadataChange((md:any) => {
        setRoom({
          hopeByPlayer: md?.[`${NS}.hopeByPlayer`] ?? {},
          fear: md?.[`${NS}.fear`] ?? 0,
          log: md?.[`${NS}.log`] ?? [],
          cards: md?.[`${NS}.cards`] ?? [],
          tokenCards: md?.[`${NS}.tokenCards`] ?? {}
        });
      });

      const md = await OBR.room.getMetadata();
      if (!md[`${NS}.hopeByPlayer`]) {
        await OBR.room.setMetadata({
          [`${NS}.hopeByPlayer`]: {},
          [`${NS}.fear`]: 0,
          [`${NS}.log`]: [],
          [`${NS}.cards`]: []
        });
      }

      OBR.broadcast.onMessage(`${NS}.roll`, (e) => {
        const m = e.data as any;
        OBR.notification.show(
          `${m.sender}: ${m.h} (Hope) + ${m.f} (Fear) ${m.crit ? "— CRIT!" : ""} ${Number.isFinite(m.total)?`| total ${m.total}`:""}`,
          "success"
        );
      });
    });
  }, []);

  async function setHopeFor(meId:string, delta:number) {
    const md:any = await OBR.room.getMetadata();
    const hb = { ...(md[`${NS}.hopeByPlayer`] ?? {}) };
    const cur = hb[meId] ?? 0;
    const next = Math.max(0, Math.min(CAP_HOPE, cur + delta));
    hb[meId] = next;
    await OBR.room.setMetadata({ [`${NS}.hopeByPlayer`]: hb });
    if (delta < 0) await logAction(`spends Hope (now ${next})`, me?.name ?? undefined);
    else await logAction(`gains Hope (now ${next})`, me?.name ?? undefined);
  }

  async function setFear(delta:number) {
    const md:any = await OBR.room.getMetadata();
    const cur = md[`${NS}.fear`] ?? 0;
    const next = Math.max(0, Math.min(CAP_FEAR, cur + delta));
    await OBR.room.setMetadata({ [`${NS}.fear`]: next });
    if (delta < 0) await logAction(`GM spends Fear (now ${next})`, "GM");
    else await logAction(`GM gains Fear (now ${next})`, "GM");
  }

  function rollDuality() {
    const h = 1 + Math.floor(Math.random()*12);
    const f = 1 + Math.floor(Math.random()*12);
    const crit = h === f;
    const total = h + f + (Number.isFinite(mod) ? mod : 0);
    OBR.broadcast.sendMessage(`${NS}.roll`, {
      h, f, crit, total, sender: me?.name ?? "Player"
    });
    logAction(`rolls Duality: Hope ${h}, Fear ${f}${crit ? " — CRIT!" : ""}${Number.isFinite(total) ? ` | total ${total}` : ""}`, me?.name ?? undefined);
  }

  const myHope = room.hopeByPlayer[me?.id ?? ""] ?? 0;

  return (
    <div style={{ fontFamily: "system-ui", padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Daggerheart Tools (Unofficial)</h3>

      <section>
        <h4>Duality Dice</h4>
        <div style={{ display: "flex", gap: 8, alignItems:"center" }}>
          <button onClick={rollDuality}>Roll 2d12</button>
          <label>Mod <input type="number" value={mod} onChange={e=>setMod(parseInt(e.target.value||"0"))} style={{ width:60 }}/></label>
        </div>
      </section>

      <section style={{ marginTop: 12 }}>
        <h4>Hope / Fear</h4>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div>
            <div><b>Your Hope</b> {myHope}/{CAP_HOPE}</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>setHopeFor(me!.id, +1)}>Gain Hope</button>
              <button onClick={()=>setHopeFor(me!.id, -1)}>Spend Hope</button>
            </div>
          </div>
          <div>
            <div><b>GM Fear</b> {room.fear}/{CAP_FEAR}</div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>setFear(+1)}>Gain Fear</button>
              <button onClick={()=>setFear(-1)}>Spend Fear</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <Cards room={room} meId={me?.id ?? ""} />
        <MyHand room={room} meId={me?.id ?? ""} />
      </section>

      <RangeBands />
        <ChatLog room={room} />
      <footer style={{ fontSize: 11, opacity: .7, marginTop: 12 }}>
        Not affiliated with or endorsed by Darrington Press. Uses community SRD-compatible terms.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
