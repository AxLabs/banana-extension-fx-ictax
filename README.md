# banana-ictax-fx (Banana package, two menu commands)

This repository contains a **Banana Accounting Plus package extension (.sbaa)** that provides **two separate menu commands**:

- **Export ICTAX FX requests from selected Transactions**
- **Import ICTAX FX rates output (upsert ExchangeRates)**

## Why a package?
A Banana `.sbaa` package can contain **multiple commands** but installs as a single extension.

## Build the .sbaa package
This repo includes:
- `ch.axlabs.banana.ictax-fx.qrc` (Qt Resource Collection)
- `manifest.json` (package metadata)
- the JS command files listed in the `.qrc`

Compile the `.qrc` into a `.sbaa` using the Qt `rcc` tool (Banana documents this workflow for packaged extensions).

## Install in Banana

You have two options:

### Option A: Install from URL (recommended)

Banana → Extensions → Manage Extensions → **Add from URL…**

Use this stable URL (always points to the latest release):

- https://github.com/AxLabs/banana-extension-fx-ictax/releases/latest/download/ch.axlabs.banana.ictax-fx.sbaa

Then you can enable **Automatically update** so Banana keeps the extension up to date.

### Option B: Install from file

Banana → Extensions → Manage Extensions → **Add from file…** → select the generated `.sbaa`.

After installing, you’ll see **two commands** in the Extensions menu.

## Workflow
1. In Banana, open **Transactions**, select the rows you want.
2. Run **Export ICTAX FX requests…** → saves `ictax_fx_requests.json`.
3. Run your external ICTAX script manually to produce `ictax_fx_rates.json`.
4. Run **Import ICTAX FX rates…** → pick the output file → updates `ExchangeRates` (CHF reference), preserving ICTAX multipliers.

## File formats
See `examples/requests.example.json` and `examples/rates.example.json`.

## License
MIT
