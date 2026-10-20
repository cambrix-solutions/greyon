# Engine: admin image upload endpoint

Paste-ready Laravel pieces for **greyon-engine** (`SophearaGit/greyon`). The SPA posts multipart uploads to `POST /admin/uploads` and expects JSON:

```json
{
  "url": "https://engine.greyon.site/storage/uploads/hotels/slug/uuid.webp",
  "path": "uploads/hotels/slug/uuid.webp",
  "width": 2000,
  "height": 1333,
  "size": 245678,
  "mime": "image/webp"
}
```

Optional query/body field: `folder` (string), e.g. `hotels/<slug>`, `rooms/<id>`, `locations/<slug>`, `media`.

---

## 1. Route (admin auth group)

In `routes/api.php` (or wherever the existing `/admin/*` Sanctum/session group lives):

```php
<?php

use App\Http\Controllers\Admin\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum']) // match your existing admin middleware
    ->prefix('admin')
    ->group(function () {
        // …existing admin routes…

        Route::post('/uploads', [UploadController::class, 'store']);
        Route::delete('/uploads', [UploadController::class, 'destroy']);
    });
```

Use the **same** middleware stack as other admin CRUD routes (session cookie + CSRF / Sanctum).

---

## 2. `UploadController`

`app/Http/Controllers/Admin/UploadController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'folder' => ['nullable', 'string', 'max:120'],
        ]);

        $file = $validated['file'];
        $folder = $this->sanitizeFolder($validated['folder'] ?? null);

        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $ext = 'jpg';
        }

        $filename = Str::uuid()->toString().'.'.$ext;
        $directory = trim('uploads/'.$folder, '/');
        $path = $file->storeAs($directory, $filename, 'public');

        if (! $path) {
            throw ValidationException::withMessages([
                'file' => 'Upload failed. Please try again.',
            ]);
        }

        $absolute = Storage::disk('public')->url($path);
        // Ensure absolute URL for the SPA (APP_URL must be set correctly).
        if (! str_starts_with($absolute, 'http')) {
            $absolute = rtrim(config('app.url'), '/').'/'.ltrim($absolute, '/');
        }

        $width = null;
        $height = null;
        try {
            $full = Storage::disk('public')->path($path);
            if (is_file($full)) {
                [$width, $height] = getimagesize($full) ?: [null, null];
            }
        } catch (\Throwable) {
            // optional metadata
        }

        return response()->json([
            'url' => $absolute,
            'path' => $path,
            'width' => $width,
            'height' => $height,
            'size' => Storage::disk('public')->size($path),
            'mime' => Storage::disk('public')->mimeType($path) ?: $file->getMimeType(),
        ], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:255'],
        ]);

        $path = $validated['path'];
        if (! str_starts_with($path, 'uploads/')) {
            throw ValidationException::withMessages([
                'path' => 'Only paths under uploads/ may be deleted.',
            ]);
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['ok' => true]);
    }

    private function sanitizeFolder(?string $folder): string
    {
        $folder = trim((string) $folder, '/');
        if ($folder === '') {
            return 'misc';
        }

        // Allow nested segments like hotels/my-slug or rooms/12.
        $folder = preg_replace('#[^a-zA-Z0-9._/-]+#', '-', $folder) ?? 'misc';
        $folder = preg_replace('#/+#', '/', $folder) ?? 'misc';
        $folder = trim($folder, '/');

        // Block path traversal.
        if ($folder === '' || str_contains($folder, '..')) {
            return 'misc';
        }

        return $folder;
    }
}
```

Ensure `php artisan storage:link` has been run so `/storage/...` is public.

---

## 3. CORS / nginx / PHP size limits

### CORS

The SPA origin (e.g. `https://greyon.site` or `http://localhost:9000`) must be allowed with credentials if you use session cookies. Existing admin CORS config should already cover this; confirm `Access-Control-Allow-Headers` includes nothing special beyond normal auth — multipart does not need custom headers beyond `Authorization` / cookies.

### nginx

```nginx
client_max_body_size 12m;
```

### PHP (`php.ini` or pool)

```ini
upload_max_filesize = 12M
post_max_size = 12M
```

Restart php-fpm / nginx after changing these.

---

## 4. Feature test

`tests/Feature/AdminUploadTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Admin; // adjust to your admin/user model
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_image(): void
    {
        Storage::fake('public');

        $admin = Admin::factory()->create(); // or actingAs with your guard

        $file = UploadedFile::fake()->image('hero.jpg', 1200, 800);

        $response = $this->actingAs($admin, 'sanctum') // match your guard
            ->post('/admin/uploads', [
                'file' => $file,
                'folder' => 'hotels/demo',
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'url',
                'path',
                'size',
                'mime',
            ]);

        $path = $response->json('path');
        Storage::disk('public')->assertExists($path);
        $this->assertStringContainsString('uploads/hotels/demo/', $path);
    }

    public function test_rejects_non_image(): void
    {
        Storage::fake('public');
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->post('/admin/uploads', [
                'file' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertStatus(422);
    }

    public function test_guest_cannot_upload(): void
    {
        Storage::fake('public');

        $response = $this->post('/admin/uploads', [
            'file' => UploadedFile::fake()->image('x.jpg'),
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertUnauthorized();
    }
}
```

Adjust model/guard names to match the engine. Until this endpoint is deployed, the SPA shows: _Uploads aren't enabled on the server yet, paste an image URL instead_ on HTTP 404.
