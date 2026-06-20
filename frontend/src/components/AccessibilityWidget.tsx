import React from 'react';

type ThemeMode = 'dark' | 'light';
type VisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';
type ContrastMode = 'normal' | 'high';
type MotionMode = 'normal' | 'reduced';
type CursorMode = 'normal' | 'large';

type AccessibilityPreferences = {
  theme: ThemeMode;
  fontScale: number;
  visionMode: VisionMode;
  contrast: ContrastMode;
  motion: MotionMode;
  cursor: CursorMode;
};

const STORAGE_KEY = 'hotel-nova-accessibility-v1';
const FONT_SCALE_OPTIONS = [0.9, 1, 1.1, 1.2, 1.3];

const VISION_MODES: Array<{ label: string; value: VisionMode }> = [
  { label: 'Normal', value: 'normal' },
  { label: 'Protanopía', value: 'protanopia' },
  { label: 'Deuteranopía', value: 'deuteranopia' },
  { label: 'Tritanopía', value: 'tritanopia' },
];

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  theme: 'dark',
  fontScale: 1,
  visionMode: 'normal',
  contrast: 'normal',
  motion: 'normal',
  cursor: 'normal',
};

function clampFontScale(value: number) {
  return Math.min(FONT_SCALE_OPTIONS[FONT_SCALE_OPTIONS.length - 1], Math.max(FONT_SCALE_OPTIONS[0], value));
}

function readPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored) as Partial<AccessibilityPreferences>;
    const theme = parsed.theme === 'light' ? 'light' : 'dark';
    const visionMode = VISION_MODES.some((option) => option.value === parsed.visionMode)
      ? (parsed.visionMode as VisionMode)
      : 'normal';
    const fontScale = typeof parsed.fontScale === 'number' ? clampFontScale(parsed.fontScale) : 1;

    return {
      theme,
      fontScale,
      visionMode,
      contrast: parsed.contrast === 'high' ? 'high' : 'normal',
      motion: parsed.motion === 'reduced' ? 'reduced' : 'normal',
      cursor: parsed.cursor === 'large' ? 'large' : 'normal',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function AccessibilityWidget() {
  const [open, setOpen] = React.useState(false);
  const [preferences, setPreferences] = React.useState<AccessibilityPreferences>(() => readPreferences());

  React.useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = preferences.theme;
    root.dataset.vision = preferences.visionMode;
    root.dataset.contrast = preferences.contrast;
    root.dataset.motion = preferences.motion;
    root.dataset.cursor = preferences.cursor;
    root.style.setProperty('--app-font-size', `${Math.round(16 * preferences.fontScale)}px`);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setTheme = (theme: ThemeMode) => {
    setPreferences((current) => ({ ...current, theme }));
  };

  const setFontScale = (direction: 'decrease' | 'increase') => {
    setPreferences((current) => {
      const currentIndex = FONT_SCALE_OPTIONS.findIndex((option) => option === current.fontScale);
      const baseIndex = currentIndex === -1 ? 1 : currentIndex;
      const nextIndex = direction === 'increase'
        ? Math.min(FONT_SCALE_OPTIONS.length - 1, baseIndex + 1)
        : Math.max(0, baseIndex - 1);

      return {
        ...current,
        fontScale: FONT_SCALE_OPTIONS[nextIndex],
      };
    });
  };

  const setVisionModeByIndex = (index: number) => {
    const boundedIndex = Math.min(VISION_MODES.length - 1, Math.max(0, index));

    setPreferences((current) => ({
      ...current,
      visionMode: VISION_MODES[boundedIndex].value,
    }));
  };

  const setContrast = (contrast: ContrastMode) => {
    setPreferences((current) => ({ ...current, contrast }));
  };

  const setMotion = (motion: MotionMode) => {
    setPreferences((current) => ({ ...current, motion }));
  };

  const setCursor = (cursor: CursorMode) => {
    setPreferences((current) => ({ ...current, cursor }));
  };

  const currentVisionIndex = VISION_MODES.findIndex((option) => option.value === preferences.visionMode);
  const visibleVisionIndex = currentVisionIndex === -1 ? 0 : currentVisionIndex;

  return (
    <div className="accessibility-widget">
      <button
        type="button"
        className="accessibility-fab"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        title="Accesibilidad"
      >
        <span className="accessibility-fab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="6.7" r="2" fill="currentColor" />
            <path d="M5.6 8.7 12 12.3l6.4-3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 12.3 8 19.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 12.3 16 19.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="5" cy="9" r="1.2" fill="currentColor" />
            <circle cx="19" cy="9" r="1.2" fill="currentColor" />
            <circle cx="7" cy="19" r="1.2" fill="currentColor" />
            <circle cx="17" cy="19" r="1.2" fill="currentColor" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="accessibility-overlay" onClick={() => setOpen(false)}>
          <section
            id="accessibility-panel"
            className="accessibility-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Panel de accesibilidad"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="accessibility-panel__header">
              <div>
                <p className="accessibility-panel__eyebrow">Accesibilidad</p>
                <h3>Personaliza la experiencia</h3>
              </div>

              <button
                type="button"
                className="accessibility-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar panel"
              >
                ×
              </button>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title">
                <span>Tema</span>
                <strong>{preferences.theme === 'dark' ? 'Oscuro' : 'Claro'}</strong>
              </div>

              <div className="accessibility-toggle-group" role="group" aria-label="Tema visual">
                <button
                  type="button"
                  className={preferences.theme === 'dark' ? 'is-active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  Oscuro
                </button>
                <button
                  type="button"
                  className={preferences.theme === 'light' ? 'is-active' : ''}
                  onClick={() => setTheme('light')}
                >
                  Claro
                </button>
              </div>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title">
                <span>Tamaño</span>
                <strong>{`${preferences.fontScale.toFixed(1)}x`}</strong>
              </div>

              <div className="accessibility-stepper" role="group" aria-label="Tamaño de texto">
                <button type="button" onClick={() => setFontScale('decrease')} aria-label="Reducir tamaño de texto">
                  A-
                </button>
                <div className="accessibility-stepper__value" aria-live="polite">
                  {`${Math.round(preferences.fontScale * 100)}%`}
                </div>
                <button type="button" onClick={() => setFontScale('increase')} aria-label="Aumentar tamaño de texto">
                  A+
                </button>
              </div>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title accessibility-section__title--stacked">
                <span>Daltonismo</span>
                <strong>{VISION_MODES[visibleVisionIndex].label}</strong>
              </div>

              <div className="accessibility-vision">
                <input
                  type="range"
                  min={0}
                  max={VISION_MODES.length - 1}
                  step={1}
                  value={visibleVisionIndex}
                  onChange={(event) => setVisionModeByIndex(Number(event.target.value))}
                  aria-label="Seleccionar modo de daltonismo"
                  className="accessibility-range"
                />

                <div className="accessibility-vision__labels" aria-hidden="true">
                  {VISION_MODES.map((option, index) => (
                    <span key={option.value} className={index === visibleVisionIndex ? 'is-active' : ''}>
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title">
                <span>Alto contraste</span>
                <strong>{preferences.contrast === 'high' ? 'Activado' : 'Desactivado'}</strong>
              </div>

              <div className="accessibility-toggle-group" role="group" aria-label="Alto contraste">
                <button
                  type="button"
                  className={preferences.contrast === 'normal' ? 'is-active' : ''}
                  onClick={() => setContrast('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={preferences.contrast === 'high' ? 'is-active' : ''}
                  onClick={() => setContrast('high')}
                >
                  Alto
                </button>
              </div>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title">
                <span>Reducir animaciones</span>
                <strong>{preferences.motion === 'reduced' ? 'Activado' : 'Desactivado'}</strong>
              </div>

              <div className="accessibility-toggle-group" role="group" aria-label="Reducir animaciones">
                <button
                  type="button"
                  className={preferences.motion === 'normal' ? 'is-active' : ''}
                  onClick={() => setMotion('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={preferences.motion === 'reduced' ? 'is-active' : ''}
                  onClick={() => setMotion('reduced')}
                >
                  Reducido
                </button>
              </div>
            </div>

            <div className="accessibility-section">
              <div className="accessibility-section__title">
                <span>Cursor grande</span>
                <strong>{preferences.cursor === 'large' ? 'Activado' : 'Desactivado'}</strong>
              </div>

              <div className="accessibility-toggle-group" role="group" aria-label="Cursor grande">
                <button
                  type="button"
                  className={preferences.cursor === 'normal' ? 'is-active' : ''}
                  onClick={() => setCursor('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={preferences.cursor === 'large' ? 'is-active' : ''}
                  onClick={() => setCursor('large')}
                >
                  Grande
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AccessibilityWidget;