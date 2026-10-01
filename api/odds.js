export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json; charset=utf-8');

  const raceNo = parseInt(req.query.race || '1');

  const payload = {
    operationName: "getRaceOdds",
    variables: {
      date: "2026-10-01",
      venue: "ST",
      raceNo: raceNo,
      oddsTypes: ["WIN", "PLA", "QIN", "QPL"]
    },
    query: "query getRaceOdds($date: String, $venue: String, $raceNo: Int, $oddsTypes: [OddsType]) { raceMeeting(date: $date, venue: $venue) { race(raceNo: $raceNo) { raceNo pools(oddsTypes: $oddsTypes) { oddsType oddsNodes { combi horseNo odds status } } } } }"
  };

  try{
    const r = await fetch('https://bet.hkjc.com/racing/api/graphql',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36',
        'Referer':'https://bet.hkjc.com/racing/',
        'Origin':'https://bet.hkjc.com',
        'Accept':'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch {
      return res.status(200).json({OUT:{WIN:[]}, len:text.length, preview:text.slice(0,400), note:'HKJC closed at night - returns HTML', source:'graphql-ST'});
    }

    const pools = j?.data?.raceMeeting?.race?.pools || [];
    const winPool = pools.find(p=>p.oddsType==='WIN');
    const wins = (winPool?.oddsNodes||[]).map(o=>({
      no: parseInt(o.horseNo),
      win: parseFloat(o.odds)
    }));

    // 轉返你V9.8.5要嘅格式
    return res.status(200).json({
      OUT:{
        WIN: wins,
        QIN: pools.find(p=>p.oddsType==='QIN')?.oddsNodes || []
      },
      status: 'OK',
      len: text.length,
      source: 'bet.hkjc.com/racing/api/graphql - ST',
      time: new Date().toISOString()
    });
  }catch(e){
    return res.status(200).json({OUT:{WIN:[]}, error:e.message});
  }
}