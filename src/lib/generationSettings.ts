export interface GenerationSettings {
  repeatTableHeaderOnPageBreak: boolean;
}

const GENERATION_SETTINGS_STORAGE_KEY = "spec2doc.generation-settings";
const GENERATION_SETTINGS_UPDATED_EVENT = "spec2doc:generation-settings-updated";

const defaultGenerationSettings: GenerationSettings = {
  repeatTableHeaderOnPageBreak: true,
};

const normalizeGenerationSettings = (
  settings?: Partial<GenerationSettings>,
): GenerationSettings => ({
  repeatTableHeaderOnPageBreak:
    typeof settings?.repeatTableHeaderOnPageBreak === "boolean"
      ? settings.repeatTableHeaderOnPageBreak
      : defaultGenerationSettings.repeatTableHeaderOnPageBreak,
});

export const getDefaultGenerationSettings = (): GenerationSettings =>
  normalizeGenerationSettings();

export const readGenerationSettings = (): GenerationSettings => {
  if (typeof window === "undefined") {
    return getDefaultGenerationSettings();
  }

  try {
    const raw = window.localStorage.getItem(GENERATION_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultGenerationSettings();
    }

    const parsed = JSON.parse(raw) as Partial<GenerationSettings>;
    return normalizeGenerationSettings(parsed);
  } catch {
    return getDefaultGenerationSettings();
  }
};

const emitGenerationSettingsUpdated = (settings: GenerationSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<GenerationSettings>(GENERATION_SETTINGS_UPDATED_EVENT, {
      detail: settings,
    }),
  );
};

export const saveGenerationSettings = (
  settings: Partial<GenerationSettings>,
): GenerationSettings => {
  const merged = normalizeGenerationSettings({
    ...readGenerationSettings(),
    ...settings,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      GENERATION_SETTINGS_STORAGE_KEY,
      JSON.stringify(merged),
    );
  }

  emitGenerationSettingsUpdated(merged);
  return merged;
};

export const subscribeGenerationSettings = (
  listener: (settings: GenerationSettings) => void,
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<GenerationSettings>;
    listener(normalizeGenerationSettings(customEvent.detail));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== GENERATION_SETTINGS_STORAGE_KEY) {
      return;
    }
    listener(readGenerationSettings());
  };

  window.addEventListener(
    GENERATION_SETTINGS_UPDATED_EVENT,
    handleCustomEvent as EventListener,
  );
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(
      GENERATION_SETTINGS_UPDATED_EVENT,
      handleCustomEvent as EventListener,
    );
    window.removeEventListener("storage", handleStorage);
  };
};
