---
paths:
  - "prisma/**"
  - "lib/prisma.ts"
  - "lib/**/*.ts"
  - "scripts/**/*.ts"
---

# Prisma 7 conventions

- Import client from `@/app/generated/prisma/client` (not `@prisma/client`)
- Instantiate with `new PrismaClient({ adapter })` where adapter is `new PrismaPg({ connectionString })`
- Use `Prisma.JsonNull` for nullable JSON fields set to null (not plain `null`)
- Schema has no `url`/`directUrl` in datasource — those live in `prisma.config.ts`
- Run scripts with `tsx`, not `ts-node`
