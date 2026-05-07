
-- --------------------------------------------------------

--
-- Table structure for table `schemes_payout`
--

CREATE TABLE `schemes_payout` (
  `id` int(11) NOT NULL,
  `loan_number` varchar(222) NOT NULL,
  `dsa_code` varchar(222) NOT NULL,
  `scheme_type` varchar(222) NOT NULL,
  `scheme_name` varchar(222) NOT NULL,
  `financier_name` varchar(222) NOT NULL,
  `actucal_loan_amount` varchar(222) NOT NULL,
  `payout_perc` varchar(222) NOT NULL,
  `payout_amount` varchar(222) NOT NULL,
  `total_emi` varchar(222) NOT NULL,
  `create_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `schemes_payout`
--

INSERT INTO `schemes_payout` (`id`, `loan_number`, `dsa_code`, `scheme_type`, `scheme_name`, `financier_name`, `actucal_loan_amount`, `payout_perc`, `payout_amount`, `total_emi`, `create_date`) VALUES
(1, '1011', '247', 'Schemes 2', 'Gold Scheme', 'Kogta Financial', '244278', '2', '4885.56', '18', '2026-01-05 04:30:35');
