import i18n, { deviceLanguage } from '@/i18n';
import { defaultSettings, loadSettings, saveSettings } from '@/lib/storage';
import { AppSettings, Language, TopicTag } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SettingsContextValue = {
  settings: AppSettings;
  setLanguage: (language: Language) => void;
  setCity: (cityId: string) => void;
  toggleBody: (id: string) => void;
  toggleTopic: (tag: TopicTag) => void;
  ready: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings(deviceLanguage()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings(deviceLanguage()).then((loaded) => {
      setSettings(loaded);
      void i18n.changeLanguage(loaded.language);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    void saveSettings(next);
  }, []);

  const setLanguage = useCallback(
    (language: Language) => {
      void i18n.changeLanguage(language);
      persist({ ...settings, language });
    },
    [persist, settings],
  );

  const setCity = useCallback(
    (cityId: string) => persist({ ...settings, cityId }),
    [persist, settings],
  );

  const toggleBody = useCallback(
    (id: string) => {
      const has = settings.followedBodyIds.includes(id);
      persist({
        ...settings,
        followedBodyIds: has
          ? settings.followedBodyIds.filter((x) => x !== id)
          : [...settings.followedBodyIds, id],
      });
    },
    [persist, settings],
  );

  const toggleTopic = useCallback(
    (tag: TopicTag) => {
      const has = settings.followedTopics.includes(tag);
      persist({
        ...settings,
        followedTopics: has
          ? settings.followedTopics.filter((x) => x !== tag)
          : [...settings.followedTopics, tag],
      });
    },
    [persist, settings],
  );

  const value = useMemo(
    () => ({ settings, setLanguage, setCity, toggleBody, toggleTopic, ready }),
    [settings, setLanguage, setCity, toggleBody, toggleTopic, ready],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('SettingsProvider missing');
  return ctx;
}
