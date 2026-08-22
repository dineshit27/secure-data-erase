import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CommunityUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  bio: string;
  reputation: number;
  badges: string[];
  skills: string[];
  isVerified?: boolean;
  isCompany?: boolean;
  companyInfo?: {
    website: string;
    about: string;
    techStack: string[];
    productsCount: number;
    teamSize: string;
  };
  stats: {
    discussions: number;
    projects: number;
    answers: number;
    followers: number;
    following: number;
  };
}

export interface CommentItem {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    badge?: string;
  };
  content: string;
  createdAt: string;
  upvotes: number;
  userUpvoted?: boolean;
  replies?: CommentItem[];
}

export interface DiscussionItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    badge?: string;
  };
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  views: number;
  createdAt: string;
  comments: CommentItem[];
  userUpvoted?: boolean;
  userDownvoted?: boolean;
  userBookmarked?: boolean;
  userFollowing?: boolean;
  isPinned?: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  image: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  category: string;
  techStack: string[];
  githubUrl: string;
  demoUrl: string;
  stars: number;
  views: number;
  tags: string[];
  license: string;
  status: "Open Source" | "Beta" | "Production" | "Experimental";
  createdAt: string;
  userStarred?: boolean;
  userBookmarked?: boolean;
  comments: CommentItem[];
}

export interface TechShowcaseItem {
  id: string;
  productName: string;
  companyName: string;
  logo: string;
  tagline: string;
  description: string;
  category: string;
  website: string;
  tags: string[];
  highlights: string[];
  rating: number;
  reviewsCount: number;
  votes: number;
  listingType: "free" | "featured" | "sponsored";
  badgeText?: string;
  createdAt: string;
  userVoted?: boolean;
}

export interface ITToolItem {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  website: string;
  pricingType: "Free" | "Freemium" | "Paid" | "Open Source";
  platform: string[];
  rating: number;
  reviewsCount: number;
  tags: string[];
  isAIPowered?: boolean;
  isOpenSource?: boolean;
  isPopular?: boolean;
  createdAt: string;
  userBookmarked?: boolean;
}

export interface QAQuestionItem {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  tags: string[];
  votes: number;
  answersCount: number;
  views: number;
  createdAt: string;
  isResolved?: boolean;
  userVoted?: boolean;
  userBookmarked?: boolean;
  answers: {
    id: string;
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      badge?: string;
    };
    content: string;
    votes: number;
    isAccepted?: boolean;
    createdAt: string;
    userVoted?: boolean;
  }[];
}

export interface EventItem {
  id: string;
  title: string;
  type: "Hackathon" | "Webinar" | "Workshop" | "Meetup" | "Conference";
  date: string;
  time: string;
  format: "Online" | "Offline" | "Hybrid";
  location?: string;
  organizer: string;
  organizerAvatar: string;
  description: string;
  attendeesCount: number;
  maxAttendees?: number;
  tags: string[];
  registrationUrl?: string;
  isRegistered?: boolean;
}

