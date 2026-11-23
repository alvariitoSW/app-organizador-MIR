package es.guardias.lanzador;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** La pantalla «Sitios»: estado, los 3 sitios, las últimas visitas y los permisos. Vistas en código, como MainActivity. */
public class SitiosActivity extends Activity {
  static final int PEDIR = 7;
  static final int[] RADIOS = {100, 150, 250};
  static final long ESPERA_MS = 30_000L;
  static final float BUENA = 30f, MALA = 80f;
  static final int FONDO = Color.parseColor("#070b14"), TEXTO = Color.parseColor("#e6edf7"), SUAVE = Color.parseColor("#9fb0c8");

  private final Handler h = new Handler(Looper.getMainLooper());
  private LocationManager lm;
  private Location mejor;
  private boolean pidiendoSiempre;
  private int buscando;   /* n del sitio que se está fijando, 0 = ninguno */
  private final Runnable alAcabarse = () -> terminaBusqueda(true);
  private final LocationListener oyente = new LocationListener() {
    @Override public void onLocationChanged(Location l) {
      if (mejor == null || prec(l) < prec(mejor)) mejor = l;
      if (prec(mejor) <= BUENA) terminaBusqueda(true);
    }
    @Override public void onProviderEnabled(String p) { }
    @Override public void onProviderDisabled(String p) { }
    @Override public void onStatusChanged(String p, int s, Bundle b) { }
  };

