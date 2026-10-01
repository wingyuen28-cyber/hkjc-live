export default async function handler(req, res) {
  // 設置 CORS 允許前端跨域存取
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const raceNo = parseInt(req.query.race || '1', 10);
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const venue = req.query.venue || 'ST';

  const payload = {
    operationName: "getRaceOdds",
    variables: {
      date: date,
      venue: venue,
      raceNo: raceNo,
      oddsTypes: ["WIN", "PLA", "QIN", "QPL"]
    },
    query: `query getRaceOdds($date: String, $venue: String, $raceNo: Int, $oddsTypes: [OddsType]) {
      raceMeeting(date: $date, venue: $venue) {
        race(raceNo: $raceNo) {
          raceNo
          pools(oddsTypes: $oddsTypes) {
            oddsType
            oddsNodes {
              combi
              horseNo
              odds
              status
            }
          }
        }
      }
    }`
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Referer': 'https://bet.hkjc.com/racing/pages/odds_wp.aspx',
    'Origin': 'https://bet.hkjc.com'
  };

  // 嘗試目標：直連馬會 -> 代理轉發通道
  const targetUrls = [
    'https://bet.hkjc.com/racing/api/graphql',
    'https://corsproxy.io/?https://bet.hkjc.com/racing/api/graphql'
  ];

  for (const url of targetUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      if (!text) continue;

      const json = JSON.parse(text);
      if (json && (json.data || json.errors)) {
        return res.status(200).json(json);
      }
    } catch (e) {
      // 繼續嘗試下一條通道
    }
  }

  return res.status(502).json({
    error: "馬會防火牆阻擋雲端 IP",
    needFallback: true
  });
}
