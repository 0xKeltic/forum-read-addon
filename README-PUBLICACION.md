# Publicar e instalar el addon en Firefox

## Objetivo
Tener el addon instalado de forma permanente en Firefox.

## Importante
- En Firefox estable, una extensión debe estar firmada para instalarse de forma permanente.
- Cargarla desde `about:debugging` es solo temporal (modo desarrollo).

## Opción recomendada (uso personal)
Publicarlo como **Unlisted** en Mozilla Add-ons, firmarlo y usar el `.xpi` firmado.

## Paso a paso
1. Crea o inicia sesión en tu cuenta de desarrollador:
   - https://addons.mozilla.org/developers/
2. Entra al panel y pulsa para subir un nuevo addon.
3. Elige tipo **Unlisted** (recomendado para uso personal).
4. Sube el paquete de la extensión.
5. Espera la validación y firma automática.
6. Descarga el archivo `.xpi` firmado.
7. Abre el `.xpi` con Firefox e instálalo.

## Cómo preparar el paquete (.zip/.xpi)
1. Asegúrate de incluir en la raíz del paquete:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.js`
   - carpeta `images/`
2. Comprime esos archivos en un `.zip`.
3. Sube ese `.zip` al portal de Mozilla.

## Publicación pública (opcional)
Si quieres que aparezca en la tienda de Firefox, usa **Listed** en lugar de Unlisted.

## Desarrollo local (temporal)
1. Abre Firefox.
2. Ve a:
   - `about:debugging#/runtime/this-firefox`
3. Pulsa **Load Temporary Add-on…**.
4. Selecciona `manifest.json`.

## Nota útil
Si en algún momento Mozilla te pide identificador de addon, se añade en `manifest.json` dentro de `browser_specific_settings.gecko.id`.
