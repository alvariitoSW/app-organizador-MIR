import math
SLEEP,GUARD,WORK,GYM,EVT='#5f6bc4','#e5484d','#0aa6c4','#b8a000','#e9f2ff'
TYPE={'gu':('#ef4444','Guardia','🩺'),'sa':('#3b82f6','Saliente','🚪'),'tr':('#0aa6c4','Trabajo','💼'),'fu':('#059669','Fuerza','💪'),'li':('#a855f7','Libre','🌿'),'va':('#d97706','Vacaciones','🏖️')}
# October 2026: day -> type (Oct 1 = Thu)
oct_t={1:'tr',2:'fu',3:'li',4:'li',5:'gu',6:'sa',7:'tr',8:'tr',9:'fu',10:'li',11:'li',12:'gu',13:'sa',14:'fu',15:'gu',16:'sa',17:'tr',18:'li',19:'gu',20:'sa',21:'tr',22:'fu',23:'tr',24:'li',25:'li',26:'tr',27:'fu',28:'tr',29:'tr',30:'fu',31:'li',32:'li'}
DOW=['L','M','X','J','V','S','D']
def dow(d): return (d+2)%7  # Oct1 Thu -> index 3
ev={5:('19:00','Inglés'),6:('8:30','S. clínica'),7:('19:00','Inglés'),8:('17:00','Dentista'),10:('21:00','Cena con Lucía'),12:('19:00','Inglés'),13:('8:30','S. clínica'),14:('19:00','Inglés'),17:('9:00','Simulacro MIR'),19:('19:00','Inglés'),21:('19:00','Inglés'),26:('19:00','Inglés'),28:('19:00','Inglés')}
def hm(s):h,m=s.split(':');return int(h)*60+int(m)
# absolute segments (minutes from Oct 1 0:00)
seg=[]
def add(day,a,b,c): seg.append(((day-1)*1440+a,(day-1)*1440+b,c))
slp={}
for d in range(0,33):
    t=oct_t.get(d,'tr'); n=oct_t.get(d+1,'tr')
    if t=='gu':
        add(d,15*60,32*60,'g'); add(d,27*60,28*60+30,'s'); slp[d+1]=2.5
    elif t in('tr','fu'): add(d,8*60,15*60,'w')
    if t=='fu': add(d,18*60,19*60+15,'y')
    if t=='sa': add(d,9*60+30,14*60,'s')
    if t!='gu':
        if n in('tr','fu'): a,b=22*60+40,30*60+50
        elif n=='li': a,b=23*60+45,32*60+30
        elif n=='gu': a,b=23*60,31*60+30
        elif n=='sa': a,b=22*60+40,30*60+50
        add(d,a,b,'s')
        if oct_t.get(d,'tr')!='gu': slp[d+1]=(b-a)/60
COL={'s':SLEEP,'g':GUARD,'w':WORK,'y':GYM}
# sleep debt per day (night ending that morning), min 7.5
debt={};D=0.0
for d in range(1,33):
    s=slp.get(d,7.5); delta=7.5-s
    if delta<0: delta=max(delta,-2)
    D=max(0,D+delta); debt[d]=round(D,1)

def rowsvg(day,width,h,y,axis_start=360):
    w0=(day-1)*1440+axis_start; w1=w0+1440; out=''
    for a,b,c in seg:
        if b<=w0 or a>=w1: continue
        x=(max(a,w0)-w0)/1440*width; x2=(min(b,w1)-w0)/1440*width
        extra=' fill="url(#gymz)"' if c=='y' else f' fill="{COL[c]}"'
        out+=f'<rect x="{x:.1f}" y="{y}" width="{max(1.5,x2-x-1):.1f}" height="{h}" rx="2"{extra}/>'
    if day in ev:
        t=hm(ev[day][0]); x=((t-axis_start)%1440)/1440*width
        out+=f'<circle cx="{x:.1f}" cy="{y+h/2}" r="3.2" fill="{EVT}" stroke="#111a2b" stroke-width="1.5"/>'
    return out

def arc(cx,cy,r,a0,a1):
    def p(a):
        t=math.radians(a/1440*360-90); return cx+r*math.cos(t),cy+r*math.sin(t)
    x0,y0=p(a0);x1,y1=p(a1);large=1 if (a1-a0)%1440>720 else 0
    return f'M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f}'

