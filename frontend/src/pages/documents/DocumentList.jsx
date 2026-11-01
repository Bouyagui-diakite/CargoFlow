import { useState } from 'react'
import { Upload, Download, Eye, Trash2, FileText, Search, Loader2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { PageLoader, ApiError } from '../../components/ui/Loading'
import { useApi, useMutation } from '../../hooks/useApi'
import { documentService } from '../../services/document.service'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TYPE_LABELS = {
  awb:          { label: 'AWB',          color: 'bg-blue-900/50 text-blue-300 border-blue-700/40' },
  dgr:          { label: 'DGR',          color: 'bg-orange-900/50 text-orange-300 border-orange-700/40' },
  notoc:        { label: 'NOTOC',        color: 'bg-purple-900/50 text-purple-300 border-purple-700/40' },
  certificate:  { label: 'Certificate',  color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40' },
  packing_list: { label: 'Packing List', color: 'bg-slate-700 text-slate-300 border-slate-600' },
}

const FILE_ICONS = { pdf: '📄', xlsx: '📊', docx: '📝', png: '🖼️', jpg: '🖼️' }

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentList() {
  const { showToast } = useToast()
  const { user, can } = useAuth()
  const canUpload = can('create_awb')
  const canDelete = (doc) => !!user && (doc.uploaded_by === user.id || ['admin', 'supervisor'].includes(user.role))

  const [typeFilter,   setTypeFilter]  = useState('all')
  const [search,       setSearch]      = useState('')
  const [uploadModal,  setUploadModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dragging,     setDragging]    = useState(false)
  const [file,         setFile]        = useState(null)
  const [docAction,    setDocAction]   = useState({}) // { [id]: 'view' | 'download' }

  const { data, loading, error, refetch } = useApi(
    () => documentService.list(typeFilter !== 'all' ? { type: typeFilter } : {})
  )
  const docs = data?.data || data || []

  const uploadMut = useMutation((formData) => documentService.upload(formData))
  const deleteMut = useMutation((id)       => documentService.remove(id))

  const setAction = (id, action) =>
    setDocAction(prev => action ? { ...prev, [id]: action } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== String(id))))

  const handleView = async (doc) => {
    setAction(doc.id, 'view')
    try {
      const blob = await documentService.download(doc.id)
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 15000)
    } catch {
      showToast('Failed to open document.', 'error')
    } finally {
      setAction(doc.id, null)
    }
  }

  const handleDownload = async (doc) => {
    setAction(doc.id, 'download')
    try {
      const blob = await documentService.download(doc.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = doc.name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Failed to download document.', 'error')
    } finally {
      setAction(doc.id, null)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    const form = new FormData(e.target)
    form.append('file', file)
    const { ok, error: err } = await uploadMut.mutate(form)
    if (ok) {
      setUploadModal(false)
      setFile(null)
      showToast('Document uploaded successfully.')
      refetch()
    } else {
      showToast(err || 'Upload failed.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { ok } = await deleteMut.mutate(deleteTarget.id)
    setDeleteTarget(null)
    if (ok) { showToast('Document deleted.'); refetch() }
    else showToast('Failed to delete document.', 'error')
  }

  const filtered = docs.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))

  if (error) return <ApiError error={error} onRetry={refetch} />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Document Repository</h1>
          <p className="text-sm text-slate-500 mt-0.5">{docs.length} documents stored</p>
        </div>
        {canUpload && (
          <button onClick={() => setUploadModal(true)} className="btn-primary">
            <Upload size={16} /> Upload Document
          </button>
        )}
      </div>

      {/* Type filter cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn('card p-4 text-left border transition-colors hover:border-slate-600', typeFilter === 'all' && 'ring-2 ring-blue-500')}
        >
          <p className="text-2xl font-bold text-slate-100">{docs.length}</p>
          <span className="badge bg-slate-700 text-slate-300 mt-1 text-xs">All</span>
        </button>
        {Object.entries(TYPE_LABELS).map(([type, { label, color }]) => {
          const count = docs.filter(d => d.type === type).length
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={cn('card p-4 text-left border transition-colors hover:border-slate-600', typeFilter === type && 'ring-2 ring-blue-500')}
            >
              <p className="text-2xl font-bold text-slate-100">{count}</p>
              <span className={cn('badge mt-1 border text-xs', color)}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="input-field pl-9 py-2" />
        </div>
        <span className="text-xs text-slate-600">{filtered.length} files</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-700/50 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const ext      = doc.name.split('.').pop()
            const icon     = FILE_ICONS[ext] || '📁'
            const typeInfo = TYPE_LABELS[doc.type]
            const uploader = doc.uploader?.name || '—'
            const acting   = docAction[doc.id]
            return (
              <div key={doc.id} className="card p-4 hover:border-slate-600 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {typeInfo && <span className={cn('badge border text-[10px]', typeInfo.color)}>{typeInfo.label}</span>}
                      <span className="text-xs text-slate-600">{formatBytes(doc.size_bytes)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5">{uploader} · {formatDateTime(doc.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleView(doc)}
                    disabled={!!acting}
                    title="View"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {acting === 'view' ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={!!acting}
                    title="Download"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {acting === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </button>
                  {canDelete(doc) && (
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      title="Delete"
                      className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <FileText size={36} className="mx-auto mb-2 opacity-30" />
          <p>No documents found</p>
        </div>
      )}

      {/* Upload modal */}
      <Modal open={uploadModal} onClose={() => { setUploadModal(false); setFile(null) }} title="Upload Document" size="md">
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
              dragging ? 'border-blue-500 bg-blue-900/10' : file ? 'border-emerald-600 bg-emerald-900/10' : 'border-slate-600 hover:border-slate-500',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            <Upload size={36} className="mx-auto mb-3 text-slate-500" />
            {file
              ? <p className="text-slate-200 text-sm font-medium">{file.name} ({formatBytes(file.size)})</p>
              : <p className="text-slate-300 text-sm font-medium">Drop files here or click to browse</p>
            }
            <p className="text-xs text-slate-600 mt-1">PDF, JPG, PNG, WEBP, DOC(X), XLS(X), CSV — max 25 MB</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Document Type *</label>
              <select name="type" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select type…</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Related AWB</label>
              <input name="awb_id" placeholder="AWB ID (optional)" className="input-field" type="number" min="1" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setUploadModal(false); setFile(null) }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!file || uploadMut.loading} className="btn-primary">
              {uploadMut.loading ? 'Uploading…' : <><Upload size={14} /> Upload</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document" size="sm">
        <div className="space-y-4">
          <Alert variant="error" title="This action is permanent">
            <span className="font-medium">{deleteTarget?.name}</span> will be permanently deleted and cannot be recovered.
          </Alert>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleteMut.loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
            >
              {deleteMut.loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
