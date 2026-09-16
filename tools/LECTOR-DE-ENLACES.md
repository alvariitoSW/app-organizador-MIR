# Lector de enlaces (5 minutos, gratis)

Sirve para una cosa: que al pegar el enlace de un TikTok en **Importar receta**, la app traiga
sola la descripción en vez de que la copies tú.

## ¿Lo necesito?

Puede que no. La app primero intenta pedírsela a la plataforma directamente. Prueba antes:

1. Abre la app en el móvil → **☰ Más → Cocina → 📥 Importar receta**.
2. Pega el enlace de un TikTok de cocina y dale a **traer la descripción**.

- **Sale la descripción** → ya está, no montes nada.
- **Sale «el navegador no ha dejado pedírselo… (no permite CORS)»** → sigue leyendo.

Ese aviso no es un fallo de la app. oEmbed (lo que devuelve la descripción) es público, pero el
navegador solo acepta la respuesta si el servidor da permiso, y eso lo decide la plataforma, no
tú. La solución es que la petición no la haga el navegador, sino una función tuya.

## Lo que hace (y lo que no)

Hace: recibe el enlace, le pregunta a la plataforma por la descripción y te la devuelve con el
permiso que el navegador pide.

**No hace:** bajarse el vídeo ni escucharlo. Si la receta solo se dice en voz alta y no está
escrita en ninguna parte, esto no la saca. Para esos casos: una captura de pantalla y «Que la lea
Claude», o copiar el comentario donde esté escrita.

## Pasos

1. Entra en <https://dash.cloudflare.com> y crea una cuenta. **No pide tarjeta.**
2. Menú lateral → **Workers & Pages** → **Create** → **Start with Hello World!** → **Deploy**.
3. Ponle un nombre, por ejemplo `recetas`. Te quedará una dirección tipo
   `https://recetas.TU-USUARIO.workers.dev`. Apúntala.
4. Dale a **Edit code**. Borra todo lo que haya y pega el contenido de
   [`worker-recetas.js`](worker-recetas.js). **Deploy**.
5. En la app: **☰ Más → Configuración → ⚙️ Ajustes → Lector de enlaces**. Pega ahí la dirección
   y dale a **probar**. Debe decirte que responde.
6. Vuelve a Importar receta y pega un enlace. Ahora sí.

El plan gratis da 100.000 peticiones al día. Vas a usar unas cuantas a la semana.

## Que solo la use tu app (opcional)

Tal cual, cualquiera que sepa la dirección puede pedirle descripciones de TikTok. No es grave
—solo devuelve datos públicos y únicamente de los sitios de la lista—, pero si quieres cerrarlo:

En el panel del Worker → **Settings** → **Variables and Secrets** → añade una variable
`ORIGEN` con el valor de la dirección de tu app (por ejemplo `https://TU-USUARIO.github.io`).
Vuelve a desplegar.

## Si algo falla

- **«No he podido hablar con tu lector»** → revisa que la dirección esté entera y con `https://`.
- **Responde con error 500** → vuelve al paso 4: probablemente el código quedó a medio pegar.
- **«ese enlace no trae descripción escrita»** → ese vídeo no lleva la receta escrita. Captura de
  pantalla y que la lea Claude, o copia el comentario.
- **Dejó de funcionar de repente** → las plataformas cambian sus páginas de vez en cuando. La
  parte de oEmbed es estable; la de reserva (`og:description`) es la frágil.

## Probar los cambios

```bash
npm run test:lector
```
