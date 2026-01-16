import React from 'react';
import { Card, CardContent } from '../components/ui/Card';

export const SignComplete: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card size="md" variant="default" className="max-w-md">
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Signing Complete!</h2>
          <p className="mt-2 text-gray-600">
            Thank you for signing the document. You will receive a copy via email once all parties have signed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const SignDeclined: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card size="md" variant="default" className="max-w-md">
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Signing Declined</h2>
          <p className="mt-2 text-gray-600">
            You have declined to sign this document. The document owner has been notified.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
