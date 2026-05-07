
-- --------------------------------------------------------

--
-- Table structure for table `associates`
--

CREATE TABLE `associates` (
  `iAssociatesId` int(11) NOT NULL,
  `name` varchar(222) NOT NULL,
  `contact_person` varchar(222) NOT NULL,
  `associates_code` varchar(222) NOT NULL,
  `email` varchar(222) NOT NULL,
  `phone` varchar(222) NOT NULL,
  `address` varchar(222) NOT NULL,
  `account_name` varchar(222) NOT NULL,
  `bank_name` varchar(222) NOT NULL,
  `account_number` varchar(222) NOT NULL,
  `ifsc_code` varchar(222) NOT NULL,
  `pan_number` varchar(222) NOT NULL,
  `username` varchar(222) NOT NULL,
  `password` varchar(222) NOT NULL,
  `active` varchar(222) NOT NULL,
  `date` datetime NOT NULL,
  `commission_password` varchar(222) NOT NULL,
  `invoice_number` varchar(222) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `associates`
--

INSERT INTO `associates` (`iAssociatesId`, `name`, `contact_person`, `associates_code`, `email`, `phone`, `address`, `account_name`, `bank_name`, `account_number`, `ifsc_code`, `pan_number`, `username`, `password`, `active`, `date`, `commission_password`, `invoice_number`) VALUES
(3, 'Jaipur', 'Jagdish Prasad Yadav', '01', 'jagdish.yadav@meharadvisory.com', '734 001 7519', '608, 609, 610, okay plus,Opposite Palika Bazar, Swej Farm Road, Sodala, Jaipur', '', '', '', '', '', 'jagdish.yadav@meharadvisory.com', '$2y$10$x5mOCnMeEpzdnHVJyOdf3.Fto.ngMmBwQmZmswUGUxYe.jqCG8u4O', '1', '2025-03-20 14:22:29', '', ''),
(4, 'Hanumangarh', 'raj kumar swami', '02', 'rajkumar@meharadvisory.com', '88756 09000', 'Hanumangarh junction near bus stand, near chandigarh hospital, hanumangarh, Rajasthan- 335512 ', '', '', '', '', '', 'rajkumar@meharadvisory.com', '$2y$10$NmeIZ/b8.iaZYdj54AHu5.7j25clAXKc86Vi3kKyY9Qme.rs./keO', '1', '2025-03-20 14:39:15', '', ''),
(5, 'Bikaner', 'Mohammed Farukh', '03', 'bikaner@meharadvisory.com', '99288 14338', '1st floor, Rahtore travels building, Deen Dayal circle, Bikaner, Rajasthan- 334001', '', '', '', '', '', 'bikaner@meharadvisory.com', '$2y$10$d4lnMdGCupy5GCX4BJSVkeKFEnbvKD27/S./4OHXQh8dKDmOlwKv6', '1', '2025-03-20 14:41:42', '', ''),
(6, 'Sri Ganganagar', 'Sunil Kumar Godara', '04', 'sunil@meharadvisory.com', '63758 05940', 'Shop no. 6, First floor shiv ganesh market, shiv chowk, Sri Ganganagar, Rajasthan - 335001', '', '', '', '', '', 'sunil@meharadvisory.com', '$2y$10$K1Me5aFoGW1bXKTJ.aSNFuCgN6grdzo.VxwiHjjiTok5eMSAxZeo2', '1', '2025-03-20 14:43:32', '', ''),
(7, 'Lunkaransar', 'Ashok ', '05', 'ashok@meharadvisory.com', ' 8949450173', 'Rojha choraha, mahaveer market, near railway crossing, Lunkaransar', '', '', '', '', '', 'ashok@meharadvisory.com', '$2y$10$CTIFqog4F7LxdPDQDJsaJeySTpXtvZbHosgWw82YP9BmcglXfV7z2', '1', '2025-03-27 11:17:41', '', ''),
(8, 'Merta City', 'Ram Prakash', '06', 'ramprakash@meharadvisory.com', '9664133734', 'Merta City, Nagaur', '', '', '', '', '', 'ramprakash@meharadvisory.com', '$2y$10$ZCia2LYf.PH3O6N5OJo6SeeiDBq7.NVVA/jniPYwnjdDmBm0.0i/O', '1', '2025-05-28 15:50:46', '', ''),
(9, 'Hanumangarh 2', 'Raj Kumar', '07', 'rajkumar2@meharadvisory.com', '09001094582', 'Hanumangarh  ', '', '', '', '', '', 'rajkumar2@meharadvisory.com', '$2y$10$sdBXbDn.EUVAabaAFmdDoeA0cTVDVqQWJoiZEbrk6AFSqUMwN2ksu', '1', '2025-06-28 11:20:38', '', ''),
(11, 'Nohar', 'Vikaram ', '08', 'sales@meharadvisory.com', '9001094583', 'Nohar', '', '', '', '', '', 'sales@meharadvisory.com', '$2y$10$c9DqINBtKQaz8b4kgpQjmepG8OV2qTnqgWTQMaNnPgq9gSymiPAT6', '1', '2025-09-10 15:08:23', '', ''),
(12, 'Sardarshahar', 'Pawan Sharma', '09', 'pawansharma@meharadvisory.com', '9887100900', 'Sardarshahar', '', '', '', '', '', 'pawansharma@meharadvisory.com', '$2y$10$6.Aw58zN/XIozg3FcIT8nuslqLrvoQAxmfpEnTgNqedZ/xh0njCYO', '1', '2026-02-06 13:23:18', '', '');
