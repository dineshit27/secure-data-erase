export interface DemoFileItem {
  name: string;
  path: string;
  size: number;
  type: string;
  content: string;
  category?: string;
  lastModified?: string;
}

export interface DemoCacheResource {
  name: string;
  path: string;
  category: "html" | "css" | "js" | "images" | "json" | "metadata";
  mimeType: string;
  sizeBytes: number;
  createdTime: string;
  lastAccessed: string;
  content: string;
}

export interface DemoRecentActivity {
  id: string;
  filename: string;
  path: string;
  category: "Documents" | "Downloads" | "Images" | "Other";
  size: string;
  lastOpened: string;
}

export interface DemoLogFile {
  filename: string;
  path: string;
  linesCount: number;
  sizeKB: number;
  content: string;
}

export interface DemoRepoFile {
  filename: string;
  path: string;
  content: string;
}

export interface DemoTempFile {
  filename: string;
  path: string;
  sizeBytes: number;
  category: string;
  created: string;
}

export const DemoDataGenerator = {
  // Tool 1: Secure File Deletion
  generateSecureFile(): { file: File; metadata: { name: string; size: number; type: string; path: string } } {
    const textContent = `SECUREDEL DEMONSTRATION FILE\n\nThis file contains fictional data for testing\nthe SecureDel Secure File Deletion feature.\n\nTest ID: SECUREDEL-DEMO-001\nEnvironment: DEMO\nStatus: READY_FOR_DELETION\n\nNo real credentials or confidential information\nare contained in this file.`;
    const file = new File([textContent], "demo_secret.txt", { type: "text/plain" });
    return {
      file,
      metadata: {
        name: "demo_secret.txt",
        size: textContent.length,
        type: "TXT",
        path: "C:\\SecureDel\\demo-files\\demo_secret.txt"
      }
    };
  },

  // Tool 2: Browser Cache Wiper
  generateBrowserCache(): { resources: DemoCacheResource[]; totalSizeMB: number } {
    const now = new Date().toISOString();
    const resources: DemoCacheResource[] = [
      {
        name: "index.html",
        path: "demo_browser_cache/html/index.html",
        category: "html",
        mimeType: "text/html",
        sizeBytes: 420 * 1024,
        createdTime: "2026-08-14 10:00:00",
        lastAccessed: now,
        content: "<h1>SecureDel Demo Cached Page</h1><p>This is fictional cached content generated for demonstration.</p>"
      },
      {
        name: "about.html",
        path: "demo_browser_cache/html/about.html",
        category: "html",
        mimeType: "text/html",
        sizeBytes: 280 * 1024,
        createdTime: "2026-08-14 10:05:00",
        lastAccessed: now,
        content: "<h2>About SecureDel Demo</h2><p>Safe sandbox cached page.</p>"
      },
      {
        name: "style.css",
        path: "demo_browser_cache/css/style.css",
        category: "css",
        mimeType: "text/css",
        sizeBytes: 310 * 1024,
        createdTime: "2026-08-14 10:00:00",
        lastAccessed: now,
        content: "body { background: #0b0c10; color: #66fcf1; }"
      },
      {
        name: "responsive.css",
        path: "demo_browser_cache/css/responsive.css",
        category: "css",
        mimeType: "text/css",
        sizeBytes: 190 * 1024,
        createdTime: "2026-08-14 10:02:00",
        lastAccessed: now,
        content: "@media (max-width: 768px) { container { padding: 10px; } }"
      },
      {
        name: "app.js",
        path: "demo_browser_cache/js/app.js",
        category: "js",
        mimeType: "application/javascript",
        sizeBytes: 520 * 1024,
        createdTime: "2026-08-14 10:01:00",
        lastAccessed: now,
        content: "console.log('SecureDel Demo Application Cache Loaded');"
      },
      {
        name: "analytics.js",
        path: "demo_browser_cache/js/analytics.js",
        category: "js",
        mimeType: "application/javascript",
        sizeBytes: 150 * 1024,
        createdTime: "2026-08-14 10:03:00",
        lastAccessed: now,
        content: "window.demoAnalytics = { track: function() {} };"
      },
      {
        name: "logo.svg",
        path: "demo_browser_cache/images/logo.svg",
        category: "images",
        mimeType: "image/svg+xml",
        sizeBytes: 210 * 1024,
        createdTime: "2026-08-14 09:30:00",
        lastAccessed: now,
        content: "<svg><text>SecureDel Logo</text></svg>"
      },
      {
        name: "banner.svg",
        path: "demo_browser_cache/images/banner.svg",
        category: "images",
        mimeType: "image/svg+xml",
        sizeBytes: 320 * 1024,
        createdTime: "2026-08-14 09:35:00",
        lastAccessed: now,
        content: "<svg><text>SecureDel Hero Banner</text></svg>"
      },
      {
        name: "products.json",
        path: "demo_browser_cache/json/products.json",
        category: "json",
        mimeType: "application/json",
        sizeBytes: 80 * 1024,
        createdTime: "2026-08-14 10:10:00",
        lastAccessed: now,
        content: JSON.stringify([{ id: 1, name: "Demo Product" }])
      }
    ];

    const totalBytes = resources.reduce((acc, r) => acc + r.sizeBytes, 0);
    return { resources, totalSizeMB: Number((totalBytes / (1024 * 1024)).toFixed(1)) };
  },

  // Tool 3: Recent Files Cleaner
  generateRecentFiles(): DemoRecentActivity[] {
    return [
      {
        id: "rf-1",
        filename: "resume_demo.pdf",
        path: "/demo/User/Documents/resume_demo.pdf",
        category: "Documents",
        size: "1.2 MB",
        lastOpened: "10 mins ago"
      },
      {
        id: "rf-2",
        filename: "project_demo.zip",
        path: "/demo/User/Downloads/project_demo.zip",
        category: "Downloads",
        size: "4.8 MB",
        lastOpened: "25 mins ago"
      },
      {
        id: "rf-3",
        filename: "presentation_demo.pptx",
        path: "/demo/User/Documents/presentation_demo.pptx",
        category: "Documents",
        size: "3.5 MB",
        lastOpened: "1 hour ago"
      },
      {
        id: "rf-4",
        filename: "notes_demo.txt",
        path: "/demo/User/Documents/notes_demo.txt",
        category: "Documents",
        size: "12 KB",
        lastOpened: "2 hours ago"
      },
      {
        id: "rf-5",
        filename: "dataset_demo.csv",
        path: "/demo/User/Downloads/dataset_demo.csv",
        category: "Downloads",
        size: "840 KB",
        lastOpened: "3 hours ago"
      },
      {
        id: "rf-6",
        filename: "screenshot_demo.png",
        path: "/demo/User/Images/screenshot_demo.png",
        category: "Other",
        size: "620 KB",
        lastOpened: "5 hours ago"
      }
    ];
  },

  // Tool 4: Log Scanner
  generateLogs(): { files: File[]; logDetails: DemoLogFile[] } {
    const logsList: DemoLogFile[] = [
      {
        filename: "application.log",
        path: "SecureDel/demo_environment/logs/application.log",
        linesCount: 45,
        sizeKB: 4,
        content: `2026-08-14 10:30:01 [INFO] SecureDel Application Services initialized.
2026-08-14 10:30:15 [DEBUG] Connecting to mock server database...
2026-08-14 10:31:02 [INFO] Worker pool initialized with 4 threads.
2026-08-14 10:32:45 [WARN] DEMO_API_KEY=NOT_A_REAL_SECRET
2026-08-14 10:33:00 [INFO] System health check passed.`
      },
      {
        filename: "authentication.log",
        path: "SecureDel/demo_environment/logs/authentication.log",
        linesCount: 38,
        sizeKB: 3,
        content: `2026-08-14 10:31:12 [INFO] User operator@securedel.demo authenticated successfully.
2026-08-14 10:33:10 [ERROR] Failed auth attempt: DEMO_PASSWORD=NOT_A_REAL_PASSWORD
2026-08-14 10:34:00 [INFO] OAuth token generated for session.`
      },
      {
        filename: "server.log",
        path: "SecureDel/demo_environment/logs/server.log",
        linesCount: 62,
        sizeKB: 6,
        content: `2026-08-14 10:28:00 [INFO] HTTP Server listening on port 5000.
2026-08-14 10:35:12 [WARN] Header secret detected: Bearer DEMO_TOKEN_NOT_REAL_12345
2026-08-14 10:36:00 [INFO] Request completed with status 200 OK.`
      },
      {
        filename: "error.log",
        path: "SecureDel/demo_environment/logs/error.log",
        linesCount: 41,
        sizeKB: 4,
        content: `2026-08-14 10:25:00 [ERROR] Storage quota warning triggered on demo partition.
2026-08-14 10:40:00 [INFO] Cleaned temporary trace buffers.`
      }
    ];

    const files = logsList.map(
      (l) => new File([l.content], l.filename, { type: "text/plain" })
    );

    return { files, logDetails: logsList };
  },

  // Tool 5: Secret Leak Detector
  generateRepository(): { files: File[]; repoStructure: DemoRepoFile[] } {
    const repoFiles: DemoRepoFile[] = [
      {
        filename: "config.js",
        path: "secure-del-demo-repository/src/config.js",
        content: `// SecureDel Demo Configuration
const config = {
  appName: "SecureDel Demo App",
  env: "demonstration",
  // DEMO NOTICE: Fictional test key below
  apiKey: "DEMO_API_KEY=NOT_A_REAL_SECRET",
  port: 5000
};
module.exports = config;`
      },
      {
        filename: ".env.demo",
        path: "secure-del-demo-repository/.env.demo",
        content: `# Fictional Demo Environment File
PORT=5000
DEMO_TOKEN=SECUREDEL_DEMO_TOKEN
APP_ENV=demo`
      },
      {
        filename: "settings.json",
        path: "secure-del-demo-repository/config/settings.json",
        content: `{
  "appName": "SecureDel Demo",
  "database": "sqlite://demo.db",
  "DEMO_PASSWORD": "DEMO_ONLY_VALUE"
}`
      },
      {
        filename: "app.js",
        path: "secure-del-demo-repository/src/app.js",
        content: `// SecureDel Application Entry
console.log("SecureDel Demo Repository Running...");`
      },
      {
        filename: "README.md",
        path: "secure-del-demo-repository/README.md",
        content: `# SecureDel Demo Repository\n\nFictional repository generated for testing secret scanner capabilities.`
      },
      {
        filename: "package.json",
        path: "secure-del-demo-repository/package.json",
        content: `{\n  "name": "secure-del-demo-repo",\n  "version": "1.0.0",\n  "private": true\n}`
      }
    ];

    const files = repoFiles.map(
      (rf) => new File([rf.content], rf.filename, { type: "text/plain" })
    );

    return { files, repoStructure: repoFiles };
  },

  // Tool 6: Temporary File Cleaner
  generateTempFiles(): DemoTempFile[] {
    return [
      {
        filename: "installer_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/installer_demo.tmp",
        sizeBytes: 2.1 * 1024 * 1024,
        category: "Installer Cache",
        created: "10 mins ago"
      },
      {
        filename: "application_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/application_demo.tmp",
        sizeBytes: 1.8 * 1024 * 1024,
        category: "Application Cache",
        created: "20 mins ago"
      },
      {
        filename: "cache_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/cache_demo.tmp",
        sizeBytes: 1.5 * 1024 * 1024,
        category: "System Temp",
        created: "35 mins ago"
      },
      {
        filename: "debug_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/debug_demo.tmp",
        sizeBytes: 1.2 * 1024 * 1024,
        category: "Debug Log",
        created: "50 mins ago"
      },
      {
        filename: "update_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/update_demo.tmp",
        sizeBytes: 1.0 * 1024 * 1024,
        category: "Update Cache",
        created: "1 hour ago"
      },
      {
        filename: "session_demo.tmp",
        path: "SecureDel/demo_environment/temp_files/session_demo.tmp",
        sizeBytes: 0.8 * 1024 * 1024,
        category: "Session Buffer",
        created: "2 hours ago"
      }
    ];
  }
};
