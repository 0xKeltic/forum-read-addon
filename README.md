# Probar el addon en Firefox

## Requisitos
- Firefox instalado (versión de escritorio).
- Este repositorio descargado en tu equipo.

## Probar el addon en Firefox (temporal)
1. Abre Firefox.
2. En la barra de direcciones, pega y abre:
   - about:debugging#/runtime/this-firefox
3. En la sección "Temporary Extensions", haz clic en "Load Temporary Add-on…".
4. Selecciona el archivo [manifest.json](manifest.json) de este repositorio.
5. Verifica que el addon aparece en la lista de extensiones temporales.
6. Abre la página donde quieras probarlo y confirma el comportamiento del addon.

## Actualizar el addon durante el desarrollo
1. Después de modificar los archivos, vuelve a about:debugging#/runtime/this-firefox.
2. En la tarjeta del addon, pulsa "Reload".
3. Recarga la página en la que lo estás probando.

## Quitar el addon
- Cierra Firefox o elimina la extensión temporal desde about:debugging#/runtime/this-firefox.
