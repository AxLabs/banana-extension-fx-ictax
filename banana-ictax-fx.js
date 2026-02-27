// @id = ch.axlabs.banana.fx.ictax.bridge
// @api = 1.0
// @pubdate = 2026-02-27
// @publisher = AxLabs
// @description = Export FX requests (from selection) and import ICTAX CHF rates (upsert ExchangeRates)
// @task = app.command
// @doctype = 100.*;110.*;130.*;140.*;150.*
// @timeout = -1

function exec() {
  if (!Banana.document) return "@Cancel";

  // Yes = Export, No = Import
  var choice = Banana.Ui.showQuestion(
    "ICTAX FX helper",
    "Choose an action:\n\nYES  = Export FX requests from selected Transactions\nNO   = Import ICTAX FX rates output (upsert ExchangeRates)\n\n(Cancel to abort)"
  );

  if (choice === "yes") {
    return exportRequestsFromSelection();
  } else if (choice === "no") {
    return importRatesToExchangeRates();
  }

  return "@Cancel";
}

/* =========================
 * EXPORT
 * ========================= */
function exportRequestsFromSelection() {
  var cursor = Banana.document.cursor;
  if (!cursor || cursor.tableName !== "Transactions") {
    Banana.Ui.showInformation(
      "Wrong context",
      "Go to the Transactions table, select one or more rows, then run Export."
    );
    return "@Cancel";
  }

  var top = cursor.selectionTop;
  var bottom = cursor.selectionBottom;
  if (top === undefined || bottom === undefined || top < 0 || bottom < 0) {
    Banana.Ui.showInformation("No selection", "Select one or more transaction rows first.");
    return "@Cancel";
  }

  var startRow = Math.min(top, bottom);
  var endRow = Math.max(top, bottom);

  var tTable = Banana.document.table("Transactions");
  if (!tTable) {
    Banana.Ui.showInformation("Missing table", "Transactions table not found.");
    return "@Cancel";
  }

  var BASE = "CHF";

  // Crypto list — extend if needed
  var CRYPTO = toSet([
    "BTC","ETH","SOL","BNB","XRP","ADA","DOT","AVAX","MATIC","POL","LINK","LTC","BCH","XLM","TRX","ATOM","ETC","XMR","DOGE","TON","SHIB"
  ]);

  var unique = {};
  var requests = [];
  var skipped = { chf: 0, crypto: 0, empty: 0, nodate: 0 };

  for (var r = startRow; r <= endRow; r++) {
    var row = tTable.row(r);
    if (!row || row.isEmpty) { skipped.empty++; continue; }

    var date = safeTrim(row.value("Date"));
    if (!date) { skipped.nodate++; continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Banana.Ui.showInformation("Invalid date", "Row " + r + " has an invalid Date: " + date);
      return "@Cancel";
    }

    var ccy = safeTrim(row.value("Currency")).toUpperCase();
    if (!ccy) { skipped.empty++; continue; }

    if (ccy === BASE) { skipped.chf++; continue; }
    if (CRYPTO[ccy]) { skipped.crypto++; continue; }

    var k = key(date, ccy);
    if (!unique[k]) {
      unique[k] = true;
      requests.push({ date: date, currency: ccy });
    }
  }

  if (!requests.length) {
    Banana.Ui.showInformation(
      "Nothing to export",
      "No eligible foreign-currency rows found.\n\nSkipped: CHF=" + skipped.chf +
      ", crypto=" + skipped.crypto + ", no-date=" + skipped.nodate + ", empty=" + skipped.empty
    );
    return "@Cancel";
  }

  var defaultName = "ictax_fx_requests.json";
  var outPath = Banana.IO.getSaveFileName("Save FX requests JSON", defaultName, "JSON file (*.json);;All files (*)");
  if (!outPath || !outPath.length) return "@Cancel";

  var payload = {
    schema: "axlabs.ictax.fx.requests.v1",
    base: BASE,
    generatedAt: isoNowWithTZOffset(),
    requests: requests
  };

  var outFile = Banana.IO.getLocalFile(outPath);
  outFile.write(JSON.stringify(payload, null, 2));
  if (outFile.errorString) {
    Banana.Ui.showInformation("Write error", outFile.errorString);
    return "@Cancel";
  }

  Banana.Ui.showInformation(
    "Exported",
    "Wrote " + requests.length + " unique (date,currency) request(s).\n" +
    "Skipped: CHF=" + skipped.chf + ", crypto=" + skipped.crypto +
    ", no-date=" + skipped.nodate + ", empty=" + skipped.empty
  );

  return "@Cancel";
}

