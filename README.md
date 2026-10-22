# Emmanuel Portfolio

Dynamic React/Vite frontend with a FastAPI and Supabase backend.

## Structure

```text
frontend/   React application and styles
backend/    Supabase-backed FastAPI API and SQL schema
```

## Run locally

Install frontend dependencies and start Vite:

```powershell
cd frontend
npm install
npm run dev
```

In another terminal, install backend dependencies and start FastAPI:

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The frontend requires the backend. It loads all profile, experience, project, education, skill, certification, language, and contact data from Supabase through `/api/portfolio` and the CRUD API. It does not contain fallback portfolio data.

## Supabase

Run [`backend/supabase_schema.sql`](./backend/supabase_schema.sql) in the Supabase SQL Editor to create or update the schema. Configure these values in `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
PORTFOLIO_ADMIN_TOKEN=your-private-admin-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-sending-email@example.com
SMTP_PASSWORD=your-smtp-password-or-app-password
SMTP_FROM_EMAIL=your-sending-email@example.com
CONTACT_NOTIFICATION_EMAIL=your-receiving-email@example.com
SMTP_USE_TLS=true
```

Never expose the service-role key in the frontend.

When someone submits the public contact form, the message is saved in Supabase and an email notification is sent to `CONTACT_NOTIFICATION_EMAIL`. The form clears immediately after submission. Visitors see a large green confirmation when their message is received, or a red error that explains why it could not be sent; either message disappears after ten seconds. The visitor’s form email is included as `Reply-To` on your notification, so replying from your inbox goes directly to that person. The SMTP sender must be an account you control; using the visitor’s address as the technical `From` address would be rejected or treated as spoofing by most providers. For Gmail, use a Google app password rather than your normal account password. If SMTP is not configured or temporarily fails, the message remains available in the admin Contacts section.

## Admin dashboard

With both servers running, open `http://localhost:5173/#admin`. Enter the `PORTFOLIO_ADMIN_TOKEN` value to manage profile data, experiences, projects, education, skills, certifications, languages, contact messages, and the home-page profile image. Experience records include an optional achievement summary, a company logo, and up to four gallery images. Upload or replace a company logo and it appears beside the company name on the experience list and detail page; deleting the logo removes it from both. Logos and gallery images are limited to 5 MB per image and stored in the public `portfolio-media` Supabase Storage bucket. The SQL schema creates that bucket and its read policy, and adds the logo fields to existing experience tables.
