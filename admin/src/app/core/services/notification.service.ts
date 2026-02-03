import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}

  /**
   * Show success notification
   */
  success(message: string, title?: string, options?: Partial<IndividualConfig>): void {
    this.toastr.success(message, title || 'Success', options);
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string, options?: Partial<IndividualConfig>): void {
    this.toastr.error(message, title || 'Error', options);
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string, options?: Partial<IndividualConfig>): void {
    this.toastr.warning(message, title || 'Warning', options);
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string, options?: Partial<IndividualConfig>): void {
    this.toastr.info(message, title || 'Info', options);
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toastr.clear();
  }

  /**
   * Handle HTTP errors with appropriate notifications
   */
  handleError(error: any): void {
    const message = error?.error?.message || error?.message || 'An unexpected error occurred';
    this.error(message);
  }
}
