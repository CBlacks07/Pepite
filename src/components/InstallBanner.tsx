'use client';

import { useEffect, useState } from 'react';

import { useIsClient } from '@/lib/hooks';

import { Download, Share, X } from './icons';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = 'pepite:install-dismissed';

function dismissedBefore(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Propose d'installer Pépite sur l'écran d'accueil (Android/Chrome, ou consigne pour iPhone). */
export function InstallBanner() {
  const isClient = useIsClient();
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!isClient || closed || isStandalone() || dismissedBefore()) return null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!ios && !evt) return null;

  const close = () => {
    setClosed(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
  };

  return (
    <div className="card install">
      <span className="itile">{ios ? <Share strokeWidth={1.9} aria-hidden /> : <Download strokeWidth={1.9} aria-hidden />}</span>
      <div>
        <b>Installe Pépite sur ton téléphone</b>
        <div className="sub">
          {ios
            ? 'Dans Safari, touche Partager puis « Sur l’écran d’accueil ».'
            : 'Elle s’ouvre comme une appli, sans passer par un store.'}
        </div>
        {evt && (
          <button
            type="button"
            className="linkbtn pl-0"
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice;
              setEvt(null);
              setClosed(true);
            }}
          >
            Installer
          </button>
        )}
      </div>
      <button type="button" className="iconbtn sm" onClick={close} aria-label="Masquer">
        <X strokeWidth={1.9} aria-hidden />
      </button>
    </div>
  );
}
