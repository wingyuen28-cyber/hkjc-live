export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const race = req.query.race || '1';
  const date = '2026/10/01';
  try{
    // 1. 試新版 racing API (馬會無block Vercel)
    const url = `https://racing.hkjc.com/racing/information/Chinese/racing/RaceCard.aspx?RaceDate=${date}&RaceNo=${race}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Referer':'https://racing.hkjc.com/'
      }
    });
    const html = await r.text();

    // 喺__NEXT_DATA__或頁面入面搵獨贏賠率
    // 格式通常係 winOdds 或 WIN
    let wins = [];
    const m1 = html.match(/"raceNo":\s*${race}[^}]*"winOdds":\s*"([\d.]+)"/g);
    // 備用：直接捉 table
    const regex = /No\.(\d+)[\s\S]{0,200}?(\d+\.\d+)/g;
    let m;
    while((m = regex.exec(html))!== null && wins.length < 14){
      wins.push({no: parseInt(m[1]), win: parseFloat(m[2])});
    }

    // 如果都係空，返返頁面長度俾你debug，但唔會再500
    return res.status(200).json({
      OUT:{WIN:wins},
      len: html.length,
      source: wins.length? 'racing.hkjc.com-live' : 'racing-page-empty-wait-open',
      preview: html.slice(0,300),
      time: new Date().toISOString()
    });
  }catch(e){
    return res.status(200).json({OUT:{WIN:[]}, error: e.message});
  }
}