export interface EmailLog {
  type: 'documents' | 'photos';
  to: string;
  subject: string;
  sentAt: string;
  test: boolean;
}

export interface Job {
  id: string;
  workizJobId?: string;
  storeNumber: string;
  woNumber?: string;
  invoiceNumber?: string;
  invoiceSent?: boolean;
  address: string;
  city: string;
  state: string;
  zip?: string;
  storePhone?: string;
  price: number;
  serviceDate: string;
  nightNumber?: number;
  assignedTech?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime?: string;
  stopTime?: string;
  emailLogs?: EmailLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedScheduleRow {
  night: number;
  date: string;
  store: string;
  storeNumber: string;
  address: string;
  city: string;
  state: string;
  price?: number;
}
