package es.guardias.lanzador;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/**
 * El widget de inicio (K4): 4 botones en 2×2. Cada uno lanza MainActivity con el extra «accion»
 * (anoche, gasto, entreno o comida); MainActivity lo añade al hash que abre en Brave (#accion=X, o
 * #uso=…&accion=X). Sin red ni segundo plano: no se refresca nunca por tiempo.
 */
public class Atajos extends AppWidgetProvider {
  static final String[] ACCIONES = {"anoche", "gasto", "entreno", "comida"};
  static final int[] BOTONES = {R.id.w_anoche, R.id.w_gasto, R.id.w_entreno, R.id.w_comida};

  @Override public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
    for (int id : ids) {
      RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_atajos);
      for (int i = 0; i < ACCIONES.length; i++) {
        Intent it = new Intent(ctx, MainActivity.class);
        it.setAction("es.guardias.lanzador.ACCION_" + ACCIONES[i]);   /* acción distinta: PendingIntents distintos */
        it.putExtra(MainActivity.EXTRA_ACCION, ACCIONES[i]);
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(ctx, i, it, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        v.setOnClickPendingIntent(BOTONES[i], pi);
      }
      mgr.updateAppWidget(id, v);
    }
  }
}
