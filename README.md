# banana-ictax-fx

Banana Plus extension to export FX requests from selected transactions and import ICTAX CHF exchange rates.

## What it does

This single Banana extension provides two actions:

- **Export**: From selected rows in `Transactions`, it exports unique `(date, currency)` pairs (skipping CHF and common crypto tickers) into a JSON requests file.
- **Import**: Reads a JSON rates output file produced by your ICTAX script and **upserts** rows in Banana’s `ExchangeRates` table with `CurrencyReference = CHF`, preserving ICTAX multipliers.

## Workflow

1. In Banana, open the **Transactions** table and select the rows you want.
2. Run the extension and choose **YES** to **Export**.
3. Run your external ICTAX script (manual step) to convert the requests file into a rates output JSON file.
4. Run the extension again and choose **NO** to **Import**.

## File formats

### Requests (exported)

```json
{
  "schema": "axlabs.ictax.fx.requests.v1",
  "base": "CHF",
  "generatedAt": "2026-02-27T23:00:00+01:00",
  "requests": [
    {"date": "2026-02-10", "currency": "EUR"},
    {"date": "2026-02-11", "currency": "USD"}
  ]
}
```

### Rates output (imported)

```json
{
  "schema": "axlabs.ictax.fx.rates.v1",
  "base": "CHF",
  "source": "ICTAX",
  "rates": [
    {"date": "2026-02-10", "currency": "EUR", "rate": "0.9543", "multiplier": "1"},
    {"date": "2026-02-11", "currency": "JPY", "rate": "0.6121", "multiplier": "100"}
  ]
}
```

**Meaning**: `rate` is CHF per `multiplier` units of the foreign currency (as provided by ICTAX).

## Install (Banana)

- Banana Plus → **Extensions** → **Manage Extensions** → **Add from URL**
- Point it to the raw URL of `banana-ictax-fx.js` in your GitHub repo.

## Safety notes

- Import refuses invalid payloads and duplicates.
- Import updates only `ExchangeRates` rows with `CurrencyReference = CHF`.
- Optional “write back to Transactions” is disabled by default in the script (`UPDATE_SELECTED_TRANSACTIONS = false`).

## License

MIT
