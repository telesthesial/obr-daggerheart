# Daggerheart Tools for Owlbear Rodeo (Unofficial)

## Quick Install

[![Install in Owlbear Rodeo](https://img.shields.io/badge/Install%20in%20Owlbear%20Rodeo-blue?logo=github)](https://telesthesial.github.io/obr-daggerheart/manifest.json)

Paste this URL into **Owlbear Rodeo → Profile → Add Extension**:
```
https://telesthesial.github.io/obr-daggerheart/manifest.json
```


A lightweight Owlbear Rodeo v1 extension that adds:
- Duality Dice roller (2d12, doubles -> crit, optional modifier) with table notifications
- Hope/Fear trackers (per-player Hope, GM Fear) that **log** when spent/gained
- **Table Log** (native to this extension) synced via room metadata
- **Range Band Rulers** (Melee/Close/Far/Very Far), local overlays with adjustable px/5ft and TTL
- **Card Helpers**: add/import SRD-friendly cards, draw to player hand, and attach to tokens

> Not affiliated with or endorsed by Darrington Press. Use with SRD content and follow the DPCGL/community license.

## Install for development

```bash
npm i
npm run dev
```

In Owlbear Rodeo → Profile → **Add Extension** and paste:
`http://localhost:5173/manifest.json`

## One-click publish with GitHub Pages

1. Create a GitHub repo named **obr-daggerheart** and push this folder.
2. In Settings → Pages, set **Source** to **GitHub Actions**.
3. The workflow below builds to `/dist` and publishes to Pages.
4. Your ready-to-install manifest URL will look like:
   `https://telesthesial.github.io/obr-daggerheart/manifest.json`

In Owlbear → Profile → **Add Extension** → paste that URL.

## Card Helpers (SRD-compatible)

Use **Card Helpers → Import JSON** to paste an array like:

```json
[
  {"title":"Basic Action: Strike","text":"Make an attack using Duality Dice. On doubles, trigger a crit effect per table rules.","tags":["Basic","Action"]},
  {"title":"Recover","text":"Spend Hope to reduce Stress or recover Guard per your playbook/GM guidance.","tags":["Recover"]}
]
```

These are placeholders. Replace with text you are permitted to use (e.g., from the SRD).

## Legal

This is **unofficial**. Avoid brand marks or implying endorsement. Ship with compatible terminology and do not include non-SRD content in the repo.