base=open('/home/user/app-organizador-MIR/maquetas/plan-semana-mes.html').read()
base=base[base.index('<style>'):base.index('</style>')+8]
css='''<style>
.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:13px;padding:4px;margin:2px 0 10px}
.seg span{text-align:center;padding:7px 0;border-radius:10px;font-size:13px;font-weight:800;color:var(--ink2)}.seg .on{background:var(--card);color:var(--ink)}
.hd{display:flex;align-items:center;gap:8px;margin:0 0 8px}.hd b{font-size:19px;font-weight:900}.hd .ar{color:var(--ink2);font-size:18px;padding:0 4px}
.chips2{display:flex;gap:6px;overflow:hidden;margin-bottom:10px}.chips2 span{white-space:nowrap;font-size:12px;font-weight:700;padding:6px 10px;border-radius:99px;background:var(--card);border:1px solid var(--line);color:var(--ink2)}.chips2 b{color:var(--ink)}
.box2{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px 14px;margin-bottom:10px}
.cap2{font-size:11px;font-weight:900;letter-spacing:.13em;color:var(--ink2);margin-bottom:6px}
.alert{border-color:color-mix(in srgb,#e5484d 55%,var(--line));background:color-mix(in srgb,#e5484d 9%,var(--card))}
.alert b{display:block;font-size:14.5px}.alert .mini{margin-top:2px}
.bt{display:flex;gap:8px;margin-top:9px}.bt span{flex:1;text-align:center;padding:9px 0;border-radius:11px;border:1px solid var(--line);font-weight:800;font-size:13px}.bt .p{background:linear-gradient(90deg,var(--brand),var(--brand2));color:#04121c;border:0}
.nx{display:grid;grid-template-columns:46px 1fr;gap:8px;padding:8px 0;border-top:1px solid var(--line);font-size:14px}.nx:first-of-type{border-top:0}.nx em{font-style:normal;font-weight:900;color:var(--brand);font-size:13px}.nx small{display:block;color:var(--ink2);font-size:12px}
.pill{font-size:11.5px;font-weight:900;padding:4px 9px;border-radius:99px;border:1px solid}
.lgd{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--ink2);margin-top:6px}.lgd span{display:flex;align-items:center;gap:5px}.lgd i{width:10px;height:10px;border-radius:3px;display:inline-block}
.tog{display:inline-flex;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:3px;gap:3px;font-size:12px;font-weight:800}.tog span{padding:5px 9px;border-radius:8px;color:var(--ink2)}.tog .on{background:var(--card);color:var(--ink)}
.hq{display:flex;flex-wrap:wrap;gap:6px}.hq span{font-size:12.5px;padding:6px 10px;border-radius:10px;background:color-mix(in srgb,#a855f7 14%,var(--card));border:1px solid color-mix(in srgb,#a855f7 35%,var(--line))}.hq b{font-weight:800}
.bub{background:#0d3b2e;border-radius:14px 14px 4px 14px;padding:10px 12px;font-size:13.5px;line-height:1.45;margin:10px 0 0 30px}
.bub small{display:block;text-align:right;color:#8fd3b6;font-size:10.5px;margin-top:4px}
.ops{display:flex;gap:6px;margin:8px 0}.ops span{white-space:nowrap;font-size:12px;font-weight:800;padding:6px 10px;border-radius:99px;border:1px solid var(--line);color:var(--ink2)}.ops .on{border-color:var(--brand);color:var(--ink);background:color-mix(in srgb,var(--brand) 12%,var(--card))}
.slot{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);font-size:14px}.slot:first-child{border-top:0}.slot .k{width:20px;height:20px;border-radius:6px;background:var(--brand);color:#04121c;display:grid;place-items:center;font-size:12px;font-weight:900}.slot b{flex:1}.slot em{font-style:normal;font-size:12px;color:var(--ink2)}
</style>'''
pat='<svg width="0" height="0" style="position:absolute"><defs><pattern id="gymz" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="'+GYM+'"/><rect width="2" height="5" fill="#7a6b00"/></pattern></defs></svg>'
def ab(lbl,body,note):
    return f'<div class="wrap"><div class="lbl">{lbl}</div><div class="ab"><div class="top"><b class="on">Calendario</b><span>Entreno</span><span>Comer</span><span>☰ Más</span></div>'+body+f'</div><p class="note">{note}</p></div>\n'
