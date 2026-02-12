export const DEFAULT_API_TEMPLATE_PLACEHOLDER = "接口文档模板.docx";
export const DEFAULT_DB_TEMPLATE_PLACEHOLDER = "数据库设计文档模板.docx";

export interface TemplateSettings {
  apiTemplatePath: string;
  dbTemplatePath: string;
}

const TEMPLATE_SETTINGS_STORAGE_KEY = "spec2doc.template-settings";
const TEMPLATE_SETTINGS_UPDATED_EVENT = "spec2doc:template-settings-updated";

const normalizePath = (value: unknown, fallback: string) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeTemplateSettings = (settings?: Partial<TemplateSettings>): TemplateSettings => ({
  apiTemplatePath: normalizePath(settings?.apiTemplatePath, DEFAULT_API_TEMPLATE_PLACEHOLDER),
  dbTemplatePath: normalizePath(settings?.dbTemplatePath, DEFAULT_DB_TEMPLATE_PLACEHOLDER),
});

export const getDefaultTemplateSettings = (): TemplateSettings => normalizeTemplateSettings();

export const readTemplateSettings = (): TemplateSettings => {
  if (typeof window === "undefined") {
    return getDefaultTemplateSettings();
  }

  try {
    const raw = window.localStorage.getItem(TEMPLATE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return getDefaultTemplateSettings();
    }

    const parsed = JSON.parse(raw) as Partial<TemplateSettings>;
    return normalizeTemplateSettings(parsed);
  } catch {
    return getDefaultTemplateSettings();
  }
};

const emitTemplateSettingsUpdated = (settings: TemplateSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TemplateSettings>(TEMPLATE_SETTINGS_UPDATED_EVENT, {
      detail: settings,
    }),
  );
};

export const saveTemplateSettings = (settings: Partial<TemplateSettings>): TemplateSettings => {
  const merged = normalizeTemplateSettings({
    ...readTemplateSettings(),
    ...settings,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(TEMPLATE_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  }

  emitTemplateSettingsUpdated(merged);
  return merged;
};

export const subscribeTemplateSettings = (listener: (settings: TemplateSettings) => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<TemplateSettings>;
    listener(normalizeTemplateSettings(customEvent.detail));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== TEMPLATE_SETTINGS_STORAGE_KEY) {
      return;
    }
    listener(readTemplateSettings());
  };

  window.addEventListener(TEMPLATE_SETTINGS_UPDATED_EVENT, handleCustomEvent as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(TEMPLATE_SETTINGS_UPDATED_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
};
