// fc-correo · Alertas LIVES · entrega a Gmail el correo de «Fecha para Comercial».
// La base (opcambios_fc_post_) le pasa solo el número del correo y su ficha; el contenido se retira de la base
// con opcambios_fc_tomar y, cuando Gmail lo acepta, se avisa con opcambios_fc_hecho.
// Secretos (los escribe Christian en el panel, Edge Functions > Secrets): GMAIL_USUARIO y GMAIL_CLAVE_APP.
// Sale por el puerto 465 (los puertos 25 y 587 no están permitidos en las Edge Functions).
// En SQL Server esto se reemplaza por Database Mail con una cuenta de la empresa.
import nodemailer from "npm:nodemailer@6.9.16";

const CLAVE_PUBLICA = "sb_publishable_1g-n6UT70EUlNAo8Lyc04w_jKR4LpXZ"; // la misma de las pantallas (no es secreta)

function resp(o: unknown, estado = 200) {
  return new Response(JSON.stringify(o), { status: estado, headers: { "Content-Type": "application/json" } });
}

async function base(funcion: string, cuerpo: unknown) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: CLAVE_PUBLICA },
    body: JSON.stringify(cuerpo),
  });
  const j = await r.json().catch(() => null);
  return r.ok ? j : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return resp({ ok: false, error: "Solo POST" }, 405);
  let p: { id?: number; token?: string } | null = null;
  try { p = await req.json(); } catch (_e) { p = null; }
  if (!p || !p.id || !p.token) return resp({ ok: false, error: "Falta el número o la ficha del correo" }, 400);

  const usuario = (Deno.env.get("GMAIL_USUARIO") || "").trim();
  const clave = (Deno.env.get("GMAIL_CLAVE_APP") || "").replace(/\s+/g, "");
  if (!usuario || !clave) {
    return resp({ ok: false, error: "Falta configurar la cuenta de Gmail (GMAIL_USUARIO y GMAIL_CLAVE_APP)" }, 424);
  }

  const e = await base("opcambios_fc_tomar", { p_id: p.id, p_token: p.token });
  if (!e || !e.ok) return resp({ ok: false, error: (e && e.error) || "No se pudo leer el correo de la base" }, 404);

  try {
    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true, auth: { user: usuario, pass: clave },
    });
    const info = await transporte.sendMail({
      from: { name: e.nombre || "Alertas LIVES", address: usuario },
      to: e.para, subject: e.asunto, html: e.cuerpo,
    });
    const detalle = `Gmail aceptó: ${(info.accepted || []).join(", ")}` +
      ((info.rejected || []).length ? ` · rechazó: ${info.rejected.join(", ")}` : "");
    await base("opcambios_fc_hecho", { p_id: p.id, p_token: p.token, p_respuesta: detalle });
    return resp({ ok: true, id: info.messageId, detalle });
  } catch (err) {
    return resp({ ok: false, error: String((err as Error)?.message ?? err) }, 502);
  }
});
