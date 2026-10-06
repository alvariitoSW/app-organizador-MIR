base=open('/home/user/app-organizador-MIR/maquetas/plan-semana-mes.html').read()
base=base[base.index('<style>'):base.index('</style>')+8]
css='''<style>
.ab{padding-top:10px}
.hd{display:flex;align-items:center;gap:8px;margin:2px 0 12px}.hd b{font-size:20px;font-weight:900}
.cap2{font-size:11px;font-weight:900;letter-spacing:.13em;color:var(--ink2);margin:14px 4px 6px}
.lst{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.li{display:flex;align-items:center;gap:11px;padding:12px 14px;border-top:1px solid var(--line);font-size:14.5px}.li:first-child{border-top:0}
.li .e{font-size:18px;width:24px;text-align:center}.li b{flex:1;font-weight:600}.li em{font-style:normal;font-size:12.5px;color:var(--ink2);text-align:right}.li .ch{color:var(--ink2)}
.li em.w{color:#fbbf24;font-weight:800}
.sw{width:40px;height:23px;border-radius:99px;background:#34d399;position:relative;flex:none}.sw::after{content:'';position:absolute;right:3px;top:3px;width:17px;height:17px;border-radius:50%;background:#04121c}
.sw.off{background:var(--line)}.sw.off::after{left:3px;right:auto;background:var(--ink2)}
.til{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ti{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:11px 12px}
.ti .t{display:flex;align-items:center;gap:7px;font-weight:800;font-size:14.5px}.ti .v{font-size:12.5px;color:var(--ink2);margin-top:4px}.ti .v b{color:var(--ink)}
.scrim{position:absolute;inset:0;background:rgba(2,4,10,.62)}
.dr{position:absolute;top:0;bottom:0;right:0;width:330px;background:var(--bg2);border-left:1px solid var(--line);padding:16px 14px}
.hb{display:flex;align-items:center;gap:10px;padding:11px 12px;border-top:1px solid var(--line)}.hb:first-child{border-top:0}
.hb .tg{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:16px;border:2px solid var(--line)}
.hb .tg.on{border-color:transparent}.hb .n{flex:1}.hb .n b{display:block;font-size:14.5px}.hb .n span{font-size:11.5px;color:var(--ink2)}
.hb .r{font-size:12.5px;font-weight:800}
.dots{display:flex;gap:3px;margin-top:5px}.dots i{width:12px;height:12px;border-radius:3px;background:var(--line)}.dots i.x{background:repeating-linear-gradient(45deg,var(--line) 0 2px,transparent 2px 4px)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);border-radius:22px 22px 0 0;padding:12px 16px 20px}
.grab{width:42px;height:4px;border-radius:4px;background:var(--line);margin:0 auto 12px}
.fld{background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:15px;margin-top:6px}
.chs{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.chs span{font-size:12.5px;font-weight:800;padding:7px 10px;border-radius:99px;border:1px solid var(--line);color:var(--ink2)}.chs .on{color:var(--ink);border-color:var(--brand);background:color-mix(in srgb,var(--brand) 14%,var(--card))}
.chs .off{text-decoration:line-through;opacity:.7}
.lab{font-size:11px;font-weight:900;letter-spacing:.12em;color:var(--ink2);margin-top:12px}
.btn{white-space:nowrap}
</style>'''
def ab(lbl,body,note):
    return f'<div class="wrap"><div class="lbl">{lbl}</div><div class="ab"><div class="top"><span>Calendario</span><span>Entreno</span><span>Comer</span><b class="on">☰ Más</b></div>'+body+f'</div><p class="note">{note}</p></div>\n'
