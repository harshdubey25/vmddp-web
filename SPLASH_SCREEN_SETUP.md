# Inauguration Splash Screen Setup

## How It Works

1. **Backend Control**: The splash screen is controlled by the `inauguration_splash_screen` field in the Frappe "Site Config" DocType
2. **One-Time Display**: When a user clicks "Enter" on the splash screen, it saves to Frappe backend (sets the flag to 0)
3. **Server-Side Rendering**: The layout fetches the config on the server side, keeping page.tsx as a server component

## Setup Steps

### 1. Set Environment Variables

Create a `.env.local` file if you don't have one:

```env
NEXT_PUBLIC_FRAPPE_BASE_URL=http://your-frappe-site.com
FRAPPE_API_KEY=your_api_key_here
FRAPPE_SECRET_KEY=your_api_secret_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Enable Splash Screen in Frappe

1. Login to Frappe
2. Go to "Site Config" doctype
3. Check the "Inauguration Splash Screen" checkbox
4. Set the "Inauguration Date" field (this will be displayed on the splash screen)
5. Save

### 3. Test the Flow

1. Visit your Next.js site
2. You should see the curtain animation splash screen
3. Click the "Enter" button
4. The splash screen will animate out
5. The backend flag will be set to 0 (unchecked)
6. Subsequent visits will NOT show the splash screen

### 4. Re-enable Splash Screen

To show it again, simply go back to Frappe and check the "Inauguration Splash Screen" checkbox again.

## Files Created/Modified

- `/app/api/site-config/route.ts` - Fetches the splash screen flag from Frappe
- `/app/api/mark-entered/route.ts` - Saves when user clicks "Enter"
- `/components/SplashWrapper.tsx` - Client component that handles splash screen state
- `/components/SplashScreen.tsx` - The actual splash screen component (already existed)
- `/app/layout.tsx` - Modified to fetch config and wrap with SplashWrapper

## API Endpoints

- `GET /api/site-config` - Returns `{ showSplash: true/false }`
- `POST /api/mark-entered` - Marks that user has entered (sets flag to 0)
