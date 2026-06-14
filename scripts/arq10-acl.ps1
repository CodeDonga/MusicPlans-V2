$ErrorActionPreference = 'Stop'
. { Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredMan2 {
    [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);
    [DllImport("advapi32.dll")]
    public static extern void CredFree(IntPtr cred);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags; public int Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr ptr;
        if (!CredRead(target, 1, 0, out ptr)) return null;
        try {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] blob = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
            return System.Text.Encoding.UTF8.GetString(blob);
        } finally { CredFree(ptr); }
    }
}
"@ }

$token = [CredMan2]::GetSecret("Supabase CLI:supabase").Trim()
$ref = "cleecshsiqyxelliqmbs"

$query = @"
select t.tabla, r.rol, p.priv, has_table_privilege(r.rol, 'public.' || t.tabla, p.priv) as tiene
from (values ('alumnos'),('talleres'),('clases'),('google_tokens')) t(tabla)
cross join (values ('anon'),('authenticated')) r(rol)
cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE')) p(priv)
order by t.tabla, r.rol, p.priv
"@

$body = @{ query = $query } | ConvertTo-Json -Compress
$res = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
$res | Where-Object { $_.tiene } | ForEach-Object { Write-Output "$($_.tabla) | $($_.rol) | $($_.priv)" }
