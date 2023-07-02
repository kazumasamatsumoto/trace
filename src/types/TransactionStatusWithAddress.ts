import { TransactionStatus } from 'symbol-sdk';

export type TransactionStatusWithAddress = {
  transactionsStatus: TransactionStatus;
  address: string;
};