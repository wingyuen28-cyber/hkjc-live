export default async function handler(req, res) {
  // 設定跨域存取 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const raceNo = parseInt(req.query.race || '1', 10);
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const venue = (req.query.venue || 'ST').toUpperCase();

  const payload = {
    operationName: "getRaceOdds",
    variables: {
      date: date,
      venue: venue,
      raceNo: raceNo,
      oddsTypes: ["WIN", "PLA", "QIN", "QPL"]
    },
    query: "query getRaceOdds($date: String, $venue: String, $raceNo: Int, $oddsTypes: [OddsType]) { raceMeeting(date: $date, venue: $venue) { race(raceNo: $raceNo) { raceNo pools(oddsTypes: $oddsTypes) { oddsType oddsNodes { combi horseNo odds status } } } } }"
  };

  try {
    const r = await fetch('https://bet.hkjc.com/racing/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        'Referer': 'https://bet.hkjc.com/racing/',
        'Origin': 'https://bet.hkjc.com',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return res.status(200).json({ error: "馬會傳回非 JSON 格式", preview: text.slice(0, 100) });
    }

    return res.status(200).json(json);
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
