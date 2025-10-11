export async function POST(request) {
    try {
      const { start, end, waypoints } = await request.json();
  
      // Validate input
      if (!start?.lat || !start?.lon || !end?.lat || !end?.lon) {
        return Response.json(
          { error: 'Missing required coordinates' },
          { status: 400 }
        );
      }
  
      const apiKey = process.env.MAPPLS_REST_KEY || "f6cc67d011fd246c37345dbaac88f334";
      
      if (!apiKey) {
        return Response.json(
          { error: 'API key not configured' },
          { status: 500 }
        );
      }
  
      // Normalize and validate start coordinates
      const startLon = Number(String(start.lon).trim());
      const startLat = Number(String(start.lat).trim());
      const endLon = Number(String(end.lon).trim());
      const endLat = Number(String(end.lat).trim());

      if ([startLon, startLat, endLon, endLat].some((v) => Number.isNaN(v))) {
        return Response.json(
          { error: 'Invalid start or end coordinates' },
          { status: 400 }
        );
      }

      // Build coordinates array: start, waypoints (if any), end
      const coordsArray = [`${startLon},${startLat}`];
      
      // Add waypoints if they exist
      if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
        for (const waypoint of waypoints) {
          if (!waypoint?.lat || !waypoint?.lon) {
            return Response.json(
              { error: 'Invalid waypoint coordinates' },
              { status: 400 }
            );
          }
          
          const wpLon = Number(String(waypoint.lon).trim());
          const wpLat = Number(String(waypoint.lat).trim());
          
          if (Number.isNaN(wpLon) || Number.isNaN(wpLat)) {
            return Response.json(
              { error: 'Invalid waypoint coordinates' },
              { status: 400 }
            );
          }
          
          coordsArray.push(`${wpLon},${wpLat}`);
        }
      }
      
      // Add end coordinates
      coordsArray.push(`${endLon},${endLat}`);
      
      // Join all coordinates with semicolons
      const coords = coordsArray.join(';');
      const encodedCoords = encodeURIComponent(coords);
      
      const params = new URLSearchParams({
        geometries: 'polyline',
        overview: 'full',
        steps: 'false',
      });

      const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/route_adv/driving/${encodedCoords}?${params.toString()}`;
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': 'http://localhost:3000',
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MapmyIndia API error:', response.status, errorText);
        return Response.json(
          { error: 'Failed to fetch route', details: errorText },
          { status: response.status }
        );
      }
  
      const data = await response.json();
      console.log(data);
      return Response.json(data);
  
    } catch (error) {
      console.error('Route API error:', error);
      return Response.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  }