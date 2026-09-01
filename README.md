# MEDIA.DL v2.0

<div align="center">
  <h3>Descargador Multimedia en Segundo Plano (System Tray Popover)</h3>
  <p>Interfaz moderna impulsada por <strong>yt-dlp</strong> y <strong>gallery-dl</strong> para descargas de videos, galerías y audio.</p>
</div>

![Screenshot](assets/screenshot.png)

## ✨ Características Principales (v2.0)
- **Acción en Segundo Plano (System Tray):** Aplicación sin presencia en la barra de tareas; permanece activa en la bandeja del sistema junto al reloj y se despliega como ventana emergente al hacer clic.
- **Lista de Procesos:** Visualización en tiempo real del progreso de descarga, velocidad y peso (`descargado / por descargar`).
- **Recuadro Flotante de Detalles:** Posicionando el cursor sobre el botón de lupa (`🔍`) de cualquier descarga, se despliega una tarjeta con información detallada y botón para abrir la carpeta en el Explorador de Windows.
- **Traductor Inteligente de Errores:** Convierte códigos técnicos de fallo (403, 404, cookies, timeout) en explicaciones claras en lenguaje natural.
- **Modo AUTO:** Detección inteligente del enlace para seleccionar automáticamente el mejor motor (`gallery-dl` o `yt-dlp`).
- **Descargas por Lotes (.TXT) y Portapapeles:** Soporte para listas de enlaces y drag-and-drop de archivos `.txt`.
- **Gestor de Cookies:** Carga y administración de múltiples archivos de cookies `.txt` para contenido privado.
- **Actualizador Integrado:** Comprueba y actualiza los binarios de `yt-dlp` y `gallery-dl` directamente desde los ajustes.

---

## 🚀 Instalación y Desarrollo

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/jorgealbertoortiznieves-lab/MEDIA.DL.git
   cd MEDIA.DL
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm start
   ```

4. **Compilar instaladores / binarios:**
   ```bash
   npm run dist
   ```

---

## ⚙️ Configuración de Motores (`bin/`)

Para realizar descargas, coloca los binarios ejecutables correspondientes dentro de la carpeta `bin/`:

1. **yt-dlp**: Descarga `yt-dlp.exe` desde su [repositorio oficial](https://github.com/yt-dlp/yt-dlp/releases) y colócalo en `bin/`.
2. **gallery-dl**: Descarga `gallery-dl-app.exe` desde su [repositorio oficial](https://github.com/mikf/gallery-dl/releases) y colócalo en `bin/`.

> **Nota:** La aplicación autogenerará la configuración base `config1.json` en `bin/` si no existe.
