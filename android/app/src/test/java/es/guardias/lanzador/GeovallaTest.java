package es.guardias.lanzador;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.Test;

public class GeovallaTest {
  static final ZoneId Z = ZoneId.of("Europe/Madrid");
  static final double LAT = 40.0, LON = -3.0;
  /* un grado de latitud ≈ 111195 m: así se colocan puntos a N metros al norte del sitio */
  static double norte(double m) { return LAT + m / 111195.0; }

  static long t(int dia, int h, int m) {
    return LocalDateTime.of(2026, 11, dia, h, m).atZone(Z).toInstant().toEpochMilli();
  }

  static Geovalla con(double radio) {
    Geovalla g = new Geovalla();
    g.cambiaSitios(Collections.singletonList(new Geovalla.Sitio(1, LAT, LON, radio)), 0);
    return g;
  }

  @Test public void haversine() {
    assertEquals(111195, Geovalla.distancia(40, -3, 41, -3), 100);
    assertEquals(0, Geovalla.distancia(40, -3, 40, -3), 0.001);
  }

  @Test public void entraConDosLecturas() {
    Geovalla g = con(150);
    g.lectura(norte(50), LON, 20, t(23, 8, 2));
    assertEquals(0, g.dentro());
    g.lectura(norte(60), LON, 20, t(23, 8, 7));
    assertEquals(1, g.dentro());
    assertEquals(1, g.visitas().size());
    assertEquals(t(23, 8, 2), g.visitas().get(0).entra);   /* la hora de la primera */
    assertEquals(0, g.visitas().get(0).sale);
  }

  @Test public void unaLecturaAisladaNoCuenta() {
    Geovalla g = con(150);
    g.lectura(norte(50), LON, 20, t(23, 8, 2));
    g.lectura(norte(2000), LON, 20, t(23, 8, 7));   /* lejos: rompe la racha */
    g.lectura(norte(50), LON, 20, t(23, 8, 12));
    assertEquals(0, g.dentro());
    assertTrue(g.visitas().isEmpty());
  }

  @Test public void precisionMalaSeIgnora() {
    Geovalla g = con(150);
    g.lectura(norte(50), LON, 20, t(23, 8, 2));
    assertFalse(g.lectura(norte(5000), LON, 800, t(23, 8, 7)));   /* salto con 800 m de error: ni cuenta ni rompe */
    g.lectura(norte(55), LON, 20, t(23, 8, 12));
    assertEquals(1, g.dentro());
    assertEquals(t(23, 8, 12), g.ultima());
  }

  @Test public void reboteEnElBordeNoSale() {
    Geovalla g = con(150);
    g.lectura(norte(50), LON, 20, t(23, 8, 0));
    g.lectura(norte(50), LON, 20, t(23, 8, 5));
    assertEquals(1, g.dentro());
    g.lectura(norte(140), LON, 20, t(23, 8, 10));
    g.lectura(norte(160), LON, 20, t(23, 8, 15));
    g.lectura(norte(160), LON, 20, t(23, 8, 20));
    g.lectura(norte(140), LON, 20, t(23, 8, 25));
    assertEquals(1, g.dentro());
    assertEquals(0, g.visitas().get(0).sale);
  }

  @Test public void saleTrasDosLecturasConLaHoraDeLaPrimera() {
    Geovalla g = con(150);
    g.lectura(norte(10), LON, 20, t(23, 8, 2));
    g.lectura(norte(10), LON, 20, t(23, 8, 7));
    g.lectura(norte(300), LON, 20, t(23, 15, 10));
    assertEquals(1, g.dentro());   /* una sola lectura fuera no basta */
    g.lectura(norte(320), LON, 20, t(23, 15, 15));
    assertEquals(0, g.dentro());
    assertEquals(t(23, 15, 10), g.visitas().get(0).sale);
  }

  @Test public void visitaQueCruzaMedianoche() {
    Geovalla g = con(150);
    g.lectura(norte(10), LON, 20, t(23, 22, 0));
    g.lectura(norte(10), LON, 20, t(23, 22, 5));
    g.lectura(norte(400), LON, 20, t(24, 6, 30));
    g.lectura(norte(400), LON, 20, t(24, 6, 35));
    Geovalla.Visita v = g.visitas().get(0);
    assertEquals(t(23, 22, 0), v.entra);
    assertEquals(t(24, 6, 30), v.sale);
    assertTrue(v.sale > v.entra);
  }

  @Test public void textoIdaYVuelta() {
    Geovalla g = con(250);
    g.lectura(norte(10), LON, 20, t(23, 8, 2));
    g.lectura(norte(10), LON, 20, t(23, 8, 7));
    g.lectura(norte(500), LON, 20, t(23, 9, 0));
    String txt = g.aTexto();
    Geovalla h = Geovalla.deTexto(txt + "V|basura\nZ|1\nS|x|y\n\n");   /* líneas rotas: se ignoran */
    assertEquals(txt, h.aTexto());
    assertEquals(1, h.sitios().size());
    assertEquals(250, h.sitios().get(0).radio, 0);
    assertEquals(1, h.dentro());
    assertEquals(t(23, 9, 0), h.ultima());
    assertEquals(0, Geovalla.deTexto(null).visitas().size());
  }

  @Test public void topeDe300() {
    Geovalla g = con(150);
    long base = t(1, 0, 0);
    for (int i = 0; i < 320; i++) {
      long ini = base + i * 3_600_000L;
      g.lectura(norte(10), LON, 20, ini);
      g.lectura(norte(10), LON, 20, ini + 60_000L);
      g.lectura(norte(500), LON, 20, ini + 1_200_000L);
      g.lectura(norte(500), LON, 20, ini + 1_260_000L);
    }
    List<Geovalla.Visita> v = g.visitas();
    assertEquals(300, v.size());
    assertEquals(base + 20 * 3_600_000L, v.get(0).entra);   /* se fueron las 20 más antiguas */
    assertEquals(300, Geovalla.deTexto(g.aTexto()).visitas().size());
  }

  @Test public void cambiarOBorrarSitiosCierraLaVisita() {
    Geovalla g = con(150);
    g.lectura(norte(10), LON, 20, t(23, 8, 2));
    g.lectura(norte(10), LON, 20, t(23, 8, 7));
    assertEquals(1, g.dentro());
    List<Geovalla.Sitio> mismo = new ArrayList<>(g.sitios());
    g.cambiaSitios(mismo, t(23, 9, 0));
    assertEquals(1, g.dentro());   /* no cambió nada: sigue dentro */
    g.cambiaSitios(new ArrayList<Geovalla.Sitio>(), t(23, 10, 0));
    assertEquals(0, g.dentro());
    assertEquals(t(23, 10, 0), g.visitas().get(0).sale);
  }
}
