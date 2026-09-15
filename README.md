# Hotel Campestre Estorake — maqueta

Propuesta de sitio web para el Hotel Campestre Estorake (Calle 5 #23-88, vía al Parque Arqueológico, San Agustín, Huila).

Página estática: `index.html`, estilos en `css/`, scripts en `js/` (`data.js` tiene habitaciones, galería e itinerario; `i18n.js` los textos en inglés) y fotos en `img/` (galerías en `img/g/`). El build (`build.sh`) copia los archivos a `public/`, que es lo que publica Vercel (`vercel.json`).

## Pendiente antes de producción
- Tarifas oficiales por habitación y temporada (las actuales son las de referencia de Booking).
- Fotos originales en alta y foto de los dueños (las actuales vienen de la ficha de Booking).
- Confirmar RNT (Booking: 34716 · logo: 34717), medios de pago, cena y la chimenea de la Suite vista al jardín.
- Confirmar con el hotel si trabajan con guías fijos, si hay cabalgatas y precios de referencia de los recorridos (hoy la web solo dice que ayudan a contactar guías y transporte; el itinerario es una guía general del destino).
- Nombre y foto de los dueños para la sección de anfitriones.
- Quitar `<meta name="robots" content="noindex">` cuando el sitio sea el oficial.
