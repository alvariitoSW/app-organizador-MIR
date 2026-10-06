import math
# El día del usuario (vie 9, Fuerza), tal como sale en sus capturas. «Ahora» = 10:58.
NOW=10*60+58
WORK,GUARD,MEAL,GYM,EVT,SLEEP,SUN='#f59e0b','#ef4444','#10b981','#22d3ee','#a855f7','#2b3956','#f3c969'
def hm(s):h,m=s.split(':');return int(h)*60+int(m)
SLP=[(0,hm('6:50')),(hm('22:40'),1440)]
BLK=[('8:00','15:00',WORK,'💼','Trabajo','08:00–15:00 · Medicina Interna'),
     ('18:30','19:45',GYM,'💪','Entreno · Rutina 2','6 ejercicios · 75 min')]
EVTS=[('8:00','12:00','📌','Simulación UCI'),('16:30','18:00','📌','Curso bioestadística')]
MEALS=[('7:00','☕','Desayuno antes de salir','lomo embuchado + fiambre de pollo','209 kcal · 34 g P',True),
       ('12:30','🥪','Media mañana','yogur griego con avena','180 kcal · 18 g P',False),
       ('20:00','🥗','Comida en casa','bowl de pollo al ajillo, lenteja y feta','516 kcal · 51 g P',False),
       ('20:45','🍳','Cena','plato de pollo al ajillo y verduras','446 kcal · 50 g P',False)]
TRAVEL=[('7:31','8:00','🚌','Salir de casa','bus · 29 min'),('15:00','15:35','🚌','Vuelta a casa','')]

DIM=' opacity="0.25"'
def pt(cx,cy,r,m):
    t=(m/1440*360-90)*math.pi/180;return cx+r*math.cos(t),cy+r*math.sin(t)
def arc(cx,cy,r,a,b):
    b=min(b,1439.5);x0,y0=pt(cx,cy,r,a);x1,y1=pt(cx,cy,r,b)
    return f'M{x0:.1f},{y0:.1f} A{r},{r} 0 {1 if b-a>720 else 0} 1 {x1:.1f},{y1:.1f}'

