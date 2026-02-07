# AllyCheck - Deployment & Production Guide

## Overview
AllyCheck is a production-ready web accessibility testing platform powered by Gemini AI and axe-core. This guide covers deployment, configuration, and best practices.

## Prerequisites
- Node.js 18+ 
- npm 9+
- Gemini API key (from [Google AI Studio](https://aistudio.google.com/app/apikeys))
- Vercel account (for deployment) or any Node.js hosting

## Environment Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your values:
```env
# Required: Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here

# Optional: Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=AllyCheck
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Rate Limiting (requests per minute)
RATE_LIMIT_REQUESTS_PER_MINUTE=10

# Optional: Logging
LOG_LEVEL=info
```

## Deployment to Vercel

### 1. Connect Repository
```bash
npm install -g vercel
vercel
```

### 2. Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Add `NEXT_PUBLIC_GEMINI_API_KEY`

### 3. Configure Build Settings
No special configuration needed. Vercel auto-detects Next.js.

### 4. Deploy
```bash
npm run build
vercel deploy --prod
```

## Deployment to Other Platforms

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t allycheck .
docker run -p 3000:3000 -e NEXT_PUBLIC_GEMINI_API_KEY=your_key allycheck
```

### AWS, GCP, Digital Ocean
These platforms support Node.js applications. Follow their Next.js deployment docs:
- Set `NODE_ENV=production`
- Configure environment variables in platform settings
- Run `npm install && npm run build && npm start`

## Production Optimizations

### 1. Performance
- ✅ Image optimization enabled in `next.config.mjs`
- ✅ SWC minification enabled
- ✅ React Strict Mode enabled for development
- ✅ Puppeteer sandboxing disabled (production safety)

### 2. Security
- ✅ X-Content-Type-Options header configured
- ✅ X-Frame-Options SAMEORIGIN enabled
- ✅ X-XSS-Protection enabled
- ✅ Referrer-Policy strict-origin-when-cross-origin
- ✅ Rate limiting implemented (10 req/min default)
- ✅ Input validation on all endpoints
- ✅ API key in environment variables (never in code)

### 3. Logging & Monitoring
- ✅ Structured logging system in place
- ✅ Error tracking ready (integrate Sentry)
- ✅ Request ID tracking for debugging

### 4. Rate Limiting
Default: 10 requests per minute per IP. Configure via:
```env
RATE_LIMIT_REQUESTS_PER_MINUTE=10
```

**Note**: Uses in-memory store. For distributed deployments, replace with Redis.

## Troubleshooting Deployment Issues

### Issue: Build fails with Suspense error
**Solution**: ✅ Already fixed! The results page uses Suspense wrapper.

### Issue: Timeout on slow websites
**Configure in `.env.local`**:
```env
NEXT_PUBLIC_SCAN_TIMEOUT=90000
NEXT_PUBLIC_PAGE_LOAD_TIMEOUT=60000
```

### Issue: Gemini API errors
- Verify API key is correct
- Check API is enabled in Google Cloud
- Ensure sufficient quota

### Issue: High memory usage
Puppeteer can use significant memory. For production:
- Run on instance with 2GB+ RAM
- Consider scanning queue system for high traffic
- Implement caching for frequently scanned sites

## Maintenance

### Update Dependencies
```bash
npm outdated
npm update
npm audit fix
```

### Monitor Performance
- Check Vercel analytics
- Review error logs in `.next/` 
- Monitor API quota usage

### Backup Strategy
- Results stored in localStorage (client-side)
- Consider adding database for historical reports
- Implement export feature (already available as JSON)

## API Reference

### POST /api/scan
Scans a website for accessibility violations.

**Request**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "requestId": "scan-123456789",
  "url": "https://example.com",
  "violations": [...],
  "passes": [...],
  "summary": "AI-generated summary",
  "improvementPlan": "AI-generated roadmap",
  "stats": {
    "total": 15,
    "critical": 2,
    "serious": 5,
    "moderate": 8,
    "minor": 0
  },
  "performance": {
    "duration": 12345,
    "unit": "ms"
  },
  "timestamp": "2025-02-07T10:30:00.000Z"
}
```

## Feature Checklist

- [x] Accessibility scanning (axe-core 4.8.3)
- [x] AI explanations (Gemini 1.5 Flash)
- [x] WCAG 2.1 AA compliance checking
- [x] Progress tracking UI
- [x] Results dashboard
- [x] Issue filtering & details
- [x] HTML code snippets
- [x] JSON export
- [x] Responsive design
- [x] Dark mode
- [x] Rate limiting
- [x] Error handling
- [x] Structured logging
- [x] Production security headers

## Support & License

- **License**: MIT
- **Author**: AllyCheck Team
- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Contributing**: See CONTRIBUTING.md

## Credits

- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing
- [Puppeteer](https://pptr.dev/) - Browser automation
- [Gemini AI](https://ai.google.dev/) - AI explanations
- [Next.js](https://nextjs.org/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
