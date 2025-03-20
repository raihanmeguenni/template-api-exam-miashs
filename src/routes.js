import fetch from "node-fetch";

const API_BASE_URL = "https://api-ugi2pflmha-ew.a.run.app";
const recipesDB = {}; // Base en mémoire pour stocker les recettes

// ✅ Route GET /cities/:cityId/infos
export const getCityInfos = async (request, reply) => {
  const { cityId } = request.params;

  try {
    // 🔹 Vérifier si la ville existe
    const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`);
    if (!cityResponse.ok) {
      return reply.status(404).send({ error: "City not found" });
    }
    const cityData = await cityResponse.json();

    // 🔹 Vérifier les données de la ville
    const coordinates = Array.isArray(cityData.coordinates) ? cityData.coordinates : [0, 0];
    const population = typeof cityData.population === "number" ? cityData.population : 0;
    const knownFor = Array.isArray(cityData.knownFor) ? cityData.knownFor : [];

    // 🔹 Récupérer les prévisions météo
    const weatherResponse = await fetch(`${API_BASE_URL}/weather/${cityId}`);
    let weatherPredictions = [
      { when: "today", min: 0, max: 0 },
      { when: "tomorrow", min: 0, max: 0 }
    ];

    if (weatherResponse.ok) {
      const weatherData = await weatherResponse.json();
      weatherPredictions = Array.isArray(weatherData.predictions) && weatherData.predictions.length >= 2
        ? weatherData.predictions.slice(0, 2)
        : weatherPredictions;
    }

    // 🔹 Assurer que `recipes` est un tableau vide si aucune recette
    const recipes = recipesDB[cityId] || [];

    // 🔹 Envoyer la réponse formatée
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
};

// ✅ Route POST /cities/:cityId/recipes
export const postRecipe = async (request, reply) => {
  const { cityId } = request.params;
  const { content } = request.body;

  if (!content) return reply.status(400).send({ error: "Recipe content is required" });
  if (content.length < 10) return reply.status(400).send({ error: "Content too short" });
  if (content.length > 2000) return reply.status(400).send({ error: "Content too long" });

  try {
    // Vérifier si la ville existe
    const cityResponse = await fetch(`${API_BASE_URL}/cities/${cityId}`);
    if (!cityResponse.ok) return reply.status(404).send({ error: "City not found" });

    if (!recipesDB[cityId]) recipesDB[cityId] = [];
    const newRecipe = { id: recipesDB[cityId].length + 1, content };
    recipesDB[cityId].push(newRecipe);

    reply.status(201).send(newRecipe);

  } catch (error) {
    reply.status(500).send({ error: "Server error" });
  }
};

// ✅ Route DELETE /cities/:cityId/recipes/:recipeId
export const deleteRecipe = async (request, reply) => {
  const { cityId, recipeId } = request.params;

  if (!recipesDB[cityId]) return reply.status(404).send({ error: "City not found" });

  const recipeIndex = recipesDB[cityId].findIndex((r) => r.id == recipeId);
  if (recipeIndex === -1) return reply.status(404).send({ error: "Recipe not found" });

  recipesDB[cityId].splice(recipeIndex, 1);
  reply.status(204).send();
};
