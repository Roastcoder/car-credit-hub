
-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `permission` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `group_name`, `permission`) VALUES
(1, 'Administrator', 'a:47:{i:0;s:10:\"createUser\";i:1;s:10:\"updateUser\";i:2;s:8:\"viewUser\";i:3;s:10:\"deleteUser\";i:4;s:11:\"createGroup\";i:5;s:11:\"updateGroup\";i:6;s:9:\"viewGroup\";i:7;s:11:\"deleteGroup\";i:8;s:16:\"createAssociates\";i:9;s:16:\"updateAssociates\";i:10;s:14:\"viewAssociates\";i:11;s:16:\"deleteAssociates\";i:12;s:9:\"createDsa\";i:13;s:9:\"updateDsa\";i:14;s:7:\"viewDsa\";i:15;s:9:\"deleteDsa\";i:16;s:15:\"createDsapayout\";i:17;s:15:\"updateDsapayout\";i:18;s:13:\"viewDsapayout\";i:19;s:15:\"deleteDsapayout\";i:20;s:9:\"createPDD\";i:21;s:9:\"updatePDD\";i:22;s:7:\"viewPDD\";i:23;s:9:\"deletePDD\";i:24;s:13:\"createSchemes\";i:25;s:13:\"updateSchemes\";i:26;s:11:\"viewSchemes\";i:27;s:13:\"deleteSchemes\";i:28;s:14:\"createCustomer\";i:29;s:14:\"updateCustomer\";i:30;s:12:\"viewCustomer\";i:31;s:14:\"deleteCustomer\";i:32;s:14:\"createEmployee\";i:33;s:14:\"updateEmployee\";i:34;s:12:\"viewEmployee\";i:35;s:14:\"deleteEmployee\";i:36;s:14:\"createLoanfile\";i:37;s:14:\"updateLoanfile\";i:38;s:12:\"viewLoanfile\";i:39;s:14:\"deleteLoanfile\";i:40;s:15:\"createFinancier\";i:41;s:15:\"updateFinancier\";i:42;s:13:\"viewFinancier\";i:43;s:15:\"deleteFinancier\";i:44;s:13:\"updateCompany\";i:45;s:11:\"viewProfile\";i:46;s:13:\"updateSetting\";}'),
(6, ' Center', 'a:10:{i:0;s:9:\"createPDD\";i:1;s:9:\"updatePDD\";i:2;s:7:\"viewPDD\";i:3;s:14:\"createCustomer\";i:4;s:14:\"updateCustomer\";i:5;s:12:\"viewCustomer\";i:6;s:14:\"createLoanfile\";i:7;s:14:\"updateLoanfile\";i:8;s:12:\"viewLoanfile\";i:9;s:13:\"updateCompany\";}'),
(10, 'Dsa', 'a:4:{i:0;s:7:\"viewDsa\";i:1;s:13:\"viewDsapayout\";i:2;s:11:\"viewProfile\";i:3;s:13:\"updateSetting\";}'),
(14, 'HR ', 'a:4:{i:0;s:14:\"createEmployee\";i:1;s:14:\"updateEmployee\";i:2;s:12:\"viewEmployee\";i:3;s:14:\"deleteEmployee\";}'),
(15, 'Manager', 'a:11:{i:0;s:9:\"createPDD\";i:1;s:9:\"updatePDD\";i:2;s:7:\"viewPDD\";i:3;s:14:\"createCustomer\";i:4;s:14:\"updateCustomer\";i:5;s:12:\"viewCustomer\";i:6;s:14:\"deleteCustomer\";i:7;s:14:\"createLoanfile\";i:8;s:14:\"updateLoanfile\";i:9;s:12:\"viewLoanfile\";i:10;s:14:\"deleteLoanfile\";}'),
(16, 'DSA Payout ', 'a:10:{i:0;s:10:\"createUser\";i:1;s:10:\"updateUser\";i:2;s:8:\"viewUser\";i:3;s:9:\"createDsa\";i:4;s:9:\"updateDsa\";i:5;s:7:\"viewDsa\";i:6;s:9:\"deleteDsa\";i:7;s:15:\"createDsapayout\";i:8;s:15:\"updateDsapayout\";i:9;s:13:\"viewDsapayout\";}'),
(17, 'PDD', 'a:6:{i:0;s:9:\"createPDD\";i:1;s:9:\"updatePDD\";i:2;s:7:\"viewPDD\";i:3;s:9:\"deletePDD\";i:4;s:11:\"viewProfile\";i:5;s:13:\"updateSetting\";}');
