import math
T={'gu':('#ef4444','Guardia','🩺'),'sa':('#3b82f6','Saliente','🚪'),'tr':('#0aa6c4','Trabajo','💼'),'fu':('#059669','Fuerza','💪'),'li':('#a855f7','Libre','🌿'),'va':('#d97706','Vacaciones','🏖️')}
oct_t={1:'tr',2:'fu',3:'li',4:'li',5:'gu',6:'sa',7:'tr',8:'tr',9:'fu',10:'li',11:'li',12:'gu',13:'sa',14:'fu',15:'gu',16:'sa',17:'tr',18:'li',19:'gu',20:'sa',21:'tr',22:'fu',23:'tr',24:'li',25:'li',26:'tr',27:'fu',28:'tr',29:'tr',30:'fu',31:'li',32:'li'}
DOW=['L','M','X','J','V','S','D'];DOWL=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
def dw(d):return (d+2)%7
TODAY=6
HAB=[('💧','Agua 2 L','#38bdf8','all'),('📚','Estudio','#f59e0b','study'),('💪','Entreno','#22c55e','gym'),('🧘','Estirar','#c084fc','all'),('🛌','Cama','#818cf8','sleep')]
import random
random.seed(7)
def due(h,d):
    t=oct_t[d]
    if h[3]=='all':return 'gu' != t or h[1].startswith('Agua')
    if h[3]=='study':return t in('tr','fu','li')
    if h[3]=='gym':return t=='fu' or (t=='li' and dw(d)==5)
    if h[3]=='sleep':return t!='gu'
def done(h,d):
    if d>TODAY or (d==TODAY): return d<TODAY
    r=random.random()
    if h[1]=='Estudio' and oct_t[d]=='sa':return False
    return r<0.78
# precompute done for october past days
DONE={}
for d in range(1,32):
    for h in HAB:
        DONE[(h[1],d)]=due(h,d) and (d<TODAY and (random.random()<(0.35 if (h[1]=='Estudio' and oct_t[d] in('sa',)) else 0.82)))
DONE[('Agua 2 L',6)]=True;DONE[('Estirar',6)]=False
def pct(d):
    ds=[h for h in HAB if due(h,d)]
    if not ds:return None
    return sum(1 for h in ds if DONE[(h[1],d)])/len(ds)
EV={6:[('8:30','Sesión clínica','📌')],7:[('19:00','Inglés','📌')],8:[('17:00','Dentista','🦷')],10:[('21:00','Cena con Lucía','🍽️')],12:[('19:00','Inglés','⚠')],13:[('8:30','Sesión clínica','📌')],14:[('19:00','Inglés','📌')],17:[('9:00','Simulacro MIR','📝')],19:[('19:00','Inglés','⚠')],21:[('19:00','Inglés','📌')],26:[('19:00','Inglés','📌')],28:[('19:00','Inglés','📌')]}
RUT={'tr':[('⏰','6:50'),('💼','8–15'),('📚','17:00 · 1 h'),('🛌','22:40')],
     'fu':[('⏰','6:50'),('💼','8–15'),('💪','18:00'),('📚','20:00 · 1 h'),('🛌','22:40')],
     'li':[('⏰','8:30'),('📚','10:00 · 2 h'),('💪','12:00'),('🛌','23:45')],
     'sa':[('🏠','8:30 a casa'),('😴','9:30–14'),('🚶','paseo'),('🛌','23:00')],
     'gu':[('⏰','7:30'),('📚','10:00 · 1 h'),('🩺','15→8')]}

