import { emptyFields } from '@/lib/questions';
import {
  AgendaItem,
  DraftResult,
  FlowFields,
  Intent,
  Language,
  RouteResult,
  SavedComment,
  UnderstandResult,
} from '@/lib/types';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type FlowSnapshot = {
  text: string;
  chosenIntent: Intent | null;
  understand: UnderstandResult | null;
  fields: FlowFields;
  askedCount: number;
  route: RouteResult | null;
  draft: DraftResult | null;
  draftLanguage: Language;
  preselectedItem: AgendaItem | null;
  savedId: string | null;
};

const initial: FlowSnapshot = {
  text: '',
  chosenIntent: null,
  understand: null,
  fields: emptyFields(),
  askedCount: 0,
  route: null,
  draft: null,
  draftLanguage: 'en',
  preselectedItem: null,
  savedId: null,
};

type FlowContextValue = FlowSnapshot & {
  reset: () => void;
  loadSaved: (comment: SavedComment, item: AgendaItem | null, route: RouteResult) => void;
  setText: (text: string) => void;
  setChosenIntent: (intent: Intent | null) => void;
  setUnderstand: (value: UnderstandResult | null) => void;
  setFields: (fields: FlowFields) => void;
  bumpAsked: () => void;
  setRoute: (route: RouteResult | null) => void;
  setDraft: (draft: DraftResult | null) => void;
  setDraftLanguage: (language: Language) => void;
  setPreselectedItem: (item: AgendaItem | null) => void;
  setSavedId: (id: string | null) => void;
  startAgendaItem: (item: AgendaItem) => void;
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlowSnapshot>(initial);

  const reset = useCallback(() => setState(initial), []);

  const startAgendaItem = useCallback((item: AgendaItem) => {
    setState({
      ...initial,
      chosenIntent: 'agenda',
      preselectedItem: item,
      text: item.title,
      fields: {
        ...emptyFields(),
        ask: null,
        location: null,
      },
    });
  }, []);

  const loadSaved = useCallback((comment: SavedComment, item: AgendaItem | null, route: RouteResult) => {
    setState({
      ...initial,
      text: comment.drafts.en ?? '',
      chosenIntent: comment.intent,
      preselectedItem: item,
      route,
      draft: {
        drafts: comment.drafts,
        word_count: (comment.drafts[comment.language] ?? comment.drafts.en ?? '').split(/\s+/).length,
      },
      draftLanguage: comment.language,
      savedId: comment.id,
    });
  }, []);

  const value = useMemo<FlowContextValue>(
    () => ({
      ...state,
      reset,
      loadSaved,
      startAgendaItem,
      setText: (text) => setState((s) => ({ ...s, text })),
      setChosenIntent: (chosenIntent) => setState((s) => ({ ...s, chosenIntent })),
      setUnderstand: (understand) =>
        setState((s) => ({
          ...s,
          understand,
          fields: understand
            ? {
                ...s.fields,
                location: understand.location ?? s.fields.location,
                ask: understand.ask ?? s.fields.ask,
                impact: understand.impact ?? s.fields.impact,
              }
            : s.fields,
          draftLanguage: understand?.detected_language ?? s.draftLanguage,
        })),
      setFields: (fields) => setState((s) => ({ ...s, fields })),
      bumpAsked: () => setState((s) => ({ ...s, askedCount: s.askedCount + 1 })),
      setRoute: (route) => setState((s) => ({ ...s, route })),
      setDraft: (draft) => setState((s) => ({ ...s, draft })),
      setDraftLanguage: (draftLanguage) => setState((s) => ({ ...s, draftLanguage })),
      setPreselectedItem: (preselectedItem) => setState((s) => ({ ...s, preselectedItem })),
      setSavedId: (savedId) => setState((s) => ({ ...s, savedId })),
    }),
    [state, reset, loadSaved, startAgendaItem],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('FlowProvider missing');
  return ctx;
}
