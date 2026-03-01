// @id = ch.axlabs.banana.fx.ictax.export
// @api = 1.0
// @pubdate = 2026-02-28
// @publisher = AxLabs
// @description = Export ICTAX FX requests from selected Transactions
// @task = app.command
// @doctype = 100.*;110.*;130.*;140.*;150.*
// @includejs = axlabs_banana_ictax_fx_common.js
// @timeout = -1

function exec() {
  if (!Banana.document) return "@Cancel";

  var cursor = Banana.document.cursor;
  if (!cursor || cursor.tableName !== "Transactions") {
    Banana.Ui.showInformation(
      "Wrong context",
      "Go to the Transactions table, select one or more rows, then run this command."
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
