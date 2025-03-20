import "dotenv/config";
import Fastify from "fastify";
import { submitForReview } from "./submission.js";
import fetch from "node-fetch";

const fastify = Fastify({ logger: true });

const API_BASE_URL = "https://api-ugi2pflmha-ew.a.run.app";
const recipesDB = {}; // Stockage des recettes en mémoire

// Route GET /cities/:cityId/infos
fastify.get("/cities/:cityId/infos", async (request, reply) => {
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
      recipes: recipesDB[cityId] || [],
    });
  } catch (error) {
    reply.status(500).send({ error: "Server error" });
  }
});

// Route POST /cities/:cityId/recipes
fastify.post("/cities/:cityId/recipes", async (request, reply) => {
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
});

// Route DELETE /cities/:cityId/recipes/:recipeId
fastify.delete("/cities/:cityId/recipes/:recipeId", async (request, reply) => {
  const { cityId, recipeId } = request.params;

  // 🔹 Vérifier si la ville existe
  if (!recipesDB[cityId]) return reply.status(404).send({ error: "City not found" });

  // 🔹 Vérifier si la recette existe
  const recipeIndex = recipesDB[cityId].findIndex((r) => r.id == recipeId);
  if (recipeIndex === -1) return reply.status(404).send({ error: "Recipe not found" });

  // 🔹 Supprimer la recette
  recipesDB[cityId].splice(recipeIndex, 1);
  reply.status(204).send(); // No Content
});

// Lancement du serveur
fastify.listen(
  {
    port: process.env.PORT || 3000,
    host: process.env.RENDER_EXTERNAL_URL ? "0.0.0.0" : process.env.HOST || "localhost",
  },
  function (err) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }

    //////////////////////////////////////////////////////////////////////
    // Don't delete this line, it is used to submit your API for review //
    // everytime your start your server.                                //
    //////////////////////////////////////////////////////////////////////
    submitForReview(fastify);
  }
);
