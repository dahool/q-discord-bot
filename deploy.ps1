function New-TemporaryDirectory {
    $parent = [System.IO.Path]::GetTempPath()
    [string] $name = [System.Guid]::NewGuid()
    New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

Get-Content $PSScriptRoot\deploy.env | Foreach-Object{
    $var = $_.Split('=')
    New-Variable -Name $var[0] -Value $var[1] -Visibility Private
}

Write-Output "Build frontend"
Set-Location $PSScriptRoot\front
npm install
npm run build

Write-Output "Build Bot"
Set-Location $PSScriptRoot\app
npm install

Write-Output "Create package"
$exclude = @(".env",".vscode",".gitignore")
$files = Get-ChildItem -Path . -Exclude $exclude
Compress-Archive -Path $files -DestinationPath $PSScriptRoot\appdeploy.zip -CompressionLevel Fastest -Force

Set-Location $PSScriptRoot

Write-Output "Deploy"
Publish-AzWebApp -ResourceGroupName $AZ_GROUPNAME -Name $AZ_APP -ArchivePath $PSScriptRoot\appdeploy.zip
