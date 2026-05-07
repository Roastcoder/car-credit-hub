
--
-- Indexes for dumped tables
--

--
-- Indexes for table `associates`
--
ALTER TABLE `associates`
  ADD PRIMARY KEY (`iAssociatesId`);

--
-- Indexes for table `award`
--
ALTER TABLE `award`
  ADD PRIMARY KEY (`iAwardId`);

--
-- Indexes for table `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`iCustomerId`);

--
-- Indexes for table `customers_remark`
--
ALTER TABLE `customers_remark`
  ADD PRIMARY KEY (`iRemarkId`);

--
-- Indexes for table `dsa`
--
ALTER TABLE `dsa`
  ADD PRIMARY KEY (`iDsaId`),
  ADD KEY `iDsaId` (`iDsaId`);

--
-- Indexes for table `dsa_payout`
--
ALTER TABLE `dsa_payout`
  ADD PRIMARY KEY (`iDsapayoutId`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`iEmployeeId`);

--
-- Indexes for table `financier`
--
ALTER TABLE `financier`
  ADD PRIMARY KEY (`iFinancierId`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave`
--
ALTER TABLE `leave`
  ADD PRIMARY KEY (`iLeaveId`);

--
-- Indexes for table `loanfile`
--
ALTER TABLE `loanfile`
  ADD PRIMARY KEY (`iLoanId`),
  ADD KEY `iLoanId` (`iLoanId`),
  ADD KEY `loanfile_no` (`loanfile_no`),
  ADD KEY `loan_number` (`loan_number`),
  ADD KEY `product_name` (`product_name`),
  ADD KEY `customer_name` (`customer_name`);

--
-- Indexes for table `pdd`
--
ALTER TABLE `pdd`
  ADD PRIMARY KEY (`ipddId`);

--
-- Indexes for table `pdd_remark`
--
ALTER TABLE `pdd_remark`
  ADD PRIMARY KEY (`ipRemarkId`);

--
-- Indexes for table `salary_advance`
--
ALTER TABLE `salary_advance`
  ADD PRIMARY KEY (`isAdvanceId`);

--
-- Indexes for table `schemes`
--
ALTER TABLE `schemes`
  ADD PRIMARY KEY (`iSchemesId`);

--
-- Indexes for table `schemes_payout`
--
ALTER TABLE `schemes_payout`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `user_group`
--
ALTER TABLE `user_group`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `associates`
--
ALTER TABLE `associates`
  MODIFY `iAssociatesId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `award`
--
ALTER TABLE `award`
  MODIFY `iAwardId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `iCustomerId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2044;

--
-- AUTO_INCREMENT for table `customers_remark`
--
ALTER TABLE `customers_remark`
  MODIFY `iRemarkId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `dsa`
--
ALTER TABLE `dsa`
  MODIFY `iDsaId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=388;

--
-- AUTO_INCREMENT for table `dsa_payout`
--
ALTER TABLE `dsa_payout`
  MODIFY `iDsapayoutId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2022;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `iEmployeeId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=134;

--
-- AUTO_INCREMENT for table `financier`
--
ALTER TABLE `financier`
  MODIFY `iFinancierId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `leave`
--
ALTER TABLE `leave`
  MODIFY `iLeaveId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `loanfile`
--
ALTER TABLE `loanfile`
  MODIFY `iLoanId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1734;

--
-- AUTO_INCREMENT for table `pdd`
--
ALTER TABLE `pdd`
  MODIFY `ipddId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1618;

--
-- AUTO_INCREMENT for table `pdd_remark`
--
ALTER TABLE `pdd_remark`
  MODIFY `ipRemarkId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=156;

--
-- AUTO_INCREMENT for table `salary_advance`
--
ALTER TABLE `salary_advance`
  MODIFY `isAdvanceId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `schemes`
--
ALTER TABLE `schemes`
  MODIFY `iSchemesId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `schemes_payout`
--
ALTER TABLE `schemes_payout`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=667;

--
-- AUTO_INCREMENT for table `user_group`
--
ALTER TABLE `user_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=689;
