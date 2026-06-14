# Runner reutilizable: ejecuta SQL contra la DB remota vía Management API.
# Lee el token del CLI desde el Credential Manager (nunca lo imprime).
# Uso:
#   powershell -File scripts\db-exec.ps1 -Query "select 1"
#   powershell -File scripts\db-exec.ps1 -File supabase\migrations\xxx.sql
param(
    [string]$Query,
    [string]$File,
    [switch]$Register   # con -File: además registra la migración en schema_migrations
)
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredManX {
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

$token = [CredManX]::GetSecret("Supabase CLI:supabase")
if (-not $token) { throw "No se pudo leer el token del Credential Manager" }
$token = $token.Trim()
$ref = "cleecshsiqyxelliqmbs"

if ($File) { $sql = Get-Content -Raw -Encoding utf8 $File }
elseif ($Query) { $sql = $Query }
else { throw "Pasa -Query o -File" }

# -Register: aplica el archivo y registra la migración en el historial (atómico, idempotente).
if ($Register) {
    if (-not $File) { throw "-Register requiere -File" }
    $base = [System.IO.Path]::GetFileNameWithoutExtension($File)   # 20260601000000_baseline
    $version = $base.Substring(0, $base.IndexOf('_'))
    $name = $base.Substring($base.IndexOf('_') + 1)
    $tag = '$mig' + ([guid]::NewGuid().ToString('N').Substring(0,8)) + '$'
    if ($sql.Contains($tag)) { throw "Colisión de dollar-tag; reintentar" }
    $sql = @"
$sql
insert into supabase_migrations.schema_migrations (version, name, statements)
values ('$version', '$name', array[$tag$sql$tag])
on conflict (version) do nothing;
"@
}

# PS 5.1: ConvertTo-Json envuelve strings largos como {value,Count}; encodear con .NET.
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$body = $ser.Serialize(@{ query = [string]$sql })
$res = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
$res | ConvertTo-Json -Depth 10
