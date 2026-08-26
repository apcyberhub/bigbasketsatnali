import { Router } from 'express';
import { z } from 'zod';
import { AddressController } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(3, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required').default('Indore'),
  state: z.string().min(2, 'State is required').default('Madhya Pradesh'),
  postalCode: z.string().min(6, 'Postal code is required'),
  addressType: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  isDefault: z.boolean().optional(),
});

router.use(authenticate);

router.get('/', AddressController.getAddresses);
router.post('/', validate(addressSchema), AddressController.createAddress);
router.put('/:id', AddressController.updateAddress);
router.delete('/:id', AddressController.deleteAddress);
router.patch('/:id/default', AddressController.setDefaultAddress);

export default router;