export interface NotificationItem {
  id: string;
  type: "upvote" | "comment" | "answer" | "follow" | "badge" | "featured";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface CommunityState {
  // Active Navigation Tab
  activeTab: "home" | "discussions" | "projects" | "showcase" | "tools" | "questions" | "events" | "leaderboard";
  setActiveTab: (tab: CommunityState["activeTab"]) => void;

  // Search & Global Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Drawer & Modal States
  selectedUserProfile: CommunityUser | null;
  setSelectedUserProfile: (user: CommunityUser | null) => void;
  openCreateModalType: "discussion" | "question" | "project" | "tool" | "showcase" | "event" | null;
  setOpenCreateModalType: (type: CommunityState["openCreateModalType"]) => void;
  reportingItem: { type: "post" | "comment" | "user"; id: string; title: string } | null;
  setReportingItem: (item: CommunityState["reportingItem"]) => void;

  // Data Collections
  users: CommunityUser[];
  discussions: DiscussionItem[];
  projects: ProjectItem[];
  showcases: TechShowcaseItem[];
  tools: ITToolItem[];
  questions: QAQuestionItem[];
  events: EventItem[];
  notifications: NotificationItem[];
  followedUserIds: string[];
  hiddenDiscussionIds: string[];
  mutedUserIds: string[];

  // Actions
  toggleUpvoteDiscussion: (id: string) => void;
  toggleBookmarkDiscussion: (id: string) => void;
  addDiscussionComment: (discussionId: string, content: string) => void;
  addDiscussion: (newDiscussion: Omit<DiscussionItem, "id" | "upvotes" | "downvotes" | "commentsCount" | "views" | "createdAt" | "comments">) => void;

  toggleStarProject: (id: string) => void;
  toggleBookmarkProject: (id: string) => void;
  addProject: (newProject: Omit<ProjectItem, "id" | "stars" | "views" | "createdAt" | "comments">) => void;

  toggleVoteShowcase: (id: string) => void;
  addShowcase: (newShowcase: Omit<TechShowcaseItem, "id" | "votes" | "rating" | "reviewsCount" | "createdAt">) => void;

  toggleBookmarkTool: (id: string) => void;
  addTool: (newTool: Omit<ITToolItem, "id" | "rating" | "reviewsCount" | "createdAt">) => void;

  toggleVoteQuestion: (id: string) => void;
  toggleVoteAnswer: (questionId: string, answerId: string) => void;
  markAnswerAccepted: (questionId: string, answerId: string) => void;
  addAnswer: (questionId: string, content: string) => void;
  addQuestion: (newQuestion: Omit<QAQuestionItem, "id" | "votes" | "answersCount" | "views" | "createdAt" | "answers">) => void;

  toggleRegisterEvent: (id: string) => void;
  addEvent: (newEvent: Omit<EventItem, "id" | "attendeesCount">) => void;

  toggleFollowUser: (userId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  reportContent: (type: string, targetId: string, reason: string) => void;
  blockUser: (userId: string) => void;
}

// Initial Demo Data
const INITIAL_USERS: CommunityUser[] = [
  {
    id: "user-alex",
    name: "Alex Rivera",
    username: "@alex_sec",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    role: "Lead Cybersecurity Architect",
    bio: "Focusing on zero-trust infrastructure, kernel memory sanitization, and cryptographic data erasure standards.",
    reputation: 2840,
    badges: ["Security Expert", "Verified Developer", "Community Builder", "Code Contributor"],
    skills: ["Rust", "Cybersecurity", "Memory Safety", "Linux", "Zero-Trust"],
    isVerified: true,
    stats: { discussions: 42, projects: 12, answers: 89, followers: 1420, following: 230 }
  },
  {
    id: "user-priya",
    name: "Priya Sharma",
    username: "@priyacodes",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
    role: "Senior Full-Stack Engineer",
    bio: "Building privacy-preserving developer tools & open source React security libraries.",
    reputation: 2540,
    badges: ["Project Creator", "Privacy Defender", "Verified Developer"],
    skills: ["TypeScript", "React", "Node.js", "Web Crypto API", "Security"],
    isVerified: true,
    stats: { discussions: 28, projects: 8, answers: 64, followers: 980, following: 145 }
  },
  {
    id: "user-rahul",
    name: "Rahul Verma",
    username: "@rahul_devops",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    role: "DevOps & Cloud Security Lead",
    bio: "Obsessed with automated vulnerability scanning, Kubernetes hardening, and ephemeral workloads.",
    reputation: 2210,
    badges: ["Security Explorer", "Code Contributor", "Verified Developer"],
    skills: ["Kubernetes", "Docker", "DevOps", "Terraform", "AWS"],
    isVerified: true,
    stats: { discussions: 35, projects: 6, answers: 52, followers: 730, following: 190 }
  },
  {
    id: "comp-cloudshield",
    name: "CloudShield Security",
    username: "@cloudshield",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80",
    role: "Enterprise Cloud Security Platform",
    bio: "Automated cloud asset security posture management and real-time threat prevention.",
    reputation: 4950,
    badges: ["Verified Company", "Featured Partner"],
    skills: ["Cloud Security", "CSPM", "SOC2 Compliance", "API Security"],
    isVerified: true,
    isCompany: true,
    companyInfo: {
      website: "https://cloudshield.example.io",
      about: "CloudShield provides automated multi-cloud compliance and threat monitoring for modern engineering organizations.",
      techStack: ["AWS", "GCP", "Azure", "Go", "GraphQL"],
      productsCount: 3,
      teamSize: "50-200"
    },
    stats: { discussions: 19, projects: 4, answers: 31, followers: 3400, following: 42 }
  },
  {
    id: "comp-devguard",
    name: "DEVGUARD",
    username: "@devguard_ai",
    avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=250&q=80",
    role: "AI Code Vulnerability Scanner",
    bio: "Automatically detect hardcoded secrets, SQL vulnerabilities, and dependency risks in your CI/CD pipelines.",
    reputation: 3820,
    badges: ["Verified Company", "AI Innovator"],
    skills: ["AI Security", "SAST", "CI/CD", "Secret Scanning"],
    isVerified: true,
    isCompany: true,
    companyInfo: {
      website: "https://devguard.example.dev",
      about: "DEVGUARD is an AI-powered static analysis platform designed to fix security bugs before code hits production.",
      techStack: ["Python", "PyTorch", "Rust", "Docker"],
      productsCount: 2,
      teamSize: "20-50"
    },
    stats: { discussions: 25, projects: 3, answers: 45, followers: 2150, following: 18 }
  }
];

const INITIAL_DISCUSSIONS: DiscussionItem[] = [
  {
    id: "disc-1",
    title: "How should developers safely manage and erase API keys & secrets in production?",
    description: "Key rotation is not enough if memory dumps or unencrypted temp storage leak credentials. What are your team's protocols for secret destruction?",
    content: "When handling production API keys and private certificates, environment variables can easily be dumped by crash reporters or process metrics. We recently migrated to in-memory secure wipe routines that overwrite memory buffers with DoD 5220.22-M algorithms upon process exit or secret rotation.\n\nWhat sanitization techniques do you enforce for temporary cache directories and swap partitions in containerized environments?",
    category: "Cybersecurity",
    tags: ["Security", "DevOps", "Secrets", "DataPrivacy"],
    author: {
      id: "user-alex",
      name: "Alex Rivera",
      username: "@alex_sec",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
      badge: "Security Expert"
    },
    upvotes: 128,
    downvotes: 2,
    commentsCount: 34,
    views: 2140,
    createdAt: "2 hours ago",
    userUpvoted: true,
    isPinned: true,
    comments: [
      {
        id: "c-1",
        author: {
          id: "user-rahul",
          name: "Rahul Verma",
          username: "@rahul_devops",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
          badge: "Security Explorer"
        },
        content: "We use HashiCorp Vault with short-lived dynamic credentials (max TTL 15 minutes). For container temp files, mounted `tmpfs` volumes ensure data only resides in volatile RAM.",
        createdAt: "1 hour ago",
        upvotes: 24,
        replies: [
          {
            id: "c-1-1",
            author: {
              id: "user-priya",
              name: "Priya Sharma",
              username: "@priyacodes",
              avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80"
            },
            content: "Agreed! Using tmpfs combined with SecureDel's background log scrubber prevents stray secrets from persisting on SSD sectors.",
            createdAt: "30 minutes ago",
            upvotes: 12
          }
        ]
      }
    ]
  },
  {
    id: "disc-2",
    title: "SSD Trim vs Cryptographic Data Erasure: Best practices for modern NVMe drives",
    description: "Traditional overwrite wipes can cause write wear on SSDs or fail due to wear-leveling controllers. Here is a deep dive into ATA Secure Erase vs Crypto Scramble.",
    content: "Wear-leveling on modern NVMe drives means physical sectors are remapped continuously. Simply overwriting a file path with zeroes does not guarantee physical NAND cells are wiped. Cryptographic erase (destroying the drive encryption key) is significantly safer and instantaneous.",
    category: "IT Infrastructure",
    tags: ["SSD", "Hardware", "DataPrivacy", "Storage"],
    author: {
      id: "user-priya",
      name: "Priya Sharma",
      username: "@priyacodes",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
      badge: "Project Creator"
    },
    upvotes: 95,
    downvotes: 1,
    commentsCount: 18,
    views: 1420,
    createdAt: "5 hours ago",
    comments: []
  },
  {
    id: "disc-3",
    title: "Building Privacy-First AI Applications: Minimizing PII retention in Vector DBs",
    description: "Vector embeddings can unintentionally store sensitive user data. How are you sanitizing embeddings before indexing?",
    content: "Large Language Models and RAG pipelines store text chunks as high-dimensional vector embeddings. Rebuilding original text from embeddings is surprisingly achievable with inversion models. We need strict regex & entropy scrubbing prior to tokenization.",
    category: "AI & ML",
    tags: ["AI", "VectorDB", "DataPrivacy", "Python"],
    author: {
      id: "comp-devguard",
      name: "DEVGUARD",
      username: "@devguard_ai",
      avatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=250&q=80",
      badge: "AI Innovator"
    },
    upvotes: 84,
    downvotes: 0,
    commentsCount: 12,
    views: 980,
    createdAt: "1 day ago",
    comments: []
  }
];

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-securevault",
    name: "SecureVault Core",
    tagline: "Open-source zero-knowledge password & secret security manager",
    description: "Built with WebCrypto API and Rust Wasm binaries to guarantee client-side encryption and zero-server secret visibility.",
    logo: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&q=80",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    creator: {
      id: "user-priya",
      name: "Priya Sharma",
      username: "@priyacodes",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80"
    },
    category: "Open Source",
    techStack: ["React", "TypeScript", "Rust", "WebCrypto", "PostgreSQL"],
    githubUrl: "https://github.com/example/securevault-core",
    demoUrl: "https://securevault.example.dev",
    stars: 348,
    views: 3820,
    tags: ["Security", "Encryption", "React", "OpenSource"],
    license: "MIT",
    status: "Production",
    createdAt: "3 days ago",
    comments: []
  },
  {
    id: "proj-logcleaner-cli",
    name: "LogSanitizer CLI",
    tagline: "High-performance CLI tool to strip tokens, IPs, and PII from log dumps",
    description: "Rust CLI that parses gigabytes of server log files per second, redacting sensitive regex patterns before uploading to SIEMs.",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    creator: {
      id: "user-alex",
      name: "Alex Rivera",
      username: "@alex_sec",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
    },
    category: "Developer Tools",
    techStack: ["Rust", "CLI", "Regex", "Linux"],
    githubUrl: "https://github.com/example/log-sanitizer",
    demoUrl: "https://crates.io/crates/log-sanitizer",
    stars: 215,
    views: 2450,
    tags: ["Rust", "CLI", "DevOps", "Cybersecurity"],
    license: "Apache-2.0",
    status: "Production",
    createdAt: "1 week ago",
    comments: []
  },
  {
    id: "proj-k8s-wiper",
    name: "KubeWipe Operator",
    tagline: "Kubernetes controller for ephemeral volume zeroing & container log purging",
    description: "Automatically intercepts pod termination hooks to securely overwrite ephemeral storage volumes before release.",
    logo: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=200&q=80",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    creator: {
      id: "user-rahul",
      name: "Rahul Verma",
      username: "@rahul_devops",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
    },
    category: "DevOps",
    techStack: ["Go", "Kubernetes", "Docker", "Helm"],
    githubUrl: "https://github.com/example/kubewipe",
    demoUrl: "https://kubewipe.example.io",
    stars: 184,
    views: 1920,
    tags: ["Kubernetes", "DevOps", "Go", "Cloud"],
    license: "MIT",
    status: "Beta",
    createdAt: "2 weeks ago",
    comments: []
  }
];

