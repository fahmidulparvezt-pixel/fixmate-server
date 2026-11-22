# FixMate Server

Express.js + MongoDB REST API for FixMate, a role-based device and home appliance repair booking platform.

## Live Links

- API: https://fixmate-server-gamma.vercel.app
- Live site: https://fixmate-client-two.vercel.app
- Client repository: https://github.com/fahmidulparvezt-pixel/fixmate-client

## Admin Credentials

- Email: admin@fixmate.com
- Password: Admin123

Technician: rahim@fixmate.com / Tech1234. Customer: tanvir@fixmate.com / Customer123.

## Key Features

- JWT verification (BetterAuth JWKS) with `verifyToken`, `verifyCustomer`, `verifyTechnician`, `verifyAdmin` middlewares (401 Unauthorized, 403 Forbidden)
- Services API with server-side search, filter and sort
- Booking API with duplicate active request check and server-enforced status pipeline
- Stripe Checkout session (amount always read from the database), verify endpoint and signed webhook
- Idempotent payment saving (unique indexes on `stripeSessionId` and `bookingId`)
- Admin API for users, service approval, bookings, payments and stats
- Profile update API (email and role can not be changed)

## Collections

`users` (BetterAuth `user`), `services`, `bookings`, `payments`

## npm Packages

`express`, `cors`, `dotenv`, `mongodb`, `stripe`, `jose`, `nodemon` (dev)

## Environment Variables (`.env`)

```
PORT=5000
MONGODB_URI=
DB_NAME=
CLIENT_URL=
JWKS_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Run Locally

```bash
npm install
npm run dev
npm run seed
```