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
        <div key={index} className="pdf-page-wrapper relative mb-4 shadow-lg" data-page-number={index + 1}>
          <Page
            pageNumber={index + 1}
            width={width}
            onLoadSuccess={handlePageLoadSuccess}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
          {renderOverlay && (
            <div
              className="absolute inset-0 pointer-events-auto"
            >
              {renderOverlay(index + 1, pageSize.width, pageSize.height)}
            </div>
          )}
        </div>
      ))}
    </Document>
  );
};
