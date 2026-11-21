import { router, useLocalSearchParams } from 'expo-router';
import { useState, type FormEvent } from 'react';

import { A } from '@/components/A';
import { ChevronLeft, UserPlus } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { FormError, Spinner } from '@/components/ui';
import { useJoinCircle } from '@/lib/queries';

export default function Rejoindre() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code.toUpperCase() : '');
  const join = useJoinCircle();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    join.mutate(code, {
      onSuccess: (r) => {
        toast('Bienvenue dans le cercle.');
        router.replace(`/cercle/${r.id}`);
      },
    });
  };

  return (
    <div className="view">
      <A href="/" className="back">
        <ChevronLeft strokeWidth={1.9} aria-hidden />
        Accueil
      </A>
      <h1 className="h-app">Rejoindre un cercle</h1>
      <p className="sub" style={{ margin: '4px 0 0' }}>
        Entre le code d'invitation que l'organisateur t'a envoyé.
      </p>
      <form className="card" style={{ marginTop: 18 }} onSubmit={submit}>
        <label className="fl" htmlFor="code" style={{ marginTop: 0 }}>
          Code d'invitation
        </label>
        <input
          id="code"
          className="input big"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={6}
          placeholder="VX8K2M"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          required
        />
        <FormError error={join.error} />
        <button className="btn" style={{ marginTop: 16 }} disabled={join.isPending || code.length !== 6}>
          {join.isPending ? <Spinner /> : <UserPlus strokeWidth={1.9} aria-hidden />}
          <span>Rejoindre</span>
        </button>
      </form>
    </div>
  );
}
