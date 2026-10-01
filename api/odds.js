export default async function handler(req, res) {
  // 1. 處理 CORS 標頭及 OPTIONS Preflight 請求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 動態提取與驗證參數 (提供預設值)
  const todayStr = new Date().toISOString().split('T')[0]; // 例如 "2026-10-01"
  const date = req.query.date || todayStr;
  const venue = (req.query.venue || 'ST').toUpperCase();
  
  let raceNo = parseInt(req.query.race || '1', 10);
  if (isNaN(raceNo) || raceNo < 1) raceNo = 1;

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
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://bet.hkjc.com/racing/',
        'Origin': 'https://bet.hkjc.com',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();

    // 檢查 HTTP Response 是否成功
    if (!r.ok) {
      return res.status(200).json({
        OUT: { WIN: [], QIN: [] },
        status: 'HTTP_ERROR',
        httpCode: r.status,
        preview: text.slice(0, 400),
        source: 'graphql-' + venue
      });
    }

    let j;
    try { 
      j = JSON.parse(text); 
    } catch (err) {
      return res.status(200).json({
        OUT: { WIN: [], QIN: [] },
        len: text.length,
        preview: text.slice(0, 400),
        note: 'HKJC returns non-JSON format (possibly block or night close page)',
        source: 'graphql-' + venue
      });
    }

    const pools = j?.data?.raceMeeting?.race?.pools || [];
    const winPool = pools.find(p => p.oddsType === 'WIN');
    const wins = (winPool?.oddsNodes || []).map(o => ({
      no: parseInt(o.horseNo, 10),
      win: parseFloat(o.odds)
    }));

    return res.status(200).json({
      OUT: {
        WIN: wins,
        QIN: pools.find(p => p.oddsType === 'QIN')?.oddsNodes || []
      },
      status: 'OK',
      raceNo: raceNo,
      venue: venue,
      date: date,
      len: text.length,
      source: 'bet.hkjc.com/racing/api/graphql',
      time: new Date().toISOString()
    });

  } catch (e) {
    return res.status(200).json({
      OUT: { WIN: [], QIN: [] },
      error: e.message
    });
  }
}
