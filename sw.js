/* Alertas de OP · service worker mínimo: hace instalable la app. No guarda datos; la pantalla siempre se pide a la red. */
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){e.respondWith(fetch(e.request).catch(function(){return new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}));});
