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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-md border-2 border-blue-100 p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-blue-200 transition-all">
          <span className="text-4xl font-bold text-blue-600">{completedCount}</span>
          <span className="font-bold text-slate-800 mt-3 text-base">Completed</span>
          <span className="text-sm text-slate-500 mt-1 text-center">All finished documents</span>
        </div>
        <div className="bg-white rounded-xl shadow-md border-2 border-orange-100 p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-orange-200 transition-all">
          <span className="text-4xl font-bold text-orange-600">{actionRequiredCount}</span>
          <span className="font-bold text-slate-800 mt-3 text-base">Action Required</span>
          <span className="text-sm text-slate-500 mt-1 text-center">Needs your attention</span>
        </div>
        <div className="bg-white rounded-xl shadow-md border-2 border-purple-100 p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-purple-200 transition-all">
          <span className="text-4xl font-bold text-purple-600">{waitingCount}</span>
          <span className="font-bold text-slate-800 mt-3 text-base">Waiting for Others</span>
          <span className="text-sm text-slate-500 mt-1 text-center">Pending manager approval</span>
        </div>
        <div className="bg-white rounded-xl shadow-md border-2 border-red-100 p-6 flex flex-col items-center justify-center hover:shadow-lg hover:border-red-200 transition-all">
          <span className="text-4xl font-bold text-red-600">{expiringCount}</span>
          <span className="font-bold text-slate-800 mt-3 text-base">Expiring Soon</span>
          <span className="text-sm text-slate-500 mt-1 text-center">Expiring documents</span>
        </div>
      </div>

      {/* Manager: Pending Approvals Section */}
      {isManager && pendingApprovals.length > 0 && (
        <div className="mb-8">
          <Card variant="stat" className="bg-orange-50 border-orange-200">
            <CardHeader className="border-b border-orange-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">!</div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2>
                  <p className="text-sm text-slate-600">{pendingApprovals.length} document(s) awaiting your review</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-orange-100">
                {pendingApprovals.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-orange-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{doc.title}</h3>
                        <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                          <span>From: <strong>{doc.user?.name}</strong></span>
                          <span>•</span>
                          <span>{doc.recipients?.length || 0} recipient(s)</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/document/${doc.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(doc.id)}
                          disabled={isProcessing}
                        >
                          Approve
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
                          Deny
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
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Documents</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track all your signature documents</p>
          </div>
          <Link to="/create">
            <Button size="md" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5">
              + Create Document
            </Button>
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No documents yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">Get started by creating your first document.</p>
            <div className="mt-5">
              <Link to="/create">
                <Button size="md" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Create Your First Document
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full min-h-[200px]">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 flex-1">{doc.title}</h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[doc.status] || statusColors.DRAFT}`}>
                      {statusLabels[doc.status] || doc.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-4">
                    {doc.documentType === 'WRITTEN' ? 'Written' : 'Uploaded'} • {doc.recipients?.length || 0} recipient(s) • {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                  {/* Manager Feedback for Denied Documents */}
                  {doc.status === 'DENIED' && doc.managerFeedback && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">Manager Feedback:</p>
                      <p className="text-xs text-red-700 line-clamp-2">{doc.managerFeedback}</p>
                    </div>
                  )}
                  {/* Pending Approval Info */}
                  {doc.status === 'PENDING_APPROVAL' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-orange-700">Awaiting manager approval</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-200">
                  {doc.status === 'DRAFT' && (
                    <>
                      <Link to={`/prepare/${doc.id}`} className="flex-1">
                        <Button size="sm" className="w-full">Prepare</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>Delete</Button>
                    </>
                  )}
                  {doc.status === 'DENIED' && (
                    <>
                      <Link to={`/prepare/${doc.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">Edit & Resubmit</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(doc.id)}>Delete</Button>
                    </>
                  )}
                  {doc.status === 'PENDING_APPROVAL' && (
                    <Link to={`/document/${doc.id}`} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full">View</Button>
                    </Link>
                  )}
                  {(doc.status === 'PENDING' || doc.status === 'IN_PROGRESS') && (
                    <>
                      <Link to={`/document/${doc.id}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full">View</Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleVoid(doc.id)}>Void</Button>
                    </>
                  )}
                  {doc.status === 'COMPLETED' && (
                    <Link to={`/document/${doc.id}`} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full">View</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