base=open('/home/user/app-organizador-MIR/maquetas/plan-semana-mes.html').read()
base=base[base.index('<style>'):base.index('</style>')+8]
css='''<style>
.seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:var(--bg2);border:1px solid var(--line);border-radius:13px;padding:4px;margin:2px 0 10px}
.seg span{text-align:center;padding:7px 0;border-radius:10px;font-size:13px;font-weight:800;color:var(--ink2)}.seg .on{background:var(--card);color:var(--ink)}
.hd{display:flex;align-items:center;gap:8px;margin:0 0 10px}.hd b{font-size:19px;font-weight:900}.hd .ar{color:var(--ink2);font-size:18px;padding:0 4px}
.strip{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:10px}
.sp7{border-radius:12px;padding:6px 0 7px;text-align:center;background:color-mix(in srgb,var(--c) 15%,var(--card));border:1px solid var(--line);position:relative}
.sp7 .w{font-size:10px;font-weight:900;color:var(--ink2)}.sp7 .n{font-size:15px;font-weight:900}.sp7 .i{font-size:11px}
.sp7.on{border:2px solid var(--ink)}.sp7.pas{opacity:.55}
.sp7 svg{display:block;margin:2px auto 0}
.dc{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:16px;padding:10px 12px;margin-bottom:8px}
.dc.hoy{box-shadow:0 0 0 1.5px var(--brand) inset}
.dc .h{display:flex;align-items:center;gap:8px}.dc .h b{font-size:14.5px}.dc .h .t{font-size:11.5px;font-weight:800;color:var(--c)}.dc .h .r{margin-left:auto;font-size:11px;color:var(--ink2)}
.ev{display:flex;gap:9px;align-items:baseline;font-size:14px;margin-top:7px}.ev em{font-style:normal;font-weight:900;color:var(--brand);font-size:12.5px;min-width:38px}.ev.x em{color:#f87171}
.rut{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}.rut span{font-size:11px;padding:3px 7px;border-radius:7px;background:var(--bg2);color:var(--ink2);white-space:nowrap}.rut span.ok{color:var(--ink);background:color-mix(in srgb,#34d399 16%,var(--bg2))}
.hb{display:flex;gap:6px;margin-top:8px;align-items:center}.hb i{font-style:normal;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:13px;border:1.5px solid var(--line)}
.hb i.on{border-color:transparent}.hb small{margin-left:auto;font-size:11px;color:var(--ink2)}
.mini2{font-size:11.5px;color:var(--ink2)}
.box2{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px 14px;margin-bottom:10px}
.cap2{font-size:11px;font-weight:900;letter-spacing:.13em;color:var(--ink2);margin-bottom:8px}
.hm{display:grid;grid-template-columns:96px repeat(7,1fr) 34px;gap:4px;align-items:center;font-size:12px}
.hm .hh{font-size:10px;font-weight:900;color:var(--ink2);text-align:center}
.hm .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
.hm .c{height:24px;border-radius:7px;border:1.5px solid var(--line);display:grid;place-items:center;font-size:11px;font-weight:900;color:#04121c}
.hm .c.ex{border:0;background:repeating-linear-gradient(45deg,#1e2b44 0 3px,transparent 3px 6px)}
.hm .c.td{border-color:var(--ink)}
.hm .st{font-size:11.5px;font-weight:800;text-align:right}
.tip{background:color-mix(in srgb,#f59e0b 10%,var(--card));border:1px solid color-mix(in srgb,#f59e0b 40%,var(--line));border-radius:14px;padding:10px 12px;font-size:13px;line-height:1.45}
.tip b{color:var(--ink)}.bt{display:flex;gap:8px;margin-top:8px}.bt span{flex:1;text-align:center;padding:8px 0;border-radius:11px;border:1px solid var(--line);font-weight:800;font-size:12.5px}.bt .p{background:linear-gradient(90deg,var(--brand),var(--brand2));color:#04121c;border:0}
.mg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.mc{height:62px;border-radius:10px;background:color-mix(in srgb,var(--c) 13%,var(--card));border:1px solid var(--line);position:relative;padding:3px 4px;overflow:hidden}
.mc .n{font-size:11.5px;font-weight:900}.mc .i{position:absolute;right:4px;top:3px;font-size:10px}
.mc svg{position:absolute;left:3px;top:3px}
.mc .e{position:absolute;left:4px;right:3px;bottom:4px;font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc.sel{border:2px solid var(--ink)}.mc.out{opacity:.35}.mc.pas .e{opacity:.7}
.mdh{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:10px;font-weight:900;color:var(--ink2);text-align:center;margin-bottom:4px}
.hr31{display:grid;grid-template-columns:96px 1fr 48px;gap:8px;align-items:center;padding:6px 0;border-top:1px solid var(--line);font-size:12.5px}.hr31:first-of-type{border-top:0}
.hr31 .cells{display:grid;grid-template-columns:repeat(31,1fr);gap:1.5px}.hr31 .cells i{height:14px;border-radius:2px;background:#1e2b44}
.hr31 .cells i.ex{background:repeating-linear-gradient(45deg,#1e2b44 0 2px,transparent 2px 4px)}.hr31 .cells i.fut{background:#141d30}
.hr31 b{font-size:12px;text-align:right}
.rt{display:grid;grid-template-columns:28px 1fr;gap:8px;padding:8px 0;border-top:1px solid var(--line);font-size:13.5px}.rt:first-of-type{border-top:0}.rt em{font-style:normal;font-size:18px}
.chipsT{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.chipsT span{font-size:12px;font-weight:800;padding:6px 10px;border-radius:99px;border:1px solid var(--line);color:var(--ink2)}.chipsT .on{color:var(--ink);border-color:var(--c);background:color-mix(in srgb,var(--c) 16%,var(--card))}
.anc{display:grid;grid-template-columns:52px 1fr auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--line);font-size:14px}.anc:first-child{border-top:0}.anc em{font-style:normal;font-weight:900;color:var(--brand)}.anc small{color:var(--ink2);font-size:11.5px}
.legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--ink2);margin-top:6px}.legend span{display:flex;align-items:center;gap:5px}.legend i{width:11px;height:11px;border-radius:3px;display:inline-block}
</style>'''
def ring(p,size=22,stroke=3,col='#34d399'):
    r=(size-stroke)/2;c=2*math.pi*r
    if p is None:return f'<svg width="{size}" height="{size}"></svg>'
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}"><circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" fill="none" stroke="#1e2b44" stroke-width="{stroke}"/><circle cx="{size/2}" cy="{size/2}" r="{r:.1f}" fill="none" stroke="{col}" stroke-width="{stroke}" stroke-linecap="round" stroke-dasharray="{c:.1f}" stroke-dashoffset="{c*(1-p):.1f}" transform="rotate(-90 {size/2} {size/2})"/></svg>'
def ab(lbl,body,note,h=844):
    return f'<div class="wrap"><div class="lbl">{lbl}</div><div class="ab" style="height:{h}px"><div class="top"><b class="on">Calendario</b><span>Entreno</span><span>Comer</span><span>☰ Más</span></div>'+body+f'</div><p class="note">{note}</p></div>\n'