def reloj(size=300,labels=False,centro=('AHORA · 10:58','Trabajo','quedan 4 h 02'),sel=None):
    c=size/2;R=size*(0.29 if labels else 0.35);w=size*(0.06 if labels else 0.075);g=''
    g+=f'<circle cx="{c}" cy="{c}" r="{R}" fill="none" stroke="#1e2b44" stroke-width="{w}"/>'
    # sueño: neutro, con trama (no compite con las categorías)
    for a,b in SLP:g+=f'<path d="{arc(c,c,R,a,b)}" fill="none" stroke="url(#slp)" stroke-width="{w}"/>'
    g+=f'<path d="{arc(c,c,R+w*0.85,hm("7:58"),hm("19:39"))}" fill="none" stroke="{SUN}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>'
    for a,b,col,*_ in BLK:g+=f'<path d="{arc(c,c,R,hm(a),hm(b))}" fill="none" stroke="{col}" stroke-width="{w}"{(DIM if sel and sel!=_[1] else "")}/>'
    for a,b,*_ in TRAVEL:g+=f'<path d="{arc(c,c,R,hm(a),hm(b))}" fill="none" stroke="#64748b" stroke-width="{w}"/>'
    # eventos por dentro, comidas como puntos en el borde interior
    for a,b,ico,t in EVTS:g+=f'<path d="{arc(c,c,R-w*1.05,hm(a),hm(b))}" fill="none" stroke="{EVT}" stroke-width="{w*(0.6 if sel==t else 0.42):.1f}" stroke-linecap="round"{(DIM if sel and sel!=t else "")}/>'
    for h,ico,t,*rest in MEALS:
        x,y=pt(c,c,R-w*1.05,hm(h));ok=rest[-1]
        g+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{w*0.32:.1f}" fill="{MEAL if ok else "#111a2b"}" stroke="{MEAL}" stroke-width="2"/>'
    for hh in range(24):
        x1,y1=pt(c,c,R-w*0.5,hh*60);x2,y2=pt(c,c,R-w*0.2,hh*60)
        g+=f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#070b14" stroke-width="1.5"/>'
    for hh in (0,6,12,18):
        x,y=pt(c,c,R+w*1.55,hh*60);g+=f'<text x="{x:.1f}" y="{y+4:.1f}" text-anchor="middle" font-size="{size*0.037:.0f}" font-weight="800" fill="#8fa6c6">{hh}</text>'
    # la aguja de ahora
    x0,y0=pt(c,c,R-w*1.7,NOW);x1,y1=pt(c,c,R+w*0.9,NOW)
    g+=f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="#f87171" stroke-width="3" stroke-linecap="round"/><circle cx="{x1:.1f}" cy="{y1:.1f}" r="5" fill="#f87171"/>'
    if labels:
        for a,b,col,ico,t,s in BLK+[(a,b,EVT,ico,t,'') for a,b,ico,t in EVTS]:
            m=(hm(a)+hm(b))/2;x,y=pt(c,c,R+w*(3.4 if col==EVT else 3.0),m)
            g+=f'<text x="{x:.1f}" y="{y+4:.1f}" text-anchor="middle" font-size="12.5" font-weight="800" fill="{col}">{ico} {t.split(" ·")[0].replace("Curso bioestadística","Curso").replace("Simulación UCI","Simulación")}</text>'
        x,y=pt(c,c,R+w*2.6,hm('3:00'));g+=f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" font-size="12" font-weight="800" fill="#8fa6c6">🌙 8h12</text>'
    c1,c2,c3=centro
    g+=f'<text x="{c}" y="{c-size*0.07:.0f}" text-anchor="middle" font-size="{size*0.036:.1f}" font-weight="900" letter-spacing="1.5" fill="#8fa6c6">{c1}</text>'
    g+=f'<text x="{c}" y="{c+size*0.03:.0f}" text-anchor="middle" font-size="{size*0.085:.0f}" font-weight="900" fill="#e9f2ff">{c2}</text>'
    g+=f'<text x="{c}" y="{c+size*0.1:.0f}" text-anchor="middle" font-size="{size*0.044:.0f}" fill="#8fa6c6">{c3}</text>'
    defs='<defs><pattern id="slp" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#2b3956"/><line x1="0" y1="0" x2="0" y2="6" stroke="#3a4b6e" stroke-width="2"/></pattern></defs>'
    return f'<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}" style="display:block;margin:0 auto">{defs}{g}</svg>'