seg3=lambda o:'<div class="seg">'+''.join(f'<span{" class=on" if x==o else ""}>{x}</span>' for x in ['Mes','Semana','Hoy'])+'</div>'
out='<!doctype html><meta charset=utf-8><title>Calendario nuevo</title>\n'+base+css+pat
horiz='<div class="chips2"><span>🌿 libre en <b>5 d</b></span><span>📝 simulacro <b>12 d</b></span><span>🏖️ vacaciones <b>78 d</b></span></div>'

# ---------- 1 HOY: reloj del día ----------
cx=cy=150;R=112
s=f'<svg viewBox="0 0 300 300" width="300" height="300" style="display:block;margin:0 auto">'
# daylight outer ring
s+=f'<circle cx="{cx}" cy="{cy}" r="{R+17}" fill="none" stroke="#0b1120" stroke-width="5"/>'
s+=f'<path d="{arc(cx,cy,R+17,6*60+56,18*60+43)}" fill="none" stroke="#f3c969" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>'
# base track
s+=f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#1a2438" stroke-width="22"/>'
for a,b,c in [(0,7*60+30,SLEEP),(15*60,1439,GUARD)]:
    s+=f'<path d="{arc(cx,cy,R,a+4,b-4)}" fill="none" stroke="{c}" stroke-width="22"/>'
# inner track: events and meals
s+=f'<path d="{arc(cx,cy,R-24,19*60,20*60)}" fill="none" stroke="#c084fc" stroke-width="8" stroke-linecap="round"/>'
for t,lab in [(14*60,'🍽'),(21*60+30,'🍽')]:
    a=math.radians(t/1440*360-90);x=cx+(R-24)*math.cos(a);y=cy+(R-24)*math.sin(a)
    s+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#e9f2ff"/>'
# hour labels
for h in [0,6,12,18]:
    a=math.radians(h*15-90);x=cx+(R+31)*math.cos(a);y=cy+(R+31)*math.sin(a)+4
    s+=f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" font-size="11" font-weight="800" fill="#8fa6c6">{h}</text>'
for h in range(24):
    a=math.radians(h*15-90);x1=cx+(R-11)*math.cos(a);y1=cy+(R-11)*math.sin(a);x2=cx+(R-15)*math.cos(a);y2=cy+(R-15)*math.sin(a)
    s+=f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#0b1120" stroke-width="1.5"/>'
# now hand
t=22*60+20;a=math.radians(t/1440*360-90)
s+=f'<line x1="{cx+(R-40)*math.cos(a):.1f}" y1="{cy+(R-40)*math.sin(a):.1f}" x2="{cx+(R+22)*math.cos(a):.1f}" y2="{cy+(R+22)*math.sin(a):.1f}" stroke="#f87171" stroke-width="3" stroke-linecap="round"/>'
s+=f'<circle cx="{cx+(R+22)*math.cos(a):.1f}" cy="{cy+(R+22)*math.sin(a):.1f}" r="5" fill="#f87171"/>'
# labels on arcs
s+=f'<text x="{cx+44}" y="{cy-62}" font-size="11" font-weight="800" fill="#c7cff5">🛌 7 h 30</text>'
s+=f'<text x="{cx-70}" y="{cy+66}" font-size="11" font-weight="800" fill="#ffb4b4">🩺 15→8</text>'
# center
s+=f'<text x="{cx}" y="{cy-22}" text-anchor="middle" font-size="10.5" font-weight="900" letter-spacing="1.5" fill="#8fa6c6">AHORA · 22:20</text>'
s+=f'<text x="{cx}" y="{cy+4}" text-anchor="middle" font-size="24" font-weight="900" fill="#e9f2ff">Guardia</text>'
s+=f'<text x="{cx}" y="{cy+24}" text-anchor="middle" font-size="13" fill="#8fa6c6">quedan 9 h 40</text>'
s+=f'<text x="{cx}" y="{cy+42}" text-anchor="middle" font-size="11" fill="#f3c969">☀ amanece 6:56</text>'
s+='</svg>'
out+=ab('1 · HOY: tu día es un reloj',
 seg3('Hoy')+'<div class="hd"><span class="ar">‹</span><b>Lunes 5</b><span class="pill" style="color:#ffb4b4;border-color:#7a2a2a">🩺 Guardia</span><span class="sp"></span><span class="ar">›</span></div>'+horiz+s+
 '<div class="box2 alert" style="margin-top:6px"><b>⚠ Inglés (19:00) cae dentro de la guardia</b><div class="mini">la app lo ha visto sola: los martes y jueves también chocan este mes</div><div class="bt"><span>Quitar solo hoy</span><span class="p">Quitar en guardias</span></div></div>'
 '<div class="box2"><div class="cap2">LO SIGUIENTE</div>'
 '<div class="nx"><em>8:00</em><span>Sales de guardia<small>mañana · saliente</small></span></div>'
 '<div class="nx"><em>8:30</em><span>Sesión clínica<small>antes de irte a casa</small></span></div>'
 '<div class="nx"><em>9:30</em><span>🛌 Duerme hasta las 14:00<small>tras la guardia debes '+f'{debt[6]:.0f}'+' h de sueño: la siesta paga la mitad</small></span></div></div>',
 '<b>Un reloj de 24 h</b> en vez de una lista: el anillo es tu día (azul dormir, rojo guardia), dentro lo que haces (comidas, eventos), fuera <b>la luz del día</b> (útil haciendo noches) y la aguja roja es <b>ahora</b>. En el centro, lo que estás haciendo y cuánto queda. La app <b>detecta choques</b> (Inglés cae en guardia) y te ofrece arreglarlo. Arriba, <b>cuenta atrás</b> de lo que esperas. Sale de bloquesDelDia, eventoQueChoca, solDe y suenoPlan, que ya existen.')

