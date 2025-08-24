export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ContactStats {
  status: string;
  count: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface PaginatedContactResponse {
  totalElements: number;
  totalPages: number;
  size: number;
  content: ContactMessage[];
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    unpaged: boolean;
    paged: boolean;
    pageSize: number;
    pageNumber: number;
  };
  empty: boolean;
}