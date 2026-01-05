import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { User } from '../types/index';

export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchUsers();
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/api/auth/users', newUser);
      toast.success('User created successfully');
      setNewUser({ email: '', name: '', password: '' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/auth/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-2">Manage system users and their access</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6 bg-white shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-slate-900">Create New User</h2>
          </CardHeader>
          <CardContent className="p-6">
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
              <Input
                label="Password"
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                placeholder="Temporary password for user"
              />
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

      <Card className="bg-white shadow-xl rounded-2xl">
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
                    Documents
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user._count?.documents || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.role !== 'SUPER_ADMIN' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
