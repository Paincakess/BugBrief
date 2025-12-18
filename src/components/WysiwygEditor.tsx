'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

interface WysiwygEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

// Simple HTML to Markdown converter
function htmlToMarkdown(html: string): string {
    let md = html;

    // Headers
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

    // Bold and italic
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

    // Code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');

    // Lists
    md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });
    md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
        let i = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${i++}. $1\n`) + '\n';
    });

    // Links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Paragraphs
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Clean up
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<\/?[^>]+(>|$)/g, ''); // Remove remaining tags
    md = md.replace(/\n{3,}/g, '\n\n'); // Remove extra newlines

    return md.trim();
}

// Simple Markdown to HTML converter
function markdownToHtml(md: string): string {
    let html = md;

    // Code blocks first (before other processing)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Lists - unordered
    html = html.replace(/^\- (.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Lists - ordered
    html = html.replace(/^\d+\. (.*)$/gim, '<li>$1</li>');

    // Paragraphs - wrap non-tagged content
    html = html.split('\n\n').map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre')) {
            return block;
        }
        return `<p>${block}</p>`;
    }).join('');

    return html;
}

export default function WysiwygEditor({ content, onChange, editable = true }: WysiwygEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: markdownToHtml(content),
        editable,
        immediatelyRender: false, // Prevent SSR hydration mismatch
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const markdown = htmlToMarkdown(html);
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-full p-6',
            },
        },
    });

    // Update content when it changes externally
    useEffect(() => {
        if (editor && content !== htmlToMarkdown(editor.getHTML())) {
            editor.commands.setContent(markdownToHtml(content));
        }
    }, [content, editor]);

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    if (!editor) return null;

    const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={clsx(
                "p-2 rounded hover:bg-[#333] transition-colors",
                active ? "bg-[#333] text-white" : "text-[var(--muted)]"
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar - Only show when editable */}
            {editable && (
                <div className="flex items-center gap-1 p-2 border-b border-[var(--card-border)] bg-[#0a0a0a] flex-shrink-0">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </ToolbarButton>
                    <div className="w-px h-6 bg-[var(--card-border)] mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </ToolbarButton>
                    <div className="w-px h-6 bg-[var(--card-border)] mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive('codeBlock')}
                        title="Code Block"
                    >
                        <Code size={16} />
                    </ToolbarButton>
                    <div className="w-px h-6 bg-[var(--card-border)] mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        title="Undo"
                    >
                        <Undo size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        title="Redo"
                    >
                        <Redo size={16} />
                    </ToolbarButton>
                </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto bg-[#050505] markdown-content">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
}
