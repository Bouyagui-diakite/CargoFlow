<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Gate;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $docs = Document::with('uploader')
            ->when($request->type,   fn ($q, $t) => $q->where('type', $t))
            ->when($request->awb_id, fn ($q, $id) => $q->where('awb_id', $id))
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($docs);
    }

    public function upload(Request $request)
    {
        // Only staff who handle shipments may upload documents.
        Gate::authorize('create_awb');

        $request->validate([
            // Allowlist real document/image types only — no executables or html/svg.
            'file'       => 'required|file|max:25600|mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx,csv',
            'type'       => 'required|in:awb,dgr,notoc,certificate,packing_list',
            'awb_id'     => 'nullable|exists:awbs,id',
            'dgr_id'     => 'nullable|exists:dgr_declarations,id',
            'flight_id'  => 'nullable|exists:flights,id',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'local');

        // Sanitize the original filename before storing it as a display/download name.
        $original  = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $base      = pathinfo($original, PATHINFO_FILENAME);
        $safeName  = preg_replace('/[^A-Za-z0-9._\- ]/', '_', $base);
        $safeName  = trim(substr($safeName, 0, 200)) ?: 'document';
        $safeName  = $extension ? "{$safeName}.{$extension}" : $safeName;

        $doc = Document::create([
            'name'        => $safeName,
            'type'        => $request->type,
            'path'        => $path,
            'mime_type'   => $file->getMimeType(),
            'size_bytes'  => $file->getSize(),
            'awb_id'      => $request->awb_id,
            'dgr_id'      => $request->dgr_id,
            'flight_id'   => $request->flight_id,
            'uploaded_by' => $request->user()->id,
        ]);

        activity()->causedBy($request->user())
            ->performedOn($doc)
            ->log("Document uploaded: {$doc->name}");

        return response()->json($doc->load('uploader'), 201);
    }

    public function show(Document $document)
    {
        return response()->json($document->load('uploader'));
    }

    public function destroy(Request $request, Document $document)
    {
        // Only the uploader, a supervisor, or an admin may delete a document.
        $user = $request->user();
        $allowed = $document->uploaded_by === $user->id || $user->hasRole(['admin', 'supervisor']);
        abort_unless($allowed, 403, 'You can only delete documents you uploaded.');

        Storage::disk('local')->delete($document->path);
        $document->delete();
        return response()->json(null, 204);
    }
}
