
-- --------------------------------------------------------

--
-- Table structure for table `customers_remark`
--

CREATE TABLE `customers_remark` (
  `iRemarkId` int(11) NOT NULL,
  `iCustomerId` int(11) NOT NULL,
  `remark` text NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `customers_remark`
--

INSERT INTO `customers_remark` (`iRemarkId`, `iCustomerId`, `remark`, `date`) VALUES
(1, 1, 'test', '2024-12-25 03:30:04'),
(2, 1, 'test', '2024-12-25 03:32:59'),
(3, 1, 'test', '2024-12-25 03:33:58'),
(4, 4, 'Pending', '2025-01-17 02:24:44'),
(5, 602, 'ok', '2025-06-13 01:16:58'),
(6, 1369, 'Kotak Mahindra NOC received', '2025-10-06 22:49:40'),
(7, 1377, 'Axis NOC pending ,Receive in     8-10 days', '2025-10-06 22:51:32'),
(8, 1367, 'TVS account close today', '2025-10-06 22:55:44'),
(9, 1363, 'RTO  RECIPT RCEIVED , APPLICATION PENDING', '2025-10-06 22:56:50'),
(10, 1362, 'HDFC ACCOUNT CLOSED TODAY', '2025-10-06 22:57:32'),
(11, 1351, 'DONE', '2025-10-06 22:58:19'),
(12, 1608, 'CREDIT APPROVAL PENDING', '2025-12-25 23:20:22'),
(13, 1609, 'CREDIT APPROVAL PENDING', '2025-12-25 23:26:54');
