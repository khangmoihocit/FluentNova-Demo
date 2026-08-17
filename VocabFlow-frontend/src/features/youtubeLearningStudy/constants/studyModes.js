export const STUDY_MODES = {
    WATCH: 'watch',
    FILL_BLANK: 'fill_blank',
    DICTATION: 'dictation',
    SHADOWING: 'shadowing',
    QUIZ: 'quiz',
};

export const ACTIVITY_TYPES = {
    [STUDY_MODES.WATCH]: 'WATCH',
    [STUDY_MODES.FILL_BLANK]: 'FILL_BLANK',
    [STUDY_MODES.DICTATION]: 'DICTATION',
    [STUDY_MODES.SHADOWING]: 'SHADOWING',
    [STUDY_MODES.QUIZ]: 'QUIZ',
};

const LEGACY_MODE_MAP = {
    listening: STUDY_MODES.WATCH,
    Listening: STUDY_MODES.WATCH,
    WATCH_VIDEO: STUDY_MODES.WATCH,
    Shadowing: STUDY_MODES.SHADOWING,
    SHADOWING: STUDY_MODES.SHADOWING,
    DICTATION: STUDY_MODES.DICTATION,
    QUIZ: STUDY_MODES.QUIZ,
    FILL_BLANK: STUDY_MODES.FILL_BLANK,
};

export const normalizeStudyMode = (mode) => {
    if (!mode) return STUDY_MODES.WATCH;
    return LEGACY_MODE_MAP[mode] || mode;
};

export const isInteractiveStudyMode = (mode) => {
    const normalized = normalizeStudyMode(mode);
    return normalized === STUDY_MODES.DICTATION || normalized === STUDY_MODES.SHADOWING;
};
