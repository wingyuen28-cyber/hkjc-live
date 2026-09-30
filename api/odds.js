export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const race = req.query.race || '1';
  try{
    const url = `https://bet.hkjc.com/racing/getJSON.aspx?pooltype=WIN&raceno=${race}&racedate=2026-10-01`;
    const r = await fetch(url,{
      headers:{
        'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Referer':'https://bet.hkjc.com/',
        'Accept':'*/*'
      }
    });
    const t = await r.text();
    // t 而家04:12係 OUT={}; 所以要容錯
    const match = t.match(/OUT\s*=\s*(\{[\s\S]*?\});/);
    if(!match){
      return res.status(200).json({OUT:{WIN:[]}, raw:t.slice(0,200), len:t.length, note:'HKJC now empty - 88 bytes, wait for morning open'});
    }
    const obj = JSON.parse(match[1]);
    const win = (obj.WIN || []).map(o=>({no:parseInt(o.No), win:parseFloat(o.WIN)}));
    return res.status(200).json({OUT:{WIN:win}, source:'vercel-live', len:t.length, time:new Date().toISOString()});
  }catch(e){
    return res.status(200).json({OUT:{WIN:[]}, error:e.message, stack:e.stack?.slice(0,500)});
  }
}