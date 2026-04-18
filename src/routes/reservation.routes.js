const router = require('express').Router();
const ctrl   = require('../controllers/reservation.controller');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/',           auth, isAdmin, ctrl.getAll);         // admin: todas las reservas
router.get('/my',         auth, ctrl.getMine);                  // cliente: sus reservas
router.get('/:id',        auth, ctrl.getById);                  // admin | propio cliente
router.post('/',          auth, ctrl.create);                   // cliente crea reserva
router.patch('/:id/status', auth, isAdmin, ctrl.updateStatus);  // admin cambia estado
router.delete('/:id',     auth, ctrl.remove);                   // cliente cancela la suya | admin cualquiera

module.exports = router;
