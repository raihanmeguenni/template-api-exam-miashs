import fetch from "node-fetch";

const API_BASE_URL = "https://api-ugi2pflmha-ew.a.run.app";
const recipesDB = {}; // Stocke les recettes en mémoire

// Route GET /cities/:cityId/infos
export const getCityInfos = async (request, reply) => {
  const { cityId } = request.params;

  try {
    // 🔹 Récupérer les infos de la ville
    const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`);
    if (!cityResponse.ok) {
      return reply.status(404).send({ error: "City not found" });
    }
    const cityData = await cityResponse.json();

    // 🔹 Récupérer les prévisions météo
    const weatherResponse = await fetch(`${API_BASE_URL}/weather/${cityId}`);
    if (!weatherResponse.ok) {
      return reply.status(500).send({ error: "Weather data unavailable" });
    }
    const weatherData = await weatherResponse.json();

    // 🔹 Construire la réponse formatée
    reply.send({
      coordinates: cityData.coordinates,
      population: cityData.population,
      knownFor: cityData.knownFor,
      weatherPredictions: weatherData.predictions,
      recipes: recipesDB[cityId] || [] // Liste des recettes pour cette ville
    });

  } catch (error) {
    reply.status(500).send({ error: "Server error" });
  }
};

// Route POST /cities/:cityId/recipes
export const postRecipe = async (request, reply) => {
  const { cityId } = request.params;
  const { content } = request.body;

  // 🔹 Vérifier le contenu de la recette
  if (!content) return reply.status(400).send({ error: "Recipe content is required" });
  if (content.length < 10) return reply.status(400).send({ error: "Content too short" });
  if (content.length > 2000) return reply.status(400).send({ error: "Content too long" });

  try {
    // 🔹 Vérifier si la ville existe
    const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`);
    if (!cityResponse.ok) return reply.status(404).send({ error: "City not found" });

    // 🔹 Ajouter la recette en mémoire
    const newRecipe = { id: Date.now(), content };
    if (!recipesDB[cityId]) recipesDB[cityId] = [];
    recipesDB[cityId].push(newRecipe);

    reply.status(201).send(newRecipe);
  } catch (error) {
    reply.status(500).send({ error: "Server error" });
  }
};

// Route DELETE /cities/:cityId/recipes/:recipeId
export const deleteRecipe = async (request, reply) => {
  const { cityId, recipeId } = request.params;

  // 🔹 Vérifier si la ville existe dans notre stockage
  if (!recipesDB[cityId]) return reply.status(404).send({ error: "City not found" });

  // 🔹 Vérifier si la recette existe
  const recipeIndex = recipesDB[cityId].findIndex(r => r.id == recipeId);
  if (recipeIndex === -1) return reply.status(404).send({ error: "Recipe not found" });

  // 🔹 Supprimer la recette
  recipesDB[cityId].splice(recipeIndex, 1);
  reply.status(204).send(); // No Content
};