out='<!doctype html><meta charset=utf-8><title>Ajustes y Más</title>\n'+base+css
# 1 drawer
tiles=[('✅','Hábitos','<b>2 de 4</b> hoy · 🔥 28'),('💶','Dinero','quedan <b>312 €</b> este mes'),('📚','Estudio','<b>3 h</b> esta semana'),('🌿','4:20','<b>2</b> esta semana'),('📌','Eventos','jue · <b>Dentista</b>'),('📝','Notas','<b>4</b> notas')]
dr='<div class="scrim"></div><div class="dr"><div class="hd"><b>Más</b></div><div class="til">'+''.join(f'<div class="ti"><div class="t">{a} {b}</div><div class="v">{c}</div></div>' for a,b,c in tiles)+'</div>'
dr+='<div class="lst" style="margin-top:12px"><div class="li"><span class="e">⚙️</span><b>Ajustes</b><em class="w">⚠ copia</em><span class="ch">›</span></div></div></div>'
out+=ab('1 · «MÁS»: cada cosa con lo que importa de ella',dr,
 'Antes: 9 entradas de texto y media pantalla vacía. Ahora <b>seis recuadros que ya dicen algo</b> (cuántos hábitos llevas hoy, lo que te queda del mes, las horas de estudio, el próximo evento) y <b>una sola entrada «Ajustes»</b> que junta Turno y rotación, Ajustes y Datos. Si falta la copia de seguridad, se avisa ahí.')
# 2 ajustes
sec=lambda t,rows:f'<div class="cap2">{t}</div><div class="lst">'+''.join(rows)+'</div>'
row=lambda e,b,em,cls='',sw=None:f'<div class="li"><span class="e">{e}</span><b>{b}</b>'+(f'<span class="sw{" off" if sw==0 else ""}"></span>' if sw is not None else f'<em class="{cls}">{em}</em><span class="ch">›</span>')+'</div>'
body='<div class="hd"><b>⚙️ Ajustes</b></div>'
body+=sec('TU CALENDARIO',[row('🔁','Turno y rotación','6 tipos · ciclo 4 sem'),row('🛏️','Horas de dormir','mínimo 8 h'),row('🚌','Ir y volver','20 min'),row('📅','Calendario del móvil','aviso 30 min')])
body+=sec('TÚ',[row('🧍','Perfil','179 cm · 95 kg'),row('🌾','Sin gluten','',sw=1),row('📍','Dónde estoy','Las Palmas')])
body+=sec('LA APP',[row('🎨','Aspecto','oscuro · franja'),row('🥗','Datos de alimentos','tabla local'),row('🔗','Lector de enlaces','',sw=0)])
body+=sec('TUS DATOS',[row('💾','Copia de seguridad','⚠ nunca','w'),row('📥','Importar','planning · horas'),row('🖨️','Exportar en texto','')])
out+=ab('2 · AJUSTES: una lista, cada cosa una vez',body,
 'Turno y rotación, Ajustes y Datos <b>en una sola pantalla</b>, en cuatro grupos (tu calendario, tú, la app, tus datos), y <b>cada ajuste una vez</b> con su valor a la derecha. Fuera: la tarjeta «Qué tienes encendido» que repetía los recuadros, los recuadros que solo mandaban a otra pantalla («está en Turno →», «está en Ajustes →»), «Copias» repetido, «Mi dieta» (de la cocina antigua), «Cómo usar la cocina» (desfasado) y la frase «Estructura editable…» del pie, que salía en todas las pantallas. Los interruptores se tocan aquí mismo. <b>1,1 + 0,8 + 0,8 pantallas → 1</b>.')
# 3 habitos
hbs=[('💧','Agua 2 L','todos los días','#38bdf8',True,'🔥 28','11111110'),('📚','Estudio','no en guardia ni saliente','#f59e0b',True,'🔥 4','1x011x1'),('💪','Entreno','se marca solo al entrenar · no en guardia','#22c55e',False,'🔥 6','x0x1x10'),('🛌','Cama a su hora','se marca solo al anotar la noche','#818cf8',False,'🔥 9','1110x11')]
h='<div class="hd"><b>✅ Hábitos</b><span class="sp"></span><span class="mini">2 de 4 hoy</span></div><div class="lst">'
for e,n,s,c,on,r,dots in hbs:
    d=''.join(f'<i class="{"x" if q=="x" else ""}" style="{("background:"+c) if q=="1" else ""}"></i>' for q in dots[:7])
    h+=f'<div class="hb"><span class="tg{" on" if on else ""}" style="{("background:"+c) if on else ""}">{e}</span><div class="n"><b>{n}</b><span>{s}</span><div class="dots">{d}</div></div><span class="r">{r}</span></div>'
