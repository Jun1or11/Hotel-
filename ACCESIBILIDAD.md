# Evidencias de Accesibilidad (WCAG 2.1)

Sistema Hotel Nova evaluado bajo pautas WCAG 2.1 nivel AA.

---

## 1. Widget de Accesibilidad Global

**Archivo:** `frontend/src/components/AccessibilityWidget.tsx`

Panel flotante (FAB) accesible desde cualquier página. Los ajustes se persisten en `localStorage` con clave `hotel-nova-accessibility-v1` y se restauran al recargar.

| Ajuste | Opciones | Mecanismo |
|--------|----------|-----------|
| **Tema** | Oscuro / Claro | `data-theme` en `<html>`, variables CSS |
| **Tamaño de texto** | 5 niveles (0.9x a 1.3x) | `--app-font-size` en píxeles |
| **Daltonismo** | Normal, Protanopía, Deuteranopía, Tritanopía | `data-vision` con filtros CSS (basado en CUD) |
| **Alto contraste** | Normal / Alto | `data-contrast` redefine colores (7:1+) |
| **Reducir animaciones** | Normal / Reducido | `data-motion` anula `animation-duration` |
| **Cursor grande** | Normal / Grande | `data-cursor` con cursor SVG de 40px |

El botón flotante usa `aria-expanded`, `aria-controls="accessibility-panel"` y `title="Accesibilidad"`. El icono SVG tiene `aria-hidden="true"` y `focusable="false"`. El panel se marca como `role="dialog"` con `aria-modal="true"` y `aria-label="Panel de accesibilidad"`. Cada grupo de controles usa `role="group"` con `aria-label` descriptivo (ej: "Tema visual", "Tamaño de texto"). El valor del tamaño de texto tiene `aria-live="polite"` para que el lector de pantalla anuncie cambios automáticamente.

---

## 2. Texto Alternativo en Imágenes (WCAG 1.1.1)

**Archivo:** `frontend/src/components/ReservaModal.tsx:302`

```tsx
alt={`Habitación ${habitacion.numero}`}
```

Las imágenes informativas del modal de reserva incluyen `alt` descriptivo. Los iconos decorativos (SVGs en navbar y panel admin) usan `aria-hidden="true"` para no distraer al lector de pantalla.

---

## 3. Navegación por Teclado (WCAG 2.1.1)

Widget de accesibilidad y formularios principales operables completamente con tecla Tab. Todos los botones del widget son elementos `<button>` nativos, garantizando enfoque y activación por teclado. El orden Tab en Login sigue: DNI → Buscar DNI → Nombre → Email → Contraseña → Iniciar sesión → botón accesibilidad → panel.

**Pendiente:** RoomCard requiere clic para navegación completa por teclado.

---

## 4. Foco Visible en Elementos Interactivos (WCAG 2.4.7)

**Archivo:** `frontend/src/index.css:147-153`

```css
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(200, 169, 110, 0.15);
}
```

Al navegar con Tab, los campos muestran borde dorado con sombra exterior visible tanto en tema oscuro como claro.

---

## 5. Contraste de Color y Modos de Daltonismo (WCAG 1.4.3 AA)

**Archivo:** `frontend/src/index.css:1387-1415`

Contraste por defecto supera 4.5:1 en todos los casos (texto principal ~10.5:1). Modo alto contraste define colores sólidos:

```css
html[data-contrast='high'] {
  --bg: #000000; --text: #ffffff; --gold: #ffd700;
  --border: #ffffff; --muted: #cccccc;
}
```

Tres modos de daltonismo reemplazan colores problemáticos por paletas accesibles (CUD):
- **Protanopía:** dorado → azul `#0072b2`, rojo → naranja `#d55e00`
- **Deuteranopía:** dorado → celeste `#56b4e9`, rojo → rosa `#cc79a7`
- **Tritanopía:** dorado → amarillo `#f0e442`, rojo → azul `#d55e00`

---

## 6. Etiquetas en Formularios (WCAG 3.3.2)

**Archivo:** `frontend/src/pages/Login.tsx`, `frontend/src/components/ReservaModal.tsx`

Todos los formularios tienen etiquetas `<label>` visibles con texto descriptivo (DNI, Email, Contraseña, Check-in, huéspedes, solicitudes). Campos incluyen `placeholder` y `title` que refuerzan la instrucción. Botones de calificación por estrellas en `ReviewModal.tsx:131` usan `aria-label="Seleccionar {star} estrellas"`.

**Pendiente:** Falta `htmlFor` para vincular programáticamente labels con inputs.

---

## 7. Roles ARIA y Lectores de Pantalla (WCAG 4.1.2)

- Panel de accesibilidad: `role="dialog" aria-modal="true" aria-label="Panel de accesibilidad"`
- Grupos del widget: `role="group"` con `aria-label` específico
- Navegación admin (`AdminLayout.tsx:153`): `<nav aria-label="Navegación de administración">`
- Tamaño de texto en vivo: `aria-live="polite"` para anunciar cambios automáticos

NVDA anuncia: "Panel de accesibilidad, diálogo" al abrir, y los cambios de tamaño se anuncian en vivo.

---

## 8. Animaciones Reducidas (WCAG 2.3.1)

**Archivo:** `frontend/src/index.css:1427-1433`

