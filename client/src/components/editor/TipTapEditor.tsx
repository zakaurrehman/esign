import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Calibri',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Tahoma',
  'Trebuchet MS',
  'Impact'
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

const TEXT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080'
];

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ content, onChange }) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4'
      }
    }
  });

  if (!editor) return null;

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
  }> = ({ onClick, isActive, children, title, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'
      }`}
      type="button"
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Arial';

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300">
        {/* First Row - Font Controls */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200">
          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontMenu(!showFontMenu);
                setShowSizeMenu(false);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2 min-w-[120px]"
              type="button"
            >
              <span className="truncate">{currentFontFamily}</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-64 overflow-y-auto min-w-[160px]">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font}
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font).run();
                      setShowFontMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm"
                    style={{ fontFamily: font }}
                    type="button"
                  >
                    {font}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSizeMenu(!showSizeMenu);
                setShowFontMenu(false);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2 min-w-[70px]"
              type="button"
            >
              <span>12</span>
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSizeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-64 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      // TipTap doesn't have built-in font size, we'll use heading or inline styles
                      setShowSizeMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm"
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Bold, Italic, Underline */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <strong className="font-bold">B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em className="italic">I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <u className="underline">U</u>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s className="line-through">S</s>
          </ToolbarButton>

          <Divider />

          {/* Subscript, Superscript */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Subscript"
          >
            X<sub className="text-xs">2</sub>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Superscript"
          >
            X<sup className="text-xs">2</sup>
          </ToolbarButton>

          <Divider />

          {/* Text Color */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
              }}
              className="px-2.5 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              title="Text Color"
              type="button"
            >
              <span>A</span>
              <div className="w-4 h-1 bg-red-500 rounded" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      type="button"
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
              }}
              className="px-2.5 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              title="Highlight Color"
              type="button"
            >
              <span className="bg-yellow-300 px-1">ab</span>
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      type="button"
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  type="button"
                >
                  No Color
                </button>
              </div>
            )}
          </div>

          <Divider />

          {/* Clear Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear Formatting"
          >
            <span className="text-xs">✗ Format</span>
          </ToolbarButton>
        </div>

        {/* Second Row - Paragraph Controls */}
        <div className="flex flex-wrap gap-1 p-2">
          {/* Bullet List */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Numbered List */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Decrease Indent */}
          <ToolbarButton
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            disabled={!editor.can().liftListItem('listItem')}
            title="Decrease Indent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </ToolbarButton>

          {/* Increase Indent */}
          <ToolbarButton
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            title="Increase Indent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Align Left */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Align Center */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Align Right */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Justify */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>

          <Divider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <Divider />

          {/* Quote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </ToolbarButton>

          {/* Horizontal Rule */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          >
            <span className="text-xs">─</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};
