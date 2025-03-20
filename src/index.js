import 'dotenv/config';
import Fastify from 'fastify';
import routes from './routes.js';
import { submitForReview } from './submission.js';

const fastify = Fastify({ logger: true });

// Définition des routes
fastify.get('/cities/:cityId/infos', routes.getCityInfos);
fastify.post('/cities/:cityId/recipes', routes.postRecipe);
fastify.delete('/cities/:cityId/recipes/:recipeId', routes.deleteRecipe);

// Lancement du serveur
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
    submitForReview(fastify); // Soumission automatique de l'API après le démarrage
  }
);
