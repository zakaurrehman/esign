import React, { useEffect, useState, useCallback, useRef } from 'react';
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
const getRecipientColor = (index: number) => recipientColors[index % recipientColors.length];

// Droppable PDF area component - defined outside to prevent remounting on re-renders
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
  
  // Track mouse position globally for accurate drop positioning
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track mouse position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      // Check for either pdfPath or pdfData (serverless stores in database)
      if (response.data.document.pdfPath || response.data.document.pdfData) {
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
    const { active } = event;

    if (!id || (!document?.pdfPath && !document?.pdfData)) return;

    const activeData = active.data.current as any;

    // Use the tracked mouse position
    const dropX = mousePosition.current.x;
    const dropY = mousePosition.current.y;

    // Find the PDF page containers - use our custom class
    const pdfPages = window.document.querySelectorAll('.pdf-drop-area .pdf-page-wrapper');
    
    if (pdfPages.length === 0) {
      toast.error('Please drop the field on the PDF document');
      return;
    }

    // Find which page the drop occurred on
    let targetPage = 1;
    let xPercent = 50; // Default center
    let yPercent = 50;
    let foundPage = false;

    for (let i = 0; i < pdfPages.length; i++) {
      const pageRect = pdfPages[i].getBoundingClientRect();
      
      // Check if drop is within this page
      if (dropX >= pageRect.left && dropX <= pageRect.right &&
          dropY >= pageRect.top && dropY <= pageRect.bottom) {
        targetPage = i + 1;
        
        // Calculate percentage position within the page
        xPercent = ((dropX - pageRect.left) / pageRect.width) * 100;
        yPercent = ((dropY - pageRect.top) / pageRect.height) * 100;
        
        // Clamp values to keep field within bounds (accounting for field size)
        xPercent = Math.max(2, Math.min(78, xPercent));
        yPercent = Math.max(2, Math.min(92, yPercent));
        foundPage = true;
        break;
      }
    }

    // If not dropped on a page, don't add the field
    if (!foundPage) {
      toast.error('Please drop the field on the PDF document');
      return;
    }

    if (activeData.isNew) {
      // Adding new field from palette
      const fieldData = {
        recipientId: activeData.recipientId,
        fieldType: activeData.type as FieldType,
        pageNumber: targetPage,
        xPercent,
        yPercent,
        widthPercent: activeData.type === 'SIGNATURE' ? 20 : 15,
        heightPercent: activeData.type === 'SIGNATURE' ? 8 : 5
      };
      try {
        const response = await fieldApi.add(id, fieldData);
        // Update local state with new field instead of refetching
        setDocument(prev => prev ? {
          ...prev,
          fields: [...(prev.fields || []), response.data.field]
        } : null);
        toast.success('Field added');
      } catch (error: any) {
        console.error('API error:', error);
        toast.error(error.response?.data?.error || 'Failed to add field');
      }
    } else {
      // Moving existing field - update local state optimistically
      const fieldId = active.id as string;
      
      // Update local state immediately for smooth UX
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          fields: prev.fields?.map(f => 
            f.id === fieldId 
              ? { ...f, xPercent, yPercent, pageNumber: targetPage }
              : f
          )
        };
      });

      // Then sync with server in background
      try {
        await fieldApi.update(fieldId, {
          xPercent,
          yPercent,
          pageNumber: targetPage
        });
      } catch (error: any) {
        // Revert on error by refetching
        fetchDocument();
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
      const response = await documentApi.send(id);
      if (response.data.requiresApproval) {
        toast.success('Document sent to your manager for approval!', { duration: 5000 });
      } else {
        toast.success('Document sent for signing!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send document');
    } finally {
      setIsSending(false);
    }
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
          <Card className="bg-white shadow-2xl rounded-2xl border border-slate-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[#22223b] font-sans">Recipients</h3>
                <Button size="sm" onClick={() => setShowAddRecipient(true)}>Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 font-sans">
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

          <Card className="bg-white shadow-2xl rounded-2xl border border-slate-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl">
              <h3 className="font-semibold text-[#22223b] font-sans">Signature Fields</h3>
            </CardHeader>
            <CardContent className="font-sans">
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
          <Card className="bg-white shadow-2xl rounded-2xl border border-slate-100">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-[#22223b] font-sans">{document.title}</h2>
            </CardHeader>
            <CardContent className="font-sans">
              {pdfUrl ? (
                <DroppablePdfArea>
                  <PdfViewer
                    url={pdfUrl}
                    onLoadSuccess={setPageCount}
                    renderOverlay={(pageNumber, pageWidth, pageHeight) => {
                      const pageFields = document.fields?.filter(f => f.pageNumber === pageNumber) || [];
                      return (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {pageFields
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
                    );}}
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
