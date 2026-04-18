const router  = require('express').Router();
const ctrl    = require('../controllers/hotel.controller');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/',     ctrl.getAll);           // público
router.get('/:id',  ctrl.getById);          // público
router.post('/',    auth, isAdmin, ctrl.create);   // solo admin
router.put('/:id',  auth, isAdmin, ctrl.update);   // solo admin
router.delete('/:id', auth, isAdmin, ctrl.remove); // solo admin

module.exports = router;
