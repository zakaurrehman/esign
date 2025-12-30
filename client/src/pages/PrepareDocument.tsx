import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { documentApi, recipientApi, fieldApi } from '../services/api';
import type { Document, FieldType } from '../types/index';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PdfViewer } from '../components/pdf/PdfViewer';
import { DraggableField } from '../components/fields/DraggableField';
import { FieldPalette } from '../components/fields/FieldPalette';
import toast from 'react-hot-toast';

const recipientColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const PrepareDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '' });
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [, setPageCount] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      const response = await documentApi.get(id);
      setDocument(response.data.document);
      if (response.data.document.pdfPath) {
        setPdfUrl(documentApi.getPdfUrl(id) + `?t=${Date.now()}`);
      }
      if (response.data.document.recipients?.length > 0 && !selectedRecipientId) {
        setSelectedRecipientId(response.data.document.recipients[0].id);
      }
    } catch (error) {
      toast.error('Failed to load document');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, selectedRecipientId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleAddRecipient = async () => {
    if (!id || !newRecipient.name || !newRecipient.email) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await recipientApi.add(id, {
        name: newRecipient.name,
        email: newRecipient.email,
        signingOrder: (document?.recipients?.length || 0) + 1
      });
      toast.success('Recipient added');
      setNewRecipient({ name: '', email: '' });
      setShowAddRecipient(false);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add recipient');
    }
  };

  const handleDeleteRecipient = async (recipientId: string) => {
    if (!confirm('Delete this recipient and all their fields?')) return;

    try {
      await recipientApi.delete(recipientId);
      toast.success('Recipient deleted');
      if (selectedRecipientId === recipientId) {
        setSelectedRecipientId(null);
      }
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete recipient');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await fieldApi.delete(fieldId);
      toast.success('Field deleted');
      setSelectedFieldId(null);
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete field');
    }
  };

  const handleGeneratePdf = async () => {
    if (!id) return;

    setIsGeneratingPdf(true);
    try {
      await documentApi.generatePdf(id);
      toast.success('PDF generated successfully');
      fetchDocument();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !id || !document?.pdfPath) return;

    const activeData = active.data.current as any;

    // Calculate position from drop coordinates
    const dropArea = window.document.querySelector('.pdf-drop-area');
    if (!dropArea) return;

    const rect = dropArea.getBoundingClientRect();
    const scrollTop = dropArea.scrollTop || 0;

    // Get the position where the item was dropped relative to the container
    const dropX = (event as any).activatorEvent?.clientX || 0;
    const dropY = (event as any).activatorEvent?.clientY || 0;

    const xPercent = Math.max(0, Math.min(90, ((dropX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(90, ((dropY - rect.top + scrollTop) / rect.height) * 100));

    if (activeData.isNew) {
      // Adding new field from palette
      try {
        await fieldApi.add(id, {
          recipientId: activeData.recipientId,
          fieldType: activeData.type as FieldType,
          pageNumber: 1, // TODO: Detect which page
          xPercent,
          yPercent,
          widthPercent: activeData.type === 'SIGNATURE' ? 20 : 15,
          heightPercent: activeData.type === 'SIGNATURE' ? 8 : 5
        });
        toast.success('Field added');
        fetchDocument();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to add field');
      }
    } else {
      // Moving existing field
      try {
        await fieldApi.update(active.id as string, {
          xPercent,
          yPercent
        });
        fetchDocument();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to move field');
      }
    }
  };

  const handleSend = async () => {
    if (!id) return;
    if (!document?.recipients?.length) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!document?.fields?.length) {
      toast.error('Please add at least one signature field');
      return;
    }

    setIsSending(true);
    try {
      await documentApi.send(id);
      toast.success('Document sent for signing!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send document');
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientColor = (index: number) => recipientColors[index % recipientColors.length];

  // Droppable PDF area component
  const DroppablePdfArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setNodeRef } = useDroppable({
      id: 'pdf-drop-area'
    });

    return (
      <div ref={setNodeRef} className="pdf-drop-area overflow-auto max-h-[70vh] bg-gray-100 p-4 rounded">
        {children}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!document) return null;

  const selectedRecipientIndex = document.recipients?.findIndex(r => r.id === selectedRecipientId) ?? -1;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        {/* Left sidebar - Recipients & Fields */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-teal-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-teal-900">Recipients</h3>
                <Button size="sm" onClick={() => setShowAddRecipient(true)}>Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {document.recipients?.length === 0 ? (
                <p className="text-sm text-gray-500">No recipients added yet</p>
              ) : (
                document.recipients?.map((recipient, index) => (
                  <div
                    key={recipient.id}
                    className={`p-2 rounded border cursor-pointer ${
                      selectedRecipientId === recipient.id ? 'ring-2 ring-teal-500' : ''
                    }`}
                    style={{ borderColor: getRecipientColor(index) }}
                    onClick={() => setSelectedRecipientId(recipient.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{recipient.name}</div>
                        <div className="text-xs text-gray-500">{recipient.email}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipient(recipient.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-teal-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <h3 className="font-semibold text-teal-900">Signature Fields</h3>
            </CardHeader>
            <CardContent>
              <FieldPalette
                selectedRecipientId={selectedRecipientId}
                recipientColor={selectedRecipientIndex >= 0 ? getRecipientColor(selectedRecipientIndex) : '#888'}
              />
            </CardContent>
          </Card>

          <Button className="w-full shadow-lg" onClick={handleSend} isLoading={isSending}>
            Send for Signing
          </Button>
        </div>

        {/* Main content - PDF viewer */}
        <div className="flex-1">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-teal-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <h2 className="text-lg font-semibold text-teal-900">{document.title}</h2>
            </CardHeader>
            <CardContent>
              {pdfUrl ? (
                <DroppablePdfArea>
                  <PdfViewer
                    url={pdfUrl}
                    onLoadSuccess={setPageCount}
                    renderOverlay={(pageNumber, pageWidth, pageHeight) => (
                      <div className="relative w-full h-full">
                        {document.fields
                          ?.filter(f => f.pageNumber === pageNumber)
                          .map(field => {
                            const recipientIndex = document.recipients?.findIndex(
                              r => r.id === field.recipientId
                            ) ?? 0;
                            const recipient = document.recipients?.find(r => r.id === field.recipientId);
                            return (
                              <DraggableField
                                key={field.id}
                                field={field}
                                recipientColor={getRecipientColor(recipientIndex)}
                                recipientName={recipient?.name || 'Unknown'}
                                isSelected={selectedFieldId === field.id}
                                onClick={() => setSelectedFieldId(field.id)}
                                onDelete={() => handleDeleteField(field.id)}
                                pageWidth={pageWidth}
                                pageHeight={pageHeight}
                              />
                            );
                          })}
                      </div>
                    )}
                  />
                </DroppablePdfArea>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No PDF available.</p>
                  <p className="text-sm mt-2">
                    {document.documentType === 'WRITTEN'
                      ? 'Generate a PDF from your document content first.'
                      : 'Please upload a PDF file.'}
                  </p>
                  {document.documentType === 'WRITTEN' && (
                    <Button
                      onClick={handleGeneratePdf}
                      isLoading={isGeneratingPdf}
                      className="mt-4"
                    >
                      Generate PDF
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Recipient Modal */}
      <Modal
        isOpen={showAddRecipient}
        onClose={() => setShowAddRecipient(false)}
        title="Add Recipient"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            label="Email"
            type="email"
            value={newRecipient.email}
            onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
            placeholder="john@example.com"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowAddRecipient(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipient}>Add Recipient</Button>
          </div>
        </div>
      </Modal>

      <DragOverlay />
    </DndContext>
  );
};
