import type { Metadata } from 'next';

import { Rejoindre } from './Rejoindre';

export const metadata: Metadata = { title: 'Rejoindre un cercle' };

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { code } = await searchParams;
  return <Rejoindre initialCode={typeof code === 'string' ? code : ''} />;
}
