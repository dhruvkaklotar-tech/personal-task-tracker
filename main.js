import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure persistent app name and user data directory explicitly
app.name = 'TaskTracker';
const userDataPath = path.join(app.getPath('appData'), 'TaskTracker');
app.setPath('userData', userDataPath);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true, // Keep standard frame but let the content handle full colors
    backgroundColor: '#0f172a',
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Turn off sandbox to load the local preload script with full node features
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.argv.includes('--dev');

  if (isDev) {
    // Force IPv4 loopback to avoid Windows IPv6 resolution issues
    mainWindow.loadURL('http://127.0.0.1:5183');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Enable developer tools toggle via F12 or Ctrl+Shift+I
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });



  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC verification system-identity request handler
ipcMain.handle('verify-identity', async () => {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    if (systemPreferences.canPromptTouchID && systemPreferences.canPromptTouchID()) {
      try {
        await systemPreferences.promptTouchID('Verify your identity to view Firebase integration keys.');
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    } else {
      // Fallback via macOS osascript password verification dialog
      return new Promise((resolve) => {
        const cmd = `osascript -e 'display dialog "Confirm your macOS password to view Firebase integration keys:" default answer "" with hidden answer'`;
        exec(cmd, (error, stdout) => {
          if (error) {
            resolve({ success: false, error: 'Cancelled or incorrect credentials' });
          } else {
            const password = stdout.replace('button returned:OK, text returned:', '').trim();
            const username = process.env.USER;
            exec(`dscl . -authonly ${username} "${password}"`, (authErr) => {
              if (authErr) {
                resolve({ success: false, error: 'Incorrect credentials' });
              } else {
                resolve({ success: true });
              }
            });
          }
        });
      });
    }
  } else if (platform === 'win32') {
    return new Promise((resolve) => {
      // 1. Try Windows Hello UserConsentVerifier (PIN, fingerprint, etc.) first
      const cmd = `powershell -Command "[void][Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials, ContentType=WindowsRuntime]; $asyncOp = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync('Verify your identity to view Firebase integration keys.'); while ($asyncOp.Status -eq 'Started') { Start-Sleep -Milliseconds 100 }; $res = $asyncOp.GetResults(); Write-Output $res"`;
      exec(cmd, (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          const result = stdout.trim();
          if (result === 'Verified') {
            resolve({ success: true });
          } else {
            // 2. Fallback: prompt for the local Windows account username & password
            const fallbackCmd = `powershell -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.DirectoryServices.AccountManagement'); $username = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name; $cred = $host.ui.PromptForCredential('Verification Required', 'Enter your Windows lock screen password or PIN to unlock keys.', $username, ''); if ($cred) { $pc = New-Object System.DirectoryServices.AccountManagement.PrincipalContext([System.DirectoryServices.AccountManagement.ContextType]::Machine); $auth = $pc.ValidateCredentials($username.Split('\\')[1], $cred.GetNetworkCredential().Password); if ($auth) { Write-Output 'Verified' } else { Write-Output 'Failed' } } else { Write-Output 'Cancelled' }"`;
            exec(fallbackCmd, (fbErr, fbStdout) => {
              if (fbErr) {
                resolve({ success: false, error: fbErr.message });
              } else {
                const fbResult = fbStdout.trim();
                if (fbResult.includes('Verified')) {
                  resolve({ success: true });
                } else {
                  resolve({ success: false, error: 'Password verification failed.' });
                }
              }
            });
          }
        }
      });
    });
  } else {
    // Linux/other: Use pkexec to prompt natively for local PAM credentials
    return new Promise((resolve) => {
      exec('pkexec true', (error) => {
        if (error) {
          resolve({ success: false, error: 'Verification failed or cancelled.' });
        } else {
          resolve({ success: true });
        }
      });
    });
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus the existing window if user runs a duplicate instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    createWindow();
    
    // Auto-create Desktop Shortcut on Windows if not present
    if (process.platform === 'win32') {
      try {
        const desktopPath = app.getPath('desktop');
        const shortcutPath = path.join(desktopPath, 'Task Tracker.lnk');
        if (!fs.existsSync(shortcutPath)) {
          const exePath = process.execPath;
          const iconPath = path.join(path.dirname(exePath), 'icon.ico');
          const psCommand = `$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $Shortcut.TargetPath = '${exePath.replace(/'/g, "''")}'; $Shortcut.IconLocation = '${iconPath.replace(/'/g, "''")}'; $Shortcut.Save();`;
          exec(`powershell -Command "${psCommand}"`, (err) => {
            if (err) {
              console.error('Failed to auto-create desktop shortcut:', err);
            }
          });
        }
      } catch (err) {
        console.error('Shortcut creation failed:', err);
      }
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
