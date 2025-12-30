import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { SignatureField, FieldType } from '../../types/index';

interface DraggableFieldProps {
  field: SignatureField;
  recipientColor: string;
  recipientName: string;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  pageWidth?: number;
  pageHeight?: number;
}

const fieldTypeLabels: Record<FieldType, string> = {
  SIGNATURE: 'Signature',
  INITIALS: 'Initials',
  DATE: 'Date',
  TEXT: 'Text',
  CHECKBOX: 'Check'
};

export const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  recipientColor,
  recipientName,
  isSelected,
  onClick,
  onDelete
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: field
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${field.xPercent}%`,
    top: `${field.yPercent}%`,
    width: `${field.widthPercent}%`,
    height: `${field.heightPercent}%`,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'move',
    pointerEvents: 'auto',
    zIndex: isDragging ? 100 : isSelected ? 50 : 10
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`rounded border-2 flex items-center justify-center text-xs font-medium ${
        isSelected ? 'ring-2 ring-offset-1 ring-teal-500' : ''
      }`}
      title={`${recipientName}: ${fieldTypeLabels[field.fieldType]}`}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: `${recipientColor}20`,
          borderColor: recipientColor
        }}
      >
        <span style={{ color: recipientColor }}>
          {fieldTypeLabels[field.fieldType]}
        </span>
      </div>
      {isSelected && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
};