# ---------- 2 SEMANA ----------
days=list(range(5,12));W=300
rows=''
for i,d in enumerate(days):
    t=oct_t[d];col,lab,ic=TYPE[t]
    y=i*30
    rows+=f'<text x="0" y="{y+14}" font-size="11" font-weight="900" fill="#e9f2ff">{DOW[dow(d)]} {d}</text><text x="0" y="{y+25}" font-size="9.5" font-weight="800" fill="{col}">{ic} {lab}</text>'
    rows+=f'<rect x="66" y="{y+5}" width="{W-70}" height="16" rx="4" fill="#0b1120"/>'
    rows+='<g transform="translate(66,0)">'+rowsvg(d,W-70,16,y+5,0)+'</g>'
wsvg=f'<svg viewBox="0 -14 {W} 224" width="100%" style="display:block">'+''.join(f'<text x="{66+(W-70)*h/24:.0f}" y="-3" font-size="9.5" text-anchor="{"end" if h==24 else "middle"}" fill="#8fa6c6">{h}</text>' for h in [0,6,12,18,24])+rows+'</svg>'
# debt chart
pts=[(i,debt[d]) for i,d in enumerate(days)];mx=10
cw,chh=300,78
def px(i):return 14+i*(cw-28)/6
def py(v):return 8+(1-v/mx)*(chh-20)
solid='';dash=' '.join(f'{px(i):.0f},{py(v):.0f}' for i,v in pts)
area=f'M{px(0):.0f},{py(0)} '+' '.join(f'L{px(i):.0f},{py(v):.0f}' for i,v in pts)+f' L{px(6):.0f},{py(0)} Z'
csvg=f'<svg viewBox="0 0 {cw} {chh+14}" width="100%" style="display:block">'
csvg+=f'<line x1="10" x2="{cw-10}" y1="{py(0)}" y2="{py(0)}" stroke="#1e2b44"/><line x1="10" x2="{cw-10}" y1="{py(5)}" y2="{py(5)}" stroke="#1e2b44" stroke-dasharray="3 3"/><text x="{cw-10}" y="{py(5)-3}" text-anchor="end" font-size="9" fill="#8fa6c6">5 h</text>'
csvg+=f'<path d="{area}" fill="#38e1ff" fill-opacity=".10"/><polyline points="{solid}" fill="none" stroke="#38e1ff" stroke-width="2"/><polyline points="{dash}" fill="none" stroke="#38e1ff" stroke-width="2" stroke-dasharray="4 4"/>'
for i,v in pts:
    csvg+=f'<circle cx="{px(i):.0f}" cy="{py(v):.0f}" r="{4 if i==0 else 3}" fill="{"#38e1ff" if i<=0 else "#111a2b"}" stroke="#38e1ff" stroke-width="2"/>'
    csvg+=f'<text x="{px(i):.0f}" y="{chh+11}" text-anchor="middle" font-size="9.5" fill="#8fa6c6">{DOW[dow(days[i])]}</text>'
