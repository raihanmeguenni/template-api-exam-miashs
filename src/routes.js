const { v4: uuidv4 } = require('uuid');

// Simulated data stores
const groups = [];
const apiKeys = new Map();
const cities = [
  { id: '1', name: 'Paris', country: 'France' },
  { id: '2', name: 'London', country: 'UK' },
  { id: '3', name: 'New York', country: 'USA' },
];

// Authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required'
    });
  }

  const groupExists = apiKeys.has(apiKey);
  if (!groupExists) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

module.exports = (app) => {
  // Group routes
  app.get('/group/lastCheck', (req, res) => {
    const apiKey = req.query.apiKey;
    
    if (apiKey && !apiKeys.has(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: uuidv4(),
        dateStart: new Date().toISOString(),
        dateEnd: new Date(Date.now() + 3600000).toISOString(),
        globalResult: {
          success: true,
          message: 'Group check successful'
        },
        results: {
          getCitiesInfos: {},
          postCityRecipes: {},
          deleteCityRecipe: {}
        }
      }
    });
  });

  app.post('/group/submissions', authenticateApiKey, (req, res) => {
    const { apiUrl } = req.body;
    
    if (!apiUrl) {
      return res.status(400).json({
        error: 'API URL is required'
      });
    }
    
    // Process submission
    return res.status(204).send();
  });

  // Admin routes
  app.post('/admin/generate-groups', (req, res) => {
    const { students } = req.body;
    const updateExisting = req.query.updateExisting === 'true';
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'Students array is required'
      });
    }
    
    let generatedCount = 0;
    let skippedCount = 0;
    
    for (const student of students) {
      const existingGroup = groups.find(g => g.name === student);
      
      if (existingGroup && !updateExisting) {
        skippedCount++;
        continue;
      }
      
      if (existingGroup && updateExisting) {
        existingGroup.apiKey = uuidv4();
        apiKeys.set(existingGroup.apiKey, existingGroup);
        generatedCount++;
      } else {
        const newApiKey = uuidv4();
        const newGroup = { name: student, apiKey: newApiKey };
        groups.push(newGroup);
        apiKeys.set(newApiKey, newGroup);
        generatedCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Generated ${generatedCount} groups, skipped ${skippedCount} groups`,
      generatedCount,
      skippedCount
    });
  });

  app.get('/admin/groups', (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        groups: groups.map(group => ({
          name: group.name,
          apiKey: group.apiKey
        }))
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve groups'
      });
    }
  });

  // Cities routes
  app.get('/cities', (req, res) => {
    const { search, apiKey } = req.query;
    
    if (apiKey && !apiKeys.has(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    try {
      let filteredCities = [...cities];
      
      if (search) {
        filteredCities = filteredCities.filter(city => 
          city.name.toLowerCase().includes(search.toLowerCase()) ||
          city.country.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (filteredCities.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No cities found'
        });
      }
      
      return res.status(200).json(filteredCities);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve cities'
      });
    }
  });

  app.get('/cities/:cityId/insights', (req, res) => {
    const { cityId } = req.params;
    const { apiKey } = req.query;
    
    if (apiKey && !apiKeys.has(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    try {
      const city = cities.find(c => c.id === cityId);
      
      if (!city) {
        return res.status(404).json({
          success: false,
          error: 'City not found'
        });
      }
      
      // Mock data for city insights
      const insights = {
        coordinates: {
          latitude: parseFloat((Math.random() * 180 - 90).toFixed(6)),
          longitude: parseFloat((Math.random() * 360 - 180).toFixed(6))
        },
        population: Math.floor(Math.random() * 15000000) + 100000,
        knownFor: ['Architecture', 'Cuisine', 'History', 'Art']
      };
      
      return res.status(200).json(insights);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve city insights'
      });
    }
  });

  app.get('/weather-predictions', (req, res) => {
    const { cityId, apiKey } = req.query;
    
    if (apiKey && !apiKeys.has(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    try {
      if (cityId && !cities.some(c => c.id === cityId)) {
        return res.status(404).json({
          success: false,
          error: 'City not found'
        });
      }
      
      const targetCities = cityId ? cities.filter(c => c.id === cityId) : cities;
      
      const predictions = targetCities.map(city => {
        const cityPredictions = [];
        const currentDate = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() + i);
          
          cityPredictions.push({
            min: Math.floor(Math.random() * 15) + 5,
            max: Math.floor(Math.random() * 15) + 20,
            when: date.toISOString().split('T')[0]
          });
        }
        
        return {
          cityId: city.id,
          cityName: city.name,
          predictions: cityPredictions
        };
      });
      
      return res.status(200).json(predictions);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve weather predictions'
      });
    }
  });
};