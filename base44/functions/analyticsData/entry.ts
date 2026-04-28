import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // 1. Get list of accounts first, then properties
    const accountsRes = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accountsData = await accountsRes.json();

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      return Response.json({ error: 'No GA4 accounts found', detail: accountsData }, { status: 404 });
    }

    const accountName = accountsData.accounts[0].name; // e.g. "accounts/123"

    const propertiesRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${accountName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const propertiesData = await propertiesRes.json();

    if (!propertiesData.properties || propertiesData.properties.length === 0) {
      return Response.json({ error: 'No GA4 properties found', detail: propertiesData }, { status: 404 });
    }

    // Use first property
    const propertyId = propertiesData.properties[0].name; // e.g. "properties/123456"

    // 2. Get active users right now (realtime)
    const realtimeRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
        }),
      }
    );
    const realtimeData = await realtimeRes.json();

    // 3. Get last 30 days session trends
    const trendsRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'bounceRate' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
      }
    );
    const trendsData = await trendsRes.json();

    // 4. Get summary totals for last 7 days vs previous 7 days
    const summaryRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [
            { startDate: '7daysAgo', endDate: 'today', name: 'current' },
            { startDate: '14daysAgo', endDate: '8daysAgo', name: 'previous' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'screenPageViews' },
          ],
        }),
      }
    );
    const summaryData = await summaryRes.json();

    // Parse realtime active users total
    let realtimeActiveUsers = 0;
    let realtimeByCountry = [];
    if (realtimeData.rows) {
      realtimeData.rows.forEach(row => {
        const count = parseInt(row.metricValues[0].value) || 0;
        realtimeActiveUsers += count;
        realtimeByCountry.push({
          country: row.dimensionValues[0].value,
          users: count,
        });
      });
    }

    // Parse trends
    const trends = (trendsData.rows || []).map(row => {
      const dateStr = row.dimensionValues[0].value; // YYYYMMDD
      const formatted = `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}`;
      return {
        date: formatted,
        sessions: parseInt(row.metricValues[0].value) || 0,
        users: parseInt(row.metricValues[1].value) || 0,
        bounceRate: parseFloat((parseFloat(row.metricValues[2].value) * 100).toFixed(1)),
      };
    });

    // Parse summary
    let currentSummary = { sessions: 0, users: 0, avgDuration: 0, pageViews: 0 };
    let previousSummary = { sessions: 0, users: 0, avgDuration: 0, pageViews: 0 };
    if (summaryData.rows) {
      summaryData.rows.forEach(row => {
        const rangeName = row.dimensionValues ? row.dimensionValues[0]?.value : null;
        const target = rangeName === 'previous' ? previousSummary : currentSummary;
        target.sessions += parseInt(row.metricValues[0].value) || 0;
        target.users += parseInt(row.metricValues[1].value) || 0;
        target.avgDuration += parseFloat(row.metricValues[2].value) || 0;
        target.pageViews += parseInt(row.metricValues[3].value) || 0;
      });
    }

    return Response.json({
      propertyId,
      propertyName: propertiesData.properties[0].displayName || propertyId,
      realtimeActiveUsers,
      realtimeByCountry: realtimeByCountry.slice(0, 5),
      trends,
      currentSummary,
      previousSummary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});