# Mi Alma en el Universo — Community Platform

Una plataforma de comunidad tipo Skool, construida con Next.js 14, desplegable en Hostinger VPS con EasyPanel.

---

## 🚀 Stack Tecnológico

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — estilos utilitarios
- **Docker** — contenedor para EasyPanel
- **JSON files** — contenido editable sin base de datos

---

## 📁 Estructura del Proyecto

```
alma-universo/
├── app/                    # Páginas (Next.js App Router)
│   ├── page.tsx            # Comunidad (feed)
│   ├── classroom/          # Cursos y lecciones
│   ├── calendar/           # Eventos y clases en vivo
│   ├── members/            # Miembros
│   └── about/              # Acerca de
├── components/
│   ├── layout/             # Navbar, Sidebar
│   └── community/          # PostCard, CategoryFilter
├── content/                # ← EDITA ESTOS ARCHIVOS PARA CAMBIAR EL CONTENIDO
│   ├── community.json      # Nombre, descripción, colores, links
│   ├── posts.json          # Publicaciones del feed
│   ├── courses.json        # Cursos y módulos
│   └── events.json         # Eventos del calendario
└── public/
    └── images/             # Imágenes (logo, portada, avatars)
```

---

## ✏️ Cómo Editar el Contenido

### Cambiar nombre / descripción / branding
Edita `content/community.json`:
```json
{
  "name": "Tu Nombre de Comunidad",
  "tagline": "Tu slogan aquí...",
  "owner": {
    "name": "Tu Nombre",
    "title": "Tu título"
  }
}
```

### Agregar una publicación
En `content/posts.json`, añade un objeto al array:
```json
{
  "id": "post-4",
  "title": "Título de tu post",
  "content": "Contenido del post...",
  "category": "general",
  "author": { "name": "Tu Nombre", "avatar": "", "level": 9, "isOwner": true },
  "pinned": false,
  "likes": 0,
  "comments": 0,
  "createdAt": "2025-03-01T10:00:00Z",
  "image": null,
  "videoUrl": null
}
```

### Agregar un curso/módulo
En `content/courses.json`, edita o añade módulos.  
Para un video, reemplaza `"REEMPLAZA_CON_URL_DE_VIDEO"` con la URL de YouTube/Vimeo.

### Agregar un evento
En `content/events.json`, actualiza la fecha, hora y el link de Zoom/Meet.

### Agregar imágenes
Sube tus imágenes a `public/images/` y referéncialas como `/images/tu-imagen.jpg`.

---

## 🖥️ Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir http://localhost:3000
```

---

## 🌐 Despliegue en Hostinger VPS + EasyPanel

### Paso 1 — Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/alma-universo.git
git push -u origin main
```

### Paso 2 — Configurar EasyPanel
1. Entra a tu EasyPanel en `tu-vps-ip:3000`
2. Crea un nuevo **Project**
3. Crea un nuevo **Service** → tipo **App**
4. Selecciona **GitHub** como fuente
5. Conecta tu repositorio `alma-universo`
6. En **Build Settings**:
   - Build Type: `Dockerfile`
   - Dockerfile path: `Dockerfile`
7. En **Domains**: añade tu dominio o usa el subdominio de EasyPanel
8. Haz clic en **Deploy**

### Paso 3 — Auto-deploy en cada push
EasyPanel detecta automáticamente los pushes a `main` y redespliega.  
Cada vez que edites un archivo de contenido y hagas `git push`, el sitio se actualiza.

---

## 🔄 Flujo de Trabajo para Actualizar Contenido

```bash
# Edita un archivo de contenido, por ejemplo posts.json
# Luego:
git add content/posts.json
git commit -m "Nueva publicación: [título]"
git push

# EasyPanel redespliega automáticamente en ~2 minutos
```

---

## 🗺️ Próximos Pasos (Iteraciones Futuras)

| Feature | Descripción |
|---------|-------------|
| **Autenticación** | NextAuth.js con magic link o Google |
| **Base de datos** | Supabase o PlanetScale para posts dinámicos |
| **Video embeds** | Reproductor de Vimeo/YouTube integrado |
| **Comentarios** | Sistema de comentarios en posts |
| **Notificaciones** | Sistema de notificaciones en tiempo real |
| **Admin panel** | Panel para gestionar contenido sin tocar JSON |

---

## 📞 Estructura de Archivos de Imágenes

```
public/images/
├── logo.jpg          # Logo de la comunidad (cuadrado, 200x200px)
├── cover.jpg         # Imagen de portada (1200x400px)
├── owner-avatar.jpg  # Tu foto de perfil
└── placeholder-*.jpg # Imágenes placeholder para posts/cursos
```
