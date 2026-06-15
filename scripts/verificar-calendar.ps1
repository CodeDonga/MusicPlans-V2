# Verificador de Google Calendar (BUG-31). Prueba la cadena real:
# sesión temporal del usuario -> Edge Function calendar-token -> API de Google.
# Uso:  powershell -File scripts\verificar-calendar.ps1            (solo lee y lista)
#       powershell -File scripts\verificar-calendar.ps1 -Probe    (además crea+borra un evento de prueba)
param([switch]$Probe)
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredManVC {
    [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);
    [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct CREDENTIAL { public int Flags; public int Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
    public static string GetSecret(string target) { IntPtr ptr;
        if (!CredRead(target, 1, 0, out ptr)) return null;
        try { CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] blob = new byte[cred.CredentialBlobSize]; Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
            return System.Text.Encoding.UTF8.GetString(blob); } finally { CredFree(ptr); } }
}
"@
$mgmt = ([CredManVC]::GetSecret("Supabase CLI:supabase")).Trim()
$ref = "cleecshsiqyxelliqmbs"; $base = "https://$ref.supabase.co"
$email = "c.soto.salgado.17@gmail.com"
$keys = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/api-keys?reveal=true" -Headers @{ Authorization = "Bearer $mgmt" }
$svc = ($keys | Where-Object { $_.name -eq "service_role" }).api_key
$anon = ($keys | Where-Object { $_.name -eq "anon" }).api_key
$gl = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/admin/generate_link" -Headers @{ apikey=$svc; Authorization="Bearer $svc" } -ContentType "application/json" -Body (@{ type="magiclink"; email=$email } | ConvertTo-Json)
$ver = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/verify" -Headers @{ apikey=$anon } -ContentType "application/json" -Body (@{ type="magiclink"; email=$email; token=$gl.email_otp } | ConvertTo-Json)
$ujwt = $ver.access_token
$ct = Invoke-RestMethod -Method Post -Uri "$base/functions/v1/calendar-token" -Headers @{ apikey=$anon; Authorization="Bearer $ujwt" } -ContentType "application/json" -Body "{}"
if (-not $ct.access_token) { throw "calendar-token no devolvio access_token" }
Write-Host "[OK] Refresco de token: access token de Google obtenido (expira en $($ct.expires_in)s)."
$gh = @{ Authorization = "Bearer $($ct.access_token)" }
$ev = Invoke-RestMethod -Method Get -Uri "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2026-05-01T00:00:00Z&timeMax=2026-08-01T00:00:00Z&singleEvents=true&orderBy=startTime&maxResults=250" -Headers $gh
$clases = $ev.items | Where-Object { $_.summary -like "*Clase*" }
Write-Host "[OK] Eventos Clase en el calendario principal: $(@($clases).Count)"
$clases | ForEach-Object { $st = $_.start.dateTime; if (-not $st) { $st = $_.start.date }; "   - $st  |  $($_.summary)" }
if ($Probe) {
    $body = @{ summary = "PRUEBA verificar-calendar"; start = @{ dateTime = "2026-06-20T09:00:00"; timeZone = "America/Santiago" }; end = @{ dateTime = "2026-06-20T10:00:00"; timeZone = "America/Santiago" } } | ConvertTo-Json
    $created = Invoke-RestMethod -Method Post -Uri "https://www.googleapis.com/calendar/v3/calendars/primary/events" -Headers $gh -ContentType "application/json" -Body $body
    Write-Host "[OK] Escritura: evento de prueba creado (id $($created.id))."
    Invoke-RestMethod -Method Delete -Uri "https://www.googleapis.com/calendar/v3/calendars/primary/events/$($created.id)" -Headers $gh | Out-Null
    Write-Host "[OK] Escritura: evento de prueba borrado. El scope permite crear/borrar."
}