imax=max(range(7),key=lambda i:pts[i][1]);vm=pts[imax][1]
csvg+=f'<text x="{px(imax):.0f}" y="{py(vm)-8:.0f}" text-anchor="middle" font-size="11" font-weight="900" fill="#e9f2ff">{vm:.1f} h</text></svg>'
out+=ab('2 · SEMANA: cómo viene (y qué hacer)',
 seg3('Semana')+'<div class="hd"><span class="ar">‹</span><b>5 – 11 oct</b><span class="pill" style="color:#fdba74;border-color:#7a4a1a">▲ semana cargada</span><span class="sp"></span><span class="ar">›</span></div>'
 '<div class="box2" style="padding-bottom:8px"><div class="cap2">DEUDA DE SUEÑO · SE PREVÉ</div><div class="mini" style="margin:-2px 0 2px">la guardia del lunes la sube; el saliente y el finde la pagan</div>'+csvg+'</div>'
 '<div class="box2" style="padding:10px 12px 6px">'+wsvg+'<div class="lgd"><span><i style="background:'+SLEEP+'"></i>dormir</span><span><i style="background:'+GUARD+'"></i>guardia</span><span><i style="background:'+WORK+'"></i>trabajo</span><span><i style="background:repeating-linear-gradient(45deg,'+GYM+' 0 3px,#7a6b00 3px 5px)"></i>entreno</span><span><i style="background:#e9f2ff;border-radius:50%"></i>evento</span></div></div>'
 '<div class="box2"><div class="cap2">HUECOS PARA QUEDAR</div><div class="hq"><span><b>Mié</b> desde 15:30</span><span><b>Jue</b> 15:30–17</span><span><b>Sáb</b> hasta 21:00</span><span><b>Dom</b> todo el día</span></div><div class="bt"><span class="p">📤 Mandar mis huecos</span></div></div>',
 'La semana contada <b>como la vives</b>: arriba una etiqueta (cargada / tranquila) y la <b>deuda de sueño prevista día a día</b> (línea continua lo que ya pasó, discontinua lo que viene, con la guardia y su recuperación). Debajo, <b>siete tiras de 24 h</b> alineadas: se ve de un golpe cuándo trabajas, duermes, entrenas (rayado, para que no dependa del color) y tus eventos. Y algo nuevo: <b>tus huecos para quedar</b>, calculados del calendario, listos para mandar.')

# ---------- 3 MES: mapa de horas ----------
MW=262;rh=12.4
msv=f'<svg viewBox="0 -16 340 {31*rh+20}" width="100%" style="display:block">'
for h,lab in [(0,'6'),(3,'9'),(6,'12'),(9,'15'),(12,'18'),(15,'21'),(18,'0'),(21,'3'),(24,'6')]:
    x=36+MW*h/24;msv+=f'<line x1="{x:.0f}" x2="{x:.0f}" y1="-4" y2="{31*rh}" stroke="#1e2b44" stroke-width="{1.4 if lab in("0","12") else .7}"/><text x="{x:.0f}" y="-6" text-anchor="middle" font-size="9" fill="#8fa6c6">{lab}</text>'
pts=[]
for d in range(1,32):
    y=(d-1)*rh;t=oct_t[d]
    wk=dow(d)>=5
    msv+=f'<text x="0" y="{y+rh-3:.1f}" font-size="9" font-weight="{900 if d==5 else 700}" fill="{"#38e1ff" if d==5 else ("#c4b5fd" if wk else "#8fa6c6")}">{DOW[dow(d)]}{d}</text>'
    if d==5: msv+=f'<rect x="34" y="{y-1:.1f}" width="{MW+4}" height="{rh+1:.1f}" rx="3" fill="none" stroke="#38e1ff" stroke-width="1.2"/>'
    msv+='<g transform="translate(36,0)">'+rowsvg(d,MW,rh-3,y+1.5)+'</g>'
    pts.append((306+debt[d]*3.2,y+rh/2))
