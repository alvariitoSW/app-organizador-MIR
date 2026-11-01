package es.guardias.lanzador;

import android.app.Activity;
import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Process;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * La lanzadora (El Lanzador · K2). Al abrirse: si no tiene «Acceso al uso», lo pide; si lo tiene, lee
 * los eventos de uso de los últimos 14 días (queryEvents, sin nada en segundo plano), abre la web en
 * Brave con «#uso=…» y se cierra. Sin permiso de internet: los datos solo viajan dentro del móvil.
 */
public class MainActivity extends Activity {
  static final String WEB = "https://alvariitosw.github.io/app-organizador-MIR/index.html";
  static final String BRAVE = "com.brave.browser";
  static final int DIAS = 14;

  private boolean abriendo;

  @Override protected void onResume() {
    super.onResume();
    if (abriendo) return;
    if (!tieneAcceso()) { pantallaPermiso(); return; }
    abriendo = true;
    pantalla(getString(R.string.leyendo), null, null);
    new Thread(() -> {
      String h = null;
      try { h = leeUso(); } catch (RuntimeException e) { /* sin datos: se abre la app igual */ }
      final String hash = h;
      runOnUiThread(() -> abre(hash));
    }).start();
  }

  private boolean tieneAcceso() {
    AppOpsManager ops = (AppOpsManager) getSystemService(APP_OPS_SERVICE);
    int modo = Build.VERSION.SDK_INT >= 29
        ? ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getPackageName())
        : ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getPackageName());
    return modo == AppOpsManager.MODE_ALLOWED;
  }

  private String leeUso() {
    UsageStatsManager usm = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
    ZoneId zona = ZoneId.systemDefault();
    long ahora = System.currentTimeMillis();
    java.time.LocalDate desde = Uso.desde(ahora, zona, DIAS);
    long ini = desde.atStartOfDay(zona).toInstant().toEpochMilli();
    UsageEvents ue = usm.queryEvents(ini, ahora);
    List<Uso.Ev> evs = new ArrayList<>();
    UsageEvents.Event e = new UsageEvents.Event();
    while (ue.hasNextEvent()) {
      ue.getNextEvent(e);
      evs.add(new Uso.Ev(e.getTimeStamp(), e.getEventType(), e.getPackageName()));
    }
    Set<String> ignorar = new HashSet<>();
    ignorar.add(getPackageName());
    ignorar.add("com.android.systemui");
    ResolveInfo home = getPackageManager().resolveActivity(
        new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
    if (home != null && home.activityInfo != null) ignorar.add(home.activityInfo.packageName);
    final PackageManager pm = getPackageManager();
    return Uso.hash(evs, desde, DIAS, ahora, zona, ignorar, pkg -> {
      try { return pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString(); }
      catch (PackageManager.NameNotFoundException x) { return pkg; }
    });
  }

  /** Abre la web en Brave (donde están sus datos), nunca en el navegador por defecto sin avisar. */
  private void abre(String hash) {
    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(WEB + (hash == null ? "" : hash)));
    i.setPackage(BRAVE);
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    try {
      startActivity(i);
      finish();
    } catch (ActivityNotFoundException x) {
      abriendo = false;
      pantalla(getString(R.string.sin_brave), getString(R.string.abrir_otro), v -> {
        Intent o = new Intent(Intent.ACTION_VIEW, Uri.parse(WEB));
        o.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { startActivity(o); finish(); } catch (ActivityNotFoundException y) { /* sin navegador */ }
      });
    }
  }

  private void pantallaPermiso() {
    LinearLayout caja = pantalla(getString(R.string.pide_acceso), getString(R.string.dar_acceso), v -> {
      try {
        startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS,
            Uri.parse("package:" + getPackageName())));
      } catch (RuntimeException x) {
        startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS));
      }
    });
    Button sin = boton(getString(R.string.sin_datos));
    sin.setOnClickListener(v -> abre(null));
    caja.addView(sin);
  }

  private LinearLayout pantalla(String texto, String accion, android.view.View.OnClickListener alTocar) {
    LinearLayout caja = new LinearLayout(this);
    caja.setOrientation(LinearLayout.VERTICAL);
    caja.setGravity(Gravity.CENTER);
    int p = dp(24);
    caja.setPadding(p, p, p, p);
    caja.setBackgroundColor(Color.parseColor("#070b14"));
    TextView t = new TextView(this);
    t.setText(texto);
    t.setTextColor(Color.parseColor("#e6edf7"));
    t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
    t.setLineSpacing(0, 1.25f);
    caja.addView(t);
    if (accion != null) {
      Button b = boton(accion);
      b.setOnClickListener(alTocar);
      caja.addView(b);
    }
    setContentView(caja);
    return caja;
  }

  private Button boton(String texto) {
    Button b = new Button(this);
    b.setText(texto);
    b.setAllCaps(false);
    b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
    b.setMinHeight(dp(48));
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    lp.topMargin = dp(16);
    b.setLayoutParams(lp);
    return b;
  }

  private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }
}
