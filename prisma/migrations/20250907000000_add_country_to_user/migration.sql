-- AddCountryToUser migration
ALTER TABLE `users` ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'ID';