seg3=lambda o:'<div class="seg">'+''.join(f'<span{" class=on" if x==o else ""}>{x}</span>' for x in ['Mes','Semana','Hoy'])+'</div>'
out='<!doctype html><meta charset=utf-8><title>Calendario: rutinas y hábitos</title>\n'+base+css

# ---- 1 SEMANA agenda ----
week=list(range(5,12))
strip='<div class="strip">'+''.join(f'<div class="sp7{" on" if d==TODAY else ""}{" pas" if d<TODAY else ""}" style="--c:{T[oct_t[d]][0]}"><div class="w">{DOW[dw(d)]}</div><div class="n">{d}</div><div class="i">{T[oct_t[d]][2]}</div>{ring(pct(d) if d<=TODAY else 0.0001,20,2.6) if True else ""}</div>' for d in week)+'</div>'
def daycard(d,full=True):
    t=oct_t[d];col,lab,ic=T[t]
    hrs={'gu':'15→8','sa':'sales 8:00','tr':'8–15','fu':'8–15','li':''}[t]
    h=f'<div class="dc{" hoy" if d==TODAY else ""}" style="--c:{col}"><div class="h"><b>{"Hoy · " if d==TODAY else ""}{DOWL[dw(d)]} {d}</b><span class="t">{ic} {lab}{(" · "+hrs) if hrs else ""}</span><span class="r">{"" if d!=TODAY else ""}</span></div>'
    for tm,ti,e in EV.get(d,[]):
        h+=f'<div class="ev{" x" if e=="⚠" else ""}"><em>{tm}</em><span>{e} {ti}</span></div>'
    if not EV.get(d): h+='<div class="ev"><em style="color:var(--ink2)">—</em><span class="mini2">sin eventos</span></div>'
    rr=RUT[t];h+='<div class="rut">'+''.join(f'<span class="{"ok" if (d<TODAY or (d==TODAY and k<2)) else ""}">{a} {b}</span>' for k,(a,b) in enumerate(rr))+'</div>'
    hs=[x for x in HAB if due(x,d)]
    h+='<div class="hb">'+''.join(f'<i class="{"on" if DONE[(x[1],d)] else ""}" style="{("background:"+x[2]) if DONE[(x[1],d)] else ""}">{x[0]}</i>' for x in hs)+f'<small>{sum(1 for x in hs if DONE[(x[1],d)])}/{len(hs)} hábitos</small></div></div>'
    return h
