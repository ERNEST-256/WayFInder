# WayFinder

> **Plan together. Travel better.**

WayFinder is an AI-native collaborative trip planning platform that helps groups turn a travel idea into an organized itinerary.

Describe the trip you want, build the itinerary with AI, invite your group, and keep everyone aligned — while the trip lead stays in control of the final plan.

---

## ✨ Features

### 🧠 AI-Powered Trip Planning

Describe your trip naturally instead of starting with a blank itinerary.

WayFinder's AI can help with:

- Itinerary generation
- Activity planning
- Travel recommendations
- Hotel recommendations
- Attraction discovery
- Itinerary modifications
- Conflict detection
- Travel planning suggestions

AI acts as a planning assistant — **the final decision stays with the user.**

---

### 👥 Collaborative Trip Planning

Create a trip and invite your travel group.

Members can:

- View the itinerary
- Suggest changes
- Share recommendations
- View trip updates
- Communicate with the trip lead

The trip lead maintains control over the official itinerary.

---

### 🗓️ Versioned Itineraries

Trip changes are tracked instead of silently overwriting previous plans.

The trip timeline can show:

- What changed
- Who suggested it
- Who approved it
- When it happened

This keeps the group aware of how the trip evolved.

---

### ✈️ Travel & Booking Information

WayFinder can help organize travel information such as:

- Flights
- Trains
- Hotels
- Attractions
- Tickets
- Booking references
- Transportation status

WayFinder focuses on helping users **plan and organize** their trip rather than acting as a booking marketplace.

---

### 🔐 Secure Authentication

WayFinder supports account authentication with features such as:

- Email/password authentication
- Email verification
- Session management
- Password recovery
- OAuth authentication

---

## 🏗️ Architecture

WayFinder is built as a modular backend platform with independently deployable services.

```text
                         ┌───────────────┐
                         │    Frontend   │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │     NGINX     │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  API Gateway  │
                         └───────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
          ┌────────┐         ┌────────┐        ┌──────────┐
          │  Auth  │         │  Trip  │        │ Planning │
          │Service │         │Service │        │ Service  │
          └────────┘         └────────┘        └──────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
               PostgreSQL     MongoDB       Redis
```

The platform is designed around clear service boundaries and separation between application state, AI data, and temporary infrastructure state.

---

## 🛠️ Technology Stack

### Backend

- Node.js
- TypeScript
- Express

### Data

- PostgreSQL
- MongoDB
- Redis

### Infrastructure

- Docker
- NGINX
- AWS
- GitHub Actions

### AI

WayFinder is designed to support self-hosted/open-weight AI models through an isolated AI layer.

The model infrastructure can evolve independently from the core application.

---

## 📁 Repository Structure

```text
WayFinder/
├── backend/
│   ├── gateway/
│   ├── services/
│   ├── workers/
│   ├── shared/
│   └── infrastructure/
│
├── ai/
│   ├── model/
│   ├── inference/
│   ├── prompts/
│   └── experiments/
│
├── frontend/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── github-actions/
│
├── docs/
│
├── docker-compose.yml
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔑 Product Philosophy

WayFinder is built around a simple principle:

> **AI proposes. Humans decide.**

AI should make planning easier without taking control away from the people actually going on the trip.

The platform therefore treats the user's confirmed decisions as authoritative and keeps AI-generated suggestions separate from the official trip plan.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- Docker
- Git

Clone the repository:

```bash
git clone <repository-url>
cd WayFinder
```

Install dependencies:

```bash
npm install
```

Start the development environment:

```bash
docker compose up
```

Environment-specific configuration can be provided using the supplied `.env.example` files.

> Setup instructions may evolve as the project develops.

---

## 🧪 Development

WayFinder uses TypeScript throughout the backend.

Services are independently structured and can be developed and tested separately.

Typical development workflow:

```bash
npm install
npm run dev
```

Individual services may provide their own development commands.

See the relevant service documentation for service-specific setup instructions.

---

## 🤝 Contributing

Contributions are welcome.

Before making significant changes:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update tests where appropriate.
5. Ensure the project builds successfully.
6. Open a pull request describing the change.

For larger architectural or product changes, open an issue first so the approach can be discussed before implementation.

---

## 📄 License

License information will be added here when the project is officially licensed.

---

## 🌍 Vision

Travel planning shouldn't feel like assembling a spreadsheet from twenty different tabs.

WayFinder aims to make trip planning feel more natural:

**Describe the trip → build the plan → collaborate → travel.**