msv+=f'<line x1="306" x2="306" y1="0" y2="{31*rh}" stroke="#1e2b44"/><polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in pts)}" fill="none" stroke="#38e1ff" stroke-width="1.8"/>'
dmx=max(debt[d] for d in range(1,32));dmd=max(range(1,32),key=lambda d:debt[d])
msv+=f'<text x="306" y="-6" font-size="9" fill="#8fa6c6">deuda</text><text x="{306+dmx*3.2-2:.0f}" y="{(dmd-1)*rh+rh/2+13:.0f}" text-anchor="end" font-size="9.5" font-weight="900" fill="#e9f2ff">{dmx:.0f} h</text></svg>'
out+=ab('3 · MES: el mapa de tus horas',
 seg3('Mes')+'<div class="hd"><span class="ar">‹</span><b>Octubre</b><span class="sp"></span><span class="tog"><span>Casillas</span><span class="on">Horas</span></span><span class="ar">›</span></div>'+
 '<div class="box2" style="padding:12px 10px 8px">'+msv+
 '<div class="lgd"><span><i style="background:'+SLEEP+'"></i>dormir</span><span><i style="background:'+GUARD+'"></i>guardia</span><span><i style="background:'+WORK+'"></i>trabajo</span><span><i style="background:repeating-linear-gradient(45deg,'+GYM+' 0 3px,#7a6b00 3px 5px)"></i>entreno</span><span><i style="background:#e9f2ff;border-radius:50%"></i>evento</span></div></div>'
 '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px">'+''.join(f'<div class="box2" style="margin:0;padding:9px 10px;font-size:11px;color:var(--ink2)">{a}<b style="display:block;font-size:18px;color:var(--ink)">{b}</b></div>' for a,b in [('🩺 guardias','4 de 5'),('⏱ trabajo','212 h'),('🛌 deuda máx.',f'{dmx:.0f} h')])+'</div>'
 '<div class="box2" style="font-size:13px;color:var(--ink2);line-height:1.5"><b style="color:var(--ink)">Lo que se ve:</b> 4 guardias (las barras rojas que cruzan la noche), y detrás de cada una el sueño partido en dos. La semana del 12 encadena dos guardias: la deuda llega a '+f'{dmx:.0f}'+' h el '+str(dmd)+'.</div>',
 '<b>Lo más nuevo</b>: un «actograma», el gráfico que usan los médicos del sueño, hecho con tu calendario. <b>Cada fila es un día de 6:00 a 6:00</b> (así la noche sale entera, sin cortarse a medianoche): azul dormir, rojo guardia, cian trabajo, rayado entreno, puntos los eventos. A la derecha, <b>la deuda de sueño</b> bajando por el mes. El mes entero cabe en una pantalla (31 filas de 12 px) y se ven los patrones que una cuadrícula esconde. Las <b>Casillas</b> de siempre siguen a un toque, para editar.')

# ---------- 4 HORIZONTE 3 meses ----------
import datetime
start=datetime.date(2026,10,5)  # Monday
types_seq=['gu','sa','tr','tr','fu','li','li','gu','sa','fu','gu','sa','tr','li','gu','sa','tr','fu','tr','li','li','tr','fu','tr','tr','fu','li','li']
cells='';sq=17;gap=3
vac=set((datetime.date(2026,12,22)+datetime.timedelta(i)) for i in range(10))
ex=datetime.date(2026,10,17)
for wk in range(13):
    for dd in range(7):
        day=start+datetime.timedelta(wk*7+dd)
        t='va' if day in vac else types_seq[(wk*7+dd)%28]
        col=TYPE[t][0]
        x=26+wk*(sq+gap);y=16+dd*(sq+gap)
        op='.95' if t in('gu','va') else '.55'
        cells+=f'<rect x="{x}" y="{y}" width="{sq}" height="{sq}" rx="4" fill="{col}" fill-opacity="{op}"/>'
        if t=='gu':cells+=f'<circle cx="{x+sq/2}" cy="{y+sq/2}" r="2.6" fill="#fff"/>'
        if day==ex:cells+=f'<text x="{x+sq/2}" y="{y+13}" text-anchor="middle" font-size="11">📝</text>'
        if day==start:cells+=f'<rect x="{x-1.5}" y="{y-1.5}" width="{sq+3}" height="{sq+3}" rx="5" fill="none" stroke="#e9f2ff" stroke-width="1.6"/>'
    if (start+datetime.timedelta(wk*7)).day<=7 or wk==0:
        cells+=f'<text x="{26+wk*(sq+gap)}" y="10" font-size="10" font-weight="800" fill="#8fa6c6">{["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][(start+datetime.timedelta(wk*7)).month-1]}</text>'
