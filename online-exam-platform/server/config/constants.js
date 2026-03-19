module.exports = {
  USER_ROLES: {
    ADMIN: 'admin',
    STUDENT: 'student'
  },
  
  EXAM_STATUS: {
    UPCOMING: 'upcoming',
    LIVE: 'live',
    COMPLETED: 'completed'
  },
  
  QUESTION_TYPES: {
    MCQ: 'mcq'
  },
  
  VIOLATION_TYPES: {
    FULLSCREEN_EXIT: 'fullscreen_exit',
    TAB_SWITCH: 'tab_switch',
    WINDOW_BLUR: 'window_blur'
  },
  
  MAX_VIOLATIONS: 3,
  
  AUTO_SAVE_INTERVAL: 10000, // 10 seconds
  
  WARNING_TIMES: {
    FIVE_MINUTES: 300, // seconds
    ONE_MINUTE: 60,
    THIRTY_SECONDS: 30
  }
};