import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function seedTemplate() {
  try {
    // Read the logo file and convert to base64
    // Try multiple possible paths for the logo
    const possiblePaths = [
      path.join(__dirname, '../../../HBS logo.jpg'),
      path.join(process.cwd(), 'HBS logo.jpg'),
      path.join(__dirname, '../../..', 'HBS logo.jpg'),
      'HBS logo.jpg'
    ];

    let logoBase64 = '';
    let logoPath = '';

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        logoPath = testPath;
        break;
      }
    }

    if (logoPath) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
      console.log('✅ Logo file found and converted to base64');
    } else {
      console.log('⚠️  Logo file not found, using text-based header');
    }

    // Create the HBS letterhead template HTML
    const templateHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; position: relative;">
        <!-- Header with Logo -->
        <div style="padding: 40px 60px 20px 60px; border-bottom: 1px solid #e5e7eb;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="HBS Logo" style="height: 60px; width: auto;" />` : '<div style="font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: #10b981;">hbs <span style="color: #3b82f6; font-weight: normal;">Hired Billing<br/>Support</span></div>'}
        </div>

        <!-- Main Content Area (User will write here) -->
        <div style="flex: 1; padding: 60px 60px 100px 60px;">
          <p style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 0;">
            [Start writing your document content here...]
          </p>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 60px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #ffffff;">
          <p style="font-family: Calibri, Arial, sans-serif; font-size: 9pt; color: #6b7280; margin: 0;">
            23209 Blackwell Ave, Port Charlotte, FL 33952 |
            <a href="mailto:info@hiredbillingsupport.com" style="color: #3b82f6; text-decoration: none;">info@hiredbillingsupport.com</a> |
            <a href="http://www.hiredbillingsupport.com" style="color: #3b82f6; text-decoration: none;">www.hiredbillingsupport.com</a>
          </p>
        </div>
      </div>
    `;

    // Deactivate all existing templates
    await prisma.template.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create the new template
    const template = await prisma.template.create({
      data: {
        name: 'HBS Company Letterhead',
        htmlContent: templateHTML,
        isActive: true
      }
    });

    console.log('✅ Template created successfully!');
    console.log('Template ID:', template.id);
    console.log('Template Name:', template.name);

  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplate();
