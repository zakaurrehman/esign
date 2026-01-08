import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TipTapEditor } from '../components/editor/TipTapEditor';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TemplateManagement() {
  const [templateName, setTemplateName] = useState('Company Letterhead');
  const [templateContent, setTemplateContent] = useState('<p>Start designing your template...</p>');
  const [isLoading, setIsLoading] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/templates/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateName(data.template.name);
        setTemplateContent(data.template.htmlContent);
        setHasTemplate(true);
      }
    } catch (error) {
      console.log('No existing template');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: templateName,
          htmlContent: templateContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      toast.success('Template saved successfully');
      setHasTemplate(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Template Management</h2>
        <p className="text-gray-600">
          Create and edit the company letterhead template that users can use when creating documents
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <Input
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Company Letterhead"
            required
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Design your letterhead template below. Users will be able to write their document content on this template.
            </p>
            <TipTapEditor content={templateContent} onChange={setTemplateContent} />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={handleSaveTemplate} isLoading={isLoading}>
              {hasTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </div>

          {hasTemplate && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Active template is available. Users can now select "Use Template" when creating documents.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
