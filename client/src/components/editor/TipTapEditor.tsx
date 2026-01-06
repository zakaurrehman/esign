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
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

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
  'Impact',
  'Palatino',
  'Garamond',
  'Bookman',
  'Avant Garde'
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];

const THEME_COLORS = [
  ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF'],
  ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF'],
  ['#9900FF', '#FF00FF', '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3']
];

const STANDARD_COLORS = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050',
  '#00B0F0', '#0070C0', '#002060', '#7030A0'
];

const HIGHLIGHT_COLORS = [
  '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#0000FF',
  '#FF0000', '#00008B', '#008B8B', '#006400', '#800080',
  '#8B4513', '#808000', '#C0C0C0', '#808080', '#000000'
];

const BULLET_STYLES = [
  { label: '●', value: 'disc' },
  { label: '○', value: 'circle' },
  { label: '■', value: 'square' },
  { label: '➤', value: 'arrow' },
  { label: '✓', value: 'check' },
  { label: '◆', value: 'diamond' }
];

const NUMBER_STYLES = [
  { label: '1. 2. 3.', value: 'decimal' },
  { label: 'A. B. C.', value: 'upper-alpha' },
  { label: 'a. b. c.', value: 'lower-alpha' },
  { label: 'I. II. III.', value: 'upper-roman' },
  { label: 'i. ii. iii.', value: 'lower-roman' }
];

