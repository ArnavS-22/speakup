import { CivicData, DataSource, INITIAL_DATA, loadCivicData, recentItems, upcomingItems } from '@/lib/data';
import { AgendaItem, Body } from '@/lib/types';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CivicContextValue = {
  bodies: Body[];
  /** Items on agendas for meetings today or later. Routing only looks at these. */
  agendaItems: AgendaItem[];
  /** Items from agendas already held, newest first. */
  recent: AgendaItem[];
  source: DataSource;
  fetchedAt: string;
  ready: boolean;
};

function split(data: CivicData, ready: boolean): CivicContextValue {
  return {
    bodies: data.bodies,
    agendaItems: upcomingItems(data.agendaItems),
    recent: recentItems(data.agendaItems),
    source: data.source,
    fetchedAt: data.fetchedAt,
    ready,
  };
}

const CivicContext = createContext<CivicContextValue>(split(INITIAL_DATA, false));

export function CivicProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CivicData>(INITIAL_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCivicData()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => split(data, ready), [data, ready]);
  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>;
}

export function useCivic() {
  return useContext(CivicContext);
}
