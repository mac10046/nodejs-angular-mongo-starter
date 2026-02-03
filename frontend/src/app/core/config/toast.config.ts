import { GlobalConfig } from 'ngx-toastr';

/**
 * Sitewide Toast Configuration
 * Modify these values to change toast behavior across the entire application
 */
export const TOAST_CONFIG: Partial<GlobalConfig> = {
  // Duration settings (in milliseconds)
  timeOut: 7000, // Default: 7 seconds
  extendedTimeOut: 3000, // Time after mouse hover before hiding

  // Position settings
  positionClass: 'toast-top-right',

  // Behavior settings
  preventDuplicates: true,
  countDuplicates: true,
  resetTimeoutOnDuplicate: true,
  includeTitleDuplicates: true,

  // UI settings
  progressBar: true,
  progressAnimation: 'decreasing',
  closeButton: true,
  tapToDismiss: true,
  newestOnTop: true,

  // Max toasts visible at once
  maxOpened: 5,
  autoDismiss: true,

  // Animation
  easing: 'ease-in-out',
  easeTime: 300,
};

/**
 * Toast type-specific configurations
 */
export const TOAST_TYPE_CONFIG = {
  success: {
    timeOut: 5000, // Success messages can be shorter
  },
  error: {
    timeOut: 10000, // Errors should stay longer
    disableTimeOut: false, // Set to true to keep errors until dismissed
  },
  warning: {
    timeOut: 8000,
  },
  info: {
    timeOut: 7000,
  },
};
