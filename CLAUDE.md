# CLAUDE.md — Alertas de OP (lives-alertas-op)

Las reglas generales de trabajo están en el repo privado `lives-instrucciones` (CLAUDE.md). Este archivo solo describe esta herramienta.

## Qué hace
Aplicación de escritorio instalable (PWA, un solo link; fuera del portal, pedido de Christian el 03/11/2026) que avisa cuando cambia algún dato de una OP al subir las OP en `lives-registro-auditorias/ops.html`: OP nueva, color nuevo/cambiado/quitado, P.O. nueva/cambiada/quitada, y cambio de estilo, grupo, destino, tela o cantidad de pedido.
- Pantalla de llamado tipo turno de banco: ventana grande con el número de OP, borde y título parpadeando, sonido y título de la pestaña parpadeando. Botón "Visto". Si la ventana está en segundo plano y están activados, sale también el aviso del sistema (Notification).
- Todos la ven (lectura libre, como el resto en Supabase). "Visto" se guarda en ese equipo (`localStorage`: `oc_base`, `oc_vistos`, `oc_avisos`); la primera vez en un equipo no marca nada como nuevo.
- Historial con filtros (OP, tipo, fechas), regla 500 y botón Descargar Excel (formato LIVES).
- Sondea la base cada 20 s con la puerta `opcambios_api` (acción `leer` con `desde_id`). Sin Realtime a propósito: es lo que Sistemas puede replicar igual.
- `?prueba=1` inyecta 3 alertas falsas en pantalla (nada se guarda), solo para probar el aspecto.
- Instalación: Edge o Chrome ofrecen "Instalar" (botón dentro de la pantalla o icono en la barra de direcciones). `manifest.json`, `sw.js` (solo hace instalable, no guarda nada) e iconos `icon-192.png` / `icon-512.png` (isotipo de la skill lives-logo sobre Petróleo).
- Limitación: la ventana debe estar abierta (puede estar minimizada) para recibir avisos. Para avisar con la app cerrada haría falta un .exe autorizado por Sistemas.

## Base de datos (Supabase lives-datos, prefijo `opcambios_`)
- `opcambios_cargas` (una fila por carga de OP: usuario, filas, OPs en el archivo, `base`, cambios) y `opcambios_historial` (una fila por diferencia: op, tipo, campo, valor anterior/nuevo, color, po, grupo, estilo, e_cliente, usuario). RLS activo sin políticas: solo se lee por la puerta.
- Puerta `opcambios_api(p_accion, p)`: `leer` ({desde_id, op, tipo, desde_fecha, hasta_fecha}; sin filtros devuelve las 500 más recientes) y `puede_registrar` (siempre falso: nadie registra aquí, lo escribe la carga). Abierta a anon.
- `opcambios_comparar_(p_filas, p_usuario)`: compara lo que viene en el archivo con `ops` ANTES de reemplazar y anota las diferencias. La primera carga después de crear la herramienta es la base: no genera alertas.
- `sync_ops_reemplazar` (compartida con Registro de Auditorías) llama a `opcambios_comparar_` dentro de un bloque con captura de error: si la comparación falla, la carga igual se hace y la respuesta trae `cambios_error`. La respuesta ahora incluye `cambios` (cantidad). Respaldo de la función original: tabla `respaldo_ops_funciones_20261103`.
- Reglas de comparación: por OP que ya existía; color agregado/quitado (si solo uno salió y uno entró en la misma OP = "color cambiado"; igual para P.O.); estilo, grupo, destino, tela y cantidad de pedido por OP + color. Una OP que no viene en el archivo no genera aviso (las OP ausentes se mantienen en `ops`).
- Registro SQL: serie `Oc` (Oc01).

## Para Sistemas (anotar en el paquete)
- Cuando las OP lleguen directo del sistema, el comparador pasa a su lado: misma tabla de historial y misma puerta `leer` (contrato de arriba). Lo exclusivo de Postgres: `security definer`, tablas temporales `on commit drop`, `jsonb`. En SQL Server se exige usuario para abrir y leer.
- Los textos de grupo, estilo y color van como etiqueta de ayuda; la llave es la OP.

## Quién la usa
Todos los que necesiten ver los cambios de OP (PCP y demás áreas). La carga la hace Christian (Datos e IA).
