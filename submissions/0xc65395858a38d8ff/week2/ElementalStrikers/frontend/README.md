# ElementalStrikers - Frontend

ElementalStrikers es un juego estratégico de elementos construido en la blockchain Flow, donde los jugadores eligen entre Fuego, Agua y Planta para enfrentarse en batallas elementales.

## Estructura del proyecto

- `/app`: Páginas de la aplicación (Next.js App Router)
  - `/pve`: Página principal del modo PvE
- `/flow`: Configuración y transacciones para interactuar con la blockchain Flow
  - `/transactions`: Transacciones para ejecutar acciones en la blockchain
  - `config.js`: Configuración de conexión a Flow
- `/src`: Componentes y utilidades de la aplicación
  - `/components`: Componentes reutilizables
    - `/ui`: Componentes de UI comunes
    - `FlowWallet.tsx`: Componente para interactuar con la wallet de Flow
    - `PvEGame.tsx`: Componente principal para el juego PvE

## Tecnologías utilizadas

- **Next.js**: Framework de React para el frontend
- **Chakra UI v3**: Biblioteca de componentes visuales
- **Flow Client Library (FCL)**: Para interactuar con la blockchain Flow
- **TypeScript**: Para tipado estático

## Modo de juego PvE

El modo Player vs Environment (PvE) permite a los jugadores enfrentarse contra una IA. El flujo de juego es:

1. El jugador conecta su wallet de Flow
2. Selecciona un elemento (Fuego, Agua o Planta)
3. Inicia el juego, que crea una transacción en la blockchain
4. Se revela el resultado con efectos visuales y animaciones
5. El jugador puede ver el resultado: victoria, derrota o empate

## Integración con Flow Blockchain

El juego utiliza contratos inteligentes en Flow para:

- Autenticar usuarios con sus wallets
- Ejecutar la lógica del juego de manera descentralizada
- Usar la aleatoriedad de la blockchain para determinar los resultados

## Mecánicas del juego

- **Fuego** vence a **Planta**
- **Planta** vence a **Agua**
- **Agua** vence a **Fuego**

Además, hay modificadores aleatorios como:
- Modificadores ambientales: Día Soleado, Lluvia Torrencial, etc.
- Golpes críticos: posibilidad de golpes críticos que afectan al resultado

## Ejecución del proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## Notas importantes

- Este proyecto usa Chakra UI v3, que tiene cambios significativos respecto a versiones anteriores.
- Para interactuar con la blockchain Flow, necesitarás una wallet como Blocto o Lilico.
- En modo desarrollo, el proyecto se conecta a la testnet de Flow.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
