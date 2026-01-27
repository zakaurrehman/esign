import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import api, { managerApi } from '../services/api';
import type { User, UserRole } from '../types/index';

interface ExtendedUser extends User {
  _count?: { documents: number; managedUsers?: number };
  isActive?: boolean;
}

export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: '', 
    name: '', 
    password: '', 
    role: 'USER' as UserRole,
    managerId: '' 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as UserRole,
    managerId: '',
    isActive: true
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchUsers();
    fetchManagers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data.users);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await managerApi.getManagers();
      setManagers(response.data.managers);
    } catch (error: any) {
      console.error('Failed to load managers');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const payload = {
        ...newUser,
        managerId: newUser.role === 'USER' && newUser.managerId ? newUser.managerId : undefined
      };
      await api.post('/api/auth/users', payload);
      toast.success('User created successfully');
      setNewUser({ email: '', name: '', password: '', role: 'USER', managerId: '' });
      setShowCreateForm(false);
      fetchUsers();
      fetchManagers(); // Refresh managers list if we created a new manager
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: ExtendedUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: (user.role as UserRole) || 'USER',
      managerId: user.managerId || '',
      isActive: user.isActive ?? true
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive
      };

      if (editForm.password) {
        payload.password = editForm.password;
      }

      if (editForm.role === 'USER') {
        payload.managerId = editForm.managerId || null;
      }

      await api.put(`/api/auth/users/${editingUser.id}`, payload);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchManagers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their documents.`)) {
      return;
    }
    try {
      await api.delete(`/api/auth/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchManagers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadgeClass = (role: string | undefined) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'MANAGER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleDisplayName = (role: string | undefined) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MANAGER':
        return 'Manager';
      default:
        return 'User';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage system users, managers, and their access</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin/documents')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View All Documents
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            {showCreateForm ? 'Cancel' : '+ Create User'}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card size="lg" variant="default" className="mb-6">
          <CardHeader className="bg-blue-50">
            <h2 className="text-lg font-bold text-slate-900">Create New User</h2>
          </CardHeader>
          <CardContent className="p-6 font-sans">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  placeholder="Full name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  placeholder="Temporary password for user"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole, managerId: '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>
              
              {newUser.role === 'USER' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Assign to Manager (Optional)
                  </label>
                  <select
                    value={newUser.managerId}
                    onChange={(e) => setNewUser({ ...newUser, managerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Manager (Direct Send)</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    If assigned, documents from this user will require manager approval before sending.
                  </p>
                </div>
              )}

              {newUser.role === 'MANAGER' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Manager Role:</strong> This user will be able to review and approve/deny documents from users assigned to them.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" isLoading={isCreating}>
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="flex flex-row gap-4 mb-6 w-full">
          <Card size="md" variant="selectable" className="flex-1">
            <CardContent className="flex flex-col items-center justify-center font-sans p-0">
              <div className="text-4xl font-extrabold text-[#2563eb]">{users.filter(u => u.role === 'USER').length}</div>
              <div className="font-bold text-lg text-[#22223b] mt-2">Users</div>
            </CardContent>
          </Card>
          <Card size="md" variant="selectable" className="flex-1">
            <CardContent className="flex flex-col items-center justify-center font-sans p-0">
              <div className="text-4xl font-extrabold text-[#2563eb]">{users.filter(u => u.role === 'MANAGER').length}</div>
              <div className="font-bold text-lg text-[#22223b] mt-2">Managers</div>
            </CardContent>
          </Card>
          <Card size="md" variant="selectable" className="flex-1">
            <CardContent className="flex flex-col items-center justify-center font-sans p-0">
              <div className="text-4xl font-extrabold text-[#2563eb]">{users.filter(u => u.role === 'SUPER_ADMIN').length}</div>
              <div className="font-bold text-lg text-[#22223b] mt-2">Super Admins</div>
            </CardContent>
          </Card>
      </div>

      <Card variant="default">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">All Users ({users.length})</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Manager / Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.role === 'USER' && user.manager ? (
                        <span className="text-green-600">
                          📋 {user.manager.name}
                        </span>
                      ) : user.role === 'MANAGER' ? (
                        <span className="text-blue-600">
                          👥 {user._count?.managedUsers || 0} team members
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user._count?.documents || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.role !== 'SUPER_ADMIN' && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null); }}
        title={`Edit User: ${editingUser?.name || ''}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="New Password (leave blank to keep current)"
            type="text"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            placeholder="Enter new password"
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole, managerId: '' })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          {editForm.role === 'USER' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Assign to Manager</label>
              <select
                value={editForm.managerId}
                onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">No Manager (Direct Send)</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <select
              value={editForm.isActive ? 'active' : 'inactive'}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Inactive users cannot log in</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
