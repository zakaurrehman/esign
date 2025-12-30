import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentApi } from '../services/api';
import type { Document, Recipient, SignatureField } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PdfViewer } from '../components/pdf/PdfViewer';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800'
};

export const ViewDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      const response = await documentApi.get(id);
      setDocument(response.data.document);
      // Check for either pdfPath or pdfData (serverless stores in database)
      if (response.data.document.pdfPath || response.data.document.pdfData) {
        setPdfUrl(documentApi.getPdfUrl(id) + `?t=${Date.now()}`);
      }
    } catch (error) {
      toast.error('Failed to load document');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">{document.title}</h2>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${statusColors[document.status]}`}>
                {document.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Document Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-medium">{document.documentType === 'WRITTEN' ? 'Written' : 'Uploaded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium">{new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>
                  {document.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed:</span>
                      <span className="font-medium">{new Date(document.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Recipients ({document.recipients?.length || 0})</h3>
                <div className="space-y-2">
                  {document.recipients?.map((recipient: Recipient) => (
                    <div key={recipient.id} className="bg-slate-50 p-3 rounded-lg">
                      <div className="font-medium text-sm text-slate-900">{recipient.name}</div>
                      <div className="text-xs text-slate-600">{recipient.email}</div>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          recipient.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                          recipient.status === 'VIEWED' ? 'bg-blue-100 text-blue-800' :
                          recipient.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' :
                          recipient.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {recipient.status}
                        </span>
                      </div>
                      {recipient.signedAt && (
                        <div className="text-xs text-slate-500 mt-1">
                          Signed: {new Date(recipient.signedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Signature Fields ({document.fields?.length || 0})</h3>
                <div className="text-sm text-slate-600">
                  {document.fields?.filter((f: SignatureField) => f.completedAt).length || 0} of {document.fields?.length || 0} completed
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-900">Document Preview</h3>
            </CardHeader>
            <CardContent className="p-4">
              {pdfUrl ? (
                <div className="bg-slate-100 p-4 rounded-xl overflow-auto max-h-[75vh]">
                  <PdfViewer
                    url={pdfUrl}
                    renderOverlay={(pageNumber) => (
                      <div className="relative w-full h-full">
                        {document.fields
                          ?.filter((f: SignatureField) => f.pageNumber === pageNumber)
                          .map((field: SignatureField) => {
                            const isCompleted = !!field.completedAt;
                            const recipient = document.recipients?.find((r: Recipient) => r.id === field.recipientId);
                            return (
                              <div
                                key={field.id}
                                className={`absolute rounded-lg border-2 flex items-center justify-center ${
                                  isCompleted
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-indigo-300 bg-indigo-50'
                                }`}
                                style={{
                                  left: `${field.xPercent}%`,
                                  top: `${field.yPercent}%`,
                                  width: `${field.widthPercent}%`,
                                  height: `${field.heightPercent}%`,
                                  pointerEvents: 'none'
                                }}
                              >
                                {isCompleted && field.value ? (
                                  <img
                                    src={field.value}
                                    alt="Signature"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-center px-2">
                                    <div className="text-xs font-semibold text-indigo-700">
                                      {recipient?.name}
                                    </div>
                                    <div className="text-xs text-indigo-600">
                                      {isCompleted ? 'Signed' : 'Pending'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>No PDF available for this document.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
