$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredMan3 {
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
"@

$token = [CredMan3]::GetSecret("Supabase CLI:supabase").Trim()
$ref = "cleecshsiqyxelliqmbs"

function Q($query) {
    $body = @{ query = $query } | ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
        -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
}

Write-Output "--- relacl crudo ---"
Q "select relname, relacl::text from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname" | ForEach-Object { Write-Output "$($_.relname): $($_.relacl)" }

Write-Output "--- filas en google_tokens ---"
Q "select count(*) as n, max(updated_at) as ultimo from google_tokens" | ForEach-Object { Write-Output "filas: $($_.n)  ultimo update: $($_.ultimo)" }

Write-Output "--- default privileges ---"
Q "select pg_get_userbyid(defaclrole) as rol, defaclnamespace::regnamespace::text as schema, defaclobjtype, defaclacl::text from pg_default_acl" | ForEach-Object { Write-Output "$($_.rol) | $($_.schema) | $($_.defaclobjtype) | $($_.defaclacl)" }
