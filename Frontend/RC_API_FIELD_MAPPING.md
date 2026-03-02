# RC API Response to Form Field Mapping

## Auto-filled Fields from RC API Response

### Vehicle Details
| Form Field | RC API Source | Fallback Sources |
|------------|---------------|------------------|
| `vehicleNumber` | `rc_details.registration_number` | `raw_data.registration_number` |
| `makerName` | `rc_details.make` | `raw_data.maker`, `raw_data.maker_model` (first word) |
| `modelVariantName` | `rc_details.model` | `raw_data.model`, `raw_data.maker_model`, `raw_data.variant` |
| `mfgYear` | `rc_details.manufacturing_date` (year) | `raw_data.manufacturing_date`, `raw_data.registration_date` (year) |

### RC/RTO Details
| Form Field | RC API Source | Fallback Sources |
|------------|---------------|------------------|
| `rcOwnerName` | `raw_data.owner_name` | `rc_details.owner_name`, `raw_data.owner` |
| `rcMfgDate` | `rc_details.manufacturing_date` | `raw_data.manufacturing_date`, `raw_data.registration_date` |
| `rcExpiryDate` | `raw_data.rc_expiry_date` | `raw_data.fitness_upto`, `raw_data.tax_upto` |

### Customer Details (Auto-filled if empty)
| Form Field | RC API Source | Fallback Sources |
|------------|---------------|------------------|
| `customerName` | `raw_data.owner_name` | `rc_details.owner_name` |
| `currentAddress` | `raw_data.present_address` | `raw_data.permanent_address`, `raw_data.address` |
| `currentDistrict` | `raw_data.present_district` | `raw_data.district` |
| `currentPincode` | `raw_data.present_pincode` | `raw_data.pincode` |

### Loan Details
| Form Field | RC API Source | Fallback Sources |
|------------|---------------|------------------|
| `loanAmount` | `idv_calculation.fair_market_retail_value` | `idv_calculation.idv_value` |

## RC API Response Structure (Expected)

```json
{
  "success": true,
  "rc_details": {
    "registration_number": "RJ60SW9525",
    "make": "MARUTI SUZUKI",
    "model": "SWIFT VXI",
    "manufacturing_date": "2020-05-15",
    "owner_name": "John Doe",
    "raw_data": {
      "owner_name": "John Doe",
      "maker_model": "MARUTI SUZUKI SWIFT VXI",
      "maker": "MARUTI SUZUKI",
      "model": "SWIFT",
      "variant": "VXI",
      "registration_number": "RJ60SW9525",
      "registration_date": "2020-06-01",
      "manufacturing_date": "2020-05-15",
      "rc_expiry_date": "2035-06-01",
      "fitness_upto": "2035-06-01",
      "tax_upto": "2025-06-01",
      "present_address": "123 Main Street",
      "permanent_address": "123 Main Street",
      "address": "123 Main Street",
      "present_district": "Jaipur",
      "district": "Jaipur",
      "present_pincode": "302001",
      "pincode": "302001"
    }
  },
  "idv_calculation": {
    "fair_market_retail_value": 450000,
    "idv_value": 450000
  }
}
```

## Fields NOT Auto-filled (Manual Entry Required)

### Customer Details
- Mobile Number
- Co-Applicant Details
- Guarantor Details
- Village, Tehsil (if not in RC)

### Loan Details
- LTV
- Loan Type
- Vertical
- Scheme
- Income Source
- Monthly Income

### EMI Details
- IRR
- Tenure
- Processing Fee
- EMI Start/End Dates

### Financier Details
- Bank/Financier
- Broker
- Sanction Amount/Date

### Insurance Details
- All insurance fields

### RTO Details
- RTO Agent Name
- Agent Mobile
- HPN at Login
- New Financier
- RTO Docs Handover Date
- DTO Location
- RTO Work Description
- Challan/FC status

### Documents
- All document uploads

## Usage

When a user enters a vehicle registration number (minimum 8 characters), the system automatically:
1. Calls the RC API
2. Extracts available data
3. Auto-fills form fields
4. Shows success toast notification
5. Logs the full response to console for debugging

Check browser console to see the actual API response structure for your specific case.
