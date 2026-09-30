export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const raceNo = parseInt(req.query.race || '1');
  try{
    const gql = await fetch('https://bet.hkjc.com/graphql',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'User-Agent':'Mozilla/5.0',
        'Referer':'https://bet.hkjc.com/'
      },
      body: JSON.stringify({
        query: `query { raceMeetings(date: "2026-10-01") { races { no status winOdds { horseNo odds } } } }`
      })
    });
    const j = await gql.json();
    const race = j?.data?.raceMeetings?.[0]?.races?.find(r=>r.no===raceNo);
    const wins = (race?.winOdds||[]).map(o=>({no:o.horseNo, win: parseFloat(o.odds)}));

    return res.status(200).json({
      OUT:{WIN:wins},
      status: race?.status || 'not-open-yet',
      len: JSON.stringify(j).length,
      source: 'bet.hkjc.com-graphql-live',
      time: new Date().toISOString()
    });
  }catch(e){
    return res.status(200).json({OUT:{WIN:[]}, error:e.message});
  }
}