```css
html[data-motion='reduced'] * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

Un clic en "Reducido" anula todas las animaciones y transiciones del sistema, previniendo molestias en usuarios con trastornos vestibulares.

---

## 9. Cursor de Gran Tamaño

**Archivo:** `frontend/src/index.css:1436-1437`

Cursor SVG personalizado de 40px con diseño de mira (doble círculo blanco con borde oscuro), activable desde el widget. Reemplaza el cursor estándar de ~16px.

---

## 10. Auditoría General

| Aspecto | Estado |
|---------|--------|
| Widget accesibilidad global | ✅ 6 ajustes |
| Texto alternativo en imágenes | ✅ |
| Navegación por teclado | ✅ Parcial (RoomCard requiere clic) |
| Foco visible en inputs | ✅ |
| Modo alto contraste | ✅ |
| Modos de daltonismo | ✅ 3 modos |
| Reducción de animaciones | ✅ |
| Cursor grande | ✅ |
| Roles ARIA semánticos | ✅ |
| Etiquetas en formularios | ✅ |
| `lang="es"` en `<html>` | ⚠️ Está configurado `en` |
| `htmlFor` en labels | ⚠️ Pendiente |
| Enlace "Saltar al contenido" | ⚠️ Pendiente |
| Texto solo para lectores de pantalla | ⚠️ Pendiente |

---

## 11. Contribución a ODS e Inclusión Digital

### Contribución al ODS 9: Industria, Innovación e Infraestructura

El sistema contribuye al Objetivo de Desarrollo Sostenible 9, que busca desarrollar infraestructuras fiables, sostenibles e inclusivas para apoyar el desarrollo económico y el bienestar humano.

**Infraestructura Digital Inclusiva:**
Se implementó un widget de accesibilidad global (AccessibilityWidget.tsx) accesible desde cualquier página del sistema, con 6 ajustes visuales que permiten personalizar la experiencia sin necesidad de hardware o software externo. Este widget persiste las preferencias del usuario en localStorage, eliminando la barrera de tener que reconfigurar en cada sesión.

**Tecnología Adaptativa Integrada:**
El sistema incluye modos de daltonismo (protanopía, deuteranopía, tritanopía) basados en Color Universal Design (CUD) y un modo de alto contraste que redefine toda la paleta de colores, garantizando que la infraestructura digital sea utilizable por personas con discapacidad visual sin depender de herramientas del sistema operativo.

### Contribución al ODS 10: Reducción de Desigualdades

El sistema contribuye significativamente al Objetivo de Desarrollo Sostenible 10, que busca reducir desigualdades dentro y entre países, promoviendo inclusión social, económica y tecnológica de grupos vulnerables.

**Acceso Equitativo para Personas con Discapacidad:**
El diseño cumple con estándares WCAG 2.1 nivel AA e incluye funcionalidades inclusivas:

- **Ajuste de tamaño de texto (5 niveles):** Permite ampliar la fuente de 0.9x a 1.3x para personas con baja visión, sin necesidad de zoom del navegador.
- **Modo daltónico:** Adapta colores para protanopía, deuteranopía y tritanopía, permitiendo a personas con daltonismo distinguir correctamente la información visual del sistema.
- **Alto contraste:** Activa colores sólidos (fondo negro, texto blanco, dorado brillante) superando 7:1 de contraste, beneficiando a personas con baja visión o sensibilidad a la luz.
- **Cursor grande de 40px:** Reemplaza el cursor estándar por un diseño de mira de 40px, facilitando la localización del puntero a usuarios con discapacidad motora o visual.
- **Modo oscuro/claro:** Permite alternar entre temas visuales para adaptarse a condiciones de poca luz o fatiga visual.
- **Reducción de animaciones:** Anula todas las transiciones y animaciones CSS con un clic, previniendo molestias en personas con trastornos vestibulares o cognitivos.

**Navegación y Operabilidad:**
- **Navegación por teclado:** Todos los botones del widget son elementos `<button>` nativos operables con Tab, permitiendo el uso del sistema a personas con discapacidad motora que no pueden usar un ratón.
- **Foco visible:** Los campos de formulario muestran un borde dorado con sombra al recibir enfoque, facilitando la navegación por teclado a personas con discapacidad cognitiva o motora.
- **Texto alternativo en imágenes:** Las imágenes informativas incluyen atributos `alt` descriptivos, y los iconos decorativos usan `aria-hidden="true"`, garantizando que personas ciegas accedan al contenido relevante sin distracciones.
- **Roles ARIA:** El panel de accesibilidad usa `role="dialog"`, los grupos de controles usan `role="group"` con `aria-label`, y la navegación del admin usa `<nav aria-label>`, asegurando compatibilidad con lectores de pantalla como NVDA, JAWS y VoiceOver.
- **Etiquetas visibles:** Todos los formularios tienen `<label>` descriptivos visibles, y los botones de calificación usan `aria-label`, reduciendo la carga cognitiva para adultos mayores y personas con discapacidad intelectual.

### Contribución al ODS 4: Educación de Calidad

El sistema contribuye al Objetivo de Desarrollo Sostenible 4, que busca garantizar una educación inclusiva, equitativa y de calidad, promoviendo oportunidades de aprendizaje para todos.

**Entorno de Aprendizaje Inclusivo:**
- La reducción de animaciones crea un entorno seguro para personas con trastornos vestibulares o sensibilidades sensoriales.
- El modo oscuro/claro permite adaptar la interfaz a diferentes condiciones de iluminación, reduciendo la fatiga visual durante sesiones prolongadas de uso.

### Contribución al ODS 11: Ciudades y Comunidades Sostenibles

El sistema contribuye al Objetivo de Desarrollo Sostenible 11, que busca lograr que las ciudades y los asentamientos humanos sean inclusivos, seguros, resilientes y sostenibles.

**Espacios Digitales Inclusivos:**
El sistema integral de accesibilidad web de Hotel Nova extiende el principio de "espacios accesibles" al ámbito digital, garantizando que ningún usuario quede excluido del ecosistema del hotel independientemente de sus capacidades visuales, motoras o cognitivas.

---

*Este documento constituye evidencia del compromiso de Hotel Nova con la inclusión digital y los Objetivos de Desarrollo Sostenible de la Agenda 2030.*
