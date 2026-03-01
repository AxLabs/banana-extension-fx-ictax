// @id = ch.axlabs.banana.fx.ictax.import
// @api = 1.0
// @pubdate = 2026-02-28
// @publisher = AxLabs
// @description = Import ICTAX FX rates output (upsert ExchangeRates)
// @task = app.command
// @doctype = 100.*;110.*;130.*;140.*;150.*
// @includejs = axlabs_banana_ictax_fx_common.js
// @timeout = -1

function exec() {
  if (!Banana.document) return "@Cancel";

  var BASE = "CHF";

  // Optional: also write ExchangeRate back into selected Transactions rows (OFF by default)
  var UPDATE_SELECTED_TRANSACTIONS = false;

  var inPath = Banana.IO.getOpenFileName(
    "Select ICTAX FX rates output JSON",
    "",
    "JSON file (*.json);;All files (*)"
  );
  if (!inPath || !inPath.length) return "@Cancel";

  var inFile = Banana.IO.getLocalFile(inPath);
  var text = inFile.read();
  if (inFile.errorString) {
    Banana.Ui.showInformation("Read error", inFile.errorString);
    return "@Cancel";
  }

  var payload;
  try { payload = JSON.parse(text); }
  catch (e) {
    Banana.Ui.showInformation("Invalid JSON", "Could not parse file.\n\n" + String(e));
    return "@Cancel";
  }

  try { validateRatesPayload(payload, BASE); }
  catch (e2) {
    Banana.Ui.showInformation("Invalid payload", String(e2));
    return "@Cancel";
  }

  var exTable = Banana.document.table("ExchangeRates");
  if (!exTable) {
    Banana.Ui.showInformation("Missing table", "ExchangeRates table not found.");
    return "@Cancel";
  }

  var existing = {};
  for (var i = 0; i < exTable.rowCount; i++) {
    var row = exTable.row(i);
    if (!row || row.isEmpty) continue;

    var d = safeTrim(row.value("Date"));
    var ref = safeTrim(row.value("CurrencyReference")).toUpperCase();
    var ccy = safeTrim(row.value("Currency")).toUpperCase();
    if (ref === BASE && d && ccy) existing[key(d, ccy)] = i;
  }

  var ops = [];
  var seen = {};

  for (var r = 0; r < payload.rates.length; r++) {
    var it = payload.rates[r];
    var date = String(it.date);
    var ccy2 = String(it.currency).toUpperCase();

    var k = key(date, ccy2);
    if (seen[k]) {
      Banana.Ui.showInformation("Duplicate rate", "Duplicate (date,currency) in file: " + date + " " + ccy2);
      return "@Cancel";
    }
    seen[k] = true;

    var fields = {
      "Date": date,
      "CurrencyReference": BASE,
      "Currency": ccy2,
      "Multiplier": String(it.multiplier),
      "Rate": String(it.rate),
      "Description": "ICTAX import"
    };

    if (existing[k] !== undefined) {
      ops.push({ fields: fields, operation: { name: "modify", sequence: String(existing[k]) } });
    } else {
      ops.push({ fields: fields, operation: { name: "add" } });
    }
  }

  var docChange = {
    format: "documentChange",
    error: "",
    data: [{
      document: {
        dataUnits: [{
          nameXml: "ExchangeRates",
          data: { rowLists: [{ rows: ops }] }
        }]
      }
    }]
  };

  Banana.Ui.showInformation(
    "Import prepared",
    "Will upsert " + ops.length + " CHF-reference exchange rate row(s) into ExchangeRates."
  );

  return docChange;
}
