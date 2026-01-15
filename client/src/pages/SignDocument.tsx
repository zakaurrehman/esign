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
  const [signatureValues, setSignatureValues] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!documentId || !token) return;

    try {
      const response = await signApi.getPage(documentId, token);
      setData(response.data);

      // Mark already completed fields and store their values
      const completed = new Set<string>();
      const values = new Map<string, string>();
      response.data.fields.forEach((f: SignatureField) => {
        if (f.completedAt) {
          completed.add(f.id);
          if (f.value) values.set(f.id, f.value);
        }
      });
      setCompletedFields(completed);
      setSignatureValues(values);
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
      setSignatureValues(prev => new Map(prev).set(activeField.id, dataUrl));
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
        <Card className="max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100">
          <CardContent className="text-center py-8 font-sans">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 font-sans">
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
        <Card className="rounded-2xl shadow-2xl bg-white border border-slate-100">
          <CardContent className="p-6 font-sans">
            <div className="bg-slate-100 p-4 rounded-xl overflow-auto max-h-[70vh]">
              <PdfViewer
                url={pdfUrl}
                renderOverlay={(pageNumber) => (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {data.fields
                      .filter(f => f.pageNumber === pageNumber)
                      .map(field => {
                        const isCompleted = completedFields.has(field.id);
                        const signatureValue = signatureValues.get(field.id) || field.value;
                        return (
                          <div
                            key={field.id}
                            onClick={() => !isCompleted && setActiveField(field)}
                            className={`absolute rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all shadow-xl backdrop-blur-md bg-white/60 hover:bg-indigo-100/80 ${
                              isCompleted
                                ? 'border-green-500 ring-2 ring-green-300'
                                : 'border-indigo-400 hover:border-indigo-600'
                            }`}
                            style={{
                              left: `${field.xPercent}%`,
                              top: `${field.yPercent}%`,
                              width: `${field.widthPercent}%`,
                              height: `${field.heightPercent}%`,
                              pointerEvents: 'auto',
                              boxShadow: '0 4px 24px 0 rgba(80,80,180,0.10)'
                            }}
                          >
                            {isCompleted ? (
                              signatureValue ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <img
                                    src={signatureValue}
                                    alt="Signature"
                                    className="max-w-full max-h-full object-contain rounded"
                                  />
                                  <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white text-lg font-bold">✓</span>
                                </div>
                              ) : (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              )
                            ) : (
                              <span className="text-indigo-700 text-base font-semibold tracking-wide">
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
        title={activeField ? 'Sign: Signature' : ''}
        size="lg"
      >
        {activeField && (
          <div className="space-y-6 p-2 sm:p-4 font-sans">
            <div className="mb-2 text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-lg shadow-lg">
                Signature
              </span>
            </div>
            <SignaturePad
              onSave={handleSignature}
              onCancel={() => setActiveField(null)}
            />
          </div>
        )}
      </Modal>

      {/* Decline Modal */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline to Sign"
      >
        <div className="space-y-4 font-sans">
          <p className="text-[#22223b]">
            Are you sure you want to decline signing this document?
          </p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (optional)"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
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