CSS='''<style>
:root{--bg:#070b14;--bg2:#0b1120;--card:#111a2b;--ink:#e9f2ff;--ink2:#8fa6c6;--line:#1e2b44;--brand:#38e1ff;--brand2:#7c5cff;--ok:#34d399;--warn:#fbbf24}
*{box-sizing:border-box}body{margin:0;background:#05080f;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);font-variant-numeric:tabular-nums}
.wrap{width:390px;padding:0;margin:20px;display:inline-block;vertical-align:top}
.ab{width:390px;height:844px;overflow:hidden;background:radial-gradient(600px 300px at 10% -5%,#0e3a4d55,transparent 70%),linear-gradient(var(--bg),var(--bg2));border-radius:28px;border:1px solid #1e2b44;position:relative;padding:0 14px}
.top{display:flex;gap:6px;padding:10px 0 8px;border-bottom:1px solid var(--line);margin:0 -14px 10px;padding-left:14px}
.top span,.top b{font-size:13px;font-weight:800;color:var(--ink2);padding:6px 10px;border-radius:99px}.top b{color:#04121c;background:linear-gradient(90deg,var(--brand),var(--brand2))}
.dh{display:flex;align-items:center;gap:8px;margin:2px 0 4px}.dh b{font-size:18px;font-weight:900}.dh .sp{flex:1}
.nb{font-size:12.5px;font-weight:800;border:1px solid var(--line);border-radius:99px;padding:5px 10px;color:var(--ink2);background:var(--card)}
.tag{font-size:11.5px;font-weight:900;padding:3px 8px;border-radius:99px;background:color-mix(in srgb,#22c55e 18%,transparent);color:#86efac}
.chips{display:flex;gap:6px;overflow:hidden;margin:6px 0 2px}.chips span{white-space:nowrap;font-size:12px;font-weight:800;border:1px solid var(--line);border-radius:99px;padding:5px 9px;color:var(--ink2)}.chips b{color:var(--ink)}
.cap{font-size:10.5px;font-weight:900;letter-spacing:.13em;color:var(--ink2);margin:10px 2px 6px;display:flex;align-items:center;gap:8px}.cap .sp{flex:1}.cap em{font-style:normal;letter-spacing:0;font-weight:700;font-size:11.5px}
.ag{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.r{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--line);position:relative}.r:first-child{border-top:0}
.r .h{width:40px;font-size:12.5px;font-weight:800;color:var(--ink2);flex:none}
.r .bar{width:4px;align-self:stretch;border-radius:4px;flex:none}
.r .t{flex:1;min-width:0}.r .t b{display:block;font-size:14px;font-weight:700}.r .t span{display:block;font-size:11.5px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r.in{padding-left:62px}.r.in .h{width:auto}
.r.now{background:color-mix(in srgb,#f87171 7%,transparent)}.r.now::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#f87171}
.r.past{opacity:.55}
.ck{width:34px;height:34px;border-radius:50%;border:2px solid #10b981;display:grid;place-items:center;font-size:15px;font-weight:900;color:#10b981;flex:none}.ck.on{background:#10b981;color:#04121c}
.go{font-size:12.5px;font-weight:900;padding:8px 11px;border-radius:12px;background:linear-gradient(90deg,var(--brand),var(--brand2));color:#04121c;flex:none}
.pst{display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:12.5px;color:var(--ink2);font-weight:700}
.foot{display:flex;gap:10px;justify-content:space-between;font-size:12px;color:var(--ink2);margin:10px 4px}.foot b{color:var(--ink)}
.sig{display:flex;gap:8px;margin:2px 0 4px}.sig div{flex:1;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 10px}.sig small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.1em;color:var(--ink2)}.sig b{font-size:13.5px}.sig span{font-size:11.5px;color:var(--ink2)}
.scrim{position:absolute;inset:0;background:rgba(2,4,10,.25)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);border-radius:22px 22px 0 0;padding:10px 16px 18px}
.grab{width:42px;height:4px;border-radius:4px;background:var(--line);margin:0 auto 10px}
.sh1{display:flex;align-items:center;gap:10px}.sh1 .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px}.sh1 b{font-size:18px}.sh1 span{display:block;font-size:12.5px;color:var(--ink2)}
.qa{font-size:13px;color:var(--ink2);margin:10px 0 0;line-height:1.5}.qa b{color:var(--ink)}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px;margin-top:10px}.kv span{color:var(--ink2)}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.acts span{text-align:center;padding:10px 6px;border:1px solid var(--line);border-radius:12px;font-size:13px;font-weight:800}
.acts .p{background:linear-gradient(90deg,var(--brand),var(--brand2));color:#04121c;border:0}
.warnb{margin-top:10px;font-size:12.5px;padding:8px 10px;border-radius:12px;background:color-mix(in srgb,#fbbf24 12%,transparent);color:#fde68a}
.tl{position:relative;margin-left:44px;border-left:1px solid var(--line)}
.tl .hr{position:absolute;left:-44px;width:38px;text-align:right;font-size:11px;color:var(--ink2);font-weight:800}
.tl .bk{position:absolute;left:8px;right:0;border-radius:10px;padding:3px 9px;font-size:12.5px;font-weight:800;overflow:hidden;line-height:1.3}
.tl .bk span{display:block;font-weight:600;font-size:11px;opacity:.85}
.leg{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:11.5px;color:var(--ink2);margin:6px 2px}.leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
</style>'''

TOP='<div class="top"><b>Calendario</b><span>Entreno</span><span>Comer</span><span>☰ Más</span></div>'
HEAD=('<div class="dh"><span class="nb">‹ jue</span><b>Viernes 9</b><span class="tag">💪 Fuerza</span><span class="sp"></span><span class="nb">sáb ›</span></div>'
      '<div class="chips"><span>🌿 finde libre en <b>15 d</b></span><span>📌 curso bioestadística <b>hoy</b></span><span>📌 …</span></div>')

def fila(h,col,t,s,der='',cls=''):
    return f'<div class="r {cls}"><span class="h">{h}</span><span class="bar" style="background:{col}"></span><div class="t"><b>{t}</b><span>{s}</span></div>{der}</div>'

