# ARQ-10: dump del esquema remoto vía Supabase Management API (solo lectura).
# Lee el token del CLI desde el Credential Manager sin imprimirlo.
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredMan {
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

$token = [CredMan]::GetSecret("Supabase CLI:supabase")
if (-not $token) { throw "No se pudo leer el token del Credential Manager" }
$token = $token.Trim()

$ref = "cleecshsiqyxelliqmbs"
$outDir = "scripts\arq10"
New-Item -ItemType Directory -Force $outDir | Out-Null

function Invoke-DbQuery($name, $query) {
    $body = @{ query = $query } | ConvertTo-Json -Compress
    $res = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
        -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
    $res | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 "$outDir\$name.json"
    Write-Output "OK $name"
}

Invoke-DbQuery "tablas" @"
select c.relname as tabla, c.relrowsecurity as rls_activo, c.relforcerowsecurity as rls_forzado
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by c.relname
"@

Invoke-DbQuery "columnas" @"
select table_name, column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
from information_schema.columns where table_schema = 'public'
order by table_name, ordinal_position
"@

Invoke-DbQuery "constraints" @"
select conrelid::regclass::text as tabla, conname, pg_get_constraintdef(oid) as definicion
from pg_constraint where connamespace = 'public'::regnamespace order by conrelid::regclass::text, conname
"@

Invoke-DbQuery "indices" @"
select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname
"@

Invoke-DbQuery "policies" @"
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname
"@

Invoke-DbQuery "grants" @"
select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type
"@

Invoke-DbQuery "triggers" @"
select event_object_table as tabla, trigger_name, pg_get_triggerdef(t.oid) as definicion
from information_schema.triggers it
join pg_trigger t on t.tgname = it.trigger_name
join pg_class c on c.oid = t.tgrelid and c.relname = it.event_object_table
where it.trigger_schema = 'public' group by 1,2,t.oid order by 1,2
"@

Invoke-DbQuery "funciones" @"
select p.proname, pg_get_functiondef(p.oid) as definicion
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname
"@

Write-Output "Dump completo en $outDir"
