export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { symbols } = req.query;
  if (!symbols) {
    res.status(400).json({ error: "Missing symbols query param" });
    return;
  }

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing TWELVEDATA_API_KEY" });
    return;
  }

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${apiKey}`;

  try {
    const tdRes = await fetch(url);
    const data = await tdRes.json();

    // Twelve Data returns a single object for one symbol, or an object
    // keyed by symbol for multiple. Normalize to always return an object
    // keyed by symbol.
    const symbolList = symbols.split(",");
    let normalized = {};

    if (symbolList.length === 1) {
      normalized[symbolList[0]] = data;
    } else {
      normalized = data;
    }

    const quotes = {};
    for (const sym of symbolList) {
      const q = normalized[sym];
      if (!q || q.status === "error" || q.code) {
        quotes[sym] = { error: q?.message || "Not found" };
        continue;
      }
      quotes[sym] = {
        symbol: q.symbol,
        name: q.name,
        price: parseFloat(q.close),
        previousClose: parseFloat(q.previous_close),
        percentChange: parseFloat(q.percent_change),
      };
    }

    res.status(200).json(quotes);
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
