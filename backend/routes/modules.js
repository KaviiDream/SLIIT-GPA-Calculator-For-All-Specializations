const express = require('express');
const Module = require('../models/Module');
const Specialization = require('../models/Specialization');

const router = express.Router();

// Get all common modules for years 1 & 2
router.get('/common', async (req, res) => {
  try {
    const modules = await Module.find({
      year: { $in: [1, 2] },
      isCommon: true
    }).sort({ year: 1, semester: 1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all specializations
router.get('/specializations', async (req, res) => {
  try {
    const specializations = await Specialization.find().select('-__v');
    res.json(specializations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get modules for a specific specialization
router.get('/specialization/:code', async (req, res) => {
  try {
    const specialization = await Specialization.findOne({
      specializationCode: req.params.code
    }).populate('year3Modules year4Modules');
    
    if (!specialization) {
      return res.status(404).json({ error: 'Specialization not found' });
    }
    
    res.json({
      year3Modules: specialization.year3Modules,
      year4Modules: specialization.year4Modules
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new module document.
router.post('/', async (req, res, next) => {
	try {
		const moduleDoc = await Module.create(req.body);
		res.status(201).json(moduleDoc);
	} catch (error) {
		next(error);
	}
});

// Update an existing module.
router.put('/:id', async (req, res, next) => {
	try {
		const updatedModule = await Module.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		});

		if (!updatedModule) {
			return res.status(404).json({ message: 'Module not found' });
		}

		res.json(updatedModule);
	} catch (error) {
		next(error);
	}
});

// Remove a module.
router.delete('/:id', async (req, res, next) => {
	try {
		const deletedModule = await Module.findByIdAndDelete(req.params.id);

		if (!deletedModule) {
			return res.status(404).json({ message: 'Module not found' });
		}

		res.status(204).end();
	} catch (error) {
		next(error);
	}
});

module.exports = router;