const INITIAL_SHOWCASES: TechShowcaseItem[] = [
  {
    id: "show-cloudshield",
    productName: "CloudShield Enterprise",
    companyName: "CloudShield Inc.",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    tagline: "Cloud security posture monitoring & real-time threat response for enterprise teams.",
    description: "Continuously scan AWS, Azure, and GCP accounts for open buckets, unencrypted databases, and exposed IAM permissions.",
    category: "Cloud Security",
    website: "https://cloudshield.example.io",
    tags: ["CSPM", "AWS", "CloudSecurity", "SOC2"],
    highlights: ["SOC2 Type II Certified", "Multi-Cloud Integration", "Instant Remediation"],
    rating: 4.9,
    reviewsCount: 42,
    votes: 310,
    listingType: "sponsored",
    badgeText: "⚡ SPONSORED SPOTLIGHT",
    createdAt: "Just now"
  },
  {
    id: "show-devguard",
    productName: "DEVGUARD Code Sentinel",
    companyName: "DEVGUARD AI",
    logo: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=200&q=80",
    tagline: "AI-powered code security platform for modern engineering teams.",
    description: "Automatically detect vulnerabilities, secret leaks, and risky dependencies directly inside GitHub PRs.",
    category: "Developer Tools",
    website: "https://devguard.example.dev",
    tags: ["AI", "SAST", "SecretScanner", "GitHub"],
    highlights: ["Developer Friendly", "AI Powered", "Security Focused"],
    rating: 4.8,
    reviewsCount: 36,
    votes: 245,
    listingType: "featured",
    badgeText: "⭐ FEATURED",
    createdAt: "Yesterday"
  },
  {
    id: "show-securetrace",
    productName: "SecureTrace SIEM",
    companyName: "SecureTrace Labs",
    logo: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80",
    tagline: "Next-gen lightweight SIEM for microservices and cloud workloads.",
    description: "Stream millions of security logs per second with sub-second querying and automated threat detection alerts.",
    category: "Cybersecurity",
    website: "https://securetrace.example.io",
    tags: ["SIEM", "LogSecurity", "Observability"],
    highlights: ["Sub-second Search", "Zero Lag Ingestion", "Open Telemetry"],
    rating: 4.7,
    reviewsCount: 19,
    votes: 168,
    listingType: "free",
    createdAt: "3 days ago"
  }
];

