// Shared utilities for AxLabs Banana ICTAX FX extensions

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
