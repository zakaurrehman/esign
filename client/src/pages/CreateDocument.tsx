import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { documentApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { TipTapEditor } from '../components/editor/TipTapEditor';
import { PdfEditor } from '../components/pdf/PdfEditor';
import toast from 'react-hot-toast';

type Mode = 'select' | 'upload' | 'template' | 'edit-pdf' | 'editing-pdf';

export const CreateDocument: React.FC = () => {
  const [mode, setMode] = useState<Mode>('select');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<p>Start writing your document...</p>');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPdfForEdit, setUploadedPdfForEdit] = useState<File | null>(null);
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    const docTitle = title || file.name.replace('.pdf', '');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', docTitle);

      const response = await documentApi.upload(formData);
      toast.success('Document uploaded successfully');
      navigate(`/prepare/${response.data.document.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  }, [title, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleEditPdfUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploadedPdfForEdit(file);
    setTitle(file.name.replace('.pdf', ''));
    setMode('editing-pdf');
  }, []);

  const { getRootProps: getEditPdfRootProps, getInputProps: getEditPdfInputProps, isDragActive: isEditPdfDragActive } = useDropzone({
    onDrop: handleEditPdfUpload,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/templates/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('No template found');
      }

      const data = await response.json();
      setContent(data.template.htmlContent);
      setMode('template');
    } catch (error: any) {
      toast.error('No template available. Please contact your administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedPdf = async (editedPdfBlob: Blob) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', editedPdfBlob, `${title}.pdf`);
      formData.append('title', title);

      const response = await documentApi.upload(formData);
      toast.success('PDF saved successfully');
      navigate(`/prepare/${response.data.document.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await documentApi.create({ title, htmlContent: content });
      toast.success('Document created successfully');
      navigate(`/prepare/${response.data.document.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create document');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#22223b] font-sans">Create Document</h1>
          <p className="text-sm text-[#2563eb] mt-1 font-sans">Choose how you want to create your document</p>
        </div>
        <div className="flex flex-row gap-8 w-full max-w-6xl mx-auto justify-center">
          <Card className="flex-1 min-w-[260px] max-w-[340px] h-56 cursor-pointer hover:shadow-2xl transition-all bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-10" onClick={() => setMode('upload')}>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-violet-100 to-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#22223b] font-sans">Upload PDF</h3>
              <p className="mt-2 text-sm text-[#2563eb] font-sans text-center">
                Upload an existing PDF document for signing
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[260px] max-w-[340px] h-56 cursor-pointer hover:shadow-2xl transition-all bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-10" onClick={() => setMode('edit-pdf')}>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-indigo-100 to-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#22223b] font-sans">Annotate PDF</h3>
              <p className="mt-2 text-sm text-[#2563eb] font-sans text-center">
                Add text and images on top of your PDF
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[260px] max-w-[340px] h-56 cursor-pointer hover:shadow-2xl transition-all bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-10" onClick={loadTemplate}>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#22223b] font-sans">Use Template</h3>
              <p className="mt-2 text-sm text-[#2563eb] font-sans text-center">
                Start with company letterhead template
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Upload PDF</h1>
          <Button variant="secondary" onClick={() => setMode('select')}>
            Back
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4">
            <Input
              label="Document Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use filename"
            />

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
              }`}
            >
              <input {...getInputProps()} />
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isDragActive ? (
                <p className="mt-2 text-indigo-600 font-medium">Drop the PDF here...</p>
              ) : (
                <>
                  <p className="mt-2 text-slate-600">Drag and drop a PDF file here, or click to select</p>
                  <p className="mt-1 text-sm text-slate-500">Maximum file size: 10MB</p>
                </>
              )}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-slate-600">Uploading...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'edit-pdf') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Annotate PDF</h1>
          <Button variant="secondary" onClick={() => setMode('select')}>
            Back
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4">
            <div
              {...getEditPdfRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isEditPdfDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
              }`}
            >
              <input {...getEditPdfInputProps()} />
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isEditPdfDragActive ? (
                <p className="mt-2 text-indigo-600 font-medium">Drop the PDF here...</p>
              ) : (
                <>
                  <p className="mt-2 text-slate-600">Drag and drop a PDF file here, or click to select</p>
                  <p className="mt-1 text-sm text-slate-500">Maximum file size: 10MB</p>
                  <p className="mt-3 text-sm font-medium text-indigo-600">✨ Add text annotations and images to your PDF</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'editing-pdf' && uploadedPdfForEdit) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-2">Annotate PDF - Add Text & Images</h1>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="max-w-md bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <PdfEditor
              file={uploadedPdfForEdit}
              onSave={handleSaveEditedPdf}
              onCancel={() => {
                setMode('edit-pdf');
                setUploadedPdfForEdit(null);
                setTitle('');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'template') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Template</h1>
          <Button variant="secondary" onClick={() => setMode('select')}>
            Back
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <Input
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              required
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <TipTapEditor content={content} onChange={setContent} />

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setMode('select')}>
                Cancel
              </Button>
              <Button onClick={handleTemplateSubmit} isLoading={isLoading}>
                Create Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