def ab(lbl,body,note):
    return f'<div class="wrap"><div class="ab">{TOP}{body}</div><p class="note" style="display:none">{note}</p></div>\n'

out='<!doctype html><meta charset=utf-8><title>Hoy definitivo</title>'+CSS
# ---------- A1: reloj + agenda (arriba)
agA=('<div class="ag">'+
  '<div class="pst">✓ 3 hechas: levantarse, desayuno, bus<span style="margin-left:auto">▸</span></div>'+
  fila('8:00',WORK,'💼 Trabajo','hasta las 15:00 · quedan 4 h 02','', 'now')+
  fila('8:00',EVT,'📌 Simulación UCI','08:00–12:00 · dentro de la jornada','', 'in now')+
  fila('12:30',MEAL,'🥪 Media mañana','yogur griego con avena · 180 kcal','<span class="ck">✓</span>')+
  fila('15:00','#64748b','🚌 Vuelta a casa','35 min','')+
  fila('16:30',EVT,'📌 Curso bioestadística','16:30–18:00','')+
  fila('18:30',GYM,'💪 Entreno · Rutina 2','6 ejercicios · 75 min','<span class="go">▶ empezar</span>')+
  fila('20:00',MEAL,'🥗 Comida en casa','bowl de pollo al ajillo · 516 kcal · 51 g P','<span class="ck">✓</span>')+
  fila('20:45',MEAL,'🍳 Cena','pollo al ajillo y verduras · 446 kcal','<span class="ck">✓</span>')+
  fila('22:40','#3a4b6e','🛌 A la cama','8h12 hasta las 06:50','')+'</div>')
out+=ab('A',HEAD+reloj(270)+'<div class="cap">EL DÍA<span class="sp"></span><em>mantén pulsado para ver o cambiar</em></div>'+agA,'')
# ---------- A2: la misma, desplazada (pie)
pie=('<div class="foot"><span>🛌 <b>22:40 → 06:50</b> · 8h12</span><span>☀ <b>07:58–19:39</b></span><span>🍽 <b>209</b> / 2697 kcal</span></div>'
     '<div class="leg"><span><i style="background:#f59e0b"></i>trabajo</span><span><i style="background:#22d3ee"></i>entreno</span><span><i style="background:#a855f7"></i>eventos</span><span><i style="background:#10b981"></i>comidas</span><span><i style="background:#64748b"></i>trayectos</span><span><i style="background:repeating-linear-gradient(45deg,#2b3956 0 2px,#3a4b6e 2px 4px)"></i>sueño</span></div>')
out+=ab('A2','<div style="margin-top:-6px">'+agA+'</div>'+pie,'')
# ---------- B: línea del día (sin reloj grande)
def tl():
    a0,a1=hm('6:30'),hm('23:00');H=640;y=lambda m:(m-a0)/(a1-a0)*H
    s=f'<div class="tl" style="height:{H}px">'
    for hh in range(6,24,2):s+=f'<span class="hr" style="top:{y(hh*60)-7:.0f}px">{hh:02d}</span>'
    items=[('7:00','7:30',MEAL,'☕ Desayuno ✓ · ⏰ 6:50',''),
           ('8:00','15:00',WORK,'💼 Trabajo','hasta 15:00'),('15:00','15:35','#64748b','🚌 Vuelta',''),('16:30','18:00',EVT,'📌 Curso bioestadística','16:30–18:00'),
           ('18:30','19:45',GYM,'💪 Entreno · Rutina 2','▶ empezar'),('20:00','20:40',MEAL,'🥗 Comida en casa','516 kcal  ○'),('20:45','21:15',MEAL,'🍳 Cena','446 kcal  ○'),('22:40','23:00','#3a4b6e','🛌 A la cama','8h12')]
    for a,b,col,t,sub in items:
        s+=f'<div class="bk" style="top:{y(hm(a)):.0f}px;height:{max(20,y(hm(b))-y(hm(a))-2):.0f}px;background:color-mix(in srgb,{col} 22%,#111a2b);border-left:3px solid {col}">{t}<span>{sub}</span></div>'
    s+=f'<div class="bk" style="top:{y(hm("8:00"))+30:.0f}px;left:120px;height:{y(hm("12:00"))-y(hm("8:00"))-34:.0f}px;background:color-mix(in srgb,{EVT} 28%,#111a2b);border-left:3px solid {EVT}">📌 Simulación UCI<span>08:00–12:00</span></div>'
    s+=f'<div style="position:absolute;left:-6px;right:0;top:{y(NOW):.0f}px;border-top:2px solid #f87171"></div><div style="position:absolute;left:-10px;top:{y(NOW)-4:.0f}px;width:9px;height:9px;border-radius:50%;background:#f87171"></div>'
    return s+'</div>'
