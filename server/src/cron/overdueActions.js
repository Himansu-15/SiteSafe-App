import cron from 'node-cron';
import { Action } from '../models/Action.js';
import { AuditLog } from '../models/AuditLog.js';
import { emitToOrg } from '../socket.js';

// Run every day at midnight
export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily overdue actions check...');
    try {
      const now = new Date();
      
      const overdueActions = await Action.find({
        status: 'open',
        dueDate: { $lt: now }
      }).populate('incidentId', 'title');

      for (const action of overdueActions) {
        action.status = 'overdue';
        await action.save();

        // Log the system-driven transition
        await AuditLog.create({
          entityType: 'Action',
          entityId: action._id,
          actorId: null, // System
          field: 'status',
          oldValue: 'open',
          newValue: 'overdue',
        });

        // Notify the specific organization
        emitToOrg(action.orgId, 'action_overdue', {
          actionId: action._id,
          incidentTitle: action.incidentId?.title,
          message: `An action assigned to ${action.assignedTo} is now overdue.`,
        });
      }
      
      if (overdueActions.length > 0) {
        console.log(`Marked ${overdueActions.length} actions as overdue.`);
      }
    } catch (error) {
      console.error('Error in overdue actions cron job:', error);
    }
  });
};
