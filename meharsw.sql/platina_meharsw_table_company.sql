
-- --------------------------------------------------------

--
-- Table structure for table `company`
--

CREATE TABLE `company` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `service_charge_value` varchar(255) NOT NULL,
  `vat_charge_value` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `corporate_address` varchar(222) NOT NULL,
  `gst_no` varchar(222) NOT NULL,
  `pan_no` varchar(222) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(222) NOT NULL,
  `bank_name` varchar(222) NOT NULL,
  `account_number` varchar(222) NOT NULL,
  `ifsc_code` varchar(222) NOT NULL,
  `account_name` varchar(222) NOT NULL,
  `country` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `currency` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `company`
--

INSERT INTO `company` (`id`, `company_name`, `service_charge_value`, `vat_charge_value`, `address`, `corporate_address`, `gst_no`, `pan_no`, `phone`, `email`, `bank_name`, `account_number`, `ifsc_code`, `account_name`, `country`, `message`, `currency`) VALUES
(1, 'mehar advisory', '', '', 'OFFICE NO. 6 A , 608, 609, 610 ,NEW SANGANER ROAD, SODALA,Jaipur, 302019', 'OFFICE NO. 6 A , 608, 609, 610 ,NEW SANGANER ROAD, SODALA,Jaipur, 302019', ' 08AAKCG3427A1ZX', 'AAKCG3427A', '9829282567 ', 'geduconnect@gmail.com', 'HDFC Bank Ltd', '5020008065214222', 'HDF00051872', 'meharadvisory', 'india', 'hello everyone on', 'INR');
