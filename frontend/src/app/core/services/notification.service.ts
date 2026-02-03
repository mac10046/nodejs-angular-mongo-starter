import { Injectable, inject } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import { TOAST_TYPE_CONFIG } from '../config/toast.config';

/**
 * Notification Service
 * Centralized service for displaying toast notifications throughout the application.
 * Uses sitewide configuration with type-specific overrides.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastr = inject(ToastrService);

  /**
   * Display a success notification
   * @param message - The message to display
   * @param title - Optional title (default: 'Success')
   * @param options - Optional override options
   */
  success(message: string, title: string = 'Success', options?: Partial<IndividualConfig>): void {
    this.toastr.success(message, title, {
      ...TOAST_TYPE_CONFIG.success,
      ...options,
    });
  }

  /**
   * Display an error notification
   * @param message - The message to display
   * @param title - Optional title (default: 'Error')
   * @param options - Optional override options
   */
  error(message: string, title: string = 'Error', options?: Partial<IndividualConfig>): void {
    this.toastr.error(message, title, {
      ...TOAST_TYPE_CONFIG.error,
      ...options,
    });
  }

  /**
   * Display a warning notification
   * @param message - The message to display
   * @param title - Optional title (default: 'Warning')
   * @param options - Optional override options
   */
  warning(message: string, title: string = 'Warning', options?: Partial<IndividualConfig>): void {
    this.toastr.warning(message, title, {
      ...TOAST_TYPE_CONFIG.warning,
      ...options,
    });
  }

  /**
   * Display an info notification
   * @param message - The message to display
   * @param title - Optional title (default: 'Info')
   * @param options - Optional override options
   */
  info(message: string, title: string = 'Info', options?: Partial<IndividualConfig>): void {
    this.toastr.info(message, title, {
      ...TOAST_TYPE_CONFIG.info,
      ...options,
    });
  }

  /**
   * Display an API error notification
   * Automatically extracts message from API error response
   * @param error - The HTTP error response
   * @param fallbackMessage - Fallback message if extraction fails
   */
  apiError(error: any, fallbackMessage: string = 'An error occurred. Please try again.'): void {
    const message = this.extractErrorMessage(error, fallbackMessage);
    this.error(message);
  }

  /**
   * Display a persistent error that won't auto-dismiss
   * User must click to dismiss
   * @param message - The message to display
   * @param title - Optional title (default: 'Error')
   */
  persistentError(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title, {
      disableTimeOut: true,
      closeButton: true,
      tapToDismiss: false,
    });
  }

  /**
   * Clear all active toasts
   */
  clearAll(): void {
    this.toastr.clear();
  }

  /**
   * Extract error message from various error formats
   */
  private extractErrorMessage(error: any, fallback: string): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.map((e: any) => e.message).join('. ');
    }

    if (error?.message) {
      return error.message;
    }

    return fallback;
  }
}
