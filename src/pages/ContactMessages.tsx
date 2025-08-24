import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle, Eye, Filter, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { contactService } from '../services/contact';
import { ContactMessage } from '../types/contact';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomSelect from '../components/CustomSelect';

const ContactMessages: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const queryClient = useQueryClient();

  // Fetch contact messages
  const {
    data: messagesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contact-messages', currentPage, pageSize],
    queryFn: () => contactService.getContactMessages(currentPage, pageSize),
  });

  // Fetch contact statistics
  const { data: stats } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: contactService.getStats,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) =>
      contactService.updateMessageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Message status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update message status');
    },
  });

  // Handlers
  const handleViewMessage = useCallback((message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  }, []);

  const handleStatusChange = useCallback((messageId: string, newStatus: number) => {
    updateStatusMutation.mutate({ id: messageId, status: newStatus });
  }, [updateStatusMutation]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // Filtered messages (client-side filtering for search)
  const filteredMessages = useMemo(() => {
    const messages = messagesData?.content || [];
    if (!messages.length) return [];

    return messages.filter((message) => {
      const matchesSearch =
        !searchTerm ||
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'NEW' && message.status === 'NEW') ||
        (statusFilter === 'IN_PROGRESS' && message.status === 'IN_PROGRESS') ||
        (statusFilter === 'RESOLVED' && message.status === 'RESOLVED');

      return matchesSearch && matchesStatus;
    });
  }, [messagesData?.content, searchTerm, statusFilter]);

  // Utility functions
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'NEW':
        return <MessageSquare className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusNumber = useCallback((status: string) => {
    switch (status) {
      case 'NEW': return 0;
      case 'IN_PROGRESS': return 1;
      case 'RESOLVED': return 2;
      default: return 0;
    }
  }, []);

  // Calculate stats from API response
  const messageStats = useMemo(() => {
    if (!stats) return { total: 0, new: 0, inProgress: 0, resolved: 0 };
    
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
      new: statsMap['NEW'] || 0,
      inProgress: statsMap['IN_PROGRESS'] || 0,
      resolved: statsMap['RESOLVED'] || 0,
    };
  }, [stats]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'NEW', label: 'New' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];

  const statusUpdateOptions = [
    { value: '0', label: 'New' },
    { value: '1', label: 'In Progress' },
    { value: '2', label: 'Resolved' },
  ];

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load contact messages</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['contact-messages'] })}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage customer inquiries and support requests</p>
        </div>
      </div>

      {/* Message Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                {messageStats.total}
              </p>
            </div>
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">New</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">
                {messageStats.new}
              </p>
            </div>
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600 mt-1">
                {messageStats.inProgress}
              </p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
                {messageStats.resolved}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages by name, email, or content..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors text-sm ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[searchTerm, statusFilter !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <div className="block sm:hidden">
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block">
                  <CustomSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    placeholder="Select status"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Contact</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm hidden md:table-cell">Message</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm hidden lg:table-cell">Date</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Status</th>
                    <th className="text-left py-3 px-3 sm:px-6 font-medium text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{message.name}</p>
                          <p className="text-xs text-gray-500">{message.email}</p>
                          <div className="md:hidden mt-1">
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {message.message}
                            </p>
                          </div>
                          <div className="lg:hidden mt-1">
                            <p className="text-xs text-gray-500">
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        <p className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                          {message.message}
                        </p>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-sm text-gray-900 hidden lg:table-cell">
                        {formatDate(message.createdAt)}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                            {message.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewMessage(message)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="View message"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="block sm:hidden">
                            <select
                              value={getStatusNumber(message.status)}
                              onChange={(e) => handleStatusChange(message.id, parseInt(e.target.value))}
                              disabled={updateStatusMutation.isPending}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              {statusUpdateOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="hidden sm:block">
                            <CustomSelect
                              options={statusUpdateOptions}
                              value={getStatusNumber(message.status).toString()}
                              onChange={(value) => handleStatusChange(message.id, parseInt(value))}
                              placeholder="Update status"
                              className="text-xs"
                              disabled={updateStatusMutation.isPending}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {messagesData && (
              <Pagination
                currentPage={messagesData.number}
                totalPages={messagesData.totalPages}
                totalElements={messagesData.totalElements}
                pageSize={messagesData.size}
                onPageChange={handlePageChange}
              />
            )}

            {/* Empty State */}
            {filteredMessages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {hasActiveFilters ? 'No messages match your filters' : 'No contact messages found'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Message Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedMessage(null);
        }}
        title="Contact Message Details"
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedMessage.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMessage.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMessage.status)}`}>
                      {selectedMessage.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <div className="flex items-center gap-3">
                <div className="block sm:hidden flex-1">
                  <select
                    value={getStatusNumber(selectedMessage.status)}
                    onChange={(e) => {
                      handleStatusChange(selectedMessage.id, parseInt(e.target.value));
                      setIsViewModalOpen(false);
                      setSelectedMessage(null);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusUpdateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden sm:block flex-1">
                  <CustomSelect
                    options={statusUpdateOptions}
                    value={getStatusNumber(selectedMessage.status).toString()}
                    onChange={(value) => {
                      handleStatusChange(selectedMessage.id, parseInt(value));
                      setIsViewModalOpen(false);
                      setSelectedMessage(null);
                    }}
                    placeholder="Select new status"
                    disabled={updateStatusMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedMessage(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactMessages;