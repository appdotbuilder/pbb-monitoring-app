
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import {
  createUserInputSchema,
  updateUserInputSchema,
  createVillageInputSchema,
  createHamletInputSchema,
  updateHamletInputSchema,
  createPbbPaymentInputSchema,
  updatePbbPaymentInputSchema,
  hamletFilterSchema,
  pbbPaymentFilterSchema,
  loginInputSchema
} from './schema';

// Handler imports
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { getUsers } from './handlers/get_users';
import { deleteUser } from './handlers/delete_user';
import { createVillage } from './handlers/create_village';
import { getVillages } from './handlers/get_villages';
import { createHamlet } from './handlers/create_hamlet';
import { updateHamlet } from './handlers/update_hamlet';
import { getHamlets } from './handlers/get_hamlets';
import { createPbbPayment } from './handlers/create_pbb_payment';
import { updatePbbPayment } from './handlers/update_pbb_payment';
import { deletePbbPayment } from './handlers/delete_pbb_payment';
import { getPbbPayments } from './handlers/get_pbb_payments';
import { getVillageDashboard } from './handlers/get_village_dashboard';
import { getHamletDashboard } from './handlers/get_hamlet_dashboard';
import { getPbbReport } from './handlers/get_pbb_report';
import { login } from './handlers/login';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Define delete input schemas
const deleteUserInputSchema = z.object({
  id: z.number(),
});

const deletePbbPaymentInputSchema = z.object({
  id: z.number(),
});

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  deleteUser: publicProcedure
    .input(deleteUserInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Village management
  createVillage: publicProcedure
    .input(createVillageInputSchema)
    .mutation(({ input }) => createVillage(input)),
  
  getVillages: publicProcedure
    .query(() => getVillages()),

  // Hamlet management
  createHamlet: publicProcedure
    .input(createHamletInputSchema)
    .mutation(({ input }) => createHamlet(input)),
  
  updateHamlet: publicProcedure
    .input(updateHamletInputSchema)
    .mutation(({ input }) => updateHamlet(input)),
  
  getHamlets: publicProcedure
    .input(hamletFilterSchema.optional())
    .query(({ input }) => getHamlets(input)),

  // PBB Payment management
  createPbbPayment: publicProcedure
    .input(createPbbPaymentInputSchema)
    .mutation(({ input }) => createPbbPayment(input)),
  
  updatePbbPayment: publicProcedure
    .input(updatePbbPaymentInputSchema)
    .mutation(({ input }) => updatePbbPayment(input)),
  
  deletePbbPayment: publicProcedure
    .input(deletePbbPaymentInputSchema)
    .mutation(({ input }) => deletePbbPayment(input)),
  
  getPbbPayments: publicProcedure
    .input(pbbPaymentFilterSchema.optional())
    .query(({ input }) => getPbbPayments(input)),

  // Dashboard data
  getVillageDashboard: publicProcedure
    .query(() => getVillageDashboard()),
  
  getHamletDashboard: publicProcedure
    .input(hamletFilterSchema.optional())
    .query(({ input }) => getHamletDashboard(input)),

  // Reports
  getPbbReport: publicProcedure
    .input(pbbPaymentFilterSchema.optional())
    .query(({ input }) => getPbbReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
