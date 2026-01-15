import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

// Set worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onLoadSuccess?: (numPages: number) => void;
  renderOverlay?: (pageNumber: number, pageWidth: number, pageHeight: number) => React.ReactNode;
  width?: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  onLoadSuccess,
  renderOverlay,
  width = 800
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      setIsLoadingPdf(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        });
        // Create a copy of the ArrayBuffer to prevent detachment
        const buffer = response.data.slice(0);
        setPdfData(buffer);
      } catch (err) {
        console.error('Failed to fetch PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setIsLoadingPdf(false);
      }
    };

    fetchPdf();
  }, [url]);

  // Memoize the file object to prevent unnecessary reloads
  const fileData = useMemo(() => {
    if (!pdfData) return null;
    return { data: new Uint8Array(pdfData) };
  }, [pdfData]);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  };

  const handlePageLoadSuccess = (page: any) => {
    setPageSize({
      width: page.width,
      height: page.height
    });
  };

  if (isLoadingPdf) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="text-center p-8 text-red-600">
        {error || 'Failed to load PDF. Please try again.'}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toolbar area for future controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-800 to-violet-800 rounded-t-2xl border border-b-0 border-indigo-900/20 shadow-md">
        <span className="font-semibold text-white text-lg">Document Preview</span>
        {/* Future: Add download, zoom, etc. */}
      </div>
      <div className="bg-white rounded-b-2xl border border-indigo-200 shadow-2xl overflow-x-auto p-2 sm:p-6">
        <Document
          file={fileData}
          onLoadSuccess={handleLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          }
          error={
            <div className="text-center p-8 text-red-600">
              Failed to load PDF. Please try again.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div key={index} className="pdf-page-wrapper relative mb-8 rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white" data-page-number={index + 1}>
              <Page
                pageNumber={index + 1}
                width={width}
                onLoadSuccess={handlePageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {renderOverlay && (
                <div
                  className="absolute pointer-events-auto z-10"
                  style={{ top: 0, left: 0, width: '100%', height: '100%' }}
                >
                  {renderOverlay(index + 1, pageSize.width, pageSize.height)}
                </div>
              )}
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};