out+=ab('1 · SEMANA: tu agenda, tu rutina y tus hábitos, día a día',
 seg3('Semana')+'<div class="hd"><span class="ar">‹</span><b>5 – 11 oct</b><span class="sp"></span><span class="mini2">hábitos 71 %</span><span class="ar">›</span></div>'+strip+daycard(6)+daycard(7)+daycard(8),
 'Arriba, <b>la semana en una tira</b>: cada día con su color, su icono y un <b>anillo de hábitos</b> que se llena según cumples. Debajo, <b>desde hoy</b> (lo pasado se pliega), cada día con tres cosas en este orden: <b>sus eventos</b> con hora (lo que no puedes olvidar), <b>su rutina</b> según el tipo de día (un saliente no tiene la misma que un día de trabajo; lo hecho sale en verde) y <b>los hábitos que tocan ese día</b>, a un toque para marcarlos.')

# ---- 2 SEMANA hábitos ----
rows=''
for h in HAB:
    cells=''
    for d in week:
        if not due(h,d): cells+='<span class="c ex" title="no toca"></span>'
        elif DONE[(h[1],d)]: cells+=f'<span class="c" style="background:{h[2]};border-color:{h[2]}">✓</span>'
        else: cells+=f'<span class="c{" td" if d==TODAY else ""}"></span>'
    streak={'Agua 2 L':12,'Estudio':4,'Entreno':6,'Estirar':2,'Cama':9}[h[1]]
    rows+=f'<span class="nm">{h[0]} {h[1]}</span>{cells}<span class="st">🔥{streak}</span>'
hm='<div class="hm"><span></span>'+''.join(f'<span class="hh">{DOW[dw(d)]}<br><span style="font-size:11px">{T[oct_t[d]][2]}</span></span>' for d in week)+'<span></span>'+rows+'</div>'
out+=ab('2 · SEMANA (bajando): hábitos que entienden tus guardias',
 seg3('Semana')+'<div class="hd"><b>Hábitos de la semana</b><span class="sp"></span><span class="mini2">12 de 17</span></div>'
 '<div class="box2">'+hm+'<div class="legend"><span><i style="background:#22c55e"></i>hecho</span><span><i style="border:1.5px solid #1e2b44"></i>toca</span><span><i style="background:repeating-linear-gradient(45deg,#1e2b44 0 3px,transparent 3px 6px)"></i>no toca (guardia, saliente…)</span></div></div>'
 '<div class="tip">💡 <b>Los salientes no estudias nunca</b> (0 de 4 este mes). ¿Quitamos el estudio esos días y lo subimos a 2 h en los libres? Así la racha no se rompe por la guardia.<div class="bt"><span>Dejarlo</span><span class="p">Ajustar</span></div></div>'
 '<div class="box2" style="margin-top:10px"><div class="cap2">SE MARCAN SOLOS</div><div class="rt"><em>💪</em><span>Entreno<div class="mini2">cuando cierras la sesión en Entreno</div></span></div><div class="rt"><em>🛌</em><span>Cama a su hora<div class="mini2">cuando anotas la noche en Sueño</div></span></div></div>',
 'Los hábitos <b>saben qué día es</b>: en guardia o saliente no te los pide (rayado, «no toca») y <b>la racha no se rompe por trabajar</b>. Una rejilla hábitos × días con su racha 🔥. La app <b>mira tus datos y te propone ajustes</b> («los salientes nunca estudias»). Y lo que la app ya sabe <b>se marca solo</b>: el entreno al cerrar la sesión, la cama al anotar la noche.')

# ---- 3 MES ----
cells=''
start_pad=dw(1)  # Oct 1 thu -> 3
for k in range(start_pad):
    cells+='<div class="mc out" style="--c:#1e2b44"></div>'