for dd in range(7):cells+=f'<text x="0" y="{16+dd*(sq+gap)+12}" font-size="10" font-weight="800" fill="#8fa6c6">{DOW[dd]}</text>'
hsvg=f'<svg viewBox="0 0 {26+13*(sq+gap)} {16+7*(sq+gap)}" width="100%" style="display:block">{cells}</svg>'
gm=[('oct',4,5),('nov',4,5),('dic',2,5)]
gbar=''.join(f'<div style="display:grid;grid-template-columns:34px 1fr 40px;gap:8px;align-items:center;font-size:12px;padding:3px 0"><span style="color:var(--ink2)">{m}</span><span style="display:flex;gap:3px">'+''.join(f'<i style="flex:1;height:10px;border-radius:3px;background:{"#ef4444" if k<n else "#1e2b44"}"></i>' for k in range(mxg))+f'</span><b>{n}/{mxg}</b></div>' for m,n,mxg in gm)
out+=ab('4 · LO QUE VIENE: 3 meses de un vistazo',
 seg3('Mes')+'<div class="hd"><b>Próximos 3 meses</b></div>'+
 '<div class="box2" style="padding:12px 10px">'+hsvg+'<div class="lgd"><span><i style="background:#ef4444"></i>● guardia</span><span><i style="background:#3b82f6;opacity:.6"></i>saliente</span><span><i style="background:#0aa6c4;opacity:.6"></i>trabajo</span><span><i style="background:#059669;opacity:.6"></i>fuerza</span><span><i style="background:#a855f7;opacity:.6"></i>libre</span><span><i style="background:#d97706"></i>vacaciones</span></div></div>'
 '<div class="box2"><div class="cap2">GUARDIAS POR MES</div>'+gbar+'</div>'
 '<div class="box2"><div class="cap2">CUENTA ATRÁS</div><div class="nx"><em>12 d</em><span>📝 Simulacro MIR<small>sáb 17 · la víspera es saliente: acuéstate 22:30</small></span></div><div class="nx"><em>19 d</em><span>🌿 Finde libre entero<small>24–25 oct · el siguiente, 31 oct</small></span></div><div class="nx"><em>78 d</em><span>🏖️ Vacaciones de Navidad<small>22–31 dic · 10 días</small></span></div></div>',
 'Para planificar a lo lejos: <b>13 semanas en una rejilla</b> tipo «contribuciones» (cada cuadrado un día; las guardias, intensas y con punto blanco, para que no dependa solo del color; las vacaciones en ámbar). Se ve el ritmo de la rotación y dónde caen los findes libres. Debajo, <b>guardias por mes contra tu tope</b> y una <b>cuenta atrás</b> que además te dice qué preparar (la víspera del simulacro es saliente).')

# ---------- 5 COMPARTIR HUECOS ----------
out+=ab('5 · MANDAR MIS HUECOS (desde Semana)',
 seg3('Semana')+'<div class="hd"><b>5 – 11 oct</b></div><div class="scrim"></div>'
 '<div class="sheet"><div class="grab"></div><div class="st">Mis huecos para quedar</div>'
 '<div class="ops"><span class="on">Esta semana</span><span>2 semanas</span><span class="sp" style="border:0;padding:0"></span><span class="on">Tardes</span><span>Todo</span></div>'
 '<div class="slot"><span class="k">✓</span><b>Miércoles 7</b><em>15:30 – 22:00</em></div>'
 '<div class="slot"><span class="k">✓</span><b>Jueves 8</b><em>15:30 – 17:00</em></div>'
 '<div class="slot"><span class="k">✓</span><b>Sábado 10</b><em>hasta las 21:00</em></div>'
 '<div class="slot"><span class="k">✓</span><b>Domingo 11</b><em>todo el día</em></div>'
 '<div class="bub">Esta semana puedo quedar: mié 7 desde las 15:30, jue 8 de 15:30 a 17, el sáb 10 hasta las 21 y el dom 11 cuando quieras 🙌<small>vista previa</small></div>'
 '<div class="bt" style="margin-top:12px"><span>Copiar</span><span class="p">Compartir…</span></div></div>',
 'Lo práctico para alguien con guardias: <b>«¿cuándo quedamos?» respondido en dos toques</b>. La app calcula tus huecos de verdad (sin guardias, salientes durmiendo, eventos ni la noche antes de una guardia) y escribe el mensaje; lo mandas por WhatsApp con el compartir del móvil. Se pueden desmarcar huecos antes de mandarlo. Nada sale del móvil salvo lo que tú compartas.')
open('/home/user/app-organizador-MIR/maquetas/calendario-nuevo.html','w').write(out)
print('ok', debt)
