import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { managerApi } from '../services/api';
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
  DENIED: 'Denied',
  PENDING: 'Pending Signatures',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  VOIDED: 'Voided'
};

export const TeamDocuments: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [denyFeedback, setDenyFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    if (!isManager) {
      toast.error('Access denied. Managers only.');
      navigate('/');
      return;
    }
    fetchTeamDocuments();
  }, [isManager, navigate]);

  const fetchTeamDocuments = async () => {
    try {
      const response = await managerApi.getTeamDocuments();
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error('Failed to load team documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await managerApi.approveDocument(id);
      toast.success('Document approved and sent to recipients');
      fetchTeamDocuments();
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
      fetchTeamDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to deny document');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDocuments = filterStatus === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === filterStatus);

  const pendingCount = documents.filter(d => d.status === 'PENDING_APPROVAL').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Team Documents
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review and manage documents from your team members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card size="sm" variant="selectable" className={`cursor-pointer transition-all ${filterStatus === 'all' ? 'ring-2 ring-indigo-500' : ''}`}
          onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-900">{documents.length}</div>
            <div className="text-sm text-slate-600">Total Documents</div>
          </CardContent>
        </Card>
        <Card size="sm" variant="selectable" className={`cursor-pointer transition-all bg-orange-50 ${filterStatus === 'PENDING_APPROVAL' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => setFilterStatus('PENDING_APPROVAL')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-orange-700">Pending Approval</div>
          </CardContent>
        </Card>
        <Card size="sm" variant="selectable" className={`cursor-pointer transition-all bg-green-50 ${filterStatus === 'COMPLETED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </CardContent>
        </Card>
        <Card size="sm" variant="selectable" className={`cursor-pointer transition-all bg-blue-50 ${filterStatus === 'PENDING' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilterStatus('PENDING')}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {documents.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-blue-700">In Progress</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && filterStatus !== 'PENDING_APPROVAL' && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-orange-900">
                  {pendingCount} document(s) waiting for your approval
                </p>
                <p className="text-sm text-orange-700">Review and approve or deny pending documents</p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setFilterStatus('PENDING_APPROVAL')}
            >
              View Pending
            </Button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card variant="default">
          <CardContent className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-900">
              {filterStatus === 'all' ? 'No team documents yet' : `No ${statusLabels[filterStatus] || filterStatus} documents`}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Documents from users assigned to you will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card variant="default">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {filterStatus === 'all' ? 'All Team Documents' : statusLabels[filterStatus] || filterStatus}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({filteredDocuments.length})
                </span>
              </h2>
              {filterStatus !== 'all' && (
                <Button variant="secondary" size="sm" onClick={() => setFilterStatus('all')}>
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[doc.status]}`}>
                          {statusLabels[doc.status] || doc.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        <span>From: <strong>{doc.user?.name}</strong></span>
                        <span className="mx-2">•</span>
                        <span>{doc.recipients?.length || 0} recipient(s)</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Show manager feedback if denied */}
                      {doc.status === 'DENIED' && doc.managerFeedback && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                          <strong>Your feedback:</strong> {doc.managerFeedback}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/document/${doc.id}`}>
                        <Button variant="secondary" size="sm">View</Button>
                      </Link>
                      {doc.status === 'PENDING_APPROVAL' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