  private static float prec(Location l) { return l.hasAccuracy() ? l.getAccuracy() : 9999f; }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    lm = (LocationManager) getSystemService(LOCATION_SERVICE);
  }

  @Override protected void onResume() {
    super.onResume();
    if (Vigia.quiere(this)) Vigia.arranca(this);   /* si el sistema lo mató, abrir esta pantalla lo revive */
    pinta();
  }

  @Override protected void onPause() {
    super.onPause();
    terminaBusqueda(false);
  }

  @Override public void onRequestPermissionsResult(int cod, String[] permisos, int[] res) {
    super.onRequestPermissionsResult(cod, permisos, res);
    /* «todo el tiempo» sin respuesta del sistema (algunas capas, como HyperOS): a la pantalla de ajustes de la app */
    if (pidiendoSiempre && !Vigia.siempre(this)) abreAjustes();
    pidiendoSiempre = false;
    if (Vigia.quiere(this)) Vigia.arranca(this);   /* si ya estaba pedido y ahora hay permisos */
    pinta();
  }

  /* ---------- pantalla ---------- */

  private void pinta() {
    Geovalla g = Vigia.carga(this);
    ZoneId zona = ZoneId.systemDefault();
    long ahora = System.currentTimeMillis();
    ScrollView sv = new ScrollView(this);
    sv.setBackgroundColor(FONDO);
    LinearLayout caja = new LinearLayout(this);
    caja.setOrientation(LinearLayout.VERTICAL);
    int p = dp(20);
    caja.setPadding(p, p, p, p);
    sv.addView(caja);

    /* arriba: la última entrada y si vigila */
    caja.addView(texto(ultimaEntrada(g, zona, ahora), 20, TEXTO));
    caja.addView(texto(estado(g, ahora), 15, SUAVE));
    if (Vigia.activa(this)) caja.addView(boton(getString(R.string.parar), v -> { Vigia.quiere(this, false); Vigia.para(this); pinta(); }));
    else caja.addView(boton(getString(R.string.empezar), v -> empezar()));

    /* los sitios */
    caja.addView(titulo(getString(R.string.sitios)));
    for (int n = 1; n <= 3; n++) {
      Geovalla.Sitio s = null;
      for (Geovalla.Sitio x : g.sitios()) if (x.n == n) s = x;
      final int num = n;
      final Geovalla.Sitio sitio = s;
      String nombre = getString(R.string.sitio_n, n);
      caja.addView(texto(s == null ? nombre + " · " + getString(R.string.sin_guardar)
          : nombre + " · " + getString(R.string.radio_m, (int) s.radio), 17, TEXTO));
      if (buscando == n) {
        caja.addView(texto(getString(R.string.buscando), 15, SUAVE));
      } else {
        caja.addView(boton(getString(R.string.estoy_aqui), v -> busca(num)));
      }
      if (s != null) {
        LinearLayout fila = new LinearLayout(this);
        fila.setOrientation(LinearLayout.HORIZONTAL);
        Button r = boton(getString(R.string.cambia_radio));
        r.setOnClickListener(v -> cambiaRadio(sitio));
        Button bo = boton(getString(R.string.borrar));
        bo.setOnClickListener(v -> borra(num));
        fila.addView(r, pesos());
        fila.addView(bo, pesos());
        caja.addView(fila);
      }
    }

    /* últimas visitas */
    caja.addView(titulo(getString(R.string.visitas)));
    List<Geovalla.Visita> vs = g.visitas();
    if (vs.isEmpty()) caja.addView(texto(getString(R.string.sin_visitas), 15, SUAVE));
    for (int i = vs.size() - 1; i >= 0 && i >= vs.size() - 10; i--) caja.addView(texto(visita(vs.get(i), zona), 15, TEXTO));

    /* permisos */
    caja.addView(titulo(getString(R.string.permisos)));
    caja.addView(permiso(getString(R.string.perm_precisa), Vigia.fina(this), v -> pideFina()));
    caja.addView(permiso(getString(R.string.perm_siempre), Vigia.siempre(this), v -> pideSiempre()));
    if (Build.VERSION.SDK_INT >= 33) {
      caja.addView(permiso(getString(R.string.perm_avisos),
          checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED,
          v -> requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, PEDIR)));
    }
    caja.addView(boton(getString(R.string.ajustes), v -> abreAjustes()));
    caja.addView(texto(getString(R.string.xiaomi), 15, TEXTO));
    caja.addView(texto(getString(R.string.privacidad), 14, SUAVE));
    setContentView(sv);
  }

  private String ultimaEntrada(Geovalla g, ZoneId zona, long ahora) {
    Geovalla.Visita ult = null;
    for (Geovalla.Visita v : g.visitas()) if (ult == null || v.entra > ult.entra) ult = v;
    if (ult == null) return getString(R.string.ultima_ninguna);
    ZonedDateTime e = Instant.ofEpochMilli(ult.entra).atZone(zona);
    String cuando = e.toLocalDate().equals(LocalDate.now(zona)) ? hora(e) : dia(e) + " " + hora(e);
    return getString(R.string.ultima_entrada, getString(R.string.sitio_n, ult.sitio), cuando);
  }

  private String estado(Geovalla g, long ahora) {
    boolean on = Vigia.activa(this);
    if (!on) return getString(R.string.vigilancia_parada);
    if (g.ultima() == 0) return getString(R.string.vigilancia_sin_lectura);
    long min = Math.max(0, (ahora - g.ultima()) / 60_000L);
    return getString(R.string.vigilancia_activa, (int) min);
  }

  private String visita(Geovalla.Visita v, ZoneId zona) {
    ZonedDateTime e = Instant.ofEpochMilli(v.entra).atZone(zona);
    String s = getString(R.string.sitio_n, v.sitio) + " · " + dia(e) + " · " + hora(e) + " → ";
    if (v.sale == 0) return s + getString(R.string.dentro);
    ZonedDateTime f = Instant.ofEpochMilli(v.sale).atZone(zona);
    return s + (f.toLocalDate().equals(e.toLocalDate()) ? hora(f) : dia(f) + " " + hora(f));
  }

  private static final Locale ES = Locale.forLanguageTag("es-ES");
  private static String dia(ZonedDateTime t) { return DateTimeFormatter.ofPattern("EEE dd/MM", ES).format(t); }
  private static String hora(ZonedDateTime t) { return DateTimeFormatter.ofPattern("HH:mm", ES).format(t); }

  /* ---------- gestos ---------- */

  private void empezar() {
    if (Vigia.carga(this).sitios().isEmpty()) { Toast.makeText(this, R.string.primero_un_sitio, Toast.LENGTH_LONG).show(); return; }
    if (!Vigia.fina(this)) { pideFina(); return; }
    if (!Vigia.siempre(this)) { pideSiempre(); return; }
    Vigia.quiere(this, true);
    Vigia.arranca(this);
    h.postDelayed(this::pinta, 800);   /* da un momento a que el servicio se marque como activo */
    pinta();
  }

  private void pideFina() {
    requestPermissions(new String[] {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, PEDIR);
  }

  /** «Todo el tiempo» se pide después de la precisa; en Android 11+ lleva a los ajustes de la app. */
  private void pideSiempre() {
    if (!Vigia.fina(this)) { pideFina(); return; }
    if (Build.VERSION.SDK_INT >= 29) {
      pidiendoSiempre = true;
      requestPermissions(new String[] {Manifest.permission.ACCESS_BACKGROUND_LOCATION}, PEDIR);
    }
  }

  private void abreAjustes() {
    try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); }
    catch (RuntimeException x) { /* sin pantalla de ajustes */ }
  }

  private void busca(int n) {
    if (!Vigia.fina(this)) { pideFina(); return; }
    terminaBusqueda(false);
    mejor = null;
    buscando = n;
    try {
      List<String> ps = lm.getAllProviders();
      if (ps.contains(LocationManager.GPS_PROVIDER)) lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0f, oyente, Looper.getMainLooper());
      if (ps.contains(LocationManager.NETWORK_PROVIDER)) lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1000, 0f, oyente, Looper.getMainLooper());
    } catch (RuntimeException e) {   /* SecurityException o proveedor ausente */
      buscando = 0;
      Toast.makeText(this, R.string.sin_lectura, Toast.LENGTH_LONG).show();
    }
    h.postDelayed(alAcabarse, ESPERA_MS);
    pinta();
  }

  /** Para la búsqueda; con guardar=true se queda con la mejor lectura. */
  private void terminaBusqueda(boolean guardar) {
    if (buscando == 0) return;
    int n = buscando;
    buscando = 0;
    h.removeCallbacks(alAcabarse);
    try { lm.removeUpdates(oyente); } catch (RuntimeException e) { /* nada */ }
    Location l = mejor;
    mejor = null;
    if (guardar) {
      if (l == null) Toast.makeText(this, R.string.sin_lectura, Toast.LENGTH_LONG).show();
      else {
        guardaSitio(n, l);
        if (prec(l) > MALA) Toast.makeText(this, getString(R.string.poca_precision, (int) prec(l)), Toast.LENGTH_LONG).show();
      }
    }
    pinta();
  }

  private void guardaSitio(int n, Location l) {
    Geovalla g = Vigia.carga(this);
    List<Geovalla.Sitio> nuevos = new ArrayList<>();
    double radio = RADIOS[1];
    for (Geovalla.Sitio s : g.sitios()) { if (s.n == n) radio = s.radio; else nuevos.add(s); }
    nuevos.add(new Geovalla.Sitio(n, l.getLatitude(), l.getLongitude(), radio));
    cambia(g, nuevos);
  }

  private void cambiaRadio(Geovalla.Sitio s) {
    Geovalla g = Vigia.carga(this);
    int sig = RADIOS[0];
    for (int i = 0; i < RADIOS.length; i++) if (RADIOS[i] == (int) s.radio) sig = RADIOS[(i + 1) % RADIOS.length];
    List<Geovalla.Sitio> nuevos = new ArrayList<>();
    for (Geovalla.Sitio x : g.sitios()) nuevos.add(x.n == s.n ? new Geovalla.Sitio(x.n, x.lat, x.lon, sig) : x);
    cambia(g, nuevos);
    pinta();
  }

  private void borra(int n) {
    Geovalla g = Vigia.carga(this);
    List<Geovalla.Sitio> nuevos = new ArrayList<>();
    for (Geovalla.Sitio x : g.sitios()) if (x.n != n) nuevos.add(x);
    cambia(g, nuevos);
    pinta();
  }

  private void cambia(Geovalla g, List<Geovalla.Sitio> nuevos) {
    g.cambiaSitios(nuevos, System.currentTimeMillis());
    Vigia.guarda(this, g);
    if (Vigia.quiere(this)) { if (nuevos.isEmpty()) Vigia.para(this); else Vigia.arranca(this); }
  }

  /* ---------- vistas ---------- */

  private TextView texto(String t, int sp, int color) {
    TextView v = new TextView(this);
    v.setText(t);
    v.setTextColor(color);
    v.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
    v.setLineSpacing(0, 1.2f);
    v.setPadding(0, dp(6), 0, dp(6));
    return v;
  }

  private TextView titulo(String t) {
    TextView v = texto(t, 18, TEXTO);
    v.setTypeface(v.getTypeface(), android.graphics.Typeface.BOLD);
    v.setPadding(0, dp(24), 0, dp(6));
    return v;
  }

  private View permiso(String nombre, boolean ok, View.OnClickListener al) {
    LinearLayout c = new LinearLayout(this);
    c.setOrientation(LinearLayout.VERTICAL);
    c.addView(texto((ok ? "✔ " : "✖ ") + nombre, 16, TEXTO));
    if (!ok) c.addView(boton(getString(R.string.dar), al));
    return c;
  }

  private Button boton(String t) {
    Button b = new Button(this);
    b.setText(t);
    b.setAllCaps(false);
    b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
    b.setMinHeight(dp(48));
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    lp.topMargin = dp(8);
    b.setLayoutParams(lp);
    return b;
  }

  private Button boton(String t, View.OnClickListener al) {
    Button b = boton(t);
    b.setOnClickListener(al);
    return b;
  }

  private LinearLayout.LayoutParams pesos() {
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
    lp.topMargin = dp(8);
    return lp;
  }

  private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }
}
