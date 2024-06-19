const cron = require('node-cron');
const { chromium } = require('playwright');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

// Configurez l'URL de votre proxy résidentiel
const proxyUrl = process.env.URL_PROXY;

const testUrl = 'https://ip.smartproxy.com/json'; // URL de test pour vérifier le proxy
const url = 'https://www.unibet.fr/sport/mma';
const apiUrl = 'https://mma-api-fr-1304d5fba742.herokuapp.com/update-cotes';

async function scrape() {
     const proxyAgent = new HttpsProxyAgent(proxyUrl);

     // Vérifier l'accessibilité de la page de test via le proxy
     try {
          const testResponse = await axios.get(testUrl, {
               httpsAgent: proxyAgent,
          });
          console.log('Test Proxy Response:', testResponse.data);
     } catch (error) {
          console.error(
               "Erreur lors de l'accès à la page de test via le proxy:",
               error.message
          );
          return;
     }

     const browser = await chromium.launch({
          headless: true,
          proxy: {
               server: proxyUrl,
          },
     });
     const page = await browser.newPage();

     // Ajoutez des en-têtes HTTP
     await page.setExtraHTTPHeaders({
          'User-Agent':
               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Accept-Language': 'en-US,en;q=0.9',
     });

     try {
          await page.goto(url, { waitUntil: 'networkidle' });
          console.log('Page chargée avec succès');

          // Attendre que l'élément #container soit chargé
          await page.waitForSelector('#container', { timeout: 90000 });
          console.log('Élément #container trouvé');

          // Fonction pour faire défiler la page vers le bas
          async function autoScroll(page) {
               await page.evaluate(async () => {
                    await new Promise((resolve) => {
                         var totalHeight = 0;
                         var distance = 100;
                         var timer = setInterval(() => {
                              var scrollHeight = document.body.scrollHeight;
                              window.scrollBy(0, distance);
                              totalHeight += distance;

                              if (totalHeight >= scrollHeight) {
                                   clearInterval(timer);
                                   resolve();
                              }
                         }, 100);
                    });
               });
          }

          // Faire défiler la page pour charger tous les éléments
          await autoScroll(page);

          // Extraire les noms des combattants avec les balises <br> si elles existent
          const fighters = await page.evaluate(() => {
               const results = [];
               const elements = document.querySelectorAll(
                    '.eventcard--toplight'
               );

               elements.forEach((element) => {
                    const getFighterNameWithBr = (element) => {
                         if (!element) return null;
                         return element.innerHTML
                              .trim()
                              .replace(/<br>/g, '<br>');
                    };

                    const fighterNameElement = element.querySelector(
                         '.eventcard-content .eventcard-odds > section > section:first-child .oddbox-label span'
                    );
                    const fighterNameElementRight = element.querySelector(
                         '.eventcard-content .eventcard-odds > section > section:nth-child(2) .oddbox-label span'
                    );
                    const oddsElementRight = element.querySelector(
                         '.eventcard-content .eventcard-odds > section > section:nth-child(2) .oddbox-value span'
                    );
                    const oddsElement = element.querySelector(
                         '.eventcard-content .eventcard-odds > section > section:first-child .oddbox-value span'
                    );
                    if (fighterNameElement && oddsElement) {
                         results.push({
                              name: getFighterNameWithBr(fighterNameElement),
                              odds: oddsElement.textContent.trim(),
                         });
                         results.push({
                              name: getFighterNameWithBr(
                                   fighterNameElementRight
                              ),
                              odds: oddsElementRight.textContent.trim(),
                         });
                    }
               });

               return results;
          });

          console.log('Noms des combattants :', fighters);

          await browser.close();

          // Envoyer le tableau des cotes à l'API
          try {
               const response = await axios.put(
                    apiUrl,
                    { fighters },
                    { httpsAgent: proxyAgent }
               );
               console.log('Cotes mises à jour avec succès:', response.data);
          } catch (error) {
               console.error(
                    'Erreur lors de la mise à jour des cotes:',
                    error.message
               );
          }
     } catch (error) {
          console.error('Erreur lors du chargement de la page:', error.message);

          // Afficher le contenu HTML de la page en cas d'erreur
          const errorPageContent = await page.content();
          console.log(
               "Contenu HTML de la page en cas d'erreur:",
               errorPageContent
          );

          await browser.close();
     }
}

// Planification cron pour exécuter le scraping toutes les heures
cron.schedule('0 * * * *', () => {
     console.log('Lancement de la tâche cron de scraping à', new Date());
     scrape();
});

console.log(
     'Tâche cron configurée pour exécuter le scraping toutes les heures.'
);
