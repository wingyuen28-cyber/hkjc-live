export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const race = req.query.race || '1';
  const r = await fetch(`https://bet.hkjc.com/racing/getJSON.aspx?pooltype=WIN&raceno=${race}&racedate=2026-10-01`,{
    headers:{'User-Agent':'Mozilla/5.0','Referer':'https://bet.hkjc.com/'}
  });
  const t = await r.text();
  const m = t.match(/OUT\s*=\s*(\{.*\});/);
  const j = JSON.parse(m[1]);
  res.json({OUT:{WIN:j.WIN.map(o=>({no:o.No, win:o.WIN}))}, source:'vercel-real'});
}