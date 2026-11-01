package es.guardias.lanzador;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.Test;

public class UsoTest {
  static final ZoneId Z = ZoneId.of("Europe/Madrid");
  static final LocalDate D0 = LocalDate.of(2026, 10, 20);
  static final Set<String> IGN = new HashSet<>(Collections.singletonList("home"));

  static long t(int dia, int h, int m) {
    return LocalDateTime.of(D0.plusDays(dia), java.time.LocalTime.of(h, m)).atZone(Z).toInstant().toEpochMilli();
  }

  static String json(List<Uso.Ev> evs, long ahora) {
    String h = Uso.hash(evs, D0, 14, ahora, Z, IGN, p -> p.equals("wa") ? "WhatsApp \"á\"" : null);
    if (h == null) return null;
    assertTrue(h.startsWith("#uso="));
    assertTrue(h.length() <= 12000);
    return URLDecoder.decode(h.substring(5), StandardCharsets.UTF_8);
  }

  static String q(int... pares) { /* posición, valor */
    char[] c = new char[96];
    java.util.Arrays.fill(c, '0');
    for (int i = 0; i < pares.length; i += 2) c[pares[i]] = Character.forDigit(pares[i + 1], 16);
    return new String(c);
  }

  @Test public void cuentaMinutosDesbloqueosCuartosYApps() {
    List<Uso.Ev> evs = new ArrayList<>();
    evs.add(new Uso.Ev(t(0, 9, 0), Uso.RESUMED, "wa"));            // día 0: a medias, no se manda
    evs.add(new Uso.Ev(t(0, 9, 40), Uso.SCREEN_NON_INTERACTIVE, null));
    evs.add(new Uso.Ev(t(1, 10, 0), Uso.KEYGUARD_HIDDEN, null));
    evs.add(new Uso.Ev(t(1, 10, 0), Uso.RESUMED, "wa"));
    evs.add(new Uso.Ev(t(1, 10, 20), Uso.RESUMED, "home"));        // la pantalla de inicio corta y no cuenta
    evs.add(new Uso.Ev(t(1, 10, 25), Uso.RESUMED, "yt"));
    evs.add(new Uso.Ev(t(1, 10, 35), Uso.SCREEN_NON_INTERACTIVE, null));
    String j = json(evs, t(2, 8, 0));
    assertTrue(j, j.startsWith("{\"v\":1,\"d\":[{\"f\":\"2026-10-21\",\"m\":30,\"u\":1,\"q\":\""
        + q(40, 15, 41, 10, 42, 5) + "\",\"a\":[[\"WhatsApp \\\"á\\\"\",20],[\"yt\",10]]}"));
    assertTrue(j, j.contains("{\"f\":\"2026-10-22\",\"m\":0,\"u\":0,"));
    assertTrue(j, !j.contains("2026-10-20") && !j.contains("2026-10-23"));
  }

  @Test public void partePorMedianoche() {
    List<Uso.Ev> evs = new ArrayList<>();
    evs.add(new Uso.Ev(t(0, 12, 0), Uso.KEYGUARD_SHOWN, null));
    evs.add(new Uso.Ev(t(1, 23, 50), Uso.RESUMED, "wa"));
    evs.add(new Uso.Ev(t(2, 0, 20), Uso.PAUSED, "wa"));
    String j = json(evs, t(2, 9, 0));
    assertTrue(j, j.contains("\"f\":\"2026-10-21\",\"m\":10,\"u\":0,\"q\":\"" + q(95, 10)));
    assertTrue(j, j.contains("\"f\":\"2026-10-22\",\"m\":20,\"u\":0,\"q\":\"" + q(0, 15, 1, 5)));
  }

  @Test public void sinEventosNoMandaNada() {
    assertNull(json(new ArrayList<>(), t(13, 9, 0)));
  }

  @Test public void siNoCabeQuitaLosDiasMasAntiguos() {
    List<Uso.Ev> evs = new ArrayList<>();
    evs.add(new Uso.Ev(t(0, 0, 0), Uso.KEYGUARD_SHOWN, null));
    for (int d = 0; d < 14; d++)
      for (int a = 0; a < 5; a++) {
        evs.add(new Uso.Ev(t(d, 10 + a, 0), Uso.RESUMED, "app" + a));
        evs.add(new Uso.Ev(t(d, 10 + a, 30), Uso.PAUSED, "app" + a));
      }
    String h = Uso.hash(evs, D0, 14, t(13, 23, 0), Z, IGN, p -> "ñññññññññññññññññññññññññññññññññññññññññññ" + p);
    assertTrue(h.length() <= Uso.MAX_HASH);
    String j = URLDecoder.decode(h.substring(5), StandardCharsets.UTF_8);
    assertTrue(j, j.contains("2026-11-02") && !j.contains("2026-10-20"));
  }

  @Test public void codificaComoEncodeURIComponent() {
    assertEquals("%7B%22a%22%3A%22%C3%A1%20b%2B%22%7D-_.!~*'()", Uso.encodeURIComponent("{\"a\":\"á b+\"}-_.!~*'()"));
  }
}
