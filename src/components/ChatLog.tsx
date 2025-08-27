import React from 'react';
import OBR from "@owlbear-rodeo/sdk";
import { NS } from "../obr";
import { RoomState } from "../types";

export function ChatLog({ room }: { room: RoomState }) {
  async function clearLog() {
    const md:any = await OBR.room.getMetadata();
    await OBR.room.setMetadata({ [`${NS}.log`]: [] });
  }
  return (
    <div style={{ borderTop: "1px solid #ccc", marginTop: 12, paddingTop: 12, maxHeight: 160, overflow: "auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <b>Table Log</b>
        <button onClick={clearLog} title="Clear log for everyone">Clear</button>
      </div>
      <ul style={{ listStyle:"none", padding:0, margin:0 }}>
        {room.log?.slice(-200).map((m,i)=>(
          <li key={i} style={{ fontSize: 12, padding: "4px 0" }}>
            <span style={{ opacity:.7 }}>{new Date(m.t).toLocaleTimeString()}</span>
            {" "} <b>{m.by}</b>: {m.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function logAction(text:string, by?:string) {
  const now = Date.now();
  const author = by ?? (await OBR.player.getName()) ?? "Player";
  const md:any = await OBR.room.getMetadata();
  const log = (md[`${NS}.log`] ?? []) as any[];
  log.push({ t: now, by: author, text });
  // keep last 500
  while (log.length > 500) log.shift();
  await OBR.room.setMetadata({ [`${NS}.log`]: log });
}
