<div align="center">

  # Bringa

  _Open Source Inventory Sharing and Borrowing Management for Associations (Vereine)_

  ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

  [Getting Started](#getting-started) · [Features](#features) · [Setup](#setup) · [Security](SECURITY.md)

</div>

---

## About Bringa

**Bringa** is a modern, collaborative inventory management and borrowing system, tailored specifically for the needs of communities, clubs, and associations (Vereine). It makes it simple to track what items you have, who has borrowed what, and when items are due back.

This project is fully open-source and maintained by our association to help other communities manage their shared resources efficiently.

## Key Features

- **📦 Inventory Management:** Organize and manage items with detailed descriptions, images, and metadata.
- **🤝 Borrowing System:** Track borrowed items with a full borrowing history and borrower information.
- **🔐 Admin Dashboard:** Comprehensive admin views with system-wide item tracking and borrowing analytics.
- **👤 User Authentication:** Secure OAuth integration (Google/GitHub).
- **🎨 Modern UI:** Beautiful, responsive interface with dark/light theme support.
- **⚡ Real-Time Sync:** Instant updates powered by Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Supabase project (free tier available)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-org>/bringa.git
   cd bringa
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure your Supabase credentials and OAuth providers in `.env.local`.

4. **Run the development server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup & Configuration

### Database Setup

Bringa uses Supabase for its backend. To set up the database schema, run the latest SQL migration in the `supabase/migrations/` directory using the Supabase SQL Editor in your dashboard, or via the Supabase CLI:

```bash
npx supabase migration up
```

Key tables include:
- `profiles` - User profiles and metadata
- `items` - Inventory items
- `borrow_history` - Borrowing transaction logs
- `admins` - Admin user roles
- `invite_codes` - Invitation system management

### Authentication

Configure OAuth providers in your Supabase project dashboard:
- **Google OAuth:** Get credentials from [Google Cloud Console](https://console.cloud.google.com)
- **GitHub OAuth:** Create application in [GitHub Settings](https://github.com/settings/developers)

## Security

We take security seriously. Please ensure that you **never commit your `.env` files** to version control. If you discover a vulnerability, please reach out to the maintainers privately rather than opening a public issue.

See [SECURITY.md](SECURITY.md) for more details.

## Contributing

We welcome contributions from the community! Whether you are a member of our association or an external developer, feel free to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ for communities and Vereine.
</div>