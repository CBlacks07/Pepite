import { useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Gabarit HTML de chaque page (rendu serveur). Polices hébergées par l'appli
// elle-même pour fonctionner hors ligne une fois installée.
const FONTS = [
  ['Figtree', 400, 'Figtree_400Regular'],
  ['Figtree', 500, 'Figtree_500Medium'],
  ['Figtree', 600, 'Figtree_600SemiBold'],
  ['Figtree', 700, 'Figtree_700Bold'],
  ['Bricolage Grotesque', 700, 'BricolageGrotesque_700Bold'],
  ['Bricolage Grotesque', 800, 'BricolageGrotesque_800ExtraBold'],
] as const;

const FONT_CSS = FONTS.map(
  ([family, weight, file]) =>
    `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;font-display:swap;src:url("/fonts/${file}.ttf") format("truetype")}`,
).join('');

const SERVICE_WORKER = `if("serviceWorker"in navigator){addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})})}`;

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="fr" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Pépite</title>
        <meta name="description" content="La tontine entre proches, avec un tirage bonus le dimanche." />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F7F3" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101B19" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Pépite" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preload" href="/fonts/Figtree_400Regular.ttf" as="font" type="font/ttf" crossOrigin="" />
        <link rel="preload" href="/fonts/BricolageGrotesque_700Bold.ttf" as="font" type="font/ttf" crossOrigin="" />
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
        <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER }} />
      </body>
    </html>
  );
}
