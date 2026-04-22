'use client'

/**
 * LessonEditor — inline rich-text lesson editor for admins.
 *
 * Replaces the LessonEditModal popup. Lives inside the lesson player
 * right panel when admin activates edit mode.
 *
 * Toolbar: H1–H4, Bold, Italic, Strikethrough, InlineCode, CodeBlock,
 *          BulletList, NumberedList, Blockquote, Image (upload), Video
 *          (URL modal), Link, HorizontalRule.
 * ADD dropdown: Add resource link, Add resource file, Add transcript,
 *               Pin community post.
 * Footer: Published toggle + SAVE / CANCEL.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Image as ImageIcon, Link2, Video,
  Heading1, Heading2, Heading3, Heading4, ChevronDown,
  Loader2, Check, X, FileText, Link as LinkIcon, Pin,
  Plus, Terminal,
} from 'lucide-react'
import { updateLesson } from '@/lib/classroom-crud'
import { fileUrl } from '@/lib/classroom-crud'
import { getPb } from '@/lib/pocketbase'
import type { LessonRecord, LessonFormData } from '@/lib/classroom-crud'

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({
  active, onClick, children, title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition ${
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-body-muted hover:bg-surface-secondary hover:text-body'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Video URL modal ──────────────────────────────────────────────────────────

function VideoModal({
  onInsert,
  onClose,
}: {
  onInsert: (url: string) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleInsert() {
    const trimmed = url.trim()
    if (!trimmed) return
    onInsert(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Insertar video</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={15} />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-body">URL del video</label>
          <input
            ref={inputRef}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInsert() }}
            placeholder="YouTube, Vimeo, Loom, Wistia…"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-body-muted">
            Pega la URL de YouTube, Vimeo, Loom o Wistia.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            Insertar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Link modal ───────────────────────────────────────────────────────────────

function LinkModal({
  initialUrl,
  onSet,
  onClose,
}: {
  initialUrl: string
  onSet: (url: string) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Insertar enlace</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={15} />
          </button>
        </div>
        <input
          ref={inputRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSet(url.trim()) }}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSet(url.trim())}
            disabled={!url.trim()}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ADD dropdown ─────────────────────────────────────────────────────────────

type AddItem = {
  icon: React.ReactNode
  label: string
  action: () => void
}

function AddDropdown({ items }: { items: AddItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-body hover:bg-surface-secondary transition"
      >
        <Plus size={13} />
        ADD
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-surface rounded-xl shadow-lg border border-border py-1 z-50">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { item.action(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-body hover:bg-surface-secondary transition"
            >
              <span className="text-body-muted">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resource link modal ──────────────────────────────────────────────────────

function ResourceLinkModal({
  onAdd,
  onClose,
}: {
  onAdd: (label: string, url: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Añadir recurso (enlace)</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Nombre del recurso"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">Cancelar</button>
          <button
            onClick={() => { if (label.trim() && url.trim()) onAdd(label.trim(), url.trim()) }}
            disabled={!label.trim() || !url.trim()}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resource file modal ──────────────────────────────────────────────────────

function ResourceFileModal({
  onAdd,
  onClose,
}: {
  onAdd: (label: string, file: File) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [file, setFile] = useState<File | null>(null)

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Añadir recurso (archivo)</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded"><X size={15} /></button>
        </div>
        <div className="space-y-3">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Nombre del recurso"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <label className="block w-full border-2 border-dashed border-border rounded-lg py-4 text-center cursor-pointer hover:border-brand-300 transition">
            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <span className="text-sm text-body">{file.name}</span>
            ) : (
              <span className="text-xs text-body-muted">Haz clic para seleccionar un archivo</span>
            )}
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">Cancelar</button>
          <button
            onClick={() => { if (label.trim() && file) onAdd(label.trim(), file) }}
            disabled={!label.trim() || !file}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transcript modal ─────────────────────────────────────────────────────────

function TranscriptModal({
  initialValue,
  onSave,
  onClose,
}: {
  initialValue: string
  onSave: (text: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState(initialValue)

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border p-5 w-full max-w-lg space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Transcripción</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded"><X size={15} /></button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          placeholder="Pega o escribe la transcripción de la lección…"
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">Cancelar</button>
          <button
            onClick={() => onSave(text)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Convert video URL → embed HTML ──────────────────────────────────────────

function toEmbedHtml(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  )
  if (ytMatch)
    return `<div class="lesson-video-wrapper"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0" allowfullscreen></iframe></div>`

  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch)
    return `<div class="lesson-video-wrapper"><iframe src="https://player.vimeo.com/video/${vmMatch[1]}" allowfullscreen></iframe></div>`

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([A-Za-z0-9]+)/)
  if (loomMatch)
    return `<div class="lesson-video-wrapper"><iframe src="https://www.loom.com/embed/${loomMatch[1]}" allowfullscreen></iframe></div>`

  // Wistia
  const wistiaMatch = url.match(/wistia\.com\/medias\/([A-Za-z0-9]+)/)
  if (wistiaMatch)
    return `<div class="lesson-video-wrapper"><iframe src="https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}" allowfullscreen></iframe></div>`

  // Generic fallback — just link
  return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`
}

// ─── Main editor component ────────────────────────────────────────────────────

interface LessonEditorProps {
  lesson: LessonRecord
  onSave: (updated: LessonRecord) => void
  onCancel: () => void
}

export default function LessonEditor({ lesson, onSave, onCancel }: LessonEditorProps) {
  const [title, setTitle]           = useState(lesson.title)
  const [isPublished, setIsPublished] = useState(lesson.is_published)
  const [isFree, setIsFree]         = useState(lesson.is_free)
  const [videoUrl, setVideoUrl]     = useState(lesson.video_url)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Modals
  const [showVideo, setShowVideo]             = useState(false)
  const [showLink, setShowLink]               = useState(false)
  const [showResourceLink, setShowResourceLink] = useState(false)
  const [showResourceFile, setShowResourceFile] = useState(false)
  const [showTranscript, setShowTranscript]   = useState(false)

  const imageUploadRef = useRef<HTMLInputElement>(null)

  // ── TipTap editor ────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'lesson-link' } }),
      Placeholder.configure({ placeholder: 'Escribe el contenido de la lección…' }),
    ],
    content: lesson.description || '',
    editorProps: {
      attributes: {
        class: 'lesson-editor-prose focus:outline-none min-h-[200px]',
      },
    },
  })

  // ── Image upload via toolbar ─────────────────────────────────────────────
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    setImageFile(file)
    const objectUrl = URL.createObjectURL(file)
    editor.chain().focus().setImage({ src: objectUrl, alt: file.name }).run()
    e.target.value = ''
  }

  // ── Video insert ─────────────────────────────────────────────────────────
  function insertVideo(url: string) {
    setVideoUrl(url)
    if (!editor) return
    const html = toEmbedHtml(url)
    editor.chain().focus().insertContent(html).run()
    setShowVideo(false)
  }

  // ── Link insert ──────────────────────────────────────────────────────────
  function setLink(url: string) {
    if (!editor) return
    if (!url) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
    setShowLink(false)
  }

  // ── Resource link insert ─────────────────────────────────────────────────
  function insertResourceLink(label: string, url: string) {
    if (!editor) return
    editor.chain().focus()
      .insertContent(`<p>📎 <a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></p>`)
      .run()
    setShowResourceLink(false)
  }

  // ── Resource file: store file for later upload, insert placeholder ───────
  function insertResourceFile(label: string, file: File) {
    if (!editor) return
    // The actual upload happens on save; here we just note it
    editor.chain().focus()
      .insertContent(`<p>📁 ${label} <em>(archivo adjunto)</em></p>`)
      .run()
    setShowResourceFile(false)
  }

  // ── Transcript save ──────────────────────────────────────────────────────
  function saveTranscript(text: string) {
    if (!editor || !text.trim()) return
    setTranscript(text)
    editor.chain().focus()
      .insertContent(`<hr/><h3>Transcripción</h3><p>${text.replace(/\n/g, '</p><p>')}</p>`)
      .run()
    setShowTranscript(false)
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      const htmlContent = editor?.getHTML() ?? ''

      // Replace blob: image URLs with uploaded PB URLs
      let finalHtml = htmlContent
      if (imageFile) {
        // Upload image to PB, get URL, replace blob URL
        const formDataImg = new FormData()
        formDataImg.append('content_image', imageFile)
        const pb = getPb()
        const rec = await pb.collection('lessons').update(lesson.id, formDataImg)
        const uploadedUrl = fileUrl('lessons', lesson.id, (rec as Record<string, unknown>).content_image as string | undefined)
        if (uploadedUrl) {
          finalHtml = finalHtml.replace(/src="blob:[^"]*"/g, `src="${uploadedUrl}"`)
        }
      }

      const patch: Partial<LessonFormData & { sort_order: number }> = {
        title:        title.trim(),
        description:  finalHtml,
        video_url:    videoUrl.trim(),
        is_published: isPublished,
        is_free:      isFree,
      }

      const updated = await updateLesson(lesson.id, patch)
      if (!updated) throw new Error('No se pudo guardar.')
      onSave(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }, [title, videoUrl, isPublished, isFree, imageFile, editor, lesson.id, onSave])

  const currentLinkUrl = editor?.getAttributes('link').href ?? ''

  const addItems: AddItem[] = [
    {
      icon: <LinkIcon size={13} />,
      label: 'Recurso — enlace',
      action: () => setShowResourceLink(true),
    },
    {
      icon: <FileText size={13} />,
      label: 'Recurso — archivo',
      action: () => setShowResourceFile(true),
    },
    {
      icon: <FileText size={13} />,
      label: 'Transcripción',
      action: () => setShowTranscript(true),
    },
    {
      icon: <Pin size={13} />,
      label: 'Fijar post de comunidad',
      action: () => {
        // Placeholder — future: open post picker
        alert('Próximamente: vincular un post de la comunidad.')
      },
    },
  ]

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título de la lección"
        maxLength={180}
        className="w-full text-xl font-semibold text-gray-900 bg-transparent border-0 border-b border-border pb-3 mb-4 focus:outline-none focus:border-brand-400 placeholder:text-body-muted placeholder:font-normal transition"
      />

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 pb-2 mb-3 border-b border-border">
        {/* Headings */}
        <ToolBtn
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={15} />
        </ToolBtn>
        <ToolBtn
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolBtn>
        <ToolBtn
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolBtn>
        <ToolBtn
          title="Heading 4"
          active={editor.isActive('heading', { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 size={15} />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        {/* Inline marks */}
        <ToolBtn
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolBtn>
        <ToolBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolBtn>
        <ToolBtn
          title="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </ToolBtn>
        <ToolBtn
          title="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Terminal size={15} />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        {/* Lists + block */}
        <ToolBtn
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolBtn>
        <ToolBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolBtn>
        <ToolBtn
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolBtn>
        <ToolBtn
          title="Horizontal rule"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        {/* Media + link */}
        <input
          ref={imageUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />
        <ToolBtn
          title="Image"
          active={false}
          onClick={() => imageUploadRef.current?.click()}
        >
          <ImageIcon size={15} />
        </ToolBtn>
        <ToolBtn
          title="Add video"
          active={false}
          onClick={() => setShowVideo(true)}
        >
          <Video size={15} />
        </ToolBtn>
        <ToolBtn
          title="Link"
          active={editor.isActive('link')}
          onClick={() => setShowLink(true)}
        >
          <Link2 size={15} />
        </ToolBtn>
      </div>

      {/* ── Editor area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="lesson-editor-root"
        />
      </div>

      {/* ── ADD dropdown ───────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-border">
        <AddDropdown items={addItems} />
      </div>

      {/* ── Footer: meta toggles + save/cancel ─────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        {/* Toggles */}
        <div className="flex items-center gap-4">
          {/* Published */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsPublished(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isPublished ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  isPublished ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-body">Publicada</span>
          </label>

          {/* Free */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsFree(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isFree ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  isFree ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-body">Gratis</span>
          </label>
        </div>

        {/* Error + action buttons */}
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Guardar
          </button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showVideo && (
        <VideoModal
          onInsert={insertVideo}
          onClose={() => setShowVideo(false)}
        />
      )}
      {showLink && (
        <LinkModal
          initialUrl={currentLinkUrl}
          onSet={setLink}
          onClose={() => setShowLink(false)}
        />
      )}
      {showResourceLink && (
        <ResourceLinkModal
          onAdd={insertResourceLink}
          onClose={() => setShowResourceLink(false)}
        />
      )}
      {showResourceFile && (
        <ResourceFileModal
          onAdd={insertResourceFile}
          onClose={() => setShowResourceFile(false)}
        />
      )}
      {showTranscript && (
        <TranscriptModal
          initialValue={transcript}
          onSave={saveTranscript}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  )
}