h+='</div><div class="lst" style="margin-top:10px"><div class="li"><span class="e">＋</span><b>Nuevo hábito</b><span class="ch">›</span></div></div>'
h+='<div class="cap2">ESTE MES</div><div class="lst"><div class="li"><span class="e">💧</span><b>Agua</b><em>86 %</em></div><div class="li"><span class="e">📚</span><b>Estudio</b><em>58 % · <span style="color:#fbbf24">los salientes nunca</span></em></div><div class="li"><span class="e">💪</span><b>Entreno</b><em>100 %</em></div></div>'
out+=ab('3 · HÁBITOS: hoy primero, lo demás a un toque',h,
 'Arriba <b>los de hoy, a un toque</b> (el círculo se rellena), con lo que dice cada uno (cuándo no toca, si se marca solo) y sus últimos 7 días en puntitos (rayado = no tocaba). Debajo, el mes en porcentaje y lo que la app ve. Fuera: el anillo del «7 %», la semana repetida de cada hábito (ya está en Semana) y el formulario de crear siempre abierto, que ocupaba media pantalla. <b>1,9 pantallas → 1</b>.')
# 4 sheet
sh='<div class="hd"><b>✅ Hábitos</b></div><div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="hd" style="margin:0"><b style="font-size:18px">📚 Estudio</b></div>'
sh+='<div class="lab">NOMBRE</div><div class="fld">Estudio</div>'
sh+='<div class="lab">QUÉ DÍAS</div><div class="chs">'+''.join(f'<span class="on">{d}</span>' for d in ['L','M','X','J','V','S','D'])+'</div>'
sh+='<div class="lab">NO ME LO PIDAS LOS DÍAS DE</div><div class="chs"><span class="on">🩺 Guardia</span><span class="on">🚪 Saliente</span><span>💼 Trabajo</span><span>💪 Fuerza</span><span>🌿 Libre</span></div>'
sh+='<div class="lab">SE MARCA SOLO</div><div class="chs"><span class="on">No, a mano</span><span>💪 al entrenar</span><span>🛌 al anotar la noche</span></div>'
sh+='<div class="lab">COLOR</div><div class="chs">'+''.join(f'<span style="width:28px;height:28px;padding:0;border-radius:50%;background:{c};{"outline:2px solid #e9f2ff" if i==1 else ""}"></span>' for i,c in enumerate(['#38bdf8','#f59e0b','#22c55e','#c084fc','#f472b6','#818cf8']))+'</div>'
sh+='<div style="display:flex;gap:8px;margin-top:14px"><span class="btn" style="flex:1;text-align:center;padding:11px;border:1px solid var(--line);border-radius:12px;color:#f87171;font-weight:800">Borrar</span><span class="btn" style="flex:2;text-align:center;padding:11px;border-radius:12px;background:linear-gradient(90deg,var(--brand),var(--brand2));color:#04121c;font-weight:900">Guardar</span></div></div>'
out+=ab('4 · TOCAR UN HÁBITO: todo lo suyo en una hoja',sh,
 'Crear y editar en la misma hoja, que sube desde abajo. Y por fin se puede decir <b>«no me lo pidas los días de guardia / saliente»</b> y <b>«se marca solo»</b>, que ya funciona en Semana pero no había dónde ponerlo. Mantener pulsado un hábito abre esta hoja, como un día del Mes.')
open('/home/user/app-organizador-MIR/maquetas/ajustes-mas.html','w').write(out)
