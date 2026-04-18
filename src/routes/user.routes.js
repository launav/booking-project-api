const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { auth, isAdmin } = require('../middlewares/auth');

router.get('/',     auth, isAdmin, ctrl.getAll);          // admin: todos los usuarios
router.get('/:id',  auth, ctrl.getById);                  // admin | propio usuario
router.put('/:id',  auth, ctrl.update);                   // admin | propio usuario
router.delete('/:id', auth, isAdmin, ctrl.remove);        // solo admin

module.exports = router;
