import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signApi } from '../services/api';
import type { SignatureField } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PdfViewer } from '../components/pdf/PdfViewer';
import { SignaturePad } from '../components/signature/SignaturePad';
import toast from 'react-hot-toast';

interface SigningData {
  document: { id: string; title: string; pageCount: number };
  recipient: { id: string; name: string; email: string };
  fields: SignatureField[];
  allRecipients: { id: string; name: string; status: string; signingOrder: number }[];
}

export const SignDocument: React.FC = () => {
  const { documentId, token } = useParams<{ documentId: string; token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SigningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!documentId || !token) return;

    try {
      const response = await signApi.getPage(documentId, token);
      setData(response.data);

      // Mark already completed fields
      const completed = new Set<string>();
      response.data.fields.forEach((f: SignatureField) => {
        if (f.completedAt) completed.add(f.id);
      });
      setCompletedFields(completed);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignature = async (dataUrl: string) => {
    if (!activeField || !documentId || !token) return;

    try {
      await signApi.submitSignature(documentId, token, {
        fieldId: activeField.id,
        value: dataUrl
      });

      setCompletedFields(prev => new Set([...prev, activeField.id]));
      setActiveField(null);
      toast.success('Signature applied');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to apply signature');
    }
  };

  const handleComplete = async () => {
    if (!documentId || !token) return;

    const requiredFields = data?.fields.filter(f => f.isRequired) || [];
    const allCompleted = requiredFields.every(f => completedFields.has(f.id));

    if (!allCompleted) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await signApi.complete(documentId, token);
      toast.success('Document signed successfully!');
      navigate('/sign/complete');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete signing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!documentId || !token) return;

    setIsSubmitting(true);
    try {
      await signApi.decline(documentId, token, { reason: declineReason });
      toast.success('You have declined to sign');
      navigate('/sign/declined');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to decline');
    } finally {
      setIsSubmitting(false);
      setShowDeclineModal(false);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 p-4">
        <Card className="max-w-md rounded-2xl">
          <CardContent className="text-center py-8">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Unable to Load Document</h3>
            <p className="mt-2 text-slate-600">{error}</p>
            <p className="mt-4 text-sm text-slate-500">
              The signing link may have expired or is invalid. Please contact the document sender for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const pdfUrl = signApi.getPdfUrl(documentId!, token!);
  const requiredFieldsCount = data.fields.filter(f => f.isRequired).length;
  const completedCount = data.fields.filter(f => f.isRequired && completedFields.has(f.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">{data.document.title}</h1>
              <p className="text-sm text-white/80">
                Signing as: <span className="font-semibold">{data.recipient.name}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/90 bg-white/20 px-3 py-1 rounded-lg">
                {completedCount} of {requiredFieldsCount} completed
              </span>
              <Button variant="secondary" onClick={() => setShowDeclineModal(true)}>
                Decline
              </Button>
              <Button onClick={handleComplete} isLoading={isSubmitting}>
                Finish Signing
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="rounded-2xl shadow-xl">
          <CardContent className="p-6">
            <div className="bg-slate-100 p-4 rounded-xl overflow-auto max-h-[70vh]">
              <PdfViewer
                url={pdfUrl}
                renderOverlay={(pageNumber) => (
                  <div className="relative w-full h-full">
                    {data.fields
                      .filter(f => f.pageNumber === pageNumber)
                      .map(field => {
                        const isCompleted = completedFields.has(field.id);
                        return (
                          <div
                            key={field.id}
                            onClick={() => !isCompleted && setActiveField(field)}
                            className={`absolute rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                              isCompleted
                                ? 'border-green-500 bg-green-50'
                                : 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100 animate-pulse'
                            }`}
                            style={{
                              left: `${field.xPercent}%`,
                              top: `${field.yPercent}%`,
                              width: `${field.widthPercent}%`,
                              height: `${field.heightPercent}%`,
                              pointerEvents: 'auto'
                            }}
                          >
                            {isCompleted ? (
                              field.value ? (
                                <img
                                  src={field.value}
                                  alt="Signature"
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <span className="text-green-600 text-xs">✓</span>
                              )
                            ) : (
                              <span className="text-indigo-600 text-xs font-semibold">
                                Click to sign
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Signature Modal */}
      <Modal
        isOpen={!!activeField}
        onClose={() => setActiveField(null)}
        title="Add Your Signature"
        size="lg"
      >
        <SignaturePad
          onSave={handleSignature}
          onCancel={() => setActiveField(null)}
        />
      </Modal>

      {/* Decline Modal */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline to Sign"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to decline signing this document?
          </p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (optional)"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowDeclineModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDecline} isLoading={isSubmitting}>
              Decline to Sign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
