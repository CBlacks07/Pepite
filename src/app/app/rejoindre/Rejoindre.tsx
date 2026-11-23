'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { A } from '@/components/A';
import { ChevronLeft, UserPlus } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { FormError, Spinner } from '@/components/ui';
import { useJoinCircle } from '@/lib/queries';
import { CIRCLE } from '@/lib/rules';

export function Rejoindre({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  const join = useJoinCircle();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    join.mutate(code, {
      onSuccess: (r) => {
        toast('Bienvenue dans le cercle.');
        router.replace(`/app/cercle/${r.id}`);
      },
    });
  };

  return (
    <div className="view narrow">
      <A href="/app" className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        Accueil
      </A>
      <div className="page-head">
        <div>
          <h1 className="h-app">Rejoindre un cercle</h1>
          <p className="sub m-t4">
            Entre le code d'invitation que l'organisateur t'a envoyé.
          </p>
        </div>
      </div>
      <form className="card" onSubmit={submit}>
        <label className="fl mt-0" htmlFor="code">
          Code d'invitation
        </label>
        <input
          id="code"
          className="input big narrow"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={CIRCLE.inviteCodeLength}
          placeholder="VX8K2M"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          required
        />
        <FormError error={join.error} />
        <div>
          <button className="btn mt-16" disabled={join.isPending || code.length !== 6}>
            {join.isPending ? <Spinner /> : <UserPlus strokeWidth={1.9} aria-hidden />}
            <span>Rejoindre</span>
          </button>
        </div>
      </form>
    </div>
  );
}