/* =========================
 * IMPORT
 * ========================= */
function importRatesToExchangeRates() {
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

  if (UPDATE_SELECTED_TRANSACTIONS) {
    var cursor = Banana.document.cursor;
    if (!cursor || cursor.tableName !== "Transactions") {
      Banana.Ui.showInformation(
        "Transactions not active",
        "To update selected transaction ExchangeRate values, switch to the Transactions table and select rows."
      );
      return "@Cancel";
    }

    var top = cursor.selectionTop;
    var bottom = cursor.selectionBottom;
    if (top === undefined || bottom === undefined || top < 0 || bottom < 0) {
      Banana.Ui.showInformation("No selection", "Select one or more transaction rows first.");
      return "@Cancel";
    }

    var startRow = Math.min(top, bottom);
    var endRow = Math.max(top, bottom);

    var tTable = Banana.document.table("Transactions");
    if (!tTable) {
      Banana.Ui.showInformation("Missing table", "Transactions table not found.");
      return "@Cancel";
    }

    var idx = {};
    for (var q = 0; q < payload.rates.length; q++) {
      var rr = payload.rates[q];
      idx[key(rr.date, String(rr.currency).toUpperCase())] = rr;
    }

    var txOps = [];
    for (var tr = startRow; tr <= endRow; tr++) {
      var tRow = tTable.row(tr);
      if (!tRow || tRow.isEmpty) continue;

      var d2 = safeTrim(tRow.value("Date"));
      var c2 = safeTrim(tRow.value("Currency")).toUpperCase();
      if (!d2 || !c2 || c2 === BASE) continue;

      var found = idx[key(d2, c2)];
      if (!found) {
        Banana.Ui.showInformation(
          "Missing rate for selection",
          "No imported rate found for selected transaction row " + tr + ": " + d2 + " " + c2 + "\n\nNo changes were applied."
        );
        return "@Cancel";
      }

      txOps.push({
        fields: { "ExchangeRate": String(found.rate) },
        operation: { name: "modify", sequence: String(tr) }
      });
    }

    if (txOps.length) {
      docChange.data.push({
        document: {
          dataUnits: [{
            nameXml: "Transactions",
            data: { rowLists: [{ rows: txOps }] }
          }]
        }
      });
    }
  }

  Banana.Ui.showInformation(
    "Import prepared",
    "Will upsert " + ops.length + " CHF-reference exchange rate row(s) into ExchangeRates."
  );

  return docChange;
}

/* =========================
 * VALIDATION + UTILS
 * ========================= */
function validateRatesPayload(p, expectedBase) {
  if (!p || typeof p !== "object") throw new Error("Payload is not an object.");
  if (String(p.schema) !== "axlabs.ictax.fx.rates.v1")
    throw new Error("Unexpected schema. Expected axlabs.ictax.fx.rates.v1");
  if (String(p.base).toUpperCase() !== expectedBase)
    throw new Error("Base must be " + expectedBase);
  if (!p.rates || !Array.isArray(p.rates))
    throw new Error("Missing 'rates' array.");

  for (var i = 0; i < p.rates.length; i++) {
    var r = p.rates[i];
    if (!r || typeof r !== "object") throw new Error("Invalid rate entry at index " + i);
    if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) throw new Error("Invalid date at index " + i);
    if (!r.currency || String(r.currency).length < 3) throw new Error("Invalid currency at index " + i);

    var rateNum = Number(r.rate);
    if (!isFinite(rateNum) || rateNum <= 0) throw new Error("Invalid rate at index " + i);

    var mulNum = Number(r.multiplier);
    if (!isFinite(mulNum) || mulNum === 0) throw new Error("Invalid multiplier at index " + i);
  }
}

function key(date, ccy) { return String(date) + "|" + String(ccy); }
function safeTrim(s) { return (s === undefined || s === null) ? "" : String(s).trim(); }
function toSet(arr) { var o = {}; for (var i=0;i<arr.length;i++) o[String(arr[i]).toUpperCase()] = true; return o; }

function isoNowWithTZOffset() {
  var d = new Date();
  function pad(n){ return (n<10 ? "0" : "") + n; }
  var tzMin = -d.getTimezoneOffset();
  var sign = tzMin >= 0 ? "+" : "-";
  var abs = Math.abs(tzMin);
  var hh = pad(Math.floor(abs/60));
  var mm = pad(abs%60);
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+
    "T"+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())+sign+hh+":"+mm;
}