mini=reloj(84,centro=('','',''))
out+=ab('B','<div style="display:flex;align-items:center;gap:10px">'+mini+'<div style="flex:1">'+HEAD.replace('<div class="chips">','<div class="chips" style="display:none">')+'<div style="font-size:12px;color:#8fa6c6">ahora <b style="color:#e9f2ff">Trabajo</b> · quedan 4 h 02 · luego 📌 curso 16:30</div></div></div>'+tl(),'')
# ---------- C: reloj protagonista con etiquetas
out+=ab('C',HEAD+reloj(362,labels=True)+
  '<div class="sig"><div><small>AHORA</small><b>💼 Trabajo</b><br><span>📌 Simulación UCI hasta 12:00</span></div><div><small>LUEGO</small><b>🥪 12:30</b><br><span>media mañana</span></div><div><small>DESPUÉS</small><b>📌 16:30</b><br><span>curso</span></div></div>'+
  '<div class="ag" style="margin-top:8px"><div class="pst">🍽 4 comidas · 1 hecha <span style="margin-left:auto">▸</span></div><div class="pst" style="border-top:1px solid #1e2b44">💪 Rutina 2 a las 18:30 <span class="go" style="margin-left:auto">▶ empezar</span></div></div>','')
# ---------- S1: hoja de un evento (mantener pulsado)
sh1=('<div class="scrim" style="top:520px"></div><div class="sheet"><div class="grab"></div>'
  '<div class="sh1"><span class="ic" style="background:#a855f733">📌</span><div><b>Simulación UCI</b><span>Evento · vie 9 · 08:00 – 12:00 (4 h)</span></div></div>'
  '<p class="qa"><b>Qué es este color:</b> violeta = un evento tuyo (citas, cursos, sesiones). Va por <b>dentro</b> del reloj, encima de la jornada.</p>'
  '<div class="kv"><span>Choca con</span><b>💼 Trabajo 08:00–15:00 · cuenta como parte de la jornada</b><span>Aviso</span><b>30 min antes, en el calendario del móvil</b><span>Se repite</span><b>no, solo este día</b></div>'
  '<div class="acts"><span class="p">✎ Cambiar hora</span><span>⏭ Saltar hoy</span><span>🔕 Sin aviso</span><span>📌 Ir a Eventos</span></div></div>')
out+=ab('S1',HEAD+reloj(250,sel='Simulación UCI',centro=('08:00 – 12:00','Simulación','📌 evento · 4 h'))+sh1,'')
# ---------- S2: hoja de una comida
sh2=('<div class="scrim"></div><div class="sheet"><div class="grab"></div>'
  '<div class="sh1"><span class="ic" style="background:#10b98133">🥗</span><div><b>Comida en casa · 20:00</b><span>Comida · hasta las 21:30 · después de entrenar</span></div></div>'
  '<p class="qa"><b>Bowl de pollo al ajillo, lenteja, verduras y feta</b> · más pechuga<br>516 kcal · 51 g proteína · 🍱 de la semana base</p>'
  '<p class="qa"><b>Por qué a esta hora:</b> entrenas de 18:30 a 19:45 y llegas a casa a las 20:00.</p>'
  '<div class="acts"><span class="p">✓ Comido</span><span>🔁 Cambiar plato</span><span>🕐 Mover hora</span><span>🚫 Hoy no</span></div></div>')
out+=ab('S2',HEAD+reloj(250,centro=('20:00','Comida','🥗 hasta 21:30'))+sh2,'')
open('/home/user/app-organizador-MIR/maquetas/hoy-definitivo.html','w').write(out)
print('ok')
