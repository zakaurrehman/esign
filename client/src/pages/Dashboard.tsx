import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../services/api';
import type { Document } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800'
};

export const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.list();
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentApi.delete(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this document?')) return;

    try {
      await documentApi.void(id);
      toast.success('Document voided');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to void document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">My Documents</h1>
          <p className="text-sm text-slate-600 mt-1">Manage and track all your signature documents</p>
        </div>
        <Link to="/create">
          <Button size="lg">
            + Create Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card className="bg-white shadow-xl rounded-2xl border-indigo-100">
          <CardContent className="text-center py-16">
            <div className="bg-gradient-to-br from-indigo-100 to-violet-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="h-12 w-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No documents yet</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">Get started by creating your first document. You can write your own or upload an existing PDF.</p>
            <div className="mt-8">
              <Link to="/create">
                <Button size="lg">
                  + Create Your First Document
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-xl transition-all bg-white rounded-xl border-slate-200">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-slate-900">{doc.title}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[doc.status]}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    <span>{doc.documentType === 'WRITTEN' ? 'Written' : 'Uploaded'}</span>
                    <span className="mx-2">•</span>
                    <span>{doc.recipients?.length || 0} recipient(s)</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.status === 'DRAFT' && (
                    <>
                      <Link to={`/prepare/${doc.id}`}>
                        <Button size="sm">Prepare</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                  {(doc.status === 'PENDING' || doc.status === 'IN_PROGRESS') && (
                    <>
                      <Link to={`/document/${doc.id}`}>
                        <Button variant="secondary" size="sm">View</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleVoid(doc.id)}>
                        Void
                      </Button>
                    </>
                  )}
                  {doc.status === 'COMPLETED' && (
                    <Link to={`/document/${doc.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
