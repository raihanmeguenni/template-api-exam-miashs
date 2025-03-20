import 'dotenv/config';
import Fastify from 'fastify';
import { getCityInfos, postRecipe, deleteRecipe } from './routes.js';
import { submitForReview } from './submission.js';

const fastify = Fastify({ logger: true });

// ✅ Enregistrer toutes les routes API
fastify.get('/cities/:cityId/infos', getCityInfos);
fastify.post('/cities/:cityId/recipes', postRecipe);
fastify.delete('/cities/:cityId/recipes/:recipeId', deleteRecipe);

fastify.listen(
  {
    port: process.env.PORT || 3000,
    host: process.env.RENDER_EXTERNAL_URL ? '0.0.0.0' : process.env.HOST || 'localhost',
  },
  function (err) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }

    // 🔹 NE PAS SUPPRIMER : Soumet l'API pour validation après chaque déploiement
    submitForReview(fastify);
  }
);
