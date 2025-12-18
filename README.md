# BugBrief

A **local-first AI toolkit** for security professionals. Generate consultant-grade vulnerability reports, translate technical findings for different audiences, and maintain a searchable archive of your security documentation.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Gemini](https://img.shields.io/badge/AI-Gemini-orange?logo=google)

## ✨ Features

- **Report Generator** - Transform raw POC logs or vulnerability descriptions into formatted, professional reports
- **Vulnerability Explainer** - Translate technical findings for different audiences (Board, PMs, Developers, QA, Non-technical)
- **History Archive** - Browse, edit, and manage all saved reports with WYSIWYG editing
- **Privacy-First** - All data is sanitized locally before AI processing; sensitive data never leaves your machine

## 🛡️ Data Sanitization

Before any data is sent to the AI, it's automatically stripped of:

| Sensitive Data | Replacement |
|----------------|-------------|
| IP addresses | `[IP_ADDRESS]` |
| Emails | `[EMAIL]` |
| API keys (OpenAI, AWS, Google, GitHub, Slack) | `[REDACTED_KEY]` |
| JWT tokens | `[JWT_TOKEN]` |
| Bearer/Basic auth | `[REDACTED_TOKEN]` |
| Session IDs & cookies | `[REDACTED_SESSION]` |
| Credit card numbers | `[CREDIT_CARD]` |
| Phone numbers | `[PHONE]` |
| UUIDs | `[UUID]` |
| Private keys (PEM) | `[PRIVATE_KEY_REDACTED]` |
| Passwords | `[REDACTED_PASSWORD]` |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bugbrief.git
   cd bugbrief
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── report/           # Report generator
│   ├── explainer/        # Vulnerability explainer
│   └── history/          # Report archive & editor
├── components/
│   └── WysiwygEditor.tsx # WYSIWYG markdown editor
└── lib/
    ├── ai.ts             # Gemini AI integration
    ├── db.ts             # Prisma database client
    └── sanitizer.ts      # Data sanitization
```

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini
- **Editor**: TipTap WYSIWYG

## 📝 Usage

### Generate a Report

1. Go to **Report Gen**
2. Choose mode:
   - **Batch POC Upload**: Paste raw HTTP logs, CLI output, or request/response data
   - **Short Description**: Enter vulnerability name and abuse explanation
3. Click **Generate Report**
4. Report is automatically saved to history

### Explain a Vulnerability

1. Go to **Explainer** (or click "Explain This" on any saved report)
2. Enter vulnerability details
3. Select target audience (Board, PM, Dev, QA, Non-technical)
4. Generate audience-appropriate explanation

### Manage Reports

1. Go to **History**
2. View, edit, or delete saved reports
3. Use WYSIWYG editor for easy editing
4. Changes to titles auto-update in the archive

## 🔐 Security Notes

- All sensitive data is sanitized **before** being sent to the AI
- Database is local SQLite (no cloud storage)
- No telemetry or external data collection
- API keys are only used for AI generation

## 📄 License

MIT License - feel free to use and modify for your security workflows.

---

Built with ❤️ for the security community