const INITIAL_TOOLS: ITToolItem[] = [
  {
    id: "tool-1",
    name: "SecureDel Engine",
    logo: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=150&q=80",
    description: "Military-grade data wipe suite featuring DoD 5220.22-M, Gutmann, and cryptographic sanitization routines.",
    category: "Security",
    website: "https://securedel.example.com",
    pricingType: "Freemium",
    platform: ["Windows", "Linux", "macOS", "Web"],
    rating: 4.9,
    reviewsCount: 128,
    tags: ["DataWipe", "Privacy", "DiskCleaner", "Security"],
    isAIPowered: true,
    isOpenSource: true,
    isPopular: true,
    createdAt: "1 month ago"
  },
  {
    id: "tool-2",
    name: "Wireshark Network Analyzer",
    logo: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=150&q=80",
    description: "The world's foremost and widely-used network protocol analyzer for packet capture and deep inspection.",
    category: "Monitoring",
    website: "https://wireshark.org",
    pricingType: "Open Source",
    platform: ["Windows", "Linux", "macOS"],
    rating: 4.9,
    reviewsCount: 310,
    tags: ["Network", "PacketCapture", "Debugging", "OpenSource"],
    isOpenSource: true,
    isPopular: true,
    createdAt: "2 years ago"
  },
  {
    id: "tool-3",
    name: "Trivy Vulnerability Scanner",
    logo: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=150&q=80",
    description: "Comprehensive security scanner for container images, file systems, Git repositories, and Kubernetes.",
    category: "DevOps",
    website: "https://trivy.dev",
    pricingType: "Open Source",
    platform: ["Linux", "CLI", "Windows", "macOS"],
    rating: 4.8,
    reviewsCount: 89,
    tags: ["DevOps", "Containers", "Scanner", "Kubernetes"],
    isOpenSource: true,
    isPopular: true,
    createdAt: "6 months ago"
  },
  {
    id: "tool-4",
    name: "Burp Suite Community",
    logo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80",
    description: "Leading web application security testing toolkit for penetration testers and ethical hackers.",
    category: "Testing",
    website: "https://portswigger.net/burp",
    pricingType: "Freemium",
    platform: ["Windows", "Linux", "macOS"],
    rating: 4.9,
    reviewsCount: 240,
    tags: ["PenTesting", "WebSecurity", "Proxy", "EthicalHacking"],
    isPopular: true,
    createdAt: "1 year ago"
  }
];

