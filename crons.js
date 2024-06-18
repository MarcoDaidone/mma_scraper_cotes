const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Chemin vers votre script scrape.js
const scrapeScript = path.join(__dirname, 'scrape.js');

// Configurer une tâche cron pour s'exécuter toutes les heures
cron.schedule('0 * * * *', () => {
     console.log('Lancement de scrape.js');

     exec(`node ${scrapeScript}`, (error, stdout, stderr) => {
          if (error) {
               console.error(
                    `Erreur lors de l'exécution de scrape.js: ${error.message}`
               );
               return;
          }

          if (stderr) {
               console.error(`Erreur dans scrape.js: ${stderr}`);
               return;
          }

          console.log(`Sortie de scrape.js: ${stdout}`);
     });
});

console.log('Tâche cron configurée pour exécuter scrape.js toutes les heures');
