import { Router } from 'express';
import { SocketHttpContext } from '../controllers/context';
import { healthController, roomMembersController, statsController } from '../controllers/healthController';
import { emitController } from '../controllers/emitController';

export const createRoutes = (context: SocketHttpContext): Router => {
  const router = Router();
  router.get('/health', healthController(context));
  router.get('/stats', statsController(context));
  router.get('/rooms/:room/members', roomMembersController(context));
  router.post('/emit/:event', emitController(context));
  return router;
};
