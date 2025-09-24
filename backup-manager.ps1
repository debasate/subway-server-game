# =====================================
# GAME BACKUP MANAGER
# =====================================

param(
    [string]$Action = "create",  # create, restore, list
    [string]$BackupName = ""
)

$BackupDir = "C:\game-site-backups"
$ProjectDir = "C:\game-site"

# Ensure backup directory exists
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

function Create-Backup {
    param([string]$Name)
    
    if ($Name -eq "") {
        $Name = "backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
    }
    
    $BackupPath = "$BackupDir\$Name"
    
    Write-Host "🔄 Creating backup: $Name" -ForegroundColor Yellow
    
    # Create backup with exclusions
    robocopy "$ProjectDir" "$BackupPath" /E /XD ".git" "node_modules" ".vscode" /XF "*.tmp" "*.log" /NFL /NDL /NP
    
    if ($LASTEXITCODE -le 1) {
        Write-Host "✅ Backup created successfully: $BackupPath" -ForegroundColor Green
        
        # Create backup info file
        $InfoFile = "$BackupPath\backup-info.json"
        $BackupInfo = @{
            Name = $Name
            CreatedDate = (Get-Date).ToString()
            ProjectPath = $ProjectDir
            GitBranch = (git -C $ProjectDir branch --show-current 2>$null)
            GitCommit = (git -C $ProjectDir rev-parse HEAD 2>$null)
        } | ConvertTo-Json -Depth 2
        
        $BackupInfo | Out-File -FilePath $InfoFile -Encoding UTF8
        
        return $BackupPath
    } else {
        Write-Host "❌ Backup failed!" -ForegroundColor Red
        return $null
    }
}

function Restore-Backup {
    param([string]$Name)
    
    $BackupPath = "$BackupDir\$Name"
    
    if (!(Test-Path $BackupPath)) {
        Write-Host "❌ Backup not found: $Name" -ForegroundColor Red
        Write-Host "Available backups:" -ForegroundColor Yellow
        List-Backups
        return
    }
    
    Write-Host "⚠️  WARNING: This will overwrite your current project!" -ForegroundColor Red
    Write-Host "Current project will be backed up automatically first." -ForegroundColor Yellow
    
    $Confirm = Read-Host "Continue? (y/N)"
    if ($Confirm -ne "y" -and $Confirm -ne "Y") {
        Write-Host "🚫 Restore cancelled." -ForegroundColor Yellow
        return
    }
    
    # Create safety backup of current state
    Write-Host "🔄 Creating safety backup of current state..." -ForegroundColor Yellow
    $SafetyBackup = Create-Backup -Name "safety_before_restore_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
    
    if ($SafetyBackup) {
        Write-Host "🔄 Restoring from backup: $Name" -ForegroundColor Yellow
        
        # Remove current files (except .git)
        Get-ChildItem "$ProjectDir" -Exclude ".git" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        # Restore from backup
        robocopy "$BackupPath" "$ProjectDir" /E /XD ".git" /NFL /NDL /NP
        
        if ($LASTEXITCODE -le 1) {
            Write-Host "✅ Restore completed successfully!" -ForegroundColor Green
            Write-Host "💾 Safety backup created at: $SafetyBackup" -ForegroundColor Cyan
            
            # Show backup info if available
            $InfoFile = "$BackupPath\backup-info.json"
            if (Test-Path $InfoFile) {
                $BackupInfo = Get-Content $InfoFile | ConvertFrom-Json
                Write-Host "`n📊 Restored Backup Info:" -ForegroundColor Cyan
                Write-Host "   Created: $($BackupInfo.CreatedDate)" -ForegroundColor White
                Write-Host "   Git Branch: $($BackupInfo.GitBranch)" -ForegroundColor White
                Write-Host "   Git Commit: $($BackupInfo.GitCommit)" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Restore failed!" -ForegroundColor Red
        }
    }
}

function List-Backups {
    Write-Host "`n📁 Available Backups:" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    $Backups = Get-ChildItem "$BackupDir" -Directory | Sort-Object LastWriteTime -Descending
    
    if ($Backups.Count -eq 0) {
        Write-Host "No backups found." -ForegroundColor Yellow
        return
    }
    
    foreach ($Backup in $Backups) {
        $InfoFile = "$($Backup.FullName)\backup-info.json"
        
        Write-Host "`n🗂️  $($Backup.Name)" -ForegroundColor Green
        Write-Host "   Created: $($Backup.LastWriteTime)" -ForegroundColor White
        
        if (Test-Path $InfoFile) {
            try {
                $BackupInfo = Get-Content $InfoFile | ConvertFrom-Json
                Write-Host "   Git Branch: $($BackupInfo.GitBranch)" -ForegroundColor Gray
                Write-Host "   Git Commit: $($BackupInfo.GitCommit)" -ForegroundColor Gray
            } catch {
                Write-Host "   (Backup info not available)" -ForegroundColor Gray
            }
        }
        
        $Size = (Get-ChildItem "$($Backup.FullName)" -Recurse | Measure-Object -Property Length -Sum).Sum
        $SizeMB = [math]::Round($Size / 1MB, 2)
        Write-Host "   Size: $SizeMB MB" -ForegroundColor Gray
    }
    
    Write-Host "`n" -NoNewline
}

function Show-Help {
    Write-Host @"
🎮 GAME BACKUP MANAGER
=====================

USAGE:
  .\backup-manager.ps1 -Action <action> [-BackupName <name>]

ACTIONS:
  create     Create a new backup
  restore    Restore from a backup  
  list       List all available backups
  help       Show this help

EXAMPLES:
  .\backup-manager.ps1 -Action create
  .\backup-manager.ps1 -Action create -BackupName "before-big-changes"
  .\backup-manager.ps1 -Action restore -BackupName "backup_2025-09-24_09-48-45"
  .\backup-manager.ps1 -Action list

BACKUP LOCATIONS:
  Backups: $BackupDir
  Project: $ProjectDir

"@ -ForegroundColor Cyan
}

# Main execution
switch ($Action.ToLower()) {
    "create" { 
        Create-Backup -Name $BackupName 
    }
    "restore" { 
        if ($BackupName -eq "") {
            Write-Host "❌ BackupName required for restore action" -ForegroundColor Red
            Write-Host "Use -Action list to see available backups" -ForegroundColor Yellow
        } else {
            Restore-Backup -Name $BackupName 
        }
    }
    "list" { 
        List-Backups 
    }
    "help" { 
        Show-Help 
    }
    default { 
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Show-Help 
    }
}