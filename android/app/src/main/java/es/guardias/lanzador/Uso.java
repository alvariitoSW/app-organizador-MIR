package es.guardias.lanzador;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * La cuenta del uso, sin nada de Android (se prueba con JUnit y con javac a secas).
 * Recibe los eventos de UsageStatsManager.queryEvents ya copiados y devuelve el trozo
 * «#uso=…» que entiende usoEntrante() de app.js (el formato está documentado encima de esa función):
 *   {v:1, d:[{f:"AAAA-MM-DD", m:minutos, u:desbloqueos, q:"96 hex", a:[[nombre, minutos], … hasta 5]}]}
 */
public final class Uso {
  /* los mismos números que UsageEvents.Event */
  public static final int RESUMED = 1, PAUSED = 2, SCREEN_NON_INTERACTIVE = 16,
      KEYGUARD_SHOWN = 17, KEYGUARD_HIDDEN = 18, STOPPED = 23;
  /* usoEntrante() descarta el # entero si pasa de 12000 caracteres */
  public static final int MAX_HASH = 11900;
  static final long CUARTO = 15 * 60_000L;

  public static final class Ev {
    final long t; final int tipo; final String pkg;
    public Ev(long t, int tipo, String pkg) { this.t = t; this.tipo = tipo; this.pkg = pkg; }
  }

  /** Para el nombre visible de cada app (en Android, el PackageManager). */
  public interface Nombres { String de(String pkg); }

  private static final class Dia {
    final LocalDate f; final long ini, fin;
    final long[] q = new long[96]; final Map<String, Long> apps = new HashMap<>();
    long total; int u;
    Dia(LocalDate f, long ini, long fin) { this.f = f; this.ini = ini; this.fin = fin; }
  }

  /**
   * @param evs      eventos en orden de tiempo, desde el inicio de {@code desde}
   * @param desde    primer día que se pidió a Android
   * @param nDias    días pedidos (hasta hoy incluido; como mucho 14)
   * @param ahora    hora actual
   * @param ignorar  paquetes que no cuentan (esta app y la pantalla de inicio)
   * @return el trozo «#uso=…», o null si no hay ningún día completo que mandar
   */
  public static String hash(List<Ev> evs, LocalDate desde, int nDias, long ahora, ZoneId zona,
                            Set<String> ignorar, Nombres nombres) {
    List<Dia> dias = new ArrayList<>();
    for (int i = 0; i < nDias; i++) {
      LocalDate f = desde.plusDays(i);
      dias.add(new Dia(f, f.atStartOfDay(zona).toInstant().toEpochMilli(),
          f.plusDays(1).atStartOfDay(zona).toInstant().toEpochMilli()));
    }
    if (evs.isEmpty() || dias.isEmpty()) return null;

    String cur = null; long curIni = 0;
    for (Ev e : evs) {
      switch (e.tipo) {
        case RESUMED:
          if (cur != null) suma(dias, cur, curIni, e.t, ahora);
          if (ignorar.contains(e.pkg)) cur = null; else { cur = e.pkg; curIni = e.t; }
          break;
        case PAUSED: case STOPPED:
          if (cur != null && cur.equals(e.pkg)) { suma(dias, cur, curIni, e.t, ahora); cur = null; }
          break;
        case SCREEN_NON_INTERACTIVE: case KEYGUARD_SHOWN:
          if (cur != null) { suma(dias, cur, curIni, e.t, ahora); cur = null; }
          break;
        case KEYGUARD_HIDDEN: {  /* si se desbloquea es que estaba bloqueado: lo abierto se cierra (por si faltó su pausa) */
          if (cur != null) { suma(dias, cur, curIni, e.t, ahora); cur = null; }
          Dia d = dia(dias, e.t); if (d != null) d.u++;
          break;
        }
        default:
      }
    }
    if (cur != null) suma(dias, cur, curIni, ahora, ahora);

    /* Android borra lo antiguo (~7-10 días): el día del primer evento puede estar a medias y se
       descarta, y los anteriores no tienen datos. Mandar un 0 ahí pisaría lo que la web ya guardó. */
    long primero = evs.get(0).t;
    List<String> partes = new ArrayList<>();
    for (Dia d : dias) {
      if (d.ini < primero || d.ini > ahora) continue;
      partes.add(json(d, nombres));
    }
    /* que quepa: se quitan días por el más antiguo */
    while (!partes.isEmpty()) {
      String h = "#uso=" + encodeURIComponent("{\"v\":1,\"d\":[" + String.join(",", partes) + "]}");
      if (h.length() <= MAX_HASH) return h;
      partes.remove(0);
    }
    return null;
  }

