package es.guardias.lanzador;

import java.util.ArrayList;
import java.util.List;

/**
 * Los sitios y las visitas, sin nada de Android (se prueba con JUnit y con javac a secas).
 * Recibe lecturas de ubicación y decide cuándo se entra y se sale de un sitio:
 *  - se descartan las lecturas con precisión peor de 300 m;
 *  - dentro = a menos del radio; fuera = a más de radio×1,5 (histéresis, para que el borde no rebote);
 *  - entrar o salir exige 2 lecturas seguidas coherentes, y la hora es la de la primera de las dos.
 */
public final class Geovalla {
  public static final double PRECISION_MAX = 300;
  public static final double HISTERESIS = 1.5;
  public static final int LECTURAS = 2;
  public static final int MAX_VISITAS = 300;

  public static final class Sitio {
    public final int n; public final double lat, lon, radio;
    public Sitio(int n, double lat, double lon, double radio) { this.n = n; this.lat = lat; this.lon = lon; this.radio = radio; }
    boolean igual(Sitio o) { return o != null && n == o.n && lat == o.lat && lon == o.lon && radio == o.radio; }
  }

  /** sale = 0: sigue dentro. */
  public static final class Visita {
    public final int sitio; public final long entra; public long sale;
    public Visita(int sitio, long entra, long sale) { this.sitio = sitio; this.entra = entra; this.sale = sale; }
  }

  private final List<Sitio> sitios = new ArrayList<>();
  private final List<Visita> visitas = new ArrayList<>();
  private long ultima;
  /* candidato a cambio: sitio al que se entra (n), 0 = salir del actual, -1 = ninguno */
  private int cand = -1, candCuenta;
  private long candT;

  public List<Sitio> sitios() { return new ArrayList<>(sitios); }
  public List<Visita> visitas() { return new ArrayList<>(visitas); }
  public long ultima() { return ultima; }

  /** El sitio en el que se está ahora (su n), o 0 si en ninguno. */
  public int dentro() {
    if (visitas.isEmpty()) return 0;
    Visita v = visitas.get(visitas.size() - 1);
    return v.sale == 0 ? v.sitio : 0;
  }

  private Sitio sitio(int n) {
    for (Sitio s : sitios) if (s.n == n) return s;
    return null;
  }

  /** Cambia la lista de sitios. Si se estaba dentro de uno que cambia o desaparece, la visita se cierra en t. */
  public void cambiaSitios(List<Sitio> nuevos, long t) {
    int d = dentro();
    if (d != 0) {
      Sitio viejo = sitio(d), nuevo = null;
      for (Sitio s : nuevos) if (s.n == d) nuevo = s;
      if (viejo == null || !viejo.igual(nuevo)) cierra(t);
    }
    sitios.clear();
    sitios.addAll(nuevos);
    cand = -1; candCuenta = 0;
  }

  private void cierra(long t) {
    if (visitas.isEmpty()) return;
    Visita v = visitas.get(visitas.size() - 1);
    if (v.sale == 0) v.sale = Math.max(t, v.entra + 1);
  }

  /** Metros entre dos puntos (haversine). */
  public static double distancia(double lat1, double lon1, double lat2, double lon2) {
    double r = 6371000, p1 = Math.toRadians(lat1), p2 = Math.toRadians(lat2);
    double dp = p2 - p1, dl = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Una lectura de ubicación. Devuelve false si se descartó por poco precisa. */
  public boolean lectura(double lat, double lon, double precision, long t) {
    if (Double.isNaN(lat) || Double.isNaN(lon) || Double.isNaN(precision) || precision < 0 || precision > PRECISION_MAX) return false;
    ultima = t;
    int d = dentro();
    int quiere = -1;   /* -1: nada que cambiar */
    if (d != 0) {
      Sitio s = sitio(d);
      if (s == null) quiere = 0;
      else if (distancia(lat, lon, s.lat, s.lon) > s.radio * HISTERESIS) quiere = 0;
    } else {
      double mejor = Double.MAX_VALUE;
      for (Sitio s : sitios) {
        double m = distancia(lat, lon, s.lat, s.lon);
        if (m <= s.radio && m < mejor) { mejor = m; quiere = s.n; }
      }
    }
    if (quiere == -1) { cand = -1; candCuenta = 0; return true; }
    if (quiere == cand) candCuenta++; else { cand = quiere; candCuenta = 1; candT = t; }
    if (candCuenta >= LECTURAS) {
      if (cand == 0) cierra(candT);
      else {
        visitas.add(new Visita(cand, candT, 0));
        while (visitas.size() > MAX_VISITAS) visitas.remove(0);
      }
      cand = -1; candCuenta = 0;
    }
    return true;
  }

  /** Para guardarlo en el móvil: una línea por dato. */
  public String aTexto() {
    StringBuilder b = new StringBuilder();
    for (Sitio s : sitios) b.append("S|").append(s.n).append('|').append(s.lat).append('|').append(s.lon).append('|').append(s.radio).append('\n');
    for (Visita v : visitas) b.append("V|").append(v.sitio).append('|').append(v.entra).append('|').append(v.sale).append('\n');
    b.append("U|").append(ultima).append('\n');
    b.append("P|").append(cand).append('|').append(candCuenta).append('|').append(candT).append('\n');
    return b.toString();
  }

  /** Lo contrario de aTexto(). Tolerante: una línea rota se ignora. */
  public static Geovalla deTexto(String texto) {
    Geovalla g = new Geovalla();
    if (texto == null) return g;
    for (String linea : texto.split("\n")) {
      try {
        String[] p = linea.trim().split("\\|");
        switch (p[0]) {
          case "S": {
            Sitio s = new Sitio(Integer.parseInt(p[1]), Double.parseDouble(p[2]), Double.parseDouble(p[3]), Double.parseDouble(p[4]));
            if (Double.isNaN(s.lat) || Double.isNaN(s.lon) || s.radio <= 0) break;
            g.sitios.add(s); break;
          }
          case "V": g.visitas.add(new Visita(Integer.parseInt(p[1]), Long.parseLong(p[2]), Long.parseLong(p[3]))); break;
          case "U": g.ultima = Long.parseLong(p[1]); break;
          case "P": { int c = Integer.parseInt(p[1]), k = Integer.parseInt(p[2]); long t = Long.parseLong(p[3]); g.cand = c; g.candCuenta = k; g.candT = t; break; }
          default: break;
        }
      } catch (RuntimeException e) { /* línea rota: se ignora */ }
    }
    while (g.visitas.size() > MAX_VISITAS) g.visitas.remove(0);
    return g;
  }
}