const LINE_SPACING = [
  { label: '1.0', value: 1.0 },
  { label: '1.15', value: 1.15 },
  { label: '1.5', value: 1.5 },
  { label: '2.0', value: 2.0 },
  { label: '2.5', value: 2.5 },
  { label: '3.0', value: 3.0 }
];

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ content, onChange }) => {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextEffects, setShowTextEffects] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [showBullets, setShowBullets] = useState(false);
  const [showNumbering, setShowNumbering] = useState(false);
  const [showBorders, setShowBorders] = useState(false);

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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
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
  const currentFontSize = '12';

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
                setShowTextEffects(false);
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
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto min-w-[220px]">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Theme Fonts</p>
                </div>
                <button
                  onClick={() => {
                    editor.chain().focus().setFontFamily('Calibri').run();
                    setShowFontMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors border-b border-gray-100"
                  style={{ fontFamily: 'Calibri' }}
                  type="button"
                >
                  <div className="font-medium">Calibri</div>
                  <div className="text-xs text-gray-500">Headings</div>
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().setFontFamily('Arial').run();
                    setShowFontMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors border-b border-gray-200"
                  style={{ fontFamily: 'Arial' }}
                  type="button"
                >
                  <div className="font-medium">Arial</div>
                  <div className="text-xs text-gray-500">Body</div>
                </button>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">All Fonts</p>
                </div>
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
                setShowTextEffects(false);
              }}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:border-indigo-400 hover:shadow-sm transition-all flex items-center gap-2 min-w-[80px] h-10 font-medium"
              type="button"
            >
              <span className="flex-1 text-left">{currentFontSize}</span>
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
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm transition-colors min-w-[100px]"
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Increase/Decrease Font Size */}
          <ToolbarButton onClick={() => {}} title="Increase Font Size">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <text x="2" y="18" fontSize="18" fontWeight="bold" fill="currentColor">A</text>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => {}} title="Decrease Font Size">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <text x="2" y="16" fontSize="14" fill="currentColor">A</text>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </ToolbarButton>

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

          {/* Text Effects */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTextEffects(!showTextEffects);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[40px] h-10 flex items-center justify-center gap-1"
              title="Text Effects"
              type="button"
            >
              <span className="text-base font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>A</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTextEffects && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded text-sm" style={{ textShadow: '0 0 3px rgba(0,0,0,0.5)' }}>Outline</button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded text-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Shadow</button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Reflection</button>
                <button className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded text-sm" style={{ textShadow: '0 0 10px #4A86E8' }}>Glow</button>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
                setShowTextEffects(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[40px] h-10 flex flex-col items-center justify-center gap-0.5"
              title="Text Color"
              type="button"
            >
              <span className="font-bold text-base">A</span>
              <div className="w-5 h-1 bg-red-500 rounded-full" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 min-w-[280px]">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Theme Colors</p>
                  {THEME_COLORS.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-1 mb-1">
                      {row.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            editor.chain().focus().setColor(color).run();
                            setShowColorPicker(false);
                          }}
                          className="w-7 h-7 rounded-md border-2 border-gray-200 hover:border-indigo-500 hover:scale-110 transition-all shadow-sm"
                          style={{ backgroundColor: color }}
                          type="button"
                          title={color}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Standard Colors</p>
                  <div className="flex flex-wrap gap-1">
                    {STANDARD_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor.chain().focus().setColor(color).run();
                          setShowColorPicker(false);
                        }}
                        className="w-7 h-7 rounded-md border-2 border-gray-200 hover:border-indigo-500 hover:scale-110 transition-all shadow-sm"
                        style={{ backgroundColor: color }}
                        type="button"
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <button className="w-full mt-3 px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors">
                  More Colors...
                </button>
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
                setShowTextEffects(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[40px] h-10 flex items-center justify-center gap-1"
              title="Highlight Color"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                <rect x="6" y="16" width="12" height="2" fill="#FFEB3B" />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[220px]">
                <div className="grid grid-cols-5 gap-1.5">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-indigo-500 hover:scale-110 transition-all shadow-sm"
                      style={{ backgroundColor: color }}
                      type="button"
                      title={color}
                    />
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-2">
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors"
                  >
                    No Color
                  </button>
                  <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-md transition-colors">
                    Stop Highlighting
                  </button>
                </div>
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
          <div className="relative">
            <button
              onClick={() => {
                setShowBullets(!showBullets);
                setShowNumbering(false);
                setShowLineSpacing(false);
                setShowBorders(false);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[40px] h-10 flex items-center justify-center gap-1 ${
                editor.isActive('bulletList')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Bullets"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showBullets && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[250px]">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bullet Library</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button className="p-3 border border-gray-200 rounded hover:bg-indigo-50 text-sm">None</button>
                  {BULLET_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        editor.chain().focus().toggleBulletList().run();
                        setShowBullets(false);
                      }}
                      className="p-3 border border-gray-200 rounded hover:bg-indigo-50 text-xl"
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Define New Bullet...</button>
                </div>
              </div>
            )}
          </div>

          {/* Numbered List */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNumbering(!showNumbering);
                setShowBullets(false);
                setShowLineSpacing(false);
                setShowBorders(false);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[40px] h-10 flex items-center justify-center gap-1 ${
                editor.isActive('orderedList')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Numbering"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNumbering && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 min-w-[280px]">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Numbering Library</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button className="p-3 border border-gray-200 rounded hover:bg-indigo-50 text-sm">None</button>
                  {NUMBER_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        editor.chain().focus().toggleOrderedList().run();
                        setShowNumbering(false);
                      }}
                      className="p-3 border border-gray-200 rounded hover:bg-indigo-50 text-xs text-left"
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Define New Number Format...</button>
                </div>
              </div>
            )}
          </div>

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

          {/* Line Spacing */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLineSpacing(!showLineSpacing);
                setShowBullets(false);
                setShowNumbering(false);
                setShowBorders(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all min-w-[40px] h-10 flex items-center justify-center gap-1"
              title="Line Spacing"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLineSpacing && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 min-w-[220px]">
                {LINE_SPACING.map((spacing) => (
                  <button
                    key={spacing.value}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2"
                  >
                    <span className="flex-1">{spacing.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 my-2"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">Line Spacing Options...</button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">Add Space Before Paragraph</button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">Remove Space After Paragraph</button>
              </div>
            )}
          </div>

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

          {/* Borders */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBorders(!showBorders);
                setShowBullets(false);
                setShowNumbering(false);
                setShowLineSpacing(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all min-w-[40px] h-10 flex items-center justify-center gap-1"
              title="Borders"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" strokeWidth={2} />
              </svg>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showBorders && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 min-w-[200px]">
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="3" y1="20" x2="21" y2="20" strokeWidth={2} />
                  </svg>
                  Bottom Border
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="3" y1="4" x2="21" y2="4" strokeWidth={2} />
                  </svg>
                  Top Border
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="4" y1="3" x2="4" y2="21" strokeWidth={2} />
                  </svg>
                  Left Border
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="20" y1="3" x2="20" y2="21" strokeWidth={2} />
                  </svg>
                  Right Border
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">No Border</button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">All Borders</button>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">Outside Borders</button>
                <div className="border-t border-gray-200 my-2"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm">Borders and Shading...</button>
              </div>
            )}
          </div>

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
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};
