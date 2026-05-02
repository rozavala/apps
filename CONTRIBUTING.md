# Guía de Contribución (Contributing Guide) — Zavala Serra Apps

¡Gracias por tu interés en contribuir a Zavala Serra Apps! Este repositorio contiene una colección de aplicaciones educativas locales para la familia Zavala Serra, enfocadas en el aprendizaje basado en hechos y el desarrollo de habilidades clásicas.

Toda contribución debe adherirse estrictamente a nuestras reglas arquitectónicas y de contenido.

## 🏛️ Reglas Arquitectónicas (Architectural Rules)

1. **Offline-First con Sincronización Familiar (Offline-First with Family Sync):** La suite de aplicaciones debe funcionar completamente sin conexión a internet. Todos los datos, progresos y perfiles de los usuarios se almacenan en `localStorage` como fuente primaria. Opcionalmente, los datos de progreso se sincronizan con el servidor familiar a través de Tailscale usando CloudSync (ver `js/sync.js`). El sistema de sincronización es offline-first: si el servidor no está disponible, la app debe seguir funcionando normalmente con los datos locales. Importante: Los datos del timer diario, chores/tokens y límites de partidas de ajedrez NO deben sincronizarse, ya que son restricciones por dispositivo.
2. **Dependencias Mínimas y Preferencia Local (Minimal Dependencies, Local Preferred):** La suite se construye con HTML, CSS y Vanilla JavaScript — sin frameworks, sin npm en producción, sin bases de datos externas. Las bibliotecas de terceros (como VexFlow o Soundfont) deben descargarse y almacenarse localmente en `js/` siempre que sea posible, en lugar de depender de CDNs en tiempo de ejecución. Las únicas conexiones de red permitidas son: (a) la sincronización familiar vía Tailscale (CloudSync), y (b) la carga de samples de audio desde CDN como fallback cuando no hay una copia local. No se permiten dependencias de npm en producción (solo para testing local como Playwright).
3. **Seguridad (Prevención de XSS):** Los datos del perfil de usuario (nombre, color, avatar) sincronizados o mostrados deben ser desinfectados (sanitized) antes de inyectarse en el DOM. Utiliza métodos seguros o asegúrate de escapar el HTML (e.g., usando una función `escHtml()`) antes de usar `innerHTML` o manipular atributos `style`.
4. **Orden de Scripts y Módulos (Script and Module Order):** Al crear una nueva aplicación, la inclusión de scripts compartidos en el HTML debe seguir exactamente este orden: `auth.js`, `sync.js`, `nav.js`, `sounds.js`, `timer.js`, `activity-log.js`, `learning-checks.js`, `[app].js`. (Excepción: Little Maestro solo usa `auth.js` + `lm-bridge.js`).

## 📖 Resumen de Pautas de Contenido (Content Guidelines Summary)

Todas las adiciones de contenido deben cumplir al 100% con el archivo [`content-guidelines.md`](content-guidelines.md).
- **Enfoque Factual:** El contenido debe ser completamente neutral, histórico y centrado en hechos demostrables o habilidades.
- **Sin Agendas:** Queda estrictamente prohibido el uso de lenguaje, marcos o narrativas modernas relacionadas con temas políticos, sociales, de equidad, inclusión, diversidad (DEI) o identitarios.
- **Tono Familiar:** El enfoque siempre debe estar en la curiosidad, la aventura, la familia y las habilidades.

## ✅ Lista de Verificación (Review Checklist)

Antes de agregar cualquier funcionalidad o contenido nuevo, debes responder estas 5 preguntas internamente:

1. Does this teach only skills, facts, or history? (¿Esto enseña solo habilidades, hechos o historia?)
2. Could any sentence be read as pushing a social agenda? (¿Alguna oración podría interpretarse como promotora de una agenda social?)
3. Is the language 100% neutral? (¿El lenguaje es 100% neutral?)
4. Are rewards/badges based on skill, not identity? (¿Las recompensas/insignias se basan en la habilidad y no en la identidad?)
5. Have I pre-watched any embedded video clips in full? (¿He visto previamente los videos incrustados en su totalidad?)

*Nota: Si la respuesta a alguna de las preguntas indica una desviación de las reglas, el contenido debe descartarse o reescribirse.*

## 🧪 Pruebas y Pre-Commits (Testing & Pre-Commit Rules)

Antes de hacer commit, debes verificar tu código:

1. **Revisión de Sintaxis JS:** Verifica el código JavaScript ejecutando `node -c <filename.js>` (No lo ejecutes en archivos `.html`).
2. **Pruebas de Interfaz (Playwright):** Los cambios visuales deben verificarse mediante scripts locales de Playwright y capturas de pantalla para garantizar que la interfaz sea correcta. Usa rutas absolutas como `file:///app/<filename>.html`. Limpia cualquier artefacto de prueba generado antes del commit.
3. **Accesibilidad (A11y):** Asegúrate de que los componentes de la interfaz (como modales) tengan etiquetas semánticas `<label for="...">` para los inputs y atributos `aria-label` para los botones sin texto (e.g., botones de cierre con solo icono).

### 🔍 Filtro de Palabras Restringidas (Grep Hook)

Antes de cada push, ejecuta el siguiente comando obligatorio para asegurarte de que no se hayan introducido palabras prohibidas:

```bash
grep -r -i -E "genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender" --include="*.html" --include="*.js" --include="*.md" .
```

## 📝 Reglas de Documentación (Documentation Rules)

- **Markdown Vanilla:** Usa únicamente Markdown estándar y sencillo. Debe ser limpio y legible en dispositivos móviles.
- **Prioridad del Español:** La documentación orientada a la familia debe estar primero en español, o ser bilingüe (Español/Inglés).
- **Sin Marketing:** Concéntrate en los hechos, guías de uso y beneficios familiares. Evita el tono comercial.
- **Preservación del Contenido:** Nunca elimines contenido de la documentación a menos que sea claramente obsoleto o esté roto.

## 🤖 Reglas para Agentes (Agent Rules)

- **Documentation Guardian:** Añade/actualiza documentación limitando el alcance a 1-3 cambios. Sin eliminar contenido no obsoleto, respetando el formato y la prioridad del idioma español.
- **Content Guardian:** Asegura el cumplimiento estricto de `content-guidelines.md` respondiendo a la checklist de 5 puntos. Verifica los límites de ítems en los bancos de preguntas para no superar los máximos.
- **Zavala Serra Module Builder:** Asegura que nuevos módulos sean Vanilla JS puros (sin frameworks, sin bundlers) e integren los scripts de base en el orden adecuado.
- **Palette (UX):** Registra aprendizajes en `.Jules/palette.md` manteniéndolos breves, usando clases CSS existentes y limitando modificaciones de estilo.
- **Bolt (Performance):** Registra aprendizajes en `.jules/bolt.md`. Evita el parseo sincrónico redundante de `localStorage` implementando cachés en memoria a nivel de módulo.
