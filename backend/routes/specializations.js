const express = require('express');
const mongoose = require('mongoose');
const Module = require('../models/Module');
const Specialization = require('../models/Specialization');

const router = express.Router();

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeCodeValue = (value = '') => value && typeof value === 'string'
  ? value.trim().toUpperCase()
  : '';
const toComparable = (value = '') => value
  ? value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  : '';

const normalizeCodes = (input) => {
  if (!input && input !== 0) return [];

  const toList = (value) => {
    if (Array.isArray(value)) return value.flatMap(toList);
    if (typeof value === 'string' || typeof value === 'number') {
      return value
        .toString()
        .split(',')
        .map(segment => segment.trim())
        .filter(Boolean);
    }
    return [];
  };

  return toList(input)
    .map(code => normalizeCodeValue(code))
    .filter(Boolean);
};

const buildSpecializationCode = (payload = {}) => {
  if (payload.specializationCode) {
    return normalizeCodeValue(payload.specializationCode);
  }

  const source = payload.name || payload.specializationNamme;
  if (!source) return undefined;

  const letters = source
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  return letters || undefined;
};

const sanitizeSpecializationPayload = (payload = {}) => {
  const sanitized = { ...payload };
  const derivedName = payload.name || payload.specializationNamme;

  if (derivedName && !payload.name) {
    sanitized.name = derivedName.trim();
  }

  if (!payload.specializationNamme && derivedName) {
    sanitized.specializationNamme = derivedName.trim();
  }

  const code = buildSpecializationCode({
    specializationCode: payload.specializationCode,
    name: sanitized.name,
    specializationNamme: sanitized.specializationNamme
  });

  if (code) {
    sanitized.specializationCode = code;
  }

  sanitized.year3Modules = normalizeCodes(payload.year3Modules);

  const normalizedYear4Compulsory = normalizeCodes(payload.year4Compulsory);
  const normalizedLegacyYear4 = normalizeCodes(payload.year4Modules);
  const normalizedYear4Electives = normalizeCodes(payload.year4Electives);

  sanitized.year4Compulsory = normalizedYear4Compulsory.length
    ? normalizedYear4Compulsory
    : normalizedLegacyYear4;
  sanitized.year4Electives = normalizedYear4Electives;

  return sanitized;
};

const transformSpecialization = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  const name = plain.name || plain.specializationNamme || plain.specializationCode || 'Unnamed Specialization';
  const code = plain.specializationCode || buildSpecializationCode(plain) || plain._id?.toString();

  const normalizedYear3 = normalizeCodes(plain.year3Modules);
  const normalizedYear4Compulsory = normalizeCodes(plain.year4Compulsory);
  const normalizedYear4Electives = normalizeCodes(plain.year4Electives);
  const normalizedLegacyYear4 = normalizeCodes(plain.year4Modules);

  const dedupedYear4 = (list = []) => Array.from(new Set(list));
  const year4Modules = normalizedLegacyYear4.length
    ? normalizedLegacyYear4
    : dedupedYear4([
        ...normalizedYear4Compulsory,
        ...normalizedYear4Electives
      ]);

  return {
    ...plain,
    name,
    specializationNamme: plain.specializationNamme || name,
    specializationCode: code,
    year3Modules: normalizedYear3,
    year4Compulsory: normalizedYear4Compulsory,
    year4Electives: normalizedYear4Electives,
    year4Modules
  };
};

const findSpecializationByIdentifier = async (identifierRaw = '') => {
  const trimmed = identifierRaw.trim();
  if (!trimmed) return null;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Specialization.findById(trimmed).lean();
    if (byId) return byId;
  }

  const normalizedCode = normalizeCodeValue(trimmed);
  if (normalizedCode) {
    const byCode = await Specialization.findOne({
      $or: [
        { specializationCode: normalizedCode },
        { specializationCode: trimmed }
      ]
    }).lean();
    if (byCode) return byCode;
  }

  const escaped = escapeRegex(trimmed);
  const condensed = trimmed.replace(/\s+/g, '');
  const regexCandidates = [
    new RegExp(escaped, 'i'),
    condensed ? new RegExp(escapeRegex(condensed), 'i') : null
  ].filter(Boolean);

  for (const regex of regexCandidates) {
    const byName = await Specialization.findOne({
      $or: [
        { name: regex },
        { specializationNamme: regex }
      ]
    }).lean();

    if (byName) {
      return byName;
    }
  }

  const allSpecs = await Specialization.find().lean();
  const comparableIdentifier = toComparable(trimmed);

  return allSpecs.find(spec => {
    return [spec.specializationCode, spec.name, spec.specializationNamme]
      .some(value => toComparable(value) === comparableIdentifier);
  }) || null;
};

const fetchModulesByCodes = async (codes = [], year) => {
  const normalizedCodes = normalizeCodes(codes);
  if (!normalizedCodes.length) return [];

  const modules = [];

  for (const code of normalizedCodes) {
    const doc = await Module.findOne({
      moduleCode: new RegExp(`^${escapeRegex(code)}$`, 'i')
    }).lean();

    modules.push(doc || {
      moduleCode: code,
      moduleName: `Module ${code}`,
      credits: 0,
      year,
      semester: null,
      placeholder: true
    });
  }

  return modules;
};

// Get all specializations
router.get('/', async (req, res) => {
  try {
    const specializations = await Specialization.find().select('-__v').lean();
    const normalized = specializations.map(transformSpecialization);
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get modules for a specific specialization
router.get('/:identifier/modules', async (req, res) => {
  try {
    const identifierRaw = req.params.identifier?.trim();
    if (!identifierRaw) {
      return res.status(400).json({ error: 'Specialization identifier is required' });
    }

    const specialization = await findSpecializationByIdentifier(identifierRaw);

    if (!specialization) {
      return res.status(404).json({ error: 'Specialization not found' });
    }

    const year3Codes = normalizeCodes(specialization.year3Modules);
    const year4CompulsoryCodes = normalizeCodes(specialization.year4Compulsory);
    const year4ElectiveCodes = normalizeCodes(specialization.year4Electives);
    const legacyYear4Codes = normalizeCodes(specialization.year4Modules);

    const hasCategorizedYear4 = year4CompulsoryCodes.length > 0 || year4ElectiveCodes.length > 0;
    const resolvedYear4CompulsoryCodes = hasCategorizedYear4
      ? year4CompulsoryCodes
      : legacyYear4Codes;
    const resolvedYear4ElectiveCodes = hasCategorizedYear4
      ? year4ElectiveCodes
      : [];

    console.log('[specializations] modules request', {
      identifier: identifierRaw,
      specializationId: specialization._id?.toString(),
      year3Count: year3Codes.length,
      year4CompulsoryCount: resolvedYear4CompulsoryCodes.length,
      year4ElectiveCount: resolvedYear4ElectiveCodes.length
    });

    const [
      year3Modules,
      year4CompulsoryModules,
      year4ElectiveModules
    ] = await Promise.all([
      fetchModulesByCodes(year3Codes, 3),
      fetchModulesByCodes(resolvedYear4CompulsoryCodes, 4),
      fetchModulesByCodes(resolvedYear4ElectiveCodes, 4)
    ]);

    const combinedYear4Modules = [
      ...year4CompulsoryModules,
      ...year4ElectiveModules
    ];

    res.json({
      year3Modules,
      year4Modules: combinedYear4Modules,
      year4CompulsoryModules,
      year4ElectiveModules
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new specialization document
router.post('/', async (req, res, next) => {
  try {
    const payload = sanitizeSpecializationPayload(req.body);
    const specDoc = await Specialization.create(payload);
    res.status(201).json(specDoc);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
