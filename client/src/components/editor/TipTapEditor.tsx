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
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF',
  '#F3F3F3', '#FFFFFF', '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF',
  '#4A86E8', '#0000FF', '#9900FF', '#FF00FF', '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC',
  '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC'
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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-6'
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[40px] h-10 flex items-center justify-center ${
        isActive
          ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
      }`}
      type="button"
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-8 bg-gray-200 mx-2" />;

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Arial';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
      {/* Toolbar */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        {/* First Row - Font Controls */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontMenu(!showFontMenu);
                setShowSizeMenu(false);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-2 min-w-[150px] h-10 font-medium"
              type="button"
            >
              <span className="truncate flex-1 text-left">{currentFontFamily}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto min-w-[180px]">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font}
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font).run();
                      setShowFontMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors"
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
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-2 min-w-[80px] h-10 font-medium"
              type="button"
            >
              <span className="flex-1 text-left">12</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSizeMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setShowSizeMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors min-w-[80px]"
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
            <strong className="font-bold text-base">B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <em className="italic text-base">I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <u className="underline text-base">U</u>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s className="line-through text-base">S</s>
          </ToolbarButton>

          <Divider />

          {/* Subscript, Superscript */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Subscript"
          >
            <span className="text-sm">X<sub className="text-xs">₂</sub></span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Superscript"
          >
            <span className="text-sm">X<sup className="text-xs">²</sup></span>
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
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[40px] h-10 flex flex-col items-center justify-center gap-0.5"
              title="Text Color"
              type="button"
            >
              <span className="font-bold text-base">A</span>
              <div className="w-5 h-1 bg-red-500 rounded-full" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[240px]">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Text Color</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-md border-2 border-gray-200 hover:border-indigo-500 hover:scale-110 transition-all shadow-sm"
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
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[40px] h-10 flex items-center justify-center"
              title="Highlight Color"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                <rect x="6" y="16" width="12" height="2" fill="#FFEB3B" />
              </svg>
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[240px]">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Highlight Color</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded-md border-2 border-gray-200 hover:border-indigo-500 hover:scale-110 transition-all shadow-sm"
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
                  className="w-full mt-3 px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  type="button"
                >
                  No Highlight
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Second Row - Paragraph Controls */}
        <div className="flex flex-wrap items-center gap-2 p-4">
          {/* Bullet List */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Numbered List */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </ToolbarButton>

          {/* Increase Indent */}
          <ToolbarButton
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            title="Increase Indent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Align Center */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Align Right */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </ToolbarButton>

          {/* Justify */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span className="font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <span className="font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <span className="font-bold">H3</span>
          </ToolbarButton>

          <Divider />

          {/* Quote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </ToolbarButton>

          {/* Horizontal Rule */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};
