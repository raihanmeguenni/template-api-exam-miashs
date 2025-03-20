import fetch from 'node-fetch';

const API_BASE_URL = "https://api-ugi2pflmha-ew.a.run.app";
const API_KEY = process.env.API_KEY; // Assurez-vous que cette variable est bien définie
const recipesDB = {}; // Stockage des recettes en mémoire

export default async function routes(fastify) {

  // ✅ Route GET /cities/:cityId/infos
  fastify.get("/cities/:cityId/infos", async (request, reply) => {
    const { cityId } = request.params;

    try {
      // Vérifier si la ville existe
      const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}/insights?apiKey=${API_KEY}`);
      if (!cityResponse.ok) return reply.status(404).send({ error: "City not found" });

      const cityData = await cityResponse.json();

      // Vérifier `coordinates`, `population`, `knownFor`
      const coordinates = cityData.coordinates
        ? [cityData.coordinates.latitude, cityData.coordinates.longitude]
        : [0, 0];

      const population = cityData.population || 0;
      const knownFor = cityData.knownFor || [];

      // Récupérer la météo
      const weatherResponse = await fetch(`${API_BASE_URL}/weather-predictions?cityId=${cityId}&apiKey=${API_KEY}`);
      const weatherPredictions = weatherResponse.ok
        ? (await weatherResponse.json())[0].predictions.slice(0, 2)
        : [{ when: "today", min: 0, max: 0 }, { when: "tomorrow", min: 0, max: 0 }];

      // Assurer que `recipes` est bien un tableau
      const recipes = recipesDB[cityId] || [];

      // Réponse formatée
      reply.send({
        coordinates,
        population,
        knownFor,
        weatherPredictions,
        recipes,
      });

    } catch (error) {
      reply.status(500).send({ error: "Server error" });
    }
  });

  // ✅ Route POST /cities/:cityId/recipes
  fastify.post("/cities/:cityId/recipes", async (request, reply) => {
    const { cityId } = request.params;
    const { content } = request.body;

    // Vérifications des erreurs
    if (!content) return reply.status(400).send({ error: "Recipe content is required" });
    if (content.length < 10) return reply.status(400).send({ error: "Content too short" });
    if (content.length > 2000) return reply.status(400).send({ error: "Content too long" });

    try {
      // Vérifier si la ville existe
      const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}/insights?apiKey=${API_KEY}`);
      if (!cityResponse.ok) return reply.status(404).send({ error: "City not found" });

      if (!recipesDB[cityId]) recipesDB[cityId] = [];
      const newRecipe = { id: recipesDB[cityId].length + 1, content };
      recipesDB[cityId].push(newRecipe);

      reply.status(201).send(newRecipe);

    } catch (error) {
      reply.status(500).send({ error: "Server error" });
    }
  });

  // ✅ Route DELETE /cities/:cityId/recipes/:recipeId
  fastify.delete("/cities/:cityId/recipes/:recipeId", async (request, reply) => {
    const { cityId, recipeId } = request.params;

    if (!recipesDB[cityId]) return reply.status(404).send({ error: "City not found" });

    const recipeIndex = recipesDB[cityId].findIndex((r) => r.id == recipeId);
    if (recipeIndex === -1) return reply.status(404).send({ error: "Recipe not found" });

    recipesDB[cityId].splice(recipeIndex, 1);
    reply.status(204).send();
  });
}
