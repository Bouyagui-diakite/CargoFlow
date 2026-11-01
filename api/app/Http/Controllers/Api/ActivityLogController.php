<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = Activity::with('causer')
            ->when($request->causer_id, fn ($q, $id) => $q->where('causer_id', $id))
            ->when($request->subject_type, fn ($q, $t) => $q->where('subject_type', $t))
            ->orderByDesc('created_at')
            ->paginate(50);

        // Transform to match frontend format
        $logs->getCollection()->transform(function ($log) {
            return [
                'id'        => $log->id,
                'user'      => $log->causer?->name ?? 'System',
                'action'    => $log->description,
                'target'    => $log->subject_type ? class_basename($log->subject_type) . ' #' . $log->subject_id : '—',
                'detail'    => $log->properties['old'] ?? null,
                'type'      => $this->inferType($log->description),
                'timestamp' => $log->created_at->toDateTimeString(),
            ];
        });

        return response()->json($logs);
    }

    private function inferType(string $description): string
    {
        if (str_contains($description, 'approved')) return 'approve';
        if (str_contains($description, 'rejected')) return 'reject';
        if (str_contains($description, 'created') || str_contains($description, 'Created')) return 'create';
        if (str_contains($description, 'uploaded')) return 'upload';
        return 'update';
    }
}
