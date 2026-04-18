const router = require('express').Router();
const ctrl   = require('../controllers/room.controller');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/',     ctrl.getAll);                      // público (?hotel_id=1)
router.get('/:id',  ctrl.getById);                     // público
router.post('/',    auth, isAdmin, ctrl.create);        // solo admin
router.put('/:id',  auth, isAdmin, ctrl.update);        // solo admin
router.delete('/:id', auth, isAdmin, ctrl.remove);      // solo admin

module.exports = router;
