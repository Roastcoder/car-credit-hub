
-- --------------------------------------------------------

--
-- Table structure for table `award`
--

CREATE TABLE `award` (
  `iAwardId` int(11) NOT NULL,
  `employee_code` varchar(222) NOT NULL,
  `award_name` varchar(222) NOT NULL,
  `gift_item` varchar(222) NOT NULL,
  `award_date` date NOT NULL,
  `award_description` varchar(555) NOT NULL,
  `award_by` varchar(222) NOT NULL,
  `create_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `award`
--

INSERT INTO `award` (`iAwardId`, `employee_code`, `award_name`, `gift_item`, `award_date`, `award_description`, `award_by`, `create_date`) VALUES
(1, 'EMEH/2025/00002', 'dsdsds', 'klklk', '2025-03-21', 'jkjkjk', 'sdsds', '2025-03-21 19:08:41');
