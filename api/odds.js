export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const raceNo = parseInt(req.query.race || '1');
  const raceDate = '2026-10-01';

  const query = `
    query getRaceOdds($date: String!, $raceNo: Int!) {
      raceMeetings(date: $date) {
        races(filter: {number: $raceNo}) {
          no
          status
          winOdds {
            horseNo
            odds
          }
        }
      }
    }
  `;

  try{
    const r = await fetch('https://bet.hkjc.com/racing/api/graphql',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Referer':'https://bet.hkjc.com/racing/',
        'Origin':'https://bet.hkjc.com',
        'x-api-locale':'en_us'
      },
      body: JSON.stringify({
        operationName: 'getRaceOdds',
        query,
        variables: { date: raceDate, raceNo }
      })
    });
    const text = await r.text();
    let j;
    try{ j = JSON.parse(text); } catch{
      return res.status(200).json({OUT:{WIN:[]}, len:text.length, preview:text.slice(0,300), note:'HKJC still returns HTML at night - will be JSON at 09:30', source:'graphql-gateway'});
    }
    const race = j?.data?.raceMeetings?.[0]?.races?.[0];
    const wins = (race?.winOdds||[]).map(o=>({no:o.horseNo, win: parseFloat(o.odds)}));

    return res.status(200).json({
      OUT:{WIN:wins},
      status: race?.status || 'PENDING',
      rawLen: text.length,
      source: 'bet.hkjc.com/racing/api/graphql - getRaceOdds',
      time: new Date().toISOString()
    });
  }catch(e){
    return res.status(200).json({OUT:{WIN:[]}, error:e.message});
  }
}