
-- --------------------------------------------------------

--
-- Table structure for table `financier`
--

CREATE TABLE `financier` (
  `iFinancierId` int(11) NOT NULL,
  `financier_name` varchar(222) NOT NULL,
  `active` int(11) NOT NULL DEFAULT 1,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `financier`
--

INSERT INTO `financier` (`iFinancierId`, `financier_name`, `active`, `date`) VALUES
(3, 'Kogta Financial', 1, '2025-07-16 18:04:43'),
(4, 'SK Finance', 1, '2025-07-16 18:04:52'),
(5, 'Cholamandalam Investment', 1, '2025-07-16 18:04:58'),
(7, 'ITI Finance', 1, '2025-07-16 18:05:10'),
(8, 'Singhi Finance', 1, '2025-07-16 18:05:15'),
(9, 'HDB Finance', 1, '2025-07-16 18:05:21'),
(10, 'MAS Finance', 1, '2025-07-16 18:05:30'),
(12, 'Status Leasing Finance', 1, '2025-07-16 18:05:45'),
(13, 'Sundram Finance', 1, '2025-07-16 18:05:51'),
(14, 'Kisan Finance', 1, '2025-07-16 18:05:56'),
(15, 'IKF Finance', 1, '2025-07-16 18:06:02'),
(16, 'MMFSL', 1, '2025-07-17 14:30:51'),
(17, 'AU Small Finance Bank', 1, '2025-07-17 14:31:18'),
(18, 'Ambit Finvest', 1, '2025-07-17 14:31:57'),
(19, 'Bajaj Finance', 1, '2025-07-17 14:33:28'),
(20, 'Tata Capital', 1, '2025-07-17 14:35:42'),
(21, 'Kotak Mahindra', 1, '2025-11-12 12:59:59'),
(22, 'Kamal Finserve', 1, '2025-12-04 11:55:38'),
(23, 'Pink City', 1, '2026-03-18 14:39:55');
