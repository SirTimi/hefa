## Database setup (local)

1. Create DB:
   createdb -h localhost -U postgres hefa

2. Configure env:
   copy apps/api/.env.example to apps/api/.env and fill values.

3. Run migrations:
   npm run prisma:migrate -w apps/api

   # or

   npx prisma migrate dev -w apps/api

4. Seed demo data:
   npm run db:seed -w apps/api

## Common tasks

- Start API: npm run start:dev -w apps/api
- Open Swagger: http://localhost:3000/docs
- Healthchecks: /health/ready, /health/live
- Metrics: /metrics

## Never commit

- Real .env files
- Database dumps/backups
- node_modules/.prisma engines
