import { GlobalConfig } from 'ngx-toastr';

/**
 * Centralized toast notification configuration
 * Change settings here to update behavior across the admin app
 */
export const TOAST_CONFIG: Partial<GlobalConfig> = {
  // Display duration in milliseconds (7 seconds as requested)
  timeOut: 7000,

  // Additional time when hovering over toast
  extendedTimeOut: 3000,

  // Position on screen
  positionClass: 'toast-top-right',

  // Prevent duplicate toasts with same message
  preventDuplicates: true,

  // Show progress bar
  progressBar: true,

  // Show close button
  closeButton: true,

  // Maximum number of toasts shown at once
  maxOpened: 5,

  // Auto dismiss previous toasts when max is reached
  autoDismiss: true,

  // Newest toast on top
  newestOnTop: true,

  // Enable HTML in toast messages
  enableHtml: false,

  // Toast CSS classes
  toastClass: 'ngx-toastr',

  // Title CSS class
  titleClass: 'toast-title',

  // Message CSS class
  messageClass: 'toast-message',

  // Tap to dismiss
  tapToDismiss: true,

  // Animation settings
  easeTime: 300,
  easing: 'ease-in-out',
};
