// app/sitemap.ts
import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

function getPublicRoutes(): string[] {
  const publicDir = path.join(process.cwd(), 'app', '(public)')
  const routes: string[] = []

  if (!fs.existsSync(publicDir)) return routes

  function scanDir(dir: string, basePath: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          routes.push(basePath || '/')
        }
        continue
      }

      // Skip route groups (folders wrapped in parentheses) — don't add to URL path
      const isRouteGroup = entry.name.startsWith('(') && entry.name.endsWith(')')
      const nextPath = isRouteGroup ? basePath : `${basePath}/${entry.name}`

      scanDir(path.join(dir, entry.name), nextPath)
    }
  }

  scanDir(publicDir)
  return routes
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cadetmate.co.uk'
  const routes = getPublicRoutes()

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/home' ? 1.0 : 0.8,
  }))
}