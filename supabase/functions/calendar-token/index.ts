// GC-05: canjea el refresh_token de Google (guardado en google_tokens, ilegible
// desde el cliente) por un access token fresco. El client secret vive solo aquí.
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: authError } = await admin.auth.getUser(jwt)
  if (authError || !user) return json({ error: 'no_auth' }, 401)

  const { data: row } = await admin
    .from('google_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!row) return json({ error: 'no_token' }, 404)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()

  if (!res.ok) {
    if (data.error === 'invalid_grant') {
      await admin.from('google_tokens').delete().eq('user_id', user.id)
      return json({ error: 'revoked' }, 410)
    }
    return json({ error: 'google_error', detail: data.error ?? null }, 502)
  }

  return json({ access_token: data.access_token, expires_in: data.expires_in })
})
