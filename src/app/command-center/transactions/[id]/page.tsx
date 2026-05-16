'use client';

import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';
import { formatPrice } from '@/utils/FormatPrice';
import Image from 'next/image';

// Mock data - in a real app, this would come from an API
const mockTransaction = {
  id: 'TRX-789456',
  name: 'John Travis',
  service: 'Electricity Bill Payment',
  amount: 5000,
  status: 'Completed',
  date: 'Jan 15, 2025 14:30',
  avatar: '/Profile.png',
  meterNumber: '1234567890',
  disco: 'IKEDC',
  token: '1234-5678-9012-3456',
  units: 45.67,
  vat: 250,
  fee: 100,
  total: 5350,
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  // In a real app, you would fetch the transaction details using the id
  const transaction = mockTransaction;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Transactions
        </button>
      </div>

      {/* Transaction Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            <p className="text-gray-500">ID: {id}</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <FaPrint className="mr-2" />
              Print
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <FaDownload className="mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Image
                  src={transaction.avatar}
                  alt={transaction.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{transaction.name}</h3>
                <p className="text-sm text-gray-500">{transaction.service}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(transaction.amount)}</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  transaction.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : transaction.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd className="text-sm text-gray-900">{transaction.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                <dd className="text-sm text-gray-900">{transaction.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="text-sm text-gray-900">{transaction.service}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Meter Number</dt>
                <dd className="text-sm text-gray-900">{transaction.meterNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Disco</dt>
                <dd className="text-sm text-gray-900">{transaction.disco}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Token</dt>
                <dd className="text-sm text-gray-900 font-mono">{transaction.token}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Units</dt>
                <dd className="text-sm text-gray-900">{transaction.units} kWh</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="text-sm text-gray-900">{formatPrice(transaction.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">VAT (5%)</dt>
                <dd className="text-sm text-gray-900">{formatPrice(transaction.vat)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Convenience Fee</dt>
                <dd className="text-sm text-gray-900">{formatPrice(transaction.fee)}</dd>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <dt className="text-base font-semibold text-gray-900">Total</dt>
                <dd className="text-base font-semibold text-gray-900">
                  {formatPrice(transaction.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Token Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-500">Your token number</p>
                  <p className="text-xl font-bold text-gray-900">{transaction.token}</p>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Please enter this token on your prepaid meter to complete the transaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
