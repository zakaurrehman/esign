import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// Get active template
export const getActiveTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.template.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!template) {
      return res.status(404).json({ error: 'No active template found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Get all templates (Super Admin only)
export const getAllTemplates = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Create or update template (Super Admin only)
export const upsertTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    const { name, htmlContent } = req.body;

    if (!name || !htmlContent) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    // Deactivate all existing templates
    await prisma.template.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new active template
    const template = await prisma.template.create({
      data: {
        name,
        htmlContent,
        isActive: true
      }
    });

    res.json({ template, message: 'Template saved successfully' });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
};

// Set template as active (Super Admin only)
export const setActiveTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    const { id } = req.params;

    // Deactivate all templates
    await prisma.template.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Activate selected template
    const template = await prisma.template.update({
      where: { id },
      data: { isActive: true }
    });

    res.json({ template, message: 'Template activated successfully' });
  } catch (error) {
    console.error('Error activating template:', error);
    res.status(500).json({ error: 'Failed to activate template' });
  }
};

// Delete template (Super Admin only)
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }

    const { id } = req.params;

    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.isActive) {
      return res.status(400).json({ error: 'Cannot delete active template' });
    }

    await prisma.template.delete({ where: { id } });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
