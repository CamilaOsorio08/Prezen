import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { soloRol } from '../middlewares/roles.middleware.js';
import {
  assignCoordinator,
  createEnrollment,
  createGroup,
  createUser,
  listCoordinators,
  listEnrollments,
  listGroups,
  listUsers,
  removeCoordinator,
  rotateEnrollmentQr,
  updateEnrollment,
  updateGroup,
  updateUser,
} from '../controllers/admin-management.controller.js';

export const adminManagementRouter = Router();
adminManagementRouter.use(authMiddleware, soloRol('admin'));

adminManagementRouter.get('/users', listUsers);
adminManagementRouter.post('/users', createUser);
adminManagementRouter.patch('/users/:id', updateUser);
adminManagementRouter.get('/groups', listGroups);
adminManagementRouter.post('/groups', createGroup);
adminManagementRouter.patch('/groups/:id', updateGroup);
adminManagementRouter.get('/groups/:id/coordinators', listCoordinators);
adminManagementRouter.post('/groups/:id/coordinators', assignCoordinator);
adminManagementRouter.delete('/groups/:id/coordinators/:coordinatorId', removeCoordinator);
adminManagementRouter.get('/enrollments', listEnrollments);
adminManagementRouter.post('/enrollments', createEnrollment);
adminManagementRouter.patch('/enrollments/:id', updateEnrollment);
adminManagementRouter.post('/enrollments/:id/qr', rotateEnrollmentQr);
