
-- --------------------------------------------------------

--
-- Table structure for table `leave`
--

CREATE TABLE `leave` (
  `iLeaveId` int(11) NOT NULL,
  `employee_code` varchar(222) NOT NULL,
  `leave_type` varchar(222) NOT NULL,
  `application_start_date` date NOT NULL,
  `application_end_date` date NOT NULL,
  `apply_date` varchar(222) NOT NULL,
  `approve_start_date` date NOT NULL,
  `approve_end_date` date NOT NULL,
  `approved_day` varchar(222) NOT NULL,
  `approved_by` varchar(222) NOT NULL,
  `reason` varchar(555) NOT NULL,
  `create_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `leave`
--

INSERT INTO `leave` (`iLeaveId`, `employee_code`, `leave_type`, `application_start_date`, `application_end_date`, `apply_date`, `approve_start_date`, `approve_end_date`, `approved_day`, `approved_by`, `reason`, `create_date`) VALUES
(1, 'EMEH/2025/00002', 'dsds', '2025-03-22', '2025-03-23', '2', '2025-03-23', '2025-03-23', '1', 'ss', 'sssdsdsd', '2025-03-22 12:59:54'),
(2, 'EMPMA0097', 'Casual Leave', '2025-07-04', '2025-07-04', 'NIL', '0000-00-00', '0000-00-00', 'NIL', 'NIL', 'HEALTH ISSUE', '2025-07-18 17:28:55'),
(3, 'EMPMA0141', 'Casual Leave', '2025-07-02', '2025-07-02', 'NIL', '0000-00-00', '0000-00-00', 'NIL', 'NIL', 'HEALTH', '2025-07-18 17:30:20'),
(4, 'EMPMA0107', 'Casual Leave', '2025-07-02', '2025-07-02', '2/7/2025', '0000-00-00', '0000-00-00', '2/7/2025', 'NIDHI GUPTA', 'NOT IDENTIFY', '2025-07-18 17:33:24'),
(5, 'EMPMA0107', 'Privilege Leave', '2025-07-12', '2025-07-12', '7-7-2025', '0000-00-00', '0000-00-00', '9-7-2025', 'NIDHI GUPTA', 'PERSONAL WORK', '2025-07-18 17:35:27');
