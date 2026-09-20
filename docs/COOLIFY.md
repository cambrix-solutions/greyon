# Coolify CI/CD — Greyon SPA

Auto-deploy the Quasar site from GitHub when `main` updates.

**Repo:** `https://github.com/cambrix-solutions/greyon.git`  
**Suggested domain:** `https://greyon.site` (or `www.greyon.com.kh`)  
**API:** `https://engine.greyon.site` (see greyon-engine Coolify app)

## Architecture

```
push to main → GitHub webhook → Coolify builds Dockerfile → nginx:80 serves dist/spa
                     ↘ GitHub Actions CI (lint + typecheck + build) runs in parallel
```

Coolify does **not** wait on GitHub Actions by default. Use Actions as a quality gate; fix red CI before merging.

---

## 1. Create the Coolify application

1. Coolify → **New Resource** → **Application**
2. Connect the GitHub App / private key for `cambrix-solutions/greyon`
3. Select branch: **`main`**
4. Enable **Auto Deploy** (deploy on push / webhook)

### Build settings

| Setting             | Value          |
| ------------------- | -------------- |
| Build Pack          | **Dockerfile** |
| Dockerfile location | `/Dockerfile`  |
| Base Directory      | `/`            |
| Ports Exposes       | **80**         |
| Health check path   | `/` (optional) |

Nixpacks/static also works (`nixpacks.toml`), but **Dockerfile is preferred** (nginx + SPA history mode).

### Build-time environment (Arguments / Build Variables)

Set these as **build** variables (baked into Vite):

| Key                      | Value                        |
| ------------------------ | ---------------------------- |
| `VITE_APP_MODE`          | `production`                 |
| `VITE_USE_API`           | `true`                       |
| `VITE_ENGINE_URL`        | `https://engine.greyon.site` |
| `VITE_ENGINE_PUBLIC_URL` | `https://engine.greyon.site` |

If empty, the SPA falls back to `apiConfig.ts` production hosts (`engine.greyon.site`).

### Domains

- Attach `greyon.site` (and `www` if needed) → HTTPS via Coolify proxy
- CORS on the engine must allow this origin (`FRONTEND_URL`)

---

## 2. GitHub Actions CI

Workflow: `.github/workflows/ci.yml`

On every PR and push to `main`:

- `npm ci`
- `npm run lint:check`
- `npm run typecheck`
- `npm run build`

Optional Coolify rule: only merge when CI is green (GitHub branch protection).

---

## 3. First deploy checklist

1. Engine app is live and healthy (`https://engine.greyon.site/up` or `/`)
2. SPA build args point at the engine URL
3. Engine `FRONTEND_URL=https://greyon.site`
4. Engine `SESSION_SAME_SITE=none` + `SESSION_SECURE_COOKIE=true`
5. Push to `main` → watch Coolify build logs
6. Open SPA → admin login → Network tab shows engine calls succeeding

---

## 4. Rollback

Coolify → Application → **Deployments** → redeploy a previous successful deployment.

---

## Local parity

```bash
# Build like Coolify
docker build \
  --build-arg VITE_APP_MODE=production \
  --build-arg VITE_USE_API=true \
  --build-arg VITE_ENGINE_URL=https://engine.greyon.site \
  --build-arg VITE_ENGINE_PUBLIC_URL=https://engine.greyon.site \
  -t greyon-spa .
docker run --rm -p 8080:80 greyon-spa
```
