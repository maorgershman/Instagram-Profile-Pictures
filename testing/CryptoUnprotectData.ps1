param([String]$encryptedDataBase64)
Add-Type -AssemblyName System.Security
$encryptedData = [System.Convert]::FromBase64String($encryptedDataBase64)
$decryptedData = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedData, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$decryptedDataBase64 = [System.Convert]::ToBase64String($decryptedData)
Write-Output $decryptedDataBase64