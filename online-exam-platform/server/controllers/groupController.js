const Group = require('../models/Group');
const Student = require('../models/Student');
const logger = require('../utils/logger');

// @desc    Create new group
// @route   POST /api/groups
// @access  Private (Admin only)
const createGroup = async (req, res) => {
  try {
    const { groupName, year, batch, section, description } = req.body;

    // Check if group already exists
    const existingGroup = await Group.findOne({
      groupName,
      year,
      batch,
      section
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group with these details already exists'
      });
    }

    const group = await Group.create({
      groupName,
      year,
      batch,
      section,
      description
    });

    logger.info(`Group created: ${groupName}`);

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    logger.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group'
    });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private (Admin only)
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    logger.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private (Admin only)
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('students');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    logger.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group'
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
const updateGroup = async (req, res) => {
  try {
    const { groupName, year, batch, section, description } = req.body;

    // Check if group exists
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check for duplicate if name/year/batch/section changed
    if (groupName !== group.groupName || year !== group.year || 
        batch !== group.batch || section !== group.section) {
      
      const existingGroup = await Group.findOne({
        groupName,
        year,
        batch,
        section,
        _id: { $ne: req.params.id }
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Another group with these details already exists'
        });
      }
    }

    // Update group
    group = await Group.findByIdAndUpdate(
      req.params.id,
      {
        groupName,
        year,
        batch,
        section,
        description
      },
      {
        new: true,
        runValidators: true
      }
    );

    logger.info(`Group updated: ${group.groupName}`);

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    logger.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating group'
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Admin only)
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if group has students
    const studentCount = await Student.countDocuments({ group: req.params.id });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete group with assigned students. Please reassign or delete students first.'
      });
    }

    await group.deleteOne();

    logger.info(`Group deleted: ${group.groupName}`);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    logger.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting group'
    });
  }
};

// @desc    Get group statistics
// @route   GET /api/groups/:id/stats
// @access  Private (Admin only)
const getGroupStats = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get student count
    const studentCount = await Student.countDocuments({ group: req.params.id });

    // Get active students (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeStudents = await Student.countDocuments({
      group: req.params.id,
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get exam statistics for this group
    const ExamAssignment = require('../models/ExamAssignment');
    const examStats = await ExamAssignment.aggregate([
      {
        $match: { group: group._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        groupName: group.groupName,
        totalStudents: studentCount,
        activeStudents,
        examStats: examStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    logger.error('Get group stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group statistics'
    });
  }
};

// @desc    Bulk create groups from Excel/CSV
// @route   POST /api/groups/bulk
// @access  Private (Admin only)
const bulkCreateGroups = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      successful: [],
      failed: [],
      total: data.length
    };

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.GroupName || !row.Year || !row.Batch || !row.Section) {
          results.failed.push({
            data: row,
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check for duplicate
        const existingGroup = await Group.findOne({
          groupName: row.GroupName,
          year: row.Year,
          batch: row.Batch,
          section: row.Section
        });

        if (existingGroup) {
          results.failed.push({
            data: row,
            reason: 'Group already exists'
          });
          continue;
        }

        // Create group
        const group = await Group.create({
          groupName: row.GroupName,
          year: row.Year,
          batch: row.Batch,
          section: row.Section,
          description: row.Description || ''
        });

        results.successful.push({
          id: group._id,
          name: group.groupName
        });
      } catch (error) {
        results.failed.push({
          data: row,
          reason: error.message
        });
      }
    }

    logger.info(`Bulk group creation completed. Success: ${results.successful.length}, Failed: ${results.failed.length}`);

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.successful.length} groups`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk create groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk creating groups'
    });
  }
};

// @desc    Get groups with pagination and filters
// @route   GET /api/groups/paginated
// @access  Private (Admin only)
const getPaginatedGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { groupName: { $regex: search, $options: 'i' } },
        { year: { $regex: search, $options: 'i' } },
        { batch: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Get total count
    const total = await Group.countDocuments(searchQuery);

    // Get groups with student count
    const groups = await Group.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'group',
          as: 'students'
        }
      },
      {
        $addFields: {
          studentCount: { $size: '$students' }
        }
      },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          students: 0 // Remove students array from response
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get paginated groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
};

// @desc    Export groups to CSV/Excel
// @route   GET /api/groups/export
// @access  Private (Admin only)
const exportGroups = async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const groups = await Group.find().sort('-createdAt').lean();

    // Get student counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const studentCount = await Student.countDocuments({ group: group._id });
        return {
          ...group,
          studentCount
        };
      })
    );

    const fields = [
      'groupName',
      'year',
      'batch',
      'section',
      'studentCount',
      'description',
      'createdAt'
    ];

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(groupsWithCounts);

      res.header('Content-Type', 'text/csv');
      res.attachment(`groups_export_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(groupsWithCounts, { header: fields });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Groups');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`groups_export_${Date.now()}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error('Export groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting groups'
    });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupStats,
  bulkCreateGroups,
  getPaginatedGroups,
  exportGroups
};