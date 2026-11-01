<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'app_notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getIsReadAttribute(): bool
    {
        return $this->read_at !== null;
    }

    /** Create a notification for a single user. (Named notifyUser to avoid Eloquent's reserved push().) */
    public static function notifyUser(int $userId, string $type, string $title, ?string $message = null, ?string $link = null): self
    {
        return static::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'link'    => $link,
        ]);
    }

    /** Fan a notification out to every user holding any of the given Spatie roles. */
    public static function notifyRoles(array $roles, string $type, string $title, ?string $message = null, ?string $link = null, ?int $exceptUserId = null): void
    {
        User::role($roles)
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get()
            ->each(fn (User $u) => static::notifyUser($u->id, $type, $title, $message, $link));
    }
}
