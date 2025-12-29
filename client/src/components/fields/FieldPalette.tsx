import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { FieldType } from '../../types/index';

interface FieldPaletteProps {
  selectedRecipientId: string | null;
  recipientColor: string;
}

const fieldTypes: { type: FieldType; label: string; icon: string }[] = [
  { type: 'SIGNATURE', label: 'Signature', icon: '✍️' },
  { type: 'INITIALS', label: 'Initials', icon: 'AB' },
  { type: 'DATE', label: 'Date', icon: '📅' },
  { type: 'TEXT', label: 'Text', icon: '📝' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: '☑️' }
];

interface DraggablePaletteItemProps {
  type: FieldType;
  label: string;
  icon: string;
  recipientId: string;
  color: string;
}

const DraggablePaletteItem: React.FC<DraggablePaletteItemProps> = ({
  type,
  label,
  icon,
  recipientId,
  color
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, recipientId, isNew: true }
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center space-x-2 p-2 rounded border cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? 'opacity-50' : 'hover:bg-gray-50'
      }`}
      style={{ borderColor: color }}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export const FieldPalette: React.FC<FieldPaletteProps> = ({
  selectedRecipientId,
  recipientColor
}) => {
  if (!selectedRecipientId) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        Select a recipient to add fields
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-3">Drag fields onto the document:</p>
      {fieldTypes.map(({ type, label, icon }) => (
        <DraggablePaletteItem
          key={type}
          type={type}
          label={label}
          icon={icon}
          recipientId={selectedRecipientId}
          color={recipientColor}
        />
      ))}
    </div>
  );
};
