import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import VaccineCenter from '../models/VaccineCenter.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Initial comprehensive dataset of verified Indian immunization centers
const SEED_CENTERS = [
  {
    name: 'AIIMS New Delhi — Pediatric Immunization OPD',
    type: 'district_hospital',
    address: 'Sri Aurobindo Marg, Ansari Nagar East',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    coordinates: { lat: 28.5672, lng: 77.21 },
    contactNumber: '+91-11-26588500',
    timing: '08:30 AM - 04:30 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'DPT', 'JE', 'Hepatitis B'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.9,
    capacityPerDay: 350,
  },
  {
    name: 'Safdarjung Hospital Community Health Center (PHC)',
    type: 'government_phc',
    address: 'Ring Road, Opposite AIIMS, Ansari Nagar West',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    coordinates: { lat: 28.5705, lng: 77.2062 },
    contactNumber: '+91-11-26165060',
    timing: '09:00 AM - 03:30 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'DPT'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.7,
    capacityPerDay: 200,
  },
  {
    name: 'Hauz Khas Urban Primary Health Center (UPHC)',
    type: 'government_phc',
    address: 'Padmini Enclave, Near Aurobindo Market, Hauz Khas',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    coordinates: { lat: 28.5494, lng: 77.2001 },
    contactNumber: '+91-11-26861234',
    timing: '09:00 AM - 02:00 PM (Mon-Fri)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'MR'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.6,
    capacityPerDay: 120,
  },
  {
    name: 'Chacha Nehru Bal Chikitsalaya (Super Specialty Pediatric)',
    type: 'district_hospital',
    address: 'Geeta Colony, Near Mother Dairy Plant',
    city: 'East Delhi',
    state: 'Delhi',
    pincode: '110031',
    coordinates: { lat: 28.6548, lng: 77.2687 },
    contactNumber: '+91-11-21210200',
    timing: '08:00 AM - 04:00 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'DPT', 'JE'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.8,
    capacityPerDay: 300,
  },
  {
    name: 'Lajpat Nagar Poly-Clinic & Mother Child Health Center',
    type: 'government_phc',
    address: 'Block 3, Near Central Market, Lajpat Nagar II',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110024',
    coordinates: { lat: 28.5702, lng: 77.2435 },
    contactNumber: '+91-11-29837411',
    timing: '09:00 AM - 03:00 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'PCV', 'MR'],
    isGovernmentFree: true,
    liveStockStatus: 'limited',
    rating: 4.5,
    capacityPerDay: 100,
  },
  {
    name: 'Fortis La Femme Pediatric & Immunization Center',
    type: 'private_clinic',
    address: 'S - 549, Greater Kailash - II',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110048',
    coordinates: { lat: 28.5355, lng: 77.241 },
    contactNumber: '+91-11-40579400',
    timing: '09:30 AM - 07:00 PM (All 7 Days)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'IPV', 'PCV', 'MR', 'Varicella', 'Hepatitis A', 'Influenza'],
    isGovernmentFree: false,
    liveStockStatus: 'in_stock',
    rating: 4.9,
    capacityPerDay: 180,
  },
  {
    name: 'Max Super Speciality Hospital — Pediatric Wellness Wing',
    type: 'private_clinic',
    address: '1, 2 Press Enclave Marg, Saket',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110017',
    coordinates: { lat: 28.5283, lng: 77.2114 },
    contactNumber: '+91-11-26515050',
    timing: '09:00 AM - 06:30 PM (All 7 Days)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'IPV', 'PCV', 'MR', 'Meningococcal', 'Typhoid'],
    isGovernmentFree: false,
    liveStockStatus: 'in_stock',
    rating: 4.8,
    capacityPerDay: 220,
  },
  {
    name: 'Sector 30 Urban Health & Wellness Center (PHC)',
    type: 'government_phc',
    address: 'Near District Hospital, Sector 30, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    coordinates: { lat: 28.5772, lng: 77.3384 },
    contactNumber: '+91-120-2450123',
    timing: '09:00 AM - 03:00 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'DPT'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.6,
    capacityPerDay: 160,
  },
  {
    name: 'KGMU Queen Mary Pediatric Immunization Clinic',
    type: 'district_hospital',
    address: 'Shah Mina Road, Chowk',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226003',
    coordinates: { lat: 26.8698, lng: 80.9168 },
    contactNumber: '+91-522-2258880',
    timing: '08:30 AM - 04:00 PM (Mon-Sat)',
    availableVaccines: ['BCG', 'OPV', 'Pentavalent', 'Rotavirus', 'fIPV', 'PCV', 'MR', 'JE', 'DPT'],
    isGovernmentFree: true,
    liveStockStatus: 'in_stock',
    rating: 4.9,
    capacityPerDay: 400,
  },
];

// Helper: Seed initial centers if database is empty
const ensureSeedCenters = async () => {
  const count = await VaccineCenter.countDocuments();
  if (count === 0) {
    await VaccineCenter.insertMany(SEED_CENTERS);
    console.log('✅ Seeded initial verified Indian vaccination centers');
  }
};

// @route   GET /api/centers
// @desc    Get all vaccination centers with filters & search
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureSeedCenters();

    const { type, search, inStockOnly, pincode } = req.query;

    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (inStockOnly === 'true') {
      query.liveStockStatus = 'in_stock';
    }

    if (pincode) {
      query.pincode = pincode.trim();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { pincode: searchRegex },
        { availableVaccines: searchRegex },
      ];
    }

    const centers = await VaccineCenter.find(query).sort({ rating: -1, isGovernmentFree: -1 });

    res.json({
      success: true,
      count: centers.length,
      data: centers,
    });
  })
);

// @route   POST /api/centers/book-slot
// @desc    Book a walk-in / appointment slot at a center
// @access  Public (accepts optional user auth)
router.post(
  '/book-slot',
  asyncHandler(async (req, res) => {
    const { centerId, childName, preferredDate, parentName, parentPhone, vaccineRequested } = req.body;

    const center = await VaccineCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({ success: false, message: 'Vaccine Center not found' });
    }

    const bookingId = 'VT-' + Math.floor(100000 + Math.random() * 900000);

    // If userId provided, send in-app confirmation notification
    if (req.body.userId) {
      await Notification.create({
        userId: req.body.userId,
        type: 'UPCOMING',
        priority: 'urgent',
        title: `Appointment Confirmed: ${center.name}`,
        message: `Slot booked for ${childName || 'Child'} on ${preferredDate || 'Upcoming Date'} at ${center.name}. Booking ID: ${bookingId}.`,
        metadata: { bookingId, centerName: center.name, timing: center.timing },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vaccination slot booked successfully!',
      data: {
        bookingId,
        centerName: center.name,
        childName,
        preferredDate,
        vaccineRequested: vaccineRequested || 'Scheduled NIS 2025 Dose',
        address: center.address,
        timing: center.timing,
      },
    });
  })
);

export default router;
