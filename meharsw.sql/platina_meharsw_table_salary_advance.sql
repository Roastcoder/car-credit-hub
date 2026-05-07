
-- --------------------------------------------------------

--
-- Table structure for table `salary_advance`
--

CREATE TABLE `salary_advance` (
  `isAdvanceId` int(11) NOT NULL,
  `employee_code` varchar(222) NOT NULL,
  `amount` int(11) NOT NULL,
  `reason` varchar(222) NOT NULL,
  `month` varchar(222) NOT NULL,
  `year` int(11) NOT NULL,
  `month_year` varchar(222) NOT NULL,
  `advance_date` date NOT NULL,
  `create_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
