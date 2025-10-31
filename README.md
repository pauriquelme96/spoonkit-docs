# SpoonKit - Arquitectura Spoon para React

Este proyecto utiliza **Arquitectura Spoon**, un patrón arquitectónico moderno para aplicaciones cliente que propone una separación clara de responsabilidades mediante tres capas bien definidas: **Domain**, **Ctrl** y **Presentation**.

Construido con React + TypeScript + Vite.

## 🥄 ¿Qué es la Arquitectura Spoon?

Spoon es una arquitectura que invierte el flujo tradicional de desarrollo: en lugar de desarrollar **de fuera hacia dentro** (UI → Lógica → Datos), propone desarrollar **de dentro hacia fuera** (Datos → Lógica → UI).

### Las Tres Capas

1. **🗄️ Domain**: Define los modelos de información, el acceso a datos (APIs), validadores y entidades que encapsulan las operaciones del dominio.

2. **🎮 Ctrl (Controller)**: Orquesta la lógica de aplicación, gestiona el estado local de la UI y coordina las interacciones entre el dominio y la presentación.

3. **🎨 Presentation**: Componentes de React puramente visuales que reciben datos y callbacks desde los controladores.

### Sistema de Signals

Spoon utiliza un sistema de **signals reactivos** para gestionar el estado de forma eficiente:

- `state()` - Signal básico para valores que cambian
- `calc()` - Signal derivado que se recalcula automáticamente
- `monitor()` - Efecto que se ejecuta cuando cambian sus dependencias
- `stateObject()` y `stateArray()` - Para estructuras complejas

### 📚 Documentación

Para más información sobre la arquitectura, consulta:
- [Arquitectura Spoon](./docs/ARQUITECTURA_SPOON.md) - Guía completa
- [Signals Cheatsheet](./docs/SIGNALS_CHEATSHEET.md) - Referencia rápida de signals

## Configuración del Proyecto

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Construcción

```bash
npm run build
```

### Testing

```bash
npm run test
```

## 📁 Estructura del Proyecto

```
src/
├── domain/          # 🗄️ Capa Domain: Modelos, APIs, Entidades y Validadores
│   ├── User/
│   └── MasterData/
├── components/      # 🎨 Capa Presentation: Componentes visuales
│   ├── Button/
│   ├── Input/
│   └── Table/
├── pages/           # 🎮 Capa Ctrl: Controladores de página
│   └── UserPanel/
└── lib/             # 🛠️ Utilidades y sistema de signals
    ├── signals/
    └── types/
```

### Convenciones

- Cada componente tiene su archivo de presentación (`.tsx`) y controlador (`Ctrl.ts`)
- Las entidades del dominio están agrupadas por contexto en `domain/`
- Los signals se encuentran en `lib/signals/`
