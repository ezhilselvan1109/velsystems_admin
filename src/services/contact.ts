import { apiCall } from '../utils/api';
import { ContactMessage, ContactStats, ContactFormData, PaginatedContactResponse } from '../types/contact';

export const contactService = {
  // Get paginated contact messages
  getContactMessages: (page: number = 0, size: number = 10) =>
    apiCall<PaginatedContactResponse>('GET', '/client/contact', null, { page, size }),

  // Get contact statistics
  getStats: () => apiCall<ContactStats[]>('GET', '/client/stats'),

  // Create contact message (for testing purposes)
  createContactMessage: (data: ContactFormData) =>
    apiCall<ContactMessage>('POST', '/client/contact', data),

  // Update message status
  updateMessageStatus: (id: string, status: number) =>
    apiCall<ContactMessage>('PATCH', `/client/contact/${id}/status`, null, { status }),
};