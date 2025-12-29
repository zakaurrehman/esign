import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

type Mode = 'draw' | 'type';

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const [mode, setMode] = useState<Mode>('draw');
  const [typedName, setTypedName] = useState('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setTypedName('');
  };

  const handleSave = () => {
    if (mode === 'draw') {
      if (sigCanvas.current?.isEmpty()) {
        return;
      }
      const dataUrl = sigCanvas.current?.toDataURL('image/png');
      if (dataUrl) {
        onSave(dataUrl);
      }
    } else {
      if (!typedName.trim()) return;
      // Convert typed name to canvas image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = 'italic 48px "Brush Script MT", cursive, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        onSave(canvas.toDataURL('image/png'));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setMode('draw')}
          className={`px-4 py-2 text-sm font-medium ${
            mode === 'draw'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`px-4 py-2 text-sm font-medium ${
            mode === 'type'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="border rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 400,
              height: 150,
              className: 'signature-canvas w-full'
            }}
            backgroundColor="white"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your name"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div
            className="h-24 border rounded-lg bg-white flex items-center justify-center"
            style={{ fontFamily: '"Brush Script MT", cursive, serif', fontSize: '36px' }}
          >
            {typedName || 'Preview'}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleClear}>
          Clear
        </Button>
        <div className="space-x-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Signature
          </Button>
        </div>
      </div>
    </div>
  );
};
