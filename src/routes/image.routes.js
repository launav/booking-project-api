const router = require('express').Router();
const ctrl   = require('../controllers/image.controller');
const { auth, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/',                                        ctrl.getByEntity);          // público (?hotel_id | ?room_id)
router.post('/hotel/:hotel_id', auth, isAdmin, upload.single('image'), ctrl.uploadHotelImage); // admin
router.post('/room/:room_id',   auth, isAdmin, upload.single('image'), ctrl.uploadRoomImage);  // admin
router.delete('/:id',           auth, isAdmin, ctrl.remove);                       // admin

module.exports = router;
