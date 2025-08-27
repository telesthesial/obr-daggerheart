import OBR from "@owlbear-rodeo/sdk";
export const NS = "com.example.daggerheart";
export async function ready() {
  if (!OBR.isAvailable) return;
  await OBR.onReady();
  return OBR;
}
