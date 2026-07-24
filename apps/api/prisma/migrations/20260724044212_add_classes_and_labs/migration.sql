-- AlterTable
ALTER TABLE `courses` ADD COLUMN `is_lab` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `rooms` ADD COLUMN `is_lab` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `timetable_slots` ADD COLUMN `class_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `class_id` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `classes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `department_id` INTEGER UNSIGNED NOT NULL,
    `home_room_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_class_dept`(`department_id`),
    INDEX `idx_class_homeroom`(`home_room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_slot_class` ON `timetable_slots`(`class_id`);

-- CreateIndex
CREATE INDEX `idx_user_class` ON `users`(`class_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_class_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_class_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_dept_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_homeroom_fk` FOREIGN KEY (`home_room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
