package es.guardias.lanzador;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;

/**
 * El vigía: un servicio en primer plano que pide la ubicación de vez en cuando (red cada 5 min y lo que
 * pidan otras apps) y se la pasa a Geovalla. Todo se guarda en el propio móvil (SharedPreferences privadas).
 */
public class Vigia extends Service implements LocationListener {
  static final String CANAL = "vigia";
  static final int ID = 1;
  static final long CADA = 5 * 60_000L;
  static final String PREFS = "sitios";
  static final String CLAVE = "g";

  private LocationManager lm;

  /* ---- ayudas compartidas con SitiosActivity y Arranque ---- */

  static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

  static Geovalla carga(Context c) { return Geovalla.deTexto(prefs(c).getString(CLAVE, "")); }

  static void guarda(Context c, Geovalla g) { prefs(c).edit().putString(CLAVE, g.aTexto()).apply(); }

  /** Lo que el usuario ha pedido con «Empezar a vigilar» / «Parar». */
  static boolean quiere(Context c) { return prefs(c).getBoolean("quiere", false); }

  static void quiere(Context c, boolean q) { prefs(c).edit().putBoolean("quiere", q).apply(); }

  /** Si el servicio está corriendo ahora (lo marca él mismo). */
  static boolean activa(Context c) { return prefs(c).getBoolean("activa", false); }

  static boolean fina(Context c) {
    return c.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
  }

  /** «Permitir todo el tiempo». Antes de Android 10 la ubicación precisa ya vale para segundo plano. */
  static boolean siempre(Context c) {
    if (!fina(c)) return false;
    return Build.VERSION.SDK_INT < 29
        || c.checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
  }

  /** Arranca el servicio si hay sitios y permisos; si no, no hace nada. Nunca falla. */
  static void arranca(Context c) {
    try {
      if (carga(c).sitios().isEmpty() || !siempre(c)) return;
      c.startForegroundService(new Intent(c, Vigia.class));
    } catch (RuntimeException e) { /* el sistema no deja arrancar ahora: se reintenta en la próxima apertura */ }
  }

  static void para(Context c) {
    try { c.stopService(new Intent(c, Vigia.class)); } catch (RuntimeException e) { /* nada */ }
  }

  /* ---- el servicio ---- */

  @Override public IBinder onBind(Intent i) { return null; }

  @Override public int onStartCommand(Intent i, int flags, int id) {
    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    NotificationChannel canal = new NotificationChannel(CANAL, getString(R.string.canal_nombre), NotificationManager.IMPORTANCE_LOW);
    canal.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
    nm.createNotificationChannel(canal);

    Intent abre = new Intent(this, SitiosActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    PendingIntent pi = PendingIntent.getActivity(this, 0, abre, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    Notification n = new Notification.Builder(this, CANAL)
        .setSmallIcon(android.R.drawable.ic_menu_mylocation)
        .setContentTitle(getString(R.string.notif_titulo))
        .setVisibility(Notification.VISIBILITY_SECRET)
        .setOngoing(true)
        .setContentIntent(pi)
        .build();
    try {
      if (Build.VERSION.SDK_INT >= 29) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
      else startForeground(ID, n);
    } catch (RuntimeException e) {   /* sin permiso de ubicación el sistema lo rechaza */
      stopSelf();
      return START_NOT_STICKY;
    }
    if (!fina(this) || carga(this).sitios().isEmpty()) {
      prefs(this).edit().putBoolean("activa", false).apply();
      stopSelf();
      return START_NOT_STICKY;
    }
    pide();
    prefs(this).edit().putBoolean("activa", true).apply();
    return START_STICKY;
  }

  private void pide() {
    if (lm == null) lm = (LocationManager) getSystemService(LOCATION_SERVICE);
    try {
      lm.removeUpdates(this);
      if (lm.getAllProviders().contains(LocationManager.NETWORK_PROVIDER)) {
        lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, CADA, 0f, this, Looper.getMainLooper());
      }
      lm.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, CADA, 0f, this, Looper.getMainLooper());
    } catch (RuntimeException e) { /* SecurityException (permiso retirado) o proveedor ausente */ }
  }

  @Override public void onDestroy() {
    try { if (lm != null) lm.removeUpdates(this); } catch (RuntimeException e) { /* nada */ }
    prefs(this).edit().putBoolean("activa", false).apply();
    super.onDestroy();
  }

  @Override public void onLocationChanged(Location l) {
    try {
      Geovalla g = carga(this);
      /* sin precisión conocida se trata como mala (Geovalla la descarta) */
      double prec = l.hasAccuracy() ? l.getAccuracy() : 9999;
      if (g.lectura(l.getLatitude(), l.getLongitude(), prec, System.currentTimeMillis())) guarda(this, g);
    } catch (RuntimeException e) { /* una lectura rara no tumba el servicio */ }
  }

  /* los otros tres métodos del oyente: en Android 28 no son opcionales */
  @Override public void onProviderEnabled(String p) { }
  @Override public void onProviderDisabled(String p) { }
  @Override public void onStatusChanged(String p, int s, Bundle b) { }
}
