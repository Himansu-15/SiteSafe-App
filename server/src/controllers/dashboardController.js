import { Incident } from '../models/Incident.js';
import { Action } from '../models/Action.js';

import mongoose from 'mongoose';

export async function getDashboardSummary(req, res, next) {
  try {
    const orgId = new mongoose.Types.ObjectId(req.user.orgId);

    // Pipeline 1: Incidents by Severity
    // $match: Filter incidents for the current organization.
    // $group: Group documents by the 'severity' field and count them.
    const severityPipeline = [
      { $match: { orgId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ];

    // Pipeline 2: Trend Over Time (Incidents per month)
    // $match: Filter by orgId.
    // $group: Format createdAt date to 'YYYY-MM' and count incidents per month.
    // $sort: Order the results chronologically.
    const trendPipeline = [
      { $match: { orgId } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ];

    // Pipeline 3: Top Sites with Most Incidents
    // $match: Filter by orgId.
    // $group: Group by siteId and count.
    // $sort: Order descending by count.
    // $limit: Return only the top 5 sites.
    const topSitesPipeline = [
      { $match: { orgId } },
      { $group: { _id: '$siteId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ];

    // Execute Incident pipelines concurrently
    const [incidentsBySeverity, trendOverTime, topSites] = await Promise.all([
      Incident.aggregate(severityPipeline),
      Incident.aggregate(trendPipeline),
      Incident.aggregate(topSitesPipeline)
    ]);

    // Pipeline 4: Overdue Actions
    // $match: Filter by orgId, status not 'done', and dueDate in the past.
    // $count: Simply count the matching documents.
    const overdueActionsPipeline = [
      { 
        $match: { 
          orgId, 
          status: { $ne: 'done' }, 
          dueDate: { $lt: new Date() } 
        } 
      },
      { $count: 'overdueCount' }
    ];
    
    const overdueResult = await Action.aggregate(overdueActionsPipeline);
    const overdueActions = overdueResult.length > 0 ? overdueResult[0].overdueCount : 0;

    res.json({
      status: 'success',
      data: {
        incidentsBySeverity,
        trendOverTime,
        topSites,
        overdueActions,
      },
    });
  } catch (error) {
    next(error);
  }
}
