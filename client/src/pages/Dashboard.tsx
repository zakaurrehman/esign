import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentApi, managerApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Document } from '../types/index';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
  DENIED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VOIDED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  DENIED: 'Needs Changes',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  VOIDED: 'Voided'
};

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [denyFeedback, setDenyFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isManager = user?.role === 'MANAGER';

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

  const fetchPendingApprovals = async () => {
    if (!isManager) return;
    try {
      const response = await managerApi.getPendingApprovals();
      setPendingApprovals(response.data.documents);
    } catch (error) {
      console.error('Failed to load pending approvals');
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchPendingApprovals();
  }, [isManager]);

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

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await managerApi.approveDocument(id);
      toast.success('Document approved and sent to recipients');
      fetchPendingApprovals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedDocId || !denyFeedback.trim()) {
      toast.error('Please provide feedback for the denial');
      return;
    }
    setIsProcessing(true);
    try {
      await managerApi.denyDocument(selectedDocId, { feedback: denyFeedback });
      toast.success('Document denied and user notified');
      setShowDenyModal(false);
      setDenyFeedback('');
      setSelectedDocId(null);
      fetchPendingApprovals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to deny document');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // --- Modern Dashboard Redesign ---
  // Stats Section (top)
  const completedCount = documents.filter(d => d.status === 'COMPLETED').length;
  const actionRequiredCount = documents.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length;
  const waitingCount = documents.filter(d => d.status === 'PENDING_APPROVAL').length;
  const expiringCount = 0; // Placeholder, add logic if you have expiry

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 flex flex-col items-start text-white">
          <span className="text-3xl font-bold mb-2">{completedCount}</span>
          <span className="font-semibold text-lg">Completed</span>
          <span className="mt-2 text-indigo-100">All finished documents</span>
        </div>
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-orange-400 to-amber-500 p-6 flex flex-col items-start text-white">
          <span className="text-3xl font-bold mb-2">{actionRequiredCount}</span>
          <span className="font-semibold text-lg">Action Required</span>
          <span className="mt-2 text-orange-100">Needs your attention</span>
        </div>
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 flex flex-col items-start text-white">
          <span className="text-3xl font-bold mb-2">{waitingCount}</span>
          <span className="font-semibold text-lg">Waiting for Others</span>
          <span className="mt-2 text-blue-100">Pending manager approval</span>
        </div>
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 p-6 flex flex-col items-start text-white">
          <span className="text-3xl font-bold mb-2">{expiringCount}</span>
          <span className="font-semibold text-lg">Expiring Soon</span>
          <span className="mt-2 text-pink-100">Expiring documents</span>
        </div>
      </div>

      {/* Manager: Pending Approvals Section */}
      {isManager && pendingApprovals.length > 0 && (
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-orange-100 to-amber-100 border-orange-200 shadow-xl rounded-2xl">
            <CardHeader className="border-b border-orange-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h2 className="text-xl font-bold text-orange-900">Pending Approvals</h2>
                  <p className="text-sm text-orange-700">{pendingApprovals.length} document(s) awaiting your review</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-orange-200">
                {pendingApprovals.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-orange-200/40 transition-colors rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <div className="text-sm text-slate-600 mt-1">
                          <span>From: <strong>{doc.user?.name}</strong></span>
                          <span className="mx-2">•</span>
                          <span>{doc.recipients?.length || 0} recipient(s)</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/document/${doc.id}`}>
                          <Button variant="secondary" size="sm">View PDF</Button>
                        </Link>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(doc.id)}
                          disabled={isProcessing}
                        >
                          ✓ Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setShowDenyModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          ✗ Deny
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Documents Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">My Documents</h1>
          <p className="text-sm text-slate-600 mt-1">Manage and track all your signature documents</p>
        </div>
        <Link to="/create">
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg hover:scale-105 transition-transform">
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
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg hover:scale-105 transition-transform">
                  + Create Your First Document
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-2xl transition-all bg-white rounded-2xl border-slate-200 border-2">
              <CardContent className="py-6 px-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{doc.title}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[doc.status] || statusColors.DRAFT}`}>
                      {statusLabels[doc.status] || doc.status}
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-slate-500">
                    <span>{doc.documentType === 'WRITTEN' ? 'Written' : 'Uploaded'}</span>
                    <span className="mx-2">•</span>
                    <span>{doc.recipients?.length || 0} recipient(s)</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {/* Manager Feedback for Denied Documents */}
                  {doc.status === 'DENIED' && doc.managerFeedback && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">Manager Feedback:</p>
                      <p className="text-sm text-red-700">{doc.managerFeedback}</p>
                    </div>
                  )}
                  {/* Pending Approval Info */}
                  {doc.status === 'PENDING_APPROVAL' && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-700">
                        ⏳ This document is waiting for manager approval before being sent to recipients.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-4">
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
                  {doc.status === 'DENIED' && (
                    <>
                      <Link to={`/prepare/${doc.id}`}>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Edit & Resubmit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                  {doc.status === 'PENDING_APPROVAL' && (
                    <Link to={`/document/${doc.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
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

      {/* Deny Modal */}
      <Modal
        isOpen={showDenyModal}
        onClose={() => {
          setShowDenyModal(false);
          setDenyFeedback('');
          setSelectedDocId(null);
        }}
        title="Deny Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide feedback explaining why this document is being denied. This will be sent to the user.
          </p>
          <textarea
            value={denyFeedback}
            onChange={(e) => setDenyFeedback(e.target.value)}
            placeholder="Enter your feedback here... (required)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[120px]"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDenyModal(false);
                setDenyFeedback('');
                setSelectedDocId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeny}
              isLoading={isProcessing}
              disabled={!denyFeedback.trim()}
            >
              Deny & Notify User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
