const express = require('express');
const router = express.Router();
const {
  createGroup,
  getAllGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupStats,
  bulkCreateGroups,
  getPaginatedGroups,
  exportGroups
} = require('../controllers/groupController');
const { protect } = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');
const upload = require('../middlewares/upload');
const { groupValidation } = require('../middlewares/validation');

// All routes are protected and admin only
router.use(protect, adminOnly);

// Group routes
router.route('/')
  .post(groupValidation, createGroup)
  .get(getAllGroups);

router.get('/paginated', getPaginatedGroups);
router.get('/export', exportGroups);
router.post('/bulk', upload.single('file'), bulkCreateGroups);
router.get('/:id/stats', getGroupStats);

router.route('/:id')
  .get(getGroup)
  .put(groupValidation, updateGroup)
  .delete(deleteGroup);

module.exports = router;