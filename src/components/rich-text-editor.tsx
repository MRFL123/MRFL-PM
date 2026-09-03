"use client";

import { useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressProjectLogo } from "@/lib/images";
import { uploadProjectAsset } from "@/lib/storage/assets";
import { cn } from "@/lib/utils";

const EMPTY_DOC = "<p></p>";

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "secondary" : "ghost"}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  content,
  onChange,
  editable,
  placeholder = "Write an update…",
  className,
}: {
  content: string;
  onChange?: (html: string) => void;
  editable: boolean;
  placeholder?: string;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      content: content || EMPTY_DOC,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: "rich-image",
          },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: "text-sky-700 underline underline-offset-2",
          },
        }),
        Placeholder.configure({ placeholder }),
      ],
      editorProps: {
        attributes: {
          class: "rich-content outline-none",
        },
      },
      onUpdate: ({ editor: next }) => {
        onChange?.(next.getHTML());
      },
    },
    []
  );

  if (editor && editor.isEditable !== editable) {
    editor.setEditable(editable);
  }

  const addLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const addImage = async (file: File) => {
    if (!editor) return;
    const { blob, contentType } = await compressProjectLogo(file, 1400);
    const src = await uploadProjectAsset(blob, contentType, "updates");
    editor.chain().focus().setImage({ src }).run();
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {editable && editor && (
        <div className="mb-3 flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-1">
          <ToolbarButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </ToolbarButton>
          <ToolbarButton
            label="Subheading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 />
          </ToolbarButton>
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </ToolbarButton>
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={addLink}>
            <Link2 />
          </ToolbarButton>
          <ToolbarButton label="Add image" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                try {
                  await addImage(file);
                } catch (error) {
                  window.alert(
                    error instanceof Error ? error.message : "Could not add image."
                  );
                }
              }
            }}
          />
        </div>
      )}
      <EditorContent editor={editor} className="min-h-[8rem] flex-1" />
    </div>
  );
}

export function RichTextView({ html }: { html: string }) {
  const isEmpty = !html || html === EMPTY_DOC || html.replace(/<[^>]+>/g, "").trim() === "";
  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground">No updates added yet.</p>
    );
  }
  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