  private static Dia dia(List<Dia> dias, long t) {
    for (Dia d : dias) if (t >= d.ini && t < d.fin) return d;
    return null;
  }

  /** Reparte [a, b) entre días y cuartos de hora, recortado a lo pedido y a «ahora». */
  private static void suma(List<Dia> dias, String pkg, long a, long b, long ahora) {
    a = Math.max(a, dias.get(0).ini);
    b = Math.min(b, Math.min(ahora, dias.get(dias.size() - 1).fin));
    while (a < b) {
      Dia d = dia(dias, a); if (d == null) return;
      int qi = (int) Math.min(95, (a - d.ini) / CUARTO);
      long qFin = qi == 95 ? d.fin : Math.min(d.fin, d.ini + (qi + 1) * CUARTO);
      long fin = Math.min(b, qFin), ms = fin - a;
      d.q[qi] += ms; d.total += ms; d.apps.merge(pkg, ms, Long::sum);
      a = fin;
    }
  }

  private static int min(long ms) { return (int) Math.round(ms / 60_000.0); }

  private static String json(Dia d, Nombres nombres) {
    StringBuilder q = new StringBuilder(96);
    for (long ms : d.q) q.append(Character.forDigit(Math.max(0, Math.min(15, min(ms))), 16));
    List<Map.Entry<String, Long>> top = new ArrayList<>(d.apps.entrySet());
    Collections.sort(top, (x, y) -> Long.compare(y.getValue(), x.getValue()));
    StringBuilder a = new StringBuilder();
    int n = 0;
    for (Map.Entry<String, Long> e : top) {
      int m = Math.min(1440, min(e.getValue()));
      if (m < 1 || n == 5) break;
      String nom = nombres.de(e.getKey());
      if (nom == null || nom.trim().isEmpty()) nom = e.getKey();
      if (nom.length() > 40) nom = nom.substring(0, 40);
      if (n++ > 0) a.append(',');
      a.append('[').append(texto(nom)).append(',').append(m).append(']');
    }
    return "{\"f\":\"" + d.f + "\",\"m\":" + Math.min(1440, min(d.total)) + ",\"u\":" + Math.min(3000, d.u)
        + ",\"q\":\"" + q + "\",\"a\":[" + a + "]}";
  }

  static String texto(String s) {
    StringBuilder b = new StringBuilder("\"");
    for (char c : s.toCharArray()) {
      if (c == '"' || c == '\\') b.append('\\').append(c);
      else if (c < 0x20 || c == 0x2028 || c == 0x2029) b.append(String.format("\\u%04x", (int) c));
      else b.append(c);
    }
    return b.append('"').toString();
  }

  /** Igual que encodeURIComponent de JavaScript (lo que deshace decodeURIComponent en la web). */
  static String encodeURIComponent(String s) {
    StringBuilder b = new StringBuilder();
    for (byte x : s.getBytes(StandardCharsets.UTF_8)) {
      int c = x & 0xff;
      if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
          || "-_.!~*'()".indexOf(c) >= 0) b.append((char) c);
      else b.append('%').append(Character.toUpperCase(Character.forDigit(c >> 4, 16)))
            .append(Character.toUpperCase(Character.forDigit(c & 15, 16)));
    }
    return b.toString();
  }

  /** El primer día a pedir: hoy menos (nDias-1), a medianoche en la zona del móvil. */
  public static LocalDate desde(long ahora, ZoneId zona, int nDias) {
    return Instant.ofEpochMilli(ahora).atZone(zona).toLocalDate().minusDays(nDias - 1);
  }
}
