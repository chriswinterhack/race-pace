"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-brand-sky-100 text-brand-sky-700"
          : "text-brand-navy-500 hover:bg-brand-navy-100 hover:text-brand-navy-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-brand-navy-200 bg-brand-navy-50 rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-brand-navy-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-brand-navy-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-brand-navy-200 mx-1" />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove Link"
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
      )}

      <div className="flex-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter content...",
  className,
  editable = true,
  minHeight = "150px",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // Disable SSR to avoid hydration mismatches
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-sky-600 underline hover:text-brand-sky-700",
        },
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "prose-headings:text-brand-navy-900 prose-headings:font-semibold",
          "prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-2",
          "prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1.5",
          "prose-p:text-brand-navy-700 prose-p:my-2",
          "prose-ul:my-2 prose-ol:my-2",
          "prose-li:text-brand-navy-700 prose-li:my-0.5",
          "prose-strong:text-brand-navy-900",
          "prose-a:text-brand-sky-600 prose-a:no-underline hover:prose-a:underline"
        ),
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "border border-brand-navy-200 rounded-lg overflow-hidden",
        "focus-within:ring-2 focus-within:ring-brand-sky-500 focus-within:border-brand-sky-500",
        className
      )}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn("px-3 py-2 bg-white")}
        style={{ minHeight }}
      />
    </div>
  );
}

// Read-only display component for rendering rich text content
export function RichTextDisplay({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  // Clean up empty paragraphs that Tiptap creates for line breaks
  // Replace empty <p></p> with proper spacing or remove them
  const cleanedContent = content
    .replace(/<p><\/p>/g, '<p class="h-4"></p>') // Convert empty paragraphs to spacing
    .replace(/<p>\s*<\/p>/g, '<p class="h-4"></p>');

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:text-brand-navy-900 prose-headings:font-semibold",
        "prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-2",
        "prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1.5",
        "prose-p:my-3 first:prose-p:mt-0 last:prose-p:mb-0",
        "prose-ul:my-2 prose-ol:my-2",
        "prose-li:my-0.5",
        "prose-strong:font-semibold",
        "prose-a:text-brand-sky-600 prose-a:no-underline hover:prose-a:underline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  );
}
