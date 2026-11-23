package es.guardias.lanzador;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Tras encender el móvil o actualizar la app, vuelve a arrancar el vigía (si lo pediste y hay permisos). */
public class Arranque extends BroadcastReceiver {
  @Override public void onReceive(Context c, Intent i) {
    try {
      String a = i == null ? null : i.getAction();
      if (!Intent.ACTION_BOOT_COMPLETED.equals(a) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) return;
      if (Vigia.quiere(c)) Vigia.arranca(c);   /* arranca() ya mira sitios y «todo el tiempo» */
    } catch (RuntimeException e) { /* un receptor nunca debe fallar */ }
  }
}
