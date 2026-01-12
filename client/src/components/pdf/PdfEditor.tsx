import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  page: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface ImageAnnotation {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface ExtractedTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  fontSize: number;
  fontName: string;
  isEditing: boolean;
}

interface PdfEditorProps {
  file: File;
  onSave: (editedPdfBlob: Blob) => void;
  onCancel: () => void;
}

type Tool = 'select' | 'text' | 'image' | 'edit-existing';

export const PdfEditor: React.FC<PdfEditorProps> = ({ file, onSave, onCancel }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tool, setTool] = useState<Tool>('select');
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]);
  const [extractedTextItems, setExtractedTextItems] = useState<ExtractedTextItem[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Text tool states
  const [newText, setNewText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageLoadSuccess = async (page: any) => {
    const originalWidth = page.originalWidth;
    const renderedWidth = Math.min(window.innerWidth - 320, 800);
    const scale = renderedWidth / originalWidth;
    
    // Extract text only once when first page loads
    if (extractedTextItems.length === 0 && !isExtractingText) {
      extractTextFromPdf(scale);
    }
  };

  const extractTextFromPdf = async (scale: number) => {
    setIsExtractingText(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const allTextItems: ExtractedTextItem[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        textContent.items.forEach((item: any, index: number) => {
          if (item.str.trim()) {
            const transform = item.transform;
            const x = transform[4] * scale;
            const y = (viewport.height - transform[5]) * scale;
            
            allTextItems.push({
              id: `extracted-${pageNum}-${index}`,
              text: item.str,
              x: x,
              y: y,
              width: item.width * scale,
              height: item.height * scale,
              page: pageNum,
              fontSize: Math.round(transform[0] * scale),
              fontName: item.fontName || 'Helvetica',
              isEditing: false
            });
          }
        });
      }

      setExtractedTextItems(allTextItems);
      toast.success(`Extracted ${allTextItems.length} text items. Click "Edit Existing Text" to modify them.`);
    } catch (error) {
      console.error('Failed to extract text:', error);
      toast.error('Could not extract text from PDF');
    } finally {
      setIsExtractingText(false);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'text' && newText.trim()) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newAnnotation: TextAnnotation = {
        id: `text-${Date.now()}`,
        text: newText,
        x,
        y,
        page: currentPage,
        fontSize,
        color: textColor,
        fontFamily: 'Helvetica'
      };

      setTextAnnotations([...textAnnotations, newAnnotation]);
      setNewText('');
      setTool('select');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 200;
        const maxHeight = 200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const newAnnotation: ImageAnnotation = {
          id: `image-${Date.now()}`,
          dataUrl,
          x: 50,
          y: 50,
          width,
          height,
          page: currentPage
        };

        setImageAnnotations([...imageAnnotations, newAnnotation]);
        setTool('select');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAnnotationMouseDown = (e: React.MouseEvent, id: string, type: 'text' | 'image') => {
    e.stopPropagation();
    setSelectedAnnotation(id);
    setIsDragging(true);

    const annotation = type === 'text' 
      ? textAnnotations.find(a => a.id === id)
      : imageAnnotations.find(a => a.id === id);

    if (annotation) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedAnnotation) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    if (selectedAnnotation.startsWith('text-')) {
      setTextAnnotations(textAnnotations.map(a =>
        a.id === selectedAnnotation ? { ...a, x, y } : a
      ));
    } else if (selectedAnnotation.startsWith('image-')) {
      setImageAnnotations(imageAnnotations.map(a =>
        a.id === selectedAnnotation ? { ...a, x, y } : a
      ));
    } else if (selectedAnnotation.startsWith('extracted-')) {
      setExtractedTextItems(extractedTextItems.map(a =>
        a.id === selectedAnnotation ? { ...a, x, y } : a
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExtractedTextClick = (id: string) => {
    if (tool === 'edit-existing') {
      setExtractedTextItems(extractedTextItems.map(item =>
        item.id === id ? { ...item, isEditing: true } : { ...item, isEditing: false }
      ));
      setSelectedAnnotation(id);
    }
  };

  const handleExtractedTextChange = (id: string, newText: string) => {
    setExtractedTextItems(extractedTextItems.map(item =>
      item.id === id ? { ...item, text: newText } : item
    ));
  };

  const handleExtractedTextBlur = (id: string) => {
    setExtractedTextItems(extractedTextItems.map(item =>
      item.id === id ? { ...item, isEditing: false } : item
    ));
  };

  const deleteAnnotation = () => {
    if (!selectedAnnotation) return;

    if (selectedAnnotation.startsWith('text-')) {
      setTextAnnotations(textAnnotations.filter(a => a.id !== selectedAnnotation));
    } else if (selectedAnnotation.startsWith('image-')) {
      setImageAnnotations(imageAnnotations.filter(a => a.id !== selectedAnnotation));
    } else if (selectedAnnotation.startsWith('extracted-')) {
      setExtractedTextItems(extractedTextItems.filter(a => a.id !== selectedAnnotation));
      toast.success('Deleted text item');
    }
    setSelectedAnnotation(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Read the original PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // First, draw white rectangles over extracted text items that were edited or deleted
      // This "erases" the original text
      for (const item of extractedTextItems) {
        if (item.page <= pages.length) {
          const page = pages[item.page - 1];
          const { height } = page.getSize();
          const pdfY = height - item.y - item.height;

          // Draw white rectangle to cover original text
          page.drawRectangle({
            x: item.x - 2,
            y: pdfY - 2,
            width: item.width + 4,
            height: item.height + 4,
            color: rgb(1, 1, 1),
            borderWidth: 0
          });

          // Redraw the (potentially edited) text
          page.drawText(item.text, {
            x: item.x,
            y: pdfY,
            size: item.fontSize,
            color: rgb(0, 0, 0)
          });
        }
      }

      // Add text annotations
      for (const annotation of textAnnotations) {
        if (annotation.page <= pages.length) {
          const page = pages[annotation.page - 1];
          const { height } = page.getSize();

          // Convert y coordinate (top-down to bottom-up)
          const pdfY = height - annotation.y;

          page.drawText(annotation.text, {
            x: annotation.x,
            y: pdfY,
            size: annotation.fontSize,
            color: rgb(
              parseInt(annotation.color.slice(1, 3), 16) / 255,
              parseInt(annotation.color.slice(3, 5), 16) / 255,
              parseInt(annotation.color.slice(5, 7), 16) / 255
            )
          });
        }
      }

      // Add image annotations
      for (const annotation of imageAnnotations) {
        if (annotation.page <= pages.length) {
          const page = pages[annotation.page - 1];
          const { height } = page.getSize();

          // Convert base64 to bytes
          const base64Data = annotation.dataUrl.split(',')[1];
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          let image;
          try {
            if (annotation.dataUrl.includes('png')) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }

            // Convert y coordinate (top-down to bottom-up)
            const pdfY = height - annotation.y - annotation.height;

            page.drawImage(image, {
              x: annotation.x,
              y: pdfY,
              width: annotation.width,
              height: annotation.height
            });
          } catch (err) {
            console.error('Failed to embed image:', err);
          }
        }
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      
      onSave(blob);
      toast.success('PDF edited successfully');
    } catch (error) {
      console.error('Failed to save PDF:', error);
      toast.error('Failed to save PDF edits');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">PDF Annotation Tool</h3>
          <p className="text-xs text-gray-600 mt-1">Add text and images to your PDF</p>
        </div>

        {/* Tool Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tools</label>
          <div className="space-y-2">
            <button
              onClick={() => setTool('select')}
              className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                tool === 'select' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Select / Move
              </span>
            </button>
            <button
              onClick={() => setTool('edit-existing')}
              className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                tool === 'edit-existing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isExtractingText || extractedTextItems.length === 0}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Existing Text
                {isExtractingText && ' (Loading...)'}
                {!isExtractingText && extractedTextItems.length > 0 && ` (${extractedTextItems.length})`}
              </span>
            </button>
            <button
              onClick={() => setTool('text')}
              className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                tool === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add New Text
              </span>
            </button>
            <button
              onClick={() => {
                setTool('image');
                fileInputRef.current?.click();
              }}
              className="w-full px-4 py-2 text-left rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add Image
              </span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Text Options */}
        {tool === 'text' && (
          <div className="space-y-3 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text to add..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="8">8pt</option>
                  <option value="10">10pt</option>
                  <option value="12">12pt</option>
                  <option value="14">14pt</option>
                  <option value="16">16pt</option>
                  <option value="18">18pt</option>
                  <option value="20">20pt</option>
                  <option value="24">24pt</option>
                  <option value="28">28pt</option>
                  <option value="32">32pt</option>
                  <option value="36">36pt</option>
                  <option value="48">48pt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-1">📝 How to add text:</p>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Type your text above</li>
                <li>Click anywhere on the PDF</li>
                <li>Text will appear at that location</li>
              </ol>
            </div>
          </div>
        )}

        {/* Selected Annotation Options */}
        {selectedAnnotation && (
          <div className="pt-4 border-t">
            <Button
              variant="danger"
              onClick={deleteAnnotation}
              className="w-full"
            >
              Delete Selected
            </Button>
          </div>
        )}

        {/* Page Navigation */}
        <div className="pt-4 border-t space-y-2">
          <label className="block text-sm font-medium text-gray-700">Page</label>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="text-sm font-medium">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage === numPages}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t space-y-2">
          <Button onClick={handleSave} isLoading={isSaving} className="w-full">
            Save & Continue
          </Button>
          <Button variant="secondary" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 bg-gray-100 overflow-auto scrollbar-visible" style={{ scrollbarWidth: 'auto', scrollbarColor: '#6366f1 #e5e7eb' }}>
        {/* Active Tool Banner */}
        {tool === 'text' && newText && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 shadow-lg">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              <span className="font-medium">👆 Click anywhere on the PDF below to place: "{newText.substring(0, 40)}{newText.length > 40 ? '...' : ''}"</span>
            </div>
          </div>
        )}
        {tool === 'edit-existing' && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 shadow-lg">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-medium">✏️ Edit Mode: Click on any text in the PDF to modify it</span>
            </div>
          </div>
        )}
        <div className="flex justify-center p-8 min-h-full">
          <Document
            file={file}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            }
            error={
              <div className="text-center p-8 text-red-600">
                <p>Failed to load PDF. Please try again.</p>
              </div>
            }
          >
            <div
              ref={containerRef}
              className="relative bg-white shadow-2xl inline-block"
              onClick={handlePageClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: tool === 'text' && newText ? 'crosshair' : 'default' }}
            >
              <Page
                pageNumber={currentPage}
                width={Math.min(window.innerWidth - 320, 800)}
                onLoadSuccess={handlePageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />

              {/* Only show extracted text when we have it - this replaces the original PDF text */}
              {extractedTextItems.length > 0 && extractedTextItems
                .filter(item => item.page === currentPage)
                .map(item => (
                  item.isEditing ? (
                    <input
                      key={item.id}
                      type="text"
                      value={item.text}
                      onChange={(e) => handleExtractedTextChange(item.id, e.target.value)}
                      onBlur={() => handleExtractedTextBlur(item.id)}
                      autoFocus
                      className="absolute border-2 border-green-500 bg-white px-1 focus:outline-none focus:ring-2 focus:ring-green-600"
                      style={{
                        left: item.x,
                        top: item.y,
                        fontSize: item.fontSize,
                        width: Math.max(item.width, 100),
                        fontFamily: 'Helvetica'
                      }}
                    />
                  ) : (
                    <div
                      key={item.id}
                      className={`absolute ${
                        tool === 'edit-existing' ? 'cursor-text hover:bg-yellow-100 hover:ring-2 hover:ring-yellow-500' : 'cursor-move'
                      } ${
                        selectedAnnotation === item.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                      }`}
                      style={{
                        left: item.x,
                        top: item.y,
                        fontSize: item.fontSize,
                        userSelect: 'none',
                        padding: '1px 2px',
                        whiteSpace: 'pre'
                      }}
                      onClick={() => handleExtractedTextClick(item.id)}
                      onMouseDown={(e) => {
                        if (tool !== 'edit-existing') {
                          handleAnnotationMouseDown(e, item.id, 'text');
                        }
                      }}
                    >
                      {item.text}
                    </div>
                  )
                ))}

              {/* Render text annotations (new text added by user) */}
              {textAnnotations
                .filter(a => a.page === currentPage)
                .map(annotation => (
                  <div
                    key={annotation.id}
                    className={`absolute cursor-move whitespace-pre-wrap ${
                      selectedAnnotation === annotation.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:ring-1 hover:ring-indigo-300'
                    }`}
                    style={{
                      left: annotation.x,
                      top: annotation.y,
                      fontSize: annotation.fontSize,
                      color: annotation.color,
                      fontFamily: annotation.fontFamily,
                      userSelect: 'none',
                      maxWidth: '600px',
                      padding: '2px 4px'
                    }}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, annotation.id, 'text')}
                  >
                    {annotation.text}
                  </div>
                ))}

              {/* Render image annotations */}
              {imageAnnotations
                .filter(a => a.page === currentPage)
                .map(annotation => (
                  <img
                    key={annotation.id}
                    src={annotation.dataUrl}
                    alt="Annotation"
                    className={`absolute cursor-move ${
                      selectedAnnotation === annotation.id ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-indigo-300'
                    }`}
                    style={{
                      left: annotation.x,
                      top: annotation.y,
                      width: annotation.width,
                      height: annotation.height
                    }}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, annotation.id, 'image')}
                    draggable={false}
                  />
                ))}
            </div>
          </Document>
        </div>

        {/* Info Banner */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-900">
                <p className="font-bold mb-2">✅ NOW YOU CAN EDIT EXISTING PDF TEXT!</p>
                <p className="mb-2">The PDF text has been extracted. Click <strong>"Edit Existing Text"</strong> tool, then click any text on the PDF to edit it.</p>
                <p className="text-xs">Extracted {extractedTextItems.length} text items from the PDF.</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to use:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Edit Existing Text:</strong> Click "Edit Existing Text" tool (green button), then click on any existing text to modify it</li>
                  <li><strong>Add New Text:</strong> Select "Add New Text", type your text in the sidebar, then click on the PDF where you want to place it</li>
                  <li><strong>Add Image:</strong> Click "Add Image" to upload and place images on the PDF</li>
                  <li><strong>Move Items:</strong> Use "Select / Move" tool to drag and reposition any text or images</li>
                  <li><strong>Delete:</strong> Select an item, then click "Delete Selected" button in the sidebar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
