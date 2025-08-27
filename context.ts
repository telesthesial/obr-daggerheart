import OBR from "@owlbear-rodeo/sdk";
import { NS, ready } from "./obr";
import { logAction } from "./components/ChatLog";

ready().then(async () => {
  if (!OBR) return;
  // Initialize default metadata keys if missing
  const md:any = await OBR.room.getMetadata();
  const init:any = {};
  if (!md[`${NS}.hopeByPlayer`]) init[`${NS}.hopeByPlayer`] = {};
  if (!md[`${NS}.fear`]) init[`${NS}.fear`] = 0;
  if (!md[`${NS}.log`]) init[`${NS}.log`] = [];
  if (!md[`${NS}.cards`]) init[`${NS}.cards`] = [];
  if (Object.keys(init).length) await OBR.room.setMetadata(init);

  OBR.contextMenu.create({
    id: `${NS}.note`,
    icons: [{ icon: `<svg viewBox="0 0 24 24"><path d="M4 4h16v12l-4 4H4z"/></svg>`, label: "Note" }],
    title: "Daggerheart Note…",
    filter: { every: [{ key: "type", value: "IMAGE" }], roles: ["GM","PLAYER"] },
    onClick: async (ctx) => {
      const note = prompt("Add/edit note (e.g., Guard 3, Wounds 1):") ?? "";
      const items = await OBR.scene.getItems(ctx.items);
      await OBR.scene.updateItems(items.map(i=>i.id), (mutable:any[]) => {
        for (const m of mutable) {
          m.metadata = { ...(m.metadata ?? {}), [`${NS}.note`]: note };
        }
      });
      if (note) {
        await logAction(`updated a token note: "${note}"`);
        OBR.notification.show("Note saved.", "success");
      }
    }
  });
});
