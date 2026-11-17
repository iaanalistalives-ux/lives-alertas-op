/* Alertas de OP · service worker mínimo: hace instalable la app. No guarda datos; la pantalla siempre se pide a la red. */
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
/* Si la app se abre sin conexión (ej. la PC recién prende), en vez de quedarse en un texto fijo muestra una página que vuelve a intentar sola cada 5 s y apenas vuelve la red. */
var ESPERA='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alertas LIVES</title>'
  +'<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#0A1C19;color:#E3ECE9;font-family:Segoe UI,Arial,sans-serif;text-align:center;padding:16px;box-sizing:border-box}'
  +'h1{font-size:22px;margin:0 0 8px}p{margin:0 0 16px;opacity:.8}button{font:inherit;padding:10px 18px;border-radius:8px;border:1px solid #E3ECE9;background:transparent;color:inherit;cursor:pointer}</style></head>'
  +'<body><div><h1>Sin conexión</h1><p>Reintentando sola…</p><button type="button" onclick="location.reload()">Reintentar</button></div>'
  +'<script>setTimeout(function(){location.reload();},5000);addEventListener("online",function(){location.reload();});<\/script></body></html>';
self.addEventListener('fetch',function(e){e.respondWith(fetch(e.request).catch(function(){
  if(e.request.mode==='navigate')return new Response(ESPERA,{status:503,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
  return new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}));});