const INITIAL_QUESTIONS: QAQuestionItem[] = [
  {
    id: "q-1",
    title: "How can I securely wipe leftover temporary files and browser cache programmatically on Windows using C#/PowerShell?",
    description: "Standard `Remove-Item` only unlinks pointers in the NTFS Master File Table without zeroing actual disk clusters. How do we trigger cryptographic sector overwrite or DoD pass via script?",
    author: {
      id: "user-rahul",
      name: "Rahul Verma",
      username: "@rahul_devops",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
    },
    tags: ["PowerShell", "Windows", "Security", "SSD"],
    votes: 42,
    answersCount: 3,
    views: 1240,
    createdAt: "4 hours ago",
    isResolved: true,
    answers: [
      {
        id: "ans-1",
        author: {
          id: "user-alex",
          name: "Alex Rivera",
          username: "@alex_sec",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
          badge: "Security Expert"
        },
        content: "To guarantee cluster sanitization, you should invoke Win32 APIs like `CreateFile` with `FILE_FLAG_NO_BUFFERING` and `FILE_FLAG_WRITE_THROUGH`, overwrite the stream buffer with random bytes, and execute `SFOR` or `Cipher.exe /w:C:\\path`. Alternatively, leverage SecureDel's native C++ engine via CLI binding `securedel-cli --wipe --pass 3`.",
        votes: 38,
        isAccepted: true,
        createdAt: "2 hours ago"
      }
    ]
  },
  {
    id: "q-2",
    title: "What is the recommended approach to prevent secret leakage in CI/CD pipeline build logs?",
    description: "When running automated tests or container builds, third-party libraries often print debug logs containing bearer tokens. How to enforce automated masking before SIEM indexing?",
    author: {
      id: "user-priya",
      name: "Priya Sharma",
      username: "@priyacodes",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80"
    },
    tags: ["CI/CD", "DevOps", "GitHubActions", "Secrets"],
    votes: 29,
    answersCount: 2,
    views: 890,
    createdAt: "1 day ago",
    answers: []
  }
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "Secure Coding & Memory Hygiene Masterclass",
    type: "Workshop",
    date: "AUG 28, 2026",
    time: "18:00 UTC",
    format: "Online",
    organizer: "SecureDel Security Guild",
    organizerAvatar: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=150&q=80",
    description: "Hands-on virtual session covering zero-trust code patterns, memory safety in Rust vs C++, and avoiding secret leakage in production storage.",
    attendeesCount: 312,
    maxAttendees: 500,
    tags: ["Security", "Rust", "C++", "Workshop"],
    isRegistered: false
  },
  {
    id: "evt-2",
    title: "Global CyberErase Hackathon 2026",
    type: "Hackathon",
    date: "SEP 12 - 14, 2026",
    time: "48-Hour Virtual",
    format: "Online",
    organizer: "SecureDel & CloudShield",
    organizerAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    description: "Build open-source security tools, privacy utilities, or static analysis scanners! $15,000 in prize pool and feature placement on SecureDel Tech Showcase.",
    attendeesCount: 640,
    tags: ["Hackathon", "OpenSource", "Prizes", "Privacy"],
    isRegistered: true
  },
  {
    id: "evt-3",
    title: "AI Security & Threat Vectors Panel",
    type: "Webinar",
    date: "SEP 04, 2026",
    time: "15:00 UTC",
    format: "Online",
    organizer: "DEVGUARD AI",
    organizerAvatar: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80",
    description: "Join security leaders to discuss LLM prompt injection, vector store data leakage, and automated AI vulnerability scanning.",
    attendeesCount: 220,
    tags: ["AI", "Webinar", "Cybersecurity"],
    isRegistered: false
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "upvote",
    title: "Project Trending!",
    message: "Your project 'SecureVault Core' gained 25 new stars today.",
    createdAt: "10m ago",
    isRead: false
  },
  {
    id: "notif-2",
    type: "answer",
    title: "Accepted Answer",
    message: "Alex Rivera accepted your answer on 'Securely wiping NVMe sectors'.",
    createdAt: "1h ago",
    isRead: false
  },
  {
    id: "notif-3",
    type: "badge",
    title: "New Badge Unlocked",
    message: "You earned the 'Security Explorer' badge for publishing 5 security discussions.",
    createdAt: "5h ago",
    isRead: true
  }
];

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      activeTab: "home",
      setActiveTab: (tab) => set({ activeTab: tab }),

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      selectedUserProfile: null,
      setSelectedUserProfile: (user) => set({ selectedUserProfile: user }),

      openCreateModalType: null,
      setOpenCreateModalType: (type) => set({ openCreateModalType: type }),

      reportingItem: null,
      setReportingItem: (item) => set({ reportingItem: item }),

      users: INITIAL_USERS,
      discussions: INITIAL_DISCUSSIONS,
      projects: INITIAL_PROJECTS,
      showcases: INITIAL_SHOWCASES,
      tools: INITIAL_TOOLS,
      questions: INITIAL_QUESTIONS,
      events: INITIAL_EVENTS,
      notifications: INITIAL_NOTIFICATIONS,
      followedUserIds: ["comp-cloudshield"],
      hiddenDiscussionIds: [],
      mutedUserIds: [],

      // Discussions
      toggleUpvoteDiscussion: (id) =>
        set((state) => ({
          discussions: state.discussions.map((d) => {
            if (d.id === id) {
              const isUpvoted = d.userUpvoted;
              return {
                ...d,
                userUpvoted: !isUpvoted,
                upvotes: isUpvoted ? d.upvotes - 1 : d.upvotes + 1
              };
            }
            return d;
          })
        })),

      toggleBookmarkDiscussion: (id) =>
        set((state) => ({
          discussions: state.discussions.map((d) =>
            d.id === id ? { ...d, userBookmarked: !d.userBookmarked } : d
          )
        })),

      addDiscussionComment: (discussionId, content) =>
        set((state) => ({
          discussions: state.discussions.map((d) => {
            if (d.id === discussionId) {
              const newComment: CommentItem = {
                id: `c-${Date.now()}`,
                author: {
                  id: "user-curr",
                  name: "Operator",
                  username: "@operator",
                  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
                  badge: "Community Member"
                },
                content,
                createdAt: "Just now",
                upvotes: 1
              };
              return {
                ...d,
                commentsCount: d.commentsCount + 1,
                comments: [newComment, ...d.comments]
              };
            }
            return d;
          })
        })),

      addDiscussion: (newDisc) =>
        set((state) => {
          const created: DiscussionItem = {
            ...newDisc,
            id: `disc-${Date.now()}`,
            upvotes: 1,
            downvotes: 0,
            commentsCount: 0,
            views: 1,
            createdAt: "Just now",
            comments: [],
            userUpvoted: true
          };
          return {
            discussions: [created, ...state.discussions],
            activeTab: "discussions"
          };
        }),

      // Projects
      toggleStarProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === id) {
              const starred = p.userStarred;
              return {
                ...p,
                userStarred: !starred,
                stars: starred ? p.stars - 1 : p.stars + 1
              };
            }
            return p;
          })
        })),

      toggleBookmarkProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, userBookmarked: !p.userBookmarked } : p
          )
        })),

      addProject: (newProj) =>
        set((state) => {
          const created: ProjectItem = {
            ...newProj,
            id: `proj-${Date.now()}`,
            stars: 1,
            views: 1,
            createdAt: "Just now",
            comments: [],
            userStarred: true
          };
          return {
            projects: [created, ...state.projects],
            activeTab: "projects"
          };
        }),

      // Tech Showcase
      toggleVoteShowcase: (id) =>
        set((state) => ({
          showcases: state.showcases.map((s) => {
            if (s.id === id) {
              const voted = s.userVoted;
              return {
                ...s,
                userVoted: !voted,
                votes: voted ? s.votes - 1 : s.votes + 1
              };
            }
            return s;
          })
        })),

      addShowcase: (newShow) =>
        set((state) => {
          const created: TechShowcaseItem = {
            ...newShow,
            id: `show-${Date.now()}`,
            votes: 1,
            rating: 5.0,
            reviewsCount: 1,
            createdAt: "Just now",
            userVoted: true
          };
          return {
            showcases: [created, ...state.showcases],
            activeTab: "showcase"
          };
        }),

      // IT Tools
      toggleBookmarkTool: (id) =>
        set((state) => ({
          tools: state.tools.map((t) =>
            t.id === id ? { ...t, userBookmarked: !t.userBookmarked } : t
          )
        })),

      addTool: (newTool) =>
        set((state) => {
          const created: ITToolItem = {
            ...newTool,
            id: `tool-${Date.now()}`,
            rating: 5.0,
            reviewsCount: 1,
            createdAt: "Just now"
          };
          return {
            tools: [created, ...state.tools],
            activeTab: "tools"
          };
        }),

      // Q&A
      toggleVoteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === id) {
              const voted = q.userVoted;
              return {
                ...q,
                userVoted: !voted,
                votes: voted ? q.votes - 1 : q.votes + 1
              };
            }
            return q;
          })
        })),

      toggleVoteAnswer: (questionId, answerId) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                answers: q.answers.map((a) => {
                  if (a.id === answerId) {
                    const voted = a.userVoted;
                    return {
                      ...a,
                      userVoted: !voted,
                      votes: voted ? a.votes - 1 : a.votes + 1
                    };
                  }
                  return a;
                })
              };
            }
            return q;
          })
        })),

      markAnswerAccepted: (questionId, answerId) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                isResolved: true,
                answers: q.answers.map((a) => ({
                  ...a,
                  isAccepted: a.id === answerId
                }))
              };
            }
            return q;
          })
        })),

      addAnswer: (questionId, content) =>
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              const newAns = {
                id: `ans-${Date.now()}`,
                author: {
                  id: "user-curr",
                  name: "Operator",
                  username: "@operator",
                  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
                  badge: "Contributor"
                },
                content,
                votes: 1,
                userVoted: true,
                createdAt: "Just now"
              };
              return {
                ...q,
                answersCount: q.answersCount + 1,
                answers: [...q.answers, newAns]
              };
            }
            return q;
          })
        })),

      addQuestion: (newQ) =>
        set((state) => {
          const created: QAQuestionItem = {
            ...newQ,
            id: `q-${Date.now()}`,
            votes: 1,
            answersCount: 0,
            views: 1,
            createdAt: "Just now",
            answers: [],
            userVoted: true
          };
          return {
            questions: [created, ...state.questions],
            activeTab: "questions"
          };
        }),

      // Events
      toggleRegisterEvent: (id) =>
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id === id) {
              const reg = e.isRegistered;
              return {
                ...e,
                isRegistered: !reg,
                attendeesCount: reg ? e.attendeesCount - 1 : e.attendeesCount + 1
              };
            }
            return e;
          })
        })),

      addEvent: (newEvent) =>
        set((state) => {
          const created: EventItem = {
            ...newEvent,
            id: `evt-${Date.now()}`,
            attendeesCount: 1,
            isRegistered: true
          };
          return {
            events: [created, ...state.events],
            activeTab: "events"
          };
        }),

      // User & Moderation
      toggleFollowUser: (userId) =>
        set((state) => {
          const followed = state.followedUserIds.includes(userId);
          const nextFollowed = followed
            ? state.followedUserIds.filter((id) => id !== userId)
            : [...state.followedUserIds, userId];

          return {
            followedUserIds: nextFollowed,
            users: state.users.map((u) => {
              if (u.id === userId) {
                return {
                  ...u,
                  stats: {
                    ...u.stats,
                    followers: followed ? u.stats.followers - 1 : u.stats.followers + 1
                  }
                };
              }
              return u;
            })
          };
        }),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        })),

      reportContent: (type, targetId, reason) =>
        set((state) => {
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            type: "badge",
            title: "Report Submitted",
            message: `Your report for ${type} #${targetId} (${reason}) has been logged for community moderation.`,
            createdAt: "Just now",
            isRead: false
          };
          return {
            notifications: [newNotif, ...state.notifications],
            reportingItem: null
          };
        }),

      blockUser: (userId) =>
        set((state) => ({
          mutedUserIds: [...state.mutedUserIds, userId]
        }))
    }),
    {
      name: "securedel-community-store-v2"
    }
  )
);