for d in range(1,32):
    t=oct_t[d];col=T[t][0]
    e=EV.get(d);et=(('⚠ ' if e[0][2]=='⚠' else '')+e[0][1].replace('Sesión clínica','S. clínica').replace('Simulacro MIR','Simulacro').replace('Cena con Lucía','Cena')) if e else ''
    p=pct(d) if d<TODAY else (pct(d) if d==TODAY else None)
    rg=ring(p,22,2.6) if d<=TODAY and p is not None else ''
    num=f'<span class="n" style="position:absolute;left:{9 if rg else 5}px;top:{7 if rg else 4}px;font-size:{10 if rg else 11.5}px">{d}</span>'
    cells+=f'<div class="mc{" sel" if d==TODAY else ""}{" pas" if d<TODAY else ""}" style="--c:{col}">{rg}{num}<span class="i">{T[t][2]}</span>{("<div class=e>"+et+"</div>") if et else ""}</div>'
while (start_pad+31)%7: cells+='<div class="mc out" style="--c:#1e2b44"></div>';start_pad+=1
sel='<div class="box2" style="margin-top:10px"><div class="hd" style="margin:0 0 4px"><b style="font-size:15px">Mar 6 · 🚪 Saliente</b><span class="sp"></span><span class="mini2">2/4 hábitos</span></div>'+''.join(f'<div class="ev"><em>{a}</em><span>{c} {b}</span></div>' for a,b,c in EV[6])+'<div class="ev"><em>9:30</em><span>😴 Dormir hasta las 14:00 <span class="mini2">· rutina</span></span></div><div class="ev"><em>18:00</em><span>🚶 Paseo <span class="mini2">· rutina</span></span></div></div>'
out+=ab('3 · MES: cada día con su anillo, y abajo el día que tocas',
 seg3('Mes')+'<div class="hd"><span class="ar">‹</span><b>Octubre</b><span class="sp"></span><span class="mini2">4 guardias · 9 eventos</span><span class="ar">›</span></div>'
 '<div class="mdh">'+''.join(f'<span>{x}</span>' for x in DOW)+'</div><div class="mg">'+cells+'</div>'+sel,
 'La cuadrícula de siempre, pero que dice más con menos: cada casilla <b>teñida de su tipo de día</b>, con <b>el primer evento escrito</b> (no solo un punto) y, en los días pasados, <b>un anillo con los hábitos cumplidos</b> alrededor del número. 62 px por casilla: <b>el mes y el día elegido caben en una pantalla</b>. Tocar un día lo abre abajo con sus eventos y su rutina; mantenerlo pulsado, su hoja de siempre.')

# ---- 4 MES: constancia ----
hr=''
for h in HAB:
    cs=''
    for d in range(1,32):
        if d>=TODAY+1 and d!=TODAY: cs+='<i class="fut"></i>';continue
        if not due(h,d): cs+='<i class="ex"></i>'
        elif DONE[(h[1],d)]: cs+=f'<i style="background:{h[2]}"></i>'
        else: cs+='<i></i>'
    hr+=f'<div class="hr31"><span class="nm" style="font-weight:700;white-space:nowrap;overflow:hidden">{h[0]} {h[1]}</span><div class="cells">{cs}</div><b>{["86","58","100","71","80"][HAB.index(h)]} %</b></div>'
# bedtime dot plot
bt={1:22.7,2:22.6,3:23.9,4:23.6,6:23.2,7:22.9,8:22.6}
W=300;Hh=110
def yb(v):return 10+(v-22)/2.5*(Hh-30)
svg=f'<svg viewBox="0 0 {W} {Hh}" width="100%"><rect x="20" y="{yb(22.5):.0f}" width="{W-24}" height="{yb(23.5)-yb(22.5):.0f}" fill="#34d399" fill-opacity=".10"/>'
for v,l in [(22,'22:00'),(23,'23:00'),(24,'0:00')]:
    svg+=f'<line x1="20" x2="{W-4}" y1="{yb(v):.0f}" y2="{yb(v):.0f}" stroke="#1e2b44"/><text x="0" y="{yb(v)+3:.0f}" font-size="8.5" fill="#8fa6c6">{l}</text>'
