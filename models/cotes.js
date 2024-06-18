const mongoose = require('mongoose');

const CombatantSchema = new mongoose.Schema({
     name: {
          type: String,
          required: true,
     },
     odds: {
          unibet: {
               type: Number,
               required: true,
          },
          betclic: {
               type: Number,
               required: true,
          },
          parions_sports: {
               type: Number,
               required: true,
          },
     },
});

module.exports = mongoose.model('Combatant', CombatantSchema);