for d in range(1,32):
    x=24+(d-1)*(W-30)/30
    if oct_t[d]=='gu': svg+=f'<text x="{x:.0f}" y="{Hh-8}" text-anchor="middle" font-size="8">🩺</text>';continue
    if d>TODAY: continue
    v=bt.get(d)
    if v is None: continue
    ok=22.5<=v<=23.5
    svg+=f'<circle cx="{x:.0f}" cy="{yb(v):.0f}" r="4.5" fill="{"#818cf8" if ok else "#e3753a"}" stroke="#111a2b" stroke-width="2"/>'
svg+=f'<text x="{W-4}" y="{yb(22.5)-3:.0f}" text-anchor="end" font-size="8.5" fill="#34d399">tu hora: 22:30–23:30</text></svg>'
out+=ab('4 · MES (bajando): cómo vas con tus rutinas',
 seg3('Mes')+'<div class="hd"><b>Constancia de octubre</b><span class="sp"></span><span class="mini2">del 1 al 6</span></div>'
 '<div class="box2"><div class="cap2">HÁBITOS · CADA CUADRITO UN DÍA</div>'+hr+'<div class="legend"><span><i style="background:#22c55e"></i>hecho</span><span><i style="background:#1e2b44"></i>fallado</span><span><i style="background:repeating-linear-gradient(45deg,#1e2b44 0 2px,transparent 2px 4px)"></i>no tocaba</span></div></div>'
 '<div class="box2"><div class="cap2">¿A QUÉ HORA TE ACUESTAS?</div>'+svg+'<div class="legend"><span><i style="background:#818cf8;border-radius:50%"></i>dentro de tu hora</span><span><i style="background:#e3753a;border-radius:50%"></i>fuera</span><span>🩺 guardia (no cuenta)</span></div></div>'
 '<div class="box2" style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">🏆</span><div><b>Mejor racha: 12 días de agua</b><div class="mini2">la de estudio se corta los salientes: mira la propuesta en Semana</div></div></div>',
 'El mes para <b>ver si sigues tus rutinas</b>, no solo qué día es: <b>una fila por hábito con un cuadrito por día</b> (hecho, fallado o «no tocaba» por guardia) y su porcentaje; y <b>la rutina de sueño</b> como puntos: a qué hora te acostaste cada noche contra tu franja, con las guardias fuera de la cuenta. Se ve de un vistazo qué rutina se cae y qué días.')

# ---- 5 RUTINA por tipo de día ----
anc=[('6:50','⏰ Levantarse','alarma'),('8:00','💼 Trabajo','hasta las 15:00'),('17:00','📚 Estudio MIR','1 h · hábito'),('18:00','💪 Entreno','solo días de fuerza'),('22:00','📵 Pantallas fuera','30 min antes'),('22:40','🛌 A la cama','8 h 10 de sueño')]
out+=ab('5 · TU RUTINA, SEGÚN EL TIPO DE DÍA',
 seg3('Semana')+'<div class="hd"><span class="ar">‹</span><b>Rutina</b></div>'
 '<div class="chipsT">'+''.join(f'<span class="{"on" if k=="tr" else ""}" style="--c:{T[k][0]}">{T[k][2]} {T[k][1]}</span>' for k in ['tr','fu','li','gu','sa'])+'</div>'
 '<div class="box2"><div class="cap2">UN DÍA DE TRABAJO</div>'+''.join(f'<div class="anc"><em>{a}</em><span>{b}<br><small>{c}</small></span><span class="mini2">✎</span></div>' for a,b,c in anc)+'<div class="bt"><span>＋ añadir</span><span>copiar de «Fuerza»</span></div></div>'
 '<div class="tip">Esta rutina sale <b>cada día de trabajo</b> en Semana y en Hoy, y te avisa a su hora. Los salientes tienen la suya (dormir, paseo, cama pronto): no se mezclan.</div>',
 'La pieza que faltaba para «seguir rutinas»: <b>una rutina por tipo de día</b> (trabajo, fuerza, libre, guardia, saliente), con sus anclas a una hora. Se edita una vez y <b>se pinta sola en cada día de ese tipo</b> (lo que viste en las tarjetas de Semana) y en el reloj de Hoy. Al cambiar la rotación, la rutina se mueve con ella.')
open('/home/user/app-organizador-MIR/maquetas/calendario-rutinas.html','w').write(out)
print('ok')
